# 💰 INSTRUÇÕES PARA ADICIONAR SALDO - TESTES FINAIS

## 🎯 OBJETIVO
Adicionar saldo à sua conta para realizar os testes finais da página do jogo.

---

## 📋 OPÇÃO 1: VIA PÁGINA DE PAGAMENTOS (RECOMENDADO)

### **Passos:**
1. Acesse a página de pagamentos: `http://localhost:5173/pagamentos`
2. Selecione um valor de recarga (ex: R$ 50,00)
3. Clique em "Gerar PIX" ou "Criar Pagamento"
4. Complete o pagamento via PIX
5. Aguarde a confirmação (pode ser automática ou manual)

**Vantagens:**
- ✅ Fluxo real de pagamento
- ✅ Testa integração completa
- ✅ Valida sistema de pagamentos

**Desvantagens:**
- ⚠️ Requer pagamento real (ou ambiente de teste do Mercado Pago)

---

## 📋 OPÇÃO 2: VIA BANCO DE DADOS (DESENVOLVIMENTO)

### **Se você tem acesso ao banco de dados:**

#### **Via Supabase Dashboard:**
1. Acesse: https://supabase.com/dashboard
2. Navegue até a tabela `usuarios` (ou `users`)
3. Busque seu usuário pelo email
4. Edite o campo `saldo` e adicione o valor desejado (ex: 50.00)
5. Salve as alterações

#### **Via SQL (Supabase SQL Editor):**
```sql
-- Adicionar saldo ao seu usuário
-- Substitua 'seu-email@exemplo.com' pelo seu email
UPDATE usuarios 
SET saldo = saldo + 50.00 
WHERE email = 'seu-email@exemplo.com';

-- Verificar saldo atualizado
SELECT id, email, saldo 
FROM usuarios 
WHERE email = 'seu-email@exemplo.com';
```

---

## 📋 OPÇÃO 3: VIA API (SE DISPONÍVEL)

### **Se houver endpoint de teste:**

```bash
# Exemplo (ajustar conforme sua API)
curl -X POST http://localhost:3000/api/test/add-balance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{"amount": 50.00}'
```

---

## 🎯 VALOR RECOMENDADO PARA TESTES

**R$ 50,00** é um valor ideal porque:
- ✅ Permite vários testes (10+ chutes)
- ✅ Permite testar diferentes valores de aposta
- ✅ Permite testar cenários de saldo insuficiente
- ✅ Não é um valor muito alto

---

## ✅ VERIFICAÇÃO

Após adicionar saldo:

1. **Recarregue a página do jogo** (`/game`)
2. **Verifique no console** se aparece:
   ```
   💰 [GAMEFINAL] Saldo carregado: 50.00
   ```
3. **Verifique na tela** se o saldo aparece no header
4. **Tente fazer um chute** para confirmar que funciona

---

## 🚨 TROUBLESHOOTING

### **Saldo não aparece:**
- Verifique se o saldo foi realmente adicionado no banco
- Verifique o console do navegador por erros
- Verifique se está logado com o usuário correto
- Recarregue a página (F5)

### **Erro ao carregar saldo:**
- Verifique se o backend está rodando
- Verifique se `gameService.initialize()` está funcionando
- Verifique os logs do backend

---

**Criado em:** 2025-01-27  
**Status:** ✅ PRONTO PARA USO

