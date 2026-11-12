// MCP の原因と対処を、上から下へ時間が進む図として生成する。
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
  function card(d, x, y, w, h, title, lines, role = 'harness', titleSize = 23) {
    const [fill, stroke] = colors[role];
    d.rect(x, y, w, h, fill, stroke, 12);
    label(d, x + 22, y + 36, title, titleSize, stroke, 700, w - 42);
    lines.forEach((line, i) => label(d, x + 22, y + 72 + i * 29, line, 20, '#334155', 400, w - 42));
  }
  function badge(d, x, y, number, role) {
    const [, stroke] = colors[role];
    d.parts.push(`<circle cx="${x}" cy="${y}" r="24" fill="${stroke}"/>`);
    d.text(x, y + 8, number, 23, '#fff', 700, 'middle', [x - 24, y - 20, 48, 44]);
  }
  function step(d, y, number, title, lines, role = 'harness', h = 132) {
    badge(d, 66, y + 34, number, role);
    card(d, 116, y, 1056, h, title, lines, role);
  }
  function down(d, x, y1, y2, role = 'process') {
    d.line(x, y1, x, y2, role);
  }

  let d = new Drawing('harness-mcp-before-after.svg',
    'なぜ見えない？ teamDocs が転送される前に止まる例',
    '上から下へ時間が進む。④は接続・認証より前の停止。サーバーの障害とは切り分けて考える。');
  for (const [x, w, text, role] of [
    [116, 328, 'Local：利用できていた', 'ui'],
    [464, 328, '切り替え：定義が届かない', 'review'],
    [812, 360, '対処後：検索まで確かめる', 'harness'],
  ]) {
    d.rect(x, 112, w, 32, ...colors[role], 6);
    label(d, x + 14, 135, text, 18, colors[role][1], 700, w - 28);
  }
  d.line(66, 204, 66, 1058, 'process', true, false);
  step(d, 170, '1', 'Local が旧設定を読む', [
    '.vscode/mcp.json → servers → teamDocs',
    '認証ヘッダー：Bearer ${input:docs-key}',
  ], 'ui', 120);
  down(d, 644, 290, 334, 'ui');
  step(d, 334, '2', '入力を解決して、サーバーへ接続する', [
    'VS Code の入力ダイアログでキーを受け取り、HTTP サーバーに認証。',
    '公開された検索ツールを使える。ここまでは Local での動作。',
  ], 'ui', 120);
  down(d, 644, 454, 498, 'ui');
  step(d, 498, '3', '新しいセッションの対象を Copilot に変える', [
    '旧ファイルはそのまま。エディタは、転送条件を満たす定義を選ぶ。',
    'Local の入力値が、Copilot にも引き継がれるとは限らない。',
  ], 'review', 120);
  down(d, 644, 618, 662, 'review');
  step(d, 662, '4', 'ここで停止：入力の値を解決する前の「転送チェック」', [
    '${input:docs-key} が必要 → この定義は転送の対象外。',
    '定義が届かない → 接続に進まない → ツール一覧に現れない。',
    'Local で入力済み・キャッシュ済みでも、この条件は変わらない。',
  ], 'review', 154);
  down(d, 644, 816, 860, 'review');
  step(d, 860, '5', 'Copilot 用の設定と、認証に使う環境を整える', [
    '.mcp.json / mcpServers へ変換し、${DOCS_API_KEY} を参照する。',
    '実行先へキーを用意 → 対象のクライアント / Agent Host を再起動。',
  ], 'harness', 120);
  down(d, 644, 980, 1024, 'harness');
  step(d, 1024, '6', '新しい Copilot セッションから検索し、復旧を確認する', [
    'サーバーが表示される → 接続・認証できる → 検索結果が返る。',
    '一覧への表示だけで終えず、呼び出したツールと文書の内容を確認する。',
  ], 'harness', 120);
  d.finish(1270, [
    'teamDocs は固定トークン方式の説明用例。OAuth 対応なら、サーバーが提供する認証方式も選べる。',
    '旧設定がすべて使えなくなるわけではない。転送できる定義と、移行が必要な定義の選び方は次の図へ。',
  ]);

  d = new Drawing('harness-mcp-migration.svg',
    '見えないときの対処：設定 → 認証 → 動作確認',
    '上から下へ進める。②は設定の届け方、③は認証方式の選択。teamDocs は② B → ③ 固定トークンへ。');
  step(d, 130, '1', '対象と旧設定を確認する', [
    'Session Target＝Copilot、作業フォルダ、実行先の PC / リモート / コンテナを確認。',
    'Chat: Open Customizations を開く。変更前に元の MCP 設定を保管する。',
  ], 'process');
  down(d, 644, 262, 294);
  badge(d, 66, 340, '2', 'ui');
  label(d, 116, 336, 'まず、定義を Copilot に届ける経路を選ぶ', 24, '#0f172a', 700);
  d.route('M644 350 V366 H366 V398', 'ui');
  d.route('M644 350 V366 H909 V398', 'harness');
  card(d, 116, 398, 500, 192, 'A　転送条件を満たす場合', [
    '.vscode/mcp.json は元の場所に残す。',
    'エディタが定義を Copilot に渡す。',
    '入力・コマンド変数付きは対象外。',
  ], 'ui');
  card(d, 646, 398, 526, 192, 'B　ネイティブ設定へ移行', [
    '入力変数付きの teamDocs はこの経路。',
    '.mcp.json / mcpServers へ変換する。',
    'Migrations の手動確認項目も確認。',
    'password 入力は自動移行の対象外。',
  ], 'harness');
  d.route('M366 590 V620 H644 V660', 'ui');
  d.route('M909 590 V620 H644 V660', 'harness');
  badge(d, 66, 694, '3', 'harness');
  label(d, 116, 690, '次に、サーバーが要求する認証方法を選ぶ', 24, '#0f172a', 700);
  card(d, 116, 752, 500, 168, 'OAuth 対応のサーバー', [
    'Copilot 側の対応する認証操作を行う。',
    '例：ブラウザーでサインインして許可。',
    '旧 API キーの転送とは別の認証方式。',
  ], 'harness');
  card(d, 646, 752, 526, 168, '固定トークンを使うサーバー', [
    '環境変数を使える場合の例：',
    '設定は ${DOCS_API_KEY} の参照にする。',
    '実行先へキーを注入 → 起動環境に反映。',
  ], 'harness');
  d.route('M644 704 V720 H366 V752', 'harness');
  d.route('M644 704 V720 H909 V752', 'harness');
  d.route('M366 920 V950 H644 V990', 'harness');
  d.route('M909 920 V950 H644 V990', 'harness');
  step(d, 990, '4', '新しい Copilot セッションで、3段階を確認する', [
    '発見：Customizations に対象のサーバーが表示される。',
    '接続・認証：サーバーへ接続でき、認証エラーが出ない。',
    '実行：検索ツールを呼び、期待する文書が結果として返る。',
  ], 'tool', 166);
  down(d, 644, 1156, 1200, 'tool');
  step(d, 1200, '5', '動いたことを確認してから、旧設定の重複を整理する', [
    '表示だけで完了としない。失敗したら、その段階の設定・認証・ツールを見直す。',
    'Migrate は変換済みの旧エントリを削除する場合があるため、保管した原本も確認。',
  ], 'process');
  d.finish(1472, [
    '認証が不要なサーバーは③を省略。固定トークンが必要で環境変数を使えない場合は、本文の制約を確認する。',
    '設定ファイルのコピーだけでは inputs は使えない。環境変数の反映順序と具体例は、次の図で確認する。',
  ]);

  d = new Drawing('harness-mcp-env-sequence.svg',
    '環境変数で復旧：設定 → 起動環境 → 接続 → 検索',
    '上から下へ時間が進む。起動環境を整えてから Host を再起動し、最後に検索結果を確かめる。');
  d.rect(316, 104, 566, 1040, '#f8fafc', '#cbd5e1', 12);
  label(d, 334, 131, '実行先：PC / リモートホスト / コンテナ', 17, '#475569', 700, 530);
  const lanes = [
    [164, 'あなた', '設定の変更・結果の確認', 'ui'],
    [454, '設定・起動環境', 'Host が受け継ぐ環境', 'process'],
    [744, 'Copilot ハーネス', 'Agent Host 側で動作', 'harness'],
    [1034, 'teamDocs', 'HTTP MCP サーバー', 'tool'],
  ];
  for (const [x, title, sub, role] of lanes) {
    d.line(x, 220, x, 1138, role, true, false);
    d.rect(x - 124, 148, 248, 72, ...colors[role], 9);
    d.text(x, 179, title, 21, colors[role][1], 700, 'middle', [x - 116, 154, 232, 34]);
    d.text(x, 207, sub, 16, '#475569', 400, 'middle', [x - 116, 187, 232, 30]);
  }
  // ラベルの白地で生命線を隠し、操作とその受け渡しを読み分けられるようにする。
  function message(from, to, y, title, detail, role = 'harness', reply = false) {
    const left = Math.min(from, to) - 116;
    const width = Math.abs(to - from) + 232;
    d.rect(left, y - (detail ? 78 : 44), width, detail ? 68 : 34, '#fff', 'none', 6);
    const center = (from + to) / 2;
    d.text(center, y - (detail ? 49 : 20), title, 21, colors[role][1], 700, 'middle', [left + 8, y - (detail ? 76 : 44), width - 16, 36]);
    if (detail) d.text(center, y - 20, detail, 18, '#475569', 400, 'middle', [left + 8, y - 44, width - 16, 34]);
    d.line(from, y, to, y, role, reply);
  }
  card(d, 40, 246, 538, 112, '① 旧設定を保管し、設定を変換する', [
    'ワークスペース直下 .mcp.json / mcpServers',
    '認証ヘッダー：Bearer ${DOCS_API_KEY}',
  ], 'ui', 22);
  message(164, 454, 448, '② 実行先へキーを用意する', 'DOCS_API_KEY を起動環境へ注入', 'ui');
  message(454, 744, 554, '③ 再起動した Host が環境を継承', '対象のクライアント / Agent Host を再起動', 'process');
  message(164, 744, 660, '④ 新しい Copilot セッションを開く', '対象＝Copilot。teamDocs の表示を確認する', 'ui');
  card(d, 608, 692, 272, 112, '設定と変数を解決', [
    '.mcp.json を読む',
    '${DOCS_API_KEY}',
  ], 'harness', 21);
  message(744, 1034, 860, '認証ヘッダーを付けて接続', null, 'harness');
  message(1034, 744, 918, '公開ツールの一覧', null, 'tool', true);
  message(164, 744, 984, '⑤ teamDocs の検索を依頼する', null, 'ui');
  message(744, 1034, 1042, '検索ツールを呼び出す', null, 'harness');
  message(1034, 744, 1100, '文書の検索結果', null, 'tool', true);
  // 最終応答まで生命線を延長する。
  for (const [x, , , role] of lanes) d.line(x, 1138, x, 1168, role, true, false);
  message(744, 164, 1158, 'ツール呼出しと文書の内容を確認する', null, 'harness', true);
  d.finish(1290, [
    '② → ③の順序が要点。別ターミナルだけに変数を追加しても、起動済み Host の環境は変わらない。',
    '固定トークンを使える場合の例。設定には参照だけを書き、キーの実値は画面やログに出さない。',
  ]);
};
