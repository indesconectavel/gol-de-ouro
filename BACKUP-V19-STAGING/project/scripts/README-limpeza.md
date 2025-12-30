# 🧹 Scripts de Limpeza e Otimização - Gol de Ouro

Este diretório contém scripts para limpeza completa, otimização e verificação do projeto Gol de Ouro.

## 📁 Arquivos Disponíveis

### 1. `limpeza-otimizacao-completa.sh` (Linux/macOS)
Script Bash para sistemas Unix/Linux/macOS.

### 2. `limpeza-otimizacao-completa.ps1` (Windows)
Script PowerShell para sistemas Windows.

### 3. `executar-testes-github.sh` (Linux/macOS)
Script para executar testes via GitHub Actions.

## 🚀 Como Usar

### No Windows (PowerShell)
```powershell
# Navegue até o diretório do projeto
cd "E:\Chute de Ouro\goldeouro-backend"

# Execute o script PowerShell
.\scripts\limpeza-otimizacao-completa.ps1
```

### No Linux/macOS (Bash)
```bash
# Navegue até o diretório do projeto
cd /caminho/para/goldeouro-backend

# Torne o script executável
chmod +x scripts/limpeza-otimizacao-completa.sh

# Execute o script
./scripts/limpeza-otimizacao-completa.sh
```

## 🔧 O que os Scripts Fazem

### 1️⃣ Verificação de Segurança
- ✅ Verifica se está no diretório correto
- ✅ Cria backup automático antes da limpeza
- ✅ Valida ambiente local (Node.js, NPM, Git)

### 2️⃣ Limpeza Completa
- 🗑️ Remove `node_modules` de todos os projetos
- 🗑️ Remove pastas de build (`dist`, `.next`, `.turbo`)
- 🗑️ Remove caches (`.cache`, `.vercel`, `.fly`)
- 🗑️ Remove backups antigos
- 🗑️ Remove arquivos temporários

### 3️⃣ Reinstalação
- 📦 Reinstala dependências do `backend`
- 📦 Reinstala dependências do `goldeouro-player`
- 📦 Reinstala dependências do `goldeouro-admin`

### 4️⃣ Otimização Git
- 🧰 Limpa histórico Git (`git gc --aggressive`)
- 🧰 Remove referências expiradas
- 💾 Commit das alterações
- 🚀 Push para repositório remoto

### 5️⃣ Reindexação GitHub Actions
- 🔄 Força reindexação do workflow principal
- 🔍 Verifica workflows ativos
- 📋 Lista workflows disponíveis

## ⚠️ Pré-requisitos

### Windows
- ✅ PowerShell 5.0 ou superior
- ✅ Node.js e NPM instalados
- ✅ Git configurado
- ✅ GitHub CLI (opcional, para verificação de workflows)

### Linux/macOS
- ✅ Bash 4.0 ou superior
- ✅ Node.js e NPM instalados
- ✅ Git configurado
- ✅ GitHub CLI (opcional, para verificação de workflows)

## 🎯 Resultados Esperados

Após a execução bem-sucedida:

1. **✅ Limpeza Completa**
   - Repositório otimizado e limpo
   - Arquivos desnecessários removidos
   - Dependências reinstaladas

2. **✅ Git Otimizado**
   - Histórico limpo e compactado
   - Alterações commitadas
   - Sincronizado com repositório remoto

3. **✅ GitHub Actions Reindexado**
   - Workflow principal atualizado
   - Pronto para execução manual

## 🌐 Próximos Passos

Após executar o script:

1. **Acesse GitHub Actions:**
   ```
   https://github.com/indesconectavel/gol-de-ouro/actions
   ```

2. **Execute Pipeline Principal:**
   - Clique em "🚀 Pipeline Principal - Gol de Ouro"
   - Clique em "Run workflow"
   - Selecione branch "main"
   - Clique em "Run workflow"

3. **Monitore Execução:**
   - Acompanhe logs em tempo real
   - Verifique status de cada job
   - Baixe artifacts gerados

## 🔍 Troubleshooting

### Erro: "Não é um repositório Git"
```bash
git init
git remote add origin https://github.com/indesconectavel/gol-de-ouro.git
```

### Erro: "Node.js não instalado"
- Windows: Baixe de https://nodejs.org
- Linux: `sudo apt install nodejs npm`
- macOS: `brew install node`

### Erro: "GitHub CLI não configurado"
```bash
gh auth login
```

### Erro de Permissões (Windows)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📊 Monitoramento

### Workflows Disponíveis
- ✅ 🚀 Pipeline Principal - Orquestração completa
- ✅ ⚙️ Deploy Backend - Fly.io automático
- ✅ 🎨 Deploy Frontend - Vercel automático
- ✅ 🧪 Testes Automatizados - Unitários, integração, segurança
- ✅ 🔒 Segurança e Qualidade - CodeQL, auditoria
- ✅ 📊 Monitoramento - Verificação contínua
- ✅ ⚠️ Rollback Automático - Restauração automática
- ✅ 🔍 Health Monitor - Verificação 24h

## 🆘 Suporte

Se encontrar problemas:

1. **Verifique os logs** do script
2. **Confirme pré-requisitos** instalados
3. **Execute manualmente** comandos Git se necessário
4. **Verifique conectividade** com GitHub

---

**🎯 Objetivo:** Manter o projeto Gol de Ouro limpo, otimizado e sincronizado com GitHub Actions para execução automática de pipelines.
