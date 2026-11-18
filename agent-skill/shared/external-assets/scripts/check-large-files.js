#!/usr/bin/env node
/**
 * 大きなファイル・バイナリ形式のファイルがリポジトリに入ろうとしていないかを調べる関所。
 * Node.js 標準モジュールのみ。pre-commit・GitHub Actions（CI）・AI のフックのどこからでも使える。
 *
 * 使い方:
 *   node check-large-files.js --staged                 # git でステージ済みのファイルを調べる（pre-commit 用）
 *   node check-large-files.js --tracked                # git で管理中の全ファイルを調べる（CI 用）
 *   node check-large-files.js <ファイルやフォルダ> ...  # 指定したものを調べる
 *   オプション: --max-mb 5（既定 5 MiB）、--allow <拡張子,...>
 *
 * 既定の判定：サイズが --max-mb を超える、または 3D CAD・動画・画像編集データなどの拡張子。
 *   GitHub は 50 MiB で警告、100 MiB で拒否するが、それよりずっと手前で止める（履歴に入ると消しにくいため）。
 * 終了コード：0 = 問題なし、1 = 見つかった、2 = 使い方の誤り
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const BLOCKED_EXT = new Set([
  '.step', '.stp', '.iges', '.igs', '.sldprt', '.sldasm', '.slddrw', '.x_t', '.x_b', '.3dm', '.stl', '.catpart', '.ipt', '.iam',
  '.mp4', '.mov', '.avi', '.mkv', '.wmv',
  '.psd', '.ai', '.tif', '.tiff', '.raw',
  '.zip', '.7z', '.iso',
]);

function parseArgs(argv) {
  const a = { maxMb: 5, paths: [], allow: new Set() };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--staged') a.staged = true;
    else if (v === '--tracked') a.tracked = true;
    else if (v === '--max-mb') a.maxMb = Number(argv[++i]);
    else if (v === '--allow') String(argv[++i] || '').split(',').filter(Boolean).forEach((x) => a.allow.add(x.startsWith('.') ? x.toLowerCase() : `.${x.toLowerCase()}`));
    else if (v === '--help' || v === '-h') a.help = true;
    else if (v.startsWith('--')) a.error = `不明なオプションです: ${v}`;
    else a.paths.push(v);
  }
  if (!Number.isFinite(a.maxMb) || a.maxMb <= 0) a.error = '--max-mb には正の数を指定してください';
  if (!a.help && !a.error && !a.staged && !a.tracked && !a.paths.length) a.error = '--staged・--tracked・または調べるパスを指定してください';
  return a;
}

function gitList(args) {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error((r.stderr || 'git の実行に失敗しました').trim());
  return r.stdout.split(/\r?\n/).filter(Boolean);
}

function walk(p, out) {
  if (!fs.existsSync(p)) return;
  const st = fs.statSync(p);
  if (st.isFile()) { out.push(p); return; }
  for (const e of fs.readdirSync(p, { withFileTypes: true })) {
    if (e.name === '.git' || e.name === 'node_modules') continue;
    walk(path.join(p, e.name), out);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('使い方: node check-large-files.js (--staged | --tracked | <paths...>) [--max-mb 5] [--allow ext,...]');
    return 0;
  }
  if (args.error) { console.error(args.error); return 2; }
  let files = [];
  try {
    if (args.staged) files = gitList(['diff', '--cached', '--name-only', '--diff-filter=AM']);
    else if (args.tracked) files = gitList(['ls-files']);
    else args.paths.forEach((p) => walk(p, files));
  } catch (e) {
    console.error(e.message);
    return 2;
  }
  const limit = args.maxMb * 1024 * 1024;
  const hits = [];
  for (const f of files) {
    if (!fs.existsSync(f)) continue;
    const ext = path.extname(f).toLowerCase();
    const size = fs.statSync(f).size;
    if (args.allow.has(ext)) continue;
    if (BLOCKED_EXT.has(ext)) hits.push({ f, why: `大容量データの形式（${ext}）` });
    else if (size > limit) hits.push({ f, why: `${(size / 1024 / 1024).toFixed(1)} MiB（上限 ${args.maxMb} MiB）` });
  }
  if (!hits.length) {
    console.log(`OK：${files.length} ファイルを確認。大容量データは見つかりませんでした。`);
    return 0;
  }
  console.log('大容量データがリポジトリに入ろうとしています。実体は Box に置き、assets.manifest.json に目録として追加してください。');
  for (const h of hits) console.log(`  - ${h.f.split(path.sep).join('/')}：${h.why}`);
  return 1;
}

process.exitCode = main();
