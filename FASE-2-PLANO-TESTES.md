# 🧪 FASE 2 — PLANO DE TESTES DE INTEGRAÇÃO
## Validação Completa UI Web ↔ Engine V19 com Adaptadores

**Data:** 18/12/2025  
**Status:** 🟡 **EM ANDAMENTO**  
**Objetivo:** Validar todos os fluxos críticos, estados intermediários e cenários de erro

---

## 🎯 OBJETIVO DA FASE 2

Executar testes funcionais completos da UI Web (Player e Admin) utilizando a Engine V19 com os adaptadores da Fase 1, garantindo que:
- Todos os fluxos críticos funcionam corretamente
- Estados intermediários são tratados adequadamente
- Cenários de erro são gerenciados graciosamente
- A UI permanece intacta e funcional

---

## 📋 ESCOPO DE TESTES

### **Testes Obrigatórios**

1. ✅ **Autenticação**
   - Login
   - Registro
   - Token expirado
   - Refresh token
   - Logout

2. ✅ **Jogo**
   - Validação de saldo antes de chute
   - Processamento de chute
   - Tratamento de lote completo/encerrado
   - Contador global do backend
   - Fluxo completo do jogo

3. ✅ **Pagamentos**
   - Criação de pagamento PIX
   - Polling automático de status
   - Atualização de saldo após pagamento

4. ✅ **Saques**
   - Validação de saldo antes de saque
   - Criação de solicitação de saque
   - Validação de chave PIX

5. ✅ **Admin Dashboard**
   - Carregamento de estatísticas
   - Normalização de dados

6. ✅ **Cenários de Stress**
   - Backend offline
   - Backend lento
   - Dados nulos/incompletos
   - Payload inesperado
   - Lote inexistente/encerrado
   - Usuário sem saldo

---

## 🔄 FLUXOS CRÍTICOS A TESTAR

### **FLUXO 1: Autenticação Completa**

**Cenário Normal:**
1. Usuário acessa `/login`
2. Preenche email e senha
3. Clica em "Entrar"
4. `authAdapter` gerencia token
5. Token armazenado via `authAdapter.setToken()`
6. Redireciona para `/dashboard`
7. Token válido permite acesso

**Cenário Token Expirado:**
1. Token expira durante sessão
2. Requisição retorna 401
3. `apiClient` intercepta 401
4. `authAdapter.refreshToken()` é chamado automaticamente
5. Novo token obtido
6. Requisição original é retentada
7. Usuário não percebe interrupção

**Cenário Refresh Token Inválido:**
1. Refresh token expirado/inválido
2. `authAdapter.refreshToken()` falha
3. Tokens são limpos
4. Evento `auth:token-expired` é emitido
5. UI redireciona para login

---

### **FLUXO 2: Jogar (Chutar)**

**Cenário Normal:**
1. Usuário acessa `/game`
2. `gameAdapter.getGlobalMetrics()` carrega métricas
3. Usuário seleciona zona e valor
4. Clica em "Chutar"
5. `gameAdapter.validateShot()` valida saldo
6. Se saldo suficiente, `gameAdapter.processShot()` executa
7. `POST /api/games/shoot` é chamado
8. Resultado é normalizado via `dataAdapter`
9. UI atualiza saldo e exibe resultado

**Cenário Saldo Insuficiente:**
1. Usuário tenta chutar com saldo insuficiente
2. `gameAdapter.validateShot()` detecta saldo insuficiente
3. Retorna erro antes de chamar backend
4. UI exibe mensagem de erro clara
5. Botão de chute permanece desabilitado

**Cenário Lote Completo:**
1. Usuário tenta chutar em lote completo
2. Backend retorna erro "Lote completo"
3. `gameAdapter._processShotWithRetry()` detecta erro
4. Aguarda 1 segundo
5. Retenta automaticamente (novo lote criado pelo backend)
6. Chute processado com sucesso

**Cenário Backend Offline:**
1. Backend está offline
2. Requisição falha com erro de rede
3. `errorAdapter` classifica como erro de rede
4. Retry automático com backoff exponencial
5. Após 3 tentativas, retorna erro amigável
6. UI exibe mensagem de erro apropriada

---

### **FLUXO 3: Depósito PIX**

**Cenário Normal:**
1. Usuário acessa `/pagamentos`
2. Seleciona valor de recarga
3. Clica em "Gerar PIX"
4. `paymentAdapter.createPayment()` é chamado
5. `POST /api/payments/pix/criar` cria pagamento
6. QR Code é exibido
7. `paymentAdapter.startPolling()` inicia polling automático
8. Polling verifica status a cada 5 segundos
9. Quando pagamento aprovado, evento `payment:status-updated` é emitido
10. UI atualiza saldo automaticamente

**Cenário Polling Automático:**
1. Pagamento criado com sucesso
2. `paymentAdapter.startPolling()` inicia
3. Polling verifica status periodicamente
4. Intervalo aumenta gradualmente (backoff)
5. Quando status muda para "approved", polling para
6. Evento customizado notifica UI
7. Saldo é atualizado automaticamente

**Cenário Pagamento Expirado:**
1. Pagamento expira antes de ser pago
2. Polling detecta status "expired"
3. Polling para automaticamente
4. Evento notifica UI
5. UI exibe mensagem de expiração

---

### **FLUXO 4: Saque**

**Cenário Normal:**
1. Usuário acessa `/withdraw`
2. Preenche valor e chave PIX
3. Clica em "Solicitar Saque"
4. `withdrawAdapter.validateWithdraw()` valida saldo
5. Se válido, `withdrawAdapter.createWithdraw()` cria saque
6. `POST /api/withdraw` é chamado
7. Saque criado com sucesso
8. Saldo atualizado

**Cenário Saldo Insuficiente:**
1. Usuário tenta sacar mais do que tem
2. `withdrawAdapter.validateWithdraw()` detecta saldo insuficiente
3. Retorna erro antes de chamar backend
4. UI exibe mensagem de erro clara
5. Botão de saque permanece desabilitado

**Cenário Chave PIX Inválida:**
1. Usuário tenta sacar sem chave PIX
2. `withdrawAdapter.validateWithdraw()` valida chave
3. Retorna erro de validação
4. UI exibe mensagem de erro

---

### **FLUXO 5: Admin Dashboard**

**Cenário Normal:**
1. Admin acessa `/painel`
2. `adminAdapter.getGeneralStats()` é chamado
3. `GET /api/admin/stats` retorna dados
4. `dataAdapter.normalizeAdminStats()` normaliza dados
5. Dashboard exibe estatísticas corretas

**Cenário Dados Incompletos:**
1. Backend retorna dados incompletos
2. `dataAdapter.normalizeAdminStats()` preenche valores padrão
3. Dashboard exibe valores zero em vez de quebrar
4. UI permanece funcional

---

## 🧪 CENÁRIOS DE STRESS

### **1. Backend Offline**

**Teste:**
- Desligar backend ou simular offline
- Tentar realizar ações críticas
- Verificar tratamento de erro

**Resultado Esperado:**
- `errorAdapter` classifica como erro de rede
- Mensagem amigável exibida
- Retry automático quando backend volta
- UI não quebra

---

### **2. Backend Responde Lentamente**

**Teste:**
- Simular latência alta (5+ segundos)
- Tentar realizar ações críticas
- Verificar timeout e retry

**Resultado Esperado:**
- Timeout configurado (30 segundos)
- Retry com backoff exponencial
- UI exibe loading apropriado
- Não há travamentos

---

### **3. Dados Retornam Nulos ou Incompletos**

**Teste:**
- Simular resposta com dados nulos
- Verificar normalização via `dataAdapter`

**Resultado Esperado:**
- `dataAdapter` normaliza dados nulos
- Valores padrão são usados
- UI não quebra
- Mensagens de erro apropriadas

---

### **4. Payload Inesperado**

**Teste:**
- Simular resposta com estrutura diferente
- Verificar normalização via `dataAdapter`

**Resultado Esperado:**
- `dataAdapter` normaliza estrutura
- Dados são tratados graciosamente
- UI não quebra

---

### **5. Lote Inexistente/Encerrado**

**Teste:**
- Tentar chutar em lote inexistente/encerrado
- Verificar tratamento via `gameAdapter`

**Resultado Esperado:**
- `gameAdapter` detecta erro de lote
- Retry automático (novo lote criado)
- Chute processado com sucesso
- Usuário não percebe problema

---

### **6. Usuário Sem Saldo**

**Teste:**
- Tentar chutar/sacar sem saldo
- Verificar validação via adaptadores

**Resultado Esperado:**
- Validação ocorre antes de chamar backend
- Mensagem de erro clara
- Botões desabilitados apropriadamente
- Não há requisições desnecessárias

---

## 📊 CHECKLIST DE TESTES

### **Autenticação**
- [ ] Login funciona corretamente
- [ ] Token é armazenado via `authAdapter`
- [ ] Token expirado renova automaticamente
- [ ] Refresh token funciona
- [ ] Logout limpa tokens corretamente
- [ ] Evento `auth:token-expired` é emitido quando necessário

### **Jogo**
- [ ] Validação de saldo antes de chute funciona
- [ ] Chute processado corretamente
- [ ] Lote completo tratado automaticamente
- [ ] Contador global sempre do backend
- [ ] Retry funciona em caso de erro
- [ ] Mensagens de erro são claras

### **Pagamentos**
- [ ] Criação de pagamento PIX funciona
- [ ] Polling automático inicia corretamente
- [ ] Status atualizado automaticamente
- [ ] Evento `payment:status-updated` é emitido
- [ ] Polling para quando pagamento aprovado/expirado
- [ ] Backoff exponencial funciona

### **Saques**
- [ ] Validação de saldo antes de saque funciona
- [ ] Validação de chave PIX funciona
- [ ] Criação de saque funciona
- [ ] Mensagens de erro são claras

### **Admin Dashboard**
- [ ] Estatísticas carregam corretamente
- [ ] Dados são normalizados corretamente
- [ ] Tratamento de erro funciona

### **Cenários de Stress**
- [ ] Backend offline tratado corretamente
- [ ] Backend lento tratado corretamente
- [ ] Dados nulos normalizados corretamente
- [ ] Payload inesperado tratado corretamente
- [ ] Lote inexistente/encerrado tratado corretamente
- [ ] Usuário sem saldo tratado corretamente

---

## 📝 CRITÉRIOS DE APROVAÇÃO

### **✅ APTO para Deploy se:**
- Todos os testes de autenticação passam
- Todos os testes de jogo passam
- Todos os testes de pagamentos passam
- Todos os testes de saques passam
- Todos os testes de Admin passam
- Todos os cenários de stress são tratados corretamente
- UI permanece 100% intacta
- Nenhum erro crítico encontrado

### **❌ NÃO APTO para Deploy se:**
- Qualquer teste crítico falha
- Erros não tratados adequadamente
- UI quebra em cenários de erro
- Adaptadores não funcionam corretamente
- Dados não são normalizados corretamente

---

**PRÓXIMO PASSO:** Executar testes e gerar relatório detalhado

