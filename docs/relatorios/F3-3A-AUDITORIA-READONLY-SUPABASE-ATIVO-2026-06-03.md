# F3.3A — Auditoria read-only do Supabase ativo

**Data da auditoria:** 2026-06-07 (relatório solicitado como F3-3A, arquivo datado 2026-06-03)  
**Modo:** READ-ONLY ABSOLUTO — nenhum código, banco, secret ou deploy alterado  
**Investigador:** agente Cursor (auditoria automatizada)  
**Project ref investigado:** `uatszaqzdqcwnfbipoxg` (`goldeouro-db`)

---

## 1. Resumo executivo

O projeto Supabase **`goldeouro-db` / `uatszaqzdqcwnfbipoxg`** **não é o banco de produção** do Gol de Ouro em junho de 2026.

A produção operacional (backend Fly `goldeouro-backend-v2`, player, admin) aponta documentalmente e por configuração local para **`gayopagjdrkcmkirmfvy`** (`goldeouro-production`). O runtime Fly responde saudável em `/health` com banco conectado e métricas vivas (`contadorChutes: 535`), coerente com produção ativa — mas **sem expor o project ref** no endpoint público.

O projeto `uatszaqzdqcwnfbipoxg` permanece referenciado como **staging / legado de desenvolvimento** em `.env.local` (`DATABASE_URL`), scripts de validação SQL e documentação antiga (Render, set/2025). O e-mail de inatividade do Supabase é **compatível** com um projeto staging pouco usado nos últimos 7+ dias.

**Pausar `goldeouro-db` não deve derrubar produção**, desde que Fly continue com secrets de `gayopagjdrkcmkirmfvy`. O risco principal é **quebra de fluxos locais/staging** e **confusão documental** entre os dois projetos.

---

## 2. E-mail de alerta recebido

Contexto documentado no repositório (`docs/auditorias/RESUMO-CORRECOES-NECESSARIAS.md`, out/2025 — padrão repetido no alerta atual):

| Campo | Valor |
|-------|-------|
| Assunto (padrão) | *"Your Supabase Project goldeouro-db is going to be paused"* |
| Nome do projeto | `goldeouro-db` |
| Project ref | `uatszaqzdqcwnfbipoxg` |
| Motivo | Inatividade ≥ 7 dias (plano Free) |
| Consequência | Pausa automática do projeto |

O repositório já registrava em out/2025 que o projeto **ativo de produção** seria `goldeouro-production` (`gayopagjdrkcmkirmfvy`), e que `goldeouro-db` seria candidato a pausa por inatividade.

---

## 3. Project ref investigado

| Atributo | Valor |
|----------|-------|
| Nome Supabase | `goldeouro-db` |
| Project ref | `uatszaqzdqcwnfbipoxg` |
| URL REST (padrão) | `https://uatszaqzdqcwnfbipoxg.supabase.co` |
| Host Postgres (direct) | `db.uatszaqzdqcwnfbipoxg.supabase.co` |
| Pooler (documentado) | `aws-0-sa-east-1.pooler.supabase.com` (tenant `postgres.uatszaqzdqcwnfbipoxg`) |

---

## 4. Project refs encontrados

| Project ref | Nome documentado | Papel declarado |
|-------------|------------------|-----------------|
| **`uatszaqzdqcwnfbipoxg`** | `goldeouro-db` | Staging / dev / legado Render |
| **`gayopagjdrkcmkirmfvy`** | `goldeouro-production` | **Produção** (Fly, auditorias F2.x, H3–H5) |

Nenhum outro project ref Supabase foi encontrado em configs ativas (fora backups históricos).

---

## 5. Ambiente associado a cada ref

| Ref | Produção Fly | Staging Fly | Frontend (Vercel) | Local dev | Scripts ops |
|-----|--------------|-------------|-------------------|-----------|-------------|
| `gayopagjdrkcmkirmfvy` | **Sim (documentado + inferido por /health)** | Não | Indireto (via API backend) | `.env`, `.env.local`, `env-producao-real.env` | Todos os scripts com `PROD_REF` |
| `uatszaqzdqcwnfbipoxg` | **Não** | Não (sem Fly staging dedicado) | **Não** | `.env.local` → `DATABASE_URL` | Scripts `STAGING_REF`, `stg-*`, legado Render |

### Diferença local vs produção vs staging

| Ambiente | `SUPABASE_URL` | `DATABASE_URL` | Observação |
|----------|----------------|----------------|------------|
| **Fly produção** | `gayopagjdrkcmkirmfvy` (via secrets — documentado) | Não usado pelo backend (`server-fly.js` usa SDK Supabase) | `/health` → `database: connected` |
| **Local `.env.local`** | `gayopagjdrkcmkirmfvy` | **`uatszaqzdqcwnfbipoxg`** | **Mismatch intencional documentado** (F2.2D, F2.3A) |
| **Frontends** | — | — | Apenas `VITE_API_URL` → backend HTTP |

---

## 6. Evidências por arquivo / configuração

### 6.1 Inventário de referências (tabela resumida)

> Valores de tokens, senhas e service role keys **omitidos**. Onde aplicável, indica-se apenas o project ref ou host.

| TERMO | ARQUIVO | LINHA | CONTEXTO | AMBIENTE PROVÁVEL |
|-------|---------|-------|----------|-------------------|
| `uatszaqzdqcwnfbipoxg` | `.env.local` | 45 | `DATABASE_URL=postgresql://***@db.uatszaqzdqcwnfbipoxg.supabase.co:6543/...` | Local / staging PG |
| `uatszaqzdqcwnfbipoxg` | `scripts/f2-2b-1-staging-validation.mjs` | 16 | `const STAGING_REF = 'uatszaqzdqcwnfbipoxg'` | Guardrail staging |
| `uatszaqzdqcwnfbipoxg` | `scripts/v1-1b-m1-staging-exec.js` | 50 | default staging project id | Staging SQL apply |
| `uatszaqzdqcwnfbipoxg` | `scripts/stg-list-tables.js` | 4 | connection string hardcoded | Staging util |
| `uatszaqzdqcwnfbipoxg` | `scripts/create-env.ps1` | 6 | template `DATABASE_URL` | Legado setup |
| `uatszaqzdqcwnfbipoxg` | `docs/configuracoes/CONFIGURACAO-URGENTE-RENDER-2025-09-05.md` | 26 | `DATABASE_URL` exemplo Render | Legado Render |
| `uatszaqzdqcwnfbipoxg` | `docs/relatorios/V1-1B-M1-STAGING-EXEC-RPC-PIX-LEDGER-2026-05-17.md` | 5 | staging = `goldeouro-db` | Staging documentado |
| `goldeouro-db` | `docs/auditorias/RESUMO-CORRECOES-NECESSARIAS.md` | 76 | alerta pausa + ref | Staging / legado |
| `gayopagjdrkcmkirmfvy` | `.env` | 5, 19, 23, 28 | `SUPABASE_URL` / `_PROD` | Local → prod REST |
| `gayopagjdrkcmkirmfvy` | `.env.local` | 20 | `SUPABASE_URL` | Local → prod REST |
| `gayopagjdrkcmkirmfvy` | `env-producao-real.env` | 10–11 | comentário + URL prod | Produção template |
| `gayopagjdrkcmkirmfvy` | `database/supabase-unified-config.js` | 15–16 | comentário `goldeouro-production` | Backend runtime |
| `gayopagjdrkcmkirmfvy` | `scripts/f2-2c-1-apply-prod.mjs` | 15 | `PROD_REF` guardrail | Ops produção |
| `gayopagjdrkcmkirmfvy` | `docs/relatorios/F2-2C-0-GATE-FINAL-PRODUCAO-*.md` | 32–33 | gate produção | Produção oficial |
| `SUPABASE_URL` | `server-fly.js` | 55 | required env | Fly / local backend |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/workers/payout-worker.js` | 19–20 | worker payout | Fly processo worker |
| `DATABASE_URL` | `.env.local` | 45 | host staging | Scripts PG diretos |
| `DATABASE_URL` | `.env.example` | 14 | placeholder genérico | Template |
| `NEXT_PUBLIC_SUPABASE_URL` | — | — | **Não encontrado** | — |
| `VITE_SUPABASE_URL` | — | — | **Não encontrado** | — |

**Nota sobre `.env` raiz:** há entradas duplicadas de `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`. As primeiras chaves service_role decodificam project ref **`uatszaqzdqcwnfbipoxg`**, enquanto linhas posteriores e `SUPABASE_URL_PROD` apontam **`gayopagjdrkcmkirmfvy`**. Em Node, a **última definição prevalece** — mas o arquivo representa **drift de credenciais** e risco operacional local.

### 6.2 Backend Fly / deploy

| Fonte | Achado |
|-------|--------|
| `fly.toml` | App `goldeouro-backend-v2`, região `gru`, health `/health` |
| `.github/workflows/backend-deploy.yml` | Deploy canónico Fly; secrets via `FLY_API_TOKEN`; **não** injeta Supabase no workflow (ficam nos secrets Fly) |
| `docs/relatorios/RELATORIO-CORRECOES-CRITICAS-FINAL.md` | Instrução: `fly secrets set SUPABASE_URL="https://gayopagjdrkcmkirmfvy.supabase.co"` |
| `database/supabase-unified-config.js` | Cliente único via `SUPABASE_URL` + service role — comentário explícito **goldeouro-production** |
| `docs/relatorios/F2-4E-1-*.md` | `fly secrets list` executado em 2026-05-29 (tokens MP); **SUPABASE_* não revalidado nesta sessão** |

**Respostas Etapa 2:**

1. **Qual Supabase o backend Fly usa hoje?** Documentação consistente + runtime saudável → **`gayopagjdrkcmkirmfvy`**. Confirmação direta via `fly secrets list` **não obtida** (timeout no ambiente do agente).
2. **`DATABASE_URL` de produção Fly?** Backend **não consome** `DATABASE_URL` em `server-fly.js`; usa SDK Supabase. N/A no Fly.
3. **`SUPABASE_URL` de produção Fly?** Documentado como `https://gayopagjdrkcmkirmfvy.supabase.co`.
4. **Diferença local/staging/prod?** Local: REST prod + PG staging (`DATABASE_URL`). Fly: só prod. Sem Fly staging.

### 6.3 Frontend / admin

| App | Supabase direto? | Evidência |
|-----|------------------|-----------|
| **goldeouro-player** | **Não** — só backend HTTP | `VITE_API_URL=https://goldeouro-backend-v2.fly.dev`; sem `createClient` Supabase em `src/` |
| **goldeouro-admin** | **Não** — só backend HTTP | `VITE_API_URL=https://api.goldeouro.lol`; sem referências Supabase em `src/` |

**Respostas Etapa 3:**

1. Player usa **apenas backend**.
2. Admin usa **apenas backend**.
3. **Nenhum frontend** aponta para `uatszaqzdqcwnfbipoxg`.
4. **Nenhum frontend** aponta diretamente para `gayopagjdrkcmkirmfvy` (acesso indireto via API Fly).

### 6.4 Histórico documental (Etapa 4)

| Pergunta | Resposta |
|----------|----------|
| Quando `uatszaqzdqcwnfbipoxg` foi usado? | Projeto original / Render (set–out/2025); reclassificado como **staging** a partir de **V1.1B (mai/2025)** para patches RPC/ledger; `DATABASE_URL` local mantido até F2.x (mai/2025). |
| Quando `gayopagjdrkcmkirmfvy` foi usado? | Declarado produção desde **out/2025** (`RELATORIO-CORRECOES-CRITICAS-FINAL`); todas as auditorias F2.2–F2.5, H3–H5 e OC-INC usam este ref para **SELECT REST produção**. |
| Produção mais recente declarada? | **`gayopagjdrkcmkirmfvy`** — gate F2.2C.0, F2.3A, H5-0C, F2.2D runtime `/meta`. |
| Risco de drift documental? | **Sim.** Exemplos: `EVITAR-PAUSA-SUPABASE.md` menciona nome `goldeouro-db` mas linka dashboard **`gayopagjdrkcmkirmfvy`**; guias Render ainda citam `DATABASE_URL` staging; `.env` com chaves duplicadas de refs distintos. |

---

## 7. Supabase provável de produção

| Atributo | Valor |
|----------|-------|
| Nome | `goldeouro-production` |
| Project ref | **`gayopagjdrkcmkirmfvy`** |
| URL | `https://gayopagjdrkcmkirmfvy.supabase.co` |
| Backend | Fly `goldeouro-backend-v2.fly.dev` |
| Evidência runtime | `/health` 2026-06-07: `database: connected`, `contadorChutes: 535`, `mercadoPago: connected` |
| Evidência código | `supabase-unified-config.js`, `PROD_REF` em dezenas de scripts |

---

## 8. Runtime proof (Etapa 5)

### 8.1 `GET /meta` (público)

**URL:** `https://goldeouro-backend-v2.fly.dev/meta`  
**Timestamp da consulta:** 2026-06-07

```json
{
  "success": true,
  "data": {
    "version": "1.2.1",
    "build": "2025-10-21",
    "gitCommit": "22f75f71ce60b60474de8470a4fee7ddfcc5d88f",
    "environment": "production",
    "features": { "pix": true, "goldenGoal": true, "monitoring": true }
  }
}
```

**Limitação:** `/meta` **não expõe** project ref Supabase.

### 8.2 `GET /health` (público)

```json
{
  "status": "ok",
  "timestamp": "2026-06-07T22:34:28.890Z",
  "version": "1.2.1",
  "database": "connected",
  "mercadoPago": "connected",
  "contadorChutes": 535,
  "ultimoGolDeOuro": 0
}
```

Prova de **algum** Supabase ativo no backend Fly; **não prova qual ref** sem `fly secrets list` ou endpoint dedicado (não existe — e não foi criado nesta auditoria).

### 8.3 Endpoints seguros adicionais

| Endpoint | Expõe ref Supabase? |
|----------|---------------------|
| `/meta` | Não |
| `/health` | Não |
| `/health/workers` | Não (flags payout) |
| `/api/monitoring/health` | Não verificado nesta sessão |

**Conclusão Etapa 5:** prova indireta de produção saudável; **prova direta do project ref em runtime Fly ausente** nesta sessão.

---

## 9. Classificação de risco (Etapa 6)

### Projeto investigado: `goldeouro-db` / `uatszaqzdqcwnfbipoxg`

| Classificação | Aplica? | Evidências |
|---------------|---------|------------|
| PRODUÇÃO ATIVA | **Não** | Fly/frontends/documentação F2.x apontam prod para `gayopagjdrkcmkirmfvy`; frontends não usam Supabase direto |
| STAGING ATIVO | **Parcial** | Scripts e `DATABASE_URL` local ainda referenciam; porém e-mail de **7+ dias inativos** sugere uso esporádico |
| **LEGADO COM REFERÊNCIAS** | **Sim (principal)** | Mantido em `.env.local`, scripts `STAGING_REF`, docs Render/set-2025; não alimenta Fly prod |
| LEGADO SEM USO | Parcial | Inatividade Supabase indica quase nenhum tráfego; ainda há referências ativas no repo |
| INCONCLUSIVO | Parcial | Falta `fly secrets list` atual para prova definitiva do ref em Fly (mas documentação + /health são convergentes) |

---

## 10. Recomendação (Etapa 7)

Como **`uatszaqzdqcwnfbipoxg` não é produção ativa**:

1. **Não tratar o alerta como incidente P0 de produção** — validar uma vez com `fly secrets list -a goldeouro-backend-v2` que `SUPABASE_URL` contém `gayopagjdrkcmkirmfvy` (somente leitura de nomes/digests).
2. **Decidir explicitamente** o destino de `goldeouro-db`:
   - **Manter como staging:** executar query periódica ou upgrade Pro **neste** projeto; documentar variáveis `STAGING_SUPABASE_*` (hoje ausentes — F2.2B.2 `STAGING_NOT_CONFIGURED`).
   - **Arquivar:** pausar/eliminar após confirmar que nenhum script local crítico depende de `DATABASE_URL` staging.
3. **Limpeza futura (etapa separada):** remover referências legadas Render, corrigir `.env` duplicado, alinhar `EVITAR-PAUSA-SUPABASE.md` (nome vs URL).
4. **Produção real (`gayopagjdrkcmkirmfvy`):** monitorar inatividade separadamente; backend Fly já gera tráfego via `/health` → `usuarios` count.

---

## 11. Risco operacional

| Cenário | Impacto | Probabilidade | Nível |
|---------|---------|---------------|-------|
| Pausa de `uatszaqzdqcwnfbipoxg` derruba Fly prod | Baixo | Baixa | **BAIXO** |
| Pausa quebra scripts locais / staging SQL | Médio | Média (se dev ativo) | **MÉDIO** (dev) |
| Drift `.env` (chaves de refs misturados) | Médio | Média em execução local | **MÉDIO** (local) |
| Pausa de `gayopagjdrkcmkirmfvy` | Crítico | Baixa enquanto Fly ativo | **ALTO** (outro projeto) |

**Risco global deste alerta (`goldeouro-db`):** **BAIXO** para produção; **MÉDIO** para workflows de staging/local.

---

## 12. Veredito final

```
VEREDITO:
- LEGADO COM REFERÊNCIAS

RISCO:
- BAIXO  (produção Fly / frontends)
  (MÉDIO apenas se a equipa ainda depende de staging local via DATABASE_URL)

PRÓXIMA AÇÃO:
Confirmar com `fly secrets list` que produção usa gayopagjdrkcmkirmfvy e decidir formalmente se goldeouro-db permanece como staging (keep-alive) ou pode ser arquivado após limpar referências locais.
```

---

## Anexo A — Evidências ausentes (para fechar INCONCLUSIVO)

| Evidência | Status nesta sessão |
|-----------|---------------------|
| `fly secrets list -a goldeouro-backend-v2` (digest `SUPABASE_URL`) | Timeout / não concluído |
| Query REST read-only em `uatszaqzdqcwnfbipoxg` vs `gayopagjdrkcmkirmfvy` | Não executada (evitar tocar dados desnecessariamente) |
| Dashboard Supabase (status exato do projeto) | Não acessado |

---

## Anexo B — Referências cruzadas

- F2.2D — mismatch local `SUPABASE_URL` prod vs `DATABASE_URL` staging
- F2.2B.1 / V1.1B-M1 — staging `uatszaqzdqcwnfbipoxg` = `goldeouro-db`
- F2.2C.0 / F2.3A / H5-0C — produção `gayopagjdrkcmkirmfvy`
- `docs/auditorias/RESUMO-CORRECOES-NECESSARIAS.md` — alerta pausa + distinção prod/staging

---

*Relatório gerado em modo read-only. Nenhum ficheiro de código, secret Fly, banco ou deploy foi alterado.*
