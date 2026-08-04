import { randomBytes, randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { tmpdir } from "node:os";
import path, { join } from "node:path";
import fs from "fs-extra";
import * as pty from "node-pty";
import type {
  Agent,
  AgentLocale,
  AgentMode,
  AgentRunRequest,
  AgentRunResult,
  ContextSnapshot,
  PermissionPolicy,
  PtyDataEvent,
  PtyStatusEvent
} from "../src/types";
import { stripAnsi } from "../src/utils/stripAnsi";
import { getCommandName, normalizeAgentCommand } from "./commandLine";
import { ensureMaoGitignore } from "./workspaceGuard";

type AgentRunnerEvents = {
  data: [PtyDataEvent];
  status: [PtyStatusEvent];
};

type CliMode = "codex" | "claude" | "grok" | "gemini" | "stdin-generic";
type CaptureStrategy = "file" | "stdout";
export type PtyBackend = {
  has(agentId: string): boolean;
  spawn(agent: Agent): { ok: true } | { ok: false; error: string };
  write(agentId: string, data: string): void;
  kill(agentId: string): boolean | void;
  killAll(): void;
  on(eventName: "data", listener: (event: PtyDataEvent) => void): unknown;
  on(eventName: "status", listener: (event: PtyStatusEvent) => void): unknown;
};

const ALLOWED_COMMANDS = new Set(["claude", "codex", "grok", "gemini", "sh", "bash", "zsh", "python", "python3", "node"]);

const truncate = (value: string, maxLength: number): string =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

const sanitizeDispatchMarkers = (value: string): string =>
  value.replace(/\[TO:/gi, "[TO_PRIOR:");

type PromptStrings = {
  projectInfo: string;
  recentHistory: string;
  receivedLabel: string;
  responseLabel: string;
  currentTaskContext: string;
  taskId: string;
  title: string;
  originalInstruction: string;
  receivedInstruction: string;
  responseRules: string;
  responseRuleLines: string[];
  fileBasedTaskIntro: (args: {
    taskSpecRelative: string;
    signalToken: string;
    signalLogRelative: string;
  }) => string;
};

const promptStringsJa: PromptStrings = {
  projectInfo: "プロジェクト情報",
  recentHistory: "あなたの直近の応答履歴",
  receivedLabel: "受信",
  responseLabel: "応答",
  currentTaskContext: "現在のタスク文脈",
  taskId: "タスクID",
  title: "タイトル",
  originalInstruction: "当初指示 (ユーザーから)",
  receivedInstruction: "受信した指示",
  responseRules: "応答ルール",
  responseRuleLines: [
    "- 与えられたタスクは自分自身で完遂すること。他のエージェントへの委任や転送はしない",
    "- 完了したら、結果を簡潔に要約して応答すること (誰が読んでも分かるように)",
    "- codex 内部の Spawn / Codex Apps / MCP サブエージェント機能は使わない",
    "- 「ツールがない」と言わず、可能な範囲で作業し、不足があれば最後にその旨を報告する"
  ],
  fileBasedTaskIntro: ({ taskSpecRelative, signalToken }) =>
    `次のタスクを実装してください。仕様は ${taskSpecRelative} にあります。\n` +
    `タスク完了時、必ず最後に **${signalToken}.flag という名前の空ファイルを .mao/ ディレクトリに作成** ` +
    `してください (Write / Edit ツール推奨。Bash の touch でも可。中身は空でよい)。\n` +
    `フルパス例: \`.mao/${signalToken}.flag\`\n`
};

const promptStringsEn: PromptStrings = {
  projectInfo: "Project Information",
  recentHistory: "Your recent response history",
  receivedLabel: "received",
  responseLabel: "response",
  currentTaskContext: "Current task context",
  taskId: "Task ID",
  title: "Title",
  originalInstruction: "Original instruction (from user)",
  receivedInstruction: "Received instruction",
  responseRules: "Response rules",
  responseRuleLines: [
    "- Complete the given task yourself. Do not delegate or forward it to another agent.",
    "- When done, respond with a concise summary of the result that stands on its own.",
    "- Do not use codex's internal Spawn / Codex Apps / MCP sub-agent features.",
    '- Do not say "no tool available"; do as much as you can and report anything missing at the end.'
  ],
  fileBasedTaskIntro: ({ taskSpecRelative, signalToken }) =>
    `Please process the next task. The spec is at ${taskSpecRelative}\n` +
    `When done, **create an empty file named ${signalToken}.flag in the .mao/ directory** ` +
    `(prefer your Write/Edit tool; touch via Bash also works; content can be empty).\n` +
    `Path: \`.mao/${signalToken}.flag\`\n`
};

const getPromptStrings = (locale: AgentLocale | undefined): PromptStrings =>
  (locale ?? "ja") === "en" ? promptStringsEn : promptStringsJa;

const detectCliMode = (commandName: string): CliMode => {
  if (commandName === "codex") {
    return "codex";
  }

  if (commandName === "claude") {
    return "claude";
  }

  if (commandName === "grok") {
    return "grok";
  }

  if (commandName === "gemini") {
    return "gemini";
  }

  return "stdin-generic";
};

const flattenExtraArgs = (args: string[] | undefined): string[] =>
  (args ?? []).flatMap((arg) => arg.split(/\s+/)).filter((arg) => arg.length > 0);

const buildPolicyArgs = (mode: CliMode, agentMode: AgentMode, policy: PermissionPolicy): string[] => {
  if (policy === "safe-auto") {
    if (mode === "codex") {
      return ["--sandbox", "workspace-write"];
    }

    if (mode === "claude") {
      return ["--permission-mode", "acceptEdits"];
    }

    if (mode === "gemini") {
      return ["--approval-mode", "auto_edit"];
    }

    return [];
  }

  if (policy === "yolo") {
    if (mode === "codex") {
      return ["--dangerously-bypass-approvals-and-sandbox"];
    }

    if (mode === "claude") {
      return ["--dangerously-skip-permissions"];
    }

    if (mode === "gemini") {
      return ["--yolo"];
    }

    return [];
  }

  if (policy === "ask") {
    // codex のデフォルト approval_policy はゆるく、何もしないと TUI でも黙って実行される。
    // interactive モードのときだけ「全コマンド承認待ち」に強制し、sandbox は承認後の動作を妨げないよう
    // danger-full-access にする (sandbox 制限は yolo/safe-auto と直交的な保護なので、ask では承認に委ねる)。
    // exec モードは codex 自体が approval: never に固定されているため、ここで送ってもハングするだけで意味がない。
    if (mode === "codex" && agentMode === "interactive") {
      return ["-c", 'approval_policy="untrusted"', "--sandbox", "danger-full-access"];
    }
    // claude は MCP の --permission-prompt-tool 側で扱う (run() で別途注入)
    // gemini / grok / stdin-generic は CLI の TUI 既定に任せる
    return [];
  }

  return [];
};

const buildRunArgs = (
  mode: CliMode,
  workingDirectory: string,
  tmpFile: string,
  prompt: string,
  flatExtraArgs: string[]
): { args: string[]; captureStrategy: CaptureStrategy; writePromptToStdin: boolean } => {
  if (mode === "codex") {
    return {
      args: [
        "exec",
        "--skip-git-repo-check",
        "--ephemeral",
        "-C",
        workingDirectory,
        "--output-last-message",
        tmpFile,
        ...flatExtraArgs,
        prompt
      ],
      captureStrategy: "file",
      writePromptToStdin: false
    };
  }

  if (mode === "claude" || mode === "grok" || mode === "gemini") {
    return {
      args: ["-p", ...flatExtraArgs, prompt],
      captureStrategy: "stdout",
      writePromptToStdin: false
    };
  }

  return {
    args: flatExtraArgs,
    captureStrategy: "stdout",
    writePromptToStdin: true
  };
};

const composePrompt = (agent: Agent, body: string, ctx: ContextSnapshot): string => {
  const t = getPromptStrings(ctx.locale);
  const sections: string[] = [];

  if (ctx.projectSummary.trim().length > 0) {
    sections.push(`## ${t.projectInfo}\n${ctx.projectSummary.trim()}`);
  }

  if (ctx.agentSummary && ctx.agentSummary.recentEntries.length > 0) {
    const lines = [`## ${t.recentHistory}`];
    for (const entry of ctx.agentSummary.recentEntries.slice(-5)) {
      lines.push(
        `- task ${entry.taskId.slice(-6)}: ${t.receivedLabel}="${sanitizeDispatchMarkers(
          truncate(entry.receivedBody, 60)
        )}" ${t.responseLabel}="${sanitizeDispatchMarkers(
          truncate(entry.responseLastMessage, 60)
        )}"`
      );
    }
    sections.push(lines.join("\n"));
  }

  if (ctx.taskState) {
    const lines = [
      `## ${t.currentTaskContext}`,
      `- ${t.taskId}: ${ctx.taskState.taskId}`,
      `- ${t.title}: ${ctx.taskState.title}`,
      `- ${t.originalInstruction}: ${truncate(ctx.taskState.originalBody, 200)}`
    ];

    sections.push(lines.join("\n"));
  }

  sections.push(`## ${t.receivedInstruction}`);
  sections.push(body);
  sections.push("");
  sections.push(`## ${t.responseRules}`);
  sections.push(...t.responseRuleLines);

  return sections.join("\n\n");
};

async function rotateSignalsIfLarge(signalLogPath: string): Promise<void> {
  try {
    const stat = await fs.stat(signalLogPath);
    if (stat.size > 100 * 1024) {
      const archive = `${signalLogPath}.${Date.now()}.bak`;
      await fs.move(signalLogPath, archive, { overwrite: false }).catch(() => undefined);
    }
  } catch {
    // The signal log may not exist yet.
  }
}

const buildExecLeafPrompt = (locale: AgentLocale, taskBody: string): string => {
  if (locale === "ja") {
    return `次のタスクを実装してください。応答は stdout に直接出力してください。\n\n----\n${taskBody}`;
  }
  return `Please process the next task. Print your answer to stdout.\n\n----\n${taskBody}`;
};

const buildArtifactGuidance = (locale: AgentLocale, artifactRelativeDir: string): string => {
  if (locale === "ja") {
    return [
      "成果物の保存先:",
      `- 分析レポート、調査メモ、生成した txt/md/csv など、ユーザーに渡す成果物は ${artifactRelativeDir}/ に保存してください。`,
      "- .mao/ は MAO の制御用一時フォルダなので、成果物は .mao/ の中に置かないでください。",
      "- ファイルを作った場合は、最後の応答に保存パスを短く書いてください。"
    ].join("\n");
  }

  return [
    "Artifact location:",
    `- Save user-facing deliverables such as reports, notes, txt/md/csv files under ${artifactRelativeDir}/.`,
    "- Do not put deliverables inside .mao/; that folder is MAO's temporary control area.",
    "- If you create files, mention their saved paths briefly in your final response."
  ].join("\n");
};

const safeAgentDirName = (agent: Agent): string =>
  (agent.name || agent.id)
    .replace(/[\\/:*?"<>|#^\[\]]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 80) || agent.id;

const obsidianSubdir = (agent: Agent): string =>
  (agent.obsidianNotesSubdir?.trim() || "MAO")
    .split(/[\\/]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== "." && part !== "..")
    .join("/");

const buildAgentResourceGuidance = (locale: AgentLocale, agent: Agent, taskId?: string): string => {
  const skillsDirectory = agent.skillsDirectory?.trim();
  const skillNames = (agent.skillNames ?? []).map((item) => item.trim()).filter(Boolean);
  const obsidianVaultPath = agent.obsidianVaultPath?.trim();
  const sections: string[] = [];

  if (skillsDirectory) {
    sections.push(
      locale === "ja"
        ? [
            "Skills:",
            `- Skills directory: ${skillsDirectory}`,
            `- 利用対象: ${skillNames.length > 0 ? skillNames.join(", ") : "このディレクトリ内の関連する skill"}`,
            "- タスクに役立つ場合は、関連する SKILL.md を読んでから作業してください。",
            "- 全skillを機械的に読む必要はありません。必要なものだけ使ってください。"
          ].join("\n")
        : [
            "Skills:",
            `- Skills directory: ${skillsDirectory}`,
            `- Enabled skills: ${skillNames.length > 0 ? skillNames.join(", ") : "any relevant skill in this directory"}`,
            "- When useful for the task, read the relevant SKILL.md before working.",
            "- Do not read every skill mechanically; use only the relevant ones."
          ].join("\n")
    );
  }

  if (obsidianVaultPath) {
    const notesSubdir = obsidianSubdir(agent);
    const memoryRoot = notesSubdir ? `${obsidianVaultPath}/${notesSubdir}` : obsidianVaultPath;
    const taskNote = taskId ? `${memoryRoot}/tasks/${taskId}.md` : `${memoryRoot}/tasks/`;
    const outboxPath = `.mao/obsidian_outbox/${taskId ?? "current-task"}_${safeAgentDirName(agent)}.md`;
    sections.push(
      locale === "ja"
        ? [
            "Obsidian:",
            `- Vault path: ${obsidianVaultPath}`,
            `- MAO memory root: ${memoryRoot}/`,
            `- Organization note: ${memoryRoot}/organization.md`,
            `- Your agent note: ${memoryRoot}/agents/${safeAgentDirName(agent)}.md`,
            `- Current task note: ${taskNote}`,
            `- 新規ノートの既定保存先: ${notesSubdir || "vault root"}/`,
            "- MAO本体が organization / task timeline / agent result は自動でObsidianへ記録します。",
            "- タスクに役立つ場合は、このvault内のノートを読んで構いません。",
            "- 作業開始時に organization note / 自分の agent note / current task note を必要に応じて確認してください。",
            `- 重要な決定や次回以降も使う知識を残したい場合、vaultへ直接書けなければ作業フォルダ内の ${outboxPath} に追記してください。MAOが完了時にObsidianへ取り込みます。`,
            "- ユーザーが明示しない限り、既存ノートの削除・大規模なリネーム・フォルダ再編はしないでください。",
            "- sandboxや権限でvaultの読み取りもできない場合は、必要なパスと許可を最後に報告してください。"
          ].join("\n")
        : [
            "Obsidian:",
            `- Vault path: ${obsidianVaultPath}`,
            `- MAO memory root: ${memoryRoot}/`,
            `- Organization note: ${memoryRoot}/organization.md`,
            `- Your agent note: ${memoryRoot}/agents/${safeAgentDirName(agent)}.md`,
            `- Current task note: ${taskNote}`,
            `- Default location for new notes: ${notesSubdir || "vault root"}/`,
            "- MAO itself automatically records organization, task timeline, and agent result entries into Obsidian.",
            "- When useful for the task, you may read notes in this vault.",
            "- At the start of work, check the organization note, your agent note, and current task note when relevant.",
            `- If you want to keep durable decisions or reusable knowledge but cannot write to the vault directly, append it to the workspace-local outbox ${outboxPath}. MAO imports it into Obsidian when the run completes.`,
            "- Do not delete existing notes, mass-rename files, or reorganize folders unless the user explicitly asks.",
            "- If sandboxing or permissions also block vault reads, report the needed path and permission in your final response."
          ].join("\n")
    );
  }

  if (sections.length === 0) {
    return "";
  }

  return [locale === "ja" ? "追加リソース:" : "Additional resources:", sections.join("\n\n")].join("\n");
};

const prepareFilePassingTask = async (
  agent: Agent,
  req: AgentRunRequest,
  signalToken: string
): Promise<{
  shortInstruction: string;
  signalLogPath: string;
  taskSpecPath: string;
  maoDir: string;
}> => {
  const workingDirectory = path.resolve(agent.workingDirectory);
  const maoDir = path.join(workingDirectory, ".mao");
  await fs.ensureDir(maoDir);

  const dispatchId = signalToken.replace(/^MAO_DONE_/, "");
  const fileBase = `${req.taskId}_${dispatchId.slice(0, 8)}`;
  const taskSpecRelative = `.mao/${fileBase}.md`;
  const artifactRelativeDir = `mao_artifacts/${req.taskId}/${safeAgentDirName(agent)}`;
  const signalLogRelative = ".mao/signals.log";
  const taskSpecPath = path.join(maoDir, `${fileBase}.md`);
  const signalLogPath = path.join(maoDir, "signals.log");
  const t = getPromptStrings(req.context.locale);
  const signalReminder = t.fileBasedTaskIntro({
    taskSpecRelative,
    signalToken,
    signalLogRelative
  });
  // 仕様ファイルの中身は「与えられたタスクを自分で完遂する」単体エージェント用プロンプトのみ。
  // 末尾に signal reminder を貼って完了通知の作法を伝える。
  const locale = req.context.locale ?? "ja";
  const resourceGuidance = buildAgentResourceGuidance(locale, agent, req.taskId);
  const resourceBlock = resourceGuidance ? `${resourceGuidance}\n\n` : "";
  const naturalBody = `${req.context.organizationBrief?.trim() ? `${req.context.organizationBrief.trim()}\n\n` : ""}${resourceBlock}${buildArtifactGuidance(locale, artifactRelativeDir)}\n\n${buildExecLeafPrompt(locale, req.body)}`;
  const fullSpec = `${naturalBody}\n\n---\n${signalReminder}`;

  await rotateSignalsIfLarge(signalLogPath);
  await fs.writeFile(taskSpecPath, fullSpec, "utf8");
  await fs.ensureFile(signalLogPath);

  // 短い「.mao/<taskId>.md を読んで実装してください」だけ送って agent に file 読みを任せる。
  const shortInstruction = signalReminder;

  return {
    shortInstruction,
    signalLogPath,
    taskSpecPath,
    maoDir
  };
};

export declare interface AgentRunner {
  on<K extends keyof AgentRunnerEvents>(eventName: K, listener: (...args: AgentRunnerEvents[K]) => void): this;
  off<K extends keyof AgentRunnerEvents>(eventName: K, listener: (...args: AgentRunnerEvents[K]) => void): this;
  emit<K extends keyof AgentRunnerEvents>(eventName: K, ...args: AgentRunnerEvents[K]): boolean;
}

export class AgentRunner extends EventEmitter {
  private readonly activePtys = new Map<string, pty.IPty>();
  private readonly interactiveBuffers = new Map<string, string>();
  private readonly activeInteractiveAgents = new Set<string>();
  private readonly abortedAgents = new Set<string>();
  private ptyBackend: PtyBackend | null = null;
  private isPtyManagerSubscribed = false;
  private mcpPermissionPort = 0;

  setMcpPort(port: number): void {
    this.mcpPermissionPort = port;
  }

  setPtyManager(backend: PtyBackend): void {
    this.ptyBackend = backend;

    if (this.isPtyManagerSubscribed) {
      return;
    }

    this.isPtyManagerSubscribed = true;
    backend.on("data", ({ agentId, data }) => {
      const current = this.interactiveBuffers.get(agentId);
      if (current !== undefined) {
        this.interactiveBuffers.set(agentId, current + data);
      }
    });
  }

  async run(req: AgentRunRequest, agent: Agent): Promise<AgentRunResult> {
    const normalizedCommand = normalizeAgentCommand(agent);
    const commandName = getCommandName(normalizedCommand.command);
    console.info("[MAO agentRunner.run]", {
      agentId: agent.id,
      status: agent.status,
      mode: agent.mode ?? "exec"
    });

    if (!ALLOWED_COMMANDS.has(commandName)) {
      return { ok: false, error: `Command not in allowlist: ${commandName}` };
    }

    const workingDirectory = path.resolve(agent.workingDirectory);
    if (!(await fs.pathExists(workingDirectory))) {
      return { ok: false, error: `workingDirectory does not exist: ${workingDirectory}` };
    }
    await ensureMaoGitignore(workingDirectory);

    const tmpFile = join(tmpdir(), `mao_agent_${agent.id}_${randomBytes(6).toString("hex")}.txt`);
    const signalToken = `MAO_DONE_${randomUUID()}`;

    // exec モード: spec file 経由ではなく **prompt 本文に inline で全部含める**。
    // 単体エージェントとして与えられたタスクを完遂させる通常の task prompt のみ。
    const locale = req.context.locale ?? "ja";
    const artifactRelativeDir = `mao_artifacts/${req.taskId}/${safeAgentDirName(agent)}`;
    const resourceGuidance = buildAgentResourceGuidance(locale, agent, req.taskId);
    const resourceBlock = resourceGuidance ? `${resourceGuidance}\n\n` : "";
    const shortInstruction = req.rawPrompt
      ? req.body
      : `${req.context.organizationBrief?.trim() ? `${req.context.organizationBrief.trim()}\n\n` : ""}${resourceBlock}${buildArtifactGuidance(locale, artifactRelativeDir)}\n\n${buildExecLeafPrompt(locale, req.body)}`;
    // spec file は不要 (inline 化)。taskSpecPath は cleanup には使わない
    const taskSpecPath = "";

    const mode = detectCliMode(commandName);
    const policy = agent.permissionPolicy ?? "safe-auto";
    const policyArgs = buildPolicyArgs(mode, agent.mode ?? "exec", policy);
    const cleanupFiles: string[] = [];
    let extraEnv: Record<string, string> = {};
    let extraInjectedArgs: string[] = [];

    if (mode === "claude" && (agent.mode ?? "exec") === "exec" && policy === "ask") {
      const mcpConfigPath = join(tmpdir(), `mao_mcp_${agent.id}_${randomBytes(6).toString("hex")}.json`);
      const bridgePath = path.resolve(__dirname, "../../electron/mcpPermissionBridge.mjs");

      await fs.writeJson(
        mcpConfigPath,
        {
          mcpServers: {
            maoperm: {
              type: "stdio",
              command: "node",
              args: [bridgePath]
            }
          }
        },
        { spaces: 2 }
      );
      cleanupFiles.push(mcpConfigPath);

      extraInjectedArgs = [
        "--mcp-config",
        mcpConfigPath,
        "--permission-prompt-tool",
        "mcp__maoperm__approve_request"
      ];
      extraEnv = {
        MAO_PERM_PORT: String(this.mcpPermissionPort),
        MAO_AGENT_ID: agent.id,
        MAO_AGENT_NAME: agent.name
      };
    }

    const flatExtraArgs = flattenExtraArgs(normalizedCommand.args);
    const combinedExtraArgs = [...policyArgs, ...extraInjectedArgs, ...flatExtraArgs];
    const { args, captureStrategy, writePromptToStdin } = buildRunArgs(
      mode,
      workingDirectory,
      tmpFile,
      shortInstruction,
      combinedExtraArgs
    );
    console.log(`[AgentRunner] ${agent.name} (mode=${mode}, policy=${policy}) args:`, args);

    this.emit("status", { agentId: agent.id, status: "running" });

    const startedAt = Date.now();
    return new Promise<AgentRunResult>((resolve) => {
      let proc: pty.IPty;
      let stdoutBuffer = "";

      try {
        proc = pty.spawn(normalizedCommand.command, args, {
          cwd: workingDirectory,
          env: { ...(process.env as Record<string, string>), ...extraEnv },
          cols: 140,
          rows: 40
        });
        this.activePtys.set(agent.id, proc);

        if (writePromptToStdin) {
          proc.write(`${shortInstruction}\x04`);
        }
      } catch (error) {
        void fs.remove(taskSpecPath).catch(() => undefined);
        this.emit("status", { agentId: agent.id, status: "error" });
        resolve({ ok: false, error: error instanceof Error ? error.message : String(error) });
        return;
      }

      proc.onData((data) => {
        if (captureStrategy === "stdout") {
          stdoutBuffer += data;
        }

        this.emit("data", { agentId: agent.id, data });
      });

      proc.onExit(async ({ exitCode }) => {
        this.activePtys.delete(agent.id);
        this.abortedAgents.delete(agent.id);
        const elapsedMs = Date.now() - startedAt;
        let lastMessage = "";

        if (captureStrategy === "file") {
          try {
            lastMessage = await fs.readFile(tmpFile, "utf8");
          } catch {
            lastMessage = "";
          }
        } else {
          lastMessage = stripAnsi(stdoutBuffer).trim();
        }

        if (captureStrategy === "file") {
          try {
            await fs.remove(tmpFile);
          } catch {
            // Best effort cleanup.
          }
        }

        try {
          await fs.remove(taskSpecPath);
        } catch {
          // Best effort cleanup.
        }

        for (const filePath of cleanupFiles) {
          try {
            await fs.remove(filePath);
          } catch {
            // Best effort cleanup.
          }
        }

        this.emit("status", { agentId: agent.id, status: exitCode === 0 ? "stopped" : "error" });
        resolve({ ok: true, lastMessage, exitCode, elapsedMs });
      });
    });
  }

  async runInteractive(req: AgentRunRequest, agent: Agent): Promise<AgentRunResult> {
    if (!this.ptyBackend) {
      return { ok: false, error: "PTY backend not configured for AgentRunner" };
    }

    const normalizedCommand = normalizeAgentCommand(agent);
    const commandName = getCommandName(normalizedCommand.command);
    if (!ALLOWED_COMMANDS.has(commandName)) {
      return { ok: false, error: `Command not in allowlist: ${commandName}` };
    }

    const workingDirectory = path.resolve(agent.workingDirectory);
    if (!(await fs.pathExists(workingDirectory))) {
      return { ok: false, error: `workingDirectory does not exist: ${workingDirectory}` };
    }
    await ensureMaoGitignore(workingDirectory);

    if (!this.ptyBackend.has(agent.id)) {
      const spawnResult = this.ptyBackend.spawn(agent);
      if (!spawnResult.ok) {
        return { ok: false, error: spawnResult.error };
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    const taskCallId = randomUUID();
    // 区切り文字を入れない単一トークン。エスケープに依存しないので printf/echo どちらでも壊れない。
    const signalToken = `MAO_DONE_${taskCallId}`;
    const { shortInstruction, signalLogPath, taskSpecPath, maoDir } = await prepareFilePassingTask(agent, req, signalToken);

    try {
      this.interactiveBuffers.set(agent.id, "");
      this.activeInteractiveAgents.add(agent.id);
      this.emit("status", { agentId: agent.id, status: "running" });

      this.ptyBackend.write(agent.id, shortInstruction);
      await new Promise((resolve) => setTimeout(resolve, 600));
      this.ptyBackend.write(agent.id, "\r");

      const startedAt = Date.now();
      const timeoutMs = 5 * 60 * 1000;
      let signaledAt: number | null = null;

      // signal は agent が以下のいずれかで通知:
      //   - `.mao/<token>.flag` ファイル作成 (完了通知)
      //   - 旧 signals.log への token 追記 (後方互換)
      // どちらも Write/Edit ツール経由なので permission ダイアログ無し。
      const signalFlagPath = path.join(maoDir, `${signalToken}.flag`);
      let completionSource: "flag" | "signals.log" | null = null;

      while (Date.now() - startedAt < timeoutMs) {
        await new Promise((resolve) => setTimeout(resolve, 250));
        if (this.abortedAgents.has(agent.id)) {
          break;
        }

        if (await fs.pathExists(signalFlagPath)) {
          completionSource = "flag";
          signaledAt = Date.now();
          break;
        }

        // 後方互換: 旧 signals.log 経由の signal も拾う
        try {
          const content = await fs.readFile(signalLogPath, "utf8");
          if (content.includes(signalToken)) {
            completionSource = "signals.log";
            signaledAt = Date.now();
            break;
          }
        } catch {
          // Keep polling.
        }
      }

      // signal flag ファイルは cleanup
      fs.remove(signalFlagPath).catch(() => undefined);

      const elapsedMs = Date.now() - startedAt;
      const wasAborted = this.abortedAgents.has(agent.id);
      this.abortedAgents.delete(agent.id);
      this.activeInteractiveAgents.delete(agent.id);
      const buffer = this.interactiveBuffers.get(agent.id) ?? "";
      this.interactiveBuffers.delete(agent.id);
      this.emit("status", { agentId: agent.id, status: "running" });

      if (!signaledAt) {
        if (wasAborted) {
          return { ok: false, error: `Aborted by user. Buffer length: ${buffer.length}` };
        }

        return {
          ok: false,
          error: `Timeout waiting for ${signalToken} after ${Math.round(
            elapsedMs / 1000
          )}s. Buffer length: ${buffer.length}`
        };
      }

      // TUI buffer から signal token 手前までを最終メッセージとして扱う。
      const cleanBuffer = stripAnsi(buffer);
      const signalIndex = cleanBuffer.lastIndexOf(signalToken);
      const bufferTrimmed = (signalIndex > 0 ? cleanBuffer.slice(0, signalIndex) : cleanBuffer).trim();
      const fallbackCompletion = `[MAO] ${agent.name} signaled completion via ${completionSource ?? "unknown"} but did not emit a visible final message.`;
      const lastMessage = bufferTrimmed || fallbackCompletion;

      this.emit("data", {
        agentId: agent.id,
        data: `\n[MAO] completion signal received via ${completionSource ?? "unknown"}.\n`
      });

      return {
        ok: true,
        lastMessage,
        exitCode: 0,
        elapsedMs
      };
    } finally {
      this.activeInteractiveAgents.delete(agent.id);
      this.interactiveBuffers.delete(agent.id);
      await fs.remove(taskSpecPath).catch(() => undefined);
    }
  }

  write(agentId: string, data: string): boolean {
    const proc = this.activePtys.get(agentId);
    if (!proc) {
      return false;
    }

    proc.write(data);
    return true;
  }

  kill(agentId: string): boolean {
    const proc = this.activePtys.get(agentId);
    if (!proc) {
      return false;
    }

    proc.kill();
    this.activePtys.delete(agentId);
    return true;
  }

  abort(agentId: string): boolean {
    this.abortedAgents.add(agentId);
    return this.kill(agentId);
  }

  abortAll(): void {
    for (const agentId of this.activePtys.keys()) {
      this.abortedAgents.add(agentId);
    }

    for (const agentId of this.activeInteractiveAgents.values()) {
      this.abortedAgents.add(agentId);
    }

    this.killAll();
  }

  killAll(): void {
    for (const proc of this.activePtys.values()) {
      try {
        proc.kill();
      } catch {
        // Best effort shutdown.
      }
    }

    this.activePtys.clear();
  }
}
