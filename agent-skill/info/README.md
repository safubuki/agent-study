# 一次情報の出典メモ（agent-skill）

このガイドの根拠にした情報源です。**確かさ**は次の基準で付けています。個人ブログ・まとめ記事・SNS の要約は、根拠には使っていません（存在を確認しただけのものも含めて除外）。

| ラベル | 基準 |
|---|---|
| **A：公式** | 製品の提供元（Anthropic・GitHub・Microsoft）の公式ドキュメント・公式ブログ、標準仕様のサイト |
| **B：論文** | arXiv などで公開された研究（査読前を含む）。条件付きの結果として扱う |
| C：参考外 | 個人ブログ・まとめ記事。根拠に使っていない |

取得日はすべて **2026-11-18**。鮮度ラベル：**新**＝取得時点の最新版、**定番**＝公開から時間がたつが今も参照される基本資料。

---

## A：公式（Anthropic）

### A1. Anthropic Engineering「Equipping agents for the real world with Agent Skills」

| 項目 | 内容 |
|---|---|
| 発行 | 2025-10-16 ／ 鮮度：定番 |
| URL | https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills |
| 使った箇所 | 00 の 1 章（定義・段階的な読み込み・スクリプトの役割） |

- スキルは SKILL.md を中心にしたフォルダで、指示・スクリプト・資料を含められる。
- 段階的な読み込み（名前と説明 → SKILL.md → 付属ファイル）を「中心の設計原則」と呼ぶ。
- 並べ替えや PDF のフォーム項目抽出のような処理は、トークン生成より決定的なコードの方が向く。スクリプトは中身を文脈に読み込まずに実行できる。
- 今後の方向として、エージェントがスキルを作成・編集・評価できるようにすることを挙げている。

### A2. Claude Docs「Skill authoring best practices」

| 項目 | 内容 |
|---|---|
| URL | https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices |
| 鮮度 | 新 |
| 使った箇所 | 00 の 2・3 章（自由度、500 行、1 階層、三人称の説明文、スクリプトの利点、評価先行） |

- **自由度（degrees of freedom）**：高（文章）・中（疑似コードや引数つき）・低（決まったスクリプト）。崖に挟まれた細い橋と、見晴らしのよい野原のたとえ。
- 本文は 500 行以内、資料へのリンクは SKILL.md から 1 階層まで。説明文は三人称で「何をするか＋いつ使うか」。
- 用意済みスクリプトは「生成コードより確実・トークン節約・時間節約・一貫性」。実行するのか読むのかを明記する。
- 評価を先に作る（評価駆動）。Claude A（作る役）と Claude B（使う役）で反復する。

### A3. Claude Code Docs「Extend Claude with skills」

| 項目 | 内容 |
|---|---|
| URL | https://code.claude.com/docs/en/skills |
| 鮮度 | 新 |
| 使った箇所 | 00 の 5 章、01 の 3・4 章、02 の 2〜4 章 |

- 置き場所と優先順位：管理（enterprise）＞個人（`~/.claude/skills`）＞プロジェクト（`.claude/skills`）。入れ子のフォルダ、プラグイン（名前空間つき）もある。
- frontmatter：`disable-model-invocation`（手動専用・説明文も一覧に出ない）、`user-invocable`、`paths`（対象ファイルで自動発火を限定）、`context: fork`、`hooks` など。claude.ai と Skills API へのアップロードでは標準の欄以外はエラー。
- 一覧の説明文は 1 件 1,536 文字で切られ、一覧の予算は文脈の 1%。超えると使用頻度の低いスキルから説明文が落ちる。`skillOverrides`（`on`／`name-only`／`user-invocable-only`／`off`）。
- 本文は呼ばれた時点で会話に入り、ファイルを読み直さない。圧縮後は各スキル先頭 5,000 トークン（合計 25,000）を再添付。
- 「必ず守るべきルールはフックへ」。`/skill-doctor` で未使用スキルを発見。skill-creator プラグインと `claude plugin eval` で評価。

### A4. Claude Code Docs「How Claude remembers your project（Memory）」

| 項目 | 内容 |
|---|---|
| URL | https://code.claude.com/docs/en/memory |
| 鮮度 | 新 |
| 使った箇所 | 02 の 2・3 章 |

- CLAUDE.md の置き場所：管理ポリシー（Windows：`C:\Program Files\ClaudeCode\CLAUDE.md`）、ユーザー、プロジェクト、ローカル（`CLAUDE.local.md`）。全部が足し算でつながり、近いものほど後に読まれる。サブフォルダの CLAUDE.md は、そのフォルダのファイルを触ったときに読み込まれる。
- 「CLAUDE.md は強制される設定ではなく文脈」。1 ファイル 200 行以内が目安。矛盾する指示は AI が任意に選ぶことがある。
- `.claude/rules/*.md` は `paths` で対象ファイルを限定できる。管理 CLAUDE.md は行動の指針、技術的な強制は管理設定（`permissions.deny` など）で。
- AGENTS.md は CLAUDE.md が無いときに読まれる。両方使うなら CLAUDE.md に `@AGENTS.md` と書いて取り込む。

### A5. Claude Code Docs「Extend Claude Code」

| 項目 | 内容 |
|---|---|
| URL | https://code.claude.com/docs/en/features-overview |
| 鮮度 | 新 |
| 使った箇所 | 00 の 1 章、02 の 3・5 章 |

- CLAUDE.md・スキル・サブエージェント・フック・MCP・プラグインの使い分け表。フックは決定的、スキルは「Claude が解釈するので結果が変わりうる」。
- 重なり方：CLAUDE.md は足し算、スキルとサブエージェントは名前で上書き、MCP は「ローカル＞プロジェクト＞ユーザー」、フックは全部動く、プラグインは名前空間。
- 追加の目安：同じ間違い 2 回 → CLAUDE.md、同じ手順を 3 回貼った → スキル、毎回自動 → フック、別リポジトリにも → プラグイン。
- サブエージェントは `skills:` 欄でスキルを事前読み込みできる。

### A6. Claude Code Docs「Create a marketplace」「Manage Claude Code plugins for your organization」

| 項目 | 内容 |
|---|---|
| URL | https://code.claude.com/docs/en/plugin-marketplaces ／ https://code.claude.com/docs/en/plugins/org |
| 鮮度 | 新 |
| 使った箇所 | 01 の 4 章、02 の 2 章、サンプル 01 |

- `.claude-plugin/marketplace.json` を Git に置くとマーケットプレイスになる（非公開可）。
- 管理設定の `extraKnownMarketplaces`＋`enabledPlugins` で全社必須化（利用者は外せない）。リポジトリの `.claude/settings.json` に書くとそのリポジトリの参加者向け。
- `strictKnownMarketplaces`（許可リスト）・`blockedMarketplaces`・`disableSideloadFlags`・`strictPluginOnlyCustomization`。安定版／先行版の release channels。
- 監査：OpenTelemetry の `claude_code.plugin_installed`／`plugin_loaded`、Enterprise の Analytics API。

### A7. Claude Blog「Lessons from building Claude Code: How we use skills」

| 項目 | 内容 |
|---|---|
| 発行 | 2026-06-03（Thariq Shihipar, Anthropic） ／ 鮮度：新 |
| URL | https://claude.com/blog/lessons-from-building-claude-code-how-we-use-skills |
| 使った箇所 | 00 の 2 章、01 の 1・2・4 章 |

- 社内で数百のスキルが使われ、9 つの型に分かれる。良いスキルは 1 つの型にきれいに収まる。製品の動作検証スキルが品質への効果が最も大きかった。
- 書き方：分かりきったことは書かない／**落とし穴（Gotchas）の節が最も情報密度が高い**／フォルダで段階的に見せる／手順を縛りすぎない／設定は `config.json` に保存／ログ・JSON・SQLite で記憶させる／スキル専用の一時フック（`/careful`・`/freeze`）。
- 配布：少数なら `.claude/skills` にコミット、規模が大きければ社内マーケットプレイス。**中央の審査チームはなく**、試験用フォルダで共有 → 使われ始めたら PR でマーケットへ。
- 測定：`PreToolUse` フックで利用を記録し、人気と「発火不足」を見つける。多くの強いスキルは数行と 1 つの落とし穴から始まった。

### A8. Claude Blog「Improving skill-creator: Test, measure, and refine Agent Skills」

| 項目 | 内容 |
|---|---|
| URL | https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills |
| 鮮度 | 新 |
| 使った箇所 | 01 の 3 章 |

- skill-creator が評価の作成・ベンチマーク・並列実行（まっさらな文脈）・説明文の発火調整を支援。モデルが変わってもスキルが働き続けるかを確かめられる。
- 能力を足すスキル（capability uplift）と、チームの手順を符号化するスキル（encoded preference）を区別。
- 文書作成系の公開スキル 6 つのうち 5 つで発火が改善した（同ブログの各言語版の記述）。

### A9. Claude Blog「Organization skills and directory」

| 項目 | 内容 |
|---|---|
| 発行 | 2025-12-18 ／ 鮮度：定番 |
| URL | https://claude.com/blog/organization-skills-and-directory |
| 使った箇所 | 01 の 4 章 |

- Team / Enterprise の管理者がスキルを組織に配布できる。既定で全員に有効、各自が個別にオフにできる。パートナー製スキルのディレクトリ。
- Agent Skills をオープン標準として agentskills.io で公開。

### A10. Claude Blog「Steering Claude Code: when to use CLAUDE.md, skills, hooks, and subagents」

| 項目 | 内容 |
|---|---|
| 発行 | 2026-06-18 ／ 鮮度：新 |
| URL | https://claude.com/blog/steering-claude-code-skills-hooks-rules-subagents-and-more |
| 使った箇所 | 02 の 1・7 章 |

- CLAUDE.md は「ほとんどの場合は従う」が、長い会話や圧力のもとでは漏れる。フックは決定的に起動する。管理設定は利用者が上書きできず、組織全体の決定的なガードレールを作る唯一の方法。
- 出力スタイルは指示の効きが最も強い部類なので、慎重に使う。追記した指示は数が増え、矛盾するほど守られにくくなる。

### A11. agentskills.io（Agent Skills 標準）「Evaluating skill output quality」

| 項目 | 内容 |
|---|---|
| URL | https://agentskills.io/skill-creation/evaluating-skills |
| 鮮度 | 新 |
| 使った箇所 | 00 の 4 章、01 の 3 章、サンプル 02 |

- `evals/evals.json`（prompt・expected_output・files・assertions）、`with_skill/`・`without_skill/`（改善時は `old_skill/`）、`grading.json`・`timing.json`・`benchmark.json`・`feedback.json`、`iteration-N/`。
- 改善の指針：一般化する／簡潔に保つ（増やしても伸びないなら減らす）／理由を書く／**毎回同じ補助スクリプトを書いていたら scripts/ に同梱**。

## A：公式（GitHub・Microsoft）・標準

### A12. GitHub Docs「About agent skills」「Response customization」

| 項目 | 内容 |
|---|---|
| URL | https://docs.github.com/en/copilot/concepts/agents/about-agent-skills ／ https://docs.github.com/en/copilot/concepts/prompting/response-customization |
| 鮮度 | 新 |
| 使った箇所 | 01 の 4 章、02 の 3・6 章 |

- Copilot のスキルの置き場所：プロジェクトは `.github/skills`・`.claude/skills`・`.agents/skills`、個人は `~/.copilot/skills`・`~/.agents/skills`。
- カスタム指示：個人、リポジトリ全体（`.github/copilot-instructions.md`）、パス別（`.github/instructions/*.instructions.md`）、エージェント指示（AGENTS.md など）、組織（Business / Enterprise）。
- GitHub.com の優先順位は「個人 ＞ リポジトリ（パス別 ＞ 全体 ＞ エージェント指示）＞ 組織」。VS Code や CLI は順位を決めずに結合し、矛盾を避けるよう勧めている。

### A13. VS Code Docs「Customize AI in Visual Studio Code」

| 項目 | 内容 |
|---|---|
| URL | https://code.visualstudio.com/docs/copilot/customization/overview |
| 鮮度 | 新 |
| 使った箇所 | 02 の 6 章 |

- 常時の指示（copilot-instructions.md・AGENTS.md・CLAUDE.md）、ファイル単位の指示（`*.instructions.md`）、プロンプトファイル、カスタムエージェント（`*.agent.md`）、スキル、フック、MCP、プラグイン。

### A14. agents.md（AGENTS.md の公式サイト）

| 項目 | 内容 |
|---|---|
| URL | https://agents.md/ |
| 鮮度 | 新 |
| 使った箇所 | 02 の 3 章 |

- 「エージェント向けの README」。入れ子では**編集中のファイルに最も近い AGENTS.md が優先**、チャットでの明示的な指示はすべてに優先。
- Linux Foundation 傘下の Agentic AI Foundation が管理。6 万以上のオープンソースプロジェクトで使われている。

## A：公式（GitHub Copilot の詳細・変更履歴・OpenAI・Box）

追加依頼（Copilot 編・制約と年表・大容量データ）のために 2026-11-18 に確認したものです。

### A15. VS Code Docs「Use Agent Skills」「Custom instructions」「Custom agents」

| 項目 | 内容 |
|---|---|
| URL | https://code.visualstudio.com/docs/copilot/customization/agent-skills ／ …/custom-instructions ／ …/custom-agents |
| 鮮度 | 新 |
| 使った箇所 | 00 の 1 章、copilot/01 の 1・3・4・8 章 |

- Copilot ハーネスのスキルの置き場所：プロジェクト `.github/skills/`、個人 `~/.copilot/skills/`（旧 Local ハーネスは `.claude/skills/` なども読む。Local は非推奨で 2027-02 削除予定）。`chat.agentSkillsLocations` は非推奨で Local 専用。
- SKILL.md の欄：`name`（必須・64 文字・**フォルダ名と一致**）、`description`（必須・1,024 文字）、`argument-hint`、`user-invocable`、`disable-model-invocation`、`context: fork`（実験的）。プラグインのスキルは `/プラグイン名:スキル名`。
- 指示ファイル：`.github/copilot-instructions.md`・`AGENTS.md`、パス別 `.github/instructions/*.instructions.md`（`applyTo`）。「どれが勝つかの共通の順位に頼らない」。
- カスタムエージェント：`.github/agents/*.agent.md`（`name`・`description`・`tools`・`user-invocable`・`disable-model-invocation` など）。スキルを事前読み込みする欄は記載なし。

### A16. GitHub Docs「Copilot customization cheat sheet」「Support for different types of custom instructions」

| 項目 | 内容 |
|---|---|
| URL | https://docs.github.com/en/copilot/reference/customization-cheat-sheet ／ https://docs.github.com/en/copilot/reference/custom-instructions-support |
| 鮮度 | 新 |
| 使った箇所 | 04 の 2・3 章、copilot/01 の 1・3 章（図 cp-03） |

- 種類ごとの置き場所と使いどころ：常時の指示＝広い基準、プロンプトファイル＝単発、カスタムエージェント＝役割、スキル＝資料つきの複数手順、フック＝必ず行う動作、MCP＝外部接続。
- 組織のエージェント：組織の `.github`／`.github-private` リポジトリの `/agents/`。エンタープライズは指定した `.github-private` の `/agents/`。
- 指示の対応表：組織の指示は GitHub.com（Chat・cloud agent・code review）だけ。パス別は VS Code の code review では使われない。AGENTS.md は Visual Studio に記載なし。フックは VS Code でプレビュー。

### A17. GitHub Docs「Hooks reference」「Copilot CLI configuration directory」「CLI plugin reference」「About plugins」

| 項目 | 内容 |
|---|---|
| URL | https://docs.github.com/en/copilot/reference/hooks-reference ／ …/copilot-cli-reference/cli-config-dir-reference ／ …/cli-plugin-reference ／ https://docs.github.com/en/enterprise-cloud@latest/copilot/concepts/agents/about-plugins |
| 鮮度 | 新 |
| 使った箇所 | copilot/01 の 3・5・6・7 章、copilot のサンプル |

- フックの置き場所：リポジトリ `.github/hooks/*.json`、個人 `~/.copilot/hooks/`、プラグイン、エージェントの frontmatter（CLI）。**ポリシーフック**は管理者が各 PC の `C:\ProgramData\GitHub\Copilot\policy.d\*.json`（Linux・macOS は `/etc/github-copilot/policy.d/`）に置く。**cloud agent が読むのは `.github/hooks` だけ**。
- ツール名の一覧（`bash`・`create`・`edit`・`view` など）に**スキル専用の名前は無い**。
- CLI の個人設定：`~/.copilot/copilot-instructions.md`・`~/.copilot/instructions/`・`~/.copilot/skills/`・`~/.copilot/agents/`。リポジトリ設定 `.github/copilot/settings.json`（`settings.local.json` は Git に入れない）。
- プラグイン：ルートの `plugin.json`、マーケットは `.github/plugin/marketplace.json`（`.claude-plugin/marketplace.json` も読める）。**同名スキルは「プロジェクト ＞ 個人 ＞ プラグイン」**（プラグインは上書きできない）。エンタープライズの管理設定で必須・禁止、エンタープライズ チームごとに `enabledPlugins` を追加、リポジトリ既定は `.github/copilot/settings.json`。

### A18. GitHub Docs「Add organization custom instructions」・custom agents（組織・エンタープライズ）

| 項目 | 内容 |
|---|---|
| URL | https://docs.github.com/en/copilot/how-tos/configure-custom-instructions/add-organization-instructions ほか |
| 鮮度 | 新 |
| 使った箇所 | copilot/01 の 1・2 章、copilot のサンプル（org-managed） |

- 組織の指示は Organization settings → Copilot → Custom instructions で設定。**ローカルのクライアントのセッションでは使われない**。
- 組織のエージェントは `.github-private` リポジトリで試験（`.github/agents`）→ `/agents` へ移して公開、という手順。

### A19. GitHub Changelog（Copilot の変更履歴）

| 日付 | 内容 |
|---|---|
| 2025-07-23 | cloud agent が `.instructions.md` に対応 |
| 2025-08-06 | code review の `copilot-instructions.md` 対応が正式版 |
| 2025-08-28 | cloud agent が AGENTS.md（入れ子も）に対応 |
| 2025-09-03 | code review がパス別の指示ファイルに対応 |
| 2025-09-25 | Copilot CLI がプレビュー |
| 2025-10-28 | カスタムエージェント |
| 2025-11-05 | cloud agent が組織の指示に対応 |
| 2025-12-18 | Copilot が Agent Skills に対応（`.claude/skills` も自動で読む） |
| 2026-02-25 | Copilot CLI 正式版（フックを含む） |
| 2026-03-06 | VS Code 1.110（フック） |
| 2026-04-16 | `gh skill` コマンド |
| 2026-05-06 | エンタープライズ管理のプラグイン（CLI、プレビュー） |
| 2026-06-02 | code review でスキル（プレビュー） |
| **2026-06-12** | **code review が指示ファイルを 4,000 文字で打ち切る制限を撤廃** |
| 2026-06-18 | code review が AGENTS.md に対応 |
| 2026-07-29 | code review でスキル・MCP が正式版 |

- URL の例：https://github.blog/changelog/2026-06-12-copilot-code-review-new-configurations-and-controls/ 。使った箇所：04 の 1・2 章（図 tl-01・tl-02）。
- 注意：4,000 文字の打ち切りを前提に「短くせよ」と書いた GitHub ブログの古い記事も残っている。日付を見て読む。

### A20. OpenAI Codex Docs「Custom instructions with AGENTS.md」

| 項目 | 内容 |
|---|---|
| URL | https://developers.openai.com/codex/guides/agents-md |
| 鮮度 | 新 |
| 使った箇所 | 04 の 2 章 |

- Codex は AGENTS.md を合計 `project_doc_max_bytes`（**既定 32 KiB**）まで読み、超えた分は加えない。上限を上げるか、入れ子のフォルダに分ける。

### A21. GitHub Docs「About large files on GitHub」

| 項目 | 内容 |
|---|---|
| URL | https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github |
| 鮮度 | 定番 |
| 使った箇所 | 05 の 1 章（図 lf-01） |

- 50 MiB で警告、**100 MiB で拒否**（超えるなら Git LFS）。ブラウザからは 25 MiB まで。リポジトリは 1 GB 未満が理想、5 GB 未満を強く推奨。大きなバイナリはリリースで配る方法も。

### A22. Box Developer Docs「Box MCP server」

| 項目 | 内容 |
|---|---|
| URL | https://developer.box.com/guides/box-mcp |
| 鮮度 | 新 |
| 使った箇所 | 05 の 3 章（図 lf-02） |

- 公式のリモート MCP サーバー（`https://mcp.box.com`）が推奨。自前でホストする旧版は非推奨。管理者が Admin Console で有効化。**ログインした利用者が見られるファイルだけ**に届く。端末向けには Box CLI もある。

### A23. GitHub Docs「Customizing the development environment for Copilot cloud agent」

| 項目 | 内容 |
|---|---|
| URL | https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/customize-the-agent-environment |
| 鮮度 | 新 |
| 使った箇所 | 05 の 3 章 |

- `.github/workflows/copilot-setup-steps.yml`（ジョブ名は `copilot-setup-steps`）で事前準備。cloud agent にはファイアウォールがあり、外部への通信は許可の設定が要る。シークレットは Copilot cloud agent 用に設定する。

## B：論文

### B1. SkillsBench: Benchmarking How Well Agent Skills Work Across Diverse Tasks

| 項目 | 内容 |
|---|---|
| 発行 | arXiv:2602.12670（2026） ／ 鮮度：新 |
| URL | https://arxiv.org/abs/2602.12670 |
| 使った箇所 | 01 の 5 章 |

- 課題ごとに「スキルなし／人が整えたスキル／AI が自分で書いたスキル」を比較（7 つのエージェント・モデル構成、7,308 試行）。
- 人が整えたスキル：平均 +16.2 ポイント（ソフトウェア開発 +4.5 〜 医療 +51.9）。84 課題中 16 課題で逆効果。
- **AI が自分で書いたスキルは平均で効果なし**（使う力と、書く力は別）。焦点を絞った 2〜3 部品のスキルが網羅的な文書より良く、小さいモデル＋スキルが大きいモデル（スキルなし）に並ぶ場合がある。
- 注意：課題数は版・箇所により 84／86 の表記がある。本ガイドは本文の集計（84）に合わせた。

### B2. Agentic Context Engineering: Evolving Contexts for Self-Improving Language Models（ACE）

| 項目 | 内容 |
|---|---|
| 発行 | arXiv:2510.04618（v1 2025-10、v3 2026-03） ／ 鮮度：新 |
| URL | https://arxiv.org/abs/2510.04618 |
| 使った箇所 | 01 の 5 章 |

- 文脈を「育つ手引き書（playbook）」として扱い、生成・振り返り・整理（curation）を分けて項目単位で差分を足す。
- 丸ごと書き直す方式の問題として、**短さへの偏り（brevity bias）**と、繰り返しの書き直しで細部が失われる **context collapse** を指摘。

### B3. Voyager: An Open-Ended Embodied Agent with Large Language Models

| 項目 | 内容 |
|---|---|
| 発行 | arXiv:2305.16291（2023） ／ 鮮度：定番 |
| URL | https://arxiv.org/abs/2305.16291 |
| 使った箇所 | 01 の 5 章 |

- 「複雑な行動を保存・検索するための、増え続ける実行可能コードのスキル図書館」。環境からの反応・実行エラー・自己検証でプログラムを改善してから追加する。

## このリポジトリ内の資料

- [agent-guide の実測レポート](../../agent-guide/output/report_01-profile.md)：統合工程をスクリプトにした効果（129 秒 → 1.1 秒、作成コストの回収）。00 の 3 章で引用。
- `C:\git_home\turtle-skills-neo\full-skills\.github\skills\scripted-skill-generator`（リポジトリ外）：00 の 4 章の題材。SKILL.md・references・assets・scripts を読んで図にした。
