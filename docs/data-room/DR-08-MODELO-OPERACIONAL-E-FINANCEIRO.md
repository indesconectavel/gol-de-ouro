# DR-08 — Modelo Operacional e Financeiro

**Projeto:** Gol de Ouro™  
**Versão:** V1 (~95% concluída)  
**Data:** 2026-06-23  
**Modo:** auditoria READ-ONLY — modelo documentado a partir de evidências do repositório  
**Documentos relacionados:** DR-01, DR-03, DR-06, DR-07, DR-11, **P1.9**, **H0**, `docs/arquitetura/PAYMENT-ENGINE-V1.md`  
**Repositório:** monorepo `goldeouro-backend`

---

## ADENDA H2.5 — Estado oficial (2026-07-08)

> Corpo **2026-06-23** = **NARRATIVA ORIGINAL** do modelo dual wallet+ledger (ainda válido). Atualizar fluxos OUT:

| Tema | Estado oficial |
|------|----------------|
| PIX OUT automático “📋 / bloqueio onboarding MP” como gap único | **HISTÓRICO parcial** — Asaas PIX OUT homologado; **Recovery Job** certificado (**P1.9 PASS**) |
| Workers | Produção: `payout_worker` ON; Staging: OFF (design G2/H2A) |
| Idempotência / ledger | Mantém-se como eixo de integridade (V1.1B / P1.9) |
| Gates produção | Feature flags Asaas / PIX OUT / webhook — ler health snapshot PE |

Para matriz PSP atualizada ver **DR-11 adenda H2.5**.

---

## Legenda de status operacional

| Símbolo | Significado |
|---------|-------------|
| ✅ | **Operacional em produção** — evidência deploy/certificação |
| 🔄 | **Implementado parcialmente** — código existe; prod E2E incompleto |
| 📋 | **Planejado / não operacional** — documentado sem implementação prod |

---

# 1. Resumo Executivo

O Gol de Ouro™ opera como **plataforma de entretenimento com economia real em reais (BRL)**, onde o usuário deposita via **PIX IN**, joga penáltis consumindo saldo interno, recebe prêmios creditados na **wallet**, e solicita **saque PIX OUT** quando elegível.

### Modelo financeiro dual-layer

| Camada | Implementação | Função |
|--------|---------------|--------|
| **Wallet (mutável)** | `usuarios.saldo` | Saldo disponível para jogar e sacar |
| **Ledger (imutável)** | `ledger_financeiro` | Trilha auditável append-only — depósitos, saques, taxas, rollbacks, payouts |

### Fontes de verdade

| Domínio | Onde vive | Evidência |
|---------|-----------|-----------|
| **Gameplay + movimentação por chute** | RPC PostgreSQL `shoot_apply` | `database/shoot_apply_atomic_transaction.sql` |
| **Crédito PIX IN** | RPC `claim_and_credit_approved_pix_deposit` | `database/claim_and_credit_approved_pix_deposit.sql` |
| **Solicitação saque** | `POST /api/withdraw/request` | `server-fly.js` |
| **Processamento payout** | Worker + `processPendingWithdrawals` + Payment Engine | `src/workers/payout-worker.js`, `src/finance/` |
| **Operação manual** | Admin approve / approve-and-send | `controllers/adminWithdrawController.js` |

### Situação produção (evidência certificação + DR-07)

| Fluxo | Status |
|-------|--------|
| PIX IN (depósito) | ✅ Operacional — Mercado Pago |
| Gameplay + premiação | ✅ Operacional — RPC atômica |
| Saque — solicitação + débito wallet | ✅ Operacional |
| Saque — manual admin | ✅ Operacional (F2.3C) |
| Saque — PIX OUT automático via PSP | 🔄 Código completo; **bloqueio onboarding MP Payouts** em prod |
| Payment Engine PIX IN | 📋 Contrato existe; não wired |
| Celcoin / Asaas OUT | 📋 Prep / planejado |

---

# 2. Fluxo Operacional

Jornada do usuário reconstruída a partir de rotas player, `server-fly.js` e handbook executivo.

```text
Cadastro (POST /api/auth/register)
    ↓  bcrypt hash · saldo inicial (calculateInitialBalance)
Login (POST /api/auth/login ou /auth/login)
    ↓  JWT Bearer · correção saldo zero se aplicável
Dashboard (/dashboard)
    ↓  exibe usuarios.saldo
Depósito PIX (/pagamentos)
    ↓  POST /api/payments/pix/criar → QR/código MP
    ↓  [usuário paga no app banco]
    ↓  webhook MP → claim_and_credit → wallet += valor
Gameplay (/game, /gameshoot)
    ↓  POST /api/games/shoot → RPC shoot_apply
    ↓  wallet -= aposta · wallet += prêmios (se gol)
Premiação
    ↓  R$5 por gol · +R$100 milestone Gol de Ouro (contador global)
Solicitação de saque (/withdraw)
    ↓  POST /api/withdraw/request
    ↓  wallet -= valor bruto · ledger saque + taxa
PIX Out
    ├── [automático] worker → Payment Engine → MP Payouts  🔄 prod bloqueado
    └── [manual] admin approve / approve-and-send           ✅ operacional
```

### Etapas operacionais resumidas

| Etapa | Ator | Sistema | Produção |
|-------|------|---------|----------|
| Cadastro | Jogador | Supabase `usuarios` | ✅ |
| Login | Jogador | JWT + session | ✅ |
| Depósito | Jogador + MP | `pagamentos_pix` → wallet | ✅ |
| Jogo | Jogador | `lotes`, `chutes`, RPC | ✅ |
| Saque request | Jogador | `saques` pendente | ✅ |
| Saque execução | Admin ou worker | PSP ou `pago_manual` | 🔄 / ✅ manual |
| Auditoria | Operador | Admin `/transacoes`, scripts | ✅ |

---

# 3. Fluxo Financeiro

## 3.1 Diagrama consolidado

```text
                    ENTRADA (PIX IN)
PIX (Mercado Pago)
    ↓
POST /api/payments/webhook
    ↓
Validação HMAC (webhook-signature-validator.js)
    ↓
claim_and_credit_approved_pix_deposit(payment_id)
    ↓
├── pagamentos_pix.status → approved
├── usuarios.saldo += valor
└── ledger_financeiro INSERT tipo=deposito

                    CIRCULAÇÃO INTERNA
Wallet (usuarios.saldo)
    ↓
Gameplay — RPC shoot_apply
    ↓
├── Débito: valor_aposta (R$1/2/5/10)
├── Crédito: premio R$5 se gol
└── Crédito: premio_gol_de_ouro R$100 se milestone (contador % 1000 = 0)
    ↓
Ledger: movimentação refletida indiretamente via saldo (gameplay não grava ledger por chute — evidência RPC)

                    SAÍDA (PIX OUT)
Solicitação POST /api/withdraw/request
    ↓
PixValidator · taxa PAGAMENTO_TAXA_SAQUE (default R$2,00)
    ↓
Wallet debit (optimistic lock saldo anterior)
    ↓
Ledger INSERT tipo=saque + tipo=taxa
    ↓
saques INSERT status=pendente · correlation_id
    ↓
Payment Engine (se worker + flags ativos)
    ↓
FinanceProviderFactory → MercadoPagoPayoutProvider (default)
    ↓
PSP POST transaction-intent / PIX send
    ↓
Webhook POST /webhooks/mercadopago
    ↓
├── Sucesso: ledger payout_confirmado · saque processado
└── Falha: ledger falha_payout · rollback wallet (ledger rollback)
```

## 3.2 Tabela de movimentações financeiras

| Evento | Wallet | Ledger | Tabela auxiliar | PSP |
|--------|--------|--------|-----------------|-----|
| Depósito PIX aprovado | +valor | `deposito` | `pagamentos_pix` | MP IN |
| Chute (aposta) | −aposta | — | `chutes` | — |
| Gol (prêmio) | +R$5 | — | `chutes.premio` | — |
| Milestone Gol de Ouro | +R$100 | — | `chutes.premio_gol_de_ouro` | — |
| Saque solicitado | −valor bruto | `saque`, `taxa` | `saques` pendente | — |
| Payout confirmado | — (já debitado) | `payout_confirmado` | `saques` processado | MP OUT |
| Payout falhou | +valor (rollback) | `rollback`, `falha_payout` | `saques` falha | MP OUT |
| Saque manual admin | — | `payout_confirmado` ou equivalente | `pago_manual` | — (sem PSP) |

---

# 4. Wallet

## 4.1 Implementação

| Aspecto | Evidência |
|---------|-----------|
| **Campo** | `usuarios.saldo` — `numeric`, mutável |
| **Leitura** | Profile, dashboard, pré-shoot, pré-saque |
| **Escrita gameplay** | RPC `shoot_apply` — `FOR UPDATE` + cálculo atômico |
| **Escrita depósito** | RPC `claim_and_credit_approved_pix_deposit` |
| **Escrita saque** | `server-fly.js` — optimistic concurrency `.eq('saldo', usuario.saldo)` |
| **Saldo inicial** | `calculateInitialBalance('regular')` no registro/login (testes/onboarding) |

## 4.2 Créditos

| Origem | Mecanismo | Produção |
|--------|-----------|----------|
| PIX IN aprovado | RPC claim + UPDATE saldo | ✅ |
| Gol no jogo | RPC shoot_apply `v_credito` | ✅ |
| Milestone Gol de Ouro | RPC `v_premio_gol` (+R$100) | ✅ |
| Rollback saque falho | `processPendingWithdrawals` / rollbackWithdraw | ✅ |
| Crédito manual admin | Não evidenciado endpoint dedicado | — |

## 4.3 Débitos

| Origem | Mecanismo | Produção |
|--------|-----------|----------|
| Aposta por chute | RPC shoot_apply | ✅ |
| Saque solicitado | `/api/withdraw/request` — valor bruto inclui taxa | ✅ |

## 4.4 Reconciliação wallet

| Mecanismo | Evidência |
|-----------|-----------|
| Optimistic lock saque | Conflito 409 se saldo mudou entre leitura e update |
| Consistência pós-saque | Verifica 2 linhas ledger (`saque` + `taxa`) mesmo `correlation_id` |
| Rollback automático | Falha insert saque/ledger → reverte saldo |
| Scripts auditoria | `f2-3a-audit-readonly.mjs` — cruza saques vs ledger |
| Prova financeira FP-02 | `saldo_negativo === 0` |
| H4.1C | Reconciliação histórica saldos — outlier conta teste documentado |

**Limitação documentada:** gameplay altera wallet **sem** entrada ledger por chute — reconciliação wallet↔ledger é por **eventos financeiros explícitos** (depósito, saque), não por cada jogada.

---

# 5. Ledger

## 5.1 Modelo de dados

Fonte: `database/schema-ledger-financeiro.sql`

| Campo | Tipo | Função |
|-------|------|--------|
| `id` | uuid PK | Identificador |
| `correlation_id` | text | Idempotência — agrupa operação |
| `tipo` | text CHECK | `deposito`, `saque`, `taxa`, `rollback`, `payout_confirmado`, `falha_payout` |
| `usuario_id` | uuid | Titular |
| `valor` | numeric(12,2) | Montante |
| `referencia` | text | ID saque, payment, `:fee`, etc. |
| `created_at` | timestamptz | Timestamp imutável |

**Índice único:** `(correlation_id, tipo, referencia)` — impede duplicatas.

## 5.2 Append-only

- Schema declara "somente insert"
- Rollbacks registrados como novas linhas `tipo=rollback`, não UPDATE/DELETE
- `createLedgerEntry` em `processPendingWithdrawals.js` deduplica antes de insert

## 5.3 Rastreabilidade

| Mecanismo | Função |
|-----------|--------|
| `correlation_id` em `saques` | Liga wallet debit → ledger → payout |
| `referencia` | Aponta para `saques.id`, `pagamentos_pix.id`, payment_id MP |
| `financeLog()` | Logs JSON estruturados correlacionados |
| `admin_logs` | Ações admin sobre saques |

## 5.4 Integridade

| Controle | Evidência |
|----------|-----------|
| FP-01 duplicatas | `dups_corr_tipo === 0` |
| FP-03 approved sem ledger | Backlog legado estável (34 casos certificação) |
| Runbook duplicata-ledger | `docs/runbooks/financeiro/RUNBOOK-duplicata-ledger.md` |
| Runbook saldo-negativo | FP-02 + runbook dedicado |
| Unique index | `ledger_financeiro_correlation_tipo_ref_idx` |

---

# 6. Gameplay Financeiro

## 6.1 Compra de lote / aposta

Cada chute consome saldo — **não há compra de lote separada**; a aposta é por chute dentro de pool (`lote`) compartilhado por valor.

| Valor aposta | Tamanho lote | Lógica |
|--------------|--------------|--------|
| R$ 1 | 10 chutes | Pool compartilhado |
| R$ 2 | 5 chutes | |
| R$ 5 | 2 chutes | |
| R$ 10 | 1 chute | Lote individual |

Alocação: RPC busca lote `ativo` com vagas ou cria novo com `indice_vencedor` sorteado.

## 6.2 Consumo de saldo

```sql
-- shoot_apply (evidência simplificada)
v_novo_saldo := v_saldo - p_valor_aposta + v_credito;
```

Validação prévia: `SHOOT_APPLY_SALDO_INSUFICIENTE` se saldo < aposta.

HTTP layer (`POST /api/games/shoot`) valida saldo antes de chamar RPC.

## 6.3 Premiação

| Tipo | Valor | Condição |
|------|-------|----------|
| **Gol** | R$ 5,00 | `v_cnt = v_indice` (posição = índice vencedor) |
| **Gol de Ouro (milestone)** | R$ 100,00 | `contador_chutes_global % 1000 = 0` no gol |
| **Miss** | R$ 0 | Demais chutes |

Contador global: `metricas_globais` — `FOR UPDATE` na RPC.

## 6.4 Crédito e histórico

- Crédito aplicado **na mesma transação** que débito da aposta
- Histórico: tabela `chutes` (direção, resultado, premio, lote_id, shot_index)
- Endpoint: `GET /api/games/chutes/recentes`
- Stats usuário: `total_apostas`, `total_ganhos`, `total_gols_de_ouro` atualizados na RPC

## 6.5 Engine legacy vs V2

- Constante `c_engine_v2_from` — lotes criados antes usam ramo `legacy_engine`
- Patches F2-2C restringem produção a assinatura V1-only

---

# 7. Payment Engine

## 7.1 Escopo V1

| Componente | Status | Evidência |
|------------|--------|-----------|
| **Factory** | ✅ Implementada | `FinanceProviderFactory.js` |
| **PayoutProvider contract** | ✅ | `src/finance/contracts/PayoutProvider.js` |
| **PaymentProvider contract** | 📋 JSDoc only | Não wired — PIX IN permanece monólito |
| **MercadoPagoPayoutProvider** | ✅ Default prod | `PAYOUT_PROVIDER=mercadopago` |
| **CelcoinPayoutProvider** | 🔄 Stub | `CELCOIN_ENABLED=false` |
| **MockPayoutProvider** | ✅ Dev only | Forbidden prod |
| **Compat** | ✅ | `createPixWithdrawCompat.js` → worker |

## 7.2 Factory e seleção

```text
PAYOUT_PROVIDER env (default: mercadopago)
    ↓
assertBootConfig()
    ├── MOCK forbidden in production
    ├── celcoin requires CELCOIN_ENABLED=true
    └── efi → error not implemented
    ↓
cachedPayoutProvider → MercadoPago | Celcoin | Mock
```

## 7.3 Mercado Pago

| Fluxo | Onde | Token |
|-------|------|-------|
| **PIX IN** | Inline `server-fly.js` | `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` |
| **PIX OUT** | `pix-mercado-pago.js` + factory | `MERCADOPAGO_PAYOUT_ACCESS_TOKEN` |
| **Webhook depósito** | `/api/payments/webhook` | HMAC secret |
| **Webhook payout** | `/webhooks/mercadopago` | Ed25519 `MP_PAYOUT_PRIVATE_KEY` |

Apps **separadas** documentadas em `.env.example` — uma app Checkout (IN), uma Payouts (OUT).

## 7.4 Celcoin

| Item | Status |
|------|--------|
| Stubs F4 | ✅ Código |
| OAuth client F4.1 | ✅ Sandbox gate |
| PIX Out real | 📋 F4.3 planejado |
| Produção | 📋 `CELCOIN_ENABLED=false` |

## 7.5 Asaas

- **Zero código** no repositório
- Planejado em `PAYMENT-ENGINE-V1.md` §17 — aguardando API

## 7.6 Feature flags financeiras

| Flag | Efeito |
|------|--------|
| `PAYOUT_PROVIDER` | mercadopago \| celcoin |
| `CELCOIN_ENABLED` | Gate Celcoin |
| `CELCOIN_HTTP_ENABLED` | OAuth HTTP real |
| `MOCK_FINANCE_ENABLED` | Mock provider — **proibido prod** |
| `ENABLE_PIX_PAYOUT_WORKER` | Worker Fly ativo |
| `PAYOUT_PIX_ENABLED` | Processamento automático |
| `PAYOUT_AUTO_FROM_AT` | Corte temporal saques auto (ISO-8601) |
| `PAGAMENTO_TAXA_SAQUE` | Taxa default R$ 2,00 |
| `MP_PAYOUT_ENFORCE_SIGNATURE` | Webhook payout strict |

---

# 8. Painel Administrativo

Base: `goldeouro-admin/` — rotas DR-02 §2.3.

## 8.1 Gestão financeira

| Página | Rota | Função |
|--------|------|--------|
| **Transações** | `/transacoes` | Lista ledger/transações mapeadas |
| **Relatório Financeiro** | `/relatorio-financeiro` | Gestão financeira agregada |
| **Dashboard** | `/`, `/painel` | Métricas operacionais |

Auditorias H4.1A/H4.1B validaram consumo de **dados reais** (sem mocks relevantes).

## 8.2 Aprovação de saques

| Página | Rota | Ações |
|--------|------|-------|
| **SaqueUsuarios** | `/saque-usuarios` | Dois fluxos F2.4C |

| Endpoint admin | Efeito | PSP |
|----------------|--------|-----|
| `POST /api/admin/withdraw/approve` | Marca `pago_manual` | ❌ Sem PIX externo |
| `POST /api/admin/withdraw/approve-and-send` | Dispara factory → MP | ✅ PSP |
| `POST /api/admin/withdraw/cancel` | Rollback wallet + ledger | — |

Trilha: `adminAuditLogger` → tabela `admin_logs`.

## 8.3 Auditoria e relatórios

| Ferramenta | Função |
|------------|--------|
| `/auditoria`, `/logs` | Auditoria admin, logs sistema |
| `/exportar-dados` | Exportação ops |
| `/chutes`, `/top-jogadores`, `/fila` | Monitoramento gameplay |

## 8.4 Ferramentas administrativas

| Recurso | Evidência |
|---------|-----------|
| Lista usuários | `/lista-usuarios` |
| Backup/config | `/backup`, `/configuracoes` |
| RBAC | JWT + flag administrador no DB |

---

# 9. Controles Financeiros

## 9.1 Validação

| Ponto | Controle |
|-------|----------|
| Saque | `PixValidator` — valor R$ 0,50–R$ 1.000; chave PIX CPF/CNPJ/email/phone/random |
| Chave disponível | `isPixKeyAvailable` — unicidade |
| CPF usuário | Verificação em withdraw request |
| Boot prod | `config/required-env.js` — tokens MP obrigatórios |
| Mock finance | Forbidden `NODE_ENV=production` |
| Webhook | 401 sem assinatura válida |

## 9.2 Conciliação

| Mecanismo | Escopo |
|-----------|--------|
| RPC claim idempotente | Depósito não credita 2x |
| correlation_id + unique index | Ledger dedup |
| Worker reconcile | Backlog `saques` pendentes |
| Métrica `reconcile_backlog` | Dashboard governança |
| GET `/api/payments/pix/status` | Consulta status depósito (QR-01 roadmap) |

## 9.3 Webhooks

| Rota | Validação | Resposta imediata |
|------|-----------|-------------------|
| `/api/payments/webhook` | HMAC MP | 200 + process async |
| `/webhooks/mercadopago` | Ed25519 payout | Idempotência por intent |

## 9.4 Logs

| Tipo | Formato |
|------|---------|
| `financeLog()` | JSON estruturado — correlation_id, tipo, status |
| Worker | `[PAYOUT][WORKER]` prefix |
| Admin | `admin_logs` persistido |

## 9.5 Auditorias

| Instrumento | Função |
|-------------|--------|
| `financial-proof-engine.js` | FP-01..FP-09 |
| `f2-3a-audit-readonly.mjs` | Ledger ↔ saques |
| `v1-2a-runtime-financial-health.js` | Saúde agregada |
| Trilha H4.1B/C | Dashboard e saldos |
| Runbooks financeiros (6) | approved-sem-ledger, rollback-spike, etc. |

## 9.6 Proteções

| Proteção | Implementação |
|----------|---------------|
| Rate limit | Login, recovery, global API |
| JWT | Rotas protegidas player/admin |
| Helmet / CORS | Headers segurança |
| Rollback saque | `rollbackWithdraw` — wallet + ledger |
| Compensação admin | Falha ledger → revert saque pendente |
| RLS Supabase | Patches F6-1C |

---

# 10. Riscos Operacionais

| Risco | Severidade | Evidência | Mitigação |
|-------|------------|-----------|-----------|
| **PIX OUT automático bloqueado** | Alta | Onboarding MP Payouts; DR-07 | Saque manual admin ✅ |
| **Dependência PSP único (IN)** | Alta | PIX IN 100% inline MP | Payment Engine prep |
| **Gameplay sem ledger por chute** | Média | RPC shoot_apply | Wallet source for game; ledger for cash events |
| **Backlog approved sem ledger (34)** | Média | Certificação §5 | Estável; monitorado FP-03 |
| **Processo manual saque** | Média | Admin approve | Operacional; não escala |
| **Webhook replay/flood** | Média | Runbooks segurança | HMAC + rate limit |
| **Polling PIX ausente** | Média | V1-X1 QR-02 | UX — usuário aguarda webhook |
| **Worker liveness** | Média | Logs Fly, não HTTP probe | Runbook payout-worker-offline |
| **Schema MP-centric `saques.mp_*`** | Média | PAYMENT-ENGINE §15 | Migration F4.3 planejada |
| **Tesouraria dual PSP** | Média | IN MP + OUT alternativo planejado | Decisão estratégica §17 |
| **Regulatório premiação** | Alta | PAYMENT-ENGINE risco 10 | Due diligence comercial |

---

# 11. Pontos Fortes

| Dimensão | Evidência |
|----------|-----------|
| **Wallet** | Optimistic lock; rollback automático; RPC atômica gameplay |
| **Ledger** | Append-only; tipos explícitos; unique (correlation, tipo, ref) |
| **Auditoria** | FP-01..09; scripts read-only; trilha H4; runbooks |
| **Separação** | Wallet mutável vs ledger imutável; gameplay no PostgreSQL |
| **Payment Engine** | Factory + guards; path to multi-PSP sem reescrever wallet |
| **Rastreabilidade** | correlation_id end-to-end saque; financeLog JSON |
| **Admin ops** | Dois fluxos saque; audit trail; relatórios |
| **Certificação** | Integridade financeira 85/100; webhooks 100/100 |
| **Idempotência depósito** | RPC claim — crítico para PIX |

---

# 12. Evolução Prevista

Base: DR-07, PAYMENT-ENGINE-V1 §17, V1-X1 — **planejado, não implementado** salvo indicação.

| Direção | Horizonte | Itens |
|---------|-----------|-------|
| **Multi-PSP** | Médio | F4.2 Celcoin OAuth · F4.3 PIX Out · Asaas provider |
| **Desacoplamento** | Médio | PIX IN + webhooks via PaymentProvider; schema provider-agnostic |
| **Automações UX** | Curto | QR-01/02 polling PIX; toast crédito |
| **Automações payout** | Médio | E2E OUT prod após PSP escolhido |
| **Websocket saldo** | Médio | V2-01 |
| **Compliance** | Longo | RTP página regulatória V2-03; limites jogo responsável |
| **Escalabilidade** | Longo | PO-06 load test 1k CCU |

---

# 13. Conclusão Executiva

## Por que o modelo financeiro aumenta o valor tecnológico da plataforma?

Sob a ótica de **Due Diligence Financeira**:

### 1. Separação wallet / ledger auditável

Plataformas de premiação frequentemente operam apenas saldo mutável opaco. O Gol de Ouro™ implementa **ledger append-only** com tipos normalizados e idempotência por `correlation_id` — padrão exigido em fintechs reguladas e due diligence de caixa.

### 2. Lógica crítica no ACID do banco

Depósitos (`claim_and_credit`) e gameplay (`shoot_apply`) executam em **transações PostgreSQL atômicas** — o dinheiro não fica exposto a falhas parciais do Node.js entre débito e crédito.

### 3. PIX IN operacional com controles

Webhook HMAC, idempotência, RPC claim e prova financeira FP-03 demonstram **maturidade de entrada de caixa** — receita real documentada em produção.

### 4. Saída de caixa estruturada mesmo com bloqueio PSP

O gap PIX OUT automático **não invalida** o modelo: código worker + factory + rollback + admin manual formam **processo completo** — bloqueio é onboarding PSP externo, não ausência de arquitetura de saque.

### 5. Observabilidade financeira contínua

FP-01..09, runbooks e métricas baseline (`approved_sem_ledger`, `saldo_negativo`, `rollback`) permitem **monitoramento de integridade** pós-aquisição — reduz risco de caixa oculto pós-DD.

### 6. Opcionalidade de evolução

Payment Engine preparada transforma dependência MP de **risco estrutural** em **decisão de configuração** — aumenta valor estratégico do ativo para comprador que destravará Cash-Out.

**Síntese DD:** o modelo operacional-financeiro combina **entrada PIX comprovada**, **circulação interna governada por RPC**, **saída com trilha ledger completa** e **auditoria automatizada** — perfil superior a MVPs sem ledger ou sem webhook hardening. Ressalvas (backlog legado, OUT manual, gameplay off-ledger) são **quantificadas e monitoradas**, não ocultas.

---

## Metadados desta auditoria

| Campo | Valor |
|-------|-------|
| **Arquivo criado** | `docs/data-room/DR-08-MODELO-OPERACIONAL-E-FINANCEIRO.md` |
| **Modo** | READ-ONLY — nenhuma alteração em código, banco, configs ou docs preexistentes |
| **Fonte** | Evidências exclusivamente do repositório `goldeouro-backend` |
| **Data** | 2026-06-23 |

### Resumo solicitado

| Item | Resultado |
|------|-----------|
| **Principais fluxos financeiros** | PIX IN → webhook → RPC claim → wallet+ledger · Gameplay shoot_apply · Saque request → ledger → worker/admin → PSP |
| **Principais controles** | Ledger append-only, idempotência, HMAC/Ed25519 webhooks, PixValidator, FP-01..09, admin audit logs, rollback automático |
| **Principais riscos** | PIX OUT prod bloqueado, dependência MP IN, gameplay off-ledger, backlog approved_sem_ledger, processo manual saque |
| **Código alterado** | **Nenhum** |
