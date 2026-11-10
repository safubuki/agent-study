#!/usr/bin/env node
/**
 * hooks/post-check.js — PostToolUse 自動整形・事後チェックフック
 *
 * 役割：
 * 1. 保存されたファイルの行末空白を除去し、改行コード（LF）と末尾改行を自動で整える
 * 2. HTML ファイルに対して規約チェックを行い、以下の違反があればその場で AI に通知する
 *    （Claude Code は decision:"block"、Copilot は additionalContext。ツールは実行済みなので取り消しではなく「直して」という指摘）：
 *    - インラインの style="..." 属性の使用（すべて <style> タグ内に書く規約）
 *    - <img> タグの alt 属性抜け
 */
const fs = require('fs');

function appendHookLog(entry) {
  const logFile = process.env.HOOK_LOG_FILE;
  if (!logFile) return;
  try {
    fs.appendFileSync(logFile, JSON.stringify({ timestamp: new Date().toISOString(), hook: 'PostToolUse(post-check)', ...entry }) + '\n', 'utf8');
  } catch {
    // ignore
  }
}

function main() {
  if (process.env.HOOK_EXPERIMENT_MODE === 'no-hooks') {
    process.exit(0);
  }

  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch {
    process.exit(0);
  }
  if (!raw.trim()) process.exit(0);

  let data = {};
  try {
    data = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  let toolInput = data.tool_input || data.toolArgs || data.input || {};
  if (typeof toolInput === 'string') {
    // GitHub Copilot では引数が JSON 文字列で届く場合がある
    try { toolInput = JSON.parse(toolInput); } catch { toolInput = {}; }
  }
  const filePath = String(toolInput.file_path || toolInput.filePath || toolInput.path || '');
  if (!filePath || !fs.existsSync(filePath)) process.exit(0);

  if (!/\.(html|css|js)$/i.test(filePath)) process.exit(0);

  // 1. 自動整形（末尾空白カット＋LF統一）
  const original = fs.readFileSync(filePath, 'utf8');
  const formatted = original
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n*$/, '\n');

  const wasFormatted = formatted !== original;
  if (wasFormatted) {
    fs.writeFileSync(filePath, formatted, 'utf8');
  }

  // 2. HTML の事後チェック
  if (/\.html$/i.test(filePath)) {
    const warnings = [];

    const inlineStyleMatch = formatted.match(/<[a-zA-Z0-9-]+\b[^>]*\sstyle\s*=\s*["'][^"']+["'][^>]*>/i);
    if (inlineStyleMatch) {
      warnings.push(`インラインの style="..." 属性は禁止されています（検出: ${inlineStyleMatch[0].slice(0, 80)}）。<style> タグ内の CSS クラスに移してください。`);
    }

    const imgTags = formatted.match(/<img\b[^>]*>/gi) || [];
    for (const tag of imgTags) {
      if (!/\balt\s*=\s*["'][^"']*["']/i.test(tag)) {
        warnings.push(`alt 属性のない <img> タグがあります（検出: ${tag}）。`);
      }
    }

    if (warnings.length > 0) {
      appendHookLog({ action: 'FEEDBACK', target: filePath, warnings });
      const reason = `[PostToolUse 事後チェック] 保存された ${filePath} に規約違反が見つかりました。続けて修正してください:\n- ${warnings.join('\n- ')}`;
      // Copilot（camelCase 形式）の postToolUse は decision を使わず、additionalContext で AI に伝える
      const isCopilot = data.toolArgs !== undefined || (data.toolName !== undefined && data.tool_name === undefined);
      const res = isCopilot ? { additionalContext: reason } : { decision: 'block', reason };
      process.stdout.write(JSON.stringify(res) + '\n');
      process.exit(0);
    }
  }

  appendHookLog({ action: 'PASS', target: filePath, autoFormatted: wasFormatted });
  process.exit(0);
}

main();
