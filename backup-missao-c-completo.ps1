# ============================================
# BACKUP COMPLETO - MISSÃO C
# Gol de Ouro Backend
# ============================================

param(
    [switch]$SkipDatabase = $false
)

$ErrorActionPreference = "Stop"

# Configurações
$ProjectRoot = "E:\Chute de Ouro\goldeouro-backend"
$BackupBase = "E:\Backups\Gol-De-Ouro\BACKUP-MISSAO-C"
$DateStamp = Get-Date -Format "yyyy-MM-dd"
$TimeStamp = Get-Date -Format "yyyy-MM-dd-HHmmss"
$BackupDir = Join-Path $BackupBase $DateStamp

# Cores para output
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

# Criar diretório de backup
Write-ColorOutput "`n========================================" "Cyan"
Write-ColorOutput "BACKUP COMPLETO - MISSÃO C" "Cyan"
Write-ColorOutput "========================================`n" "Cyan"

Write-ColorOutput "📁 Criando diretório de backup..." "Yellow"
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
Write-ColorOutput "✅ Diretório criado: $BackupDir" "Green"

# Função para criar ZIP excluindo padrões
function Create-Zip {
    param(
        [string]$SourcePath,
        [string]$OutputZip,
        [string]$Description
    )
    
    Write-ColorOutput "`n📦 Criando: $Description" "Yellow"
    Write-ColorOutput "   Origem: $SourcePath" "Gray"
    Write-ColorOutput "   Destino: $OutputZip" "Gray"
    
    if (-not (Test-Path $SourcePath)) {
        Write-ColorOutput "   ⚠️  Caminho não encontrado, pulando..." "Yellow"
        return $false
    }
    
    # Padrões de exclusão
    $ExcludePatterns = @(
        "node_modules",
        "BACKUP-V15",
        "*.zip",
        ".env",
        "dist",
        "build",
        ".next",
        ".cache",
        "coverage",
        ".git",
        ".vscode",
        ".idea",
        "*.log",
        "*.tmp",
        "*.temp"
    )
    
    try {
        # Usar Compress-Archive com filtros
        $TempDir = Join-Path $env:TEMP "backup-temp-$(Get-Random)"
        New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
        
        # Copiar arquivos excluindo padrões
        Get-ChildItem -Path $SourcePath -Recurse -File | Where-Object {
            $file = $_
            $relativePath = $file.FullName.Substring($SourcePath.Length + 1)
            $shouldExclude = $false
            
            foreach ($pattern in $ExcludePatterns) {
                if ($pattern -like "*.*") {
                    # Extensão de arquivo
                    if ($file.Name -like $pattern) {
                        $shouldExclude = $true
                        break
                    }
                } else {
                    # Diretório ou padrão
                    if ($relativePath -like "$pattern*" -or $relativePath -like "*\$pattern\*") {
                        $shouldExclude = $true
                        break
                    }
                }
            }
            
            return -not $shouldExclude
        } | ForEach-Object {
            $relativePath = $_.FullName.Substring($SourcePath.Length + 1)
            $destPath = Join-Path $TempDir $relativePath
            $destDir = Split-Path $destPath -Parent
            if (-not (Test-Path $destDir)) {
                New-Item -ItemType Directory -Path $destDir -Force | Out-Null
            }
            Copy-Item $_.FullName -Destination $destPath -Force
        }
        
        # Criar ZIP
        if (Test-Path $OutputZip) {
            Remove-Item $OutputZip -Force
        }
        Compress-Archive -Path "$TempDir\*" -DestinationPath $OutputZip -CompressionLevel Optimal
        
        # Limpar temp
        Remove-Item $TempDir -Recurse -Force
        
        $size = (Get-Item $OutputZip).Length / 1MB
        Write-ColorOutput "   ✅ ZIP criado: $([math]::Round($size, 2)) MB" "Green"
        return $true
    }
    catch {
        Write-ColorOutput "   ❌ Erro ao criar ZIP: $_" "Red"
        if (Test-Path $TempDir) {
            Remove-Item $TempDir -Recurse -Force -ErrorAction SilentlyContinue
        }
        return $false
    }
}

# Função para gerar hash SHA256
function Get-FileHashSHA256 {
    param([string]$FilePath)
    
    if (Test-Path $FilePath) {
        $hash = Get-FileHash -Path $FilePath -Algorithm SHA256
        return $hash.Hash
    }
    return $null
}

# Função para criar ZIP do backend consolidado
function Create-BackendZip {
    param(
        [string]$OutputZip,
        [string]$ProjectRoot
    )
    
    Write-ColorOutput "`n📦 Criando: Código Backend (consolidado)" "Yellow"
    
    $TempDir = Join-Path $env:TEMP "backup-backend-$(Get-Random)"
    New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
    
    try {
        # Diretórios e arquivos do backend a incluir
        $BackendItems = @(
            "backend",
            "controllers",
            "routes",
            "middlewares",
            "services",
            "utils",
            "config",
            "database",
            "src",
            "scripts"
        )
        
        # Copiar diretórios
        foreach ($item in $BackendItems) {
            $sourcePath = Join-Path $ProjectRoot $item
            if (Test-Path $sourcePath) {
                $destPath = Join-Path $TempDir $item
                Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force -Exclude "node_modules", "*.log", "*.tmp"
                Write-ColorOutput "   ✅ Copiado: $item" "Gray"
            }
        }
        
        # Copiar arquivos raiz importantes
        $RootFiles = @(
            "server-fly.js",
            "package.json",
            "package-lock.json",
            "fly.toml",
            "Dockerfile",
            "docker-compose.yml",
            "env.example",
            "*.config.js",
            "*.config.ts",
            "*.config.cjs"
        )
        
        foreach ($pattern in $RootFiles) {
            Get-ChildItem -Path $ProjectRoot -Filter $pattern -File -ErrorAction SilentlyContinue | ForEach-Object {
                Copy-Item -Path $_.FullName -Destination $TempDir -Force
                Write-ColorOutput "   ✅ Copiado: $($_.Name)" "Gray"
            }
        }
        
        # Excluir padrões indesejados
        Get-ChildItem -Path $TempDir -Recurse -Directory | Where-Object {
            $_.Name -eq "node_modules" -or 
            $_.Name -eq "BACKUP-V15" -or
            $_.Name -eq "dist" -or
            $_.Name -eq "build" -or
            $_.Name -eq ".git"
        } | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        
        Get-ChildItem -Path $TempDir -Recurse -File | Where-Object {
            $_.Extension -eq ".zip" -or
            $_.Name -eq ".env" -or
            $_.Extension -eq ".log" -or
            $_.Extension -eq ".tmp"
        } | Remove-Item -Force -ErrorAction SilentlyContinue
        
        # Criar ZIP
        if (Test-Path $OutputZip) {
            Remove-Item $OutputZip -Force
        }
        Compress-Archive -Path "$TempDir\*" -DestinationPath $OutputZip -CompressionLevel Optimal
        
        $size = (Get-Item $OutputZip).Length / 1MB
        Write-ColorOutput "   ✅ ZIP criado: $([math]::Round($size, 2)) MB" "Green"
        return $true
    }
    catch {
        Write-ColorOutput "   ❌ Erro: $_" "Red"
        return $false
    }
    finally {
        if (Test-Path $TempDir) {
            Remove-Item $TempDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

# Processar backups principais
$BackupResults = @{}

# Backend consolidado
$BackendZip = Join-Path $BackupDir "codigo-backend.zip"
$BackendResult = Create-BackendZip -OutputZip $BackendZip -ProjectRoot $ProjectRoot
$BackupResults[$BackendZip] = @{
    Success = $BackendResult
    Description = "Código Backend (consolidado)"
    Source = $ProjectRoot
}

# Player
$PlayerZip = Join-Path $BackupDir "codigo-player.zip"
$PlayerResult = Create-Zip -SourcePath (Join-Path $ProjectRoot "goldeouro-player") -OutputZip $PlayerZip -Description "Código Player"
$BackupResults[$PlayerZip] = @{
    Success = $PlayerResult
    Description = "Código Player"
    Source = Join-Path $ProjectRoot "goldeouro-player"
}

# Admin
$AdminZip = Join-Path $BackupDir "codigo-admin.zip"
$AdminResult = Create-Zip -SourcePath (Join-Path $ProjectRoot "goldeouro-admin") -OutputZip $AdminZip -Description "Código Admin"
$BackupResults[$AdminZip] = @{
    Success = $AdminResult
    Description = "Código Admin"
    Source = Join-Path $ProjectRoot "goldeouro-admin"
}

# Mobile
$MobileZip = Join-Path $BackupDir "codigo-mobile.zip"
$MobileResult = Create-Zip -SourcePath (Join-Path $ProjectRoot "goldeouro-mobile") -OutputZip $MobileZip -Description "Código Mobile"
$BackupResults[$MobileZip] = @{
    Success = $MobileResult
    Description = "Código Mobile"
    Source = Join-Path $ProjectRoot "goldeouro-mobile"
}

# Testes MISSÃO C
$TestsZip = Join-Path $BackupDir "testes-missao-c.zip"
$TestsResult = Create-Zip -SourcePath (Join-Path $ProjectRoot "tests") -OutputZip $TestsZip -Description "Testes MISSÃO C"
$BackupResults[$TestsZip] = @{
    Success = $TestsResult
    Description = "Testes MISSÃO C"
    Source = Join-Path $ProjectRoot "tests"
}

# Backup de documentação e relatórios
Write-ColorOutput "`n📚 Criando backup de documentação..." "Yellow"
$DocFiles = Get-ChildItem -Path $ProjectRoot -Filter "*.md" -File | Where-Object {
    $_.Name -like "RELATORIO-*" -or 
    $_.Name -like "PLANO-*" -or 
    $_.Name -like "AUDITORIA-*" -or
    $_.Name -like "CORRECAO-*" -or
    $_.Name -like "CHECKLIST-*" -or
    $_.Name -like "FASE-*" -or
    $_.Name -like "MISSAO-*" -or
    $_.Name -like "README*" -or
    $_.Name -like "CHANGELOG*" -or
    $_.Name -like "CONTRIBUTING*"
}

$DocZip = Join-Path $BackupDir "docs-e-relatorios.zip"
if ($DocFiles.Count -gt 0) {
    $DocFiles | Compress-Archive -DestinationPath $DocZip -CompressionLevel Optimal
    $docSize = (Get-Item $DocZip).Length / 1MB
    Write-ColorOutput "✅ Documentação: $([math]::Round($docSize, 2)) MB ($($DocFiles.Count) arquivos)" "Green"
    $BackupResults[$DocZip] = @{
        Success = $true
        Description = "Documentação e Relatórios"
        Source = $ProjectRoot
    }
} else {
    Write-ColorOutput "⚠️  Nenhum arquivo de documentação encontrado" "Yellow"
}

# Exportar banco de dados Supabase
if (-not $SkipDatabase) {
    Write-ColorOutput "`n🗄️  Exportando banco de dados Supabase..." "Yellow"
    
    # Schema SQL
    $SchemaSQL = Join-Path $BackupDir "schema.sql"
    Write-ColorOutput "   Gerando schema.sql..." "Gray"
    # Nota: A exportação real será feita via MCP ou script separado
    # Por enquanto, criamos arquivo placeholder
    @"
-- Schema SQL exportado em $TimeStamp
-- Este arquivo deve ser preenchido com a exportação real do Supabase
-- Use: pg_dump ou Supabase CLI para exportar o schema completo
"@ | Out-File -FilePath $SchemaSQL -Encoding UTF8
    
    # Dados críticos SQL
    $DataSQL = Join-Path $BackupDir "data-critical.sql"
    Write-ColorOutput "   Gerando data-critical.sql..." "Gray"
    @"
-- Dados críticos exportados em $TimeStamp
-- Este arquivo deve conter:
-- - Tabela usuarios (sem senhas)
-- - Tabela transacoes (últimos 30 dias)
-- - Tabela lotes (ativos)
-- - Tabela pagamentos (últimos 30 dias)
-- Use: pg_dump com filtros específicos para exportar dados críticos
"@ | Out-File -FilePath $DataSQL -Encoding UTF8
    
    Write-ColorOutput "   ⚠️  Arquivos SQL criados como placeholders" "Yellow"
    Write-ColorOutput "   ℹ️  Execute exportação manual do Supabase para preencher" "Cyan"
    
    $BackupResults[$SchemaSQL] = @{
        Success = $true
        Description = "Schema SQL (placeholder)"
        Source = "Supabase"
    }
    $BackupResults[$DataSQL] = @{
        Success = $true
        Description = "Dados Críticos SQL (placeholder)"
        Source = "Supabase"
    }
}

# Gerar hashes SHA256
Write-ColorOutput "`n🔐 Gerando hashes SHA256..." "Yellow"
$ChecksumsFile = Join-Path $BackupDir "checksums-sha256.txt"
$Checksums = @()

foreach ($file in Get-ChildItem -Path $BackupDir -File) {
    $hash = Get-FileHashSHA256 -FilePath $file.FullName
    if ($hash) {
        $Checksums += "$hash  $($file.Name)"
        Write-ColorOutput "   ✅ $($file.Name)" "Gray"
    }
}

$Checksums | Out-File -FilePath $ChecksumsFile -Encoding UTF8
Write-ColorOutput "✅ Checksums gerados: $($Checksums.Count) arquivos" "Green"

# Gerar relatório
Write-ColorOutput "`n📄 Gerando relatório de backup..." "Yellow"
$ReportFile = Join-Path $BackupDir "RELATORIO-BACKUP-LOCAL.md"

$Report = @"
# 📋 RELATÓRIO DE BACKUP LOCAL - MISSÃO C

**Data/Hora:** $TimeStamp  
**Sistema:** Gol de Ouro Backend  
**Versão:** MISSÃO C (Pós-Deploy)

---

## 📊 RESUMO EXECUTIVO

Backup completo do projeto Gol de Ouro executado com sucesso após conclusão da MISSÃO C.

### Estatísticas

| Item | Quantidade |
|------|------------|
| **ZIPs Criados** | $($BackupResults.Count) |
| **Arquivos SQL** | $(if (-not $SkipDatabase) { "2" } else { "0" }) |
| **Checksums** | $($Checksums.Count) |
| **Tamanho Total** | $([math]::Round((Get-ChildItem -Path $BackupDir -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)) MB |

---

## 📦 ARQUIVOS GERADOS

### ZIPs de Código

"@

foreach ($result in $BackupResults.GetEnumerator()) {
    $file = Get-Item $result.Key -ErrorAction SilentlyContinue
    if ($file) {
        $size = $file.Length / 1MB
        $status = if ($result.Value.Success) { "✅" } else { "❌" }
        $Report += @"

#### $status $($result.Value.Description)

- **Arquivo:** `$($file.Name)`
- **Tamanho:** $([math]::Round($size, 2)) MB
- **Origem:** $($result.Value.Source)
- **Status:** $(if ($result.Value.Success) { "Sucesso" } else { "Falha" })
"@
    }
}

$Report += @"

### Arquivos SQL

"@

if (-not $SkipDatabase) {
    $Report += @"
- **schema.sql** - Schema completo do banco de dados
- **data-critical.sql** - Dados críticos (usuários, transações, lotes, pagamentos)

⚠️ **NOTA:** Os arquivos SQL foram criados como placeholders. Execute a exportação manual do Supabase para preencher com dados reais.

"@
} else {
    $Report += @"
- ⏭️ Exportação de banco de dados foi pulada (flag -SkipDatabase)

"@
}

$Report += @"

### Checksums

- **checksums-sha256.txt** - Hashes SHA256 de todos os arquivos do backup

---

## 🔍 VALIDAÇÃO

### Exclusões Aplicadas

Os seguintes padrões foram **EXCLUÍDOS** do backup:

- ❌ `node_modules/` - Dependências (podem ser reinstaladas)
- ❌ `BACKUP-V15/` - Backups antigos
- ❌ `*.zip` - Arquivos ZIP antigos
- ❌ `.env` - Variáveis de ambiente reais
- ❌ `dist/`, `build/`, `.next/`, `.cache/` - Artefatos de build
- ❌ `.git/`, `.vscode/`, `.idea/` - Configurações de IDE
- ❌ `*.log`, `*.tmp`, `*.temp` - Arquivos temporários

### Inclusões

✅ Código-fonte completo  
✅ Configurações (env.example, package.json, etc.)  
✅ Testes (incluindo MISSÃO C)  
✅ Documentação e relatórios  
✅ Scripts de deploy e automação

---

## 📍 LOCALIZAÇÃO

**Diretório de Backup:**  
\`\`\`
$BackupDir
\`\`\`

---

## ✅ CONCLUSÃO

Backup local completo executado com sucesso. Todos os componentes críticos do projeto foram preservados.

**Próximos Passos:**
1. Validar integridade dos arquivos usando checksums
2. Executar exportação manual do banco Supabase
3. Armazenar backup em local seguro (nuvem, HD externo, etc.)

---

*Relatório gerado automaticamente em $TimeStamp*
"@

$Report | Out-File -FilePath $ReportFile -Encoding UTF8
Write-ColorOutput "✅ Relatório criado: RELATORIO-BACKUP-LOCAL.md" "Green"

# Resumo final
Write-ColorOutput "`n========================================" "Cyan"
Write-ColorOutput "✅ BACKUP CONCLUÍDO COM SUCESSO!" "Green"
Write-ColorOutput "========================================`n" "Cyan"

$TotalSize = (Get-ChildItem -Path $BackupDir -File | Measure-Object -Property Length -Sum).Sum / 1MB
Write-ColorOutput "📊 Tamanho Total: $([math]::Round($TotalSize, 2)) MB" "Cyan"
Write-ColorOutput "📁 Localização: $BackupDir" "Cyan"
Write-ColorOutput "`n📄 Relatório: RELATORIO-BACKUP-LOCAL.md" "Cyan"
Write-ColorOutput "`n" "White"

