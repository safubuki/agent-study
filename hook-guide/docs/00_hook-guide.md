# フック（Hooks）入門 — Claude Code を例に

プロンプトに「`.env` は触らないで」「保存後に Prettier を実行して」と書いても、AI は会話が長くなると忘れることがあります。**フック**（Hooks）は、AI の判断に頼らず「ツール実行の直前・直後・完了時」にスクリプトを **100% 確実に自動実行する仕組み**です。

---

## 1. フックとは何か — 「お願い」ではなく「物理的な関所」

![プロンプトのお願いとフックの強制の違い](assets/hook-what-is-it.svg)

- **プロンプト**（`CLAUDE.md`）：壁の貼り紙。文脈に応じた柔軟な判断は得意ですが、数%の確率で忘れます（**確率的**）。
- **フック**（Hooks）：駅の自動改札機。条件に合えば AI の意思に関係なく 100% 作動し、違反操作を遮断します（**決定論的ガードレール**）。
- **使い分けの基準**：「判断や文脈が要ること」はプロンプトや Subagents へ、「例外なく毎回同じ規則で縛ること」はフックへ任せます。

---

## 2. いつ動くか — ライフサイクルと10種類のイベント

![フックが動くタイミング（ライフサイクル全体図）](assets/hook-lifecycle.svg)

| イベント名 | タイミング | ブロック可否 | 主な用途 |
| :--- | :--- | :---: | :--- |
| **`SessionStart`** | 起動・再開・履歴圧縮直後 | — | 環境変数の設定、圧縮後のルール再注入 |
| **`UserPromptSubmit`** ★ | ユーザーが指示を送信した直後 | **可** | ブランチ名や差分の自動添付、機密送信阻止 |
| **`PreToolUse`** ★ | ツール実行の**直前** | **可** | `.env` 保護、`rm -rf` 阻止、引数の書き換え |
| **`PermissionRequest`** | 確認ダイアログが出る直前 | **可** | 安全なコマンドの自動承認・危険操作の自動拒否 |
| **`PostToolUse`** ★ | ツール実行の**直後** | 通知のみ | Prettier 自動整形、構文エラーの即時フィードバック |
| **`Notification`** | 確認待ち・アイドル通知時 | — | デスクトップ通知・音声アラート・Slack 通知 |
| **`SubagentStop`** | サブエージェント完了直前 | **可** | 子エージェントの成果物チェック・差し戻し |
| **`PreCompact`** | 会話履歴の自動圧縮直前 | — | 圧縮前のログ退避 |
| **`Stop`** ★ | メイン AI が完了して止まる直前 | **可** | テスト・必須項目の検査、不合格なら作業続行を強制 |
| **`SessionEnd`** | セッション終了時 | — | 一時ファイルの掃除、監査ログの集計 |

> 💡 **最初は ★ 印の 3 つ（`PreToolUse`・`PostToolUse`・`Stop`）だけ覚えれば実務の 9 割をカバーできます。**

---

## 3. どこに・どう書くか — 設定ファイルの解剖図

![設定ファイル（settings.json）とフックスクリプトの解剖図](assets/hook-file-anatomy.svg)

| 置き場所 | スコープ（効く範囲） | Git 共有 | 用途 |
| :--- | :--- | :---: | :--- |
| **`.claude/settings.json`** | プロジェクト全体 | 共有する | **【基本】** チーム全員で守る保護・整形・完了検査 |
| **`.claude/settings.local.json`** | プロジェクト（自分だけ） | 除外する | 個人用の通知音や実験中のフック |
| **`~/.claude/settings.json`** | 自分の PC の全プロジェクト | PC 内 | どのリポジトリでも効かせたい共通ガード |
| **`.claude/agents/*.md` の先頭** | 特定サブエージェントのみ | 共有する | そのサブエージェント稼働中だけ有効なフック |

- **`matcher`**（対象フィルタ）：`PreToolUse` や `PostToolUse` で「どのツールに反応するか」を正規表現で絞ります（例：`"Edit|Write|MultiEdit"`、`"Bash"`）。`Stop` や `UserPromptSubmit` では省略します。
- **パスの書き方**：どのフォルダから実行されても動くよう、コマンド内のパスには `$CLAUDE_PROJECT_DIR`（プロジェクトのルート）を付けます。

---

## 4. データの受け渡し — stdin / 終了コード / stdout

![フックとのデータのやり取り（stdin / 終了コード / stdout）](assets/hook-io-flow.svg)

| 終了コード | 意味 | AI エージェントの挙動 |
| :---: | :--- | :--- |
| **`0`** | **成功・許可** | そのまま処理を続行（または `stdout` の JSON 指示に従う） |
| **`2`** | **強制ブロック** | **操作を即座に中止**し、`stderr`（エラー出力）の理由を AI に伝えて別案を促す |
| **`1` など** | スクリプトの不具合 | 警告を表示するだけで、**処理は止まらず続行される**（ブロックには使えない） |

> ⚠️ **最大の注意点**：AI を止めたいときは必ず **`process.exit(2)`**（シェルスクリプトなら `exit 2`）を使うか、JSON で `"decision": "block"` / `"permissionDecision": "deny"` を返してください。`exit 1` では止まりません。

---

## 5. 3つの実行タイプ — `command` / `prompt` / `http`

![3つのフック実行タイプの比較と使い分け](assets/hook-types-compare.svg)

| タイプ | 仕組み | 速度・コスト | 向いている用途 |
| :--- | :--- | :--- | :--- |
| **`command`**（基本） | ローカルのコマンド（Node.js 等）を実行 | 数十ms・無料 | ファイル保護、Prettier 整形、テスト実行（**全体の9割**） |
| **`prompt`** | 軽量な AI モデルに「条件を満たしたか」を判定させる | 数秒・少額 | `Stop` 時に「指示の抜け漏れがないか」を文章の意味で検査 |
| **`http`** | 指定 URL へ JSON を POST 送信して応答を受け取る | 通信次第 | 社内の監査ログ基盤や共通ポリシーサーバーとの連携 |

---

## 6. 5分で試せる最小ハンズオン

このフォルダのルート（`hook-guide/`）には、すぐに動く3段構えのフックが入っています。Claude Code がなくても Node.js 単体でテストできます。

```powershell
# 1. フック単体の動作確認（10種類の入力JSONを流し込んでテスト）
node .\scripts\test-hooks-locally.js

# 2. Claude Code CLI がある場合の比較実験（フックなし vs フックあり）
.\scripts\run-experiment.ps1
```

---

## 7. ハマりやすい4つの落とし穴

1. **`Stop` フックの無限ループ**：`Stop` フックで毎回ブロックすると AI が永遠に止まれなくなります。入力 JSON の **`stop_hook_active`** が `true`（すでに差し戻し後の再試行中）なら `exit 0` で通す安全弁を必ず入れてください。
2. **JSON 出力に `console.log` が混ざる**：`stdout` で JSON を返す際、デバッグ用の `console.log` が1行でも混ざると JSON の解析に失敗します。デバッグ表示は必ず `console.error(...)`（`stderr`）に出します。
3. **Windows と Mac のコマンド差**：設定ファイル内に直接長いシェルコマンドを書くと、OS ごとのクォートやコマンド差で壊れます。`node hooks/xxx.js` のように **Node.js スクリプト1本を呼び出す構成**にすると全 OS で同じように動きます。
4. **重いテストを毎回走らせる**：数分かかるテストを `PostToolUse` に入れると編集のたびに待たされます。保存直後は軽量な構文チェックだけに絞り、全体テストは完了時（`Stop`）に回します。

---

## 関連ドキュメント

- **GitHub Copilot / VS Code での使い方** → [01_copilot-hook-guide.md](file:///c:/git_home/agent-study/hook-guide/docs/01_copilot-hook-guide.md)
- **そのまま使える定番5パターン** → [02_hook-patterns.md](file:///c:/git_home/agent-study/hook-guide/docs/02_hook-patterns.md)
- **コピペ用サンプル集（5種）** → [samples/README.md](file:///c:/git_home/agent-study/hook-guide/samples/README.md)
- **一次情報の出典メモ（10件）** → [info/README.md](file:///c:/git_home/agent-study/hook-guide/info/README.md)
