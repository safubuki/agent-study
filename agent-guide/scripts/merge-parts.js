#!/usr/bin/env node
// Web ページの部品（body.html / style.css / script.js）を1つの HTML ファイルに統合する。
//
// 使い方:
//   node scripts/merge-parts.js --title "ページのタイトル" [--lang ja] [--dir work] [--out <dir>/output/index.html]
//
// パスはすべてカレントディレクトリからの相対パスとして扱う。
// 外部パッケージは使わず、Node.js 標準モジュールだけで動く。

'use strict';

const fs = require('fs');
const path = require('path');

const USAGE =
  '使い方: node scripts/merge-parts.js --title "ページのタイトル" [--lang ja] [--dir work] [--out <dir>/output/index.html]';

const KNOWN_OPTIONS = ['title', 'lang', 'dir', 'out'];

// エラーを表示して終了コード 1 で終わる
function fail(messages) {
  for (const m of [].concat(messages)) console.error(`エラー: ${m}`);
  console.error(USAGE);
  process.exit(1);
}

// --key value と --key=value の両方を受け付ける
function parseArgs(argv) {
  const opts = {};
  const errors = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      errors.push(`不明な引数です: ${arg}`);
      continue;
    }
    let key = arg.slice(2);
    let value;
    const eq = key.indexOf('=');
    if (eq !== -1) {
      value = key.slice(eq + 1);
      key = key.slice(0, eq);
    } else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
      value = argv[++i];
    }
    if (!KNOWN_OPTIONS.includes(key)) {
      errors.push(`不明なオプションです: --${key}`);
      continue;
    }
    if (value === undefined) {
      errors.push(`--${key} に値が指定されていません`);
      continue;
    }
    opts[key] = value;
  }
  return { opts, errors };
}

// <title> と lang 属性に入れる文字列のエスケープ
function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 文字数（サロゲートペアも1文字として数える）
function charCount(s) {
  return [...s].length;
}

function main() {
  const { opts, errors } = parseArgs(process.argv.slice(2));

  if (opts.title === undefined || opts.title.trim() === '') {
    errors.push('--title が指定されていません（必須）');
  }

  const dir = opts.dir ?? 'work';
  const lang = opts.lang ?? 'ja';
  const partsDir = path.resolve(process.cwd(), dir, 'parts');
  const outPath = path.resolve(process.cwd(), opts.out ?? path.join(dir, 'output', 'index.html'));

  // 部品を読む（足りないものはまとめて報告する）
  const partNames = ['body.html', 'style.css', 'script.js'];
  const parts = {};
  for (const name of partNames) {
    const p = path.join(partsDir, name);
    if (!fs.existsSync(p) || !fs.statSync(p).isFile()) {
      errors.push(`部品が見つかりません: ${path.relative(process.cwd(), p) || p}`);
      continue;
    }
    parts[name] = fs.readFileSync(p, 'utf8');
  }

  if (errors.length > 0) fail(errors);

  const body = parts['body.html'];
  const css = parts['style.css'];
  const js = parts['script.js'];

  // 警告（処理は続ける）
  const warnings = [];
  const tagRe = /<(html|head|body|style|script)\b/gi;
  const foundTags = new Set();
  for (const m of body.matchAll(tagRe)) foundTags.add(`<${m[1].toLowerCase()}`);
  if (foundTags.size > 0) {
    warnings.push(
      `body.html に ${[...foundTags].join(' ')} タグが含まれています。body.html には <body> の中身だけを書いてください。`
    );
  }
  if (/<\/style\b/i.test(css)) {
    warnings.push('style.css に </style が含まれています。出力 HTML の <style> がそこで途切れます。');
  }
  if (/<\/script\b/i.test(js)) {
    warnings.push('script.js に </script が含まれています。出力 HTML の <script> がそこで途切れます。');
  }
  for (const w of warnings) console.warn(`警告: ${w}`);

  // 組み立て（部品の中身は加工せずにそのまま連結する。String.replace は $ を解釈するので使わない）
  const html =
    '<!doctype html>\n' +
    `<html lang="${escapeHtml(lang)}">\n` +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    `<title>${escapeHtml(opts.title)}</title>\n` +
    '<style>\n' +
    css +
    '\n</style>\n' +
    '</head>\n' +
    '<body>\n' +
    body +
    '\n<script>\n' +
    js +
    '\n</script>\n' +
    '</body>\n' +
    '</html>\n';

  try {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html, 'utf8');
  } catch (e) {
    console.error(`エラー: 書き出しに失敗しました: ${outPath}\n${e.message}`);
    process.exit(1);
  }

  const rel = (p) => path.relative(process.cwd(), p) || p;
  console.log(`書き出しました: ${rel(outPath)}`);
  console.log(`  body.html : ${charCount(body)} 文字`);
  console.log(`  style.css : ${charCount(css)} 文字`);
  console.log(`  script.js : ${charCount(js)} 文字`);
  console.log(`  出力      : ${charCount(html)} 文字`);
  process.exit(0);
}

main();
