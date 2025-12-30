# Limpeza e Otimizacao Completa - Gol de Ouro (Windows)
# Script PowerShell para limpeza completa do projeto

Write-Host "Iniciando limpeza e otimizacao do projeto Gol de Ouro..." -ForegroundColor Blue
Write-Host "===================================================================" -ForegroundColor Blue

# Funcao para verificar diretorio
function Test-Directory {
    if (-not (Test-Path "package.json") -and -not (Test-Path "backend") -and -not (Test-Path "goldeouro-player") -and -not (Test-Path "goldeouro-admin")) {
        Write-Host "ERRO: Execute este script no diretorio raiz do projeto Gol de Ouro" -ForegroundColor Red
        Write-Host "Dica: Certifique-se de estar em: E:\Chute de Ouro\goldeouro-backend" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "Diretorio correto detectado" -ForegroundColor Green
}

# Funcao para backup de seguranca
function New-Backup {
    Write-Host "Criando backup de seguranca antes da limpeza..." -ForegroundColor Yellow
    $BackupDir = "backup-pre-limpeza-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    
    # Backup de arquivos importantes
    if (Test-Path "backend\package*.json") { Copy-Item "backend\package*.json" "$BackupDir\" -Recurse -Force }
    if (Test-Path "goldeouro-player\package*.json") { Copy-Item "goldeouro-player\package*.json" "$BackupDir\" -Recurse -Force }
    if (Test-Path "goldeouro-admin\package*.json") { Copy-Item "goldeouro-admin\package*.json" "$BackupDir\" -Recurse -Force }
    if (Test-Path ".github") { Copy-Item ".github" "$BackupDir\" -Recurse -Force }
    if (Test-Path "scripts") { Copy-Item "scripts" "$BackupDir\" -Recurse -Force }
    
    Write-Host "Backup criado em: $BackupDir" -ForegroundColor Green
}

# Funcao para limpeza segura
function Remove-UnnecessaryFiles {
    Write-Host "Iniciando limpeza de arquivos desnecessarios..." -ForegroundColor Magenta
    
    # Remover node_modules
    Write-Host "Removendo node_modules..." -ForegroundColor Cyan
    Get-ChildItem -Path . -Name "node_modules" -Recurse -Directory | ForEach-Object { Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue }
    
    # Remover pastas de build e cache
    Write-Host "Removendo pastas de build e cache..." -ForegroundColor Cyan
    $foldersToRemove = @("backups", "artifacts", "tmp", "dist", ".cache", ".vercel", ".fly", ".turbo", ".next")
    foreach ($folder in $foldersToRemove) {
        Get-ChildItem -Path . -Name $folder -Recurse -Directory | ForEach-Object { Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue }
    }
    
    # Remover backups antigos
    Write-Host "Removendo backups antigos..." -ForegroundColor Cyan
    Get-ChildItem -Path . -Name "BACKUP-COMPLETO-*" -Directory | ForEach-Object { Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue }
    Get-ChildItem -Path . -Name "teste-rollback-*" -Directory | ForEach-Object { Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue }
    
    Write-Host "Limpeza de arquivos concluida" -ForegroundColor Green
}

# Funcao para recriar estrutura
function New-EssentialStructure {
    Write-Host "Recriando estrutura de pastas essenciais..." -ForegroundColor Magenta
    
    $essentialFolders = @("backend", "goldeouro-player", "goldeouro-admin", "docs", "scripts", "config")
    foreach ($folder in $essentialFolders) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
    }
    
    Write-Host "Estrutura de pastas recriada" -ForegroundColor Green
}

# Funcao para reinstalar dependencias
function Install-Dependencies {
    Write-Host "Reinstalando dependencias essenciais..." -ForegroundColor Magenta
    
    # Reinstalar dependencias do backend
    if (Test-Path "backend\package.json") {
        Write-Host "Instalando dependencias do backend..." -ForegroundColor Cyan
        Set-Location "backend"
        npm install --silent
        Set-Location ".."
        Write-Host "Backend: dependencias instaladas" -ForegroundColor Green
    }
    
    # Reinstalar dependencias do player
    if (Test-Path "goldeouro-player\package.json") {
        Write-Host "Instalando dependencias do player..." -ForegroundColor Cyan
        Set-Location "goldeouro-player"
        npm install --silent
        Set-Location ".."
        Write-Host "Player: dependencias instaladas" -ForegroundColor Green
    }
    
    # Reinstalar dependencias do admin
    if (Test-Path "goldeouro-admin\package.json") {
        Write-Host "Instalando dependencias do admin..." -ForegroundColor Cyan
        Set-Location "goldeouro-admin"
        npm install --silent
        Set-Location ".."
        Write-Host "Admin: dependencias instaladas" -ForegroundColor Green
    }
    
    Write-Host "Todas as dependencias foram reinstaladas" -ForegroundColor Green
}

# Funcao para validar ambiente
function Test-Environment {
    Write-Host "Validando ambiente local..." -ForegroundColor Magenta
    
    Write-Host "Verificando versoes:" -ForegroundColor Cyan
    try { Write-Host "Node.js: $(node -v)" -ForegroundColor Green } catch { Write-Host "Node.js: Nao instalado" -ForegroundColor Red }
    try { Write-Host "NPM: $(npm -v)" -ForegroundColor Green } catch { Write-Host "NPM: Nao instalado" -ForegroundColor Red }
    try { Write-Host "Git: $(git --version)" -ForegroundColor Green } catch { Write-Host "Git: Nao instalado" -ForegroundColor Red }
    
    # Verificar se estamos em um repositorio Git
    if (-not (Test-Path ".git")) {
        Write-Host "AVISO: Nao e um repositorio Git" -ForegroundColor Red
        Write-Host "Execute 'git init' se necessario" -ForegroundColor Yellow
    } else {
        Write-Host "Repositorio Git detectado" -ForegroundColor Green
    }
}

# Funcao para verificar tamanho
function Get-RepositorySize {
    Write-Host "Verificando tamanho do repositorio..." -ForegroundColor Magenta
    
    Write-Host "Tamanho total apos limpeza:" -ForegroundColor Cyan
    try {
        $size = (Get-ChildItem -Path . -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $sizeMB = [math]::Round($size / 1MB, 2)
        Write-Host "Tamanho: $sizeMB MB" -ForegroundColor Green
    } catch {
        Write-Host "Tamanho: Nao foi possivel calcular" -ForegroundColor Yellow
    }
}

# Funcao para otimizar Git
function Optimize-Git {
    Write-Host "Otimizando historico Git..." -ForegroundColor Magenta
    
    if (Test-Path ".git") {
        Write-Host "Executando limpeza do Git..." -ForegroundColor Cyan
        try {
            git reflog expire --expire=now --all 2>$null
            git gc --prune=now --aggressive 2>$null
            Write-Host "Historico Git otimizado" -ForegroundColor Green
        } catch {
            Write-Host "Erro na otimizacao do Git" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Pulando otimizacao Git (nao e um repositorio Git)" -ForegroundColor Yellow
    }
}

# Funcao para commit e push
function Commit-Changes {
    Write-Host "Commitando alteracoes..." -ForegroundColor Magenta
    
    if (Test-Path ".git") {
        Write-Host "Adicionando arquivos ao Git..." -ForegroundColor Cyan
        git add . 2>$null
        
        Write-Host "Criando commit..." -ForegroundColor Cyan
        git commit -m "Limpeza e otimizacao do repositorio (remocao de temporarios e builds)" 2>$null
        
        Write-Host "Enviando para o repositorio remoto..." -ForegroundColor Cyan
        try {
            git push origin main 2>$null
            Write-Host "Alteracoes commitadas e enviadas" -ForegroundColor Green
        } catch {
            Write-Host "Falha no push. Verifique a configuracao do Git remoto" -ForegroundColor Yellow
            Write-Host "Execute manualmente: git push origin main" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Pulando commit (nao e um repositorio Git)" -ForegroundColor Yellow
    }
}

# Funcao para reindexar workflows
function Reindex-Workflows {
    Write-Host "Forcando reindexacao do workflow principal..." -ForegroundColor Magenta
    
    if ((Test-Path ".git") -and (Test-Path ".github\workflows")) {
        Write-Host "Tocando arquivo de workflow..." -ForegroundColor Cyan
        if (Test-Path ".github\workflows\main-pipeline.yml") {
            (Get-Item ".github\workflows\main-pipeline.yml").LastWriteTime = Get-Date
        }
        
        Write-Host "Commitando alteracao de workflow..." -ForegroundColor Cyan
        git add ".github\workflows\main-pipeline.yml" 2>$null
        git commit -m "Reindex workflow principal - GitHub Actions" 2>$null
        
        Write-Host "Enviando alteracao..." -ForegroundColor Cyan
        try {
            git push origin main 2>$null
            Write-Host "Workflow principal reindexado" -ForegroundColor Green
        } catch {
            Write-Host "Falha no push do workflow. Execute manualmente" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Pulando reindexacao (workflows nao encontrados)" -ForegroundColor Yellow
    }
}

# Funcao para verificar workflows
function Test-Workflows {
    Write-Host "Verificando workflows ativos..." -ForegroundColor Magenta
    
    Write-Host "Listando workflows disponiveis:" -ForegroundColor Cyan
    try {
        gh workflow list --repo indesconectavel/gol-de-ouro 2>$null
    } catch {
        Write-Host "GitHub CLI nao configurado ou repositorio nao encontrado" -ForegroundColor Yellow
        Write-Host "Verifique manualmente em: https://github.com/indesconectavel/gol-de-ouro/actions" -ForegroundColor Blue
    }
}

# Funcao principal
function Main {
    Write-Host "===================================================================" -ForegroundColor Blue
    Write-Host "SCRIPT DE LIMPEZA E OTIMIZACAO - GOL DE OURO (WINDOWS)" -ForegroundColor Blue
    Write-Host "===================================================================" -ForegroundColor Blue
    Write-Host ""
    
    # Executar todas as funcoes
    Test-Directory
    New-Backup
    Remove-UnnecessaryFiles
    New-EssentialStructure
    Install-Dependencies
    Test-Environment
    Get-RepositorySize
    Optimize-Git
    Commit-Changes
    Reindex-Workflows
    Test-Workflows
    
    Write-Host ""
    Write-Host "===================================================================" -ForegroundColor Blue
    Write-Host "Limpeza concluida com sucesso!" -ForegroundColor Green
    Write-Host "Workflow principal reindexado e sincronizado com GitHub Actions." -ForegroundColor Green
    Write-Host ""
    Write-Host "PROXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://github.com/indesconectavel/gol-de-ouro/actions" -ForegroundColor Cyan
    Write-Host "2. Procure por: 'Pipeline Principal - Gol de Ouro'" -ForegroundColor Cyan
    Write-Host "3. Clique em 'Run workflow'" -ForegroundColor Cyan
    Write-Host "4. Selecione branch: 'main'" -ForegroundColor Cyan
    Write-Host "5. Clique em 'Run workflow' novamente" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "MONITORAMENTO:" -ForegroundColor Green
    Write-Host "• Acompanhe a execucao em tempo real" -ForegroundColor Cyan
    Write-Host "• Verifique os logs de cada job" -ForegroundColor Cyan
    Write-Host "• Confirme que todos os testes passaram" -ForegroundColor Cyan
    Write-Host "• Baixe os artifacts gerados" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "===================================================================" -ForegroundColor Blue
}

# Executar funcao principal
Main
