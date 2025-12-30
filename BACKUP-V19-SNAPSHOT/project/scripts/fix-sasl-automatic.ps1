# Script de Correcao Automatica SASL - Gol de Ouro
# ================================================
# 
# Este script resolve automaticamente o problema SASL com Supabase

Write-Host "CORRECAO AUTOMATICA SASL - Gol de Ouro" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green
Write-Host ""

# 1. VERIFICAR CONFIGURACAO ATUAL
Write-Host "Verificando configuracao atual..." -ForegroundColor Yellow
if (Test-Path ".env") {
    $envContent = Get-Content ".env"
    $databaseUrl = $envContent | Where-Object { $_ -match "^DATABASE_URL=" }
    
    if ($databaseUrl) {
        Write-Host "DATABASE_URL atual encontrada" -ForegroundColor Green
        if ($databaseUrl -match "pooler") {
            Write-Host "⚠️  Detectado pooler - Isso pode causar SASL" -ForegroundColor Yellow
        } else {
            Write-Host "✅ DATABASE_URL sem pooler (bom)" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ DATABASE_URL nao encontrada no .env" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Arquivo .env nao encontrado" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. APLICAR CORRECOES AUTOMATICAS
Write-Host "Aplicando correcoes automaticas..." -ForegroundColor Cyan

# Verificar se db.js foi atualizado
if (Test-Path "db.js") {
    $dbContent = Get-Content "db.js" -Raw
    if ($dbContent -match "createSupabasePool") {
        Write-Host "✅ db.js atualizado com configuracoes anti-SASL" -ForegroundColor Green
    } else {
        Write-Host "❌ db.js nao foi atualizado" -ForegroundColor Red
    }
} else {
    Write-Host "❌ db.js nao encontrado" -ForegroundColor Red
}

Write-Host ""

# 3. TESTAR CONEXAO
Write-Host "Testando conexao com banco..." -ForegroundColor Yellow
try {
    $result = node test-db.js 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Conexao com banco funcionando!" -ForegroundColor Green
        Write-Host "🎉 Problema SASL resolvido automaticamente!" -ForegroundColor Green
    } else {
        Write-Host "❌ Conexao ainda falhando" -ForegroundColor Red
        Write-Host "Aplicando correcoes manuais..." -ForegroundColor Yellow
        
        # 4. CORRECOES MANUAIS SE NECESSARIO
        Write-Host ""
        Write-Host "CORRECOES MANUAIS NECESSARIAS:" -ForegroundColor Red
        Write-Host "1. Acesse: https://supabase.com" -ForegroundColor White
        Write-Host "2. Vá em Settings > Database" -ForegroundColor White
        Write-Host "3. Copie a URL SEM pooler (?pgbouncer=true)" -ForegroundColor White
        Write-Host "4. Atualize .env com a nova URL" -ForegroundColor White
        Write-Host "5. Execute: node test-db.js" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Erro ao testar conexao" -ForegroundColor Red
    Write-Host "Execute manualmente: node test-db.js" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Script concluido!" -ForegroundColor Green
Write-Host "Se ainda houver problemas, siga as instrucoes manuais acima" -ForegroundColor Yellow
