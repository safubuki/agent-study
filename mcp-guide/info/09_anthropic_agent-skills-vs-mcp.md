# Anthropic「Equipping agents for the real world with Agent Skills」ほか（MCP・Skills・CLI の使い分け）

| 項目 | 内容 |
|---|---|
| 発行元 | Anthropic Engineering / Claude Code Docs |
| 公開日 | 2025-10-16（Agent Skills 発表記事）／ 2026-11-10（Claude Code Docs 取得） |
| 鮮度 | **中〜新** |
| URL | https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills ／ https://code.claude.com/docs/en/skills |

## 要点

- **なぜ MCP だけでなく Skills（スキル）が生まれたのか**：
  - MCP は「外部のサービスやデータに繋がるための**道具（配管・通信路）**」を提供する。
  - しかし現場の仕事では「新しい道具」が欲しいのではなく、「すでに持っている Bash やファイル編集を使って、**社内の決まった手順・作法・テンプレートどおりに作業してほしい（ノウハウ・手順書）**」という場面が非常に多い。
- **Skills の段階的開示（Progressive Disclosure）**：
  - スキルはフォルダに入った `SKILL.md` と補助スクリプト・テンプレートで構成される。
  - 普段は**名前と 1〜2 行の説明文（数十トークン）だけ**が AI に見えており、関係する依頼が来たときだけ AI が自分で `SKILL.md` の本文を読み、さらに必要なときだけ中のスクリプトを実行する。これによりコンテキストをほとんど消費しない。
- **MCP・Skills・CLI・Subagents・Hooks の役割分担**：
  | 仕組み | 一言でいうと | 向いている用途 |
  |---|---|---|
  | **CLI / Bash** | 既存のコマンドを叩く | `git`、`gh`、`npm`、ローカルの集計スクリプトなど、すでにコマンドがあり AI が使い方を知っているもの |
  | **Skills（スキル）** | 必要なときだけ開く**手順書＋スクリプト** | 社内固有のワークフロー、文章や設計書の書き方、既存コマンドを組み合わせる定型手順 |
  | **MCP** | 外部システムへの**標準化された窓口** | OAuth 認証が必要な SaaS（Jira / Notion / Slack）、DB への安全な読み取りゲートウェイ、ブラウザ等の状態を持つ操作 |
  | **Subagents** | 別室で動く**作業員** | 大量の調査や独立した作業を別コンテキストに隔離したいとき、特定の MCP 権限だけを閉じ込めたいとき |
  | **Hooks（フック）** | 特定のタイミングで**必ず動く自動処理** | AI の判断に任せず、ファイル保存時に必ずフォーマッタを走らせる・危険なコマンドをブロックする |

## 原文引用（短く）

> "While MCP connects Claude to external services and data, Agent Skills package procedural knowledge, instructions, and scripts that Claude loads progressively only when needed."

## 注意点

- 2025年前半までは「社内ルールや簡単なスクリプト実行まで全部 MCP サーバーとして自作する」例が多かったが、2026年現在は「**ローカルの手順やスクリプトなら Skills か CLI、外部接続や認証・権限の境界なら MCP**」と整理するのが主流になっている。
