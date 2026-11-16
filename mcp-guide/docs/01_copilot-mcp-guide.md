# GitHub Copilot / VS Code で MCP はどう使うか

> [MCP 入門（Claude Code 編）](00_mcp-guide.md)の続編です。Claude Code 用に作った MCP サーバーを **VS Code（GitHub Copilot Agent Mode）** でそのまま動かす方法と、設定ファイルの違いを図解でまとめます（初回確認：2026-11-10、出典は [info/08](../info/08_vscode-copilot_mcp-docs.md)）。
>
> **📌 2026-11-12〜13 更新の重要補足（Copilot ハーネスへの移行）**：VS Code の **旧 Local ハーネスは非推奨（2027 年 2 月までに削除予定）** となり、後継の **Copilot ハーネス（Session Target → Copilot）** ではワークスペース直下の **`.mcp.json`（`mcpServers`・`${VAR}`）** を直接読み込む方式へ移っています。旧 `.vscode/mcp.json` も単純な定義は自動転送されますが、**`${input:...}` 付き定義は転送から除外されてサーバーが見えなくなります**。移行・復旧の詳しい手順は [Local と Copilot ハーネス（第 3 節）](../../copilot-fusion/01_harness-local-vs-copilot.md#3-なぜ-mcp-が見えなくなるのか原因と移行) を参照してください。

---

## 目次

1. [結論：MCP サーバー本体は100%そのまま使える](#1-結論mcp-サーバー本体は100そのまま使える)
2. [設定ファイル（`.mcp.json` vs `.vscode/mcp.json`）の比較](#2-設定ファイルmcpjson-vs-vscodemcpjsonの比較)
3. [VS Code ならではの安全機能：`inputs`（パスワード入力欄）](#3-vs-code-ならではの安全機能inputsパスワード入力欄)
4. [VS Code の Agent Mode で動かす4ステップ](#4-vs-code-の-agent-mode-で動かす4ステップ)
5. [サブエージェントごとに使える MCP を絞る方法](#5-サブエージェントごとに使える-mcp-を絞る方法)
6. [会社の環境（Business / Enterprise）での注意点](#6-会社の環境business--enterpriseでの注意点)
7. [参考文献](#7-参考文献)

---

## 1. 結論：MCP サーバー本体は100%そのまま使える

![Claude Code と VS Code の設定ファイル対比](assets/copilot-vs-claude-mcp.svg)

- **サーバーのコード変更はゼロ**：`servers/cafe-catalog-mcp.js` のような自作サーバーも、公式のクラウド MCP も、**1行も書き換えずに両方のツールでそのまま動きます**。
- **変えるのは設定ファイルの置き方**：旧 Local ハーネス向け（`.vscode/mcp.json`）と Claude Code 向け（`.mcp.json`）の両方を同居させておけば、どちらのツールでも動きます。なお **新しい Copilot ハーネスでは Claude Code と同じ `.mcp.json` を直接読み込める** ため、これから新規に揃える場合は `.mcp.json` を基準にする方が管理しやすくなります。

---

## 2. 設定ファイル（`.mcp.json` vs `.vscode/mcp.json`）の比較

このワークスペースのルート直下（`mcp-guide/`）に置いてある2つのファイルを見比べてみましょう。下の表の「VS Code（旧 Local ハーネス）」は従来のエディタ管理形式です。**Copilot ハーネス（Session Target → Copilot）** を使う場合は、**Claude Code と同じ `.mcp.json`（`"mcpServers"` と `${VAR}`）** がネイティブ設定になります。

#### Claude Code 用（`.mcp.json`）
```json
{
  "mcpServers": {
    "cafe-catalog": {
      "command": "node",
      "args": ["servers/cafe-catalog-mcp.js"]
    }
  }
}
```

#### VS Code / GitHub Copilot 用（`.vscode/mcp.json`）
```json
{
  "servers": {
    "cafe-catalog": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/servers/cafe-catalog-mcp.js"]
    }
  }
}
```

| 比較項目 | Claude Code / Copilot ハーネス（ネイティブ） | VS Code（旧 Local ハーネス） |
|---|---|---|
| **プロジェクト設定ファイル** | **`.mcp.json`** | **`.vscode/mcp.json`** |
| **一番外側のキー名** | **`"mcpServers"`** | **`"servers"`** |
| **`type` の書き方** | Claude Code は省略可 / Copilot ハーネスでも利用可 | **`"type": "stdio"`** を書く |
| **パス指定のコツ** | 相対パスは起動・実行フォルダ基準 | **`${workspaceFolder}/servers/...`** が確実 |
| **環境変数の参照** | `${VAR}` / `${VAR:-既定値}` | `${env:VAR}`（秘密情報は旧仕様の `${input:...}`） |
| **稼働状態の確認** | Claude：`/mcp` ／ Copilot：Customizations | ファイル内の **`Start / Restart`** ボタン |

環境変数をサーバーに渡したいときは、どちらも `env` 欄に書きます（下は書き方の例です。この実験用サーバーは環境変数を使いません）。

```jsonc
// Claude Code（.mcp.json）：自分の PC の環境変数 API_KEY を渡す
"env": { "API_KEY": "${API_KEY}" }

// VS Code（.vscode/mcp.json）：同じことを VS Code の書き方で
"env": { "API_KEY": "${env:API_KEY}" }
```

---

## 3. VS Code ならではの安全機能：`inputs`（パスワード入力欄）

> ⚠️ **旧 Local ハーネス専用の機能です**：`inputs`（`${input:...}`）は **新しい Copilot ハーネスでは非対応** です。`.vscode/mcp.json` に `${input:...}` が含まれていると **Copilot ハーネスへの自動転送対象から除外されてサーバーが見えなくなります**（`.mcp.json` にそのままコピーしても動きません）。
> Copilot ハーネスでは **OAuth 認証** を使うか、環境変数参照（`${NAME}`）＋実行先環境へのキー設定（その後 **Agent Host を再起動**）に切り替えてください。詳しい手順は [認証方式の選択と環境変数への書き換え例](../../copilot-fusion/01_harness-local-vs-copilot.md#認証方式の選択と環境変数への書き換え例) を参照してください。

旧 Local ハーネス向けの `.vscode/mcp.json` では、**`inputs`** を使うことで API キーをファイルに一切書かずに受け取れます（[VS Code Docs](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)）。

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "my-api-key",
      "description": "社内 API のキーを入力してください",
      "password": true
    }
  ],
  "servers": {
    "company-knowledge": {
      "type": "http",
      "url": "https://mcp.internal.example.com/mcp",
      "headers": { "Authorization": "Bearer ${input:my-api-key}" }
    }
  }
}
```

- **初回起動時に VS Code 上部に入力ボックスが出現**し、入力したキーは VS Code の安全な領域に記憶されます。

---

## 4. VS Code の Agent Mode で動かす4ステップ

1. **起動確認**：旧 Local ハーネスでは `.vscode/mcp.json` を開き、`"cafe-catalog"` の上に表示される **`Start`**（または `Running`）をクリックする。Copilot ハーネスでは `.mcp.json` が読まれるため、`Chat: Open Customizations` 等で一覧表示を確認する。
2. **Agent モード選択**：Copilot Chat パネルを開き、モードを **Agent** に切り替える。
3. **ツールの有効化**：入力欄のツールアイコン（🔧）を押し、`cafe-catalog` の3つのツールにチェックが入っていることを確認する。
4. **依頼する**：`prompts/01-allergen-menu.md` の内容を貼って実行する。

---

## 5. サブエージェントごとに使える MCP を絞る方法

特定のサブエージェントにだけ MCP ツールを渡したい場合の書き方比較です（見本は [samples/04-subagent-scoped/](../samples/04-subagent-scoped/)）。

```yaml
# Claude Code 版（.claude/agents/catalog-specialist.md）
---
name: catalog-specialist
description: カフェのメニュー検索・アレルゲン照合・価格計算の専門調査員。
tools: Read, mcp__cafe-catalog__search_menu, mcp__cafe-catalog__check_allergens, mcp__cafe-catalog__calculate_set_price
mcpServers:
  # サーバーの定義をここに直接（インラインで）書く → 親エージェントには見えない
  - cafe-catalog:
      type: stdio
      command: node
      args: ["servers/cafe-catalog-mcp.js"]
---
```

> ⚠️ **「子だけに渡す」ための大事なポイント（Claude Code）**：`mcpServers:` には「サーバー名だけ」を書く方法（例：`- cafe-catalog`）もありますが、これは **`.mcp.json` などに登録済みのサーバーを参照する書き方**で、**親エージェントも同じサーバーを使える状態のまま**です。親から完全に隠したいときは、上のように**サブエージェント定義の中にサーバーをインラインで書き、`.mcp.json` には登録しない**でください。

```yaml
# GitHub Copilot 版（.github/agents/catalog-specialist.agent.md）
---
name: catalog-specialist
description: カフェのメニュー検索・アレルゲン照合・価格計算の専門調査員。
tools: ['read', 'cafe-catalog/*']
user-invocable: false
---
```

- `tools: ['cafe-catalog/*']` で、このエージェントが使えるツールを `cafe-catalog` サーバーのものに絞れます。`user-invocable: false` は「人がエージェント選択欄から直接選べないようにし、サブエージェントとしてだけ使う」設定です。
- ただし Copilot では `.vscode/mcp.json`（旧 Local）や `.mcp.json`（Copilot ハーネス）に登録したサーバーは**メインのエージェントからも使える**状態です。メイン側で使わせたくない場合は、チャット入力欄のツール選択（🔧）で `cafe-catalog` のチェックを外してください。

---

## 6. 会社の環境（Business / Enterprise）での注意点

| 注意点 | 対処法 |
|---|---|
| **組織ポリシーで無効化されている** | 管理者が GitHub 組織設定の「**MCP servers in Copilot**」を **Enabled** にする必要があります。 |
| **社内プロキシで `npx` が失敗する** | 毎回外部通信する `npx` ではなく、リポジトリ内のスクリプトを `node` で直接起動する構成が安定します。 |
| **ツール実行時の承認ダイアログ** | 読み取り専用の安全なツールは「このセッションで常に許可」、更新系ツールは「毎回人間が確認」にします。 |

---

## 7. 参考文献

すべて 2026-11-10 閲覧（詳細は [info/08_vscode-copilot_mcp-docs.md](../info/08_vscode-copilot_mcp-docs.md)）。ハーネス移行（2026-11-12〜13 確認）の詳細は [Local と Copilot ハーネス](../../copilot-fusion/01_harness-local-vs-copilot.md) も参照してください。

| # | 出典 | 内容 |
|---|---|---|
| 1 | VS Code Docs「[Use MCP servers in VS Code](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)」 | `.vscode/mcp.json` の `servers`・`inputs`、Agent Mode の操作（旧 Local ハーネス中心） |
| 2 | GitHub Docs「[Extending GitHub Copilot Chat with MCP](https://docs.github.com/en/copilot/customizing-copilot/extending-copilot-chat-with-mcp)」 | 組織ポリシー設定と注意点 |
| 3 | VS Code Docs「[Custom agents in VS Code](https://code.visualstudio.com/docs/copilot/customization/custom-agents)」 | `.agent.md` の `tools:` での `'サーバー名/*'` 指定 |
| 4 | 内部ガイド「[Local と Copilot ハーネス](../../copilot-fusion/01_harness-local-vs-copilot.md)」 | 2026-11-12〜13 確認の Copilot ハーネス用 `.mcp.json`・環境変数移行・転送除外条件 |
