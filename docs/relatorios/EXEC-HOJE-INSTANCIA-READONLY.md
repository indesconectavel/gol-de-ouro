# Execução de hoje — Auditoria READ-ONLY de instância única

**Data:** 2026-03-27  
**Modo:** apenas leitura de repositório e artefatos documentados — **nenhum** comando `flyctl` executado nesta sessão, **nenhuma** alteração de deploy ou variáveis.

---

## 1. Resumo executivo

O **backend oficial** no repositório é o app **Fly.io** `goldeouro-backend-v2` (`fly.toml`). O **Dockerfile** do projeto sobe um único processo: `node server-fly.js` (porta 8080).

**Estado “hoje” (ao vivo):** **não é verificável** apenas pelo Git — exige `flyctl status` / `flyctl machines list` / `flyctl scale show` com credenciais.

**Evidência histórica no repo** (`docs/relatorios/financeiro-v1-preflight-fly.json`, captura **2026-03-06**): o grupo de processo **`app`** estava configurado com **COUNT = 2** na saída de `scale_show`, havendo **1** máquina `app` **started**, **1** máquina `app` **stopped** e **1** máquina **`payout_worker` started**. Isso indica **risco estrutural**: escala do grupo `app` prevista para **2** VMs na região — compatível com **segunda instância `app`** voltar a subir ou receber tráfego em cenários de deploy/carga, **incompatível** com a exigência estrita de **um único processo HTTP** para `lotesAtivos` / idempotência em RAM.

**Conclusão operacional:** **não** dá para afirmar só pelo repo que o ambiente está “seguro para 1 instância” **agora**; é **necessária** confirmação ao vivo. Se o `scale` do grupo `app` continuar **> 1**, a **cirurgia operacional** (ajuste de escala) **ainda é necessária** antes de tratar o piloto como aderente ao desenho de memória única.

---

## 2. Serviço/backend alvo

| Fonte | Conteúdo |
|-------|----------|
| `fly.toml` | `app = "goldeouro-backend-v2"`, `primary_region = "gru"`, serviço HTTP/TLS nas portas 80/443 → `internal_port = 8080`, health em `GET /health`. |
| `Dockerfile` (raiz) | `CMD ["node", "server-fly.js"]`. |
| `package.json` | `"start": "node server-fly.js"`, `"main": "server-fly.js"`. |
| Documentação interna | URLs e comandos recorrentes para `-a goldeouro-backend-v2`; hostname documentado: `goldeouro-backend-v2.fly.dev`. |

**Frontend (Vercel)** é separado (`goldeouro-player`); **não** substitui o backend Fly para API de jogo/financeiro.

**Processo `payout_worker`:** aparece em snapshots como **grupo separado** (1 máquina). O risco para **lotes/shoot** é sobretudo **múltiplas máquinas no grupo que recebe tráfego HTTP do serviço** (`app`). O worker deve ser avaliado junto na lista de máquinas (não misturar com “apenas contar containers” sem ver **process group**).

---

## 3. Estado atual de instâncias

| Pergunta | Resposta |
|----------|----------|
| Quantas instâncias estão rodando **hoje**, neste exato momento? | **Indeterminado** nesta auditoria (sem `flyctl` ao vivo). |
| O que o repositório prova? | Snapshot **2026-03-06**: **3** máquinas no app; **1** `app` + **1** `app` stopped + **1** `payout_worker` started; `scale_show` indicava **COUNT 2** para o grupo **`app`**. |

Qualquer número “atual” exige comando na conta Fly do projeto.

---

## 4. Autoscale / comportamento de máquinas

- **`fly.toml` commitado:** não define bloco explícito de `[scale]` / `min_machines` / `max_machines` neste arquivo (arquivo com ~41 linhas, termina nos `http_checks`).
- **Concorrência do serviço:** `services.concurrency` com `soft_limit` / `hard_limit` — em apps com **várias** máquinas no grupo `app`, o balanceamento pode distribuir requisições entre elas (comportamento indesejado para estado em memória do jogo).
- **Fly Machines / grupos:** documentação interna (`FINANCEIRO-ROLLBACK-PLAN-READONLY-2026-03-05`) já descreveu escala **app count = 2** (uma started, uma stopped) como exemplo — reforça que **a plataforma** pode manter capacidade para mais de uma VM `app`.

**Auto start/stop:** não há evidência fixada no `fly.toml` desta pasta sobre política de dormir máquinas; isso é **configuração da conta/app** no Fly — **confirmar** no painel ou via `flyctl machines list` / documentação Fly para o app.

---

## 5. Risco atual para o Gol de Ouro

| Área | Risco se houver 2+ máquinas `app` recebendo HTTP |
|------|--------------------------------------------------|
| **Lotes em memória** (`lotesAtivos`, etc.) | Partições de estado entre processos; comportamento inconsistente. |
| **Idempotência do shoot** (estruturas em RAM por processo) | Duplicidade ou falhas de deduplicação entre instâncias. |
| **Testes financeiros de hoje** | PIX/saque em Supabase podem até ser coerentes por DB; **jogo** e **shoot** podem falhar ou divergir se o tráfego alternar entre nós. |

**Segurança:** o requisito “**1 instância**” para o backend **de jogo** significa, na prática, **uma máquina no grupo `app` em execução e escala configurada para não subir segunda VM `app`** (salvo decisão explícita de aceitar risco).

---

## 6. Ação mínima necessária

1. **Confirmar** com Fly (CLI ou dashboard) o **número de máquinas `app` started** e o **`scale count`** do grupo `app`.  
2. Se **mais de uma** máquina `app` puder atender tráfego, ou se o **count** do grupo `app` for **> 1**, **reduzir** para **1** máquina no grupo `app` **antes** de considerar o piloto alinhado ao modelo de memória única.  
3. **Registrar** evidência (screenshot ou saída de comando) no runbook do dia.  
4. **Não** confundir “3 máquinas no app” com “3 instâncias do servidor HTTP”: separar por **`PROCESS GROUP`**.

---

## 7. Comando ou passo exato recomendado

**Somente leitura / auditoria (sem alterar nada):**

```bash
flyctl status -a goldeouro-backend-v2
flyctl machines list -a goldeouro-backend-v2
flyctl scale show -a goldeouro-backend-v2
```

**Ajuste mínimo de escala** (citado em documentação interna do repositório; executar **somente** após decisão explícita e fora do escopo desta auditoria READ-ONLY):

```bash
flyctl scale count 1 -a goldeouro-backend-v2
```

**Observação:** em apps Fly com **vários process groups** (`app` + `payout_worker`), validar na documentação Fly atual se o comando atinge só o grupo desejado ou se é necessário qualificador de processo (ex.: grupo `app`). Em caso de dúvida, usar o **dashboard** Fly → **Machines** / **Scale** para o grupo **`app`** e fixar **1** máquina.

**Health após qualquer mudança:** `GET https://goldeouro-backend-v2.fly.dev/health` (conforme docs internas).

---

## 8. Conclusão

| Pergunta | Resposta |
|----------|----------|
| Podemos seguir para os testes assumindo **1 instância** já garantida? | **Não** com base **apenas** no repositório — falta **confirmação ao vivo** do Fly. |
| O repo indica risco de **>1** VM no grupo `app`? | **Sim** (snapshot **2026-03-06** com **COUNT 2** para `app`). |
| Ainda precisa da “cirurgia operacional” de escala? | **Provavelmente sim**, até que `scale show` / lista de máquinas mostre **uma** instância `app` atendendo e escala **1** para esse grupo — **confirmar** com CLI/painel. |

**Próxima etapa imediata:** operador executar os comandos de **leitura** da secção 7 e decidir **GO/NO-GO** para testes com memória única conforme resultado.

---

*Auditoria READ-ONLY — nenhum deploy alterado, nenhum código alterado.*
