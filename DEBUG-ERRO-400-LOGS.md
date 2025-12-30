# 🔍 DEBUG - Erro 400 - Logs Adicionados

## Data: 2025-01-24

---

## 📋 LOGS ADICIONADOS PARA DEBUG

### 1. **No GameController (game.controller.js)**

**Antes de validar integridade:**
```javascript
console.log('🔍 [SHOOT] Validando integridade do lote:', {
  loteId: lote?.id,
  loteValor: lote?.valor,
  loteChutes: lote?.chutes?.length || 0,
  direction: finalDirection,
  amount: finalAmount,
  userId: req.user.userId
});
```

**Após validação:**
```javascript
console.log('✅ [SHOOT] Validação de integridade do lote passou');
```

**Em caso de erro:**
```javascript
console.error('❌ [SHOOT] Problema de integridade do lote:', integrityValidation.error);
console.error('❌ [SHOOT] Detalhes:', integrityValidation.details);
console.error('❌ [SHOOT] Lote completo:', JSON.stringify(lote, null, 2));
console.error('❌ [SHOOT] Dados do chute:', { direction: finalDirection, amount: finalAmount, userId: req.user.userId });
```

---

### 2. **No LoteIntegrityValidator (lote-integrity-validator.js)**

**Validação de estrutura:**
```javascript
console.log('🔍 [LOTE-VALIDATOR] Validando estrutura do lote:', {
  loteId: lote?.id,
  loteValor: lote?.valor,
  temChutes: Array.isArray(lote?.chutes),
  numChutes: lote?.chutes?.length || 0,
  temWinnerIndex: typeof lote?.winnerIndex === 'number'
});
```

**Validação de novo chute:**
```javascript
console.log('🔍 [LOTE-VALIDATOR] Validando novo chute:', {
  direction: shotData.direction,
  amount: shotData.amount,
  userId: shotData.userId
});
```

**Validação de consistência:**
```javascript
console.log('🔍 [LOTE-VALIDATOR] Validando consistência do lote');
```

---

## 🎯 O QUE VERIFICAR NOS LOGS

### Quando o erro 400 ocorrer, verifique:

1. **Se a estrutura do lote está válida:**
   - `loteId` existe?
   - `loteValor` existe?
   - `chutes` é um array?
   - `winnerIndex` é um número?

2. **Se o novo chute está válido:**
   - `direction` está em: TL, TR, C, BL, BR?
   - `amount` é um número válido?
   - `userId` existe?

3. **Se há problemas de consistência:**
   - Quais erros estão sendo retornados?
   - São erros relacionados a direções antigas? (devem ser ignorados)
   - São erros de estrutura? (devem ser reportados)

---

## 📊 FLUXO DE VALIDAÇÃO

```
1. GameController recebe request
   ↓
2. Normaliza direction e amount
   ↓
3. Valida direction (TL, TR, C, BL, BR)
   ↓
4. Valida amount (1, 2, 5, 10)
   ↓
5. Verifica saldo
   ↓
6. Obtém/cria lote
   ↓
7. Valida integridade do lote (LoteIntegrityValidator)
   ├─ Valida estrutura
   ├─ Valida novo chute
   └─ Valida consistência (ignora erros de direções antigas)
   ↓
8. Processa chute
```

---

## 🔧 PRÓXIMOS PASSOS

1. **Testar novamente** e verificar os logs no console do backend
2. **Identificar qual validação está falhando:**
   - Estrutura do lote?
   - Novo chute?
   - Consistência?
3. **Corrigir o problema específico** baseado nos logs

---

## 📝 NOTAS

- Todos os logs começam com `🔍`, `✅`, `❌` ou `⚠️` para fácil identificação
- Logs incluem contexto completo (lote, chute, dados)
- Logs de erro incluem detalhes completos para debug


