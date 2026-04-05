# PREPARAÇÃO AUTOMÁTICA — CIRURGIA 1 — ROUTING SPA EM PRODUÇÃO

**Data:** 2026-04-05  
**Branch de trabalho:** `docs/fechamento-enterprise-pipeline-2026-04-04`  
**Remoto:** `origin` → `https://github.com/indesconectavel/gol-de-ouro.git`  
**Âmbito:** checkpoint documental **antes** da cirurgia de routing no edge; **sem** alteração a `vercel.json`, workflows, player funcional ou backend.

---

## 1. Resumo executivo

Foi criado um **ponto de restauração em Git** na branch atual, versionando **apenas** a documentação da linha Cirurgia 1 (diagnóstico read-only, pré-execução e este registo). Foi adicionada **tag anotada de segurança** `pre-cirurgia-routing-spa-producao-2026-04-05` apontando para esse commit. Alterações locais **fora de escopo** (outros relatórios históricos, `GameFinal`, `goldeouro-player/src/game/`, `analytics.js`, etc.) **não** foram incluídas no staging.

A cirurgia de correção do 404 em deep links **não** foi executada nesta etapa.

---

## 2. Estado local antes da preparação

| Verificação | Valor |
|-------------|--------|
| Branch atual | `docs/fechamento-enterprise-pipeline-2026-04-04` |
| Tracking | `up to date` com `origin/docs/fechamento-enterprise-pipeline-2026-04-04` |
| Alterações rastreadas modificadas | Nenhuma |
| Untracked relevantes **para esta cirurgia** | `DIAGNOSTICO-READONLY-CIRURGIA-1-ROUTING-SPA-PRODUCAO-2026-04-05.md`, `PRE-EXECUCAO-CIRURGIA-1-ROUTING-SPA-PRODUCAO-2026-04-05.md` |
| Untracked **excluídos** | Dezenas de `docs/relatorios/*` de outras frentes; `goldeouro-player/src/game/`; `goldeouro-player/src/pages/GameFinal.jsx`; `goldeouro-player/src/utils/analytics.js` |

---

## 3. Arquivos incluídos no staging

- `docs/relatorios/DIAGNOSTICO-READONLY-CIRURGIA-1-ROUTING-SPA-PRODUCAO-2026-04-05.md`
- `docs/relatorios/PRE-EXECUCAO-CIRURGIA-1-ROUTING-SPA-PRODUCAO-2026-04-05.md`
- `docs/relatorios/PREPARACAO-AUTOMATICA-CIRURGIA-1-ROUTING-SPA-PRODUCAO-2026-04-05.md`

---

## 4. Arquivos excluídos do staging

- Todo o restante `docs/relatorios/*.md` não listado em §3  
- `goldeouro-player/src/game/**`  
- `goldeouro-player/src/pages/GameFinal.jsx`  
- `goldeouro-player/src/utils/analytics.js`  

**Motivo:** fora do escopo da preparação da Cirurgia 1 (routing SPA / documentação associada apenas).

---

## 5. Commit criado

- **Mensagem:** `chore: checkpoint pre-cirurgia-routing-spa-producao-2026-04-05`
- **Branch:** `docs/fechamento-enterprise-pipeline-2026-04-04`
- **SHA (identificação):** o commit é o **alvo peeled** da tag `pre-cirurgia-routing-spa-producao-2026-04-05`. Após `git fetch origin tag pre-cirurgia-routing-spa-producao-2026-04-05`:

  ```bash
  git rev-parse pre-cirurgia-routing-spa-producao-2026-04-05^{commit}
  ```

  *(O valor exacto consta também no output de `git push` / resposta operacional da sessão que executou a preparação.)*

---

## 6. Tag de segurança criada

- **Nome:** `pre-cirurgia-routing-spa-producao-2026-04-05`
- **Tipo:** anotada (`git tag -a`)
- **Aponta para:** o commit do §5 (HEAD no momento da criação da tag, após o commit de checkpoint)

---

## 7. Push e confirmação remota

- **Push do branch:** `git push origin docs/fechamento-enterprise-pipeline-2026-04-04`
- **Push da tag:** `git push origin pre-cirurgia-routing-spa-producao-2026-04-05`

**Verificação recomendada no remoto:**

```bash
git ls-remote origin refs/heads/docs/fechamento-enterprise-pipeline-2026-04-04
git ls-remote origin refs/tags/pre-cirurgia-routing-spa-producao-2026-04-05
```

---

## 8. Ponto formal de rollback

**Em Git (código / documentação desta linha):**

```bash
git fetch origin
git checkout pre-cirurgia-routing-spa-producao-2026-04-05^{commit}
# ou branch: git checkout -b recuperacao-pre-cirurgia-routing docs/fechamento-enterprise-pipeline-2026-04-04
```

**Em produção (player):** continua a aplicar a estratégia da Pré-execução — rollback Vercel / promoção do deployment baseline `dpl_p3dBCTxRr…`; este checkpoint **não** substitui esse procedimento.

**Baseline visual oficial** (referência imutável): tag `baseline-player-validada-p3dBCTxRr-2026-04-02`, commit `a3fff5ed93690f39e6083e0b78c921276ce2c57b`.

---

## 9. Classificação final

### PRONTO PARA CIRURGIA

**No plano Git:** checkpoint e tag publicados conforme pedido.  
**Condicionante:** o **GO operacional** da cirurgia no edge continua a exigir o checklist humano (painel Vercel / secrets / projeto correcto) descrito na Pré-execução.

### BLOQUEADO

Não aplicável nesta sessão, desde que o push tenha concluído com sucesso.

---

## 10. Conclusão objetiva

- O repositório regista **apenas** documentação da Cirurgia 1 até ao momento pré-cirúrgico.  
- **Nenhuma** alteração funcional ao player, `vercel.json` ou workflows foi incluída.  
- O **Prompt Cirúrgico** seguinte pode prosseguir para a correção de routing **após** confirmação operacional externa, com rollback Git (esta tag) e rollback Vercel disponíveis em paralelo.

---

*Documento parte integrante do commit de checkpoint `chore: checkpoint pre-cirurgia-routing-spa-producao-2026-04-05`.*
