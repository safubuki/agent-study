---
name: power-derating-check
description: 電源係の部品選定チェック。電源ユニットの回路図の各部品が、入力電圧に対して定格の 70% 以下で使われているかを確かめる。電源ユニットの「部品選定」「ディレーティング」「耐圧」の確認を頼まれたときに使う。
metadata:
  layer: L3
  scope: "parts/power-unit/electrical/**"
---

# ディレーティング確認（L3・電源係）

1. 入力電圧は `parts/power-unit/part.json` から読む。案件中（`/case-context` 済み）なら案件の値（例：48 V）を使う。
2. 回路図の表の各部品で「使用値 ÷ 定格」が 70% 以下かを確かめ、超える部品を「部品番号・定格・使用値・率」で挙げる。
