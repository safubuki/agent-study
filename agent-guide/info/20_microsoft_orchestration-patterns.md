# Microsoft「AI Agent Orchestration Patterns」（Azure Architecture Center）

| 項目 | 内容 |
|---|---|
| 発行元 | Microsoft Learn（Azure Architecture Center 公式ドキュメント） |
| 日付 | ms.date 2026-02-12、更新 2026-09-21 |
| 鮮度 | **新**（更新から約1.5か月） |
| URL | https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns |

## 要点

- **「要件を確実に満たす、いちばん低い複雑さを使え」**。直接のモデル呼び出し → ツール付き単体エージェント → マルチエージェント の順に、連携オーバーヘッド・遅延・コストが増える。
- 5つの編成パターン：
  | パターン | 中身 | 向く |
  |---|---|---|
  | 逐次（Sequential） | 決まった順番で次のエージェントへ渡す | 段階的な処理 |
  | 並行（Concurrent） | 同じ仕事を全員に配り、独立に結果を集める | 並列分析・アンサンブル |
  | グループチャット | 1つのスレッドに全員が書き込み、管理役が発言順を決める | 合意形成・ブレスト・**作り手＋チェック係（maker-checker）** |
  | ハンドオフ | 文脈や規則に応じて制御を別のエージェントへ渡す | エスカレーション・専門窓口への引き継ぎ |
  | マジェンティック | 計画とタスク状態の保持を伴う汎用的な協調 | 解き方が事前に分からない複雑な仕事 |
- maker-checker（作り手＋チェック係）は、evaluator-optimizer / generator-verifier / critic loop / reflection loop とも呼ばれる、と明記。最大反復回数を決める。
- ハンドオフを**避けるべき**とき：振り分けが決まった規則でできる（文脈の解釈が要らない）とき → コードで振り分ければよい。
- 単体＋多数ツールで確実に解けるなら単体を採用。「意思決定と流れ制御のオーバーヘッドが、分割の利点を上回ることが多い」。
- 文脈管理：次のエージェントに**何が必要か**を決める。生の全文脈が要る場合も、要約で足りる場合も、指示だけで足りる場合もある。不要な文脈は渡さない。
- 人の関与：必須の承認点は同期処理になるので、そこで状態を保存して再開できるようにする。

## 原文引用（短く）

> "Use the lowest level of complexity that reliably meets your requirements."

> "Decision-making and flow-control overhead often exceed the benefits of breaking the task into multiple agents."

## 注意点

- 業務システム（Azure）向けの整理。パターン名の標準的な一覧として採用。
