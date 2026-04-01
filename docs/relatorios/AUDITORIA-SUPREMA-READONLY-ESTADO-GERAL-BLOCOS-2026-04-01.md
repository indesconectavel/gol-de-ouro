# AUDITORIA SUPREMA READ-ONLY — ESTADO GERAL DO PROJETO

**Data da auditoria:** 2026-04-01  
**Repositório:** `goldeouro-backend`  
**Modo:** somente leitura — inspeção local de código e documentação; sem deploy, sem alteração de banco, sem execução de smoke contra produção nesta sessão.  
**Nota de nomenclatura:** este documento usa as letras **A–I** e **S** conforme o pipeline oficial da auditoria. O ficheiro `RELATORIO-MESTRE-STATUS-BLOCOS-2026-03-31.md` usa outra matriz (ex.: **G = Segurança/Antifraude**, **F = Frontend**); existe ainda o handoff com **G = Gameplay** e **F = Financeiro**. A secção 4 referencia explicitamente essas convenções para evitar ambiguidade.

---

## 1. Resumo executivo

- **Visão geral objetiva do projeto hoje:** O **Gol de Ouro** é um monorepo centrado no backend **Node.js + Express** (`server-fly.js`, `package.json` versão **1.2.0**), com **Supabase/Postgres**, **Mercado Pago (PIX/webhook)** e **JWT**. No mesmo repositório existem **`goldeouro-player/`** (frontend), **`goldeouro-admin/`** (painel) e artefactos adicionais (`ops/`, `goldeouro-mobile/`, etc.). A documentação em `docs/relatorios` descreve **produção** em **Fly.io** (`fly.toml`: app **`goldeouro-backend-v2`**, região **gru**) e validações HTTP recentes para auth, gameplay (`POST /api/games/shoot`), saque e correções de schema em `public.chutes` (V1 + colunas `*_legacy*`).
- **Classificação geral:** **OPERÁVEL COM RESSALVAS** — alinhado ao handoff `ESTADO-ATUAL-SISTEMA-HANDOFF-2026-04-01.md` e ao relatório mestre (blocos núcleo em geral “concluídos com ressalvas”). Não se afirma “pronto para escala agressiva” nem “coeso em todos os domínios de produto/compliance”.
- **Situação operacional:** **Facto documental (não reexecutado aqui):** `REVALIDACAO-FINAL-GAMEPLAY-POS-DIRECAO-LEGACY-2026-04-01.md` regista **HTTP 200** em shoot em produção após DDL em `resultado_legacy_jsonb` e `direcao_legacy_int`. Saque **201** e PIX real com ressalvas aparecem noutros relatórios citados no handoff. **Evidência insuficiente nesta sessão** para afirmar que o estado live atual é idêntico ao do último teste documentado sem novo smoke.

---

## 2. Fontes de verdade utilizadas

### Documentos lidos

| Documento | Uso |
|-----------|-----|
| `ESTADO-ATUAL-SISTEMA-HANDOFF-2026-04-01.md` | Handoff, linha do tempo, status por domínio, riscos, pendências. |
| `RELATORIO-MESTRE-STATUS-BLOCOS-2026-03-31.md` | Matriz por blocos (A–J, S); **data anterior** às revalidações de gameplay de 2026-04-01 — cruzar com handoff para gameplay. |
| `BLOCO-S-DISTRIBUICAO-ESCALA-ANALISE-2026-04-01.md` | Distribuição, URLs, deploy, compliance, monetização ilustrativa, riscos de escala. |
| `INDICE-RELATORIOS-V1.md` | Índice para env, endpoints, deploy, smoke. |
| `REVALIDACAO-FINAL-GAMEPLAY-POS-DIRECAO-LEGACY-2026-04-01.md` | Prova shoot 200 pós-correção legado. |
| `README.md` (raiz) | Declarações de produto — útil para detetar **drift** face aos relatórios de ressalvas. |

### Diretórios inspecionados

- Raiz: `package.json`, `server-fly.js`, `fly.toml`, `Dockerfile`, `.env.example` (ou `env.example` referido no README), `.gitignore`
- `database/` — inventário de ficheiros `.sql`
- `goldeouro-player/`, `goldeouro-admin/` — presença e `package.json`
- `.github/workflows/` — pipelines CI/deploy

### Arquivos críticos analisados

- `server-fly.js` — rotas `/api/auth/*`, `/api/games/shoot`, `/api/payments/*`, `/api/withdraw/*`, `/health`; estado `lotesAtivos`, `contadorChutesGlobal`, `batchConfigs`, `idempotencyProcessed` (amostragem por grep).

---

## 3. Estrutura real atual do projeto

### Backend

- **Entrada:** `server-fly.js`; `package.json`: `"main": "server-fly.js"`, scripts `start` / `dev`.
- **Deploy Fly:** `fly.toml` — `app = "goldeouro-backend-v2"`, `primary_region = "gru"`, `internal_port = 8080`, build via `Dockerfile`.
- **Dependências relevantes (amostra):** `express`, `@supabase/supabase-js`, `helmet`, `express-rate-limit`, `jsonwebtoken`, `bcryptjs`, etc.

### Frontend player

- **`goldeouro-player/`** — presente no repositório com `package.json` (React/Vite conforme README raiz). PWA/manifest: **evidência de manifest neste repo** = não verificada na raiz do backend; o README afirma PWA — **possível drift** se a prova estiver só no build do player.

### Admin / painel

- **`goldeouro-admin/`** — presente; relatório mestre cita painel como bloco **J**.

### Banco / scripts / migrations

- **`database/`:** `schema.sql`, `rpc-financeiro-atomico-2026-03-28.sql`, `migration-2026-03-31-chutes-v1-align.sql`, `migration-2026-04-01-chutes-direcao-legacy-int-nullable.sql`, `migration-2026-04-01-chutes-resultado-legacy-jsonb-nullable.sql`, entre outros.
- **Drift Git (facto verificado em 2026-04-01):** `git status` mostra **`??`** (não rastreados) para as duas migrações `migration-2026-04-01-*.sql` e para vários relatórios em `docs/relatorios/`, incluindo este ficheiro de auditoria. **Impacto:** clone/checkout sem estes ficheiros não reproduz o conjunto documentado até integração no controlo de versões.

### Deploy / infra

- **Fly + Docker** na raiz; **GitHub Actions** em `.github/workflows/` (ex.: `backend-deploy.yml`, `frontend-deploy.yml`, `main-pipeline.yml`, `rollback.yml`, `health-monitor.yml`).

### Integrações externas

- **Supabase**, **Mercado Pago**, **JWT** — referenciados em código e `.env.example` / inventários em `docs/relatorios`.

### Outros

- Pastas como `goldeouro-mobile/`, `player-dist-deploy/`, `ops/` — existem no tree; relevância para distribuição documentada de forma esparsa.

---

## 4. Status consolidado por bloco

*Convenção desta secção: letras **A–I** e **S** do pedido de auditoria. Onde o `RELATORIO-MESTRE-STATUS-BLOCOS-2026-03-31.md` usa letra diferente, indica-se.*

### BLOCO A — Financeiro

| Dimensão | Conteúdo |
|----------|----------|
| **Objetivo** | PIX, webhook, crédito de saldo, reconciliação, taxas alinhadas a RPC/SQL. |
| **Estado documentado** | Crédito PIX real com **ressalvas** de cobertura de log (`VALIDACAO-FINAL-FINANCEIRO-REAL-PRODUCAO-2026-03-31.md`, citado no handoff). Ruído de webhooks inválidos mencionado. |
| **Evidência encontrada** | Rotas de pagamentos e variáveis em `server-fly.js` / `.env.example`; SQL `database/rpc-financeiro-atomico-2026-03-28.sql`. |
| **Riscos ativos** | Dependência MP; assinaturas inválidas / ruído; divergência futura taxa Node vs SQL se env mudar sem alinhamento (citado no handoff). |
| **Pendências** | Prova documental de jornada **só com saldo originado por PIX** (sem crédito manual) se for requisito interno. |
| **Classificação atual** | **OPERÁVEL COM RESSALVAS** |

*No relatório mestre, o bloco **A** também é Financeiro — alinhado.*

### BLOCO B — Sistema de apostas / engine

| Dimensão | Conteúdo |
|----------|----------|
| **Objetivo** | Lotes, ordem de gol, contador global, prémios, regras de chute. |
| **Estado documentado** | Engine ativa; risco estrutural ao escalar horizontalmente (estado em memória). |
| **Evidência encontrada** | `server-fly.js`: `lotesAtivos = new Map()`, `contadorChutesGlobal`, `batchConfigs`, `idempotencyProcessed` como `Map` em memória. |
| **Riscos ativos** | **Alto** para multi-instância: lotes, contador e idempotência não partilhados entre VMs. Métricas carregadas de BD ao arranque mitigam parcialmente o contador (há referências a `contador_chutes_global` em métricas) — **comportamento exato sob várias réplicas: necessita validação runtime**. |
| **Pendências** | Estratégia explícita vertical vs horizontal; eventual redis/DB para estado de jogo. |
| **Classificação atual** | **FUNCIONAL NO PERFIL ATUAL / RISCO ESTRUTURAL NA ESCALA HORIZONTAL** |

### BLOCO C — Autenticação

| Dimensão | Conteúdo |
|----------|----------|
| **Objetivo** | Registo, login, JWT, rotas protegidas. |
| **Estado documentado** | **200** em login e encadeamento com shoot/saque nos relatórios de validação. |
| **Evidência encontrada** | Rotas `/api/auth/register`, `/api/auth/login`, middleware de token, `GET /api/user/profile`. |
| **Riscos ativos** | Misturar `JWT_SECRET` entre ambientes (alerta em diagnósticos referenciados no BLOCO S). |
| **Pendências** | Manter um único contrato de runtime em produção. |
| **Classificação atual** | **FUNCIONAL NO ÂMBITO DOCUMENTADO** |

### BLOCO D — Sistema de saldo / consistência

| Dimensão | Conteúdo |
|----------|----------|
| **Objetivo** | Débito/crédito coerente, atomicidade, integridade vs `usuarios.saldo`. |
| **Estado documentado** | Crédito por RPC comprovado; relatório mestre (2026-03-31) apontava lacunas de prova numérica do ciclo total — parcialmente supridas por relatórios posteriores, mas **prova única contínua** pode ser lacuna (handoff). |
| **Evidência encontrada** | Uso de Supabase nas rotas; logs `[SHOOT-ROLLBACK]` indicam tratamento de corrida. |
| **Riscos ativos** | Corridas saldo vs operação; ordem deploy/SQL (já documentada como problema histórico). |
| **Pendências** | Opcional: relatório único com saldo antes/depois em sequência controlada. |
| **Classificação atual** | **CONSISTENTE COM RESSALVAS** |

### BLOCO E — Gameplay

| Dimensão | Conteúdo |
|----------|----------|
| **Objetivo** | Chute debitado, persistência em `chutes`, resultado, integração com lote. |
| **Estado documentado** | **200** após DDL legado (`REVALIDACAO-FINAL-GAMEPLAY-POS-DIRECAO-LEGACY-2026-04-01.md`); teste usou **crédito R$ 30 via service role** (explicitado no relatório). |
| **Evidência encontrada** | Rota `POST /api/games/shoot`, inserts em `chutes` no código. |
| **Riscos ativos** | Colunas `NOT NULL` sem default em tabela híbrida legado/V1 — risco **23502** se schema divergir; teste não substitui funil só-PIX. |
| **Pendências** | Smoke periódico; opcional matriz de cenários com saldo só via PIX. |
| **Classificação atual** | **FUNCIONAL EM PRODUÇÃO (EVIDÊNCIA DOCUMENTAL 2026-04-01) COM RESSALVAS** |

*No relatório mestre, **E** também é Gameplay — alinhado.*

### BLOCO F — Interface / UI/UX

| Dimensão | Conteúdo |
|----------|----------|
| **Objetivo** | Player e experiência; coerência com API e mensagens. |
| **Estado documentado** | Relatório mestre: **F = Frontend/Player**, “em evolução”. |
| **Evidência encontrada** | Pasta `goldeouro-player/`; não foi feita revisão UI linha a linha nesta auditoria. |
| **Riscos ativos** | Contrato API vs exibição; métricas com ressalvas históricas (documental). |
| **Pendências** | Alinhamento contínuo com contrato V1. |
| **Classificação atual** | **EM EVOLUÇÃO / PARCIAL** |

### BLOCO G — Fluxo do jogador

| Dimensão | Conteúdo |
|----------|----------|
| **Objetivo** | Cadastro → depósito → jogo → saque como jornada única. |
| **Estado documentado** | Descrito logicamente em `BLOCO-S-DISTRIBUICAO-ESCALA-ANALISE-2026-04-01.md` e handoff; prova **única** só com PIX pode ser lacuna. |
| **Evidência encontrada** | Cadeia de rotas no backend; **E2E não executado nesta sessão**. |
| **Riscos ativos** | Fragmentação de evidência entre relatórios (PIX, shoot, saque em documentos distintos). |
| **Pendências** | Opcional: um relatório único com timestamps e saldo só via PIX. |
| **Classificação atual** | **LÓGICA COESA NO CÓDIGO; EVIDÊNCIA OPERACIONAL PARCIAL POR RELATÓRIO** |

***Drift de nomenclatura:** no `RELATORIO-MESTRE-STATUS-BLOCOS-2026-03-31.md`, **G = Segurança/Antifraude**, não “fluxo do jogador”. Para **segurança/antifraude** (webhook, rate limit, helmet): ver riscos transversais e código (`helmet`, `express-rate-limit` em `package.json`).*

### BLOCO H — Economia / retenção

| Dimensão | Conteúdo |
|----------|----------|
| **Objetivo** | Retenção, promoções, economia alargada além do núcleo de lotes. |
| **Estado documentado** | Relatório mestre: **em aberto/parcial**. |
| **Evidência encontrada** | Prémios e `batchConfigs` em `server-fly.js`; frente de “retenção produto” não mapeada em profundidade nesta leitura. |
| **Riscos ativos** | Expectativa de LTV/CAC sem base documental no repo. |
| **Pendências** | Etapa dedicada quando houver mandato de produto. |
| **Classificação atual** | **PARCIAL / NÃO FECHADO** |

### BLOCO I — Escalabilidade

| Dimensão | Conteúdo |
|----------|----------|
| **Objetivo** | Multi-instância, carga, resiliência. |
| **Estado documentado** | Parcial — estável no perfil atual; gargalo de estado em memória (relatório mestre, BLOCO S). |
| **Evidência encontrada** | Maps em memória para lotes e idempotência; Fly com réplicas possíveis — **comportamento multi-máquina: necessita validação**. |
| **Riscos ativos** | Escalar horizontalmente sem estado partilhado. |
| **Pendências** | Plano técnico (vertical vs redis/DB/outro). |
| **Classificação atual** | **INADEQUADO PARA ESCALA HORIZONTAL PLENA SEM REDESENHO** |

### BLOCO S — Distribuição / escala / compliance / monetização externa

| Dimensão | Conteúdo |
|----------|----------|
| **Objetivo** | Lojas, B2B, parceiros, compliance, canais externos. |
| **Estado documentado** | **Parcialmente preparado**; Web/PWA com crescimento controlado; lojas e B2B exigem compliance e `partner_id` (não fechado). |
| **Evidência encontrada** | API HTTP genérica; **sem** feature B2B/`partner_id` evidenciada como produto fechado nos documentos analisados. |
| **Riscos ativos** | Real money e políticas Apple/Google; “thin app”; mandato jurídico ausente no repositório. |
| **Pendências** | Parecer jurídico; roadmap B2B se aplicável. |
| **Classificação atual** | **PARCIAL — ESTRATÉGIA DOCUMENTADA, EXPANSÃO PLENA NÃO FECHADA** |

### Bloco adicional documentado: **J — Painel / Admin**

| Dimensão | Conteúdo |
|----------|----------|
| **Objetivo** | Operação administrativa. |
| **Estado documentado** | Relatório mestre: concluído com ressalvas. |
| **Evidência encontrada** | `goldeouro-admin/`; superfícies admin em `server-fly.js` (amostra). |
| **Classificação atual** | **OPERÁVEL COM RESSALVAS** |

---

## 5. Divergências entre documentação e código

| # | Divergência | Gravidade | Impacto provável |
|---|-------------|-----------|------------------|
| 1 | `README.md` declara **“100% Funcional e Pronto para Produção”** vs relatórios que descrevem **ressalvas**, riscos de escala e BLOCO S não pronto para expansão agressiva | Média | Expectativas de stakeholders desalinhadas. |
| 2 | `RELATORIO-MESTRE-STATUS-BLOCOS-2026-03-31.md` (data **2026-03-31**) ainda listava lacunas de prova de chute na mesma rodada que documentos de **2026-04-01** já parcialmente suprimem (shoot 200 documentado) | Baixa a média | **Drift temporal:** usar handoff + revalidação como fontes primárias para gameplay após abril. |
| 3 | Convenção de letras **A–G** difere entre **pipeline desta auditoria** e **`RELATORIO-MESTRE`** (ex.: **G**) | Baixa | Risco de comunicação cruzada entre equipas. |
| 4 | Migrações `migration-2026-04-01-*.sql` e vários relatórios aparecem como **não rastreados** no `git status` local verificado | Alta (processo) | Risco de reprodutibilidade e de ambientes divergentes. |
| 5 | README afirma **PWA**; análise BLOCO S indica que **manifest** não foi confirmado neste repositório backend | Média | Afirmação de PWA pode residir só no `goldeouro-player` — **validação no frontend**. |
| 6 | Handoff usa **G** para Gameplay e **F** para Financeiro; relatório mestre usa **E** Gameplay e **A** Financeiro — **três convenções** em documentos distintos | Média (comunicação) | Exige glossário ou documento âncora por sprint. |

---

## 6. Riscos estruturais atuais

### Financeiro

- Dependência **Mercado Pago**; contestações e spreads.
- Webhook: ruído, chamadas inválidas, cobertura de logs incompleta em alguns subfluxos (documental).

### Engine

- `lotesAtivos`, `idempotencyProcessed` e parte da lógica de jogo em **memória de processo**.
- Contador global com persistência parcial via métricas — **consistência multi-réplica: hipótese a validar**.

### Autenticação

- Segregação rigorosa de **JWT** e segredos por ambiente.

### Gameplay

- Schema híbrido V1/legado: risco **23502** se novas constraints **NOT NULL** sem default.
- Testes com injeção de saldo (service role) **não** provam o funil comercial puro.

### UI/UX

- Dependência de alinhamento contínuo com mudanças de API e mensagens de erro.

### Escala

- Gargalo principal técnico para **horizontal scaling**: estado não partilhado da engine e idempotência em memória.

### Produção / deploy

- Disciplina **SQL antes de deploy** — já falhou em sessão documentada.
- **Drift Git** em migrações e relatórios críticos.

### Compliance / distribuição

- Real money: enquadramento jurídico **não** fechado no repositório.
- Lojas **Apple/Google**: alto risco sem licenciamento/categoria adequada (documental).

---

## 7. O que já está sólido

- **Superfície de API núcleo** documentada em mapas e implementada (auth, pagamentos, shoot, withdraw, health).
- **Cirurgia recente `chutes` V1 + legado** com evidência documental de shoot **200** após DDL (`REVALIDACAO-FINAL-...`).
- **RPC/fallback financeiro** e correção **23502** `net_amount` no saque — descritos como resolvidos no caminho validado.
- **Infra baseline:** Fly + Docker + health check; dependências de segurança base (`helmet`, rate limit).

---

## 8. O que ainda impede evolução segura

1. **Escala horizontal** sem resolver estado da engine e idempotência distribuída (ou decisão explícita de escala vertical).
2. **Governança B2B/compliance** (BLOCO S) — bloqueio estratégico-legal, não só técnico.
3. **Rastreabilidade Git** dos SQL e relatórios finais de abril — **drift** entre clone local e “verdade operacional” descrita.
4. **Prova operacional única** PIX → jogo → saque com utilizador real — se for gate interno, pode permanecer lacuna (handoff).

---

## 9. Priorização executiva

### Top 3 ações mais importantes agora

1. **Integrar no fluxo oficial de versionamento** (commit/branch acordado) migrações `migration-2026-04-01-*.sql` e relatórios de handoff relevantes — **ação de processo**, para alinhar repositório ao estado descrito.
2. **Smoke documentado periódico** em produção: login → profile → shoot mínimo → verificação de linha em `chutes` (checklist do handoff).
3. **Decisão explícita de escala:** vertical vs horizontal; se horizontal, **spike** de arquitetura para estado de jogo (sem implementação nesta etapa de diagnóstico).

### Top 3 ações que podem esperar

1. **White-label / `partner_id`** — até mandato comercial/jurídico.
2. **App Store / EAS** — até parecer jurídico.
3. **Economia de retenção avançada (BLOCO H)** — após estabilizar núcleo e observabilidade.

### Top 3 áreas que não devem sofrer retrabalho neste momento

1. **Direção “schema V1 + colunas `*_legacy*`”** sem plano de migração de dados (handoff: não reverter à pressa).
2. **Contrato RPC saque com `fee`/`net_amount`** alinhado ao SQL atual.
3. **Fluxo JWT único em produção** — evitar dois mundos de auth.

---

## 10. Diagnóstico final do projeto

**OPERÁVEL COM RESSALVAS**

Não **PRONTO PARA ESCALA CONTROLADA** no sentido de tráfego agressivo + multi-instância + B2B/lojas sem mitigadores acima. Não **AINDA NÃO ESTÁ COESO** no sentido de núcleo inexistente — o núcleo está documentado como validado com ressalvas.

---

## 11. Conclusão objetiva

- **Estágio real:** Produto **em produção** com **núcleo técnico funcional** (auth, pagamentos, gameplay, saque) **validado por relatórios datados**, porém com **ressalvas** (prova de funil só-PIX, escala da engine, compliance externo, ruído de webhook, risco de schema legado, **drift Git** em artefactos críticos).
- **Próximo passo do pipeline:** **Etapa 2 — validação operacional e consolidação de verdade** (não diagnóstico read-only): (a) fechar **versionamento** dos artefactos de abril no Git; (b) executar **smoke runtime** com checklist do handoff; ou (c) **spike de escala** se a decisão de negócio for crescer horizontalmente. **Não** iniciar refatoração ampla nem “cirurgia” sem mandato explícito e novo relatório datado.

---

*Fim da auditoria suprema read-only. Nenhum deploy nem alteração de base de dados foi executado nesta sessão de análise.*
