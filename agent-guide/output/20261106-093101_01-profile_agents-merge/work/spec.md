# 設計書：山田 太郎 自己紹介ページ

## 0. 前提・統合のしくみ

- 部品は3つ：`work/parts/body.html` / `work/parts/style.css` / `work/parts/script.js`
- 統合スクリプトが次の形で1枚の HTML にまとめる：
  - `<head>` に `<meta charset>`・`<meta viewport>`・`<title>` と `<style>`（style.css の中身）
  - `<body>` の中に body.html の中身、その直後に `<script>`（script.js の中身）
- したがって：
  - **body.html** には `<!doctype>` `<html>` `<head>` `<body>` `<style>` `<script>` タグを書かない。`<body>` の中身だけ。
  - **style.css** に `<style>` タグや `</style` という文字列を書かない。
  - **script.js** に `<script>` タグや `</script` という文字列を書かない。script は body の末尾で実行されるので DOM は存在する（DOMContentLoaded 待ちは不要だが、あっても可）。
- 外部ライブラリ・外部フォント・外部画像は一切使わない（file:// で開くだけで動くこと）。
- 言語は日本語（lang="ja" はスクリプトが付ける）。

## 1. ページの目的

週末フォトグラファー／社内エンジニアの「山田 太郎」の自己紹介ページ。落ち着いた、少しオシャレな1枚ページ。

### 内容データ

- 名前：山田 太郎（ふりがな：やまだ たろう）
- 肩書き：週末フォトグラファー／社内エンジニア
- 趣味：登山と写真。これまでに登った山は 3,000m 級を含めて 42 座
- 得意：Python、Web 制作、写真の現像（RAW 現像）
- ひとこと：山頂で飲むコーヒーが一番おいしいと思っています

## 2. セクション構成と HTML 構造（id / class の約束事）

以下の構造・名前を **HTML / CSS / JS すべてで厳守** する。ここにない id / class を新たに追加してもよいが、それは「担当ファイルの中だけで完結する見た目用」に限る（他の部品がそれに依存してはいけない）。

### 2-1. ヘッダー／固定ナビ

```html
<header class="site-header" id="site-header">
  <nav class="nav" aria-label="ページ内ナビゲーション">
    <a class="nav-logo" href="#hero">Taro Yamada</a>
    <ul class="nav-list">
      <li><a class="nav-link" href="#profile">Profile</a></li>
      <li><a class="nav-link" href="#skills">Skills</a></li>
      <li><a class="nav-link" href="#gallery">Gallery</a></li>
      <li><a class="nav-link" href="#contact">Contact</a></li>
    </ul>
    <button class="theme-toggle" id="theme-toggle" type="button" aria-label="ダークモードに切り替え" aria-pressed="false">
      <span class="theme-toggle-icon" aria-hidden="true">🌙</span>
    </button>
  </nav>
</header>
```

- `.nav-link` の `href` は必ず `#セクションid`。JS はこの href で対応セクションを判定する。
- 現在地の `.nav-link` には JS が **`is-active`** クラスを付ける（同時に `aria-current="true"`）。
- ヒーロー表示中はどの `.nav-link` も `is-active` なしでよい。

### 2-2. 本文

```html
<main>
  <section class="section hero" id="hero"> ... </section>
  <section class="section profile reveal" id="profile"> ... </section>
  <section class="section skills reveal" id="skills"> ... </section>
  <section class="section gallery reveal" id="gallery"> ... </section>
  <section class="section contact reveal" id="contact"> ... </section>
</main>
<footer class="site-footer"> <p>&copy; 2026 Taro Yamada</p> </footer>
<div class="lightbox" id="lightbox" ...> ... </div>
```

各セクションの中身は `<div class="container">` で包み、見出しは `<h2 class="section-title">`。見出しの上に小さな英字ラベル `<p class="section-label">01 — Profile</p>` のような形を置く（ラベル文字は自由）。

#### ① ヒーロー `#hero`

```html
<section class="section hero" id="hero">
  <div class="container hero-inner">
    <p class="hero-kana">やまだ たろう</p>
    <h1 class="hero-name">山田 太郎</h1>
    <p class="hero-title">週末フォトグラファー／社内エンジニア</p>
    <p class="hero-quote">
      <span class="typewriter" id="typewriter" data-text="山頂で飲むコーヒーが一番おいしいと思っています"></span><span class="typewriter-cursor" aria-hidden="true">|</span>
    </p>
    <a class="hero-scroll" href="#profile">Scroll</a>
  </div>
</section>
```

- `#typewriter` は **最初は空**。表示する文は `data-text` 属性に入れておく。
- ヒーローには `reveal` を付けない（最初から見えている）。

#### ② プロフィール `#profile`

```html
<section class="section profile reveal" id="profile">
  <div class="container">
    <p class="section-label">01 — Profile</p>
    <h2 class="section-title">プロフィール</h2>
    <div class="profile-body">
      <div class="profile-text">
        <p>（自己紹介文 2〜3 文。趣味は登山と写真、平日は社内エンジニア、週末は山へ…など）</p>
      </div>
      <div class="profile-stat">
        <p class="stat-number"><span class="counter" id="mountain-counter" data-target="42">0</span><span class="stat-unit">座</span></p>
        <p class="stat-caption">これまでに登った山（3,000m 級を含む）</p>
      </div>
    </div>
  </div>
</section>
```

- `.counter` の初期表示は `0`、目標値は `data-target`（数値）。

#### ③ スキル `#skills`

```html
<section class="section skills reveal" id="skills">
  <div class="container">
    <p class="section-label">02 — Skills</p>
    <h2 class="section-title">スキル</h2>
    <ul class="skill-list">
      <li class="skill-item">
        <div class="skill-head">
          <span class="skill-name">Python</span>
          <span class="skill-percent">85%</span>
        </div>
        <div class="skill-bar"><span class="skill-bar-fill" data-level="85"></span></div>
      </li>
      ...（全4項目）
    </ul>
  </div>
</section>
```

スキル項目（この順・この値）：

| skill-name | data-level |
|---|---|
| Python | 85 |
| Web 制作 | 75 |
| RAW 現像 | 80 |
| 登山 | 90 |

- `.skill-bar-fill` は CSS で初期幅 `0`。JS がセクション表示時に `style.width = data-level + '%'` を設定する。幅の変化は CSS の `transition` でアニメーションさせる。

#### ④ 好きな山ギャラリー `#gallery`

```html
<section class="section gallery reveal" id="gallery">
  <div class="container">
    <p class="section-label">03 — Gallery</p>
    <h2 class="section-title">好きな山</h2>
    <ul class="gallery-grid">
      <li>
        <button class="gallery-card mountain-1" type="button" data-title="北岳" data-desc="標高 3,193m。日本第二の高峰。">
          <span class="card-art" aria-hidden="true"></span>
          <span class="card-caption">
            <span class="card-title">北岳</span>
            <span class="card-meta">3,193m · 山梨県</span>
          </span>
        </button>
      </li>
      ...（全6枚）
    </ul>
  </div>
</section>
```

カード（この順・この class）：

| class | data-title | card-meta | data-desc（例） | 雰囲気（CSS グラデーション） |
|---|---|---|---|---|
| mountain-1 | 北岳 | 3,193m · 山梨県 | 日本第二の高峰。夏の稜線はお花畑。 | 朝焼け（淡いピンク〜橙の空、濃緑の稜線） |
| mountain-2 | 槍ヶ岳 | 3,180m · 長野県/岐阜県 | 天を突く穂先が目印。 | 青空と鋭い岩峰（青〜灰） |
| mountain-3 | 木曽駒ヶ岳 | 2,956m · 長野県 | 千畳敷カールの景色が見事。 | 夏の緑（若草〜深緑） |
| mountain-4 | 燕岳 | 2,763m · 長野県 | 白い花崗岩と北アルプスの女王。 | 夕暮れ（紫〜金） |
| mountain-5 | 谷川岳 | 1,977m · 群馬県/新潟県 | 紅葉の季節が特に美しい。 | 紅葉（赤〜橙〜茶） |
| mountain-6 | 八ヶ岳・赤岳 | 2,899m · 長野県/山梨県 | 冬の雪山登山で何度も通った山。 | 雪山（白〜水色の空と夜明け前の藍） |

- `.gallery-card` は `<button>`。JS はクリック時に `data-title` / `data-desc` と、カードの mountain-N クラスを使ってライトボックスを開く。
- `.card-art` の見た目は CSS が `.mountain-N .card-art` に対して描く（グラデーション + `clip-path` 等で山の稜線シルエットを表現）。

#### ⑤ 連絡先 `#contact`

```html
<section class="section contact reveal" id="contact">
  <div class="container">
    <p class="section-label">04 — Contact</p>
    <h2 class="section-title">連絡先</h2>
    <p class="contact-lead">山や写真の話、お気軽にどうぞ。</p>
    <ul class="contact-list">
      <li><a class="contact-link" href="mailto:taro.yamada@example.com">Mail <span class="contact-sub">taro.yamada@example.com</span></a></li>
      <li><a class="contact-link" href="#" data-dummy="true">Instagram <span class="contact-sub">@taro_yama_photo</span></a></li>
      <li><a class="contact-link" href="#" data-dummy="true">X <span class="contact-sub">@taro_yamada</span></a></li>
      <li><a class="contact-link" href="#" data-dummy="true">GitHub <span class="contact-sub">taro-yamada</span></a></li>
    </ul>
  </div>
</section>
```

- `data-dummy="true"` のリンクは JS がクリック時に `preventDefault()` する（ページ先頭に飛ばないように）。

#### ライトボックス（拡大表示）

`</main>` と `<footer>` の後、body の最後に置く。

```html
<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-labelledby="lightbox-title" hidden>
  <div class="lightbox-backdrop" data-close="true"></div>
  <div class="lightbox-content">
    <button class="lightbox-close" id="lightbox-close" type="button" aria-label="閉じる" data-close="true">&times;</button>
    <div class="lightbox-art" id="lightbox-art"></div>
    <h3 class="lightbox-title" id="lightbox-title"></h3>
    <p class="lightbox-desc" id="lightbox-desc"></p>
  </div>
</div>
```

- 初期状態は `hidden` 属性つき。
- JS が開くとき：`hidden` を外し、次フレームで `.lightbox` に **`is-open`** を付ける（CSS でフェード＋拡大）。`#lightbox-art` の className を `lightbox-art mountain-N` に設定。
- 閉じるとき：`is-open` を外し、トランジション後（約 300ms）に `hidden` を戻す。
- CSS は `.lightbox-art.mountain-N` にもカードと同じグラデーション／シルエットを描く（**`.mountain-N .card-art` と `.lightbox-art.mountain-N` の両方に同じ見た目が出るようにセレクタを書く**）。
- CSS は `.lightbox[hidden] { display: none; }` を必ず入れる。

## 3. JS が付け外しするクラス・属性（状態クラス一覧）

| 対象 | クラス / 属性 | 意味 |
|---|---|---|
| `<html>`（document.documentElement） | `data-theme="dark"` / `data-theme="light"` | テーマ。CSS は `[data-theme="dark"]` で変数を切り替える |
| `.reveal` | `is-visible` | 画面に入ったらふわっと表示 |
| `.nav-link` | `is-active` | 現在地の強調 |
| `.site-header` | `is-scrolled` | 少しスクロールしたら背景に影・不透明度を付ける |
| `.lightbox` | `is-open` | ライトボックス表示中 |
| `<body>` | `is-locked` | ライトボックス表示中は背面スクロール禁止（CSS: `overflow: hidden`） |
| `.skill-bar-fill` | `style.width` | 表示時に data-level% を設定 |

## 4. 見た目のルール（style-builder 向け）

### 配色（CSS カスタムプロパティで定義し、`:root` がライト、`[data-theme="dark"]` がダーク）

| 変数 | ライト | ダーク |
|---|---|---|
| `--color-bg` | `#f4efe4`（生成り） | `#121a16` |
| `--color-surface` | `#fbf8f1` | `#1b2620` |
| `--color-text` | `#1f2a24` | `#e9e4d8` |
| `--color-muted` | `#6b7068` | `#9aa59d` |
| `--color-primary` | `#1f4d3a`（深い緑） | `#7fb89a` |
| `--color-accent` | `#b8894a`（真鍮色） | `#d4a866` |
| `--color-border` | `rgba(31,77,58,0.15)` | `rgba(233,228,216,0.12)` |

- `prefers-color-scheme: dark` の場合、JS が初期に `data-theme="dark"` を設定する（CSS 側でメディアクエリを書く必要はない）。
- テーマ切り替え時は背景色・文字色を `transition`（0.3s 程度）でなめらかに。

### フォント（外部フォント禁止）

- 本文：`"Hiragino Sans", "Yu Gothic UI", "Yu Gothic", "Meiryo", system-ui, sans-serif`
- 見出し・名前・英字ラベル：`"Hiragino Mincho ProN", "Yu Mincho", "YuMincho", serif`（落ち着いた明朝で上品に）
- `.section-label`：小さめ・字間広め（letter-spacing: 0.2em 程度）・アクセント色・大文字

### レイアウト

- `.container`：max-width 960px、左右 padding 24px、中央寄せ
- `.section`：上下 padding たっぷり（デスクトップ 120px 前後、スマホ 72px 前後）
- `.hero`：`min-height: 100vh`（100svh 併記可）、中央寄せ、背景は深緑系のやわらかいグラデーション＋下部に CSS で描いた山の稜線（擬似要素）があると良い
- `.site-header`：`position: fixed; top: 0;` 全幅、半透明背景＋`backdrop-filter: blur()`。`html { scroll-behavior: smooth; }` と、各 section に `scroll-margin-top`（ヘッダー高さ分）を設定
- `.nav-link.is-active`：primary 色＋下線（アクセント色）で強調
- `.profile-body`：デスクトップは2カラム（文章 / 数字）、スマホは1カラム
- `.stat-number`：大きな明朝数字（4〜5rem）、primary 色
- `.skill-bar`：高さ 8px 程度・角丸・border 色の背景。`.skill-bar-fill`：`width: 0; transition: width 1.2s cubic-bezier(.2,.8,.2,1);` primary→accent のグラデーション
- `.gallery-grid`：`display: grid; grid-template-columns: repeat(3, 1fr);` タブレット（〜768px）2列、スマホ（〜480px）1列
- `.gallery-card`：button の既定スタイルをリセット（border/背景/padding）、角丸、ホバーで少し浮く（transform + shadow）、`:focus-visible` のアウトライン
- `.card-art`：aspect-ratio 4/3 程度
- `.typewriter-cursor`：点滅アニメーション（@keyframes）
- `.reveal`：初期 `opacity: 0; transform: translateY(32px);`、`.reveal.is-visible` で `opacity: 1; transform: none;`（transition 0.8s 程度）
- `@media (prefers-reduced-motion: reduce)` ではアニメーション・トランジションを抑える（reveal は最初から見える状態に）
- `.theme-toggle`：丸いボタン（40px 程度）、ボーダー付き
- スマホ（〜480px）：ナビは崩れないよう `.nav-logo` を小さく、`.nav-list` の間隔を詰める（文字サイズ 0.8rem 程度）。横スクロールが発生しないこと。`.hero-name` は `clamp()` で縮む。

## 5. JS で実現する動き（script-builder 向け）

すべて素の JavaScript（ES2017 程度）。グローバル汚染を避けるため即時関数または `{ }` ブロックで包む。

1. **テーマ切り替え**
   - 初期値：`localStorage.getItem('theme')` → なければ `matchMedia('(prefers-color-scheme: dark)')` → それもなければ light。`document.documentElement.dataset.theme` に設定。
   - `#theme-toggle` クリックで light/dark を反転、localStorage に保存（file:// で localStorage が使えない場合に備え try/catch）。
   - ボタンのアイコン `.theme-toggle-icon`：ライト時 `🌙`、ダーク時 `☀️`。`aria-pressed`（dark で true）と `aria-label`（「ダークモードに切り替え」／「ライトモードに切り替え」）も更新。
2. **タイプライター**
   - `#typewriter` の `data-text` を 1 文字ずつ（約 90ms 間隔）`textContent` に追加。ページ読み込み後 600ms 程度待ってから開始。
   - reduced-motion 時は全文を即表示。
3. **スクロール出現**
   - `IntersectionObserver` で `.reveal` を監視し、画面に入ったら `is-visible` を付け、unobserve。threshold 0.15 程度。
   - IntersectionObserver 非対応時はすべてに即 `is-visible`。
4. **カウントアップ**
   - `#mountain-counter` が画面に入ったら、0 → `data-target`（42）まで約 1.6 秒で easeOutCubic で増やす（requestAnimationFrame）。1回だけ。
5. **スキルバー**
   - `#skills` が画面に入ったら、各 `.skill-bar-fill` の `style.width` を `data-level + '%'` に設定（少しずつ遅延をずらすと良い：index × 150ms）。1回だけ。
6. **ナビの現在地強調**
   - `IntersectionObserver`（rootMargin `-45% 0px -50% 0px` 程度）で `section[id]` を監視し、画面中央付近のセクションの id に一致する `.nav-link`（`href="#id"`）に `is-active` と `aria-current="true"`、他からは除去。
   - `#hero` が中央のときは全部外す。
7. **ヘッダーの影**
   - `window.scrollY > 10` で `.site-header` に `is-scrolled`（scroll イベントは passive）。
8. **ライトボックス**
   - `.gallery-card` クリックで開く。`data-title`→`#lightbox-title`、`data-desc`→`#lightbox-desc`、カードの `mountain-N` クラスを `#lightbox-art` に付与。
   - `body` に `is-locked`。開いたら `#lightbox-close` にフォーカス、閉じたら元のカードにフォーカスを戻す。
   - 閉じる操作：`[data-close="true"]` 要素のクリック、Esc キー。
   - 開閉の手順は 2-2 の「ライトボックス」に従う（hidden ⇄ is-open）。
9. **ダミーリンク**
   - `a[data-dummy="true"]` のクリックは `preventDefault()`。

## 6. 担当表

| 担当 | ファイル | 範囲 |
|---|---|---|
| markup-builder | `work/parts/body.html` | `<body>` の中身のみ（header / main / footer / lightbox）。インラインの style・script・onclick は書かない |
| style-builder | `work/parts/style.css` | 全スタイル。`<style>` タグは書かない |
| script-builder | `work/parts/script.js` | 全ての動き。`<script>` タグは書かない。HTML 文字列を大量生成しない（既存要素を操作する） |
