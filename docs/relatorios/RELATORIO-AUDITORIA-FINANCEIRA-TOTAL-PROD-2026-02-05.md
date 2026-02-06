# RELATÓRIO DE AUDITORIA FINANCEIRA TOTAL — PRODUÇÃO

**Data:** 2026-02-05  
**Escopo:** Sistema financeiro Gol de Ouro em produção (read-only)  
**Auditor:** Auditor técnico-financeiro sênior  
**Regras:** MAX SAFETY + READ-ONLY ABSOLUTO — sem alterações de código, schema, deploy ou escrita no banco.

---

## 1. Escopo e regras

- **Permitido:** Leitura de arquivos, execução de SELECT no Supabase (produção), geração de relatório e script read-only.
- **Proibido:** INSERT/UPDATE/DELETE/RPC, alteração de código/schema/migrations, deploy, webhooks/jobs que causem side-effects.
- **PII:** `usuario_id` ofuscado (prefixo + últimos 6 caracteres) em todas as evidências.
- **Objetivo:** Mapa do fluxo financeiro, integridade de saldo (na medida do possível), evidências de anomalias, riscos e veredito GO/GO COM RESSALVAS/NO-GO para V1, sem propor correções.

---

## 2. Mapa do fluxo financeiro

### 2.1 Depósito PIX

1. **Criação do PIX:** Cliente chama endpoint que cria pagamento no Mercado Pago e insere em `pagamentos_pix` (status `pending`).
2. **Webhook de depósito:** Notificação `payment.updated` → claim atômico por `payment_id` ou `external_id` (atualiza para `approved` só se exatamente 1 linha afetada) → crédito em `usuarios.saldo`.
3. **Reconciliação:** Job periódico busca `pagamentos_pix` pendentes antigos, consulta MP por ID, aplica mesmo claim atômico por `id` do registro e credita saldo se 1 linha afetada.
4. **Ledger/transacoes:** Depósito não grava em `ledger_financeiro`. A tabela `transacoes` existe e tem tipo `deposito` (2 registros na amostra).

### 2.2 Jogo (aposta / prêmio)

1. **Débito (aposta):** Inserção em `chutes` com `valor_aposta` → trigger `update_user_stats` (AFTER INSERT ON chutes) debita `usuarios.saldo` (`saldo = saldo - NEW.valor_aposta`) quando o resultado não é gol.
2. **Crédito (prêmio):** No mesmo trigger, quando `resultado = 'goal'` credita `saldo + premio + premio_gol_de_ouro`. No código da API (shoot), quando há gol o saldo do vencedor é ajustado manualmente: `novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro` (evita dupla cobrança da aposta).
3. **Transacoes:** Há registros `debito` (38) e `deposito` (2); não foi auditado se todo débito/crédito de jogo passa por `transacoes`.

### 2.3 Saque PIX

1. **Request:** Endpoint verifica saldo, debita com condição `.eq('saldo', usuario.saldo)` (otimistic locking), insere em `saques` (status `pendente`), grava `ledger_financeiro` (tipo `saque`, opcionalmente `taxa`).
2. **Worker/payout:** Processa saques pendentes, chama API MP; em sucesso atualiza saque e grava `payout_confirmado` no ledger; em falha grava `falha_payout` e chama rollback (recompõe saldo, grava `rollback` no ledger, atualiza saque para `falhou`).
3. **Webhook de payout:** Confirmação/rejeição do MP atualiza status do saque (`processado` / `aguardando_confirmacao` etc.).
4. **Rollback:** Reconstitui `usuarios.saldo` e insere `rollback` no ledger.

---

## 3. Evidências do código (arquivo + linhas)

### A) Depósito PIX

| Ação | Arquivo | Linhas |
|------|---------|--------|
| Inserção em pagamentos_pix (criação PIX) | server-fly.js | 1806–1819 |
| Webhook: claim atômico + crédito saldo | server-fly.js | 2048–2096 |
| Reconciliação: listar pendentes, claim por id, crédito saldo | server-fly.js | 2324–2394 |
| Leitura pagamentos_pix (listagem usuário) | server-fly.js | 1912, 2000 |

### B) Jogo / saldo

| Ação | Arquivo | Linhas |
|------|---------|--------|
| Validação valor aposta, inserção chute, ajuste saldo vencedor (gol) | server-fly.js | 1156–1160, 1284–1285, 1332–1346 |
| Trigger: débito/crédito por chute (valor_aposta; premio; saldo) | schema-supabase-final.sql | 299–333 (update_user_stats), 331–334 (chutes) |

### C) Saque PIX

| Ação | Arquivo | Linhas |
|------|---------|--------|
| Verificação saldo, débito com .eq('saldo', usuario.saldo), insert saques, ledger saque, rollback em falha | server-fly.js | 1474–1559 |
| createLedgerEntry (saque, taxa, rollback, payout_confirmado, falha_payout) | src/domain/payout/processPendingWithdrawals.js | 3–41, 43–98 |
| Worker: processPendingWithdrawals | src/workers/payout-worker.js | 75–79 |
| Webhook payout: atualização status saque | server-fly.js | 2148–2231 |

### D) Tabelas financeiras e schema

| Tabela | Schema / constraints relevantes |
|--------|---------------------------------|
| usuarios | saldo; FK em várias tabelas (database/schema.sql, database/schema-completo.sql) |
| pagamentos_pix | payment_id UNIQUE (schema.sql 95); external_id não UNIQUE no código auditado |
| saques | status; correlation_id (schema-ledger-financeiro.sql 18–19) |
| ledger_financeiro | correlation_id, tipo, referencia; UNIQUE (correlation_id, tipo, referencia); CHECK tipo in ('deposito','saque','taxa','rollback','payout_confirmado','falha_payout') (database/schema-ledger-financeiro.sql 3–15) |
| transacoes | tipo CHECK (deposito, saque, aposta, premio, bonus, cashback); usuario_id (database/schema.sql 75–78) |
| chutes | usuario_id, valor_aposta; triggers update_metrics e update_user_stats (schema-supabase-final.sql) |

---

## 4. Evidências empíricas (queries executadas em produção)

Script: `scripts/audit-financeira-total-prod-readonly.js`. Execução: 2026-02-05T18:32:07.177Z. Sem PII; `usuario_id` ofuscado.

### (1) pagamentos_pix por status

| status   | count |
|----------|-------|
| expired  | 258   |
| pending  | 34    |
| approved | 22    |

**Total registros:** 314.

### (2) Pending antigos (top 20 por idade)

Amostra: 20 registros com status `pending`, valores 10 ou 25, `created_at` de 2025-12-10 a 2026-01-22. Nenhum `payment_id` ou dado sensível exposto; `usuario_id` ofuscado (ex.: u_254ad5, u_6a1eb8).

### (3) external_id duplicado

| external_id | c (count) | a (approved) |
|-------------|-----------|----------------|
| deposito_3445582f-1eb6-4e4f-843d-b8f8905a71de_1764601609212 | 2 | 0 |

Uma única chave `external_id` com 2 linhas; nenhuma com status `approved`. Não há evidência de double credit por esse external_id.

### (4) payment_id duplicado

Nenhum. Lista vazia.

### (5) Valores estranhos (valor/amount nulo, ≤ 0 ou > 10000)

Nenhum. Lista vazia.

### (6) saques por status

| status    | count |
|-----------|-------|
| cancelado | 2     |

Total saques: 2; ambos cancelados.

### (7) Saques antigos com status não-final

Nenhum. Lista vazia (todos os saques estão em status considerado final).

### (8) ledger_financeiro por tipo

Nenhum registro. Tabela vazia (ou nenhum tipo retornado). Consistente com: só há 2 saques e ambos cancelados; fluxo de saque que grava ledger não chegou a ser executado para saques processados.

### (9) Duplicidade no ledger (correlation_id, referencia, tipo)

Nenhum. Lista vazia.

### (10) Saldos negativos (usuarios.saldo < 0)

Nenhum. Lista vazia.

### (11) Top 20 saldos (ids ofuscados)

Maior saldo 1000; demais entre 122 e 15. Todos não negativos.

### (12) transacoes por tipo

| tipo     | count |
|----------|-------|
| debito   | 38    |
| deposito | 2     |

---

## 5. Anomalias classificadas

| Item | Classificação | Descrição |
|------|----------------|-----------|
| external_id duplicado (2 linhas, 0 approved) | 🟡 Anomalia pontual / modelo | Duplicidade estrutural em `pagamentos_pix`. Não há evidência de double credit (nenhuma linha aprovada). Possível retry ou criação duplicada no passado; recomendável constraint ou idempotência por external_id. |
| ledger_financeiro vazio | 🟡 Modelo incompleto | Ledger existe no código e no schema, mas em produção está vazio porque todos os saques estão cancelados. Quando houver saques processados, o ledger deve ser populado; não é falha atual. |
| transacoes: 38 débitos vs 2 depósitos | 🟢 Normal | Pode refletir uso parcial da tabela (ex.: apenas alguns fluxos gravam transacoes). Sem evidência de falha; débitos podem ser de jogo/outros. |
| payment_id sem duplicata | 🟢 Normal | Constraint/uso mantém unicidade. |
| Valores PIX conformes | 🟢 Normal | Nenhum valor nulo, ≤ 0 ou > 10000. |
| Saldos não negativos | 🟢 Normal | Nenhum usuario.saldo < 0. |
| Saques todos cancelados | 🟢 Normal | Comportamento de negócio; não indica falha. |

Nenhuma evidência direta de falha financeira (double credit, saldo negativo indevido, saque sem débito, etc.) foi encontrada.

---

## 6. Limitações explícitas

1. **Histórico incompleto:** Não há ledger de depósito; a reconciliação saldo vs depósitos aprovados não foi feita nesta auditoria (ex.: script de diferença soma PIX approved vs saldo por usuário). Conclusões de “integridade contábil total” não são afirmadas.
2. **Transacoes:** Não foi validado se todo movimento de jogo (débito/crédito) está espelhado em `transacoes`; a tabela pode ser parcial.
3. **Trigger de chutes:** A auditoria assumiu que o schema em produção está alinhado ao `schema-supabase-final.sql` (trigger update_user_stats). Se o schema real for outro, o débito/crédito de jogo pode estar em pontos diferentes.
4. **external_id:** Não existe UNIQUE em `external_id` no schema citado; a duplicidade observada é estrutural, não de regra de negócio violada por evidência direta de duplo crédito.

---

## 7. Riscos

- **Risco real (baixo):** Um `external_id` duplicado com 2 linhas; se no futuro ambas pudessem ser aprovadas, haveria risco de double credit. Hoje as duas estão sem approved; o claim atômico no webhook/reconciliação reduz o risco enquanto apenas uma linha puder ser aprovada por payment_id/external_id.
- **Risco de modelo:** Ausência de ledger de depósito e uso possivelmente parcial de `transacoes` dificultam auditoria completa “soma de entradas/saídas = saldo” sem trabalho adicional read-only.
- **Sem alarme:** Saldos negativos, valores PIX aberrantes e payment_id duplicado não foram encontrados.

---

## 8. Veredito para V1

**GO COM RESSALVAS**

- Não foi constatada falha financeira direta (double credit, saldos negativos, saques sem débito).
- Há uma anomalia pontual (external_id duplicado, 0 approved) e limitações de modelo (ledger de depósito inexistente, transacoes possivelmente parciais).
- Para um V1, o sistema está utilizável com o entendimento de que: (1) deve-se evitar que o mesmo external_id gere duas linhas aprovadas (já mitigado pelo claim atômico); (2) auditoria contábil completa exigiria mais fontes ou scripts read-only adicionais.

---

## 9. Próximas etapas recomendadas (sem implementar)

1. **Validar reconciliação saldo vs PIX:** Rodar script read-only que, por usuário, some `pagamentos_pix` approved (valor) e compare com `usuarios.saldo` + soma de saques (por usuário) e, se existir, soma de débitos/prêmios em `transacoes`/chutes, e documentar diferenças.
2. **Esclarecer external_id duplicado:** Verificar (somente leitura) as duas linhas com o mesmo external_id (status, created_at, usuario_id ofuscado) para classificar se é retry, bug antigo ou cenário aceito.
3. **Quando houver saques processados:** Repetir auditoria do ledger (contagem por tipo, consistência saque ↔ ledger, duplicidade por correlation_id/tipo/referencia).
4. **Definir política para external_id:** Avaliar UNIQUE ou idempotência na criação de PIX por external_id para eliminar duplicidade estrutural.

---

**Fim do relatório.** Nenhuma alteração de código, schema ou dados foi realizada.
