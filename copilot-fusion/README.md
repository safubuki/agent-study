# Copilot Fusion とハーネス — 図で理解する使い方と移行

**ハーネスは AI の作業を進める実行管理、Fusion はそこで使うモデルと処理方式を選ぶ仕組みです。** まず Local と Copilot の違いを確認し、その土台の上で Fusion が何を加えるのかを読む構成にしました。

中心となる解説は次の **2本**です。MCP の移行はハーネスの変更に関係するため1本目にまとめ、独立した3本目の解説には分けていません。

| 順番 | ガイド | 分かること |
|---|---|---|
| **1** | [Local と Copilot ハーネス](01_harness-local-vs-copilot.md) | 画面・モデル・実行場所との違い、依頼から返答までの処理、Copilot を使う利点、MCP や既存設定が使えなくなる理由と対処 |
| **2** | [Copilot Fusion](02_copilot-fusion.md) | Single / Cascade / Critique、Auto やサブエージェントとの違い、有効化、利用条件、費用・差分の確認 |

初回確認日は **2026-11-12**。MCP の転送条件と環境変数への移行手順は **2026-11-13 に再確認**しています。GitHub Docs・GitHub Changelog・VS Code 公式ドキュメントを参照し、各本文で根拠のリンクと確認時点を示しています。公開されていないモデル選択の判定式や物理的なサービス構成は断定していません。

![考える AI モデル、実行を取り持つハーネス、標準・MCP 経由の道具を分けた基本図](assets/harness-system-map.svg)

| 図の用語 | 意味 |
|---|---|
| **AIモデル** | 指示を読み、案・返答・次の操作を考える AI |
| **ツール** | ファイル読取・編集・検索など、呼び出せる操作 |
| **ハーネス** | AI・情報・道具・承認・会話をつなぐ実行管理 |
| **MCP** | 外部の道具やデータとやり取りする共通ルール |

Agent Host・Extension Host・Copilot SDK は、[1本目の構成図と、その直下の用語集](01_harness-local-vs-copilot.md#1-aiモデル道具実行管理を分ける)で順に説明します。

## 図の一覧

| 図 | 読みたい内容 |
|---|---|
| [AI・ツール・ハーネスの基本図](assets/harness-system-map.svg) | 考える AI、呼べる道具、実行管理、MCP の違いを知る |
| [旧 Local の構成](assets/harness-local-architecture.svg) | Extension Host と、その側で動く実行管理を分ける |
| [Copilot 側の構成](assets/harness-copilot-architecture.svg) | Agent Host、SDK、実行ランタイムを別の部品として見る |
| [Copilot ハーネスの担当](assets/harness-responsibilities.svg) | シーケンスへ進む前に、実行管理の仕事と各登場人物を理解する |
| [Local / Copilot の違い](assets/harness-differences.svg) | 画面を閉じる、共通の実行管理を使う、設定を渡す場面を比較する |
| [MCP が見えなくなる時系列](assets/harness-mcp-before-after.svg) | Local での動作、切替時の転送除外、対処後の確認を時間順に追う |
| [ハーネスのシーケンス図](assets/harness-request-sequence.svg) | ユーザーが依頼し、モデルの提案から道具を使って返答する |
| [MCP が見えないときの対処手順](assets/harness-mcp-migration.svg) | 設定経路と認証方式を選び、表示・接続・実行を順番に確認する |
| [環境変数で復旧する具体例](assets/harness-mcp-env-sequence.svg) | 操作する人・起動環境・ハーネス・teamDocs の4列で、キーの継承と検索結果を追う |
| [Fusion の全体図](assets/fusion-system-map.svg) | Fusion とハーネス、モデル、道具の関係 |
| [Fusion の3方式](assets/fusion-patterns.svg) | Single / Cascade / Critique の役割と分岐 |
| [Fusion のシーケンス図](assets/fusion-request-sequence.svg) | 依頼から初稿・並列批評・修正・最終返答まで |
| [Auto などとの比較](assets/fusion-vs-auto.svg) | 自動選択、モデルの協調、エージェントの分担を区別する |

ハーネスと Fusion のシーケンス図は、**ユーザー → VS Code → Copilot ハーネス → 生成AIモデル → 評価AIモデル群 → 作業ツール** の列順に固定しています。その例で出番のない列も残し、途中にも列名を再掲しています。環境変数の具体例は、設定から接続までを追う4列の図です。いずれも上から下へ時間が進み、同じ役割には同じ色を使っています。

## 資料の構成

```text
copilot-fusion/
├─ README.md                         ← この案内
├─ 01_harness-local-vs-copilot.md     ← ハーネスの比較・処理・MCP 移行
├─ 02_copilot-fusion.md              ← Fusion の仕組み・開始手順・条件
├─ assets/                           ← SVG 13枚
└─ scripts/                          ← 共通の配色と列順で図を再生成
   ├─ generate-diagrams.js
   ├─ harness-primer-diagrams.js      ← 用語・構成・担当の図
   └─ harness-mcp-diagrams.js         ← MCP の時系列・対処・具体例
```

図を編集するときは、次のコマンドで SVG を再生成できます。Node.js の標準機能だけを使います。

```powershell
node copilot-fusion/scripts/generate-diagrams.js
```

関連する基礎資料： [サブエージェント](../agent-guide/docs/00_subagent-guide.md) / [フックの動き](../hook-guide/docs/03_hook-flow-examples.md) / [MCP 入門](../mcp-guide/docs/00_mcp-guide.md)
