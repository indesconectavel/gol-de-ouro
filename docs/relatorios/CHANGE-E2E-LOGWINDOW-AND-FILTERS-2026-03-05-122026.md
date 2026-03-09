# CHANGE — E2E: janela de logs e filtros (apenas E2E alterado)

**Data:** 2026-03-05  
**Escopo:** somente `scripts/e2e-withdraw-ledger.js` e `docs/relatorios/README-E2E-WITHDRAW-LEDGER-AUTO.md`.  
**Pré-check:** apenas E2E alterado; nenhum arquivo de backend, player, schema ou migrations foi editado.

---

## Arquivos alterados (esperado: 2)

| Arquivo | Alteração |
|---------|-----------|
| `scripts/e2e-withdraw-ledger.js` | Janela `--since 15m`, keywords/contagens, heurística FAIL |
| `docs/relatorios/README-E2E-WITHDRAW-LEDGER-AUTO.md` | Texto sobre `--since 15m` e "Erro ao registrar ledger" |

**diff --stat:** Os arquivos estavam untracked no momento do change; ao fazer commit, use `git diff --stat HEAD -- scripts/e2e-withdraw-ledger.js docs/relatorios/README-E2E-WITHDRAW-LEDGER-AUTO.md` para conferir.

---

## Descrição objetiva das 3 mudanças

### 1) Janela de logs ampliada

- **Onde:** chamadas `flyctl logs` em `scripts/e2e-withdraw-ledger.js` (app + payout_worker).
- **Antes:** `flyctl logs -a goldeouro-backend-v2 --machine <id> --no-tail`
- **Depois:** `flyctl logs -a goldeouro-backend-v2 --machine <id> --since 15m --no-tail`
- **Regras:** `--no-tail` mantido; dois logs (app e payout_worker) mantidos; se flyctl falhar, o relatório continua registrando "flyctl missing".
- **Relatório:** adicionada linha explícita no relatório gerado: *"Logs coletados com: --since 15m (janela ampliada)."*

### 2) Filtros e contagens (frases reais do backend)

- **Keywords (filtro de linhas):** mantidos `[SAQUE]`, `[LEDGER]`, `airbag`, `correlation`, `uuid`, `22P02`, `rollback`, `constraint`, `error` e adicionados: `Erro ao registrar ledger`, `insert falhou (airbag)`, `insert falhou`, `ledger`.
- **Contagens no relatório:**
  - Mantidas: `"invalid input syntax for type uuid"`, `"22P02"`.
  - Incluídas: `"Erro ao registrar ledger"`, `"[LEDGER] insert falhou"`, `"insert falhou (airbag)"`.
  - Opcionais (incluídas): `"rollbackWithdraw"`, `"falha_payout"`.
- Removida a contagem de `"Erro ao registrar saque"` (mensagem do player; nos logs do backend aparece "Erro ao registrar ledger").

### 3) Heurística FAIL mais inteligente

- **FAIL** se:
  - `22P02` ou uuid inválido > 0, **ou**
  - `"Erro ao registrar ledger"` > 0, **ou**
  - `"[LEDGER] insert falhou"` > 0 (ou `"insert falhou (airbag)"`), **ou**
  - `success === false` com `statusCode === 500`.
- **PASS** se: `saqueId` existe, `success === true` e contagens de erro (22P02, uuid, ledger) == 0.
- **INCONCLUSIVO** se: faltam credenciais (BEARER/PIX_KEY) ou não houve chamada.

---

## Por que isso não toca no jogo/player/backend

- Nenhuma alteração em `server-fly.js`, domínio, worker, player, schema ou migrations.
- Apenas o script de automação E2E e o README da automação foram modificados.
- Deploy e commit fora desse escopo não foram executados.

---

## Pós-change (opcional)

Após este change, rode novamente o E2E para ver se o relatório passa a capturar a causa do 500:

```bash
npm run test-withdraw-e2e
```

Se o backend continuar retornando 500 "Erro ao registrar saque" (e nos logs do Fly aparecer "Erro ao registrar ledger"), o novo relatório deve exibir as contagens de "Erro ao registrar ledger" e "[LEDGER] insert falhou" e marcar FAIL com justificativa clara.
