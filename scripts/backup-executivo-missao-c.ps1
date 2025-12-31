# BACKUP EXECUTIVO - MISSÃO C
# Script para backup completo do projeto Gol de Ouro

$ErrorActionPreference = "Continue"
$date = Get-Date -Format "yyyy-MM-dd"
$backupDir = "E:\Backups\Gol-De-Ouro\BACKUP-EXECUTIVO-MISSAO-C\$date"
$projectRoot = "E:\Chute de Ouro\goldeouro-backend"

# Criar diretórios
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BACKUP EXECUTIVO - MISSÃO C" -ForegroundColor Cyan
Write-Host "Data: $date" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
New-Item -ItemType Directory -Path "$backupDir\checksums" -Force | Out-Null
New-Item -ItemType Directory -Path "$backupDir\database" -Force | Out-Null

Write-Host "`nDiretório criado: $backupDir" -ForegroundColor Green

# Função para compactar com exclusões
function Backup-Component {
    param(
        [string]$ComponentName,
        [string]$SourcePath,
        [string]$DestinationZip,
        [array]$ExcludeDirs = @(),
        [array]$ExcludeFiles = @()
    )
    
    Write-Host "`nCompactando $ComponentName..." -ForegroundColor Yellow
    
    # Criar diretório temporário
    $tempDir = "$env:TEMP\backup-$ComponentName-$(Get-Date -Format 'yyyyMMddHHmmss')"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    try {
        # Copiar arquivos excluindo diretórios e arquivos especificados
        $excludePatterns = $ExcludeDirs + $ExcludeFiles
        Get-ChildItem -Path $SourcePath -Recurse -ErrorAction SilentlyContinue | 
            Where-Object {
                $excluded = $false
                foreach ($pattern in $excludePatterns) {
                    if ($_.FullName -like "*\$pattern\*" -or $_.FullName -like "*\$pattern") {
                        $excluded = $true
                        break
                    }
                }
                -not $excluded
            } | 
            ForEach-Object {
                $relativePath = $_.FullName.Substring($SourcePath.Length + 1)
                $destPath = Join-Path $tempDir $relativePath
                $destDir = Split-Path $destPath -Parent
                if (-not (Test-Path $destDir)) {
                    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                }
                Copy-Item $_.FullName $destPath -ErrorAction SilentlyContinue
            }
        
        # Compactar
        Compress-Archive -Path "$tempDir\*" -DestinationPath $DestinationZip -CompressionLevel Optimal -Force
        
        # Gerar hash
        $hash = Get-FileHash -Path $DestinationZip -Algorithm SHA256
        $hashFile = "$backupDir\checksums\$ComponentName.sha256"
        "$($hash.Hash)  $ComponentName.zip" | Out-File -FilePath $hashFile -Encoding UTF8
        
        Write-Host "✅ $ComponentName compactado: $DestinationZip" -ForegroundColor Green
        Write-Host "   Hash SHA256: $($hash.Hash)" -ForegroundColor Gray
        Write-Host "   Tamanho: $([math]::Round((Get-Item $DestinationZip).Length / 1MB, 2)) MB" -ForegroundColor Gray
        
        return @{
            Success = $true
            Size = (Get-Item $DestinationZip).Length
            Hash = $hash.Hash
        }
    }
    catch {
        Write-Host "❌ Erro ao compactar $ComponentName : $_" -ForegroundColor Red
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
    finally {
        # Limpar diretório temporário
        if (Test-Path $tempDir) {
            Remove-Item -Path $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# ETAPA 1: Backup Local
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ETAPA 1: BACKUP LOCAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$results = @{}

# Backup Backend (código principal)
$results.backend = Backup-Component `
    -ComponentName "codigo-backend" `
    -SourcePath $projectRoot `
    -DestinationZip "$backupDir\codigo-backend.zip" `
    -ExcludeDirs @("node_modules", "BACKUP-V15", "BACKUP-V15-LIGHT", "BACKUP-V16", "BACKUP-V19-*", "backups", "backups_v19", "goldeouro-player", "goldeouro-admin", "goldeouro-mobile", "tests", "*.log", "logs", "BACKUP-COMPLETO-*", "backup-pre-limpeza-*") `
    -ExcludeFiles @("*.zip", "*.log", "*.tmp")

# Backup Player
if (Test-Path "$projectRoot\goldeouro-player") {
    $results.player = Backup-Component `
        -ComponentName "codigo-player" `
        -SourcePath "$projectRoot\goldeouro-player" `
        -DestinationZip "$backupDir\codigo-player.zip" `
        -ExcludeDirs @("node_modules", "dist", "build", ".next", "cypress\screenshots", "cypress\videos") `
        -ExcludeFiles @("*.zip", "*.log")
}

# Backup Admin
if (Test-Path "$projectRoot\goldeouro-admin") {
    $results.admin = Backup-Component `
        -ComponentName "codigo-admin" `
        -SourcePath "$projectRoot\goldeouro-admin" `
        -DestinationZip "$backupDir\codigo-admin.zip" `
        -ExcludeDirs @("node_modules", "dist", "build", ".next") `
        -ExcludeFiles @("*.zip", "*.log")
}

# Backup Mobile
if (Test-Path "$projectRoot\goldeouro-mobile") {
    $results.mobile = Backup-Component `
        -ComponentName "codigo-mobile" `
        -SourcePath "$projectRoot\goldeouro-mobile" `
        -DestinationZip "$backupDir\codigo-mobile.zip" `
        -ExcludeDirs @("node_modules", "android\build", "android\.gradle", "ios\build", "ios\Pods") `
        -ExcludeFiles @("*.zip", "*.log", "*.apk", "*.aab")
}

# Backup Testes MISSÃO C
if (Test-Path "$projectRoot\tests") {
    $results.tests = Backup-Component `
        -ComponentName "testes-missao-c" `
        -SourcePath "$projectRoot\tests" `
        -DestinationZip "$backupDir\testes-missao-c.zip" `
        -ExcludeDirs @("node_modules", "reports", "coverage") `
        -ExcludeFiles @("*.log")
}

# Backup Docs e Relatórios
$docsFiles = @()
$docsFiles += Get-ChildItem -Path $projectRoot -Filter "RELATORIO-*.md" -File -ErrorAction SilentlyContinue
$docsFiles += Get-ChildItem -Path $projectRoot -Filter "PLANO-*.md" -File -ErrorAction SilentlyContinue
$docsFiles += Get-ChildItem -Path "$projectRoot\docs" -Recurse -File -ErrorAction SilentlyContinue | Where-Object { $_.Extension -eq ".md" }

if ($docsFiles.Count -gt 0) {
    $tempDocsDir = "$env:TEMP\backup-docs-$(Get-Date -Format 'yyyyMMddHHmmss')"
    New-Item -ItemType Directory -Path $tempDocsDir -Force | Out-Null
    
    foreach ($file in $docsFiles) {
        $relativePath = $file.FullName.Substring($projectRoot.Length + 1)
        $destPath = Join-Path $tempDocsDir $relativePath
        $destDir = Split-Path $destPath -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Copy-Item $file.FullName $destPath -ErrorAction SilentlyContinue
    }
    
    Compress-Archive -Path "$tempDocsDir\*" -DestinationPath "$backupDir\docs-e-relatorios.zip" -CompressionLevel Optimal -Force
    $hash = Get-FileHash -Path "$backupDir\docs-e-relatorios.zip" -Algorithm SHA256
    "$($hash.Hash)  docs-e-relatorios.zip" | Out-File -FilePath "$backupDir\checksums\docs-e-relatorios.sha256" -Encoding UTF8
    
    Remove-Item -Path $tempDocsDir -Recurse -Force -ErrorAction SilentlyContinue
    
    Write-Host "✅ Docs e relatórios compactados" -ForegroundColor Green
    $results.docs = @{
        Success = $true
        Size = (Get-Item "$backupDir\docs-e-relatorios.zip").Length
        Hash = $hash.Hash
    }
}

# Consolidar todos os hashes
$allHashes = Get-ChildItem -Path "$backupDir\checksums" -Filter "*.sha256" | Get-Content
$allHashes | Out-File -FilePath "$backupDir\checksums\sha256.txt" -Encoding UTF8

Write-Host "`n✅ ETAPA 1 CONCLUÍDA" -ForegroundColor Green
Write-Host "Backup local salvo em: $backupDir" -ForegroundColor Cyan

# Retornar resultados
return $results

