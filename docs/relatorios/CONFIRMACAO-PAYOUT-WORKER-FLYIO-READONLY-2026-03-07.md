# Confirmação payout_worker operacional no Fly.io (READ-ONLY)

**Data:** 2026-03-07  
**Modo:** Somente leitura — sem execução de flyctl, sem acesso ao painel Fly.io ou API.  
**Objetivo:** Confirmar se o payout_worker está operacional no ambiente Fly do Gol de Ouro.

---

## Limitação do modo READ-ONLY

**Não é possível nesta sessão:**

- Executar `fly status`, `fly scale show`, `fly logs`, `fly secrets list` ou qualquer comando flyctl.
- Acessar o painel Fly.io para ver máquinas, process groups, env e logs.
- Consultar em tempo real se há instâncias do payout_worker rodando ou se as variáveis ENABLE_PIX_PAYOUT_WORKER e PAYOUT_PIX_ENABLED estão definidas.

A confirmação **operacional** (worker ativo, escalado, env habilitando, logs recentes) exige que alguém com acesso ao Fly execute os passos abaixo ou use o painel. Este documento consolida a **configuração no repositório**, o **comportamento esperado do código** e os **comandos/verificações** necessários para concluir se o worker está ativo.

---

## 1. Process group payout_worker no Fly

### 1.1 Configuração no repositório (fly.toml)

```toml
[processes]
app = "npm start"
payout_worker = "node src/workers/payout-worker.js"
```

- O process group **payout_worker** está **definido** no repositório.
- O serviço HTTP (`[[services]]`) usa `processes = ["app"]`, portanto apenas o **app** recebe tráfego e health check na porta 8080; o **payout_worker** não expõe HTTP (comportamento intencional).

### 1.2 O que é necessário verificar ao vivo

| Tarefa | Comando / ação | Objetivo |
|--------|----------------|----------|
| Process group escalado? | `fly scale show -a goldeouro-backend-v2` ou painel Fly → Metrics / Scale | Ver se existe count > 0 para o process group **payout_worker**. |
| Pelo menos uma máquina do worker? | `fly status -a goldeouro-backend-v2` ou painel → Machines | Listar máquinas com process group **payout_worker** e estado **started**. |

**Evidência em relatórios anteriores (não em tempo real):** Em auditorias de 2026-03-03 e 2026-03-04 consta 1 máquina **payout_worker** (ID e82794da791108) com estado **started**. Isso não garante o estado atual; apenas que em datas passadas o worker estava configurado e uma máquina existia.

---

## 2. Variáveis que habilitam o processamento

### 2.1 Uso no código (src/workers/payout-worker.js)

| Variável | Onde | Efeito |
|----------|------|--------|
| **ENABLE_PIX_PAYOUT_WORKER** | Linhas 6–9 | Se não for `'true'` (case-insensitive), o processo faz **process.exit(0)** na subida e **não entra no loop**. |
| **PAYOUT_PIX_ENABLED** | Linha 60 (dentro de cada ciclo) | Lido a cada `runCycle`, repassado para `processPendingWithdrawals`. Se não for `'true'`, o worker **continua em loop** mas **não processa saques** (retorno `disabled: true`). |

Ou seja: para o worker **subir e permanecer rodando** é obrigatório **ENABLE_PIX_PAYOUT_WORKER=true**. Para **efetivamente processar** saques pendentes é obrigatório **PAYOUT_PIX_ENABLED=true**.

### 2.2 O que é necessário verificar ao vivo

| Tarefa | Comando / ação | Objetivo |
|--------|----------------|----------|
| ENABLE_PIX_PAYOUT_WORKER | `fly secrets list -a goldeouro-backend-v2` **não** mostra valores; variáveis de ambiente (não secrets) podem estar no painel ou em `fly.toml` [env]. Ou execução controlada: `fly ssh console -a goldeouro-backend-v2` em máquina **payout_worker** e `echo $ENABLE_PIX_PAYOUT_WORKER` (sem expor em relatório). | Confirmar se está definido e igual a `true`. |
| PAYOUT_PIX_ENABLED | Idem para env; ou observação indireta: se os logs do worker mostram ciclos que processam saques ou "Nenhum saque pendente", é plausível que PAYOUT_PIX_ENABLED seja true (caso contrário os ciclos retornariam sem processar). | Confirmar se está definido e igual a `true`. |

Em modo read-only **não** é possível ler env ou secrets do app; apenas documentar que a operacionalidade depende dessas duas variáveis.

---

## 3. Logs recentes do worker

### 3.1 Padrões de log do código

- Ao iniciar (se env ok): `🕒 [PAYOUT][WORKER] Ativo. Intervalo {intervalMs}ms`
- Por ciclo: `🟦 [PAYOUT][WORKER] Início do ciclo` e `🟦 [PAYOUT][WORKER] Fim do ciclo`
- Se não processou: `ℹ️ [PAYOUT][WORKER] Nenhum saque processado neste ciclo`
- Se processou: `✅ [PAYOUT][WORKER] Ciclo concluído com sucesso` ou `✅ [PAYOUT][WORKER] Saque concluído`
- Por ciclo também: `[PAYOUT][CYCLE] enabled=... db=... provider=...` (enabled = PAYOUT_PIX_ENABLED)

### 3.2 O que é necessário verificar ao vivo

| Tarefa | Comando / ação | Objetivo |
|--------|----------------|----------|
| Logs recentes do worker | `fly logs -a goldeouro-backend-v2` (filtrar por máquina do payout_worker se necessário) ou painel Fly → Logs, selecionar process group **payout_worker** | Ver se há "Início do ciclo" / "Fim do ciclo" em intervalos ~30 s e se `enabled=true` em `[PAYOUT][CYCLE]`. |

Em relatórios antigos (ex.: HOTFIX-LEDGER-USERID-FALLBACK-POSTDEPLOY-OBS-2026-03-04) os logs do payout_worker mostravam ciclos completos sem erros de ledger. Isso não atesta o estado **atual** dos logs.

---

## 4. Risco real de saques ficarem presos

### 4.1 Quando os saques ficam presos

- **Worker não sobe:** `ENABLE_PIX_PAYOUT_WORKER` não é `true` → processo termina com exit(0); nenhuma instância entra em loop.
- **Worker sobe mas não processa:** `PAYOUT_PIX_ENABLED` não é `true` → ciclos rodam mas `processPendingWithdrawals` retorna sem processar; saques em pendente/pending nunca saem da fila.
- **Nenhuma máquina do process group payout_worker:** scale 0 ou process group não escalado → não há processo rodando o worker.
- **Worker cai (crash, OOM, redeploy):** saques já em "processando" podem ficar presos até nova máquina/subida e próximo ciclo (o código permite reprocessar "processando").
- **Falha de rollback após falha de payout:** `rollback_failed=true` → saque pode permanecer em "processando" até intervenção manual.

### 4.2 Risco operacional resumido

| Cenário | Risco |
|---------|--------|
| Process group payout_worker com 0 máquinas | **Alto** — saques pendentes não são processados. |
| ENABLE_PIX_PAYOUT_WORKER ≠ true | **Alto** — worker não sobe. |
| PAYOUT_PIX_ENABLED ≠ true | **Alto** — worker sobe mas não processa. |
| Uma única máquina worker; ela cai | **Médio** — saques voltam a ser processados quando a máquina/subida voltar; pode haver atraso. |
| MERCADOPAGO_PAYOUT_ACCESS_TOKEN ou Supabase ausentes | **Alto** — worker faz exit(1) na subida. |

**Conclusão:** Existe **risco real** de saques ficarem presos se o payout_worker não estiver ativo (não escalado, env desabilitando ou processo saindo por falta de token/Supabase). A confirmação de que o worker **está** ativo depende de evidência ao vivo (status, scale, logs).

---

## 5. Saída esperada (respostas objetivas)

### Worker ativo ou não?

- **Pelo repositório:** O worker está **configurado** (fly.toml, payout-worker.js) e o código está preparado para entrar em loop e processar saques quando as env e o scale estiverem corretos.
- **Operacionalmente (ao vivo):** **Não é possível afirmar** em modo read-only. É necessário executar, por exemplo:
  - `fly status -a goldeouro-backend-v2` e verificar se existe pelo menos uma máquina com process group **payout_worker** em estado **started**.
  - `fly logs -a goldeouro-backend-v2` (ou por máquina do worker) e verificar logs recentes com "Início do ciclo" / "Fim do ciclo" e `enabled=true` em `[PAYOUT][CYCLE]`.

### Risco operacional

- **Alto** se: scale do payout_worker = 0, ou ENABLE_PIX_PAYOUT_WORKER não for true, ou PAYOUT_PIX_ENABLED não for true, ou faltar token/Supabase no worker — saques podem ficar presos.
- **Médio** se: há apenas uma máquina worker e ela cair (atraso até nova subida).
- **Mitigado** se: há pelo menos uma máquina payout_worker started e as env acima estiverem corretas e os logs mostrarem ciclos normais.

### Conclusão objetiva

1. **Configuração (código/fly.toml):** O payout_worker está definido e implementado; a aplicação em produção **pode** tê-lo ativo desde que o Fly tenha o process group escalado e as variáveis ENABLE_PIX_PAYOUT_WORKER e PAYOUT_PIX_ENABLED definidas como `true` (e demais dependências atendidas).
2. **Operacionalidade (estado atual):** **Não confirmada** nesta auditoria read-only. Recomenda-se que alguém com acesso ao Fly execute:
   - `fly status -a goldeouro-backend-v2`
   - `fly scale show -a goldeouro-backend-v2`
   - `fly logs -a goldeouro-backend-v2` (e filtrar por payout_worker)
   e confira no painel se as env do app (ou do process group) incluem ENABLE_PIX_PAYOUT_WORKER e PAYOUT_PIX_ENABLED = true.
3. **Risco de saques presos:** Existe risco **real** sempre que o worker não estiver ativo ou não estiver habilitado a processar (env false). A confirmação de que o worker está ativo e habilitado reduz esse risco.

---

*Relatório gerado em modo READ-ONLY. Nenhum comando flyctl foi executado; nenhum dado ao vivo do Fly.io foi acessado.*
