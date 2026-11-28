#!/usr/bin/env node
/**
 * samples/06-wrap-existing-app/run-demo.js
 * このスクリプトが「AI アプリ」の代わり（MCP クライアント）になり、
 *     AI アプリ ⇄ MCP サーバー ⇄ 注文アプリ（既存の Web API）
 * の往復を 1 本ずつ画面に表示します。AI の契約・外部パッケージは不要です（Node.js 20 以降）。
 *
 *   node samples/06-wrap-existing-app/run-demo.js
 *
 * 結果が期待どおりでなければ終了コード 1 を返します（リポジトリの検証でも使います）。
 */
const { spawn } = require('node:child_process');
const path = require('node:path');
const readline = require('node:readline');
const { startOrderApp } = require('./order-app.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const app = await startOrderApp({ port: 0, quiet: true });   // 空いているポートで起動
  const appUrl = `http://127.0.0.1:${app.address().port}`;
  console.log(`🏪 注文アプリ（既存の Web API・MCP は知らない）を起動しました：${appUrl}`);

  const mcp = spawn(process.execPath, [path.join(__dirname, 'order-mcp.js')], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ORDER_APP_URL: appUrl },
  });
  // MCP サーバーが stderr に書く「注文アプリとのやり取り」を字下げして表示する
  readline.createInterface({ input: mcp.stderr }).on('line', (l) => console.log('      ' + l));

  const pending = new Map();
  let nextId = 1;
  readline.createInterface({ input: mcp.stdout }).on('line', (l) => {
    const msg = JSON.parse(l);
    const resolve = pending.get(msg.id);
    if (resolve) { pending.delete(msg.id); resolve(msg); }
  });
  async function request(method, params, label) {
    console.log(`\n[AI アプリ → MCP サーバー] ${label}`);
    const id = nextId++;
    const reply = new Promise((resolve) => pending.set(id, resolve));
    mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    const msg = await reply;
    await sleep(60);   // 先に届いた stderr のログを表示し終えてから結果を出す
    return msg;
  }

  const results = [];
  try {
    await request('initialize', {
      protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'demo-ai-app', version: '1.0.0' },
    }, 'initialize（あいさつ）');
    console.log('[MCP サーバー → AI アプリ] 了解（order-app-bridge）');
    mcp.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

    const list = await request('tools/list', {}, 'tools/list（どんな道具がある？）');
    console.log('[MCP サーバー → AI アプリ] 道具の一覧（LLM はこの説明を読んで、使う道具を選ぶ）');
    for (const t of list.result.tools) console.log(`      🔧 ${t.name}：${t.description}`);

    const calls = [
      ['check_stock', { itemId: 'SW-003' }, '在庫を調べる'],
      ['place_order', { itemId: 'SW-003', qty: 5 }, '在庫より多く頼む'],
      ['place_order', { itemId: 'SW-003', qty: 2 }, 'ちょうど頼む'],
      ['place_order', { itemId: 'DR-001', qty: 999 }, 'ありえない個数を頼む'],
    ];
    for (const [name, args, note] of calls) {
      const res = await request('tools/call', { name, arguments: args }, `tools/call ${name} ${JSON.stringify(args)}（${note}）`);
      const text = res.result?.content?.[0]?.text ?? JSON.stringify(res.error);
      console.log(`[MCP サーバー → AI アプリ] ${text}`);
      results.push(text);
    }
  } finally {
    mcp.kill();
    app.close();
  }

  const expected = ['在庫は 2 個', '注文しませんでした', '注文番号 1001', '注文アプリには送っていません'];
  const ok = expected.every((word, i) => results[i] && results[i].includes(word));
  console.log(ok ? '\n✅ 期待どおりに動きました' : '\n❌ 期待と違う結果があります');
  return ok ? 0 : 1;
}

main().then((code) => { process.exitCode = code; }, (err) => { console.error(err); process.exitCode = 1; });
