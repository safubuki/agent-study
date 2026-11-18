---
name: case-context
description: 案件（L4）の作業を始めるときに、案件番号のルール（CASE.md）・期限・対象の部品・上書きする値を読み込み、L1・部品の値と重ねて確かめる。人が「/case-context C-2026-031」のように案件番号を付けて呼ぶ。
disable-model-invocation: true
argument-hint: "<案件番号>（例：C-2026-031）"
metadata:
  layer: L4
  scope: "cases/**"
---

# 案件の読み込み（L4 の入口・人が呼ぶ）

案件のルールは**ファイルの場所では決まらない**（同じ部品を複数の案件が触るため）。そこで、作業を始める人がこのスキルを呼んで読み込む。

1. 案件番号のルールを読む：`cases/<案件番号>/CASE.md`
2. 値と期限を決まった手順で確かめる（中身は読まずに実行する）：

   ```bash
   node .github/skills/case-context/scripts/resolve-case.js --root . --case <案件番号>
   ```

3. `NG`（期限切れ・案件で変えてはいけない値）があれば、作業を始めずに人に伝える。
4. `OK` なら、この会話の間は「案件で上書きされた値」を使う。値の出どころ（どの階層で決まったか）を成果物に書く。
