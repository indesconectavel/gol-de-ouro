# Merge final PR #56 — alinhamento de `main` à baseline oficial — 2026-04-09

## 1. Pré-condições (antes do merge)

| Verificação | Estado |
|-------------|--------|
| PR #56 aberto | Sim (`state: OPEN` antes da operação) |
| Mergeável | `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN` |
| Checks relevantes | Conclusões **SUCCESS** (CI, testes, segurança, CodeQL, Vercel status, etc.); jobs de deploy produção/APK em PR **SKIPPED** (esperado) |

## 2. Acção executada

```bash
gh pr merge 56 --repo indesconectavel/gol-de-ouro --merge
```

Estratégia: **merge commit** (não squash, não rebase).

## 3. Resultado no GitHub

| Campo | Valor |
|-------|--------|
| Estado final do PR | **MERGED** |
| **Merge commit** | `277cf1629f41582bdda396b4b3f12668faa314e1` |
| Mensagem | `Merge pull request #56 from indesconectavel/fix/restaurar-baseline-player-2026-04-09` |
| Data (API) | `2026-04-09T18:10:29Z` |

## 4. `main` local e remoto

- **`origin/main`:** `277cf1629f41582bdda396b4b3f12668faa314e1`
- Repositório local: `main` actualizado com **fast-forward** para o mesmo SHA após `git pull origin main`.

## 5. Confirmação do conteúdo do player em `main` (pós-merge)

Verificação por `git show origin/main:…`:

| Requisito | Resultado |
|-----------|-----------|
| `/game` → **`GameFinal`** | Presente em `App.jsx` (rota `/game` com `<GameFinal />`) |
| Gate do banner | `VersionBanner.jsx` / `VersionWarning.jsx` com `VITE_SHOW_VERSION_BANNER !== 'true'` → `return null` |
| `vite.config.ts` | `define` com `import.meta.env.VITE_SHOW_VERSION_BANNER` default `'false'` |
| `vercel.json` | **Sem** `cleanUrls` (grep sem ocorrências) |

**Nota histórica:** `git merge-base --is-ancestor 2785aae main` pode continuar a falhar porque o merge #56 integra a **linha do branch** (incl. saneamento), não um fast-forward do commit único `2785aae`. O **conteúdo** alinha-se à baseline acordada; a equivalência Git byte-a-byte a `2785aae` não é requisito de ancestria linear.

## 6. Efeito operacional esperado

Um **push** a `main` que altere `goldeouro-player/**` dispara o workflow **Frontend Deploy** e um novo **`vercel --prod`**. Com `main` já contendo o player restaurado, o próximo deploy de produção deve **empacotar a mesma linha** que foi promovida manualmente para `2785aae`, reduzindo divergência entre Git e Vercel.

Imediatamente após o merge, o workflow **Frontend Deploy** foi disparado em `main` (ex.: run `24205865469`, estado **in_progress** no momento da operação). Recomenda-se acompanhar até **conclusão** e validar domínios canónicos após o deploy de produção.

## 7. Referências

- PR: https://github.com/indesconectavel/gol-de-ouro/pull/56  
- Restauração prévia em Vercel: `docs/relatorios/RESTAURACAO-PRODUCAO-DEFINITIVA-2026-04-09.md`

---

## Saída final obrigatória

**MAIN ALINHADO COM SUCESSO**
