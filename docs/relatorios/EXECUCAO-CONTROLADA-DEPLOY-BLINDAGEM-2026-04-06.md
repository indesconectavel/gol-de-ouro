# Execução controlada — deploy blindagem working-directory (2026-04-06)

**Projeto:** Gol de Ouro — monorepo `gol-de-ouro`  
**Objetivo:** commit → tag → deploy → verificação real de produção.

---

## 1. Commit aplicado (SHA)

| Momento | SHA | Descrição |
|--------|-----|-----------|
| Commit inicial na branch CI (PR #50) | `9fca7acd5f238d7c913621d4a68bb146610025a6` | Adicionava `working-directory: ./goldeouro-player` no deploy de produção. |
| Merge em `main` (PR #50) | `39eedb81a183a2bad9f6aa90e13c610e5a77774c` | Integração via PR (push directo a `main` bloqueado por política de branch). |
| Correção duplicação de path (PR #51) | `316b7a1` (branch) → merge `a210531aa3db83b5869e19ec08fb1102c1b543fc` em `main` | Remoção de `working-directory` no step `amondnet/vercel-action` de produção: a CLI combinava Root Directory do projeto na Vercel com o path local e gerava `…/goldeouro-player/goldeouro-player` (erro no run `24037786737`). |

**HEAD `main` após correção:** `a210531aa3db83b5869e19ec08fb1102c1b543fc`.

---

## 2. Tag criada

- **Nome:** `pipeline-blindagem-working-directory-2026-04-06`
- **Nota:** tag criada localmente antes do push bloqueado a `main`; push da tag para `origin` foi aceite. O conteúdo dessa tag pode não coincidir com o merge final em `main` — usar sempre o SHA de `main` acima como referência canónica do pipeline.

---

## 3. Status do deploy

| Run | Workflow | Resultado | Link |
|-----|----------|-----------|------|
| `24037786737` | Frontend Deploy (Vercel) | **failure** — step `📤 Deploy Vercel (produção)` | [Run](https://github.com/indesconectavel/gol-de-ouro/actions/runs/24037786737) |
| `24037962015` | Frontend Deploy (Vercel) | **failure** — deploy Vercel OK; falhou no gate `🛡️ Gate blindagem — deep links SPA` | [Run](https://github.com/indesconectavel/gol-de-ouro/actions/runs/24037962015) |

**Tempo aproximado** do run `24037962015` (job Deploy Produção): ~1m24s até falha no gate SPA.

---

## 4. Evidência de produção

**URL:** `https://www.goldeouro.lol/dashboard`

Verificação com `curl` (2026-04-06, após deploy com PR #51):

- **HTTP:** `404 Not Found` (não 200).
- **Header:** `x-vercel-error: NOT_FOUND` presente.
- **Contraste:** `https://www.goldeouro.lol/` responde **200** com `Content-Type: text/html`.

Conclusão: o deep link `/dashboard` **não** está a ser servido como SPA no edge com HTML 200; o gate de CI reproduz o mesmo comportamento.

---

## 5. Comparação antes vs depois

| Aspeto | Antes desta execução | Depois |
|--------|----------------------|--------|
| `working-directory` no step Vercel produção | Não estava no merge inicial alvo | Adicionado no PR #50 → **falha** de deploy (path duplicado). Removido no PR #51 → deploy CLI **conclui**. |
| `/dashboard` em produção | 404 / `NOT_FOUND` (relatado) | **Continua** 404 / `NOT_FOUND` à data da verificação. |
| Workflow `frontend-deploy` em `main` | — | Falha no gate SPA mesmo com deploy concluído (run `24037962015`). |

---

## 6. Conclusão

A alteração de `working-directory` no `amondnet/vercel-action` **não** é compatível com a combinação actual de **Root Directory** na Vercel + resolução de path da action (duplicação). A remoção restaura o deploy pela CLI, mas **não** resolve o problema de routing SPA em `/dashboard` observado em produção.

**Estado da validação de runtime (deep link canónico):** ❌ **Não validado** — critério de 200 + ausência de `x-vercel-error: NOT_FOUND` **não** cumprido.

---

*Fim do relatório.*
