# **🏷️ README-RELEASE v1.1.2 - GOL DE OURO**

## **📋 VISÃO GERAL**

Release formal v1.1.2 com trava de regressão para a rota do jogo e validação estrita de produção.

## **🚀 COMANDOS FINAIS**

### **1. Executar Release v1.1.2**
```powershell
powershell -ExecutionPolicy Bypass -File scripts/release-v1.1.2.ps1
```

### **2. Criar Tag Git**
```bash
git tag -a v1.1.2 -m "Release v1.1.2"
```

### **3. Push Tags**
```bash
git push --tags
```

## **📊 COMPONENTES DA RELEASE**

### **✅ Teste de Contrato**
- **Arquivo:** `tests/contracts/games.shoot.http`
- **Casos:** 401 sem token, 403 token inválido, 200 com token válido
- **Script:** `npm run test:contract`

### **✅ CI GitHub Actions**
- **Arquivo:** `.github/workflows/contract.yml`
- **Node:** 20
- **Comando:** `npm run test:contract`
- **Falha dura:** Sim

### **✅ Endpoint /version**
- **Rota:** `GET /version`
- **Resposta:** `{version: "v1.1.2", commit: "unknown"}`
- **Implementado:** `server-fly.js`

### **✅ Changelog Atualizado**
- **Arquivo:** `CHANGELOG.md`
- **Versão:** v1.1.2 — PWA + APK + Fix shoot (2025-09-27)
- **Conteúdo:** Correções críticas, PWA, APK, melhorias, segurança, validação

### **✅ Script de Release**
- **Arquivo:** `scripts/release-v1.1.2.ps1`
- **Validações:** Contrato, Assert, Evidence
- **Resultado:** GO/NO-GO

## **🔧 VALIDAÇÕES INCLUÍDAS**

### **1. Teste de Contrato**
- Verifica se `/api/games/shoot` responde corretamente
- Testa autenticação (401, 403, 200)
- Valida campos mínimos da resposta

### **2. Validação Estrita**
- Executa `scripts/assert-prod-simple.ps1`
- Verifica health, version, readiness
- Valida frontend Player e Admin

### **3. Evidence Pack**
- Executa `scripts/capture-evidence-simple.ps1`
- Gera evidências de produção
- Cria ZIP para auditoria

## **📁 ARQUIVOS CRIADOS/MODIFICADOS**

### **Novos Arquivos:**
- `tests/contracts/games.shoot.http`
- `tests/run-contracts.js`
- `.github/workflows/contract.yml`
- `scripts/release-v1.1.2.ps1`
- `README-RELEASE.md`

### **Arquivos Modificados:**
- `package.json` (adicionado script test:contract)
- `server-fly.js` (adicionado endpoint /version)
- `CHANGELOG.md` (atualizado para v1.1.2)

## **🎯 OBJETIVOS ALCANÇADOS**

### **✅ Trava de Regressão**
- Testes de contrato para `/api/games/shoot`
- CI automatizado no GitHub
- Validação estrita de produção

### **✅ Release Formal**
- Changelog atualizado
- Script de release automatizado
- Tags Git configuradas

### **✅ Validação Completa**
- GO/NO-GO estrito
- Evidence pack para auditoria
- Monitoramento via /version

## **⚠️ IMPORTANTE**

- **Falha dura:** Se qualquer validação falhar, a release é rejeitada
- **Sem discussão:** Validações são objetivas e automáticas
- **Evidências:** Pack completo gerado para auditoria
- **Tags:** Release só é aprovada se todos os testes passarem

## **🔍 TROUBLESHOOTING**

### **Se Admin /login responder 404:**
- Verificar `vercel.json` do projeto em produção
- Confirmar SPA fallback configurado

### **Se PWA não aparecer em produção:**
- Validar se `vite.config.js` antigo não está "ganhando" do `.ts`
- Verificar configuração de manifest e service worker

### **Se /version não bater:**
- Deploy da API não atualizou
- Usar `flyctl releases` e `flyctl logs`

## **🎉 RESULTADO ESPERADO**

```
🏷️ RELEASE v1.1.2 - GOL DE OURO

1. Executando testes de contrato...
   [CONTRACT] /api/games/shoot .......... OK
2. Executando validação estrita...
   [ASSERT]   Produção estrita ........... OK
3. Gerando evidence pack...
   [EVIDENCE] Pack gerado ................ OK

============================================================
📊 RESUMO DA RELEASE v1.1.2:

[CONTRACT] /api/games/shoot .......... OK
[ASSERT]   Produção estrita ........... OK
[EVIDENCE] Pack gerado ................ OK

✅ Release v1.1.2 pronta

🚀 COMANDOS PARA FINALIZAR:
git tag -a v1.1.2 -m "Release v1.1.2"
git push --tags

🎉 RELEASE v1.1.2 APROVADA!
```
