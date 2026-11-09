#!/usr/bin/env node
/**
 * scripts/test-mcp-server.js
 * Claude Code や VS Code を起動しなくても、MCP サーバーを子プロセスとして起動し、
 * JSON-RPC 2.0 の通信（initialize → tools/list → tools/call 等）が正しく動くかを
 * 1秒で検証・可視化するテストスクリプトです。
 *
 * 使い方:
 *   node scripts/test-mcp-server.js
 *   node scripts/test-mcp-server.js samples/01-minimal-stdio/server.js
 */
const { spawn } = require('node:child_process');
const path = require('node:path');
const readline = require('node:readline');

const fs = require('node:fs');
const baseDir = path.resolve(__dirname, '..');
const targetRel = process.argv[2] || 'servers/cafe-catalog-mcp.js';
const targetPath = fs.existsSync(path.resolve(process.cwd(), targetRel))
  ? path.resolve(process.cwd(), targetRel)
  : path.resolve(baseDir, targetRel);

console.log('==========================================================');
console.log(`MCP サーバー通信テスト開始: ${path.relative(process.cwd(), targetPath)}`);
console.log('==========================================================\n');

const child = spawn(process.execPath, [targetPath], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

const rl = readline.createInterface({ input: child.stdout, terminal: false });
const pending = new Map();
let nextId = 1;

rl.on('line', (line) => {
  if (!line.trim()) return;
  const msg = JSON.parse(line);
  if (msg.id !== undefined && pending.has(msg.id)) {
    const { resolve } = pending.get(msg.id);
    pending.delete(msg.id);
    resolve(msg);
  }
});

function request(method, params = {}) {
  const id = nextId++;
  const payload = { jsonrpc: '2.0', id, method, params };
  console.log(`>>> [送信 Client -> Server] (${method})`);
  console.log(JSON.stringify(payload));
  child.stdin.write(JSON.stringify(payload) + '\n');
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Timeout waiting for response to ${method} (id=${id})`));
    }, 5000);
    pending.set(id, {
      resolve: (res) => {
        clearTimeout(timer);
        console.log(`<<< [受信 Server -> Client] (${method})`);
        console.log(JSON.stringify(res, null, 2));
        console.log('');
        resolve(res);
      },
    });
  });
}

(async () => {
  try {
    // Step 1: initialize
    const initRes = await request('initialize', {
      protocolVersion: '2025-11-25',
      capabilities: {},
      clientInfo: { name: 'local-test-client', version: '1.0.0' },
    });

    // initialized 通知を送る
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

    // Step 2: tools/list
    const toolsRes = await request('tools/list', {});
    const tools = (toolsRes.result && toolsRes.result.tools) || [];
    console.log(`--- 検出されたツール数: ${tools.length} 個 (${tools.map((t) => t.name).join(', ')}) ---\n`);

    // Step 3: 代表的なツールを実際に1〜3個呼んでみる
    const toolNames = new Set(tools.map((t) => t.name));

    if (toolNames.has('check_allergens') && toolNames.has('calculate_set_price')) {
      // ルートの cafe-catalog-mcp.js の場合
      await request('tools/call', {
        name: 'check_allergens',
        arguments: {
          excludeAllergens: ['小麦', '卵', '乳'],
          strictCrossContamination: true,
        },
      });

      await request('tools/call', {
        name: 'calculate_set_price',
        arguments: {
          itemIds: ['FD-001', 'DR-001'],
          diningType: 'eatin',
        },
      });
    } else if (toolNames.has('roll_dice')) {
      await request('tools/call', {
        name: 'roll_dice',
        arguments: { sides: 6, count: 3 },
      });
    } else if (toolNames.has('search_glossary')) {
      await request('tools/call', {
        name: 'search_glossary',
        arguments: { keyword: 'ポイント', limit: 3 },
      });
    } else if (toolNames.has('evaluate_catering_plan')) {
      await request('tools/call', {
        name: 'evaluate_catering_plan',
        arguments: { venueType: 'indoor', hours: 5, expectedGuests: 100, unitPrice: 950 },
      });
    } else if (toolNames.has('convert_temperature')) {
      await request('tools/call', {
        name: 'convert_temperature',
        arguments: { value: 92, unit: 'C' },
      });
    }

    // Step 4: resources / prompts があれば一覧を確認
    const caps = (initRes.result && initRes.result.capabilities) || {};
    if (caps.resources) {
      await request('resources/list', {});
    }
    if (caps.prompts) {
      await request('prompts/list', {});
    }

    console.log('==========================================================');
    console.log('結果: すべての JSON-RPC 通信テストが正常に完了しました！');
    console.log('==========================================================');
    child.kill();
    process.exit(0);
  } catch (err) {
    console.error('テスト中にエラーが発生しました:', err);
    child.kill();
    process.exit(1);
  }
})();
