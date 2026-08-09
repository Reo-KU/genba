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
} from "./index";

type MaoApi = {
  agent: {
    list: () => Promise<Agent[]>;
    save: (agent: Agent) => Promise<Agent>;
    delete: (id: string) => Promise<void>;
    run: (request: AgentRunRequest) => Promise<AgentRunResult>;
    abort: (agentId: string) => Promise<boolean>;
    abortAll: () => Promise<boolean>;
    loadSummary: (agentId: string) => Promise<AgentSummary | null>;
    appendHistory: (agentId: string, entry: AgentHistoryEntry) => Promise<void>;
  };
  project: {
    loadSummary: () => Promise<string>;
    saveSummary: (text: string) => Promise<void>;
  };
  planner: {
    ask: (message: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  };
  organization: {
    save: (request: OrganizationSaveRequest) => Promise<OrganizationSaveResult>;
  };
  graph: {
    load: () => Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }>;
    save: (graph: { nodes: GraphNode[]; edges: GraphEdge[] }) => Promise<void>;
  };
  task: {
    create: (task: Task) => Promise<Task>;
    list: () => Promise<Task[]>;
  };
  notes: {
    load: () => Promise<NotesSnapshot>;
    save: (snapshot: NotesSnapshot) => Promise<void>;
  };
  boards: {
    load: () => Promise<BoardsSnapshot>;
    save: (snapshot: BoardsSnapshot) => Promise<void>;
  };
  groups: {
    load: () => Promise<ProjectGroupsSnapshot>;
    save: (snapshot: ProjectGroupsSnapshot) => Promise<void>;
  };
  dialog: {
    pickDirectory: () => Promise<string | null>;
  };
  pty: {
    spawn: (agentId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
    write: (agentId: string, data: string) => Promise<void>;
    kill: (agentId: string) => Promise<void>;
    resize: (agentId: string, cols: number, rows: number) => Promise<void>;
  };
  log: {
    append: (agentId: string, data: string) => Promise<void>;
  };
  tmux: {
    watch: (agentId: string) => Promise<boolean>;
    snapshot: (agentId: string) => Promise<string | null>;
  };
  setup: {
    check: () => Promise<SetupCheckResult>;
    install: (toolName: string) => Promise<InstallResult>;
    installCancel: (toolName: string) => Promise<boolean>;
    onInstallProgress: (callback: (progress: InstallProgress) => void) => () => void;
  };
  permission: {
    respond: (requestId: string, decision: PermissionDecision) => Promise<boolean>;
    onRequest: (callback: (event: PermissionRequestEvent) => void) => () => void;
  };
  onRecordState?: (callback: (recording: boolean) => void) => () => void;
  onPtyData: (callback: (event: PtyDataEvent) => void) => () => void;
  onPtyStatus: (callback: (event: PtyStatusEvent) => void) => () => void;
};

declare global {
  interface Window {
    mao: MaoApi;
  }
}

export {};
