# 🚀 Pipeline GitHub Actions - Gol de Ouro

## 📋 Visão Geral

Este pipeline GitHub Actions automatiza todo o processo de desenvolvimento, teste e deploy do projeto Gol de Ouro, garantindo qualidade, segurança e monitoramento contínuo.

## 🔧 Workflows Disponíveis

### 1. 🚀 Pipeline Principal (`main-pipeline.yml`)
**Trigger:** Push para `main`/`dev`, Pull Requests, Execução manual
**Função:** Orquestra todo o processo de CI/CD

**Jobs:**
- 🔍 **Análise e Validação:** Verifica código, segurança e estrutura
- 🧪 **Testes:** Executa todos os tipos de teste
- 🚀 **Deploy Backend:** Deploy para Fly.io (produção)
- 🎨 **Deploy Frontend:** Deploy para Vercel (produção)
- 📊 **Monitoramento:** Verifica saúde pós-deploy
- 🔄 **Deploy Dev:** Deploy para ambiente de desenvolvimento

### 2. 🚀 Deploy Backend (`backend-deploy.yml`)
**Trigger:** Mudanças em arquivos backend
**Função:** Deploy específico do backend para Fly.io

**Jobs:**
- 🧪 **Testes e Análise:** Validação completa do backend
- 🚀 **Deploy Produção:** Deploy para produção
- 🔄 **Deploy Desenvolvimento:** Deploy para dev

### 3. 🎨 Deploy Frontend (`frontend-deploy.yml`)
**Trigger:** Mudanças em arquivos frontend
**Função:** Deploy específico do frontend para Vercel

**Jobs:**
- 🧪 **Testes Frontend:** Validação do frontend
- 🚀 **Deploy Produção:** Deploy para produção
- 🔄 **Deploy Desenvolvimento:** Deploy para dev
- 📱 **Build APK:** Geração do APK Android

### 4. 🧪 Testes Automatizados (`tests.yml`)
**Trigger:** Push, Pull Requests, Agendado (diário)
**Função:** Execução completa de testes

**Jobs:**
- 🧪 **Testes Backend:** Unitários, integração, API
- 🧪 **Testes Frontend:** Unitários, componentes, E2E
- 🔒 **Testes de Segurança:** Autenticação, autorização, validação
- ⚡ **Testes de Performance:** Carga, stress, análise
- 📊 **Relatório de Testes:** Consolidação de resultados

### 5. 🔒 Segurança e Qualidade (`security.yml`)
**Trigger:** Push, Pull Requests, Agendado (diário)
**Função:** Análise de segurança e qualidade de código

**Jobs:**
- 🔒 **Análise de Segurança:** CodeQL, vulnerabilidades, secrets
- 📊 **Análise de Qualidade:** ESLint, Prettier, TypeScript
- 🧪 **Testes de Segurança:** Validação de segurança
- 📊 **Relatório de Segurança:** Consolidação de resultados

### 6. 📊 Monitoramento (`monitoring.yml`)
**Trigger:** Push para `main`, Agendado (15min), Execução manual
**Função:** Monitoramento contínuo do sistema

**Jobs:**
- 📊 **Monitoramento de Saúde:** Verificação de endpoints
- 📊 **Monitoramento de Performance:** Análise de performance
- 📊 **Monitoramento de Logs:** Coleta e análise de logs
- 📊 **Relatório de Monitoramento:** Consolidação de métricas
- 🚨 **Alertas:** Notificações de problemas

## 🔐 Secrets Necessários

Configure os seguintes secrets no GitHub:

### Fly.io
- `FLY_API_TOKEN`: Token de API do Fly.io

### Vercel
- `VERCEL_TOKEN`: Token de API do Vercel
- `VERCEL_ORG_ID`: ID da organização Vercel
- `VERCEL_PROJECT_ID`: ID do projeto Vercel

### Opcional (Alertas)
- `SLACK_WEBHOOK_URL`: Webhook do Slack para alertas
- `DISCORD_WEBHOOK_URL`: Webhook do Discord para alertas

## 📊 Métricas e Relatórios

### Relatórios Gerados
- 📊 **Relatório de Testes:** `test-report.md`
- 🔒 **Relatório de Segurança:** `security-report.md`
- 📊 **Relatório de Monitoramento:** `monitoring-report.md`
- 📱 **APK Android:** `goldeouro-apk.zip`

### Métricas Monitoradas
- ✅ **Saúde dos Serviços:** Status HTTP dos endpoints
- ⚡ **Performance:** Tempo de resposta, Lighthouse scores
- 📊 **Logs:** Contagem de erros, warnings, info
- 🔒 **Segurança:** Vulnerabilidades, CodeQL findings

## 🚀 Como Usar

### Deploy Automático
1. **Push para `main`:** Deploy automático para produção
2. **Push para `dev`:** Deploy automático para desenvolvimento
3. **Pull Request:** Execução de testes e validações

### Deploy Manual
1. Acesse **Actions** no GitHub
2. Selecione o workflow desejado
3. Clique em **Run workflow**
4. Escolha a branch e clique em **Run**

### Monitoramento
- **Dashboard:** Acesse a aba Actions para ver status
- **Logs:** Clique em qualquer job para ver logs detalhados
- **Artefatos:** Baixe relatórios e APKs na seção Artifacts

## 🔧 Configuração Local

### Pré-requisitos
```bash
# Instalar dependências
npm install

# Instalar dependências do frontend
cd goldeouro-player && npm install

# Executar testes localmente
npm run test:unit
npm run test:integration
npm run test:security
npm run test:performance
```

### Scripts Disponíveis
```bash
# Testes
npm run test:unit          # Testes unitários
npm run test:integration   # Testes de integração
npm run test:api           # Testes de API
npm run test:security      # Testes de segurança
npm run test:performance   # Testes de performance

# Qualidade
npm run lint               # Análise de código
npm run lint:fix           # Correção automática
npm run audit              # Análise de segurança

# Deploy
npm run deploy             # Validação pré-deploy
```

## 📈 Status dos Workflows

### ✅ Funcionando
- 🚀 Deploy Backend (Fly.io)
- 🎨 Deploy Frontend (Vercel)
- 🧪 Testes Automatizados
- 🔒 Análise de Segurança
- 📊 Monitoramento

### 🔄 Em Desenvolvimento
- 📱 Build APK Android
- 🚨 Sistema de Alertas
- 📊 Dashboard de Métricas

## 🛠️ Troubleshooting

### Problemas Comuns

#### Deploy Falha
1. Verificar logs do workflow
2. Confirmar secrets configurados
3. Validar estrutura do projeto

#### Testes Falham
1. Executar testes localmente
2. Verificar dependências
3. Revisar configuração Jest

#### Monitoramento Não Funciona
1. Verificar URLs dos endpoints
2. Confirmar conectividade
3. Revisar configuração de alertas

### Logs Importantes
- **Deploy:** Logs de build e deploy
- **Testes:** Resultados de todos os testes
- **Segurança:** Vulnerabilidades encontradas
- **Monitoramento:** Status dos serviços

## 📞 Suporte

Para problemas ou dúvidas:
1. Verificar logs do GitHub Actions
2. Consultar documentação dos workflows
3. Revisar configuração de secrets
4. Executar testes localmente

---

**🎯 Pipeline GitHub Actions - Gol de Ouro v1.0**
**📅 Última atualização:** $(date)
**👨‍💻 Desenvolvido por:** Fred Silva
