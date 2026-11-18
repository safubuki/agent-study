#!/usr/bin/env node
/**
 * agent-skill のサンプルの動作確認（Node.js 標準モジュールのみ・外部サービス不要・数秒）。
 *
 *   1. 保護フック（claude/・copilot/ の guard-protected-paths.js）：校正値・.env の書き込みを拒否し、読み取り・通常編集は通す
 *   2. 出荷前チェック（release-check/scripts/check-release.js）：わざと入れたバージョン不一致 NG を 1 件だけ出す
 *   3. 利用ログフック（shared/hooks/log-skill-usage.js）：Claude Code・Copilot の呼び出しを JSONL に記録し、変な入力でも止めない
 *   4. 棚卸し（shared/skill-catalog/skill-catalog.js）：重複キーワード・未使用スキル・リンク切れ・手動専用の扱い
 *   5. 大容量データ（shared/external-assets）：目録と実体の照合、混入チェック
 *
 * 実行: node agent-skill/scripts/test-samples.js
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const CC = path.join(ROOT, 'claude/samples/01-layered-rules/product-repo');
const CP = path.join(ROOT, 'copilot/samples/01-layered-rules/product-repo');
const SH = path.join(ROOT, 'shared');
let pass = 0;
let fail = 0;

function run(script, args = [], input = '', env = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    input,
    encoding: 'utf8',
    env: { ...process.env, ...env },
    timeout: 20000,
  });
}

function expect(label, cond, detail = '') {
  if (cond) { pass++; console.log(`  [OK] ${label}`); }
  else { fail++; console.log(`  [NG] ${label}${detail ? `\n       ${detail}` : ''}`); }
}

// ---------------------------------------------------------------------
console.log('1. 保護フック guard-protected-paths.js（Claude Code 版・Copilot 版）');
{
  const ccHook = path.join(CC, '.claude/hooks/guard-protected-paths.js');
  const cpHook = path.join(CP, '.github/hooks/scripts/guard-protected-paths.js');
  const body = (f) => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n').replace(/\/\*\*[\s\S]*?\*\//, '');
  expect('2 つの保護フックの処理本体が同一（先頭コメント以外）', body(ccHook) === body(cpHook));

  const env = { CLAUDE_PROJECT_DIR: CC };
  const call = (tool, file) => run(ccHook, [], JSON.stringify({ tool_name: tool, tool_input: { file_path: file }, cwd: CC }), env);
  const blocked = call('Edit', 'firmware/calibration/motor-params.json');
  expect('[Claude] 校正値ファイルの編集は終了コード 2 で拒否', blocked.status === 2, `status=${blocked.status}`);
  expect('[Claude] 拒否理由を stderr で AI に伝える', /人のレビュー/.test(blocked.stderr), blocked.stderr);
  expect('[Claude] .env の書き込みは拒否', call('Write', path.join(CC, 'app/.env')).status === 2);
  expect('[Claude] .env.example は許可', call('Write', 'app/.env.example').status === 0);
  expect('[Claude] 通常のソース編集は許可', call('Edit', 'firmware/src/motor.c').status === 0);
  expect('[Claude] 校正値の読み取り（Read）は止めない', call('Read', 'firmware/calibration/motor-params.json').status === 0);

  const noEnv = { CLAUDE_PROJECT_DIR: '' };
  const cp = (tool, args) => run(cpHook, [], JSON.stringify({ toolName: tool, toolArgs: JSON.stringify(args), cwd: CP }), noEnv);
  expect('[Copilot] edit（toolArgs が JSON 文字列・cwd 基準）で校正値を拒否', cp('edit', { path: 'firmware/calibration/motor-params.json' }).status === 2);
  expect('[Copilot] create で .env を拒否', cp('create', { path: 'app/.env' }).status === 2);
  expect('[Copilot] view（読み取り）は止めない', cp('view', { path: 'firmware/calibration/motor-params.json' }).status === 0);
  expect('[Copilot] bash は対象外（止めない）', cp('bash', { command: 'make test' }).status === 0);
  expect('壊れた入力では作業を止めない', run(ccHook, [], '{not json', env).status === 0);
}

// ---------------------------------------------------------------------
console.log('2. 出荷前チェック check-release.js（Claude Code 版・Copilot 版）');
{
  const targets = [
    ['Claude', CC, '.claude/skills/release-check/scripts/check-release.js'],
    ['Copilot', CP, '.github/skills/release-check/scripts/check-release.js'],
  ];
  for (const [label, dir, rel] of targets) {
    const r = run(path.join(dir, rel), ['--root', dir]);
    expect(`[${label}] NG があるので終了コード 1`, r.status === 1, `status=${r.status}`);
    expect(`[${label}] NG はバージョン不一致の 1 件だけ`, /NG 1 件/.test(r.stdout) && /\| NG \| アプリとファームのバージョン一致 \| 1\.4\.0 \/ 1\.3\.2 \|/.test(r.stdout), r.stdout);
  }
  expect('不明な引数は終了コード 2', run(path.join(CC, targets[0][2]), ['--bogus']).status === 2);
}

// ---------------------------------------------------------------------
console.log('3. 利用ログフック log-skill-usage.js（共通）');
{
  const hook = path.join(SH, 'hooks/log-skill-usage.js');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-usage-'));
  const log = path.join(tmp, 'usage.jsonl');
  const env = { SKILL_USAGE_LOG: log };
  const calls = [
    { hook_event_name: 'PreToolUse', tool_name: 'Skill', tool_input: { skill: 'meeting-minutes' }, session_id: 's1' },
    { hook_event_name: 'UserPromptSubmit', prompt: '/weekly-report 今週分', session_id: 's1' },
    { hook_event_name: 'UserPromptSubmit', prompt: '普通の依頼です', session_id: 's1' },
    { toolName: 'view', toolArgs: JSON.stringify({ path: '.github/skills/fw-timing-review/SKILL.md' }), sessionId: 'c1' },
    { toolName: 'view', toolArgs: JSON.stringify({ path: 'firmware/src/motor.c' }), sessionId: 'c1' },
    { prompt: '/release-check', sessionId: 'c1' },
  ];
  const results = calls.map((c) => run(hook, [], JSON.stringify(c), env));
  results.push(run(hook, [], 'not json', env));
  const rows = fs.existsSync(log) ? fs.readFileSync(log, 'utf8').trim().split('\n').map((l) => JSON.parse(l)) : [];
  expect('すべての呼び出しが終了コード 0（作業を止めない）', results.every((r) => r.status === 0));
  expect('[Claude] Skill ツールの呼び出しを via: model で記録', rows.some((r) => r.skill === 'meeting-minutes' && r.via === 'model'));
  expect('[共通] 人の /名前 を via: user で記録', rows.some((r) => r.skill === 'weekly-report' && r.via === 'user') && rows.some((r) => r.skill === 'release-check' && r.via === 'user'));
  expect('[Copilot] SKILL.md の読み取りを via: read で記録（推定）', rows.some((r) => r.skill === 'fw-timing-review' && r.via === 'read'));
  expect('スキル以外の依頼・ファイル読み取りは記録しない（4 行だけ）', rows.length === 4, `rows=${rows.length}`);
  expect('依頼文そのものは記録しない', !fs.readFileSync(log, 'utf8').includes('今週分'));
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ---------------------------------------------------------------------
console.log('4. 棚卸し skill-catalog.js（共通）');
{
  const script = path.join(SH, 'skill-catalog/skill-catalog.js');
  const r = run(script, [path.join(SH, 'skill-catalog/demo-skills'), '--usage', path.join(SH, 'skill-catalog/data/sample-usage.jsonl')]);
  expect('デモで終了コード 0', r.status === 0, r.stderr);
  expect('重複キーワード「議事録」の組を検出', /meeting-minutes ⇔ minutes-summary：同じ発火キーワード「議事録」/.test(r.stdout), r.stdout);
  expect('未使用の自動発火スキルを列挙', /棚卸し候補）\n\n- csv-stats\n- minutes-summary/.test(r.stdout), r.stdout);
  expect('手動専用スキルは競合判定と「いつ使うか」点検の対象外', !/release-notes ⇔|\] release-notes：description/.test(r.stdout));
  const both = run(script, [path.join(CC, '.claude/skills'), path.join(CP, '.github/skills')]);
  expect('Claude Code 版・Copilot 版のサンプルスキルに error が無い', both.status === 0 && !/\[error\]/.test(both.stdout), both.stdout);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-catalog-'));
  fs.mkdirSync(path.join(tmp, 'broken'));
  fs.writeFileSync(path.join(tmp, 'broken/SKILL.md'), '---\nname: Broken_Name\ndescription: 何かをする\n---\n\n[資料](references/missing.md)\n');
  fs.mkdirSync(path.join(tmp, 'no-meta'));
  fs.writeFileSync(path.join(tmp, 'no-meta/SKILL.md'), '# frontmatter なし\n');
  const strict = run(script, [tmp, '--strict']);
  expect('リンク切れを error で報告', /\[error\] Broken_Name：リンク切れ：references\/missing\.md/.test(strict.stdout), strict.stdout);
  expect('name の形式違反とフォルダ名不一致を warn で報告', /\[warn\] Broken_Name：name「Broken_Name」は英小文字/.test(strict.stdout) && /フォルダ名「broken」が違う/.test(strict.stdout));
  expect('frontmatter の欠落を error で報告', /\[error\] no-meta：frontmatter/.test(strict.stdout));
  expect('--strict では error があると終了コード 1', strict.status === 1, `status=${strict.status}`);
  expect('フォルダ指定なしは終了コード 2', run(script, []).status === 2);
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ---------------------------------------------------------------------
console.log('5. 大容量データ（Box ＋ 目録）external-assets');
{
  const E = path.join(SH, 'external-assets');
  const check = path.join(E, 'scripts/assets-check.js');
  const manifest = path.join(E, 'assets.manifest.json');
  const ok = run(check, ['--manifest', manifest, '--root', path.join(E, 'demo-box-drive')]);
  expect('目録の 3 件が実体とサイズ・ハッシュまで一致', ok.status === 0 && (ok.stdout.match(/\| OK \|/g) || []).length === 3, ok.stdout + ok.stderr);
  const one = run(check, ['--manifest', manifest, '--root', path.join(E, 'demo-box-drive'), '--id', 'cad-motor-housing']);
  expect('--id で 1 件のフルパスを返す', one.status === 0 && /motor-housing\.step/.test(one.stdout));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'assets-'));
  const bad = run(check, ['--manifest', manifest, '--root', tmp]);
  expect('実体が無いと NG・終了コード 1', bad.status === 1 && /見つからない/.test(bad.stdout));
  const noRoot = run(check, ['--manifest', manifest], '', { ASSET_ROOT: '' });
  expect('実体の場所が分からないと終了コード 2 で案内', noRoot.status === 2 && /ASSET_ROOT/.test(noRoot.stderr));
  fs.rmSync(tmp, { recursive: true, force: true });

  const lf = path.join(E, 'scripts/check-large-files.js');
  const hit = run(lf, [path.join(E, 'demo-box-drive')]);
  expect('CAD（.step）と動画（.mp4）の混入を検出', hit.status === 1 && /motor-housing\.step/.test(hit.stdout) && /assembly\.mp4/.test(hit.stdout), hit.stdout);
  expect('小さな画像（.png）は形式では止めない', !/board-top\.png/.test(hit.stdout));
  const big = fs.mkdtempSync(path.join(os.tmpdir(), 'bigfile-'));
  fs.writeFileSync(path.join(big, 'huge.bin'), Buffer.alloc(2 * 1024 * 1024));
  expect('サイズ上限（--max-mb 1）を超えるファイルを検出', run(lf, [big, '--max-mb', '1']).status === 1);
  expect('上限内なら通す', run(lf, [big, '--max-mb', '5']).status === 0);
  fs.rmSync(big, { recursive: true, force: true });
  expect('指定なしは終了コード 2', run(lf, []).status === 2);
}

// ---------------------------------------------------------------------
console.log('6. 階層の事例（Copilot：03-ai-workspace・04-product-lines）');
{
  const W = path.join(ROOT, 'copilot/samples/03-ai-workspace');
  const P = path.join(ROOT, 'copilot/samples/04-product-lines');
  const guardW = path.join(W, '.github/hooks/scripts/layered-guard.js');
  const guardP = path.join(P, '.github/hooks/scripts/layered-guard.js');
  expect('2 つの事例の layered-guard.js が同一', fs.readFileSync(guardW, 'utf8') === fs.readFileSync(guardP, 'utf8'));
  const g = (guard, root, tool, p) => run(guard, [], JSON.stringify({ toolName: tool, toolArgs: JSON.stringify({ path: p }), cwd: root }), { CLAUDE_PROJECT_DIR: '' });
  expect('[事例1] L1：confidential/ の編集を拒否', g(guardW, W, 'edit', 'confidential/plan.md').status === 2);
  expect('[事例1] L2 営業部：価格表の編集を拒否', g(guardW, W, 'edit', 'departments/sales/price-master/prices.csv').status === 2);
  expect('[事例1] L2 品質保証部：規格書の編集を拒否', g(guardW, W, 'edit', 'departments/qa/standards/inspection-standard.md').status === 2);
  const signed = g(guardW, W, 'edit', 'departments/qa/inspection/signed/lot-001.md');
  expect('[事例1] L3 検査係：署名済み記録の編集を拒否し、階層名を理由に含める', signed.status === 2 && /L3「検査係」/.test(signed.stderr), signed.stderr);
  expect('[事例1] L3 検査係：範囲内で Excel を作るのは拒否', g(guardW, W, 'create', 'departments/qa/inspection/lot-002.xlsx').status === 2);
  expect('[事例1] 範囲外（営業部）では Excel を作れる（L3 の禁止は他部署に及ばない）', g(guardW, W, 'create', 'departments/sales/forecast.xlsx').status === 0);
  expect('[事例1] 検査係の通常の記録は書ける', g(guardW, W, 'create', 'departments/qa/inspection/lot-002.md').status === 0);
  expect('[事例1] 読み取り（view）は止めない', g(guardW, W, 'view', 'confidential/plan.md').status === 0);
  expect('[事例2] L1：安全停止の共通ライブラリの編集を拒否', g(guardP, P, 'edit', 'common/safety/stop.c').status === 2);
  expect('[事例2] L3 ACME：契約書の編集を拒否', g(guardP, P, 'edit', 'products/industrial/customer-acme/contract/terms.md').status === 2);
  expect('[事例2] L3 Borealis の仕様は書ける', g(guardP, P, 'edit', 'products/industrial/customer-borealis/variant.json').status === 0);

  const which = path.join(ROOT, 'copilot/tools/which-rules.js');
  const wj = (root, p) => JSON.parse(run(which, ['--root', root, p, '--json']).stdout)[0];
  const insp = wj(W, 'departments/qa/inspection/lot-002.md');
  expect('[which-rules] 検査係のファイルに L1・L2・L3 が重なる', ['L1', 'L2', 'L3'].every((l) => insp.levels[l]) && insp.writable);
  expect('[which-rules] 検査係のファイルに営業部のルールは混ざらない', !JSON.stringify(insp).includes('sales'));
  const conf = wj(W, 'confidential/plan.md');
  expect('[which-rules] confidential は L1 だけ・書き込み不可', Object.keys(conf.levels).join() === 'L1' && !conf.writable);
  const std = wj(P, 'products/home/standard/variant.json');
  expect('[which-rules] 家庭用の標準品は L1＋L2 だけ（L3 の指示は作っていない）', Object.keys(std.levels).sort().join() === 'L1,L2');
  const acme = wj(P, 'products/industrial/customer-acme/protocol-map.md');
  expect('[which-rules] ACME のファイルに L3 のスキル acme-protocol-check が候補として出る', (acme.levels.L3?.スキル || []).some((s) => s.startsWith('acme-protocol-check')));

  const cv = path.join(P, '.github/skills/product-variant-check/scripts/check-variants.js');
  const ok = run(cv, ['--root', P]);
  expect('[事例2] 3 製品とも「変えてよい点」だけを変えている（NG 0 件）', ok.status === 0 && /合計 NG 0 件/.test(ok.stdout), ok.stdout);
  expect('[事例2] ACME の保存 730 日は L3 で決まったと表示', /\| log\.retentionDays \| 730 \| L3 ACME 社向け \|/.test(ok.stdout));
  expect('[事例2] Borealis の通信 opc-ua は L3 で上書きと表示', /\| comm\.protocol \| opc-ua \| L3 Borealis 社向け \|/.test(ok.stdout));

  // 悪い例：一時フォルダに複製し、顧客が固定値・範囲外・未定義の項目を設定した場合
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'variants-'));
  fs.cpSync(P, tmp, { recursive: true });
  fs.writeFileSync(path.join(tmp, 'products/industrial/customer-borealis/variant.json'), JSON.stringify({
    level: 'L3', name: 'Borealis 社向け', set: { 'safety.stopTimeMs': 250, 'log.retentionDays': 1000, 'comm.protocol': 'can', 'firmware.debug': true },
  }));
  const bad = run(cv, ['--root', tmp]);
  expect('[事例2] 固定値・範囲外・選べない値・未定義の項目を NG にする（4 件）', bad.status === 1 && /合計 NG 4 件/.test(bad.stdout)
    && /固定値 safety\.stopTimeMs/.test(bad.stdout) && /上限 730 超/.test(bad.stdout) && /選べる値/.test(bad.stdout) && /「変えてよい点」に無い firmware\.debug/.test(bad.stdout), bad.stdout);
  fs.rmSync(tmp, { recursive: true, force: true });

  const pub = path.join(W, '.github/skills/ws-publish-check/scripts/check-publish.js');
  const t2 = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-'));
  fs.writeFileSync(path.join(t2, 'ok.md'), '# 提案書\n\n作成日：2026-11-18　出典：価格表\n');
  fs.writeFileSync(path.join(t2, 'ng.md'), '# 社外秘\n\n連絡先 taro@example.com\n');
  expect('[事例1] 公開前チェック：問題ない文書は OK', run(pub, [path.join(t2, 'ok.md')]).status === 0);
  expect('[事例1] 公開前チェック：社外秘・メール・出典なしを NG', run(pub, [path.join(t2, 'ng.md')]).status === 1);
  fs.rmSync(t2, { recursive: true, force: true });
}

// ---------------------------------------------------------------------
console.log('7. 事例 3：複合ワークスペース（ドメイン × 部品 → 係 → 案件）');
{
  const C = path.join(ROOT, 'copilot/samples/05-composite-workspace');
  const guardC = path.join(C, '.github/hooks/scripts/layered-guard.js');
  expect('事例 1・3 の layered-guard.js が同一', fs.readFileSync(guardC, 'utf8') === fs.readFileSync(path.join(ROOT, 'copilot/samples/03-ai-workspace/.github/hooks/scripts/layered-guard.js'), 'utf8'));
  const g = (tool, p) => run(guardC, [], JSON.stringify({ toolName: tool, toolArgs: JSON.stringify({ path: p }), cwd: C }), { CLAUDE_PROJECT_DIR: '' });
  expect('[事例3] L2 ドメイン：どの部品でもリリース済み図面は編集不可（モータドライバ）', g('create', 'parts/motor-driver/electrical/released/rev-b.md').status === 2);
  expect('[事例3] L2 部品：電源ユニットの認証書類は編集不可', g('edit', 'parts/power-unit/certification/README.md').status === 2);
  expect('[事例3] L3 駆動制御係：.hex は作れない', g('create', 'parts/motor-driver/software/build/app.hex').status === 2);
  expect('[事例3] L3 の禁止は他の交わりに及ばない（電源ユニットの software なら .hex を止めない）', g('create', 'parts/power-unit/software/app.hex').status === 0);
  expect('[事例3] L4：顧客の要求書は編集不可', g('edit', 'cases/C-2026-031/customer-spec/requirements.md').status === 2);
  expect('[事例3] 回路図の新しい版は書ける', g('create', 'parts/power-unit/electrical/rev-c031-a.md').status === 0);

  const which = path.join(ROOT, 'copilot/tools/which-rules.js');
  const wj = (p, extra = []) => JSON.parse(run(which, ['--root', C, p, '--json', ...extra]).stdout)[0];
  const sch = wj('parts/power-unit/electrical/schematic.md');
  const l2 = (sch.levels.L2?.指示 || []).join(' ');
  expect('[which-rules] 回路図に L2 のドメイン（electrical）と部品（power-unit）の両方が重なる', /l2-domain-electrical/.test(l2) && /l2-part-power-unit/.test(l2));
  expect('[which-rules] 交わりの L3 電源係が重なる', (sch.levels.L3?.指示 || []).some((x) => /l3-team-power/.test(x)));
  expect('[which-rules] --case なしでは L4 案件は出ない（場所では決まらない）', !sch.levels.L4);
  const schCase = wj('parts/power-unit/electrical/schematic.md', ['--case', 'C-2026-031']);
  expect('[which-rules] --case 付きで L4 案件と上書きする値（48 V）が出る', (schCase.levels.L4?.指示 || []).some((x) => /power\.inputVoltage=48/.test(x)));
  const pid = wj('parts/motor-driver/software/control/pid.c', ['--case', 'C-2026-031']);
  expect('[which-rules] 案件の対象外（モータドライバ）には L4 が出ない', !pid.levels.L4);

  const rc = path.join(C, '.github/skills/case-context/scripts/resolve-case.js');
  const ok = run(rc, ['--root', C, '--case', 'C-2026-031', '--today', '2026-11-18']);
  expect('[事例3] 期限内の案件は OK', ok.status === 0, ok.stdout);
  expect('[事例3] 入力電圧の経緯「L1 既定 24 → L2 部品 24 → L4 案件 48」を表示', /\| power\.inputVoltage \| 48 \| L1 既定 24 → L2 部品 24 → L4 案件 48 \|/.test(ok.stdout), ok.stdout);
  const late = run(rc, ['--root', C, '--case', 'C-2026-031', '--today', '2027-04-01']);
  expect('[事例3] 期限切れ（2027-04-01）は NG', late.status === 1 && /期限 2027-03-31 を過ぎている/.test(late.stdout));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'case-'));
  fs.cpSync(C, tmp, { recursive: true });
  const cj = path.join(tmp, 'cases/C-2026-031/case.json');
  const caseData = JSON.parse(fs.readFileSync(cj, 'utf8'));
  caseData.set['motor-driver'] = { 'motor.maxRpm': 5000 };
  caseData.set['power-unit']['safety.stopTimeMs'] = 300;
  fs.writeFileSync(cj, JSON.stringify(caseData));
  fs.writeFileSync(path.join(tmp, 'parts/motor-driver/part.json'), JSON.stringify({ part: 'motor-driver', set: { 'motor.maxRpm': 3000 } }));
  const bad = run(rc, ['--root', tmp, '--case', 'C-2026-031', '--today', '2026-11-18']);
  expect('[事例3] 案件で変えられない値（回転数）と固定値（安全停止）を NG にする', bad.status === 1 && /motor\.maxRpm は案件では変えられない/.test(bad.stdout) && /固定値 safety\.stopTimeMs/.test(bad.stdout), bad.stdout);
  fs.rmSync(tmp, { recursive: true, force: true });
  expect('[事例3] 案件番号なしは終了コード 2', run(rc, ['--root', C]).status === 2);
}

console.log(`\n結果: ${pass} 件合格 / ${fail} 件失敗`);
process.exitCode = fail ? 1 : 0;
