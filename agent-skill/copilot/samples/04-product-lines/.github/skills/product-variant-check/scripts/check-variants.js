#!/usr/bin/env node
/**
 * 製品の設定を L1（既定・固定）→ L2（製品カテゴリ line.json）→ L3（顧客 variant.json）の順に重ね、
 *   ① 下の階層が「変えてよい点」以外を設定していないか
 *   ② 選べる値・範囲に収まっているか
 *   ③ 固定値（安全停止など）が変わっていないか
 * を確かめ、各値が「どの階層で決まったか」を表で出す。Node.js 標準モジュールのみ・読み取りだけ。
 *
 * 使い方: node check-variants.js --root <リポジトリのルート>
 * 終了コード: 0 = すべて OK、1 = NG あり、2 = 使い方・ファイルの誤り
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

/** products/<カテゴリ>/line.json と products/<カテゴリ>/<顧客>/variant.json を探す。 */
function findVariants(root) {
  const base = path.join(root, 'products');
  const out = [];
  for (const line of fs.readdirSync(base, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    const lineDir = path.join(base, line.name);
    const lineFile = path.join(lineDir, 'line.json');
    for (const v of fs.readdirSync(lineDir, { withFileTypes: true }).filter((e) => e.isDirectory())) {
      const variantFile = path.join(lineDir, v.name, 'variant.json');
      if (fs.existsSync(variantFile)) out.push({ lineFile: fs.existsSync(lineFile) ? lineFile : null, variantFile });
    }
  }
  return out.sort((a, b) => a.variantFile.localeCompare(b.variantFile));
}

function checkValue(key, value, vp) {
  if (vp.allowed && !vp.allowed.includes(value)) return `${key}=${value} は選べる値（${vp.allowed.join('・')}）にない`;
  if (typeof vp.min === 'number' && !(value >= vp.min)) return `${key}=${value} は下限 ${vp.min} 未満`;
  if (typeof vp.max === 'number' && !(value <= vp.max)) return `${key}=${value} は上限 ${vp.max} 超`;
  return null;
}

function resolve(rules, layers) {
  const values = {};
  const from = {};
  const problems = [];
  for (const [k, v] of Object.entries(rules.locked)) { values[k] = v; from[k] = 'L1 固定'; }
  for (const [k, v] of Object.entries(rules.defaults)) { values[k] = v; from[k] = 'L1 既定'; }
  for (const layer of layers) {
    for (const [k, v] of Object.entries(layer.set || {})) {
      if (k in rules.locked) { problems.push(`${layer.level}（${layer.rel}）が固定値 ${k} を変えようとしている`); continue; }
      const vp = rules.variationPoints[k];
      if (!vp) { problems.push(`${layer.level}（${layer.rel}）が「変えてよい点」に無い ${k} を設定している`); continue; }
      if (!vp.levels.includes(layer.level)) { problems.push(`${k} は ${layer.level} では変えられない（${vp.levels.join('・')} のみ）`); continue; }
      const bad = checkValue(k, v, vp);
      if (bad) { problems.push(`${layer.level}（${layer.rel}）：${bad}`); continue; }
      values[k] = v;
      from[k] = `${layer.level} ${layer.name}`;
    }
  }
  return { values, from, problems };
}

function main() {
  const argv = process.argv.slice(2);
  const i = argv.indexOf('--root');
  if (argv.includes('--help')) { console.log('使い方: node check-variants.js --root <repo>'); return 0; }
  const root = path.resolve(i >= 0 ? argv[i + 1] : process.cwd());
  let rules;
  try { rules = readJson(path.join(root, '.github', 'product-rules.json')); } catch (e) {
    console.error(`.github/product-rules.json を読めません（${e.message}）`);
    return 2;
  }
  const rel = (f) => path.relative(root, f).split(path.sep).join('/');
  let ng = 0;
  for (const v of findVariants(root)) {
    const layers = [];
    if (v.lineFile) { const j = readJson(v.lineFile); layers.push({ ...j, level: j.level || 'L2', rel: rel(v.lineFile) }); }
    const vj = readJson(v.variantFile);
    layers.push({ ...vj, level: vj.level || 'L3', rel: rel(v.variantFile) });
    const r = resolve(rules, layers);
    console.log(`\n■ ${vj.name || rel(v.variantFile)}（型番 ${vj.model || '—'}）：${rel(v.variantFile)}`);
    console.log('| 項目 | 値 | 決めた階層 |\n|---|---|---|');
    for (const k of Object.keys(r.values)) console.log(`| ${k} | ${r.values[k]} | ${r.from[k]} |`);
    if (r.problems.length) { ng += r.problems.length; r.problems.forEach((p) => console.log(`NG：${p}`)); } else console.log('OK：変えてよい点だけを変えている');
  }
  console.log(`\n合計 NG ${ng} 件`);
  return ng ? 1 : 0;
}

process.exitCode = main();
