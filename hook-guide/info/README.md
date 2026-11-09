# info — フック（Hooks）と決定論的ガードレールの調査メモ

[docs/02_hook-patterns.md](../docs/02_hook-patterns.md) を書くために集めた一次情報のメモ置き場です。
1ファイル＝1出典。各ファイルに「いつの情報か」「誰が書いたか」「要点」「短い原文引用」「注意点」を書いています。

- 調査日：**2026-11-1 **Web 検索と公式ドキュメントの取得により収集）
- 選んだ基準：AI 企業・開発ツール提供元の公式ドキュメント（Anthropic / GitHub / Microsoft VS Code）、公式エンジニアリングブログ、査読付き論文。

## 鮮度ラベル

AI エージェントの周辺機能（ハーネス）は1年で大きく変わるため、各出典に鮮度を付けています（2026-11-10 基準）。

| ラベル | 公開時期 | 読み方 |
|---|---|---|
| **新** | 6か月以内（2026-05 以降） | そのまま参考にしてよい |
| **中** | 6〜12か月前（2025-11〜2026-04） | 考え方は有効。数値やモデル名は1〜2世代前 |
| **古** | 12か月超（〜2025-10） | 原則は今も引用されるが、当時のモデルの弱点を補う工夫が混ざっている前提で読む |

## 出典一覧

| # | ファイル | 出典 | 種別 | 公開日 / 取得日 | 鮮度 |
|---|---|---|---|---|---|
| 01 | [01_claude-code_hooks-reference.md](01_claude-code_hooks-reference.md) | Claude Code Docs「Hooks reference」 | 公式ドキュメント | 取得 2026-11-10 | 新 |
| 02 | [02_claude-code_hooks-guide.md](02_claude-code_hooks-guide.md) | Claude Code Docs「Automate workflows with hooks」 | 公式ドキュメント | 取得 2026-11-10 | 新 |
| 03 | [03_claude-code_best-practices.md](03_claude-code_best-practices.md) | Claude Code Docs「Best practices」 | 公式ドキュメント | 取得 2026-11-10 | 新 |
| 04 | [04_claude-code_settings-permissions.md](04_claude-code_settings-permissions.md) | Claude Code Docs「Settings & Permissions」 | 公式ドキュメント | 取得 2026-11-10 | 新 |
| 05 | [05_github_copilot-hooks.md](05_github_copilot-hooks.md) | GitHub Docs「Hooks in GitHub Copilot (.github/hooks)」 | 公式ドキュメント | 取得 2026-11-10 | 新 |
| 06 | [06_vscode_agent-hooks.md](06_vscode_agent-hooks.md) | VS Code Docs「Agent hooks in Visual Studio Code」 | 公式ドキュメント | 取得 2026-11-10 | 新 |
| 07 | [07_anthropic_building-effective-agents.md](07_anthropic_building-effective-agents.md) | Anthropic「Building effective agents」 | 公式ブログ | 2024-12-19 | 古 |
| 08 | [08_anthropic_claude-code-best-practices-blog.md](08_anthropic_claude-code-best-practices-blog.md) | Anthropic「Claude Code: Best practices for agentic coding」 | 公式ブログ | 2025-04-18 | 古 |
| 09 | [09_anthropic_harness-design.md](09_anthropic_harness-design.md) | Anthropic「Harness design for long-running apps」 | 公式ブログ | 2026-03-24 | 中 |
| 10 | [10_mast_why-multi-agent-systems-fail.md](10_mast_why-multi-agent-systems-fail.md) | Cemri ほか「Why Do Multi-Agent LLM Systems Fail?」（MAST） | 論文（NeurIPS 2025 D&B） | 2025-03（v3: 2025-10） | 古 |

## 出典どうしの関係（読み方のヒント）

- **Claude Code のフック仕様と実践パターン**：01（リファレンス）がイベント一覧・入出力 JSON・終了コードの正確な仕様を定め、02（ガイド）が保護ファイルガード・自動整形・完了ゲートなどの定番レシピを示している。
- ****：03（Best practices）と 04（Permissions）が「プロンプトで大文字強調するのをやめ、曲げられない規則はフックや拒否設定（deny）で強制せよ」という設計思想を明確にしている。
- **他ツールへの広がり**：05（GitHub Copilot）と 06（VS Code）が、`.github/hooks/*.json` や `preToolUse` / `postToolUse` など Claude Code とほぼ同じ概念・イベント名でフック機能を導入していることを示す。
- **AI の進化とハーネス（外側の仕組み）の引き算**：07・08・09・10 が、エージェントの失敗原因（検証不足・終了条件の誤り）と、モデルが賢くなるにつれて「何をコード（フック）に残し、何をモデルに任せるべきか」の境界線の変化を裏付けている。
