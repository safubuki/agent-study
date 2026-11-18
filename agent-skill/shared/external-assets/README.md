# 大容量データを Git の外（Box）に置き、仕組みだけを GitHub で管理するサンプル

解説は [05 大容量データは Git の外に置く](../../05_large-files-outside-git.md) にあります。

```text
external-assets/
├─ assets.manifest.json          ← 目録：Git で管理する「どのデータが・どこにあり・どれが正か」
├─ .gitignore.example            ← CAD・動画などをリポジトリに入れないための例
├─ scripts/
│   ├─ assets-check.js           ← 目録と手元の実体（Box Drive）を照合（読み取りだけ）
│   └─ check-large-files.js      ← 大容量データの混入を止める関所（pre-commit・CI・フック用）
├─ skills/asset-lookup/SKILL.md  ← AI が目録から大容量データを引くためのスキル
├─ .github/workflows/check-large-files.yml ← PR ごとのチェック（サンプル）
└─ demo-box-drive/               ← 練習用の「Box Drive の中身」の代わり（小さなテキスト）
```

## 試し方

```powershell
cd agent-skill/shared/external-assets

# 目録と実体を照合（Box Drive の代わりに demo-box-drive を使う）
node scripts/assets-check.js --root demo-box-drive

# 1 件だけ調べてフルパスを得る（スキルから使う形）
node scripts/assets-check.js --root demo-box-drive --id cad-motor-housing

# 大容量データの混入チェック（.step・.mp4 は形式で止まる。デモなので結果は「見つかった」）
node scripts/check-large-files.js demo-box-drive
```

実際の運用では、`ASSET_ROOT` に Box Drive の同期フォルダ（例：`C:\Users\<you>\Box\製品X\技術データ`）を設定します。

> [!NOTE]
> `demo-box-drive/` の中身は、拡張子だけ CAD・画像・動画に見せた数十バイトのテキストです（ハッシュ照合の練習用）。改行コードが変わらないよう `.gitattributes` で `-text` にしています。
