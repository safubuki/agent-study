# GitHub Copilot 編のサンプル

| サンプル | 内容 | 解説 |
|---|---|---|
| [01-layered-rules/](01-layered-rules/README.md) | 製品リポジトリを「ベース（全社・製品）・部署・個人」の 3 層で組んだ例 | [01 の 2〜5 章](../01_copilot-setup.md#2-3-層の組み方) |
| [02-skill-usage-log/](02-skill-usage-log/README.md) | スキル利用ログのフック設定 | [01 の 7 章](../01_copilot-setup.md#7-利用ログと評価) |
| [03-ai-workspace/](03-ai-workspace/README.md) | 事例 1：全社 AI ワークスペース（全社 → 部署 → 係の 3 階層） | [02 の 2 章](../02_layered-examples.md#2-事例-1全社-ai-ワークスペース絶対ルール--部署--係) |
| [04-product-lines/](04-product-lines/README.md) | 事例 2：製品づくり（製品共通 → カテゴリ → 顧客の 3 階層、設定値も階層で重ねる） | [02 の 3 章](../02_layered-examples.md#3-事例-2製品づくり絶対の作り方--製品カテゴリ--顧客) |
| [05-composite-workspace/](05-composite-workspace/README.md) | 事例 3：複合（ドメイン × 部品の 2 軸 → 交わりの係 → 案件。案件は手動で読み込む） | [02 の 4 章](../02_layered-examples.md#4-事例-3事例-1-と-2-が組み合わさる場合組織ドメイン--部品--係--案件) |

Claude Code・Copilot 共通の道具（棚卸し・利用ログのスクリプト・大容量データの目録）は [shared/](../../shared/README.md) にあります。

動作確認（Node.js だけで数秒）：`node agent-skill/scripts/test-samples.js`
