# 🔍 FASE 3 — BLOCO B3: GUIA DE VALIDAÇÃO AO VIVO
## Validação Crítica Pós-Deploy

**Data:** 19/12/2025  
**Hora:** 18:20:00  
**Fase:** 3 - GO-LIVE CONTROLADO  
**Status:** 🔄 **EM VALIDAÇÃO**

---

## 🎯 OBJETIVO

Validar que o sistema está funcionando corretamente em produção real, com PIX real ativo e sem bloqueios.

---

## 📋 ETAPA 1: VALIDAÇÃO DO PLAYER

### **1.1. Acessar Player**

**URL:** `https://[URL-DO-PLAYER].vercel.app` (ou domínio configurado)

**Validações:**
- ✅ Página carrega sem erros
- ✅ Console do navegador sem erros críticos (F12 → Console)
- ✅ Interface aparece corretamente

**Registrar:**
- [ ] URL acessada: `________________________`
- [ ] Status: ✅ OK / ❌ ERRO
- [ ] Erros encontrados: `________________________`

---

### **1.2. Criar Usuário Real**

**Passos:**
1. Clicar em "Cadastrar" ou "Registrar"
2. Preencher formulário:
   - Nome completo
   - Email válido (não usar email de teste)
   - Senha (mínimo 6 caracteres)
   - Aceitar termos de uso
3. Clicar em "Cadastrar"

**Validações:**
- ✅ Cadastro é criado com sucesso
- ✅ Redirecionamento para login ou dashboard
- ✅ Mensagem de sucesso aparece

**Registrar:**
- [ ] Email usado: `________________________`
- [ ] Status: ✅ OK / ❌ ERRO
- [ ] Mensagem recebida: `________________________`

---

### **1.3. Login**

**Passos:**
1. Fazer login com o usuário criado
2. Verificar se redireciona para dashboard

**Validações:**
- ✅ Login funciona
- ✅ Token é armazenado (F12 → Application → Local Storage → `authToken`)
- ✅ Dashboard carrega dados do usuário

**Registrar:**
- [ ] Status: ✅ OK / ❌ ERRO
- [ ] Token presente: ✅ SIM / ❌ NÃO
- [ ] Dashboard carrega: ✅ SIM / ❌ NÃO

---

### **1.4. Verificar Saldo Inicial**

**Validações:**
- ✅ Saldo inicial aparece (deve ser R$ 0,00)
- ✅ Interface mostra saldo corretamente

**Registrar:**
- [ ] Saldo inicial: R$ `________________________`
- [ ] Status: ✅ OK / ❌ ERRO

---

### **1.5. Gerar PIX Real (R$1 ou R$5)**

**Passos:**
1. Navegar para página de "Recarregar" ou "Pagamentos"
2. Selecionar valor: R$ 1,00 ou R$ 5,00
3. Clicar em "Gerar PIX" ou "Criar Pagamento"
4. Aguardar resposta do backend

**Validações:**
- ✅ PIX é gerado com sucesso
- ✅ QR Code aparece (se aplicável)
- ✅ Dados do PIX aparecem (chave, valor, etc.)
- ✅ Status inicial é "pendente" ou "aguardando pagamento"

**Registrar:**
- [ ] Valor do PIX: R$ `________________________`
- [ ] Status: ✅ OK / ❌ ERRO
- [ ] QR Code gerado: ✅ SIM / ❌ NÃO
- [ ] Dados do PIX: `________________________`

---

### **1.6. Verificar PIX no Banco de Dados**

**Passos:**
1. Acessar Supabase Dashboard
2. Ir para tabela `pagamentos_pix`
3. Buscar pelo email do usuário criado ou pelo valor do PIX

**Validações:**
- ✅ PIX aparece na tabela `pagamentos_pix`
- ✅ Status inicial é "pending" ou "aguardando"
- ✅ Valor está correto
- ✅ Usuário está vinculado corretamente

**Registrar:**
- [ ] PIX encontrado no banco: ✅ SIM / ❌ NÃO
- [ ] Status no banco: `________________________`
- [ ] Valor no banco: R$ `________________________`

---

### **1.7. Validar Jogo (Sem Pagar PIX)**

**Passos:**
1. Tentar iniciar um jogo
2. Verificar mensagem de saldo insuficiente (esperado)

**Validações:**
- ✅ Sistema bloqueia jogo sem saldo
- ✅ Mensagem de erro é clara
- ✅ Não há crashes ou erros críticos

**Registrar:**
- [ ] Status: ✅ OK / ❌ ERRO
- [ ] Mensagem recebida: `________________________`

---

## 📋 ETAPA 2: VALIDAÇÃO DO ADMIN

### **2.1. Acessar Admin**

**URL:** `https://[URL-DO-ADMIN].vercel.app` (ou domínio configurado)

**Validações:**
- ✅ Página carrega sem erros
- ✅ Console do navegador sem erros críticos

**Registrar:**
- [ ] URL acessada: `________________________`
- [ ] Status: ✅ OK / ❌ ERRO

---

### **2.2. Login Administrativo**

**Passos:**
1. Fazer login com credenciais administrativas
2. Verificar redirecionamento para dashboard

**Validações:**
- ✅ Login funciona
- ✅ Token administrativo é armazenado
- ✅ Dashboard administrativo carrega

**Registrar:**
- [ ] Status: ✅ OK / ❌ ERRO
- [ ] Dashboard carrega: ✅ SIM / ❌ NÃO

---

### **2.3. Verificar Dashboard**

**Validações:**
- ✅ Estatísticas aparecem (usuários, jogos, apostas)
- ✅ Dados financeiros aparecem corretamente
- ✅ Não há erros de carregamento

**Registrar:**
- [ ] Estatísticas aparecem: ✅ SIM / ❌ NÃO
- [ ] Dados financeiros aparecem: ✅ SIM / ❌ NÃO
- [ ] Status: ✅ OK / ❌ ERRO

---

### **2.4. Verificar PIX Criado no Admin**

**Passos:**
1. Navegar para página de "Pagamentos" ou "PIX"
2. Buscar pelo PIX criado no Player

**Validações:**
- ✅ PIX criado aparece na lista
- ✅ Dados do PIX estão corretos
- ✅ Status está correto

**Registrar:**
- [ ] PIX encontrado: ✅ SIM / ❌ NÃO
- [ ] Dados corretos: ✅ SIM / ❌ NÃO
- [ ] Status: ✅ OK / ❌ ERRO

---

## 📋 ETAPA 3: VERIFICAÇÃO DE LOGS DO BACKEND

### **3.1. Verificar Logs Recentes**

**Comando:**
```powershell
fly logs --app goldeouro-backend-v2 --no-tail | Select-Object -First 50
```

**Validações:**
- ✅ Nenhum erro crítico (500, 502, 503)
- ✅ Nenhuma falha financeira
- ✅ Apenas logs informativos

**Registrar:**
- [ ] Erros críticos encontrados: ✅ NÃO / ❌ SIM
- [ ] Falhas financeiras: ✅ NÃO / ❌ SIM
- [ ] Status: ✅ OK / ❌ ERRO

---

### **3.2. Verificar Logs de Autenticação**

**Buscar por:**
- Logs de login bem-sucedido
- Logs de criação de usuário
- Logs de criação de PIX

**Validações:**
- ✅ Login aparece nos logs
- ✅ Criação de usuário aparece nos logs
- ✅ Criação de PIX aparece nos logs

**Registrar:**
- [ ] Login nos logs: ✅ SIM / ❌ NÃO
- [ ] Criação de usuário nos logs: ✅ SIM / ❌ NÃO
- [ ] Criação de PIX nos logs: ✅ SIM / ❌ NÃO

---

## 📋 ETAPA 4: VALIDAÇÃO FINAL

### **4.1. Checklist Consolidado**

**Player:**
- [ ] Acesso funciona
- [ ] Cadastro funciona
- [ ] Login funciona
- [ ] PIX pode ser gerado
- [ ] PIX aparece no banco

**Admin:**
- [ ] Acesso funciona
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Dados financeiros aparecem
- [ ] PIX criado aparece

**Backend:**
- [ ] Logs sem erros críticos
- [ ] Nenhuma falha financeira
- [ ] Sistema estável

---

### **4.2. Problemas Encontrados**

**Listar todos os problemas encontrados:**

1. `________________________`
2. `________________________`
3. `________________________`

---

### **4.3. Decisão Final**

**Status:** ⏸️ **AGUARDANDO VALIDAÇÃO**

**Critérios:**
- ✅ PIX real funcionar
- ✅ Sistema estiver aberto
- ✅ Jogo operar por LOTES
- ✅ Nenhuma funcionalidade crítica desativada

**Decisão:**
- [ ] ✅ **APTO** - Sistema pronto para produção
- [ ] ⚠️ **APTO COM RESSALVAS** - Problemas não críticos encontrados
- [ ] ❌ **NÃO APTO** - Problemas críticos encontrados

---

## 📄 PRÓXIMOS PASSOS

Após completar todas as validações:

1. ✅ Preencher este documento completamente
2. ✅ Registrar todas as evidências (prints, logs, etc.)
3. ✅ Gerar documento final de conclusão
4. ✅ Declarar status final do GO-LIVE

---

**Documento criado em:** 2025-12-19T18:20:00.000Z  
**Status:** 🔄 **AGUARDANDO VALIDAÇÃO**

