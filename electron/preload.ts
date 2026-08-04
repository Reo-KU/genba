import { contextBridge, ipcRenderer } from "electron";
import type {
  Agent,
  AgentHistoryEntry,
  AgentRunRequest,
  AgentRunResult,
  AgentSummary,
  BoardsSnapshot,
  ProjectGroupsSnapshot,
  NotesSnapshot,
  GraphEdge,
  GraphNode,
  InstallProgress,
  InstallResult,
  PermissionDecision,
  PermissionRequestEvent,
  PtyDataEvent,
  PtyStatusEvent,
  OrganizationSaveRequest,
  OrganizationSaveResult,
  SetupCheckResult,
  Task
} from "../src/types";

contextBridge.exposeInMainWorld("mao", {
  agent: {
    list: (): Promise<Agent[]> => ipcRenderer.invoke("mao:agent:list"),
    save: (agent: Agent): Promise<Agent> => ipcRenderer.invoke("mao:agent:save", agent),
    delete: (id: string): Promise<void> => ipcRenderer.invoke("mao:agent:delete", id),
    run: (request: AgentRunRequest): Promise<AgentRunResult> => ipcRenderer.invoke("mao:agent:run", request),
    abort: (agentId: string): Promise<boolean> => ipcRenderer.invoke("mao:agent:abort", agentId),
    abortAll: (): Promise<boolean> => ipcRenderer.invoke("mao:agent:abortAll"),
    loadSummary: (agentId: string): Promise<AgentSummary | null> =>
      ipcRenderer.invoke("mao:agent:loadSummary", agentId),
    appendHistory: (agentId: string, entry: AgentHistoryEntry): Promise<void> =>
      ipcRenderer.invoke("mao:agent:appendHistory", agentId, entry)
  },
  project: {
    loadSummary: (): Promise<string> => ipcRenderer.invoke("mao:project:loadSummary"),
    saveSummary: (text: string): Promise<void> => ipcRenderer.invoke("mao:project:saveSummary", text)
  },
  planner: {
    ask: (message: string): Promise<{ ok: true } | { ok: false; error: string }> =>
      ipcRenderer.invoke("mao:planner:ask", message)
  },
  organization: {
    save: (request: OrganizationSaveRequest): Promise<OrganizationSaveResult> =>
      ipcRenderer.invoke("mao:organization:save", request)
  },
  graph: {
    load: (): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> => ipcRenderer.invoke("mao:graph:load"),
    save: (graph: { nodes: GraphNode[]; edges: GraphEdge[] }): Promise<void> =>
      ipcRenderer.invoke("mao:graph:save", graph)
  },
  task: {
    create: (task: Task): Promise<Task> => ipcRenderer.invoke("mao:task:create", task),
    list: (): Promise<Task[]> => ipcRenderer.invoke("mao:task:list")
  },
  notes: {
    load: (): Promise<NotesSnapshot> => ipcRenderer.invoke("mao:notes:load"),
    save: (snapshot: NotesSnapshot): Promise<void> => ipcRenderer.invoke("mao:notes:save", snapshot)
  },
  boards: {
    load: (): Promise<BoardsSnapshot> => ipcRenderer.invoke("mao:boards:load"),
    save: (snapshot: BoardsSnapshot): Promise<void> => ipcRenderer.invoke("mao:boards:save", snapshot)
  },
  groups: {
    load: (): Promise<ProjectGroupsSnapshot> => ipcRenderer.invoke("mao:groups:load"),
    save: (snapshot: ProjectGroupsSnapshot): Promise<void> => ipcRenderer.invoke("mao:groups:save", snapshot)
  },
  dialog: {
    pickDirectory: (): Promise<string | null> => ipcRenderer.invoke("mao:dialog:pickDirectory")
  },
  pty: {
    spawn: (agentId: string): Promise<{ ok: true } | { ok: false; error: string }> =>
      ipcRenderer.invoke("mao:pty:spawn", agentId),
    write: (agentId: string, data: string): Promise<void> => ipcRenderer.invoke("mao:pty:write", agentId, data),
    kill: (agentId: string): Promise<void> => ipcRenderer.invoke("mao:pty:kill", agentId),
    resize: (agentId: string, cols: number, rows: number): Promise<void> =>
      ipcRenderer.invoke("mao:pty:resize", agentId, cols, rows)
  },
  log: {
    append: (agentId: string, data: string): Promise<void> => ipcRenderer.invoke("mao:log:append", agentId, data)
  },
  tmux: {
    watch: (agentId: string): Promise<boolean> => ipcRenderer.invoke("mao:tmux:watch", agentId),
    snapshot: (agentId: string): Promise<string | null> => ipcRenderer.invoke("mao:tmux:snapshot", agentId)
  },
  setup: {
    check: (): Promise<SetupCheckResult> => ipcRenderer.invoke("mao:setup:check"),
    install: (toolName: string): Promise<InstallResult> => ipcRenderer.invoke("mao:setup:install", toolName),
    installCancel: (toolName: string): Promise<boolean> => ipcRenderer.invoke("mao:setup:installCancel", toolName),
    onInstallProgress: (callback: (progress: InstallProgress) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: InstallProgress): void => {
        callback(payload);
      };

      ipcRenderer.on("mao:setup:installProgress", listener);
      return () => ipcRenderer.off("mao:setup:installProgress", listener);
    }
  },
  permission: {
    respond: (requestId: string, decision: PermissionDecision): Promise<boolean> =>
      ipcRenderer.invoke("mao:permission:respond", requestId, decision),
    onRequest: (callback: (event: PermissionRequestEvent) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: PermissionRequestEvent): void => {
        callback(payload);
      };

      ipcRenderer.on("mao:permission:request", listener);
      return () => ipcRenderer.off("mao:permission:request", listener);
    }
  },
  onPtyData: (callback: (event: PtyDataEvent) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: PtyDataEvent): void => {
      callback(payload);
    };

    ipcRenderer.on("mao:pty:data", listener);
    return () => ipcRenderer.off("mao:pty:data", listener);
  },
  onPtyStatus: (callback: (event: PtyStatusEvent) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: PtyStatusEvent): void => {
      callback(payload);
    };

    ipcRenderer.on("mao:pty:status", listener);
    return () => ipcRenderer.off("mao:pty:status", listener);
  }
});
