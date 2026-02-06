# Higiene de Release — Tags e Docs

**Data:** 2026-02-06  
**Escopo:** Publicar tags locais no origin + versionar apenas relatórios em `docs/relatorios`.  
**Regras aplicadas:** Nenhum arquivo de código alterado; stash não aplicado; sem build/deploy.

---

## Branch e HEAD

| Item | Valor |
|------|--------|
| **Branch** | feat/payments-ui-pix-presets-top-copy |
| **HEAD (após higiene)** | bb11bf72c1712b3256f1b20d06c0d4ce3c16ae1a |
| **Remote** | origin → https://github.com/indesconectavel/gol-de-ouro.git |

---

## FASE 1 — Tags publicadas

### Evidência: tags ausentes no origin (antes)

- `git ls-remote --tags origin | Select-String` para `PRE_V1_STABLE_2026-02-05-2224`, `missao-e-aprovado`, `v1.2.1` retornou **vazio** → tags não existiam no origin.

### Tags existentes localmente (confirmado)

- `git tag --list PRE_V1_STABLE_2026-02-05-2224` → PRE_V1_STABLE_2026-02-05-2224  
- `git tag --list missao-e-aprovado` → missao-e-aprovado  
- `git tag --list v1.2.1` → v1.2.1  

### Publicação

- `git push origin PRE_V1_STABLE_2026-02-05-2224` → *[new tag] PRE_V1_STABLE_2026-02-05-2224 -> PRE_V1_STABLE_2026-02-05-2224*
- `git push origin missao-e-aprovado` → *[new tag] missao-e-aprovado -> missao-e-aprovado*
- `git push origin v1.2.1` → *[new tag] v1.2.1 -> v1.2.1*

### Evidência: tags presentes no origin (depois)

```
d8ceb3bb65a888069ab8f9d84e6561476b822568	refs/tags/PRE_V1_STABLE_2026-02-05-2224
565dcf92ac6cdc9994157df8814ded6a8e8627e2	refs/tags/missao-e-aprovado
3624a19d2019699e7f0a7f2281e396ae3b414fc6	refs/tags/v1.2.1
```

---

## FASE 2 — Docs versionados

### Arquivos adicionados (somente documentação)

- docs/relatorios/RELEASE-CHECKPOINT/CHANGE2-CHANGE3-versionamento-e-rollback.md  
- docs/relatorios/RELEASE-CHECKPOINT/GIT-AUDIT-CHANGE2-CHANGE3-readonly.md  
- docs/relatorios/RELEASE-CHECKPOINT/GIT-AUDIT-GLOBAL-READONLY.md  

### Commit de docs

- **Hash do commit:** `bb11bf72c1712b3256f1b20d06c0d4ce3c16ae1a` (short: `bb11bf7`)
- **Mensagem:** `docs: adicionar relatórios de auditoria e checkpoint (CHANGE #2/#3)`
- **Alteração:** 3 files changed, 424 insertions(+) — todos em `docs/relatorios/RELEASE-CHECKPOINT/`.

### Confirmação

**Nenhum arquivo de código foi adicionado ou alterado.** Apenas os três arquivos Markdown de relatórios listados acima foram incluídos no commit e no push.

---

## Status final

### git status -sb (após higiene)

```
## feat/payments-ui-pix-presets-top-copy...origin/feat/payments-ui-pix-presets-top-copy
?? docs/relatorios/RELEASE-CHECKPOINT/GIT-GLOBAL-PENDING-AUDIT-readonly.md
```

- Branch sincronizado com origin.  
- Único untracked restante: `GIT-GLOBAL-PENDING-AUDIT-readonly.md` (não incluído no escopo desta higiene).

---

**Relatório gerado em:** docs/relatorios/RELEASE-CHECKPOINT/RELEASE-HYGIENE-TAGS-DOCS-2026-02-06.md
