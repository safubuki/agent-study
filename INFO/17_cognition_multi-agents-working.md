# Cognition「Multi-Agents: What's Actually Working」

| 項目 | 内容 |
|---|---|
| 発行元 | Cognition 公式ブログ |
| 著者 | Walden Yan（2025年の「Don't Build Multi-Agents」と同じ著者） |
| 公開日 | 2026-04-22 |
| 鮮度 | **中**（約6.5か月前） |
| URL | https://cognition.com/blog/multi-agents-working |

## 要点

- 1年前の「作るな」（[05](05_cognition_dont-build-multi-agents.md)）を更新。**書き込みは1本の流れに保ち、追加のエージェントには「行動」ではなく「知恵」を出させる**と機能する。
- 実際に機能しているもの：
  | 型 | 中身 |
  |---|---|
  | 読み取り専用の子 | Web 検索・コード検索など。「本当の協調というより**ツール呼び出しに近い**」 |
  | 作り手＋レビュー役 | **まっさらな文脈**のレビュー役は、作り手が見落とすバグを捕まえる。Devin Review は PR あたり平均約2件のバグを見つけ、その約58%が重大 |
  | スマートフレンド | 主役が難所で強いモデルに相談する。**両方が強いモデルなら**機能する（Claude と GPT の組み合わせで難問に効果） |
  | マネージャーと子 | マネージャーが大きな仕事を分け、子を起動し、結果を統合（map-reduce-and-manage）。Devin で稼働中 |
- まだ機能しないもの：
  - **並列に書くスウォーム**：見た目は派手だが実際の採用はほぼない。
  - **構造のない群れ**（エージェント同士が自由に交渉する網）：「ほぼ気晴らし」。
  - 弱いモデルを主役にしたスマートフレンド（SWE-1.5 では相談がうまくいかなかった）：いつ聞くべきか分からない。
- 理由：並列の書き手はスタイル・設計・例外処理で食い違う判断をする／長い文脈は判断を劣化させる（だから差分だけ見るレビュー役が強い）／マネージャーは**指示を細かく書きすぎがち**で、子が自分と同じ状態を共有していると誤解しがち／文脈の受け渡しは未解決。

## 原文引用（短く）

> "clean context leads to a notable improvement in capabilities when using a generator-verifier loop"

> "smart-friend works today when both models are strong"

## 注意点

- 自社製品（Devin）の運用経験に基づく。数値は自社計測。
