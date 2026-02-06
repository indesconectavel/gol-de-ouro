# RELATÓRIO — MISSÃO D1 + D2 (READ-ONLY PRODUÇÃO)

**Data:** 2026-02-05  
**Modo:** MAX SAFETY + READ-ONLY ABSOLUTO (nenhuma escrita, alteração de código/schema/deploy).  
**Objetivo:** Fechar as duas ressalvas da auditoria — D1) classificar pendings antigos com status real no MP; D2) determinar onde o jogo registra o histórico (chutes vazio vs transacoes com débitos).

---

## 1. D1 — Pendências antigas × Mercado Pago (READ-ONLY)

### 1.1 Metodologia

- Busca no Supabase: 20 registros mais antigos de `pagamentos_pix` com `status = 'pending'`.
- Para cada registro: consulta ao Mercado Pago via **GET** `/v1/payments/{payment_id}` (ou `external_id` quando numérico), usando token de ambiente (não exposto).
- Classificação:
  - **OK_ABANDONO:** MP retorna expired/cancelled/rejected ou status não pago (pending/in_process/in_mediation).
  - **BUG_RECON:** MP retorna **approved** e o banco continua **pending** (reconciliação deveria ter atualizado).
  - **INDETERMINADO:** MP não retornou, sem permissão ou id inválido.

### 1.2 Resultados D1

**Resumo da classificação (20 consultados):**

| Classificação   | Quantidade |
|-----------------|------------|
| OK_ABANDONO     | 0          |
| BUG_RECON       | 0          |
| INDETERMINADO   | 20         |

**Tabela dos 20 pendings (sem PII):**

| id (ofuscado) | usuario_id | idade_dias | v   | status_no_banco | status_no_MP | status_detail_no_MP | classificacao   |
|---------------|------------|------------|-----|------------------|--------------|---------------------|-----------------|
| 943f8d64…     | u_254ad5   | 57         | 10  | pending          | null         | null                | INDETERMINADO   |
| 33d7348c…     | u_254ad5   | 48         | 10  | pending          | null         | null                | INDETERMINADO   |
| (… 18 linhas com mesmo padrão) | | | | | | | INDETERMINADO |

Em **todos** os 20 casos, `status_no_MP` e `status_detail_no_MP` vieram **null**, resultando em INDETERMINADO.

**Causa provável:** No ambiente onde o script foi executado, o token do Mercado Pago (`MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` ou `MERCADO_PAGO_ACCESS_TOKEN`) não estava configurado ou não tinha permissão para consultar pagamentos. Assim, as chamadas GET ao MP não retornaram status (ou falharam), e não foi possível classificar como OK_ABANDONO ou BUG_RECON.

### 1.3 Conclusão D1

- **Não foi possível** classificar os pendings antigos como “normais” (abandono) ou “bug de reconciliação” com base em dados do MP, pois todas as consultas resultaram em INDETERMINADO por ausência de resposta útil do MP no ambiente de execução.
- **Recomendação (somente leitura):** Executar o script `scripts/missao-d1-d2-readonly.js` em ambiente onde `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` (ou `MERCADO_PAGO_ACCESS_TOKEN`) estiver configurado e com permissão de leitura (GET payments), para obter status real e preencher OK_ABANDONO / BUG_RECON. Até lá, **pendings antigos permanecem não classificados** — não há evidência de bug de recon nem de normalidade.

---

## 2. D2 — Onde o jogo registra movimentos em produção (READ-ONLY)

### 2.1 Introspecção de tabelas

Foram consultadas as tabelas candidatas no Supabase (count + amostra de até 3 linhas, sem PII):

| Tabela     | count | error  | Observação |
|------------|-------|--------|------------|
| **chutes** | **0** | null   | Tabela existe e acessível; **vazia**. |
| **transacoes** | 40 | null | Possui registros. |
| **lotes**  | 19    | null   | Possui registros (estado de lotes; não contém linha por chute). |
| **partidas** | 0   | null   | Vazia. |

### 2.2 Diagnóstico: por que `chutes` retornou 0?

- A tabela **existe** no schema (acessível via Supabase, sem erro de permissão).
- O **count** é 0: em produção não há nenhuma linha em `chutes`.
- Conclusão: **não é bloqueio nem tabela inexistente**; o fluxo de jogo que está (ou esteve) em uso em produção **não grava** (ou não gravou) na tabela `chutes`.

### 2.3 Evidência de onde o jogo registra: `transacoes`

**Contagem por tipo em `transacoes`:**

| tipo     | count |
|----------|-------|
| debito   | 38    |
| deposito | 2     |

**Amostra de registros (sem PII; usuario_id ofuscado):**

- `tipo: "debito"`, `valor: -1`, `descricao: "Aposta no jogo - Chute center"`, `referencia_tipo: "aposta"`, `status: "concluido"`.
- Outros com `descricao: "Aposta no jogo - Chute left"`, `"Aposta no jogo - Chute right"`.
- Colunas presentes: `id`, `usuario_id`, `tipo`, `valor`, `saldo_anterior`, `saldo_posterior`, `descricao`, `referencia`, `referencia_id`, `referencia_tipo`, `status`, `metadata`, `created_at`, `processed_at`.

Ou seja: em produção, os **movimentos de jogo (débitos de aposta)** estão na tabela **transacoes**, com:

- `tipo = 'debito'`
- `referencia_tipo = 'aposta'`
- `descricao` no formato `"Aposta no jogo - Chute {center|left|right}"`

e **não** na tabela `chutes`, que está vazia.

### 2.4 Reconexão com `transacoes`

- **Tipos encontrados:** debito (38), deposito (2).
- **Origem dos débitos de jogo:** os 38 débitos são consistentes com apostas no jogo (descrição e `referencia_tipo = 'aposta'`).
- **Conclusão:** o **histórico real do jogo** neste ambiente de produção está na tabela **transacoes** (tipo `debito`, referencia_tipo `aposta`), e **não** em `chutes`.

---

## 3. Conclusões gerais

### D1 — Pendings antigos

- **Status:** Não classificados quanto a “normal” vs “bug”.
- **Motivo:** Todas as 20 consultas ao MP resultaram em INDETERMINADO (sem status real do MP no ambiente de execução).
- **Próximo passo (somente leitura):** Repetir D1 em ambiente com token MP configurado para obter classificação OK_ABANDONO / BUG_RECON.

### D2 — Onde o jogo registra

- **Pendings antigos:** Não foi possível concluir se são “normais” ou “bug de recon” sem o status real do MP.
- **Histórico do jogo:** Em produção, o histórico de movimentos de jogo (débitos de aposta) está na tabela **transacoes** (tipo `debito`, referencia_tipo `aposta`, descrição “Aposta no jogo - Chute …”). A tabela **chutes** existe mas está **vazia** (0 linhas).

Nenhuma alteração de código, schema ou dados foi realizada. Nenhuma correção foi proposta; apenas fatos e conclusões read-only.
