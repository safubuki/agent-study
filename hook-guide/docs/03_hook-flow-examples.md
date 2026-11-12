# フックは誰が呼び、どう動く？ — 全体図と4つのシーケンス図

**フックを呼び出すのは、AI モデルを動かしているアプリの実行管理部分です。** 指示の受付、ツールの実行前後、返答の終了といった節目で、設定に一致する処理を起動します。その処理で、手元のファイルを整えたり、AI に情報を追加したり、自分のアプリに状態を送ったりできます。

このページでは **Claude Code** と **GitHub Copilot（VS Code の Copilot 実行環境 / Copilot CLI）** を比較します。設定ファイルに登録する **command フック**を中心に説明します。イベント名は図中に両方を併記し、できることが違う箇所は分岐で示します。公式資料の確認日：**2026-11-12**。

| 知りたいこと | 読む図 |
|---|---|
| AI・フック・ツール・自分のアプリの接続関係 | [全体の接続関係](#全体の接続関係) |
| AI の状態を受け取り、アプリの表示や通知音を変える仕組み | [例1：状態を自分のアプリへ送る](#例1状態を自分のアプリへ送る) |
| チャットを送るたびに処理を動かす | [例2：送信のたびにローカル処理を動かす](#例2送信のたびにローカル処理を動かす) |
| 操作前のチェックと、編集後の自動整形 | [例3：操作の前後に処理を入れる](#例3操作の前後に処理を入れる) |
| AI の返答終了時に検査し、修正を続けさせる | [例4：終了時に検査して差し戻す](#例4終了時に検査して差し戻す) |
| Claude と Copilot の違い、VS Code での注意点 | [環境による違い](#環境による違い) |

## シーケンス図の共通ルール

**4枚ともユーザーが指示を入力して送信するところから始めます。** 列の順序・名前・色は、すべてのシーケンス図で固定しています。

| 左からの位置 | 登場人物 | 色 | 担当 |
|---|---|---|---|
| 1 | **ユーザー** | グレー | チャットで依頼し、返答や通知を確認する |
| 2 | **AI アプリ** | 青 | 会話と実行を管理し、モデル・ツール・フックを呼び分ける |
| 3 | **AI モデル** | 紫 | 依頼を解釈し、作業を提案して返答を作る |
| 4 | **フック** | 緑 | 登録された処理を実行し、必要なら判定や補足を返す |
| 5 | **作業・検査ツール** | 青緑 | ファイル編集、検索、テストなどを実行する |
| 6 | **通知先アプリ** | オレンジ | 通知を受信し、状態表示や音に反映する |

その例で使わない列も残し、横の位置を動かしません。「通知フック」「完了検査フック」はどちらも同じ **フック** の列で示し、何をするかを処理の中に書いています。

時間は上から下へ進み、矢印とメッセージの色は **送り手** の色に対応します。実線は依頼・通知、横の破線は結果・応答です。途中でも列名を再掲し、長い図を読み進めても登場人物を追えるようにしています。分岐 A・B は条件による別の流れで、連続して実行される意味ではありません。

## 全体の接続関係

![AI アプリがモデル・ツール・フックを呼び分け、フックから手元の処理や自作アプリにつながる全体図](assets/hook-system-map.svg)

「AI」と呼んでいるものを、図では次の役割に分けています。

| 登場人物 | 担当すること |
|---|---|
| **ユーザー** | チャットで依頼し、返答や通知を確認する |
| **AI アプリ** | モデルとの通信、ツール実行、フックの起動と結果の反映を行う |
| **AI モデル** | 指示を読み、返答や次のツール呼び出しを考える |
| **フック** | イベント情報を受け取って、登録されたスクリプト等を実行する |
| **作業・検査ツール** | ファイル編集、コマンド実行、検索、テストなどを実際に行う |
| **通知先アプリ** | フックから届いた情報を受信し、状態表示・音・集計などに使う |

command フックにはイベント情報が **標準入力の JSON** として渡ります。フックはその場で処理を実行し、必要なら終了コードや JSON で結果を返します。返せる判定はイベントごとに決まっています。[Claude の入出力仕様](https://code.claude.com/docs/en/hooks#hook-input-and-output)、[Copilot の入出力仕様](https://docs.github.com/en/copilot/reference/hooks-reference#hook-event-input-payloads)

図の左右の分岐は併用できます。たとえば、編集後に整形だけ行う、ログだけ保存する、ログを保存したうえで自分のアプリへ HTTP で通知する、といった構成です。

## 例1：状態を自分のアプリへ送る

これは、普段使われている「AI の状態を拾ってアプリに反映する」仕組みに相当します。**フックがイベントを受け取り、通知用のデータに変換して、アプリの受信口へ送ります。受信したアプリが表示や通知音を決めます。**

![ユーザーの依頼、AI の作業と返答、フックから通知先アプリへの送信、ユーザーへの通知を順に示すシーケンス図](assets/hook-status-notification-sequence.svg)

最初にユーザーが修正を頼み、AI アプリがモデルの提案に沿ってツールを実行します。その結果から作った返答をユーザーに表示した後、返答終了のイベントでフックを呼び、通知先アプリが終了バッジや音で知らせます。**チャットで返答を受け取る経路と、アプリで通知を受け取る経路**を分けてたどれます。

この図の HTTP POST は、**自分で作るアプリ連携の例**です。送信スクリプトと受信口を用意します。ローカル IPC や、アプリが監視するファイルへの追記でも同じ構成にできます。Claude の `type: "http"` で直接受信口を呼ぶ構成もありますが、図は入力の変換が分かりやすい command フック方式にしています。[Claude の HTTP フック](https://code.claude.com/docs/en/hooks-guide#http-hooks)

### どのイベントを、どんな表示に変えるか

次の「表示」はアプリ側で決める設計例です。製品がその状態名を自動配信するわけではありません。

| 観測した節目 | Claude Code | Copilot | 受信アプリでの表示例 |
|---|---|---|---|
| 指示の受付 | `UserPromptSubmit` | `userPromptSubmitted` | 処理中 |
| ツールの実行要求 | `PreToolUse` | `preToolUse` | ツールを実行しようとしている |
| ツールの成功 | `PostToolUse` | `postToolUse` | ツール実行が成功した |
| 許可の要求 | `PermissionRequest` / `Notification` | `permissionRequest` / CLI の `notification` | 人の確認が必要なら確認待ち |
| 返答の終了 | `Stop` | `agentStop` | 返答終了 |
| セッション終了 | `SessionEnd` | `sessionEnd` | セッション終了 |

イベントの対応は、[Claude のライフサイクル](https://code.claude.com/docs/en/hooks#hook-lifecycle)、[Copilot のイベント一覧](https://docs.github.com/en/copilot/reference/hooks-reference#hook-events)を参照してください。

例えば、送信側で次のような共通形式に変換すると、受信アプリは製品ごとの JSON の違いを吸収できます。`source`・`state`・`observed_at` はこの例で独自に定義した項目です。

```json
{
  "source": "claude-code",
  "session_id": "example-session",
  "event": "Stop",
  "state": "turn_ended",
  "observed_at": "2026-11-12T12:00:00+09:00"
}
```

受信アプリでは `session_id` ごとに最新状態を保存し、画面を更新します。音を鳴らすか、履歴だけ残すかも受信側で決められます。Copilot の camelCase 形式では `sessionId` などを共通形式に変換します。

**「返答終了」「検査合格」「セッション終了」は別の状態です。** `Stop` / `agentStop` が発生しても、成果物の正しさは分かりません。検査で差し戻す構成では、停止イベントが複数回発生することもあります。成功通知を出すなら例4の検査結果と組み合わせます。

また、フックは節目を観測する仕組みです。イベントが来ない時間だけで「考え中」「停止中」を正確には区別できません。割り込みやエラーも含む細かな実行状態が必要なら、実行管理側のイベントやログも組み合わせます。Claude の `Stop` はユーザーの中断では発火せず、API エラーでは別イベントになります。[Stop の条件](https://code.claude.com/docs/en/hooks#stop)

### `Notification` という名前の注意点

Claude の `Notification` は確認待ちやアイドルなど、アプリが通知を出す節目です。返答終了のすべてを表すイベントとして扱わず、`notification_type` を見ます。Copilot の `notification` は **CLI 限定として文書化**されており、クラウドでは発火しません。VS Code でも同じ通知を受けられる前提にせず、`agentStop` や `permissionRequest` など、目的の節目を確認します。[Claude の通知](https://code.claude.com/docs/en/hooks#notification)、[Copilot の通知](https://docs.github.com/en/copilot/reference/hooks-reference#notification-hook)

## 例2：送信のたびにローカル処理を動かす

チャットを送った時点で、ログを残す、現在のブランチを調べる、作業メモを更新する、といった処理を動かせます。**外部アプリへの通知は不要です。**

![ユーザーの入力と送信から、送信時フック、Claude と Copilot の分岐、AI の処理とユーザーへの返答までを示すシーケンス図](assets/hook-prompt-sequence.svg)

| やりたいこと | Claude Code | Copilot の設定ファイルの command フック |
|---|---|---|
| 送信時にローカルへログを書く | 可能 | 可能 |
| 送信ごとにブランチ等を AI へ自動添付 | `UserPromptSubmit` の `additionalContext` | `userPromptSubmitted` の出力は採用されない |
| 検査結果で、そのプロンプトを止める | `UserPromptSubmit` でブロック可能 | このイベントのフック出力では制御できない |

Claude の[送信時フック](https://code.claude.com/docs/en/hooks#userpromptsubmit)と、Copilot の[出力に関する制約](https://docs.github.com/en/copilot/reference/hooks-reference#userpromptsubmitted--userpromptsubmit)に基づきます。Copilot の SDK にあるプログラムからのフックは別の仕組みです。

Copilot でセッション開始時に前提を添えるなら `sessionStart` が使えます。ただし、途中で変わるブランチ名などを「送信のたびに再取得して添える」動きとは異なります。見本は [文脈注入サンプル](../samples/04-context-injection/README.md)にあります。

「必ず実行」は、**有効なフック設定に一致するイベントが発生したときに、モデルの判断を待たず処理を起動する**という意味です。AI が内部で推論するたび、文字を1つ生成するたび、といった粒度ではありません。設定の無効化、起動失敗、タイムアウトがないかは実行ログで確認します。[フックの基本動作](https://code.claude.com/docs/en/hooks-guide#how-hooks-work)

## 例3：操作の前後に処理を入れる

たとえば「保護ファイルへの編集を実行前に検査する」と「コードの編集に成功したら整形する」を、ツール実行の前後に配置します。

![ユーザーの編集依頼から AI の判断、実行前の検査、編集後の整形、ユーザーへの返答までを示すシーケンス図](assets/hook-tool-sequence.svg)

検査・整形をする処理本体は共通化できますが、**ホストへ返す JSON は変換が必要**です。例えば実行前に拒否する出力は次の形になります。

Claude Code：

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "保護ファイルへの編集です"
  }
}
```

Copilot の `preToolUse`：

```json
{
  "permissionDecision": "deny",
  "permissionDecisionReason": "保護ファイルへの編集です"
}
```

[Claude の実行前判定](https://code.claude.com/docs/en/hooks#pretooluse-decision-control)、[Copilot の実行前判定](https://docs.github.com/en/copilot/reference/hooks-reference#pretooluse-decision-control)

対象を編集ツールだけに絞った検査では、シェルコマンドで同じファイルを書き換える経路は覆えません。また、成功後のフックはすでに実行された操作を取り消すものではありません。整形した場合は、AI が持つツール結果とファイルの内容に差が出るので、必要に応じて読み直すよう補足を返します。見本は [関所](../samples/01-block-dangerous-cmd/README.md)と[自動整形](../samples/02-auto-format-lint/README.md)にあります。

## 例4：終了時に検査して差し戻す

ユーザーが実装を頼むと、AI アプリはモデルに指示を渡し、提案されたツールを実行します。モデルは作業結果から返答を作り、AI アプリがユーザーに表示します。**このターンを終える節目**で検査フックを呼び出し、不合格ならユーザーの再依頼を待たずに修正へ戻します。AI が「できた」と返答したことと、テストの合格を区別できる使い方です。

![ユーザーの依頼、AI の処理、返答の表示を経て、終了時の検査で差し戻しまたは停止を選ぶシーケンス図](assets/hook-completion-gate-sequence.svg)

図の②が普段の作業と返答、③がフックによる終了時の検査です。不合格なら②へ戻り、ツールで修正して返答を作り直した後に再検査します。合格した場合は停止を許可し、ユーザーが返答と成果物を確認して次の指示を出します。返答は途中から順次表示される場合もあり、**返答の表示とターンの停止を別々に描いています。**

Claude の `Stop`、Copilot の `agentStop` では、`decision: "block"` と `reason` による差し戻しができます。再検査が終わらない場合に備え、`stop_hook_active` や差し戻し回数で上限を設けます。[Claude の停止判定](https://code.claude.com/docs/en/hooks#stop-decision-control)、[Copilot の停止判定](https://docs.github.com/en/copilot/reference/hooks-reference#agentstop--subagentstop-decision-control)

アプリ通知と組み合わせるなら、**1つの処理で「検査 → 合否を決定 → 合格時の通知／不合格時の差し戻し」を順に行う**構成にすると整理しやすくなります。検査フックと通知フックを別々に登録すると、検査が不合格でも通知してしまうことがあります。ほかにも停止をブロックするフックがあるなら、1つの検査結果だけで「停止確定」と扱わないようにします。

回数の上限で停止を許可した場合は、アプリにも「返答終了・検査未合格」と残します。合格したという通知にはしません。見本は [完了ゲート](../samples/03-stop-until-pass/README.md)にあります。

## 環境による違い

![Claude Code と Copilot のイベント・出力・VS Code での実行環境の違い](assets/copilot-vs-claude-hooks.svg)

### VS Code では「どの実行環境か」を先に確認する

**VS Code はチャット画面を提供するアプリで、選択した実行環境によってフック仕様が変わります。** Copilot を選んだセッションは Copilot の仕様、Claude を選んだセッションは Claude の仕様で確認します。モデル名だけを変更しても、実行環境を切り替えたことにはなりません。旧 Local 実行環境の設定とも区別します。[VS Code の実行環境の選択](https://code.visualstudio.com/docs/agent-customization/hooks#choose-the-hook-implementation-for-your-session)

### 移植するときに確認すること

| 項目 | Claude Code | Copilot（VS Code の Copilot 実行環境 / CLI） |
|---|---|---|
| プロジェクトの設定例 | `.claude/settings.json` の `hooks` | `.github/hooks/*.json` の `version: 1` と `hooks` |
| 図で使ったイベント名 | `PreToolUse` など | `preToolUse` など。互換の大文字名もある |
| 入力の形式 | `session_id`、`tool_name`、`tool_input` | 小文字名では `sessionId`、`toolName`、`toolArgs`。互換名は形式が変わる |
| 実行前に拒否する JSON | `hookSpecificOutput` 内に判定 | `preToolUse` はトップレベルに判定 |
| 成功後の補足情報 | `hookSpecificOutput.additionalContext` | `postToolUse` はトップレベルの `additionalContext` |
| ツール名・引数 | `Edit` / `Write` など | `edit` / `create` など。互換名や実行環境によっても確認 |
| 実行するマシン | Claude Code が動く環境 | Copilot の実行環境。リモートやクラウドなら手元の PC とは限らない |

Copilot は互換のイベント名や `.claude` の設定を読める場合もありますが、**設定を読めることと、入出力の互換性は別**です。判定を返す部分は製品別にし、ログ保存や検査などの処理本体を共有する構成が扱いやすくなります。[VS Code の移行上の注意](https://code.visualstudio.com/docs/agent-customization/hooks#migrate-hooks-between-harnesses)、[Copilot の設定形式](https://docs.github.com/en/copilot/reference/hooks-reference#hook-configuration-format)

実行前フックの異常終了にも差があります。Claude は通常のエラーと明示的な拒否を区別し、失敗時にブロックする設定も提供します。Copilot の `preToolUse` は通常の異常終了でも拒否しますが、タイムアウトでは通常の許可フローへ進みます。「エラーなら必ず止まる」と一括りにしないでください。[Claude の失敗時制御](https://code.claude.com/docs/en/hooks#block-the-action-when-a-hook-fails)、[Copilot の終了コード](https://docs.github.com/en/copilot/reference/hooks-reference#exit-codes-for-command-hooks)

通知先が手元のアプリの場合は、**`localhost` がどのマシンを指すか**も確認します。リモート上のフックから見た `localhost` はリモート自身です。セッション ID を付けて送り、複数セッションの混線や遅れて届いた通知で表示が戻ることも防ぎます。これらは受信アプリ側の設計項目です。

## 次に読む

- [入門ガイド：設定と標準入出力](00_hook-guide.md)
- [Copilot / VS Code の設定例](01_copilot-hook-guide.md)
- [定番5パターンと使い分け](02_hook-patterns.md)
- [監査ログ・通知のサンプル](../samples/05-audit-and-notify/README.md)（ターミナルへの通知例。自作アプリの受信口は含まない）

図は仕組みを理解するための構成例です。設定を追加する際は、利用中のバージョン・実行環境でイベントと入出力を確認してください。
