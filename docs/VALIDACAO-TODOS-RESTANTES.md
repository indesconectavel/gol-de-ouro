# ✅ VALIDAÇÃO DOS TODOS RESTANTES

## 📋 TODOS PENDENTES

1. ✅ **Validar que pagamentos antigos foram marcados como expired**
2. ✅ **Testar criação de PIX e validação do código copia e cola**

---

## 1️⃣ VALIDAÇÃO: Pagamentos Marcados como Expired

### **Objetivo:**
Validar que a lógica de reconciliação está marcando pagamentos antigos (mais de 1 dia, não encontrados no Mercado Pago) como `expired`.

### **Como Validar:**

#### **Opção 1: Via SQL (Supabase)**

Execute o script SQL em `scripts/validar-pagamentos-expired.sql` no Supabase SQL Editor:

```sql
-- Contar pagamentos expired
SELECT COUNT(*) as total_expired
FROM pagamentos_pix
WHERE status = 'expired';

-- Listar pagamentos expired recentes
SELECT 
  id,
  payment_id,
  usuario_id,
  valor,
  status,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (updated_at - created_at))/86400 as age_days
FROM pagamentos_pix
WHERE status = 'expired'
ORDER BY updated_at DESC
LIMIT 20;
```

**✅ Esperado:**
- Pagamentos com `status = 'expired'` existem
- `updated_at` mais recente que `created_at`
- `age_days` > 1 (pagamentos com mais de 1 dia)

---

#### **Opção 2: Via Logs do Fly.io**

Verificar logs do Fly.io para mensagens de reconciliação:

```bash
fly logs -a goldeouro-backend-v2 | grep "marcado como expirado"
```

**✅ Esperado:**
- Mensagens como: `✅ [RECON] Pagamento {payment_id} marcado como expirado (não encontrado no MP após {X} dias)`
- Mensagens aparecem periodicamente (a cada 60 segundos)

---

#### **Opção 3: Via API (Admin)**

Se houver endpoint admin para consultar pagamentos:

```bash
curl -H "x-admin-token: goldeouro123" \
  https://goldeouro-backend-v2.fly.dev/api/admin/payments?status=expired
```

---

### **Critérios de Sucesso:**

- ✅ Pagamentos com mais de 1 dia e erro 404 são marcados como `expired`
- ✅ Logs mostram mensagens de reconciliação funcionando
- ✅ Não há mais logs repetitivos de erros 404 para pagamentos antigos
- ✅ Performance melhorada (menos consultas repetidas)

---

## 2️⃣ TESTE: Criação de PIX e Validação do Código

### **Objetivo:**
Testar o fluxo completo de criação de PIX e validar que o código copia e cola está sendo retornado corretamente.

### **Como Testar:**

#### **Opção 1: Script Automatizado**

Execute o script Node.js:

```bash
node scripts/testar-criar-pix.js [email] [senha] [valor]
```

**Exemplo:**
```bash
node scripts/testar-criar-pix.js usuario@email.com senha123 10.00
```

**O script testa:**
1. ✅ Login do usuário
2. ✅ Criação de PIX
3. ✅ Validação de campos retornados:
   - `payment_id`
   - `qr_code`
   - `qr_code_base64`
   - `pix_copy_paste`
   - `expires_at`
4. ✅ Validação de formato do código PIX
5. ✅ Consulta de status do pagamento

---

#### **Opção 2: Via API Manual**

**1. Login:**
```bash
curl -X POST https://goldeouro-backend-v2.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@email.com","password":"senha123"}'
```

**2. Criar PIX (usar token do login):**
```bash
curl -X POST https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar \
  -H "Authorization: Bearer {TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"valor":10.00,"descricao":"Teste PIX"}'
```

**3. Validar resposta:**
```json
{
  "success": true,
  "data": {
    "payment_id": "468718642-...",
    "qr_code": "...",
    "qr_code_base64": "...",
    "pix_copy_paste": "00020126...",
    "expires_at": "2025-11-19T..."
  }
}
```

---

#### **Opção 3: Via Frontend (Mobile/Player)**

1. Fazer login
2. Navegar para criar PIX
3. Inserir valor
4. Verificar que código PIX aparece
5. Copiar código e validar formato

---

### **Critérios de Sucesso:**

- ✅ PIX criado com sucesso (status 201)
- ✅ `payment_id` presente na resposta
- ✅ `pix_copy_paste` presente e não nulo
- ✅ `qr_code` presente (ou `qr_code_base64`)
- ✅ Código PIX tem formato válido (começa com `00020` ou tem 50-500 caracteres)
- ✅ `expires_at` presente
- ✅ Status do pagamento pode ser consultado

---

## 📊 CHECKLIST DE VALIDAÇÃO COMPLETA

### **Validação 1: Pagamentos Expired**
- [ ] Executar script SQL no Supabase
- [ ] Verificar que existem pagamentos com `status = 'expired'`
- [ ] Verificar logs do Fly.io para mensagens de reconciliação
- [ ] Confirmar que pagamentos antigos estão sendo marcados corretamente

### **Validação 2: Criação de PIX**
- [ ] Executar script de teste automatizado
- [ ] Verificar que todos os campos estão presentes
- [ ] Validar formato do código PIX
- [ ] Testar consulta de status
- [ ] Testar via frontend (se aplicável)

---

## 🎯 RESULTADO ESPERADO

### **Após Validação:**

1. ✅ **Pagamentos Expired:**
   - Sistema marcando pagamentos antigos como `expired`
   - Logs mostrando reconciliação funcionando
   - Menos verbosidade nos logs

2. ✅ **Criação de PIX:**
   - PIX criado com sucesso
   - Código copia e cola presente e válido
   - QR Code disponível
   - Status pode ser consultado

---

## 📝 PRÓXIMOS PASSOS

Após validar ambos os TODOs:

1. ✅ Marcar TODOs como concluídos
2. ✅ Documentar resultados da validação
3. ✅ Criar relatório final se necessário

---

## 🔗 ARQUIVOS RELACIONADOS

- `scripts/validar-pagamentos-expired.sql` - Script SQL para validar pagamentos expired
- `scripts/testar-criar-pix.js` - Script Node.js para testar criação de PIX
- `server-fly.js` - Lógica de reconciliação (linhas 592-704)
- `controllers/paymentController.js` - Controller de pagamentos PIX

