# Anthropic「Claude Code: Best practices for agentic coding」

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic Engineering（公式ブログ） |
| 公開日 | 2025-04-18 |
| 鮮度 | ** **約19か月前） |
| URL | https://www.anthropic.com/engineering/claude-code-best-practices |

## 要点

- Claude Code を使いこなすための初期の公式ベストプラクティス記事。
- **検証手段（テスト・リンター）をループに入れる重要性**：
  - AI は「自分の出力を確認する手段（テスト実行、型チェック、画面キャプチャなど）」を与えられると、一発で書くよりはるかに高い品質を出せる。
- **権限管理と安全性のバランス**：
  - 毎回人間が許可ボタンを押すと作業が止まるが、無制限に許可（`--dangerously-skip-permissions`）すると環境破壊のリスクがある。
  - 安全なコマンドだけを許可リストに入れ、危険な操作を機械的に弾く仕組み（後の Hooks や Permission rules につながる考え方）が推奨されている。

## 原文引用（短く）

> "Claude performs significantly better when it has a clear target to iterate against—a visual mock, a test case, or another kind of output."

## 注意点

- 2025年4月時点の記事のため、`CLAUDE.md` で `IMPORTANT` や `YOU MUST` と強調するテクニックがまだ肯定的に紹介されている。この「強調テクニック」は 2026年の公式ドキュメント（[03](03_claude-code_best-practices.md)）では「やめてよいアドバイス（フックに移すべき）」へと更新された。時代の変化が最もよく分かる対比資料。
