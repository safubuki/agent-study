@AGENTS.md

## Claude Code だけの補足

- 部署ごとの約束は `firmware/CLAUDE.md`・`app/CLAUDE.md` と `.claude/rules/`（`paths` で対象を限定）にある。
  該当フォルダのファイルを触ったときに自動で読み込まれる。
- firmware の変更レビューを頼まれたら、専用エージェント `fw-reviewer`（スキル `fw-timing-review` を事前読み込み済み）に任せる。
