<#
.SYNOPSIS
  同じお題を次のどれかの方式で AI に作らせ、かかった時間・ターン数・トークン・コストを記録する。
    solo         … A：AI 1人（サブエージェント禁止）
    agents       … B：page-director（親）＋職人3体。統合も親が書く
    agents-merge … C：page-director-merge（親）＋職人3体。統合は scripts/merge-parts.js
    plain        … お題の文面をそのまま渡す（ツール作成など、ページ以外の作業の計測用）

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\run-experiment.ps1 -Prompt prompts\01-profile.md -Mode solo -Model opus
  powershell -ExecutionPolicy Bypass -File scripts\run-experiment.ps1 -Prompt prompts\01-profile.md -Mode agents
  powershell -ExecutionPolicy Bypass -File scripts\run-experiment.ps1 -Prompt prompts\01-profile.md -Mode agents-merge
  powershell -ExecutionPolicy Bypass -File scripts\run-experiment.ps1 -Prompt prompts\tools\make-merge-script.md -Mode plain -Model opus

.NOTES
  - agent-guide フォルダで実行する想定（スクリプトが自動で agent-guide 直下に移動する）。
  - 結果は output\<日時>_<お題>_<方式>\ に保存され、output\summary.md に1行追記される。
#>
param(
    [Parameter(Mandatory = $true)][string]$Prompt,
    [Parameter(Mandatory = $true)][ValidateSet('solo', 'agents', 'agents-merge', 'plain')][string]$Mode,
    # solo / plain のときだけ使う。page-director と条件をそろえたいときは opus を指定する
    [string]$Model = '',
    # 完成後にブラウザで開く
    [switch]$Open
)

$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding $false
[Console]::OutputEncoding = $utf8
$OutputEncoding = $utf8

$root = Split-Path -Parent $PSScriptRoot
Push-Location $root
try {
    # Claude Code の中からこのスクリプトを起動した場合に、親セッション固有の設定を子へ引き継がない
    # （このスクリプトのプロセス内だけの変更。普段のターミナルから実行した場合は何も起きない）
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
    $isAgents = $Mode -like 'agents*'
    $isPage = $Mode -ne 'plain'
    if ($isAgents -and (Test-Path 'work')) {
        throw 'work\ フォルダが残っています。前回の途中結果を確認して、移動または削除してから実行してください。'
    }

    $promptPath = (Resolve-Path $Prompt).Path
    $topic = [IO.Path]::GetFileNameWithoutExtension($promptPath)
    $promptRel = $promptPath.Substring($root.Length).TrimStart('\').Replace('\', '/')
    $runName = '{0}_{1}_{2}' -f (Get-Date -Format 'yyyyMMdd-HHmmss'), $topic, $Mode
    $runRel = "output/$runName"
    $runDir = Join-Path $root "output\$runName"
    New-Item -ItemType Directory -Path $runDir | Out-Null

    $request = [IO.File]::ReadAllText($promptPath, $utf8)
    # ファイルの作成・編集は自動許可。シェルは統合スクリプトの実行だけ許可（それ以外のコマンドは拒否される）
    $cliArgs = @('-p', '--output-format', 'json', '--permission-mode', 'acceptEdits',
        '--allowedTools', 'Bash(node scripts/merge-parts.js:*)')

    if ($Mode -eq 'plain') {
        # お題の文面をそのまま渡す（ツール作成などの計測用）
        if ($Model) { $cliArgs += @('--model', $Model) }
        $cliArgs += @('--disallowedTools', 'Agent')
    }
    elseif ($Mode -eq 'solo') {
        # 何も仕組みを使わず、メインの AI 1人に全部任せる
        $request += "`n`n---`n完成品は $runRel/index.html に、HTML・CSS・JavaScript をすべて含む1ファイルとして保存してください。サブエージェントは使わず、あなた1人で作ってください。"
        if ($Model) { $cliArgs += @('--model', $Model) }
        $cliArgs += @('--disallowedTools', 'Agent')   # サブエージェントを呼べないようにする
    }
    elseif ($Mode -eq 'agents') {
        # page-director（親）が設計 → 3体の職人に並列発注 → 統合（親が書く）
        $cliArgs += @('--agent', 'page-director')
    }
    else {
        # page-director-merge（親）が設計 → 3体の職人に並列発注 → 統合はスクリプト
        if (-not (Test-Path 'scripts\merge-parts.js')) {
            throw 'scripts\merge-parts.js がありません。先に prompts\tools\make-merge-script.md を plain モードで実行して作ってください。'
        }
        $cliArgs += @('--agent', 'page-director-merge')
    }

    Write-Host "[$runName] 開始します（$Mode）。終わるまで数分〜十数分かかります…" -ForegroundColor Cyan
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

    # agents のときは work\ の中身を結果フォルダへ移す
    if ($isAgents -and (Test-Path 'work')) {
        if (Test-Path 'work\output\index.html') { Move-Item 'work\output\index.html' $runDir }
        Move-Item 'work' (Join-Path $runDir 'work')
    }

    # ---- 集計 ----
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
    $builtText = if (-not $isPage) { '—' } elseif ($built) { '○' } else { '×' }

    # 出力トークンの合計（全モデル）
    $outTokens = 0
    if ($r -and $r.modelUsage) {
        foreach ($p in $r.modelUsage.PSObject.Properties) { if ($p.Value.outputTokens) { $outTokens += [int]$p.Value.outputTokens } }
    }

    $modelRows = @()
    if ($r -and $r.modelUsage) {
        foreach ($p in $r.modelUsage.PSObject.Properties) {
            $u = $p.Value
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
| ターン数 num_turns（親のみ） | $turns |
| 出力トークン（全モデル合計） | $outTokens |
| API 換算コスト total_cost_usd（目安。サブスク利用時は請求されない） | $cost USD |
| 完成品 index.html | $builtText |
| claude の終了コード | $exitCode |

## モデル別の使用量

| モデル | 入力トークン | 出力トークン | キャッシュ読込 | 換算コスト(USD) |
|---|---|---|---|---|
$($modelRows -join "`n")

## AI の最終報告

$finalText

## 評価メモ（ブラウザで index.html を開いて、手で記入）

| 観点 | 点数（1〜5） | メモ |
|---|---|---|
| 見た目のオシャレさ | | |
| 指定した動きがすべて動くか | | |
| スマホ幅（〜480px）で崩れないか | | |
| コンソールエラーがないか（F12） | | |
| 指示の守り具合（セクション・内容） | | |
| コードの読みやすさ | | |
"@
    [IO.File]::WriteAllText((Join-Path $runDir 'report.md'), $report, $utf8)

    $summaryPath = Join-Path $root 'output\summary.md'
    if (-not (Test-Path $summaryPath)) {
        $head = "# 実験結果の一覧`n`nscripts\run-experiment.ps1 が1回の実行ごとに1行追記します。`n`n| 実行名 | お題 | 方式 | 実測時間(秒) | ターン数 | 出力トークン | 換算コスト(USD) | 完成 |`n|---|---|---|---|---|---|---|---|`n"
        [IO.File]::WriteAllText($summaryPath, $head, $utf8)
    }
    $row = "| [$runName]($runName/report.md) | $topic | $Mode | $wallSec | $turns | $outTokens | $cost | $builtText |`n"
    [IO.File]::AppendAllText($summaryPath, $row, $utf8)

    Write-Host ''
    Write-Host "完了：$wallSec 秒（$wallText） / ターン $turns / 換算 $cost USD / 完成品 $builtText" -ForegroundColor Green
    Write-Host "記録：$runDir\report.md"
    if ($built -and $Open) { Start-Process (Join-Path $runDir 'index.html') }
}
finally {
    Pop-Location
}
