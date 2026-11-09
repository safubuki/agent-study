# Anthropic「Code execution with MCP: Building more efficient agents」

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic Engineering（公式ブログ） |
| 公開日 | 2025-11-04 |
| 鮮度 | ** **約12か月前）。MCP 開発元自身が「ツール定義の肥大化」への処方箋を示した記事 |
| URL | https://www.anthropic.com/engineering/code-execution-with-mcp |

## 要点

- **MCP の規模拡大で起きた2つの非効率**：
  1. **ツール定義のトークン消費**：何十個もの MCP サーバーを繋ぐと、質問する前にツール定義だけで数万〜十数万トークンを消費する。
  2. **中間データの往復コスト**：たとえば「Google Drive から長い議事録を取得して Salesforce に貼る」とき、従来のツール呼び出しでは長い議事録の全文がいったん AI のコンテキストに入り、次のツール呼び出しでまた AI が全文を書き出すため、トークンと時間が2倍かかる。
- **解決策：MCP サーバーを「コードから呼べるライブラリ」として扱う**：
  - ツールの定義を仮想的なファイルツリー（例：`servers/google-drive/getDocument.ts`）として配置する。
  - エージェントは最初に全ツールを読み込まず、ディレクトリを見たり `search_tools` で必要な定義だけを探して読む（**オンデマンド読み込み**）。
  - データの加工・ループ・別ツールへの受け渡しはコード内で完結させ、最終結果の数行だけをコンテキストに返す。
- **効果**：150,000 トークンかかっていたツール定義と中間データのやり取りが、2,000 トークン（**98.7% 削減**）に減った事例を紹介。
- **プライバシー面の副次効果**：個人情報（PII）を含む大量データをモデル自身のコンテキストに入れず、コード実行環境の中でマスキングしたり直接別システムへ渡したりできる。

## 原文引用（短く）

> "As agents connect to more MCP servers, loading all tool definitions upfront and passing intermediate results through the context window becomes a major bottleneck."

> "By presenting MCP servers as code APIs and loading tool definitions on demand, agents can reduce token usage by up to 98.7%."

## 注意点

- この記事の考え方のうち「必要なツール定義だけをオンデマンドで検索して読み込む」部分は、その後 Claude Code 本体にも **MCP Tool Search** として標準搭載された（[07](07_claude-code_mcp-docs.md) 参照）。
