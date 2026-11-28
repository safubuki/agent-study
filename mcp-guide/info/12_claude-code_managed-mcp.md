# Claude Code 公式ドキュメント「Control MCP server access for your organization」

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic（code.claude.com 公式ドキュメント。随時更新） |
| 取得日 | 2026-11-28 |
| 鮮度 | **新**（取得当日の内容） |
| URL | https://code.claude.com/docs/en/managed-mcp |

## 要点

- 既定では、Claude Code の利用者は好きな MCP サーバーをつなげる。管理者は、組織で使えるサーバーを制限したり、全員に配ったりできる。
- **方法は大きく 3 つ**：
  | 方法 | できること |
  |---|---|
  | `managed-mcp.json` | 会社が決めたサーバーだけを読み込ませる（**排他的な管理**）。利用者は追加も変更もできない。空にすると MCP をほぼ使えなくできる |
  | `managedMcpServers`（管理設定） | 会社のリモートサーバー（HTTP・SSE、`https://` のみ）を全員に配る。利用者は自分のサーバーも使える |
  | `allowedMcpServers` ／ `deniedMcpServers`（管理設定） | 許可リストと拒否リストで、読み込めるサーバーを絞る |
- `managed-mcp.json` の置き場所：macOS は `/Library/Application Support/ClaudeCode/`、Linux・WSL は `/etc/claude-code/`、Windows は `C:\Program Files\ClaudeCode\`。管理者権限で配る（MDM・グループポリシー・Intune など）。
- 許可リスト・拒否リストの書き方：
  - リモートは `serverUrl`（`*` のワイルドカード可）、ローカルは `serverCommand`（コマンドと引数の完全一致）。
  - `serverName`（名前）は利用者が自由に付けられるので、**セキュリティの対策にはならない**と明記されている。
  - **拒否リストは常に優先**される。`allowManagedMcpServersOnly: true` で、利用者が自分の設定で許可リストを広げられないようにできる。
- OpenTelemetry の出力を設定すると、どの MCP サーバー・ツールが使われたかを記録・集計できる。

## 原文引用（短く）

> "By default, anyone running Claude Code can connect any MCP server they choose."

> "A `serverName` entry, in either list, is not a security control."

## 注意点

- 細かい挙動（どのバージョンから使えるか、クラウドのセッションでの扱いなど）は更新が多い。導入するときは最新のドキュメントで確認する。
