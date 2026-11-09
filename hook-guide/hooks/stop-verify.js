#!/usr/bin/env node
/**
 * hooks/stop-verify.js — Stop 完了ゲートフック
 *
 * 役割：
 * AI が「作業完了」として止まろうとした瞬間に、作成された HTML ファイルを検査する。
 * 以下の必須要件が1つでも欠けていれば {"decision": "block", "reason": "..."} を返して差し戻す：
 *   1. <html lang="ja"> があること
 *   2. <meta name="viewport" ...> があること
 *   3. セマンティックタグ <header>, <main>, <footer> がすべて揃っていること
 *   4. CSS カスタムプロパティ（--で始まる変数）が :root 等で定義されていること
 *   5. スマートフォン対応の @media クエリがあること
 *   6. アクセシビリティ用の aria-label 属性が1つ以上使われていること
 *   7. インライン style="..." 属性が残っていないこと
 */
const fs = require('fs');
const path = require('path');

function appendHookLog(entry) {
  const logFile = process.env.HOOK_LOG_FILE;
  if (!logFile) return;
  try {
    fs.appendFileSync(logFile, JSON.stringify({ timestamp: new Date().toISOString(), hook: 'Stop(stop-verify)', ...entry }) + '\n', 'utf8');
  } catch {
    // ignore
  }
}

function inspectHtml(html) {
  const missing = [];
  if (!/<html\b[^>]*\blang\s*=\s*["']ja["']/i.test(html)) {
    missing.push('① <html lang="ja"> が設定されていません');
  }
  if (!/<meta\b[^>]*\bname\s*=\s*["']viewport["']/i.test(html)) {
    missing.push('② <meta name="viewport" ...> が設定されていません');
  }
  for (const tag of ['header', 'main', 'footer']) {
    const re = new RegExp(`<${tag}\\b`, 'i');
    if (!re.test(html)) {
      missing.push(`③ セマンティックタグ <${tag}> がありません`);
    }
  }
  if (!/--[a-zA-Z0-9_-]+\s*:/.test(html)) {
    missing.push('④ CSS 変数（--primary などのカスタムプロパティ）が定義されていません');
  }
  if (!/@media\b/i.test(html)) {
    missing.push('⑤ スマートフォン幅対応の @media クエリがありません');
  }
  if (!/\baria-label\s*=\s*["'][^"']+["']/i.test(html)) {
    missing.push('⑥ アクセシビリティ用の aria-label="..." 属性が1つも使われていません');
  }
  if (/<[a-zA-Z0-9-]+\b[^>]*\sstyle\s*=\s*["'][^"']+["']/i.test(html)) {
    missing.push('⑦ 禁止されているインライン style="..." 属性が残っています');
  }
  return missing;
}

function main() {
  // no-hooks または with-hooks（Pre/Postのみ）のときは Stop ゲートを動かさない
  const mode = process.env.HOOK_EXPERIMENT_MODE || '';
  if (mode === 'no-hooks' || mode === 'with-hooks') {
    process.exit(0);
  }

  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch {
    process.exit(0);
  }

  let data = {};
  try {
    data = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    process.exit(0);
  }

  // 無限ループ防止：すでに1回差し戻した後の再停止なら通過させる
  if (data.stop_hook_active === true || data.stopHookActive === true) {
    appendHookLog({ action: 'SKIP_LOOP_GUARD', note: 'stop_hook_active is true' });
    process.exit(0);
  }

  // 検査対象の HTML ファイルを探す（1: JSON指定、2: 環境変数 TARGET_HTML_PATH、3: カレントの index.html）
  const cwd = data.cwd || process.cwd();
  const candidatePaths = [
    data.target_file,
    process.env.TARGET_HTML_PATH,
    path.join(cwd, 'index.html')
  ].filter(Boolean);

  const targetFile = candidatePaths.find((p) => fs.existsSync(p));
  if (!targetFile) {
    // まだ HTML が存在しない（単なる会話や調査）なら通過
    process.exit(0);
  }

  const html = fs.readFileSync(targetFile, 'utf8');
  const missing = inspectHtml(html);

  if (missing.length > 0) {
    appendHookLog({ action: 'BLOCK_STOP', target: targetFile, missing });
    const response = {
      decision: 'block',
      reason: `[Stop 完了ゲート] ${targetFile} が完了基準を満たしていません。以下の ${missing.length} 項目を修正してから完了報告してください:\n- ${missing.join('\n- ')}`
    };
    process.stdout.write(JSON.stringify(response) + '\n');
    process.exit(0);
  }

  appendHookLog({ action: 'PASS_STOP', target: targetFile });
  process.exit(0);
}

module.exports = { inspectHtml };
if (require.main === module) {
  main();
}
