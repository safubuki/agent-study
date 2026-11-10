#!/usr/bin/env node
/**
 * hooks/guard-write.js — PreToolUse 関所フック
 *
 * 役割：
 * 1. 保護対象ファイル（.env, hooks/*, scripts/*, settings.json）の書き換えを exit 2 でブロック
 * 2. 破壊的なシェルコマンド（rm -rf, git reset --hard 等）を exit 2 でブロック
 * 3. HTML ファイルへの書き込み時、禁止されている「外部 CDN（http:// / https:// の script・link・img）」が含まれていたら保存前に exit 2 でブロック
 */
const fs = require('fs');

function appendHookLog(entry) {
  const logFile = process.env.HOOK_LOG_FILE;
  if (!logFile) return;
  try {
    fs.appendFileSync(logFile, JSON.stringify({ timestamp: new Date().toISOString(), hook: 'PreToolUse(guard-write)', ...entry }) + '\n', 'utf8');
  } catch {
    // ignore logging error
  }
}

function block(reason, detail) {
  appendHookLog({ action: 'BLOCK', reason, detail });
  process.stderr.write(`[PreToolUse 関所フック: ブロック] ${reason}\n${detail ? `詳細: ${detail}\n` : ''}`);
  process.exit(2);
}

function main() {
  // 実験モード A（no-hooks）のときは何もしないで通過
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

  const toolName = (data.tool_name || data.toolName || '').toLowerCase();
  let toolInput = data.tool_input || data.toolArgs || data.input || {};
  if (typeof toolInput === 'string') {
    // GitHub Copilot では引数が JSON 文字列で届く場合がある
    try { toolInput = JSON.parse(toolInput); } catch { toolInput = {}; }
  }

  // 1. Bash / コマンド実行の検査
  if (toolName === 'bash' || toolName === 'powershell' || toolName === 'execute') {
    const cmd = String(toolInput.command || toolInput.script || '');
    if (/\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|--recursive)\b/i.test(cmd)) {
      block('rm -rf による強制削除は禁止されています。必要なファイルのみ個別に扱ってください。', cmd);
    }
    if (/\bgit\s+(reset\s+--hard|push\s+.*(--force|-f))\b/i.test(cmd)) {
      block('git reset --hard や git push --force は禁止されています。', cmd);
    }
    appendHookLog({ action: 'ALLOW', tool: toolName, target: cmd.slice(0, 120) });
    process.exit(0);
  }

  // 2. ファイル書き込み（Write / Edit / MultiEdit）の検査
  if (toolName === 'write' || toolName === 'edit' || toolName === 'multiedit' || toolName === 'create') {
    const rawPath = String(toolInput.file_path || toolInput.filePath || toolInput.path || '');
    const normPath = rawPath.replace(/\\/g, '/');

    // (a) 保護ファイルの変更禁止
    if (/(^|\/)\.env(\.|$)/i.test(normPath)) {
      block('.env ファイルの作成・編集は禁止されています。', rawPath);
    }
    if (/(^|\/)(hooks|scripts)\//i.test(normPath) || normPath.endsWith('settings.json')) {
      block('フックや実験スクリプト自身（hooks/, scripts/, settings.json）を書き換えることは禁止されています。', rawPath);
    }

    // (b) HTML ファイルの中身の事前検査（外部リソースの禁止）
    if (/\.html$/i.test(normPath)) {
      // Claude Code: content / new_string、Copilot: file_text / new_str
      const content = String(toolInput.content || toolInput.new_string || toolInput.file_text || toolInput.new_str || '');
      const externalTag = content.match(/<(script|link|img)\b[^>]*(src|href)\s*=\s*["']https?:\/\/[^"']+["'][^>]*>/i);
      if (externalTag) {
        block(
          '外部 URL（http:// または https://）の script / link / img タグは禁止されています。外部フォント・CDN・外部画像は使わず、CSS や SVG で1ファイル内に自作してください。',
          externalTag[0]
        );
      }
    }

    appendHookLog({ action: 'ALLOW', tool: toolName, target: normPath });
  }

  process.exit(0);
}

main();
