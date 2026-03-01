# Hotfix: feature-flag da barra de versão (VersionBanner)

**Data:** 2026-02-28  
**Branch:** preview/withdraw-merge-97e67b2  
**Objetivo:** Banner de versão só aparece quando `VITE_SHOW_VERSION_BANNER === "true"`. Produção não define a variável → banner não aparece.

---

## Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `goldeouro-player/src/components/VersionBanner.jsx` | Constante `SHOW_BANNER`, early return `if (!SHOW_BANNER) return null;` |
| `goldeouro-player/env.example` | Comentário explicativo da variável `VITE_SHOW_VERSION_BANNER` |

Nenhum outro arquivo foi modificado.

---

## Diff

### VersionBanner.jsx

- No topo (após imports):  
  `const SHOW_BANNER = import.meta.env.VITE_SHOW_VERSION_BANNER === 'true';`
- Comentário: feature-flag para Produção (não definir) e Preview (opcional true).
- Dentro do componente, antes do `return` principal:  
  `if (!SHOW_BANNER) return null;`
- Props existentes mantidas; comportamento quando a flag é `"true"` inalterado.

### env.example

- Bloco de comentário:
  - `# VITE_SHOW_VERSION_BANNER=true → exibe barra`
  - `# Produção: não definir ou false`
  - `# Preview: opcional true`
  - `# VITE_SHOW_VERSION_BANNER=false` (exemplo comentado)

---

## Confirmação explícita: Withdraw não foi modificado

- **Withdraw.jsx:** não alterado. Nenhuma linha modificada, adicionada ou removida.
- **withdrawService.js:** não alterado.
- **api.js:** não alterado.

Fluxo de saque (endpoints, chamadas, UI de Withdraw) permanece idêntico ao do Preview atual.

---

## Confirmação explícita: endpoints não foram modificados

- Nenhum arquivo de backend (rotas, controllers, server) foi alterado.
- Nenhum endpoint de saque ou depósito foi criado, alterado ou removido.
- Alterações restritas ao frontend do player: um componente de UI (VersionBanner) e um arquivo de exemplo de env.

---

## Instruções de env para Vercel (Preview vs Production)

| Ambiente | Variável `VITE_SHOW_VERSION_BANNER` | Comportamento |
|----------|--------------------------------------|---------------|
| **Production** (www.goldeouro.lol) | Não definir, ou `false` | Banner **não** aparece. |
| **Preview** | Não definir → banner não aparece. Opcional: `true` → banner aparece. | Útil para auditoria. |

**Passos:**

1. Vercel Dashboard → projeto **goldeouro-player** → **Settings** → **Environment Variables**.
2. **Production:** garantir que `VITE_SHOW_VERSION_BANNER` não exista ou não seja `"true"`.
3. **Preview:** (opcional) criar `VITE_SHOW_VERSION_BANNER` = `true` se quiser exibir a barra em previews.
4. Redeploy do ambiente após alterar variáveis (VITE_ são injetadas em tempo de build).

---

## Resumo de segurança

- Escopo mínimo: apenas VersionBanner.jsx e env.example.
- Sem alteração em Withdraw, withdrawService, api, rotas, SW/PWA, build scripts, vite.config ou endpoints.
- Comportamento padrão (variável não definida) = banner oculto; produção permanece estável (FyKKeg6zb não quebrada por esta mudança).
