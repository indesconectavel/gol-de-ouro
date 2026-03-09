# CHANGE — E2E: fallback flyctl sem --since

**Data:** 2026-03-05  
**Escopo:** somente `scripts/e2e-withdraw-ledger.js` e `docs/relatorios/README-E2E-WITHDRAW-LEDGER-AUTO.md`. Nenhuma alteração em backend, player, schema, worker ou deploy.

---

## Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `scripts/e2e-withdraw-ledger.js` | Helper `flyLogsWithFallback`, flag `flyctlSinceSupported`, relatório dinâmico (--since vs fallback) |
| `docs/relatorios/README-E2E-WITHDRAW-LEDGER-AUTO.md` | Nota sobre fallback automático quando flyctl não suporta `--since` |

---

## Descrição do problema

- O relatório E2E exibia: **"Error: unknown flag: --since"**.
- Ocorre quando a versão do flyctl no ambiente não reconhece a flag `--since`.
- O script chamava `flyctl logs ... --since 15m --no-tail`, quebrando a coleta de logs nesses ambientes.
- O E2E podia ficar INCONCLUSIVO por credenciais MISSING (esperado), mas o script precisava ao menos coletar logs sem falhar.

---

## Descrição do fallback implementado

1. **Helper `flyLogsWithFallback(machineId, label)`**
   - Tenta primeiro: `flyctl logs -a goldeouro-backend-v2 --machine <id> --no-tail --since 15m`.
   - Se o resultado não for ok e (stdout+stderr) contiver **"unknown flag: --since"** (case-insensitive):
     - Define a flag global `flyctlSinceSupported = false`.
     - Executa fallback: `flyctl logs -a goldeouro-backend-v2 --machine <id> --no-tail`.
   - Retorno: `{ outRaw, usedSince: true|false, fallbackReason?: string }`.
   - Na segunda máquina (worker), se `flyctlSinceSupported` já for false, usa direto o comando sem `--since`, evitando novo erro.

2. **Relatório (seção "## 7. Logs filtrados")**
   - Se `usedSince === true`: imprime **"Logs coletados com: --since 15m"**.
   - Se fallback foi acionado: imprime **"Logs coletados com: fallback (flyctl sem --since): --no-tail"** e **"Motivo fallback: unknown flag: --since"**.

3. **Comportamento mantido**
   - Não se grava o stdout bruto do flyctl no relatório; mantém-se filtro por keywords e últimas ~30 linhas filtradas.
   - Se flyctl não estiver instalado, o fluxo existente ("flyctl missing" na seção 4) permanece.

---

## Por que é seguro

- **Somente E2E:** alterações apenas no script de automação e no README da automação.
- **Não toca:** server-fly.js, src/**, database/**, goldeouro-player/**, workflows, fly.toml, Dockerfile.
- **Sem segredos:** BEARER/JWT e PIX_KEY completa não são impressos; relatórios e console continuam com BEARER=OK/MISSING e PIX_KEY=OK/MISSING.

---

## Como validar

1. Rodar **sem** definir BEARER/PIX_KEY:
   ```bash
   node scripts/e2e-withdraw-ledger.js
   ```
   ou:
   ```bash
   npm run test-withdraw-e2e
   ```
2. Verificar:
   - O relatório é gerado em `docs/relatorios/E2E-WITHDRAW-LEDGER-AUTO-<date>-<time>.md`.
   - Os blocos App/Worker **não** contêm a mensagem "unknown flag: --since".
   - Quando o flyctl não suporta `--since`, o relatório mostra "fallback (flyctl sem --since)" e "Motivo fallback: unknown flag: --since".
   - O veredito continua **INCONCLUSIVO (sem credenciais)** quando as envs não estão definidas.

Deploy não é necessário para este change.
