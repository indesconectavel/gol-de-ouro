# Script PowerShell para executar validações pós-deploy
# Uso: .\scripts\executar-validacoes.ps1

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "🚀 EXECUTANDO VALIDAÇÕES PÓS-DEPLOY"
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host ""

$BackendUrl = if ($env:BACKEND_URL) { $env:BACKEND_URL } else { "https://goldeouro-backend-v2.fly.dev" }

# 1. Health Check
Write-Host "1️⃣  Verificando health do backend..."
try {
    $healthResponse = Invoke-WebRequest -Uri "$BackendUrl/health" -Method GET -UseBasicParsing -ErrorAction Stop
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "   ✅ Backend está online" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Backend retornou código: $($healthResponse.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erro ao verificar health: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 2. Verificar X-Frame-Options
Write-Host "2️⃣  Verificando headers de segurança..."
try {
    $headersResponse = Invoke-WebRequest -Uri "$BackendUrl/health" -Method HEAD -UseBasicParsing -ErrorAction Stop
    $xFrameOptions = $headersResponse.Headers['X-Frame-Options']
    $xContentTypeOptions = $headersResponse.Headers['X-Content-Type-Options']
    
    if ($xFrameOptions -eq "DENY") {
        Write-Host "   ✅ X-Frame-Options: DENY (presente)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  X-Frame-Options não encontrado ou incorreto" -ForegroundColor Yellow
    }
    
    if ($xContentTypeOptions -eq "nosniff") {
        Write-Host "   ✅ X-Content-Type-Options: nosniff (presente)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  X-Content-Type-Options não encontrado" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Erro ao verificar headers: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 3. Verificar meta info
Write-Host "3️⃣  Verificando meta info..."
try {
    $metaResponse = Invoke-RestMethod -Uri "$BackendUrl/meta" -Method GET -ErrorAction Stop
    Write-Host "   ✅ Meta info disponível" -ForegroundColor Green
    $metaResponse | ConvertTo-Json -Depth 3 | Write-Host
} catch {
    Write-Host "   ⚠️  Meta info não disponível: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "✅ VALIDAÇÕES CONCLUÍDAS"
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host ""
Write-Host "📋 PRÓXIMOS PASSOS MANUAIS:"
Write-Host ""
Write-Host "1. Verificar Security Advisor no Supabase"
Write-Host "2. Executar scripts/validar-pagamentos-expired.sql"
Write-Host "3. Executar teste PIX com credenciais validas"
Write-Host ""
