# 📋 FASE 3 — BLOCO R1: ROLLBACK RÁPIDO
## Procedimento de Rollback em ≤ 5 Minutos

**Data:** 19/12/2025  
**Hora:** 16:04:00  
**Fase:** 3 - GO-LIVE CONTROLADO  
**Status:** ✅ **PROCEDIMENTO DOCUMENTADO**

---

## 🎯 OBJETIVO

Descrever procedimento exato para rollback rápido (≤ 5 minutos) de backend e frontend, identificando ponto seguro anterior.

---

## ⚠️ QUANDO EXECUTAR ROLLBACK

### **Cenários Críticos:**

1. ❌ **Healthcheck falha** após deploy
2. ❌ **Erro crítico de autenticação**
3. ❌ **Chute inconsistente** (retorna 500)
4. ❌ **Falha em pagamentos** (PIX não cria)
5. ❌ **Erros generalizados** (>10% de requisições falhando)
6. ❌ **Regressão grave na UI**
7. ❌ **Perda de dados** ou inconsistência financeira

---

## 🔄 ROLLBACK BACKEND (Fly.io)

### **Método 1: Rollback para Versão Anterior**

**Tempo Estimado:** 2-3 minutos

```bash
# 1. Listar releases anteriores
fly releases list

# 2. Identificar release anterior estável
# Exemplo: v1.0.0-stable ou commit hash anterior

# 3. Rollback para release anterior
fly releases rollback <release-id>

# OU rollback para versão específica
fly releases rollback --version <version>
```

**Validação:**
- ✅ Healthcheck deve voltar a funcionar
- ✅ Endpoints críticos devem funcionar
- ✅ Logs devem mostrar versão anterior

---

### **Método 2: Deploy de Tag Anterior**

**Tempo Estimado:** 3-4 minutos

```bash
# 1. Verificar tag anterior
git tag -l | grep v1.0.0

# 2. Checkout tag anterior
git checkout v1.0.0-stable

# 3. Deploy da tag anterior
fly deploy --image <image-hash-anterior>

# OU
fly deploy --config fly.toml
```

**Validação:**
- ✅ Deploy deve completar
- ✅ Versão anterior deve estar ativa
- ✅ Healthcheck deve funcionar

---

### **Método 3: Restart com Configuração Anterior**

**Tempo Estimado:** 1-2 minutos

```bash
# 1. Restart da aplicação
fly apps restart goldeouro-backend-v2

# 2. Verificar logs
fly logs

# 3. Validar healthcheck
curl https://goldeouro-backend-v2.fly.dev/health
```

**Validação:**
- ✅ Aplicação deve reiniciar
- ✅ Healthcheck deve funcionar
- ✅ Nenhum erro crítico nos logs

---

## 🔄 ROLLBACK FRONTEND (Vercel)

### **Rollback Player**

**Tempo Estimado:** 1-2 minutos

**Método 1: Via Dashboard**
1. Acessar: https://vercel.com/dashboard
2. Selecionar projeto: `goldeouro-player`
3. Ir em "Deployments"
4. Encontrar deploy anterior estável
5. Clicar em "..." → "Promote to Production"

**Método 2: Via CLI**
```bash
# 1. Listar deployments
vercel ls goldeouro-player

# 2. Promover deployment anterior
vercel promote <deployment-url> --yes
```

**Validação:**
- ✅ Deploy anterior deve estar ativo
- ✅ Página deve carregar corretamente
- ✅ Nenhum erro no console

---

### **Rollback Admin**

**Tempo Estimado:** 1-2 minutos

**Método 1: Via Dashboard**
1. Acessar: https://vercel.com/dashboard
2. Selecionar projeto: `goldeouro-admin`
3. Ir em "Deployments"
4. Encontrar deploy anterior estável
5. Clicar em "..." → "Promote to Production"

**Método 2: Via CLI**
```bash
# 1. Listar deployments
vercel ls goldeouro-admin

# 2. Promover deployment anterior
vercel promote <deployment-url> --yes
```

**Validação:**
- ✅ Deploy anterior deve estar ativo
- ✅ Página deve carregar corretamente
- ✅ Nenhum erro no console

---

## 🔄 ROLLBACK BANCO DE DADOS (Supabase)

### **⚠️ ATENÇÃO: Rollback de Banco é DESTRUTIVO**

**Tempo Estimado:** 5-10 minutos

**⚠️ SÓ EXECUTAR SE ABSOLUTAMENTE NECESSÁRIO**

**Método:**
1. Acessar Dashboard Supabase
2. Ir em Settings → Database → Backups
3. Selecionar backup pré-deploy
4. Restaurar backup completo

**Validação:**
- ✅ Backup deve ser restaurado
- ✅ Dados devem estar consistentes
- ✅ Integridade deve ser validada

---

## 📋 PONTO SEGURO ANTERIOR

### **Identificação do Ponto Seguro:**

**Tag Segura:** `v1.0.0-pre-deploy`  
**Commit Hash:** `_____________`  
**Data:** 19/12/2025  
**Status:** ✅ **VALIDADO ANTES DO DEPLOY**

**Características:**
- ✅ Todas as validações da FASE 2.6 passaram
- ✅ Sistema funcional e testado
- ✅ Nenhum bloqueador crítico
- ✅ Backup completo executado

---

## 📊 CHECKLIST DE ROLLBACK

### **Antes de Executar:**

- [ ] Confirmar que rollback é necessário
- [ ] Identificar ponto seguro anterior
- [ ] Confirmar que backup existe
- [ ] Notificar equipe sobre rollback

### **Durante Rollback:**

- [ ] Executar rollback backend
- [ ] Executar rollback frontend (se necessário)
- [ ] Validar healthcheck após rollback
- [ ] Validar endpoints críticos

### **Após Rollback:**

- [ ] Confirmar que sistema está estável
- [ ] Validar que funcionalidades críticas funcionam
- [ ] Documentar motivo do rollback
- [ ] Planejar correções antes de novo deploy

---

## ⚠️ PROCEDIMENTO DE EMERGÊNCIA

### **Se Rollback Falhar:**

1. **Contatar Suporte:**
   - Fly.io Support: https://fly.io/support
   - Vercel Support: https://vercel.com/support

2. **Restaurar Backup:**
   - Restaurar backup completo do Supabase
   - Validar integridade dos dados

3. **Documentar:**
   - Registrar todos os passos executados
   - Documentar erros encontrados
   - Criar plano de recuperação

---

## ✅ CONCLUSÃO DO ROLLBACK RÁPIDO

**Status:** ✅ **PROCEDIMENTO DOCUMENTADO**

**Tempo Máximo:** ≤ 5 minutos

**Observações:**
- ✅ Procedimentos claros definidos
- ✅ Múltiplos métodos disponíveis
- ✅ Validações obrigatórias documentadas

---

**Documento gerado em:** 2025-12-19T16:04:00.000Z  
**Status:** ✅ **BLOCO R1 DOCUMENTADO - PRONTO PARA USO EMERGÊNCIA**

