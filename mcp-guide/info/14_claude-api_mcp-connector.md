# Claude API 公式ドキュメント「MCP connector」

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic（platform.claude.com 公式ドキュメント） |
| 取得日 | 2026-11-28 |
| 鮮度 | **新**（取得当日の内容。機能はベータ） |
| URL | https://platform.claude.com/docs/en/agents-and-tools/mcp-connector |

## 要点

- Claude の Messages API から、**別の MCP クライアントを用意せずに、リモートの MCP サーバーへ直接つなげる**機能（ベータ）。
- リクエストに `mcp_servers`（サーバーの URL・名前・必要ならトークン）と、対応する `mcp_toolset` を書く。API 側（Anthropic のサーバー）が MCP サーバーを呼びに行く。
- 制限：
  - サーバーは **HTTP でインターネットに公開されている必要がある**（Streamable HTTP と SSE に対応）。**ローカルの stdio サーバーには直接つなげない**。
  - OAuth が必要なサーバーは、利用者側でアクセストークンを取得して `authorization_token` に渡す（更新も利用者側）。
  - データの保持はゼロ保持（ZDR）の対象外。
- Managed Agents では、エージェントの定義に MCP サーバーを書き、資格情報は保管庫（vault）から渡す。

## 原文引用（短く）

> "connect to remote MCP servers directly from the Messages API without a separate MCP client"

> "Local STDIO servers cannot be connected directly."

## 注意点

- 「LLM の提供元のサーバーが MCP サーバーを呼ぶ」形なので、社内ネットワークだけで動くサーバーには届かない。自作アプリから社内やローカルのサーバーを使うなら、アプリ側を MCP クライアント（ホスト役）にする（[docs/00 の 2.4 節](../docs/00_mcp-guide.md)の C）。
