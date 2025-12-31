# BACKUP DO BANCO DE DADOS - MISSÃO C

## Informações de Exportação

**Data:** 2025-12-31  
**Sistema:** Supabase (PostgreSQL)

## Método de Exportação

### Opção 1: Via Supabase Dashboard (Recomendado)

1. Acessar: https://supabase.com/dashboard
2. Selecionar projeto: `goldeouro-production`
3. Ir em: **SQL Editor**
4. Executar queries do arquivo: `exportar-dados-criticos.sql`
5. Exportar resultados como CSV
6. Salvar arquivos CSV no diretório: `database/`

### Opção 2: Via Supabase CLI (se disponível)

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Exportar schema
supabase db dump --schema public > database/schema.sql

# Exportar dados (usar queries do exportar-dados-criticos.sql)
```

### Opção 3: Via pg_dump (se acesso direto disponível)

```bash
pg_dump -h db.[PROJECT-REF].supabase.co -U postgres -d postgres --schema-only > database/schema.sql
pg_dump -h db.[PROJECT-REF].supabase.co -U postgres -d postgres --data-only --table=usuarios --table=lotes --table=chutes > database/data-critical.sql
```

## Arquivos Esperados

- `database/schema.sql` - Schema completo do banco
- `database/data-critical.sql` - Dados críticos exportados
- `database/exportar-dados-criticos.sql` - Script de exportação

## Nota Importante

⚠️ **NÃO incluir credenciais ou chaves de acesso no backup.**  
Os arquivos SQL devem conter apenas estrutura e dados, sem informações de conexão.

