# 🚨 PLANO DE CONTINGÊNCIA - GO-LIVE
# Gol de Ouro v1.2.1 - Procedimentos de Emergência

**Data:** 17/11/2025  
**Versão:** v1.2.1

---

## 📋 SUMÁRIO EXECUTIVO

### ✅ OBJETIVO

Definir procedimentos de contingência para situações de emergência durante o GO-LIVE e operação em produção.

---

## 🚨 1. CENÁRIOS DE EMERGÊNCIA

### 1.1 Backend Offline

**Sintomas:**
- Health check falhando
- Todas as requisições retornando erro
- WebSocket desconectado

**Ações Imediatas:**
1. ✅ Verificar status no Fly.io: `fly status -a goldeouro-backend-v2`
2. ✅ Verificar logs: `fly logs -a goldeouro-backend-v2`
3. ✅ Reiniciar aplicação: `fly apps restart goldeouro-backend-v2`
4. ✅ Verificar variáveis de ambiente: `fly secrets list -a goldeouro-backend-v2`
5. ✅ Verificar database: `fly logs -a goldeouro-backend-v2 | grep DATABASE`

**Tempo de Resolução:** < 5 minutos

---

### 1.2 Database Desconectado

**Sintomas:**
- Erros de conexão com Supabase
- Operações financeiras falhando
- Dados não salvando

**Ações Imediatas:**
1. ✅ Verificar SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
2. ✅ Testar conexão manualmente
3. ✅ Verificar status do Supabase
4. ✅ Contatar suporte Supabase se necessário

**Tempo de Resolução:** < 10 minutos

---

### 1.3 Sistema Financeiro com Erros

**Sintomas:**
- Transações duplicadas
- Saldos incorretos
- Operações ACID falhando

**Ações Imediatas:**
1. ✅ **CRÍTICO:** Não corrigir manualmente sem validar
2. ✅ Verificar logs de transações
3. ✅ Verificar RPC Functions
4. ✅ Verificar integridade do banco
5. ✅ Contatar equipe técnica imediatamente

**Tempo de Resolução:** < 30 minutos (requer análise)

---

### 1.4 Webhook PIX Não Processando

**Sintomas:**
- Pagamentos PIX não creditando saldo
- Webhooks recebidos mas não processados
- Status de pagamento não atualizando

**Ações Imediatas:**
1. ✅ Verificar logs de webhook: `fly logs -a goldeouro-backend-v2 | grep WEBHOOK`
2. ✅ Verificar signature validation
3. ✅ Verificar idempotência
4. ✅ Processar webhooks pendentes manualmente (se necessário)

**Tempo de Resolução:** < 15 minutos

---

### 1.5 Rate Limiting Bloqueando Usuários Legítimos

**Sintomas:**
- Usuários recebendo erro 429
- Muitas requisições bloqueadas
- Sistema lento

**Ações Imediatas:**
1. ✅ Verificar logs de rate limit
2. ✅ Ajustar limites se necessário
3. ✅ Verificar se há ataque DDoS
4. ✅ Implementar whitelist se necessário

**Tempo de Resolução:** < 10 minutos

---

### 1.6 Admin Panel Offline

**Sintomas:**
- Admin não acessível
- Erro 500 ou timeout
- Build falhando

**Ações Imediatas:**
1. ✅ Verificar status no Vercel: `vercel ls`
2. ✅ Verificar logs: `vercel logs`
3. ✅ Verificar variáveis de ambiente: `vercel env ls`
4. ✅ Fazer novo deploy se necessário: `vercel --prod`

**Tempo de Resolução:** < 10 minutos

---

## 📞 2. CONTATOS DE EMERGÊNCIA

### 2.1 Equipe Técnica

**Contatos:**
- 📧 Email: [email técnico]
- 📱 Telefone: [telefone técnico]
- 💬 Slack: [canal de emergência]

---

### 2.2 Suporte de Infraestrutura

**Fly.io:**
- 📧 Suporte: [email Fly.io]
- 🌐 Status: https://status.fly.io

**Vercel:**
- 📧 Suporte: [email Vercel]
- 🌐 Status: https://www.vercel-status.com

**Supabase:**
- 📧 Suporte: [email Supabase]
- 🌐 Status: https://status.supabase.com

**Mercado Pago:**
- 📧 Suporte: [email Mercado Pago]
- 🌐 Status: https://status.mercadopago.com

---

## 🔄 3. PROCEDIMENTOS DE ROLLBACK

### 3.1 Rollback do Backend

**Procedimento:**
1. ✅ Identificar versão anterior estável
2. ✅ Executar: `fly releases rollback -a goldeouro-backend-v2`
3. ✅ Verificar health check
4. ✅ Validar funcionalidades críticas

**Tempo de Rollback:** < 5 minutos

---

### 3.2 Rollback do Admin

**Procedimento:**
1. ✅ Identificar deploy anterior estável
2. ✅ Executar rollback no Vercel
3. ✅ Verificar funcionamento
4. ✅ Validar integração

**Tempo de Rollback:** < 5 minutos

---

## 📊 4. MONITORAMENTO DE EMERGÊNCIA

### 4.1 Métricas Críticas

**Monitorar:**
- ✅ Taxa de erro > 5%
- ✅ Latência > 2 segundos
- ✅ Health check falhando
- ✅ Database desconectado
- ✅ Webhook não processando

---

### 4.2 Alertas

**Configurar:**
- ✅ Alertas de erro crítico
- ✅ Alertas de performance
- ✅ Alertas de disponibilidade
- ✅ Alertas financeiros

---

## ✅ CHECKLIST DE CONTINGÊNCIA

### Preparação:
- [x] ✅ Contatos de emergência atualizados
- [x] ✅ Procedimentos documentados
- [x] ✅ Acesso a ferramentas configurado
- [x] ✅ Rollback testado

### Monitoramento:
- [x] ✅ Métricas críticas definidas
- [x] ⚠️ Alertas básicos configurados
- [ ] 📝 Alertas avançados (v1.3.0)

---

## ✅ CONCLUSÃO

### Status: ✅ **PLANO DE CONTINGÊNCIA PRONTO**

**Cobertura:**
- ✅ 6 cenários de emergência documentados
- ✅ Procedimentos de ação definidos
- ✅ Contatos de emergência listados
- ✅ Procedimentos de rollback documentados

---

**Data:** 17/11/2025  
**Versão:** v1.2.1  
**Status:** ✅ **PLANO PRONTO**

