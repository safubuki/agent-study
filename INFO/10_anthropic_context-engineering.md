# Anthropic「Effective context engineering for AI agents」

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic Engineering（公式ブログ） |
| 著者 | Prithvi Rajasekaran, Ethan Dixon, Carly Ryan, Jeremy Hadfield（Applied AI チーム） |
| 公開日 | 2025-09-29 |
| 鮮度 | **古**（約13か月前）。当時の主なモデルは Claude Sonnet 4.5 |
| URL | https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents |

## 要点

- **コンテキストは有限の資源**。トークンが増えるほど、モデルが中身を正確に思い出す力が落ちる（context rot）。各トークンが「注意の予算」を消費する。
- 長い仕事のための3つの手法と使い分け：
  | 手法 | 中身 | 向く仕事 |
  |---|---|---|
  | 圧縮（compaction） | 文脈が一杯に近づいたら要約して新しい窓で続ける | やり取りの多い、会話の流れが大事な仕事 |
  | 構造化メモ | 文脈の外（ファイル等）にメモを書き、後で読み直す | 区切りのはっきりした反復開発 |
  | サブエージェント | 親が計画を持ち、子は**まっさらな文脈**で探索して要約だけ返す | 並列探索に価値がある複雑な調査・分析 |
- 子は数万トークン以上使って探索しても、返すのは **1,000〜2,000 トークン程度の凝縮された要約**。

## 原文引用（短く）

> "Each subagent might explore extensively, using tens of thousands of tokens or more"

> "returns only a condensed, distilled summary of its work (often 1,000-2,000 tokens)"

## 注意点

- 「文脈を守るためにサブエージェントを使う」という動機は、2026年11月時点の Claude Code 公式ベストプラクティスでは「**もう主な理由ではない**」とされている（多くのモデルが 1M トークンの窓を持ち、自動圧縮もあるため）。[21](21_claude-code_docs.md) 参照。並列化・雑多な出力の隔離・独立レビューという価値は残る。
