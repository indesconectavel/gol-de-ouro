# 📱 AUDITORIA COMPLETA DO MOBILE — GOL DE OURO
**Versão:** 17/11/2025  
**Status do Backend:** 100% validado, transações ACID, WebSocket v1.3.0 estável, partidas persistentes, PIX seguro  
**Objetivo:** Ajustar o aplicativo mobile para estar totalmente integrado e funcional para jogadores reais

---

## 📋 SUMÁRIO EXECUTIVO

### Status Geral: ⚠️ **INCOMPATÍVEL COM BACKEND**

O aplicativo mobile possui **incompatibilidades críticas** com o backend atual:

1. ❌ **WebSocket incompatível** - Eventos não existem no backend
2. ❌ **Sistema de jogo divergente** - Mobile espera fila/partidas, backend usa lotes
3. ❌ **Endpoints incorretos** - Parâmetros e formatos não batem
4. ❌ **Dados mockados** - 3 telas principais usam dados simulados
5. ⚠️ **Falta de telas críticas** - PIX e saldo não existem

### Impacto: 🔴 **CRÍTICO**

**O aplicativo mobile NÃO FUNCIONARÁ** com o backend atual sem correções extensivas.

---

## 1. DIAGNÓSTICO GERAL DA ARQUITETURA

### 1.1. Estrutura do Projeto

```
goldeouro-mobile/
├── App.js                    # ✅ React Navigation (não Expo Router)
├── src/
│   ├── config/
│   │   └── env.js           # ✅ Configuração de ambiente
│   ├── services/
│   │   ├── AuthService.js   # ✅ Context API + HTTP
│   │   ├── GameService.js   # ⚠️ HTTP apenas (muitos endpoints não existem)
│   │   └── WebSocketService.js  # ❌ INCOMPATÍVEL com backend
│   └── screens/
│       ├── GameScreen.js    # ❌ INCOMPATÍVEL com backend
│       ├── HomeScreen.js    # ⚠️ Dados mockados
│       ├── ProfileScreen.js # ⚠️ Dados mockados
│       └── LeaderboardScreen.js # ⚠️ Dados mockados
```

### 1.2. Avaliação de Arquitetura

| Aspecto | Status | Observações |
|---------|--------|-------------|
| **Separação de responsabilidades** | ✅ Bom | Services separados de screens |
| **Gerenciamento de estado** | ✅ Bom | Context API para auth |
| **Navegação** | ✅ Bom | React Navigation bem estruturado |
| **Configuração** | ✅ Bom | Variáveis de ambiente centralizadas |
| **Tratamento de erros** | ⚠️ Parcial | Falta tratamento global |
| **Loading states** | ⚠️ Parcial | Não consistente em todas telas |
| **Offline support** | ❌ Não | Sem cache ou sincronização |

### 1.3. Boas Práticas

**✅ Pontos Positivos:**
- Uso de Context API para autenticação
- Separação de services
- Configuração centralizada de URLs
- Tratamento básico de erros em serviços

**❌ Pontos Negativos:**
- Falta de tratamento global de erros
- Sem loading states consistentes
- Sem refresh tokens
- Sem validação de formulários
- Sem tratamento de token expirado
- Sem retry automático em falhas de rede

---

## 2. AUDITORIA DE INTEGRAÇÃO COM O BACKEND

### 2.1. Endpoints HTTP - Análise Detalhada

#### ✅ **AuthService.js - Endpoints Corretos**

| Método | Endpoint Mobile | Endpoint Backend | Status | Observações |
|--------|----------------|------------------|--------|-------------|
| `login()` | `POST /api/auth/login` | `POST /api/auth/login` | ✅ **CORRETO** | Formato compatível |
| `register()` | `POST /api/auth/register` | `POST /api/auth/register` | ✅ **CORRETO** | Backend espera `username`, mobile envia correto |
| `updateProfile()` | `PUT /api/user/profile` | ⚠️ **NÃO EXISTE** | ❌ **ERRO** | Endpoint não implementado no backend |

**Problemas Identificados:**
1. ❌ `PUT /api/user/profile` não existe no backend
2. ⚠️ Falta tratamento de refresh token
3. ⚠️ Falta tratamento de token expirado

#### ❌ **GameService.js - Endpoints Incorretos**

| Método | Endpoint Mobile | Endpoint Backend | Status | Observações |
|--------|----------------|------------------|--------|-------------|
| `getGames()` | `GET /api/games` | `GET /api/games/status` | ❌ **ERRADO** | Endpoint não existe |
| `createGame()` | `POST /api/games` | ❌ Não existe | ❌ **ERRADO** | Sistema não usa criação de jogos |
| `getGameById()` | `GET /api/games/:id` | ❌ Não existe | ❌ **ERRADO** | Sistema não usa IDs de jogos |
| `getLeaderboard()` | `GET /api/analytics/leaderboard` | ❌ Não existe | ❌ **ERRADO** | Endpoint não implementado |
| `getPayments()` | `GET /api/payments` | ⚠️ Parcial | ⚠️ **PARCIAL** | Existe mas formato diferente |
| `createPayment()` | `POST /api/payments` | ⚠️ Parcial | ⚠️ **PARCIAL** | Existe mas formato diferente |
| `getAnalytics()` | `GET /api/analytics/overview` | ❌ Não existe | ❌ **ERRADO** | Endpoint não implementado |
| `getPlayerAnalytics()` | `GET /api/analytics/players` | ❌ Não existe | ❌ **ERRADO** | Endpoint não implementado |

**Endpoints Corretos que Deveriam Ser Usados:**

| Funcionalidade | Endpoint Correto | Método |
|----------------|------------------|--------|
| Status do jogo | `GET /api/games/status` | GET |
| Chutar | `POST /api/games/shoot` | POST |
| Histórico de chutes | `GET /api/games/history` | GET |
| Estatísticas | `GET /api/games/stats` | GET |
| Criar PIX | `POST /api/payments/pix/criar` | POST |
| Status PIX | `GET /api/payments/pix/status/:payment_id` | GET |
| Saldo | `GET /api/payments/saldo/:user_id` | GET |
| Extrato | `GET /api/payments/extrato/:user_id` | GET |
| Saque | `POST /api/payments/saque` | POST |

### 2.2. Formato de Respostas

**Backend Padrão:**
```json
{
  "success": true,
  "data": { ... },
  "message": "...",
  "timestamp": "2025-11-17T..."
}
```

**Mobile Espera:**
```javascript
// AuthService.js - Linha 54-56
const authToken = responseData.data?.token || responseData.token;
const userData = responseData.data?.user || responseData.user;
```

**Status:** ✅ **COMPATÍVEL** - Mobile trata ambos os formatos

### 2.3. Problemas de Integração HTTP

#### 🔴 **CRÍTICO: Endpoints Inexistentes**

1. **`GET /api/games`** - Não existe
   - **Impacto:** `HomeScreen` não pode carregar jogos
   - **Solução:** Usar `GET /api/games/status` ou remover

2. **`GET /api/analytics/leaderboard`** - Não existe
   - **Impacto:** `LeaderboardScreen` não funciona
   - **Solução:** Criar endpoint ou usar dados mockados temporariamente

3. **`PUT /api/user/profile`** - Não existe
   - **Impacto:** `ProfileScreen` não pode atualizar perfil
   - **Solução:** Criar endpoint ou remover funcionalidade

#### ⚠️ **MODERADO: Formato de Dados**

1. **Chute (`POST /api/games/shoot`)**
   - **Mobile envia:** `{ zone, power, angle }`
   - **Backend espera:** `{ direction, amount }`
   - **Impacto:** Chutes não funcionam
   - **Solução:** Ajustar formato no mobile

2. **Pagamentos**
   - **Mobile:** Formato genérico
   - **Backend:** Formato específico PIX
   - **Impacto:** Pagamentos não funcionam
   - **Solução:** Criar `PaymentService` específico

### 2.4. Configuração do Axios

**GameService.js - Linha 7-13:**
```javascript
this.api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Problemas:**
1. ⚠️ Token não é adicionado automaticamente em todas requisições
2. ⚠️ Falta interceptor de resposta para tratar erros globais
3. ⚠️ Falta tratamento de token expirado
4. ⚠️ Falta retry automático

**Solução Necessária:**
```javascript
// Interceptor de resposta para tratar erros globais
this.api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado - fazer logout
      await AsyncStorage.removeItem('authToken');
      // Redirecionar para login
    }
    return Promise.reject(error);
  }
);
```

---

## 3. AUDITORIA DO WEBSOCKET

### 3.1. Eventos WebSocket - Comparação Backend vs Mobile

#### ❌ **INCOMPATIBILIDADE CRÍTICA**

| Evento Mobile | Backend Suporta? | Status |
|---------------|------------------|--------|
| `join_queue` | ❌ **NÃO** | ❌ **INCOMPATÍVEL** |
| `leave_queue` | ❌ **NÃO** | ❌ **INCOMPATÍVEL** |
| `kick` | ❌ **NÃO** | ❌ **INCOMPATÍVEL** |
| `queue_update` | ❌ **NÃO** | ❌ **INCOMPATÍVEL** |
| `game_started` | ❌ **NÃO** | ❌ **INCOMPATÍVEL** |
| `game_ended` | ❌ **NÃO** | ❌ **INCOMPATÍVEL** |
| `player_kicked` | ❌ **NÃO** | ❌ **INCOMPATÍVEL** |
| `ping` | ✅ **SIM** | ✅ **COMPATÍVEL** |

**Eventos que o Backend REALMENTE Suporta:**

| Evento Backend | Mobile Usa? | Status |
|----------------|-------------|--------|
| `auth` | ❌ **NÃO** | ❌ **FALTA** |
| `auth_success` | ❌ **NÃO** | ❌ **FALTA** |
| `auth_error` | ❌ **NÃO** | ❌ **FALTA** |
| `join_room` | ❌ **NÃO** | ❌ **FALTA** |
| `leave_room` | ❌ **NÃO** | ❌ **FALTA** |
| `chat_message` | ❌ **NÃO** | ❌ **FALTA** |
| `ping` | ✅ **SIM** | ✅ **OK** |
| `pong` | ⚠️ **PARCIAL** | ⚠️ **PARCIAL** |

### 3.2. Autenticação WebSocket

**Mobile (WebSocketService.js - Linha 31-46):**
```javascript
const token = await AsyncStorage.getItem('authToken');
let wsUrl = WS_BASE_URL;
if (WS_BASE_URL.startsWith('wss://') || WS_BASE_URL.startsWith('ws://')) {
  wsUrl = `${WS_BASE_URL}/ws?token=${token || ''}`;
}
```

**Backend (src/websocket.js - Linha 67-89):**
```javascript
// Backend espera autenticação via mensagem 'auth' após conexão
// Não autentica via query string
```

**Problema:** ❌ **CRÍTICO**
- Mobile envia token na URL
- Backend não autentica via URL, espera mensagem `auth`
- **Resultado:** Conexão WebSocket nunca autentica

**Solução Necessária:**
```javascript
// Após conexão, enviar mensagem de autenticação
this.ws.onopen = () => {
  const token = await AsyncStorage.getItem('authToken');
  this.send('auth', { token });
};
```

### 3.3. Formato de Mensagens

**Mobile Envia:**
```javascript
// WebSocketService.js - Linha 159-164
const message = {
  type,
  ...data,
  timestamp: new Date().toISOString()
};
```

**Backend Espera:**
```javascript
// src/websocket.js - Linha 114
const data = JSON.parse(message);
// Espera: { type: 'auth', token: '...' }
```

**Status:** ✅ **COMPATÍVEL** - Formato básico está correto

### 3.4. Reconexão Automática

**Mobile (WebSocketService.js - Linha 137-156):**
- ✅ Implementa reconexão com backoff exponencial
- ✅ Máximo de 10 tentativas
- ✅ Delay máximo de 30 segundos

**Status:** ✅ **BOM** - Implementação adequada

### 3.5. Heartbeat

**Mobile (WebSocketService.js - Linha 234-240):**
```javascript
this.heartbeatInterval = setInterval(() => {
  if (this.isConnected) {
    this.send('ping');
  }
}, 30000); // A cada 30 segundos
```

**Backend (src/websocket.js - Linha 154-188):**
- Backend envia `ping()` nativo do WebSocket
- Espera `pong` nativo
- Mobile envia mensagem `ping` (não nativo)

**Problema:** ⚠️ **MODERADO**
- Mobile envia mensagem JSON `{ type: 'ping' }`
- Backend responde com `{ type: 'pong' }`
- Mas backend também envia `ping()` nativo que mobile não trata

**Solução:** Tratar ambos os tipos de ping/pong

---

## 4. AUDITORIA DA TELA DE JOGO (GameScreen.js)

### 4.1. Sistema de Fila vs Sistema de Lotes

**Mobile Espera:**
- Sistema de fila com 10 jogadores
- Partidas com início/fim
- Chutes simultâneos em partida

**Backend Implementa:**
- Sistema de **LOTES** (não fila)
- Chutes individuais imediatos
- Sem espera por outros jogadores
- Sem partidas

**Impacto:** 🔴 **CRÍTICO** - **GameScreen.js NÃO FUNCIONA**

### 4.2. Fluxo Esperado vs Real

**Mobile (GameScreen.js):**
1. Usuário entra na fila → `joinQueue()`
2. Espera 10 jogadores → `queueUpdate` events
3. Partida inicia → `gameStarted` event
4. Usuário chuta → `kick(zone, power, angle)`
5. Partida termina → `gameEnded` event

**Backend Real:**
1. Usuário chuta diretamente → `POST /api/games/shoot`
2. Sistema processa imediatamente
3. Retorna resultado
4. Sem fila, sem partidas, sem espera

### 4.3. Parâmetros de Chute

**Mobile Envia (GameScreen.js - Linha 170):**
```javascript
WebSocketService.kick(selectedZone, power, angle);
// Envia: { type: 'kick', zone: 'center', power: 50, angle: 0 }
```

**Backend Espera (GameController.js - Linha 226):**
```javascript
const { direction, amount } = req.body;
// Espera: { direction: 'center', amount: 1 }
```

**Problemas:**
1. ❌ Mobile usa `zone`, backend espera `direction`
2. ❌ Mobile usa `power` e `angle`, backend não usa
3. ❌ Mobile não envia `amount` (valor da aposta)
4. ❌ Mobile usa WebSocket, backend usa HTTP POST

### 4.4. Estados da Tela

**Mobile (GameScreen.js - Linha 23):**
```javascript
const [queueStatus, setQueueStatus] = useState('disconnected'); 
// Estados: disconnected, waiting, in_game
```

**Backend:**
- Não tem estados de fila
- Não tem estados de partida
- Sistema é stateless (chute individual)

**Impacto:** 🔴 **CRÍTICO** - Estados não fazem sentido com backend atual

### 4.5. Zonas de Chute

**Mobile (GameScreen.js - Linha 34-40):**
```javascript
const zones = [
  { id: 'center', name: 'Centro', color: '#4ECDC4' },
  { id: 'left', name: 'Esquerda', color: '#FF6B6B' },
  { id: 'right', name: 'Direita', color: '#45B7D1' },
  { id: 'top', name: 'Superior', color: '#95E1D3' },
  { id: 'bottom', name: 'Inferior', color: '#F38181' },
];
```

**Backend (GameController.js):**
- Aceita qualquer `direction` como string
- Não valida zonas específicas
- Valores comuns: 'center', 'left', 'right', 'top', 'bottom'

**Status:** ✅ **COMPATÍVEL** - Zonas são aceitas pelo backend

---

## 5. AUDITORIA DE TELAS COM DADOS MOCKADOS

### 5.1. HomeScreen.js

**Dados Mockados:**
- `userStats` (linha 18-24) - Nível, XP, jogos, melhor pontuação, ranking
- `recentGames` (linha 26) - Lista de jogos recentes

**O que Precisa Virar Real:**

| Dado Mockado | Endpoint Necessário | Status Backend |
|--------------|---------------------|----------------|
| `level`, `xp` | ❌ Não existe | ❌ **FALTA** |
| `totalGames` | `GET /api/games/stats` | ✅ **EXISTE** |
| `bestScore` | ❌ Não existe | ❌ **FALTA** |
| `rank` | ❌ Não existe | ❌ **FALTA** |
| `recentGames` | `GET /api/games/history` | ✅ **EXISTE** |

**Solução:**
1. Usar `GET /api/games/stats` para estatísticas básicas
2. Usar `GET /api/games/history` para jogos recentes
3. Criar endpoints para nível/XP/ranking (futuro)

### 5.2. ProfileScreen.js

**Dados Mockados:**
- `user` (linha 17-27) - Nome, email, avatar, nível, XP, jogos, melhor pontuação, ranking, conquistas
- `stats` (linha 29-36) - Jogos jogados, pontuação total, média, taxa de vitória, zona favorita, sequência

**O que Precisa Virar Real:**

| Dado Mockado | Endpoint Necessário | Status Backend |
|--------------|---------------------|----------------|
| `user.name`, `user.email` | `GET /api/user/profile` | ❌ **NÃO EXISTE** |
| `user.avatar` | ❌ Não existe | ❌ **FALTA** |
| `user.level`, `user.xp` | ❌ Não existe | ❌ **FALTA** |
| `stats.gamesPlayed` | `GET /api/games/stats` | ✅ **EXISTE** |
| `stats.totalScore` | ❌ Não existe | ❌ **FALTA** |
| `stats.averageScore` | ❌ Não existe | ❌ **FALTA** |
| `stats.winRate` | ❌ Não existe | ❌ **FALTA** |
| `stats.favoriteZone` | ❌ Não existe | ❌ **FALTA** |
| `user.achievements` | ❌ Não existe | ❌ **FALTA** |

**Solução:**
1. Criar `GET /api/user/profile` para dados básicos
2. Usar `GET /api/games/stats` para estatísticas de jogos
3. Criar endpoints para conquistas e estatísticas avançadas (futuro)

### 5.3. LeaderboardScreen.js

**Dados Mockados:**
- `leaderboard` (linha 32-45) - Lista completa de jogadores com pontuação
- `userRank` (linha 17) - Posição do usuário

**O que Precisa Virar Real:**

| Dado Mockado | Endpoint Necessário | Status Backend |
|--------------|---------------------|----------------|
| `leaderboard` | `GET /api/analytics/leaderboard` | ❌ **NÃO EXISTE** |
| `userRank` | ❌ Não existe | ❌ **FALTA** |

**Solução:**
1. Criar `GET /api/analytics/leaderboard?period=daily|weekly|monthly|alltime`
2. Retornar lista de jogadores ordenada por pontuação
3. Incluir posição do usuário atual

---

## 6. AUDITORIA DE PIX E SALDO

### 6.1. Telas de PIX

**Status:** ❌ **NÃO EXISTEM**

**O que Deveria Existir:**
1. Tela de criar pagamento PIX
2. Tela de consultar status do PIX
3. Tela de histórico de pagamentos PIX
4. Tela de QR Code PIX

**Endpoints Backend Disponíveis:**
- ✅ `POST /api/payments/pix/criar` - Criar pagamento PIX
- ✅ `GET /api/payments/pix/status/:payment_id` - Consultar status
- ✅ `GET /api/payments/pix/usuario/:user_id` - Listar pagamentos do usuário
- ✅ `POST /api/payments/pix/cancelar/:payment_id` - Cancelar pagamento

**Solução:** Criar telas de PIX usando endpoints existentes

### 6.2. Telas de Saldo

**Status:** ❌ **NÃO EXISTEM**

**O que Deveria Existir:**
1. Tela de saldo atual
2. Tela de extrato
3. Tela de solicitar saque
4. Tela de histórico de saques

**Endpoints Backend Disponíveis:**
- ✅ `GET /api/payments/saldo/:user_id` - Obter saldo
- ✅ `GET /api/payments/extrato/:user_id` - Obter extrato
- ✅ `POST /api/payments/saque` - Solicitar saque
- ✅ `GET /api/payments/saques/usuario/:user_id` - Listar saques

**Solução:** Criar telas de saldo usando endpoints existentes

### 6.3. Integração no App.js

**Onde Adicionar:**
- Nova tab "Carteira" no `TabNavigator`
- Ou adicionar dentro de `ProfileScreen`
- Ou criar navegação aninhada

**Recomendação:** Adicionar tab "Carteira" separada

---

## 7. AUDITORIA DE ESTRUTURA E QUALIDADE

### 7.1. Boas Práticas

**✅ Implementadas:**
- Separação de concerns (services/screens)
- Context API para estado global
- Configuração centralizada
- Tratamento básico de erros

**❌ Faltando:**
- Validação de formulários
- Loading states consistentes
- Error boundaries
- Retry automático
- Cache de dados
- Offline support

### 7.2. Antipadrões Identificados

1. **❌ Dados Mockados em Produção**
   - HomeScreen, ProfileScreen, LeaderboardScreen
   - **Impacto:** Usuários veem dados falsos
   - **Solução:** Substituir por chamadas reais

2. **❌ Listeners Não Removidos**
   - GameScreen.js - Listeners são removidos no cleanup ✅
   - WebSocketService.js - Listeners podem acumular ⚠️
   - **Impacto:** Memory leaks
   - **Solução:** Garantir cleanup em todos os casos

3. **❌ Race Conditions**
   - `joinQueue()` pode ser chamado múltiplas vezes
   - `handleKick()` não previne múltiplos chutes simultâneos
   - **Impacto:** Comportamento imprevisível
   - **Solução:** Adicionar flags de bloqueio

4. **❌ Estado Stale**
   - `gameData?.playerIndex` usado em dependência do useEffect
   - Pode causar loops infinitos
   - **Impacto:** Performance ruim
   - **Solução:** Revisar dependências

### 7.3. Problemas de Performance

1. **Re-renders Desnecessários**
   - `WebSocketService.connected` acessado diretamente no render
   - Causa re-render a cada mudança de estado do WebSocket
   - **Solução:** Usar estado local ou hook customizado

2. **Memory Leaks Potenciais**
   - Intervalos não limpos em alguns casos
   - Listeners WebSocket acumulando
   - **Solução:** Garantir cleanup completo

3. **Requisições Paralelas**
   - Múltiplas chamadas simultâneas podem causar race conditions
   - **Solução:** Implementar debounce/throttle

### 7.4. Problemas Comuns

1. **Double Navigation**
   - Não há proteção contra navegação dupla
   - **Solução:** Adicionar flags de navegação

2. **Stale State**
   - Estado pode ficar desatualizado após navegação
   - **Solução:** Usar `useFocusEffect` do React Navigation

3. **Token Expirado**
   - Não há tratamento de token expirado
   - **Solução:** Interceptor de resposta para 401

---

## 8. AUDITORIA DE BUILD E PUBLICAÇÃO

### 8.1. app.json

**Status:** ✅ **CORRETO**

**Configurações:**
- ✅ Bundle identifier configurado
- ✅ Versão configurada
- ✅ Splash screen configurado
- ✅ Permissões configuradas
- ✅ API URL configurada: `https://goldeouro-backend-v2.fly.dev`

**Observações:**
- ⚠️ Plugin `expo-router` configurado mas não usado
- ✅ Permissões de câmera e galeria corretas

### 8.2. eas.json

**Status:** ✅ **CORRETO**

**Configurações:**
- ✅ Builds de desenvolvimento, preview e produção
- ✅ Distribuição interna configurada
- ✅ APK configurado para Android

**Pronto para:** ✅ **EAS Build Production**

### 8.3. package.json

**Status:** ✅ **CORRETO**

**Dependências:**
- ✅ Todas as dependências necessárias presentes
- ✅ Versões compatíveis
- ✅ Scripts de build configurados

**Observações:**
- ⚠️ `expo-router` instalado mas não usado (pode ser removido)

---

## 9. LISTA DE CORREÇÕES OBRIGATÓRIAS

### 9.1. Problemas Críticos (Bloqueadores)

| # | Problema | Arquivo | Impacto | Solução |
|---|----------|---------|---------|---------|
| 1 | WebSocket incompatível | `WebSocketService.js` | 🔴 **CRÍTICO** | Remover eventos de fila, implementar autenticação correta |
| 2 | Sistema de jogo divergente | `GameScreen.js` | 🔴 **CRÍTICO** | Refatorar para sistema de lotes (chutes individuais) |
| 3 | Endpoint de chute incorreto | `GameScreen.js` | 🔴 **CRÍTICO** | Mudar de WebSocket para HTTP POST |
| 4 | Parâmetros de chute incorretos | `GameScreen.js` | 🔴 **CRÍTICO** | Mudar `zone/power/angle` para `direction/amount` |
| 5 | Autenticação WebSocket incorreta | `WebSocketService.js` | 🔴 **CRÍTICO** | Enviar mensagem `auth` após conexão |
| 6 | Endpoints inexistentes | `GameService.js` | 🔴 **CRÍTICO** | Remover ou criar endpoints |

### 9.2. Problemas Moderados

| # | Problema | Arquivo | Impacto | Solução |
|---|----------|---------|---------|---------|
| 7 | Dados mockados | `HomeScreen.js` | ⚠️ **MODERADO** | Substituir por chamadas reais |
| 8 | Dados mockados | `ProfileScreen.js` | ⚠️ **MODERADO** | Substituir por chamadas reais |
| 9 | Dados mockados | `LeaderboardScreen.js` | ⚠️ **MODERADO** | Criar endpoint ou usar mock temporário |
| 10 | Falta tratamento de token expirado | `GameService.js` | ⚠️ **MODERADO** | Adicionar interceptor de resposta |
| 11 | Falta telas de PIX | N/A | ⚠️ **MODERADO** | Criar telas usando endpoints existentes |
| 12 | Falta telas de saldo | N/A | ⚠️ **MODERADO** | Criar telas usando endpoints existentes |

### 9.3. Problemas Menores

| # | Problema | Arquivo | Impacto | Solução |
|---|----------|---------|---------|---------|
| 13 | Race conditions | `GameScreen.js` | 🟡 **MENOR** | Adicionar flags de bloqueio |
| 14 | Memory leaks potenciais | `WebSocketService.js` | 🟡 **MENOR** | Garantir cleanup completo |
| 15 | Re-renders desnecessários | `GameScreen.js` | 🟡 **MENOR** | Usar estado local |
| 16 | Falta validação de formulários | Vários | 🟡 **MENOR** | Adicionar validação |

---

## 10. MAPA DE DEPENDÊNCIAS

### 10.1. Dependências Entre Telas

```
App.js
├── AuthProvider (AuthService.js)
│   └── Todas as telas dependem de autenticação
├── HomeScreen
│   ├── Depende de: AuthService (user)
│   ├── Navega para: GameScreen
│   └── Precisa de: GET /api/games/stats, GET /api/games/history
├── GameScreen
│   ├── Depende de: AuthService (user), WebSocketService
│   ├── Usa: WebSocket (INCOMPATÍVEL)
│   └── Precisa de: POST /api/games/shoot (HTTP)
├── ProfileScreen
│   ├── Depende de: AuthService (user)
│   └── Precisa de: GET /api/user/profile (NÃO EXISTE)
└── LeaderboardScreen
    ├── Depende de: AuthService (user)
    └── Precisa de: GET /api/analytics/leaderboard (NÃO EXISTE)
```

### 10.2. Dependências Entre Services

```
AuthService.js
├── Usa: axios, AsyncStorage
├── Depende de: API_BASE_URL (env.js)
└── Fornece: Context para todas as telas

GameService.js
├── Usa: axios, AsyncStorage
├── Depende de: API_BASE_URL (env.js)
└── Usado por: Nenhuma tela (precisa ser usado)

WebSocketService.js
├── Usa: AsyncStorage
├── Depende de: WS_BASE_URL (env.js)
└── Usado por: GameScreen (INCOMPATÍVEL)
```

---

## 11. ROADMAP DE IMPLEMENTAÇÃO

### Fase 1: Correções Críticas (Bloqueadores)

**Prioridade:** 🔴 **ALTA**

1. **Refatorar GameScreen.js**
   - Remover sistema de fila/partidas
   - Implementar sistema de lotes (chutes individuais)
   - Mudar de WebSocket para HTTP POST
   - Ajustar parâmetros: `zone/power/angle` → `direction/amount`

2. **Corrigir WebSocketService.js**
   - Implementar autenticação correta (mensagem `auth`)
   - Remover eventos de fila inexistentes
   - Manter apenas eventos básicos (ping/pong)

3. **Corrigir GameService.js**
   - Remover endpoints inexistentes
   - Adicionar endpoints corretos
   - Adicionar tratamento de token expirado

**Tempo Estimado:** 2-3 dias

### Fase 2: Integração de Dados Reais

**Prioridade:** ⚠️ **MÉDIA**

1. **HomeScreen.js**
   - Substituir dados mockados por `GET /api/games/stats`
   - Substituir jogos recentes por `GET /api/games/history`
   - Adicionar loading states

2. **ProfileScreen.js**
   - Criar `GET /api/user/profile` no backend OU
   - Usar dados do AuthService
   - Substituir estatísticas mockadas por `GET /api/games/stats`

3. **LeaderboardScreen.js**
   - Criar `GET /api/analytics/leaderboard` no backend OU
   - Manter mock temporariamente

**Tempo Estimado:** 2-3 dias

### Fase 3: Telas de PIX e Saldo

**Prioridade:** ⚠️ **MÉDIA**

1. **Criar PaymentService.js**
   - Métodos para criar PIX
   - Métodos para consultar status
   - Métodos para obter saldo
   - Métodos para extrato

2. **Criar telas de PIX**
   - Tela de criar pagamento
   - Tela de QR Code
   - Tela de histórico

3. **Criar telas de saldo**
   - Tela de saldo atual
   - Tela de extrato
   - Tela de saque

**Tempo Estimado:** 3-4 dias

### Fase 4: Melhorias de Qualidade

**Prioridade:** 🟡 **BAIXA**

1. Adicionar tratamento global de erros
2. Adicionar loading states consistentes
3. Adicionar validação de formulários
4. Adicionar retry automático
5. Adicionar cache de dados
6. Corrigir race conditions
7. Corrigir memory leaks

**Tempo Estimado:** 2-3 dias

---

## 12. REGRAS PARA MANTER COMPATIBILIDADE

### 12.1. Formato de Requisições HTTP

**Sempre usar:**
```javascript
{
  success: true,
  data: { ... },
  message: "...",
  timestamp: "..."
}
```

### 12.2. Autenticação

**Sempre incluir:**
```javascript
headers: {
  Authorization: `Bearer ${token}`
}
```

### 12.3. WebSocket

**Sempre autenticar após conexão:**
```javascript
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'auth', token }));
};
```

### 12.4. Tratamento de Erros

**Sempre tratar:**
- 401 (Token expirado) → Logout
- 400 (Validação) → Mostrar mensagem
- 500 (Servidor) → Mostrar erro genérico
- Timeout → Retry automático

---

## 13. CONCLUSÃO

### Status Final: 🔴 **INCOMPATÍVEL**

O aplicativo mobile possui **incompatibilidades críticas** com o backend atual que impedem seu funcionamento. As principais questões são:

1. **Sistema de jogo divergente** - Mobile espera fila/partidas, backend usa lotes
2. **WebSocket incompatível** - Eventos não existem no backend
3. **Endpoints incorretos** - Muitos endpoints não existem ou têm formato diferente
4. **Dados mockados** - 3 telas principais não funcionam com dados reais

### Próximos Passos

1. **Fase 1 (Crítico):** Refatorar GameScreen e WebSocketService
2. **Fase 2 (Importante):** Integrar dados reais nas telas
3. **Fase 3 (Necessário):** Criar telas de PIX e saldo
4. **Fase 4 (Melhoria):** Ajustes de qualidade

**Tempo Total Estimado:** 9-13 dias de desenvolvimento

---

**FIM DA AUDITORIA**

