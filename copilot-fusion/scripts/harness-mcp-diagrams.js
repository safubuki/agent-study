// MCP の原因と対処を、整理されたフロー図として生成する。
module.exports = function generateMcpDiagrams({ Drawing }) {
  const colors = {
    ui: ['#eff6ff', '#2563eb'],
    harness: ['#ecfdf5', '#059669'],
    review: ['#fffbeb', '#b45309'],
    tool: ['#ecfeff', '#0e7490'],
    process: ['#f8fafc', '#64748b'],
  };
  function label(d, x, y, text, size = 20, color = '#334155', weight = 400, width = 1000) {
    d.text(x, y, text, size, color, weight, 'start', [x - 2, y - size - 3, width, size + 12]);
  }
  function card(d, x, y, w, h, title, lines, role = 'harness', titleSize = 21, badgeNum = null) {
    const [fill, stroke] = colors[role];
    d.rect(x, y, w, h, fill, stroke, 12);
    let titleX = x + 22;
    if (badgeNum) {
      d.parts.push(`<circle cx="${x + 34}" cy="${y + 30}" r="16" fill="${stroke}"/>`);
      d.text(x + 34, y + 36, badgeNum, 17, '#fff', 700, 'middle', [x + 18, y + 14, 32, 32]);
      titleX = x + 60;
    }
    label(d, titleX, y + 37, title, titleSize, stroke, 700, w - (titleX - x) - 18);
    lines.forEach((line, i) => label(d, x + 22, y + 72 + i * 28, line, 17.5, '#334155', 400, w - 42));
  }
  function banner(d, x, y, w, h, badgeNum, title, role) {
    const [fill, stroke] = colors[role];
    d.rect(x, y, w, h, fill, stroke, 12);
    d.parts.push(`<circle cx="${x + 36}" cy="${y + h / 2}" r="18" fill="${stroke}"/>`);
    d.text(x + 36, y + h / 2 + 6, badgeNum, 18, '#fff', 700, 'middle', [x + 18, y + 6, 36, h - 12]);
    label(d, x + 68, y + h / 2 + 8, title, 21, '#0f172a', 700, w - 88);
  }
  function down(d, x, y1, y2, role = 'process') {
    d.line(x, y1, x, y2, role);
  }
  function pathNoArrow(d, pts, role) {
    const stroke = colors[role][1];
    d.parts.push(`<path d="${pts}" fill="none" stroke="${stroke}" stroke-width="2"/>`);
  }

  // 1) 3フェーズ×2段のコンパクト図：幅を有効活用し、Before → 停止 → After を1画面で示す。
  let d = new Drawing('harness-mcp-before-after.svg',
    'なぜ見えない？ teamDocs が転送される前に止まる流れ',
    '左から右へ 3 つの段階（各列は上から下）で進み、④ の転送チェックで定義が除外される様子を示す。');

  const cols = [
    { x: 32, w: 352, role: 'ui', header: '段階 1：Local で利用できていた' },
    { x: 424, w: 352, role: 'review', header: '段階 2：切替後に定義が届かない' },
    { x: 816, w: 352, role: 'harness', header: '段階 3：移行と起動環境で復旧' },
  ];
  for (const col of cols) {
    d.rect(col.x, 114, col.w, 40, ...colors[col.role], 8);
    d.text(col.x + col.w / 2, 141, col.header, 17, colors[col.role][1], 700, 'middle', [col.x + 8, 116, col.w - 16, 36]);
  }

  // 列内の上→下カード（上段 y=174..358, 下段 y=412..596）
  card(d, 32, 174, 352, 184, 'Local が旧設定を読む', [
    '.vscode/mcp.json を読み込み',
    'servers → teamDocs を取得。',
    '認証：Bearer ${input:docs-key}',
  ], 'ui', 19.5, '1');
  down(d, 208, 358, 412, 'ui');
  card(d, 32, 412, 352, 184, '入力解決して接続・検索', [
    'VS Code の入力ダイアログで',
    'キーを受け取り HTTP 認証。',
    '検索ツールが一覧に現れ使える。',
  ], 'ui', 19.5, '2');

  // ② → ③ の列跨ぎ接続
  d.route('M384 504 H404 V266 H424', 'review');

  card(d, 424, 174, 352, 184, 'Session Target を切替', [
    '新チャットで Copilot を選択。',
    'エディタは転送できる定義だけを',
    '選んで Copilot 側へ渡そうとする。',
  ], 'review', 19.5, '3');
  down(d, 600, 358, 412, 'review');
  card(d, 424, 412, 352, 184, '停止：転送前チェックで除外', [
    '${input:docs-key} が必要なため',
    '値の解決前に転送対象外となる。',
    'Local で入力済みでも一覧に出ない。',
  ], 'review', 19.5, '4');

  // ④ → ⑤ の列跨ぎ接続
  d.route('M776 504 H796 V266 H816', 'harness');

  card(d, 816, 174, 352, 184, '設定と起動環境を整える', [
    '.mcp.json（mcpServers）へ直し',
    '${DOCS_API_KEY} 参照へ変更。',
    '実行先へキー注入 → Host 再起動。',
  ], 'harness', 19.5, '5');
  down(d, 992, 358, 412, 'harness');
  card(d, 816, 412, 352, 184, '新セッションで検索まで確認', [
    '新しい Copilot チャットを開き',
    '表示・接続に加えて実際に検索を',
    '呼び出し結果が返るか確かめる。',
  ], 'harness', 19.5, '6');

  d.finish(724, [
    'teamDocs は固定トークン方式の例。OAuth 対応サーバーなら Copilot 側の OAuth 認証も選べる。',
    '入力変数を含まない旧設定など転送できる定義もある。届け方と認証の選び方は次の手順図へ。',
  ]);

  // 2) 対処フロー：すべての線の起点と終点をカード・見出し枠・矢印で途切れなく接続する。
  d = new Drawing('harness-mcp-migration.svg',
    '見えないときの対処：設定 → 認証 → 動作確認',
    '上から下へ進める。②は設定の届け方、③は認証方式の選択。teamDocs は② B → ③ 固定トークンへ。');

  card(d, 44, 124, 1112, 128, '対象と旧設定を確認する', [
    'Session Target＝Copilot、作業フォルダ、実行先（手元 PC / リモート / コンテナ）を確認する。',
    'Chat: Open Customizations を開き、変更前に元の MCP 設定ファイルを保管しておく。',
  ], 'process', 21, '1');
  down(d, 600, 252, 290, 'process');

  banner(d, 44, 290, 1112, 60, '2', 'まず、定義を Copilot に届ける経路を選ぶ', 'ui');
  pathNoArrow(d, 'M600 350 V374', 'ui');
  d.route('M600 374 H312 V404', 'ui');
  d.route('M600 374 H888 V404', 'harness');

  card(d, 44, 404, 536, 188, 'A　転送条件を満たす場合', [
    '.vscode/mcp.json は元の場所に残す。',
    'エディタが定義を Copilot に自動転送する。',
    '※ ${input:...} やコマンド変数付きは対象外。',
  ], 'ui', 20.5);
  card(d, 620, 404, 536, 188, 'B　ネイティブ設定へ移行（teamDocs 例）', [
    '入力変数付き定義はこの経路で直す。',
    '.mcp.json / mcpServers 形式へ書き換える。',
    'Migrations の手動確認項目（password 入力等）を解消。',
  ], 'harness', 20.5);

  pathNoArrow(d, 'M312 592 V622 H600', 'ui');
  pathNoArrow(d, 'M888 592 V622 H600', 'harness');
  down(d, 600, 622, 654, 'harness');

  banner(d, 44, 654, 1112, 60, '3', '次に、サーバーが要求する認証方法を選ぶ', 'harness');
  pathNoArrow(d, 'M600 714 V738', 'harness');
  d.route('M600 738 H312 V768', 'harness');
  d.route('M600 738 H888 V768', 'harness');

  card(d, 44, 768, 536, 168, 'OAuth 対応のサーバー', [
    'Copilot 側の対応する認証操作を行う。',
    '例：ブラウザーでサインインして許可する。',
    '旧 API キーの転送とは別の新しい認証フロー。',
  ], 'harness', 20.5);
  card(d, 620, 768, 536, 168, '固定トークンを使うサーバー', [
    '環境変数を使える場合の対処例：',
    '設定には ${DOCS_API_KEY} の参照だけを書く。',
    '実行先へキーを注入し Agent Host を再起動。',
  ], 'harness', 20.5);

  pathNoArrow(d, 'M312 936 V966 H888 V936', 'harness');
  down(d, 600, 966, 998, 'tool');

  card(d, 44, 998, 1112, 162, '新しい Copilot セッションで、3段階を確認する', [
    '発見：Customizations に対象のサーバーが表示される。',
    '接続・認証：サーバーへ接続でき、認証エラーが出ない。',
    '実行：検索ツールを呼び、期待する文書が結果として返る。',
  ], 'tool', 21, '4');
  down(d, 600, 1160, 1200, 'tool');

  card(d, 44, 1200, 1112, 128, '動いたことを確認してから、旧設定の重複を整理する', [
    '一覧への表示だけで完了とせず、失敗したら該当段階の設定・認証・ツール定義を見直す。',
    '自動 Migrate は変換済み旧エントリを削除する場合があるため、保管した原本も確認する。',
  ], 'process', 21, '5');

  d.finish(1460, [
    '認証が不要なサーバーは③を省略。固定トークンが必要で環境変数も使えない場合は、本文の制約を確認する。',
    '設定ファイルのコピーだけでは inputs は使えない。環境変数の反映順序と具体例は、次の図で確認する。',
  ]);

  // 4列シーケンス：白い長方形の帯を廃止し、縦線を途切れさせない。
  d = new Drawing('harness-mcp-env-sequence.svg',
    '環境変数で復旧：設定 → 起動環境 → 接続 → 検索',
    '上から下へ時間が進む。起動環境を整えてから Host を再起動し、最後に検索結果を確かめる。');

  // 外枠（背景色 #f8fafc）は最背面（ライフラインの裏）に描く。
  d.rect(316, 108, 568, 1084, '#f8fafc', '#cbd5e1', 12);
  label(d, 334, 134, '実行先：PC / リモートホスト / コンテナ', 16, '#475569', 700, 530);

  const lanes = [
    [164, 'あなた', '設定の変更・結果の確認', 'ui'],
    [454, '設定・起動環境', 'Host が受け継ぐ環境', 'process'],
    [744, 'Copilot ハーネス', 'Agent Host 側で動作', 'harness'],
    [1034, 'teamDocs', 'HTTP MCP サーバー', 'tool'],
  ];

  // ライフライン（y=222 〜 y=1182 まで全列同じ長さで描画）。
  for (const [x, , , role] of lanes) {
    d.line(x, 222, x, 1182, role, true, false);
  }
  // 上端の登場人物ボックス。
  for (const [x, title, sub, role] of lanes) {
    d.rect(x - 122, 150, 244, 72, ...colors[role], 9);
    d.text(x, 181, title, 20, colors[role][1], 700, 'middle', [x - 114, 156, 228, 34]);
    d.text(x, 209, sub, 15, '#475569', 400, 'middle', [x - 114, 189, 228, 30]);
  }

  // 文字と縦線が交差するときだけ、背景と同色の細い縁取り(halo)を付けて白い帯を出さない。
  function estWidth(str, size) {
    let w = 0;
    for (const ch of str) w += /[\x00-\x7f]/.test(ch) ? size * 0.56 : size * 1.02;
    return w;
  }
  function haloText(x, y, str, size, color, weight, haloColor) {
    const attrs = `x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" text-anchor="middle"`;
    if (haloColor) {
      d.parts.push(`<text ${attrs} fill="none" stroke="${haloColor}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round">${str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'})[c])}</text>`);
    }
    d.text(x, y, str, size, color, weight, 'middle', [x - 240, y - size - 2, 480, size + 10]);
  }
  function message(from, to, y, title, detail, role = 'harness', reply = false) {
    const center = (from + to) / 2;
    const minX = Math.min(from, to);
    const maxX = Math.max(from, to);
    const titleW = estWidth(title, 16.5);
    const detailW = detail ? estWidth(detail, 14) : 0;
    const maxW = Math.max(titleW, detailW);
    // 縦線(164, 454, 744, 1034)または枠線(316, 884)とテキストが重なるか確認する。
    const textLeft = center - maxW / 2 - 4;
    const textRight = center + maxW / 2 + 4;
    const crossesLine = [164, 454, 744, 1034].some(lx => textLeft < lx && lx < textRight);
    // 中心が実行先枠(316..884)の内側にあれば #f8fafc、外なら #ffffff で輪郭抜きする。
    const haloColor = crossesLine ? (center > 316 && center < 884 ? '#f8fafc' : '#ffffff') : null;

    haloText(center, y - (detail ? 34 : 13), title, 16.5, colors[role][1], 700, haloColor);
    if (detail) {
      haloText(center, y - 13, detail, 14, '#475569', 400, haloColor);
    }
    d.line(from, y, to, y, role, reply);
  }

  // ① アクションは左列(あなた: x=164)上に置き、隣の柱(x=454)に重ねない。
  d.rect(42, 246, 244, 96, ...colors.ui, 10);
  d.text(164, 276, '① 旧設定を保管し変換', 17, colors.ui[1], 700, 'middle', [48, 252, 232, 32]);
  d.text(164, 302, '.mcp.json / mcpServers へ', 14.5, '#334155', 400, 'middle', [48, 282, 232, 26]);
  d.text(164, 326, 'Bearer ${DOCS_API_KEY}', 14.5, '#334155', 400, 'middle', [48, 306, 232, 26]);

  message(164, 454, 412, '② 実行先へキーを用意する', 'DOCS_API_KEY を起動環境へ注入', 'ui');
  message(454, 744, 502, '③ 再起動した Host が環境を継承', '対象のクライアント / Agent Host を再起動', 'process');
  message(164, 744, 594, '④ 新しい Copilot セッションを開く', '対象＝Copilot で teamDocs の表示を確認', 'ui');

  // 右端を枠(884)の内側にきれいに収める。
  d.rect(618, 622, 252, 102, ...colors.harness, 10);
  d.text(744, 654, '設定と変数を解決', 18, colors.harness[1], 700, 'middle', [626, 628, 236, 32]);
  d.text(744, 684, '.mcp.json を読む', 15, '#334155', 400, 'middle', [626, 662, 236, 28]);
  d.text(744, 709, '${DOCS_API_KEY}', 15, '#334155', 400, 'middle', [626, 687, 236, 28]);

  message(744, 1034, 796, '認証ヘッダーを付けて接続', null, 'harness');
  message(1034, 744, 864, '公開ツールの一覧を返す', null, 'tool', true);
  message(164, 744, 944, '⑤ teamDocs の検索を依頼する', null, 'ui');
  message(744, 1034, 1012, '検索ツールを呼び出す', null, 'harness');
  message(1034, 744, 1080, '文書の検索結果を返す', null, 'tool', true);
  message(744, 164, 1152, 'ツール呼出しと文書の内容を確認する', null, 'harness', true);

  d.finish(1306, [
    '② → ③の順序が要点。別ターミナルだけに変数を追加しても、起動済み Host の環境は変わらない。',
    '固定トークンを使える場合の例。設定には参照だけを書き、キーの実値は画面やログに出さない。',
  ]);
};
