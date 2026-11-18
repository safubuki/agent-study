#!/usr/bin/env node
/**
 * 出荷前チェック（release-check スキルの定型部分）。Node.js 標準モジュールのみ。
 * 判断（出荷してよいか）はせず、決まった確認だけを行って OK / NG を固定形式で出力する。
 *
 * 使い方: node check-release.js --root <製品リポジトリのルート>
 * 終了コード: 0 = すべて OK、1 = NG あり、2 = 使い方の誤り
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function parseArgs(argv) {
  const args = { root: process.cwd() };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') args.root = argv[++i];
    else if (argv[i] === '--help' || argv[i] === '-h') args.help = true;
    else { args.error = `不明な引数です: ${argv[i]}`; }
  }
  return args;
}

function readText(root, rel) {
  try { return fs.readFileSync(path.join(root, rel), 'utf8'); } catch { return null; }
}

function check(root) {
  const results = [];
  const add = (ok, item, detail) => results.push({ ok, item, detail });

  const pkgText = readText(root, 'app/package.json');
  const appVersion = pkgText ? JSON.parse(pkgText).version : null;
  const header = readText(root, 'firmware/version.h') || '';
  const fwMatch = header.match(/#define\s+FW_VERSION\s+"([^"]+)"/);
  const fwVersion = fwMatch ? fwMatch[1] : null;
  add(Boolean(appVersion), 'app/package.json の version', appVersion ?? '見つからない');
  add(Boolean(fwVersion), 'firmware/version.h の FW_VERSION', fwVersion ?? '見つからない');
  add(appVersion && appVersion === fwVersion, 'アプリとファームのバージョン一致', `${appVersion} / ${fwVersion}`);

  const changelog = readText(root, 'CHANGELOG.md') || '';
  add(Boolean(appVersion) && changelog.includes(`## ${appVersion}`), '変更履歴に今回のバージョンの節がある', `## ${appVersion}`);

  const calText = readText(root, 'firmware/calibration/motor-params.json');
  let cal = null;
  try { cal = calText ? JSON.parse(calText) : null; } catch { cal = null; }
  const required = ['max_current_ma', 'period_us', 'reviewed_by'];
  const missing = cal ? required.filter((k) => !(k in cal)) : required;
  add(missing.length === 0, '校正値ファイルの必須項目', missing.length ? `不足: ${missing.join(', ')}` : 'すべてあり');
  add(Boolean(cal && cal.reviewed_by), '校正値のレビュー者が記録されている', cal?.reviewed_by || '未記録');
  return results;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('使い方: node check-release.js --root <製品リポジトリのルート>');
    return 0;
  }
  if (args.error) {
    console.error(args.error);
    return 2;
  }
  const root = path.resolve(args.root);
  const results = check(root);
  console.log('| 結果 | 確認項目 | 内容 |');
  console.log('|---|---|---|');
  for (const r of results) console.log(`| ${r.ok ? 'OK' : 'NG'} | ${r.item} | ${r.detail} |`);
  const ng = results.filter((r) => !r.ok).length;
  console.log(`\n合計 ${results.length} 項目中 NG ${ng} 件`);
  return ng === 0 ? 0 : 1;
}

process.exitCode = main();
