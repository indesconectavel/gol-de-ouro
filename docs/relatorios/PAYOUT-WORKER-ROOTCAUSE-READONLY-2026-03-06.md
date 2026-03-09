# Root cause — Payout worker e saques PIX presos (READ-ONLY)

**Data:** 2026-03-06  
**Modo:** Somente leitura absoluto (nenhuma alteração de código, commit ou deploy).  
**Foco:** Bloqueador V1 — por que `payouts_falha: 5` e 5 saques presos >30 min.

---

## 1) Resumo executivo

- **Evidência em logs:** O worker registra **"Nenhum saque processado neste ciclo"** e **"Nenhum saque pendente"**; não aparece **"Saque selecionado"** nem **"Payout iniciado"** nas últimas ~800 linhas.
- **Evidência no banco:** Existem **5 saques** com `status = 'processando'`, `processed_at` e `transacao_id` nulos, todos com `correlation_id` e chave PIX (email); **ledger_financeiro** e **transacoes** estão **vazios** para esses 5 IDs.
- **Conclusão:** A **query do worker que busca saques pendentes/processando está retornando 0 linhas** em produção, embora os 5 existam no banco. O contador **payouts_falha: 5** é **em memória** (módulo `processPendingWithdrawals`) e foi provavelmente acumulado em ciclos anteriores, quando o worker ainda selecionava saques e o payout ou o rollback falhava.
- **Causa raiz mais provável:** A query `.from('saques').in('status', ['pendente','pending','processando']).order('created_at').limit(1)` no processo do worker está retornando **0 linhas** — por configuração (ex.: **PAYOUT_PIX_ENABLED=false** em algum momento, outro projeto Supabase no worker, réplica com atraso) ou por condição que não reproduzimos na auditoria com o mesmo Supabase.

---

## 2) Causa raiz mais provável

**A query do worker em produção não está retornando os 5 saques em status "processando".**

- **Onde:** `src/domain/payout/processPendingWithdrawals.js` linhas 236–241: seleção com `.in('status', [PENDING, 'pending', PROCESSING, 'processando'])`.
- **Efeito:** `pendentes.length === 0` → retorno `{ success: true, processed: false }` → no `payout-worker.js` (80–83) log **"Nenhum saque processado neste ciclo"**.
- **Por que payouts_falha: 5:** O objeto `payoutCounters` (linha 3 do mesmo arquivo) é **global no módulo**; `payoutCounters.fail` é incrementado apenas quando `createPixWithdraw` falha e o rollback é acionado (linha 365). Ou seja, em algum momento no passado o worker **chegou a selecionar saques**, chamou o MP, falhou, incrementou `fail` (e possivelmente o rollback não atualizou o status para rejeitado, deixando-os em "processando"). Hoje o worker **não está mais selecionando** nenhum saque, mas o contador permanece em 5.

---

## 3) Evidência por arquivo/linha

| Etapa | Arquivo | Linhas | Evidência |
|-------|---------|--------|-----------|
| Seleção de saques | `src/domain/payout/processPendingWithdrawals.js` | 236-241 | `.from('saques').select(...).in('status', [PENDING, 'pending', PROCESSING, 'processando']).order('created_at', { ascending: true }).limit(1)` |
| "Nenhum saque pendente" | `src/domain/payout/processPendingWithdrawals.js` | 254 | Só executa se `!pendentes \|\| pendentes.length === 0` |
| "Nenhum saque processado" | `src/workers/payout-worker.js` | 80-83 | `if (result?.processed === false)` → log exatamente esse |
| Incremento payouts_falha | `src/domain/payout/processPendingWithdrawals.js` | 364-365 | Após `rollbackWithdraw` quando `payoutResult?.success !== true` |
| Chamada MP | `src/domain/payout/processPendingWithdrawals.js` | 323-324 | `createPixWithdraw(netAmount, pixKey, pixType, userId, saqueId, correlationId)` |
| API MP | `services/pix-mercado-pago.js` | 292-302 | `POST ${MP_CONFIG.baseUrl}/v1/transfers`; token `MERCADOPAGO_PAYOUT_ACCESS_TOKEN`; `isConfigured()` exige token com prefixo `APP_USR-` ou `APP_USR_` |

---

## 4) Evidência por logs

- **payout-rootcause-worker-logs.json:**  
  - Contagens: **PAYOUT_WORKER** 81, **payouts_falha** 14, **Nenhum saque** 27.  
  - **Saque selecionado:** 0. **Payout iniciado:** 0. **ROLLBACK:** 0. **FALHOU:** 0. **LEDGER:** 0. **insert_falhou:** 0.
- **Conclusão da falha (campo do JSON):** `worker_roda_mas_nao_processa_ou_retorna_sem_saque`.
- Trechos típicos: `Resumo { payouts_sucesso: 0, payouts_falha: 5 }` e em seguida `Nenhum saque processado neste ciclo`; em outros ciclos `Nenhum saque pendente`.

---

## 5) O que está correto

- Worker sobe e roda ciclos (logs "Início do ciclo", "Fim do ciclo").
- Constantes de status (`withdrawalStatus.js`) estão alinhadas: `processando` está na lista da query.
- Os 5 saques no banco têm `correlation_id`, `pix_key`/`pix_type`, `net_amount`; não há restrição óbvia para serem selecionados.
- Lock e rollback estão implementados; em caso de falha de payout, o fluxo chama ledger (falha_payout) e rollback.

---

## 6) O que está quebrado

- **Query em produção retorna 0 linhas** para saques pendentes/processando, enquanto no mesmo período a auditoria (mesmo Supabase, service role) vê 5 saques "processando".
- **payouts_falha: 5** (ou 14 na janela maior) permanece em memória; não há logs atuais de tentativa de payout nem de rollback para esses 5.
- **Ledger e transacoes** vazios para os 5 IDs: o worker não está gravando nada para eles no estado atual (porque não está selecionando).

---

## 7) O que falta no fluxo de saque

1. **Garantir que a query do worker veja os mesmos saques** que o restante do sistema (mesmo Supabase, mesma env; checar `PAYOUT_PIX_ENABLED`, URL/chave do worker).
2. **Logar quantidade de linhas retornadas** pela query (ex.: `pendentes.length`) antes do `if (!pendentes || pendentes.length === 0)` para confirmar em produção se é 0 ou não.
3. **Em falha de payout:** garantir que o `rollbackWithdraw` atualize de fato o saque para `rejeitado` e `processed_at`; hoje, se esse update falhar, o saque fica em "processando" e o contador `payouts_falha` sobe.
4. (Opcional) **Reset ou exposição do contador** `payoutCounters` (ex.: por ciclo ou métrica) para não confundir com falhas antigas.

---

## 8) Patch mínimo V1 recomendado (sem implementar)

1. **Diagnóstico:** No worker, logo após a query de saques (após linha 241), adicionar log **read-only** com: número de linhas retornadas, valor de `payoutEnabled` e, se possível, indicador de qual Supabase está em uso (ex.: hash da URL, sem segredos). Objetivo: confirmar se em produção a query retorna 0 e se o payout está habilitado.
2. **Configuração:** Verificar no Fly, para o process group do **payout_worker**, que `PAYOUT_PIX_ENABLED=true` e que `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são os mesmos do app que persiste os saques.
3. **Rollback à prova de falha:** Após `rollbackWithdraw`, se o retorno for `success: false`, logar o erro e, como política V1, considerar novo tentativa de update do saque para `rejeitado` (ex.: por id apenas) ou marcar para suporte manual, para que nenhum saque fique eternamente em "processando" após falha de payout.
4. **Token MP:** Confirmar que `MERCADOPAGO_PAYOUT_ACCESS_TOKEN` no worker atende a `isConfigured()` em `pix-mercado-pago.js` (prefixo esperado `APP_USR-` ou `APP_USR_`); se o token de produção for outro formato, ajustar `isConfigured()` ou o token para evitar falha silenciosa antes da chamada a `/v1/transfers`.

---

## 9) Critério de sucesso pós-patch

- Logs mostram **"Saque selecionado"** e **"Payout iniciado"** quando existir saque pendente/processando.
- Se o payout falhar, logs mostram **rollback** e o saque passa a **rejeitado** com `processed_at` preenchido (não permanece em "processando").
- O contador de falhas reflete apenas o ciclo atual ou está documentado como acumulado; não há ambiguidade com ciclos antigos.

---

## 10) GO / NO-GO para patch

- **GO** para implementar o **patch mínimo** acima (diagnóstico + configuração + rollback robusto + token/isConfigured).  
- **NO-GO** para deploy de novo código de lógica de negócio (ex.: nova regra de seleção ou de MP) até que o diagnóstico confirme por que a query retorna 0 em produção e que os 5 saques presos tenham sido resolvidos (rejeitados ou processados manualmente).

---

## Anexos

| Anexo | Descrição |
|-------|-----------|
| `payout-rootcause-saques-presos.json` | 5 saques presos; ledger e transacoes vazios por ID |
| `payout-rootcause-worker-logs.json` | Contagens e 30 linhas relevantes; conclusão worker_roda_mas_nao_processa_ou_retorna_sem_saque |
| `payout-rootcause-status-flow.json` | Fluxo por etapa, arquivo e linhas |
| `payout-rootcause-mp-signals.json` | Token, guard, provider e sinais de erro |
| `payout-rootcause-ledger-links.json` | Uso do ledger no fluxo de falha e rollback |

---

*Auditoria 100% read-only; nenhum código ou deploy alterado.*
