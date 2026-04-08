# PREPARAÇÃO AUTOMÁTICA — BASELINE PROTEGIDA — VERCEL EDGE

**Projeto:** Gol de Ouro Player  
**Data:** 2026-04-08  
**Objetivo:** travar um ponto de restauração limpo e rastreável em cima da baseline visual **`a3fff5e`**, sem alterar UI nem aplicar ainda o patch de edge.

---

## 1. Resumo executivo

Foi isolado o trabalho local anterior com **`git stash push -u`**, criado o branch **`fix/vercel-edge-baseline-protegida-2026-04-08`** exatamente em **`a3fff5e`**, confirmada a presença dos ficheiros-chave da baseline, registado um **commit vazio** de snapshot (`chore: snapshot baseline protegida antes da cirurgia de edge`), criada a tag **`pre-vercel-edge-baseline-protegida-2026-04-08`** nesse ponto, e enviados **branch e tag** ao remoto `origin`. O **`main` atual não foi utilizado** como base.

---

## 2. Estado do Git antes

| Item | Valor |
|------|--------|
| **Branch inicial** | `docs/correcao-automatica-runtime-spa-2026-04-06` (tracking `origin/...`) |
| **HEAD antes do isolamento** | `d04cdc56…` |
| **Alterações locais** | Ficheiros modificados (`game-scene.css`, `vercel.json`) e muitos **untracked** (relatórios, `GameFinal.jsx` local, etc.) |
| **Risco evitado** | Misturar essa árvore com a baseline **`a3fff5e`** — resolvido com **stash nomeado** antes do `switch` |

**Stash criado:** `stash@{0}: On docs/correcao-automatica-runtime-spa-2026-04-06: wip: isolamento antes baseline fix/vercel-edge 2026-04-08`

**Nota:** Um processo `git` em segundo plano chegou a deixar **`index.lock`** preso; foi removido após terminar o processo bloqueado, para permitir o checkout limpo.

---

## 3. Baseline protegida usada

| Campo | Valor |
|--------|--------|
| **Commit** | `a3fff5ed93690f39e6083e0b78c921276ce2c57b` (`a3fff5e`) |
| **Branch de origem (produção / build Vercel)** | `feature/bloco-e-gameplay-certified` (referência de auditoria prévia) |

### Ficheiros-chave confirmados no working tree (existência = `True`)

- `goldeouro-player/src/pages/GameFinal.jsx`
- `goldeouro-player/src/pages/game-scene.css`
- `goldeouro-player/src/App.jsx`
- `goldeouro-player/vercel.json`
- `goldeouro-player/src/components/VersionBanner.jsx`
- `goldeouro-player/src/components/VersionWarning.jsx`

---

## 4. Novo branch criado

| Campo | Valor |
|--------|--------|
| **Nome** | `fix/vercel-edge-baseline-protegida-2026-04-08` |
| **Commit base (árvore)** | `a3fff5e` |
| **Confirmação** | `git switch -c … a3fff5e` — HEAD passou a `a3fff5e` neste branch |

---

## 5. Commit de segurança

| Campo | Valor |
|--------|--------|
| **SHA** | `4370fd05e417e860ad81c34f89b514255485c639` |
| **Mensagem** | `chore: snapshot baseline protegida antes da cirurgia de edge` |
| **Tipo** | Commit **vazio** (`--allow-empty`) — **sem alteração de ficheiros**; apenas marca o ponto de partida da cirurgia futura |

---

## 6. Tag criada

| Campo | Valor |
|--------|--------|
| **Nome** | `pre-vercel-edge-baseline-protegida-2026-04-08` |
| **SHA apontado** | `4370fd05e417e860ad81c34f89b514255485c639` (igual ao HEAD do branch após o snapshot) |

---

## 7. Push realizado

| Item | Estado |
|------|--------|
| **Branch** | `fix/vercel-edge-baseline-protegida-2026-04-08` |
| **Tag** | `pre-vercel-edge-baseline-protegida-2026-04-08` |
| **Remoto** | Verificado com `git ls-remote origin` — ambos apontam para **`4370fd0…`** |

Um segundo `git push` idempotente falhou com *reference already exists* — indica que os refs **já estavam** no GitHub (push anterior concluído).

**Commits adicionais (só documentação / relatório):** `0bf2a63` (criação deste ficheiro), `7a632cc` (nota HEAD vs tag). O **HEAD** atual do branch no remoto é **`7a632cc`**; a **tag** `pre-vercel-edge-baseline-protegida-2026-04-08` permanece em **`4370fd0`** (snapshot vazio, sem docs extra).

---

## 8. Rollback disponível

- **Por tag:** `git checkout pre-vercel-edge-baseline-protegida-2026-04-08` (ou `git switch --detach pre-vercel-edge-baseline-protegida-2026-04-08`)
- **Por SHA:** `git reset --hard 4370fd05e417e860ad81c34f89b514255485c639`
- **Restaurar trabalho anterior na branch `docs/…`:** `git switch docs/correcao-automatica-runtime-spa-2026-04-06` e depois `git stash pop` (resolver conflitos se existirem)

---

## 9. Observações críticas

1. **Stash:** O utilizador deve **recuperar** o stash quando voltar à branch de documentação — até lá, as alterações locais anteriores **não** estão no working tree.
2. **Tag vs. documento:** A tag marca **`4370fd0`** (snapshot vazio). Qualquer commit posterior (ex.: só documentação) fica **depois** desse ponto; o rollback “cirúrgico” continua a ser a tag ou o SHA acima.
3. **Próxima etapa:** Aplicar **apenas** o delta de `goldeouro-player/vercel.json` conforme commit **`ae32329`**, com preview e gates HTTP — **sem** misturar o `main` atual nem JSX/CSS.

---

## 10. Pode seguir para cirurgia?

**Sim.** Existe branch limpo na baseline, tag de rollback alinhada ao mesmo commit que o remoto, e isolamento do trabalho paralelo via stash.

---

**PREPARAÇÃO CONCLUÍDA — PRONTO PARA CIRURGIA COM BASELINE PROTEGIDA**
