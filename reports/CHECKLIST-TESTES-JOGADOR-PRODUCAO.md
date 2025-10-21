# 🎮 CHECKLIST DE TESTES - FLUXO DO JOGADOR EM PRODUÇÃO

**Data:** 2025-01-07T23:58:00Z  
**Versão:** GO-LIVE v1.1.1  
**Objetivo:** Validação completa do fluxo do jogador com prints de cada tela  
**Autor:** Cursor MCP System  

---

## 📋 **RESUMO EXECUTIVO**

Este checklist contém **todas as etapas** que devem ser validadas no fluxo completo do jogador, desde o acesso inicial até a conclusão de uma partida. Cada etapa deve ser **documentada com prints** para garantir que o sistema está funcionando corretamente em produção.

### 🎯 **OBJETIVOS**
- ✅ Validar **100% das funcionalidades** do jogador
- ✅ Documentar **cada tela** com prints
- ✅ Verificar **responsividade** em diferentes dispositivos
- ✅ Testar **fluxos de erro** e recuperação
- ✅ Confirmar **integração** com backend

---

## 🚀 **ETAPA 1: ACESSO INICIAL E CARREGAMENTO**

### **1.1 Tela de Loading**
- [ ] **Acessar URL de produção** do jogador
- [ ] **Print:** Tela de loading com logo "Gol de Ouro"
- [ ] **Verificar:** Animação de carregamento funcionando
- [ ] **Verificar:** Barra de progresso animada
- [ ] **Verificar:** Efeitos visuais de estádio
- [ ] **Tempo de carregamento:** < 3 segundos

**URLs para testar:**
- Produção: `https://goldeouro.vercel.app`
- Staging: `https://goldeouro-staging.vercel.app`

---

## 🔐 **ETAPA 2: AUTENTICAÇÃO**

### **2.1 Tela de Login**
- [ ] **Acessar** página de login
- [ ] **Print:** Tela de login completa
- [ ] **Verificar:** Campos de email e senha
- [ ] **Verificar:** Botão "Entrar" estilizado
- [ ] **Verificar:** Link "Não tem conta? Registre-se"
- [ ] **Verificar:** Design responsivo (mobile/desktop)

### **2.2 Teste de Login Válido**
- [ ] **Inserir credenciais válidas:**
  - Email: `teste@exemplo.com`
  - Senha: `senha123`
- [ ] **Clicar em "Entrar"**
- [ ] **Verificar:** Redirecionamento para dashboard
- [ ] **Print:** Dashboard após login bem-sucedido
- [ ] **Verificar:** Token JWT salvo no localStorage

### **2.3 Teste de Login Inválido**
- [ ] **Inserir credenciais inválidas:**
  - Email: `invalido@teste.com`
  - Senha: `senhaerrada`
- [ ] **Clicar em "Entrar"**
- [ ] **Verificar:** Mensagem de erro exibida
- [ ] **Print:** Tela com mensagem de erro
- [ ] **Verificar:** Campos não são limpos (para correção)

### **2.4 Tela de Registro**
- [ ] **Clicar em "Não tem conta? Registre-se"**
- [ ] **Print:** Tela de registro completa
- [ ] **Verificar:** Campos: nome, email, senha, confirmar senha
- [ ] **Verificar:** Checkbox "Aceito os termos"
- [ ] **Verificar:** Botão "Criar Conta"
- [ ] **Verificar:** Link "Já tem conta? Faça login"

### **2.5 Teste de Registro Válido**
- [ ] **Preencher formulário:**
  - Nome: `Jogador Teste`
  - Email: `jogador@teste.com`
  - Senha: `senha123`
  - Confirmar Senha: `senha123`
- [ ] **Marcar checkbox** de termos
- [ ] **Clicar em "Criar Conta"**
- [ ] **Verificar:** Redirecionamento para dashboard
- [ ] **Print:** Dashboard após registro bem-sucedido

### **2.6 Teste de Registro Inválido**
- [ ] **Preencher com dados inválidos:**
  - Senhas diferentes
  - Email inválido
  - Campos vazios
- [ ] **Verificar:** Mensagens de validação
- [ ] **Print:** Tela com erros de validação

---

## 📊 **ETAPA 3: DASHBOARD PRINCIPAL**

### **3.1 Tela de Dashboard**
- [ ] **Acessar dashboard** após login
- [ ] **Print:** Dashboard completo
- [ ] **Verificar:** Exibição do saldo atual
- [ ] **Verificar:** Botões principais:
  - [ ] "Jogar" (destacado)
  - [ ] "Depositar"
  - [ ] "Sacar"
  - [ ] "Perfil"
- [ ] **Verificar:** Navegação lateral (hamburger menu)

### **3.2 Informações do Usuário**
- [ ] **Verificar:** Nome do usuário exibido
- [ ] **Verificar:** Saldo atual formatado (R$ X,XX)
- [ ] **Verificar:** Estatísticas básicas
- [ ] **Verificar:** Histórico de apostas recentes

### **3.3 Responsividade do Dashboard**
- [ ] **Testar em mobile** (320px - 768px)
- [ ] **Print:** Dashboard em mobile
- [ ] **Testar em tablet** (768px - 1024px)
- [ ] **Print:** Dashboard em tablet
- [ ] **Testar em desktop** (1024px+)
- [ ] **Print:** Dashboard em desktop

---

## ⚽ **ETAPA 4: SISTEMA DE JOGO**

### **4.1 Acesso ao Jogo**
- [ ] **Clicar em "Jogar"** no dashboard
- [ ] **Print:** Tela de jogo carregando
- [ ] **Verificar:** Redirecionamento para `/game`
- [ ] **Verificar:** Interface do jogo carregada

### **4.2 Tela Principal do Jogo**
- [ ] **Print:** Tela completa do jogo
- [ ] **Verificar:** Campo de futebol visual
- [ ] **Verificar:** 5 zonas de chute numeradas
- [ ] **Verificar:** Goleiro posicionado
- [ ] **Verificar:** Área de apostas
- [ ] **Verificar:** Botões de ação

### **4.3 Sistema de Apostas**
- [ ] **Verificar:** Campo de valor da aposta
- [ ] **Testar valores:**
  - [ ] R$ 5,00 (mínimo)
  - [ ] R$ 50,00 (médio)
  - [ ] R$ 100,00 (máximo)
- [ ] **Verificar:** Validação de valores
- [ ] **Verificar:** Cálculo de prêmio potencial
- [ ] **Print:** Tela com aposta configurada

### **4.4 Execução do Chute**
- [ ] **Configurar aposta** (R$ 10,00)
- [ ] **Clicar em zona de chute** (ex: zona 1)
- [ ] **Print:** Momento do chute
- [ ] **Verificar:** Animação do chute
- [ ] **Verificar:** Feedback visual (gol/erro)
- [ ] **Print:** Resultado do chute

### **4.5 Resultados do Jogo**
- [ ] **Verificar:** Exibição do resultado
- [ ] **Se gol:**
  - [ ] **Verificar:** Cálculo do prêmio
  - [ ] **Verificar:** Atualização do saldo
  - [ ] **Print:** Tela de vitória
- [ ] **Se erro:**
  - [ ] **Verificar:** Mensagem de erro
  - [ ] **Verificar:** Perda da aposta
  - [ ] **Print:** Tela de erro

### **4.6 Múltiplas Partidas**
- [ ] **Jogar 3 partidas consecutivas**
- [ ] **Verificar:** Persistência do saldo
- [ ] **Verificar:** Histórico de jogadas
- [ ] **Print:** Histórico de partidas

---

## 💰 **ETAPA 5: SISTEMA DE PAGAMENTOS**

### **5.1 Acesso aos Pagamentos**
- [ ] **Clicar em "Depositar"** no dashboard
- [ ] **Print:** Tela de depósitos
- [ ] **Verificar:** Formulário de depósito
- [ ] **Verificar:** Valores sugeridos (R$ 10, R$ 25, R$ 50, R$ 100)

### **5.2 Criação de Depósito**
- [ ] **Selecionar valor** (ex: R$ 25,00)
- [ ] **Clicar em "Gerar PIX"**
- [ ] **Print:** Tela com QR Code PIX
- [ ] **Verificar:** QR Code gerado
- [ ] **Verificar:** Código PIX copiável
- [ ] **Verificar:** Instruções de pagamento

### **5.3 Simulação de Pagamento**
- [ ] **Simular pagamento** via Mercado Pago
- [ ] **Verificar:** Webhook de confirmação
- [ ] **Verificar:** Atualização do saldo
- [ ] **Print:** Saldo atualizado após depósito

### **5.4 Histórico de Pagamentos**
- [ ] **Acessar histórico** de pagamentos
- [ ] **Print:** Lista de transações
- [ ] **Verificar:** Status das transações
- [ ] **Verificar:** Valores e datas

---

## 💸 **ETAPA 6: SISTEMA DE SAQUES**

### **6.1 Acesso aos Saques**
- [ ] **Clicar em "Sacar"** no dashboard
- [ ] **Print:** Tela de saques
- [ ] **Verificar:** Formulário de saque
- [ ] **Verificar:** Campos obrigatórios

### **6.2 Solicitação de Saque**
- [ ] **Preencher dados:**
  - Valor: R$ 20,00
  - Chave PIX: teste@exemplo.com
  - Nome: Jogador Teste
- [ ] **Clicar em "Solicitar Saque"**
- [ ] **Print:** Confirmação de saque
- [ ] **Verificar:** Mensagem de confirmação

### **6.3 Aprovação de Saque (Admin)**
- [ ] **Acessar painel admin**
- [ ] **Navegar para saques pendentes**
- [ ] **Aprovar saque** do teste
- [ ] **Verificar:** Notificação de aprovação
- [ ] **Print:** Saque aprovado

---

## 👤 **ETAPA 7: PERFIL DO USUÁRIO**

### **7.1 Acesso ao Perfil**
- [ ] **Clicar em "Perfil"** no dashboard
- [ ] **Print:** Tela de perfil
- [ ] **Verificar:** Informações do usuário
- [ ] **Verificar:** Estatísticas de jogo

### **7.2 Edição de Perfil**
- [ ] **Clicar em "Editar Perfil"**
- [ ] **Modificar dados** (nome, email)
- [ ] **Salvar alterações**
- [ ] **Verificar:** Atualização dos dados
- [ ] **Print:** Perfil atualizado

### **7.3 Histórico de Jogos**
- [ ] **Acessar "Histórico"**
- [ ] **Print:** Lista de jogos
- [ ] **Verificar:** Partidas anteriores
- [ ] **Verificar:** Resultados e prêmios

---

## 🔔 **ETAPA 8: NOTIFICAÇÕES E COMUNICAÇÃO**

### **8.1 Centro de Notificações**
- [ ] **Acessar notificações** (ícone de sino)
- [ ] **Print:** Lista de notificações
- [ ] **Verificar:** Notificações de jogo
- [ ] **Verificar:** Notificações de pagamento

### **8.2 Chat em Tempo Real**
- [ ] **Acessar chat** (se disponível)
- [ ] **Enviar mensagem** de teste
- [ ] **Verificar:** Mensagem exibida
- [ ] **Print:** Interface do chat

---

## 📱 **ETAPA 9: TESTES DE RESPONSIVIDADE**

### **9.1 Mobile (320px - 768px)**
- [ ] **Testar todas as telas** em mobile
- [ ] **Print:** Login em mobile
- [ ] **Print:** Dashboard em mobile
- [ ] **Print:** Jogo em mobile
- [ ] **Verificar:** Navegação touch
- [ ] **Verificar:** Botões acessíveis

### **9.2 Tablet (768px - 1024px)**
- [ ] **Testar todas as telas** em tablet
- [ ] **Print:** Dashboard em tablet
- [ ] **Print:** Jogo em tablet
- [ ] **Verificar:** Layout adaptado

### **9.3 Desktop (1024px+)**
- [ ] **Testar todas as telas** em desktop
- [ ] **Print:** Dashboard em desktop
- [ ] **Print:** Jogo em desktop
- [ ] **Verificar:** Layout otimizado

---

## ⚠️ **ETAPA 10: TESTES DE ERRO E RECUPERAÇÃO**

### **10.1 Conexão Perdida**
- [ ] **Desconectar internet** durante jogo
- [ ] **Verificar:** Mensagem de erro
- [ ] **Reconectar internet**
- [ ] **Verificar:** Recuperação automática
- [ ] **Print:** Tela de erro e recuperação

### **10.2 Dados Inválidos**
- [ ] **Testar valores** de aposta inválidos
- [ ] **Testar campos** obrigatórios vazios
- [ ] **Verificar:** Mensagens de erro apropriadas
- [ ] **Print:** Telas de erro

### **10.3 Timeout de Sessão**
- [ ] **Aguardar** expiração da sessão
- [ ] **Tentar ação** que requer autenticação
- [ ] **Verificar:** Redirecionamento para login
- [ ] **Print:** Tela de sessão expirada

---

## 🔒 **ETAPA 11: TESTES DE SEGURANÇA**

### **11.1 Autenticação**
- [ ] **Tentar acessar** páginas protegidas sem login
- [ ] **Verificar:** Redirecionamento para login
- [ ] **Testar logout** e acesso posterior

### **11.2 Validação de Dados**
- [ ] **Testar injeção** de scripts
- [ ] **Testar caracteres** especiais
- [ ] **Verificar:** Sanitização de dados

### **11.3 Rate Limiting**
- [ ] **Fazer múltiplas** requisições rapidamente
- [ ] **Verificar:** Limitação de taxa
- [ ] **Print:** Tela de rate limit

---

## 📊 **ETAPA 12: MÉTRICAS E PERFORMANCE**

### **12.1 Tempo de Carregamento**
- [ ] **Medir tempo** de carregamento inicial
- [ ] **Medir tempo** de navegação entre páginas
- [ ] **Medir tempo** de resposta do jogo
- [ ] **Verificar:** < 3s para carregamento inicial

### **12.2 Uso de Memória**
- [ ] **Monitorar uso** de memória durante jogo
- [ ] **Verificar:** Sem vazamentos de memória
- [ ] **Testar:** Múltiplas partidas consecutivas

### **12.3 Conectividade**
- [ ] **Testar** com conexão lenta
- [ ] **Testar** com conexão instável
- [ ] **Verificar:** Graceful degradation

---

## ✅ **ETAPA 13: VALIDAÇÃO FINAL**

### **13.1 Checklist de Funcionalidades**
- [ ] **Login/Registro:** ✅ Funcionando
- [ ] **Dashboard:** ✅ Funcionando
- [ ] **Sistema de Jogo:** ✅ Funcionando
- [ ] **Pagamentos:** ✅ Funcionando
- [ ] **Saques:** ✅ Funcionando
- [ ] **Perfil:** ✅ Funcionando
- [ ] **Notificações:** ✅ Funcionando
- [ ] **Responsividade:** ✅ Funcionando

### **13.2 Checklist de Qualidade**
- [ ] **Performance:** ✅ Aceitável
- [ ] **Segurança:** ✅ Implementada
- [ ] **Usabilidade:** ✅ Intuitiva
- [ ] **Acessibilidade:** ✅ Adequada
- [ ] **Compatibilidade:** ✅ Testada

### **13.3 Documentação de Prints**
- [ ] **Todos os prints** capturados
- [ ] **Prints organizados** por etapa
- [ ] **Prints nomeados** adequadamente
- [ ] **Prints salvos** em pasta específica

---

## 📁 **ESTRUTURA DE ARQUIVOS PARA PRINTS**

```
prints-teste-jogador/
├── 01-acesso-inicial/
│   ├── loading-screen.png
│   └── home-page.png
├── 02-autenticacao/
│   ├── login-screen.png
│   ├── login-success.png
│   ├── login-error.png
│   ├── register-screen.png
│   └── register-success.png
├── 03-dashboard/
│   ├── dashboard-desktop.png
│   ├── dashboard-tablet.png
│   └── dashboard-mobile.png
├── 04-jogo/
│   ├── game-screen.png
│   ├── bet-configured.png
│   ├── shot-moment.png
│   ├── goal-result.png
│   └── error-result.png
├── 05-pagamentos/
│   ├── deposit-screen.png
│   ├── pix-qr-code.png
│   └── payment-history.png
├── 06-saques/
│   ├── withdraw-screen.png
│   └── withdraw-confirmation.png
├── 07-perfil/
│   ├── profile-screen.png
│   └── game-history.png
├── 08-notificacoes/
│   ├── notifications-center.png
│   └── chat-screen.png
├── 09-responsividade/
│   ├── mobile-all-screens.png
│   ├── tablet-all-screens.png
│   └── desktop-all-screens.png
├── 10-erros/
│   ├── connection-error.png
│   ├── validation-error.png
│   └── session-timeout.png
└── 11-seguranca/
    ├── unauthorized-access.png
    └── rate-limit.png
```

---

## 🎯 **CRITÉRIOS DE APROVAÇÃO**

### **✅ APROVADO**
- [ ] **100% das funcionalidades** testadas
- [ ] **Todos os prints** capturados
- [ ] **Responsividade** validada
- [ ] **Performance** aceitável
- [ ] **Segurança** implementada
- [ ] **Usabilidade** intuitiva

### **❌ REPROVADO**
- [ ] Qualquer funcionalidade crítica não funcionando
- [ ] Problemas de segurança identificados
- [ ] Performance inaceitável
- [ ] Responsividade quebrada
- [ ] Falhas de integração com backend

---

## 📋 **RELATÓRIO FINAL**

### **📊 Resumo dos Testes**
- **Total de Etapas:** 13
- **Total de Testes:** 100+
- **Funcionalidades Testadas:** 7 principais
- **Dispositivos Testados:** 3 (mobile, tablet, desktop)
- **Cenários de Erro:** 5

### **✅ Status Final**
- [ ] **TESTES CONCLUÍDOS**
- [ ] **TODOS OS PRINTS CAPTURADOS**
- [ ] **SISTEMA APROVADO PARA PRODUÇÃO**

---

**Checklist gerado automaticamente pelo Cursor MCP System**  
**Timestamp:** 2025-01-07T23:58:00Z  
**Status:** ✅ PRONTO PARA EXECUÇÃO  
**Próximo Passo:** 🎮 EXECUTAR TESTES COM PRINTS
