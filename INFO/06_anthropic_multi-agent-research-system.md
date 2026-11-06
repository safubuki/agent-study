# Anthropic「How we built our multi-agent research system」

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic Engineering（公式ブログ） |
| 著者 | Jeremy Hadfield, Barry Zhang, Kenneth Lien, Florian Scholz, Jeremy Fox, Daniel Ford |
| 公開日 | 2025-06-13 |
| 鮮度 | **古**（約17か月前）。モデルは Claude Opus 4 / Sonnet 4 |
| URL | https://www.anthropic.com/engineering/multi-agent-research-system |

## 要点

- Claude の Research 機能の構成。**リード（親）が問いを分解し、サブエージェントを並列に起動**して別々の観点を調べさせ、結果を統合する（オーケストレーター・ワーカー型）。引用を付ける専用エージェントが最後に入る。
- 数字：
  - Opus 4（親）＋ Sonnet 4（子）の構成は、Opus 4 単体より社内調査評価で **90.2% 高性能**。
  - BrowseComp での性能差の **80% はトークン使用量だけで説明**できた（＝マルチエージェントの効果の多くは「たくさん考えさせられること」）。
  - トークン量はチャットの約 **4倍（単体エージェント）／約15倍（マルチエージェント）**。
  - 親が3〜5体を並列起動し、子もツールを並列に使うことで、複雑な調査の時間を**最大90%短縮**。
- 向く仕事：並列化しやすい、1つの文脈に収まらない情報量、多数の複雑なツール。**価値が高い**仕事でないと 15倍のコストに見合わない。
- 向かない仕事：全員が同じ文脈を共有する必要がある、依存関係が多い（**多くのコーディング作業**）。
- 委任の書き方：子ごとに **目的・出力形式・使うツールや情報源・作業範囲の境界** を書く。書かないと重複・抜け・見落としが起きる。
- 努力量を複雑さに合わせる：単純な事実確認は1体・ツール3〜10回、比較は2〜4体・各10〜15回、複雑な調査は10体以上。
- 「伝言ゲーム」対策：子は成果を外部（ファイル等）に保存し、親には**軽い参照だけ**を返す。
- 限界：親は子の一団が全員終わるまで待つ（同期実行）。親は途中で子を操縦できず、子同士も連携できない。

## 原文引用（短く）

> "multi-agent systems excel at valuable tasks that involve heavy parallelization"

> "LLM agents are not yet great at coordinating and delegating to other agents in real time"

## 注意点

- 「調べる（読む）」作業での成果であり、「書く」作業で同じ効果が出るとは言っていない（[07](07_langchain_how-and-when-multi-agent.md)）。
- 「体数の目安」は当時の Claude 4 世代と自社のツール群が前提。
