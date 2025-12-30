# 🔍 VERIFICAÇÃO DE URL DO BACKEND - VERCEL
# Data: 17/11/2025

**Status:** ⚠️ **INCONSISTÊNCIA DETECTADA**

---

## ⚠️ PROBLEMA IDENTIFICADO

### Inconsistência de URLs do Backend:

**goldeouro-admin:**
- `vercel.json`: `https://goldeouro-backend.fly.dev`
- `vite.config.js`: `https://goldeouro-backend.fly.dev`

**goldeouro-player:**
- `vercel.json`: `https://goldeouro-backend-v2.fly.dev`
- `player-dist-deploy/vercel.json`: `https://goldeouro-backend-v2.fly.dev`

**README-VERCEL.md:**
- Menciona: `https://goldeouro-backend-v2.fly.dev`

---

## 🔍 ANÁLISE

### Possíveis Cenários:

1. **Backend Migrado:**
   - `goldeouro-backend.fly.dev` → antigo (descontinuado)
   - `goldeouro-backend-v2.fly.dev` → novo (atual)

2. **Backends Diferentes:**
   - `goldeouro-backend.fly.dev` → produção atual
   - `goldeouro-backend-v2.fly.dev` → staging/teste

3. **Configuração Incorreta:**
   - Um dos projetos está usando URL errada

---

## ✅ RECOMENDAÇÃO

### Verificar Qual URL Está Ativa:

1. **Testar URLs:**
   ```bash
   curl https://goldeouro-backend.fly.dev/health
   curl https://goldeouro-backend-v2.fly.dev/health
   ```

2. **Verificar no Fly.io:**
   - Acessar dashboard do Fly.io
   - Verificar qual app está ativo
   - Confirmar URL de produção

3. **Padronizar:**
   - Usar a mesma URL em todos os projetos
   - Atualizar `vercel.json` se necessário

---

## 🎯 AÇÃO NECESSÁRIA

### Para goldeouro-admin:

**Se o backend correto é `goldeouro-backend-v2.fly.dev`:**

Atualizar `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://goldeouro-backend-v2.fly.dev/api/$1"
    }
  ]
}
```

Atualizar `vite.config.js`:
```javascript
proxy: {
  '/api': {
    target: 'https://goldeouro-backend-v2.fly.dev',
    changeOrigin: true,
    secure: true
  }
}
```

---

**Status:** ⚠️ **VERIFICAR QUAL URL ESTÁ CORRETA**

**Próxima Ação:** Confirmar URL do backend em produção e padronizar

