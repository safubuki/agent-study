# Claude Code 公式ドキュメント「Connect Claude Code to tools via MCP」

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic（code.claude.com 公式ドキュメント。随時更新） |
| 取得日 | 2026-11-10 |
| 鮮度 | **新**（取得当日の内容） |
| URL | https://code.claude.com/docs/en/mcp |

## 要点

### 1. 追加コマンドと3つのスコープ（保存場所）
- `claude mcp add` コマンド、または設定ファイルの直接編集で MCP サーバーを登録できる。
- **スコープ（`--scope`）**は3種類あり、用途で使い分ける：
  | スコープ | 保存される場所 | 共有範囲・用途 |
  |---|---|---|
  | `local`（既定） | `~/.claude.json`（プロジェクトパス配下） | **自分だけ・このプロジェクトだけ**。個人用のトークンを含む設定など |
  | `project` | プロジェクト直下の **`.mcp.json`** | **チーム全員で共有**（Git にコミットする） |
  | `user` | `~/.claude.json`（ルート直下） | **自分だけ・すべてのプロジェクト共通** |
- 同じ名前のサーバーがある場合の優先順位：`local` ＞ `project` ＞ `user`。

### 2. `.mcp.json` の書き方と環境変数展開
- ルートのキーは `"mcpServers"`。
- 値の中に `${VAR}` や `${VAR:-default}` の形で環境変数を書けるため、`.mcp.json` 自体には秘密の API キーを書かずに Git で共有できる。
- Windows 環境でローカルの `npx` を直接呼ぶ際にプロセス起動が失敗する場合は、`cmd /c npx ...` でラップする注意書きがある（Node.js の `node xxx.js` を直接呼ぶ場合はそのまま動く）。

### 3. サブエージェントごとの MCP 制限
- `.claude/agents/*.md` の frontmatter に `mcpServers:` を書くことで、**特定のサブエージェントだけに特定の MCP サーバーを使わせる**ことができる。また `tools` 欄で `mcp__サーバー名__ツール名` を指定して個別のツールだけを許可することも可能。

### 4. MCP Tool Search（遅延読み込みによるトークン節約）
- 接続された MCP ツールの説明文がコンテキスト窓の一定割合（目安として 10% 程度）を超えると、Claude Code は自動的に **Tool Search（オンデマンド検索モード）** に切り替わる。
- 最初から全ツールの定義をプロンプトに入れるのではなく、必要になった時点で `MCPSearch` ツールを使って該当する MCP ツールを検索・ロードするため、多数の MCP サーバーを登録していてもコンテキストが溢れにくい。
- 環境変数 `ENABLE_TOOL_SEARCH`（`auto` / `true` / `false`）で挙動を制御できる。

### 5. Resources と Prompts の呼び出し方
- **Resources**：チャット入力欄で `@サーバー名:プロトコル://パス` のように `@` メンションで参照できる。
- **Prompts**：`/mcp__サーバー名__プロンプト名` の形でスラッシュコマンドとして呼び出せる。

## 原文引用（短く）

> "Project-scoped servers are stored in a `.mcp.json` file at the root of your project. This file is designed to be checked into version control so all team members have access to the same MCP tools."

> "When MCP tool descriptions would consume a large portion of the context window, Claude Code automatically uses Tool Search to load tools on demand rather than upfront."

## 注意点

- プロジェクト共有の `.mcp.json` に書かれたサーバーは、セキュリティのため初回起動時にユーザーの承認（本当にこのコマンドを実行してよいか）を求める。非対話モード（`claude -p`）でテストする際は `--mcp-config` や権限オプションと組み合わせて使う。
