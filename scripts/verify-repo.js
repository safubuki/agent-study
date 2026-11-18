#!/usr/bin/env node
/**
 * scripts/verify-repo.js
 *
 * リポジトリ全体の品質を一括検証するスクリプト（Node.js 標準モジュールのみ使用）。
 * 検証項目:
 *   1. hook-guide/scripts/test-hooks-locally.js の実行
 *   2. mcp-guide/scripts/test-mcp-server.js の実行（本体 + サンプル4種）
 *   3. 全 Markdown（output/ 配下を除く）のローカルリンク・画像リンク・見出しアンカー整合性チェック
 *   4. 全 JSON / JSONC（.vscode/settings.json 等の VS Code 設定は JSONC として区別）の構文チェック
 *   5. 全 .svg ファイルの最低限の XML 整形式・viewBox 存在チェック
 *   6. agent-skill/scripts/test-samples.js の実行（保護フック・出荷前チェック・利用ログ・棚卸し）
 */
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoRoot = path.resolve(__dirname, '..');

function toPosix(p) {
  return p.replace(/\\/g, '/');
}

function relFromRoot(absPath) {
  return toPosix(path.relative(repoRoot, absPath));
}

function collectFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, out);
    } else if (entry.isFile()) {
      out.push(fullPath);
    }
  }
  return out;
}

// =====================================================================
// 1. フックローカルテストの実行
// =====================================================================
function verifyHooks() {
  const scriptPath = path.join(repoRoot, 'hook-guide/scripts/test-hooks-locally.js');
  const res = spawnSync(process.execPath, [scriptPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 30000
  });

  if (res.status !== 0) {
    return {
      ok: false,
      summary: `hook-guide ローカルテスト失敗（exit=${res.status}）`,
      errors: [
        res.error ? res.error.message : '',
        res.stdout ? res.stdout.trim() : '',
        res.stderr ? res.stderr.trim() : ''
      ].filter(Boolean)
    };
  }

  const resultLine = (res.stdout || '')
    .split(/\r?\n/)
    .find((line) => line.includes('結果:'));
  return {
    ok: true,
    summary: resultLine ? resultLine.trim() : 'hook-guide ローカルテスト合格',
    errors: []
  };
}

// =====================================================================
// 2. MCP サーバー通信テストの実行（本体 + サンプル4種）
// =====================================================================
function verifyMcpServers() {
  const testScript = path.join(repoRoot, 'mcp-guide/scripts/test-mcp-server.js');
  const targets = [
    'servers/cafe-catalog-mcp.js',
    'samples/01-minimal-stdio/server.js',
    'samples/02-knowledge-search/glossary-mcp.js',
    'samples/03-workflow-facade/catering-plan-mcp.js',
    'samples/05-resources-and-prompts/full-feature-mcp.js'
  ];

  const errors = [];
  for (const target of targets) {
    const res = spawnSync(process.execPath, [testScript, target], {
      cwd: repoRoot,
      encoding: 'utf8',
      timeout: 20000
    });
    if (res.status !== 0) {
      errors.push(
        `${target}: exit=${res.status}${res.error ? ` (${res.error.message})` : ''}\n${(res.stderr || res.stdout || '').trim()}`
      );
    }
  }

  return {
    ok: errors.length === 0,
    summary: `MCP サーバー ${targets.length - errors.length} / ${targets.length} 種合格`,
    errors
  };
}

// =====================================================================
// 3. Markdown リンク・画像・見出しアンカー整合性チェック
// =====================================================================
function stripFrontmatter(lines) {
  if (lines.length > 0 && lines[0].replace(/^\uFEFF/, '').trim() === '---') {
    for (let i = 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed === '---' || trimmed === '...') {
        return i + 1;
      }
    }
  }
  return 0;
}

function updateFenceState(line, fence) {
  const m = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
  if (!m) return fence;
  const marker = m[1];
  const rest = m[2];
  const ch = marker[0];
  const len = marker.length;
  if (!fence) {
    // CommonMark 仕様上、バッククォートフェンスの info string に '`' は含められない（インラインコード扱い）
    if (ch === '`' && rest.includes('`')) return null;
    return { ch, len };
  }
  if (fence.ch === ch && len >= fence.len && rest.trim() === '') {
    return null;
  }
  return fence;
}

function maskInlineCode(line) {
  // 複数バッククォートを含むインラインコードを空白に置き換える
  let out = '';
  let i = 0;
  while (i < line.length) {
    if (line[i] === '`') {
      let tickLen = 0;
      while (i + tickLen < line.length && line[i + tickLen] === '`') tickLen++;
      const closer = line.indexOf('`'.repeat(tickLen), i + tickLen);
      if (closer !== -1) {
        out += ' '.repeat(closer + tickLen - i);
        i = closer + tickLen;
        continue;
      }
    }
    out += line[i];
    i++;
  }
  return out;
}

function slugifyHeading(rawText) {
  let s = rawText
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/(\*\*|__|~~)(.*?)\1/g, '$2')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/(^|\s)_([^_]+)_(\s|$)/g, '$1$2$3');

  s = s.trim().toLowerCase();
  // GitHub 互換スラッグ規則: Unicode の文字・結合マーク・数字・空白・'_'・'-' を残し、空白を '-' にする
  s = s.replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '');
  s = s.replace(/\s/g, '-');
  return s;
}

function extractMarkdownAnchors(content) {
  const lines = content.split(/\r?\n/);
  const startLine = stripFrontmatter(lines);
  const slugs = new Set();
  const counts = new Map();
  let fence = null;
  let inHtmlComment = false;

  for (let idx = startLine; idx < lines.length; idx++) {
    let line = lines[idx];
    fence = updateFenceState(line, fence);
    if (fence) continue;

    if (inHtmlComment) {
      const endComment = line.indexOf('-->');
      if (endComment === -1) continue;
      line = line.slice(endComment + 3);
      inHtmlComment = false;
    }
    line = line.replace(/<!--[\s\S]*?-->/g, '');
    const openComment = line.indexOf('<!--');
    if (openComment !== -1) {
      line = line.slice(0, openComment);
      inHtmlComment = true;
    }

    // 明示的な HTML アンカー (<a id="..."> / <a name="...">)
    const htmlAnchorRe = /<a\b[^>]*\b(?:id|name)\s*=\s*["']([^"']+)["']/gi;
    let am;
    while ((am = htmlAnchorRe.exec(line)) !== null) {
      slugs.add(am[1]);
    }

    const hm = line.match(/^\s{0,3}#{1,6}\s+(.+?)(?:\s+#+)?\s*$/);
    if (!hm) continue;
    const base = slugifyHeading(hm[1]);
    if (!base) continue;
    const count = counts.get(base) || 0;
    counts.set(base, count + 1);
    slugs.add(count === 0 ? base : `${base}-${count}`);
  }

  return slugs;
}

function extractInlineLinks(line) {
  // 括弧のバランスと画像プレフィックス '!' を保ちながら [text](target) を抽出する
  const results = [];
  let i = 0;
  while (i < line.length) {
    const isImage = line[i] === '!' && line[i + 1] === '[';
    if (isImage || line[i] === '[') {
      const labelStart = isImage ? i + 2 : i + 1;
      let j = labelStart;
      let bracketDepth = 1;
      while (j < line.length && bracketDepth > 0) {
        if (line[j] === '\\') {
          j += 2;
          continue;
        }
        if (line[j] === '[') bracketDepth++;
        else if (line[j] === ']') bracketDepth--;
        j++;
      }
      if (bracketDepth === 0 && line[j] === '(') {
        let k = j + 1;
        let parenDepth = 1;
        let inQuotes = null;
        while (k < line.length && parenDepth > 0) {
          const ch = line[k];
          if (ch === '\\') {
            k += 2;
            continue;
          }
          if (inQuotes) {
            if (ch === inQuotes) inQuotes = null;
          } else {
            if (ch === '"' || ch === "'") inQuotes = ch;
            else if (ch === '(') parenDepth++;
            else if (ch === ')') parenDepth--;
          }
          k++;
        }
        if (parenDepth === 0) {
          const rawTarget = line.slice(j + 1, k - 1).trim();
          results.push({ isImage, rawTarget });
          // 画像を内包するリンク ([![alt](img)](page)) の内側も検証できるよう labelStart から継続する
          i = labelStart;
          continue;
        }
      }
    }
    i++;
  }
  return results;
}

function normalizeLinkTarget(rawTarget) {
  let target = rawTarget.trim();
  if (target.startsWith('<')) {
    const endAngle = target.indexOf('>');
    if (endAngle !== -1) {
      return target.slice(1, endAngle).trim();
    }
  }
  // 末尾のタイトル文字列 ("..." または '...') を取り除く
  target = target.replace(/\s+(?:"[^"]*"|'[^']*')\s*$/, '').trim();
  return target;
}

function safeDecode(str) {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
}

function verifyMarkdownFiles(allFiles) {
  const mdFiles = allFiles.filter((f) => {
    const rel = relFromRoot(f);
    return rel.endsWith('.md') && !/(^|\/)output(\/|$)/i.test(rel);
  });

  const anchorCache = new Map();
  const getAnchors = (absPath) => {
    const key = path.resolve(absPath);
    if (!anchorCache.has(key)) {
      anchorCache.set(key, extractMarkdownAnchors(fs.readFileSync(key, 'utf8')));
    }
    return anchorCache.get(key);
  };

  for (const f of mdFiles) {
    getAnchors(f);
  }

  const errors = [];
  let checkedLinks = 0;

  for (const f of mdFiles) {
    const rel = relFromRoot(f);
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split(/\r?\n/);
    const startLine = stripFrontmatter(lines);
    let fence = null;
    let inHtmlComment = false;

    for (let idx = startLine; idx < lines.length; idx++) {
      let line = lines[idx];
      fence = updateFenceState(line, fence);
      if (fence) continue;

      if (inHtmlComment) {
        const endComment = line.indexOf('-->');
        if (endComment === -1) continue;
        line = line.slice(endComment + 3);
        inHtmlComment = false;
      }
      line = line.replace(/<!--[\s\S]*?-->/g, '');
      const openComment = line.indexOf('<!--');
      if (openComment !== -1) {
        line = line.slice(0, openComment);
        inHtmlComment = true;
      }

      const masked = maskInlineCode(line);
      const links = extractInlineLinks(masked);

      // 参照スタイルリンク定義 ([ref]: target) も拾う
      const refMatch = masked.match(/^\s*\[([^\]]+)\]:\s*(\S+)/);
      if (refMatch) {
        links.push({ isImage: false, rawTarget: refMatch[2] });
      }

      for (const link of links) {
        const target = normalizeLinkTarget(link.rawTarget);
        if (!target || /^(https?:|mailto:|tel:|data:|javascript:)/i.test(target)) {
          continue;
        }

        checkedLinks++;
        const hashIdx = target.indexOf('#');
        const filePart = hashIdx >= 0 ? target.slice(0, hashIdx) : target;
        const anchorPart = hashIdx >= 0 ? target.slice(hashIdx + 1) : null;

        let resolvedPath = path.resolve(f);
        if (filePart) {
          const direct = path.resolve(path.dirname(f), filePart);
          const decoded = path.resolve(path.dirname(f), safeDecode(filePart));
          resolvedPath = fs.existsSync(direct) ? direct : decoded;

          if (!fs.existsSync(resolvedPath)) {
            errors.push(`${rel}:${idx + 1} リンク先が見つかりません: ${target}`);
            continue;
          }
        }

        if (link.isImage) {
          if (!filePart) {
            errors.push(`${rel}:${idx + 1} 画像パスが空です: ${target}`);
            continue;
          }
          const stat = fs.statSync(resolvedPath);
          if (!stat.isFile() || stat.size === 0) {
            errors.push(`${rel}:${idx + 1} 画像ファイルが不正または空です: ${target}`);
            continue;
          }
        }

        if (anchorPart !== null && anchorPart !== '') {
          if (resolvedPath.toLowerCase().endsWith('.md')) {
            const anchors = getAnchors(resolvedPath);
            const decodedAnchor = safeDecode(anchorPart);
            if (!anchors.has(anchorPart) && !anchors.has(decodedAnchor)) {
              errors.push(`${rel}:${idx + 1} 見出しアンカーが見つかりません: ${target}`);
            }
          }
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    summary: `Markdown ${mdFiles.length} 件 / ローカルリンク・アンカー ${checkedLinks} 件検証`,
    errors
  };
}

// =====================================================================
// 4. JSON / JSONC 構文チェック
// =====================================================================
function stripJsonc(text) {
  const src = text.replace(/^\uFEFF/, '');
  let noComments = '';
  let i = 0;
  let inString = false;

  // コメント（// と /* ... */）を文字列外から除去
  while (i < src.length) {
    const ch = src[i];
    if (inString) {
      noComments += ch;
      if (ch === '\\' && i + 1 < src.length) {
        noComments += src[i + 1];
        i += 2;
        continue;
      }
      if (ch === '"') inString = false;
      i++;
      continue;
    }

    if (ch === '"') {
      inString = true;
      noComments += ch;
      i++;
      continue;
    }

    if (ch === '/' && src[i + 1] === '/') {
      i += 2;
      while (i < src.length && src[i] !== '\n' && src[i] !== '\r') i++;
      continue;
    }

    if (ch === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end === -1) {
        throw new SyntaxError('閉じられていないブロックコメント /* ... */ があります');
      }
      // 行番号をずらさないよう改行のみ残す
      noComments += src.slice(i, end + 2).replace(/[^\r\n]/g, ' ');
      i = end + 2;
      continue;
    }

    noComments += ch;
    i++;
  }

  // 末尾カンマ（,} や ,]）を文字列外から除去
  let cleaned = '';
  i = 0;
  inString = false;
  while (i < noComments.length) {
    const ch = noComments[i];
    if (inString) {
      cleaned += ch;
      if (ch === '\\' && i + 1 < noComments.length) {
        cleaned += noComments[i + 1];
        i += 2;
        continue;
      }
      if (ch === '"') inString = false;
      i++;
      continue;
    }

    if (ch === '"') {
      inString = true;
      cleaned += ch;
      i++;
      continue;
    }

    if (ch === ',') {
      let k = i + 1;
      while (k < noComments.length && /\s/.test(noComments[k])) k++;
      if (noComments[k] === '}' || noComments[k] === ']') {
        i++;
        continue;
      }
    }

    cleaned += ch;
    i++;
  }

  return cleaned;
}

function isJsoncFile(relPosix) {
  return (
    /\.jsonc$/i.test(relPosix) ||
    /(?:^|\/)\.vscode\/(?:settings|tasks|launch|extensions|keybindings)\.json$/i.test(relPosix)
  );
}

function verifyJsonFiles(allFiles) {
  const jsonFiles = allFiles.filter((f) => /\.(?:json|jsonc)$/i.test(f));
  const errors = [];
  let strictCount = 0;
  let jsoncCount = 0;

  for (const f of jsonFiles) {
    const rel = relFromRoot(f);
    const raw = fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '');
    try {
      if (isJsoncFile(rel)) {
        jsoncCount++;
        JSON.parse(stripJsonc(raw));
      } else {
        strictCount++;
        JSON.parse(raw);
      }
    } catch (err) {
      errors.push(`${rel}: ${err.message}`);
    }
  }

  return {
    ok: errors.length === 0,
    summary: `JSON ${strictCount} 件 + JSONC ${jsoncCount} 件構文チェック完了`,
    errors
  };
}

// =====================================================================
// 5. SVG XML 整形式・viewBox チェック
// =====================================================================
function validateSvgXml(content) {
  const s = content.replace(/^\uFEFF/, '');
  const n = s.length;
  let i = 0;
  const stack = [];
  let rootCount = 0;
  let rootHasViewBox = false;
  const entityRe = /^&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/;

  function assertEntities(text, where) {
    for (let k = 0; k < text.length; k++) {
      if (text[k] === '&' && !entityRe.test(text.slice(k))) {
        throw new Error(`未エスケープの '&' (${where}): ${text.slice(k, k + 24)}`);
      }
    }
  }

  while (i < n) {
    const lt = s.indexOf('<', i);
    if (lt === -1) {
      const rest = s.slice(i);
      if (rest.trim()) {
        if (stack.length === 0) throw new Error('ルート要素の外にテキストが存在します');
        assertEntities(rest, 'テキスト');
      }
      break;
    }

    const textBetween = s.slice(i, lt);
    if (textBetween.trim()) {
      if (stack.length === 0) throw new Error('ルート要素の外にテキストが存在します');
      assertEntities(textBetween, 'テキスト');
    }

    if (s.startsWith('<!--', lt)) {
      const end = s.indexOf('-->', lt + 4);
      if (end === -1) throw new Error('閉じられていない XML コメント <!-- があります');
      i = end + 3;
      continue;
    }
    if (s.startsWith('<![CDATA[', lt)) {
      const end = s.indexOf(']]>', lt + 9);
      if (end === -1) throw new Error('閉じられていない CDATA セクションがあります');
      i = end + 3;
      continue;
    }
    if (s.startsWith('<?', lt)) {
      const end = s.indexOf('?>', lt + 2);
      if (end === -1) throw new Error('閉じられていない処理命令 <?...?> があります');
      i = end + 2;
      continue;
    }
    if (s.startsWith('<!', lt)) {
      const end = s.indexOf('>', lt + 2);
      if (end === -1) throw new Error('閉じられていない宣言 <!...> があります');
      i = end + 1;
      continue;
    }

    let j = lt + 1;
    let quote = null;
    while (j < n) {
      const ch = s[j];
      if (quote) {
        if (ch === quote) quote = null;
      } else {
        if (ch === '"' || ch === "'") quote = ch;
        else if (ch === '>') break;
      }
      j++;
    }
    if (j >= n || quote) {
      throw new Error('閉じられていないタグまたは引用符があります');
    }

    const rawTag = s.slice(lt + 1, j);
    i = j + 1;

    if (rawTag.startsWith('/')) {
      const tagName = rawTag.slice(1).trim();
      const top = stack.pop();
      if (!top || top !== tagName) {
        throw new Error(`閉じタグ </${tagName}> が一致しません（期待: ${top ? `</${top}>` : 'なし'}）`);
      }
      continue;
    }

    const selfClosing = rawTag.endsWith('/');
    const body = selfClosing ? rawTag.slice(0, -1) : rawTag;
    const tagMatch = body.match(/^([a-zA-Z_][\w:.-]*)([\s\S]*)$/);
    if (!tagMatch) {
      throw new Error(`不正なタグ構文です: <${rawTag.slice(0, 30)}>`);
    }

    const tagName = tagMatch[1];
    const attrPart = tagMatch[2];
    const seenAttrs = new Set();
    const attrRe = /\s+([a-zA-Z_][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
    let am;
    let lastIdx = 0;

    while ((am = attrRe.exec(attrPart)) !== null) {
      const gap = attrPart.slice(lastIdx, am.index);
      if (gap.trim()) {
        throw new Error(`不正な属性構文 in <${tagName}>: ${gap.trim()}`);
      }
      const attrName = am[1];
      const attrVal = am[2] !== undefined ? am[2] : am[3];
      if (seenAttrs.has(attrName)) {
        throw new Error(`重複属性 '${attrName}' in <${tagName}>`);
      }
      seenAttrs.add(attrName);
      assertEntities(attrVal, `<${tagName} ${attrName}=...>`);

      if (stack.length === 0 && tagName === 'svg' && attrName === 'viewBox') {
        const nums = attrVal.trim().split(/[\s,]+/).map(Number);
        if (nums.length !== 4 || nums.some(Number.isNaN) || nums[2] <= 0 || nums[3] <= 0) {
          throw new Error(`不正な viewBox 値です: "${attrVal}"`);
        }
        rootHasViewBox = true;
      }
      lastIdx = attrRe.lastIndex;
    }

    if (attrPart.slice(lastIdx).trim()) {
      throw new Error(`未解析の属性残余 in <${tagName}>: ${attrPart.slice(lastIdx).trim()}`);
    }

    if (stack.length === 0) {
      if (tagName !== 'svg') {
        throw new Error(`ルート要素が <svg> ではありません: <${tagName}>`);
      }
      rootCount++;
    }

    if (!selfClosing) {
      stack.push(tagName);
      if (tagName === 'style' || tagName === 'script') {
        const closeTag = `</${tagName}>`;
        const closePos = s.indexOf(closeTag, i);
        if (closePos === -1) {
          throw new Error(`閉じられていない <${tagName}> タグがあります`);
        }
        i = closePos + closeTag.length;
        stack.pop();
      }
    }
  }

  if (stack.length > 0) {
    throw new Error(`閉じられていないタグが残っています: ${stack.join(', ')}`);
  }
  if (rootCount !== 1) {
    throw new Error(`ルート <svg> 要素数が不正です: ${rootCount}`);
  }
  if (!rootHasViewBox) {
    throw new Error('ルート <svg> に viewBox 属性がありません');
  }
}

function verifySvgFiles(allFiles) {
  const svgFiles = allFiles.filter((f) => /\.svg$/i.test(f));
  const errors = [];

  for (const f of svgFiles) {
    const rel = relFromRoot(f);
    const content = fs.readFileSync(f, 'utf8');
    try {
      validateSvgXml(content);
    } catch (err) {
      errors.push(`${rel}: ${err.message}`);
    }
  }

  return {
    ok: errors.length === 0,
    summary: `SVG ${svgFiles.length} 件の XML 整形式・viewBox 検証完了`,
    errors
  };
}

// =====================================================================
// 6. agent-skill サンプルの動作確認（保護フック・出荷前チェック・利用ログ・棚卸し）
// =====================================================================
function verifyAgentSkillSamples() {
  const scriptPath = path.join(repoRoot, 'agent-skill/scripts/test-samples.js');
  const res = spawnSync(process.execPath, [scriptPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 60000
  });
  const resultLine = (res.stdout || '').split(/\r?\n/).find((line) => line.includes('結果:'));
  if (res.status !== 0) {
    return {
      ok: false,
      summary: `agent-skill サンプルテスト失敗（exit=${res.status}）`,
      errors: [
        res.error ? res.error.message : '',
        (res.stdout || '').split(/\r?\n/).filter((l) => l.includes('[NG]')).join('\n'),
        res.stderr ? res.stderr.trim() : ''
      ].filter(Boolean)
    };
  }
  return { ok: true, summary: resultLine ? resultLine.trim() : 'agent-skill サンプルテスト合格', errors: [] };
}

// =====================================================================
// メイン実行
// =====================================================================
function main() {
  const allFiles = collectFiles(repoRoot);

  const checks = [
    { label: '1. Hook ローカルテスト (test-hooks-locally.js)', run: () => verifyHooks() },
    { label: '2. MCP サーバー通信テスト (本体 + samples/01,02,03,05)', run: () => verifyMcpServers() },
    { label: '3. Markdown リンク・画像・アンカー整合チェック', run: () => verifyMarkdownFiles(allFiles) },
    { label: '4. JSON / JSONC 構文チェック', run: () => verifyJsonFiles(allFiles) },
    { label: '5. SVG XML 整形式・viewBox チェック', run: () => verifySvgFiles(allFiles) },
    { label: '6. agent-skill サンプルテスト (test-samples.js)', run: () => verifyAgentSkillSamples() }
  ];

  console.log('======================================================================');
  console.log(' agent-study リポジトリ一括検証 (scripts/verify-repo.js)');
  console.log('======================================================================\n');

  let failedCount = 0;
  for (const c of checks) {
    const res = c.run();
    const mark = res.ok ? '[PASS]' : '[FAIL]';
    console.log(`${mark} ${c.label}`);
    console.log(`       → ${res.summary}`);
    if (!res.ok) {
      failedCount++;
      for (const err of res.errors) {
        console.log(`       ! ${err}`);
      }
    }
    console.log('');
  }

  console.log('----------------------------------------------------------------------');
  const statusText = failedCount === 0 ? '全チェック合格' : `${failedCount} カテゴリでエラー検出`;
  console.log(` 総合結果: ${checks.length - failedCount} / ${checks.length} カテゴリ合格（${statusText}）`);
  console.log('----------------------------------------------------------------------');

  if (failedCount > 0) {
    process.exit(1);
  }
}

module.exports = {
  verifyHooks,
  verifyMcpServers,
  verifyMarkdownFiles,
  verifyJsonFiles,
  verifySvgFiles,
  stripJsonc,
  validateSvgXml,
  slugifyHeading
};

if (require.main === module) {
  main();
}
