# CIRURGIA CONFIG PRODUÇÃO — AUTH PAINEL ADMIN

**Data:** 2026-05-06  
**Projeto:** `goldeouro-admin`  
**Escopo:** correção de URL base de API e CSP de produção para login JWT real

---

## 1) Causa raiz do `%20`

A URL de API era consumida sem normalização de string.  
Quando variável de ambiente chegava com espaço no final, a concatenação produzia `%20/api/auth/login`.

Além disso, havia bloqueio de CSP no `index.html` gerado em produção, com `connect-src` sem o domínio `goldeouro-backend-v2.fly.dev`.

---

## 2) Correções aplicadas

### 2.1 Saneamento e fallback seguro da API base URL

Arquivo:

- `goldeouro-admin/src/config/env.js`

Mudanças:

- `DEFAULT_API_URL = https://goldeouro-backend-v2.fly.dev`
- `normalizeApiBaseUrl(rawUrl)` com:
  - `trim()` (remove espaços)
  - remoção de barras finais
  - fallback para default quando vazio
  - fallback para default quando host não corresponde ao backend v2 esperado

### 2.2 Uso centralizado da URL normalizada

Arquivos:

- `goldeouro-admin/src/pages/Login.jsx`
- `goldeouro-admin/src/js/api.js`
- `goldeouro-admin/src/services/api.js`

Mudança:

- troca de uso direto de `import.meta.env.VITE_API_URL` por `getApiUrl()`

### 2.3 CSP de produção

Arquivos:

- `goldeouro-admin/vercel.json`
- `goldeouro-admin/index.html`

Mudanças em `connect-src`:

- inclusão explícita de `https://goldeouro-backend-v2.fly.dev`
- manutenção de `https://goldeouro-backend.fly.dev` para compatibilidade

---

## 3) Build e deploy

### Build local

- comando: `npm run build`
- resultado: **PASSOU**

### Deploy Vercel produção

- comando: `vercel --prod --yes`
- deployment URL final: `https://goldeouro-admin-i4xrblstb-goldeouro-admins-projects.vercel.app`
- inspect: `https://vercel.com/goldeouro-admins-projects/goldeouro-admin/4KPpjxX1r6w4ysCZhkpBWZDpFYvD`

---

## 4) Validação funcional pós-deploy

Ambiente validado:

- `https://admin.goldeouro.lol/login`
- `https://admin.goldeouro.lol/painel`

Resultados:

- `/login` carrega: **SIM**
- `/painel` sem token redireciona para `/login`: **SIM**
- login `admin@goldeouro.lol` / `admin123`: **PASSOU**
- redirecionamento pós-login para `/painel`: **SIM**
- token JWT salvo em `localStorage`: **SIM**
- logout remove token: **SIM**
- acesso a `/painel` após logout redireciona para `/login`: **SIM**

Observação:

- houve `404` em endpoint de estatísticas (fallback de dados vazios), sem impacto no fluxo de autenticação.

---

## 5) Conclusão

A cirurgia de configuração de produção foi concluída com sucesso.  
O fluxo de autenticação JWT real do painel admin está operacional em produção.

**Decisão:** **GO** para próxima etapa controlada.

---

**Fim do relatório.**
