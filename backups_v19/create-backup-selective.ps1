# Script de Backup V19 - Seletivo (evita caminhos muito longos)
$ErrorActionPreference = "Continue"

Write-Host "=== ETAPA 0.2: Backup do código-fonte (seletivo) ===" -ForegroundColor Cyan

# Lista de diretórios e arquivos essenciais para backup
$essentialItems = @(
    'src',
    'database',
    'patches',
    'config',
    'docs',
    'scripts',
    'package.json',
    'package-lock.json',
    'server-fly.js',
    'env.example',
    'README.md',
    'CHANGELOG.md'
)

$itemsToBackup = @()
foreach ($item in $essentialItems) {
    if (Test-Path $item) {
        $itemsToBackup += $item
        Write-Host "Adicionado: $item" -ForegroundColor Gray
    }
}

if ($itemsToBackup.Count -gt 0) {
    try {
        Compress-Archive -Path $itemsToBackup -DestinationPath "backups_v19\staging\codigo_snapshot_v19.zip" -Force -ErrorAction Stop
        Write-Host "Backup criado com $($itemsToBackup.Count) itens" -ForegroundColor Green
        
        # Gerar MD5
        $zipFile = "backups_v19\staging\codigo_snapshot_v19.zip"
        if (Test-Path $zipFile) {
            $hash = Get-FileHash -Path $zipFile -Algorithm MD5
            $hash.Hash | Out-File -FilePath "backups_v19\staging\codigo_snapshot_v19.md5" -Encoding UTF8
            $size = (Get-Item $zipFile).Length
            Write-Host "MD5: $($hash.Hash)" -ForegroundColor Green
            Write-Host "Tamanho: $size bytes ($([math]::Round($size/1MB, 2)) MB)" -ForegroundColor Green
        }
    } catch {
        Write-Host "Erro ao criar backup: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Nenhum item encontrado" -ForegroundColor Yellow
}

Write-Host "`n=== ETAPA 0.3: Backup da Engine V19 ===" -ForegroundColor Cyan

$engineItems = @()
$enginePaths = @(
    'src\controllers',
    'src\services', 
    'src\routes',
    'src\db',
    'database\migration_v19',
    'patches\v19',
    'env.example',
    'server-fly.js',
    'config\required-env.js'
)

foreach ($path in $enginePaths) {
    if (Test-Path $path) {
        $engineItems += $path
        Write-Host "Adicionado: $path" -ForegroundColor Gray
    }
}

if ($engineItems.Count -gt 0) {
    try {
        Compress-Archive -Path $engineItems -DestinationPath "backups_v19\staging\engine_v19_snapshot.zip" -Force -ErrorAction Stop
        Write-Host "Backup da Engine criado com $($engineItems.Count) itens" -ForegroundColor Green
        
        # Gerar MD5
        $zipFile = "backups_v19\staging\engine_v19_snapshot.zip"
        if (Test-Path $zipFile) {
            $hash = Get-FileHash -Path $zipFile -Algorithm MD5
            $hash.Hash | Out-File -FilePath "backups_v19\staging\engine_v19_hash.md5" -Encoding UTF8
            $size = (Get-Item $zipFile).Length
            Write-Host "MD5: $($hash.Hash)" -ForegroundColor Green
            Write-Host "Tamanho: $size bytes ($([math]::Round($size/1MB, 2)) MB)" -ForegroundColor Green
        }
    } catch {
        Write-Host "Erro ao criar backup da Engine: $_" -ForegroundColor Red
    }
} else {
    Write-Host "Nenhum item da Engine encontrado" -ForegroundColor Yellow
}

Write-Host "`n=== Backup concluído ===" -ForegroundColor Green

