# GIT.2 — Decisão Segura do Merge Pendente

**Projeto:** Gol de Ouro™ V1
**Modo:** GOVERNANÇA GIT — DECISÃO CONTROLADA
**Data:** 07/07/2026
**Base:** GIT.1 (PASS COM RESSALVAS)
**Estado atual:** merge pendente `origin/main` (`22f75f71`) → `chore/f2-4e-2-mp-log` (`b29d847`)

---

## Resumo Executivo

O merge pendente foi **reconfirmado por evidência do terminal interativo do operador**
(`terminals/1.txt`): o comando `git pull origin main` retornou

```
error: You have not concluded your merge (MERGE_HEAD exists).
hint: Please, commit your changes before merging.
fatal: Exiting because of unfinished merge.
```

→ Não há menção a **conflitos**, apenas a "merge inacabado". Isso é coerente com o GIT.1
(`MERGE_MSG` **sem** seção `# Conflicts:`), reforçando a hipótese de **merge limpo pausado antes do
commit**.

**Limitação:** a REGRA ABSOLUTA deste gate exige coletar a saída de `git status`, `git status --short`,
`git diff --name-status` e `git diff --cached --name-status` **no terminal interativo** antes de decidir.
Esses comandos **ainda não foram executados** (o terminal só registra `flyctl auth` e o `git pull` que
falhou) e o **shell do agente está inoperante** (D0.2), então **não posso coletá-los**. A decisão final
depende dessa coleta.

# Veredito GIT.2: **PASS COM RESSALVAS**

Direção segura definida (árvore de decisão abaixo) e **recomendação preliminar** emitida; a confirmação
depende da revisão humana das 4 saídas read-only.

---

## Garantia crítica — o workflow A2R está protegido em QUALQUER decisão

O arquivo `.github/workflows/a2r-staging-asaas-sandbox.yml` é **untracked** (GIT.1). Portanto:

- `git commit --no-edit` (Opção A) **não o toca** (não está staged).
- `git merge --abort` (Opção B) **não o remove** (abort só reverte arquivos **tracked** para `ORIG_HEAD`;
  untracked são preservados).

→ **Nenhuma das opções perde o workflow.** A decisão A vs B trata apenas de manter ou não a mesclagem de
`origin/main` no branch de trabalho.

---

## Etapa 1 — Status

**Comandos exigidos (a executar pelo operador no terminal interativo — read-only):**

```
git status --short
git status
git diff --name-status
git diff --cached --name-status
```

**Respostas com base na evidência disponível (GIT.1 + terminal + status inicial da sessão):**

| Pergunta | Resposta (preliminar) | Base |
|----------|----------------------|------|
| Existem conflitos? | **Provavelmente NÃO** | `MERGE_MSG` sem `# Conflicts:`; `git pull` não citou conflito; status inicial sem `UU/AA/DD` na porção visível |
| Existem arquivos staged? | **SIM** | Status inicial mostrou `M .cursor/mcp.json` (staged) + mudanças do merge |
| Existem arquivos untracked? | **SIM** | Muitos (incl. o workflow A2R) |
| Mensagem "All conflicts fixed but you are still merging"? | **Provável** (a confirmar) | Coerente com merge limpo pausado |
| Mensagem "you are still merging"? | **SIM (esperada)** | `MERGE_HEAD` existe; `git pull` confirmou "unfinished merge" |

> ⚠️ **Confirmação obrigatória:** o operador deve validar essas respostas rodando os 4 comandos.
> Especialmente a **ausência de "Unmerged paths"** em `git status`.

---

## Etapa 2 — Diff (classificação)

**Comandos:** `git diff --name-status` (working tree vs índice) e `git diff --cached --name-status`
(índice vs HEAD — o que será commitado no merge).

**Classificação com base no estado conhecido (a validar com a saída real):**

| Classe | Arquivos (evidência) | Observação |
|--------|----------------------|-----------|
| **Vindos do merge (`--cached`)** | conteúdo de `origin/main` (`22f75f71`) mesclado sobre `b29d847` | é o que o merge commit consolidaria |
| **Locais antes do merge (unstaged `git diff`)** | `.dockerignore`, `database/patches/V1.1B-M1-R3-*.sql`, `database/shoot_apply_atomic_transaction.sql` | modificações locais **não** relacionadas ao merge |
| **Workflow A2R** | `.github/workflows/a2r-staging-asaas-sandbox.yml` | **untracked** — fora do merge, preservado |
| **Relatórios** | `docs/relatorios/*.md` (D0.1, D0.2, D1.2, D1.3, GIT.1, GIT.2) + snapshots | untracked — fora do merge |
| **Riscos** | mistura de mudanças locais unstaged com o merge; conteúdo desconhecido de `origin/main` | exige revisão do `--cached` antes de finalizar |

---

## Etapa 3 — Decisão (árvore)

Aplicar **após** rodar os 4 comandos:

```
1) git status mostra "Unmerged paths" / conflitos?
   ├─ SIM  → NÃO resolver aqui. Parar e preparar GIT.2C (resolução de conflitos).
   └─ NÃO  → seguir para (2)

2) git status mostra "All conflicts fixed but you are still merging"
   (ou nenhum unmerged path) E git diff --cached contém APENAS
   conteúdo legítimo de origin/main (sem arquivos indevidos/mistura)?
   ├─ SIM  → OPÇÃO A: git commit --no-edit   (finaliza o merge)
   └─ NÃO  → OPÇÃO B: git merge --abort       (cancela; volta a b29d847; nada tracked perdido)
```

### Recomendação preliminar

Com a evidência atual (merge **sem conflitos**, mensagem de merge deliberada
*"Merge branch 'main' ... into chore/f2-4e-2-mp-log"*):

- **Se a mesclagem de `origin/main` no branch era intencional** e o `git diff --cached` estiver limpo
  → **OPÇÃO A — `git commit --no-edit`**.
- **Se o merge não era desejado agora**, ou o `--cached` revelar mistura/arquivos indevidos
  → **OPÇÃO B — `git merge --abort`** (opção mais conservadora; preserva `b29d847` e o workflow untracked).

> Ambos os comandos são **auto-protegidos**: `git commit` **recusa** commitar se houver *unmerged paths*;
> `git merge --abort` **não** remove arquivos untracked. Não há risco de perda do workflow A2R em nenhum caso.

**Nota de contexto (objetivo D1.x):** para publicar depois o workflow em `main`, o merge precisa ser
**resolvido de alguma forma** (A ou B) — ambos desbloqueiam futuros `git checkout main`. A Opção B é o
caminho mais curto para destravar, caso o merge de `origin/main` neste branch de chore não seja um
objetivo em si.

---

## Etapa 4 — Próximos passos (operador — terminal interativo)

1. Coletar (read-only), e colar a saída aqui para análise definitiva:
   ```
   git status --short
   git status
   git diff --name-status
   git diff --cached --name-status
   ```
2. Aguardar a validação da árvore de decisão (Etapa 3).
3. **Só então** executar A **ou** B — nunca antes da inspeção.

---

## Regra Final

Nenhuma ação corretiva foi executada. Nenhum `commit`/`merge --abort`/`reset`/`checkout`/`push`/`add`/
`clean`/`stash`. Gate operou em modo de **decisão/preparação read-only**. O merge permanece pendente e
**seguro** (sem conflitos aparentes). A decisão final (A/B) está condicionada à coleta das 4 saídas git no
terminal interativo. Produção, staging, Fly, Supabase e Vercel intactos.

---

*Relatório emitido em 07/07/2026 — Gate GIT.2 — Gol de Ouro™ V1 — Decisão controlada do merge pendente.*
