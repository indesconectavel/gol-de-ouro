# AUDITORIA READ-ONLY — BLOCO D — SALDO V1

**Data:** 2026-03-29  
**Modo:** somente leitura (inspeção de código; sem alterações de aplicação).  
**Entrada oficial:** `package.json` → `server-fly.js` (rotas de perfil, chute, PIX, saque, webhook).  
**Complemento:** SQL em `database/rpc-financeiro-atomico-2026-03-28.sql` (RPCs referenciadas pelo backend quando `FINANCE_ATOMIC_RPC` não é `'false'`).

---

## 1. Resumo executivo

Na **V1 ativa em `server-fly.js`**, a **fonte de verdade do saldo jogável** é a coluna **`usuarios.saldo`** no Supabase/Postgres. O **chute** aplica débito da aposta e crédito de prêmios (gol + eventual Gol de Ouro) num **único `UPDATE`** com **lock otimista** (`WHERE saldo = valor_lido`). Há **rollback explícito** do saldo para o valor lido antes do chute se falharem validação pós-chute ou o `insert` em `chutes`. **PIX aprovado** credita saldo via **`creditar_pix_aprovado_mp`** (transação PL/pgSQL) quando a RPC existe; caso contrário, via **fluxo JS em duas fases** (claim `pending`→`approved` + crédito, com reversão para `pending` se o crédito falhar). **Saque** prefere **`solicitar_saque_pix_atomico`** (insert + débito na mesma transação); o **fallback JS** debita primeiro e reverte o saldo se o `insert` em `saques` falhar — com risco residual se o rollback otimista falhar.

**Riscos relevantes (evidência no código):** (1) **cobrança criada no Mercado Pago sem linha em `pagamentos_pix`** (Supabase indisponível após o POST ao MP) — webhook/reconcile não encontram pagamento local; (2) **rollback do chute** usa `update({ saldo: user.saldo })` **sem** revalidar o saldo atual no `WHERE`, permitindo **sobrescrita** em cenário extremo de corrida com outra operação; (3) **caminhos legados** (`controllers/paymentController.js`, serviços PIX) com padrões de atualização **diferentes** — relevantes só se forem montados noutro entrypoint.

**Classificação final (obrigatória):** **BLOCO D COM RISCOS MODERADOS**.

---

## 2. Escopo auditado

| Incluído | Excluído |
|----------|----------|
| `server-fly.js`: `POST /api/games/shoot`, `POST /api/payments/pix/criar`, `POST /api/payments/webhook`, `reconcilePendingPayments`, funções `creditarPixAprovadoUnicoMpPaymentId*`, `POST /api/withdraw/request`, `GET /api/withdraw/history` | Player, admin, Fly.io como runtime |
| `database/rpc-financeiro-atomico-2026-03-28.sql`: `creditar_pix_aprovado_mp`, `solicitar_saque_pix_atomico` | Alteração de schema em produção (não verificada em runtime) |
| `utils/financialNormalization.js`, `utils/webhook-signature-validator.js` (assinatura webhook) | Motor de lotes em memória (BLOCO B), exceto onde impacta saldo |

Referência cruzada fora do caminho `npm start`: `controllers/paymentController.js` (crédito sem lock otimista no update de saldo) — citado como **deriva de repositório**, não como rota confirmada em `server-fly.js`.

---

## 3. Fonte de verdade do saldo

### 3.1 Onde o saldo é lido

- **`usuarios.saldo`:** leitura em `select('saldo')` antes do chute, antes do saque (fallback JS), e dentro de `creditarPixAprovadoUnicoMpPaymentIdJsLegacy`.
- **Perfil / login:** respostas JSON expõem `saldo` a partir da mesma tabela (`server-fly.js`, rotas de auth/profile).

### 3.2 Onde o saldo é atualizado (V1 `server-fly.js`)

- **Chute:** `update({ saldo: novoSaldo }).eq('id', …).eq('saldo', user.saldo)`.
- **PIX (crédito):** via RPC ou fallback JS em `usuarios`.
- **Saque:** via RPC atómica ou fallback JS (débito antes do insert da linha de saque).

### 3.3 Mais de uma fonte de verdade?

- **Não** no desenho V1 principal: não há saldo “autoritativo” paralelo em memória do servidor para o jogador; **memória** guarda lotes/contador, **não** substitui `usuarios.saldo`.
- **Risco de divergência semântica:** colunas espelhadas `amount`/`valor` em `pagamentos_pix` e `saques` são normalizadas em leitura (`financialNormalization.js`); o crédito usa `amount ?? valor`. Colunas duplicadas mal preenchidas podem gerar **warnings** e, em extremos, valores inconsistentes — mitigado pelo `dualWrite*` nos inserts do `server-fly.js`.

### 3.4 Memória vs banco

- Saldo **persistente** = banco. Estados em RAM (lotes) não armazenam saldo do usuário.

---

## 4. Débito no chute

### 4.1 Momento do débito

- **Depois** de incrementar contador global e calcular `isGoal` / prêmios, **antes** de mutar o lote em memória: um único `UPDATE` define `novoSaldo` = saldo − aposta (+ prêmios se gol).

### 4.2 Quando o débito (e efeito líquido) é revertido

- Falha em `validateAfterShot`: `update({ saldo: user.saldo })` — restaura o saldo lido no início do handler.
- Falha no `insert` em `chutes`: idem.

### 4.3 Lock otimista

- Condição `.eq('saldo', user.saldo)` no update do chute; conflito → `409` “Saldo insuficiente ou alterado”.

### 4.4 Risco de double debit

- **Baixo** no mesmo fluxo: uma única operação combina aposta e prêmio. Duas requisições paralelas: uma vence o lock, a outra recebe **409** (saldo já mudou).

### 4.5 Risco de saldo negativo

- Pré-checagem `user.saldo < betAmount` (miss). Com gol, `novoSaldo = saldo - 1 + 5 (+100)`; para saldo ≥ 1 o resultado permanece não negativo **se** `user.saldo` for numérico fiel. Não há `CHECK` no código JS; integridade **numeric** depende do tipo no Postgres.

### 4.6 Observação transacional (BLOCO D)

- Em **409** após `contadorChutesGlobal++`, o saldo **não** foi alterado (update não aplicou). O contador em memória/ métricas pode divergir dos chutes — tema fronteiriço com BLOCO B, mas **saldo** permanece coerente.

### 4.7 Rollback sem lock no `WHERE`

- O revert usa apenas `.eq('id', req.user.userId)`, **sem** `.eq('saldo', updatedUser.saldo)`. Se outro processo alterasse o saldo entre o update bem-sucedido e o rollback, o `user.saldo` antigo poderia **sobrescrever** o valor mais recente (cenário raro, mas possível).

---

## 5. Crédito de prêmio

### 5.1 Momento

- **No mesmo `UPDATE`** que debita a aposta: não há crédito separado posterior no caminho feliz.

### 5.2 Gol e Gol de Ouro

- `premio = 5` se gol; `premioGolDeOuro = 100` se gol e `contadorChutesGlobal % 1000 === 0` (após incremento). Ambos entram em `novoSaldo`.

### 5.3 Rollback em falha posterior

- Como acima: falhas após o update revertem para `user.saldo` (prêmio “desfeito” junto com o débito).

### 5.4 Risco de double credit (chute)

- **Baixo:** segundo chute bem-sucedido implica novo update a partir do saldo já alterado; lock otimista serializa.

---

## 6. PIX / depósitos

### 6.1 Criação do pagamento (`POST /api/payments/pix/criar`)

- Cria cobrança no Mercado Pago (`POST v1/payments`) com `X-Idempotency-Key` gerado no servidor.
- Em seguida insere em **`pagamentos_pix`** (`dualWritePagamentoPixRow`). Se o insert falhar após o MP ter criado o pagamento, a resposta **500** pode incluir `mercado_pago_payment_id` — **há risco de pagamento aprovado no MP sem linha local** até intervenção (webhook/reconcile procuram por `payment_id` na tabela).

### 6.2 Confirmação via webhook (`POST /api/payments/webhook`)

- Opcional validação de assinatura se `MERCADOPAGO_WEBHOOK_SECRET`; em produção, assinatura inválida → **401**.
- Responde **200** cedo; depois consulta MP e, se `approved`, chama `creditarPixAprovadoUnicoMpPaymentId`.

### 6.3 Unicidade de crédito

- **RPC `creditar_pix_aprovado_mp`:** `FOR UPDATE` na linha `pagamentos_pix`, saldo com `FOR UPDATE`, atualiza saldo com lock otimista, depois marca `approved`; se a segunda atualização falhar, reverte saldo — tudo na **mesma transação** da função.
- **Fallback JS:** `update … .eq('status','pending')` para `approved`; se nenhuma linha, `claim_lost`; se crédito falhar, volta `approved` → `pending`.

### 6.4 Fallback / reconcile

- `reconcilePendingPayments` percorre `pagamentos_pix` com `status = 'pending'` e idade mínima; para cada um com ID MP numérico válido consulta MP e, se `approved`, chama a **mesma** função de crédito — alinhado ao webhook para idempotência (`already_processed`).

### 6.5 Risco de crédito duplicado

- **Baixo** com RPC ou claim atómico de linha; segunda execução vê `approved` e retorna `already_processed`.

### 6.6 Risco de aprovado no MP sem crédito local

- **Médio/alto (condicional):** se não existir linha em `pagamentos_pix` (falha de insert após criação MP), **nem webhook nem reconcile** encontram o pagamento pelo fluxo atual.
- **Médio:** `FINANCE_ATOMIC_RPC === 'false'` força fallback JS (várias idas ao PostgREST), com janela e lógica de compensação mais frágil que a RPC.

---

## 7. Saques

### 7.1 Criação da solicitação

- Validação via `PixValidator`; valor parseado como `valorSaque`; taxa/valor líquido apenas **log/informativo** — o débito no código observado usa **`valorSaque` integral** (não desconta taxa no `update`).

### 7.2 Débito do saldo

- **Preferência:** `supabase.rpc('solicitar_saque_pix_atomico', …)` — ordem na RPC: `FOR UPDATE` no usuário, insert em `saques`, update de saldo; se o update não afetar linha, **apaga** o saque inserido e devolve `saldo_race`.
- **Fallback:** lê saldo, `update` com `.eq('saldo', usuario.saldo)`, depois `insert` em `saques`; se insert falhar, tenta rollback `saldo` para `saldoAtual` com `.eq('saldo', usuarioDebitado.saldo)`.

### 7.3 Histórico

- `GET /api/withdraw/history` lista `saques` do usuário com normalização de leitura.

### 7.4 Risco de saque duplicado

- **Baixo:** concorrência serializada por lock otimista ou pela RPC.

### 7.5 Risco de débito sem registo

- **Baixo** na RPC (transação única). **No fallback JS:** se o rollback após falha no insert **falhar** (log `Falha crítica no rollback`), permanece **saldo debitado sem linha de saque** — tratado como erro operacional grave no código (log), não como invariante automática.

### 7.6 Risco de registo sem débito

- **Baixo** na RPC (débito após insert com compensação). **Fallback:** débito antes do insert — registo sem débito **não** persiste no caminho feliz.

### 7.7 Payout / rollback pós-saque

- Não foi encontrado em `server-fly.js` worker de payout ou `rollbackWithdraw` referenciado nesse ficheiro; reversões após “falha de transferência” exigiriam outro módulo ou processo — **fora do escopo confirmado** nesta auditoria limitada ao ficheiro principal.

---

## 8. Atomicidade e consistência

### 8.1 Operações multi-etapas sem transação “real” (Postgres)

- **Chute:** saldo (1× PostgREST) + insert `chutes` + estado de lote em memória — **não** uma única transação DB↔memória; compensação manual do saldo e do lote em caso de falha no insert.
- **PIX (fallback JS):** múltiplas chamadas; compensação explícita.
- **Webhook:** resposta HTTP desacoplada do término do crédito (handler continua após `res.json`); falhas posteriores dependem de **retry** do MP/reconcile.

### 8.2 Pontos de divergência banco ↔ memória

- Lote em RAM vs `chutes` no DB: revertidos em falhas após update de saldo **quando** o handler cobre o erro.

### 8.3 Saldo antes do registo

- **Chute:** saldo alterado **antes** do `insert` em `chutes` — se o processo morrer entre os dois, saldo reflete o chute sem linha (inconsistência até retry manual/reconciliação de negócio).

### 8.4 Registo sem garantia de saldo

- **PIX RPC:** saldo e `approved` na mesma transação PL/pgSQL — **coerente**.
- **Saque RPC:** idem.

---

## 9. Integridade de negócio

| Expectativa | Avaliação |
|-------------|-----------|
| Caminho feliz: saldo coerente com aposta/prêmio/PIX/saque no `server-fly.js` | **Sim**, com RPCs aplicadas e inserts bem-sucedidos |
| Proteção razoável contra corrida em saldo | **Sim** (lock otimista; RPCs com `FOR UPDATE`) |
| Premissas frágeis | Dependência de **`pagamentos_pix`** existir para cada cobrança MP; dependência de **`FINANCE_ATOMIC_RPC`** em produção para máxima atomicidade; rollback de chute **sem** lock no saldo |

---

## 10. Classificação de riscos

### Crítico

- **Nenhum** com evidência no fluxo normal **único-processo** e RPCs ativas, exceto o caso **operacional** de falha total do rollback no saque fallback (debitado sem saque) — classificado abaixo como **alto** por ser exceção mas impacto severo.

### Alto

- **Saque fallback:** falha do rollback após erro no `insert` → saldo debitado sem registo (log de falha crítica).
- **PIX sem linha local** após criação no MP → aprovado no provedor sem caminho automático de crédito no código auditado.

### Médio

- **Rollback do chute** sem `WHERE saldo = …` ao reverter.
- **`FINANCE_ATOMIC_RPC=false`** ou RPC ausente → caminhos JS mais longos para PIX/saque.
- **Webhook** respondendo 200 antes de concluir crédito (dependência de retries).
- **`controllers/paymentController.js`:** atualização de saldo **sem** lock otimista no snippet analisado — **deriva** se reutilizado.

### Baixo

- Duplo débito/crédito em chute com lock otimista.
- Duplo crédito PIX com claim/`already_processed`.
- Colunas duplicadas `amount`/`valor` com divergência > tolerância (warning).

---

## 11. Diagnóstico final

O **BLOCO D na V1 (`server-fly.js` + RPCs opcionais)** está **estruturalmente alinhado** a uma única fonte de verdade (`usuarios.saldo`), com **padrões fortes** de lock otimista no jogo e **transações server-side** para PIX e saque quando as RPCs estão instaladas e `FINANCE_ATOMIC_RPC` não desativa o caminho atómico.

As **lacunas** concentram-se em: **janelas multi-request** sem transação global PostgREST+memória no chute; **edge case** MP sem `pagamentos_pix`; **rollback** do chute potencialmente agressivo em corrida extrema; e **falha do rollback** no saque fallback. Há ainda **código legado paralelo** no repositório com semântica de saldo diferente, **fora** do mount verificado em `server-fly.js`.

**Classificação final obrigatória:** **BLOCO D COM RISCOS MODERADOS**.

---

## 12. Próxima etapa recomendada

1. Garantir em ambiente de produção as RPCs `creditar_pix_aprovado_mp` e `solicitar_saque_pix_atomico` e manter `FINANCE_ATOMIC_RPC` alinhado à política desejada.
2. Playbook operacional para **pagamentos MP sem linha** em `pagamentos_pix` (reconciliação manual ou job por `payment_id`).
3. Rever o **rollback do chute** com condição de saldo (ex.: `eq('saldo', updatedUser.saldo)`) numa futura cirurgia.
4. Documentar explicitamente se rotas em `paymentController.js` estão **desmontadas** na API pública para evitar dupla semântica de crédito.

---

*Evidências: `server-fly.js` (shoot ~1189–1354, PIX criar ~1644–1767, webhook ~2037–2099, crédito ~1911–2030, saque ~1407–1592, reconcile ~2153+), `database/rpc-financeiro-atomico-2026-03-28.sql`, `controllers/paymentController.js` (trechos 206–295, leitura apenas).*
