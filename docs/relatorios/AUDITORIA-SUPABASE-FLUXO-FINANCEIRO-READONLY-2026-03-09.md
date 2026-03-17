# AUDITORIA SUPABASE — FLUXO FINANCEIRO REAL

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Modo:** Estritamente READ-ONLY — inspeção de código, schema SQL e documentação. Nenhuma alteração de banco, migrations, triggers ou deploy.  
**Evidência crítica:** Consulta executada no Supabase real: `SELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid = 'chutes'::regclass AND NOT tgisinternal;` → **Success. No rows returned.**

---

## 1. Resumo executivo

A auditoria do fluxo financeiro no Supabase foi conduzida por **leitura do repositório**: schema SQL (schema-supabase-final.sql, SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql), backend (server-fly.js), scripts de confirmação e relatórios anteriores (AUDITORIA-SUPREMA-PRE-PATCH-BLOCO-D-READONLY-2026-03-07, CONFIRMACAO-TRIGGER-SALDO-CHUTES-READONLY-2026-03-07).  

**Verdade financeira atual:**

- **Triggers na tabela `chutes` no banco real:** **nenhum**. A consulta em pg_trigger para a tabela `chutes` retornou zero linhas.
- **Função `update_user_stats`:** Definida **apenas** no arquivo schema-supabase-final.sql; não há evidência de que exista no Supabase atual (a existência da função só pode ser confirmada com consulta a pg_proc no ambiente real; relatórios e script de confirmação indicam que em produção a função não existe ou o trigger não está presente).
- **Backend:** Assume que o trigger `update_user_stats` debita o perdedor (MISS). Para **goal**, o backend faz UPDATE explícito em `usuarios.saldo`. Para **miss**, o backend **não** atualiza saldo — depende 100% do trigger.
- **Consequência:** No estado atual do banco (sem triggers em `chutes`), **perdedores não têm saldo debitado**. O vencedor é creditado corretamente pelo backend. A economia do lote **não fecha**: a plataforma retém menos do que deveria (R$ 5 por lote), porque o dinheiro “perdido” pelos 9 perdedores nunca sai do saldo deles.
- **RPCs:** Nenhuma RPC é chamada pelo endpoint de chute (POST /api/games/shoot). Não existe substituição via RPC do trigger ausente no fluxo real de gameplay.

**Diagnóstico:** O banco está **financeiramente inconsistente** em relação ao comportamento esperado pela engine V1: débito do perdedor não ocorre; apenas o crédito do vencedor ocorre (via backend).

---

## 2. Triggers encontrados

### 2.1 No banco real (evidência fornecida)

- **Consulta executada:**  
  `SELECT tgname, pg_get_triggerdef(oid) FROM pg_trigger WHERE tgrelid = 'chutes'::regclass AND NOT tgisinternal;`
- **Resultado:** **No rows returned.**
- **Conclusão:** A tabela **chutes** no Supabase atual **não possui triggers manuais**. Nem `trigger_update_user_stats`, nem `trigger_update_metrics`, nem qualquer outro trigger definido pelo projeto.

### 2.2 No repositório (o que está definido, não o que está no banco)

| Arquivo | Trigger | Tabela | Evento | Função |
|--------|---------|--------|--------|--------|
| schema-supabase-final.sql | trigger_update_metrics | public.chutes | AFTER INSERT | update_global_metrics() |
| schema-supabase-final.sql | trigger_update_user_stats | public.chutes | AFTER INSERT | update_user_stats() |

- **SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql:** Não define **nenhum** trigger na tabela `chutes`. Define apenas triggers de `update_updated_at_column()` em outras tabelas (usuarios, metricas_globais, lotes, pagamentos_pix, saques, configuracoes_sistema).
- **Outros arquivos .sql:** Nenhum outro arquivo do repositório define trigger em `chutes` que altere saldo ou métricas.

**Resumo:** No código-fonte, os únicos triggers que debitam/creditan saldo em função de INSERT em `chutes` estão em **schema-supabase-final.sql**. No banco real, **não há triggers** na tabela `chutes`.

---

## 3. Funções encontradas

### 3.1 Funções que mexem em saldo ou usuário após INSERT em chutes

| Arquivo | Função | O que faz | Usada por |
|---------|--------|-----------|-----------|
| schema-supabase-final.sql | update_user_stats() | Atualiza usuarios: total_apostas + 1; se resultado = 'goal' credita saldo e total_ganhos; senão debita saldo (saldo -= valor_aposta) | trigger_update_user_stats (AFTER INSERT em chutes) |
| schema-supabase-final.sql | update_global_metrics() | Atualiza metricas_globais: contador_chutes_global + 1; se contador_global % 1000 = 0 atualiza ultimo_gol_de_ouro | trigger_update_metrics (AFTER INSERT em chutes) |

- **Corpo de update_user_stats() (schema-supabase-final.sql, linhas 299–325):**  
  - UPDATE usuarios SET total_apostas = total_apostas + 1 WHERE id = NEW.usuario_id;  
  - Se NEW.resultado = 'goal': UPDATE usuarios SET total_ganhos += premio+premio_gol_de_ouro, saldo += premio+premio_gol_de_ouro WHERE id = NEW.usuario_id;  
  - Senão: UPDATE usuarios SET saldo = saldo - NEW.valor_aposta WHERE id = NEW.usuario_id;  
  - RETURN NEW;

Nenhuma outra função no repositório altera `usuarios.saldo` com base em INSERT/UPDATE em `chutes`. Funções como `update_updated_at_column`, `cleanup_expired_password_tokens`, `refresh_user_stats` (em database/optimizations.sql), `process_shot` (em database-schema-phase3.sql) não são acionadas pelo fluxo de chute do server-fly.js e não substituem o papel do trigger.

### 3.2 Existência da função no banco

- A **existência** de `update_user_stats` no Supabase **só pode ser confirmada** com consulta direta ao banco (ex.: `SELECT proname, prosrc FROM pg_proc WHERE proname = 'update_user_stats';`).
- O script **scripts/confirmacao-trigger-producao-readonly.js** usa RPC `exec_sql` para consultar pg_proc e pg_trigger; se a RPC não existir ou falhar, o resultado é indireto.
- **Documentação anterior (AUDITORIA-SUPREMA-PRE-PATCH-BLOCO-D):** “em produção essa função não existe (confirmado)”. Assim, a conclusão da auditoria é que **no ambiente atual a função não existe ou o trigger que a chama não está presente**; como os triggers em `chutes` estão ausentes (evidência da consulta pg_trigger), mesmo que a função existisse em algum schema, **ela não está sendo executada** no fluxo de INSERT em `chutes`.

---

## 4. RPCs encontradas

### 4.1 No backend (server-fly.js) no fluxo de chute

- O endpoint **POST /api/games/shoot** **não chama** nenhuma RPC do Supabase.  
- Operações realizadas: SELECT em usuarios (saldo), getOrCreateLoteByValue (memória), validateBeforeShot/validateAfterShot (memória), INSERT em chutes (supabase.from('chutes').insert), UPDATE em usuarios (saldo) **apenas quando isGoal**.

### 4.2 RPCs citadas no repositório (não usadas no shoot)

| RPC | Uso |
|-----|-----|
| exec_sql | Scripts (confirmacao-trigger-producao-readonly.js, setup-supabase-tables.js, aplicar-schema-supabase-automated.js) para executar SQL arbitrário; não usado no gameplay. |
| credit_user_balance / creditar_saldo | Mencionadas em documentação de auditoria/webhook; não aparecem no server-fly.js no fluxo de chute. |
| processar_pagamento_atomico | PLANO-CORRECOES-PRODUCAO-REAL.md; não usado no endpoint de shoot. |
| get_tables, enable_rls, create_user_policy | Scripts/auditoria; não relacionados ao fluxo financeiro do chute. |

**Conclusão:** Não existe RPC que substitua o trigger de débito/crédito de saldo no fluxo de chute. A lógica financeira do gameplay depende do trigger (ausente) ou de alteração no backend.

---

## 5. Confronto backend vs banco

### 5.1 O que o backend assume (server-fly.js)

- **Antes do INSERT:** Lê `user.saldo`; valida `user.saldo >= betAmount`; em memória define resultado (goal/miss), prêmios e estado do lote.
- **INSERT em chutes:** Insere usuario_id, lote_id, direcao, valor_aposta, resultado, premio, premio_gol_de_ouro, is_gol_de_ouro, contador_global, shot_index.
- **Comentário no código (linhas 1331–1334):** “Perdas: o trigger update_user_stats (AFTER INSERT em chutes) subtrai valor_aposta no banco. PRESSUPOSTO CRÍTICO: esse trigger deve existir no Supabase de produção; sem ele, perdedores não têm saldo debitado. Vitórias: o trigger credita premio+premio_gol_de_ouro; este UPDATE sobrescreve o saldo para o valor correto.”
- **Após INSERT:** Se **isGoal**, faz UPDATE em usuarios SET saldo = user.saldo - betAmount + premio + premioGolDeOuro WHERE id = userId. Se **miss**, **não** faz nenhum UPDATE em saldo.

### 5.2 O que o banco realmente faz hoje

- **INSERT em chutes:** A linha é inserida normalmente. Não há trigger AFTER INSERT; portanto:
  - Nenhuma função atualiza `usuarios.saldo` para o autor do chute.
  - Nenhuma função atualiza `usuarios.total_apostas` ou `total_ganhos`.
  - Nenhuma função atualiza `metricas_globais.contador_chutes_global` nem `ultimo_gol_de_ouro`.
- **UPDATE do vencedor:** Feito **somente** pelo backend (server-fly.js). Portanto o vencedor **é** creditado (saldo correto após o gol).
- **Perdedor:** Nenhum mecanismo no banco debita saldo; o backend não debita. Portanto o perdedor **não** perde saldo.

### 5.3 Tabela resumo

| Ação | Backend espera | Banco (estado atual) |
|------|----------------|----------------------|
| INSERT chute | Linha em chutes; trigger debita/credita saldo | Linha em chutes; **nenhum** trigger roda |
| MISS | Trigger debita saldo | **Nada** debita saldo |
| GOAL | Trigger credita; backend sobrescreve saldo com valor correto | Backend credita; **única** atualização de saldo por chute |

---

## 6. Verdade financeira atual do sistema

Respondendo objetivamente às perguntas obrigatórias:

| Pergunta | Resposta |
|----------|----------|
| O perdedor perde saldo de verdade? | **Não.** Nenhum trigger debita; o backend não atualiza saldo em MISS. |
| O vencedor recebe prêmio de verdade? | **Sim.** O backend faz UPDATE saldo = saldo - aposta + premio + premio_gol_de_ouro para o vencedor. |
| Existe risco de crédito sem débito correspondente? | **Sim.** Os 9 perdedores do lote não têm R$ 1 debitado; o vencedor recebe R$ 5 (ou R$ 105). Ou seja, há crédito líquido (R$ 5 ou R$ 105) sem os débitos correspondentes (R$ 9). |
| O sistema hoje cria dinheiro do nada? | **Sim, na prática.** O saldo total dos usuários não diminui pela arrecadação do lote; apenas o vencedor recebe. A “casa” não retém os R$ 5 porque nunca retirou os R$ 9 dos perdedores. |
| A economia do lote fecha ou não fecha? | **Não fecha.** Arrecadação esperada R$ 10; saída apenas R$ 5 (ou R$ 105) para o vencedor; R$ 9 que deveriam sair dos perdedores permanecem nos saldos. |
| A plataforma está de fato retendo R$ 5 por lote? | **Não.** Ela não debita os perdedores; portanto não retém. O lucro por lote existe “no papel” (regra V1), mas não na execução atual. |
| Existe mecanismo alternativo garantindo isso fora do trigger? | **Não.** Nenhuma RPC é chamada no shoot; nenhum outro trigger em outra tabela compensa; o backend não debita em MISS. |

---

## 7. Riscos confirmados

| Risco | Evidência |
|-------|-----------|
| Trigger ausente na tabela chutes | Consulta pg_trigger para `chutes` retornou 0 linhas. |
| Perdedor não debitado | Backend não faz UPDATE em miss; não há trigger para debitar. |
| Economia do lote não fechada | Entrada R$ 10 (10× R$ 1); saída apenas prêmio ao vencedor; débitos dos 9 não ocorrem. |
| Backend depende de trigger inexistente | Comentário em server-fly.js declara dependência do update_user_stats; trigger não existe no banco. |
| Divergência documentação vs ambiente | schema-supabase-final.sql e relatórios descrevem trigger/função; banco real não tem triggers em chutes. |

---

## 8. Riscos prováveis

| Risco | Motivo |
|-------|--------|
| Função update_user_stats inexistente no banco | Relatórios anteriores e script de confirmação indicam que em produção a função não existe ou não está em uso; não foi possível executar pg_proc neste relatório (read-only no repo). |
| Métricas globais (contador_chutes_global, ultimo_gol_de_ouro) desatualizadas | trigger_update_metrics também está ausente; se o backend não atualizar metricas_globais por outro meio, esses campos podem estar desatualizados. |
| total_apostas e total_ganhos desatualizados | update_user_stats também atualiza esses campos; sem trigger, ficam desatualizados. |

---

## 9. Diagnóstico final

**Classificação:** **BANCO FINANCEIRO INCONSISTENTE**

- Triggers na tabela `chutes` no Supabase atual: **nenhum**.
- Débito do perdedor: **não ocorre** (nem por trigger nem por backend).
- Crédito do vencedor: **ocorre** via backend.
- Economia do lote: **não fecha**; plataforma não retém o lucro por lote como desenhado na V1.

---

## 10. Conclusão objetiva

**Qual é hoje a verdade financeira real do Gol de Ouro no Supabase?**

- A tabela **chutes** **não** possui triggers manuais no banco. A consulta em pg_trigger para `chutes` retornou **no rows**.
- O backend **assume** que o trigger `update_user_stats` existe e debita o perdedor e credita o vencedor; em seguida, para o vencedor, sobrescreve o saldo com um UPDATE explícito. Na prática, **apenas o crédito do vencedor** é aplicado; o **débito do perdedor nunca ocorre**.
- **Consequência:** Por cada lote de 10 chutes, R$ 10 entram “conceitualmente” (apostas), mas apenas R$ 5 (ou R$ 105 em Gol de Ouro) saem para o vencedor. Os R$ 9 dos perdedores permanecem nos saldos. O sistema **não** retém os R$ 5 de lucro por lote; a economia **não** fecha.
- **Não** existe substituição via RPC no fluxo de chute. A correção requer **ou** criar e ativar o trigger (e a função) no Supabase a partir do schema-supabase-final.sql, **ou** implementar o débito do perdedor no backend (server-fly.js), conforme já recomendado em relatórios anteriores (AUDITORIA-SUPREMA-PRE-PATCH-BLOCO-D), em modo read-only não se aplica correção.

---

*Auditoria conduzida em modo READ-ONLY. Nenhuma alteração foi feita em banco, migrations, triggers, funções ou deploy.*
