# 🧪 FASE 1 MOBILE - TESTES DE VALIDAÇÃO

**Data:** 17/11/2025  
**Status:** ✅ **PRONTO PARA TESTE**  
**Fase:** FASE 1 - Crítica

---

## 📋 CHECKLIST DE TESTES

### ✅ 1. WebSocketService.js

#### Teste 1.1: Conexão WebSocket
- [ ] Conecta ao WebSocket sem token na URL
- [ ] Recebe mensagem `welcome` do servidor
- [ ] Envia mensagem `auth` após receber `welcome`
- [ ] Recebe `auth_success` com token de reconexão
- [ ] Estado `isAuthenticated` fica `true`

#### Teste 1.2: Reconexão Automática
- [ ] Desconecta WebSocket manualmente
- [ ] Reconecta automaticamente após delay
- [ ] Usa token de reconexão se disponível
- [ ] Fallback para autenticação JWT se não tiver token de reconexão

#### Teste 1.3: Heartbeat
- [ ] Envia `ping` a cada 30 segundos
- [ ] Recebe `pong` do servidor
- [ ] Mantém conexão viva

#### Teste 1.4: Eventos
- [ ] Escuta eventos: `welcome`, `auth_success`, `pong`, `error`
- [ ] Não escuta eventos inexistentes: `queue_update`, `game_started`, etc.

---

### ✅ 2. GameScreen.js

#### Teste 2.1: Seleção de Direção
- [ ] Exibe 5 opções de direção (1-5)
- [ ] Seleção funciona corretamente
- [ ] Visual indica direção selecionada

#### Teste 2.2: Seleção de Valor de Aposta
- [ ] Exibe 4 opções: R$ 1, 2, 5, 10
- [ ] Seleção funciona corretamente
- [ ] Visual indica valor selecionado
- [ ] Desabilita valores acima do saldo

#### Teste 2.3: Validação de Saldo
- [ ] Bloqueia chute se saldo insuficiente
- [ ] Exibe aviso de saldo insuficiente
- [ ] Permite chute se saldo suficiente

#### Teste 2.4: Chute via HTTP POST
- [ ] Envia POST `/api/games/shoot` com `direction` e `amount`
- [ ] Mostra loading durante requisição
- [ ] Trata resposta do servidor
- [ ] Atualiza saldo após chute bem-sucedido
- [ ] Exibe resultado (gol/defesa/gol de ouro)
- [ ] Feedback háptico funciona

#### Teste 2.5: Tratamento de Erros
- [ ] Trata erro de autenticação
- [ ] Trata erro de saldo insuficiente
- [ ] Trata erro de servidor
- [ ] Exibe mensagens de erro adequadas

---

### ✅ 3. GameService.js

#### Teste 3.1: Método shoot()
- [ ] Valida `direction` (1-5)
- [ ] Valida `amount` (1, 2, 5 ou 10)
- [ ] Envia requisição com token de autenticação
- [ ] Trata resposta padronizada do backend
- [ ] Retorna erro adequado em caso de falha

#### Teste 3.2: Formato de Requisição
- [ ] Body: `{ direction: number, amount: number }`
- [ ] Headers: `Authorization: Bearer <token>`
- [ ] Content-Type: `application/json`

#### Teste 3.3: Formato de Resposta
- [ ] Trata `{ success: true, data: {...} }`
- [ ] Trata `{ success: false, error: "..." }`
- [ ] Extrai dados corretamente

---

### ✅ 4. AuthService.js

#### Teste 4.1: Método updateUser()
- [ ] Atualiza estado `user` localmente
- [ ] Persiste dados no AsyncStorage
- [ ] Não faz chamada ao backend

---

## 🔄 FLUXO COMPLETO DE TESTE

### Cenário 1: Chute Bem-Sucedido (Gol)

1. Usuário autenticado com saldo suficiente
2. Seleciona direção 3 (Centro)
3. Seleciona valor R$ 1,00
4. Clica em "CHUTAR"
5. **Esperado:**
   - Loading aparece
   - Requisição POST `/api/games/shoot` enviada
   - Resposta: `{ success: true, data: { result: "goal", premio: 5, ... } }`
   - Saldo atualizado
   - Alert: "⚽ GOL! ⚽"
   - Último resultado exibido

### Cenário 2: Chute Bem-Sucedido (Gol de Ouro)

1. Usuário autenticado com saldo suficiente
2. Seleciona direção e valor
3. Clica em "CHUTAR"
4. **Esperado:**
   - Resposta: `{ success: true, data: { result: "goal", isGolDeOuro: true, premioGolDeOuro: 100, ... } }`
   - Alert: "🏆 GOL DE OURO! 🏆"
   - Prêmio total: R$ 105,00

### Cenário 3: Chute Falhado (Defesa)

1. Usuário autenticado com saldo suficiente
2. Seleciona direção e valor
3. Clica em "CHUTAR"
4. **Esperado:**
   - Resposta: `{ success: true, data: { result: "miss", premio: 0, ... } }`
   - Alert: "❌ Defesa!"
   - Saldo reduzido pelo valor da aposta

### Cenário 4: Saldo Insuficiente

1. Usuário autenticado com saldo R$ 0,50
2. Seleciona valor R$ 1,00
3. Clica em "CHUTAR"
4. **Esperado:**
   - Botão desabilitado
   - Aviso: "Saldo insuficiente. Você precisa de R$ 1,00"

### Cenário 5: Erro de Autenticação

1. Token expirado ou inválido
2. Tenta chutar
3. **Esperado:**
   - Resposta: `{ success: false, error: "Token inválido" }`
   - Alert: "Erro: Token inválido"
   - Redirecionamento para login (se implementado)

---

## 📊 VALIDAÇÃO DE COMPATIBILIDADE

### Endpoints Validados

| Endpoint | Método | Status | Observações |
|----------|--------|--------|-------------|
| `/api/games/shoot` | POST | ✅ | Parâmetros: `direction`, `amount` |
| `/ws` | WebSocket | ✅ | Autenticação via mensagem `auth` |

### Eventos WebSocket Validados

| Evento | Tipo | Status | Observações |
|--------|------|--------|-------------|
| `welcome` | Recebido | ✅ | Mensagem inicial |
| `auth` | Enviado | ✅ | Autenticação |
| `auth_success` | Recebido | ✅ | Autenticação bem-sucedida |
| `ping` | Enviado | ✅ | Heartbeat |
| `pong` | Recebido | ✅ | Resposta ao ping |

### Eventos Removidos (Não Existem)

| Evento | Status | Motivo |
|--------|--------|--------|
| `join_queue` | ❌ Removido | Não existe no backend |
| `leave_queue` | ❌ Removido | Não existe no backend |
| `kick` | ❌ Removido | Não existe no backend |
| `queue_update` | ❌ Removido | Não existe no backend |
| `game_started` | ❌ Removido | Não existe no backend |
| `game_ended` | ❌ Removido | Não existe no backend |

---

## ⚠️ PONTOS DE ATENÇÃO

1. **Token de Autenticação:** Verificar se token está sendo enviado corretamente
2. **Formato de Resposta:** Backend deve retornar formato padronizado
3. **Atualização de Saldo:** Verificar se saldo está sendo atualizado corretamente
4. **Tratamento de Erros:** Verificar se erros estão sendo tratados adequadamente
5. **Feedback Visual:** Verificar se feedbacks estão funcionando

---

## 🚀 PRÓXIMOS PASSOS APÓS TESTES

1. ✅ Validar todas as correções da Fase 1
2. ⏭️ Iniciar Fase 2 (PIX, Saldo, Histórico, etc.)
3. ⏭️ Corrigir problemas encontrados nos testes
4. ⏭️ Documentar resultados dos testes

---

**Status:** ✅ **PRONTO PARA TESTE**

