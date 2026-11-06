# 設計書：山田 太郎 自己紹介ページ

## 0. 前提・全体ルール

- 1枚の HTML ファイル（`work/output/index.html`）として納品する。現場監督が3部品を統合する。
- **外部ライブラリ・外部フォント・外部画像は一切使わない**。ブラウザでファイルを開くだけで動くこと。
- 言語は日本語（`<html lang="ja">`）。
- 統合時の構造（監督が作る。各担当はこの外側を書かないこと）：
  ```html
  <!DOCTYPE html>
  <html lang="ja">
  <head> meta charset / viewport / title / <style>style.css の中身</style> </head>
  <body>
    body.html の中身
    <script>script.js の中身</script>   ← body の最後
  </body>
  </html>
  ```
- script は body の末尾に置くので、実行時には DOM は構築済み。
- テーマは `<html>` 要素（`document.documentElement`）の `data-theme` 属性で切り替える（`"light"` / `"dark"`）。
- JS 有効時、JS は最初に `<html>` に class `js` を付ける。CSS は `.js .reveal` のときだけ非表示にする（JS 無効でも内容が読めるように）。
- `prefers-reduced-motion: reduce` のときはアニメーションを省略（CSS はトランジションを無効化、JS はタイプライター・カウントアップを即時に最終状態にする）。

## 1. ページの目的

週末フォトグラファー／社内エンジニアの「山田 太郎」の人となりを、落ち着いたオシャレな1枚ページで伝える。

## 2. 掲載内容

- 名前：山田 太郎（やまだ たろう）
- 肩書き：週末フォトグラファー／社内エンジニア
- 趣味：登山と写真。これまでに登った山は 3,000m 級を含めて 42 座
- 得意なこと：Python、Web 制作、写真の現像（RAW 現像）
- ひとこと：山頂で飲むコーヒーが一番おいしいと思っています

## 3. セクション構成と HTML 構造（id / class の約束事）

以下の id / class / data 属性は **HTML・CSS・JS 共通の約束事**。名前を変えたり追加の必須クラスを勝手に作ったりしないこと（装飾用の補助クラスを CSS/HTML 間で追加するのは、両方が必要としないものに限り不可。必要なら下表に無いものは使わない）。

### 3-1. ヘッダー（固定ナビ）

```html
<header class="site-header" id="site-header">
  <nav class="site-nav" aria-label="メインナビゲーション">
    <a class="site-logo" href="#hero">Taro Yamada</a>
    <ul class="nav-list">
      <li><a class="nav-link" href="#profile">Profile</a></li>
      <li><a class="nav-link" href="#skills">Skills</a></li>
      <li><a class="nav-link" href="#gallery">Gallery</a></li>
      <li><a class="nav-link" href="#contact">Contact</a></li>
    </ul>
    <button class="theme-toggle" id="theme-toggle" type="button"
            aria-label="ダークモードに切り替え" aria-pressed="false">
      <span class="theme-toggle-icon" aria-hidden="true">☾</span>
    </button>
  </nav>
</header>
```

- 現在地のナビリンクには JS が class `is-active` と `aria-current="true"` を付ける。
- テーマボタン：ダーク時は JS が `aria-pressed="true"`、`aria-label="ライトモードに切り替え"`、アイコン文字を `☀` にする。ライト時は `aria-pressed="false"`、`aria-label="ダークモードに切り替え"`、アイコン `☾`。

### 3-2. 本文ラッパー

```html
<main id="main">
  ...各 section...
</main>
```

全セクション共通：`<section class="section" id="...">`。中身は `<div class="section-inner reveal">` で包む（中央寄せ・最大幅用、かつふわっと表示の対象）。
見出しは `<h2 class="section-title">` 、その上に小さな英字ラベル `<p class="section-label">`。

### 3-3. ヒーロー `#hero`

```html
<section class="section hero" id="hero">
  <div class="section-inner hero-inner reveal">
    <p class="hero-greeting">Hello, I'm</p>
    <h1 class="hero-name">山田 太郎<span class="hero-kana">やまだ たろう</span></h1>
    <p class="hero-title">週末フォトグラファー／社内エンジニア</p>
    <p class="hero-tagline" aria-label="山頂で飲むコーヒーが一番おいしいと思っています">
      <span class="typewriter" id="typewriter" aria-hidden="true"
            data-text="山頂で飲むコーヒーが一番おいしいと思っています"></span><span class="typewriter-cursor" aria-hidden="true"></span>
    </p>
    <a class="hero-scroll" href="#profile">Scroll</a>
  </div>
</section>
```

- `#typewriter` は初期状態で空。JS が `data-text` を1文字ずつ（約 90ms 間隔、開始は約 600ms 後）書き込む。
- 書き終わったら JS が `#typewriter` に class `is-done` を付ける（CSS はカーソル点滅を続けて良い）。
- `.typewriter-cursor` は CSS で縦棒カーソルを描き、点滅させる。
- ヒーローは画面高さいっぱい（min-height: 100vh 相当、`100svh` 併用可）。背景は CSS のグラデーションで山の稜線をイメージ（画像不可）。

### 3-4. プロフィール `#profile`

```html
<section class="section profile" id="profile">
  <div class="section-inner reveal">
    <p class="section-label">About</p>
    <h2 class="section-title">プロフィール</h2>
    <div class="profile-body">
      <div class="profile-text">
        <p>（自己紹介文 2〜3段落。平日は社内エンジニアとして Python や Web 制作、週末はカメラを担いで山へ…など。内容は 2. 掲載内容に沿う）</p>
      </div>
      <div class="profile-stat">
        <p class="stat-label">これまでに登った山</p>
        <p class="stat-value"><span class="count-number" id="mountain-count" data-target="42">0</span><span class="count-unit">座</span></p>
        <p class="stat-note">3,000m 級を含む</p>
      </div>
    </div>
  </div>
</section>
```

- JS：`#mountain-count` が画面に入ったら（1回だけ）0 → `data-target` まで約 1.6 秒で、easeOut でカウントアップ。
- PC では `.profile-body` は2カラム（文章：統計 ≒ 3:2）、480px 以下で1カラム。

### 3-5. スキル `#skills`

```html
<section class="section skills" id="skills">
  <div class="section-inner reveal">
    <p class="section-label">Skills</p>
    <h2 class="section-title">得意なこと</h2>
    <ul class="skill-list" id="skill-list">
      <li class="skill-item">
        <div class="skill-header">
          <span class="skill-name">Python</span>
          <span class="skill-value">85%</span>
        </div>
        <div class="skill-bar" role="progressbar" aria-label="Python" aria-valuemin="0" aria-valuemax="100" aria-valuenow="85">
          <div class="skill-bar-fill" data-level="85"></div>
        </div>
      </li>
      <!-- 同形式で：Web 制作 75 / RAW 現像 80 / 山岳写真 90 -->
    </ul>
  </div>
</section>
```

- スキル項目は 4 つ：Python 85 / Web 制作 75 / RAW 現像 80 / 山岳写真 90。
- CSS：`.skill-bar-fill` の初期 `width: 0`、`transition: width 1.2s ease-out`。
- JS：`#skill-list` が画面に入ったら（1回だけ）各 `.skill-bar-fill` の `style.width` を `data-level + "%"` にする。項目ごとに 150ms ずつ遅らせる（`transition-delay` を JS で設定して良い）。

### 3-6. 好きな山ギャラリー `#gallery`

```html
<section class="section gallery" id="gallery">
  <div class="section-inner reveal">
    <p class="section-label">Gallery</p>
    <h2 class="section-title">好きな山</h2>
    <p class="section-lead">カードをクリックすると大きく表示します。</p>
    <ul class="gallery-grid">
      <li>
        <button class="gallery-card" type="button" data-mountain="1"
                data-desc="（山の短い説明 1〜2文）" aria-haspopup="dialog">
          <span class="gallery-art mountain-1" aria-hidden="true"></span>
          <span class="gallery-caption">
            <span class="gallery-name">富士山</span>
            <span class="gallery-meta">3,776m ／ 静岡・山梨</span>
          </span>
        </button>
      </li>
      <!-- 以下同形式で 6 枚 -->
    </ul>
  </div>
</section>
```

6 枚の内容（`data-mountain` と `mountain-N` は一致させる）：

| N | gallery-name | gallery-meta | 雰囲気（CSS グラデーション） |
|---|---|---|---|
| 1 | 富士山 | 3,776m ／ 静岡・山梨 | 夜明け：藍→薄紅の空、雪をかぶった三角の山 |
| 2 | 北岳 | 3,193m ／ 山梨 | 澄んだ青空と濃緑の稜線 |
| 3 | 槍ヶ岳 | 3,180m ／ 長野・岐阜 | 夕焼けの橙、尖った黒いシルエット |
| 4 | 奥穂高岳 | 3,190m ／ 長野・岐阜 | 灰青の岩稜、霧がかった重なり |
| 5 | 立山 | 3,015m ／ 富山 | 残雪の白と若草色、明るい空 |
| 6 | 赤岳 | 2,899m ／ 長野・山梨 | 秋の紅葉色（赤茶〜金）の山肌と薄青の空 |

- `data-desc` は HTML 担当が各山 1〜2 文で書く（登った思い出風）。
- CSS：`.mountain-1`〜`.mountain-6` に、`linear-gradient` / `radial-gradient` を重ねて「空＋山の稜線」を表現（`clip-path` や疑似要素も可）。**このクラスは `.gallery-art` と `.lightbox-art` の両方で同じ見た目になるよう、要素に依存しないセレクタで書く**（`.mountain-1 { ... }`）。
- `.gallery-art` はアスペクト比 4:3。カードはホバーで少し浮く。
- グリッド：PC 3列、〜768px 2列、〜480px 1列。

#### ライトボックス（拡大表示）— `</main>` の直後、`<footer>` の前に置く

```html
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true"
     aria-labelledby="lightbox-title" hidden>
  <div class="lightbox-backdrop" data-close></div>
  <div class="lightbox-content">
    <button class="lightbox-close" id="lightbox-close" type="button" aria-label="閉じる" data-close>×</button>
    <div class="lightbox-art" id="lightbox-art" aria-hidden="true"></div>
    <div class="lightbox-text">
      <h3 class="lightbox-title" id="lightbox-title"></h3>
      <p class="lightbox-meta" id="lightbox-meta"></p>
      <p class="lightbox-desc" id="lightbox-desc"></p>
    </div>
  </div>
</div>
```

- JS（開く）：`.gallery-card` クリックで
  - `#lightbox-art` の className を `"lightbox-art mountain-" + data-mountain` にする
  - `#lightbox-title` ← カード内 `.gallery-name` のテキスト、`#lightbox-meta` ← `.gallery-meta`、`#lightbox-desc` ← `data-desc`
  - `#lightbox` の `hidden` を外し、次フレームで class `is-open` を付ける（フェード用）
  - `<body>` に class `is-locked` を付ける（スクロール禁止）
  - フォーカスを `#lightbox-close` へ移す
- JS（閉じる）：`[data-close]` クリック、または Esc キーで `is-open` を外し、約 250ms 後に `hidden` を付ける。`body.is-locked` を外し、開いたカードにフォーカスを戻す。
- 開いている間は Tab キーのフォーカスをライトボックス内に留める（簡易で良い）。
- CSS：`.lightbox` は `position: fixed; inset: 0;` で最前面（z-index はヘッダーより上）。`[hidden]` 時は `display: none`。`.is-open` で opacity 0→1、`.lightbox-content` が scale 0.96→1。`.lightbox-art` は幅いっぱい・アスペクト比 16:10。`.lightbox-content` は最大幅 880px、画面幅 480px 以下では左右余白 16px。

### 3-7. 連絡先 `#contact`

```html
<section class="section contact" id="contact">
  <div class="section-inner reveal">
    <p class="section-label">Contact</p>
    <h2 class="section-title">連絡先</h2>
    <p class="section-lead">撮影や登山のお誘い、お気軽にどうぞ。</p>
    <ul class="contact-list">
      <li><a class="contact-link" href="mailto:taro.yamada@example.com"><span class="contact-kind">Mail</span><span class="contact-value">taro.yamada@example.com</span></a></li>
      <li><a class="contact-link" href="https://example.com/x/taro_yamada" target="_blank" rel="noopener noreferrer"><span class="contact-kind">X</span><span class="contact-value">@taro_yamada</span></a></li>
      <li><a class="contact-link" href="https://example.com/instagram/taro.mountain" target="_blank" rel="noopener noreferrer"><span class="contact-kind">Instagram</span><span class="contact-value">@taro.mountain</span></a></li>
      <li><a class="contact-link" href="https://example.com/github/taro-yamada" target="_blank" rel="noopener noreferrer"><span class="contact-kind">GitHub</span><span class="contact-value">taro-yamada</span></a></li>
    </ul>
  </div>
</section>
```

（すべてダミー。ドメインは example.com のみ使用）

### 3-8. フッター（`#lightbox` の後）

```html
<footer class="site-footer">
  <p class="footer-text"><small>&copy; 2026 Taro Yamada</small></p>
</footer>
```

### 3-9. 状態クラス・属性まとめ（JS が付け外しする）

| 対象 | クラス／属性 | 意味 |
|---|---|---|
| `<html>` | class `js` | JS 有効（最初に付与） |
| `<html>` | `data-theme="light" / "dark"` | テーマ |
| `.reveal` | class `is-visible` | 画面に入った（ふわっと表示、1回だけ） |
| `.nav-link` | class `is-active` + `aria-current="true"` | 現在のセクション |
| `.site-header` | class `is-scrolled` | スクロール量 > 10px（影・背景を濃くする） |
| `#typewriter` | class `is-done` | タイピング完了 |
| `.skill-bar-fill` | `style.width` | バーの長さ |
| `#lightbox` | `hidden` / class `is-open` | ライトボックス表示 |
| `<body>` | class `is-locked` | 背景スクロール禁止 |

## 4. 見た目のルール

### 配色（CSS カスタムプロパティで定義。`:root` がライト、`[data-theme="dark"]` がダーク）

| 変数 | ライト | ダーク | 用途 |
|---|---|---|---|
| `--color-bg` | `#f4efe4`（生成り） | `#121a15` | ページ背景 |
| `--color-surface` | `#fbf8f1` | `#1b2720` | カード・セクション背景 |
| `--color-text` | `#2a2f2a` | `#ebe5d6` | 本文 |
| `--color-muted` | `#6b6f63` | `#a5a99c` | 補足文字 |
| `--color-primary` | `#2f4f3a`（深緑） | `#8db597` | 見出し・リンク・バー |
| `--color-primary-strong` | `#1e3528` | `#b5d4bc` | ホバー |
| `--color-accent` | `#b08a52`（真鍮色） | `#d4b47e` | ラベル・アクセント線 |
| `--color-border` | `rgba(47,79,58,.15)` | `rgba(235,229,214,.12)` | 罫線 |
| `--shadow` | `0 10px 30px rgba(30,53,40,.10)` | `0 10px 30px rgba(0,0,0,.40)` | カード影 |

- テーマ切替時に背景色・文字色が 0.3s でなめらかに変わる。
- OS 設定がダークで、保存値が無ければダーク（JS 側で決定）。

### フォント（外部フォント不可）

- 見出し（`.hero-name`, `.section-title`, `.lightbox-title`）：`"Hiragino Mincho ProN", "Yu Mincho", "YuMincho", serif`
- 本文：`"Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", "YuGothic", "Meiryo", sans-serif`
- 英字ラベル（`.section-label`, `.hero-greeting`, `.site-logo`, `.nav-link`）：上記本文フォント、`letter-spacing: .2em`、小さめ・大文字。

### レイアウト

- 余白多め：セクションの上下 padding は PC 120px 前後、480px 以下で 72px 前後。
- `.section-inner` は最大幅 1040px、左右 padding 24px（480px 以下 16px）。
- 固定ヘッダーの高さは 64px。`html { scroll-behavior: smooth; scroll-padding-top: 64px; }`（reduced-motion 時は smooth 無効）。
- ブレークポイント：`768px`、`480px`。480px 以下で横スクロールが発生しないこと。
- 480px 以下のナビ：`.site-logo` は表示したまま小さく、`.nav-list` は文字を小さくし、収まらなければ `.nav-list` 内だけ横スクロール可（ハンバーガーは作らない）。
- `.section-label` はアクセント色、ラベルの左に短い横線（疑似要素）。
- `.reveal`（`.js` 下）：初期 `opacity: 0; transform: translateY(24px)`、`.is-visible` で `opacity: 1; transform: none`、0.8s ease。
- ヒーローの文字サイズ：`.hero-name` は `clamp(2.4rem, 7vw, 4.5rem)`。

## 5. JS で実現する動き（script.js）

1. `<html>` に `js` クラス付与。
2. テーマ：`localStorage` の `"theme"` キー → 無ければ `prefers-color-scheme` で初期値決定し `data-theme` を設定。`#theme-toggle` クリックで切替・保存し、ボタンの aria/アイコンを更新（3-1 参照）。`localStorage` が使えない環境（file:// で例外など）でも落ちないよう try/catch。
3. ヘッダー：スクロール量 > 10px で `.site-header` に `is-scrolled`。
4. ナビ現在地：IntersectionObserver で `main > section[id]` を監視し、画面中央付近にあるセクションに対応する `.nav-link`（`href="#id"`）へ `is-active` と `aria-current="true"` を付ける（他は外す）。`#hero` のときはどれも強調しない。
5. ふわっと表示：`.reveal` を IntersectionObserver で監視し、入ったら `is-visible` を付けて監視解除。IntersectionObserver 非対応なら全部に即 `is-visible`。
6. タイプライター（3-3）。
7. カウントアップ（3-4）。
8. スキルバー（3-5）。
9. ライトボックス（3-6）。
10. reduced-motion 時は 6〜8 を即時に最終状態に。
- グローバル汚染を避けるため全体を IIFE で包む。`"use strict"`。外部ライブラリ禁止。

## 6. 担当表

| 担当 | ファイル | 書く範囲 |
|---|---|---|
| markup-builder | `work/parts/body.html` | `<body>` の中身だけ（header〜footer、lightbox 含む）。`<html>`/`<head>`/`<body>`/`<style>`/`<script>` タグは書かない。インライン style・インライン JS 禁止。 |
| style-builder | `work/parts/style.css` | CSS のみ（`<style>` タグは書かない）。上記の id/class/状態クラスすべてに対応。 |
| script-builder | `work/parts/script.js` | JS のみ（`<script>` タグは書かない）。上記の id/class/状態クラスを使う。 |
