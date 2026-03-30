# SANEAMENTO FINANCEIRO CONTROLADO

**Data:** 2026-03-28  
**Âmbito:** dados em `pagamentos_pix` e `saques` — espelhamento PT/EN seguro (NULL/vazio → par preenchido). **Sem** `RENAME`, **sem** `DROP` de colunas, **sem** corrigir `external_id` duplicado automaticamente.  
**Execução técnica:** script `scripts/saneamento-financeiro-controlado-2026-03-28.js` (diagnóstico; com `--apply` para `UPDATE` seguros). Evidência numérica: `docs/relatorios/saneamento-financeiro-controlado-resultado-2026-03-28.json`.  
**SQL de referência (Supabase SQL Editor / psql):** `docs/sql/SANEAMENTO-FINANCEIRO-CONTROLADO-2026-03-28.sql`.

---

## 1. Resumo executivo

Foi corrido o inventário completo (via Supabase service role local) sobre **326** linhas em `pagamentos_pix` e **9** em `saques`. Os pares **amount/valor**, **pix_key/chave_pix** e **pix_type/tipo_chave** encontram-se **já coerentes** (sem assimetria NULL e sem valores discordantes dentro da tolerância monetária ±0,009). **Nenhum `UPDATE` foi necessário** nesta base: o modo `--apply` executou **0** alterações (idempotente).

Há **um grupo** de **duas** linhas em `pagamentos_pix` partilhando o mesmo **`external_id`** (valor de legado com prefixo `deposito_…`, não ID numérico Mercado Pago) — **apenas inventariado**, sem correção automática, conforme regra.

Em `saques`, **2** linhas têm **`correlation_id`** vazio ou nulo — inventariado; **não** foi aplicada regra de preenchimento (idempotência de worker exige decisão de produto).

**fee** e **net_amount:** nas **9** linhas analisadas, **não** há `NULL` — não foi necessário nem seguro inferir valores históricos. A taxa informativa no código (`PAGAMENTO_TAXA_SAQUE` em `server-fly.js`) **não** constitui por si só regra de backfill para linhas antigas sem revisão.

**Reversibilidade:** como não houve `UPDATE`, o estado da base permanece o anterior; qualquer futura execução dos `UPDATE` comentados no `.sql` deve usar `BEGIN`/`ROLLBACK` de teste ou backup conforme política interna.

---

## 2. Diagnóstico inicial — pagamentos_pix

| Indicador | Contagem |
|-----------|----------|
| Linhas totais | 326 |
| `amount` NULL e `valor` preenchido | 0 |
| `valor` NULL e `amount` preenchido | 0 |
| Ambos NULL | 0 |
| Ambos preenchidos e **iguais** (±0,009) | 326 |
| Ambos preenchidos e **diferentes** (conflito) | 0 |
| Grupos com **`external_id` duplicado** | 1 (2 linhas) |
| Grupos com **`payment_id` duplicado** | 0 |

**Detalhe do `external_id` duplicado (inventário):**

- `external_id`: `deposito_3445582f-1eb6-4e4f-843d-b8f8905a71de_1764601609212`
- `id` das linhas: `8c83db6e-dd56-4535-9d81-1fd364f2a96a`, `dd7c3006-d8b8-41d3-a6e9-a404d19fc9e8`

Interpretação: valor típico de fluxo antigo/alternativo de depósito; **não** alterar sem cruzar com Mercado Pago e política de fusão/arquivamento.

---

## 3. Diagnóstico inicial — saques

| Indicador | Contagem |
|-----------|----------|
| Linhas totais | 9 |
| **amount / valor** — assimetria NULL | 0 / 0 |
| **amount / valor** — conflito (ambos preenchidos, diferentes) | 0 |
| **pix_key / chave_pix** — assimetria NULL | 0 / 0 |
| **pix_key / chave_pix** — conflito | 0 |
| **pix_type / tipo_chave** — assimetria NULL | 0 / 0 |
| **pix_type / tipo_chave** — conflito | 0 |
| `fee` NULL | 0 |
| `net_amount` NULL | 0 |
| `correlation_id` NULL ou vazio | 2 |

---

## 4. Atualizações aplicadas

| # | Tabela | Objetivo | Linhas afetadas |
|---|--------|----------|-----------------|
| — | — | Nenhum critério de NULL/espelhamento ficou por satisfazer | **0** |

*(O script registou `updates_executados: []`.)*

---

## 5. Resultado pós-saneamento — pagamentos_pix

Após passagem com `--apply` (e re-leitura de validação no script):

| Verificação | Contagem final |
|-------------|----------------|
| `amount` NULL com `valor` OK | 0 |
| `valor` NULL com `amount` OK | 0 |
| Conflito monetário (ambos preenchidos, diferentes) | 0 |

**Pendências de esquema/dados** (fora do escopo de UPDATE desta etapa): **1** grupo de `external_id` duplicado (ver secção 7).

---

## 6. Resultado pós-saneamento — saques

| Verificação | Contagem final |
|-------------|----------------|
| Assimetria amount/valor | 0 |
| Conflito monetário | 0 |
| Assimetria pix_key/chave_pix | 0 |
| Conflito de chaves | 0 |
| Assimetria pix_type/tipo_chave | 0 |
| Conflito de tipos | 0 |

---

## 7. Casos que permaneceram pendentes

1. **`external_id` duplicado** em `pagamentos_pix` (2 registos, mesmo valor de legado `deposito_…`). **Sem correção automática** — exige decisão manual (qual linha mantém canonicalidade, arquivar outra, ou corrigir `external_id` após validação no provedor).

2. **`payment_id` duplicado:** nenhum grupo detetado nesta base.

3. **Conflitos PT/EN com ambos os lados preenchidos e diferentes:** **nenhum** em `pagamentos_pix` nem em `saques`.

4. **`fee` / `net_amount`:** sem `NULL` nas linhas atuais; **nenhuma** regra de backfill foi aplicada. Para bases futuras com `NULL`, a taxa do env (`PAGAMENTO_TAXA_SAQUE`) só pode informar **novos** registos após alinhamento de produto — não se assume como verdade histórica universal.

5. **`correlation_id` ausente** em **2** linhas de `saques` — não preenchido automaticamente (risco de colisão e de quebrar idempotência do worker/ledger).

---

## 8. Impacto esperado

- **Pares PT/EN** ficam validados como **alinhados** para leitura dual e para o próximo patch de normalização na aplicação, **sem** sobrescrever dados dúbios.
- **Compatibilidade:** nada foi alterado no schema nem nas regras de jogo; rotas e workers existentes continuam a ver as mesmas colunas e valores.
- **Risco:** residual apenas nos casos inventariados (`external_id` duplicado legado; `correlation_id` em 2 saques) — devem ser tratados em tarefas explícitas antes de endurecer constraints ou limpar colunas legadas.

---

## 9. Veredito final

**SANEAMENTO CONCLUÍDO — PRONTO PARA PATCH DE NORMALIZAÇÃO**

**Motivo:** o saneamento mínimo seguro (espelhamento NULL e equivalência dos pares) **não tinha trabalho pendente** nesta base; a validação pós-passagem confirma **zero** divergências remanescentes nos pares monitorizados. Os únicos pontos abertos (**`external_id` duplicado** e **`correlation_id`** em duas linhas) estão **documentados** e **não** impedem a fase seguinte de **dual read/write** no backend, desde que esses casos continuem excluídos de qualquer lógica que assuma `UNIQUE` em `external_id` ou `correlation_id` obrigatório sem `NULL` check.

---

*Fim do relatório.*
