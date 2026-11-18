#!/usr/bin/env node
/**
 * 「このファイルを編集するとき、どの階層のどのルールが使われるか」を一覧にする（GitHub Copilot の構成向け）。
 * Node.js 標準モジュールのみ。読み取りだけ。
 *
 * 使い方: node which-rules.js --root <リポジトリのルート> <ファイルのパス> [<ファイルのパス> ...] [--case <案件番号>] [--json]
 *   --case：案件（L4）の作業中として調べる。cases/<番号>/case.json の targets に入るファイルなら、案件のルールと上書きする値を表示する
 *
 * 調べるもの（リポジトリのルートからの相対パスで判定）：
 *   - 常時の指示：AGENTS.md・.github/copilot-instructions.md（L1・常に使われる）
 *   - パス別の指示：.github/instructions/*.instructions.md の applyTo（ファイル名の先頭 l1- / l2- / l3- を階層とみなす）
 *   - ポリシー：.github/policies/*.json の scope（layered-guard.js が使う書き込み禁止）
 *   - スキル：.github/skills/<名前>/SKILL.md の metadata.layer・metadata.scope（人と道具のための目印。
 *     Copilot 自身はこの欄で発火を絞らないので「候補になりやすいスキル」として表示する）
 * 終了コード：0 = 完了、2 = 使い方の誤り
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        const slash = glob[i + 2] === '/';
        re += slash ? '(?:.*/)?' : '.*';
        i += slash ? 2 : 1;
      } else re += '[^/]*';
    } else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}
const splitGlobs = (v) => (Array.isArray(v) ? v : String(v || '').split(',')).map((s) => s.trim()).filter(Boolean);
const matches = (rel, globs) => splitGlobs(globs).some((g) => globToRegExp(g).test(rel));

/** frontmatter の最小パーサー（key: value と、metadata: の下の「  key: value」だけを扱う）。 */
function frontmatter(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const meta = { metadata: {} };
  if (!m) return meta;
  let inMeta = false;
  for (const line of m[1].split(/\r?\n/)) {
    const top = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (top) {
      inMeta = top[1] === 'metadata' && !top[2];
      if (!inMeta) meta[top[1]] = top[2].replace(/^(["'])(.*)\1$/, '$2');
      continue;
    }
    const sub = line.match(/^\s+([A-Za-z_][\w-]*):\s*(.*)$/);
    if (inMeta && sub) meta.metadata[sub[1]] = sub[2].replace(/^(["'])(.*)\1$/, '$2');
  }
  return meta;
}

function levelOf(name) {
  const m = name.match(/^l([1-9])-/i);
  return m ? `L${m[1]}` : '？';
}

function collect(root) {
  const inst = path.join(root, '.github', 'instructions');
  const pol = path.join(root, '.github', 'policies');
  const sk = path.join(root, '.github', 'skills');
  const instructions = fs.existsSync(inst)
    ? fs.readdirSync(inst).filter((f) => f.endsWith('.instructions.md')).sort().map((f) => ({
      file: `.github/instructions/${f}`, level: levelOf(f), scope: frontmatter(path.join(inst, f)).applyTo || '',
    }))
    : [];
  const policies = fs.existsSync(pol)
    ? fs.readdirSync(pol).filter((f) => f.endsWith('.json')).sort().map((f) => {
      const p = JSON.parse(fs.readFileSync(path.join(pol, f), 'utf8'));
      return { file: `.github/policies/${f}`, level: p.level || levelOf(f), scope: p.scope || [], protect: p.protect || [], denyExtensions: p.denyExtensions || [], name: p.name || f };
    })
    : [];
  const skills = fs.existsSync(sk)
    ? fs.readdirSync(sk).filter((d) => fs.existsSync(path.join(sk, d, 'SKILL.md'))).sort().map((d) => {
      const fm = frontmatter(path.join(sk, d, 'SKILL.md'));
      return { name: fm.name || d, level: fm.metadata.layer || '？', scope: fm.metadata.scope || '**', manual: String(fm['disable-model-invocation']) === 'true' };
    })
    : [];
  const always = ['AGENTS.md', '.github/copilot-instructions.md'].filter((f) => fs.existsSync(path.join(root, f)));
  return { always, instructions, policies, skills };
}

function explain(root, target, all, caseId) {
  const rel = path.relative(root, path.resolve(root, target)).split(path.sep).join('/');
  const levels = {};
  const put = (lv, kind, item) => { (levels[lv] ||= { 指示: [], ポリシー: [], スキル: [] })[kind].push(item); };
  all.always.forEach((f) => put('L1', '指示', `${f}（常に）`));
  all.instructions.filter((i) => matches(rel, i.scope)).forEach((i) => put(i.level, '指示', `${i.file}（applyTo: ${i.scope}）`));
  const policies = all.policies.filter((p) => matches(rel, p.scope));
  policies.forEach((p) => put(p.level, 'ポリシー', `${p.file}（${p.name}）`));
  all.skills.filter((s) => matches(rel, s.scope)).forEach((s) => put(s.level, 'スキル', `${s.name}${s.manual ? '（手動 /' + s.name + '）' : ''}`));
  // 案件（L4）は場所では決まらない。--case で「この案件の作業中」と指定したときだけ、対象に入るかを調べる
  if (caseId) {
    const cf = path.join(root, 'cases', caseId, 'case.json');
    if (fs.existsSync(cf)) {
      const c = JSON.parse(fs.readFileSync(cf, 'utf8'));
      if (matches(rel, c.targets || [])) put('L4', '指示', `cases/${caseId}/CASE.md（/case-context ${caseId} で人が読み込む・期限 ${c.expires}）`);
      if (matches(rel, c.targets || []) && c.set) {
        const part = (rel.match(/^parts\/([^/]+)\//) || [])[1];
        if (part && c.set[part]) put('L4', '指示', `case.json で上書きする値：${Object.entries(c.set[part]).map(([k, v]) => `${k}=${v}`).join('・')}`);
      }
    }
  }
  const protect = policies.flatMap((p) => p.protect.map((g) => `${g}（${p.level}）`));
  const blocked = policies.find((p) => matches(rel, p.protect) || p.denyExtensions.map((e) => e.toLowerCase()).includes(path.extname(rel).toLowerCase()));
  return { path: rel, levels, protect, writable: !blocked, blockedBy: blocked ? `${blocked.level}「${blocked.name}」` : null };
}

function render(r) {
  const lines = [`■ ${r.path}`];
  for (const lv of Object.keys(r.levels).sort()) {
    lines.push(`  ${lv}`);
    for (const kind of ['指示', 'ポリシー', 'スキル']) {
      r.levels[lv][kind].forEach((x) => lines.push(`    ${kind.padEnd(4, '　')}${x}`));
    }
  }
  lines.push(`  書き込み：${r.writable ? '可' : `不可（${r.blockedBy}のポリシーで止まる）`}`);
  return lines.join('\n');
}

function main() {
  const argv = process.argv.slice(2);
  let root = process.cwd();
  let json = false;
  let caseId = null;
  const targets = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') root = argv[++i];
    else if (argv[i] === '--json') json = true;
    else if (argv[i] === '--case') caseId = argv[++i];
    else if (argv[i] === '--help' || argv[i] === '-h') { console.log('使い方: node which-rules.js --root <repo> <path> [...] [--case <案件番号>] [--json]'); return 0; }
    else targets.push(argv[i]);
  }
  if (!targets.length || !fs.existsSync(root)) { console.error('使い方: node which-rules.js --root <repo> <path> [...] [--json]'); return 2; }
  root = path.resolve(root);
  const all = collect(root);
  const results = targets.map((t) => explain(root, t, all, caseId));
  console.log(json ? JSON.stringify(results, null, 2) : results.map(render).join('\n\n'));
  return 0;
}

process.exitCode = main();
