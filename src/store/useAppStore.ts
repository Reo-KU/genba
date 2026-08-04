import { create } from "zustand";
import type {
  Agent,
  AgentHistoryEntry,
  AgentLocale,
  AgentMode,
  AgentRunRequest,
  AgentRunResult,
  AgentSummary,
  ActiveOrganization,
  BoardsSnapshot,
  ContextSnapshot,
  InboxItem,
  NotesSnapshot,
  PermissionDecision,
  PermissionRequestEvent,
  ProjectGroup,
  ProjectGroupsSnapshot,
  StickyNote,
  GraphEdge,
  GraphNode,
  OrganizationSaveRequest,
  OrganizationSaveResult,
  Task,
  TaskState
} from "../types";
import { detectInitialLocale, setStoredLocale } from "../i18n";
import { buildActiveOrganization } from "../utils/organization";
import {
  buildTerritoryTree,
  deriveParentGroupIds,
  layoutTree,
  type TerritoryLayoutEdge,
  type TerritoryLayoutNode,
  type TerritoryTreeNode
} from "../utils/territoryTree";
import { stripAnsi } from "../utils/stripAnsi";

/** graph.load/save の IPC 契約は後方互換のため edges を持つが、保存時は常に [] を書く */
type GraphSnapshot = { nodes: GraphNode[]; edges: GraphEdge[] };
/** pushInboxItem に渡す入力。id/at/read は action 側で自動採番する */
type InboxItemInput = Omit<InboxItem, "id" | "at" | "read">;

let graphSaveTimer: ReturnType<typeof setTimeout> | undefined;
let notesSaveTimer: ReturnType<typeof setTimeout> | undefined;
let groupsSaveTimer: ReturnType<typeof setTimeout> | undefined;
let listenersRegistered = false;
const cancelledTaskIds = new Set<string>();
/** 「今やっていること1行」更新の agent ごと3秒スロットル用 */
const lastActivityUpdateAt = new Map<string, number>();

const fallbackMao = {
  agent: {
    list: async (): Promise<Agent[]> => [],
    save: async (agent: Agent): Promise<Agent> => agent,
    delete: async (): Promise<void> => undefined,
    run: async (_request: AgentRunRequest): Promise<AgentRunResult> => ({
      ok: false,
      error: "window.mao.agent.run is not available."
    }),
    abort: async (_agentId: string): Promise<boolean> => false,
    abortAll: async (): Promise<boolean> => false,
    loadSummary: async (_agentId: string): Promise<AgentSummary | null> => null,
    appendHistory: async (_agentId: string, _entry: AgentHistoryEntry): Promise<void> => undefined
  },
  project: {
    loadSummary: async (): Promise<string> => "",
    saveSummary: async (_text: string): Promise<void> => undefined
  },
  organization: {
    save: async (request: OrganizationSaveRequest): Promise<OrganizationSaveResult> => ({
      organization: buildActiveOrganization(request),
      briefs: []
    })
  },
  graph: {
    load: async (): Promise<GraphSnapshot> => ({ nodes: [], edges: [] }),
    save: async (): Promise<void> => undefined
  },
  task: {
    create: async (task: Task): Promise<Task> => task,
    list: async (): Promise<Task[]> => []
  },
  pty: {
    spawn: async (): Promise<{ ok: true } | { ok: false; error: string }> => ({ ok: true }),
    write: async (): Promise<void> => undefined,
    kill: async (): Promise<void> => undefined
  },
  log: {
    append: async (_agentId: string, _data: string): Promise<void> => undefined
  },
  notes: {
    load: async (): Promise<NotesSnapshot> => ({ notes: [] }),
    save: async (_snapshot: NotesSnapshot): Promise<void> => undefined
  },
  boards: {
    load: async (): Promise<BoardsSnapshot> => ({ boards: [], activeBoardId: null }),
    save: async (_snapshot: BoardsSnapshot): Promise<void> => undefined
  },
  groups: {
    load: async (): Promise<ProjectGroupsSnapshot> => ({ groups: [] }),
    save: async (_snapshot: ProjectGroupsSnapshot): Promise<void> => undefined
  },
  dialog: {
    pickDirectory: async (): Promise<string | null> => null
  },
  permission: {
    respond: async (_requestId: string, _decision: PermissionDecision): Promise<boolean> => false,
    onRequest: (): (() => void) => () => undefined
  },
  onPtyData: (): (() => void) => () => undefined,
  onPtyStatus: (): (() => void) => () => undefined
};

const mao = () => window.mao ?? fallbackMao;
export const ORGANIZATION_PLANNER_AGENT_ID = "__mao_org_planner__";

const createId = (prefix: string): string =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

// --- PTY 出力のバッファリング ---
// interactive エージェントは TUI の再描画で毎秒何十チャンクも吐く。届いた端から store に
// 書き戻すと配列コピー・再レンダリング・ディスク IPC がその回数だけ走り、エージェントを
// 増やすほど描画が詰まる。フレーム単位でまとめ、保持数にも上限をつける。

/** agent 1体あたりに保持するチャンク数の上限。超えた分は古い方から捨てる。 */
const MAX_LOG_CHUNKS = 400;
const LOG_FLUSH_INTERVAL_MS = 50;
const pendingLogChunks = new Map<string, string[]>();
let logFlushHandle: ReturnType<typeof setTimeout> | null = null;

const flushLogChunks = (): void => {
  logFlushHandle = null;
  if (pendingLogChunks.size === 0) {
    return;
  }

  const batch = new Map(pendingLogChunks);
  pendingLogChunks.clear();

  useAppStore.setState((state) => {
    const logs = { ...state.logs };
    const logSeq = { ...state.logSeq };

    for (const [agentId, chunks] of batch) {
      const merged = [...(logs[agentId] ?? []), ...chunks];
      logs[agentId] = merged.length > MAX_LOG_CHUNKS ? merged.slice(-MAX_LOG_CHUNKS) : merged;
      logSeq[agentId] = (logSeq[agentId] ?? 0) + chunks.length;
    }

    return { logs, logSeq };
  });

  // 永続化も 1 バッチ 1 往復にまとめる (中身は結局ただの追記なので結合して問題ない)。
  for (const [agentId, chunks] of batch) {
    mao()
      .log.append(agentId, chunks.join(""))
      .catch(() => undefined);
  }
};

const enqueueLogChunk = (agentId: string, data: string): void => {
  const queue = pendingLogChunks.get(agentId);
  if (queue) {
    queue.push(data);
    // ウィンドウを最小化しているとタイマーが 1 秒程度まで間引かれる。その間に
    // 溜まりすぎないよう、どうせ捨てる分はキューの段階で落とす。
    if (queue.length > MAX_LOG_CHUNKS) {
      queue.splice(0, queue.length - MAX_LOG_CHUNKS);
    }
  } else {
    pendingLogChunks.set(agentId, [data]);
  }

  if (logFlushHandle === null) {
    // requestAnimationFrame ではなく setTimeout。最小化中は rAF が止まるが、
    // MAO は「重いときは最小化して放置」という使い方をするので止まっては困る。
    logFlushHandle = setTimeout(flushLogChunks, LOG_FLUSH_INTERVAL_MS);
  }
};

// isRoot は graph.json 後方互換のためだけの型フィールドで、アプリはもう読まない (常に false で書く)。
// boardId も同様に後方互換のためだけの型フィールドで、新規作成物には入れない。
const createNodeForAgent = (agentId: string, index: number): GraphNode => ({
  id: createId("node"),
  agentId,
  position: {
    x: 80 + (index % 3) * 240,
    y: 80 + Math.floor(index / 3) * 150
  },
  isRoot: false,
  groupId: null
});

const DEFAULT_GROUP_SIZE = { width: 520, height: 360 };
const GROUP_MIGRATION_PADDING = 80;

/** フォルダのパスから basename を取り出す。renderer バンドルなので node:path は使わず自前で実装する。 */
const basenameOfPath = (rawPath: string): string => {
  const trimmed = rawPath.replace(/[/\\]+$/, "");
  const idx = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"));
  return idx >= 0 ? trimmed.slice(idx + 1) : trimmed;
};

// --- 陣地ツリー (v9 樹形図モデル) 用のヘルパー ---
// buildTerritoryTree/layoutTree は utils/territoryTree.ts の純関数。v9 は座標が絶対座標に戻り、
// 陣地のサイズも常に固定値 (中身を包含する必要が無くなった) になったため、v8 にあった
// 「陣地だけの増分配置 (findFreeSlotInParent)」「親チェーンを積み上げて絶対座標化する」といった
// ヘルパーは不要になった。構造 (陣地の追加・削除・フォルダ変更・所属変更) が変わる操作は
// すべて下記 `arrangeAll` (buildTerritoryTree + layoutTree によるフルリフロー) を呼ぶだけにして、
// 「その陣地だけの空き位置を計算する」複雑な増分ロジックは持たない (詳細は arrangeAll のコメント参照)。
// 手動ドラッグ (moveTerritory / updateNodePosition) だけは arrangeAll を呼ばず、絶対座標をそのまま
// 保存する (手動配置を維持するため)。

/**
 * 「整理」ボタンの本体。buildTerritoryTree + layoutTree で陣地・エージェントの絶対座標・サイズ・
 * colorIndex・線 (edge) をフルリフローする。v9 では陣地のサイズが常に固定値になったため、
 * 「追加・削除のたびに軽量な再計算をする」意味がほぼ無くなった (サイズは変わらないし、位置も
 * 樹形図全体で一貫させないと親子関係の線がおかしくなる)。そのため v8 の `recomputeDerivedLayout`
 * (既存の手動配置を尊重する軽量な再計算) は廃止し、**構造が変わる操作は全て `arrangeAll` を呼ぶ**
 * 方針に統一した (陣地の追加・削除・フォルダ変更・所属変更)。手動ドラッグ (陣地自身の移動・
 * 同じ陣地内でのエージェント移動) はこれを呼ばず、絶対座標をそのまま保存する。
 */
const runArrangeAll = (get: () => AppState, set: (updater: Partial<AppState>) => void): void => {
  const state = get();

  const agentNodeIdsByGroupId: Record<string, string[]> = {};
  for (const node of state.nodes) {
    if (!node.groupId) {
      continue;
    }
    (agentNodeIdsByGroupId[node.groupId] ??= []).push(node.id);
  }

  const tree = buildTerritoryTree(state.projectGroups);
  const parentGroupIds = deriveParentGroupIds(tree);
  // DOM 実測サイズを渡すインフラは無いため、既定値 (260x180) を全エージェントに使う
  // (utils/territoryTree.ts の AGENT_CARD_WIDTH/HEIGHT は running 中の最大ケースに合わせてある)。
  // v10: 展開中の陣地 (expandedGroupIds) だけがヘッダ+エージェント格子の可変サイズになり、
  // その陣地の直属エージェントの絶対座標が agentPositions に返る (折りたたみ中の陣地のエージェントは
  // 含まれないので、その GraphNode.position は前回の値のまま = 下の map で書き換わらない)。
  const { nodes: layoutNodes, agentPositions, edges: territoryLayoutEdges } = layoutTree(
    tree,
    agentNodeIdsByGroupId,
    {},
    state.expandedGroupIds
  );

  const territoryNodesByGroupId = new Map(
    layoutNodes
      .filter((node): node is TerritoryLayoutNode & { groupId: string } => node.kind === "territory" && Boolean(node.groupId))
      .map((node) => [node.groupId, node])
  );

  const groups = state.projectGroups.map((group) => {
    const box = territoryNodesByGroupId.get(group.id);
    return {
      ...group,
      parentGroupId: parentGroupIds[group.id] ?? null,
      position: box?.position ?? group.position,
      size: box?.size ?? group.size
    };
  });

  const nodes = state.nodes.map((node) => (agentPositions[node.id] ? { ...node, position: agentPositions[node.id] } : node));

  set({ projectGroups: groups, nodes, territoryTree: tree, territoryLayoutNodes: layoutNodes, territoryLayoutEdges });
  saveGroupsDebounced(groups);
  saveGraphDebounced({ nodes, edges: [] });
};

/** 種類ごとの表示名 (createAgentInTerritory の連番のベース)。AgentForm の自動命名とも共有する。 */
export const AGENT_TYPE_LABEL: Record<Agent["type"], string> = {
  claude: "Claude",
  codex: "Codex",
  gemini: "Gemini",
  grok: "Grok",
  custom: "Custom"
};

/** 種類から command を導出する。custom のみ後から設定が必要なので空文字のまま。AgentForm でも共有する。 */
export const AGENT_TYPE_COMMAND: Record<Agent["type"], string> = {
  claude: "claude",
  codex: "codex",
  gemini: "gemini",
  grok: "grok",
  custom: ""
};

const saveNotesDebounced = (notes: StickyNote[]): void => {
  if (notesSaveTimer) {
    clearTimeout(notesSaveTimer);
  }

  notesSaveTimer = setTimeout(() => {
    void mao().notes.save({ notes }).catch((error) => {
      console.error("Failed to save notes", error);
    });
  }, 500);
};

const buildNotePrompt = (locale: AgentLocale, text: string): string =>
  locale === "en"
    ? `Complete the following task.\n\n${text}\n\nWhen finished, reply with a concise summary of the result (5 lines max).`
    : `次のタスクを実行してください。\n\n${text}\n\n完了したら、結果の要約を簡潔に (5行以内で) 返答してください。`;

const saveGraphDebounced = (graph: GraphSnapshot): void => {
  if (graphSaveTimer) {
    clearTimeout(graphSaveTimer);
  }

  graphSaveTimer = setTimeout(() => {
    void mao().graph.save(graph).catch((error) => {
      console.error("Failed to save graph", error);
    });
  }, 500);
};

const saveGroupsDebounced = (groups: ProjectGroup[]): void => {
  if (groupsSaveTimer) {
    clearTimeout(groupsSaveTimer);
  }

  groupsSaveTimer = setTimeout(() => {
    void mao().groups.save({ groups }).catch((error) => {
      console.error("Failed to save groups", error);
    });
  }, 500);
};

const submitToAgent = async (agentId: string, payload: string): Promise<void> => {
  await mao().pty.write(agentId, payload);
  // Submit as a separate keystroke. TUI clients like Codex can treat batched
  // "\r" as paste-newline instead of form submission.
  await new Promise((resolve) => setTimeout(resolve, 600));
  await mao().pty.write(agentId, "\r");
};

/** 単体実行 1 回分の結果。旧・階層 dispatch 時代の emittedDispatches は撤去した。 */
type ExecutionReport = {
  agentId: string;
  agentName: string;
  receivedBody: string;
  lastMessage: string;
  artifacts: string[];
  elapsedMs: number;
};

const extractArtifactPaths = (text: string): string[] => {
  const matches = text.match(/(?:^|\s)(?:\.\/)?mao_artifacts\/[^\s"'`<>),]+/g) ?? [];
  return [...new Set(matches.map((item) => item.trim().replace(/^\.\//, "")))];
};

type AppState = {
  agents: Agent[];
  nodes: GraphNode[];
  tasks: Task[];
  selectedNodeId: string | null;
  selectedAgentId: string | null;
  logs: Record<string, string[]>;
  /**
   * agent ごとの「これまでに届いたチャンク総数」。logs はリングバッファで古いものを捨てるので
   * 配列長では「どこまで描いたか」を判定できない。表示側はこの単調増加カウンタを見る。
   */
  logSeq: Record<string, number>;
  runningTaskId: string | null;
  introducedAgents: Set<string>;
  organizationSaving: boolean;
  organizationError: string | null;
  activeOrganization: ActiveOrganization | null;
  organizationBriefs: Record<string, string>;
  plannerStatus: Agent["status"];
  locale: AgentLocale;
  setLocale: (locale: AgentLocale) => void;
  loadAll: () => Promise<void>;
  addAgent: (agent: Agent) => Promise<void>;
  updateAgent: (agent: Agent) => Promise<void>;
  deleteAgent: (agentId: string) => Promise<void>;
  addNode: (agentId: string) => Promise<void>;
  updateNodePosition: (nodeId: string, position: GraphNode["position"]) => void;
  removeNode: (nodeId: string) => Promise<void>;
  selectNode: (nodeId: string | null) => void;
  setSelectedAgentId: (agentId: string | null) => void;
  appendLog: (agentId: string, data: string) => void;
  ensureAgentReady: (agentId: string) => Promise<void>;
  startAgent: (agentId: string) => Promise<void>;
  stopAgent: (agentId: string) => Promise<void>;
  saveOrganization: () => Promise<void>;
  /** 指定した単一エージェントを実行する。旧・root からの階層 dispatch は撤去済み */
  runTask: (input: { title: string; body: string; agentId: string }) => Promise<void>;
  dispatchToAgent: (agentId: string, body: string) => Promise<void>;
  cancelCurrentTask: () => Promise<void>;
  terminalDrawerOpen: boolean;
  setTerminalDrawerOpen: (open: boolean) => void;
  notes: StickyNote[];
  addNote: (position: { x: number; y: number }) => void;
  updateNoteText: (noteId: string, text: string) => void;
  moveNote: (noteId: string, position: { x: number; y: number }) => void;
  deleteNote: (noteId: string) => void;
  assignNote: (noteId: string, agentId: string) => Promise<void>;

  // --- ProjectGroup (陣地) — v9: 「樹形図 (マインドマップ)」モデル。包含 (parentNode) をやめ、
  // 根 (/Users) → フォルダ (色付きボックス) → エージェント (葉) を線 (edge) で結ぶ形に変更した。
  // 陣地・エージェントの座標は絶対座標。陣地の手動移動 (moveTerritory) とエージェントの手動移動
  // (updateNodePosition) はどちらも `arrangeAll` を呼ばずその場で絶対座標を保存するだけ (手動配置を
  // 維持するため)。一方、陣地の追加・削除・フォルダ変更・所属変更は構造 (ツリー形状・線) が変わるため
  // 常に `arrangeAll` (フルリフロー) を呼ぶ方針にした (utils/territoryTree.ts の `layoutTree` 参照)。
  projectGroups: ProjectGroup[];
  /** 低レベルAPI。フォルダ未指定 (空文字) での作成は不可。addTerritory の内部実装として使う。
   * 呼び出し後に `arrangeAll` (フルリフロー) を呼ぶ。 */
  addProjectGroup: (input: {
    name: string;
    folderPath: string;
    position: { x: number; y: number };
    size?: { width: number; height: number };
    parentGroupId?: string | null;
  }) => Promise<void>;
  /** 陣地の新規作成。window.mao.dialog.pickDirectory() でフォルダを選ぶだけで作成できる (必須項目なし)。
   * 既に同じ folderPath の陣地があれば新規作成せずその陣地を focus する (重複防止)。 */
  addTerritory: () => Promise<void>;
  renameProjectGroup: (id: string, name: string) => Promise<void>;
  /** フォルダ変更。所属エージェントの cwd も一括更新する。フォルダが変わると陣地ツリー上の親
   * (= 樹形図上の位置) が変わりうるため `arrangeAll` を呼ぶ。 */
  setProjectGroupFolder: (id: string, folderPath: string) => Promise<void>;
  /** 陣地を削除する。中のエージェント・子陣地は残し、削除された陣地の親へ引き上げてから
   * `arrangeAll` を呼ぶ。workingDirectory は直前のフォルダを維持する。 */
  deleteProjectGroup: (id: string) => Promise<void>;
  /** Inspector の「プロジェクト」欄、またはキャンバス上のドラッグ (ドロップ先に近いフォルダへの
   * 割り当て) から呼ぶ。所属 (線の接続先) が変わるため `arrangeAll` を呼ぶ。 */
  assignNodeToGroup: (nodeId: string, groupId: string | null) => Promise<void>;
  /** 陣地の手動移動 (ドラッグ)。絶対座標をそのまま保存するだけで `arrangeAll` は呼ばない
   * (手動配置を維持するため)。 */
  moveTerritory: (groupId: string, position: { x: number; y: number }) => void;
  /** 「整理」ボタン。buildTerritoryTree + layoutTree で全陣地・全エージェントの絶対座標・サイズ・
   * 線 (edge) をフルリフローし、手動配置を含めて完全に整列し直す。 */
  arrangeAll: () => void;
  /** 陣地内へのエージェント作成。必須はエージェントの種類のみ。name は連番、command は種類から自動導出、
   * workingDirectory はその陣地の folderPath を継承する。作成後に `arrangeAll` を呼び、
   * 樹形図上の空いた葉の位置へ配置する。 */
  /** 種類は作成時に聞かず、既定 (claude) で作ってから設定ウィンドウで変更させる。 */
  createAgentInTerritory: (groupId: string, type?: Agent["type"]) => Promise<void>;
  /** buildTerritoryTree の結果。UI が枝ノード・根ノードを描画するのに使う */
  territoryTree: TerritoryTreeNode | null;
  /** 陣地・枝ノード・根ノードすべての絶対座標・サイズ・colorIndex。UI はこれをそのまま
   * React Flow の絶対 position/style(width/height) に変換する
   * (エージェントノードは nodes[].position をそのまま使う)。 */
  territoryLayoutNodes: TerritoryLayoutNode[];
  /** 根→フォルダ、フォルダ→エージェントを結ぶ線。UI が React Flow の edges にそのまま変換する。 */
  territoryLayoutEdges: TerritoryLayoutEdge[];
  /** 直前に「新規作成された」陣地のid。UI はこれを見て名前のインライン編集状態に入る。
   * 読み込み時の projectGroups 増加を新規作成と誤検知しないよう、作成経路でのみ立てる。 */
  pendingEditGroupId: string | null;
  clearPendingEditGroupId: () => void;

  // --- v10: フォルダ展開モデル。展開中の陣地 (groupId) の集合。UI 状態のみで永続化はしない
  // (groups.json には混ぜない。起動時は常に空 = 全て折りたたみ)。展開/折りたたみは陣地ボックスの
  // サイズ (延いては樹形図全体のレイアウト) を変えるため、`toggleGroupExpanded` は内部で
  // `arrangeAll` を呼んでフルリフローする (陣地の追加・削除等、他の構造変更操作と同じ方針)。
  expandedGroupIds: Set<string>;
  toggleGroupExpanded: (groupId: string) => void;

  // --- ProjectGroup UI 連携 (UI-only) ---
  // React Flow のインスタンスは MindMapCanvas 内の ReactFlowProvider にローカルなため、
  // Sidebar からキャンバス操作 (パン/ズーム・囲い作成) を依頼するときはこの信号を使う。
  // MindMapCanvas 側が変化を監視し、実際の reactFlow 操作を行う。既存の Provider 構造は変えない。
  focusGroupId: string | null;
  requestFocusGroup: (id: string) => void;
  clearFocusGroup: () => void;
  addProjectGroupRequestId: number;
  requestAddProjectGroup: () => void;

  // --- Activity (エージェントが「今やっていること1行」) — CONCEPT_v5 Phase 1 ---
  activityByAgent: Record<string, { line: string; at: number }>;
  runningSince: Record<string, number | null>;

  // --- Attention Inbox — CONCEPT_v5 Phase 1 ---
  inboxItems: InboxItem[];
  inboxOpen: boolean;
  /** permission.onRequest を store 側でも並行購読して溜めるキュー (PermissionDialog の購読とは別系統) */
  pendingPermissionRequests: PermissionRequestEvent[];
  pushInboxItem: (item: InboxItemInput) => void;
  markInboxRead: (id: string) => void;
  markAllInboxRead: () => void;
  setInboxOpen: (open: boolean) => void;
  /** permission.respond を叩き、pendingPermissionRequests から除去し、対応する inbox item を resolved+read にする共通経路。PermissionDialog / Inbox の両方から使う。 */
  respondPermission: (requestId: string, allowed: boolean) => Promise<void>;
  respondPermissionFromInbox: (id: string, allowed: boolean) => Promise<void>;
};

export const useAppStore = create<AppState>((set, get) => ({
  agents: [],
  nodes: [],
  tasks: [],
  selectedNodeId: null,
  selectedAgentId: null,
  logs: {},
  logSeq: {},
  runningTaskId: null,
  terminalDrawerOpen: false,
  setTerminalDrawerOpen: (open) => set({ terminalDrawerOpen: open }),
  notes: [],
  projectGroups: [],
  territoryTree: null,
  territoryLayoutNodes: [],
  territoryLayoutEdges: [],
  pendingEditGroupId: null,
  clearPendingEditGroupId: () => set({ pendingEditGroupId: null }),
  expandedGroupIds: new Set<string>(),
  focusGroupId: null,
  requestFocusGroup: (id) => set({ focusGroupId: id }),
  clearFocusGroup: () => set({ focusGroupId: null }),
  addProjectGroupRequestId: 0,
  requestAddProjectGroup: () => set((current) => ({ addProjectGroupRequestId: current.addProjectGroupRequestId + 1 })),
  activityByAgent: {},
  runningSince: {},
  inboxItems: [],
  inboxOpen: false,
  pendingPermissionRequests: [],
  introducedAgents: new Set<string>(),
  organizationSaving: false,
  organizationError: null,
  activeOrganization: null,
  organizationBriefs: {},
  plannerStatus: "stopped",
  locale: detectInitialLocale(),

  setLocale: (locale) => {
    setStoredLocale(locale);
    set({ locale });
  },

  loadAll: async () => {
    if (!listenersRegistered) {
      listenersRegistered = true;
      mao().onPtyData((event) => {
        get().appendLog(event.agentId, event.data);

        // 「今やっていること1行」— PTYはANSIまみれ+各CLIで形式が違うため、
        // stripAnsi後の末尾非空行をそのまま出す素朴実装 (凝ったパースはしない)。agentごとに3秒スロットル。
        const now = Date.now();
        const lastUpdateAt = lastActivityUpdateAt.get(event.agentId) ?? 0;
        if (now - lastUpdateAt < 3000) {
          return;
        }
        const lines = stripAnsi(event.data)
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0);
        const lastLine = lines[lines.length - 1];
        if (!lastLine) {
          return;
        }
        lastActivityUpdateAt.set(event.agentId, now);
        const clippedLine = lastLine.length > 120 ? `${lastLine.slice(0, 120)}...` : lastLine;
        set((current) => ({
          activityByAgent: {
            ...current.activityByAgent,
            [event.agentId]: { line: clippedLine, at: now }
          }
        }));
      });
      mao().onPtyStatus((event) => {
        set((state) => {
          if (event.agentId === ORGANIZATION_PLANNER_AGENT_ID) {
            return { plannerStatus: event.status };
          }

          const agents = state.agents.map((agent) =>
            agent.id === event.agentId ? { ...agent, status: event.status } : agent
          );
          let introducedAgents = state.introducedAgents;

          if (
            (event.status === "stopped" || event.status === "error") &&
            introducedAgents.has(event.agentId)
          ) {
            introducedAgents = new Set(introducedAgents);
            introducedAgents.delete(event.agentId);
          }

          return {
            agents,
            introducedAgents
          };
        });

        if (event.agentId === ORGANIZATION_PLANNER_AGENT_ID) {
          return;
        }

        // 経過時間計測 (AgentCard 用): running 開始時刻を記録し、停止/エラーでクリア
        set((current) => ({
          runningSince: {
            ...current.runningSince,
            [event.agentId]: event.status === "running" ? Date.now() : null
          }
        }));

        if (event.status === "error") {
          const state = get();
          const agentName = state.agents.find((agent) => agent.id === event.agentId)?.name ?? event.agentId;
          const body =
            state.locale === "ja" ? `${agentName} でエラーが発生しました。` : `${agentName} encountered an error.`;
          get().pushInboxItem({
            kind: "agent-error",
            agentId: event.agentId,
            title: agentName,
            body
          });
        }
      });
      // permission.onRequest: PermissionDialog.tsx が既に直接購読して承認UIを出しているため、
      // その購読はそのまま残す (壊さない最優先)。ここでは store 側でも並行購読し、
      // pendingPermissionRequests に積みつつ Inbox にも通知するだけに留める。
      mao().permission.onRequest((event) => {
        set((current) => ({
          pendingPermissionRequests: [...current.pendingPermissionRequests, event]
        }));
        const state = get();
        const agentName = state.agents.find((agent) => agent.id === event.agentId)?.name ?? event.agentName;
        const inputSummary = JSON.stringify(event.input ?? {});
        get().pushInboxItem({
          kind: "permission",
          agentId: event.agentId,
          title: agentName,
          body: `${event.toolName}: ${inputSummary}`.slice(0, 200),
          permissionRequestId: event.requestId,
          resolved: false
        });
      });
    }

    const [agents, graph, tasks, notesSnapshot, boardsSnapshot, groupsSnapshot] = await Promise.all([
      mao().agent.list(),
      mao().graph.load(),
      mao().task.list(),
      mao().notes.load().catch((): NotesSnapshot => ({ notes: [] })),
      // boards.json はもうアプリの正典ではなく、初回だけの囲いマイグレーション元として読む (ロールバック用に残置)。
      mao().boards.load().catch((): BoardsSnapshot => ({ boards: [], activeBoardId: null })),
      mao().groups.load().catch((): ProjectGroupsSnapshot => ({ groups: [] }))
    ]);

    // graph.json の edges/isRoot は後方互換のためだけに読める形を残しているが、
    // 単体実行モデルではもう解釈しない (rootNode/階層の概念なし)。
    const existingAgentIds = new Set(graph.nodes.map((node) => node.agentId));
    const missingNodes = agents
      .filter((agent) => !existingAgentIds.has(agent.id))
      .map((agent, index) => createNodeForAgent(agent.id, graph.nodes.length + index));

    let nodes = [...graph.nodes, ...missingNodes];
    let groups = groupsSnapshot.groups;
    let groupsChanged = false;

    // 旧ボード概念からの一括マイグレーション (1度だけ): groups.json が空 かつ boards.json に
    // 2枚以上のボードがある場合、各ボードにつき囲いを1つ作る。ボードが1枚(default のみ)なら
    // 全部フラットな1枚のマップのままにする (囲いは作らない)。
    if (groups.length === 0 && boardsSnapshot.boards.length >= 2) {
      const agentsById = new Map(agents.map((agent) => [agent.id, agent]));
      const migratedGroups: ProjectGroup[] = [];
      const nodeGroupAssignments = new Map<string, string>();

      for (const board of boardsSnapshot.boards) {
        const boardNodes = nodes.filter((node) => (node.boardId ?? "default") === board.id);
        if (boardNodes.length === 0) {
          continue;
        }

        const xs = boardNodes.map((node) => node.position.x);
        const ys = boardNodes.map((node) => node.position.y);
        const minX = Math.min(...xs) - GROUP_MIGRATION_PADDING;
        const minY = Math.min(...ys) - GROUP_MIGRATION_PADDING;
        const maxX = Math.max(...xs) + GROUP_MIGRATION_PADDING;
        const maxY = Math.max(...ys) + GROUP_MIGRATION_PADDING;
        const width = Math.max(maxX - minX, DEFAULT_GROUP_SIZE.width);
        const height = Math.max(maxY - minY, DEFAULT_GROUP_SIZE.height);

        // 最も多い workingDirectory を採用 (同数なら最初に見つかったもの)
        const workingDirectoryCounts = new Map<string, number>();
        for (const node of boardNodes) {
          const workingDirectory = agentsById.get(node.agentId)?.workingDirectory;
          if (!workingDirectory) continue;
          workingDirectoryCounts.set(workingDirectory, (workingDirectoryCounts.get(workingDirectory) ?? 0) + 1);
        }
        let folderPath = "";
        let bestCount = 0;
        for (const [workingDirectory, count] of workingDirectoryCounts) {
          if (count > bestCount) {
            bestCount = count;
            folderPath = workingDirectory;
          }
        }

        const group: ProjectGroup = {
          id: createId("group"),
          name: board.name,
          folderPath,
          position: { x: minX, y: minY },
          size: { width, height },
          createdAt: new Date().toISOString()
        };
        migratedGroups.push(group);
        for (const node of boardNodes) {
          nodeGroupAssignments.set(node.id, group.id);
        }
      }

      if (migratedGroups.length > 0) {
        groups = migratedGroups;
        nodes = nodes.map((node) =>
          nodeGroupAssignments.has(node.id) ? { ...node, groupId: nodeGroupAssignments.get(node.id) } : node
        );
        groupsChanged = true;
      }
    }

    set({
      agents,
      nodes,
      tasks,
      notes: notesSnapshot.notes,
      projectGroups: groups,
      selectedNodeId: nodes[0]?.id ?? null
    });

    if (missingNodes.length > 0 || groupsChanged) {
      saveGraphDebounced({ nodes: get().nodes, edges: [] });
    }
    if (groupsChanged) {
      void mao().groups.save({ groups }).catch((error) => {
        console.error("Failed to save groups", error);
      });
    }

    // 後方互換の判断: groups.json/graph.json の座標は v7 以前の絶対座標かもしれないし、v8 で書かれた
    // 相対座標かもしれない。読み込み時点ではどちらか判別できない (バージョンを記録していない) ため、
    // 単純化として「起動時は必ず arrangeAll (フルリフロー) を1回実行して座標を作り直す」方式にする。
    // 相対座標として解釈すると破綻する旧データを安全に成仏させつつ、実装を複雑にしない。
    get().arrangeAll();
  },

  addAgent: async (agent) => {
    const savedAgent = await mao().agent.save(agent);
    set((state) => {
      const agents = [...state.agents.filter((item) => item.id !== savedAgent.id), savedAgent];
      const hasNode = state.nodes.some((node) => node.agentId === savedAgent.id);
      const node = hasNode ? undefined : createNodeForAgent(savedAgent.id, state.nodes.length);
      const nodes = node ? [...state.nodes, node] : state.nodes;
      return {
        agents,
        nodes,
        selectedNodeId: state.selectedNodeId ?? node?.id ?? null,
        selectedAgentId: state.selectedAgentId ?? savedAgent.id
      };
    });
    saveGraphDebounced({ nodes: get().nodes, edges: [] });
  },

  updateAgent: async (agent) => {
    const savedAgent = await mao().agent.save(agent);
    set((state) => ({
      agents: state.agents.map((item) => (item.id === savedAgent.id ? savedAgent : item))
    }));
  },

  deleteAgent: async (agentId) => {
    await mao().agent.delete(agentId);
    set((state) => {
      const removedNodeIds = new Set(
        state.nodes.filter((node) => node.agentId === agentId).map((node) => node.id)
      );
      const nodes = state.nodes.filter((node) => node.agentId !== agentId);
      return {
        agents: state.agents.filter((agent) => agent.id !== agentId),
        nodes,
        selectedNodeId:
          state.selectedNodeId && removedNodeIds.has(state.selectedNodeId) ? nodes[0]?.id ?? null : state.selectedNodeId,
        selectedAgentId: state.selectedAgentId === agentId ? null : state.selectedAgentId,
        logs: Object.fromEntries(Object.entries(state.logs).filter(([id]) => id !== agentId)),
        logSeq: Object.fromEntries(Object.entries(state.logSeq).filter(([id]) => id !== agentId))
      };
    });
    pendingLogChunks.delete(agentId);
    saveGraphDebounced({ nodes: get().nodes, edges: [] });
    // 陣地の表示 (稼働数バッジ・展開中の並び) を削除後の実態に合わせる。
    get().arrangeAll();
  },

  addNode: async (agentId) => {
    set((state) => {
      const node = createNodeForAgent(agentId, state.nodes.length);
      return {
        nodes: [...state.nodes, node],
        selectedNodeId: node.id,
        selectedAgentId: agentId
      };
    });
    saveGraphDebounced({ nodes: get().nodes, edges: [] });
  },

  // エージェントカードの手動移動 (ドラッグ) はこの既存アクションを流用する (moveNode 相当)。
  // v9 では position は常にキャンバス上の絶対座標。陣地のサイズはもう中身に依存しない固定値なので
  // (包含をやめたため)、単純に座標を保存するだけでよい (`arrangeAll` は呼ばない = 手動配置を維持する)。
  updateNodePosition: (nodeId, position) => {
    set((state) => ({
      nodes: state.nodes.map((node) => (node.id === nodeId ? { ...node, position } : node))
    }));
    saveGraphDebounced({ nodes: get().nodes, edges: [] });
  },

  removeNode: async (nodeId) => {
    set((state) => {
      const nodes = state.nodes.filter((node) => node.id !== nodeId);
      return {
        nodes,
        selectedNodeId: state.selectedNodeId === nodeId ? nodes[0]?.id ?? null : state.selectedNodeId,
        selectedAgentId: state.selectedNodeId === nodeId ? nodes[0]?.agentId ?? null : state.selectedAgentId
      };
    });
    saveGraphDebounced({ nodes: get().nodes, edges: [] });
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  setSelectedAgentId: (agentId) => set({ selectedAgentId: agentId }),

  appendLog: (agentId, data) => {
    // TUI エージェントは再描画のたびに小さなチャンクを大量に吐く。1 チャンクごとに
    // set() すると (a) logs 配列を丸ごとコピーし直し、(b) 購読側が全部再レンダリングされ、
    // (c) ディスク書き込みの IPC が 1 往復ずつ走る。エージェントが増えるほど二乗で効く
    // ので、フレーム単位でまとめてから 1 回だけ流す。
    enqueueLogChunk(agentId, data);

    // Live streaming dispatch was disabled. Dispatch now happens once at end-of-task
    // in executeForAgent (after runInteractive's signal is received). Streaming caused
    // duplicate dispatches because the regex body capture grew with each chunk, and
    // because the spec file's historical [TO: workerN] markers get echoed in the TUI
    // buffer.
  },

  ensureAgentReady: async (agentId) => {
    const state = get();
    const agent = state.agents.find((item) => item.id === agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    const mode: AgentMode = agent.mode ?? "exec";
    if (mode === "exec") {
      return;
    }

    if (agent.status !== "running") {
      set((current) => ({
        agents: current.agents.map((item) =>
          item.id === agentId ? { ...item, status: "starting" } : item
        )
      }));
    }

    const result = await mao().pty.spawn(agentId);
    if (!result.ok) {
      set((current) => ({
        agents: current.agents.map((item) =>
          item.id === agentId ? { ...item, status: "error" } : item
        )
      }));
      throw new Error(result.error);
    }

    if (agent.status !== "running") {
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    // 旧 buildAgentIntro による heavy 初期化メッセージは廃止。
    // 各タスクは agentRunner.runInteractive 経由で適切な natural-language プロンプトを受け取る。
    // claude TUI は heavy 初期化を injection と判定する問題があったため、PTY 起動だけで終了。
    set((current) => ({
      introducedAgents: new Set([...current.introducedAgents, agentId])
    }));
  },

  startAgent: async (agentId) => {
    const agent = get().agents.find((item) => item.id === agentId);
    if ((agent?.mode ?? "exec") === "exec") {
      return;
    }
    await get().ensureAgentReady(agentId);
  },

  stopAgent: async (agentId) => {
    const agent = get().agents.find((item) => item.id === agentId);
    if ((agent?.mode ?? "exec") === "exec") {
      return;
    }
    await mao().pty.kill(agentId);
    pendingLogChunks.delete(agentId);
    set((state) => ({
      agents: state.agents.map((agent) =>
        agent.id === agentId ? { ...agent, status: "stopped" } : agent
      ),
      introducedAgents: new Set([...state.introducedAgents].filter((id) => id !== agentId)),
      logs: { ...state.logs, [agentId]: [] },
      // 0 に戻すことで、購読側 (TerminalPanel) が「巻き戻った = クリアされた」と判定できる。
      logSeq: { ...state.logSeq, [agentId]: 0 }
    }));
  },

  saveOrganization: async () => {
    const state = get();
    set({ organizationSaving: true, organizationError: null });

    try {
      // graph.json は座標保存専用になった。edges は後方互換のためだけの空配列で書く。
      await mao().graph.save({ nodes: state.nodes, edges: [] });

      const result = await mao().organization.save({
        agents: state.agents,
        locale: state.locale
      });

      set({
        activeOrganization: result.organization,
        organizationBriefs: Object.fromEntries(result.briefs.map((brief) => [brief.agentId, brief.content])),
        organizationSaving: false
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Failed to save organization.";
      set({ organizationSaving: false, organizationError: message });
      throw caught;
    }
  },

  // 単体実行: 指定された1エージェントにタスクを投げ、結果を受け取るだけ。
  // 旧・root からの階層 dispatch (routerCall / managerReview / [TO:] 検出) は撤去済み。
  runTask: async ({ title, body, agentId }) => {
    const state = get();
    const agent = state.agents.find((item) => item.id === agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    if (agent.status === "error") {
      set((current) => ({
        agents: current.agents.map((item) => (item.id === agent.id ? { ...item, status: "stopped" } : item))
      }));
      console.info("[MAO run reset]", { agentId: agent.id, from: "error", to: "stopped" });
    }

    const now = new Date().toISOString();
    const task: Task = {
      id: createId("task"),
      title,
      body,
      rootAgentId: agent.id,
      status: "running",
      createdAt: now,
      updatedAt: now
    };
    const savedTask = await mao().task.create(task);
    set((current) => ({ tasks: [savedTask, ...current.tasks] }));

    const taskState: TaskState = {
      taskId: savedTask.id,
      title,
      originalBody: body,
      rootAgentId: agent.id,
      status: "running",
      createdAt: now
    };

    set({ runningTaskId: savedTask.id });
    try {
      await executeForAgent(agent.id, body, taskState, get);
    } finally {
      set((current) => ({
        runningTaskId: current.runningTaskId === savedTask.id ? null : current.runningTaskId
      }));
      cancelledTaskIds.delete(taskState.taskId);
    }
  },

  // 付箋の「渡す」など、既存タスクに紐付かない単発の単体実行で使う経路。runTask と実行部分を共有する。
  dispatchToAgent: async (agentId, body) => {
    console.info("[MAO dispatchToAgent]", { agentId, bodyHead: body.slice(0, 50) });

    const now = new Date().toISOString();
    const taskState: TaskState = {
      taskId: createId("task"),
      title: "(direct dispatch)",
      originalBody: body,
      rootAgentId: agentId,
      status: "running",
      createdAt: now
    };

    await executeForAgent(agentId, body, taskState, get);
  },

  cancelCurrentTask: async () => {
    const state = get();
    if (!state.runningTaskId) {
      return;
    }

    const taskId = state.runningTaskId;
    cancelledTaskIds.add(taskId);

    await mao().agent.abortAll().catch((error) => {
      console.error("Failed to abort agents", error);
      return false;
    });

    for (const agent of state.agents.filter((item) => item.status === "running" || item.status === "starting")) {
      void mao().pty.kill(agent.id).catch((error) => {
        console.error(`Failed to kill agent ${agent.id}`, error);
      });
    }

    const now = new Date().toISOString();
    set((current) => ({
      tasks: current.tasks.map((task) =>
        task.id === taskId ? { ...task, status: "failed", updatedAt: now } : task
      ),
      runningTaskId: null
    }));
  },

  addNote: (position) => {
    const now = new Date().toISOString();
    const note: StickyNote = {
      id: createId("note"),
      text: "",
      position,
      status: "idle",
      createdAt: now,
      updatedAt: now
    };
    set((current) => {
      const notes = [...current.notes, note];
      saveNotesDebounced(notes);
      return { notes };
    });
  },

  updateNoteText: (noteId, text) => {
    set((current) => {
      const notes = current.notes.map((note) =>
        note.id === noteId ? { ...note, text, updatedAt: new Date().toISOString() } : note
      );
      saveNotesDebounced(notes);
      return { notes };
    });
  },

  moveNote: (noteId, position) => {
    set((current) => {
      const notes = current.notes.map((note) => (note.id === noteId ? { ...note, position } : note));
      saveNotesDebounced(notes);
      return { notes };
    });
  },

  deleteNote: (noteId) => {
    set((current) => {
      const notes = current.notes.filter((note) => note.id !== noteId);
      saveNotesDebounced(notes);
      return { notes };
    });
  },

  // 「渡す」: 付箋を1エージェントに単独実行させる (常に exec / rawPrompt)
  assignNote: async (noteId, agentId) => {
    const state = get();
    const note = state.notes.find((item) => item.id === noteId);
    const agent = state.agents.find((item) => item.id === agentId);
    if (!note || !agent || !note.text.trim() || note.status === "running") {
      return;
    }

    const locale = state.locale;
    if (agent.status === "running" || agent.status === "starting") {
      set((current) => ({
        notes: current.notes.map((item) =>
          item.id === noteId
            ? {
                ...item,
                status: "error",
                resultError:
                  locale === "en" ? `${agent.name} is busy. Try again shortly.` : `${agent.name} は作業中です。少し待ってから渡してください。`,
                updatedAt: new Date().toISOString()
              }
            : item
        )
      }));
      return;
    }

    const patch = (updates: Partial<StickyNote>): void => {
      set((current) => {
        const notes = current.notes.map((item) =>
          item.id === noteId ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
        );
        saveNotesDebounced(notes);
        return { notes };
      });
    };

    patch({
      status: "running",
      assignedAgentId: agentId,
      resultText: undefined,
      resultError: undefined
    });

    const result = await mao().agent.run({
      agentId,
      body: buildNotePrompt(locale, note.text),
      taskId: noteId,
      context: {
        taskState: null,
        projectSummary: "",
        agentSummary: null,
        graph: { nodes: [], edges: [] },
        locale
      },
      rawPrompt: true
    });

    if (result.ok) {
      const trimmed = result.lastMessage.trim();
      patch({
        status: "done",
        resultText: trimmed.length > 4000 ? `${trimmed.slice(0, 4000)}...` : trimmed
      });
      get().pushInboxItem({
        kind: "note-done",
        agentId,
        noteId,
        title: agent.name,
        body: trimmed.slice(0, 200)
      });
    } else {
      patch({ status: "error", resultError: result.error });
      get().pushInboxItem({
        kind: "note-error",
        agentId,
        noteId,
        title: agent.name,
        body: result.error.slice(0, 200)
      });
    }
  },

  // --- 陣地(テリトリー) — v9: 「樹形図 (マインドマップ)」モデル。
  // 陣地 = フォルダ。作成・改名・フォルダ設定・削除は低頻度の明示操作なので都度即時保存する。
  // 陣地・エージェントは手動ドラッグできる (moveTerritory / updateNodePosition)。手動リサイズは無い
  // (size は常に utils/territoryTree.ts の計算結果によるキャッシュ)。
  // v8 は「既存の相対座標を保持する軽量な再計算 (recomputeDerivedLayout)」を追加・削除のたびに
  // 呼んでいたが、v9 は絶対座標のグローバルな樹形図なので、構造 (ツリー形状・線) が変わる操作は
  // 素直に `arrangeAll` (フルリフロー) を呼ぶだけにした (`runArrangeAll` 参照)。手動ドラッグ
  // (moveTerritory / updateNodePosition) だけは呼ばない。

  addProjectGroup: async (input) => {
    const folderPath = input.folderPath.trim();
    if (!folderPath) {
      // v7 以降、フォルダ未指定での陣地作成は不可 (陣地 = フォルダ という設計のため)。
      console.error("addProjectGroup: folderPath is required (empty-folder territories are no longer supported)");
      return;
    }

    const group: ProjectGroup = {
      id: createId("group"),
      name: input.name.trim() || "Untitled",
      folderPath,
      parentGroupId: input.parentGroupId ?? null,
      // position/size はプレースホルダ。直後の arrangeAll で樹形図上の正しい位置に上書きされる。
      position: input.position,
      size: input.size ?? DEFAULT_GROUP_SIZE,
      createdAt: new Date().toISOString()
    };
    const groups = [...get().projectGroups, group];
    set({ projectGroups: groups, pendingEditGroupId: group.id });
    await mao().groups.save({ groups }).catch((error) => {
      console.error("Failed to save groups", error);
    });
    get().arrangeAll();
  },

  addTerritory: async () => {
    const picked = await mao().dialog.pickDirectory();
    const folderPath = picked?.trim();
    if (!folderPath) {
      return;
    }

    const state = get();
    const existing = state.projectGroups.find((group) => group.folderPath === folderPath);
    if (existing) {
      // 重複防止: 既に同じフォルダの陣地があれば新規作成せずその陣地へ focus するだけにする
      get().requestFocusGroup(existing.id);
      return;
    }

    const name = basenameOfPath(folderPath) || folderPath;
    await get().addProjectGroup({
      name,
      folderPath,
      position: { x: 0, y: 0 },
      size: DEFAULT_GROUP_SIZE
    });
  },

  renameProjectGroup: async (id, name) => {
    // 名前は樹形図の構造・サイズに影響しない (陣地の表示サイズは固定値) ので arrangeAll は不要。
    const groups = get().projectGroups.map((group) => (group.id === id ? { ...group, name } : group));
    set({ projectGroups: groups });
    await mao().groups.save({ groups }).catch((error) => {
      console.error("Failed to save groups", error);
    });
  },

  setProjectGroupFolder: async (id, folderPath) => {
    const state = get();
    const trimmed = folderPath.trim();
    const groups = state.projectGroups.map((group) => (group.id === id ? { ...group, folderPath: trimmed } : group));
    set({ projectGroups: groups });
    await mao().groups.save({ groups }).catch((error) => {
      console.error("Failed to save groups", error);
    });
    // フォルダが変わると陣地ツリー上の親 (= 樹形図上の位置) が変わりうるため全体を組み直す。
    get().arrangeAll();

    if (!trimmed) {
      return;
    }

    // その陣地に所属している全エージェントの workingDirectory を新しいフォルダに更新する
    const memberAgentIds = new Set(
      state.nodes.filter((node) => node.groupId === id).map((node) => node.agentId)
    );
    for (const agentId of memberAgentIds) {
      const agent = get().agents.find((item) => item.id === agentId);
      if (agent && agent.workingDirectory !== trimmed) {
        await get().updateAgent({ ...agent, workingDirectory: trimmed });
      }
    }
  },

  deleteProjectGroup: async (id) => {
    const state = get();
    const deletedGroup = state.projectGroups.find((item) => item.id === id);
    // 削除された陣地の子陣地・エージェントは、削除された陣地の親 (祖先陣地) へ引き上げる。
    const fallbackParentGroupId = deletedGroup?.parentGroupId ?? null;

    const groups = state.projectGroups
      .filter((item) => item.id !== id)
      .map((item) => (item.parentGroupId === id ? { ...item, parentGroupId: fallbackParentGroupId } : item));
    const nodes = state.nodes.map((node) => (node.groupId === id ? { ...node, groupId: fallbackParentGroupId } : node));

    set({ projectGroups: groups, nodes });
    saveGraphDebounced({ nodes, edges: [] });
    await mao().groups.save({ groups }).catch((error) => {
      console.error("Failed to save groups", error);
    });
    get().arrangeAll();
  },

  // Inspector の「プロジェクト」欄、またはキャンバス上のドラッグ (ドロップ先に近いフォルダへの
  // 割り当て。MindMapCanvas.tsx 参照) から呼ぶ。所属 (= 線の接続先) が変わるため arrangeAll で
  // 樹形図全体を組み直す (エージェントの最終位置は arrangeAll が決める。ここで置く位置は
  // 「陣地の外へ出す」場合の一時的な置き場所に過ぎない)。
  assignNodeToGroup: async (nodeId, groupId) => {
    const state = get();
    const node = state.nodes.find((item) => item.id === nodeId);
    if (!node) {
      return;
    }

    const previousGroupId = node.groupId ?? null;
    if (previousGroupId === groupId) {
      return;
    }

    let position = node.position;
    if (!groupId) {
      // 陣地の外へ出す: 元いた陣地の絶対座標の右隣あたりに置く (未所属エージェントは樹形図の
      // レイアウト対象外なので、arrangeAll はこの座標に触れない)。
      const previousGroup = previousGroupId ? state.projectGroups.find((group) => group.id === previousGroupId) : undefined;
      const anchor = previousGroup ? previousGroup.position : { x: 200, y: 200 };
      position = { x: anchor.x + (previousGroup?.size.width ?? 0) + 60, y: anchor.y };
    }
    // groupId 指定時の position は暫定値 (直後の arrangeAll が樹形図上の葉の位置に上書きする)。

    const nodes = state.nodes.map((item) => (item.id === nodeId ? { ...item, groupId, position } : item));
    set({ nodes });
    saveGraphDebounced({ nodes, edges: [] });
    get().arrangeAll();

    if (!groupId) {
      return;
    }
    const newGroup = get().projectGroups.find((group) => group.id === groupId);
    if (!newGroup || !newGroup.folderPath) {
      return;
    }

    const agent = state.agents.find((item) => item.id === node.agentId);
    if (agent && agent.workingDirectory !== newGroup.folderPath) {
      await get().updateAgent({ ...agent, workingDirectory: newGroup.folderPath });
    }
  },

  // 陣地の手動移動 (ドラッグ)。v9 は絶対座標なので、陣地自身の座標を更新するだけでよい
  // (arrangeAll は呼ばない = 手動配置を維持する)。
  moveTerritory: (groupId, position) => {
    const groups = get().projectGroups.map((group) => (group.id === groupId ? { ...group, position } : group));
    set({ projectGroups: groups });
    saveGroupsDebounced(groups);
  },

  // 「整理」ボタン: runArrangeAll (buildTerritoryTree + layoutTree によるフルリフロー) を呼ぶ。
  arrangeAll: () => runArrangeAll(get, set),

  // v10: フォルダ展開/折りたたみのトグル。展開状態が陣地ボックスのサイズを変える (延いては
  // 樹形図全体の再配置が要る) ため、他の構造変更操作 (陣地の追加・削除・所属変更) と同じ方針で
  // `arrangeAll` を呼びフルリフローする。手動でドラッグ移動していた陣地・エージェントの位置は
  // (他の構造変更操作同様) ここでリセットされる — v9 で「絶対座標のグローバルな tidy tree では
  // 手動配置を尊重する軽量な再計算と両立できない」と判断して以来の既存方針を踏襲した。
  toggleGroupExpanded: (groupId) => {
    set((current) => {
      const next = new Set(current.expandedGroupIds);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return { expandedGroupIds: next };
    });
    get().arrangeAll();
  },

  createAgentInTerritory: async (groupId, type = "claude") => {
    const state = get();
    const group = state.projectGroups.find((item) => item.id === groupId);
    if (!group) {
      return;
    }

    // 必須は種類のみ: name は種類の表示名 + 連番 (既存名と重複しないように採番)
    const baseName = AGENT_TYPE_LABEL[type];
    const existingNames = new Set(state.agents.map((item) => item.name));
    let name = baseName;
    let counter = 1;
    while (existingNames.has(name)) {
      counter += 1;
      name = `${baseName} ${counter}`;
    }

    const agent: Agent = {
      id: createId("agent"),
      name,
      type,
      mode: "interactive",
      permissionPolicy: "safe-auto",
      command: AGENT_TYPE_COMMAND[type],
      workingDirectory: group.folderPath,
      role: "",
      systemPrompt: "",
      status: "stopped"
    };

    await get().addAgent(agent);

    // addAgent が作った node にこの陣地の groupId を設定する。位置は直後の arrangeAll が
    // 樹形図上の空いた葉の位置に決める。
    const createdNode = get().nodes.find((item) => item.agentId === agent.id);
    if (createdNode) {
      const nodes = get().nodes.map((item) => (item.id === createdNode.id ? { ...item, groupId } : item));
      // 作成直後は設定ウィンドウ (Inspector) を開く。種類はそこで選ばせる方針のため。
      set({ nodes, selectedNodeId: createdNode.id, selectedAgentId: agent.id });
      saveGraphDebounced({ nodes, edges: [] });
    }

    get().arrangeAll();
  },

  // --- Attention Inbox — CONCEPT_v5 Phase 1 ---

  pushInboxItem: (item) => {
    const entry: InboxItem = {
      ...item,
      id: createId("inbox"),
      at: Date.now(),
      read: false
    };
    set((current) => ({ inboxItems: [entry, ...current.inboxItems].slice(0, 100) }));
  },

  markInboxRead: (id) => {
    set((current) => ({
      inboxItems: current.inboxItems.map((item) => (item.id === id ? { ...item, read: true } : item))
    }));
  },

  markAllInboxRead: () => {
    set((current) => ({
      inboxItems: current.inboxItems.map((item) => ({ ...item, read: true }))
    }));
  },

  setInboxOpen: (open) => set({ inboxOpen: open }),

  respondPermission: async (requestId, allowed) => {
    await mao().permission.respond(requestId, {
      allowed,
      reason: allowed ? undefined : "User denied via MAO UI"
    });

    set((current) => ({
      inboxItems: current.inboxItems.map((entry) =>
        entry.permissionRequestId === requestId ? { ...entry, resolved: true, read: true } : entry
      ),
      pendingPermissionRequests: current.pendingPermissionRequests.filter(
        (request) => request.requestId !== requestId
      )
    }));
  },

  respondPermissionFromInbox: async (id, allowed) => {
    const item = get().inboxItems.find((entry) => entry.id === id);
    if (!item || item.kind !== "permission" || !item.permissionRequestId) {
      return;
    }

    await get().respondPermission(item.permissionRequestId, allowed);
  }
}));

async function buildContextSnapshot(
  agentId: string,
  taskState: TaskState
): Promise<ContextSnapshot> {
  const state = useAppStore.getState();
  const agentSummary = await mao().agent.loadSummary(agentId);

  return {
    taskState,
    projectSummary: "",
    agentSummary: agentSummary ?? null,
    // 旧・組織図時代の型の名残。単体実行モデルではもう hierarchy を持たないので常に空。
    graph: { nodes: [], edges: [] },
    organizationBrief: state.organizationBriefs[agentId] ?? "",
    locale: state.locale
  };
}

/**
 * 単体実行: 1エージェントにタスクを1回投げ、結果を受け取るだけ。
 * 旧・階層 dispatch (routerCall / managerReview / [TO:] 検出による子エージェントへの再帰実行) は撤去済み。
 */
async function executeForAgent(
  agentId: string,
  body: string,
  taskState: TaskState,
  getState: typeof useAppStore.getState
): Promise<ExecutionReport | null> {
  if (cancelledTaskIds.has(taskState.taskId)) {
    return null;
  }

  const state = getState();
  const agent = state.agents.find((item) => item.id === agentId);
  if (!agent) {
    return null;
  }

  const context = await buildContextSnapshot(agentId, taskState);
  if (cancelledTaskIds.has(taskState.taskId)) {
    return null;
  }

  const result = await mao().agent.run({
    agentId,
    body,
    taskId: taskState.taskId,
    context
  });
  if (cancelledTaskIds.has(taskState.taskId)) {
    return null;
  }

  if (!result.ok) {
    getState().appendLog(agentId, `\n[MAO ERROR] ${result.error}\n`);
    return null;
  }

  await mao().agent.appendHistory(agentId, {
    taskId: taskState.taskId,
    receivedBody: body,
    responseLastMessage: result.lastMessage,
    at: new Date().toISOString(),
    elapsedMs: result.elapsedMs
  });

  const report: ExecutionReport = {
    agentId,
    agentName: agent.name,
    receivedBody: body,
    lastMessage: result.lastMessage,
    artifacts: extractArtifactPaths(result.lastMessage),
    elapsedMs: result.elapsedMs
  };

  return report;
}
