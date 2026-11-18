---
applyTo: "products/industrial/customer-acme/**"
---

# ACME 社向けのルール（L3）

> `products/industrial/customer-acme/` のファイルを扱うときに使われる。L1・L2 産業用に**さらに足す**ルール。

- 通信は Modbus TCP 固定（L2 の既定と同じ。ACME 社の工場ネットワークに合わせる）。レジスタ表は `protocol-map.md`。
- ログは CSV、保存 730 日（契約書の条件。`variant.json` に書いてある）。
- 契約書（`contract/`）は編集しない。
- 通信仕様の確認はスキル `acme-protocol-check`。
