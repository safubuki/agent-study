# 05 Tools だけでなく Resources と Prompts も返す MCP サーバー

ガイドの [00 の 3.1節（Host・Client・Server の全体構造と3つの機能）](../../docs/00_mcp-guide.md#31-hostclientserver-の全体構造と3つの機能) に対応する見本です。

MCP の仕様が持つ3つの基本機能すべてを1ファイルに実装しています。

| 機能 | 実装しているメソッド | 内容 |
|---|---|---|
| **Tools（道具）** | `tools/list`, `tools/call` | `convert_temperature`（摂氏・華氏の温度換算ツール） |
| **Resources（参考資料）** | `resources/list`, `resources/read` | `cafe://manual/brewing-guide`（ハンドドリップ抽出基準書） |
| **Prompts（定型文）** | `prompts/list`, `prompts/get` | `seasonal-menu-review`（新作メニューの原価・アレルゲン点検用プロンプト） |

## すぐ試す

```powershell
cd C:\git_home\agent-study\mcp-guide
node scripts\test-mcp-server.js samples\05-resources-and-prompts\full-feature-mcp.js
```
