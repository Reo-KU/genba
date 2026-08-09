export type AgentMode = "exec" | "interactive";
export type PermissionPolicy = "ask" | "safe-auto" | "yolo";
export type AgentLocale = "en" | "ja";

export type Agent = {
  id: string;
  name: string;
  type: "claude" | "codex" | "grok" | "gemini" | "custom";
  mode?: AgentMode;
  permissionPolicy?: PermissionPolicy;
  command: string;
  args?: string[];
  workingDirectory: string;
  role: string;
  systemPrompt: string;
  skillsDirectory?: string;
  skillNames?: string[];
  obsidianVaultPath?: string;
  obsidianNotesSubdir?: string;
  status: "stopped" | "starting" | "running" | "error";
};

export type GraphNode = {
  id: string;
  agentId: string;
  /**
   * v9 (樹形図モデル) 以降、**キャンバス上の絶対座標**。v8 (包含ネストモデル) では「所属陣地の箱の
   * 左上からの相対座標」だったが、包含 (parentNode) をやめて樹形図 (エージェントはフォルダノードから
   * 線で伸びる葉) に変更したため、絶対座標に戻した (utils/territoryTree.ts の `layoutTree` 参照)。
   */
  position: {
    x: number;
    y: number;
  };
  /** 旧・組織図の root フラグ。graph.json の後方互換のためだけに残す。アプリはもう読まない。 */
  isRoot: boolean;
  /** 旧・所属ボード。boards.json 後方互換のためだけに型・zodスキーマに残す。アプリはもう読まない。 */
  boardId?: string;
  /** 所属するプロジェクト囲い (ProjectGroup)。未所属は null/undefined */
  groupId?: string | null;
};

/** 旧・エージェント間紐付け (dispatch 用の辺)。graph.json の後方互換のためだけに残す。アプリはもう読み書きしない (保存時は常に []) 。 */
export type GraphEdge = {
  id: string;
  source: string;
  target: string;
};

export type Task = {
  id: string;
  title: string;
  body: string;
  /** 実行したエージェント。旧「組織図の root」概念の名残でフィールド名は据え置き */
  rootAgentId: string;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  taskId: string;
  from: "user" | string;
  to: string;
  body: string;
  createdAt: string;
};

export type AgentHistoryEntry = {
  taskId: string;
  receivedBody: string;
  responseLastMessage: string;
  at: string;
  elapsedMs: number;
};

export type AgentSummary = {
  agentId: string;
  totalRuns: number;
  recentEntries: AgentHistoryEntry[];
};

export type TaskState = {
  taskId: string;
  title: string;
  originalBody: string;
  /** 実行したエージェント。旧「組織図の root」概念の名残でフィールド名は据え置き */
  rootAgentId: string;
  status: "running" | "completed" | "failed";
  createdAt: string;
};

/**
 * 旧・組織図(root/edges による階層 dispatch)時代の名残の型。
 * 単体実行モデルではアプリはこの中身を hierarchy として読まない (常に空配列で組み立てる)。
 */
export type GraphSnapshotForContext = {
  nodes: Array<{ agentId: string; name: string; role: string; isRoot: boolean }>;
  edges: Array<{ source: string; target: string }>;
};

export type ContextSnapshot = {
  taskState: TaskState | null;
  projectSummary: string;
  agentSummary: AgentSummary | null;
  graph: GraphSnapshotForContext;
  organizationBrief?: string;
  locale?: AgentLocale;
};

/** ボード上で稼働中(interactive かつ running)のメンバー1人分。階層フィールドは持たない。 */
export type ActiveOrganizationMember = {
  id: string;
  nodeId: string;
  name: string;
  role: string;
  type: Agent["type"];
  mode: AgentMode;
  status: Agent["status"];
  workingDirectory: string;
};

/** 「ボードのメンバー表」— 稼働中エージェントのフラットな一覧 */
export type ActiveOrganization = {
  savedAt: string;
  locale: AgentLocale;
  members: ActiveOrganizationMember[];
};

export type OrganizationInstruction = {
  agentId: string;
  agentName: string;
  workingDirectory: string;
  relativePath: string;
  content: string;
};

export type OrganizationBrief = OrganizationInstruction;

export type OrganizationSaveRequest = {
  agents: Agent[];
  locale?: AgentLocale;
};

export type OrganizationSaveResult = {
  organization: ActiveOrganization;
  briefs: OrganizationBrief[];
};

export type AgentRunRequest = {
  agentId: string;
  body: string;
  taskId: string;
  context: ContextSnapshot;
  /**
   * body をそのままプロンプトとして使い、単体エージェント用プロンプト組み立て
   * (artifact 誘導など) をバイパスする。付箋の「渡す」(assignNote) が使う。
   */
  rawPrompt?: boolean;
};

export type AgentRunResult =
  | { ok: true; lastMessage: string; exitCode: number; elapsedMs: number }
  | { ok: false; error: string };

export type PermissionRequestEvent = {
  requestId: string;
  agentId: string;
  agentName: string;
  toolName: string;
  input: unknown;
};

export type PermissionDecision = {
  allowed: boolean;
  reason?: string;
};

export type ToolCategory = "required" | "optional";

export type ToolInfo = {
  name: string;
  category: ToolCategory;
  available: boolean;
  version: string | null;
  why: string;
  install: {
    darwin: string;
    win32: string;
    linux: string;
  };
  autoInstall: { command: string; args: string[] } | null;
};

export type SetupCheckResult = {
  platform: "darwin" | "win32" | "linux" | string;
  tools: ToolInfo[];
};

export type InstallEvent =
  | { type: "stdout"; chunk: string }
  | { type: "stderr"; chunk: string }
  | { type: "exit"; code: number | null };

export type InstallProgress = {
  toolName: string;
  event: InstallEvent;
};

export type InstallResult =
  | { ok: true; alreadyInstalled?: boolean; exitCode?: number | null }
  | { ok: false; error: string };

// --- Sticky notes (付箋) — CONCEPT_v4: 貼る / 渡す (v11 で「会議にかける」は撤去) ---

export type StickyNoteStatus = "idle" | "running" | "done" | "error";

export type StickyNote = {
  id: string;
  text: string;
  position: { x: number; y: number };
  status: StickyNoteStatus;
  /** 「渡す」で単独実行したエージェント */
  assignedAgentId?: string;
  resultText?: string;
  resultError?: string;
  createdAt: string;
  updatedAt: string;
  /** 所属ボード。未設定は "default" 扱い */
  boardId?: string;
};

export type NotesSnapshot = { notes: StickyNote[] };

/**
 * 付箋の実行 (rawPrompt = exec の別プロセス) の出力を流す擬似ストリームID の接尾辞。
 *
 * 付箋の実行は interactive の tmux セッションとは**別プロセス**なので、同じ agentId の
 * ログに混ぜるとターミナルパネル (tmux の現在画面を描く) からは見えないまま消える。
 * `${agentId}${NOTE_STREAM_SUFFIX}` を別タブとして扱い、素のログとして描く。
 */
export const NOTE_STREAM_SUFFIX = "#note";

// --- Boards (案件ボード) — CONCEPT_v5 Phase 1: ウィンドウマネージャ。
// v6 の ProjectGroup (囲い) 導入により撤去済み。boards.json 後方互換・マイグレーション元としてだけ型を残す。

export type Board = {
  id: string;
  name: string;
  createdAt: string;
};

export type BoardsSnapshot = { boards: Board[]; activeBoardId: string | null };

// --- ProjectGroup (プロジェクト囲い) — v6: Figma Section / Miro Frame と同じモデル。
// キャンバスは1枚のみ。囲いの中に置かれたエージェントは、その囲いのフォルダで作業する。

export type ProjectGroup = {
  id: string;
  name: string;
  /**
   * この陣地の作業フォルダ (実在パス)。v7 (陣地ツリー化) 以降、新規作成時は必須
   * (フォルダを選ぶだけで作成する)。旧データに空文字が残っている場合があるため、
   * 型上は許容しつつ読み込み側でフォールバック処理する (utils/territoryTree.ts 参照)。
   */
  folderPath: string;
  /**
   * v8 で追加。最も近い**祖先陣地 (territory)** の id (中間の branch/root — フォルダ階層上は
   * 挟まるが陣地として追加されていないディレクトリ — は飛ばす)。祖先陣地が無ければ null/undefined。
   * 真実の情報源は folderPath (実フォルダの親子関係) 側にあり、この値は utils/territoryTree.ts の
   * buildTerritoryTree + deriveParentGroupIds の結果を都度書き戻すキャッシュ。v9 でも意味は不変
   * (レイアウトが包含から樹形図になっても、フォルダ階層上の「祖先陣地」という概念自体は変わらない)。
   */
  parentGroupId?: string | null;
  /**
   * v9 (樹形図モデル) 以降、**キャンバス上の絶対座標**。v8 (包含ネストモデル) では「親からの相対座標」
   * だったが、包含をやめて樹形図に変更したため絶対座標に戻した (utils/territoryTree.ts の
   * `layoutTree` 参照)。ドラッグで手動移動できる (moveTerritory)。
   */
  position: { x: number; y: number };
  /**
   * 陣地の大きさ。手動リサイズは無く、常に utils/territoryTree.ts の計算結果
   * (陣地の色付きボックスの表示サイズ) のキャッシュとして書き込まれる。
   */
  size: { width: number; height: number };
  createdAt: string;
};

export type ProjectGroupsSnapshot = { groups: ProjectGroup[] };

// --- Attention Inbox — CONCEPT_v5 Phase 1: 人間の判断が要るものの横断キュー ---

export type InboxItemKind =
  | "permission"
  | "agent-error"
  | "note-done"
  | "note-error"
  | "cwd-changed";

export type InboxItem = {
  id: string;
  kind: InboxItemKind;
  agentId?: string;
  noteId?: string;
  /** 例: agent名 */
  title: string;
  /** 例: toolName + 入力要約 / エラー文 / 結果要約 (200字まで) */
  body: string;
  at: number;
  read: boolean;
  /** permission のみ: 応答に必要 */
  permissionRequestId?: string;
  /** permission のみ: 応答済みになったら true */
  resolved?: boolean;
};

// IPC 契約 — Pane2(frontend) と Pane3(backend) はこれをimportして使う
export type IpcChannels = {
  "mao:notes:load": () => Promise<NotesSnapshot>;
  "mao:notes:save": (snapshot: NotesSnapshot) => Promise<void>;
  "mao:boards:load": () => Promise<BoardsSnapshot>;
  "mao:boards:save": (snapshot: BoardsSnapshot) => Promise<void>;
  "mao:groups:load": () => Promise<ProjectGroupsSnapshot>;
  "mao:groups:save": (snapshot: ProjectGroupsSnapshot) => Promise<void>;
  "mao:dialog:pickDirectory": () => Promise<string | null>;
  "mao:agent:list": () => Promise<Agent[]>;
  "mao:agent:save": (agent: Agent) => Promise<Agent>;
  "mao:agent:delete": (id: string) => Promise<void>;
  "mao:agent:run": (request: AgentRunRequest) => Promise<AgentRunResult>;
  "mao:agent:abort": (agentId: string) => Promise<boolean>;
  "mao:agent:abortAll": () => Promise<boolean>;
  "mao:agent:loadSummary": (agentId: string) => Promise<AgentSummary | null>;
  "mao:agent:appendHistory": (agentId: string, entry: AgentHistoryEntry) => Promise<void>;
  "mao:project:loadSummary": () => Promise<string>;
  "mao:project:saveSummary": (text: string) => Promise<void>;
  "mao:planner:ask": (message: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  "mao:organization:save": (request: OrganizationSaveRequest) => Promise<OrganizationSaveResult>;
  "mao:graph:load": () => Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }>;
  "mao:graph:save": (graph: { nodes: GraphNode[]; edges: GraphEdge[] }) => Promise<void>;
  "mao:task:create": (task: Task) => Promise<Task>;
  "mao:task:list": () => Promise<Task[]>;
  "mao:pty:spawn": (agentId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  "mao:pty:write": (agentId: string, data: string) => Promise<void>;
  "mao:pty:kill": (agentId: string) => Promise<void>;
  "mao:pty:resize": (agentId: string, cols: number, rows: number) => Promise<void>;
  "mao:log:append": (agentId: string, data: string) => Promise<void>;
  "mao:permission:respond": (requestId: string, decision: PermissionDecision) => Promise<boolean>;
  "mao:tmux:watch": (agentId: string) => Promise<boolean>;
  "mao:tmux:snapshot": (agentId: string) => Promise<string | null>;
  "mao:setup:check": () => Promise<SetupCheckResult>;
  "mao:setup:install": (toolName: string) => Promise<InstallResult>;
  "mao:setup:installCancel": (toolName: string) => Promise<boolean>;
};

export type PtyDataEvent = { agentId: string; data: string };
export type PtyStatusEvent = { agentId: string; status: Agent["status"] };
