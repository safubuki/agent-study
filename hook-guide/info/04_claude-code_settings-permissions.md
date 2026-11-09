# Claude Code Docs「Settings & Permissions」

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic（code.claude.com 公式ドキュメント） |
| 取得日 | 2026-11-10 |
| 鮮度 | **新**（取得当日の内容） |
| URL | https://code.claude.com/docs/en/settings |

## 要点

- **設定ファイルの階層と優先順位**：
  1. **Managed settings**（組織・管理者が配布するポリシー）：最優先。個人が上書きできない。
  2. **コマンドライン引数**（`--allowedTools`, `--disallowedTools` など）
  3. **`.claude/settings.local.json`**（プロジェクト内の個人用設定。Git 管理外）
  4. **`.claude/settings.json`**（プロジェクト共有設定。Git でチーム共有）
  5. **`~/.claude/settings.json`**（個人の全プロジェクト共通設定）
- **`permissions`（静的なルール）と `hooks`（動的なプログラム判定）の使い分け**：
  - `permissions.deny` / `permissions.allow`：`Bash(rm -rf *)` や `Read(.env)` のように、ツール名とパターンだけで決まるシンプルな許可・拒否。まずはこれを使う。
  - `hooks`：「ファイルの中身に特定のタグが入っているか調べる」「時間帯やブランチ名で変える」「引数を安全な形に書き換える（`updatedInput`）」のように、**プログラムで中身を計算・検査したいとき**に使う。
- **サブエージェント定義ファイル内の `hooks`**：
  - `.claude/agents/*.md` の frontmatter（上部の設定欄）にも `hooks` を書ける。そのサブエージェントが動いている間だけ有効な関所や事後チェックを作れる。

## 原文引用（短く）

> "Deny rules are evaluated first and cannot be overridden by allow rules or hooks."

## 注意点

- プロジェクト共有の `.claude/settings.json` にフックを書く場合、チーム全員の PC で動くコマンド（例：OS 標準機能やリポジトリ内の `node` スクリプト）にしないと、他の人の環境でエラーになる。個人専用の通知音などは `.claude/settings.local.json` または `~/.claude/settings.json` に置く。
