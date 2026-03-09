# Incidente — Candidato a rollback (/game funcionando) — READ-ONLY

**Data:** 2026-03-04  
**Modo:** Somente leitura. Nenhuma ação executada (sem promote, sem rollback).  
**Objetivo:** Descobrir qual deployment anterior tem /game funcionando (HTTP 200).

---

## 1) Listagem dos últimos deployments

**Comando:** `vercel ls goldeouro-player` (a opção `--limit` não existe nesta versão do CLI; foi usada a primeira página).

**Últimos 15+ deployments (ordem por idade):**

| Age | Short ID    | URL                                                                 | Status  | Environment |
|-----|-------------|---------------------------------------------------------------------|--------|-------------|
| 48m | ez1oc96t1   | https://goldeouro-player-ez1oc96t1-...vercel.app                    | Ready  | Production  |
| 1h  | ox7e478n5   | https://goldeouro-player-ox7e478n5-...vercel.app                    | Ready  | Preview     |
| 2d  | 9g3gs5e1l   | https://goldeouro-player-9g3gs5e1l-...vercel.app                    | Ready  | Preview     |
| 3d  | 4dljkviev   | https://goldeouro-player-4dljkviev-...vercel.app                   | Ready  | Preview     |
| 4d  | 1uu726i2g   | https://goldeouro-player-1uu726i2g-...vercel.app                    | Ready  | Preview     |
| 4d  | k5xmvyk06   | …                                                                   | Error  | Preview     |
| 4d  | o40x6hm78   | …                                                                   | Error  | Preview     |
| 8d  | fz51cowbf   | https://goldeouro-player-fz51cowbf-...vercel.app                   | Ready  | Preview     |
| 8d  | 5bdqbx8ax   | …                                                                   | Error  | Preview     |
| 8d  | ai61j46im   | …                                                                   | Error  | Preview     |
| 27d | p4epfrx3w   | https://goldeouro-player-p4epfrx3w-...vercel.app                    | Ready  | Production  |
| 27d | c9quof697   | https://goldeouro-player-c9quof697-...vercel.app                    | Ready  | Preview     |
| 27d | nu491i89w   | https://goldeouro-player-nu491i89w-...vercel.app                   | Ready  | Preview     |
| 27d | 8j65358w6   | https://goldeouro-player-8j65358w6-...vercel.app                    | Ready  | Preview     |
| …   | (outros)    | …                                                                   | Ready  | Preview     |

Foram considerados os **10 primeiros deployments READY** (excluídos Error) para inspeção e teste HTTP.

---

## 2) Detalhes dos 10 deployments READY (vercel inspect)

Para cada um foi executado: `vercel inspect https://goldeouro-player-<SHORT_ID>-goldeouro-admins-projects.vercel.app`

| Short ID    | id (full)                         | target     | status | url (inspect) | created |
|-------------|-----------------------------------|------------|--------|---------------|---------|
| ez1oc96t1   | dpl_4T2WpqnXxYcCbokKrwM6o69da51p  | production | Ready  | ...ez1oc96t1... | Wed Mar 04 2026 18:02:19 GMT-0300 [48m] |
| ox7e478n5   | dpl_7XyYPz3cu52MMrABTJAuFCq6g2E7  | preview    | Ready  | ...ox7e478n5... | Wed Mar 04 2026 17:42:50 GMT-0300 [1h] |
| 9g3gs5e1l   | dpl_2xjYf6SNrV4gakgCfAWiBVgzrb2X  | preview    | Ready  | ...9g3gs5e1l... | Mon Mar 02 2026 07:01:08 GMT-0300 [2d] |
| 4dljkviev   | dpl_9Q9jG7QqysLFHoQF1741yKKBUpXy  | preview    | Ready  | ...4dljkviev... | Sun Mar 01 2026 10:27:13 GMT-0300 [3d] |
| 1uu726i2g   | dpl_BhbdFb6tiG33g5tZwazaYLY9V1qD  | preview    | Ready  | ...1uu726i2g... | Sat Feb 28 2026 17:48:42 GMT-0300 [4d] |
| fz51cowbf   | dpl_F3ao2yvrKHM5dA5tHGQvupgS3KGh  | preview    | Ready  | ...fz51cowbf... | Tue Feb 24 2026 23:12:02 GMT-0300 [8d] |
| p4epfrx3w   | dpl_AKGHF53CGvedu32mDHMbfoYh8qGF  | production | Ready  | ...p4epfrx3w... | Fri Feb 06 2026 03:39:42 GMT-0300 [27d] |
| c9quof697   | dpl_V4g2zGejT9S5dGAkk1YvG9jcdGDU  | preview    | Ready  | ...c9quof697... | Fri Feb 06 2026 03:07:11 GMT-0300 [27d] |
| nu491i89w   | dpl_3FPuv8vMhveioV2gFmJuLDdYLBLx  | preview    | Ready  | ...nu491i89w... | Fri Feb 06 2026 02:20:51 GMT-0300 [27d] |
| 8j65358w6   | dpl_72YHy6JqxmMikyX5MYYKwZUq8JSi  | preview    | Ready  | ...8j65358w6... | Fri Feb 06 2026 02:17:08 GMT-0300 [27d] |

**Branch/commit (inferido por alias):** O inspect não expõe branch/commit diretamente. Pelos aliases reportados:
- ez1oc96t1: `goldeouro-player-git-main-goldeouro-admins-projects.vercel.app` → main
- ox7e478n5: `goldeouro-player-git-hotfix-le-27c7cd-...` → branch hotfix
- 9g3gs5e1l: `goldeouro-player-git-chore-hot-0d6e52-...` → branch chore
- 4dljkviev, 1uu726i2g: `goldeouro-player-git-preview-w-0da8dc-...` → branch preview
- fz51cowbf: `goldeouro-player-indesconectavel-...` → deploy do usuário indesconectavel
- p4epfrx3w: `goldeouro-player-git-main-...` → main
- c9quof697, nu491i89w, 8j65358w6: `goldeouro-player-git-feat-paym-1121f0-...` → branch feat/payments

---

## 3) Teste HTTP: / e /game (curl -I)

Para cada deployment:  
`curl.exe -s -I -L --max-time 10 "https://goldeouro-player-<SHORT_ID>-...vercel.app/"`  
`curl.exe -s -I -L --max-time 10 "https://goldeouro-player-<SHORT_ID>-...vercel.app/game"`

**Critério “deployment bom”:** `/` retorna 200 e `/game` **não** retorna 404 (ideal: 200).

### Resultados

| Short ID    | / status | /game status | X-Vercel-Error (/game) | Observação |
|-------------|----------|--------------|-------------------------|------------|
| ez1oc96t1   | 200      | **404**      | NOT_FOUND               | Prod atual |
| ox7e478n5   | 200      | **404**      | NOT_FOUND               | —          |
| 9g3gs5e1l   | 200      | **404**      | NOT_FOUND               | —          |
| 4dljkviev   | 200      | **404**      | NOT_FOUND               | —          |
| 1uu726i2g   | 200      | **404**      | NOT_FOUND               | —          |
| **fz51cowbf** | **200**  | **200**      | (nenhum)                 | **Único com /game OK** |
| c9quof697   | 200      | **404**      | NOT_FOUND               | —          |
| nu491i89w   | 200      | **404**      | NOT_FOUND               | —          |
| 8j65358w6   | 200      | **404**      | NOT_FOUND               | —          |
| p4epfrx3w   | 200      | **404**      | NOT_FOUND               | Prod anterior (27d) |

### Headers registrados (amostra)

**ez1oc96t1 (prod atual):**  
`/` → HTTP/1.1 200 OK, X-Vercel-Cache: HIT, X-Vercel-Id: gru1::bz545-...  
`/game` → HTTP/1.1 404 Not Found, X-Vercel-Error: NOT_FOUND, X-Vercel-Id: gru1::4zzvh-...

**fz51cowbf (candidato):**  
`/` → HTTP/1.1 200 OK, X-Vercel-Cache: HIT, X-Vercel-Id: gru1::jpvtm-..., Content-Length: 9056, Content-Type: text/html  
`/game` → HTTP/1.1 **200 OK**, X-Vercel-Cache: HIT, X-Vercel-Id: gru1::j2j7w-..., Content-Disposition: inline; filename="index.html", Content-Length: 9056, Content-Type: text/html; charset=utf-8  

Em **fz51cowbf**, `/game` devolve index.html (SPA), ou seja, o rewrite para `index.html` está a funcionar nesse deployment.

---

## 4) Critério “deployment bom”

- **/ retorna 200:** Todos os 10 READY retornam 200.
- **/game NÃO retorna 404 (ideal: 200):** Apenas **fz51cowbf** retorna 200 para `/game`. Os outros nove retornam 404 (X-Vercel-Error: NOT_FOUND).

---

## 5) Resultado: candidato e backups

### Melhor candidato (1º)

| Campo   | Valor |
|--------|--------|
| **Short ID** | **fz51cowbf** |
| **URL**      | https://goldeouro-player-fz51cowbf-goldeouro-admins-projects.vercel.app |
| **id (full)**| dpl_F3ao2yvrKHM5dA5tHGQvupgS3KGh |
| **target**   | preview |
| **created**  | Tue Feb 24 2026 23:12:02 GMT-0300 (8d atrás) |
| **Alias**    | https://goldeouro-player-indesconectavel-goldeouro-admins-projects.vercel.app |

É o **mais recente** dos 10 testados em que **/game** responde **200** e serve index.html (SPA). É o único que cumpre o critério nesta amostra.

### 2º e 3º melhores (backups)

**Nenhum outro** dos 10 deployments READY testados atende ao critério (/game não 404). Todos os outros têm `/game` → 404.

Como **alternativas para inspeção manual ou retestagem** (por idade, antes do candidato), podem ser considerados:
- **2º (por idade):** **1uu726i2g** (4d, Preview) — / 200, /game 404.
- **3º (por idade):** **4dljkviev** (3d, Preview) — / 200, /game 404.

Estes **não** têm /game OK no teste realizado; servem apenas como referência cronológica caso se queira revalidar ou investigar diferenças de config (vercel.json / rewrites).

### Recomendação (NÃO executar)

- **Candidato a rollback (promote to Production):** **fz51cowbf** — único deployment testado com `/` 200 e `/game` 200.
- **Pré-checks sugeridos antes de qualquer promote:** (1) Abrir a URL do deployment no browser e validar visualmente / e /game (layout, barra de versão, funcionalidade). (2) Confirmar no Vercel Dashboard que o deployment existe e está Ready. (3) Decidir o promote apenas após aprovação; **não foi executado promote nem rollback** nesta auditoria.

---

**Fim. Modo READ-ONLY. Nenhuma ação de promote ou rollback foi executada.**
