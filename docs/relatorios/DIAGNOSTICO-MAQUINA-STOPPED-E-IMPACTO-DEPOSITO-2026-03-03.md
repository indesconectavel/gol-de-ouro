# Diagnóstico máquina stopped e impacto no depósito (2026-03-03)

**Modo:** READ-ONLY (nenhuma alteração de código, deploy, secrets ou restart).

---

## PASSO 0 — Snapshot

**Comandos executados:**

```text
flyctl status -a goldeouro-backend-v2
flyctl machines list -a goldeouro-backend-v2
flyctl releases -a goldeouro-backend-v2
```

**Resultado resumido:**

| Item | Valor |
|------|--------|
| App | goldeouro-backend-v2, hostname goldeouro-backend-v2.fly.dev |
| Imagem | goldeouro-backend-v2:deployment-01KJT40SH9FD11MABFHT8A7ZNH |
| **App healthy** | `2874551a105768` (withered-cherry-5478), 1/1 passing, started |
| **App stopped** | `e82d445ae76178` (dry-sea-3466), 0/1, stopped, 1 warning |
| Payout worker | `e82794da791108` (weathered-dream-1146), started |
| Releases | v308, v307, v306 = failed; v305 = complete (Feb 25 2026) |

---

## PASSO 1 — Causa raiz da máquina stopped (evidência em log)

**Comando:** `flyctl logs -a goldeouro-backend-v2 --machine e82d445ae76178 --no-tail`

**Trechos relevantes (ordem cronológica):**

1. **Erro no startup (repetido em cada tentativa):**

```text
/app/config/env.js:60
  throw new Error('ADMIN_TOKEN deve ter pelo menos 16 caracteres');
  ^
Error: ADMIN_TOKEN deve ter pelo menos 16 caracteres
    at Object.<anonymous> (/app/config/env.js:60:9)
    at Module._compile (node:internal/modules/cjs/loader:1521:14)
    ...
    at Object.<anonymous> (/app/middlewares/authMiddleware.js:2:13)
```

2. **Processo encerra e a plataforma reinicia a máquina:**

```text
INFO Main child exited normally with code: 1
INFO Starting clean up.
reboot: Restarting system
```

3. **Após múltiplos ciclos (restart), Fly interrompe novas tentativas:**

```text
machine has reached its max restart count of 10
```

4. **Estado final da máquina (após update posterior):**

```text
machine was in a non-started state prior to the update so leaving the new version stopped
```

**Conclusão (causa raiz):**  
A máquina **e82d445ae76178** fica **stopped** porque, ao subir, o processo Node carrega `middlewares/authMiddleware.js`, que por sua vez carrega `config/env.js`. Em `config/env.js` (linha 60) há uma validação que **lança exceção** se `ADMIN_TOKEN` tiver menos de 16 caracteres. Nessa máquina, no momento do boot, `ADMIN_TOKEN` está **ausente ou com menos de 16 caracteres**, o que causa o throw, saída com código 1, restart pelo Fly e, após **10 restarts**, a parada definitiva da máquina (“max restart count of 10”).

**Evidência em código (referência):**  
`config/env.js` linhas 59–61:

```javascript
if (env.ADMIN_TOKEN.length < 16) {
  throw new Error('ADMIN_TOKEN deve ter pelo menos 16 caracteres');
}
```

---

## PASSO 2 — Reconciler de depósitos no app healthy (evidência por código)

O processo **app** que sobe em cada máquina executa `server-fly.js`. No repositório (mesmo código que está na imagem do container), o reconciler de depósitos PIX está definido e **agendado** da seguinte forma.

**Função do reconciler:**  
`server-fly.js`, a partir da linha **2344**:

```javascript
async function reconcilePendingPayments() {
  if (reconciling) return;
  if (!dbConnected || !supabase || !mercadoPagoConnected) return;
  // ...
  const { data: pendings, error: listError } = await supabase
    .from('pagamentos_pix')
    .select('id, usuario_id, external_id, payment_id, status, amount, valor, created_at')
    .in('status', ['pending', 'pendente'])
    .lt('created_at', sinceIso)
    // ...
}
```

**Agendamento (setInterval):**  
`server-fly.js`, linhas **2441–2446**:

```javascript
// Agendar reconciliação (habilitado por padrão)
if (process.env.MP_RECONCILE_ENABLED !== 'false') {
  const intervalMs = parseInt(process.env.MP_RECONCILE_INTERVAL_MS || '60000', 10);
  setInterval(reconcilePendingPayments, Math.max(30000, intervalMs));
  console.log(`🕒 [RECON] Reconciliação de PIX pendentes ativa a cada ${Math.round(intervalMs / 1000)}s`);
}
```

**Conclusão:**  
Na máquina app **healthy** (`2874551a105768`), que está em execução com o mesmo `server-fly.js`, o reconciler de depósitos **está agendado**: desde que `MP_RECONCILE_ENABLED` não seja `'false'`, `reconcilePendingPayments` é chamado em intervalo fixo (default 60 s, mínimo 30 s). Ou seja, o **scheduler do reconciler está presente e ativo** no processo app healthy; a execução efetiva em cada ciclo depende de DB, Supabase, token de depósito e de haver registros pendentes elegíveis.

---

## PASSO 3 — Conclusão e risco operacional

**Causa raiz da máquina stopped:**  
- **ADMIN_TOKEN** ausente ou com menos de 16 caracteres no ambiente da máquina **e82d445ae76178** no momento do boot.  
- Validação em `config/env.js:60` → throw → exit(1) → restart pelo Fly → após 10 restarts a máquina é deixada **stopped**.

**Risco operacional (single app):**  
- Com apenas **uma** máquina app em estado **started** e **passing** (2874551a105768), o tráfego HTTP e o reconciler de depósitos dependem exclusivamente dela.  
- Se essa máquina falhar ou for parada, não há outra instância app para receber requisições nem para rodar o `setInterval` do reconciler (webhook continua dependendo de alguma app receber o POST do MP).  
- Ou seja: há **risco operacional de single point of failure** enquanto a segunda app (e82d445ae76178) permanecer stopped.

**Reconciler no app healthy:**  
- **Está agendado** no código que roda na app healthy: `setInterval(reconcilePendingPayments, ...)` em `server-fly.js` (linhas 2443–2446), condicionado a `MP_RECONCILE_ENABLED !== 'false'`.  
- Evidência é por inspeção do mesmo `server-fly.js` que está na imagem do container (repositório local = código deployado).

---

**Declaração final:** Nenhuma alteração de código, deploy, secrets ou restart foi feita. Apenas coleta de snapshot (status, machines, releases), leitura de logs da máquina e82d445ae76178 e inspeção do código em `config/env.js`, `middlewares/authMiddleware.js` e `server-fly.js` para elaboração deste relatório.
