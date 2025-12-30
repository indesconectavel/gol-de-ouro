# 🛢️ INSTRUÇÕES PARA BACKUP MANUAL DO SUPABASE

## Backup Staging (goldeouro-db)

### Método 1: Via Dashboard Supabase (Recomendado)

1. Acesse: https://app.supabase.com
2. Faça login na sua conta
3. Selecione o projeto **goldeouro-db**
4. Vá em **Settings** → **Database**
5. Role até encontrar **Backups** ou **Database Backups**
6. Clique em **Download Backup** ou **Create Backup**
7. Aguarde o download do arquivo SQL
8. Salve o arquivo em: `backups_v19/staging/supabase_staging_dump_v19.sql`

### Método 2: Via SQL Editor (Export Manual)

1. Acesse o projeto **goldeouro-db** no Supabase
2. Vá em **SQL Editor**
3. Execute o seguinte comando para listar todas as tabelas:

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

4. Use o **pg_dump** via linha de comando (se tiver acesso SSH):

```bash
pg_dump -h db.YOUR_PROJECT_REF.supabase.co -U postgres -d postgres > backups_v19/staging/supabase_staging_dump_v19.sql
```

### Método 3: Via Supabase CLI

Se você tiver o Supabase CLI instalado:

```bash
supabase db dump --project-ref YOUR_PROJECT_REF > backups_v19/staging/supabase_staging_dump_v19.sql
```

---

## Backup Production (goldeouro-production) - Opcional

Siga os mesmos passos acima, mas:
- Selecione o projeto **goldeouro-production**
- Salve em: `backups_v19/production/supabase_production_dump_v19.sql`

---

## Após Criar o Backup

Execute este comando para validar:

```powershell
# Verificar se o arquivo existe
Test-Path backups_v19\staging\supabase_staging_dump_v19.sql

# Gerar hash MD5
Get-FileHash -Path backups_v19\staging\supabase_staging_dump_v19.sql -Algorithm MD5

# Verificar tamanho
(Get-Item backups_v19\staging\supabase_staging_dump_v19.sql).Length
```

---

## ⚠️ IMPORTANTE

- O backup do Supabase é **crítico** para recuperação
- Faça o backup **antes de qualquer migration**
- Mantenha o backup em local seguro
- O arquivo pode ser grande dependendo do tamanho do banco

---

**Status:** ⏳ Aguardando criação manual

