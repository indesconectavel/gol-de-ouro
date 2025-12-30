# Script de Validacao: CSP Removido
# Verifica se o CSP foi removido corretamente apos deploy

Write-Host ""
Write-Host "==============================================================="
Write-Host "VALIDACAO: CSP Removido"
Write-Host "==============================================================="
Write-Host ""

$url = "https://goldeouro.lol"

Write-Host "Verificando headers HTTP de: $url"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri $url -Method HEAD -UseBasicParsing -ErrorAction Stop
    
    Write-Host "SUCESSO: Conexao estabelecida"
    Write-Host ""
    Write-Host "Headers de Seguranca encontrados:"
    Write-Host ""
    
    # Verificar headers de seguranca
    $cspFound = $false
    $xContentTypeFound = $false
    $xFrameFound = $false
    $xXSSFound = $false
    
    foreach ($header in $response.Headers.GetEnumerator()) {
        $key = $header.Key
        $value = $header.Value
        
        if ($key -eq "Content-Security-Policy") {
            $cspFound = $true
            Write-Host "ERRO: Content-Security-Policy encontrado: $value" -ForegroundColor Red
        }
        elseif ($key -eq "X-Content-Type-Options") {
            $xContentTypeFound = $true
            Write-Host "OK: X-Content-Type-Options: $value" -ForegroundColor Green
        }
        elseif ($key -eq "X-Frame-Options") {
            $xFrameFound = $true
            Write-Host "OK: X-Frame-Options: $value" -ForegroundColor Green
        }
        elseif ($key -eq "X-XSS-Protection") {
            $xXSSFound = $true
            Write-Host "OK: X-XSS-Protection: $value" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    Write-Host "==============================================================="
    Write-Host "RESULTADO DA VALIDACAO:"
    Write-Host "==============================================================="
    Write-Host ""
    
    if ($cspFound) {
        Write-Host "FALHA: CSP ainda esta presente!" -ForegroundColor Red
        Write-Host "   - O CSP nao foi removido corretamente" -ForegroundColor Yellow
        Write-Host "   - Verificar se o deploy foi concluido" -ForegroundColor Yellow
        Write-Host "   - Aguardar propagacao CDN (5-10 minutos)" -ForegroundColor Yellow
        Write-Host "   - Limpar cache do navegador" -ForegroundColor Yellow
    } else {
        Write-Host "SUCESSO: CSP foi removido!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Protecoes mantidas:" -ForegroundColor Cyan
        if ($xContentTypeFound) {
            Write-Host "   OK: X-Content-Type-Options" -ForegroundColor Green
        } else {
            Write-Host "   AVISO: X-Content-Type-Options nao encontrado" -ForegroundColor Yellow
        }
        
        if ($xFrameFound) {
            Write-Host "   OK: X-Frame-Options" -ForegroundColor Green
        } else {
            Write-Host "   AVISO: X-Frame-Options nao encontrado" -ForegroundColor Yellow
        }
        
        if ($xXSSFound) {
            Write-Host "   OK: X-XSS-Protection" -ForegroundColor Green
        } else {
            Write-Host "   AVISO: X-XSS-Protection nao encontrado" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "==============================================================="
    Write-Host "PROXIMOS PASSOS:"
    Write-Host "==============================================================="
    Write-Host ""
    Write-Host "1. Abrir https://goldeouro.lol no navegador"
    Write-Host "2. Pressionar F12 (DevTools)"
    Write-Host "3. Ir para aba Console"
    Write-Host "4. Verificar se NAO ha erros CSP"
    Write-Host "5. Testar funcionalidades (login, navegacao)"
    Write-Host ""
    Write-Host "DICA: Se ainda aparecerem erros CSP:"
    Write-Host "   - Fazer hard refresh (Ctrl+Shift+R)"
    Write-Host "   - Limpar cache do navegador"
    Write-Host "   - Aguardar propagacao CDN"
    Write-Host ""
    
} catch {
    Write-Host "ERRO ao verificar headers:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Verificar manualmente:"
    Write-Host "   1. Abrir https://goldeouro.lol"
    Write-Host "   2. F12 -> Network -> Selecionar requisicao"
    Write-Host "   3. Verificar Response Headers"
    Write-Host ""
}

Write-Host "==============================================================="
Write-Host ""
