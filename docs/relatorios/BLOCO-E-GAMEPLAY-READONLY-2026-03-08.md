# BLOCO E — GAMEPLAY

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO  
**Referências:** Baseline FyKKeg6zb | Produção atual ez1oc96t1 | Código local

---

## 1. Escopo auditado

| Tipo | Itens |
|------|--------|
| **Backend** | server-fly.js (POST /api/games/shoot, getOrCreateLoteByValue, batchConfigs, lotesAtivos, validação direction/amount, INSERT chutes, UPDATE usuarios.saldo), utils/lote-integrity-validator.js |
| **Frontend** | GameShoot.jsx (zonas, processShot, saldo, overlays GOOOL/DEFENDEU/GOL DE OURO), Game.jsx (não usado em rotas), gameService.js (initialize, processShot, loadUserData), App.jsx (Route /game e /gameshoot → GameShoot) |
| **Documentação** | AUDITORIA-DEFINITIVA-FONTE-DE-VERDADE-LOCAL-VS-PRODUCAO-2026-03-08.md, AUDITORIA-PROFUNDA-CONFLITO-GAME-2026-03-08.md, baseline-frontend-game.json |

---

## 2. Fonte de verdade do bloco

- **Funcional:** GameShoot.jsx + gameService (POST /api/games/shoot) + server-fly.js (lógica de lote, resultado, saldo, chutes). Game.jsx não está em nenhuma rota no App.jsx local.
- **Visual:** GameShoot.jsx é a tela efetivamente montada em /game e /gameshoot. Game.jsx tende a corresponder melhor ao layout descrito no print validado (campo, goleiro, botão Menu) mas não integra com backend; não é a fonte de verdade em uso.
- **Baseline:** baseline-frontend-game.json e docs não identificam qual componente (Game vs GameShoot) estava montado em /game no bundle index-qIGutT6K.js; ambos os códigos estão no bundle (has_game, has_games_shoot).

---

## 3. Evidências concretas

| Evidência | Local |
|-----------|--------|
| Rota /game local | App.jsx 47–51: Route path="/game" element={<ProtectedRoute><GameShoot /></ProtectedRoute>} |
| gameService | gameService.processShot(direction, amount); POST /api/games/shoot; amount === 1 (V1) |
| Backend shoot | server-fly.js ~1088: POST /api/games/shoot; amount validado; lote; isGoal = shotIndex === winnerIndex; INSERT chutes; UPDATE saldo (goal) |
| Game.jsx não em rota | App.jsx: Game importado mas não referenciado em nenhum <Route> |
| AUDITORIA-DEFINITIVA | Comparação Game vs GameShoot; divergência bundle local vs index-qIGutT6K.js |
| Produção atual | ez1oc96t1 serve build do main; /game monta o mesmo código que o local (GameShoot) |

---

## 4. Alinhamento com baseline validada

**Resposta:** **não confirmado**

- Não está documentado qual componente estava em /game no FyKKeg6zb. O bundle index-qIGutT6K.js contém referências a game e games_shoot; não se sabe qual era o componente da rota /game. Elementos esperados (saldo, apostas, campo, goleiro, zonas de chute) estão presentes tanto em Game quanto em GameShoot; a baseline não define qual deles era a “página oficial”.

---

## 5. Alinhamento com produção atual

**Resposta:** **sim**

- Produção atual (ez1oc96t1) é o build do código atual. App.jsx atual monta GameShoot em /game e /gameshoot. Logo, gameplay em produção atual = GameShoot + gameService + POST /api/games/shoot, alinhado ao local.

---

## 6. Diferenças encontradas

| Tipo | Descrição |
|------|------------|
| **Estrutural** | Local usa apenas GameShoot nas rotas de jogo; Game.jsx existe mas não está em rota. Se a baseline tivesse /game → Game, seria divergência; não comprovado. |
| **Visual** | GameShoot: campo 400×300, "Recarregar", "Dashboard". Game: campo em destaque, "Menu principal". Divergência visual entre os dois componentes; em produção atual só GameShoot é usado. |
| **Build** | Bundle local/build ≠ index-qIGutT6K.js (hashes diferentes). Produção atual já serve outro bundle (ez1oc96t1). |
| **Documental** | baseline-frontend-game.json não identifica componente montado em /game. |

---

## 7. Risco operacional

**Classificação:** **médio**

- Risco de homologar “comportamento em produção” quando produção atual não é a baseline (ez1oc96t1 ≠ FyKKeg6zb). Validações de gameplay feitas após a troca de deployment referem-se ao novo build (GameShoot). Se a decisão de produto for “página oficial = Game.jsx”, haveria divergência não documentada na baseline.

---

## 8. Pode usar o local como referência para este bloco?

**Resposta:** **sim, com ressalvas**

- Para **produção atual** (ez1oc96t1): sim — local reflete o gameplay em uso (/game = GameShoot, POST /api/games/shoot). Para **baseline FyKKeg6zb:** não confirmado — não se sabe se /game era Game ou GameShoot; usar local como “referência da produção atual”, não como prova do que estava na baseline.

---

## 9. Exceções que precisam ser registradas

1. **Componente /game na baseline:** Não determinado. Documentação não afirma se FyKKeg6zb usava Game.jsx ou GameShoot.jsx em /game.
2. **Game.jsx legado:** Mantido no código e importado no App mas não usado em rotas; pode induzir confusão em futuras auditorias.
3. **Toasts no jogo:** GameShoot usa toast.success/toast.info; ToastContainer ausente no App (BLOCO F) — feedback de prêmio pode não aparecer.

---

## 10. Classificação final do bloco

**BLOCO ALINHADO COM RESSALVAS**

- Alinhado com **produção atual** (sim). Alinhado com **baseline validada** (não confirmado — componente /game não identificado). Fonte de verdade **funcional** = GameShoot + server-fly.js. Fonte de verdade **visual** na baseline = não determinada. Pode usar local como referência para o comportamento atual (ez1oc96t1), com ressalva de que não representa comprovadamente a baseline.

---

*Auditoria READ-ONLY. Nenhum arquivo ou deploy foi alterado.*
