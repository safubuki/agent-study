# Copilot Fusion — モデル選択と、下書き・評価・修正の組み立てを任せる

**Copilot Fusion は、依頼に応じてモデルと処理の進め方を選ぶ仕組みです。** ユーザーは作業の目的と effort level を指定し、Fusion が「1モデルで進める」「下書きを検査して必要なら強いモデルへ引き継ぐ」「別モデルの批評を受けて修正する」を使い分けます。モデルを何体も自分で起動し、最良の完成案を投票で選ぶ操作とは異なります。

GitHub は **2026-10-28 に一般提供を発表**しました。この資料は **2026-11-12 に確認した公式資料**に基づきます。発表時の説明と現在の仕様を区別し、現行の利用条件は公式ドキュメントを優先しています。[GitHub の一般提供発表](https://github.blog/changelog/2026-10-28-route-and-orchestrate-models-with-github-copilot-fusion/)

先にハーネス自体を理解したい場合は、[Local と Copilot ハーネスの比較・移行](01_harness-local-vs-copilot.md)から読んでください。

## 1. Fusion を選ぶと、何を任せるのか

![ユーザー、VS Code、Copilot ハーネス、Fusion、生成・評価AIモデル、ツールのつながり](assets/fusion-system-map.svg)

**この図の用語**

| 用語 | 何を指すか |
|---|---|
| **Copilot ハーネス** | AI に渡す情報、道具の呼出し、承認、会話の状態を管理するプログラム。詳しくは[静的な担当図](01_harness-local-vs-copilot.md#2-copilot-ハーネスの担当を知ってから動きを追う)を参照 |
| **生成AIモデル** | 案や返答を作る担当の **AIモデル** |
| **評価AIモデル群** | 案を点検・批評する担当の **AIモデル**。生成担当とは役割で呼び分けている |
| **作業ツール** | ファイル読取、編集、コマンド、検索など、呼び出せる操作 |
| **MCP** | 外部の道具やデータとやり取りする共通ルール。ツールの一部をこの方式で利用する |

Copilot ハーネスは、会話、モデルの呼び出し、ツールの実行、承認や作業の継続を管理する側です。**Fusion は、その中で利用するモデルや処理方式を選ぶ役割**として読み分けます。図は役割のつながりを示す模式図で、Fusion の内部サービスやプロセスの物理配置を断定するものではありません。

Fusion は、単に「今いちばん強いモデル」を毎回使う設定ではありません。タスクの内容、選んだ effort、利用可能なモデルなどを踏まえ、必要な処理を組み立てます。たとえば短い説明なら1モデルで返答し、難しい修正なら下書きと評価を分ける、といった使い分けです。[Fusion の概要](https://docs.github.com/en/copilot/concepts/models/copilot-fusion#overview)

モデルを切り替える必要が減ることと、レビュー工程を必要に応じて追加できることが利点です。一方で、レビューを加えた処理は呼び出し回数が増えるので、いつでも最速・最安になるとは限りません。いつものモデルを指定した作業と比べ、同じ受け入れ条件に到達するまでの時間・修正回数・利用量で判断すると比較しやすくなります。

## 2. 3つの処理方式を図で見る

| 方式 | 誰が何をするか | 処理の分け方 |
|---|---|---|
| **Single** | 1つのモデルが作業を進める | 1モデルの処理 |
| **Cascade** | 効率的なモデルが案を作り、judge が受理するか、強いモデルへ引き継ぐかを判断する | 下書き → 評価 → 必要なら昇格 |
| **Critique** | 元のモデルの案を複数モデルが独立して並列に批評し、集めた指摘を元のモデルが反映する | 下書き → 並列の批評 → 集約 → 元モデルの修正 |

一般提供発表は Single・Cascade・Critique の3方式を示し、現行の概念ドキュメントは Critique の批評が複数モデルで並列に行われることを説明しています。[一般提供時の方式説明](https://github.blog/changelog/2026-10-28-route-and-orchestrate-models-with-github-copilot-fusion/#smarter-choices-for-developers)、[現行の処理方式](https://docs.github.com/en/copilot/concepts/models/copilot-fusion#how-copilot-fusion-works)

![Single・Cascade・Critique の処理と分岐を比較したベクター図](assets/fusion-patterns.svg)

ここでの「複数」は役割の分担です。Critique では、複数の評価役がそれぞれコメントを返し、元のモデルが修正します。複数のエージェントが同時に同じファイルを完成させ、その勝者の変更だけが採用される、と考えると動きを誤解します。

**Fusion はサブエージェントと別の仕組みで、Fusion 自体がサブエージェントを起動するものではありません。** 作業を別のエージェントへ委任する機能と、モデルの選択・評価工程の組み立てを分けて考えてください。[Fusion の制約](https://docs.github.com/en/copilot/concepts/models/copilot-fusion#copilot-fusion-limitations)

## 3. ユーザーの依頼から返答まで

![ユーザーの依頼から、Copilot ハーネスによる実行、下書き、複数モデルの批評、修正、返答までを示すシーケンス図](assets/fusion-request-sequence.svg)

この図は **Critique が選ばれた場合の例**です。ユーザーが依頼を送ると、Copilot ハーネスが作業を受け付け、Fusion がモデルと処理方式を選びます。元のモデルは必要なツールを使って案を作り、評価役はその案を批評します。集約した指摘を元のモデルが反映し、最終返答をユーザーへ返します。

同じ会話の次の依頼でも、毎回同じ方式になるとは限りません。ユーザーが Standard・High・Max を選ぶことと、Single・Cascade・Critique を手動で指定することも別です。**effort は品質・時間・コストの優先度を伝える選択で、特定の処理方式を保証するスイッチではありません。** [VS Code の Fusion の説明](https://code.visualstudio.com/docs/agents/concepts/language-models#copilot-fusion)

処理中は進捗や利用モデルを確認でき、返答後は effort 名のホバーから使われたモデルを確認できます。ただし、中間の案は修正・破棄される可能性があるため、最終返答と区別します。[モデル利用の確認方法](https://docs.github.com/en/copilot/concepts/models/copilot-fusion#how-copilot-fusion-works)

### 公開されていることと、内部の判断

| 公式資料で確認できること | 固定仕様として断定しないこと |
|---|---|
| タスクに応じてモデルと処理方式を選ぶ | この文面なら必ず Critique になる、という条件 |
| Cascade の judge が受理または昇格を判断する | judge の採点式・点数のしきい値 |
| Critique の指摘を集約し、元のモデルが修正する | 毎回使う評価AIモデルの名前や固定の人数 |
| モデルの構成や処理方式は更新され得る | 特定モデルの組合せが将来も続くこと |

この資料のモデル名・役割の図示は仕組みを理解するためのものです。内部の判断基準や各モデルへ渡す履歴の詳細まで、公開されていない部分を推測で埋めてはいません。

## 4. 個別モデル・Auto・Fusion・サブエージェントの違い

![個別モデルの選択、Auto、Fusion、サブエージェントの違いを比べる図](assets/fusion-vs-auto.svg)

| 選択・機能 | 任せること | ユーザーが決めること |
|---|---|---|
| **個別モデルを選ぶ** | 指定した主会話モデルに依頼する | どのモデルを使うか |
| **Auto** | リクエストに合う1モデルを選ぶ | モデル選びを自動化するか、提供される優先度 |
| **Fusion** | モデル選びに加え、必要なら下書き・評価・修正の工程を組む | 依頼内容、利用可能な effort、受け入れ条件 |
| **サブエージェント** | 作業の一部を別のエージェントへ委任する | 委任したい役割や対象。自動委任の挙動はハーネス次第 |

Auto と Fusion の主な差は、**1モデルの選択に加えて、モデル同士の工程も組み立てるか**です。VS Code では、設定とアカウントに提供される tier に応じて、従来の Auto の位置に Fusion が現れます。[Auto の公式説明](https://docs.github.com/en/copilot/concepts/models/auto-model-selection)、[VS Code のモデル選択の概念](https://code.visualstudio.com/docs/agents/concepts/language-models#auto-model-selection)

## 5. VS Code で使い始める

1. VS Code と Copilot の関連機能を更新し、GitHub にサインインして利用可能なプランを確認します。
2. Settings で **`chat.copilot.dynamicAutoTiers.enabled`** が有効か確認します。変更すると、実行中のリクエストが終わった後に Copilot の実行環境が再起動します。
3. **Copilot ハーネスで新しいチャット**を作ります。既存の Local の会話で、モデルだけを変更する操作と区別します。
4. モデル選択で **Copilot Fusion** を選び、表示される **Standard / High / Max** から選択します。
5. 範囲と完了条件が明確な作業を依頼し、返答、変更差分、テスト結果、利用量を確認します。

これは VS Code の現行手順に基づきます。設定を有効にしても利用権限は増えず、サービスがそのアカウントに利用可能な tier を提供しない場合は Auto 表示が続きます。[VS Code の設定手順](https://code.visualstudio.com/docs/agent-customization/language-models#use-copilot-fusion)

**Fusion を選んでも MCP やツールの設定が自動的に直るわけではありません。** MCP が必要な作業なら、先に Copilot ハーネスでサーバーの接続と対象ツールを確認します。切替時にツールが消えた場合の原因と移行は、[ハーネスの比較・MCP の移行](01_harness-local-vs-copilot.md)で扱います。

## 6. effort の選び方と利用条件

| 選択肢 | 向く場面 | 確認時点の利用条件 |
|---|---|---|
| **Standard** | 日常的な作業。基本はタスクごとに1モデルを選ぶ | 全 Copilot プラン |
| **High** | 範囲が明確で、追加の評価が役立つ難しい修正 | Pro+ / Max / Business / Enterprise |
| **Max** | 特に深い検討が必要な問題 | Pro+ / Max / Business / Enterprise |

プラン別の対応は **2026-11-12 の確認時点**です。表示される選択肢は契約と組織のモデルポリシーにも左右されます。Fusion Fast は VS Code の inline chat 用で、ユーザーが上の3段階のように選ぶものではありません。[公式の effort とプラン別対応表](https://docs.github.com/en/copilot/concepts/models/copilot-fusion#copilot-fusion-effort-level-availability-by-copilot-plan)、[VS Code 1.144 の一般提供案内](https://code.visualstudio.com/updates/v1_144/#_route-and-orchestrate-models-with-github-copilot-fusion)

最初の比較では「何を直すか」「どのテストを通すか」「変更しない範囲」を具体的に渡すと、結果を評価しやすくなります。例えば、同じ修正を Standard と普段の個別モデルで試し、追加の評価工程が必要そうな場面で High を検討します。これは本資料の使い方の提案で、各 tier の品質を保証するものではありません。

## 7. コスト・変更差分・データの扱いで確認する点

| 確認する点 | なぜ必要か |
|---|---|
| **最終返答だけでなく、作業差分を確認する** | 破棄された案がすでに行ったファイル編集は、自動で元に戻らない |
| **利用したモデル全体の利用量を見る** | High / Max は複数回のモデル処理を含み、Standard より AI credits を多く使う場合がある |
| **会話の長さを過信しない** | Fusion 独自の巨大なコンテキスト窓があるわけではなく、各工程を担当するモデルの上限に従う |
| **組織のモデル・データ要件を確認する** | 対象モデルはプランや管理者の制限、データ所在地などのポリシーに従う |

課金は使用モデルの標準レートに基づき、Fusion 専用の追加料金はありません。ただし、評価と修正を含む1タスク全体が、1モデルの1回の返答と同じ費用になる意味ではありません。差分の自動復元やコンテキストの制約も、使い始める前に確認してください。[利用料金と制約](https://docs.github.com/en/copilot/concepts/models/copilot-fusion#billing-for-copilot-fusion)、[VS Code の AI credits の説明](https://code.visualstudio.com/docs/agents/concepts/language-models#ai-credits-and-model-costs)

Fusion は、管理者により対象外となったモデルや契約外のモデルを自由に使う仕組みではありません。機密性の高い作業では、Fusion で利用できるモデルの集合と組織のデータ方針を確認します。[Fusion のポリシー](https://docs.github.com/en/copilot/concepts/models/copilot-fusion#policies-and-availability)

対応するローカルモデルを Fusion Standard の候補にする機能もありますが、これは公開プレビューで、対象モデルと実行環境の条件があります。**「ローカルモデル」「旧 Local ハーネス」「Copilot ハーネスを手元で実行すること」は別です。** ローカルモデルを使っても、ツールやほかの工程を含めた全体がオフラインになるとは限りません。[Fusion のローカルモデル対応](https://docs.github.com/en/copilot/concepts/models/copilot-fusion#selecting-local-models-in-copilot-fusion)、[モデルの実行場所と作業場所](https://code.visualstudio.com/docs/agents/concepts/language-models#model-access-and-hosting)

## 8. 表示されない・期待と違うとき

| 症状 | まず確認すること |
|---|---|
| Fusion が見つからず Auto のまま | Copilot ハーネスの新規チャットか、dynamic Auto tiers の設定、クライアントの更新、アカウントへの提供状況 |
| High / Max がない | 契約プランと、必要なモデルに対する組織の許可。設定の有効化だけでは利用可能にならない |
| 複数モデルが動かない | Standard や Single の選択では1モデルが基本。Fusion は必要なときに追加の工程を選ぶ |
| MCP や以前のツールが見えない | Fusion の判断とは分けて、Copilot ハーネスで設定の読込・実行環境・接続を確認する |
| 途中の案が見えない | 中間案の表示と最終返答は異なる。進捗と返答後の利用モデルを確認する |
| 採用されなかった案の編集が残る | 自動ロールバックを前提にせず、変更差分を確認して必要な変更を選ぶ |

## 確認日と出典

| 資料 | この資料での用途 |
|---|---|
| [GitHub Changelog：Fusion 一般提供](https://github.blog/changelog/2026-10-28-route-and-orchestrate-models-with-github-copilot-fusion/) | **2026-10-28 発表**。機能の位置付けと提供開始 |
| [GitHub Docs：About GitHub Copilot Fusion](https://docs.github.com/en/copilot/concepts/models/copilot-fusion) | 現行の処理方式、effort、プラン、制約、課金 |
| [VS Code：AI language models](https://code.visualstudio.com/docs/agent-customization/language-models#use-copilot-fusion) | VS Code での具体的な開始手順 |
| [VS Code：Understand language models](https://code.visualstudio.com/docs/agents/concepts/language-models) | Auto との差、モデル・ハーネス・実行場所の区別。ページ表示の更新日は **2026-11-11** |
| [VS Code 1.144 リリースノート](https://code.visualstudio.com/updates/v1_144/) | Fusion の一般提供案内。これを最低対応バージョンの保証としては扱わない |

いずれも **2026-11-12 に取得・確認**しました。モデルの組合せ、提供 tier、UI、プレビュー機能の条件は変更され得ます。確認時点の期間限定施策として、有料プランには **2026-11-30 までモデル料金の30%割引**が案内されていますが、恒久的な料金条件としては扱いません。[期間限定の案内](https://docs.github.com/en/copilot/concepts/models/copilot-fusion#billing-for-copilot-fusion)
