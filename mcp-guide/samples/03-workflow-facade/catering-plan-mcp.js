#!/usr/bin/env node
/**
 * 03-workflow-facade/catering-plan-mcp.js
 * パターン③：複数ステップの処理を1つの高水準な「業務ツール」に束ねるファサード型 MCP サーバー。
 */
const readline = require('node:readline');

const rl = readline.createInterface({ input: process.stdin, terminal: false });

function sendResult(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

// 内部の細かい処理（AI には直接見せず、サーバー内部で確実に順番通り実行する）
function step1VenueFee(venueType, hours) {
  const rate = venueType === 'indoor' ? 8000 : 5000;
  return rate * hours;
}

function step2StaffCost(expectedGuests, hours) {
  const staffCount = Math.max(2, Math.ceil(expectedGuests / 40));
  return { staffCount, cost: staffCount * 1800 * (hours + 1) };
}

function step3SalesAndCost(expectedGuests, unitPrice) {
  const revenue = expectedGuests * unitPrice;
  const ingredientCost = Math.round(revenue * 0.32);
  return { revenue, ingredientCost };
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
      serverInfo: { name: 'catering-workflow-facade', version: '1.0.0' },
    });
  }

  if (req.method === 'tools/list') {
    return sendResult(req.id, {
      tools: [
        {
          name: 'evaluate_catering_plan',
          description:
            'カフェの出張ケータリング計画について、①会場費算出 → ②必要人員・人件費計算 → ③売上・原材料費試算 → ④社内粗利基準（25%以上）の合否判定 を1回でまとめて実行します。',
          inputSchema: {
            type: 'object',
            properties: {
              venueType: { type: 'string', enum: ['indoor', 'outdoor'], description: '会場種別（indoor: 屋内 / outdoor: 屋外）' },
              hours: { type: 'number', description: '開催時間（時間）', default: 5 },
              expectedGuests: { type: 'number', description: '想定来場客数（人）', default: 100 },
              unitPrice: { type: 'number', description: '客単価（円・税抜）', default: 950 },
            },
            required: ['venueType', 'hours', 'expectedGuests', 'unitPrice'],
          },
        },
      ],
    });
  }

  if (req.method === 'tools/call') {
    const { name, arguments: args = {} } = req.params || {};
    if (name !== 'evaluate_catering_plan') {
      return sendError(req.id, -32602, `Unknown tool: ${name}`);
    }
    const venueType = args.venueType === 'outdoor' ? 'outdoor' : 'indoor';
    const hours = Math.max(1, Number(args.hours) || 5);
    const expectedGuests = Math.max(10, Number(args.expectedGuests) || 100);
    const unitPrice = Math.max(300, Number(args.unitPrice) || 950);

    const venueFee = step1VenueFee(venueType, hours);
    const staff = step2StaffCost(expectedGuests, hours);
    const sales = step3SalesAndCost(expectedGuests, unitPrice);
    const operatingProfit = sales.revenue - (venueFee + staff.cost + sales.ingredientCost);
    const profitMarginPct = Number(((operatingProfit / sales.revenue) * 100).toFixed(1));
    const approved = profitMarginPct >= 25.0;

    return sendResult(req.id, {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              approved,
              judgment: approved ? '合格（社内基準の営業利益率25%以上を達成）' : '要見直し（利益率25%未満）',
              summary: {
                revenue: sales.revenue,
                venueFee,
                staffCount: staff.staffCount,
                staffCost: staff.cost,
                ingredientCost: sales.ingredientCost,
                operatingProfit,
                profitMarginPct,
              },
            },
            null,
            2
          ),
        },
      ],
    });
  }

  return sendError(req.id, -32601, `Method not found: ${req.method}`);
});
