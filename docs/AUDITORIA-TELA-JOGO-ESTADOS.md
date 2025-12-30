# 🔄 AUDITORIA TELA DO JOGO - MAPEAMENTO DE ESTADOS
## Sistema Gol de Ouro - Tela Original (Game.jsx + GameField.jsx)

**Data:** 2025-01-24  
**Auditor:** Auditor Técnico Sênior  
**Status:** 🛑 MODO DIAGNÓSTICO - SEM ALTERAÇÕES  
**Arquivos Auditados:** `Game.jsx`, `GameField.jsx`

---

## 📊 MAPEAMENTO COMPLETO DE ESTADOS

### 1. ESTADOS DO COMPONENTE Game.jsx

#### 1.1 Estados Principais (useState)

| Estado | Tipo | Valor Inicial | Linha | Finalidade | Quando Muda |
|--------|------|---------------|-------|------------|-------------|
| `playerShots` | number | 0 | 17 | Quantidade de chutes do jogador | `addShots()`, `removeShots()`, `resetGame()` |
| `totalShots` | number | 0 | 18 | Total de chutes na partida | `addShots()`, `removeShots()`, `resetGame()`, simulação de outros jogadores |
| `gameStatus` | string | 'waiting' | 19 | Status do jogo | `handleShoot()` → 'playing', depois → 'result', depois → 'waiting' |
| `gameResults` | array | [] | 20 | Histórico de resultados | `handleShoot()` adiciona novo resultado |
| `currentShot` | number | 0 | 21 | Chute atual do jogador | `handleShoot()` incrementa |
| `selectedZone` | number \| null | null | 22 | Zona selecionada para chute | `handleShoot()` define, `resetGame()` limpa |
| `gameResult` | object \| null | null | 23 | Resultado do último chute | `handleShoot()` define, `resetGame()` limpa |
| `balance` | number | 21.00 | 24 | Saldo do jogador | `handleShoot()` decrementa aposta, incrementa prêmio |
| `betAmount` | number | 1.00 | 25 | Valor da aposta (fixo) | Nunca muda (constante) |
| `isShooting` | boolean | false | 26 | Flag de chute em progresso | `handleShoot()` define true, depois false |

#### 1.2 Estado Complexo (gameStats)

**Localização:** `Game.jsx` linha 27-35

```javascript
const [gameStats, setGameStats] = useState({
  totalGoals: 0,           // Total de gols marcados
  totalBets: 0,            // Total de apostas feitas
  currentWinStreak: 0,     // Sequência atual de vitórias
  dailyWinnings: 0,         // Ganhos do dia
  totalReferrals: 0,        // Total de indicações
  nightGames: 0,            // Jogos noturnos
  goalsPerZone: []          // Array de IDs de zonas onde marcou gol
})
```

**Quando Muda:**
- `totalBets`: Incrementa em `handleShoot()` linha 100
- `totalGoals`: Incrementa quando há gol (linha 130)
- `currentWinStreak`: Incrementa em gol (linha 131), reseta em erro (linha 148)
- `dailyWinnings`: Incrementa com prêmio do gol (linha 132)
- `goalsPerZone`: Adiciona `zoneId` quando há gol (linha 133)

#### 1.3 Estados Computados (useMemo)

**Localização:** `Game.jsx` linhas 56-62, 216-223

**goalZones:**
```javascript
const goalZones = useMemo(() => [
  { id: 1, name: 'Canto Superior Esquerdo', x: 15, y: 15, multiplier: 2.0, difficulty: 'hard' },
  { id: 2, name: 'Canto Superior Direito', x: 85, y: 15, multiplier: 2.0, difficulty: 'hard' },
  { id: 3, name: 'Centro Superior', x: 50, y: 20, multiplier: 1.5, difficulty: 'medium' },
  { id: 4, name: 'Canto Inferior Esquerdo', x: 15, y: 70, multiplier: 1.8, difficulty: 'medium' },
  { id: 5, name: 'Canto Inferior Direito', x: 85, y: 70, multiplier: 1.8, difficulty: 'medium' },
], [])
```
- **Tipo:** Array constante
- **Dependências:** Nenhuma (array vazio)
- **Quando Muda:** Nunca (constante)

**totalWinnings:**
```javascript
const totalWinnings = useMemo(() => 
  gameResults.reduce((sum, result) => sum + result.totalWin, 0), 
  [gameResults]
)
```
- **Tipo:** number
- **Dependências:** `[gameResults]`
- **Quando Muda:** Sempre que `gameResults` muda

**totalInvestment:**
```javascript
const totalInvestment = useMemo(() => 
  gameResults.reduce((sum, result) => sum + result.amount, 0), 
  [gameResults]
)
```
- **Tipo:** number
- **Dependências:** `[gameResults]`
- **Quando Muda:** Sempre que `gameResults` muda

#### 1.4 Estados de Contexto

**useSidebar:**
- **Localização:** `Game.jsx` linha 16
- **Tipo:** Object com `isCollapsed`
- **Fonte:** `contexts/SidebarContext`
- **Uso:** Controla largura do conteúdo principal

**useNavigate:**
- **Localização:** `Game.jsx` linha 36
- **Tipo:** Function
- **Fonte:** `react-router-dom`
- **Uso:** Navegação entre páginas

#### 1.5 Estados de Hooks Customizados

**useSimpleSound:**
- **Localização:** `Game.jsx` linhas 38-43
- **Retorna:**
  - `playButtonClick` - Função
  - `playCelebrationSound` - Função
  - `playCrowdSound` - Função
  - `playBackgroundMusic` - Função
- **Estado Interno:** `isMuted`, `volume` (gerenciado pelo hook)

**useGamification:**
- **Localização:** `Game.jsx` linhas 45-49
- **Retorna:**
  - `addExperience` - Função
  - `updateUserStats` - Função
  - `getUserStats` - Função
- **Estado Interno:** `userLevel`, `experience`, `achievements`, `badges`, `points`, `rank` (gerenciado pelo hook)

**usePlayerAnalytics:**
- **Localização:** `Game.jsx` linhas 51-54
- **Retorna:**
  - `updatePlayerData` - Função
  - `getCurrentRecommendations` - Função
- **Estado Interno:** `playerData` com `gameHistory`, `patterns`, `recommendations` (gerenciado pelo hook)

---

### 2. ESTADOS DO COMPONENTE GameField.jsx

#### 2.1 Estados Principais (useState)

| Estado | Tipo | Valor Inicial | Linha | Finalidade | Quando Muda |
|--------|------|---------------|-------|------------|-------------|
| `goalkeeperPose` | string | 'idle' | 8 | Pose do goleiro | `handleZoneClick()` → 'diving', reset após 2000ms → 'idle' |
| `ballPosition` | string | 'ready' | 9 | Posição da bola | `handleZoneClick()` → 'shooting', reset após 2000ms → 'ready' |
| `showGoal` | boolean | false | 10 | Mostrar efeito de gol | `useEffect` quando `gameStatus === 'result' && selectedZone` → true, depois false após 2000ms |
| `animationKey` | number | 0 | 11 | Chave para forçar re-render | `handleZoneClick()` incrementa |
| `shootDirection` | number \| null | null | 12 | Direção do chute | `handleZoneClick()` define, reset após 2000ms → null |

#### 2.2 Estados de Hooks Customizados

**useSimpleSound:**
- **Localização:** `GameField.jsx` linhas 14-22
- **Retorna:**
  - `playKickSound` - Função
  - `playGoalSound` - Função
  - `playMissSound` - Função
  - `playDefenseSound` - Função
  - `playHoverSound` - Função
  - `playCrowdSound` - Função
  - `isMuted` - boolean
- **Estado Interno:** Gerenciado pelo hook

**usePerformance:**
- **Localização:** `GameField.jsx` linha 24
- **Retorna:**
  - `optimizedSettings` - Object
- **Estado Interno:** Gerenciado pelo hook

#### 2.3 Estados Computados (useMemo)

**goalZones:**
```javascript
const goalZones = useMemo(() => [
  { id: 1, name: 'Canto Superior Esquerdo', x: 15, y: 15, multiplier: 2.0, difficulty: 'hard' },
  { id: 2, name: 'Canto Superior Direito', x: 85, y: 15, multiplier: 2.0, difficulty: 'hard' },
  { id: 3, name: 'Centro Superior', x: 50, y: 20, multiplier: 1.5, difficulty: 'medium' },
  { id: 4, name: 'Canto Inferior Esquerdo', x: 15, y: 70, multiplier: 1.8, difficulty: 'medium' },
  { id: 5, name: 'Canto Inferior Direito', x: 85, y: 70, multiplier: 1.8, difficulty: 'medium' },
  { id: 6, name: 'Centro Inferior', x: 50, y: 80, multiplier: 1.2, difficulty: 'easy' },
], [])
```
- **Tipo:** Array constante
- **Dependências:** Nenhuma
- **Nota:** Tem 6 zonas (GameField) vs 5 zonas (Game.jsx)

**imageSources:**
```javascript
const imageSources = useMemo(() => [
  '/images/game/stadium-background.jpg',
  '/images/game/goalkeeper-3d.png',
  '/images/game/ball.png',
  '/images/game/goal-net-3d.png'
], [])
```
- **Tipo:** Array constante
- **Dependências:** Nenhuma
- **Uso:** Pré-carregamento de imagens

#### 2.4 Props Recebidas

| Prop | Tipo | Fonte | Uso |
|------|------|-------|-----|
| `onShoot` | function | Game.jsx | Callback quando zona é clicada |
| `gameStatus` | string | Game.jsx | Controla estados visuais |
| `selectedZone` | number \| null | Game.jsx | Zona selecionada |
| `currentShot` | number | Game.jsx | Chute atual |
| `totalShots` | number | Game.jsx | Total de chutes |

---

### 3. FLUXO DE ESTADOS DURANTE UM CHUTE

#### 3.1 Estado Inicial (Waiting)

```
gameStatus: 'waiting'
isShooting: false
goalkeeperPose: 'idle'
ballPosition: 'ready'
selectedZone: null
shootDirection: null
showGoal: false
```

#### 3.2 Ao Clicar em Zona (Playing)

```
gameStatus: 'playing'                    // Game.jsx linha 93
isShooting: true                         // Game.jsx linha 94
balance: balance - betAmount             // Game.jsx linha 95
selectedZone: zoneId                     // Game.jsx linha 92
shootDirection: zoneId                   // GameField.jsx linha 38
goalkeeperPose: 'diving'                 // GameField.jsx linha 39
ballPosition: 'shooting'                 // GameField.jsx linha 40
animationKey: animationKey + 1           // GameField.jsx linha 41
```

#### 3.3 Após 2 Segundos (Result)

```
gameStatus: 'result'                     // Game.jsx linha 118
isShooting: false                        // Game.jsx linha 119
gameResult: { zone, isGoal, amount, multiplier, totalWin }  // Game.jsx linha 115
gameResults: [...prev, result]           // Game.jsx linha 116
currentShot: currentShot + 1             // Game.jsx linha 117

// Se gol:
balance: balance + totalWin               // Game.jsx linha 122
showGoal: true                           // GameField.jsx linha 55
gameStats.totalGoals: +1                 // Game.jsx linha 130
gameStats.currentWinStreak: +1           // Game.jsx linha 131
gameStats.dailyWinnings: +totalWin       // Game.jsx linha 132
gameStats.goalsPerZone: [...prev, zoneId] // Game.jsx linha 133

// Se erro:
gameStats.currentWinStreak: 0            // Game.jsx linha 148
```

#### 3.4 Após Mostrar Resultado (Reset)

```
gameStatus: 'waiting'                    // Game.jsx linha 163 (após 2000ms)
gameResult: null                          // Game.jsx linha 164
showGoal: false                           // GameField.jsx linha 57 (após 2000ms)
goalkeeperPose: 'idle'                    // GameField.jsx linha 88 (após 2000ms)
ballPosition: 'ready'                     // GameField.jsx linha 89
shootDirection: null                      // GameField.jsx linha 90
```

---

### 4. ESTADOS DERIVADOS E COMPUTADOS

#### 4.1 Condições de Renderização

**Zonas Habilitadas:**
```javascript
gameStatus === 'waiting' && currentShot < totalShots
```

**Botões de Ação Visíveis:**
```javascript
currentShot >= playerShots || totalShots >= 10
```

**Efeito de Gol Visível:**
```javascript
showGoal === true && gameStatus === 'result' && selectedZone !== null
```

**Confetti Visível:**
```javascript
showGoal === true
```

**Resultados Visíveis:**
```javascript
gameResults.length > 0
```

#### 4.2 Cálculos em Tempo Real

**Barra de Progresso:**
```javascript
width: `${(totalShots / 10) * 100}%`
```

**Mensagem de Chutes Restantes:**
```javascript
totalShots >= 10 ? 'Partida Completa!' : `${10 - totalShots} chutes restantes`
```

**Mensagem de Chute Atual:**
```javascript
currentShot < playerShots ? `Chute ${currentShot + 1} de ${playerShots}` : 'Adicione chutes para começar a jogar!'
```

---

### 5. ESTADOS DE HOOKS CUSTOMIZADOS (Detalhado)

#### 5.1 useSimpleSound

**Estados Internos:**
- `isMuted`: boolean (inicial: false)
- `volume`: number (inicial: 0.7)
- `audioRefs`: useRef (objeto com referências de áudio)

**Mudanças:**
- `isMuted`: Alterna via `toggleMute()`
- `volume`: Atualiza via `setSoundVolume()`

#### 5.2 useGamification

**Estados Internos:**
- `userLevel`: number (inicial: 1)
- `experience`: number (inicial: 0)
- `achievements`: array (inicial: [])
- `badges`: array (inicial: [])
- `points`: number (inicial: 0)
- `rank`: number (inicial: 0)
- `nextLevelExp`: number (inicial: 100)

**Mudanças:**
- `experience`: Incrementa via `addExperience()`
- `userLevel`: Atualiza quando experiência ultrapassa threshold
- `achievements`: Adiciona via `checkAchievements()`
- `badges`: Adiciona via `checkBadges()`
- Persistência: localStorage (`gamification_data`)

#### 5.3 usePlayerAnalytics

**Estados Internos:**
- `playerData`: object com:
  - `gameHistory`: array (inicial: [])
  - `patterns`: object (inicial: {})
  - `recommendations`: array (inicial: [])
  - `lastUpdated`: string | null (inicial: null)

**Mudanças:**
- `gameHistory`: Adiciona via `updatePlayerData()`
- `patterns`: Recalcula via `analyzePatterns()`
- `recommendations`: Recalcula via `generateRecommendations()`
- Persistência: localStorage (`player_analytics`)

---

### 6. ESTADOS DE EFEITOS (useEffect)

#### 6.1 Game.jsx

**Efeito 1: Simulação de Outros Jogadores (linhas 65-79)**
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    if (totalShots < 10) {
      const randomShots = Math.floor(Math.random() * 3) + 1
      setTotalShots(prev => Math.min(prev + randomShots, 10))
      if (Math.random() > 0.5) {
        playCrowdSound()
      }
    }
  }, 2000)
  return () => clearInterval(interval)
}, [totalShots, playCrowdSound])
```
- **Dependências:** `totalShots`, `playCrowdSound`
- **Ação:** Incrementa `totalShots` a cada 2 segundos
- **Limite:** Para quando `totalShots >= 10`

**Efeito 2: Música de Fundo (linhas 82-87)**
```javascript
useEffect(() => {
  if (totalShots > 0 && gameStatus === 'waiting') {
    setTimeout(() => playBackgroundMusic(), 1000)
  }
}, [totalShots, gameStatus, playBackgroundMusic])
```
- **Dependências:** `totalShots`, `gameStatus`, `playBackgroundMusic`
- **Ação:** Toca música quando jogo começa

#### 6.2 GameField.jsx

**Efeito 1: Efeito de Gol (linhas 53-59)**
```javascript
useEffect(() => {
  if (gameStatus === 'result' && selectedZone) {
    setShowGoal(true)
    playGoalSound()
    setTimeout(() => setShowGoal(false), 2000)
  }
}, [gameStatus, selectedZone, playGoalSound])
```
- **Dependências:** `gameStatus`, `selectedZone`, `playGoalSound`
- **Ação:** Mostra efeito de gol e toca som

**Efeito 2: Efeito de Erro/Defesa (linhas 62-72)**
```javascript
useEffect(() => {
  if (gameStatus === 'result' && !selectedZone) {
    const useDefense = Math.random() > 0.7
    if (useDefense) {
      playDefenseSound()
    } else {
      playMissSound()
    }
  }
}, [gameStatus, selectedZone, playMissSound, playDefenseSound])
```
- **Dependências:** `gameStatus`, `selectedZone`, `playMissSound`, `playDefenseSound`
- **Ação:** Toca som de defesa ou vaia

**Efeito 3: Torcida Aleatória (linhas 75-82)**
```javascript
useEffect(() => {
  if (gameStatus === 'waiting') {
    if (Math.random() > 0.8) {
      playCrowdSound()
    }
  }
}, [gameStatus, playCrowdSound])
```
- **Dependências:** `gameStatus`, `playCrowdSound`
- **Ação:** 20% de chance de tocar torcida

**Efeito 4: Reset do Goleiro (linhas 85-93)**
```javascript
useEffect(() => {
  if (goalkeeperPose === 'diving') {
    setTimeout(() => {
      setGoalkeeperPose('idle')
      setBallPosition('ready')
      setShootDirection(null)
    }, 2000)
  }
}, [goalkeeperPose])
```
- **Dependências:** `goalkeeperPose`
- **Ação:** Reseta animações após 2000ms

---

## 📊 RESUMO DE ESTADOS

### Contagem Total:

- **Game.jsx:** 11 estados useState + 3 useMemo + múltiplos estados de hooks
- **GameField.jsx:** 5 estados useState + 2 useMemo + estados de hooks
- **Hooks Customizados:** ~15 estados internos

### Estados Críticos para Integração Backend:

1. `balance` - Precisa vir do backend
2. `gameResult.isGoal` - Precisa vir do backend
3. `gameResult.totalWin` - Precisa vir do backend
4. `gameStats` - Pode ser calculado no backend
5. `playerShots` / `totalShots` - Sistema de lotes do backend

---

**FIM DO MAPEAMENTO DE ESTADOS**

**⚠️ IMPORTANTE:** Este documento é apenas diagnóstico. Nenhuma alteração foi feita no código.

