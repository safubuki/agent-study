#!/usr/bin/env node
/**
 * パターン④：文脈の自動注入（Claude Code: UserPromptSubmit ／ Copilot: sessionStart）
 * - プロンプト内に誤って貼り付けられた API キー（sk-... 等）があれば送信前にブロック（exit 2）
 * - 現在の Git ブランチ名とプロジェクトの必須ミニ規約を additionalContext として自動添付
 *
 * 【Copilot での制限】Copilot の userPromptSubmitted は command フックの出力を無視するため、
 *   プロンプトのブロックも指示ごとの添付もできません。Copilot では sessionStart に登録し、
 *   会話の開始時に1回だけ文脈を添付します（sessionStart にはプロンプトが届かないので秘密鍵検査は動きません）。
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

  // Claude Code（UserPromptSubmit）：hookSpecificOutput.additionalContext で添付
  // Copilot（sessionStart、camelCase 形式）：トップレベルの additionalContext で添付
  const isCopilot = data.sessionId !== undefined && data.hook_event_name === undefined;
  const output = isCopilot
    ? { additionalContext: contextNote }
    : {
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: contextNote
        }
      };

  process.stdout.write(JSON.stringify(output) + '\n');
  process.exit(0);
}

main();
