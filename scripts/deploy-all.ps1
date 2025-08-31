# Gol de Ouro - Deploy Completo (Backend + Admin)
# ===============================================
# 
# INSTRUÇÕES:
# 1. Configure as variáveis de ambiente
# 2. Execute: .\scripts\deploy-all.ps1
# 3. Siga as instruções para cada etapa
# 
# FLUXO:
# 1. Deploy Backend (Render/Railway)
# 2. Deploy Admin (Vercel)
# 3. Testes de integração
# 4. Verificação final

param(
    [string]$BackendPlatform = "render",
    [string]$AdminApiUrl = "",
    [switch]$SkipTests,
    [switch]$Force
)

# Cores para output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

Write-Host "$Blue🚀 Gol de Ouro - Deploy Completo$Reset"
Write-Host "$Yellow📍 Backend: $BackendPlatform$Reset"
Write-Host "$Yellow📍 Admin: Vercel$Reset"

# Verificar se estamos na pasta raiz
if (-not (Test-Path "package.json") -or -not (Test-Path "goldeouro-admin")) {
    Write-Host "$Red❌ Execute este script na pasta raiz do projeto!$Reset"
    exit 1
}

# Etapa 1: Deploy Backend
Write-Host "$Blue`n📋 ETAPA 1: Deploy Backend ($BackendPlatform)$Reset"
Write-Host "$Yellow💡 Execute o script de deploy do backend:$Reset"
Write-Host "   .\scripts\deploy-backend.ps1 -Platform $BackendPlatform"

if ($Force) {
    Write-Host "$Yellow💡 Use -Force se necessário$Reset"
}

Write-Host "$Blue⏳ Aguarde o deploy do backend ser concluído...$Reset"
Write-Host "$Yellow💡 Pressione Enter quando estiver pronto para continuar$Reset"
Read-Host

# Etapa 2: Obter URL do Backend
Write-Host "$Blue`n📋 ETAPA 2: Configurar URL do Backend$Reset"

if (-not $AdminApiUrl) {
    Write-Host "$Yellow💡 Digite a URL do seu backend deployado:$Reset"
    Write-Host "   Exemplo: https://goldeouro-backend.onrender.com"
    $AdminApiUrl = Read-Host "URL do Backend"
}

if (-not $AdminApiUrl) {
    Write-Host "$Red❌ URL do backend é obrigatória!$Reset"
    exit 1
}

Write-Host "$Green✅ URL do Backend: $AdminApiUrl$Reset"

# Etapa 3: Deploy Admin
Write-Host "$Blue`n📋 ETAPA 3: Deploy Admin (Vercel)$Reset"
Write-Host "$Yellow💡 Navegue para a pasta do admin:$Reset"
Write-Host "   cd goldeouro-admin"

Write-Host "$Yellow💡 Configure o .env.local:$Reset"
Write-Host "   VITE_API_URL=$AdminApiUrl"

Write-Host "$Yellow💡 Execute o deploy:$Reset"
Write-Host "   .\scripts\deploy-admin.ps1 -ApiUrl $AdminApiUrl"

Write-Host "$Blue⏳ Aguarde o deploy do admin ser concluído...$Reset"
Write-Host "$Yellow💡 Pressione Enter quando estiver pronto para continuar$Reset"
Read-Host

# Etapa 4: Testes de Integração
if (-not $SkipTests) {
    Write-Host "$Blue`n📋 ETAPA 4: Testes de Integração$Reset"
    Write-Host "$Yellow💡 Teste o backend:$Reset"
    Write-Host "   .\scripts\smoke.ps1"
    
    Write-Host "$Yellow💡 Teste o admin:$Reset"
    Write-Host "   cd goldeouro-admin"
    Write-Host "   npm run build"
    
    Write-Host "$Blue⏳ Execute os testes e pressione Enter quando estiver pronto$Reset"
    Read-Host
}

# Etapa 5: Verificação Final
Write-Host "$Blue`n📋 ETAPA 5: Verificação Final$Reset"
Write-Host "$Yellow✅ Backend deployado em: $AdminApiUrl$Reset"
Write-Host "$Yellow✅ Admin deployado no Vercel$Reset"

Write-Host "$Blue🔍 Checklist de Verificação:$Reset"
Write-Host "   ☐ Backend respondendo em /health"
Write-Host "   ☐ Admin acessível via Vercel"
Write-Host "   ☐ Login funcionando"
Write-Host "   ☐ Rotas protegidas funcionando"
Write-Host "   ☐ CORS configurado corretamente"

Write-Host "$Blue`n💡 Comandos Úteis:$Reset"
Write-Host "   # Rollback Backend:"
Write-Host "   .\scripts\rollback-backend.ps1 -Platform $BackendPlatform"
Write-Host "   # Rollback Admin:"
Write-Host "   cd goldeouro-admin"
Write-Host "   .\scripts\rollback-admin.ps1"

Write-Host "$Green`n🎉 Deploy Completo Configurado!$Reset"
Write-Host "$Blue💡 Siga as instruções de cada etapa para finalizar$Reset"
