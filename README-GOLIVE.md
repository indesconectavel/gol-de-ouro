# GO-LIVE (rápido) — Gol de Ouro v1.1.1

## 1) Vercel — variáveis & deploy

### Player
cd goldeouro-player
vercel env add VITE_API_URL production
# cole: https://goldeouro-backend-v2.fly.dev

vercel env add VITE_ENV production
# cole: production

# se o front usa a Public Key:
vercel env add VITE_MP_PUBLIC_KEY production
# cole: <SUA_PUBLIC_KEY_PROD>

vercel --prod

### Admin
cd ../goldeouro-admin
vercel env add VITE_API_URL production
# cole: https://goldeouro-backend-v2.fly.dev

vercel env add VITE_ENV production
# cole: production

vercel --prod

## 2) DNS (Vercel)
- apex `goldeouro.lol` → Vercel (nameservers da Vercel ou ANAME/ALIAS)
- `admin.goldeouro.lol` (CNAME) → `cname.vercel-dns.com`
- Verificar SSL "Configured" no Vercel (Domains)

## 3) Supabase — aplicar policies/índices
# Via psql:
psql "$env:DATABASE_URL" -f supabase/policies_v1.sql
psql "$env:DATABASE_URL" -f supabase/policies_mp_events.sql
# (ou cole o SQL no SQL Editor do Supabase)

## 4) Mercado Pago — webhook + teste
- Painel MP → Webhook: https://goldeouro-backend-v2.fly.dev/webhook/mercadopago
- Teste E2E:
set API_BASE=https://goldeouro-backend-v2.fly.dev && node scripts/mp-e2e-test.js

## 5) Smoke de Produção
powershell -ExecutionPolicy Bypass -File scripts/smoke-prod.ps1 `
  -ApiBase https://goldeouro-backend-v2.fly.dev `
  -PlayerUrl https://goldeouro.lol `
  -AdminUrl https://admin.goldeouro.lol