# 📊 AUDITORIA MOBILE - TABELAS RESUMO

**Data:** 17/11/2025  
**Status:** 🔴 **INCOMPATÍVEL COM BACKEND**

---

## 📋 TABELA 1: PROBLEMAS CRÍTICOS (BLOQUEADORES)

| ID | Problema | Arquivo | Impacto | Prioridade | Solução | Tempo |
|----|----------|---------|---------|------------|---------|-------|
| **P1** | WebSocket usa eventos inexistentes (`join_queue`, `kick`) | `WebSocketService.js` | 🔴 **CRÍTICO** | 🔴 **ALTA** | Remover eventos de fila, implementar autenticação correta | 1 dia |
| **P2** | GameScreen espera sistema de fila/partidas | `GameScreen.js` | 🔴 **CRÍTICO** | 🔴 **ALTA** | Refatorar para sistema de lotes (chutes individuais) | 2 dias |
| **P3** | Chute via WebSocket em vez de HTTP | `GameScreen.js` | 🔴 **CRÍTICO** | 🔴 **ALTA** | Mudar para `POST /api/games/shoot` | 0.5 dia |
| **P4** | Parâmetros incorretos: `zone/power/angle` vs `direction/amount` | `GameScreen.js` | 🔴 **CRÍTICO** | 🔴 **ALTA** | Ajustar formato de chute | 0.5 dia |
| **P5** | Autenticação WebSocket incorreta (token na URL) | `WebSocketService.js` | 🔴 **CRÍTICO** | 🔴 **ALTA** | Enviar mensagem `auth` após conexão | 0.5 dia |
| **P6** | Endpoints inexistentes chamados | `GameService.js` | 🔴 **CRÍTICO** | 🔴 **ALTA** | Remover ou criar endpoints | 1 dia |

**Total Fase 1:** 5.5 dias

---

## 📋 TABELA 2: PROBLEMAS MODERADOS

| ID | Problema | Arquivo | Impacto | Prioridade | Solução | Tempo |
|----|----------|---------|---------|------------|---------|-------|
| **P7** | HomeScreen usa dados mockados | `HomeScreen.js` | ⚠️ **MODERADO** | ⚠️ **MÉDIA** | Substituir por `GET /api/games/stats` e `GET /api/games/history` | 1 dia |
| **P8** | ProfileScreen usa dados mockados | `ProfileScreen.js` | ⚠️ **MODERADO** | ⚠️ **MÉDIA** | Criar `GET /api/user/profile` ou usar AuthService | 1 dia |
| **P9** | LeaderboardScreen usa dados mockados | `LeaderboardScreen.js` | ⚠️ **MODERADO** | ⚠️ **MÉDIA** | Criar `GET /api/analytics/leaderboard` | 1 dia |
| **P10** | Falta tratamento de token expirado | `GameService.js` | ⚠️ **MODERADO** | ⚠️ **MÉDIA** | Adicionar interceptor de resposta | 0.5 dia |
| **P11** | Falta telas de PIX | N/A | ⚠️ **MODERADO** | ⚠️ **MÉDIA** | Criar telas usando endpoints existentes | 2 dias |
| **P12** | Falta telas de saldo | N/A | ⚠️ **MODERADO** | ⚠️ **MÉDIA** | Criar telas usando endpoints existentes | 2 dias |

**Total Fase 2:** 7.5 dias

---

## 📋 TABELA 3: PROBLEMAS MENORES

| ID | Problema | Arquivo | Impacto | Prioridade | Solução | Tempo |
|----|----------|---------|---------|------------|---------|-------|
| **P13** | Race conditions em `joinQueue()` e `handleKick()` | `GameScreen.js` | 🟡 **MENOR** | 🟡 **BAIXA** | Adicionar flags de bloqueio | 0.5 dia |
| **P14** | Memory leaks potenciais em listeners | `WebSocketService.js` | 🟡 **MENOR** | 🟡 **BAIXA** | Garantir cleanup completo | 0.5 dia |
| **P15** | Re-renders desnecessários | `GameScreen.js` | 🟡 **MENOR** | 🟡 **BAIXA** | Usar estado local para WebSocket status | 0.5 dia |
| **P16** | Falta validação de formulários | Vários | 🟡 **MENOR** | 🟡 **BAIXA** | Adicionar validação com `react-hook-form` | 1 dia |

**Total Fase 3:** 2.5 dias

---

## 📋 TABELA 4: ENDPOINTS - COMPARAÇÃO MOBILE vs BACKEND

| Endpoint Mobile | Método | Endpoint Backend | Status | Ação Necessária |
|----------------|--------|------------------|--------|-----------------|
| `/api/auth/login` | POST | `/api/auth/login` | ✅ **OK** | Nenhuma |
| `/api/auth/register` | POST | `/api/auth/register` | ✅ **OK** | Nenhuma |
| `/api/user/profile` | PUT | ❌ Não existe | ❌ **ERRO** | Criar endpoint |
| `/api/games` | GET | ❌ Não existe | ❌ **ERRO** | Remover ou criar |
| `/api/games` | POST | ❌ Não existe | ❌ **ERRO** | Remover |
| `/api/games/:id` | GET | ❌ Não existe | ❌ **ERRO** | Remover |
| `/api/games/shoot` | POST | `/api/games/shoot` | ⚠️ **FORMATO** | Ajustar parâmetros |
| `/api/games/status` | GET | `/api/games/status` | ✅ **OK** | Usar este |
| `/api/games/stats` | GET | `/api/games/stats` | ✅ **OK** | Usar este |
| `/api/games/history` | GET | `/api/games/history` | ✅ **OK** | Usar este |
| `/api/analytics/leaderboard` | GET | ❌ Não existe | ❌ **ERRO** | Criar endpoint |
| `/api/analytics/overview` | GET | ❌ Não existe | ❌ **ERRO** | Remover |
| `/api/analytics/players` | GET | ❌ Não existe | ❌ **ERRO** | Remover |
| `/api/payments` | GET | ⚠️ Parcial | ⚠️ **FORMATO** | Usar `/api/payments/pix/usuario/:id` |
| `/api/payments` | POST | ⚠️ Parcial | ⚠️ **FORMATO** | Usar `/api/payments/pix/criar` |
| `/api/payments/pix/criar` | POST | `/api/payments/pix/criar` | ✅ **OK** | Usar este |
| `/api/payments/pix/status/:id` | GET | `/api/payments/pix/status/:id` | ✅ **OK** | Usar este |
| `/api/payments/saldo/:id` | GET | `/api/payments/saldo/:id` | ✅ **OK** | Usar este |
| `/api/payments/extrato/:id` | GET | `/api/payments/extrato/:id` | ✅ **OK** | Usar este |
| `/api/payments/saque` | POST | `/api/payments/saque` | ✅ **OK** | Usar este |

---

## 📋 TABELA 5: EVENTOS WEBSOCKET - COMPARAÇÃO

| Evento Mobile | Backend Suporta? | Status | Ação |
|---------------|------------------|--------|------|
| `join_queue` | ❌ Não | ❌ **REMOVER** | Sistema não usa fila |
| `leave_queue` | ❌ Não | ❌ **REMOVER** | Sistema não usa fila |
| `kick` | ❌ Não | ❌ **REMOVER** | Usar HTTP POST |
| `queue_update` | ❌ Não | ❌ **REMOVER** | Sistema não usa fila |
| `game_started` | ❌ Não | ❌ **REMOVER** | Sistema não usa partidas |
| `game_ended` | ❌ Não | ❌ **REMOVER** | Sistema não usa partidas |
| `player_kicked` | ❌ Não | ❌ **REMOVER** | Sistema não usa partidas |
| `ping` | ✅ Sim | ✅ **MANTER** | Funciona |
| `auth` | ✅ Sim | ✅ **ADICIONAR** | Falta implementar |
| `auth_success` | ✅ Sim | ✅ **ADICIONAR** | Falta implementar |
| `auth_error` | ✅ Sim | ✅ **ADICIONAR** | Falta implementar |
| `join_room` | ✅ Sim | ⚠️ **OPCIONAL** | Não necessário agora |
| `leave_room` | ✅ Sim | ⚠️ **OPCIONAL** | Não necessário agora |
| `chat_message` | ✅ Sim | ⚠️ **OPCIONAL** | Não necessário agora |

---

## 📋 TABELA 6: PARÂMETROS DE CHUTE - COMPARAÇÃO

| Parâmetro Mobile | Parâmetro Backend | Tipo | Status | Ação |
|------------------|-------------------|------|--------|------|
| `zone` | `direction` | string | ⚠️ **AJUSTAR** | Renomear |
| `power` | ❌ Não usado | number | ❌ **REMOVER** | Backend não usa |
| `angle` | ❌ Não usado | number | ❌ **REMOVER** | Backend não usa |
| ❌ Não enviado | `amount` | number | ❌ **ADICIONAR** | Valor da aposta (1, 2, 5 ou 10) |

**Formato Correto:**
```javascript
// Mobile deve enviar:
POST /api/games/shoot
{
  "direction": "center",  // ou "left", "right", "top", "bottom"
  "amount": 1             // ou 2, 5, 10
}
```

---

## 📋 TABELA 7: DADOS MOCKADOS - MAPEAMENTO

| Tela | Dado Mockado | Endpoint Necessário | Status Backend | Prioridade |
|------|--------------|---------------------|----------------|------------|
| **HomeScreen** | `userStats.level` | ❌ Não existe | ❌ **FALTA** | 🟡 Baixa |
| **HomeScreen** | `userStats.xp` | ❌ Não existe | ❌ **FALTA** | 🟡 Baixa |
| **HomeScreen** | `userStats.totalGames` | `GET /api/games/stats` | ✅ **EXISTE** | ⚠️ Média |
| **HomeScreen** | `userStats.bestScore` | ❌ Não existe | ❌ **FALTA** | 🟡 Baixa |
| **HomeScreen** | `userStats.rank` | ❌ Não existe | ❌ **FALTA** | 🟡 Baixa |
| **HomeScreen** | `recentGames` | `GET /api/games/history` | ✅ **EXISTE** | ⚠️ Média |
| **ProfileScreen** | `user.name` | `GET /api/user/profile` | ❌ **FALTA** | ⚠️ Média |
| **ProfileScreen** | `user.email` | `GET /api/user/profile` | ❌ **FALTA** | ⚠️ Média |
| **ProfileScreen** | `user.avatar` | ❌ Não existe | ❌ **FALTA** | 🟡 Baixa |
| **ProfileScreen** | `stats.gamesPlayed` | `GET /api/games/stats` | ✅ **EXISTE** | ⚠️ Média |
| **ProfileScreen** | `stats.totalScore` | ❌ Não existe | ❌ **FALTA** | 🟡 Baixa |
| **ProfileScreen** | `user.achievements` | ❌ Não existe | ❌ **FALTA** | 🟡 Baixa |
| **LeaderboardScreen** | `leaderboard` | `GET /api/analytics/leaderboard` | ❌ **FALTA** | ⚠️ Média |
| **LeaderboardScreen** | `userRank` | `GET /api/analytics/leaderboard` | ❌ **FALTA** | ⚠️ Média |

---

## 📋 TABELA 8: ORDEM DE IMPLEMENTAÇÃO

| Fase | Tarefas | Dependências | Tempo | Prioridade |
|------|---------|--------------|-------|------------|
| **1.1** | Refatorar GameScreen (remover fila) | Nenhuma | 1 dia | 🔴 **ALTA** |
| **1.2** | Implementar chute HTTP em GameScreen | 1.1 | 1 dia | 🔴 **ALTA** |
| **1.3** | Corrigir WebSocketService (autenticação) | Nenhuma | 0.5 dia | 🔴 **ALTA** |
| **1.4** | Corrigir GameService (endpoints) | Nenhuma | 1 dia | 🔴 **ALTA** |
| **1.5** | Testar fluxo completo de chute | 1.1, 1.2, 1.3, 1.4 | 1 dia | 🔴 **ALTA** |
| **2.1** | Integrar HomeScreen com dados reais | 1.4 | 1 dia | ⚠️ **MÉDIA** |
| **2.2** | Integrar ProfileScreen com dados reais | Criar endpoint ou usar AuthService | 1 dia | ⚠️ **MÉDIA** |
| **2.3** | Criar endpoint de leaderboard OU manter mock | Nenhuma | 1 dia | ⚠️ **MÉDIA** |
| **3.1** | Criar PaymentService | Nenhuma | 0.5 dia | ⚠️ **MÉDIA** |
| **3.2** | Criar telas de PIX | 3.1 | 2 dias | ⚠️ **MÉDIA** |
| **3.3** | Criar telas de saldo | 3.1 | 2 dias | ⚠️ **MÉDIA** |
| **4.1** | Adicionar tratamento de erros global | Nenhuma | 0.5 dia | 🟡 **BAIXA** |
| **4.2** | Adicionar loading states consistentes | Nenhuma | 0.5 dia | 🟡 **BAIXA** |
| **4.3** | Corrigir race conditions | Nenhuma | 0.5 dia | 🟡 **BAIXA** |
| **4.4** | Corrigir memory leaks | Nenhuma | 0.5 dia | 🟡 **BAIXA** |

**Total:** 15 dias

---

## 📋 TABELA 9: ARQUIVOS QUE PRECISARÃO SER ALTERADOS

| Arquivo | Alterações Necessárias | Complexidade | Tempo |
|---------|------------------------|--------------|-------|
| `src/screens/GameScreen.js` | Refatoração completa | 🔴 **ALTA** | 2 dias |
| `src/services/WebSocketService.js` | Correção de autenticação | ⚠️ **MÉDIA** | 0.5 dia |
| `src/services/GameService.js` | Remover endpoints, adicionar corretos | ⚠️ **MÉDIA** | 1 dia |
| `src/screens/HomeScreen.js` | Substituir dados mockados | 🟡 **BAIXA** | 1 dia |
| `src/screens/ProfileScreen.js` | Substituir dados mockados | 🟡 **BAIXA** | 1 dia |
| `src/screens/LeaderboardScreen.js` | Substituir dados mockados | 🟡 **BAIXA** | 1 dia |
| `src/services/PaymentService.js` | **CRIAR NOVO** | ⚠️ **MÉDIA** | 0.5 dia |
| `src/screens/PixScreen.js` | **CRIAR NOVO** | ⚠️ **MÉDIA** | 1 dia |
| `src/screens/SaldoScreen.js` | **CRIAR NOVO** | ⚠️ **MÉDIA** | 1 dia |
| `App.js` | Adicionar tab de Carteira | 🟡 **BAIXA** | 0.5 dia |

**Total de Arquivos:** 10 arquivos (7 alterados + 3 novos)

---

## 📋 TABELA 10: DEPENDÊNCIAS ENTRE CORREÇÕES

```
Fase 1 (Crítico)
├── 1.1 Refatorar GameScreen
│   └── 1.2 Implementar chute HTTP
│       └── 1.5 Testar fluxo completo
├── 1.3 Corrigir WebSocketService
│   └── 1.5 Testar fluxo completo
└── 1.4 Corrigir GameService
    ├── 1.5 Testar fluxo completo
    └── 2.1 Integrar HomeScreen

Fase 2 (Importante)
├── 2.1 Integrar HomeScreen
│   └── Depende de: 1.4
├── 2.2 Integrar ProfileScreen
│   └── Depende de: Criar endpoint OU usar AuthService
└── 2.3 Criar leaderboard OU manter mock
    └── Sem dependências

Fase 3 (Necessário)
├── 3.1 Criar PaymentService
│   ├── 3.2 Criar telas de PIX
│   └── 3.3 Criar telas de saldo
└── App.js (adicionar tab)
    └── Depende de: 3.2, 3.3

Fase 4 (Melhoria)
└── Todas independentes
    ├── 4.1 Tratamento de erros
    ├── 4.2 Loading states
    ├── 4.3 Race conditions
    └── 4.4 Memory leaks
```

---

## 📋 TABELA 11: REGRAS DE COMPATIBILIDADE

| Regra | Descrição | Exemplo |
|-------|-----------|---------|
| **R1** | Sempre usar formato padronizado de resposta | `{ success, data, message, timestamp }` |
| **R2** | Sempre incluir token de autenticação | `Authorization: Bearer ${token}` |
| **R3** | Sempre autenticar WebSocket após conexão | `ws.send({ type: 'auth', token })` |
| **R4** | Sempre tratar erros HTTP | Interceptor para 401, 400, 500 |
| **R5** | Sempre validar entrada antes de enviar | Validar `direction` e `amount` |
| **R6** | Sempre usar endpoints corretos | Verificar tabela de endpoints |
| **R7** | Sempre tratar token expirado | Logout automático em 401 |
| **R8** | Sempre limpar listeners e intervals | Cleanup em useEffect |

---

**FIM DAS TABELAS RESUMO**

