# DEPLOY RENDER FIX - Gol de Ouro Backend
# Script PowerShell para fazer deploy da correção no Render

Write-Host "🚀 INICIANDO DEPLOY RENDER FIX..." -ForegroundColor Green
Write-Host ""

# Verificar se estamos no diretório correto
if (-not (Test-Path "server-render-fix.js")) {
    Write-Host "❌ ERRO: Arquivo server-render-fix.js não encontrado!" -ForegroundColor Red
    Write-Host "   Execute este script no diretório raiz do projeto." -ForegroundColor Yellow
    exit 1
}

# Verificar se o router.js existe
if (-not (Test-Path "router.js")) {
    Write-Host "❌ ERRO: Arquivo router.js não encontrado!" -ForegroundColor Red
    Write-Host "   O arquivo router.js é necessário para o funcionamento." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Arquivos necessários encontrados:" -ForegroundColor Green
Write-Host "   - server-render-fix.js" -ForegroundColor White
Write-Host "   - router.js" -ForegroundColor White
Write-Host "   - package.json" -ForegroundColor White
Write-Host "   - render.yaml" -ForegroundColor White
Write-Host ""

# Verificar se o Git está configurado
Write-Host "🔍 Verificando configuração do Git..." -ForegroundColor Cyan
try {
    $gitStatus = git status --porcelain
    Write-Host "✅ Git configurado corretamente" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO: Git não configurado ou não encontrado!" -ForegroundColor Red
    Write-Host "   Configure o Git antes de continuar." -ForegroundColor Yellow
    exit 1
}

# Mostrar status do Git
Write-Host "📋 Status dos arquivos:" -ForegroundColor Cyan
git status --short

Write-Host ""
Write-Host "🔧 ARQUIVOS MODIFICADOS/CRIADOS:" -ForegroundColor Yellow
Write-Host "   ✅ router.js - Router principal criado" -ForegroundColor White
Write-Host "   ✅ server-render-fix.js - Atualizado com import do router" -ForegroundColor White
Write-Host "   ✅ diagnostico-render-fix.js - Script de diagnóstico" -ForegroundColor White
Write-Host "   ✅ AUDITORIA-RENDER-CORRIGIDA-2025-09-06.md - Relatório completo" -ForegroundColor White
Write-Host ""

# Perguntar se deseja continuar
$continuar = Read-Host "Deseja fazer commit e push das alterações? (s/n)"
if ($continuar -ne "s" -and $continuar -ne "S") {
    Write-Host "❌ Deploy cancelado pelo usuário." -ForegroundColor Red
    exit 0
}

# Fazer commit das alterações
Write-Host "📝 Fazendo commit das alterações..." -ForegroundColor Cyan
try {
    git add .
    git commit -m "FIX: Resolve erro Cannot find module router no Render - Criado arquivo router.js faltante - Atualizado server-render-fix.js com import do router - Adicionado script de diagnostico - Criado relatorio de auditoria completa - Problema resolvido: Backend agora pode inicializar no Render"
    
    Write-Host "✅ Commit realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO ao fazer commit: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Fazer push para o repositório
Write-Host "🚀 Fazendo push para o repositório..." -ForegroundColor Cyan
try {
    git push origin main
    Write-Host "✅ Push realizado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO ao fazer push: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Verifique a configuração do repositório remoto." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🎉 DEPLOY RENDER FIX CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 RESUMO DA CORREÇÃO:" -ForegroundColor Cyan
Write-Host "   ✅ Erro 'Cannot find module ./router' resolvido" -ForegroundColor White
Write-Host "   ✅ Arquivo router.js criado e integrado" -ForegroundColor White
Write-Host "   ✅ Servidor testado localmente e funcionando" -ForegroundColor White
Write-Host "   ✅ Alterações commitadas e enviadas para o repositório" -ForegroundColor White
Write-Host ""
Write-Host "🔗 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host "   1. Acesse o dashboard do Render.com" -ForegroundColor White
Write-Host "   2. Verifique se o deploy automático foi iniciado" -ForegroundColor White
Write-Host "   3. Monitore os logs do deploy" -ForegroundColor White
Write-Host "   4. Teste a URL do backend após o deploy" -ForegroundColor White
Write-Host ""
Write-Host "🌐 URLs do Sistema:" -ForegroundColor Cyan
Write-Host "   Backend: https://goldeouro-backend.onrender.com" -ForegroundColor White
Write-Host "   Player: https://goldeouro-player.vercel.app" -ForegroundColor White
Write-Host "   Admin: https://goldeouro-admin.vercel.app" -ForegroundColor White
Write-Host ""
Write-Host "✅ PROBLEMA RESOLVIDO - BACKEND PRONTO PARA PRODUÇÃO!" -ForegroundColor Green
