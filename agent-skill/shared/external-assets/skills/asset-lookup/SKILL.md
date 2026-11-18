---
name: asset-lookup
description: 製品 X の 3D CAD・画像・動画など、Git に入れていない大容量データの場所と最新版を、目録 assets.manifest.json から調べる。「CAD データ」「図面」「筐体の形状」「基板の写真」「組立動画」を参照・確認したいときに使う。
---

# 大容量データの参照（Box ＋ 目録）

大容量データの実体は Box にあり、リポジトリには目録 `assets.manifest.json` だけがある。**実体をリポジトリにコピー・コミットしない。**

## 手順

1. 目録から該当する `id` を探す（`kind`・`path`・`note` を見る）。
2. 手元の同期フォルダで実体を確かめる。決まった処理なのでスクリプトに任せる（中身は読まない）：

   ```bash
   node scripts/assets-check.js --manifest assets.manifest.json --id <id>
   ```

   - `OK` なら表示されたフルパスを使う。
   - 「実体のフォルダが分かりません」なら、利用者に Box Drive の場所を聞き、環境変数 `ASSET_ROOT` を設定してもらう。
   - `NG`（見つからない・ハッシュ不一致）なら、目録の `box.url` を示して人に確認を頼む。**目録を AI の判断で書き換えない。**
3. CAD のような AI が直接読めない形式は、中身を推測しない。必要なら、人に寸法の正となる図面（PDF）や書き出しデータを Box から用意してもらう。

## 落とし穴

- GitHub 上で動く cloud agent からは、手元の Box Drive は見えない。cloud agent で使うなら、Box の MCP サーバーや API を、許可した通信先・シークレットと合わせて設定する必要がある（目録だけでも「どれが正か」は判断できる）。
- 新しい大容量データを追加するときは、目録への追記（id・path・bytes・sha256・box.url・owner）を PR で行い、実体は Box に置く。
