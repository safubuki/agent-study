# Anthropic「Harness design for long-running apps」

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic Engineering（公式ブログ） |
| 著者 | Prithvi Rajasekaran |
| 公開日 | 2026-03-24 |
| 鮮度 | ** **約7〜8か月前） |
| URL | https://www.anthropic.com/engineering/harness-design-long-running-apps |

## 要点

- 長時間自律してアプリを作る際の「ハーネス（AI の外側を取り巻く制御・検証の仕組み）」の設計と、モデルの進化に伴う見直しについての記録。
- **自己採点の甘さと外部チェックの必要性**：
  - 作り手（Generator）自身に「自分の成果物を確認しろ」と指示しても、自分が作ったものには甘くなり見落とす。
  - 外側の仕組み（テストスクリプト、Playwright による実画面検証、または独立した評価役）で客観的に採点して差し戻す方が確実に品質が上がる。
- **ハーネスの部品は「モデルの弱点の仮定」である**：
  - モデル（Sonnet 4.5 → Opus 4.5 → Opus 4.6）が賢くなるにつれ、「文脈リセット」や「細かいスプリント分割」などの工夫は不要になり削られた。
  - 一方で **完了条件の明確化」と「客観的な動作検証（Verification）** モデルがどれだけ賢くなっても価値が落ちない。

## 原文引用（短く）

> "Every component in a harness encodes an assumption about what the model can't do on its own, and those assumptions are worth stress-testing as models improve."

## 注意点

- フック（Hooks）もハーネスの一部である。「AI が苦手な手順を細かく指示するフック」はモデルの進化で足かせになるが、「セキュリティ境界」と「機械的な合否検証」のフックは長期的に残る。
