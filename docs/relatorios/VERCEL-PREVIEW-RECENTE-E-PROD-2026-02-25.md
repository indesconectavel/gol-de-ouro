# Preview mais recente (goldeouro-player) e produção current — READ-ONLY

**Data:** 2026-02-25  
**Modo:** Somente leitura (sem alterar código, commit, deploy, env ou DNS).

---

## 1) Onde estou e pasta do player

| Item | Valor |
|------|--------|
| **pwd** | `E:\Chute de Ouro\goldeouro-backend` |
| **Pasta do player** | Existe **dentro do repo**: `E:\Chute de Ouro\goldeouro-backend\goldeouro-player` |
| **Repo** | Monorepo (backend + goldeouro-player + goldeouro-admin + outros). O player **não** é um repositório separado; está em `goldeouro-player/`. |

Projeto Vercel vinculado (`.vercel/project.json`): **goldeouro-player**, `projectId`: `prj_lNa2Uj0jf4anaKpO4IXVWkKumn8v`.

---

## 2) Vercel CLI

| Comando | Resultado |
|---------|-----------|
| `vercel --version` | **Vercel CLI 48.10.2** (disponível) |
| `npx vercel --version` | Não necessário; CLI global OK. |

---

## 3) Login Vercel

| Comando | Resultado |
|---------|-----------|
| `vercel whoami` | **Erro:** No existing credentials found. Please run `vercel login` or pass `--token`. |
| `vercel login` | Foi executado; abre no browser. **Ação do usuário:** concluir login na página indicada e, se pedido, pressionar ENTER no terminal. |

Enquanto não houver login, os comandos `vercel ls` / `vercel list` não retornam dados. Após concluir o login, rodar os passos abaixo.

---

## 4) Listar deployments e preview mais recente

**Comandos (rodar a partir da pasta do player, após login):**

```powershell
Set-Location "E:\Chute de Ouro\goldeouro-backend\goldeouro-player"
vercel ls
# ou, só previews:
vercel list --environment=preview
```

**Regra:** O **preview mais recente** é o primeiro deployment da lista com **Environment = Preview** e **Status = Ready** (ou marcado como Latest). A **URL completa** é a coluna "Visit" / domínio `*.vercel.app` desse deployment.

**Se o CLI não mostrar URL de forma clara:**  
- **Dashboard (um passo):** Abra [Vercel Dashboard](https://vercel.com/dashboard) → projeto **goldeouro-player** → aba **Deployments** → filtre por **Preview** → o primeiro deployment com status **Ready** é o mais recente → clique e copie o campo **Domains** / **Visit** (URL `https://goldeouro-player-xxxxx-....vercel.app`).

---

## 5) Produção current (FyKKeg6zb)

**Pelo CLI (após login):**

```powershell
Set-Location "E:\Chute de Ouro\goldeouro-backend\goldeouro-player"
vercel list --environment=production
```

O deployment marcado como **Production** / **Current** deve ser o que contém o ID/commit **FyKKeg6zb** (ou o nome exibido no Dashboard para esse deploy).

**Pelo Dashboard:**  
Vercel Dashboard → **goldeouro-player** → **Deployments** → filtrar **Production** → verificar qual deployment está marcado como **Current**; confirmar que é **FyKKeg6zb** (nome ou ID do deployment).

---

## 6) Resultado final (entregáveis)

### (A) URL do PREVIEW mais recente (Ready/Latest)

- **Via CLI:** Não foi possível obter sem login. Após `vercel login`, rodar `vercel ls` (ou `vercel list --environment=preview`) na pasta `goldeouro-player` e usar a URL do primeiro Preview Ready.
- **Via Dashboard:** Deployments → Preview → primeiro **Ready** → copiar URL em **Visit** / **Domains**.

*(Preencher aqui após obter a URL:)*  
**URL do preview mais recente:** _—_

---

### (B) Confirmação do Production Current (FyKKeg6zb)

- **Evidência textual:** Production deployment **FyKKeg6zb** deve aparecer como **Current** em Dashboard → goldeouro-player → Deployments → Production (ou via `vercel list --environment=production`).
- *(Após conferir, registrar:)* **Production current confirmado:** FyKKeg6zb _— sim / não_

---

### (C) Por que o jk10qipn8 pode mostrar “regressão” (barra v1.2.0)?

- **jk10qipn8** é um **preview antigo** (um deployment de preview específico). Cada preview fica fixo no commit/build que o gerou.
- Ele mostra a **versão daquele build** (ex.: v1.2.0), não a versão atual de produção. Por isso a “regressão” é na verdade **preview desatualizado**; o preview **mais recente** (Ready/Latest) é que reflete o último deploy de preview e deve ser usado como referência quando necessário.

---

## Resumo

| Item | Status |
|------|--------|
| pwd | `E:\Chute de Ouro\goldeouro-backend` |
| Pasta do player | `goldeouro-player/` dentro do repo |
| Vercel CLI | 48.10.2 |
| Login | Necessário; concluir `vercel login` no browser |
| Preview mais recente (URL) | Obter com `vercel ls` após login ou via Dashboard |
| Production current | Confirmar FyKKeg6zb no Dashboard ou com `vercel list --environment=production` |
| jk10qipn8 | Preview antigo; mostra build antigo (v1.2.0); usar o preview mais recente como referência |

Nenhum código, commit, deploy, env ou DNS foi alterado.
