# サンプル 02：スキル利用ログ（GitHub Copilot）

スキルが「いつ・どれが・AI か人か」で使われたかを JSONL に残す設定です。スクリプト本体は Claude Code・Copilot 共通の [shared/hooks/log-skill-usage.js](../../../shared/hooks/log-skill-usage.js) です。

| 使われ方 | 拾うイベント | 記録される `via` |
|---|---|---|
| AI がスキルを読み込んだ（推定） | `preToolUse` で、`…/skills/<名前>/SKILL.md` の読み取り（`view`） | `read` |
| 人が `/スキル名` と打った | `userPromptSubmitted`（先頭が `/` の依頼） | `user` |

> [!IMPORTANT]
> Copilot のフック資料には、スキル専用のツール名（Claude Code の `Skill` に当たるもの）が載っていません。そのため「SKILL.md を読んだ」ことで推定しています。画面やバージョンによって読み込み方が違う場合は記録されないことがあるので、**傾向をつかむ目安**として使い、実際の環境で 1 度記録されるか確かめてください。

## 使い方

1. `shared/hooks/log-skill-usage.js` を自分のリポジトリの `hooks/` にコピーする。
2. [.github/hooks/skill-usage.json](.github/hooks/skill-usage.json) を自分のリポジトリの `.github/hooks/` に置く（個人で使うなら `~/.copilot/hooks/`）。
3. `.gitignore` に `.skill-usage/` を加える（ログは作業フォルダの `.skill-usage/usage.jsonl`。環境変数 `SKILL_USAGE_LOG` で変更可）。
4. 2〜4 週間たったら、棚卸しで集計する：`node shared/skill-catalog/skill-catalog.js .github/skills --usage .skill-usage/usage.jsonl`

依頼文そのものは記録しません。フックはどんな入力でも作業を止めません（常に終了コード 0）。GitHub 上の cloud agent ではログが実行環境の中に書かれて残らないため、ローカル（VS Code・CLI）の傾向を見る用途です。
