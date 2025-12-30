# ROLLBACK DO CÓDIGO - Windows PowerShell
# Data: 2025-12-09_17-44-53
# 
# Este script restaura o código do backup ZIP

param(
    [string]$BackupZip = "backups\codigo\backup_codigo_2025-12-09_17-44-53.zip"
)

Write-Host "🔄 Iniciando rollback do código..." -ForegroundColor Yellow

if (-not (Test-Path $BackupZip)) {
    Write-Host "❌ Arquivo de backup não encontrado: $BackupZip" -ForegroundColor Red
    exit 1
}

# Verificar se 7-Zip está instalado
$7zipPath = "C:\Program Files\7-Zip\7z.exe"
if (-not (Test-Path $7zipPath)) {
    Write-Host "⚠️ 7-Zip não encontrado. Instalando Expand-Archive..." -ForegroundColor Yellow
    # Usar Expand-Archive nativo do PowerShell
    $tempDir = "rollback_temp_2025-12-09_17-44-53"
    Expand-Archive -Path $BackupZip -DestinationPath $tempDir -Force
    Write-Host "✅ Backup extraído para: $tempDir" -ForegroundColor Green
    Write-Host "⚠️ Restaure manualmente os arquivos de $tempDir para o projeto" -ForegroundColor Yellow
    exit 0
}

# Extrair backup
Write-Host "📦 Extraindo backup..." -ForegroundColor Cyan
& $7zipPath x $BackupZip -o"rollback_temp_2025-12-09_17-44-53" -y

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Backup extraído com sucesso!" -ForegroundColor Green
    Write-Host "⚠️ Restaure manualmente os arquivos de rollback_temp_2025-12-09_17-44-53 para o projeto" -ForegroundColor Yellow
} else {
    Write-Host "❌ Erro ao extrair backup" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Rollback do código concluído!" -ForegroundColor Green
