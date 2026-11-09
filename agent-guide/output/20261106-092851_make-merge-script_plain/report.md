# 実験記録：make-merge-script（plain）

| 項目 | 値 |
|---|---|
| 方式 | plain |
| お題 | `prompts/tools/make-merge-script.md` |
| 開始 | 2026-11-06 09:28:51 |
| 終了 | 2026-11-06 09:30:30 |
| **実測時間（スクリプトのストップウォッチ）** | **99.1 秒（1 分 39 秒）** |
| Claude が報告した処理時間 duration_ms | 97.9 秒 |
| うち API 応答待ち duration_api_ms | 95.3 秒 |
| ターン数 num_turns（親のみ） | 25 |
| 出力トークン（全モデル合計） | 9084 |
| API 換算コスト total_cost_usd（目安。サブスク利用時は請求されない） | 0.4278 USD |
| 完成品 index.html | — |
| claude の終了コード | 0 |

## モデル別の使用量

| モデル | 入力トークン | 出力トークン | キャッシュ読込 | 換算コスト(USD) |
|---|---|---|---|---|
| claude-opus-5-5 | 32 | 9084 | 454695 | 0.4278 |

## AI の最終報告

`scripts/merge-parts.js` is done. It uses only Node.js built-in modules (`fs` and `path`), and I ran every case below with the Bash tool.

## Test results

| Case | Result |
|---|---|
| `--title "テスト" --dir tmp-merge-test` | Exit code 0. Wrote `tmp-merge-test/output/index.html` and printed the output path and character counts |
| No `--title` | Exit code 1, `エラー: --title が指定されていません（必須）` |
| Only `script.js` missing | Exit code 1, `部品が見つかりません: tmp-merge-test\missing\parts\script.js` |
| No `parts` folder and no `--title` | Exit code 1, lists all four missing items at once |
| `body.html` containing `<body>`, `<style>` and `<script>` | Showed the warning `body.html に <body <style <script タグが含まれています…`, kept going and exited with 0 |
| `--lang en --out tmp-merge-test/custom/out/page.html` | Created the missing folders; the output has `lang="en"` |

- **Parts embedded unchanged:** the test `body.html` included Japanese, an emoji, and `$&` / `$1` (which JavaScript's `String.replace` would normally treat as special codes). I read the output file and all of them came through exactly. I concatenate the strings instead of using `replace`, so nothing in the parts gets rewritten.
- **Character counts:** I checked the 42 characters reported for `body.html` by hand. An emoji counts as 1 character.

## Additions you didn't ask for

- **Escaped values:** `<`, `&` and similar characters in `--title` and `--lang` are escaped. For example, `A & <B>` becomes `A &amp; &lt;B&gt;`. The parts themselves are not escaped.
- **Extra warnings:** if `style.css` contains `</style` or `script.js` contains `</script`, the script warns, because the browser would end the tag at that point. Like the tag warning, it keeps going.
- **Argument forms:** both `--key value` and `--key=value` work. Unknown options or a missing value end with exit code 1.
- **Line breaks:** I add a line break before and after each part so the tags sit on their own lines. The part content itself is not changed.

## Leftover files

- **Test files:** I left `parts/`, `missing/`, `warn/`, `output/` and `custom/` in `tmp-merge-test/`. This folder is already listed in `.gitignore`.
- **`check.js`:** I also wrote `tmp-merge-test/check.js` to run all the checks at once, but it wasn't approved to run, so I tested each case by hand instead. That file was never used, so you can delete it.

## 評価メモ（ブラウザで index.html を開いて、手で記入）

| 観点 | 点数（1〜5） | メモ |
|---|---|---|
| 見た目のオシャレさ | | |
| 指定した動きがすべて動くか | | |
| スマホ幅（〜480px）で崩れないか | | |
| コンソールエラーがないか（F12） | | |
| 指示の守り具合（セクション・内容） | | |
| コードの読みやすさ | | |