# Copilot 用の補足（L1）

> AGENTS.md を読まない画面に備え、要点だけを重ねて書く。

- 安全停止は `common/safety/` を使い編集しない。停止 100 ms・最大電流 10 A は変えない。`confidential/` は扱わない。
- ルールは「ドメイン（electrical/mechanical/software）」と「部品（parts/<部品>）」の 2 軸で `.github/instructions/` にある。
- 案件の作業では、最初に人が `/case-context <案件番号>` を実行する。案件のルールはファイルの場所では決まらない。
