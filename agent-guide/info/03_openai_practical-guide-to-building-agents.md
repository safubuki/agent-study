# OpenAI「A practical guide to building agents」

| 項目 | 内容 |
|---|---|
| 発行元 | OpenAI（公式ガイド PDF、34ページ） |
| 公開日 | 2025-04（PDF 本文に日付の記載なし。公開時期は一般に 2025年4月とされる） |
| 鮮度 | **古**（約19か月前） |
| URL | https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf |
| 取得方法 | PDF をダウンロードしてテキスト抽出（pypdf）し、該当箇所を確認 |

## 要点

- 構成は大きく2つ：**単体エージェント**（1つのモデルがツールと指示を持ってループで動く）と**マルチエージェント**。
- **まず単体エージェントの能力を最大化せよ**。ツールを少しずつ足していく方が、評価と保守が簡単。
- 分割を検討する目安：
  - **複雑な分岐**：プロンプトに if-then-else が多く、テンプレートが手に負えなくなったら、論理のまとまりごとに分ける。
  - **ツール過多**：問題は数より**似ていること・重なり**。「15個以上でも明確に区別できれば動く例もあれば、重なる10個未満で苦しむ例もある」。名前・説明を改善しても直らなければ分ける。
- マルチエージェントの2類型：
  - **マネージャー型（エージェントをツールとして呼ぶ）**：中央のマネージャーが専門エージェントをツール呼び出しで使い、結果をまとめる。**1体だけがユーザーと話し、流れを握りたい**ときに向く。
  - **分散型（ハンドオフ）**：対等なエージェントが仕事を**一方通行で引き継ぐ**。会話状態ごと次のエージェントに移る。**中央でまとめる必要がない**ときに向く（例：受付 → 技術サポート／営業／注文窓口）。

## 原文引用（短く）

> "Our general recommendation is to maximize a single agent's capabilities first."

> "The issue isn't solely the number of tools, but their similarity or overlap."

> "starting with a single agent and evolving to multi-agent systems only when needed"

## 注意点

- 顧客対応のような業務アプリを主な想定にしている。コーディング支援ツールの親子構成とは粒度が異なる。
