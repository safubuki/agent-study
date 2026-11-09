# Anthropic「Introducing the Model Context Protocol」

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic（公式ニュース・発表記事） |
| 公開日 | 2024-11-25 |
| 鮮度 | ** **約2年前）。MCP の理念と基本構造（Host / Client / Server）の原典 |
| URL | https://www.anthropic.com/news/model-context-protocol |

## 要点

- **解決したい課題（N×M 問題** どんなに賢い AI モデルでも、社内のデータベース・GitHub・Slack・ローカルファイルから隔離されていては力を発揮できない。従来は「AI アプリ（N 個）× 外部データソース（M 個）」ごとに独自の連携コードを書く必要があった。
- **共通規格としての MCP**：AI アプリとデータソースの間をつなぐオープン標準プロトコルとして **Model Context Protocol（MCP）** を公開。よく「AI 向けの USB-C ポート」に例えられる。
- **基本の登場人物**：
  - **MCP Host（ホスト** Claude Desktop や IDE（開発環境）など、AI が動く本体アプリ。
  - **MCP Client（クライアント** ホストの内部にあり、サーバーと 1 対 1 で通信する接続係。
  - **MCP Server（サーバー** 外部の API・データベース・ローカルファイルなどを、MCP の決まりに従って AI に提供する小さなプログラム。
- **初期の提供物**：仕様、Python / TypeScript SDK、および Google Drive・Slack・GitHub・Postgres・Puppeteer などのリファレンス実装サーバーをオープンソースで公開。

## 原文引用（短く）

> "The Model Context Protocol is an open standard that enables developers to build secure, two-way connections between their data sources and AI-powered tools."

> "Instead of maintaining separate connectors for each data source, developers can now build against a standard protocol."

## 注意点

- 発表当初（2024年11月）のリモート通信は HTTP + SSE（Server-Sent Events：サーバーから一方向にデータを流し続ける仕組み）を前提としていたが、後に **Streamable HTTP** へ置き換えられた（[06](06_mcp_spec-2025-2026.md) 参照）。
- 当初は「つなげばつなぐほど便利」というトーンで紹介されたが、2025年以降に「サーバーを増やしすぎるとツール定義だけでトークンを大量消費する」という運用上の課題が表面化した（[03](03_armin-mario_mcp-vs-cli.md)、[05](05_anthropic_code-execution-with-mcp.md) 参照）。
