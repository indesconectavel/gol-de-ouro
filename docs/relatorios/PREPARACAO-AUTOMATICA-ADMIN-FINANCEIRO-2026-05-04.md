# PREPARAÇÃO AUTOMÁTICA — ADMIN FINANCEIRO

**Data:** 2026-05-04  
**Relatórios-base:**  
- `docs/relatorios/DIAGNOSTICO-READONLY-ADMIN-SAQUES-2026-05-04.md`  
- `docs/relatorios/PRE-EXECUCAO-BLOCO-FINANCEIRO-SAQUES-MANUAIS-2026-05-04.md`  
- `docs/relatorios/DIAGNOSTICO-READONLY-PAINEL-ADMIN-COMPLETO-2026-05-04.md`  

**Escopo desta preparação:** apenas snapshot Git (branch, tag, hash), inventário de ficheiros críticos e critérios GO/NO-GO. **Nenhuma** alteração de lógica, remoção de mocks, novos endpoints ou migrations foi aplicada como parte deste passo.

---

## 1. Resumo executivo

Foi criada a branch de trabalho **`fix/admin-financial-integrity-v1`** a partir da posição então atual do repositório, e a tag de segurança **`pre-admin-financial-integrity-2026-05-04`** apontando ao **commit base** `68f89291f0e3ee57c20dd19165a77b6d0167474f`. O working tree estava **suja**: ficheiros modificados não commitados e muitos ficheiros não rastreados (incluindo documentação e temporários).

Para **iniciar correção cirúrgica com risco controlado**, recomenda-se **limpar ou isolar** alterações locais (stash, commit WIP em branch separado, ou `.gitignore` para `.tmp_*`) e **confirmar push** da tag no remoto quando a equipa estiver alinhada.

---

## 2. Branch atual

| Momento | Branch |
|---------|--------|
| Antes da preparação | **`hotfix/saque-manual-v1`** (aligned com `origin/hotfix/saque-manual-v1`) |
| Depois da preparação | **`fix/admin-financial-integrity-v1`** (HEAD no mesmo commit que a tag) |

---

## 3. Branch criada

| Nome | Comando equivalente |
|------|---------------------|
| **`fix/admin-financial-integrity-v1`** | `git checkout -b fix/admin-financial-integrity-v1` |

A branch contém o mesmo **commit** que `hotfix/saque-manual-v1` tinha no momento da operação; alterações locais não commitadas permanecem no working tree.

---

## 4. Tag de segurança criada

| Nome | Referência |
|------|------------|
| **`pre-admin-financial-integrity-2026-05-04`** | `git tag pre-admin-financial-integrity-2026-05-04` |

`git rev-parse pre-admin-financial-integrity-2026-05-04` → **`68f89291f0e3ee57c20dd19165a77b6d0167474f`**

> **Nota:** A tag foi criada como tag **leve** (sem `-a`). Para auditoria forte, pode recriar-se como anotada (`git tag -a ... -m "..."`) no mesmo commit, após acordo da equipa.

---

## 5. Hash base antes da cirurgia

| Campo | Valor |
|--------|--------|
| **Commit (hash completo)** | `68f89291f0e3ee57c20dd19165a77b6d0167474f` |
| **Branch origem registada** | `hotfix/saque-manual-v1` |

---

## 6. Estado do git status

**Registado no momento da preparação após criar branch/tag:**

- **Working tree:** **suja**
- **Modificados (não staged):**
  - `database/shoot_apply_atomic_transaction.sql`
  - `docs/relatorios/PREPARACAO-AUTOMATICA-FLUXO-JOGADOR-2026-04-02.md`
  - `goldeouro-player/vercel.json`
- **Não rastreados:** grande conjunto incluindo múltiplos `.tmp_*`, vários `.md` sob `docs/`, pastas novas sob `docs/`, ficheiros `database/` adicionais, etc.

*Não foram executados `git add`, `git commit` nem `push` nesta preparação automática.*

---

## 7. Arquivos críticos confirmados

| Caminho esperado | Existe |
|-----------------|--------|
| `server-fly.js` | Sim |
| `src/domain/payout/processPendingWithdrawals.js` | Sim |
| `controllers/adminWithdrawController.js` | Sim |
| `goldeouro-admin/src/AppRoutes.jsx` | Sim |
| `goldeouro-admin/src/config/api.js` | **Não** *(o cliente HTTP público efetivo no diagnóstico é `goldeouro-admin/src/js/api.js`)* |
| `goldeouro-admin/src/js/api.js` | Sim |
| `goldeouro-admin/src/pages/SaqueUsuarios.jsx` | Sim |

---

## 8. Riscos antes da cirurgia

| Risco | Descrição |
|-------|-----------|
| **Árvore suja** | Commits cirúrgicos podem misturar-se com alterações locais não relacionadas. |
| **Tag só local** | Sem `git push origin pre-admin-financial-integrity-2026-05-04`, rollback por tag não está partilhado com o equipa/remoto. |
| **Temporários e segredos** | Ficheiros `.tmp_*` listados pelo `git status` podem conter dados sensíveis — não devem ser commitados. |
| **`config/api.js` inexistente** | Checklists que referenciarem esse caminho devem usar `js/api.js` ou criar apenas na fase de correção deliberada. |

---

## 9. Critério para iniciar correção

Considerar **GO** apenas quando, no mínimo:

1. Decisão explícita sobre **stash/commit** das alterações atuais ou trabalho apenas a partir do commit da tag sem ficheiros pendentes críticos.
2. **`git push origin fix/admin-financial-integrity-v1`** e **`git push origin pre-admin-financial-integrity-2026-05-04`** (ou política equivalente da equipa).
3. Backup ou snapshot Supabase já planeado conforme relatório financeiro pré-execução.

Enquanto o working tree permanecer **suja** e a tag **não** estiver no remoto: **NO-GO** ou **GO condicionado** (apenas trabalho exploratório local).

---

## 10. Rollback

| Passo | Ação |
|--------|------|
| **Código** | `git checkout pre-admin-financial-integrity-2026-05-04` ou `git reset --hard 68f89291f0e3ee57c20dd19165a77b6d0167474f` **(destructivo ao working tree)** |
| **Branch** | Voltar para `hotfix/saque-manual-v1` ou manter apenas a branch de fix abandonada |
| **Remoto** | Reverter merge/deploy da imagem que corresponda ao hash base |
| **Base de dados** | Conforme PITR/backup já definido nos relatórios de pré-execução financeira — **não** coberto por esta tag apenas |

---

*Fim do relatório de preparação automática.*
