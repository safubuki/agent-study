# mcp-guide — MCP（Model Context Protocol）を「使う／使わない」で比べて学ぶ

このフォルダ（`agent-study/mcp-guide`）は、隣の [agent-guide](../agent-guide/) と同じ構成で、**MCP**（Model Context Protocol：AI に専用の道具やデータ窓口をつなぐ共通規格）を基礎から実践・設計パターンまで学ぶための作業場です。

> [!NOTE]
> **はじめての方は、まず全体像から**：人・AI アプリ・LLM・MCP サーバー・その先のアプリの関係を 1 枚にまとめた図を [docs/00 の 0 章](docs/00_mcp-guide.md) に置いています。
>
> ![MCP の全体像](docs/assets/mcp-big-picture.svg)

> [!TIP]
> **AI の契約や外部パッケージなし・0.1 秒で体験**
> `mcp-guide` フォルダで `node scripts/test-mcp-server.js` を実行すると、Claude Code や VS Code を起動せずに JSON-RPC 2.0 通信（`initialize` → `tools/list` → `tools/call`）の中身をそのまま確認できます（[手順へ](#2-まずは1秒体験mcp-サーバーと直接会話してみるclaude-不要)）。

## どこから読むか（読み物・見本マップ）

| 順番 | ファイル | 内容 |
|---|---|---|
| 動的版 | [interactive-guide.html](interactive-guide.html) | **動かして学ぶ動的ガイド**：**全体像と使い方の 4 つの組み合わせ（ボタンで切り替え）**、JSON-RPC 3ステップ、Kame Cafe 全16商品アレルゲン＆原価率の罠、Tool Poisoning 透視、**入れる前のチェックリストと職場のルール**をブラウザで体験 |
| 1 | [docs/00_mcp-guide.md](docs/00_mcp-guide.md) | **MCP 入門（Claude Code 編）**：**全体像（人・AI アプリ・LLM・MCP サーバー・その先のアプリ）**、Web API との違い、ローカル／クラウドの3使い方、**現場での組み合わせ（既製ツール／自作アプリ × ローカル／リモート）とデータの行き先**、JSON-RPC 3ステップ、CLI・Skills との使い分け |
| 2 | [docs/01_copilot-mcp-guide.md](docs/01_copilot-mcp-guide.md) | **GitHub Copilot / VS Code 編**：`.mcp.json` と `.vscode/mcp.json` の対比、サブエージェント単位のツール絞り込み、企業環境での注意点 |
| 3 | [docs/02_mcp-patterns.md](docs/02_mcp-patterns.md) | **定番パターン5選**：知識・DB ゲートウェイ、外部 SaaS、業務ファサード、サブエージェント隔離、Tool Search / Code Mode と鮮度整理 |
| 4 | [docs/03_mcp-security-and-rules.md](docs/03_mcp-security-and-rules.md) | **安全に使うための注意点と対策**：主なリスク 8 つ、入れる前のチェックリストと点検スクリプト、4 層の守り（組織・AI アプリ・サーバー・人）、職場での申請と審査の流れ、もしものときの手順 |
| 見本 | [samples/README.md](samples/README.md) | **設定＆サーバー実装サンプル集（01〜05）**：最小約60行のサーバーからファサード型・隔離型・Resources / Prompts 実装まで |
| 移行 | [copilot-fusion/01_harness-local-vs-copilot.md](../copilot-fusion/01_harness-local-vs-copilot.md) | **Copilot ハーネス移行ガイド**：旧 Local から Copilot ハーネスへ切り替えたときに MCP が見えなくなる原因と環境変数への移行手順 |
| 出典 | [info/README.md](info/README.md) | **一次情報の出典メモ**：公式仕様・論文・記事 14 件の要約と鮮度ラベル |

---

そしてこの README の以降では、ルートに置いた**架空カフェ「Kame Cafe」のメニュー・アレルギー・原価計算 MCP サーバー**（[servers/cafe-catalog-mcp.js](servers/cafe-catalog-mcp.js)）を使って、

1. **Claude なしでも1秒で体験**：MCP の裏側で流れる JSON-RPC メッセージを自分の目で確かめる
2. **方式 A（`no-mcp`）と方式 B（`with-mcp`）の比較実験**：同じお題の Web ページを作らせ、**数値（アレルギー判定・セット割引・税計算・原価率）の正確さ・時間・トークン消費**を比べる

手順を説明します。

| 方式 | モード名 | やり方 |
|---|---|---|
| A | **`no-mcp`**（生データ丸読み） | MCP を使わず、AI 自身に生データ [data/menu-catalog.json](data/menu-catalog.json) を読ませ、アレルゲン除外判定やセット割引・原価率計算もすべて AI の頭（暗算）でやらせる |
| B | **`with-mcp`**（専用 MCP 利用） | 生データは読ませず、専用 MCP サーバー `cafe-catalog` の3つのツール（`search_menu`、`check_allergens`、`calculate_set_price`）で正確に絞り込み・計算させた結果を使ってページを作らせる |

---

## 1. フォルダ構成

```text
mcp-guide/
├─ README.md                  ← この手順書
├─ .mcp.json                  ← Claude Code・Copilot ハーネス用の MCP 設定（ルートキー：mcpServers）
├─ .vscode/mcp.json           ← VS Code 旧 Local ハーネス用の MCP 設定（ルートキー：servers）
├─ servers/
│   └─ cafe-catalog-mcp.js    ← ★実験用 MCP サーバー（Node.js 標準機能のみで動作・外部パッケージ不要）
├─ data/
│   └─ menu-catalog.json      ← カフェ全16商品の価格・原価・アレルギー・コンタミ・割引ルール
├─ prompts/                   ← お題（A・B で同じ文面を渡す）
│   ├─ 01-allergen-menu.md    … アレルギー安心ガイド＆おすすめペアリング Web ページ
│   └─ 02-seasonal-fair.md    … 秋の収穫祭フェア 特設 LP＆店長向け原価レポート
├─ scripts/
│   ├─ test-mcp-server.js     ← Claude なしで MCP サーバーの JSON-RPC 通信を1秒で検証するスクリプト
│   ├─ inspect-mcp-tools.js   ← ツールの説明文に怪しい書き方（外部 URL・隠し命令・見えない文字など）がないかを点検するスクリプト
│   ├─ fixtures/              ← 点検スクリプトの動作確認用の偽データ（MCP サーバーではない）
│   └─ run-experiment.ps1     ← Claude Code で A・B を実行し、時間・トークン・コストを記録するスクリプト
├─ output/                    ← ★成果物の置き場（実行するたびにフォルダが増える）
│   └─ summary.md             … 全実行の一覧表（自動で1行ずつ追記）
├─ docs/                      ← 読み物4本＋図解 SVG（assets/*.svg）
├─ info/                      ← docs を書くために集めた一次情報の出典メモ（14件、鮮度つき）
└─ samples/                   ← パターン別の MCP サーバー＆設定ファイル見本（01〜05）
```

---

## 2. まずは1秒体験：MCP サーバーと直接会話してみる（Claude 不要）

Claude Code や VS Code を起動する前に、「MCP サーバーって結局何をしているの？」を一番手っ取り早く理解する方法があります。Node.js だけで動くテストスクリプト [scripts/test-mcp-server.js](scripts/test-mcp-server.js) を実行してみてください。

```powershell
cd mcp-guide
node scripts\test-mcp-server.js
```

すると 0.1 秒ほどで、AI アプリ（Client）と MCP サーバー（`servers/cafe-catalog-mcp.js`）の間で行われる **3ステップの会話（JSON-RPC 2.0）** が画面にそのまま表示されます。

1. **`initialize`**（あいさつ）：「私の仕様バージョンは `2025-11-25` です」「私は `tools` と `resources` が使えます」
2. **`tools/list`**（お品書きの取得）：「どんな道具がありますか？」「`search_menu`、`check_allergens`、`calculate_set_price` の3つがあります」
3. **`tools/call`**（道具の実行）：
   - 「小麦・卵・乳（微量混入含む）を一切含まない安全なメニューを教えて」→ **安全な6品と、除外された10品の理由**が JSON で返る
   - 「`FD-001` と `DR-001` をイートインで頼んだときのセット価格と原価率を計算して」→ **セット割引 `-150円` 適用後の税抜 `1,210円`、税込 `1,331円`、原価率 `31.0%`**（目標35%以下で合格）が1ミリも狂わず返る

また、`samples/` にある他のサンプルサーバーも同じスクリプトでテストできます。

> [!TIP]
> **入れる前の点検も 1 秒で**：`node scripts\inspect-mcp-tools.js <サーバー.js>` で、ツールの説明文に怪しい書き方（外部 URL・「ユーザーに言うな」などの隠し命令・見えない文字）がないかを洗い出せます。使い方と注意点は [docs/03 の 2 章](docs/03_mcp-security-and-rules.md) にあります。

```powershell
node scripts\test-mcp-server.js samples\01-minimal-stdio\server.js
node scripts\test-mcp-server.js samples\02-knowledge-search\glossary-mcp.js
node scripts\test-mcp-server.js samples\03-workflow-facade\catering-plan-mcp.js
node scripts\test-mcp-server.js samples\05-resources-and-prompts\full-feature-mcp.js
```

---

## 3. 比較実験を実行する（Claude Code で計測つき）

次に、Claude Code を使って同じお題を **方式 A（`no-mcp`）→ 方式 B（`with-mcp`）** の順で実行し、出来栄え・数値の正確さ・時間・コストを比べます。

### お題1：アレルギー安心ガイド＆おすすめペアリング Web ページ

```powershell
# 方式 A：MCP なし（生データを AI が自分で読んで判定・暗算する）
powershell -ExecutionPolicy Bypass -File scripts\run-experiment.ps1 -Prompt prompts\01-allergen-menu.md -Mode no-mcp -Model sonnet -Open

# 方式 B：MCP あり（cafe-catalog サーバーのツールで正確に抽出・計算する）
powershell -ExecutionPolicy Bypass -File scripts\run-experiment.ps1 -Prompt prompts\01-allergen-menu.md -Mode with-mcp -Model sonnet -Open
```

### お題2：秋の収穫祭フェア 特設 LP＆店長向け原価レポート

```powershell
# 方式 A：MCP なし
powershell -ExecutionPolicy Bypass -File scripts\run-experiment.ps1 -Prompt prompts\02-seasonal-fair.md -Mode no-mcp -Model sonnet -Open

# 方式 B：MCP あり
powershell -ExecutionPolicy Bypass -File scripts\run-experiment.ps1 -Prompt prompts\02-seasonal-fair.md -Mode with-mcp -Model sonnet -Open
```

```mermaid
flowchart LR
    P["prompts/お題.md"] --> S["run-experiment.ps1<br/>ストップウォッチ開始"]
    S -->|"no-mcp（方式A）"| A["claude -p<br/>MCP ツール禁止"]
    A -->|"Read で丸読み＋暗算"| D[("data/menu-catalog.json")]
    S -->|"with-mcp（方式B）"| B["claude -p<br/>--mcp-config .mcp.json"]
    B -->|"tools/call で検索・計算"| M["servers/cafe-catalog-mcp.js"]
    M --> D
    A --> R["ストップウォッチ停止<br/>時間・トークン・コストを記録"]
    B --> R
    R --> O[("output/実行フォルダ<br/>index.html / report.md / summary.md")]
```

---

## 4. 比べるポイント（なぜこの実験で MCP の向き・不向きが分かるのか）

### 4.1 数値とビジネスルールの正確さ（お題1・お題2の正解早見表）

完成した `index.html` を開き、次の計算結果が合っているかを比べてみてください。方式 A（生データ丸読み＋AI の暗算）では、コンタミネーション（微量混入）の見落としや、セット割引後の原価率の計算ズレが起きることがあります。方式 B（MCP）では、サーバー側のプログラムが計算するため **100% 同じ正解値** になります。

#### お題1の正解値（小麦・卵・乳をコンタミ含め一切含まないメニュー：全6品）
- 合格する6品：`DR-001`、`DR-005`、`DR-007`、`FD-001`、`SW-001`、`SW-003`（`DR-002` は小麦コンタミ、`DR-003` は乳コンタミ、`FD-004` は小麦・乳コンタミがあるため、厳密条件では**除外されるのが正解**）
- ペアリング3組の正解値（セット割引 -150円 適用後）：
  | セット | 組み合わせ | 割引後税抜 | イートイン税込(10%) | テイクアウト税込(8%) | 合計カロリー | 原価合計 | 原価率 |
  |---|---|---|---|---|---|---|---|
  | セットA | `FD-001` + `DR-001` | 1,210円 | 1,331円 | 1,306円 | 422 kcal | 375円 | **31.0%** |
  | セットB | `SW-003` + `DR-007` | 1,150円 | 1,265円 | 1,242円 | 500 kcal | 380円 | **33.0%** |
  | セットC | `SW-001` + `DR-005` | 1,030円 | 1,133円 | 1,112円 | 328 kcal | 305円 | **29.6%** |

#### お題2の正解値（秋ペアリング3コースの原価率判定）
| コース | 組み合わせ | 割引後税抜 | イートイン税込(10%) | 合計カロリー | 原価合計 | 原価率 | 目標（35.0%以下）判定 |
|---|---|---|---|---|---|---|---|
| コース1 | `FD-005` + `DR-006` | 1,350円 | 1,485円 | 795 kcal | 480円 | **35.6%** | **基準超過（×）** |
| コース2 | `FD-004` + `DR-007` | 1,520円 | 1,672円 | 625 kcal | 525円 | **34.5%** | **合格（○）** |
| コース3 | `SW-004` + `DR-001` | 1,510円 | 1,661円 | 592 kcal | 505円 | **33.4%** | **合格（○）** |

> [!IMPORTANT]
> **お題2の引っ掛けポイント**：プロンプトには「コース3が超えるかも？」という誘導が書いてありますが、セット割引 150 円引き後の税抜価格に対して計算すると、実際に**基準（35.0%）を超えるのはコース1**（35.6%）です。AI の思い込みではなく MCP ツールの計算結果を信じられるかが試されます。

### 4.2 トークンとターン数の違い

`output/summary.md` で、方式 A と方式 B の入力トークン・ターン数を比較します。
- データが小さいうちは方式 A（Read 1回）の方がターン数が少なく速いこともあります。
- 一方で、カタログが数千件に増えたり、計算ルールが複雑になったりするほど、必要な数件だけをサーバー側で絞り込んで確定値を返す方式 B（MCP）が有利になります（詳しくは [docs/02_mcp-patterns.md](docs/02_mcp-patterns.md)）。

---

## 5. 対話モードや VS Code（GitHub Copilot）で試す場合

- **Claude Code**（対話モード）：**この `mcp-guide` フォルダで** `claude` を起動します（`.mcp.json` は起動したフォルダのものが読まれ、`servers/...` の相対パスもこのフォルダが基準です）。初回は「このプロジェクトの MCP サーバーを使ってよいか」の確認が出るので承認してください。`/mcp` と打つと `cafe-catalog` が認識されていることを確認できます。そのまま「小麦・卵・乳（コンタミ含む）が入っていないメニューを MCP で調べて教えて」と話しかけてみてください。
- **VS Code**（GitHub Copilot Agent Mode）：VS Code でこのフォルダを開くと、Copilot ハーネス（Session Target → Copilot）では `.mcp.json`、旧 Local ハーネスでは `.vscode/mcp.json` が認識されます（このフォルダには両方を置いています）。Copilot Chat を **Agent** モードにして同じように質問してみてください（詳しい手順は [docs/01_copilot-mcp-guide.md](docs/01_copilot-mcp-guide.md)、ハーネス移行の解説は [copilot-fusion/01_harness-local-vs-copilot.md](../copilot-fusion/01_harness-local-vs-copilot.md)）。

> [!NOTE]
> `samples/01`〜`05` の各 `copilot/` フォルダにも、Copilot ハーネス用の `.mcp.json` と旧 Local ハーネス用の `.vscode/mcp.json` の両方を用意しています（詳細は [samples/README.md](samples/README.md)）。
