# **📦 INSTRUÇÕES - EVIDENCE PACK (PROVAS DE GO REAL)**

## **📋 VISÃO GERAL**

Script para capturar evidências completas de produção do Gol de Ouro, gerando um pacote de provas para auditoria.

## **🚀 EXECUÇÃO RÁPIDA**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/capture-evidence.ps1 `
  -ApiBase https://goldeouro-backend-v2.fly.dev `
  -PlayerUrl https://goldeouro.lol `
  -AdminUrl https://admin.goldeouro.lol
```

## **📁 ARQUIVOS GERADOS**

### **Pasta de Evidências:**
- `release-evidence-YYYYMMDD-HHmmss/`

### **Arquivos Capturados:**
- **api-health.json** - Resposta completa do endpoint /health
- **api-version.json** - Resposta completa do endpoint /version  
- **api-readiness.json** - Resposta completa do endpoint /readiness
- **player.html** - HTML completo do frontend player (sem cache)
- **admin-login.html** - HTML completo do admin /login (sem cache)
- **cors-preflight-headers.txt** - Cabeçalhos CORS do preflight
- **api-logs.txt** - Últimas 50 linhas de logs da API
- **EVIDENCE-*.md** - Relatório consolidado de evidências

### **ZIP Compactado:**
- `release-evidence-YYYYMMDD-HHmmss.zip`

## **🔧 PARÂMETROS**

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| `-ApiBase` | URL base da API | `https://goldeouro-backend-v2.fly.dev` |
| `-PlayerUrl` | URL do frontend player | `https://goldeouro.lol` |
| `-AdminUrl` | URL do frontend admin | `https://admin.goldeouro.lol` |

## **📊 CONTEÚDO DAS EVIDÊNCIAS**

### **1. API Responses (JSON)**
- **Health:** Status, uptime, memory, database
- **Version:** Versão, commit, build info
- **Readiness:** Status de prontidão, validações

### **2. Frontend HTML**
- **Player:** HTML completo sem cache
- **Admin:** HTML da página de login sem cache
- **Primeiros 200 chars:** Mostrados no relatório MD

### **3. CORS Headers**
- **Preflight:** Headers de resposta OPTIONS
- **Allow-Origin:** Configuração de origem
- **Allow-Methods:** Métodos permitidos
- **Allow-Headers:** Headers permitidos

### **4. API Logs**
- **Últimas 50 linhas:** Logs recentes da aplicação
- **Timestamp:** Data/hora das operações
- **Status:** Informações de debug e erro

## **📄 RELATÓRIO EVIDENCE.MD**

O arquivo `EVIDENCE-*.md` contém:

- **Conteúdo bruto** de todas as APIs
- **Cabeçalhos** do preflight CORS
- **Primeiros 200 chars** do HTML dos frontends
- **Últimas 50 linhas** de logs
- **Resumo** de status de captura
- **Timestamp** de geração

## **🎯 OBJETIVO**

Gerar um pacote completo de evidências que prove que o sistema Gol de Ouro está funcionando corretamente em produção, sem possibilidade de falso-positivo.

## **📦 USO DO ZIP**

O arquivo ZIP gerado pode ser:
- **Enviado para auditoria**
- **Arquivado como evidência**
- **Compartilhado com stakeholders**
- **Usado para troubleshooting**

## **⚠️ IMPORTANTE**

- **Sem cache:** HTMLs capturados com `Cache-Control: no-cache`
- **Timestamp único:** Cada execução gera pasta com timestamp
- **Dados reais:** Todas as evidências são capturadas em tempo real
- **Completo:** Pacote contém todas as provas necessárias

## **🔍 EXEMPLO DE SAÍDA**

```
📦 CAPTURANDO EVIDENCIAS DE PRODUCAO - GOL DE OURO
Pasta: release-evidence-20250927-143022

1. Capturando API Health...
   ✅ api-health.json salvo
2. Capturando API Version...
   ✅ api-version.json salvo
3. Capturando API Readiness...
   ✅ api-readiness.json salvo
4. Capturando Player HTML...
   ✅ player.html salvo (684 chars)
5. Capturando Admin Login HTML...
   ✅ admin-login.html salvo (477 chars)
6. Capturando CORS Preflight Headers...
   ✅ cors-preflight-headers.txt salvo
7. Capturando API Logs...
   ✅ api-logs.txt salvo (ultimas 50 linhas)
8. Gerando EVIDENCE Markdown...
   ✅ EVIDENCE-20250927-143022.md gerado
9. Compactando evidências...
   ✅ release-evidence-20250927-143022.zip criado

============================================================
📦 EVIDENCE PACK CRIADO COM SUCESSO!

📁 Pasta de evidências: release-evidence-20250927-143022
📦 ZIP compactado: release-evidence-20250927-143022.zip

✅ EVIDENCE PACK PRONTO PARA AUDITORIA!
```
