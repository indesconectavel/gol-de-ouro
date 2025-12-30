# 📋 FASE 3 — BLOCO D1: MONITORAMENTO 24H
## Plano de Monitoramento e Reação nas Primeiras 24 Horas

**Data:** 19/12/2025  
**Hora:** 16:05:00  
**Fase:** 3 - GO-LIVE CONTROLADO  
**Status:** ✅ **PLANO DOCUMENTADO**

---

## 🎯 OBJETIVO

Definir métricas críticas, criar plano de reação e estabelecer monitoramento ativo nas primeiras 24 horas após deploy.

---

## 📊 MÉTRICAS CRÍTICAS

### **1. Erros**

#### **1.1. Taxa de Erro HTTP**

**Métrica:** `taxa_erro_http = (erros_5xx / total_requisicoes) * 100`  
**Threshold Crítico:** > 5%  
**Threshold Atenção:** > 2%

**Monitoramento:**
- ✅ Logs do Fly.io
- ✅ Vercel Analytics
- ✅ Sentry (se configurado)

**Ação se Threshold Crítico:**
- ⚠️ Investigar imediatamente
- ⚠️ Verificar logs para padrões
- ⚠️ Considerar rollback se > 10%

---

#### **1.2. Erros de Autenticação**

**Métrica:** `taxa_erro_auth = (erros_401_403 / total_auth) * 100`  
**Threshold Crítico:** > 20%  
**Threshold Atenção:** > 10%

**Monitoramento:**
- ✅ Logs de autenticação
- ✅ Endpoint `/api/auth/login`

**Ação se Threshold Crítico:**
- ⚠️ Investigar problema de autenticação
- ⚠️ Verificar tokens e JWT_SECRET
- ⚠️ Considerar rollback se persistir

---

#### **1.3. Erros de Pagamento**

**Métrica:** `taxa_erro_pix = (erros_pix / total_pix) * 100`  
**Threshold Crítico:** > 10%  
**Threshold Atenção:** > 5%

**Monitoramento:**
- ✅ Logs de pagamento
- ✅ Endpoint `/api/payments/pix/criar`
- ✅ Webhooks do Mercado Pago

**Ação se Threshold Crítico:**
- ⚠️ Investigar integração Mercado Pago
- ⚠️ Verificar credenciais
- ⚠️ Considerar rollback se persistir

---

### **2. Latência**

#### **2.1. Latência Média**

**Métrica:** `latencia_media = media(tempo_resposta)`  
**Threshold Crítico:** > 5 segundos  
**Threshold Atenção:** > 2 segundos

**Monitoramento:**
- ✅ Fly.io Metrics
- ✅ Vercel Analytics
- ✅ Healthcheck endpoint

**Ação se Threshold Crítico:**
- ⚠️ Investigar gargalos
- ⚠️ Verificar conexão com Supabase
- ⚠️ Verificar carga do servidor

---

#### **2.2. Latência P95**

**Métrica:** `latencia_p95 = percentil_95(tempo_resposta)`  
**Threshold Crítico:** > 10 segundos  
**Threshold Atenção:** > 5 segundos

**Monitoramento:**
- ✅ Fly.io Metrics
- ✅ Vercel Analytics

**Ação se Threshold Crítico:**
- ⚠️ Investigar requisições lentas
- ⚠️ Verificar queries no banco
- ⚠️ Otimizar endpoints lentos

---

### **3. PIX**

#### **3.1. Taxa de Criação de PIX**

**Métrica:** `taxa_criacao_pix = (pix_criados / tentativas) * 100`  
**Threshold Crítico:** < 80%  
**Threshold Atenção:** < 90%

**Monitoramento:**
- ✅ Logs de pagamento
- ✅ Tabela `pagamentos_pix`
- ✅ Webhooks do Mercado Pago

**Ação se Threshold Crítico:**
- ⚠️ Investigar falhas na criação
- ⚠️ Verificar integração Mercado Pago
- ⚠️ Considerar rollback se persistir

---

#### **3.2. Taxa de Aprovação de PIX**

**Métrica:** `taxa_aprovacao_pix = (pix_aprovados / pix_criados) * 100`  
**Threshold Crítico:** < 50%  
**Threshold Atenção:** < 70%

**Monitoramento:**
- ✅ Webhooks do Mercado Pago
- ✅ Tabela `pagamentos_pix`
- ✅ Status dos pagamentos

**Ação se Threshold Crítico:**
- ⚠️ Investigar rejeições
- ⚠️ Verificar dados enviados ao Mercado Pago
- ⚠️ Validar webhooks

---

### **4. Saldo**

#### **4.1. Consistência de Saldos**

**Métrica:** `saldos_inconsistentes = COUNT(saldo_atual != saldo_calculado)`  
**Threshold Crítico:** > 0  
**Threshold Atenção:** > 5

**Monitoramento:**
- ✅ Query de auditoria financeira
- ✅ Tabela `usuarios` vs `transacoes`

**Ação se Threshold Crítico:**
- ⚠️ Investigar inconsistências imediatamente
- ⚠️ Validar integridade transacional
- ⚠️ Considerar rollback se houver perda de dados

---

#### **4.2. Saldos Negativos**

**Métrica:** `saldos_negativos = COUNT(saldo < 0)`  
**Threshold Crítico:** > 0  
**Threshold Atenção:** > 5

**Monitoramento:**
- ✅ Query de auditoria financeira
- ✅ Tabela `usuarios`

**Ação se Threshold Crítico:**
- ⚠️ Investigar causa imediatamente
- ⚠️ Validar integridade transacional
- ⚠️ Corrigir saldos se necessário

---

## 🔔 PLANO DE REAÇÃO

### **Nível 1: Atenção (< Threshold Crítico)**

**Ações:**
1. ✅ Monitorar métrica de perto
2. ✅ Verificar logs para padrões
3. ✅ Documentar observações
4. ✅ Preparar plano de ação se piorar

**Tempo de Resposta:** < 1 hora

---

### **Nível 2: Crítico (≥ Threshold Crítico)**

**Ações:**
1. ⚠️ Investigar imediatamente
2. ⚠️ Verificar logs detalhadamente
3. ⚠️ Identificar causa raiz
4. ⚠️ Executar correção ou rollback

**Tempo de Resposta:** < 15 minutos

---

### **Nível 3: Emergência (Sistema Inoperante)**

**Ações:**
1. 🚨 Executar rollback imediato
2. 🚨 Notificar equipe
3. 🚨 Documentar incidente
4. 🚨 Criar plano de recuperação

**Tempo de Resposta:** < 5 minutos

---

## 📋 CHECKLIST DE MONITORAMENTO

### **Primeira Hora (0-1h):**

- [ ] Verificar healthcheck a cada 5 minutos
- [ ] Monitorar taxa de erro HTTP
- [ ] Validar criação de PIX
- [ ] Verificar latência média
- [ ] Validar login funcionando

---

### **Primeiras 4 Horas (1-4h):**

- [ ] Verificar métricas a cada 15 minutos
- [ ] Monitorar erros de autenticação
- [ ] Validar consistência de saldos
- [ ] Verificar aprovação de PIX
- [ ] Monitorar latência P95

---

### **Primeiras 12 Horas (4-12h):**

- [ ] Verificar métricas a cada 30 minutos
- [ ] Validar fluxo completo do jogador
- [ ] Monitorar webhooks do Mercado Pago
- [ ] Verificar integridade financeira
- [ ] Validar performance geral

---

### **Primeiras 24 Horas (12-24h):**

- [ ] Verificar métricas a cada hora
- [ ] Consolidar relatório de métricas
- [ ] Identificar padrões e tendências
- [ ] Documentar incidentes (se houver)
- [ ] Preparar relatório final

---

## 📊 FERRAMENTAS DE MONITORAMENTO

### **Fly.io:**

- ✅ Dashboard: https://fly.io/dashboard
- ✅ Logs: `fly logs`
- ✅ Metrics: Dashboard → Metrics

---

### **Vercel:**

- ✅ Dashboard: https://vercel.com/dashboard
- ✅ Analytics: Dashboard → Analytics
- ✅ Logs: Dashboard → Logs

---

### **Supabase:**

- ✅ Dashboard: https://supabase.com/dashboard
- ✅ Logs: Dashboard → Logs
- ✅ Database: Dashboard → Database

---

## ✅ CONCLUSÃO DO MONITORAMENTO 24H

**Status:** ✅ **PLANO DOCUMENTADO**

**Próximo Passo:** BLOCO D2 - Contingência

**Observações:**
- ✅ Métricas críticas definidas
- ✅ Thresholds estabelecidos
- ✅ Plano de reação documentado

---

**Documento gerado em:** 2025-12-19T16:05:00.000Z  
**Status:** ✅ **BLOCO D1 DOCUMENTADO - PRONTO PARA EXECUÇÃO**

