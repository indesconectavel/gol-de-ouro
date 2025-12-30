# MONITORAR WORKFLOWS - GOL DE OURO
# Data: 15/11/2025
# Status: Script para monitorar workflows regularmente

Write-Host "Monitorando Workflows..." -ForegroundColor Cyan

# Verificar ultimos 10 runs
Write-Host "`n=== ULTIMOS 10 WORKFLOW RUNS ===" -ForegroundColor Yellow
gh run list --limit 10 --json conclusion,status,name,createdAt,workflowName | ConvertFrom-Json | ForEach-Object {
    Write-Host "$($_.workflowName) - $($_.name) - $($_.conclusion) - $($_.status) - $($_.createdAt)"
}

# Contar falhas
$runsJson = gh run list --limit 50 --json conclusion
$runs = $runsJson | ConvertFrom-Json
$failures = ($runs | Where-Object { $_.conclusion -eq "failure" }).Count
$color = if ($failures -gt 0) { "Red" } else { "Green" }
Write-Host "`nFalhas nos ultimos 50 runs: $failures" -ForegroundColor $color

# Verificar workflows ativos
Write-Host "`n=== WORKFLOWS ATIVOS ===" -ForegroundColor Yellow
gh workflow list --json name,state | ConvertFrom-Json | ForEach-Object {
    Write-Host "$($_.name) - $($_.state)"
}

# Verificar PRs com workflows pendentes
Write-Host "`n=== PRs COM WORKFLOWS PENDENTES ===" -ForegroundColor Yellow
gh pr list --state open --json number,title,headRefName | ConvertFrom-Json | ForEach-Object {
    Write-Host "PR #$($_.number): $($_.title) ($($_.headRefName))"
}

Write-Host "`nMonitoramento concluido!" -ForegroundColor Green
