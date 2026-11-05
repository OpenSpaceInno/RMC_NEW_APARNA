# Create Desktop Shortcut for Aparna RMC
$targetDirs = @(
    [Environment]::GetFolderPath('Desktop'),
    'C:\Users\surad\OneDrive\Desktop',
    'C:\Users\surad\Desktop'
) | Select-Object -Unique | Where-Object { Test-Path $_ }

$wshShell = New-Object -ComObject WScript.Shell
$projectDir = Split-Path -Parent $PSScriptRoot
$exePath = Join-Path $projectDir 'Aparna-RMC.exe'

if (-not (Test-Path $exePath)) {
    Write-Error "Aparna-RMC.exe not found at $exePath"
    exit 1
}

foreach ($desktopPath in $targetDirs) {
    $shortcutPath = Join-Path $desktopPath 'Aparna RMC.lnk'
    $shortcut = $wshShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $exePath
    $shortcut.WorkingDirectory = $projectDir
    $shortcut.IconLocation = "$exePath,0"
    $shortcut.Description = 'Aparna RMC - Plant Gate & Weighbridge Management System'
    $shortcut.Save()
    Write-Host "Created Desktop Shortcut: $shortcutPath"
}
