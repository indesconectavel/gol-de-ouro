# 🚀 Gol de Ouro Backend

Backend Node.js/Express para o jogo Gol de Ouro, com PostgreSQL e Supabase.

## 🏗️ Arquitetura

- **Framework**: Express.js
- **Database**: PostgreSQL (Supabase)
- **Autenticação**: JWT + Admin Token
- **Segurança**: Helmet, Rate Limiting, CORS
- **Validação**: Envalid para variáveis de ambiente

## 🚀 Início Rápido

### Pré-requisitos

- Node.js >= 18.0.0
- npm >= 8.0.0
- PostgreSQL (ou Supabase)

### Instalação

```bash
# Clone o repositório
git clone <seu-repo>
cd goldeouro-backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com seus valores reais

# Inicie o servidor
npm start
```

## 🔧 Variáveis de Ambiente

### 📋 Tabela de Variáveis

| Variável | Tipo | Obrigatória | Descrição | Exemplo |
|----------|------|-------------|-----------|---------|
| `DATABASE_URL` | string | ✅ | URL de conexão PostgreSQL | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `JWT_SECRET` | string | ✅ | Chave para assinatura JWT (min 32 chars) | `abc123def456...` |
| `ADMIN_TOKEN` | string | ✅ | Token para rotas administrativas (min 16 chars) | `meu-token-admin-123` |
| `PORT` | number | ❌ | Porta do servidor (padrão: 3000) | `3000` |
| `CORS_ORIGINS` | string | ❌ | Origens permitidas para CORS | `http://localhost:5174,https://admin.vercel.app` |
| `NODE_ENV` | string | ❌ | Ambiente (dev/staging/prod/test) | `development` |

### 🔐 Configuração de Segurança

```bash
# Gere uma JWT_SECRET forte
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Gere um ADMIN_TOKEN único
node -e "console.log(require('crypto').randomUUID())"
```

## 📁 Estrutura do Projeto

```
goldeouro-backend/
├── config/
│   └── env.js              # Validação de variáveis de ambiente
├── controllers/             # Controladores da API
├── middlewares/            # Middlewares (auth, validação)
├── models/                 # Modelos de dados
├── routes/                 # Rotas da API
├── scripts/                # Scripts de deploy e teste
├── .env.example           # Template de variáveis de ambiente
├── .gitignore             # Arquivos ignorados pelo Git
├── db.js                  # Conexão com banco de dados
├── package.json           # Dependências e scripts
├── README.md              # Este arquivo
└── server.js              # Servidor principal
```

## 🛡️ Segurança

### Middlewares Ativos

- **Helmet**: Headers de segurança HTTP
- **Rate Limiting**: 100 requests/15min por IP
- **CORS**: Configuração dinâmica por ambiente
- **Morgan**: Logs de acesso (exceto em testes)

### Autenticação

- **JWT**: Para usuários logados
- **Admin Token**: Para rotas administrativas
- **Validação**: Todas as variáveis são validadas na inicialização

## 🧪 Testes

### Smoke Test

```bash
# Teste rápido das rotas principais
npm run smoke

# Ou com token específico
.\scripts\smoke.ps1 -AdminToken "seu_token_aqui"
```

### Verificação de Segurança

```bash
# Verifica configurações de segurança
npm run security:check
```

## 🚀 Deploy

### 🚀 Deploy Rápido no Render (1-Click)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy/schema-new?template=https://github.com/seu-usuario/goldeouro-backend)

**Passos para deploy rápido:**

1. **Clique no botão acima** ou acesse: https://render.com/deploy/schema-new
2. **Conecte seu GitHub** e selecione este repositório
3. **Configure as variáveis obrigatórias:**
   - `DATABASE_URL`: Sua URL do Supabase
   - `JWT_SECRET`: Chave JWT (mínimo 32 caracteres)
   - `ADMIN_TOKEN`: Token admin (mínimo 16 caracteres)
4. **Clique em "Deploy"** - Render fará o resto automaticamente!

**Variáveis pré-configuradas:**
- ✅ `PORT`: 3000
- ✅ `NODE_ENV`: production  
- ✅ `CORS_ORIGINS`: http://localhost:5174,https://goldeouro-admin.vercel.app

**URL gerada:** `https://goldeouro-backend-XXXX.onrender.com`

### Scripts Disponíveis

```bash
# Deploy no Render (recomendado)
npm run deploy:render

# Deploy no Railway
npm run deploy:railway

# Deploy completo (backend + admin)
npm run deploy:all

# Verificação pós-deploy
npm run verify
```

### Plataformas Suportadas

- **Render** (gratuito, recomendado)
- **Railway** (gratuito, alternativo)
- **Vercel** (para admin frontend)

## 📊 Monitoramento

### Health Check

```bash
# Verificar status da API
curl http://localhost:3000/health

# Resposta esperada:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### Logs

```bash
# Logs em desenvolvimento
npm start

# Logs em produção (Render)
render logs goldeouro-backend

# Logs em produção (Railway)
railway logs
```

## 🔄 Desenvolvimento

### Comandos Úteis

```bash
# Desenvolvimento com hot reload
npm run dev

# Teste de conexão com banco
npm test

# Verificar variáveis de ambiente
npm run security:check
```

### Estrutura de Rotas

- `GET /` - Status da API
- `GET /health` - Health check
- `POST /auth/register` - Registro de usuário
- `POST /auth/login` - Login de usuário
- `GET /admin/*` - Rotas administrativas (protegidas)
- `GET /fila/*` - Rotas da fila de jogo
- `GET /usuario/*` - Rotas de usuário

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**
   - Verifique `DATABASE_URL` no `.env`
   - Confirme se o Supabase está ativo

2. **Erro de autenticação**
   - Verifique `JWT_SECRET` e `ADMIN_TOKEN`
   - Confirme se os tokens têm o tamanho mínimo

3. **Erro de CORS**
   - Verifique `CORS_ORIGINS` no `.env`
   - Inclua o domínio do frontend

### Logs de Debug

```bash
# Ver logs detalhados
NODE_ENV=development npm start

# Verificar variáveis carregadas
npm run security:check
```

## 📝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🤝 Suporte

Para suporte, abra uma issue no repositório ou entre em contato com a equipe de desenvolvimento.

---

**⚠️ IMPORTANTE**: Nunca commite arquivos `.env` com valores reais. Use sempre `.env.example` como template.
