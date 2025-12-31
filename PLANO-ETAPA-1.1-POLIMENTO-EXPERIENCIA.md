# PLANO TÉCNICO — ETAPA 1.1
## Polimento da Experiência do Jogador (Planejamento)

**Engenheiro Líder:** Sistema de Planejamento Técnico  
**Data:** 30 de dezembro de 2025  
**Missão:** 1 — Polimento da Experiência do Jogador  
**Etapa:** 1.1 — Planejamento (Sem Alteração de Código)  
**Status:** PLANEJAMENTO COMPLETO

---

## 📋 CONTEXTO CONFIRMADO

### Estado Atual Validado
- ✅ Página `/game` validada visualmente e funcionalmente
- ✅ Palco fixo 1920x1080 (arquitetura imutável)
- ✅ Wrapper de escala implementado e validado
- ✅ HUD, overlays, animações e áudios sincronizados
- ✅ Backups profissionais criados e verificados

### Arquivos Críticos Protegidos
- `src/pages/GameFinal.jsx` — 4 backups existentes
- `src/game/layoutConfig.js` — 4 backups existentes
- `src/pages/game-scene.css` — 2 backups existentes
- `src/pages/game-shoot.css` — 2 backups existentes

### Regra Absoluta
**Alterações apenas incrementais, perceptivas e documentadas. Nenhuma lógica, layout ou fluxo pode ser alterado.**

---

## 1️⃣ ARQUIVOS CANDIDATOS A TOQUE

### 1.1 Arquivo: `src/pages/GameFinal.jsx`

**Motivo:**
- Contém a função `handleShoot` (linha ~373) — ponto de entrada do chute
- Renderiza targets clicáveis (linha ~703) — feedback visual de clique
- Renderiza botões de aposta (linha ~668) — feedback visual de seleção
- Gerencia timing de overlays (linhas ~492, 495, 513, 521) — ajuste fino de timing
- Gerencia sincronização sonora (linhas ~397, 476, 488, 514) — ajuste fino de delay

**Escopo Permitido:**
- ✅ Adicionar estado React para feedback visual (ex: `targetClicked`, `screenShake`)
- ✅ Adicionar classes CSS condicionais para animações
- ✅ Ajustar delays de timers (milissegundos)
- ❌ NÃO alterar lógica de estados do jogo
- ❌ NÃO alterar fluxo de processamento
- ❌ NÃO alterar posicionamento ou tamanhos

**Linhas Específicas:**
- **Linha ~705:** `onClick={() => handleShoot(zone)}` — Ponto de clique no target
- **Linha ~670:** `onClick={() => handleBetChange(value)}` — Ponto de clique no botão de aposta
- **Linha ~397:** `playKickSound()` — Som do chute (timing atual: imediato)
- **Linha ~418:** `await simulateProcessShot()` — Momento do processamento (delay: 50ms)
- **Linha ~448:** `setBallPos(finalBallPos)` — Início da animação da bola
- **Linha ~445:** `setGoaliePos()` — Início da animação do goleiro
- **Linha ~487:** `setShowGoool(true)` — Exibição do overlay de gol
- **Linha ~492:** Timer para `setShowGanhou(true)` — Timing: 1200ms (OVERLAYS.ANIMATION_DURATION.GOOOL)
- **Linha ~510:** `setShowDefendeu(true)` — Exibição do overlay de defesa
- **Linha ~513:** Timer para `playDefenseSound()` — Timing: 400ms

---

### 1.2 Arquivo: `src/pages/game-scene.css`

**Motivo:**
- Contém estilos dos targets (não há classe específica, mas pode ser adicionada)
- Contém estilos dos botões de aposta (`.bet-btn`) — linha ~290
- Contém animações de overlays (`@keyframes gooolPop`, `ganhouPop`, `pop`) — linhas ~706-750
- Contém transições existentes — pode ser estendido

**Escopo Permitido:**
- ✅ Adicionar nova animação `@keyframes targetPulse` — feedback visual de clique
- ✅ Adicionar nova animação `@keyframes betButtonPress` — feedback visual de press
- ✅ Adicionar nova animação `@keyframes screenShake` — sensação de impacto
- ✅ Adicionar classe `.target-clicked` — estado temporário de clique
- ✅ Adicionar classe `.bet-btn-pressed` — estado temporário de press
- ✅ Adicionar classe `.screen-shake` — estado temporário de shake
- ❌ NÃO alterar animações existentes (`gooolPop`, `ganhouPop`, `pop`)
- ❌ NÃO alterar timing de animações existentes
- ❌ NÃO alterar estilos do HUD validados

**Linhas Específicas:**
- **Linha ~290:** `.bet-btn` — Estilo do botão de aposta (transição: `all 0.3s ease`)
- **Linha ~706:** `@keyframes gooolPop` — Animação do overlay de gol (duração: 1.2s)
- **Linha ~729:** `@keyframes ganhouPop` — Animação do overlay de ganhou (duração: 5s)
- **Linha ~695:** `@keyframes pop` — Animação do overlay de defesa (duração: 0.8s)

---

### 1.3 Arquivo: `src/pages/game-shoot.css`

**Motivo:**
- Contém estilos complementares de overlays
- Contém animações sincronizadas com `game-scene.css`
- Pode conter estilos adicionais para feedback visual

**Escopo Permitido:**
- ✅ Adicionar estilos complementares para feedback visual
- ✅ Adicionar animações complementares (se necessário)
- ❌ NÃO alterar tamanhos de overlays (520x200, 480x180, etc.)
- ❌ NÃO alterar animações existentes

---

## 2️⃣ PONTOS EXATOS DE INTERVENÇÃO

### 2.1 Feedback Visual de Clique no Target

**Componente:** Target (zona clicável do gol)  
**Localização:** `GameFinal.jsx` linha ~703-722

**Momento do Fluxo:**
- **Antes:** Usuário visualiza target estático
- **Durante:** Usuário clica no target
- **Depois:** `handleShoot(zone)` é chamado, animação da bola inicia

**Intervenção Proposta:**
1. **Adicionar estado React:** `const [clickedTarget, setClickedTarget] = useState(null)`
2. **Adicionar classe CSS condicional:** `className={clickedTarget === zone ? 'target-clicked' : ''}`
3. **Adicionar animação CSS:** `@keyframes targetPulse` (scale: 1.0 → 1.15 → 1.0, duração: 200ms)
4. **Atualizar onClick:** Adicionar `setClickedTarget(zone)` antes de `handleShoot(zone)`
5. **Resetar estado:** `setTimeout(() => setClickedTarget(null), 200)` após clique

**Trecho de Código Atual:**
```javascript
// Linha ~703-722
<button
  key={zone}
  onClick={() => handleShoot(zone)}
  disabled={!canShoot}
  className={`gs-zone ${!canShoot ? 'disabled' : ''}`}
  style={{
    // ... estilos inline
    transition: 'all 0.2s ease'
  }}
/>
```

**Trecho de CSS Atual:**
- Não há classe específica para targets em `game-scene.css`
- Estilos inline em `GameFinal.jsx` (linha ~708-720)

---

### 2.2 Feedback Visual de Press no Botão de Aposta

**Componente:** Botão de aposta (R$ 1, 5, 10, 25)  
**Localização:** `GameFinal.jsx` linha ~668-675

**Momento do Fluxo:**
- **Antes:** Botão de aposta estático ou ativo
- **Durante:** Usuário clica no botão
- **Depois:** `handleBetChange(value)` é chamado, `currentBet` atualizado

**Intervenção Proposta:**
1. **Adicionar estado React:** `const [pressedBet, setPressedBet] = useState(null)`
2. **Adicionar classe CSS condicional:** `className={pressedBet === value ? 'bet-btn-pressed' : ''}`
3. **Adicionar animação CSS:** `@keyframes betButtonPress` (scale: 1.0 → 0.95 → 1.0, duração: 150ms)
4. **Atualizar onClick:** Adicionar `setPressedBet(value)` antes de `handleBetChange(value)`
5. **Resetar estado:** `setTimeout(() => setPressedBet(null), 150)` após clique

**Trecho de Código Atual:**
```javascript
// Linha ~668-675
<button
  key={value}
  onClick={() => handleBetChange(value)}
  disabled={balance < value || gamePhase !== GAME_PHASE.IDLE}
  className={`bet-btn ${currentBet === value ? 'active' : ''} ${balance < value ? 'disabled' : ''}`}
>
  R${value}
</button>
```

**Trecho de CSS Atual:**
```css
/* game-scene.css linha ~290 */
.bet-btn {
  transition: all 0.3s ease;
}
.bet-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}
```

---

### 2.3 Sensação de Impacto (Screen Shake)

**Componente:** Game Stage (container principal)  
**Localização:** `GameFinal.jsx` linha ~591 (container `.game-stage`)

**Momento do Fluxo:**
- **Antes:** Bola e goleiro animando
- **Durante:** Momento do impacto (gol ou defesa)
- **Depois:** Overlay aparece

**Intervenção Proposta:**
1. **Adicionar estado React:** `const [screenShake, setScreenShake] = useState(false)`
2. **Adicionar classe CSS condicional:** `className={screenShake ? 'screen-shake' : ''}` no container `.game-stage`
3. **Adicionar animação CSS:** `@keyframes screenShake` (translate: 0 → ±2px → 0, duração: 300ms)
4. **Ativar no momento do impacto:**
   - **Gol:** Após `setShowGoool(true)` (linha ~487)
   - **Defesa:** Após `setShowDefendeu(true)` (linha ~510)
5. **Desativar:** `setTimeout(() => setScreenShake(false), 300)` após ativação

**Trecho de Código Atual:**
```javascript
// Linha ~591
<div className="game-stage" style={{
  width: stageWidth,
  height: stageHeight,
  // ... outros estilos
}}>
```

**Momento Exato de Intervenção:**
- **Linha ~487:** Após `setShowGoool(true)` — adicionar `setScreenShake(true)`
- **Linha ~510:** Após `setShowDefendeu(true)` — adicionar `setScreenShake(true)`

---

### 2.4 Ajuste Fino de Timing de Overlays

**Componente:** Overlays (goool.png, defendeu.png, ganhou.png)  
**Localização:** `GameFinal.jsx` linhas ~492, 495, 513, 521

**Timing Atual:**
- **goool.png:** Aparece imediatamente após processamento (linha ~487)
- **ganhou.png:** Aparece após 1200ms (OVERLAYS.ANIMATION_DURATION.GOOOL) — linha ~492
- **defendeu.png:** Aparece imediatamente após processamento (linha ~510)
- **Som de defesa:** Toca após 400ms (linha ~513)

**Intervenção Proposta:**
1. **Validar timing atual:** Medir percepção do jogador
2. **Ajustes possíveis (milissegundos):**
   - **ganhou.png:** Ajustar delay de 1200ms para 1150ms ou 1250ms (se necessário)
   - **Som de defesa:** Ajustar delay de 400ms para 350ms ou 450ms (se necessário)
3. **Não alterar:** Durações de animações CSS (1.2s, 5s, 0.8s)

**Trechos de Código Atuais:**
```javascript
// Linha ~492-495
const showGanhouTimer = setTimeout(() => {
  setShowGoool(false);
  setShowGanhou(true);
}, OVERLAYS.ANIMATION_DURATION.GOOOL); // 1200ms

// Linha ~513-515
const defenseSoundTimer = setTimeout(() => {
  playDefenseSound();
}, 400); // 400ms
```

---

### 2.5 Sincronização Sonora Aprimorada

**Componente:** Sistema de áudio  
**Localização:** `GameFinal.jsx` linhas ~154-198, ~397, ~476, ~488, ~514

**Timing Atual:**
- **kick.mp3:** Toca imediatamente ao clicar (linha ~397)
- **gol.mp3:** Toca imediatamente após `setShowGoool(true)` (linha ~476, 488)
- **defesa.mp3:** Toca após 400ms de delay (linha ~514)

**Intervenção Proposta:**
1. **Validar sincronização atual:** Testar percepção do jogador
2. **Ajustes possíveis:**
   - **kick.mp3:** Manter imediato (OK)
   - **gol.mp3:** Validar se está sincronizado com animação da bola chegando ao gol
   - **defesa.mp3:** Ajustar delay de 400ms se necessário (350ms-450ms)
3. **Adicionar som de "whoosh" durante animação da bola (opcional):**
   - Tocar durante animação da bola (600ms)
   - Volume baixo (0.3-0.4)
   - Fade out no final

**Trechos de Código Atuais:**
```javascript
// Linha ~397
playKickSound(); // Imediato

// Linha ~476, 488
playGoalSound(); // Imediato após setShowGoool

// Linha ~514
setTimeout(() => {
  playDefenseSound();
}, 400); // Delay de 400ms
```

---

## 3️⃣ OBJETIVO PERCEPTIVO DE CADA AJUSTE

### 3.1 Feedback Visual de Clique no Target

**O que o jogador deve sentir:**
- Confirmação imediata de que o clique foi registrado
- Sensação de "resposta" do jogo ao toque
- Feedback tátil visual (substituindo feedback tátil físico)

**Problema perceptivo sendo suavizado:**
- **Atual:** Clique no target não tem feedback visual imediato
- **Problema:** Jogador pode não ter certeza se o clique foi registrado
- **Solução:** Pulse visual instantâneo (200ms) confirma o clique

**Ganho esperado:**
- ✅ **Clareza:** Jogador sabe que o clique foi registrado
- ✅ **Resposta:** Sensação de controle e responsividade
- ✅ **Profissionalismo:** Experiência mais polida e premium

---

### 3.2 Feedback Visual de Press no Botão de Aposta

**O que o jogador deve sentir:**
- Confirmação imediata de que o botão foi pressionado
- Sensação de "press" físico (substituindo feedback tátil)
- Feedback visual que acompanha a ação

**Problema perceptivo sendo suavizado:**
- **Atual:** Botão de aposta não tem feedback visual de "press"
- **Problema:** Jogador pode não ter certeza se a seleção foi registrada
- **Solução:** Animação de "press" (scale down 5%, 150ms) confirma a ação

**Ganho esperado:**
- ✅ **Clareza:** Jogador sabe que a seleção foi registrada
- ✅ **Resposta:** Sensação de interatividade
- ✅ **Consistência:** Feedback similar ao target

---

### 3.3 Sensação de Impacto (Screen Shake)

**O que o jogador deve sentir:**
- Sensação de "impacto" no momento do gol ou defesa
- Destaque visual do momento crítico
- Sensação de "força" e "energia" do evento

**Problema perceptivo sendo suavizado:**
- **Atual:** Gol e defesa aparecem sem sensação de impacto
- **Problema:** Falta de "punch" visual no momento crítico
- **Solução:** Screen shake sutil (2px, 300ms) no momento do impacto

**Ganho esperado:**
- ✅ **Impacto:** Sensação de "força" no momento do gol/defesa
- ✅ **Destaque:** Momento crítico ganha mais destaque
- ✅ **Imersão:** Experiência mais envolvente

**Cuidado:**
- Shake deve ser **sutil** (2px máximo)
- Duração curta (300ms)
- Não deve causar desconforto visual
- Não deve afetar legibilidade

---

### 3.4 Ajuste Fino de Timing de Overlays

**O que o jogador deve sentir:**
- Transições suaves e naturais entre overlays
- Sincronização perfeita entre animações
- Sensação de "flow" contínuo

**Problema perceptivo sendo suavizado:**
- **Atual:** Timing pode estar ligeiramente desincronizado
- **Problema:** Transições podem parecer "cortadas" ou "atrasadas"
- **Solução:** Ajuste fino de delays (milissegundos) para sincronização perfeita

**Ganho esperado:**
- ✅ **Fluidez:** Transições mais suaves
- ✅ **Sincronização:** Animações perfeitamente alinhadas
- ✅ **Profissionalismo:** Experiência mais polida

**Validação Necessária:**
- Testar timing atual em múltiplos dispositivos
- Medir percepção do jogador
- Ajustar apenas se necessário (não alterar por "achismo")

---

### 3.5 Sincronização Sonora Aprimorada

**O que o jogador deve sentir:**
- Sons perfeitamente sincronizados com ações visuais
- Sensação de "realismo" e "imersão"
- Feedback sonoro que complementa o visual

**Problema perceptivo sendo suavizado:**
- **Atual:** Sons podem estar ligeiramente desincronizados
- **Problema:** Som pode tocar antes ou depois do evento visual
- **Solução:** Ajuste fino de delays para sincronização perfeita

**Ganho esperado:**
- ✅ **Sincronização:** Sons alinhados com eventos visuais
- ✅ **Imersão:** Experiência mais envolvente
- ✅ **Profissionalismo:** Polimento sonoro premium

**Validação Necessária:**
- Testar sincronização atual
- Medir percepção do jogador
- Ajustar apenas se necessário

---

## 4️⃣ IMPACTO TÉCNICO ESTIMADO

### 4.1 Feedback Visual de Clique no Target

**Impacto em ms:**
- **Animação CSS:** 200ms (não afeta performance)
- **Estado React:** Atualização instantânea (< 1ms)
- **Total:** ~200ms (apenas visual, não bloqueia lógica)

**Risco:** ⚠️ **BAIXO**

**Possível Efeito Colateral:**
- Nenhum (animação CSS pura, não afeta lógica)
- Pode causar re-render desnecessário se estado não for otimizado (mitigado com `useState`)

**Mitigação:**
- Usar `useState` (já otimizado)
- Animação CSS pura (GPU-accelerated)
- Reset automático após 200ms

---

### 4.2 Feedback Visual de Press no Botão de Aposta

**Impacto em ms:**
- **Animação CSS:** 150ms (não afeta performance)
- **Estado React:** Atualização instantânea (< 1ms)
- **Total:** ~150ms (apenas visual, não bloqueia lógica)

**Risco:** ⚠️ **BAIXO**

**Possível Efeito Colateral:**
- Nenhum (animação CSS pura)
- Pode causar re-render desnecessário (mitigado com `useState`)

**Mitigação:**
- Usar `useState` (já otimizado)
- Animação CSS pura (GPU-accelerated)
- Reset automático após 150ms

---

### 4.3 Sensação de Impacto (Screen Shake)

**Impacto em ms:**
- **Animação CSS:** 300ms (não afeta performance)
- **Estado React:** Atualização instantânea (< 1ms)
- **Total:** ~300ms (apenas visual, não bloqueia lógica)

**Risco:** ⚠️ **MÉDIO**

**Possível Efeito Colateral:**
- **Desconforto visual:** Se shake for muito forte
- **Afetar legibilidade:** Se shake for muito longo
- **Performance:** Se aplicado a elemento muito grande (mitigado: apenas `.game-stage`)

**Mitigação:**
- Shake sutil (2px máximo)
- Duração curta (300ms)
- Aplicar apenas a `.game-stage` (não a viewport inteira)
- Testar em múltiplos dispositivos
- Opção de desabilitar se causar desconforto

---

### 4.4 Ajuste Fino de Timing de Overlays

**Impacto em ms:**
- **Ajuste de delay:** ±50ms (não afeta performance)
- **Nenhum impacto estrutural:** Apenas ajuste de timer

**Risco:** ⚠️ **BAIXO**

**Possível Efeito Colateral:**
- **Timing desincronizado:** Se ajuste for incorreto
- **Overlaps visuais:** Se timing for muito curto

**Mitigação:**
- Validar timing atual antes de ajustar
- Ajustar apenas se necessário
- Testar extensivamente após ajuste
- Manter margem de segurança (±50ms)

---

### 4.5 Sincronização Sonora Aprimorada

**Impacto em ms:**
- **Ajuste de delay:** ±50ms (não afeta performance)
- **Nenhum impacto estrutural:** Apenas ajuste de timer

**Risco:** ⚠️ **BAIXO**

**Possível Efeito Colateral:**
- **Sons desincronizados:** Se ajuste for incorreto
- **Sobreposição sonora:** Se timing for muito curto

**Mitigação:**
- Validar sincronização atual antes de ajustar
- Ajustar apenas se necessário
- Testar extensivamente após ajuste
- Manter margem de segurança (±50ms)

---

## 5️⃣ CHECKLIST DE SEGURANÇA PRÉ-ALTERAÇÃO

### 5.1 Backup Obrigatório

**Antes de qualquer alteração:**

- [ ] **Backup de `GameFinal.jsx`:**
  - [ ] Criar `GameFinal.jsx.BACKUP-PRE-ETAPA-1.1`
  - [ ] Verificar que backup não está vazio
  - [ ] Confirmar que backup tem conteúdo completo

- [ ] **Backup de `game-scene.css`:**
  - [ ] Criar `game-scene.css.BACKUP-PRE-ETAPA-1.1`
  - [ ] Verificar que backup não está vazio
  - [ ] Confirmar que backup tem conteúdo completo

- [ ] **Backup de `game-shoot.css` (se necessário):**
  - [ ] Criar `game-shoot.css.BACKUP-PRE-ETAPA-1.1`
  - [ ] Verificar que backup não está vazio

**Validação de Integridade:**
- [ ] Todos os backups têm mais de 100 caracteres
- [ ] Conteúdo dos backups corresponde aos arquivos originais
- [ ] Backups são únicos (não sobrescrevem backups existentes)

---

### 5.2 Validação Pré-Alteração

**Estado Atual Validado:**

- [ ] **Página `/game` funcionando:**
  - [ ] Jogo inicia corretamente
  - [ ] Targets clicáveis funcionando
  - [ ] Botões de aposta funcionando
  - [ ] Animações de bola e goleiro funcionando
  - [ ] Overlays aparecendo corretamente
  - [ ] Áudios tocando corretamente

- [ ] **Performance atual:**
  - [ ] FPS estável (60fps em dispositivos médios)
  - [ ] Sem travamentos
  - [ ] Sem lag perceptível

- [ ] **Timing atual documentado:**
  - [ ] Delay de `simulateProcessShot`: 50ms
  - [ ] Delay de `ganhou.png`: 1200ms
  - [ ] Delay de `defesa.mp3`: 400ms
  - [ ] Duração de animação da bola: 600ms
  - [ ] Duração de animação do goleiro: 500ms

**Baseline Estabelecido:**
- [ ] Documentar estado atual em `BASELINE-ETAPA-1.1.md`
- [ ] Capturar screenshots/vídeos do comportamento atual (opcional)
- [ ] Anotar percepções atuais do jogador (se possível)

---

### 5.3 Critério de Rollback

**Condições para Rollback Imediato:**

- [ ] **Funcionalidade Quebrada:**
  - [ ] Jogo não inicia
  - [ ] Targets não são clicáveis
  - [ ] Botões de aposta não funcionam
  - [ ] Animações não funcionam
  - [ ] Overlays não aparecem

- [ ] **Performance Degradada:**
  - [ ] FPS cai abaixo de 30fps
  - [ ] Lag perceptível
  - [ ] Travamentos

- [ ] **Regressão Visual:**
  - [ ] Elementos desalinhados
  - [ ] Animações quebradas
  - [ ] Overlays não centralizados

- [ ] **Regressão de UX:**
  - [ ] Feedback visual não funciona
  - [ ] Timing piorou (mais lento ou mais rápido)
  - [ ] Sincronização piorou

**Processo de Rollback:**

1. **Imediato:**
   - Parar todas as alterações
   - Restaurar arquivos dos backups `.BACKUP-PRE-ETAPA-1.1`
   - Validar que estado foi restaurado

2. **Documentação:**
   - Documentar o que foi alterado
   - Documentar o que quebrou
   - Documentar motivo do rollback

3. **Análise:**
   - Analisar causa raiz
   - Identificar ajustes necessários
   - Planejar nova tentativa (se aplicável)

---

### 5.4 Validação Pós-Alteração

**Checklist de Validação:**

- [ ] **Funcionalidade:**
  - [ ] Jogo inicia corretamente
  - [ ] Targets clicáveis funcionando
  - [ ] Botões de aposta funcionando
  - [ ] Animações funcionando
  - [ ] Overlays aparecendo corretamente
  - [ ] Áudios tocando corretamente

- [ ] **Feedback Visual:**
  - [ ] Pulse no target funciona
  - [ ] Press no botão funciona
  - [ ] Screen shake funciona (se implementado)
  - [ ] Animações não interferem com lógica

- [ ] **Performance:**
  - [ ] FPS mantido (60fps em dispositivos médios)
  - [ ] Sem lag perceptível
  - [ ] Sem travamentos

- [ ] **Timing:**
  - [ ] Timing de overlays mantido ou melhorado
  - [ ] Sincronização sonora mantida ou melhorada
  - [ ] Sem delays perceptíveis

- [ ] **Regressões:**
  - [ ] Nenhuma funcionalidade quebrada
  - [ ] Nenhuma animação quebrada
  - [ ] Nenhum elemento desalinhado

---

### 5.5 Documentação Obrigatória

**Após cada alteração:**

- [ ] **Relatório de Alteração:**
  - [ ] Arquivo alterado
  - [ ] Linhas alteradas
  - [ ] O que foi alterado
  - [ ] Por que foi alterado
  - [ ] Resultado esperado
  - [ ] Resultado obtido

- [ ] **Atualização de Documentação:**
  - [ ] Atualizar `RELATORIO-ESTADO-VALIDADO-PAGINA-GAME.md` (se necessário)
  - [ ] Criar `RELATORIO-ETAPA-1.1-EXECUCAO.md`
  - [ ] Documentar validações realizadas

---

## 📊 RESUMO EXECUTIVO

### Arquivos que Serão Tocados (Planejamento)
1. `src/pages/GameFinal.jsx` — Adicionar estados e classes condicionais
2. `src/pages/game-scene.css` — Adicionar animações CSS

### Pontos de Intervenção Identificados
1. **Clique no target** — Feedback visual imediato
2. **Clique no botão de aposta** — Feedback visual de press
3. **Momento do impacto** — Screen shake sutil
4. **Timing de overlays** — Ajuste fino (se necessário)
5. **Sincronização sonora** — Ajuste fino (se necessário)

### Objetivos Perceptivos
- ✅ Confirmação imediata de ações
- ✅ Sensação de impacto e força
- ✅ Sincronização perfeita
- ✅ Experiência premium e polida

### Riscos Identificados
- ⚠️ **Screen shake:** Risco médio (pode causar desconforto)
- ⚠️ **Outros ajustes:** Risco baixo (apenas visual)

### Próximos Passos
1. Aprovação deste plano
2. Criação de backups
3. Execução incremental
4. Validação após cada alteração
5. Documentação completa

---

## 🏁 FRASE FINAL OBRIGATÓRIA

**"Nenhuma alteração foi aplicada nesta etapa. Este documento define exclusivamente o plano seguro e validado para o polimento perceptivo da experiência do jogador."**

---

**Plano criado em:** 30 de dezembro de 2025  
**Versão:** 1.0  
**Status:** Aguardando Aprovação para Execução  
**Próxima Etapa:** Execução da Etapa 1.1 (após aprovação)

