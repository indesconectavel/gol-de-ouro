# Configuração de Ambiente - Backend Gol de Ouro

## Variáveis de Ambiente

### Obrigatórias
- `DATABASE_URL`: URL de conexão com PostgreSQL (Supabase/Render)
- `JWT_SECRET`: Chave secreta para JWT (mínimo 32 caracteres)
- `ADMIN_TOKEN`: Token para rotas administrativas (mínimo 16 caracteres)

### Opcionais
- `PORT`: Porta do servidor (padrão: 3000)
- `NODE_ENV`: Ambiente (development/staging/production/test)
- `CORS_ORIGINS`: Origens permitidas para CORS (separadas por vírgula)

## Configuração Local

1. Copie `.env.example` para `.env`
2. Configure as variáveis obrigatórias
3. Execute `npm start`

## Configuração no Render

1. Configure as variáveis de ambiente no dashboard do Render
2. O backend estará disponível em: `https://seu-app.onrender.com`

## Configuração no Vercel (Admin)

Para o admin funcionar corretamente, configure no Vercel:

```bash
# Production
vercel env add VITE_API_URL production
# Valor: https://seu-backend.onrender.com

# Preview
vercel env add VITE_API_URL preview  
# Valor: https://seu-backend.onrender.com
```

## CORS Configurado

O backend permite as seguintes origens:
- `http://localhost:5173` (dev)
- `http://localhost:5174` (dev fallback)
- `https://goldeouro-admin.vercel.app` (produção)

## Endpoints Públicos

- `GET /` - Status da API
- `GET /health` - Health check
- `GET /api/public/dashboard` - Dashboard público

## Segurança

- Helmet ativo com CSP desabilitado em dev
- Rate limiting: 200 requests/minuto por IP
- CORS configurado com credentials
- Validação de variáveis de ambiente
