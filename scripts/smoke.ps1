# Gol de Ouro Backend - Smoke Test
# ===================================
# 
# INSTRUÇÕES:
# 1. Certifique-se de que o backend está rodando (npm start)
# 2. Execute: .\scripts\smoke.ps1 -AdminToken "seu_token_aqui"
# 3. Ou configure: $env:ADMIN_TOKEN="seu_token_aqui"
# 
# ROTAS TESTADAS:
# - GET / (rota raiz - pública - esperado: 200)
# - GET /admin/lista-usuarios (protegida - esperado: 403 sem token, 200 com token)
# - GET /health (rota de saúde - esperado: 200)

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$AdminToken = $env:ADMIN_TOKEN
)

# Cores para output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

Write-Host "$Blue🚀 Gol de Ouro Backend - Smoke Test$Reset"
Write-Host "$Yellow📍 URL Base: $BaseUrl$Reset"

if ($AdminToken) {
    Write-Host "$Green🔑 Admin Token: Configurado$Reset"
} else {
    Write-Host "$Red🔑 Admin Token: NÃO CONFIGURADO$Reset"
    Write-Host "$Yellow💡 Configure com: `$env:ADMIN_TOKEN=`"seu_token_aqui`"$Reset"
    Write-Host "$Yellow💡 Ou execute: .\scripts\smoke.ps1 -AdminToken `"seu_token_aqui`"$Reset"
    exit 1
}

Write-Host "$Blue`n📋 Iniciando testes...$Reset"

# Headers para rotas protegidas
$AdminHeaders = @{
    "x-admin-token" = $AdminToken
    "Content-Type" = "application/json"
}

# Contador de sucessos
$SuccessCount = 0
$TotalTests = 3

# Teste 1: Rota raiz (pública - esperado: 200)
Write-Host "$Blue`n🔍 Teste 1: Rota raiz da API (pública)$Reset"
Write-Host "$Yellow   Esperado: Status 200$Reset"
try {
    $StartTime = Get-Date
    $Response = Invoke-RestMethod -Uri "$BaseUrl/" -Method GET -TimeoutSec 10
    $Duration = (Get-Date - $StartTime).TotalMilliseconds
    
    if ($Response.message -and $Response.message -like "*API Gol de Ouro ativa*") {
        Write-Host "$Green✅ SUCESSO - Status: 200 - Tempo: $Duration`ms$Reset"
        Write-Host "$Blue📊 Resposta: $($Response.message)$Reset"
        $SuccessCount++
    } else {
        Write-Host "$Red❌ FALHOU - Resposta inesperada$Reset"
    }
} catch {
    Write-Host "$Red❌ FALHOU - $($_.Exception.Message)$Reset"
}

# Teste 2: Lista de usuários (protegida - esperado: 403 sem token, 200 com token)
Write-Host "$Blue`n🔍 Teste 2: Lista de usuários (protegida)$Reset"
Write-Host "$Yellow   Esperado: Status 403 sem token, 200 com token$Reset"

# Teste 2a: Sem token (esperado: 403)
Write-Host "$Yellow   Teste 2a: Sem token (esperado: 403)$Reset"
try {
    $StartTime = Get-Date
    $Response = Invoke-RestMethod -Uri "$BaseUrl/admin/lista-usuarios" -Method GET -TimeoutSec 10 -ErrorAction Stop
    Write-Host "$Red❌ FALHOU - Deveria ter retornado 403 sem token$Reset"
} catch {
    $Duration = (Get-Date - $StartTime).TotalMilliseconds
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "$Green✅ SUCESSO - Status 403 sem token - Tempo: $Duration`ms$Reset"
        Write-Host "$Blue📊 Resposta: $($_.Exception.Response.StatusDescription)$Reset"
    } else {
        Write-Host "$Red❌ FALHOU - Status inesperado: $($_.Exception.Response.StatusCode)$Reset"
    }
}

# Teste 2b: Com token (esperado: 200)
Write-Host "$Yellow   Teste 2b: Com token (esperado: 200)$Reset"
try {
    $StartTime = Get-Date
    $Response = Invoke-RestMethod -Uri "$BaseUrl/admin/lista-usuarios" -Method GET -Headers $AdminHeaders -TimeoutSec 10
    $Duration = (Get-Date - $StartTime).TotalMilliseconds
    Write-Host "$Green✅ SUCESSO - Status: 200 com token - Tempo: $Duration`ms$Reset"
    Write-Host "$Blue📊 Resposta: Lista de usuários carregada$Reset"
    $SuccessCount++
} catch {
    Write-Host "$Red❌ FALHOU - $($_.Exception.Message)$Reset"
}

# Teste 3: Rota de saúde (esperado: 200)
Write-Host "$Blue`n🔍 Teste 3: Rota de saúde$Reset"
Write-Host "$Yellow   Esperado: Status 200$Reset"
try {
    $StartTime = Get-Date
    $Response = Invoke-RestMethod -Uri "$BaseUrl/health" -Method GET -TimeoutSec 10
    $Duration = (Get-Date - $StartTime).TotalMilliseconds
    
    if ($Response.status -eq "healthy") {
        Write-Host "$Green✅ SUCESSO - Status: 200 - Tempo: $Duration`ms$Reset"
        Write-Host "$Blue📊 Resposta: $($Response.status) - Database: $($Response.database)$Reset"
        $SuccessCount++
    } else {
        Write-Host "$Red❌ FALHOU - Status não saudável: $($Response.status)$Reset"
    }
} catch {
    Write-Host "$Red❌ FALHOU - $($_.Exception.Message)$Reset"
}

# Resultado final
Write-Host "$Blue`n📊 RESULTADO FINAL:$Reset"
Write-Host "$Yellow   Testes executados: $TotalTests$Reset"
Write-Host "$Green   Sucessos: $SuccessCount$Reset"
Write-Host "$Red   Falhas: $($TotalTests - $SuccessCount)$Reset"

if ($SuccessCount -eq $TotalTests) {
    Write-Host "$Green`n🎉 TODOS OS TESTES PASSARAM! Backend funcionando perfeitamente.$Reset"
} elseif ($SuccessCount -gt 0) {
    Write-Host "$Yellow`n⚠️  ALGUNS TESTES PASSARAM. Verifique os logs acima.$Reset"
} else {
    Write-Host "$Red`n🚨 TODOS OS TESTES FALHARAM! Backend com problemas críticos.$Reset"
}

Write-Host "$Blue`n💡 Dicas:$Reset"
Write-Host "   - Verifique se o backend está rodando: npm start"
Write-Host "   - Confirme se as rotas existem no server.js"
Write-Host "   - Verifique se o ADMIN_TOKEN está correto"
Write-Host "   - Confirme se o banco está conectado"
Write-Host "   - Verifique se as variáveis de ambiente estão configuradas"
