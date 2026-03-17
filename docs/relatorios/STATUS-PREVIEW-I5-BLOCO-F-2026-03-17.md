# STATUS PREVIEW — FASE 1 (IDEMPOTÊNCIA) + BLOCO F (VISUAL)
Data: 2026-03-17  
Branch: feature/bloco-e-gameplay-certified  
Remote: `origin/feature/bloco-e-gameplay-certified` (em sync)

---

## 1. IDÊMPOTENCIA DO CHUTE (FRONTEND)

### 1.1 Verificações

`goldeouro-player/src/services/gameService.js`

- Existe `idempotencyKey` em `processShot`:
  - `const idempotencyKey = \`shot-\${Date.now()}-\${Math.random().toString(36).slice(2)}-\${direction}-\${betValue}\`;`
- O header `X-Idempotency-Key` é enviado:
  - `headers: { 'X-Idempotency-Key': idempotencyKey }`
- Endpoint:
  - `POST /api/games/shoot`

### 1.2 Status das alterações (Git)

- Está commitado? `Não`
- Está apenas local? `Sim`
- Já foi pushado? `Não`

**Risco de perda:** existe working tree sujo; sem commit o código pode ser perdido se ocorrer reset/checkout.

---

## 2. BLOCO F — ALTERAÇÕES VISUAIS DO PLAYER

Arquitetura visual do BLOCO F (principais arquivos):

- `goldeouro-player/src/pages/GameFinal.jsx`
- `goldeouro-player/src/game/layoutConfig.js`
- `goldeouro-player/src/components/InternalPageLayout.jsx`
- `goldeouro-player/src/components/TopBar.jsx`
- `goldeouro-player/src/pages/GameFinal_BACKUP_BLOCO_F_VISUAL_VALIDADO.jsx` (backup/validação visual)

### 2.1 Quais componentes mudaram (no BLOCO F)

- `GameFinal`
  - HUD Header (saldo/chutes/ganhos/gols de ouro)
  - Botões/CTA (`MENU PRINCIPAL`, `Recarregar`, toggle de áudio)
  - Overlays/feedback visual (Gol, Ganhou, Defendeu, Gol de Ouro)
- Layout
  - `layoutConfig.js` define posições/tamanhos em PX fixos (1920x1080), incluindo `STAGE`, `BALL`, `GOALKEEPER`, `TARGETS`, `HUD`, `OVERLAYS`
- HUD / Navegação
  - `InternalPageLayout` (header/footer e sem TopBar)
  - `TopBar` (substitui sidebar fora da rota `/game`)

### 2.2 Status das alterações (Git)

- Está commitado? `Sim` (no HEAD atual da branch)
- Está apenas local? `Não`
- Já foi pushado? `Sim` (HEAD em sync com `origin/feature/bloco-e-gameplay-certified`)

Observação: o deploy/preview gerado pelo Vercel não é verificável somente via Git (depende do pipeline).

---

## 3. PRONTIDÃO PARA DEPLOY (PREVIEW I5)

### 3.1 Checklists

- [ ] PRONTO PARA COMMIT
- [ ] JÁ EM COMMIT
- [ ] JÁ EM DEPLOY

### 3.2 Conclusão

- [ ] PRONTO PARA GERAR PREVIEW
- [x] BLOQUEADO

**Motivo do bloqueio:** a Fase 1 (idempotência) está implementada apenas localmente em `gameService.js` e ainda não foi commitada/pushada.

