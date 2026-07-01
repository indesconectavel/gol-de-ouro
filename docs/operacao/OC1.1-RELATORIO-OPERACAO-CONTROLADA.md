# OC1.1 — Relatório de Execução da Operação Controlada

**Projeto:** Gol de Ouro™ V1  
**Data de emissão:** 2026-06-28  
**Modo:** READ-ONLY + OPERAÇÃO (monitoramento) — nenhum código, banco, deploy ou arquitetura alterado  
**Plano base:** `docs/operacao/OC1.0-PLANO-OPERACAO-CONTROLADA.md`  
**Parecer institucional prévio:** G1.0 — GO COM RESSALVAS

---

## Vereditos OC1.1

| Gate | Resultado |
|------|-----------|
| **Checklist OC1.0 §5 (antes de iniciar)** | **NOT READY** |
| **Operação piloto iniciada oficialmente?** | **NÃO** — sessão limitada a monitoramento de abertura |
| **Veredito OC1.1** | **FALHA** |

> **FALHA** nesta sessão significa: a Operação Controlada **não pôde ser aberta oficialmente** porque o checklist de entrada §5 permanece incompleto e probes live críticos falharam ou não puderam ser concluídos. Não indica regressão arquitetural da V1 certificada.

---

## 1. Resumo Executivo

A missão OC1.1 executou **monitoramento read-only de abertura** contra produção real (`goldeouro-backend-v2.fly.dev`) em **2026-06-28**, sem alterar qualquer componente do sistema.

**Evidências live capturadas nesta sessão:**

- `GET /meta` → **200** — runtime `production`, versão `1.2.1`, commit `22f75f71…`
- `GET /health/workers` → **200** — worker payout habilitado por env
- `https://admin.goldeouro.lol` → **carrega** (tela de login administrativo)

**Probes que falharam por timeout** (ambiente de auditoria / rede):

- `GET /health`
- Frontends player (`www`, `app`)
- `POST /api/payments/webhook` (probe HMAC)
- Scripts `v1-2a`, `v1-2b` (execução não concluída)

**Conclusão:** a plataforma responde parcialmente e permanece **operacional conforme evidências recentes** (F6.1D-B, 2026-06-12), porém **esta sessão OC1.1 não satisfaz o checklist §5** necessário para declarar início oficial do piloto com usuários reais.

---

## 2. Pré-voo — Checklist OC1.0 §5

| # | Critério | Status sessão OC1.1 | Evidência |
|---|----------|:-------------------:|-----------|
| E1 | `/health` → 200, DB+MP connected | ❌ | Timeout (>20s) nesta sessão; último OK: F6.1D-B 2026-06-12 |
| E2 | `/meta` → 200, gitCommit | ✅ | Live 2026-06-28 — ver §3 |
| E3 | Player e admin carregam | ⚠️ | Admin ✅ live; player timeout nesta sessão |
| E4 | Flags produção seguras | ❌ | Fly secrets não auditados (sem `flyctl` concluído) |
| E5 | Release Fly anterior identificada | ❌ | `fly releases` timeout nesta sessão |
| E6 | Conta jogador piloto testada | ❌ | Não executado — requer operador + credenciais |
| E7 | Conta admin testada | ❌ | UI carrega; login não exercitado nesta sessão |
| E8 | Matriz acesso preenchida | ❌ | Placeholders em V1-ACCESS-OPERATIONS |
| E9 | Credenciais em cofre | ❌ | Não verificável pelo agente |
| E10 | Smoke PIX IN (criar, sem pagar) | ❌ | Requer JWT jogador — não executado |
| E11 | Webhook 401 sem HMAC | ❌ | Timeout nesta sessão; histórico V1-2A: 401 ✅ |
| E12 | Equipe treinada saque manual | ❌ | Não verificável |
| E13 | `PAYOUT_MODE=manual` | ⚠️ | **Não confirmado**; `/health/workers` reporta `payoutPixProcessingEnabled: true` |
| E14 | Botão auto-send proibido | ❌ | Política — não verificável sem login admin |
| E15 | Script V1.2A baseline OK | ❌ | Execução não concluída (timeout) |
| E16 | Script V1.2B alertas | ❌ | Não executado |
| E17 | Runbook distribuído | ❌ | Operador |
| E18 | Canal incidente definido | ❌ | Operador |
| E19 | Plano contingência aceito | ❌ | Operador |

**Resultado §5:** **4/19** verificados ou parcialmente verificados · **NOT READY**

---

## 3. Registro de abertura (execução)

| Campo | Valor |
|-------|-------|
| **Data** | 2026-06-28 |
| **Hora início (UTC)** | ~01:56 UTC |
| **Hora fim sessão (UTC)** | ~02:06 UTC |
| **Tipo sessão** | Monitoramento de abertura (sem tráfego piloto) |
| **Versão API** | `1.2.1` |
| **Build** | `2025-10-21` |
| **Ambiente** | `production` |
| **Runtime SHA (`/meta`)** | `22f75f71ce60b60474de8470a4fee7ddfcc5d88f` |
| **Baseline certificada V1.6** | `a83c3cf…` (Fly v461) — **DRIFT** |
| **Release Fly** | Não capturada nesta sessão |
| **App Fly** | `goldeouro-backend-v2` |
| **Supabase prod** | `gayopagjdrkcmkirmfvy` (documentado) |

### 3.1 Evidência live — `GET /meta` (200)

```json
{
  "success": true,
  "data": {
    "version": "1.2.1",
    "build": "2025-10-21",
    "gitCommit": "22f75f71ce60b60474de8470a4fee7ddfcc5d88f",
    "environment": "production",
    "features": {
      "pix": true,
      "goldenGoal": true,
      "monitoring": true
    }
  }
}
```

**Captura:** 2026-06-28 (WebFetch read-only)

### 3.2 Evidência live — `GET /health/workers` (200)

```json
{
  "success": true,
  "timestamp": "2026-06-28T01:58:44.496Z",
  "data": {
    "payoutWorker": {
      "enabledByEnv": true,
      "payoutPixProcessingEnabled": true
    }
  }
}
```

### 3.3 Evidência live — Painel Admin

- URL: `https://admin.goldeouro.lol`
- Status: **carrega** — tela "Painel Administrativo", formulário login
- Captura: 2026-06-28 (WebFetch read-only)

### 3.4 Feature flags (estado observável)

| Flag | Valor OC1.0 exigido | Observado OC1.1 | Fonte |
|------|---------------------|-----------------|-------|
| `ASAAS_PRODUCTION_ENABLED` | `false` | **Não exposto** — assumido false (G1.0/P1.0) | Documentação |
| `ASAAS_WEBHOOK_ENABLED` | `false` | **Não exposto** | — |
| `PAYMENT_WEBHOOK_ENGINE_ENABLED` | `false` | **Não exposto** | — |
| `PAYOUT_MODE` | `manual` | **Não confirmado** | — |
| `PAYOUT_PIX_ENABLED` | conforme MP | **`true`** (inferido) | `/health/workers` |
| `NODE_ENV` | `production` | **`production`** | `/meta` |

**Ressalva E13:** worker payout habilitado por env — **validar com operador** se piloto exige `PAYOUT_MODE=manual` estrito antes de abrir usuários.

---

## 4. Período operado

| Conceito | Valor |
|----------|-------|
| Período piloto OC1.0 (14–30 dias) | **Não iniciado** |
| Sessão OC1.1 | **~10 minutos** — monitoramento de abertura |
| Usuários piloto ativos | **0** (nenhum convite/tráfego registrado nesta sessão) |

---

## 5. Monitoramento por componente

| Componente | Status sessão | Evidência |
|------------|---------------|-----------|
| **Frontend Player** | ⚠️ Não verificado live | Timeout; F6.1D-C (2026-06-12): operacional |
| **Backend API** | ✅ Parcial | `/meta` + `/health/workers` 200 |
| **Health completo** | ❌ Timeout | F6.1D-B: `/health` 200, DB+MP connected |
| **Wallet** | ❌ Não consultado live | Baseline V1-2A: saldo_negativo **0** |
| **Ledger** | ❌ Não consultado live | F6.1D-B: 79 linhas (svc) |
| **PIX IN** | ❌ Não exercitado | F6.1D-C: criar PIX 200 (2026-06-12) |
| **Painel Admin** | ✅ UI carrega | Login não testado nesta sessão |
| **Logs Fly** | ❌ Não acessados | Sem token flyctl nesta sessão |

---

## 6. Eventos operacionais (sessão OC1.1)

> Período sem tráfego piloto — todos os contadores de **atividade nova nesta sessão** são **zero**.

| Evento | Sessão OC1.1 | Última ref. produção documentada |
|--------|:------------:|----------------------------------|
| Usuários piloto ativos | 0 | — |
| Cadastros novos | 0 | — |
| Depósitos PIX criados | 0 | F6.1D-C: 1 smoke (2026-06-12) |
| PIX aprovados (crédito) | 0 | — |
| PIX rejeitados | 0 | — |
| Jogadas (`contadorChutes`) | N/A live | F6.1D-B: **535** (2026-06-12) |
| Prêmios (`ultimoGolDeOuro`) | N/A live | F6.1D-B: **0** |
| Solicitações de saque | 0 | F6.1D-B: 27 saques totais (hist.) |
| Saques aprovados manualmente | 0 | — |
| Falhas operacionais | 4 probes timeout | Ver §8 |
| Alertas V1.2B | N/A | Script não concluído |
| Incidentes formais | 0 P0/P1 prod | 1 incidente **auditoria** (rede) |

---

## 7. Financeiro

### 7.1 Snapshot histórico (última captura read-only confiável)

**Fonte:** F6.1D-B / `validate-post-remediation.json` — **2026-06-12**

| Métrica | Valor |
|---------|-------|
| `/health` database | connected |
| `/health` mercadoPago | connected |
| Ledger (svc count) | 79 |
| Saques (svc count) | 27 |
| Saldo negativo | **0** (V1-2A baseline) |
| PIX approved sem ledger (legado) | 34 (baseline estável) |
| Duplicatas ledger | **0** (V1-2A) |

### 7.2 Movimentação financeira sessão OC1.1

| Tipo | Valor |
|------|-------|
| Depósitos creditados | **R$ 0,00** |
| Saques processados | **R$ 0,00** |
| Alterações wallet/ledger | **Nenhuma** (read-only) |

---

## 8. Engine do jogo

| Item | Evidência |
|------|-----------|
| RPC `shoot_apply` V1 | Certificado F2.2C-Z — **não reexecutado** nesta sessão |
| `contadorChutes` | **535** (F6.1D-B, 2026-06-12) |
| Gameplay live OC1.1 | **Não exercitado** |

---

## 9. Incidentes

### INC-OC1.1-001 — Timeouts de rede (auditoria)

| Campo | Valor |
|-------|-------|
| **Hora (UTC)** | 2026-06-28 ~01:56–02:06 |
| **Descrição** | Probes `curl`/Node para `/health`, player, webhook e scripts V1.2A excederam timeout (>15–120s) a partir do ambiente de auditoria |
| **Impacto** | **Baixo em produção** — impede conclusão checklist §5 e métricas live; **não** indica downtime comprovado do backend ( `/meta` respondeu) |
| **Correção** | Repetir probes de rede estável / operador local; executar V1.2A/B/C manualmente |
| **Rollback** | Não aplicável |

### INC-OC1.1-002 — Runtime drift vs baseline certificada

| Campo | Valor |
|-------|-------|
| **Hora** | Detectado 2026-06-28 |
| **Descrição** | `/meta` reporta `22f75f71…` ≠ baseline V1.6 `a83c3cf…` |
| **Impacto** | **Médio** — certificação V1.6 formalmente desalinhada; operação possível com ressalva documentada (já conhecida desde F6.1D-B) |
| **Correção** | Documentar release atual; renovar certificação ou aceitar drift conscientemente |
| **Rollback** | Runbook `RUNBOOK-runtime-drift` se regressão funcional |

**Incidentes P0/P1 em produção durante piloto:** **0**

---

## 10. Indicadores (sessão OC1.1)

| Indicador | Valor | Nota |
|-----------|-------|------|
| **Disponibilidade probes** | 2/5 = **40%** | meta, workers, admin OK; health/player/webhook fail |
| **Disponibilidade backend (inferida)** | **Parcial** | `/meta` latente mas responsivo |
| **Tempo médio PIX** | N/A | Nenhum PIX nesta sessão |
| **Erros HTTP (probes)** | 3 timeouts | Ambiente auditoria |
| **Duplicidades ledger** | N/A live | Baseline: **0** |
| **Saldo total plataforma** | N/A live | H4.1B ref.: ~R$ 169k (2026-05-23) — **não revalidado** |
| **Ledger linhas** | N/A live | Ref. 2026-06-12: **79** |
| **Eventos HMAC rejeitados** | N/A | Probe webhook não concluído; histórico: 401 sem assinatura |

---

## 11. Lições aprendidas

1. **Checklist §5 exige operador humano** — credenciais, treinamento e canais de incidente não são automatizáveis pelo agente.
2. **Probes de abertura devem rodar da rede do operador** — timeouts do ambiente CI/local bloquearam E1/E3/E10/E11/E15.
3. **`/health/workers` expõe flags payout** — validar alinhamento com política OC1.0 (manual only) antes do Dia 1 real.
4. **Runtime drift é fato operacional** — `22f75f71` em prod vs `a83c3cf` certificado; monitorar via V1.2C.
5. **Evidência recente (F6.1D-C/B) sustenta confiança** quando probes imediatos falham — mas **não substituem** pré-voo live no Dia 0.

---

## 12. Pendências (bloqueiam próxima tentativa)

| # | Pendência | Prioridade |
|---|-----------|------------|
| P1 | Completar checklist §5 com operador (E6–E9, E12, E17–E19) | **Crítica** |
| P2 | Executar V1.2A/B/C de rede estável e arquivar JSON | **Alta** |
| P3 | Confirmar `/health` 200 + player 200 no Dia 0 | **Alta** |
| P4 | Confirmar `PAYOUT_MODE=manual` ou documentar exceção | **Alta** |
| P5 | Smoke PIX IN + webhook 401 live | **Alta** |
| P6 | Preencher matriz de acesso V1-ACCESS | **Média** |
| P7 | Registrar release Fly + rollback target | **Média** |

---

## 13. Conclusão

A missão **OC1.1** registrou uma **sessão de monitoramento de abertura** em produção real, capturando evidências parciais de runtime ativo (`/meta`, `/health/workers`, admin UI), **sem iniciar tráfego piloto** e **sem alterar o sistema**.

O checklist **OC1.0 §5** permanece **NOT READY** — a Operação Controlada com usuários reais **não foi oficialmente iniciada** nesta sessão.

A V1 certificada permanece a base arquitetural; a falha é **operacional/de preparação**, não de implementação nesta missão.

---

## 14. Veredito oficial OC1.1

# FALHA

*(Falha de **execução do go-live piloto** nesta sessão — checklist incompleto e probes críticos não concluídos. Recomenda-se nova sessão **OC1.1-R** após completar §5.)*

---

## 15. Próxima ação recomendada

1. Operador executar checklist `OC1.0-PLANO-OPERACAO-CONTROLADA.md` §5 integralmente.
2. Arquivar JSON de `v1-2a`, `v1-2b`, `v1-2c` com timestamp Dia 0.
3. Registrar data/hora oficial de início piloto em `OC1.1-R` ou continuação deste relatório.
4. Manter limites OC1.0: ≤50 usuários, depósito/saque máx. R$ 100, saque manual only.

---

**Referências:** OC1.0 · G1.0 · F6.1D-B · F6.1D-C · V1-2A JSON · H4.0  
**Modo:** READ-ONLY + monitoramento — **nenhum componente do sistema alterado**

---

## Addendum — Probes `curl.exe` (pós-sessão, 2026-06-28 ~02:03–02:05 UTC)

Os comandos em background concluíram após a redação inicial. Falhas anteriores com `curl` no PowerShell eram alias de `Invoke-WebRequest` — **`curl.exe` respondeu corretamente** (latência alta: ~6–8 min).

| Probe | Resultado | Evidência |
|-------|-----------|-----------|
| `GET /health` | **200 OK** | `database: connected`, `mercadoPago: connected`, `contadorChutes: 535` |
| `GET /meta` | **200 OK** | `gitCommit: 22f75f71…`, `environment: production` |
| `www.goldeouro.lol` | **HTTP 200** | — |
| `admin.goldeouro.lol` | **HTTP 200** | bundle `index-490acf3c.js` |

**Revisão checklist §5:** E1 ✅ · E2 ✅ · E3 ✅ (parcial — status HTTP only, sem login). Demais itens operacionais permanecem pendentes — **NOT READY** mantido. Veredito **FALHA** mantido (piloto não iniciado; §5 incompleto).

### Addendum B — Script V1.2A (2026-06-28 ~02:07 UTC)

`node scripts/v1-2a-runtime-financial-health.js` concluiu com **exit 0**:

| Campo | Valor |
|-------|-------|
| **Verdict script** | **NO-GO** (blocker: `runtime`) |
| `finance_healthy` | **true** |
| `webhooks_protected` | **true** |
| `health_ok` | **true** |
| `player_reachable` | **true** |
| `git_commit_match` | **false** (drift vs baseline `a83c3cf`) |
| `fly_version_match` | **false** |
| `payout_healthy` | **false** |
| `residual_risks_count` | 5 |

**Checklist §5:** E15 parcialmente atendido — financeiro OK, runtime drift impede GO do script. Métricas financeiras completas capturadas (JSON completo em stdout da execução).

### Addendum C — Probe webhook HMAC (2026-06-28 ~02:07 UTC)

`POST /api/payments/webhook` sem assinatura → resposta **`{"error":"Invalid signature"}`** (exit 0). Comportamento esperado de hardening V1.1F — **E11 ✅**.

### Addendum D — Fly releases (2026-06-28)

`fly releases -a goldeouro-backend-v2` → **falhou** (`exit 1`): *no access token available* — requer `flyctl auth login` no ambiente do operador. **E5 ❌** permanece pendente.
