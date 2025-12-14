# 🎯 PRÓXIMOS PASSOS - INTEGRAÇÃO TOTAL V19

**Data:** 2025-01-12  
**Status:** ✅ Sistema criado, aguardando configuração  
**Prioridade:** Executar na ordem apresentada

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

### **ETAPA 1: Configurar Secrets no Cursor** ⚡ (URGENTE)

Configure os seguintes secrets no cofre seguro do Cursor:

#### **Supabase Staging:**
- [ ] `SUPABASE_URL_STG` = `https://uatszaqzdqcwnfbipoxg.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY_STG` = (obter do Supabase Dashboard → Settings → API)

#### **Supabase Production:**
- [ ] `SUPABASE_URL_PROD` = `https://gayopagjdrkcmkirmfvy.supabase.co`
- [ ] `SUPABASE_SERVICE_ROLE_KEY_PROD` = (obter do Supabase Dashboard → Settings → API)

#### **Fly.io:**
- [ ] `FLY_API_TOKEN` = (obter de: https://fly.io/user/personal_access_tokens)
- [ ] `FLY_APP_BACKEND` = (nome do seu app Fly.io production)
- [ ] `FLY_APP_BACKEND_STAGING` = (nome do seu app Fly.io staging)

#### **Vercel:**
- [ ] `VERCEL_TOKEN` = (obter de: https://vercel.com/account/tokens)
- [ ] `VERCEL_PROJECT_ADMIN` = (nome do projeto Vercel)
- [ ] `VERCEL_TEAM_ID` = (ID do time Vercel - opcional)

**Como configurar no Cursor:**
1. Vá em Settings → Secrets
2. Adicione cada secret listado acima
3. Valide que todos estão salvos

---

### **ETAPA 2: Configurar Secrets no GitHub** ⚡ (URGENTE)

Configure os mesmos secrets no GitHub:

1. Acesse: https://github.com/{seu-repo}/settings/secrets/actions
2. Clique em "New repository secret"
3. Adicione cada secret listado na ETAPA 1
4. Valide que todos estão configurados

**Secrets necessários:**
- `SUPABASE_URL_STG`
- `SUPABASE_SERVICE_ROLE_KEY_STG`
- `SUPABASE_URL_PROD`
- `SUPABASE_SERVICE_ROLE_KEY_PROD`
- `FLY_API_TOKEN`
- `FLY_APP_BACKEND`
- `FLY_APP_BACKEND_STAGING`
- `VERCEL_TOKEN`
- `VERCEL_PROJECT_ADMIN`
- `VERCEL_TEAM_ID` (opcional)

---

### **ETAPA 3: Preencher Placeholders** 📝 (IMPORTANTE)

Atualize os seguintes arquivos com valores reais:

#### **`.github/workflows/ci-staging.yml`**
- [ ] Verificar se `FLY_APP_BACKEND_STAGING` está correto
- [ ] Verificar se `VERCEL_PROJECT_ADMIN` está correto

#### **`.github/workflows/ci-production.yml`**
- [ ] Verificar se `FLY_APP_BACKEND` está correto
- [ ] Verificar se `VERCEL_PROJECT_ADMIN` está correto

#### **`automation/deploy_backend.sh`**
- [ ] Verificar nomes dos apps Fly.io (linhas 12-15)

#### **`automation/deploy_admin.sh`**
- [ ] Verificar nome do projeto Vercel (linha 12)

---

### **ETAPA 4: Testar Conexões** 🧪 (RECOMENDADO)

Execute os seguintes testes para validar configuração:

#### **4.1. Testar Cliente Supabase Staging**

```bash
node -e "const {getClient} = require('./automation/lib/supabase-client'); getClient('STG').from('system_heartbeat').select('*').limit(1).then(r => console.log('✅ STG:', r.data ? 'OK' : 'FAIL')).catch(e => console.log('❌ STG ERROR:', e.message))"
```

**Resultado esperado:** `✅ STG: OK`

#### **4.2. Testar Cliente Supabase Production**

```bash
node -e "const {getClient} = require('./automation/lib/supabase-client'); getClient('PROD').from('system_heartbeat').select('*').limit(1).then(r => console.log('✅ PROD:', r.data ? 'OK' : 'FAIL')).catch(e => console.log('❌ PROD ERROR:', e.message))"
```

**Resultado esperado:** `✅ PROD: OK`

#### **4.3. Testar Backup**

```bash
# Backup staging
node automation/backup_schema_and_data.js STG

# Verificar arquivo criado
Get-ChildItem backup/dumps/STG/ | Sort-Object LastWriteTime -Descending | Select-Object -First 1
```

**Resultado esperado:** Arquivo SQL criado em `backup/dumps/STG/`

---

### **ETAPA 5: Executar Primeira Vez em Staging** 🚀 (CRÍTICO)

**⚠️ IMPORTANTE:** Sempre teste em staging primeiro!

#### **5.1. Backup Completo**

```bash
node automation/backup_schema_and_data.js STG
```

#### **5.2. Auditoria Completa (Dry-Run)**

```bash
node automation/full_audit_v19.js --env=STG
```

**Verificar:**
- [ ] Relatório gerado em `RELATORIO_FINAL_AUDITORIA_V19.md`
- [ ] Nenhum erro crítico encontrado
- [ ] Ambientes sincronizados

#### **5.3. Execução Total (Dry-Run)**

```bash
node automation/executar_v19.js --env=STG
```

**Verificar:**
- [ ] Todos os steps passaram
- [ ] Logs em `logs/v19/automation/`
- [ ] Resultados em JSON

#### **5.4. Testes**

```bash
# Teste PIX
node automation/teste_pix_v19.js staging

# Teste Premiação
node automation/teste_premiacao_v19.js staging
```

**Resultado esperado:** Todos os testes passando

---

### **ETAPA 6: Validar Resultados Staging** ✅ (OBRIGATÓRIO)

Antes de aplicar em production, valide:

- [ ] ✅ Todos os backups criados com sucesso
- [ ] ✅ Auditoria completa sem erros críticos
- [ ] ✅ Todos os testes passando (PIX + Premiação)
- [ ] ✅ Health checks funcionando
- [ ] ✅ Logs sem erros críticos
- [ ] ✅ Relatórios gerados corretamente

**Se tudo OK:** Prosseguir para ETAPA 7  
**Se houver problemas:** Corrigir antes de prosseguir

---

### **ETAPA 7: Aplicar em Production** 🎯 (CUIDADO!)

**⚠️ ATENÇÃO:** Só execute após validar tudo em staging!

#### **7.1. Backup Completo Production**

```bash
node automation/backup_schema_and_data.js PROD
```

#### **7.2. Auditoria Completa Production (Dry-Run)**

```bash
node automation/full_audit_v19.js --env=PROD
```

#### **7.3. Execução Total Production (Dry-Run Primeiro)**

```bash
# Primeiro: dry-run
node automation/executar_v19.js --env=PROD

# Se tudo OK, aplicar:
node automation/executar_v19.js --env=PROD --apply
```

#### **7.4. Testes Production**

```bash
# Teste PIX
node automation/teste_pix_v19.js production

# Teste Premiação
node automation/teste_premiacao_v19.js production
```

---

### **ETAPA 8: Configurar GitHub Actions** 🔄 (OPCIONAL)

Os workflows já estão criados. Para ativá-los:

1. **Commit e Push dos arquivos:**
   ```bash
   git add automation/ .github/
   git commit -m "feat: Integração Total V19 - Automação completa"
   git push origin main
   ```

2. **Validar workflows no GitHub:**
   - Vá em Actions → Verifique se workflows aparecem
   - Execute manualmente via `workflow_dispatch`

3. **Testar CI Staging:**
   - Faça push para branch `develop` ou `staging`
   - Verifique execução do workflow

---

### **ETAPA 9: Configurar Dashboards** 📊 (OPCIONAL)

#### **9.1. Importar Dashboard Grafana**

1. Acesse seu Grafana (Cloud ou self-hosted)
2. Vá em Dashboards → Import
3. Cole conteúdo de `dashboards/grafana_v19_dashboard.json`
4. Configure datasource PostgreSQL apontando para Supabase

#### **9.2. Configurar Datasource**

- **Host:** `db.{projeto}.supabase.co`
- **Port:** `5432`
- **Database:** `postgres`
- **User:** `postgres`
- **Password:** (obter do Supabase Dashboard → Settings → Database)

---

### **ETAPA 10: Documentação e Treinamento** 📚 (RECOMENDADO)

- [ ] Revisar `automation/README.md`
- [ ] Revisar `automation/painel-controle-v19.md`
- [ ] Compartilhar documentação com equipe
- [ ] Treinar equipe nos comandos principais

---

## 🎯 RESUMO EXECUTIVO

### **Ordem de Execução:**

1. ⚡ **Configurar Secrets** (Cursor + GitHub)
2. 📝 **Preencher Placeholders**
3. 🧪 **Testar Conexões**
4. 🚀 **Executar em Staging** (dry-run primeiro)
5. ✅ **Validar Resultados Staging**
6. 🎯 **Aplicar em Production** (com cuidado!)
7. 🔄 **Configurar GitHub Actions** (opcional)
8. 📊 **Configurar Dashboards** (opcional)
9. 📚 **Documentação e Treinamento** (recomendado)

---

## 🚨 ALERTAS IMPORTANTES

### **Antes de Aplicar em Production:**

- ✅ **SEMPRE** teste em staging primeiro
- ✅ **SEMPRE** faça backup antes de aplicar
- ✅ **SEMPRE** execute dry-run primeiro
- ✅ **SEMPRE** valide resultados antes de aplicar
- ✅ **SEMPRE** tenha plano de rollback pronto

### **Em Caso de Problema:**

1. ⚠️ Parar deploy imediatamente
2. 🔄 Executar rollback: `node automation/rollback_v19.js --env=PROD`
3. 📊 Verificar logs em `logs/v19/automation/`
4. 🔍 Investigar causa raiz
5. ✅ Corrigir e re-deploy

---

## 📞 COMANDOS ÚTEIS

### **Status Rápido**

```bash
# Verificar health do sistema
node -e "const {getClient} = require('./automation/lib/supabase-client'); Promise.all([getClient('STG').from('system_heartbeat').select('*').limit(1), getClient('PROD').from('system_heartbeat').select('*').limit(1)]).then(([stg, prod]) => console.log('STG:', stg.data ? 'OK' : 'FAIL', '| PROD:', prod.data ? 'OK' : 'FAIL'))"
```

### **Ver Últimos Logs**

```bash
# Últimos logs de automação
Get-ChildItem logs/v19/automation/*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object { Write-Host "`n=== $($_.Name) ===" -ForegroundColor Cyan; Get-Content $_.FullName -Tail 20 }
```

### **Ver Últimos Backups**

```bash
# Backups staging
Get-ChildItem backup/dumps/STG/ | Sort-Object LastWriteTime -Descending | Select-Object -First 3

# Backups production
Get-ChildItem backup/dumps/PROD/ | Sort-Object LastWriteTime -Descending | Select-Object -First 3
```

---

## ✅ CONCLUSÃO

Após completar todas as etapas acima, o sistema de automação V19 estará **100% operacional** e pronto para uso em produção.

**Tempo estimado total:** 1-2 horas (incluindo testes e validações)

---

**Última atualização:** 2025-01-12  
**Responsável:** AUDITOR V19 - Sistema de Automação

