# Confirmação: payout_worker rodando no Fly.io (READ-ONLY)

**Data:** 2026-03-07  
**Modo:** Somente leitura — sem execução de flyctl e sem acesso ao painel Fly.io.  
**Objetivo:** Confirmar se o payout_worker está rodando no ambiente Fly do Gol de Ouro.

---

## Limitação

**Não é possível nesta sessão:** executar `fly status`, `fly logs`, `fly scale show` ou acessar o painel Fly. A **quantidade de máquinas** e **logs recentes** só podem ser confirmadas com acesso ao Fly (CLI ou painel). Este relatório consolida o que o **repositório** permite afirmar e indica como obter a evidência ao vivo.

---

## 1. Process group payout_worker no fly.toml

**Verificado no repositório:** `fly.toml` (linhas 15–17)

```toml
[processes]
app = "npm start"
payout_worker = "node src/workers/payout-worker.js"
```

- O process group **payout_worker** está **definido**.
- Comando do processo: `node src/workers/payout-worker.js`.
- O serviço HTTP usa `processes = ["app"]`, portanto apenas o **app** recebe tráfego e health check; o **payout_worker** não expõe porta 8080 (intencional).

---

## 2. Existência de máquina ativa do payout_worker

**Não verificável em read-only.** É necessário executar no ambiente com acesso ao Fly:

```bash
fly status -a goldeouro-backend-v2
```

ou no painel: **Machines** → filtrar por process group **payout_worker** e ver quantas estão em estado **started**.

- **Saída esperada:** lista de máquinas; as do tipo **payout_worker** com estado **started** são as ativas.
- **Quantidade de máquinas do payout_worker:** só pode ser informada com base nessa saída (ou no painel). Nesta auditoria **não foi possível** obter esse número.

---

## 3. Logs recentes do worker

**Não verificável em read-only.** É necessário executar:

```bash
fly logs -a goldeouro-backend-v2
```

(ou, se disponível, filtrar por máquina do payout_worker). No painel: **Logs** → selecionar app e, se possível, o process group **payout_worker**.

- **Evidência de execução:** linhas como:
  - `🕒 [PAYOUT][WORKER] Ativo. Intervalo ...ms`
  - `🟦 [PAYOUT][WORKER] Início do ciclo`
  - `🟦 [PAYOUT][WORKER] Fim do ciclo`
  - `[PAYOUT][CYCLE] enabled=... db=... provider=...`
- Sem execução de `fly logs`, **não há evidência de execução** nesta auditoria.

---

## 4. Worker entra no loop runCycle()?

**Sim, pelo código.** Em `src/workers/payout-worker.js`:

- Se **ENABLE_PIX_PAYOUT_WORKER** não for `'true'`, o processo faz `process.exit(0)` (linhas 6–9) e **não** entra no loop.
- Se faltar Supabase ou **MERCADOPAGO_PAYOUT_ACCESS_TOKEN**, faz `process.exit(1)` (linhas 20–29) e **não** entra no loop.
- Caso contrário:
  - Linha 101: `runCycle()` é chamada **uma vez**.
  - Linha 104: `setInterval(runCycle, intervalMs)` agenda a repetição (default 30 s).
- Portanto, quando o processo **sobe** e **não** sai por env/token, ele **entra** no loop (uma execução imediata + ciclo a cada `PAYOUT_WORKER_INTERVAL_MS`). Se **PAYOUT_PIX_ENABLED** não for `'true'`, o ciclo roda mas `processPendingWithdrawals` retorna sem processar saques.

**Resumo:** O código está preparado para entrar em **runCycle()** em loop; isso só ocorre se houver máquina do payout_worker rodando e env corretas (ENABLE_PIX_PAYOUT_WORKER=true e demais obrigatórias).

---

## 5. Risco de saques ficarem presos

**Sim.** Saques podem ficar presos (pendentes ou “processando” sem conclusão) quando:

| Cenário | Risco |
|--------|--------|
| Nenhuma máquina do process group **payout_worker** (scale 0 ou grupo não escalado) | **Alto** — nenhum processo processa a fila. |
| **ENABLE_PIX_PAYOUT_WORKER** ≠ true | **Alto** — processo termina com exit(0) na subida. |
| **PAYOUT_PIX_ENABLED** ≠ true | **Alto** — processo roda mas não processa saques. |
| Token de payout ou Supabase ausentes | **Alto** — exit(1) na subida. |
| Única máquina worker cai (crash, OOM, redeploy) | **Médio** — atraso até nova subida; código permite reprocessar “processando”. |

---

## 6. Saída esperada (respostas objetivas)

| Item | Resposta |
|------|----------|
| **Worker ativo ou não?** | **Não confirmado** nesta auditoria. No repositório o worker está **configurado** (fly.toml + payout-worker.js). Status **ativo** depende de: pelo menos 1 máquina do process group **payout_worker** em **started** e env que permitam o processo subir e processar (ENABLE_PIX_PAYOUT_WORKER=true, PAYOUT_PIX_ENABLED=true, etc.). |
| **Quantidade de máquinas do payout_worker** | **Não obtida.** Requer `fly status -a goldeouro-backend-v2` (ou painel Fly → Machines) para contar máquinas com process group **payout_worker** e estado **started**. |
| **Evidência de execução** | **Não obtida.** Requer `fly logs -a goldeouro-backend-v2` (ou painel) para ver linhas como "Início do ciclo" / "Fim do ciclo" e "[PAYOUT][CYCLE] enabled=...". |
| **Conclusão operacional** | Pelo **código/repo**: o payout_worker está definido e, ao subir com env corretas, entra no loop **runCycle()**. **Operacionalmente**: não foi possível confirmar se há máquina ativa nem logs recentes; recomenda-se executar os comandos acima (ou conferir no painel) para concluir se o worker está **rodando** no Fly.io. |

---

*Relatório gerado em modo READ-ONLY. Nenhum comando flyctl foi executado; nenhum dado ao vivo do Fly.io foi acessado.*
