# Prova em produção — Bug saldo ao abrir dashboard (READ-ONLY)

**Data:** 2026-03-05  
**Modo:** READ-ONLY (nenhum código/ENV/deploy alterado).  
**Objetivo:** Confirmar com evidência de produção se (A) o saldo aumenta no banco, (B) existe duplicidade em `pagamentos_pix`, (C) o reconciler credita múltiplas vezes.

---

## PASSO 1 — Saldo persistido x visual

### 1.1 JWT / BEARER

- **Projeto:** Não há token de teste commitado (segurança). O E2E usa `process.env.BEARER` definido no shell (docs/relatorios/README-E2E-WITHDRAW-LEDGER-AUTO.md).
- **Nesta execução:** BEARER **não** foi definido no ambiente (não solicitado ao usuário).
- **Script de prova:** Criado `scripts/prova-prod-saldo-profile-readonly.js`, que:
  - Se `process.env.BEARER` estiver definido (formato `Bearer <jwt>`): chama GET /health e GET /api/user/profile em T0, T0+10s, T0+40s e registra `saldo` em cada momento; conclui SALDO_AUMENTOU ou SALDO_ESTAVEL.
  - Se BEARER não estiver definido: imprime `INCONCLUSIVO: BEARER não definido ou inválido`.
- **Máscara:** O script não imprime o token; no relatório usa-se apenas `bearer_set: true/false`.

### 1.2 Health (sem auth)

- **Chamada:** GET https://goldeouro-backend-v2.fly.dev/health  
- **Resposta (exemplo):** `{"status":"ok","timestamp":"2026-03-05T19:59:19.041Z","version":"1.2.1","database":"connected","mercadoPago":"connected","contadorChutes":215,"ultimoGolDeOuro":0}`  
- **Conclusão:** Backend e banco operacionais.

### 1.3 Profile em T0, T0+10s, T0+40s

- **Execução:** `node scripts/prova-prod-saldo-profile-readonly.js` foi executado **sem** BEARER definido (timeout 5s não permite rodar as 3 chamadas com 10s+30s de delay; além disso BEARER não estava setado).
- **Resultado:** Prova (A) **não** realizada nesta sessão — requer que o operador defina `BEARER=Bearer <jwt>` (obtido via POST /api/auth/login com credenciais de teste) e execute o script com timeout ≥ 55 s (ou rodar em background e inspecionar saída).
- **Registro no relatório:**
  - **saldo em cada chamada:** N/A (profile não foi chamado com auth).
  - **Conclusão (A):** **INCONCLUSIVO** — Para afirmar se o aumento é persistido ou só visual, é necessário: (1) obter JWT (login de teste); (2) definir BEARER no ambiente; (3) executar `node scripts/prova-prod-saldo-profile-readonly.js` e comparar os três valores de `saldo` no JSON de saída. Se os três forem iguais, o aumento observado no front provavelmente é cache/visual; se aumentarem entre chamadas sem novo depósito, o aumento é persistido.

---

## PASSO 2 — Duplicidade em pagamentos_pix (SQL read-only)

### 2.1 Cliente Supabase

- **Referência:** Scripts usam `require('dotenv').config()` e `createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)`. Connection string e keys **não** são impressas (config em database/supabase-unified-config.js e scripts/audit-c-postdeploy-readonly.js).

### 2.2 Execução read-only

Foi executado o script existente **scripts/audit-c-postdeploy-readonly.js**, que:

- Lista duplicatas por `external_id` entre registros **approved** (agrupando por external_id e filtrando `arr.length > 1`).
- Conta quantos `payment_id` têm mais de um registro approved.
- Calcula “top diferenças” (soma PIX approved por usuário vs saldo atual).

**Resultado (produção, 2026-03-05 ~19:59 UTC):**

```json
{
  "timestamp": "2026-03-05T19:59:34.524Z",
  "external_id_duplicados_approved": [],
  "approved_por_payment_id": {
    "total_payment_ids": 23,
    "payment_ids_com_mais_de_um_approved": []
  },
  "top_diferencas": [ ... ],
  "erros": []
}
```

### 2.3 Interpretação

- **external_id_duplicados_approved:** **[]** — Nenhum `external_id` com mais de um registro **approved**.
- **payment_ids_com_mais_de_um_approved:** **[]** — Nenhum `payment_id` com mais de um approved.
- **Conclusão (B):** Em produção **não** há duplicidade entre registros **approved** em `pagamentos_pix`. Ou seja, **não** há evidência de que o mesmo pagamento tenha sido aprovado mais de uma vez em registros distintos.

**top_diferencas (resumo):** Vários usuários têm `saldo_atual` maior que `soma_pix_approved` (ex.: saldo 1000 com 0 PIX approved; saldo 122 com 6 PIX approved; saldo 153 com 79 PIX approved). Isso é compatível com: saldo inicial no login (config ou histórico), prêmios de jogo, e/ou créditos antigos — **não** exige duplicidade atual em approved.

### 2.4 SQL equivalente (para reprodução manual no Supabase)

Caso queira repetir a checagem no SQL Editor (read-only):

```sql
-- Duplicatas por external_id
SELECT external_id, COUNT(*) AS n
FROM pagamentos_pix
WHERE external_id IS NOT NULL
GROUP BY external_id
HAVING COUNT(*) > 1
ORDER BY n DESC
LIMIT 50;

-- Status das duplicatas (pending/approved)
SELECT external_id,
       COUNT(*) FILTER (WHERE status = 'pending') AS pending_n,
       COUNT(*) FILTER (WHERE status = 'approved') AS approved_n,
       COUNT(*) AS total_n
FROM pagamentos_pix
WHERE external_id IS NOT NULL
GROUP BY external_id
HAVING COUNT(*) > 1
ORDER BY total_n DESC
LIMIT 50;
```

---

## PASSO 3 — Reconciler creditando múltiplas vezes (Fly logs)

### 3.1 Coleta

- **Comando:** `flyctl logs -a goldeouro-backend-v2 --no-tail`  
- **Janela:** Últimas linhas disponíveis (~19:52–19:59 UTC).

### 3.2 Padrões buscados

- "Claim ganhou", "creditado", "saldo +X aplicado", "RECON" (bloco server-fly.js 2333–2422).

### 3.3 Evidência

- **Nenhuma** linha com "Claim ganhou" ou "saldo +X aplicado" ou "creditado" na janela coletada.
- **Repetido:** `❌ [RECON] ID de pagamento inválido (não é número): deposito_4ddf8330-ae94-4e92-a010-bdc7fa254ad5_1765383727057`  
  O reconciler usa `p.external_id || p.payment_id` como ID do pagamento no Mercado Pago (server-fly.js 2361). Neste caso, `external_id` é a string `deposito_<uuid>_<timestamp>`, **não** o ID numérico do MP. O código exige `/^\d+$/` (server-fly.js 2365); como falha, **não** chama a API do MP e **não** credita. Ou seja, para esse registro pendente o reconcile **não** está creditando; está apenas logando erro e seguindo.

**Conclusão (C):** Nos logs recentes **não** há evidência de o reconciler ter creditado saldo (nenhuma linha de crédito). Há evidência de que o reconcile **rejeita** registros cujo `external_id` não é numérico, portanto não credita esses pendentes. Não é possível, com esta janela de log, afirmar que o reconcile já creditou o mesmo pagamento múltiplas vezes no passado; a prova (B) mostra que **hoje** não há duplicata em approved.

---

## PASSO 4 — Conclusão e próximo passo

### 4.1 Causa raiz

- **Confirmada (duplicidade + reconcile creditando por registro)?** **NÃO.**  
  - Em produção: **zero** duplicatas em registros approved por `external_id` e por `payment_id`.  
  - Nos logs: reconcile **não** creditou na janela observada; apenas falhou por "ID de pagamento inválido" em um external_id não numérico.

- **Saldo persistido x visual (A):** **INCONCLUSIVO** — Não foi executada a sequência GET profile (T0, T0+10s, T0+40s) com JWT. Para fechar: definir BEARER e rodar `node scripts/prova-prod-saldo-profile-readonly.js`.

- **Resumo:** Com os dados desta prova em produção, **não** se confirma a hipótese “duplicidade em pagamentos_pix + reconcile creditando múltiplas vezes”. Saldos maiores que a soma de PIX approved podem vir de saldo inicial (login), jogo ou créditos antigos. O aumento “ao abrir dashboard” pode ser efeito de **cache no front** (TTL 30 s) ou de timing (reconciler/webhook creditando logo antes).

### 4.2 Próximo passo cirúrgico (sem implementar aqui)

1. **Prova (A):** Operador com conta de teste: obter JWT (POST /api/auth/login), setar `BEARER=Bearer <jwt>`, executar `node scripts/prova-prod-saldo-profile-readonly.js` (timeout ≥ 55 s) e registrar no relatório se `saldo` mudou entre T0, T0+10s e T0+40s. Se não mudar, reforça hipótese visual/cache.
2. **Reconciler:** Filtrar no reconcile apenas registros cujo identificador usado na API do MP seja **numérico** (id do MP), ou usar `payment_id` quando preenchido e numérico; ignorar ou tratar à parte `external_id` no formato `deposito_*` para não gerar ruído nos logs e não tentar GET no MP com id inválido.
3. **Dashboard/front:** Opcional: não cachear GET /api/user/profile (ou reduzir TTL) para evitar impressão de “saldo subiu ao recarregar” quando for apenas cache expirando.
4. **Não tocar em:** /game, UI do jogo, barra/versão. Nenhum deploy foi feito nesta auditoria.

---

*Prova READ-ONLY. Nenhum token, connection string ou dado sensível foi impresso no relatório.*
