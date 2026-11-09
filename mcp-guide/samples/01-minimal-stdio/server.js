#!/usr/bin/env node
/**
 * 01-minimal-stdio/server.js
 * 外部ライブラリを一切使わず、Node.js 標準機能だけで動く最小の MCP サーバー（stdio 通信）。
 * 標準入力（stdin）から1行ずつ JSON-RPC 2.0 を受け取り、標準出力（stdout）に1行ずつ返します。
 */
const readline = require('node:readline');

const rl = readline.createInterface({ input: process.stdin, terminal: false });

function sendResult(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

rl.on('line', (line) => {
  if (!line.trim()) return;
  let req;
  try {
    req = JSON.parse(line);
  } catch (err) {
    return sendError(null, -32700, 'JSON parse error');
  }

  // 通知メッセージ（id がないもの）は返答不要
  if (req.id === undefined || req.id === null) return;

  if (req.method === 'initialize') {
    return sendResult(req.id, {
      protocolVersion: '2025-11-25',
      capabilities: { tools: {} },
      serverInfo: { name: 'minimal-dice-server', version: '1.0.0' },
    });
  }

  if (req.method === 'tools/list') {
    return sendResult(req.id, {
      tools: [
        {
          name: 'roll_dice',
          description: '指定された面数のサイコロを指定個数だけ振り、各出目と合計値を返します。',
          inputSchema: {
            type: 'object',
            properties: {
              sides: { type: 'number', description: 'サイコロの面数（例：6, 20, 100）', default: 6 },
              count: { type: 'number', description: '振る個数（1〜20）', default: 2 },
            },
            required: ['sides'],
          },
        },
      ],
    });
  }

  if (req.method === 'tools/call') {
    const { name, arguments: args = {} } = req.params || {};
    if (name !== 'roll_dice') {
      return sendError(req.id, -32602, `Unknown tool: ${name}`);
    }
    const sides = Math.max(2, Math.min(1000, Number(args.sides) || 6));
    const count = Math.max(1, Math.min(20, Number(args.count) || 2));
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const total = rolls.reduce((a, b) => a + b, 0);
    return sendResult(req.id, {
      content: [
        {
          type: 'text',
          text: `${sides}面サイコロを${count}個振りました：出目 [${rolls.join(', ')}] ／ 合計 = ${total}`,
        },
      ],
    });
  }

  return sendError(req.id, -32601, `Method not found: ${req.method}`);
});
