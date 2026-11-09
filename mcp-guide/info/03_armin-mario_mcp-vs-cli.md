# Armin Ronacher / Mario Zechner「MCP vs CLI・コード実行」議論

| 項目 | 内容 |
|---|---|
| 発行元 | Armin Ronacher（Flask 作者）/ Mario Zechner（libGDX・Pi 作者）の個人技術ブログ |
| 公開日 | 2025-07-03（Armin Ronacher「Tools: Code Is All You Need」）／ 2025-08（Mario Zechner「What if you don't need MCP at all?」） |
| 鮮度 | **古**（約15〜16か月前）。「なんでも MCP にすべきか？」という設計議論の代表例 |
| URL | https://lucumr.pocoo.org/2025/7/3/tools/ ／ https://mariozechner.at/posts/2025-08-15-what-if-you-dont-need-mcp/ |

## 要点

- **問題提起**：GitHub・ブラウザ操作・ローカル検索などを MCP サーバーとしてたくさん登録すると、起動した瞬間に**数万トークンものツール定義（JSON スキーマと説明文）**がコンテキストを埋め尽くし、コスト増・速度低下・判断の迷いを引き起こす。
- **CLI とコード実行の強み**：
  - 現代の LLM は `git`、`gh`（GitHub CLI）、`curl`、`jq`、Python スクリプトの書き方を**事前学習ですでに熟知**している。わざわざ大きな説明文をプロンプトに入れなくても使える。
  - **合成可能性（Composability）**：MCP ツールは 1 回呼ぶごとに結果を AI のコンテキストに戻す必要があるが、Bash や Python スクリプトなら「100件取得してループで絞り込み、集計結果の3行だけを表示する」という処理を 1 手で書ける。
- **Mario Zechner の比較実験**：Playwright MCP サーバー（数十個のツール定義で数千〜数万トークンを常時消費）の代わりに、数行の簡単な CLI スクリプトと短い説明（数百トークン）を AI に渡したところ、はるかに少ないトークンで柔軟にブラウザ操作ができた。

## 原文引用（短く）

> Armin Ronacher: "Code is composable, MCP tools are not. When the LLM writes code, it can combine multiple operations, filter data, and loop without round-tripping through the model context."

> Mario Zechner: "MCP servers dump all their tool definitions into your context window upfront, whether you use them or not."

## 注意点

- この批判は **2025年夏時点の「全ツールを最初に一括読み込みする MCP」** に対して非常に的確だった。その後、Cloudflare（[04](04_cloudflare_code-mode.md)）や Anthropic（[05](05_anthropic_code-execution-with-mcp.md)、[07](07_claude-code_mcp-docs.md)）がこの批判を取り入れ、**MCP Tool Search（遅延読み込み）**や **Code Mode（MCP 経由のコード実行）**を実装したことで、トークン消費の問題は大きく緩和されている。
- ただし「すでに優秀な公式 CLI（`gh` や `aws` など）があり、ローカルで Bash が使えるなら、無理に MCP サーバーを入れなくてよい」という判断基準は **2026年11月現在もそのまま有効**。
