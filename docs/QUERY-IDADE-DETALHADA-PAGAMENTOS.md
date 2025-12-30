# 📊 QUERY: Idade Detalhada dos Pagamentos Pending

## 🎯 OBJETIVO

Verificar a idade exata dos pagamentos `pending` para identificar quais já deveriam ser marcados como `expired` (> 1 dia).

---

## 📋 QUERY SQL

Execute esta query no Supabase SQL Editor:

```sql
-- Verificar idade detalhada dos pagamentos pending
SELECT 
  id,
  payment_id,
  usuario_id,
  valor,
  status,
  created_at,
  NOW() as agora,
  EXTRACT(EPOCH FROM (NOW() - created_at))/86400 as age_days,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as age_hours,
  CASE 
    WHEN EXTRACT(EPOCH FROM (NOW() - created_at))/86400 > 1 THEN 'DEVERIA SER EXPIRED'
    ELSE 'Ainda válido (< 1 dia)'
  END as status_esperado
FROM pagamentos_pix
WHERE status = 'pending'
ORDER BY created_at ASC;
```

---

## 📊 INTERPRETAÇÃO DOS RESULTADOS

### **Colunas Explicadas:**

- **`id`**: ID interno do pagamento
- **`payment_id`**: ID do Mercado Pago
- **`usuario_id`**: ID do usuário
- **`valor`**: Valor do pagamento
- **`status`**: Status atual (deve ser `pending`)
- **`created_at`**: Data/hora de criação
- **`agora`**: Data/hora atual (para referência)
- **`age_days`**: Idade em dias (decimal)
- **`age_hours`**: Idade em horas (decimal)
- **`status_esperado`**: Indica se deveria ser expired ou ainda válido

---

## ✅ CRITÉRIOS DE VALIDAÇÃO

### **Se `age_days > 1` e `status = 'pending':**
- ⚠️ **Deveria ser marcado como expired** na próxima reconciliação
- ⚠️ Se não for marcado, verificar:
  1. Logs do Fly.io para erros na reconciliação
  2. Se o Mercado Pago retorna 404 (pagamento não encontrado)
  3. Se a reconciliação está rodando (a cada 60 segundos)

### **Se `age_days <= 1`:**
- ✅ **Ainda válido** - não será marcado como expired ainda
- ✅ Aguardar até completar 1 dia

---

## 🔍 PRÓXIMOS PASSOS

### **Após executar a query:**

1. **Se houver pagamentos com `age_days > 1`:**
   - Verificar logs do Fly.io: `fly logs -a goldeouro-backend-v2 | grep "RECON"`
   - Aguardar próxima reconciliação (a cada 60 segundos)
   - Verificar se são marcados como expired

2. **Se todos os pagamentos têm `age_days <= 1`:**
   - ✅ **Normal** - aguardar até completar 1 dia
   - Executar query novamente após 24 horas

3. **Se pagamentos não são marcados como expired após 1 dia:**
   - Verificar logs para erros
   - Verificar se Mercado Pago retorna 404
   - Verificar se reconciliação está rodando

---

## 📝 NOTAS IMPORTANTES

- A reconciliação roda **a cada 60 segundos**
- Pagamentos são marcados como expired apenas se:
  1. ✅ Têm mais de 1 dia (`age_days > 1`)
  2. ✅ Status é `pending`
  3. ✅ Mercado Pago retorna 404 (pagamento não encontrado)

- Se o Mercado Pago retornar outro status (não 404), o pagamento **não será** marcado como expired

---

**Query incluída no script:** `scripts/validar-pagamentos-expired.sql` (query #5)

