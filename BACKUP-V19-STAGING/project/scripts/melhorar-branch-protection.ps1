# 🔒 MELHORAR BRANCH PROTECTION - GOL DE OURO
# ============================================
# Data: 15/11/2025
# Status: Script para melhorar branch protection

Write-Host "🔒 Melhorando Branch Protection..." -ForegroundColor Cyan

# Configurar required status checks e PR reviews
$body = @{
    required_status_checks = @{
        strict = $true
        contexts = @("CI", "Testes Automatizados", "Segurança e Qualidade")
    }
    enforce_admins = $true
    required_pull_request_reviews = @{
        required_approving_review_count = 1
        dismiss_stale_reviews = $true
        require_code_owner_reviews = $false
    }
    restrictions = $null
    allow_force_pushes = $false
    allow_deletions = $false
    required_linear_history = $false
} | ConvertTo-Json -Depth 10

gh api repos/indesconectavel/gol-de-ouro/branches/main/protection --method PATCH --input - <<< $body

Write-Host "✅ Branch Protection melhorada!" -ForegroundColor Green

