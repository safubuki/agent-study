Web ページの部品（HTML・CSS・JS）を1つの HTML ファイルに統合する Node.js スクリプトを作ってください。

## 保存先

`scripts/merge-parts.js`（1ファイル。外部パッケージは使わず、Node.js 標準モジュールだけで書く）

## 使い方

```text
node scripts/merge-parts.js --title "ページのタイトル" [--lang ja] [--dir work] [--out <dir>/output/index.html]
```

| 引数 | 既定値 | 意味 |
|---|---|---|
| `--title` | （必須） | `<title>` に入れる文字列 |
| `--lang` | `ja` | `<html lang="…">` |
| `--dir` | `work` | 部品が入っているフォルダ。`<dir>/parts/` の下を読む |
| `--out` | `<dir>/output/index.html` | 書き出し先。フォルダがなければ作る |

パスはカレントディレクトリからの相対パスとして扱う。

## 入力と出力

- 入力：`<dir>/parts/body.html`（`<body>` の中身だけ）、`<dir>/parts/style.css`、`<dir>/parts/script.js`
- 出力：次の形の HTML（UTF-8）
  - `<!doctype html>`、`<html lang>`、`<meta charset="utf-8">`、`<meta name="viewport" content="width=device-width, initial-scale=1">`、`<title>`
  - `<head>` の中に `<style>` として style.css の中身
  - `<body>` の中に body.html の中身、その直後に `<script>` として script.js の中身
- 部品の中身は1文字も変えずに埋め込む（整形・圧縮しない）

## エラー処理と表示

- 3つの部品のどれかが無い、または `--title` が無いときは、何が足りないかを表示して終了コード 1 で終わる
- body.html に `<html` `<head` `<body` `<style` `<script` のタグが含まれていたら、警告を表示する（処理は続ける）
- 成功したら、書き出したパスと、各部品と出力の文字数を表示して終了コード 0 で終わる

## 動作確認

作ったら、Bash ツールで実際に動かして確認してください。

- テスト用の部品は `tmp-merge-test/parts/` に作り、`node scripts/merge-parts.js --title "テスト" --dir tmp-merge-test` で確かめる
- 部品が足りない場合にエラーになることも確かめる
- 確認が終わったら、テスト用のファイルは残したままでよい
