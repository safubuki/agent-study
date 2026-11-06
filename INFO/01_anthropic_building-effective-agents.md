# Anthropic「Building effective agents」

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic Engineering（公式ブログ） |
| 著者 | Erik Schluntz, Barry Zhang |
| 公開日 | 2024-12-19（ページ上に「当時のツール類は変わった」旨の注記あり） |
| 鮮度 | **古**（約23か月前）。ただし業界で最も引用されるパターン整理の原典 |
| URL | https://www.anthropic.com/engineering/building-effective-agents |

## 要点

- **ワークフロー**（決められたコード経路で LLM を組み合わせる）と**エージェント**（LLM が自分で手順とツールを決める）を区別。
- パターン一覧と「いつ使うか」：
  | パターン | いつ使うか（原文の要旨） |
  |---|---|
  | プロンプトチェーン | 固定のサブタスクにきれいに分解できるとき |
  | ルーティング | 別々に扱った方がよい明確なカテゴリがあるとき（例：問い合わせの振り分け、易しい質問は小さいモデルへ） |
  | 並列化（分割／投票） | 速度のために並列化できるとき／高い確信のために複数の視点・試行が要るとき |
  | オーケストレーター・ワーカー | **必要なサブタスクを事前に予測できない**とき（例：複数ファイルを変更するコーディング、複数情報源の調査） |
  | 評価者・最適化者（evaluator-optimizer） | 評価基準が明確で、反復改善に測れる価値があるとき |
  | 自律エージェント | 必要な手順数を予測できない、開かれた問題 |
- 基本姿勢：**いちばん単純な解から始め、必要なときだけ複雑にする**。多くの用途では、検索と例示つきの単発 LLM 呼び出しで十分。
- フレームワークは便利だが、裏のプロンプトや応答を隠してデバッグを難しくすることがある。

## 原文引用（短く）

> "finding the simplest solution possible, and only increasing complexity when needed"

> Orchestrator-workers: "well-suited for complex tasks where you can't predict the subtasks needed"

> Evaluator-optimizer: "particularly effective when we have clear evaluation criteria, and when iterative refinement provides measurable value"

## 注意点

- 2024年末のモデル（Claude 3.5 Sonnet 世代）を前提にしている。パターンの名前と考え方は今も共通語だが、「どこまでを LLM に任せてよいか」の線引きは今のモデルでは大きく後ろにずれている（[15](15_anthropic_harness-design.md)、[21](21_claude-code_docs.md) 参照）。
