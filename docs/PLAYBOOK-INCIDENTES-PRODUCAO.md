# 🚨 PLAYBOOK DE INCIDENTES EM PRODUÇÃO
# Gol de Ouro v1.2.0 - Guia de Resolução de Problemas

**Data:** 17/11/2025  
**Versão:** v1.2.0

---

## 📋 SUMÁRIO EXECUTIVO

### ✅ OBJETIVO

Fornecer guia completo para identificação, diagnóstico e resolução de incidentes em produção do sistema Gol de Ouro.

---

## 🔍 TIPOS DE INCIDENTES

### 1. ERRO 500 (SERVER ERROR)

#### Sintomas:
- Requisições retornam status 500
- Mensagem de erro genérica
- Sistema pode estar instável

#### Diagnóstico:
```bash
# Verificar logs do Fly.io
fly logs -a goldeouro-backend-v2

# Verificar health check
curl https://goldeouro-backend-v2.fly.dev/health

# Verificar métricas
fly metrics -a goldeouro-backend-v2
```

#### Ações:
1. ✅ Verificar logs para identificar erro específico
2. ✅ Verificar se database está conectado
3. ✅ Verificar se variáveis de ambiente estão configuradas
4. ✅ Verificar se Supabase está acessível
5. ✅ Verificar se Mercado Pago está configurado

#### Resolução:
- Corrigir erro específico identificado nos logs
- Reiniciar aplicação se necessário: `fly apps restart goldeouro-backend-v2`
- Verificar se problema persiste

---

### 2. ERRO 401/403 (AUTENTICAÇÃO)

#### Sintomas:
- Usuários não conseguem fazer login
- Admin não consegue acessar páginas
- Token inválido ou expirado

#### Diagnóstico:
```bash
# Verificar ADMIN_TOKEN no Fly.io
fly secrets list -a goldeouro-backend-v2 | grep ADMIN_TOKEN

# Verificar JWT_SECRET
fly secrets list -a goldeouro-backend-v2 | grep JWT_SECRET

# Testar autenticação admin
curl -H "x-admin-token: goldeouro123" https://goldeouro-backend-v2.fly.dev/api/admin/stats
```

#### Ações:
1. ✅ Verificar se `ADMIN_TOKEN` está configurado corretamente
2. ✅ Verificar se `JWT_SECRET` está configurado
3. ✅ Verificar se token não expirou
4. ✅ Verificar se header está sendo enviado corretamente

#### Resolução:
- Configurar `ADMIN_TOKEN` se não estiver: `fly secrets set ADMIN_TOKEN=goldeouro123 -a goldeouro-backend-v2`
- Configurar `JWT_SECRET` se não estiver: `fly secrets set JWT_SECRET=<secret> -a goldeouro-backend-v2`
- Verificar se valores estão sincronizados entre ambientes

---

### 3. TIMEOUT DE REQUISIÇÕES

#### Sintomas:
- Requisições demoram muito para responder
- Timeout de conexão
- Sistema lento

#### Diagnóstico:
```bash
# Verificar tempo de resposta
curl -w "@curl-format.txt" -o /dev/null -s https://goldeouro-backend-v2.fly.dev/health

# Verificar métricas de performance
fly metrics -a goldeouro-backend-v2

# Verificar logs para identificar gargalos
fly logs -a goldeouro-backend-v2 | grep -i "slow\|timeout"
```

#### Ações:
1. ✅ Identificar endpoint específico com problema
2. ✅ Verificar se database está lento
3. ✅ Verificar se Supabase está respondendo
4. ✅ Verificar se há muitas requisições simultâneas

#### Resolução:
- Otimizar query específica se database estiver lento
- Aumentar timeout se necessário
- Escalar recursos se necessário: `fly scale count 2 -a goldeouro-backend-v2`

---

### 4. PROBLEMAS NO WEBSOCKET

#### Sintomas:
- Conexões WebSocket falhando
- Reconexão não funcionando
- Mensagens não chegando

#### Diagnóstico:
```bash
# Verificar conexões WebSocket ativas
fly logs -a goldeouro-backend-v2 | grep -i "websocket\|ws"

# Verificar métricas WebSocket
fly metrics -a goldeouro-backend-v2
```

#### Ações:
1. ✅ Verificar se WebSocket Server está rodando
2. ✅ Verificar se autenticação está funcionando
3. ✅ Verificar se rate limiting está bloqueando
4. ✅ Verificar se há muitas conexões simultâneas

#### Resolução:
- Reiniciar aplicação se WebSocket não estiver funcionando
- Verificar se timeout de autenticação não está muito curto
- Verificar se rate limiting não está muito restritivo

---

### 5. PROBLEMAS NO SISTEMA FINANCEIRO

#### Sintomas:
- Saldo não atualiza corretamente
- Transações duplicadas
- Erros em operações financeiras

#### Diagnóstico:
```bash
# Verificar logs de transações
fly logs -a goldeouro-backend-v2 | grep -i "financial\|transaction\|balance"

# Verificar se RPC functions estão funcionando
# (requer acesso ao Supabase)
```

#### Ações:
1. ✅ Verificar se FinancialService está funcionando
2. ✅ Verificar se RPC functions estão disponíveis
3. ✅ Verificar se há race conditions
4. ✅ Verificar logs de transações

#### Resolução:
- **CRÍTICO:** Não corrigir manualmente sem validar impacto
- Verificar se problema é em operação específica
- Verificar se RPC functions estão corretas
- Contatar suporte se necessário

---

### 6. PROBLEMAS NO PIX

#### Sintomas:
- Pagamentos PIX não criando
- Webhook não processando
- Saldo não creditando

#### Diagnóstico:
```bash
# Verificar logs de PIX
fly logs -a goldeouro-backend-v2 | grep -i "pix\|payment\|webhook"

# Verificar se Mercado Pago está configurado
fly secrets list -a goldeouro-backend-v2 | grep MERCADOPAGO
```

#### Ações:
1. ✅ Verificar se `MERCADOPAGO_ACCESS_TOKEN` está configurado
2. ✅ Verificar se webhook está recebendo requisições
3. ✅ Verificar se WebhookService está processando
4. ✅ Verificar se FinancialService está creditando

#### Resolução:
- Configurar `MERCADOPAGO_ACCESS_TOKEN` se não estiver
- Verificar URL do webhook no Mercado Pago
- Verificar se webhook está sendo processado corretamente
- Verificar logs de webhook para identificar problema

---

### 7. PROBLEMAS NO ADMIN PANEL

#### Sintomas:
- Admin não carrega dados
- Erro 401/403 constante
- Páginas não funcionando

#### Diagnóstico:
```bash
# Verificar deploy no Vercel
cd goldeouro-admin
vercel ls

# Verificar variáveis de ambiente
vercel env ls

# Verificar logs do Vercel
vercel logs
```

#### Ações:
1. ✅ Verificar se `VITE_ADMIN_TOKEN` está configurado
2. ✅ Verificar se URL do backend está correta
3. ✅ Verificar se rewrite está funcionando
4. ✅ Verificar se deploy está atualizado

#### Resolução:
- Configurar `VITE_ADMIN_TOKEN` se não estiver
- Verificar se `vercel.json` está correto
- Fazer novo deploy se necessário: `vercel --prod`
- Verificar se backend está acessível

---

### 8. PROBLEMAS NO MOBILE APP

#### Sintomas:
- App não conecta ao backend
- Login não funciona
- Chutes não funcionam

#### Diagnóstico:
```bash
# Verificar se backend está acessível
curl https://goldeouro-backend-v2.fly.dev/health

# Verificar logs do backend para requisições do mobile
fly logs -a goldeouro-backend-v2 | grep -i "mobile\|api/auth\|api/games"
```

#### Ações:
1. ✅ Verificar se URL do backend está correta no mobile
2. ✅ Verificar se autenticação está funcionando
3. ✅ Verificar se endpoints estão corretos
4. ✅ Verificar se formato de resposta está correto

#### Resolução:
- Verificar `API_BASE_URL` no mobile
- Verificar se token está sendo enviado corretamente
- Verificar se endpoints estão corretos
- Verificar se formato de resposta está sendo tratado

---

## 📊 MATRIZ DE DECISÃO

### Severidade vs Ação:

| Severidade | Impacto | Ação Imediata | Ação de Longo Prazo |
|------------|---------|---------------|---------------------|
| **Crítica** | Sistema offline | Reiniciar + Investigar | Corrigir causa raiz |
| **Alta** | Funcionalidade quebrada | Workaround + Investigar | Corrigir na próxima release |
| **Média** | Performance degradada | Monitorar | Otimizar |
| **Baixa** | Funcionalidade menor | Documentar | Melhorar |

---

## 🔧 COMANDOS ÚTEIS

### Fly.io:
```bash
# Ver logs
fly logs -a goldeouro-backend-v2

# Ver métricas
fly metrics -a goldeouro-backend-v2

# Reiniciar app
fly apps restart goldeouro-backend-v2

# Ver secrets
fly secrets list -a goldeouro-backend-v2

# Ver status
fly status -a goldeouro-backend-v2
```

### Vercel:
```bash
# Ver deploys
vercel ls

# Ver logs
vercel logs

# Ver variáveis
vercel env ls

# Fazer deploy
vercel --prod
```

### Testes:
```bash
# Health check
curl https://goldeouro-backend-v2.fly.dev/health

# Testar admin
curl -H "x-admin-token: goldeouro123" https://goldeouro-backend-v2.fly.dev/api/admin/stats

# Testar autenticação
curl -X POST https://goldeouro-backend-v2.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## ✅ CONCLUSÃO

### Status: ✅ **PLAYBOOK COMPLETO**

**Cobertura:**
- ✅ 8 tipos de incidentes documentados
- ✅ Diagnóstico para cada tipo
- ✅ Ações de resolução
- ✅ Comandos úteis
- ✅ Matriz de decisão

**Próxima Ação:** Usar este playbook em caso de incidentes em produção

---

**Data:** 17/11/2025  
**Versão:** v1.2.0  
**Status:** ✅ **PLAYBOOK PRONTO**

