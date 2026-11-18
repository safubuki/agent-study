---
applyTo: "parts/motor-driver/software/**"
---

# 駆動制御係のルール（L3・ソフト開発部 × モータドライバ の交わり）

> モータドライバのソフトウェアを扱うときだけ使われる。

- 制御周期は 1 ms。PID の係数を変えたら、ステップ応答の試験結果を `software/control/test-log.md` に残す。
- `.hex`・`.bin` を作らない（L3 のポリシーでも止まる）。
