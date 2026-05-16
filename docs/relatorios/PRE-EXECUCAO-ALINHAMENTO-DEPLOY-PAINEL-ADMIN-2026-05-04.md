# Pré-execução — alinhamento do deploy real do painel admin

**Data:** 2026-05-04  
**Base:** `docs/relatorios/DIAGNOSTICO-READONLY-404-PAINEL-ADMIN-VERCEL-2026-05-04.md`  
**Regras desta fase:** sem alteração de código, sem deploy, sem mover ficheiros — apenas diagnóstico e decisão de **fonte oficial**.

---

## 1. Projetos “admin” identificados (disco + monorepo)

| Local | Notas |
|--------|--------|
| `E:\Chute de Ouro\goldeouro-admin-novo` | Projeto Vite/React **minimalista**; `package.json` com `"name": "goldeouro-admin"`. **Não** é o painel completo. |
| `E:\Chute de Ouro\goldeouro-admin-acelerado` | `package.json` é **placeholder** (ficheiro inválido / não utilizável). Não constitui app deployável no estado visto. |
| `E:\Chute de Ouro\goldeouro-backend\goldeouro-admin` | **Painel completo** (páginas, rotas, PWA, `vercel.json`, `.vercel/project.json`). Aninhado **dentro** do repositório `goldeouro-backend`. |

Não foi encontrada outra pasta irmã com nome `goldeouro-admin` (além de `novo` e `acelerado`) no caminho de trabalho inspecionado.

---

## 2. Por projeto — inventário resumido

### 2.1 `goldeouro-admin-novo`

| Item | Situação |
|------|----------|
| `package.json` | Existe; Vite + React; `name` = `goldeouro-admin`. |
| `App.jsx` / rotas | `App.jsx` com **apenas** `<Route path="/" element={<Dashboard />} />`. **Sem** `/painel` nem `/saque-usuarios`. |
| Páginas | Estrutura reduzida (ex.: `Dashboard`); **não** corresponde ao catálogo do painel completo. |
| `SaqueUsuarios.jsx` | **Não** listado no inventário deste projeto. |
| `vercel.json` | **Não** existe na raiz. |
| Build output | Output Vite previsível: `dist/` (não detalhado como build de produção do domínio). |

### 2.2 `goldeouro-admin-acelerado`

| Item | Situação |
|------|----------|
| `package.json` | **Placeholder** — não há metadados de pacote reais. |
| App / rotas / páginas | Não analisáveis como fonte de produto; tratar como **não canónico** até existir repositório válido. |

### 2.3 `goldeouro-backend\goldeouro-admin` (painel completo)

| Item | Situação |
|------|----------|
| `package.json` | `name`: `goldeouro-admin`, `version`: `1.1.0`; scripts `build` / `vercel-build` → `vite build`. |
| Entrada / rotas | `src/main.jsx` → `App.jsx` + `AppRoutes.jsx` (e variantes de emergência noutros ficheiros). |
| `AppRoutes.jsx` | Declara, entre outras, **`/painel`**, **`/saque-usuarios`** (componente `SaqueUsuarios` de `src/pages/SaqueUsuarios.jsx`), `/lista-usuarios`, `/transacoes`, etc. |
| Páginas | Dezenas em `src/pages/` (dashboard, relatórios, saques, utilizadores, backups, logs, …). |
| `SaqueUsuarios.jsx` | **Sim:** `src/pages/SaqueUsuarios.jsx` (+ variantes `SaqueUsuariosResponsive*.jsx`). |
| `vercel.json` | Existe na raiz do projeto admin; contém **apenas** bloco **`headers`** (CSP e segurança). **Não** inclui `rewrites` para SPA. |
| Build output | `dist/` presente; `index.html` referencia por exemplo `/assets/index-55d580b8.js` (hash **local**). |
| PWA | `vite.config.ts` com `VitePWA` (manifest, `navigateFallback: '/index.html'` no **Workbox** — relevante para **PWA offline**, **não** substitui rewrites do **host** Vercel em pedidos HTTP directos a caminhos profundos). |

---

## 3. Comparação e decisão de fonte oficial

| Pergunta | Conclusão |
|----------|------------|
| Qual projeto tem o painel “completo” (rotas + páginas + saques)? | **`goldeouro-backend\goldeouro-admin`**. |
| O `goldeouro-admin-novo` representa o mesmo produto? | **Não.** É um subconjunto; o diagnóstico anterior que o citava como “goldeouro-admin” reflete o **nome** no `package.json`, não a **completude** do painel. |
| O que parece estar em `https://admin.goldeouro.lol`? | **Uma SPA Vite** com título **“Painel Gol de Ouro”** e assets em `/assets/index-*.js` — **alinhado** com a **família** do painel em `goldeouro-backend\goldeouro-admin` (PWA/estilo), **não** com o `index.html` minimalista típico de `admin-novo`. |
| Há prova de que o **último ficheiro** no disco local é o mesmo do deploy? | **Não.** Comparação em 2026-05-04: produção serviu `index-d61e7578.js` enquanto o `dist` local apontava `index-55d580b8.js`; o HTML de produção continha comentário “CSP REMOVIDO…” e o `dist` local incorporava meta CSP longa. **O deploy em produção não coincide byte-a-byte com o `dist` local analisado** — outro build, branch ou configuração. |

**Fonte oficial recomendada daqui em diante:** **`E:\Chute de Ouro\goldeouro-backend\goldeouro-admin`** (única árvore com rotas e páginas alinhadas ao painel auditado, incluindo `/saque-usuarios`).

**Divergência principal:** existem **duas** “identidades” com nome de pacote `goldeouro-admin` — a **minimal** em `goldeouro-admin-novo` e a **completa** aninhada no backend. Qualquer alinhamento de rotas ou deploy deve **assumir a pasta aninhada** como canónica, **não** o `novo` isolado.

---

## 4. Evidências Vercel (ficheiros no repositório)

| Ficheiro | Conteúdo relevante |
|----------|-------------------|
| `goldeouro-backend\goldeouro-admin\.vercel\project.json` | `"projectName":"goldeouro-admin"`, `projectId":"prj_SLLtt8Kv6D6pMQiY4ky5KoxNUuAk"`, `orgId` presente (equipa Vercel). |
| `vercel.json` (raiz do admin completo) | Só **headers**; **sem** `rewrites` SPA — compatível com **404 HTTP** em `/painel`, `/saque-usuarios`, etc., como no diagnóstico READ-ONLY (salvo rewrites definidos **no dashboard** e não versionados). |

**Root directory esperado na Vercel:** para deploy correcto deste código, o root do projeto deve ser a pasta **`goldeouro-admin`** dentro do repo que contém esta árvore (ou o repositório Git em que ela for publicada). Se o projecto Vercel apontar para a **raiz** do monorepo errado (ou outro subdiretório), o build pode corresponder a outro snapshot.

Não há, no ficheiro `.vercel/project.json`, indicação de **branch**; isso confirma-se no dashboard ou com `vercel` CLI com credenciais.

---

## 5. Síntese: causa do 404 (reforço)

- **Runtime HTTP** (Vercel): sem regra `/*` → `/index.html` (em `vercel.json` **ou** painel do projecto), caminhos profundos **não** mapeiam para a SPA.
- **Código React** (painel completo): as rotas `/painel` e `/saque-usuarios` **existem** em `AppRoutes.jsx`; o 404 **não** se explica por ausência dessas rotas **nessa** base de código.
- O diagnóstico que analisou **só** `goldeouro-admin-novo` concluía (correctamente **para esse** tree) que faltavam rotas; o alinhamento acima mostra que o **código canónico** está **outro sítio**.

---

## 6. GO / NO-GO para cirurgia de rotas e deploy

| Parecer | Justificativa |
|---------|----------------|
| **GO (condicionado)** | Tratar **`goldeouro-backend\goldeouro-admin`** como fonte; em seguida: (1) **alinear** o projecto Vercel (root, branch, último deploy) com essa pasta; (2) **garantir** rewrites SPA (ficheiro ou dashboard); (3) **revalidar** após deploy que o hash de assets e o HTML batem com o repositório escolhido. |
| **NO-GO** | Fazer deploy ou “cirurgia de rotas” **apenas** a partir de `goldeouro-admin-novo` — **não** reproduz o painel completo nem `/saque-usuarios`. |
| **NO-GO** | Assumir que “corrigir React” no minimal resolve o produto se o host continuar a servir outro build ou sem rewrites. |

---

## 7. Respostas pedidas (checklist)

| Item | Resposta |
|------|----------|
| Pasta **provavelmente** publicada em `admin.goldeouro.lol` | **Build Vite do tipo** `goldeouro-backend\goldeouro-admin` (título e estrutura); **não** comprovado ser o **`dist` local** actual (hashes/HTML diferentes). |
| Pasta com painel **completo** | **`goldeouro-backend\goldeouro-admin`**. |
| Divergência encontrada | Duplicidade de nome `goldeouro-admin` (novo **vs** aninhado); `novo` incompleto; **deploy ≠ dist local** inspeccionado; **`vercel.json` sem rewrites** no repo. |
| Fonte oficial | **`goldeouro-backend\goldeouro-admin`**. |
| GO/NO-GO | **GO** para fase seguinte **se** root Vercel + rewrites + confirmação de build forem tratados em conjunto; **NO-GO** para usar `goldeouro-admin-novo` como base do painel completo. |

---

## Referências cruzadas

- `docs/relatorios/DIAGNOSTICO-READONLY-404-PAINEL-ADMIN-VERCEL-2026-05-04.md` — evidência HTTP 404 em paths profundos; interpretação de falta de rewrite.
- `goldeouro-backend/goldeouro-admin/.vercel/project.json` — nome do projecto Vercel `goldeouro-admin`.
- `goldeouro-backend/goldeouro-admin/src/AppRoutes.jsx` — rotas `/painel` e `/saque-usuarios`.
