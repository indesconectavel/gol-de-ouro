# EXECUÇÃO CONTROLADA — CORREÇÃO DO PIPELINE FRONTEND

**Data:** 2026-04-02  
**Continuidade:** `docs/relatorios/CORRECAO-PIPELINE-DEPLOY-FRONTEND-2026-04-02.md`

---

## 1. Resumo executivo

Foi registado no Git o commit **`46355bc87c508aa595f2996c7bce0d9fcb364a11`** com a **correção do workflow** `.github/workflows/frontend-deploy.yml` e o relatório **`CORRECAO-PIPELINE-DEPLOY-FRONTEND-2026-04-02.md`**.

Foi criada a tag de segurança **`pos-correcao-pipeline-frontend-2026-04-02`** nesse commit e efectuado **push** da branch **`migracao-canonica-gamefinal-main-2026-04-01`** e da tag para **`origin`**.

Este ficheiro (`EXECUCAO-CONTROLADA-…`) foi registado num **commit posterior** e referencia explicitamente o SHA do commit de **pipeline** acima.

---

## 2. Estado local antes do commit

| Item | Valor |
|------|--------|
| **Branch** | `migracao-canonica-gamefinal-main-2026-04-01` |
| **Relação com `origin/main`** | Branch local podia estar atrás/divergente; **não** bloqueou o commit de CI. |
| **Escopo do commit de pipeline** | `.github/workflows/frontend-deploy.yml`, `docs/relatorios/CORRECAO-PIPELINE-DEPLOY-FRONTEND-2026-04-02.md` |
| **Mudanças paralelas fora do escopo** | **Sim:** ficheiros em `goldeouro-player/` modificados; vários `docs/relatorios/*.md` não rastreados — **não** incluídos no commit de pipeline. |
| **Working tree seguro para commit?** | **Sim** para o commit **controlado**: apenas os ficheiros de pipeline foram *staged*; o resto permaneceu por *commitar*. |

---

## 3. Commit realizado (pipeline)

| Campo | Valor |
|--------|--------|
| **Mensagem** | `ci: corrige pipeline de deploy do frontend no vercel` |
| **SHA** | `46355bc87c508aa595f2996c7bce0d9fcb364a11` |
| **Ficheiros** | `.github/workflows/frontend-deploy.yml` (modificado); `docs/relatorios/CORRECAO-PIPELINE-DEPLOY-FRONTEND-2026-04-02.md` (novo) |

---

## 4. Tag criada

| Campo | Valor |
|--------|--------|
| **Nome** | `pos-correcao-pipeline-frontend-2026-04-02` |
| **Alvo** | `46355bc87c508aa595f2996c7bce0d9fcb364a11` (commit de **pipeline** apenas) |
| **Validação** | `git tag --list pos-correcao-pipeline-frontend-2026-04-02`; `git show pos-correcao-pipeline-frontend-2026-04-02` |

---

## 5. Push realizado

| Campo | Valor |
|--------|--------|
| **Branch** | `migracao-canonica-gamefinal-main-2026-04-01` |
| **SHA enviado (cabeça da branch após push)** | `f791f0064fc9b239b4e802e4ff9119fbad88165e` (inclui o commit deste relatório) |
| **Tag enviada** | `pos-correcao-pipeline-frontend-2026-04-02` |

---

## 6. Workflow pronto para validação?

**Sim**, com **ressalvas operacionais**.

- **Justificativa:** o YAML está **corrigido** (sem `--yes`, sem `continue-on-error` nos passos críticos, rastreabilidade e smoke test com falha real). **Enquanto** o commit **`46355bc87c508aa595f2996c7bce0d9fcb364a11`** não estiver **mergeado em `main`**, o workflow **actualizado** não é o que corre em **produção** em pushes a `main`.

---

## 7. Próxima ação recomendada

**Abrir (ou actualizar) PR** para **`main`** incluindo o commit de pipeline **`46355bc87c508aa595f2996c7bce0d9fcb364a11`**, **sem** misturar alterações não relacionadas — e observar o **primeiro run** do workflow em `main` após merge.

---

## 8. Classificação final

**REGISTRADO COM RESSALVAS**

- **Registrado:** commit de pipeline + tag + push; commit de **execução** (este doc) separado.
- **Ressalvas:** a correção **ainda não** está na **`main`** até merge; alterações locais fora do escopo podem permanecer no working tree.

---

## 9. Conclusão objetiva

A **correção do pipeline** está **formalmente registada no Git** no commit **`46355bc87c508aa595f2996c7bce0d9fcb364a11`**, **marcada** pela tag **`pos-correcao-pipeline-frontend-2026-04-02`**. A **protecção** em `main` só fica **completa** quando esse commit (ou linha equivalente) **entra** na `main`.

---

*Fim do relatório de execução controlada.*
