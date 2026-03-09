# Auditoria Master E2E Financeira (READ-ONLY ABSOLUTO) — Goldeouro

**Data:** 2026-03-04  
**Projeto:** goldeouro-backend | **Fly app:** goldeouro-backend-v2  
**Versão referência produção:** v311  
**Regras:** Nenhuma alteração em código, banco, deploy ou env. Apenas leitura.

---

## 1. INFRA / PRODUÇÃO (Fly) — Snapshot READ-ONLY

### 1.1 flyctl status -a goldeouro-backend-v2

| Campo     | Valor |
|----------|--------|
| App Name | goldeouro-backend-v2 |
| Owner    | personal |
| Hostname | goldeouro-backend-v2.fly.dev |
| Image    | goldeouro-backend-v2:deployment-01KJV1YH1Y3CATDV6VQA5Z3K3J |

**Machines:**

| PROCESS       | ID (prefixo) | VERSION | REGION | STATE   | ROLE | OBSERVAÇÃO        |
|---------------|--------------|--------|--------|--------|------|-------------------|
| app           | 2874551a…    | 311    | gru    | started| —    | 1 check passing   |
| app           | e82d445a…    | 311    | gru    | stopped| —    | 1 warning         |
| payout_worker | e82794da…   | 311    | gru    | started| —    | sem checks HTTP   |

**Evidência (HTTP):** Comando executado em 2026-03-04; saída capturada (flyctl status / machines list / releases).

### 1.2 flyctl machines list (resumo)

| ID (prefixo)  | NOME                | STATE   | REGION | IMAGE (deployment)                    | PROCESS GROUP | SIZE              |
|---------------|---------------------|--------|--------|----------------------------------------|---------------|-------------------|
| e82794da791108 | weathered-dream-1146 | started | gru   | …01KJV1YH1Y3CATDV6VQA5Z3K3J | payout_worker | shared-cpu-1x:256MB |
| 2874551a105768 | withered-cherry-5478 | started | gru   | …01KJV1YH1Y3CATDV6VQA5Z3K3J | app           | shared-cpu-1x:256MB |
| e82d445ae76178 | dry-sea-3466        | stopped | gru   | …01KJV1YH1Y3CATDV6VQA5Z3K3J | app           | shared-cpu-1x:256MB |

### 1.3 flyctl releases (top 15)

| VERSION | STATUS  | DATE (resumo)   |
|---------|--------|-----------------|
| v311    | failed | 16h45m ago      |
| v310    | failed | 16h55m ago      |
| v309    | failed | 17h11m ago      |
| v308–v306 | failed | Mar 3 2026    |
| v305    | complete | Feb 25 2026   |
| v304, v303 | failed | Feb 6 2026   |
| v302, v301 | complete | Feb 3 2026  |
| v300–v298 | failed | Feb 3 2026    |
| v297    | complete | Feb 3 2026    |

**Conclusão infra:** Process groups **app** e **payout_worker** existem; app tem 1 máquina started e 1 stopped; payout_worker 1 started. Todas na imagem deployment-01KJV1YH1Y3CATDV6VQA5Z3K3J, versão 311.

---

## 2. ENDPOINTS PÚBLICOS E CONTRATOS (HTTP)

### 2.1 Mapa de rotas financeiras (a partir do código)

**Evidência:** server-fly.js — rotas registradas com `app.get` / `app.post`.

| Método | Rota | Auth | Uso financeiro |
|--------|------|------|----------------|
| GET | /health | Não | Saúde; ping Supabase (server-fly.js:2462) |
| GET | /api/user/profile | Bearer | Perfil/saldo (L1023) |
| PUT | /api/user/profile | Bearer | Atualização perfil (L1073) |
| POST | /api/games/shoot | Bearer | Débito saldo + chute (L1168) |
| POST | /api/withdraw/request | Bearer | Solicitar saque PIX (L1396) |
| GET | /api/withdraw/history | Bearer | Histórico saques (L1649) |
| POST | /api/payments/pix/criar | Bearer | Criar pagamento PIX depósito (L1710) |
| GET | /api/payments/pix/usuario | Bearer | PIX do usuário (L1875) |
| POST | /api/payments/webhook | Não (signature) | Webhook depósito MP (L1973) |
| POST | /webhooks/mercadopago | Não (payload) | Webhook payout MP (L2112) |
| GET | /api/metrics | Não | Métricas (L2493) |
| GET | /api/admin/saques-presos | Admin token | Saques presos (L2934) |

### 2.2 CORS e OPTIONS

**Evidência:** server-fly.js:237–260.

- **Origins:** `process.env.CORS_ORIGIN` (CSV) ou default: `https://goldeouro.lol`, `https://www.goldeouro.lol`, `https://admin.goldeouro.lol`.
- **Regex Vercel preview:** `^https:\/\/goldeouro-player(-[a-z0-9-]+)*\.vercel\.app$`.
- **Métodos:** GET, POST, PUT, DELETE, OPTIONS.
- **Headers permitidos:** Content-Type, Authorization, X-Requested-With, **X-Idempotency-Key** (usado em /api/withdraw/request).

**Validação GET/OPTIONS (READ-ONLY):**  
- GET /health: pode ser chamado sem auth; retorna JSON status, database, mercadoPago.  
- GET /api/user/profile, GET /api/withdraw/history: **exigem Authorization: Bearer &lt;JWT&gt;**; sem token retornam 401.  
- OPTIONS: CORS responde conforme config; não foi executado POST em desta auditoria.

### 2.3 Idempotência e headers

- **Saque:** `x-idempotency-key` ou `x-correlation-id` (server-fly.js:1399–1402); se ausente, gera `crypto.randomUUID()`.
- **Depósito:** idempotência por `external_id` / `payment_id` no webhook e reconciler.

---

## 3. CÓDIGO-FONTE: FLUXO FINANCEIRO E INVARIANTES

### 3.1 Diagrama de fluxo (resumido)

```
[1] DEPÓSITO PIX
    Cliente → POST /api/payments/pix/criar → pagamentos_pix (pending)
    MP aprova → POST /api/payments/webhook (ou reconciler) → update approved → crédito usuarios.saldo

[2] JOGO (SHOOT)
    Cliente → POST /api/games/shoot → valida saldo → insert chutes → update usuarios.saldo (débito aposta; prêmio se gol)

[3] SAQUE
    Cliente → POST /api/withdraw/request → idempotência (correlation_id) → bloqueio 1 pendente/user
    → debita saldo (optimistic lock) → insert saques (pendente) → createLedgerEntry (saque + taxa)
    Worker (payout_worker) → processPendingWithdrawals → lock PROCESSING → createPixWithdraw → update COMPLETED/rollback
    Webhook MP → POST /webhooks/mercadopago → createLedgerEntry (payout_confirmado/falha_payout) → update saques
```

### 3.2 Invariantes e provas em código

| Invariante | Onde | Evidência (arquivo:linha + snippet) |
|------------|------|--------------------------------------|
| Idempotência saque | correlation_id | server-fly.js:1440–1470 — select saques por correlation_id; se existingWithdraw?.id retorna 200 com data existente. |
| Não duplicar crédito depósito | payment_id / external_id | server-fly.js:2001–2075 — update approved com .neq('status','approved'); claim atômico; 1 linha afetada para creditar. |
| Não duplicar débito saque | 1 pendente por usuário | server-fly.js:1474–1494 — select saques .eq('usuario_id', userId).eq('status', PENDING).limit(1); se length > 0 → 409. |
| Débito shoot com saldo | optimistic lock | server-fly.js:1528–1544 — update usuarios .eq('saldo', usuario.saldo); se !saldoAtualizado → 409. |
| Status machine saque | pendente→processando→concluido/rejeitado | withdrawalStatus.js — PENDING, PROCESSING, COMPLETED, REJECTED, CANCELED; processPendingWithdrawals.js:294–302 updateSaqueStatus onlyWhenStatus: PENDING. |
| Ledger dedup | correlation_id + tipo + referencia | processPendingWithdrawals.js:44–56 — select ledger_financeiro por correlation_id, tipo, referencia; se existing?.id retorna deduped. |

### 3.3 Pontos de falha (resumo)

- **POST /api/withdraw/request:** falha em createLedgerEntry (ex.: coluna usuario_id inexistente em prod) → hoje retorna 201 com saque criado (estratégia S1; ledger pendente para auditoria). Com patch user_id/usuario_id, insert pode suceder.
- **Worker:** falha em createPixWithdraw → createLedgerEntry(falha_payout) + rollbackWithdraw (recompõe saldo, ledger rollback, saque → rejeitado).
- **Depósito:** webhook ou reconciler; se claim perder (já approved ou não encontrado), não credita duas vezes.

---

## 4. AUDITORIA FORENSE usuario_id vs user_id (CRÍTICO)

### 4.1 Tabela global (arquivo, linha, tabela, coluna, operação, risco)

| Arquivo | Linha(s) | Tabela | Coluna | Operação | Risco |
|---------|----------|--------|--------|----------|--------|
| src/domain/payout/processPendingWithdrawals.js | 5–6, 25, 28, 33, 36 | ledger_financeiro | user_id / usuario_id | INSERT (fallback) | Mitigado por patch cache |
| src/domain/payout/processPendingWithdrawals.js | 276, 301 | saques | usuario_id | SELECT | Baixo — saques em prod tem usuario_id |
| src/domain/payout/reconcileProcessingWithdrawals.js | 67, 89 | saques | usuario_id | SELECT | Baixo |
| server-fly.js | 1479, 1664, 1918, 2155, 2210, 2342, 2392, 2405, 2942 | saques, usuarios, pagamentos_pix | usuario_id | SELECT/INSERT/UPDATE | Baixo |
| server-fly.js | 2182 | ledger_financeiro | — | SELECT (id, tipo) | Nenhum — não usa coluna usuário |
| server-fly.js | 492, 563, 607 | password_reset_tokens | user_id | SELECT/INSERT | Nenhum — tabela em prod tem user_id |
| src/ai/analytics-ai.js | 112, 118, 124, 341 | (analytics) | usuario_id | SELECT | Baixo |
| database/schema-ledger-financeiro.sql | 7, 13 | ledger_financeiro | usuario_id | CREATE/INDEX | Repo alinhado com schema; prod tem user_id |
| password-reset-tokens.sql | 10, 19 | password_reset_tokens | user_id | CREATE/INDEX | Alinhado com prod |

### 4.2 Realidade de produção (sem escrita)

- **Scripts de probe existentes (READ-ONLY):**
  - **scripts/ledger_probe.js:** SELECT id, depois SELECT (id, correlation_id, tipo, usuario_id, valor, referencia, created_at). Em prod, SELECT com `usuario_id` falha (coluna não existe); evidência em docs/relatorios/PROVA-LEDGER-FINANCEIRO-2026-03-04.md e AUDITORIA-USUARIO_ID-VS-USER_ID-2026-03-04.md.
  - **scripts/schema_probe_usuario_user_id.js:** Para cada tabela, SELECT(col).limit(1) para id, usuario_id, user_id; inferência de existência de coluna por sucesso/erro.

- **Resultado probe produção (citado em AUDITORIA-USUARIO_ID-VS-USER_ID):**
  - ledger_financeiro: **usuario_id** = "column ledger_financeiro.usuario_id does not exist", **user_id** = YES.
  - saques, transacoes, pagamentos_pix, chutes: **usuario_id** = YES; user_id não existe.
  - password_reset_tokens: **user_id** = YES.

**Inferência via Supabase (READ-ONLY):** Executar script que apenas faz `supabase.from('ledger_financeiro').select('id','user_id').limit(1)`; se sucesso, coluna user_id existe. Se `select('usuario_id')` falhar com "column does not exist", confirma divergência. Nenhum INSERT/UPDATE nesta auditoria.

### 4.3 Conclusão forense

**O problema é isolado:** apenas a tabela **ledger_financeiro** em produção tem **user_id** enquanto o código (e schema do repo) usavam **usuario_id**. Demais tabelas do domínio (saques, transacoes, pagamentos_pix, chutes) estão alinhadas (usuario_id em código e banco). O patch em processPendingWithdrawals.js (fallback user_id → usuario_id com cache) corrige o insert sem alterar banco.

---

## 5. WORKER DE SAQUE (payout_worker) + RECONCILER SAQUES PRESOS

### 5.1 Arquivos

| Arquivo | Função |
|---------|--------|
| src/domain/payout/processPendingWithdrawals.js | createLedgerEntry, insertLedgerRow, updateSaqueStatus, rollbackWithdraw, processPendingWithdrawals |
| src/domain/payout/reconcileProcessingWithdrawals.js | reconcileProcessingWithdrawals (saques PROCESSING presos) |
| src/domain/payout/withdrawalStatus.js | PENDING, PROCESSING, COMPLETED, REJECTED, normalizeWithdrawStatus |
| src/workers/payout-worker.js | Worker standalone; runCycle → processPendingWithdrawals + reconcileProcessingWithdrawals |
| services/pix-mercado-pago.js | createPixWithdraw (provedor PIX) |

**Evidência (worker):** payout-worker.js L61–73 — runCycle chama processPendingWithdrawals; L17–19 reconcileProcessingWithdrawals a cada PAYOUT_RECONCILE_INTERVAL_MS (default 5 min).

### 5.2 Fluxo worker (resumo)

1. Selecionar saques: status = PENDING, order created_at asc, limit 1 (processPendingWithdrawals.js:271–278).
2. Lock: updateSaqueStatus(newStatus: PROCESSING, onlyWhenStatus: PENDING) (L294–302).
3. createPixWithdraw(netAmount, pixKey, pixType, userId, saqueId, correlationId).
4. Se sucesso: updateSaqueStatus(COMPLETED, processed_at, transacao_id).
5. Se falha: createLedgerEntry(falha_payout), rollbackWithdraw (recompõe saldo, ledger rollback, saque REJECTED).

**Evidência (lock):** processPendingWithdrawals.js:294–302 — updateSaqueStatus onlyWhenStatus: PENDING; se nenhuma linha atualizada, retorna duplicate e não processa.

### 5.3 Reconciler de saques presos (reconcileProcessingWithdrawals)

- Seleciona saques status PROCESSING e created_at &lt; now - 10 min (reconcileProcessingWithdrawals.js:63–69).
- Timeout &gt; 30 min: update REJECTED com motivo_rejeicao "timeout_reconciliacao" (L95–116).
- Com transacao_id: tenta getTransfer no provedor; se approved/credited, update COMPLETED (L119+).
- Sem transacao_id: re-tenta createPixWithdraw (idempotência); 409 tratado como sucesso.

### 5.4 Logs esperados / assinaturas

- `🟦 [PAYOUT][WORKER] Início do ciclo` — início do ciclo worker.
- `🟦 [PAYOUT][WORKER] Saque selecionado` — saque PENDING escolhido.
- `🟦 [PAYOUT][WORKER] Payout iniciado` — lock adquirido, antes de createPixWithdraw.
- `✅ [PAYOUT][WORKER] Saque concluído` — COMPLETED.
- `❌ [PAYOUT][FALHOU] rollback acionado` — falha payout + rollback.
- `[LEDGER] insert falhou (airbag)` — falha de insert no ledger (step user_id ou usuario_id).
- `🟦 [RECONCILE] Início` — reconciler saques PROCESSING.

---

## 6. LEDGER FINANCEIRO (CRÍTICO)

### 6.1 Onde é escrito

- **createLedgerEntry** (processPendingWithdrawals.js:43–76): chamado em server-fly.js (POST withdraw: saque + taxa; webhook MP: payout_confirmado, falha_payout) e em processPendingWithdrawals.js (rollback, falha_payout).

**Evidência:** server-fly.js:1603–1618 (saque + taxa), 2207–2213 (payout_confirmado), 2257 (falha_payout); processPendingWithdrawals.js:200–212 (rollback), 397 (falha_payout).

### 6.2 Dedup e tipos

- **Dedup:** SELECT por (correlation_id, tipo, referencia); se existing?.id, retorna { success: true, id, deduped: true } (processPendingWithdrawals.js:44–56).
- **Tipos (CHECK):** deposito, saque, taxa, rollback, payout_confirmado, falha_payout (database/schema-ledger-financeiro.sql L6).

### 6.3 Lacuna produção vs repo

- **Repo/schema:** ledger_financeiro com **usuario_id** (schema-ledger-financeiro.sql L7, L13).
- **Produção:** ledger_financeiro com **user_id** (probe e relatórios 2026-03-04). Insert com usuario_id falha com "column ledger_financeiro.usuario_id does not exist".

### 6.4 Opções de correção (não aplicadas — READ-ONLY)

| Opção | Descrição | Risco | Impacto | Como testar | Rollback |
|-------|-----------|--------|---------|-------------|----------|
| **1. Patch código (fallback)** | No insert, tentar user_id depois usuario_id; cache da coluna que funcionar. | Baixo | Só processPendingWithdrawals.js | Deploy em staging com ledger user_id; depois prod | Restaurar insert fixo com usuario_id |
| **2. Migration DB** | ADD COLUMN usuario_id; migrar dados; remover user_id (ou padronizar só usuario_id). | Alto | Schema, migração, possivelmente RLS | Migração em staging; validar leituras | Migration reversa (complexo) |
| **3. Ambos** | Patch código + migration em janela futura para padronizar schema. | Médio | Código imediato; DB em janela | Idem 1 e 2 em etapas | Rollback código; migration reversa se aplicado |

**Recomendação (apenas documental):** Opção 1 já implementada no repo (insertLedgerRow + cache); validar em staging e depois produção. Opção 2 só se houver decisão de padronizar schema do ledger em produção.

---

## 7. MATRIZ DE TESTES (SEM EXECUTAR POST)

Checklist que o operador executa depois (com BEARER); nesta auditoria apenas documentação.

| Teste | Endpoints / ações | Campos a comparar | Invariantes | Passos BLOQUEADOS (write) |
|-------|-------------------|-------------------|-------------|---------------------------|
| Depósito 1 payment approved → saldo +X | POST /api/payments/pix/criar; webhook ou reconciler aprovando | usuarios.saldo antes/depois; pagamentos_pix.status | 1 payment_id aprovado → 1 crédito; não duplicar | POST criar, webhook (write), reconciler (write) |
| Jogo 2 chutes R$1 → saldo -2 | GET /api/user/profile (saldo); POST /api/games/shoot x2 (amount=1) | saldo antes/depois; chutes count | Débito 2; registros em chutes | POST shoot (write) |
| Saque request 10 → pendente → worker → concluído | POST /api/withdraw/request; GET /api/withdraw/history; aguardar worker | saques.status (pendente→processando→concluido); processed_at; ledger | 1 saque por correlation_id; ledger saque+taxa | POST request (write); worker (write); webhook (write) |

**Validação READ-ONLY possível:** GET /health (200); GET /api/user/profile com Bearer (200/401); GET /api/withdraw/history com Bearer (200/401); OPTIONS nas rotas para CORS. Não executar POST que alterem saldo, saques ou ledger.

---

## 8. EVIDÊNCIAS (REFERÊNCIAS RÁPIDAS)

- createLedgerEntry: processPendingWithdrawals.js:43–76; chamadas server-fly.js:1603, 1618, 2208, 2257; processPendingWithdrawals.js:200, 210, 397.
- Idempotência saque: server-fly.js:1439–1470 (correlation_id).
- Bloqueio 1 pendente: server-fly.js:1474–1494.
- Ledger dedup: processPendingWithdrawals.js:44–56 (correlation_id, tipo, referencia).
- Status machine: withdrawalStatus.js (PENDING, PROCESSING, COMPLETED, REJECTED); processPendingWithdrawals.js updateSaqueStatus onlyWhenStatus.
- CORS: server-fly.js:237–260 (parseCorsOrigins, vercelPreviewOriginRegex, allowedHeaders incl. X-Idempotency-Key).
- Reconciler depósitos: server-fly.js:2326–2428 (reconcilePendingPayments); reconciler saques: reconcileProcessingWithdrawals.js.

---

## 9. VEREDITO

### Estamos longe?

**Não.** O sistema financeiro está mapeado; a divergência crítica (ledger user_id vs usuario_id) está isolada e já existe patch em código (fallback + cache). Depósitos (webhook + reconciler), saques (request + worker + webhook MP), shoot (débito + chutes) e ledger (dedup, tipos) estão documentados com invariantes e evidências.

### O que falta para “finalizar financeiramente” em produção com segurança (máximo 5 itens)

1. **Validar patch ledger em produção:** Garantir que a versão deployada inclui insertLedgerRow (user_id primeiro, depois usuario_id) para que POST /api/withdraw/request não dependa de coluna usuario_id no ledger.
2. **Executar testes E2E com BEARER:** Depósito (1 approved → saldo), Shoot (2 chutes → saldo -2), Saque (request → worker → concluído); conferir ledger e status.
3. **Confirmar process groups Fly:** app e payout_worker started; releases v311 (ou próxima estável) com imagem correta.
4. **Monitorar logs:** Assinaturas de sucesso (Saque concluído, ledger OK) e falha (airbag ledger, rollback); sem vazar tokens.
5. **Checklist GO-LIVE:** Seguir docs/relatorios/CHECKLIST-GO-FINANCEIRO-2026-03-04.md antes de considerar financeiro “fechado”.

### Recomendação única de menor risco + rollout + rollback

- **Recomendação:** Deploy do patch de ledger já presente no repo (processPendingWithdrawals.js com insertLedgerRow e cache) para produção, sem migration no banco.
- **Rollout:** (1) Deploy em staging com ledger user_id; (2) POST /api/withdraw/request de teste; (3) Verificar logs (sem [LEDGER] insert falhou para user_id); (4) Deploy em produção; (5) Smoke: 1 saque de teste e GET /api/withdraw/history.
- **Rollback:** Restaurar trecho do insert antigo (apenas usuario_id) em processPendingWithdrawals.js e redeploy; em produção com ledger user_id o saque voltaria a falhar no ledger até novo patch — por isso validar em staging primeiro.

---

*Relatório READ-ONLY. Nenhuma alteração de código, banco, deploy ou env foi realizada. Tokens e chaves não foram impressos (mascarar HEAD 12 / TAIL 8 se necessário).*
