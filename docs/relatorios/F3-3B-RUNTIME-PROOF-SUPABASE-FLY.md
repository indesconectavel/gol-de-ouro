# F3.3B — Runtime proof Supabase Fly

**Data:** 2026-06-07  
**Modo:** READ-ONLY ABSOLUTO  
**App Fly:** `goldeouro-backend-v2`  
**Objetivo:** confirmar qual Supabase o backend Fly usa em produção

---

## 1. Resumo executivo

A prova de runtime confirma que o backend Fly em produção opera via **`SUPABASE_URL` → `gayopagjdrkcmkirmfvy`** (`goldeouro-production`).

O secret **`DATABASE_URL`** também existe no Fly, mas aponta para **`uatszaqzdqcwnfbipoxg`** — o mesmo drift já observado localmente. O entrypoint de produção (`server-fly.js`) **não consome** `DATABASE_URL`; usa `database/supabase-unified-config.js` com `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`.

**Conclusão:** produção Fly = **`gayopagjdrkcmkirmfvy`**. O ref `uatszaqzdqcwnfbipoxg` permanece como secret legado/staging no Fly, sem ser o caminho operacional do API server.

---

## 2. `fly secrets list -a goldeouro-backend-v2`

**Executado:** 2026-06-07T23:21Z (token Fly lido de `.env.local` — valor **não** reproduzido neste relatório)  
**Exit code:** 0

### 2.1 Secrets Supabase / Postgres solicitados

| Secret | Presente? | Status | Digest (Fly) |
|--------|-----------|--------|--------------|
| **`SUPABASE_URL`** | ✅ Sim | Deployed | `c6ee819e68113fdd` |
| **`SUPABASE_SERVICE_ROLE_KEY`** | ✅ Sim | Deployed | `5d1d8a771f5f7f1d` |
| **`DATABASE_URL`** | ✅ Sim | Deployed | `28df5abcce893ac5` |

### 2.2 Secrets Supabase relacionados (presença adicional)

| Secret | Status | Digest |
|--------|--------|--------|
| `SUPABASE_ANON_KEY` | Deployed | `1dfae2c7e959de27` |
| `SUPABASE_SERVICE_KEY` | Deployed | `2988eecc5f896a2b` |

> `fly secrets list` expõe **somente nomes e digests** — nunca os valores. Nenhum valor secreto foi copiado para este relatório.

---

## 3. Project ref nas URLs (runtime SSH — somente refs)

Como digests não revelam o host, foi feita leitura **read-only** via `fly ssh console` imprimindo apenas variáveis já presentes no processo (sem alterar secrets).

| Variável | Método | Project ref detectado |
|----------|--------|------------------------|
| **`SUPABASE_URL`** | `printenv SUPABASE_URL` | **`gayopagjdrkcmkirmfvy`** |
| **`DATABASE_URL`** | `printenv DATABASE_URL` + match local (senha redigida) | **`uatszaqzdqcwnfbipoxg`** |

**Evidência literal (não-secreto):**

```text
SUPABASE_URL → https://gayopagjdrkcmkirmfvy.supabase.co
```

**Nota:** comandos SSH retornaram exit code 1 com mensagem local `Identificador inválido` após imprimir stdout — a URL/ref foi capturada antes do erro.

---

## 4. Caminho operacional do backend

| Componente | Fonte de dados | Ref efetivo |
|------------|----------------|-------------|
| `server-fly.js` | `supabase-unified-config.js` → `SUPABASE_URL` | **`gayopagjdrkcmkirmfvy`** |
| `/health` (ping `usuarios`) | SDK Supabase admin | **`gayopagjdrkcmkirmfvy`** (via `SUPABASE_URL`) |
| `payout-worker.js` | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | **`gayopagjdrkcmkirmfvy`** |
| `DATABASE_URL` no Fly | Secret presente | **`uatszaqzdqcwnfbipoxg`** — **não referenciado** em `server-fly.js` |

---

## 5. Comparação com configs locais e F3.3A

| Fonte | `SUPABASE_URL` | `DATABASE_URL` | Alinhado com Fly runtime? |
|-------|----------------|----------------|---------------------------|
| **Fly produção (runtime)** | `gayopagjdrkcmkirmfvy` | `uatszaqzdqcwnfbipoxg` | — |
| **`.env.local`** | `gayopagjdrkcmkirmfvy` | `uatszaqzdqcwnfbipoxg` | ✅ Mesmo padrão de drift |
| **`.env`** | `gayopagjdrkcmkirmfvy` (várias entradas) | ausente | Parcial (`SUPABASE_URL` ok) |
| **F3.3A (2026-06-07)** | Inferiu prod `gayopagjdrkcmkirmfvy` | Local staging `uats…` | ✅ Confirmado; Fly `fly secrets list` estava pendente |

### Delta F3.3A → F3.3B

| Item F3.3A | Status F3.3B |
|------------|--------------|
| `fly secrets list` pendente | ✅ Executado |
| Project ref Fly desconhecido | ✅ `SUPABASE_URL` = `gayopagjdrkcmkirmfvy` |
| Veredito `LEGADO COM REFERÊNCIAS` para `uats…` | ✅ Reforçado: secret `DATABASE_URL` Fly ainda aponta staging |

---

## 6. Risco operacional

| Cenário | Impacto | Nível |
|---------|---------|-------|
| Pausa de `uatszaqzdqcwnfbipoxg` derruba API Fly | Baixo — API usa `SUPABASE_URL` prod | **BAIXO** |
| Secret `DATABASE_URL` stale no Fly confunde ops/scripts | Médio — drift documentado | **MÉDIO** |
| Pausa de `gayopagjdrkcmkirmfvy` | Crítico — banco real do runtime | **ALTO** (outro projeto) |

**Risco global desta verificação:** **MÉDIO** — produção confirmada correta via `SUPABASE_URL`, mas coexistência de `DATABASE_URL` staging no Fly é dívida de configuração.

---

## 7. Recomendações (sem execução nesta missão)

1. **Não pausar `gayopagjdrkcmkirmfvy`** — é o Supabase de produção Fly comprovado.
2. **`uatszaqzdqcwnfbipoxg`:** pode ser pausado/arquivado **sem impacto imediato na API**, desde que nenhum job Fly futuro dependa de `DATABASE_URL` PG direto.
3. **Etapa futura (fora F3.3B):** alinhar ou remover `DATABASE_URL` stale no Fly; documentar `STAGING_*` explícito se staging for mantido.

---

## 8. Saída final obrigatória

```
SUPABASE PRODUÇÃO FLY:
gayopagjdrkcmkirmfvy

uatszaqzdqcwnfbipoxg:
LEGADO

gayopagjdrkcmkirmfvy:
PRODUÇÃO

RISCO:
MÉDIO
```

**Justificativa do veredito `uats…` = LEGADO:** presente apenas em `DATABASE_URL` (Fly + local), não em `SUPABASE_URL` de produção; e-mail de inatividade Supabase; scripts staging; não usado pelo `server-fly.js`.

**Justificativa `gayopag…` = PRODUÇÃO:** `SUPABASE_URL` runtime Fly + `/health` conectado + convergência com `.env.local` e F3.3A.

---

*Relatório gerado em modo read-only. Nenhum secret, .env, código ou deploy foi alterado.*
