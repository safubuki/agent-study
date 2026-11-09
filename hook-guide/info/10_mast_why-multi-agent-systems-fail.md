# Cemri ほか「Why Do Multi-Agent LLM Systems Fail?」（MAST）

| 項目 | 内容 |
|---|---|
| 発行元 | UC Berkeley / Intesa Sanpaolo ほか（NeurIPS 2025 Datasets and Benchmarks） |
| 著者 | Mert Cemri, Melissa Z. Pan, Shuyi Yang ほか |
| 公開日 | 2025-03（v3: 2025-10） |
| 鮮度 | **古**（約1年超前）。ただしエージェントの失敗原因を定量分類した代表的論文 |
| URL | https://arxiv.org/abs/2503.13657 |

## 要点

- 1,600件以上のエージェント実行トレースを分析し、失敗原因を14種の分類（MAST: Multi-Agent System Failure Taxonomy）に整理した研究。
- 失敗の3大カテゴリ：
  1. **仕様・システム設計の不備（System Design / Specification Issues）**
  2. **エージェント間のズレ（Inter-Agent Misalignment）**
  3. **タスク検証と終了判定の誤り（Task Verification & Termination）：全体の約 23.5%**
- 特にフック（Hooks）と直結する重要な知見：
  - **早すぎる終了（Premature Termination）**や**不完全な検証（Incomplete Verification）**が失敗の大きな割合を占める。
  - エージェントが「終わった」と自己申告した時点でそのまま終了させず、**外側の検証器（Verifier / Stop フックの検査スクリプト）で合否を判定して差し戻す**だけで、成功率が大きく改善する（論文実験で +15.6%）。

## 原文引用（短く）

> "Task Verification and Termination issues account for a substantial portion of failures, where agents either terminate prematurely without fulfilling all requirements or fail to verify the correctness of their outputs."

## 注意点

- マルチエージェントを対象とした論文だが、「早すぎる完了申告」や「自己検証の甘さ」は単体エージェントでもまったく同じように起きる。これを防ぐ最も手軽で確実な仕組みが `Stop` フックによる完了ゲート（[docs/02 の 4章](../docs/02_hook-patterns.md#4-パターン③完了ゲートテストや検査が通るまで止めない)）である。
