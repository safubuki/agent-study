<#
.SYNOPSIS
  同じお題を「MCP を使わない（no-mcp）」「MCP を使う（with-mcp）」の2通りで AI に作らせ、
  かかった時間・ターン数・トークン・コスト・数値の正確さを記録する。
    no-mcp   … 方式 A：MCP ツールを禁止し、生の data/menu-catalog.json を AI 自身が読んで暗算・集計させる
    with-mcp … 方式 B：生データの直接閲覧を控えさせ、cafe-catalog MCP サーバーの3ツールで正確に検索・計算させる

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\run-experiment.ps1 -Prompt prompts\01-allergen-menu.md -Mode no-mcp -Model sonnet -Open
  powershell -ExecutionPolicy Bypass -File scripts\run-experiment.ps1 -Prompt prompts\01-allergen-menu.md -Mode with-mcp -Model sonnet -Open
  powershell -ExecutionPolicy Bypass -File scripts\run-experiment.ps1 -Prompt prompts\02-seasonal-fair.md -Mode no-mcp -Model sonnet -Open
  powershell -ExecutionPolicy Bypass -File scripts\run-experiment.ps1 -Prompt prompts\02-seasonal-fair.md -Mode with-mcp -Model sonnet -Open

.NOTES
  - mcp-guide フォルダで実行する想定（スクリプトが自動で mcp-guide 直下に移動する）。
  - 結果は output\<日時>_<お題>_<方式>\ に保存され、output\summary.md に1行追記される。
#>
param(
    [Parameter(Mandatory = $true)][string]$Prompt,
    [Parameter(Mandatory = $true)][ValidateSet('no-mcp', 'with-mcp')][string]$Mode,
    [string]$Model = '',
    [switch]$Open
)

$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding $false
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8

$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
    foreach ($n in 'CLAUDECODE', 'CLAUDE_PID', 'CLAUDE_AGENT_SDK_VERSION', 'CLAUDE_CODE_CHILD_SESSION',
        'CLAUDE_CODE_ENTRYPOINT', 'CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_SESSION_ATTENDED',
        'CLAUDE_CODE_MESSAGING_SOCKET', 'CLAUDE_CODE_MESSAGING_TOKEN', 'CLAUDE_CODE_EMIT_STARTUP_TIMING',
        'CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING', 'CLAUDE_CODE_STARTUP_FAILURE_RESULTS',
        'CLAUDE_CODE_QUESTION_PREVIEW_FORMAT', 'CLAUDE_CODE_ENABLE_TASKS') {
        Remove-Item "Env:$n" -ErrorAction SilentlyContinue
    }

    if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
        throw 'claude コマンドが見つかりません。Claude Code CLI をインストールしてください。'
    }

    $promptPath = (Resolve-Path $Prompt).Path
    $topic = [IO.Path]::GetFileNameWithoutExtension($promptPath)
    $promptRel = $promptPath.Substring($root.Length).TrimStart('\').Replace('\', '/')
    $runName = '{0}_{1}_{2}' -f (Get-Date -Format 'yyyyMMdd-HHmmss'), $topic, $Mode
    $runRel = "output/$runName"
    $runDir = Join-Path $root "output\$runName"
    New-Item -ItemType Directory -Path $runDir | Out-Null

    $request = [IO.File]::ReadAllText($promptPath, $utf8)
    $cliArgs = @('-p', '--output-format', 'json', '--permission-mode', 'acceptEdits', '--disallowedTools', 'Agent')
    if ($Model) { $cliArgs += @('--model', $Model) }

    if ($Mode -eq 'no-mcp') {
        # 方式 A：MCP ツールを使わせず、生データ（data/menu-catalog.json）を自分で読んで計算・制作させる
        $request += "`n`n---`n【実行条件：方式A（no-mcp）】`n- MCP ツールは使わず、`data/menu-catalog.json` を Read ツールで直接読んで、メニューの抽出と価格・税額・原価率の計算をすべてあなた自身で行ってください。`n- 完成品は `$runRel/index.html` に、HTML・CSS・JavaScript をすべて含む1ファイルとして保存してください。"
        $cliArgs += @('--disallowedTools', 'mcp__cafe-catalog__search_menu,mcp__cafe-catalog__check_allergens,mcp__cafe-catalog__calculate_set_price')
    }
    else {
        # 方式 B：MCP サーバー（cafe-catalog）のツールを使って正確に検索・計算させる
        $request += "`n`n---`n【実行条件：方式B（with-mcp）】`n- 生データ（`data/menu-catalog.json`）は直接読まず、必ず MCP サーバー `cafe-catalog` のツール（`search_menu`、`check_allergens`、`calculate_set_price`）を呼び出して正確な抽出結果と計算値を取得してください。`n- 完成品は `$runRel/index.html` に、HTML・CSS・JavaScript をすべて含む1ファイルとして保存してください。"
        $cliArgs += @('--mcp-config', '.mcp.json',
            '--allowedTools', 'mcp__cafe-catalog__search_menu,mcp__cafe-catalog__check_allergens,mcp__cafe-catalog__calculate_set_price,Write,Edit')
    }

    Write-Host "[$runName] 開始します（$Mode）。終わるまで数分かかります…" -ForegroundColor Cyan
    $started = Get-Date
    $sw = [Diagnostics.Stopwatch]::StartNew()
    $raw = $request | & claude @cliArgs
    $exitCode = $LASTEXITCODE
    $sw.Stop()
    $finished = Get-Date

    $rawText = ($raw | Out-String).Trim()
    [IO.File]::WriteAllText((Join-Path $runDir 'result.json'), $rawText, $utf8)

    $r = $null
    try { $r = $rawText | ConvertFrom-Json } catch { Write-Warning 'claude の出力を JSON として読めませんでした。result.json を確認してください。' }

    $wallSec = [math]::Round($sw.Elapsed.TotalSeconds, 1)
    $wallText = '{0} 分 {1} 秒' -f [math]::Floor($sw.Elapsed.TotalMinutes), $sw.Elapsed.Seconds
    $durSec = ''; $apiSec = ''; $turns = ''; $cost = ''; $finalText = '（取得できませんでした）'
    if ($r) {
        if ($null -ne $r.duration_ms) { $durSec = [math]::Round($r.duration_ms / 1000, 1) }
        if ($null -ne $r.duration_api_ms) { $apiSec = [math]::Round($r.duration_api_ms / 1000, 1) }
        if ($null -ne $r.num_turns) { $turns = $r.num_turns }
        if ($null -ne $r.total_cost_usd) { $cost = '{0:N4}' -f [double]$r.total_cost_usd }
        if ($r.result) { $finalText = $r.result }
    }
    $built = Test-Path (Join-Path $runDir 'index.html')
    $builtText = if ($built) { '○' } else { '×' }

    $inTokens = 0
    $outTokens = 0
    $modelRows = @()
    if ($r -and $r.modelUsage) {
        foreach ($p in $r.modelUsage.PSObject.Properties) {
            $u = $p.Value
            if ($u.inputTokens) { $inTokens += [int]$u.inputTokens }
            if ($u.outputTokens) { $outTokens += [int]$u.outputTokens }
            $mc = if ($null -ne $u.costUSD) { '{0:N4}' -f [double]$u.costUSD } else { '' }
            $modelRows += "| $($p.Name) | $($u.inputTokens) | $($u.outputTokens) | $($u.cacheReadInputTokens) | $mc |"
        }
    }
    if ($modelRows.Count -eq 0) { $modelRows = @('| （取得できませんでした） | | | | |') }

    $report = @"
# 実験記録：$topic（$Mode）

| 項目 | 値 |
|---|---|
| 方式 | $Mode |
| お題 | ``$promptRel`` |
| 開始 | $($started.ToString('yyyy-MM-dd HH:mm:ss')) |
| 終了 | $($finished.ToString('yyyy-MM-dd HH:mm:ss')) |
| **実測時間（スクリプトのストップウォッチ）** | **$wallSec 秒（$wallText）** |
| Claude が報告した処理時間 duration_ms | $durSec 秒 |
| うち API 応答待ち duration_api_ms | $apiSec 秒 |
| ターン数 num_turns | $turns |
| 入力トークン合計 | $inTokens |
| 出力トークン合計 | $outTokens |
| API 換算コスト total_cost_usd（目安） | $cost USD |
| 完成品 index.html | $builtText |
| claude の終了コード | $exitCode |

## モデル別の使用量

| モデル | 入力トークン | 出力トークン | キャッシュ読込 | 換算コスト(USD) |
|---|---|---|---|---|
$($modelRows -join "`n")

## AI の最終報告

$finalText

## 評価メモ（ブラウザで index.html を開いて記入）

| 観点 | 点数（1〜5） | メモ |
|---|---|---|
| アレルゲン抽出の正確さ（コンタミ除外漏れがないか） | | |
| セット割引（-150円）・税計算（10%/8%）・原価率の正確さ | | |
| 見た目のデザイン・使いやすさ | | |
| フィルタ・切替スイッチがすべて正しく動くか | | |
| スマホ幅（〜480px）で崩れないか | | |
"@
    [IO.File]::WriteAllText((Join-Path $runDir 'report.md'), $report, $utf8)

    $summaryPath = Join-Path $root 'output\summary.md'
    if (-not (Test-Path $summaryPath)) {
        $head = "# MCP 実験結果の一覧`n`nscripts\run-experiment.ps1 が1回の実行ごとに1行追記します。`n`n| 実行名 | お題 | 方式 | 実測時間(秒) | ターン数 | 入力トークン | 出力トークン | 換算コスト(USD) | 完成 |`n|---|---|---|---|---|---|---|---|---|`n"
        [IO.File]::WriteAllText($summaryPath, $head, $utf8)
    }
    $row = "| [$runName]($runName/report.md) | $topic | $Mode | $wallSec | $turns | $inTokens | $outTokens | $cost | $builtText |`n"
    [IO.File]::AppendAllText($summaryPath, $row, $utf8)

    Write-Host ''
    Write-Host "完了：$wallSec 秒（$wallText） / ターン $turns / 換算 $cost USD / 完成品 $builtText" -ForegroundColor Green
    Write-Host "記録：$runDir\report.md"
    if ($built -and $Open) { Start-Process (Join-Path $runDir 'index.html') }
}
finally {
    Pop-Location
}
