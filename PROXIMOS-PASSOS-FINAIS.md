# 🚀 Próximos Passos Finais - Servidor Operacional

## ✅ Status Atual

**Servidor está OPERACIONAL após correção do `prom-client`!**

- ✅ `prom-client` carregado com sucesso
- ✅ Servidor iniciou sem crashes
- ✅ Supabase conectado
- ✅ Mercado Pago conectado
- ✅ Máquinas estáveis (sem reinicializações)

## 📋 Checklist de Validação Completa

### 1. ✅ Validação Básica do Servidor

Execute o script de validação:
```bash
node src/scripts/validar_servidor_operacional.js
```

**O que verificar:**
- [x] Health check (`/health`) respondendo
- [ ] Monitoramento (`/api/monitor`) funcionando
- [ ] Métricas Prometheus (`/api/metrics`) - pode retornar 503 se não configurado
- [ ] Meta/Versão (`/api/meta`) funcionando

### 2. ✅ Testes de Funcionalidades Principais

#### A. Teste de Autenticação
```bash
# Login
curl -X POST https://goldeouro-backend-v2.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"free10signer@gmail.com","password":"Free10signer"}'
```

**Verificar:**
- [ ] Login retorna token JWT
- [ ] Token é válido
- [ ] Usuário autenticado pode acessar rotas protegidas

#### B. Teste de Criação de PIX
```bash
# Criar PIX (após login, usar token no header)
curl -X POST https://goldeouro-backend-v2.fly.dev/api/payments/pix \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"valor":5.00}'
```

**Verificar:**
- [ ] PIX criado com sucesso
- [ ] QR Code gerado corretamente
- [ ] Valor salvo no banco de dados
- [ ] Status inicial é "pending"

#### C. Teste de Jogo
```bash
# Fazer chute no jogo
curl -X POST https://goldeouro-backend-v2.fly.dev/api/games/shoot \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"direction":"left","amount":5.00}'
```

**Verificar:**
- [ ] Chute processado com sucesso
- [ ] Saldo debitado corretamente
- [ ] Lote criado/atualizado corretamente
- [ ] Resposta contém resultado do chute

#### D. Teste de Webhook (Simulação)
```bash
# Simular webhook do Mercado Pago (após pagamento real)
curl -X POST https://goldeouro-backend-v2.fly.dev/api/payments/webhook/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"123456"}}'
```

**Verificar:**
- [ ] Webhook processado (mesmo que falhe por falta de dados reais)
- [ ] Não causa crash no servidor
- [ ] Logs registrados corretamente

### 3. ✅ Monitoramento Contínuo

#### A. Verificar Logs em Tempo Real
```bash
fly logs --app goldeouro-backend-v2
```

**O que observar:**
- ✅ Ausência de erros de `prom-client`
- ✅ Ausência de crashes na inicialização
- ✅ Máquinas não reiniciando continuamente
- ✅ Health checks respondendo corretamente
- ✅ Requisições sendo processadas normalmente

#### B. Verificar Status das Máquinas
```bash
fly status --app goldeouro-backend-v2
```

**Verificar:**
- [ ] Máquinas em estado "started"
- [ ] Health checks passando (1/1)
- [ ] Sem reinicializações frequentes
- [ ] Uso de recursos dentro do normal

### 4. ✅ Validação de Produção

#### A. Teste End-to-End Completo

1. **Login** → Obter token
2. **Verificar saldo** → Confirmar saldo inicial
3. **Criar PIX** → Gerar QR Code
4. **Fazer pagamento real** → Via app do banco
5. **Aguardar webhook** → Verificar crédito automático
6. **Jogar** → Fazer alguns chutes
7. **Verificar saldo** → Confirmar débitos corretos

#### B. Validação de Segurança

- [ ] RLS (Row Level Security) ativo no Supabase
- [ ] Tokens JWT sendo validados corretamente
- [ ] Webhooks validando assinatura (quando configurado)
- [ ] Rate limiting funcionando
- [ ] CORS configurado corretamente

### 5. ✅ Preparação para Produção

#### A. Variáveis de Ambiente

Verificar se todas as variáveis críticas estão configuradas:
```bash
fly secrets list --app goldeouro-backend-v2
```

**Variáveis críticas:**
- [x] `SUPABASE_URL`
- [x] `SUPABASE_SERVICE_ROLE_KEY`
- [x] `SUPABASE_ANON_KEY`
- [x] `JWT_SECRET`
- [x] `MERCADOPAGO_ACCESS_TOKEN`
- [ ] `MERCADOPAGO_WEBHOOK_SECRET` (recomendado)
- [ ] `SMTP_*` (se usar email)

#### B. Configurações de Monitoramento

- [ ] Configurar alertas no Fly.io (se necessário)
- [ ] Configurar métricas Prometheus (opcional)
- [ ] Configurar logs centralizados (opcional)

#### C. Backup e Recuperação

- [x] Backup do banco de dados configurado (Supabase)
- [ ] Plano de recuperação documentado
- [ ] Teste de restore realizado

## 🎯 Próximas Ações Imediatas

### Prioridade ALTA 🔴

1. **Executar validação básica**
   ```bash
   node src/scripts/validar_servidor_operacional.js
   ```

2. **Testar login e autenticação**
   - Confirmar que usuários podem fazer login
   - Verificar que tokens são gerados corretamente

3. **Monitorar logs por 10-15 minutos**
   - Confirmar estabilidade
   - Verificar ausência de erros críticos

### Prioridade MÉDIA 🟡

4. **Testar fluxo completo de PIX**
   - Criar PIX
   - Fazer pagamento real
   - Verificar crédito automático

5. **Testar jogo completo**
   - Fazer múltiplos chutes
   - Verificar integridade dos lotes
   - Confirmar premiações

### Prioridade BAIXA 🟢

6. **Otimizações e melhorias**
   - Configurar métricas Prometheus (se necessário)
   - Configurar alertas
   - Documentação adicional

## 📊 Critérios de Sucesso

### ✅ Servidor Estável
- [x] Servidor inicia sem crashes
- [x] Health checks respondendo
- [ ] Sem reinicializações por 30+ minutos
- [ ] Logs sem erros críticos

### ✅ Funcionalidades Operacionais
- [ ] Login funcionando
- [ ] PIX funcionando
- [ ] Jogo funcionando
- [ ] Webhooks funcionando

### ✅ Pronto para Produção
- [ ] Todos os testes passando
- [ ] Monitoramento configurado
- [ ] Backup funcionando
- [ ] Documentação atualizada

## 🚨 Se Algo Der Errado

### Problema: Servidor não responde
1. Verificar logs: `fly logs --app goldeouro-backend-v2`
2. Verificar status: `fly status --app goldeouro-backend-v2`
3. Reiniciar máquinas se necessário: `fly machine restart --app goldeouro-backend-v2`

### Problema: Erros nos logs
1. Identificar o erro específico
2. Verificar se é crítico ou apenas aviso
3. Consultar documentação ou corrigir conforme necessário

### Problema: Funcionalidade não funciona
1. Verificar logs específicos da funcionalidade
2. Testar endpoint diretamente com curl
3. Verificar variáveis de ambiente relacionadas
4. Consultar documentação da API

## 📝 Arquivos de Referência

- `RESUMO-CORRECAO-PROM-CLIENT.md` - Detalhes da correção aplicada
- `PROXIMOS-PASSOS-SERVIDOR-OPERACIONAL.md` - Guia anterior
- `logs/v19/VERIFICACAO_SUPREMA/24_correcao_prom_client.json` - Log técnico
- `logs/v19/VERIFICACAO_SUPREMA/25_validacao_servidor_operacional.json` - Resultados da validação

---

**Última atualização:** 2025-12-10 01:35 UTC  
**Status:** ✅ Servidor Operacional  
**Próximo passo:** Executar validação básica e testes de funcionalidades
