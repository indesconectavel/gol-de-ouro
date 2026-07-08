# V1.FINAL — Official Go-Live Checklist

**Uso:** validação pré-operação, re-certificação pós-deploy ou onboarding de operador  
**Baseline:** `a83c3cf` · Fly **v461** · `index-B6M2smS9.js`  
**Modo:** checklist manual — não altera produção automaticamente

---

## Legenda

- ☐ Pendente  
- ☑ Concluído  
- **OBR** = obrigatório antes de considerar go-live / continuidade certificada  
- **REC** = recomendado  
- **PÓS** = após go-live / primeira semana  

---

## 1. Runtime

| # | Item | Tipo | Critério de aceite |
|---|------|------|-------------------|
| 1.1 | `GET /meta` → `gitCommit` | **OBR** | Igual `a83c3cff…` ou novo SHA com certificação |
| 1.2 | `GET /health` → `status: ok` | **OBR** | HTTP 200, DB connected |
| 1.3 | Fly release documentada | **OBR** | Versão registrada (atual: v461) |
| 1.4 | Player bundle | **OBR** | `index-B6M2smS9.js` ou novo com registro |
| 1.5 | Drift repo vs runtime | **REC** | V1.2C script / relatório sem surpresas |

---

## 2. Workers

| # | Item | Tipo | Critério |
|---|------|------|----------|
| 2.1 | `GET /health/workers` | **OBR** | HTTP 200, flags payout habilitadas |
| 2.2 | Heartbeat payout nos logs Fly | **REC** | `[PAYOUT][WORKER][HEARTBEAT]` em janela 15 min |
| 2.3 | Reconcile worker / backlog | **REC** | Backlog estável vs baseline (54 pending) |

---

## 3. PIX (inbound)

| # | Item | Tipo | Critério |
|---|------|------|----------|
| 3.1 | Webhook sem HMAC → 401 | **OBR** | Probe read-only |
| 3.2 | RPC `claim_and_credit` | **OBR** | Callable; probe `not_found` OK |
| 3.3 | saldo_negativo = 0 | **OBR** | PostgREST read-only |
| 3.4 | dups_corr_tipo = 0 | **OBR** | PostgREST read-only |
| 3.5 | approved_sem_ledger | **REC** | ≤ 34 ou plano de redução documentado |
| 3.6 | Novos approved sem ledger (72h) | **OBR** | = 0 |

---

## 4. Payout (outbound)

| # | Item | Tipo | Critério |
|---|------|------|----------|
| 4.1 | Webhook payout sem HMAC → 401 | **OBR** | Probe live |
| 4.2 | Saques stuck `processando` | **OBR** | = 0 |
| 4.3 | Runbook payout worker | **REC** | Equipe conhece `RUNBOOK-payout-worker-offline.md` |

---

## 5. Backups

| # | Item | Tipo | Critério |
|---|------|------|----------|
| 5.1 | Backup Supabase configurado | **OBR** | Política PITR / snapshot ativa no painel |
| 5.2 | Snapshot PRE-APPLY antes de SQL | **OBR** | Para qualquer patch RPC/ledger |
| 5.3 | Backup repo / secrets | **REC** | `.env` fora do Git; vault documentado |

---

## 6. Observabilidade

| # | Item | Tipo | Critério |
|---|------|------|----------|
| 6.1 | `continuous-verification.js` | **REC** | Executado sem P0 |
| 6.2 | Relatório V1.2A atualizado | **REC** | Após mudança material |
| 6.3 | Monitoramento externo | **PÓS** | Ativar via V1.5D checklist quando aprovado |
| 6.4 | Alertas reais | **PÓS** | Só após dry-run V1.5C aprovado |

---

## 7. Rollback

| # | Item | Tipo | Critério |
|---|------|------|----------|
| 7.1 | Fly release anterior identificada | **OBR** | Ex.: v460 documentada |
| 7.2 | Snapshot RPC antes de deploy | **OBR** | `docs/relatorios/snapshots/` |
| 7.3 | Runbook rollback spike | **REC** | `RUNBOOK-rollback-spike.md` |
| 7.4 | Plano B SQL reversão | **REC** | Patches em `database/patches/` |

---

## 8. Monitoramento

| # | Item | Tipo | Critério |
|---|------|------|----------|
| 8.1 | Health endpoint em uptime (futuro) | **PÓS** | V1.5D |
| 8.2 | Métricas financeiras diárias | **REC** | Script read-only agendado |
| 8.3 | Log aggregation Fly | **REC** | `fly logs` acessível à equipe |

---

## 9. Limites

| # | Item | Tipo | Critério |
|---|------|------|----------|
| 9.1 | Rate limit webhooks | **REC** | Sem spike 5xx documentado |
| 9.2 | Limites MP / PIX | **REC** | Credenciais produção válidas |
| 9.3 | Limites saque admin | **OBR** | Política de valor documentada |

---

## 10. Freeze

| # | Item | Tipo | Critério |
|---|------|------|----------|
| 10.1 | `pre-deploy-gate.js` | **OBR** | REVIEW ou PASS antes de deploy |
| 10.2 | Freeze policy conhecida | **REC** | V1.5 freeze simulator |
| 10.3 | Incident P0 definido | **OBR** | `CLASSIFICACAO-DE-INCIDENTES.md` |

---

## 11. Suporte

| # | Item | Tipo | Critério |
|---|------|------|----------|
| 11.1 | Runbooks indexados | **OBR** | `docs/runbooks/README.md` |
| 11.2 | Contato on-call | **REC** | Definido para P0 |
| 11.3 | Admin acessível | **OBR** | Painel operacional testado |

---

## 12. Contingência

| # | Item | Tipo | Critério |
|---|------|------|----------|
| 12.1 | INCIDENT-RESPONSE-FLOW | **OBR** | Equipe treinada |
| 12.2 | Plano comunicação usuário | **PÓS** | Template para indisponibilidade |
| 12.3 | Mercado Pago status page | **REC** | Monitorar em incidentes PIX |

---

## Resumo por prioridade

### Obrigatório (bloqueia go-live se falhar)

- Health + meta alinhados  
- Webhooks 401 sem HMAC  
- saldo_negativo = 0, dups = 0  
- Novos approved sem ledger (72h) = 0  
- Backup Supabase ativo  
- pre-deploy-gate executado  

### Recomendado

- Heartbeat worker, continuous verification, runbooks lidos  
- Drift check, métricas diárias  

### Pós-go-live

- Uptime externo, alertas reais, comunicação em massa  

---

## Comandos de verificação (read-only)

```bash
node scripts/certification/v1-6-operational-production-certification.js
node scripts/operational/continuous-verification.js
node scripts/activation/pre-deploy-gate.js
```

---

_Checklist V1.FINAL — 2026-05-19. Não substitui certificação formal V1.6._
