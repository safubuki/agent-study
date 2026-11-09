# Claude Code Docs「Automate workflows with hooks (Hooks guide)」

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic（code.claude.com 公式ドキュメント） |
| 取得日 | 2026-11-10 |
| 鮮度 | **新**（取得当日の内容） |
| URL | https://code.claude.com/docs/en/hooks-guide |

## 要点

- プロンプト（`CLAUDE.md` など）に書いたルールは「助言（advisory）」であり、AI が忘れたり判断で飛ばしたりすることがある。**毎回100%確実に動かしたい処理はフックにする**。
- 公式ガイドで紹介されている代表的な4つの活用パターン：
  1. **通知（Notification）**：AI が入力待ちになったり作業を終えたりしたときに、OS の通知コマンド（macOS の `osascript`、Linux の `notify-send`、Windows の PowerShell トースト通知など）を鳴らす。
  2. **ファイル編集後の自動フォーマット（PostToolUse）**：`Edit|Write` をマッチャーにし、編集されたファイルに対して Prettier や `gofmt` などを自動実行する。AI に「整形コマンドを実行して」と頼むより確実で、トークンも消費しない。
  3. **保護ファイルへの書き込みブロック（PreToolUse）**：`.env`、`package-lock.json`、`.git/` などの編集を検知したら終了コード `2` で拒否し、なぜダメかを `stderr` で AI に伝える。
  4. **文脈の再注入・完了確認（SessionStart / Stop）**：コンパクション後やセッション開始時に大事なプロジェクト規約を再注入したり、完了前にテストが通っているか確認したりする。
- **マッチャー（`matcher`）の書き方**：
  - `PreToolUse` や `PostToolUse` では、対象ツール名を正規表現で指定できる（例：`"Bash"`、`"Edit|Write"`、`"mcp__.*"`）。省略または `"*"` なら全ツールが対象。

## 原文引用（短く）

> "Hooks provide deterministic control over Claude Code's behavior, ensuring certain actions always happen rather than relying on the LLM to choose to run them."

## 注意点

- シェルスクリプト内で JSON を扱う際、Linux/macOS では `jq` がよく使われるが、Windows を含むクロスプラットフォーム環境では `node` や `python` の標準機能で `stdin` を読むスクリプトにする方が環境差で転びにくい。
