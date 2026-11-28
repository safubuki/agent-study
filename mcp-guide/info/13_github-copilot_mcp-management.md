# GitHub Docs「MCP management」（Copilot の組織向け MCP 管理）

| 項目 | 内容 |
|---|---|
| 発行元 | GitHub（docs.github.com 公式ドキュメント。随時更新） |
| 取得日 | 2026-11-28 |
| 鮮度 | **新**（取得当日の内容） |
| URL | https://docs.github.com/en/copilot/concepts/mcp-management |

## 要点

- 組織・企業のポリシー「**MCP servers in Copilot**」で、Copilot のクライアント全体で MCP サーバーを動かせるかどうかを決める。公式は、ポリシーは有効にしたうえで、必要なら承認済みのリストに絞ることをすすめている。
- 使ってよいサーバーを絞る方法：
  - **管理設定ファイル（`managed-settings.json`）による許可リスト**：企業全体に適用できる。対応するクライアントは今後広げる予定。
  - **社内のレジストリ（登録簿）**：企業全体または組織ごとに設定できる（パブリックプレビュー）。ただし「設定ファイルを書き換えると利用者がすり抜けられる」と書かれており、強制力は弱い。
- 「Restrict MCP access to registry servers」を「Registry only」にしたり、許可リストにコネクターの URL がなかったりすると、Copilot のコネクターも止まる。

## 原文引用（短く）

> "defines whether MCP servers can run at all across Copilot clients"

> "Users can bypass the restriction by editing configuration files."（レジストリ方式について）

## 注意点

- 対応するクライアントや細かい設定項目は更新が多い。組織で導入するときは、リンク先の「supported surfaces for policies」などで最新の対応状況を確認する。
