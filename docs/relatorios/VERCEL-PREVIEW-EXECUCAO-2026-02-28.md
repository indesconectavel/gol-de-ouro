# Execução Vercel Preview — goldeouro-player (2026-02-28)

## Regras respeitadas
- Apenas projeto Vercel **goldeouro-player**
- Apenas ambiente **Preview**
- Nenhuma alteração em código, merge, push em main, backend ou **Production**

---

## a) Link do projeto

- **Primeiro link** (a partir de `goldeouro-player`):  
  **ORG:** `goldeouro-admins-projects` (team_7BSTR9XAt3OFEIUUMqSpIbdw)  
  **PROJECT:** `goldeouro-player` ✓

- **Segundo link** (a partir da raiz do monorepo, para tentar deploy):  
  **PROJECT:** `goldeouro-player` (mesmo projeto, para usar Root Directory no deploy)

Projeto linkado é **goldeouro-player** em ambos os casos.

---

## b) Variáveis de ambiente — VITE_SHOW_VERSION_BANNER

- **Preview:** a variável **não existe**.
- **Production:** a variável **não existe** (apenas reporte; nada foi alterado).
- **Development:** a variável **não existe**.

Nenhuma ação de remoção ou alteração foi necessária.

---

## c) Remoção/alteração em Preview

- **Não aplicável:** `VITE_SHOW_VERSION_BANNER` não existe em Preview (nem em nenhum ambiente). Nenhum comando de remoção ou alteração foi executado.

---

## d) Redeploy do Preview (branch `preview/withdraw-merge-97e67b2`)

- **Tentativa via CLI:**  
  - Deploy a partir da raiz do monorepo (`goldeouro-backend`) com `vercel --force` falhou: tamanho do upload > 2 GiB (repositório + node_modules, etc.).  
  - Deploy a partir de `goldeouro-player` falhou antes: path incorreto (`goldeouro-player\goldeouro-player`) por causa do Root Directory no projeto Vercel.

- **Recomendação:** fazer o redeploy pelo **Vercel Dashboard**:
  1. Acesse: https://vercel.com/goldeouro-admins-projects/goldeouro-player
  2. Aba **Deployments**
  3. Localize o deployment do branch **preview/withdraw-merge-97e67b2** (último da lista ou filtrar por branch)
  4. Clique nos três pontinhos → **Redeploy**
  5. Marque **Redeploy with existing Build Cache** como **desligado** (build limpo)
  6. Confirme; aguarde o build e use a **URL do Preview** gerada

---

## e) URL do Preview e checklist Network (Q1–Q4)

- **URL do Preview:**  
  Como o redeploy via CLI não gerou novo deployment, use a URL do deployment mais recente do branch **preview/withdraw-merge-97e67b2** no Dashboard (ou a URL gerada após o redeploy manual acima).  
  Formato típico: `https://goldeouro-player-<hash>-goldeouro-admins-projects.vercel.app` ou similar.

**Checklist curto — validar no DevTools → Network:**

| # | Verificação | Esperado |
|---|-------------|----------|
| **Q1** | Requisições ao backend (fly.dev) | CORS OK; chamadas para o domínio configurado (ex.: goldeouro-backend-v2.fly.dev). |
| **Q2** | Em /withdraw — ao solicitar saque | POST para endpoint de **saque** (ex.: `/api/withdraw/request` ou o configurado no player); **não** POST para `/api/payments/pix/criar`. |
| **Q3** | Em /pagamentos | Chamadas para `/api/payments/pix/*` (depósito) conforme fluxo atual. |
| **Q4** | Barra de versão (topo verde) | **Não** aparece (pois `VITE_SHOW_VERSION_BANNER` não está definida em Preview). |

---

## Confirmações

- **Projeto:** goldeouro-player (goldeouro-admins-projects/goldeouro-player).
- **Env em Preview:** `VITE_SHOW_VERSION_BANNER` não existe; banner não deve aparecer por padrão do código (flag !== "true").
- **Production:** nenhuma variável foi alterada ou removida; nenhuma ação em Production.
