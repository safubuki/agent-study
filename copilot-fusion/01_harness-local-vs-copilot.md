# Local と Copilot ハーネス — 何が変わり、既存の MCP をどう移すか

まず「30 秒の結論」を押さえてから、**基本の仕組み → 旧 Local との違い → MCP の移行 → 移行手順とトラブル切り分け**の 1 本道で読み進めます。

> **30 秒でわかる要点**
> 1. **ハーネス**とは、考える「AI モデル」と操作する「ツール・MCP」をつないで会話や承認を管理する実行プログラムのことです。
> 2. VS Code の **旧 Local ハーネスは非推奨（2027 年 2 月までに削除予定）** です（[Local の現在の扱い](https://code.visualstudio.com/docs/agents/run/agent-harnesses)）。後継の **Copilot ハーネス** では **Agent Host**（専用プロセス）が会話を保持するため、ウィンドウを閉じても作業を続けやすくなります。
> 3. 切り替え後に **MCP サーバーが見えなくなる主因**は、設定形式の変更（`.vscode/mcp.json` → `.mcp.json`）と、パスワード等の入力ダイアログ（`${input:...}`）付き定義の転送除外です。環境変数 `${NAME}` へ移し、**Agent Host を再起動** すると解決します。

本稿は **2026-11-12** 確認の公式資料に基づき、第 3 節の MCP 転送条件と環境変数への移行手順は **2026-11-13** に再確認しています。

---

## 1. ハーネスとは何か、どう動くか

### 考える AI と、操作する道具をつなぐ

「コードを直して」と頼むと、**AI モデル**（言語モデル）が修正案や次の操作を考え、ファイルの読み書きやテスト、検索などの **ツール**（呼び出せる操作）を実行して進めます。その受け渡しと承認・会話状態を取り持つ実行管理プログラムが **ハーネス** です。

![AI モデルが考え、ハーネスがツールを呼び、標準の道具と MCP 経由の道具を使い分ける役割の図](assets/harness-system-map.svg)

- **ツールと MCP の関係**：すべての道具が **MCP**（AI アプリと外部サービスをつなぐ共通通信ルール）を使うわけではありません。エディタ標準のツールも MCP サーバー経由のツールも、ハーネスから見れば「呼び出せる操作」です（[ハーネスとモデルの役割](https://code.visualstudio.com/docs/agents/concepts/agent-harnesses)、[ツールの説明](https://code.visualstudio.com/docs/agents/run/tools)、[MCP の機能](https://code.visualstudio.com/api/extension-guides/ai/mcp)）。
- **文脈（コンテキスト）**：AI モデルに渡す「指示・会話履歴・ファイル・ツール実行結果」一式のことです。

### ハーネスの仕事と、1 回の依頼が返答になるまで

ハーネスの役割（材料の準備 → AI への依頼 → ツール実行と承認 → 結果と状態の保持）を静的な担当図で確認したうえで、時間の流れをシーケンス図で追います。

![Copilot ハーネスの担当を4つに分け、生成・評価の AI モデルと実作業のツールにつながる静的な関係図](assets/harness-responsibilities.svg)

![ユーザーの依頼、文脈の準備、AI の提案、承認とツール実行、結果の再入力、返答までを示すシーケンス図](assets/harness-request-sequence.svg)

- **エージェントのループ**：モデルがツール利用を提案し、ハーネスが実行結果を返してまたモデルが考える往復を繰り返します（[公式のターンの説明](https://code.visualstudio.com/docs/agents/concepts/agent-harnesses#follow-a-turn-through-an-agent-harness)）。
- **生成 AI モデル／評価 AI モデル群**：別会社の製品という意味ではなく役割分担の名前です。単一モデルでは評価側は使わず、点検・修正を自動で行う **Copilot Fusion** の図と列をそろえるために残しています（[モデルの役割](https://code.visualstudio.com/docs/agents/concepts/language-models)、[Fusion の方式](https://docs.github.com/en/copilot/concepts/models/copilot-fusion#how-copilot-fusion-works)）。
- **独立した 4 つの選択**：①**画面**（Chat view / Agents window）、②**ハーネス**（Copilot / 旧 Local）、③**モデル**（個別モデル / Fusion）、④**実行環境**（手元 PC / リモート / コンテナ / Cloud）は別々に選びます。Copilot ハーネスも手元の PC で使え、Claude モデルを選んでもハーネス自体が変わるわけではありません（[選択の区別](https://code.visualstudio.com/docs/agents/run/agent-harnesses)）。

---

## 2. 旧 Local と Copilot ハーネスの違い・切り替え方

実際の使い勝手がどう変わるか、3 つの場面（画面を閉じたとき・実行の中核・設定の読込）で比較します。

![画面を閉じたとき、共有する実行の中核、設定と道具の取込み経路を Local と Copilot で比較する図](assets/harness-differences.svg)

### 内部構造の違い

![旧 Local のチャット画面、Extension Host、内側の Local ハーネス、エディタ設定・拡張との関係](assets/harness-local-architecture.svg)

![Copilot 側の構成を、セッションを管理する Agent Host、呼出し口となる SDK、実行ランタイムに分けた役割の図](assets/harness-copilot-architecture.svg)

- **旧 Local（Extension Host 中心）**：VS Code 拡張機能を動かすプロセス（**Extension Host**）側で動く固有実装です。会話がウィンドウに結び付くため、窓を閉じると作業も止まります（[Extension Host の公式説明](https://code.visualstudio.com/api/advanced-topics/extension-host)、[旧 Local の実装](https://code.visualstudio.com/docs/agents/run/agent-harnesses#what-is-the-difference-between-local-and-copilot)）。
- **Copilot（Agent Host ＋ 実行ランタイム）**：専用プロセス **Agent Host** が会話と作業状態（セッション）を保持し、Copilot CLI 等とも共有する **実行ランタイム** へ、プログラム用の呼び出し口（**Copilot SDK**）経由で処理を渡します。Host が動いていればウィンドウを閉じても作業を続けられます（ただしエディタ拡張機能のツールにはエディタ接続が引き続き必要です）（[Agent Host の構成](https://code.visualstudio.com/docs/agents/concepts/agent-host#process-architecture)、[継続性とクライアントへの依存](https://code.visualstudio.com/docs/agents/concepts/agent-host#session-lifetime-and-client-dependencies)、[SDK とランタイムの関係](https://github.com/github/copilot-sdk#architecture)）。
- **注意点**：共通ランタイムを使っても、クライアント間の個人設定・認証・拡張ツールのすべてが自動同期するわけではありません。その代わり assisted permissions、ローカルサンドボックス、connectors、Fusion 等を活用できます（[ハーネスの比較](https://code.visualstudio.com/docs/agents/run/agent-harnesses#compare-agent-harnesses)、[Copilot ハーネスへ移る理由](https://code.visualstudio.com/docs/agents/run/move-to-copilot#why-move-to-the-copilot-harness)、[Copilot の要件と制限](https://code.visualstudio.com/docs/agents/run/agent-harnesses#copilot)）。

### 切り替え方

新しいチャットを開き、最初の依頼を送る前に **Session Target → Copilot** を選択します。VS Code には必要なランタイムが同梱されているため、この切り替えだけのために Copilot CLI や SDK を別途インストールする必要はありません（[開始手順](https://code.visualstudio.com/docs/agents/run/move-to-copilot#start-a-copilot-session)、[CLI / SDK の要否](https://code.visualstudio.com/docs/agents/run/move-to-copilot#do-i-need-to-install-copilot-cli-or-the-sdk)）。既存の Local 会話から引き継ぐ機能もありますが、切り替え後のツール動作は新しいセッションで確認してください（[既存会話の引き継ぎ](https://code.visualstudio.com/docs/agents/run/move-to-copilot#continue-an-existing-local-conversation)）。

---

## 3. なぜ MCP が見えなくなるのか（原因と移行）

### 入力プロンプト付き定義は、値解決の前に転送から外れる

社内文書検索サーバー `teamDocs`（説明用の架空サーバー）を例に、Local で使えていた MCP が切り替え後に消える流れを追います。

![上から下へ、旧設定の読込み、Local の入力と接続、Copilot への切り替え、入力解決前の転送除外、設定と認証の整備、実際の検索による復旧確認を追う時系列図](assets/harness-mcp-before-after.svg)

図の **④「転送チェック」** が最大のポイントです。旧設定では `${input:docs-key}` でキー入力ダイアログを出していましたが、Copilot への自動転送では入力変数を含む定義が**値を解決する前に除外**されます（Local でキャッシュ済みでも対象外）。定義が届かないため、サーバーが一覧に現れません（[入力付き定義の制限](https://code.visualstudio.com/docs/agents/reference/mcp-configuration#editor-forwarding-to-copilot)）。

### 対処の流れ：設定の届け方と認証方式を整える

![対象と旧設定の確認、転送かネイティブ設定への変換の選択、OAuth か固定トークン認証の選択、発見・接続認証・実行の確認、旧設定の整理までを上から下へ進める対処手順図](assets/harness-mcp-migration.svg)

- **エディタ転送（forwarding）とネイティブ移行（migration）の違い**：転送は条件を満たす旧定義だけを一時的に渡す仕組みです。自動移行機能 **Migrate**（変換済み旧エントリを削除する場合がある）や AI 支援の **Migrate with Agent**（原本を残すが利用枠を使う）とは役割が異なります（[転送の条件](https://code.visualstudio.com/docs/agents/reference/mcp-configuration#editor-forwarding-to-copilot)、[移行方法の選択](https://code.visualstudio.com/docs/agent-customization/migrate-customizations#choose-a-migration-path)）。
- **無効状態は設定ファイルに保存されない**：別のクライアントやマシンに移したときは、有効／無効の状態を各自で確認します（[移行時の有効状態](https://code.visualstudio.com/docs/agent-customization/migrate-customizations#migrate-mcp-servers)）。

| 項目 | エディタ管理の旧設定 | Copilot が直接読むネイティブ設定 |
|---|---|---|
| **ワークスペース** | `.vscode/mcp.json` | ワークスペース直下の `.mcp.json` |
| **ユーザー単位** | VS Code プロファイルの `mcp.json` | `$COPILOT_HOME/mcp-config.json`（未指定時は `~/.copilot/mcp-config.json`） |
| **最上位キー** | `servers` | `mcpServers` |
| **環境変数参照** | `${env:NAME}` | `${NAME}` または既定値付き `${NAME:-default}` |
| **非対応の仕組み** | `inputs`、`${input:...}`、`envFile` | 同じ仕組みは使えない（`~` は実行先ユーザーのホームを指す） |

（参考：[設定の保存場所と形式](https://code.visualstudio.com/docs/agents/reference/mcp-configuration#configure-mcp-for-copilot)）

### 認証方式の選択と、環境変数への書き換え例

`password: true` の入力定義は自動移行の対象外です。サーバーが要求する認証に合わせて次のいずれかを選びます（[入力付き定義の制約](https://code.visualstudio.com/docs/agent-customization/migrate-customizations#why-are-mcp-servers-with-input-prompts-missing)、[認証と秘密情報](https://code.visualstudio.com/docs/agents/reference/mcp-configuration#authentication-and-secrets)）。

1. **OAuth 対応サーバー**：Copilot 側の認証フロー（ブラウザサインイン等）を使います。
2. **固定トークン ＋ 環境変数可**：設定には `${DOCS_API_KEY}` のように参照だけ書き、秘密値のベタ書きは避けます（設定フォームで `${...}` が入力拒否されたときは **Other Properties から元の `.mcp.json` を開いて** 編集します：[フォームと環境変数参照の制約](https://code.visualstudio.com/docs/agents/reference/mcp-configuration#environment-variable-references)）。
3. **固定トークン ＋ 環境変数もファイルも不可**：同等の入力ダイアログ経路はないため、代替認証を検討するか、削除予定までの間だけ組織管理者に Local 利用可否を確認します（[固定トークンの制約](https://code.visualstudio.com/docs/agent-customization/migrate-customizations#can-copilot-pass-a-prompted-secret-to-an-http-mcp-server-without-an-environment-variable-or-a-file)）。

旧 `.vscode/mcp.json` の例（説明用の仮 URL）：

```json
{
  "servers": {
    "teamDocs": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "headers": { "Authorization": "Bearer ${input:docs-key}" }
    }
  },
  "inputs": [
    {
      "id": "docs-key",
      "type": "promptString",
      "description": "Documentation API key",
      "password": true
    }
  ]
}
```

Copilot 用のワークスペース直下 `.mcp.json` の例：

```json
{
  "mcpServers": {
    "teamDocs": {
      "type": "http",
      "url": "https://mcp.example.com/mcp",
      "headers": { "Authorization": "Bearer ${DOCS_API_KEY}" },
      "tools": ["*"]
    }
  }
}
```

### 環境変数を反映して動かす順序

![操作する人・設定と起動環境・Copilot ハーネス・teamDocs の4列で、設定変更、キーの用意、再起動、接続と認証、検索と結果の受け渡しを上から下へ追う図](assets/harness-mcp-env-sequence.svg)

別ターミナルで変数を設定しただけでは、**起動済みの Agent Host** に値は届きません。**② 実行先（Dev Container ならコンテナ側）にキーを設定 → ③ クライアント / Agent Host を再起動 → ④ 新しい Copilot セッションを開いて「teamDocs の検索ツールで、開発環境のセットアップ手順を探して」のように実際に呼んで確かめる**、の順が鉄則です（[環境変数への移行例](https://code.visualstudio.com/docs/agent-customization/migrate-customizations#replace-input-prompts-with-environment-variables)）。実運用では `tools: ["*"]` ではなく必要なツール範囲を確認します。

---

## 4. 移行手順・他の資産・トラブル切り分け

### 移行の 5 ステップ

1. **比較用の小さな作業を決め、元の設定を控える**（ワークスペース＋プロファイル設定）。
2. **新しい Copilot セッションを開く**（Session Target、実行先フォルダ・コンテナを確認）。
3. **`Chat: Open Customizations → Migrations` で移せるものから変換する**。
4. **MCP の認証（OAuth / 環境変数）・`cwd`・依存コマンドを実行先で整える**。
5. **Customizations 表示だけでなく実際にツール実行まで確認してから**、古い重複設定を整理する（[移行前の準備](https://code.visualstudio.com/docs/agents/run/move-to-copilot#before-you-start)、[移行の検証手順](https://code.visualstudio.com/docs/agent-customization/migrate-customizations#verify-the-migration)）。

### MCP 以外の資産を移すときの要点

- **`*.prompt.md`**：skills へ変換します（`agent` / `model` / `tools` 指定はそのまま残らないため見直します：[prompt の変換](https://code.visualstudio.com/docs/agent-customization/migrate-customizations#convert-prompt-files-to-skills)）。
- **個人 `agents` / `instructions`**：`~/.copilot/agents` や `~/.copilot/instructions` へ置きます（VS Code の **Settings Sync 非対象** のため、使うマシンごとに確認します：[個人カスタマイズの移行](https://code.visualstudio.com/docs/agent-customization/migrate-customizations#move-user-agents-and-instructions)）。
- **独自パスの skills・Local hooks・tool set・`@participant`**：ネイティブパス（`.github/skills` / `.agents/skills`）や MCP・plugins 等へ割り当て直します。Local hooks に自動変換はありません（[自動移行されないもの](https://code.visualstudio.com/docs/agent-customization/migrate-customizations#customizations-without-automatic-migration)）。
- **自作の司令塔 agent**：Local の `runSubagent` ではなく、Copilot ネイティブの委任ツール **`task`** に合わせて指示文と `tools` を検証します（[サブエージェント呼び出しの違い](https://code.visualstudio.com/docs/agent-customization/migrate-customizations#why-does-my-coordinators-subagent-invocation-stop-working)）。

### 症状から原因と対処を切り分ける

| 症状 | 主な原因候補 | 確認・対処のポイント |
|---|---|---|
| **一覧に出ない／コピーしても効かない** | セッションが Local のまま、`servers`→`mcpServers` 未変換、`${input:...}` による転送除外 | Session Target が Copilot か確認し、実行先直下の `.mcp.json` へネイティブ形式で書き直す |
| **環境変数や認証が失敗する** | 起動済み Agent Host が変数を未継承、Local と別の認証状態、フォームでの `${...}` 入力制限 | 実行先の起動環境へキーを設定し **Host を再起動**。編集は元の `.mcp.json` を直接開き、OAuth なら Copilot で再認証する |
| **コマンドが見つからない／別パスを見る** | Agent Host 側の PATH・`cwd`・依存不足 | 実際にサーバーを起動するマシン（リモート・コンテナ含む）でパスと `cwd` を確認する |
| **接続できるがツール実行が止まる** | `tools` フィルター、承認・組織ポリシー、サンドボックス制約 | 有効化ツール・承認プロンプト・サンドボックス設定を個別に見直す（[MCP の管理とトラブルシュート](https://code.visualstudio.com/docs/agents/run/manage-mcp-servers)） |
| **窓を閉じるとツールの一部が消える** | エディタ拡張機能が提供するツールへの依存 | エディタを接続して使うか、Agent Host 単独で動くネイティブ MCP / plugin 等を検討する |
| **prompt / resource の見え方が違う** | クライアント UI の差（旧 `/mcp.<server>.<prompt>` 等と同一ではない） | sampling・elicitation・MCP Apps 等の対応範囲を確認し、prompt は skills へ寄せる（[MCP の対応範囲](https://code.visualstudio.com/api/extension-guides/ai/mcp#mcp-support-in-copilot)） |

どうしても移行できない連携がある間は、組織の制限の範囲内で一時的に Local を残す選択肢もあります（[一時利用と制約](https://code.visualstudio.com/docs/agents/run/agent-harnesses#can-i-keep-the-local-harness-available-while-migrating)）。

---

## 5. 次に進む／参照した公式資料

Copilot ハーネスで通常の依頼と MCP が期待どおり動くことを確かめたら、複数のモデル選択・評価工程を組み合わせる [02 Copilot Fusion](02_copilot-fusion.md) へ進みます。

<details>
<summary>参照した公式ドキュメント一覧（初回確認：2026-11-12 ／ 第3節再確認：2026-11-13 ／ ページ表示更新日：2026-11-11）</summary>

- [Understand agent harnesses](https://code.visualstudio.com/docs/agents/concepts/agent-harnesses)（ハーネスの役割とループ）
- [Choose an agent harness](https://code.visualstudio.com/docs/agents/run/agent-harnesses)（Local / Copilot / Cloud、選択方法、継続性、非推奨案内）
- [Extension Host](https://code.visualstudio.com/api/advanced-topics/extension-host)（拡張機能を実行する場所）
- [Copilot SDK](https://github.com/github/copilot-sdk#architecture)（SDK と実行ランタイムの役割分離）
- [Use tools with agents](https://code.visualstudio.com/docs/agents/run/tools)（ツールの定義・実行場所・承認）
- [Agent Host architecture](https://code.visualstudio.com/docs/agents/concepts/agent-host)（プロセス・クライアント・実行場所の境界）
- [Move from Local to Copilot](https://code.visualstudio.com/docs/agents/run/move-to-copilot)（移行利点、開始手順、会話引き継ぎ）
- [Migrate customizations](https://code.visualstudio.com/docs/agent-customization/migrate-customizations)（資産別移行、入力・秘密情報の制限と検証）
- [MCP configuration reference](https://code.visualstudio.com/docs/agents/reference/mcp-configuration)（保存場所、形式、転送、認証）
- [MCP integration reference](https://code.visualstudio.com/api/extension-guides/ai/mcp)（tools 以外の機能とクライアント依存）
- [Manage MCP servers](https://code.visualstudio.com/docs/agents/run/manage-mcp-servers)（管理・認証・サンドボックス・トラブルシュート）

</details>
