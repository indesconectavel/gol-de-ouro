# 📚 Documentação Backend - Gol de Ouro v1.1.1

## 🎯 Visão Geral

O backend do Gol de Ouro é um sistema robusto construído com Node.js/Express que gerencia:
- Sistema de autenticação JWT
- Lógica de jogo (partidas, chutes, resultados)
- Integração PIX via Mercado Pago
- WebSocket para comunicação em tempo real
- Sistema de IA para analytics e recomendações
- Monitoramento e logs estruturados

## 🏗️ Arquitetura

```
goldeouro-backend/
├── controllers/          # Lógica de negócio
├── routes/              # Definição de rotas
├── middlewares/         # Middlewares de autenticação e validação
├── database/            # Configuração e schema do banco
├── src/                 # Código fonte principal
│   ├── ai/             # Sistemas de IA
│   ├── utils/          # Utilitários (logger, monitoring)
│   └── websocket.js    # Servidor WebSocket
├── tests/              # Testes unitários e E2E
├── scripts/            # Scripts de automação
└── docs/               # Documentação
```

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 18+
- npm 8+
- Banco de dados (Supabase/PostgreSQL)
- Chaves do Mercado Pago

### Instalação
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp env.example .env
# Editar .env com suas configurações

# Executar migrações do banco
npm run migrate

# Iniciar servidor
npm start
```

### Desenvolvimento
```bash
# Modo desenvolvimento com hot reload
npm run dev

# Executar testes
npm test

# Executar testes E2E
npm run test:e2e

# Executar todos os testes
npm run test:all
```

## 📡 Endpoints da API

### Autenticação
- `POST /auth/login` - Login do usuário
- `POST /auth/register` - Registro de usuário
- `POST /auth/logout` - Logout do usuário
- `POST /auth/refresh` - Renovar token

### Jogo
- `GET /api/games/opcoes-chute` - Obter opções de chute
- `POST /api/games/fila/entrar` - Entrar na fila
- `POST /api/games/chutar` - Executar chute
- `GET /api/games/historico` - Histórico de partidas
- `GET /api/games/ranking` - Ranking de jogadores

### Usuário
- `GET /api/user/saldo` - Obter saldo
- `GET /api/user/perfil` - Obter perfil
- `PUT /api/user/perfil` - Atualizar perfil
- `GET /api/user/transacoes` - Histórico de transações

### Pagamentos
- `POST /api/payments/pix/criar` - Criar pagamento PIX
- `GET /api/payments/pix/status/:id` - Status do pagamento
- `POST /api/payments/saque` - Solicitar saque
- `POST /api/payments/webhook` - Webhook Mercado Pago

### Health Check
- `GET /api/health` - Status básico
- `GET /api/health/detailed` - Status detalhado
- `GET /api/health/database` - Status do banco
- `GET /api/health/performance` - Métricas de performance

## 🔐 Autenticação

O sistema usa JWT (JSON Web Tokens) para autenticação:

```javascript
// Headers necessários
Authorization: Bearer <token>

// Exemplo de uso
const response = await fetch('/api/user/saldo', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 💾 Banco de Dados

### Schema Principal
- `usuarios` - Dados dos jogadores
- `partidas` - Partidas do jogo
- `partida_jogadores` - Jogadores em cada partida
- `chutes` - Chutes dos jogadores
- `transacoes` - Transações financeiras
- `pagamentos_pix` - Pagamentos PIX
- `saques` - Saques solicitados

### Migrações
```bash
# Executar migrações
npm run migrate

# Reverter migrações
npm run migrate:rollback

# Status das migrações
npm run migrate:status
```

## 🤖 Sistemas de IA

### Analytics AI
- Análise de comportamento do jogador
- Previsão de resultados de partidas
- Detecção de fraudes
- Recomendações personalizadas

### Análise de Sentimento
- Análise de feedback dos usuários
- Categorização automática
- Geração de insights

### Chatbot
- Atendimento automatizado
- Respostas contextuais
- Integração com sistema de tickets

## 📊 Monitoramento

### Métricas Coletadas
- CPU e memória do sistema
- Performance da aplicação
- Métricas do banco de dados
- Estatísticas da API
- Eventos WebSocket

### Alertas
- Uso alto de recursos
- Taxa de erro elevada
- Tempo de resposta lento
- Problemas de conectividade

### Logs
- Logs estruturados em JSON
- Rotação automática de arquivos
- Diferentes níveis (error, warn, info, debug)
- Logs específicos por módulo

## 🔧 Configuração

### Variáveis de Ambiente
```env
# Servidor
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Banco de dados
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=your-access-token
MERCADOPAGO_PUBLIC_KEY=your-public-key

# URLs
FRONTEND_URL=https://admin.goldeouro.lol
PLAYER_URL=https://player.goldeouro.lol
BACKEND_URL=https://goldeouro-backend-v2.fly.dev
```

## 🧪 Testes

### Testes Unitários
```bash
# Executar todos os testes unitários
npm test

# Executar com cobertura
npm run test:coverage

# Executar em modo watch
npm run test:watch
```

### Testes E2E
```bash
# Executar testes E2E
npm run test:e2e

# Executar com interface gráfica
npx playwright test --ui
```

### Estrutura de Testes
```
tests/
├── unit/               # Testes unitários
│   ├── api.test.js    # Testes da API
│   └── utils.test.js  # Testes de utilitários
├── e2e/               # Testes end-to-end
│   └── game-flow.test.js
└── setup.js           # Configuração dos testes
```

## 🚀 Deploy

### Deploy Automático
O sistema usa GitHub Actions para CI/CD:

1. **Push para `develop`** → Deploy para staging
2. **Push para `main`** → Deploy para produção
3. **Pull Request** → Executa testes e validações

### Deploy Manual
```bash
# Build do projeto
npm run build

# Deploy para Fly.io
fly deploy

# Verificar status
fly status
```

## 🔒 Segurança

### Medidas Implementadas
- Autenticação JWT
- Rate limiting
- CORS configurado
- Headers de segurança (Helmet)
- Validação de entrada
- Sanitização de dados
- Logs de segurança

### Boas Práticas
- Nunca commitar credenciais
- Usar HTTPS em produção
- Manter dependências atualizadas
- Monitorar logs de segurança
- Implementar backup automático

## 📈 Performance

### Otimizações
- Compressão gzip
- Cache de consultas
- Pool de conexões
- Lazy loading
- Paginação de resultados

### Monitoramento
- Métricas em tempo real
- Alertas automáticos
- Dashboards de performance
- Análise de tendências

## 🛠️ Manutenção

### Backup Automático
```bash
# Executar backup manual
npm run backup

# Configurar backup automático
npm run backup:schedule
```

### Limpeza de Logs
```bash
# Limpar logs antigos
npm run logs:clean

# Rotacionar logs
npm run logs:rotate
```

### Atualizações
```bash
# Verificar atualizações
npm outdated

# Atualizar dependências
npm update

# Auditoria de segurança
npm audit
```

## 🆘 Troubleshooting

### Problemas Comuns

#### Erro de Conexão com Banco
```bash
# Verificar configuração
npm run db:test

# Verificar logs
tail -f logs/error.log
```

#### Problemas de Performance
```bash
# Verificar métricas
curl http://localhost:3000/api/health/performance

# Verificar logs de performance
grep "Performance" logs/info.log
```

#### Problemas de Autenticação
```bash
# Verificar JWT secret
echo $JWT_SECRET

# Verificar logs de auth
grep "Auth" logs/info.log
```

## 📞 Suporte

### Logs e Debugging
- Logs estruturados em `logs/`
- Nível de log configurável via `LOG_LEVEL`
- Métricas em tempo real via `/api/health/detailed`

### Contato
- Email: suporte@goldeouro.lol
- Discord: [Link do servidor]
- GitHub Issues: [Link do repositório]

---

**Versão:** 1.1.1  
**Última atualização:** 2025-10-07  
**Mantenedor:** Fred S. Silva
