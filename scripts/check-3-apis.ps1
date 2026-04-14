param(
  [string]$BaseUrl = "http://localhost:3001"
)

$checks = @(
  @{
    Name = "高校内容";
    Url = "$BaseUrl/school/content?page=1&pageSize=10";
  },
  @{
    Name = "用户发布";
    Url = "$BaseUrl/user/publish?page=1&pageSize=10";
  },
  @{
    Name = "商品规格";
    Url = "$BaseUrl/product/spec?page=1&pageSize=10";
  }
)

foreach ($item in $checks) {
  try {
    $resp = Invoke-RestMethod -Uri $item.Url -Method Get -TimeoutSec 10
    $total = if ($resp.data -and $resp.data.total -ne $null) { $resp.data.total } else { "-" }
    Write-Host ("[OK] {0} code={1} total={2}" -f $item.Name, $resp.code, $total)
  } catch {
    Write-Host ("[FAIL] {0} {1}" -f $item.Name, $_.Exception.Message)
  }
}
