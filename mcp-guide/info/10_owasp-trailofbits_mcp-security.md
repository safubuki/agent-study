# OWASP MCP Top 10 / 実践セキュリティ対策整理

| 項目 | 内容 |
|---|---|
| 発行元 | OWASP GenAI Security Project（MCP Top 10）およびセキュリティ各社（Check Point Research / Trail of Bits 等）の報告整理 |
| 公開時期 | 2025-10〜2026-06 |
| 鮮度 | **新**（直近1年の実践的な脅威と対策のまとめ） |
| URL | https://genai.owasp.org/ （OWASP MCP セキュリティガイドライン） |

## 要点

- **MCP 特有の代表的なリスク（上位項目）**：
  1. **Tool Poisoning / Indirect Prompt Injection（ツール汚染・間接プロンプトインジェクション）**：ツールの説明文や、MCP サーバーが外部（Web・Issue・メール・DB）から取得したテキストの中に悪意ある指示が混ざり、AI が騙されて別のツールを悪用する（[02](02_invariant_tool-poisoning-attacks.md)）。
  2. **Excessive Permissions / Confused Deputy（過剰な権限）**：読み取りだけで十分な場面で `DROP TABLE` や書き込み・削除ができるデータベース接続を MCP サーバーに渡してしまう。
  3. **Supply Chain & Rug Pull（サプライチェーンと事後改ざん）**：`npx -y @unknown/mcp-server@latest` のようにバージョンを固定せず実行し、後から悪意ある更新が混入する。
  4. **Credential Exposure（認証情報の漏洩）**：`.mcp.json` に生の API キーやトークンを直接書いて Git リポジトリにコミットしてしまう。
  5. **Code Execution Sandbox Escape（サンドボックス脱出）**：Code Mode 等で AI が生成したコードを実行する際、隔離が不十分でホスト側のファイルや環境変数にアクセスされる。
- **現場で守るべき5つの対策**：
  - **読み取り専用・最小権限**：DB や社内データ用の MCP サーバーは、接続アカウント自体を Read-Only（読み取り専用）にし、SQL をそのまま受け取らず「検索キーワードや型付きパラメータ」だけを受け取る設計にする。
  - **サブエージェントによる権限隔離（「致命的な3要素」を揃えない）**：「①外部の信頼できないデータを読む」「②秘密情報にアクセスできる」「③外部へ送信・書き込みできる」の3つを1つのエージェントに同時に持たせない。
  - **環境変数・入力変数の利用**：`.mcp.json` には `${API_KEY}`、`.vscode/mcp.json` には `${input:api-key}` を使い、実体はファイルに書かない。
  - **バージョン固定とコード確認**：外部の MCP サーバーを使うときは `@latest` を避けてバージョンを固定し、公式または中身を確認できるものだけを使う。
  - **破壊的操作の人間確認（Human-in-the-loop）**：削除・外部送信・決済などのツールは、自動許可（`acceptEdits` 等）から外して毎回人間が確認する。

## 原文引用（短く）

> "Never combine untrusted external data ingestion, access to private data, and external communication tools in the same unguarded agent context."

## 注意点

- MCP は「安全にする魔法」ではなく「接続の規格」にすぎない。安全かどうかは**サーバー側がどれだけ権限を絞っているか**と、**ホスト側でどのツールを同居させるか**の設計で決まる。
