# 🧩 GATILHO MCP AUTOMÁTICO - GOL DE OURO v1.1.1

## 📋 Visão Geral

Sistema MCP automático configurado para executar auditoria completa antes de:
- Push para branch principal (main/master)
- Deploy de produção (Vercel/Render/Railway)

## 🎯 Comando Principal

```bash
cursor run "Audit Gol de Ouro"
```

## 🔄 Triggers Automáticos

### Git Push
- **Trigger**: `git push origin main`
- **Ação**: Executa auditoria MCP
- **Resultado**: Bloqueia push se auditoria falhar

### Deploy
- **Trigger**: `vercel deploy` ou `npm run deploy`
- **Ação**: Executa auditoria MCP
- **Resultado**: Bloqueia deploy se auditoria falhar

## 📊 Relatórios

### Localização
- **Diretório**: `/reports/`
- **Último**: `audit-latest.md`
- **Histórico**: `audit-[timestamp].md`

### Formato de Saída
```
⚙️ MCP AUDIT HOOK — GOL DE OURO
=================================
Branch: main
Versão: GO-LIVE v1.1.1
Status: ✅ OK
Relatório salvo em: /reports/audit-2025-10-07.md
```

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
# Via Cursor
cursor run "Audit Gol de Ouro"

# Via NPM
npm run audit:mcp
```

## ⚙️ Configuração

### Cursor MCP
- **Arquivo**: `cursor.json`
- **Comando**: `Audit Gol de Ouro`
- **Auto-trigger**: Push e Deploy

### Git Hooks
- **Arquivo**: `.git/hooks/pre-push`
- **Trigger**: Push para main/master

### Vercel Hooks
- **Arquivo**: `vercel-build.json`
- **Build Command**: Inclui auditoria MCP

## 🔧 Comandos Disponíveis

| Comando | Descrição | Auto-trigger |
|---------|-----------|--------------|
| `Audit Gol de Ouro` | Auditoria completa | ✅ Push/Deploy |
| `audit:full` | Auditoria detalhada | ❌ Manual |
| `audit:mcp` | Auditoria MCP | ❌ Manual |
| `deploy:safe` | Deploy com auditoria | ❌ Manual |

## 📈 Status da Auditoria

- **✅ OK**: Auditoria passou, deploy autorizado
- **⚠️ ALERTA**: Auditoria com avisos, deploy continua
- **❌ ERRO**: Auditoria falhou, deploy bloqueado

## 🛠️ Manutenção

### Verificar Status
```bash
cd mcp-system
node audit-simple.js --status
```

### Atualizar Relatórios
```bash
cd mcp-system
node audit-simple.js --report
```

## 🎯 Objetivos

1. **Qualidade**: Garantir qualidade antes de deploy
2. **Automação**: Reduzir erros manuais
3. **Rastreabilidade**: Histórico de auditorias
4. **Confiabilidade**: Sistema estável e confiável

---
**Sistema MCP Gol de Ouro v1.1.1** 🤖
