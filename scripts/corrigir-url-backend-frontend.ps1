# Script para corrigir URL do backend no frontend
# Substitui goldeouro-backend.fly.dev por goldeouro-backend-v2.fly.dev

$frontendPath = "../goldeouro-player"
$oldUrl = "goldeouro-backend.fly.dev"
$newUrl = "goldeouro-backend-v2.fly.dev"

Write-Host "🔍 Procurando arquivos com URL antiga..." -ForegroundColor Yellow

# Encontrar todos os arquivos que contêm a URL antiga
$files = Get-ChildItem -Path $frontendPath -Recurse -Include *.js,*.jsx,*.ts,*.tsx,*.env*,*.config.js,*.config.ts,*.json | 
    Where-Object { 
        $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        $content -and $content -match [regex]::Escape($oldUrl)
    }

if ($files.Count -eq 0) {
    Write-Host "✅ Nenhum arquivo encontrado com URL antiga" -ForegroundColor Green
    exit 0
}

Write-Host "📝 Encontrados $($files.Count) arquivo(s) para corrigir:" -ForegroundColor Cyan
$files | ForEach-Object { Write-Host "   - $($_.FullName)" }

Write-Host "`n🔄 Corrigindo URLs..." -ForegroundColor Yellow

$files | ForEach-Object {
    $file = $_
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace [regex]::Escape($oldUrl), $newUrl
    
    if ($content -ne $newContent) {
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        Write-Host "✅ Corrigido: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "`n✅ Correção concluída!" -ForegroundColor Green
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Verificar alterações: git diff" -ForegroundColor White
Write-Host "   2. Commit: git commit -m 'fix: Atualizar URL do backend para v2'" -ForegroundColor White
Write-Host "   3. Deploy no Vercel" -ForegroundColor White

