#!/usr/bin/env node
/**
 * 大容量データの目録（assets.manifest.json）と、手元の実体（Box Drive の同期フォルダなど）を照合する。
 * Node.js 標準モジュールのみ。読み取りだけで、ファイルの作成・移動・ダウンロードはしない。
 *
 * 使い方:
 *   node assets-check.js [--manifest assets.manifest.json] [--root <実体のフォルダ>] [--id <id>] [--json]
 *   --root を省略すると、目録の storage.localRootEnv が示す環境変数（例：ASSET_ROOT）を使う。
 *   --id を付けると 1 件だけ調べ、そのフルパスを表示する（AI がスキルから「どこにあるか」を引く用途）。
 *
 * 出力：| 結果 | id | 種類 | パス | 内容 | の表（--json で機械可読）
 * 終了コード：0 = すべて OK、1 = 見つからない・サイズ／ハッシュ不一致あり、2 = 使い方・目録の誤り
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function parseArgs(argv) {
  const a = { manifest: 'assets.manifest.json' };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--manifest') a.manifest = argv[++i];
    else if (v === '--root') a.root = argv[++i];
    else if (v === '--id') a.id = argv[++i];
    else if (v === '--json') a.json = true;
    else if (v === '--help' || v === '-h') a.help = true;
    else a.error = `不明な引数です: ${v}`;
  }
  return a;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function checkOne(asset, root) {
  const full = path.join(root, ...String(asset.path).split('/'));
  if (!fs.existsSync(full)) return { ok: false, full, detail: '見つからない（Box Drive が同期済みか、パスが正しいかを確認）' };
  const st = fs.statSync(full);
  if (typeof asset.bytes === 'number' && st.size !== asset.bytes) {
    return { ok: false, full, detail: `サイズ不一致（目録 ${asset.bytes} / 実体 ${st.size}）。Box 側が更新された可能性` };
  }
  if (asset.sha256 && sha256(full) !== asset.sha256) {
    return { ok: false, full, detail: 'ハッシュ不一致。Box 側が更新されたなら目録を更新する（人の確認が要る）' };
  }
  return { ok: true, full, detail: `${st.size} bytes・一致` };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('使い方: node assets-check.js [--manifest assets.manifest.json] [--root <dir>] [--id <id>] [--json]');
    return 0;
  }
  if (args.error) { console.error(args.error); return 2; }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(args.manifest, 'utf8'));
  } catch (e) {
    console.error(`目録を読めません: ${args.manifest}（${e.message}）`);
    return 2;
  }
  const envName = manifest.storage?.localRootEnv;
  const root = args.root || (envName ? process.env[envName] : undefined);
  if (!root) {
    console.error(`実体のフォルダが分かりません。--root を付けるか、環境変数 ${envName || 'ASSET_ROOT'} を設定してください。`);
    console.error('（Box Drive を使っていない場合は、Box の URL から人が取得してください：目録の box.url）');
    return 2;
  }
  let assets = manifest.assets || [];
  if (args.id) {
    assets = assets.filter((x) => x.id === args.id);
    if (!assets.length) { console.error(`目録に id「${args.id}」がありません`); return 2; }
  }
  const results = assets.map((a) => ({ id: a.id, kind: a.kind, path: a.path, url: a.box?.url, ...checkOne(a, path.resolve(root)) }));
  if (args.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log('| 結果 | id | 種類 | パス | 内容 |');
    console.log('|---|---|---|---|---|');
    for (const r of results) console.log(`| ${r.ok ? 'OK' : 'NG'} | ${r.id} | ${r.kind} | ${r.ok ? r.full : r.path} | ${r.detail} |`);
  }
  return results.every((r) => r.ok) ? 0 : 1;
}

process.exitCode = main();
