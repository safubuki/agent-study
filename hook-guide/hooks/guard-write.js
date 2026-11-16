#!/usr/bin/env node
/**
 * hooks/guard-write.js — PreToolUse 関所フック
 *
 * 役割：
 * 1. 保護対象ファイル（.env, hooks/*, scripts/*, settings*.json, hooks.json, *mcp.json）の書き換えを exit 2 でブロック
 * 2. 破壊的なシェルコマンド（rm -rf, Remove-Item -Recurse, git reset --hard 等）を exit 2 でブロック
 * 3. HTML ファイルへの書き込み（Write / Edit / MultiEdit）時、禁止されている「外部 CDN（http:// / https:// の script・link・img）」が含まれていたら保存前に exit 2 でブロック
 */
const fs = require('fs');

const DANGEROUS_COMMAND_RULES = [
  {
    re: /\brm\s+(-[a-zA-Z]*(?:r[a-zA-Z]*f|f[a-zA-Z]*r)[a-zA-Z]*|--recursive)\b/i,
    reason: 'rm -rf による強制削除は禁止されています。必要なファイルのみ個別に扱ってください。',
  },
  {
    re: /\b(?:remove-item|ri)\b(?=.*\s-(?:r|re|rec|recu|recur|recurs|recurse)\b)/i,
    reason: 'Remove-Item -Recurse による再帰削除は禁止されています。必要なファイルのみ個別に扱ってください。',
  },
  {
    re: /\b(?:rmdir|rd|del|erase)\b(?=.*\s\/s\b)/i,
    reason: 'rmdir /s や del /s による一括削除は禁止されています。必要なファイルのみ個別に扱ってください。',
  },
  {
    re: /\bgit\s+(reset\s+--hard|push\s+.*(--force|-f))\b/i,
    reason: 'git reset --hard や git push --force は禁止されています。',
  },
];

const EXTERNAL_TAG_RE = /<(script|link|img)\b[^>]*(src|href)\s*=\s*["']https?:\/\/[^"']+["'][^>]*>/i;

/**
 * Write / Edit / MultiEdit / Copilot 各種ツール引数から書き込まれる文字列一覧を取り出す。
 */
function extractWrittenContents(toolInput) {
  const contents = [];
  for (const key of ['content', 'new_string', 'file_text', 'new_str']) {
    if (typeof toolInput[key] === 'string' && toolInput[key]) {
      contents.push(toolInput[key]);
    }
  }
  if (Array.isArray(toolInput.edits)) {
    for (const edit of toolInput.edits) {
      if (!edit || typeof edit !== 'object') continue;
      for (const key of ['new_string', 'content', 'new_str']) {
        if (typeof edit[key] === 'string' && edit[key]) {
          contents.push(edit[key]);
        }
      }
    }
  }
  return contents;
}

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

  // 1. Bash / PowerShell / コマンド実行の検査
  if (toolName === 'bash' || toolName === 'powershell' || toolName === 'execute') {
    const cmd = String(toolInput.command || toolInput.script || '');
    for (const rule of DANGEROUS_COMMAND_RULES) {
      if (rule.re.test(cmd)) {
        block(rule.reason, cmd);
      }
    }
    appendHookLog({ action: 'ALLOW', tool: toolName, target: cmd.slice(0, 120) });
    process.exit(0);
  }

  // 2. ファイル書き込み（Write / Edit / MultiEdit / create）の検査
  if (toolName === 'write' || toolName === 'edit' || toolName === 'multiedit' || toolName === 'create') {
    const rawPath = String(toolInput.file_path || toolInput.filePath || toolInput.path || '');
    const normPath = rawPath.replace(/\\/g, '/');

    // (a) 保護ファイルの変更禁止
    if (/(^|\/)\.env(\.|$)/i.test(normPath)) {
      block('.env ファイルの作成・編集は禁止されています。', rawPath);
    }
    if (
      /(^|\/)(hooks|scripts)\//i.test(normPath) ||
      /(^|\/)(settings(\.local)?\.json|hooks\.json|\.mcp\.json|mcp\.json)$/i.test(normPath)
    ) {
      block('フック・設定・実験スクリプト（hooks/, scripts/, settings*.json, hooks.json, mcp.json）を書き換えることは禁止されています。', rawPath);
    }

    // (b) HTML ファイルの中身の事前検査（外部リソースの禁止：MultiEdit の edits 配列にも対応）
    if (/\.html$/i.test(normPath)) {
      for (const content of extractWrittenContents(toolInput)) {
        const externalTag = content.match(EXTERNAL_TAG_RE);
        if (externalTag) {
          block(
            '外部 URL（http:// または https://）の script / link / img タグは禁止されています。外部フォント・CDN・外部画像は使わず、CSS や SVG で1ファイル内に自作してください。',
            externalTag[0]
          );
        }
      }
    }

    appendHookLog({ action: 'ALLOW', tool: toolName, target: normPath });
  }

  process.exit(0);
}

main();
