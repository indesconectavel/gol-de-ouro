# Script para criar PIX de teste - R$ 1,00
# Gol de Ouro v1.2.1

$apiUrl = "https://goldeouro-backend-v2.fly.dev"
$valor = 1.00

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "💰 CRIANDO PIX DE TESTE - R$ $valor"
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host ""

# Solicitar credenciais
$email = Read-Host "Digite o email do usuário"
$password = Read-Host "Digite a senha" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

Write-Host ""
Write-Host "📤 Passo 1: Fazendo login..."

try {
    $loginBody = @{
        email = $email
        password = $passwordPlain
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "$apiUrl/api/auth/login" `
        -Method POST `
        -Body $loginBody `
        -ContentType "application/json" `
        -ErrorAction Stop

    $loginData = $loginResponse.Content | ConvertFrom-Json

    if ($loginData.success) {
        Write-Host "✅ Login realizado com sucesso!"
        $token = $loginData.data.token
        $userId = $loginData.data.user.id
        Write-Host "   User ID: $userId"
        Write-Host "   Saldo atual: R$ $($loginData.data.user.saldo)"
        Write-Host ""
    } else {
        Write-Host "❌ Erro no login: $($loginData.message)"
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao fazer login: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Resposta: $responseBody"
    }
    exit 1
}

Write-Host "📤 Passo 2: Criando PIX de R$ $valor..."

try {
    $pixBody = @{
        valor = $valor
        descricao = "Depósito de teste - Gol de Ouro"
    } | ConvertTo-Json

    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $pixResponse = Invoke-WebRequest -Uri "$apiUrl/api/payments/pix/criar" `
        -Method POST `
        -Body $pixBody `
        -Headers $headers `
        -ErrorAction Stop

    $pixData = $pixResponse.Content | ConvertFrom-Json

    if ($pixData.success) {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════"
        Write-Host "✅ PIX CRIADO COM SUCESSO!"
        Write-Host "═══════════════════════════════════════════════════════════"
        Write-Host ""
        Write-Host "📋 INFORMAÇÕES DO PIX:"
        Write-Host "   Payment ID: $($pixData.data.payment_id)"
        Write-Host "   Valor: R$ $valor"
        Write-Host "   Expira em: $($pixData.data.expires_at)"
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════"
        Write-Host "📱 CÓDIGO PIX COPIA E COLA:"
        Write-Host "═══════════════════════════════════════════════════════════"
        Write-Host ""
        Write-Host "$($pixData.data.pix_copy_paste)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════"
        Write-Host ""
        Write-Host "💡 INSTRUÇÕES:"
        Write-Host "   1. Copie o código acima"
        Write-Host "   2. Abra seu app de banco"
        Write-Host "   3. Cole o código no campo PIX"
        Write-Host "   4. Confirme o pagamento de R$ $valor"
        Write-Host "   5. Aguarde alguns segundos para o webhook processar"
        Write-Host ""
        Write-Host "🔍 Para verificar o status do pagamento:"
        Write-Host "   GET $apiUrl/api/payments/pix/status/$($pixData.data.payment_id)"
        Write-Host ""
        
        # Salvar informações em arquivo
        $pixInfo = @{
            payment_id = $pixData.data.payment_id
            valor = $valor
            pix_copy_paste = $pixData.data.pix_copy_paste
            expires_at = $pixData.data.expires_at
            created_at = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        } | ConvertTo-Json -Depth 10

        $pixInfo | Out-File -FilePath "pix-teste-info.json" -Encoding UTF8
        Write-Host "✅ Informações salvas em: pix-teste-info.json"
        Write-Host ""
    } else {
        Write-Host "❌ Erro ao criar PIX: $($pixData.message)"
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao criar PIX: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Resposta: $responseBody"
    }
    exit 1
}

Write-Host "═══════════════════════════════════════════════════════════"
Write-Host "✅ PROCESSO CONCLUÍDO!"
Write-Host "═══════════════════════════════════════════════════════════"
Write-Host ""

