# Claude Code 編 — 具体的な置き場所・設定・サンプル

共通の考え方（[00〜05](../README.md#ガイド一覧)）を Claude Code で実際に組むときの資料です。GitHub Copilot 版は [copilot/](../copilot/README.md) にあり、同じ形にそろえています。

| 資料 | 内容 |
|---|---|
| [01 Claude Code での組み方](01_claude-code-setup.md) | 置き場所の早見表、3 層の組み方、重なり方、説明文の競合を防ぐつまみ、強制、配布、利用ログと評価、見落としやすい点 |
| [samples/01-layered-rules](samples/01-layered-rules/README.md) | 製品リポジトリを 3 層で組んだ動くサンプル |
| [samples/02-skill-usage-log](samples/02-skill-usage-log/README.md) | スキル利用ログのフック設定 |

## 図（4 枚）

| 図 | 内容 |
|---|---|
| [cc-01](assets/cc-01-skill-in-a-session.svg) | 1 つの会話の中でのスキルの扱い（一覧・発火・本文・圧縮） |
| [cc-02](assets/cc-02-layer-matrix.svg) | 3 層 × 4 つの仕組み |
| [cc-03](assets/cc-03-how-layers-combine.svg) | 層が重なったときのルール |
| [cc-04](assets/cc-04-sample-product-repo.svg) | サンプルの構成と、読み込まれるもの |

> [!NOTE]
> サンプルには本物の `CLAUDE.md`・`.claude/` フォルダがあります。このリポジトリで Claude Code を使っているときにサンプル内のファイルを開くと、サンプルの指示やスキルが読み込まれることがあります（どれも「サンプル」と明記してあり、サンプルのフォルダ内だけに関する内容です）。気になる場合は、自分の設定の `claudeMdExcludes` に `**/agent-skill/claude/samples/**` を加えてください。
