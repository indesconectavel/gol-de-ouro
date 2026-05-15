# H3.0B — PRÉ-EXECUÇÃO /GAME MOBILE — BACKUP E ROLLBACK

**Data:** 2026-05-15  
**Modo:** READ-ONLY — sem alteração de código, deploy, tag ou ficheiros de produção nesta sessão  
**Branch:** `fix/admin-financial-integrity-v1`  
**HEAD (baseline pré-cirurgia):** `b475647d767854f5fcd06bc43255c8d268392774` (`b475647`) — *docs: registrar H3.0A diagnostico game mobile*  
**Relatório-base:** `docs/relatorios/H3-0A-DIAGNOSTICO-GAME-MOBILE-V1-2026-05-12.md` (versionado em `b475647`)

---

## 1. Resumo executivo

A cirurgia **H3.0B** limita-se ao **frontend player** (`goldeouro-player`), rota **`/game`**, componente **`GameFinal.jsx`** e CSS associado. **Não** toca backend Fly, financeiro, PIX, saques, `layoutConfig.js` (coordenadas de gameplay), `gameService.js` nem `handleShoot`.

O diagnóstico H3.0A classificou a correção como **CORREÇÃO COM RESSALVAS**: conflito CSS legado vs posicionamento inline, portrait sem gate, safe-area ausente. A pré-execução define **backup por tag Git**, **rollback por revert ou tag**, **rollback Vercel** só no player, e escopo cirúrgico alinhado à **Opção A** (bloquear portrait com overlay — menor risco V1).

**Superfícies não afetadas:** `goldeouro-backend-v2.fly.dev`, workers, webhooks, admin, banco.

**Classificação final (§12):** **PRONTO COM RESSALVAS** — seguro avançar para preparação automática **desde que** a tag `pre-h3-0b-game-mobile-2026-05-12` seja criada **antes** do primeiro commit de código, `goldeouro-player/vercel.json` local **não** entre no diff, e deploy player seja **controlado** (manual ou merge + workflow).

---

## 2. Estado Git

### Comandos executados (2026-05-15)

```text
git status --short
git branch --show-current
git log -5 --oneline
git rev-parse HEAD
```

### Registo

| Campo | Valor |
|-------|--------|
| **HEAD** | `b475647` |
| **Branch** | `fix/admin-financial-integrity-v1` |
| **Últimos commits** | `b475647` H3.0A · `10a25cc` fechamento V1 · `60bae48` F3 · `deec98d` F2 · `fe7b7ac` F1 |
| **Tag `pre-h3-0b-game-mobile-2026-05-12`** | **Ainda não existe** — criar na fase de execução (passo obrigatório) |

### Working tree (fora do escopo H3.0B)

| Estado | Ficheiro / grupo |
|--------|------------------|
| ` M` | `goldeouro-player/vercel.json` — **NÃO** incluir na cirurgia nem no commit H3.0B (CRLF/local) |
| `??` | `database/exec-plano-b-*.sql`, ~18 relatórios maio/2026, 5 `scripts/*`, `AUDITORIA-FORENSE-FINAL-*.md` |

### Impacto no deploy automático

| Workflow | Trigger | Branch atual |
|----------|---------|--------------|
| `frontend-deploy.yml` | `push` em `main` / `dev`, paths `goldeouro-player/**` | **`fix/admin-financial-integrity-v1` não dispara CI Vercel prod** por push |
| `deploy-on-demand.yml` | Backend Fly apenas | Player não deployado por este workflow |

**Implicação:** alterações H3.0B na branch atual **não** vão a produção player até **deploy manual Vercel** ou **merge para `main`** + pipeline. Isso **reduz risco** acidental de produção durante desenvolvimento.

---

## 3. Relatório-base

| Documento | SHA / estado | Uso nesta pré-execução |
|-----------|--------------|-------------------------|
| `H3-0A-DIAGNOSTICO-GAME-MOBILE-V1-2026-05-12.md` | `b475647` | Problemas P1–P6, estratégia mínima, testes T1–T7 |
| `RELATORIO-OFICIAL-FECHAMENTO-V1-GOLDEOURO-2026-05-12.md` | `10a25cc` | V1 operacional; não misturar débito financeiro |
| `AUDITORIA-FORENSE-FINAL-V1-PENDENCIAS-GERAIS-2026-05-12.md` | `??` local | Referência backlog; não versionado |

**Problemas H3.0A → ações H3.0B:**

| ID H3.0A | Ação planeada H3.0B |
|----------|---------------------|
| P1 | Neutralizar `translate(-50%,-50%)` em `.gs-ball` / `.gs-zone` no escopo GameFinal |
| P2 | Isolar regras `#stage-root` / `--pf-*` (não aplicar ao DOM atual) |
| P3 | **Opção A:** JSX + CSS overlay portrait (`.game-rotate`) |
| P4 | `safe-area-inset` em viewport / botões inferiores; opcional `viewport-fit=cover` em `index.html` |
| P5 | HUD compacto em `@media (max-width: 767px)` **dentro** do palco — sem mudar `layoutConfig` targets |
| P6 | Não reativar `useResponsiveGameScene`; documentar no relatório de execução |

---

## 4. Estratégia de backup

### 4.1 Baseline Git (obrigatório antes do 1.º commit de código)

```bash
# Na branch fix/admin-financial-integrity-v1, com working tree limpa de alterações acidentais em vercel.json:
git checkout -- goldeouro-player/vercel.json   # se não for intencional
git tag -a pre-h3-0b-game-mobile-2026-05-12 b475647 -m "Baseline antes H3.0B polimento mobile /game"
git push origin pre-h3-0b-game-mobile-2026-05-12
```

| Item | Valor |
|------|--------|
| **Commit ancorado** | `b475647` |
| **Tag recomendada** | `pre-h3-0b-game-mobile-2026-05-12` |
| **Conteúdo preservado** | `GameFinal.jsx`, `game-scene.css`, `game-shoot.css`, `layoutConfig.js`, `App.jsx`, `index.html` — estado exacto pré-cirurgia |

### 4.2 Backup lógico adicional (opcional, zero risco)

| Método | Quando |
|--------|--------|
| Branch `backup/pre-h3-0b-game-mobile-2026-05-12` apontando a `b475647` | Equipa prefere branch a tag |
| Cópia local dos 3 ficheiros principais | Apenas conveniência; Git é fonte da verdade |

### 4.3 O que o backup **não** precisa cobrir

- Runtime Fly (inalterado)
- Supabase / migrations
- `goldeouro-admin`
- Bundles Vercel já publicados (cobertos por rollback Vercel — §5)

### 4.4 Pré-condição operacional

Antes de editar código:

1. Confirmar `git diff` **vazio** nos ficheiros da cirurgia (ou só mudanças intencionais).
2. **Excluir** `goldeouro-player/vercel.json` do staging (`git restore` ou não `git add`).
3. Criar e **push** da tag §4.1.

---

## 5. Estratégia de rollback

### 5.1 Rollback Git (código)

| Cenário | Comando / ação |
|---------|----------------|
| **Um commit H3.0B** já em branch | `git revert <sha-commit-h3-0b>` — preferido se já pushed |
| **Vários commits** | `git revert <oldest>^..<newest>` ou revert individual |
| **Reset local** (não pushed) | `git reset --hard pre-h3-0b-game-mobile-2026-05-12` |
| **Restaurar ficheiros** | `git checkout pre-h3-0b-game-mobile-2026-05-12 -- goldeouro-player/src/pages/GameFinal.jsx goldeouro-player/src/pages/game-scene.css goldeouro-player/src/pages/game-shoot.css goldeouro-player/index.html` |

**Não usar** `git push --force` em `main` sem decisão explícita de governança.

### 5.2 Rollback Vercel (player produção)

**Domínios:** `www.goldeouro.lol`, `app.goldeouro.lol` (player).

| Método | Passos |
|--------|--------|
| **Dashboard** | Vercel → projeto player (`VERCEL_PROJECT_ID_PLAYER`) → Deployments → deployment anterior estável → **Promote to Production** |
| **CLI** | `vercel rollback` (ver `frontend-rollback-manual.yml` no repo) |
| **Workflow** | `workflow_dispatch` em `frontend-rollback-manual.yml` se secrets configurados |

**Critério:** rollback Vercel **só** se H3.0B tiver sido deployado em produção. Enquanto mudanças ficarem só na branch `fix/admin-financial-integrity-v1`, produção player **permanece** no bundle anterior.

### 5.3 Rollback Fly / backend

**Não aplicável** — H3.0B não altera `server-fly.js`, `fly.toml`, secrets nem workers.

### 5.4 Matriz de impacto no rollback

| Camada | Afetada por H3.0B? | Rollback necessário se regressão? |
|--------|-------------------|-----------------------------------|
| Player Vercel | Sim (após deploy) | Sim — Vercel |
| Backend Fly | Não | Não |
| Financeiro / PIX / saques | Não | Não |
| Admin | Não | Não |
| `/api/games/shoot` | Não (contrato igual) | Não |

---

## 6. Arquivos potencialmente afetados

### 6.1 Caminhos corretos no repositório

O prompt menciona `src/styles/` — no repo actual os CSS do jogo estão em:

| Prompt (referência) | Caminho real |
|---------------------|--------------|
| `src/styles/game-shoot.css` | **`goldeouro-player/src/pages/game-shoot.css`** |
| `src/styles/game-scene.css` | **`goldeouro-player/src/pages/game-scene.css`** |
| `global.css` | **`goldeouro-player/src/index.css`** — só se necessário token global (evitar) |

### 6.2 Núcleo cirúrgico (provável diff H3.0B)

| Ficheiro | Tipo de alteração esperada |
|----------|---------------------------|
| `goldeouro-player/src/pages/GameFinal.jsx` | JSX overlay `.game-rotate`; possível `padding` safe-area no viewport; **sem** mudar `handleShoot` / `gameService` |
| `goldeouro-player/src/pages/game-scene.css` | Regras escopadas `body[data-page="game"] .game-stage`; portrait; safe-area; neutralizar legado `--pf-*` para GameFinal |
| `goldeouro-player/src/pages/game-shoot.css` | Override P1: `.gs-ball` / `.gs-zone` sem `translate(-50%,-50%)` conflituoso no escopo GameFinal |
| `goldeouro-player/index.html` | **Opcional:** `viewport-fit=cover` — só se testado em iOS |

### 6.3 Tocar apenas se inevitável

| Ficheiro | Condição |
|----------|----------|
| `goldeouro-player/src/index.css` | Evitar; preferir escopo `game-scene.css` |
| `goldeouro-player/src/App.jsx` | **Não** — rota `/game` já correcta |

### 6.4 Explicitamente **NÃO** alterar

| Ficheiro | Motivo |
|----------|--------|
| `goldeouro-player/src/game/layoutConfig.js` | Targets BALL/GOALKEEPER/TARGETS — gameplay visual base 1920×1080 |
| `goldeouro-player/src/services/gameService.js` | API `/api/games/shoot` |
| `server-fly.js` / backend | Fora de escopo |
| `goldeouro-player/vercel.json` | Local modificado; não misturar |
| `game-scene-mobile.css`, `useResponsiveGameScene.js` | Legado GameShoot — não ligar sem projeto separado |
| Backups `*_BACKUP_*` | Não editar |

### 6.5 Confirmação `layoutConfig.js`

| Pergunta | Resposta |
|----------|----------|
| Será necessário alterar? | **Não** na onda mínima H3.0B |
| Excepção futura | Só se testes em dispositivo provarem offsets sistemáticos **e** aprovados em cirurgia dedicada |

---

## 7. Decisão de produto

### Opções

| Opção | Descrição | Prós | Contras |
|-------|-----------|------|---------|
| **A** | Bloquear portrait — overlay “Gire o celular” (reutilizar CSS `.game-rotate`) | Menor diff; alinhado a branches históricas `fix/game-locked-16x9`; palco legível em landscape; preserva 1920×1080 | Utilizadores em portrait não jogam até rodar |
| **B** | Portrait com HUD compacto + palco minúsculo | Sem barreira de rotação | P5 permanece; mais CSS; mais testes; maior risco UX |
| **C** | Híbrida (portrait “só visualizar saldo” vs landscape jogo) | Flexível | Mais JSX/lógica; risco de scope creep |

### Recomendação oficial para V1

## **Opção A — bloquear portrait com overlay**

**Justificativa:**

1. **Menor risco** para V1 já fechada com backlog controlado.
2. CSS `.game-rotate` **já existe** em `game-scene.css`; falta apenas JSX — baixo esforço, alto ganho (P3).
3. Jogo 16:9 foi desenhado para **landscape**; scale em portrait (~0,20) é experiência fraca mesmo com HUD compacto.
4. Histórico Git (`feat/game-landscape-safe`, `fix/game-locked-16x9`) suporta intenção de produto.
5. Combina bem com P1 + P4 sem redesenhar economia ou animações.

**Opção B** fica como **H3.1 ou V2 UX** se métricas mostrarem abandono por rotação obrigatória.

---

## 8. Escopo da cirurgia

### 8.1 Entra (H3.0B mínimo)

| # | Item | Referência H3.0A |
|---|------|------------------|
| 1 | Neutralizar conflito `translate(-50%, -50%)` em bola e zonas | P1 |
| 2 | Overlay portrait + mensagem orientação | P3 + Opção A |
| 3 | `env(safe-area-inset-*)` em viewport e/ou `.hud-bottom-*` | P4 |
| 4 | Ajuste HUD mobile (`@media max-width: 767px`) — compactação, wrap controlado | P5 (suporte landscape) |
| 5 | Isolar CSS legado `#stage-root` / `--pf-*` do GameFinal | P2 |
| 6 | Preservar palco **1920×1080** e `calculateScale()` | Arquitectura actual |
| 7 | Preservar coordenadas `layoutConfig` (targets) | Sem alteração |
| 8 | `npm run build` player + testes §10 | Gate qualidade |
| 9 | Relatório `H3-0B-EXECUCAO-CONTROLADA-...` (fase seguinte) | Governança |

### 8.2 Não entra

| Item |
|------|
| Redesenho completo da tela |
| Mudança de gameplay, física, animação de chute |
| Mudança de economia, aposta, prémios |
| Alteração `handleShoot`, fases `GAME_PHASE`, timers de resultado |
| Backend, Fly deploy, webhooks, PIX, saques, ledger |
| Admin, engine V2, novos jogos |
| Ligar `game-scene-mobile.css` / `useResponsiveGameScene` |
| Alterar `layoutConfig.js` |
| Commit de `vercel.json` local |
| Versionar em massa ficheiros `??` da working tree |

---

## 9. Itens fora do escopo

| Área | Estado |
|------|--------|
| Backend / Fly v452 | Intocado |
| `/api/games/shoot` | Intocado |
| Saldo / `novoSaldo` / reconcile financeiro | Intocado |
| PIX / saques / admin / auditoria | Intocado |
| Banco / migrations | Intocado |
| `goldeouro-admin` | Intocado |
| Deploy backend | Intocado |
| Correção saldo UI pós-miss (diag. fluxo jogador) | Cirurgia separada se necessário |
| Screenshots / testes E2E automatizados | Recomendados pós-H3.0B; não bloqueiam tag |

---

## 10. Testes mínimos

### 10.1 Local (obrigatório antes de deploy produção)

| # | Teste | Critério |
|---|-------|----------|
| L1 | `cd goldeouro-player && npm run build` | Exit 0, sem erro de bundle |
| L2 | Desktop Chrome ≥1280px, `/game` autenticado | Palco centrado; 5 zonas alinhadas ao gol; 1 chute sem erro JS crítico |
| L3 | DevTools iPhone — **landscape** | Mesmo que L2; botões Recarregar/mute clicáveis |
| L4 | DevTools iPhone — **portrait** | Overlay “gire o celular” visível; **sem** palco interactivo por baixo (Opção A) |
| L5 | Refresh em `/game` | Sem tela branca; `data-page="game"` no body |
| L6 | Console | Sem erros críticos (warnings aceitáveis documentados) |
| L7 | Regressão rápida `/dashboard`, `/pagamentos` | Navegação OK (smoke leve) |

### 10.2 Dispositivo físico (fortemente recomendado)

| # | Teste |
|---|-------|
| D1 | iPhone Safari landscape — safe-area botões |
| D2 | iPhone Safari portrait — overlay apenas |
| D3 | Android Chrome landscape — 1 chute |

### 10.3 Produção pós-deploy player

| # | Teste | Critério |
|---|-------|----------|
| P1 | `GET https://www.goldeouro.lol/` | HTTP 200 |
| P2 | `GET https://www.goldeouro.lol/game` (shell) | HTTP 200 |
| P3 | Login → `/game` landscape | Jogo jogável; Network: `POST .../api/games/shoot` 200 em chute válido |
| P4 | Portrait | Overlay orientação; não jogar até rodar |
| P5 | Saldo | Após chute, valor coerente com backend (sem alterar lógica — só não regressão) |
| P6 | Backend `/health` | Inalterado — smoke opcional |

**Não exigido nesta cirurgia:** novo deploy Fly, alteração `/meta`, testes admin.

---

## 11. Riscos

| ID | Risco | Prob. | Impacto | Mitigação |
|----|-------|-------|---------|-----------|
| R1 | Commit acidental `vercel.json` | Média | Médio | `git restore` antes da cirurgia; revisar `git diff --cached` |
| R2 | CSS global quebra `/gameshoot` legado | Baixa | Baixo | Escopar com `body[data-page="game"] .game-stage` |
| R3 | Overlay portrait atrapalha tablet portrait | Baixa | Médio | Media query `(orientation: portrait) and (max-width: …)` se necessário |
| R4 | Deploy prod não intencional em `main` | Baixa | Alto | PR dedicada; deploy manual até validação |
| R5 | Alvos ainda desalinhados após P1 | Média | Alto | Teste L2/L3 + dispositivo D1 |
| R6 | Operador esquece tag pré | Média | Médio | Checklist §4.1 bloqueante |
| R7 | Confundir com correção saldo API | Baixa | Alto | Diff limitado a 3–4 ficheiros player |

---

## 12. Classificação final

# **PRONTO COM RESSALVAS**

| Classificação | Aplica? |
|---------------|---------|
| **PRONTO PARA PREPARAÇÃO AUTOMÁTICA** | Parcial — após criar tag e limpar `vercel.json` do staging |
| **PRONTO COM RESSALVAS** | **Sim** |
| **BLOQUEADO** | Não |

### Ressalvas antes de executar H3.0B (código)

1. Criar e publicar tag **`pre-h3-0b-game-mobile-2026-05-12`** em **`b475647`**.
2. Não incluir **`goldeouro-player/vercel.json`** no commit da cirurgia.
3. Adotar **Opção A** (portrait bloqueado) salvo decisão explícita do produto em contrário.
4. Deploy produção player apenas após **L1–L6** (e preferencialmente **D1–D3**).
5. Manter PR/commits **só** com ficheiros §6.2.

### O que será mexido (resumo)

- `GameFinal.jsx` (overlay portrait, safe-area — **não** lógica de chute)
- `game-scene.css`, `game-shoot.css` (P1, P2, P4, P5 landscape)
- Opcional: `index.html` (`viewport-fit=cover`)

### O que **NÃO** será mexido

- `layoutConfig.js`, `gameService.js`, `handleShoot`, backend, Fly, financeiro, admin, banco

### Backup

- Tag Git **`pre-h3-0b-game-mobile-2026-05-12`** → `b475647` (a criar na execução)

### Como voltar atrás

- `git revert` do commit H3.0B **ou** `git checkout` da tag **ou** rollback deployment Vercel anterior

### Testes obrigatórios

- §10.1 local + §10.3 pós-deploy

### Seguro avançar para preparação automática?

**Sim**, com as ressalvas acima cumpridas na **primeira** ação da fase de execução (tag + working tree limpa nos ficheiros da cirurgia).

---

*Pré-execução H3.0B encerrada em modo read-only. Nenhum código, tag ou deploy foi alterado nesta sessão.*
