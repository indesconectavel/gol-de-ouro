# ✅ CHECKLIST DE CONFIGURAÇÃO - INTEGRAÇÃO TOTAL V19

Use este checklist para configurar o sistema completo de automação V19.

---

## 🔐 SECRETS - CURSOR (Cofre Seguro)

### **Supabase Staging**
- [ ] `SUPABASE_URL_STG` = `https://uatszaqzdqcwnfbipoxg.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY_STG` = (obter do Supabase Dashboard)

### **Supabase Production**
- [ ] `SUPABASE_URL_PROD` = `https://gayopagjdrkcmkirmfvy.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY_PROD` = (obter do Supabase Dashboard)

### **Fly.io**
- [ ] `FLY_API_TOKEN` = (obter de: https://fly.io/user/personal_access_tokens)
- [ ] `FLY_APP_BACKEND` = (nome do app Fly.io production)
- [ ] `FLY_APP_BACKEND_STAGING` = (nome do app Fly.io staging)

### **Vercel**
- [ ] `VERCEL_TOKEN` = (obter de: https://vercel.com/account/tokens)
- [ ] `VERCEL_PROJECT_ADMIN` = (nome do projeto Vercel)
- [ ] `VERCEL_TEAM_ID` = (ID do time Vercel - opcional)

---

## 🔐 SECRETS - GITHUB

Configure os mesmos secrets no GitHub:
1. Vá em: Settings → Secrets and variables → Actions
2. Adicione cada secret listado acima

---

## 📝 PLACEHOLDERS A PREENCHER

### **Arquivos que precisam de atualização:**

1. **`.github/workflows/ci-staging.yml`**
   - [ ] Verificar se `FLY_APP_BACKEND_STAGING` está correto
   - [ ] Verificar se `VERCEL_PROJECT_ADMIN` está correto

2. **`.github/workflows/ci-production.yml`**
   - [ ] Verificar se `FLY_APP_BACKEND` está correto
   - [ ] Verificar se `VERCEL_PROJECT_ADMIN` está correto

3. **`automation/deploy_backend.sh`**
   - [ ] Verificar nomes dos apps Fly.io

4. **`automation/deploy_admin.sh`**
   - [ ] Verificar nome do projeto Vercel

---

## 🧪 TESTES INICIAIS

### **1. Testar Cliente Supabase**

```bash
# Testar conexão staging
node -e "const {getClient} = require('./automation/lib/supabase-client'); getClient('STG').from('system_heartbeat').select('*').limit(1).then(r => console.log('STG:', r.data ? 'OK' : 'FAIL')).catch(e => console.log('STG ERROR:', e.message))"

# Testar conexão production
node -e "const {getClient} = require('./automation/lib/supabase-client'); getClient('PROD').from('system_heartbeat').select('*').limit(1).then(r => console.log('PROD:', r.data ? 'OK' : 'FAIL')).catch(e => console.log('PROD ERROR:', e.message))"
```

### **2. Testar Backup**

```bash
# Backup staging
node automation/backup_schema_and_data.js STG

# Verificar arquivo criado
Get-ChildItem backup/dumps/STG/ | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

### **3. Testar Auditoria**

```bash
# Auditoria staging (dry-run)
node automation/full_audit_v19.js --env=STG
```

### **4. Testar Execução Total**

```bash
# Dry-run (não aplica mudanças)
node automation/executar_v19.js --env=STG
```

---

## ✅ VALIDAÇÃO FINAL

Após configurar tudo, execute:

```bash
# 1. Backup completo
node automation/backup_schema_and_data.js STG
node automation/backup_schema_and_data.js PROD

# 2. Auditoria completa
node automation/full_audit_v19.js --env=STG
node automation/full_audit_v19.js --env=PROD

# 3. Testes
node automation/teste_pix_v19.js staging
node automation/teste_premiacao_v19.js staging

# 4. Validações
node automation/scripts/validar_search_path.js STG
node automation/scripts/validar_rls_policies.js STG
```

---

## 🚀 PRIMEIRA EXECUÇÃO EM PRODUCTION

**⚠️ ATENÇÃO:** Só execute em production após validar tudo em staging!

```bash
# 1. Backup completo
node automation/backup_schema_and_data.js PROD

# 2. Auditoria completa
node automation/full_audit_v19.js --env=PROD

# 3. Executar (dry-run primeiro)
node automation/executar_v19.js --env=PROD

# 4. Se tudo OK, aplicar
node automation/executar_v19.js --env=PROD --apply
```

---

## 📞 SUPORTE

Se encontrar problemas:

1. Verifique logs em `logs/v19/automation/`
2. Verifique se todos os secrets estão configurados
3. Execute validações individuais
4. Consulte `automation/README.md` para troubleshooting

---

**Última atualização:** 2025-01-12

