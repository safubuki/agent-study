# Philipp Schmid「The importance of Agent Harness in 2026」

| 項目 | 内容 |
|---|---|
| 種別 | 著名エンジニアのブログ（著者は Google DeepMind の Developer Relations、元 Hugging Face。広く共有された記事） |
| 公開日 | 2026-01-05 |
| 鮮度 | **中**（約10か月前） |
| URL | https://www.philschmid.de/agent-harness-2026 |

## 要点

- **ハーネス**＝モデルの周りの仕組み（文脈の管理、プロンプト、フック、ツール処理など）。OS がアプリを支えるような役割。
- 苦い教訓（[08](08_lance-martin_bitter-lesson.md)）をエージェントに当てはめると、かつて複雑なパイプラインが必要だった処理が、今は1つのプロンプトで済む。
- **Build to Delete（消すために作れ）**：構成をモジュール化し、新しいモデルが来たら昨日書いた「賢いロジック」を引き抜けるようにしておく。制御フローを作り込みすぎると、次のモデル更新で壊れる。
- 引用している実例：
  - Manus は6か月で5回ハーネスを作り直し、硬直した前提を取り除いた。
  - LangChain は Open Deep Research を1年で3回作り直した。
  - Vercel はエージェントのツールを **80% 削除**し、手順数・トークン・応答時間が減った。
- 推奨：(1) 小さく確かなツールで始め、計画はモデルに任せ、ガードレール・再試行・検証を足す、(2) 消せるように作る、(3) ハーネスが記録する行動ログが資産になる。

## 原文引用（短く）

> "If you over-engineer the control flow, the next model update will break your system."

> "Build to Delete: Make your architecture modular. New models will replace your logic."

## 注意点

- Manus・Vercel の実例は本人の一次記録ではなく、この記事による紹介。
