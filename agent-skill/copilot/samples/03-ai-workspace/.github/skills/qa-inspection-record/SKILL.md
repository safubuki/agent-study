---
name: qa-inspection-record
description: 検査係の検査記録（1 ロット 1 ファイル、lot-番号.md）を作る。検査項目・測定値・合否・検査者を表にする。「検査記録」「ロットの検査結果をまとめて」と頼まれたときに使う。
metadata:
  layer: L3
  scope: "departments/qa/inspection/**"
---

# 検査記録（L3・検査係）

1. ファイル名は `departments/qa/inspection/lot-<番号>.md`。Markdown だけで作る（Excel は作らない）。
2. 表の列は「検査項目・規格値・測定値・合否」。規格値は `departments/qa/standards/` から章番号つきで引用する。
3. 署名済みの記録（`signed/`）は直さない。訂正は新しいファイルに「訂正記録」として書く。
