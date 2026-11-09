# VS Code / GitHub Copilot 公式ドキュメント「Use MCP servers in VS Code」

| 項目 | 内容 |
|---|---|
| 発行元 | Microsoft / GitHub（code.visualstudio.com および docs.github.com） |
| 取得日 | 2026-11-10 |
| 鮮度 | **新**（取得当日の内容） |
| URL | https://code.visualstudio.com/docs/copilot/customization/mcp-servers ／ https://docs.github.com/en/copilot/customizing-copilot/extending-copilot-chat-with-mcp |

## 要点

### 1. 設定ファイルの場所と Claude Code との違い
- プロジェクト共有の設定ファイルは **`.vscode/mcp.json`** に置く。
- Claude Code の `.mcp.json` との最大の違いは、**一番外側のキー名が `"mcpServers"` ではなく `"servers"` である**こと。
- **入力変数**（`inputs`）：API キーなどの秘密情報をファイルに書かず、初回起動時に VS Code の入力欄でユーザーに尋ねて安全に記憶する `"inputs": [{ "type": "promptString", "id": "...", "password": true }]` の仕組みが組み込まれている。

### 2. Agent Mode とカスタムエージェントでの利用
- VS Code のチャットを **Agent** モードにすると、`.vscode/mcp.json` のツールが自動で認識される。チャット入力欄のツールアイコン（レンチマーク）から、その会話で有効にするツールを手動でオン・オフできる。
- `.github/agents/*.agent.md` の `tools:` 欄に `'サーバー名/*'` や個別のツール名を書くことで、**そのサブエージェント（カスタムエージェント）が使える MCP ツールを限定**できる。

### 3. Resources と Prompts の扱い
- **Resources**：「Add Context...」メニュー ＞「MCP Resources」から選んで会話に添付できるほか、ツール実行結果として返されたリソースも参照できる。
- **Prompts**：チャット欄で `/mcp.サーバー名.プロンプト名` のスラッシュコマンドとして呼び出せる。

### 4. 企業環境（Copilot Business / Enterprise）での注意
- 会社から付与された Copilot アカウントでは、組織の管理者が GitHub のポリシー設定で **「MCP servers in Copilot」を Enabled（有効）** にしていないと MCP が使えない場合がある。

## 原文引用（短く）

> "To share MCP server configurations with your team, create a `.vscode/mcp.json` file in your workspace. Use the `inputs` section to securely prompt for API keys or other sensitive values."

> "In custom agent definitions (`.agent.md`), you can reference specific MCP tools or entire servers in the `tools` property."

## 注意点

- VS Code には互換機能があり、設定次第で Claude Code 用の設定を読み込める場合もあるが、チームで VS Code を使うなら正式な `.vscode/mcp.json`（ルートキー `"servers"`）を用意しておくのが最も確実。
