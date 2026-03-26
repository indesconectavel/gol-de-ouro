# Relatório consolidado final — Blocos A a F

**Projeto:** Gol de Ouro  
**Ciclo:** Desenvolvimento e validação até BLOCO F (Interface)  
**Data:** 2026-03-18  
**Documento:** Consolidação do que foi validado, decidido e estabilizado no sistema.

---

## 1. Resumo executivo

### O que foi feito neste ciclo

- **Auditoria e correção do BLOCO F (Interface):** diagnóstico forense do sistema de overlays da rota `/game`, correção de posicionamento do stage (centralização no viewport) e dos overlays de resultado (containing block + keyframes), padronização dos assets de resultado conforme o contrato da produção (gol_normal, ganhou_5/ganhou_100, defendeu, gol_de_ouro).
- **Portal único para overlays:** uso exclusivo de `#game-overlay-root` (filho direto de `body`), sem fallback para `document.body`, com CSS do container garantindo que `position: fixed` seja relativo à viewport.
- **Validação final read-only:** confirmação em código e CSS de que o overlay está centralizado na viewport, sem containing block interferindo e com os mesmos assets da produção.
- **Documentação:** playbook anti-retrabalho, fechamento oficial do incidente BLOCO F, restauração de assets e validação absoluta do sistema de resultado, todos em `docs/relatorios/`.

### O que foi estabilizado

- **Stage 1920×1080:** centralizado no viewport via `display: flex`, `alignItems: center`, `justifyContent: center` no `.game-viewport`.
- **Overlays de resultado:** renderização em um único container fora do stage, com `position: fixed`, `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)` e keyframes que preservam a centralização durante a animação.
- **Contrato de assets:** alinhamento com o deployment Current (produção): defendeu, ganhou_5, ganhou_100, gol_normal, gol_de_ouro, goool (no bundle para paridade).
- **Blocos A a E:** mantidos nos status já validados (Financeiro, Apostas, Autenticação, Saldo com ressalvas, Gameplay encerrado premium).

### Situação atual do projeto

O sistema em **produção** permanece estável e intocado. O trabalho deste ciclo foi realizado **apenas no preview** (branch `feature/bloco-e-gameplay-certified`). A base técnica da interface da `/game` (GameFinal, overlays, assets) está **estável e confiável** no código; a validação final absoluta (read-only) concluiu que não há bug de posicionamento ou containing block. Pendências restantes são **refinamentos de experiência** (centralização pixel-perfect, timing, responsividade fina), não problemas técnicos de fundação.

---

## 2. Status geral por BLOCO

### BLOCO A — Financeiro

| Item | Conteúdo |
|------|----------|
| **Objetivo** | Depósitos PIX, saques PIX, webhooks, worker de payout, ledger financeiro. |
| **Implementado** | Fluxo E2E de depósito e saque, integração Mercado Pago, conciliação e auditorias master documentadas. |
| **Problemas encontrados** | Nenhum crítico neste ciclo; incidentes pontuais (Fly, SMTP) tratados em ciclos anteriores. |
| **Correções aplicadas** | Nenhuma no ciclo atual (bloco já validado). |
| **Estado atual** | ✅ **Estável** — VALIDADO. |

---

### BLOCO B — Sistema de apostas

| Item | Conteúdo |
|------|----------|
| **Objetivo** | Modelo matemático, valor da aposta, estrutura de lote, premiação. |
| **Implementado** | Lotes por valor (V1: valor 1), 10º chute = goal, prêmio R$ 5, Gol de Ouro a cada 1000 chutes (R$ 100). |
| **Problemas encontrados** | Nenhum neste ciclo. |
| **Correções aplicadas** | Nenhuma no ciclo atual. |
| **Estado atual** | ✅ **Estável** — VALIDADO. |

---

### BLOCO C — Autenticação

| Item | Conteúdo |
|------|----------|
| **Objetivo** | Login, registro, JWT, proteção de rotas, sessão. |
| **Implementado** | Rotas de auth, ProtectedRoute, integração com backend. |
| **Problemas encontrados** | Nenhum neste ciclo. |
| **Correções aplicadas** | Nenhuma no ciclo atual. |
| **Estado atual** | ✅ **Estável** — VALIDADO. |

---

### BLOCO D — Sistema de saldo

| Item | Conteúdo |
|------|----------|
| **Objetivo** | Controle de saldo, débito no chute, crédito no prêmio, concorrência de saldo. |
| **Implementado** | Débito/crédito no chute, optimistic locking, ressalvas documentadas. |
| **Problemas encontrados** | Ausência de transação atômica saldo+chute; riscos de concorrência documentados. |
| **Correções aplicadas** | Nenhuma no ciclo atual (escopo de fases futuras). |
| **Estado atual** | ⚠️ **Parcial** — VALIDADO COM RESSALVAS. |

---

### BLOCO E — Gameplay

| Item | Conteúdo |
|------|----------|
| **Objetivo** | Engine do jogo, contador de chutes, lógica de gol, registro de chutes, premiação. |
| **Implementado** | Engine de lotes em memória, POST /api/games/shoot, persistência em Supabase (chutes, metricas_globais). |
| **Problemas encontrados** | Nenhum neste ciclo; bloco encerrado premium. |
| **Correções aplicadas** | Fase I.5 (idempotência no cliente) implementada na branch de preview; backend já suportava X-Idempotency-Key. |
| **Estado atual** | ✅ **Estável** — ENCERRADO PREMIUM. |

---

### BLOCO F — Interface

| Item | Conteúdo |
|------|----------|
| **Objetivo** | Telas do jogo, fluxo de navegação, UX do chute, feedback visual (overlays de resultado). |
| **Implementado** | GameFinal.jsx na rota `/game`, stage 1920×1080, HUD, zonas de chute, overlays via createPortal em `#game-overlay-root`, assets alinhados ao contrato da produção. |
| **Problemas encontrados** | Stage não centralizado no viewport; overlays deslocados (containing block + keyframes sem translate(-50%,-50%)); divergência de assets no preview (ganhou vs ganhou_5/ganhou_100, golden-goal vs gol_de_ouro, goool vs gol_normal). |
| **Correções aplicadas** | (1) Centralização do stage (flex + center no .game-viewport). (2) Portal somente para #game-overlay-root, sem fallback para body. (3) CSS do container sem transform/filter. (4) Keyframes com translate(-50%,-50%) em todos os passos. (5) Uso de gol_normal, ganhou_5/ganhou_100, gol_de_ouro conforme produção. |
| **Estado atual** | ✅ **Estável** (no código do preview) — Sistema de resultado validado tecnicamente; pendências são refinamentos de UX. |

---

## 3. Destaque — BLOCO F (crítico)

### Validação final do sistema de resultado

- Auditoria read-only (BLOCO-F-VALIDACAO-FINAL-ABSOLUTA-SISTEMA-RESULTADO-2026-03-17) confirmou: overlay tecnicamente correto, centralizado na viewport, sem containing block interferindo, assets alinhados com produção.
- Caminho no DOM: `img` → `#game-overlay-root` → `body` → `html`; overlay fora de `#root` e de `.game-stage`, portanto não sofre o `transform: scale()` do palco.

### Correção e padronização de overlays

| Asset | Uso |
|-------|-----|
| **gol_normal** | Overlay “gol” (primeiro pop em gol normal). |
| **defendeu** | Overlay de defesa. |
| **ganhou_5** | Overlay “ganhou” quando prêmio &lt; 100. |
| **ganhou_100** | Overlay “ganhou” quando prêmio ≥ 100 ou gol de ouro. |
| **gol_de_ouro** | Overlay único na vitória por Gol de Ouro. |
| **goool** | Mantido no bundle para paridade com produção (não usado como src do overlay). |

### Garantia de consistência com produção

- Imports e lógica em GameFinal.jsx passaram a usar o mesmo contrato do deployment Current (defendeu, ganhou_5, ganhou_100, gol_normal, gol_de_ouro, goool no bundle).
- Critério de escolha ganhou_5 vs ganhou_100: `(result.shot.prize || 0) >= 100 || (result.shot.goldenGoalPrize || 0) > 0`.

### Container único (#game-overlay-root)

- `index.html`: `<div id="game-overlay-root" aria-hidden="true"></div>` como filho direto de `body`, após `#root`.
- GameFinal.jsx: portal usa **apenas** `document.getElementById('game-overlay-root')`; se não existir, retorna `null` (sem fallback para `document.body`).
- game-scene.css: `#game-overlay-root` com `position: static`, `transform: none`, `filter: none`, `will-change: auto`, `contain: none` para não criar containing block.

### Eliminação de comportamentos inconsistentes

- Remoção do fallback para `document.body`, que podia colocar overlays em contexto com containing block indesejado.
- Keyframes (gooolPop, ganhouPop, pop) passaram a incluir `translate(-50%, -50%)` em todos os passos, evitando deslocamento durante a animação.
- Regras CSS legadas (ex.: .gs-golden-goal) escopadas a `.game-stage`, sem afetar o overlay no portal.

---

## 4. Sistema de overlays (estado atual)

### Como funciona hoje

- **Um overlay por vez:** Estados `showGoool`, `showGanhou`, `showDefendeu`, `showGoldenGoal` são mutuamente excludentes no fluxo (gol normal mostra gol depois ganhou em sequência; defesa ou gol de ouro mostram um só).
- **Renderização:** Cada overlay é uma única `<img>` renderizada via `createPortal(..., document.getElementById('game-overlay-root'))`, sem wrapper.
- **Estilo:** Inline em cada `<img>`: `position: 'fixed'`, `top: '50%'`, `left: '50%'`, `transform: 'translate(-50%, -50%)'`, zIndex 10000–10002, dimensões e animação conforme layoutConfig.

### Estrutura do render

```
body
  #root
    (árvore React: game-viewport → game-scale → game-stage → …)
  #game-overlay-root
    img.gs-goool | img.gs-ganhou | img.gs-defendeu | img.gs-golden-goal (conforme estado)
```

### Dependência do resultado (result)

- **Gol normal:** `setShowGoool(true)` → após 1200 ms `setShowGanhou(true)` com `ganhouVariant100` definido pelo prêmio.
- **Defesa:** `setShowDefendeu(true)`; reset após duração da animação.
- **Gol de ouro:** `setShowGoldenGoal(true)`; reset após duração configurada.

### Importância para UX

- Os overlays são o feedback visual imediato do resultado do chute (gol, defesa, ganhou, gol de ouro). Centralização na viewport e assets corretos garantem que a mensagem seja clara e consistente com a identidade visual da produção.

---

## 5. Validação visual (importante)

- **Centralização:** O código e o CSS auditados garantem que o overlay está posicionado com `position: fixed` relativo à viewport e centralizado com `top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`, com keyframes preservando esse translate. A validação final read-only concluiu que não há containing block interferindo.
- **Responsividade:** O palco escala com `transform: scale()` no `.game-scale`; o overlay permanece fixo na viewport, portanto o comportamento é consistente em diferentes tamanhos de tela no que diz respeito ao posicionamento técnico.
- **Assets:** Os arquivos de resultado utilizados (gol_normal, ganhou_5, ganhou_100, defendeu, gol_de_ouro) estão alinhados ao contrato da produção; o build do preview inclui os mesmos nomes de assets no bundle.

**Observação:** Ainda podem existir ajustes finos visuais (não técnicos), por exemplo sensação de centralização pixel-perfect, timing das animações ou impacto emocional da sequência. Esses pontos são tratados como pendências de refinamento de experiência na seção 8.

---

## 6. Deploy e segurança

- **Vercel Preview:** Todo o desenvolvimento e correção deste ciclo foram validados no ambiente de preview (branch `feature/bloco-e-gameplay-certified`), sem deploy direto em produção.
- **Produção intocada:** Nenhuma alteração foi feita no deployment Current; a referência de rollback (tag `pre-fase1-idempotencia-2026-03-17`) permanece disponível.
- **Branch isolada:** O trabalho está contido na branch de feature; merge e promoção para produção dependem de decisão explícita após validação de I.5 em preview e de qualquer checklist de paridade visual desejado.
- **Sistema seguro para evolução:** Rollback documentado, playbook e relatórios de fechamento disponíveis para evitar retrabalho e garantir que mudanças futuras sigam o mesmo contrato de overlays e assets.

---

## 7. Problemas resolvidos

| Problema | Resolução |
|----------|-----------|
| **Desalinhamento de overlays** | Centralização via portal em `#game-overlay-root` (fora do stage), estilo inline fixed 50% + translate(-50%,-50%), keyframes com translate em todos os passos e CSS do container sem transform/filter. |
| **Inconsistência de assets** | Adoção do contrato da produção: gol_normal, ganhou_5, ganhou_100, defendeu, gol_de_ouro; critério ganhou_5 vs ganhou_100 por valor do prêmio. |
| **Divergência preview vs produção** | Alinhamento de imports e lógica de exibição aos assets do Current; goool mantido no bundle para paridade. |
| **Múltiplos pontos de renderização** | Confirmação forense de uma única camada (createPortal para um único destino); remoção de qualquer uso de body como fallback. |
| **Lógica fragmentada** | Portal único, estado único por tipo de overlay, e regras CSS legadas escopadas a `.game-stage` para não afetar o overlay no portal. |
| **Stage no canto** | Centralização do bloco 1920×1080 no viewport com flex + center no `.game-viewport`. |

---

## 8. Pendências (próxima fase)

As itens abaixo **não são problemas técnicos**; são **refinamentos de experiência** e podem ser tratados em uma fase dedicada a UX e conversão.

- **Centralização visual absoluta (pixel-perfect):** Ajuste fino, se desejado, para que a sensação visual seja de centro exato em todos os dispositivos.
- **Refinamento de responsividade:** Comportamento em viewports muito pequenas ou muito grandes (escala mínima/máxima, proporções).
- **Ajustes de escala:** Possível fine-tuning do cálculo de scale ou do transform-origin para casos extremos.
- **Timing de overlays:** Duração e sequência (goool → ganhou) para maximizar impacto e clareza.
- **UX de feedback:** Sequência, transições e impacto emocional dos overlays (ex.: micro-interações, som, consistência com identidade visual).

---

## 9. Conclusão técnica

- O sistema da `/game` (BLOCO F) saiu de **instável** (overlays deslocados, stage no canto, dúvida sobre assets) para **controlado** (correções aplicadas, portal único, keyframes corrigidos, assets padronizados) e, após a validação final read-only, para **confiável** no código: sem bug de posicionamento ou containing block identificado, com contrato de assets alinhado à produção.
- Os blocos A a F estão documentados, com status claros (A, B, C estáveis; D com ressalvas; E encerrado premium; F estável no código com pendências de refinamento de UX).
- A base está pronta para refinamento de experiência e para evolução (ex.: I.5 em produção, próximos blocos H, I, J, K conforme roadmap).

---

## 10. Mensagem final

A base técnica do jogo, em especial a interface da rota `/game` e o sistema de overlays de resultado, está **sólida**: posicionamento correto, container dedicado, assets alinhados à produção e comportamento previsível em relação à viewport. O trabalho deste ciclo foi feito sem impactar produção e está registrado em relatórios e playbooks para manter consistência em ciclos futuros.

Os próximos ganhos naturais são de **UX e conversão** — refinamento visual, timing e impacto do feedback — e não de correção de fundação. O projeto segue em condições de evoluir com segurança a partir do estado atual.

---

*Documento gerado em 2026-03-18. Refere-se ao ciclo de desenvolvimento e validação dos blocos A a F, com ênfase no BLOCO F (Interface) e no sistema de overlays da /game.*
