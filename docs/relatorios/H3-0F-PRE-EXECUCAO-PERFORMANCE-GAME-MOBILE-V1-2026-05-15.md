# H3.0F — PRÉ-EXECUÇÃO PERFORMANCE /GAME MOBILE

**Data:** 2026-05-15  
**Modo:** READ-ONLY (este documento não altera código, deploy, backend nem finanças).  
**Base técnica:** [H3-0E-DIAGNOSTICO-PERFORMANCE-GAME-MOBILE-V1-2026-05-15.md](./H3-0E-DIAGNOSTICO-PERFORMANCE-GAME-MOBILE-V1-2026-05-15.md)  
**Objetivo da fase seguinte (H3.0F execução):** correção **mínima** de performance em `/game` em mobile, com rollback documentado e **zero** mudança de gameplay financeiro.

---

## 1. Estado Git (confirmado nesta pré-execução)

| Item | Valor |
|------|--------|
| **Branch** | `fix/admin-financial-integrity-v1` |
| **HEAD** | `dac9f8ba012c13607116af7bf15d58a95d242c35` |
| **Tracking** | `...origin/fix/admin-financial-integrity-v1` |
| **Alteração local relevante** | `goldeouro-player/vercel.json` — **M** (fora do escopo H3.0F; não misturar no commit de performance sem decisão explícita) |
| **Nota** | Working tree com muitos ficheiros `??` (relatórios, scripts, etc.); **não** são pré-requisito para a execução H3.0F além de manter o diff do player **isolado e revisível** |

---

## 2. Mapeamento de assets pesados em `/game`

### 2.1 Imagens (`goldeouro-player/src/assets/` — importadas em `GameFinal.jsx`)

| Ficheiro | Bytes (aprox.) | Papel |
|----------|----------------|--------|
| `bg_goal.jpg` | 422810 | Fundo do palco |
| `ganhou_5.png` | 325513 | Overlay resultado |
| `gol_de_ouro.png` | 285511 | Overlay resultado |
| `gol_normal.png` | 278907 | Overlay resultado |
| `goalie_dive_tl.png` | 143191 | Sprite goleiro |
| `ball.png` | 129074 | Bola |
| `goalie_dive_tr.png` | 125144 | Sprite goleiro |
| `goalie_dive_mid.png` | 103754 | Sprite goleiro |
| `defendeu.png` | 103368 | Overlay resultado |
| `goalie_dive_br.png` | 100808 | Sprite goleiro |
| `goalie_dive_bl.png` | 99780 | Sprite goleiro |
| `goalie_idle.png` | 95777 | Sprite goleiro |
| `ganhou_100.png` | 247669 | Overlay resultado |

**Total em disco (ordem de grandeza): ~2,15 MiB** neste conjunto (H3.0E). Custo em runtime: **decode GPU/memória**, não só download.

### 2.2 Áudio (`goldeouro-player/public/sounds/` — uso direto ou indireto em `/game`)

| Ficheiro | Bytes (aprox.) | Uso em `/game` |
|----------|----------------|----------------|
| `torcida.mp3` | 763287 | Loop (`crowdAudioRef`) após `loading === false` e não muted |
| `gol.mp3` | 551459 | Gol — `timeupdate` durante reprodução |
| `kick.mp3` | 6245 | Chute |
| `defesa.mp3` | 10466 | Defesa |
| `music.mp3` | 6082388 | Não tocada em `/game` (`musicManager.stopMusic()` na montagem) |
| `torcida_2.mp3` | 1220353 | Fluxo `musicManager` (outras rotas) |

### 2.3 CSS “pesado” em custo perceptual (GPU)

- **`game-scene.css`:** `backdrop-filter: blur(8px)` em `.hud-header`; em portrait, `.rotate-card` com `backdrop-filter: blur(6px)`; animações curtas de loading + entrada do viewport.
- **`game-shoot.css`:** animações `@keyframes` (`gooolPop`, `ganhouPop`, `pop`, `pulse` em `.queue-status` legado).
- **Bundle CSS agregado (produção):** ~**110 KiB** (`index-DMJTzLg7.css` em H3.0E) — inclui estilos globais da app, não só `/game`.

### 2.4 Compositing / geometria (sem alterar `layoutConfig` na execução)

- Palco lógico **1920×1080** com **`transform: scale(gameScale)`** no wrapper (H3.0E) — custo de camada grande; **não** propor mudança de coordenadas em `layoutConfig.js` nesta fase (proibido pelo envelope H3.0F).

### 2.5 PWA / Service Worker

- `vite.config.ts` — precache amplo + `registerSW.js` (H3.0E). Impacto: **cache**, não “FPS” direto; documentar em QA **hard refresh** após deploy.

---

## 3. Correção mínima segura (definição para a execução futura)

**Princípios:**

1. **Não** alterar fluxo de aposta, RPC, `gameService`, `layoutConfig`, nem o corpo de **`handleShoot`** (validações, `processShot`, fases do jogo, timers de resultado).
2. **Preservar** visual principal: HUD legível, zonas de chute, goleiro/bola/campo, overlay H3.0B “Gire o celular”.
3. **Reduzir custo em mobile** preferencialmente por **CSS condicional** (media queries, `prefers-reduced-motion` onde já existir padrão, opcionalmente deteção de pointer coarse / hover none) e **comportamento de áudio** sem mudar **regras** de quando o som existe (apenas volume, pausa em background, ou não iniciar loop até gesto do utilizador — a validar UX).

**Pacote mínimo sugerido (ordem de implementação na execução):**

| # | Medida | Risco | Nota |
|---|--------|-------|------|
| A | **Desativar ou atenuar `backdrop-filter`** no HUD e no cartão de rotação **apenas em viewports estreitos** (ex.: `max-width` + landscape) ou com fallback sólido semi-transparente | Baixo se contraste mantido | Maior ganho GPU típico em Android |
| B | **Áudio:** `visibilitychange` / `document.hidden` — **pausar** `torcida` quando separador em background (não altera economia do jogo) | Baixo | Reduz CPU decodificação em multitasking |
| C | **Áudio:** opcionalmente **não** iniciar loop de torcida até **primeiro toque** no ecrã (política de autoplay) — só se não degradar UX aceite pela equipa | Médio (UX) | Evita trabalho áudio no cold start |
| D | **Imagens:** fora do “mínimo” estrito se implicar novos assets; se aceite numa sub-fase: WebP paralelo — **não** listado como obrigatório na primeira iteração | Médio-Alto (build, QA visual) | Reservado a H3.0F+ se A+B não bastarem |

**Explicitamente fora do escopo mínimo H3.0F (primeira onda):** refator do bundle, mudança de precache PWA, alteração de `STAGE`/`TARGETS`/goleiro em `layoutConfig.js`.

---

## 4. Ficheiros que **poderão** ser alterados (execução futura)

| Caminho | Motivo |
|---------|--------|
| `goldeouro-player/src/pages/game-scene.css` | `backdrop-filter`, portrait overlay, HUD — maior alavancagem GPU |
| `goldeouro-player/src/pages/game-shoot.css` | Animações/efeitos das zonas/overlays (com cuidado para não quebrar hit targets) |
| `goldeouro-player/src/pages/GameFinal.jsx` | **Apenas** blocos **fora** de `handleShoot` (ex.: `useEffect` do áudio de torcida, listeners `visibilitychange`, mute) — **proibido** editar a função `handleShoot` |
| `goldeouro-player/src/utils/musicManager.js` | **Opcional** e só se não afetar outras rotas; preferir CSS + efeitos locais ao `/game` primeiro |

**Recomendação:** começar só por **`game-scene.css`** (+ opcionalmente efeitos de áudio em `GameFinal.jsx` **fora** de `handleShoot`); só expandir se necessário.

---

## 5. Ficheiros **proibidos** (envelope H3.0F)

| Área | Caminhos / padrões |
|------|---------------------|
| **Backend / Fly** | `server-fly.js`, `fly.toml`, rotas API, Supabase clients no backend |
| **Finanças / PIX / saques** | Qualquer rota ou serviço de pagamento, ledger, saques |
| **Lógica de chute e saldo** | `handleShoot` em `GameFinal.jsx` (função inteira intocável), `goldeouro-player/src/services/gameService.js` |
| **Geometria autoritária do jogo** | `goldeouro-player/src/game/layoutConfig.js` |
| **Admin** | `goldeouro-admin/**`, rotas admin, painéis |
| **Base de dados** | `database/migrations/**`, SQL operacional |
| **Deploy / infra** (nesta fase) | `vercel.json` (salvo decisão explícita separada), pipelines não solicitados |

---

## 6. Tag de backup Git (antes da execução com código)

**Nome:** `pre-h3-0f-game-performance-2026-05-15`

**Instrução (executar manualmente ou na fase de preparação automática, após review do diff):**

```bash
git tag -a pre-h3-0f-game-performance-2026-05-15 -m "Baseline antes de H3.0F otimização performance /game mobile"
```

**Rollback:** `git checkout pre-h3-0f-game-performance-2026-05-15` (ou criar branch a partir da tag) + redeploy da build anterior na Vercel conforme runbook H3.0D.

---

## 7. Testes obrigatórios (pós-implementação H3.0F)

| # | Teste | Critério de sucesso |
|---|--------|---------------------|
| 1 | `cd goldeouro-player && npm run build` | Build sem erros |
| 2 | `/game` **desktop** | Carrega, HUD, zonas, sem erros críticos na consola |
| 3 | **Mobile portrait** | Overlay “Gire o celular” presente e legível (H3.0B) |
| 4 | **Mobile landscape** | Palco visível, escala aceitável, sem crash |
| 5 | **Chute visual** | Uma sequência completa idle → chute → resultado (sem regressão de animação) |
| 6 | **Consola** | Sem erros vermelhos recorrentes; sem `USE_MOCKS` ativo em produção |
| 7 | **Fluidez subjetiva** | Comparar A/B (tag vs HEAD) no **mesmo** telemóvel: scroll/orientação/overlay — registo qualitativo no relatório pós-execução |

**Opcional recomendado:** Lighthouse mobile ou Performance trace num aparelho que reproduza a queixa (não bloqueante para merge se testes manuais forem sólidos, mas desejável).

---

## 8. Rollback (resumo operacional)

1. **Git:** tag `pre-h3-0f-game-performance-2026-05-15` + branch de hotfix se necessário.  
2. **Produção:** promote deployment anterior na Vercel (projeto `goldeouro-player`), como na série H3.0D.  
3. **Clientes:** instrução de hard refresh / limpar dados do site se SW retiver assets antigos.

---

## 9. Classificação final (pré-execução)

## **PRONTO COM RESSALVAS**

**Motivos “pronto”:**

- Diagnóstico H3.0E identifica **alvos de baixo risco** (`backdrop-filter`, áudio em background) alinhados com o envelope (sem tocar `handleShoot` / `gameService` / `layoutConfig`).

**Ressalvas:**

1. **Métrica objetiva ausente:** Lighthouse/trace em dispositivo alvo não foi fechado na H3.0E — a primeira onda deve incluir **validação humana** forte na lista obrigatória.  
2. **`goldeouro-player/vercel.json` modificado** no working tree — isolar commits de performance deste ficheiro.  
3. Qualquer mudança em **autoplay de áudio** (item C) exige **aprovação de UX** antes de implementar.

---

**Elaborado por:** agente (READ-ONLY).  
**Commits:** nenhum nesta pré-execução.
