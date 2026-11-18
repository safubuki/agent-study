# 全社（組織・エンタープライズ）層：Copilot の場合

| 置くもの | 置き場所 | 効く範囲 | 利用者が外せるか |
|---|---|---|---|
| 組織のカスタム指示（[organization-instructions.md](organization-instructions.md) の文章） | GitHub の Organization settings → Copilot → Custom instructions | **GitHub.com 上だけ**（Chat・cloud agent・code review）。VS Code・CLI では使われない | 外せない |
| 組織のカスタムエージェント（[.github-private/agents/](.github-private/agents/product-release-auditor.md)） | 組織の `.github-private`（または `.github`）リポジトリの `/agents/` | 組織メンバー全員（GitHub.com・IDE・CLI のエージェント選択） | 使うかは利用者が選ぶ |
| ポリシーフック（[policy-hooks/guard-secrets.json](policy-hooks/guard-secrets.json)） | 各 PC の `C:\ProgramData\GitHub\Copilot\policy.d\*.json`（Linux・macOS は `/etc/github-copilot/policy.d/`）。管理者権限で配布 | その PC のローカルセッション（cloud agent では使われない） | 外せない |
| 必須・禁止プラグイン | エンタープライズの管理設定（エンタープライズ チームごとの `enabledPlugins` も可） | 対応する画面（CLI・VS Code など） | 外せない |

- ポリシーフックの JSON は `.github/hooks/hooks.json` と同じ形式の例です。配布方法（MDM・グループポリシー）と対応画面は、導入前に GitHub の「Hooks reference」で確認してください。
- 全社の「絶対」を確実にするには、**リポジトリ側の `.github/hooks/`（cloud agent でも動く）**と、**GitHub のルールセット・必須ステータスチェック（CI）**を組み合わせるのが堅実です。
