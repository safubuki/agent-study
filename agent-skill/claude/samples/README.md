# Claude Code 編のサンプル

| サンプル | 内容 | 解説 |
|---|---|---|
| [01-layered-rules/](01-layered-rules/README.md) | 製品リポジトリを「ベース（全社・製品）・部署・個人」の 3 層で組んだ例 | [01 の 2〜5 章](../01_claude-code-setup.md#2-3-層の組み方) |
| [02-skill-usage-log/](02-skill-usage-log/README.md) | スキル利用ログのフック設定 | [01 の 7 章](../01_claude-code-setup.md#7-利用ログと評価) |

Claude Code・Copilot 共通の道具（棚卸し・利用ログのスクリプト・大容量データの目録）は [shared/](../../shared/README.md) にあります。

動作確認（Node.js だけで数秒）：`node agent-skill/scripts/test-samples.js`
