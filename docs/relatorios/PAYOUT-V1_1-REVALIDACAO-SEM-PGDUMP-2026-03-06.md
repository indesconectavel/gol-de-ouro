# Revalidação PAYOUT V1.1 (sem pg_dump) — Relatório

**Data:** 2026-03-06  
**Contexto:** Deploy seguro sem pg_dump executado; release v313 no ar. Patch V1.1 visível nos logs.

---

## Sinais novos do worker

- **[PAYOUT][CYCLE]:** enabled=true, db=ok, provider=ok (vários ciclos).
- **[PAYOUT][QUERY]:** statuses=pendente,pending,processando **count=0**.
- **[PAYOUT][SELECT]:** 0 (nenhum saque selecionado).
- **[PAYOUT][SKIP]:** 0.
- **[PAYOUT][ROLLBACK_FAIL]:** 0.
- **Resumo no log:** payouts_sucesso: 0, payouts_falha: 5.

---

## Causa confirmada ou mais provável

**Query retorna 0 em produção.**  

A query do worker (statuses=pendente,pending,processando) devolve **count=0** no Fly, ao passo que o snapshot lógico pré-deploy mostrou **5 saques em status processando**. Conclusão automática: **query_retorna_0_em_producao**.

Hipóteses para V1.2:

1. **RLS:** Políticas na tabela `saques` que ocultam linhas ao role/service key usada pelo payout_worker no Fly.
2. **Contexto de conexão:** Uso de pooler vs conexão direta (Supabase) alterando visibilidade.
3. **Valor de status:** Diferença de casing ou valor armazenado (ex.: "Processando" vs "processando") ou coluna diferente.

---

## Situação dos 5 saques

- Os 5 saques continuam em estado “processando” (snapshot antes do deploy + resumo do worker: payouts_falha: 5).
- Nenhum SELECT; nenhum SKIP; nenhum rollback_failed nos logs.
- Nenhuma mudança em processed_at ou transacao_id atribuída ao worker no período pós-deploy (worker não está selecionando linhas).

---

## Próximo patch recomendado (V1.2)

1. **Verificar RLS em `saques`:** Garantir que o role usado pelo payout_worker (service_role ou o usuário do Supabase no Fly) tenha SELECT (e update) para as linhas em processando.
2. **Logar query bruta (opcional):** Em ambiente controlado, logar count e uma amostra de IDs retornados pela mesma query (sem expor dados sensíveis) para comparar com o snapshot.
3. **Conferir valor de status:** Confirmar no banco o valor exato da coluna status dos 5 saques (case-sensitive, espaços, etc.) e alinhar com o filtro da query (pendente,pending,processando).

---

## Confirmações explícitas

| Item | Status |
|------|--------|
| Frontend preservado | Sim — nenhuma alteração no Vercel. |
| /game preservado | Sim — status 200, server Vercel, hash HTML igual ao pré-deploy. |
| Vercel intocado | Sim — nenhum deploy nem workflow de frontend. |

---

## Conclusão

Patch V1.1 está em produção e a observabilidade confirmou a causa mais provável: **query retorna 0 em produção** (possível RLS ou contexto). Os 5 saques seguem em processando; próximo passo é V1.2 com checagem de RLS e alinhamento da query com o estado real da tabela `saques`.
