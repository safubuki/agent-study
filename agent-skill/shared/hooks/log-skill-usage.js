#!/usr/bin/env node
/**
 * スキルの利用ログを JSONL に 1 行ずつ追記するフック（Node.js 標準モジュールのみ）。
 *
 * Claude Code
 * - PreToolUse（matcher: "Skill"）：AI が Skill ツールでスキルを呼んだとき → via: "model"
 * - UserPromptSubmit：人が「/スキル名」で呼んだとき → via: "user"
 * GitHub Copilot（.github/hooks/*.json）
 * - preToolUse：.../skills/<名前>/SKILL.md の読み取り（view）→ via: "read"（推定。スキル専用のツール名が公式資料に無いため）
 * - userPromptSubmitted：人が「/スキル名」で呼んだとき → via: "user"
 *
 * 記録するのは「いつ・どのスキルが・どう呼ばれたか」だけ。依頼文そのものは記録しない（個人情報・機密対策）。
 * どんな入力でも作業を止めない（常に終了コード 0）。ログが書けなくても黙って終わる。
 *
 * 出力先：環境変数 SKILL_USAGE_LOG があればそのファイル、なければ
 *        $CLAUDE_PROJECT_DIR/.skill-usage/usage.jsonl（.gitignore に入れる想定）
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function readInput() {
  try {
    const raw = fs.readFileSync(0, 'utf8');
    return raw.trim() ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** 入力から { skill, via } を取り出す。スキルの呼び出しでなければ null。 */
function extract(data) {
  const event = data.hook_event_name || data.hookEventName || '';
  const toolName = String(data.tool_name || data.toolName || '').toLowerCase();
  if (toolName === 'skill') {
    let input = data.tool_input ?? data.toolArgs ?? {};
    if (typeof input === 'string') {
      try { input = JSON.parse(input); } catch { input = {}; }
    }
    const skill = input.skill || input.name || input.command;
    return skill ? { skill: String(skill).replace(/^\//, ''), via: 'model' } : null;
  }
  // GitHub Copilot：スキル専用のツール名が公式資料に無いため、SKILL.md の読み取り（view など）で推定する
  if (['view', 'read', 'read_file'].includes(toolName)) {
    let input = data.toolArgs ?? data.tool_input ?? {};
    if (typeof input === 'string') {
      try { input = JSON.parse(input); } catch { input = {}; }
    }
    const p = String(input.path || input.file_path || input.filePath || '').replace(/\\/g, '/');
    const m = p.match(/(?:^|\/)skills\/([^/]+)\/SKILL\.md$/i);
    return m ? { skill: m[1], via: 'read' } : null;
  }
  if (event === 'UserPromptSubmit' || typeof data.prompt === 'string') {
    const m = String(data.prompt || '').trim().match(/^\/([A-Za-z0-9_:.-]+)/);
    return m ? { skill: m[1], via: 'user' } : null;
  }
  return null;
}

function main() {
  const data = readInput();
  if (!data) return;
  const hit = extract(data);
  if (!hit) return;
  const projectDir = process.env.CLAUDE_PROJECT_DIR || data.cwd || process.cwd();
  const logPath = process.env.SKILL_USAGE_LOG || path.join(projectDir, '.skill-usage', 'usage.jsonl');
  const record = {
    ts: new Date().toISOString(),
    skill: hit.skill,
    via: hit.via,
    session: data.session_id || data.sessionId || null,
  };
  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, JSON.stringify(record) + '\n', 'utf8');
  } catch {
    // ログが書けなくても作業は止めない
  }
}

main();
process.exitCode = 0;
