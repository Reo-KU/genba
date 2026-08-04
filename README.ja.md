# MAO — AIエージェントの仕事場

> ライセンス: MAO は source-available project です。**個人利用・教育利用・
> 研究利用・評価/検証利用、Fork、改造、Pull Request は無料**で許可されます。
> **企業その他の組織での本番利用には商用ライセンスが必要**です。また、MAO
> または派生版を Hosted SaaS / Cloud / managed service / 競合する automation
> platform として提供・販売することは、別途書面による商用ライセンスなしには
> 許可されません。詳細は [LICENSE](LICENSE) を確認してください。
> MAO / MAO OS / MAO Cloud は Reo Komai の商標・ブランド名です。
> 公式リポジトリは
> [github.com/Reo-KU/multi-agent-orchestrator](https://github.com/Reo-KU/multi-agent-orchestrator)
> です。ライセンス・商用利用の問い合わせ先は
> [imopotato8@gmail.com](mailto:imopotato8@gmail.com) です。

**複数の稼働中 CLI エージェント (Claude Code / OpenAI Codex / Gemini CLI /
Grok / 任意のカスタム CLI) を、1枚のボードで見て、動かすデスクトップアプリ。**

- **フォルダ樹形図 (陣地ツリー)**: どのフォルダで何が動いているかが色で分かる。
  稼働中のフォルダは枝色で光り、クリックで展開すると中のエージェントが並ぶ
- **付箋**: やることを付箋に書いて、エージェントに重ねるだけで実行される
- **Attention Inbox**: 承認待ち・エラーなど「人間の判断が要るもの」だけが
  1か所に集まる
- エージェントごとの permission policy、xterm ターミナル、外部から
  attach 可能な tmux backend

agent ごとに skills directory や Obsidian vault を設定し、作業時の追加リソース
として使わせることもできます。vault を設定した agent は、タスク開始時に
vault 内 `MAO/` フォルダ (自動作成) に task note を作り、完了報告や成果物パスを
追記します。workspace 全体を vault 正典化する構想 (vault-first) は
[docs/CONCEPT_v5.ja.md](docs/CONCEPT_v5.ja.md) の Phase 2 ロードマップを参照。

> English version: [README.md](README.md)

> ⚠️ **MAO は agent の CLI を同梱していません。** 各エージェントに設定した
> `command` をそのまま spawn するだけなので、使いたい CLI は別途インストール
> してください（下記 Prerequisites）。

## 前提条件 (Prerequisites)

### 1. 必須のシステムツール

MAO 本体には Node.js のほか、interactive モードのバックエンドとして 2 つの
system バイナリが必要です。

| ツール | macOS インストール | 用途 |
|---|---|---|
| Node.js 20+ | `brew install node` または `nvm install --lts` | アプリ・レンダラのランタイム |
| **tmux** | `brew install tmux` | interactive モードのエージェントは tmux session (`mao-orch`) に収容される |

Linux: apt / dnf / pacman で同等パッケージを入れてください。Windows は未検証。

### 2. 各 agent の CLI (使うものだけ)

実際に登録する agent の `command` だけ用意すれば OK。MAO の allowlist は
`claude` / `codex` / `grok` / `gemini` と、custom 用に `sh` / `bash` / `zsh` /
`python` / `python3` / `node` を許可しています。

| Agent type | インストール例 | 認証 |
|---|---|---|
| `claude` | `npm install -g @anthropic-ai/claude-code` (または公式 installer) | `claude` を一度起動してログイン |
| `codex` | [openai/codex](https://github.com/openai/codex) の手順に従う | `codex login` |
| `gemini` | `npm install -g @google/gemini-cli` | `gemini` の対話セットアップ |
| `grok` | xAI の `grok-cli` (プロジェクト固有) | プロジェクト依存 |
| `custom` | allowlist 内の任意コマンド | プロジェクト依存 |

MAO 起動前に確認:

```sh
which tmux node
which claude codex gemini   # インストール済みのものだけ
```

allowlist 外のコマンドや PATH 上に無いものを指定すると、agent の Status に
"Command not in allowlist" や "posix_spawnp failed" が出ます (黙って失敗
することはありませんが、agent も動きません)。

### 3. (任意) CLI ごとの認証

各 agent CLI は自身でクレデンシャル管理します。MAO はログイン代行を
しません。spawn された CLI が working directory で既に認証済み、という
前提です。MAO に登録する前に、各 CLI を 1 度手動起動してログインしておいて
ください。

## セットアップ

```sh
git clone https://github.com/Reo-KU/multi-agent-orchestrator.git
cd multi-agent-orchestrator
npm install
```

## 開発モード

```sh
npm run dev
```

Vite renderer dev server + Electron アプリを同時に起動します。

## ビルド

```sh
npm run build
```

`out/` 配下に Electron main / preload / renderer の本番ビルドを出します。

## 配布パッケージ

```sh
npm run dist
```

electron-builder で配布パッケージを生成。macOS は `.dmg`、Windows は `.exe` (nsis)。

## ワークスペースの保存先

エージェント設定・グラフ・タスク・履歴は次の場所に保存されます:

```text
~/.multi-agent-orchestrator/workspaces/default/
├── agents.json            # 登録エージェント
├── graph.json             # ボード上のエージェント配置
├── groups.json            # 陣地 (フォルダに紐づく囲い)
├── notes.json             # 付箋
├── tasks.json             # タスク履歴
├── agent_history.json     # agent ごとの応答履歴
└── project_summary.md     # プロジェクト概要 (各 prompt 先頭に注入)
```

JSON は手動編集も可能 (zod で検証され、不正なら空配列で初期化される)。

## ワークスペース内に作られるファイル

MAO は agent の `workingDirectory` 内に `.mao/` ディレクトリを作成し、以下を
管理します:

- `.mao/<taskId>.md` — タスク仕様 (graph 情報 / プロジェクト情報 / 受信指示 / 応答ルール)
- `.mao/signals.log` — タスク完了 signal (agent が echo で追記)

agent には PTY 経由で短い自然文だけが送られ、複雑な文脈は仕様ファイル経由で
読まれます。これは claude TUI の prompt injection 検知や、CLI の sandbox
permission ブロックを避けるためです。

`.mao/` は MAO が起動時に各 workspace の `.gitignore` に自動追記します
(workspace が git 管理下の場合のみ)。タスク仕様ファイルは成功・中断・タイム
アウト・エラーのいずれでも削除され、`signals.log` は大きくなったら rotate
されます。

## 使い方: ボード

### 陣地 (territory) ツリー

キャンバスにはフォルダ構造が**左→右の樹形図**として描かれます
(root=`/Users` → 中間フォルダ → 陣地)。

- **陣地 = フォルダに紐づく作業区画**。陣地の「+ エージェント」から種類
  (claude / codex / gemini / grok / custom) を選ぶだけでエージェントを作成でき、
  working directory は陣地のフォルダに自動で決まる。
- **稼働状態が色で分かる**: 直属エージェントに running がいる陣地は枝色で
  フル彩度に光る。配下に稼働がいる中間フォルダも同様。error は赤バッジ。
  エージェント数バッジは `稼働中/合計` (例 `2/3`)。
- **クリックで展開/折りたたみ**: 陣地をクリックすると中のエージェントカードが
  並ぶ。もう一度クリックで畳む。
- **整理ボタン**: 全体を決定的なグリッドにフルリフローする。手動ドラッグの
  配置は通常時は尊重される。
- **サイドバー** (左端の折りたたみレール): 陣地の一覧。行をクリックすると
  キャンバスがその陣地へパン/ズームする (表示の切替ではなく移動)。

### 付箋

動詞は2つだけ (合議機能は v11 で撤去済み)。

1. **貼る** — 「🗒 付箋」ボタンで付箋を追加し、やることを書く。
2. **渡す** — 付箋をエージェントカードの上にドラッグして重ねると、その
   エージェントが単独で実行し、結果の要約が付箋に書き込まれる。

付箋は `notes.json` に自動保存され、再起動後も盤面が復元されます。

### Attention Inbox

右下のピルに「人間の判断が要るもの」(承認リクエスト・エラー等) が全陣地
横断で集まります。各項目から該当エージェントへジャンプして応答できます。

## UI ガイド

- **Project Summary**: プロジェクト全体の前提や方針を Markdown テキストとして
  編集。各エージェントの prompt 先頭に注入される。
- **Agent History**: Inspector の "直近の応答履歴" で、選択中エージェントの
  最近の入力・応答を確認可能。
- **状態リング**: エージェントカードは状態に応じて光る。starting=黄、
  running=シアン、error=赤。
- **Terminal input**: 最下部 Terminal は入力対応。interactive mode の承認
  プロンプトに直接タイプで応答できる。
- **言語切替**: ヘッダー右上の `EN / 日本語` セレクタで UI とエージェントへの
  プロンプト言語を切替 (localStorage に永続化)。

## セットアップ確認

MAO は起動時に tmux などの必須ツールを確認します。不足がある場合は
セットアップモーダルにインストールコマンドが表示されます。自動インストールに
対応したツールは **Install** ボタンで進捗を見ながら実行でき、手動で入れる場合は
**Copy** してターミナルで実行できます。

## Live Terminal

interactive モードのエージェントは tmux 上の本物の TUI
として下部 Terminal パネルに表示されます。タブをクリックすると tmux の
アクティブ window が切り替わります。exec モードのエージェントは軽量な
xterm ログビューアのまま。

外部のネイティブターミナルから直接 attach するには:

```sh
tmux attach -t mao-orch
```

`Ctrl+B → n` で window 切替、`Ctrl+B → d` でデタッチ。MAO とリアルタイムに
同期します。

## Permission Policy

各 agent には `permissionPolicy` があり、MAO が CLI 別のフラグに翻訳して
spawn 時に渡します:

| Policy | codex | claude | gemini |
|---|---|---|---|
| `safe-auto` (デフォルト) | `--sandbox workspace-write` | `--permission-mode acceptEdits` | `--approval-mode auto_edit` |
| `yolo` | `--dangerously-bypass-approvals-and-sandbox` | `--dangerously-skip-permissions` | `--yolo` |
| `ask` | (フラグ無し) | (フラグ無し) | codex+interactive のみ `-c approval_policy="untrusted"` 等を自動注入 |

- **safe-auto**: 推奨デフォルト。cwd 内のファイル編集は自動承認、cwd の外や
  network / shell の副作用は CLI が拒否 or 個別プロンプト。
- **yolo**: 全プロンプトをスキップ。信頼できるタスク + 後始末の覚悟がある時のみ。

### `ask` (都度承認) と CLI 別の挙動

`ask` は MAO が個別の tool call に介入できる唯一のポリシー。CLI が公開している
hook 次第で挙動が変わります:

| CLI | `ask` + `exec` | `ask` + `interactive` |
|---|---|---|
| **claude** | ✅ MAO モーダル。Write / Bash 等の tool call ごとに "⚠️ Permission Request" ダイアログが出る (`--permission-prompt-tool` 経由) | ✅ 同じモーダル。または CLI の TUI プロンプトが下部 Terminal に表示 |
| **codex** | ⚠️ codex exec は `approval: never` 固定で承認 hook 無し。MAO は危険操作を黙って拒否する。Inspector に黄注意あり | ✅ codex の TUI プロンプトが下部 Terminal に出るので `y` / `n` / `1` / `2` でタイプ |
| **gemini** | ⚠️ 同じく hook 無し。Inspector が警告 | ✅ Gemini の TUI プロンプトが下部 Terminal に出る |
| **grok / custom** | ⚠️ CLI 依存 | ✅ CLI が TUI でプロンプトを出すなら下部 Terminal で対応 |

つまり:

- 「危険操作は必ずダイアログで都度確認したい」→ **claude** + `mode=exec` + `permissionPolicy=ask` がベスト
- 「codex / gemini で承認したい」→ `mode=interactive` に切替、下部 Terminal でタイプ
- 「完全自動化したい (cwd内サンドボックスあり)」→ `safe-auto` のまま、必要に応じて個別 agent を `yolo` に

interactive モードは `agent.run` から signal-based の完了検知で動きます (5分タイムアウト)。長時間タスクや承認が多いタスクに有効。

## トラブルシューティング

### node-pty: spawn-helper permission error

初回起動時に "spawn-helper: Permission denied" が出る場合:

```sh
chmod +x node_modules/node-pty/build/Release/spawn-helper
```

`postinstall` (`electron-builder install-app-deps`) で自動的に処理されます。
解消しない場合は `npm rebuild node-pty` を手動実行。

### rollup: Cannot find module @rollup/rollup-darwin-arm64

npm の optional-dependencies バグが原因。以下で解消:

```sh
rm -rf node_modules package-lock.json
npm install
```

または `npm run repair:arch` (arm64 native module をピンポイントで復元する
スクリプトが同梱されています)。

### esbuild: installed for another platform

Rosetta 2 越しに npm install するなど、PM/CI 環境とインストール環境の
arch が異なる場合に発生。両方のバイナリを `optionalDependencies` に
明示すれば回避可。

### Electron 起動時にウィンドウが開かない

- ポート競合の可能性: `lsof -i :5173`
- dev mode は環境変数 `ELECTRON_RENDERER_URL` を使う

### 言語切替が反映されない

ヘッダーのセレクタ変更は即時反映されますが、interactive モードで既に
spawn 済みの agent には新しい prompt 言語が次の Run から適用されます。
すぐ反映したい場合は agent を Stop → Start で再起動してください。
