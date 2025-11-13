# 🔧 INSTALADOR DE FERRAMENTAS PARA MCPs - GOL DE OURO
# ======================================================
# Este script instala as ferramentas necessárias para os MCPs funcionarem completamente
# Data: 13 de Novembro de 2025
# Versão: 1.2.0

Write-Host "🔧 INSTALADOR DE FERRAMENTAS PARA MCPs" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está executando como Administrador
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "⚠️  Este script precisa ser executado como Administrador para algumas instalações." -ForegroundColor Yellow
    Write-Host "   Algumas ferramentas podem ser instaladas sem privilégios de administrador." -ForegroundColor Yellow
    Write-Host ""
}

# ======================================================
# 1. INSTALAR GITHUB CLI
# ======================================================
Write-Host "📦 1. INSTALANDO GITHUB CLI..." -ForegroundColor Green
Write-Host ""

$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if ($ghInstalled) {
    Write-Host "✅ GitHub CLI já está instalado!" -ForegroundColor Green
    gh --version
} else {
    Write-Host "📥 Instalando GitHub CLI via winget..." -ForegroundColor Yellow
    
    try {
        # Tentar instalar via winget
        winget install --id GitHub.cli --accept-package-agreements --accept-source-agreements
        
        # Adicionar ao PATH (pode precisar reiniciar o terminal)
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Host "✅ GitHub CLI instalado com sucesso!" -ForegroundColor Green
        Write-Host "⚠️  Pode ser necessário reiniciar o terminal para usar o comando 'gh'" -ForegroundColor Yellow
        
        # Tentar verificar instalação
        Start-Sleep -Seconds 2
        $ghCheck = Get-Command gh -ErrorAction SilentlyContinue
        if ($ghCheck) {
            gh --version
        } else {
            Write-Host "⚠️  GitHub CLI instalado, mas não encontrado no PATH atual." -ForegroundColor Yellow
            Write-Host "   Reinicie o terminal ou adicione manualmente ao PATH." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "❌ Erro ao instalar GitHub CLI: $_" -ForegroundColor Red
        Write-Host "   Instale manualmente de: https://cli.github.com/" -ForegroundColor Yellow
    }
}

Write-Host ""

# ======================================================
# 2. INSTALAR DOCKER DESKTOP
# ======================================================
Write-Host "🐳 2. VERIFICANDO DOCKER DESKTOP..." -ForegroundColor Green
Write-Host ""

$dockerInstalled = Get-Command docker -ErrorAction SilentlyContinue

if ($dockerInstalled) {
    Write-Host "✅ Docker já está instalado!" -ForegroundColor Green
    docker --version
} else {
    Write-Host "📥 Docker Desktop não está instalado." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para instalar Docker Desktop:" -ForegroundColor Cyan
    Write-Host "1. Baixe de: https://www.docker.com/products/docker-desktop/" -ForegroundColor White
    Write-Host "2. Execute o instalador" -ForegroundColor White
    Write-Host "3. Reinicie o computador após a instalação" -ForegroundColor White
    Write-Host "4. Inicie o Docker Desktop" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou instale via winget (requer privilégios de administrador):" -ForegroundColor Cyan
    Write-Host "  winget install --id Docker.DockerDesktop" -ForegroundColor White
    Write-Host ""
    
    $installDocker = Read-Host "Deseja tentar instalar via winget agora? (S/N)"
    if ($installDocker -eq "S" -or $installDocker -eq "s") {
        if ($isAdmin) {
            try {
                winget install --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
                Write-Host "✅ Docker Desktop instalado! Reinicie o computador após a instalação." -ForegroundColor Green
            } catch {
                Write-Host "❌ Erro ao instalar Docker Desktop: $_" -ForegroundColor Red
                Write-Host "   Instale manualmente de: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ É necessário executar como Administrador para instalar Docker Desktop." -ForegroundColor Red
        }
    }
}

Write-Host ""

# ======================================================
# 3. CORRIGIR JEST E LIGHTHOUSE
# ======================================================
Write-Host "🧪 3. CORRIGINDO CONFIGURAÇÕES DE JEST E LIGHTHOUSE..." -ForegroundColor Green
Write-Host ""

# Verificar se jest está instalado
$jestInstalled = Get-Command jest -ErrorAction SilentlyContinue

if (-not $jestInstalled) {
    Write-Host "📦 Jest não encontrado globalmente. Verificando no projeto..." -ForegroundColor Yellow
    
    if (Test-Path "node_modules\.bin\jest.cmd") {
        Write-Host "✅ Jest encontrado no projeto!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Jest não encontrado. Instalando..." -ForegroundColor Yellow
        npm install --save-dev jest
    }
}

# Verificar se lighthouse está instalado
$lighthouseInstalled = Get-Command lighthouse -ErrorAction SilentlyContinue

if (-not $lighthouseInstalled) {
    Write-Host "📦 Lighthouse não encontrado globalmente." -ForegroundColor Yellow
    Write-Host "   Lighthouse pode ser usado via npx sem instalação global." -ForegroundColor Cyan
}

# Criar/atualizar configuração do Jest
Write-Host "📝 Criando configuração do Jest..." -ForegroundColor Yellow

$jestConfig = @"
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000, // 30 segundos
  maxWorkers: 1,
  verbose: true,
  collectCoverage: false,
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['js', 'json'],
  transform: {}
};
"@

$jestConfigPath = "jest.config.js"
if (-not (Test-Path $jestConfigPath)) {
    $jestConfig | Out-File -FilePath $jestConfigPath -Encoding UTF8
    Write-Host "✅ Arquivo jest.config.js criado!" -ForegroundColor Green
} else {
    Write-Host "⚠️  jest.config.js já existe. Verifique se o timeout está configurado corretamente." -ForegroundColor Yellow
}

Write-Host ""

# ======================================================
# RESUMO FINAL
# ======================================================
Write-Host "📊 RESUMO DA INSTALAÇÃO" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

# Verificar GitHub CLI
$ghFinal = Get-Command gh -ErrorAction SilentlyContinue
if ($ghFinal) {
    Write-Host "✅ GitHub CLI: Instalado" -ForegroundColor Green
} else {
    Write-Host "⚠️  GitHub CLI: Não encontrado (pode precisar reiniciar terminal)" -ForegroundColor Yellow
}

# Verificar Docker
$dockerFinal = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerFinal) {
    Write-Host "✅ Docker: Instalado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Docker: Não instalado" -ForegroundColor Yellow
}

# Verificar Jest
$jestFinal = Get-Command jest -ErrorAction SilentlyContinue
if ($jestFinal -or (Test-Path "node_modules\.bin\jest.cmd")) {
    Write-Host "✅ Jest: Configurado" -ForegroundColor Green
} else {
    Write-Host "⚠️  Jest: Precisa ser instalado" -ForegroundColor Yellow
}

# Verificar Lighthouse
Write-Host "✅ Lighthouse: Disponível via npx" -ForegroundColor Green

Write-Host ""
Write-Host "🔍 Execute 'node scripts/verificar-mcps.js' para verificar o status dos MCPs" -ForegroundColor Cyan
Write-Host ""

