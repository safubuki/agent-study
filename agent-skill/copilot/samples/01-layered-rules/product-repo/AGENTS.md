# 製品 X：AI エージェント向けの約束（ベース層・各ツール共通）

> サンプル（agent-skill/copilot/samples/01-layered-rules）。GitHub Copilot・Codex・Claude Code が共通で読める
> AGENTS.md に、製品として「毎回必ず知っておくべき事実と約束」だけを書く。手順書はスキルへ。

## 製品の概要

- 製品 X はモーター制御基板（`firmware/`）と設定アプリ（`app/`）からなる。
- `firmware/` は制御ソフト課、`app/` はアプリ課の担当。部署の約束は `.github/instructions/` の指示ファイル（`applyTo` で対象を限定）にある。

## 毎回守ること

- 変更したら、その部署のテストを実行してから完了と報告する（`firmware/`：`make test`、`app/`：`npm test`）。
- `firmware/calibration/` の校正値は変更しない。変更が必要なら、理由と影響を書いて人に依頼する。
  （`.github/hooks/` の保護フックで機械的にも止めている。止められたら回避せず、人への依頼文を作る）
- 出荷前チェックは人が `/release-check` で実行する。AI が勝手に出荷判定をしない。
- 画像・動画・3D CAD などの大きなファイルはリポジトリに入れない（Box に置き、`assets.manifest.json` で参照する）。

## どの手順書（スキル）を使うか

| こんなとき | 使うもの |
|---|---|
| firmware の制御周期・割り込みを含む変更をレビュー | スキル `fw-timing-review`、または専用エージェント `fw-reviewer` |
| 出荷前の確認 | `/release-check`（人が呼ぶ。自動では呼ばれない） |
