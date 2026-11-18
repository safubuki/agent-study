---
name: acme-protocol-check
description: ACME 社向け（products/industrial/customer-acme/）の Modbus TCP 通信仕様を、レジスタ表 protocol-map.md と照らして確認する。ACME 社の「通信仕様」「レジスタ」の確認を頼まれたときに使う。ACME 社以外の顧客には使わない。
metadata:
  layer: L3
  scope: "products/industrial/customer-acme/**"
---

# ACME 社の通信仕様の確認（L3）

1. `products/industrial/customer-acme/protocol-map.md` のアドレス・単位と、コードのレジスタ定義が一致するか確かめる。
2. 契約条件（`contract/terms.md`）は読むだけで、編集しない。
