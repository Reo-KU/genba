# 引き継ぎ書 — MAO OS (v5/v6/v10/v11) 2026-07-31 時点

> 次に作業する担当(人間 / 別エージェント)向け。**この1枚を読めば再開できる**ことを目的にしている。
> 正典ドキュメントは [CONCEPT_v5.ja.md](CONCEPT_v5.ja.md)。[CONCEPT_v3.ja.md](CONCEPT_v3.ja.md) は
> 旧・合議エンジンの思想書だったが、**合議機能は v11 (2026-07-31) で撤去済み**(歴史的記録として残置。
> 読む必要はない)。付箋UXとGTMは [CONCEPT_v4.ja.md](CONCEPT_v4.ja.md)。矛盾したら **v5 が優先**、陣地の可視化モデルの
> 詳細は CONCEPT_v5.ja.md の「2026-07-31 決定 (v10: フォルダ展開モデル)」追記を参照
> (v8「包含」・v9「樹形図+線」はこの v10 で一部置き換え済み。読む必要はないが履歴として残置。
> v9 の「フォルダ構造を tidy tree で樹形図にする」部分は v10 でも不変。フォルダ→エージェントの
> 線だけ廃止し、クリックで展開する方式に変わった)。

## 0. 3行サマリ

- MAOは「複数CLIを連携させるツール」から「**複数の稼働中エージェントを管理するOS**」に転換した(v5)。
- **エージェント間の紐付け(root/edge/階層dispatch)は廃止**。実行は単独実行のみ
  (**合議は v11 (2026-07-31) で撤去済み**)。
- 案件ごとのボード切替も廃止。**1枚のマップ + 陣地(旧称プロジェクト囲い)**。陣地は Edraw AI の
  マインドマップのような**左→右の樹形図**(根 `/Users` → 色付きのフォルダ枠) で表現する
  (v9)。**v10 でフォルダ→エージェントの線は廃止**し、代わりに**稼働中エージェントがいるフォルダは
  色で分かり、クリックすると展開してエージェントが横に並ぶ**方式にした。既定は全て折りたたみ。
  座標はすべて絶対座標。手動移動可・「整理」ボタンでフルリフロー。詳細は §1.5。

## 1. 現在の状態

### 完了 (2026-07-29)

| # | 内容 | 主なファイル |
|---|---|---|
| 1 | **Sidebar** — プロジェクト/エージェント一覧の折りたたみ式フローティングレール | `src/components/Sidebar.tsx` |
| 2 | **AgentCard強化** — 状態リング / 経過時間 / 「今やっていること1行」 / ⚠承認バッジ / ホバー操作(停止・ターミナル) | `src/components/MindMapCanvas.tsx` |
| 3 | **Attention Inbox** — 承認・エラー・完了・cwd変更を横断集約する右下ピル (合議決定種別は v11 で撤去) | `src/components/AttentionInbox.tsx` |
| 4 | **紐付け撤去** — root/edge/階層dispatch/managerReview/`[TO: name]` 全廃、単体実行に一本化 | `useAppStore.ts`, `electron/agentRunner.ts`, `utils/organization.ts` |
| 5 | **プロジェクト囲い** — 矩形フレーム(名前+フォルダ)、ドラッグで所属、囲い移動で中身も移動、リサイズで再判定 | `MindMapCanvas.tsx`, `utils/projectGroups.ts`, `electron/main.ts` |
| 6 | **`window.prompt` 全廃 (バグ修正)** — Electron のレンダラは `window.prompt()` を実装しておらず常に `null` を返すため、プロジェクト名の変更・新規作成が無反応になっていた。囲いヘッダ (ダブルクリック/✎)・サイドバー行 (✎) をその場 `<input>` 編集に置き換え、プロジェクト作成は既定連番名 (`t.projectGroup.defaultName`) で即時作成 → インライン編集状態に入る方式 (Figma の Section 作成と同じ) に変更。フォルダ選択は作成後に 📁 から行う導線に変更 (作成時は必須ではない)。 | `MindMapCanvas.tsx`, `Sidebar.tsx`, `i18n/ja.ts`, `i18n/en.ts` |
| 7 | **Inspector からのプロジェクト割り当て** — ドラッグ以外の明示的な導線として `<select>` を追加。store に `assignNodeToGroup(nodeId, groupId \| null)` を新設 (groupId 指定時は囲い内の空きへ配置しworkingDirectoryも更新、null 指定時は囲いの外へ出しworkingDirectoryは維持)。WORKING DIRECTORY の下に「プロジェクト〈名〉のフォルダ」という補足も表示。 | `InspectorPopover.tsx`, `useAppStore.ts` |

- 型チェック (`npx tsc --noEmit`) と `npm run build` は**通っている**。
- **git はコミットしていない**(master に未コミット33件)。最終コミットは `f12523d`。
  改修前の `src/` `electron/` のバックアップは作業セッションのスクラッチパッドに置いたので、
  **恒久的な退避が必要ならブランチを切ってコミットすること**(セッション終了で消える前提)。

### 完了 (2026-07-31 — v8 包含ネストモデルへの移行)

前任者が型・レイアウト計算 (`utils/territoryTree.ts`) と store (`useAppStore.ts` の
`arrangeAll` / `addTerritory` / `createAgentInTerritory` / `moveTerritory` / `assignNodeToGroup` 等) を
実装済みの状態から、UI 側 (`MindMapCanvas.tsx`) を実装した。

| # | 内容 | 主なファイル |
|---|---|---|
| 1 | **React Flow の親子ノード化** — `territoryLayoutNodes` を親→子の順に並べ替え (`sortNodesParentFirstWithDepth`) てから `parentNode` + 相対 `position` で渡す。陣地/枝/根は `extent:"parent"` (親からはみ出せない)、エージェントは `extent` 無し (陣地間をドラッグで移動可)。zIndex は深さ順 (親 < 子。さもないと子が親の背景に隠れる React Flow の既知の制約) | `MindMapCanvas.tsx` |
| 2 | **線 (edge) の完全廃止** — `territoryLayoutEdges` 参照とコンパイルエラーを解消し `edges={[]}` に | `MindMapCanvas.tsx` |
| 3 | **エージェントのドラッグ所属変更** — `onNodeDragStop` でドロップ位置 (カード中心の絶対座標) を `territoryLayoutNodes` の矩形 (parentId チェーンを積み上げて絶対化) に対して hit-test し、最も内側 = 面積最小の陣地へ `assignNodeToGroup`。同じ陣地内なら `updateNodePosition` のみ | `MindMapCanvas.tsx` |
| 4 | **陣地のドラッグ移動** — `onNodeDragStop` で `moveTerritory(groupId, position)` | `MindMapCanvas.tsx` |
| 5 | **「整理」ボタン追加** — `arrangeAll` を呼ぶボタンをツールバーに追加。「📁 プロジェクト」ボタンは「+ 陣地」(`addTerritory`) に (i18n は前任者が対応済み) | `MindMapCanvas.tsx`, `i18n/ja.ts`, `i18n/en.ts` |
| 6 | **バグ修正: レイアウト定数がエージェントカードの実サイズより小さかった** — `AGENT_CARD_WIDTH`(196→260) / `AGENT_CARD_HEIGHT`(96→180) が実際の `AgentNode` の描画幅 (`min-w-[200px] max-w-[260px]`) ・高さ (running 中はログ表示で伸びる) より小さく、**カード同士の重なり・陣地枠からのはみ出しが実際に再現した** (DOM 実測で発見)。名前/役割/ログ行はすべて truncate (折り返さない) なので状態ごとの最大サイズは決定的 — その最大値に合わせて定数を修正 | `utils/territoryTree.ts` |
| 7 | **Sidebar フォーカスのバグ修正** — `focusGroupId` → `setCenter` が `group.position` (v8 で親からの相対座標に意味変更済み) をそのまま絶対座標として使っていたため、ネストした陣地では誤った位置にパンしていた。`territoryLayoutNodes` の parentId チェーンから絶対座標を組み立てるよう修正 | `MindMapCanvas.tsx` |

検証: `npx tsc --noEmit` / `npm run build` エラーゼロ。ブラウザモック
(`npx vite --config .claude/vite.browser.config.ts`) で実際に操作し、DOM の実測値
(`getBoundingClientRect` をズーム倍率で割り戻した flow 座標) で次を確認済み:
root → branch → territory の入れ子が実座標として正しく包含されていること、陣地同士・
エージェント同士が重ならないこと (付箋は自由配置なので除外)、「+ エージェント」で陣地の
枠内に新規エージェントが収まること、「整理」後も重なり・はみ出しが無いこと。
コンソールは `console.error` 0件 (React Flow の dev warning `#002`/`#004` のみで、
今回の変更前から既存かつ `console.warn`)。


#### 2026-07-31 追加修正 (v8 の実測バグ2件)

1. **陣地名が起動時に勝手にインライン編集状態になる** — `projectGroups` の増分で「新規作成」を
   検出していたため、**起動時の読み込み (0件 → N件) を新規作成と誤検知**していた。
   store に `pendingEditGroupId` を持たせ、**作成経路 (`addProjectGroup`) でのみ立てる**方式に変更。
   UI は消費したら `clearPendingEditGroupId()` で消す。
2. **稼働中グローリングが陣地の枠外まではみ出す** — `.mao-ring-running::before` が
   **要素ごと `transform: rotate()`** していたため、正方形の対角線がカード外周を大きく超えて振れていた
   (キャンバス上に緑の菱形が走る現象の正体)。`@property --mao-ring-angle` を宣言し、
   **conic-gradient の角度だけをアニメーション**させる方式に変更。見た目は同じでカード内に収まる。

### 完了 (2026-07-31 — v9 樹形図/マインドマップモデルへの移行)

v8 (包含ネストモデル) をユーザーが「樹形図みたいになってる方が絶対わかりやすい」と判断したため、
Edraw AI のマインドマップを参考に作り直した。詳細は CONCEPT_v5.ja.md の「2026-07-31 決定 (v9)」を参照。

| # | 内容 | 主なファイル |
|---|---|---|
| 1 | **レイアウトを tidy tree に全面書き換え** — `layoutNested`/`deriveTerritoryLayout`/`findFreeSlotInParent`/`contentOriginOffset` を撤去し、唯一のレイアウト関数 `layoutTree` に統一。座標を絶対座標に戻し (`ProjectGroup`/`GraphNode` の position コメント更新)、陣地サイズは固定値化 (中身に依存しない)。深さごとに x を固定し、各ノードが全子孫を含む高さを再帰的に予約してから兄弟を積む構成により、重なりが構造的に起きない (証明はファイル冒頭コメント参照)。 | `src/utils/territoryTree.ts` |
| 2 | **線 (edge) を復活** — root の直接の子ごとに `colorIndex` (0〜4、brand-* トークン順) を割り当て子孫に継承させ、`territoryLayoutEdges` として返す。React Flow 側は `type:"default"` (組み込みのベジェ曲線) で描画、フォルダ→フォルダは太め・フォルダ→エージェントは細め。 | `src/utils/territoryTree.ts`, `src/components/MindMapCanvas.tsx` |
| 3 | **store を絶対座標運用に更新** — `runArrangeAll`(旧 `recomputeDerivedLayout` を統合) が `arrangeAll` の実体になり、陣地の追加・削除・フォルダ変更・所属変更はすべて `arrangeAll` (フルリフロー) を呼ぶ方針に単純化した。手動ドラッグ (`moveTerritory`/`updateNodePosition`) だけは呼ばない。 | `src/store/useAppStore.ts` |
| 4 | **エージェントのドラッグ所属変更を近接判定に変更** — 包含 hit-test が使えなくなったため、ドロップ位置 (カード中心) に最も近い陣地の中心が 240px 以内なら `assignNodeToGroup`、遠ければ座標のみ更新。 | `src/components/MindMapCanvas.tsx` |
| 5 | **ノードの描き分けを刷新** — root=白ベースの角丸ピル、branch/territory=colorIndex の色付きボックス (文字は白)、territory は名前・パス・エージェント数・ホバー操作 (✎/📁/🗑/+) をボックス自体に内包 (v8 のヘッダ帯は廃止)。agent/sticky は既存のまま。 | `src/components/MindMapCanvas.tsx` |
| 6 | **バグ修正: React Flow の edge type 名の誤り** — `type:"bezier"` は存在しないタイプ名で、指定すると console 警告の上フォールバックされる。組み込みのベジェ曲線は `type:"default"`。 | `src/components/MindMapCanvas.tsx` |
| 7 | **バグ修正 (重要・環境依存): Handle 未実装で線が一切描けない** — カスタムノードに React Flow の `<Handle>` が無いと edge の接続点を計算できず何も描かれない (`Couldn't create edge for source handle id: undefined` 警告)。全ノード種別に非表示の `<Handle>` を追加。 | `src/components/MindMapCanvas.tsx` |
| 8 | **バグ修正 (重要・環境依存): `document.visibilityState==="hidden"` で ResizeObserver/rAF が止まり線が永久に描けない** — Handle 追加後もまだ描かれず、原因調査の結果 React Flow は Handle 位置を `ResizeObserver` で計測して初めて edge を描画できる仕様で、ページが非表示 (バックグラウンド) だとブラウザが `ResizeObserver`・`requestAnimationFrame` を止めることが判明 (今回のブラウザ検証ハーネスで実際に踏んだ。Electron ウィンドウがバックグラウンドで起動するケースでも同様に起こりうる)。React Flow 標準の `useUpdateNodeInternals` は内部で rAF を使うためこの状況では効かず、`useStoreApi()` から `updateNodeDimensions` を直接呼ぶ rAF 非依存の同期版を自前実装して回避した。 | `src/components/MindMapCanvas.tsx` |
| 9 | **死んだコードの削除** — `src/utils/projectGroups.ts` (v8 時点で既にどこからも import されていなかった) を削除。 | (ファイル削除) |
| 10 | **index.css の edge スタイル整理** — v7 以前の「紐付け線」時代の hover/selected 強調 CSS (色を上書きする演出) を撤去し、`pointer-events:none` のみの非インタラクティブなスタイルに変更 (colorIndex ごとの色は inline style で指定するため)。 | `src/index.css` |

検証: `npx tsc --noEmit` / `npm run build` エラーゼロ。ブラウザモックで実際に操作し、次を確認済み
(詳細な手法は本ファイル末尾の担当エージェントの報告、または git log 参照):
- 純関数レベル (`layoutTree` を Node.js から直接呼ぶスクリプト): 8陣地・3系統の第1階層・
  深いネスト・11体のエージェント (サイズ様々) という合成データで**全23矩形の総当たり判定 0件**、
  colorIndex が第1階層ごとに 0〜4 で distinct かつ子孫に継承されることを確認。
- 実アプリの DOM (`getBoundingClientRect` 相当を transform/style から算出): 初期表示・「整理」後・
  「+ エージェント」後・Inspector からの陣地再割り当て後のいずれでも**重なり 0件**を確認。
  edge 数もフォルダ数・エージェント数の変化と整合 (8→9本など)。
- edge の実際の `stroke`/`stroke-width` を computed style から取得し、フォルダ→フォルダが太め
  (3px)・フォルダ→エージェントが細め (1.5px) になっていることを確認 (今回のモックデータは
  第1階層が1系統のみなので色分け自体は合成データ側の検証で担保)。
- console は `console.error` 0件 (React Flow の dev warning `#002` のみで、今回の変更前から既存)。

### 完了 (2026-07-31 — v10 フォルダ展開モデルへの移行)

ユーザーが「フォルダの下にagentを樹形図で繋ぐのではなく、動いているフォルダは色で分かるように
なっていて、クリックすると展開して中のエージェントが横に並ぶ方がいい」と判断したため、v9 の
「フォルダ→エージェントの線」を撤去し、クリック展開モデルに変更した。

| # | 内容 | 主なファイル |
|---|---|---|
| 1 | **展開状態を store に追加** — `expandedGroupIds: Set<string>` (UI状態のみ、永続化しない。既定は全折りたたみ) と `toggleGroupExpanded(groupId)` を追加。トグルは陣地ボックスのサイズを変える構造変更として扱い、内部で `arrangeAll` (フルリフロー) を呼ぶ (陣地の追加・削除等、既存の他の構造変更操作と同じ方針)。 | `src/store/useAppStore.ts` |
| 2 | **`layoutTree` に展開中集合を追加引数化** — `layoutTree(tree, agentNodeIdsByGroupId, agentSizeById, expandedGroupIds)`。フォルダ→エージェントの edge を廃止 (`edges` はフォルダ→フォルダのみ)。展開中の陣地だけ「ヘッダ (`TERRITORY_HEADER_HEIGHT`、折りたたみ時と同じ高さ) + エージェント格子 (最大4列で折り返し)」を収める可変サイズ (`expandedTerritorySize`) になる。tidy tree の「自分の全子孫を含めた高さを予約してから兄弟を積む」という重なり防止の仕組みはノードサイズが可変でもそのまま成り立つ (証明はファイル冒頭コメント参照)。`agentPositions` は絶対座標のまま、展開中の陣地のエージェントだけ返す (折りたたみ中は前回の座標を保持するだけで値を返さない)。 | `src/utils/territoryTree.ts` |
| 3 | **フォルダの稼働色** — 陣地は直属、branch は子孫を含めた running/starting/error を集計 (`territoryTree` を辿る `activityByNodeId`)。running が1体以上で「稼働色」(フル彩度+白文字+`mao-ring-running`)、無ければ「淡いティント+colorIndexのボーダー+濃い文字」。error が1体以上で `brand.ember` の小バッジ。エージェント数バッジは `running/total` 形式 (例 `2/3`)。running ring (`::before` が `inset:-3px` で外側にはみ出す) を陣地ボックス自身の `overflow-hidden` に切り取られないよう、リング専用の `overflow:visible` な外側 wrapper div を追加し、実際の色付きコンテンツは内側の `overflow-hidden` な div に分離した。 | `src/components/MindMapCanvas.tsx` |
| 4 | **クリックで展開/折りたたみ** — `onNodeClick` で territory ノードなら `toggleGroupExpanded`。ヘッダの操作ボタン (✎/📁/🗑/+) ・名前編集 `<input>` は既存の `stopPropagation` でトグルを誤発火させない。ドラッグとの区別は `onNodeDragStart` で territory の mousedown 時点の画面px座標 (`event.clientX/Y`) を記録し、`onNodeClick` 時の座標との距離が閾値 (4px) 未満のときだけトグルする方式で実装 (React Flow の `onNodeClick` はドラッグ後の mouseup でも発火しうるための対策)。展開/折りたたみの ▸/▾ インジケータをヘッダに常時表示する専用ボタンとしても追加した (stopPropagation で二重発火はしない)。 | `src/components/MindMapCanvas.tsx` |
| 5 | **エージェントノードの出し分け** — 展開中の陣地に属するエージェントは `parentNode`+`extent:"parent"` でその陣地の箱からはみ出せなくし、座標は「`layoutTree` の絶対座標 − 陣地ノードの絶対座標」で相対座標に変換して渡す (`layoutTree` 自体は他の戻り値と一貫させるため絶対座標のまま返す設計にした。絶対→相対の変換は React Flow 特有の要求なので UI 層だけが担う)。折りたたみ中は `hidden: true` で不可視にする (React Flow は `hidden` なノードを DOM に描画しないため、付箋の「渡す」交差判定 `getIntersectingNodes` からも自然に外れる)。未所属エージェントは従来通り絶対座標の自由ノードのまま。 | `src/components/MindMapCanvas.tsx` |
| 6 | **バグ修正: エージェントドラッグの座標保存が絶対/相対を取り違えていた** — `onNodeDragStop` の agent 分岐で、所属変更しない場合に `updateNodePosition(node.id, node.position)` を呼んでいたが、`node.position` は `parentNode` を持つノードでは「親からの相対座標」になる (v10 で新設)。store の `GraphNode.position` の契約は常に絶対座標なので、`node.positionAbsolute ?? node.position` (React Flow が計算する絶対座標) を使うよう修正した。未所属・折りたたみ中のエージェントは `parentNode` が無いため `positionAbsolute === position` で影響なし。 | `src/components/MindMapCanvas.tsx` |
| 7 | **i18n** — 展開/折りたたみのラベル (`projectGroup.expand`/`collapse`)、エラーバッジのツールチップ (`projectGroup.errorBadge`)、稼働数入りのバッジ文言 (`projectGroup.memberCountWithRunning`) を en/ja 両方に追加。空 (0体) の展開陣地には既存の `sidebar.noAgents` を流用した。 | `src/i18n/ja.ts`, `src/i18n/en.ts` |

検証: `npx tsc --noEmit` / `npm run build` エラーゼロ。
- **純関数レベル** (`layoutTree` を esbuild でバンドルして Node.js から直接呼ぶスクリプト):
  8陣地・深いネスト・0〜5体のエージェント (サイズ様々) という合成データで、折りたたみ全部・
  1陣地だけ展開 (5体、4列で折り返し確認)・複数陣地同時展開 (0体の陣地の空状態込み)・全陣地展開の
  4パターンそれぞれで「フォルダ同士」「エージェント同士」「エージェントが自陣地の箱に完全内包」
  「エージェントが他陣地の箱と重ならない」を総当たりで判定し**全パターンで重なり 0件**、
  フォルダ→エージェントの edge が生成されないことを確認。
- **実アプリの DOM** (`getBoundingClientRect`): 初期表示 (全折りたたみ、エージェントノードが
  DOM に一切存在しないこと) → MAO 陣地をクリックで展開 (2体のエージェントが出現、陣地の箱が
  116×44→282×150 に拡大、他の陣地・枝・root と重ならないことを実測) → もう一度クリックで
  折りたたみ (エージェントが DOM から消えることを確認) → 3陣地 (MAO・歯磨きアプリ・事業まとめ
  [0体]) を同時展開 → 「整理」ボタンをクリックしても展開状態・非重なりが崩れないことを確認。
  モックデータ (a1=running/a3=error) 通り、MAO 陣地はフル彩度の稼働色 (`rgb(255,122,61)`)、
  「Desktop」枝もフル彩度+`mao-ring-running` (子孫の稼働を継承)、色を持たない「komaireo」枝も
  `mao-ring-running` のリングだけで稼働を示すことを computed style で確認。歯磨きアプリ陣地は
  淡いティント (`rgba(255,61,138,0.133)`)+濃い文字+`1件のエラー` バッジを確認。
- console は `console.error` 0件。

### 完了 (2026-07-31 — v11 合議の撤去)

ユーザーが「合議はコンセプトから外れた」と判断したため、合議 (deliberation) 機能を
コードベースから完全に撤去した。判断根拠は CONCEPT_v5.ja.md の
「2026-07-31 決定 (v11: 合議の撤去)」参照 (要旨: 合議は連携側の機能で現行コンセプトの
中心ではない/収益モデルが機能差なし方針になり保持理由が消えた/差別化の本体は管理面で
合議が無くても失われない/実運用で使われないまま保守コストだけ払っていた)。

| # | 内容 | 主なファイル |
|---|---|---|
| 1 | **合議エンジン削除** — `electron/deliberation.ts` (695行) をファイルごと削除。`DeliberationEngine` の import・インスタンス化・IPC ハンドラ (`mao:deliberation:start`/`cancel`) を `electron/main.ts` から削除 | `electron/main.ts` (`electron/deliberation.ts` は削除) |
| 2 | **DeliberationPanel 削除** — コンポーネントをファイルごと削除し、`App.tsx` のマウントも除去 | `src/App.tsx` (`src/components/DeliberationPanel.tsx` は削除) |
| 3 | **store のスライス撤去** — `deliberation`/`deliberationOpen`/`setDeliberationOpen`/`startDeliberation`/`cancelDeliberation`/`deliberateNote`、`mao().deliberation.onUpdate` 購読、`applySessionToNote`/`pushDeliberationInboxItems` ヘルパー、`deliberationNoteBySession` マップ、および死んでいた `taskEntryMode`/`TaskEntryMode`(「単独/合議」トグル用で既に未使用だった)を削除。`assignNote` (「渡す」) は無関係のため無改造 | `src/store/useAppStore.ts` |
| 4 | **型の撤去** — `DeliberationPhase`/`DeliberationMemberStatus`/`DeliberationMember`/`DeliberationProposal`/`DeliberationBallot`/`DeliberationDecision`/`DeliberationSession`/`DeliberationStartRequest`/`DeliberationStartResult`/`StickyNoteDecision` を削除。`StickyNote.deliberationSessionId`/`decision` を削除。`IpcChannels` から `mao:deliberation:start`/`cancel` を削除。`InboxItemKind` から `deliberation-decided` を削除 | `src/types/index.ts` |
| 5 | **IPC 配線の撤去** — preload の `deliberation` API、`global.d.ts` の `MaoApi.deliberation` を削除。main の `stickyNoteSchema` から `deliberationSessionId`/`decision` フィールドを削除 (zod は未知キーを黙って無視するため、旧 `notes.json` にこれらのフィールドが残っていてもクラッシュしない) | `electron/preload.ts`, `src/types/global.d.ts`, `electron/main.ts` |
| 6 | **付箋 UI** — `MindMapCanvas.tsx` の `StickyNode` から「会議」ボタン・決定表示 (`decisionTie`/`details`/`meeting` 等)・`councilSize` 判定を削除。「渡す」動線 (`assignNote`、エージェントカードへのドラッグ&ドロップ hit-test) は無改造 | `src/components/MindMapCanvas.tsx` |
| 7 | **i18n** — `deliberation.*` 名前空間を丸ごと削除。付箋の `deliberate`/`needTwoAgents`/`meeting`/`decisionTie`/`details` を削除。`dropHint` から合議への言及だけ削ぎ落として自然な文言に修正 (例: 「エージェントに重ねて渡す、または会議 →」→「エージェントに重ねて渡す →」)。Attention Inbox の閉じるボタンが `t.deliberation.close` を参照していたため `attentionInbox.close` を新設して差し替え | `src/i18n/ja.ts`, `src/i18n/en.ts` |
| 8 | **ブラウザモックの追従** — `.claude/vite.browser.config.ts` の `window.mao` モックから `deliberation` API と `listeners.delib` を削除 (残していると型/実行時に矛盾する) | `.claude/vite.browser.config.ts` |
| 9 | **ドキュメント** — CONCEPT_v3.ja.md 冒頭に撤去済みの歴史的記録である旨を追記 (ファイルは削除せず残置)。CONCEPT_v5.ja.md に v11 決定を追記し、実行モデル・Attention Inbox 種別・操作の動詞表・vault ディレクトリ構成など合議前提の記述を現状に合わせて修正。README.md/README.ja.md から合議関連の記述を削除・修正 | `docs/CONCEPT_v3.ja.md`, `docs/CONCEPT_v5.ja.md`, `README.md`, `README.ja.md` |

検証: `npx tsc --noEmit` / `npm run build` エラーゼロ。`grep -ri "deliberat|合議" src/ electron/`
の残存参照ゼロ (App.tsx の説明コメント1箇所のみ、機能参照ではないため許容)。ブラウザモック
(`.claude/vite.browser.config.ts`) で起動確認し、付箋が表示され「会議」ボタンが無いこと・
陣地ツリーとエージェント展開が従来どおり動くこと・コンソールエラー0件を確認。

### 未検証 (実機で最初に確認すべきこと)

ブラウザモックでは React Flow の d3-drag が合成イベントで発火しないため、**実際のマウスドラッグだけ未検証**
(クリック系・DOM実測は上記の通り検証済み):

1. **エージェントを陣地の外へドラッグ (240px 以内に陣地が無い位置) → 所属が変わらず座標だけ更新されること**、別陣地の近くへドラッグ → `assignNodeToGroup` 経由で `workingDirectory` が新しい陣地のフォルダに書き換わるか(最重要。近接判定のしきい値 240px が実際のカード間隔で自然に感じるかも含めて確認)。**v10 の注意**: 展開中の陣地に属するエージェントは `parentNode`+`extent:"parent"` で自分の陣地の箱の外へドラッグできない (物理的に閉じ込められる) ため、この近接判定による所属変更が実際に発火するのは「未所属エージェント」「折りたたみ中の陣地のエージェント (今は hidden なのでドラッグ自体できない)」を除くと限定的になる。展開中のカードは同じ陣地内での位置調整だけが実質的な用途になる想定 (仕様通りの挙動だが、実機で違和感が無いか確認)。
2. ~~囲いの右下ハンドルでのリサイズ~~ → 陣地の手動リサイズは無い (size は常に固定値)。該当なし
3. 陣地自体のドラッグ移動 (`moveTerritory`) → 絶対座標なので追従の概念は無いが、ドラッグ後に線 (edge、v10 ではフォルダ→フォルダのみ) がドラッグ後の位置に正しく追従するか
4. **付箋をエージェントカードに重ねる「渡す」動線** — hit-test は `reactFlow.getIntersectingNodes` のまま変更していないが、実際のドラッグでの動作は未検証。**v10 の注意**: 折りたたみ中のエージェントは `hidden:true` で DOM に存在しないため付箋を重ねられない (見えないカードには渡せない、これは意図通り)。展開して見えているカードに対してのみ確認すればよい。
5. `window.mao.dialog.pickDirectory()`(新規のネイティブフォルダ選択)のキャンセル時 null
6. 単独実行が実際に CLI プロセスを起動するか(モックは即 ok を返すダミー)
7. 陣地のインライン名編集 (ダブルクリック→`<input>`、ボックス自体がクリック対象になったため当たり判定が変わっている点に注意)
8. **Inspector の「プロジェクト」`<select>` からの割り当て** — ブラウザモックで動作確認済み
   (選択 → `assignNodeToGroup` → `workingDirectory` 更新 → キャンバス上でノードが移動、線も付け替わることを実値で確認)。
   実機でのドラッグ経路との相互作用は未確認。
9. **Electron ウィンドウが非表示/バックグラウンドで起動した場合の線描画** — 今回追加した
   rAF 非依存の同期計測ロジック (上表 #8) が実機でも効くか。理論上は `useEffect` は
   ページの表示状態に関わらず実行されるため問題ないはずだが、実機 Electron での最終確認は未実施。
10. **v10: 陣地ボックスの「本物の」マウスドラッグと展開クリックの区別** — ブラウザモックでは
    合成クリックで展開/折りたたみのトグル自体は確認済み (`onNodeClick` 経由、閾値 4px)。ただし
    d3-drag が合成イベントで発火しないため、「実際にドラッグで陣地を動かした直後にクリック相当の
    mouseup が来ても展開トグルが誤発火しないこと」は実機の本物のマウス操作でしか確認できない。
11. **v10: 展開したことで陣地ボックスが大きくなり、キャンバス左上のツールバーボタン
    (📝付箋/+陣地/整理) と重なる場合がある** — ブラウザモックの検証中、fitView 直後に大きく
    展開した陣地がツールバーのすぐ下に来て紛らわしい場面があった (ツールバーは fixed 配置、
    陣地は canvas 座標なので原理的に起こりうる。v9 以前から潜在していた重なりで今回のスコープ外だが、
    展開でボックスが大きくなる分、体感頻度は上がる可能性がある。次回気になれば要検討)。

#### 2026-07-31 追加修正 (日本語の文字化け — 文字コード不一致)

ユーザーから「日本語を打つと文字化けする」との指摘。実測で原因を特定した:

```
tmux display-message -p '#{client_utf8}'   →  0   (= tmux がクライアントを UTF-8 と認識していない)
ps eww -p <tmux server pid> | grep LANG    →  なし (LANG / LC_* が一切渡っていない)
```

**Electron のような GUI アプリはログインシェルの `LANG` / `LC_*` を引き継がない**ため、
spawn された tmux / ttyd / node-pty のロケールが未設定 (C/POSIX 扱い) になり、
tmux がマルチバイトを 8bit として扱って日本語が壊れていた。

対策:
- `electron/env.ts` を新設。`utf8Env()` は既存の値が UTF-8 でない場合だけ `LANG` と `LC_CTYPE` を
  補う (メッセージ言語を奪わないよう **`LC_ALL` は設定しない**)。ロケールは darwin なら
  `en_US.UTF-8`、それ以外は `C.UTF-8`(確実に存在するものを選ぶ。encoding が UTF-8 なら十分)。
- **tmux / ttyd / node-pty のすべての spawn にこの env を渡す** (`tmuxManager` / `ttydManager` / `ptyManager`)。
- さらに tmux の全呼び出しと ttyd の `attach-session` に **`-u` (UTF-8 を強制)** を付与。
  ロケール検出に頼らないので二重に安全。

**注意**: tmux サーバーはアプリを再起動しても生き残るため、**この修正を反映するには
`tmux kill-server` が必要**(稼働中のエージェントセッションは失われる)。

## 2. アーキテクチャの現状

### 実行モデル(重要 — 昔の資料と食い違う)

```
[単独]  選択中エージェント1体に投げる → 結果を受け取る。それだけ。
        runTask({ title, body, agentId })  ※agentId は store の selectedAgentId
```

- **もう存在しないもの**: root / edges / `[TO: name]` パース / 親への完了報告 / 子への再dispatch /
  `pendingDispatches` / `dispatchMode` / `organizationDirty` / `parseToBlocks.ts` /
  **合議 (deliberation) — v11 (2026-07-31) で撤去済み**。実行は常に単独実行のみ
  (付箋の「渡す」= `assignNote` も単独実行の一種)。
- `GraphNode.isRoot` と `GraphEdge` 型・zodスキーマは**古い graph.json を読むためだけ**に残置。
  保存時は常に `edges: []`。読んでも無視する。

### 陣地 (旧称プロジェクト囲い) — v10: フォルダ展開モデル (2026-07-31 更新)

> v8 (包含ネストモデル: React Flow の `parentNode` + 相対座標) は v9 (樹形図+線) で置き換え、
> v9 の「フォルダ→エージェントの線」は v10 (このセクション) でクリック展開方式に置き換えた。
> `src/utils/projectGroups.ts` (v8 時点で既に死んでいた旧・中心点包含 hit-test コード) は削除済み。
> `layoutNested` / `deriveTerritoryLayout` / `findFreeSlotInParent` / `contentOriginOffset` も
> 削除済み。正典は `utils/territoryTree.ts` の `layoutTree` (唯一のレイアウト関数)。
> **v10 で `parentNode`/`extent:"parent"` が部分的に復活した**点に注意 (v9 で「もう使わない」と
> 書いていたが、展開中の陣地に属するエージェントだけ、その陣地の箱からはみ出させない目的で
> 再び使っている。陣地・枝・root 自身は相変わらず絶対座標のトップレベルノードで `parentNode` は
> 使わない)。

- 型: `ProjectGroup = { id, name, folderPath, parentGroupId, position, size, createdAt }` / 永続化は `groups.json`。
  `parentGroupId` は最も近い**祖先の陣地** (中間の branch/root は飛ばす) の id (v8 から意味不変)。
  **`position`/`size` は v9 でキャンバス上の絶対座標に戻った**(v8 は親からの相対座標だった)。
  `size` は手動リサイズ廃止 — 常に `utils/territoryTree.ts` の固定サイズ (陣地の色付きボックスは
  中身に依存しない固定サイズになった。v8 は中身を包含する導出サイズだった)。
- 陣地一覧は実フォルダの親子関係から `buildTerritoryTree` (トライ木 + パス圧縮、v8 から不変) で
  ツリー化し、`layoutTree` (tidy tree アルゴリズム。v10 で `expandedGroupIds: Set<string>` が
  第4引数に追加された) が全陣地・全エージェントの絶対座標・`colorIndex` (枝の色。root の直接の
  子ごとに 0〜4 を割り当て子孫が継承) と、フォルダ→フォルダを結ぶ**線 (edge)** を計算する
  (**v10 でフォルダ→エージェントの edge は廃止**。エージェントはもう樹形図の葉ではない)。
  展開中の陣地は「ヘッダ+エージェント格子」の可変サイズになり、その直属エージェントの絶対座標が
  `agentPositions` に返る (折りたたみ中の陣地のエージェントは含まれない)。**「整理」ボタン
  (`arrangeAll`) と展開/折りたたみのトグル (`toggleGroupExpanded`) だけがこれを呼ぶ**
  (陣地の追加・削除・フォルダ変更・所属変更も内部で `arrangeAll` を呼ぶ。v8 にあった「既存の手動配置を
  尊重する軽量な再計算」は、絶対座標のグローバルな tidy tree では一貫性を保てないため廃止した)。
  **陣地・エージェントの手動ドラッグ移動だけは `arrangeAll` を呼ばず**、絶対座標をそのまま保存する。
- 描画は `MindMapCanvas.tsx` が `territoryLayoutNodes` (陣地・枝・root は全ノード絶対座標、
  `parentNode`/`extent` は使わない) と `territoryLayoutEdges` (フォルダ→フォルダのみ。
  React Flow の `type:"default"` = 組み込みベジェ曲線) をそのまま渡す。**エージェントノードだけ
  v10 で出し分けが入った**: 展開中の陣地に属するエージェントは `parentNode`+`extent:"parent"`
  (座標は `layoutTree` の絶対座標から陣地ノードの絶対座標を引いた相対座標に UI 層で変換)、
  折りたたみ中は `hidden:true`、未所属は従来通り絶対座標の自由ノード。
- 所属は `GraphNode.groupId` のまま。**エージェントのドラッグによる所属変更**は包含 hit-test の
  代わりに「ドロップ位置に最も近い陣地 (中心間距離)」が 240px 以内かどうかで判定する
  (`MindMapCanvas.tsx` の `nearestTerritoryGroupId`)。遠ければ所属を変えず座標だけ更新。
  **v10 の注意**: 展開中の陣地のエージェントは `extent:"parent"` で物理的に箱の外へドラッグ
  できないため、この経路が実際に働くのは未所属エージェントが主になる。
- **cwd の受け渡し方式は変更なし**: 陣地に入った時点で `agent.workingDirectory` を書き換える
  (`assignNodeToGroup` / `setProjectGroupFolder`)。electron 実行系 (`ptyManager` / `agentRunner` /
  `tmuxManager`) は無改造のまま。
- 陣地から出しても `workingDirectory` は変更しない(直前のフォルダを維持)。
- 旧 `boards.json` は引き続き**読み取り専用のマイグレーション元**。
- **既知の落とし穴 (React Flow + Handle の組み合わせ)**: カスタムノードに `<Handle>` が無いと
  線が一切描かれない (`Couldn't create edge for source handle id: undefined` の console 警告)。
  さらに、Handle の位置計測は内部で `ResizeObserver` に依存しており、**ページが
  `document.visibilityState === "hidden"` (ブラウザ検証ハーネスや Electron ウィンドウが
  バックグラウンド起動する場合など) だと `ResizeObserver` も `requestAnimationFrame` もブラウザに
  止められ、線が永久に描かれない**。React Flow 標準の `useUpdateNodeInternals` は内部で rAF を
  使うため、この状況では効かない。`MindMapCanvas.tsx` は `useStoreApi()` から
  `updateNodeDimensions` を直接呼ぶ rAF 非依存の同期版を自前で実装し、ノード一覧が変わるたびに
  明示的に計測を強制することでこれを回避している。

### store の主な契約 (v10)

```ts
// 陣地ツリー (v9: 樹形図モデル。派生状態、store が都度再計算してキャッシュ)
territoryTree: TerritoryTreeNode | null
territoryLayoutNodes: TerritoryLayoutNode[]  // { id, kind, label, path, groupId, position, size, colorIndex }
                                               // position は絶対座標 (v8 の「親からの相対座標」から差し戻した)
territoryLayoutEdges: TerritoryLayoutEdge[]  // { id, source, target, colorIndex } — v9 で復活、v10 でフォルダ→フォルダのみに

// v10: 展開中の陣地 (groupId) の集合。UI状態のみ、永続化しない。既定は空 (全折りたたみ)。
expandedGroupIds: Set<string>
toggleGroupExpanded(groupId: string): void  // 展開/折りたたみをトグルし、内部で arrangeAll を呼ぶ

// 陣地 (ProjectGroup) — 型は上記参照。position/size は v9 で絶対座標・固定サイズに変わっている。
projectGroups: ProjectGroup[]
addProjectGroup({ name, folderPath, position, size?, parentGroupId? })  // 低レベルAPI。内部で arrangeAll を呼ぶ
addTerritory(): Promise<void>             // フォルダ選択→追加 (「+ 陣地」ボタン本体)
renameProjectGroup(id, name) / setProjectGroupFolder(id, path)   // cwd も一括更新 (folder変更は arrangeAll を呼ぶ)
deleteProjectGroup(id)                    // 中身は祖先陣地へ引き上げ、arrangeAll を呼ぶ
moveTerritory(groupId, position)          // 陣地の手動ドラッグ (絶対座標。arrangeAll は呼ばない)
arrangeAll(): void                        // 「整理」ボタン。全陣地・全エージェント・線をフルリフロー
createAgentInTerritory(groupId, type): Promise<void>  // 「+ エージェント」。必須は type のみ。arrangeAll を呼ぶ
assignNodeToGroup(nodeId, groupId | null): Promise<void>  // 所属変更 (ドラッグ近接判定 or Inspector select)。arrangeAll を呼ぶ
updateNodePosition(nodeId, position)      // エージェントカードの手動ドラッグ (絶対座標。arrangeAll は呼ばない)

// 可視化
activityByAgent: Record<string, { line: string; at: number }>  // PTY末尾から3秒スロットルで抽出
runningSince: Record<string, number | null>
inboxItems: InboxItem[] / inboxOpen / pendingPermissionRequests
pushInboxItem / markInboxRead / markAllInboxRead / setInboxOpen
respondPermission(requestId, allowed)          // ダイアログ・Inbox共通
respondPermissionFromInbox(inboxItemId, allowed)

// UI連携 (Provider を持ち上げない代わりの仕組み)
focusGroupId / requestFocusGroup(id) / clearFocusGroup   // Sidebar→Canvas のパン依頼
```

`window.mao` に追加された IPC: `groups.{load,save}`、`dialog.pickDirectory()`。

## 3. 作業の進め方(この案件のルール)

1. **現行ビジュアルデザインは維持する。**ユーザーが今の見た目(brand-*トークン、全画面キャンバス+
   フローティングパネル、カードのグロー)を気に入っている。**新しい配色やデザイン言語を発明しない。**
   Notion/Linear風の三分割ドッキングレイアウトも意図的に採用していない。
2. **実装は Sonnet の複数エージェントに委任**してコストを抑える方針。同じファイルを触る担当は
   **直列**に流す(並列にすると衝突する)。委任時は「store の契約」「触ってはいけないファイル」
   「デザイン維持」を明記する。
3. ~~合議エンジン (`electron/deliberation.ts`) は触らない。~~ **v11 (2026-07-31) でコードベースから
   完全撤去済み。** エンジン正典だった CONCEPT_v3.ja.md は歴史的記録として残置。
4. コミットはユーザーの指示があるまでしない。

### ⚠️ 環境: node_modules は iCloud 同期から外してある

このリポジトリは `~/Desktop` 配下にあり、macOS の「デスクトップと書類」iCloud 同期の対象。
**iCloud が `node_modules` の一部をクラウドに退避すると、読み取りが `ETIMEDOUT` で失敗して
Electron が起動しなくなる**(2026-07-29 に実際に発生。`node_modules/electron` が丸ごと読めなくなった)。

対策として **`node_modules` を `node_modules.nosync` にして symlink** を張ってある
(末尾 `.nosync` のフォルダを iCloud は同期しない):

```
node_modules -> node_modules.nosync
```

**`npm install` は symlink を実ディレクトリに戻してしまう**ので、依存を入れ直したら必ずこの順で復旧する:

```bash
cd /Users/komaireo/Desktop/AI_combo/multi-agent-orchestrator && npm install && rm -rf node_modules.nosync && mv node_modules node_modules.nosync && ln -s node_modules.nosync node_modules
```

症状が出たときの見分け方: `readFileSync` の `ETIMEDOUT (errno -60)`。ファイルは `ls` で見えるのに
中身が読めない/0バイトになる。**コードのバグではない。** 恒久対策としてはリポジトリを
iCloud 同期外(`~/dev/` など)へ移すのが望ましい。

### ブラウザだけで UI を検証する方法

Electron を起動せず、`window.mao` をモックした Vite で描画確認できる(デモデータ入り):

```bash
cd /Users/komaireo/Desktop/AI_combo/multi-agent-orchestrator && npx vite --config .claude/vite.browser.config.ts --port 5273 --strictPort
```

- モック定義は `.claude/vite.browser.config.ts`(gitignore済)。API を増やしたら**モックにも追加**しないと落ちる。
- Claude Code のプレビュー機能から使う場合は `~/.claude/launch.json` の `mao-renderer` エントリ。
- **限界**: ttyd/tmux が無いので interactive モードのターミナルは黒画面。ドラッグ操作も合成イベントでは動かない。
  最終確認は必ず `npm run dev`(実機)で。

## 4. 次にやること

**Phase 2 — vault-first**([CONCEPT_v5.ja.md](CONCEPT_v5.ja.md) §バックエンド)

1. `electron/vaultStore.ts` を新規作成。Obsidian vault を single source of truth にする
   (Markdown + frontmatter、zod検証、`Agents/` `Boards/`(→`Projects/` に読み替え) `Runs/`)
2. 一方向同期 (MAO→vault) → その後 chokidar で双方向、`maoRev` で世代管理
3. `Home.md` 自動生成と `[[wikilink]]` 接続
4. 既存 JSON はキャッシュ兼フォールバックに降格。初回設定時に一括マイグレーション

**着手前に必ず**: CONCEPT_v5 の vault ディレクトリ構成が「Boards/」表記のまま残っている箇所がある。
v6でボード→プロジェクト囲いに変わったので、**`Projects/<project>/` に読み替えて実装**し、
ドキュメントも合わせて直すこと。

## 5. 既知の懸念・落とし穴

1. **chokidar の自己ループ** — MAOの書き込みをwatcherが拾って無限ループ。書き込みパスの一時ミュート
   + `maoRev` 比較の二段構えで防ぐ。Phase 2 で最初に踏む地雷。
2. **複数プロジェクト × tmux** — tmux session は今も `mao-orch` 1本。プロジェクトが増えると
   window名衝突・切替誤爆の恐れ。session をプロジェクト別にするか window名に含める。
3. **「今やっていること1行」** — stripAnsi後の末尾非空行を出す素朴実装。CLI別の凝ったパースは
   v2 の stdout regex 地獄の再来になるので**やらない**(v3の教訓)。
4. **frontmatter の手編集破壊** — 人間がObsidianでYAMLを壊すのは日常。ファイル単位でzod隔離し、
   「このファイルを無視しています」をUIに出す(黙殺しない)。
5. **iCloud/Dropbox上のvault** — 部分書き込みをwatcherが拾う。書き込みは tmp→rename の atomic write で。
6. **Inboxの通知洪水** — 完了報告まで全部入れると即座に形骸化する。既定は「人間の判断が要るもの」のみ。
7. **ハードコード文言の残存** — `GearMenu.tsx` / `TerminalDrawer.tsx` 等に i18n を通していない
   英語文言が残っている(既存の負債。今回のスコープ外)。
8. **`window.prompt` は Electron のレンダラで常に `null` を返す (実際に踏んだバグ)** — プロジェクト名の
   変更・新規作成が無反応になっていた原因。`window.confirm` は動く (削除確認などはそのまま使用)。
   `window.prompt` / `window.showModalDialog` は今後も**絶対に使わないこと**。名前入力が要る箇所は
   常にその場 `<input>` インライン編集にする (`MindMapCanvas.tsx` の囲いヘッダ、`Sidebar.tsx` のプロジェクト行が実装例)。
9. **Electron 互換性監査 (2026-07-31 実施)** — `src/` を `window.prompt|window.confirm|alert(|showModalDialog|execCommand|navigator.clipboard` で grep。
   `window.prompt` (今回修正)、`window.confirm` (問題なし、`Sidebar.tsx`/`MindMapCanvas.tsx` の削除確認で使用継続) 以外に、
   `src/components/SetupCheckModal.tsx:174` で `navigator.clipboard.writeText(cmd)` を使用している箇所を発見。
   Electron のレンダラでも `navigator.clipboard` 自体は使えるが、権限・フォーカス状態によっては失敗することがある
   (エラーハンドリングなしの `void` 呼び出し)。今回のスコープ (プロジェクト名編集) 外のため未修正、次回要検討。
10. **React Flow の edge は `ResizeObserver`/`requestAnimationFrame` に依存する (v9 で実際に踏んだバグ)** —
    カスタムノードに `<Handle>` を置くだけでは足りず、ページが `document.visibilityState === "hidden"`
    (バックグラウンドタブ・最小化ウィンドウ等) の間はブラウザが `ResizeObserver`/rAF を止めるため、
    Handle の位置計測が永久に走らず線が一切描かれない。React Flow 標準の `useUpdateNodeInternals` も
    rAF 経由なので効かない。`useStoreApi().getState().updateNodeDimensions` を rAF を挟まず直接呼ぶ
    (`MindMapCanvas.tsx` 参照)。Electron ウィンドウが非表示/最小化状態で起動する構成を今後追加する場合は
    このパターンを踏襲すること。

## 6. 参照

- 正典: [CONCEPT_v5.ja.md](CONCEPT_v5.ja.md) / 旧・合議エンジン正典 (v11で撤去、歴史的記録): [CONCEPT_v3.ja.md](CONCEPT_v3.ja.md) / GTM: [CONCEPT_v4.ja.md](CONCEPT_v4.ja.md) / LP: [LP_COPY.ja.md](LP_COPY.ja.md)(v6の一言に要改訂)
- ワークスペース実データ: `~/.multi-agent-orchestrator/workspaces/default/`
  (`agents.json` / `graph.json` / `notes.json` / `groups.json` / `boards.json`(旧) / `tasks.json` / `agent_history.json` / `project_summary.md`)
- 事業side の記録: Obsidian `~/Desktop/app-business/03-apps/mao-os.md`
