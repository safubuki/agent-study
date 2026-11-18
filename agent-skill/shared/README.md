# 共通の道具（Claude Code・GitHub Copilot のどちらでも使う）

製品に依存しない道具をまとめています。どれも Node.js 標準機能だけで動きます。

| フォルダ | 内容 | 解説 |
|---|---|---|
| [hooks/log-skill-usage.js](hooks/log-skill-usage.js) | スキル利用を JSONL に追記するフックのスクリプト（Claude Code・Copilot 両方の入力形に対応） | 設定は [claude/samples/02](../claude/samples/02-skill-usage-log/README.md)・[copilot/samples/02](../copilot/samples/02-skill-usage-log/README.md) |
| [skill-catalog/](#棚卸しskill-catalogjs) | スキルの棚卸し（一覧・点検・説明文の重なり・未使用）と練習用スキル・評価ファイルの例 | [01 の 3・6 章](../01_skill-management-loop.md) |
| [external-assets/](external-assets/README.md) | 大容量データ（CAD・画像・動画）を Box に置き、目録だけを GitHub で管理する例 | [05](../05_large-files-outside-git.md) |

## 棚卸し：skill-catalog.js

```powershell
# 練習用スキルで試す（利用ログつき）
node agent-skill/shared/skill-catalog/skill-catalog.js agent-skill/shared/skill-catalog/demo-skills --usage agent-skill/shared/skill-catalog/data/sample-usage.jsonl

# 自分のスキル集に使う（読み取りだけ。フォルダは複数指定できる。--json で機械可読の結果も保存）
node agent-skill/shared/skill-catalog/skill-catalog.js .github/skills .claude/skills --json catalog.json
```

| 点検 | レベル | 根拠 |
|---|---|---|
| frontmatter が無い／description が無い | error | 説明文が無いと自動では呼ばれない |
| SKILL.md から張ったローカルリンクが切れている | error | 資料を読みに行けない |
| name が「英小文字・数字・ハイフン 64 文字以内」でない／フォルダ名と違う | warn | Agent Skills 標準の命名（VS Code はフォルダ名との一致が必須） |
| description が 1,024 文字を超える | warn | Agent Skills 標準の上限 |
| 本文が 500 行を超える | warn | 公式ベストプラクティスの目安 |
| description に「いつ使うか」の手がかりが無い（手動専用は除く） | info | 説明文は「何をするか＋いつ使うか」 |
| 説明文の重なり：同じ発火キーワード「…」、または文字 2-gram の類似度がしきい値（既定 0.3）以上 | 一覧に表示 | 自動発火の競合候補。手動専用のスキルは対象外 |
| 利用ログに一度も出てこない自動発火スキル（`--usage` 指定時） | 一覧に表示 | 棚卸しの候補 |

`--strict` を付けると error が 1 件でもあれば終了コード 1 になるので、スキル集のリポジトリの PR の必須チェックに入れて「壊れたスキルを配らない」関所にできます。

実際に `turtle-skills-neo` に実行した結果は [03 章の 4 節](../03_request-and-results.md#4-実行結果あなたのスキル集を棚卸ししてみた) にあります。

## 評価ファイルの例

[skill-catalog/demo-skills/meeting-minutes/evals/evals.json](skill-catalog/demo-skills/meeting-minutes/evals/evals.json) は、Agent Skills 標準の評価手順の形式（`prompt`・`expected_output`・`files`・`assertions`）で書いた例です。流れは [01 の 3 章](../01_skill-management-loop.md#3-測る評価ループ) を参照してください。
