# 💾 FASE 3 — BACKUP OBRIGATÓRIO
## BLOCO A — ETAPA A2: Backup Completo Pré-Deploy

**Data:** 19/12/2025  
**Hora:** 01:35:00  
**Fase:** 3 - GO-LIVE CONTROLADO  
**Status:** 🔄 **EM EXECUÇÃO**

---

## 🎯 OBJETIVO

Executar backup completo antes do deploy em produção:
- ✅ Backup completo do banco de dados Supabase
- ✅ Snapshot da API (configurações, variáveis de ambiente)
- ✅ Backup do código (git tag)
- ✅ Validação da integridade dos backups
- ✅ Capacidade de restore confirmada

---

## 📋 BACKUP 1: BANCO DE DADOS SUPABASE

### **Método Recomendado: Via Dashboard Supabase**

**⚠️ AÇÃO MANUAL NECESSÁRIA**

**Passos:**

1. **Acessar Dashboard Supabase**
   - URL: https://app.supabase.com
   - Login com credenciais autorizadas

2. **Selecionar Projeto de Produção**
   - Projeto: **goldeouro-production** (ou equivalente)
   - ⚠️ **CONFIRMAR** que é o projeto correto

3. **Criar Backup**
   - Navegar: **Settings** → **Database**
   - Seção: **Backups** ou **Database Backups**
   - Ação: **Download Backup** ou **Create Backup**
   - Aguardar download do arquivo SQL

4. **Salvar Backup**
   - Local: `backup/FASE-3-PRE-DEPLOY/supabase_production_backup_2025-12-19.sql`
   - Criar diretório se não existir: `mkdir -p backup/FASE-3-PRE-DEPLOY`

5. **Validar Backup**
   ```powershell
   # Verificar se arquivo existe
   Test-Path backup\FASE-3-PRE-DEPLOY\supabase_production_backup_2025-12-19.sql
   
   # Gerar hash MD5 para integridade
   Get-FileHash -Path backup\FASE-3-PRE-DEPLOY\supabase_production_backup_2025-12-19.sql -Algorithm MD5
   
   # Verificar tamanho (deve ser > 0)
   (Get-Item backup\FASE-3-PRE-DEPLOY\supabase_production_backup_2025-12-19.sql).Length
   ```

**Status:** ⏳ **AGUARDANDO EXECUÇÃO MANUAL**

---

### **Método Alternativo: Via Supabase CLI**

**Se Supabase CLI estiver configurado:**

```bash
# Obter PROJECT_REF do .env ou dashboard
PROJECT_REF="seu-project-ref"

# Criar backup completo
supabase db dump --project-ref $PROJECT_REF > backup/FASE-3-PRE-DEPLOY/supabase_production_backup_2025-12-19.sql

# Validar backup
ls -lh backup/FASE-3-PRE-DEPLOY/supabase_production_backup_2025-12-19.sql
```

**Status:** ⚠️ **REQUER CONFIGURAÇÃO PRÉVIA**

---

## 📋 BACKUP 2: SNAPSHOT DA API

### **2.1. Variáveis de Ambiente**

**Arquivo:** `.env.production` ou variáveis do Fly.io

**Ação:**
```powershell
# Exportar variáveis de ambiente do Fly.io
fly secrets list > backup/FASE-3-PRE-DEPLOY/flyio-secrets-list.txt

# Documentar variáveis críticas (SEM valores)
# JWT_SECRET: [REDACTED]
# SUPABASE_URL: [REDACTED]
# SUPABASE_SERVICE_ROLE_KEY: [REDACTED]
# MERCADOPAGO_ACCESS_TOKEN: [REDACTED]
# ADMIN_TOKEN: [REDACTED]
```

**⚠️ IMPORTANTE:** NÃO commitar valores de secrets no git!

**Status:** ⏳ **AGUARDANDO EXECUÇÃO**

---

### **2.2. Configuração do Servidor**

**Arquivos a documentar:**
- `server-fly.js` (versão atual)
- `package.json` (dependências)
- `fly.toml` (configuração Fly.io)

**Ação:**
```powershell
# Criar snapshot da configuração
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupDir = "backup/FASE-3-PRE-DEPLOY"

# Copiar arquivos críticos
Copy-Item server-fly.js "$backupDir/server-fly_$timestamp.js"
Copy-Item package.json "$backupDir/package_$timestamp.json"
Copy-Item fly.toml "$backupDir/fly_$timestamp.toml" -ErrorAction SilentlyContinue

# Documentar versão do Node.js
node --version > "$backupDir/node-version.txt"
```

**Status:** ⏳ **AGUARDANDO EXECUÇÃO**

---

## 📋 BACKUP 3: CÓDIGO (GIT TAG)

### **Criar Tag de Release**

**Ação:**
```bash
# Criar tag anotada para o release
git tag -a v1.0.0-pre-deploy -m "FASE 3: Pré-deploy - Backup completo realizado em 2025-12-19"

# Push da tag para repositório remoto
git push origin v1.0.0-pre-deploy

# Verificar tag criada
git tag -l "v1.0.0*"
```

**Status:** ⏳ **AGUARDANDO EXECUÇÃO**

---

## 📋 BACKUP 4: UI WEB (PLAYER + ADMIN)

### **4.1. Player (Vercel)**

**Ação:**
```powershell
# Documentar deployment atual do Vercel
# Acessar: https://vercel.com/dashboard
# Projeto: goldeouro-player
# Capturar:
# - URL de produção atual
# - Hash do deployment atual
# - Variáveis de ambiente (nomes apenas, sem valores)

# Salvar em arquivo
@"
Vercel Player - Deployment Info
URL: https://goldeouro.lol
Deployment Hash: [CAPTURAR DO VERCEL]
Timestamp: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@ | Out-File backup/FASE-3-PRE-DEPLOY/vercel-player-deployment.txt
```

**Status:** ⏳ **AGUARDANDO EXECUÇÃO**

---

### **4.2. Admin (Vercel)**

**Ação:**
```powershell
# Documentar deployment atual do Vercel Admin
# Acessar: https://vercel.com/dashboard
# Projeto: goldeouro-admin
# Capturar:
# - URL de produção atual
# - Hash do deployment atual
# - Variáveis de ambiente (nomes apenas, sem valores)

# Salvar em arquivo
@"
Vercel Admin - Deployment Info
URL: https://admin.goldeouro.lol
Deployment Hash: [CAPTURAR DO VERCEL]
Timestamp: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
"@ | Out-File backup/FASE-3-PRE-DEPLOY/vercel-admin-deployment.txt
```

**Status:** ⏳ **AGUARDANDO EXECUÇÃO**

---

## ✅ VALIDAÇÃO DE INTEGRIDADE

### **Checklist de Validação:**

- [ ] Backup Supabase criado e validado
- [ ] Hash MD5 do backup Supabase gerado
- [ ] Tamanho do backup Supabase > 0
- [ ] Variáveis de ambiente documentadas (sem valores)
- [ ] Configuração do servidor copiada
- [ ] Git tag criada e pushada
- [ ] Deployments Vercel documentados
- [ ] Todos os arquivos salvos em `backup/FASE-3-PRE-DEPLOY/`

---

## 🔄 CAPACIDADE DE RESTORE

### **Teste de Restore (Opcional mas Recomendado)**

**⚠️ NÃO EXECUTAR EM PRODUÇÃO - APENAS VALIDAR PROCESSO**

**Validação do Processo:**

1. ✅ Backup Supabase pode ser restaurado via SQL Editor
2. ✅ Git tag permite checkout do código exato
3. ✅ Configurações podem ser restauradas manualmente
4. ✅ Vercel permite rollback para deployment anterior

**Status:** ⏳ **AGUARDANDO VALIDAÇÃO**

---

## 📊 RESUMO DOS BACKUPS

| Backup | Método | Localização | Status |
|--------|--------|-------------|--------|
| **Supabase DB** | Dashboard Manual | `backup/FASE-3-PRE-DEPLOY/supabase_production_backup_*.sql` | ⏳ Pendente |
| **Variáveis Env** | Fly.io Secrets | `backup/FASE-3-PRE-DEPLOY/flyio-secrets-list.txt` | ⏳ Pendente |
| **Config Servidor** | Arquivos | `backup/FASE-3-PRE-DEPLOY/server-fly_*.js` | ⏳ Pendente |
| **Git Tag** | Git | `v1.0.0-pre-deploy` | ⏳ Pendente |
| **Vercel Player** | Documentação | `backup/FASE-3-PRE-DEPLOY/vercel-player-deployment.txt` | ⏳ Pendente |
| **Vercel Admin** | Documentação | `backup/FASE-3-PRE-DEPLOY/vercel-admin-deployment.txt` | ⏳ Pendente |

---

## ⚠️ GATE CRÍTICO

**⛔ NÃO PROSSEGUIR PARA A3 (CHECKLIST DE PRODUÇÃO) ATÉ:**

1. ✅ Backup Supabase criado e validado
2. ✅ Git tag criada
3. ✅ Documentação de deployments realizada
4. ✅ Capacidade de restore confirmada

**Status:** ⚠️ **AGUARDANDO CONCLUSÃO DOS BACKUPS**

---

## 📄 EVIDÊNCIAS

**Comandos Preparados:**
- Backup Supabase: Via Dashboard (manual)
- Git Tag: `git tag -a v1.0.0-pre-deploy -m "FASE 3: Pré-deploy"`
- Documentação: Scripts PowerShell preparados

**Arquivos de Referência:**
- `backups_v19/INSTRUCOES-BACKUP-SUPABASE.md` - Instruções detalhadas
- `backup/backup-automatico.js` - Script de backup automático

---

**Backup iniciado em:** 2025-12-19T01:35:00.000Z  
**Status:** ⏳ **AGUARDANDO EXECUÇÃO DOS BACKUPS**

