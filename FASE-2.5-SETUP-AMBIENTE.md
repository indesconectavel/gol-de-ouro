# 🔧 FASE 2.5 — SETUP DE AMBIENTE DE TESTES
## Configuração de Usuários e Credenciais

**Data:** 18/12/2025  
**Status:** 🟡 **EM ANDAMENTO**  
**Ambiente:** Staging

---

## 📊 VALIDAÇÃO INICIAL

### **Backend Staging**
- ✅ **Acessível:** `https://goldeouro-backend-v2.fly.dev`
- ✅ **Health Check:** OK
- ✅ **Endpoint de Login:** Acessível (rate limit ativo)
- ✅ **Endpoint de Métricas:** Acessível
- ⚠️ **Endpoint Admin:** 404 (pode estar em rota diferente)

---

## ⚠️ PROBLEMA IDENTIFICADO: RATE LIMIT

**Sintoma:** Backend retornando 429 (Too Many Requests)

**Causa:** Múltiplas tentativas de login/registro em curto período

**Solução:**
1. Aguardar 15 minutos antes de tentar novamente
2. Ou usar credenciais de usuário existente conhecido
3. Ou criar usuário manualmente via UI

---

## 🔧 OPÇÕES DE SETUP

### **Opção 1: Usar Usuário Existente (RECOMENDADO)**

Se você tem acesso a um usuário existente no ambiente de staging:

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

2. Executar testes:

```bash
cd tests
npm test
```

---

### **Opção 2: Criar Usuário Manualmente**

1. Acessar UI de staging: `https://staging-player.goldeouro.lol`
2. Criar conta de teste via registro
3. Anotar email e senha
4. Configurar no `.env` (ver Opção 1)
5. Executar testes

---

### **Opção 3: Aguardar Rate Limit Expirar**

1. Aguardar 15 minutos
2. Executar: `node tests/scripts/setup-test-users.js`
3. Configurar `.env` com credenciais criadas
4. Executar testes

---

## 📋 CHECKLIST DE SETUP

### **FASE 1: Usuários de Teste**
- [ ] Identificar ou criar usuário Player de teste
- [ ] Identificar ou criar usuário Admin de teste
- [ ] Validar que credenciais funcionam

### **FASE 2: Configuração**
- [ ] Criar arquivo `.env` em `tests/` (NÃO COMMITAR)
- [ ] Configurar `TEST_PLAYER_EMAIL`
- [ ] Configurar `TEST_PLAYER_PASSWORD`
- [ ] Configurar `TEST_ADMIN_EMAIL`
- [ ] Configurar `TEST_ADMIN_PASSWORD`
- [ ] Configurar `TEST_ADMIN_TOKEN`

### **FASE 3: Validação**
- [ ] Validar conectividade com backend
- [ ] Testar login com credenciais configuradas
- [ ] Verificar que endpoints estão acessíveis

### **FASE 4: Execução**
- [ ] Executar testes: `npm test`
- [ ] Revisar relatório gerado
- [ ] Corrigir problemas identificados

---

## 🚀 PRÓXIMOS PASSOS

1. **Configurar credenciais válidas** no arquivo `.env`
2. **Validar conectividade** com backend
3. **Executar testes** automatizados
4. **Revisar relatório** gerado
5. **Executar testes manuais** complementares

---

**SETUP EM ANDAMENTO** 🟡  
**AGUARDANDO CREDENCIAIS VÁLIDAS** ⏸️

