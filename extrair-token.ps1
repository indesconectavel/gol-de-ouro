# Script para extrair token JWT real
$response = Invoke-WebRequest 'https://goldeouro-backend-v2.fly.dev/auth/login' -Method POST -Body (Get-Content test-login-novo.json -Raw) -ContentType 'application/json' -UseBasicParsing
$json = $response.Content | ConvertFrom-Json
$token = $json.token
Write-Host "Token extraido: $($token.Substring(0,50))..." -ForegroundColor Yellow
$token | Out-File -FilePath 'token-real.txt' -Encoding UTF8
Write-Host "Token salvo em token-real.txt" -ForegroundColor Green
