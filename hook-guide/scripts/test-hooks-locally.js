#!/usr/bin/env node
/**
 * scripts/test-hooks-locally.js
 *
 * Claude Code を起動しなくても、このフォルダの3つのフック
 *   1. hooks/guard-write.js  (PreToolUse: 関所・ガードレール)
 *   2. hooks/post-check.js   (PostToolUse: 自動整形・事後チェック)
 *   3. hooks/stop-verify.js  (Stop: 完了ゲート)
 * および samples/ 内の各サンプルフックに模擬 JSON を流し込み、
 * 「許可（exit 0）」「強制ブロック（exit 2）」「差し戻し（decision: block）」
 * の動きを1秒で体験・検証できるローカルテストスクリプトです。
 */
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const rootDir = path.resolve(__dirname, '..');

function runHook(scriptRelPath, stdinObj, options = {}) {
  const scriptPath = path.join(rootDir, scriptRelPath);
  const { cwd = rootDir, env: envOverrides = {} } = options;
  const res = spawnSync(process.execPath, [scriptPath], {
    cwd,
    input: JSON.stringify(stdinObj),
    encoding: 'utf8',
    env: { ...process.env, HOOK_EXPERIMENT_MODE: 'stop-gate', ...envOverrides }
  });
  let parsedStdout = null;
  if (res.stdout && res.stdout.trim()) {
    try {
      parsedStdout = JSON.parse(res.stdout.trim());
    } catch {
      parsedStdout = res.stdout.trim();
    }
  }
  return {
    exitCode: res.status,
    stdout: res.stdout ? res.stdout.trim() : '',
    stderr: res.stderr ? res.stderr.trim() : '',
    json: parsedStdout
  };
}

function main() {
  const hadGuideLogs = fs.existsSync(path.join(rootDir, 'logs'));
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-guide-test-'));
  const badHtmlPath = path.join(tmpDir, 'bad.html');
  const badHtmlCopilotPath = path.join(tmpDir, 'bad-copilot.html');
  const goodHtmlPath = path.join(tmpDir, 'good.html');

  const relSubDir = path.join(tmpDir, 'sub');
  const relBadHtmlPath = path.join(relSubDir, 'rel-bad.html');
  const relBadCopilotHtmlPath = path.join(relSubDir, 'rel-bad-copilot.html');
  const relFallbackHtmlPath = path.join(relSubDir, 'rel-fallback.html');
  const relFormatBadHtmlPath = path.join(relSubDir, 'format-bad.html');
  const relFormatCopilotHtmlPath = path.join(relSubDir, 'format-copilot.html');
  const relMarkdownPath = path.join(relSubDir, 'note.md');

  const verifyBadDir = path.join(tmpDir, 'verify-bad');
  const verifyGoodDir = path.join(tmpDir, 'verify-good');
  const auditTmpDir = path.join(tmpDir, 'audit-logs');
  const notifyTmpDir = path.join(tmpDir, 'notify-logs');

  fs.mkdirSync(relSubDir, { recursive: true });
  fs.mkdirSync(verifyBadDir, { recursive: true });
  fs.mkdirSync(verifyGoodDir, { recursive: true });
  fs.mkdirSync(auditTmpDir, { recursive: true });
  fs.mkdirSync(notifyTmpDir, { recursive: true });

  // 違反のある HTML（インライン style あり、必須要素・viewport・CSS変数・aria-label なし、末尾空白あり）
  const badHtmlSample =
    '<!DOCTYPE html><html><body><h1 style="color:red">テスト</h1>   \n<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw="></body></html>';
  const badHtmlCrlfSample =
    '<!DOCTYPE html><html><body><h1 style="color:red">テスト</h1>   \r\n<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw="></body></html>  ';
  fs.writeFileSync(badHtmlPath, badHtmlSample, 'utf8');
  fs.writeFileSync(badHtmlCopilotPath, badHtmlSample, 'utf8');
  fs.writeFileSync(relBadHtmlPath, badHtmlCrlfSample, 'utf8');
  fs.writeFileSync(relBadCopilotHtmlPath, badHtmlSample, 'utf8');
  fs.writeFileSync(relFallbackHtmlPath, badHtmlSample, 'utf8');
  fs.writeFileSync(relFormatBadHtmlPath, badHtmlCrlfSample, 'utf8');
  fs.writeFileSync(relFormatCopilotHtmlPath, badHtmlSample, 'utf8');
  fs.writeFileSync(relMarkdownPath, '# Title   \r\n本文  ', 'utf8');
  fs.writeFileSync(path.join(verifyBadDir, 'index.html'), '<html><body><p>未完成</p></body></html>', 'utf8');

  // 全基準を満たす HTML
  const goodHtmlSample = [
    '<!DOCTYPE html>',
    '<html lang="ja">',
    '<head>',
    '  <meta charset="UTF-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '  <style>:root { --primary: #2d5a27; } @media (max-width: 480px) { body { padding: 8px; } }</style>',
    '</head>',
    '<body>',
    '  <header><button aria-label="テーマ切り替え">切替</button></header>',
    '  <main><h1>山田 太郎</h1></main>',
    '  <footer><p>&copy; 2026</p></footer>',
    '</body>',
    '</html>'
  ].join('\n');
  fs.writeFileSync(goodHtmlPath, goodHtmlSample, 'utf8');
  fs.writeFileSync(path.join(verifyGoodDir, 'index.html'), goodHtmlSample, 'utf8');

  const tests = [
    {
      name: '01. PreToolUse: .env ファイルの編集を強制ブロックできるか',
      script: 'hooks/guard-write.js',
      input: {
        tool_name: 'Write',
        tool_input: { file_path: '.env', content: 'API_KEY=secret' }
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('.env'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '02. PreToolUse: 破壊的コマンド（rm -rf /）を強制ブロックできるか',
      script: 'hooks/guard-write.js',
      input: {
        tool_name: 'Bash',
        tool_input: { command: 'rm -rf /tmp/important' }
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('rm -rf'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '03. PreToolUse: 外部 CDN（https://...）を含む HTML 保存を事前にブロックできるか',
      script: 'hooks/guard-write.js',
      input: {
        tool_name: 'Write',
        tool_input: {
          file_path: 'output/test/index.html',
          content: '<link rel="stylesheet" href="https://cdn.example.com/style.css">'
        }
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('外部 URL'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '04. PreToolUse: 規約を守った通常の HTML 保存は許可（exit 0）されるか',
      script: 'hooks/guard-write.js',
      input: {
        tool_name: 'Write',
        tool_input: {
          file_path: 'output/test/index.html',
          content: '<!DOCTYPE html><html lang="ja"><body><h1>OK</h1></body></html>'
        }
      },
      check: (r) => r.exitCode === 0,
      explain: (r) => `終了コード ${r.exitCode}（正常通過）`
    },
    {
      name: '05. PostToolUse: 保存後にインライン style と alt 抜けを検知して即座に指摘できるか',
      script: 'hooks/post-check.js',
      input: {
        tool_name: 'Write',
        tool_input: { file_path: badHtmlPath }
      },
      check: (r) => r.exitCode === 0 && r.json && r.json.decision === 'block' && r.json.reason.includes('style='),
      explain: (r) => `decision="${r.json && r.json.decision}" / 指摘: "${r.json && r.json.reason.split('\n')[1]}"`
    },
    {
      name: '06. Stop（完了ゲート）: 必須要素が足りない HTML のまま完了しようとしたら差し戻すか',
      script: 'hooks/stop-verify.js',
      input: {
        hook_event_name: 'Stop',
        stop_hook_active: false,
        target_file: badHtmlPath
      },
      check: (r) => r.exitCode === 0 && r.json && r.json.decision === 'block',
      explain: (r) => `decision="${r.json && r.json.decision}"（完了を阻止して修正を指示）`
    },
    {
      name: '07. Stop（無限ループ防止）: stop_hook_active=true のときはブロックせず通過させるか',
      script: 'hooks/stop-verify.js',
      input: {
        hook_event_name: 'Stop',
        stop_hook_active: true,
        target_file: badHtmlPath
      },
      check: (r) => r.exitCode === 0 && !r.json,
      explain: (r) => `終了コード ${r.exitCode} / 出力なし（無限ループ防止ガード作動）`
    },
    {
      name: '08. Stop（完了ゲート）: 全基準を満たす HTML なら合格（exit 0・出力なし）になるか',
      script: 'hooks/stop-verify.js',
      input: {
        hook_event_name: 'Stop',
        stop_hook_active: false,
        target_file: goodHtmlPath
      },
      check: (r) => r.exitCode === 0 && !r.json,
      explain: (r) => `終了コード ${r.exitCode} / 全7項目の完了基準クリア！`
    },
    {
      name: '09. Samples(04): UserPromptSubmit で秘密鍵（sk-...）の誤送信をブロックできるか',
      script: 'samples/04-context-injection/hooks/inject-context.js',
      input: {
        prompt: 'APIキー sk-proj-1234567890abcdefghijklmnop を使って接続して'
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('API キー'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '10. Samples(04): UserPromptSubmit で通常の指示に Git ブランチ文脈を自動注入できるか',
      script: 'samples/04-context-injection/hooks/inject-context.js',
      input: {
        prompt: 'ヘッダーのデザインを整えて'
      },
      check: (r) =>
        r.exitCode === 0 &&
        r.json &&
        r.json.hookSpecificOutput &&
        r.json.hookSpecificOutput.additionalContext.includes('現在のブランチ'),
      explain: (r) =>
        `additionalContext: "${r.json && r.json.hookSpecificOutput.additionalContext.split('\n')[0]}"`
    },
    {
      name: '11. Copilot 形式: toolName / toolArgs（JSON 文字列）で届いた .env 作成も同じスクリプトでブロックできるか',
      script: 'hooks/guard-write.js',
      input: {
        sessionId: 'local-test',
        toolName: 'create',
        toolArgs: JSON.stringify({ path: '.env', file_text: 'API_KEY=secret' })
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('.env'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '12. PreToolUse (MultiEdit): edits 配列内の外部 CDN（https://...）も事前にブロックできるか',
      script: 'hooks/guard-write.js',
      input: {
        tool_name: 'MultiEdit',
        tool_input: {
          file_path: 'output/test/index.html',
          edits: [
            { old_string: '<title>旧</title>', new_string: '<title>新</title>' },
            { old_string: '</head>', new_string: '<script src="https://cdn.example.com/app.js"></script></head>' }
          ]
        }
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('外部 URL'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '13. PreToolUse (PowerShell): Remove-Item -Recurse -Force による再帰削除をブロックできるか',
      script: 'hooks/guard-write.js',
      input: {
        tool_name: 'PowerShell',
        tool_input: { command: 'Remove-Item -Path ./output/tmp -Recurse -Force' }
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('Remove-Item'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '14. PreToolUse (保護設定): .claude/settings.local.json の書き換えをブロックできるか',
      script: 'hooks/guard-write.js',
      input: {
        tool_name: 'Edit',
        tool_input: { file_path: '.claude/settings.local.json', new_string: '{}' }
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('settings*.json'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '15. PreToolUse (保護設定): .mcp.json の書き換えをブロックできるか',
      script: 'hooks/guard-write.js',
      input: {
        tool_name: 'Write',
        tool_input: { file_path: '.mcp.json', content: '{}' }
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('mcp.json'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '16. PostToolUse (Copilot 形式): decision ではなく additionalContext で違反を指摘できるか',
      script: 'hooks/post-check.js',
      input: {
        sessionId: 'local-test',
        toolName: 'create',
        toolArgs: JSON.stringify({ path: badHtmlCopilotPath })
      },
      check: (r) =>
        r.exitCode === 0 &&
        r.json &&
        r.json.decision === undefined &&
        typeof r.json.additionalContext === 'string' &&
        r.json.additionalContext.includes('style='),
      explain: (r) => `additionalContext="${r.json && r.json.additionalContext ? r.json.additionalContext.split('\n')[1] : ''}"`
    },
    {
      name: '17. Stop (Copilot 形式): stopHookActive=true のときはブロックせず通過させるか',
      script: 'hooks/stop-verify.js',
      input: {
        sessionId: 'local-test',
        hookEventName: 'agentStop',
        stopHookActive: true,
        target_file: badHtmlPath
      },
      check: (r) => r.exitCode === 0 && !r.json,
      explain: (r) => `終了コード ${r.exitCode} / 出力なし（Copilot 無限ループ防止ガード作動）`
    },
    {
      name: '18. PreToolUse (MultiEdit 正常系): 外部 URL を含まない HTML の MultiEdit は許可されるか',
      script: 'hooks/guard-write.js',
      input: {
        tool_name: 'MultiEdit',
        tool_input: {
          file_path: 'output/test/index.html',
          edits: [
            { old_string: '<title>旧</title>', new_string: '<title>新</title>' },
            { old_string: '<h1>旧</h1>', new_string: '<h1>新</h1>' }
          ]
        }
      },
      check: (r) => r.exitCode === 0,
      explain: (r) => `終了コード ${r.exitCode}（正常通過）`
    },
    {
      name: '19. PreToolUse (PowerShell 正常系): -Recurse なしの単一ファイル削除 Remove-Item は許可されるか',
      script: 'hooks/guard-write.js',
      input: {
        tool_name: 'PowerShell',
        tool_input: { command: 'Remove-Item ./output/tmp/old.html' }
      },
      check: (r) => r.exitCode === 0,
      explain: (r) => `終了コード ${r.exitCode}（正常通過）`
    },
    {
      name: '20. PostToolUse (相対パス + data.cwd): 相対パス解決と自動整形（LF・末尾空白除去）後に違反指摘できるか',
      script: 'hooks/post-check.js',
      input: {
        cwd: tmpDir,
        tool_name: 'Write',
        tool_input: { file_path: 'sub/rel-bad.html' }
      },
      check: (r) => {
        if (r.exitCode !== 0 || !r.json || r.json.decision !== 'block' || !r.json.reason.includes('style=')) {
          return false;
        }
        const saved = fs.readFileSync(relBadHtmlPath, 'utf8');
        return !saved.includes('\r\n') && !/[ \t]+\n/.test(saved) && saved.endsWith('\n');
      },
      explain: (r) => `decision="${r.json && r.json.decision}" / 相対パス解決・LF統一・末尾空白除去を確認`
    },
    {
      name: '21. PostToolUse (Copilot 相対パス + data.cwd): additionalContext で相対パスの違反を指摘できるか',
      script: 'hooks/post-check.js',
      input: {
        sessionId: 'local-test',
        cwd: tmpDir,
        toolName: 'edit',
        toolArgs: JSON.stringify({ path: 'sub/rel-bad-copilot.html' })
      },
      check: (r) =>
        r.exitCode === 0 &&
        r.json &&
        r.json.decision === undefined &&
        typeof r.json.additionalContext === 'string' &&
        r.json.additionalContext.includes('style='),
      explain: (r) => `additionalContext で相対パス対象の違反指摘を確認`
    },
    {
      name: '22. PostToolUse (data.cwd 未指定フォールバック): プロセス cwd 基準で相対パス解決できるか',
      script: 'hooks/post-check.js',
      options: { cwd: tmpDir },
      input: {
        tool_name: 'Write',
        tool_input: { file_path: 'sub/rel-fallback.html' }
      },
      check: (r) => r.exitCode === 0 && r.json && r.json.decision === 'block' && r.json.reason.includes('style='),
      explain: (r) => `decision="${r.json && r.json.decision}"（data.cwd なしフォールバック動作）`
    },
    {
      name: '23. Samples(01): block-dangerous.js が危険コマンド（git reset --hard）をブロックできるか',
      script: 'samples/01-block-dangerous-cmd/hooks/block-dangerous.js',
      input: {
        tool_name: 'Bash',
        tool_input: { command: 'git reset --hard HEAD' }
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('git reset --hard'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '24. Samples(01): block-dangerous.js がロックファイル（package-lock.json）の編集をブロックできるか',
      script: 'samples/01-block-dangerous-cmd/hooks/block-dangerous.js',
      input: {
        sessionId: 'local-test',
        toolName: 'edit',
        toolArgs: JSON.stringify({ path: 'package-lock.json' })
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('ロックファイル'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '25. Samples(01): block-dangerous.js がひな形ファイル（.env.example）の編集を許可（exit 0）するか',
      script: 'samples/01-block-dangerous-cmd/hooks/block-dangerous.js',
      input: {
        tool_name: 'Write',
        tool_input: { file_path: '.env.example', content: 'API_KEY=' }
      },
      check: (r) => r.exitCode === 0 && !r.stderr,
      explain: (r) => `終了コード ${r.exitCode}（ひな形ファイルは許可）`
    },
    {
      name: '26. Samples(02): post-format-check.js が相対パス + data.cwd で自動整形と HTML 検査ができるか',
      script: 'samples/02-auto-format-lint/hooks/post-format-check.js',
      input: {
        cwd: tmpDir,
        tool_name: 'Write',
        tool_input: { file_path: 'sub/format-bad.html' }
      },
      check: (r) => {
        if (r.exitCode !== 0 || !r.json || r.json.decision !== 'block' || !r.json.reason.includes('style=')) {
          return false;
        }
        const saved = fs.readFileSync(relFormatBadHtmlPath, 'utf8');
        return !saved.includes('\r\n') && !/[ \t]+\n/.test(saved) && saved.endsWith('\n');
      },
      explain: (r) => `decision="${r.json && r.json.decision}" / 相対パス解決＋自動整形を確認`
    },
    {
      name: '27. Samples(02): post-format-check.js が Copilot 相対パス + data.cwd で additionalContext を返すか',
      script: 'samples/02-auto-format-lint/hooks/post-format-check.js',
      input: {
        sessionId: 'local-test',
        cwd: tmpDir,
        toolName: 'create',
        toolArgs: JSON.stringify({ path: 'sub/format-copilot.html' })
      },
      check: (r) =>
        r.exitCode === 0 &&
        r.json &&
        r.json.decision === undefined &&
        typeof r.json.additionalContext === 'string' &&
        r.json.additionalContext.includes('style='),
      explain: (r) => `additionalContext で Copilot 形式の指摘を確認`
    },
    {
      name: '28. Samples(02): post-format-check.js が正常な .md を自動整形のみ行い出力なしで通過させるか',
      script: 'samples/02-auto-format-lint/hooks/post-format-check.js',
      input: {
        cwd: tmpDir,
        tool_name: 'Write',
        tool_input: { file_path: 'sub/note.md' }
      },
      check: (r) => r.exitCode === 0 && r.stdout === '' && fs.readFileSync(relMarkdownPath, 'utf8') === '# Title\n本文\n',
      explain: (r) => `終了コード ${r.exitCode} / 出力なし（LF・末尾空白・最終改行を自動整形）`
    },
    {
      name: '29. Samples(03): verify-completion.js が cwd 配下の基準未達 index.html を差し戻すか',
      script: 'samples/03-stop-until-pass/hooks/verify-completion.js',
      input: {
        hook_event_name: 'Stop',
        stop_hook_active: false,
        cwd: verifyBadDir
      },
      check: (r) => r.exitCode === 0 && r.json && r.json.decision === 'block' && r.json.reason.includes('<html lang="ja">'),
      explain: (r) => `decision="${r.json && r.json.decision}"（要件不足を検知して差し戻し）`
    },
    {
      name: '30. Samples(03): verify-completion.js が Copilot 形式（stopHookActive=true）で無限ループを防止するか',
      script: 'samples/03-stop-until-pass/hooks/verify-completion.js',
      input: {
        sessionId: 'local-test',
        hookEventName: 'agentStop',
        stopHookActive: true,
        cwd: verifyBadDir
      },
      check: (r) => r.exitCode === 0 && !r.json && r.stdout === '',
      explain: (r) => `終了コード ${r.exitCode} / 出力なし（Copilot 無限ループ防止ガード作動）`
    },
    {
      name: '31. Samples(03): verify-completion.js が基準を満たす index.html を合格通過させるか',
      script: 'samples/03-stop-until-pass/hooks/verify-completion.js',
      input: {
        hook_event_name: 'Stop',
        stop_hook_active: false,
        cwd: verifyGoodDir
      },
      check: (r) => r.exitCode === 0 && !r.json && r.stdout === '',
      explain: (r) => `終了コード ${r.exitCode} / 全要件クリアで合格通過`
    },
    {
      name: '32. Samples(05): audit-log.js が Claude Code 形式のツール実行を logs/audit.jsonl に記録できるか',
      script: 'samples/05-audit-and-notify/hooks/audit-log.js',
      input: {
        session_id: 'cc-sess-01',
        hook_event_name: 'PostToolUse',
        tool_name: 'Write',
        tool_input: { file_path: 'output/index.html' },
        cwd: auditTmpDir
      },
      check: (r) => {
        if (r.exitCode !== 0) return false;
        const logPath = path.join(auditTmpDir, 'logs', 'audit.jsonl');
        if (!fs.existsSync(logPath)) return false;
        const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
        const last = lines[lines.length - 1];
        return last.session_id === 'cc-sess-01' && last.event === 'PostToolUse' && last.tool === 'Write' && last.target === 'output/index.html';
      },
      explain: (r) => `終了コード ${r.exitCode} / 一時 logs/audit.jsonl に Claude Code 形式を記録`
    },
    {
      name: '33. Samples(05): audit-log.js が Copilot 形式（sessionId / hookEventName / toolArgs.script）を記録できるか',
      script: 'samples/05-audit-and-notify/hooks/audit-log.js',
      input: {
        sessionId: 'cp-sess-02',
        hookEventName: 'postToolUse',
        toolName: 'powershell',
        toolArgs: JSON.stringify({ script: 'Get-ChildItem -Name' }),
        cwd: auditTmpDir
      },
      check: (r) => {
        if (r.exitCode !== 0) return false;
        const logPath = path.join(auditTmpDir, 'logs', 'audit.jsonl');
        if (!fs.existsSync(logPath)) return false;
        const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
        const last = lines[lines.length - 1];
        return last.session_id === 'cp-sess-02' && last.event === 'postToolUse' && last.tool === 'powershell' && last.target === 'Get-ChildItem -Name';
      },
      explain: (r) => `終了コード ${r.exitCode} / sessionId・hookEventName・script の記録を確認`
    },
    {
      name: '34. Samples(05): notify-done.js が Claude Code 形式で terminalSequence JSON を出力しログ記録するか',
      script: 'samples/05-audit-and-notify/hooks/notify-done.js',
      input: {
        session_id: 'cc-sess-01',
        hook_event_name: 'Stop',
        message: 'ビルドが完了しました',
        cwd: notifyTmpDir
      },
      check: (r) => {
        if (r.exitCode !== 0 || !r.json || typeof r.json.terminalSequence !== 'string') return false;
        if (!r.json.terminalSequence.includes('ビルドが完了しました')) return false;
        const logPath = path.join(notifyTmpDir, 'logs', 'notifications.log');
        return fs.existsSync(logPath) && fs.readFileSync(logPath, 'utf8').includes('[Stop] ビルドが完了しました');
      },
      explain: (r) => `terminalSequence JSON 出力＋一時 logs/notifications.log 記録を確認`
    },
    {
      name: '35. Samples(05): notify-done.js が Copilot 形式で terminalSequence を出さずログのみ記録するか',
      script: 'samples/05-audit-and-notify/hooks/notify-done.js',
      input: {
        sessionId: 'cp-sess-02',
        hookEventName: 'agentStop',
        message: 'Copilot 完了',
        cwd: notifyTmpDir
      },
      check: (r) => {
        if (r.exitCode !== 0 || r.stdout !== '' || r.json !== null) return false;
        const logPath = path.join(notifyTmpDir, 'logs', 'notifications.log');
        return fs.existsSync(logPath) && fs.readFileSync(logPath, 'utf8').includes('[agentStop] Copilot 完了');
      },
      explain: (r) => `終了コード ${r.exitCode} / stdout 出力なし＋[agentStop] ログ記録のみを確認`
    }
  ];

  console.log('======================================================================');
  console.log(' フック動作テスト（Claude Code なしで模擬 JSON を stdin に流し込む検証）');
  console.log('======================================================================\n');

  let passed = 0;
  let polluted = false;
  try {
    for (const t of tests) {
      const res = runHook(t.script, t.input, t.options);
      const ok = t.check(res);
      if (ok) passed++;
      const mark = ok ? '[PASS]' : '[FAIL]';
      console.log(`${mark} ${t.name}`);
      console.log(`       → ${t.explain(res)}\n`);
    }
    if (!hadGuideLogs && fs.existsSync(path.join(rootDir, 'logs'))) {
      polluted = true;
      console.log('[FAIL] リポジトリ内に一時ファイル（hook-guide/logs/）が残っています。\n');
    }
  } finally {
    // 一時ファイルの掃除
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log('----------------------------------------------------------------------');
  const summary = passed === tests.length && !polluted ? 'すべて合格' : `${tests.length - passed} 件失敗`;
  console.log(` 結果: ${passed} / ${tests.length} 件（${summary}）`);
  console.log('----------------------------------------------------------------------');

  if (passed !== tests.length || polluted) {
    process.exit(1);
  }
}

main();
