# 🎯 V18 SISTEMA DE CHUTE ATUAL - ANÁLISE COMPLETA
## Data: 2025-12-05

---

## 🎮 DIRETIONS PERMITIDAS

### Valores Válidos
- `TL` - Top Left (Superior Esquerda)
- `TR` - Top Right (Superior Direita)
- `C` - Center (Centro)
- `BL` - Bottom Left (Inferior Esquerda)
- `BR` - Bottom Right (Inferior Direita)

### Validação
- **Validador:** `LoteIntegrityValidator.validateShots()`
- **Verifica:** Se direção está na lista válida
- **Erro:** Se direção inválida, retorna erro

---

## ⚽ COMO É CALCULADO O GOL

### Sistema Baseado em Índice

**Lógica Principal:**
```javascript
const shotIndex = lote.chutes.length;
const isGoal = shotIndex === lote.winnerIndex;
const result = isGoal ? 'goal' : 'miss';
```

### Processo

1. **Criação do Lote:**
   - `winnerIndex` é gerado aleatoriamente: `crypto.randomInt(0, config.size)`
   - Armazenado no lote e no banco

2. **Processamento do Chute:**
   - `shotIndex` = posição do chute no array (0-based)
   - Comparação: `shotIndex === winnerIndex`
   - Se igual → gol, senão → erro

### Exemplo

- Lote criado com `winnerIndex = 5`
- Chutes 0-4 → `miss`
- Chute 5 → `goal` ✅
- Chutes 6-9 → `miss` (se lote não fechou antes)

---

## 🎲 A IA USA RANDOM OU SEED?

### Random na Criação

- **Função:** `crypto.randomInt(0, config.size)`
- **Quando:** Apenas na criação do lote
- **Resultado:** `winnerIndex` pré-definido

### Não Usa Random por Chute

- **Não há:** Simulação física ou probabilidade
- **Não há:** Seed para cada chute
- **Usa:** Comparação direta de índices

### Segurança

- ⚠️ **Risco:** `winnerIndex` é conhecido no backend
- ⚠️ **Risco:** Se alguém souber o índice, pode prever o gol
- ✅ **Mitigação:** Índice é gerado aleatoriamente e não exposto ao frontend

---

## 🤝 O QUE ACONTECE COM EMPATE

### Não Aplicável

- **Sistema:** Um vencedor por lote
- **Lógica:** Primeiro gol fecha o lote
- **Não há:** Múltiplos vencedores ou empate

### Comportamento

- Se gol no chute 3 → lote fecha imediatamente
- Chutes 4-9 não são processados (lote já fechado)
- Validação impede chutes em lote fechado

---

## ✅ COMO A ENGINE VALIDA ACERTO/ERRO

### Validação Pré-Chute

**Função:** `LoteIntegrityValidator.validateBeforeShot()`

**Verifica:**
- Estrutura do lote
- Configuração do lote
- Índice do vencedor
- Chutes existentes
- Dados do novo chute

**Se Falhar:** Retorna erro 400, chute não é processado

### Validação Pós-Chute

**Função:** `LoteIntegrityValidator.validateAfterShot()`

**Verifica:**
- Resultado do chute
- Consistência dos dados
- Integridade do lote

**Se Falhar:** Chute é revertido do lote

### Lógica de Validação

```javascript
const expectedResult = lote.chutes.length - 1 === lote.winnerIndex ? 'goal' : 'miss';
if (shotResult.result !== expectedResult) {
  return { valid: false, error: 'Resultado incorreto' };
}
```

---

## 🔄 SISTEMA DE TENTATIVAS

### Não Há Limite

- **Usuário pode:** Chutar múltiplas vezes no mesmo lote
- **Validação:** Apenas saldo suficiente
- **Regra:** Não há restrição de tentativas

### Comportamento

- Usuário pode chutar 10 vezes no mesmo lote
- Cada chute consome saldo
- Cada chute tem chance de gol (baseado no índice)

---

## 🔒 SEGURANÇA CONTRA FRAUDE

### Proteções Implementadas

1. ✅ **Validação de Integridade:**
   - `LoteIntegrityValidator` valida antes e depois
   - Previne manipulação de dados

2. ✅ **Verificação de Saldo:**
   - Saldo é verificado antes do chute
   - Decrementado via `FinancialService.deductBalance()`

3. ✅ **Persistência no Banco:**
   - Chutes são salvos na tabela `chutes`
   - Lotes são atualizados no banco

4. ✅ **Validação de Token:**
   - Autenticação JWT obrigatória
   - Usuário identificado via token

### Vulnerabilidades Identificadas

1. ⚠️ **WinnerIndex Conhecido:**
   - Backend conhece `winnerIndex`
   - Se exposto, permite previsão

2. ⚠️ **Estado em Memória:**
   - Lotes em memória podem ser manipulados
   - Divergência entre memória e banco

3. ⚠️ **Sem Rate Limiting:**
   - Não há limite de chutes por segundo
   - Possível abuso de requisições

---

## 📊 FLUXO COMPLETO DO CHUTE

```
1. Usuário envia chute → POST /api/games/shoot
2. Validação de autenticação → JWT token
3. Validação de saldo → Verifica saldo suficiente
4. Obter/criar lote → getOrCreateLoteByValue()
5. Validação pré-chute → validateBeforeShot()
6. Calcular resultado → shotIndex === winnerIndex
7. Calcular prêmio → R$5 se gol, R$100 se gol de ouro
8. Adicionar chute ao lote → lote.chutes.push()
9. Salvar chute no banco → INSERT INTO chutes
10. Atualizar lote no banco → updateLoteAfterShot()
11. Validar pós-chute → validateAfterShot()
12. Creditar prêmio → FinancialService.addBalance()
13. Debitar aposta → FinancialService.deductBalance()
14. Verificar fechamento → Se completo, fecha lote
15. Broadcast WebSocket → Evento de chute/lote
16. Retornar resposta → JSON com resultado
```

---

## 🎯 QUERIES POR CHUTE

### Queries Executadas

1. **SELECT usuario** → Verificar saldo
2. **SELECT lote** → Obter/criar lote (via RPC)
3. **INSERT chute** → Salvar chute
4. **UPDATE lote** → Atualizar lote (via RPC)
5. **RPC add_balance** → Creditar prêmio (se gol)
6. **RPC deduct_balance** → Debitar aposta
7. **INSERT transacao** → Registrar transação (via RPC)

**Total:** ~7 queries por chute

---

**Gerado em:** 2025-12-05T00:30:00Z  
**Versão:** V18.0.0

