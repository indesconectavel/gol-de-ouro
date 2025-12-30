# ROLLBACK DATABASE - PowerShell
# Restaura banco de dados do backup V19

$BACKUP_DIR = Split-Path -Parent $PSScriptRoot
$DATABASE_BACKUP_DIR = Join-Path $BACKUP_DIR "database"

Write-Host "============================================================" -ForegroundColor Green
Write-Host " ROLLBACK DATABASE V19" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

if (-not (Test-Path "$DATABASE_BACKUP_DIRschema-consolidado.sql")) {
    Write-Host "❌ ERRO: Arquivo schema-consolidado.sql não encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "📋 INSTRUÇÕES PARA RESTAURAR:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Conecte ao Supabase Dashboard"
Write-Host "2. Vá para SQL Editor"
Write-Host "3. Execute o arquivo: $DATABASE_BACKUP_DIRschema-consolidado.sql"
Write-Host ""
Write-Host "✅ Instruções exibidas" -ForegroundColor Green
