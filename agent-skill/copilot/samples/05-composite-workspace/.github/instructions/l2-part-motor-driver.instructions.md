---
applyTo: "parts/motor-driver/**"
---

# モータドライバのルール（L2・部品軸）

> モータドライバのどのドメインのファイルでも使われる。

- 仕様値は `parts/motor-driver/part.json`（最大回転数など）。最大回転数は部品だけが決め、案件では変えない。
- 通信は既定 Modbus TCP。案件で上書きされていればそちらに従う。
