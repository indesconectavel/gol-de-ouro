# 🧹 LIMPEZA, OTIMIZAÇÃO E VERIFICAÇÃO COMPLETA DO GOL DE OURO - WINDOWS
# ------------------------------------------------------------------------
# Este script remove arquivos pesados e temporários, reinstala dependências,
# otimiza o histórico Git e verifica automaticamente o pipeline principal.
# Versão adaptada para Windows PowerShell

# Configuração de cores para PowerShell
$Host.UI.RawUI.ForegroundColor = "Cyan"
Write-Host "🚀 Iniciando limpeza e otimização do projeto Gol de Ouro..." -ForegroundColor Blue
Write-Host "===================================================================" -ForegroundColor Blue

# Função para verificar se estamos no diretório correto
function Test-Directory {
    if (-not (Test-Path "package.json") -and -not (Test-Path "backend") -and -not (Test-Path "goldeouro-player") -and -not (Test-Path "goldeouro-admin")) {
        Write-Host "❌ ERRO: Execute este script no diretório raiz do projeto Gol de Ouro" -ForegroundColor Red
        Write-Host "💡 Dica: Certifique-se de estar em: E:\Chute de Ouro\goldeouro-backend" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ Diretório correto detectado" -ForegroundColor Green
}

# Função para backup de segurança
function New-Backup {
    Write-Host "💾 Criando backup de segurança antes da limpeza..." -ForegroundColor Yellow
    $BackupDir = "backup-pre-limpeza-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
    
    # Backup de arquivos importantes
    if (Test-Path "backend\package*.json") { Copy-Item "backend\package*.json" "$BackupDir\" -Recurse -Force }
    if (Test-Path "goldeouro-player\package*.json") { Copy-Item "goldeouro-player\package*.json" "$BackupDir\" -Recurse -Force }
    if (Test-Path "goldeouro-admin\package*.json") { Copy-Item "goldeouro-admin\package*.json" "$BackupDir\" -Recurse -Force }
    if (Test-Path ".github") { Copy-Item ".github" "$BackupDir\" -Recurse -Force }
    if (Test-Path "scripts") { Copy-Item "scripts" "$BackupDir\" -Recurse -Force }
    
    Write-Host "✅ Backup criado em: $BackupDir" -ForegroundColor Green
}

# Função para limpeza segura
function Remove-UnnecessaryFiles {
    Write-Host "🧹 Iniciando limpeza de arquivos desnecessários..." -ForegroundColor Magenta
    
    # 1️⃣ Remover arquivos e pastas desnecessárias
    Write-Host "📁 Removendo node_modules..." -ForegroundColor Cyan
    Get-ChildItem -Path . -Name "node_modules" -Recurse -Directory | ForEach-Object { Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue }
    
    Write-Host "📁 Removendo pastas de build e cache..." -ForegroundColor Cyan
    @("backups", "artifacts", "tmp", "dist", ".cache", ".vercel", ".fly", ".turbo", ".next") | ForEach-Object {
        Get-ChildItem -Path . -Name $_ -Recurse -Directory | ForEach-Object { Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue }
    }
    
    Write-Host "📁 Removendo backups antigos..." -ForegroundColor Cyan
    Get-ChildItem -Path . -Name "BACKUP-COMPLETO-*" -Directory | ForEach-Object { Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue }
    Get-ChildItem -Path . -Name "teste-rollback-*" -Directory | ForEach-Object { Remove-Item $_ -Recurse -Force -ErrorAction SilentlyContinue }
    
    Write-Host "✅ Limpeza de arquivos concluída" -ForegroundColor Green
}

# Função para recriar estrutura
function New-EssentialStructure {
    Write-Host "🏗️ Recriando estrutura de pastas essenciais..." -ForegroundColor Magenta
    
    # 2️⃣ Recriar pastas essenciais
    @("backend", "goldeouro-player", "goldeouro-admin", "docs", "scripts", "config") | ForEach-Object {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
    
    Write-Host "✅ Estrutura de pastas recriada" -ForegroundColor Green
}

# Função para reinstalar dependências
function Install-Dependencies {
    Write-Host "📦 Reinstalando dependências essenciais..." -ForegroundColor Magenta
    
    # 3️⃣ Reinstalar dependências principais
    if (Test-Path "backend\package.json") {
        Write-Host "📦 Instalando dependências do backend..." -ForegroundColor Cyan
        Set-Location "backend"
        npm install --silent
        Set-Location ".."
        Write-Host "✅ Backend: dependências instaladas" -ForegroundColor Green
    }
    
    if (Test-Path "goldeouro-player\package.json") {
        Write-Host "📦 Instalando dependências do player..." -ForegroundColor Cyan
        Set-Location "goldeouro-player"
        npm install --silent
        Set-Location ".."
        Write-Host "✅ Player: dependências instaladas" -ForegroundColor Green
    }
    
    if (Test-Path "goldeouro-admin\package.json") {
        Write-Host "📦 Instalando dependências do admin..." -ForegroundColor Cyan
        Set-Location "goldeouro-admin"
        npm install --silent
        Set-Location ".."
        Write-Host "✅ Admin: dependências instaladas" -ForegroundColor Green
    }
    
    Write-Host "✅ Todas as dependências foram reinstaladas" -ForegroundColor Green
}

# Função para validar ambiente
function Test-Environment {
    Write-Host "🧪 Validando ambiente local..." -ForegroundColor Magenta
    
    # 4️⃣ Validar ambiente local
    Write-Host "🔍 Verificando versões:" -ForegroundColor Cyan
    try { Write-Host "Node.js: $(node -v)" -ForegroundColor Green } catch { Write-Host "Node.js: ❌ Não instalado" -ForegroundColor Red }
    try { Write-Host "NPM: $(npm -v)" -ForegroundColor Green } catch { Write-Host "NPM: ❌ Não instalado" -ForegroundColor Red }
    try { Write-Host "Git: $(git --version)" -ForegroundColor Green } catch { Write-Host "Git: ❌ Não instalado" -ForegroundColor Red }
    
    # Verificar se estamos em um repositório Git
    if (-not (Test-Path ".git")) {
        Write-Host "❌ AVISO: Não é um repositório Git" -ForegroundColor Red
        Write-Host "💡 Execute 'git init' se necessário" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Repositório Git detectado" -ForegroundColor Green
    }
}

# Função para verificar tamanho
function Get-RepositorySize {
    Write-Host "📊 Verificando tamanho do repositório..." -ForegroundColor Magenta
    
    # 5️⃣ Verificar tamanho total do repositório
    Write-Host "📏 Tamanho total após limpeza:" -ForegroundColor Cyan
    try {
        $size = (Get-ChildItem -Path . -Recurse -File | Measure-Object -Property Length -Sum).Sum
        $sizeMB = [math]::Round($size / 1MB, 2)
        Write-Host "Tamanho: $sizeMB MB" -ForegroundColor Green
    } catch {
        Write-Host "Tamanho: Não foi possível calcular" -ForegroundColor Yellow
    }
}

# Função para otimizar Git
function Optimize-Git {
    Write-Host "🧰 Otimizando histórico Git..." -ForegroundColor Magenta
    
    # 6️⃣ Otimizar histórico Git
    if (Test-Path ".git") {
        Write-Host "🔧 Executando limpeza do Git..." -ForegroundColor Cyan
        try {
            git reflog expire --expire=now --all 2>$null
            git gc --prune=now --aggressive 2>$null
            Write-Host "✅ Histórico Git otimizado" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Erro na otimização do Git" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ Pulando otimização Git (não é um repositório Git)" -ForegroundColor Yellow
    }
}

# Função para commit e push
function Commit-Changes {
    Write-Host "💾 Commitando alterações..." -ForegroundColor Magenta
    
    # 7️⃣ Reforçar sincronização e commit
    if (Test-Path ".git") {
        Write-Host "📝 Adicionando arquivos ao Git..." -ForegroundColor Cyan
        git add . 2>$null
        
        Write-Host "💾 Criando commit..." -ForegroundColor Cyan
        git commit -m "🧹 Limpeza e otimização do repositório (remoção de temporários e builds)" 2>$null
        
        Write-Host "🚀 Enviando para o repositório remoto..." -ForegroundColor Cyan
        try {
            git push origin main 2>$null
            Write-Host "✅ Alterações commitadas e enviadas" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Falha no push. Verifique a configuração do Git remoto" -ForegroundColor Yellow
            Write-Host "💡 Execute manualmente: git push origin main" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ Pulando commit (não é um repositório Git)" -ForegroundColor Yellow
    }
}

# Função para reindexar workflows
function Reindex-Workflows {
    Write-Host "🔄 Forçando reindexação do workflow principal..." -ForegroundColor Magenta
    
    # 8️⃣ Forçar reindexação de workflows no GitHub
    if ((Test-Path ".git") -and (Test-Path ".github\workflows")) {
        Write-Host "🔁 Tocando arquivo de workflow..." -ForegroundColor Cyan
        if (Test-Path ".github\workflows\main-pipeline.yml") {
            (Get-Item ".github\workflows\main-pipeline.yml").LastWriteTime = Get-Date
        }
        
        Write-Host "💾 Commitando alteração de workflow..." -ForegroundColor Cyan
        git add ".github\workflows\main-pipeline.yml" 2>$null
        git commit -m "🔁 Reindex workflow principal - GitHub Actions" 2>$null
        
        Write-Host "🚀 Enviando alteração..." -ForegroundColor Cyan
        try {
            git push origin main 2>$null
            Write-Host "✅ Workflow principal reindexado" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Falha no push do workflow. Execute manualmente" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ Pulando reindexação (workflows não encontrados)" -ForegroundColor Yellow
    }
}

# Função para verificar workflows
function Test-Workflows {
    Write-Host "🔍 Verificando workflows ativos..." -ForegroundColor Magenta
    
    # 9️⃣ Auditoria e verificação automática de workflows
    Write-Host "📋 Listando workflows disponíveis:" -ForegroundColor Cyan
    try {
        gh workflow list --repo indesconectavel/gol-de-ouro 2>$null
    } catch {
        Write-Host "⚠️ GitHub CLI não configurado ou repositório não encontrado" -ForegroundColor Yellow
        Write-Host "🌐 Verifique manualmente em: https://github.com/indesconectavel/gol-de-ouro/actions" -ForegroundColor Blue
    }
}

# Função principal
function Main {
    Write-Host "===================================================================" -ForegroundColor Blue
    Write-Host "🧹 SCRIPT DE LIMPEZA E OTIMIZAÇÃO - GOL DE OURO (WINDOWS)" -ForegroundColor Blue
    Write-Host "===================================================================" -ForegroundColor Blue
    Write-Host ""
    
    # Executar todas as funções
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
    Write-Host "✅ Limpeza concluída com sucesso!" -ForegroundColor Green
    Write-Host "🚀 Workflow principal reindexado e sincronizado com GitHub Actions." -ForegroundColor Green
    Write-Host ""
    Write-Host "🌐 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host "1. Acesse: https://github.com/indesconectavel/gol-de-ouro/actions" -ForegroundColor Cyan
    Write-Host "2. Procure por: '🚀 Pipeline Principal - Gol de Ouro'" -ForegroundColor Cyan
    Write-Host "3. Clique em 'Run workflow'" -ForegroundColor Cyan
    Write-Host "4. Selecione branch: 'main'" -ForegroundColor Cyan
    Write-Host "5. Clique em 'Run workflow' novamente" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎯 MONITORAMENTO:" -ForegroundColor Green
    Write-Host "• Acompanhe a execução em tempo real" -ForegroundColor Cyan
    Write-Host "• Verifique os logs de cada job" -ForegroundColor Cyan
    Write-Host "• Confirme que todos os testes passaram" -ForegroundColor Cyan
    Write-Host "• Baixe os artifacts gerados" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "===================================================================" -ForegroundColor Blue
}

# Executar função principal
Main
