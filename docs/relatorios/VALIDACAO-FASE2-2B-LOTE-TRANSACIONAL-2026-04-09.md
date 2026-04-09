# Validação Fase 2.2B — Lote transacional (2026-04-09)

**Modo:** leitura do repositório + evidência externa (captura Supabase).  
**Classificação final:** **APROVADA COM RESSALVAS**

---

## 1. Escopo

| Verificação | Resultado |
|-------------|-----------|
| Ficheiros centrais da cirurgia | `database/shoot_apply_atomic_transaction.sql` (função `shoot_apply`) e `server-fly.js` (handler `POST /api/games/shoot`) refletem o desenho 2.2B. |
| Restrição ao shoot + SQL | A lógica de lote transacional está na função SQL; o Node delega o jogo à RPC com três parâmetros. |
| Expansão de escopo no código analisado | Não se verificou alteração ao fluxo de PIX/saque no `server-fly.js` na zona inspecionada (imports e rotas mantêm-se). |
| Estado Git (referência) | `git diff --stat HEAD` mostrou alteração significativa em `server-fly.js`; o SQL encontra-se como ficheiro no repositório (estado de tracking depende do branch/commit local). |

**Nota:** Existem outros relatórios `.md` no histórico de trabalho; não invalidam a Fase 2.2B, mas o escopo “apenas shoot + SQL” no **código** é o que importa para esta validação.

---

## 2. Função SQL (`database/shoot_apply_atomic_transaction.sql`)

| Requisito | Evidência |
|-----------|-----------|
| Remoção da assinatura antiga | `DROP FUNCTION` da sobrecarga de 10 argumentos e da de 6 argumentos (`uuid, text, text, numeric, text, integer`). |
| Nova assinatura | `shoot_apply(p_usuario_id uuid, p_direcao text, p_valor_aposta numeric)`. |
| Obter ou criar lote | `SELECT … FOR UPDATE` em `lotes` com `status = 'ativo'` e contagem de `chutes` &lt; `tamanho`; se não houver, `INSERT` com retentativas em `SQLSTATE '23505'`. |
| Persistir `indice_vencedor` | No `INSERT` em `lotes`, coluna `indice_vencedor` preenchida com `floor(random() * v_tamanho)`; em lote existente, lido da linha (`SELECT l.indice_vencedor`). |
| Posição do chute | `v_cnt` = `COUNT(*)` de `chutes` do lote antes do insert; `shot_index` / posição lógica = `v_new_pos := v_cnt + 1`. |
| `goal` / `miss` na transação | `v_is_goal := (v_cnt = v_indice)`; `v_resultado` derivado disso; prémios e fechamento coerentes com o resultado. |
| Atualizar tabelas | `INSERT` em `chutes`; `UPDATE` em `usuarios`, `metricas_globais`, `lotes` (`posicao_atual`, totais, `status` `finalizado`/`ativo`). |
| Retorno para o backend | `jsonb` com `lote_id`, `posicao_lote`, `tamanho_lote`, `is_lote_complete`, `novo_saldo`, `chute_id`, `resultado`, `contador_global`, `is_gol_de_ouro`, `premio`, `premio_gol_de_ouro`, `premios`, `ultimo_gol_de_ouro`. |

**Evidência de deploy em produção:** captura do SQL Editor do projeto `goldeouro-production` com execução bem-sucedida (“Success. No rows returned”) do script da Fase 2.2B — confirma que o DDL/RPC foi aplicado no ambiente indicado, independentemente do repositório.

**Índice único parcial:** no ficheiro versionado, o `CREATE UNIQUE INDEX … idx_lotes_um_ativo_por_valor` está **apenas em comentário** (recomendação). Se a instância em produção executou também o índice (como sugerido na captura), isso reduz corridas na criação de lote; **confirmar no catálogo** (`pg_indexes` / Supabase) se o índice existe, pois o repo sozinho não garante.

---

## 3. Backend (`server-fly.js`)

| Requisito | Evidência |
|-----------|-----------|
| `lotesAtivos` fora do shoot | `grep` por `lotesAtivos` em `server-fly.js`: **sem ocorrências**. |
| `getOrCreateLoteByValue` fora do shoot | **Sem ocorrências** no ficheiro. |
| `winnerIndex` em memória fora do shoot | **Sem ocorrências** no ficheiro. |
| Dados da RPC em `shootResult` | Chamada `supabase.rpc('shoot_apply', { p_usuario_id, p_direcao, p_valor_aposta })`; `loteId`, `loteProgress` (`current`/`total`/`remaining`), `isLoteComplete`, `result`, `contadorGlobal`, `novoSaldo`, prémios e `chuteId` derivados de `rpcPayload`. |
| `LoteIntegrityValidator` no shoot | Import/instância removidos; não há validação de lote em memória neste handler. |
| Contrato HTTP | Resposta `200` com `{ success: true, data: shootResult }`; campos esperados pelo frontend histórico (`loteId`, `loteProgress`, `isLoteComplete`, `result`, `contadorGlobal`, `novoSaldo`, etc.) preservados. Entrada continua `direction` + `amount`. |

**Pré-check de saldo** no Node antes da RPC permanece (fail-fast); a decisão financeira definitiva continua na função SQL — coerente e sem quebra de contrato.

---

## 4. Regressão

| Verificação | Resultado |
|-------------|-----------|
| PIX / saque | Rotas e `PixValidator` / `createPixWithdraw` presentes; não há evidência nesta validação de que o diff do shoot tenha alterado esses blocos (validação por grep + leitura contextual do shoot). |
| Frontend | Mesmo envelope `success` + `data` e mesmos nomes de campos principais; não se exige mudança de contrato para consumir `loteId` / progresso / resultado. |
| Regressão óbvia no fluxo shoot | Com backend e função alinhados (3 parâmetros), o fluxo está consistente. **Risco:** backend antigo ainda em execução contra função nova (ou o inverso) gera falha de RPC até deploy ordenado. |
| `server-fly-deploy.js` | Ainda contém `lotesAtivos`, `getOrCreateLoteByValue` e uso no shoot — **risco operacional residual** se algum pipeline ou imagem usar este entrypoint em vez de `server-fly.js`. |

---

## 5. Ressalvas

1. **Ordem de deploy:** SQL (nova `shoot_apply`) antes do backend que chama só três argumentos; caso contrário, erros de chamada ou assinatura até alinhamento.
2. **Índice `idx_lotes_um_ativo_por_valor`:** recomendado no SQL versionado como comentário; validar em produção se foi criado (a captura do utilizador sugere que pode ter sido incluído no script executado).
3. **Testes automatizados / E2E:** não há evidência no repositório, nesta validação, de suite que execute `shoot_apply` ou o endpoint contra BD de teste; **testes reais** (multi-utilizador, fecho de lote, rollback) ficam como verificação operacional.
4. **`server-fly-deploy.js`:** divergência em relação a `server-fly.js` mantém o modelo antigo de lote em memória — risco se for o binário efetivo em algum ambiente.
5. **Literal de `status` em `lotes`:** função usa `ativo` / `finalizado`; deve coincidir com o schema e dados existentes (se produção usasse outros valores, seria inconsistência).

---

## 6. Classificação final

**APROVADA COM RESSALVAS**

**Motivo:** O código e a função SQL no repositório cumprem os requisitos da Fase 2.2B (lote na transação, sem lote/`winnerIndex` no fluxo do shoot em `server-fly.js`, resposta alimentada pela RPC). As ressalvas são **operacionais** (entrypoint alternativo, índice opcional, testes E2E não evidenciados), não uma falha lógica imediata da implementação revista.

---

## 7. Conclusão técnica

Do ponto de vista do **desenho e da implementação no repo** (`shoot_apply` + `server-fly.js`), a Fase 2.2B pode ser considerada **tecnicamente concluída**, com a condição de que o **runtime** use `server-fly.js` (ou equivalente já alinhado à RPC) e que produção esteja de facto na versão da função e do servidor que esta validação assumiu — o que a captura do Supabase apoia para o lado SQL em `goldeouro-production`.
