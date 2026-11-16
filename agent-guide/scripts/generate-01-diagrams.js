#!/usr/bin/env node
// agent-guide/docs/01_copilot-subagent-guide.md 用の SVG ベクター図 3 枚を生成する。
// 外部パッケージ不要（Node.js 標準モジュールのみ）。
// 実行: node agent-guide/scripts/generate-01-diagrams.js

const fs = require('node:fs');
const path = require('node:path');

const OUT_DIR = path.resolve(__dirname, '../docs/assets');
fs.mkdirSync(OUT_DIR, { recursive: true });

const WIDTH = 1200;
const FONT_FAMILY = "'Noto Sans JP', 'Yu Gothic UI', Meiryo, sans-serif";

const PALETTE = {
  user: { id: 'user', color: '#475569', fill: '#f8fafc', border: '#94a3b8' },
  ui: { id: 'ui', color: '#2563eb', fill: '#eff6ff', border: '#93c5fd' },
  model: { id: 'model', color: '#7c3aed', fill: '#f5f3ff', border: '#a78bfa' },
  harness: { id: 'harness', color: '#059669', fill: '#ecfdf5', border: '#34d399' },
  tool: { id: 'tool', color: '#0e7490', fill: '#ecfeff', border: '#67e8f9' },
  warn: { id: 'warn', color: '#b45309', fill: '#fffbeb', border: '#f59e0b' },
};

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  })[c]);

const estWidth = (str, size) => {
  let w = 0;
  for (const ch of String(str)) {
    w += /[\x00-\x7f]/.test(ch) ? size * 0.56 : size * 1.05;
  }
  return w;
};

class Diagram {
  constructor(filename, title, subtitle) {
    this.filename = filename;
    this.title = title;
    this.subtitle = subtitle;
    this.bgParts = [];
    this.parts = [];
    this.textBoxes = [];
    this.warnings = [];
    this.y = 224;
  }

  rect(x, y, w, h, fill = '#ffffff', stroke = 'none', rx = 10, target = this.parts, extra = '') {
    target.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}"${extra ? ' ' + extra : ''}/>`);
  }

  text(x, y, value, size = 16, color = '#334155', weight = 400, anchor = 'start', bounds = [20, 8, 1160, 4000], halo = null) {
    const str = String(value);
    const w = estWidth(str, size);
    const x0 = anchor === 'middle' ? x - w / 2 : anchor === 'end' ? x - w : x;
    const x1 = x0 + w;
    const y0 = y - size * 0.85;
    const y1 = y + size * 0.25;

    const [bx, by, bw, bh] = bounds;
    if (x0 < bx - 1 || x1 > bx + bw + 1 || y0 < by - 1 || y1 > by + bh + 1) {
      this.warnings.push(`[overflow] "${str}" (${x0.toFixed(1)}..${x1.toFixed(1)}, ${y0.toFixed(1)}..${y1.toFixed(1)}) exceeds bounds [${bx}..${bx + bw}, ${by}..${by + bh}]`);
    }
    if (x0 < 8 || x1 > WIDTH - 8) {
      this.warnings.push(`[canvas] "${str}" exceeds SVG width (${x0.toFixed(1)}..${x1.toFixed(1)})`);
    }

    for (const prev of this.textBoxes) {
      const overlapX = x0 < prev.x1 - 1 && x1 > prev.x0 + 1;
      const overlapY = y0 < prev.y1 - 1 && y1 > prev.y0 + 1;
      if (overlapX && overlapY) {
        this.warnings.push(`[overlap] "${str}" overlaps "${prev.str}"`);
      }
    }
    this.textBoxes.push({ x0, y0, x1, y1, str });

    if (halo) {
      this.parts.push(
        `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="none" stroke="${halo}" stroke-width="6.5" stroke-linejoin="round" stroke-linecap="round">${esc(str)}</text>`
      );
    }
    this.parts.push(
      `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${esc(str)}</text>`
    );
  }

  pill(x, y, w, h, label, fill, textColor, stroke = 'none', size = 12.5) {
    this.rect(x, y, w, h, fill, stroke, Math.round(h / 2));
    this.text(x + w / 2, y + h / 2 + size * 0.36, label, size, textColor, 700, 'middle', [x + 4, y, w - 8, h]);
  }

  line(x1, y1, x2, y2, role = 'harness', opts = {}) {
    const { dashed = false, arrowEnd = true, arrowStart = false, width = 2 } = opts;
    const stroke = PALETTE[role].color;
    const attrs = [
      `x1="${x1}"`,
      `y1="${y1}"`,
      `x2="${x2}"`,
      `y2="${y2}"`,
      `stroke="${stroke}"`,
      `stroke-width="${width}"`,
      dashed ? 'stroke-dasharray="5 5"' : '',
      arrowEnd ? `marker-end="url(#arrow-${role})"` : '',
      arrowStart ? `marker-start="url(#arrow-start-${role})"` : '',
    ].filter(Boolean).join(' ');
    this.parts.push(`<line ${attrs}/>`);
  }

  path(d, role = 'harness', opts = {}) {
    const { dashed = false, arrowEnd = true, width = 2 } = opts;
    const stroke = PALETTE[role].color;
    const attrs = [
      `d="${d}"`,
      'fill="none"',
      `stroke="${stroke}"`,
      `stroke-width="${width}"`,
      dashed ? 'stroke-dasharray="5 5"' : '',
      arrowEnd ? `marker-end="url(#arrow-${role})"` : '',
    ].filter(Boolean).join(' ');
    this.parts.push(`<path ${attrs}/>`);
  }

  noteBox(y, lines) {
    const h = lines.length * 26 + 26;
    this.rect(28, y, 1144, h, '#f8fafc', '#e2e8f0', 10);
    lines.forEach((line, i) => {
      this.text(44, y + 29 + i * 26, line, 15, '#475569', 400, 'start', [36, y + 4, 1128, h - 8]);
    });
    return y + h;
  }

  save(height, notes, sequenceActors = null) {
    const bg = this.bgParts;
    const body = this.parts;
    this.bgParts = [];
    this.parts = [];
    this.textBoxes = [];

    const out = [];
    out.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-labelledby="title desc" font-family="${FONT_FAMILY}">`);
    out.push('<!-- Generated by ../scripts/generate-01-diagrams.js. -->');
    out.push(`<title id="title">${esc(this.title)}</title>`);
    out.push(`<desc id="desc">${esc(this.subtitle)}</desc>`);
    out.push('<defs>');
    for (const p of Object.values(PALETTE)) {
      out.push(`<marker id="arrow-${p.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${p.color}"/></marker>`);
      out.push(`<marker id="arrow-start-${p.id}" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M10 0 L0 5 L10 10 Z" fill="${p.color}"/></marker>`);
    }
    out.push('</defs>');

    // 外枠・タイトル・サブタイトル
    this.rect(1, 1, WIDTH - 2, height - 2, '#ffffff', '#e2e8f0', 18);
    this.text(28, 48, this.title, 26, '#0f172a', 700, 'start', [24, 10, 1152, 50]);
    this.text(28, 80, this.subtitle, 15.5, '#475569', 400, 'start', [24, 56, 1152, 34]);

    if (sequenceActors) {
      this.text(
        28,
        106,
        '列順を固定　上→下が時間　矢印の色＝送り手　実線＝依頼・ファイル書込　横破線＝完了報告',
        12.5,
        '#475569',
        400,
        'start',
        [24, 88, 1152, 26]
      );
      this.parts.push(...bg);
      for (const a of sequenceActors) {
        this.parts.push(`<g data-participant="${a.id}">`);
        this.parts.push(`<line x1="${a.x}" y1="194" x2="${a.x}" y2="${this.y - 6}" stroke="${a.color}" stroke-width="1.4" stroke-dasharray="4 6" opacity="0.65"/>`);
        this.rect(a.x - 90, 124, 180, 70, a.fill, a.color, 9);
        this.text(a.x, 152, a.name, 17, a.color, 700, 'middle', [a.x - 84, 128, 168, 34]);
        this.text(a.x, 178, a.sub, 12, '#475569', 400, 'middle', [a.x - 84, 158, 168, 28]);
        this.parts.push('</g>');
      }
      for (const a of sequenceActors) {
        this.rect(a.x - 90, this.y - 6, 180, 34, a.fill, a.color, 6);
        this.text(a.x, this.y + 17, a.name, 14.5, a.color, 700, 'middle', [a.x - 84, this.y - 4, 168, 30]);
      }
    } else {
      this.parts.push(...bg);
    }

    this.parts.push(...body);
    const noteY = sequenceActors ? this.y + 42 : height - (notes.length * 26 + 26) - 22;
    this.noteBox(noteY, notes);

    out.push(...this.parts);
    out.push('</svg>');

    const targetPath = path.join(OUT_DIR, this.filename);
    fs.writeFileSync(targetPath, out.join('\n') + '\n', 'utf8');
    return { filename: this.filename, height, warnings: this.warnings };
  }
}

class SequenceDiagram extends Diagram {
  constructor(filename, title, subtitle, actors) {
    super(filename, title, subtitle);
    this.actors = actors;
    this.actorMap = Object.fromEntries(actors.map((a) => [a.id, a]));
  }

  phase(label, repeatHeaders = false) {
    this.rect(24, this.y, 1152, 36, '#f8fafc', '#e2e8f0', 6, this.bgParts);
    this.text(40, this.y + 24, label, 16.5, '#334155', 700, 'start', [32, this.y + 2, 1136, 32], '#f8fafc');
    this.y += 58;
    if (repeatHeaders) {
      for (const a of this.actors) {
        this.rect(a.x - 90, this.y - 8, 180, 32, a.fill, a.color, 6);
        this.text(a.x, this.y + 13, a.name, 14.5, a.color, 700, 'middle', [a.x - 84, this.y - 6, 168, 28]);
      }
      this.y += 46;
    }
  }

  message(from, to, labels, reply = false) {
    const lines = Array.isArray(labels) ? labels : [labels];
    const a = this.actorMap[from];
    const b = this.actorMap[to];
    const center = (a.x + b.x) / 2;
    const top = this.y;
    const maxW = Math.max(...lines.map((l) => estWidth(l, 15.5)));
    const textLeft = center - maxW / 2 - 4;
    const textRight = center + maxW / 2 + 4;
    const crossesLine = this.actors.some((act) => textLeft < act.x && act.x < textRight);
    const halo = crossesLine ? '#ffffff' : null;
    const spanBoundsLeft = Math.max(20, Math.min(a.x, b.x) - 96);
    const spanBoundsRight = Math.min(1180, Math.max(a.x, b.x) + 96);
    lines.forEach((line, i) => {
      this.text(center, top + 20 + i * 24, line, 15.5, a.color, 600, 'middle', [spanBoundsLeft, top - 2, spanBoundsRight - spanBoundsLeft, lines.length * 24 + 8], halo);
    });
    const arrowY = top + lines.length * 24 + 10;
    this.line(a.x, arrowY, b.x, arrowY, a.role, { dashed: reply, width: reply ? 1.6 : 2 });
    this.y = arrowY + 22;
  }

  finishSequence(notes) {
    const height = this.y + 42 + notes.length * 26 + 26 + 22;
    return this.save(height, notes, this.actors);
  }
}

const results = [];

// =========================================================================
// 図 1: Copilot の「どこで動かすか」（ハーネスと実行ランタイムの最新整理）
// =========================================================================
{
  const d = new Diagram(
    'subagent-01-harnesses.svg',
    'GitHub Copilot の実行先とハーネス（どこで動かすか）',
    '同じ .github/agents/*.agent.md を読み込みつつ、VS Code（旧 Local／推奨 Copilot）と CLI・クラウドで経路が分かれる。'
  );

  // 上段：共通エージェント定義ファイル
  d.rect(280, 114, 640, 68, PALETTE.tool.fill, PALETTE.tool.color, 11, d.parts, 'stroke-width="1.6"');
  d.text(600, 143, '.github/agents/*.agent.md', 19, PALETTE.tool.color, 700, 'middle', [296, 118, 608, 34]);
  d.text(600, 169, 'プロジェクト共通のエージェント定義（VS Code・Copilot CLI・クラウドで読込）', 14, '#475569', 400, 'middle', [296, 148, 608, 28]);

  // 定義ファイルからの破線ルート（各環境が読み込む）
  d.path('M600 182 V206', 'tool', { dashed: true, arrowEnd: false, width: 1.6 });
  d.path('M200 206 H1164', 'tool', { dashed: true, arrowEnd: false, width: 1.6 });
  d.path('M200 206 V316', 'tool', { dashed: true, arrowEnd: true, width: 1.6 });
  d.path('M528 206 V316', 'tool', { dashed: true, arrowEnd: true, width: 1.6 });
  d.path('M997 206 V316', 'tool', { dashed: true, arrowEnd: true, width: 1.6 });
  d.path('M1164 206 V596 H1152', 'tool', { dashed: true, arrowEnd: true, width: 1.6 });

  // 左：VS Code のチャット（外枠）
  d.rect(28, 234, 670, 428, PALETTE.ui.fill, PALETTE.ui.border, 14, d.bgParts, 'stroke-width="1.6"');
  d.text(364, 268, 'VS Code のチャット', 20, '#1e40af', 700, 'middle', [266, 240, 196, 36]);
  d.text(364, 293, 'Session Target でハーネスを切替可能', 13.5, '#475569', 400, 'middle', [236, 272, 256, 28]);

  // VS Code 内 1: 旧 Local ハーネス（非推奨）
  d.rect(44, 316, 312, 194, PALETTE.warn.fill, PALETTE.warn.color, 11, d.parts, 'stroke-width="1.6"');
  d.pill(60, 330, 232, 26, '非推奨・2027年2月まで削除予定', '#fef3c7', '#92400e', PALETTE.warn.color, 12);
  d.text(60, 383, '旧 Local ハーネス', 19, '#92400e', 700, 'start', [56, 358, 284, 32]);
  d.text(60, 412, 'VS Code の Extension Host で動作', 13.5, '#334155', 400, 'start', [56, 392, 284, 26]);
  d.text(60, 438, '会話がエディタ窓に結び付く', 13.5, '#334155', 400, 'start', [56, 418, 284, 26]);
  d.text(60, 464, '委任：agent（内部名 runSubagent）', 13.5, '#92400e', 700, 'start', [56, 444, 284, 26]);
  d.text(60, 490, '本書では「VS Code 版」として対比', 13.5, '#475569', 400, 'start', [56, 470, 284, 26]);

  // VS Code 内 2: Copilot ハーネス（推奨・後継）
  d.rect(372, 316, 312, 194, PALETTE.harness.fill, PALETTE.harness.color, 11, d.parts, 'stroke-width="2"');
  d.pill(388, 330, 178, 26, '推奨・後継（CLI 相当）', PALETTE.harness.color, '#ffffff', 'none', 12.5);
  d.text(388, 383, 'Copilot ハーネス', 19, PALETTE.harness.color, 700, 'start', [384, 358, 284, 32]);
  d.text(388, 412, 'Session Target → Copilot で選択', 13.5, '#334155', 400, 'start', [384, 392, 284, 26]);
  d.text(388, 438, 'Agent Host がセッションを保持', 13.5, '#334155', 400, 'start', [384, 418, 284, 26]);
  d.text(388, 464, '委任：agent（内部名 task）', 13.5, '#065f46', 700, 'start', [384, 444, 284, 26]);
  d.text(388, 490, 'CLI と同じ実行ランタイムを使用', 13.5, '#475569', 400, 'start', [384, 470, 284, 26]);

  // VS Code 内 3: Claude / Codex ハーネス
  d.rect(44, 528, 640, 116, '#f8fafc', '#94a3b8', 10, d.parts, 'stroke-width="1.4"');
  d.text(62, 562, 'Claude ハーネス ／ Codex ハーネス', 17.5, '#334155', 700, 'start', [56, 536, 380, 34]);
  d.pill(446, 542, 222, 26, '企業管理設定で無効の可能性', '#e2e8f0', '#475569', '#94a3b8', 12);
  d.text(62, 596, 'VS Code 内で他社製ハーネスを使う選択肢。', 14, '#475569', 400, 'start', [56, 574, 610, 28]);
  d.text(62, 622, '組織・企業の管理設定が適用されている環境では無効になります。', 14, '#475569', 400, 'start', [56, 600, 610, 28]);

  // 右上：Copilot CLI
  d.rect(842, 316, 310, 194, PALETTE.harness.fill, PALETTE.harness.color, 11, d.parts, 'stroke-width="1.8"');
  d.pill(858, 330, 152, 26, '本書では「CLI 版」', PALETTE.harness.color, '#ffffff', 'none', 12.5);
  d.text(858, 383, 'Copilot CLI', 19, PALETTE.harness.color, 700, 'start', [854, 358, 284, 32]);
  d.text(858, 412, 'ターミナルで copilot コマンドを実行', 13.5, '#334155', 400, 'start', [854, 392, 284, 26]);
  d.text(858, 438, '対話（/agent）や --agent で起動', 13.5, '#334155', 400, 'start', [854, 418, 284, 26]);
  d.text(858, 464, '委任：task（/fleet で並列実行）', 13.5, '#065f46', 700, 'start', [854, 444, 284, 26]);
  d.text(858, 490, 'モデル名は CLI 用 ID で指定', 13.5, '#475569', 400, 'start', [854, 470, 284, 26]);

  // 共有ランタイムの接続ブリッジ（Copilot ハーネス <-> Copilot CLI）
  d.line(684, 414, 842, 414, 'harness', { arrowEnd: true, arrowStart: true, width: 2.4 });
  d.rect(708, 358, 124, 44, '#ecfdf5', '#059669', 8);
  d.text(770, 377, '同じ実行', 13, '#065f46', 700, 'middle', [712, 360, 116, 22]);
  d.text(770, 395, 'ランタイム', 13, '#065f46', 700, 'middle', [712, 378, 116, 22]);
  d.text(770, 436, '共通基盤', 12.5, '#059669', 700, 'middle', [706, 418, 128, 26]);

  // 右下：Copilot クラウドエージェント
  d.rect(842, 528, 310, 116, '#f8fafc', '#64748b', 11, d.parts, 'stroke-width="1.4"');
  d.pill(858, 542, 126, 24, '本書では扱わない', '#e2e8f0', '#475569', 'none', 12);
  d.text(858, 592, 'Copilot クラウドエージェント', 17.5, '#334155', 700, 'start', [854, 568, 284, 32]);
  d.text(858, 622, 'GitHub 上（Issue 依頼など）で動作', 13.5, '#475569', 400, 'start', [854, 602, 284, 26]);

  results.push(
    d.save(776, [
      '旧 Local ハーネスは非推奨（2027 年 2 月までに削除予定）。新規に試す場合は VS Code の Session Target → Copilot（推奨）を選ぶ。',
      'Copilot ハーネスと Copilot CLI は同じ実行ランタイムを共有し、委任ツールは task になる（個人設定や拡張ツールは別管理）。',
    ])
  );
}

// =========================================================================
// 図 2: 子ごとに違う会社のモデルを使う例
// =========================================================================
{
  const d = new Diagram(
    'subagent-01-multi-model.svg',
    'Copilot サブエージェント：子ごとに別会社のモデルを割り当てる例',
    'Claude Code は Claude 系列のみ。Copilot は会社で有効な他社モデルを子ごとに指定できる（割り当て例は筆者の設定）。'
  );

  // 左：親エージェント
  d.rect(32, 134, 376, 326, PALETTE.ui.fill, PALETTE.ui.color, 12, d.parts, 'stroke-width="2"');
  d.pill(52, 152, 148, 28, '親エージェント', PALETTE.ui.color, '#ffffff', 'none', 13.5);
  d.text(52, 212, 'page-director', 22, '#1e40af', 700, 'start', [48, 184, 344, 36]);
  d.text(52, 242, '全体の設計・発注・検品・統合を担当', 15, '#334155', 400, 'start', [48, 220, 344, 28]);

  d.rect(52, 264, 336, 72, '#ffffff', PALETTE.ui.border, 9);
  d.text(68, 294, 'model: Claude Opus 5.5 (copilot)', 14.5, '#1e40af', 700, 'start', [60, 268, 320, 32]);
  d.text(68, 320, '提供元：Anthropic（一番強いランク）', 13, '#475569', 400, 'start', [60, 298, 320, 28]);

  d.text(52, 368, 'tools: [\'agent\', \'read\', \'edit\', \'search\']', 13.5, '#334155', 400, 'start', [48, 346, 344, 28]);
  d.text(52, 396, 'agents: 3 体の子エージェントを限定指定', 13.5, '#334155', 400, 'start', [48, 374, 344, 28]);
  d.text(52, 424, '※ 自分では部品を作らず統合に専念', 13.5, '#475569', 400, 'start', [48, 402, 344, 28]);

  // 左下：VS Code の料金ランク制限カード
  d.rect(32, 480, 376, 114, PALETTE.warn.fill, PALETTE.warn.color, 11, d.parts, 'stroke-width="1.6"');
  d.pill(52, 496, 178, 24, 'VS Code 版の落とし穴', PALETTE.warn.color, '#ffffff', 'none', 12.5);
  d.text(52, 544, '子のモデル ＞ メインの料金ランクだと', 14.5, '#92400e', 700, 'start', [48, 522, 344, 28]);
  d.text(52, 572, '子が起動しない → 親を最高ランクにする', 14.5, '#334155', 400, 'start', [48, 550, 344, 28]);

  // 中央の分岐ルート（bus x=446 -> 子 x=588）
  d.path('M408 356 H446', 'ui', { arrowEnd: false, width: 2 });
  d.path('M446 192 V522', 'ui', { arrowEnd: false, width: 2 });
  d.line(446, 192, 588, 192, 'ui', { width: 2 });
  d.line(446, 356, 588, 356, 'ui', { width: 2 });
  d.line(446, 522, 588, 522, 'ui', { width: 2 });

  d.text(517, 180, 'body.html を発注', 13.5, '#1e40af', 700, 'middle', [450, 156, 134, 30]);
  d.text(517, 344, 'style.css を発注', 13.5, '#1e40af', 700, 'middle', [450, 320, 134, 30]);
  d.text(517, 510, 'script.js を発注', 13.5, '#1e40af', 700, 'middle', [450, 486, 134, 30]);

  // 右：3 体の子エージェント（別会社のモデル）
  const children = [
    {
      y: 124,
      provider: 'Anthropic',
      roleLabel: 'HTML 担当',
      name: 'markup-builder',
      model: 'model: Claude Sonnet 5.5 (copilot)',
      out: 'work/parts/body.html を作成（user-invocable: false）',
      theme: PALETTE.model,
      badgeBg: '#ede9fe',
      badgeText: '#5b21b6',
    },
    {
      y: 288,
      provider: 'Google',
      roleLabel: 'CSS 担当',
      name: 'style-builder',
      model: 'model: Gemini 4 Argon (copilot)',
      out: 'work/parts/style.css を作成（user-invocable: false）',
      theme: PALETTE.tool,
      badgeBg: '#cffafe',
      badgeText: '#155e75',
    },
    {
      y: 452,
      provider: 'OpenAI',
      roleLabel: 'JS 担当',
      name: 'script-builder',
      model: 'model: GPT-5.3-Codex (copilot)',
      out: 'work/parts/script.js を作成（user-invocable: false）',
      theme: PALETTE.harness,
      badgeBg: '#d1fae5',
      badgeText: '#065f46',
    },
  ];

  for (const c of children) {
    d.rect(588, c.y, 580, 142, c.theme.fill, c.theme.color, 11, d.parts, 'stroke-width="1.6"');
    d.pill(608, c.y + 16, 116, 26, c.provider, c.theme.color, '#ffffff', 'none', 13);
    d.pill(734, c.y + 16, 114, 26, c.roleLabel, c.badgeBg, c.badgeText, c.theme.border, 13);
    d.text(608, c.y + 72, c.name, 20, c.badgeText, 700, 'start', [604, c.y + 46, 544, 34]);
    d.text(608, c.y + 102, c.model, 15.5, '#0f172a', 700, 'start', [604, c.y + 78, 544, 30]);
    d.text(608, c.y + 128, c.out, 13.5, '#475569', 400, 'start', [604, c.y + 106, 544, 28]);
  }

  results.push(
    d.save(736, [
      'どのモデルがどの作業に強いかは公式の保証ではないため、上図は品質・速度を比べてみるための筆者による設定例。',
      '会社環境では管理者が有効にしたモデルのみ使える（エディタで model: を入力して出る補完候補に合わせて書き換える）。',
      'VS Code 版は「表示名 (copilot)」形式、CLI 版は CLI のモデル ID（ローカルモデルは 提供元/ID）を指定する。',
    ])
  );
}

// =========================================================================
// 図 3: 親はどうやって子を呼ぶのか（シーケンス図）
// =========================================================================
{
  const actors = [
    { id: 'user', role: 'user', name: 'ユーザー', sub: 'チャットで依頼', x: 110, color: '#475569', fill: '#f8fafc' },
    { id: 'parent', role: 'ui', name: 'page-director', sub: '親：設計・検品・統合', x: 306, color: '#2563eb', fill: '#eff6ff' },
    { id: 'markup', role: 'model', name: 'markup-builder', sub: '子：HTML 担当', x: 502, color: '#7c3aed', fill: '#f5f3ff' },
    { id: 'style', role: 'tool', name: 'style-builder', sub: '子：CSS 担当', x: 698, color: '#0e7490', fill: '#ecfeff' },
    { id: 'script', role: 'harness', name: 'script-builder', sub: '子：JS 担当', x: 894, color: '#059669', fill: '#ecfdf5' },
    { id: 'work', role: 'warn', name: 'work フォルダ', sub: 'spec.md・parts・output', x: 1090, color: '#b45309', fill: '#fffbeb' },
  ];

  const s = new SequenceDiagram(
    'subagent-01-sequence.svg',
    'Copilot 版：親1体＋子3体で Web ページを組み立てる流れ',
    '子は独立したコンテキストで動き、親の会話は見られない。依頼文と work/spec.md だけを頼りに部品を作り、最終報告を返す。',
    actors
  );

  s.phase('① ユーザーが親を選び、親が設計書 work/spec.md を作る');
  s.message('user', 'parent', ['1. エージェント一覧で', 'page-director を選んで依頼']);
  s.message('parent', 'work', '2. spec.md を書く（共通 id / class 名・配色・担当表）');

  s.phase('② agent ツールで子 3 体を呼び出し、部品を分担作成する');
  s.message('parent', 'markup', '3. agent ツールで呼ぶ（依頼文）');
  s.message('markup', 'work', '4. parts/body.html を書く');
  s.message('markup', 'parent', '5. 報告（作ったファイル・id / class 名）', true);

  s.message('parent', 'style', '6. agent ツールで呼ぶ（依頼文）');
  s.message('style', 'work', '7. parts/style.css を書く');
  s.message('style', 'parent', '8. 報告（作ったファイル・セレクタ）', true);

  s.message('parent', 'script', '9. agent ツールで呼ぶ（依頼文）');
  s.message('script', 'work', '10. parts/script.js を書く');
  s.message('script', 'parent', '11. 報告（作ったファイル・動き）', true);

  s.phase('③ 親が 3 部品を検品・統合し、ユーザーへ完成報告を返す', true);
  s.message('parent', 'work', '12. 検品して output/index.html に統合');
  s.message('parent', 'user', '13. 完成報告を返す', true);

  results.push(
    s.finishSequence([
      '子は親の会話履歴を見られず、親から子への追加チャットもできない。依頼文に spec.md のパス・担当・完成条件を明記する。',
      'VS Code 版で 3 体が同時実行されるかは公式ページに明記がないため順に描いている（CLI 版は /fleet で並列実行が可能）。',
      '後継の Copilot ハーネス（推奨）および CLI 版では、サブエージェント呼び出しツールの内部名が runSubagent ではなく task になる。',
    ])
  );
}

let hasWarning = false;
for (const r of results) {
  console.log(`Generated ${r.filename} (height=${r.height}, warnings=${r.warnings.length})`);
  for (const w of r.warnings) {
    console.warn(`  WARN [${r.filename}]: ${w}`);
    hasWarning = true;
  }
}

if (hasWarning) {
  console.error('Layout warnings detected! Fix overlaps or overflows.');
  process.exit(1);
}
