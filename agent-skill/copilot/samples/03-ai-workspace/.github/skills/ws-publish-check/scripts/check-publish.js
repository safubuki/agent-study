#!/usr/bin/env node
// 公開前チェック（L1 スキルの定型部分）。社外秘の印・メールアドレス・電話番号らしき文字列・出典の有無を調べる。
// 使い方: node check-publish.js <file>   終了コード: 0 = OK、1 = NG あり、2 = 使い方の誤り
'use strict';
const fs = require('node:fs');
const file = process.argv[2];
if (!file || !fs.existsSync(file)) { console.error('使い方: node check-publish.js <文書のパス>'); process.exit(2); }
const text = fs.readFileSync(file, 'utf8');
const checks = [
  ['社外秘の印が無い', !/社外秘|confidential/i.test(text)],
  ['メールアドレスらしき文字列が無い', !/[\w.+-]+@[\w-]+\.[\w.]+/.test(text)],
  ['電話番号らしき文字列が無い', !/0\d{1,4}-\d{1,4}-\d{3,4}/.test(text)],
  ['出典が書かれている', /出典|source/i.test(text)],
];
console.log('| 結果 | 確認項目 |\n|---|---|');
checks.forEach(([label, ok]) => console.log(`| ${ok ? 'OK' : 'NG'} | ${label} |`));
process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
