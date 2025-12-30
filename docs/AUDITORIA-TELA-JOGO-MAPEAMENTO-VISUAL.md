# 🎨 AUDITORIA TELA DO JOGO - MAPEAMENTO VISUAL COMPLETO
## Sistema Gol de Ouro - Tela Original (Game.jsx + GameField.jsx)

**Data:** 2025-01-24  
**Auditor:** Auditor Técnico Sênior  
**Status:** 🛑 MODO DIAGNÓSTICO - SEM ALTERAÇÕES  
**Arquivos Auditados:** `Game.jsx`, `GameField.jsx`

---

## ✅ ETAPA 1 — CONFIRMAÇÃO DA TELA ORIGINAL

### 1.1 Localização dos Arquivos

**Arquivos Principais:**
- **Página:** `goldeouro-player/src/pages/Game.jsx` (433 linhas)
- **Componente Visual:** `goldeouro-player/src/components/GameField.jsx` (301 linhas)

### 1.2 Confirmação de Tecnologia

**✅ React Web Puro Confirmado:**

**Dependências Identificadas:**
```javascript
// Game.jsx
import { useState, useEffect, useCallback, useMemo } from 'react'  // ✅ React Web
import { useNavigate } from 'react-router-dom'                    // ✅ React Router Web
import GameField from '../components/GameField'                    // ✅ Componente React Web

// GameField.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'  // ✅ React Web
```

**❌ NÃO É React Native Web:**
- Não usa `react-native`
- Não usa `@react-navigation/native`
- Não usa componentes nativos (`View`, `Text`, `TouchableOpacity`)
- Usa componentes HTML padrão (`div`, `button`, etc.)

### 1.3 Dependências e Bibliotecas Usadas

**Hooks Customizados:**
- `useSimpleSound` - Sistema de som completo
- `useGamification` - Sistema de gamificação
- `usePlayerAnalytics` - Analytics do jogador
- `usePerformance` - Otimizações de performance
- `useSidebar` - Contexto de sidebar

**Componentes Auxiliares:**
- `OptimizedImage` - Otimização de imagens
- `ImageLoader` - Carregamento de imagens
- `BettingControls` - Controles de aposta
- `SoundControls` - Controles de som
- `AudioTest` - Teste de áudio
- `RecommendationsPanel` - Painel de recomendações IA
- `Navigation` - Navegação
- `Logo` - Logo do jogo

**Assets Esperados:**
- `/images/game/stadium-background.jpg`
- `/images/game/goalkeeper-3d.png`
- `/images/game/ball.png`
- `/images/game/goal-net-3d.png`
- `/sounds/kick.mp3`
- `/sounds/kick_2.mp3`
- `/sounds/gol.mp3`
- `/sounds/defesa.mp3`
- `/sounds/vaia.mp3`
- `/sounds/torcida.mp3`
- `/sounds/torcida_2.mp3`
- `/sounds/click.mp3`
- `/sounds/music.mp3`

---

## 🎨 ETAPA 2 — MAPEAMENTO VISUAL COMPLETO

### 2.1 GOLEIRO (GameField.jsx linhas 168-206)

**Localização:** `GameField.jsx` linhas 168-206

**Estrutura Visual:**
- **Corpo Principal:** 
  - Gradiente: `from-red-500 via-red-600 to-red-700`
  - Formato: `rounded-xl`
  - Sombra: `shadow-2xl`
  - Responsivo: Tamanhos variam por breakpoint (w-12 h-16 até xl:w-20 xl:h-24)

- **Cabeça:**
  - Posição: `absolute -top-2 left-1/2`
  - Tamanho: `w-8 h-8`
  - Cor: Gradiente `from-yellow-200 to-yellow-300`
  - Borda: `border-2 border-yellow-400`
  - Detalhes: Olhos (2 pontos pretos), boca (linha preta)

- **Braços:**
  - Esquerdo: `absolute top-1.5 left-0 w-5 h-6` com `transform -rotate-12`
  - Direito: `absolute top-1.5 right-0 w-5 h-6` com `transform rotate-12`
  - Cor: Gradiente `from-red-400 to-red-600`

- **Luvas:**
  - Esquerda: `absolute top-1 left-0 w-5 h-6` com `transform -rotate-12`
  - Direita: `absolute top-1 right-0 w-5 h-6` com `transform rotate-12`
  - Cor: Gradiente `from-gray-300 to-gray-400`

- **Pernas:**
  - Parte superior: `w-12 h-6` com gradiente `from-red-300 to-red-500`
  - Parte inferior: `w-8 h-3` com gradiente `from-red-400 to-red-600`

- **Detalhes do Uniforme:**
  - Listras verticais: `w-2 h-8 bg-black/40` (linhas 183-184)
  - Gradiente de textura: `from-red-400/30 to-red-800/30`

**Animações:**
- **Estado Idle:** Posição central, sem rotação
- **Estado Diving:** 
  - Rotação baseada na direção do chute:
    - Zona 1 ou 4: `transform -rotate-12` (esquerda)
    - Zona 2 ou 5: `transform rotate-12` (direita)
    - Zona 3: `transform -translate-y-2` (centro superior)
  - Transição: `transition-all duration-500`
  - Reset após 2000ms

**Posicionamento:**
- Posição inicial: `right-10 top-1/2 transform -translate-y-1/2`
- Z-index: `z-20`

### 2.2 BOLA (GameField.jsx linhas 208-231)

**Localização:** `GameField.jsx` linhas 208-231

**Estrutura Visual:**
- **Container Principal:**
  - Posição: `left-1/4 top-1/2 transform -translate-y-1/2`
  - Tamanho: `w-6 h-6`
  - Z-index: `z-20`

- **Bola Externa:**
  - Cor base: `bg-white`
  - Borda: `border-2 border-gray-300`
  - Sombra: `shadow-2xl`
  - Formato: `rounded-full`
  - Gradiente interno: `from-white via-gray-100 to-gray-200`

- **Padrão da Bola:**
  - Círculo preto interno: `inset-1 bg-black rounded-full`
  - Círculo branco interno: `inset-1 bg-white rounded-full`
  - Padrão de pontos pretos:
    - Topo: `top-0 left-1/2` (1 ponto)
    - Base: `bottom-0 left-1/2` (1 ponto)
    - Esquerda: `top-1/2 left-0` (1 ponto)
    - Direita: `top-1/2 right-0` (1 ponto)
  - Brilho: `top-0.5 left-0.5 w-1 h-1 bg-white/80 rounded-full blur-sm`

**Animações:**
- **Estado Ready:** Posição inicial (centro do campo)
- **Estado Shooting:**
  - Movimento baseado na direção:
    - Zona 1 ou 4: `translate-x-20 -translate-y-6` (esquerda + cima)
    - Zona 2 ou 5: `translate-x-20 translate-y-6` (direita + baixo)
    - Zona 3: `translate-x-20` (centro)
  - Transição: `transition-all duration-500`
  - Classe CSS: `ball-kick` (quando `ballPosition === 'shooting'`)

**Reset:**
- Retorna à posição inicial após 2000ms

### 2.3 GOL E REDE (GameField.jsx linhas 147-166)

**Localização:** `GameField.jsx` linhas 147-166

**Estrutura Visual:**
- **Container Principal:**
  - Posição: `right-0 top-1/2 transform -translate-y-1/2`
  - Tamanho: `w-20 h-40`
  - Z-index: `z-10`

- **Estrutura do Gol:**
  - Borda: `border-4 border-white`
  - Formato: `rounded-l-2xl` (arredondado à esquerda)
  - Gradiente: `from-white to-white/90`
  - Sombra: `shadow-2xl`

- **Rede do Gol:**
  - Container interno: `inset-2 bg-gradient-to-r from-white/40 to-transparent`
  - Formato: `rounded-l-xl`
  - Opacidade da malha: `opacity-60`

- **Malha da Rede:**
  - 20 círculos distribuídos em grade 5x4
  - Cada círculo: `w-3 h-3 border border-white/70 rounded-full`
  - Distribuição:
    - Horizontal: `8 + (i % 5) * 20%`
    - Vertical: `5 + Math.floor(i / 5) * 18%`

### 2.4 CAMPO DE FUTEBOL (GameField.jsx linhas 123-145)

**Localização:** `GameField.jsx` linhas 123-145

**Estrutura Visual:**
- **Gramado:**
  - Posição: `absolute bottom-0 left-0 right-0 h-3/4`
  - Gradiente: `from-green-800 via-green-600 to-green-500`
  - Textura SVG: Padrão de grama (linha 127)
  - Opacidade da textura: `opacity-30` e `opacity-40`

- **Linhas do Campo:**
  - **Linha de fundo:** `bottom-0 left-0 w-full h-1 bg-white/90`
  - **Linha central:** `bottom-0 left-1/2 w-32 h-1 bg-white/90`
  - **Ponto central:** `bottom-0 left-1/2 w-2 h-2 bg-white rounded-full`
  - **Círculo central:** `bottom-0 left-1/2 w-16 h-16 border border-white/90 rounded-full`
  - **Área de pênalti:** `bottom-0 left-1/2 w-24 h-16 border border-white/90 rounded-t-lg`
  - **Pequena área:** `bottom-0 left-1/2 w-12 h-8 border border-white/90 rounded-t-lg`

### 2.5 FUNDO DO ESTÁDIO (GameField.jsx linhas 106-121)

**Localização:** `GameField.jsx` linhas 106-121

**Estrutura Visual:**
- **Fundo Base:**
  - Gradiente: `from-slate-900 via-slate-800 to-slate-900`
  - Posição: `absolute inset-0`

- **Holofotes:**
  - **Superior Esquerdo:** `top-0 left-0 w-32 h-32 bg-yellow-300 rounded-full blur-3xl opacity-90 animate-pulse`
  - **Superior Direito:** `top-0 right-0 w-32 h-32 bg-yellow-300 rounded-full blur-3xl opacity-90 animate-pulse` (delay 0.5s)
  - **Distante Esquerdo:** `top-0 left-1/4 w-24 h-24 bg-blue-300 rounded-full blur-2xl opacity-60 animate-pulse` (delay 1s)
  - **Distante Direito:** `top-0 right-1/4 w-24 h-24 bg-blue-300 rounded-full blur-2xl opacity-60 animate-pulse` (delay 1.5s)

- **Arquibancadas:**
  - Gradiente: `from-slate-800/60 via-transparent to-slate-900/40`
  - Posição: `absolute inset-0`

### 2.6 ZONAS DE CHUTE (GameField.jsx linhas 233-257)

**Localização:** `GameField.jsx` linhas 233-257

**Configuração das Zonas:**
```javascript
const goalZones = [
  { id: 1, name: 'Canto Superior Esquerdo', x: 15, y: 15, multiplier: 2.0, difficulty: 'hard' },
  { id: 2, name: 'Canto Superior Direito', x: 85, y: 15, multiplier: 2.0, difficulty: 'hard' },
  { id: 3, name: 'Centro Superior', x: 50, y: 20, multiplier: 1.5, difficulty: 'medium' },
  { id: 4, name: 'Canto Inferior Esquerdo', x: 15, y: 70, multiplier: 1.8, difficulty: 'medium' },
  { id: 5, name: 'Canto Inferior Direito', x: 85, y: 70, multiplier: 1.8, difficulty: 'medium' },
  { id: 6, name: 'Centro Inferior', x: 50, y: 80, multiplier: 1.2, difficulty: 'easy' },
]
```

**Estrutura Visual:**
- **Botão de Zona:**
  - Tamanho: `w-8 h-8`
  - Formato: `rounded-full`
  - Borda: `border-2`
  - Z-index: `z-30`

- **Estados Visuais:**
  - **Selecionada:** `bg-yellow-400 border-yellow-300 zone-pulse shadow-2xl shadow-yellow-400/60`
  - **Disponível:** `bg-black/70 border-white/90 hover:bg-yellow-400/70 hover:scale-110 hover:shadow-xl hover:shadow-yellow-400/30`
  - **Desabilitada:** `bg-black/50 border-white/60`

- **Ponto Central:**
  - Tamanho: `w-2 h-2`
  - Cor: `bg-white`
  - Opacidade: `opacity-90`
  - Sombra: `shadow-sm`

- **Posicionamento:**
  - Direita: `${zone.x}%`
  - Topo: `${zone.y}%`
  - Transform: `translate(50%, -50%)`

### 2.7 EFEITOS VISUAIS

#### 2.7.1 Efeito de Gol (GameField.jsx linhas 259-268)

**Localização:** `GameField.jsx` linhas 259-268

**Estrutura:**
- Container: `absolute inset-0 flex items-center justify-center pointer-events-none z-50`
- Texto: `text-8xl font-bold goal-effect`
- Conteúdo:
  - "G" em `text-yellow-400 drop-shadow-2xl`
  - "⚽" em `text-white drop-shadow-2xl`
  - "L" em `text-yellow-400 drop-shadow-2xl`

**Ativação:**
- Quando `showGoal === true`
- Duração: 2000ms

#### 2.7.2 Confetti (GameField.jsx linhas 270-287)

**Localização:** `GameField.jsx` linhas 270-287

**Estrutura:**
- 20 partículas de confetti
- Cores: `['#fbbf24', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444']`
- Tamanho: `w-2 h-2`
- Animação: `animate-bounce`
- Posição aleatória: `left: ${Math.random() * 100}%`, `top: ${Math.random() * 100}%`
- Delay aleatório: `${Math.random() * 2}s`
- Duração aleatória: `${2 + Math.random() * 2}s`

**Ativação:**
- Quando `showGoal === true`
- Criado em `Game.jsx` linha 170-186

#### 2.7.3 Confetti do Game.jsx (Game.jsx linhas 170-186)

**Localização:** `Game.jsx` linhas 170-186

**Estrutura:**
- 50 partículas criadas dinamicamente
- Cores: `['#fbbf24', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444']`
- Tamanho: `w-2 h-2`
- Classe: `fixed w-2 h-2 confetti pointer-events-none z-50`
- Posição: `left: ${Math.random() * 100}vw`, `top: 100vh`
- Remoção: Após 3000ms

**Ativação:**
- Chamado em `createConfetti()` quando há gol (linha 123)

### 2.8 ESTADOS VISUAIS DO JOGO

#### 2.8.1 Estado "Waiting" (Game.jsx linhas 342-353)

**Localização:** `Game.jsx` linhas 342-353

**Visualização:**
- Mensagem: "Chute {currentShot + 1} de {playerShots}"
- Submensagem: "Escolha uma zona para chutar!"
- Ou: "Adicione chutes para começar a jogar!"

#### 2.8.2 Estado "Playing" (Game.jsx linhas 354-363)

**Localização:** `Game.jsx` linhas 354-363

**Visualização:**
- Texto: "Chutando..." em `text-yellow-400 font-bold animate-pulse`
- Indicadores: 3 pontos animados com `animate-bounce`
- Delay escalonado: `0s, 0.2s, 0.4s`

#### 2.8.3 Estado "Result" (Game.jsx linhas 364-378)

**Localização:** `Game.jsx` linhas 364-378

**Visualização:**
- **Gol:** 
  - Texto: "⚽ GOL!" em `text-4xl font-bold text-green-400 text-shadow-lg`
  - Mensagem: "Ganhou R$ {totalWin}!"
- **Erro:**
  - Texto: "❌ Errou!" em `text-4xl font-bold text-red-400`
  - Mensagem: "Perdeu R$ {amount}!"

### 2.9 SONS (useSimpleSound.jsx)

**Localização:** `goldeouro-player/src/hooks/useSimpleSound.jsx`

**Sons Disponíveis:**
- `kick.mp3` / `kick_2.mp3` - Som de chute
- `gol.mp3` - Som de gol
- `defesa.mp3` - Som de defesa
- `vaia.mp3` - Som de vaia
- `torcida.mp3` / `torcida_2.mp3` - Som de torcida
- `click.mp3` - Som de clique
- `music.mp3` - Música de fundo

**Quando Disparam:**
- **Chute:** `playKickSound()` - Ao clicar em zona (GameField linha 37)
- **Gol:** `playGoalSound()` - Quando `gameStatus === 'result' && selectedZone` (GameField linha 56)
- **Defesa/Erro:** `playDefenseSound()` ou `playMissSound()` - Quando `gameStatus === 'result' && !selectedZone` (GameField linhas 65-70)
- **Hover:** `playHoverSound()` - Ao passar mouse sobre zona (GameField linha 48)
- **Torcida:** `playCrowdSound()` - Aleatoriamente quando `gameStatus === 'waiting'` (GameField linha 79)
- **Celebração:** `playCelebrationSound()` - Quando há gol (Game.jsx linha 124)
- **Música de Fundo:** `playBackgroundMusic()` - Quando `totalShots > 0 && gameStatus === 'waiting'` (Game.jsx linha 85)

---

## 📊 RESUMO DO MAPEAMENTO VISUAL

### Elementos Principais

| Elemento | Arquivo | Linhas | Complexidade |
|----------|---------|--------|---------------|
| Goleiro | GameField.jsx | 168-206 | Alta (múltiplas partes, animações) |
| Bola | GameField.jsx | 208-231 | Média (padrão detalhado, animações) |
| Gol e Rede | GameField.jsx | 147-166 | Alta (estrutura 3D, malha) |
| Campo | GameField.jsx | 123-145 | Média (gramado, linhas) |
| Fundo | GameField.jsx | 106-121 | Alta (holofotes, arquibancadas) |
| Zonas | GameField.jsx | 233-257 | Média (6 zonas interativas) |
| Efeitos | GameField.jsx + Game.jsx | 259-287, 170-186 | Alta (confetti, texto animado) |

### Dependências Visuais

- **Assets de Imagem:** 4 arquivos esperados
- **Assets de Som:** 9 arquivos esperados
- **CSS Customizado:** Classes `goal-effect`, `ball-kick`, `goalkeeper-dive`, `zone-pulse`, `confetti`
- **Animações Tailwind:** `animate-pulse`, `animate-bounce`, `transition-all`

---

**FIM DO MAPEAMENTO VISUAL**

**⚠️ IMPORTANTE:** Este documento é apenas diagnóstico. Nenhuma alteração foi feita no código.

