# ==============================================================================
# Aparna RMC - Windows Scheduled Task Setup for Database Synchronization
# Schedules synchronization to run every 5 minutes automatically.
# ==============================================================================

$taskName = "AparnaRMC_DatabaseSync"
$projectRoot = Split-Path -Parent $PSScriptRoot
$batchPath = Join-Path $projectRoot "scripts\run-sync-task.bat"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Registering Aparna RMC 5-Minute Database Synchronization Task" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target script: $batchPath" -ForegroundColor Yellow

if (-not (Test-Path $batchPath)) {
    Write-Error "Cannot locate run-sync-task.bat at $batchPath"
    exit 1
}

# Define Action
$action = New-ScheduledTaskAction -Execute $batchPath -WorkingDirectory $projectRoot

# Define Trigger: Every 5 minutes indefinitely, starting immediately
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)

# Define Settings: Disallow parallel runs, wake/start on battery/AC, stop if running too long
$settings = New-ScheduledTaskSettingsSet `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -MultipleInstances IgnoreNew `
    -StartWhenAvailable `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 4)

# Unregister old task if exists
try {
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Previous task uninstalled." -ForegroundColor Gray
} catch {}

# Register the new scheduled task for the current user
try {
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Description "Aparna RMC automated 5-minute database synchronization between plant PC and Coolify server." | Out-Null

    Write-Host "✅ Scheduled Task '$taskName' registered successfully!" -ForegroundColor Green
    Write-Host "   - Frequency: Every 5 minutes" -ForegroundColor White
    Write-Host "   - Target: $batchPath" -ForegroundColor White
    Write-Host "   - Status: Active & Ready" -ForegroundColor White
} catch {
    Write-Host "⚠️ Warning: Could not register scheduled task with current permissions: $_" -ForegroundColor Yellow
    Write-Host "   Run PowerShell as Administrator if you want to install system-wide." -ForegroundColor Gray
}

