# VS Code Docs「Agent hooks in Visual Studio Code」

| 項目 | 内容 |
|---|---|
| 発行元 | Microsoft（code.visualstudio.com 公式ドキュメント） |
| 取得日 | 2026-11-10 |
| 鮮度 | ** **取得当日の内容） |
| URL | https://code.visualstudio.com/docs/copilot/customization/hooks |

## 要点

- VS Code のチャット（エージェントモード）でも、エージェントの動作前後にスクリプトを挟む **Agent Hooks** がサポートされている。
- **サポートされる主なイベント（Core 8** 
  - `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PreCompact`, `SubagentStart`, `SubagentStop`, `Stop`
- **Claude Code 設定との互換・相互運用**：
  - VS Code は `.github/hooks/*.json` や VS Code の設定（`.vscode/settings.json`）だけでなく、ワークスペース内の `.claude/settings.json` に定義されたフックを読み取って動かせる互換レイヤーを備えている（ただし一部の固有フィールドや挙動には差がある）。
- **既存の VS Code 機能との住み分け**：
  - 「人間がファイルを保存したとき」の整形なら VS Code 標準の `editor.formatOnSave` で十分。
  - 「AI エージェントがツールを使う瞬間だけ止めたい」「AI の完了前に検査して差し戻したい」ときに Agent Hooks を使う。

## 原文引用（短く）

> "Agent hooks let you run custom shell commands at key lifecycle points during an agent session, such as before a tool runs or when the agent finishes a turn."

## 注意点

- 企業の管理ポリシー（Enterprise policy）によって、ローカルでの自動コマンド実行やフック機能が制限・無効化されている環境がある。会社環境で動かない場合は管理設定を確認する必要がある。
