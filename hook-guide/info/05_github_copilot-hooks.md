# GitHub Docs「Hooks in GitHub Copilot (.github/hooks)」

| 項目 | 内容 |
|---|---|
| 発行元 | GitHub（docs.github.com 公式ドキュメント） |
| 取得日 | 2026-11-10 |
| 鮮度 | **新**（取得当日の内容） |
| URL | https://docs.github.com/en/copilot/customizing-copilot/about-hooks |

## 要点

- GitHub Copilot（Copilot CLI および Copilot Coding Agent）にも、AI エージェントのライフサイクルに合わせてシェルコマンドを確定実行する **Agent Hooks** 機能がある。
- **設定ファイルの置き場所**：
  - リポジトリの `.github/hooks/*.json`（例：`.github/hooks/hooks.json`）。
  - 構成は `"version": 1` と `"hooks": { ... }`。
- **主なイベント名**（キャメルケース）：
  - `sessionStart`：セッション開始時
  - `userPromptSubmitted`：プロンプト送信時
  - `preToolUse`：ツール実行直前（承認・拒否・検査が可能）
  - `postToolUse`：ツール実行直後（自動整形・監査ログ記録など）
  - `agentStop` / `subagentStop`：エージェント停止時
- **OS ごとのコマンド指定**：
  - 1つのフック定義の中に `"bash": "..."`（Linux/macOS 用）と `"powershell": "..."`（Windows 用）を並べて書けるため、チーム内で OS が混在していても同じ設定ファイルを共有しやすい。
- **入力と出力**：
  - Claude Code と同様、標準入力（`stdin`）でツール名や引数を含む JSON を受け取り、終了コードや標準出力の JSON で許可・拒否を返す。

## 原文引用（短く）

> "Unlike custom instructions which guide the model's behavior, hooks provide deterministic automation that runs every time a specified lifecycle event occurs."

## 注意点

- クラウド上で動く Copilot Coding Agent で `.github/hooks/` を効かせるには、設定ファイルがリポジトリの**デフォルトブランチ**に入っている必要がある。
- イベント名が Claude Code では先頭大文字（`PreToolUse`）、Copilot の `.github/hooks/*.json` では先頭小文字（`preToolUse`）と表記が分かれる場面がある（詳細は [docs/01](../docs/01_copilot-hook-guide.md) で整理）。
