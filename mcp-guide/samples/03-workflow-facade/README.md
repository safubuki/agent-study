# 03 複数ツールを1つの「業務ワークフロー」に束ねる（ファサード型）

ガイドの [02 の 4章（パターン③：業務ワークフロー・ファサード）](../../docs/02_mcp-patterns.md#4-パターン③複数処理を1つの業務ワークフローに束ねるファサード型) に対応する見本です。

## なぜ束ねるのか

もし「イベント出店見積もり」のために、次の4つの細かい関数をそのまま別々の MCP ツールとして公開すると、AI は4回ツールを呼ぶ必要があり、途中で引数を間違えたりトークンを余計に消費したりします。

1. `get_venue_fee`（会場費を引く）
2. `calc_staff_cost`（必要スタッフ数と人件費を計算する）
3. `calc_ingredient_cost`（原価を計算する）
4. `check_profit_margin`（粗利率基準を満たすか判定する）

このサンプルでは、これら4つのステップをサーバー内部のコードで1つに束ね、AI には **`evaluate_catering_plan`（ケータリング出店計画の一括試算・判定）という1つのツールだけ**を公開しています。

## ファイル

- [catering-plan-mcp.js](catering-plan-mcp.js)：ファサード型 MCP サーバー本体
- [claude-code/.mcp.json](claude-code/.mcp.json)：Claude Code 用設定
- [copilot/.vscode/mcp.json](copilot/.vscode/mcp.json)：VS Code（Copilot）用設定

## すぐ試す

```powershell
cd C:\git_home\agent-study\mcp-guide
node scripts\test-mcp-server.js samples\03-workflow-facade\catering-plan-mcp.js
```
