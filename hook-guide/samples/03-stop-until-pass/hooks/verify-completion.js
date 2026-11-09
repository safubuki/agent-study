#!/usr/bin/env node
/**
 * パターン③：完了ゲート（Stop / SubagentStop）
 * - AI が返答を終えて止まろうとしたときに成果物（index.html 等）を検査する
 * - 必須項目が欠けていれば {"decision": "block", "reason": "..."} を返して修正を続行させる
 * - stop_hook_active が true のときは通過させて無限ループを防ぐ
 */
const fs = require('fs');
const path = require('path');

function main() {
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

  // 1. 無限ループ防止：すでに1回 Stop フックで差し戻した直後なら通過させる
  if (data.stop_hook_active === true || data.stopHookActive === true) {
    process.exit(0);
  }

  // 2. 検査対象のファイルを探す（指定がなければカレントの index.html）
  const cwd = data.cwd || process.cwd();
  const targetFile = data.target_file || path.join(cwd, 'index.html');
  if (!fs.existsSync(targetFile)) {
    // まだ index.html を作る作業ではない（単なる質問への返答など）場合はそのまま通す
    process.exit(0);
  }

  const html = fs.readFileSync(targetFile, 'utf8');
  const missing = [];

  if (!/<html\b[^>]*\blang\s*=\s*["']ja["']/i.test(html)) {
    missing.push('<html lang="ja"> が指定されていません');
  }
  if (!/<meta\b[^>]*\bname\s*=\s*["']viewport["']/i.test(html)) {
    missing.push('レスポンシブ用の <meta name="viewport" ...> がありません');
  }
  if (!/<main\b/i.test(html) || !/<footer\b/i.test(html)) {
    missing.push('セマンティックタグ（<main> と <footer>）が揃っていません');
  }
  if (!/@media\b/i.test(html)) {
    missing.push('スマートフォン対応のメディアクエリ（@media）が含まれていません');
  }

  if (missing.length > 0) {
    const response = {
      decision: 'block',
      reason: `[Stop 完了ゲート] 完了条件を満たしていません。以下の項目を修正してから完了してください:\n- ${missing.join('\n- ')}`
    };
    process.stdout.write(JSON.stringify(response) + '\n');
    process.exit(0);
  }

  process.exit(0);
}

main();
