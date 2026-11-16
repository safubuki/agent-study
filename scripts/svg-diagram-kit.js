'use strict';

// SVG 図・シーケンス図の共通描画ユーティリティ（Node.js 標準モジュールのみ使用）。
const fs = require('node:fs');
const path = require('node:path');

const SVG_WIDTH = 1200;
const FONT_FAMILY = "'Noto Sans JP', 'Yu Gothic UI', Meiryo, sans-serif";
const SEQUENCE_COLUMNS = [110, 306, 502, 698, 894, 1090];

// ガイド全体で統一する役割別カラーパレット（枠線・文字色 color と背景塗潰し色 fill）。
const PALETTE = {
  slate:   { id: 'slate',   color: '#475569', fill: '#f8fafc' },
  blue:    { id: 'blue',    color: '#2563eb', fill: '#eff6ff' },
  violet:  { id: 'violet',  color: '#7c3aed', fill: '#f5f3ff' },
  emerald: { id: 'emerald', color: '#059669', fill: '#ecfdf5' },
  cyan:    { id: 'cyan',    color: '#0e7490', fill: '#ecfeff' },
  amber:   { id: 'amber',   color: '#b45309', fill: '#fffbeb' },
  process: { id: 'process', color: '#64748b', fill: '#f8fafc' },
  sdk:     { id: 'sdk',     color: '#6366f1', fill: '#eef2ff' },
};

const DEFAULT_LAYOUT = {
  width: SVG_WIDTH,
  titleY: 48,
  subtitleY: 82,
  subtitleBoundsY: 60,
  footerBoxH: 34,
  footerTextOffsetY: 17,
  footerTextSize: 15,
  footerBoundsH: 30,
  sequenceLegend: {
    y: 108,
    size: 12.5,
    boundsY: 90,
    text: '列順・配色を固定　上→下が時間　矢印の色＝送り手　横破線＝結果・応答　評価AIモデル群の列は必要なときだけ使用',
  },
};

const DEFAULT_NOTE_STYLE = {
  x: 28,
  w: 1144,
  padH: 28,
  rx: 9,
  textX: 44,
  textOffsetY: 28,
  boundsX: 38,
  boundsOffsetY: 4,
  boundsW: 1124,
  boundsPadH: 20,
  gapAfter: 20,
  footerTopGap: 42,
  footerBottomMargin: 20,
};

const XML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };

/**
 * XML/SVG の属性値やテキストノード向けに特殊文字をエスケープする。
 */
function esc(value) {
  return String(value).replace(/[&<>"']/g, ch => XML_ESCAPES[ch]);
}

/**
 * 半角文字と全角文字を区別して文字列の描画幅を概算する。
 * メッセージ文字が縦のライフラインを跨ぐか判定し、白抜き縁取り（halo）を付けるために使う。
 */
function estWidth(str, size) {
  let width = 0;
  for (const ch of String(str)) {
    width += /[\x00-\x7f]/.test(ch) ? size * 0.56 : size * 1.02;
  }
  return width;
}

/**
 * シーケンス図の登場人物配列を共通パレットと既定列位置から構築する。
 */
function defineActors(specs, columns = SEQUENCE_COLUMNS) {
  return specs.map((spec, index) => {
    const token = spec.role ? PALETTE[spec.role] : null;
    if (spec.role && !token) {
      throw new Error(`未知のパレットロールです: ${spec.role}`);
    }
    const x = spec.x ?? columns[index];
    if (typeof x !== 'number') {
      throw new Error(`アクター "${spec.id}" の x 座標が未定義です`);
    }
    return {
      id: spec.id,
      name: spec.name,
      sub: spec.sub,
      x,
      color: spec.color ?? token.color,
      fill: spec.fill ?? token.fill,
    };
  });
}

/**
 * 登場人物配列と追加ロールから、role 名で色情報を引けるパレット辞書を作成する。
 */
function buildPalette(actors = [], extraRoles = {}) {
  const palette = Object.fromEntries(actors.map(a => [a.id, a]));
  for (const [key, value] of Object.entries(extraRoles)) {
    const token = typeof value === 'string' ? PALETTE[value] : value;
    if (!token) {
      throw new Error(`未知の追加ロールです: ${key}`);
    }
    palette[key] = { ...token, id: token.id ?? key };
  }
  return palette;
}

/**
 * 矢印の終端マーカー（<marker id="arrow-...">）SVG 要素文字列の配列を生成する。
 */
function renderArrowMarkers(entries) {
  return entries.map(
    a => `<marker id="arrow-${a.id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="${a.color}"/></marker>`
  );
}

/**
 * テキスト SVG 要素を生成する。halo が指定された場合は背後の縦線と重なっても読めるよう、
 * 塗りなし・背景色ストロークの縁取りテキストを先に重ねて出力する。
 */
function renderHaloTextElements({
  x,
  y,
  value,
  size = 17,
  color = '#475569',
  weight = 400,
  anchor = 'start',
  halo = null,
  haloWidth = 6.5,
}) {
  const escaped = esc(value);
  const elements = [];
  if (halo) {
    elements.push(
      `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" fill="none" stroke="${halo}" stroke-width="${haloWidth}" stroke-linejoin="round" stroke-linecap="round">${escaped}</text>`
    );
  }
  elements.push(
    `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${escaped}</text>`
  );
  return elements;
}

/**
 * 中央揃えの複数行テキストがいずれかの登場人物の垂直ラインと交差するか判定する。
 */
function crossesActorLine(actors, center, lines, fontSize = 16.5, padding = 4) {
  const normalized = Array.isArray(lines) ? lines : [lines];
  const maxW = Math.max(...normalized.map(line => estWidth(line, fontSize)));
  const textLeft = center - maxW / 2 - padding;
  const textRight = center + maxW / 2 + padding;
  return actors.some(act => textLeft < act.x && act.x < textRight);
}

/**
 * QA 検証スクリプト向けの要素領域（regions）メタデータを JSON ファイルへ書き出す。
 */
function writeQaReport(targetPath, payload) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, JSON.stringify(payload, null, 2), 'utf8');
}

function mergeDrawingOptions(base = {}, override = {}) {
  return {
    ...base,
    ...override,
    layout: { ...DEFAULT_LAYOUT, ...(base.layout ?? {}), ...(override.layout ?? {}) },
    noteStyle: { ...DEFAULT_NOTE_STYLE, ...(base.noteStyle ?? {}), ...(override.noteStyle ?? {}) },
  };
}

/**
 * 汎用 SVG 図（構成図・比較図・フロー図・シーケンス図の共通土台）を組み立てる描画クラス。
 */
class Drawing {
  constructor(file, title, subtitle, options = {}) {
    const merged = mergeDrawingOptions({}, options);
    this.file = file;
    this.filename = file;
    this.title = title;
    this.subtitle = subtitle;
    this.bgParts = [];
    this.parts = [];
    this.regions = [];
    this.y = merged.startY ?? 224;
    this.options = merged;
    this.actors = merged.actors ?? [];
    this.palette = merged.palette ?? buildPalette(this.actors);
    this.layout = merged.layout;
    this.noteStyle = merged.noteStyle;
  }

  resolveRole(role) {
    const entry = this.palette[role] ?? PALETTE[role];
    if (!entry) {
      throw new Error(`未定義のロールです: ${role}`);
    }
    return entry;
  }

  rect(x, y, w, h, fill = '#fff', stroke = 'none', rx = 9, target = this.parts) {
    target.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}"/>`);
  }

  text(
    x,
    y,
    value,
    size = 17,
    color = '#475569',
    weight = 400,
    anchor = 'start',
    bounds = [24, 8, 1152, 4000],
    halo = null,
    haloWidth = 6.5
  ) {
    this.parts.push(
      ...renderHaloTextElements({ x, y, value, size, color, weight, anchor, halo, haloWidth })
    );
    this.regions.push(bounds);
  }

  line(x1, y1, x2, y2, role = 'harness', reply = false, arrow = true) {
    const color = this.resolveRole(role).color;
    this.parts.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${reply ? 1.5 : 2}"${reply ? ' stroke-dasharray="5 5"' : ''}${arrow ? ` marker-end="url(#arrow-${role})"` : ''}/>`
    );
  }

  route(points, role = 'harness', reply = false) {
    const color = this.resolveRole(role).color;
    this.parts.push(
      `<path d="${points}" fill="none" stroke="${color}" stroke-width="2"${reply ? ' stroke-dasharray="5 5"' : ''} marker-end="url(#arrow-${role})"/>`
    );
  }

  box(x, y, w, h, title, lines, role = 'harness', titleSize = 21) {
    const a = this.resolveRole(role);
    this.rect(x, y, w, h, a.fill, a.color, 11);
    this.text(x + w / 2, y + 32, title, titleSize, a.color, 700, 'middle', [x + 10, y + 4, w - 20, 42]);
    lines.forEach((s, i) =>
      this.text(x + w / 2, y + 64 + i * 27, s, 17, '#475569', 400, 'middle', [x + 10, y + 42, w - 20, h - 46])
    );
  }

  noteAt(y, lines) {
    const ns = this.noteStyle;
    const normalized = Array.isArray(lines) ? lines : [lines];
    const h = normalized.length * 27 + ns.padH;
    this.rect(ns.x, y, ns.w, h, '#f8fafc', '#e2e8f0', ns.rx);
    normalized.forEach((s, i) => {
      this.text(ns.textX, y + ns.textOffsetY + i * 27, s, 16, '#475569', 400, 'start', [
        ns.boundsX,
        y + ns.boundsOffsetY,
        ns.boundsW,
        normalized.length * 27 + ns.boundsPadH,
      ]);
    });
    return h;
  }

  finish(height, notes, sequence = false) {
    const bg = this.bgParts;
    const content = this.parts;
    const contentRegions = this.regions;
    const bodyEnd = this.y;
    const layout = this.layout;
    const ns = this.noteStyle;
    const normalizedNotes = Array.isArray(notes) ? notes : [notes];

    this.bgParts = [];
    this.parts = [];
    this.regions = [];

    this.parts.push(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${height}" role="img" aria-labelledby="title desc" font-family="${FONT_FAMILY}">`
    );
    if (this.options.generatorComment) {
      this.parts.push(this.options.generatorComment);
    }

    const desc = `${this.subtitle}${this.options.descSuffix ?? ''}`;
    const titleDesc = `<title id="title">${esc(this.title)}</title><desc id="desc">${esc(desc)}</desc>`;
    const markerEntries = this.options.markerEntries ?? Object.values(this.palette);
    if (this.options.defsInline) {
      this.parts.push(`${titleDesc}<defs>`);
    } else {
      this.parts.push(titleDesc);
      this.parts.push('<defs>');
    }
    this.parts.push(...renderArrowMarkers(markerEntries));
    this.parts.push('</defs>');

    this.rect(1, 1, layout.width - 2, height - 2, '#fff', '#e2e8f0', 18);
    this.text(28, layout.titleY, this.title, 27, '#0f172a', 700, 'start', [24, 8, 1152, 54]);
    this.text(28, layout.subtitleY, this.subtitle, 16, '#475569', 400, 'start', [24, layout.subtitleBoundsY, 1152, 34]);

    if (sequence) {
      if (layout.sequenceLegend) {
        const leg = layout.sequenceLegend;
        this.text(28, leg.y, leg.text, leg.size, '#475569', 400, 'start', [24, leg.boundsY, 1152, 30]);
      }
      // 先にフェーズ背景帯（bg）を配置し、その上からライフラインを通すことで縦線が途切れないようにする。
      this.parts.push(...bg);
      for (const a of this.actors) {
        this.parts.push(`<g data-participant="${a.id}">`);
        this.parts.push(
          `<line x1="${a.x}" y1="194" x2="${a.x}" y2="${bodyEnd - 6}" stroke="${a.color}" stroke-width="1.4" stroke-dasharray="4 6" opacity="0.65"/>`
        );
        this.rect(a.x - 90, 124, 180, 70, a.fill, a.color, 9);
        this.text(a.x, 153, a.name, 18, a.color, 700, 'middle', [a.x - 84, 130, 168, 36]);
        this.text(a.x, 180, a.sub, 13, '#475569', 400, 'middle', [a.x - 84, 160, 168, 30]);
        this.parts.push('</g>');
      }
      // 下端にも列ラベルを置き、長い図でも途中で線を切らずに列を確認できるようにする。
      for (const a of this.actors) {
        this.rect(a.x - 90, bodyEnd - 6, 180, layout.footerBoxH, a.fill, a.color, 6);
        this.text(a.x, bodyEnd + layout.footerTextOffsetY, a.name, layout.footerTextSize, a.color, 700, 'middle', [
          a.x - 84,
          bodyEnd - 4,
          168,
          layout.footerBoundsH,
        ]);
      }
    } else {
      this.parts.push(...bg);
    }

    this.parts.push(...content);
    this.regions.push(...contentRegions);
    const footerNoteY = height - normalizedNotes.length * 27 - (ns.padH + ns.footerBottomMargin);
    this.noteAt(footerNoteY, normalizedNotes);
    this.parts.push('</svg>');

    const svg = this.parts.join('\n') + '\n';
    if (this.options.outputDir) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
      fs.writeFileSync(path.join(this.options.outputDir, this.file), svg, 'utf8');
    }

    const result = {
      file: this.file,
      filename: this.file,
      height,
      sequence,
      regions: this.regions,
    };
    if (typeof this.options.onFinish === 'function') {
      this.options.onFinish(result);
    }
    return result;
  }
}

/**
 * 縦方向（上から下へ時間経過）にイベントを積み上げるシーケンス図クラス。
 */
class Sequence extends Drawing {
  phase(label, repeat = false) {
    // 背景帯は bgParts（ライフラインの裏）へ描画し、縦線が消えないようにする。
    this.rect(24, this.y, 1152, 36, '#f8fafc', '#e2e8f0', 6, this.bgParts);
    this.text(40, this.y + 24, label, 16.5, '#334155', 700, 'start', [32, this.y + 2, 1136, 32], '#f8fafc');
    this.y += 60;
    if (repeat) {
      for (const a of this.actors) {
        this.rect(a.x - 90, this.y - 10, 180, 32, a.fill, a.color, 6);
        this.text(a.x, this.y + 12, a.name, 14.5, a.color, 700, 'middle', [a.x - 84, this.y - 8, 168, 28]);
      }
      this.y += 46;
    }
    return this;
  }

  message(from, to, labels, reply = false) {
    const lines = Array.isArray(labels) ? labels : [labels];
    const a = this.resolveRole(from);
    const b = this.resolveRole(to);
    const center = (a.x + b.x) / 2;
    const top = this.y;
    // 文字が中間の縦線に重なるときだけ文字自体の輪郭を白抜き(halo)にし、白い横帯は描かない。
    const halo = crossesActorLine(this.actors, center, lines, 16.5) ? '#ffffff' : null;
    lines.forEach((line, i) => {
      this.text(center, top + 22 + i * 26, line, 16.5, a.color, 600, 'middle', [center - 260, top - 1, 520, 28], halo);
    });
    const arrowY = top + lines.length * 26 + 12;
    this.line(a.x, arrowY, b.x, arrowY, from, reply);
    this.y = arrowY + 24;
    return this;
  }

  action(id, lines) {
    const normalized = Array.isArray(lines) ? lines : [lines];
    const a = this.resolveRole(id);
    const h = normalized.length * 26 + 20;
    this.rect(a.x - 88, this.y, 176, h, a.fill, a.color, 8);
    normalized.forEach((line, i) => {
      this.text(a.x, this.y + 27 + i * 26, line, 15.5, a.color, 500, 'middle', [a.x - 82, this.y + 2, 164, h - 4]);
    });
    this.y += h + 22;
    return this;
  }

  note(lines) {
    const normalized = Array.isArray(lines) ? lines : [lines];
    const h = this.noteAt(this.y, normalized);
    this.y += h + this.noteStyle.gapAfter;
    return this;
  }

  save(notes) {
    const normalized = Array.isArray(notes) ? notes : [notes];
    const ns = this.noteStyle;
    const height = this.y + ns.footerTopGap + (normalized.length * 27 + ns.padH) + ns.footerBottomMargin;
    const result = super.finish(height, normalized, true);
    return { filename: result.filename, height: result.height, regions: result.regions };
  }

  finish(heightOrNotes, notes, sequence = true) {
    if (Array.isArray(heightOrNotes) || typeof heightOrNotes === 'string') {
      return this.save(heightOrNotes);
    }
    return super.finish(heightOrNotes, notes, sequence);
  }
}

/**
 * 出力先ディレクトリ・登場人物・パレット・レイアウト設定を束縛した
 * Drawing / Sequence クラス組を生成する（既存の 3 引数コンストラクタ呼び出し互換用）。
 */
function createDiagramKit(kitOptions = {}) {
  const actors = kitOptions.actors ?? [];
  const palette = kitOptions.palette ?? buildPalette(actors);
  const baseOptions = mergeDrawingOptions(kitOptions, { actors, palette });

  class BoundDrawing extends Drawing {
    constructor(file, title, subtitle, instanceOptions = {}) {
      super(file, title, subtitle, mergeDrawingOptions(baseOptions, instanceOptions));
    }
  }

  class BoundSequence extends Sequence {
    constructor(file, title, subtitle, instanceOptions = {}) {
      super(file, title, subtitle, mergeDrawingOptions(baseOptions, instanceOptions));
    }
  }

  return {
    Drawing: BoundDrawing,
    Sequence: BoundSequence,
    actors,
    palette,
  };
}

module.exports = {
  SVG_WIDTH,
  FONT_FAMILY,
  SEQUENCE_COLUMNS,
  PALETTE,
  DEFAULT_LAYOUT,
  DEFAULT_NOTE_STYLE,
  esc,
  estWidth,
  defineActors,
  buildPalette,
  renderArrowMarkers,
  renderHaloTextElements,
  crossesActorLine,
  writeQaReport,
  Drawing,
  Sequence,
  createDiagramKit,
};
