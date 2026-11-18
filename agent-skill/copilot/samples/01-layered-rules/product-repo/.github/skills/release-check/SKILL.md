---
name: release-check
description: 製品 X の出荷前チェック。バージョン番号・変更履歴・校正値ファイルの整合をスクリプトで確認し、結果を出荷判定用の表にまとめる。
disable-model-invocation: true
argument-hint: "（引数なし）"
---

# 出荷前チェック（ベース層・手動専用）

人がチャットで `/release-check` と呼んだときだけ動く。Copilot が自動で読み込むことはない（`disable-model-invocation: true`）。

## 手順

1. 決まった確認はスクリプトで行う（中身は読まずに実行し、出力だけを使う）。リポジトリのルートで：

   ```bash
   node .github/skills/release-check/scripts/check-release.js --root .
   ```

2. 出力の `NG` 行だけを取り上げ、原因と直し方を 1 行ずつ説明する。`NG` が無ければ「確認項目はすべて OK」とだけ書く。
3. 最後に、人が判断すべき点（変更履歴の書きぶり、既知の不具合の扱い）を箇条書きで渡す。出荷可否は AI が決めない。

## 落とし穴

- `app/package.json` と `firmware/version.h` の両方にバージョンがある。片方だけ直した状態が一番多い NG。
  （このサンプルは、わざとこの NG が 1 件出る状態にしてある）
