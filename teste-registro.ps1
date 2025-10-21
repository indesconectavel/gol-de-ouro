# Teste do endpoint de registro
Write-Host "Testando endpoint de registro..." -ForegroundColor Yellow

$body = @{
    email = "teste@teste.com"
    password = "123456"
    username = "teste"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "SUCESSO: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "ERRO: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}
