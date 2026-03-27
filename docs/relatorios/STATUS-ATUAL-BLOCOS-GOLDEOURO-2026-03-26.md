# STATUS ATUAL DOS BLOCOS — GOL DE OURO

**Data:** 2026-03-26  
**Modo:** Consolidação READ-ONLY (código `goldeouro-backend` / `goldeouro-player` + documentos em `docs/`)  
**Última referência formal datada em `docs/STATUS-GERAL-GOLDEOURO.md`:** 2026-03-26 (BLOCO F — encerramento documental do refinamento app shell)  
**Última referência histórica:** 2026-03-17 (parcialmente substituída para o BLOCO F por este ficheiro e por `BLOCO-F-ENCERRAMENTO-OFICIAL-2026-03-26.md`)

---

## 1. Modelo de blocos utilizado no projeto

O repositório documenta de forma consistente os blocos **A a F** e frequentemente um bloco **G** (fluxo do jogador). **Não** existe no código um enum “Bloco A–F”; os blocos são **unidades de auditoria e governança** descritas em `docs/relatorios/`, `docs/STATUS-GERAL-GOLDEOURO.md` e `docs/relatorios/RELATORIO-FINAL-BLOCOS-ATE-F-2026-03-18.md`.

| ID | Nome canónico (documentação) | Âmbito resumido |
|----|------------------------------|-----------------|
| **A** | Financeiro | PIX, webhooks, ledger, workers |
| **B** | Sistema de apostas | Lotes, valores, premiação |
| **C** | Autenticação | JWT, login, registo, rotas protegidas |
| **D** | Sistema de saldo | Débito/crédito, concorrência, perfil/saldo |
| **E** | Gameplay | Engine de chute, POST `/api/games/shoot`, métricas |
| **F** | Interface | Player web, `/game`, HUD, overlays, navegação, UX |
| **G** | Fluxo do jogador | Jornada ponta a ponta (documentos `BLOCO-G-*`, `AUDITORIA-BLOCO-G-*`) |

---

## 2. Estado atual por bloco

### BLOCO A — Financeiro

| Campo | Conteúdo |
|-------|-----------|
| **Status** | **Validado** (documentos: `RELATORIO-FINAL-BLOCOS-ATE-F-2026-03-18.md`, `STATUS-GERAL-GOLDEOURO.md`, `BLOCO-A-FINANCEIRO-READONLY-2026-03-08.md`) |
| **Evidência** | Endpoints PIX, integração Mercado Pago referidos nos relatórios; `Pagamentos.jsx` consome API no player. |
| **Pendências** | Operacionais pontuais (workers, envs) mencionados em auditorias históricas — não revalidados nesta sessão. |
| **Riscos remanescentes** | Médio em operações (filas, webhooks) — fora do escopo desta auditoria visual. |
| **Fecho** | Tratado como **fechado / validado** ao nível documental consolidado de março/2026. |

---

### BLOCO B — Sistema de apostas

| Campo | Conteúdo |
|-------|-----------|
| **Status** | **Validado** |
| **Evidência** | `GameFinal.jsx` comentário V1 aposta fixa R$ 1; relatórios de lotes e prémios. |
| **Pendências** | Divergências históricas “regra V1 vs backend” mencionadas em `AUDITORIA-POR-BLOCOS-LOCAL-VS-PRODUCAO-2026-03-08.md` — verificar se ainda aplicável em produção atual. |
| **Riscos remanescentes** | Baixo a médio (regras de negócio se ambiente divergir). |
| **Fecho** | **Validado** no relatório consolidado. |

---

### BLOCO C — Autenticação

| Campo | Conteúdo |
|-------|-----------|
| **Status** | **Validado** |
| **Evidência** | `ProtectedRoute`, rotas em `App.jsx`, páginas `Login.jsx`, `Register.jsx`, `AuthContext.jsx`. |
| **Pendências** | Nenhuma crítica identificada nesta auditoria de UI. |
| **Riscos remanescentes** | Segurança geral (tokens, storage) — auditorias em `docs/seguranca/`. |
| **Fecho** | **Validado** (consolidado Mar/2026). |

---

### BLOCO D — Sistema de saldo

| Campo | Conteúdo |
|-------|-----------|
| **Status** | **Validado com ressalvas** |
| **Evidência** | `apiClient` + `API_ENDPOINTS.PROFILE`; `Withdraw.jsx`, `Dashboard.jsx` exibem saldo a partir do perfil. |
| **Pendências** | Transação atômica saldo+chute **não** garantida; risco de concorrência documentado em `STATUS-GERAL-GOLDEOURO.md` e `RELATORIO-FINAL-BLOCOS-ATE-F-2026-03-18.md`. |
| **Riscos remanescentes** | **Médio** (concorrência, restart, instâncias múltiplas). |
| **Fecho** | **Não fechado** em sentido forte — **validado com ressalvas**. |

---

### BLOCO E — Gameplay

| Campo | Conteúdo |
|-------|-----------|
| **Status** | **Encerrado premium** / estável (documentação) |
| **Evidência** | `GameFinal.jsx`, `gameService.js`, `layoutConfig.js`; POST chute; relatórios BLOCO E. |
| **Pendências** | Fase **I.5 idempotência**: implementada no cliente em branch de trabalho; validação manual em preview **pendente** (`STATUS-GERAL-GOLDEOURO.md`). |
| **Riscos remanescentes** | Idempotência em memória, multi-instância; cliente produção sem header até deploy — **médio**. |
| **Fecho** | Núcleo **validado**; I.5 **aberta** até evidências de ambiente. |

---

### BLOCO F — Interface

| Campo | Conteúdo |
|-------|-----------|
| **Status** | **FECHADO / VALIDADO** (2026-03-26) para o **ciclo de refinamento do app shell** (padronização semântica de botões, SUPER PRIMARY no footer, PRIMARY/SECONDARY/TERTIARY, safe-area no footer, disabled unificado no Withdraw). **Gameplay** (`GameFinal.jsx`, `game-scene.css`, `game-shoot.css`) **não** foi alterado neste ciclo. |
| **Evidência** | Auditoria read-only `BLOCO-F-AUDITORIA-FINAL-BOTOES-READONLY-2026-03-26.md`; cirurgia `BLOCO-F-CIRURGIA-BOTOES-2026-03-26.md`; validação `BLOCO-F-VALIDACAO-FINAL-BOTOES-2026-03-26.md`; ajustes finais `BLOCO-F-AJUSTES-FINAIS-2026-03-26.md`; encerramento `BLOCO-F-ENCERRAMENTO-OFICIAL-2026-03-26.md`. Relatórios anteriores sobre overlays/stage (`RELATORIO-FINAL-BLOCOS-ATE-F-2026-03-18.md`, forenses Mar/2026) permanecem referência para a camada `/game`. |
| **Pendências (BLOCO F)** | Nenhuma **dentro do escopo** do refinamento app shell documentado em março/2026. Evoluções futuras de UI (novas telas, redesign) são **fora** deste encerramento. |
| **Riscos remanescentes** | Operacionais gerais de deploy/preview/I.5 descritos em `STATUS-GERAL-GOLDEOURO.md` — **não** invalidam o fecho documental do BLOCO F para UI shell. |
| **Fecho** | **FECHADO / VALIDADO** para: navegação interna, fluxos auth/financeiro/perfil, consistência de botões, acessibilidade visual mínima (safe-area footer). **Jogo** intocado por este ciclo. |

---

### BLOCO G — Fluxo do jogador

| Campo | Conteúdo |
|-------|-----------|
| **Status** | **Parcial / validado com ressalvas** (`AUDITORIA-POR-BLOCOS-LOCAL-VS-PRODUCAO-2026-03-08.md`, `BLOCO-G-FLUXO-JOGADOR-READONLY-2026-03-08.md`) |
| **Evidência** | Rotas `App.jsx`: login → dashboard → game; fluxos PIX em `Pagamentos.jsx`. |
| **Pendências** | Homologação ponta a ponta em ambiente único; dependências dos blocos A–F. |
| **Riscos remanescentes** | **Médio** (integração e percepção do utilizador). |
| **Fecho** | **Aberto** ao nível “fluxo G homologado 100%”. |

---

## 3. Documentos de referência — BLOCO F, UI, botões, layout interno

Lista **não exaustiva** (51+ ficheiros com padrão `BLOCO-F` em `docs/`), agrupada por tema:

| Tema | Exemplos de ficheiros |
|------|------------------------|
| Forense overlays / stage | `BLOCO-F-FORENSE-OVERLAYS-CAMADAS-GAME-2026-03-17.md`, `BLOCO-F-FORENSE-STAGE-SCALE-VIEWPORT-2026-03-17.md` |
| Correções cirúrgicas | `BLOCO-F-CORRECAO-1-CENTRALIZACAO-STAGE-2026-03-17.md`, `BLOCO-F-CORRECAO-2-OVERLAYS-CONTAINING-BLOCK-2026-03-17.md`, `BLOCO-F-CORRECAO-3-CENTRALIZACAO-OVERLAYS-ANIMACAO-2026-03-17.md` |
| Validação / encerramento | `BLOCO-F-VALIDACAO-FINAL-ABSOLUTA-SISTEMA-RESULTADO-2026-03-17.md`, `BLOCO-F-ENCERRAMENTO-FINAL-2026-03-09.md`, `FECHAMENTO-TOTAL-BLOCO-F-2026-03-08.md` |
| Interface geral / readonly | `BLOCO-F-INTERFACE-READONLY-2026-03-08.md`, `AUDITORIA-BLOCO-F-INTERFACE-2026-03-08.md` |
| Pagamentos / withdraw (build) | `BLOCO-F-PAGAMENTOS-READONLY-DETALHADO-2026-03-09.md`, `CORRECAO-BUILD-BLOCO-F-WITHDRAW-2026-03-16.md` |
| Preview / Vercel | `VALIDACAO-FINAL-PREVIEW-BLOCO-F-VERCEL-2026-03-16.md` |
| **Botões / auditoria e encerramento** | `BLOCO-F-AUDITORIA-FINAL-BOTOES-READONLY-2026-03-26.md`, `BLOCO-F-CIRURGIA-BOTOES-2026-03-26.md`, `BLOCO-F-VALIDACAO-FINAL-BOTOES-2026-03-26.md`, `BLOCO-F-AJUSTES-FINAIS-2026-03-26.md`, `BLOCO-F-ENCERRAMENTO-OFICIAL-2026-03-26.md` |

**Decisões já registadas (reconstrução):**

- Navegação interna **sem TopBar** com header “← MENU PRINCIPAL” e footer **“⚽ JOGAR AGORA”** — código em `InternalPageLayout.jsx`.  
- Overlays de resultado no **portal** `#game-overlay-root`, não dentro do stage com transform — vários relatórios forenses Mar/2026.  
- Glass / tema escuro como base do player — relatórios de interface; **nota:** evolução de `Pagamentos` para tema escuro glass (código atual) vs descrição antiga “tema claro” em relatório de 08/03.

---

## 4. Estado global do projeto (março 2026)

| Indicador | Valor |
|-----------|--------|
| **Produção** | Estável e em uso (`STATUS-GERAL-GOLDEOURO.md`). |
| **Promoção preview → produção** | Históricamente **bloqueada** por regressões visuais preview + I.5 não validada em ambiente — **revalidar** antes de qualquer deploy. |
| **Blocos A–C** | Validados (documentação). |
| **Bloco D** | Validado com ressalvas. |
| **Bloco E** | Estável; I.5 com validação ambiental pendente. |
| **Bloco F** | **FECHADO / VALIDADO** — refino app shell (botões, safe-area, etc.) concluído documentalmente em 2026-03-26; gameplay não afetado. |
| **Bloco G** | Parcial. |

---

## 5. Conclusão geral

O projeto encontra-se **funcional e auditado** nos domínios financeiro, apostas, auth e gameplay, com **ressalvas** em saldo/concorrência e **idempotência do cliente**. O **BLOCO F** está **FECHADO / VALIDADO** em 2026-03-26 para o **refinamento do app shell** (padronização de botões, ajustes safe-area e disabled), **sem alteração** a `GameFinal.jsx` nem CSS de jogo — ver `BLOCO-F-ENCERRAMENTO-OFICIAL-2026-03-26.md`. A camada **/game** (overlays, stage) continua coberta pelos relatórios técnicos anteriores; este ciclo **não** a substituiu nem a reabriu. O **fluxo global (G)** continua **dependente** da validação cruzada dos blocos e de decisões de deploy (incl. I.5), **à parte** do encerramento documental do BLOCO F para UI shell.

---

*Documento atualizado em 2026-03-26 com o encerramento oficial do BLOCO F (app shell). Alterações de código referidas nos relatórios BLOCO-F-* já aplicadas no repositório.*
