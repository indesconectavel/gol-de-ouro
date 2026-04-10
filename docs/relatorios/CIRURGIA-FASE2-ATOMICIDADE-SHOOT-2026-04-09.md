# CIRURGIA — FASE 2 — ATOMICIDADE DO SHOOT

**Data:** 2026-04-09  
**Objetivo:** Uma única transação PostgreSQL para `INSERT` em `public.chutes` + `UPDATE` de `public.usuarios.saldo`.

---

## 1. Função criada (SQL completo)

O SQL canónico está versionado em:

`database/shoot_apply_atomic_transaction.sql`

Conteúdo: função `public.shoot_apply(...)` com:

- `SECURITY DEFINER`, `SET search_path = public`
- `SELECT ... FROM usuarios ... FOR UPDATE`
- validação de saldo ≥ `p_valor_aposta`
- cálculo: MISS `saldo - amount`; GOAL `saldo - amount + premio + premio_gol_de_ouro`
- `INSERT` em `chutes` (colunas alinhadas ao `insert` atual do backend)
- `UPDATE usuarios SET saldo, updated_at`
- retorno `jsonb`: `novo_saldo`, `chute_id`, `resultado`
- erros com códigos de mensagem: `SHOOT_APPLY_SALDO_INSUFICIENTE`, `SHOOT_APPLY_USUARIO_NAO_ENCONTRADO`, etc.
- `REVOKE ALL ... FROM PUBLIC`; `GRANT EXECUTE ... TO service_role`

**Deploy obrigatório:** executar esse ficheiro no Supabase **antes** de colocar o backend novo em produção; validar no catálogo real que `chutes` e `usuarios` têm as colunas esperadas (em especial `shot_index`, `direcao`, `updated_at` em `usuarios`).

---

## 2. Arquivo alterado (código)

| Ficheiro | Alteração |
|----------|-----------|
| `server-fly.js` | No `POST /api/games/shoot`: removidos `insert` direto em `chutes` e o loop de `update` de saldo; adicionada `supabase.rpc('shoot_apply', { ... })`; `novoSaldo` e opcional `chuteId` a partir do retorno. |
| `database/shoot_apply_atomic_transaction.sql` | **Novo** — DDL da função (não executado automaticamente pelo repositório). |

---

## 3. Integração backend

- Parâmetros RPC: `p_usuario_id`, `p_lote_id`, `p_direcao`, `p_valor_aposta`, `p_resultado`, `p_premio`, `p_premio_gol_de_ouro`, `p_is_gol_de_ouro`, `p_contador_global`, `p_shot_index` — espelham o payload antigo do `insert`.
- Erros mapeados: `SHOOT_APPLY_SALDO_INSUFICIENTE` → **400** “Saldo insuficiente”; `SHOOT_APPLY_USUARIO_NAO_ENCONTRADO` → **404**; restantes → **500**.
- Contrato HTTP de sucesso: mantido (`success`, `data` com os mesmos campos anteriores + `novoSaldo`; `chuteId` opcional se presente na resposta JSON).
- Lógica de lote, goal/miss, prémios, `saveGlobalCounter`, validações anteriores: **inalteradas** fora do bloco substituído.

---

## 4. Testes executados

| Teste | Resultado |
|-------|-----------|
| `node --check server-fly.js` | OK |
| MISS/GOAL/saldo insuficiente com Supabase real | **Não executado** neste ambiente (sem base ligada) |
| Verificação de rollback transacional no PostgreSQL | **Não executado** (requer SQL aplicado + sessão SQL) |

**Recomendação pós-deploy:** smoke test manual (um MISS, um GOAL) e, em SQL, tentativa de `shoot_apply` com saldo insuficiente confirmando **zero** linhas novas em `chutes`.

---

## 5. Impacto

- **Schema:** novo objeto `FUNCTION` + `GRANT`; **sem** nova tabela obrigatória.
- **Índices:** nenhum novo obrigatório.
- **Constraints:** reutiliza as existentes em `chutes` / `usuarios`; violações continuam a abortar a transação inteira.
- **Ordem operacional:** aplicar primeiro o SQL no Supabase, depois o deploy do backend.

---

## 6. Riscos remanescentes

- **Função não deployada:** o endpoint passa a falhar com erro RPC até o SQL ser aplicado.
- **Deriva de schema:** nomes/tipos de colunas ou ausência de `updated_at` / `shot_index` quebram a função — mitigação: validar catálogo antes do `CREATE FUNCTION`.
- **FK `lotes`:** se `chutes.lote_id` tiver `REFERENCES public.lotes(id)` e o `lote_id` em memória não existir na tabela `lotes`, o `INSERT` falha e faz rollback (saldo intacto) — comportamento correcto mas pode surpreender se a app nunca persistiu lotes.
- **Contador global / métricas:** continuam a ser atualizados **antes** da RPC; falha da RPC não reverte `contadorChutesGlobal` nem `metricas_globais` — limitação já existente, fora do núcleo atómico `chutes`+`saldo`.
- **Bloqueio `FOR UPDATE`:** outras operações no mesmo `usuario_id` podem esperar até a transação do shoot terminar.

---

## 7. Classificação final

**APROVADA COM RESSALVAS**

**Motivos:** implementação alinhada ao desenho (transação única, `FOR UPDATE`, retorno JSON); `server-fly.js` restrito ao shoot; dependência de **deploy SQL manual** e de **testes em ambiente real** não realizados aqui.

---

## 8. FATO vs RISCO

| Tipo | Conteúdo |
|------|----------|
| **FATO** | O backend deixa de fazer `insert`+`update` separados e passa a usar `shoot_apply`. |
| **FATO** | O SQL completo está em `database/shoot_apply_atomic_transaction.sql`. |
| **RISCO** | Falhas de schema ou ordem de deploy (backend antes do SQL) derrubam o shoot. |
