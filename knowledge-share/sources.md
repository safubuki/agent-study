# sources.md — 出典一覧（knowledge-share）

`knowledge-share/` のガイド（`README.md`、`00`〜`03` 章、`interactive-guide.html`、SVG 図 9 枚）で根拠にした資料の一覧です。

- **確認日**：2026-11-28
- **方針**：公式ドキュメント・本人の記事・公式 README は、URL の本文で該当箇所を確かめてから使っています。
- **注意**：GitHub の上限や料金などの数字は変わることがあります。使う前に公式ページで最新の値を確認してください。

---

## 1. GitHub 公式ドキュメント・公式マニュアル

| # | 資料名・URL | 確認した内容 | 主な使用箇所 |
|---|---|---|---|
| **G1** | **GitHub Docs：REST API endpoints for repositories — Create a repository dispatch event**<br/>https://docs.github.com/en/rest/repos/repos | ・エンドポイントは `POST /repos/{owner}/{repo}/dispatches`。<br/>・Fine-grained PAT / GitHub App には `Contents` の書き込み権限が必要。<br/>・`event_type` は 100 文字以内。`client_payload` は最上位プロパティ最大 10 個、JSON 全体で 64 KB 未満。 | 02, 03, HTML, ks-03 |
| **G2** | **GitHub Docs：Events that trigger workflows**<br/>https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows | ・`repository_dispatch` や `issues` を起点にワークフローを動かせる。<br/>・`repository_dispatch` のワークフロー定義はデフォルトブランチに置く必要がある。 | 02, 03 |
| **G3** | **GitHub Docs：Control the concurrency of workflows and jobs**<br/>https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency | ・同じ concurrency group で実行中は 1 件まで。<br/>・既定の `queue: single` では待機も 1 件までで、新しい実行が来ると待機中の実行は取り消されて置き換わる。<br/>・`queue: max` で最大 100 件まで待機できる（待機を始めた順に処理。ただし順序は保証されない。上限を超えた分は取り消し）。<br/>・`queue: max` と `cancel-in-progress: true` は併用できない。 | 02, 03, HTML, ks-05 |
| **G4** | **GitHub Docs：Triggering a workflow from a workflow**<br/>https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow | ・標準の `GITHUB_TOKEN` で行った操作（`git push` など）は、無限ループを防ぐため、原則として新しいワークフローを起動しない（`workflow_dispatch`・`repository_dispatch` などは例外）。 | 02, HTML |
| **G5** | **GitHub Docs：REST API endpoints for issues — Create an issue**<br/>https://docs.github.com/en/rest/issues/issues | ・Fine-grained PAT / GitHub App で Issue を作るのに必要なのは `Issues` の書き込み権限（コードの書き込み権限は不要）。 | 02 |
| **G6** | **GitHub Docs：Creating an issue（Creating an issue from a URL query）**<br/>https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue | ・URL のクエリ（`title`・`body`・`labels`・`template` など）で Issue 作成画面を事前入力できる。Issue Form で定義した自由記述欄も URL で埋められる。<br/>・権限がない・URL が不正なら 404、長すぎる URL は `414 URI Too Long`。 | 02, 03, HTML, ks-03 |
| **G7** | **GitHub Docs：Syntax for GitHub's form schema**<br/>https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema | ・各要素の `id` が、URL で事前入力するときのキーになる。<br/>・`textarea` に `render` を指定すると、送信した内容が本文の中でコードブロックになる。 | 02, 03 |
| **G8** | **GitHub Docs：REST API endpoints for Git database（trees / commits / refs）**<br/>https://docs.github.com/en/rest/git/trees<br/>https://docs.github.com/en/rest/git/commits<br/>https://docs.github.com/en/rest/git/refs | ・ツリーを作るとき、各ファイルに `content`（中身の文字列）を渡すと GitHub がファイルを作る。`base_tree` を指定すると既存のファイルを残したまま足せる。<br/>・作ったツリーからコミットを作り、`main` の参照を更新する。参照の更新は `force` が既定で false で、他の人の作業を上書きしない。 | 02, 03 |
| **G9** | **GitHub Docs：Managing your personal access tokens**<br/>https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens | ・GitHub は Classic PAT より Fine-grained PAT を推奨。特定のリポジトリ・最小限の権限に絞れる。 | 02, 03 |
| **G10** | **GitHub Docs：About large files on GitHub**<br/>https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github | ・1 ファイル 50 MiB で警告、100 MiB で拒否。<br/>・リポジトリは 1 GB 未満が理想、5 GB 未満を強く推奨。 | 02, HTML, ks-05 |
| **G11** | **GitHub Docs：GitHub Actions billing**<br/>https://docs.github.com/en/billing/concepts/product-billing/github-actions | ・無料枠は分数ではなく金額（`included compute usage`）。GitHub Free / Free for organizations は月 $12 USD・Artifact 保存 500 MB、GitHub Team は月 $18 USD・2 GB。標準 Linux ランナーは $0.006/分。<br/>・パブリックリポジトリの標準ランナーは無料。 | 00 |
| **G12** | **GitHub CLI 公式マニュアル：`gh issue list`**<br/>https://cli.github.com/manual/gh_issue_list | ・`--json` で Issue の一覧を JSON で取り出せる（`--label` で絞り込み可）。 | 01 |
| **G13** | **GitHub Docs：Repository roles for an organization**<br/>https://docs.github.com/en/organizations/managing-user-access-to-your-organizations-repositories/managing-repository-roles/repository-roles-for-an-organization | ・ロールは Read／Triage／Moderate／Write／Maintain／Admin。どのロールでも読む（pull）ことができ、push できるのは Write 以上。書き込みだけのロールはない。 | 02, ks-08, ks-09 |

---

## 2. GitHub を軽量な蓄積先にする実例

| # | 資料名・URL | 確認した内容 | 主な使用箇所 |
|---|---|---|---|
| **E1** | **Simon Willison「Git scraping: track changes over time by scraping to a Git repository」（2020-10-09）**<br/>https://simonwillison.net/2020/Oct/9/git-scraping/ | ・データを定期的に取得して Git リポジトリにコミットし、コミット履歴で変化を追う手法。 | 00, HTML |
| **E2** | **Utterances 公式 README**<br/>https://raw.githubusercontent.com/utterance/utterances/master/README.md | ・コメントの保存先として GitHub Issues を使う OSS。 | 00, HTML |
| **E3** | **Giscus 公式 README**<br/>https://raw.githubusercontent.com/giscus/giscus/main/README.md | ・専用 DB なしで GitHub Discussions に保存する OSS（"No database needed. All data is stored in GitHub Discussions."）。 | 00, HTML |

---

## 3. 実行記録の分析・評価・スキル改善に関する資料

| # | 資料名・URL | 確認した内容 | 主な使用箇所 |
|---|---|---|---|
| **A1** | **Hamel Husain「A Field Guide to Rapidly Improving AI Products」（2025-03-24）**<br/>https://hamel.dev/blog/posts/field-guide/ | ・まず実データを見る。失敗ごとにメモを書き、失敗の種類を作って件数を数える（エラー分析）。<br/>・汎用ダッシュボードより、現場の人が見やすいシンプルな閲覧ツールを作る。 | 00, 03, HTML, ks-06 |
| **A2** | **Anthropic Engineering「Demystifying evals for AI agents」（2026-01-09）**<br/>https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents | ・評価のテストケース（task）は、数百件を待たず、実際の失敗から集めた 20〜50 件で始めるのがよい。<br/>・やり取りの記録（transcript）を読むことが大事。<br/>・採点はできるだけ決定的な方法（コードでの判定）を選び、必要なときに LLM による採点を使う。 | 00, 03, HTML, ks-06 |
| **A3** | **本リポジトリ [agent-skill/info/README.md](../agent-skill/info/README.md) で確認済みの資料**<br/>・Anthropic「How we use skills」（2026-06-03）<br/>・agentskills.io「Evaluating skill output quality」<br/>・SkillsBench（arXiv:2602.12670, 2026）<br/>・ACE（arXiv:2510.04618, 2025） | ・強いスキルの多くは、数行と 1 つの落とし穴（Gotchas）から育った（How we use skills）。<br/>・`evals/evals.json` で旧版と新版を比べる。毎回同じ補助スクリプトを書くなら `scripts/` に入れる（agentskills.io）。<br/>・人が整えたスキルは平均 +16.2 ポイント改善した。一方、課題を解く前に AI が自分で書いたスキル（実データなし）は、平均で効果がなかった（SkillsBench）。<br/>・全文の書き直しを繰り返すと細部が失われる（context collapse）。項目ごとに差分を足すほうがよい（ACE。なお ACE 自体は人手を介さない自動の仕組み）。 | 00, 03, HTML, ks-06 |

---

## 4. 本ガイドの「目安・設計提案」

次の項目は外部の統計や研究の結論ではなく、本ガイドが小規模チーム向けに提案する**運用の目安と設計**です。

- 1 実行 1 フォルダ（`run.json`・`steps.jsonl`・`notes.md`）の記録の形と、項目の例
- 基本の送り方を「アプリが GitHub API で直接書き込む（経路 A・clone 不要）」にする構成と、2 リポ構成をすすめること
- 「事実は全部、解釈は少し」（集計は事実だけで行い、失敗の分類は後から付ける）という方針
- スキルへの採用を人が PR で決める運用（研究から直接導かれる結論ではなく、小さいチームで責任と品質を保つための判断）
- 20〜50 件で傾向が見え始める、週 1 回 30 分、という目安
- テキストだけなら 1 件あたり数十 KB 程度、という容量の見積もり
- 立ち上げ初期の規模感（2〜3 人〜少数の試用メンバー）と、成長ステップ（Step A → B → C）
