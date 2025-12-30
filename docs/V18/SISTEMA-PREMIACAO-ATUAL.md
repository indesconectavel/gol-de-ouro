# 🏆 V18 SISTEMA DE PREMIAÇÃO ATUAL - ANÁLISE COMPLETA
## Data: 2025-12-05

---

## 💰 COMO O PRÊMIO É CALCULADO HOJE

### Prêmio Normal

- **Valor:** R$ 5,00 fixo
- **Condição:** Se `shotIndex === winnerIndex` (gol marcado)
- **Independente:** Do valor apostado (R$1, R$2, R$5 ou R$10)

### Gol de Ouro

- **Valor:** R$ 100,00 adicional
- **Condição:** A cada 1000 chutes globais (`contadorChutesGlobal % 1000 === 0`)
- **Acumulativo:** Com prêmio normal (total = R$105,00)

### Cálculo no Código

```javascript
let premio = 0;
let premioGolDeOuro = 0;

if (isGoal) {
  premio = 5.00; // Prêmio normal fixo
  
  if (isGolDeOuro) {
    premioGolDeOuro = 100.00; // Gol de Ouro adicional
  }
}
```

---

## 📦 É BASEADO EM LOTES?

### Sim, Totalmente Baseado em Lotes

- **Sistema:** LOTE_MODERNO
- **Lógica:** Um vencedor por lote
- **Prêmio:** Creditado quando gol é marcado no lote

### Processo

1. Lote criado com `winnerIndex` aleatório
2. Chutes são processados sequencialmente
3. Quando `shotIndex === winnerIndex` → gol
4. Prêmio é creditado imediatamente
5. Lote é fechado

---

## 📊 É BASEADO NA ORDEM?

### Sim, Baseado na Ordem do Chute

- **Índice:** Posição do chute no array (`shotIndex`)
- **Comparação:** `shotIndex === winnerIndex`
- **Resultado:** Gol apenas se índices coincidirem

### Exemplo

- Lote com `winnerIndex = 3`
- Chute 0 → `miss`
- Chute 1 → `miss`
- Chute 2 → `miss`
- Chute 3 → `goal` ✅ (prêmio creditado)
- Chutes 4-9 → Não processados (lote fechado)

---

## 👤 É BASEADO NO USUÁRIO QUE ACERTOU?

### Sim, Usuário que Fez o Chute Vencedor

- **Identificação:** `req.user.userId` do chute vencedor
- **Crédito:** Prêmio creditado para esse usuário
- **Processo:** Via `FinancialService.addBalance(userId, premio)`

### Código

```javascript
if (isGoal) {
  // Creditar prêmio ao usuário que fez o gol
  await FinancialService.addBalance(req.user.userId, premio + premioGolDeOuro, {
    description: `Prêmio do lote ${lote.id}`,
    referenceId: lote.id,
    referenceType: 'lote'
  });
}
```

---

## 🤖 O BACKEND GERA DISTRIBUIÇÃO AUTOMÁTICA?

### Sim, Distribuição Automática

- **Função:** `FinancialService.addBalance()`
- **Processo:** ACID via RPC `rpc_add_balance`
- **Garantia:** Transação atômica no banco

### Fluxo

1. Gol detectado → `isGoal = true`
2. Prêmio calculado → `premio + premioGolDeOuro`
3. RPC chamado → `rpc_add_balance(userId, valor)`
4. Transação registrada → Tabela `transacoes`
5. Saldo atualizado → Tabela `usuarios`

---

## 📍 EXISTE RASTREAMENTO DO GANHADOR?

### Sim, Rastreamento Completo

1. **Tabela `chutes`:**
   - Campo `resultado: 'goal'`
   - Campo `premio` e `premio_gol_de_ouro`
   - Campo `usuario_id` identifica ganhador

2. **Tabela `lotes`:**
   - Campo `status: 'finalizado'`
   - Campo `premio_total` soma dos prêmios

3. **Tabela `transacoes`:**
   - Transação de crédito registrada
   - Campo `descricao` identifica origem
   - Campo `referencia_id` aponta para lote

### Consultas de Rastreamento

```sql
-- Ganhador de um lote
SELECT c.usuario_id, c.premio, c.premio_gol_de_ouro
FROM chutes c
WHERE c.lote_id = 'lote_xxx' AND c.resultado = 'goal';

-- Histórico de prêmios de um usuário
SELECT * FROM transacoes
WHERE usuario_id = 'xxx' AND tipo = 'credito'
ORDER BY created_at DESC;
```

---

## 🎁 EXISTEM PREMIAÇÕES MÚLTIPLAS?

### Não, Um Vencedor por Lote

- **Regra:** Primeiro gol fecha o lote
- **Comportamento:** Chutes subsequentes não são processados
- **Exceção:** Gol de Ouro pode ocorrer junto com prêmio normal

### Premiações Possíveis

1. **Prêmio Normal:** R$ 5,00 (se gol)
2. **Gol de Ouro:** R$ 100,00 (se contador % 1000 === 0)
3. **Total Máximo:** R$ 105,00 por chute vencedor

---

## 💾 ONDE ESTÁ REGISTRADO NO SUPABASE

### Tabela `chutes`

```sql
CREATE TABLE chutes (
  id SERIAL PRIMARY KEY,
  usuario_id UUID,
  lote_id VARCHAR(100),
  resultado VARCHAR(20), -- 'goal' ou 'miss'
  premio DECIMAL(10,2), -- R$ 5,00
  premio_gol_de_ouro DECIMAL(10,2), -- R$ 100,00
  is_gol_de_ouro BOOLEAN,
  ...
);
```

### Tabela `transacoes`

```sql
CREATE TABLE transacoes (
  id UUID PRIMARY KEY,
  usuario_id UUID,
  tipo VARCHAR(20), -- 'credito'
  valor DECIMAL(10,2), -- Valor do prêmio
  descricao TEXT, -- "Prêmio do lote xxx"
  referencia_id VARCHAR(100), -- ID do lote
  ...
);
```

### Tabela `lotes`

```sql
CREATE TABLE lotes (
  id VARCHAR(100) PRIMARY KEY,
  status VARCHAR(20), -- 'finalizado'
  premio_total DECIMAL(10,2), -- Soma dos prêmios
  ...
);
```

---

## 📊 RESUMO DO SISTEMA DE PREMIAÇÃO

### Fluxo Completo

```
1. Chute processado → shotIndex calculado
2. Comparação → shotIndex === winnerIndex?
3. Se gol → premio = 5.00
4. Se gol de ouro → premioGolDeOuro = 100.00
5. Crédito → FinancialService.addBalance()
6. Registro → Tabela transacoes
7. Atualização → Tabela chutes (premio)
8. Fechamento → Lote marcado como finalizado
```

### Valores Fixos

- **Prêmio Normal:** R$ 5,00
- **Gol de Ouro:** R$ 100,00
- **Total Máximo:** R$ 105,00

### Características

- ✅ Automático
- ✅ ACID (transações atômicas)
- ✅ Rastreável
- ✅ Um vencedor por lote
- ✅ Baseado em ordem do chute

---

**Gerado em:** 2025-12-05T00:30:00Z  
**Versão:** V18.0.0

