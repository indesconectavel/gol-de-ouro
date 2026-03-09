# Validação runtime — Ledger patch (user_id / usuario_id)

**Data:** 2026-03-04  
**Objetivo:** Guia read-only para confirmar no container (Fly) que o patch está presente após o deploy.  
**Commit do patch:** a4b2e5495d1919fe8383f247122c2e0803e3712d

---

## 1) Verificação dentro do container (SSH interativo)

Conectar na máquina **app** (process group `app`) da aplicação Fly, por exemplo:

```bash
flyctl ssh console -a goldeouro-backend-v2 -s <MACHINE_ID>
```

(Obter MACHINE_ID com `flyctl machines list -a goldeouro-backend-v2` — usar a máquina com PROCESS GROUP `app` e STATE `started`.)

### 1.1 Localizar o arquivo

```bash
find /app -name "processPendingWithdrawals.js"
```

Exemplo de resultado esperado: `/app/src/domain/payout/processPendingWithdrawals.js` (ou equivalente sob `/app`).

### 1.2 Provas no código em runtime

Substituir `<path>` pelo caminho obtido no passo anterior.

```bash
grep -n "ledgerUserIdColumn" <path>
grep -n "insertLedgerRow" <path>
grep -n "createLedgerEntry" <path>
```

**Esperado:**

- Pelo menos uma linha com `ledgerUserIdColumn` (ex.: `let ledgerUserIdColumn = null;`).
- Linhas com `insertLedgerRow` (definição da função e chamada dentro de createLedgerEntry).
- Linhas com `createLedgerEntry`.

Trecho sugerido (primeiras ~120 linhas):

```bash
sed -n '1,120p' <path>
```

Verificar manualmente: cache `ledgerUserIdColumn`, função `insertLedgerRow` (tentativa user_id, fallback usuario_id), e `createLedgerEntry` chamando `insertLedgerRow`.

---

## 2) Probe read-only de schema (sem information_schema)

Não imprimir SUPABASE_SERVICE_ROLE_KEY nem URL completa. Apenas flags e resultados por coluna.

- **SUPABASE_URL_PRESENT:** true/false  
- **SERVICE_ROLE_PRESENT:** true/false  
- Comprimentos (opcional): SUPABASE_URL_LEN, SERVICE_ROLE_LEN (não exibir o valor).

Probes (exemplo em Node no container ou ambiente com env de prod):

```js
// Exemplo de uso read-only (select limit 1)
const r1 = await supabase.from('ledger_financeiro').select('user_id').limit(1);
// r1.error => mensagem de erro (ex.: "column does not exist")
const r2 = await supabase.from('ledger_financeiro').select('usuario_id').limit(1);
```

Registrar apenas:

- **ledger_financeiro.user_id:** YES (sucesso) ou mensagem de erro (ex.: "column does not exist").  
- **ledger_financeiro.usuario_id:** YES ou mensagem de erro.

Referência de script no repo: `scripts/schema_probe_usuario_user_id.js` (adaptar para não logar keys; só flags e YES/erro por coluna).

---

## 3) Checklist final

| Item | Comando / ação | Resultado (preencher após execução) |
|------|----------------|-------------------------------------|
| Arquivo em runtime | `find /app -name "processPendingWithdrawals.js"` | path = _________ |
| ledgerUserIdColumn | `grep -n "ledgerUserIdColumn" <path>` | presente: SIM / NÃO |
| insertLedgerRow | `grep -n "insertLedgerRow" <path>` | presente: SIM / NÃO |
| createLedgerEntry → insertLedgerRow | Trecho sed/grep | presente: SIM / NÃO |
| Schema user_id | select user_id limit 1 | YES / erro |
| Schema usuario_id | select usuario_id limit 1 | YES / erro |

### PATCH PRESENT IN RUNTIME: YES / NO

- **Se YES:** Pronto para 1 teste E2E de saque (write controlado) em janela segura.  
- **Se NO:** Verificar se o deploy foi concluído e se a imagem/versão em execução é a do commit a4b2e54 (ou posterior com o patch).

---

*Documento de validação. Executar comandos manualmente (SSH/probe). Não expor tokens nem URLs completas.*
