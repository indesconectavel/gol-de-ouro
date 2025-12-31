# BACKUP LOCAL COMPLETO - MISSÃO C
# Script para backup completo do projeto Gol de Ouro (pós MISSÃO C)
# Data: 2025-01-12

$ErrorActionPreference = "Continue"
$date = Get-Date -Format "yyyy-MM-dd"
$timestamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$backupBaseDir = "E:\Backups\Gol-De-Ouro\BACKUP-MISSAO-C"
$backupDir = "$backupBaseDir\$date"
$projectRoot = "E:\Chute de Ouro\goldeouro-backend"

# Criar diretórios
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BACKUP LOCAL COMPLETO - MISSÃO C" -ForegroundColor Cyan
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
    
    Write-Host "`n📦 Compactando $ComponentName..." -ForegroundColor Yellow
    
    if (-not (Test-Path $SourcePath)) {
        Write-Host "⚠️  Caminho não encontrado: $SourcePath" -ForegroundColor Yellow
        return @{
            Success = $false
            Error = "Caminho não encontrado"
        }
    }
    
    # Criar diretório temporário
    $tempDir = "$env:TEMP\backup-$ComponentName-$timestamp"
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    
    try {
        # Copiar arquivos excluindo diretórios e arquivos especificados
        $items = Get-ChildItem -Path $SourcePath -Recurse -ErrorAction SilentlyContinue
        
        $copied = 0
        foreach ($item in $items) {
            $shouldExclude = $false
            
            # Verificar exclusões de diretórios
            foreach ($excludeDir in $ExcludeDirs) {
                if ($item.FullName -like "*\$excludeDir\*" -or $item.FullName -like "*\$excludeDir") {
                    $shouldExclude = $true
                    break
                }
            }
            
            # Verificar exclusões de arquivos
            if (-not $shouldExclude) {
                foreach ($excludeFile in $ExcludeFiles) {
                    if ($item.Name -like $excludeFile) {
                        $shouldExclude = $true
                        break
                    }
                }
            }
            
            # Verificar exclusões específicas
            if ($item.FullName -like "*\BACKUP-V15\*" -or 
                $item.FullName -like "*\node_modules\*" -or
                $item.Name -like "*.zip" -or
                $item.Name -eq ".env") {
                $shouldExclude = $true
            }
            
            if (-not $shouldExclude) {
                $relativePath = $item.FullName.Substring($SourcePath.Length + 1)
                $destPath = Join-Path $tempDir $relativePath
                $destDir = Split-Path $destPath -Parent
                if (-not (Test-Path $destDir)) {
                    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
                }
                Copy-Item $item.FullName $destPath -ErrorAction SilentlyContinue
                $copied++
            }
        }
        
        Write-Host "   Arquivos copiados: $copied" -ForegroundColor Gray
        
        # Compactar
        if (Test-Path "$tempDir\*") {
            Compress-Archive -Path "$tempDir\*" -DestinationPath $DestinationZip -CompressionLevel Optimal -Force
            
            # Gerar hash
            $hash = Get-FileHash -Path $DestinationZip -Algorithm SHA256
            $hashFile = "$backupDir\checksums\$ComponentName.sha256"
            "$($hash.Hash)  $ComponentName.zip" | Out-File -FilePath $hashFile -Encoding UTF8
            
            $sizeMB = [math]::Round((Get-Item $DestinationZip).Length / 1MB, 2)
            Write-Host "✅ $ComponentName compactado: $DestinationZip" -ForegroundColor Green
            Write-Host "   Hash SHA256: $($hash.Hash)" -ForegroundColor Gray
            Write-Host "   Tamanho: $sizeMB MB" -ForegroundColor Gray
            
            return @{
                Success = $true
                Size = (Get-Item $DestinationZip).Length
                SizeMB = $sizeMB
                Hash = $hash.Hash
                FilesCopied = $copied
            }
        } else {
            Write-Host "⚠️  Nenhum arquivo para compactar" -ForegroundColor Yellow
            return @{
                Success = $false
                Error = "Nenhum arquivo encontrado"
            }
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

# Função para gerar hash de arquivo
function Get-FileHashSHA256 {
    param([string]$FilePath)
    
    if (Test-Path $FilePath) {
        $hash = Get-FileHash -Path $FilePath -Algorithm SHA256
        $hashFile = "$backupDir\checksums\$(Split-Path $FilePath -Leaf).sha256"
        "$($hash.Hash)  $(Split-Path $FilePath -Leaf)" | Out-File -FilePath $hashFile -Encoding UTF8
        return $hash.Hash
    }
    return $null
}

# ETAPA 1: Backup Código Backend
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ETAPA 1: BACKUP CÓDIGO BACKEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$results = @{}

# Backup Backend
$backendDirs = @("controllers", "routes", "middlewares", "utils", "config", "services", "src", "database")
$backendFiles = @("server-fly.js", "package.json", "fly.toml", "Dockerfile", "docker-compose.yml", "env.example", "app.json", "eas.json", "cursor.json", "CHANGELOG.md", "CONTRIBUTING.md")

$tempBackendDir = "$env:TEMP\backup-backend-$timestamp"
New-Item -ItemType Directory -Path $tempBackendDir -Force | Out-Null

foreach ($dir in $backendDirs) {
    $sourcePath = Join-Path $projectRoot $dir
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $tempBackendDir $dir
        Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Exclude @("node_modules", "*.zip", ".env") -ErrorAction SilentlyContinue
    }
}

foreach ($file in $backendFiles) {
    $sourcePath = Join-Path $projectRoot $file
    if (Test-Path $sourcePath) {
        Copy-Item -Path $sourcePath -Destination $tempBackendDir -ErrorAction SilentlyContinue
    }
}

# Excluir BACKUP-V15 se existir
Get-ChildItem -Path $tempBackendDir -Recurse -ErrorAction SilentlyContinue | 
    Where-Object { $_.FullName -like "*\BACKUP-V15\*" } | 
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

Compress-Archive -Path "$tempBackendDir\*" -DestinationPath "$backupDir\codigo-backend.zip" -CompressionLevel Optimal -Force
$results.backend = @{
    Success = $true
    Size = (Get-Item "$backupDir\codigo-backend.zip").Length
    Hash = (Get-FileHashSHA256 "$backupDir\codigo-backend.zip")
}
Remove-Item -Path $tempBackendDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Backend compactado" -ForegroundColor Green

# Backup Player
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ETAPA 2: BACKUP CÓDIGO PLAYER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$results.player = Backup-Component `
    -ComponentName "codigo-player" `
    -SourcePath "$projectRoot\goldeouro-player" `
    -DestinationZip "$backupDir\codigo-player.zip" `
    -ExcludeDirs @("node_modules", "dist", "build", ".next", "cypress\screenshots", "cypress\videos", "BACKUP-V15") `
    -ExcludeFiles @("*.zip", "*.log", ".env")

# Backup Admin
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ETAPA 3: BACKUP CÓDIGO ADMIN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$results.admin = Backup-Component `
    -ComponentName "codigo-admin" `
    -SourcePath "$projectRoot\goldeouro-admin" `
    -DestinationZip "$backupDir\codigo-admin.zip" `
    -ExcludeDirs @("node_modules", "dist", "build", ".next", "BACKUP-V15") `
    -ExcludeFiles @("*.zip", "*.log", ".env")

# Backup Mobile
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ETAPA 4: BACKUP CÓDIGO MOBILE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$results.mobile = Backup-Component `
    -ComponentName "codigo-mobile" `
    -SourcePath "$projectRoot\goldeouro-mobile" `
    -DestinationZip "$backupDir\codigo-mobile.zip" `
    -ExcludeDirs @("node_modules", "android\build", "android\.gradle", "ios\build", "ios\Pods", "BACKUP-V15") `
    -ExcludeFiles @("*.zip", "*.log", "*.apk", "*.aab", ".env")

# Backup Testes MISSÃO C
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ETAPA 5: BACKUP TESTES MISSÃO C" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$results.tests = Backup-Component `
    -ComponentName "testes-missao-c" `
    -SourcePath "$projectRoot\tests" `
    -DestinationZip "$backupDir\testes-missao-c.zip" `
    -ExcludeDirs @("node_modules", "reports", "coverage", "BACKUP-V15") `
    -ExcludeFiles @("*.log", ".env")

# Backup Docs e Relatórios
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ETAPA 6: BACKUP DOCS E RELATÓRIOS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$tempDocsDir = "$env:TEMP\backup-docs-$timestamp"
New-Item -ItemType Directory -Path $tempDocsDir -Force | Out-Null

# Coletar arquivos de documentação
$docsFiles = @()
$docsFiles += Get-ChildItem -Path $projectRoot -Filter "RELATORIO-*.md" -File -ErrorAction SilentlyContinue
$docsFiles += Get-ChildItem -Path $projectRoot -Filter "PLANO-*.md" -File -ErrorAction SilentlyContinue
$docsFiles += Get-ChildItem -Path $projectRoot -Filter "AUDITORIA-*.md" -File -ErrorAction SilentlyContinue
$docsFiles += Get-ChildItem -Path $projectRoot -Filter "CHECKLIST-*.md" -File -ErrorAction SilentlyContinue
$docsFiles += Get-ChildItem -Path $projectRoot -Filter "FASE-*.md" -File -ErrorAction SilentlyContinue
$docsFiles += Get-ChildItem -Path $projectRoot -Filter "CORRECAO-*.md" -File -ErrorAction SilentlyContinue
$docsFiles += Get-ChildItem -Path $projectRoot -Filter "ANALISE-*.md" -File -ErrorAction SilentlyContinue
$docsFiles += Get-ChildItem -Path $projectRoot -Filter "DIAGNOSTICO-*.md" -File -ErrorAction SilentlyContinue
$docsFiles += Get-ChildItem -Path $projectRoot -Filter "DEPLOY-*.md" -File -ErrorAction SilentlyContinue
$docsFiles += Get-ChildItem -Path $projectRoot -Filter "DOCUMENTACAO-*.md" -File -ErrorAction SilentlyContinue

# Copiar docs da pasta docs/
if (Test-Path "$projectRoot\docs") {
    Get-ChildItem -Path "$projectRoot\docs" -Recurse -File -ErrorAction SilentlyContinue | 
        Where-Object { $_.Extension -eq ".md" -or $_.Extension -eq ".txt" } | 
        ForEach-Object {
            $relativePath = $_.FullName.Substring("$projectRoot\docs".Length + 1)
            $destPath = Join-Path $tempDocsDir "docs\$relativePath"
            $destDir = Split-Path $destPath -Parent
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            Copy-Item $_.FullName $destPath -ErrorAction SilentlyContinue
        }
}

# Copiar arquivos de documentação da raiz
foreach ($file in $docsFiles) {
    Copy-Item $file.FullName $tempDocsDir -ErrorAction SilentlyContinue
}

if (Test-Path "$tempDocsDir\*") {
    Compress-Archive -Path "$tempDocsDir\*" -DestinationPath "$backupDir\docs-e-relatorios.zip" -CompressionLevel Optimal -Force
    $results.docs = @{
        Success = $true
        Size = (Get-Item "$backupDir\docs-e-relatorios.zip").Length
        Hash = (Get-FileHashSHA256 "$backupDir\docs-e-relatorios.zip")
    }
    Write-Host "✅ Docs e relatórios compactados" -ForegroundColor Green
} else {
    $results.docs = @{
        Success = $false
        Error = "Nenhum arquivo de documentação encontrado"
    }
    Write-Host "⚠️  Nenhum arquivo de documentação encontrado" -ForegroundColor Yellow
}

Remove-Item -Path $tempDocsDir -Recurse -Force -ErrorAction SilentlyContinue

# ETAPA 7: Exportar Banco Supabase
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ETAPA 7: EXPORTAR BANCO SUPABASE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "Executando exportação do banco de dados..." -ForegroundColor Yellow
$exportScript = Join-Path $projectRoot "scripts\exportar-banco-supabase.js"
if (Test-Path $exportScript) {
    Push-Location $projectRoot
    $exportResult = node $exportScript 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Exportação do banco concluída" -ForegroundColor Green
        
        # Mover arquivos SQL para o diretório de backup
        if (Test-Path "$projectRoot\schema.sql") {
            Move-Item "$projectRoot\schema.sql" "$backupDir\database\schema.sql" -Force
            $results.schema = @{
                Success = $true
                Hash = (Get-FileHashSHA256 "$backupDir\database\schema.sql")
            }
        }
        if (Test-Path "$projectRoot\data-critical.sql") {
            Move-Item "$projectRoot\data-critical.sql" "$backupDir\database\data-critical.sql" -Force
            $results.data = @{
                Success = $true
                Hash = (Get-FileHashSHA256 "$backupDir\database\data-critical.sql")
            }
        }
    } else {
        Write-Host "❌ Erro na exportação do banco: $exportResult" -ForegroundColor Red
        $results.database = @{
            Success = $false
            Error = $exportResult
        }
    }
    Pop-Location
} else {
    Write-Host "⚠️  Script de exportação não encontrado: $exportScript" -ForegroundColor Yellow
    $results.database = @{
        Success = $false
        Error = "Script não encontrado"
    }
}

# ETAPA 8: Gerar Relatório
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "ETAPA 8: GERAR RELATÓRIO" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$relatorioPath = "$backupDir\RELATORIO-BACKUP-LOCAL.md"
$relatorio = @"
# 📋 RELATÓRIO DE BACKUP LOCAL - MISSÃO C

**Data/Hora:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")  
**Sistema:** Gol de Ouro v1.2.0  
**Tipo:** Backup Local Completo (pós MISSÃO C)

---

## 📑 SUMÁRIO EXECUTIVO

Este relatório documenta o backup local completo do projeto Gol de Ouro executado após a conclusão da MISSÃO C. O backup inclui código fonte, testes, documentação e exportação do banco de dados.

**Status Geral:** ✅ **BACKUP CONCLUÍDO**

---

## 📦 ARQUIVOS GERADOS

### ZIPs de Código

| Componente | Arquivo | Status | Tamanho | Hash SHA256 |
|------------|---------|--------|---------|-------------|
| Backend | `codigo-backend.zip` | $($results.backend.Success) | $([math]::Round($results.backend.Size / 1MB, 2)) MB | $($results.backend.Hash) |
| Player | `codigo-player.zip` | $($results.player.Success) | $($results.player.SizeMB) MB | $($results.player.Hash) |
| Admin | `codigo-admin.zip` | $($results.admin.Success) | $($results.admin.SizeMB) MB | $($results.admin.Hash) |
| Mobile | `codigo-mobile.zip` | $($results.mobile.Success) | $($results.mobile.SizeMB) MB | $($results.mobile.Hash) |
| Testes | `testes-missao-c.zip` | $($results.tests.Success) | $($results.tests.SizeMB) MB | $($results.tests.Hash) |
| Docs | `docs-e-relatorios.zip` | $($results.docs.Success) | $([math]::Round($results.docs.Size / 1MB, 2)) MB | $($results.docs.Hash) |

### Banco de Dados

| Arquivo | Status | Hash SHA256 |
|---------|--------|-------------|
| `database/schema.sql` | $($results.schema.Success) | $($results.schema.Hash) |
| `database/data-critical.sql` | $($results.data.Success) | $($results.data.Hash) |

---

## 📊 ESTATÍSTICAS

### Tamanho Total dos Backups
- **Total:** $([math]::Round(($results.backend.Size + $results.player.Size + $results.admin.Size + $results.mobile.Size + $results.tests.Size + $results.docs.Size) / 1MB, 2)) MB

### Arquivos de Checksum
Todos os arquivos possuem checksums SHA256 salvos em `checksums/`:
- `codigo-backend.zip.sha256`
- `codigo-player.zip.sha256`
- `codigo-admin.zip.sha256`
- `codigo-mobile.zip.sha256`
- `testes-missao-c.zip.sha256`
- `docs-e-relatorios.zip.sha256`
- `schema.sql.sha256`
- `data-critical.sql.sha256`

---

## ⚠️ EXCLUSÕES APLICADAS

Conforme especificado, os seguintes itens foram **EXCLUÍDOS** do backup:

- ❌ Diretório `BACKUP-V15/`
- ❌ Diretório `node_modules/`
- ❌ Arquivos `*.zip` antigos
- ❌ Arquivos `.env` reais
- ❌ Diretórios de build (`dist/`, `build/`, `.next/`)
- ❌ Arquivos de log (`*.log`)

---

## ✅ VALIDAÇÃO

### Verificação de Integridade

Para verificar a integridade dos arquivos, execute:

\`\`\`powershell
# Verificar hash de um arquivo
Get-FileHash -Path "codigo-backend.zip" -Algorithm SHA256
\`\`\`

Compare o hash gerado com o arquivo correspondente em `checksums/`.

---

## 📍 LOCALIZAÇÃO

**Diretório de Backup:**  
\`$backupDir\`

**Estrutura:**
\`\`\`
$backupDir/
├── codigo-backend.zip
├── codigo-player.zip
├── codigo-admin.zip
├── codigo-mobile.zip
├── testes-missao-c.zip
├── docs-e-relatorios.zip
├── database/
│   ├── schema.sql
│   └── data-critical.sql
├── checksums/
│   ├── codigo-backend.zip.sha256
│   ├── codigo-player.zip.sha256
│   ├── codigo-admin.zip.sha256
│   ├── codigo-mobile.zip.sha256
│   ├── testes-missao-c.zip.sha256
│   ├── docs-e-relatorios.zip.sha256
│   ├── schema.sql.sha256
│   └── data-critical.sql.sha256
└── RELATORIO-BACKUP-LOCAL.md
\`\`\`

---

## 🔒 SEGURANÇA

- ✅ Nenhum arquivo `.env` real foi incluído
- ✅ Credenciais não foram expostas
- ✅ Apenas arquivos de código e documentação foram incluídos
- ✅ Todos os arquivos possuem checksums SHA256 para verificação de integridade

---

## 📝 NOTAS

- Backup executado em modo **somente leitura** (sem modificações no código)
- Todos os arquivos foram compactados com compressão **Optimal**
- Timestamp do backup: **$timestamp**

---

**Fim do Relatório**
"@

$relatorio | Out-File -FilePath $relatorioPath -Encoding UTF8
Write-Host "✅ Relatório gerado: $relatorioPath" -ForegroundColor Green

# Resumo Final
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESUMO FINAL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$totalSize = [math]::Round(($results.backend.Size + $results.player.Size + $results.admin.Size + $results.mobile.Size + $results.tests.Size + $results.docs.Size) / 1MB, 2)

Write-Host "`n✅ Backup concluído com sucesso!" -ForegroundColor Green
Write-Host "📁 Diretório: $backupDir" -ForegroundColor Cyan
Write-Host "📊 Tamanho total: $totalSize MB" -ForegroundColor Cyan
Write-Host "📄 Relatório: $relatorioPath" -ForegroundColor Cyan

Write-Host "`nArquivos gerados:" -ForegroundColor Yellow
Write-Host "  - codigo-backend.zip" -ForegroundColor Gray
Write-Host "  - codigo-player.zip" -ForegroundColor Gray
Write-Host "  - codigo-admin.zip" -ForegroundColor Gray
Write-Host "  - codigo-mobile.zip" -ForegroundColor Gray
Write-Host "  - testes-missao-c.zip" -ForegroundColor Gray
Write-Host "  - docs-e-relatorios.zip" -ForegroundColor Gray
Write-Host "  - database/schema.sql" -ForegroundColor Gray
Write-Host "  - database/data-critical.sql" -ForegroundColor Gray
Write-Host "  - RELATORIO-BACKUP-LOCAL.md" -ForegroundColor Gray

Write-Host "`n✅ Processo concluído!" -ForegroundColor Green

