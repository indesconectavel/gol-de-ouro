# 🔧 GUIA COMPLETO - CONFIGURAR GITHUB CLI NO PATH

**Data:** 14 de Novembro de 2025  
**Objetivo:** Adicionar GitHub CLI ao PATH do sistema para uso direto

---

## 📋 PRÉ-REQUISITOS

- ✅ GitHub CLI instalado (versão 2.83.0)
- ✅ Localização: `C:\Program Files\GitHub CLI\gh.exe`

---

## 🚀 MÉTODO 1: Via PowerShell (Recomendado)

### **Passo 1: Abrir PowerShell como Administrador**

1. Pressione `Win + X`
2. Selecione "Windows PowerShell (Admin)" ou "Terminal (Admin)"

### **Passo 2: Executar Script de Configuração**

```powershell
# Navegar para o diretório do projeto
cd "E:\Chute de Ouro\goldeouro-backend"

# Executar script de configuração
powershell -ExecutionPolicy Bypass -File scripts/configurar-github-cli-path.ps1
```

### **Passo 3: Verificar Configuração**

```powershell
# Verificar se GitHub CLI está no PATH
$env:PATH -split ';' | Select-String -Pattern 'GitHub'

# Testar GitHub CLI
gh --version

# Verificar autenticação
gh auth status
```

---

## 🚀 MÉTODO 2: Configuração Manual via Interface Gráfica

### **Passo 1: Abrir Variáveis de Ambiente**

1. Pressione `Win + R`
2. Digite: `sysdm.cpl` e pressione Enter
3. Clique na aba "Avançado"
4. Clique em "Variáveis de Ambiente"

### **Passo 2: Adicionar ao PATH do Usuário**

1. Na seção "Variáveis do usuário", encontre `Path`
2. Clique em "Editar"
3. Clique em "Novo"
4. Adicione: `C:\Program Files\GitHub CLI`
5. Clique em "OK" em todas as janelas

### **Passo 3: Reiniciar Terminal**

- Feche e reabra o PowerShell/Terminal
- Ou execute: `refreshenv` (se tiver Chocolatey)

---

## 🚀 MÉTODO 3: Via PowerShell (Comando Direto)

### **Adicionar ao PATH do Usuário Permanentemente:**

```powershell
# Obter PATH atual
$currentPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)

# Adicionar GitHub CLI se não estiver presente
if ($currentPath -notlike "*GitHub CLI*") {
    $newPath = $currentPath + ";C:\Program Files\GitHub CLI"
    [Environment]::SetEnvironmentVariable("Path", $newPath, [EnvironmentVariableTarget]::User)
    Write-Host "✅ GitHub CLI adicionado ao PATH do usuário" -ForegroundColor Green
} else {
    Write-Host "✅ GitHub CLI já está no PATH" -ForegroundColor Green
}

# Adicionar à sessão atual
$env:PATH += ";C:\Program Files\GitHub CLI"
Write-Host "✅ GitHub CLI adicionado à sessão atual" -ForegroundColor Green
```

### **Verificar Funcionamento:**

```powershell
# Testar GitHub CLI
gh --version

# Deve mostrar: gh version 2.83.0 (2025-11-04)
```

---

## 🔐 PRÓXIMO PASSO: Autenticar GitHub CLI

Após configurar o PATH, autentique o GitHub CLI:

```powershell
# Autenticar GitHub CLI
gh auth login

# Seguir as instruções:
# 1. Escolher "GitHub.com"
# 2. Escolher "HTTPS" ou "SSH"
# 3. Escolher "Login with a web browser"
# 4. Copiar código e colar no navegador
# 5. Autorizar aplicativo
```

---

## ✅ VERIFICAÇÃO FINAL

Execute os seguintes comandos para verificar se tudo está funcionando:

```powershell
# 1. Verificar versão
gh --version

# 2. Verificar autenticação
gh auth status

# 3. Verificar PR #18
gh pr view 18

# 4. Listar PRs
gh pr list
```

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### **Problema: "gh: comando não encontrado"**

**Solução:**
1. Verifique se o caminho está correto: `Test-Path "C:\Program Files\GitHub CLI\gh.exe"`
2. Feche e reabra o terminal
3. Verifique o PATH: `$env:PATH -split ';' | Select-String -Pattern 'GitHub'`

### **Problema: "Acesso negado" ao adicionar ao PATH**

**Solução:**
1. Execute PowerShell como Administrador
2. Ou adicione manualmente via Interface Gráfica (Método 2)

### **Problema: GitHub CLI não autenticado**

**Solução:**
```powershell
gh auth login
```

---

## 📝 RESUMO

1. ✅ GitHub CLI instalado em `C:\Program Files\GitHub CLI`
2. ⏳ Adicionar ao PATH (escolher um dos métodos acima)
3. ⏳ Reiniciar terminal
4. ⏳ Autenticar com `gh auth login`
5. ⏳ Verificar com `gh --version` e `gh auth status`

---

**Última atualização:** 14 de Novembro de 2025

