# CIRURGIA — FASE 2.2A — CONTADOR TRANSACIONAL

**Data:** 2026-04-09  
**Objetivo:** Eliminar drift entre contador em memória, `metricas_globais`, `chutes.contador_global` e a resposta do `POST /api/games/shoot`, mantendo saldo + chute na mesma transação.

---

## 1. Alterações

### SQL — `database/shoot_apply_atomic_transaction.sql`

- Assinatura reduzida: remove `p_premio`, `p_premio_gol_de_ouro`, `p_is_gol_de_ouro`, `p_contador_global`.
- `SELECT ... FOR UPDATE` em `public.metricas_globais` onde `id = 1`; se não existir linha → `SHOOT_APPLY_METRICAS_AUSENTE`.
- `v_novo_contador := contador_atual + 1`; `v_milestone := (v_novo_contador % 1000 = 0)`.
- Prémios calculados no BD: goal → R$5; goal + milestone → +R$100 (Gol de Ouro).
- `INSERT` em `chutes` usa `v_novo_contador`, `v_premio`, `v_premio_gol`, `v_milestone`.
- `UPDATE usuarios.saldo` (inalterado em espírito).
- `UPDATE metricas_globais`: `contador_chutes_global`, `ultimo_gol_de_ouro` (só avança para o número do chute quando **goal** e **milestone**, alinhado ao JS antigo), `updated_at`.
- Ordem de locks: **métricas** → **usuário** (consistente dentro da função).
- Retorno `jsonb`: `novo_saldo`, `chute_id`, `resultado`, `contador_global`, `is_gol_de_ouro`, `premio`, `premio_gol_de_ouro`, `ultimo_gol_de_ouro`.
- `GRANT EXECUTE` para `service_role` com a nova assinatura `(uuid, text, text, numeric, text, integer)`.

### Backend — `server-fly.js` (`POST /api/games/shoot`)

- Removidos: `contadorChutesGlobal++`, `saveGlobalCounter()` neste fluxo, cálculo local de prémios / `isGolDeOuro`.
- **RPC antes** de mutar o lote na memória: falha da RPC não deixa lote com chute “fantasma”.
- Após sucesso: sincroniza `contadorChutesGlobal` e `ultimoGolDeOuro` a partir da RPC; monta `chute`, `push`, totais e `validateAfterShot` com valores da RPC.
- Falha de `validateAfterShot` após RPC → **500** (persistência já ocorrida — cenário anómalo).
- Erros: `SHOOT_APPLY_METRICAS_AUSENTE` → **503**; `SHOOT_APPLY_USUARIO_NAO_ENCONTRADO` → **404**.
- `shootResult.contadorGlobal`, `premio`, `premioGolDeOuro`, `isGolDeOuro` vêm da RPC; contrato HTTP de sucesso preservado (`success`, `data`, `novoSaldo`).

### `saveGlobalCounter`

- Função mantida no ficheiro mas **deixa de ser chamada** no shoot; métricas passam a ser atualizadas só na RPC (outros usos futuros possíveis).

---

## 2. Testes executados

| Teste | Resultado |
|-------|-----------|
| `node --check server-fly.js` | OK |
| MISS/GOAL/Gol de Ouro / erro com Supabase real | **Não executado** neste ambiente |

---

## 3. Impacto

- **Deploy:** aplicar **primeiro** o SQL no Supabase (substitui a função `shoot_apply` pela nova assinatura), **depois** o backend.
- **Retrocompatibilidade:** clientes que chamavam a RPC antiga deixam de ser válidos — só o backend com `service_role` é o consumidor esperado.
- **Dados:** exige linha `metricas_globais.id = 1` existente e coerente com o contador desejado antes do primeiro chute pós-deploy.

---

## 4. Riscos remanescentes

- Ordem de locks **métricas vs outros fluxos** que toquem `usuarios` primeiro: risco teórico de **deadlock** sob contenção extremamente rara.
- `validateAfterShot` a falhar após commit: requer investigação (não deveria ocorrer se `result` for consistente com o lote).
- **Multi-instância:** `lotesAtivos` continua em memória por processo — fora do escopo desta fase.

---

## 5. Classificação

**APROVADA COM RESSALVAS** — dependência de deploy SQL coordenado e de smoke tests reais (MISS, GOAL, milestone 1000, saldo insuficiente sem persistência).
