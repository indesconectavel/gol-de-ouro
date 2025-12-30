# ROLLBACK PROJECT - PowerShell
# Restaura código do projeto do backup V19

$BACKUP_DIR = Split-Path -Parent $PSScriptRoot
$PROJECT_BACKUP_DIR = Join-Path $BACKUP_DIR "project"
$PROJECT_ROOT = Split-Path -Parent $BACKUP_DIR

Write-Host "============================================================" -ForegroundColor Green
Write-Host " ROLLBACK PROJECT V19" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""

if (-not (Test-Path $PROJECT_BACKUP_DIR)) {
    Write-Host "❌ ERRO: Diretório de backup não encontrado" -ForegroundColor Red
    exit 1
}

Write-Host "⚠️  ATENÇÃO: Este script irá restaurar arquivos do backup V19" -ForegroundColor Yellow
$confirm = Read-Host "Deseja continuar? (S/N)"

if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "❌ Rollback cancelado" -ForegroundColor Red
    exit 1
}

# Criar backup pré-rollback
$PRE_ROLLBACK_DIR = Join-Path $PROJECT_ROOT "BACKUP-PRE-ROLLBACK"
Write-Host ""
Write-Host "📦 Criando backup pré-rollback..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $PRE_ROLLBACK_DIR | Out-Null

# Restaurar diretórios
$DIRECTORIES = @("controllers", "services", "routes", "middlewares", "utils", "database", "scripts", "config", "prisma", "src")

Write-Host ""
Write-Host "📁 Restaurando diretórios..." -ForegroundColor Cyan
foreach ($dir in $DIRECTORIES) {
    $source = Join-Path $PROJECT_BACKUP_DIR $dir
    $dest = Join-Path $PROJECT_ROOT $dir
    if (Test-Path $source) {
        Write-Host "  Restaurando $dir/..." -ForegroundColor White
        Remove-Item -Recurse -Force $dest -ErrorAction SilentlyContinue
        Copy-Item -Recurse -Force $source $dest
    }
}

# Restaurar arquivos
$FILES = @("server-fly.js", "package.json", "package-lock.json", "fly.toml", "fly.production.toml", "Dockerfile", "docker-compose.yml", "Procfile", "jest.config.js", "cursor.json", ".env.example")

Write-Host ""
Write-Host "📄 Restaurando arquivos..." -ForegroundColor Cyan
foreach ($file in $FILES) {
    $source = Join-Path $PROJECT_BACKUP_DIR $file
    $dest = Join-Path $PROJECT_ROOT $file
    if (Test-Path $source) {
        Write-Host "  Restaurando $file..." -ForegroundColor White
        Copy-Item -Force $source $dest
    }
}

Write-Host ""
Write-Host "✅ Rollback do projeto concluído" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "   1. Instalar dependências: npm install"
Write-Host "   2. Verificar variáveis de ambiente: .env"
Write-Host "   3. Reiniciar servidor: npm start"
