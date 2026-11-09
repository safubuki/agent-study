# MCP の定番パターン5選 — 効く理由・失うもの・CLIやスキルとの使い分け

> この文書は「MCP サーバーはどう設計し、どう組み合わせると本当に役に立つのか？逆に、いつ MCP を使わずに CLI やスキル（Skills）で済ませるべきか？」について、公式仕様・AI 企業のエンジニアリングブログ・セキュリティ調査で繰り返し示されている**定番の型を5つ**に絞って説明する読み物です。
> 調査日は **2026-11-10**。集めた一次情報（10件）は出典ごとに [info/](../info/README.md) にメモしてあります。
> MCP を取り巻く常識は、2024年末の誕生から 2025年秋の「トークン肥大化問題」、そして 2026年の「オンデマンド検索（Tool Search）・コード実行（Code Mode）・Skills との住み分け」へと急速に変化しました。そこで各パターンに**根拠の鮮度**を付け、[7章](#7-ai-の進化で変わるmcpcliスキルの境界線)で最新の境界線を整理しています。
> 出典のない記述や筆者の判断には「筆者の整理」と書いています。

### 鮮度ラベル（2026-11-10 基準）

| ラベル | 公開時期 | 読み方 |
|---|---|---|
| **新** | 6か月以内（2026-05 以降） | そのまま参考にしてよい |
| **中** | 6〜12か月前（2025-11〜2026-04） | 考え方は有効。設定名や細部の挙動は最新ドキュメントと照合する |
| **古** | 12か月超（〜2025-10） | 原則は重要だが、当時の「全ツール定義を毎回プロンプトに一括読込する実装」を前提にした議論が混ざっている点に注意 |

---

## 目次

0. [まず結論（早見図）](#0-まず結論早見図)
1. [大前提：「なんでも MCP にすれば良い」わけではない](#1-大前提なんでも-mcp-にすれば良いわけではない)
2. [パターン①：社内知識・DB の読み取り専用ゲートウェイ](#2-パターン①社内知識db-の読み取り専用ゲートウェイ)
3. [パターン②：外部 SaaS・ブラウザ操作のブリッジ](#3-パターン②外部-saasブラウザ操作のブリッジ)
4. [パターン③：複数ツールを1つの「業務ワークフロー」に束ねる（ファサード型）](#4-パターン③複数ツールを1つの業務ワークフローに束ねるファサード型)
5. [パターン④：サブエージェント×専用 MCP（権限と文脈の隔離）](#5-パターン④サブエージェント専用-mcp権限と文脈の隔離)
6. [パターン⑤：コード実行・オンデマンド読み込み（Tool Search / Code Mode）](#6-パターン⑤コード実行オンデマンド読み込みtool-search--code-mode)
7. [AI の進化で変わる「MCP・CLI・スキル」の境界線](#7-ai-の進化で変わるmcpcliスキルの境界線)
8. [まとめ](#8-まとめ)
9. [参考文献](#参考文献)

---

## 0. まず結論（早見図）

![MCP のどのパターンを使うか](assets/patterns-map.svg)

| # | パターン | ひとことで | 向く | 向かない | 根拠の鮮度 |
|---|---|---|---|---|---|
| ① | **知識・DB ゲートウェイ** | サーバー側で絞り込み、**該当する数件だけ**返す（読み取り専用） | 社内用語集・商品カタログ・DB から必要な断片だけ正確に引きたい | ファイル1〜2個をそのまま読めば済むとき | 新〜中 |
| ② | **外部 SaaS・状態ブリッジ** | **OAuth 認証**や**開いたままの画面**をサーバーが維持して中継 | Notion / Sentry / Jira 連携、Playwright によるブラウザ連続操作 | `git` や `gh` など優秀なローカル CLI がすでにあるとき | 新 |
| ③ | **業務ワークフロー・ファサード** | 細かい API を並べず、**1つの業務目的＝1ツール**に束ねる | 複数の API 呼び出しや計算をミスなく1手で終わらせたい | 想定外の自由な組み合わせでデータを探索したいとき | 中〜新 |
| ④ | **サブエージェント×専用 MCP** | メインには持たせず、**専門の子にだけ**特定の MCP を許可する | 大量出力の隔離、外部 Web 読取と社内 DB 権限の分離（セキュリティ） | 1回だけ軽く呼べば終わる小さな作業 | 新 |
| ⑤ | **遅延読込・Code Mode** | 最初はツール定義を読まず、**検索して読む＋コードで一括実行** | 接続ツールが数十〜数千個あり、定義だけでトークンが溢れるとき | ツールが3〜5個しかない小さな構成 | 中〜新 |

そして、5つのパターンの手前にある一番大事な原則は **「既存の CLI（コマンド）や Skills（手順書ファイル）で済むなら、そもそも MCP サーバーを作らない・増やさない」** です（次章）。

---

## 1. 大前提：「なんでも MCP にすれば良い」わけではない

### 1.1 2025年に起きた「MCP 入れすぎでトークンが枯渇する」問題

MCP が登場した当初、多くの開発者が GitHub、Slack、ブラウザ操作、データベース、社内 API など、あらゆるものを MCP サーバーとして登録しました。するとすぐに大きな壁にぶつかりました（[info/03](../info/03_armin-mario_mcp-vs-cli.md)、[info/04](../info/04_cloudflare_code-mode.md)、[info/05](../info/05_anthropic_code-execution-with-mcp.md)）。

| 報告元 | 何が起きたか | 日付 | 鮮度 |
|---|---|---|---|
| Armin Ronacher / Mario Zechner | 複数の MCP サーバーを繋ぐと、**まだ一言も質問していないのに数万トークン**がツール定義だけで消費され、既存の CLI を Bash で呼ぶより遅くて高くなる | 2025-07〜08 | 古 |
| Cloudflare | 自社の API（2,500以上のエンドポイント）をそのまま1対1で MCP ツールにすると、**ツール定義だけで 117万トークン**になりコンテキスト窓に入らない | 2025-09 | 古 |
| Anthropic | 多数の MCP サーバー接続と中間データの往復で **150,000 トークン**を消費するケースが発生。オンデマンド読み込みとコード実行への転換を提唱 | 2025-11 | 中 |

![登録ツール数とトークン消費・精度の関係](assets/mcp-vs-cli-sweet-spot.svg)

> **この図について**：曲線は、下の根拠をもとに筆者が描いた**概念図**です。
> - **15個前後までが快適**：OpenAI のエージェント設計ガイドなどでも、似た道具が 10〜15個を超えるとモデルの選択精度が落ちることが示されています（[agent-guide の info/03](../../agent-guide/info/03_openai_practical-guide-to-building-agents.md)）。
> - **50個を超えると一括読込は苦しい**：1ツールあたり平均 200〜400 トークンの説明文があると、50個で 1万〜2万トークンになります。Claude Code はツール定義がコンテキストの一定割合（約10%）を超えると、自動的に **Tool Search（緑の線：オンデマンド検索）** に切り替えて劣化を防ぎます（[info/07](../info/07_claude-code_mcp-docs.md)）。

### 1.2 先にチェック：「それは CLI か Skills でよくないか？」

MCP サーバーを新しく追加・自作する前に、次の3問を順番にチェックすると無駄な作り込みを防げます。

1. **AI がすでに知っている標準 CLI（`git`, `gh`, `curl`, `jq`, `npm` 等）でできないか？**
   AI はこれらのコマンドの使い方を事前学習で熟知しています。わざわざ数千トークンの説明書（MCP ツール定義）を毎回渡すより、Bash で直接コマンドを打たせる方が速くてトークンも使いません（[info/03](../info/03_armin-mario_mcp-vs-cli.md)）。
2. **「新しい道具」ではなく「社内の手順・作法」を教えたいだけではないか？**
   たとえば「リリースノートの書き方」や「決まったスクリプトの実行手順」なら、MCP サーバーではなく **Skills（`.claude/skills/名前/SKILL.md`）** に書くのが正解です。Skills なら普段は数十トークンの見出ししか読まれず、必要なときだけ本文が開かれます（[info/09](../info/09_anthropic_agent-skills-vs-mcp.md)）。
3. **それでも MCP にする価値があるのはどんなときか？**
   - 生データが巨大で、**条件に合う数件だけをサーバー側で絞り込んで返したい**とき（→ パターン①）
   - **OAuth 認証や秘密の API キー**を AI に見せずに外部 SaaS を操作したいとき、またはブラウザのように**開いた画面の状態を維持**したいとき（→ パターン②）
   - 複雑な複数ステップや計算を**1つの確実な業務ツール**として固定したいとき（→ パターン③）

---

## 2. パターン①：社内知識・DB の読み取り専用ゲートウェイ

![社内知識・DB の読み取り専用ゲートウェイ](assets/pattern1-knowledge-gateway.svg)

### 仕組み

- 社内のデータベース、巨大な商品カタログ、設計書・用語集の前に、**読み取り専用（Read-Only）の MCP サーバー**を置く。
- AI には生データ（数千行の JSON やテーブル全件）を直接読ませず、`search_glossary(query)` や `check_allergens(excludeAllergens)` のような**絞り込み用のツール**だけを呼ぶようにさせる。
- サーバー側で正確にフィルタリング・集計を行い、**該当した数件〜十数件の要約だけ**を AI に返す（見本：[samples/02-knowledge-search/](../samples/02-knowledge-search/) およびルートの `servers/cafe-catalog-mcp.js`）。

### なぜ効くのか

| 理由 | 根拠 |
|---|---|
| 生データを丸ごとコンテキストに読み込まないため、**入力トークンとノイズが劇的に減る** | Anthropic 2025-11（[info/05](../info/05_anthropic_code-execution-with-mcp.md)）中 |
| 数値の大小比較・アレルゲンの除外判定・税計算などをプログラム側で行うため、**AI の見落としや計算ミスが起きない** | 本リポジトリの実験テーマ（[README.md](../README.md)） |
| 接続アカウントを読み取り専用にし、生の SQL ではなく「型付きの検索パラメータ」だけを受け取ることで、**データ破壊や情報漏洩を防げる** | OWASP MCP Top 10（[info/10](../info/10_owasp-trailofbits_mcp-security.md)）新 |

### 失うもの・注意点

- **検索条件にない切り口では探せない**：あらかじめ用意した引数（カテゴリ、価格上限、除外アレルゲンなど）以外の曖昧な連想検索をするには、全文検索やベクトル検索をサーバー側に組み込む必要があります。
- **返却件数の上限（`limit`）を忘れると逆効果**：検索結果が 500件ヒットしたときに 500件すべてを JSON で返してしまうと、結局 AI のコンテキストが溢れます。「最大10件まで返し、超えた場合は『他490件あり、条件を絞ってください』と返す」設計が鉄則です。

---

## 3. パターン②：外部 SaaS・ブラウザ操作のブリッジ

![外部 SaaS・ブラウザ操作のブリッジ](assets/pattern2-saas-bridge.svg)

### 仕組み

- **リモート MCP サーバー（Streamable HTTP + OAuth 2.1** Notion、Sentry、Linear、Jira などのクラウドサービスが公式提供する MCP エンドポイントに繋ぎ、チケット検索やドキュメント取得を行う。
- **状態保持（ステートフル）ローカル MCP サーバー（stdio** Playwright（ブラウザ自動操作）のように、「ブラウザを起動し、ログイン画面を開いたまま、次のターンでボタンを押してスクリーンショットを撮る」という**ステップをまたいで状態を保つ操作**を常駐プロセスに任せる。

### なぜ効くのか

| 理由 | 根拠 |
|---|---|
| 1回の単発コマンド（Bash）では難しい****を、裏で動き続ける MCP サーバープロセスが自然に担える | MCP 公式仕様（[info/06](../info/06_mcp_spec-2025-2026.md)）新 |
| リモート MCP と OAuth 2.1 により、手元にツールをインストールしなくても URL 登録とブラウザログインだけで安全に連携できる | Claude Code Docs / MCP 2025-06〜11 仕様（[info/06](../info/06_mcp_spec-2025-2026.md)、[07](../info/07_claude-code_mcp-docs.md)）新 |

### 失うもの・注意点

- **外部テキスト経由の「間接プロンプトインジェクション** GitHub の公開 Issue、外部 Web ページ、受信メールなどを MCP で読み込むと、その本文の中に攻撃者が書いた「AI への偽の指示」が混ざっていることがあります（[info/02](../info/02_invariant_tool-poisoning-attacks.md)、[10](../info/10_owasp-trailofbits_mcp-security.md)）。外部データを拾う MCP を使うときは、削除や外部送信のツールを自動許可しないでください。
- **同時に複数のサブエージェントから1つの GUI / ブラウザ MCP を触ると衝突する**：開いている1つのブラウザ画面を3体のサブエージェントが同時にクリックすると操作が混ざります。状態を持つ MCP は1体ずつ順番に使うのが原則です（[agent-guide docs/00 の 8.5節](../../agent-guide/docs/00_subagent-guide.md#8-応用似た作業を並列にする場合cad3d-の部品を組み立てる)参照）。

---

## 4. パターン③：複数ツールを1つの「業務ワークフロー」に束ねる（ファサード型）

![業務ワークフロー・ファサード型](assets/pattern3-workflow-facade.svg)

### 仕組み

- 既存の REST API や社内関数の1つ1つをそのまま MCP ツールにする（1 API ＝ 1 ツール）のをやめ **AI が達成したい1つの業務目的」の単位にまとめた窓口（ファサード：建物の正面玄関** して公開する。
- たとえば、当ワークスペースの実験用サーバー `servers/cafe-catalog-mcp.js` にある `calculate_set_price` ツールは、「①メニュー ID から各商品を検索 → ②季節限定ルールの確認 → ③フード＋ドリンクのセット割引（150円引き）の適用判定 → ④イートイン10%／テイクアウト8%の税込計算と原価率の算出」を**サーバー内のコードで一気に行い、1回のツール呼び出しで確定結果を返しま **見本：[samples/03-workflow-facade/](../samples/03-workflow-facade/)）。

### なぜ効くのか

| 理由 | 根拠 |
|---|---|
| 細かいツールを10個並べるより、目的別のツール2〜3個に絞る方が**ツールの選び間違いが減り、トークンも節約できる** | OpenAI（[agent-guide info/03](../../agent-guide/info/03_openai_practical-guide-to-building-agents.md)）、Vercel 事例（ツール80%削減で改善） |
| 途中の生データ（全商品の明細など）を AI のコンテキストに往復させず、サーバー内部で処理して最終結果だけを返せる | Anthropic 2025-11（[info/05](../info/05_anthropic_code-execution-with-mcp.md)）中 |
| 割引条件や端数処理などの「絶対に間違えてはいけない業務ルール」を AI の暗算ではなくプログラムで100%保証できる | 筆者の整理（実験環境で検証可能） |

### 失うもの・注意点

- **OpenAPI（Swagger）からの機械的な自動生成はアンチパターンになりやすい**：既存の Web API 定義から100個のエンドポイントをそのまま100個の MCP ツールに自動変換するツールがありますが、それをそのまま繋ぐと AI が迷い、往復回数も激増します。「基本の検索ツール 1〜2個 ＋ よく使う業務ファサード 1〜3個」の合計 3〜5個程度に手で絞るのが最も高い精度を出せます。

---

## 5. パターン④：サブエージェント×専用 MCP（権限と文脈の隔離）

![サブエージェント×専用 MCP](assets/pattern4-subagent-scoped-mcp.svg)

### 仕組み

- 親（メインエージェント）には汎用的なファイル読み書きだけを持たせ、重たい MCP サーバーや権限の強い MCP サーバーは**専門のサブエージェント（`.claude/agents/*.md` や `.github/agents/*.agent.md`）にだけ割り当て **見本：[samples/04-subagent-scoped/](../samples/04-subagent-scoped/)）。
- 子は専用 MCP を使って調査・検証を行い、整理した結論だけを親に返す。

### なぜ効くのか

| 理由 | 根拠 |
|---|---|
| **セキュリティの「致命的な3要素（Lethal Trifecta）」を分断できる**：①外部の信頼できないデータを読む（Web / Issue）、②社内の秘密データに触る（DB）、③外部へ送信・変更する、の3つを1つのエージェントに同居させず、別々のサブエージェントに隔離できる | OWASP MCP Top 10（[info/10](../info/10_owasp-trailofbits_mcp-security.md)）新、Invariant Labs（[info/02](../info/02_invariant_tool-poisoning-attacks.md)）古 |
| ブラウザの DOM ツリーや大量の検索結果など、MCP が出す大きな中間出力をサブエージェントの部屋の中に閉じ込め、メインの文脈を綺麗に保てる | Claude Code Docs（[info/07](../info/07_claude-code_mcp-docs.md)）新 |

### 失うもの・注意点

- **サブエージェントの起動コスト**：子を立ち上げるぶん数秒〜十数秒の待ち時間と初期トークンがかかります。1回だけ小さなツールを呼べば済むなら、メインで直接呼ぶ方が速いです。

---

## 6. パターン⑤：コード実行・オンデマンド読み込み（Tool Search / Code Mode）

![コード実行・オンデマンド読み込み](assets/pattern5-lazy-codemode.svg)

### 仕組み

多数の MCP サーバーや大規模な API を扱うための、2025年秋〜2026年に確立された最新パターンです。次の2段構えで動きます。

1. **オンデマンド読み込み（Tool Search / Lazy Loading** 
   セッション開始時にはツールの名前や説明文をコンテキストに読み込まず、`MCPSearch`（または `search_tools`）という検索用ツール1個だけを渡しておく。AI は作業中に「今必要なツール」をキーワード検索し、ヒットした1〜2個のツール定義だけをその場で読み込む（Claude Code ではツール定義が多いと自動でこのモードになる：[info/07](../info/07_claude-code_mcp-docs.md)）。
2. **コード実行（Code Mode / Code Execution with MCP** 
   細かいツールを1回ずつ AI から呼ぶのではなく、MCP のツール群を「TypeScript や Python の SDK（関数ライブラリ）」として見せ、AI に**ループや絞り込みを含む短いスクリプトを書かせてサンドボックス内で一括実行**させる（[Cloudflare, 2025](https://blog.cloudflare.com/code-mode/)、[Anthropic, 2025](https://www.anthropic.com/engineering/code-execution-with-mcp)）。

### なぜ効くのか

| 理由 | 数字 | 根拠 |
|---|---|---|
| 初期のツール定義トークンを劇的に圧縮できる | **117万トークン → 約1,000トークン（99.9%削減）** | Cloudflare 2025-09（[info/04](../info/04_cloudflare_code-mode.md)）古 |
| 中間データの往復もコード内で完結し、文脈に戻らない | **150,000トークン → 2,000トークン（98.7%削減）** | Anthropic 2025-11（[info/05](../info/05_anthropic_code-execution-with-mcp.md)）中 |
| LLM は「ツール呼び出し用の特殊 JSON」を何十回も連発するより、**普通のプログラムコード（ループ・条件分岐）を書く方がはるかに得意** | — | Armin Ronacher（[info/03](../info/03_armin-mario_mcp-vs-cli.md)）、Cloudflare（[info/04](../info/04_cloudflare_code-mode.md)） |

### 失うもの・注意点

- **ツールが数個なら不要**：登録ツールが合計 5〜10個程度なら、最初から読み込んでも 1,000〜2,000 トークン程度なので、検索の1ターンを挟むよりそのまま使う方が速いです。
- **サンドボックスの安全性が生命線**：Code Mode（AI が書いたコードをその場で実行する方式）を採用する場合、悪意あるプロンプトによって危険なコードが書かれてもホスト PC のファイルや別テナントの情報に触れられないよう、厳格に隔離された実行環境（V8 Isolate やコンテナなど）で動かす必要があります（[info/10](../info/10_owasp-trailofbits_mcp-security.md)）。

---

## 7. AI の進化で変わる「MCP・CLI・スキル」の境界線

2024年11月の MCP 誕生から約2年が経ち、現場での使い分けは次のように整理されてきました（筆者の整理。根拠は [info/03](../info/03_armin-mario_mcp-vs-cli.md)〜[info/09](../info/09_anthropic_agent-skills-vs-mcp.md)）。

### 7.1 「昔（2025年前半）のやり方」と「今（2026年後半）のやり方」

| 昔（2025年前半ごろ）よくあったやり方 | 今（2026年11月時点）の推奨 | 変わった理由 |
|---|---|---|
| なんでも MCP サーバーにして常時10個以上つなぐ | **普段繋ぐのは厳選した数個**。多いときは Tool Search（自動）やサブエージェント分離（パターン④）に任せる | ツール定義の肥大化でコストと精度が悪化することが広く知られるようになったため |
| 社内の定型手順やテンプレートも MCP の Prompts / Tools としてプログラムで書く | 手順・作法・ローカルスクリプトは **Skills（`SKILL.md`）** に書く | コードを書かずに Markdown で保守でき、段階的開示でトークンも食わないため（[info/09](../info/09_anthropic_agent-skills-vs-mcp.md)） |
| GitHub や AWS の操作にも必ず MCP サーバーを入れる | ローカルで `gh` や `aws` CLI が使えるなら **Bash で既存 CLI を直接呼ぶ** | モデルがすでに CLI のオプションを熟知しており、追加のツール定義トークンがゼロで済むため（[info/03](../info/03_armin-mario_mcp-vs-cli.md)） |
| REST API の全エンドポイントを1対1で MCP ツールに自動変換する | **少数の検索＋業務ファサード（パターン③** 絞るか、**Code Mode（パターン⑤** する | 粒度が細かすぎるツール群は AI の選択ミスと往復増を招くため |

### 7.2 それでも「ここは絶対に MCP が強い」と残った4つの領域

逆に、どれだけモデルが賢くなり CLI や Skills が便利になっても、**MCP でなければならない領域**は次の4つとして明確に残っています。

1. **生データを全部渡さず、サーバー側で安全に絞り込み・集計・計算して返す窓口（パターン①・③）**
2. **秘密の認証情報（API キー・DB パスワード・OAuth トークン）を AI のプロンプトやシェルから隔離する境界（パターン①・②）**
3. **ブラウザ操作のように、複数ターンにわたって「開いた状態」を維持する常駐ブリッジ（パターン②）**
4. **Claude Code・VS Code（Copilot）・Claude Desktop など、異なる AI ツール間で1つの実装をそのまま共有したいとき**

---

## 8. まとめ

| 問い | 答え |
|---|---|
| 最初に確認することは？ | **既存の CLI（Bash）や Skills（手順書）で済まないか？** 済むなら MCP は作らない |
| 社内データやカタログを引かせたいときは？ | **① 読み取り専用ゲートウェイ**。生データを丸読みさせず、サーバー側で絞り込んで数件だけ返す |
| 外部クラウドやブラウザを操作したいときは？ | **② 外部 SaaS・状態ブリッジ**。OAuth 2.1 の公式リモート MCP や常駐プロセスを活用する |
| ツールを作る粒度のコツは？ | **③ 業務ファサード**。API 1個＝1ツールにせず、割引計算や複数ステップを1つの業務ツールに束ねる |
| 権限や大量出力を隔離したいときは？ | **④ サブエージェント×専用 MCP**。専門の子にだけ MCP を許可し、メインの文脈と安全を守る |
| ツールが何十個・何百個もあるときは？ | **⑤ オンデマンド検索（Tool Search）と Code Mode** で、必要な定義だけを読み込みコードで処理する |

---

## 9. 参考文献

鮮度は 2026-11-10 基準です。詳しいメモ（要点・原文引用・注意点）は [info/](../info/README.md) にあります。

| # | 出典 | 公開・取得日 | 鮮度 |
|---|---|---|---|
| 1 | Anthropic, [Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol)（[info/01](../info/01_anthropic_introducing-mcp.md)） | 2024-11-25 | 古 |
| 2 | Invariant Labs, [MCP Security Notification: Tool Poisoning Attacks](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks)（[info/02](../info/02_invariant_tool-poisoning-attacks.md)） | 2025-04-01 | 古 |
| 3 | Armin Ronacher / Mario Zechner, [Tools: Code Is All You Need](https://lucumr.pocoo.org/2025/7/3/tools/) / [What if you don't need MCP at all?](https://mariozechner.at/posts/2025-08-15-what-if-you-dont-need-mcp/)（[info/03](../info/03_armin-mario_mcp-vs-cli.md)） | 2025-07〜08 | 古 |
| 4 | Cloudflare, [Code Mode: the better way to use MCP](https://blog.cloudflare.com/code-mode/)（[info/04](../info/04_cloudflare_code-mode.md)） | 2025-09-26 | 古 |
| 5 | Anthropic, [Code execution with MCP: Building more efficient agents](https://www.anthropic.com/engineering/code-execution-with-mcp)（[info/05](../info/05_anthropic_code-execution-with-mcp.md)） | 2025-11-04 | 中 |
| 6 | Model Context Protocol, [Official Specification](https://modelcontextprotocol.io/specification/)（[info/06](../info/06_mcp_spec-2025-2026.md)） | 2026-11-10 取得 | 新 |
| 7 | Claude Code Docs, [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp)（[info/07](../info/07_claude-code_mcp-docs.md)） | 2026-11-10 取得 | 新 |
| 8 | VS Code / GitHub Docs, [Use MCP servers in VS Code](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)（[info/08](../info/08_vscode-copilot_mcp-docs.md)） | 2026-11-10 取得 | 新 |
| 9 | Anthropic, [Equipping agents for the real world with Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)（[info/09](../info/09_anthropic_agent-skills-vs-mcp.md)） | 2025-10〜2026-11 | 中〜新 |
| 10 | OWASP GenAI Security Project, [OWASP MCP Top 10](https://genai.owasp.org/)（[info/10](../info/10_owasp-trailofbits_mcp-security.md)） | 2025-10〜2026-06 | 新 |
