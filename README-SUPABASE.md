# Guia de Configuração Supabase - Gol de Ouro v1.1.1

## 🗄️ APLICAR POLICIES E ÍNDICES

### 1. Via Supabase CLI
```bash
# Instalar Supabase CLI
npm install -g supabase

# Login no Supabase
supabase login

# Aplicar policies
supabase db push --file supabase/policies_v1.sql
```

### 2. Via Dashboard Supabase
1. Acessar [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecionar projeto
3. Ir em "SQL Editor"
4. Copiar e executar conteúdo de `supabase/policies_v1.sql`

## 🔐 CONFIGURAÇÃO DE SEGURANÇA

### 1. Row Level Security (RLS)
- ✅ Habilitado em todas as tabelas
- ✅ Policies configuradas para isolamento por usuário
- ✅ Backend deve setar `app.user_id` por requisição

### 2. Conexão SSL
```javascript
// Exemplo de conexão com SSL
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    db: {
      schema: 'public'
    },
    auth: {
      persistSession: false
    }
  }
)
```

## 💾 BACKUP E PITR

### 1. Habilitar PITR (Point-in-Time Recovery)
1. Acessar "Settings" > "Database"
2. Habilitar "Point-in-Time Recovery"
3. Configurar retenção (recomendado: 7 dias)

### 2. Backup Manual
```bash
# Via Supabase CLI
supabase db dump --file backup_$(date +%Y%m%d).sql

# Via Dashboard
- Ir em "Settings" > "Database"
- Clicar em "Download backup"
```

## 🔧 CONFIGURAÇÃO DO BACKEND

### 1. Variáveis de Ambiente
```bash
# Adicionar ao .env ou secrets do Fly.io
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_KEY=<service-key>
```

### 2. Pool de Conexões
```javascript
// Exemplo de configuração do pool
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

## ✅ CHECKLIST DE CONEXÃO

- [ ] RLS habilitado em todas as tabelas
- [ ] Policies aplicadas corretamente
- [ ] Índices criados para performance
- [ ] Conexão SSL configurada
- [ ] Pool de conexões otimizado
- [ ] PITR habilitado
- [ ] Backup configurado
- [ ] Variáveis de ambiente definidas
- [ ] Teste de conexão realizado

## 🚨 TROUBLESHOOTING

### Erro de RLS
- Verificar se as policies estão aplicadas
- Confirmar se `app.user_id` está sendo setado
- Verificar logs do Supabase

### Erro de Conexão
- Verificar se as variáveis de ambiente estão corretas
- Confirmar se o SSL está configurado
- Testar conexão com `psql`

### Performance Lenta
- Verificar se os índices foram criados
- Analisar queries no dashboard
- Considerar otimizações de pool
