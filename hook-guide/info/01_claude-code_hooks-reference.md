# Claude Code Docs「Hooks reference」

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic（code.claude.com 公式ドキュメント。随時更新） |
| 取得日 | 2026-11-10 |
| 鮮度 | **新**（取得当日の内容） |
| URL | https://code.claude.com/docs/en/hooks |

## 要点

- **フック**（Hooks）は、Claude Code のライフサイクル（動きの節目）で自動的に実行されるユーザー定義の仕組み。LLM の判断に頼らず、**決定論的**（deterministic＝同じ入力なら100%同じ結果になること）な処理を挟み込める。
- **主なイベント一覧**：
  | イベント名 | 発火タイミング | 主な用途・制御できること |
  |---|---|---|
  | `SessionStart` | セッションの開始・再開時 | 環境情報の注入、初期化処理 |
  | `UserPromptSubmit` | ユーザーが指示を送信した直後（AIが読む前） | 文脈の自動追加（`additionalContext`）、不適切な指示のブロック |
  | `PreToolUse` | AI がツール（`Bash`, `Write`, `Edit` など）を実行する**直前** | 危険な操作の拒否（`deny` / `exit 2`）、自動承認（`allow`）、引数の書き換え（`updatedInput`） |
  | `PermissionRequest` | ユーザーに許可確認ダイアログが出る直前 | プログラムによる自動許可・拒否 |
  | `PostToolUse` | ツールが正常に実行された**直後** | 自動整形（Prettier 等）、構文検査、AI へのフィードバック返却 |
  | `Notification` | Claude Code が通知を出すとき（入力待ち・完了など） | デスクトップ通知、音声再生、Slack 等への連携 |
  | `Stop` | メインエージェントが返答を終えて止まろうとしたとき | 完了チェック。不合格なら `decision: "block"` で作業を続行させる |
  | `SubagentStop` | サブエージェントが作業を終えて止まろうとしたとき | サブエージェント単位の完了チェック・差し戻し |
  | `PreCompact` | 会話履歴が長くなり圧縮（コンパクション）される直前 | 要約前のログ保存やカスタム指示の注入 |
  | `SessionEnd` | セッションが終了するとき | 後片付け、集計・監査ログの保存 |
- **ハンドラーの種類**（`type`）：
  - `command`：ローカルのシェルコマンドやスクリプトを実行。標準入力（`stdin`）で JSON を受け取り、終了コードと標準出力（`stdout`）・標準エラー出力（`stderr`）で結果を返す。
  - `http`：指定した URL に HTTP POST で JSON を送り、レスポンス JSON を受け取る。
  - `prompt`：軽量な LLM モデルにプロンプトで判定させる（意味的なチェック向き）。
- **終了コード（Exit Code）の意味**：
  - `0`：成功。そのまま続行し、`stdout` に JSON があれば解析する。
  - `2`：**ブロッキングエラー（強制阻止）**。操作を即座に中止し、`stderr` の文字列を AI（またはユーザー）に理由として伝える。
  - その他（`1` など）：非ブロッキングエラー。警告を表示して処理自体は続行する。
- **`PreToolUse` の JSON 出力**（`hookSpecificOutput`）：
  - `permissionDecision`: `"allow"`（確認画面を飛ばして許可）、`"deny"`（拒否）、`"ask"`（人間に確認）。
  - `updatedInput`: ツールに渡す引数をその場で書き換える（例：危険なオプションを削る、安全なパスに変える）。
- **無限ループ防止**（`stop_hook_active`）：
  - `Stop` フックで差し戻した後のターンでは、入力 JSON の `stop_hook_active` が `true` になる。スクリプト側でこれを見て通過させないと、永遠に終わらないループになる。

## 原文引用（短く）

> "Hooks are user-defined shell commands, HTTP endpoints, or LLM prompts that execute automatically at specific points in Claude Code's lifecycle."

> "Exit code 2: Blocking error. stderr is fed back to Claude to process automatically."

## 注意点

- `permissionDecision` や `updatedInput` は必ず `hookSpecificOutput` オブジェクト（`hookEventName: "PreToolUse"` を含む）の中に入れ子にする必要がある。トップレベルに書くと無視される。
- `allow` を返しても、設定ファイル（`settings.json`）の `permissions.deny` で明示的に禁止されている操作を上書きして許可することはできない（安全側のルールが優先）。
