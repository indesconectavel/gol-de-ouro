# Script PowerShell para deploy no Fly.io
# Executa deploy e validação do X-Frame-Options

$APP_NAME = "goldeouro-backend-v2"
$BACKEND_URL = "https://goldeouro-backend-v2.fly.dev"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "🚀 DEPLOY FLY.IO - X-Frame-Options"
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host ""
Write-Host "App: $APP_NAME"
Write-Host "Backend: $BACKEND_URL"
Write-Host ""

# Verificar se flyctl está disponível
try {
    $flyVersion = flyctl version 2>&1
    Write-Host "✅ flyctl encontrado"
    Write-Host ""
} catch {
    Write-Host "❌ flyctl não encontrado"
    Write-Host "   Instale: https://fly.io/docs/hands-on/install-flyctl/"
    Write-Host ""
    exit 1
}

# 1. Verificar autenticação
Write-Host "1️⃣  Verificando autenticação..."
try {
    $whoami = flyctl auth whoami 2>&1
    Write-Host "   ✅ Autenticado: $whoami"
} catch {
    Write-Host "   ❌ Não autenticado"
    Write-Host "   Execute: flyctl auth login"
    exit 1
}
Write-Host ""

# 2. Verificar status atual
Write-Host "2️⃣  Verificando status atual..."
try {
    flyctl status -a $APP_NAME
} catch {
    Write-Host "   ⚠️  Erro ao verificar status (continuando...)"
}
Write-Host ""

# 3. Fazer deploy
Write-Host "3️⃣  Iniciando deploy..."
Write-Host "   ⏳ Isso pode levar 2-5 minutos..."
Write-Host ""
try {
    flyctl deploy -a $APP_NAME
    Write-Host ""
    Write-Host "   ✅ Deploy concluído"
} catch {
    Write-Host ""
    Write-Host "   ❌ Erro no deploy"
    Write-Host "   Verifique os logs acima"
    exit 1
}
Write-Host ""

# 4. Aguardar estabilização
Write-Host "4️⃣  Aguardando estabilização (30 segundos)..."
Start-Sleep -Seconds 30
Write-Host ""

# 5. Validar X-Frame-Options
Write-Host "5️⃣  Validando X-Frame-Options..."
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/health" -Method HEAD -UseBasicParsing
    $xFrame = $response.Headers['X-Frame-Options']
    
    if ($xFrame -eq 'DENY') {
        Write-Host "   ✅ X-Frame-Options presente: DENY"
    } else {
        Write-Host "   ⚠️  X-Frame-Options: $xFrame"
        Write-Host "   Aguardar propagação CDN (5-10 minutos)"
    }
} catch {
    Write-Host "   ⚠️  Erro ao validar (tentar novamente em alguns minutos)"
}
Write-Host ""

# 6. Verificar logs
Write-Host "6️⃣  Verificando logs recentes..."
Write-Host ""
try {
    flyctl logs -a $APP_NAME --limit 20
} catch {
    Write-Host "   ⚠️  Erro ao verificar logs"
}
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "✅ DEPLOY CONCLUÍDO"
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host ""
Write-Host "📋 Próximos passos:"
Write-Host "   1. Validar X-Frame-Options: bash scripts/validar-x-frame-options.sh"
Write-Host "   2. Executar teste completo: bash scripts/teste-completo-pre-deploy.sh"
Write-Host "   3. Verificar logs: flyctl logs -a $APP_NAME"
Write-Host ""

