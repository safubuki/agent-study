---
applyTo: "products/home/**"
---

# 家庭用製品のルール（L2）

> `products/home/` のファイルを扱うときに使われる。L1（AGENTS.md）に足すルール。

- 子どもの誤操作を防ぐ：電源以外の操作は長押し 2 秒。
- 待機電力は 0.5 W 以下を目標に設計する。
- 既定値は `products/home/line.json`（通信は BLE、画面は日本語）。顧客ごとの指定があればそちらに従う。
- 操作性の確認はスキル `home-ux-review`。
