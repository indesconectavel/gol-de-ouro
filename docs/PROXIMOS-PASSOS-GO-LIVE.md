# 🚀 PRÓXIMOS PASSOS - GO-LIVE FINAL
## Sistema Gol de Ouro | Data: 2025-11-25

---

## 📋 RESUMO DO STATUS ATUAL

### **✅ Concluído:**
- ✅ Auditoria completa realizada
- ✅ 6 correções críticas aplicadas
- ✅ Scripts de validação criados
- ✅ Relatórios gerados

### **⚠️ Pendente:**
- ⚠️ Deploy das correções em produção
- ⚠️ Testes manuais em produção
- ⚠️ Validação final dos sistemas

---

## 🎯 PASSO 1: DEPLOY DAS CORREÇÕES

### **1.1 Verificar Alterações Locais**

```bash
# Verificar status do git
git status

# Verificar arquivos modificados
git diff --name-only
```

**Arquivos que devem estar modificados:**
- `middlewares/authMiddleware.js`
- `src/websocket.js`
- `controllers/paymentController.js`
- `controllers/adminController.js`
- `server-fly.js`

### **1.2 Commit das Correções**

```bash
# Adicionar arquivos modificados
git add middlewares/authMiddleware.js
git add src/websocket.js
git add controllers/paymentController.js
git add controllers/adminController.js
git add server-fly.js

# Commit
git commit -m "fix: Correções críticas pós-auditoria Agent Browser

- Token inválido retorna 401
- WebSocket autenticação com retry
- PIX QR code com múltiplas tentativas
- Admin chutes corrigido
- CORS mais restritivo
- Handler 404 melhorado"
```

### **1.3 Deploy no Fly.io**

```bash
# Fazer deploy
flyctl deploy --app goldeouro-backend-v2

# Verificar status
flyctl status --app goldeouro-backend-v2

# Verificar logs
flyctl logs --app goldeouro-backend-v2
```

### **1.4 Validar Deploy**

```bash
# Health check
curl https://goldeouro-backend-v2.fly.dev/health

# Deve retornar:
# {"success":true,"status":"ok","timestamp":"...","data":{...}}
```

**✅ Checklist Deploy:**
- [ ] Arquivos commitados
- [ ] Deploy executado com sucesso
- [ ] Servidor iniciou corretamente
- [ ] Health check responde OK
- [ ] Logs sem erros críticos

---

## 🧪 PASSO 2: TESTES MANUAIS EM PRODUÇÃO

### **2.1 Teste: PIX com Mercado Pago Real**

**Objetivo:** Validar que PIX retorna QR code após correções

**Passos:**
1. Criar usuário de teste em produção:
   ```bash
   curl -X POST https://goldeouro-backend-v2.fly.dev/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"teste_pix@example.com","password":"Test123!@#","username":"testepix"}'
   ```

2. Fazer login:
   ```bash
   curl -X POST https://goldeouro-backend-v2.fly.dev/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"teste_pix@example.com","password":"Test123!@#"}'
   ```

3. Criar PIX de R$ 1,00:
   ```bash
   curl -X POST https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer [TOKEN_AQUI]" \
     -d '{"valor":1.00,"descricao":"Teste Go-Live"}'
   ```

4. **Validar Resposta:**
   - ✅ Deve conter `payment_id`
   - ✅ Deve conter `qr_code` OU `pix_copy_paste` OU `init_point`
   - ✅ Deve conter `expires_at`

5. **Se QR code não vier imediatamente:**
   - Aguardar alguns segundos
   - Consultar status do pagamento
   - Verificar se QR code foi atualizado

**✅ Checklist PIX:**
- [ ] PIX criado com sucesso
- [ ] QR code OU copy-paste presente na resposta
- [ ] QR code pode ser usado para pagamento
- [ ] Status do pagamento funciona

---

### **2.2 Teste: WebSocket com Usuário Real**

**Objetivo:** Validar que autenticação WebSocket funciona após correções

**Passos:**
1. Criar usuário de teste (ou usar o mesmo do teste PIX)

2. **Aguardar 5 segundos** após criar usuário (para garantir propagação)

3. Conectar ao WebSocket:
   ```javascript
   // Usar ferramenta como wscat ou criar script Node.js
   const WebSocket = require('ws');
   const ws = new WebSocket('wss://goldeouro-backend-v2.fly.dev');
   
   ws.on('open', () => {
     console.log('Conectado');
   });
   
   ws.on('message', (data) => {
     const message = JSON.parse(data.toString());
     console.log('Mensagem recebida:', message);
     
     if (message.type === 'welcome') {
       // Enviar autenticação
       ws.send(JSON.stringify({
         type: 'auth',
         token: '[TOKEN_JWT_AQUI]'
       }));
     }
     
     if (message.type === 'auth_success') {
       console.log('✅ Autenticação bem-sucedida!');
     }
     
     if (message.type === 'auth_error') {
       console.log('❌ Erro de autenticação:', message.message);
     }
   });
   ```

4. **Validar:**
   - ✅ Evento `welcome` recebido
   - ✅ Autenticação bem-sucedida (`auth_success`)
   - ✅ Não recebe `auth_error` após retry

**✅ Checklist WebSocket:**
- [ ] Conexão estabelecida
- [ ] Evento welcome recebido
- [ ] Autenticação bem-sucedida
- [ ] Não há erro após retry

---

### **2.3 Teste: Admin Chutes com Dados Reais**

**Objetivo:** Validar que Admin não retorna mais erro 500

**Passos:**
1. Fazer login admin:
   ```bash
   curl -X GET https://goldeouro-backend-v2.fly.dev/api/admin/stats \
     -H "x-admin-token: goldeouro123"
   ```

2. Listar chutes recentes:
   ```bash
   curl -X GET "https://goldeouro-backend-v2.fly.dev/api/admin/recent-shots?limit=10" \
     -H "x-admin-token: goldeouro123"
   ```

3. **Validar Resposta:**
   - ✅ Status 200 (não 500)
   - ✅ Retorna array de chutes (mesmo que vazio)
   - ✅ Cada chute tem `direcao` e `valor_aposta`
   - ✅ Não há referência à coluna `zona`

**✅ Checklist Admin:**
- [ ] Login admin funciona
- [ ] Lista de chutes retorna 200
- [ ] Dados estão corretos (direcao, valor_aposta)
- [ ] Não há erro 500

---

### **2.4 Teste: Token Inválido Retorna 401**

**Objetivo:** Validar correção de segurança

**Passos:**
1. Tentar acessar rota protegida com token inválido:
   ```bash
   curl -X GET https://goldeouro-backend-v2.fly.dev/api/user/profile \
     -H "Authorization: Bearer token_invalido_12345"
   ```

2. **Validar Resposta:**
   - ✅ Status 401 (não 404 ou 403)
   - ✅ Mensagem de erro clara
   - ✅ Formato JSON padronizado

**✅ Checklist Token:**
- [ ] Token inválido retorna 401
- [ ] Mensagem de erro clara
- [ ] Formato padronizado

---

## ✅ PASSO 3: VALIDAÇÃO FINAL

### **3.1 Executar Script de Validação**

```bash
# Executar script de validação
node scripts/validacao-go-live.js

# Verificar resultados
cat docs/VALIDACAO-GO-LIVE-RESULTADOS.json
```

### **3.2 Validar Todos os Sistemas**

**Checklist Completo:**

#### **Autenticação:**
- [ ] Registro funciona
- [ ] Login funciona
- [ ] Token inválido retorna 401
- [ ] Token expirado retorna 401
- [ ] Rotas protegidas funcionam

#### **PIX:**
- [ ] Criação de PIX funciona
- [ ] QR code é retornado
- [ ] Status de PIX funciona
- [ ] Webhook funciona (se possível testar)
- [ ] Extrato funciona

#### **WebSocket:**
- [ ] Conexão funciona
- [ ] Autenticação funciona
- [ ] Heartbeat funciona
- [ ] Reconexão funciona

#### **Jogo:**
- [ ] Chute funciona (com saldo)
- [ ] Histórico funciona
- [ ] Validação de saldo funciona

#### **Admin:**
- [ ] Login admin funciona
- [ ] Dashboard funciona
- [ ] Lista de usuários funciona
- [ ] Lista de chutes funciona
- [ ] Lista de transações funciona
- [ ] Fix-expired-pix funciona

#### **Segurança:**
- [ ] CORS funciona corretamente
- [ ] Rate limiting funciona
- [ ] Headers de segurança presentes
- [ ] JSON inválido é rejeitado

---

## 🎯 PASSO 4: GO-LIVE

### **4.1 Checklist Final Antes do Go-Live**

**Infraestrutura:**
- [ ] Servidor rodando em produção
- [ ] Banco de dados conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Mercado Pago configurado
- [ ] WebSocket funcionando

**Funcionalidades Críticas:**
- [ ] Autenticação funcionando
- [ ] PIX funcionando
- [ ] WebSocket funcionando
- [ ] Jogo funcionando
- [ ] Admin funcionando

**Segurança:**
- [ ] Headers de segurança configurados
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Tokens retornam 401 quando inválidos

**Monitoramento:**
- [ ] Logs funcionando
- [ ] Health check funcionando
- [ ] Métricas disponíveis

### **4.2 Aprovação para Go-Live**

**Critérios de Aprovação:**
- ✅ Todos os testes manuais passaram
- ✅ Nenhum erro crítico nos logs
- ✅ Performance aceitável
- ✅ Segurança validada

**Status:** ⚠️ **AGUARDANDO TESTES MANUAIS**

---

## 📊 PASSO 5: MONITORAMENTO PÓS GO-LIVE

### **5.1 Monitorar Primeiras 24 Horas**

**Métricas a Monitorar:**
- Taxa de erro (deve ser < 1%)
- Latência média (deve ser < 500ms)
- Taxa de sucesso de PIX
- Taxa de sucesso de WebSocket
- Uso de recursos (CPU, memória)

**Logs a Verificar:**
- Erros 500
- Erros de autenticação
- Erros de PIX
- Erros de WebSocket
- Warnings importantes

### **5.2 Ações Corretivas**

**Se encontrar problemas:**
1. Verificar logs detalhados
2. Identificar causa raiz
3. Aplicar correção
4. Validar correção
5. Monitorar novamente

---

## 📝 RESUMO DOS PRÓXIMOS PASSOS

### **Imediato (Agora):**
1. ✅ Fazer commit das correções
2. ✅ Fazer deploy no Fly.io
3. ✅ Validar deploy

### **Curto Prazo (Próximas 2 horas):**
4. ✅ Testar PIX com Mercado Pago real
5. ✅ Testar WebSocket com usuário real
6. ✅ Testar Admin chutes
7. ✅ Executar script de validação

### **Antes do Go-Live:**
8. ✅ Validar todos os sistemas
9. ✅ Preencher checklist final
10. ✅ Aprovar Go-Live

### **Pós Go-Live:**
11. ✅ Monitorar primeiras 24 horas
12. ✅ Verificar métricas
13. ✅ Aplicar correções se necessário

---

## 🎯 CONCLUSÃO

**Status Atual:** ⚠️ **AGUARDANDO DEPLOY E TESTES MANUAIS**

**Próxima Ação:** Fazer deploy das correções e executar testes manuais

**Tempo Estimado:** 2-3 horas para testes completos

**Risco:** 🟢 **BAIXO** - Correções aplicadas, requer apenas validação

---

**Data:** 2025-11-25  
**Versão:** 1.2.1  
**Status:** ⚠️ **AGUARDANDO DEPLOY E TESTES**

