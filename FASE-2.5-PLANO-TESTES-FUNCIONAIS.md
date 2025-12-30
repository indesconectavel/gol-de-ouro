# 🧪 FASE 2.5 — PLANO DE TESTES FUNCIONAIS EM STAGING
## Validação Real UI Web (Player/Admin) e APK ↔ Engine V19

**Data:** 18/12/2025  
**Status:** 🟡 **INICIANDO**  
**Ambiente:** Staging  
**Objetivo:** Validar fluxos completos, estados reais, erros reais e comportamento em tempo real

---

## 🎯 OBJETIVO DA FASE 2.5

Executar testes funcionais reais da UI Web (Player e Admin) e APK utilizando a Engine V19 em ambiente de staging, validando:
- Fluxos completos end-to-end
- Estados reais de dados
- Erros reais do backend
- Comportamento em tempo real
- Integração com adaptadores da Fase 1

**Resultado Esperado:** Relatório final com decisão GO/NO-GO para produção

---

## 📋 PRÉ-REQUISITOS

### **Ambiente**
- [ ] Engine V19 rodando em staging
- [ ] UI Player Web deployada em staging
- [ ] UI Admin Web deployada em staging
- [ ] APK gerado com adaptadores da Fase 1
- [ ] Banco de dados de staging configurado
- [ ] Credenciais de teste válidas

### **Credenciais de Teste**
- [ ] Conta Player de teste criada
- [ ] Conta Admin de teste criada
- [ ] Saldo inicial configurado
- [ ] Chave PIX de teste configurada

### **Ferramentas**
- [ ] Navegador atualizado (Chrome/Firefox)
- [ ] Dispositivo Android para APK
- [ ] Ferramenta de captura de tela
- [ ] Ferramenta de captura de logs (DevTools)
- [ ] Postman/Insomnia para validação de APIs

---

## 🔄 FLUXOS CRÍTICOS A TESTAR

### **FLUXO 1: Autenticação Completa (Player Web)**

#### **Teste 1.1: Login Bem-Sucedido**
**Objetivo:** Validar login com credenciais válidas

**Passos:**
1. Acessar URL de staging do Player Web
2. Preencher email e senha válidos
3. Clicar em "Entrar"
4. Observar comportamento da UI
5. Verificar redirecionamento para `/dashboard`
6. Verificar token armazenado via DevTools (localStorage)
7. Verificar se `authAdapter` foi usado

**Resultado Esperado:**
- ✅ Login bem-sucedido
- ✅ Token armazenado via `authAdapter`
- ✅ Redirecionamento correto
- ✅ Dashboard carrega dados do usuário

**Evidências:**
- [ ] Screenshot do login
- [ ] Screenshot do dashboard
- [ ] Log do console (token armazenado)
- [ ] Network tab (requisições feitas)

---

#### **Teste 1.2: Token Expirado - Renovação Automática**
**Objetivo:** Validar renovação automática de token

**Passos:**
1. Fazer login
2. Aguardar token expirar (ou simular expiração)
3. Realizar ação que requer autenticação
4. Observar comportamento do `authAdapter`
5. Verificar se token foi renovado automaticamente
6. Verificar se ação foi completada sem interrupção

**Resultado Esperado:**
- ✅ Token renovado automaticamente
- ✅ Requisição original retentada
- ✅ Usuário não percebe interrupção
- ✅ Logs mostram renovação

**Evidências:**
- [ ] Log do console (renovação de token)
- [ ] Network tab (requisição de refresh)
- [ ] Network tab (requisição original retentada)
- [ ] Screenshot da ação completada

---

#### **Teste 1.3: Refresh Token Inválido**
**Objetivo:** Validar tratamento de refresh token inválido

**Passos:**
1. Fazer login
2. Invalidar refresh token manualmente (ou aguardar expiração)
3. Realizar ação que requer autenticação
4. Observar comportamento do `authAdapter`
5. Verificar se evento `auth:token-expired` foi emitido
6. Verificar se usuário foi redirecionado para login

**Resultado Esperado:**
- ✅ Refresh token inválido detectado
- ✅ Tokens limpos
- ✅ Evento `auth:token-expired` emitido
- ✅ Redirecionamento para login

**Evidências:**
- [ ] Log do console (erro de refresh token)
- [ ] Network tab (401 na requisição)
- [ ] Screenshot do redirecionamento
- [ ] Log do evento customizado

---

### **FLUXO 2: Jogar (Chutar) - Player Web**

#### **Teste 2.1: Validação de Saldo Antes de Chute**
**Objetivo:** Validar que saldo é verificado antes de chutar

**Passos:**
1. Fazer login
2. Verificar saldo atual (deve ser insuficiente)
3. Tentar chutar com valor maior que o saldo
4. Observar comportamento do `gameAdapter`
5. Verificar se requisição foi bloqueada antes de chamar backend
6. Verificar mensagem de erro exibida

**Resultado Esperado:**
- ✅ Validação ocorre antes de chamar backend
- ✅ Mensagem de erro clara exibida
- ✅ Botão de chute desabilitado (se implementado)
- ✅ Nenhuma requisição desnecessária ao backend

**Evidências:**
- [ ] Screenshot da mensagem de erro
- [ ] Network tab (nenhuma requisição POST /api/games/shoot)
- [ ] Log do console (validação de saldo)

---

#### **Teste 2.2: Chute Bem-Sucedido**
**Objetivo:** Validar chute com saldo suficiente

**Passos:**
1. Fazer login
2. Recarregar saldo (via PIX ou admin)
3. Acessar `/game`
4. Selecionar zona e valor
5. Clicar em "Chutar"
6. Observar comportamento do `gameAdapter`
7. Verificar resultado exibido
8. Verificar saldo atualizado
9. Verificar contador global atualizado

**Resultado Esperado:**
- ✅ Chute processado com sucesso
- ✅ Resultado exibido corretamente
- ✅ Saldo atualizado
- ✅ Contador global sempre do backend
- ✅ `shotsUntilGoldenGoal` calculado do backend

**Evidências:**
- [ ] Screenshot do resultado
- [ ] Network tab (requisição POST /api/games/shoot)
- [ ] Network tab (resposta com contador global)
- [ ] Screenshot do saldo atualizado
- [ ] Log do console (dados normalizados)

---

#### **Teste 2.3: Tratamento de Lote Completo**
**Objetivo:** Validar tratamento automático de lote completo

**Passos:**
1. Fazer login
2. Garantir saldo suficiente
3. Tentar chutar quando lote está completo
4. Observar comportamento do `gameAdapter`
5. Verificar se retry automático ocorreu
6. Verificar se chute foi processado após retry

**Resultado Esperado:**
- ✅ Erro de lote completo detectado
- ✅ Retry automático após 1 segundo
- ✅ Novo lote criado automaticamente
- ✅ Chute processado com sucesso
- ✅ Usuário não percebe problema

**Evidências:**
- [ ] Log do console (erro de lote completo)
- [ ] Network tab (primeira tentativa - erro)
- [ ] Network tab (segunda tentativa - sucesso)
- [ ] Screenshot do resultado final

---

#### **Teste 2.4: Contador Global do Backend**
**Objetivo:** Validar que contador global sempre vem do backend

**Passos:**
1. Fazer login
2. Acessar `/game`
3. Verificar valor de `shotsUntilGoldenGoal` exibido
4. Fazer um chute
5. Verificar novo valor de `shotsUntilGoldenGoal`
6. Comparar com resposta do backend
7. Verificar se cálculo local foi evitado

**Resultado Esperado:**
- ✅ `shotsUntilGoldenGoal` sempre do backend
- ✅ Valor atualizado após cada chute
- ✅ Cálculo local não ocorre
- ✅ Valor corresponde à resposta do backend

**Evidências:**
- [ ] Screenshot do valor inicial
- [ ] Network tab (resposta com contador global)
- [ ] Screenshot do valor após chute
- [ ] Comparação com resposta do backend

---

### **FLUXO 3: Depósito PIX - Player Web**

#### **Teste 3.1: Criação de Pagamento PIX**
**Objetivo:** Validar criação de pagamento PIX

**Passos:**
1. Fazer login
2. Acessar `/pagamentos`
3. Selecionar valor de recarga
4. Clicar em "Gerar PIX"
5. Observar comportamento do `paymentAdapter`
6. Verificar se QR Code foi exibido
7. Verificar se polling automático iniciou

**Resultado Esperado:**
- ✅ Pagamento criado com sucesso
- ✅ QR Code exibido
- ✅ Polling automático iniciado
- ✅ Logs mostram início do polling

**Evidências:**
- [ ] Screenshot do QR Code
- [ ] Network tab (requisição POST /api/payments/pix/criar)
- [ ] Log do console (polling iniciado)
- [ ] Network tab (requisições periódicas de status)

---

#### **Teste 3.2: Polling Automático de Status**
**Objetivo:** Validar polling automático de status PIX

**Passos:**
1. Criar pagamento PIX (Teste 3.1)
2. Observar requisições periódicas no Network tab
3. Simular pagamento aprovado (via admin ou webhook)
4. Verificar se polling detectou mudança de status
5. Verificar se evento `payment:status-updated` foi emitido
6. Verificar se saldo foi atualizado automaticamente
7. Verificar se polling parou automaticamente

**Resultado Esperado:**
- ✅ Polling verifica status a cada 5 segundos
- ✅ Status atualizado detectado
- ✅ Evento customizado emitido
- ✅ Saldo atualizado automaticamente
- ✅ Polling parou automaticamente

**Evidências:**
- [ ] Network tab (requisições periódicas GET /api/payments/pix/status)
- [ ] Log do console (status atualizado)
- [ ] Log do evento customizado
- [ ] Screenshot do saldo atualizado
- [ ] Log do console (polling parado)

---

#### **Teste 3.3: Pagamento Expirado**
**Objetivo:** Validar tratamento de pagamento expirado

**Passos:**
1. Criar pagamento PIX
2. Aguardar expiração (ou simular)
3. Verificar se polling detectou expiração
4. Verificar se evento foi emitido
5. Verificar se polling parou

**Resultado Esperado:**
- ✅ Expiração detectada pelo polling
- ✅ Evento customizado emitido
- ✅ Polling parou automaticamente
- ✅ UI exibe mensagem de expiração (se implementada)

**Evidências:**
- [ ] Network tab (status "expired")
- [ ] Log do console (expiração detectada)
- [ ] Log do evento customizado
- [ ] Screenshot da mensagem (se houver)

---

### **FLUXO 4: Saque - Player Web**

#### **Teste 4.1: Validação de Saldo Antes de Saque**
**Objetivo:** Validar validação de saldo antes de saque

**Passos:**
1. Fazer login
2. Verificar saldo atual (deve ser insuficiente)
3. Acessar `/withdraw`
4. Preencher valor maior que o saldo
5. Preencher chave PIX
6. Tentar solicitar saque
7. Observar comportamento do `withdrawAdapter`
8. Verificar se requisição foi bloqueada antes de chamar backend

**Resultado Esperado:**
- ✅ Validação ocorre antes de chamar backend
- ✅ Mensagem de erro clara exibida
- ✅ Botão de saque desabilitado (se implementado)
- ✅ Nenhuma requisição desnecessária ao backend

**Evidências:**
- [ ] Screenshot da mensagem de erro
- [ ] Network tab (nenhuma requisição POST /api/withdraw)
- [ ] Log do console (validação de saldo)

---

#### **Teste 4.2: Saque Bem-Sucedido**
**Objetivo:** Validar saque com saldo suficiente

**Passos:**
1. Fazer login
2. Garantir saldo suficiente
3. Acessar `/withdraw`
4. Preencher valor válido
5. Preencher chave PIX válida
6. Clicar em "Solicitar Saque"
7. Observar comportamento do `withdrawAdapter`
8. Verificar se saque foi criado
9. Verificar se saldo foi atualizado

**Resultado Esperado:**
- ✅ Saque criado com sucesso
- ✅ Saldo atualizado
- ✅ Mensagem de sucesso exibida
- ✅ Histórico atualizado (se implementado)

**Evidências:**
- [ ] Screenshot da mensagem de sucesso
- [ ] Network tab (requisição POST /api/withdraw)
- [ ] Screenshot do saldo atualizado
- [ ] Log do console (dados normalizados)

---

### **FLUXO 5: Admin Dashboard - Admin Web**

#### **Teste 5.1: Carregamento de Estatísticas**
**Objetivo:** Validar carregamento de estatísticas do Dashboard

**Passos:**
1. Fazer login como admin
2. Acessar `/painel`
3. Observar comportamento do `adminAdapter`
4. Verificar se estatísticas carregaram
5. Verificar se dados foram normalizados
6. Comparar com dados reais do backend

**Resultado Esperado:**
- ✅ Estatísticas carregadas com sucesso
- ✅ Dados normalizados corretamente
- ✅ Valores correspondem ao backend
- ✅ UI não quebra com dados incompletos

**Evidências:**
- [ ] Screenshot do Dashboard
- [ ] Network tab (requisição GET /api/admin/stats)
- [ ] Comparação com resposta do backend
- [ ] Log do console (dados normalizados)

---

#### **Teste 5.2: Tratamento de Dados Incompletos**
**Objetivo:** Validar tratamento de dados incompletos

**Passos:**
1. Fazer login como admin
2. Simular resposta com dados incompletos (via proxy ou mock)
3. Acessar `/painel`
4. Verificar se Dashboard não quebra
5. Verificar se valores padrão são usados

**Resultado Esperado:**
- ✅ Dashboard não quebra
- ✅ Valores padrão (zero) são usados
- ✅ UI permanece funcional
- ✅ Logs mostram normalização

**Evidências:**
- [ ] Screenshot do Dashboard com dados incompletos
- [ ] Network tab (resposta incompleta)
- [ ] Log do console (normalização aplicada)

---

## 🧪 CENÁRIOS DE STRESS

### **Teste S1: Backend Offline**
**Objetivo:** Validar comportamento quando backend está offline

**Passos:**
1. Fazer login
2. Desligar backend ou bloquear acesso
3. Tentar realizar ação crítica (chute, pagamento, etc.)
4. Observar comportamento dos adaptadores
5. Verificar mensagem de erro exibida
6. Verificar se retry automático funciona quando backend volta

**Resultado Esperado:**
- ✅ Erro classificado como erro de rede
- ✅ Mensagem amigável exibida
- ✅ Retry automático quando backend volta
- ✅ UI não quebra

**Evidências:**
- [ ] Screenshot da mensagem de erro
- [ ] Log do console (erro classificado)
- [ ] Network tab (tentativas de retry)
- [ ] Screenshot após backend voltar

---

### **Teste S2: Backend Lento**
**Objetivo:** Validar comportamento quando backend responde lentamente

**Passos:**
1. Fazer login
2. Simular latência alta (5+ segundos)
3. Tentar realizar ação crítica
4. Observar timeout e retry
5. Verificar se UI não trava

**Resultado Esperado:**
- ✅ Timeout configurado (30 segundos)
- ✅ Retry com backoff exponencial
- ✅ UI exibe loading apropriado
- ✅ Não há travamentos

**Evidências:**
- [ ] Screenshot do loading
- [ ] Network tab (timeout e retry)
- [ ] Log do console (backoff aplicado)

---

### **Teste S3: Dados Nulos/Incompletos**
**Objetivo:** Validar normalização de dados nulos/incompletos

**Passos:**
1. Fazer login
2. Simular resposta com dados nulos/incompletos
3. Realizar ação que consome dados
4. Verificar se `dataAdapter` normaliza corretamente
5. Verificar se UI não quebra

**Resultado Esperado:**
- ✅ Dados normalizados via `dataAdapter`
- ✅ Valores padrão usados
- ✅ UI não quebra
- ✅ Mensagens apropriadas

**Evidências:**
- [ ] Screenshot da UI funcionando
- [ ] Network tab (resposta com dados nulos)
- [ ] Log do console (normalização aplicada)

---

## 📱 TESTES APK (Mobile)

### **Teste M1: Login e Autenticação**
**Objetivo:** Validar login no APK

**Passos:**
1. Instalar APK em dispositivo Android
2. Abrir aplicativo
3. Fazer login com credenciais válidas
4. Verificar se token é armazenado
5. Verificar se Dashboard carrega

**Resultado Esperado:**
- ✅ Login bem-sucedido
- ✅ Token armazenado
- ✅ Dashboard carrega dados

**Evidências:**
- [ ] Screenshot do login
- [ ] Screenshot do dashboard
- [ ] Log do aplicativo (se disponível)

---

### **Teste M2: Jogo no APK**
**Objetivo:** Validar jogo no APK

**Passos:**
1. Fazer login no APK
2. Acessar tela de jogo
3. Tentar chutar
4. Verificar validação de saldo
5. Verificar resultado

**Resultado Esperado:**
- ✅ Validação de saldo funciona
- ✅ Chute processado corretamente
- ✅ Resultado exibido

**Evidências:**
- [ ] Screenshot da tela de jogo
- [ ] Screenshot do resultado
- [ ] Log do aplicativo (se disponível)

---

## 📊 CHECKLIST DE EXECUÇÃO

### **Preparação**
- [ ] Ambiente de staging configurado
- [ ] Credenciais de teste preparadas
- [ ] Ferramentas instaladas
- [ ] APK gerado e instalado

### **Testes Player Web**
- [ ] Teste 1.1: Login bem-sucedido
- [ ] Teste 1.2: Token expirado - renovação automática
- [ ] Teste 1.3: Refresh token inválido
- [ ] Teste 2.1: Validação de saldo antes de chute
- [ ] Teste 2.2: Chute bem-sucedido
- [ ] Teste 2.3: Tratamento de lote completo
- [ ] Teste 2.4: Contador global do backend
- [ ] Teste 3.1: Criação de pagamento PIX
- [ ] Teste 3.2: Polling automático de status
- [ ] Teste 3.3: Pagamento expirado
- [ ] Teste 4.1: Validação de saldo antes de saque
- [ ] Teste 4.2: Saque bem-sucedido

### **Testes Admin Web**
- [ ] Teste 5.1: Carregamento de estatísticas
- [ ] Teste 5.2: Tratamento de dados incompletos

### **Testes de Stress**
- [ ] Teste S1: Backend offline
- [ ] Teste S2: Backend lento
- [ ] Teste S3: Dados nulos/incompletos

### **Testes APK**
- [ ] Teste M1: Login e autenticação
- [ ] Teste M2: Jogo no APK

---

## 📝 REGISTRO DE EVIDÊNCIAS

### **Para Cada Teste, Registrar:**
1. **Screenshots:** Todas as telas relevantes
2. **Logs do Console:** Erros, warnings, informações importantes
3. **Network Tab:** Todas as requisições e respostas
4. **Resultado:** Passou/Falhou/Bloqueado
5. **Observações:** Comportamentos inesperados, melhorias sugeridas

### **Estrutura de Pastas para Evidências:**
```
evidencias/
├── player-web/
│   ├── autenticacao/
│   ├── jogo/
│   ├── pagamentos/
│   └── saques/
├── admin-web/
│   └── dashboard/
├── stress/
└── apk/
```

---

## ✅ CRITÉRIOS DE APROVAÇÃO

### **GO para Produção se:**
- ✅ Todos os testes críticos passam (80%+)
- ✅ Nenhum erro crítico não tratado
- ✅ Adaptadores funcionam corretamente
- ✅ UI permanece funcional
- ✅ Performance aceitável

### **NO-GO para Produção se:**
- ❌ Qualquer teste crítico falha
- ❌ Erros não tratados adequadamente
- ❌ UI quebra em cenários de erro
- ❌ Adaptadores não funcionam
- ❌ Performance inaceitável

---

**PRÓXIMO PASSO:** Executar testes e registrar evidências

