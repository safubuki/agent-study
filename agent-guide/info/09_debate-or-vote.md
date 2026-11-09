# 論文「Debate or Vote: Which Yields Better Decisions in Multi-Agent Large Language Models?」

| 項目 | 内容 |
|---|---|
| 種別 | 論文（arXiv:2508.17536、NeurIPS 2025） |
| 著者 | Hyeong Kyu Choi, Xiaojin Zhu, Yixuan Li（University of Wisconsin–Madison） |
| 公開日 | 2025-08-24（2025-10 改訂） |
| 鮮度 | **古**（約14か月前） |
| URL | https://arxiv.org/abs/2508.17536 |
| 関連 | 元祖：Du ほか「Improving Factuality and Reasoning in Language Models through Multiagent Debate」（arXiv:2305.14325、2023-05、ICML 2024）。複数の LLM が回答を出し合い議論すると、数学・事実性が上がると報告 |

## 要点

- 「複数エージェントの議論（Multi-Agent Debate）」の効果を、**多数決**の部分と**議論**の部分に分けて測った。
- 7つの NLP ベンチマークで、**議論で得られるとされた改善のほとんどは、単なる多数決で説明できた**。多くの場合、議論なしの多数決が議論ありとほぼ同じ性能。
- 理論的にも、議論だけでは正答の期待値は上がらない（信念の更新がマルチンゲールになる）と示す。訂正方向に偏らせる工夫を入れれば議論が効く余地はある。
- 結論：単純なアンサンブル（多数決）が強く、実用上はそちらが信頼できる場面が多い。

## 注意点

- 「レビュー役を置く」ことの否定ではない。**同格の AI 同士を議論させること**の効果が、思われていたほど大きくない、という話。
- 元祖の Du ほか（2023）も、議論が誤答に収束することや、コストが高いことを限界として挙げている。
