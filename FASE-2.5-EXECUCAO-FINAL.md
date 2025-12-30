# 🚀 FASE 2.5 — EXECUÇÃO FINAL
## Guia Completo para Executar Testes com Credenciais Configuradas

**Data:** 18/12/2025  
**Status:** 🟢 **PRONTO PARA EXECUÇÃO**

---

## ✅ SETUP CONCLUÍDO

Todas as ferramentas e scripts necessários foram criados:

- ✅ Scripts de setup e validação
- ✅ Suporte a arquivo `.env` para credenciais
- ✅ Integração com testes automatizados
- ✅ Documentação completa

---

## 🔑 CONFIGURAR CREDENCIAIS (OBRIGATÓRIO)

### **Opção 1: Criar `.env` Manualmente (RECOMENDADO)**

1. Criar arquivo `tests/.env`:

```env
STAGING_BASE_URL=https://goldeouro-backend-v2.fly.dev
TEST_PLAYER_EMAIL=free10signer@gmail.com
TEST_PLAYER_PASSWORD=Free10signer
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=admin123
TEST_ADMIN_TOKEN=goldeouro123
VERBOSE=true
```

2. **⚠️ IMPORTANTE:** Substituir `free10signer@gmail.com` e `Free10signer` por credenciais válidas se essas não funcionarem.

---

### **Opção 2: Usar Script Interativo**

```bash
cd tests
node scripts/create-env-file.js
```

O script perguntará as credenciais interativamente.

---

## ✅ VALIDAR CREDENCIAIS ANTES DE EXECUTAR

**IMPORTANTE:** Sempre validar credenciais antes de executar todos os testes.

```bash
cd tests
node -e "
const axios = require('axios');
require('./scripts/load-env');
const email = process.env.TEST_PLAYER_EMAIL;
const password = process.env.TEST_PLAYER_PASSWORD;
console.log('🔍 Testando login:', email);
axios.post('https://goldeouro-backend-v2.fly.dev/api/auth/login', {email, password})
  .then(r => {
    if (r.data && r.data.success) {
      console.log('✅ Login OK! Credenciais válidas.');
      console.log('✅ Token recebido:', r.data.data?.token ? 'Sim' : 'Não');
    } else {
      console.log('❌ Login falhou: Resposta inválida');
    }
  })
  .catch(e => {
    if (e.response?.status === 401) {
      console.log('❌ Credenciais inválidas. Verifique email e senha.');
    } else if (e.response?.status === 429) {
      console.log('⚠️ Rate limit ativo. Aguarde 15 minutos.');
    } else {
      console.log('❌ Erro:', e.response?.data?.message || e.message);
    }
  });
"
```

**Se retornar `✅ Login OK!`, prosseguir para execução dos testes.**

---

## 🚀 EXECUTAR TESTES AUTOMATIZADOS

### **Comando Principal:**

```bash
cd tests
npm test
```

### **Ou Executar Diretamente:**

```bash
cd tests
node runner.js
```

---

## 📊 REVISAR RESULTADOS

Após execução, o relatório será gerado em:

```
tests/reports/latest-report.md
```

**Abrir e revisar:**
- Taxa de sucesso
- Falhas críticas
- Falhas não críticas
- Decisão GO/NO-GO

---

## 🔍 INTERPRETAR RESULTADOS

### **✅ APTO PARA FASE 3 (GO):**
- Taxa de sucesso >= 80%
- Nenhuma falha crítica não resolvida
- Todos os fluxos principais funcionando

### **❌ NÃO APTO PARA FASE 3 (NO-GO):**
- Taxa de sucesso < 80%
- Falhas críticas não resolvidas
- Problemas de autenticação não resolvidos

---

## ⚠️ PROBLEMAS COMUNS E SOLUÇÕES

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
1. Verificar que email e senha estão corretos no `.env`
2. Testar login manualmente (ver seção acima)
3. Criar usuário manualmente se necessário

---

### **Problema 3: Endpoint Admin 404**

**Sintoma:** "Request failed with status code 404"

**Solução:**
- Verificar rota correta do endpoint admin
- Pode estar em `/admin/stats` em vez de `/api/admin/stats`
- Ajustar testes se necessário

---

## 📋 CHECKLIST DE EXECUÇÃO

Antes de executar:

- [ ] Arquivo `.env` criado em `tests/`
- [ ] Credenciais Player configuradas
- [ ] Credenciais Admin configuradas
- [ ] Login manual testado e funcionando
- [ ] Backend staging acessível
- [ ] Rate limit não está ativo

Após execução:

- [ ] Relatório revisado
- [ ] Falhas críticas identificadas
- [ ] Decisão GO/NO-GO tomada
- [ ] Próximos passos definidos

---

## 🎯 RESULTADO ESPERADO

Após executar testes com credenciais válidas:

1. ✅ Todos os testes executados (26 testes)
2. ✅ Relatório gerado em Markdown
3. ✅ Taxa de sucesso calculada
4. ✅ Falhas classificadas (crítica, alta, média, baixa)
5. ✅ Decisão GO/NO-GO para FASE 3

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- `FASE-2.5-SETUP-AMBIENTE.md` - Status do setup
- `FASE-2.5-INSTRUCOES-SETUP.md` - Instruções detalhadas
- `FASE-2.5-RESUMO-SETUP-COMPLETO.md` - Resumo completo
- `tests/README.md` - Documentação dos testes
- `tests/.env.example` - Template de configuração

---

**PRONTO PARA EXECUÇÃO** 🚀  
**AGUARDANDO CONFIGURAÇÃO DE CREDENCIAIS** ⏸️

