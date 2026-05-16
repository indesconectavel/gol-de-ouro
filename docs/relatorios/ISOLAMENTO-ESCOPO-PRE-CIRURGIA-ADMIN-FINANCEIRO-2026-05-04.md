# ISOLAMENTO DE ESCOPO — PRÉ-CIRURGIA ADMIN FINANCEIRO

**Data:** 2026-05-04  
**Branch:** `fix/admin-financial-integrity-v1`

**Objetivo:** garantir working tree limpa para a cirurgia admin/financeiro enquanto se **preserva** alterações fora de escopo no **stash** (com `--include-untracked`), **sem retirar** o commit documental já existente na branch.

---

## 1. HEAD atual

**No momento do `git stash`**, o `HEAD` era o commit documental de preparação admin:

| Referência | Valor |
|------------|--------|
| **HEAD (na operação de stash)** | **`819d31d2317e948c138f1ebee608181aa0e71ea6`** — `docs: registrar preparação admin financeiro pré-cirurgia` |

Após inclusão/amend deste relatório na branch: confirmar sempre com `git log -1 --oneline` e `git rev-parse HEAD` (**título esperado:** `docs: relatório isolamento escopo pré-cirurgia admin financeiro`).

Historicamente: `68f8929 V1: implementar saque manual administrativo` e merges anteriores.

---

## 2. Tag pré-cirurgia

**Nome:** `pre-admin-financial-integrity-2026-05-04`

**Apont para:** **`68f89291f0e3ee57c20dd19165a77b6d0167474f`**  
*(commit **anterior** ao commit documental `819d31d`; é o marcador criado antes do conjunto dos relatórios de preparação/admin.)*

**Pontos em HEAD?** Não — o `HEAD` atual está **uma** revisão à frente da tag (**commit documental**).

---

## 3. Stash criado

```text
stash@{0}: On fix/admin-financial-integrity-v1: stash: fora do escopo antes da cirurgia admin financeiro
```

**Comando usado:**

`git stash push -u -m "stash: fora do escopo antes da cirurgia admin financeiro"`

- `-u` (`--include-untracked`): incorpora ficheiros e pastas ainda não rastreados.  
- O commit **`819d31d`** mantém-se no histórico da branch (**não** foi alterado pelo stash).

**Recuperação futura recomendada** (na altura própria, fora deste relatório):

- `git stash list` — confirmar entrada.  
- `git stash apply "stash@{0}"` ou `git stash pop` — repor alterações quando o escopo o justificar.

---

## 4. Arquivos isolados (resumo)

O stash absorveu, entre outros:

- **Modificados (tracked):**
  - `database/shoot_apply_atomic_transaction.sql`
  - `docs/relatorios/PREPARACAO-AUTOMATICA-FLUXO-JOGADOR-2026-04-02.md`
  - (e `goldeouro-player/vercel.json` onde aplicável ao estado do working tree no momento do stash — aviso CRLF registado pelo Git)

- **Não rastreados:** grande conjunto sob `database/`, `docs/arquitetura/`, `docs/empresa/`, `docs/engine/`, `docs/operacao/`, `docs/pipeline/`, dezenas de `docs/relatorios/*.md`, `docs/releases/`, `docs/sistema/`, etc.

**Estatística indicativa** (saída de `git stash show --stat --include-untracked "stash@{0}"`): da ordem de **~143 ficheiros** e **~19k** linhas adicionadas no conjunto stasheado (inclui documentação em massa e SQL auxiliar).

*(Lista completa muito longa para colar aqui; reproduzir no repositório com o comando acima.)*

---

## 5. Git status final (após stash)

```
On branch fix/admin-financial-integrity-v1
nothing to commit, working tree clean
```

`git status --short` correspondente: **saída vazia.**

---

## 6. Confirmações de comando (referência sessão)

- `git log --oneline -5`: inclui topo `819d31d docs: registrar preparação...` e `68f8929 V1: implementar saque manual administrativo`, etc.
- `git tag --points-at HEAD`: **vazio** (a tag pré-cirurgia **não** está no `HEAD`).
- `git tag --list "pre-admin-financial-integrity-2026-05-04"`: existe a tag nominal.

---

## 7. GO / NO-GO

| Critério | Avaliação |
|----------|-----------|
| Working tree limpa | **GO** |
| Snapshot documental na branch preservado | **GO** (`819d31d`) |
| Material fora do escopo preservado | **GO** (no **stash**) |
| Tag pré-cirurgia alinhada com `HEAD` | **Opcional**: tag marca **baseline anterior** ao commit só docs — compreensível como “antes da última rodada documental”; se a equipa quiser tag no `HEAD` atual, criar segunda tag nomeada (`post-docs-prep-*`). |
| Início da **cirurgia de código** | **GO** apenas após revisão técnica e backup DB conforme pré-execução financeira |

**Classificação geral:** **GO** para fase seguinte (**implementação cirúrgica**) em cima da branch atual, desde que política Supabase/deploy esteja definida.

---

*Fim do relatório.*
