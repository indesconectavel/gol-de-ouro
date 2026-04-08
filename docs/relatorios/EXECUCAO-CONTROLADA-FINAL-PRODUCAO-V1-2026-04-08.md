# EXECUÇÃO CONTROLADA FINAL — PRODUÇÃO — GOL DE OURO PLAYER

**Data:** 2026-04-08  
**Timezone de referência:** America/Sao_Paulo (horários da Vercel CLI)

---

## 1. Resumo executivo

Foi identificado o **deployment candidato** construído a partir do commit **`2785aae`** (branch **`diag/vercel-edge-spa-deep-2026-04-08`**), com `vercel.json` **sem `cleanUrls`** e com **`routes` + `{ "handle": "filesystem" }`** + fallback SPA. O **Gate técnico (A)** foi **aprovado** em preview. O **Gate visual (B)** foi tratado por **evidência objetiva** (rotas no código-fonte + shell HTML), sem substituir revisão humana de pixels.

A promoção via `vercel promote` **não** reatribuiu automaticamente os domínios de produção; os aliases **`www`**, **`app`** e **apex** foram atualizados com **`vercel alias set`** para o deployment aprovado. A produção **`https://www.goldeouro.lol`** passou a responder **200** `text/html` nas rotas profundas testadas, **sem** `X-Vercel-Error: NOT_FOUND`.

Foi criada a tag Git **`prod-vercel-edge-spa-fix-2026-04-08`** apontando para **`2785aae`**.

---

## 2. Deployment candidato identificado

| Campo | Valor |
|--------|--------|
| **Deployment ID** | `dpl_CgeiUWMTv9YgvCLrqiVBtZY6kRN1` |
| **URL canónica** | `https://goldeouro-player-kw6v6gxh5-goldeouro-admins-projects.vercel.app` |
| **Branch Git** | `diag/vercel-edge-spa-deep-2026-04-08` |
| **Commit SHA** | `2785aae1b674cc7c6d73d40a7dda5db8e7b3a29c` |
| **Mensagem** | `fix(vercel): remover cleanUrls que neutralizava fallback SPA no edge` |
| **Criado (CLI)** | 2026-04-08 ~18:43 -0300 |
| **Motivo da escolha** | Único commit remoto que remove **`cleanUrls`** mantendo **`routes` + filesystem**; preview **deployado explicitamente** após `git checkout 2785aae` para garantir correspondência byte-a-byte com o artefacto testado. |

**Nota:** O branch `fix/vercel-edge-baseline-protegida-2026-04-08` em **`036e7a4`** **ainda continha** `"cleanUrls": true` e **não** era candidato seguro até merge do fix.

---

## 3. Gate técnico do preview

Base: `https://goldeouro-player-kw6v6gxh5-goldeouro-admins-projects.vercel.app`

| Rota | Status | Content-Type | `X-Vercel-Error` | Resultado |
|------|--------|--------------|------------------|-----------|
| `/` | 200 | `text/html; charset=utf-8` | ausente | OK |
| `/game` | 200 | `text/html; charset=utf-8` | ausente | OK |
| `/dashboard` | 200 | `text/html; charset=utf-8` | ausente | OK |
| `/profile` | 200 | `text/html; charset=utf-8` | ausente | OK |
| `/register` | 200 | `text/html; charset=utf-8` | ausente | OK |

**Gate A:** **APROVADO**

---

## 4. Gate visual do preview

| Critério | Como foi validado | Resultado |
|----------|-------------------|-----------|
| `/game` → experiência baseline (`GameFinal`) | `git show 2785aae:goldeouro-player/src/App.jsx` — `<Route path="/game"` com `<GameFinal />` | **Atende** |
| Ausência de barra/banner no HTML inicial | Corpo de `/game` guardado (~1323 bytes): `<!doctype html>`, sem substring óbvia de banner no shell | **Atende** (HTML estático) |
| Sem troca para `GameShoot` em `/game` | Mesmo ficheiro `App.jsx` — `/gameshoot` usa `GameShoot`, `/game` usa `GameFinal` | **Atende** |
| Regressão pixel-perfect | Não realizável de forma automatizada neste ambiente | **Ressalva:** recomenda-se smoke manual em browser |

**Gate B:** **APROVADO por critérios objetivos** com **ressalva** de validação visual humana opcional.

---

## 5. Estado Git/local antes da promoção

- **HEAD:** `2785aae` (detached para deploy reproduzível), depois retorno a `diag/vercel-edge-spa-deep-2026-04-08`.
- **Árvore:** limpa; commit **`2785aae`** presente no remoto (`origin/diag/...`).

---

## 6. Commit e/ou tag final

| Item | Valor |
|------|--------|
| **Commit de referência** | `2785aae1b674cc7c6d73d40a7dda5db8e7b3a29c` |
| **Tag** | `prod-vercel-edge-spa-fix-2026-04-08` (anotada, enviada a `origin`) |

Não foi criado commit novo com a mensagem `fix(vercel): remover cleanUrls para restaurar deep links SPA sem regressão` — o commit **`2785aae`** já cumpria essa função.

---

## 7. Operação executada na Vercel

| Passo | Comando / efeito |
|--------|------------------|
| 1 | `vercel promote goldeouro-player-kw6v6gxh5-…` — criou registo de promoção no painel; **não** moveu aliases de produção por si só. |
| 2 | `vercel alias set … www.goldeouro.lol` |
| 3 | `vercel alias set … app.goldeouro.lol` |
| 4 | `vercel alias set … goldeouro.lol` |

**Deployment final servido pelos domínios:** `goldeouro-player-kw6v6gxh5-goldeouro-admins-projects.vercel.app` (`dpl_CgeiUWMTv9YgvCLrqiVBtZY6kRN1`).

**Produção anterior (rollback):** `goldeouro-player-lotclbdh2-goldeouro-admins-projects.vercel.app` (`dpl_3iVanunU1N6y3bZAVxF58usfVf5f`).

---

## 8. Verificação real de produção

Base: `https://www.goldeouro.lol` (após aliases)

| Rota | Status | Content-Type | `X-Vercel-Error` | Resultado |
|------|--------|--------------|------------------|-----------|
| `/` | 200 | `text/html; charset=utf-8` | ausente | OK |
| `/game` | 200 | `text/html; charset=utf-8` | ausente | OK |
| `/dashboard` | 200 | `text/html; charset=utf-8` | ausente | OK |
| `/profile` | 200 | `text/html; charset=utf-8` | ausente | OK |
| `/register` | 200 | `text/html; charset=utf-8` | ausente | OK |

---

## 9. Verificação visual de produção

- **Automática:** mesma base que o Gate B (código em `2785aae` + shell HTML).
- **Manual:** recomendada pelo operador (login, HUD, `/game`).

---

## 10. Rollback disponível

```text
vercel alias set goldeouro-player-lotclbdh2-goldeouro-admins-projects.vercel.app www.goldeouro.lol
vercel alias set goldeouro-player-lotclbdh2-goldeouro-admins-projects.vercel.app app.goldeouro.lol
vercel alias set goldeouro-player-lotclbdh2-goldeouro-admins-projects.vercel.app goldeouro.lol
```

(Validar HTTP após rollback.)

---

## 11. Se houve rollback

**Não.** Nenhum rollback foi necessário após verificação HTTP em produção.

---

## 12. Diagnóstico final

- **Deep links:** corrigidos na produção ao remover **`cleanUrls`** e manter o fallback com **`routes` + filesystem**.
- **Baseline visual (código):** preservada no commit **`2785aae`** relativo a `a3fff5e` + apenas `vercel.json`/docs do ramo de diagnóstico.
- **Próximo passo sugerido:** merge de **`2785aae`** (ou `diag/...`) em **`main`** / **`fix/...`** para alinhar o repositório ao que está em produção; smoke manual visual opcional.

---

## Veredicto final obrigatório

**PRODUÇÃO FECHADA COM SUCESSO**
