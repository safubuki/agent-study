# Copilot 用の補足（リポジトリ全体・ベース層）

> サンプル。共通の約束は ルートの AGENTS.md に書き、ここには Copilot だけに関係することを短く書く。
> AGENTS.md を読まない画面（Visual Studio の Chat など）があるため、最重要の 3 行はここにも重ねて書いておく。

- 校正値（`firmware/calibration/`）は変更しない。必要なら人に依頼する。
- 完了と報告する前に、その部署のテストを実行する。
- 大きなバイナリ（画像・動画・CAD）はコミットしない。

部署ごとの約束は `.github/instructions/*.instructions.md`（`applyTo` に一致するファイルを扱うときに使われる）にある。
