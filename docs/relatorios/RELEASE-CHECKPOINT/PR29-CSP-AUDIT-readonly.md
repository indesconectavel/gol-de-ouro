# Auditoria READ-ONLY: Content-Security-Policy (Helmet) desativado — PR #29

**Data:** 2026-02-06  
**Objetivo:** Entender por que o CSP foi desativado no backend e definir estratégia para o PR #29 sem reintroduzir regressões.  
**Regras:** READ-ONLY total — nenhum arquivo editado, nenhum commit/tag/push/merge, nenhum deploy.

---

## FASE 1 — Localização do CSP atual

### 1) Estado do repositório (registro)

| Item | Valor |
|------|--------|
| **Diretório atual** | `e:\Chute de Ouro\goldeouro-backend` |
| **git status -sb** | `## feat/payments-ui-pix-presets-top-copy...origin/feat/payments-ui-pix-presets-top-copy` + arquivos untracked em `docs/relatorios/RELEASE-CHECKPOINT/` |
| **Branch atual** | `feat/payments-ui-pix-presets-top-copy` |
| **HEAD (hash)** | `56189c16f3f2f6098ed70af3f5dcb929f742a8b7` |
| **HEAD (mensagem)** | `docs: PR #29 prep + audit fix report (release checkpoint)` |

### 2) Onde o CSP está desativado

**Arquivo:** `server-fly.js`  
**Trecho (contexto ~10 linhas):**

```text
// =====================================================
// MIDDLEWARE E CONFIGURAÇÕES
// =====================================================

// Middleware de segurança
app.use(helmet({
  contentSecurityPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

- **Linhas:** 208–215 (CodeQL aponta 208–215).  
- **Configuração:** `contentSecurityPolicy: false` — CSP do Helmet desligado; demais opções do Helmet (HSTS, etc.) permanecem ativas.

---

## FASE 2 — Histórico Git (por que foi desativado)

### 3) Commit que introduziu `contentSecurityPolicy: false`

- **Comando:** `git log -p -S "contentSecurityPolicy" -- server-fly.js`  
- **Comando:** `git blame -L 205,220 server-fly.js`

**Resultado:** A linha `contentSecurityPolicy: false` foi introduzida no commit **d8ceb3bb**; o bloco ao redor (helmet + hsts) é do commit **def1d3bc**.

### 4) Dados do commit que desativou o CSP

| Campo | Valor |
|-------|--------|
| **Hash** | `d8ceb3bb65a888069ab8f9d84e6561476b822568` |
| **Data** | 2026-02-05 22:24:34 -0300 |
| **Autor** | Fred S. Silva \<indesconectavel@gmail.com\> |
| **Mensagem** | `chore: checkpoint pre-v1 stable` |

**Diff relevante (server-fly.js):**

```diff
 // Middleware de segurança
 app.use(helmet({
-  contentSecurityPolicy: {
-    directives: {
-      defaultSrc: ["'self'"],
-      styleSrc: ["'self'", "'unsafe-inline'"],
-      scriptSrc: ["'self'"],
-      imgSrc: ["'self'", "data:", "https:"],
-    },
-  },
+  contentSecurityPolicy: false,
   hsts: {
     maxAge: 31536000,
```

- **Mensagem do commit:** Não menciona CSP, frontend, Vite, Vercel, analytics, PostHog, GTM nem motivo para desativar o CSP.  
- **Contexto:** Commit grande (“checkpoint pre-v1 stable”) — 55 arquivos alterados; a mudança de CSP foi uma entre muitas (login, webhook, Mercado Pago, env, etc.).  
- **Conclusão:** Não há evidência **no próprio commit** de que a desativação foi “para corrigir erros no frontend”; a decisão não está documentada na mensagem.

---

## FASE 3 — Evidências em documentação

### 5) Busca em `docs/`

**Padrões:** CSP, Content-Security-Policy, helmet, unsafe-inline, unsafe-eval, Vite, Vercel, PostHog, GTM.

**Documentos relevantes:**

| Arquivo | Trecho / contexto |
|---------|--------------------|
| `docs/relatorios/RELEASE-CHECKPOINT/PR29-CODEQL-ALERT-DETAILS-readonly.md` | CodeQL acusa Helmet com `contentSecurityPolicy` em `'false'`; sugere habilitar com objeto ou documentar exceção. |
| `docs/relatorios/RELEASE-CHECKPOINT/PR-PREP-MAIN-2026-02-06.md` | Cita commit **7dbb4ec**: “fix: corrigir CSP para permitir scripts externos (PostHog e GTM)” — referente ao **frontend** (player), não ao backend. |
| `docs/relatorios/RELEASE-CHECKPOINT/DEPLOY-AUDIT-PLAYER-readonly.md` | `goldeouro-player/vercel.json` tem “headers (CSP, cache)” — CSP do **player** é configurado no Vercel. |
| `docs/relatorios/RELEASE-CHECKPOINT/GIT-GLOBAL-PENDING-AUDIT-readonly.md` | Branches antigos: `fix/prod-csp-api-rewrite`, `fix/prod-vercel-proxy-csp` — indicam histórico de ajustes de CSP/proxy. |

- **Ausência:** Nenhum documento em `docs/` encontrado que diga explicitamente “CSP do backend foi desativado para corrigir erros no frontend” ou “reativar CSP apenas na V2”. A “decisão anterior” mencionada no contexto da auditoria **não está confirmada por documento ou mensagem de commit** nesta auditoria.

---

## FASE 4 — Produção (somente headers)

### 7) Frontend — https://www.goldeouro.lol (HEAD)

| Header | Valor (resumido) |
|--------|-------------------|
| **Content-Security-Policy** | **Presente.** `default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; img-src 'self' data: blob: https:; connect-src 'self' https: wss:; style-src 'self' 'unsafe-inline' https:; font-src 'self' data: https:;` |
| Server | Vercel |
| X-Vercel-Cache | HIT |

**Conclusão:** O **player** (www.goldeouro.lol) já possui **CSP ativo** (via Vercel / vercel.json). O backend **não** serve HTML do player.

### 8) Backend — https://goldeouro-backend-v2.fly.dev/health (HEAD)

| Header | Observação |
|--------|------------|
| **Content-Security-Policy** | **Ausente** (resposta é JSON; Helmet com `contentSecurityPolicy: false` não envia CSP). |
| strict-transport-security | max-age=31536000; includeSubDomains; preload |
| x-content-type-options | nosniff |
| x-frame-options | SAMEORIGIN |
| Server | Fly/bb3b4cf3 (2026-02-05) |

**Conclusão:** Backend em produção **não** envia header CSP; demais headers do Helmet estão presentes.

---

## FASE 5 — Análise para desbloquear o PR #29

### 9) Síntese

**A) Por que o CSP foi desativado (confirmado ou não)**  
- **Não confirmado por evidência.** O commit **d8ceb3bb** que trocou o objeto CSP por `contentSecurityPolicy: false` tem mensagem genérica (“chore: checkpoint pre-v1 stable”) e não cita CSP, frontend ou erros. Não foi encontrado documento em `docs/` que registre o motivo. A narrativa “desativado propositalmente para corrigir erros no frontend” e “reativar apenas na V2” permanece como **contexto externo**, não como fato atestado pelo histórico ou docs.

**B) O CSP do backend afeta diretamente o player Vercel?**  
- **Não.** O player é servido pelo **Vercel** (www.goldeouro.lol) e já tem CSP próprio (vercel.json). O backend (Fly.io) serve **API** (JSON). Respostas de API não carregam documentos HTML; o navegador aplica o CSP da **página** (origem Vercel), não o do response da API. Portanto, **reativar CSP no backend** não altera o CSP que rege o player; no máximo adiciona um header CSP em respostas JSON (que navegadores em geral não aplicam a recursos de mesma origem da página da mesma forma que ao documento principal).

**C) Risco real de reativar CSP no backend agora**  
- **Baixo para o player.** Como o frontend está no Vercel com CSP próprio, reativar CSP no Helmet do backend não deve reintroduzir “erros no frontend” causados por CSP do backend.  
- **Possível impacto:** Qualquer página ou iframe **servido diretamente** pelo backend (ex.: admin, páginas de erro HTML) passaria a receber o header CSP; se no futuro o backend servir HTML com scripts/estilos que a política bloquear, poderia haver regressão nesses cenários. No estado atual (API JSON), o risco é baixo.

### 10) Três opções (SEM EXECUTAR)

| Opção | Descrição |
|-------|------------|
| **Opção 1** | **Manter CSP desligado** e tratar o alerta CodeQL como **decisão consciente**: documentar no código ou em SECURITY/README que o CSP do backend está desativado na V1 por decisão de release; reativar na V2; configurar o repositório (ex.: Code scanning / Security) para aceitar ou suprimir esse alerta com justificativa. |
| **Opção 2** | **CSP em Report-Only** no backend: usar `contentSecurityPolicy: { reportOnly: true, directives: { ... } }` para passar a enviar `Content-Security-Policy-Report-Only` sem aplicar bloqueios. Reduz o alerta CodeQL (não é mais `false`) e permite observar violações sem risco de quebrar o frontend. |
| **Opção 3** | **CSP mínimo permissivo** no backend: reativar com um objeto de diretivas amplo (ex.: `default-src *` ou equivalente mínimo) apenas para não ter `contentSecurityPolicy: false`. Atenção: políticas muito frouxas podem continuar sendo sinalizadas por CodeQL ou políticas internas; verificar regras do repo antes. |

---

## FASE 6 — Relatório final

### Evidências resumidas

- **Commit que desativou o CSP:** `d8ceb3bb` (2026-02-05), mensagem “chore: checkpoint pre-v1 stable”. **Sem** menção a CSP, frontend ou motivo.  
- **Documentação:** Nenhum doc em `docs/` que explique a desativação ou a “decisão V2”. Existem referências a CSP no **frontend** (7dbb4ec, vercel.json) e branches antigos de fix de CSP/proxy.  
- **Produção:** Player (www.goldeouro.lol) com **CSP ativo** (Vercel). Backend (Fly.io) **sem** header CSP.

### Impacto

- O backend hoje só desativa o **envio** do header CSP nas respostas da API; não governa o CSP do player.  
- Reativar CSP no backend (objeto ou Report-Only) tende a não impactar o player; impacto possível apenas em HTML servido pelo backend no futuro.

### Recomendação técnica para o PR #29

- **Curto prazo (desbloquear o PR):** Escolher entre **Opção 1** (manter desligado + documentar + tratar alerta) ou **Opção 2** (Report-Only), conforme política de segurança e CodeQL do repositório.  
- **Médio prazo:** Documentar no código ou em `docs/` a decisão (ex.: “CSP do backend desativado na V1; reativar na V2”) e, se reativar, preferir política explícita (objeto ou Report-Only) em vez de `contentSecurityPolicy: false`.

### Confirmação READ-ONLY

- **Nenhum arquivo foi editado.**  
- **Nenhum commit, tag, push ou merge foi realizado.**  
- **Nenhum deploy foi executado.**  
- **Nenhuma configuração de segurança foi alterada.**  
- Apenas comandos de leitura foram usados (Get-Location, git status, git branch, git log, git show, git blame, grep, Invoke-WebRequest -Method Head).

---

## Comandos executados (PowerShell / leitura)

```text
Get-Location; git status -sb; git branch --show-current; git rev-parse HEAD; git log -1 --oneline
grep contentSecurityPolicy (workspace)
git log -p -S "contentSecurityPolicy" -- server-fly.js
git blame -L 205,220 server-fly.js
git show d8ceb3bb --stat; git log -1 --format="%H%n%ai%n%s%n%b" d8ceb3bb
git show d8ceb3bb -- server-fly.js
grep CSP|Content-Security-Policy|helmet|... em docs/
Invoke-WebRequest -Uri "https://www.goldeouro.lol" -Method Head -UseBasicParsing
Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -Method Head -UseBasicParsing
```

---

**Caminho do relatório:** `docs/relatorios/RELEASE-CHECKPOINT/PR29-CSP-AUDIT-readonly.md`

**Confirmação final:** Nenhuma alteração foi feita no repositório ou em produção; auditoria 100% read-only.
