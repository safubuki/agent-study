# 部署のスキルをプラグインで配る案

`product-repo/.claude/skills/` に部署のスキルを直接置く代わりに、部署ごとにプラグインを作って配る方法です。

| 項目 | 内容 |
|---|---|
| 名前の衝突 | プラグインのスキルは `/fw-team:review` のように名前空間つきになるので、部署どうしで同じ `review` を持てる |
| 誰に入れるか | 部署のリポジトリの `.claude/settings.json` で `extraKnownMarketplaces` と `enabledPlugins` を設定する。全社で必須にするなら管理設定に書く |
| 版の管理 | `plugin.json` の `version`。安定版・先行版はマーケットプレイスを 2 つに分けて出し分ける |

部署のリポジトリ側の設定例（`.claude/settings.json`）：

```json
{
  "extraKnownMarketplaces": {
    "example-corp-dept-tools": {
      "source": { "source": "github", "repo": "example-corp/dept-tools" }
    }
  },
  "enabledPlugins": {
    "fw-team@example-corp-dept-tools": true
  }
}
```

ローカルで試すとき：`claude plugin marketplace add ./dept-plugin-option` → `claude plugin install fw-team@example-corp-dept-tools`。
