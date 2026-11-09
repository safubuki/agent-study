# Anthropic「Building effective agents」

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic Engineering（公式ブログ） |
| 著者 | Erik Schluntz, Barry Zhang |
| 公開日 | 2024-12-19 |
| 鮮度 | **古**（約23か月前）。ただしエージェント設計の共通語を作った原典 |
| URL | https://www.anthropic.com/engineering/building-effective-agents |

## 要点

- **ワークフロー（Workflows）**と**エージェント（Agents）**の明確な区別：
  - **ワークフロー**：あらかじめ人間が決めたコード経路（決定論的な流れ）に沿って LLM やツールを動かす仕組み。
  - **エージェント**：LLM 自身がどのツールをどの順番で使うかを動的に決める仕組み。
- フック（Hooks）は、自律的に動く「エージェント」の節目に、確実な「ワークフロー（コードによる検査・自動処理）」を埋め込む技術と位置づけられる。
- **評価者・最適化者（Evaluator-optimizer）パターン**：
  - 評価基準が明確なとき、作り手の出力をチェックして差し戻すループが有効。このチェック部分がプログラム（テストや構文検査）で書けるなら、LLM の評価者を使わずに `Stop` フックや `PostToolUse` フックで高速・安価に回せる。

## 原文引用（短く）

> "Workflows are systems where LLMs and tools are orchestrated through predefined code paths. Agents, on the other hand, are systems where LLMs dynamically direct their own processes and tool usage."

## 注意点

- 当時はまだ Claude Code の Hooks 機能が登場する前の記事だが、「予測可能で確実性が必要な部分はコード（predefined code paths）に任せ、柔軟な判断だけを LLM に任せる」という原則は現在のフック設計の基礎になっている。
