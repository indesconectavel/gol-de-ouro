# BLOCO F — /game — Validação final de preview (pós-commit `cc1cbc8`)

## Resumo executivo

A verificação confirma que:
- o commit `cc1cbc8` existe e foi publicado;
- o deploy de preview do player está em `success` para esse SHA;
- o CSS compilado do preview contém a correção final de cascata do HUD (`bet-label`, `bet-value-fixed` e escopo `.gs-hud .bet-label`).

Limitação objetiva:
- não foi possível validar visualmente o HUD em runtime autenticado de `/game` nesta sessão (rota protegida; acesso sem sessão redireciona para login/hash e rota direta `/game` retorna 404 de rewrite no host preview).

## Commit validado

Comandos executados:
- `git log --oneline -3`
- `git show --stat cc1cbc8`

Resultado:
- commit existe: `cc1cbc8 fix(game): corrige cascata final do HUD e linha de aposta`;
- `git show --stat cc1cbc8` mostra somente:
  - `goldeouro-player/src/pages/game-scene.css`
  - `goldeouro-player/src/pages/game-shoot.css`
- total: `2 files changed, 20 insertions(+), 3 deletions(-)`.

## Deploy validado

Evidências coletadas via API:
- status do commit `cc1cbc8...`: `state: success` com contextos Vercel de player e backend.
- deployment do player para esse SHA:
  - `environment`: `Preview – goldeouro-player`
  - `state`: `success`
  - `environment_url`: `https://goldeouro-player-pqtf265ak-goldeouro-admins-projects.vercel.app`
  - `created_at`: `2026-03-27T14:59:08Z`
- branch associada ao commit: `origin/feature/bloco-e-gameplay-certified` (`git branch -r --contains`).

Conclusão desta seção:
- deploy de preview está correto para o commit solicitado e branch esperada (evidência indireta por contain + status por SHA).

## /game validado

### Evidência técnica no CSS compilado do preview

Arquivo compilado analisado: `https://goldeouro-player-pqtf265ak-goldeouro-admins-projects.vercel.app/assets/index-CIr_YZKJ.css`

Seletores críticos:
- `body[data-page=game] .hud-header .bet-label{font-size:15px;color:#fff;font-weight:600}` -> **presente**
- `body[data-page=game] .hud-header .bet-value-fixed{font-size:15px;font-weight:600;color:#fbbf24!important}` -> **presente**
- `.gs-hud .bet-label{font-size:12px;color:#a0a0a0;font-weight:600}` -> **presente**
- seletor antigo amplo `body[data-page=game] .hud-header span,body[data-page=game] .hud-header div ...` -> **não encontrado** (forma antiga removida)

### Validação visual direta em runtime

- `https://.../game` (sem hash) retorna `404: NOT_FOUND` no host preview (falta rewrite de SPA nessa URL direta).
- `https://.../#/game` leva ao fluxo de login (rota protegida), sem sessão autenticada não é possível abrir o HUD jogável para inspeção direta.

Portanto:
- HUD maior/legível, cor dourada em runtime, MENU PRINCIPAL e Recarregar: **não comprováveis visualmente nesta sessão**.
- CSS compilado comprova que a correção foi entregue ao preview.

## Classificação final

**APROVADO COM AJUSTES FINOS**

Justificativa:
- parte técnica crítica (commit + deploy + CSS compilado) está confirmada;
- validação visual final do `/game` autenticado ficou limitada pelo acesso/roteamento do preview sem sessão, então não há prova visual completa de runtime neste momento.

