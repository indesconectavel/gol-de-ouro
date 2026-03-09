# Auditoria read-only — Pipeline Vercel e congelamento do frontend /game

**Data:** 2026-03-06  
**Modo:** READ-ONLY absoluto (nenhuma alteração de código, commit, deploy, promoção, Vercel/Fly/Supabase).  
**Objetivo:** Provar por que o /game regrediu quando outro deploy virou current, como evitar (guardrails) e plano cirúrgico de congelamento do frontend.

---

## Conclusão (causa raiz do “current mudou”)

**Causa raiz:** Produção do frontend (goldeouro-player) está **atrelada à branch `main`** e é atualizada por **dois workflows que usam `--prod` automaticamente**:

1. **frontend-deploy.yml** — Em todo **push/merge em `main`** que altere `goldeouro-player/**`, o job `deploy-production` roda `vercel-args: '--prod --yes'`. O novo build é **promovido a produção** sem gate manual.
2. **main-pipeline.yml** — Em **todo push em `main`** (sem filtro de path), o job `build-and-deploy` executa `npx vercel --prod --yes` a partir de `goldeouro-player`. Ou seja, **mesmo commits que só mudam o backend** disparam deploy do player para produção.

Assim, qualquer merge em `main` (ou push direto) que rode um desses workflows faz o **deployment mais recente** virar o “current” em produção. A regressão (layout diferente, barra de versão, login quebrado) ocorre quando esse novo deployment contém mudanças indesejadas ou ainda não validadas.

**Resumo:** O “current mudou” porque **não há freeze de produção**: produção é atualizada por CI em todo push em `main`, com `--prod` explícito.

---

## Risco atual

- **Produção (lista CLI):** O deployment listado como mais recente em produção é **ez1oc96t1** (1d). A lista `vercel list --environment=production` ordena por criação; ez1oc96t1 é o primeiro da lista.
- **vercel inspect www.goldeouro.lol:** Retornou o deployment **m38czzm4q** (49d) com id completo `dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX`. Os aliases www/app/goldeouro.lol estão associados a esse deployment na resposta do inspect. Pode haver cache/propagação ou diferença entre “último deployment de prod” e “deployment ao qual o domínio está apontando” — documentado nos anexos.
- **Fingerprint atual do /game:** HTML com SHA256 `bebe03d33ac9bbf67be1ac78fdd1bca0dc9eca615eaf5df9024a80710f346ee0`, bundle JS `/assets/index-qIGutT6K.js`, CSS `/assets/index-lDOJDUAS.css`. Headers: `server: Vercel`, `x-vercel-cache: HIT`.
- **Risco:** Enquanto os workflows dispararem `--prod` em push para `main`, o “current” pode mudar de novo a qualquer merge, com risco de nova regressão.

---

## FyKKeg6zb existe ou não?

- **Na lista de deployments (por slug/URL):** O slug **FyKKeg6zb** **não** aparece na lista de production deployments (ids são ez1oc96t1, p4epfrx3w, m38czzm4q, etc.).
- **URL direta** `https://goldeouro-player-FyKKeg6zb-goldeouro-admins-projects.vercel.app`: retorna **404** (deployment não encontrado por esse slug).
- **vercel inspect https://www.goldeouro.lol:** Retorna um deployment com **id completo** `dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX` e **URL** `https://goldeouro-player-m38czzm4q-goldeouro-admins-projects.vercel.app`. Ou seja, o **identificador interno** do deployment contém “FyKKeg6zb”; a **URL pública** desse mesmo deployment usa o slug **m38czzm4q** (49d).
- **Conclusão:** O deployment “FyKKeg6zb” **existe** no sentido de que há um deployment com id `dpl_FyKKeg6zb...`, acessível pela URL com slug **m38czzm4q**. O slug “FyKKeg6zb” na URL de preview não é o mesmo que o slug m38czzm4q; por isso a URL com FyKKeg6zb retorna 404. Para “congelar no FyKKeg6zb”, na prática deve-se **promover o deployment m38czzm4q** (ou o deployment que o Dashboard mostrar como aquele com id contendo FyKKeg6zb) para produção, se for o build desejado.

---

## A) Snapshot Vercel (resumo)

- **Projeto que serve goldeouro.lol / www / app:** **goldeouro-player** (Vercel). Confirmação: `vercel projects ls`, `vercel inspect www.goldeouro.lol`, headers do /game (server: Vercel).
- **Domínios:** `vercel domains ls` mostra apenas **goldeouro.lol** (raiz); www e app são aliases do projeto.
- **Deployments:** Coletados 39 production deployments (vercel-deployments-50.json). Mais recente na lista: **ez1oc96t1** (1d). **vercel inspect** em www retornou **m38czzm4q** (49d, id dpl_FyKKeg6zb...).
- **Fingerprint /game:** Em game-fingerprint.json: status 200, headers (server, x-vercel-id, x-vercel-cache), sha256 do HTML, bundle index-qIGutT6K.js / index-lDOJDUAS.css.

---

## B) Por que “virou current” — mecanismo e evidências

- **Mecanismo:** Produção atrelada à branch **main**; qualquer push/merge em main pode disparar um dos dois workflows que rodam **vercel com `--prod`** (ou `--prod --yes`). Não há passo de “approve” nem gate que impeça a promoção.
- **Evidências no repositório:**

| Arquivo | Trecho / evidência |
|--------|---------------------|
| `.github/workflows/frontend-deploy.yml` | `if: github.ref == 'refs/heads/main'`; job `deploy-production`; `vercel-args: '--prod --yes'`; `working-directory: goldeouro-player` |
| `.github/workflows/main-pipeline.yml` | `on: push: branches: [ main ]`; step “Deploy Frontend (Vercel)”: `npx vercel --prod --yes` em `working-directory: ./goldeouro-player` |
| `.github/workflows/deploy-on-demand.yml` | `workflow_dispatch`; `vercel-args: "--prod"` (deploy manual) |
| `.github/workflows/rollback.yml` | Em falha do main-pipeline, promove penúltimo deployment com `vercel promote` |

- **vercel.json:** Referenciado em `goldeouro-player/vercel.json` e `player-dist-deploy/vercel.json`; não foi alterado nesta auditoria. Não há evidência de que force produção; o comportamento de prod vem dos workflows.

---

## C) Guardrails recomendados (não aplicados)

1. **Production freeze (recomendado)**  
   - Produção só muda por **promote manual** no Vercel Dashboard (ou via CLI em pipeline aprovado), após checklist (smoke test / login / /game).  
   - Remover ou condicionar **todos** os `--prod` automáticos nos workflows que rodam em push para `main`.

2. **Bloquear deploy automático em produção**  
   - Em **frontend-deploy.yml:** trocar `vercel-args: '--prod --yes'` por `vercel-args: '--target preview'` no job que roda em `main`, **ou** remover o step de deploy em main e deixar apenas em `workflow_dispatch` com input de confirmação.  
   - Em **main-pipeline.yml:** remover o step “Deploy Frontend (Vercel)” ou substituir por `vercel` **sem** `--prod` (apenas preview). Assim, push em main gera apenas preview; produção só muda por promote explícito.

3. **Manter previews sem tocar produção**  
   - Já existe em **frontend-deploy.yml** para branch `dev`: `vercel-args: '--target preview'`. Para `main`, manter apenas deploy como **preview** (sem `--prod`) e usar o Dashboard (ou um job aprovado manualmente) para “Promote to Production” do deployment desejado.

4. **Release tag / commit pin para reproduzir FyKKeg6zb**  
   - O deployment com id `dpl_FyKKeg6zb...` corresponde à URL com slug **m38czzm4q** (criado Jan 16 2026, 49d atrás). Para reproduzir o mesmo build caso o deployment expire: (a) no Vercel Dashboard, projeto goldeouro-player, localizar o deployment m38czzm4q e anotar o commit/ref se disponível; ou (b) no repositório, identificar o commit da data próxima a 16/01/2026 que alterou `goldeouro-player/`, fazer checkout e um novo deploy como **preview**, validar e então promover a produção. Não executado nesta auditoria.

---

## D) Plano cirúrgico mínimo para congelar produção

(Sem executar; apenas documentado.)

1. **Decidir qual deployment é o “congelado”**  
   - Se for o build associado ao id FyKKeg6zb: no Vercel Dashboard, projeto **goldeouro-player**, abrir Deployments e localizar o deployment cuja URL contém **m38czzm4q** (ou o que o inspect associar a `dpl_FyKKeg6zb...`). Confirmar que é o build desejado (ex.: testar /game, login, sem barra de versão indesejada).

2. **Promover esse deployment para Production**  
   - No deployment escolhido, usar **“Promote to Production”**. Assim, os aliases (www/app/goldeouro.lol) passam a apontar para esse deployment até a próxima promoção.

3. **Impedir que CI mude produção de novo**  
   - Aplicar os guardrails acima: remover ou alterar `--prod` nos workflows que rodam em push para `main`, deixando apenas preview; produção só muda por promote manual (ou pipeline aprovado com checklist).

4. **Opcional: invalidar cache**  
   - Se após o promote ainda houver cache antigo: no Vercel Dashboard, projeto goldeouro-player, Settings → Cache / Edge, invalidar conforme documentação Vercel.

---

## Checklist de validação pós-mudança (não executado)

- [ ] Abrir https://www.goldeouro.lol/game em aba anônima e confirmar layout esperado (sem “outra app”, sem barra de versão indesejada).
- [ ] Testar login (fluxo completo) e confirmar que não quebra.
- [ ] Confirmar headers: `server: Vercel` e, se disponível, que o deployment servido é o esperado (ex.: via vercel inspect ou x-vercel-id).
- [ ] Comparar fingerprint: SHA256 do HTML e nome do bundle (index-*.js) com o valor de referência (ex.: game-fingerprint.json atual ou do backup FyKKeg6zb).
- [ ] Confirmar que nenhum workflow está rodando `--prod` em push para main sem aprovação (revisar frontend-deploy.yml e main-pipeline.yml após alterações).

---

## Anexos (todos em docs/relatorios/)

| Arquivo | Conteúdo |
|--------|----------|
| **vercel-projects.json** | Projetos do time; qual serve goldeouro.lol / www / app |
| **vercel-domains.json** | Domínios (goldeouro.lol) |
| **vercel-deployments-50.json** | 39 production deployments; FyKKeg6zb (404 na URL direta); resultado de vercel inspect |
| **game-fingerprint.json** | Headers, sha256 HTML, bundle JS/CSS de /game e /dashboard |
| **pipeline-scan.json** | Workflows que usam vercel e flags --prod / preview |

---

**Fim do relatório. Nenhuma alteração foi feita em código, Vercel, Fly ou Supabase.**
