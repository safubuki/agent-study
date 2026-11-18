---
name: ws-publish-check
description: 社外に出す文書の公開前チェック。社外秘の印・個人情報らしき文字列・出典の記載漏れをスクリプトで調べ、結果を表で返す。
disable-model-invocation: true
metadata:
  layer: L1
  scope: "**"
---

# 公開前チェック（L1・人が `/ws-publish-check` で呼ぶ）

1. 決まった検査はスクリプトで行う（中身は読まずに実行する）：

   ```bash
   node .github/skills/ws-publish-check/scripts/check-publish.js <文書のパス>
   ```

2. `NG` の行だけを取り上げ、直し方を 1 行ずつ書く。公開してよいかは人が判断する。
