# Validação final — preview com bypass automatizado (PR #56)

**Data:** 2026-04-09  
**Preview testado:** `https://goldeouro-backend-cl025ubrc-goldeouro-admins-projects.vercel.app`  
**Segredo utilizado nos testes:** fornecido para o projecto **`goldeouro-player`** (dashboard: *Protection Bypass for Automation*). **Valor não reproduzido neste ficheiro** por segurança.

---

## Hipótese explicativa do resultado

O URL do preview contém o prefixo **`goldeouro-backend`**, enquanto o bypass foi configurado em **`goldeouro-player`**. Na Vercel, **cada projecto** tem o seu próprio segredo de *Protection Bypass for Automation*. Um segredo de `goldeouro-player` **não** desbloqueia deployments de `goldeouro-backend`.

Por isso os pedidos com `x-vercel-protection-bypass` continuaram com **401**.

---

## BLOCO 1 — Teste HTTP com bypass

Comandos executados (header e, numa tentativa, query), com o segredo do dashboard **goldeouro-player**:

| Rota | HTTP | Content-Type | X-Vercel-Error | Nota |
|------|------|--------------|----------------|------|
| `/` | **401** | `text/html; charset=utf-8` | ausente | HTML ainda é a página *Authentication Required* |
| `/game` | **401** | idem | ausente | idem |
| `/dashboard` | **401** | idem | ausente | idem |
| `/profile` | **401** | idem | ausente | idem |
| `/register` | **401** | idem | ausente | idem |

**Critério “200 + text/html da app”:** **não** cumprido para este URL com este segredo.

---

## BLOCO 2 — Teste completo (HTML) em `/game`

**401.** Corpo ainda com gate de autenticação Vercel (presença de *Authentication Required*), não o shell da SPA do player.

---

## BLOCO 3 — Validação funcional (indirecta)

**Não aplicável** — HTML não é o bundle da aplicação.

---

## BLOCO 4 — Decisão

**PREVIEW AINDA BLOQUEADO** para o URL **goldeouro-backend-…** com o segredo de **goldeouro-player**.

---

## Próximo passo mínimo

1. No Vercel, abrir o projecto que **gera** o deployment do PR (nome provável **`goldeouro-backend`**, alinhado ao URL).
2. Em **Settings → Deployment Protection → Protection Bypass for Automation**, copiar o segredo **desse** projecto (ou criar um novo).
3. Repetir os `curl` com `x-vercel-protection-bypass` usando **esse** segredo.

Alternativa: validar o PR no URL de preview listado no dashboard **do mesmo projecto** onde o bypass foi criado (`goldeouro-player`), se o GitHub/Vercel estiverem ligados a esse projecto para o repositório.

---

## Segurança

Qualquer segredo mostrado em chat ou captura deve ser considerado **exposto**. Recomenda-se **regenerar** o bypass em *goldeouro-player* após concluir a configuração correcta, se a política da equipa o exigir.

---

## Saída final obrigatória

**PREVIEW BLOQUEADO**

*(Bypass correcto em princípio; **projecto incorrecto** para o URL do preview do PR #56.)*
