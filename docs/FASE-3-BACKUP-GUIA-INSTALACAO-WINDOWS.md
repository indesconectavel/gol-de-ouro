# 🔧 GUIA DE INSTALAÇÃO - PG_DUMP NO WINDOWS
## Instalação Rápida do PostgreSQL Client Tools

**Data:** 19/12/2025  
**Sistema:** Windows  
**Objetivo:** Instalar pg_dump para backup do Supabase

---

## 🎯 MÉTODO RECOMENDADO: INSTALAR POSTGRESQL COMPLETO

### **Passo 1: Download**

1. **Acessar:** https://www.postgresql.org/download/windows/
2. **Clicar:** "Download the installer"
3. **Escolher:** Versão mais recente (PostgreSQL 16.x ou 15.x)
4. **Download:** Executar instalador (ex: `postgresql-16.x-windows-x64.exe`)

---

### **Passo 2: Instalação**

1. **Executar instalador** como Administrador
2. **Seguir wizard:**
   - ✅ **Installation Directory:** Manter padrão (`C:\Program Files\PostgreSQL\16`)
   - ✅ **Select Components:** 
     - ✅ PostgreSQL Server (opcional, mas recomendado)
     - ✅ **Command Line Tools** ⚠️ **OBRIGATÓRIO**
     - ✅ pgAdmin 4 (opcional)
   - ✅ **Data Directory:** Manter padrão
   - ✅ **Password:** Definir senha para usuário `postgres` (anotar para uso local)
   - ✅ **Port:** Manter `5432`
   - ✅ **Locale:** Manter padrão

3. **Durante instalação:**
   - ✅ Marcar opção "Add PostgreSQL bin directory to PATH"
   - ✅ Ou adicionar manualmente após instalação

---

### **Passo 3: Adicionar ao PATH (Se Necessário)**

**Verificar se está no PATH:**

```powershell
Get-Command pg_dump
```

**Se não encontrar, adicionar manualmente:**

1. **Abrir:** Painel de Controle → Sistema → Configurações Avançadas do Sistema
2. **Clicar:** "Variáveis de Ambiente"
3. **Editar:** Variável `Path` do Sistema
4. **Adicionar:** `C:\Program Files\PostgreSQL\16\bin`
5. **Salvar** e fechar todas as janelas
6. **Abrir novo PowerShell** e testar:

```powershell
pg_dump --version
```

---

### **Passo 4: Validação**

**Comandos de Validação:**

```powershell
# Verificar versão do pg_dump
pg_dump --version
# Deve retornar: pg_dump (PostgreSQL) 16.x

# Verificar versão do pg_restore
pg_restore --version
# Deve retornar: pg_restore (PostgreSQL) 16.x

# Verificar localização
Get-Command pg_dump
# Deve retornar: C:\Program Files\PostgreSQL\16\bin\pg_dump.exe
```

**✅ Se todos os comandos funcionarem → INSTALAÇÃO CONCLUÍDA**

---

## 🔄 MÉTODO ALTERNATIVO: APENAS CLIENT TOOLS

### **Opção 1: Chocolatey (Se Disponível)**

```powershell
# Instalar Chocolatey (se não tiver)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar PostgreSQL Client Tools
choco install postgresql --params '/Password:yourpassword'
```

---

### **Opção 2: Download Direto do Client Tools**

1. **Acessar:** https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
2. **Escolher:** Versão mais recente
3. **Download:** Instalador completo (inclui client tools)
4. **Durante instalação:** Marcar apenas "Command Line Tools"

---

## ⚠️ TROUBLESHOOTING

### **Problema: "pg_dump não é reconhecido"**

**Solução 1: Adicionar ao PATH manualmente**

```powershell
# Adicionar temporariamente (apenas sessão atual)
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"

# Verificar
pg_dump --version
```

**Solução 2: Usar caminho completo**

```powershell
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" --version
```

---

### **Problema: "Acesso negado"**

**Solução:** Executar PowerShell como Administrador

```powershell
# Abrir PowerShell como Admin
# Clicar com botão direito → "Executar como administrador"
```

---

### **Problema: Versão incompatível**

**Solução:** Instalar versão compatível (PostgreSQL 15 ou 16)

```powershell
# Verificar versão instalada
pg_dump --version

# Se versão muito antiga, desinstalar e reinstalar
```

---

## ✅ CHECKLIST DE INSTALAÇÃO

- [ ] PostgreSQL instalado
- [ ] Command Line Tools marcado durante instalação
- [ ] PATH configurado corretamente
- [ ] `pg_dump --version` funciona
- [ ] `pg_restore --version` funciona
- [ ] Novo PowerShell aberto após configuração do PATH

---

## 📋 PRÓXIMOS PASSOS APÓS INSTALAÇÃO

1. ✅ Validar instalação (`pg_dump --version`)
2. ✅ Coletar credenciais do Supabase Dashboard
3. ✅ Executar comando de backup
4. ✅ Validar backup (`pg_restore --list`)

---

**Documento criado em:** 2025-12-19T16:30:00.000Z  
**Status:** ✅ **GUIA DE INSTALAÇÃO COMPLETO**

