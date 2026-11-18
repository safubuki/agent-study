---
name: industrial-env-review
description: 産業用製品（products/industrial/）の耐環境レビュー。耐ノイズ・ウォッチドッグ・ログ保存・通信の切断時の動作を確認する。産業用の「耐環境」「ノイズ対策」のレビューを頼まれたときに使う。家庭用製品には使わない。
metadata:
  layer: L2
  scope: "products/industrial/**"
---

# 産業用の耐環境レビュー（L2）

観点：①通信線のシールドとウォッチドッグ ②通信が切れたときに安全側へ倒れるか（停止は common/safety を使う） ③ログの保存日数が顧客の条件どおりか（`variant.json`）。
