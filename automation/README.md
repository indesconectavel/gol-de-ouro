# 🤖 Automação V19 - Gol de Ouro Backend

Sistema completo de automação, CI/CD, monitoramento e rollback para a Engine V19.

---

## 📋 Índice

1. [Configuração Inicial](#configuração-inicial)
2. [Secrets e Credenciais](#secrets-e-credenciais)
3. [Scripts Disponíveis](#scripts-disponíveis)
4. [GitHub Actions](#github-actions)
5. [Dashboards](#dashboards)
6. [Rollback Automático](#rollback-automático)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Configuração Inicial

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Fly.io CLI (`flyctl`)
- Vercel CLI (`vercel`)
- Acesso aos projetos Supabase (STG e PROD)

### Instalação

```bash
# Instalar dependências
npm install

# Instalar CLI tools (se necessário)
npm install -g flyctl vercel
```

---

## 🔐 Secrets e Credenciais

### Cursor Secrets (Cofre Seguro)

Configure os seguintes secrets no cofre do Cursor:

#### Supabase
- `SUPABASE_URL_STG` - URL do projeto staging
- `SUPABASE_SERVICE_ROLE_KEY_STG` - Service role key staging
- `SUPABASE_URL_PROD` - URL do projeto production
- `SUPABASE_SERVICE_ROLE_KEY_PROD` - Service role key production

#### Fly.io
- `FLY_API_TOKEN` - Token de API do Fly.io
- `FLY_APP_BACKEND` - Nome do app backend (production)
- `FLY_APP_BACKEND_STAGING` - Nome do app backend (staging)

#### Vercel
- `VERCEL_TOKEN` - Token de API do Vercel
- `VERCEL_PROJECT_ADMIN` - Nome do projeto admin
- `VERCEL_TEAM_ID` - ID do time Vercel (opcional)

### GitHub Secrets

Configure os mesmos secrets no GitHub:
1. Vá em Settings → Secrets and variables → Actions
2. Adicione todos os secrets listados acima

### Arquivo .env (Desenvolvimento Local)

Para desenvolvimento local, crie um arquivo `.env` na raiz:

```env
# Supabase Staging
SUPABASE_URL_STG=https://uatszaqzdqcwnfbipoxg.supabase.co
SUPABASE_SERVICE_ROLE_KEY_STG=sua_chave_aqui

# Supabase Production
SUPABASE_URL_PROD=https://gayopagjdrkcmkirmfvy.supabase.co
SUPABASE_SERVICE_ROLE_KEY_PROD=sua_chave_aqui

# Fly.io
FLY_API_TOKEN=seu_token_aqui
FLY_APP_BACKEND=goldeouro-backend
FLY_APP_BACKEND_STAGING=goldeouro-backend-staging

# Vercel
VERCEL_TOKEN=seu_token_aqui
VERCEL_PROJECT_ADMIN=goldeouro-admin
VERCEL_TEAM_ID=seu_team_id
```

**⚠️ IMPORTANTE:** Nunca commite o arquivo `.env` no repositório!

---

## 📜 Scripts Disponíveis

### Backup

```bash
# Backup staging
node automation/backup_schema_and_data.js STG

# Backup production
node automation/backup_schema_and_data.js PROD
```

**Arquivos gerados:**
- `backup/schemas/{ENV}/schema_{ENV}_{timestamp}.sql`
- `backup/dumps/{ENV}/data_{ENV}_{timestamp}.sql`

---

### Auditoria Completa

```bash
# Auditoria staging (dry-run)
node automation/full_audit_v19.js --env=STG

# Auditoria production (dry-run)
node automation/full_audit_v19.js --env=PROD
```

**Arquivos gerados:**
- `logs/v19/automation/full_audit_v19_results_{timestamp}.json`
- `RELATORIO_FINAL_AUDITORIA_V19.md`

---

### Execução Total V19

```bash
# Dry-run (não aplica mudanças)
node automation/executar_v19.js --env=STG

# Aplicar mudanças (requer --apply)
node automation/executar_v19.js --env=STG --apply

# Pular testes
node automation/executar_v19.js --env=STG --apply --skip-tests

# Pular backup
node automation/executar_v19.js --env=STG --apply --skip-backup
```

**O que faz:**
1. Valida ambiente
2. Cria backup (se não pulado)
3. Aplica migration (se --apply)
4. Executa health checks
5. Executa testes PIX e Premiação (se não pulados)

---

### Testes

```bash
# Teste PIX (sandbox)
node automation/teste_pix_v19.js STG

# Teste PIX (real - requer credenciais MercadoPago)
node automation/teste_pix_v19.js STG --real

# Teste Premiação
node automation/teste_premiacao_v19.js STG
```

---

### Rollback

```bash
# Rollback completo (banco + backend + admin)
node automation/rollback_v19.js --env=STG

# Rollback apenas banco
node automation/rollback_v19.js --env=STG --skip-backend --skip-admin

# Rollback backend Fly.io
node automation/rollback_v19.js --env=PROD --rollback-backend

# Rollback admin Vercel
node automation/rollback_v19.js --env=PROD --rollback-admin
```

**⚠️ ATENÇÃO:** Rollback restaura o último backup disponível. Certifique-se de ter backups recentes!

---

### Deploy

```bash
# Deploy backend staging
./automation/deploy_backend.sh stg

# Deploy backend production
./automation/deploy_backend.sh prod

# Deploy admin staging
./automation/deploy_admin.sh stg

# Deploy admin production
./automation/deploy_admin.sh prod
```

---

## 🔄 GitHub Actions

### CI Staging

**Trigger:**
- Push para `develop` ou `staging`
- Pull request para `develop` ou `staging`
- Manual via `workflow_dispatch`

**Arquivo:** `.github/workflows/ci-staging.yml`

**Executa:**
1. Lint e testes
2. Auditoria completa (dry-run)
3. Aplica migrations (se aprovado)
4. Deploy backend e admin (se aprovado)

### CI Production

**Trigger:**
- Push para `main`
- Pull request para `main`
- Manual via `workflow_dispatch` (com confirmação)

**Arquivo:** `.github/workflows/ci-production.yml`

**Executa:**
1. Lint e testes
2. Auditoria completa (dry-run)
3. Aplica migrations (se aprovado)
4. Deploy backend e admin (se aprovado)

---

## 📊 Dashboards

### Grafana Dashboard

**Arquivo:** `dashboards/grafana_v19_dashboard.json`

**Painéis incluídos:**
- System Heartbeat (última atualização)
- Lotes Ativos (contagem)
- Chutes por Minuto (gráfico)
- Pagamentos PIX Pendentes (contagem)
- RPC Error Rate (taxa de erros)

**Como importar:**
1. Acesse seu Grafana
2. Vá em Dashboards → Import
3. Cole o conteúdo de `grafana_v19_dashboard.json`
4. Configure o datasource PostgreSQL (Supabase)

---

## 🔄 Rollback Automático

O sistema de rollback automático é ativado quando:

1. Health checks falham após deploy
2. Testes críticos falham
3. Erro crítico detectado durante migration

**Estratégia:**
1. Para deploy corrente (se possível)
2. Restaura último backup do banco
3. Reverte deploy Fly.io/Vercel
4. Executa health checks (3 tentativas, 10s intervalo)
5. Alerta se rollback falhar

**Tempo máximo:** ~30 segundos

---

## 🛠️ Troubleshooting

### Erro: "Missing Supabase credentials"

**Solução:**
1. Verifique se os secrets estão configurados no Cursor/GitHub
2. Verifique se o arquivo `.env` existe (desenvolvimento local)
3. Verifique nomes das variáveis (devem ser exatos)

### Erro: "flyctl not found"

**Solução:**
```bash
# Instalar flyctl
curl -L https://fly.io/install.sh | sh

# Ou via npm
npm install -g flyctl
```

### Erro: "vercel CLI not found"

**Solução:**
```bash
npm install -g vercel
```

### Erro: "Backup não encontrado"

**Solução:**
1. Execute backup manualmente primeiro
2. Verifique permissões do diretório `backup/`
3. Verifique se há backups em `backup/dumps/{ENV}/`

### Rollback falhou

**Solução:**
1. Verifique logs em `logs/v19/automation/rollback_*.log`
2. Execute rollback manual via Supabase SQL Editor
3. Reverta deploy manualmente no Fly.io/Vercel

---

## 📁 Estrutura de Diretórios

```
automation/
├── lib/
│   └── supabase-client.js      # Cliente Supabase unificado
├── scripts/                     # Scripts auxiliares
├── backup_schema_and_data.js   # Backup automático
├── full_audit_v19.js           # Auditoria completa
├── executar_v19.js             # Orquestrador principal
├── rollback_v19.js             # Sistema de rollback
├── teste_pix_v19.js            # Testes PIX
├── teste_premiacao_v19.js      # Testes Premiação
├── deploy_backend.sh            # Deploy backend (Fly.io)
└── deploy_admin.sh             # Deploy admin (Vercel)

backup/
├── dumps/
│   ├── STG/                    # Backups staging
│   └── PROD/                   # Backups production
└── schemas/
    ├── STG/                    # Schemas staging
    └── PROD/                   # Schemas production

dashboards/
└── grafana_v19_dashboard.json  # Dashboard Grafana

.github/workflows/
├── ci-staging.yml              # CI/CD staging
└── ci-production.yml          # CI/CD production

logs/v19/automation/            # Logs de automação
```

---

## 🔒 Segurança

### Redação de Secrets

Todos os scripts redactam automaticamente secrets dos logs:
- Service role keys são substituídas por `***REDACTED`
- URLs são parcialmente ocultadas
- Tokens são removidos dos logs

### Validação de Credenciais

- Todas as credenciais são validadas antes do uso
- Erros são logados sem expor secrets
- Falhas de autenticação são tratadas graciosamente

---

## 📞 Suporte

Para problemas ou dúvidas:
1. Verifique os logs em `logs/v19/automation/`
2. Consulte os relatórios gerados
3. Execute auditoria completa para diagnóstico

---

**Última atualização:** 2025-01-12  
**Versão:** V19 - Final Release
