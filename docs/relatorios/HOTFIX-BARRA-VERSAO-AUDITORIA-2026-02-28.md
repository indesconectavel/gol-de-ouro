# Hotfix barra de versão — auditoria e implementação

**Data:** 2026-02-28  
**Contexto:** Produção estável FyKKeg6zb (Vercel); Preview 97e67b2 (merge hotfix withdraw). No Preview reapareceu a “barra de versão”; objetivo: não exibir em produção, permitir em preview via feature-flag, sem alterar fluxo de saque/depósito.

---

## A) Causa raiz (com paths e trechos relevantes)

### Onde o banner é injetado

- **DOM:** Uma `<div>` fixa no topo (`fixed top-0 left-0 right-0`), classe `bg-green-600`, texto “VERSÃO ATUALIZADA … DEPLOY REALIZADO EM …”.
- **Arquivo:** `goldeouro-player/src/components/VersionBanner.jsx`.
- **Condição atual:** Nenhuma. O componente **sempre** renderiza a barra quando é montado; não há checagem de hostname, env ou localStorage.

### Onde o banner é usado

O componente é importado e renderizado em várias páginas (sempre visível quando a rota está ativa):

| Arquivo | Uso |
|--------|-----|
| `goldeouro-player/src/pages/Login.jsx` | `<VersionBanner showTime={true} />` |
| `goldeouro-player/src/pages/Register.jsx` | idem |
| `goldeouro-player/src/pages/Dashboard.jsx` | idem |
| `goldeouro-player/src/pages/Profile.jsx` | idem |
| `goldeouro-player/src/pages/Pagamentos.jsx` | idem |
| `goldeouro-player/src/pages/ForgotPassword.jsx` | 2 instâncias |
| `goldeouro-player/src/pages/ResetPassword.jsx` | 2 instâncias |

**Withdraw.jsx não usa VersionBanner** — nenhuma alteração no fluxo de saque.

### De onde vêm os dados (versão/data/hora)

- **Build:** `scripts/inject-build-info.cjs` (prebuild) gera `.env.local` com `VITE_BUILD_VERSION`, `VITE_BUILD_DATE`, `VITE_BUILD_TIME`.
- **Vite:** `vite.config.ts` lê `.env.local` e injeta via `define` no bundle, ou o app usa `import.meta.env.VITE_BUILD_*`.
- **VersionBanner.jsx** usa `import.meta.env.VITE_BUILD_VERSION` (e data/hora); fallback para props/defaults.

### Por que “reapareceu” no Preview

- No **Preview (97e67b2)** o prebuild roda na Vercel e gera `.env.local`; o build tem as variáveis de build e o componente VersionBanner sem nenhuma condição de exibição → a barra aparece.
- Em **produção (FyKKeg6zb)** o build pode ser de um commit/estado em que a barra não estava presente ou em que as variáveis não estavam definidas; ou o bundle atual de produção é antigo e não inclui o mesmo código. Com a feature-flag, produção passa a **não** exibir de forma explícita e controlada.

### Sobre operationBanner.js, force-update.js, sw-kill-global.js

- **Busca no repositório:** Não existem arquivos `operationBanner.js`, `force-update.js` ou `sw-kill-global.js` em `goldeouro-player/public/` nem referências no `index.html`.
- A barra visível que o usuário descreveu é o **VersionBanner** React. Os scripts citados no console podem ser de extensão do navegador, de outra camada (ex.: Vercel) ou de outro projeto; não foram alterados neste hotfix (foco apenas no banner).

---

## B) Correção proposta (rationale de baixo risco)

- **Opção implementada:** Feature-flag via env var.
  - **Variável:** `VITE_SHOW_VERSION_BANNER`.
  - **Comportamento:** O banner só é renderizado se `VITE_SHOW_VERSION_BANNER === "true"` (string). Qualquer outro valor ou indefinido → componente retorna `null` (não exibe nada).
- **Rationale:**
  - **Produção:** Não definir a variável (ou definir `false`) → banner não aparece; não depende de hostname no código.
  - **Preview:** Definir `VITE_SHOW_VERSION_BANNER=true` apenas nos ambientes de Preview na Vercel, se quiser exibir para auditoria.
  - **Mínima alteração:** Apenas um arquivo de componente (`VersionBanner.jsx`) + comentário em `env.example`. Nenhuma alteração em Withdraw.jsx, withdrawService.js, api.js, nem em scripts de SW/force-update.
- **Alternativa não implementada:** CSS kill-switch por hostname (ex.: esconder elemento em `www.goldeouro.lol`) — deixada como reserva; a flag por env é mais explícita e fácil de configurar por ambiente na Vercel.

---

## C) Diff completo

### Arquivos alterados

1. `goldeouro-player/src/components/VersionBanner.jsx`
2. `goldeouro-player/env.example`

### Patch (VersionBanner.jsx)

```diff
--- a/goldeouro-player/src/components/VersionBanner.jsx
+++ b/goldeouro-player/src/components/VersionBanner.jsx
@@ -1,8 +1,16 @@
 import React from 'react';
 
+// Feature-flag: exibir barra de versão apenas quando VITE_SHOW_VERSION_BANNER === "true".
+// Produção (www.goldeouro.lol): não definir ou false → banner não aparece.
+// Preview (Vercel): opcional true para auditoria.
+const SHOW_BANNER = import.meta.env.VITE_SHOW_VERSION_BANNER === 'true';
+
 const VersionBanner = ({ 
   version = "v1.2.0", 
   deployDate = "25/10/2025", 
   deployTime = "08:50",
   showTime = true,
   className = ""
 }) => {
+  if (!SHOW_BANNER) return null;
+
   // Preferir variáveis de ambiente (injetadas no build) quando disponíveis
   const envVersion = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_BUILD_VERSION || null) : null;
```

### Patch (env.example)

```diff
--- a/goldeouro-player/env.example
+++ b/goldeouro-player/env.example
@@ -33,6 +33,10 @@
 # Outras variáveis de ambiente podem ser adicionadas aqui
 # VITE_FEATURE_FLAG_X=true
+
+# Barra de versão (topo da tela): só exibe se VITE_SHOW_VERSION_BANNER=true
+# Produção: não definir ou false. Preview: opcional true para auditoria.
+# VITE_SHOW_VERSION_BANNER=false
```

---

## D) Configuração das env vars na Vercel e checklist de validação

### Passo a passo na Vercel

1. **Vercel Dashboard** → projeto **goldeouro-player** → **Settings** → **Environment Variables**.
2. **Production (www.goldeouro.lol):**
   - Garantir que **não** exista `VITE_SHOW_VERSION_BANNER` ou que o valor seja diferente de `"true"` (ex.: `false` ou vazio).
   - Recomendado: não criar a variável em Production (comportamento padrão = banner oculto).
3. **Preview:**
   - Se quiser exibir a barra em previews para auditoria: criar `VITE_SHOW_VERSION_BANNER` = `true` e aplicar apenas a **Preview**.
   - Se quiser que preview também não mostre: não definir ou definir `false` para Preview.
4. **Redeploy:** Após alterar env vars, fazer redeploy do ambiente correspondente para o build usar os novos valores (variáveis VITE_ são injetadas em tempo de build).

### Checklist de validação

| # | Ambiente | Verificação | Resultado esperado |
|---|----------|-------------|--------------------|
| 1 | **Preview** | Banner de versão (barra verde no topo) | Conforme flag: se `VITE_SHOW_VERSION_BANNER=true` → aparece; se não definido/false → não aparece. |
| 2 | **Produção** (www.goldeouro.lol) | Banner de versão | **Não aparece** (variável não definida ou ≠ "true"). |
| 3 | **Produção** | /withdraw — Network: solicitar saque | POST para `/api/withdraw/request` (ou endpoint correto de saque); **não** chamar `/api/payments/pix/criar`. |
| 4 | **Produção** | /pagamentos | Continua usando `/api/payments/pix/*` conforme fluxo de depósito. |
| 5 | **Geral** | Withdraw.jsx / withdrawService / api.js | Nenhuma alteração neste hotfix; fluxo de saque inalterado. |

---

**Resumo:** A barra de versão vem do componente React `VersionBanner.jsx`, usado em várias páginas (exceto Withdraw). Foi adicionada a feature-flag `VITE_SHOW_VERSION_BANNER`: só exibe quando `=== "true"`. Produção sem a variável (ou com valor diferente) não mostra o banner; Preview pode ser configurado com `true` para auditoria. Nenhum arquivo de saque/depósito foi modificado.
