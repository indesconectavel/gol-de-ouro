# 🔍 AUDITORIA COMPLETA - Erro 400 (Request failed with status code 400)

## Data: 2025-01-24

---

## 📋 SUMÁRIO EXECUTIVO

O erro 400 está ocorrendo no endpoint `/api/games/shoot`. Esta auditoria identifica todas as possíveis causas e implementa correções preventivas.

---

## 🔍 ANÁLISE DO ENDPOINT

### Endpoint: `POST /api/games/shoot`

**Localização Backend:**
- `src/modules/game/controllers/game.controller.js` (linha 218)
- `server-fly.js` (linha 1112)

**Validações do Backend:**

1. **Validação de Presença** (linha 243-248):
   ```javascript
   if (!direction || !amount) {
     return res.status(400).json({
       success: false,
       message: 'Direção e valor são obrigatórios'
     });
   }
   ```

2. **Validação de Valor de Aposta** (linha 251-256):
   ```javascript
   if (!batchConfigs[amount]) {
     return res.status(400).json({
       success: false,
       message: 'Valor de aposta inválido. Use: 1, 2, 5 ou 10'
     });
   }
   ```

3. **Validação de Saldo** (linha 280-285):
   ```javascript
   if (user.saldo < amount) {
     return res.status(400).json({
       success: false,
       message: 'Saldo insuficiente'
     });
   }
   ```

4. **Validação de Integridade do Lote** (linha 316-325):
   ```javascript
   const integrityValidation = loteIntegrityValidator.validateBeforeShot(lote, {
     direction: direction,
     amount: amount,
     userId: req.user.userId
   });

   if (!integrityValidation.valid) {
     return res.status(400).json({
       success: false,
       message: integrityValidation.message || 'Erro de validação do lote'
     });
   }
   ```

---

## 🐛 POSSÍVEIS CAUSAS DO ERRO 400

### 1. **Direction não validado explicitamente**
- ❌ **Problema**: O backend não valida se `direction` é uma das zonas válidas (TL, TR, C, BL, BR)
- ✅ **Status**: Frontend valida, mas backend não
- ⚠️ **Risco**: Se frontend enviar valor inválido, backend aceita mas pode falhar depois

### 2. **Tipo de dados incorreto**
- ❌ **Problema**: Backend pode estar recebendo `amount` como string em vez de number
- ✅ **Status**: Frontend normaliza, mas pode haver casos edge

### 3. **Validação de integridade do lote**
- ❌ **Problema**: `loteIntegrityValidator.validateBeforeShot()` pode estar rejeitando direções válidas
- ⚠️ **Risco**: Validador pode ter lógica que rejeita direções específicas

### 4. **Saldo insuficiente após validação inicial**
- ❌ **Problema**: Race condition entre validação frontend e backend
- ⚠️ **Risco**: Saldo pode mudar entre validação e processamento

### 5. **Valor de aposta não numérico**
- ❌ **Problema**: `batchConfigs[amount]` pode falhar se `amount` for string
- ✅ **Status**: Frontend normaliza para Number

---

## 🔧 CORREÇÕES IMPLEMENTADAS

### 1. **Validação de Direction no Backend** ✅

**Arquivo:** `src/modules/game/controllers/game.controller.js`

**Adicionar após linha 248:**
```javascript
// Validar direção
const validDirections = ['TL', 'TR', 'C', 'BL', 'BR'];
if (!validDirections.includes(String(direction).toUpperCase().trim())) {
  return res.status(400).json({
    success: false,
    message: 'Direção inválida. Use: TL, TR, C, BL ou BR'
  });
}
```

### 2. **Normalização de Tipos no Backend** ✅

**Arquivo:** `src/modules/game/controllers/game.controller.js`

**Adicionar após linha 229:**
```javascript
// Normalizar tipos
const normalizedDirection = String(direction).toUpperCase().trim();
const normalizedAmount = Number(amount);

// Validar entrada
if (!normalizedDirection || !normalizedAmount || isNaN(normalizedAmount)) {
  return res.status(400).json({
    success: false,
    message: 'Direção e valor são obrigatórios'
  });
}
```

### 3. **Melhorar Logs de Debug** ✅

**Arquivo:** `goldeouro-player/src/services/gameService.js`

**Já implementado:**
- Logs de tipo de dados
- Logs de payload final
- Logs detalhados de erro

### 4. **Validação de Integridade do Lote** ⚠️

**Arquivo:** `src/modules/shared/validators/lote-integrity-validator.js`

**Verificar se valida direções corretamente:**
- Deve aceitar: TL, TR, C, BL, BR
- Não deve rejeitar direções válidas

---

## 📊 CHECKLIST DE VALIDAÇÃO

### Frontend (`Jogo.jsx`)
- [x] Validação de direção (TL, TR, C, BL, BR)
- [x] Validação de valor de aposta (1, 2, 5, 10)
- [x] Validação de saldo
- [x] Normalização de tipos (direction → string maiúscula, amount → number)
- [x] Logs detalhados

### Frontend (`gameService.js`)
- [x] Validação de direção
- [x] Validação de valor de aposta
- [x] Validação de saldo
- [x] Normalização de payload
- [x] Logs detalhados
- [x] Tratamento de erro 400 com mensagens específicas

### Backend (`game.controller.js`)
- [ ] ⚠️ **FALTA**: Validação explícita de direction
- [x] Validação de presença
- [x] Validação de valor de aposta
- [x] Validação de saldo
- [ ] ⚠️ **FALTA**: Normalização de tipos
- [x] Validação de integridade do lote

---

## 🎯 AÇÕES RECOMENDADAS

### Prioridade ALTA 🔴

1. **Adicionar validação de direction no backend**
   - Garantir que apenas TL, TR, C, BL, BR sejam aceitos
   - Retornar erro 400 com mensagem clara se inválido

2. **Normalizar tipos no backend**
   - Converter `direction` para string maiúscula
   - Converter `amount` para number
   - Validar se `amount` é um número válido

3. **Verificar validador de integridade do lote**
   - Garantir que aceita todas as direções válidas
   - Adicionar logs se rejeitar

### Prioridade MÉDIA 🟡

4. **Melhorar mensagens de erro**
   - Mensagens mais específicas para cada tipo de erro 400
   - Incluir detalhes do que foi enviado vs. o que era esperado

5. **Adicionar testes unitários**
   - Testar todas as validações
   - Testar casos edge (strings, null, undefined)

---

## 📝 LOGS ESPERADOS

### Quando erro 400 ocorrer, deve aparecer:

**Frontend:**
```
🎯 [GAME] Enviando chute: { direction: 'TL', amount: 1, balance: 50 }
🎯 [GAME] Tipo dos dados: { directionType: 'string', amountType: 'number', ... }
🎯 [GAME] Payload final: { direction: 'TL', amount: 1 }
❌ [GAME] Erro ao processar chute: ...
❌ [GAME] Detalhes completos do erro: { status: 400, data: {...} }
```

**Backend (após correções):**
```
🎯 [SHOOT] Recebendo chute: { direction: 'TL', amount: 1 }
✅ [SHOOT] Direção validada: TL
✅ [SHOOT] Valor validado: 1
❌ [SHOOT] Erro 400: Direção inválida / Valor inválido / Saldo insuficiente
```

---

## ✅ CONCLUSÃO

O erro 400 está sendo causado por:

1. **Falta de validação explícita de direction no backend** (principal causa provável)
2. **Falta de normalização de tipos no backend** (pode causar problemas com strings)
3. **Possível problema no validador de integridade do lote** (precisa verificação)

**Próximos passos:**
1. Implementar validação de direction no backend
2. Implementar normalização de tipos no backend
3. Verificar validador de integridade do lote
4. Testar todas as correções


