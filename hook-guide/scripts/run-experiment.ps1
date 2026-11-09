<#
.SYNOPSIS
  同じお題を次の3通りのフック方式で AI に作らせ、かかった時間・ターン数・トークン・コスト・規約遵守スコアを比較記録する。
    no-hooks   … A：フックなし（プロンプトの「お願い」だけで作らせる）
    with-hooks … B：PreToolUse（関所）＋ PostToolUse（自動整形・事後チェック）を有効化
    stop-gate  … C：B に加えて Stop（完了ゲート：全7基準を満たすまで完了を差し戻す）を有効化

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File scripts\run-experiment.ps1 -Prompt prompts\01-profile-strict.md -Mode no-hooks -Model sonnet
  powershell -ExecutionPolicy Bypass -File scripts\run-experiment.ps1 -Prompt prompts\01-profile-strict.md -Mode with-hooks -Model sonnet
  powershell -ExecutionPolicy Bypass -File scripts\run-experiment.ps1 -Prompt prompts\01-profile-strict.md -Mode stop-gate -Model sonnet

.NOTES
  - hook-guide フォルダで実行する想定（スクリプトが自動で hook-guide 直下に移動する）。
  - 結果は output\<日時>_<お題>_<方式>\ に保存され、output\summary.md に1行追記される。
#>
param(
    [Parameter(Mandatory = $true)][string]$Prompt,
    [Parameter(Mandatory = $true)][ValidateSet('no-hooks', 'with-hooks', 'stop-gate')][string]$Mode,
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
        throw 'claude コマンドが見つかりません。Claude Code CLI をインストールしてください。（Claude なしでフック単体を試す場合は node scripts/test-hooks-locally.js を実行してください）'
    }

    $promptPath = (Resolve-Path $Prompt).Path
    $topic = [IO.Path]::GetFileNameWithoutExtension($promptPath)
    $promptRel = $promptPath.Substring($root.Length).TrimStart('\').Replace('\', '/')
    $runName = '{0}_{1}_{2}' -f (Get-Date -Format 'yyyyMMdd-HHmmss'), $topic, $Mode
    $runRel = "output/$runName"
    $runDir = Join-Path $root "output\$runName"
    New-Item -ItemType Directory -Path $runDir | Out-Null

    $targetHtmlPath = Join-Path $runDir 'index.html'
    $hookLogPath = Join-Path $runDir 'hook-events.jsonl'

    # フックスクリプトが参照する環境変数をセット
    $env:HOOK_EXPERIMENT_MODE = $Mode
    $env:TARGET_HTML_PATH = $targetHtmlPath
    $env:HOOK_LOG_FILE = $hookLogPath

    $request = [IO.File]::ReadAllText($promptPath, $utf8)
    $request += "`n`n---`n完成品は $runRel/index.html に、HTML・CSS・JavaScript をすべて含む1ファイルとして保存してください。サブエージェントは使わず、あなた1人で作ってください。"

    $cliArgs = @('-p', '--output-format', 'json', '--permission-mode', 'acceptEdits', '--disallowedTools', 'Agent')
    if ($Model) { $cliArgs += @('--model', $Model) }

    Write-Host "[$runName] 開始します（方式: $Mode）。終わるまで数分かかります…" -ForegroundColor Cyan
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
    $built = Test-Path $targetHtmlPath

    # 完成した index.html が7つの厳格規約をいくつ守れているか自動採点
    $ruleScore = '—'
    $ruleDetails = '（index.html が生成されませんでした）'
    if ($built) {
        $checkJson = node -e "const fs=require('fs'); const {inspectHtml}=require('./hooks/stop-verify.js'); const m=inspectHtml(fs.readFileSync(process.argv[1],'utf8')); console.log(JSON.stringify(m));" $targetHtmlPath
        $missingList = $checkJson | ConvertFrom-Json
        $passCount = 7 - $missingList.Count
        $ruleScore = "$passCount / 7"
        if ($missingList.Count -eq 0) {
            $ruleDetails = '全 7 項目の技術・アクセシビリティ規約に 100% 合格しました。'
        } else {
            $ruleDetails = "以下の違反が残っています:`n- " + ($missingList -join "`n- ")
        }
    }

    # フック動作ログの集計
    $hookCount = 0
    $blockCount = 0
    if (Test-Path $hookLogPath) {
        $lines = [IO.File]::ReadAllLines($hookLogPath, $utf8)
        $hookCount = $lines.Count
        foreach ($line in $lines) {
            if ($line -match '"action":"(BLOCK|FEEDBACK|BLOCK_STOP)"') { $blockCount++ }
        }
    }

    $outTokens = 0
    if ($r -and $r.modelUsage) {
        foreach ($p in $r.modelUsage.PSObject.Properties) { if ($p.Value.outputTokens) { $outTokens += [int]$p.Value.outputTokens } }
    }

    $report = @"
# 実験記録：$topic（$Mode）

| 項目 | 値 |
|---|---|
| 方式 | $Mode |
| お題 | ``$promptRel`` |
| 開始 | $($started.ToString('yyyy-MM-dd HH:mm:ss')) |
| 終了 | $($finished.ToString('yyyy-MM-dd HH:mm:ss')) |
| **実測時間（ストップウォッチ）** | **$wallSec 秒（$wallText）** |
| ターン数 num_turns | $turns |
| 出力トークン合計 | $outTokens |
| API 換算コスト total_cost_usd | $cost USD |
| **規約遵守スコア（7項目自動採点）** | **$ruleScore** |
| フック発火回数 / うちブロック・差し戻し回数 | $hookCount 回 / $blockCount 回 |

## 自動採点の内訳

$ruleDetails

## AI の最終報告

$finalText
"@
    [IO.File]::WriteAllText((Join-Path $runDir 'report.md'), $report, $utf8)

    $summaryPath = Join-Path $root 'output\summary.md'
    if (-not (Test-Path $summaryPath)) {
        $head = "# 実験結果の一覧`n`nscripts\run-experiment.ps1 が1回の実行ごとに1行追記します。`n`n| 実行名 | お題 | 方式 | 実測時間(秒) | ターン数 | 規約遵守(7点満点) | フック介入回数 | 換算コスト(USD) |`n|---|---|---|---|---|---|---|---|`n"
        [IO.File]::WriteAllText($summaryPath, $head, $utf8)
    }
    $row = "| [$runName]($runName/report.md) | $topic | $Mode | $wallSec | $turns | $ruleScore | $blockCount | $cost |`n"
    [IO.File]::AppendAllText($summaryPath, $row, $utf8)

    Write-Host ''
    Write-Host "完了：$wallSec 秒（$wallText） / ターン $turns / 規約遵守 $ruleScore / フック介入 $blockCount 回 / 換算 $cost USD" -ForegroundColor Green
    Write-Host "記録：$runDir\report.md"
    if ($built -and $Open) { Start-Process $targetHtmlPath }
}
finally {
    Remove-Item Env:HOOK_EXPERIMENT_MODE -ErrorAction SilentlyContinue
    Remove-Item Env:TARGET_HTML_PATH -ErrorAction SilentlyContinue
    Remove-Item Env:HOOK_LOG_FILE -ErrorAction SilentlyContinue
    Pop-Location
}
