# Cirurgia 2 — alinhamento do deploy do painel admin (Vercel)

**Data:** 2026-05-04  
**Fonte oficial:** `E:\Chute de Ouro\goldeouro-backend\goldeouro-admin`  
**Objetivo:** publicar o painel de forma que **rotas profundas** respondam **200** (SPA), sem alterar backend financeiro nem mocks.

---

## 1. Confirmação da fonte oficial

| Item | Valor |
|------|--------|
| `package.json` | `name`: `goldeouro-admin`, `version`: `1.1.0` |
| Script de build | `build` → `vite build` |
| Script Vercel | `vercel-build` → `vite build` |
| Output | `dist/` (padrão Vite) |
| Base Vite | Raiz `/` (`vite.config.ts` sem `base` custom) |

**Não** foi utilizado `goldeouro-admin-novo` nem outro repositório paralelo.

---

## 2. `vercel.json` — rewrites SPA

Foi adicionado o bloco **`rewrites`** com regra de **fallback** para a SPA: pedidos que não correspondem a ficheiros estáticos passam a servir `index.html` (comportamento esperado na Vercel para ficheiros em `dist` / assets).

**Ficheiro alterado:** `goldeouro-admin/vercel.json` (headers de segurança **mantidos**).

Conteúdo final (resumo): `rewrites` com `source: "/(.*)"` e `destination: "/index.html"`, mais o bloco `headers` existente (CSP, `X-Frame-Options`, cache, etc.).

**Nota:** a Vercel continua a servir ficheiros estáticos (ex.: `/assets/*.js`) quando existem; a regra aplica-se sobretudo a caminhos “virtuais” do React Router.

---

## 3. Rotas em `AppRoutes.jsx` (confirmação)

As rotas abaixo **já existiam** no código; não foi necessário alterar lógica de rotas.

| Rota | Componente |
|------|------------|
| `/painel` | `Dashboard` dentro de `MainLayout` |
| `/saque-usuarios` | `SaqueUsuarios` (`src/pages/SaqueUsuarios.jsx`) dentro de `MainLayout` |

Ficheiro: `goldeouro-admin/src/AppRoutes.jsx`.

---

## 4. Build local

| Resultado | Detalhe |
|-----------|---------|
| **Estado** | **Passou** (`exit code 0`) |
| Duração aproximada | ~1m 54s |
| Avisos | Browserslist / `baseline-browser-mapping` desatualizados (não bloqueiam o build) |

**Assets principais gerados (hashes):**

| Ficheiro | Hash / nome |
|----------|-------------|
| JS principal | `dist/assets/index-6c1699fc.js` (~446 kB) |
| CSS principal | `dist/assets/index-de3600f1.css` (~59 kB) |
| `index.html` | referencia os assets acima; título: **Painel Gol de Ouro** |
| PWA | `dist/sw.js`, `dist/workbox-6e5f094d.js`, `registerSW.js`, `manifest.webmanifest` |
| Outro | `dist/assets/logo-6e8d9f80.png` |

---

## 5. Deploy Vercel

| Item | Valor |
|------|--------|
| **Executado?** | **Sim** — `npx vercel --prod` a partir de `goldeouro-admin` |
| Projeto (CLI) | `goldeouro-admins-projects/goldeouro-admin` |
| URL de inspeção (run) | `https://vercel.com/goldeouro-admins-projects/goldeouro-admin/8htY9UZKvPEetaZiV1NzM6TS4HC4` |
| URL de deployment (run) | `https://goldeouro-admin-7sr4qwq2q-goldeouro-admins-projects.vercel.app` |

**Root directory:** o deploy foi feito **localmente** na pasta da fonte oficial (`goldeouro-admin`). No dashboard da Vercel, o repositório ligado deve continuar com **Root Directory** apontando para esta pasta no mono-repo (equivalente ao que foi enviado na CLI).

---

## 6. Validação HTTP pós-deploy (HEAD)

Teste após o deploy (incl. domínio personalizado):

| URL | Status |
|-----|--------|
| `https://admin.goldeouro.lol/` | **200** |
| `https://admin.goldeouro.lol/painel` | **200** |
| `https://admin.goldeouro.lol/saque-usuarios` | **200** |

O mesmo padrão **200** foi observado no hostname `*.vercel.app` do deployment listado no output da CLI.

**Antes** desta alteração + deploy, `/painel` e `/saque-usuarios` devolviam **404** a nível de edge (falta de fallback SPA). **Depois**, deixam de ocorrer 404 do tipo “ficheiro inexistente” nessas rotas.

---

## 7. Ficheiros alterados (código / infra)

| Ficheiro | Alteração |
|----------|-----------|
| `goldeouro-admin/vercel.json` | Inclusão de `rewrites` SPA (`/(.*)` → `/index.html`) |

Nenhuma alteração em backend, SQL, Plano B, ou páginas mock.

---

## 8. Resumo executivo

| Pergunta | Resposta |
|----------|----------|
| Build passou? | **Sim** |
| `vercel.json` final | Inclui **rewrites** + **headers** (ver repositório) |
| Deploy feito? | **Sim** (CLI; produção e domínio `admin.goldeouro.lol` validados com 200 nas três URLs) |
| Problema de 404 em rotas profundas (host) | **Tratado** com rewrite + novo deploy |

---

## Próximos passos (fora deste escopo)

- Manter o **Root Directory** no projeto Vercel alinhado a `goldeouro-admin` em futuros deploys via Git.
- Opcional: atualizar Browserslist / dependências de build para silenciar avisos.
- Mocks e lógica de negócio: conforme regra desta cirurgia, **não** intervencionados aqui.
