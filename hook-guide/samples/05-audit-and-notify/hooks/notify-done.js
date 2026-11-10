#!/usr/bin/env node
/**
 * パターン⑤-B：通知フック（Notification / Stop）
 * - AI が確認待ち・入力待ち・完了になったことを、ベル音とデスクトップ通知で知らせる
 *
 * 【重要】フックは画面（ターミナル）につながっていない裏方のプロセスとして動くため、
 *   ベル文字（\u0007）を stdout / stderr にそのまま書いても音は鳴りません。
 *   Claude Code では、JSON の terminalSequence に制御文字を入れて返すと、
 *   Claude Code が自分の画面に書き出して代わりに鳴らしてくれます（対話モードのときだけ有効）。
 *   - \u0007            … ベル音（BEL）
 *   - \u001b]9;本文\u0007 … Windows Terminal / iTerm2 / WezTerm などのデスクトップ通知（OSC 9）
 *
 * GitHub Copilot にはこの仕組みがないため、通知したい場合はスクリプト内で
 * OS の通知コマンドや Slack の Webhook などを呼び出してください。
 * どちらの環境でも、通知の記録は logs/notifications.log に1行ずつ残します。
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

  let data = {};
  try {
    data = raw.trim() ? JSON.parse(raw) : {};
  } catch {
    process.exit(0);
  }

  const eventName = data.hook_event_name || (data.sessionId ? 'agentStop' : 'Notification');
  const rawMsg =
    data.message ||
    data.title ||
    (eventName === 'Notification' ? 'AI エージェントが確認・入力を待っています。' : 'AI エージェントが作業を終えました。');
  // 通知本文に制御文字が混ざると制御シーケンスが壊れるため取り除く
  const msg = String(rawMsg).replace(/[\u0000-\u001f\u007f]/g, ' ').slice(0, 200);

  // 記録用のログ（Claude Code / Copilot 共通）
  try {
    const logDir = path.join(data.cwd || process.cwd(), 'logs');
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(path.join(logDir, 'notifications.log'), `${new Date().toISOString()} [${eventName}] ${msg}\n`, 'utf8');
  } catch {
    // ログが書けなくても通知は続ける
  }

  // Claude Code に「ベル音＋デスクトップ通知」を代わりに出してもらう
  const output = { terminalSequence: `\u0007\u001b]9;${msg}\u0007` };
  process.stdout.write(JSON.stringify(output) + '\n');
  process.exit(0);
}

main();
