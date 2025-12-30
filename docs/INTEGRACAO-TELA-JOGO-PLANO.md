# 🔧 INTEGRAÇÃO TELA JOGO - PLANO TÉCNICO DETALHADO
## Sistema Gol de Ouro - Integração Game.jsx + GameField.jsx com Backend Real

**Data:** 2025-01-24  
**Engenheiro:** Engenheiro Sênior Fullstack  
**Status:** 📋 PLANO TÉCNICO - SEM IMPLEMENTAÇÃO  
**Objetivo:** Integrar tela original ao backend real SEM ALTERAR NADA VISUAL

---

## 🎯 OBJETIVO PRINCIPAL

Integrar a tela original do jogo (`Game.jsx` + `GameField.jsx`) ao backend real **SEM ALTERAR NADA VISUAL**.

**Foco:** Apenas integração lógica, mantendo:
- ✅ Goleiro
- ✅ Bola
- ✅ Gol
- ✅ Animações
- ✅ Sons
- ✅ Layout
- ✅ UX original

---

## 📋 TAREFA 1 — AUDITORIA PASSIVA (CONCLUÍDA)

### Estados do Game.jsx

**Estados Principais:**
- `playerShots` (number) - Quantidade de chutes do jogador
- `totalShots` (number) - Total de chutes na partida
- `gameStatus` (string) - Status: 'waiting' | 'playing' | 'result'
- `gameResults` (array) - Histórico de resultados
- `currentShot` (number) - Chute atual
- `selectedZone` (number | null) - Zona selecionada
- `gameResult` (object | null) - Resultado do último chute
- `balance` (number) - **SALDO (ATUALMENTE FIXO: 21.00)**
- `betAmount` (number) - Valor da aposta (fixo: 1.00)
- `isShooting` (boolean) - Flag de chute em progresso
- `gameStats` (object) - Estatísticas do jogo

### Função que Processa o Chute

**Localização:** `Game.jsx` linhas 89-168

**Função:** `handleShoot(zoneId)`

**Fluxo Atual (SIMULADO):**
1. Validações locais (linha 90)
2. Define zona selecionada (linha 92)
3. Muda status para 'playing' (linha 93)
4. **Decrementa saldo localmente** (linha 95) ← SIMULADO
5. Atualiza estatísticas (linhas 98-101)
6. **Simula resultado após 2 segundos** (linha 104) ← SIMULADO
7. **Calcula resultado aleatório** (linha 106: `Math.random() > 0.4`) ← SIMULADO
8. **Calcula prêmio localmente** (linha 112) ← SIMULADO
9. Atualiza estados visuais
10. **Incrementa saldo localmente se gol** (linha 122) ← SIMULADO

### Onde Hoje Existe Simulação

**1. Resultado do Chute (linha 106):**
```javascript
const isGoal = Math.random() > 0.4 // 60% de chance de gol ← SIMULADO
```

**2. Cálculo de Prêmio (linha 112):**
```javascript
totalWin: isGoal ? (betAmount * zone.multiplier) : 0 // ← CALCULADO LOCALMENTE
```

**3. Atualização de Saldo (linhas 95, 122):**
```javascript
setBalance(prev => prev - betAmount) // ← SIMULADO
setBalance(prev => prev + result.totalWin) // ← SIMULADO
```

**4. Simulação de Outros Jogadores (linhas 65-79):**
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    if (totalShots < 10) {
      const randomShots = Math.floor(Math.random() * 3) + 1
      setTotalShots(prev => Math.min(prev + randomShots, 10)) // ← SIMULADO
    }
  }, 2000)
}, [totalShots])
```

**5. Saldo Inicial (linha 24):**
```javascript
const [balance, setBalance] = useState(21.00) // ← VALOR FIXO
```

### Onde Entram Resultados (Gol / Defesa)

**1. Estado `gameResult` (linha 115):**
```javascript
setGameResult(result) // ← Recebe objeto com isGoal, totalWin, etc.
```

**2. Renderização Condicional (linhas 364-378):**
```javascript
{gameStatus === 'result' && gameResult && (
  // Mostra "⚽ GOL!" ou "❌ Errou!"
  // Mostra prêmio ou perda
)}
```

**3. Efeitos Visuais em GameField.jsx:**
- Linha 54: `showGoal` quando `gameStatus === 'result' && selectedZone`
- Linha 56: Toca som de gol
- Linha 123: Cria confetti quando há gol

### Onde Saldo é Atualizado Visualmente

**1. Exibição do Saldo (linha 279):**
```javascript
<span className="text-white font-bold">R$ {balance.toFixed(2)}</span>
```

**2. Validação de Saldo (BettingControls.jsx):**
- Passa `balance` como prop
- Usado para desabilitar botões quando saldo insuficiente

---

## 🔗 TAREFA 2 — MAPEAR PONTE COM BACKEND

### Backend Real

#### Endpoint de Chute Real

**Endpoint:** `POST /api/games/shoot`

**Payload Esperado:**
```json
{
  "direction": "TL" | "TR" | "C" | "BL" | "BR",
  "amount": 1 | 2 | 5 | 10
}
```

**Resposta Real:**
```json
{
  "success": true,
  "data": {
    "shot": {
      "id": "uuid",
      "direction": "TL",
      "amount": 1,
      "result": "goal" | "miss",
      "isWinner": true | false,
      "prize": 2.0,
      "goldenGoalPrize": 0 | 100,
      "isGoldenGoal": false,
      "timestamp": "2025-01-24T10:00:00Z"
    },
    "lote": {
      "id": "uuid",
      "progress": {
        "current": 3,
        "total": 10
      },
      "isComplete": false
    },
    "user": {
      "newBalance": 20.00,
      "globalCounter": 1234
    },
    "isGolDeOuro": false
  }
}
```

**Serviço Disponível:** `gameService.processShot(direction, amount)`

#### Endpoint de Saldo

**Endpoint:** `GET /api/user/profile`

**Resposta Real:**
```json
{
  "success": true,
  "data": {
    "saldo": 50.00,
    "email": "usuario@email.com",
    "id": "uuid"
  }
}
```

**Serviço Disponível:** `gameService.loadUserData()`

#### Endpoint de Inicialização do Jogo

**Endpoint Composto:** `gameService.initialize()`

**Chama:**
1. `GET /api/user/profile` (saldo)
2. `GET /api/metrics` (contador global)

**Retorna:**
```javascript
{
  success: true,
  userData: { saldo: 50.00, ... },
  gameInfo: {
    user: { balance: 50.00, canPlay: true },
    lote: { ... },
    goldenGoal: { ... },
    config: { ... }
  }
}
```

**Serviço Disponível:** `gameService.initialize()`

### Frontend

#### Onde o Resultado do Chute Entra na Animação

**Fluxo Atual:**
1. `handleShoot(zoneId)` é chamado (Game.jsx linha 89)
2. `setGameStatus('playing')` (linha 93) → Inicia animação
3. `setTimeout` 2000ms (linha 104) → Simula delay
4. `setGameResult(result)` (linha 115) → Define resultado
5. `setGameStatus('result')` (linha 118) → Mostra resultado
6. GameField.jsx detecta `gameStatus === 'result'` (linha 54)
7. Mostra efeito visual de gol (linha 55-57)

**Fluxo Após Integração:**
1. `handleShoot(zoneId)` é chamado
2. `setGameStatus('playing')` → Inicia animação
3. **Chama `gameService.processShot()`** → Aguarda resposta
4. **Recebe resultado real do backend**
5. `setGameResult(result)` → Define resultado real
6. `setGameStatus('result')` → Mostra resultado
7. GameField.jsx detecta e mostra efeito visual (sem alteração)

#### Onde o Saldo é Exibido

**Localização:** `Game.jsx` linha 279

**Código Atual:**
```javascript
<span className="text-white font-bold">R$ {balance.toFixed(2)}</span>
```

**Após Integração:**
- Mesmo código (sem alteração visual)
- `balance` virá do backend ao invés de valor fixo

#### Onde Mensagens de Erro Podem Ser Encaixadas

**Opções de Integração:**

**1. Toast Notifications (já existe no projeto):**
```javascript
import { toast } from 'react-toastify'
toast.error('Saldo insuficiente')
```

**2. Estado de Erro:**
```javascript
const [error, setError] = useState('')
// Exibir em componente de erro (sem alterar visual principal)
```

**3. Modal de Erro (se necessário):**
- Criar componente de erro discreto
- Não alterar layout principal

---

## 🔄 MAPA DE INTEGRAÇÃO 1:1

### Fluxo Completo de Integração

| Estado Atual | Ação | Endpoint | Resposta | Estado Atualizado |
|--------------|------|----------|----------|-------------------|
| `balance = 21.00` (fixo) | Inicialização | `gameService.initialize()` | `userData.saldo` | `balance = userData.saldo` |
| `handleShoot()` simulado | Processar chute | `gameService.processShot(dir, amount)` | `result.shot.isWinner` | `gameResult.isGoal = result.shot.isWinner` |
| `balance -= betAmount` (local) | Processar chute | `gameService.processShot()` | `result.user.newBalance` | `balance = result.user.newBalance` |
| `totalShots` simulado | Processar chute | `gameService.processShot()` | `result.lote.progress` | `totalShots = result.lote.progress.total` |
| `Math.random() > 0.4` | Processar chute | `gameService.processShot()` | `result.shot.isWinner` | `isGoal = result.shot.isWinner` |
| `betAmount * multiplier` (local) | Processar chute | `gameService.processShot()` | `result.shot.prize` | `totalWin = result.shot.prize + result.shot.goldenGoalPrize` |

### Mapeamento Detalhado

**1. Inicialização:**
```
Estado: balance = 21.00 (fixo)
  ↓
Chama: gameService.initialize()
  ↓
Endpoint: GET /api/user/profile + GET /api/metrics
  ↓
Recebe: { userData: { saldo: 50.00 }, gameInfo: { ... } }
  ↓
Atualiza: setBalance(userData.saldo)
```

**2. Processamento de Chute:**
```
Estado: handleShoot(zoneId) com simulação
  ↓
Chama: gameService.processShot(direction, amount)
  ↓
Endpoint: POST /api/games/shoot
  ↓
Recebe: { shot: { isWinner: true, prize: 2.0 }, user: { newBalance: 48.00 } }
  ↓
Atualiza: 
  - setGameResult({ isGoal: result.shot.isWinner, totalWin: result.shot.prize })
  - setBalance(result.user.newBalance)
  - setGameStatus('result')
```

**3. Sistema de Lotes:**
```
Estado: totalShots simulado (interval)
  ↓
Remove: useEffect com simulação (linhas 65-79)
  ↓
Usa: result.lote.progress do backend
  ↓
Atualiza: setTotalShots(result.lote.progress.total)
```

---

## 🔧 TAREFA 3 — PLANO DE ALTERAÇÃO (SEM EXECUTAR)

### Alterações Permitidas

#### 1. Substituir Simulação do handleShoot

**Arquivo:** `Game.jsx`

**Linhas Afetadas:** 89-168

**Alteração:**
```javascript
// ANTES (SIMULADO):
const handleShoot = useCallback((zoneId) => {
  // ... validações ...
  setTimeout(() => {
    const isGoal = Math.random() > 0.4 // ← SIMULADO
    // ...
  }, 2000)
}, [])

// DEPOIS (REAL):
const handleShoot = useCallback(async (zoneId) => {
  if (isShooting) return
  
  // Mapear zoneId para direction (TL, TR, C, BL, BR)
  const directionMap = {
    1: 'TL', // Canto Superior Esquerdo
    2: 'TR', // Canto Superior Direito
    3: 'C',  // Centro Superior
    4: 'BL', // Canto Inferior Esquerdo
    5: 'BR', // Canto Inferior Direito
    6: 'C'   // Centro Inferior (mapear para C)
  }
  
  const direction = directionMap[zoneId]
  if (!direction) return
  
  setSelectedZone(zoneId)
  setGameStatus('playing')
  setIsShooting(true)
  
  try {
    // Chamar backend real
    const result = await gameService.processShot(direction, betAmount)
    
    if (result.success) {
      const zone = goalZones.find(z => z.id === zoneId)
      const isGoal = result.shot.isWinner
      const totalWin = result.shot.prize + (result.shot.goldenGoalPrize || 0)
      
      const gameResult = {
        zone: zoneId,
        isGoal,
        amount: betAmount,
        multiplier: zone.multiplier,
        totalWin
      }
      
      setGameResult(gameResult)
      setGameResults(prev => [...prev, gameResult])
      setCurrentShot(prev => prev + 1)
      setGameStatus('result')
      setIsShooting(false)
      
      // Atualizar saldo com valor do backend
      setBalance(result.user.newBalance)
      
      if (isGoal) {
        createConfetti()
        playCelebrationSound()
        // ... resto da lógica igual ...
      }
      
      // Reset após mostrar resultado
      setTimeout(() => {
        setGameStatus('waiting')
        setGameResult(null)
      }, 2000)
    } else {
      // Tratar erro
      setError(result.error)
      setIsShooting(false)
      setGameStatus('waiting')
      // Mostrar mensagem de erro (toast)
    }
  } catch (error) {
    // Tratar erro de rede
    setError(error.message)
    setIsShooting(false)
    setGameStatus('waiting')
  }
}, [isShooting, betAmount, goalZones, playCelebrationSound, addExperience, updateUserStats])
```

**Impacto Visual:** ✅ **ZERO** - Apenas substitui lógica interna

#### 2. Integrar gameService.processShot()

**Arquivo:** `Game.jsx`

**Alteração:**
- Adicionar import: `import gameService from '../services/gameService'`
- Usar `gameService.processShot()` no `handleShoot`

**Impacto Visual:** ✅ **ZERO**

#### 3. Carregar Saldo Real ao Montar a Tela

**Arquivo:** `Game.jsx`

**Linhas Afetadas:** 24, adicionar useEffect

**Alteração:**
```javascript
// ANTES:
const [balance, setBalance] = useState(21.00)

// DEPOIS:
const [balance, setBalance] = useState(0)
const [loading, setLoading] = useState(true)

// Adicionar useEffect de inicialização:
useEffect(() => {
  const initializeGame = async () => {
    try {
      setLoading(true)
      const result = await gameService.initialize()
      
      if (result.success) {
        setBalance(result.userData.saldo)
        // Carregar outras informações se necessário
      } else {
        setError(result.error || 'Erro ao carregar dados')
      }
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }
  
  initializeGame()
}, [])
```

**Impacto Visual:** ✅ **ZERO** - Apenas valor inicial muda

#### 4. Tratar Loading e Erro Sem Impacto Visual

**Arquivo:** `Game.jsx`

**Alteração:**
- Adicionar estado `loading` (já mencionado acima)
- Adicionar estado `error`
- Mostrar loading apenas durante inicialização (tela já carregada)
- Mostrar erro via toast (não altera layout)

**Impacto Visual:** ✅ **ZERO** - Toast é overlay, não altera layout

#### 5. Remover Simulação de Outros Jogadores

**Arquivo:** `Game.jsx`

**Linhas Afetadas:** 65-79

**Alteração:**
```javascript
// REMOVER COMPLETAMENTE:
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

// SUBSTITUIR POR:
// Usar progresso do lote do backend após cada chute
// Atualizar totalShots com result.lote.progress.total
```

**Impacto Visual:** ✅ **ZERO** - Apenas remove simulação

---

## 📄 ALTERAÇÕES DETALHADAS POR ARQUIVO

### Arquivo: `Game.jsx`

**Alterações Necessárias:**

1. **Import gameService (linha ~13):**
```javascript
import gameService from '../services/gameService'
```

2. **Import toast (linha ~13):**
```javascript
import { toast } from 'react-toastify'
```

3. **Estado balance (linha 24):**
```javascript
// ANTES:
const [balance, setBalance] = useState(21.00)

// DEPOIS:
const [balance, setBalance] = useState(0)
const [loading, setLoading] = useState(true)
const [error, setError] = useState('')
```

4. **useEffect de inicialização (após linha 87):**
```javascript
// Adicionar novo useEffect para inicialização
useEffect(() => {
  const initializeGame = async () => {
    try {
      setLoading(true)
      const result = await gameService.initialize()
      
      if (result.success) {
        setBalance(result.userData.saldo)
      } else {
        setError(result.error || 'Erro ao carregar dados')
        toast.error(result.error || 'Erro ao carregar dados')
      }
    } catch (error) {
      setError(error.message)
      toast.error('Erro ao carregar dados do jogo')
    } finally {
      setLoading(false)
    }
  }
  
  initializeGame()
}, [])
```

5. **Remover useEffect de simulação (linhas 65-79):**
```javascript
// REMOVER COMPLETAMENTE este useEffect
```

6. **Alterar handleShoot (linhas 89-168):**
```javascript
// Substituir função completa conforme plano acima
// Tornar async
// Substituir setTimeout por await gameService.processShot()
// Usar resultado real do backend
```

7. **Adicionar mapeamento de zonas:**
```javascript
// Adicionar função helper ou constante:
const zoneIdToDirection = {
  1: 'TL',
  2: 'TR',
  3: 'C',
  4: 'BL',
  5: 'BR',
  6: 'C' // Centro Inferior mapeia para C
}
```

**Total de Linhas Alteradas:** ~80 linhas (substituição de função + adições)

**Impacto Visual:** ✅ **ZERO**

### Arquivo: `GameField.jsx`

**Alterações Necessárias:** ❌ **NENHUMA**

**Status:** ✅ **SOMENTE LEITURA** - Não será alterado

---

## ⚠️ VALIDAÇÕES E TRATAMENTO DE ERROS

### Validações Necessárias

1. **Saldo Insuficiente:**
   - Validar antes de chamar `gameService.processShot()`
   - Mostrar mensagem: "Saldo insuficiente"
   - Não iniciar animação se saldo insuficiente

2. **Erro de Rede:**
   - Capturar erro em try/catch
   - Mostrar toast de erro
   - Resetar estado para 'waiting'
   - Permitir tentar novamente

3. **Erro de Autenticação:**
   - Detectar erro 401/403
   - Redirecionar para login
   - Limpar estados locais

4. **Erro de Validação:**
   - Backend pode rejeitar chute
   - Mostrar mensagem específica
   - Não descontar saldo se rejeitado

### Tratamento de Erros

**Estratégia:**
- Usar toast notifications (já existe no projeto)
- Não alterar layout principal
- Manter estados consistentes
- Permitir retry após erro

---

## 🎯 EXEMPLO CONCEITUAL ESPERADO

### handleShoot(direction) - Antes vs Depois

**ANTES (Simulado):**
```javascript
const handleShoot = useCallback((zoneId) => {
  setGameStatus('playing')
  setBalance(prev => prev - betAmount) // ← SIMULADO
  
  setTimeout(() => {
    const isGoal = Math.random() > 0.4 // ← SIMULADO
    const totalWin = isGoal ? (betAmount * multiplier) : 0 // ← CALCULADO
    
    setGameResult({ isGoal, totalWin })
    setGameStatus('result')
    setBalance(prev => prev + totalWin) // ← SIMULADO
  }, 2000)
}, [])
```

**DEPOIS (Real):**
```javascript
const handleShoot = useCallback(async (zoneId) => {
  setGameStatus('playing') // ← MANTÉM (inicia animação)
  
  try {
    const direction = zoneIdToDirection[zoneId]
    const result = await gameService.processShot(direction, betAmount) // ← REAL
    
    if (result.success) {
      const isGoal = result.shot.isWinner // ← REAL
      const totalWin = result.shot.prize + result.shot.goldenGoalPrize // ← REAL
      
      setGameResult({ isGoal, totalWin }) // ← MANTÉM
      setGameStatus('result') // ← MANTÉM
      setBalance(result.user.newBalance) // ← REAL (do backend)
    }
  } catch (error) {
    // Tratar erro sem alterar visual
  }
}, [])
```

**Resultado Recebido:**
- **Gol:** `result.shot.isWinner === true` → Usa animação existente
- **Defesa:** `result.shot.isWinner === false` → Usa animação existente
- **Gol de Ouro:** `result.isGoldenGoal === true` → Pode adicionar destaque (opcional)

**Impacto Visual:** ✅ **ZERO** - Animações existentes são mantidas

---

## 📊 RESUMO DAS ALTERAÇÕES

### Arquivos que Serão Alterados

1. **`Game.jsx`** - Único arquivo que será modificado
   - Adicionar imports
   - Alterar estados iniciais
   - Adicionar useEffect de inicialização
   - Substituir handleShoot
   - Remover simulação de outros jogadores

### Arquivos que NÃO Serão Alterados

1. ✅ **`GameField.jsx`** - Somente leitura
2. ✅ **Todos os componentes visuais**
3. ✅ **Todos os estilos CSS**
4. ✅ **Todas as animações**
5. ✅ **Todos os sons**

### Linhas de Código Afetadas

- **Adições:** ~50 linhas (inicialização, tratamento de erros)
- **Substituições:** ~80 linhas (handleShoot)
- **Remoções:** ~15 linhas (simulação)
- **Total:** ~145 linhas modificadas em 1 arquivo

### Impacto Visual

**✅ ZERO IMPACTO VISUAL**

Todas as alterações são:
- Lógicas (substituição de simulação por chamadas reais)
- Internas (estados, não renderização)
- Transparentes (usuário não percebe diferença visual)

---

## ✅ CRITÉRIOS DE SUCESSO

### Funcionalidades que Devem Funcionar

1. ✅ Saldo carregado do backend na inicialização
2. ✅ Chute processado no backend real
3. ✅ Resultado real (gol/defesa) do backend
4. ✅ Saldo atualizado com valor do backend
5. ✅ Sistema de lotes integrado (sem simulação)
6. ✅ Tratamento de erros gracioso
7. ✅ Loading states durante chamadas

### Funcionalidades que Devem Permanecer Iguais

1. ✅ Visual do goleiro (inalterado)
2. ✅ Visual da bola (inalterado)
3. ✅ Visual do gol (inalterado)
4. ✅ Animações (inalteradas)
5. ✅ Sons (inalterados)
6. ✅ Layout (inalterado)
7. ✅ UX (inalterada)

---

**FIM DO PLANO TÉCNICO**

**⚠️ IMPORTANTE:** Este é apenas um plano. Nenhuma implementação foi feita ainda.

**Status:** 📋 PLANO TÉCNICO - AGUARDANDO AUTORIZAÇÃO PARA IMPLEMENTAÇÃO

