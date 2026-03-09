# Diagnóstico CORS — Login falha no Vercel Preview

**Data:** 2026-02-25  
**Modo:** READ-ONLY (nenhuma alteração aplicada)  
**Objetivo:** Diagnosticar por que o login falha no deploy preview do Vercel com erro CORS no preflight para `/api/auth/login`.

---

## 1) Onde o CORS é configurado

| Item | Valor |
|------|-------|
| **Arquivo** | `server-fly.js` |
| **Linhas** | 235–251 |
| **Middleware** | `cors` (pacote npm `cors@^2.8.5`) |

### Trecho relevante

```235:251:server-fly.js
// CORS configurado
const parseCorsOrigins = () => {
  const csv = process.env.CORS_ORIGIN || '';
  const list = csv.split(',').map(s => s.trim()).filter(Boolean);
  return list.length > 0 ? list : [
    'https://goldeouro.lol',
    'https://www.goldeouro.lol',
    'https://admin.goldeouro.lol'
  ];
};

app.use(cors({
  origin: parseCorsOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key']
}));
```

**Observação:** Não há configuração CORS em nginx, Fly proxy ou outros pontos. O CORS é tratado apenas pelo middleware Express.

---

## 2) Lógica atual de origin e headers

### 2.1 Origens permitidas

- **Fonte:** variável de ambiente `CORS_ORIGIN` (CSV) ou lista padrão.
- **Padrão (quando `CORS_ORIGIN` vazio):**
  - `https://goldeouro.lol`
  - `https://www.goldeouro.lol`
  - `https://admin.goldeouro.lol`
- **Se `CORS_ORIGIN` definido:** usa exatamente as origens do CSV (split por vírgula, trim, sem vazios).

### 2.2 Headers e métodos

- **credentials:** `true`
- **methods:** `['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']`
- **allowedHeaders:** `['Content-Type', 'Authorization', 'X-Requested-With', 'X-Idempotency-Key']`

### 2.3 Comportamento do pacote `cors`

- Com `origin` como array, o pacote `cors` faz **match exato** da origem.
- Se `req.headers.origin` não estiver na lista, retorna `false` e **não envia** `Access-Control-Allow-Origin`.
- O preflight (OPTIONS) é tratado pelo próprio middleware; se a origem não for permitida, os headers CORS não são adicionados e o navegador bloqueia a requisição.

---

## 3) Por que o preflight falha

### 3.1 Origem do preview Vercel

O frontend em preview usa URLs como:

- `https://goldeouro-player-<random-9-chars>-<scope>.vercel.app` (por commit)
- `https://goldeouro-player-git-<branch>-<scope>.vercel.app` (por branch)

Exemplo típico: `https://goldeouro-player-abc123xyz-goldeouro-admins-projects.vercel.app`

### 3.2 Causa raiz

Essas origens **não estão** na whitelist atual:

- Lista padrão: apenas `goldeouro.lol`, `www.goldeouro.lol`, `admin.goldeouro.lol`
- `CORS_ORIGIN` no Fly.io provavelmente repete ou estende essa lista, mas **não inclui** `*.vercel.app`

Resultado:

1. O navegador envia OPTIONS (preflight) com `Origin: https://goldeouro-player-xxx.vercel.app`
2. O middleware `cors` compara com a lista; não encontra match
3. Não envia `Access-Control-Allow-Origin`
4. O navegador bloqueia e exibe: *"No 'Access-Control-Allow-Origin' header... preflight"*
5. O POST real de login nunca é enviado

---

## 4) Proposta de patch mínimo (descrição, sem aplicar)

### 4.1 Opção A — Regex/wildcard para Vercel (recomendada)

**Objetivo:** Permitir apenas previews do projeto `goldeouro-player` em `*.vercel.app`, sem liberar qualquer origem.

**Alteração em `parseCorsOrigins` / `cors`:**

- Manter a lista atual (produção).
- Adicionar uma função de validação para origens Vercel:
  - Aceitar `https://goldeouro-player-*.vercel.app` (qualquer subdomínio)
  - Ou regex: `^https://goldeouro-player(-[a-z0-9-]+)?(-[a-z0-9-]+)?\.vercel\.app$`

**Implementação sugerida (conceitual):**

```javascript
// Em parseCorsOrigins ou na opção origin do cors:
const vercelPreviewRegex = /^https:\/\/goldeouro-player(-[a-z0-9-]+)*\.vercel\.app$/;
const allowed = parseCorsOrigins();
// origin pode ser string (lista) ou função (req, cb) => { ... }
origin: (origin, cb) => {
  if (!origin) return cb(null, true); // same-origin, tooling
  if (allowed.includes(origin)) return cb(null, true);
  if (vercelPreviewRegex.test(origin)) return cb(null, true);
  return cb(null, false);
}
```

### 4.2 Opção B — Variável de ambiente

**Obter:** Lista de origens permitidas via `CORS_ORIGIN` (incluindo previews).

**No Fly.io (secrets):**

```
CORS_ORIGIN=https://goldeouro.lol,https://www.goldeouro.lol,https://admin.goldeouro.lol,https://goldeouro-player-*.vercel.app
```

**Problema:** O pacote `cors` não trata `*` em subdomínios. Seria preciso implementar lógica customizada (como na Opção A) para interpretar esse padrão.

### 4.3 Opção C — Permitir todo `*.vercel.app` (não recomendada)

- Aceitar qualquer `https://*.vercel.app`.
- Mais simples, mas menos seguro (qualquer projeto Vercel poderia chamar a API).

---

## 5) Checklist de validação pós-fix

### 5.1 Curl — preflight OPTIONS

```bash
# Substituir ORIGIN_PREVIEW pela URL real do preview (ex.: https://goldeouro-player-abc123.vercel.app)
curl -X OPTIONS "https://goldeouro-backend-v2.fly.dev/api/auth/login" \
  -H "Origin: ORIGIN_PREVIEW" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization" \
  -v
```

**Esperado:**

- Status `204` ou `200`
- Header `Access-Control-Allow-Origin: <ORIGIN_PREVIEW>` (mesmo valor do Origin)
- Header `Access-Control-Allow-Methods` incluindo POST
- Header `Access-Control-Allow-Headers` incluindo Content-Type, Authorization
- Header `Access-Control-Allow-Credentials: true`

### 5.2 Teste real no navegador

1. Abrir o preview no Vercel (ex.: `https://goldeouro-player-xxx.vercel.app`).
2. Abrir DevTools → Network.
3. Tentar login.
4. Verificar:
   - Requisição OPTIONS para `/api/auth/login` com status 2xx e headers CORS corretos.
   - Requisição POST para `/api/auth/login` executada após o preflight.
   - Login concluído sem erro de CORS no console.

### 5.3 Produção inalterada

- Confirmar que `https://www.goldeouro.lol` e `https://goldeouro.lol` continuam funcionando normalmente.

---

## Resumo

| Item | Conclusão |
|------|-----------|
| Onde CORS é configurado | `server-fly.js` linhas 235–251, middleware `cors` |
| Lógica de origin | Lista fixa (CORS_ORIGIN ou padrão); match exato |
| Por que preflight falha | Origem do preview (`*.vercel.app`) não está na whitelist |
| Patch mínimo sugerido | Opção A: regex para `goldeouro-player-*.vercel.app` na função `origin` do `cors` |
| Validação | Curl OPTIONS + teste de login no preview + verificação em produção |
