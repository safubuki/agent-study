#!/usr/bin/env node
/**
 * スキルの棚卸し（カタログ作成＋点検）スクリプト。Node.js 標準モジュールのみ。
 *
 * 指定したフォルダ直下の <スキル名>/SKILL.md を集め、次を 1 枚の表にする：
 *   - 名前・説明文の長さ・本文の行数・付属フォルダ（references/scripts/assets/evals）
 *   - 点検：名前の形式／フォルダ名との一致、説明文の有無と長さ、「いつ使うか」の手がかり、
 *           本文 500 行超、SKILL.md から張ったローカルリンク切れ
 *   - 説明文どうしの重なり（文字 2-gram の Jaccard 係数）と、同じ発火キーワード「…」の重複
 *   - --usage <usage.jsonl> を渡すと、利用回数・最終利用日・一度も使われていないスキル
 *
 * 使い方:
 *   node skill-catalog.js <skills-dir> [<skills-dir> ...] [--usage usage.jsonl] [--json out.json]
 *                         [--threshold 0.3] [--strict]
 * 終了コード: 0 = 完了（--strict のときは error が 1 件でもあれば 1）、2 = 使い方の誤り
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DESC_MAX = 1024;   // Agent Skills 標準（agentskills.io）の description 上限
const BODY_MAX_LINES = 500; // 公式ベストプラクティスの目安
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TRIGGER_CUE_RE = /(とき|時に|場合|で使う|で発火|で起動|use when|when the user|trigger)/i;

function parseArgs(argv) {
  const a = { dirs: [], threshold: 0.3, strict: false };
  for (let i = 0; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--usage') a.usage = argv[++i];
    else if (v === '--json') a.json = argv[++i];
    else if (v === '--threshold') a.threshold = Number(argv[++i]);
    else if (v === '--strict') a.strict = true;
    else if (v === '--help' || v === '-h') a.help = true;
    else if (v.startsWith('--')) a.error = `不明なオプションです: ${v}`;
    else a.dirs.push(v);
  }
  if (!a.help && !a.error && a.dirs.length === 0) a.error = 'スキルのフォルダを 1 つ以上指定してください';
  if (!Number.isFinite(a.threshold)) a.error = '--threshold には数値を指定してください';
  return a;
}

/** frontmatter の最小パーサー（key: value と、次行以降の "  - item" 形式のリストだけを扱う）。 */
function parseFrontmatter(text) {
  const m = text.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { meta: null, body: text };
  const meta = {};
  let lastKey = null;
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) {
      lastKey = kv[1];
      let val = kv[2].trim();
      if (/^(["']).*\1$/.test(val)) val = val.slice(1, -1);
      meta[lastKey] = val === '' ? [] : val;
      continue;
    }
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && lastKey && Array.isArray(meta[lastKey])) meta[lastKey].push(item[1].trim().replace(/^(["'])(.*)\1$/, '$2'));
  }
  return { meta, body: text.slice(m[0].length) };
}

function findSkills(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith('.')) continue;
    const skillMd = path.join(dir, e.name, 'SKILL.md');
    if (fs.existsSync(skillMd)) out.push({ folder: e.name, dir: path.join(dir, e.name), file: skillMd });
  }
  return out.sort((x, y) => x.folder.localeCompare(y.folder));
}

function localLinks(body) {
  const links = [];
  const re = /\[[^\]]*\]\(([^)\s]+)\)/g;
  let m;
  const noCode = body.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');
  while ((m = re.exec(noCode))) {
    const target = m[1].split('#')[0];
    if (!target || /^[a-z]+:/i.test(target)) continue;
    links.push(decodeURIComponent(target));
  }
  return links;
}

function inspect(entry) {
  const text = fs.readFileSync(entry.file, 'utf8');
  const { meta, body } = parseFrontmatter(text);
  const issues = [];
  const add = (level, msg) => issues.push({ level, msg });
  const m = meta || {};
  const name = typeof m.name === 'string' ? m.name : '';
  const desc = typeof m.description === 'string' ? m.description : '';
  if (!meta) add('error', 'frontmatter（--- で囲んだ先頭部分）がない');
  if (!name) add('warn', 'name がない（フォルダ名が使われる）');
  else {
    if (!NAME_RE.test(name) || name.length > 64) add('warn', `name「${name}」は英小文字・数字・ハイフン 64 文字以内が標準`);
    if (name !== entry.folder) add('warn', `name「${name}」とフォルダ名「${entry.folder}」が違う`);
  }
  const descLen = [...desc].length;
  const manualOnly = String(m['disable-model-invocation']).toLowerCase() === 'true';
  if (!desc) add('error', 'description がない（自動では呼ばれない）');
  else {
    if (descLen > DESC_MAX) add('warn', `description が ${descLen} 文字（標準の上限 ${DESC_MAX} 文字を超過）`);
    // 手動専用のスキルは説明文で発火判定されないので、「いつ使うか」の手がかりは点検しない
    if (!manualOnly && !TRIGGER_CUE_RE.test(desc) && !/「[^」]+」/.test(desc)) add('info', 'description に「いつ使うか」の手がかりが見当たらない');
  }
  const bodyLines = body.split(/\r?\n/).length;
  if (bodyLines > BODY_MAX_LINES) add('warn', `本文が ${bodyLines} 行（目安 ${BODY_MAX_LINES} 行以内。references/ へ分割を検討）`);
  for (const link of localLinks(body)) {
    if (!fs.existsSync(path.resolve(entry.dir, link))) add('error', `リンク切れ：${link}`);
  }
  const parts = ['references', 'scripts', 'assets', 'evals'].filter((p) => fs.existsSync(path.join(entry.dir, p)));
  const triggers = [...desc.matchAll(/「([^」]+)」/g)].map((x) => x[1]);
  return {
    folder: entry.folder,
    name: name || entry.folder,
    description: desc,
    descLength: descLen,
    bodyLines,
    parts,
    manualOnly,
    paths: Array.isArray(m.paths) ? m.paths : (m.paths ? [m.paths] : []),
    triggers,
    issues,
  };
}

function bigrams(text) {
  const s = text.toLowerCase().replace(/[\s、。・，．,.()（）「」『』:：/\-_|`'"]+/g, '');
  const set = new Set();
  for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
  return set;
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/** 説明文が重なっている組を返す。手動専用のスキルは自動発火で競合しないので除外する。 */
function findOverlaps(skills, threshold) {
  const auto = skills.filter((s) => s.description && !s.manualOnly);
  const grams = new Map(auto.map((s) => [s.name, bigrams(s.description)]));
  const pairs = [];
  for (let i = 0; i < auto.length; i++) {
    for (let j = i + 1; j < auto.length; j++) {
      const a = auto[i]; const b = auto[j];
      const score = jaccard(grams.get(a.name), grams.get(b.name));
      const shared = a.triggers.filter((t) => b.triggers.includes(t));
      if (score >= threshold || shared.length) pairs.push({ a: a.name, b: b.name, score: Math.round(score * 100) / 100, shared });
    }
  }
  return pairs.sort((x, y) => y.shared.length - x.shared.length || y.score - x.score);
}

function loadUsage(file) {
  const usage = new Map();
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let r;
    try { r = JSON.parse(line); } catch { continue; }
    if (!r.skill) continue;
    const key = String(r.skill).split(':').pop(); // プラグインの「名前空間:名前」は名前で集計
    const u = usage.get(key) || { count: 0, model: 0, user: 0, last: '' };
    u.count++;
    if (r.via === 'user') u.user++; else u.model++; // model（Claude Code）と read（Copilot の推定）は AI 経由として数える
    if (String(r.ts) > u.last) u.last = String(r.ts);
    usage.set(key, u);
  }
  return usage;
}

function cell(s) {
  return String(s).replace(/\|/g, '\\|');
}

function render(skills, overlaps, usage) {
  const lines = [];
  const all = skills.flatMap((s) => s.issues.map((i) => ({ ...i, name: s.name })));
  const count = (lv) => all.filter((i) => i.level === lv).length;
  lines.push('# スキル棚卸しレポート');
  lines.push('');
  lines.push(`- スキル数：${skills.length}（うち手動専用 ${skills.filter((s) => s.manualOnly).length}、paths で範囲限定 ${skills.filter((s) => s.paths.length).length}）`);
  lines.push(`- 説明文の合計：${skills.reduce((n, s) => n + s.descLength, 0)} 文字（自動発火の対象 ${skills.filter((s) => !s.manualOnly).reduce((n, s) => n + s.descLength, 0)} 文字）`);
  lines.push(`- 点検結果：error ${count('error')} 件／warn ${count('warn')} 件／info ${count('info')} 件／説明文が重なる組 ${overlaps.length} 組`);
  lines.push('');
  lines.push('## 一覧');
  lines.push('');
  const head = ['名前', '説明文', '本文行数', '付属', '呼び方'];
  if (usage) head.push('利用回数', '最終利用');
  lines.push(`| ${head.join(' | ')} |`);
  lines.push(`|${head.map(() => '---').join('|')}|`);
  for (const s of skills) {
    const row = [s.name, `${s.descLength} 字`, s.bodyLines, s.parts.join(', ') || '—', s.manualOnly ? '手動のみ' : (s.paths.length ? `自動（${s.paths.join(', ')}）` : '自動')];
    if (usage) {
      const u = usage.get(s.name);
      row.push(u ? `${u.count}（AI ${u.model}／人 ${u.user}）` : '0', u ? u.last.slice(0, 10) : '—');
    }
    lines.push(`| ${row.map(cell).join(' | ')} |`);
  }
  lines.push('');
  lines.push('## 説明文が重なっている組（自動発火の競合候補）');
  lines.push('');
  if (!overlaps.length) lines.push('なし');
  for (const p of overlaps) {
    const why = p.shared.length ? `同じ発火キーワード「${p.shared.join('」「')}」` : `類似度 ${p.score}`;
    lines.push(`- ${p.a} ⇔ ${p.b}：${why}（類似度 ${p.score}）`);
  }
  lines.push('');
  lines.push('## 点検で見つかったこと');
  lines.push('');
  if (!all.length) lines.push('なし');
  for (const i of all.sort((x, y) => ['error', 'warn', 'info'].indexOf(x.level) - ['error', 'warn', 'info'].indexOf(y.level))) {
    lines.push(`- [${i.level}] ${i.name}：${i.msg}`);
  }
  if (usage) {
    const unused = skills.filter((s) => !usage.get(s.name) && !s.manualOnly).map((s) => s.name);
    lines.push('');
    lines.push('## 一度も使われていない自動発火スキル（棚卸し候補）');
    lines.push('');
    lines.push(unused.length ? unused.map((n) => `- ${n}`).join('\n') : 'なし');
  }
  return lines.join('\n') + '\n';
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log('使い方: node skill-catalog.js <skills-dir> [...] [--usage usage.jsonl] [--json out.json] [--threshold 0.3] [--strict]');
    return 0;
  }
  if (args.error) {
    console.error(args.error);
    return 2;
  }
  const entries = args.dirs.flatMap((d) => findSkills(path.resolve(d)));
  if (!entries.length) {
    console.error(`SKILL.md を持つフォルダが見つかりません: ${args.dirs.join(', ')}`);
    return 2;
  }
  const skills = entries.map(inspect);
  const overlaps = findOverlaps(skills, args.threshold);
  let usage = null;
  if (args.usage) {
    try { usage = loadUsage(args.usage); } catch (e) {
      console.error(`利用ログを読めません: ${args.usage}（${e.message}）`);
      return 2;
    }
  }
  process.stdout.write(render(skills, overlaps, usage));
  if (args.json) {
    const payload = { skills, overlaps, usage: usage ? Object.fromEntries(usage) : null };
    fs.writeFileSync(args.json, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  }
  const errors = skills.reduce((n, s) => n + s.issues.filter((i) => i.level === 'error').length, 0);
  return args.strict && errors ? 1 : 0;
}

process.exitCode = main();
