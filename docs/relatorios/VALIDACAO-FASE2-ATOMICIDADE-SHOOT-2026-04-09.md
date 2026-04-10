# VALIDAÇÃO — FASE 2.1 — ATOMICIDADE DO SHOOT

**Data:** 2026-04-09  
**Modo:** validação read-only do código no repositório + evidência de execução SQL fornecida pela equipa.

---

## 1. Resumo executivo

A Fase 2.1 está **implementada de forma coerente** no repositório: existe a função `public.shoot_apply` em `database/shoot_apply_atomic_transaction.sql` com **`FOR UPDATE` em `usuarios`**, validação de saldo **antes** do `INSERT` em `chutes`, `UPDATE` de `saldo` na **mesma** função PL/pgSQL (uma transação implícita), e retorno `jsonb` com `novo_saldo` e `chute_id`. O `server-fly.js` **substituiu** o par insert direto + loop de saldo por **`supabase.rpc('shoot_apply', …)`**, mantendo o envelope de sucesso (`success`, `data`, `novoSaldo`) e tratamento de erros mapeados.

**Evidência externa:** captura do SQL Editor do projeto **goldeouro-production** (Supabase) com execução bem-sucedida do script da função (“Success. No rows returned.”), compatível com o desenho Fase 2.1.

**Classificação:** **APROVADA COM RESSALVAS** — ressalvas: alterações da Fase 2 no Git local analisado aparecem como **não commitadas** (`server-fly.js` modificado, SQL e relatório de cirurgia como ficheiros novos); **testes automatizados** MISS/GOAL contra API real **não** constam neste relatório; parte do fluxo do shoot (**contador global / `metricas_globais`**) permanece **fora** da transação da função.

---

## 2. Escopo validado

| Critério | Evidência |
|----------|-----------|
| Ficheiros esperados | `server-fly.js` (alteração localizada), `database/shoot_apply_atomic_transaction.sql` (novo), documentação `docs/relatorios/CIRURGIA-FASE2-ATOMICIDADE-SHOOT-2026-04-09.md` (novo). |
| Restrito ao shoot | O `git diff` de `server-fly.js` concentra-se no handler `POST /api/games/shoot`; não há alteração funcional a rotas de PIX/saque no diff (apenas remoção de comentário que citava “fluxo de saque”). |
| Sem expansão de escopo | Não há mudanças a worker, frontend ou novos endpoints além do núcleo shoot + artefacto SQL. |

---

## 3. Função confirmada (`database/shoot_apply_atomic_transaction.sql`)

| Requisito | Confirmação |
|-----------|-------------|
| Lock em `usuarios` | `SELECT u.saldo ... WHERE u.id = p_usuario_id FOR UPDATE` (linhas 45–48). |
| Validar saldo antes do insert | Após o lock: `IF v_saldo < p_valor_aposta THEN RAISE ... SHOOT_APPLY_SALDO_INSUFICIENTE` (52–55) **antes** do `INSERT` (64–87). |
| Inserir em `chutes` | `INSERT INTO public.chutes (...)` com colunas alinhadas ao payload histórico do backend. |
| Atualizar `usuarios.saldo` | `UPDATE public.usuarios SET saldo = v_novo_saldo, updated_at = now()` (89–93). |
| Retorno `novo_saldo` e id do chute | `jsonb_build_object('novo_saldo', ..., 'chute_id', to_jsonb(v_chute_id), 'resultado', ...)` (95–99). |
| Rollback implícito | Qualquer exceção antes do fim da função faz **abort** da transação da chamada: **não** persistem `INSERT` e `UPDATE` em conjunto parcial dentro desta função. |

**Nota semântica:** a ordem interna é lock + validação + cálculo + **INSERT** + **UPDATE**. Em PostgreSQL, falha no `UPDATE` após `INSERT` bem-sucedido **reverte ambos** na mesma transação — mantém atomicidade entre as duas escritas.

---

## 4. Integração backend confirmada (`server-fly.js`)

| Requisito | Confirmação |
|-----------|-------------|
| Substituir insert + update por RPC | Chamada `supabase.rpc('shoot_apply', { p_usuario_id, p_lote_id, ... })` (~1298–1310); ausência do antigo `.from('chutes').insert` e do loop de `update` de saldo. |
| Contrato HTTP preservado | Resposta de sucesso continua `res.status(200).json({ success: true, data: shootResult })` com os mesmos campos de jogo; `shootResult.novoSaldo` preenchido a partir de `rpcPayload.novo_saldo`. |
| `novoSaldo` no response | `shootResult.novoSaldo = Number(saldoRpc)` (~1380). |
| Campo opcional | `chuteId` atribuído se `chute_id` vier no JSON (~1381–1383). |
| Erros | Mensagens `SHOOT_APPLY_SALDO_INSUFICIENTE` → 400; `SHOOT_APPLY_USUARIO_NAO_ENCONTRADO` → 404; resto → 500. |

---

## 5. Regressão

| Área | Avaliação |
|------|-----------|
| PIX | Sem alterações no diff analisado do `server-fly.js` fora do shoot. |
| Saque | Idem. |
| Lotes em memória | Lógica de lote **antes** da RPC **mantida**; apenas o ponto de persistência+saldo mudou. |
| Métricas | `saveGlobalCounter` / incremento de contador **não** foram movidos para dentro da função SQL — comportamento lateral **inalterado** em intenção (fora do núcleo atómico). |

---

## 6. Ressalvas

1. **Git:** no estado inspecionado, a Fase 2 pode estar **por commitar/push** em relação ao último commit (`fase1-jogo-saldo-explicito-shoot-2026-04-09`).
2. **Deploy backend:** a função no Supabase (evidência de produção) **não** garante por si que o **binário/servidor** já esteja na versão que chama `shoot_apply` — validar versão deployada do backend em conjunto.
3. **Fora da transação `shoot_apply`:** `contadorChutesGlobal++`, `saveGlobalCounter()`, estado em RAM do lote — podem divergir se a RPC falhar após esses passos (limite já conhecido da arquitetura atual).
4. **Testes:** não há neste dossiê resultado de testes E2E (MISS/GOAL/insuficiência) documentados contra a API em staging/produção.

---

## 7. Classificação final

**APROVADA COM RESSALVAS**

**Justificativa:** desenho e código no repositório cumprem o objetivo de **atomicidade entre `chutes` e `usuarios.saldo`**; há evidência visual de aplicação do SQL em **goldeouro-production**; permanecem ressalvas de **gestão de versões Git/deploy** e de **testes formais** não anexados.

---

## 8. Testabilidade

| Tipo | Estado |
|------|--------|
| Validação por leitura de código / diff | **Realizada** |
| `node --check` (referência cirurgia) | **Não repetido nesta validação read-only** |
| Testes com Supabase/API | **Não evidenciados** neste documento |

---

## 9. Diagnóstico final

A Fase 2.1 pode ser considerada **tecnicamente concluída** quanto ao **desenho e à implementação no código-fonte analisado**, com **confirmação visual** de criação da função no ambiente **goldeouro-production**, desde que a equipa **feche o ciclo** com commit/deploy do backend alinhado e smoke tests registados conforme processo interno.
