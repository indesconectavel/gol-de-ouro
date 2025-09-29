# Guia de Deploy Vercel - Gol de Ouro v1.1.1

## 📋 VARIÁVEIS DE AMBIENTE

### Player Mode (goldeouro-player)
```bash
# Configurar variáveis de ambiente
vercel env add VITE_API_URL
# Valor: https://goldeouro-backend-v2.fly.dev

vercel env add VITE_ENV
# Valor: production

vercel env add VITE_MP_PUBLIC_KEY
# Valor: <public_key_prod> (substituir pela chave pública do Mercado Pago)
```

### Admin Panel (goldeouro-admin)
```bash
# Configurar variáveis de ambiente
vercel env add VITE_API_URL
# Valor: https://goldeouro-backend-v2.fly.dev

vercel env add VITE_ENV
# Valor: production

vercel env add VITE_ADMIN_TOKEN
# Valor: admin-prod-token-2025
```

## 🚀 DEPLOY

### Player Mode
```bash
cd goldeouro-player
vercel --prod
```

### Admin Panel
```bash
cd goldeouro-admin
vercel --prod
```

## ✅ VERIFICAÇÕES PÓS-DEPLOY

1. **Acessar URLs de produção:**
   - Player: `https://goldeouro-player.vercel.app`
   - Admin: `https://goldeouro-admin.vercel.app`

2. **Verificar SSL:**
   - Confirmar "Configured" no painel Vercel
   - Testar HTTPS em ambas as URLs

3. **Verificar variáveis:**
   - Player: `console.log(import.meta.env.VITE_API_URL)`
   - Admin: `console.log(import.meta.env.VITE_API_URL)`

## 🔧 TROUBLESHOOTING

### Erro de CORS
- Verificar se `VITE_API_URL` aponta para o backend correto
- Confirmar que o backend tem CORS configurado para os domínios

### Erro 404
- Verificar se `vercel.json` tem SPA fallback configurado
- Confirmar que as rotas estão corretas

### Erro de variáveis
- Verificar se as variáveis foram adicionadas no ambiente correto
- Confirmar que o deploy foi feito com `--prod`
