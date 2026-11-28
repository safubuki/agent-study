# 06. 既存のアプリに MCP の口を付ける（その先のアプリとのやり取りを見る）

「MCP サーバーの先にいるアプリは、どうやって情報を返しているの？」「MCP サーバーは何をしているの？」を、動かして確かめるための見本です。
ガイドの [00 の 1.3 節（MCP サーバーの中身）](../../docs/00_mcp-guide.md) と [00 の 1.4 節（普通の API との違い）](../../docs/00_mcp-guide.md) に対応しています。

## 登場人物

| 役 | ファイル | していること |
|---|---|---|
| **注文アプリ**（既存のアプリ） | [order-app.js](order-app.js) | 在庫と注文を管理する、ごく普通の Web API（`GET /api/stock`・`POST /api/orders`）。**MCP のことは何も知りません**。API キーがないと答えません |
| **MCP サーバー**（通訳） | [order-mcp.js](order-mcp.js) | 注文アプリの API を呼ぶ処理を、AI 向けの道具 `check_stock`・`place_order` に包んでいます。API キーはここだけが持ちます |
| **AI アプリ**（の代わり） | [run-demo.js](run-demo.js) | MCP クライアントとして MCP サーバーを呼び、往復を 1 本ずつ表示します（本物の AI アプリでは、ここに Claude Code などが入ります） |

## 動かす（AI の契約・外部パッケージ不要。Node.js 20 以降）

```powershell
cd mcp-guide
node samples\06-wrap-existing-app\run-demo.js
```

出力（抜粋）：

```text
[AI アプリ → MCP サーバー] tools/call place_order {"itemId":"SW-003","qty":2}（ちょうど頼む）
      [MCP サーバー → 注文アプリ] GET /api/stock?id=SW-003
      [注文アプリ → MCP サーバー] 200 {"itemId":"SW-003","name":"紅はるかと米粉のスイートポテトタルト","count":2}
      [MCP サーバー → 注文アプリ] POST /api/orders {"itemId":"SW-003","qty":2}
      [注文アプリ → MCP サーバー] 201 {"orderId":1001,"itemId":"SW-003","qty":2,"remaining":0}
[MCP サーバー → AI アプリ] 注文しました：注文番号 1001（紅はるかと米粉のスイートポテトタルト × 2）。残りの在庫は 0 個です。

[AI アプリ → MCP サーバー] tools/call place_order {"itemId":"DR-001","qty":999}（ありえない個数を頼む）
[MCP サーバー → AI アプリ] 注文できるのは 1〜10 個です。注文アプリには送っていません。
```

ここから分かること：

- **AI アプリは注文アプリと直接話していません**。話す相手は MCP サーバーだけで、注文アプリの URL も API キーも知りません。
- **MCP サーバーは、注文アプリが元から持っている口（Web API）を呼んでいるだけ**です。注文アプリ側は何も変えていません。
- **1 つの道具の中で、API を 2 回呼んでいます**（在庫確認 → 注文）。AI が順番を間違えたり、在庫を見ずに注文したりすることがありません。
- **ありえない頼み（999 個）は、MCP サーバーの中で止まります**。注文アプリには届きません。

## 既存のアプリに MCP の口を付ける 5 ステップ

| # | やること | この見本では |
|---|---|---|
| 1 | **相手の口を調べる**：アプリが持っている Web API・DB・ファイル・SDK・コマンドを確かめる（口がなければ MCP サーバーも作れない） | `GET /api/stock`・`POST /api/orders`（API キー必須） |
| 2 | **AI に任せたい作業を「道具」として決める**：API の数だけ道具を作るのではなく、作業の単位でまとめる | 「在庫を調べる」「在庫を確かめてから注文する」の 2 つ |
| 3 | **道具の説明と引数の形を書く**：LLM はこの説明を読んで道具を選ぶ | `TOOLS` の `description` と `inputSchema` |
| 4 | **呼ばれたときの処理を書く**：相手の口を呼び、結果を文章（や JSON）にして返す。危ない頼みはここで止める | `checkStock()`・`placeOrder()`（1〜10 個の柵） |
| 5 | **AI アプリに登録して試す**：設定ファイルに起動コマンドを書く。まずは点検スクリプトとデモで確かめる | 下の設定ファイル、`inspect-mcp-tools.js`、`run-demo.js` |

## Claude Code・VS Code（Copilot）で使う

1. 別のターミナルで注文アプリを起動しておきます：`node samples\06-wrap-existing-app\order-app.js`（`http://127.0.0.1:3939`）
2. `claude-code/` フォルダで `claude` を起動するか、`copilot/` フォルダを VS Code で開きます（MCP サーバーは AI アプリが自動で起動します）。
3. 「SW-003 の在庫を調べて、2 個注文して」と頼んでみます。

| 設定ファイル | 対象 |
|---|---|
| [claude-code/.mcp.json](claude-code/.mcp.json) | Claude Code |
| [copilot/.mcp.json](copilot/.mcp.json) | GitHub Copilot（Copilot ハーネス） |
| [copilot/.vscode/mcp.json](copilot/.vscode/mcp.json) | VS Code 旧 Local ハーネス |

> [!NOTE]
> この見本の API キー（`demo-key-123`）は練習用です。本物のアプリにつなぐときは、キーを設定ファイルに書かず、環境変数 `ORDER_APP_KEY` などで渡してください（[03 の 3 章](../../docs/03_mcp-security-and-rules.md)）。
