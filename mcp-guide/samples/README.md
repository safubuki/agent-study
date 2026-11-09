# MCP 設定・サーバー実装のサンプル集

ガイド（[00_mcp-guide.md](../docs/00_mcp-guide.md)、[01_copilot-mcp-guide.md](../docs/01_copilot-mcp-guide.md)、[02_mcp-patterns.md](../docs/02_mcp-patterns.md)）に出てきた MCP の構成とサーバー実装を、**そのまま読める・コピーして動かせる見本**としてまとめた置き場です。

> ワークスペース直下の [.mcp.json](../.mcp.json)、[.vscode/mcp.json](../.vscode/mcp.json)、[servers/cafe-catalog-mcp.js](../servers/cafe-catalog-mcp.js) は「このワークスペースですぐ実験に使える MCP サーバー」です。こちらの `samples/` は「目的別の最小コードと設定ファイルを見比べるための見本」です。すべてのサンプルサーバーは**外部パッケージ不要（Node.js 標準機能のみ** 動くように書いてあります。

## パターン一覧

| # | サンプル | 学べること | ガイドの該当箇所 | Claude Code | Copilot |
|---|---|---|---|---|---|
| 01 | [最小の stdio サーバー](01-minimal-stdio/) | 約60行で動く一番シンプルな MCP サーバー（Tools のみ） | 00 の 5章 | ○ | ○ |
| 02 | [社内用語集の検索ゲートウェイ](02-knowledge-search/) | 読み取り専用で JSON データを検索し、該当分だけ返す | 02 の 2章（パターン①） | ○ | ○ |
| 03 | [業務ワークフロー・ファサード](03-workflow-facade/) | 複数のチェック・集計を1つの高水準ツールに束ねる | 02 の 4章（パターン③） | ○ | ○ |
| 04 | [サブエージェント×専用 MCP](04-subagent-scoped/) | 特定のサブエージェントにだけ MCP サーバーを許可する | 01 の 5章、02 の 5章（パターン④） | ○ | ○ |
| 05 | [Resources と Prompts も返すサーバー](05-resources-and-prompts/) | Tools だけでなく参考資料（Resources）と定型文（Prompts）も実装する | 00 の 2.1節 | ○ | ○ |

```mermaid
flowchart LR
    subgraph s01["01 最小構成"]
        a1["AI"] -->|"tools/call"| a2["サイコロ MCP"]
    end
    subgraph s02["02 知識ゲートウェイ"]
        b1["AI"] -->|"キーワード検索"| b2["用語集 MCP"] --> b3[("glossary.json")]
    end
    subgraph s03["03 業務ファサード"]
        c1["AI"] -->|"1回呼ぶだけ"| c2["見積・判定 MCP<br/>（内部で4段階処理）"]
    end
    subgraph s04["04 サブ×専用MCP"]
        d0["親"] --> d1["専門サブ"] --> d2["専用 MCP"]
    end
    subgraph s05["05 3機能フル実装"]
        e1["AI / ユーザー"] -->|"Tools / Resources / Prompts"| e2["フル機能 MCP"]
    end
```

## フォルダの見方

各サンプルには、サーバー本体（`.js`）に加えて Claude Code 用と GitHub Copilot（VS Code）用の設定ファイルを並べて入れてあります。

```text
samples/<サンプル名>/
├─ README.md                 ← 仕組み・試し方・設定のポイント
├─ *.js                      ← Node.js 標準機能だけで動く MCP サーバー
├─ claude-code/
│  └─ .mcp.json              ← Claude Code 用の設定（ルートキー：mcpServers）
└─ copilot/
   └─ .vscode/mcp.json       ← VS Code / Copilot 用の設定（ルートキー：servers）
```

## Claude Code と VS Code（Copilot）の設定ファイルの違い（3点）

| 項目 | Claude Code（`claude-code/.mcp.json`） | VS Code / Copilot（`copilot/.vscode/mcp.json`） |
|---|---|---|
| **置き場所** | プロジェクト直下の `.mcp.json` | プロジェクト内の `.vscode/mcp.json` |
| **一番外側のキー** | `"mcpServers": { ... }` | `"servers": { ... }` |
| **サブエージェントでの指定** | `.claude/agents/*.md` に `mcpServers: [名前]` | `.github/agents/*.agent.md` に `tools: ['名前/*']` |

## 動作テストのしかた（Claude なしで1秒で確認）

ルートのテストスクリプト [scripts/test-mcp-server.js](../scripts/test-mcp-server.js) にサーバーのパスを渡すと、どのサンプルサーバーでもその場で JSON-RPC 通信（`initialize` → `tools/list`）の動作を確認できます。

```powershell
cd C:\git_home\agent-study\mcp-guide
node scripts\test-mcp-server.js samples\01-minimal-stdio\server.js
node scripts\test-mcp-server.js samples\02-knowledge-search\glossary-mcp.js
node scripts\test-mcp-server.js samples\03-workflow-facade\release-check-mcp.js
node scripts\test-mcp-server.js samples\05-resources-and-prompts\full-feature-mcp.js
```
