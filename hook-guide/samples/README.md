# フック設定＆スクリプトのサンプル集

ガイド（[00_hook-guide.md](../docs/00_hook-guide.md)、[01_copilot-hook-guide.md](../docs/01_copilot-hook-guide.md)、[02_hook-patterns.md](../docs/02_hook-patterns.md)）に出てきた定番フック5パターンを、**そのままコピーして使える設定ファイル＋Node.js スクリプト**としてまとめた置き場です。

> ワークスペース直下の [.claude/settings.json](../.claude/settings.json) と [hooks/](../hooks/) は「このワークスペースの実験ですぐ動くフック一式」です。こちらの `samples/` は「パターンごとに最小構成で見比べるための見本」です。

## パターン一覧

| # | パターン | イベント | ガイドの該当箇所 | Claude Code | Copilot |
|---|---|---|---|---|---|
| 01 | [危険な操作・保護ファイルのブロック](01-block-dangerous-cmd/) | `PreToolUse` | 02 の 2章 | ○ | ○ |
| 02 | [ファイル保存後の自動整形・構文検査](02-auto-format-lint/) | `PostToolUse` | 02 の 3章 | ○ | ○ |
| 03 | [検査が通るまで完了させない（完了ゲート）](03-stop-until-pass/) | `Stop` / `agentStop` | 02 の 4章 | ○ | ○ |
| 04 | [ブランチ名・規約の自動注入](04-context-injection/) | `UserPromptSubmit` | 02 の 5章 | ○ | ○ |
| 05 | [監査ログの記録と完了チャイム通知](05-audit-and-notify/) | `PostToolUse` / `Notification` | 02 の 6章 | ○ | ○ |

```mermaid
flowchart LR
    subgraph p04["04 文脈注入"]
        u["UserPromptSubmit"] --> i["ブランチ名・時刻を添付"]
    end
    subgraph p01["01 関所ガード"]
        pre["PreToolUse"] --> b[".env・危険コマンド阻止"]
    end
    subgraph p02["02 事後チェック"]
        post["PostToolUse"] --> f["自動整形・構文検査"]
    end
    subgraph p05["05 記録・通知"]
        n["PostToolUse / Notification"] --> l["audit.jsonl ＆ 通知音"]
    end
    subgraph p03["03 完了ゲート"]
        s["Stop"] --> v["合格するまで差し戻し"]
    end
    p04 --> p01 --> p02 --> p05 --> p03
```

## フォルダの見方

各パターンは同じ形になっています。スクリプト本体（`hooks/*.js`）は Node.js の標準機能だけで書かれており、Windows でも Mac でも追加パッケージなしでそのまま動きます。

```text
samples/<パターン>/
├─ README.md                       ← 仕組み・動きの流れ・単体テストコマンド
├─ hooks/
│  └─ *.js                         ← 共通で使う Node.js フックスクリプト
├─ claude-code/
│  └─ .claude/settings.json        ← Claude Code 用の設定見本
└─ copilot/
   └─ .github/hooks/hooks.json     ← GitHub Copilot / VS Code 用の設定見本
```

`claude-code/` と `copilot/` の設定ファイルを並べて見ると、書き方の違いがすぐ分かります。

| 違い | Claude Code（`.claude/settings.json`） | Copilot（`.github/hooks/hooks.json`） |
|---|---|---|
| イベント名の表記 | 先頭大文字（`PreToolUse`, `PostToolUse`, `Stop`） | 先頭小文字（`preToolUse`, `postToolUse`, `agentStop`） |
| ツール絞り込み | `"matcher": "Edit\|Write"` で対象ツールを指定 | 全ツールで呼ばれ、スクリプト側で `tool_name` を見て分岐 |
| コマンド指定 | `"command": "node hooks/xxx.js"` | `"bash": "..."` と `"powershell": "..."` を併記可能 |

## 使い方

### 1. Claude なしでスクリプト単体の動きを試す（1秒）

どのスクリプトも標準入力（`stdin`）から JSON を受け取るだけなので、ターミナルで模擬 JSON を流し込めばその場で動きを確かめられます（各サンプルの `README.md` にコピペ用コマンドが書いてあります）。

### 2. 自分のプロジェクトに組み込む

1. 使いたいパターンの `hooks/*.js` を、自分のプロジェクトの `hooks/`（または `.github/hooks/scripts/`）にコピーします。
2. Claude Code なら `claude-code/.claude/settings.json` の中身をプロジェクトの `.claude/settings.json` にマージします。
3. GitHub Copilot なら `copilot/.github/hooks/hooks.json` をプロジェクトの `.github/hooks/hooks.json` にコピーします。
