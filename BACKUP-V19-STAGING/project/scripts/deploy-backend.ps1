# Gol de Ouro Backend - Deploy Automatizado
# ===========================================
# 
# INSTRUÇÕES:
# 1. Configure as variáveis de ambiente no .env
# 2. Execute: .\scripts\deploy-backend.ps1
# 3. Escolha a plataforma (Render/Railway)
# 
# PLATAFORMAS SUPORTADAS:
# - Render (gratuito, recomendado)
# - Railway (gratuito, alternativo)

param(
    [string]$Platform = "render",
    [switch]$Force
)

# Cores para output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

Write-Host "$Blue🚀 Gol de Ouro Backend - Deploy Automatizado$Reset"
Write-Host "$Yellow📍 Plataforma: $Platform$Reset"

# Verificar se .env existe
if (-not (Test-Path ".env")) {
    Write-Host "$Red❌ Arquivo .env não encontrado!$Reset"
    Write-Host "$Yellow💡 Crie o arquivo .env com as variáveis necessárias:$Reset"
    Write-Host "   DATABASE_URL=postgresql://..."
    Write-Host "   JWT_SECRET=sua_chave_jwt"
    Write-Host "   ADMIN_TOKEN=seu_token_admin"
    Write-Host "   CORS_ORIGINS=http://localhost:5174,https://seu-admin.vercel.app"
    exit 1
}

# Verificar variáveis obrigatórias
$RequiredVars = @("DATABASE_URL", "JWT_SECRET", "ADMIN_TOKEN", "CORS_ORIGINS")
$MissingVars = @()

foreach ($var in $RequiredVars) {
    $value = Get-Content ".env" | Where-Object { $_ -match "^$var=" } | ForEach-Object { ($_ -split "=", 2)[1] }
    if (-not $value) {
        $MissingVars += $var
    }
}

if ($MissingVars.Count -gt 0) {
    Write-Host "$Red❌ Variáveis obrigatórias faltando no .env:$Reset"
    foreach ($var in $MissingVars) {
        Write-Host "   $Red- $var$Reset"
    }
    exit 1
}

Write-Host "$Green✅ Variáveis de ambiente configuradas$Reset"

# Verificar se o código está limpo
Write-Host "$Blue🔍 Verificando código...$Reset"

# Verificar se há credenciais hardcoded
$HardcodedFiles = @()
$HardcodedFiles += Get-ChildItem -Recurse -Include "*.js", "*.jsx", "*.ts", "*.tsx" | Where-Object { 
    (Get-Content $_.FullName -Raw) -match "(password|secret|token).*=.*['`"][^'`"]*['`"]"
}

if ($HardcodedFiles.Count -gt 0) {
    Write-Host "$Red⚠️  ATENÇÃO: Credenciais hardcoded encontradas:$Reset"
    foreach ($file in $HardcodedFiles) {
        Write-Host "   $Red- $($file.Name)$Reset"
    }
    
    if (-not $Force) {
        Write-Host "$Yellow💡 Use -Force para continuar mesmo assim$Reset"
        exit 1
    }
}

# Verificar se o banco está acessível
Write-Host "$Blue🔍 Testando conexão com banco...$Reset"
try {
    node test-db.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "$Green✅ Banco de dados acessível$Reset"
    } else {
        Write-Host "$Red❌ Problema na conexão com banco$Reset"
        if (-not $Force) {
            exit 1
        }
    }
} catch {
    Write-Host "$Red❌ Erro ao testar banco: $($_.Exception.Message)$Reset"
    if (-not $Force) {
        exit 1
    }
}

# Deploy baseado na plataforma
switch ($Platform.ToLower()) {
    "render" {
        Write-Host "$Blue🚀 Deploy no Render...$Reset"
        Write-Host "$Yellow📋 Passos:$Reset"
        Write-Host "   1. Acesse: https://render.com"
        Write-Host "   2. Conecte seu repositório GitHub"
        Write-Host "   3. Selecione este repositório"
        Write-Host "   4. Configure como Web Service"
        Write-Host "   5. Build Command: npm install"
        Write-Host "   6. Start Command: npm start"
        Write-Host "   7. Health Check Path: /health"
        Write-Host "   8. Configure as variáveis de ambiente:"
        
        foreach ($var in $RequiredVars) {
            $value = Get-Content ".env" | Where-Object { $_ -match "^$var=" } | ForEach-Object { ($_ -split "=", 2)[1] }
            Write-Host "      $var = $value"
        }
        
        Write-Host "$Green✅ Configuração Render pronta!$Reset"
    }
    
    "railway" {
        Write-Host "$Blue🚀 Deploy no Railway...$Reset"
        Write-Host "$Yellow📋 Passos:$Reset"
        Write-Host "   1. Instale Railway CLI: npm i -g @railway/cli"
        Write-Host "   2. Login: railway login"
        Write-Host "   3. Inicialize: railway init"
        Write-Host "   4. Deploy: railway up"
        Write-Host "   5. Configure variáveis: railway variables set"
        
        foreach ($var in $RequiredVars) {
            $value = Get-Content ".env" | Where-Object { $_ -match "^$var=" } | ForEach-Object { ($_ -split "=", 2)[1] }
            Write-Host "      $var = $value"
        }
        
        Write-Host "$Green✅ Configuração Railway pronta!$Reset"
    }
    
    default {
        Write-Host "$Red❌ Plataforma não suportada: $Platform$Reset"
        Write-Host "$Yellow💡 Use: render ou railway$Reset"
        exit 1
    }
}

Write-Host "$Green🎉 Deploy configurado com sucesso!$Reset"
Write-Host "$Blue💡 Próximo passo: Siga as instruções acima para sua plataforma$Reset"
