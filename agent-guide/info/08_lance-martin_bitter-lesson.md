# Lance Martin「Learning the Bitter Lesson」

| 項目 | 内容 |
|---|---|
| 種別 | 著名エンジニアの個人ブログ（著者は当時 LangChain 所属、Open Deep Research の作者。業界で広く共有された記事） |
| 公開日 | 2025-07-30 |
| 鮮度 | **古**（約15か月前）。ただし主張は「モデルの進化に合わせて構造を外せ」なので、時間がたつほど当てはまる種類の話 |
| URL | https://rlancemartin.github.io/2025/07/30/bitter_lesson/ |

## 要点

- Richard Sutton の「苦い教訓（The Bitter Lesson）」＝**計算量で伸びる汎用的な方法が、人間の知識を手で組み込んだ方法に最後は勝つ**、を AI アプリ開発に当てはめる。
- Hyung Won Chung（OpenAI）の言葉：**今の計算量に必要な構造は足せ。ただし後で外せ。その近道は将来の伸びを妨げるから。**
- 実例（Open Deep Research の作り直し）：
  1. 2024年末：親が章立てを決め、並列の子が各章を調べて**書き**、結合するワークフロー。当時ツール呼び出しが不安定だったので避けた → ツール呼び出しが上達すると、これが足かせになった。
  2. マルチエージェント版 v1：子が柔軟に調べられるようにしたが、**各章を子が並列に書く**部分を残したため、レポートがバラバラに。「足した構造を外し切れていないことが多い」。
  3. 最終版：**調べるのは複数の子、書くのは最後に1回**。Deep Research Bench で 43.5（上位10位以内）。
- 推奨：(1) 自分のアプリの構造と、そこに埋め込まれた「モデルはこれが苦手」という前提を把握する、(2) モデルが良くなるたびに構造を見直す、(3) **構造を外しやすく作る**。

## 原文引用（短く）

> "Add structures needed for the given level of compute and data available."
> "Remove them later, because these shortcuts will bottleneck further improvement."

> "we often fail to remove all the structure we add as we update our methods"

## 注意点

- 個人ブログだが、LangChain 公式の Open Deep Research の設計変更の一次記録でもある。
