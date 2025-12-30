# **🔎 INSTRUÇÕES DE VALIDAÇÃO DE PRODUÇÃO - GOL DE OURO**

## **📋 VISÃO GERAL**

Scripts de validação estrita para produção do Gol de Ouro, sem falso-positivos.

## **🚀 EXECUÇÃO RÁPIDA**

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-final-check.ps1 `
  -ApiBase https://goldeouro-backend-v2.fly.dev `
  -PlayerUrl https://goldeouro.lol `
  -AdminUrl https://admin.goldeouro.lol
```

## **📁 ARQUIVOS CRIADOS**

### **1. scripts/assert-prod.ps1**
- **Função:** Validação estrita de produção (modo falha dura)
- **Verificações:**
  - ✅ GET /health → 200 e {"ok":true}
  - ✅ GET /version → JSON com version e commit
  - ✅ GET /readiness → 200 e validação de DB
  - ✅ GET Player URL → 200
  - ✅ GET Admin URL → 200 (SPA fallback)
  - ✅ CORS preflight OPTIONS com Origin
  - ✅ PWA: manifest + sw.js em produção

### **2. scripts/run-final-check.ps1**
- **Função:** Execução do check final
- **Ações:**
  - Executa assert-prod.ps1
  - Executa go-no-go.ps1 (se existir)
  - Imprime resumo final
  - Retorna GO/NO-GO

## **🔧 PARÂMETROS**

| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| `-ApiBase` | URL base da API | `https://goldeouro-backend-v2.fly.dev` |
| `-PlayerUrl` | URL do frontend player | `https://goldeouro.lol` |
| `-AdminUrl` | URL do frontend admin | `https://admin.goldeouro.lol` |

## **📊 RESULTADOS ESPERADOS**

### **✅ GO (Sucesso)**
```
[API] /health,/readiness,/version .......... OK
[WEB] Player/Admin 200 + SPA fallback ...... OK
[CORS] Preflight completo .................. OK
[PWA] manifest + sw em produção ........... OK
✅ GO — pronto para jogadores reais
```

### **❌ NO-GO (Falha)**
```
[API] /health,/readiness,/version .......... FAIL
[WEB] Player/Admin 200 + SPA fallback ...... FAIL
[CORS] Preflight completo .................. FAIL
[PWA] manifest + sw em produção ........... FAIL
❌ NO-GO — sistema NÃO está pronto para jogadores reais
```

## **🛠️ EXECUÇÃO MANUAL**

### **Apenas validação estrita:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/assert-prod.ps1 `
  -ApiBase https://goldeouro-backend-v2.fly.dev `
  -PlayerUrl https://goldeouro.lol `
  -AdminUrl https://admin.goldeouro.lol
```

### **Check completo:**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-final-check.ps1 `
  -ApiBase https://goldeouro-backend-v2.fly.dev `
  -PlayerUrl https://goldeouro.lol `
  -AdminUrl https://admin.goldeouro.lol
```

## **🔍 CRITÉRIOS DE VALIDAÇÃO**

### **1. API Health Checks**
- **/health:** Status 200 + JSON com "ok": true
- **/version:** Status 200 + JSON com "version" e "commit"
- **/readiness:** Status 200 + validação de database

### **2. Frontend Accessibility**
- **Player:** Status 200 + HTML válido
- **Admin:** Status 200 + SPA fallback funcionando

### **3. CORS Configuration**
- **Preflight:** OPTIONS request com Origin
- **Headers:** Access-Control-Allow-Origin, Methods, Headers

### **4. PWA Implementation**
- **Manifest:** Referência ao manifest.json no HTML
- **Service Worker:** Referência ao sw.js no HTML
- **Cache:** Verificação sem cache (no-cache header)

## **⚠️ IMPORTANTE**

- **Modo estrito:** Qualquer falha resulta em NO-GO
- **Sem falso-positivos:** Validações rigorosas
- **Evidência:** Todas as respostas são salvas para auditoria
- **Exit codes:** 0 = GO, 1 = NO-GO

## **📝 LOGS E DEBUGGING**

Os scripts salvam:
- Respostas completas das APIs
- Cabeçalhos HTTP relevantes
- Conteúdo HTML (primeiros 200 chars)
- Detalhes de erros específicos

## **🎯 OBJETIVO**

Garantir que o sistema Gol de Ouro está 100% pronto para jogadores reais em produção, sem comprometer a qualidade ou segurança.
