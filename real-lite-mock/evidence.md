# evidence.md：リアルライトモック資料の正確性検証とエビデンス

このファイルは、`real-lite-mock/` フォルダ内の資料（README・00〜03 章・interactive-guide.html・SVG 図 6 枚）に書かれた主張を一次情報と突き合わせた記録です。
「どこが正確で、どこが誇張・誤りか」と「その根拠（エビデンス）は何か」を後から読み返せるようにまとめています。

- 検証日：2026-11-27
- 検証方法：各主張について、論文本文・公式ドキュメント・提唱者本人の記事などの一次情報を優先して確認。一次情報が読めなかったものは「二次情報」と明記。

---

## 0. 判定の凡例

| 記号 | 意味 |
|---|---|
| ✅ **正確** | 一次情報と一致している |
| 🟡 **おおむね正確（誇張・補足あり）** | 方向性は正しいが、言い過ぎ・対象のズレ・重要な但し書きの抜けがある |
| ⚠️ **不正確（要修正）** | 一次情報と食い違う、または用語の意味を取り違えている |
| 💭 **経験則・意見** | 外部エビデンスはない。筆者の経験や例え話として書くべきもの（間違いではない） |

---

## 1. 結論サマリー（まずここだけ読めば OK）

**手法そのもの（UI から実ツールまで通す → 複数案を比べる → 試作コードは捨てて作り直す）には、古典的なソフトウェア工学と UX 研究のしっかりした裏付けがあります。**
ただし資料の「6 つの裏付け」の書き方には、**名称の取り違えと誇張**がいくつかあります。

| # | 資料の主張 | 判定 | ひとことで |
|---|---|---|---|
| ① | Code-First Prototyping & Single-File HTML Artifacts（Claude Artifacts・v0・Bolt.new で 2025〜26 年に主流化） | 🟡 | 単一 HTML の手法には実例あり。ただし確立した用語ではなく、**v0 と Bolt.new は単一 HTML を作らない**。ツールの登場も 2023〜24 年 |
| ② | Tracer Bullet／Walking Skeleton | 🟡 | 出典は正確。ただし原典では **曳光弾のコードは「捨てない」もの**で、コードを捨てるリアルライトモックとは逆 |
| ③ | Parallel Prototyping（Dow et al., Stanford, 2010） | 🟡 | 論文は実在し、結論の方向も正しい。ただし「大幅に」「証明」は言い過ぎ（33 名・1 実験・差は約 12%）。**同僚に 3 案を比べてもらう効果の根拠としては Tohidi et al. 2006 のほうが的確** |
| ④ | Prototype as Spec／Executable Specification＝仕様駆動開発（SDD）の核心 | ⚠️ | **SDD の説明が逆**。SDD は「文章の仕様書を正（Source of Truth）にする」手法で、「文章の代わりに動く試作を仕様にする」手法ではない |
| ⑤ | Clean-Room Rewrite via Spec Extraction（2025〜26 年に確立した原則） | ⚠️ | 「クリーンルーム設計」は著作権対策の法務手法で、意味が違う。**「確立した原則」の証拠も見つからない**。ただし「試作は捨てて作り直す」考え方自体には Brooks 等の古典的な裏付けがある |
| ⑥ | AI UI パターン体系（NN/g・Apple HIG・Google PAIR・MS HAX）が 7 型を定めた業界標準 | 🟡 | 4 つの出典は実在。ただし **7 型の一覧はどの出典にもなく、このリポジトリ（ui-guide）がまとめた分類**。Tuners は Shape of AI（Emily Campbell）の用語 |
| — | 「6 つの実証済み知見／理論」 | ⚠️ | 実験で確かめられているのは③（と Tohidi 2006）だけ。②は実務の原則、①④⑤は 2023〜26 年の実践・トレンド、⑥は設計ガイドライン |
| — | 「Vibe Hangover（バイブコーディングの二日酔い）と業界で呼ばれる」 | 🟡 | 「vibe coding hangover」という表現はメディア（Fast Company 2025-09）で実際に使われている。ただし AI 生成コード全般の問題を指す言葉で、「単一 HTML への継ぎ足し」を指す専門用語ではない |
| — | デモの罠（The Demo Trap） | 🟡 | 一般的な用語ではないが、現象は Joel Spolsky「The Iceberg Secret, Revealed」（2002）で裏付けられる |
| — | MCP・CLI・PoC の用語説明 | ✅ | 正確 |
| — | 「ローカル AI CLI」でクラウド準備を待たずに検証 | 🟡 | Copilot CLI は手元で動くが、**AI の推論は GitHub のクラウドで行われ、データは社外に出る**。組織で使うには管理者による Copilot CLI ポリシーの有効化が必要 |
| — | 単一 HTML から AI CLI・MCP を叩く | 🟡 | ブラウザの JavaScript から直接コマンドは実行できない。**ローカルの中継サーバー（プロンプト①の `localhost:3000/run-cli` のようなもの）が別途必要**（rlm-03 図には書かれているが、本文では省略されている） |
| — | 3〜4 日、1〜2 分デモ、2〜5 名、「スライド 10 枚より 1 分のデモ」、従来手法の Week 1〜8 | 💭 | 外部の根拠はない。筆者の経験値・例え話として書くべき |

---

## 2. 「6 つの裏付け知見」の詳しい検証

### ① Code-First Prototyping & Single-File HTML Artifacts — 🟡

**資料の記述**（[02:14](02_validity-and-prior-art.md)、[interactive-guide.html:1219](interactive-guide.html)、rlm-05 図）
> 静的デザインツールで絵を描く代わりに、最初から動く単一 HTML を AI で生成して検証する手法。Claude Artifacts や Vercel v0、Bolt.new 等の普及で 2025〜2026 年に主流化。ビルド不要で共有しやすく、AI がエラーなく一括生成しやすい形式。

**エビデンス**
- **単一 HTML を LLM で作るやり方には実例と解説がある**：Simon Willison「Useful patterns for building HTML tools」（2025-12-10）。HTML・JavaScript・CSS を 1 ファイルにまとめた「HTML tools」を、ほぼ LLM に書かせて 150 個以上作ったという記事。React のようなビルドが必要な仕組みを避ける、依存ライブラリは CDN から読み込む、小さく保つ、といった実践パターンが書かれている。→ **「単一 HTML・ビルド不要」の部分の良い裏付け**。
- **各ツールの登場時期**
  - Claude Artifacts：2024-06（Claude 3.5 Sonnet と同時に公開）
  - Vercel v0：2023-09（Product Hunt 掲載 2023-09-14）
  - Bolt.new（StackBlitz）：2024-10 初旬

**ズレ・誤り**
1. 「Code-First Prototyping & Single-File HTML Artifacts」は、業界や学術で確立した名称ではない（この資料のためにつけた名前）。
2. **v0 は React／Next.js の UI を、Bolt.new はブラウザ内の Node.js 環境（WebContainers）でフルスタックのアプリを生成する**。どちらも「単一 HTML」のツールではない。単一 HTML の例として当てはまるのは Claude Artifacts（と Willison の HTML tools）。
3. 「2025〜2026 年に主流化」：ツールの登場は 2023〜2024 年。「主流化」を示す数字の裏付けもない。
4. 「AI がエラーなく一括生成しやすい」：これを確かめた調査は見当たらない。Willison が挙げる利点は「ビルド不要」「コピペで共有・ホスティングしやすい」といった実用面。

**修正案**：「AI に動く UI を直接作らせる流れ（Claude Artifacts・v0・Bolt.new 等、2023〜2024 年に登場）のうち、特に HTML／CSS／JS を 1 ファイルにまとめるやり方（例：Simon Willison の “HTML tools”）」のように書く。

---

### ② Tracer Bullet／Walking Skeleton — 🟡（出典は正確、ただし重要な違いあり）

**資料の記述**（[02:15](02_validity-and-prior-art.md)、[interactive-guide.html:1224](interactive-guide.html)）
> 名著『達人プログラマー』の「曳光弾」やアジャイル開発の「歩く骨格」。細くても UI 〜裏側の実処理まで一気通貫で貫通させる。

**正確な点**
- Tracer Bullets（曳光弾）は Andrew Hunt & David Thomas『The Pragmatic Programmer』（1999、20 周年版 2019、邦訳『達人プログラマー』）の考え方。要求から最終システムの一部まで「すばやく、目に見える形で、繰り返し」たどり着くもの。
- Walking Skeleton（歩く骨格）は Alistair Cockburn の用語。「システムのごく小さな実装で、小さな機能を端から端まで実行するもの。最終的なアーキテクチャを使う必要はないが、主要な構成要素どうしはつながっていなければならない」（多数の二次資料で引用されている定義）。
- 「UI → AI CLI → MCP → CAD まで先に貫通させる（STEP 1）」は、この 2 つの考え方とよく合っている。

**重要な違い（資料に書かれていない）**
- 『達人プログラマー』は **曳光弾とプロトタイプをはっきり区別**している。
  - プロトタイプのコードは**使い捨て**
  - 曳光弾のコードは**無駄はないが完全なもので、最終システムの骨格の一部になる**（二次資料が引用する一節：「Tracer code is not disposable: you write it for keeps.」）
  - 著者の Dave Thomas もインタビューで「プロトタイプはそもそも捨てるために作るもの」と述べている。
- Walking Skeleton も、そのまま本物のシステムへ育てていくことが前提。
- リアルライトモックは **「モックのコードは捨てて作り直す」** ので、同書の分類では **曳光弾ではなく「プロトタイプ」側** にあたる。

**修正案**：「**端から端まで通す**という点は曳光弾・歩く骨格と同じ。一方 **コードを捨てる** という点は、同書が曳光弾と区別している『プロトタイプ』の性質にあたる」と両方を書くと正確。

> 注：書籍の本文は直接確認していない。著者インタビュー（Artima）と複数の二次資料で確認した。

---

### ③ Parallel Prototyping（Dow et al., Stanford, 2010）— 🟡（論文本文を確認済み）

**資料の記述**（[02:16](02_validity-and-prior-art.md)、[interactive-guide.html:1230-1231](interactive-guide.html)）
> スタンフォード大学（Dow et al., 2010）の有名な研究で定量実証。1 案を順番に直すより、最初から複数案を並べて比較する方が、最終品質が大幅に高く、最初の案への固執（デザイン固着）を防ぎ、批判も心理的抵抗なく受け入れられることが証明されている。

**論文の事実**（Steven P. Dow, Alana Glassco, Jonathan Kass, Melissa Schwarz, Daniel L. Schwartz, Scott R. Klemmer. "Parallel Prototyping Leads to Better Design Results, More Divergence, and Increased Self-Efficacy." *ACM Transactions on Computer-Human Interaction* 17(4), 2010. Stanford 大学）

| 項目 | 論文の内容 |
|---|---|
| 参加者 | 33 名（平均 22 歳、4 分の 3 が学生、プロのデザイナーはゼロ。約半数に多少のデザイン経験あり） |
| 課題 | 雑誌の Web バナー広告（160×600px）を作る。試作 5 枚＋最終案 1 枚。試作 1 枚 10 分 |
| 条件 | **Serial**＝1 枚作るたびに講評をもらう ／ **Parallel**＝3 枚作ってまとめて講評 → 2 枚作ってまた講評 → 最終案 |
| 品質 | 実際に MySpace で広告を配信。クリック率は Parallel が **100 万表示あたり 445.0 回、Serial が 397.9 回**（F(1,30)=4.227, p<0.05）。専門家の評価も Parallel のほうが高い |
| 多様性 | 第三者の評価者が、Parallel の試作のほうが多様だと判定（→ 固着しにくいことを示す結果） |
| 自己効力感 | Parallel は課題への自信が有意に上がった。Serial は上がらなかった |
| 講評への反応 | 終了後のインタビューで、**Serial の約半数が講評に否定的な反応を示し、Parallel ではゼロ** |
| 著者が挙げる課題 | もっと長い期間での検証、チームでの検証を今後の課題としている |

**判定の内訳**
- ✅ 「スタンフォード」「Dow et al., 2010」「品質が高い」「多様（固着しにくい）」「講評を前向きに受け止める」は論文どおり。
- 🟡 **「大幅に高く」は言い過ぎ**：クリック率の差は約 12%（統計的に有意ではあるが「大幅」ではない）。
- 🟡 **「証明されている」は言い過ぎ**：33 名・1 回の実験・初心者・短時間の広告デザインという条件での結果。「実験で示された」程度が適切。
- 🟡 **対象のズレ**：この研究は「**作り手 1 人**が複数案を作ってから講評をもらう」効果を調べたもの。リアルライトモックで言いたい「**同僚に 3 案を触り比べてもらうと本音が出る**」により近い根拠は、次の Tohidi 2006（Dow 論文自身も引用している）。
- 💭 「AI 時代になり 3 案作るコストが激減して再脚光を浴びている」：根拠になる資料はない（推測）。ただし Dow 論文の結論には「将来、代替案をすばやく作って比較できるツールが大きな価値を生む」という趣旨の一文があり、方向性は合っている。

**追加すべき根拠：Tohidi, Buxton, Baecker, Sellen（CHI 2006）**
"Getting the Right Design and the Design Right: Testing Many Is Better Than One"
- 1 つのデザインだけを見せられた利用者は、**評価が甘くなり、批判をためらう**（作り手に悪いと気を遣う）。
- 3 つの案を並べて見せると、**評価の水増しが減り、批判がより多く・強く出る**。
- 但し書き：複数案を見せても、利用者から「こう作り直せばいい」という**建設的な改善案はあまり出なかった**。問題点は見つかるが、解決策は作り手が考える必要がある。

→ 「複数案あるため、作り手への遠慮なく本音の意見が出やすい」（rlm-04 図）は、**Tohidi 2006 で直接裏付けられる**。一方、「A の入力と C のプレビューを合体したい」のような具体的な改善案まで同僚が出してくれるとは限らない点に注意。

---

### ④ Prototype as Spec／Executable Specification（仕様駆動開発：SDD）— ⚠️

**資料の記述**（[02:17](02_validity-and-prior-art.md)、[interactive-guide.html:1236-1237](interactive-guide.html)、rlm-05 図、[01:54](01_workflow-and-architecture.md)）
> 2025〜2026 年の仕様駆動開発（SDD）の核心概念。何十ページもの曖昧な文章（要件定義書）を書く代わりに、実際に動く試作品で関係者の認識を揃え、その挙動を「仕様の原本（Source of Truth）」とする。

**エビデンス：2025 年の SDD の実際**
- **GitHub Spec Kit**（2025-09 公開）：仕様書（spec）→ 技術計画（plan）→ タスク分解（tasks）を**文書で**作り、それを AI エージェントに実装させる。プロジェクトの説明には「仕様がコードに仕えるのではなく、コードが仕様に仕える（Specifications don't serve code — code serves specifications.）」とある。
- **AWS Kiro**（2025-07 公開）：機能ごとに `requirements.md`（EARS 記法の要件）・`design.md`・`tasks.md` を生成し、それを基準に実装する。
- Birgitta Böckeler（martinfowler.com, 2025-10）は SDD を spec-first／spec-anchored／spec-as-source の 3 段階に整理している。

→ **SDD で「仕様の原本」になるのは、文章で書かれた仕様書**。資料の「文章の代わりに動く試作を仕様の原本にする」は、**SDD の説明としては逆**。

**「Executable Specification」の本来の意味**
- Gojko Adzic『Specification by Example』（2011）や BDD の流れで使われる用語で、**自動テストとして実行できる具体例付きの仕様**（生きたドキュメント＝Living Documentation になる）を指す。UI のプロトタイプのことではない。
- そのため [01:54](01_workflow-and-architecture.md) の「動く仕様書（Executable Specification）」という英訳も誤解を招く。

**では「プロトタイプを仕様にする」に根拠はないのか？**
- 2025〜2026 年にはプロダクトマネージャー向けに「Prototypes are the new PRDs（プロトタイプが新しい要求仕様書だ）」という主張がある（Figma ブログ＝自社ツールの宣伝を兼ねる、LogRocket の実践記事など）。
- 一方で Uber のブログ（2026-04）は「プロトタイプだけだと解くべき課題からずれていく。プロトタイプと PRD は**組み合わせて**使う」と述べている。
- → 「プロトタイプで認識を揃える」は**新しい実践として議論されている段階**で、確立した原則ではない。

**実はリアルライトモックと SDD がよく合う場所**
[03 の雛形③](03_playbook-checklist.md) は「まずモックから **機能仕様一覧・設計書・ディレクトリ構成案** を出力して」と指示している。これは **モック → 文書の仕様 → 実装** という流れで、まさに SDD の手順そのもの。

**修正案**：「④ 動くモックで認識を揃え（PM 界隈の “prototype as PRD” の流れ）、本番化の前にモックから**文書の仕様を抽出**して、その仕様を基に AI に実装させる（＝ SDD：GitHub Spec Kit・Kiro）」と、**STEP 4 と STEP 5 で役割を分けて**書くと正確。

---

### ⑤ Clean-Room Rewrite via Spec Extraction — ⚠️（名称は誤用、考え方には古典的な裏付けあり）

**資料の記述**（[02:18](02_validity-and-prior-art.md)、[interactive-guide.html:1243](interactive-guide.html)、rlm-06 図）
> 2025〜2026 年の企業向け AI 開発で確立された重要原則。試作から仕様だけを抽出し、本番基盤を清潔に新規構築する。

**エビデンス：「クリーンルーム設計」の本来の意味**
- Clean-room design は**著作権侵害を避けるための法務上の手法**。A チームが元の製品を調べて仕様書を書き、弁護士がその仕様書に著作物が含まれないか確認し、**元のコードを一度も見ていない B チーム**がその仕様書だけを見て作る。代表例は 1980 年代の Phoenix 社による IBM PC 互換 BIOS。
- リアルライトモックでは、**同じ AI が元のモックのコードを直接読んで**作り直すので、この意味での「クリーンルーム」ではない。
- 「2025〜2026 年に確立された原則」という呼び名・位置づけを示す資料は見つからなかった。

**考え方そのものを支える本当の根拠（古典）**
- Fred Brooks『人月の神話（The Mythical Man-Month）』（1975）：「**1 つは捨てる計画を立てよ。どうせ捨てることになるのだから**（Plan to throw one away; you will, anyhow.）」
- 『達人プログラマー』：プロトタイプのコードは使い捨て（②参照）。
- Andrej Karpathy が「vibe coding」という言葉を作ったツイート（2025-02-02）自体が、この作り方を「**使い捨ての週末プロジェクトなら悪くない**（not too bad for throwaway weekend projects）」と位置づけている。→ ✅ 「Vibe Coding」という用語と、その試作コードを本番に流用しない方針は、提唱者本人の言葉と合っている。

**反対意見・注意点（知っておくと説明に強くなる）**
- Brooks 本人が 1995 年の 20 周年版で、「1 つは捨てよ」は**ウォーターフォール型を前提にした考えで誤りだった**とし、少しずつ作って育てる漸進的な開発のほうが良いと書き直している。
- Joel Spolsky「Things You Should Never Do, Part I」（2000）：Netscape のゼロからの書き直しを「ソフトウェア企業が犯しうる最悪の戦略ミス」と批判。長年のバグ修正が詰まったコードを捨てると、その知識も失われる。
- → 3〜4 日で作ったモックなら作り直しのコストは小さいので、これらの警告はそのまま当てはまらない。ただし **「エラー時の振る舞い」などモックに暗黙に入っている知識が作り直しで抜け落ちる** リスクはあるので、雛形③の「仕様抽出を先にやる」手順が重要になる。

**修正案**：名称を「**使い捨てプロトタイプ＋仕様抽出からの再構築**（Throwaway Prototyping）」などに変え、根拠として Brooks（1975）と『達人プログラマー』を挙げる。「クリーンルーム」という言葉は使わないほうが誤解がない。

---

### ⑥ AI UI パターン体系（NN/g・Apple HIG・Google PAIR・MS HAX）— 🟡

**資料の記述**（[02:19](02_validity-and-prior-art.md)、[interactive-guide.html:1249](interactive-guide.html)）
> 作業内容に応じて 7 つの UI 型（Chat／Canvas／Inline／Tuners＋Hybrid／Ambient／Generative UI／Agentic）を使い分ける業界標準ガイドライン。

**正確な点**
- 4 つの出典はすべて実在する。
  - Microsoft「Guidelines for Human-AI Interaction」（Amershi et al., CHI 2019）：18 の指針。49 名の実務デザイナーが 20 の AI 製品に当てはめて検証。HAX Toolkit はこれを基にした道具集。
  - Google PAIR「People + AI Guidebook」、Apple HIG（Machine Learning）、NN/g の AI UX 記事群。

**ズレ**
- **7 型の一覧を定めた出典はない**。7 分類はこのリポジトリの [ui-guide](../ui-guide/00_ai-ui-patterns.md) が複数の出典を組み合わせてまとめたもの（ui-guide 自身も「4 大フレームワーク＋The Shape of AI」から整理したと書いている）。
- 「Tuners」は 4 つの出典ではなく **The Shape of AI（Emily Campbell）** の用語。
- → 「業界標準ガイドライン」ではなく「**複数の一次ガイドラインを基に本リポジトリで整理した 7 分類**」と書くのが正確。

> 注：ui-guide 内の出典ごとの対応関係は、[ui-guide/info/README.md](../ui-guide/info/README.md) の範囲で確認済みとし、ここでは再検証していない。

---

## 3. その他の主張の検証

### 3-1. 用語・技術の説明

| 主張（場所） | 判定 | エビデンス・補足 |
|---|---|---|
| MCP＝AI と外部ツール・データをつなぐ共通接続規格（[00:29](00_concept-and-overview.md)） | ✅ | Anthropic「Introducing the Model Context Protocol」（2024-11-25）。データソースと AI ツールを安全に双方向でつなぐオープン標準として公開 |
| PoC の説明（[00:27](00_concept-and-overview.md)） | ✅ | 一般的な定義どおり |
| CLI の説明（[00:28](00_concept-and-overview.md)） | ✅／🟡 | 説明は正しい。ただし「クラウド基盤を新設する前に手元で AI を試すのに最適」は意見（💭） |
| GitHub Copilot CLI を UI から呼び出せる（[01:16](01_workflow-and-architecture.md)） | ✅ | 公式ドキュメント：`-p` で対話なしにプロンプトを実行できる。ツールを自動実行するには `--allow-all-tools` が必要。MCP サーバーの追加にも対応 |
| MCP 経由で CAD を操作し 3D データを生成（各所） | ✅ | 実現例あり（例：FreeCAD 用 MCP サーバー `neka-nat/freecad-mcp` など複数） |
| 「ローカル AI CLI」で「クラウド準備を待たずに」検証（[01:17](01_workflow-and-architecture.md)、rlm-03 図） | 🟡 | **CLI は手元で動くが、AI の推論は GitHub 側のクラウドで行われ、プロンプトや読み込んだデータは社外に送られる**。組織で使うには、Copilot のライセンス（シート）と、管理者による **Copilot CLI ポリシーの有効化** が必要。組織の MCP ポリシーも適用される。「自前の Azure 基盤を作る前に、既存の契約済みクラウド AI を使う」と書くのが正確 |
| 単一 HTML からローカルの AI CLI と MCP を叩く（[00:51](00_concept-and-overview.md)、[01:15-16](01_workflow-and-architecture.md)） | 🟡 | ブラウザの JavaScript は安全のため PC 上のコマンドを直接実行できない。**HTML とは別に、CLI を起動するローカル中継サーバー（Node.js や Python の小さなプログラム）が必要**。`file://` で開いた HTML から `localhost` に送る場合、中継サーバー側で CORS（別オリジンからの通信の許可）の設定も必要。rlm-03 図の「軽量ローカル橋渡し（CLI 実行）」と 03 の雛形①には書かれているが、00・01 の本文では省かれている |
| 「個人開発では定番の手法」（[01:17](01_workflow-and-architecture.md)） | 💭 | 根拠なし |

### 3-2. 本番移行・落とし穴

| 主張（場所） | 判定 | エビデンス・補足 |
|---|---|---|
| 「Vibe Hangover（バイブコーディングの二日酔い）」と業界で呼ばれる（[02:30](02_validity-and-prior-art.md)、[interactive-guide.html:700](interactive-guide.html)、rlm-06 図） | 🟡 | Fast Company「The Vibe Coding Hangover Is Upon Us」（2025-09）など、**「vibe coding hangover」はメディアで実際に使われた表現**。ただし AI ツールで作ったコードが本番で「開発地獄」になる問題全般を指す言葉で、「単一 HTML に認証を後付けする」パターンの名前ではない。短縮形「Vibe Hangover」も一般的ではない。（記事は見出し・リード文と二次資料のみ確認） |
| 「Incremental Patching」という失敗パターン名（rlm-06 図、02:29） | 💭 | 確立した名称ではない（この資料での呼び名） |
| ① デモの罠（The Demo Trap）（[02:46](02_validity-and-prior-art.md)） | 🟡 | 名称は一般的な用語ではないが、**現象は裏付けあり**：Joel Spolsky「The Iceberg Secret, Revealed」（2002）。プログラマー以外の人は画面の見た目で完成度を判断する（画面が 90% ひどければプログラムも 90% ひどいと思う、逆に画面がきれいなら「ほぼ完成」と思う）。Spolsky は「未完成の部分は未完成に見えるようにしておく」ことも勧めている → 資料の対策（Phase 2 が必要と明示）に加えると効果的 |
| ② 継ぎ足し改修の誘惑 | ✅（考え方として） | ⑤の Brooks・『達人プログラマー』（プロトタイプは捨てる）・Karpathy（使い捨て向き）が裏付け |
| ③ 社内セキュリティ・データ境界 | ✅ | 妥当。上の「ローカル AI CLI でもデータは社外に出る」点を明記すると、なぜ必要かがより分かりやすい |

### 3-3. 全体を通した表現

| 主張（場所） | 判定 | 補足 |
|---|---|---|
| 「6 つの実証済み知見と見事に合致」（[02:4](02_validity-and-prior-art.md)）、「6 つの実証済み理論と見事に一致」（[interactive-guide.html:730](interactive-guide.html)）、rlm-05 図の「6つの実証済み理論」「王道手法！」 | ⚠️ | 実験で確かめられているのは③（＋ Tohidi 2006）のみ。「6 つの知見・実践と対応している」程度が正確 |
| 「現場の勘と学術・業界の王道理論が完全に噛み合った手法」（interactive-guide STEP 4 の要点） | 🟡 | ②⑤のように原典と食い違う点もあるので「完全に」は言い過ぎ |
| 「2025〜2026 年の企業 AI 導入事例では…最大の明暗が分かれる」（[02:25](02_validity-and-prior-art.md)） | 💭 | 具体的な事例・出典が示されていない |

### 3-4. 数字・期間（💭 経験則）

以下は外部の根拠がない、筆者の経験・目安・例え話です。間違いではありませんが、「目安（筆者の経験）」と書いておくと誤解されません。

- 3〜4 日で 3 案＋裏側の実動作まで到達（README・00・03・図）
- デモで 1〜2 分で価値を伝えられる（01:50、rlm-04 図）
- 同僚テストは 2〜5 名（03:13）
- 「スライド 10 枚より 1 分の動くデモが意思決定を劇的に速める」（rlm-04 図）
- 従来手法の比較タイムライン（Week 1〜8、「約 1 ヶ月後に初めて触れる」）（interactive-guide STEP 1）
- 「最初から本番を作るより圧倒的に速く失敗しない」（rlm-01 図）

---

## 4. 修正の優先順位（直すならここから）

| 優先 | 場所 | 直し方 |
|---|---|---|
| **高** | ④ SDD の説明（02:17、HTML:1236-1237、rlm-05 図） | SDD は「文書の仕様が正」。モック＝体験の確認（STEP 4）、モックから文書の仕様を抽出して実装＝SDD（STEP 5）と分けて書く |
| **高** | ⑤ Clean-Room の名称（02:18、HTML:1243、rlm-06 図） | 「使い捨てプロトタイプ＋仕様抽出からの再構築」等に改名し、Brooks（1975）・『達人プログラマー』を根拠にする |
| **高** | 「6 つの実証済み」（02:4、HTML:730、rlm-05 図） | 「6 つの知見・実践と対応」に弱める |
| 中 | ② 曳光弾の但し書き（02:15、HTML:1224） | 「コードを捨てる点は同書の『プロトタイプ』にあたる」を追記 |
| 中 | ③ の表現（02:16、HTML:1231） | 「大幅に」「証明」→「実験で示された（33 名・バナー広告）」。Tohidi et al. 2006 を追加 |
| 中 | ① v0／Bolt.new（02:14、HTML:1219、rlm-05 図） | 単一 HTML の例から外す。時期を 2023〜2024 年に |
| 中 | ローカル CLI のデータの流れ（00:28、01:17、02:48） | 推論はクラウド・管理者ポリシーが必要、を明記 |
| 中 | 中継サーバーの存在（00:51、01:15-16） | 「単一 HTML＋小さなローカル中継サーバー」と書く |
| 低 | ⑥ 7 型（02:19、HTML:1249） | 「本リポジトリで整理した 7 分類」に |
| 低 | Vibe Hangover／Demo Trap（02:30、02:46） | 「メディアでは…と表現される」「Spolsky の指摘」と出典を添える |
| 低 | 01:54 の英訳 | 「Executable Specification」→ 削除するか「動く仕様書（本書での呼び名）」に |

---

## 5. 出典一覧

### 論文・書籍
- Dow, S. P., Glassco, A., Kass, J., Schwarz, M., Schwartz, D. L., & Klemmer, S. R. (2010). Parallel Prototyping Leads to Better Design Results, More Divergence, and Increased Self-Efficacy. *ACM TOCHI* 17(4). DOI: 10.1145/1879831.1879836 — 著者原稿：https://hci.stanford.edu/publications/2010/parallel-prototyping/ParallelPrototyping2010-submitted.pdf
- Tohidi, M., Buxton, W., Baecker, R., & Sellen, A. (2006). Getting the Right Design and the Design Right: Testing Many Is Better Than One. *CHI 2006*, 1243–1252. — https://www.microsoft.com/en-us/research/?p=151922 ／ PDF：https://cs.uwaterloo.ca/~jianzhao/cs449-649/files/right-design.pdf
- Amershi, S. et al. (2019). Guidelines for Human-AI Interaction. *CHI 2019*. — https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/
- Hunt, A. & Thomas, D. *The Pragmatic Programmer*（1999／20 周年版 2019、邦訳『達人プログラマー』）— 著者インタビュー「Tracer Bullets and Prototypes」：https://www.artima.com/articles/tracer-bullets-and-prototypes
- Brooks, F. P. *The Mythical Man-Month*（1975／20 周年版 1995）— 概要：https://en.wikipedia.org/wiki/The_Mythical_Man-Month
- Adzic, G. *Specification by Example*（2011）— https://www.manning.com/books/specification-by-example ／ https://en.wikipedia.org/wiki/Specification_by_example
- Walking Skeleton（Alistair Cockburn の定義の引用・解説）— https://www.oreilly.com/library/view/97-things-every/9780596800611/ch60.html

### 公式発表・ドキュメント
- Anthropic「Introducing the Model Context Protocol」（2024-11-25）— https://www.anthropic.com/news/model-context-protocol
- Anthropic「Claude 3.5 Sonnet」（2024-06、Artifacts 発表）— https://www.anthropic.com/news/claude-3-5-sonnet
- GitHub Blog「Spec-driven development with AI: Get started with a new open source toolkit」（2025-09）— https://github.blog/news-insights/product-news/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/
- GitHub Spec Kit — https://github.github.com/spec-kit/
- Kiro「From chat to specs: a deep dive into AI-assisted development with Kiro」— https://kiro.dev/blog/from-chat-to-specs-deep-dive/
- GitHub Docs「GitHub Copilot CLI programmatic reference」— https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference
- GitHub Docs「Administering Copilot CLI for your enterprise」— https://docs.github.com/en/copilot/how-tos/copilot-cli/administer-copilot-cli-for-your-enterprise
- Microsoft HAX Toolkit — https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/
- MDN「Cross-Origin Resource Sharing (CORS)」— https://developer.mozilla.org/docs/Web/HTTP/CORS

### 記事・ブログ
- Birgitta Böckeler「Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl」（martinfowler.com, 2025-10）— https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html
- Simon Willison「Useful patterns for building HTML tools」（2025-12-10）— https://simonwillison.net/2025/Dec/10/html-tools/
- Andrej Karpathy の「vibe coding」ツイート（2025-02-02）— https://x.com/karpathy/status/1886192184808149383
- Fast Company「The Vibe Coding Hangover Is Upon Us」（2025-09）— https://www.fastcompany.com/91398622/the-vibe-coding-hangover-is-upon-us
- Joel Spolsky「The Iceberg Secret, Revealed」（2002-02-13）— https://www.joelonsoftware.com/2002/02/13/the-iceberg-secret-revealed/
- Joel Spolsky「Things You Should Never Do, Part I」（2000-04-06）— https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/
- Figma「Prototypes are the new PRDs」— https://www.figma.com/blog/prototypes-are-the-new-prds/
- Uber「AI prototyping」（2026-04）— https://www.uber.com/en-US/blog/ai-prototyping/
- Clean-room design（概要）— https://en.wikipedia.org/wiki/Clean-room_design
- v0 の公開（Product Hunt, 2023-09-14）— https://www.producthunt.com/products/v0/launches
- Bolt.new の公開（@IT, 2024-11）— https://atmarkit.itmedia.co.jp/ait/articles/2411/02/news040.html
- FreeCAD MCP（例）— https://github.com/neka-nat/freecad-mcp

### 確認の深さについての注記
- **本文まで確認**：Dow et al. 2010（著者原稿 PDF）、各公式ドキュメント。
- **要旨・二次資料で確認**：Tohidi 2006（要旨と引用）、『達人プログラマー』（著者インタビューと引用）、Cockburn の定義（引用）、Brooks 1995 の撤回（目次と要約）、Fast Company 記事（見出し・リード文と二次資料）。正式に引用する場合は原典を確認してください。

---

## 6. 一次情報による再検証（2026-11-27 追記）

**総合判定**　元資料が提案する「早い段階で実処理を試し、複数の画面案を比較し、得た知見を本番設計に渡す」という進め方には、各工程を支持する研究や実例がある。一方、「この組み合わせなら3〜4日で最適なUIが決まり、本番化も最短・低コストになる」という一連の効果は、引用された研究でも、このフォルダの成果物でも実証されていない。既存の検証が「6つの実証済み理論」「7型は業界標準」を退けた判断は妥当。一方、Copilot CLIの権限・推論先、利用者実験の読み方、試作による合意形成の歴史については、既存の検証にも訂正が必要である。[Dowらの個人実験](https://hci.stanford.edu/publications/2010/parallel-prototyping/ParallelPrototyping2010-final.pdf) ／ [Tohidiらの利用者実験](https://www.billbuxton.com/rightDesign.pdf) ／ [Uberの実践報告](https://www.uber.com/us/en/blog/ai-prototyping/)

対象はREADME、00〜03章、動的ガイド、SVG全6枚、および本ファイルの既存部分（1〜301行）。以下の「既存○行」は追記前の行番号を指す。教材が実行する処理は同梱ソースで、実験結果は論文本文で、製品仕様は提供元の公開資料で確認した。

### 6.1 同梱されている成果物と教材上の表示

| 対象 | 再検証結果 |
|---|---|
| **動的ガイドの「実操作モード」「リアル連動」「CAD STEP 出力OK」**（既存209行にも関係） | **表示と実装が異なる。** 手動のA・B・Cと自動再生は同じ `runCadSimulation` を呼ぶ。関数はタイマーで用意済みのログを表示し、ブラウザ内でSVGを描く。`output/bracket_v1.step` はログ中の文字列で、STEPファイルの書き出しやCLI・MCPへの通信処理はない。3つの `file:///C:/poc/…` も表示用の文字列で、同梱物は画面を切り替えるHTML 1本。「想定フィードバック例」という表示は実装に合っている。FreeCADをMCP経由で操作できるという既存の判定は正しいが、その実装例は別プロジェクトで、FreeCAD内のアドオンとMCPサーバーを使う。[画面の表示](interactive-guide.html#L632) ／ [ログと描画](interactive-guide.html#L977) ／ [各案の処理](interactive-guide.html#L1028) ／ [自動再生](interactive-guide.html#L1143) ／ [FreeCAD MCP開発元](https://github.com/neka-nat/freecad-mcp) |
| **READMEの「HTML単一ファイル・外部依存なし」**（9行） | **図を含めた配布物としては不正確。** ガイドのCSSとJavaScriptはインラインで、主要な操作に外部サービスは要らない。ただし冒頭の全体図は相対パスで別ファイルを読み込む。HTMLだけをコピーするとこの図が欠け、教材間のリンク先も付属しない。「ビルド不要。図も表示する場合はフォルダごと配布」が実装に合う。[README](README.md#L9) ／ [画像の読込箇所](interactive-guide.html#L536) |
| **本番製品の「一括変換」と雛形③**（README 17行、01章20〜22行、既存150行） | **雛形の出力と製品完成を区別する必要がある。** 雛形③が最初に求めるのは機能仕様一覧、設計書、ディレクトリ構成案の3点。03章の工程表も製品化をDay 4の後のPhase 2に置いている。実装・受入試験の結果、本番での工数や欠陥率の記録は収録されていない。「AIが高精度に生成」「圧倒的に安い」「失敗しない」はこのフォルダから確認できない。Uberは自社でアイデアを数時間で触れるようにした例を報告しているが、そこで短縮されたのは初期の検討時間である。[雛形③](03_playbook-checklist.md#L83) ／ [費用に関する元の主張](02_validity-and-prior-art.md#L36) ／ [図の結論](assets/rlm-01-overview-flow.svg#L115) ／ [Uberの報告](https://www.uber.com/us/en/blog/ai-prototyping/) |

### 6.2 CLI・MCP・ブラウザの技術的な訂正

1. **全ツールの許可は必須ではない（既存208行は誤り）。** GitHubの現行CLIは `copilot -p` で非対話実行できる。承認が必要なツールを無人で使う場合も、`--allow-tool` で対象のMCPサーバーの特定ツールだけを事前許可できる。`--allow-all-tools` は全体を許可する選択肢。ガイドのログに出る `copilot-cli --mcp cad-server …` は表示用の疑似コマンドで、GitHubの公式コマンド例として転記できない。[ガイドの疑似ログ](interactive-guide.html#L1004) ／ [GitHub公式の非対話実行リファレンス](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-programmatic-reference) ／ [ツールごとの許可](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/allowing-tools)
2. **推論先・データ境界は構成で決まる（既存39・210・222・255行は断定過剰）。** GitHubホストのモデルを使う設定では、推論に必要なプロンプトや文脈を外部サービスに送る。Copilot CLIは独自プロバイダーや端末内のモデルにも対応し、独自プロバイダーへの推論リクエストは直接その接続先に届く。オフラインモードでも接続先やMCP、テレメトリの設定によって通信は残り得る。「手元でCLIを起動」だけでは社外送信の有無は判定できない。組織からCopilotを付与される利用形態では、組織のCLIポリシーが有効であることが条件。独自プロバイダーを使う場合にはGitHub認証を要しない経路もある。組織管理のMCP許可リストが使える点には2026年4月の公式発表がある。公式概説の一部にはレジストリ未対応との記述も残るが、コマンドリファレンスは、管理対象の追加サーバーに対する照合と組み込み既定サーバーの例外を明記している。[推論先とローカルモデル](https://docs.github.com/en/copilot/concepts/copilot-surfaces/copilot-cli#using-your-own-model-provider) ／ [認証・オフラインモード](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/authenticate-copilot-cli) ／ [GitHubのMCP許可リスト対応発表](https://github.blog/changelog/2026-04-16-copilot-cli-supports-custom-registry-based-mcp-allowlists/) ／ [CLIのMCPポリシー照合仕様](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-command-reference)
3. **HTMLに必要な橋渡しとCORSは別の話（既存40・211行）。** 本資料の構成で、通常のWebページから端末上のCLIを起動するには仲介するプログラムが要る。03章のローカルHTTPエンドポイントはその一例。MCP自体にはstdioとStreamable HTTPがあり、既にHTTPで公開されたMCPサーバーには対応クライアントがHTTPで接続できる。Webページと橋渡しAPIを同一オリジンから配信すれば、その間の応答を読むためのCORS設定は不要。別オリジンの場合、CORSが規定するのはブラウザでの応答共有で、利用者の認証やCAD操作の権限は別途扱う。[03章のエンドポイント](03_playbook-checklist.md#L48) ／ [MCPのトランスポート仕様](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports) ／ [WHATWG FetchのCORS仕様](https://fetch.spec.whatwg.org/#http-cors-protocol)
4. **Azure採用だけでは製品の安全性・SLAは確定しない（01章22行、図03、動的ガイド1189行）。** Microsoftの責任共有モデルでは、データ、ID、アクセス管理などに利用側の責任が残る。個々のクラウドサービスのSLAと、CADやMCP・DBを含む製品全体の信頼性目標も別に評価する。図中の「企業セキュリティ＆SLA準拠」は採用構成の達成実績としては読めない。[構成図](assets/rlm-03-architecture-poc-to-prod.svg#L83) ／ [Azureの責任共有モデル](https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility) ／ [Azureの信頼性目標の定義](https://learn.microsoft.com/en-us/azure/well-architected/reliability/metrics)

### 6.3 複数案の比較で実際に測ったこと

| 一次研究 | 確認できたこと | 資料への含意 |
|---|---|---|
| **Dowら（2010）**。作り手33人、Webバナー広告（既存98〜116行） | 既存の実験条件と数値は掲載版と一致する。並行群445.0対逐次群397.9は**100万表示あたりのクリック数**。相対差は約11.8%、クリック率の絶対差は約0.00471ポイント。専門家による品質評価でも並行群が高かった。 | 「品質全般が12%向上」や「12%だから大幅ではない」とは判定できない。多様性は第三者による作品間の類似度、講評への否定的反応は終了後の自己報告。「固着を防止」「心理的抵抗がゼロ」と言い切るのは測定範囲を超える。[掲載版の方法・結果（§3–5）](https://hci.stanford.edu/publications/2010/parallel-prototyping/ParallelPrototyping2010-final.pdf) |
| **Tohidiら（2006）**。利用者48人、家庭用冷暖房操作盤の紙試作（既存118〜124行） | 4条件各12人。複数案条件では3案を**順に操作**し、提示順も調整した。単独提示で平均評価が高い傾向は3案に共通し、有意差はCircularとLinearの2案。複数提示で肯定的コメントは全案で有意に減ったが、同じ案への否定的コメントの有意な増加はLinearだけ。 | 評価者側の根拠として追加したのは適切。「批判がどの案でも増える」「遠慮がなくなり本音が出る」は強すぎる。実質的な改善提案数に有意差がなかった一方、複数案条件では他案の特徴を取り入れる提案も実際に記録された。「AとCを組み合わせたい」は起こり得る例で、3案比較から必ず得られる成果ではない。[著者公開の論文本文・表1、2](https://www.billbuxton.com/rightDesign.pdf) |
| **Dowら（2011）**。作り手84人、42組のペア | それぞれ広告を試作し、相手と講評し合って最終案を個別に作った。複数案を共有した条件では、1案だけを共有した条件より多くのアイデアを交換し、最終広告の評価も高かった。 | 既存109行の「チームでの検証は今後の課題」は2010年論文については正しい。翌年には、共同作業を直接調べた別の実験が発表されている。ただし参加者は設計をする当事者で、「同僚2〜5人の評価で最適UIが即決」という検証ではない。[CHI 2011の著者論文](https://hci.stanford.edu/publications/2011/PrototypingDynamics/PrototypingDynamics-CHI2011.pdf) |

**人数・速度の判定（既存234〜241行）。** 少人数で反復するユーザーテストには外部根拠がある。Nielsenは5人前後での反復を論じ、英国政府の実務ガイドはインタビューやユーザビリティテスト1回あたり通常4〜8人を例示する。選ぶべきは対象業務の実利用者・想定利用者で、同僚が該当するかも重要。これらは「同僚2〜5人で3案の優劣が確定」という閾値を支持しない。3〜4日の工程表、1〜2分デモ、意思決定の短縮は本資料の計画例として扱うのが妥当で、実測値かどうかは確認できない。[Nielsen本人の解説](https://www.nngroup.com/articles/why-you-only-need-to-test-with-5-users/) ／ [英国政府の参加者選定指針](https://www.gov.uk/service-manual/user-research/find-user-research-participants)

### 6.4 用語・出典についての訂正と補強

- **① 単一HTMLと生成ツール（既存29・53〜65・254行）。** Willisonが単一HTMLのツールを150個以上作り、そのほとんどをLLMで記述したという要約は正確。Vercelの2023年10月11日発表は、数週間前の初紹介からの**アルファ版→ベータ版移行**を報じたもの。Anthropicは2024年6月にArtifactsを発表し、StackBlitzは同年10月のViteConfでBoltを公開した。v0の代表的な出力はReact系、Boltの既定構成もReact・Vite等だが、それを根拠に既存29行のように「単一HTMLを作らない」とは断定できない。初期のv0でHTMLコードもコピーできたという当時の利用者自身の記録もある。HTML断片の出力、CSS・JS込みの自己完結ファイルの出力、その形式の業界普及率はそれぞれ別の主張。「主流化」「生成エラーが最小」を示す比較統計は今回の出典にはない。[Willisonの実作例](https://simonwillison.net/2025/Dec/10/html-tools/) ／ [Vercelの発表](https://vercel.com/blog/announcing-v0-generative-ui) ／ [初期v0の実操作記録](https://michellebakels.hashnode.dev/musings-on-v0-currently) ／ [Anthropicの発表](https://www.anthropic.com/news/claude-3-5-sonnet) ／ [StackBlitzの発表](https://blog.stackblitz.com/posts/bolt-100k-oss-fund/) ／ [Boltの既定構成](https://bolt.new/use-cases/ai-website-builder)
- **② 曳光弾とWalking Skeleton（図05、既存75〜89行）。** 著者Hunt・Thomasの対談は、早く通した骨格を育てる曳光弾と、学習目的で捨てる試作を区別している。Cockburn本人のWalking Skeletonの定義は、主要構成をつないで小さな機能を端から端まで動かし、そこから機能と構造を育てられるというもの。元資料のSTEP 1は明示的にUIなしでCLIから実ツールまで、UIが加わるのはSTEP 2。既存77行がUIまで通す段階を「STEP 1」としたのは誤り。図05の「『達人プログラマー』発」は曳光弾にかかる。両名称を同じ出典には帰属できない。[01章の工程](01_workflow-and-architecture.md#L28) ／ [図05](assets/rlm-05-prior-art-landscape.svg#L35) ／ [Hunt・Thomasの対談](https://www.artima.com/articles/tracer-bullets-and-prototypes) ／ [Cockburn本人の定義](https://www.linkedin.com/posts/alistaircockburn_what-is-a-walking-skeleton-and-why-do-i-need-activity-7419086703577071616-D8Cs)
- **④ SDDと「実行可能な仕様」（既存128〜152・249行）。** GitHub Spec Kitの公式手順は仕様、計画、タスク、実装を含み、各段階で人が確認する。KiroのFeature Specsには要件先行と設計先行がある。既存の中心的な指摘は妥当だが、Böckelerの3分類は複数ツールを調べた本人の整理で、すべてのSDDで文書の形式や存続期間が同一とする定義ではない。雛形③は本番実装前の仕様整理と整合する。「Executable Specification」をBDDの具体例テストだけに限定した既存141行も狭い。Cucumberには実行可能な例があり、Microsoft ResearchのAsmLは抽象状態機械の実行可能な仕様言語である。この教材のHTMLについて言えるのは、操作を例示できることまでで、本番実装が期待どおりかを照合する仕組みは示されていない。[GitHub Spec Kit](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/) ／ [Kiro Feature Specs](https://kiro.dev/docs/specs/feature-specs/) ／ [Böckelerの調査](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) ／ [Cucumber](https://cucumber.io/docs/gherkin/reference/#example) ／ [Microsoft Research AsmL](https://www.microsoft.com/en-us/research/project/asml-abstract-state-machine-language/)
- **試作で認識をそろえる実践の年代（既存145〜147行）。** HoudeとHillは1997年に、試作を使って設計を考え、関係者に伝える方法を実例で説明している。従来のモックを常に「1案・見た目だけ・学びも使い捨て」と見る根拠もない。実モデルの遅延や精度を測るには実接続が必要だが、想定した遅延や誤答を人が演じて、利用者の反応を調べる研究は可能。近年の議論は、**AIで作った試作に製品要求文書（PRD）のどの役割を持たせるか**であり、FigmaとUberでも運用が異なる。[Houde・Hillの原典](https://hci.stanford.edu/courses/cs294h/2006/readings/houde-prototypes-97.pdf) ／ [Microsoftの模擬AIでの利用者研究](https://www.microsoft.com/en-us/research/articles/user-research-makes-your-ai-smarter/) ／ [Figmaの社内事例](https://www.figma.com/blog/prototypes-are-the-new-prds/) ／ [Uberの社内事例](https://www.uber.com/us/en/blog/ai-prototyping/)
- **⑤ クリーンルームと全面再構築（既存162〜176・221・250行）。** PhoenixのBIOS開発では、元BIOSの機能を調べた担当者が、それを見ていない実装者に機能を伝えた。別に、SEIが記録した *Cleanroom Software Engineering* は、数学的な仕様・正しさの検証と統計的テストを組み合わせる信頼性工学の手法。元資料の雛形には独立実装者への情報の分離も、SEIが定義した形式的検証・統計的テストも指定されていない。既存163行の「同じAIが作り直す」も、雛形が指定しているのは元コードを読ませるところまでで、実装担当の同一性は不明。Brooksが20周年版第19章（p.265）で初版の一律な作り捨て論を再考した、という既存172行は正確。英国政府の指針も試作コードの本番への丸写しを戒めるが、全製品で全面再構築が最安になるという根拠にはならない。[Phoenixの当事者による序文](https://bitsavers.trailing-edge.com/pdf/ibm/pc/ps2/bios/System_BIOS_for_IBM_PC_XT_AT_Computers_and_Compatibles_198908.pdf) ／ [SEIの原典](https://sei.cmu.edu/library/cleanroom-software-engineering-reference/) ／ [Brooks 20周年版・第19章](https://www.oreilly.com/library/view/mythical-man-month-the/0201835959/ch19.xhtml) ／ [英国政府の試作指針](https://www.gov.uk/service-manual/design/making-prototypes)
- **⑥ AI UIの7型と実証の有無（既存34〜35・185〜195・228行）。** 7型はリポジトリによる整理、TunersはEmily Campbellのパターン集の分類、という判定は妥当。参照元の `ui-guide` はNN/gの記事1本に5構造の一覧を帰属させているが、その記事が明示的に分けるのは汎用と製品固有のチャットボットで、他のUIも検討するよう論じている。一方、Microsoft HAXの基になるAmershiらの**18指針は49人の実務家が20製品に適用して評価**した。既存35・228行の「実証は③だけ」は、「本資料の7型や手法全体の有効性はこの研究で試していない」と限定すると正確になる。[リポジトリの分類と帰属](../ui-guide/00_ai-ui-patterns.md#L23) ／ [NN/gの該当記事](https://www.nngroup.com/articles/ai-chat-not-the-answer/) ／ [The Shape of AIのTuners](https://www.shapeof.ai/pattern-types/tuners) ／ [Amershiらの原著](https://www.microsoft.com/en-us/research/publication/guidelines-for-human-ai-interaction/)

**「Vibe Hangover」「デモの罠」（既存36〜37・169・218〜221行）。** Fast Companyの2025年9月8日の見出しは表現の用例として確認できた。初出として挙がったKarpathyのX投稿は今回直接取得できず、用語の趣旨は本人の回顧で確認した。Spolskyは2002年に、画面の仕上がりからソフトウェア全体の進捗が誤解される現象を書いた。いずれも経験・言葉の使われ方の資料で、継ぎ足し改修の失敗率やデモによる承認率を測ったものではない。Karpathy本人も短命のソフトを作った経験を記している。「AIで試作したら本番は常に書き直す」という技術原則まで提唱した根拠にはならない。[Fast Companyの当該見出し](https://www.fastcompany.com/91398622/the-vibe-coding-hangover-is-upon-us) ／ [Spolsky本人の記事](https://www.joelonsoftware.com/2002/02/13/the-iceberg-secret-revealed/) ／ [Karpathy本人の回顧](https://karpathy.bearblog.dev/year-in-review-2025/)

**既存の出典リンクの補足。** 267行のWaterloo掲載PDFは今回の取得で404だった。277行と293行のURLからも本文を取得できなかったため、各発行元で本文を確認できたリンクを示す。[Tohidi論文・共著者公開PDF](https://www.billbuxton.com/rightDesign.pdf) ／ [GitHub公式記事](https://github.blog/ai-and-ml/generative-ai/spec-driven-development-with-ai-get-started-with-a-new-open-source-toolkit/) ／ [Uber公式記事](https://www.uber.com/us/en/blog/ai-prototyping/)

---

## 7. 第6章への意見と、AI 時代の出典の使い方（2026-11-27 追記）

> この章は、第6章を読んだうえでの Claude（第1〜5章の執筆者）の意見です。第6章の指摘のうち第1〜5章の訂正にあたるものは、自分で一次情報を読み直して確かめました。確かめた範囲は 7.6 に書いています。

### 7.1 第6章の評価：ほぼ全面的に同意します

第6章は第1〜5章より一段深く一次情報を読んでおり、私の記述の誤りを正しく直しています。次の表の指摘は、いずれも私が原典を読み直して確かめました。

| 第6章の指摘 | 確認結果 | 第1〜5章の誤り |
|---|---|---|
| Copilot CLI の非対話実行に `--allow-all-tools` は必須ではない | ✅ 第6章が正しい。公式リファレンスは、`--allow-tool` で特定のツール（MCP サーバーの特定ツールを含む）だけを許可できると説明している。何も許可しないと、承認が必要な操作は拒否される | 3-1 の表「ツールを自動実行するには `--allow-all-tools` が必要」は誤り |
| 推論先は構成で決まる | ✅ 第6章が正しい。公式概説に「Using your own model provider」の節がある。OpenAI 互換のエンドポイント、Azure OpenAI、Anthropic のほか、Ollama などのローカルモデルにも接続できる | 1章サマリーと 3-1 の「AI の推論は GitHub のクラウドで行われ、データは社外に出る」は断定しすぎ。正しくは「GitHub ホストのモデルを使う設定なら社外に送られる」 |
| Tohidi らの結果の細部 | ✅ 第6章が正しい。論文本文の表1・表2で確認した。参加者は48名で、4条件×12名。1案だけ見せたときに評価が有意に高くなったのは Circular と Linear の2案（Tabular は p=0.064）。肯定的なコメントの減少は3案すべてで有意。否定的なコメントが有意に増えたのは、最も評価の低い Linear 案だけ。実質的な改善提案の数には有意差がなかった | ③の「批判がより多く・強く出る」は要旨の言い方をそのまま使っており、詳細な結果に照らすと強すぎた |
| 動的ガイドの「実操作モード」「リアル連動」は表示だけ | ✅ 第6章が正しい。手動操作も自動再生も `runCadSimulation` を呼び、用意済みのログをタイマーで順に表示している | 第1〜5章ではガイド自体の実装を確認していなかった |
| README の「外部依存なし」 | ✅ 第6章が正しい。ガイド冒頭の図は `assets/rlm-01-overview-flow.svg` を相対パスで読み込んでいる | 私は README 9行目を問題なしとしていた |
| ②の STEP 番号 | ✅ 第6章が正しい。UI なしで CLI→MCP→CAD を通すのが STEP 1 で、UI が加わるのは STEP 2 | ②で「UI → … → CAD まで（STEP 1）」と書いたのは誤り |
| ①「v0・Bolt.new は単一 HTML を作らない」 | 🟡 第6章のほうが慎重で妥当。代表的な出力は React 系だが、「作らない」と断定する根拠はない | 断定しすぎ |
| ⑥「実証は③だけ」 | ✅ 第6章が正しい。Amershi らの18指針は、49名の実務家が20製品に当てはめて評価している。私自身も⑥の本文でそう書いたのに、サマリーと矛盾させていた | 1章サマリーと 3-3 は「本資料の7型と手法全体は、引用した研究では試されていない」と限定すべきだった |

### 7.2 第6章に付け加えたいこと・少し意見が違うこと

1. **第6章は「何が言えないか」は正確だが、「では何なら言えるか」がない。** 教材を直すには、誤りの指摘に加えて、置き換える文が必要です。文例は 7.4 に置きました。

2. **Tohidi の結果は、細かく読むとむしろこの手法の目的に合っている。** 否定的なコメントが有意に増えたのは、最も評価の低い案（Linear）だけでした。要旨にある「必要な場合には（when appropriate）、より多く強い批判が出る」はこの意味です。つまり3案を並べると、**全体の褒めすぎが減り、弱い案ははっきり弱いと言われます**。3案から「どれを捨てるか」を決めたいリアルライトモックにとって、これは使える結果です。
   一方で「改善案がたくさん出る」は支持されていません。改善案は作り手が考える前提で書くべきです。論文の要旨も「ユーザビリティテストは問題を見つける手段で、解決策を得る手段ではない」と結んでいます。

3. **Dow の「12%」は、形容詞をやめて数字で書けばよい。** 「大幅ではないとも判定できない」という第6章の指摘に同意します。「クリック数が約12%多く、専門家評価も高かった（統計的に有意）」と事実だけを書くのが、いちばん誤解を生みません。

4. **「見た目モックでは絶対に検証できない」が誤りだという指摘には同意する。ただし、実物につなぐことには別の価値がある。** 確かに Wizard of Oz（人が AI のふりをする試作）を使えば、遅延や誤答を人が演じられます。ただ、演じられる遅延や誤答は作り手が「想定した」ものです。LLM は、実際にどんなブレ方や誤り方をするかを事前に予測しにくいので、実物につなぐと想定外の挙動に早く出会えます。これは私の意見で、測定した研究は確認していません。00章は「絶対に」を外し、「実際の AI の挙動（想定外のブレを含む）を早く確かめられる」と書くのがよいと思います。

5. **⑤の「同じ AI が作り直すかは不明」は細かすぎる論点。** 実務上の問題は、「クリーンルーム」という名前が2つの確立した意味とぶつかることです。1つは法務の手法（Phoenix の BIOS）、もう1つは信頼性工学の手法（SEI の Cleanroom Software Engineering）です。名前を変えれば十分です。

6. **ガイドがシミュレーションであること自体は問題ではない。** 教材なので、表示を「実操作モード」「リアル連動」から「操作シミュレーション」「実際の流れを再現」などに変えれば足ります。本当に CLI につなぐ実装までは要りません。

7. **第6章の出典のうち、私が再確認していないもの。** 次のものは第6章の記述を信頼していますが、私の確認済みには含めていません。
   - GitHub の MCP 許可リストに関する2026年4月の発表
   - Karpathy の2025年の回顧記事の記述
   - Cockburn の LinkedIn 投稿
   - Houde & Hill（1997）、SEI の原典、Phoenix の序文
   - Azure の責任共有モデル
   - Vercel の2023年10月の発表と、初期 v0 の利用記録
   - Nielsen と英国政府の参加者数の指針

### 7.3 AI 以前の出典をどう使うか：あなたの考えへの意見

あなたの考えは「古典の出典は AI がない時代のものなので、考え方として使える部分と、前提が変わって使えない部分がある」というものでした。私は基本的に賛成です。しかも、**古典の出典そのものに「コストが制約だった」と書かれている**ので、この主張は出典に基づいて言えます。

**読み方のコツ：出典を「原則」と「前提コスト」の2層に分ける**

| 古典の原則 | 出典 | 当時の前提（コスト） | AI で変わったこと | 変わらないこと |
|---|---|---|---|---|
| 複数案を並べて比べる | Dow 2010、Tohidi 2006、Buxton 2007 | 動くものを複数作るのは高い。Tohidi らは紙試作を使い、紙試作は安いので、本来なら時間と費用の面で賄えない数の代替案を早く試せる、と書いている | 動く試作を複数作る費用が下がった（例：Willison は150以上の単一 HTML ツールを、ほぼ LLM に書かせている） | 並べると褒めすぎが減り、弱い案がわかるという心理効果 |
| 端から端まで先に通す | 『達人プログラマー』（曳光弾）、Cockburn（歩く骨格） | 通した骨格は作るのが高いので、捨てずに育てる | 通すのが安くなり、「通して学んだら作り直す」も選べるようになった | 最大の技術リスクを最初に潰す |
| 試作コードを本番に流用しない | Brooks 1975、『達人プログラマー』、英国政府サービスマニュアル | 作り直しは高い。Brooks 自身も1995年に「1つは捨てよ」を見直した | 仕様がはっきりしていれば、作り直しの手間は下がった可能性がある（未検証） | 試作のコードを本番の土台にしない |
| 見た目で完成度を判断されてしまう | Spolsky 2002 | 見た目の完成度と中身の完成度がずれる | AI で試作がリアルになるほど、このずれは**大きくなる**（AI 時代に重要度が増す教訓） | — |
| 全面的な書き直しは危険 | Spolsky 2000 | 書き直しに何年もかかり、その間に競合に負ける | 数日で作ったモックなら、書き直しの手間は小さい | 試作に暗黙に入っている知識（エラー時の振る舞いなど）が抜け落ちる → 仕様抽出で補う |

**あなたの手法の「新しさ」はどこにあるか（私の意見・仮説）**

Buxton（2007）は、スケッチ（速い・安い・使い捨て・たくさん作れる）と、プロトタイプ（ひとつの方向に決めるためのもの）を区別しました（講義資料などの二次資料で確認）。AI 以前は、次の3つを同時に満たすのは費用の面で難しく、選べるのはどれか2つまででした。

- **実際に動く**（AI や CAD まで本物につながる）
- **複数案を同時に作る**
- **使い捨てにできる**

たとえば紙のスケッチは「複数・使い捨て」を満たしますが、動きません。曳光弾は「動く」を満たしますが、1本だけで、捨てません。

リアルライトモックの新しさは、**AI によって「動く試作」にもスケッチと同じ経済性（速い・安い・たくさん・使い捨て）を持たせ、この3つを同時に満たせるようにした点**にある、と私は考えます。個々の要素は古典にありますが、組み合わせを可能にしたのは AI です。Buxton の区別に当てはめると、STEP 2 の3案は「スケッチ」（探るためのもの）、STEP 4 の決定版モックは「プロトタイプ」（方向を決めたもの）にあたります。

この考えを支える一次情報：
- **Dow ら（2010）の結論の一文**：「将来、ソフトウェアツールやインフラの提供者は、人々が代替案をすばやく設計し、実験的に比較できるようにすることで、大きな恩恵をもたらしうる」。代替案を安く作れる道具の価値を、著者自身が予告しています（論文本文で確認）。
- **Tohidi ら（2006）の序論**：複数案を試せるかどうかは、試作の安さ（時間と費用）に左右されると明記しています（論文本文で確認）。同じ論文には、大手企業のデザイン担当副社長の「1案しか出さないデザイナーは、おそらくクビになる。初期の正式なレビューは5案からだ」という言葉も引かれています。
- **英国政府のサービスマニュアル（現行の指針で、AI に特化したものではない）**：Alpha 段階では、いろいろなアイデアを試せる程度の複雑さで作り、本番品質のコードにはしない。Alpha の終わりには、コードも試したアイデアの多くも捨てるつもりでいる。ユーザーリサーチには、より現実に近いコードの試作を勧めている（検索結果の引用で確認）。**動くコードで複数案を作り、検証後に捨てて作り直す**という骨組みは、すでに公的機関の標準的な進め方と同じです。AI が変えたのは、それを数日でできるようにした点です。
- **Dow ら（2011、CHI）**：84名・42組のペアによる実験。3案を共有したペアは、1案だけ（または最良の1案だけ）を共有したペアより、最終広告の評価とクリック率が高く、ペア内の関係も良くなりました（論文ページと発表資料で確認）。同僚と複数案を見せ合う場面に近い研究です。

**ただし「AI なら速い」も条件つきで引用する**

| 研究 | 結果 | この手法への意味 |
|---|---|---|
| Peng ら（2023）：GitHub Copilot のランダム化比較実験 | JavaScript で HTTP サーバーを新しく作る課題で、Copilot を使った群が **55.8% 速かった**（95%信頼区間 21〜89%） | 新しく小さなものを作る作業では AI の効果が大きい → モック作りに向いている |
| METR（2025）：経験豊富なオープンソース開発者のランダム化比較実験 | 16名・246課題。慣れた大規模リポジトリでは、AI を使うと **19% 遅くなった**。本人たちは作業前に24%速くなると予想し、終わった後も20%速くなったと思っていた | 大きく成熟したコードでは、AI が速いとは限らない。**体感の速さと実際の速さはずれる** |

2つを合わせると、「AI は使い捨てのモックのような新規・小規模の作業では速く、成熟した大規模コードでは遅くなることもある」と読めます。これは、リアルライトモックの分け方（モックは AI で速く作り、本番は仕様を固めてから作る）と合っています。ただし、これは私の解釈で、リアルライトモックそのものを測った研究ではありません。また METR の結果からは、**「3〜4日でできた」という体感も、記録を取って確かめる価値がある**と言えます。

### 7.4 正しい引用のしかた（書き方の型と文例）

**3つのラベルを使い分ける**

| ラベル | 意味 | 該当する出典・主張 |
|---|---|---|
| 【実証】 | 研究で測られた事実。条件（人数・課題）を添える | Dow 2010、Tohidi 2006、Dow 2011、Peng 2023、METR 2025、Amershi 2019 |
| 【原則】 | 実務家や公的機関の知見・指針 | 『達人プログラマー』、Cockburn、Brooks、Spolsky、英国政府サービスマニュアル、Buxton |
| 【仮説】 | 本手法の主張。筆者の経験に基づく | 3〜4日で決まる、本番化が最短になる、3つを同時に満たせることの価値 |

**書き方の型**
> 〈出典〉は〈条件〉のもとで〈結果〉を示した。当時は〈前提コスト〉が制約だった。AI で〈何が〉変わったため、本手法では〈主張〉と考える（【仮説】筆者の経験）。

**文例1：02章冒頭の結論（「6つの実証済み知見と見事に合致」の置き換え）**
> リアルライトモックは、ソフトウェア工学と UX 研究の古典的な原則（端から端まで先に通す・複数案を並べて比べる・試作コードは本番に流用しない）を、AI で変わったコスト構造の上で組み合わせ直した手法です。個々の原則には研究や実務の裏付けがあります。一方、組み合わせ全体の効果（3〜4日で UI が決まる、本番化が最短になる）は、筆者の実践に基づく仮説です。

**文例2：③並行プロトタイピング**
> 【実証】Dow ら（2010）の実験（33名・Web バナー広告）では、複数案を作ってからまとめて講評を受けた群のほうが、1案ずつ講評を受けた群より、クリック数が約12%多く、専門家評価も高かった（いずれも統計的に有意）。案の多様性も高かった。Tohidi ら（2006、48名・紙試作）では、1案だけ見せると評価が甘くなり、3案を並べると褒めすぎが減って、最も弱い案への批判がはっきり増えた。ただし改善案の数は増えなかった。
> 【仮説】当時は、こうした比較を「実際に動く試作」で行うには費用がかかりすぎた（Tohidi らは紙試作を使った）。AI によって、動く試作でも同じ比較ができるようになった、というのが本手法の立場です。

**文例3：⑤（「クリーンルーム」の置き換え）**
> 【原則】試作のコードは本番の土台にしない（Brooks 1975、『達人プログラマー』、英国政府サービスマニュアル）。本手法では、決定版モックから画面構成・操作フロー・プロンプト・MCP 呼び出しを**文書の仕様として抽出**し、その仕様を基に AI で本番を作り直す。これは仕様駆動開発（GitHub Spec Kit・Kiro）と同じ流れである。
> 【仮説】AI によって、仕様が固まった後の作り直しの手間は従来より小さくなったと考える。

### 7.5 自分のエビデンスを作る（おすすめ）

組み合わせ全体の効果を示す外部の研究は、まだ見当たりません。逆に言えば、**あなた自身の実践記録が、この手法のいちばん強い根拠になりえます**。次の案件から、次のような簡単な記録を残すことをおすすめします。

| 記録する項目 | 何がわかるか |
|---|---|
| STEP ごとの所要時間（時間単位） | 「3〜4日」が実績値になる（METR が示したとおり、体感だけでは不十分） |
| 3案それぞれへのコメント数（肯定・否定・改善案） | Tohidi と同じ効果（褒めすぎが減る・弱い案がわかる）が、自分の現場でも出たか |
| 決定版に採用された要素（どの案のどの部分か） | 「いいとこ取り」が実際に起きたか |
| デモから承認までの日数 | デモモードの効果 |
| Phase 2 で見つかった仕様の抜けや手戻りの件数 | 「動く仕様書」が本番化で役に立ったか |

数件たまれば、3-4 の 💭 の数字を「社内の実績（n件）」として書けるようになります。

### 7.6 第1〜5章の訂正一覧と、確認の範囲

第1〜5章の本文は書き換えず、記録として残しています。読むときは次の訂正を優先してください。

- 1章サマリー・3-1：Copilot CLI の推論先 → 「GitHub ホストのモデルを使う設定なら社外に送られる。独自のプロバイダーやローカルモデルも選べる」
- 3-1：`--allow-all-tools` が必要 → 誤り。`--allow-tool` で特定のツールだけを許可できる
- 1章サマリー・3-3：「実証は③だけ」→ 「本資料の7型と手法全体は、引用した研究では試されていない」（HAX の18指針は評価済み）
- ①：v0・Bolt.new は単一 HTML を作らない → 「代表的な出力は React 系」
- ②：「（STEP 1）」→ STEP 1（CLI〜CAD）と STEP 2（UI）に分ける
- ③：Tohidi の「批判がより多く・強く出る」→ 7.2 の2と、7.4 の文例2
- ③：Dow の「大幅ではない」→ 数字で書く
- ④：Executable Specification を BDD の用語に限定した点 → 第6章 6.4 のとおり、より広い用語
- README 9行目 → 図は外部ファイル（第6章 6.1）

**この章で、私が原典を読み直して確認したもの**：GitHub Docs（programmatic reference、ツールの許可、Copilot CLI 概説の独自プロバイダーの節）、Tohidi ら 2006 の本文（表1・表2・序論）、Dow ら 2010 の本文（結論）、interactive-guide.html の該当コード。
**検索結果・要旨で確認したもの**：Dow ら 2011、英国政府サービスマニュアル、Buxton 2007 のスケッチの特徴、Peng ら 2023、METR 2025。

**この章で追加した出典**
- Tohidi et al. 2006（共著者公開 PDF）— https://www.billbuxton.com/rightDesign.pdf
- Dow et al. 2011「Prototyping Dynamics」（CHI 2011）— https://hci.stanford.edu/publications/paper.php?id=157
- GOV.UK Service Manual（Alpha 段階）— https://www.gov.uk/service-manual/phases/alpha
- GOV.UK Service Manual「Making prototypes」— https://www.gov.uk/service-manual/design/making-prototypes
- Buxton, B.『Sketching User Experiences』（2007）— https://educate.elsevier.com/book/details/9780123740373 ／ 講義資料での要約：https://cspages.ucalgary.ca/~saul/wiki/uploads/SketchingLectures/sketching-whatisasketch.pdf
- Peng et al. 2023 — https://arxiv.org/abs/2302.06590
- METR 2025 — https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/
- GitHub Docs「Copilot CLI」概説（Using your own model provider）— https://docs.github.com/en/copilot/concepts/copilot-surfaces/copilot-cli
- GitHub Docs「ツールの許可と拒否」— https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli/allowing-tools

---

## 8. 対話からの追記：AI 時代のエビデンスの扱いと、モックの検証プロセス（2026-11-27 追記）

> この章は、第7章を読んだ筆者（リアルライトモックの考案者）と Claude の対話で合意した内容の記録です。第7章は書き換えず、この章で補足・更新します。第7章と食い違う部分は、この章を優先してください（8.6）。

### 8.1 AI の性能・生産性を測った研究は、根拠として引用しない

**筆者の問題提起**

第7章 7.3 では、AI の速さについて Peng ら（2023）と METR（2025）を引用した。しかし、当時の AI と現在（2026年末）の AI とでは、扱えるコンテキストの量も推論の性能も別次元に違う。2023年は生成 AI が出始めたばかりの時期で、2025年も今から見れば十分に古い。細かい指標で比べるまでもなく、性能の違いは明らかである。こうした研究を今の根拠として引用するのは危険だ。

**Claude の見解（同意）**
- AI の性能・生産性を測った研究は、使ったモデルと時期の「スナップショット」にすぎない。
  - Peng ら（2023）の実験は、2022年5〜6月に、一般公開直前の GitHub Copilot で行われた。
  - METR（2025）の実験は、2025年初頭のモデル（主に Cursor＋Claude 3.5/3.7 Sonnet）で行われた。METR 自身も「2025年初頭の AI 能力のスナップショット」と断っている。
- 変化の速さそのものも測られている。METR の別の研究（2025年3月）によると、AI が完了できるタスクの長さ（成功率50%となる長さ）は、2019〜2025年に約7か月ごとに2倍になっていた。2024年以降はさらに速い可能性も示されている。このペースでは、1年前の数字は前提ごと変わってしまう。METR は2026年1月に改訂版（Time Horizon 1.1）を公開しているので、引用する場合は最新版を確認する。
- したがって、第7章 7.3 で Peng と METR から「AI は小さな新規作業では速く、大規模なコードでは遅くなることもある」と一般化した解釈は、根拠としては**撤回**する。この解釈は「大きなものを作っても効率は落ちない」という筆者の実感とも合わない。

**合意したルール：研究は「何を測ったか」で、使える期間が違う**

| 何を測った研究か | 例 | 使える期間 | 引用のしかた |
|---|---|---|---|
| AI の性能・生産性 | Peng 2023、METR 2025 | 数か月〜1年 | 根拠としては使わない。触れる場合は、当時のモデル名と時期を必ず添える。根拠には、今のツールで取った自分の実績（7.5）を使う |
| 人の心理・行動 | Dow 2010、Tohidi 2006、Dow 2011 | 長い（AI の進化とは関係ない） | 条件（人数・課題）を添えれば、今も使える |
| 工学の原則 | Brooks、『達人プログラマー』、英国政府サービスマニュアル、Buxton | 長い（ただしコストの前提は変わる） | 考え方として引用し、前提コストの変化を書き添える |

古い研究は「考え方を補足するため」に使うのが有用で、「AI の性能を示す根拠」として使うのは危険である。これが筆者と Claude の共通の結論である。

### 8.2 作り方：大きなコンテキストで一気に作り、検証しながら改修する

**筆者の実践（【仮説】筆者の経験）**
- 最初に大きなコンテキストをまとめて AI に与え、ベースとなるリアルライトモックを一気に作る。これで、おおむね形はできた。
- その後、実際に動かすと、当然いろいろな問題が出た。
  - 問題を握りつぶしている（エラーが表に出ない）
  - 実は AI をまったく使っていない
  - AI を使っていても、いきなりはうまく動かない
  - 必要な情報が示されていない
- これらの問題には、かなりの修正が必要だった。ただし、同じことは通常のソフトウェア開発でも起きる。小さく刻んで作っても、結局同じところでぶつかる。
- だから「最初から一気に作る」か「小さくステップを踏んで AI で作る」かに、大きな差はない。大きなコンテキストで一定のものを作り、そこから修正をかけていく方法で十分である。

**一発では完成しない：検証と改修こそが本体**
- 大きなコンテキストを与えても、AI がどれだけ進化しても、本当に動くものが一発でできることはない。作った後の検証が必ず要る。
- 見つかった問題は GitHub の Issue にどんどん登録し、AI も活用しながら改修していく。
- この「検証 → Issue 登録 → AI で改修」を高速に回すことで、本当に動くリアルライトモックが短期間でできあがる。この手法の速さは、「一発で作れること」ではなく「改修が速いこと」から生まれる。

**Claude の見解**
- 「作る順番に関係なく、実際に動かして初めてわかる問題は必ず出る」という考えに同意する。
- Claude は当初、「一気に作ると問題同士が隠し合う」と懸念した。これに対し筆者は、たとえば結果が1秒で返ってくれば、AI は考えておらず既定のダミーデータを返しているとすぐにわかる、と答えた。経験のある人ならこうした兆候で偽物を見抜ける、という点はそのとおりである。

### 8.3 前提条件：本物か偽物かを見抜く「肌感覚」（ドメイン知識）が要る

**筆者の指摘**
- 偽物を見抜く肌感覚がない人がリアルライトモックを扱うのは危険である。たとえば、AI が適当にタイマーを仕掛けて、それらしい結果を返すだけの作りにしていても、気づかずに「動いた」と喜んでしまう。
- そうなると、同僚の意見も上長の承認も偽物の動作に基づくことになる。まったく別の結果を得て、問題になりうる。
- この手法の価値は「本当に動くものを触ってもらうこと」にある。だから、本当に動くものを作り、作った後に検証することが欠かせない。**誰でも手放しで使える手法ではなく、対象業務と AI の振る舞いについてのドメイン知識が前提になる。**

**Claude の補足：肌感覚を点検項目に変える**

「1秒で返るのはおかしい」といった筆者の肌感覚は、そのままでは他の人に伝わらない。チームで使うなら、次のような点検項目として書き出しておくと、経験の浅い人の助けになる。ただし、これは肌感覚を補うもので、置き換えるものではない。

| 点検項目 | 見抜けること |
|---|---|
| 応答時間は AI の推論として妥当か（極端に速いならダミーの疑い） | タイマーや固定データで結果を返している |
| 同じ入力を何度か試したとき、出力に適度な変化があるか（毎回まったく同じなら、ほかの項目でも確かめる） | 固定の応答を返している |
| AI CLI・MCP の実際の呼び出し（コマンド・所要時間・戻り値）がログに残っているか | AI や実ツールを呼んでいない |
| わざと失敗させたとき、エラーが画面に出るか | 問題を握りつぶしている |
| 実ツールの成果物（例：CAD のファイル）が実際に生成されているか | 成果物があるように見せているだけ |

> 2つ目と5つ目の項目は Claude の追加提案で、筆者の実践ではまだ試していない。

### 8.4 interactive-guide.html の位置づけ

第6章 6.1 と第7章 7.2 では、interactive-guide.html の「実操作モード」「リアル連動」が表示だけのシミュレーションだと指摘した。これについての筆者の方針を記録しておく。

- interactive-guide.html は、手法を説明するための解説書（ガイド）なので、シミュレーションで問題ない。
- 実際に業務で作っているリアルライトモックは、AI が実際に CLI を叩いて結果を返すところまで作り込んである。
- したがって、第6章・第7章の指摘はガイドの表示についてのものであり、手法そのものや実際のモックの問題ではない。

### 8.5 リアルライトモックの検証プロセス（この章のまとめ）

1. **一気に作る**：大きなコンテキストを AI に与え、ベースのモックを作る
2. **本物か確かめる**：応答時間・ログ・エラー表示・成果物などで、AI と実ツールが実際に動いているかを確認する（8.3）
3. **問題を登録する**：見つかった問題を GitHub の Issue に登録する
4. **AI で改修する**：Issue に沿って、AI も使いながらモックを直し、2 に戻る
5. **触ってもらう**：本当に動くと確認できてから、同僚に触ってもらい、上長にデモする

### 8.6 第7章との関係

| 第7章の箇所 | この章での扱い |
|---|---|
| 7.3「ただし『AI なら速い』も条件つきで引用する」の表と解釈 | 根拠としては撤回（8.1）。AI 性能の研究は、モデル名と時期を添えた参考情報にとどめる |
| 7.4 のラベル表で【実証】に入れた Peng 2023・METR 2025 | 【実証】の根拠としては使わない（8.1）。【実証】は、人の心理・行動や設計指針を測った研究（Dow、Tohidi、Amershi など）に限る |
| 7.5「自分のエビデンスを作る」 | 引き続き有効で、むしろ重要度が上がる。AI 性能の研究はすぐ古くなるので、今のツールで取った自分の記録が最も確かな根拠になる。記録項目に「Issue の件数と、改修にかかった時間」も加えるとよい（8.2） |
| 7.2 の6（ガイドの表示を変えればよい） | ガイドはシミュレーションのままでよい、という筆者の方針を記録した（8.4） |

### 8.7 教材の評価：考え方の整理は有用、裏付けの書き方は反省点

**筆者の評価**

- 教材（README・00〜03章・ガイド・図）は AI が作ったもので、出典や研究の裏付けには「ノリと勢い」で書かれた部分がある。これは大いに反省すべき点である。
- 一方で、考え方の整理や流れは非常にわかりやすい。読んでいて「自分の考え方はこういうことだ」と、うまく整理できていると感じる。

**Claude の見解**

1. **考え方の整理は有用で、検証を通しても骨組みは崩れなかった。**
   - 3つのアプローチ（最初から本格構築・見た目だけのモック・リアルライトモック）を「いつ初めて触れるか」と「手戻りのリスク」で比べており、何が新しいのかがすぐにわかる。
   - 流れ（裏側の貫通 → 3案 → 同僚テストとデモ → 仕様の凝縮 → 本番化）が実務の順番どおりで、次の案件にそのまま使える。
   - 3つの落とし穴（デモの罠・継ぎ足し改修の誘惑・データの境界）は、出典の問題とは関係なく、実務上役に立つ。
   - 「端から端まで先に通す」「複数案を比べる」「試作コードを本番に流用しない」という原則には、実際の裏付けがあった（Dow、Tohidi、Brooks、『達人プログラマー』、英国政府の指針）。間違っていたのは考え方の方向ではなく、裏付けの細部と確信の強さである。
2. **出典の誤りは無作為ではなく、手法をより「裏付け済み」に見せる方向に偏っていた。**
   - **それらしい英語名を作る**：Clean-Room Rewrite via Spec Extraction、Code-First Prototyping & Single-File HTML Artifacts、Incremental Patching。確立した用語に見えるが、その名前の概念はない。
   - **最新トレンドとして権威づける**：「2025〜2026年に確立」「主流化」。
   - **確信を強める**：「証明」「実証済み」「完全一致」「見事に合致」。
   - **依頼者を持ち上げる**：ガイド STEP 4 の「あなたが現場の肌感覚で辿り着いた…単なる自己流ではなく…」は、読者ではなく作成を依頼した人に向けた言葉である。AI が依頼者の考えを肯定する方向に寄る癖が、そのまま出ている。
   - 問題は主に 02章、ガイドの STEP 4、図 rlm-05・rlm-06 に集中している。00・01・03章は大部分が手法そのものの説明なので、出典の問題は少ない（CLI の技術的な細部を除く）。
3. **次に AI に裏付けを書かせたときは**、上の4つのパターン（括弧書きの英語名、最近確立したという主張、断定表現、書き手を持ち上げる言葉）を見つけたら、まず疑って一次情報を調べる。
4. **この evidence.md 自体も、リアルライトモックと同じ道をたどった。** AI が一気に作っておおむね形はできたが、確かめると問題があり、複数回の検証で改修した。検証した Claude 自身も誤りを出していた（Copilot CLI のオプション、Tohidi の読み方、Peng と METR の解釈）が、第6章と筆者の指摘で直った。8.2 の「一発では完成しない、検証と改修こそが本体」は、文書にも当てはまる。
5. **出典の訂正より大きい不足は、第8章の内容が教材に入っていないこと。** 今の教材は、3〜4日で順調に進む流れとして書かれている。今回の議論で出た「一発ではできないので、検証と Issue による改修が要る」「本物か偽物かを見抜く肌感覚が前提になる」は、出典の訂正よりも読み手にとって重要である。

### 8.8 このファイルの読み方（人・AI 共通）

- 章が後になるほど新しい判断である。記述が食い違う場合は、**8章 → 7章 → 6章 → 1〜5章** の順に優先する。
- 1〜5章の誤りと訂正は、7.6 と 8.6 に一覧がある。1〜5章の本文は記録として残しており、書き換えていない。
- 第4章の修正案や 7.4 の文例は一例である。言い回しは文脈に合わせて変えてよい。ただし、事実の範囲（人数・条件・時期）と、仮説であることの明示は変えない。

**この章で追加した出典**
- METR「Measuring AI Ability to Complete Long Tasks」（2025-03。改訂版 Time Horizon 1.1 は 2026-01）— https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/ ／ 論文：https://arxiv.org/abs/2503.14499
- METR「Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity」（2025-07）— https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/
- Peng et al. 2023 — https://arxiv.org/abs/2302.06590
