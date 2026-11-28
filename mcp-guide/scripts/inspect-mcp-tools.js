#!/usr/bin/env node
/**
 * scripts/inspect-mcp-tools.js
 * MCP サーバーが AI に渡す「ツールの説明文」を一覧にし、怪しい書き方がないかを機械的に点検します。
 * （外部 URL・秘密のファイル・「ユーザーに言うな」などの隠し命令・見えない文字 など）
 *
 * 使い方:
 *   node scripts/inspect-mcp-tools.js samples/01-minimal-stdio/server.js
 *       … stdio の MCP サーバー（.js）を起動して tools/list を取り、点検する
 *   node scripts/inspect-mcp-tools.js --json scripts/fixtures/suspicious-tools.json
 *       … 保存しておいた tools/list の結果（JSON）を点検する。サーバーは起動しない
 *
 * 注意: .js を指定すると、そのプログラムを実際に起動します。出所の分からないサーバーは、
 *       先にソースを読み、使い捨ての VM やコンテナなど隔離した環境で実行してください。
 *       この点検は「よくある手口の書き方」を探すだけで、安全を保証するものではありません。
 *
 * 終了コード: 要注意なし 0 ／ 要注意あり 1 ／ 実行エラー 2（CI のチェックにも使えます）
 */
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

// 点検ルール。level: "high" は要注意（終了コード 1）、"check" は念のため目で確認する項目
const RULES = [
  { level: 'high', label: '「ユーザーに知らせるな」という隠し命令',
    re: /(do not|don't|never)\s+(tell|mention|inform|reveal|show)\b.{0,40}\b(user|human)|ユーザー(に|には|へ)[^。\n]{0,15}(言わ|言う|伝え|知らせ|見せ|教え)(る)?な|気づかれ(ない|るな)/i },
  { level: 'high', label: 'ほかの指示を上書きしようとする書き方',
    re: /ignore\s+(all\s+|any\s+)?(previous|prior|above)\s+(instructions|rules)|以前の指示|それまでの指示|system prompt|システムプロンプト|<\s*important\s*>|\[\s*important\s*\]/i },
  { level: 'high', label: '秘密情報のありか（鍵・認証情報・設定ファイル）に触れている',
    re: /\.ssh\b|id_rsa|id_ed25519|\.aws\b|\.env\b|credentials|\.npmrc|\.git-credentials|mcp\.json|\.claude\.json|パスワード|秘密鍵/i },
  { level: 'high', label: 'ほかのツールの使い方に口を出している（別サーバーの乗っ取りの手口）',
    re: /(before|after)\s+(using|calling)\s+(any|every|other|another)\s+tools?|(他|ほか|別)のツール/i },
  { level: 'high', label: '見えない文字（ゼロ幅・向き制御・タグ文字）が混ざっている',
    re: /[​-‏‪-‮⁠-⁤﻿]|[\u{E0000}-\u{E007F}]/u },
  { level: 'check', label: '外部の URL が書かれている（どこへ送る・取りに行く指示かを確認）',
    re: /https?:\/\/[^\s"'<>）)]+/i },
  { level: 'check', label: 'どこかへ送らせる書き方（送り先と中身を確認）',
    re: /\b(send|upload|post|forward|exfiltrat\w*)\b.{0,40}\b(to|into)\b|送信|送って|送れ|アップロード|転送/i },
  { level: 'check', label: '説明文がとても長い（1,000 文字超。中に指示が紛れていないか読む）',
    test: (text) => text.length > 1000 },
];

// 見えない文字を ​ のような見える形にする（画面表示用）
function showInvisible(text) {
  return text.replace(/[​-‏‪-‮⁠-⁤﻿]|[\u{E0000}-\u{E007F}]/gu,
    (c) => '\\u' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0'));
}

// ツール 1 つから、点検対象の文字列（名前・説明・引数の説明）を集める
function collectTexts(tool) {
  const texts = [{ where: '名前', text: String(tool.name ?? '') }];
  if (tool.title) texts.push({ where: 'タイトル', text: String(tool.title) });
  if (tool.description) texts.push({ where: '説明', text: String(tool.description) });
  const props = tool.inputSchema?.properties ?? {};
  for (const [key, schema] of Object.entries(props)) {
    if (schema && schema.description) texts.push({ where: `引数 ${key} の説明`, text: String(schema.description) });
  }
  return texts;
}

function inspect(tools) {
  let high = 0;
  let check = 0;
  console.log(`\n点検するツール: ${tools.length} 個\n`);
  for (const tool of tools) {
    console.log('────────────────────────────────────────');
    console.log(`🔧 ${tool.name}`);
    console.log(`   説明: ${showInvisible(String(tool.description ?? '（なし）')).replace(/\s+/g, ' ')}`);
    const findings = [];
    for (const { where, text } of collectTexts(tool)) {
      for (const rule of RULES) {
        const hit = rule.re ? text.match(rule.re) : rule.test(text) ? [text.slice(0, 40)] : null;
        if (hit) findings.push({ rule, where, sample: showInvisible(hit[0]).slice(0, 60) });
      }
    }
    if (findings.length === 0) {
      console.log('   ✅ 気になる書き方は見つかりませんでした');
      continue;
    }
    for (const f of findings) {
      if (f.rule.level === 'high') high++;
      else check++;
      const mark = f.rule.level === 'high' ? '⚠️ 要注意' : '🔍 要確認';
      console.log(`   ${mark}: ${f.rule.label}（${f.where}：「${f.sample}」）`);
    }
  }
  console.log('────────────────────────────────────────');
  console.log(`結果: 要注意 ${high} 件 ／ 要確認 ${check} 件`);
  if (high > 0) {
    console.log('→ 要注意の書き方があります。使う前にソースと説明文の全文を読み、社内の窓口に相談してください。');
  } else if (check > 0) {
    console.log('→ 要確認の項目を目で確かめてください（正しい用途の URL や送信機能のこともあります）。');
  }
  return high > 0 ? 1 : 0;
}

// stdio の MCP サーバーを起動して tools/list の結果を取る
function fetchToolsFromServer(serverPath) {
  return new Promise((resolve, reject) => {
    console.log(`⚠️  ${path.relative(process.cwd(), serverPath)} を起動します（信頼できないものは隔離環境で）`);
    const child = spawn(process.execPath, [serverPath], { stdio: ['pipe', 'pipe', 'ignore'] });
    const rl = readline.createInterface({ input: child.stdout, terminal: false });
    const pending = new Map();
    let nextId = 1;
    const timer = setTimeout(() => { child.kill(); reject(new Error('10 秒以内に応答がありませんでした')); }, 10000);
    const request = (method, params = {}) => new Promise((res, rej) => {
      const id = nextId++;
      pending.set(id, { res, rej });
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    });
    rl.on('line', (line) => {
      let msg;
      try { msg = JSON.parse(line); } catch { return; }
      const p = pending.get(msg.id);
      if (!p) return;
      pending.delete(msg.id);
      if (msg.error) p.rej(new Error(msg.error.message)); else p.res(msg.result);
    });
    child.on('error', (err) => { clearTimeout(timer); reject(err); });
    child.on('exit', (code) => {
      clearTimeout(timer);
      for (const p of pending.values()) p.rej(new Error(`サーバーが応答の前に終了しました（終了コード ${code}）`));
      pending.clear();
    });
    (async () => {
      await request('initialize', {
        protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'inspect-mcp-tools', version: '1.0.0' },
      });
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
      const tools = [];
      let cursor;
      do {
        const result = await request('tools/list', cursor ? { cursor } : {});
        tools.push(...(result.tools ?? []));
        cursor = result.nextCursor;
      } while (cursor);
      return tools;
    })().then((tools) => { clearTimeout(timer); child.kill(); resolve(tools); },
              (err) => { clearTimeout(timer); child.kill(); reject(err); });
  });
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('使い方: node scripts/inspect-mcp-tools.js <サーバー.js> ／ --json <tools-list.json>');
    return 2;
  }
  let tools;
  if (args[0] === '--json') {
    const data = JSON.parse(fs.readFileSync(args[1], 'utf8'));
    tools = Array.isArray(data) ? data : data.tools ?? data.result?.tools ?? [];
    console.log(`📄 ${args[1]} の tools/list の結果を点検します（サーバーは起動しません）`);
  } else {
    tools = await fetchToolsFromServer(path.resolve(process.cwd(), args[0]));
  }
  return inspect(tools);
}

main().then((code) => { process.exitCode = code; }, (err) => {
  console.error(`エラー: ${err.message}`);
  process.exitCode = 2;
});
