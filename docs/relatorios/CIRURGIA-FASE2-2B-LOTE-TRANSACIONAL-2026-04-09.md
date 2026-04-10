# Cirurgia Fase 2.2B — Lote transacional (2026-04-09)

## Objetivo

Eliminar o lote em memória (`lotesAtivos`, `getOrCreateLoteByValue`, `winnerIndex` no Node) como fonte de verdade, alinhando **lote, posição do chute, resultado e fechamento** à mesma transação que persiste métricas, saldo e linha em `chutes`.

## Alterações

### 1. SQL — `database/shoot_apply_atomic_transaction.sql`

- Nova assinatura: `shoot_apply(p_usuario_id uuid, p_direcao text, p_valor_aposta numeric)`.
- Remoção da assinatura anterior `(uuid, text, text, numeric, text, integer)` e do `DROP` da sobrecarga de 10 argumentos (mantido por segurança).
- Fluxo na mesma função PL/pgSQL:
  1. Validação de direção e valor (apenas 1, 2, 5, 10).
  2. `SELECT … FOR UPDATE` em `metricas_globais` (id = 1); cálculo do contador global e milestone.
  3. **Obter ou criar lote:** `SELECT` em `lotes` com `valor_aposta = p_valor_aposta`, `status = 'ativo'` e contagem de `chutes` &lt; `tamanho`, com `FOR UPDATE`. Se não existir, `INSERT` com `indice_vencedor = floor(random() * tamanho)`; em conflito de unicidade (`23505`), nova tentativa (até 32 iterações).
  4. Contagem de chutes do lote (posição 0-based do chute atual); **goal** se `count = indice_vencedor**; **miss** caso contrário.
  5. Prémios (R$ 5 no goal; +R$ 100 se goal e contador global múltiplo de 1000), alinhados à regra já usada na fase 2.2A.
  6. `SELECT … FOR UPDATE` em `usuarios`, validação de saldo, `INSERT` em `chutes`, `UPDATE` de `usuarios`, `UPDATE` de `metricas_globais`, `UPDATE` de `lotes` (`posicao_atual`, totais, `status` → `finalizado` se goal ou lote cheio).
- Retorno `jsonb` ampliado: `lote_id`, `posicao_lote`, `tamanho_lote`, `is_lote_complete`, `premios` (objeto), além dos campos já existentes (`novo_saldo`, `chute_id`, `resultado`, `contador_global`, `is_gol_de_ouro`, `premio`, `premio_gol_de_ouro`, `ultimo_gol_de_ouro`).

**Recomendação de índice (não obrigatório para a função funcionar):** um único lote `ativo` por `valor_aposta` reduz corridas na criação:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_lotes_um_ativo_por_valor
  ON public.lotes (valor_aposta)
  WHERE (status = 'ativo');
```

Se já existirem vários lotes ativos para o mesmo valor, criar o índice falha até saneamento manual.

### 2. Backend — `server-fly.js`

- Removidos: `lotesAtivos`, `getOrCreateLoteByValue`, uso de `LoteIntegrityValidator` no fluxo do shoot.
- Mantido `batchConfigs` apenas para validação HTTP do valor de aposta (1, 2, 5, 10).
- `POST /api/games/shoot` chama `supabase.rpc('shoot_apply', { p_usuario_id, p_direcao, p_valor_aposta })`.
- Resposta HTTP: mesmo contrato de campos relevantes (`loteId`, `loteProgress`, `isLoteComplete`, `result`, prémios, `contadorGlobal`, `novoSaldo`, `chuteId` quando presente), preenchidos a partir do JSON da RPC.
- Erros mapeados: `SHOOT_APPLY_DIRECAO_INVALIDA`, `SHOOT_APPLY_VALOR_INVALIDO`, `SHOOT_APPLY_LOTE_CHEIO`, `SHOOT_APPLY_LOTE_ALOCAR_FALHOU` (este último após esgotar retentativas de alocação).

### 3. Fora de escopo (conforme pedido)

- PIX, saque, Redis, novo contrato HTTP, arquitetura paralela: **não alterados**.

## Ordem de deploy

1. Aplicar o SQL no Supabase (substitui `shoot_apply` pela nova assinatura).
2. Deploy do backend que chama a RPC com três parâmetros.

Deploy do backend antes do SQL quebra o shoot até a função ser atualizada.

## Validação sugerida (Etapa 4)

1. Dois utilizadores (ou duas sessões) com o mesmo `valor_aposta`: confirmar que entram no mesmo `lote_id` até fecho.
2. Lote R$ 10 (`tamanho` 1): um chute e `is_lote_complete` verdadeiro; novo chute abre novo lote.
3. Por lote: no máximo **um** goal (índice vencedor único por linha em `lotes`).
4. Duas instâncias do backend: sem estado de lote em RAM, o comportamento depende só do BD.
5. Simular falha (ex.: saldo insuficiente na RPC): transação completa reverte — sem linha órfã em `chutes` nem saldo alterado.

## Riscos / notas

- `server-fly-deploy.js` mantém lógica antiga de lote em memória; o Dockerfile referido no handoff aponta para `server-fly.js`. Se algum ambiente usar `server-fly-deploy.js`, alinhar manualmente.
- `status` em `lotes` assume valores `ativo` / `finalizado` como no schema de referência `schema-supabase-final.sql`. Se produção usar outros literais, ajustar a função.

## Ficheiros tocados

| Ficheiro | Alteração |
|----------|-----------|
| `database/shoot_apply_atomic_transaction.sql` | Função `shoot_apply` com lote integrado na transação. |
| `server-fly.js` | Shoot só via RPC; remoção de lote em memória e validador de integridade nesse fluxo. |
