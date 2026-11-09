# info — 親子エージェント構成のセオリー調査メモ

[docs/02_agent-patterns.md](../docs/02_agent-patterns.md) を書くために集めた一次情報のメモ置き場です。
1ファイル＝1出典。各ファイルに「いつの情報か」「誰が書いたか」「要点」「短い原文引用」「注意点」を書いています。

- 調査日：**2026-11-07**（Claude Code / Opus 5.5 が Web 検索と本文取得で収集）
- 選んだ基準：論文（査読付き・主要大学/企業）、AI 企業の公式エンジニアリングブログ・公式ドキュメント、業界で広く引用されたブログ。閲覧数の少ない個人ブログは採用していません（二次まとめは「本文が取れなかったときの補助」としてのみ使い、その旨を明記）。

## 鮮度ラベル

AI の性能は1年で大きく変わるため、各出典に鮮度を付けています（2026-11-07 基準）。

| ラベル | 公開時期 | 読み方 |
|---|---|---|
| **新** | 6か月以内（2026-05 以降） | そのまま参考にしてよい |
| **中** | 6〜12か月前（2025-11〜2026-04） | 考え方は有効。数値やモデル名は1〜2世代前 |
| **古** | 12か月超（〜2025-10） | 原則は今も引用されるが、実験に使ったモデルは今より大幅に弱い。「その頃の弱点を補う工夫」が混ざっている前提で読む |

## 出典一覧（公開日順）

| # | ファイル | 出典 | 種別 | 公開日 | 鮮度 |
|---|---|---|---|---|---|
| 01 | [01_anthropic_building-effective-agents.md](01_anthropic_building-effective-agents.md) | Anthropic「Building effective agents」 | 公式ブログ | 2024-12-19 | 古 |
| 02 | [02_mast_why-multi-agent-systems-fail.md](02_mast_why-multi-agent-systems-fail.md) | Cemri ほか「Why Do Multi-Agent LLM Systems Fail?」（MAST） | 論文（NeurIPS 2025 D&B） | 2025-03（v3: 2025-10） | 古 |
| 03 | [03_openai_practical-guide-to-building-agents.md](03_openai_practical-guide-to-building-agents.md) | OpenAI「A practical guide to building agents」 | 公式ガイド（PDF） | 2025-04 | 古 |
| 04 | [04_langchain_benchmarking-multi-agent.md](04_langchain_benchmarking-multi-agent.md) | LangChain「Benchmarking Multi-Agent Architectures」 | 公式ブログ（ベンチマーク） | 2025-06-10 | 古 |
| 05 | [05_cognition_dont-build-multi-agents.md](05_cognition_dont-build-multi-agents.md) | Cognition「Don't Build Multi-Agents」 | 公式ブログ | 2025-06-12 | 古 |
| 06 | [06_anthropic_multi-agent-research-system.md](06_anthropic_multi-agent-research-system.md) | Anthropic「How we built our multi-agent research system」 | 公式ブログ | 2025-06-13 | 古 |
| 07 | [07_langchain_how-and-when-multi-agent.md](07_langchain_how-and-when-multi-agent.md) | LangChain「How and when to build multi-agent systems」 | 公式ブログ | 2025-06-16 | 古 |
| 08 | [08_lance-martin_bitter-lesson.md](08_lance-martin_bitter-lesson.md) | Lance Martin「Learning the Bitter Lesson」 | 著名エンジニアのブログ | 2025-07-30 | 古 |
| 09 | [09_debate-or-vote.md](09_debate-or-vote.md) | Choi ほか「Debate or Vote」 | 論文（NeurIPS 2025） | 2025-08 | 古 |
| 10 | [10_anthropic_context-engineering.md](10_anthropic_context-engineering.md) | Anthropic「Effective context engineering for AI agents」 | 公式ブログ | 2025-09-29 | 古 |
| 11 | [11_google_scaling-agent-systems.md](11_google_scaling-agent-systems.md) | Google Research ほか「Towards a Science of Scaling Agent Systems」 | 論文＋公式ブログ | 2025-12（v3: 2026-04、ブログ 2026-01-28） | 中 |
| 12 | [12_philschmid_agent-harness-2026.md](12_philschmid_agent-harness-2026.md) | Philipp Schmid「The importance of Agent Harness in 2026」 | 著名エンジニアのブログ | 2026-01-05 | 中 |
| 13 | [13_cursor_scaling-agents.md](13_cursor_scaling-agents.md) | Cursor「Scaling long-running autonomous coding」 | 公式ブログ | 2026-01-14 | 中 |
| 14 | [14_kimi_k2-5-agent-swarm.md](14_kimi_k2-5-agent-swarm.md) | Moonshot AI「Kimi K2.5」（Agent Swarm） | 公式ブログ | 2026-01 | 中 |
| 15 | [15_anthropic_harness-design.md](15_anthropic_harness-design.md) | Anthropic「Harness design for long-running apps」 | 公式ブログ | 2026-03-24 | 中 |
| 16 | [16_anthropic_advisor-strategy.md](16_anthropic_advisor-strategy.md) | Anthropic「The advisor strategy」 | 公式ブログ | 2026-04-09 | 中 |
| 17 | [17_cognition_multi-agents-working.md](17_cognition_multi-agents-working.md) | Cognition「Multi-Agents: What's Actually Working」 | 公式ブログ | 2026-04-22 | 中 |
| 18 | [18_illusion-of-multi-agent-advantage.md](18_illusion-of-multi-agent-advantage.md) | Jwalapuram ほか「The Illusion of Multi-Agent Advantage」 | 論文（プレプリント） | 2026-06-11 | 新 |
| 19 | [19_automated-mas-design.md](19_automated-mas-design.md) | ADAS / AFlow / MaAS / MAS-ZERO（構成の自動設計） | 論文群（二次情報で確認） | 2024-08〜2025-05 | 古 |
| 20 | [20_microsoft_orchestration-patterns.md](20_microsoft_orchestration-patterns.md) | Microsoft「AI Agent Orchestration Patterns」 | 公式ドキュメント | 2026-02-12（更新 2026-09-21） | 新 |
| 21 | [21_claude-code_docs.md](21_claude-code_docs.md) | Claude Code 公式ドキュメント（Subagents / Agent teams / Best practices） | 公式ドキュメント（随時更新） | 取得 2026-11-07 | 新 |

## 出典どうしの関係（読み方のヒント）

- **2024年末〜2025年半ばの「型」の整理**：01（Anthropic）・03（OpenAI）・20（Microsoft）がパターンの名前と使い分けを示す。
- **2025年6月の論争**：05（Cognition「作るな」）と 06（Anthropic「作ったら90%良くなった」）が同時期に出て、07（LangChain）が「読む作業は分担向き、書く作業は1人向き」で両者を整理した。
- **2025年後半〜2026年の実証**：02・09・11・18 の論文が「マルチエージェントはいつ効くか／効かないか」を数字で示した。
- **2026年の流れ**：15・17・21 が「モデルが強くなったので、昔の仕組みは外してよい」「分担はモデルが自分で決める」方向を示す。08・12・13 は「仕組みは足すより削る方が効く」という経験則。
