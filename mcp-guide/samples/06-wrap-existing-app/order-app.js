#!/usr/bin/env node
/**
 * samples/06-wrap-existing-app/order-app.js
 * 「既存のアプリ」の見本：カフェの在庫・注文システム（のつもりの小さな Web API）です。
 * MCP のことは何も知りません。普通の HTTP の口（REST API）を持っているだけです。
 *
 *   GET  /api/stock?id=DR-001        … 在庫を返す
 *   POST /api/orders  {itemId, qty}  … 注文を受け付け、在庫を減らす
 *   どちらも X-Api-Key ヘッダーが必要（鍵を持っているのは MCP サーバーだけ）
 *
 * 単体で起動： node order-app.js   → http://127.0.0.1:3939 で待ち受け（Ctrl+C で終了）
 */
const http = require('node:http');

const API_KEY = process.env.ORDER_APP_KEY || 'demo-key-123';

function createStock() {
  return {
    'DR-001': { name: '深煎りカメブレンド', count: 12 },
    'FD-001': { name: 'グリル野菜とフムスの米粉フォカッチャサンド', count: 5 },
    'SW-003': { name: '紅はるかと米粉のスイートポテトタルト', count: 2 },
  };
}

function startOrderApp({ port = Number(process.env.ORDER_APP_PORT || 3939), quiet = false } = {}) {
  const stock = createStock();
  let nextOrderId = 1001;

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const send = (code, body) => {
      res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(body));
    };
    if (!quiet) console.log(`[注文アプリ] ${req.method} ${url.pathname}${url.search} を受け付けました`);
    if (req.headers['x-api-key'] !== API_KEY) return send(401, { error: 'API キーが違います' });

    if (req.method === 'GET' && url.pathname === '/api/stock') {
      const id = url.searchParams.get('id');
      const item = stock[id];
      if (!item) return send(404, { error: `商品 ${id} はありません` });
      return send(200, { itemId: id, name: item.name, count: item.count });
    }

    if (req.method === 'POST' && url.pathname === '/api/orders') {
      let raw = '';
      req.on('data', (chunk) => { raw += chunk; });
      req.on('end', () => {
        let body;
        try { body = JSON.parse(raw); } catch { return send(400, { error: 'JSON が読めません' }); }
        const item = stock[body.itemId];
        if (!item) return send(404, { error: `商品 ${body.itemId} はありません` });
        if (!Number.isInteger(body.qty) || body.qty < 1) return send(400, { error: '個数が正しくありません' });
        if (item.count < body.qty) return send(409, { error: `在庫が ${item.count} 個しかありません` });
        item.count -= body.qty;
        return send(201, { orderId: nextOrderId++, itemId: body.itemId, qty: body.qty, remaining: item.count });
      });
      return undefined;
    }

    return send(404, { error: 'その窓口はありません' });
  });

  return new Promise((resolve) => server.listen(port, '127.0.0.1', () => resolve(server)));
}

module.exports = { startOrderApp };

if (require.main === module) {
  startOrderApp().then((server) => {
    console.log(`注文アプリを起動しました：http://127.0.0.1:${server.address().port}（Ctrl+C で終了）`);
  });
}
