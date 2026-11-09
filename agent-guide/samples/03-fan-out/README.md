# 03 同じ仕事を並列に（ファンアウト）

親が製品をパーツに分け、**同じ定義の子（part-modeler）をパーツの数だけ呼んで**並列にモデリングさせ、最後に組み立てて数値で検品します。ガイドの [00 の 8.3〜8.6](../../docs/00_subagent-guide.md#8-応用似た作業を並列にする場合cad3d-の部品を組み立てる) に対応します。

## 02 との違い

| | 02 役割で分ける | 03 ファンアウト |
|---|---|---|
| 子の定義ファイル | 役割ごとに3ファイル | **1ファイル（part-modeler）を使い回す** |
| 子の区別 | ファイル（役割）で区別 | **依頼文のパーツ番号**で区別 |
| パーツが増えたら | ファイルを追加 | ファイルはそのまま。呼ぶ回数が増えるだけ |

## 構成

```mermaid
flowchart TB
    U["ユーザー"] --> P["cad-director（親）"]
    P -->|"p1 を作って"| W1["part-modeler"]
    P -->|"p2 を作って"| W2["part-modeler"]
    P -->|"p3 を作って"| W3["part-modeler"]
    W1 --> F1[("work/parts/p1/")]
    W2 --> F2[("work/parts/p2/")]
    W3 --> F3[("work/parts/p3/")]
    F1 --> A["組み立て・検品<br/>（親だけが行う）"]
    F2 --> A
    F3 --> A
    A --> O[("work/output/product.step")]
```

## ファイル

```text
claude-code/.claude/agents/
├─ cad-director.md      ← 親
└─ part-modeler.md      ← 子（1ファイルを N 回使う）
copilot/.github/agents/
├─ cad-director.agent.md
└─ part-modeler.agent.md
```

実行すると、次の作業フォルダができる想定です。

```text
work/
├─ spec.md                 ← 親が書く（共通ルール・占有範囲・合わせ面の表）
├─ parts/
│  ├─ p1/ model.py, p1.step
│  ├─ p2/ model.py, p2.step
│  └─ p3/ model.py, p3.step
├─ assembly/ assemble.py, report.md   ← 親が書く（組み立て・数値検品）
└─ output/ product.step
```

## 呼び出しの流れ

```mermaid
sequenceDiagram
    autonumber
    actor U as ユーザー
    participant P as cad-director
    participant W as part-modeler（パーツごとに別々）
    participant F as work フォルダ

    U->>P: 3つのパーツからなる小物入れを作って
    P->>F: spec.md を書く
    P->>W: p1 / p2 / p3 をそれぞれ依頼（最大5体まで同時）
    W->>F: model.py を書いて実行し、STEP を書き出す
    W->>W: 外形と合わせ面を自分で測って照合
    W-->>P: 報告（実測値・照合結果）
    P->>F: assemble.py で組み立て、干渉・すき間を計算
    opt 不合格のパーツがある
        P->>W: そのパーツだけ差し戻し
        W-->>P: 修正の報告
    end
    P-->>U: product.step と検品結果を報告
```

## 起動

| | 手順 |
|---|---|
| Claude Code | `claude --agent cad-director` で起動し、「本体・フタ・仕切りの3パーツからなる小物入れを作って。外形は 100×60×48 mm」のように頼む |
| Copilot（VS Code） | エージェント選択で `cad-director` を選んで同じように頼む |

## ポイント

- **子に `Bash`（Copilot は `execute`）を与えている**：子が自分でコードを実行して STEP を書き出し、寸法を測ってから報告するため。
- **GUI の CAD は子に触らせない**：子は別プロセスで動くコマンド（`python model.py`）だけを使う。共有の道具は親が最後に使う（ガイド 8.5）。
- **同時は最大5体**：6個以上は波に分けるよう、親の本文に書いてある。それ以上増えるなら 04 の階層化を検討する。

## 前提

- Python と [CadQuery](https://cadquery.readthedocs.io/) がインストールされていること（未インストールなら子がエラーを報告します）。
