# 部署のスキルをプラグインで配る案（Copilot）

部署ごとにプラグインを作り、社内のマーケットプレイス（Git リポジトリ）から配る方法です。

| 項目 | 内容 |
|---|---|
| マーケットプレイスの目録 | `.github/plugin/marketplace.json`（Copilot CLI は `.claude-plugin/marketplace.json` も読める） |
| プラグインの目録 | プラグインのルートの `plugin.json`（Agent Plugins 1.0 形式は `$schema` を書く）。スキルは `skills/<名前>/SKILL.md`、エージェントとフックは `com.github.copilot/agents/`・`com.github.copilot/hooks/hooks.json` |
| 入れ方（個人） | `copilot plugin marketplace add example-corp/dept-tools` → `copilot plugin install fw-team@example-corp-dept-tools`。VS Code は Chat の **Customize** から |
| 入れ方（リポジトリの既定） | `.github/copilot/settings.json` の `enabledPlugins`（利用者は外せる） |
| 入れ方（部署に必須） | エンタープライズの管理設定。**エンタープライズ チームごと**に `enabledPlugins` を足せる（利用者は外せない） |
| 名前の衝突 | VS Code ではプラグイン名が前に付く（`/fw-team:review`）。CLI は `name` で重複排除し、プロジェクト・個人が優先 |

ローカルで試すとき：`copilot plugin install ./plugins/fw-team` → `/skills list` で読み込まれたか確認。

> [!NOTE]
> `enabledPlugins` の JSON の書き方は、公式リファレンス（GitHub Copilot CLI plugin reference / managed settings）で最新を確認してください。このサンプルではリポジトリ設定ファイル自体は置いていません。
