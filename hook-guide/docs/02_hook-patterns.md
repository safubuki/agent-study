# フック（Hooks）実践パターン集 — 定番5選

実務でよく使われるフックは、大きく **5つの定番パターン** に集約されます。まずは自分のプロジェクトで一番困っている箇所から **1つだけ** 導入するのが成功のコツです。

---

## 1. 5つの定番パターン早見マップ

![5つの定番フックパターン早見マップ](assets/patterns-map.svg)

| # | パターン名 | 使うイベント | 一言でいうと | サンプル |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **事前ガードレール** | `PreToolUse` | 危険なコマンドや `.env` 編集を実行前に遮断する | [01-block-dangerous-cmd](file:///c:/git_home/agent-study/hook-guide/samples/01-block-dangerous-cmd/) |
| **2** | **事後オートフォーマット** | `PostToolUse` | ファイル保存直後に Prettier や構文検査を自動実行する | [02-auto-format-lint](file:///c:/git_home/agent-study/hook-guide/samples/02-auto-format-lint/) |
| **3** | **完了ゲート** | `Stop` | テストや必須条件を満たすまで完了を差し戻す | [03-stop-until-pass](file:///c:/git_home/agent-study/hook-guide/samples/03-stop-until-pass/) |
| **4** | **文脈の自動注入** | `UserPromptSubmit` | ブランチ名や変更ファイルをプロンプト裏へ自動添付する | [04-context-injection](file:///c:/git_home/agent-study/hook-guide/samples/04-context-injection/) |
| **5** | **監査ログ・通知** | `Notification` 等 | 操作履歴の JSONL 記録や確認待ち通知を自動化する | [05-audit-and-notify](file:///c:/git_home/agent-study/hook-guide/samples/05-audit-and-notify/) |

---

## パターン 1：事前ガードレール（PreToolUse Guardrail）

![パターン1：事前ガードレール（PreToolUse）](assets/pattern1-guardrail.svg)

- **解決する課題**：AI が問題解決を急ぐあまり、`rm -rf` や `git push --force` を実行したり、`.env` や本番設定ファイルを書き換えたりする事故を防ぎます。
- **仕組み**：`PreToolUse` で実行直前の引数（`command` や `file_path`）を検査し、禁止パターンに一致したら **`stderr` に理由を書いて終了コード `2` で即遮断**します。
- **すぐ使えるサンプル** → [samples/01-block-dangerous-cmd/](file:///c:/git_home/agent-study/hook-guide/samples/01-block-dangerous-cmd/)

---

## パターン 2：事後オートフォーマット（PostToolUse Formatter）

![パターン2：事後オートフォーマット（PostToolUse）](assets/pattern2-auto-format.svg)

- **解決する課題**：AI にプロンプトで「インデントや整形ルールを守って」と指示するとトークンを無駄に消費し、それでも書き方のブレが残ります。
- **仕組み**：`Edit` や `Write` が終わった直後（`PostToolUse`）に、裏で Prettier などの整形ツールや構文チェックを自動実行します。違反があればその場で AI に通知して直させます。
- **すぐ使えるサンプル** → [samples/02-auto-format-lint/](file:///c:/git_home/agent-study/hook-guide/samples/02-auto-format-lint/)

---

## パターン 3：完了ゲート（Stop Completion Gate）

![パターン3：完了ゲート（Stop）](assets/pattern3-completion-gate.svg)

- **解決する課題**：AI が「修正しました！」と完了報告したのに、テストが落ちていたり必須セクションが抜けていたりする「早合点（中途半端な完了）」を防ぎます。
- **仕組み**：AI が止まろうとした瞬間（`Stop`）にテストや成果物検査を実行し、不合格なら `{"decision": "block", "reason": "不足項目: ..."}` を返して作業を続行させます。
- **必須の安全弁**：無限ループを防ぐため、入力 JSON の **`stop_hook_active` が `true` のときは素通し**（`exit 0`）させます。
- **すぐ使えるサンプル** → [samples/03-stop-until-pass/](file:///c:/git_home/agent-study/hook-guide/samples/03-stop-until-pass/)

---

## パターン 4：文脈の自動注入（Context Injector）

![パターン4：文脈の自動注入（UserPromptSubmit / SessionStart）](assets/pattern4-context-inject.svg)

- **解決する課題**：「今どのブランチ？」「どのファイルを触りかけ？」を毎回人間が貼ったり、長い会話の自動圧縮（Compact）で重要ルールを忘れられたりする手間をなくします。
- **仕組み**：`UserPromptSubmit` や `SessionStart` で `git branch` や `git status --short` を取得し、標準出力に出して AI の背景知識に自動添付します。
- **すぐ使えるサンプル** → [samples/04-context-injection/](file:///c:/git_home/agent-study/hook-guide/samples/04-context-injection/)

---

## パターン 5：監査ログ・通知（Audit Log & Notification）

![パターン5：監査ログ・通知（Notification / PostToolUse）](assets/pattern5-audit-notify.svg)

- **解決する課題**：AI に長時間の作業を任せたときに「許可待ちで止まっているのに気づかない」問題や、「AI がいつ何を実行したか後から追跡できない」問題を解消します。
- **仕組み**：`Notification` でデスクトップ通知や音を鳴らし、`PostToolUse` で実行コマンドや編集ファイルを `.logs/agent-audit.jsonl` に1行ずつ追記します。
- **すぐ使えるサンプル** → [samples/05-audit-and-notify/](file:///c:/git_home/agent-study/hook-guide/samples/05-audit-and-notify/)

---

## 2. まとめ：何をプロンプトに書き、何をフックにするか

![プロンプト（CLAUDE.md）とフック（Hooks）の役割分担](assets/prompt-vs-hook.svg)

| ルールの種類 | 書く場所 | 理由 |
| :--- | :--- | :--- |
| **設計の好み・命名方針・トーン** | **プロンプト**（`CLAUDE.md`） | 文脈に応じた柔軟な判断が必要だから |
| **機密保護・危険コマンド禁止** | **フック**（`PreToolUse`） | 1回のうっかりミスも許されないから |
| **コード整形・構文チェック** | **フック**（`PostToolUse`） | AI に考えさせるより機械で自動処理する方が速くて確実だから |
| **完了前のテスト・要件チェック** | **フック**（`Stop`） | 客観的なプログラム判定で「やり残しゼロ」を保証できるから |

---

## 関連ドキュメント

- **フックの基本とライフサイクル** → [00_hook-guide.md](file:///c:/git_home/agent-study/hook-guide/docs/00_hook-guide.md)
- **GitHub Copilot / VS Code での使い方** → [01_copilot-hook-guide.md](file:///c:/git_home/agent-study/hook-guide/docs/01_copilot-hook-guide.md)
- **コピペ用サンプル集（5種）** → [samples/README.md](file:///c:/git_home/agent-study/hook-guide/samples/README.md)
