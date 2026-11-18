---
applyTo: "departments/sales/overseas/**"
---

# 海外営業係のルール（L3）

> `departments/sales/overseas/` のファイルを扱うときに使われる。L1・L2 に**さらに足す**ルール。
> 営業部（L2）のルールもそのまま有効（価格表の値だけを使う、など）。

- 成果物は英語で書く（L2 の「文体の既定」をこの係で上書きする。L2 側に「係の指定があればそちらに従う」と書いてあるので矛盾しない）。
- 金額は USD と JPY を併記する。換算レートは `price-master/prices.csv` の `usd_rate` 列を使う。
- 日付は YYYY-MM-DD。
