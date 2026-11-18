---
name: release-check
description: 製品 X の出荷前チェック。バージョン番号・変更履歴・校正値ファイルの整合をスクリプトで確認し、結果を出荷判定用の表にまとめる。
disable-model-invocation: true
allowed-tools: Bash(node *)
---

# 出荷前チェック（ベース層・手動専用）

人が `/release-check` で呼んだときだけ動く。AI が自動で呼ぶことはない（`disable-model-invocation: true`）。
副作用（出荷判定）があるので、タイミングは人が決める。

## 手順

1. 決まった確認はスクリプトで行う（中身は読まずに実行し、出力だけを使う）：

   ```bash
   node "${CLAUDE_SKILL_DIR}/scripts/check-release.js" --root "${CLAUDE_PROJECT_DIR}"
   ```

2. 出力の `NG` 行だけを取り上げ、原因と直し方を 1 行ずつ説明する。`NG` が無ければ「確認項目はすべて OK」とだけ書く。
3. 最後に、人が判断すべき点（変更履歴の書きぶり、既知の不具合の扱い）を箇条書きで渡す。出荷可否は AI が決めない。

## 落とし穴

- `app/package.json` と `firmware/version.h` の両方にバージョンがある。片方だけ直した状態が一番多い NG。
  （このサンプルは、わざとこの NG が 1 件出る状態にしてある）
