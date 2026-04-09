# ENCERRAMENTO OFICIAL — CORE TRANSACIONAL

**Data:** 2026-04-09  
**Classificação:** **ENCERRADO COM RESSALVAS**

---

## 1. Resumo executivo

O repositório foi consolidado num **commit único** com a função SQL `shoot_apply` (assinatura final de três parâmetros, lote transacional), o backend **`server-fly.js`** alinhado à RPC, relatórios de cirurgia/validação das fases 2.1, 2.2A e 2.2B, e foi criada a **tag anotada** `core-transacional-aprovado-2026-04-09`. **Push** da branch `snapshot/v1-estavel-2026-04-09` e da tag para `origin` concluídos com sucesso.

Nesta sessão **não foi possível** consultar o catálogo do PostgreSQL em produção nem invocar a API pública com JWT para smoke tests automatizados. A confirmação do banco baseia-se em **evidência operacional prévia** (execução bem-sucedida do script no SQL Editor do Supabase `goldeouro-production`, referida na validação 2.2B). O **deploy Fly.io** em execução neste momento **não foi verificado** contra o SHA `8be0376…` (ausência de chamada à API de deploy ou healthcheck autenticado neste ambiente).

---

## 2. Fases incluídas no encerramento

| Fase | Conteúdo registado no encerramento |
|------|--------------------------------------|
| **Fase 1** | Regra de saldo no shoot: pré-check no Node + validação transacional em `shoot_apply` (`SHOOT_APPLY_SALDO_INSUFICIENTE`); comportamento incorporado no fluxo final versionado. |
| **Fase 2.1** | Atomicidade `INSERT chutes` + `UPDATE usuarios.saldo` na mesma função (evoluída nas fases seguintes). |
| **Fase 2.2A** | Contador global e `metricas_globais` atualizados dentro de `shoot_apply`. |
| **Fase 2.2B** | Lote obtido/criado na transação, `indice_vencedor` persistido, resposta JSON com `lote_id`, progresso e fechamento; remoção de lote/`winnerIndex` em RAM no `server-fly.js`. |

Artefactos em repositório: `database/shoot_apply_atomic_transaction.sql`, `server-fly.js`, relatórios `CIRURGIA-*` e `VALIDACAO-*` das fases 2.x acima.

---

## 3. Commit final

| Campo | Valor |
|--------|--------|
| **Mensagem** | `core-transacional-finalizado-fase1-2-2a-2b-2026-04-09` |
| **SHA** | `8be0376d6fc6ae11d6b011a89fe27eb170b5a696` |
| **Branch** | `snapshot/v1-estavel-2026-04-09` |
| **Ficheiros (8)** | `server-fly.js` (modificado); `database/shoot_apply_atomic_transaction.sql` (novo); 6× `docs/relatorios/*.md` (CIRURGIA/VALIDACAO Fase 2.1, 2.2A, 2.2B). |

**Documentação de encerramento:** commit subsequente `37aada67dde928887d885baa33b4d9ed21c872a3` — apenas `docs/relatorios/ENCERRAMENTO-OFICIAL-CORE-TRANSACIONAL-2026-04-09.md` (HEAD da branch após push completo).

---

## 4. Tag final

| Campo | Valor |
|--------|--------|
| **Nome** | `core-transacional-aprovado-2026-04-09` |
| **Tipo** | Tag anotada (`-a`) |
| **Aponta para** | `8be0376d6fc6ae11d6b011a89fe27eb170b5a696` |

---

## 5. Confirmação de banco em produção

| Verificação | Estado nesta execução |
|-------------|----------------------|
| `public.shoot_apply(uuid, text, numeric)` aplicada | **Indiretamente confirmado:** evidência anterior de execução com sucesso no SQL Editor (projeto `goldeouro-production`). **Não revalidado** aqui via `pg_proc` / PostgREST. |
| Sobrecargas antigas removidas | O script versionado contém `DROP FUNCTION` das assinaturas antigas; **catálogo em produção não inspecionado** nesta sessão. |
| Índice `idx_lotes_um_ativo_por_valor` | No ficheiro SQL do repo a criação está **comentada** (recomendação). Se foi executada manualmente em produção (como em colagens anteriores), **pendente confirmar** com: `SELECT indexname FROM pg_indexes WHERE tablename = 'lotes' AND indexname = 'idx_lotes_um_ativo_por_valor';` |

**Pendente explícito:** confirmação objetiva no catálogo de produção (assinatura única da função + existência ou ausência do índice).

---

## 6. Confirmação de backend em produção

| Evidência no repositório | Valor |
|--------------------------|--------|
| `Dockerfile` | `CMD ["node", "server-fly.js"]` |
| `package.json` → `start` | `node server-fly.js` |
| `fly.toml` | `app` process usa `npm start` → mesmo entrypoint |

**Estado:** O **código que deve correr** em produção (imagem derivada deste repo) aponta para `server-fly.js`. **Não foi possível** confirmar que a aplicação deployada na Fly (ou outro host) está na imagem/build do commit `8be0376…` (sem acesso a releases, digest ou healthcheck com versão exposta).

**Risco residual:** `server-fly-deploy.js` mantém lote em memória; **não** deve ser entrypoint de produção — alinhar pipelines ao `server-fly.js`.

---

## 7. Smoke tests executados

**Não executados nesta sessão** (sem URL base + JWT de teste ou instância local levantada com Supabase).

### Passo a passo mínimo (manual)

1. **MISS com saldo suficiente**  
   `POST /api/games/shoot` com `Authorization: Bearer <token>`, body `{ "direction": "C", "amount": 1 }` (ou outro valor válido).  
   **Observar:** `success: true`, `data.result === "miss"`, `data.novoSaldo === saldo_anterior - amount` (± prémio 0), linha nova em `chutes` com mesmo `lote_id` que a RPC devolve.

2. **GOAL com saldo suficiente**  
   Repetir até ocorrer `result === "goal"` ou usar conta/fixture conhecida.  
   **Observar:** `premio` 5 (e `premioGolDeOuro` 100 se múltiplo de 1000 no contador global), `data.isLoteComplete` conforme regra, saldo coerente.

3. **Saldo insuficiente**  
   Forçar saldo &lt; `amount` ou usar valor acima do saldo.  
   **Observar:** `400` com mensagem de saldo; **sem** nova linha em `chutes`; saldo inalterado.

4. **Dois chutes seguidos no mesmo valor**  
   Dois `POST` consecutivos com o mesmo `amount`.  
   **Observar:** mesmo `loteId` enquanto o lote não fechar; `loteProgress.current` incrementa; após fecho, próximo chute tende a **novo** `loteId`.

---

## 8. Riscos remanescentes

- **Deploy não verificado** contra o SHA do encerramento.  
- **Catálogo de produção** (função + índice) não lido nesta execução.  
- **Smoke tests** não corridos aqui.  
- **`server-fly-deploy.js`** desalinhado com a RPC nova, se usado por engano.  
- **Dependência:** ordem correta histórica — SQL antes do backend com três parâmetros.

---

## 9. Diagnóstico final

O **núcleo transacional está oficialmente versionado, etiquetado e enviado ao remoto** no commit e tag indicados. O encerramento **operacional completo** (produção BD + app + testes de fumo) exige as confirmações pendentes nas secções 5, 6 e 7.

**Classificação:** **ENCERRADO COM RESSALVAS** — encerramento **de código e Git** com sucesso; verificações de **runtime em produção** e **testes de fumo** ficam **pendentes de evidência** nesta execução.

---

## SAÍDA OBRIGATÓRIA (checklist)

| # | Item | Valor |
|---|------|--------|
| 1 | **SHA do commit final (núcleo)** | `8be0376d6fc6ae11d6b011a89fe27eb170b5a696` |
| 1b | **SHA HEAD branch (com relatório)** | `37aada67dde928887d885baa33b4d9ed21c872a3` |
| 2 | **Tag final** | `core-transacional-aprovado-2026-04-09` |
| 3 | **Status do push** | **Sucesso** — `snapshot/v1-estavel-2026-04-09` e tag enviadas para `https://github.com/indesconectavel/gol-de-ouro.git` |
| 4 | **Estado da árvore** | **Limpo** (`git status` sem alterações pendentes na branch) |
| 5 | **Banco em produção** | **Parcialmente confirmado** (evidência histórica de execução SQL); **catálogo não verificado** nesta sessão |
| 6 | **Backend em produção** | **Não confirmado** nesta sessão; **entrypoint esperado:** `server-fly.js` (Dockerfile + `npm start`) |
| 7 | **Smoke tests** | **Não executados** nesta sessão; roteiro manual na secção 7 |
| 8 | **Classificação final** | **ENCERRADO COM RESSALVAS** |
