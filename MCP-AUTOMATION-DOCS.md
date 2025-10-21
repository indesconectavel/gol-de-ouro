# 🧩 MCP AUTOMATION - GOL DE OURO v1.1.1

## 📋 Visão Geral

Sistema MCP automático configurado para executar auditoria completa antes de:
- Push para branch principal (main/master)
- Deploy de produção (Vercel)

## 🚀 Como Usar

### Deploy Seguro
```bash
# Admin
cd goldeouro-admin
npm run deploy:safe

# Player
cd goldeouro-player
npm run deploy:safe
```

### Auditoria Manual
```bash
# Auditoria completa
cd mcp-system
node audit-simple.js

# Via package scripts
npm run audit:full
```

## ⚙️ Configuração

### Git Hooks
- **Pre-push**: Executa auditoria antes de push no main
- **Localização**: `.git/hooks/pre-push`

### Vercel Hooks
- **Build Command**: Inclui auditoria pré-deploy
- **Configuração**: `vercel-build.json`

### Cursor MCP
- **Comando**: `audit`
- **Auto-trigger**: Push e Deploy
- **Configuração**: `cursor.json`

## 🔧 Comandos Disponíveis

| Comando | Descrição | Auto-trigger |
|---------|-----------|--------------|
| `audit` | Auditoria completa | ✅ Push/Deploy |
| `audit:full` | Auditoria detalhada | ❌ Manual |
| `deploy:safe` | Deploy com auditoria | ❌ Manual |

## 📊 Relatórios

- **Localização**: `mcp-system/audit-reports/`
- **Formato**: JSON + Markdown
- **Frequência**: A cada push/deploy

## 🛠️ Manutenção

### Atualizar Auditoria
```bash
cd mcp-system
node audit-simple.js --update
```

### Verificar Status
```bash
cd mcp-system
node audit-simple.js --status
```

## 🎯 Objetivos

1. **Qualidade**: Garantir qualidade antes de deploy
2. **Automação**: Reduzir erros manuais
3. **Rastreabilidade**: Histórico de auditorias
4. **Confiabilidade**: Sistema estável e confiável

---
**Sistema MCP Gol de Ouro v1.1.1** 🤖
