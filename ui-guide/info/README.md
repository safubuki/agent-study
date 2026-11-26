# 一次情報の出典メモ（ui-guide）

`ui-guide` で紹介している AI UI パターン分類および普遍的な UI・アクセシビリティ基準は、以下の公式ガイドライン・UX 研究機関の一次情報に基づいています。

> **この資料での言葉の扱い方**
> 本ガイドでは、まず各社・研究機関で使われている **正式な英語用語と提唱元** を明示し、そのうえで日本語での分かりやすい言い換えを添えています（「AI 裏方型」のように公式ではない噛み砕き表現を使う場合は、必ず原語である `Invisible ML` / `Ambient AI` 等と出典を併記します）。

---

## 1. AI UI パターン・Human-AI Interaction の一次情報

| 出典・提唱元 | 資料名 | 主な概念・体系 | 確認日 |
|---|---|---|---|
| **Nielsen Norman Group (NN/g)** | 記事 *"AI Chat Is Not (Always) the Answer"*（Sarah Gibbons & Kate Moran）ほか AI UX 調査記事群 | Chat（会話型）、Canvas、Inline（文脈補助）、Ambient（環境溶け込み）、Generative UI（動的UI生成）、チャット万能主義への警鐘 | 2026-11 |
| **Apple** | Human Interface Guidelines — Machine Learning（HIG） | **Visible vs. Invisible ML**（見える AI vs 裏側で見えない AI）、**Proactive vs. Reactive**（先回り提案 vs 要求への応答）、**Implicit vs. Explicit Feedback**（暗黙的・明示的フィードバック） | 2026-11 |
| **Google (PAIR)** | People + AI Guidebook | User Needs + Defining Success、**Implicit vs. Explicit Feedback**、Feedback + Control、Explainability + Trust、Errors + Graceful Failure | 2026-11 |
| **Microsoft** | Guidelines for Human-AI Interaction（CHI 2019）& HAX Toolkit | 4フェーズ（Initially: G1–G2 / During Interaction: G3–G6 / When Wrong: G7–G11［G7呼出・G8却下・G9修正・G10絞込・G11説明］ / Over Time: G12–G18）にわたる **18 の Human-AI 指針** と Agentic UI への適用 | 2026-11 |
| **The Shape of AI**（Emily Campbell） | AI UX Pattern Library（`shapeof.ai`） | AI 製品の実例を分解した UI パターン体系（Wayfinders / Inputs / **Tuners**［調整つまみ・スライダー等］/ Governors / Trust Indicators / Identifiers） | 2026-11 |

---

## 2. 普遍的な UI・アクセシビリティ・日本語 UD の一次情報

| 出典・規格 | 資料名 | 主な基準 |
|---|---|---|
| **W3C** | WCAG 2.1 / 2.2（Web Content Accessibility Guidelines） | コントラスト比 AA（通常テキスト **4.5:1**、大きいテキスト **3.0:1**、UI部品 **3.0:1**）、AAA（**7.0:1**）、色のみに依存しない情報伝達（1.4.1）、エラーの特定と修正提案（3.3.1 / 3.3.3） |
| **JIS（日本産業規格）** | JIS X 8341-3:2016 | 高齢者・障害者等配慮設計指針（WCAG 2.0 と一致） |
| **デジタル庁** | デジタル庁デザインシステム / ウェブアクセシビリティ導入ガイドブック | 日本語 UI における読みやすい文字サイズ・行間・分かりやすいエラー文・UD フォント配慮 |
| **モリサワ / Windows 標準** | BIZ UDPGothic / BIZ UDGothic 等のユニバーサルデザイン（UD）書体設計 | 広いふところ、濁点・半濁点の判別性、紛らわしい英数字（`0`/`O`、`1`/`l`/`I`）の明確な区別 |
