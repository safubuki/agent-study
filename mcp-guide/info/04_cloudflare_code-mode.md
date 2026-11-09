# Cloudflare「Code Mode: the better way to use MCP」

| 項目 | 内容 |
|---|---|
| 発行元 | Cloudflare Blog（公式エンジニアリングブログ） |
| 著者 | Kenton Varda, Sunil Pai ほか |
| 公開日 | 2025-09-26 |
| 鮮度 | ** **約13か月前）。大量ツール時代の MCP 設計を変えた転換点の記事 |
| URL | https://blog.cloudflare.com/code-mode/ |

## 要点

- **従来型 MCP の限界**：LLM に「ツール呼び出し用の特別な JSON」を1つずつ出力させるやり方は、API のエンドポイントが数百〜数千個になると破綻する。Cloudflare API 全体をそのまま MCP ツールにすると、**2,500以上のエンドポイントでツール定義だけで約 117万トークン**になり、コンテキスト窓にすら入らない。
- **なぜコードなのか**：LLM は人間が書いた何千万行もの TypeScript や Python の実務コードで学習しているが、「ツール呼び出しの JSON」は合成データで後から訓練されたものにすぎない。細かいツールを何度も往復させるより、**型定義（TypeScript SDK）を見せてコードを書かせる方が、LLM の本来の得意技を活かせる**。
- **Code Mode の仕組み**：
  - MCP サーバーが多数の個別ツールを公開する代わりに、**`search`（API 仕様を検索する）と `execute`（安全なサンドボックス内で TypeScript コードを実行する）の2つ程度**に絞って公開する。
  - これにより、初期のトークン消費を **117万トークン → 約 1,000 トークン（99.9% 削減）** に圧縮できた。
  - 生成されたコードは Cloudflare Workers の軽量な隔離環境（V8 Isolate）で動き、外部への通信は許可された MCP バインディングだけに制限される。

## 原文引用（短く）

> "LLMs are much better at writing code to call APIs than they are at using tool-calling directly."

> "Instead of exposing thousands of individual tools, we expose a minimal interface to search the API and execute TypeScript code in a secure sandbox."

## 注意点

- 「MCP を捨てる」のではなく、「**MCP の上にコード実行とオンデマンド検索を載せる**」というアプローチ。直後に Anthropic も同様の手法（[05](05_anthropic_code-execution-with-mcp.md)）を発表し、現在の定番パターン⑤（[docs/02 の 6章](../docs/02_mcp-patterns.md#6-パターン⑤コード実行オンデマンド読み込みtool-search--code-mode)）として定着している。
