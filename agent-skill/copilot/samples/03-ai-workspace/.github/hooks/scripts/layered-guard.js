#!/usr/bin/env node
/**
 * 階層つきの「書き込み禁止」を、1 つのフックで強制する（preToolUse）。Node.js 標準モジュールのみ。
 *
 * .github/policies/*.json を全部読み、編集しようとしているファイルが scope に入るポリシーを集めて判定する。
 *   { "level": "L2", "name": "品質保証部", "scope": ["departments/qa/**"],
 *     "protect": ["departments/qa/standards/**"], "denyExtensions": [".xlsx"], "reason": "…" }
 *
 * 設計のポイント：ポリシーには「許可」を足すキーを**わざと持たせていない**。
 *   → 下の階層（L2・L3）は禁止を足す（厳しくする）ことしかできず、上の階層（L1）の禁止を緩められない。
 *
 * 入力：GitHub Copilot（toolName / toolArgs 文字列 / cwd）と Claude Code（tool_name / tool_input）の両方。
 * 終了コード：0 = 許可、2 = 拒否（理由を stderr で AI に伝える）。入力やポリシーが読めないときは止めない。
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const WRITE_TOOLS = new Set(['edit', 'write', 'multiedit', 'create', 'str_replace_editor', 'apply_patch']);

/** applyTo と同じ書き方のグロブ（** と *）を正規表現にする。 */
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

const matches = (rel, globs) => (globs || []).some((g) => globToRegExp(g).test(rel));

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}

function loadPolicies(root) {
  const dir = path.join(root, '.github', 'policies');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort()
    .map((f) => ({ file: f, ...readJson(path.join(dir, f)) }))
    .filter((p) => Array.isArray(p.scope));
}

function main() {
  let data;
  try { data = JSON.parse(fs.readFileSync(0, 'utf8') || 'null'); } catch { return 0; }
  if (!data) return 0;
  const toolName = String(data.toolName || data.tool_name || '').toLowerCase();
  if (toolName && !WRITE_TOOLS.has(toolName)) return 0;
  let input = data.toolArgs ?? data.tool_input ?? {};
  if (typeof input === 'string') { try { input = JSON.parse(input); } catch { input = {}; } }
  const filePath = input.path || input.file_path || input.filePath;
  if (!filePath) return 0;

  const root = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
  const rel = path.relative(root, path.resolve(root, String(filePath))).split(path.sep).join('/');
  const ext = path.extname(rel).toLowerCase();

  for (const p of loadPolicies(root)) {
    if (!matches(rel, p.scope)) continue; // このポリシーの範囲外
    const hitProtect = matches(rel, p.protect);
    const hitExt = (p.denyExtensions || []).map((e) => e.toLowerCase()).includes(ext);
    if (hitProtect || hitExt) {
      const what = hitProtect ? '書き込み禁止の場所' : `この範囲で作れない形式（${ext}）`;
      process.stderr.write(`[layered-guard] ${rel} は ${p.level}「${p.name}」の${what}です。${p.reason || ''}（${p.file}）回避せず、人に依頼してください。\n`);
      return 2;
    }
  }
  return 0;
}

process.exitCode = main();
