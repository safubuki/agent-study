#!/usr/bin/env node
/**
 * 05-resources-and-prompts/full-feature-mcp.js
 * Tools（道具）・Resources（参考資料）・Prompts（定型テンプレート）の3機能すべてを実装した MCP サーバー見本。
 */
const readline = require('node:readline');

const rl = readline.createInterface({ input: process.stdin, terminal: false });

function sendResult(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

const RESOURCES = {
  'cafe://manual/brewing-guide': {
    name: 'ハンドドリップ抽出基準書',
    mimeType: 'text/markdown',
    text: `# Kame Cafe ハンドドリップ抽出基準書\n- 粉量：1杯あたり 16g（中細挽き）\n- 湯温：浅煎り 92℃ ／ 中深煎り 88℃ ／ 深煎り 84℃\n- 蒸らし：35ml 注湯後 40秒待機\n- 総抽出量：240ml（目標抽出時間 2分30秒）`,
  },
};

rl.on('line', (line) => {
  if (!line.trim()) return;
  let req;
  try {
    req = JSON.parse(line);
  } catch {
    return sendError(null, -32700, 'Parse error');
  }
  if (req.id === undefined || req.id === null) return;

  // 1. 初期化：tools, resources, prompts の3つすべてに対応していることを宣言
  if (req.method === 'initialize') {
    return sendResult(req.id, {
      protocolVersion: '2025-11-25',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
      serverInfo: { name: 'full-feature-demo-server', version: '1.0.0' },
    });
  }

  // 2. Tools（AI が呼ぶ関数）
  if (req.method === 'tools/list') {
    return sendResult(req.id, {
      tools: [
        {
          name: 'convert_temperature',
          description: '抽出温度の摂氏（℃）と華氏（℉）を相互変換します。',
          inputSchema: {
            type: 'object',
            properties: {
              value: { type: 'number', description: '温度の数値' },
              unit: { type: 'string', enum: ['C', 'F'], description: '入力した値の単位（C または F）' },
            },
            required: ['value', 'unit'],
          },
        },
      ],
    });
  }

  if (req.method === 'tools/call') {
    const { name, arguments: args = {} } = req.params || {};
    if (name !== 'convert_temperature') {
      return sendError(req.id, -32602, `Unknown tool: ${name}`);
    }
    const val = Number(args.value) || 0;
    if (args.unit === 'F') {
      const c = (((val - 32) * 5) / 9).toFixed(1);
      return sendResult(req.id, { content: [{ type: 'text', text: `${val}℉ = ${c}℃` }] });
    }
    const f = ((val * 9) / 5 + 32).toFixed(1);
    return sendResult(req.id, { content: [{ type: 'text', text: `${val}℃ = ${f}℉` }] });
  }

  // 3. Resources（参考資料）
  if (req.method === 'resources/list') {
    return sendResult(req.id, {
      resources: Object.entries(RESOURCES).map(([uri, r]) => ({
        uri,
        name: r.name,
        mimeType: r.mimeType,
        description: '社内バリスタ向けの抽出温度・レシピ基準',
      })),
    });
  }

  if (req.method === 'resources/read') {
    const uri = req.params && req.params.uri;
    const r = RESOURCES[uri];
    if (!r) return sendError(req.id, -32602, `Resource not found: ${uri}`);
    return sendResult(req.id, {
      contents: [{ uri, mimeType: r.mimeType, text: r.text }],
    });
  }

  // 4. Prompts（定型テンプレート）
  if (req.method === 'prompts/list') {
    return sendResult(req.id, {
      prompts: [
        {
          name: 'seasonal-menu-review',
          description: '季節限定メニューの原価率とアレルギー表記を点検するための定型プロンプト',
          arguments: [
            { name: 'season', description: '対象季節（spring / summer / autumn / winter）', required: true },
          ],
        },
      ],
    });
  }

  if (req.method === 'prompts/get') {
    const { name, arguments: args = {} } = req.params || {};
    if (name !== 'seasonal-menu-review') {
      return sendError(req.id, -32602, `Prompt not found: ${name}`);
    }
    const season = args.season || 'autumn';
    return sendResult(req.id, {
      description: `${season} シーズンのメニュー点検プロンプト`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `季節「${season}」の限定メニューを検索し、①特定原材料8品目の表示漏れがないか、②セット割引適用時の原価率が38%以下に収まっているかを点検して表にまとめてください。`,
          },
        },
      ],
    });
  }

  return sendError(req.id, -32601, `Method not found: ${req.method}`);
});
