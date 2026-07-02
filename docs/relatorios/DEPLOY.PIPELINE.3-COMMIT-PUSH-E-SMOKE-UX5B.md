# DEPLOY.PIPELINE.3 — Commit, Push e Smoke Test Visual Autenticado da UX 5B

**Projeto:** Gol de Ouro™ V1  
**Engine:** Indesconectável Payment Engine™  
**Versão:** DEPLOY.PIPELINE.3  
**Data:** 02/07/2026  
**Modo:** GOVERNANÇA GIT + SMOKE TEST VISUAL AUTENTICADO

---

## Resumo Executivo

Esta etapa corrigiu a lacuna de governança Git identificada no `DEPLOY.PIPELINE.2`: a UX 5B já estava online em produção, mas existia apenas no working tree local. Os commits e pushes foram realizados com sucesso nos repositórios corretos.

| Item | Resultado |
|------|-----------|
| Commit Player (monorepo) | ✅ `a92b9de` |
| Commit Admin (repo separado) | ✅ `3371546` |
| Atualização gitlink Admin | ✅ `f59244b` |
| Push GitHub | ✅ Ambos repositórios |
| Produção ainda UX 5B | ✅ Bundles `CF4fHVAl` / `e0382074` |
| Smoke test visual autenticado | ⚠️ Bloqueado por login (sem credenciais no escopo) |

### Veredito Final

# PASS COM RESSALVAS

A UX 5B está **preservada no Git e pushada**, e a produção **continua servindo os bundles certificados**. A ressalva é a impossibilidade de concluir smoke test visual autenticado automatizado (ambas as URLs redirecionam para login; credenciais não disponíveis nesta sessão).

---

## Fase 0 — Auditoria do Working Tree

### Estrutura identificada

| Item | Valor |
|------|-------|
| Repositório principal | `gol-de-ouro` (`origin`) |
| Branch principal | `chore/f2-4e-2-mp-log` |
| HEAD antes dos commits | `f21f310` |
| Admin | Repositório Git **separado** (`goldeouro-admin.git`), rastreado na raiz como **gitlink** (modo `160000`) — **sem** `.gitmodules` |

### Tabela de arquivos UX 5B

| Arquivo | Projeto | Alteração | Commitar? |
|---------|---------|-----------|:---------:|
| `goldeouro-player/src/pages/Withdraw.jsx` | Player | Saque simplificado, banner perfil | ✅ |
| `goldeouro-player/src/pages/Pagamentos.jsx` | Player | Polling 15s, Garantir X chutes, QR | ✅ |
| `goldeouro-player/src/pages/Privacy.jsx` | Player | Remoção referência MP | ✅ |
| `goldeouro-admin/src/pages/SaqueUsuarios.jsx` | Admin | Badges/botões provider-agnostic | ✅ (repo admin) |
| `docs/relatorios/ASAAS.PIPELINE.5B-…md` | Docs | Relatório 5B | ✅ |
| `docs/relatorios/DEPLOY.PIPELINE.2-…md` | Docs | Relatório deploy frontends | ✅ |
| Backend (`server-fly.js`, `src/finance/*`, etc.) | Backend | Fora do escopo | ❌ |
| Centenas de outros `??` / `M` | Vários | Não relacionados UX 5B | ❌ |

**Diff stat UX Player:** 3 arquivos, +182 / −173 linhas.

---

## Fase 1 — Admin como Repositório Separado

| Pergunta | Resposta |
|----------|----------|
| Onde commitar Admin? | `goldeouro-admin/` → `github.com/indesconectavel/goldeouro-admin.git` |
| Branch Admin | `painel-protegido-v1.1.0` |
| É submódulo formal? | **Não** (sem `.gitmodules`); é **gitlink** na raiz apontando para commit do repo admin |
| Raiz precisa atualizar ponteiro? | **Sim** — `git add goldeouro-admin` após commit no repo admin |

---

## Fase 2 — Commit Player

```text
commit a92b9dec2aa05a074fa4331920bc114c9c0f42d5
Author: (local)
Message: chore: preserve UX financeira 5B do player

Arquivos:
  goldeouro-player/src/pages/Withdraw.jsx
  goldeouro-player/src/pages/Pagamentos.jsx
  goldeouro-player/src/pages/Privacy.jsx
  docs/relatorios/ASAAS.PIPELINE.5B-AJUSTES-UX-FINANCEIROS-FINAIS.md
  docs/relatorios/DEPLOY.PIPELINE.2-PUBLICACAO-E-CERTIFICACAO-FRONTENDS.md

5 files changed, 660 insertions(+), 173 deletions(-)
```

---

## Fase 3 — Commit Admin

### Repositório `goldeouro-admin`

```text
commit 3371546d1696d33e8d1b954824127245cfa68229
Branch: painel-protegido-v1.1.0
Message: chore: preserve UX financeira 5B do admin

1 file changed: src/pages/SaqueUsuarios.jsx (+101 / -35)
```

**Push:** `4eda315..3371546  painel-protegido-v1.1.0 -> painel-protegido-v1.1.0`

### Atualização gitlink na raiz

```text
commit f59244b096f0a1dc883376ca51b51b0e101c8a17
Message: chore: update admin submodule to UX 5B

goldeouro-admin: 4eda315 → 3371546
```

---

## Fase 4 — Push Repositório Principal

```text
git push origin chore/f2-4e-2-mp-log
f21f310..f59244b  chore/f2-4e-2-mp-log -> chore/f2-4e-2-mp-log
```

Working tree da raiz permanece com **outros arquivos não commitados** (backend, docs diversos) — **conscientemente fora do escopo** desta etapa.

---

## Fase 5 — Confirmação GitHub

| Repositório | Branch | Commit | Status |
|-------------|--------|--------|--------|
| `indesconectavel/gol-de-ouro` | `chore/f2-4e-2-mp-log` | `f59244b` (HEAD) | ✅ Verificado via `gh api` |
| `indesconectavel/gol-de-ouro` | `chore/f2-4e-2-mp-log` | `a92b9de` (player UX) | ✅ |
| `indesconectavel/goldeouro-admin` | `painel-protegido-v1.1.0` | `3371546` | ✅ Verificado via `gh api` |

### Arquivos no GitHub (refs dos commits)

| Arquivo | Blob SHA (GitHub) |
|---------|-------------------|
| `goldeouro-player/src/pages/Pagamentos.jsx` @ `f59244b` | `cac524f…` |
| `goldeouro-admin/src/pages/SaqueUsuarios.jsx` @ `3371546` | `449d327…` |

Nenhum `dist/` commitado. Nenhum secret detectado nos arquivos desta etapa.

---

## Fase 6 — Smoke Test Visual Player

**URL:** `https://www.goldeouro.lol/pagamentos`

| Verificação | Resultado |
|-------------|-----------|
| HTTP | 200 |
| Bundle em produção | `index-CF4fHVAl.js` (inalterado pós-push Git) |
| Acesso autenticado | ⚠️ Redireciona para `/login` — credenciais não disponíveis |
| Automação browser | SPA não renderizou formulário de login no snapshot (limitação do ambiente) |
| Validação por bundle (proxy visual) | ✅ `Garantir`, `15e3`, `scrollIntoView`, `qr_code_base64`, `complete seus dados cadastrais`; ausente `Mercado Pago` / `CPF ou CNPJ` |

**Evidência visual autenticada:** não capturada (login gate). Recomenda-se validação humana com conta de teste.

---

## Fase 7 — Smoke Test Visual Admin

**URL:** `https://admin.goldeouro.lol/saque-usuarios`

| Verificação | Resultado |
|-------------|-----------|
| HTTP | 200 |
| Bundle em produção | `index-e0382074.js` |
| Acesso autenticado | ⚠️ Redireciona para `/login` |
| Validação por bundle | ✅ `Marcar como Pago Manualmente`, `Aprovar e Enviar PIX`, `Autorizado`, `Pago Manualmente` |

**Nenhum PIX OUT executado** nesta etapa.

---

## Fase 8 — Auditoria de Cache Rápida

| Recurso | Bundle / Header | UX antiga? |
|---------|-----------------|------------|
| Player HTML | `index-CF4fHVAl.js` | ❌ Não — hash novo |
| Admin HTML | `index-e0382074.js` | ❌ Não — hash novo |
| Marcadores 5B no JS | Presentes (PIPELINE.2) | ❌ Não |

**Risco residual PWA:** usuários com app instalado podem precisar de reload extra para atualizar Service Worker. Novos visitantes e hard refresh não veem UX antiga.

---

## Commits Realizados (resumo)

| # | Repositório | Hash | Mensagem |
|---|-------------|------|----------|
| 1 | `goldeouro-admin` | `3371546` | `chore: preserve UX financeira 5B do admin` |
| 2 | `gol-de-ouro` | `a92b9de` | `chore: preserve UX financeira 5B do player` |
| 3 | `gol-de-ouro` | `f59244b` | `chore: update admin submodule to UX 5B` |

---

## Divergências

| # | Item | Impacto | Status |
|---|------|---------|--------|
| D1 | UX publicada antes do commit (PIPELINE.2) | Governança | ✅ Resolvida |
| D2 | Admin sem `.gitmodules` formal | Confusão operacional | ⚠️ Documentada — gitlink funcional |
| D3 | Branch `chore/f2-4e-2-mp-log` ≠ `main` | CI frontend-deploy não disparou | ⚠️ Deploy Vercel foi manual (PIPELINE.2) |
| D4 | Smoke visual autenticado não executado | Validação humana pendente | ⚠️ Aberta |

---

## Riscos Residuais

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| Smoke test visual sem login | Baixa | Operador valida `/pagamentos` e `/saque-usuarios` logado |
| PWA cache em usuários recorrentes | Baixa | Hard refresh / limpar SW |
| Commits em branch feature, não `main` | Média | PR/merge para `main` quando apropriado |
| Teste real PIX OUT ainda pendente | Alta | Próxima etapa operacional |

---

## Critério de Encerramento

| Critério | Status |
|----------|:------:|
| UX 5B commitada | ✅ |
| UX 5B pushada | ✅ |
| Player preservado no Git | ✅ |
| Admin preservado no Git | ✅ |
| Produção ainda mostra UX 5B | ✅ |
| `/pagamentos` validado autenticado | ⚠️ Bundle sim; visual autenticado pendente |
| `/saque-usuarios` validado autenticado | ⚠️ Bundle sim; visual autenticado pendente |
| Nenhum PIX OUT real executado | ✅ |
| Relatório oficial emitido | ✅ |

---

## Veredito Final

# PASS COM RESSALVAS

A UX `ASAAS.PIPELINE.5B` está **preservada no Git** (commits `a92b9de`, `3371546`, `f59244b`) e **pushada** para GitHub. A produção **continua servindo** os bundles certificados (`index-CF4fHVAl.js` / `index-e0382074.js`) com todos os marcadores 5B.

**Ressalva:** smoke test visual autenticado não concluído por exigir credenciais de jogador/admin. Recomenda-se validação humana rápida antes do teste real PIX OUT.

---

## Próximo Passo

Retomar **teste real de PIX OUT via Asaas** (operador humano), após smoke visual logado em `/pagamentos` e `/saque-usuarios`.

---

*Relatório emitido em 02/07/2026 — DEPLOY.PIPELINE.3 — Gol de Ouro™ V1*
