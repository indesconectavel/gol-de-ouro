# Gol de Ouro Backend - Rollback Automatizado
# ===========================================
# 
# INSTRUÇÕES:
# 1. Execute: .\scripts\rollback-backend.ps1
# 2. Escolha a versão para rollback
# 3. Confirme a operação
# 
# PLATAFORMAS SUPORTADAS:
# - Render (via dashboard)
# - Railway (via CLI)

param(
    [string]$Platform = "render",
    [string]$Version = "",
    [switch]$Force
)

# Cores para output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

Write-Host "$Blue🔄 Gol de Ouro Backend - Rollback Automatizado$Reset"
Write-Host "$Yellow📍 Plataforma: $Platform$Reset"

# Rollback baseado na plataforma
switch ($Platform.ToLower()) {
    "render" {
        Write-Host "$Blue🔄 Rollback no Render...$Reset"
        Write-Host "$Yellow📋 Passos:$Reset"
        Write-Host "   1. Acesse: https://dashboard.render.com"
        Write-Host "   2. Selecione seu serviço goldeouro-backend"
        Write-Host "   3. Vá para a aba 'Deploys'"
        Write-Host "   4. Clique no deploy anterior estável"
        Write-Host "   5. Clique em 'Rollback to this deploy'"
        Write-Host "   6. Confirme a operação"
        Write-Host ""
        Write-Host "$Blue💡 Alternativa via CLI (se disponível):$Reset"
        Write-Host "   render rollback goldeouro-backend --deploy-id <ID>"
    }
    
    "railway" {
        Write-Host "$Blue🔄 Rollback no Railway...$Reset"
        Write-Host "$Yellow📋 Passos:$Reset"
        Write-Host "   1. Listar deploys: railway service logs"
        Write-Host "   2. Rollback: railway rollback <deploy-id>"
        Write-Host "   3. Verificar status: railway status"
        Write-Host ""
        Write-Host "$Blue💡 Comandos completos:$Reset"
        Write-Host "   railway service logs"
        Write-Host "   railway rollback <deploy-id>"
    }
    
    default {
        Write-Host "$Red❌ Plataforma não suportada: $Platform$Reset"
        Write-Host "$Yellow💡 Use: render ou railway$Reset"
        exit 1
    }
}

Write-Host ""
Write-Host "$Blue🔍 Verificações pós-rollback:$Reset"
Write-Host "   1. Verificar se o serviço está rodando"
Write-Host "   2. Testar healthcheck: /health"
Write-Host "   3. Verificar logs de erro"
Write-Host "   4. Testar funcionalidades críticas"

Write-Host ""
Write-Host "$Green🎉 Rollback configurado! Siga as instruções acima$Reset"
Write-Host "$Blue💡 Dica: Sempre teste em staging antes de produção$Reset"
