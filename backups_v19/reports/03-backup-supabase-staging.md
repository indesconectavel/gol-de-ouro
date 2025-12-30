# 🛢️ ETAPA 0.4: BACKUP SUPABASE – STAGING (goldeouro-db)
## Backup do Banco de Dados Supabase Staging

**Data:** 2025-12-10  
**Versão:** V19.0.0  
**Auditor:** AUDITOR V19 - Módulo de Backups  
**Status:** ⏳ **REQUER AÇÃO MANUAL**

---

## 📋 INSTRUÇÕES

O backup do Supabase **não pode ser realizado automaticamente** via API devido a limitações de segurança e acesso.

### ⚠️ AÇÃO NECESSÁRIA

**Por favor, realize o backup manualmente seguindo estes passos:**

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Selecione o projeto **goldeouro-db** (staging)
3. Vá em **Settings** → **Database**
4. Role até a seção **Backups** ou **Database Backups**
5. Clique em **Download Backup** ou **Create Backup**
6. Aguarde o download do arquivo SQL
7. Salve o arquivo em: `backups_v19/staging/supabase_staging_dump_v19.sql`

### Alternativa: Via SQL Editor

1. Acesse o projeto **goldeouro-db** no Supabase
2. Vá em **SQL Editor**
3. Execute o comando:
```sql
-- Export completo do banco (requer permissões administrativas)
-- Ou use pg_dump via linha de comando se tiver acesso SSH
```

### Via CLI (se configurado)

Se você tiver o Supabase CLI configurado:

```bash
supabase db dump --project-ref YOUR_PROJECT_REF > backups_v19/staging/supabase_staging_dump_v19.sql
```

---

## 📦 ARQUIVO ESPERADO

| Arquivo | Caminho | Status |
|---------|---------|--------|
| **Dump SQL** | `backups_v19/staging/supabase_staging_dump_v19.sql` | ⏳ Aguardando criação manual |

---

## ✅ VALIDAÇÃO PÓS-BACKUP

Após criar o backup manualmente, execute:

```powershell
# Verificar se o arquivo existe
Test-Path backups_v19\staging\supabase_staging_dump_v19.sql

# Gerar hash MD5
Get-FileHash -Path backups_v19\staging\supabase_staging_dump_v19.sql -Algorithm MD5

# Verificar tamanho
(Get-Item backups_v19\staging\supabase_staging_dump_v19.sql).Length
```

---

## 📝 OBSERVAÇÕES

- O backup do Supabase é **crítico** para recuperação em caso de problemas
- Recomenda-se fazer backup **antes de qualquer migration**
- O arquivo SQL pode ser grande dependendo do tamanho do banco
- Mantenha o backup em local seguro e versionado

---

## 🔄 PRÓXIMOS PASSOS

1. ⏳ Criar backup manual do Supabase staging
2. ⏳ Gerar hash MD5 do arquivo SQL
3. ⏳ Validar integridade do dump
4. ⏳ Continuar com backup de produção (se autorizado)

---

**Gerado em:** 2025-12-10T22:05:00Z  
**Status:** ⏳ **AGUARDANDO BACKUP MANUAL**

