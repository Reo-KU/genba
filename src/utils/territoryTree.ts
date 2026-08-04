import type { ProjectGroup } from "../types";

/**
 * 陣地(テリトリー)— v9: 「樹形図 (マインドマップ)」モデル (純関数のみ)。
 *
 * - 陣地 (ProjectGroup) は実フォルダに1対1対応する。全陣地を実パスの親子関係でツリー化し、
 *   分岐しない中間ディレクトリは1ノードに圧縮する (例: "komaireo/Desktop/AI_combo")。
 * - 根は常に "/Users"。ユーザーが陣地として追加していないが複数の子を束ねるのに必要なノードは
 *   「枝ノード」として扱う。ここまでは v8 から変更なし (`buildTerritoryTree` は流用)。
 * - v8 までは「包含 (React Flow の parentNode + extent:"parent")」で親子を表現していたが、
 *   v9 では Edraw AI のマインドマップのような**樹形図**(左→右、根はピル、第1階層は色付きボックス、
 *   エージェントはそこから線で伸びる葉)に変更した。**エージェントは所属フォルダの枠の中に
 *   入れる (包含) のではなく、フォルダノードから線 (edge) で右へ伸びる葉として描く。**
 * - **座標は絶対座標に戻した** (v8 の「親からの相対座標」をやめた)。`ProjectGroup.position` /
 *   `GraphNode.position` は再びキャンバス上の絶対座標を意味する (types のコメントを参照)。
 * - 各ノードの色 (`colorIndex`) は「第1階層 (root の直接の子) のサブツリーごと」に
 *   0,1,2,3,4 と割り当て、その配下 (子孫の陣地・枝・エージェント) は同じ色を継承する。
 *   実際の色 (hex) は既存の brand-* トークン (`BRANCH_COLOR_HEX`) を順番に使うだけで、
 *   新しい配色は発明していない。
 * - DOM や store には一切依存しない。単体で動作確認できる。
 *
 * 重なり・はみ出しを防ぐ仕組み (`layoutTree` の中核):
 *   1. 深さごとに x を固定する (「その深さの最大ノード幅 + 余白」を積み上げるだけなので、
 *      異なる深さのノード同士は x 方向に絶対に重ならない)。
 *   2. 各ノードは「自分の全子孫を含めた高さ (blockHeight)」を再帰的に予約してから
 *      兄弟を縦に積む (次の兄弟は前の兄弟の blockHeight 分だけ下にずらす) ので、
 *      兄弟同士・その子孫同士も y 方向に絶対に重ならない。
 *      (`docs/HANDOFF.ja.md` に証明の要旨あり。厳密には帰納法: 各ノードは自分の
 *      予約領域 [yTop, yTop+blockHeight) の中に自分自身と全子孫を収める設計になっている)
 *
 * v10 (フォルダ展開モデル) での変更点:
 * - **エージェントはもう樹形図の葉 (別の depth 列) ではない**。折りたたみ時は不可視、
 *   展開時は「そのフォルダの箱の内側」に横一列 (最大4列で折り返し) で並ぶ。
 *   そのため `layoutTree` は展開中の groupId 集合 (`expandedGroupIds`) を追加引数に取り、
 *   展開中の陣地ノードだけ「ヘッダ + エージェント格子」を収める大きいサイズ
 *   (`expandedTerritorySize`) を使う。折りたたみ中は従来通りの固定サイズ。
 * - **フォルダ→エージェントの edge は生成しない** (エージェントがもう葉ではないため)。
 *   `edges` は「フォルダ→フォルダ」だけになった。
 * - エージェントが箱の内側に収まる分、その陣地ノードの `blockHeight` (自分が予約する高さ) も
 *   `expandedTerritorySize` の高さに応じて大きくなる。上記の「tidy tree」の重なり防止の仕組みは
 *   ノードサイズが可変になっても変わらず成立する (各ノードは常に自分の `ownSize` 分だけを
 *   予約領域の中に置くだけなので、`ownSize` が展開で大きくなっても兄弟・子孫との非重なりの
 *   証明はそのまま成り立つ)。
 * - `agentPositions` は**展開中の陣地に属するエージェントだけ**を返す (折りたたみ中の陣地の
 *   エージェントは含めない = 呼び出し側は前回の座標をそのまま保持する)。座標は他の座標と同じく
 *   **絶対座標**で返す (このファイルの他の戻り値と一貫させるため。React Flow の `parentNode` は
 *   相対座標を要求するので、絶対→相対の変換は呼び出し側の UI 層 (`MindMapCanvas.tsx`) が行う。
 *   詳細は `MindMapCanvas.tsx` 冒頭のコメント参照)。
 */

export type TreeNodeKind = "root" | "branch" | "territory";

export type TerritoryTreeNode = {
  /** territory の場合は group.id、それ以外は path ベースの安定ID */
  id: string;
  kind: TreeNodeKind;
  /** 表示ラベル (パス圧縮後。例 "komaireo/Desktop/AI_combo") */
  label: string;
  /** 絶対パス */
  path: string;
  groupId: string | null;
  children: TerritoryTreeNode[];
};

/** layoutTree が返すフォルダ系ノード (root/branch/territory) 1件分。 */
export type TerritoryLayoutNode = {
  id: string;
  kind: TreeNodeKind;
  label: string;
  path: string;
  groupId: string | null;
  /** キャンバス上の絶対座標 (v9: 包含をやめたため、v8 の「親からの相対座標」から差し戻した)。 */
  position: { x: number; y: number };
  size: { width: number; height: number };
  /** 枝の色 index (0..4)。root は色を持たないので -1 (中立/白ベース表示に使う)。 */
  colorIndex: number;
};

/** layoutTree が返す線 (edge) 1本分。フォルダ→フォルダ、フォルダ→エージェントの両方を含む。 */
export type TerritoryLayoutEdge = {
  id: string;
  source: string;
  target: string;
  colorIndex: number;
};

type Box = { width: number; height: number };
type Point = { x: number; y: number };

// --- 定数 (レイアウトの前提値) ---

const ROOT_PATH = "/Users";
const ROOT_ID = "root";

/** レイアウト全体の原点 (root ノードの絶対座標としての見た目の余白)。 */
const ROOT_ORIGIN: Point = { x: 60, y: 60 };

/** root は色を持たない (中立表示) ことを示すセンチネル値。 */
export const NEUTRAL_COLOR_INDEX = -1;

/** 枝の色 (colorIndex 0..4 に対応する hex)。既存の brand-* トークンを順番に割り当てるだけで、
 * 新しい配色パレットは発明していない (brand.sunsetA / sunsetB / aurora / ember / violet の順)。 */
export const BRANCH_COLOR_HEX = ["#ff7a3d", "#ff3d8a", "#34c759", "#ff3b30", "#5856d6"] as const;

/** root ノード (角丸ピル) のサイズ。参考画像の「果物」のように白ベースで控えめにするため小さめ。 */
const ROOT_SIZE: Box = { width: 150, height: 56 };
/** branch ノード (中間ディレクトリ、色付きボックスだがラベルのみ) のサイズ。 */
const BRANCH_SIZE: Box = { width: 190, height: 50 };
/** territory ノード (陣地、色付きボックス。名前+パス+エージェント数+ホバー操作を収める) のサイズ。
 * v10: 折りたたみ時のサイズ。展開時はこの高さを「ヘッダ」として使い、その下にエージェント格子を積む
 * (`TERRITORY_HEADER_HEIGHT` 参照)。 */
const TERRITORY_SIZE: Box = { width: 232, height: 88 };

/** 展開時、陣地ボックスの上部に確保する「ヘッダ」領域の高さ。折りたたみ時と同じ見た目のヘッダ
 * (名前・パス・エージェント数・展開インジケータ) を維持するため、折りたたみ時のサイズをそのまま流用する。
 * `MindMapCanvas.tsx` 側もこの定数を使ってヘッダ div の高さを揃える (レイアウト計算と描画のズレ防止)。 */
export const TERRITORY_HEADER_HEIGHT = TERRITORY_SIZE.height;

/** 展開時、ヘッダとエージェント格子の間・格子の外周に確保する余白。 */
const TERRITORY_EXPANDED_PADDING = 16;
/** 展開時、エージェントカード同士の格子内の間隔。 */
const TERRITORY_GRID_GAP = 12;
/** 展開時、エージェントを横に並べる最大列数。要件通り「まず横に並べ、4体を超えたら次の行へ」。 */
const TERRITORY_GRID_MAX_COLUMNS = 4;
/** 展開したがエージェントが1体もいない陣地に確保する空メッセージ表示分の高さ。 */
const TERRITORY_EMPTY_HEIGHT = 40;

/**
 * エージェントカード1枚分の既定サイズ。AgentNode (MindMapCanvas.tsx) の実サイズは中身で伸び縮みする
 * (幅は `min-w-[200px] max-w-[260px]`、高さは経過時間・直近ログの有無で変わる。running かつログ表示中の
 * 最大ケースで実測 ~170 に頭打ちになるので余裕を見て180)。ここで予約するサイズが実サイズの最大値より
 * 小さいと重なりが起こるため、実際の CSS 上限に合わせている。呼び出し側 (store) は `agentSizeById` で
 * 実測サイズがあればそちらを優先させることができる。
 */
export const AGENT_CARD_WIDTH = 260;
export const AGENT_CARD_HEIGHT = 180;

/** 深さが1つ進むたびの横方向の余白 (「その深さの最大ノード幅 + 余白」の余白分)。 */
const GAP_X = 80;
/** 兄弟ノード (子孫を含むブロック同士) の縦間隔の最低値。 */
const GAP_Y = 24;

const sizeOfKind = (kind: TreeNodeKind): Box => {
  if (kind === "root") return ROOT_SIZE;
  if (kind === "territory") return TERRITORY_SIZE;
  return BRANCH_SIZE;
};

// --- buildTerritoryTree (v8 から変更なし) ---

type TrieNode = {
  segment: string;
  groupId: string | null;
  children: Map<string, TrieNode>;
};

const createTrieNode = (segment: string): TrieNode => ({ segment, groupId: null, children: new Map() });

/**
 * ProjectGroup.folderPath からトライ挿入用のパスセグメント列を求める。
 * - 空文字 (旧データ想定): クラッシュさせず、root 直下にグループ名 (無ければ id) を仮の1階層として置く。
 * - "/Users" 配下でないパス (別OS・旧データ等): 同様にクラッシュさせず root 直下に押し込む。
 */
const segmentsForGroup = (group: ProjectGroup): string[] => {
  const raw = (group.folderPath ?? "").trim();
  if (!raw) {
    const fallbackSegment = group.name.trim() || group.id;
    return ["Users", fallbackSegment];
  }
  const normalized = raw.replace(/\\/g, "/");
  const parts = normalized.split("/").filter((part) => part.length > 0);
  if (parts[0] === "Users") {
    return parts;
  }
  return ["Users", ...parts];
};

const insertGroup = (root: TrieNode, group: ProjectGroup): void => {
  const segments = segmentsForGroup(group);
  let current = root;
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    let child = current.children.get(segment);
    if (!child) {
      child = createTrieNode(segment);
      current.children.set(segment, child);
    }
    current = child;
  }
  if (current.groupId && current.groupId !== group.id) {
    // 同じパスを指す陣地が複数存在する衝突ケース (同フォルダを2つ追加した等)。
    // データを失わないよう、一意な子ノードとして退避させる。
    const dupSegment = `__dup_${group.id}`;
    const dupNode = createTrieNode(dupSegment);
    dupNode.groupId = group.id;
    current.children.set(dupSegment, dupNode);
    return;
  }
  current.groupId = group.id;
};

const trieToTree = (node: TrieNode, segments: string[], isRoot: boolean): TerritoryTreeNode => {
  const path = "/" + segments.join("/");
  const kind: TreeNodeKind = isRoot ? "root" : node.groupId ? "territory" : "branch";
  const id = isRoot ? ROOT_ID : node.groupId ? node.groupId : `branch:${path}`;
  const children = [...node.children.entries()]
    .map(([segment, child]) => trieToTree(child, [...segments, segment], false))
    .sort((a, b) => a.label.localeCompare(b.label));
  return {
    id,
    kind,
    label: isRoot ? ROOT_PATH : node.segment,
    path,
    groupId: node.groupId,
    children
  };
};

/** 分岐しない中間ディレクトリ (branch かつ子が1つ) を子と結合してラベルを連結する。根 (root) と陣地 (territory) は結合しない。 */
const compress = (node: TerritoryTreeNode): TerritoryTreeNode => {
  const children = node.children.map(compress);
  if (node.kind === "branch" && children.length === 1) {
    const only = children[0];
    return { ...only, label: `${node.label}/${only.label}` };
  }
  return { ...node, children };
};

/** 陣地一覧からツリーを構築する (根は "/Users"。パス圧縮込み)。 */
export function buildTerritoryTree(groups: ProjectGroup[]): TerritoryTreeNode {
  const root = createTrieNode("Users");
  for (const group of groups) {
    insertGroup(root, group);
  }
  const tree = trieToTree(root, ["Users"], true);
  return compress(tree);
}

/**
 * ツリーを辿り、陣地 (territory) ごとに「最も近い祖先陣地の groupId」を求める。中間の branch/root は
 * 飛ばす。祖先陣地が無い場合は null。ProjectGroup.parentGroupId をツリーと同期させておくためのキャッシュ
 * 計算に使う (store から呼ぶ)。v9 でも意味は変わらない (レイアウトの絶対/相対とは無関係の情報)。
 */
export function deriveParentGroupIds(tree: TerritoryTreeNode): Record<string, string | null> {
  const result: Record<string, string | null> = {};
  const walk = (node: TerritoryTreeNode, nearestAncestorGroupId: string | null): void => {
    if (node.kind === "territory" && node.groupId) {
      result[node.groupId] = nearestAncestorGroupId;
      for (const child of node.children) walk(child, node.groupId);
      return;
    }
    for (const child of node.children) walk(child, nearestAncestorGroupId);
  };
  walk(tree, null);
  return result;
}

// --- layoutTree (v9: 樹形図レイアウト。唯一のレイアウト関数。v8 の layoutNested / deriveTerritoryLayout /
// findFreeSlotInParent を置き換える) ---

/**
 * ツリーを左→右の樹形図(マインドマップ)レイアウトに落とす。
 *
 * - 深さごとに x 座標を固定する (「その深さの最大ノード幅 + GAP_X」を depth 0 から積み上げる)。
 *   **v10: エージェントはもう独立した depth 列を持たない** — 展開中の陣地の箱の内側に収まる
 *   (折りたたみ中は不可視) ため、幅の計算は root/branch/territory のノードだけを見る。
 * - 各ノードは自分の全子孫 (子フォルダの部分木。展開時のエージェント格子は子孫ではなく
 *   自分自身の `ownSize` に含まれる) を含めた高さ (blockHeight) を再帰的に予約してから、
 *   兄弟を GAP_Y を挟んで縦に積む。ノード自身は自分が予約した blockHeight の中央に置く
 *   (典型的な tidy tree)。この構成により、深さの異なるノード同士は x 方向に、兄弟(の部分木)
 *   同士は y 方向に、それぞれ構造的に絶対重ならない (`ownSize` が展開で大きくなっても同じ証明が
 *   成り立つ。ファイル冒頭の v10 コメント参照)。
 * - colorIndex は root の直接の子 (第1階層) ごとに 0,1,2,3,4 を割り当て、子孫はそれを継承する。
 * - 戻り値の edges は「親フォルダ→子フォルダ」だけ (v10 でフォルダ→エージェントの edge は廃止)。
 */
export function layoutTree(
  tree: TerritoryTreeNode,
  agentNodeIdsByGroupId: Record<string, string[]>,
  agentSizeById: Record<string, { width: number; height: number }>,
  expandedGroupIds: Set<string>
): {
  nodes: TerritoryLayoutNode[];
  agentPositions: Record<string, { x: number; y: number }>;
  edges: TerritoryLayoutEdge[];
} {
  const agentSizeOf = (agentId: string): Box => agentSizeById[agentId] ?? { width: AGENT_CARD_WIDTH, height: AGENT_CARD_HEIGHT };
  const agentIdsOf = (node: TerritoryTreeNode): string[] =>
    node.kind === "territory" && node.groupId ? agentNodeIdsByGroupId[node.groupId] ?? [] : [];
  const isExpandedTerritory = (node: TerritoryTreeNode): boolean =>
    node.kind === "territory" && node.groupId != null && expandedGroupIds.has(node.groupId);

  /** 展開時の陣地サイズ (ヘッダ + エージェント格子、最大4列で折り返し)。エージェントが0体なら
   * ヘッダ + 空メッセージ分の高さだけ確保する。 */
  const expandedTerritorySize = (agentIds: string[]): Box => {
    if (agentIds.length === 0) {
      return { width: TERRITORY_SIZE.width, height: TERRITORY_HEADER_HEIGHT + TERRITORY_EXPANDED_PADDING + TERRITORY_EMPTY_HEIGHT };
    }
    const columns = Math.min(TERRITORY_GRID_MAX_COLUMNS, agentIds.length);
    const rows = Math.ceil(agentIds.length / columns);
    const maxAgentWidth = Math.max(...agentIds.map((id) => agentSizeOf(id).width));
    const maxAgentHeight = Math.max(...agentIds.map((id) => agentSizeOf(id).height));
    const gridWidth = columns * maxAgentWidth + (columns - 1) * TERRITORY_GRID_GAP;
    const gridHeight = rows * maxAgentHeight + (rows - 1) * TERRITORY_GRID_GAP;
    return {
      width: Math.max(TERRITORY_SIZE.width, TERRITORY_EXPANDED_PADDING * 2 + gridWidth),
      height: TERRITORY_HEADER_HEIGHT + TERRITORY_EXPANDED_PADDING + gridHeight + TERRITORY_EXPANDED_PADDING
    };
  };

  /** ノード1件分の「自分自身の」サイズ (子孫は含まない)。展開中の陣地だけ可変、それ以外は固定値。 */
  const ownSizeOf = (node: TerritoryTreeNode): Box =>
    isExpandedTerritory(node) ? expandedTerritorySize(agentIdsOf(node)) : sizeOfKind(node.kind);

  // --- パス1: 深さごとの最大ノード幅を求める (root/branch/territory のみ。v10 でエージェントは
  // 陣地の箱の内側に収まるため、もう独立した depth 列を持たない) ---
  const widthByDepth = new Map<number, number>();
  const growWidth = (depth: number, width: number): void => {
    widthByDepth.set(depth, Math.max(widthByDepth.get(depth) ?? 0, width));
  };
  const walkDepths = (node: TerritoryTreeNode, depth: number): void => {
    growWidth(depth, ownSizeOf(node).width);
    for (const child of node.children) {
      walkDepths(child, depth + 1);
    }
  };
  walkDepths(tree, 0);

  const maxDepth = Math.max(...widthByDepth.keys(), 0);
  const xAtDepth: number[] = [ROOT_ORIGIN.x];
  for (let depth = 0; depth < maxDepth; depth++) {
    xAtDepth.push(xAtDepth[depth] + (widthByDepth.get(depth) ?? 0) + GAP_X);
  }

  // --- パス2: 高さを再帰的に予約しながら配置する (tidy tree) ---
  const outNodes: TerritoryLayoutNode[] = [];
  const agentPositions: Record<string, { x: number; y: number }> = {};
  const edges: TerritoryLayoutEdge[] = [];
  let nextColorIndex = 0;
  const allocateColor = (): number => {
    const value = nextColorIndex % BRANCH_COLOR_HEX.length;
    nextColorIndex += 1;
    return value;
  };

  /**
   * 色を配り始める深さ。root の直下で配ると、実際のフォルダ構成では
   * `/Users → komaireo → ...` のように子が1つしかない鎖が続くため全部が同じ色になる。
   * **最初に実際に枝分かれする (子が2つ以上ある) ノード**まで降りてから配ることで、
   * 参考にしたマインドマップのように枝ごとに色が分かれる。
   */
  const colorSplitDepth = ((): number => {
    let current = tree;
    let depth = 0;
    while (current.children.length === 1 && agentIdsOf(current).length === 0) {
      current = current.children[0];
      depth += 1;
    }
    return depth;
  })();

  /** node を depth 列・yTop を先頭とする領域に配置し、消費した高さ (blockHeight) を返す。
   * v10: エージェントはもう子孫として縦に積まない (陣地の箱自身の中に収まるため)。子フォルダだけを
   * 縦に積み、陣地の直属エージェントの絶対座標は自分の位置 (ownX/ownY) が確定した後に計算する。 */
  const layoutSubtree = (node: TerritoryTreeNode, depth: number, yTop: number, colorIndex: number): number => {
    const ownSize = ownSizeOf(node);
    let cursorBottom = yTop;
    let placedAny = false;

    // 子フォルダ (branch/territory) を再帰的に配置する。
    for (const child of node.children) {
      const childColorIndex = depth === colorSplitDepth ? allocateColor() : colorIndex;
      const y = placedAny ? cursorBottom + GAP_Y : cursorBottom;
      const childHeight = layoutSubtree(child, depth + 1, y, childColorIndex);
      edges.push({ id: `edge:${node.id}->${child.id}`, source: node.id, target: child.id, colorIndex: childColorIndex });
      cursorBottom = y + childHeight;
      placedAny = true;
    }

    const childrenBlockHeight = placedAny ? cursorBottom - yTop : 0;
    const blockHeight = Math.max(ownSize.height, childrenBlockHeight);
    const ownX = xAtDepth[depth];
    const ownY = yTop + (blockHeight - ownSize.height) / 2;

    // 展開中の陣地なら、直属エージェントをヘッダの下に横一列 (最大4列で折り返し) で並べる。
    // 座標は絶対座標 (ownX/ownY を基準に加算するだけ)。折りたたみ中は agentPositions に何も
    // 積まない (呼び出し側が前回の座標をそのまま保持する = 「展開中のフォルダのエージェントだけ返す」)。
    if (isExpandedTerritory(node)) {
      const agentIds = agentIdsOf(node);
      if (agentIds.length > 0) {
        const columns = Math.min(TERRITORY_GRID_MAX_COLUMNS, agentIds.length);
        const maxAgentWidth = Math.max(...agentIds.map((id) => agentSizeOf(id).width));
        const maxAgentHeight = Math.max(...agentIds.map((id) => agentSizeOf(id).height));
        agentIds.forEach((agentId, index) => {
          const col = index % columns;
          const row = Math.floor(index / columns);
          agentPositions[agentId] = {
            x: ownX + TERRITORY_EXPANDED_PADDING + col * (maxAgentWidth + TERRITORY_GRID_GAP),
            y: ownY + TERRITORY_HEADER_HEIGHT + TERRITORY_EXPANDED_PADDING + row * (maxAgentHeight + TERRITORY_GRID_GAP)
          };
        });
      }
    }

    outNodes.push({
      id: node.id,
      kind: node.kind,
      label: node.label,
      path: node.path,
      groupId: node.groupId,
      position: { x: ownX, y: ownY },
      size: ownSize,
      colorIndex: node.kind === "root" ? NEUTRAL_COLOR_INDEX : colorIndex
    });

    return blockHeight;
  };

  layoutSubtree(tree, 0, ROOT_ORIGIN.y, NEUTRAL_COLOR_INDEX);

  return { nodes: outNodes, agentPositions, edges };
}
