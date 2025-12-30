# 📋 FASE 2.5 — INSTRUÇÕES DE SETUP
## Guia Passo a Passo para Configurar e Executar Testes

**Data:** 18/12/2025  
**Status:** 🟡 **AGUARDANDO CONFIGURAÇÃO DE CREDENCIAIS**

---

## 🎯 OBJETIVO

Configurar ambiente de testes com credenciais válidas e executar todos os testes automatizados.

---

## 📋 PRÉ-REQUISITOS

- [x] ✅ Node.js >= 18.0.0 instalado
- [x] ✅ Dependências instaladas (`npm install` em `tests/`)
- [x] ✅ Backend staging acessível
- [ ] ⏸️ Credenciais válidas de usuário Player
- [ ] ⏸️ Credenciais válidas de usuário Admin

---

## 🔧 PASSO 1: CONFIGURAR CREDENCIAIS

### **Opção A: Criar Arquivo .env Manualmente**

1. Criar arquivo `.env` em `tests/`:

```env
STAGING_BASE_URL=https://goldeouro-backend-v2.fly.dev
TEST_PLAYER_EMAIL=seu_email_existente@exemplo.com
TEST_PLAYER_PASSWORD=sua_senha_existente
TEST_ADMIN_EMAIL=admin@exemplo.com
TEST_ADMIN_PASSWORD=senha_admin
TEST_ADMIN_TOKEN=goldeouro123
VERBOSE=true
```

2. Substituir `seu_email_existente@exemplo.com` e `sua_senha_existente` por credenciais válidas

### **Opção B: Usar Script Interativo**

```bash
cd tests
node scripts/create-env-file.js
```

O script perguntará as credenciais interativamente.

---

## 🔍 PASSO 2: VALIDAR CREDENCIAIS

### **Testar Login Manualmente**

```bash
cd tests
node -e "
const axios = require('axios');
require('./scripts/load-env');
const email = process.env.TEST_PLAYER_EMAIL;
const password = process.env.TEST_PLAYER_PASSWORD;
axios.post('https://goldeouro-backend-v2.fly.dev/api/auth/login', {email, password})
  .then(r => console.log('✅ Login OK:', r.data.success))
  .catch(e => console.log('❌ Login falhou:', e.response?.data?.message || e.message));
"
```

Se retornar `✅ Login OK: true`, credenciais estão corretas.

---

## 🚀 PASSO 3: EXECUTAR TESTES

### **Executar Todos os Testes**

```bash
cd tests
npm test
```

### **Ou Executar Script Diretamente**

```bash
cd tests
node runner.js
```

---

## 📊 PASSO 4: REVISAR RELATÓRIO

Após execução, o relatório será gerado em:

```
E:\Chute de Ouro\goldeouro-backend\tests\reports\latest-report.md
```

Abrir e revisar:
- Taxa de sucesso
- Falhas críticas
- Decisão GO/NO-GO

---

## ⚠️ PROBLEMAS COMUNS

### **Problema 1: Rate Limit (429)**

**Sintoma:** "Muitas tentativas de login"

**Solução:**
- Aguardar 15 minutos
- Ou usar credenciais de usuário existente
- Ou criar usuário manualmente via UI

---

### **Problema 2: Credenciais Inválidas (401)**

**Sintoma:** "Credenciais inválidas"

**Solução:**
- Verificar que email e senha estão corretos
- Verificar que usuário existe no ambiente de staging
- Criar usuário manualmente se necessário

---

### **Problema 3: Endpoint Admin 404**

**Sintoma:** "Request failed with status code 404"

**Solução:**
- Verificar rota correta do endpoint admin
- Pode estar em `/admin/stats` em vez de `/api/admin/stats`
- Ajustar testes se necessário

---

## 📋 CHECKLIST FINAL

Antes de considerar testes prontos:

- [ ] Arquivo `.env` criado em `tests/`
- [ ] Credenciais Player configuradas e validadas
- [ ] Credenciais Admin configuradas
- [ ] Login manual funciona
- [ ] Testes executados com sucesso
- [ ] Relatório revisado
- [ ] Decisão GO/NO-GO tomada

---

## 🎯 PRÓXIMOS PASSOS APÓS SETUP

1. Executar testes automatizados
2. Revisar relatório gerado
3. Executar testes manuais complementares
4. Corrigir problemas identificados
5. Re-executar testes após correções
6. Avançar para FASE 3 quando aprovado

---

**INSTRUÇÕES DE SETUP CRIADAS** ✅  
**AGUARDANDO CONFIGURAÇÃO DE CREDENCIAIS** ⏸️

