# 🎮 AUDITORIA TELA DO JOGO - BOTÕES E INTERAÇÕES
## Sistema Gol de Ouro - Tela Original (Game.jsx + GameField.jsx)

**Data:** 2025-01-24  
**Auditor:** Auditor Técnico Sênior  
**Status:** 🛑 MODO DIAGNÓSTICO - SEM ALTERAÇÕES  
**Arquivos Auditados:** `Game.jsx`, `GameField.jsx`, `BettingControls.jsx`, `SoundControls.jsx`

---

## 🖱️ MAPEAMENTO COMPLETO DE INTERAÇÕES

### 1. ZONAS DE CHUTE (GameField.jsx linhas 233-257)

**Tipo:** Botão Clicável  
**Localização:** `GameField.jsx` linhas 234-256

**Configuração:**
- **Total de Zonas:** 6 zonas
- **Posicionamento:** Absoluto dentro do campo de jogo
- **Tamanho:** `w-8 h-8` (32px x 32px)

**Zonas Disponíveis:**

| ID | Nome | Posição X | Posição Y | Multiplicador | Dificuldade |
|----|------|-----------|-----------|---------------|-------------|
| 1 | Canto Superior Esquerdo | 15% | 15% | 2.0x | Hard |
| 2 | Canto Superior Direito | 85% | 15% | 2.0x | Hard |
| 3 | Centro Superior | 50% | 20% | 1.5x | Medium |
| 4 | Canto Inferior Esquerdo | 15% | 70% | 1.8x | Medium |
| 5 | Canto Inferior Direito | 85% | 70% | 1.8x | Medium |
| 6 | Centro Inferior | 50% | 80% | 1.2x | Easy |

**Eventos:**

| Evento | Função | Arquivo | Linha | Condição |
|--------|--------|---------|-------|----------|
| `onClick` | `handleZoneClick(zone.id)` | GameField.jsx | 237 | `gameStatus === 'waiting' && currentShot < totalShots` |
| `onMouseEnter` | `handleZoneHover()` | GameField.jsx | 238 | `gameStatus === 'waiting' && currentShot < totalShots` |
| `disabled` | - | GameField.jsx | 239 | `gameStatus !== 'waiting' \|\| currentShot >= totalShots` |

**Ações ao Clicar:**
1. Toca som de chute (`playKickSound()`)
2. Define direção do chute (`setShootDirection(zoneId)`)
3. Muda pose do goleiro para 'diving' (`setGoalkeeperPose('diving')`)
4. Muda posição da bola para 'shooting' (`setBallPosition('shooting')`)
5. Incrementa chave de animação (`setAnimationKey(prev => prev + 1)`)
6. Chama callback `onShoot(zoneId)` que dispara `handleShoot` em `Game.jsx`

**Ações ao Hover:**
1. Toca som de hover (`playHoverSound()`)

**Estados Visuais:**

| Estado | Classe CSS | Descrição |
|--------|------------|-----------|
| Selecionada | `bg-yellow-400 border-yellow-300 zone-pulse shadow-2xl shadow-yellow-400/60` | Zona escolhida para chute |
| Disponível | `bg-black/70 border-white/90 hover:bg-yellow-400/70 hover:scale-110 hover:shadow-xl` | Pode ser clicada |
| Desabilitada | `bg-black/50 border-white/60` | Não pode ser clicada |

---

### 2. BOTÕES DE CONTROLE DE APOSTA (Game.jsx linhas 264-272)

**Tipo:** Botão Clicável  
**Localização:** `Game.jsx` linhas 264-272

**Botão Diminuir Aposta (-):**
- **Posição:** Linha 264
- **Tamanho:** `w-8 h-8`
- **Estilo:** `bg-white/20 hover:bg-white/30 rounded-full`
- **Evento:** `onClick` - **NÃO IMPLEMENTADO** (apenas visual)
- **Estado Atual:** Decorativo (sem funcionalidade)

**Botão Aumentar Aposta (+):**
- **Posição:** Linha 270
- **Tamanho:** `w-8 h-8`
- **Estilo:** `bg-white/20 hover:bg-white/30 rounded-full`
- **Evento:** `onClick` - **NÃO IMPLEMENTADO** (apenas visual)
- **Estado Atual:** Decorativo (sem funcionalidade)

**Nota:** O valor da aposta é fixo em `betAmount = 1.00` (linha 25)

---

### 3. CONTROLES DE CHUTES (BettingControls.jsx)

**Tipo:** Componente de Controle  
**Localização:** `goldeouro-player/src/components/BettingControls.jsx`

**Botão Remover Chute (-):**
- **Posição:** BettingControls.jsx linha 24
- **Tamanho:** `w-8 h-8`
- **Estilo:** `bg-red-500 hover:bg-red-600 disabled:bg-gray-500`
- **Evento:** `onClick={() => onRemoveShots(1)}`
- **Desabilitado quando:** `playerShots <= 0`
- **Ação:** Chama `removeShots(1)` em `Game.jsx` (linha 208)

**Botão Adicionar Chute (+):**
- **Posição:** BettingControls.jsx linha 34
- **Tamanho:** `w-8 h-8`
- **Estilo:** `bg-green-500 hover:bg-green-600 disabled:bg-gray-500`
- **Evento:** `onClick={() => onAddShots(1)}`
- **Desabilitado quando:** `totalShots >= 10`
- **Ação:** Chama `addShots(1)` em `Game.jsx` (linha 200)

**Lógica de Adicionar Chutes:**
```javascript
// Game.jsx linha 200-206
const addShots = useCallback((shots) => {
  if (totalShots + shots <= 10) {
    playButtonClick()
    setPlayerShots(prev => prev + shots)
    setTotalShots(prev => prev + shots)
  }
}, [totalShots, playButtonClick])
```

**Lógica de Remover Chutes:**
```javascript
// Game.jsx linha 208-214
const removeShots = useCallback((shots) => {
  if (playerShots - shots >= 0) {
    playButtonClick()
    setPlayerShots(prev => prev - shots)
    setTotalShots(prev => prev - shots)
  }
}, [playerShots, playButtonClick])
```

---

### 4. BOTÃO VOLTAR AO DASHBOARD (Game.jsx linhas 240-245)

**Tipo:** Botão de Navegação  
**Localização:** `Game.jsx` linhas 240-245

**Características:**
- **Texto:** "←" (seta para esquerda)
- **Estilo:** `text-white/70 hover:text-white text-2xl transition-colors`
- **Evento:** `onClick={() => navigate('/dashboard')}`
- **Ação:** Navega para `/dashboard`

---

### 5. BOTÃO NOVA PARTIDA (Game.jsx linhas 405-410)

**Tipo:** Botão de Ação  
**Localização:** `Game.jsx` linhas 405-410

**Características:**
- **Texto:** "Nova Partida"
- **Estilo:** `bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700`
- **Evento:** `onClick={resetGame}`
- **Visibilidade:** Aparece quando `currentShot >= playerShots || totalShots >= 10`

**Ação `resetGame`:**
```javascript
// Game.jsx linha 188-198
const resetGame = useCallback(() => {
  playButtonClick()
  setSelectedZone(null)
  setGameStatus('waiting')
  setGameResult(null)
  setCurrentShot(0)
  setGameResults([])
  setPlayerShots(0)
  setTotalShots(0)
  setIsShooting(false)
}, [playButtonClick])
```

---

### 6. BOTÃO VOLTAR AO DASHBOARD (Game.jsx linhas 411-416)

**Tipo:** Botão de Navegação  
**Localização:** `Game.jsx` linhas 411-416

**Características:**
- **Texto:** "Voltar ao Dashboard"
- **Estilo:** `bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700`
- **Evento:** `onClick={() => navigate('/dashboard')}`
- **Visibilidade:** Aparece quando `currentShot >= playerShots || totalShots >= 10`

---

### 7. BOTÃO MENU (Game.jsx linhas 421-427)

**Tipo:** Botão Fixo  
**Localização:** `Game.jsx` linhas 421-427

**Características:**
- **Posição:** `fixed bottom-6 left-6`
- **Ícone:** 🏠
- **Texto:** "Menu"
- **Estilo:** `bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 rounded-full`
- **Z-index:** `z-50`
- **Evento:** `onClick={() => navigate('/dashboard')}`
- **Ação:** Navega para `/dashboard`

---

### 8. CONTROLES DE SOM (SoundControls.jsx)

**Tipo:** Componente de Controle  
**Localização:** `goldeouro-player/src/components/SoundControls.jsx`

**Botão Mute/Unmute:**
- **Posição:** SoundControls.jsx linha 20
- **Tamanho:** `w-8 h-8`
- **Estilo:** `bg-white/20 hover:bg-white/30 rounded-full`
- **Evento:** `onClick={toggleMute}`
- **Ação:** Alterna estado `isMuted` do hook `useSimpleSound`

**Controle de Volume:**
- **Tipo:** Input range
- **Posição:** SoundControls.jsx linha 42
- **Range:** `min="0" max="1" step="0.1"`
- **Evento:** `onChange={(e) => setSoundVolume(parseFloat(e.target.value))}`
- **Visibilidade:** Aparece quando `!isMuted`

**Botão Controles Avançados:**
- **Posição:** SoundControls.jsx linha 58
- **Tamanho:** `w-8 h-8`
- **Estilo:** `bg-white/20 hover:bg-white/30 rounded-full`
- **Evento:** `onClick={() => setShowAdvanced(!showAdvanced)}`
- **Ação:** Alterna visibilidade dos controles avançados

**Botão Testar Torcida:**
- **Posição:** SoundControls.jsx linha 73
- **Evento:** `onClick={playCrowdSound}`
- **Visibilidade:** Aparece quando `showAdvanced && !isMuted`

**Botão Testar Música:**
- **Posição:** SoundControls.jsx linha 79
- **Evento:** `onClick={playBackgroundMusic}`
- **Visibilidade:** Aparece quando `showAdvanced && !isMuted`

---

### 9. PAINEL DE RECOMENDAÇÕES (RecommendationsPanel.jsx)

**Tipo:** Componente Interativo  
**Localização:** `goldeouro-player/src/components/RecommendationsPanel.jsx`

**Botão Expandir/Recolher:**
- **Posição:** RecommendationsPanel.jsx linha 58
- **Estilo:** `cursor-pointer hover:bg-white/5 transition-colors`
- **Evento:** `onClick={() => setIsExpanded(!isExpanded)}`
- **Ação:** Alterna estado `isExpanded`

**Botão Dispensar Recomendação:**
- **Posição:** RecommendationsPanel.jsx linha 136
- **Estilo:** `text-white/50 hover:text-white/80 transition-colors`
- **Evento:** `onClick={() => dismissRecommendation(recommendation.id)}`
- **Ação:** Remove recomendação da lista ativa

---

## 📋 TABELA COMPLETA DE INTERAÇÕES

| Elemento | Tipo | Evento | Estado Atual | Impacto no Jogo | Arquivo | Linha |
|----------|------|--------|--------------|-----------------|---------|-------|
| Zona 1 (CSE) | Botão | onClick | ✅ Funcional | Dispara chute para zona 1 | GameField.jsx | 237 |
| Zona 2 (CSD) | Botão | onClick | ✅ Funcional | Dispara chute para zona 2 | GameField.jsx | 237 |
| Zona 3 (CS) | Botão | onClick | ✅ Funcional | Dispara chute para zona 3 | GameField.jsx | 237 |
| Zona 4 (CIE) | Botão | onClick | ✅ Funcional | Dispara chute para zona 4 | GameField.jsx | 237 |
| Zona 5 (CID) | Botão | onClick | ✅ Funcional | Dispara chute para zona 5 | GameField.jsx | 237 |
| Zona 6 (CI) | Botão | onClick | ✅ Funcional | Dispara chute para zona 6 | GameField.jsx | 237 |
| Hover Zona | Mouse | onMouseEnter | ✅ Funcional | Toca som de hover | GameField.jsx | 238 |
| Botão - Aposta | Botão | onClick | ❌ Não implementado | Nenhum (decorativo) | Game.jsx | 264 |
| Botão + Aposta | Botão | onClick | ❌ Não implementado | Nenhum (decorativo) | Game.jsx | 270 |
| Botão - Chute | Botão | onClick | ✅ Funcional | Remove 1 chute | BettingControls.jsx | 24 |
| Botão + Chute | Botão | onClick | ✅ Funcional | Adiciona 1 chute | BettingControls.jsx | 34 |
| Botão Voltar (Header) | Botão | onClick | ✅ Funcional | Navega para dashboard | Game.jsx | 241 |
| Botão Nova Partida | Botão | onClick | ✅ Funcional | Reseta jogo completo | Game.jsx | 406 |
| Botão Voltar (Footer) | Botão | onClick | ✅ Funcional | Navega para dashboard | Game.jsx | 412 |
| Botão Menu | Botão | onClick | ✅ Funcional | Navega para dashboard | Game.jsx | 422 |
| Botão Mute | Botão | onClick | ✅ Funcional | Alterna som | SoundControls.jsx | 21 |
| Controle Volume | Input | onChange | ✅ Funcional | Ajusta volume | SoundControls.jsx | 42 |
| Botão Avançado | Botão | onClick | ✅ Funcional | Mostra controles extras | SoundControls.jsx | 58 |
| Botão Testar Torcida | Botão | onClick | ✅ Funcional | Toca som de torcida | SoundControls.jsx | 73 |
| Botão Testar Música | Botão | onClick | ✅ Funcional | Toca música de fundo | SoundControls.jsx | 79 |
| Expandir Recomendações | Botão | onClick | ✅ Funcional | Mostra/esconde recomendações | RecommendationsPanel.jsx | 60 |
| Dispensar Recomendação | Botão | onClick | ✅ Funcional | Remove recomendação | RecommendationsPanel.jsx | 136 |

---

## ⌨️ EVENTOS DE TECLADO

**Status:** ❌ **NÃO IMPLEMENTADOS**

Nenhum evento de teclado foi identificado na tela original do jogo. Todas as interações são via mouse/touch.

---

## 📱 EVENTOS DE TOQUE (Touch)

**Status:** ✅ **SUPORTADOS IMPLICITAMENTE**

Os botões HTML padrão (`<button>`) suportam eventos de toque automaticamente através do React. Não há implementação específica de gestos touch, mas os eventos `onClick` funcionam em dispositivos touch.

---

## 🔄 FLUXO DE INTERAÇÃO COMPLETO

### Fluxo de Chute:

1. **Usuário adiciona chutes** → `addShots()` → Atualiza `playerShots` e `totalShots`
2. **Usuário clica em zona** → `handleZoneClick()` → Toca som, anima goleiro/bola
3. **Callback disparado** → `onShoot(zoneId)` → Chama `handleShoot()` em `Game.jsx`
4. **Simulação de resultado** → `setTimeout` 2000ms → Calcula resultado aleatório
5. **Atualização de estado** → `setGameStatus('result')` → Mostra resultado
6. **Efeitos visuais** → Confetti, texto "GOL!" ou "Errou!" → Animações
7. **Reset automático** → `setTimeout` 2000ms → Volta para estado 'waiting'

### Fluxo de Controle de Som:

1. **Usuário clica em mute** → `toggleMute()` → Alterna `isMuted`
2. **Usuário ajusta volume** → `setSoundVolume()` → Atualiza `volume`
3. **Sons são tocados** → `playSound()` → Verifica `isMuted` antes de tocar

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

### Funcionalidades Não Implementadas:

1. **Botões de Ajuste de Aposta:** Os botões `-` e `+` ao lado do valor da aposta são apenas visuais. O valor é fixo em R$ 1.00.

2. **Teclado:** Não há suporte para navegação ou ações via teclado.

3. **Gestos Touch Avançados:** Não há suporte para gestos como swipe, pinch, etc.

### Funcionalidades Implementadas:

1. ✅ Todas as 6 zonas de chute funcionais
2. ✅ Controle de quantidade de chutes
3. ✅ Sistema de som completo
4. ✅ Navegação entre páginas
5. ✅ Reset de partida
6. ✅ Painel de recomendações interativo

---

**FIM DO MAPEAMENTO DE BOTÕES E INTERAÇÕES**

**⚠️ IMPORTANTE:** Este documento é apenas diagnóstico. Nenhuma alteração foi feita no código.

