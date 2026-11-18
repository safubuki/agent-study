# firmware/：制御ソフト課の約束（部署層・入れ子の AGENTS.md）

> サンプル。入れ子の AGENTS.md は「編集中のファイルに一番近いもの」が使われる（AGENTS.md の約束事）。
> ただし Copilot で入れ子を確実に読むのは cloud agent（GitHub 上）など一部の画面。VS Code・CLI での扱いは環境で確認すること。
> 確実に効かせたい約束は `.github/instructions/firmware.instructions.md`（applyTo）にも書いてある。

- ビルドとテストは `make test`（ホスト PC 上のユニットテスト）。
- C99。標準ライブラリの `malloc` は使わない。
