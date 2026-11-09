# 論文「The Illusion of Multi-Agent Advantage」

| 項目 | 内容 |
|---|---|
| 種別 | 論文（arXiv:2606.13003、プレプリント） |
| 著者 | Prathyusha Jwalapuram, Hehai Lin, Chuyuan Li, Fangkai Jiao, Sudong Wang, Yifei Ming, Zixuan Ke, Chengwei Qin, Giuseppe Carenini, Shafiq Joty |
| 公開日 | 2026-06-11（v2: 2026-06-13） |
| 鮮度 | **新**（約5か月前） |
| URL | https://arxiv.org/abs/2606.13003 |

## 要点

- **自動生成されたマルチエージェント構成**（構成探索で作ったもの）を、単純な **CoT-SC**（同じモデルに複数回考えさせて多数決）と比べた。
- 従来の推論データセットと、BrowseComp-Plus のような対話的な多段タスクで評価。分解・文脈の分離・並列化を試す合成データセットも用意。
- 結果：
  - 自動生成の構成は、**最大10倍のコストをかけても CoT-SC に一貫して負けた**。
  - 合成データセットでは、**専門家が手で設計した構成**が自動生成のものより性能・費用対効果とも上。
  - 自動生成の構成を分解すると、機能に寄与しない複雑さ（「構成の肥大化」）が見つかった。

## 原文引用（短く）

> "consistently underperform CoT-SC despite being up to 10x more expensive"

## 注意点

- 査読前のプレプリント。比較条件（計算量をそろえたか等）の詳細は本文で確認が必要。
- 「**構成を自動探索して固定する**」アプローチへの反論。「実行中のモデルが、その場で必要なときだけ子を使う」アプローチ（[14](14_kimi_k2-5-agent-swarm.md)、[21](21_claude-code_docs.md)）とは別物である点に注意。
