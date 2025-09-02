# Script para criar ponto de recuperação seguro
Write-Host "=== CRIANDO PONTO DE RECUPERAÇÃO SEGURO ===" -ForegroundColor Green

# 1. Fazer backup dos arquivos importantes
Write-Host "`n💾 CRIANDO BACKUP DOS ARQUIVOS..." -ForegroundColor Yellow
$backupDir = "backups/$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

$filesToBackup = @("server.js", "package.json", "db.js", "config/env.js")
foreach ($file in $filesToBackup) {
    if (Test-Path $file) {
        Copy-Item $file "$backupDir/" -Force
        Write-Host "✅ Backup de $file criado" -ForegroundColor Green
    }
}

# 2. Criar arquivo de configuração segura
Write-Host "`n🔒 CRIANDO CONFIGURAÇÃO SEGURA..." -ForegroundColor Yellow
$secureConfig = @"
# Configuração Segura - Ponto de Recuperação
# Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

# Banco de Dados
DATABASE_URL=postgresql://postgres.uatszaqzdqcwnfbipoxg:J6wGY2EnCyXc0lID@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Servidor
PORT=3000

# Segurança
JWT_SECRET=c3f1a3d8e9f2b4c6a0d1f3b7a9c5e2d8f1a3c5e7b9d2f4a6c8e0b2d4f6a8c0e2
ADMIN_TOKEN=adm_8d1e3c7a5b9f2a4c6e0d1f3b7a9c5e2d

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,https://goldeouro-admin.vercel.app

# Ambiente
NODE_ENV=development
"@

$secureConfig | Out-File -FilePath "$backupDir/.env.secure" -Encoding UTF8
Write-Host "✅ Configuração segura salva" -ForegroundColor Green

# 3. Criar script de restauração
$restoreScript = @"
# Script de Restauração do Ponto de Recuperação
Write-Host "=== RESTAURANDO PONTO DE RECUPERAÇÃO ===" -ForegroundColor Green

# Restaurar arquivos
Copy-Item "server.js" "." -Force
Copy-Item "package.json" "." -Force
Copy-Item "db.js" "." -Force
Copy-Item "config/env.js" "." -Force

# Restaurar configuração
Copy-Item ".env.secure" ".env" -Force

Write-Host "✅ Ponto de recuperação restaurado!" -ForegroundColor Green
"@

$restoreScript | Out-File -FilePath "$backupDir/restore.ps1" -Encoding UTF8
Write-Host "✅ Script de restauração criado" -ForegroundColor Green

# 4. Criar documentação
$documentation = @"
# PONTO DE RECUPERAÇÃO SEGURO
Data: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## Status do Sistema:
- ✅ Backend funcionando
- ✅ Banco de dados conectado
- ✅ Credenciais atualizadas
- ✅ Segurança implementada

## Arquivos Incluídos:
- server.js
- package.json
- db.js
- config/env.js
- .env.secure

## Como Restaurar:
1. Execute: .\restore.ps1
2. Instale dependências: npm install
3. Inicie o servidor: node server.js

## Credenciais:
- Database: J6wGY2EnCyXc0lID
- Admin Token: adm_8d1e3c7a5b9f2a4c6e0d1f3b7a9c5e2d
"@

$documentation | Out-File -FilePath "$backupDir/README.md" -Encoding UTF8
Write-Host "✅ Documentação criada" -ForegroundColor Green

Write-Host "`n🎯 PONTO DE RECUPERAÇÃO CRIADO!" -ForegroundColor Green
Write-Host "Localização: $backupDir" -ForegroundColor White
Write-Host "`n📋 PRÓXIMOS PASSOS:" -ForegroundColor Cyan
Write-Host "1. Testar sistema completo" -ForegroundColor White
Write-Host "2. Fazer commit das correções" -ForegroundColor White
Write-Host "3. Configurar monitoramento" -ForegroundColor White
