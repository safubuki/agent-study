#!/usr/bin/env node
/**
 * パターン⑤-B：通知フック（Notification / Stop）
 * - AI が入力待ち・確認待ち・完了になったことをログとベル文字（\u0007）で知らせる
 */
const fs = require('fs');

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

  const eventName = data.hook_event_name || 'Notification';
  const msg = data.message || data.title || 'AI エージェントが入力待ち、または作業を完了しました。';

  // ターミナルのベル音（\u0007）とメッセージを stderr に出力（stdout は JSON 用に空けておく）
  process.stderr.write(`\u0007[${eventName}] ${msg}\n`);
  process.exit(0);
}

main();
