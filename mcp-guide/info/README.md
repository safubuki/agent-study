# info — MCP（Model Context Protocol）の仕様・設計パターン・議論の調査メモ

[docs/00_mcp-guide.md](../docs/00_mcp-guide.md)、[docs/01_copilot-mcp-guide.md](../docs/01_copilot-mcp-guide.md)、[docs/02_mcp-patterns.md](../docs/02_mcp-patterns.md)、[docs/03_mcp-security-and-rules.md](../docs/03_mcp-security-and-rules.md) を書くために集めた一次情報のメモ置き場です。
1ファイル＝1出典。各ファイルに「いつの情報か」「誰が書いたか」「要点」「短い原文引用」「注意点」を書いています。

- 調査日：**2026-11-10**（01〜10）、**2026-11-28**（11〜14。全体像・使い方の組み合わせ・安全対策の追記のため）
- 選んだ基準：公式仕様（`modelcontextprotocol.io`）、AI 企業・クラウド企業の公式エンジニアリングブログ・公式ドキュメント（Anthropic、Cloudflare、Microsoft / GitHub）、セキュリティ研究機関および業界で広く引用された技術記事。

## 鮮度ラベル

MCP の仕様と周辺エコシステムは1年で大きく進化しているため、各出典に鮮度を付けています（2026-11-10 基準）。

| ラベル | 公開時期 | 読み方 |
|---|---|---|
| **新** | 6か月以内（2026-05 以降） | そのまま参考にしてよい |
| **中** | 6〜12か月前（2025-11〜2026-04） | 考え方は有効。ツールの設定項目や細部の挙動は最新ドキュメントと照合する |
| **古** | 12か月超（〜2025-10） | 原則や問題提起は今も重要だが、当時の「全ツール定義を毎回プロンプトに詰め込む」実装を前提にしている点に注意して読む |

## 出典一覧（公開日・取得日順）

| # | ファイル | 出典 | 種別 | 公開日 / 取得日 | 鮮度 |
|---|---|---|---|---|---|
| 01 | [01_anthropic_introducing-mcp.md](01_anthropic_introducing-mcp.md) | Anthropic「Introducing the Model Context Protocol」 | 公式発表ブログ | 2024-11-25 | 古 |
| 02 | [02_invariant_tool-poisoning-attacks.md](02_invariant_tool-poisoning-attacks.md) | Invariant Labs「MCP Security Notification: Tool Poisoning Attacks」 | セキュリティ研究ブログ | 2025-04-01 | 古 |
| 03 | [03_armin-mario_mcp-vs-cli.md](03_armin-mario_mcp-vs-cli.md) | Armin Ronacher / Mario Zechner「MCP vs CLI・コード実行」議論 | 著名エンジニアのブログ | 2025-07〜2025-08 | 古 |
| 04 | [04_cloudflare_code-mode.md](04_cloudflare_code-mode.md) | Cloudflare「Code Mode: the better way to use MCP」 | 公式エンジニアリングブログ | 2025-09-26 | 古 |
| 05 | [05_anthropic_code-execution-with-mcp.md](05_anthropic_code-execution-with-mcp.md) | Anthropic「Code execution with MCP: Building more efficient agents」 | 公式エンジニアリングブログ | 2025-11-04 | 中 |
| 06 | [06_mcp_spec-2025-2026.md](06_mcp_spec-2025-2026.md) | Model Context Protocol 公式仕様（Architecture / Primitives / Transports） | 公式仕様（modelcontextprotocol.io） | 2025-03〜2026-07（取得 2026-11-10） | 新 |
| 07 | [07_claude-code_mcp-docs.md](07_claude-code_mcp-docs.md) | Claude Code 公式ドキュメント「Connect Claude Code to tools via MCP」 | 公式ドキュメント（随時更新） | 取得 2026-11-10 | 新 |
| 08 | [08_vscode-copilot_mcp-docs.md](08_vscode-copilot_mcp-docs.md) | VS Code / GitHub Copilot 公式ドキュメント「Use MCP servers in VS Code」 | 公式ドキュメント（随時更新） | 取得 2026-11-10 | 新 |
| 09 | [09_anthropic_agent-skills-vs-mcp.md](09_anthropic_agent-skills-vs-mcp.md) | Anthropic「Equipping agents for the real world with Agent Skills」ほか | 公式ブログ・ドキュメント | 2025-10〜2026-11 取得 | 中〜新 |
| 10 | [10_owasp-trailofbits_mcp-security.md](10_owasp-trailofbits_mcp-security.md) | OWASP MCP Top 10 / 実践セキュリティ対策整理 | セキュリティガイドライン | 2025-10〜2026-06 | 新 |
| 11 | [11_mcp_security-best-practices.md](11_mcp_security-best-practices.md) | Model Context Protocol 公式仕様「Security Best Practices」 | 公式仕様 | 取得 2026-11-28 | 新 |
| 12 | [12_claude-code_managed-mcp.md](12_claude-code_managed-mcp.md) | Claude Code 公式ドキュメント「Control MCP server access for your organization」 | 公式ドキュメント（随時更新） | 取得 2026-11-28 | 新 |
| 13 | [13_github-copilot_mcp-management.md](13_github-copilot_mcp-management.md) | GitHub Docs「MCP management」 | 公式ドキュメント（随時更新） | 取得 2026-11-28 | 新 |
| 14 | [14_claude-api_mcp-connector.md](14_claude-api_mcp-connector.md) | Claude API 公式ドキュメント「MCP connector」 | 公式ドキュメント（ベータ機能） | 取得 2026-11-28 | 新 |

## 出典どうしの関係（読み方のヒント）

- **MCP の基本設計と進化**：01（Anthropic の初期発表）が「なぜ N×M 問題を解決する共通規格が必要か」を示し、06（公式仕様）が Host / Client / Server の3層構造、Tools / Resources / Prompts の3機能、および stdio から Streamable HTTP・OAuth 2.1・ステートレス化への進化を定義している。
- **「なんでも MCP にするとトークンが枯渇する」問題と解決策**：03（Armin Ronacher / Mario Zechner）が「CLI や Bash があれば MCP は不要ではないか」「ツール定義でコンテキストが溢れる」と問題提起し、04（Cloudflare の Code Mode）と 05（Anthropic の Code execution with MCP）、さらに 07（Claude Code の MCP Tool Search）が「オンデマンド検索（遅延読み込み）とコード実行」でトークン消費を 95〜99% 削減する解決策を示した。
- **CLI・Skills・サブエージェントとの使い分け**：03・07・09 が「手順や知識は Skills、既存コマンドは CLI、外部 SaaS 連携や権限分離されたゲートウェイは MCP」という 2026年時点の住み分けを示している。
- **セキュリティの落とし穴**：02（Invariant Labs）が「ツール説明文に悪意ある指示を混ぜる Tool Poisoning」を実証し、10（OWASP MCP Top 10 等）がサンドボックス化や最小権限の原則を整理している。11（公式仕様）は、ローカルでの任意のコード実行・トークンの流用禁止・権限の最小化などを仕様として定めている。
- **職場での管理**：12（Claude Code）と 13（GitHub Copilot）が、管理者が使ってよいサーバーを配る・絞る仕組み（許可リスト・拒否リスト・組織ポリシー）を示している。
- **使い方の組み合わせ**：07・08 が既製の AI ツールからの使い方、14 がクラウドの API 側からリモートの MCP サーバーを呼ぶ使い方（ローカルの stdio は不可）を示している。
