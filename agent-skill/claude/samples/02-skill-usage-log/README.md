# サンプル 02：スキル利用ログ（Claude Code）

スキルが「いつ・どれが・AI か人か」で呼ばれたかを JSONL に残す設定です。スクリプト本体は Claude Code・Copilot 共通の [shared/hooks/log-skill-usage.js](../../../shared/hooks/log-skill-usage.js) です。

| 呼ばれ方 | 拾うイベント | 記録される `via` |
|---|---|---|
| AI が説明文を見て自動で呼んだ | `PreToolUse`（matcher: `Skill`） | `model` |
| 人が `/スキル名` と打った | `UserPromptSubmit`（先頭が `/` の依頼） | `user` |

## 使い方

1. `shared/hooks/log-skill-usage.js` を自分のプロジェクトの `hooks/` にコピーする。
2. [.claude/settings.json](.claude/settings.json) の `hooks` を自分の `.claude/settings.json`（全プロジェクトなら `~/.claude/settings.json`）に足す。
3. `.gitignore` に `.skill-usage/` を加える（ログは `$CLAUDE_PROJECT_DIR/.skill-usage/usage.jsonl`）。
4. 2〜4 週間たったら、棚卸しで集計する：`node shared/skill-catalog/skill-catalog.js .claude/skills --usage .skill-usage/usage.jsonl`

依頼文そのものは記録しません。フックはどんな入力でも作業を止めません（常に終了コード 0）。
