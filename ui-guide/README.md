# AI アプリと普遍的な UI 設計ガイド（ui-guide）

**「AI 機能を持つアプリを、どんな画面構成にすればお客さまにとって分かりやすいか？」** を、**Google (PAIR)・Apple (HIG)・Microsoft (HAX Toolkit)・Nielsen Norman Group (NN/g)・The Shape of AI** といった一次情報のガイドラインに基づいて整理し、あわせて **普遍的な見やすい UI 基礎（UD フォント・WCAG 配色・親切なエラー表示）** をまとめたガイドです。

> [!TIP]
> **実際に触って操作感を試せる＋自分のアプリの最適 UI を診断＆AI へ相談できる！**
> - **[AI・UI設計 わかる動的ガイド（interactive-guide.html）](interactive-guide.html)**（ブラウザで開くだけ・外部依存なし）
>   - **一次情報ベースの 7 大 AI UI パターン**を一覧＆代表 5 パターン（Chat / Canvas / Inline / Tuners＋Hybrid / Ambient・Invisible）のミニアプリを実際に操作して比較！
>   - **ポチポチ選ぶ「最適 AI UI パターン診断」** ＋ **そのまま AI に貼り付けて相談できるプロンプト自動生成＆コピー機能**付き！
>   - 悪い UI ⇔ 良い UI ビフォー／アフター比較、UD 文字・行間・WCAG AA（4.5:1）コントラスト体感ラボも収録。

---

## どこから読むか（目的別マップ）

| 知りたいこと | 読むファイル | 主な内容 |
|---|---|---|
| **まず触って比較・診断・AI相談プロンプトを作りたい** | [interactive-guide.html](interactive-guide.html) | 一次情報 7 パターン比較ミニアプリ、ポチポチ診断、AI相談プロンプトコピー、UD/WCAG 体感 |
| **一次情報に基づく AI UI の 7 パターンと根拠を知りたい** | [00 AI 活用アプリの UI パターン体系](00_ai-ui-patterns.md) | NN/g・Apple HIG・Google PAIR・Microsoft HAX・Shape of AI に基づく 7 パターン分類、使い分け、AI 特有 UX 原則 |
| **見やすい文字・配色・エラー表示の基礎を押さえたい** | [01 普遍的な UI 設計の基礎](01_universal-ui-basics.md) | 視線誘導、アフォーダンス（押せる/読む・設定/実行の分離）、UD フォント、WCAG 配色基準、親切なエラー表示 |
| **レビュー用チェックリスト＆AI へ相談するプロンプトを使いたい** | [02 実践チェックリスト＆AI相談プロンプト](02_design-checklist.md) | 20 項目チェックリスト、アンチパターン集、自分のワークスペースを見せて AI に最適 UI を聞くプロンプト集 |
| **一次情報の出典・提唱元を確認したい** | [info/README.md](info/README.md) | Google PAIR / Apple HIG / Microsoft HAX / NN/g / Shape of AI / WCAG / JIS 等の出典一覧 |

---

## フォルダ構成

```text
ui-guide/
├─ README.md                    ← この全体案内
├─ 00_ai-ui-patterns.md         ← 一次情報ベースの AI UI 7 大パターンと 4 大フレームワーク
├─ 01_universal-ui-basics.md    ← 視線誘導・UD フォント・WCAG 配色・エラー表示など普遍 UI の基礎
├─ 02_design-checklist.md       ← チェックリスト・アンチパターン集・AI 相談プロンプト雛形
├─ info/README.md               ← Google / Apple / Microsoft / NN/g 等の一次情報出典メモ
└─ interactive-guide.html       ← 操作感ミニアプリ＋最適UI診断＋AI相談プロンプト生成付き動的ガイド
```
