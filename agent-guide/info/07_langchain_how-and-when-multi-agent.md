# LangChain「How and when to build multi-agent systems」

| 項目 | 内容 |
|---|---|
| 発行元 | LangChain 公式ブログ |
| 著者 | Harrison Chase（LangChain CEO） |
| 公開日 | 2025-06-16 |
| 鮮度 | **古**（約17か月前） |
| URL | https://www.langchain.com/blog/how-and-when-to-build-multi-agent-systems |

## 要点

- 同じ週に出た Cognition「作るな」（[05](05_cognition_dont-build-multi-agents.md)）と Anthropic「作ったら良くなった」（[06](06_anthropic_multi-agent-research-system.md)）は矛盾していない、と整理。
- 両者の共通点は2つ：
  1. **コンテキストエンジニアリング**（各呼び出しに正しい情報を渡すこと）がいちばん大事。
  2. **読む作業は分担しやすく、書く作業は分担しにくい**。
- 並列に書くと、同じ文脈を共有したうえで食い違った成果を統合しなければならず難しい。食い違った「書き込み」は、食い違った「読み取り」より被害が大きい。
- Anthropic の調査システムも、**分担するのは読む段階だけで、最終レポートは1体が書いている**。
- 向く：幅優先の調査、並列化しやすい、1つの文脈に収まらない情報。向かない：同じ文脈が必要・依存が多い（多くのコーディング）。
- マルチエージェントの主な効果は「**価値に見合うだけトークンを使えること**」。
- 評価は約20件から始め、LLM 判定と人の確認を組み合わせる。

## 原文引用（短く）

> "Actions carry implicit decisions, and conflicting decisions carry bad results."（Cognition の引用として）

## 注意点

- 2025年半ばの議論の整理。「読むのは分担、書くのは1人」という要約は 2026年の Cognition 続編（[17](17_cognition_multi-agents-working.md)）でもそのまま維持されている。
