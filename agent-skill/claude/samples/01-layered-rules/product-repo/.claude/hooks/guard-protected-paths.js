#!/usr/bin/env node
/**
 * ベース層の「絶対に守る」ルールを、スキルや指示ではなくフックで強制する例（PreToolUse）。
 *
 * - 製品の校正値（firmware/calibration/ 以下）と秘密ファイル（.env 系）への書き込みを止める
 * - 止めるときは終了コード 2 と stderr の理由で、AI に「回避せず人へ依頼する」よう伝える
 * - Claude Code（tool_name / tool_input）と GitHub Copilot（toolName / toolArgs 文字列）の両方の入力形に対応
 *
 * 手元確認：
 *   echo {"tool_name":"Edit","tool_input":{"file_path":"firmware/calibration/motor-params.json"}} | node guard-protected-paths.js
 *   → 終了コード 2（拒否）
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

// 守る対象（プロジェクトルートからの相対パス、/ 区切り）。
const PROTECTED = [
  { re: /^firmware\/calibration\//, why: '校正値は出荷判定に関わるため、人のレビューなしに変更できません。変更理由と影響をまとめ、担当者への依頼文を作ってください。' },
  { re: /(^|\/)\.env(\.(?!example$|sample$|template$)[^/]*)?$/, why: '秘密情報を含むファイルは編集できません。必要なら .env.example を更新してください。' },
];

function readInput() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    return raw.trim() ? JSON.parse(raw) : null;
  } catch {
    return null; // 入力が読めないときは止めない（フックの不具合で作業全体を止めないため）
  }
}

function toRelative(filePath, cwd) {
  // Claude Code は CLAUDE_PROJECT_DIR、Copilot は入力 JSON の cwd がリポジトリのルート
  const projectDir = process.env.CLAUDE_PROJECT_DIR || cwd || process.cwd();
  const abs = path.resolve(projectDir, filePath);
  return path.relative(projectDir, abs).split(path.sep).join('/');
}

// 書き込み系のツールだけを対象にする（読み取りは止めない）。
// Claude Code：Edit / Write / MultiEdit、Copilot：edit / create（ほか互換名）。
const WRITE_TOOLS = new Set(['edit', 'write', 'multiedit', 'create', 'str_replace_editor', 'apply_patch']);

function main() {
  const data = readInput();
  if (!data) return 0;
  const toolName = String(data.tool_name || data.toolName || '').toLowerCase();
  if (toolName && !WRITE_TOOLS.has(toolName)) return 0;
  let input = data.tool_input ?? data.toolArgs ?? {};
  if (typeof input === 'string') {
    try { input = JSON.parse(input); } catch { input = {}; }
  }
  const filePath = input.file_path || input.path || input.filePath;
  if (!filePath) return 0;

  const rel = toRelative(String(filePath), data.cwd);
  const hit = PROTECTED.find((p) => p.re.test(rel));
  if (!hit) return 0;

  process.stderr.write(`[guard-protected-paths] ${rel} への書き込みを止めました。${hit.why}\n`);
  return 2;
}

process.exitCode = main();
