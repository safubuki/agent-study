#!/usr/bin/env node
/**
 * 02-knowledge-search/glossary-mcp.js
 * パターン①：社内知識・DB の読み取り専用ゲートウェイの見本。
 * glossary.json からキーワード・カテゴリで絞り込み、上限件数（limit）以内の結果だけを返します。
 */
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const glossaryPath = path.join(__dirname, 'glossary.json');
const glossary = JSON.parse(fs.readFileSync(glossaryPath, 'utf8'));

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
  } catch {
    return sendError(null, -32700, 'Parse error');
  }
  if (req.id === undefined || req.id === null) return;

  if (req.method === 'initialize') {
    return sendResult(req.id, {
      protocolVersion: '2025-11-25',
      capabilities: { tools: {} },
      serverInfo: { name: 'company-glossary-gateway', version: '1.0.0' },
    });
  }

  if (req.method === 'tools/list') {
    return sendResult(req.id, {
      tools: [
        {
          name: 'search_glossary',
          description: '社内用語集（読み取り専用）から用語名・カテゴリ・設計ルールを検索し、該当する項目だけを返します。',
          inputSchema: {
            type: 'object',
            properties: {
              keyword: { type: 'string', description: '検索キーワード（空欄なら全件から上位を返す）' },
              category: { type: 'string', description: 'カテゴリ絞り込み（例：認証・会員、バッチ処理、物流・配送、セキュリティ、決済・販促）' },
              limit: { type: 'number', description: '最大取得件数（1〜10、既定5）', default: 5 },
            },
          },
        },
      ],
    });
  }

  if (req.method === 'tools/call') {
    const { name, arguments: args = {} } = req.params || {};
    if (name !== 'search_glossary') {
      return sendError(req.id, -32602, `Unknown tool: ${name}`);
    }
    const kw = (args.keyword || '').toLowerCase().trim();
    const cat = (args.category || '').toLowerCase().trim();
    const limit = Math.max(1, Math.min(10, Number(args.limit) || 5));

    const matched = glossary.filter((item) => {
      const kwOk = !kw || [item.term, item.summary, item.rule].some((v) => v.toLowerCase().includes(kw));
      const catOk = !cat || item.category.toLowerCase().includes(cat);
      return kwOk && catOk;
    });

    const slice = matched.slice(0, limit);
    return sendResult(req.id, {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ totalMatched: matched.length, returnedCount: slice.length, items: slice }, null, 2),
        },
      ],
    });
  }

  return sendError(req.id, -32601, `Method not found: ${req.method}`);
});
