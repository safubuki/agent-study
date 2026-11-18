# 全社 AI ワークスペース：絶対ルール（L1・全員に適用）

> サンプル（agent-skill/copilot/samples/03-ai-workspace）。このリポジトリは、複数の部署が同じ AI 作業環境として使う想定。
> ここに書くのは「どの部署・どの係でも変わらないこと」だけ。部署・係のルールは `.github/instructions/` にある。

## 絶対に守ること（下の階層で変えてはいけない）

1. `confidential/`（社外秘）のファイルは編集しない。中身を他のフォルダや回答に写さない。
2. 顧客や社員の個人情報（氏名・電話・メール）を成果物に書かない。
3. 成果物の冒頭に「作成日・作成者（AI 下書きなら明記）・出典」を書く。
4. 社外に出す文書は、人が `/ws-publish-check` を実行してから出す。

（1・4 は `.github/hooks` と `.github/policies/` で機械的にも止めている。止められたら回避せず、人に依頼する）

## 下の階層（部署・係）で決めてよいこと

| 決めてよいこと | 例 |
|---|---|
| 文体・言語 | です・ます調、英語 |
| 成果物の様式 | 提案書・不具合報告・検査記録の型 |
| 部署の用語・参照する資料 | 価格表、規格書 |
| 追加の禁止事項（厳しくする方向だけ） | 署名済み記録の編集禁止 |

下の階層は**足す・狭めることだけ**ができる。上の「絶対に守ること」を緩める書き方はしない。

## 階層とファイルの対応

| 階層 | 範囲 | 指示 | 強制 |
|---|---|---|---|
| L1 全社 | リポジトリ全体 | この AGENTS.md・`.github/copilot-instructions.md` | `.github/policies/l1-workspace.json` |
| L2 部署 | `departments/<部署>/` | `.github/instructions/l2-dept-*.instructions.md` | `.github/policies/l2-*.json` |
| L3 係 | `departments/<部署>/<係>/` | `.github/instructions/l3-team-*.instructions.md` | `.github/policies/l3-*.json` |

## どのスキルを使うか（索引）

| こんなとき | スキル | 階層 |
|---|---|---|
| 週報を書く | `ws-weekly-report` | L1（全員） |
| 社外に出す前の確認 | `/ws-publish-check`（人が呼ぶ） | L1（全員） |
| 営業の提案書 | `sales-proposal` | L2 営業部 |
| 不具合報告 | `qa-defect-report` | L2 品質保証部 |
| 検査記録 | `qa-inspection-record` | L3 検査係 |
