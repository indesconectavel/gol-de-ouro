# VALIDAÇÃO — FASE 2.2A — CONTADOR TRANSACIONAL

**Data:** 2026-04-09  
**Modo:** read-only (código no repositório + evidência de execução SQL em produção).

---

## 1. Resumo executivo

A Fase 2.2A está **implementada de forma coerente** no ficheiro **`database/shoot_apply_atomic_transaction.sql`** e no handler **`POST /api/games/shoot`** em **`server-fly.js`**: o contador global, `metricas_globais`, linha em `chutes`, saldo em `usuarios` e cálculo de milestone / prémios estão **na mesma função transacional**; o backend **não** incrementa mais o contador nem chama **`saveGlobalCounter()`** nesse fluxo e **preenche** `shootResult` com valores devolvidos pela RPC (incluindo `contadorGlobal` via sincronização de `contadorChutesGlobal` e `novoSaldo`).

**Evidência externa:** execução bem-sucedida no SQL Editor do projeto **goldeouro-production** (script “Aplicar chute e atualizar saldo e métricas globais”, Fase 2.1 + 2.2A, resultado **Success. No rows returned**).

**Classificação:** **APROVADA COM RESSALVAS** — ressalvas: alterações **por commitar** no Git no estado inspecionado; **`server-fly-deploy.js`** mantém fluxo antigo com `saveGlobalCounter()` no shoot se esse entrypoint for usado; testes E2E **não** documentados neste relatório.

---

## 2. Escopo validado

| Critério | Evidência |
|----------|-----------|
| Ficheiros centrais | `server-fly.js` (handler do shoot), `database/shoot_apply_atomic_transaction.sql`, relatório de cirurgia `CIRURGIA-FASE2-2A-CONTADOR-TRANSACIONAL-2026-04-09.md`. |
| Restrito ao shoot + SQL | Diff de `server-fly.js` concentra-se no shoot; função `shoot_apply` versionada no SQL dedicado. |
| Sem expansão a PIX/saque/worker/frontend | Não há alterações a esses blocos no fluxo validado de `server-fly.js` para o shoot. |
| Lotes | Continuam em memória (`getOrCreateLoteByValue`, validador); **sem** persistência de lote nesta fase (conforme escopo). |

---

## 3. Função SQL confirmada

| Requisito | Evidência (`shoot_apply_atomic_transaction.sql`) |
|-----------|--------------------------------------------------|
| Remoção da assinatura antiga | `DROP FUNCTION IF EXISTS public.shoot_apply(uuid, text, text, numeric, text, numeric, numeric, boolean, integer, integer)` (linhas 7–9). |
| Lock em `metricas_globais` | `SELECT ... FROM metricas_globais ... WHERE id = 1 FOR UPDATE` (54–58). |
| `novo_contador` | `v_novo_contador := v_contador_atual + 1` (68). |
| `is_gol_de_ouro` (milestone) | `v_milestone := (v_novo_contador % 1000 = 0)` (69); usado em `INSERT` e no retorno. |
| `INSERT` em `chutes` | Bloco `INSERT` com `contador_global = v_novo_contador`, prémios e `is_gol_de_ouro = v_milestone` (92–115). |
| `UPDATE usuarios.saldo` | Linhas 117–121. |
| `UPDATE metricas_globais` | Linhas 128–133 (`contador_chutes_global`, `ultimo_gol_de_ouro`, `updated_at`). |
| Retorno | `jsonb_build_object` com `novo_saldo`, `chute_id`, `resultado`, `contador_global`, `is_gol_de_ouro`, `premio`, `premio_gol_de_ouro`, `ultimo_gol_de_ouro` (135–144). |
| Rollback implícito | Falha em qualquer passo da função reverte a transação completa (incluindo métricas + chute + saldo). |

---

## 4. Integração backend confirmada (`server-fly.js`)

| Requisito | Evidência |
|-----------|-----------|
| Sem `contadorChutesGlobal++` no shoot | O handler passa direto de validação de lote para cálculo de `result` e RPC; **não** há `++` neste bloco. |
| Sem `saveGlobalCounter()` no shoot | **Nenhuma** chamada a `saveGlobalCounter(` em `server-fly.js` além da **definição** da função (~2356); o shoot **não** invoca. |
| RPC com 6 parâmetros | `p_usuario_id`, `p_lote_id`, `p_direcao`, `p_valor_aposta`, `p_resultado`, `p_shot_index` (1230–1236). |
| Sincronização pós-RPC | `contadorChutesGlobal = Number(contadorRpc)`; `ultimoGolDeOuro` a partir de `ultimo_gol_de_ouro` (1294–1295). |
| Prémios / flag da RPC | `premio`, `premioGolDeOuro`, `isGolDeOuro` a partir de `rpcPayload` (1296–1301). |
| `shootResult` | `contadorGlobal: contadorChutesGlobal` (já igual ao valor RPC após sync); `premio`, `premioGolDeOuro`, `isGolDeOuro` dos mesmos valores; `novoSaldo = Number(saldoRpc)` (1372). |
| Contrato HTTP | `200` + `{ success: true, data: shootResult }`; campos esperados preservados; `chuteId` opcional. |

---

## 5. Regressão

| Área | Avaliação |
|------|-----------|
| Lotes | Lógica de índice vencedor e mutação **após** RPC mantida; não há refactor paralelo além da reordenação necessária (RPC antes do `push`). |
| PIX / saque | Sem alterações identificadas no fluxo do shoot em `server-fly.js`. |
| Contrato HTTP | Compatível com cliente que consome `success`, `data`, `novoSaldo`, `contadorGlobal`, prémios. |
| `server-fly-deploy.js` | **Risco:** ainda contém `await saveGlobalCounter()` no fluxo de shoot — **não** alinhado com Fase 2.2A se esse ficheiro for o processo de deploy. |

---

## 6. Ressalvas

1. **Git:** `server-fly.js` e ficheiros da Fase 2 podem estar **modificados / não rastreados** face ao último commit — fechar com commit/tag conforme processo interno.
2. **Deploy:** SQL no Supabase **antes** do backend que chama a nova assinatura; evidência de sucesso em **goldeouro-production** para o script da função.
3. **Testes reais:** MISS/GOAL/milestone/saldo insuficiente **não** estão anexados a este documento.
4. **Fora da transação:** estado do **lote em memória** (`lotesAtivos`) e eventual **segunda instância** do servidor continuam com limitações conhecidas (fora do escopo 2.2A).
5. **`saveGlobalCounter`:** permanece **definida** em `server-fly.js` mas **ociosa** no shoot; remoção futura é opcional (limpeza).

---

## 7. Classificação final

**APROVADA COM RESSALVAS**

**Justificativa:** implementação SQL e integração em `server-fly.js` cumprem o desenho da Fase 2.2A; há prova visual de aplicação do SQL em produção; permanecem ressalvas de **versionamento Git**, possível **`server-fly-deploy.js` legado** e **ausência de testes E2E** registados aqui.

---

## 8. Testabilidade

| Tipo | Estado |
|------|--------|
| Revisão estática de código + SQL | **Realizada** |
| Execução `node --check` | **Não repetida** nesta validação read-only |
| Testes contra API/BD | **Não evidenciados** neste documento |

---

## 9. Diagnóstico final

A Fase 2.2A pode ser considerada **tecnicamente concluída** no que toca a **contador + métricas + chute + saldo** numa única transação PostgreSQL e a **consumo dos valores na resposta do shoot** em `server-fly.js`, com as ressalvas acima e confirmação explícita de que o **deploy** usa **`server-fly.js`** (e não um duplicado desatualizado).
