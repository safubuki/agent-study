# Cognition「Don't Build Multi-Agents」

| 項目 | 内容 |
|---|---|
| 発行元 | Cognition（Devin の開発元）公式ブログ |
| 著者 | Walden Yan |
| 公開日 | 2025-06-12 |
| 鮮度 | **古**（約17か月前）。同じ著者が 2026-04 に続編を出して見解を更新（[17](17_cognition_multi-agents-working.md)） |
| URL | https://cognition.com/blog/dont-build-multi-agents |

## 要点

- 2つの原則：
  1. **文脈を共有せよ。個々のメッセージではなく、エージェントの行動記録（トレース）全体を共有せよ。**
  2. **行動には暗黙の判断が含まれる。判断が食い違うと結果が悪くなる。**
- 例（Flappy Bird）：「背景」と「鳥」を別々の子に作らせたら、片方はマリオ風の背景、もう片方は別物の鳥を作り、最後に組み合わせられなかった。元の依頼文を渡しても、途中の解釈は共有されないので防げない。
- 推奨：**単一スレッドの直線的なエージェント**がいちばん単純に原則を守れる。長い仕事は、履歴を要点に圧縮する仕組みで補う。
- 当時の Claude Code のサブエージェントは「**質問に答えるだけで、コードは書かない**」使われ方をしており、それは原則に合っている、と評価。

## 原文引用（短く）

> "Share context, and share full agent traces, not just individual messages"

> "Actions carry implicit decisions, and conflicting decisions carry bad results"

> "The simplest way to follow the principles is to just use a single-threaded linear agent."

## 注意点

- 2025年6月時点の見解。著者自身が 2026年4月に「読み取り専用の子・レビュー役・マネージャー型は実際に機能している」と更新している。「**並列に書く**のはまだダメ」という部分は維持。
