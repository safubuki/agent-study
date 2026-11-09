#!/usr/bin/env node
/**
 * パターン⑤-A：監査ログ記録（PostToolUse）
 * - AI が実行したツール名、対象ファイルまたはコマンド概要、時刻を logs/audit.jsonl に追記する
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
  if (!raw.trim()) process.exit(0);

  let data = {};
  try {
    data = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const cwd = data.cwd || process.cwd();
  const logDir = path.join(cwd, 'logs');
  fs.mkdirSync(logDir, { recursive: true });

  const toolName = data.tool_name || data.toolName || 'unknown';
  const toolInput = data.tool_input || data.toolArgs || data.input || {};
  const target =
    toolInput.file_path ||
    toolInput.filePath ||
    toolInput.path ||
    toolInput.command ||
    '';

  const record = {
    timestamp: new Date().toISOString(),
    session_id: data.session_id || 'local',
    event: data.hook_event_name || 'PostToolUse',
    tool: toolName,
    target: String(target).slice(0, 200)
  };

  fs.appendFileSync(path.join(logDir, 'audit.jsonl'), JSON.stringify(record) + '\n', 'utf8');
  process.exit(0);
}

main();
