---
name: elec-schematic-review
description: 電気設計部の回路図レビュー。部品番号・定格・ディレーティング率の表、配線の保護、リリース済みの版を直していないかを確認する。どの部品でも electrical/ の回路図のレビューを頼まれたときに使う。ソフトウェアや機構図面には使わない。
metadata:
  layer: L2
  scope: "parts/*/electrical/**"
---

# 回路図レビュー（L2・電気設計部）

観点：①表に部品番号・定格・使用値・ディレーティング率がそろっているか ②入力電圧などの値を part.json（案件中は case.json）から引いているか ③released/ を直していないか。
