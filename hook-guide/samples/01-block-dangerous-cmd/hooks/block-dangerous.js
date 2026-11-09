#!/usr/bin/env node
/**
 * パターン①：関所・ガードレール（PreToolUse）
 * - 機密ファイル（.env, 秘密鍵, package-lock.json 等）への書き込みをブロック
 * - 破壊的なシェルコマンド（rm -rf /, git push --force, git reset --hard 等）をブロック
 * - ブロック時は終了コード 2（exit 2）と stderr の理由メッセージで AI に別案を促す
 */
const fs = require('fs');

function main() {
  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch {
    process.exit(0);
  }
  if (!raw.trim()) process.exit(0);

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolName = (data.tool_name || data.toolName || '').toLowerCase();
  const toolInput = data.tool_input || data.toolArgs || data.input || {};

  // 1. シェルコマンド（Bash / powershell / execute）の検査
  if (toolName === 'bash' || toolName === 'powershell' || toolName === 'execute') {
    const cmd = String(toolInput.command || toolInput.script || '');
    const dangerousPatterns = [
      { re: /\brm\s+(-[a-zA-Z]*r[a-zA-Z]*f|--recursive)\s+(\/|~|\*|\.\.)/i, msg: 'ルートや親ディレクトリに対する rm -rf は禁止されています。' },
      { re: /\bgit\s+push\s+.*(--force|-f)\b/i, msg: 'git push --force は履歴を破壊するため禁止されています。通常の push または別ブランチを使ってください。' },
      { re: /\bgit\s+reset\s+--hard\b/i, msg: 'git reset --hard は未保存の変更を消去するため禁止されています。git stash 等を使ってください。' },
      { re: /\bdrop\s+(table|database)\b/i, msg: 'DROP TABLE / DATABASE を含むコマンドは禁止されています。' }
    ];

    for (const rule of dangerousPatterns) {
      if (rule.re.test(cmd)) {
        process.stderr.write(`[PreToolUse ガードレール] コマンドをブロックしました: ${rule.msg}\n対象コマンド: ${cmd}\n`);
        process.exit(2);
      }
    }
  }

  // 2. ファイル書き込み（Write / Edit / MultiEdit）の検査
  if (toolName === 'write' || toolName === 'edit' || toolName === 'multiedit' || toolName === 'create') {
    const rawPath = String(toolInput.file_path || toolInput.filePath || toolInput.path || '');
    const normPath = rawPath.replace(/\\/g, '/').toLowerCase();

    const protectedFiles = [
      { test: (p) => p === '.env' || p.endsWith('/.env') || p.includes('.env.'), msg: '.env（環境変数・秘密情報ファイル）の編集は禁止されています。.env.example を編集してください。' },
      { test: (p) => p.endsWith('package-lock.json') || p.endsWith('pnpm-lock.yaml'), msg: 'ロックファイルの手動編集は禁止されています。' },
      { test: (p) => p.includes('/.git/') || p.endsWith('.pem') || p.endsWith('.key'), msg: '.git 内部や秘密鍵ファイルの編集は禁止されています。' }
    ];

    for (const rule of protectedFiles) {
      if (rule.test(normPath)) {
        process.stderr.write(`[PreToolUse ガードレール] ファイル編集をブロックしました: ${rule.msg}\n対象パス: ${rawPath}\n`);
        process.exit(2);
      }
    }
  }

  process.exit(0);
}

main();
