# H2 — PRÉ-EXECUÇÃO RUNTIME TRACEABILITY — GITCOMMIT

**Data:** 2026-05-12  
**Modo:** read-only (sem alterações a código, workflows, Dockerfile, deploy, base, frontend, player, `vercel.json` ou ficheiros `??`).  
**Relatório-base obrigatório:** `docs/relatorios/H2-DIAGNOSTICO-RUNTIME-TRACEABILITY-GITCOMMIT-2026-05-12.md` (analisado; conclusões alinhadas).

---

## 1. Resumo executivo

A correção do **`gitCommit: null`** em **`GET /meta`** **não exige** alterar `server-fly.js` nem o `Dockerfile` com a evidência atual: o contrato já está correto (`process.env.GIT_COMMIT` ← `ENV` da imagem ← `ARG` no build). O problema é **operacional**: imagens produzidas por **deploy sem `--build-arg GIT_COMMIT=...`**.

A **cirurgia H2 mínima** deve concentrar-se em: (1) alinhar **`.github/workflows/deploy-on-demand.yml`** com o mesmo *build-arg* que `backend-deploy.yml` e `main-pipeline.yml`; (2) **documentar** o comando manual canónico (runbook / comando de operador); (3) opcionalmente, numa **fase 2 de higiene**, alinhar scripts e documentação legada que ainda mostram `fly deploy` sem SHA — **fora** do núcleo mínimo se o objetivo é fechar H2 com o menor *diff*.

**Classificação (secção 12):** **PRONTO COM RESSALVAS** — caminho técnico claro; ressalva = **múltiplas superfícies** (scripts, docs, `.cursor/commands`) ainda ensinam deploy Fly **sem** `GIT_COMMIT`, o que pode **reverter** o ganho se um operador seguir esses caminhos.

---

## 2. Relatório-base analisado

| Secção do diagnóstico H2 | Uso na pré-execução |
|--------------------------|---------------------|
| Causa em `process.env.GIT_COMMIT` + `Dockerfile` ARG/ENV | Confirma que a correção é **injeção no build**, não mudança de lógica em `/meta`. |
| Workflows `backend-deploy.yml` / `main-pipeline.yml` com `--build-arg` | **Modelo** a replicar em `deploy-on-demand.yml`. |
| `deploy-on-demand.yml` sem *build-arg* | **Alvo principal** da cirurgia CI. |
| Deploy manual sem argumentos | **Runbook** + validação pós-deploy. |

Nenhuma evidência no relatório-base obriga alteração ao `Dockerfile` ou a `server-fly.js` para a primeira onda.

---

## 3. Estado Git atual

| Comando / item | Resultado (snapshot desta pré-execução) |
|------------------|------------------------------------------|
| `git status --short` | ` M goldeouro-player/vercel.json`; vários `??` (não tocados) |
| Branch | `fix/admin-financial-integrity-v1` |
| `HEAD` | `f136fc89775e3f5b520d53cae4c2d8f104b8d35b` (*docs: registrar H2 diagnostico gitCommit meta*) |

---

## 4. Arquivos potencialmente afetados

### Núcleo mínimo (cirurgia H2 recomendada)

| Ficheiro | Motivo |
|----------|--------|
| `.github/workflows/deploy-on-demand.yml` | Único workflow “oficial” identificado no diagnóstico **sem** `--build-arg GIT_COMMIT`. |

### Documentação / comandos internos (recomendado na mesma PR ou logo a seguir)

| Ficheiro | Motivo |
|----------|--------|
| `.cursor/commands/deploy-producao.md` | Referência `fly deploy` sem *build-arg* — risco de repetir o problema. |
| `docs/relatorios/EXECUCAO-CONTROLADA-RUNTIME-T14A-PAINEL-ADMIN-V1-2026-05-12.md` (e similares) | Registam `fly deploy --remote-only` sem SHA; **histórico** pode manter-se, mas **novos** runbooks devem citar o comando completo. |

### Backlog de higiene (não obrigatório para fechar H2 mínimo)

Vários ficheiros na árvore (grep) contêm `fly deploy` / `flyctl deploy` **sem** `GIT_COMMIT`: scripts (`deploy-flyio.ps1`, `proximos-passos-melhorias.js`, `deploy-servidor-real.js`, …), `deploy-com-validacao.sh` / `.ps1`, `README.md`, guias em `docs/configuracoes/`, `backup-pre-limpeza-*/`, etc. **Corrigir todos** seria uma **onda separada** (“higiene documental + scripts”) para reduzir drift humano.

### Explicitamente **não** afetados na estratégia mínima

| Ficheiro | Motivo |
|----------|--------|
| `server-fly.js` | Comportamento já correto; mudar seria *feature* ou *fallback* não necessário à evidência H2. |
| `Dockerfile` | Já suporta `ARG`/`ENV`; ausência de valor vem do **comando de build**. |
| `fly.toml` | Opcional futuro (`[env]` estático) **desaconselhado** como substituto do SHA de build (drift). |
| `goldeouro-player/vercel.json` | Fora de escopo. |

---

## 5. Estratégia recomendada

### Fase A — CI (uma alteração controlada)

1. Editar **apenas** `deploy-on-demand.yml` no passo “Deploy Backend”, acrescentando:  
   `--build-arg GIT_COMMIT="${{ github.sha }}"`  
   (mesmo padrão que `backend-deploy.yml` / `main-pipeline.yml`.)
2. PR dedicada ou commit com mensagem explícita (*fix(ci): pass GIT_COMMIT to Fly build on demand*).
3. Após merge, disparar **um** `workflow_dispatch` de teste (se política o permitir) **ou** confiar no próximo uso real e validar `/meta`.

### Fase B — Deploy manual (sem merge imediato, se urgência operacional)

Comandos canónicos (exemplo; ajustar app se necessário):

```bash
fly deploy --remote-only --app goldeouro-backend-v2 --build-arg GIT_COMMIT="$(git rev-parse HEAD)"
```

Ou SHA explícito do commit que está na working tree que origina o deploy. **Nunca** `git rev-parse` de outro clone/commit errado.

### Fase C — Higiene (opcional, pós-H2)

- Atualizar `.cursor/commands/deploy-producao.md` e os scripts **mais usados** pela equipa (`deploy-flyio.ps1`, etc.) para incluir o *build-arg* ou chamar um *wrapper* único.
- Índice curto em `docs/README-BACKEND.md` com o “comando ouro”.

### Ordem sugerida

1. **Se** o objetivo imediato é só **produção** com SHA correto: **Fase B** (manual com *build-arg*) + validação.  
2. **Em paralelo ou a seguir:** **Fase A** para não regressar no CI *on-demand*.  
3. **Fase C** quando houver janela de higiene.

---

## 6. Escopo da cirurgia H2

**Dentro do escopo (mínimo aceite como “H2 fechado”):**

- Alteração a **`.github/workflows/deploy-on-demand.yml`** para passar `--build-arg GIT_COMMIT="${{ github.sha }}"`.
- **OU**, se a decisão de produto for **apenas** operação sem tocar em CI neste ciclo: um **deploy manual documentado** com *build-arg* + relatório de **execução controlada** (evidência `curl /meta`) — reconhece-se que isso **não** impede regressão no próximo `workflow_dispatch` sem fix no YAML.

**Recomendação forte:** incluir **sempre** o item do YAML na mesma “cirurgia H2” para fecho consistente.

**Fora do núcleo mínimo mas alinhado:** atualização de **um** runbook (ex.: secção no próprio relatório de execução ou `docs/README-BACKEND.md`) com o comando manual — baixo risco, alto ganho.

---

## 7. Itens fora do escopo

- Alterações a `server-fly.js`, `Dockerfile`, `fly.toml` (salvo nova evidência).
- `backend-deploy.yml` / `main-pipeline.yml` (já corretos no que respeita a `GIT_COMMIT`).
- Base de dados, PIX, gameplay, admin funcional, player, Vercel.
- `goldeouro-player/vercel.json` e ficheiros `??` não relacionados.
- Refatoração massiva de todos os scripts/docs listados no grep (backlog).
- Substituição de `gitCommit` por leitura de API externa ou *hardcode* de versão.

---

## 8. Impacto esperado

- Novas imagens Fly construídas via **CI corrigido** ou **manual com *build-arg*** terão `GIT_COMMIT` não vazio → `/meta` com **`gitCommit` string** estável para suporte e auditoria.
- **Zero** mudança de contrato para campos que já existem (`version`, `build`, `features`).
- Consumidores que ignoravam `gitCommit` **não** quebram.

---

## 9. Riscos

| Risco | Mitigação |
|-------|-----------|
| SHA do `github.sha` do workflow **≠** commit que o operador pensava estar a deployar | Confirmar branch do `checkout` e que não há *cherry-pick* ambíguo; em manual usar `git rev-parse HEAD` no clone certo. |
| Deploy com *build-arg* mas **código** de outro commit | Procedimento Git normal (checkout explícito antes do deploy). |
| Operador continuar a usar scripts antigos sem *build-arg* | Fase C + comunicação interna. |

---

## 10. Rollback

- **Fly:** `fly releases -a goldeouro-backend-v2` e rollback para a *release* anterior se health ou arranque falharem após o novo deploy.
- **Git:** `git revert` do commit que alterou apenas o workflow, se o problema for exclusivamente CI (raro causar runtime quebrado).
- **Funcional:** alterar só *build-arg* **não** deve introduzir regressão de API; rollback é **precaução padrão**.

---

## 11. Critérios de validação

Após deploy Fly (manual ou workflow corrigido):

1. `GET https://goldeouro-backend-v2.fly.dev/health` → **200**.
2. `GET https://goldeouro-backend-v2.fly.dev/meta` → **200**, `success: true`, **`data.gitCommit` ≠ null** e string **hex** (40 chars típicos SHA-1).
3. `data.gitCommit` **igual** ao SHA do commit que originou o build (comparar com `git log -1` no checkout do deploy ou `github.sha` do run).
4. Smoke opcional: uma rota já existente (ex. auth ou admin) sem alteração esperada.

---

## 12. Classificação final

**PRONTO COM RESSALVAS**

- **PRONTO** para executar a **correção mínima** (YAML + ou comando manual documentado) com clareza técnica e critérios de validação.
- **RESSALVAS:** superfície grande de documentação/scripts ainda **sem** *build-arg*; sem higiene adicional, o problema pode **voltar** por erro humano.

**Não** “BLOQUEADO”: não há dependência externa bloqueante nem ambiguidade na causa raiz.

**Não** “PRONTO PARA PREPARAÇÃO AUTOMÁTICA” (no sentido de *zero* risco): a automação futura (scripts) ainda não está alinhada em massa.

---

*Fim do relatório de pré-execução H2 — apenas documentação; nenhuma alteração aplicada ao código, workflows ou deploy.*
