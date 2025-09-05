# 🚀 GUIA DE DEPLOY E DEVOPS - GOL DE OURO

## 📋 **VISÃO GERAL**

Este guia fornece instruções completas para deploy e DevOps do sistema Gol de Ouro, incluindo containerização, CI/CD, monitoramento e produção.

---

## 🐳 **DOCKER E CONTAINERIZAÇÃO**

### **Estrutura de Containers:**
- **Backend**: API Node.js na porta 3000
- **Player**: Frontend React na porta 5174
- **Admin**: Frontend Admin na porta 5173
- **Nginx**: Reverse Proxy na porta 80/443
- **Redis**: Cache e sessões na porta 6379
- **PostgreSQL**: Banco de dados na porta 5432

### **Comandos Docker:**

```bash
# Construir todas as imagens
docker-compose build

# Iniciar aplicação
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar aplicação
docker-compose down

# Reiniciar containers
docker-compose restart
```

---

## 🔄 **CI/CD COM GITHUB ACTIONS**

### **Workflow Automatizado:**
1. **Testes**: Executa testes unitários e linting
2. **Build**: Constrói imagens Docker
3. **Deploy**: Deploy automático para produção
4. **Notificação**: Notifica status via Slack

### **Configuração:**
- **Arquivo**: `.github/workflows/deploy.yml`
- **Triggers**: Push para `main` e `develop`
- **Registry**: GitHub Container Registry

---

## 🏗️ **AMBIENTE DE PRODUÇÃO**

### **Requisitos do Servidor:**
- **OS**: Ubuntu 20.04+ ou CentOS 8+
- **RAM**: Mínimo 4GB, recomendado 8GB+
- **CPU**: Mínimo 2 cores, recomendado 4 cores+
- **Storage**: Mínimo 50GB SSD
- **Docker**: 20.10+
- **Docker Compose**: 2.0+

### **Configuração de Produção:**

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/goldeouro.git
cd goldeouro

# 2. Configurar variáveis de ambiente
cp .env.example .env
nano .env

# 3. Gerar certificados SSL
./scripts/generate-ssl.sh

# 4. Iniciar aplicação
./scripts/start.sh

# 5. Iniciar com monitoramento
./scripts/start.sh --with-monitoring
```

---

## 📊 **MONITORAMENTO**

### **Ferramentas:**
- **Prometheus**: Coleta de métricas
- **Grafana**: Dashboards e visualização
- **Node Exporter**: Métricas do sistema
- **cAdvisor**: Métricas de containers

### **Acessos:**
- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Node Exporter**: http://localhost:9100
- **cAdvisor**: http://localhost:8080

### **Métricas Monitoradas:**
- CPU, RAM, Disco
- Requisições HTTP
- Tempo de resposta
- Erros e exceções
- Uso de banco de dados

---

## 🔐 **SEGURANÇA**

### **SSL/TLS:**
- Certificados auto-assinados para desenvolvimento
- Let's Encrypt para produção
- Headers de segurança configurados

### **Firewall:**
```bash
# Portas abertas
80/tcp   # HTTP
443/tcp  # HTTPS
22/tcp   # SSH
```

### **Backup:**
- Backup automático diário
- Retenção de 7 dias
- Upload para S3 (opcional)

---

## 🛠️ **SCRIPTS DISPONÍVEIS**

### **Deploy:**
```bash
./scripts/deploy.sh [environment]
```

### **Backup:**
```bash
./scripts/backup.sh
```

### **SSL:**
```bash
./scripts/generate-ssl.sh
```

### **Inicialização:**
```bash
./scripts/start.sh [--with-monitoring]
```

---

## 📈 **ESCALABILIDADE**

### **Horizontal Scaling:**
- Load balancer com Nginx
- Múltiplas instâncias do backend
- Redis para sessões compartilhadas

### **Vertical Scaling:**
- Aumentar recursos do servidor
- Otimizar configurações Docker
- Ajustar limites de memória

---

## 🔧 **TROUBLESHOOTING**

### **Problemas Comuns:**

#### **Container não inicia:**
```bash
docker-compose logs [container-name]
docker-compose ps
```

#### **Porta em uso:**
```bash
netstat -tulpn | grep :3000
sudo kill -9 [PID]
```

#### **Problemas de SSL:**
```bash
./scripts/generate-ssl.sh
docker-compose restart nginx
```

#### **Problemas de banco:**
```bash
docker-compose exec postgres psql -U goldeouro -d goldeouro
```

---

## 📋 **CHECKLIST DE DEPLOY**

### **Pré-Deploy:**
- [ ] Testes passando
- [ ] Variáveis de ambiente configuradas
- [ ] Certificados SSL gerados
- [ ] Backup do banco atual

### **Deploy:**
- [ ] Containers iniciados
- [ ] Health checks passando
- [ ] Endpoints respondendo
- [ ] Logs sem erros

### **Pós-Deploy:**
- [ ] Monitoramento ativo
- [ ] Backup configurado
- [ ] Documentação atualizada
- [ ] Equipe notificada

---

## 🚀 **PRÓXIMOS PASSOS**

### **Melhorias Futuras:**
1. **Kubernetes**: Orquestração de containers
2. **Terraform**: Infraestrutura como código
3. **Ansible**: Automação de configuração
4. **ELK Stack**: Logs centralizados
5. **Jaeger**: Distributed tracing

---

## ✅ **STATUS FINAL**

### **🎉 INFRAESTRUTURA DE DEVOPS IMPLEMENTADA!**

**Sistema completo de deploy e DevOps:**
- ✅ **Docker**: Containerização completa
- ✅ **CI/CD**: GitHub Actions configurado
- ✅ **Monitoramento**: Prometheus + Grafana
- ✅ **Backup**: Scripts automáticos
- ✅ **Segurança**: SSL e headers configurados
- ✅ **Produção**: Ambiente pronto para deploy

**O sistema Gol de Ouro agora possui uma infraestrutura robusta e escalável para produção!**

---

**🚀 DEPLOY E DEVOPS IMPLEMENTADOS COM SUCESSO!**
