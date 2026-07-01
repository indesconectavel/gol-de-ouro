# OC1.0 — Plano de Operação Controlada V1

**Projeto:** Gol de Ouro™  
**Data de emissão:** 2026-06-28  
**Modo:** READ-ONLY ABSOLUTO — nenhum código, banco, produção ou documentação preexistente alterado  
**Base institucional:** G1.0 (GO COM RESSALVAS) · H4.0 (GO) · H4.Z (encerrada) · F6.1D-C (smoke prod) · P1.0 (Asaas prep)

---

## Veredito OC1.0

> **A operação piloto pode ser iniciada com segurança?**

**SIM** — desde que os **critérios de entrada (§5)** sejam cumpridos integralmente antes do Dia 1, e as **limitações (§4)** permaneçam vigentes durante toda a fase piloto.

# OC1.0 — READY

*(Pronto para iniciar após checklist de entrada §5; não autoriza abertura imediata sem pré-voo operacional.)*

---

## 1. Objetivos

### 1.1 Objetivo principal

Iniciar oficialmente a **primeira Operação Controlada** da V1 — operação piloto com usuários reais em tráfego limitado, financeiro supervisionado e capacidade de interrupção imediata.

### 1.2 Objetivos específicos

| # | Objetivo | Métrica de sucesso |
|---|----------|-------------------|
| O1 | Validar fluxo jogador ponta a ponta em produção | Login → depósito → jogo → saque solicitado |
| O2 | Manter integridade financeira (wallet/ledger) | 0 saldo negativo; 0 duplicata ledger P0 |
| O3 | Operar PIX IN via Mercado Pago com supervisão | Webhooks 401 sem assinatura; créditos idempotentes |
| O4 | Processar saques exclusivamente via **fluxo manual admin** | 100% saques piloto via `Confirmar PIX manual` |
| O5 | Demonstrar governança operacional | Runbooks aplicados; incidentes classificados P0–P3 |
| O6 | Coletar evidências para evolução V2 / OC2.0 | Relatório de encerramento OC1.0 ao final da fase |

### 1.3 Fora do escopo OC1.0

- Go-live Asaas (`ASAAS_PRODUCTION_ENABLED=true`)
- PIX OUT automático (worker ou `Aprovar e Enviar PIX`)
- Campanha de marketing / tráfego massivo
- Alteração de código, banco ou deploy durante a fase piloto (salvo incidente P0)

---

## 2. Escopo

### 2.1 Componentes incluídos

| Componente | URL / ref | Papel na OC1.0 |
|------------|-----------|----------------|
| Frontend Player | `https://www.goldeouro.lol` | Cadastro, login, depósito, jogo, solicitação saque |
| Backend API | `https://goldeouro-backend-v2.fly.dev` | API REST, webhooks MP, gameplay |
| Painel Admin | `https://admin.goldeouro.lol` | Aprovação manual de saques, dashboard, auditoria |
| Supabase prod | `gayopagjdrkcmkirmfvy` | Wallet, ledger, PIX, saques, RPC gameplay |
| Mercado Pago | PSP efetivo | PIX IN + confirmação webhook |
| Payment Engine | `src/finance/` | Arquitetura certificada; **MP efetivo** em prod |

### 2.2 Usuários alvo

- Conjunto inicial **fechado ou convidado** (lista branca recomendada)
- Perfil: jogadores reais em ambiente supervisionado
- Exclusão: bots, stress test, contas de teste sem supervisão

### 2.3 Duração sugerida

| Fase | Duração | Meta |
|------|---------|------|
| Pré-voo (§5) | 1–3 dias | Checklist entrada 100% |
| Piloto ativo | 14–30 dias | Fluxos validados; métricas estáveis |
| Encerramento (§11) | 2–3 dias | Relatório OC1.0-Z |

---

## 3. Auditoria preparatória (read-only)

Matriz de auditoria dos 10 eixos solicitados:

| # | Eixo | Status | Evidência | Lacuna pré-Dia 1 |
|---|------|--------|-----------|------------------|
| 1 | **Runbooks** | ✅ ADEQUADO | 17 runbooks + INCIDENT-RESPONSE-FLOW + ASAAS-PRODUCTION-GO-LIVE | Nenhuma bloqueante |
| 2 | **Checklist operacional** | ⚠️ PARCIAL | P1.0 (Asaas); V1-ACCESS §10; esta OC1.0 §5 | Preencher contas admin/jogador piloto |
| 3 | **Monitoramento** | ⚠️ PARCIAL | Scripts V1.2A/B/C; alertas externos **dry-run** | Executar scripts diários; monitor externo opcional |
| 4 | **Rollback** | ✅ ADEQUADO | INCIDENT-RESPONSE-FLOW §5; rollback.yml; Fly release anterior | Confirmar release rollback disponível |
| 5 | **Fluxo PIX IN** | ✅ OPERACIONAL | F6.1D-C; H4.0; webhook HMAC 401 | Smoke pré-Dia 1 recomendado |
| 6 | **Fluxo saque manual** | ✅ OPERACIONAL | F2.4C; F6.1D-B (27 saques listados); `POST /approve` | **Proibir** botão automático no piloto |
| 7 | **Logs** | ✅ ADEQUADO | `financeLog` estruturado; Fly logs; eventos documentados | Definir rotação/retenção Fly |
| 8 | **Painel Admin** | ✅ OPERACIONAL | F6.1D-B API 200; H4.1A dados reais | Login admin testado pré-Dia 1 |
| 9 | **Feature flags** | ✅ PROTEGIDO | G1.0; P1.0; `ASAAS_PRODUCTION_ENABLED=false` | Confirmar flags Fly §6 |
| 10 | **Backup** | ⚠️ PARCIAL | Snapshot `backup/goldeouro-v1-operacional-2026-05-27/`; GitHub | PITR Supabase **não comprovado** (H4.3) |

---

## 4. Limitações da Operação Controlada

### 4.1 Limitações financeiras

| Limitação | Valor OC1.0 | Limite técnico sistema | Observação |
|-----------|-------------|------------------------|------------|
| PSP efetivo | **Mercado Pago only** | — | Asaas gate **fechado** |
| Modo saque | **Manual admin only** | Worker/auto existem | `PAYOUT_MODE=manual` recomendado |
| Depósito mínimo | R$ **5,00** | `system-config.js` | Herdado |
| Depósito máximo **por transação piloto** | R$ **100,00** | R$ 1.000,00 | **Política OC** — abaixo do teto técnico |
| Saque mínimo | R$ **10,00** | `server-fly.js` L1663 | Herdado |
| Saque máximo **por solicitação piloto** | R$ **100,00** | R$ 1.000,00 (`pix-validator.js`) | **Política OC** |
| Taxa saque | Conforme regra V1 (fee documentada) | — | Validar no admin antes de aprovar |

### 4.2 Limitações operacionais

| Limitação | Regra |
|-----------|-------|
| Usuários simultâneos / total piloto | Máx. **50 usuários** ativos na fase OC1.0 |
| Novos cadastros | Convite ou lista branca; sem divulgação aberta |
| Horário preferencial | **09:00–22:00** (America/Sao_Paulo) |
| Fora do horário | Operação possível; equipe **on-call** obrigatória |
| Deploy | **Proibido** durante piloto (exceto hotfix P0 aprovado) |
| Saque real MP automático | **Proibido** no piloto |
| Asaas produção | **Proibido** |

### 4.3 Limitações conhecidas (ressalvas aceitas)

- 34 PIX `approved` legado sem ledger (baseline estável — runbook `approved-sem-ledger`)
- Métricas dashboard semanticamente limitadas (H4.1B)
- Monitoramento externo não ativo (V1.5C/D)
- Runtime pode divergir de baseline V1.6 (`a83c3cf`) — verificar `/meta` no pré-voo

---

## 5. Critérios de entrada (obrigatórios — Dia 0)

**A operação piloto só inicia quando TODOS os itens abaixo estiverem ✅.**

### 5.1 Infraestrutura

| # | Critério | Responsável | Evidência |
|---|----------|-------------|-----------|
| E1 | `GET /health` → 200, `database: connected`, `mercadoPago: connected` | Engenharia | Print/log |
| E2 | `GET /meta` → 200; `gitCommit` registrado | Engenharia | Print/log |
| E3 | Player e admin carregam (200) | Ops | Print |
| E4 | Flags produção seguras confirmadas (§6) | Engenharia | Fly secrets audit |
| E5 | Release Fly anterior identificada (rollback) | Engenharia | `fly releases` |

### 5.2 Contas e acesso

| # | Critério | Responsável |
|---|----------|-------------|
| E6 | Conta jogador piloto testada (login + dashboard) | Ops |
| E7 | Conta admin operacional testada (`/saque-usuarios`) | Ops |
| E8 | Matriz de acesso preenchida (sem placeholders) | Operador |
| E9 | Credenciais armazenadas em cofre (não em docs públicos) | Operador |

> Referência: F6.1D-C identificou `teste.corrigido@gmail.com` como conta QA válida; validar senha atual antes do piloto.

### 5.3 Financeiro

| # | Critério | Responsável |
|---|----------|-------------|
| E10 | Smoke PIX IN: criar cobrança R$ 10 (sem pagar) → 200 + QR | Ops |
| E11 | Webhook depósito rejeita sem HMAC → 401 | Engenharia |
| E12 | Fluxo saque manual documentado e equipe treinada | Financeiro |
| E13 | `PAYOUT_MODE=manual` confirmado (ou worker desligado) | Engenharia |
| E14 | Botão **Aprovar e Enviar PIX** desabilitado ou proibido por política | Operador |

### 5.4 Monitoramento e governança

| # | Critério | Responsável |
|---|----------|-------------|
| E15 | `node scripts/v1-2a-runtime-financial-health.js` → baseline OK | Engenharia |
| E16 | `node scripts/v1-2b-operational-alerts.js` executado e arquivado | Engenharia |
| E17 | Runbook INCIDENT-RESPONSE-FLOW distribuído à equipe | Operador |
| E18 | Canal de incidente definido (chat/telefone) | Operador |
| E19 | Plano de contingência (§8) lido e aceito | Todos |

---

## 6. Feature flags — estado exigido para OC1.0

| Flag | Valor exigido | Motivo |
|------|---------------|--------|
| `ASAAS_PRODUCTION_ENABLED` | `false` | MP efetivo; Asaas não live |
| `ASAAS_WEBHOOK_ENABLED` | `false` | Rota Asaas inativa |
| `PAYMENT_WEBHOOK_ENGINE_ENABLED` | `false` | Handler MP legado estável |
| `PAYOUT_MODE` | `manual` | Saque manual only |
| `PAYOUT_PIX_ENABLED` | conforme config atual MP | Webhook payout pode existir; **não** usar auto-send |
| `NODE_ENV` | `production` | — |

**Verificação:** audit Fly secrets + `/health/workers` (documentar snapshot Dia 0).

---

## 7. Fluxos operacionais auditados

### 7.1 Fluxo PIX IN (Mercado Pago)

```text
Jogador autenticado
  → POST /api/payments/pix/criar { amount }
  → createPixDepositCompat → Mercado Pago
  → pagamentos_pix (pending) + QR/copia-cola
  → Jogador paga PIX externamente
  → POST /api/payments/webhook (MP, HMAC)
  → claimAndCreditApprovedPixDeposit
  → usuarios.saldo += valor; pagamentos_pix = approved
```

| Ponto de controle | Verificação |
|-------------------|-------------|
| Autenticação | 401 sem JWT |
| Webhook | 401 sem assinatura HMAC |
| Idempotência | Replay webhook → saldo estável |
| Logs | `deposit_webhook_claim`, `deposit_claim_sql` |
| Runbook incidente | `RUNBOOK-hmac-failure`, `RUNBOOK-approved-sem-ledger` |

**Evidência:** F6.1D-C — PIX criado HTTP 200, QR presente, sem erro RLS.

### 7.2 Fluxo de saque manual (único autorizado na OC1.0)

```text
Jogador autenticado
  → POST /api/withdraw/request { valor, chave_pix, tipo_chave }
  → Validação PixValidator + mínimo R$ 10
  → Debita saldo; insere saques (pendente) + ledger saque/taxa
  → Admin: admin.goldeouro.lol/saque-usuarios
  → Operador executa PIX **fora do sistema** (app bancário / MP)
  → Admin: POST /api/admin/withdraw/approve (Confirmar PIX manual)
  → saques.status = pago_manual; ledger payout_manual_confirmado
```

| Ponto de controle | Verificação |
|-------------------|-------------|
| Botão proibido | **Não** usar `approve-and-send` no piloto |
| Duplicata | Idempotência `x-idempotency-key` |
| Logs | `withdraw_request_created`, `financeLog` saque |
| Runbook | `RUNBOOK-pending-antigos`, `RUNBOOK-saldo-negativo` |

**Evidência:** F2.4C — rota manual implementada; F6.1D-B — admin lista saques.

### 7.3 Logs e observabilidade

| Fonte | Eventos-chave | Uso OC1.0 |
|-------|---------------|-----------|
| `financeLog` (JSON) | `deposit_*`, `withdraw_*`, `deposit_webhook_*` | Correlação financeira |
| Fly logs | `[PIX]`, `[SAQUE]`, `[WEBHOOK]` | Incidentes runtime |
| Scripts read-only | V1.2A saúde · V1.2B alertas · V1.2C drift | Rotina diária |
| Supabase (read-only) | `pagamentos_pix`, `saques`, `ledger_financeiro` | Auditoria manual |

**Rotina mínima diária (piloto):**

```bash
node scripts/v1-2a-runtime-financial-health.js
node scripts/v1-2b-operational-alerts.js
node scripts/v1-2c-runtime-drift-deploy-integrity.js
```

---

## 8. Plano de contingência

### 8.1 Matriz de resposta

| Cenário | Severidade | Ação imediata | Runbook |
|---------|------------|---------------|---------|
| Crédito duplicado / saldo divergente | **P0** | Interromper piloto (§9); congelar saques | `RUNBOOK-duplicata-ledger`, `RUNBOOK-saldo-negativo` |
| Webhook flood / replay attack | **P1** | Rate-limit; validar HMAC logs | `RUNBOOK-flood-payout-webhook`, `RUNBOOK-replay-webhook` |
| Spike rollback/falha_payout | **P1** | Pausar aprovações; investigar | `RUNBOOK-rollback-spike` |
| Backend down / health fail | **P0** | Incident response; rollback Fly se deploy recente | `RUNBOOK-fly-release-inesperada` |
| RLS / permission denied inesperado | **P0** | Interromper; escalar engenharia | F6.1C patch ref |
| PIX IN não credita > 30 min | **P1** | Verificar MP + webhook + reconcile | `RUNBOOK-pending-antigos` |
| Admin inacessível | **P2** | API direta com JWT admin; ops manual | V1-ACCESS |
| Login jogador massivo 429 | **P2** | Aguardar rate-limit; comunicar usuários | Documentado F6.1D-C |

### 8.2 Contatos (preencher antes do Dia 1)

| Papel | Nome | Contato | Disponibilidade |
|-------|------|---------|-----------------|
| Operador principal | `[PREENCHER]` | `[PREENCHER]` | Horário OC + on-call |
| Engenharia backend | `[PREENCHER]` | `[PREENCHER]` | On-call P0/P1 |
| Financeiro / tesouraria | `[PREENCHER]` | `[PREENCHER]` | Saques manuais |
| Escalonamento executivo | `[PREENCHER]` | `[PREENCHER]` | P0 |

### 8.3 Plano B (degradado)

| Falha | Alternativa |
|-------|-------------|
| Player indisponível | Comunicar pausa; manter admin + API |
| PIX IN indisponível | Pausar novos depósitos; jogadores existentes podem jogar com saldo |
| Admin indisponível | **Congelar novos saques** até restauração |
| Banco indisponível | **Interrupção total** — acionar DR (H4.3) |

---

## 9. Critérios de interrupção (stop conditions)

A Operação Controlada **deve ser interrompida imediatamente** se:

| # | Condição | Ação |
|---|----------|------|
| I1 | Saldo negativo em qualquer usuário | STOP + P0 |
| I2 | Crédito duplicado confirmado | STOP + P0 |
| I3 | `/health` indisponível > 15 min | STOP + investigar |
| I4 | Webhook aceita evento sem HMAC (regressão) | STOP + P0 |
| I5 | Novos PIX `approved` sem ledger **acima** baseline 34 | STOP + P1 |
| I6 | Exposição anon Supabase em tabelas classe A | STOP + P0 |
| I7 | Saque automático disparado inadvertidamente | STOP + reverter flags |
| I8 | Decisão executiva / regulatória | STOP documentado |

**Procedimento de interrupção:**

1. Comunicar equipe e usuários piloto.
2. Desabilitar novos cadastros / convites.
3. Congelar aprovação de saques.
4. Preservar logs e snapshots (V1.2A/B/C).
5. Abrir incidente formal (INCIDENT-RESPONSE-FLOW).
6. Não retomar sem critérios de entrada §5 revalidados.

---

## 10. Rollback

### 10.1 Rollback operacional (sem deploy)

| Ação | Comando / procedimento |
|------|------------------------|
| Congelar saques | Política ops — não aprovar novos |
| Pausar convites | Remover links públicos de cadastro |
| Flags seguras | Confirmar §6; nunca abrir Asaas no piloto |

### 10.2 Rollback técnico

| Camada | Procedimento | Referência |
|--------|--------------|------------|
| Backend Fly | Rollback para release anterior | `RUNBOOK-fly-release-inesperada` |
| Frontend Vercel | Rollback bundle anterior | `RUNBOOK-bundle-divergente` |
| GitHub Actions | `rollback.yml` | DR-04 |
| Banco | **Somente** patches documentados; SQL read-only default | H4.3 — PITR via Supabase console |

### 10.3 Rollback financeiro

- Nunca DELETE em ledger.
- Correções via processo documentado por transação.
- Runbook: `RUNBOOK-duplicata-ledger`, `RUNBOOK-rollback-spike`.

---

## 11. Monitoramento e indicadores

### 11.1 Indicadores diários (KPIs OC1.0)

| ID | Indicador | Baseline / meta | Fonte |
|----|-----------|-----------------|-------|
| K1 | `/health` uptime | 100% em janela operacional | Probe manual / script |
| K2 | Usuários piloto ativos | ≤ 50 | Admin / Supabase |
| K3 | PIX IN criados / creditados | Taxa conversão monitorada | `pagamentos_pix` |
| K4 | PIX approved sem ledger | = 34 (legado); **0 novos** | V1.2A |
| K5 | Saldo negativo | **0** | V1.2A |
| K6 | Duplicatas ledger | **0** | V1.2A |
| K7 | Saques pendentes > 24h | ≤ 5 | Admin |
| K8 | Webhooks rejeitados (401) | Estável; spike → alerta | Logs |
| K9 | Runtime drift (`/meta` SHA) | Documentado | V1.2C |
| K10 | Incidentes P0/P1 | **0** ideal | Incident log |

### 11.2 Cadência operacional

| Frequência | Atividade |
|------------|-----------|
| Contínua | On-call durante horário OC |
| Diária (manhã) | Scripts V1.2A/B/C + revisão saques pendentes |
| Diária (noite) | Snapshot métricas K1–K10 |
| Semanal | Reunião ops: riscos, pendências, decisão continuar/pausar |
| Ad-hoc | Qualquer trigger §9 |

### 11.3 Monitoramento — lacunas aceitas

- Alertas externos (PagerDuty/etc.): **não ativos** — compensar com rotina manual V1.2B.
- PITR Supabase: **confirmar com operador** antes de escalar tráfego pós-piloto.

---

## 12. Equipe responsável

### 12.1 RACI simplificado

| Atividade | Operador | Engenharia | Financeiro | Executivo |
|-----------|:--------:|:----------:|:----------:|:---------:|
| Pré-voo §5 | A | R | C | I |
| Aprovação saques manuais | R | I | A | I |
| Monitoramento diário | C | R | C | I |
| Incidentes P0/P1 | A | R | C | I |
| Decisão STOP/GO | C | C | C | **A** |
| Encerramento OC1.0 | R | C | C | A |

*R = Responsável · A = Aprovador · C = Consultado · I = Informado*

### 12.2 Papéis mínimos exigidos

| Papel | Obrigatório | Função |
|-------|:-----------:|--------|
| Operador de plantão | Sim | Primeira resposta; admin saques |
| Engenheiro on-call | Sim | P0/P1 técnico |
| Tesouraria / financeiro | Sim | Execução PIX manual externo |
| Sponsor executivo | Sim | Decisão stop/go |

---

## 13. Backup e continuidade

| Item | Status OC1.0 | Ação recomendada |
|------|--------------|------------------|
| Código (GitHub) | ✅ Adequado | Tag `oc1.0-start` no Dia 1 |
| Snapshot repo | ✅ `backup/goldeouro-v1-operacional-2026-05-27/` | Não substitui backup vivo |
| Fly releases | ✅ Rollback documentado | Registrar release Dia 0 |
| Supabase PITR | ⚠️ Não comprovado (H4.3) | **Confirmar no console Supabase pré-piloto** |
| Credenciais | ⚠️ Cofre operador | Nunca em relatórios públicos |

---

## 14. Painel Admin — escopo OC1.0

| Função | Rota / endpoint | Uso piloto |
|--------|-----------------|------------|
| Dashboard stats | `GET /api/admin/dashboard/stats` | Monitorar; interpretar H4.1B |
| Saques | `/saque-usuarios` | **Principal** — aprovação manual |
| Aprovar manual | `POST /api/admin/withdraw/approve` | **Único botão autorizado** |
| ~~Aprovar e enviar~~ | `POST /api/admin/withdraw/approve-and-send` | **PROIBIDO** na OC1.0 |
| Financeiro / auditoria | Endpoints admin | Read-only preferencial |

**Evidência:** F6.1D-B — todos endpoints admin testados HTTP 200.

---

## 15. Encerramento da OC1.0

### 15.1 Critérios de encerramento normal

| # | Critério |
|---|----------|
| X1 | Duração mínima 14 dias cumprida |
| X2 | Zero incidentes P0 |
| X3 | KPIs K4–K6 estáveis |
| X4 | ≥ 10 fluxos completos jogador documentados (depósito + jogo + saque) |
| X5 | Relatório OC1.0-Z emitido |

### 15.2 Entregável de encerramento

Criar (fase posterior): `docs/operacao/OC1.0-Z-ENCERRAMENTO-OPERACAO-CONTROLADA.md`

Conteúdo mínimo: métricas finais, incidentes, lições aprendidas, recomendação OC2.0 ou expansão.

### 15.3 Transição pós-OC1.0

| Cenário | Próximo passo |
|---------|---------------|
| Sucesso | OC2.0 — ampliar usuários / limites |
| PIX OUT desejado | F2.4E retomada com operador + MP Payouts |
| Asaas desejado | Checklist P1.0 §4.7 (fora OC1.0) |
| Falha | Retorno a modo manutenção; postmortem P0/P1 |

---

## 16. Referências

| Documento | Caminho |
|-----------|---------|
| G1.0 GO/NO-GO Final | `docs/relatorios/G1.0-GO-NO-GO-FINAL-V1.md` |
| H4.0 Operação Controlada | `docs/relatorios/H4-0-GO-NO-GO-OPERACAO-CONTROLADA-V1-2026-05-23.md` |
| Acessos e ops | `docs/executive/final-delivery/05-OPERATIONS/V1-ACCESS-OPERATIONS.md` |
| Certificação V1.6 | `docs/certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md` |
| Runbooks | `docs/runbooks/README.md` |
| Smoke jogador | `docs/relatorios/F6-1D-C-SMOKE-JOGADOR-PIX-IN.md` |
| Saque manual | `docs/relatorios/F2-4C-AUDITORIA-VALIDACAO-BOTOES-SAQUE-PIX-READONLY-2026-05-29.md` |
| Backup / DR | `docs/relatorios/H4-3-AUDITORIA-BACKUPS-DISASTER-RECOVERY-2026-05-25.md` |
| Incident response | `docs/runbooks/INCIDENT-RESPONSE-FLOW.md` |

---

## 17. Declaração oficial OC1.0

| Pergunta | Resposta |
|----------|----------|
| Plano de Operação Controlada preparado? | **SIM** |
| Bloqueador crítico identificado? | **NÃO** |
| Piloto pode iniciar imediatamente sem pré-voo? | **NÃO** — exige §5 |
| Piloto pode iniciar com segurança após pré-voo? | **SIM** |

---

# OC1.0 — READY

**Emitido em modo read-only.** Nenhum componente do sistema foi modificado.

**Próxima ação do operador:** executar checklist §5 (Dia 0) e registrar data de início oficial da Operação Controlada.
