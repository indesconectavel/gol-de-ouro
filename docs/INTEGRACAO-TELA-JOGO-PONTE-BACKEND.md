# 🌉 INTEGRAÇÃO TELA JOGO - PONTE COM BACKEND
## Sistema Gol de Ouro - Mapeamento Detalhado de Integração Backend

**Data:** 2025-01-24  
**Engenheiro:** Engenheiro Sênior Fullstack  
**Status:** 📋 MAPEAMENTO TÉCNICO - SEM IMPLEMENTAÇÃO

---

## 🔗 MAPEAMENTO COMPLETO BACKEND ↔ FRONTEND

### 1. ENDPOINT DE INICIALIZAÇÃO

#### Backend Real

**Endpoint Composto:** `gameService.initialize()`

**Chamadas Internas:**
1. `GET /api/user/profile`
2. `GET /api/metrics`

**Resposta Consolidada:**
```javascript
{
  success: true,
  userData: {
    saldo: 50.00,
    email: "usuario@email.com",
    id: "uuid"
  },
  gameInfo: {
    user: {
      balance: 50.00,
      canPlay: true
    },
    lote: {
      config: { size: 10, totalValue: 10, winChance: 0.1 },
      progress: { current: 3, total: 10, remaining: 7 },
      isActive: true
    },
    goldenGoal: {
      counter: 1234,
      lastGoldenGoal: 1000,
      shotsUntilNext: 766,
      isNext: false,
      prize: 100
    },
    config: {
      availableBets: [1, 2, 5, 10],
      goalZones: ['TL', 'TR', 'C', 'BL', 'BR']
    }
  }
}
```

#### Frontend - Onde Usar

**Arquivo:** `Game.jsx`

**Localização:** Novo `useEffect` após linha 87

**Código:**
```javascript
useEffect(() => {
  const initializeGame = async () => {
    try {
      setLoading(true)
      const result = await gameService.initialize()
      
      if (result.success) {
        // Atualizar saldo
        setBalance(result.userData.saldo)
        
        // Opcional: Carregar outras informações
        // setGlobalCounter(result.gameInfo.goldenGoal.counter)
        // setShotsUntilGoldenGoal(result.gameInfo.goldenGoal.shotsUntilNext)
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

**Estados Atualizados:**
- `balance` ← `result.userData.saldo`
- `loading` ← `false` após carregamento

---

### 2. ENDPOINT DE CHUTE

#### Backend Real

**Endpoint:** `POST /api/games/shoot`

**Payload:**
```json
{
  "direction": "TL" | "TR" | "C" | "BL" | "BR",
  "amount": 1 | 2 | 5 | 10
}
```

**Resposta:**
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
        "current": 4,
        "total": 10
      },
      "isComplete": false
    },
    "user": {
      "newBalance": 48.00,
      "globalCounter": 1235
    },
    "isGolDeOuro": false
  }
}
```

**Serviço Frontend:** `gameService.processShot(direction, amount)`

**Retorno do Serviço:**
```javascript
{
  success: true,
  shot: {
    id: "uuid",
    direction: "TL",
    amount: 1,
    result: "goal",
    isWinner: true,
    prize: 2.0,
    goldenGoalPrize: 0,
    isGoldenGoal: false,
    timestamp: "2025-01-24T10:00:00Z"
  },
  lote: {
    id: "uuid",
    progress: {
      current: 4,
      total: 10
    },
    isComplete: false
  },
  user: {
    newBalance: 48.00,
    globalCounter: 1235
  },
  isGoldenGoal: false
}
```

#### Frontend - Onde Usar

**Arquivo:** `Game.jsx`

**Localização:** Função `handleShoot` (linhas 89-168)

**Mapeamento zoneId → direction:**
```javascript
const zoneIdToDirection = {
  1: 'TL',  // Canto Superior Esquerdo
  2: 'TR',  // Canto Superior Direito
  3: 'C',   // Centro Superior
  4: 'BL',  // Canto Inferior Esquerdo
  5: 'BR',  // Canto Inferior Direito
  6: 'C'    // Centro Inferior → mapeia para C
}
```

**Código de Integração:**
```javascript
const handleShoot = useCallback(async (zoneId) => {
  if (isShooting) return
  
  // Mapear zoneId para direction
  const direction = zoneIdToDirection[zoneId]
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
      
      // Atualizar estados com valores do backend
      setGameResult(gameResult)
      setGameResults(prev => [...prev, gameResult])
      setCurrentShot(prev => prev + 1)
      setGameStatus('result')
      setIsShooting(false)
      
      // Saldo vem do backend
      setBalance(result.user.newBalance)
      
      // Total de chutes vem do backend
      setTotalShots(result.lote.progress.total)
      
      // Lógica visual mantida (sem alteração)
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
      toast.error(result.error)
    }
  } catch (error) {
    // Tratar erro de rede
    setError(error.message)
    setIsShooting(false)
    setGameStatus('waiting')
    toast.error('Erro ao processar chute. Tente novamente.')
  }
}, [isShooting, betAmount, goalZones, playCelebrationSound, addExperience, updateUserStats])
```

**Estados Atualizados:**
- `gameResult.isGoal` ← `result.shot.isWinner`
- `gameResult.totalWin` ← `result.shot.prize + result.shot.goldenGoalPrize`
- `balance` ← `result.user.newBalance`
- `totalShots` ← `result.lote.progress.total`

---

### 3. ENDPOINT DE SALDO

#### Backend Real

**Endpoint:** `GET /api/user/profile`

**Resposta:**
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

**Serviço Frontend:** `gameService.loadUserData()`

**Uso:**
- Chamado durante `gameService.initialize()`
- Não precisa ser chamado separadamente
- Saldo atualizado após cada chute via `processShot()`

---

### 4. ENDPOINT DE MÉTRICAS GLOBAIS

#### Backend Real

**Endpoint:** `GET /api/metrics`

**Resposta:**
```json
{
  "success": true,
  "data": {
    "contador_chutes_global": 1234,
    "ultimo_gol_de_ouro": 1000
  }
}
```

**Serviço Frontend:** `gameService.loadGlobalMetrics()`

**Uso:**
- Chamado durante `gameService.initialize()`
- Atualizado após cada chute via `processShot()`
- Usado para calcular chutes até Gol de Ouro

---

## 🔄 MAPA DE INTEGRAÇÃO 1:1 COMPLETO

### Fluxo de Inicialização

```
Game.jsx monta
  ↓
useEffect executa
  ↓
gameService.initialize()
  ↓
┌─────────────────────────────────────┐
│ GET /api/user/profile               │
│ → Retorna: { saldo: 50.00 }         │
└─────────────────────────────────────┘
  ↓
┌─────────────────────────────────────┐
│ GET /api/metrics                   │
│ → Retorna: { contador_chutes_global: 1234 } │
└─────────────────────────────────────┘
  ↓
setBalance(50.00)  ← Atualiza estado
setLoading(false)  ← Finaliza carregamento
```

### Fluxo de Chute

```
Usuário clica zona (zoneId = 1)
  ↓
handleShoot(1)
  ↓
Mapeia: zoneId 1 → direction 'TL'
  ↓
setGameStatus('playing')  ← Inicia animação
setIsShooting(true)
  ↓
gameService.processShot('TL', 1)
  ↓
┌─────────────────────────────────────┐
│ POST /api/games/shoot              │
│ Payload: { direction: 'TL', amount: 1 } │
│                                     │
│ Resposta:                           │
│ {                                   │
│   shot: { isWinner: true, prize: 2.0 }, │
│   user: { newBalance: 48.00 },     │
│   lote: { progress: { total: 10 } } │
│ }                                   │
└─────────────────────────────────────┘
  ↓
setGameResult({ isGoal: true, totalWin: 2.0 })  ← Do backend
setBalance(48.00)  ← Do backend
setTotalShots(10)  ← Do backend
setGameStatus('result')  ← Mostra resultado
  ↓
Animações visuais (MANTIDAS)
  ↓
setTimeout 2000ms
  ↓
setGameStatus('waiting')  ← Pronto para próximo chute
```

---

## 📊 TABELA DE MAPEAMENTO COMPLETO

### Mapeamento de Dados

| Dado Frontend | Fonte Atual | Fonte Backend | Endpoint | Campo Resposta |
|---------------|-------------|---------------|----------|----------------|
| `balance` | Fixo (21.00) | Backend | `GET /api/user/profile` | `data.saldo` |
| `balance` (após chute) | Calculado local | Backend | `POST /api/games/shoot` | `data.user.newBalance` |
| `gameResult.isGoal` | Simulado (random) | Backend | `POST /api/games/shoot` | `data.shot.isWinner` |
| `gameResult.totalWin` | Calculado local | Backend | `POST /api/games/shoot` | `data.shot.prize + data.shot.goldenGoalPrize` |
| `totalShots` | Simulado (interval) | Backend | `POST /api/games/shoot` | `data.lote.progress.total` |
| `globalCounter` | Não existe | Backend | `GET /api/metrics` | `data.contador_chutes_global` |
| `shotsUntilGoldenGoal` | Não existe | Backend | Calculado de `globalCounter` | `1000 - (counter % 1000)` |

### Mapeamento de Zonas

| zoneId (Game.jsx) | Nome | direction (Backend) | Mapeamento |
|-------------------|------|---------------------|------------|
| 1 | Canto Superior Esquerdo | 'TL' | ✅ Direto |
| 2 | Canto Superior Direito | 'TR' | ✅ Direto |
| 3 | Centro Superior | 'C' | ✅ Direto |
| 4 | Canto Inferior Esquerdo | 'BL' | ✅ Direto |
| 5 | Canto Inferior Direito | 'BR' | ✅ Direto |
| 6 | Centro Inferior | 'C' | ⚠️ Mapeia para 'C' (não existe no backend) |

**Nota:** Zona 6 não existe no backend. Mapear para 'C' (Centro Superior).

---

## 🔧 PONTOS DE INTEGRAÇÃO

### Ponto 1: Inicialização

**Onde:** `Game.jsx` - Novo `useEffect`

**O Que Faz:**
- Carrega saldo real do usuário
- Carrega métricas globais
- Inicializa estados

**Quando:** Uma vez ao montar componente

**Impacto Visual:** ✅ Zero (apenas durante inicialização)

### Ponto 2: Processamento de Chute

**Onde:** `Game.jsx` - Função `handleShoot`

**O Que Faz:**
- Mapeia `zoneId` para `direction`
- Chama backend para processar chute
- Atualiza estados com valores reais
- Mantém animações visuais

**Quando:** A cada clique em zona

**Impacto Visual:** ✅ Zero (animações mantidas)

### Ponto 3: Remoção de Simulação

**Onde:** `Game.jsx` - Remover `useEffect` linhas 65-79

**O Que Faz:**
- Remove simulação de outros jogadores
- Usa progresso real do lote

**Quando:** Remoção permanente

**Impacto Visual:** ✅ Zero (apenas remove simulação)

---

## ⚠️ TRATAMENTO DE ERROS

### Erros Possíveis

#### 1. Erro de Rede

**Quando:** Falha na chamada ao backend

**Tratamento:**
```javascript
try {
  const result = await gameService.processShot(...)
} catch (error) {
  setError(error.message)
  setIsShooting(false)
  setGameStatus('waiting')
  toast.error('Erro ao processar chute. Tente novamente.')
}
```

**Impacto Visual:** ✅ Zero (toast overlay)

#### 2. Saldo Insuficiente

**Quando:** `balance < betAmount`

**Tratamento:**
```javascript
if (balance < betAmount) {
  toast.error('Saldo insuficiente')
  return // Não processa chute
}
```

**Impacto Visual:** ✅ Zero (toast overlay)

#### 3. Erro de Validação

**Quando:** Backend rejeita chute (ex: lote completo)

**Tratamento:**
```javascript
if (!result.success) {
  setError(result.error)
  toast.error(result.error)
  setIsShooting(false)
  setGameStatus('waiting')
}
```

**Impacto Visual:** ✅ Zero (toast overlay)

#### 4. Erro de Autenticação

**Quando:** Token expirado (401/403)

**Tratamento:**
```javascript
if (error.response?.status === 401 || error.response?.status === 403) {
  // Redirecionar para login
  navigate('/')
  localStorage.removeItem('authToken')
}
```

**Impacto Visual:** ✅ Zero (redirecionamento)

---

## 📋 CHECKLIST DE INTEGRAÇÃO

### Fase 1: Inicialização
- [ ] Adicionar `gameService.initialize()` no `useEffect`
- [ ] Atualizar `balance` com valor do backend
- [ ] Adicionar estado `loading`
- [ ] Tratar erros de inicialização

### Fase 2: Processamento de Chute
- [ ] Mapear `zoneId` para `direction`
- [ ] Substituir simulação por `gameService.processShot()`
- [ ] Atualizar `gameResult` com valores do backend
- [ ] Atualizar `balance` com valor do backend
- [ ] Atualizar `totalShots` com progresso do lote
- [ ] Tratar erros de processamento

### Fase 3: Remoção de Simulação
- [ ] Remover `useEffect` de simulação (linhas 65-79)
- [ ] Remover cálculos locais de saldo
- [ ] Remover cálculos locais de resultado

### Fase 4: Tratamento de Erros
- [ ] Adicionar try/catch em todas as chamadas
- [ ] Mostrar mensagens de erro via toast
- [ ] Validar saldo antes de processar chute
- [ ] Tratar erros de autenticação

---

**FIM DO MAPEAMENTO DE PONTE COM BACKEND**

**⚠️ IMPORTANTE:** Este é apenas mapeamento técnico. Nenhuma implementação foi feita ainda.

