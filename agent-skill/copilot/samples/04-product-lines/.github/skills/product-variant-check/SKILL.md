---
name: product-variant-check
description: 製品カテゴリ（L2）と顧客（L3）の設定が「変えてよい点」だけを変えているか、固定値を変えていないかをスクリプトで確かめ、各値がどの階層で決まったかを表で示す。
disable-model-invocation: true
metadata:
  layer: L1
  scope: "**"
---

# 仕様の組み合わせチェック（L1・人が `/product-variant-check` で呼ぶ）

1. 決まった確認はスクリプトで行う（中身は読まずに実行する）。リポジトリのルートで：

   ```bash
   node .github/skills/product-variant-check/scripts/check-variants.js --root .
   ```

2. 出力の表で、各製品の値が L1（既定）・L2（カテゴリ）・L3（顧客）のどこで決まったかを確認する。
3. `NG` があれば、どの階層のファイルで何を直すかを 1 行ずつ書く。固定値（安全停止など）を変える提案はしない。
