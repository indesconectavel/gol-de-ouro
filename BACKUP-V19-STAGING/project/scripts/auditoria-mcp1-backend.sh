#!/bin/bash
# MCP 1 — Auditoria de Backend
# Executa auditoria completa do backend em produção

BACKEND_URL="https://goldeouro-backend-v2.fly.dev"
ADMIN_TOKEN="goldeouro123"

echo "═══════════════════════════════════════════════════════════"
echo "MCP 1 — AUDITORIA DE BACKEND"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Backend URL: $BACKEND_URL"
echo "Data/Hora: $(date)"
echo ""

# 1. Health Check
echo "1️⃣  HEALTH CHECK"
echo "───────────────────────────────────────────────────────────"
response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "Status: $http_code"
echo "Response: $body"
echo ""

# 2. Meta Info
echo "2️⃣  META INFO"
echo "───────────────────────────────────────────────────────────"
response=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/meta")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "Status: $http_code"
echo "Response: $body"
echo ""

# 3. Admin Stats (com token)
echo "3️⃣  ADMIN STATS"
echo "───────────────────────────────────────────────────────────"
response=$(curl -s -w "\n%{http_code}" \
  -H "x-admin-token: $ADMIN_TOKEN" \
  "$BACKEND_URL/api/admin/stats")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
echo "Status: $http_code"
echo "Response: $body"
echo ""

# 4. Verificar rotas principais
echo "4️⃣  VERIFICAR ROTAS PRINCIPAIS"
echo "───────────────────────────────────────────────────────────"
routes=(
  "/api/auth/login"
  "/api/auth/register"
  "/api/games/shoot"
  "/api/payments/pix/criar"
  "/api/admin/stats"
)

for route in "${routes[@]}"; do
  echo "Testando: $route"
  response=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL$route")
  echo "  Status: $response"
done
echo ""

echo "═══════════════════════════════════════════════════════════"
echo "✅ AUDITORIA MCP 1 CONCLUÍDA"
echo "═══════════════════════════════════════════════════════════"

