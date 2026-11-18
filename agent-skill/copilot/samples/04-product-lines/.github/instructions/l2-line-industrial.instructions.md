---
applyTo: "products/industrial/**"
---

# 産業用製品のルール（L2）

> `products/industrial/` のファイルを扱うときに使われる。L1 に足すルール。

- 耐ノイズ設計（通信線のシールド、ウォッチドッグの有効化）を前提に書く。
- ログは既定で 365 日保存（`products/industrial/line.json`）。**顧客（L3）の指定があればそちらに従う**。
- 通信の既定は Modbus TCP。**顧客（L3）の指定があればそちらに従う**。
- 認証取得済みの書類（`certification/`）は編集しない。
- 耐環境の確認はスキル `industrial-env-review`。
