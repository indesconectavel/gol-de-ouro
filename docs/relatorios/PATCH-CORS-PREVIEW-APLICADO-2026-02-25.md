# Patch CORS Preview — Aplicado

**Data:** 2026-02-25  
**Arquivo alterado:** `server-fly.js`  
**Commit:** `fix(cors): allow goldeouro-player vercel previews`

---

## 1. Diff do trecho alterado

### Antes

```javascript
app.use(cors({
  origin: parseCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key']
}));
```

### Depois

```javascript
// Regex restrita: libera apenas previews do projeto goldeouro-player na Vercel (*.vercel.app)
const vercelPreviewOriginRegex = /^https:\/\/goldeouro-player(-[a-z0-9-]+)*\.vercel\.app$/;
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = parseCorsOrigins();
    if (allowed.includes(origin)) return callback(null, true);
    if (vercelPreviewOriginRegex.test(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key']
}));
```

---

## 2. Regex usada

- **Padrão:** `^https:\/\/goldeouro-player(-[a-z0-9-]+)*\.vercel\.app$`
- **Objetivo:** Permitir apenas origens de preview do projeto **goldeouro-player** na Vercel (ex.: `https://goldeouro-player-abc123xyz.vercel.app`, `https://goldeouro-player-git-main-scope.vercel.app`).
- **Variável no código:** `vercelPreviewOriginRegex`

---

## 3. Impacto esperado

| Cenário | Esperado |
|---------|----------|
| **Preview Vercel (goldeouro-player-*.vercel.app)** | Preflight OPTIONS passa; header `Access-Control-Allow-Origin` reflete a origem; login e demais chamadas à API funcionam. |
| **Produção (goldeouro.lol, www.goldeouro.lol)** | Inalterado; origens continuam na lista de `parseCorsOrigins()` (ou CORS_ORIGIN); comportamento idêntico ao anterior. |
| **Admin (admin.goldeouro.lol)** | Inalterado; origem na lista atual; sem regressão. |

---

## 4. Checklist para validação

Após deploy do backend no Fly.io:

- [ ] **curl OPTIONS preview:**  
  `curl -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://goldeouro-player-<ID>.vercel.app" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization" -v`  
  → Deve retornar `Access-Control-Allow-Origin: https://goldeouro-player-<ID>.vercel.app` e status 2xx.

- [ ] **curl OPTIONS www:**  
  `curl -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" -H "Origin: https://www.goldeouro.lol" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type,Authorization" -v`  
  → Deve retornar `Access-Control-Allow-Origin: https://www.goldeouro.lol` e status 2xx.

- [ ] **Login preview:** Abrir um preview do player na Vercel; fazer login → sem erro de CORS; POST `/api/auth/login` executado após OPTIONS.

- [ ] **Login produção:** Abrir https://www.goldeouro.lol; fazer login → sem regressão.

- [ ] **Admin:** Abrir https://admin.goldeouro.lol; login e uso da API → sem erro de CORS.

---

## 5. Rollback

1. **Reverter o commit:**  
   `git revert <SHA_DO_COMMIT> --no-edit`

2. **Redeploy no Fly.io:**  
   Fazer deploy do branch com o revert (ex.: `fly deploy` para o app `goldeouro-backend-v2`).

3. **Validar:**  
   - OPTIONS com `Origin: https://goldeouro-player-xxx.vercel.app` deve voltar a **não** enviar `Access-Control-Allow-Origin`.  
   - OPTIONS com `Origin: https://www.goldeouro.lol` deve continuar retornando `Access-Control-Allow-Origin: https://www.goldeouro.lol`.
