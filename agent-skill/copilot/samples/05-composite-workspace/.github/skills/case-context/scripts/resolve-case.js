#!/usr/bin/env node
/**
 * 案件（L4）の内容を、部品（L2）・ワークスペース（L1）の値と重ねて表示する。Node.js 標準モジュールのみ・読み取りだけ。
 *
 *   値の重ね方：L1 固定・既定（.github/product-rules.json）→ L2 部品（parts/<部品>/part.json）→ L4 案件（cases/<番号>/case.json）
 *   確かめること：
 *     ① 案件の期限（expires）を過ぎていないか
 *     ② 案件・部品が「変えてよい点」以外や、その階層で変えてはいけない項目を設定していないか
 *     ③ 選べる値・範囲に収まっているか、固定値を変えていないか
 *
 * 使い方: node resolve-case.js --root <リポジトリのルート> --case <案件番号> [--today YYYY-MM-DD]
 * 終了コード: 0 = OK、1 = NG あり（期限切れを含む）、2 = 使い方・ファイルの誤り
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function check(rules, key, value, level, where) {
  if (key in rules.locked) return `${where} が固定値 ${key} を変えようとしている`;
  const vp = rules.variationPoints[key];
  if (!vp) return `${where} が「変えてよい点」に無い ${key} を設定している`;
  if (!vp.levels.includes(level)) return `${key} は${level === 'case' ? '案件' : '部品'}では変えられない（${vp.levels.join('・')} のみ）`;
  if (vp.allowed && !vp.allowed.includes(value)) return `${key}=${value} は選べる値（${vp.allowed.join('・')}）にない`;
  if (typeof vp.min === 'number' && !(value >= vp.min)) return `${key}=${value} は下限 ${vp.min} 未満`;
  if (typeof vp.max === 'number' && !(value <= vp.max)) return `${key}=${value} は上限 ${vp.max} 超`;
  return null;
}

function main() {
  const root = path.resolve(arg('--root') || process.cwd());
  const id = arg('--case');
  if (!id) { console.error('使い方: node resolve-case.js --root <repo> --case <案件番号> [--today YYYY-MM-DD]'); return 2; }
  const today = arg('--today') || new Date().toISOString().slice(0, 10);
  let rules; let kase;
  try {
    rules = JSON.parse(fs.readFileSync(path.join(root, '.github', 'product-rules.json'), 'utf8'));
    kase = JSON.parse(fs.readFileSync(path.join(root, 'cases', id, 'case.json'), 'utf8'));
  } catch (e) {
    console.error(`読めません：${e.message}`);
    return 2;
  }
  const problems = [];
  console.log(`■ 案件 ${kase.id}：${kase.title}（${kase.customer || '—'}）`);
  console.log(`  期限 ${kase.expires}／今日 ${today}／対象 ${kase.targets.join('・')}`);
  console.log(`  ルール：cases/${id}/CASE.md`);
  if (today > kase.expires) problems.push(`期限 ${kase.expires} を過ぎている。この案件のルールと値は使わない`);

  const partsDir = path.join(root, 'parts');
  for (const part of fs.readdirSync(partsDir).sort()) {
    const pf = path.join(partsDir, part, 'part.json');
    if (!fs.existsSync(pf)) continue;
    const pj = JSON.parse(fs.readFileSync(pf, 'utf8'));
    const caseSet = (kase.set || {})[part] || {};
    const values = {};
    const chain = {}; // 値の経緯：「L1 既定 24 → L2 部品 24 → L4 案件 48」
    const note = (k, v, label) => { values[k] = v; (chain[k] ||= []).push(`${label} ${v}`); };
    for (const [k, v] of Object.entries(rules.locked)) note(k, v, 'L1 固定');
    for (const [k, v] of Object.entries(rules.defaults)) note(k, v, 'L1 既定');
    const touched = new Set(Object.keys(rules.locked)); // 表に出すのは固定値と、部品・案件が触った項目だけ
    for (const [k, v] of Object.entries(pj.set || {})) {
      const bad = check(rules, k, v, 'part', `部品 ${part}（part.json）`);
      if (bad) problems.push(bad); else { note(k, v, 'L2 部品'); touched.add(k); }
    }
    for (const [k, v] of Object.entries(caseSet)) {
      const bad = check(rules, k, v, 'case', `案件 ${id}（case.json の ${part}）`);
      if (bad) problems.push(bad); else { note(k, v, 'L4 案件'); touched.add(k); }
    }
    if (!Object.keys(caseSet).length) continue; // 案件が値を変えない部品は表を省く
    console.log(`\n  ● 部品 ${pj.name || part}（parts/${part}）`);
    console.log('  | 項目 | 使う値 | 経緯（左から順に上書き） |\n  |---|---|---|');
    for (const k of Object.keys(values).filter((x) => touched.has(x))) console.log(`  | ${k} | ${values[k]} | ${chain[k].join(' → ')} |`);
  }
  console.log('');
  if (problems.length) problems.forEach((p) => console.log(`NG：${p}`));
  else console.log('OK：期限内で、案件は「案件で変えてよい点」だけを変えている');
  return problems.length ? 1 : 0;
}

process.exitCode = main();
