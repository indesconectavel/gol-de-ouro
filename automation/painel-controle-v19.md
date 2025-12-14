# 🎛️ PAINEL DE CONTROLE V19 - CURSOR INTERFACE

Este documento descreve como usar o Painel de Controle V19 diretamente no Cursor.

---

## 🚀 AÇÕES RÁPIDAS

### **Backup**

```bash
# Backup Staging
node automation/backup_schema_and_data.js STG

# Backup Production
node automation/backup_schema_and_data.js PROD
```

**Resultado:** Backups salvos em `backup/dumps/{ENV}/` e `backup/schemas/{ENV}/`

---

### **Run Full Audit**

```bash
# Auditoria Staging
node automation/full_audit_v19.js --env=STG

# Auditoria Production
node automation/full_audit_v19.js --env=PROD
```

**Resultado:** Relatório completo em `RELATORIO_FINAL_AUDITORIA_V19.md`

---

### **Apply Migration**

```bash
# Staging (com confirmação)
node automation/executar_v19.js --env=STG --apply

# Production (com confirmação)
node automation/executar_v19.js --env=PROD --apply
```

**⚠️ ATENÇÃO:** Isso aplica migrations reais! Use com cuidado.

---

### **Run Tests**

```bash
# Teste PIX (sandbox)
node automation/teste_pix_v19.js STG

# Teste PIX (real - requer credenciais)
node automation/teste_pix_v19.js STG --real

# Teste Premiação
node automation/teste_premiacao_v19.js STG
```

---

### **Deploy**

```bash
# Deploy Backend Staging
./automation/deploy_backend.sh stg

# Deploy Backend Production
./automation/deploy_backend.sh prod

# Deploy Admin Staging
./automation/deploy_admin.sh stg

# Deploy Admin Production
./automation/deploy_admin.sh prod
```

---

### **Rollback**

```bash
# Rollback completo Staging
node automation/rollback_v19.js --env=STG

# Rollback completo Production
node automation/rollback_v19.js --env=PROD

# Rollback apenas banco
node automation/rollback_v19.js --env=STG --skip-backend --skip-admin

# Rollback apenas backend
node automation/rollback_v19.js --env=PROD --rollback-backend
```

---

## 📊 VISUALIZAR LOGS

### **Logs Recentes**

```bash
# Ver últimos logs
Get-ChildItem logs/v19/automation/*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 5

# Ver último relatório de auditoria
Get-ChildItem logs/v19/automation/*audit*.json | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

---

## 🔍 VALIDAÇÕES AUTOMÁTICAS

```bash
# Validar SET search_path em todas as funções
node automation/scripts/validar_search_path.js STG

# Validar RLS Policies
node automation/scripts/validar_rls_policies.js STG
```

---

## 📁 ARQUIVOS E ARTIFACTS

### **Backups**
- `backup/dumps/{ENV}/` - Dumps de dados
- `backup/schemas/{ENV}/` - Schemas SQL

### **Logs**
- `logs/v19/automation/*.log` - Logs de execução
- `logs/v19/automation/*.json` - Resultados em JSON

### **Relatórios**
- `RELATORIO_FINAL_AUDITORIA_V19.md` - Relatório de auditoria
- `RELATORIO-FINAL-ENGINE-V19.md` - Relatório executivo

---

## ⚡ COMANDOS ÚTEIS

### **Status Rápido**

```bash
# Verificar status geral
node automation/executar_v19.js --env=STG --skip-tests --skip-backup
```

### **Health Check Rápido**

```bash
# Verificar health do sistema
node -e "const {getAdminClient} = require('./automation/lib/supabase-client'); getAdminClient('STG').from('system_heartbeat').select('*').limit(1).then(r => console.log(r.data ? 'OK' : 'FAIL'))"
```

---

## 🎯 WORKFLOWS RECOMENDADOS

### **Antes de Deploy em Production:**

1. ✅ Backup completo
2. ✅ Full Audit
3. ✅ Testes completos
4. ✅ Aplicar migration (se necessário)
5. ✅ Health checks
6. ✅ Deploy

### **Em Caso de Problema:**

1. ⚠️ Parar deploy (se em andamento)
2. 🔄 Executar rollback
3. 📊 Verificar logs
4. 🔍 Investigar causa
5. ✅ Corrigir e re-deploy

---

**Última atualização:** 2025-01-12

