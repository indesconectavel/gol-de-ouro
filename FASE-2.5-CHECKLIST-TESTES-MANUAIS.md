# ✅ FASE 2.5 — CHECKLIST DE TESTES MANUAIS
## Checklist Rápido para Execução de Testes

**Data:** ___/___/2025  
**Testador:** _______________  
**Ambiente:** Staging

---

## 🔐 AUTENTICAÇÃO

### **Player Web**
- [ ] **T1.1** Login bem-sucedido
  - [ ] Token armazenado via `authAdapter`
  - [ ] Redirecionamento para `/dashboard`
  - [ ] Dashboard carrega dados

- [ ] **T1.2** Token expirado - renovação automática
  - [ ] Token renovado automaticamente
  - [ ] Requisição original retentada
  - [ ] Usuário não percebe interrupção

- [ ] **T1.3** Refresh token inválido
  - [ ] Tokens limpos
  - [ ] Evento `auth:token-expired` emitido
  - [ ] Redirecionamento para login

---

## 🎮 JOGO

### **Player Web**
- [ ] **T2.1** Validação de saldo antes de chute
  - [ ] Validação ocorre antes de chamar backend
  - [ ] Mensagem de erro clara
  - [ ] Nenhuma requisição desnecessária

- [ ] **T2.2** Chute bem-sucedido
  - [ ] Chute processado com sucesso
  - [ ] Resultado exibido corretamente
  - [ ] Saldo atualizado
  - [ ] Contador global sempre do backend

- [ ] **T2.3** Tratamento de lote completo
  - [ ] Erro de lote detectado
  - [ ] Retry automático após 1 segundo
  - [ ] Chute processado após retry

- [ ] **T2.4** Contador global do backend
  - [ ] `shotsUntilGoldenGoal` sempre do backend
  - [ ] Valor atualizado após cada chute
  - [ ] Cálculo local não ocorre

---

## 💳 PAGAMENTOS

### **Player Web**
- [ ] **T3.1** Criação de pagamento PIX
  - [ ] Pagamento criado com sucesso
  - [ ] QR Code exibido
  - [ ] Polling automático iniciado

- [ ] **T3.2** Polling automático de status
  - [ ] Polling verifica status a cada 5 segundos
  - [ ] Status atualizado detectado
  - [ ] Evento `payment:status-updated` emitido
  - [ ] Saldo atualizado automaticamente
  - [ ] Polling parou automaticamente

- [ ] **T3.3** Pagamento expirado
  - [ ] Expiração detectada
  - [ ] Evento customizado emitido
  - [ ] Polling parou

---

## 💰 SAQUES

### **Player Web**
- [ ] **T4.1** Validação de saldo antes de saque
  - [ ] Validação ocorre antes de chamar backend
  - [ ] Mensagem de erro clara
  - [ ] Nenhuma requisição desnecessária

- [ ] **T4.2** Saque bem-sucedido
  - [ ] Saque criado com sucesso
  - [ ] Saldo atualizado
  - [ ] Mensagem de sucesso exibida

---

## 👨‍💼 ADMIN DASHBOARD

### **Admin Web**
- [ ] **T5.1** Carregamento de estatísticas
  - [ ] Estatísticas carregadas
  - [ ] Dados normalizados corretamente
  - [ ] Valores correspondem ao backend

- [ ] **T5.2** Tratamento de dados incompletos
  - [ ] Dashboard não quebra
  - [ ] Valores padrão usados
  - [ ] UI permanece funcional

---

## 🧪 CENÁRIOS DE STRESS

- [ ] **TS1** Backend offline
  - [ ] Erro classificado como erro de rede
  - [ ] Mensagem amigável exibida
  - [ ] Retry automático quando backend volta

- [ ] **TS2** Backend lento
  - [ ] Timeout configurado (30 segundos)
  - [ ] Retry com backoff exponencial
  - [ ] UI não trava

- [ ] **TS3** Dados nulos/incompletos
  - [ ] Dados normalizados via `dataAdapter`
  - [ ] Valores padrão usados
  - [ ] UI não quebra

---

## 📱 APK (MOBILE)

- [ ] **TM1** Login e autenticação
  - [ ] Login bem-sucedido
  - [ ] Token armazenado
  - [ ] Dashboard carrega

- [ ] **TM2** Jogo no APK
  - [ ] Validação de saldo funciona
  - [ ] Chute processado corretamente
  - [ ] Resultado exibido

---

## 📊 RESUMO

**Total de Testes:** _____  
**Testes Passados:** _____  
**Testes Falhados:** _____  
**Testes Bloqueados:** _____  
**Taxa de Sucesso:** _____%

---

## ✅ DECISÃO PRELIMINAR

**Status:** 🟢 GO | 🟡 GO COM RESSALVAS | 🔴 NO-GO

**Justificativa:**

---

**Assinatura:** _______________  
**Data:** ___/___/2025

