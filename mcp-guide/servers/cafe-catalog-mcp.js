#!/usr/bin/env node
/**
 * servers/cafe-catalog-mcp.js
 * 架空カフェ「Kame Cafe（カメカフェ）」のメニュー・アレルギー・セット価格・原価率を提供する MCP サーバー。
 * 外部パッケージ（npm install）は一切不要で、Node.js 標準モジュールのみで動作します。
 *
 * 提供する Tools:
 *   1. search_menu         : カテゴリ・季節・価格上限・ヴィーガン・キーワードでメニューを検索
 *   2. check_allergens     : 指定したアレルゲン（コンタミ含む選択可）を一切含まない安全なメニューだけを抽出
 *   3. calculate_set_price : 注文商品IDリストから、セット割引（150円引）・税込価格（10%/8%）・原価率目標判定を一括計算
 *
 * 提供する Resources:
 *   - cafe://rules/allergen-and-pricing : 店舗の価格・税率・セット割引・アレルギー表示ポリシー
 */
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const catalogPath = path.join(__dirname, '..', 'data', 'menu-catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const rl = readline.createInterface({ input: process.stdin, terminal: false });

function sendResult(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function sendError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

function formatItemSummary(item) {
  const taxEatIn = Math.floor(item.priceExTax * (1 + catalog.rules.taxRateEatIn));
  const taxTakeout = Math.floor(item.priceExTax * (1 + catalog.rules.taxRateTakeout));
  const costRatioPct = Number(((item.costYen / item.priceExTax) * 100).toFixed(1));
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    season: item.season,
    priceExTax: item.priceExTax,
    priceIncTaxEatIn: taxEatIn,
    priceIncTaxTakeout: item.takeoutAvailable ? taxTakeout : null,
    costYen: item.costYen,
    costRatioPct,
    caloriesKcal: item.caloriesKcal,
    caffeineMg: item.caffeineMg,
    allergens: item.allergens,
    crossContamination: item.crossContamination,
    vegan: item.vegan,
    takeoutAvailable: item.takeoutAvailable,
    description: item.description,
  };
}

function handleSearchMenu(args = {}) {
  const category = (args.category || '').toLowerCase().trim();
  const season = (args.season || '').toLowerCase().trim();
  const maxPriceExTax = args.maxPriceExTax !== undefined ? Number(args.maxPriceExTax) : null;
  const veganOnly = Boolean(args.veganOnly);
  const caffeineFreeOnly = Boolean(args.caffeineFreeOnly);
  const keyword = (args.keyword || '').toLowerCase().trim();

  const matched = catalog.items.filter((item) => {
    if (category && category !== 'all' && item.category !== category) return false;
    if (season && season !== 'any') {
      if (season === 'autumn_only' && item.season !== 'autumn') return false;
      if (season === 'autumn' && item.season !== 'autumn' && item.season !== 'all') return false;
      if (season === 'all' && item.season !== 'all') return false;
    }
    if (maxPriceExTax !== null && !Number.isNaN(maxPriceExTax) && item.priceExTax > maxPriceExTax) return false;
    if (veganOnly && !item.vegan) return false;
    if (caffeineFreeOnly && item.caffeineMg > 0) return false;
    if (keyword) {
      const hay = `${item.id} ${item.name} ${item.description}`.toLowerCase();
      if (!hay.includes(keyword)) return false;
    }
    return true;
  });

  return {
    totalMatched: matched.length,
    items: matched.map(formatItemSummary),
  };
}

function handleCheckAllergens(args = {}) {
  const excludeList = Array.isArray(args.excludeAllergens) ? args.excludeAllergens : [];
  const includeCrossContamination = args.strictCrossContamination !== false; // 既定で true（コンタミも除外）
  const category = (args.category || '').toLowerCase().trim();

  const safeItems = [];
  const excludedItems = [];

  for (const item of catalog.items) {
    if (category && category !== 'all' && item.category !== category) continue;

    const hitDirect = item.allergens.filter((a) => excludeList.includes(a));
    const hitCross = includeCrossContamination
      ? item.crossContamination.filter((a) => excludeList.includes(a))
      : [];

    if (hitDirect.length === 0 && hitCross.length === 0) {
      safeItems.push(formatItemSummary(item));
    } else {
      excludedItems.push({
        id: item.id,
        name: item.name,
        category: item.category,
        matchedDirectAllergens: hitDirect,
        matchedCrossContamination: hitCross,
      });
    }
  }

  return {
    excludeAllergens: excludeList,
    strictCrossContamination: includeCrossContamination,
    safeCount: safeItems.length,
    safeItems,
    excludedCount: excludedItems.length,
    excludedItems,
  };
}

function handleCalculateSetPrice(args = {}) {
  const itemIds = Array.isArray(args.itemIds) ? args.itemIds : [];
  const diningType = args.diningType === 'takeout' ? 'takeout' : 'eatin';

  const selected = [];
  const notFoundIds = [];

  for (const id of itemIds) {
    const found = catalog.items.find((it) => it.id === id);
    if (found) selected.push(found);
    else notFoundIds.push(id);
  }

  if (notFoundIds.length > 0) {
    return { error: `存在しない商品IDが含まれています: ${notFoundIds.join(', ')}` };
  }

  const takeoutUnavailable =
    diningType === 'takeout' ? selected.filter((it) => !it.takeoutAvailable).map((it) => `${it.id}(${it.name})`) : [];

  const hasDrink = selected.some((it) => it.category === 'drink');
  const hasFoodOrSweet = selected.some((it) => it.category === 'food' || it.category === 'sweet');
  const setDiscountApplied = hasDrink && hasFoodOrSweet;
  const discountYen = setDiscountApplied ? catalog.rules.setDiscountYen : 0;

  const subtotalExTax = selected.reduce((sum, it) => sum + it.priceExTax, 0);
  const discountedExTax = Math.max(0, subtotalExTax - discountYen);
  const totalCostYen = selected.reduce((sum, it) => sum + it.costYen, 0);

  const taxRate = diningType === 'takeout' ? catalog.rules.taxRateTakeout : catalog.rules.taxRateEatIn;
  const taxAmountYen = Math.floor(discountedExTax * taxRate);
  const totalIncTax = discountedExTax + taxAmountYen;

  const totalCaloriesKcal = selected.reduce((sum, it) => sum + it.caloriesKcal, 0);
  const totalCaffeineMg = selected.reduce((sum, it) => sum + it.caffeineMg, 0);

  const allAllergens = Array.from(new Set(selected.flatMap((it) => it.allergens)));
  const allCross = Array.from(new Set(selected.flatMap((it) => it.crossContamination)));

  const costRatioPct = discountedExTax > 0 ? Number(((totalCostYen / discountedExTax) * 100).toFixed(1)) : 0;
  const grossProfitYen = discountedExTax - totalCostYen;
  const meetsCostTarget = costRatioPct <= catalog.rules.targetCostRatioMaxPct;

  return {
    items: selected.map((it) => ({ id: it.id, name: it.name, category: it.category, priceExTax: it.priceExTax, costYen: it.costYen })),
    diningType,
    takeoutWarnings: takeoutUnavailable,
    pricing: {
      subtotalExTax,
      setDiscountApplied,
      discountYen,
      discountedExTax,
      taxRatePct: taxRate * 100,
      taxAmountYen,
      totalIncTax,
    },
    profitability: {
      totalCostYen,
      grossProfitYen,
      costRatioPct,
      targetMaxPct: catalog.rules.targetCostRatioMaxPct,
      meetsCostTarget,
      judgment: meetsCostTarget
        ? `合格（原価率 ${costRatioPct}% ≦ 目標上限 ${catalog.rules.targetCostRatioMaxPct}%）`
        : `基準超過（原価率 ${costRatioPct}% ＞ 目標上限 ${catalog.rules.targetCostRatioMaxPct}%）`,
    },
    nutritionAndAllergens: {
      totalCaloriesKcal,
      totalCaffeineMg,
      combinedAllergens: allAllergens,
      combinedCrossContamination: allCross,
    },
  };
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
      capabilities: {
        tools: {},
        resources: {},
      },
      serverInfo: {
        name: 'cafe-catalog-mcp',
        version: '1.0.0',
      },
    });
  }

  if (req.method === 'tools/list') {
    return sendResult(req.id, {
      tools: [
        {
          name: 'search_menu',
          description:
            'Kame Cafe のメニューをカテゴリ・季節・税抜上限価格・ヴィーガン・ノンカフェイン・キーワードで検索し、税込価格や原価率つきの正確な一覧を返します。',
          inputSchema: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                enum: ['all', 'drink', 'food', 'sweet'],
                description: 'カテゴリ絞り込み（all / drink / food / sweet）',
              },
              season: {
                type: 'string',
                enum: ['any', 'all', 'autumn_only'],
                description: '季節絞り込み（any: すべて / all: 通年メニューのみ / autumn_only: 秋限定メニューのみ）',
              },
              maxPriceExTax: {
                type: 'number',
                description: '税抜価格の上限（円）',
              },
              veganOnly: {
                type: 'boolean',
                description: 'true の場合、ヴィーガン対応メニューのみを返す',
              },
              caffeineFreeOnly: {
                type: 'boolean',
                description: 'true の場合、ノンカフェイン（0mg）のメニューのみを返す',
              },
              keyword: {
                type: 'string',
                description: '商品名や説明文に含まれるキーワード',
              },
            },
          },
        },
        {
          name: 'check_allergens',
          description:
            '除外したいアレルゲン（例：["乳", "卵", "小麦"]）を指定し、該当アレルゲンを含まない安全なメニュー一覧と、除外されたメニューの理由を正確に判定して返します。',
          inputSchema: {
            type: 'object',
            properties: {
              excludeAllergens: {
                type: 'array',
                items: { type: 'string' },
                description: '除外したいアレルゲン名の配列（例：["乳", "卵", "小麦", "くるみ", "えび", "大豆"]）',
              },
              strictCrossContamination: {
                type: 'boolean',
                description: 'true（既定）なら製造ラインの微量混入（コンタミネーション）がある商品も安全側から除外する。false なら原材料に直接含まれるものだけを除外する。',
                default: true,
              },
              category: {
                type: 'string',
                enum: ['all', 'drink', 'food', 'sweet'],
                description: 'カテゴリ絞り込み（省略時は全カテゴリ）',
              },
            },
            required: ['excludeAllergens'],
          },
        },
        {
          name: 'calculate_set_price',
          description:
            '商品IDの配列（例：["FD-001", "DR-002"]）と利用形態（eatin / takeout）を受け取り、セット割引（150円引）の適用判定、消費税（10%/8%・端数切り捨て）、合計カロリー、合算アレルゲン、および原価率（目標35.0%以下か）を一括で正確に計算します。',
          inputSchema: {
            type: 'object',
            properties: {
              itemIds: {
                type: 'array',
                items: { type: 'string' },
                description: '注文する商品IDの配列（例：["FD-004", "DR-006"]）',
              },
              diningType: {
                type: 'string',
                enum: ['eatin', 'takeout'],
                description: '利用形態（eatin: 店内飲食 税率10% ／ takeout: 持ち帰り 税率8%）',
                default: 'eatin',
              },
            },
            required: ['itemIds'],
          },
        },
      ],
    });
  }

  if (req.method === 'tools/call') {
    const { name, arguments: args = {} } = req.params || {};
    let data;
    if (name === 'search_menu') {
      data = handleSearchMenu(args);
    } else if (name === 'check_allergens') {
      data = handleCheckAllergens(args);
    } else if (name === 'calculate_set_price') {
      data = handleCalculateSetPrice(args);
    } else {
      return sendError(req.id, -32602, `Unknown tool: ${name}`);
    }
    return sendResult(req.id, {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    });
  }

  if (req.method === 'resources/list') {
    return sendResult(req.id, {
      resources: [
        {
          uri: 'cafe://rules/allergen-and-pricing',
          name: 'Kame Cafe 価格・税率・アレルギー表示ポリシー',
          mimeType: 'application/json',
          description: 'イートイン/テイクアウト税率、セット割引条件、目標原価率上限（35%）、アレルゲン表示規定',
        },
      ],
    });
  }

  if (req.method === 'resources/read') {
    const uri = req.params && req.params.uri;
    if (uri !== 'cafe://rules/allergen-and-pricing') {
      return sendError(req.id, -32602, `Resource not found: ${uri}`);
    }
    return sendResult(req.id, {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ cafeName: catalog.cafeName, rules: catalog.rules }, null, 2),
        },
      ],
    });
  }

  return sendError(req.id, -32601, `Method not found: ${req.method}`);
});
