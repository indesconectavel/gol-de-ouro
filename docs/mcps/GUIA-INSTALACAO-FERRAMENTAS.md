# 🔧 GUIA DE INSTALAÇÃO DE FERRAMENTAS PARA MCPs

**Data:** 13 de Novembro de 2025  
**Versão:** 1.2.0  
**Status:** ✅ **GUIA COMPLETO**

---

## 📋 VISÃO GERAL

Este guia ajuda a instalar e configurar as ferramentas necessárias para que todos os MCPs funcionem completamente.

---

## 🚀 INSTALAÇÃO RÁPIDA

### **Opção 1: Script Automático (Recomendado)**

Execute o script PowerShell:
```powershell
.\scripts\instalar-ferramentas-mcps.ps1
```

**Nota:** Algumas instalações podem precisar de privilégios de administrador.

---

## 📦 INSTALAÇÃO MANUAL

### **1. GitHub CLI** 🔴 **CRÍTICO**

#### **Windows (via winget):**
```powershell
winget install --id GitHub.cli --accept-package-agreements --accept-source-agreements
```

#### **Windows (via Chocolatey):**
```powershell
choco install gh
```

#### **Download Manual:**
1. Acesse: https://cli.github.com/
2. Baixe o instalador para Windows
3. Execute o instalador
4. Reinicie o terminal

#### **Verificar Instalação:**
```bash
gh --version
```

#### **Configurar Autenticação:**
```bash
gh auth login
```

---

### **2. Docker Desktop** 🟡 **RECOMENDADO**

#### **Windows (via winget):**
```powershell
winget install --id Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
```

#### **Download Manual:**
1. Acesse: https://www.docker.com/products/docker-desktop/
2. Baixe o Docker Desktop para Windows
3. Execute o instalador
4. **Reinicie o computador** após a instalação
5. Inicie o Docker Desktop

#### **Verificar Instalação:**
```bash
docker --version
docker ps
```

#### **Notas Importantes:**
- Docker Desktop requer WSL2 no Windows
- Pode ser necessário habilitar Virtualização na BIOS
- Requer bastante espaço em disco (~4GB)

---

### **3. Jest** ✅ **JÁ CONFIGURADO**

O Jest já está configurado no projeto com:
- ✅ `jest.config.js` criado
- ✅ Timeout aumentado para 30 segundos
- ✅ Configuração otimizada para Node.js

#### **Verificar Instalação:**
```bash
npx jest --version
```

#### **Executar Testes:**
```bash
npm test
# ou
npx jest
```

---

### **4. Lighthouse** ✅ **JÁ CONFIGURADO**

O Lighthouse não precisa ser instalado globalmente. Pode ser usado via `npx`:

#### **Verificar Instalação:**
```bash
npx lighthouse --version
```

#### **Executar Auditoria:**
```bash
npx lighthouse https://goldeouro.lol --output html --output-path ./reports/lighthouse-report.html
```

#### **Nota:**
- O timeout foi aumentado para 30 segundos no script de verificação
- Lighthouse pode ser lento na primeira execução (baixa dependências)

---

## 🔧 CORREÇÕES APLICADAS

### **1. Jest Configuration**
- ✅ Criado `jest.config.js` com timeout de 30 segundos
- ✅ Configurado para ambiente Node.js
- ✅ Padrões de teste definidos

### **2. Lighthouse Timeout**
- ✅ Timeout aumentado para 30 segundos no script de verificação
- ✅ Pode ser usado via `npx` sem instalação global

### **3. Script de Verificação**
- ✅ Timeouts personalizados por MCP
- ✅ Verificação melhorada de variáveis de ambiente

---

## 📊 STATUS APÓS INSTALAÇÃO

Após instalar todas as ferramentas, execute:

```bash
node scripts/verificar-mcps.js
```

### **Resultado Esperado:**

#### **✅ MCPs Funcionando (6/10 - 60%):**
1. ✅ Vercel MCP
2. ✅ Fly.io MCP
3. ✅ Supabase MCP
4. ✅ GitHub Actions MCP (após instalar GitHub CLI)
5. ✅ Docker MCP (após instalar Docker Desktop)
6. ✅ ESLint MCP

#### **✅ MCPs Funcionando (7/10 - 70%):**
7. ✅ Jest MCP (após correções)
8. ✅ Lighthouse MCP (após correções)

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### **GitHub CLI não encontrado após instalação:**
1. Reinicie o terminal/PowerShell
2. Verifique se está no PATH: `$env:Path`
3. Adicione manualmente ao PATH se necessário

### **Docker não inicia:**
1. Verifique se WSL2 está instalado: `wsl --version`
2. Instale WSL2 se necessário: `wsl --install`
3. Reinicie o computador
4. Verifique se Virtualização está habilitada na BIOS

### **Jest timeout:**
1. Verifique `jest.config.js` - timeout deve ser 30000
2. Execute: `npx jest --version` para verificar instalação
3. Aumente timeout se necessário: `testTimeout: 60000`

### **Lighthouse timeout:**
1. O timeout já foi aumentado para 30 segundos
2. Na primeira execução, pode demorar mais (baixa dependências)
3. Execute manualmente: `npx lighthouse --version`

---

## ✅ CHECKLIST DE INSTALAÇÃO

- [ ] GitHub CLI instalado e configurado
- [ ] Docker Desktop instalado e funcionando
- [ ] Jest configurado (já feito)
- [ ] Lighthouse configurado (já feito)
- [ ] Script de verificação executado: `node scripts/verificar-mcps.js`
- [ ] Todos os MCPs críticos funcionando

---

## 📝 PRÓXIMOS PASSOS

Após instalar todas as ferramentas:

1. **Execute verificação:**
   ```bash
   node scripts/verificar-mcps.js
   ```

2. **Teste cada MCP individualmente:**
   - Vercel: `npx vercel --version`
   - Fly.io: `flyctl version`
   - Supabase: `node test-supabase.js`
   - GitHub: `gh --version`
   - Docker: `docker --version`
   - Jest: `npx jest --version`
   - Lighthouse: `npx lighthouse --version`

3. **Integre os MCPs no workflow:**
   - Use os comandos definidos em `cursor.json`
   - Teste deploy via MCPs
   - Monitore logs e status

---

**Atualizado em:** 13 de Novembro de 2025  
**Versão:** 1.0  
**Status:** ✅ **GUIA COMPLETO**

