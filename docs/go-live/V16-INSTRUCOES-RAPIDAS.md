# 🚀 V16 INSTRUÇÕES RÁPIDAS - ADICIONAR SALDO

## ⚠️ PROBLEMA: Constraint `transacoes_tipo_check`

O valor `'credito'` não é permitido. Precisa descobrir o valor correto.

## ✅ SOLUÇÃO RÁPIDA (3 passos)

### PASSO 1: Verificar valores permitidos
Execute no SQL Editor:
```sql
SELECT DISTINCT tipo FROM transacoes LIMIT 10;
```

### PASSO 2: Executar SQL com valor correto
Substitua `'deposito'` pelo valor encontrado no PASSO 1:

```sql
BEGIN;

WITH u AS (
  SELECT id, saldo FROM usuarios 
  WHERE email = 'test_v16_diag_1764865077736@example.com' FOR UPDATE
)
UPDATE usuarios SET saldo = (u.saldo + 50.00) FROM u WHERE usuarios.id = u.id;

INSERT INTO transacoes(id, usuario_id, tipo, valor, saldo_anterior, saldo_posterior, descricao, created_at)
SELECT gen_random_uuid(), u.id, 'deposito', 50.00, u.saldo, (u.saldo + 50.00), 'Saldo de teste V16+', now()
FROM usuarios u WHERE u.email = 'test_v16_diag_1764865077736@example.com';

COMMIT;
```

### PASSO 3: Verificar
```sql
SELECT id, email, saldo FROM usuarios WHERE email = 'test_v16_diag_1764865077736@example.com';
```

## 🎯 VALORES PROVÁVEIS

Se não houver transações existentes, tente nesta ordem:
1. `'deposito'` (mais provável)
2. `'deposit'`
3. `'credito'`
4. `'credit'`

## ✅ APÓS ADICIONAR SALDO

```bash
node scripts/v16-revalidacao.js
```

