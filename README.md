# agent-study — サブエージェント・フック・MCP を「図解・パターン・実験」で学ぶ

AI コーディングエージェント（Claude Code や GitHub Copilot）を使いこなす3つの拡張機能――**サブエージェント**、**フック**、**MCP**――を、ベクター図解・定番パターン・サンプル集・実験環境で学ぶための作業場です。

![3つの仕組みの全体像](assets/three-pillars-overview.svg)

> [!TIP]
> **まずはここから！絵でわかる学習ポータル（全 8 ガイドへ簡単ジャンプ）**
> - **[🏠 学習ポータル（index.html）](index.html)**（ブラウザで開くだけ・外部依存なし。各テーマで何が学べるかを優しいベクターイラストで紹介し、動的ガイド・Markdown資料へ 1 クリックで移動できます）
>
> **動かしてすぐ分かる！ブラウザで開く動的インタラクティブガイド（全8本・HTML単一ファイル・外部依存なし）**
> - [1. エージェント](agent-guide/interactive-guide.html) ／ [2. Copilot Fusion](copilot-fusion/interactive-guide.html) ／ [3. フック](hook-guide/interactive-guide.html) ／ [4. MCP](mcp-guide/interactive-guide.html) ／ [5. UML・要求図](uml-guide/interactive-guide.html) ／ [6. エージェントスキル](agent-skill/interactive-guide.html) ／ [7. AI・UI設計](ui-guide/interactive-guide.html) ／ [8. リアルライトモック](real-lite-mock/interactive-guide.html)
>
> **AI の契約や外部パッケージなしでも、今すぐ手元で試せます（Node.js のみ・約1秒）**
> - **フックの動きを試す**：`node hook-guide/scripts/test-hooks-locally.js`（模擬入力で各イベントのブロック／自動整形／差し戻しを一括検証）
> - **MCP の通信を見る**：`node mcp-guide/scripts/test-mcp-server.js`（`initialize` → `tools/list` → `tools/call` の JSON-RPC 2.0 往復を表示）

---

## 1. 目的別の最短ルート（どこから始めるか）

| 目的 | おすすめの入口 | 分かること・できること |
|---|---|---|
| **① まず全体像と実測を見る** | [3つの仕組み（上の図）](assets/three-pillars-overview.svg) ／ [フックの動き（全体図・シーケンス図）](hook-guide/docs/03_hook-flow-examples.md) ／ [サブエージェント実測レポート](agent-guide/output/report_01-profile.md) | 「いつどれを使うか」、そして分担とスクリプト統合で時間・コストがどう変わるかの実測結果 |
| **② Copilot の最新仕様を押さえる** | [Copilot Fusion とハーネス](copilot-fusion/README.md) ／ [01 ハーネス移行ガイド](copilot-fusion/01_harness-local-vs-copilot.md) | 旧 Local から Copilot ハーネスへの移行、MCP が見えなくなる原因と復旧、Fusion の3方式（Single / Cascade / Critique） |
| **③ 1分で動く最小サンプルを試す** | [hook-guide/README.md](hook-guide/README.md#2-すぐ試せるclaude-code-なしでフックの動きを1秒で体験する) ／ [mcp-guide/README.md](mcp-guide/README.md#2-まずは1秒体験mcp-サーバーと直接会話してみるclaude-不要) | 外部パッケージ不要の Node.js スクリプトで、フックと MCP の仕組みを手元で即体験 |
| **④ 自分のリポジトリへコピーする** | [agent-guide/samples/](agent-guide/samples/README.md) ／ [hook-guide/samples/](hook-guide/samples/README.md) ／ [mcp-guide/samples/](mcp-guide/samples/README.md) | 定番5パターン別の定義・設定ファイルを Claude Code 用と GitHub Copilot 用で並べて収録 |
| **⑤ 自分の環境で比較実験する** | [agent-guide](agent-guide/README.md) ／ [hook-guide](hook-guide/README.md) ／ [mcp-guide](mcp-guide/README.md) の `run-experiment.ps1` | 「使う／使わない」の差を時間・ターン数・トークン・規約遵守スコア・計算精度で記録 |
| **⑥ スキルの運用と階層化を考える** | [agent-skill/](agent-skill/README.md) ／ [動的版](agent-skill/interactive-guide.html) ／ [強制力のはしご](agent-skill/assets/sk-16-enforcement-ladder.svg) | スキルの基本、増えたスキルの管理・改善・共有（公式事例と研究の精査）、「全社で絶対・部署だけ・個人だけ」をスキルとそれ以外の仕組みでどう分けるか |
| **⑦ AI アプリの UI と見やすい画面設計を学ぶ** | [ui-guide/](ui-guide/README.md) ／ [動的版（4パターン体験）](ui-guide/interactive-guide.html) | AI 活用アプリの 4 大 UI 型（チャット／並列／AI裏方／ハイブリッド）、UD フォント・WCAG 配色・親切なエラー表示のセオリーと操作サンプル |
| **⑧ 超高速な「動くモック」から本番化する手法を学ぶ** | [real-lite-mock/](real-lite-mock/README.md) ／ [動的版（3案比較＆自動デモ体験）](real-lite-mock/interactive-guide.html) | 単一 HTML＋AI CLI＋MCP で 3〜4 日で 3 パターン並行試作し、自動再生デモを経て「動く仕様書」として本番構成へ変換する手法 |

> [!NOTE]
> **このリポジトリの設計方針**
> 1. **Claude Code と GitHub Copilot（VS Code / CLI）の両対応**：同じ題材で定義ファイル・設定ファイル・ハーネスの違いを並べて比較しています。
> 2. **「まず 1 人・標準機能」から始める**：一次情報の出典メモには**鮮度ラベル**を付け、「使わない方がよい場面」や「AI の進化で古くなる工夫」も整理しています。
> 3. **外部パッケージ不要**：付属のフック・MCP サーバー・図生成スクリプトはすべて Node.js 標準モジュールのみで動きます。

---

## 2. ガイド一覧

| フォルダ | テーマ | 基礎ガイド（図解） | Copilot 編 | 定番パターン5選 | サンプル集 | 実験手順 |
|---|---|---|---|---|---|---|
| **[agent-guide/](agent-guide/README.md)** | **サブエージェント**<br/>（AI の分担・親子構成） | [00 入門](agent-guide/docs/00_subagent-guide.md) | [01 Copilot編](agent-guide/docs/01_copilot-subagent-guide.md) | [02 パターン5選](agent-guide/docs/02_agent-patterns.md) | [samples/](agent-guide/samples/README.md) | [README](agent-guide/README.md) |
| **[hook-guide/](hook-guide/README.md)** | **フック（Hooks）**<br/>（関所・自動整形・完了ゲート） | [00 入門](hook-guide/docs/00_hook-guide.md) | [01 Copilot編](hook-guide/docs/01_copilot-hook-guide.md) | [02 パターン5選](hook-guide/docs/02_hook-patterns.md) | [samples/](hook-guide/samples/README.md) | [README](hook-guide/README.md) |
| **[mcp-guide/](mcp-guide/README.md)** | **MCP**<br/>（外部ツール・データ接続規格） | [00 入門](mcp-guide/docs/00_mcp-guide.md) | [01 Copilot編](mcp-guide/docs/01_copilot-mcp-guide.md) | [02 パターン5選](mcp-guide/docs/02_mcp-patterns.md) | [samples/](mcp-guide/samples/README.md) | [README](mcp-guide/README.md) |
| **[copilot-fusion/](copilot-fusion/README.md)** | **Copilot Fusion とハーネス**<br/>（実行管理・MCP移行・モデル協調） | [01 ハーネス移行](copilot-fusion/01_harness-local-vs-copilot.md) | [02 Fusion解説](copilot-fusion/02_copilot-fusion.md) | — | — | [README](copilot-fusion/README.md) |
| **[agent-skill/](agent-skill/README.md)** | **エージェントスキル**<br/>（基本・管理と改善ループ・階層化・制約と年表・大容量データ） | [00 基本](agent-skill/00_agent-skill-basics.md) ／ [01 管理と改善ループ](agent-skill/01_skill-management-loop.md) ／ [02 階層化と別の方法](agent-skill/02_layered-rules.md) ／ [04 制約と年表](agent-skill/04_instruction-limits-and-timeline.md) ／ [05 大容量データ](agent-skill/05_large-files-outside-git.md) | [Copilot 編](agent-skill/copilot/README.md) ／ [Claude Code 編](agent-skill/claude/README.md) | — | [copilot](agent-skill/copilot/samples/README.md) ／ [claude](agent-skill/claude/samples/README.md) ／ [shared](agent-skill/shared/README.md) | [03 依頼と結果](agent-skill/03_request-and-results.md) |
| **[uml-guide/req/](uml-guide/req/README.md)** | **UML・SysML と要求図**<br/>（要望 → 要求 → 要件 → 仕様 → 設計） | [00 言葉の定義](uml-guide/req/00_what-is-a-requirement.md) ／ [01 UML と SysML](uml-guide/req/01_uml-vs-sysml.md) ／ [02 要求図の書き方](uml-guide/req/02_requirement-diagram.md) | — | — | — | [03 要求から設計図まで](uml-guide/req/03_requirements-to-design.md) |
| **[ui-guide/](ui-guide/README.md)** | **AI アプリと普遍的な UI 設計**<br/>（4大AI UI型・UD文字・配色・エラー表示） | [00 AI UI セオリー](ui-guide/00_ai-ui-patterns.md) ／ [01 普遍 UI 基礎](ui-guide/01_universal-ui-basics.md) | — | [02 チェックリスト](ui-guide/02_design-checklist.md) | [4パターン操作体験](ui-guide/interactive-guide.html) | [README](ui-guide/README.md) |
| **[real-lite-mock/](real-lite-mock/README.md)** | **リアルライトモック開発手法**<br/>（単一HTML×3案・AI CLI＋MCP・自動デモ・本番資産化） | [00 全体像](real-lite-mock/00_concept-and-overview.md) ／ [01 ワークフロー](real-lite-mock/01_workflow-and-architecture.md) ／ [02 有効性と類似手法](real-lite-mock/02_validity-and-prior-art.md) | — | [03 プレイブック＆プロンプト](real-lite-mock/03_playbook-checklist.md) | [3案＆自動デモ体験](real-lite-mock/interactive-guide.html) | [README](real-lite-mock/README.md) |

---

## 3. フォルダ構成

```text
agent-study/
├─ index.html                ← 🏠 学習ポータル（絵でわかる全体案内＆全7ガイドへジャンプ）
├─ README.md                 ← この全体案内
├─ assets/                   ← 全体像のベクター図＆ポータル用イラスト（assets/portal/）
├─ agent-guide/              ← ① サブエージェント（AI の分担・親子構成）
│   ├─ docs/                 … 読み物3本（00 / 01 / 02）＋ SVGベクター図解
│   ├─ info/                 … 一次情報の出典メモ（21件、鮮度ラベルつき）
│   ├─ samples/              … パターン別の定義ファイル見本（01〜05）
│   └─ scripts/ prompts/ output/ … 計測実験環境＆実測レポート
│
├─ hook-guide/               ← ② フック（関所・自動整形・完了ゲート）
│   ├─ docs/                 … 読み物4本（00 / 01 / 02 / 03）＋ SVGベクター図解
│   ├─ info/                 … 一次情報の出典メモ（10件、鮮度ラベルつき）
│   ├─ samples/              … パターン別の設定・スクリプト見本（01〜05）
│   └─ hooks/ scripts/ prompts/ output/ … 1秒ローカル検証＆計測実験環境
│
├─ mcp-guide/                ← ③ MCP（外部ツール・データ接続の共通規格）
│   ├─ docs/                 … 読み物3本（00 / 01 / 02）＋ SVGベクター図解
│   ├─ info/                 … 一次情報の出典メモ（10件、鮮度ラベルつき）
│   ├─ samples/              … パターン別のサーバー・設定見本（01〜05）
│   └─ servers/ data/ scripts/ prompts/ output/ … 1秒通信検証＆計測実験環境
│
├─ copilot-fusion/           ← ④ Copilot Fusion とハーネス（図解ガイド）
│   ├─ 01_harness-local-vs-copilot.md … Local / Copilot 比較と MCP 移行
│   ├─ 02_copilot-fusion.md           … Fusion の3方式・Auto 等との比較
│   ├─ assets/                        … SVGベクター図解（13枚）
│   └─ scripts/                       … 図の再生成スクリプト
│
├─ agent-skill/              ← エージェントスキル（基本・管理と改善ループ・階層化・制約と年表・大容量データ）
│   ├─ 00〜05 *.md                     … 共通の考え方（依頼と結果の記録を含む）
│   ├─ copilot/ claude/               … 製品ごとの組み方ガイド・図・動くサンプル（同じ形）
│   ├─ shared/                        … 共通の道具（利用ログ・棚卸し・大容量データの目録）
│   ├─ assets/ info/                  … SVGベクター図解（全59枚のうち共通25枚）／出典メモ
│   └─ scripts/                       … 図の再生成・サンプルの動作確認
│
├─ uml-guide/req/            ← ⑤ UML・SysML と要求図（図解ガイド＋動的版）
│   ├─ 00〜03 *.md                     … 言葉の定義・UML と SysML の比較・要求図の書き方・設計図への落とし込み
│   ├─ assets/                        … SVGベクター図解（19枚）
│   └─ scripts/                       … 図の再生成スクリプト
│
├─ ui-guide/                 ← ⑥ AI アプリと普遍的な UI 設計（セオリー＋操作サンプル付き動的版）
│   ├─ 00_ai-ui-patterns.md           … AI 活用アプリの 4 大 UI パターンと AI 特有 UX 原則
│   ├─ 01_universal-ui-basics.md      … 視線誘導・アフォーダンス・UD 文字・WCAG 配色・エラー表示
│   ├─ 02_design-checklist.md         … 実践チェックリスト＆アンチパターン集
│   └─ interactive-guide.html         … 4 パターン操作感ミニアプリ＋ビフォー/アフター体験
│
├─ real-lite-mock/           ← ⑦ リアルライトモック開発手法（超高速試作 → 本番資産化＋動的版）
│   ├─ 00〜03 *.md                    … コンセプト・ワークフロー・有効性と類似手法・実践プレイブック
│   ├─ assets/                        … SVG ベクター図解（6 枚）
│   └─ interactive-guide.html         … 3 パターン並行試作×▶自動再生デモ体験＆コピペ用プロンプト
│
└─ scripts/                  ← 一括検証（npm test）と SVG 図の共通描画キット
```
