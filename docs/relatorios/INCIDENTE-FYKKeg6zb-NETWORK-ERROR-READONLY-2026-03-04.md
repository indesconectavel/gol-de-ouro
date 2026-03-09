# Incidente — FyKKeg6zb "Network Error" no login (READ-ONLY)

**Data:** 2026-03-04  
**Modo:** Somente leitura. Nenhuma alteração de código, env ou deploy.  
**Objetivo:** Explicar com evidência por que o FyKKeg6zb dá "Network Error" no login e qual backend URL o build antigo está usando.

---

## 1) URL do deployment FyKKeg6zb

O ID **FyKKeg6zb** é o identificador de deployment no painel Vercel. O formato típico de URL de deployment é:

`https://goldeouro-player-<DEPLOY_ID>-goldeouro-admins-projects.vercel.app`

**URL testada:**  
`https://goldeouro-player-FyKKeg6zb-goldeouro-admins-projects.vercel.app`

**Resultado:**  
`curl -s -o NUL -w "%{http_code}" "https://goldeouro-player-FyKKeg6zb-goldeouro-admins-projects.vercel.app/"` → **404**

Conclusão: o deployment **FyKKeg6zb não está acessível** (não encontrado ou expirado no contexto atual). Não foi possível obter HTML nem JS diretamente dessa URL para inspecionar o bundle.

---

## 2) Coleta de HTML e assets (quando a URL existe)

Para um deployment acessível, os comandos seriam:

```bash
curl -s https://<FYK_URL>/ | head -n 120
curl -s https://<FYK_URL>/ | grep -iE "src=|href=" | head -n 60
```

**No caso do FyKKeg6zb:** como a URL retorna 404, **não foi possível executar essa coleta**. A inferência do backend e do comportamento de login foi feita a partir do **código-fonte** do player e da configuração do backend (seções 3–5).

Documentação anterior (POST-ROLLBACK-VERCEL-FyKKeg6zb) indica que o build associado ao FyKKeg6zb usava assets **index-qIGutT6K.js** e **index-lDOJDUAS.css** (Last-Modified 16 Jan 2026). Esse build foi servido em produção em www.goldeouro.lol na época; o mesmo código-fonte (e mesma lógica de API) aplica-se ao que seria o “build antigo”.

---

## 3) Backend URL no código do player (evidência no repo)

O backend URL é definido no player em **build time** via `import.meta.env.VITE_BACKEND_URL` com fallback no código.

**Arquivo:** `goldeouro-player/src/config/api.js`

```javascript
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://goldeouro-backend-v2.fly.dev';
```

**Commit estável de referência (d8ceb3b – checkpoint pre-v1 stable):**  
O mesmo fallback já existia: `'https://goldeouro-backend-v2.fly.dev'`.

**Arquivo:** `goldeouro-player/src/config/environments.js`

- **production:** `API_BASE_URL: 'https://goldeouro-backend-v2.fly.dev'`
- **staging:** `API_BASE_URL: 'https://goldeouro-backend.fly.dev'`

Ou seja, no repositório **não há** uso de `goldeouro-backend.fly.dev` para produção; produção usa **goldeouro-backend-v2.fly.dev**.  
Se no build do FyKKeg6zb **não** foi definido `VITE_BACKEND_URL` no Vercel, o bundle antigo também usa **https://goldeouro-backend-v2.fly.dev** como base da API (login, profile, etc.).

**Endpoints de login (api.js):**  
- `LOGIN: '/api/auth/login'`  
- `PROFILE: '/api/user/profile'`  
(relativos à `API_BASE_URL`; não há Supabase URL no fluxo de login do player – auth é via backend.)

**Conclusão (inferida):** O build antigo (FyKKeg6zb) muito provavelmente chama o backend em **https://goldeouro-backend-v2.fly.dev** (mesmo que a página seja aberta pela URL do deployment, e.g. `...FyKKeg6zb...vercel.app`).

---

## 4) Teste de rede para o backend (somente leitura)

### Backend que o build antigo usa (inferido: goldeouro-backend-v2.fly.dev)

**Health:**

```text
curl -I https://goldeouro-backend-v2.fly.dev/health
→ HTTP/1.1 200 OK
  access-control-allow-credentials: true
  server: Fly/...
```

**OPTIONS (preflight) para login com origem de produção (www.goldeouro.lol):**

```text
curl -I -X OPTIONS -H "Origin: https://www.goldeouro.lol" "https://goldeouro-backend-v2.fly.dev/api/auth/login"
→ HTTP/1.1 204 No Content
  access-control-allow-origin: https://www.goldeouro.lol
  vary: Origin
  access-control-allow-credentials: true
  access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS
  access-control-allow-headers: Content-Type,Authorization,X-Requested-With,X-Idempotency-Key
```

**OPTIONS com origem de deployment preview (ex.: candidato fz51cowbf):**

```text
curl -I -X OPTIONS -H "Origin: https://goldeouro-player-fz51cowbf-goldeouro-admins-projects.vercel.app" "https://goldeouro-backend-v2.fly.dev/api/auth/login"
→ HTTP/1.1 204 No Content
  vary: Origin
  access-control-allow-credentials: true
  access-control-allow-methods: GET,POST,PUT,DELETE,OPTIONS
  access-control-allow-headers: Content-Type,Authorization,X-Requested-With,X-Idempotency-Key
  (sem access-control-allow-origin)
```

Ou seja: para origem **www.goldeouro.lol** o backend devolve `Access-Control-Allow-Origin`; para origem **goldeouro-player-xxx.vercel.app** **não** devolve `Access-Control-Allow-Origin` (origem não permitida).

**Backend antigo (goldeouro-backend.fly.dev, sem -v2):**

```text
curl -I https://goldeouro-backend.fly.dev/health
→ (falha de conexão; exit code 6)
```

O host **goldeouro-backend.fly.dev** não responde (DNS/conexão), portanto não está em uso como backend de produção.

---

## 5) Configuração CORS no backend (evidência no repo)

**Arquivo:** `server-fly.js`

```javascript
const parseCorsOrigins = () => {
  const csv = process.env.CORS_ORIGIN || '';
  const list = csv.split(',').map(s => s.trim()).filter(Boolean);
  return list.length > 0 ? list : [
    'https://goldeouro.lol',
    'https://www.goldeouro.lol',
    'https://admin.goldeouro.lol'
  ];
};
app.use(cors({ origin: parseCorsOrigins(), credentials: true, ... }));
```

Por padrão, **apenas** essas três origens são permitidas. Nenhum domínio `*.vercel.app` está na lista. Se no Fly **não** houver `CORS_ORIGIN` incluindo a URL do deployment (ex.: `https://goldeouro-player-FyKKeg6zb-goldeouro-admins-projects.vercel.app`), o backend **não** envia `Access-Control-Allow-Origin` para essa origem e o browser bloqueia a resposta → **Network Error** (CORS).

---

## 6) Conclusão

### Qual URL de backend o FyKKeg6zb está chamando?

- **Inferência (código + histórico):** O build do player (incluindo o que corresponderia ao FyKKeg6zb) usa **https://goldeouro-backend-v2.fly.dev** como base da API, salvo se naquele build foi definido `VITE_BACKEND_URL` no Vercel para outro valor (não há evidência disso nos docs/relatórios).
- Não foi possível inspecionar o JS do FyKKeg6zb porque a URL do deployment retorna **404**.

### Por que isso gera "Network Error" no login?

- **Causa mais provável: CORS.**  
  Se o usuário abre o app pela **URL do deployment** (ex.: `https://goldeouro-player-FyKKeg6zb-...vercel.app` ou qualquer `*.vercel.app`), a origem da requisição é esse domínio. O backend (goldeouro-backend-v2.fly.dev) só permite, por padrão, `goldeouro.lol`, `www.goldeouro.lol` e `admin.goldeouro.lol`. Para origens `*.vercel.app` o backend **não** envia `Access-Control-Allow-Origin` → o browser bloqueia a resposta do login → o cliente exibe **Network Error** (ou erro de CORS).
- **Outras possibilidades (secundárias):**  
  - Se em algum momento o build tivesse usado outro backend (ex.: goldeouro-backend.fly.dev), esse host **não responde** (falha de conexão), o que também geraria Network Error.  
  - A própria URL do FyKKeg6zb retorna 404, então abrir “FyKKeg6zb” hoje pode ser 404 (página não carrega) em vez de só falha no login.

### Plano mínimo para restaurar login SEM alterar /game

Objetivo: permitir que o **mesmo** build (sem redeploy do front nem mudar rota/UX do /game) consiga fazer login.

1. **Incluir a origem do deployment na lista CORS do backend (recomendado)**  
   - No **Fly**, definir a variável de ambiente **CORS_ORIGIN** para incluir, além dos atuais, a(s) URL(s) de onde o app é servido quando for “FyKKeg6zb” (ex.: se for re-promovido e acessado como `https://goldeouro-player-FyKKeg6zb-...vercel.app`, adicionar essa origem; ou um padrão seguro como `https://goldeouro-player-.vercel.app` se o backend suportar regex/origem dinâmica).  
   - **Não altera** código do player nem /game; apenas lista de origens no backend.  
   - Pré-requisito: que o deployment FyKKeg6zb volte a estar acessível (re-promoção no Vercel, se ainda existir no projeto).

2. **Alternativa: servir o app apenas por domínios já permitidos**  
   - Fazer o usuário acessar o **mesmo** build via **www.goldeouro.lol** (ou goldeouro.lol) em vez da URL `...FyKKeg6zb...vercel.app`.  
   - Se o “Production” da Vercel for esse build, os aliases www.goldeouro.lol já apontam para ele; aí a origem é www.goldeouro.lol e o CORS atual já permite. Não exige alterar env nem código; exige que produção seja esse build e que o usuário use o domínio customizado.

3. **Não recomendado para “sem alterar /game”:**  
   - Rebuild do player com nova env (ex.: outra backend URL) altera o build e pode afetar /game; foge do escopo “restaurar login sem alterar /game”.

**Resumo:** O FyKKeg6zb (ou qualquer app servido em `*.vercel.app`) chama **goldeouro-backend-v2.fly.dev**; o “Network Error” no login vem muito provavelmente de **CORS** (origem do deployment não permitida). Restaurar login sem mudar /game: **incluir a origem do deployment em CORS_ORIGIN no backend** ou **usar apenas www.goldeouro.lol** para acessar o mesmo build.

---

*Relatório READ-ONLY. Nenhuma alteração de código, env ou deploy foi executada.*
