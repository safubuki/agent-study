#!/usr/bin/env node
/**
 * samples/06-wrap-existing-app/order-mcp.js
 * 既存の注文アプリ（REST API）を、AI が使える「道具」に包む MCP サーバー（stdio）です。
 *
 *   check_stock  : 在庫を調べる（GET /api/stock を呼ぶ）
 *   place_order  : 在庫を確かめてから注文する（GET /api/stock → POST /api/orders を 1 つの道具にまとめる）
 *
 * 注文アプリの URL と API キーは環境変数で受け取り、AI には見せません。
 * 外部パッケージ不要（Node.js 20 以降。fetch を使います）。
 */
const readline = require('node:readline');

const APP_URL = process.env.ORDER_APP_URL || 'http://127.0.0.1:3939';
const API_KEY = process.env.ORDER_APP_KEY || 'demo-key-123';

// ① 道具の一覧（AI が tools/list で受け取る「メニュー表」）
const TOOLS = [
  {
    name: 'check_stock',
    description: 'カフェの商品 ID を指定して、今の在庫数を調べます。',
    inputSchema: {
      type: 'object',
      properties: { itemId: { type: 'string', description: '商品 ID（例：DR-001）' } },
      required: ['itemId'],
    },
  },
  {
    name: 'place_order',
    description: '在庫を確かめてから商品を注文します。在庫が足りなければ注文しません。1 回に注文できるのは 1〜10 個です。',
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: '商品 ID（例：DR-001）' },
        qty: { type: 'integer', minimum: 1, maximum: 10, description: '個数（1〜10）' },
      },
      required: ['itemId', 'qty'],
    },
  },
];

// 注文アプリの「口」（REST API）を呼ぶ。API キーはここで付ける
async function callApp(method, pathAndQuery, body) {
  console.error(`[MCP サーバー → 注文アプリ] ${method} ${pathAndQuery}${body ? ' ' + JSON.stringify(body) : ''}`);
  const res = await fetch(APP_URL + pathAndQuery, {
    method,
    headers: { 'X-Api-Key': API_KEY, 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  const data = await res.json();
  console.error(`[注文アプリ → MCP サーバー] ${res.status} ${JSON.stringify(data)}`);
  return { status: res.status, data };
}

// ② 呼ばれたときの処理（中身は普通のプログラム）
async function checkStock({ itemId }) {
  const { status, data } = await callApp('GET', '/api/stock?id=' + encodeURIComponent(itemId));
  if (status !== 200) return `在庫を確認できませんでした（${data.error}）`;
  return `${data.name}（${data.itemId}）の在庫は ${data.count} 個です。`;
}

async function placeOrder({ itemId, qty }) {
  if (!Number.isInteger(qty) || qty < 1 || qty > 10) {
    return '注文できるのは 1〜10 個です。注文アプリには送っていません。';   // 柵：頼み間違いをここで止める
  }
  const stock = await callApp('GET', '/api/stock?id=' + encodeURIComponent(itemId));
  if (stock.status !== 200) return `商品が見つかりませんでした（${stock.data.error}）`;
  if (stock.data.count < qty) return `在庫が ${stock.data.count} 個しかないため、注文しませんでした。`;
  const order = await callApp('POST', '/api/orders', { itemId, qty });
  if (order.status !== 201) return `注文できませんでした（${order.data.error}）`;
  return `注文しました：注文番号 ${order.data.orderId}（${stock.data.name} × ${qty}）。残りの在庫は ${order.data.remaining} 個です。`;
}

const HANDLERS = { check_stock: checkStock, place_order: placeOrder };

// ③ 結果の返し方（JSON-RPC 2.0 の決まった形で、1 行ずつ stdout に書く）
const send = (msg) => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...msg }) + '\n');

readline.createInterface({ input: process.stdin, terminal: false }).on('line', async (line) => {
  if (!line.trim()) return;
  let req;
  try { req = JSON.parse(line); } catch { return send({ id: null, error: { code: -32700, message: 'Parse error' } }); }
  if (req.id === undefined) return;   // 通知（id なし）には返事をしない

  if (req.method === 'initialize') {
    return send({ id: req.id, result: {
      protocolVersion: '2025-11-25',
      capabilities: { tools: {} },
      serverInfo: { name: 'order-app-bridge', version: '1.0.0' },
    } });
  }
  if (req.method === 'ping') return send({ id: req.id, result: {} });
  if (req.method === 'tools/list') return send({ id: req.id, result: { tools: TOOLS } });
  if (req.method === 'tools/call') {
    const handler = HANDLERS[req.params?.name];
    if (!handler) return send({ id: req.id, error: { code: -32602, message: `Unknown tool: ${req.params?.name}` } });
    try {
      const text = await handler(req.params.arguments || {});
      return send({ id: req.id, result: { content: [{ type: 'text', text }] } });
    } catch (err) {
      return send({ id: req.id, result: { content: [{ type: 'text', text: '注文アプリにつながりませんでした：' + err.message }], isError: true } });
    }
  }
  return send({ id: req.id, error: { code: -32601, message: 'Method not found' } });
});
