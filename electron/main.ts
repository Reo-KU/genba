import { app, BrowserWindow, dialog, ipcMain } from "electron";
import fs from "fs-extra";
import { spawn as cpSpawn } from "node:child_process";
import { dirname, join } from "node:path";
import { z } from "zod";
import type {
  Agent,
  AgentHistoryEntry,
  AgentRunRequest,
  AgentRunResult,
  AgentSummary,
  Board,
  BoardsSnapshot,
  ProjectGroup,
  ProjectGroupsSnapshot,
  NotesSnapshot,
  OrganizationBrief,
  StickyNote,
  GraphEdge,
  GraphNode,
  IpcChannels,
  InstallResult,
  OrganizationSaveRequest,
  OrganizationSaveResult,
  PermissionDecision,
  Task
} from "../src/types";
import {
  AGENT_HISTORY_PATH,
  AGENTS_JSON_PATH,
  BOARDS_JSON_PATH,
  GROUPS_JSON_PATH,
  GRAPH_JSON_PATH,
  NOTES_JSON_PATH,
  PROJECT_SUMMARY_PATH,
  TASKS_JSON_PATH,
  WORKSPACE_ROOT
} from "../src/utils/storage";
import { maskSecrets } from "../src/utils/maskSecrets";
import { buildActiveOrganization, buildOrganizationInstruction } from "../src/utils/organization";
import { AgentRunner } from "./agentRunner";
import { ensureGuiPath } from "./env";
import { Installer } from "./installer";
import { MCPPermissionServer } from "./mcpPermissionServer";
import { createShellTestAgent, PtyManager } from "./ptyManager";
import { runSetupCheck } from "./systemCheck";
import { TmuxManager } from "./tmuxManager";
import { ensureMaoGitignore } from "./workspaceGuard";

const agentSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["claude", "codex", "grok", "gemini", "custom"]),
  mode: z.enum(["exec", "interactive"]).optional().default("interactive"),
  permissionPolicy: z.enum(["ask", "safe-auto", "yolo"]).optional().default("safe-auto"),
  command: z.string(),
  args: z.array(z.string()).optional(),
  workingDirectory: z.string(),
  role: z.string(),
  systemPrompt: z.string(),
  skillsDirectory: z.string().optional(),
  skillNames: z.array(z.string()).optional(),
  obsidianVaultPath: z.string().optional(),
  obsidianNotesSubdir: z.string().optional(),
  status: z.enum(["stopped", "starting", "running", "error"])
}) satisfies z.ZodType<Agent>;

const graphNodeSchema = z.object({
  id: z.string(),
  agentId: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number()
  }),
  isRoot: z.boolean(),
  boardId: z.string().optional(),
  groupId: z.string().nullable().optional()
}) satisfies z.ZodType<GraphNode>;

const graphEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string()
}) satisfies z.ZodType<GraphEdge>;

const graphSchema = z.object({
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema)
});

const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  rootAgentId: z.string(),
  status: z.enum(["pending", "running", "completed", "failed"]),
  createdAt: z.string(),
  updatedAt: z.string()
}) satisfies z.ZodType<Task>;

const agentsSchema = z.array(agentSchema);
const tasksSchema = z.array(taskSchema);

const stickyNoteSchema = z.object({
  id: z.string(),
  text: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  status: z.enum(["idle", "running", "done", "error"]),
  assignedAgentId: z.string().optional(),
  resultText: z.string().optional(),
  resultError: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  boardId: z.string().optional()
}) satisfies z.ZodType<StickyNote>;

const notesSnapshotSchema = z.object({ notes: z.array(stickyNoteSchema) });

const boardSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string()
}) satisfies z.ZodType<Board>;

const boardsSnapshotSchema = z.object({
  boards: z.array(boardSchema),
  activeBoardId: z.string().nullable()
}) satisfies z.ZodType<BoardsSnapshot>;

const defaultBoardsSnapshot = (): BoardsSnapshot => ({
  boards: [{ id: "default", name: "Board 1", createdAt: new Date().toISOString() }],
  activeBoardId: "default"
});

const projectGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  folderPath: z.string(),
  // v8 (包含ネストモデル) 以降のキャッシュ値。無くても buildTerritoryTree から再導出できるので
  // 省略可能 (旧データとの後方互換)。
  parentGroupId: z.union([z.string(), z.null()]).optional(),
  position: z.object({ x: z.number(), y: z.number() }),
  size: z.object({ width: z.number(), height: z.number() }),
  createdAt: z.string()
}) satisfies z.ZodType<ProjectGroup>;

const groupsSnapshotSchema = z.object({
  groups: z.array(projectGroupSchema)
}) satisfies z.ZodType<ProjectGroupsSnapshot>;

const defaultGroupsSnapshot = (): ProjectGroupsSnapshot => ({ groups: [] });

// Finder 起動 (ダブルクリック) でも tmux / 各 CLI が見つかるよう、何かを spawn する前に
// ログインシェルの PATH を process.env に反映する (dev のターミナル起動では実質 no-op)。
// 2回目以降の起動はキャッシュで即適用し、シェルの同期起動 (最大3秒) をスキップする。
ensureGuiPath(join(app.getPath("userData"), "path-cache.json"));

const ptyManager = new PtyManager();
const tmuxManager = new TmuxManager();
const installer = new Installer();
const agentRunner = new AgentRunner();
agentRunner.setPtyManager(tmuxManager);
const mcpPermissionServer = new MCPPermissionServer();
const PLANNER_AGENT_ID = "__mao_org_planner__";
let didRunSmokeTest = false;
const writeLocks = new Map<string, Promise<void>>();

const ensureJsonFile = async <T>(path: string, fallback: T): Promise<void> => {
  if (!(await fs.pathExists(path))) {
    await fs.writeJson(path, fallback, { spaces: 2 });
  }
};

const readValidatedJson = async <T>(path: string, schema: z.ZodType<T>, fallback: T): Promise<T> => {
  try {
    await ensureJsonFile(path, fallback);
    const raw = await fs.readJson(path);
    const parsed = schema.safeParse(raw);

    if (parsed.success) {
      return parsed.data;
    }
  } catch (error) {
    console.warn(`[main] Failed to read JSON ${path}:`, error);
  }

  await fs.writeJson(path, fallback, { spaces: 2 });
  return fallback;
};

const writeJsonUnlocked = async <T>(path: string, value: T): Promise<void> => {
  await fs.ensureDir(WORKSPACE_ROOT);
  await fs.writeJson(path, value, { spaces: 2 });
};

const withFileLock = async <T>(path: string, operation: () => Promise<T>): Promise<T> => {
  const previous = writeLocks.get(path) ?? Promise.resolve();
  const next = previous.then(operation);
  writeLocks.set(
    path,
    next.then(
      () => undefined,
      () => undefined
    )
  );
  return next;
};

const serializedWriteJson = async <T>(path: string, value: T): Promise<void> =>
  withFileLock(path, () => writeJsonUnlocked(path, value));

const initializeStorage = async (): Promise<void> => {
  await fs.ensureDir(WORKSPACE_ROOT);
  await ensureJsonFile(AGENTS_JSON_PATH, []);
  await ensureJsonFile(GRAPH_JSON_PATH, { nodes: [], edges: [] });
  await ensureJsonFile(TASKS_JSON_PATH, []);
  await ensureJsonFile(AGENT_HISTORY_PATH, {});
  await ensureJsonFile(BOARDS_JSON_PATH, defaultBoardsSnapshot());
  await ensureJsonFile(GROUPS_JSON_PATH, defaultGroupsSnapshot());

  if (!(await fs.pathExists(PROJECT_SUMMARY_PATH))) {
    await fs.writeFile(
      PROJECT_SUMMARY_PATH,
      "# Project Summary\n\n(Describe the workspace here. This is injected at the top of every agent prompt.)\n",
      "utf8"
    );
  }

  await readValidatedJson(AGENTS_JSON_PATH, agentsSchema, []);
  await readValidatedJson(GRAPH_JSON_PATH, graphSchema, { nodes: [], edges: [] });
  await readValidatedJson(TASKS_JSON_PATH, tasksSchema, []);
  await readValidatedJson(BOARDS_JSON_PATH, boardsSnapshotSchema, defaultBoardsSnapshot());
  await readValidatedJson(GROUPS_JSON_PATH, groupsSnapshotSchema, defaultGroupsSnapshot());
};

const readAgents = (): Promise<Agent[]> => readValidatedJson(AGENTS_JSON_PATH, agentsSchema, []);
const readGraph = (): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> =>
  readValidatedJson(GRAPH_JSON_PATH, graphSchema, { nodes: [], edges: [] });
const readTasks = (): Promise<Task[]> => readValidatedJson(TASKS_JSON_PATH, tasksSchema, []);
const readBoards = (): Promise<BoardsSnapshot> =>
  readValidatedJson(BOARDS_JSON_PATH, boardsSnapshotSchema, defaultBoardsSnapshot());
const readGroups = (): Promise<ProjectGroupsSnapshot> =>
  readValidatedJson(GROUPS_JSON_PATH, groupsSnapshotSchema, defaultGroupsSnapshot());

const extractJsonArray = (value: string): unknown => {
  const trimmed = value.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("[");
    const end = trimmed.lastIndexOf("]");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("Planner output did not contain a JSON array.");
  }
};

const briefSchema = z.object({
  agentId: z.string(),
  content: z.string()
});

const broadcastPlannerData = (data: string): void => {
  const maskedData = maskSecrets(data);
  for (const browserWindow of BrowserWindow.getAllWindows()) {
    browserWindow.webContents.send("mao:pty:data", { agentId: PLANNER_AGENT_ID, data: maskedData });
  }
};

const broadcastPlannerStatus = (status: Agent["status"]): void => {
  for (const browserWindow of BrowserWindow.getAllWindows()) {
    browserWindow.webContents.send("mao:pty:status", { agentId: PLANNER_AGENT_ID, status });
  }
};

const createPlannerCliAgent = (): Agent => ({
  id: PLANNER_AGENT_ID,
  name: "Org Planner",
  type: "claude",
  mode: "interactive",
  permissionPolicy: "safe-auto",
  command: "claude",
  args: [],
  workingDirectory: WORKSPACE_ROOT,
  role: "Organization planner",
  systemPrompt: "",
  status: "stopped"
});

const safeMarkdownName = (value: string): string =>
  (value || "untitled")
    .replace(/[\\/:*?"<>|#^\[\]]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80);

const obsidianSubdir = (agent: Agent): string =>
  (agent.obsidianNotesSubdir?.trim() || "MAO")
    .split(/[\\/]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== "." && part !== "..")
    .join("/");

const getObsidianRoot = (agent: Agent): string | null => {
  const vaultPath = agent.obsidianVaultPath?.trim();
  if (!vaultPath) {
    return null;
  }
  return join(vaultPath, obsidianSubdir(agent));
};

const uniqueObsidianRoots = (agents: Agent[]): Array<{ root: string; agent: Agent }> => {
  const seen = new Set<string>();
  const roots: Array<{ root: string; agent: Agent }> = [];
  for (const agent of agents) {
    const root = getObsidianRoot(agent);
    if (!root || seen.has(root)) {
      continue;
    }
    seen.add(root);
    roots.push({ root, agent });
  }
  return roots;
};

const appendMarkdownSection = async (filePath: string, content: string): Promise<void> => {
  await fs.ensureDir(dirname(filePath));
  await fs.appendFile(filePath, `${content.trim()}\n\n`, "utf8");
};

const writeObsidianOrganizationMemory = async (
  request: OrganizationSaveRequest,
  organization: ReturnType<typeof buildActiveOrganization>,
  briefs: OrganizationBrief[]
): Promise<void> => {
  const agentsById = new Map(request.agents.map((agent) => [agent.id, agent]));
  const activeAgents = organization.members
    .map((member) => agentsById.get(member.id))
    .filter((agent): agent is Agent => Boolean(agent));
  const roots = uniqueObsidianRoots(activeAgents);

  for (const { root } of roots) {
    await fs.ensureDir(root);
    await fs.ensureDir(join(root, "agents"));
    await fs.ensureDir(join(root, "tasks"));
    await fs.ensureDir(join(root, "decisions"));

    const orgLines = [
      "# MAO Organization",
      "",
      `Updated: ${organization.savedAt}`,
      "",
      "## Active board members",
      ...organization.members.map(
        (member) => `- [[agents/${safeMarkdownName(member.name)}|${member.name}]] - role: ${member.role || "unset"}`
      )
    ];
    await fs.writeFile(join(root, "organization.md"), `${orgLines.join("\n")}\n`, "utf8");

    for (const brief of briefs) {
      const agent = agentsById.get(brief.agentId);
      if (!agent) continue;
      const agentLines = [
        `# ${agent.name}`,
        "",
        `Agent ID: ${agent.id}`,
        `Role: ${agent.role || "unset"}`,
        `Command: ${agent.command}`,
        "",
        "## Organization Brief",
        brief.content,
        "",
        "## Working Memory",
        "- Add durable notes, preferences, recurring decisions, and handoff context here.",
        "- Link task notes from `../tasks/` when useful."
      ];
      await fs.writeFile(join(root, "agents", `${safeMarkdownName(agent.name)}.md`), `${agentLines.join("\n")}\n`, "utf8");
    }
  }
};

const writeObsidianTaskMemory = async (task: Task): Promise<void> => {
  const agents = await readAgents();
  // 単体実行モデル: このタスクを実行するのは task.rootAgentId (= 実行したエージェント) 1人だけなので、
  // その agent の Obsidian vault だけにタスクノートを書く。
  const executedAgent = agents.find((agent) => agent.id === task.rootAgentId);
  const root = executedAgent ? getObsidianRoot(executedAgent) : null;
  if (!root) return;

  await fs.ensureDir(join(root, "tasks"));
  const filePath = join(root, "tasks", `${safeMarkdownName(task.id)}.md`);
  const lines = [
    `# ${task.title || task.id}`,
    "",
    `Task ID: ${task.id}`,
    `Status: ${task.status}`,
    `Created: ${task.createdAt}`,
    `Executed by: ${executedAgent?.name ?? task.rootAgentId}`,
    "",
    "## Original Request",
    task.body,
    "",
    "## Timeline"
  ];
  await fs.writeFile(filePath, `${lines.join("\n")}\n`, "utf8");
};

const appendObsidianAgentResult = async (agentId: string, entry: AgentHistoryEntry): Promise<void> => {
  const agents = await readAgents();
  const agent = agents.find((item) => item.id === agentId);
  if (!agent) return;
  const root = getObsidianRoot(agent);
  if (!root) return;

  const filePath = join(root, "tasks", `${safeMarkdownName(entry.taskId)}.md`);
  const agentNotePath = join(root, "agents", `${safeMarkdownName(agent.name)}.md`);
  const outboxPath = join(
    agent.workingDirectory,
    ".mao",
    "obsidian_outbox",
    `${safeMarkdownName(entry.taskId)}_${safeMarkdownName(agent.name)}.md`
  );
  let outboxContent = "";
  try {
    if (await fs.pathExists(outboxPath)) {
      outboxContent = (await fs.readFile(outboxPath, "utf8")).trim();
      await fs.remove(outboxPath).catch(() => undefined);
    }
  } catch {
    outboxContent = "";
  }
  const artifacts = entry.responseLastMessage.match(/(?:^|\s)(?:\.\/)?mao_artifacts\/[^\s"'`<>),]+/g) ?? [];
  const lines = [
    `### ${new Date(entry.at).toISOString()} - ${agent.name}`,
    "",
    `Received: ${entry.receivedBody}`,
    `Elapsed: ${Math.round(entry.elapsedMs / 1000)}s`,
    artifacts.length > 0 ? `Artifacts: ${[...new Set(artifacts.map((item) => item.trim()))].join(", ")}` : "Artifacts: none",
    "",
    "Result:",
    entry.responseLastMessage.length > 6000
      ? `${entry.responseLastMessage.slice(0, 6000)}\n...`
      : entry.responseLastMessage,
    outboxContent
      ? `\nMemory notes from outbox:\n${outboxContent}`
      : ""
  ];
  await appendMarkdownSection(filePath, lines.join("\n"));

  if (outboxContent) {
    await appendMarkdownSection(
      agentNotePath,
      [
        `## Memory Note - ${new Date(entry.at).toISOString()}`,
        "",
        `Task: [[../tasks/${safeMarkdownName(entry.taskId)}|${entry.taskId}]]`,
        "",
        outboxContent
      ].join("\n")
    );
  }
};

const buildPlannerPrompt = (request: OrganizationSaveRequest, fallbackBriefs: OrganizationBrief[]): string => {
  const agentSummaries = request.agents.map((agent) => ({
    id: agent.id,
    name: agent.name,
    type: agent.type,
    roleLabel: agent.role,
    skillsDirectory: agent.skillsDirectory,
    skillNames: agent.skillNames,
    obsidianVaultPath: agent.obsidianVaultPath,
    obsidianNotesSubdir: agent.obsidianNotesSubdir,
    mode: agent.mode ?? "exec",
    status: agent.status
  }));
  return [
    "You are an independent organization-operations planner for a multi-agent desktop orchestrator.",
    "The user has a board of active AI agents working independently. Create one concise working brief per active agent.",
    "You are responsible for checking artifact paths, skills, and Obsidian/outbox usage for obvious coordination problems.",
    "Use ordinary company/team language. Do not write security, prompt-injection, hidden-instruction, system-prompt, policy, or compliance wording.",
    "Do not invent agents. Do not include project background unless it is visible in agent names or role labels.",
    "Return JSON only: an array of objects with {\"agentId\":\"...\",\"content\":\"...\"}.",
    "Each content should include: job title, responsibility, and a short operations checklist.",
    "Each agent works on its own tasks and reports results directly to the user; agents do not hand off work to each other.",
    "Operations checklist requirements:",
    "- Complete the given task yourself; do not delegate or hand off to another agent on the board.",
    "- Save user-facing deliverables under mao_artifacts/<task>/<agent>/ and report the paths to the user.",
    "- Use Obsidian notes for durable context when configured; if the CLI sandbox cannot write to the vault directly, write durable notes to the workspace-local .mao/obsidian_outbox file described in the runtime prompt so MAO can import them.",
    "- If an external resource path or tool seems missing, report the specific missing path/tool in your final response instead of silently skipping it.",
    "Keep each content under 240 words.",
    "",
    "Agents:",
    JSON.stringify(agentSummaries, null, 2),
    "",
    "Active organization:",
    JSON.stringify(fallbackBriefs.map((brief) => ({
      agentId: brief.agentId,
      agentName: brief.agentName,
      fallbackContent: brief.content
    })), null, 2)
  ].join("\n");
};

const planOrganizationBriefs = async (
  request: OrganizationSaveRequest,
  fallbackBriefs: OrganizationBrief[]
): Promise<OrganizationBrief[]> => {
  if (fallbackBriefs.length === 0) {
    return [];
  }

  broadcastPlannerData("\n[Org Planner] Organization saved with local briefs. Open the Org Planner tab and press Start when you want Claude CLI to inspect or adjust the organization.\n");
  broadcastPlannerStatus("stopped");
  return fallbackBriefs;
};

const buildPlannerAdvicePrompt = async (message: string): Promise<string> => {
  const agents = await readAgents();
  const graph = await readGraph();
  let organization: unknown = null;
  let briefs: unknown = null;

  try {
    organization = await fs.readJson(join(WORKSPACE_ROOT, "organization.json"));
  } catch {
    organization = null;
  }

  try {
    briefs = await fs.readJson(join(WORKSPACE_ROOT, "organization_briefs.json"));
  } catch {
    briefs = null;
  }

  return [
    "You are the MAO organization-operations planner.",
    "The user is asking you to inspect or adjust the multi-agent board, Obsidian/outbox behavior, artifact paths, or external tool usage.",
    "Answer as an operations coordinator. Be practical and concise.",
    "Each agent works independently and reports results directly to the user; there is no agent-to-agent handoff to configure.",
    "If the user asks for a change that MAO should apply, describe the exact change to make and which agents/settings are involved.",
    "Do not invent hidden state. Use only the provided current state and the user's message.",
    "If a problem is likely caused by missing organization save, stale running sessions, Obsidian path confusion, sandboxed vault writes, or missing artifact paths, call that out plainly.",
    "",
    "User message:",
    message,
    "",
    "Agents:",
    JSON.stringify(agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      type: agent.type,
      mode: agent.mode ?? "exec",
      status: agent.status,
      command: agent.command,
      args: agent.args,
      workingDirectory: agent.workingDirectory,
      role: agent.role,
      skillsDirectory: agent.skillsDirectory,
      skillNames: agent.skillNames,
      obsidianVaultPath: agent.obsidianVaultPath,
      obsidianNotesSubdir: agent.obsidianNotesSubdir
    })), null, 2),
    "",
    "Board layout (positions only; no agent-to-agent wiring):",
    JSON.stringify(graph, null, 2),
    "",
    "Saved organization:",
    JSON.stringify(organization, null, 2),
    "",
    "Saved briefs:",
    JSON.stringify(briefs, null, 2)
  ].join("\n");
};

const askPlanner = async (message: string): Promise<{ ok: true } | { ok: false; error: string }> => {
  const trimmed = message.trim();
  if (!trimmed) {
    return { ok: true };
  }

  try {
    const prompt = await buildPlannerAdvicePrompt(trimmed);
    broadcastPlannerStatus("starting");
    broadcastPlannerData(`\n\n[User -> Org Planner]\n${trimmed}\n\n`);
    broadcastPlannerData("[Org Planner] Thinking with claude...\n");

    await new Promise<void>((resolve, reject) => {
      const proc = cpSpawn("claude", [], {
        cwd: WORKSPACE_ROOT,
        stdio: ["pipe", "pipe", "pipe"]
      });
      const timeout = setTimeout(() => {
        proc.kill();
        reject(new Error("Org Planner timed out after 120s."));
      }, 120_000);

      broadcastPlannerStatus("running");
      proc.stdin?.end(prompt);

      proc.stdout?.on("data", (chunk: Buffer) => {
        broadcastPlannerData(chunk.toString("utf8"));
      });
      proc.stderr?.on("data", (chunk: Buffer) => {
        broadcastPlannerData(chunk.toString("utf8"));
      });
      proc.on("error", (error) => {
        clearTimeout(timeout);
        broadcastPlannerStatus("error");
        reject(error);
      });
      proc.on("exit", (code) => {
        clearTimeout(timeout);
        broadcastPlannerStatus(code === 0 ? "stopped" : "error");
        if (code === 0) {
          broadcastPlannerData("\n[Org Planner] Done.\n");
          resolve();
        } else {
          reject(new Error(`Org Planner exited with code ${code ?? "null"}.`));
        }
      });
    });

    return { ok: true };
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    broadcastPlannerData(`\n[Org Planner ERROR] ${messageText}\n`);
    broadcastPlannerStatus("error");
    return { ok: false, error: messageText };
  }
};

const clearOrganizationFiles = async (request: OrganizationSaveRequest): Promise<void> => {
  await fs.remove(join(WORKSPACE_ROOT, "organization.json")).catch(() => undefined);
  await fs.remove(join(WORKSPACE_ROOT, "organization_briefs.json")).catch(() => undefined);

  const workingDirectories = [
    ...new Set(
      request.agents
        .map((agent) => agent.workingDirectory)
        .filter((workingDirectory) => workingDirectory.trim().length > 0)
    )
  ];

  for (const workingDirectory of workingDirectories) {
    await fs.remove(join(workingDirectory, ".mao", "briefs")).catch(() => undefined);
    await fs.remove(join(workingDirectory, ".mao", "instructions")).catch(() => undefined);
  }
};

const registerIpcHandlers = (): void => {
  ipcMain.handle("mao:agent:list" satisfies keyof IpcChannels, async (): ReturnType<IpcChannels["mao:agent:list"]> => {
    return readAgents();
  });

  ipcMain.handle(
    "mao:agent:save" satisfies keyof IpcChannels,
    async (_event, agent: Agent): ReturnType<IpcChannels["mao:agent:save"]> => {
      const parsed = agentSchema.parse(agent);
      await withFileLock(AGENTS_JSON_PATH, async () => {
        const agents = await readAgents();
        const existingIndex = agents.findIndex((item) => item.id === parsed.id);

        if (existingIndex >= 0) {
          agents[existingIndex] = parsed;
        } else {
          agents.push(parsed);
        }

        await writeJsonUnlocked(AGENTS_JSON_PATH, agents);
      });
      return parsed;
    }
  );

  ipcMain.handle(
    "mao:agent:delete" satisfies keyof IpcChannels,
    async (_event, id: string): ReturnType<IpcChannels["mao:agent:delete"]> => {
      await withFileLock(AGENTS_JSON_PATH, async () => {
        const agents = await readAgents();
        await writeJsonUnlocked(
          AGENTS_JSON_PATH,
          agents.filter((agent) => agent.id !== id)
        );
      });
      ptyManager.kill(id);
      tmuxManager.kill(id);
      agentRunner.kill(id);
    }
  );

  ipcMain.handle("mao:notes:load" satisfies keyof IpcChannels, async (): ReturnType<IpcChannels["mao:notes:load"]> => {
    const snapshot = await readValidatedJson(NOTES_JSON_PATH, notesSnapshotSchema, { notes: [] });
    // クラッシュ等で "running" のまま残った付箋は idle に戻す
    return {
      notes: snapshot.notes.map((note) =>
        note.status === "running" ? { ...note, status: "idle" as const } : note
      )
    };
  });

  ipcMain.handle(
    "mao:notes:save" satisfies keyof IpcChannels,
    async (_event, snapshot: NotesSnapshot): ReturnType<IpcChannels["mao:notes:save"]> => {
      const parsed = notesSnapshotSchema.parse(snapshot);
      await withFileLock(NOTES_JSON_PATH, async () => {
        await writeJsonUnlocked(NOTES_JSON_PATH, parsed);
      });
    }
  );

  ipcMain.handle("mao:boards:load" satisfies keyof IpcChannels, async (): ReturnType<IpcChannels["mao:boards:load"]> => {
    return readBoards();
  });

  ipcMain.handle(
    "mao:boards:save" satisfies keyof IpcChannels,
    async (_event, snapshot: BoardsSnapshot): ReturnType<IpcChannels["mao:boards:save"]> => {
      const parsed = boardsSnapshotSchema.parse(snapshot);
      await withFileLock(BOARDS_JSON_PATH, async () => {
        await writeJsonUnlocked(BOARDS_JSON_PATH, parsed);
      });
    }
  );

  ipcMain.handle("mao:groups:load" satisfies keyof IpcChannels, async (): ReturnType<IpcChannels["mao:groups:load"]> => {
    return readGroups();
  });

  ipcMain.handle(
    "mao:groups:save" satisfies keyof IpcChannels,
    async (_event, snapshot: ProjectGroupsSnapshot): ReturnType<IpcChannels["mao:groups:save"]> => {
      const parsed = groupsSnapshotSchema.parse(snapshot);
      await withFileLock(GROUPS_JSON_PATH, async () => {
        await writeJsonUnlocked(GROUPS_JSON_PATH, parsed);
      });
    }
  );

  ipcMain.handle(
    "mao:dialog:pickDirectory" satisfies keyof IpcChannels,
    async (event): ReturnType<IpcChannels["mao:dialog:pickDirectory"]> => {
      const browserWindow = BrowserWindow.fromWebContents(event.sender);
      const result = browserWindow
        ? await dialog.showOpenDialog(browserWindow, { properties: ["openDirectory", "createDirectory"] })
        : await dialog.showOpenDialog({ properties: ["openDirectory", "createDirectory"] });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0];
    }
  );

  ipcMain.handle(
    "mao:agent:run" satisfies keyof IpcChannels,
    async (_event, request: AgentRunRequest): ReturnType<IpcChannels["mao:agent:run"]> => {
      const agents = await readAgents();
      const agent = agents.find((item) => item.id === request.agentId);

      if (!agent) {
        return { ok: false, error: `Agent not found: ${request.agentId}` } satisfies AgentRunResult;
      }

      // agent.mode を尊重する (単体実行: exec ならステートレス、interactive なら TUI セッション)。
      // rawPrompt (付箋の「渡す」等) は常にステートレス exec で実行する。
      const effectiveMode = request.rawPrompt ? "exec" : agent.mode ?? "exec";
      if (effectiveMode === "exec") {
        return agentRunner.run(request, { ...agent, mode: "exec" });
      }

      if (effectiveMode === "interactive") {
        return agentRunner.runInteractive(request, agent);
      }

      return { ok: false, error: `Unknown mode: ${effectiveMode}` } satisfies AgentRunResult;
    }
  );

  ipcMain.handle(
    "mao:agent:abort" satisfies keyof IpcChannels,
    async (_event, agentId: string): ReturnType<IpcChannels["mao:agent:abort"]> => {
      ptyManager.kill(agentId);
      tmuxManager.kill(agentId);
      return agentRunner.abort(agentId);
    }
  );

  ipcMain.handle(
    "mao:agent:abortAll" satisfies keyof IpcChannels,
    async (): ReturnType<IpcChannels["mao:agent:abortAll"]> => {
      agentRunner.abortAll();
      ptyManager.killAll();
      tmuxManager.killAll();
      return true;
    }
  );

  ipcMain.handle(
    "mao:agent:loadSummary" satisfies keyof IpcChannels,
    async (_event, agentId: string): ReturnType<IpcChannels["mao:agent:loadSummary"]> => {
      try {
        const history = (await fs.readJson(AGENT_HISTORY_PATH)) as Record<string, AgentHistoryEntry[]>;
        const list = history[agentId] ?? [];
        return {
          agentId,
          totalRuns: list.length,
          recentEntries: list.slice(-10)
        } satisfies AgentSummary;
      } catch {
        return null;
      }
    }
  );

  ipcMain.handle(
    "mao:agent:appendHistory" satisfies keyof IpcChannels,
    async (
      _event,
      agentId: string,
      entry: AgentHistoryEntry
    ): ReturnType<IpcChannels["mao:agent:appendHistory"]> => {
      await withFileLock(AGENT_HISTORY_PATH, async () => {
        let history: Record<string, AgentHistoryEntry[]> = {};

        try {
          history = (await fs.readJson(AGENT_HISTORY_PATH)) as Record<string, AgentHistoryEntry[]>;
        } catch {
          history = {};
        }

        history[agentId] = [...(history[agentId] ?? []), entry].slice(-50);
        await writeJsonUnlocked(AGENT_HISTORY_PATH, history);
      });
      await appendObsidianAgentResult(agentId, entry).catch((error) => {
        console.warn("[obsidian memory] Failed to append agent result:", error);
      });
    }
  );

  ipcMain.handle(
    "mao:project:loadSummary" satisfies keyof IpcChannels,
    async (): ReturnType<IpcChannels["mao:project:loadSummary"]> => {
      try {
        return await fs.readFile(PROJECT_SUMMARY_PATH, "utf8");
      } catch {
        return "";
      }
    }
  );

  ipcMain.handle(
    "mao:project:saveSummary" satisfies keyof IpcChannels,
    async (_event, text: string): ReturnType<IpcChannels["mao:project:saveSummary"]> => {
      await fs.ensureDir(WORKSPACE_ROOT);
      await fs.writeFile(PROJECT_SUMMARY_PATH, text, "utf8");
    }
  );

  ipcMain.handle(
    "mao:planner:ask" satisfies keyof IpcChannels,
    async (_event, message: string): ReturnType<IpcChannels["mao:planner:ask"]> => {
      return askPlanner(message);
    }
  );

  ipcMain.handle(
    "mao:organization:save" satisfies keyof IpcChannels,
    async (_event, request: OrganizationSaveRequest): ReturnType<IpcChannels["mao:organization:save"]> => {
      const organization = buildActiveOrganization(request);
      const fallbackBriefs = organization.members
        .map((member) => buildOrganizationInstruction(organization, member.id))
        .filter((item): item is NonNullable<typeof item> => Boolean(item));
      const briefs = await planOrganizationBriefs(request, fallbackBriefs);

      await fs.ensureDir(WORKSPACE_ROOT);
      await clearOrganizationFiles(request);
      await fs.writeJson(join(WORKSPACE_ROOT, "organization.json"), organization, { spaces: 2 });
      await fs.writeJson(join(WORKSPACE_ROOT, "organization_briefs.json"), briefs, { spaces: 2 });

      for (const brief of briefs) {
        await fs.ensureDir(join(brief.workingDirectory, ".mao", "briefs"));
        await ensureMaoGitignore(brief.workingDirectory);
        await fs.writeFile(
          join(brief.workingDirectory, brief.relativePath),
          brief.content,
          "utf8"
        );
      }

      await writeObsidianOrganizationMemory(request, organization, briefs).catch((error) => {
        console.warn("[obsidian memory] Failed to write organization memory:", error);
      });

      return { organization, briefs } satisfies OrganizationSaveResult;
    }
  );

  ipcMain.handle("mao:graph:load" satisfies keyof IpcChannels, async (): ReturnType<IpcChannels["mao:graph:load"]> => {
    return readGraph();
  });

  ipcMain.handle(
    "mao:graph:save" satisfies keyof IpcChannels,
    async (_event, graph: { nodes: GraphNode[]; edges: GraphEdge[] }): ReturnType<IpcChannels["mao:graph:save"]> => {
      const parsed = graphSchema.parse(graph);
      await serializedWriteJson(GRAPH_JSON_PATH, parsed);
    }
  );

  ipcMain.handle(
    "mao:task:create" satisfies keyof IpcChannels,
    async (_event, task: Task): ReturnType<IpcChannels["mao:task:create"]> => {
      const parsed = taskSchema.parse(task);
      await withFileLock(TASKS_JSON_PATH, async () => {
        const tasks = await readTasks();
        tasks.push(parsed);
        await writeJsonUnlocked(TASKS_JSON_PATH, tasks);
      });
      await writeObsidianTaskMemory(parsed).catch((error) => {
        console.warn("[obsidian memory] Failed to write task memory:", error);
      });
      return parsed;
    }
  );

  ipcMain.handle("mao:task:list" satisfies keyof IpcChannels, async (): ReturnType<IpcChannels["mao:task:list"]> => {
    return readTasks();
  });

  ipcMain.handle(
    "mao:pty:spawn" satisfies keyof IpcChannels,
    async (_event, agentId: string): ReturnType<IpcChannels["mao:pty:spawn"]> => {
      const agents = await readAgents();
      const agent = agentId === PLANNER_AGENT_ID
        ? createPlannerCliAgent()
        : agents.find((item) => item.id === agentId);

      if (!agent) {
        return { ok: false, error: `Agent not found: ${agentId}` };
      }

      const result = (agent.mode ?? "exec") === "interactive" ? tmuxManager.spawn(agent) : ptyManager.spawn(agent);
      if (!result.ok) {
        return { ok: false, error: result.error };
      }

      return { ok: true };
    }
  );

  ipcMain.handle(
    "mao:pty:write" satisfies keyof IpcChannels,
    async (_event, agentId: string, data: string): ReturnType<IpcChannels["mao:pty:write"]> => {
      if (ptyManager.has(agentId)) {
        ptyManager.write(agentId, data);
        return;
      }

      if (tmuxManager.has(agentId)) {
        tmuxManager.write(agentId, data);
        return;
      }

      agentRunner.write(agentId, data);
    }
  );

  ipcMain.handle(
    "mao:pty:kill" satisfies keyof IpcChannels,
    async (_event, agentId: string): ReturnType<IpcChannels["mao:pty:kill"]> => {
      if (ptyManager.has(agentId)) {
        ptyManager.kill(agentId);
        return;
      }

      if (tmuxManager.has(agentId)) {
        tmuxManager.kill(agentId);
        return;
      }

      agentRunner.kill(agentId);
    }
  );

  ipcMain.handle(
    "mao:log:append" satisfies keyof IpcChannels,
    async (_event, agentId: string, data: string): ReturnType<IpcChannels["mao:log:append"]> => {
      const logDir = join(WORKSPACE_ROOT, "logs");
      await fs.ensureDir(logDir);
      await fs.appendFile(join(logDir, `${agentId}.log`), data);
    }
  );

  ipcMain.handle(
    "mao:permission:respond" satisfies keyof IpcChannels,
    async (
      _event,
      requestId: string,
      decision: PermissionDecision
    ): ReturnType<IpcChannels["mao:permission:respond"]> => {
      return mcpPermissionServer.respond(requestId, decision);
    }
  );

  ipcMain.handle(
    "mao:pty:resize" satisfies keyof IpcChannels,
    async (_event, agentId: string, cols: number, rows: number): ReturnType<IpcChannels["mao:pty:resize"]> => {
      if (ptyManager.has(agentId)) {
        ptyManager.resize(agentId, cols, rows);
        return;
      }

      tmuxManager.resize(agentId, cols, rows);
    }
  );

  ipcMain.handle(
    "mao:tmux:watch" satisfies keyof IpcChannels,
    async (_event, agentId: string): ReturnType<IpcChannels["mao:tmux:watch"]> => {
      return tmuxManager.watch(agentId);
    }
  );

  ipcMain.handle("mao:setup:check" satisfies keyof IpcChannels, async (): ReturnType<IpcChannels["mao:setup:check"]> => {
    return runSetupCheck();
  });

  ipcMain.handle(
    "mao:setup:install" satisfies keyof IpcChannels,
    async (_event, toolName: string): ReturnType<IpcChannels["mao:setup:install"]> => {
      const check = await runSetupCheck();
      const tool = check.tools.find((item) => item.name === toolName);

      if (!tool) {
        return { ok: false, error: `Unknown tool: ${toolName}` } satisfies InstallResult;
      }

      if (tool.available) {
        return { ok: true, alreadyInstalled: true } satisfies InstallResult;
      }

      if (!tool.autoInstall) {
        return {
          ok: false,
          error: `No auto-install available for ${toolName}. Please install manually.`
        } satisfies InstallResult;
      }

      try {
        const result = await installer.run(toolName, tool.autoInstall.command, tool.autoInstall.args);
        if (result.code === 0) {
          return { ok: true, exitCode: result.code } satisfies InstallResult;
        }

        return { ok: false, error: `${toolName} install failed with exit code ${result.code}` } satisfies InstallResult;
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) } satisfies InstallResult;
      }
    }
  );

  ipcMain.handle(
    "mao:setup:installCancel" satisfies keyof IpcChannels,
    async (_event, toolName: string): ReturnType<IpcChannels["mao:setup:installCancel"]> => {
      return installer.cancel(toolName);
    }
  );
};

const registerPtyBroadcasts = (): void => {
  ptyManager.on("data", ({ agentId, data }) => {
    const maskedData = maskSecrets(data);

    for (const browserWindow of BrowserWindow.getAllWindows()) {
      browserWindow.webContents.send("mao:pty:data", { agentId, data: maskedData });
    }

    if (agentId === "test") {
      console.log(`[PTY test:${agentId}] ${maskedData.trimEnd()}`);
    }
  });

  ptyManager.on("status", ({ agentId, status }) => {
    for (const browserWindow of BrowserWindow.getAllWindows()) {
      browserWindow.webContents.send("mao:pty:status", { agentId, status });
    }
  });

  tmuxManager.on("data", ({ agentId, data }) => {
    const maskedData = maskSecrets(data);

    for (const browserWindow of BrowserWindow.getAllWindows()) {
      browserWindow.webContents.send("mao:pty:data", { agentId, data: maskedData });
    }
  });

  tmuxManager.on("status", ({ agentId, status }) => {
    for (const browserWindow of BrowserWindow.getAllWindows()) {
      browserWindow.webContents.send("mao:pty:status", { agentId, status });
    }
  });

  agentRunner.on("data", ({ agentId, data }) => {
    const maskedData = maskSecrets(data);

    for (const browserWindow of BrowserWindow.getAllWindows()) {
      browserWindow.webContents.send("mao:pty:data", { agentId, data: maskedData });
    }
  });

  agentRunner.on("status", ({ agentId, status }) => {
    for (const browserWindow of BrowserWindow.getAllWindows()) {
      browserWindow.webContents.send("mao:pty:status", { agentId, status });
    }
  });

  mcpPermissionServer.on("request", (payload) => {
    for (const browserWindow of BrowserWindow.getAllWindows()) {
      browserWindow.webContents.send("mao:permission:request", payload);
    }
  });

  installer.on("event", (payload) => {
    for (const browserWindow of BrowserWindow.getAllWindows()) {
      browserWindow.webContents.send("mao:setup:installProgress", payload);
    }
  });
};

const createWindow = (): void => {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: join(__dirname, "../preload/preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    void window.loadURL(process.env.ELECTRON_RENDERER_URL);
    window.webContents.openDevTools({ mode: "detach" });
  } else {
    void window.loadFile(join(__dirname, "../renderer/index.html"));
  }

  if (process.env.MAO_PTY_SMOKE_TEST === "1" && !didRunSmokeTest) {
    didRunSmokeTest = true;
    window.webContents.once("did-finish-load", () => {
      const result = ptyManager.spawn(createShellTestAgent());
      if (!result.ok) {
        console.warn(`[PTY test] ${result.error}`);
      }
    });
  }
};

app.whenReady().then(async () => {
  const mcpPort = await mcpPermissionServer.start();
  agentRunner.setMcpPort(mcpPort);
  console.log("[MAO] MCP permission server listening on port", mcpPort);
  await initializeStorage();

  // tmux サーバーはアプリより長生きするため、過去に削除したエージェントの window が
  // 残り続けて下部ターミナルのタブが残骸だらけになる。起動時に一度だけ掃除する。
  try {
    const agents = await readAgents();
    // Org Planner は agents.json に載らない組み込みエージェントなので、巻き添えで消さない。
    const removed = tmuxManager.pruneOrphanWindows([PLANNER_AGENT_ID, ...agents.map((agent) => agent.id)]);
    if (removed > 0) {
      console.log(`[MAO] Pruned ${removed} orphan tmux window(s)`);
    }
  } catch (error) {
    console.warn("[MAO] Failed to prune orphan tmux windows:", error);
  }

  registerIpcHandlers();
  registerPtyBroadcasts();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  ptyManager.killAll();
  // tmux は「アプリを閉じてもエージェントを生かす」ための層なので、終了時は
  // 購読を畳むだけにする (kill-session するとその意味が消える)。明示的に全部止めたい場合は
  // UI の abortAll → tmuxManager.killAll() が呼ばれる。
  tmuxManager.detachAll();
  agentRunner.killAll();
  void mcpPermissionServer.stop();
});
