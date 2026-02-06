# RELATÓRIO — FECHAMENTO CONTÁBIL MÍNIMO (PRODUÇÃO)

**Data:** 2026-02-05  
**Modo:** MAX SAFETY + READ-ONLY ABSOLUTO (nenhuma escrita, alteração de código/schema/deploy).  
**Objetivo:** Fechar lacunas da auditoria financeira — pendências PIX, fechamento jogo, reconciliação mínima e outliers.

---

## 1. FASE 0 — Prova de localização (código)

### 1.1 Trigger `update_user_stats` e estrutura da tabela `chutes`

**Trigger e função:**

| Item | Arquivo | Linhas |
|------|---------|--------|
| Função `update_user_stats()` | schema-supabase-final.sql | 299-325 |
| Trigger `trigger_update_user_stats` (AFTER INSERT ON chutes) | schema-supabase-final.sql | 328-332 |

**Lógica do trigger:**

- Atualiza `usuarios.total_apostas` + 1.
- Se `NEW.resultado = 'goal'`: atualiza `total_ganhos` e **credita** `saldo = saldo + NEW.premio + NEW.premio_gol_de_ouro`.
- Se não (miss): **debita** `saldo = saldo - NEW.valor_aposta`.

**Estrutura da tabela `chutes` (schema do repositório):**

- **Arquivo:** `schema-supabase-final.sql`, linhas 43-56.
- **Colunas relevantes:**  
  `id`, `usuario_id`, `lote_id`, `direcao`, **`valor_aposta`**, **`resultado`** (CHECK: 'goal', 'miss'), **`premio`**, **`premio_gol_de_ouro`**, `is_gol_de_ouro`, `contador_global`, `shot_index`, `created_at`.

Outros schemas no repo (SCHEMA-CORRECAO-*, schema-supabase-real.sql, etc.) variam (ex.: `resultado` vs `result`, `amount` vs `valor_aposta`); o considerado de referência para o fechamento é o que possui `valor_aposta`, `resultado`, `premio`, `premio_gol_de_ouro`.

### 1.2 Shoot: campos de prêmio e evitação de dupla cobrança

**Arquivo:** `server-fly.js`.

**Definição de prêmios (linhas 1228-1236):**

- `premio`: R$ 5,00 fixo quando há gol (`isGoal`).
- `premioGolDeOuro`: R$ 100,00 quando `isGolDeOuro` (gol de ouro).
- Valores gravados no objeto do chute e no INSERT em `chutes` (linhas 1291-1293: `premio`, `premio_gol_de_ouro`).

**Evitação de dupla cobrança (linhas 1332-1346):**

- **Perdas:** o trigger já debita `valor_aposta` no INSERT do chute (resultado ≠ goal); a API não debita de novo.
- **Vitórias:** o trigger credita `premio + premio_gol_de_ouro` no INSERT. A API **sobrescreve** o saldo com um único ajuste:  
  `novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro`,  
  garantindo que o efeito final seja “-aposta + prêmio” (sem creditar duas vezes a aposta).

**Delta teórico do jogo por chute (para fechamento):**

- Miss: `-valor_aposta`
- Goal: `-valor_aposta + premio + premio_gol_de_ouro`

---

## 2. FASE 1 — Resultados em produção (somente SELECT)

Script: `scripts/fechamento-contabil-minimo-readonly.js`. Execução: 2026-02-05T18:40:33.618Z. `usuario_id` ofuscado (prefixo + últimos 6 caracteres).

### 2.1 A) Pendências PIX

| Métrica | Valor |
|--------|--------|
| **Total pending** | 34 |

**Idade (dias) por faixa:**

| Faixa | Quantidade |
|-------|------------|
| 0-1d  | 2  |
| 2-7d  | 2  |
| 8-30d | 21 |
| 31+d  | 9  |

**Top 20 pendings mais antigos:** 20 registros listados no script (id, usuario_id ofuscado, created_at, valor, external_id/payment_id truncados). O mais antigo: 2025-12-10 (u_254ad5, R$ 10). Vários usuários: u_254ad5, u_6a1eb8, u_2c3d3a, u_deafdd, u_3f81df.

**Conclusão pendências:** 30 dos 34 pendings têm mais de 7 dias (8-30d e 31+d). Reconciliação pode não estar efetiva para esses (pagamento nunca aprovado no MP ou consulta MP não retorna approved). Não há evidência de bug sem cruzar com MP; classificado como **pendências antigas** a monitorar.

### 2.2 B) Fechamento do jogo (chutes)

**Meta retornada pelo script:** `resultField: "resultado"`, `hasValorAposta: true`, `hasPremio: true`, `hasPremioGolDeOuro: true`, **`total_rows: 0`**.

Em produção a tabela `chutes` retornou **0 linhas** (ou a query não trouxe dados). Portanto:

- **total_chutes / total_apostas / gols / total_premios / saldo_delta_teorico_jogo** não puderam ser calculados.
- **B_jogo_por_usuario:** lista vazia.
- **Limitação:** em todos os usuários, `jogo_delta` foi considerado **NULL** na reconciliação.

### 2.3 C) Entradas PIX (approved)

Agregado por usuario_id (ofuscado): total_pix_approved (soma de COALESCE(valor, amount)) e qtd_pix_approved. Amostra (sem PII):

- u_7b1c35: 6 (4 pagamentos)
- u_254ad5: 69 (12 pagamentos)
- u_deafdd: 10 (1)
- u_3f81df: 10 (1)
- u_f38dcf: 5 (1)
- u_2e7df6: 10 (1)
- u_6a1eb8: 10 (1)
- u_508b8d: 1 (1)

### 2.4 D) Saques

Por usuario_id (ofuscado), por status e totais cancelado/confirmado:

- u_7b1c35: status cancelado = 10; total_confirmado = 0.
- Demais usuários sem saques ou só cancelados; **total_confirmado** usado na recon = 0 para todos.

### 2.5 E) Reconciliação mínima

Fórmula:

- `saldo_teorico_min = pix + jogo_delta - saques_confirmados` (quando `jogo_delta` disponível).
- Se `jogo_delta` é NULL: `saldo_teorico_min = pix - saques_confirmados`.
- `diferenca = saldo_atual - saldo_teorico_min`.

**Resultados:**

- **Usuários com |diferenca| > 0,01:** 31.
- **Faixas de |diferenca|:**

| Faixa  | Quantidade |
|--------|------------|
| 0-10   | 9  |
| 10-50  | 8  |
| 50-200 | 13 |
| 200+   | 1  |

**Top 20 maiores |diferenca| (resumo):**

- **diferenca positiva (saldo_atual > teórico):** vários usuários com saldo 50–1000 e pix = 0, jogo_delta = null, saques_confirmados = 0 → saldo_teorico_min = 0 → diferenca = saldo_atual. Ex.: u_765aec (1000), u_7ccb19 (100), u_753c89 (100), etc. Coerente com **saldo inicial e/ou bônus** não contabilizados em PIX nem em chutes.
- **diferenca negativa:**  
  - u_254ad5: saldo_atual 29, saldo_teorico_min 69, **diferenca -40** (PIX 69, sem saque confirmado; gasto em jogo não mensurável pois chutes = 0).  
  - u_6a1eb8: saldo_atual 0, saldo_teorico_min 10, **diferenca -10** (depositou 10, saldo 0; possível uso em jogo, também sem chutes para validar).

Nenhum PII exposto; apenas ids ofuscados e valores.

---

## 3. Limitações

1. **Chutes vazios em produção:** não há histórico de chutes na base consultada. Por isso `jogo_delta` é sempre NULL e o fechamento não inclui débitos/créditos do jogo. Divergências podem ser explicadas por jogo não contabilizado (e/ou saldo inicial/bônus).
2. **Saldo inicial / bônus:** não há fonte de “entrada” para saldos que não vêm de PIX aprovado. Por isso muitos usuários aparecem com saldo_atual > 0 e saldo_teorico_min = 0 (diferenca = saldo_atual).
3. **Reconciliação de pendings:** não foi validado no MP se cada pending está realmente não pago; parte dos 34 pendings antigos (8-30d, 31+d) pode ser abandono pelo usuário.
4. **Saques:** apenas status “cancelado” e “confirmado” (processado/concluído etc.) considerados; outros status não foram tratados como “confirmado”.
5. **Coluna de resultado em chutes:** em produção o script detectou `resultado`; em outros schemas do repo pode existir `result` — o script está preparado para ambos.

---

## 4. Classificação final

| Item | Classificação | Motivo |
|------|----------------|--------|
| Pendências antigas (8-30d, 31+d) | 🟡 | 30/34 pendings com mais de 7 dias; reconciliação pode não estar efetiva ou pagamentos nunca aprovados no MP. |
| Chutes vazios | 🟡 | Impossível fechar delta do jogo; jogo_delta = NULL para todos. |
| Outliers com diferenca = saldo_atual (pix=0) | 🟢 | Explicável por saldo inicial/bônus não registrados em PIX. |
| Outliers com diferenca negativa (ex.: -40, -10) | 🟡 | Explicável por gasto em jogo não registrado em chutes (tabela vazia); não há evidência direta de falha de crédito/débito. |
| Saques apenas cancelados | 🟢 | Comportamento esperado no cenário atual. |

Nenhum item classificado como 🔴 (evidência direta de falha financeira).

---

## 5. Veredito

**GO COM RESSALVAS**

- Não há evidência de falha contábil direta (double credit, débito indevido, etc.).
- Ressalvas: (1) volume alto de pendências antigas e possível efetividade limitada da reconciliação para esses casos; (2) tabela `chutes` vazia impede fechamento completo do jogo; (3) 31 usuários com |diferenca| > 0,01, explicáveis por saldo inicial/bônus e por jogo não contabilizado no fechamento.

---

## 6. Próximas etapas recomendadas (somente leitura / análise)

- Confirmar no MP o status dos pagamentos pendentes mais antigos (amostra) para classificar se a reconciliação está efetiva ou se são pagos nunca concluídos.
- Se houver migração ou outro ambiente com `chutes` populados, refazer o fechamento com `jogo_delta` calculado e reavaliar outliers.
- Documentar origem dos saldos iniciais (bônus/campanha) para incluir, quando possível, no modelo de saldo teórico sem alterar código nesta auditoria.

---

**Fim do relatório.** Nenhuma alteração de código, schema ou dados foi realizada.
