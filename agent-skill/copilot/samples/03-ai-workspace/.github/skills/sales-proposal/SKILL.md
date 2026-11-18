---
name: sales-proposal
description: 営業部の提案書の骨子を作る（課題・提案・価格・導入スケジュール）。価格は価格表の値だけを使う。営業の「提案書」「見積もりの説明資料」を頼まれたときに使う。品質保証や検査の文書には使わない。
metadata:
  layer: L2
  scope: "departments/sales/**"
---

# 提案書（L2・営業部）

1. 見出しは「課題・提案・価格・導入スケジュール」の 4 つ。
2. 価格は `departments/sales/price-master/prices.csv` から引用し、行の品番を添える。表に無いものは「要見積」と書く。
3. 言語・文体は作業中のフォルダの指示に従う（海外営業係なら英語・USD 併記）。
