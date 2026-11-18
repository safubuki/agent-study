# GitHub Copilot 編 — 具体的な置き場所・設定・サンプル

共通の考え方（[00〜05](../README.md#ガイド一覧)）を GitHub Copilot（VS Code・Copilot CLI・GitHub 上の cloud agent・code review）で実際に組むときの資料です。Claude Code 版は [claude/](../claude/README.md) にあり、同じ形にそろえています。

| 資料 | 内容 |
|---|---|
| [01 GitHub Copilot での組み方](01_copilot-setup.md) | 置き場所の早見表、3 層の組み方、重なり方と画面ごとの違い、説明文の競合を防ぐつまみ、強制（フック・GitHub の関所）、配布、利用ログと評価、見落としやすい点 |
| [samples/01-layered-rules](samples/01-layered-rules/README.md) | 製品リポジトリを 3 層で組んだ動くサンプル（GitHub の組織設定・各 PC のポリシーも含む） |
| [02 階層の組み方の事例 3 つ](02_layered-examples.md) | **絶対ルール → 部署・カテゴリ → 係・顧客**の 3 階層を、全社 AI ワークスペース・製品づくり・その複合（ドメイン × 部品 → 係 → 案件）の 3 事例で。各階層のファイルへのリンク・ファイル構成図つき |
| [samples/02-skill-usage-log](samples/02-skill-usage-log/README.md) | スキル利用ログのフック設定 |
| [samples/03-ai-workspace](samples/03-ai-workspace/README.md) | 事例 1：全社 AI ワークスペース（全社 → 営業部・品質保証部 → 海外営業係・検査係） |
| [samples/04-product-lines](samples/04-product-lines/README.md) | 事例 2：製品づくり（製品共通 → 家庭用・産業用 → ACME 社・Borealis 社） |
| [samples/05-composite-workspace](samples/05-composite-workspace/README.md) | 事例 3：複合（全体 → 組織ドメイン × 部品 → 交わりの係 → 案件） |
| [tools/which-rules.js](tools/which-rules.js) | 「このファイルを編集すると、どの階層のどのルールが使われるか」を一覧にする道具 |

関連：[04 指示ファイルの制約と年表](../04_instruction-limits-and-timeline.md)、[05 大容量データは Git の外に置く](../05_large-files-outside-git.md)。

## 図（19 枚）

| 図 | 内容 |
|---|---|
| [cp-01](assets/cp-01-layer-matrix.svg) | 3 層 × 4 つの仕組み |
| [cp-02](assets/cp-02-how-layers-combine.svg) | 層が重なったときのルール（指示・スキル・フック・エージェント） |
| [cp-03](assets/cp-03-where-it-works.svg) | どの画面で、どの仕組みが使われるか |
| [cp-04](assets/cp-04-sample-product-repo.svg) | サンプルの構成と、使われるもの |
| [cp-05](assets/cp-05-github-governance.svg) | GitHub で仕組みを守る関所（CODEOWNERS・必須チェック・ルールセット・フック） |
| [cp-06](assets/cp-06-three-level-principles.svg) | 階層を組む 5 つの原則 |
| [cp-07](assets/cp-07-case1-ai-workspace.svg) | 事例 1：全社 AI ワークスペース |
| [cp-08](assets/cp-08-case2-product-lines.svg) | 事例 2：製品づくり（値がどの階層で決まったか） |
| [cp-09](assets/cp-09-growing-levels.svg) | 1 階層 → 2 階層 → 3 階層と育てる |
| [cp-10](assets/cp-10-layered-enforcement.svg) | 階層つきの強制（1 つのフックが全階層を読む） |
| [cp-11](assets/cp-11-case1-file-map.svg)・[cp-12](assets/cp-12-case1-layer-mechanisms.svg) | 事例 1：ファイル構成図・階層 × 仕組み |
| [cp-13](assets/cp-13-case2-file-map.svg)・[cp-14](assets/cp-14-case2-layer-mechanisms.svg) | 事例 2：ファイル構成図・階層 × 仕組み |
| [cp-15](assets/cp-15-case3-two-axes.svg) | 事例 3：ドメイン × 部品の 2 軸に、係と案件が重なる |
| [cp-16](assets/cp-16-case3-who-decides.svg) | 事例 3：軸ごとに決めてよいこと・場所で表せない軸 |
| [cp-17](assets/cp-17-case3-applied-stack.svg) | 事例 3：案件中に回路図を編集したときの 5 層と値の決まり方 |
| [cp-18](assets/cp-18-case3-file-map.svg)・[cp-19](assets/cp-19-case3-layer-mechanisms.svg) | 事例 3：ファイル構成図・階層 × 仕組み |
