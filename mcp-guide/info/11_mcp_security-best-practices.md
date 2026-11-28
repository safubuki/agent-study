# Model Context Protocol 公式仕様「Security Best Practices」

| 項目 | 内容 |
|---|---|
| 発行元 | Model Context Protocol プロジェクト（公式仕様サイト） |
| 対象版 | 2025-11-25 版 |
| 取得日 | 2026-11-28 |
| 鮮度 | **新**（現行の公式仕様） |
| URL | https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices |

## 要点

- MCP の実装で起きやすい攻撃と、その対策を仕様として整理したページ。主な項目は次のとおり。
  - **Confused Deputy（なりすまされた代理人）**：第三者 API への中継をする MCP サーバーで、利用者の同意を飛ばして認可コードを奪われる問題。中継側で「どのクライアントに同意したか」を管理することが必須。
  - **Token Passthrough（トークンの流用）**：MCP サーバー宛てに発行されていないトークンを受け取り、そのまま先の API に流す使い方。仕様で**禁止**されている。
  - **SSRF（サーバー側のリクエスト偽造）**：悪意あるサーバーが、認可の手続きの中で社内のアドレスやクラウドのメタデータの URL を読ませる問題。HTTPS の強制、プライベート IP の遮断などで防ぐ。
  - **Session Hijacking（セッションの乗っ取り）**：セッション ID を推測・入手されてなりすまされる問題。セッション ID を認証に使ってはいけない。
  - **Local MCP Server Compromise（ローカル MCP サーバーの乗っ取り）**：ローカルのサーバーは利用者の PC で、利用者と同じ権限で動く。起動コマンドに悪い処理を混ぜる、サーバー自体に悪い中身を入れる、などの手口がある。
  - **Scope Minimization（権限の最小化）**：最初から広い権限のトークンを出すと、漏れたときの被害が大きい。最小の権限から始め、必要なときだけ広げる。
- ローカルのサーバーをワンクリックで設定できるクライアントは、**実行するコマンドを省略せずに表示し、明示的な同意を得なければならない**。サンドボックスで最小限の権限で動かすこと、危険なパターン（`sudo`・`rm -rf`・ネットワーク操作など）を強調表示することも推奨されている。
- ローカルで動かすサーバーは、stdio を使うか、HTTP なら認証トークンを必須にするなどして、ほかのプロセスから勝手に使われないようにする。

## 原文引用（短く）

> "MCP servers MUST NOT accept any tokens that were not explicitly issued for the MCP server."

> "Show the exact command that will be executed, without truncation (include arguments and parameters)"

## 注意点

- 多くの項目は「MCP サーバーやクライアントを**作る側**」向けの内容。使う側は、[docs/03](../docs/03_mcp-security-and-rules.md) の「入れる前の点検」と「4 層の守り」で同じリスクに備える。
