# 次にやること — 2026-08-01 中断時点の指示書 (2026-08-04 更新)

> 電源断の可能性があり、作業を中断した時点のメモ。**再開時はこの1枚を最初に読む。**
> **2026-08-04: §3 の軽量化を実装した (実機確認は未了)。§0 の「終了させるな」は解消済み。**
> 実装の全体像・アーキテクチャは [HANDOFF.ja.md](HANDOFF.ja.md)、製品コンセプトは
> [CONCEPT_v5.ja.md](CONCEPT_v5.ja.md) を参照。ここには**まだファイル化されていない決定事項**と
> **次の作業順**だけを書く。

## 0. 最優先の注意

- ~~**MAO を「終了」させないこと。**~~ **解消済み (2026-08-04)。** 終了時は `detachAll()` を呼ぶようになり、
  `kill-session` はしない。アプリを閉じても `mao-orch` のエージェントは生き続け、次回起動時に
  購読が張り直される。明示的に全部止めたいときだけ UI の abortAll → `killAll()`
  (= `agent-*` window だけを落とす。`welcome` とセッション自体は残る)。
- エージェントの様子を見たいときは MAO を介さず直接 attach する(軽い・確実):
  ```bash
  tmux attach -t mao-orch
  ```
  `Ctrl+B → n` で次の window、`Ctrl+B → d` でデタッチ(デタッチしてもエージェントは動き続ける)。
- **git は未コミット。** 今日作った `utils/territoryTree.ts` / `electron/env.ts` などは **git 未追跡**で、
  コミットしないと失われる。再開したら**まずコミットする**。

## 1. まだファイル化されていない決定事項 (2026-08-01)

### 収益モデルを決定した

- **ベースは無料で個人にばら撒く**。機能は削らない(陣地・エージェント管理・ターミナル・Inbox・vault 全部)
- **チーム/商用 = 商用利用ライセンス**。Obsidian と同じく**機能差をつけず**、会社で使うならライセンスを買う形
- 監査ログ・共有 vault などは後から乗せる
- **着手タイミングは「まず無料で配って反応を見る」**。Lemon Squeezy・ライセンスキー検証・課金導線は**今は作らない**
- v4 の「無料プランなし・ハードペイウォール」は**意識的に反転させた**。
  v4 の「買い切りが成立する理由(限界費用ゼロ)」は生き残るが、「無料層を作らない」は捨てる

### 合議機能は撤去した (v11)

理由: 連携側の機能でコンセプト外 / 機能差なしの商用ライセンスにしたので「有料の目玉」という保持理由も消滅 /
差別化の本体は合議ではなく**ベンダー中立な管理面** / 実運用で未使用のまま保守コストだけ払っていた。

## 2. 宣伝の前に必ず直すべきもの (順番厳守)

> **2026-08-04 更新: ①〜③は完了。** 残りは④のみ。
> ②は「internal business use」「self-hosted for your organization」を Additional
> Use Grant から外し、組織での本番利用は商用ライセンス必須に修正済み。Change Date も
> 固定日付をやめ「各バージョンの公開から4年」のローリング方式 (HashiCorp/MariaDB型) に変更済み。
> ③は README.ja.md / README.md / LP_COPY.ja.md を v5〜v11 の実仕様
> (陣地ツリー・付箋・Inbox・個人無料+商用ライセンス) に刷新済み。

### ① コミット (最優先) — ✅ 完了
未コミット33件+未追跡ファイル。公開作業の前に保全する。

### ② LICENSE の修正 ← **公開前の必須ライン** — ✅ 完了 (2026-08-04)

**現在の LICENSE が収益モデルと矛盾している。** BUSL-1.1 の Additional Use Grant に:

> - internal business use within your company, school, lab, nonprofit, or other organization

とあり、**企業の社内利用を無料で明示的に許可している**。禁じているのはホスティング販売だけ。
このまま公開すると**企業に売るものが無くなる**。

**しかも後から直せない** — 一度この条件で配ったバージョンについて、受け取った側の権利は取り消せない。
後で有料化すると後出しと受け取られる。**必ず公開前に直す。**

修正方針: Additional Use Grant から「internal business use」を外し、**個人・教育・研究は無料のまま**、
**組織での利用は商用ライセンス**に。source-available の姿勢(n8n 的)は維持しつつ、
企業利用は有料(Obsidian 的)にする、という今回決めたハイブリッドをライセンス文面に落とす。

**併せて検討**: Change Date が `2030-06-01` の固定値になっている。このままだと 2029 年にリリースした
コードもほぼ即座に Apache-2.0 化する。MariaDB/n8n 方式の「各リリースから4年」のローリング方式にするか、
意識的に決めること。

### ③ README / LP の刷新 — ✅ 完了 (2026-08-04)

`README.ja.md` が**存在しない製品を説明している**。「マインドマップで役割分担して動かす」「組織保存」と
書かれているが、**紐付けは v5 で、合議は v11 で撤去済み**。今リポジトリを訪れた人は実物と違う説明を読む。
`docs/LP_COPY.ja.md` も v4 の「付箋を貼るとAIチームが会議して決める」のままで要改訂。

### ④ 動画・SNS 発信

**方針**: 今できることに絞る。誇張しない。

- **使える切り口**: 「どのフォルダで何が動いているか分からなくなる」→ 樹形図で稼働中のフォルダが色で光り、
  クリックすれば中のエージェントが見える。**今すぐ実演できる**
- **まだ使えない切り口**: 「どのセッションがどの内容だったか分からない」→ 過去セッションを内容で検索する
  機能は無い。**Phase 2 (Obsidian vault-first) 以降**。ここまで謳うとデモが期待を裏切る
- **ターゲティング**: Claude だけの人には MAO は「重いだけ」。刺さるのは
  **2社以上のCLIを併用 × 3体以上同時 × 複数フォルダ**の人。動画の1行目でそこを名指しする

## 3. 軽量化 — 実施済み (2026-08-04)

コードは入れたが**実機 (Electron + tmux) での動作確認はまだ**。`tsc --noEmit` と
`electron-vite build` は通過、tmux 側のコマンドは scratch セッションで単体検証済み
(tmux 3.6a: `resize-window -x/-y` / `pipe-pane` の on・off / `agent-*` window だけの kill)。

### ① `killAll()` から `kill-session` を外した (前提修正)

- `TmuxManager.detachAll()` を新設。pipe-pane を止め、tail と一時ログを片付け、**セッションは残す**。
  `will-quit` はこちらを呼ぶ。放置すると MAO 終了後も tmux 側の `cat >> /tmp/mao_tmux_*.log` が
  動き続けるので、pipe-pane の停止は必須
- `killAll()` (abortAll 用) は `kill-session` をやめ、`agent-*` window だけを落とす方式に変更。
  `welcome` や MAO 以外の window を巻き添えにしない
- これで `electron/` を編集して Electron が再起動してもエージェントは死なない

### ② ttyd を除去した

- `electron/ttydManager.ts` を削除。`mao:tty:getUrl` チャンネル、systemCheck の ttyd 必須要件、
  README の ttyd 行も削除
- `TerminalPanel` の iframe を廃止し、**interactive も exec も同じ xterm.js に流す**。
  出力は既に `pipe-pane → tail → IPC` で届いていたのでそれを描くだけ。
  常駐サーバ1つ・WebSocket 1本・エミュレータ1段・PTY 1つが消えた
- ttyd が担っていたリサイズ通知は自前で実装: `mao:pty:resize` を追加し、
  xterm の fit 結果を `tmux resize-window` に流す (120ms デバウンス)。
  `PtyManager.resize()` も併せて追加
- `mao:tmux:selectWindow` → `mao:tmux:watch` に変更。ensureCapture + select-window はするが、
  **attach 済みクライアントを奪う `switch-client` はやめた** (直接 attach して別 window を
  見ている最中に画面を飛ばされないように)
- 初回スナップショットを `capture-pane -p -e` にして色を残すようにした

**残った副作用**: `resize-window -x/-y` はその window を手動サイズに切り替えるため、
直接 `tmux attach` した端末では MAO 側のサイズで表示される。端末幅に戻したいときは
`tmux resize-window -A`。

### ③ ログ経路の二乗コストを潰した (ttyd 除去より効く可能性あり)

ttyd があった頃も **interactive の出力は裏で store にも積まれていた**ので、ここは元から効いていた。

- `appendLog` が 1 チャンクごとに `set()` していた。ログ配列を丸ごとコピーし直し、購読側を全部
  再レンダリングし、ディスク書き込みの IPC を 1 往復ずつ走らせていた。**50ms バッチ**にまとめ、
  永続化も 1 バッチ 1 往復に結合
- ログを**リングバッファ化 (agent あたり 400 チャンク上限)**。以前は無制限に伸びていた
- 「どこまで描いたか」は配列長では判定できなくなるので `logSeq` (単調増加カウンタ) を追加
- `MindMapCanvas` の AgentNode が**末尾5行を出すためだけに全履歴を join + stripAnsi** していた。
  末尾 20 チャンクだけ見るように変更 (カード数 × 出力速度で効いていた)
- `TerminalPanel` はログ本体を React で購読するのをやめ、**store を直接 subscribe** して
  xterm に書く (1 チャンクごとのパネル再レンダリングが消えた)。タブ一覧は
  「出力を持つ agent の id 一覧」だけを見る
- `TerminalDrawer` は閉じている間 `TerminalPanel` をアンマウントする
  (画面外の xterm が描画し続けていた)。アニメーション 300ms 後に外す

### ④ 副産物: `tsc --noEmit` が 12分 → 数秒になった

`src/components/DeliberationPanel.tsx` と `electron/deliberation.ts` (どちらも v11 の合議撤去で
**参照ゼロになった死にコード**、かつ git 未追跡) が iCloud の dataless ファイルになっていて、
**読もうとしたプロセスが永久にブロックされる**状態だった。tsc も vite dev もここで固まっていた。

`*.unused-v11` にリネームして tsconfig の対象から外した (中身は読めないので削除はしていない)。
**中身が不要と判断できるなら消してよい。** 根本対処は §4 の「iCloud 同期外へ移す」。

## 4. その他の宿題

- `~/Desktop/会社分析/.mao/` に一時ファイルが **89個**残っている。設計上はタスク終了時に削除されるはずで、
  削除処理が想定通り動いていない。掃除 + 原因調査
- `DESIGN.md` の作成 — [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) の**フォーマットだけ**借りて、
  MAO 自身のデザイン規約(brand-* トークン、フローティングパネル様式、やらないこと)を明文化する。
  委任のたびに「現行デザインを維持」と書く手間と解釈のブレが消える。
  **他社の DESIGN.md をそのまま採用しないこと** — MIT はリポジトリのファイルに及ぶだけで、
  各社のトレードドレスや商標には及ばない。特に Claude の DESIGN.md は Anthropic との誤認を招くので避ける
- `dist/` に 2026-05-16 ビルドの古い `.app` と `.dmg`(131MB)が残っている。混乱の元なので削除を検討
- リポジトリを iCloud 同期外(`~/dev/` 等)へ移すこと。`node_modules` は `.nosync` + symlink で回避済みだが、
  `npm install` のたびに symlink が実ディレクトリに戻るので復旧が必要(HANDOFF §3 参照)
