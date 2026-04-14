param(
  [string]$ApiDir = "..\admin-api",
  [string]$WebDir = "..\admin-web"
)

$apiPath = Resolve-Path (Join-Path $PSScriptRoot $ApiDir)
$webPath = Resolve-Path (Join-Path $PSScriptRoot $WebDir)

Write-Host "[联调] 后端目录: $apiPath"
Write-Host "[联调] 前端目录: $webPath"

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$apiPath'; npm run dev"
)

Start-Process powershell -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$webPath'; npm run dev:realapi"
)

Write-Host "[联调] 已启动后端和前端窗口。"
