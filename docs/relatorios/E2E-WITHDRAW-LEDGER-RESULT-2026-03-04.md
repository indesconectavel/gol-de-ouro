# E2E Withdraw / Ledger — Resultado e causa raiz

**Data:** 2026-03-04  
**Missão:** Fechar etapa E2E do withdraw/ledger com evidências, sem quebrar /game.

---

## FASE 0 — Precheck (read-only)

| Verificação | Status |
|-------------|--------|
| HEAD https://www.goldeouro.lol/ | **200** |
| HEAD https://www.goldeouro.lol/game | **200** |
| HEAD https://goldeouro-backend-v2.fly.dev/health | **200** |
| flyctl status — VERSION | **312** |
| flyctl status — IMAGE | goldeouro-backend-v2:deployment-01KJXAHSJH0G0PEB6SAWWCPBQM |
| app (2874551a105768) | started, 1 passing |
| payout_worker (e82794da791108) | started |

---

## FASE 1 — Assert de ambiente (sem segredos)

Nesta execução (shell de automação):

- BEARER = **MISSING**
- PIX_KEY = **MISSING**
- PIX_KEY_TYPE = **MISSING**
- WITHDRAW_AMOUNT = **MISSING**

*(Os logs do APP mostram que em outro momento uma requisição de saque foi feita com credenciais válidas; a causa raiz abaixo refere-se a essa requisição.)*

---

## FASE 2 — Exec controlado (1 tentativa)

**Comando:** `node scripts/create-test-withdraw-live.js`

**Saída registrada (nesta run, sem BEARER/PIX_KEY):**

```json
{"success":false,"error":"BEARER ausente ou inválido. Defina BEARER=Bearer <jwt>","saqueId":null}
```

- **success:** false  
- **statusCode:** (script não chegou a chamar a API; exit 1)  
- **message/error:** BEARER ausente ou inválido  
- **saqueId:** null  

---

## FASE 3 — Logs e causa raiz do 500

Logs coletados das máquinas **2874551a105768** (APP) e **e82794da791108** (payout_worker). Filtro: [SAQUE], Erro ao registrar, ledger, [LEDGER], airbag, 42703, permission, RLS, constraint, duplicate, code/message/details/hint.

### Trechos relevantes (APP) — causa do "Erro ao registrar saque"

```
[SAQUE] Início { userId: '...', correlationId: 'hotfix-ledger-live-test-1772675217489' }
[PIX-VALIDATOR] Verificando disponibilidade da chave PIX: ***@gmail.com (email)
[SAQUE][ROLLBACK] Início { saqueId: '...', userId: '...', correlationId: 'hotfix-ledger-live-test-1772675217489', motivo: 'Erro ao registrar ledger do saque' }
❌ [SAQUE] Erro ao registrar ledger (saque): {
  code: '22P02',
  details: null,
  hint: null,
  message: 'invalid input syntax for type uuid: "hotfix-ledger-live-test-1772675217489"'
}
[SAQUE][ROLLBACK] Concluído { saqueId: '...', ... }
```

### Causa raiz (evidência)

- **Código PostgreSQL:** 22P02 (invalid input syntax for type).  
- **Mensagem:** `invalid input syntax for type uuid: "hotfix-ledger-live-test-1772675217489"`.  
- **Interpretação:** O valor de **correlation_id** enviado ao INSERT em `ledger_financeiro` é a string **"hotfix-ledger-live-test-1772675217489"** (idempotency key do script). A coluna **correlation_id** na tabela em produção é do tipo **uuid**; Postgres rejeita a string não-UUID e o handler responde 500 com "Erro ao registrar saque".  
- **Não é:** user_id vs usuario_id (fallback já em uso); não é 42703 (coluna inexistente); não é RLS/permission/constraint/duplicate nos trechos capturados.

### Logs payout_worker

Nenhuma linha contendo [LEDGER], airbag, 42703, Erro ao registrar ou code/message/details/hint de Supabase. Apenas ciclos "Nenhum saque pendente", "Resumo { payouts_sucesso: 0, payouts_falha: 2 }". Nada que altere a causa raiz acima.

---

## FASE 4 — Resultado e conclusão

**Resultado do script nesta run:** script falhou por BEARER ausente (não houve chamada HTTP).  

**Resultado da API de saque (evidência nos logs):** uma requisição com BEARER/PIX válidos recebeu **500** e rollback com motivo "Erro ao registrar ledger do saque", e o log do ledger mostra **22P02** + mensagem de uuid inválido para **correlation_id**.

**Conclusão:** **FAIL**

- **statusCode:** 500 (evidenciado pelo fluxo [SAQUE] → [ROLLBACK] → "Erro ao registrar ledger do saque").  
- **Causa exata:** **correlation_id** enviado como string não-UUID (`"hotfix-ledger-live-test-1772675217489"`) para uma coluna **uuid** em `ledger_financeiro`.  
- **Evidência:** trecho de log acima (code: 22P02, message: invalid input syntax for type uuid: "hotfix-ledger-live-test-1772675217489").

**Recomendação:** Ajustar o fluxo de saque para que o valor inserido em `ledger_financeiro.correlation_id` seja um UUID (por exemplo, usar o mesmo correlation_id que já seja uuid no fluxo, ou gerar um uuid por requisição e usá-lo no ledger). Não atribuir o 500 a saldo Mercado Pago sem evidência nos logs; a evidência atual aponta apenas para tipo uuid em correlation_id.

---

## FASE 5 — Higiene

Envs removidas no PowerShell:

- Remove-Item Env:BEARER, PIX_KEY, PIX_KEY_TYPE, WITHDRAW_AMOUNT — **OK**

---

*Relatório gerado em modo exec controlado. Nenhuma alteração em player, Vercel, workflows, schema ou migrations. Nenhum deploy realizado.*
