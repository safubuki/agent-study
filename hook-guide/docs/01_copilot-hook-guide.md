# GitHub Copilot / VS Code でフックはどう使うか

**GitHub Copilot** にも、Claude Code と同様にイベントに応じて処理を動かす **Hooks**（フック）があります。ログ保存や検査の処理本体は共有できますが、**入力 JSON と判定の出力は実行環境に合わせた変換が必要**です。

ただし「ほぼ同じ」なのは考え方までで、**イベントごとにできること（止められるか・出力が使われるか）には差があります**。この章では、その差を中心に整理します。

> **2026-11-12 に公式資料を確認。** VS Code では選択中の実行環境を確認します。Copilot を選んだセッションは Copilot の仕様、Claude を選んだセッションは Claude の仕様です。旧 Local 実行環境とも区別してください。[GitHub のリファレンス](https://docs.github.com/en/copilot/reference/hooks-reference)、[VS Code の実行環境の選択](https://code.visualstudio.com/docs/agent-customization/hooks#choose-the-hook-implementation-for-your-session)

接続関係や動く順序から知りたい場合は、[全体図と4つのシーケンス図](03_hook-flow-examples.md)をご覧ください。

---

## 1. Claude Code と Copilot / VS Code の違いと共通スクリプト構成

![Claude Code と GitHub Copilot / VS Code のフック比較](assets/copilot-vs-claude-hooks.svg)

| 比較項目 | Claude Code | Copilot（VS Code の Copilot 実行環境 / CLI） |
| :--- | :--- | :--- |
| **設定ファイル** | `.claude/settings.json` | **`.github/hooks/*.json`**（例：`hooks.json`）。Copilot の実行環境はプロジェクトの `.claude/settings.json` も読めるが、入出力の互換性は別に確認する |
| **最上位の必須キー** | `"hooks": { ... }` | **`"version": 1`** と `"hooks": { ... }` |
| **イベント名の表記** | 先頭大文字（`PreToolUse` / `PostToolUse` / `Stop`） | この章は `preToolUse` / `postToolUse` / `agentStop` を使用。互換の大文字名もあり、入力形式が変わる |
| **コマンド指定** | `"command": "node ..."` | OS 別の **`"bash"` / `"powershell"`**。`"command"` だけ書くと両方に自動で使われる |
| **入力 JSON のキー** | `tool_name` / `tool_input`（snake_case） | `toolName` / `toolArgs`（camelCase）。ツール名も `bash` / `edit` / `create` / `view` など小文字 |
| **ツールの絞り込み** | `"matcher": "Edit\|Write"` | Copilot の実行環境は対象イベントで `matcher` に対応。小文字名と互換名のツール名・一致規則を確認する |
| **実行前に止める方法** | **終了コード `2`**、または `hookSpecificOutput` 内の `permissionDecision: "deny"` | **終了コード `2`**、またはトップレベルの `permissionDecision: "deny"`（`permissionDecisionReason` を添える） |
| **スクリプトがエラー落ちしたとき（実行前フック）** | 通常の失敗では許可フローへ進む。失敗時にブロックする `onFailure` 設定もある | 非タイムアウトの異常終了は拒否。**タイムアウトは通常の許可フローへ進む** |

### イベントの対応表と「できること」の差

| Claude Code | Copilot | Copilot 側の注意点 |
| :--- | :--- | :--- |
| `SessionStart` | `sessionStart` | 出力 JSON の `additionalContext` が AI に渡る |
| `UserPromptSubmit` | `userPromptSubmitted` | **設定ファイルの command フックの出力は採用されない**。ローカル処理は可能。開始時の文脈は `sessionStart` で追加できるが、送信ごとの添付の代用にはならない |
| `PreToolUse` | `preToolUse` | Claude Code とほぼ同じ（`exit 2` か `permissionDecision: "deny"` で拒否） |
| `PostToolUse` | `postToolUse` | ⚠️ **`decision: "block"` は使えない**。AI に伝えたいことは `additionalContext` で返す |
| `Stop` | `agentStop` | `decision: "block"` と `reason` で差し戻せる。入力に `stop_hook_active` もある。連続8回で強制終了 |
| `SubagentStop` | `subagentStop` | 子エージェントの完了時 |
| `Notification` | `notification` | CLI 限定として文書化。VS Code やクラウドでも同じ通知があると仮定しない |

---

## 2. `.github/hooks/hooks.json` の書き方（Copilot 用）

リポジトリの `.github/hooks/hooks.json` に以下の設定を置き、VS Code の Copilot 実行環境または Copilot CLI で読み込みを確認します。クラウドでは実行環境・使えるイベント・ネットワーク条件が異なるため、ローカルと同じ動作を前提にしません。[クラウドでの実行条件](https://docs.github.com/en/copilot/reference/hooks-reference#cloud-agent-execution-environment)

```json
{
  "version": 1,
  "hooks": {
    "preToolUse": [
      {
        "type": "command",
        "bash": "node ./hooks/guard-write.js",
        "powershell": "node ./hooks/guard-write.js",
        "timeoutSec": 15
      }
    ],
    "postToolUse": [
      {
        "type": "command",
        "bash": "node ./hooks/post-check.js",
        "powershell": "node ./hooks/post-check.js",
        "timeoutSec": 15
      }
    ],
    "agentStop": [
      {
        "type": "command",
        "bash": "node ./hooks/stop-verify.js",
        "powershell": "node ./hooks/stop-verify.js",
        "timeoutSec": 15
      }
    ]
  }
}
```

- `bash` は Mac / Linux 用、`powershell` は Windows 用のコマンドです。同じコマンドで済むなら、代わりに `"command": "node ./hooks/guard-write.js"` を1行書くだけでも両方に使われます。
- `timeoutSec` を省略すると 30 秒です。**`preToolUse` がタイムアウトした場合は「拒否」ではなく通常の許可確認に進む**ので、重い処理は入れないでください。

> **対象ツールを確認する**：Copilot の実行環境では `matcher` を使えますが、小文字名・互換名・旧 Local 実行環境でツール名や一致規則が異なります。スクリプト側でも対象を確認し、利用中の環境で実際のイベントを検証してください。[Matcher の仕様](https://docs.github.com/en/copilot/reference/hooks-reference#matcher-filtering)

---

## 3. Claude Code と Copilot の両方で動くスクリプトの書き方

渡される JSON のキー名（`tool_name` と `toolName`、`tool_input` と `toolArgs`）の違いを吸収すると、検査処理を共用できます。**JSON で判定や追加情報を返す場合は、出力形式も変換します。** 下の例は、両方で使える終了コード `2` による実行前の拒否です。

```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');

// Claude Code（snake_case）と Copilot（camelCase）の両方から値を取り出す
const toolName = String(data.tool_name || data.toolName || '').toLowerCase();
let toolInput = data.tool_input || data.toolArgs || {};
if (typeof toolInput === 'string') {
  // Copilot では引数が JSON 文字列で届く場合があるため、念のため解析する
  try { toolInput = JSON.parse(toolInput); } catch { toolInput = {}; }
}
// Claude Code は file_path、Copilot は path でファイルパスが届く
const filePath = toolInput.file_path || toolInput.path || '';

// 例：.env ファイルへの書き込みを両方まとめてブロック（終了コード 2）
if (/(^|[\\/])\.env$/i.test(filePath)) {
  process.stderr.write('[BLOCKED] .env の変更は禁止されています。\n');
  process.exit(2);
}
process.exit(0);
```

ツール名も製品ごとに違います（例：Claude Code の `Write` は Copilot では `create`、`Bash` は `bash` または `powershell`）。スクリプトでは**小文字に揃えてから、両方の名前を並べて判定**すると安全です。

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

- **全体のつながり・状態通知・環境差のシーケンス図** → [03_hook-flow-examples.md](03_hook-flow-examples.md)
- **フックの基本とライフサイクル** → [00_hook-guide.md](00_hook-guide.md)
- **そのまま使える定番5パターン** → [02_hook-patterns.md](02_hook-patterns.md)
- **コピペ用サンプル集（5種）** → [samples/README.md](../samples/README.md)
