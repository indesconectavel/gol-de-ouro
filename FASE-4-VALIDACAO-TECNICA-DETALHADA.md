# 🧪 FASE 4: VALIDAÇÃO TÉCNICA DETALHADA
## Gol de Ouro - Testes de Persistência, Refresh Token e REST API

**Data:** 2025-01-24  
**Duração Estimada:** 30-60 minutos  
**Status:** ⏳ PENDENTE DE EXECUÇÃO

---

## 📋 OBJETIVO

Validar tecnicamente todas as implementações do hardening final através de testes práticos em ambiente de produção, confirmando:
1. ✅ Persistência de lotes após restart do servidor
2. ✅ Renovação automática de tokens (refresh token)
3. ✅ Funcionamento completo da REST API de jogo

---

## 🔧 PRÉ-REQUISITOS

### 3.1 Dispositivo Android
- [x] APK instalado no dispositivo físico
- [x] Conexão à internet estável
- [x] Conta de usuário criada e logada

### 3.2 Acesso ao Backend
- [x] Acesso aos logs do Fly.io (`flyctl logs`)
- [x] Acesso ao Supabase Dashboard (opcional, para verificar dados)
- [x] Credenciais de teste (usuário com saldo)

### 3.3 Ferramentas
- [x] Terminal com `flyctl` instalado
- [x] Navegador para verificar logs do Expo (opcional)
- [x] Acesso ao Supabase SQL Editor (opcional)

---

## 🧪 TESTE 1: PERSISTÊNCIA DE LOTES (RESTART SERVIDOR)

### Objetivo
Validar que lotes ativos são recuperados corretamente após restart do servidor, garantindo que nenhum dado seja perdido.

### Passos Detalhados

#### 1.1 Preparação
```bash
# Conectar ao terminal do backend
cd E:\Chute de Ouro\goldeouro-backend

# Verificar logs atuais
flyctl logs --app goldeouro-backend-v2 | Select-Object -First 20
```

**Resultado Esperado:**
- Logs mostram servidor rodando normalmente
- Nenhum erro crítico

#### 1.2 Criar Lote Ativo no App
1. Abrir app no dispositivo Android
2. Fazer login (se necessário)
3. Navegar para tela de jogo
4. Realizar **3-5 chutes** com valor de R$1,00
5. Verificar que o progresso do lote é exibido corretamente

**Validação Visual:**
- Progresso do lote aparece (ex: "3/10 chutes")
- Saldo atualizado após cada chute
- Histórico de chutes visível

#### 1.3 Verificar Lote no Banco (Opcional)
```sql
-- Executar no Supabase SQL Editor
SELECT 
    id,
    valor_aposta,
    tamanho,
    posicao_atual,
    status,
    total_arrecadado,
    premio_total,
    created_at
FROM public.lotes
WHERE status = 'ativo'
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado Esperado:**
- Lote(s) ativo(s) encontrado(s)
- `posicao_atual` corresponde ao número de chutes realizados
- `total_arrecadado` corresponde à soma dos valores apostados

#### 1.4 Restart do Servidor
```bash
# Restart do servidor Fly.io
flyctl restart --app goldeouro-backend-v2

# Aguardar 30-60 segundos para servidor reiniciar
```

**Resultado Esperado:**
- Comando executado com sucesso
- Servidor reinicia sem erros

#### 1.5 Verificar Sincronização nos Logs
```bash
# Verificar logs após restart
flyctl logs --app goldeouro-backend-v2 | Select-Object -First 50
```

**Resultado Esperado:**
```
✅ [LOTE-SERVICE] X lotes ativos sincronizados
✅ [STARTUP] Lotes ativos carregados do banco
```

**Onde X = número de lotes ativos criados antes do restart**

#### 1.6 Continuar Jogo no App
1. No app mobile, realizar mais **2-3 chutes**
2. Verificar que o progresso do lote continua de onde parou
3. Verificar que não há duplicação de chutes

**Validação:**
- Progresso continua (ex: "5/10 chutes" após restart + 2 chutes)
- Saldo atualizado corretamente
- Nenhum erro de "lote não encontrado"

#### 1.7 Verificar Integridade Final
```sql
-- Verificar lote após restart e chutes adicionais
SELECT 
    id,
    posicao_atual,
    total_arrecadado,
    premio_total,
    status,
    updated_at
FROM public.lotes
WHERE id = '<ID_DO_LOTE_CRIADO>'
ORDER BY updated_at DESC;
```

**Resultado Esperado:**
- `posicao_atual` = número total de chutes (antes + depois do restart)
- `total_arrecadado` = soma correta de todos os valores apostados
- `status` = 'ativo' (se lote não completo) ou 'completed' (se completo)
- `updated_at` atualizado após cada chute

### ✅ Critérios de Sucesso
- [x] Lotes são sincronizados após restart
- [x] Progresso do lote é mantido corretamente
- [x] Nenhum dado é perdido
- [x] Chutes continuam funcionando normalmente após restart

### ❌ Possíveis Problemas e Soluções

**Problema:** Logs mostram "0 lotes ativos sincronizados" após restart
- **Causa:** Lote não foi persistido antes do restart
- **Solução:** Verificar se `LoteService.updateLoteAfterShot` está sendo chamado

**Problema:** Progresso do lote reseta após restart
- **Causa:** `syncActiveLotes` não está carregando lotes corretamente
- **Solução:** Verificar RPC `rpc_get_active_lotes` no Supabase

**Problema:** Erro "lote não encontrado" após restart
- **Causa:** Lote não está sendo criado/obtido corretamente
- **Solução:** Verificar `getOrCreateLoteByValue` e RPC `rpc_get_or_create_lote`

---

## 🔐 TESTE 2: REFRESH TOKEN (RENOVAÇÃO AUTOMÁTICA)

### Objetivo
Validar que tokens são renovados automaticamente quando o access token expira, mantendo a sessão do usuário ativa sem necessidade de novo login.

### Passos Detalhados

#### 2.1 Preparação
1. Fazer login no app mobile
2. Verificar que tokens estão armazenados no SecureStore
3. Anotar timestamp do login

**Validação:**
- Login bem-sucedido
- App funciona normalmente

#### 2.2 Verificar Tokens Armazenados (Opcional - Requer Debug)
```javascript
// Adicionar temporariamente no AuthService.js para debug
console.log('Access Token:', await SecureStore.getItemAsync('accessToken'));
console.log('Refresh Token:', await SecureStore.getItemAsync('refreshToken'));
```

**Resultado Esperado:**
- Ambos os tokens presentes
- Access token é JWT válido
- Refresh token é JWT válido

#### 2.3 Simular Expiração do Access Token

**Opção A: Aguardar Expiração Natural (1 hora)**
- Manter app aberto por 1 hora
- Realizar ações periodicamente

**Opção B: Forçar Expiração (Recomendado para Teste)**
```bash
# No backend, modificar temporariamente o tempo de expiração
# Em server-fly.js, linha 905, alterar:
{ expiresIn: '1h' } → { expiresIn: '1m' }  # 1 minuto para teste rápido
```

**⚠️ IMPORTANTE:** Reverter alteração após teste!

#### 2.4 Realizar Ação que Requer Autenticação
1. Após expiração do token, realizar um chute no jogo
2. Observar comportamento do app

**Resultado Esperado:**
- App detecta token expirado automaticamente
- Refresh token é usado para renovar access token
- Ação (chute) é executada com sucesso
- Usuário não é deslogado

#### 2.5 Verificar Logs do Backend
```bash
# Verificar logs para chamadas de refresh
flyctl logs --app goldeouro-backend-v2 | Select-String "REFRESH"
```

**Resultado Esperado:**
```
✅ [REFRESH] Token renovado para usuário: <email>
```

#### 2.6 Verificar Renovação no Banco (Opcional)
```sql
-- Verificar se refresh_token foi atualizado
SELECT 
    id,
    email,
    refresh_token IS NOT NULL as has_refresh_token,
    last_login
FROM public.usuarios
WHERE email = '<EMAIL_DO_USUARIO_TESTE>';
```

**Resultado Esperado:**
- `has_refresh_token` = true
- `last_login` atualizado

#### 2.7 Testar Múltiplas Renovações
1. Realizar várias ações que requerem autenticação
2. Verificar que token é renovado automaticamente quando necessário
3. Verificar que não há múltiplos logins desnecessários

**Resultado Esperado:**
- Token renovado automaticamente quando expira
- Sessão mantida por pelo menos 7 dias (duração do refresh token)
- Nenhum logout inesperado

### ✅ Critérios de Sucesso
- [x] Token é renovado automaticamente quando expira
- [x] Usuário não precisa fazer login novamente
- [x] Ações continuam funcionando após renovação
- [x] Refresh token é válido por 7 dias

### ❌ Possíveis Problemas e Soluções

**Problema:** Usuário é deslogado quando token expira
- **Causa:** `refreshAccessToken` não está sendo chamado automaticamente
- **Solução:** Verificar interceptor no `GameService.js` (pode estar faltando)

**Problema:** Erro "Refresh token inválido"
- **Causa:** Refresh token não está sendo armazenado corretamente
- **Solução:** Verificar `SecureStore.setItemAsync('refreshToken', refreshToken)` no login

**Problema:** Múltiplas tentativas de refresh simultâneas
- **Causa:** Falta de flag `_retry` no interceptor
- **Solução:** Implementar flag de controle no `GameService.js`

---

## 🎮 TESTE 3: REST API (CHUTE VIA API)

### Objetivo
Validar que o sistema de jogo funciona corretamente via REST API, incluindo criação de lotes, processamento de chutes, atualização de saldo e distribuição de prêmios.

### Passos Detalhados

#### 3.1 Preparação
1. Fazer login no app mobile
2. Verificar saldo inicial do usuário
3. Anotar saldo inicial

**Validação:**
- Login bem-sucedido
- Saldo visível e correto

#### 3.2 Realizar Primeiro Chute
1. Selecionar direção (ex: Centro)
2. Selecionar valor (ex: R$1,00)
3. Realizar chute
4. Observar resposta

**Validação Visual:**
- Feedback imediato (loading, depois resultado)
- Resultado exibido (Gol ou Errou)
- Saldo atualizado
- Progresso do lote atualizado

#### 3.3 Verificar Resposta da API
```bash
# Verificar logs do backend para o chute
flyctl logs --app goldeouro-backend-v2 | Select-String "SHOOT" | Select-Object -First 10
```

**Resultado Esperado:**
```
✅ [SHOOT] Chute processado: lote_id=<ID>, resultado=<goal|miss>
✅ [LOTE-SERVICE] Lote atualizado: <ID>
```

#### 3.4 Verificar Criação de Lote
```sql
-- Verificar lote criado
SELECT 
    id,
    valor_aposta,
    tamanho,
    posicao_atual,
    indice_vencedor,
    status,
    total_arrecadado,
    premio_total,
    created_at
FROM public.lotes
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado Esperado:**
- Lote criado com `valor_aposta` correto
- `tamanho` corresponde ao config do valor (ex: R$1 = tamanho 10)
- `indice_vencedor` entre 0 e tamanho-1
- `status` = 'ativo'

#### 3.5 Realizar Múltiplos Chutes
1. Realizar **5-7 chutes** adicionais
2. Verificar progresso do lote após cada chute
3. Verificar saldo após cada chute

**Validação:**
- Progresso aumenta corretamente (ex: 1/10, 2/10, 3/10...)
- Saldo atualizado corretamente:
  - Se gol: +R$5 (prêmio normal) + possível R$100 (Gol de Ouro)
  - Se erro: saldo mantido (aposta já foi debitada)

#### 3.6 Verificar Chutes no Banco
```sql
-- Verificar chutes salvos
SELECT 
    id,
    usuario_id,
    lote_id,
    direcao,
    valor_aposta,
    resultado,
    premio,
    premio_gol_de_ouro,
    contador_global,
    shot_index,
    created_at
FROM public.chutes
WHERE usuario_id = '<ID_DO_USUARIO>'
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado Esperado:**
- Todos os chutes salvos corretamente
- `lote_id` corresponde ao lote ativo
- `shot_index` sequencial (1, 2, 3...)
- `contador_global` incrementado corretamente

#### 3.7 Testar Gol (Se Ocorrer)
1. Continuar chutando até marcar um gol
2. Verificar prêmio creditado
3. Verificar atualização do lote

**Validação:**
- Prêmio normal (R$5) creditado
- Se for Gol de Ouro (contador global múltiplo de 100): +R$100
- Lote atualizado com `premio_total` incrementado

#### 3.8 Testar Completar Lote
1. Continuar chutando até completar o lote (10 chutes para R$1)
2. Verificar que novo lote é criado automaticamente
3. Verificar que lote anterior foi marcado como 'completed'

**Validação:**
- Mensagem de "Lote Completo" exibida
- Novo lote criado automaticamente
- Progresso reseta para novo lote

#### 3.9 Verificar Lote Completo no Banco
```sql
-- Verificar lote completado
SELECT 
    id,
    posicao_atual,
    tamanho,
    status,
    total_arrecadado,
    premio_total,
    completed_at
FROM public.lotes
WHERE status = 'completed'
ORDER BY completed_at DESC
LIMIT 1;
```

**Resultado Esperado:**
- `status` = 'completed'
- `posicao_atual` = `tamanho`
- `completed_at` preenchido
- `total_arrecadado` = soma de todas as apostas
- `premio_total` = soma de todos os prêmios distribuídos

#### 3.10 Testar Diferentes Valores de Aposta
1. Testar com R$2,00 (tamanho 5)
2. Testar com R$5,00 (tamanho 2)
3. Testar com R$10,00 (tamanho 1)

**Validação:**
- Cada valor cria lote com tamanho correto
- Lotes funcionam independentemente
- Prêmios calculados corretamente

### ✅ Critérios de Sucesso
- [x] Chutes são processados corretamente via REST API
- [x] Lotes são criados e atualizados corretamente
- [x] Saldo é atualizado corretamente após cada chute
- [x] Prêmios são distribuídos corretamente
- [x] Lotes são completados corretamente
- [x] Dados são persistidos no banco corretamente

### ❌ Possíveis Problemas e Soluções

**Problema:** Chute não é processado (erro 401)
- **Causa:** Token não está sendo enviado corretamente
- **Solução:** Verificar `GameService.js` interceptor de request

**Problema:** Saldo não atualiza após gol
- **Causa:** Trigger do banco não está funcionando ou saldo não está sendo recalculado
- **Solução:** Verificar triggers no Supabase e endpoint de atualização de saldo

**Problema:** Lote não é completado quando deveria
- **Causa:** `updateLoteAfterShot` não está verificando se lote está completo
- **Solução:** Verificar RPC `rpc_update_lote_after_shot`

---

## 📊 CHECKLIST FINAL DE VALIDAÇÃO

### Persistência de Lotes
- [ ] Lotes são sincronizados após restart
- [ ] Progresso do lote é mantido corretamente
- [ ] Nenhum dado é perdido
- [ ] Chutes continuam funcionando após restart

### Refresh Token
- [ ] Token é renovado automaticamente quando expira
- [ ] Usuário não precisa fazer login novamente
- [ ] Ações continuam funcionando após renovação
- [ ] Refresh token é válido por 7 dias

### REST API
- [ ] Chutes são processados corretamente
- [ ] Lotes são criados e atualizados corretamente
- [ ] Saldo é atualizado corretamente
- [ ] Prêmios são distribuídos corretamente
- [ ] Lotes são completados corretamente
- [ ] Dados são persistidos no banco corretamente

---

## 📝 RELATÓRIO DE TESTES

Após executar todos os testes, preencher o seguinte relatório:

### Data de Execução
- Data: _______________
- Hora de Início: _______________
- Hora de Término: _______________
- Duração Total: _______________

### Ambiente
- Dispositivo: _______________
- Versão do Android: _______________
- Versão do APK: _______________
- Backend URL: `https://goldeouro-backend-v2.fly.dev`

### Resultados

#### Teste 1: Persistência de Lotes
- Status: [ ] ✅ PASSOU [ ] ❌ FALHOU
- Observações: _______________

#### Teste 2: Refresh Token
- Status: [ ] ✅ PASSOU [ ] ❌ FALHOU
- Observações: _______________

#### Teste 3: REST API
- Status: [ ] ✅ PASSOU [ ] ❌ FALHOU
- Observações: _______________

### Problemas Encontrados
1. _______________
2. _______________
3. _______________

### Próximos Passos
- [ ] Todos os testes passaram → Prosseguir para Fase 5
- [ ] Alguns testes falharam → Corrigir problemas e re-testar
- [ ] Problemas críticos encontrados → Abrir issue e documentar

---

## 🎯 CONCLUSÃO

Esta fase valida tecnicamente todas as implementações do hardening final. Os testes devem ser executados em ambiente de produção (ou staging) para garantir que o sistema está funcionando corretamente antes de liberar para usuários finais.

**Próxima Fase:** Fase 5 - Testes Reais Completos (2-4 horas)

---

**Documento criado em:** 2025-01-24  
**Versão:** 1.0  
**Autor:** Sistema de Auditoria Automatizada

