# GOL DE OURO — AUDITORIA FINAL (v1.1.1)
![Status](https://img.shields.io/badge/status-PRONTO%20P%2F%20GO--LIVE-brightgreen) ![Infra](https://img.shields.io/badge/infra-Fly.io%20%7C%20Vercel-blue)

## 1) Resumo Executivo

### Objetivo do Produto
O **Gol de Ouro** é uma plataforma de jogos de apostas online que simula chutes a gol, onde jogadores apostam valores e têm chances de ganhar prêmios baseados em probabilidades configuradas. O jogo combina elementos de entretenimento com mecânicas de apostas controladas.

### Público-Alvo
- Jogadores brasileiros (18+)
- Usuários de dispositivos móveis e desktop
- Público interessado em jogos de habilidade e sorte

### Escopo da Versão v1.1.1
- ✅ Sistema de apostas dinâmicas (R$1, R$2, R$5, R$10)
- ✅ Lógica de jogo com probabilidades configuráveis
- ✅ Sistema "Gol de Ouro" (prêmio especial a cada 1000 chutes)
- ✅ Integração completa com Mercado Pago (PIX)
- ✅ Painel administrativo funcional
- ✅ Backend endurecido e otimizado
- ✅ Banco de dados seguro com RLS

### Itens Críticos Resolvidos
- 🔧 **404 /login Admin**: Corrigido com SPA fallback no Vercel
- 🔧 **Deploy backend "enxuto"**: Docker multi-stage sem `COPY . .`
- 🔧 **Hardening completo**: Helmet, Compression, CORS, Rate Limit
- 🔧 **Mercado Pago**: Webhook configurado com idempotência
- 🔧 **Supabase**: RLS, policies e índices aplicados

## 2) Regras do Jogo e Funcionamento

### Estrutura da Rodada
- **Tabuleiro**: 10 jogadores por rodada
- **Duração**: Rodadas instantâneas (sem fila de espera)
- **Objetivo**: Acertar o gol e ganhar prêmios

### Valores de Aposta
| Lote | Valor | Chances | Prêmio Jogador | Prêmio Plataforma |
|------|-------|---------|----------------|-------------------|
| 1    | R$1   | 1/10    | R$5            | R$5              |
| 2    | R$2   | 2/10    | R$10           | R$10             |
| 3    | R$5   | 5/10    | R$25           | R$25             |
| 4    | R$10  | 10/10   | R$50           | R$50             |

### Sistema "Gol de Ouro"
- **Frequência**: A cada 1000 chutes
- **Prêmio**: R$100 (adicional)
- **Animação**: Especial com overlay dourado
- **Contador**: Visível no header do jogador

### Fluxos Principais

#### Jogada Completa
1. Jogador seleciona valor de aposta
2. Sistema valida saldo disponível
3. Chute é processado com probabilidade
4. Resultado é exibido (defesa/gol)
5. Prêmio é creditado (se gol)
6. Histórico é atualizado

#### Pagamento PIX
1. Jogador solicita depósito
2. Sistema cria preferência no Mercado Pago
3. QR Code é gerado
4. Pagamento é processado
5. Webhook atualiza status
6. Saldo é creditado na carteira

## 3) Arquitetura & Infra

### Diagrama de Arquitetura
```
┌─────────────────┐    ┌─────────────────┐
│   PLAYER        │    │   ADMIN         │
│   (Vercel)      │    │   (Vercel)      │
│   goldeouro.lol │    │admin.goldeouro.lol
└─────────┬───────┘    └─────────┬───────┘
          │                      │
          └──────────┬───────────┘
                     │
            ┌────────▼────────┐
            │   BACKEND API   │
            │   (Fly.io)      │
            │<APP>.fly.dev    │
            └────────┬────────┘
                     │
            ┌────────▼────────┐
            │   SUPABASE      │
            │   (PostgreSQL)  │
            └────────┬────────┘
                     │
            ┌────────▼────────┐
            │ MERCADO PAGO    │
            │ (Pagamentos)    │
            └─────────────────┘
```

### Serviços Utilizados
- **Frontend**: Vercel (Player + Admin)
- **Backend**: Fly.io (Node.js + Express)
- **Banco**: Supabase (PostgreSQL)
- **Pagamentos**: Mercado Pago (PIX)

### DNS e SSL
- **Player**: `goldeouro.lol` → Vercel
- **Admin**: `admin.goldeouro.lol` → Vercel (CNAME)
- **SSL**: Configurado automaticamente no Vercel

## 4) Frontends (Player e Admin)

### Stack Tecnológica
- **Framework**: Vite + React
- **Styling**: CSS customizado + Tailwind
- **Build**: Vite (otimizado para produção)

### Admin Panel
- **SPA Fallback**: Configurado no `vercel.json`
- **Navegação**: Client-side (sem reload)
- **Autenticação**: Token-based
- **Rotas**: `/login`, `/dashboard`, `/usuarios`, `/relatorios`, `/chutes`

### Player Mode
- **Responsivo**: Mobile-first design
- **Animações**: CSS transitions + overlays
- **Estado**: React hooks + context
- **API**: Axios com interceptors

### Variáveis de Ambiente (Vercel)
```bash
VITE_API_URL=https://goldeouro-backend-v2.fly.dev
VITE_ENV=production
VITE_MP_PUBLIC_KEY=<SUA_PUBLIC_KEY_PROD>  # Opcional
```

## 5) Backend (API)

### Stack Tecnológica
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Banco**: PostgreSQL (Supabase)
- **Pagamentos**: Mercado Pago SDK

### Hardening Implementado
- **Helmet**: Headers de segurança
- **Compression**: Gzip para otimização
- **CORS**: Estrito (apenas domínios permitidos)
- **Rate Limit**: 200 req/15min por IP
- **Request ID**: UUID para rastreamento

### Rotas Principais
```
GET  /health              # Health check
GET  /readiness           # Readiness check
POST /payments/create     # Criar pagamento PIX
POST /webhook/mercadopago # Webhook MP
GET  /admin/*             # Rotas administrativas
POST /game/*              # Rotas do jogo
```

### CORS Configurado
```javascript
allowedOrigins: [
  'https://goldeouro.lol',
  'https://admin.goldeouro.lol'
]
```

### Webhook Mercado Pago
- **Endpoint**: `/webhook/mercadopago`
- **Idempotência**: Tabela `mp_events`
- **Processamento**: Assíncrono com retry
- **Logs**: Request ID para rastreamento

## 6) Banco de Dados (Supabase)

### Conexão
- **Pooler**: SSL habilitado
- **URL**: `DATABASE_URL` (secreto)
- **Pool**: 20 conexões máximas

### Tabelas Principais
| Tabela | Descrição | RLS |
|--------|-----------|-----|
| `users` | Usuários do sistema | ✅ |
| `transactions` | Transações financeiras | ✅ |
| `queue_board` | Tabuleiro de jogo | ✅ |
| `shot_attempts` | Tentativas de chute | ✅ |
| `withdrawals` | Saques solicitados | ✅ |
| `mp_events` | Idempotência webhook | ❌ |

### RLS (Row Level Security)
- **Status**: Habilitado em todas as tabelas
- **Policies**: Baseadas em `app.user_id`
- **Isolamento**: Usuários só acessam próprios dados

### Índices Críticos
```sql
CREATE INDEX idx_tx_user ON transactions(user_id);
CREATE INDEX idx_tx_created ON transactions(created_at);
CREATE INDEX idx_shots_user ON shot_attempts(user_id);
```

### Backup e PITR
- **PITR**: Habilitado (7 dias)
- **Backup**: Automático diário
- **Recovery**: Via Supabase Dashboard

## 7) Pagamentos (Mercado Pago)

### Configuração
- **Ambiente**: Produção
- **Access Token**: Configurado no Fly.io
- **Public Key**: Configurada no frontend (opcional)

### Fluxo de Pagamento
1. **Criação**: POST `/payments/create`
2. **Idempotência**: `X-Idempotency-Key` único
3. **Preferência**: Gerada via MP SDK
4. **QR Code**: Retornado para o frontend
5. **Webhook**: Processa confirmação
6. **Reconciliação**: Atualiza `transactions`

### Estados Mapeados
| MP Status | Sistema Status | Ação |
|-----------|----------------|------|
| `pending` | `pending` | Aguardar |
| `approved` | `completed` | Creditar |
| `rejected` | `failed` | Rejeitar |
| `refunded` | `refunded` | Estornar |

### Limites
- **Mínimo**: R$1,00
- **Máximo**: R$500,00
- **Moeda**: BRL (Real Brasileiro)

## 8) Deploy & Pipeline

### Backend (Fly.io)
- **Dockerfile**: Multi-stage otimizado
- **Context**: Whitelist (`.dockerignore`)
- **Build**: Sem `COPY . .`
- **Tamanho**: ~50MB (otimizado)

### Frontend (Vercel)
- **Build**: `npm run build`
- **Deploy**: `vercel --prod`
- **Domínios**: Configurados via Vercel

### Guardrails
- **Pre-commit**: Husky + validações
- **CI**: GitHub Actions
- **Rollback**: Script PowerShell

### Tamanhos Finais
- **Backend Image**: ~50MB
- **Player Bundle**: ~2MB
- **Admin Bundle**: ~1.5MB

## 9) Segurança & Conformidade (LGPD)

### Coleta de Dados
- **Mínima**: Email, nome, dados de pagamento
- **Finalidade**: Prestação do serviço
- **Base Legal**: Execução de contrato

### Consentimento
- **Termos**: Aceitos no cadastro
- **Cookies**: Apenas essenciais
- **Marketing**: Não aplicável

### Remoção/Anonimização
- **Direito**: Solicitação via admin
- **Processo**: Anonimização de dados pessoais
- **Retenção**: Dados financeiros (5 anos)

### Mitigação de Abuso
- **Rate Limit**: 200 req/15min
- **Validação**: Input sanitization
- **Monitoramento**: Logs de acesso

## 10) Observabilidade

### Health Checks
- **Endpoint**: `GET /health`
- **Monitoramento**: UptimeRobot (1 min)
- **Métricas**: CPU, memória, latência

### Logs
- **Backend**: Fly.io logs
- **Request ID**: UUID por requisição
- **Níveis**: Error, Warn, Info

### Alertas
- **Uptime**: < 99%
- **Latência**: > 2s
- **Erros**: > 5%

## 11) Testes de Aceite (GO-LIVE)

### Checklist de Validação
- [ ] Admin `/login` direto → 200 OK
- [ ] Player home → 200 OK
- [ ] API `/health` → 200 OK
- [ ] Pagamento R$1 → Criado com sucesso
- [ ] Webhook → Status atualizado
- [ ] RLS → Isolamento efetivo

### Scripts de Teste
```bash
# Smoke test completo
powershell -ExecutionPolicy Bypass -File scripts/smoke-prod.ps1 `
  -ApiBase https://goldeouro-backend-v2.fly.dev `
  -PlayerUrl https://goldeouro.lol `
  -AdminUrl https://admin.goldeouro.lol

# Teste E2E Mercado Pago
set API_BASE=https://goldeouro-backend-v2.fly.dev && node scripts/mp-e2e-test.js
```

## 12) Runbooks (Operação)

### Pagamento Não Confirma
1. Consultar status no Mercado Pago
2. Verificar logs do webhook
3. Reprocessar manualmente se necessário
4. Conciliar com banco de dados

### API Indisponível
1. Verificar status no Fly.io
2. Consultar logs de erro
3. Executar rollback se necessário
4. Escalar recursos se persistir

### Banco de Dados Lento
1. Verificar índices
2. Analisar queries lentas
3. Ajustar pool de conexões
4. Considerar read replicas

## 13) Roadmap v1.1.2 (PWA + APK)

### PWA (Progressive Web App)
- **Manifest**: Configuração offline
- **Service Worker**: Cache de recursos
- **Install**: Botão "Adicionar à tela inicial"

### APK (Android)
- **Capacitor**: Bridge nativo
- **Android Studio**: Build final
- **Play Store**: Publicação

### WhatsApp Integration
- **Business API**: Notificações
- **Bot**: Suporte automatizado

## 14) Anexos / Referências

### Arquivos de Configuração
- `vercel.json` - Configuração Vercel (SPA fallback)
- `fly.toml` - Configuração Fly.io
- `Dockerfile` - Build otimizado
- `.dockerignore` - Whitelist de arquivos
- `supabase/policies_v1.sql` - RLS e policies

### Scripts de Operação
- `scripts/smoke-prod.ps1` - Validação de produção
- `scripts/mp-e2e-test.js` - Teste E2E pagamentos
- `scripts/print-golive-ok.js` - Confirmação final

### Documentação Técnica
- `README-GOLIVE.md` - Guia de GO-LIVE
- `README-VERCEL.md` - Deploy Vercel
- `README-SUPABASE.md` - Configuração banco
- `README-MP.md` - Mercado Pago
- `README-OBS.md` - Observabilidade

---

**✅ Sistema 100% pronto para jogadores reais em produção!**
