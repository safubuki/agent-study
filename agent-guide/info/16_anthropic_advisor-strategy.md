# Anthropic「The advisor strategy: Give agents an intelligence boost」

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic（claude.com 公式ブログ） |
| 公開日 | 2026-04-09（Claude Platform API のベータ機能「advisor tool」と同時発表） |
| 鮮度 | **中**（約7か月前）。モデルは Opus / Sonnet / Haiku の 4.x 世代 |
| URL | https://claude.com/blog/the-advisor-strategy |

## 要点

- **小さいモデル（Sonnet / Haiku）が実行役として最初から最後まで仕事を進め**、自分では判断しきれない場面でだけ **Opus に相談**する。
- 相談役は**同じ文脈を見たうえで**、計画・修正・中止の合図を返す。相談役は**ツールを呼ばず、ユーザー向けの出力も作らない**。
- 一般的な「大きい親が分解して小さい子に配る」形の**逆**。分解もワーカーの群れも指揮ロジックも要らない。
- 結果（Anthropic 公表値）：
  - SWE-bench Multilingual：Sonnet＋Opus 相談役は Sonnet 単体より **+2.7ポイント**、タスクあたりコスト **−11.9%**。
  - BrowseComp：Haiku＋Opus 相談役は **41.2%**（Haiku 単体 19.7%）。Sonnet 単体より 29% 低いが、コストは 85% 安い。
- 向く仕事：ときどきだけ強い推論が要る複雑な仕事、量が多くコストを抑えたい仕事。導入前に「Sonnet 単体／Sonnet＋相談役／Opus 単体」を自分の評価セットで比べることを推奨。

## 原文引用（短く）

> "The advisor never calls tools or produces user-facing output, and only provides guidance to the executor."

## 注意点

- ベンダー公表値。いつ相談するかは実行役の判断に依存する（Cognition は「実行役が弱いと、いつ聞くべきか分からない」と指摘 → [17](17_cognition_multi-agents-working.md)）。
