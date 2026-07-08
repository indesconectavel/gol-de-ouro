# H2A — Auditoria Suprema do Ambiente Staging™ e Integridade Arquitetural

**Projeto:** Gol de Ouro™ V1  
**Engine:** Indesconectável Payment Engine™  
**Gate:** H2A  
**Data:** 2026-07-08  
**Modo:** READ_ONLY_ABSOLUTO  
**Prioridade:** MÁXIMA  
**Base:** H0 · H1 · H2 · G2 (certificação staging) · S3/S3.3 · A2R · `fly.toml` / `fly.staging.toml`  
**Snapshot:** `docs/relatorios/snapshots/h2a-staging-supreme-audit.json`

---

## Declarações limitadoras

1. Este gate é **somente auditoria**. Nenhuma mutação de código, Git, Fly, Supabase, Vercel, secrets, banco, workflows ou runtime.
2. Runtime **live em 08/07/2026** não foi reconsultado via Fly/HTTP neste gate; conclusões de ambiente usam **evidências documentadas** (G2 @ 2026-07-06, A2R @ 2026-07-07, snapshots). Qualquer estado posterior = **"Sem evidência suficiente neste H2A."**
3. Entregáveis: **apenas** este relatório + snapshot JSON (padrão da série H0–H2). Nenhum outro arquivo.

---

## PERGUNTA MÃE

> A arquitetura construída continua coerente com a estratégia definida para transformar a Indesconectável Payment Engine™ em um ativo tecnológico independente?

# **SIM COM RESSALVAS**

**Justificativa:** A PE mantém identidade, factory multi-PSP, fachada P2.2, Recovery certificado (P1.9) e staging permanente como **bancada de homologação isolada** — alinhado à evolução para ativo independente. Ressalvas: PE **ainda embutida** no monólito Gol de Ouro; staging certifica baseline **`b29d847`**, não necessariamente o tip patrimonial P2.2/`d188ca6`; Asaas sandbox no staging **ainda não resolvível** (A2R pendente); produto independente (SDK/API/SaaS) permanece roadmap.

---

## Veredito do gate

# **PASS COM RESSALVAS**

| Campo | Valor |
|-------|-------|
| Arquitetura íntegra? | **SIM COM RESSALVAS** |
| Staging faz sentido? | **SIM** |
| Drift docs/código/runtime/infra/estratégia? | **SIM — parcial (esperado + documental + baseline SHA)** |
| Pronto para H2.5? | **SIM COM RESSALVAS** (gates de higiene Asaas/A2R + sync docs) |
| Pronto para H3? | **SIM COM RESSALVAS** (H2: não valuing sobre DR-02 desatualizado sem bridge) |

---

# ETAPA 1 — Auditoria Arquitetural

## Componentes (existência e papel)

| Camada | Evidência | Maturidade observada |
|--------|-----------|----------------------|
| Provider Layer | `src/finance/factory/FinanceProviderFactory.js`, providers Asaas/MP/Celcoin/Mock | Alta |
| PSP Abstraction | contratos `PaymentProvider`/`PayoutProvider`, ADR-002, `primary-psp.js` | Alta |
| Runtime Layer | `server-fly.js` + Fly processos | Média-alta (monólito) |
| Recovery Layer | `asaasPayoutRecovery` + scheduler; P1.9 GOLD | Alta (prod homologada) |
| Payment Engine facade | `src/payment-engine/api/PaymentEngine.js` (P2.2) | Média-alta |
| Compat Layer | `src/finance/compat/*` | Necessária / débito |
| Workers | `src/workers/payout-worker.js` + `fly.toml` | Alta em prod; OFF em staging (design) |
| Gates | flags Asaas/PIX OUT/webhook | Alta |
| Observabilidade | `/health`, `/meta`, `/health/workers`, snapshots | Alta forense |
| Ledger / Wallet | `ledger_financeiro` + `usuarios.saldo` + adapters | Alta; **acoplados ao produto** |

## Respostas estruturais

| Pergunta | Resposta |
|----------|----------|
| Existe separação arquitetural suficiente? | **SIM COM RESSALVAS** — separação **conceitual e de pastas** forte (`src/finance`, `src/payment-engine`); separação **de processo/deployável** incompleta |
| Existe acoplamento excessivo? | **SIM** — HTTP/claim/schema Gol de Ouro (A1.0, H0, H1) |
| O monólito ainda é justificável? | **SIM** para V1 operacional e risco controlado; **não** como estado final da estratégia de ativo independente |

---

# ETAPA 2 — Auditoria do Ambiente Staging

## Identidade (evidência G2 / S3.3)

| Item | Valor documentado |
|------|-------------------|
| App Fly | `goldeouro-backend-staging` |
| Config | `fly.staging.toml` |
| URL | `https://goldeouro-backend-staging.fly.dev` |
| Baseline | tag `payment-engine-v1-runtime-baseline` @ `b29d847` |
| `NODE_ENV` / `DATABASE_ENV` | `staging` |
| Processos | **somente `app`** — sem `payout_worker` |
| Memória | 512 MB |
| Health check | `GET /health` |
| Supabase | `uatszaqzdqcwnfbipoxg` (isolado; produção `gayopagjdrkcmkirmfvy`) |
| Workflow deploy | `.github/workflows/backend-deploy-staging.yml` (`workflow_dispatch`) |
| Env example | `.env.local.staging.example` |

## Runtime certificado (G2 @ 2026-07-06)

| Probe | Resultado |
|-------|-----------|
| `/meta` | `environment=staging`, `gitCommit=b29d847`, tag baseline |
| `/health` | `ok`, DB connected, `asaasEnv=sandbox`, `asaasProductionEnabled=false`, MP disconnected |
| `/health/workers` | payout worker **OFF** |
| Payment Engine snapshot | primary arquitetural `asaas`; provider efetivo `mercadopago` legacy; `asaasPaymentProviderResolvable=false` |

## A2R (2026-07-07)

Objetivo de tornar Asaas sandbox **resolvível** no staging **não concluído** (`asaasPaymentProviderResolvable` permanece `false`; comandos do operador não executados — snapshot `a2r-runtime-health.json`).

## Comparação documental com produção (manifests)

| Dimensão | Staging (`fly.staging.toml`) | Produção (`fly.toml`) |
|----------|------------------------------|------------------------|
| App | `goldeouro-backend-staging` | `goldeouro-backend-v2` |
| NODE_ENV | staging | production |
| Processos | `app` | `app` + `payout_worker` |
| Restart worker | ausente | `always` no payout_worker |
| Memória | 512 | 256 |
| Start cmd | `node server-fly.js` | `npm start` |

**Conclusão Etapa 2:** Staging **existe como homologação permanente** (S3.3 + G2). Perfil **seguro por design** (workers OFF, sandbox, gates OFF). Lacuna operacional: **Asaas key/sandbox wiring incompleto** (A2R).

---

# ETAPA 3 — Comparação Staging × Produção

Fonte primária: G2 certificação + snapshot `g2-certificacao-staging-2026-07-06.json` (+ A2R para Asaas).

| Dimensão | Staging (G2) | Produção (G2) | Esperada? | Notas |
|----------|--------------|---------------|:---------:|-------|
| **Runtime** SHA | `b29d847` | `f21f310-p5pixout` | ✅ | Baselines distintas de propósito |
| **Provider** efetivo | MP legacy | Asaas primary (G2) | ✅ | Staging sem `ASAAS_API_KEY` |
| **Workers** | OFF / sem processo Fly | ON | ✅ | Design S3 |
| **Payment Engine** | Boot + snapshot; sandbox | Produção gated | ✅ | Mesma arquitetura, ENV diferente |
| **Recovery** | Código presente; PIX OUT batch off | Operacional (P1.9 evidência separada) | ✅ parcial | Staging não exercita PIX OUT real |
| **Webhooks** | Rotas existem; POST não exercitado no G2 | Prod HMAC live (V1.1*) | ✅ | Diff de exercício, não de ausência |
| **PIX IN** | Estrutura; MP disconnected; Asaas não resolvível | MP/Asaas conforme gates | ⚠️ | Esperado parcial; A2R incompleto |
| **PIX OUT** | Desligado | Habilitado (G2) | ✅ | |
| **Observabilidade** | `/health` `/meta` monitoring | Equivalente | ✅ | |
| **Configuração** | `fly.staging.toml` + secrets staging | `fly.toml` + secrets prod | ✅ | |
| **Infraestrutura** | App + Supabase separados | App + Supabase prod | ✅ | Isolamento G1.5/G2 |

### Diferenças esperadas
Isolamento app/DB/ENV; workers OFF; sandbox Asaas; SHA baseline ≠ prod; MP disconnected em staging; volume de dados (4 vs 470 users).

### Diferenças inesperadas / fricção
| Item | Severidade |
|------|:----------:|
| `/api/production-status` semanticamente confuso em staging (G2) | Baixa |
| `asaasPaymentProviderResolvable=false` após S3.3 (bloqueia sandbox PE completo) | **Média–Alta** |
| Endpoint `/api/debug/token` exposto em staging (401) vs 404 em prod | Baixa (localizado) |
| Doc `HOMOLOGACAO-PERMANENTE.md` header ainda “Fly pendente” após S3.3/G2 | **Média (doc drift)** |

### Drift encontrado

1. **Drift esperado (bom):** staging ≠ produção por isolamento.  
2. **Drift operacional:** Asaas sandbox não ativado (A2R).  
3. **Drift de baseline estratégica:** staging congela `b29d847`; série patrimonial H0/H1 e P2.2/`d188ca6` / P1.9 não são o SHA do staging — staging valida **runtime baseline tagged**, não o tip completo do ativo patrimonial.  
4. **Drift documental:** Data Room (H2) e trechos de homologação desatualizados vs G2/P1.9.

---

# ETAPA 4 — Auditoria Git

Evidência: `git1-repository-state.json`, GIT.2, G2 §11, status de workflows.

| Tema | Achado |
|------|--------|
| Branch trabalho (GIT.1) | `chore/f2-4e-2-mp-log` @ `b29d847` |
| Merge | **Pendente** `origin/main` (`22f75f71`) — GIT.2 |
| Working tree | Sujo + untracked volumoso (histórico PE.PATRIMÔNIO) |
| Workflows staging | `backend-deploy-staging.yml`, `a2r-staging-asaas-sandbox.yml` (dispatch; anti-prod) |
| Deploy produção | `backend-deploy.yml` → `goldeouro-backend-v2` |
| Risco R7 histórico | branch `dev` podendo publicar no **mesmo** app prod (G2/H3-6A) — governança |
| Rollback | Documentado S3; `rollback.yml` em exemplos/workflows |

| Pergunta | Resposta |
|----------|----------|
| Risco operacional? | **SIM** — merge pendente + workflow `dev→prod` histórico + secrets locais |
| Divergência arquitetural no Git? | **SIM COM RESSALVAS** — tip trabalho ≠ tip patrimonial P2.2 em alguns eixos; staging pinado em `b29d847` |
| Dívida técnica? | **SIM** — monólito, compat, WIP finance histórico |
| Dívida documental/Git? | **SIM** — untracked / merge / doc homologação |

**H2A não executou Git.** Estado pós-07/07 = sem evidência suficiente se resolvido.

---

# ETAPA 5 — Auditoria Fly

| Pergunta | Resposta baseada em evidência |
|----------|-------------------------------|
| Apps distintos? | **SIM** — staging vs `goldeouro-backend-v2` |
| `fly.staging.toml` correto ao plano? | **SIM** — app only, NODE_ENV staging, sem worker |
| `fly.toml` prod representa arquitetura planejada? | **SIM** — app + payout_worker |
| Arquitetura Fly = arquitetura PE planejada? | **SIM COM RESSALVAS** — Fly hospeda o **monólito que contém** a PE; não há serviço Fly “IPE-only” |

A topologia Fly **representa corretamente o plano de homologação permanente** (dois apps, isolamento). **Não** representa ainda um deploy de Payment Engine como unidade independente.

---

# ETAPA 6 — Auditoria da Payment Engine™

| Capacidade | Staging (G2/A2R) | Prod / certs | Maturez |
|------------|------------------|--------------|---------|
| Provider Layer | Snapshot OK; Asaas não resolvível | Factory prod | Alta / gap sandbox key |
| Recovery | Código; OUT off | P1.9 PASS | Alta |
| Runtime | Boot staging | Fly v2 | Alta |
| Facade P2.2 | No código baseline auditado | Commit `d188ca6` série PE | Média-alta |
| Abstração PSP | `asaas` architectural | ADR-002 | Alta |
| Compat | Presente | Presente | Débito consciente |
| Idempotência | Código + certs | P1.9 | Alta |
| Webhook Engine | Rotas; POST skip G2 | Hardened prod | Alta |
| Workers | OFF | ON | Design |
| Dry Run / Gates | Gates OFF sandbox | Produção gated | Alta |
| Certificações | G2 staging + F4.Z / P1.9 | V1.6 + H0 | Alta |

### O núcleo já pode ser considerado ativo reutilizável?

# **SIM COM RESSALVAS**

Reutilizável como **núcleo/module** (H0/H1/A1.0). **Não** como produto empacotado independente (npm/API/multi-tenant) sem evolução adicional.

---

# ETAPA 7 — Objetivo Estratégico do Staging

### Objetivo original (evidência `HOMOLOGACAO-PERMANENTE.md` / S3)

Homologação **permanente** (não temporária) para: certificar PE continuamente; validar tags baseline; auditorias/DD; demos; rollback só em staging; evolução V2 — **sem tocar produção**.

### Ainda estamos usando staging para isso?

# **SIM**

S3.3 + G2 cumpriram a criação/certificação da bancada. A2R aponta o próximo uso (sandbox Asaas). Não há evidência de abandono do propósito.

### Houve mudança de direção?

# **NÃO (desvio leve de escopo, não de missão)**

A série H0–H2 deslocou foco para **empacotamento patrimonial / Data Room**, enquanto staging permanece **infra de prova runtime**. Complementar, não contraditório. Ressalva: narrativa patrimonial avança em SHAs/docs que o staging **ainda não reexecutou** como baseline pinada.

---

# ETAPA 8 — Desacoplamento (opções)

| Opção | Veredito H2A | Justificativa |
|-------|--------------|---------------|
| **A** Manter PE só no monólito | **Aceitável curto prazo; insuficiente à estratégia** | Opera V1; trava licenciamento |
| **B** Módulo interno (facade/adapters) | **RECOMENDADO AGORA** | P2.2 já iniciou; menor risco; staging valida |
| **C** Pacote (npm interno) | **Próximo passo natural pós-B** | Exige contratos estáveis + CI do pacote |
| **D** Repositório próprio | **PREMATURO** | Sem segundo consumidor; custo governança |
| **E** Produto independente (SaaS/WL) | **PREMATURO** | PE.VALOR: falta packaging + 2º cliente |

**Recomendação técnica:** continuar **B → C**; usar staging como prova de regressão a cada extração; **não** saltar para D/E sem cliente âncora externo.

---

# ETAPA 9 — Patrimônio Tecnológico gerado pelo Staging

### O staging aumentou o patrimônio?

# **SIM**

### Quanto? (qualitativo)

| Ativo nascido / consolidado graças à linha S/G/A2R | Tipo |
|----------------------------------------------------|------|
| `fly.staging.toml` + app dedicado | Infra |
| Workflow `backend-deploy-staging.yml` | Pipeline |
| Workflow `a2r-staging-asaas-sandbox.yml` | Pipeline seguro |
| Docs S1–S3.3, G1.5, G2, A2R + snapshots | Evidência DD |
| `HOMOLOGACAO-PERMANENTE.md` | Arquitetura |
| Isolamento comprovado (Fly/Supabase/Asaas/workers) | Know-how / prova |
| Tag runtime baseline exercitável | Governança release |
| Higienização DB staging (S2) | Continuidade teste |

**Magnitude:** material para **reprodutibilidade e DD técnica** (H1 Pacote C/D); não substitui o valor do núcleo `src/finance`, mas **eleva transferibilidade e confiança**.

---

# ETAPA 10 — Próxima Evolução (escolha correta hoje)

| Opção | Adequação agora |
|-------|-----------------|
| Continuar usando staging | **SIM — obrigatório** |
| Staging permanente v2 | Não necessário; **endurecer v1** (A2R + pin SHA) |
| Separar Payment Engine | **SIM — continuar B→C** |
| Criar SDK | Cedo (após C) |
| API independente | Cedo (V2 roadmap) |
| Repositório independente | Cedo |
| SaaS / White Label | Cedo (narrativa ok; produto não) |
| Nenhuma das anteriores | Não |

**Evolução correta hoje:**  
1) **Completar A2R** (Asaas sandbox resolvível em staging),  
2) **Manter staging permanente** como gate de regressão,  
3) **Prosseguir desacoplamento B→C**,  
4) **Sincronizar docs** (homologação + bridge Data Room) antes/em paralelo a H3.

---

# ETAPA 11 — Riscos

| ID | Categoria | Risco | Severidade |
|----|-----------|-------|:----------:|
| T1 | Técnico | Asaas sandbox não resolvível no staging | **ALTO** |
| T2 | Técnico | Staging não exerce PIX OUT/Recovery E2E | **MÉDIO** |
| A1 | Arquitetural | PE acoplada ao monólito/schema GDO | **ALTO** |
| A2 | Arquitetural | Baseline staging ≠ tip patrimonial P2.2 | **MÉDIO** |
| O1 | Operacional | Merge Git pendente (GIT.2) | **ALTO** |
| O2 | Operacional | Risco histórico `dev`→mesmo app prod (R7) | **MÉDIO** |
| O3 | Operacional | Shell local / canal A2R frágil (D0) | **MÉDIO** |
| P1 | Patrimonial | Prova staging não cobre SHA dos marcos H0/PE-VALOR | **MÉDIO** |
| D1 | Documental | `HOMOLOGACAO-PERMANENTE` desatualizado vs G2 | **MÉDIO** |
| D2 | Documental | Data Room Asaas/OUT desatualizado (H2) | **ALTO** |

---

# ETAPA 12 — Score Geral

| Dimensão | Nota (0–10) |
|----------|:-----------:|
| Arquitetura | 8.0 |
| Backend | 8.0 |
| Payment Engine | 8.5 |
| Provider Layer | 8.5 |
| Runtime | 7.5 |
| Staging | 7.5 |
| Produção | 8.0 |
| Observabilidade | 7.5 |
| Governança | 7.5 |
| Documentação | 7.0 |
| Reutilização | 7.5 |
| Independência | 5.5 |
| Patrimônio Tecnológico | 8.0 |
| Escalabilidade | 6.0 |
| Maturidade | 7.5 |
| **Média Geral** | **≈ 7.5** |

---

# ETAPA 13 — Perguntas Executivas

| Pergunta | Resposta |
|----------|----------|
| O staging continua necessário? | **SIM** |
| O staging cumpriu sua missão? | **SIM COM RESSALVAS** (bancada UP + G2; A2R incompleto) |
| A arquitetura continua coerente? | **SIM COM RESSALVAS** |
| Existe drift? | **SIM** (esperado + operacional Asaas + documental + SHA) |
| Existe dívida técnica? | **SIM** |
| Existe dívida documental? | **SIM** |
| Existe dívida patrimonial? | **SIM COM RESSALVAS** (H1 ok; prova staging/SHA e Git) |
| A PE caminha para independência? | **SIM** (direção B→C; não produto ainda) |
| Desacoplamento continua a evolução correta? | **SIM** |

---

# ETAPA 14 — Veredito

# **PASS COM RESSALVAS**

| Pergunta | Resposta |
|----------|----------|
| A arquitetura continua íntegra? | **SIM COM RESSALVAS** |
| O staging continua fazendo sentido? | **SIM** |
| Estamos prontos para H2.5? | **SIM COM RESSALVAS** — H2.5 deve fechar A2R + higiene Git/doc staging antes de declarar paridade sandbox |
| Estamos prontos para H3? | **SIM COM RESSALVAS** — valuation só com **bridge factual** (H2 L9): não usar DR-02 “Asaas zero código” nem ignorar que staging ≠ tip P2.2 |

---

## Resposta ao objetivo do gate

> O ambiente permanente de Staging representa corretamente a arquitetura atual da Indesconectável Payment Engine™ ou existe drift?

**Representa corretamente a arquitetura de runtime baseline tagged (`b29d847`) em perfil de homologação segura** — G2 PASS COM RESSALVAS.  
**Existe drift** em: (1) ativação Asaas sandbox, (2) documentação pontual, (3) alinhamento SHA staging vs tip patrimonial/productização, (4) estado Git operacional.  
**Não** há evidência de contaminação produção↔staging na certificação G2.

A estratégia de ativo independente permanece **coerente** (**SIM COM RESSALVAS** na pergunta-mãe): staging é prova de isolamento e regressão; independência plena exige desacoplamento B→C + packaging, não abandono do staging.

---

## Recomendações (somente orientação — nada executado)

1. Concluir **A2R** somente em `goldeouro-backend-staging`.  
2. Atualizar doc de homologação permanente para status **operacional pós-G2** (em gate documental futuro).  
3. Definir política: staging pin = baseline tag **ou** tip P2.2 — explicitar no meta.  
4. Resolver merge GIT.2 fora deste gate.  
5. Antes de H3: bridge Data Room (H2) alinhado a P1.9/H0/staging.

---

## Assinatura

| Campo | Valor |
|-------|-------|
| Gate | H2A — Auditoria Suprema Staging e Integridade Arquitetural |
| Data | 2026-07-08 |
| Modo | READ_ONLY_ABSOLUTO |
| Mutações | **Nenhuma** |
| Fly/HTTP live neste gate | **Não executado** |
| Artefatos | Este MD + `snapshots/h2a-staging-supreme-audit.json` |

---

*H2A — 2026-07-08 — Gol de Ouro™ V1 / Indesconectável Payment Engine™.*
