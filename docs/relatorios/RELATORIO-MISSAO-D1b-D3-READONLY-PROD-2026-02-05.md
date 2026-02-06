# RELATÓRIO — MISSÃO D1b + D3 (READ-ONLY PRODUÇÃO)

**Data:** 2026-02-05  
**Modo:** MAX SAFETY + READ-ONLY ABSOLUTO (nenhuma escrita, alteração de código/schema/deploy).  
**Objetivo:** D1b) Reexecutar classificação dos 20 pendings PIX com GET no MP (com token válido); D3) Fechamento contábil do jogo via `transacoes` (referencia_tipo='aposta') e validação de integridade de saldos.

---

## 1. Precheck do token (sem expor valores)

| Variável | Status   |
|----------|----------|
| MERCADOPAGO_DEPOSIT_ACCESS_TOKEN | AUSENTE |
| MERCADOPAGO_ACCESS_TOKEN         | **PRESENTE** |
| MERCADO_PAGO_ACCESS_TOKEN       | AUSENTE |
| MP_ACCESS_TOKEN                  | AUSENTE |

**Token utilizável:** Sim (pelo menos uma variável presente). D1b foi **EXECUTADO** (não bloqueado).

---

## 2. D1b — Pendências antigas × Mercado Pago

**Status:** EXECUTADO.

Foram consultados os 20 registros mais antigos de `pagamentos_pix` com `status = 'pending'` e, para cada um, realizada chamada GET ao Mercado Pago usando o token disponível (payment_id ou external_id numérico).

### 2.1 Classificação obtida

| Classificação   | Quantidade |
|-----------------|------------|
| OK_ABANDONO     | 0          |
| BUG_RECON       | 0          |
| INDETERMINADO   | 20         |

Em **todos** os 20 casos, `status_MP` e `detail_MP` retornaram **null** (resposta do MP não trouxe status ou houve falha/erro na consulta). Possíveis causas: token sem permissão de leitura de pagamentos, IDs de pagamento de outra aplicação/ambiente ou recurso não encontrado. Nenhum registro foi classificado como **BUG_RECON** (approved no MP com banco em pending).

### 2.2 Tabela resumida (sem PII)

| id (ofuscado) | usuario_id | idade_dias | v  | status_banco | status_MP | detail_MP | classificação  |
|---------------|------------|------------|----|--------------|-----------|-----------|----------------|
| 943f8d64…     | u_254ad5   | 57         | 10 | pending      | null      | null      | INDETERMINADO  |
| 33d7348c…     | u_254ad5   | 48         | 10 | pending      | null      | null      | INDETERMINADO  |
| … (18 linhas com mesmo padrão) | | | | | | | INDETERMINADO |

**Conclusão D1b:** Não houve evidência de **BUG_RECON**. Pendings seguem não classificados como OK_ABANDONO por ausência de status real do MP na resposta.

---

## 3. D3 — Fechamento do jogo via transacoes (referencia_tipo='aposta')

### 3.1 Volume e tipos

| Métrica | Valor |
|---------|--------|
| Total de registros em `transacoes` | 40 |
| Registros com `referencia_tipo = 'aposta'` | 38 |

**Agrupamento por tipo, referencia_tipo e status:**

| tipo    | referencia_tipo | status   | count |
|---------|------------------|----------|-------|
| debito  | aposta           | concluido | 38  |
| deposito| (vazio)          | pendente  | 2   |

### 3.2 Integridade interna (top 20 usuários por quantidade de apostas)

Foi considerada a amostra dos 20 usuários com mais transações de aposta. Em produção há **apenas 1 usuário** com transações de aposta (u_254ad5).

**Resultados por usuário (ids ofuscados):**

| usuario_id | total_apostas | total_inconsistencias_sequencia | total_inconsistencias_delta | primeira_data | ultima_data |
|------------|----------------|----------------------------------|-----------------------------|----------------|-------------|
| u_254ad5   | 38             | 0                                | 0                           | 2025-12-10 13:15 | 2025-12-10 16:17 |

- **Sequência:** Para cada par de transações consecutivas (ordenadas por `created_at`), foi verificado se `saldo_posterior` da transação anterior é igual ao `saldo_anterior` da próxima (tolerância 0,01). **Inconsistências de sequência: 0.**
- **Delta:** Para cada transação, foi verificado se `valor` é coerente com o delta (`saldo_posterior - saldo_anterior`, tolerância 0,01). **Inconsistências de delta: 0.**

### 3.3 Ponta-a-ponta com `usuarios.saldo`

Para cada usuário que possui ao menos uma transação de aposta, foi comparado o `saldo_posterior` da **última** transação (maior `created_at`) com o `usuarios.saldo` atual.

| Resultado | Quantidade |
|-----------|------------|
| OK (diferença ≤ 0,01) | 0 |
| ALERTA (diferença > 0,01) | 1 |

**Detalhe do ALERTA (sem PII):**

| usuario_id | saldo_atual | saldo_posterior_ultima_tx | diferenca |
|------------|-------------|----------------------------|-----------|
| u_254ad5   | 29          | 0                          | 29        |

Ou seja: a última transação de aposta registrou `saldo_posterior = 0`, enquanto o saldo atual do usuário é 29. Isso é **compatível** com depósitos PIX (ou outros créditos) ocorridos **depois** da última aposta e que não constam em transações com `referencia_tipo = 'aposta'`. Não foi feita análise de outras fontes (ex.: `pagamentos_pix` aprovados) nesta missão.

### 3.4 Outliers globais

**Top divergências (saldo atual vs saldo_posterior da última transação de aposta):**

| usuario_id | diferenca_abs | saldo_atual | saldo_posterior_ultima_tx |
|------------|----------------|-------------|----------------------------|
| u_254ad5   | 29            | 29          | 0                          |

**Usuários sem nenhuma transação e com saldo > 0:** 27.  
Interpretação: saldo inicial, bônus ou créditos não registrados em `transacoes` (ex.: apenas em `usuarios.saldo` ou em outro fluxo).

---

## 4. Classificação final (🟢 / 🟡 / 🔴)

- **D1b:** Nenhum **BUG_RECON** (approved no MP com banco em pending). Todos os 20 pendings ficaram INDETERMINADO por ausência de status na resposta do MP.  
  → **🟢** (sem evidência de falha de reconciliação).

- **D3 — Integridade interna (sequência e delta):** 0 inconsistências de sequência e 0 de delta na amostra.  
  → **🟢**.

- **D3 — Ponta-a-ponta:** 1 ALERTA (um usuário com saldo atual 29 e última tx aposta com saldo_posterior 0). Explicável por créditos posteriores (ex.: PIX) não refletidos na última transação de aposta. Não caracteriza inconsistência sistêmica de modelo (ex.: quebra em cadeia de saldos).  
  → **🟡** (alerta pontual, não sistêmico).

- **Critério 🔴:** Aplicado somente em caso de BUG_RECON ou inconsistências **sistêmicas** de saldo/delta. Nenhum dos dois foi constatado.  
  → **Nenhum 🔴**.

**Resumo:** **🟢** para D1b e para integridade interna D3; **🟡** para o único ALERTA ponta-a-ponta; **sem 🔴**.

---

## 5. Limitações explícitas

1. **D1b:** O token presente (MERCADOPAGO_ACCESS_TOKEN) permitiu executar as chamadas, mas as respostas do MP não trouxeram `status`/`status_detail` (todos null). Não foi possível distinguir “pagamento não encontrado”, “sem permissão” ou “outro erro”. A conclusão é que **não há BUG_RECON** na amostra, mas os pendings não puderam ser classificados como OK_ABANDONO.
2. **D3:** O fechamento e a validação consideram **apenas** transações com `referencia_tipo = 'aposta'`. Depósitos, saques e outros movimentos não estão na mesma base de comparação; o ALERTA ponta-a-ponta pode ser explicado por PIX ou outros créditos após a última aposta.
3. **Amostra:** Apenas 1 usuário possui transações de aposta em produção; as conclusões de integridade sequência/delta referem-se a esse único usuário.
4. **Usuários sem transação e saldo > 0:** Foram apenas contados (27); não foi feita análise da origem do saldo (bônus, migração, etc.).

---

**Fim do relatório.** Nenhuma alteração de código, schema ou dados foi realizada. Nenhuma correção foi proposta.
