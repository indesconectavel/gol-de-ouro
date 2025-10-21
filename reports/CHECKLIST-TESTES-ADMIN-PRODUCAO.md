# 🛠️ CHECKLIST DE TESTES - PAINEL ADMIN EM PRODUÇÃO

**Data:** 2025-01-07T23:58:00Z  
**Versão:** GO-LIVE v1.1.1  
**Objetivo:** Validação completa do painel administrativo com prints de cada tela  
**Autor:** Cursor MCP System  

---

## 📋 **RESUMO EXECUTIVO**

Este checklist contém **todas as funcionalidades** do painel administrativo que devem ser validadas em produção. Cada funcionalidade deve ser **testada e documentada com prints** para garantir que o sistema de administração está funcionando corretamente.

### 🎯 **OBJETIVOS**
- ✅ Validar **100% das funcionalidades** administrativas
- ✅ Documentar **cada tela** com prints
- ✅ Verificar **controle de acesso** e permissões
- ✅ Testar **gestão de dados** e operações
- ✅ Confirmar **integração** com backend

---

## 🚀 **ETAPA 1: ACESSO E AUTENTICAÇÃO ADMIN**

### **1.1 Tela de Login Admin**
- [ ] **Acessar URL de produção** do admin
- [ ] **Print:** Tela de login administrativo
- [ ] **Verificar:** Campos de email e senha
- [ ] **Verificar:** Botão "Entrar" estilizado
- [ ] **Verificar:** Logo e branding do admin
- [ ] **Verificar:** Design responsivo

**URLs para testar:**
- Produção: `https://admin.goldeouro.vercel.app`
- Staging: `https://admin-staging.goldeouro.vercel.app`

### **1.2 Login com Credenciais Admin**
- [ ] **Inserir credenciais administrativas:**
  - Email: `admin@goldeouro.com`
  - Senha: `admin123`
- [ ] **Clicar em "Entrar"**
- [ ] **Verificar:** Redirecionamento para dashboard admin
- [ ] **Print:** Dashboard administrativo após login
- [ ] **Verificar:** Token JWT de admin salvo

### **1.3 Controle de Acesso**
- [ ] **Tentar acessar** sem login
- [ ] **Verificar:** Redirecionamento para login
- [ ] **Tentar acessar** com credenciais de usuário comum
- [ ] **Verificar:** Bloqueio de acesso
- [ ] **Print:** Tela de acesso negado

---

## 📊 **ETAPA 2: DASHBOARD ADMINISTRATIVO**

### **2.1 Dashboard Principal**
- [ ] **Acessar dashboard** após login admin
- [ ] **Print:** Dashboard administrativo completo
- [ ] **Verificar:** Métricas principais:
  - [ ] Total de usuários
  - [ ] Total de jogos
  - [ ] Receita total
  - [ ] Saques pendentes
- [ ] **Verificar:** Gráficos e estatísticas
- [ ] **Verificar:** Navegação lateral

### **2.2 Cards de Métricas**
- [ ] **Verificar:** Card "Usuários Ativos"
- [ ] **Verificar:** Card "Jogos Hoje"
- [ ] **Verificar:** Card "Receita Total"
- [ ] **Verificar:** Card "Saques Pendentes"
- [ ] **Print:** Cards de métricas
- [ ] **Verificar:** Valores atualizados em tempo real

### **2.3 Gráficos e Relatórios**
- [ ] **Verificar:** Gráfico de usuários por período
- [ ] **Verificar:** Gráfico de receita por período
- [ ] **Verificar:** Gráfico de jogos por período
- [ ] **Print:** Seção de gráficos
- [ ] **Testar:** Filtros de período (7 dias, 30 dias, 90 dias)

---

## 👥 **ETAPA 3: GESTÃO DE USUÁRIOS**

### **3.1 Lista de Usuários**
- [ ] **Clicar em "Usuários"** na navegação
- [ ] **Print:** Lista completa de usuários
- [ ] **Verificar:** Tabela com colunas:
  - [ ] ID
  - [ ] Nome
  - [ ] Email
  - [ ] Saldo
  - [ ] Status
  - [ ] Data de Cadastro
  - [ ] Ações
- [ ] **Verificar:** Paginação funcionando
- [ ] **Verificar:** Filtros de busca

### **3.2 Busca e Filtros de Usuários**
- [ ] **Testar busca** por nome
- [ ] **Testar busca** por email
- [ ] **Testar filtro** por status (ativo/inativo)
- [ ] **Testar filtro** por data de cadastro
- [ ] **Print:** Resultados da busca
- [ ] **Verificar:** Resultados atualizados

### **3.3 Visualização de Usuário**
- [ ] **Clicar em "Ver"** em um usuário
- [ ] **Print:** Detalhes do usuário
- [ ] **Verificar:** Informações completas:
  - [ ] Dados pessoais
  - [ ] Histórico de jogos
  - [ ] Histórico de pagamentos
  - [ ] Histórico de saques
  - [ ] Estatísticas de jogo

### **3.4 Edição de Usuário**
- [ ] **Clicar em "Editar"** em um usuário
- [ ] **Print:** Formulário de edição
- [ ] **Modificar dados:**
  - [ ] Nome
  - [ ] Email
  - [ ] Status (ativo/inativo)
  - [ ] Saldo (se necessário)
- [ ] **Salvar alterações**
- [ ] **Verificar:** Atualização na lista

### **3.5 Bloqueio/Desbloqueio de Usuário**
- [ ] **Clicar em "Bloquear"** em um usuário
- [ ] **Print:** Confirmação de bloqueio
- [ ] **Confirmar bloqueio**
- [ ] **Verificar:** Status alterado para "Bloqueado"
- [ ] **Testar desbloqueio**
- [ ] **Verificar:** Status alterado para "Ativo"

### **3.6 Adicionar Novo Usuário**
- [ ] **Clicar em "Adicionar Usuário"**
- [ ] **Print:** Formulário de novo usuário
- [ ] **Preencher dados:**
  - [ ] Nome: "Usuário Teste Admin"
  - [ ] Email: "teste-admin@exemplo.com"
  - [ ] Senha: "senha123"
  - [ ] Saldo inicial: R$ 50,00
- [ ] **Salvar usuário**
- [ ] **Verificar:** Usuário adicionado à lista

### **3.7 Exportação de Dados**
- [ ] **Clicar em "Exportar"** na lista de usuários
- [ ] **Print:** Opções de exportação
- [ ] **Testar exportação** em CSV
- [ ] **Testar exportação** em Excel
- [ ] **Verificar:** Arquivo baixado corretamente

---

## 🎮 **ETAPA 4: GESTÃO DE JOGOS**

### **4.1 Lista de Jogos**
- [ ] **Clicar em "Jogos"** na navegação
- [ ] **Print:** Lista de jogos
- [ ] **Verificar:** Tabela com colunas:
  - [ ] ID do Jogo
  - [ ] Jogadores
  - [ ] Valor Total Apostado
  - [ ] Prêmio Distribuído
  - [ ] Status
  - [ ] Data/Hora
  - [ ] Ações
- [ ] **Verificar:** Filtros por status e período

### **4.2 Detalhes do Jogo**
- [ ] **Clicar em "Ver"** em um jogo
- [ ] **Print:** Detalhes completos do jogo
- [ ] **Verificar:** Informações:
  - [ ] Lista de jogadores
  - [ ] Apostas de cada jogador
  - [ ] Resultados dos chutes
  - [ ] Prêmios distribuídos
  - [ ] Timestamp do jogo

### **4.3 Estatísticas de Jogos**
- [ ] **Acessar "Estatísticas"** de jogos
- [ ] **Print:** Página de estatísticas
- [ ] **Verificar:** Métricas:
  - [ ] Total de jogos
  - [ ] Jogos por período
  - [ ] Valor médio apostado
  - [ ] Taxa de vitória
  - [ ] Receita da casa

### **4.4 Gerenciamento de Jogos Ativos**
- [ ] **Verificar jogos** em andamento
- [ ] **Testar pausar** jogo ativo
- [ ] **Testar finalizar** jogo ativo
- [ ] **Print:** Ações de gerenciamento
- [ ] **Verificar:** Notificações enviadas

---

## 💰 **ETAPA 5: GESTÃO DE PAGAMENTOS**

### **5.1 Lista de Pagamentos**
- [ ] **Clicar em "Pagamentos"** na navegação
- [ ] **Print:** Lista de pagamentos
- [ ] **Verificar:** Tabela com colunas:
  - [ ] ID da Transação
  - [ ] Usuário
  - [ ] Valor
  - [ ] Tipo (Depósito/Saque)
  - [ ] Status
  - [ ] Data/Hora
  - [ ] Ações
- [ ] **Verificar:** Filtros por tipo e status

### **5.2 Detalhes de Pagamento**
- [ ] **Clicar em "Ver"** em um pagamento
- [ ] **Print:** Detalhes do pagamento
- [ ] **Verificar:** Informações:
  - [ ] Dados do usuário
  - [ ] Valor e moeda
  - [ ] Método de pagamento
  - [ ] Status atual
  - [ ] Histórico de status
  - [ ] Dados do PIX (se aplicável)

### **5.3 Aprovação de Saques**
- [ ] **Filtrar por "Saques Pendentes"**
- [ ] **Print:** Lista de saques pendentes
- [ ] **Clicar em "Aprovar"** em um saque
- [ ] **Print:** Confirmação de aprovação
- [ ] **Confirmar aprovação**
- [ ] **Verificar:** Status alterado para "Aprovado"
- [ ] **Verificar:** Notificação enviada ao usuário

### **5.4 Rejeição de Saques**
- [ ] **Clicar em "Rejeitar"** em um saque
- [ ] **Print:** Formulário de rejeição
- [ ] **Inserir motivo** da rejeição
- [ ] **Confirmar rejeição**
- [ ] **Verificar:** Status alterado para "Rejeitado"
- [ ] **Verificar:** Notificação enviada ao usuário

### **5.5 Relatórios de Pagamentos**
- [ ] **Acessar "Relatórios"** de pagamentos
- [ ] **Print:** Página de relatórios
- [ ] **Verificar:** Relatórios disponíveis:
  - [ ] Receita por período
  - [ ] Saques por período
  - [ ] Métodos de pagamento
  - [ ] Taxa de aprovação
- [ ] **Testar exportação** de relatórios

---

## 📊 **ETAPA 6: ANALYTICS E RELATÓRIOS**

### **6.1 Dashboard de Analytics**
- [ ] **Clicar em "Analytics"** na navegação
- [ ] **Print:** Dashboard de analytics
- [ ] **Verificar:** Gráficos principais:
  - [ ] Usuários ativos por dia
  - [ ] Receita por dia
  - [ ] Jogos por hora
  - [ ] Conversão de usuários
- [ ] **Testar filtros** de período

### **6.2 Relatórios Personalizados**
- [ ] **Acessar "Relatórios Personalizados"**
- [ ] **Print:** Interface de criação de relatórios
- [ ] **Criar relatório** personalizado:
  - [ ] Selecionar métricas
  - [ ] Definir período
  - [ ] Aplicar filtros
- [ ] **Gerar relatório**
- [ ] **Print:** Relatório gerado

### **6.3 Exportação de Dados**
- [ ] **Testar exportação** de analytics
- [ ] **Testar exportação** de relatórios
- [ ] **Verificar:** Formatos disponíveis (CSV, Excel, PDF)
- [ ] **Print:** Opções de exportação

---

## ⚙️ **ETAPA 7: CONFIGURAÇÕES DO SISTEMA**

### **7.1 Configurações Gerais**
- [ ] **Clicar em "Configurações"** na navegação
- [ ] **Print:** Página de configurações
- [ ] **Verificar:** Configurações disponíveis:
  - [ ] Configurações de jogo
  - [ ] Configurações de pagamento
  - [ ] Configurações de notificação
  - [ ] Configurações de segurança

### **7.2 Configurações de Jogo**
- [ ] **Acessar "Configurações de Jogo"**
- [ ] **Print:** Configurações de jogo
- [ ] **Verificar:** Parâmetros:
  - [ ] Valor mínimo de aposta
  - [ ] Valor máximo de aposta
  - [ ] Taxa da casa
  - [ ] Tempo limite de jogo
- [ ] **Modificar configurações**
- [ ] **Salvar alterações**

### **7.3 Configurações de Pagamento**
- [ ] **Acessar "Configurações de Pagamento"**
- [ ] **Print:** Configurações de pagamento
- [ ] **Verificar:** Parâmetros:
  - [ ] Chaves PIX
  - [ ] Taxas de transação
  - [ ] Limites de saque
  - [ ] Configurações do Mercado Pago
- [ ] **Testar validação** de configurações

### **7.4 Configurações de Segurança**
- [ ] **Acessar "Configurações de Segurança"**
- [ ] **Print:** Configurações de segurança
- [ ] **Verificar:** Parâmetros:
  - [ ] Políticas de senha
  - [ ] Timeout de sessão
  - [ ] Rate limiting
  - [ ] Logs de auditoria
- [ ] **Modificar configurações** de segurança

---

## 🔔 **ETAPA 8: SISTEMA DE NOTIFICAÇÕES**

### **8.1 Centro de Notificações Admin**
- [ ] **Acessar "Notificações"** na navegação
- [ ] **Print:** Centro de notificações
- [ ] **Verificar:** Tipos de notificações:
  - [ ] Alertas de sistema
  - [ ] Saques pendentes
  - [ ] Erros de pagamento
  - [ ] Atividade suspeita
- [ ] **Testar marcar** como lida

### **8.2 Envio de Notificações**
- [ ] **Clicar em "Enviar Notificação"**
- [ ] **Print:** Formulário de envio
- [ ] **Criar notificação:**
  - [ ] Título: "Teste de Notificação Admin"
  - [ ] Mensagem: "Esta é uma notificação de teste"
  - [ ] Destinatários: Todos os usuários
- [ ] **Enviar notificação**
- [ ] **Verificar:** Notificação enviada

### **8.3 Templates de Notificação**
- [ ] **Acessar "Templates"** de notificação
- [ ] **Print:** Lista de templates
- [ ] **Criar template** personalizado
- [ ] **Editar template** existente
- [ ] **Testar template** com variáveis

---

## 📱 **ETAPA 9: RESPONSIVIDADE E USABILIDADE**

### **9.1 Teste em Mobile**
- [ ] **Acessar admin** em mobile
- [ ] **Print:** Dashboard em mobile
- [ ] **Testar navegação** lateral
- [ ] **Testar tabelas** responsivas
- [ ] **Print:** Lista de usuários em mobile

### **9.2 Teste em Tablet**
- [ ] **Acessar admin** em tablet
- [ ] **Print:** Dashboard em tablet
- [ ] **Testar layout** adaptado
- [ ] **Testar funcionalidades** principais

### **9.3 Teste em Desktop**
- [ ] **Acessar admin** em desktop
- [ ] **Print:** Dashboard em desktop
- [ ] **Testar layout** otimizado
- [ ] **Testar atalhos** de teclado

---

## 🔒 **ETAPA 10: SEGURANÇA E PERMISSÕES**

### **10.1 Controle de Acesso**
- [ ] **Testar logout** e re-login
- [ ] **Testar expiração** de sessão
- [ ] **Testar acesso** com permissões limitadas
- [ ] **Print:** Tela de permissão negada

### **10.2 Auditoria de Ações**
- [ ] **Acessar "Logs de Auditoria"**
- [ ] **Print:** Logs de auditoria
- [ ] **Verificar:** Registro de ações:
  - [ ] Logins de admin
  - [ ] Modificações de usuários
  - [ ] Aprovações de saques
  - [ ] Alterações de configuração
- [ ] **Testar filtros** de logs

### **10.3 Backup e Restauração**
- [ ] **Acessar "Backup"** do sistema
- [ ] **Print:** Interface de backup
- [ ] **Testar backup** manual
- [ ] **Verificar:** Agendamento de backups
- [ ] **Testar restauração** (se disponível)

---

## ⚠️ **ETAPA 11: TESTES DE ERRO E RECUPERAÇÃO**

### **11.1 Cenários de Erro**
- [ ] **Testar conexão** perdida durante operação
- [ ] **Testar dados** inválidos em formulários
- [ ] **Testar timeout** de operações
- [ ] **Print:** Telas de erro
- [ ] **Verificar:** Mensagens de erro apropriadas

### **11.2 Validação de Dados**
- [ ] **Testar campos** obrigatórios vazios
- [ ] **Testar formatos** inválidos
- [ ] **Testar limites** de caracteres
- [ ] **Verificar:** Validação em tempo real

### **11.3 Recuperação de Estado**
- [ ] **Testar refresh** da página
- [ ] **Testar navegação** do browser
- [ ] **Verificar:** Manutenção do estado
- [ ] **Testar recuperação** de formulários

---

## 📊 **ETAPA 12: PERFORMANCE E OTIMIZAÇÃO**

### **12.1 Tempo de Carregamento**
- [ ] **Medir tempo** de carregamento inicial
- [ ] **Medir tempo** de navegação
- [ ] **Medir tempo** de carregamento de listas
- [ ] **Verificar:** < 3s para carregamento inicial

### **12.2 Uso de Recursos**
- [ ] **Monitorar uso** de memória
- [ ] **Monitorar uso** de CPU
- [ ] **Testar** com grandes volumes de dados
- [ ] **Verificar:** Paginação eficiente

### **12.3 Cache e Otimização**
- [ ] **Testar cache** de dados
- [ ] **Testar lazy loading** de componentes
- [ ] **Verificar:** Otimização de imagens
- [ ] **Testar compressão** de dados

---

## ✅ **ETAPA 13: VALIDAÇÃO FINAL**

### **13.1 Checklist de Funcionalidades**
- [ ] **Dashboard:** ✅ Funcionando
- [ ] **Gestão de Usuários:** ✅ Funcionando
- [ ] **Gestão de Jogos:** ✅ Funcionando
- [ ] **Gestão de Pagamentos:** ✅ Funcionando
- [ ] **Analytics:** ✅ Funcionando
- [ ] **Configurações:** ✅ Funcionando
- [ ] **Notificações:** ✅ Funcionando
- [ ] **Segurança:** ✅ Funcionando

### **13.2 Checklist de Qualidade**
- [ ] **Performance:** ✅ Aceitável
- [ ] **Segurança:** ✅ Implementada
- [ ] **Usabilidade:** ✅ Intuitiva
- [ ] **Responsividade:** ✅ Adequada
- [ ] **Acessibilidade:** ✅ Testada

### **13.3 Documentação de Prints**
- [ ] **Todos os prints** capturados
- [ ] **Prints organizados** por funcionalidade
- [ ] **Prints nomeados** adequadamente
- [ ] **Prints salvos** em pasta específica

---

## 📁 **ESTRUTURA DE ARQUIVOS PARA PRINTS**

```
prints-teste-admin/
├── 01-acesso/
│   ├── login-screen.png
│   ├── login-success.png
│   └── access-denied.png
├── 02-dashboard/
│   ├── dashboard-desktop.png
│   ├── dashboard-tablet.png
│   └── dashboard-mobile.png
├── 03-usuarios/
│   ├── users-list.png
│   ├── user-details.png
│   ├── user-edit.png
│   ├── user-block.png
│   └── export-users.png
├── 04-jogos/
│   ├── games-list.png
│   ├── game-details.png
│   └── game-stats.png
├── 05-pagamentos/
│   ├── payments-list.png
│   ├── payment-details.png
│   ├── approve-withdrawal.png
│   └── reject-withdrawal.png
├── 06-analytics/
│   ├── analytics-dashboard.png
│   ├── custom-reports.png
│   └── export-analytics.png
├── 07-configuracoes/
│   ├── settings-main.png
│   ├── game-settings.png
│   ├── payment-settings.png
│   └── security-settings.png
├── 08-notificacoes/
│   ├── notifications-center.png
│   ├── send-notification.png
│   └── notification-templates.png
├── 09-responsividade/
│   ├── mobile-dashboard.png
│   ├── tablet-dashboard.png
│   └── desktop-dashboard.png
├── 10-seguranca/
│   ├── audit-logs.png
│   ├── backup-interface.png
│   └── permission-denied.png
├── 11-erros/
│   ├── connection-error.png
│   ├── validation-error.png
│   └── timeout-error.png
└── 12-performance/
    ├── loading-times.png
    └── resource-usage.png
```

---

## 🎯 **CRITÉRIOS DE APROVAÇÃO**

### **✅ APROVADO**
- [ ] **100% das funcionalidades** testadas
- [ ] **Todos os prints** capturados
- [ ] **Controle de acesso** funcionando
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
- **Total de Testes:** 120+
- **Funcionalidades Testadas:** 8 principais
- **Dispositivos Testados:** 3 (mobile, tablet, desktop)
- **Cenários de Segurança:** 5

### **✅ Status Final**
- [ ] **TESTES CONCLUÍDOS**
- [ ] **TODOS OS PRINTS CAPTURADOS**
- [ ] **PAINEL ADMIN APROVADO PARA PRODUÇÃO**

---

**Checklist gerado automaticamente pelo Cursor MCP System**  
**Timestamp:** 2025-01-07T23:58:00Z  
**Status:** ✅ PRONTO PARA EXECUÇÃO  
**Próximo Passo:** 🛠️ EXECUTAR TESTES COM PRINTS
