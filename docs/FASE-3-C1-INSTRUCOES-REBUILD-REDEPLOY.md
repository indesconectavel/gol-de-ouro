# 📋 FASE 3 — BLOCO C1: INSTRUÇÕES PARA REBUILD E REDEPLOY
## Correção Aplicada - Próximos Passos

**Data:** 19/12/2025  
**Hora:** 19:15:00  
**Status:** ✅ **CORREÇÃO APLICADA - AGUARDANDO REBUILD**

---

## 🎯 CORREÇÃO APLICADA

**Problema:** Sistema estava usando `goldeouro-backend.fly.dev` (antigo) em vez de `goldeouro-backend-v2.fly.dev` (produção).

**Correção:** 
- ✅ Detecção de ambiente corrigida em `environments.js`
- ✅ Verificação explícita para `www.goldeouro.lol`
- ✅ Ordem de verificação corrigida (produção antes de staging)
- ✅ `apiClient.js` atualizado para usar ambiente atual

---

## 📋 PASSO 1: REBUILD DO PLAYER

### **Comandos:**

```powershell
cd goldeouro-player
npm run build
```

### **Validações:**

- ✅ Build completa sem erros
- ✅ Arquivos gerados em `dist/`
- ✅ Nenhum erro de compilação

**Tempo estimado:** 2-5 minutos

---

## 📋 PASSO 2: REDEPLOY NO VERCEL

### **Opção 1: Via Vercel CLI**

```powershell
cd goldeouro-player
vercel --prod
```

### **Opção 2: Via Git Push (se configurado)**

```powershell
git add .
git commit -m "fix: corrigir detecção de ambiente para produção"
git push origin release-v1.0.0
```

### **Validações:**

- ✅ Deploy completo sem erros
- ✅ URL do Player acessível
- ✅ Build bem-sucedido no Vercel

**Tempo estimado:** 3-5 minutos

---

## 📋 PASSO 3: VALIDAÇÃO PÓS-CORREÇÃO

### **3.1. Acessar Player**

1. Abrir navegador
2. Acessar `https://www.goldeouro.lol`
3. Abrir Console (F12 → Console)

### **3.2. Verificar Console**

**✅ Esperado:**
- ✅ Nenhum erro `ERR_NAME_NOT_RESOLVED`
- ✅ Nenhum erro relacionado a `goldeouro-backend.fly.dev`
- ✅ Logs mostram ambiente como "PRODUÇÃO REAL"

**❌ Se ainda houver erros:**
- Verificar se rebuild foi executado
- Verificar se redeploy foi executado
- Limpar cache do navegador (Ctrl+Shift+Delete)
- Verificar se URL está correta

---

### **3.3. Testar Login**

1. Tentar fazer login
2. Verificar se funciona
3. Verificar se token é gerado

**✅ Critério de Sucesso:** Login funciona sem erros

---

### **3.4. Verificar Backend Usado**

**No Console do Navegador:**

1. Abrir Network tab (F12 → Network)
2. Tentar fazer login
3. Verificar requisição para `/api/auth/login`
4. Verificar URL completa da requisição

**✅ Esperado:**
- URL deve ser: `https://goldeouro-backend-v2.fly.dev/api/auth/login`
- Não deve ser: `https://goldeouro-backend.fly.dev/api/auth/login`

---

## 📊 CHECKLIST DE VALIDAÇÃO

### **Após Rebuild e Redeploy:**

- [ ] Build executado sem erros
- [ ] Deploy executado com sucesso
- [ ] Player acessível em `www.goldeouro.lol`
- [ ] Console sem erros `ERR_NAME_NOT_RESOLVED`
- [ ] Backend usado é `goldeouro-backend-v2.fly.dev`
- [ ] Login funciona
- [ ] PIX pode ser gerado

---

## 🚨 SE AINDA HOUVER PROBLEMAS

### **Problema: Erros persistem após rebuild**

**Solução:**
1. Limpar cache do navegador completamente
2. Fechar todas as abas do Player
3. Abrir nova aba anônima/privada
4. Acessar `www.goldeouro.lol`
5. Verificar console novamente

---

### **Problema: Build falha**

**Solução:**
1. Verificar erros de compilação
2. Verificar se todas as dependências estão instaladas
3. Executar `npm install` antes do build
4. Verificar se não há erros de sintaxe

---

## 📄 PRÓXIMOS PASSOS APÓS VALIDAÇÃO

Após validar que a correção funcionou:

1. ✅ Continuar com validações do BLOCO C1
2. ✅ Preencher `docs/FASE-3-C1-VALIDACAO-IMEDIATA-EVIDENCIAS.md`
3. ✅ Atualizar `docs/FASE-3-C1-RESUMO-EXECUTIVO.md`
4. ✅ Gerar decisão final

---

**Documento criado em:** 2025-12-19T19:15:00.000Z  
**Status:** ✅ **CORREÇÃO APLICADA - AGUARDANDO REBUILD E REDEPLOY**

