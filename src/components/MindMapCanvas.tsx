import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactElement
} from "react";
import ReactFlow, {
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
  useStoreApi,
  type Edge,
  type Node,
  type NodeProps
} from "reactflow";
import "reactflow/dist/style.css";
import { getTranslations } from "../i18n";
import { useAppStore } from "../store/useAppStore";
import { stripAnsi } from "../utils/stripAnsi";
import type { Agent, AgentLocale, ProjectGroup, StickyNote } from "../types";
import {
  AGENT_CARD_HEIGHT,
  AGENT_CARD_WIDTH,
  BRANCH_COLOR_HEX,
  TERRITORY_HEADER_HEIGHT,
  type TerritoryLayoutNode,
  type TerritoryTreeNode,
  type TreeNodeKind
} from "../utils/territoryTree";

/**
 * v10 (フォルダ展開モデル): 陣地・枝ノードの「稼働状態の集計」(直属+子孫の running/error/total 数)。
 * running は running・starting の両方を含める (AgentNode の isLive 判定と同じ基準。starting も
 * 「動き始めている」とユーザーには見えるべきなので、厳密に status==="running" だけに絞らない)。
 */
type ActivityCounts = { runningCount: number; errorCount: number; totalCount: number };
const EMPTY_ACTIVITY: ActivityCounts = { runningCount: 0, errorCount: 0, totalCount: 0 };

// AgentCard の経過時間表示 (mm:ss) 用。ノードごとに setInterval を持つと running な
// エージェントが増えるほどタイマーが増殖するため、1つの setInterval を共有し、
// 表示中 (running) のカードだけが購読する。
const elapsedTickListeners = new Set<() => void>();
let elapsedTickInterval: ReturnType<typeof setInterval> | undefined;

function useElapsedTick(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    const listener = (): void => setNow(Date.now());
    elapsedTickListeners.add(listener);
    if (!elapsedTickInterval) {
      elapsedTickInterval = setInterval(() => {
        for (const tick of elapsedTickListeners) tick();
      }, 1000);
    }

    return () => {
      elapsedTickListeners.delete(listener);
      if (elapsedTickListeners.size === 0 && elapsedTickInterval) {
        clearInterval(elapsedTickInterval);
        elapsedTickInterval = undefined;
      }
    };
  }, [active]);

  return now;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mm = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const ss = (totalSeconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * エージェントをドラッグで別のフォルダへ所属変更するときの距離しきい値 (px、flow 座標系)。
 * v8 は包含 (枠の中かどうか) で hit-test していたが、v9 は包含をやめたため
 * 「ドロップ位置に最も近い陣地の中心」までの距離がこの値以内なら所属を変える方式にする。
 */
const DRAG_ASSIGN_DISTANCE = 240;

/**
 * v10: 陣地ボックスのクリックで展開/折りたたみをトグルする。React Flow の `onNodeClick` は
 * ドラッグ後の mouseup でも発火することがあるため (d3-drag は移動が無くても drag start を
 * 発火させる)、mousedown (`onNodeDragStart`) 〜 click 間の画面px移動量がこの閾値未満のときだけ
 * 「クリック」とみなしてトグルする。ドラッグ移動 (`onNodeDragStop` の `moveTerritory`) とは
 * 排他的に扱う。
 */
const CLICK_VS_DRAG_THRESHOLD_PX = 4;

/**
 * エージェントカードの「今やっていること」を作るときに読むログチャンク数。
 * 出すのは末尾 5 行だけなので、履歴全体を走査する必要はない。
 */
const TAIL_CHUNK_WINDOW = 20;

/** キャンバス左上のツールバーボタン。flex コンテナ内に並べるので位置指定は持たない。 */
const TOOLBAR_BUTTON =
  "pointer-events-auto flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-brand-line bg-brand-surface/90 px-4 py-2 text-xs font-semibold text-brand-text shadow-xl backdrop-blur transition hover:scale-105";
const TOOLBAR_BUTTON_STICKY =
  "pointer-events-auto flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-amber-300/40 bg-amber-200/90 px-4 py-2 text-xs font-semibold text-neutral-900 shadow-xl transition hover:scale-105";

/** 指定した絶対座標 (エージェントカード中心) に最も近い陣地 (territory) の groupId を返す。
 * しきい値 (DRAG_ASSIGN_DISTANCE) を超える場合は null (= 所属を変えない)。 */
function nearestTerritoryGroupId(
  point: { x: number; y: number },
  territoryLayoutNodes: TerritoryLayoutNode[]
): string | null {
  let best: { groupId: string; distance: number } | null = null;
  for (const node of territoryLayoutNodes) {
    if (node.kind !== "territory" || !node.groupId) {
      continue;
    }
    const cx = node.position.x + node.size.width / 2;
    const cy = node.position.y + node.size.height / 2;
    const distance = Math.hypot(point.x - cx, point.y - cy);
    if (distance <= DRAG_ASSIGN_DISTANCE && (!best || distance < best.distance)) {
      best = { groupId: node.groupId, distance };
    }
  }
  return best?.groupId ?? null;
}

export default function MindMapCanvas(): ReactElement {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}

function CanvasInner(): ReactElement {
  const agents = useAppStore((state) => state.agents);
  const nodes = useAppStore((state) => state.nodes);
  const projectGroups = useAppStore((state) => state.projectGroups);
  const territoryLayoutNodes = useAppStore((state) => state.territoryLayoutNodes);
  const territoryLayoutEdges = useAppStore((state) => state.territoryLayoutEdges);
  const territoryTree = useAppStore((state) => state.territoryTree);
  const expandedGroupIds = useAppStore((state) => state.expandedGroupIds);
  const toggleGroupExpanded = useAppStore((state) => state.toggleGroupExpanded);
  const selectedNodeId = useAppStore((state) => state.selectedNodeId);
  const selectNode = useAppStore((state) => state.selectNode);
  const setSelectedAgentId = useAppStore((state) => state.setSelectedAgentId);
  const updateNodePosition = useAppStore((state) => state.updateNodePosition);
  const locale = useAppStore((state) => state.locale);
  const notes = useAppStore((state) => state.notes);
  const addNote = useAppStore((state) => state.addNote);
  const moveNote = useAppStore((state) => state.moveNote);
  const deleteNote = useAppStore((state) => state.deleteNote);
  const assignNote = useAppStore((state) => state.assignNote);
  const addTerritory = useAppStore((state) => state.addTerritory);
  const arrangeAll = useAppStore((state) => state.arrangeAll);
  const moveTerritory = useAppStore((state) => state.moveTerritory);
  const assignNodeToGroup = useAppStore((state) => state.assignNodeToGroup);
  const focusGroupId = useAppStore((state) => state.focusGroupId);
  const clearFocusGroup = useAppStore((state) => state.clearFocusGroup);
  const setTerminalDrawerOpen = useAppStore((state) => state.setTerminalDrawerOpen);
  const reactFlow = useReactFlow();
  const reactFlowStore = useStoreApi();
  const t = getTranslations(locale);

  // 作成直後の陣地だけインライン編集状態に入れるための追跡 (Figma の Section 作成と同じ挙動)。
  // addTerritory は Sidebar / キャンバスのどちらからも直接呼べる自己完結アクションなので、
  // 「呼び出し元からの信号」ではなく store の pendingEditGroupId を見て新規陣地を検出する。
  const [pendingEditGroupId, setPendingEditGroupId] = useState<string | null>(null);
  const storePendingEditGroupId = useAppStore((state) => state.pendingEditGroupId);
  const clearPendingEditGroupId = useAppStore((state) => state.clearPendingEditGroupId);

  const agentById = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents]);
  const nodesById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);
  const groupsById = useMemo(() => new Map(projectGroups.map((group) => [group.id, group])), [projectGroups]);

  // v10: 陣地ノード (groupId) → 直属のRF陣地レイアウトノード。展開中のエージェントを絶対→相対座標に
  // 変換する (parentNode 用) のに使う。
  const territoryLayoutNodeByGroupId = useMemo(() => {
    const map = new Map<string, TerritoryLayoutNode>();
    for (const layoutNode of territoryLayoutNodes) {
      if (layoutNode.kind === "territory" && layoutNode.groupId) {
        map.set(layoutNode.groupId, layoutNode);
      }
    }
    return map;
  }, [territoryLayoutNodes]);

  // v10: 陣地 (groupId) → 所属エージェント一覧。フォルダの「稼働色」集計に使う。
  const agentsByGroupId = useMemo(() => {
    const map = new Map<string, Agent[]>();
    for (const node of nodes) {
      if (!node.groupId) {
        continue;
      }
      const agent = agentById.get(node.agentId);
      if (!agent) {
        continue;
      }
      const list = map.get(node.groupId);
      if (list) {
        list.push(agent);
      } else {
        map.set(node.groupId, [agent]);
      }
    }
    return map;
  }, [nodes, agentById]);

  // v10: 樹形図の全ノード (root/branch/territory) について、直属+子孫の running/error/total を集計する。
  // territoryTree (buildTerritoryTree の結果) を辿るだけの純粋な集計で、フォルダの色分けに使う。
  const activityByNodeId = useMemo(() => {
    const out = new Map<string, ActivityCounts>();
    if (!territoryTree) {
      return out;
    }
    const walk = (node: TerritoryTreeNode): ActivityCounts => {
      let counts: ActivityCounts = { runningCount: 0, errorCount: 0, totalCount: 0 };
      if (node.kind === "territory" && node.groupId) {
        const groupAgents = agentsByGroupId.get(node.groupId) ?? [];
        counts = {
          totalCount: groupAgents.length,
          runningCount: groupAgents.filter((agent) => agent.status === "running" || agent.status === "starting").length,
          errorCount: groupAgents.filter((agent) => agent.status === "error").length
        };
      }
      for (const child of node.children) {
        const childCounts = walk(child);
        counts = {
          totalCount: counts.totalCount + childCounts.totalCount,
          runningCount: counts.runningCount + childCounts.runningCount,
          errorCount: counts.errorCount + childCounts.errorCount
        };
      }
      out.set(node.id, counts);
      return counts;
    };
    walk(territoryTree);
    return out;
  }, [territoryTree, agentsByGroupId]);

  // v10: 陣地のクリック(展開トグル)とドラッグ移動を区別するための、mousedown 開始位置の一時記録。
  const territoryDragStartRef = useRef<{ id: string; x: number; y: number } | null>(null);

  // 新規作成の検出は store の pendingEditGroupId に任せる。projectGroups の増分で判定すると
  // 起動時の読み込み (0件 → N件) を「新規作成」と誤検知して、既存の陣地が勝手に編集状態になる。
  useEffect(() => {
    if (!storePendingEditGroupId) {
      return;
    }
    setPendingEditGroupId(storePendingEditGroupId);
    clearPendingEditGroupId();
  }, [storePendingEditGroupId, clearPendingEditGroupId]);

  // 陣地ツリー (root/branch/territory) は buildTerritoryTree + layoutTree (純関数、store で計算済み) の
  // 結果をそのまま React Flow の絶対座標ノードに変換する (v9: 包含をやめたので parentNode/extent は
  // 使わない。全ノードがトップレベルの絶対座標ノード)。
  const flowNodes: Node<TerritoryNodeData | TreeNodeData | AgentNodeData | StickyNodeData>[] = useMemo(() => {
    const treeNodes: Node<TerritoryNodeData | TreeNodeData>[] = [];
    for (const layoutNode of territoryLayoutNodes) {
      const activity = activityByNodeId.get(layoutNode.id) ?? EMPTY_ACTIVITY;
      if (layoutNode.kind === "territory") {
        const group = layoutNode.groupId ? groupsById.get(layoutNode.groupId) : undefined;
        if (!group) {
          continue;
        }
        treeNodes.push({
          id: layoutNode.id,
          type: "territory",
          position: layoutNode.position,
          draggable: true,
          selectable: false,
          zIndex: 0,
          style: { width: layoutNode.size.width, height: layoutNode.size.height },
          data: {
            group,
            path: layoutNode.path,
            colorIndex: layoutNode.colorIndex,
            locale,
            memberCount: nodes.filter((node) => (node.groupId ?? null) === group.id).length,
            runningCount: activity.runningCount,
            errorCount: activity.errorCount,
            isExpanded: expandedGroupIds.has(group.id),
            startEditing: pendingEditGroupId === group.id
          }
        });
        continue;
      }
      // root / branch は樹形図の構造そのもの (レイアウト結果) で、ドラッグ可能な独立エンティティでは
      // ないため draggable にしない (ドラッグしても保存先が無く、次の再描画で位置が戻ってしまうため)。
      treeNodes.push({
        id: layoutNode.id,
        type: layoutNode.kind,
        position: layoutNode.position,
        draggable: false,
        selectable: false,
        zIndex: 0,
        style: { width: layoutNode.size.width, height: layoutNode.size.height },
        data: {
          kind: layoutNode.kind,
          label: layoutNode.label,
          path: layoutNode.path,
          colorIndex: layoutNode.colorIndex,
          locale,
          runningCount: activity.runningCount,
          errorCount: activity.errorCount
        }
      });
    }

    // v10: エージェントはもう樹形図の葉ではない。所属陣地が展開中なら React Flow の
    // `parentNode`+`extent:"parent"` で陣地の箱の内側に閉じ込め (座標は「絶対座標 (store) → 陣地の
    // 絶対座標を引いた相対座標」に変換する。parentNode 使用時、React Flow は position を親からの
    // 相対座標として扱う仕様のため)。折りたたみ中は `hidden:true` で不可視にする (付箋の「渡す」
    // 判定 `getIntersectingNodes` からも自然に外れる)。所属陣地が無い (未所属) エージェントは
    // 従来通り絶対座標の自由ノードのまま。
    const agentNodes: Node<AgentNodeData>[] = nodes.map((node) => {
      const agent = agentById.get(node.agentId);
      const groupId = node.groupId ?? null;
      const territoryNode = groupId ? territoryLayoutNodeByGroupId.get(groupId) : undefined;

      if (groupId && territoryNode) {
        const isExpanded = expandedGroupIds.has(groupId);
        if (!isExpanded) {
          return {
            id: node.id,
            type: "agent",
            position: node.position,
            draggable: true,
            zIndex: 500,
            hidden: true,
            selected: selectedNodeId === node.id,
            data: { agent, locale }
          };
        }
        const relativePosition = {
          x: node.position.x - territoryNode.position.x,
          y: node.position.y - territoryNode.position.y
        };
        return {
          id: node.id,
          type: "agent",
          position: relativePosition,
          parentNode: territoryNode.id,
          extent: "parent",
          draggable: true,
          zIndex: 500,
          hidden: false,
          selected: selectedNodeId === node.id,
          data: { agent, locale }
        };
      }

      return {
        id: node.id,
        type: "agent",
        position: node.position,
        draggable: true,
        zIndex: 500,
        selected: selectedNodeId === node.id,
        data: { agent, locale }
      };
    });
    const stickyNodes: Node<StickyNodeData>[] = notes.map((note) => ({
      id: note.id,
      type: "sticky",
      position: note.position,
      zIndex: 1000,
      data: { note, locale }
    }));
    return [...treeNodes, ...agentNodes, ...stickyNodes];
  }, [
    activityByNodeId,
    agentById,
    expandedGroupIds,
    groupsById,
    locale,
    notes,
    nodes,
    pendingEditGroupId,
    territoryLayoutNodeByGroupId,
    territoryLayoutNodes,
    selectedNodeId
  ]);

  // 根→フォルダを結ぶ線 (v10: フォルダ→エージェントの edge は廃止したので、もう「フォルダ→フォルダ」
  // しか無い。太さは一律太めにする)。色は colorIndex に応じて既存の brand-* トークン
  // (BRANCH_COLOR_HEX) を割り当てるだけで、新しい配色は使わない。
  const flowEdges: Edge[] = useMemo(() => {
    return territoryLayoutEdges.map((edge) => {
      const stroke = edge.colorIndex >= 0 && edge.colorIndex < BRANCH_COLOR_HEX.length ? BRANCH_COLOR_HEX[edge.colorIndex] : "#d2d2d7";
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        // React Flow の組み込みタイプ "default" が曲線 (ベジェ曲線) — "bezier" という名前のタイプは
        // 存在しない (指定すると console 警告が出た上でフォールバックされる)。
        type: "default",
        selectable: false,
        focusable: false,
        deletable: false,
        zIndex: 0,
        style: { stroke, strokeWidth: 3, opacity: 0.85 }
      };
    });
  }, [territoryLayoutEdges]);

  // React Flow は各ノードの Handle 位置を ResizeObserver で計測してから初めて線 (edge) を描ける。
  // 通常はノードのマウント時に自動計測されるが、ウィンドウが非表示 (バックグラウンド) の状態で
  // 初期描画されるケース (Electron ウィンドウが最小化/非表示のまま起動する、OS のスペース切り替え中
  // 等) では、ブラウザが ResizeObserver の通知を止めてしまい、線が永久に描かれないことがある
  // (`requestAnimationFrame` も同様に止まるため、React Flow 標準の `useUpdateNodeInternals` も
  // rAF 経由なのでこのケースでは効かない)。そこで rAF を経由しない同期版を自前で用意し、
  // ノード一覧が変わるたびに直接ストアの `updateNodeDimensions` を呼んで計測を強制する。
  useEffect(() => {
    const { domNode, updateNodeDimensions } = reactFlowStore.getState();
    const updates = flowNodes
      .map((node) => {
        const element = domNode?.querySelector<HTMLDivElement>(`.react-flow__node[data-id="${node.id}"]`);
        return element ? { id: node.id, nodeElement: element, forceUpdate: true as const } : null;
      })
      .filter((update): update is { id: string; nodeElement: HTMLDivElement; forceUpdate: true } => update !== null);
    if (updates.length > 0) {
      updateNodeDimensions(updates);
    }
  }, [flowNodes, reactFlowStore]);

  // Sidebar からの「その陣地へ移動」依頼: React Flow インスタンスは MindMapCanvas ローカルなので
  // store の focusGroupId を監視してここで fitBounds する (Provider を持ち上げず既存構造を維持)。
  // v9 以降 territoryLayoutNodes の position は絶対座標なので、そのまま使える。
  useEffect(() => {
    if (!focusGroupId) {
      return;
    }
    const layoutNode = territoryLayoutNodes.find((node) => node.groupId === focusGroupId);
    if (layoutNode) {
      const { x, y } = layoutNode.position;
      const { width, height } = layoutNode.size;
      // 小さい陣地だと fitBounds が過剰に寄るので、陣地の外の状況も視界に残る倍率で止める。
      const targetZoom = Math.min(1, Math.min((window.innerWidth * 0.7) / width, (window.innerHeight * 0.7) / height));
      reactFlow.setCenter(x + width / 2, y + height / 2, { duration: 500, zoom: targetZoom });
    }
    clearFocusGroup();
  }, [focusGroupId, territoryLayoutNodes, reactFlow, clearFocusGroup]);

  return (
    <section className="fixed inset-0 bg-transparent">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        fitView
        panOnDrag
        onlyRenderVisibleElements
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={["Backspace", "Delete"]}
        onNodeClick={(event, node) => {
          if (node.type === "agent") {
            selectNode(node.id);
            const graphNode = nodesById.get(node.id);
            const agentId = graphNode?.agentId ?? null;
            setSelectedAgentId(agentId);
            // 設定 (Inspector) だけでなく、そのエージェントのプロンプト (下部ターミナル) も開く。
            // TerminalPanel 側が selectedAgentId に追従してタブを切り替える。
            if (agentId) {
              setTerminalDrawerOpen(true);
              const agent = agentById.get(agentId);
              if ((agent?.mode ?? "exec") === "interactive") {
                void window.mao.tmux.watch(agentId);
              }
            }
            return;
          }

          if (node.type === "territory") {
            // v10: 陣地ボックスのクリックで展開/折りたたみをトグルする。ただし、ヘッダ内の操作
            // ボタン (✎/📁/🗑/+) や名前のインライン編集 <input> は自前で stopPropagation して
            // いるのでここには来ない。ドラッグでの移動 (onNodeDragStart で記録した開始位置から
            // 閾値以上動いた場合) はトグルしない。
            const start = territoryDragStartRef.current;
            const wasDragged =
              Boolean(start) &&
              start!.id === node.id &&
              Math.hypot(event.clientX - start!.x, event.clientY - start!.y) > CLICK_VS_DRAG_THRESHOLD_PX;
            if (!wasDragged) {
              const data = node.data as TerritoryNodeData;
              toggleGroupExpanded(data.group.id);
            }
          }
        }}
        onPaneClick={() => {
          selectNode(null);
          setSelectedAgentId(null);
        }}
        onNodeDragStart={(event, node) => {
          if (node.type === "territory") {
            territoryDragStartRef.current = { id: node.id, x: event.clientX, y: event.clientY };
          }
        }}
        onNodeDragStop={(_, node) => {
          if (node.type === "sticky") {
            moveNote(node.id, node.position);
            // 「渡す」: 付箋をエージェントカードに重ねてドロップ = そのエージェントに単独実行させる
            const hit = reactFlow.getIntersectingNodes(node).find((item) => item.type === "agent");
            if (hit) {
              const graphNode = nodesById.get(hit.id);
              if (graphNode) {
                void assignNote(node.id, graphNode.agentId);
              }
            }
            return;
          }

          if (node.type === "territory") {
            // 陣地自身のドラッグ。v9 は絶対座標なので、そのまま座標を保存するだけでよい。
            const data = node.data as TerritoryNodeData;
            moveTerritory(data.group.id, node.position);
            return;
          }

          if (node.type === "agent") {
            // ドロップ位置 (カード中心の絶対座標) に最も近い陣地 (中心間距離) が
            // DRAG_ASSIGN_DISTANCE 以内なら所属を変える。遠ければ所属は変えず座標だけ更新する
            // (v8 の包含 hit-test の代わり。包含をやめたため矩形の内外判定はできない)。
            // v10: 展開中の陣地に属するエージェントは `parentNode` を持つため `node.position` は
            // 「親からの相対座標」になる。保存する座標は常に絶対座標 (store の GraphNode.position の
            // 契約) にするため、`node.positionAbsolute` (React Flow が親チェーンから計算する絶対座標)
            // を使う。未所属・折りたたみ中のエージェントは parentNode が無いので
            // positionAbsolute === position (影響なし)。
            const graphNode = nodesById.get(node.id);
            if (!graphNode) {
              return;
            }
            const width = node.width ?? AGENT_CARD_WIDTH;
            const height = node.height ?? AGENT_CARD_HEIGHT;
            const absolute = node.positionAbsolute ?? node.position;
            const centerPoint = { x: absolute.x + width / 2, y: absolute.y + height / 2 };
            const targetGroupId = nearestTerritoryGroupId(centerPoint, territoryLayoutNodes);
            const previousGroupId = graphNode.groupId ?? null;
            if (targetGroupId && targetGroupId !== previousGroupId) {
              void assignNodeToGroup(node.id, targetGroupId);
            } else {
              updateNodePosition(node.id, absolute);
            }
          }
        }}
        onNodesDelete={(deleted) => {
          for (const node of deleted) {
            if (node.type === "sticky") {
              deleteNote(node.id);
            }
          }
        }}
      >
        {/* ツールバー: 個別に left-* を指定するとラベル長 (言語差) で重なるため、
            flex コンテナに並べて自動で間隔を取る */}
        <div className="pointer-events-none fixed left-6 top-20 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const center = reactFlow.screenToFlowPosition({
              x: window.innerWidth / 2,
              y: window.innerHeight / 2
            });
            addNote({ x: center.x - 120 + Math.random() * 40, y: center.y - 80 + Math.random() * 40 });
          }}
          className={TOOLBAR_BUTTON_STICKY}
        >
          <span aria-hidden="true">🗒</span>
          {t.sticky.add}
        </button>
        <button type="button" onClick={() => void addTerritory()} className={TOOLBAR_BUTTON}>
          <span aria-hidden="true">+</span>
          {t.projectGroup.addButton}
        </button>
        <button
          type="button"
          onClick={() => arrangeAll()}
          title={t.toolbar.arrangeHint}
          className={TOOLBAR_BUTTON}
        >
          <span aria-hidden="true">⇱⇲</span>
          {t.toolbar.arrange}
        </button>
        </div>
      </ReactFlow>
    </section>
  );
}

type TerritoryNodeData = {
  group: ProjectGroup;
  /** 陣地の絶対パス (樹形図レイアウトの結果。group.folderPath と同値のはず) */
  path: string;
  /** 枝の色 index (0..4)。第1階層のサブツリーごとに割り当てられ、配下は継承する。 */
  colorIndex: number;
  locale: AgentLocale;
  memberCount: number;
  /** v10: 直属エージェントのうち running/starting の数。1以上で「稼働色」にする。 */
  runningCount: number;
  /** v10: 直属エージェントのうち error の数。1以上でエラーバッジを出す。 */
  errorCount: number;
  /** v10: 展開中か (true なら箱を大きくしてエージェントを横並びで見せる)。 */
  isExpanded: boolean;
  /** 作成直後の陣地だけ true になり、初回マウント時にインライン編集状態へ入る */
  startEditing: boolean;
};

type TreeNodeData = {
  kind: TreeNodeKind;
  label: string;
  path: string;
  colorIndex: number;
  locale: AgentLocale;
  /** v10: 配下 (子孫の陣地) を含めた running/starting の合計。1以上で「稼働色」にする。 */
  runningCount: number;
  /** v10: 配下を含めた error の合計。1以上でエラーバッジを出す。 */
  errorCount: number;
};

type AgentNodeData = {
  agent?: Agent;
  locale: AgentLocale;
};

type StickyNodeData = {
  note: StickyNote;
  locale: AgentLocale;
};

function truncatePathTail(path: string, maxChars: number): string {
  if (path.length <= maxChars) {
    return path;
  }
  return `…${path.slice(-(maxChars - 1))}`;
}

/** colorIndex (0..4、または root の NEUTRAL_COLOR_INDEX) から表示色の hex を求める。 */
function hexOfColorIndex(colorIndex: number): string | undefined {
  return colorIndex >= 0 && colorIndex < BRANCH_COLOR_HEX.length ? BRANCH_COLOR_HEX[colorIndex] : undefined;
}

/**
 * React Flow は「線 (edge) の接続点」を Handle DOM 要素の位置から計算するため、Handle が無いノードは
 * edge を描画できない (console に "Couldn't create edge for source handle id: undefined" 警告が出て
 * 何も描かれない)。今回のノードは Figma の Section のような見た目のカスタムノードで、React Flow 標準の
 * 丸い接続ハンドル UI は不要なので、透明化して非表示にしつつ位置計算にだけ使う。
 */
const HIDDEN_HANDLE_STYLE: CSSProperties = { opacity: 0, pointerEvents: "none" };

const nodeTypes = {
  // 根 ("/Users") — 参考画像の「果物」のように白ベースで控えめな角丸ピル。色は持たない。
  // 親を持たないので source (右) のみ。
  root: memo(function RootNode({ data }: NodeProps<TreeNodeData>): ReactElement {
    return (
      <div
        className="flex h-full w-full items-center justify-center gap-1.5 rounded-full border border-brand-line bg-brand-surface px-3 text-[12px] font-semibold text-brand-text shadow-lg"
        title={data.path}
      >
        <Handle type="source" position={Position.Right} style={HIDDEN_HANDLE_STYLE} />
        <span aria-hidden="true">⌂</span>
        <span className="truncate">{data.label}</span>
      </div>
    );
  }),
  // 分岐点 (圧縮済みラベル。例 "komaireo/Desktop/AI_combo") — 陣地ではない中間フォルダ。
  // v10: 配下 (子孫の陣地) に稼働中エージェントがいれば「稼働色」(フル彩度+白文字+稼働リング)、
  // いなければ「落ち着いた表示」(淡いティント+colorIndexのボーダー+濃い文字) にする。
  // 色付きボックス、ラベルのみ。親から受け (左) 子へ渡す (右) 両方持つ。
  branch: memo(function BranchNode({ data }: NodeProps<TreeNodeData>): ReactElement {
    const t = getTranslations(data.locale);
    const hex = hexOfColorIndex(data.colorIndex);
    const isActive = data.runningCount > 0;
    const hasError = data.errorCount > 0;
    // 枝分かれ前の幹 (NEUTRAL、hex 無し) は色を持たないが、稼働リングだけは brand.aurora 固定色
    // なので hex の有無に関わらず表示できる。
    const style: CSSProperties = hex
      ? isActive
        ? { backgroundColor: hex, boxShadow: `0 6px 18px ${hex}40` }
        : { backgroundColor: `${hex}22`, borderColor: `${hex}99` }
      : {};
    const textToneClass = hex ? (isActive ? "text-white" : "text-brand-text") : "text-brand-textDim";
    const chromeClass = hex
      ? isActive
        ? ""
        : "border"
      : "border border-brand-line bg-brand-surface/95";
    return (
      <div
        className={`relative flex h-full w-full items-center justify-center rounded-xl px-3 text-[11px] font-medium shadow-lg transition-all ${textToneClass} ${chromeClass} ${
          isActive ? "mao-ring-running" : ""
        }`}
        style={style}
        title={data.path}
      >
        <Handle type="target" position={Position.Left} style={HIDDEN_HANDLE_STYLE} />
        <Handle type="source" position={Position.Right} style={HIDDEN_HANDLE_STYLE} />
        {hasError ? (
          <span
            className="absolute -right-1.5 -top-1.5 z-10 h-3 w-3 rounded-full bg-brand-ember shadow-[0_0_8px_rgba(255,59,48,0.6)]"
            aria-hidden="true"
            title={t.projectGroup.errorBadge(data.errorCount)}
          />
        ) : null}
        <span className="truncate">{data.label}</span>
      </div>
    );
  }),
  territory: memo(function TerritoryNode({ data }: NodeProps<TerritoryNodeData>): ReactElement {
    const t = getTranslations(data.locale);
    const group = data.group;
    const renameProjectGroup = useAppStore((state) => state.renameProjectGroup);
    const setProjectGroupFolder = useAppStore((state) => state.setProjectGroupFolder);
    const deleteProjectGroup = useAppStore((state) => state.deleteProjectGroup);
    const createAgentInTerritory = useAppStore((state) => state.createAgentInTerritory);
    const toggleGroupExpanded = useAppStore((state) => state.toggleGroupExpanded);

    // window.prompt は Electron で常に null を返すため使わず、名前ラベルをその場で <input> に
    // 差し替えるインライン編集にする。Enter で確定、Escape で取消、blur でも確定。
    const [isEditingName, setIsEditingName] = useState(false);
    const [draftName, setDraftName] = useState(group.name);
    const nameInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
      if (data.startEditing) {
        setDraftName(group.name);
        setIsEditingName(true);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.startEditing]);

    useEffect(() => {
      if (isEditingName) {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      }
    }, [isEditingName]);

    const startEditingName = (event: ReactMouseEvent): void => {
      event.stopPropagation();
      setDraftName(group.name);
      setIsEditingName(true);
    };

    const commitName = (): void => {
      const trimmed = draftName.trim();
      if (trimmed && trimmed !== group.name) {
        void renameProjectGroup(group.id, trimmed);
      }
      setIsEditingName(false);
    };

    const cancelEditingName = (): void => {
      setDraftName(group.name);
      setIsEditingName(false);
    };

    const handleSetFolder = async (event: ReactMouseEvent<HTMLButtonElement>): Promise<void> => {
      event.stopPropagation();
      const picked = await window.mao.dialog.pickDirectory().catch(() => null);
      if (!picked) return;
      void setProjectGroupFolder(group.id, picked);
    };

    const handleDelete = (event: ReactMouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      if (!window.confirm(t.projectGroup.deleteConfirm(group.name))) return;
      void deleteProjectGroup(group.id);
    };

    const handleCreateAgent = (event: ReactMouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      // 種類は指定しない (既定で作成 → Inspector が開くのでそこで選ぶ)
      void createAgentInTerritory(group.id);
    };

    const handleToggleExpand = (event: ReactMouseEvent<HTMLButtonElement>): void => {
      // 展開トグルのボタン自体は onNodeClick 側のドラッグ判定を経由せず、常に確実にトグルする
      // (ヘッダの他のアイコンボタンと同様、stopPropagation でキャンバス側の onNodeClick に
      // 二重発火しないようにする)。
      event.stopPropagation();
      toggleGroupExpanded(group.id);
    };

    const hex = hexOfColorIndex(data.colorIndex) ?? "#5856d6";
    const isActive = data.runningCount > 0;
    const hasError = data.errorCount > 0;

    // v10: 稼働中エージェントが1体以上いれば「稼働色」(フル彩度+白文字)、いなければ
    // 「落ち着いた表示」(淡いティント+colorIndexのボーダー+濃い文字)。既存の枝色 (colorIndex) の
    // 範囲内で表現するだけで、新しい配色パレットは発明していない。
    const containerStyle: CSSProperties = isActive
      ? { backgroundColor: hex, boxShadow: `0 10px 26px ${hex}55` }
      : { backgroundColor: `${hex}22`, borderColor: `${hex}99`, boxShadow: "none" };
    const primaryTextClass = isActive ? "text-white" : "text-brand-text";
    const secondaryTextClass = isActive ? "text-white/75" : "text-brand-textDim";
    const badgeClass = isActive ? "bg-black/20 text-white/90" : "bg-black/10 text-brand-textDim";
    const iconButtonClass = isActive
      ? "text-white/80 hover:bg-white/20 hover:text-white"
      : "text-brand-textDim hover:bg-black/10 hover:text-brand-text";

    return (
      // 稼働リング (`mao-ring-running`、::before が inset:-3px で外側にはみ出す) を内側コンテンツの
      // overflow-hidden で切り取らないよう、リングは overflow-hidden を持たない外側 wrapper に
      // 乗せ、実際の色付きコンテンツ (ヘッダのテキスト折り返し・ホバーの操作バー) は内側の
      // overflow-hidden な div に収める。
      <div className={`relative h-full w-full ${isActive ? "mao-ring-running" : ""}`}>
        <div
          className={`group/frame relative flex h-full w-full flex-col overflow-hidden rounded-2xl shadow-xl transition-all ${primaryTextClass} ${
            isActive ? "" : "border"
          }`}
          style={containerStyle}
        >
          <Handle type="target" position={Position.Left} style={HIDDEN_HANDLE_STYLE} />
          <Handle type="source" position={Position.Right} style={HIDDEN_HANDLE_STYLE} />
          {hasError ? (
            <span
              className="absolute -right-2 -top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-brand-ember/60 bg-brand-ember text-[10px] font-bold text-white shadow-[0_0_12px_rgba(255,59,48,0.5)]"
              title={t.projectGroup.errorBadge(data.errorCount)}
            >
              !
            </span>
          ) : null}

          {/* ヘッダ (折りたたみ時のサイズと同じ高さ。展開時もここは変わらない) */}
          <div className="relative flex shrink-0 flex-col justify-center px-3 py-2" style={{ height: TERRITORY_HEADER_HEIGHT }}>
            <div className="flex min-w-0 items-center gap-1.5">
              {isEditingName ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  value={draftName}
                  onChange={(event) => setDraftName(event.target.value)}
                  onBlur={commitName}
                  onKeyDown={(event) => {
                    // キャンバスのショートカット (Backspace/Delete での削除など) に吸われないようにする
                    event.stopPropagation();
                    if (event.key === "Enter") {
                      event.preventDefault();
                      commitName();
                    } else if (event.key === "Escape") {
                      event.preventDefault();
                      cancelEditingName();
                    }
                  }}
                  placeholder={t.projectGroup.namePlaceholder}
                  aria-label={t.projectGroup.rename}
                  className="nodrag min-w-0 flex-1 rounded-full border border-white/40 bg-black/20 px-2 py-0.5 text-xs font-semibold text-white outline-none placeholder:text-white/60"
                />
              ) : (
                <span className="min-w-0 flex-1 truncate text-[13px] font-semibold" title={group.name} onDoubleClick={startEditingName}>
                  {group.name}
                </span>
              )}
              {/* v10: 展開/折りたたみインジケータ。クリックでもトグルできる (ボックス全体の
                  クリックでもトグルするので冗長だが、常に見える固定要素として置く)。 */}
              <button
                type="button"
                onClick={handleToggleExpand}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] transition ${iconButtonClass}`}
                aria-label={data.isExpanded ? t.projectGroup.collapse : t.projectGroup.expand}
                title={data.isExpanded ? t.projectGroup.collapse : t.projectGroup.expand}
              >
                <span aria-hidden="true">{data.isExpanded ? "▾" : "▸"}</span>
              </button>
              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-mono ${badgeClass}`} title={t.sidebar.agents}>
                {data.runningCount > 0
                  ? t.projectGroup.memberCountWithRunning(data.runningCount, data.memberCount)
                  : t.projectGroup.memberCount(data.memberCount)}
              </span>
            </div>
            <div className={`mt-0.5 truncate text-[10px] ${secondaryTextClass}`} title={data.path || undefined}>
              {data.path ? truncatePathTail(data.path, 26) : t.projectGroup.folderNotSet}
            </div>

            <div className="nodrag pointer-events-none absolute inset-x-2 bottom-1.5 hidden items-center gap-0.5 rounded-lg bg-black/25 px-1 py-0.5 backdrop-blur-sm group-hover/frame:pointer-events-auto group-hover/frame:flex">
              {/* 種類は作成時に聞かない (ポップオーバーが画面端で見切れる問題があったのと、
                  設定項目は設定ウィンドウに集約する方が分かりやすいため)。
                  押すとエージェントを1体追加し、そのまま Inspector が開いて種類を選べる。 */}
              <button
                type="button"
                onClick={(event) => handleCreateAgent(event)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-white/80 transition hover:bg-white/20 hover:text-white"
                aria-label={t.projectGroup.addAgentButton}
                title={t.projectGroup.addAgentButton}
              >
                +
              </button>
              <button
                type="button"
                onClick={startEditingName}
                className="flex h-5 w-5 items-center justify-center rounded text-white/80 transition hover:bg-white/20 hover:text-white"
                aria-label={t.projectGroup.rename}
                title={t.projectGroup.rename}
              >
                ✎
              </button>
              <button
                type="button"
                onClick={(event) => void handleSetFolder(event)}
                className="flex h-5 w-5 items-center justify-center rounded text-white/80 transition hover:bg-white/20 hover:text-white"
                aria-label={t.projectGroup.setFolder}
                title={t.projectGroup.setFolder}
              >
                📁
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex h-5 w-5 items-center justify-center rounded text-white/80 transition hover:bg-white/20 hover:text-red-100"
                aria-label={t.projectGroup.delete}
                title={t.projectGroup.delete}
              >
                🗑
              </button>
            </div>
          </div>

          {/* v10: 展開中はヘッダの下に残りの領域を確保する。実際のエージェントカードは React Flow の
              別ノード (parentNode: この陣地) として絶対配置されるので、ここでは 0 体のときだけ
              空状態のヒントを出す (エージェントがいる場合は何も描かない = カードがそのまま見える)。 */}
          {data.isExpanded ? (
            <div className="flex flex-1 items-center justify-center px-3 pb-2">
              {data.memberCount === 0 ? <span className={`text-[11px] ${secondaryTextClass}`}>{t.sidebar.noAgents}</span> : null}
            </div>
          ) : null}
        </div>
      </div>
    );
  }),
  agent: memo(function AgentNode({ data, selected }: NodeProps<AgentNodeData>): ReactElement {
    const status = data.agent?.status ?? "idle";
    const t = getTranslations(data.locale);
    const statusClass = {
      idle: "border-brand-violet/30 shadow-[0_0_18px_rgba(88,86,214,0.30)]",
      stopped: "opacity-50",
      starting: "mao-ring-starting animate-pulse border-brand-sunsetA/60 shadow-[0_0_20px_rgba(255,122,61,0.35)]",
      running: "mao-ring-running border-brand-aurora/60 shadow-[0_0_22px_rgba(52,199,89,0.45)]",
      error: "animate-pulse border-brand-ember/70 shadow-[0_0_22px_rgba(255,59,48,0.45)]"
    }[status];
    const role = data.agent?.role || data.agent?.mode || data.agent?.type || "";
    const isLive = status === "running" || status === "starting" || status === "error";

    const agentId = data.agent?.id;
    const logChunks = useAppStore((state) => (agentId ? state.logs[agentId] : undefined));
    const setTerminalDrawerOpen = useAppStore((state) => state.setTerminalDrawerOpen);
    const setSelectedAgentId = useAppStore((state) => state.setSelectedAgentId);
    const stopAgent = useAppStore((state) => state.stopAgent);
    const setInboxOpen = useAppStore((state) => state.setInboxOpen);
    const activityLine = useAppStore((state) => (agentId ? state.activityByAgent[agentId]?.line : undefined));
    const runningSinceAt = useAppStore((state) => (agentId ? state.runningSince[agentId] : undefined));
    const hasPendingPermission = useAppStore((state) =>
      agentId ? state.pendingPermissionRequests.some((request) => request.agentId === agentId) : false
    );

    const isRunning = status === "running";
    const now = useElapsedTick(isRunning && Boolean(runningSinceAt));
    const elapsedLabel = isRunning && runningSinceAt ? formatElapsed(now - runningSinceAt) : null;

    const tailLines = useMemo(() => {
      if (!logChunks || logChunks.length === 0) return [] as string[];
      // 表示するのは末尾 5 行だけなのに全履歴を join + stripAnsi すると、
      // チャンクが 1 つ届くたびにログ全長ぶんの走査が走る (カード数 × 出力速度で効く)。
      // 末尾の数チャンクで 5 行はまず埋まるので、そこだけ見る。
      const joined = stripAnsi(logChunks.slice(-TAIL_CHUNK_WINDOW).join(""));
      const lines = joined
        .replace(/\r/g, "\n")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      return lines.slice(-5);
    }, [logChunks]);

    const expand = (event: ReactMouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      if (agentId) setSelectedAgentId(agentId);
      setTerminalDrawerOpen(true);
    };

    // ホバー時クイック操作: 停止 / ターミナルを開く。ノード本体のドラッグ・選択判定を
    // 壊さないよう stopPropagation + nodrag (React Flow のドラッグ除外クラス) を付ける。
    const quickStop = (event: ReactMouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      if (agentId) void stopAgent(agentId);
    };

    const quickOpenTerminal = (event: ReactMouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      if (!agentId) return;
      setSelectedAgentId(agentId);
      void window.mao.tmux.watch(agentId);
      setTerminalDrawerOpen(true);
    };

    const openInboxForPermission = (event: ReactMouseEvent<HTMLButtonElement>): void => {
      event.stopPropagation();
      setInboxOpen(true);
    };

    return (
      <div
        className={`group relative min-w-[200px] max-w-[260px] cursor-pointer rounded-2xl border border-brand-line bg-brand-surface/95 px-4 py-3 text-brand-text shadow-2xl transition-all ${statusClass} ${
          selected ? "ring-2 ring-brand-sunsetA/60 ring-offset-2 ring-offset-brand-bg" : ""
        }`}
      >
        <Handle type="target" position={Position.Left} style={HIDDEN_HANDLE_STYLE} />
        {hasPendingPermission ? (
          <button
            type="button"
            onClick={openInboxForPermission}
            className="nodrag absolute -right-2 -top-2 z-10 flex h-5 w-5 animate-pulse items-center justify-center rounded-full border border-brand-sunsetA/60 bg-brand-sunsetA text-[10px] font-bold text-brand-bg shadow-[0_0_12px_rgba(255,122,61,0.5)]"
            aria-label={t.permission.tag}
            title={t.permission.tag}
          >
            !
          </button>
        ) : null}
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-brand-text">
              {data.agent?.name ?? t.mindMap.missingAgent}
            </div>
            <div className="mt-1 truncate text-[10px] uppercase tracking-[0.18em] text-brand-textDim">
              {role || data.agent?.status || ""}
            </div>
          </div>
          {agentId ? (
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
              <button
                type="button"
                onClick={quickStop}
                className="nodrag flex h-6 w-6 items-center justify-center rounded-full text-brand-textDim transition hover:bg-brand-surfaceHi hover:text-brand-text"
                aria-label={t.agentCard.stopAgent}
                title={t.agentCard.stopAgent}
              >
                <span aria-hidden="true" className="text-[11px] leading-none">⏹</span>
              </button>
              <button
                type="button"
                onClick={quickOpenTerminal}
                className="nodrag flex h-6 w-6 items-center justify-center rounded-full text-brand-textDim transition hover:bg-brand-surfaceHi hover:text-brand-text"
                aria-label={t.agentCard.openTerminal}
                title={t.agentCard.openTerminal}
              >
                <span aria-hidden="true" className="text-[11px] leading-none">⌨</span>
              </button>
            </div>
          ) : null}
          {tailLines.length > 0 ? (
            <button
              type="button"
              onClick={expand}
              className="-mr-1 -mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-brand-textDim transition hover:bg-brand-surfaceHi hover:text-brand-text"
              aria-label={t.agentCard.viewLog}
              title={t.agentCard.viewLog}
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-current">
                <path d="M3 3h7v2H5v5H3V3Zm11 0h7v7h-2V5h-5V3ZM3 14h2v5h5v2H3v-7Zm16 0h2v7h-7v-2h5v-5Z" />
              </svg>
            </button>
          ) : null}
        </div>
        {isRunning && (elapsedLabel || activityLine) ? (
          <div className="mt-1.5 flex items-center gap-1.5 overflow-hidden text-[10px] text-brand-textDim">
            {elapsedLabel ? (
              <span
                className="shrink-0 rounded-full bg-brand-aurora/15 px-1.5 py-0.5 font-mono text-brand-aurora"
                aria-label={`${t.agentCard.elapsed}: ${elapsedLabel}`}
                title={`${t.agentCard.elapsed}: ${elapsedLabel}`}
              >
                {elapsedLabel}
              </span>
            ) : null}
            {activityLine ? (
              <span className="min-w-0 truncate" title={activityLine}>
                {activityLine}
              </span>
            ) : null}
          </div>
        ) : null}
        {tailLines.length > 0 ? (
          <div
            className={`mt-2 flex flex-col justify-end overflow-hidden rounded-md bg-brand-bg/60 px-2 py-1.5 font-mono text-[9px] leading-[1.35] text-brand-text/85 ${
              isLive ? "border-l border-brand-aurora/60" : "opacity-70"
            }`}
            style={{ height: isLive ? "72px" : "16px" }}
          >
            {tailLines.slice(isLive ? -5 : -1).map((line, idx) => (
              <div key={`${idx}-${line.slice(0, 16)}`} className="truncate">
                {line}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    );
  }),
  sticky: memo(function StickyNode({ data, selected }: NodeProps<StickyNodeData>): ReactElement {
    const t = getTranslations(data.locale);
    const note = data.note;
    const updateNoteText = useAppStore((state) => state.updateNoteText);
    const deleteNote = useAppStore((state) => state.deleteNote);
    const agents = useAppStore((state) => state.agents);

    const running = note.status === "running";
    const assignedAgent = agents.find((agent) => agent.id === note.assignedAgentId);

    const statusRing = running
      ? "animate-pulse ring-2 ring-brand-sunsetA/70"
      : note.status === "error"
        ? "ring-2 ring-brand-ember/70"
        : note.status === "done"
          ? "ring-1 ring-emerald-500/50"
          : "";

    return (
      <div
        className={`w-[250px] rounded-xl border border-amber-300/60 bg-amber-200/95 p-3 text-neutral-900 shadow-2xl transition-all ${statusRing} ${
          selected ? "ring-2 ring-brand-sunsetA" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="text-sm">🗒</span>
          <span className="flex-1 truncate text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
            {running ? t.sticky.running : assignedAgent ? assignedAgent.name : ""}
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              deleteNote(note.id);
            }}
            disabled={running}
            className="nodrag flex h-5 w-5 items-center justify-center rounded-full text-neutral-500 transition hover:bg-black/10 hover:text-neutral-900 disabled:opacity-30"
            aria-label={t.sticky.delete}
            title={t.sticky.delete}
          >
            ✕
          </button>
        </div>
        <textarea
          className="nodrag mt-1 h-16 w-full resize-none bg-transparent text-xs leading-relaxed placeholder-neutral-500 focus:outline-none"
          value={note.text}
          placeholder={t.sticky.placeholder}
          onChange={(event) => updateNoteText(note.id, event.target.value)}
          disabled={running}
          spellCheck={false}
        />

        {note.resultError ? (
          <p className="mt-1 rounded-lg bg-brand-ember/15 px-2 py-1 text-[10px] leading-relaxed text-red-800">
            {note.resultError}
          </p>
        ) : null}

        {note.resultText ? (
          <pre className="nodrag mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white/70 px-2 py-1.5 text-[10px] leading-relaxed">
            {note.resultText}
          </pre>
        ) : null}

        {!running && note.text.trim() && !note.resultText ? (
          <p className="mt-2 truncate text-[9px] text-neutral-600">{t.sticky.dropHint}</p>
        ) : null}
      </div>
    );
  })
};
