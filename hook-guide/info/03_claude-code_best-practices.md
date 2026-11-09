# Claude Code Docs「Best practices」

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic（code.claude.com 公式ドキュメント） |
| 取得日 | 2026-11-10 |
| 鮮度 | **新**（取得当日の内容） |
| URL | https://code.claude.com/docs/en/best-practices |

## 要点

- **プロンプトの強調（大文字・IMPORTANT）からフックへの移行**：
  - 昔のモデルでは `CLAUDE.md` に `IMPORTANT:` や `NEVER` と大文字で書いて従わせる工夫がよく使われた。
  - 今のモデルは普通の文面で指示に従う一方、強い強調を入れると「状況に合わなくても無理やり適用する（過剰適用）」という副作用が出る。
  - そのため公式ベストプラクティスは、**「絶対に変えてはいけない規則（invariants）は、プロンプトで強調するのではなく、フック（Hooks）や拒否設定（permissions.deny）に移せ」**と明記している。
- **「手を抜くな」と書くより、合格すべきチェック（検証手段）を与える**：
  - 「最後まで丁寧にやれ」とプロンプトに書くと不要な作業まで増える。代わりに、テスト・リンター・完了チェック（`Stop` フックなど）のように**合否が機械的に分かる仕組み**を与える方が品質が安定する。
- **CLAUDE.md を肥大化させない**：
  - ファイル編集のたびに走る整形やスタイルチェックを `CLAUDE.md` に長々と書くより、`PostToolUse` フックでツールとして自動実行させる方が、コンテキスト窓も汚れず確実。

## 原文引用（短く）

> "Instead of shouting in prompts with CAPS or IMPORTANT, move non-negotiable rules into hooks or permission deny rules."

> "Give Claude a way to verify its work — tests, linters, or check scripts — rather than telling it to 'be thorough'."

## 注意点

- すべての指示をフックにするべきという意味ではない。「判断や文脈が要る方針」は `CLAUDE.md` に書き、「例外なく100%守らせる境界や機械的処理」だけをフックにするという役割分担が重要。
