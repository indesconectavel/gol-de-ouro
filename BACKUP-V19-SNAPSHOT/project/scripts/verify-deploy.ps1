# Gol de Ouro - Verificação Pós-Deploy
# ====================================
# 
# INSTRUÇÕES:
# 1. Execute após o deploy completo
# 2. Verifica backend, admin e integração
# 3. Gera relatório de status
# 
# REQUISITOS:
# - Backend deployado e rodando
# - Admin deployado no Vercel
# - URLs configuradas

param(
    [string]$BackendUrl = "",
    [string]$AdminUrl = "",
    [switch]$Detailed
)

# Cores para output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

Write-Host "$Blue🔍 Gol de Ouro - Verificação Pós-Deploy$Reset"

# Obter URLs se não fornecidas
if (-not $BackendUrl) {
    $BackendUrl = Read-Host "URL do Backend (ex: https://goldeouro-backend.onrender.com)"
}

if (-not $AdminUrl) {
    $AdminUrl = Read-Host "URL do Admin (ex: https://goldeouro-admin.vercel.app)"
}

Write-Host "$Yellow📍 Backend: $BackendUrl$Reset"
Write-Host "$Yellow📍 Admin: $AdminUrl$Reset"

# Contador de verificações
$TotalChecks = 0
$PassedChecks = 0
$FailedChecks = 0

# Função para verificar endpoint
function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Description,
        [string]$ExpectedStatus = "200"
    )
    
    $TotalChecks++
    Write-Host "`n🔍 $Description"
    Write-Host "   URL: $Url"
    
    try {
        $Response = Invoke-RestMethod -Uri $Url -Method GET -TimeoutSec 10 -ErrorAction Stop
        $StatusCode = $Response.StatusCode
        
        if ($StatusCode -eq $ExpectedStatus) {
            Write-Host "   $Green✅ SUCESSO - Status: $StatusCode$Reset"
            $PassedChecks++
            return $true
        } else {
            Write-Host "   $Red❌ FALHOU - Status: $StatusCode (esperado: $ExpectedStatus)$Reset"
            $FailedChecks++
            return $false
        }
    }
    catch {
        Write-Host "   $Red❌ FALHOU - Erro: $($_.Exception.Message)$Reset"
        $FailedChecks++
        return $false
    }
}

# Função para verificar integração
function Test-Integration {
    param(
        [string]$BackendUrl,
        [string]$AdminUrl
    )
    
    $TotalChecks++
    Write-Host "`n🔍 Teste de Integração Backend-Admin"
    
    try {
        # Verificar se admin consegue acessar backend
        $Response = Invoke-RestMethod -Uri "$BackendUrl/health" -Method GET -TimeoutSec 10 -ErrorAction Stop
        
        if ($Response.status -eq "healthy") {
            Write-Host "   $Green✅ SUCESSO - Backend acessível pelo admin$Reset"
            $PassedChecks++
            return $true
        } else {
            Write-Host "   $Red❌ FALHOU - Backend não está saudável$Reset"
            $FailedChecks++
            return $false
        }
    }
    catch {
        Write-Host "   $Red❌ FALHOU - Erro na integração: $($_.Exception.Message)$Reset"
        $FailedChecks++
        return $false
    }
}

Write-Host "$Blue`n📋 Iniciando verificações...$Reset"

# Verificação 1: Backend Health
Test-Endpoint -Url "$BackendUrl/health" -Description "Backend Health Check"

# Verificação 2: Backend Root
Test-Endpoint -Url "$BackendUrl/" -Description "Backend Root Endpoint"

# Verificação 3: Admin Build
Test-Endpoint -Url "$AdminUrl" -Description "Admin Frontend"

# Verificação 4: Integração
Test-Integration -BackendUrl $BackendUrl -AdminUrl $AdminUrl

# Verificação 5: CORS (se detalhado)
if ($Detailed) {
    $TotalChecks++
    Write-Host "`n🔍 Teste de CORS"
    Write-Host "   Verificando se admin pode fazer requests para backend..."
    
    try {
        $Headers = @{
            "Origin" = $AdminUrl
            "Content-Type" = "application/json"
        }
        
        $Response = Invoke-RestMethod -Uri "$BackendUrl/health" -Method GET -Headers $Headers -TimeoutSec 10 -ErrorAction Stop
        
        if ($Response.status -eq "healthy") {
            Write-Host "   $Green✅ SUCESSO - CORS funcionando$Reset"
            $PassedChecks++
        } else {
            Write-Host "   $Red❌ FALHOU - CORS com problema$Reset"
            $FailedChecks++
        }
    }
    catch {
        Write-Host "   $Red❌ FALHOU - Erro no CORS: $($_.Exception.Message)$Reset"
        $FailedChecks++
    }
}

# Resultado final
Write-Host "$Blue`n📊 RESULTADO FINAL:$Reset"
Write-Host "   Verificações executadas: $TotalChecks"
Write-Host "   $Green✅ Sucessos: $PassedChecks$Reset"
Write-Host "   $Red❌ Falhas: $FailedChecks$Reset"

if ($PassedChecks -eq $TotalChecks) {
    Write-Host "$Green`n🎉 TODAS AS VERIFICAÇÕES PASSARAM!$Reset"
    Write-Host "   Deploy funcionando perfeitamente!"
} elseif ($PassedChecks -gt 0) {
    Write-Host "$Yellow`n⚠️  ALGUMAS VERIFICAÇÕES FALHARAM$Reset"
    Write-Host "   Verifique os problemas acima"
} else {
    Write-Host "$Red`n🚨 TODAS AS VERIFICAÇÕES FALHARAM!$Reset"
    Write-Host "   Deploy com problemas críticos"
}

Write-Host "$Blue`n💡 Próximos Passos:$Reset"
Write-Host "   1. Teste funcionalidades específicas"
Write-Host "   2. Verifique logs de erro"
Write-Host "   3. Teste login e rotas protegidas"
Write-Host "   4. Monitore performance"

Write-Host "$Blue`n🔧 Comandos Úteis:$Reset"
Write-Host "   # Teste completo do backend:"
Write-Host "   .\scripts\smoke.ps1"
Write-Host "   # Logs do backend:"
Write-Host "   render logs goldeouro-backend"
Write-Host "   # Status do admin:"
Write-Host "   vercel ls"
