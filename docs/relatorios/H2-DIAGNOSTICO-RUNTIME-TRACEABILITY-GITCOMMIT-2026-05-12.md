# H2 — DIAGNÓSTICO RUNTIME TRACEABILITY — GITCOMMIT

**Data:** 2026-05-12  
**Modo:** read-only (sem alterações a código, deploy, variáveis Fly, base ou frontend).  
**App:** `goldeouro-backend-v2` (Fly).  
**Contexto:** release operacional **v451**; baseline documental **H1** em `94d6054`; `goldeouro-player/vercel.json` fora de escopo.

---

## 1. Resumo executivo

O campo **`gitCommit: null`** em **`GET /meta`** não é um bug de serialização JSON nem uma falha de rota: o código expõe explicitamente `null` quando a variável de ambiente **`GIT_COMMIT`** está ausente ou vazia no **processo Node em runtime**. Essa variável é definida no **Dockerfile** como `ENV GIT_COMMIT=${GIT_COMMIT}`, com `ARG GIT_COMMIT=` **por defeito vazio**; só recebe valor se o **build da imagem** for feito com **`--build-arg GIT_COMMIT=<sha>`**.

Os workflows **`backend-deploy.yml`** (job de deploy em `main`) e **`main-pipeline.yml`** já passam `--build-arg GIT_COMMIT=${{ github.sha }}`. Contudo, o workflow **`deploy-on-demand.yml`** faz `flyctl deploy` **sem** esse *build-arg*, e um **deploy manual** típico (`fly deploy --remote-only` sem argumentos extra) reproduz o mesmo efeito: imagem com `GIT_COMMIT` vazio → **`gitCommit` null** em produção.

**Conclusão:** a causa mais provável do estado atual em Fly é **imagem construída sem injeção de `GIT_COMMIT`** (deploy manual ou caminho CI sem *build-arg*), coerente com entregas a partir de branch de trabalho / T14A sem passar pelo job de `main` com os argumentos corretos.

**Classificação (secção 15):** **CORREÇÃO SIMPLES** (redeploy com *build-arg* ou alinhar pipeline) **com ressalvas** (há mais de um ponto de entrada para deploy; todos devem alinhar-se para não regressar).

---

## 2. Estado Git atual

Comandos executados no repositório parent:

| Item | Valor |
|------|--------|
| `git status --short` | ` M goldeouro-player/vercel.json`; múltiplos `??` (relatórios, SQL, scripts) — **fora do escopo H2** |
| Branch | `fix/admin-financial-integrity-v1` |
| `HEAD` | `94d6054fe8eccf1d495509b32d69433bf89f5919` (*docs: registrar H1 higiene operacional baseline V1*) |

Nenhuma alteração foi feita ao working tree para este diagnóstico.

---

## 3. Estado runtime atual

| Verificação | Resultado |
|-------------|-----------|
| `GET https://goldeouro-backend-v2.fly.dev/meta` | **200**, JSON com `success: true` |
| `data.gitCommit` | **`null`** (confirmado por `curl.exe` em 2026-05-12) |
| `data.version` / `data.build` | Literais `1.2.1` / `2025-10-21` (independentes de Git) |

Corpo observado (resumo):

```json
{"success":true,"data":{"version":"1.2.1","build":"2025-10-21","gitCommit":null,"environment":"production",...}}
```

---

## 4. Implementação atual do `/meta`

Ficheiro: `server-fly.js` — rota `GET /meta`:

- Lê **`process.env.GIT_COMMIT`** (`gitCommitRaw`).
- Se não for **string** ou, após `trim()`, estiver vazia → **`gitCommit`** na resposta é **`null`**.
- Não existe *fallback* para `git rev-parse`, ficheiro `.git` dentro da imagem, ou outra variável (ex.: `SOURCE_COMMIT`, `VERCEL_GIT_*`).

Isto é comportamento **intencional e defensivo**: sem commit injetado no build, o API não inventa um SHA.

---

## 5. Origem esperada do gitCommit

| Camada | Papel |
|--------|--------|
| **Build da imagem Docker** | `ARG GIT_COMMIT` + `ENV GIT_COMMIT=${GIT_COMMIT}` no `Dockerfile` “congela” o SHA na camada de imagem. |
| **Runtime Fly** | O processo herda `ENV` da imagem; **`fly.toml` `[env]`** não define `GIT_COMMIT` (apenas `NODE_ENV`). |
| **Secrets Fly** | Poderiam definir `GIT_COMMIT`, mas **não** estão no repositório como requisito; seria duplicado e facilmente **desatualizado** em relação ao código real. |
| **CI/CD** | Deve passar `--build-arg GIT_COMMIT=<sha do commit que está a ser deployado>` para consistência **build ↔ commit**. |

Ou seja: a origem **esperada e correta** é **build-arg no momento do `flyctl deploy` / `docker build`**, não um valor mágico em runtime sem rebuild.

---

## 6. Dockerfile

Ficheiro raiz: `Dockerfile` (o mesmo referenciado por `fly.toml` → `[build] dockerfile = "Dockerfile"`).

Trecho relevante:

- `ARG GIT_COMMIT=` — valor por defeito **vazio**.
- `ENV GIT_COMMIT=${GIT_COMMIT}` — propaga para o processo Node.
- `LABEL org.opencontainers.image.revision="${GIT_COMMIT}"` — também ficará vazio se o *build-arg* não for passado.

**Implicação:** qualquer build sem `--build-arg GIT_COMMIT=...` produz imagem com `gitCommit` null em `/meta`.

---

## 7. Fly config

Ficheiro: `fly.toml` (`app = "goldeouro-backend-v2"`).

- **`[env]`:** apenas `NODE_ENV = "production"` — **sem** `GIT_COMMIT`.
- **Sem** secção que injete automaticamente o SHA do Git no build (isso é responsabilidade do comando de deploy / CI).

Portanto, **fly.toml sozinho não corrige** `gitCommit: null`; a correção é no **comando de build** ou alinhamento de workflows.

---

## 8. Workflows e deploy

### `/.github/workflows/backend-deploy.yml`

- Deploy do job **`deploy-backend`** condicionado a `github.ref == 'refs/heads/main'`.
- Comando: `flyctl deploy --remote-only --no-cache --app ${{ env.FLY_APP_NAME }} --build-arg GIT_COMMIT="${{ github.sha }}"` — **correto**.

### `/.github/workflows/main-pipeline.yml`

- Args do passo Fly: `deploy --remote-only --app ${{ env.FLY_APP_NAME }} --build-arg GIT_COMMIT=${{ github.sha }}` — **correto** (nota: `continue-on-error: true` no passo pode mascarar falhas de deploy; não afeta a lógica do *build-arg* quando o deploy corre).

### `/.github/workflows/deploy-on-demand.yml`

- Comando: `flyctl deploy --config fly.toml --remote-only --app goldeouro-backend-v2` — **não inclui** `--build-arg GIT_COMMIT=...`.
- **Lacuna:** qualquer produção deployada **só** por este workflow terá **`gitCommit` null** até correção.

### Scripts locais (amostra)

- `scripts/deploy-backend.ps1` (início analisado): orientado a outras plataformas legadas na cópia comentada; **não** documenta `fly deploy` com `GIT_COMMIT` no trecho lido — risco de **drift** se usado para Fly sem adaptação.

### Deploy manual (operador)

- `fly deploy --remote-only` **sem** `--build-arg GIT_COMMIT=$(git rev-parse HEAD)` (ou SHA explícito) → **mesmo sintoma**.

### Variável Fly “só em runtime”

- Definir `GIT_COMMIT` como *secret*/*env* na app **sem** rebuild **só** funciona se a imagem ou o arranque **relê** esse env em cada máquina; o `Dockerfile` atual **fixa** `ENV` na build. Ou seja, a abordagem correta continua a ser **rebuild com build-arg** (ou alteração futura de Dockerfile para ler só runtime — **fora** deste diagnóstico mínimo).

---

## 9. Causa provável

**Principal:** a imagem em execução no Fly (**v451** ou estado equivalente) foi produzida por um **build que não recebeu `--build-arg GIT_COMMIT`**, logo `ENV GIT_COMMIT` na imagem ficou vazia e o Node expõe `gitCommit: null`.

**Concordante com o contexto do projeto:**

- Trabalho em branch **`fix/admin-financial-integrity-v1`** e deploys manuais documentados (ex.: T14A) tendem a **não** passar pelo job de `main` em `backend-deploy.yml` que injeta `github.sha`.
- Uso pontual de **`deploy-on-demand.yml`** sem *build-arg* reproduz o problema **sempre**.

**O problema não está** na lógica de “se null então null” do `server-fly.js`; está na **cadeia de build / comando de deploy**.

---

## 10. Correção mínima recomendada

**Opção A — Operacional (zero mudança de repositório na primeira intervenção):**

No próximo deploy Fly a partir da máquina com o código certo:

```bash
fly deploy --remote-only --app goldeouro-backend-v2 --build-arg GIT_COMMIT="$(git rev-parse HEAD)"
```

(ou SHA explícito do commit que está a ser deployado). Validar `/meta` após o rollout.

**Opção B — Governança CI (mudança pequena e segura, numa cirurgia futura):**

- Em **`deploy-on-demand.yml`**, acrescentar o mesmo `--build-arg GIT_COMMIT="${{ github.sha }}"` que nos outros workflows.
- Documentar no runbook que **todo** deploy Fly deve incluir esse argumento.

**Opção C — Fluxo via `main`:**

- Merge para `main` e deixar **`backend-deploy.yml`** fazer deploy com `github.sha` (desde que *paths* e condições do workflow cubram o commit).

**Não recomendado como “mínimo seguro”:** manter `GIT_COMMIT` só como secret Fly atualizado à mão — alto risco de **drift** face ao código real.

---

## 11. Impacto esperado

- Após rebuild com *build-arg*, **`/meta`** passa a devolver **`gitCommit`** com string hexadecimal de **40** caracteres (SHA Git), alinhada ao commit da imagem.
- **Sem** alteração de contrato JSON além de `gitCommit` deixar de ser `null` — clientes que já toleram `null` continuam compatíveis.
- **Label** OCI `org.opencontainers.image.revision` na imagem passa a ser preenchida (melhor auditoria de artefacto).

---

## 12. Riscos

| Risco | Grau | Nota |
|-------|------|------|
| Deploy com SHA errado (cópia/cola) | Médio | Sempre usar `github.sha` em CI ou `git rev-parse HEAD` no clone local correto. |
| Esquecer *build-arg* noutro workflow novo | Médio | Checklist de revisão de pipelines. |
| Confundir `gitCommit` com versão semântica `1.2.1` | Baixo | São conceitos distintos; documentar para equipa. |

---

## 13. Rollback

- **Fly:** `fly releases -a goldeouro-backend-v2` e **rollback** para a *release* anterior se o novo deploy falhar (health, erros de arranque).
- Funcionalmente, adicionar `GIT_COMMIT` **não** deve quebrar rotas existentes; o rollback é **padrão operacional Fly**, não específico de `/meta`.
- Se algum consumidor assumisse `gitCommit === null` (improvável), rollback restauraria o comportamento anterior.

---

## 14. Critérios de validação

1. `curl -sS "https://goldeouro-backend-v2.fly.dev/meta"` → `data.gitCommit` **string não vazia**, formato SHA-1/hex do Git usado no build.
2. O valor deve **coincidir** com o commit que originou a imagem (comparar com `fly releases` / notas de deploy / `github.sha` do run).
3. `/health` continua **200**; smoke mínimo de uma rota autenticada opcional sem regressão.
4. (Opcional) `docker inspect` / metadados da imagem com label `org.opencontainers.image.revision` preenchido.

---

## 15. Classificação final

**CORREÇÃO SIMPLES** — a raiz é **processo de build** sem `GIT_COMMIT`; a solução mínima é **redeploy com `--build-arg GIT_COMMIT=...`** ou deploy via **`main`** com workflow já corrigido.

**COM RESSALVAS** — existe pelo menos um caminho automatizado (**`deploy-on-demand.yml`**) que **hoje** omite o *build-arg*; até ser alinhado, **qualquer** uso desse caminho **reintroduz** `gitCommit: null`.

---

*Fim do relatório H2 — diagnóstico read-only; nenhuma alteração aplicada ao repositório remoto ou local além da criação deste ficheiro de documentação.*
