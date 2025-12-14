# 🚀 INICIAR TESTES AGORA - GUIA RÁPIDO

**Status:** ✅ Sistema 100% configurado e pronto!

---

## ⚡ INÍCIO RÁPIDO (3 PASSOS)

### **1. Iniciar o App**

```bash
cd goldeouro-mobile
npx expo start
```

### **2. Escolher Dispositivo**

Quando o Expo iniciar, você verá um QR code e opções:

- **📱 Expo Go (Recomendado para testes rápidos):**
  - Instale Expo Go no seu celular (Play Store / App Store)
  - Escaneie o QR code exibido no terminal
  - O app abrirá automaticamente

- **🤖 Emulador Android:**
  - Pressione `a` no terminal do Expo
  - Requer Android Studio instalado

- **🍎 Emulador iOS:**
  - Pressione `i` no terminal do Expo
  - Requer Xcode instalado (apenas macOS)

- **🌐 Web:**
  - Pressione `w` no terminal do Expo
  - Abrirá no navegador padrão

### **3. Testar Fluxo Completo**

Siga esta sequência no app:

1. **Login/Registro**
   - Crie uma conta ou faça login
   - Verifique se o token é salvo

2. **Criar Pagamento PIX**
   - Vá para a tela de depósito
   - Crie um pagamento PIX (valor mínimo: R$ 1,00)
   - Verifique se o QR code é exibido
   - Copie o código PIX ou escaneie

3. **Simular Pagamento (Sandbox)**
   - Use o sandbox do Mercado Pago para simular pagamento
   - Ou faça um pagamento real de teste (pequeno valor)

4. **Verificar Webhook**
   - O webhook deve processar automaticamente
   - Verifique se o saldo foi creditado
   - Verifique logs do backend

5. **Entrar na Fila**
   - Vá para a tela de jogo
   - Clique em "Entrar na Fila"
   - Verifique se um lote foi criado

6. **Realizar Chute**
   - Quando for sua vez, escolha direção e valor
   - Execute o chute
   - Verifique animação e resultado

7. **Verificar Premiação**
   - Se ganhou, verifique se reward foi criado
   - Verifique se saldo foi atualizado
   - Verifique transação na tabela `transacoes`

---

## 🔍 VERIFICAR SE ESTÁ FUNCIONANDO

### **Backend Online?**

```bash
curl https://goldeouro-backend-v2.fly.dev/health
```

**Resposta esperada:** `{"status":"ok"}` ou similar

### **Supabase Acessível?**

Os testes já foram executados e confirmaram:
- ✅ Conexão estabelecida
- ✅ Tabelas V19 existem
- ✅ RPCs funcionando

### **Endpoints Funcionando?**

```bash
# Testar endpoint de health
curl https://goldeouro-backend-v2.fly.dev/health

# Testar endpoint protegido (deve retornar 401)
curl -X POST https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar
```

---

## 📊 MONITORAR LOGS

### **Logs do Backend**

Se o backend estiver rodando localmente:

```bash
tail -f logs/app.log
```

### **Logs do Supabase**

Acesse o Supabase Dashboard:
- https://supabase.com/dashboard/project/gayopagjdrkcmkirmfvy/logs

### **Logs de Validação**

```bash
Get-ChildItem logs/v19/validacao/*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 50
```

---

## 🐛 PROBLEMAS COMUNS

### **App não conecta ao backend**

**Solução:**
1. Verifique se `BACKEND_URL` está correto no `app.json`
2. Verifique se o backend está online
3. Verifique CORS no backend

### **Erro ao criar PIX**

**Solução:**
1. Verifique se `MERCADO_PAGO_ACCESS_TOKEN` está configurado
2. Verifique logs do backend
3. Verifique se webhook URL está correta

### **Saldo não atualiza**

**Solução:**
1. Verifique se webhook foi processado
2. Verifique tabela `webhook_events` no Supabase
3. Verifique tabela `transacoes` no Supabase
4. Verifique logs do backend

### **Chute não funciona**

**Solução:**
1. Verifique se está na fila
2. Verifique se lote foi criado
3. Verifique logs do backend
4. Verifique RPC `rpc_get_or_create_lote`

---

## ✅ CHECKLIST DE TESTES

Use este checklist durante os testes:

- [ ] App inicia sem erros
- [ ] Login/Registro funciona
- [ ] Criação de PIX funciona
- [ ] QR code PIX é exibido
- [ ] Webhook processa pagamento
- [ ] Saldo atualiza após PIX
- [ ] Entrar na fila funciona
- [ ] Lote é criado corretamente
- [ ] Chute funciona
- [ ] Animação é exibida
- [ ] Resultado é processado
- [ ] Reward é criado (se ganhou)
- [ ] Saldo atualiza após premiação
- [ ] Transações aparecem no histórico

---

## 🎯 PRÓXIMOS PASSOS APÓS TESTES

1. **Se tudo funcionar:**
   - ✅ Sistema pronto para produção!
   - ✅ Pode iniciar testes com usuários reais
   - ✅ Monitorar métricas e logs

2. **Se houver problemas:**
   - 📋 Documentar o problema
   - 🔍 Verificar logs
   - 🐛 Corrigir e re-testar
   - ✅ Validar novamente

---

## 📞 SUPORTE

Se encontrar problemas:

1. **Verificar logs:**
   - Backend: `logs/app.log`
   - Validação: `logs/v19/validacao/`
   - Supabase Dashboard: Logs do projeto

2. **Documentação:**
   - `automation/RESUMO-CONFIGURACAO-PRODUCAO.md`
   - `automation/GUIA-VALIDACAO-FLUXO-JOGADOR.md`
   - `docs/GUIA-PRODUCAO-V19.md`

3. **Re-executar validação:**
   ```bash
   cd automation
   node validar_fluxo_jogador_v19.js
   ```

---

**Boa sorte com os testes! 🚀**

**Última atualização:** 2025-01-12  
**Versão:** V19

