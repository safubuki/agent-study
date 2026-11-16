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

function runHook(scriptRelPath, stdinObj, envOverrides = {}) {
  const scriptPath = path.join(rootDir, scriptRelPath);
  const res = spawnSync(process.execPath, [scriptPath], {
    cwd: rootDir,
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
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hook-guide-test-'));
  const badHtmlPath = path.join(tmpDir, 'bad.html');
  const badHtmlCopilotPath = path.join(tmpDir, 'bad-copilot.html');
  const goodHtmlPath = path.join(tmpDir, 'good.html');

  // 違反のある HTML（インライン style あり、必須要素・viewport・CSS変数・aria-label なし、末尾空白あり）
  const badHtmlSample =
    '<!DOCTYPE html><html><body><h1 style="color:red">テスト</h1>   \n<img src="data:image/gif;base64,R0lGODlhAQABAAAAACw="></body></html>';
  fs.writeFileSync(badHtmlPath, badHtmlSample, 'utf8');
  fs.writeFileSync(badHtmlCopilotPath, badHtmlSample, 'utf8');

  // 全基準を満たす HTML
  fs.writeFileSync(
    goodHtmlPath,
    [
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
    ].join('\n'),
    'utf8'
  );

  const tests = [
    {
      name: '① PreToolUse: .env ファイルの編集を強制ブロックできるか',
      script: 'hooks/guard-write.js',
      input: {
        tool_name: 'Write',
        tool_input: { file_path: '.env', content: 'API_KEY=secret' }
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('.env'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '② PreToolUse: 破壊的コマンド（rm -rf /）を強制ブロックできるか',
      script: 'hooks/guard-write.js',
      input: {
        tool_name: 'Bash',
        tool_input: { command: 'rm -rf /tmp/important' }
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('rm -rf'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '③ PreToolUse: 外部 CDN（https://...）を含む HTML 保存を事前にブロックできるか',
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
      name: '④ PreToolUse: 規約を守った通常の HTML 保存は許可（exit 0）されるか',
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
      name: '⑤ PostToolUse: 保存後にインライン style と alt 抜けを検知して即座に指摘できるか',
      script: 'hooks/post-check.js',
      input: {
        tool_name: 'Write',
        tool_input: { file_path: badHtmlPath }
      },
      check: (r) => r.exitCode === 0 && r.json && r.json.decision === 'block' && r.json.reason.includes('style='),
      explain: (r) => `decision="${r.json && r.json.decision}" / 指摘: "${r.json && r.json.reason.split('\n')[1]}"`
    },
    {
      name: '⑥ Stop（完了ゲート）: 必須要素が足りない HTML のまま完了しようとしたら差し戻すか',
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
      name: '⑦ Stop（無限ループ防止）: stop_hook_active=true のときはブロックせず通過させるか',
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
      name: '⑧ Stop（完了ゲート）: 全基準を満たす HTML なら合格（exit 0・出力なし）になるか',
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
      name: '⑨ Samples(04): UserPromptSubmit で秘密鍵（sk-...）の誤送信をブロックできるか',
      script: 'samples/04-context-injection/hooks/inject-context.js',
      input: {
        prompt: 'APIキー sk-proj-1234567890abcdefghijklmnop を使って接続して'
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('API キー'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '⑩ Samples(04): UserPromptSubmit で通常の指示に Git ブランチ文脈を自動注入できるか',
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
      name: '⑪ Copilot 形式: toolName / toolArgs（JSON 文字列）で届いた .env 作成も同じスクリプトでブロックできるか',
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
      name: '⑫ PreToolUse (MultiEdit): edits 配列内の外部 CDN（https://...）も事前にブロックできるか',
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
      name: '⑬ PreToolUse (PowerShell): Remove-Item -Recurse -Force による再帰削除をブロックできるか',
      script: 'hooks/guard-write.js',
      input: {
        tool_name: 'PowerShell',
        tool_input: { command: 'Remove-Item -Path ./output/tmp -Recurse -Force' }
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('Remove-Item'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '⑭ PreToolUse (保護設定): .claude/settings.local.json の書き換えをブロックできるか',
      script: 'hooks/guard-write.js',
      input: {
        tool_name: 'Edit',
        tool_input: { file_path: '.claude/settings.local.json', new_string: '{}' }
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('settings*.json'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '⑮ PreToolUse (保護設定): .mcp.json の書き換えをブロックできるか',
      script: 'hooks/guard-write.js',
      input: {
        tool_name: 'Write',
        tool_input: { file_path: '.mcp.json', content: '{}' }
      },
      check: (r) => r.exitCode === 2 && r.stderr.includes('mcp.json'),
      explain: (r) => `終了コード ${r.exitCode} / stderr: "${r.stderr.split('\n')[0]}"`
    },
    {
      name: '⑯ PostToolUse (Copilot 形式): decision ではなく additionalContext で違反を指摘できるか',
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
      name: '⑰ Stop (Copilot 形式): stopHookActive=true のときはブロックせず通過させるか',
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
      name: '⑱ PreToolUse (MultiEdit 正常系): 外部 URL を含まない HTML の MultiEdit は許可されるか',
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
      name: '⑲ PreToolUse (PowerShell 正常系): -Recurse なしの単一ファイル削除 Remove-Item は許可されるか',
      script: 'hooks/guard-write.js',
      input: {
        tool_name: 'PowerShell',
        tool_input: { command: 'Remove-Item ./output/tmp/old.html' }
      },
      check: (r) => r.exitCode === 0,
      explain: (r) => `終了コード ${r.exitCode}（正常通過）`
    }
  ];

  console.log('======================================================================');
  console.log(' フック動作テスト（Claude Code なしで模擬 JSON を stdin に流し込む検証）');
  console.log('======================================================================\n');

  let passed = 0;
  for (const t of tests) {
    const res = runHook(t.script, t.input);
    const ok = t.check(res);
    if (ok) passed++;
    const mark = ok ? '[PASS]' : '[FAIL]';
    console.log(`${mark} ${t.name}`);
    console.log(`       → ${t.explain(res)}\n`);
  }

  // 一時ファイルの掃除
  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log('----------------------------------------------------------------------');
  const summary = passed === tests.length ? 'すべて合格' : `${tests.length - passed} 件失敗`;
  console.log(` 結果: ${passed} / ${tests.length} 件（${summary}）`);
  console.log('----------------------------------------------------------------------');

  if (passed !== tests.length) {
    process.exit(1);
  }
}

main();
