# GitHub Copilot / VS Code でフックはどう使うか

2026年現在、**GitHub Copilot**（VS Code Agent Mode・Copilot CLI・クラウド上の Coding Agent）にも、Claude Code とほぼ同じ **Hooks**（フック）が搭載されています。さらに **Node.js スクリプトを1本書いておけば、Claude Code と Copilot の両方でそのまま使い回せます**。

---

## 1. Claude Code と Copilot / VS Code の違いと共通スクリプト構成

![Claude Code と GitHub Copilot / VS Code のフック比較](assets/copilot-vs-claude-hooks.svg)

| 比較項目 | Claude Code | GitHub Copilot（VS Code / CLI / Cloud） |
| :--- | :--- | :--- |
| **設定ファイル** | `.claude/settings.json` | **`.github/hooks/hooks.json`**（VS Code は `.claude` 側も読込可） |
| **最上位の必須キー** | `"hooks": { ... }` | **`"version": 1`** と `"hooks": { ... }` |
| **イベント名の表記** | 先頭大文字（`PreToolUse` / `PostToolUse` / `Stop`） | 先頭小文字（`preToolUse` / `postToolUse` / `agentStop`） |
| **コマンド指定** | `"command": "node ..."` | `"command"` または OS 別の **`"bash"` / `"powershell"`** |
| **強制ブロック方法** | **終了コード `2`** または JSON `deny` / `block` | **終了コード `2`** または JSON `permissionDecision: "deny"` |

---

## 2. `.github/hooks/hooks.json` の書き方（Copilot 用）

リポジトリの `.github/hooks/hooks.json` に以下の設定を置くと、VS Code の Copilot Agent Mode・Copilot CLI・GitHub 上の Coding Agent のすべてでフックが動きます。

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "command": "node ./hooks/guard-write.js",
        "bash": "node ./hooks/guard-write.js",
        "powershell": "node ./hooks/guard-write.js",
        "timeoutSec": 15
      }
    ],
    "postToolUse": [
      {
        "type": "command",
        "command": "node ./hooks/post-check.js",
        "bash": "node ./hooks/post-check.js",
        "powershell": "node ./hooks/post-check.js",
        "timeoutSec": 15
      }
    ],
    "agentStop": [
      {
        "type": "command",
        "command": "node ./hooks/stop-verify.js",
        "bash": "node ./hooks/stop-verify.js",
        "powershell": "node ./hooks/stop-verify.js",
        "timeoutSec": 15
      }
    ]
  }
}
```

> 💡 **ポイント**：Copilot 側の `.github/hooks/*.json` には Claude Code のような `"matcher"` 欄がない環境があるため、**対象ツールの絞り込みは Node.js スクリプト側の `if` 文で行う**と両方のツールで安全に動きます。

---

## 3. Claude Code と Copilot の両方で動くスクリプトの書き方

渡される JSON のキー名（`tool_name` と `toolName` など）のわずかな違いを吸収するヘルパーを先頭に5行書くだけで、1本のスクリプトを両方で共用できます（本ガイドの `hooks/*.js` と `samples/` はすべてこの両対応方式です）。

```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');

// Claude Code（snake_case）と Copilot（camelCase）の両方から値を取り出す
const toolName = String(data.tool_name || data.toolName || '').toLowerCase();
const toolInput = data.tool_input || data.toolInput || data.input || {};
const filePath = toolInput.file_path || toolInput.filePath || toolInput.path || '';

// 例：.env ファイルへの書き込みを両方まとめてブロック（終了コード 2）
if (/(^|[\\/])\.env(\.|$)/i.test(filePath)) {
  process.stderr.write('[BLOCKED] .env の変更は禁止されています。\n');
  process.exit(2);
}
process.exit(0);
```

---

## 4. VS Code 設定・Git Hooks との使い分け（実務の3段構え）

VS Code で開発する場合、すべてを AI フックで作る必要はありません。既存の仕組みと組み合わせると設定がシンプルになります。

| やりたいこと | 一番手軽で確実な仕組み | 設定場所 |
| :--- | :--- | :--- |
| **AI の危険コマンド阻止・ファイル保護** | **AI フック**（`PreToolUse` / `preToolUse`） | `.claude/settings.json` / `.github/hooks/hooks.json` |
| **AI が完了する前の要件・テスト検査** | **AI フック**（`Stop` / `agentStop`） | `.claude/settings.json` / `.github/hooks/hooks.json` |
| **人間が保存したときの自動整形** | **VS Code 標準設定**（`editor.formatOnSave`） | `.vscode/settings.json` |
| **コミット直前の Lint・型チェック** | **Git Hooks**（Husky / `pre-commit`） | `.husky/pre-commit` |
| **PR 作成後の全体テスト・ビルド検査** | **GitHub Actions**（CI） | `.github/workflows/ci.yml` |

> 📌 **社内ポリシーで AI の Hooks 機能が無効化されている場合**でも、**`.vscode/settings.json`（保存時自動整形）＋ Git `pre-commit`（コミット前検査）** の2つを設定しておけば、AI が書いたコードもコミット時に必ずチェックできます。

---

## 関連ドキュメント

- **フックの基本とライフサイクル** → [00_hook-guide.md](file:///c:/git_home/agent-study/hook-guide/docs/00_hook-guide.md)
- **そのまま使える定番5パターン** → [02_hook-patterns.md](file:///c:/git_home/agent-study/hook-guide/docs/02_hook-patterns.md)
- **コピペ用サンプル集（5種）** → [samples/README.md](file:///c:/git_home/agent-study/hook-guide/samples/README.md)
