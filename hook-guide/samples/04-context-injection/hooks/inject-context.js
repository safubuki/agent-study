#!/usr/bin/env node
/**
 * パターン④：文脈の自動注入（UserPromptSubmit）
 * - プロンプト内に誤って貼り付けられた API キー（sk-... 等）があれば送信前にブロック（exit 2）
 * - 現在の Git ブランチ名とプロジェクトの必須ミニ規約を additionalContext として自動添付
 */
const fs = require('fs');
const { execSync } = require('child_process');

function getGitBranch(cwd) {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 2000
    }).toString().trim();
  } catch {
    return 'unknown';
  }
}

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

  const promptText = String(data.prompt || data.userPrompt || '');

  // 1. うっかり秘密鍵・トークンを貼り付けていないか検査
  const secretPattern = /\b(sk-[a-zA-Z0-9_-]{16,}|ghp_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16})\b/;
  if (secretPattern.test(promptText)) {
    process.stderr.write('[UserPromptSubmit ガード] プロンプト内に API キーまたはトークンのような文字列が含まれているため、送信をブロックしました。秘密情報を伏せてから再送してください。\n');
    process.exit(2);
  }

  // 2. 現在のブランチや時刻など、動的な短い文脈を自動注入
  const cwd = data.cwd || process.cwd();
  const branch = getGitBranch(cwd);
  const ticketMatch = branch.match(/([A-Z]{2,10}-\d+)/);
  const ticketInfo = ticketMatch ? ` / 関連チケット: ${ticketMatch[1]}` : '';

  const contextNote = [
    `[自動注入コンテキスト] 現在のブランチ: ${branch}${ticketInfo}`,
    `[厳守事項] 外部 CDN の読み込みは禁止。変更後は関連テストが通ることを確認すること。`
  ].join('\n');

  const output = {
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: contextNote
    }
  };

  process.stdout.write(JSON.stringify(output) + '\n');
  process.exit(0);
}

main();
