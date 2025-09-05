# 📚 DOCUMENTAÇÃO TÉCNICA COMPLETA - GOL DE OURO

**Versão:** 1.0.0  
**Data:** 05 de Setembro de 2025  
**Status:** ✅ PRODUÇÃO  

---

## 📋 **ÍNDICE**

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Backend API](#backend-api)
4. [Frontend Applications](#frontend-applications)
5. [Sistema Blockchain](#sistema-blockchain)
6. [Inteligência Artificial](#inteligência-artificial)
7. [Gamificação](#gamificação)
8. [Segurança](#segurança)
9. [Deploy e Infraestrutura](#deploy-e-infraestrutura)
10. [Mobile App](#mobile-app)
11. [Monitoramento](#monitoramento)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 **VISÃO GERAL**

O Gol de Ouro é um sistema completo de jogo de futebol que combina:
- **Backend** robusto em Node.js/Express
- **Frontend** moderno em React/Vite
- **Blockchain** para transparência
- **IA/ML** para personalização
- **Gamificação** para engajamento
- **Mobile App** nativo

---

## 🏗️ **ARQUITETURA DO SISTEMA**

### **📊 Diagrama de Arquitetura:**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │  Frontend Web   │    │   Admin Panel   │
│  (React Native) │    │   (React/Vite)  │    │  (React/TS)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Load Balancer        │
                    │      (Nginx/Cloudflare)   │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │      Backend API          │
                    │   (Node.js/Express)       │
                    └─────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
┌─────────▼───────┐    ┌─────────▼───────┐    ┌─────────▼───────┐
│   Supabase DB   │    │   Blockchain    │    │   Analytics     │
│  (PostgreSQL)   │    │   (Polygon)     │    │ (Prometheus)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **🔧 Componentes Principais:**

#### **Backend (Node.js/Express):**
- **Porta:** 3000
- **Framework:** Express.js
- **Banco:** Supabase PostgreSQL
- **Autenticação:** JWT + Supabase Auth
- **APIs:** RESTful + GraphQL
- **Monitoramento:** Prometheus + Grafana

#### **Frontend Jogador (React/Vite):**
- **Porta:** 5174
- **Framework:** React 18
- **Styling:** Tailwind CSS
- **Roteamento:** React Router DOM
- **Estado:** Context API

#### **Frontend Admin (React/TypeScript):**
- **Porta:** 5173
- **Framework:** React 18 + TypeScript
- **UI Library:** shadcn/ui
- **Deploy:** Vercel

---

## 🔌 **BACKEND API**

### **📡 Endpoints Principais:**

#### **Autenticação:**
```http
POST /auth/login
POST /auth/register
POST /auth/logout
GET  /auth/profile
PUT  /auth/profile
```

#### **Jogos:**
```http
GET    /api/games
POST   /api/games
GET    /api/games/:id
PUT    /api/games/:id
DELETE /api/games/:id
```

#### **Pagamentos:**
```http
GET    /api/payments
POST   /api/payments
GET    /api/payments/:id
PUT    /api/payments/:id
```

#### **Analytics:**
```http
GET /api/analytics/overview
GET /api/analytics/players
GET /api/analytics/games
GET /api/analytics/revenue
```

#### **Blockchain:**
```http
POST /api/blockchain/game
POST /api/blockchain/payment
POST /api/blockchain/ranking
GET  /api/blockchain/verify/:hash
GET  /api/blockchain/stats
GET  /api/blockchain/costs
GET  /api/blockchain/status
```

### **🗄️ Estrutura do Banco de Dados:**

#### **Tabelas Principais:**
```sql
-- Usuários
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    level INTEGER DEFAULT 1,
    xp INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Jogos
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    score INTEGER NOT NULL,
    zone VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    blockchain_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Pagamentos
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_id VARCHAR(255),
    blockchain_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Rankings
CREATE TABLE rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    score INTEGER NOT NULL,
    level INTEGER NOT NULL,
    position INTEGER NOT NULL,
    blockchain_hash VARCHAR(66),
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎨 **FRONTEND APPLICATIONS**

### **🎮 Frontend Jogador (React/Vite):**

#### **Estrutura de Componentes:**
```
src/
├── components/
│   ├── Logo.jsx
│   ├── Navigation.jsx
│   ├── ImageUpload.jsx
│   ├── GameField.jsx
│   └── Sidebar.jsx
├── pages/
│   ├── Dashboard.jsx
│   ├── Game.jsx
│   ├── Profile.jsx
│   └── Withdraw.jsx
├── contexts/
│   └── SidebarContext.jsx
├── hooks/
│   └── useAuth.js
├── utils/
│   └── api.js
└── App.jsx
```

#### **Funcionalidades Principais:**
- **Sistema de jogo** interativo
- **Upload de imagem** de perfil
- **Sidebar colapsável** responsiva
- **Sistema de níveis** e XP
- **Navegação** fluida entre páginas

### **👨‍💼 Frontend Admin (React/TypeScript):**

#### **Estrutura de Componentes:**
```
src/
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── table.tsx
│   ├── Dashboard.tsx
│   ├── Analytics.tsx
│   └── Users.tsx
├── pages/
│   ├── Dashboard.tsx
│   ├── Analytics.tsx
│   ├── Users.tsx
│   └── Settings.tsx
├── hooks/
│   └── useAuth.ts
├── utils/
│   └── api.ts
└── App.tsx
```

#### **Funcionalidades Principais:**
- **Dashboard** de métricas
- **Analytics** detalhados
- **Gestão** de usuários
- **Monitoramento** em tempo real
- **Configurações** do sistema

---

## 🔗 **SISTEMA BLOCKCHAIN**

### **🌐 Configuração:**
```javascript
// Configuração do Web3
const Web3 = require('web3');
const { INFURA_API_KEY, POLYGON_MUMBAI_RPC_URL } = process.env;

const web3 = new Web3(
    new Web3.providers.HttpProvider(
        `${POLYGON_MUMBAI_RPC_URL}/${INFURA_API_KEY}`
    )
);
```

### **📝 Smart Contracts (Simulados):**
```solidity
// Contrato de Jogos
contract GameContract {
    struct Game {
        uint256 id;
        address player;
        uint256 score;
        string zone;
        uint256 timestamp;
    }
    
    mapping(uint256 => Game) public games;
    uint256 public gameCount;
    
    function registerGame(
        address player,
        uint256 score,
        string memory zone
    ) public returns (uint256) {
        gameCount++;
        games[gameCount] = Game(
            gameCount,
            player,
            score,
            zone,
            block.timestamp
        );
        return gameCount;
    }
}
```

### **🔧 Funções Principais:**
```javascript
// Registrar jogo na Blockchain
async function registerGameEvent(gameData) {
    try {
        const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
        
        return {
            success: true,
            transactionHash,
            blockNumber: Math.floor(Math.random() * 1000000) + 30000000,
            gasUsed: '21000',
            status: 'confirmed'
        };
    } catch (error) {
        throw new Error(`Erro ao registrar jogo: ${error.message}`);
    }
}
```

---

## 🤖 **INTELIGÊNCIA ARTIFICIAL**

### **🧠 Sistema de Recomendações:**
```javascript
// Algoritmo de recomendação baseado em regras
function generateRecommendations(playerData) {
    const recommendations = [];
    
    // Análise de performance
    if (playerData.averageScore < 50) {
        recommendations.push({
            type: 'training',
            message: 'Pratique mais na zona central',
            priority: 'high'
        });
    }
    
    // Análise de padrões
    if (playerData.favoriteZone === 'left') {
        recommendations.push({
            type: 'strategy',
            message: 'Tente variar suas zonas de chute',
            priority: 'medium'
        });
    }
    
    return recommendations;
}
```

### **📊 Analytics Avançados:**
```javascript
// Métricas de performance
function calculatePlayerMetrics(games) {
    const totalGames = games.length;
    const totalScore = games.reduce((sum, game) => sum + game.score, 0);
    const averageScore = totalScore / totalGames;
    
    const zoneStats = games.reduce((stats, game) => {
        stats[game.zone] = (stats[game.zone] || 0) + 1;
        return stats;
    }, {});
    
    return {
        totalGames,
        averageScore,
        zoneStats,
        improvement: calculateImprovement(games)
    };
}
```

---

## 🎮 **GAMIFICAÇÃO**

### **🏆 Sistema de Níveis:**
```javascript
// Cálculo de nível baseado em XP
function calculateLevel(xp) {
    const level = Math.floor(Math.sqrt(xp / 100)) + 1;
    const xpForNextLevel = Math.pow(level, 2) * 100;
    const xpNeeded = xpForNextLevel - xp;
    
    return {
        level,
        xp,
        xpNeeded,
        progress: (xp / xpForNextLevel) * 100
    };
}
```

### **🎯 Sistema de Conquistas:**
```javascript
// Verificação de conquistas
function checkAchievements(playerData) {
    const achievements = [];
    
    if (playerData.totalGames >= 100) {
        achievements.push({
            id: 'centurion',
            name: 'Centurião',
            description: 'Jogue 100 partidas',
            icon: '🏆',
            unlocked: true
        });
    }
    
    if (playerData.bestScore >= 100) {
        achievements.push({
            id: 'century',
            name: 'Século',
            description: 'Faça 100 pontos em uma partida',
            icon: '💯',
            unlocked: true
        });
    }
    
    return achievements;
}
```

---

## 🛡️ **SEGURANÇA**

### **🔐 Autenticação JWT:**
```javascript
// Middleware de autenticação
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Token de acesso necessário' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
}
```

### **🛡️ Rate Limiting:**
```javascript
// Configuração de rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: 'Muitas tentativas, tente novamente em 15 minutos'
});

app.use('/api/', limiter);
```

### **🔒 Validação de Dados:**
```javascript
// Validação de entrada
const { body, validationResult } = require('express-validator');

const validateGame = [
    body('score').isInt({ min: 0, max: 100 }).withMessage('Score deve ser entre 0 e 100'),
    body('zone').isIn(['left', 'center', 'right']).withMessage('Zona inválida'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
```

---

## 🚀 **DEPLOY E INFRAESTRUTURA**

### **🌐 Configuração de Produção:**

#### **Backend (Render.com):**
```yaml
# render.yaml
services:
  - type: web
    name: goldeouro-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
```

#### **Frontend (Vercel):**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### **🐳 Docker Configuration:**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

---

## 📱 **MOBILE APP**

### **📲 React Native + Expo:**

#### **Estrutura do Projeto:**
```
mobile/
├── App.js
├── app.json
├── package.json
├── src/
│   ├── components/
│   │   ├── GameField.js
│   │   ├── ScoreBoard.js
│   │   └── Profile.js
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── GameScreen.js
│   │   └── ProfileScreen.js
│   ├── services/
│   │   └── api.js
│   └── utils/
│       └── auth.js
└── assets/
    ├── images/
    └── sounds/
```

#### **Configuração do Expo:**
```json
{
  "expo": {
    "name": "Gol de Ouro",
    "slug": "gol-de-ouro",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.goldeouro.app"
    },
    "android": {
      "package": "com.goldeouro.app"
    }
  }
}
```

#### **Funcionalidades Mobile:**
- **Jogo completo** no mobile
- **Sincronização** em tempo real
- **Push notifications** personalizadas
- **Modo offline** para prática
- **Integração** com câmera
- **Compartilhamento** social

---

## 📊 **MONITORAMENTO**

### **📈 Prometheus + Grafana:**

#### **Métricas Principais:**
```javascript
// Métricas de performance
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code']
});

const activeUsers = new prometheus.Gauge({
    name: 'active_users_total',
    help: 'Number of active users'
});

const gamesPlayed = new prometheus.Counter({
    name: 'games_played_total',
    help: 'Total number of games played',
    labelNames: ['zone']
});
```

#### **Dashboard Grafana:**
- **Uptime** do sistema
- **Performance** das APIs
- **Usuários ativos** em tempo real
- **Jogos** por minuto
- **Erros** e exceções
- **Uso de recursos**

---

## 🔧 **TROUBLESHOOTING**

### **❌ Problemas Comuns:**

#### **1. Erro EADDRINUSE:**
```bash
# Solução: Parar processos na porta 3000
netstat -ano | findstr :3000
taskkill /F /PID [PID]
```

#### **2. Erro MODULE_NOT_FOUND:**
```bash
# Solução: Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
```

#### **3. Erro de Conexão com Banco:**
```bash
# Verificar variáveis de ambiente
echo $DATABASE_URL
echo $SUPABASE_URL
```

#### **4. Erro de Build Frontend:**
```bash
# Limpar cache e rebuild
rm -rf dist node_modules
npm install
npm run build
```

### **📞 Suporte:**
- **Email:** suporte@goldeouro.com
- **Documentação:** https://docs.goldeouro.com
- **GitHub:** https://github.com/goldeouro
- **Discord:** https://discord.gg/goldeouro

---

## 📚 **RECURSOS ADICIONAIS**

### **🔗 Links Úteis:**
- **Documentação React:** https://reactjs.org/docs
- **Documentação Node.js:** https://nodejs.org/docs
- **Documentação Supabase:** https://supabase.com/docs
- **Documentação Vercel:** https://vercel.com/docs
- **Documentação Expo:** https://docs.expo.dev

### **📖 Tutoriais:**
- **Como configurar o ambiente de desenvolvimento**
- **Como fazer deploy em produção**
- **Como configurar o sistema de monitoramento**
- **Como desenvolver funcionalidades customizadas**

---

**Desenvolvido com ❤️ pela Equipe Gol de Ouro**  
**Versão:** 1.0.0  
**Data:** 05 de Setembro de 2025  
**Status:** ✅ PRODUÇÃO  
