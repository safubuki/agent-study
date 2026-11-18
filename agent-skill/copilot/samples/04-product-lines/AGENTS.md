# 製品づくりリポジトリ：絶対ルール（L1・全製品に適用）

> サンプル（agent-skill/copilot/samples/04-product-lines）。1 つのリポジトリで、製品カテゴリ（家庭用・産業用）と、
> 産業用の顧客ごとの仕様（ACME 社・Borealis 社）を作り分ける想定。
> ここには「どの製品カテゴリ・どの顧客でも変えない作り方」だけを書く。

## 絶対に守る作り方（下の階層で変えてはいけない）

1. 安全停止は共通ライブラリ `common/safety/` を使う。製品・顧客ごとに書き直さない（編集もしない）。
2. 安全停止の時間（100 ms 以内）と定格電流の上限（10 A）は変えない。
3. どの変更にも試験を付ける。試験を省略する設定を作らない。
4. 型番は `X-<カテゴリ記号>-<顧客記号>-<版>`（例：`X-I-ACM-03`）。

（1・2 は `.github/policies/` と `/product-variant-check` のスクリプトで機械的にも確かめている）

## 下の階層で決めてよいこと（変えてよい点）

機械が読む正本は [.github/product-rules.json](.github/product-rules.json)。

| 変えてよい点 | L2 製品カテゴリ | L3 顧客 | 選べる値 |
|---|---|---|---|
| 通信方式 `comm.protocol` | ○（既定を決める） | ○（顧客で上書き） | `ble`・`modbus-tcp`・`modbus-rtu`・`opc-ua` |
| 画面の言語 `ui.language` | ○ | ○ | `ja`・`en` |
| ログの形式 `log.format` | ○ | ○ | `csv`・`json` |
| ログの保存日数 `log.retentionDays` | ○ | ○ | 30〜730 |
| 筐体の色 `case.color` | ○ | ○ | 自由 |

上の表に無い項目（安全停止の時間・定格電流など）は、L2・L3 では設定できない。

## 階層とファイルの対応

| 階層 | 範囲 | 指示 | 値（変えてよい点） | 強制 |
|---|---|---|---|---|
| L1 製品共通 | リポジトリ全体 | この AGENTS.md・`.github/copilot-instructions.md` | `.github/product-rules.json`（既定値と固定値） | `.github/policies/l1-product.json`、`/product-variant-check` |
| L2 製品カテゴリ | `products/<カテゴリ>/` | `.github/instructions/l2-line-*.instructions.md` | `products/<カテゴリ>/line.json` | `.github/policies/l2-*.json` |
| L3 顧客 | `products/<カテゴリ>/<顧客>/` | `.github/instructions/l3-customer-*.instructions.md` | `products/<カテゴリ>/<顧客>/variant.json` | `.github/policies/l3-*.json` |

## どのスキルを使うか（索引）

| こんなとき | スキル | 階層 |
|---|---|---|
| 仕様の組み合わせを確かめる（出荷前） | `/product-variant-check`（人が呼ぶ） | L1 |
| 家庭用の操作性レビュー | `home-ux-review` | L2 家庭用 |
| 産業用の耐環境レビュー | `industrial-env-review` | L2 産業用 |
| ACME 社の通信仕様の確認 | `acme-protocol-check` | L3 ACME 社 |
