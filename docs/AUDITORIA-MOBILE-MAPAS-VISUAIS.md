# 🗺️ AUDITORIA MOBILE - MAPAS VISUAIS

**Data:** 17/11/2025

---

## 📊 MAPA 1: ARQUITETURA ATUAL DO MOBILE

```
┌─────────────────────────────────────────────────────────────┐
│                        App.js                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │           AuthProvider (AuthService)                 │  │
│  │  ┌──────────────────────────────────────────────┐   │  │
│  │  │  TabNavigator (React Navigation)              │   │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐      │   │  │
│  │  │  │  Home   │ │  Game    │ │ Profile  │      │   │  │
│  │  │  │ Screen  │ │ Screen   │ │ Screen   │      │   │  │
│  │  │  └────┬────┘ └────┬────┘ └────┬────┘      │   │  │
│  │  │       │            │            │            │   │  │
│  │  │       │            │            │            │   │  │
│  │  └───────┼────────────┼────────────┼────────────┘   │  │
│  └──────────┼────────────┼────────────┼─────────────────┘  │
└─────────────┼────────────┼────────────┼────────────────────┘
              │            │            │
              ▼            ▼            ▼
      ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
      │ GameService  │ │ WebSocket    │ │ AuthService  │
      │   (HTTP)     │ │ Service      │ │   (HTTP)     │
      └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
             │                 │                 │
             ▼                 ▼                 ▼
      ┌──────────────────────────────────────────────┐
      │         Backend (Fly.io + Supabase)          │
      │  ❌ INCOMPATÍVEL COM MOBILE                   │
      └──────────────────────────────────────────────┘
```

---

## 📊 MAPA 2: FLUXO DE CHUTE - ATUAL vs ESPERADO

### ❌ FLUXO ATUAL (NÃO FUNCIONA)

```
GameScreen.js
    │
    ├─► joinQueue()
    │       │
    │       ▼
    │   WebSocketService.joinQueue()
    │       │
    │       ▼
    │   ws.send({ type: 'join_queue' })
    │       │
    │       ▼
    │   Backend: ❌ Evento não existe
    │
    ├─► Aguarda queue_update
    │       │
    │       ▼
    │   Backend: ❌ Evento não existe
    │
    ├─► Aguarda game_started
    │       │
    │       ▼
    │   Backend: ❌ Evento não existe
    │
    └─► handleKick()
            │
            ▼
        WebSocketService.kick(zone, power, angle)
            │
            ▼
        ws.send({ type: 'kick', zone, power, angle })
            │
            ▼
        Backend: ❌ Evento não existe
```

### ✅ FLUXO CORRETO (DEVERIA SER)

```
GameScreen.js
    │
    └─► handleKick()
            │
            ▼
        GameService.shoot(direction, amount)
            │
            ▼
        POST /api/games/shoot
            │
            ├─► Headers: Authorization: Bearer {token}
            │
            ├─► Body: { direction: 'center', amount: 1 }
            │
            ▼
        Backend: GameController.shoot()
            │
            ├─► Valida saldo
            ├─► Obtém/cria lote
            ├─► Processa chute
            ├─► Retorna resultado
            │
            ▼
        Response: { success: true, data: { result, premio, ... } }
            │
            ▼
        GameScreen atualiza UI
```

---

## 📊 MAPA 3: WEBSOCKET - ATUAL vs CORRETO

### ❌ AUTENTICAÇÃO ATUAL (NÃO FUNCIONA)

```
WebSocketService.connect()
    │
    ├─► Token na URL: ws://.../ws?token=xxx
    │
    ├─► Backend: ❌ Não autentica via URL
    │
    └─► Conexão nunca autentica
```

### ✅ AUTENTICAÇÃO CORRETA (DEVERIA SER)

```
WebSocketService.connect()
    │
    ├─► ws = new WebSocket(ws://.../ws)
    │
    ├─► ws.onopen = () => {
    │       ws.send({ type: 'auth', token: 'xxx' })
    │   }
    │
    ├─► Backend: Processa mensagem 'auth'
    │
    ├─► Backend: ws.send({ type: 'auth_success', ... })
    │
    └─► Conexão autenticada ✅
```

---

## 📊 MAPA 4: DEPENDÊNCIAS ENTRE CORREÇÕES

```
FASE 1 (Crítico - 5.5 dias)
│
├─► 1.1 Refatorar GameScreen (1 dia)
│   │
│   └─► 1.2 Implementar chute HTTP (1 dia)
│       │
│       └─► 1.5 Testar fluxo completo (1 dia)
│
├─► 1.3 Corrigir WebSocketService (0.5 dia)
│   │
│   └─► 1.5 Testar fluxo completo
│
└─► 1.4 Corrigir GameService (1 dia)
    │
    ├─► 1.5 Testar fluxo completo
    │
    └─► 2.1 Integrar HomeScreen (1 dia)

FASE 2 (Importante - 3 dias)
│
├─► 2.1 Integrar HomeScreen (1 dia)
│   └─► Depende de: 1.4
│
├─► 2.2 Integrar ProfileScreen (1 dia)
│   └─► Criar endpoint OU usar AuthService
│
└─► 2.3 Criar leaderboard OU manter mock (1 dia)

FASE 3 (Necessário - 4.5 dias)
│
├─► 3.1 Criar PaymentService (0.5 dia)
│   │
│   ├─► 3.2 Criar telas de PIX (2 dias)
│   │
│   └─► 3.3 Criar telas de saldo (2 dias)
│
└─► App.js - Adicionar tab Carteira (0.5 dia)
    └─► Depende de: 3.2, 3.3

FASE 4 (Melhoria - 2 dias)
│
├─► 4.1 Tratamento de erros (0.5 dia)
├─► 4.2 Loading states (0.5 dia)
├─► 4.3 Race conditions (0.5 dia)
└─► 4.4 Memory leaks (0.5 dia)
```

---

## 📊 MAPA 5: ENDPOINTS - MOBILE vs BACKEND

```
MOBILE ESPERA                    BACKEND REAL
─────────────────────────────────────────────────────
POST /api/auth/login        ✅  POST /api/auth/login
POST /api/auth/register     ✅  POST /api/auth/register
PUT  /api/user/profile      ❌  NÃO EXISTE
─────────────────────────────────────────────────────
GET  /api/games             ❌  NÃO EXISTE
                             ✅  GET /api/games/status
                             ✅  GET /api/games/stats
                             ✅  GET /api/games/history
POST /api/games              ❌  NÃO EXISTE
                             ✅  POST /api/games/shoot
GET  /api/games/:id          ❌  NÃO EXISTE
─────────────────────────────────────────────────────
GET  /api/analytics/leaderboard  ❌  NÃO EXISTE
GET  /api/analytics/overview     ❌  NÃO EXISTE
GET  /api/analytics/players      ❌  NÃO EXISTE
─────────────────────────────────────────────────────
GET  /api/payments           ⚠️  FORMATO DIFERENTE
                             ✅  GET /api/payments/pix/usuario/:id
POST /api/payments           ⚠️  FORMATO DIFERENTE
                             ✅  POST /api/payments/pix/criar
                             ✅  GET /api/payments/pix/status/:id
                             ✅  GET /api/payments/saldo/:id
                             ✅  GET /api/payments/extrato/:id
                             ✅  POST /api/payments/saque
```

---

## 📊 MAPA 6: EVENTOS WEBSOCKET - MOBILE vs BACKEND

```
MOBILE USA                    BACKEND SUPORTA
─────────────────────────────────────────────────────
join_queue               ❌  NÃO EXISTE
leave_queue              ❌  NÃO EXISTE
kick                     ❌  NÃO EXISTE
queue_update             ❌  NÃO EXISTE
game_started             ❌  NÃO EXISTE
game_ended               ❌  NÃO EXISTE
player_kicked            ❌  NÃO EXISTE
ping                     ✅  SIM
─────────────────────────────────────────────────────
                         ✅  auth (FALTA IMPLEMENTAR)
                         ✅  auth_success (FALTA IMPLEMENTAR)
                         ✅  auth_error (FALTA IMPLEMENTAR)
                         ⚠️  join_room (OPCIONAL)
                         ⚠️  leave_room (OPCIONAL)
                         ⚠️  chat_message (OPCIONAL)
```

---

## 📊 MAPA 7: FLUXO DE DADOS - TELAS COM MOCK

```
HomeScreen.js
    │
    ├─► loadUserData() [MOCKADO]
    │   │
    │   ├─► userStats.level = 5 [MOCKADO]
    │   ├─► userStats.xp = 1250 [MOCKADO]
    │   ├─► userStats.totalGames = 47 [MOCKADO]
    │   ├─► userStats.bestScore = 95 [MOCKADO]
    │   ├─► userStats.rank = 12 [MOCKADO]
    │   └─► recentGames = [...] [MOCKADO]
    │
    └─► DEVERIA USAR:
        ├─► GET /api/games/stats (totalGames)
        └─► GET /api/games/history (recentGames)

ProfileScreen.js
    │
    ├─► loadUserProfile() [MOCKADO]
    │   │
    │   ├─► user.name = 'Jogador' [MOCKADO]
    │   ├─► user.email = '...' [MOCKADO]
    │   ├─► user.level = 5 [MOCKADO]
    │   ├─► stats.gamesPlayed = 47 [MOCKADO]
    │   └─► user.achievements = [...] [MOCKADO]
    │
    └─► DEVERIA USAR:
        ├─► GET /api/user/profile (NÃO EXISTE - CRIAR)
        └─► GET /api/games/stats (gamesPlayed)

LeaderboardScreen.js
    │
    ├─► loadLeaderboard() [MOCKADO]
    │   │
    │   └─► leaderboard = [...] [MOCKADO]
    │
    └─► DEVERIA USAR:
        └─► GET /api/analytics/leaderboard (NÃO EXISTE - CRIAR)
```

---

## 📊 MAPA 8: SISTEMA DE JOGO - MOBILE vs BACKEND

### ❌ MOBILE ESPERA (Sistema de Fila + Partidas)

```
1. Jogador entra na fila
   │
   ├─► joinQueue()
   │
2. Espera 10 jogadores
   │
   ├─► queue_update events
   │
3. Partida inicia quando completa
   │
   ├─► game_started event
   │
4. Todos chutam simultaneamente (30s)
   │
   ├─► kick(zone, power, angle)
   │
5. Partida termina
   │
   └─► game_ended event
```

### ✅ BACKEND REAL (Sistema de Lotes)

```
1. Jogador chuta diretamente
   │
   ├─► POST /api/games/shoot
   │   Body: { direction: 'center', amount: 1 }
   │
2. Sistema processa imediatamente
   │
   ├─► Valida saldo
   ├─► Obtém/cria lote
   ├─► Determina resultado
   │
3. Retorna resultado
   │
   └─► Response: { result: 'goal'|'miss', premio: 5 }
```

---

## 📊 MAPA 9: PARÂMETROS DE CHUTE

```
MOBILE ENVIA (INCORRETO)          BACKEND ESPERA (CORRETO)
─────────────────────────────────────────────────────────────
{                                 {
  type: 'kick',                     direction: 'center',
  zone: 'center',        ❌          amount: 1
  power: 50,             ❌        }
  angle: 0               ❌
}                                 

Zonas aceitas:                    Zonas aceitas:
- center                           - center
- left                             - left
- right                            - right
- top                              - top
- bottom                           - bottom

Valores de aposta:                Valores de aposta:
❌ Não envia                       ✅ 1, 2, 5 ou 10
```

---

## 📊 MAPA 10: TELAS FALTANDO

```
App.js (TabNavigator)
│
├─► Home ✅
├─► Game ✅
├─► Leaderboard ✅
├─► Profile ✅
│
└─► Carteira ❌ FALTA
    │
    ├─► PIX ❌ FALTA
    │   ├─► Criar pagamento
    │   ├─► QR Code
    │   └─► Histórico
    │
    └─► Saldo ❌ FALTA
        ├─► Saldo atual
        ├─► Extrato
        └─► Saque

Endpoints Backend Disponíveis:
✅ POST /api/payments/pix/criar
✅ GET /api/payments/pix/status/:id
✅ GET /api/payments/pix/usuario/:id
✅ GET /api/payments/saldo/:id
✅ GET /api/payments/extrato/:id
✅ POST /api/payments/saque
```

---

**FIM DOS MAPAS VISUAIS**

