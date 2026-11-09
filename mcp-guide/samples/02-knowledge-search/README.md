# 02 社内用語集・設計書の読み取り専用ゲートウェイ

ガイドの [02 の 2章（パターン①：知識・DB の読み取り専用ゲートウェイ）](../../docs/02_mcp-patterns.md#2-パターン①社内知識db-の読み取り専用ゲートウェイ) に対応する見本です。

- 社内特有の略語や設計ルールが詰まった `glossary.json` を、AI に丸ごと読ませるのではなく、**キーワードやカテゴリで絞り込んで該当する数件だけ**を返します。
- 書き込み・削除のツールは最初から存在しないため、AI が誤って用語集を書き換えてしまう心配がありません。
- 返却件数に上限（`limit`、既定5件）を設けており、巨大なデータでもコンテキストを圧迫しない作りになっています。

## ファイル

- [glossary.json](glossary.json)：架空の社内システム用語集データ
- [glossary-mcp.js](glossary-mcp.js)：読み取り専用の検索 MCP サーバー
- [claude-code/.mcp.json](claude-code/.mcp.json)：Claude Code 用設定
- [copilot/.vscode/mcp.json](copilot/.vscode/mcp.json)：VS Code（Copilot）用設定

## すぐ試す

```powershell
cd C:\git_home\agent-study\mcp-guide
node scripts\test-mcp-server.js samples\02-knowledge-search\glossary-mcp.js
```
