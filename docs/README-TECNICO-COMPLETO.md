# 📚 **DOCUMENTAÇÃO TÉCNICA COMPLETA - GOL DE OURO v2.0**

## 📋 **ÍNDICE**

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [API Documentation](#api-documentation)
4. [Guia de Deploy](#guia-de-deploy)
5. [Guia de Desenvolvimento](#guia-de-desenvolvimento)
6. [Troubleshooting](#troubleshooting)
7. [Monitoramento](#monitoramento)

---

## 🎯 **VISÃO GERAL**

### **Sobre o Projeto**
Gol de Ouro é um jogo de apostas online baseado em cobranças de pênalti de futebol. Os jogadores podem apostar em diferentes zonas do gol e ganhar prêmios baseados na precisão de seus chutes.

### **Tecnologias Utilizadas**
- **Backend**: Node.js + Express + Supabase
- **Frontend**: React + Vite + PWA
- **Pagamentos**: Mercado Pago PIX
- **Deploy**: Fly.io (Backend) + Vercel (Frontend)
- **Monitoramento**: Winston + Métricas customizadas

### **Funcionalidades Principais**
- ✅ Sistema de autenticação completo
- ✅ Jogo de pênalti com 5 zonas
- ✅ Sistema de apostas
- ✅ Pagamentos PIX integrados
- ✅ Sistema de premiação
- ✅ Dashboard de administração

---

## 🏗️ **ARQUITETURA DO SISTEMA**

### **Diagrama de Arquitetura**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React PWA)   │◄──►│   (Node.js)     │◄──►│   (Supabase)    │
│                 │    │                 │    │                 │
│ • Login/Registro│    │ • API REST      │    │ • Users         │
│ • Jogo          │    │ • WebSocket     │    │ • Games         │
│ • Pagamentos    │    │ • Auth JWT      │    │ • Transactions  │
│ • Dashboard     │    │ • Game Logic    │    │ • Payments      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel CDN    │    │   Fly.io        │    │   Mercado Pago  │
│   (Frontend)    │    │   (Backend)     │    │   (PIX)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Componentes Principais**

#### **Frontend (React PWA)**
- **Páginas**: Login, Registro, Jogo, Pagamentos, Dashboard
- **Componentes**: GameField, BettingControls, AudioControls
- **Hooks**: useGame, useAuth, useSound
- **Serviços**: API Client, Payment Service

#### **Backend (Node.js)**
- **Controllers**: Auth, Game, Payment, User
- **Services**: PIX Service, Game Service, Auth Service
- **Middleware**: Auth, Logging, Rate Limiting
- **Routes**: API REST endpoints

#### **Database (Supabase)**
- **Tabelas**: users, games, transactions, payments
- **RLS**: Row Level Security implementado
- **Triggers**: Atualização automática de saldos

---

## 🔌 **API DOCUMENTATION**

### **Base URL**
```
Production: https://goldeouro-backend.fly.dev
Development: http://localhost:8080
```

### **Autenticação**
Todos os endpoints protegidos requerem o header:
```
Authorization: Bearer <jwt_token>
```

### **Endpoints Principais**

#### **Autenticação**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "username": "username"
}

Response:
{
  "success": true,
  "message": "Usuário registrado com sucesso!",
  "token": "jwt_token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "balance": 0
  }
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "Login realizado com sucesso!",
  "token": "jwt_token",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "username",
    "balance": 100
  }
}
```

#### **Jogo**
```http
POST /api/games/fila/entrar
Authorization: Bearer <token>
Content-Type: application/json

{
  "user_id": 1
}

Response:
{
  "success": true,
  "message": "Entrou na fila na posição 3",
  "data": {
    "game_id": 123,
    "position": 3,
    "players_count": 3,
    "game_status": "waiting"
  }
}
```

```http
POST /api/games/shoot
Authorization: Bearer <token>
Content-Type: application/json

{
  "direction": "TL",
  "amount": 10
}

Response:
{
  "success": true,
  "direction": "TL",
  "amount": 10,
  "isGoal": true,
  "prize": 20,
  "newBalance": 110,
  "message": "GOL! ⚽"
}
```

#### **Pagamentos**
```http
POST /api/payments/pix/criar
Authorization: Bearer <token>
Content-Type: application/json

{
  "amount": 50,
  "description": "Recarga de saldo"
}

Response:
{
  "success": true,
  "message": "Pagamento PIX criado com sucesso",
  "data": {
    "payment_id": 1,
    "amount": 50,
    "status": "pending",
    "pix_code": "00020126580014br.gov.bcb.pix...",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "expires_at": "2025-01-02T15:30:00.000Z"
  }
}
```

---

## 🚀 **GUIA DE DEPLOY**

### **Pré-requisitos**
- Node.js 18+
- Git
- Conta no Fly.io
- Conta no Vercel
- Conta no Supabase
- Conta no Mercado Pago

### **Deploy do Backend (Fly.io)**

1. **Instalar Fly CLI**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login no Fly.io**
```bash
fly auth login
```

3. **Configurar variáveis de ambiente**
```bash
fly secrets set JWT_SECRET=your_jwt_secret
fly secrets set SUPABASE_URL=your_supabase_url
fly secrets set SUPABASE_ANON_KEY=your_supabase_key
fly secrets set MP_ACCESS_TOKEN=your_mercado_pago_token
```

4. **Deploy**
```bash
fly deploy
```

### **Deploy do Frontend (Vercel)**

1. **Instalar Vercel CLI**
```bash
npm i -g vercel
```

2. **Login no Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
cd frontend
vercel --prod
```

### **Configuração do Banco (Supabase)**

1. **Executar Schema**
```sql
-- Executar o arquivo schema-supabase.sql
-- Configurar RLS policies
-- Configurar triggers
```

2. **Configurar Webhooks**
```
URL: https://goldeouro-backend.fly.dev/api/payments/pix/webhook
Eventos: payment
```

---

## 💻 **GUIA DE DESENVOLVIMENTO**

### **Setup Local**

1. **Clone o repositório**
```bash
git clone https://github.com/your-repo/goldeouro.git
cd goldeouro
```

2. **Instalar dependências**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Configurar variáveis de ambiente**
```bash
# Backend (.env)
JWT_SECRET=your_jwt_secret
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
MP_ACCESS_TOKEN=your_mercado_pago_token

# Frontend (.env)
VITE_API_BASE_URL=http://localhost:8080
```

4. **Executar em desenvolvimento**
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### **Estrutura de Código**

#### **Backend**
```
backend/
├── src/
│   ├── controllers/     # Controladores
│   ├── services/        # Lógica de negócio
│   ├── models/          # Modelos de dados
│   ├── middleware/      # Middlewares
│   ├── routes/          # Rotas
│   ├── utils/           # Utilitários
│   └── config/          # Configurações
├── tests/               # Testes
└── docs/                # Documentação
```

#### **Frontend**
```
frontend/
├── src/
│   ├── components/      # Componentes
│   ├── pages/           # Páginas
│   ├── hooks/           # Custom hooks
│   ├── services/        # Serviços
│   ├── utils/           # Utilitários
│   └── contexts/        # Contextos
├── tests/               # Testes
└── docs/                # Documentação
```

### **Convenções de Código**

#### **Nomenclatura**
- **Arquivos**: camelCase (ex: `userService.js`)
- **Componentes**: PascalCase (ex: `GameField.jsx`)
- **Variáveis**: camelCase (ex: `userBalance`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `API_BASE_URL`)

#### **Estrutura de Commits**
```
feat: adicionar nova funcionalidade
fix: corrigir bug
docs: atualizar documentação
style: formatação de código
refactor: refatorar código
test: adicionar testes
chore: tarefas de manutenção
```

---

## 🔧 **TROUBLESHOOTING**

### **Problemas Comuns**

#### **Erro de CORS**
```javascript
// Solução: Configurar CORS no backend
app.use(cors({
  origin: ['https://goldeouro.lol', 'http://localhost:5173'],
  credentials: true
}));
```

#### **Erro de Autenticação**
```javascript
// Verificar se o token JWT está sendo enviado
const token = localStorage.getItem('authToken');
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

#### **Erro de Conexão com Banco**
```javascript
// Verificar variáveis de ambiente
console.log('Supabase URL:', process.env.SUPABASE_URL);
console.log('Supabase Key:', process.env.SUPABASE_ANON_KEY);
```

### **Logs e Debug**

#### **Ativar Logs Detalhados**
```bash
# Backend
DEBUG=* npm run dev

# Frontend
VITE_DEBUG=true npm run dev
```

#### **Verificar Logs em Produção**
```bash
# Fly.io
fly logs

# Vercel
vercel logs
```

---

## 📊 **MONITORAMENTO**

### **Métricas Disponíveis**
- **Requests**: Total de requisições
- **Errors**: Total de erros
- **Response Time**: Tempo médio de resposta
- **Memory Usage**: Uso de memória
- **Active Users**: Usuários ativos

### **Alertas Configurados**
- **Taxa de Erro > 10%**: Alerta crítico
- **Tempo de Resposta > 5s**: Alerta de warning
- **Uso de Memória > 80%**: Alerta de warning

### **Dashboard de Monitoramento**
```
URL: https://goldeouro-backend.fly.dev/monitoring
```

### **Health Check**
```
GET /health
Response: {
  "status": "healthy",
  "timestamp": "2025-01-02T10:30:00Z",
  "checks": {
    "database": "healthy",
    "memory": "healthy",
    "uptime": "healthy"
  }
}
```

---

## 📞 **SUPORTE**

### **Contatos**
- **Email**: suporte@goldeouro.lol
- **Discord**: [Link do Discord]
- **GitHub Issues**: [Link do GitHub]

### **Recursos Adicionais**
- **Documentação da API**: [Link]
- **Changelog**: [Link]
- **Roadmap**: [Link]

---

## 📄 **CHANGELOG**

### **v2.0.0 (2025-10-15)**
- ✅ Refatoração completa da arquitetura
- ✅ Implementação de CI/CD automatizado
- ✅ Sistema de monitoramento avançado
- ✅ Testes automatizados
- ✅ Documentação técnica completa

### **v1.1.1 (2025-10-14)**
- ✅ Correção do sistema de autenticação
- ✅ Deploy funcionando em produção
- ✅ Sistema de backup implementado

---

**Documentação técnica completa implementada!** 📚✨
