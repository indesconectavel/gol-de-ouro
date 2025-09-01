# Script para Levantar Servicos Locais - Gol de Ouro
# ===================================================
# 
# Este script levanta o backend e admin localmente
# Execute quando precisar subir os servicos

Write-Host "LEVANTANDO SERVICOS LOCAIS - Gol de Ouro" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# 1. VERIFICAR PROCESSOS NODE (idempotente)
Write-Host "Verificando processos Node.js..." -ForegroundColor Yellow
try {
    $nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
    if ($nodeProcesses) {
        Write-Host "Processos Node.js encontrados - finalizando..." -ForegroundColor Yellow
        $nodeProcesses | Stop-Process -Force
        Start-Sleep -Seconds 2
        Write-Host "Processos finalizados" -ForegroundColor Green
    } else {
        Write-Host "Nenhum processo Node.js encontrado (sucesso)" -ForegroundColor Green
    }
} catch {
    Write-Host "Nao foi possivel verificar processos Node.js (continuando)" -ForegroundColor Gray
}

# 2. VERIFICAR PORTAS (idempotente)
Write-Host ""
Write-Host "Verificando portas..." -ForegroundColor Yellow

# Porta 3000 (Backend)
try {
    $port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($port3000) {
        Write-Host "Porta 3000 ocupada - sera liberada automaticamente" -ForegroundColor Yellow
    } else {
        Write-Host "Porta 3000 livre (sucesso)" -ForegroundColor Green
    }
} catch {
    Write-Host "Porta 3000 verificada (continuando)" -ForegroundColor Gray
}

# Porta 5173 (Admin)
try {
    $port5173 = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
    if ($port5173) {
        Write-Host "Porta 5173 ocupada - sera liberada automaticamente" -ForegroundColor Yellow
    } else {
        Write-Host "Porta 5173 livre (sucesso)" -ForegroundColor Green
    }
} catch {
    Write-Host "Porta 5173 verificada (continuando)" -ForegroundColor Gray
}

# Porta 5174 (Admin fallback)
try {
    $port5174 = Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue
    if ($port5174) {
        Write-Host "Porta 5174 ocupada - sera liberada automaticamente" -ForegroundColor Yellow
    } else {
        Write-Host "Porta 5174 livre (sucesso)" -ForegroundColor Green
    }
} catch {
    Write-Host "Porta 5174 verificada (continuando)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Aguardando 3 segundos para portas se liberarem..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# 3. SUBIR BACKEND
Write-Host ""
Write-Host "Subindo Backend..." -ForegroundColor Green
Write-Host "Execute em um novo terminal:" -ForegroundColor Yellow
Write-Host "   cd goldeouro-backend" -ForegroundColor Cyan
Write-Host "   npm install" -ForegroundColor Cyan
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""

# 4. SUBIR ADMIN
Write-Host "Subindo Admin..." -ForegroundColor Green
Write-Host "Execute em outro terminal:" -ForegroundColor Yellow
Write-Host "   cd goldeouro-admin" -ForegroundColor Cyan
Write-Host "   npm install" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor Cyan
Write-Host ""

# 5. VERIFICAR STATUS
Write-Host "Apos subir os servicos, verifique:" -ForegroundColor Cyan
Write-Host "   Backend: http://localhost:3000/health" -ForegroundColor White
Write-Host "   Admin: http://localhost:5173 (ou 5174)" -ForegroundColor White
Write-Host ""

Write-Host "Script concluido!" -ForegroundColor Green
Write-Host "Execute os comandos acima em terminais separados" -ForegroundColor Yellow
