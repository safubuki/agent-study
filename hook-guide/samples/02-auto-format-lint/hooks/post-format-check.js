#!/usr/bin/env node
/**
 * パターン②：自動整形・事後チェック（PostToolUse）
 * - AI が保存したファイルの末尾空白を自動で掃除し、最終行に改行を揃える
 * - HTML ファイルに禁止されたインライン style 属性や img の alt 抜けがあれば即座に指摘を返す
 */
const fs = require('fs');

function main() {
  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8');
  } catch {
    process.exit(0);
  }
  if (!raw.trim()) process.exit(0);

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolInput = data.tool_input || data.toolArgs || data.input || {};
  const filePath = String(toolInput.file_path || toolInput.filePath || toolInput.path || '');
  if (!filePath || !fs.existsSync(filePath)) process.exit(0);

  // 対象拡張子のみ処理
  if (!/\.(html|css|js|ts|json|md)$/i.test(filePath)) process.exit(0);

  const original = fs.readFileSync(filePath, 'utf8');

  // 1. 自動整形：行末の余分な空白を除去し、改行コードを LF に揃え、末尾改行を保証する
  const formatted = original
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n*$/, '\n');

  if (formatted !== original) {
    fs.writeFileSync(filePath, formatted, 'utf8');
  }

  // 2. HTML ファイルなら軽い規約チェックを実行
  if (/\.html$/i.test(filePath)) {
    const issues = [];
    if (/\sstyle\s*=\s*["'][^"']*["']/i.test(formatted)) {
      issues.push('インラインの style="..." 属性が見つかりました。<style> タグ内のクラスに分離してください。');
    }
    const imgTags = formatted.match(/<img\b[^>]*>/gi) || [];
    for (const tag of imgTags) {
      if (!/\balt\s*=\s*["'][^"']*["']/i.test(tag)) {
        issues.push(`alt 属性のない <img> タグがあります: ${tag}`);
      }
    }

    if (issues.length > 0) {
      const output = {
        decision: 'block',
        reason: `[PostToolUse 自動検査] ${filePath} に規約違反があります。今すぐ修正してください:\n- ${issues.join('\n- ')}`
      };
      process.stdout.write(JSON.stringify(output) + '\n');
      process.exit(0);
    }
  }

  // 問題なければ何も出力せず終了（AI のコンテキスト窓を消費しない）
  process.exit(0);
}

main();
