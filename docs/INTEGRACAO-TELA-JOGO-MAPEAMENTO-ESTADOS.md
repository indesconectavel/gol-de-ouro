# 🔄 INTEGRAÇÃO TELA JOGO - MAPEAMENTO DE ESTADOS
## Sistema Gol de Ouro - Mapeamento Detalhado de Estados para Integração

**Data:** 2025-01-24  
**Engenheiro:** Engenheiro Sênior Fullstack  
**Status:** 📋 MAPEAMENTO TÉCNICO - SEM IMPLEMENTAÇÃO

---

## 📊 MAPEAMENTO COMPLETO DE ESTADOS

### Estados do Game.jsx (Atuais)

| Estado | Tipo | Valor Inicial | Linha | Fonte Atual | Fonte Após Integração |
|--------|------|---------------|-------|-------------|----------------------|
| `playerShots` | number | 0 | 17 | Local (addShots) | Local (mantém) |
| `totalShots` | number | 0 | 18 | Simulado (interval) | Backend (lote.progress.total) |
| `gameStatus` | string | 'waiting' | 19 | Local | Local (mantém) |
| `gameResults` | array | [] | 20 | Local | Local (mantém) |
| `currentShot` | number | 0 | 21 | Local | Local (mantém) |
| `selectedZone` | number \| null | null | 22 | Local | Local (mantém) |
| `gameResult` | object \| null | null | 23 | Simulado | Backend (processShot) |
| `balance` | number | **21.00** | 24 | **FIXO** | **Backend (userData.saldo)** |
| `betAmount` | number | 1.00 | 25 | Constante | Constante (mantém) |
| `isShooting` | boolean | false | 26 | Local | Local (mantém) |
| `gameStats` | object | {...} | 27-35 | Local | Local (mantém, opcional backend) |

### Novos Estados Necessários

| Estado | Tipo | Valor Inicial | Finalidade | Quando Muda |
|--------|------|---------------|------------|-------------|
| `loading` | boolean | true | Indicar carregamento inicial | `gameService.initialize()` |
| `error` | string | '' | Mensagens de erro | Erros de rede/validação |

---

## 🔄 FLUXO DE ESTADOS DURANTE INTEGRAÇÃO

### 1. Inicialização (Montagem do Componente)

**Estado Inicial:**
```javascript
balance: 0              // ← Muda de 21.00 para 0
loading: true            // ← NOVO
error: ''                // ← NOVO
gameStatus: 'waiting'
```

**Ação:**
```javascript
useEffect(() => {
  gameService.initialize()
    .then(result => {
      setBalance(result.userData.saldo)  // ← Atualiza com valor real
      setLoading(false)
    })
}, [])
```

**Estado Após Inicialização:**
```javascript
balance: 50.00           // ← Valor real do backend
loading: false           // ← Carregamento completo
error: ''
gameStatus: 'waiting'
```

### 2. Processamento de Chute (Antes vs Depois)

#### ANTES (Simulado):

**Estado Inicial:**
```javascript
balance: 21.00
gameStatus: 'waiting'
isShooting: false
```

**Ao Clicar em Zona:**
```javascript
gameStatus: 'playing'                    // ← Inicia animação
isShooting: true
balance: 20.00                           // ← Decrementa localmente
```

**Após 2 segundos (Simulado):**
```javascript
gameResult: { isGoal: true, totalWin: 2.0 }  // ← Aleatório
gameStatus: 'result'                         // ← Mostra resultado
balance: 22.00                               // ← Incrementa localmente
isShooting: false
```

#### DEPOIS (Real):

**Estado Inicial:**
```javascript
balance: 50.00           // ← Valor real do backend
gameStatus: 'waiting'
isShooting: false
```

**Ao Clicar em Zona:**
```javascript
gameStatus: 'playing'                    // ← Inicia animação (MANTÉM)
isShooting: true                         // ← MANTÉM
// balance NÃO decrementa ainda (aguarda backend)
```

**Durante Chamada ao Backend:**
```javascript
// Aguardando resposta...
gameStatus: 'playing'                    // ← Mantém animação
isShooting: true
// balance permanece 50.00
```

**Após Resposta do Backend:**
```javascript
gameResult: { 
  isGoal: true,                          // ← Do backend (result.shot.isWinner)
  totalWin: 2.0                          // ← Do backend (result.shot.prize)
}
gameStatus: 'result'                     // ← Mostra resultado (MANTÉM)
balance: 48.00                           // ← Do backend (result.user.newBalance)
isShooting: false
```

**Diferença Crítica:**
- ✅ **Antes:** Saldo atualizado localmente (pode divergir do backend)
- ✅ **Depois:** Saldo sempre vem do backend (sempre sincronizado)

### 3. Mapeamento de Zonas (zoneId → direction)

**Problema Identificado:**
- `Game.jsx` usa `zoneId` (1-6)
- `gameService` espera `direction` ('TL', 'TR', 'C', 'BL', 'BR')
- `GameField.jsx` tem 6 zonas, `gameService` tem 5

**Solução:**
```javascript
const zoneIdToDirection = {
  1: 'TL',  // Canto Superior Esquerdo
  2: 'TR',  // Canto Superior Direito
  3: 'C',   // Centro Superior
  4: 'BL',  // Canto Inferior Esquerdo
  5: 'BR',  // Canto Inferior Direito
  6: 'C'    // Centro Inferior → mapeia para C (mesma direção)
}
```

**Nota:** Zona 6 (Centro Inferior) não existe no backend. Mapear para 'C' (Centro Superior).

---

## 🔗 MAPEAMENTO ESTADO → BACKEND → ESTADO

### Tabela de Mapeamento Completo

| Estado Local | Ação | Endpoint Backend | Campo Resposta | Estado Atualizado |
|--------------|------|-----------------|---------------|-------------------|
| `balance = 0` | Inicialização | `GET /api/user/profile` | `data.saldo` | `setBalance(data.saldo)` |
| `gameResult = null` | Processar chute | `POST /api/games/shoot` | `data.shot.isWinner` | `setGameResult({ isGoal: data.shot.isWinner })` |
| `balance = X` | Processar chute | `POST /api/games/shoot` | `data.user.newBalance` | `setBalance(data.user.newBalance)` |
| `totalShots = 0` | Processar chute | `POST /api/games/shoot` | `data.lote.progress.total` | `setTotalShots(data.lote.progress.total)` |
| `gameResult.totalWin = 0` | Processar chute | `POST /api/games/shoot` | `data.shot.prize + data.shot.goldenGoalPrize` | `setGameResult({ totalWin: ... })` |

### Fluxo Detalhado de Cada Estado

#### 1. Estado `balance`

**Antes da Integração:**
```javascript
// Linha 24
const [balance, setBalance] = useState(21.00)  // ← FIXO

// Linha 95 (handleShoot)
setBalance(prev => prev - betAmount)           // ← SIMULADO

// Linha 122 (handleShoot - se gol)
setBalance(prev => prev + result.totalWin)      // ← SIMULADO
```

**Após Integração:**
```javascript
// Linha 24
const [balance, setBalance] = useState(0)      // ← Inicia em 0

// Novo useEffect (inicialização)
useEffect(() => {
  gameService.initialize()
    .then(result => {
      setBalance(result.userData.saldo)        // ← REAL (do backend)
    })
}, [])

// handleShoot (processamento)
const result = await gameService.processShot(direction, betAmount)
setBalance(result.user.newBalance)             // ← REAL (do backend)
// NÃO decrementa/incrementa localmente
```

**Mudanças:**
- ✅ Valor inicial vem do backend
- ✅ Atualização vem do backend após cada chute
- ✅ Não há cálculos locais de saldo

#### 2. Estado `gameResult`

**Antes da Integração:**
```javascript
// Linha 106 (handleShoot)
const isGoal = Math.random() > 0.4             // ← SIMULADO

// Linha 112 (handleShoot)
totalWin: isGoal ? (betAmount * zone.multiplier) : 0  // ← CALCULADO LOCALMENTE

// Linha 115 (handleShoot)
setGameResult(result)                          // ← Resultado simulado
```

**Após Integração:**
```javascript
// handleShoot (processamento)
const result = await gameService.processShot(direction, betAmount)

const gameResult = {
  zone: zoneId,
  isGoal: result.shot.isWinner,                // ← REAL (do backend)
  amount: betAmount,
  multiplier: zone.multiplier,
  totalWin: result.shot.prize + (result.shot.goldenGoalPrize || 0)  // ← REAL
}

setGameResult(gameResult)                     // ← Resultado real
```

**Mudanças:**
- ✅ `isGoal` vem do backend (`result.shot.isWinner`)
- ✅ `totalWin` vem do backend (`result.shot.prize`)
- ✅ Não há cálculo local de resultado

#### 3. Estado `totalShots`

**Antes da Integração:**
```javascript
// Linha 18
const [totalShots, setTotalShots] = useState(0)

// Linhas 65-79 (useEffect simulado)
useEffect(() => {
  const interval = setInterval(() => {
    if (totalShots < 10) {
      const randomShots = Math.floor(Math.random() * 3) + 1
      setTotalShots(prev => Math.min(prev + randomShots, 10))  // ← SIMULADO
    }
  }, 2000)
}, [totalShots])
```

**Após Integração:**
```javascript
// Linha 18 (mantém)
const [totalShots, setTotalShots] = useState(0)

// REMOVER useEffect de simulação (linhas 65-79)

// handleShoot (processamento)
const result = await gameService.processShot(direction, betAmount)
setTotalShots(result.lote.progress.total)     // ← REAL (do backend)
```

**Mudanças:**
- ✅ Remove simulação de outros jogadores
- ✅ Usa progresso real do lote do backend
- ✅ Atualiza após cada chute processado

#### 4. Estado `loading`

**Antes da Integração:**
```javascript
// NÃO EXISTE
```

**Após Integração:**
```javascript
// NOVO estado
const [loading, setLoading] = useState(true)

// useEffect de inicialização
useEffect(() => {
  setLoading(true)
  gameService.initialize()
    .then(() => setLoading(false))
    .catch(() => setLoading(false))
}, [])

// Renderização condicional (opcional)
if (loading) {
  return <div>Carregando...</div>  // ← Não altera visual principal
}
```

**Mudanças:**
- ✅ Novo estado para controlar carregamento inicial
- ✅ Não afeta visual durante jogo (apenas inicialização)

#### 5. Estado `error`

**Antes da Integração:**
```javascript
// NÃO EXISTE
```

**Após Integração:**
```javascript
// NOVO estado
const [error, setError] = useState('')

// handleShoot (tratamento de erro)
try {
  const result = await gameService.processShot(...)
  if (!result.success) {
    setError(result.error)
    toast.error(result.error)  // ← Toast overlay, não altera layout
  }
} catch (error) {
  setError(error.message)
  toast.error(error.message)
}
```

**Mudanças:**
- ✅ Novo estado para erros
- ✅ Mostrado via toast (não altera layout)

---

## 🔄 FLUXO COMPLETO DE ESTADOS (ANTES vs DEPOIS)

### Fluxo de Inicialização

**ANTES:**
```
Componente monta
  ↓
balance = 21.00 (fixo)
  ↓
Pronto para jogar
```

**DEPOIS:**
```
Componente monta
  ↓
balance = 0
loading = true
  ↓
gameService.initialize()
  ↓
GET /api/user/profile
GET /api/metrics
  ↓
balance = userData.saldo (real)
loading = false
  ↓
Pronto para jogar
```

### Fluxo de Chute

**ANTES:**
```
Usuário clica zona
  ↓
gameStatus = 'playing'
balance -= betAmount (local)
  ↓
setTimeout 2000ms
  ↓
isGoal = Math.random() > 0.4 (simulado)
totalWin = calculado localmente
  ↓
gameStatus = 'result'
balance += totalWin (local)
  ↓
Mostra resultado
```

**DEPOIS:**
```
Usuário clica zona
  ↓
gameStatus = 'playing' (MANTÉM)
  ↓
gameService.processShot(direction, amount)
  ↓
POST /api/games/shoot
  ↓
Aguarda resposta (animação continua)
  ↓
result.shot.isWinner (real)
result.shot.prize (real)
result.user.newBalance (real)
  ↓
gameStatus = 'result' (MANTÉM)
balance = result.user.newBalance (real)
  ↓
Mostra resultado (MANTÉM visual)
```

---

## 📊 RESUMO DE MUDANÇAS DE ESTADOS

### Estados que Mudam de Fonte

| Estado | Fonte Antes | Fonte Depois | Impacto Visual |
|--------|-------------|--------------|----------------|
| `balance` | Fixo (21.00) | Backend | ✅ Zero (apenas valor) |
| `gameResult.isGoal` | Simulado (random) | Backend | ✅ Zero (apenas lógica) |
| `gameResult.totalWin` | Calculado local | Backend | ✅ Zero (apenas valor) |
| `totalShots` | Simulado (interval) | Backend | ✅ Zero (apenas valor) |

### Estados que Permanecem Locais

| Estado | Fonte | Motivo |
|--------|-------|--------|
| `playerShots` | Local | Controle de UI (quantidade escolhida pelo usuário) |
| `gameStatus` | Local | Controle de animações (waiting/playing/result) |
| `currentShot` | Local | Controle de UI (chute atual) |
| `selectedZone` | Local | Controle de animações |
| `isShooting` | Local | Flag de bloqueio de múltiplos cliques |
| `gameStats` | Local | Estatísticas locais (opcional: pode vir do backend depois) |

### Novos Estados Adicionados

| Estado | Finalidade | Impacto Visual |
|--------|------------|----------------|
| `loading` | Indicar carregamento inicial | ✅ Zero (apenas durante inicialização) |
| `error` | Mensagens de erro | ✅ Zero (toast overlay) |

---

## 🎯 PONTOS DE INTEGRAÇÃO CRÍTICOS

### 1. Inicialização

**Estado:** `balance`, `loading`

**Integração:**
```javascript
useEffect(() => {
  gameService.initialize()
    .then(result => {
      setBalance(result.userData.saldo)  // ← CRÍTICO
      setLoading(false)
    })
}, [])
```

**Timing:** Executa uma vez ao montar componente

### 2. Processamento de Chute

**Estados:** `gameResult`, `balance`, `totalShots`

**Integração:**
```javascript
const result = await gameService.processShot(direction, betAmount)

setGameResult({
  isGoal: result.shot.isWinner,        // ← CRÍTICO
  totalWin: result.shot.prize          // ← CRÍTICO
})

setBalance(result.user.newBalance)     // ← CRÍTICO
setTotalShots(result.lote.progress.total)  // ← CRÍTICO
```

**Timing:** Executa a cada chute

### 3. Remoção de Simulação

**Estado:** `totalShots`

**Ação:**
- Remover useEffect de simulação (linhas 65-79)
- Usar valor do backend ao invés de simulação

**Timing:** Remoção permanente

---

## ⚠️ CONSIDERAÇÕES IMPORTANTES

### Sincronização de Estados

**Problema Potencial:**
- Múltiplas abas podem causar divergência
- Backend é fonte da verdade

**Solução:**
- Sempre usar valores do backend
- Não calcular localmente
- Validar antes de enviar

### Estados Derivados

**Estados que dependem de outros:**
- `totalWinnings` → Calculado de `gameResults` (mantém)
- `totalInvestment` → Calculado de `gameResults` (mantém)

**Não precisam mudar:** São calculados localmente de dados já validados.

---

**FIM DO MAPEAMENTO DE ESTADOS**

**⚠️ IMPORTANTE:** Este é apenas mapeamento técnico. Nenhuma implementação foi feita ainda.

