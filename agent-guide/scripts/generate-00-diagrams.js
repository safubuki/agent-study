#!/usr/bin/env node
// 00_subagent-guide.md 内の 14 個の図を統一デザインのベクター SVG として生成する。
// 実行: node agent-guide/scripts/generate-00-diagrams.js
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const OUT_DIR = path.resolve(__dirname, '../docs/assets');
const WIDTH = 1200;
const FONT_FAMILY = "'Noto Sans JP', 'Yu Gothic UI', Meiryo, sans-serif";

const PALETTE = {
  user:   { id: 'user',   fill: '#f8fafc', stroke: '#475569', text: '#334155', badge: '#475569', soft: '#e2e8f0' },
  parent: { id: 'parent', fill: '#eff6ff', stroke: '#2563eb', text: '#1e40af', badge: '#2563eb', soft: '#dbeafe' },
  sub:    { id: 'sub',    fill: '#f5f3ff', stroke: '#7c3aed', text: '#5b21b6', badge: '#7c3aed', soft: '#ede9fe' },
  rule:   { id: 'rule',   fill: '#ecfdf5', stroke: '#059669', text: '#065f46', badge: '#059669', soft: '#d1fae5' },
  tool:   { id: 'tool',   fill: '#ecfeff', stroke: '#0e7490', text: '#155e75', badge: '#0e7490', soft: '#cffafe' },
  warn:   { id: 'warn',   fill: '#fffbeb', stroke: '#b45309', text: '#92400e', badge: '#b45309', soft: '#fef3c7' },
};

const esc = (v) =>
  String(v).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  }[c]));

const r2 = (n) => Math.round(Number(n) * 100) / 100;

// 簡易文字幅推定：全角 ≒ size * 1.05、半角 ≒ size * 0.56
function estWidth(str, size) {
  let w = 0;
  for (const ch of String(str)) {
    w += /[\x00-\x7f]/.test(ch) ? size * 0.56 : size * 1.05;
  }
  return w;
}

function rectsOverlap(a, b, pad = 0) {
  return (
    a.x1 + pad < b.x2 - pad &&
    a.x2 - pad > b.x1 + pad &&
    a.y1 + pad < b.y2 - pad &&
    a.y2 - pad > b.y1 + pad
  );
}

function boxContains(outer, inner, tol = 2) {
  return (
    inner.x1 >= outer.x1 - tol &&
    inner.x2 <= outer.x2 + tol &&
    inner.y1 >= outer.y1 - tol &&
    inner.y2 <= outer.y2 + tol
  );
}

class DiagramCanvas {
  constructor(filename, title, subtitle) {
    this.filename = filename;
    this.title = title;
    this.subtitle = subtitle;
    this.bgParts = [];
    this.parts = [];
    this.textRecords = [];
    this.boxRecords = [];
  }

  rect(x, y, w, h, fill = '#ffffff', stroke = 'none', rx = 10, opts = {}) {
    const target = opts.bg ? this.bgParts : this.parts;
    const sw = opts.strokeWidth ?? (stroke === 'none' ? 0 : 1.5);
    const dash = opts.dash ? ` stroke-dasharray="${opts.dash}"` : '';
    const op = opts.fillOpacity != null ? ` fill-opacity="${opts.fillOpacity}"` : '';
    const strokeAttr = stroke === 'none' ? 'stroke="none"' : `stroke="${stroke}" stroke-width="${sw}"${dash}`;
    target.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${op} ${strokeAttr}/>`);
    if (opts.registerBox) {
      this.boxRecords.push({ label: opts.label || 'box', x1: x, y1: y, x2: x + w, y2: y + h });
    }
  }

  text(x, y, value, opts = {}) {
    const {
      size = 16,
      color = '#334155',
      weight = 400,
      anchor = 'start',
      bounds = [20, 10, WIDTH - 40, 4000],
      halo = null,
      target = this.parts,
      label = value,
    } = opts;

    const str = String(value);
    const w = estWidth(str, size);
    let x1;
    if (anchor === 'middle') x1 = x - w / 2;
    else if (anchor === 'end') x1 = x - w;
    else x1 = x;
    const x2 = x1 + w;
    const y1 = y - size * 0.88;
    const y2 = y + size * 0.27;

    if (halo) {
      target.push(
        `<text x="${r2(x)}" y="${r2(y)}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="none" stroke="${halo}" stroke-width="6.5" stroke-linejoin="round" stroke-linecap="round">${esc(str)}</text>`
      );
    }
    target.push(
      `<text x="${r2(x)}" y="${r2(y)}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${esc(str)}</text>`
    );

    this.textRecords.push({
      label,
      value: str,
      size,
      x1,
      y1,
      x2,
      y2,
      bounds,
    });
  }

  pill(cx, cy, text, role = 'user', opts = {}) {
    const p = PALETTE[role];
    const size = opts.size ?? 13.5;
    const fill = opts.fill ?? '#ffffff';
    const stroke = opts.stroke ?? p.stroke;
    const textColor = opts.textColor ?? p.text;
    const lines = Array.isArray(text) ? text : [text];
    const maxW = Math.max(...lines.map((l) => estWidth(l, size)));
    const padX = opts.padX ?? 14;
    const lineH = opts.lineH ?? size * 1.35;
    const w = Math.max(opts.minW ?? 48, Math.ceil(maxW + padX * 2));
    const h = Math.ceil(lines.length * lineH + (opts.padY ?? 10));
    const x = Math.round(cx - w / 2);
    const y = Math.round(cy - h / 2);

    this.rect(x, y, w, h, fill, stroke, Math.min(14, Math.floor(h / 2)), {
      strokeWidth: opts.strokeWidth ?? 1.4,
      registerBox: opts.registerBox ?? true,
      label: `pill:${lines.join('/')}`,
    });

    const startY = y + (h - (lines.length - 1) * lineH) / 2 + size * 0.34;
    lines.forEach((line, i) => {
      this.text(cx, startY + i * lineH, line, {
        size,
        color: textColor,
        weight: opts.weight ?? 700,
        anchor: 'middle',
        bounds: [x + 4, y + 2, w - 8, h - 4],
      });
    });
    return { x, y, w, h };
  }

  group(x, y, w, h, title, role = 'user', opts = {}) {
    const p = PALETTE[role];
    const fill = opts.fill ?? p.fill;
    const stroke = opts.stroke ?? p.stroke;
    this.rect(x, y, w, h, fill, stroke, 14, {
      bg: opts.bg ?? false,
      fillOpacity: opts.fillOpacity ?? 0.45,
      strokeWidth: opts.strokeWidth ?? 1.6,
      dash: opts.dash ?? null,
    });
    if (title) {
      const badgeSize = opts.badgeSize ?? 14.5;
      const bw = Math.min(w - 24, Math.ceil(estWidth(title, badgeSize) + 28));
      const bh = 30;
      const bx = opts.centerTitle ? Math.round(x + (w - bw) / 2) : x + 16;
      const by = y + 12;
      this.rect(bx, by, bw, bh, p.badge, 'none', 15, {
        bg: opts.bg ?? false,
        registerBox: true,
        label: `group-title:${title}`,
      });
      this.text(bx + bw / 2, by + 20.5, title, {
        size: badgeSize,
        color: '#ffffff',
        weight: 700,
        anchor: 'middle',
        bounds: [bx + 6, by + 2, bw - 12, bh - 4],
        target: opts.bg ? this.bgParts : this.parts,
      });
    }
  }

  card(x, y, w, h, title, lines = [], role = 'user', opts = {}) {
    const p = PALETTE[role];
    const fill = opts.fill ?? p.fill;
    const stroke = opts.stroke ?? p.stroke;
    const titleSize = opts.titleSize ?? 17.5;
    const bodySize = opts.bodySize ?? 14.5;
    const lineH = opts.lineH ?? 22;

    this.rect(x, y, w, h, fill, stroke, opts.rx ?? 12, {
      strokeWidth: opts.strokeWidth ?? 1.7,
      registerBox: true,
      label: `card:${title}`,
    });

    if (opts.badge) {
      const bSize = opts.badgeSize ?? 12;
      const bw = Math.ceil(estWidth(opts.badge, bSize) + 20);
      const bh = 22;
      const bx = opts.badgeAlign === 'right'
        ? Math.round(x + w - bw - 14)
        : Math.round(x + (w - bw) / 2);
      const by = y - 11;
      this.rect(bx, by, bw, bh, p.badge, '#ffffff', 11, { strokeWidth: 1.5 });
      this.text(bx + bw / 2, by + 15.5, opts.badge, {
        size: bSize,
        color: '#ffffff',
        weight: 700,
        anchor: 'middle',
        bounds: [bx + 4, by + 1, bw - 8, bh - 2],
      });
    }

    const titleLines = Array.isArray(title) ? title : [title];
    const titleLineH = opts.titleLineH ?? titleSize * 1.32;
    const totalLinesH = titleLines.length * titleLineH + (lines.length > 0 ? 6 + lines.length * lineH : 0);
    const curY = opts.topAlign
      ? y + (opts.badge ? 34 : 28)
      : y + (h - totalLinesH) / 2 + titleSize * 0.88;

    titleLines.forEach((tl, idx) => {
      this.text(x + w / 2, curY + idx * titleLineH, tl, {
        size: titleSize,
        color: opts.titleColor ?? p.text,
        weight: 700,
        anchor: 'middle',
        bounds: [x + 10, y + 4, w - 20, h - 8],
      });
    });

    if (lines.length > 0) {
      const bodyStartY = curY + titleLines.length * titleLineH + 4;
      lines.forEach((line, idx) => {
        this.text(x + w / 2, bodyStartY + idx * lineH, line, {
          size: bodySize,
          color: opts.bodyColor ?? '#475569',
          weight: 400,
          anchor: 'middle',
          bounds: [x + 10, y + 4, w - 20, h - 8],
        });
      });
    }
  }

  decision(x, y, w, h, lines, opts = {}) {
    const p = PALETTE.warn;
    const size = opts.size ?? 16.5;
    const lineH = opts.lineH ?? 23;
    this.rect(x, y, w, h, p.fill, p.stroke, 14, {
      strokeWidth: 1.9,
      registerBox: true,
      label: `decision:${lines.join('/')}`,
    });
    // 左上にひし形アイコンを描き条件分岐ノードであることを示す
    const cx = x + 22;
    const cy = y + 22;
    this.parts.push(`<polygon points="${cx},${cy - 8} ${cx + 8},${cy} ${cx},${cy + 8} ${cx - 8},${cy}" fill="${p.badge}"/>`);
    this.text(cx, cy + 4, '?', {
      size: 11.5,
      color: '#ffffff',
      weight: 700,
      anchor: 'middle',
      bounds: [cx - 8, cy - 8, 16, 16],
    });

    const arr = Array.isArray(lines) ? lines : [lines];
    const totalH = (arr.length - 1) * lineH;
    const startY = y + (h - totalH) / 2 + size * 0.34;
    arr.forEach((line, i) => {
      this.text(x + w / 2 + 6, startY + i * lineH, line, {
        size,
        color: p.text,
        weight: 700,
        anchor: 'middle',
        bounds: [x + 34, y + 6, w - 42, h - 12],
      });
    });
  }

  cylinder(x, y, w, h, title, sub = null, role = 'tool') {
    const p = PALETTE[role];
    this.rect(x, y, w, h, p.fill, p.stroke, 14, {
      strokeWidth: 1.8,
      registerBox: true,
      label: `cylinder:${title}`,
    });
    const ix = x + 38;
    const iy = y + h / 2 - 14;
    this.parts.push(
      `<g stroke="${p.stroke}" stroke-width="1.8" fill="#ffffff">` +
      `<path d="M${ix - 16} ${iy + 6} v20 a16 6 0 0 0 32 0 v-20"/>` +
      `<ellipse cx="${ix}" cy="${iy + 6}" rx="16" ry="6" fill="${p.soft}"/>` +
      `<path d="M${ix - 16} ${iy + 16} a16 6 0 0 0 32 0" fill="none"/>` +
      `</g>`
    );
    const tx = x + w / 2 + 16;
    if (sub) {
      this.text(tx, y + h / 2 - 4, title, {
        size: 18,
        color: p.text,
        weight: 700,
        anchor: 'middle',
        bounds: [x + 64, y + 6, w - 74, h - 12],
      });
      this.text(tx, y + h / 2 + 21, sub, {
        size: 14,
        color: '#475569',
        weight: 400,
        anchor: 'middle',
        bounds: [x + 64, y + 6, w - 74, h - 12],
      });
    } else {
      this.text(tx, y + h / 2 + 6, title, {
        size: 18,
        color: p.text,
        weight: 700,
        anchor: 'middle',
        bounds: [x + 64, y + 6, w - 74, h - 12],
      });
    }
  }

  arrow(x1, y1, x2, y2, role = 'user', opts = {}) {
    const p = PALETTE[role];
    const sw = opts.strokeWidth ?? 2;
    const dash = opts.dashed ? ' stroke-dasharray="6 5"' : '';
    const start = opts.bidir ? ` marker-start="url(#arrow-start-${p.id})"` : '';
    const end = opts.noHead ? '' : ` marker-end="url(#arrow-${p.id})"`;
    this.parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${p.stroke}" stroke-width="${sw}"${dash}${start}${end}/>`);
  }

  route(d, role = 'user', opts = {}) {
    const p = PALETTE[role];
    const sw = opts.strokeWidth ?? 2;
    const dash = opts.dashed ? ' stroke-dasharray="6 5"' : '';
    const end = opts.noHead ? '' : ` marker-end="url(#arrow-${p.id})"`;
    this.parts.push(`<path d="${d}" fill="none" stroke="${p.stroke}" stroke-width="${sw}" stroke-linejoin="round"${dash}${end}/>`);
  }

  noteBox(y, lines) {
    const size = 15;
    const lineH = 25;
    const h = lines.length * lineH + 28;
    this.rect(28, y, WIDTH - 56, h, '#f8fafc', '#e2e8f0', 10, {
      strokeWidth: 1.4,
      registerBox: true,
      label: 'noteBox',
    });
    lines.forEach((line, i) => {
      this.text(46, y + 29 + i * lineH, line, {
        size,
        color: '#475569',
        weight: 400,
        anchor: 'start',
        bounds: [38, y + 4, WIDTH - 76, h - 8],
      });
    });
    return h;
  }

  validate(height) {
    const issues = [];
    for (const t of this.textRecords) {
      const [bx, by, bw, bh] = t.bounds;
      if (t.x1 < bx - 1 || t.x2 > bx + bw + 1 || t.y1 < by - 1 || t.y2 > by + bh + 1) {
        issues.push(
          `[${this.filename}] 枠はみ出し: "${t.value}" text=[${t.x1.toFixed(1)}..${t.x2.toFixed(1)}, ${t.y1.toFixed(1)}..${t.y2.toFixed(1)}] bounds=[${bx}..${bx + bw}, ${by}..${by + bh}]`
        );
      }
      if (t.x1 < 12 || t.x2 > WIDTH - 12 || t.y1 < 8 || t.y2 > height - 8) {
        issues.push(
          `[${this.filename}] キャンバス端はみ出し: "${t.value}" [${t.x1.toFixed(1)}..${t.x2.toFixed(1)}, ${t.y1.toFixed(1)}..${t.y2.toFixed(1)}]`
        );
      }
    }
    for (let i = 0; i < this.textRecords.length; i++) {
      for (let j = i + 1; j < this.textRecords.length; j++) {
        const a = this.textRecords[i];
        const b = this.textRecords[j];
        if (rectsOverlap(a, b, 1.5)) {
          issues.push(
            `[${this.filename}] テキスト重複: "${a.value}" と "${b.value}"`
          );
        }
      }
    }
    for (let i = 0; i < this.boxRecords.length; i++) {
      for (let j = i + 1; j < this.boxRecords.length; j++) {
        const a = this.boxRecords[i];
        const b = this.boxRecords[j];
        if (rectsOverlap(a, b, 2)) {
          issues.push(`[${this.filename}] ボックス重複: "${a.label}" と "${b.label}"`);
        }
      }
    }
    for (const t of this.textRecords) {
      const [bx, by, bw, bh] = t.bounds;
      const tb = { x1: bx, y1: by, x2: bx + bw, y2: by + bh };
      for (const box of this.boxRecords) {
        if (!boxContains(box, tb, 16) && rectsOverlap(t, box, 1.5)) {
          issues.push(
            `[${this.filename}] テキストと別枠が干渉: "${t.value}" vs "${box.label}"`
          );
        }
      }
    }
    return issues;
  }

  finish(height, notes, opts = {}) {
    const bodyBg = this.bgParts;
    const bodyFg = this.parts;
    const bodyTexts = this.textRecords;
    const bodyBoxes = this.boxRecords;
    this.bgParts = [];
    this.parts = [];
    this.textRecords = [];
    this.boxRecords = [];

    const out = [];
    out.push(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${height}" role="img" aria-labelledby="title desc" font-family="${FONT_FAMILY}">`
    );
    out.push('<!-- Generated by agent-guide/scripts/generate-00-diagrams.js. -->');
    out.push(`<title id="title">${esc(this.title)}</title>`);
    out.push(`<desc id="desc">${esc(this.subtitle)}</desc>`);
    out.push('<defs>');
    for (const p of Object.values(PALETTE)) {
      out.push(
        `<marker id="arrow-${p.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${p.stroke}"/></marker>`
      );
      out.push(
        `<marker id="arrow-start-${p.id}" viewBox="0 0 10 10" refX="1" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto"><path d="M10 0 L0 5 L10 10 Z" fill="${p.stroke}"/></marker>`
      );
    }
    out.push('</defs>');

    this.rect(1, 1, WIDTH - 2, height - 2, '#ffffff', '#e2e8f0', 18, { strokeWidth: 1.5 });
    this.text(32, 46, this.title, {
      size: 26.5,
      color: '#0f172a',
      weight: 700,
      bounds: [24, 8, WIDTH - 48, 48],
    });
    this.text(32, 76, this.subtitle, {
      size: 15.5,
      color: '#475569',
      weight: 400,
      bounds: [24, 54, WIDTH - 48, 32],
    });
    if (opts.legend) {
      this.text(32, 102, opts.legend, {
        size: 13,
        color: '#64748b',
        weight: 400,
        bounds: [24, 84, WIDTH - 48, 26],
      });
    }

    const noteH = notes.length * 25 + 28;
    const noteY = height - noteH - 22;
    this.noteBox(noteY, notes);

    const headerAndNoteParts = this.parts;
    const headerAndNoteTexts = this.textRecords;
    const headerAndNoteBoxes = this.boxRecords;

    const headerCount = opts.legend ? 4 : 3;
    const svgLines = [
      ...out,
      ...headerAndNoteParts.slice(0, headerCount),
      ...bodyBg,
      ...bodyFg,
      ...headerAndNoteParts.slice(headerCount),
      '</svg>',
    ];

    this.textRecords = [...headerAndNoteTexts, ...bodyTexts];
    this.boxRecords = [...headerAndNoteBoxes, ...bodyBoxes];

    const issues = this.validate(height);
    if (issues.length > 0) {
      throw new Error(`バウンディング検証エラー (${this.filename}):\n` + issues.join('\n'));
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUT_DIR, this.filename), svgLines.join('\n') + '\n', 'utf8');
    return { filename: this.filename, height };
  }
}

class SequenceDiagram extends DiagramCanvas {
  constructor(filename, title, subtitle, actors) {
    super(filename, title, subtitle);
    this.actors = actors;
    this.actorMap = Object.fromEntries(actors.map((a) => [a.id, a]));
    this.y = 216;
    this.stepNo = 0;
    this.boxHalfW = actors.length >= 6 ? 88 : 118;
    this.currentHalo = '#ffffff';
  }

  phase(label) {
    this.rect(24, this.y, WIDTH - 48, 34, '#f8fafc', '#e2e8f0', 7, { bg: true, strokeWidth: 1.2 });
    this.text(40, this.y + 23, label, {
      size: 15.5,
      color: '#334155',
      weight: 700,
      bounds: [32, this.y + 2, WIDTH - 64, 30],
      halo: '#f8fafc',
    });
    this.y += 50;
  }

  beginGroup(badgeText, descText, role = 'sub', opts = {}) {
    const fill = opts.fill ?? (role === 'warn' ? '#fffbeb' : '#faf5ff');
    const stroke = PALETTE[role].stroke;
    const startY = this.y;
    const prevHalo = this.currentHalo;
    this.currentHalo = fill;
    return {
      startY,
      fill,
      stroke,
      role,
      badgeText,
      descText,
      prevHalo,
      dividers: [],
    };
  }

  dividerGroup(grp, branchLabel) {
    const dy = this.y - 4;
    grp.dividers.push({ y: dy, label: branchLabel });
    this.y += 32;
  }

  endGroup(grp) {
    const x = 28;
    const w = WIDTH - 56;
    const h = this.y - grp.startY + 4;
    const firstActorX = this.actors[0].x;
    const p = PALETTE[grp.role];

    // 背景帯（ライフラインの裏）へグループ枠を描く
    this.bgParts.push(
      `<rect x="${x}" y="${grp.startY}" width="${w}" height="${h}" rx="10" fill="${grp.fill}" stroke="${grp.stroke}" stroke-width="1.5" stroke-dasharray="6 4"/>`
    );

    // グループ見出しバッジは最初のライフラインより左の余白（x=36..firstActorX-8）に収め、縦線を切らない
    const maxLeftBadgeW = firstActorX - 44;
    const bw = Math.min(maxLeftBadgeW, Math.ceil(estWidth(grp.badgeText, 13) + 20));
    this.rect(36, grp.startY + 8, bw, 24, p.badge, 'none', 12, { registerBox: true, label: `seq-badge:${grp.badgeText}` });
    this.text(36 + bw / 2, grp.startY + 24.5, grp.badgeText, {
      size: 13,
      color: '#ffffff',
      weight: 700,
      anchor: 'middle',
      bounds: [38, grp.startY + 8, bw - 4, 24],
    });
    if (grp.descText) {
      this.text(firstActorX + 14, grp.startY + 25, grp.descText, {
        size: 13.5,
        color: p.text,
        weight: 700,
        anchor: 'start',
        bounds: [firstActorX + 10, grp.startY + 6, 480, 26],
        halo: grp.fill,
      });
    }

    for (const div of grp.dividers) {
      this.bgParts.push(
        `<line x1="${x + 10}" y1="${div.y}" x2="${x + w - 10}" y2="${div.y}" stroke="${grp.stroke}" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>`
      );
      if (div.label) {
        this.text(firstActorX + 14, div.y + 21, div.label, {
          size: 13,
          color: p.text,
          weight: 700,
          anchor: 'start',
          bounds: [firstActorX + 10, div.y + 4, 240, 24],
          halo: grp.fill,
        });
      }
    }
    this.currentHalo = grp.prevHalo;
    this.y += 18;
  }

  noteOver(actorId, lines) {
    const a = this.actorMap[actorId];
    const arr = Array.isArray(lines) ? lines : [lines];
    const size = 14;
    const maxW = Math.max(...arr.map((l) => estWidth(l, size)));
    const w = Math.max(220, Math.ceil(maxW + 32));
    const h = arr.length * 22 + 16;
    const x = Math.max(32, Math.min(WIDTH - 32 - w, Math.round(a.x - w / 2)));
    this.rect(x, this.y, w, h, '#fffbeb', '#f59e0b', 8, {
      strokeWidth: 1.4,
      registerBox: true,
      label: `noteOver:${arr.join('/')}`,
    });
    arr.forEach((line, i) => {
      this.text(x + w / 2, this.y + 22 + i * 22, line, {
        size,
        color: '#92400e',
        weight: 600,
        anchor: 'middle',
        bounds: [x + 8, this.y + 2, w - 16, h - 4],
      });
    });
    this.y += h + 16;
  }

  message(fromId, toId, lines, opts = {}) {
    const a = this.actorMap[fromId];
    const b = this.actorMap[toId];
    const arr = Array.isArray(lines) ? [...lines] : [lines];
    this.stepNo += 1;
    arr[0] = `(${this.stepNo}) ${arr[0]}`;

    const size = opts.size ?? 14.5;
    const lineH = 22;
    const center = (a.x + b.x) / 2;
    const top = this.y;
    const maxW = Math.max(...arr.map((l) => estWidth(l, size)));
    const textLeft = center - maxW / 2 - 6;
    const textRight = center + maxW / 2 + 6;
    const crossesLine = this.actors.some((act) => textLeft < act.x && act.x < textRight);
    const halo = crossesLine ? this.currentHalo : null;
    const p = PALETTE[a.role];

    arr.forEach((line, i) => {
      const ly = top + 18 + i * lineH;
      this.text(center, ly, line, {
        size,
        color: p.text,
        weight: 600,
        anchor: 'middle',
        bounds: [Math.max(24, center - 400), top - 2 + i * lineH, 800, lineH + 4],
        halo,
      });
    });

    const arrowY = top + arr.length * lineH + 6;
    this.arrow(a.x, arrowY, b.x, arrowY, a.role, {
      dashed: Boolean(opts.reply),
      strokeWidth: opts.reply ? 1.7 : 2.1,
    });
    this.y = arrowY + 20;
  }

  save(notes) {
    const bodyEnd = this.y;
    const noteH = notes.length * 25 + 28;
    const height = bodyEnd + 46 + noteH + 34;

    for (const a of this.actors) {
      const p = PALETTE[a.role];
      this.bgParts.push(`<g data-participant="${a.id}">`);
      this.bgParts.push(
        `<line x1="${a.x}" y1="194" x2="${a.x}" y2="${bodyEnd - 4}" stroke="${p.stroke}" stroke-width="1.5" stroke-dasharray="5 6" opacity="0.7"/>`
      );
      this.bgParts.push(
        `<rect x="${a.x - this.boxHalfW}" y="122" width="${this.boxHalfW * 2}" height="72" rx="10" fill="${p.fill}" stroke="${p.stroke}" stroke-width="1.6"/>`
      );
      this.bgParts.push(
        `<rect x="${a.x - this.boxHalfW}" y="${bodyEnd - 4}" width="${this.boxHalfW * 2}" height="34" rx="8" fill="${p.fill}" stroke="${p.stroke}" stroke-width="1.5"/>`
      );
      this.bgParts.push('</g>');

      this.boxRecords.push({
        label: `actor-top:${a.name}`,
        x1: a.x - this.boxHalfW,
        y1: 122,
        x2: a.x + this.boxHalfW,
        y2: 194,
      });
      this.boxRecords.push({
        label: `actor-bottom:${a.name}`,
        x1: a.x - this.boxHalfW,
        y1: bodyEnd - 4,
        x2: a.x + this.boxHalfW,
        y2: bodyEnd + 30,
      });

      const nameSize = this.actors.length >= 6 ? 15.5 : 17.5;
      this.text(a.x, 152, a.name, {
        size: nameSize,
        color: p.text,
        weight: 700,
        anchor: 'middle',
        bounds: [a.x - this.boxHalfW + 6, 126, this.boxHalfW * 2 - 12, 34],
      });
      this.text(a.x, 179, a.sub, {
        size: 12.5,
        color: '#475569',
        weight: 400,
        anchor: 'middle',
        bounds: [a.x - this.boxHalfW + 6, 160, this.boxHalfW * 2 - 12, 28],
      });
      this.text(a.x, bodyEnd + 18, a.name, {
        size: 14,
        color: p.text,
        weight: 700,
        anchor: 'middle',
        bounds: [a.x - this.boxHalfW + 6, bodyEnd - 2, this.boxHalfW * 2 - 12, 30],
      });
    }

    return this.finish(height, notes, {
      legend: '上→下が時間経過　実線＝指示・書き込み・呼び出し　破線＝報告・返答　※(数字)は処理順',
    });
  }
}

const results = [];

// ---------------------------------------------------------------------------
// 1. 基本構成（1章）
// ---------------------------------------------------------------------------
{
  const d = new DiagramCanvas(
    'subagent-00-01-basic-structure.svg',
    'メインエージェントとサブエージェントの基本構造',
    'サブエージェントは独立したコンテキストで動き、ファイル操作などの途中経過を閉じて「最終報告のみ」を返す'
  );

  d.card(60, 126, 220, 84, 'ユーザー', ['指示・結果の確認'], 'user', { titleSize: 19 });
  d.card(410, 118, 380, 100, 'メインエージェント', ['全体の計画・判断・統合'], 'parent', { titleSize: 20, bodySize: 15.5 });
  d.arrow(280, 168, 410, 168, 'user', { bidir: true });
  d.pill(345, 144, '会話', 'user', { size: 13.5 });

  // 凡例カード（右上）
  d.rect(860, 124, 290, 88, '#f8fafc', '#cbd5e1', 10, { strokeWidth: 1.2, registerBox: true, label: 'legend' });
  d.text(878, 148, '矢印の読み方', { size: 13.5, color: '#334155', weight: 700, bounds: [868, 128, 270, 26] });
  d.arrow(878, 169, 926, 169, 'parent');
  d.text(936, 174, '実線：依頼文・最終報告', { size: 13, color: '#475569', bounds: [932, 156, 210, 24] });
  d.arrow(878, 194, 926, 194, 'tool', { dashed: true });
  d.text(936, 199, '破線：ファイル / ツール操作', { size: 13, color: '#475569', bounds: [932, 181, 210, 24] });

  const subs = [
    { x: 55,  title: 'サブエージェント A', topDownX: 450, topUpX: 495, downY: 246, upY: 264 },
    { x: 435, title: 'サブエージェント B', topDownX: 560, topUpX: 640, downY: 246, upY: 246 },
    { x: 815, title: 'サブエージェント C', topDownX: 705, topUpX: 750, downY: 254, upY: 234 },
  ];
  const subW = 330;
  const subY = 344;
  const subH = 92;

  for (const [idx, s] of subs.entries()) {
    const downX = s.x + 100;
    const upX = s.x + 230;

    d.route(`M${s.topDownX} 218 V${s.downY} H${downX} V${subY}`, 'parent');
    d.pill(downX, 282, '依頼文を渡す', 'parent', { size: 13 });

    d.route(`M${upX} ${subY} V${s.upY} H${s.topUpX} V218`, 'sub');
    d.pill(upX, 314, '最終報告のみ', 'sub', { size: 13 });

    d.card(s.x, subY, subW, subH, s.title, ['独立したコンテキスト'], 'sub', { titleSize: 18, bodySize: 14.5 });

    const fsTargetX = 430 + idx * 170;
    d.route(`M${s.x + subW / 2} ${subY + subH} V496 H${fsTargetX} V530`, 'tool', { dashed: true });
  }
  d.pill(220, 466, '読む・書く', 'tool', { size: 13 });

  d.cylinder(310, 530, 580, 76, 'ファイル / ツール', '途中の読み込みや試行錯誤は各サブエージェント内に閉じる', 'tool');

  results.push(
    d.finish(732, [
      '・サブエージェントはメインの会話履歴を見られないため、依頼文に必要な前提・仕様・完了条件を含めて渡す。',
      '・主な利点は「並列化による速さ」以上に、「大量の読み込みでメインの思考（コンテキスト）を汚さないこと」。',
    ])
  );
}

// ---------------------------------------------------------------------------
// 2. 自動起動の判断フロー（2章）
// ---------------------------------------------------------------------------
{
  const d = new DiagramCanvas(
    'subagent-00-02-auto-delegation-flow.svg',
    'サブエージェントが自動で使われるまでの判断の流れ',
    'メインエージェントはタスクの規模と独立性を判定し、自分で処理するかサブエージェントへ委任するかを選ぶ'
  );

  d.card(48, 134, 210, 74, 'タスクが来た', [], 'user', { titleSize: 18 });
  d.arrow(258, 171, 354, 171, 'user');

  d.decision(354, 126, 340, 90, ['小さい？', 'すぐ終わる？']);
  d.arrow(694, 171, 826, 171, 'warn');
  d.pill(760, 152, 'はい', 'warn', { size: 13 });

  d.card(826, 126, 324, 240, 'メインが自分で処理', ['起動コストをかけずそのまま完了'], 'parent', { titleSize: 19, bodySize: 14.5 });

  d.arrow(524, 216, 524, 274, 'warn');
  d.pill(524, 245, 'いいえ', 'warn', { size: 13 });

  d.decision(354, 274, 340, 92, ['大量の読み込みや', '独立した作業がある？']);
  d.arrow(694, 320, 826, 320, 'warn');
  d.pill(760, 301, 'いいえ', 'warn', { size: 13 });

  d.arrow(524, 366, 524, 424, 'warn');
  d.pill(524, 395, 'はい', 'warn', { size: 13 });

  d.card(354, 424, 340, 72, 'サブエージェントに委任', [], 'sub', { titleSize: 18.5 });
  d.arrow(524, 496, 524, 540, 'sub');

  d.decision(354, 540, 340, 90, ['合致するカスタム', 'エージェントがある？']);

  d.arrow(354, 585, 268, 585, 'rule');
  d.pill(311, 566, 'はい', 'rule', { size: 13 });
  d.card(40, 540, 228, 90, 'カスタムエージェント', ['を使う（.claude/agents/）'], 'rule', { titleSize: 16.5, bodySize: 13.5 });

  d.arrow(694, 585, 816, 585, 'tool');
  d.pill(755, 566, 'いいえ', 'tool', { size: 13 });
  d.card(816, 540, 334, 90, '組み込みエージェントを使う', ['general-purpose / Explore / Plan'], 'tool', { titleSize: 17, bodySize: 13.5 });

  results.push(
    d.finish(758, [
      '・自動判断は「よくある場面」向けの既定動作。特定の役割・モデル・権限を使わせたい場合はカスタム定義が必要。',
      '・ユーザーが「サブエージェントを使って」「並列で調べて」と明示した場合は、自動判定に関わらず委任される。',
    ])
  );
}

// ---------------------------------------------------------------------------
// 3. 制約の強さ比較（3.4節）
// ---------------------------------------------------------------------------
{
  const d = new DiagramCanvas(
    'subagent-00-03-constraint-strength.svg',
    '「指定したタスクだけやらせる」制約の強さと確実性',
    'tools や権限で仕組みから物理的に縛る方法と、本文の文章でお願いする方法の違い'
  );

  d.group(36, 124, 550, 366, '強い制約（仕組みで縛る）', 'rule', { fillOpacity: 0.4 });
  d.card(56, 186, 246, 114, 'tools で道具を絞る', ['例：Write を与えなければ', 'ファイルに書けない'], 'rule', { titleSize: 16.5, bodySize: 13.5 });
  d.card(320, 186, 246, 114, '権限設定で', ['特定コマンドを禁止'], 'rule', { titleSize: 16.5, bodySize: 16.5, titleColor: PALETTE.rule.text, bodyColor: PALETTE.rule.text });
  d.route('M179 300 V336 H443 V300', 'rule', { noHead: true });
  d.arrow(311, 336, 311, 372, 'rule');
  d.card(106, 372, 410, 86, '確実性が高い', ['物理的に道具がないため違反が起きない'], 'rule', { titleSize: 19, bodySize: 14, badge: '強制', badgeAlign: 'right' });

  d.group(614, 124, 550, 366, '弱い制約（お願いベース）', 'warn', { fillOpacity: 0.4 });
  d.card(654, 186, 470, 114, '本文に「〇〇だけやれ」と書く', ['AI は概ね従うが完璧ではない'], 'warn', { titleSize: 17.5, bodySize: 14.5 });
  d.arrow(889, 300, 889, 372, 'warn');
  d.card(684, 372, 410, 86, '柔軟だが確実性は中程度', ['長い作業では指示を逸脱することがある'], 'warn', { titleSize: 18, bodySize: 14, badge: '指示', badgeAlign: 'right' });

  results.push(
    d.finish(616, [
      '・「やってはいけないこと」は本文の禁止事項だけに頼らず、tools から書き込み系や Bash を外して道具を取り上げるのが一番確実。',
      '・たとえば読み取り専用にするなら tools: Read, Grep, Glob のように絞ったうえで、本文の指示と併用する。',
    ])
  );
}

// ---------------------------------------------------------------------------
// 4. 他社 AI を使う間接ルート（4章）
// ---------------------------------------------------------------------------
{
  const d = new DiagramCanvas(
    'subagent-00-04-external-ai-routes.svg',
    'Claude Code から別の AI（他社モデル）を使うルート',
    'frontmatter の model 欄に他社モデルは直接書けないが、サブエージェントの Bash や MCP 経由で間接的に呼べる'
  );

  d.card(44, 212, 240, 116, 'メインエージェント', ['Claude'], 'parent', { titleSize: 19, bodySize: 15.5 });
  d.route('M284 248 H326 V186 H368', 'parent');
  d.route('M284 292 H326 V354 H368', 'parent');

  d.card(368, 130, 276, 112, 'サブ：Claude Haiku', ['① モデル使い分け'], 'sub', { titleSize: 18, bodySize: 14.5, badge: '公式機能' });
  d.card(368, 298, 276, 112, 'サブ：Claude Sonnet', ['外部ツール実行役'], 'sub', { titleSize: 18, bodySize: 14.5 });

  d.route('M644 334 H760 V268 H876', 'tool');
  d.pill(760, 268, '② Bash で CLI 実行', 'tool', { size: 13.5 });

  d.route('M644 374 H760 V416 H876', 'tool');
  d.pill(760, 416, '③ MCP ツール呼び出し', 'tool', { size: 13.5 });

  d.card(876, 214, 280, 108, '他社 AI の CLI', ['例：Gemini CLI / Codex CLI'], 'tool', { titleSize: 18, bodySize: 13.5, badge: '間接利用' });
  d.card(876, 362, 280, 108, '他社 AI の MCP サーバー', ['ツールとしてセカンドオピニオン取得'], 'tool', { titleSize: 17.5, bodySize: 13.5, badge: '間接利用' });

  results.push(
    d.finish(596, [
      '・①は Claude Code 公式の model 指定（opus / sonnet / haiku 等）。②③はサブエージェントを仲介させる活用方法。',
      '・このほか④プロキシでの差し替え、⑤自前のオーケストレーター（Agent SDK 等）がある（②〜⑤は非公式の応用）。',
    ])
  );
}

// ---------------------------------------------------------------------------
// 5. 体数の決め方（5.3節）
// ---------------------------------------------------------------------------
{
  const d = new DiagramCanvas(
    'subagent-00-05-parallel-count-decision.svg',
    '並列にする体数の決め方（判断フロー）',
    '体数を先に決めるのではなく、「独立した部品の数」と「同じファイルを触るか」から順番に決める'
  );

  d.card(44, 134, 170, 74, 'タスク', [], 'user', { titleSize: 18.5 });
  d.arrow(214, 171, 294, 171, 'user');

  d.decision(294, 126, 320, 90, ['部品同士は', '独立している？']);
  d.arrow(614, 171, 824, 171, 'warn');
  d.pill(719, 152, 'いいえ（順番に依存）', 'warn', { size: 12.5 });
  d.card(824, 126, 336, 90, '1体 or 直列で実行', ['並列化しても待つだけ'], 'parent', { titleSize: 18, bodySize: 14 });

  d.arrow(454, 216, 454, 270, 'warn');
  d.pill(454, 243, 'はい', 'warn', { size: 13 });

  d.decision(294, 270, 320, 88, ['独立した部品は', 'いくつ？']);
  d.arrow(614, 314, 824, 314, 'warn');
  d.pill(719, 295, '6個以上', 'warn', { size: 13 });
  d.card(824, 270, 336, 88, '似た部品をまとめて', ['3〜5グループにする'], 'sub', { titleSize: 17.5, bodySize: 15.5, titleColor: PALETTE.sub.text, bodyColor: PALETTE.sub.text });

  d.arrow(454, 358, 454, 412, 'sub');
  d.pill(454, 385, '2〜5個', 'sub', { size: 13 });
  d.route('M992 358 V449 H614', 'sub');

  d.card(294, 412, 320, 74, '部品の数だけ並列', [], 'sub', { titleSize: 18.5 });
  d.arrow(454, 486, 454, 534, 'sub');

  d.decision(294, 534, 320, 88, ['同じファイルを', '触る？']);
  d.arrow(614, 578, 824, 578, 'warn');
  d.pill(719, 559, 'はい', 'warn', { size: 13 });
  d.card(824, 534, 336, 88, '担当ファイルを分ける', ['or worktree で隔離'], 'tool', { titleSize: 17.5, bodySize: 14.5 });

  d.arrow(454, 622, 454, 678, 'rule');
  d.pill(454, 650, 'いいえ', 'rule', { size: 13 });
  d.route('M992 622 V714 H584', 'tool');

  d.card(324, 678, 260, 72, '実行', [], 'rule', { titleSize: 20 });

  results.push(
    d.finish(878, [
      '・普段使いの並列数は 2〜5体が目安。大規模な独立調査でも 〜10体程度に抑える（既定の同時上限は 20体）。',
      '・順番に依存する作業では、複数エージェントに分けるとかえってやり取りのコストで性能が下がる。',
    ])
  );
}

// ---------------------------------------------------------------------------
// 6. オーケストレーター・ワーカー パターン（6.1節）
// ---------------------------------------------------------------------------
{
  const d = new DiagramCanvas(
    'subagent-00-06-orchestrator-worker.svg',
    '部品を分担して作り、最後に組み立てる「オーケストレーター・ワーカー」',
    '「設計」と「統合」は親が直列で行い、独立した「製作」だけを子エージェントに並列で任せる'
  );

  d.group(36, 124, 320, 346, '① 設計（直列・親）', 'parent', { fillOpacity: 0.4 });
  d.card(60, 184, 272, 76, '全体設計', [], 'parent', { titleSize: 18.5 });
  d.arrow(196, 260, 196, 310, 'parent');
  d.card(60, 310, 272, 108, '接続仕様・共通ルールを', ['ファイルに書き出す'], 'parent', { titleSize: 16.5, bodySize: 16, bodyColor: PALETTE.parent.text });

  d.group(426, 124, 300, 346, '② 製作（並列・子）', 'sub', { fillOpacity: 0.4 });
  d.card(466, 184, 220, 68, '部品 A', [], 'sub', { titleSize: 18 });
  d.card(466, 274, 220, 68, '部品 B', [], 'sub', { titleSize: 18 });
  d.card(466, 364, 220, 68, '部品 C', [], 'sub', { titleSize: 18 });

  for (const y of [218, 308, 398]) {
    d.route(`M332 364 H392 V${y} H466`, 'parent');
  }

  d.group(796, 124, 368, 346, '③ 統合（直列・親）', 'rule', { fillOpacity: 0.4 });
  d.card(836, 185, 288, 66, '結合', [], 'rule', { titleSize: 18.5 });
  d.arrow(980, 251, 980, 279, 'rule');
  d.card(836, 279, 288, 66, '検証', [], 'rule', { titleSize: 18.5 });
  d.arrow(980, 345, 980, 373, 'rule');
  d.card(836, 373, 288, 66, '成果物', [], 'rule', { titleSize: 18.5, badge: '完成', badgeAlign: 'right' });

  d.route('M686 218 H760', 'sub', { noHead: true });
  d.route('M686 308 H760 V218', 'sub', { noHead: true });
  d.route('M686 398 H760 V218', 'sub', { noHead: true });
  d.arrow(760, 218, 836, 218, 'sub');

  d.route('M1124 312 H1148 V514 H576 V470', 'warn', { dashed: true });
  d.pill(862, 514, '不合格の部品だけ差し戻し', 'warn', { size: 13.5 });

  results.push(
    d.finish(654, [
      '・子同士は直接会話できないため、親が最初に「担当範囲・接続仕様（id/class や寸法）・ルール・完成条件」を書き出す。',
      '・検証で食い違いが見つかっても全部を作り直さず、不合格の部品の担当にだけ修正を依頼する。',
    ])
  );
}

// ---------------------------------------------------------------------------
// 7. 実践：親1体＋子3体のシーケンス図（7.5節）
// ---------------------------------------------------------------------------
{
  const s = new SequenceDiagram(
    'subagent-00-07-role-split-sequence.svg',
    '実践：親（page-director）＋子3体の並列制作シーケンス',
    '1回の返答で Agent ツールを3回同時に呼び、HTML / CSS / JS 部品を並列で作り統合する',
    [
      { id: 'U', name: 'ユーザー', sub: 'チャットで依頼', x: 110, role: 'user' },
      { id: 'P', name: 'page-director（親）', sub: 'opus・設計/統合/検品', x: 306, role: 'parent' },
      { id: 'M', name: 'markup-builder', sub: 'sonnet・HTML 担当', x: 502, role: 'sub' },
      { id: 'S', name: 'style-builder', sub: 'sonnet・CSS 担当', x: 698, role: 'sub' },
      { id: 'J', name: 'script-builder', sub: 'haiku・JS 担当', x: 894, role: 'sub' },
      { id: 'F', name: 'work フォルダ', sub: 'spec.md・parts・output', x: 1090, role: 'tool' },
    ]
  );

  s.phase('① 依頼を受けて設計書（spec.md）を書き出す');
  s.message('U', 'P', ['自己紹介ページを', '作って'], { size: 14 });
  s.message('P', 'F', 'spec.md を書く（構成・id/class 名・配色）');
  s.noteOver('P', '1回の返答で Agent を3回呼ぶ → 3体が同時に動く');

  s.phase('② 3体のサブエージェントへ並列発注（par：並列実行）');
  const parGrp = s.beginGroup('par', '3体を並列起動（HTML 担当）', 'sub', { fill: '#faf5ff' });
  s.y += 38;
  s.message('P', 'M', ['Agent', '（markup-builder、依頼文）'], { size: 13.5 });
  s.message('M', 'F', 'spec.md を読み parts/body.html を書く');
  s.message('M', 'P', ['報告（作ったファイル・', '使った名前）'], { reply: true, size: 13.5 });

  s.dividerGroup(parGrp, 'CSS 担当');
  s.message('P', 'S', 'Agent（style-builder、依頼文）');
  s.message('S', 'F', 'spec.md を読み parts/style.css を書く');
  s.message('S', 'P', '報告', { reply: true });

  s.dividerGroup(parGrp, 'JS 担当');
  s.message('P', 'J', 'Agent（script-builder、依頼文）');
  s.message('J', 'F', 'spec.md を読み parts/script.js を書く');
  s.message('J', 'P', '報告', { reply: true });
  s.endGroup(parGrp);

  s.phase('③ 検品・必要時の差し戻し・1ファイルへ統合');
  s.message('P', 'F', '3部品を読み、名前の食い違いを検品');
  const optGrp = s.beginGroup('opt', '食い違いがあった場合', 'warn', { fill: '#fffbeb' });
  s.y += 38;
  s.message('P', 'S', '修正の依頼（該当の担当にだけ）');
  s.message('S', 'P', '修正の報告', { reply: true });
  s.endGroup(optGrp);

  s.message('P', 'F', 'output/index.html に1ファイルへ統合');
  s.message('P', 'U', '完成報告', { reply: true });

  results.push(
    s.save([
      '・par 枠は「親が1回の返答の中で Agent 呼び出しを3回まとめた」ことで、3体が同時並行で動く様子を示す。',
      '・子は親の会話を見られないため、spec.md を先に work フォルダへ書き出し、各子に必ず読ませるのがポイント。',
    ])
  );
}

// ---------------------------------------------------------------------------
// 8. 子の中で何が起きているか（7.6節）
// ---------------------------------------------------------------------------
{
  const d = new DiagramCanvas(
    'subagent-00-08-child-execution-anatomy.svg',
    '子エージェント（style-builder）の実行時に何が起きているか',
    '定義ファイルの「設定・本文」と親の「依頼文」が組み合わさり、最後の返答だけが親に返る'
  );

  d.group(36, 124, 282, 242, 'style-builder.md（ファイル）', 'rule', { fillOpacity: 0.4 });
  d.card(56, 180, 242, 76, '設定部分', ['tools・model'], 'rule', { titleSize: 16.5, bodySize: 14 });
  d.card(56, 272, 242, 76, '本文', ['役割・手順・禁止事項'], 'rule', { titleSize: 16.5, bodySize: 14 });

  d.card(36, 396, 282, 86, '親からの依頼文', ['prompt（毎回変わるお題）'], 'parent', { titleSize: 17.5, bodySize: 14 });

  d.group(370, 124, 468, 358, 'style-builder の実行（独立したコンテキスト）', 'sub', { fillOpacity: 0.35 });
  d.card(390, 272, 198, 76, 'システムプロンプト', ['＝本文'], 'sub', { titleSize: 15.5, bodySize: 14 });
  d.card(390, 396, 198, 86, '最初のメッセージ', ['＝依頼文'], 'sub', { titleSize: 15.5, bodySize: 14 });
  d.card(630, 180, 188, 168, '作業', ['使える道具は', 'tools のものだけ'], 'sub', { titleSize: 18, bodySize: 14.5 });
  d.card(630, 396, 188, 86, '最後の返答', ['報告内容'], 'sub', { titleSize: 17, bodySize: 14 });

  d.arrow(298, 218, 630, 218, 'rule');
  d.arrow(298, 310, 390, 310, 'rule');
  d.arrow(318, 439, 390, 439, 'parent');
  d.arrow(588, 310, 630, 310, 'sub');
  d.route('M588 439 H610 V328 H630', 'sub');
  d.arrow(724, 348, 724, 396, 'sub');

  d.arrow(818, 439, 1004, 439, 'sub');
  d.pill(921, 412, 'これだけが親に返る', 'sub', { size: 12.5, padX: 10 });
  d.card(1004, 396, 160, 86, 'page-director', ['親エージェント'], 'parent', { titleSize: 16.5, bodySize: 14 });

  results.push(
    d.finish(608, [
      '・定義ファイルの「本文」は毎回同じシステムプロンプトになり、親が渡す prompt がその回だけの最初のメッセージになる。',
      '・作業中に読んだファイルや試行錯誤のやり取りは子の外に出ず、「最後の返答」だけが親（page-director）へ戻る。',
    ])
  );
}

// ---------------------------------------------------------------------------
// 9. 親を起動する2通りの方法（7.7節）
// ---------------------------------------------------------------------------
{
  const d = new DiagramCanvas(
    'subagent-00-09-launch-methods.svg',
    '親（page-director）を起動する2通りの方法の比較',
    'メインとして直接起動する「方法A（おすすめ）」と、いつもの会話からサブとして呼ぶ「方法B」の違い'
  );

  d.group(36, 122, 548, 466, '方法A：親をメインとして起動（おすすめ）', 'rule', { fillOpacity: 0.35 });
  d.card(210, 178, 200, 50, 'ユーザー', [], 'user', { titleSize: 17 });
  d.arrow(310, 228, 310, 260, 'user');
  d.card(130, 260, 360, 74, 'page-director', ['＝メインそのもの（claude --agent）'], 'parent', { titleSize: 18, bodySize: 13.5 });

  for (const cx of [140, 310, 480]) {
    d.route(`M310 334 V358 H${cx} V384`, 'parent');
  }
  d.card(56, 384, 168, 66, 'markup-builder', ['HTML 担当'], 'sub', { titleSize: 15, bodySize: 13 });
  d.card(226, 384, 168, 66, 'style-builder', ['CSS 担当'], 'sub', { titleSize: 15, bodySize: 13 });
  d.card(396, 384, 168, 66, 'script-builder', ['JS 担当'], 'sub', { titleSize: 15, bodySize: 13 });

  d.card(56, 484, 508, 84, '2段構成：Agent(...) の制限が確実に効く', ['呼べる子を markup / style / script-builder に限定できる'], 'rule', { titleSize: 15.5, bodySize: 13.5 });

  d.group(616, 122, 548, 466, '方法B：いつもの会話から呼ぶ', 'warn', { fillOpacity: 0.35 });
  d.card(790, 178, 200, 48, 'ユーザー', [], 'user', { titleSize: 17 });
  d.arrow(890, 226, 890, 250, 'user');
  d.card(760, 250, 260, 54, 'いつものメイン', [], 'parent', { titleSize: 16.5 });
  d.arrow(890, 304, 890, 328, 'parent');
  d.card(710, 328, 360, 68, 'page-director', ['＝サブエージェント（@agent-page-director）'], 'sub', { titleSize: 17, bodySize: 13 });

  for (const cx of [720, 890, 1060]) {
    d.route(`M890 396 V416 H${cx} V438`, 'sub');
  }
  d.card(636, 438, 168, 62, 'markup-builder', ['HTML 担当'], 'sub', { titleSize: 15, bodySize: 13 });
  d.card(806, 438, 168, 62, 'style-builder', ['CSS 担当'], 'sub', { titleSize: 15, bodySize: 13 });
  d.card(976, 438, 168, 62, 'script-builder', ['JS 担当'], 'sub', { titleSize: 15, bodySize: 13 });

  d.card(636, 514, 508, 56, '3段構成：Agent(...) のカッコ内の制限は無視される', ['誰を呼ぶかは本文の指示に頼り、最終報告だけが返る'], 'warn', { titleSize: 14.5, bodySize: 12.5 });

  results.push(
    d.finish(714, [
      '・方法A（claude --agent page-director）は2段構成で、tools 欄の Agent(子1, 子2, 子3) による呼出し先の制限が有効になる。',
      '・方法Bは3段構成（入れ子の既定上限であるメインから3階層下まで）で動作するが、途中の様子はいつものメインに見えない。',
    ])
  );
}

// ---------------------------------------------------------------------------
// 10. 役割で分ける vs 部品で分ける（8.2節）
// ---------------------------------------------------------------------------
{
  const d = new DiagramCanvas(
    'subagent-00-10-role-vs-part-split.svg',
    '7章（役割で分ける）と8章（部品で分ける）の構造の違い',
    '異なる役割ごとに定義ファイルを用意する方法と、同じ定義ファイルを依頼文だけ変えて使い回す方法'
  );

  d.group(36, 124, 548, 352, '役割で分ける（7章）', 'parent', { fillOpacity: 0.4 });
  d.card(62, 272, 116, 80, '親', ['page-director'], 'parent', { titleSize: 18, bodySize: 12.5 });
  for (const cy of [214, 312, 410]) {
    d.route(`M178 312 H228 V${cy} H280`, 'parent');
  }
  d.card(280, 178, 276, 72, 'HTML 担当', ['markup-builder.md'], 'sub', { titleSize: 17, bodySize: 13 });
  d.card(280, 276, 276, 72, 'CSS 担当', ['style-builder.md'], 'sub', { titleSize: 17, bodySize: 13 });
  d.card(280, 374, 276, 72, 'JS 担当', ['script-builder.md'], 'sub', { titleSize: 17, bodySize: 13 });

  d.group(616, 124, 548, 352, '部品で分ける（この章）', 'sub', { fillOpacity: 0.4 });
  d.card(642, 272, 116, 80, '親', ['cad-director'], 'parent', { titleSize: 18, bodySize: 12.5 });
  for (const cy of [214, 312, 410]) {
    d.route(`M758 312 H808 V${cy} H860`, 'parent');
  }
  d.card(860, 178, 276, 72, '部品職人：パーツ1', ['part-modeler.md を使い回し'], 'sub', { titleSize: 16.5, bodySize: 13 });
  d.card(860, 276, 276, 72, '部品職人：パーツ2', ['part-modeler.md を使い回し'], 'sub', { titleSize: 16.5, bodySize: 13 });
  d.card(860, 374, 276, 72, '部品職人：パーツ3', ['part-modeler.md を使い回し'], 'sub', { titleSize: 16.5, bodySize: 13 });

  results.push(
    d.finish(604, [
      '・部品で分ける場合、同じ subagent_type（part-modeler）に「担当パーツ番号」だけ異なる依頼文を渡して並列起動できる。',
      '・つなぎ目の約束事も、7章の「id / class 名」から、8章では「座標系・単位・占有範囲・合わせ面寸法」の数値表になる。',
    ])
  );
}

// ---------------------------------------------------------------------------
// 11. 道具の奪い合いを避ける分担（8.5節）
// ---------------------------------------------------------------------------
{
  const d = new DiagramCanvas(
    'subagent-00-11-tool-contention-avoidance.svg',
    '道具の奪い合いを避ける「並列（子）」と「直列（親）」の境界',
    '子は各自別プロセスで形状ファイル（STEP）を作るまでを担当し、共有の CAD ツールは親が最後に1回だけ使う'
  );

  d.group(36, 124, 464, 340, '並列（子）：各自の別プロセス', 'sub', { fillOpacity: 0.35 });
  const rows = [
    { y: 184, code: 'パーツ1のコード', step: 'p1.step' },
    { y: 274, code: 'パーツ2のコード', step: 'p2.step' },
    { y: 364, code: 'パーツ3のコード', step: 'p3.step' },
  ];
  for (const r of rows) {
    d.card(56, r.y, 210, 68, r.code, ['担当フォルダ内で実行'], 'sub', { titleSize: 15.5, bodySize: 12.5 });
    d.arrow(266, r.y + 34, 326, r.y + 34, 'sub');
    d.card(326, r.y, 154, 68, r.step, ['形状ファイル'], 'tool', { titleSize: 16.5, bodySize: 12.5 });
    d.route(`M480 ${r.y + 34} H528 V294`, 'tool', { noHead: true });
  }
  d.arrow(528, 294, 582, 294, 'tool');

  d.group(554, 124, 610, 340, '直列（親）：共有の道具はここだけ', 'rule', { fillOpacity: 0.35 });
  d.card(582, 234, 184, 120, '組み立てスクリプト', ['決められた座標に', '全パーツを配置'], 'rule', { titleSize: 15.5, bodySize: 13.5 });
  d.arrow(766, 294, 798, 294, 'rule');
  d.card(798, 234, 152, 120, '数値検品', ['干渉・寸法', 'すき間を確認'], 'rule', { titleSize: 16.5, bodySize: 13.5 });
  d.arrow(950, 294, 982, 294, 'rule');
  d.card(982, 234, 164, 120, 'CAD ツールで開く', ['最終確認・', '書き出し'], 'warn', { titleSize: 15.5, bodySize: 13.5, badge: '共有GUI' });

  results.push(
    d.finish(592, [
      '・CadQuery や OpenSCAD の CLI のように呼ぶたび別プロセスで動く道具は、出力先を分ければ子が並列で実行できる。',
      '・1つだけ起動するデスクトップ GUI の CAD（MCP 経由を含む）を複数の子が同時に触ると作業中の状態が壊れるため親に限定する。',
    ])
  );
}

// ---------------------------------------------------------------------------
// 12. パーツ増加時の3段階層化（8.7節）
// ---------------------------------------------------------------------------
{
  const d = new DiagramCanvas(
    'subagent-00-12-hierarchical-subassembly.svg',
    'パーツが増えたときの3段階層化（サブアセンブリ単位の分担）',
    '中間の親がユニット内の合わせ面を検品し、最上位の親がユニット同士の合わせ面だけを検品する'
  );

  d.card(410, 124, 380, 82, '親：cad-director', ['全体設計・最終組み立て'], 'parent', { titleSize: 19, bodySize: 14.5, badge: '第1階層（メイン）' });

  d.group(36, 244, 550, 250, '上側サブアセンブリ', 'rule', { fillOpacity: 0.25, dash: '6 4', badgeSize: 13 });
  d.group(614, 244, 550, 250, '下側サブアセンブリ', 'rule', { fillOpacity: 0.25, dash: '6 4', badgeSize: 13 });

  d.card(146, 298, 330, 74, '中間の親：上側ユニット担当', ['ユニット内の合わせ面を検品'], 'rule', { titleSize: 16.5, bodySize: 13 });
  d.card(724, 298, 330, 74, '中間の親：下側ユニット担当', ['ユニット内の合わせ面を検品'], 'rule', { titleSize: 16.5, bodySize: 13 });

  d.route('M600 206 V226 H311 V298', 'parent');
  d.route('M600 206 V226 H889 V298', 'parent');

  const workersLeft = [
    { x: 54,  label: '部品職人 p1' },
    { x: 230, label: '部品職人 p2' },
    { x: 406, label: '部品職人 p3' },
  ];
  const workersRight = [
    { x: 632, label: '部品職人 p4' },
    { x: 808, label: '部品職人 p5' },
    { x: 984, label: '部品職人 p6' },
  ];
  for (const w of workersLeft) {
    d.route(`M311 372 V394 H${w.x + 81} V414`, 'rule');
    d.card(w.x, 414, 162, 64, w.label, ['STEP 出力'], 'sub', { titleSize: 15.5, bodySize: 12.5 });
  }
  for (const w of workersRight) {
    d.route(`M889 372 V394 H${w.x + 81} V414`, 'rule');
    d.card(w.x, 414, 162, 64, w.label, ['STEP 出力'], 'sub', { titleSize: 15.5, bodySize: 12.5 });
  }

  results.push(
    d.finish(620, [
      '・パーツが増えると合わせ面（最大 n(n−1)/2）が急増するため、ユニットごとに中間の親を置くと検品負荷を一定に保てる。',
      '・この3段構成は Claude Code の既定入れ子制限（メインから3階層下まで）の範囲内で動作する（samples/04-hierarchical/）。',
    ])
  );
}

// ---------------------------------------------------------------------------
// 13. CAD 部品の並列モデリング・組み立て・検品シーケンス図（8.8節）
// ---------------------------------------------------------------------------
{
  const s = new SequenceDiagram(
    'subagent-00-13-cad-assembly-sequence.svg',
    '応用：CAD 部品の並列作成から数値検品・最終確認までのシーケンス',
    '部品職人 ×N が STEP 出力と自己照合までを並列で行い、親が配置・数値検査・CAD ツール読み込みを担う',
    [
      { id: 'P', name: '親（cad-director）', sub: '設計・発注・検品・統合', x: 164, role: 'parent' },
      { id: 'W', name: '部品職人 ×N', sub: '並列・各パーツ制作', x: 454, role: 'sub' },
      { id: 'F', name: 'work フォルダ', sub: 'spec.md・STEP・出力', x: 744, role: 'tool' },
      { id: 'T', name: 'CAD ツール', sub: '最後に親が1回だけ操作', x: 1034, role: 'warn' },
    ]
  );

  s.phase('① 共通仕様を書き出し、部品職人に並列でモデリングさせる');
  s.message('P', 'F', 'spec.md（座標系・占有範囲・合わせ面）を書く');
  s.message('P', 'W', ['パーツ番号ごとに依頼', '（同時に最大5体程度）']);
  s.message('W', 'F', ['コードと STEP を書き出し、', '自分で寸法を照合']);
  s.message('W', 'P', '報告（外形寸法・照合結果）', { reply: true });

  s.phase('② 全パーツを配置して数値で検品し、問題箇所だけ差し戻す');
  s.message('P', 'F', '組み立てスクリプトで全パーツを配置');
  s.message('P', 'F', '干渉・すき間・全体寸法を数値で検査');

  const altGrp = s.beginGroup('alt 問題あり', null, 'warn', { fill: '#fffbeb' });
  s.y += 38;
  s.message('P', 'W', ['該当パーツの担当にだけ', '差し戻し']);
  s.message('W', 'P', '修正の報告', { reply: true });
  s.endGroup(altGrp);

  s.phase('③ 共有の CAD ツールで最終確認と書き出し');
  s.message('P', 'T', '組み立て済みの形状を読み込み、最終確認・書き出し');

  results.push(
    s.save([
      '・検品は目視だけでなく、干渉体積（0確認）・合わせ面のすき間・占有範囲を数値で検査する仕組みにすることで精度を保つ。',
      '・共有の GUI CAD ツールは最後の③で親が1回だけ開き、作業中の競合を防ぐ。',
    ])
  );
}

// ---------------------------------------------------------------------------
// 14. 部品製作を並列にするかどうかの判断フロー（8.9節）
// ---------------------------------------------------------------------------
{
  const d = new DiagramCanvas(
    'subagent-00-14-parallel-cad-decision.svg',
    'CAD・3D 部品製作を並列にするかどうかの判断フロー',
    '合わせ面の少なさ・使う道具の別プロセス可否・パーツ数を順に確認し、最後に親が数値で検品する'
  );

  d.card(420, 122, 220, 56, '製品を作る', [], 'user', { titleSize: 18 });
  d.arrow(530, 178, 530, 210, 'user');

  d.decision(350, 210, 360, 88, ['パーツ同士の合わせ面は', '少なく、寸法で決めきれる？']);

  d.arrow(350, 254, 266, 254, 'warn');
  d.pill(308, 234, 'いいえ', 'warn', { size: 12.5, padX: 10 });
  d.card(36, 210, 230, 88, '深く噛み合う部分は', ['1体にまとめて作る'], 'parent', { titleSize: 16.5, bodySize: 15.5, bodyColor: PALETTE.parent.text });
  d.route('M151 298 V757 H310', 'parent');

  d.arrow(530, 298, 530, 344, 'warn');
  d.pill(530, 321, 'はい', 'warn', { size: 12.5, padX: 10 });

  d.decision(350, 344, 360, 86, ['使う道具は', '別プロセスで動く？']);

  d.arrow(710, 387, 884, 387, 'warn');
  d.pill(797, 366, ['いいえ', '（共有の GUI など）'], 'warn', { size: 12, padX: 10, lineH: 16 });
  d.card(884, 344, 280, 86, '子はファイル作成まで', ['道具は親が最後に1回'], 'tool', { titleSize: 16.5, bodySize: 14.5 });
  d.route('M1024 430 V509 H680', 'tool');

  d.arrow(530, 430, 530, 472, 'warn');
  d.pill(530, 451, 'はい', 'warn', { size: 12.5, padX: 10 });

  d.decision(380, 472, 300, 74, ['パーツは何個？']);

  d.route('M460 546 V564 H415 V614', 'sub');
  d.pill(415, 586, '〜5個', 'sub', { size: 12.5, padX: 10 });
  d.card(310, 614, 210, 72, '全部を並列', [], 'sub', { titleSize: 17.5 });

  d.route('M600 546 V564 H695 V614', 'sub');
  d.pill(695, 586, '6個以上', 'sub', { size: 12.5, padX: 10 });
  d.card(550, 614, 290, 72, '波に分ける', ['or ユニットごとに階層化'], 'sub', { titleSize: 17, bodySize: 13.5 });

  d.arrow(415, 686, 415, 724, 'sub');
  d.arrow(695, 686, 695, 724, 'sub');
  d.card(310, 724, 530, 70, '親が数値で検品', ['干渉体積・寸法・すき間を数値で確認'], 'rule', { titleSize: 19, bodySize: 14 });

  results.push(
    d.finish(918, [
      '・依存関係が深く頻繁に寸法を擦り合わせる部分は無理に分けず、1体にまとめて作らせる方が品質と手戻りの面で安全。',
      '・共有 GUI の道具を挟む場合も、STEP 書き出しまでを並列化しつつ道具操作だけを親に寄せ、最後に必ず数値で検品する。',
    ])
  );
}

console.log(`Generated ${results.length} SVG diagrams in ${OUT_DIR}:`);
for (const r of results) {
  console.log(`  - ${r.filename} (1200x${r.height})`);
}
