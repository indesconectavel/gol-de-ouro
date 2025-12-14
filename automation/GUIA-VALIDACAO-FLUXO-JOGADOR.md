# 🎮 GUIA DE VALIDAÇÃO DO FLUXO DO JOGADOR - ENGINE V19

**Objetivo:** Validar se está 100% pronto para rodar o fluxo real do jogador no Gol de Ouro.

---

## 🚀 EXECUÇÃO RÁPIDA

```bash
# Executar validação completa
cd automation
node validar_fluxo_jogador_v19.js
```

O script irá:
1. ✅ Validar configuração do app React Native
2. ✅ Validar fluxo PIX real
3. ✅ Validar dispositivo para testes
4. ✅ Validar ambientes Supabase (STG e PROD)
5. ✅ Validar endpoints críticos do backend
6. ✅ Validar se o app está preparado para o fluxo completo

---

## 📋 O QUE É VALIDADO

### 1. **App React Native**
- ✅ Expo instalado
- ✅ Expo Router configurado
- ✅ Backend URL configurada (produção)
- ✅ Supabase URL e chave configuradas
- ✅ Comando `npx expo start` funcionando
- ✅ Dependências instaladas

### 2. **Fluxo PIX Real**
- ✅ Backend online e acessível
- ✅ Endpoint `/api/payments/pix/criar` funcional
- ✅ Endpoint `/api/payments/webhook` ativo
- ✅ Tabela `webhook_events` existe e acessível
- ✅ Tabela `transacoes` existe e acessível

### 3. **Dispositivo para Testes**
- ✅ Expo Go instalado (orientação)
- ✅ EAS Build configurado
- ✅ APK gerado (se aplicável)
- ✅ Opções de teste disponíveis

### 4. **Ambientes Supabase**
- ✅ Conexão com STG estabelecida
- ✅ Conexão com PROD estabelecida
- ✅ RPC `rpc_get_balance` funcionando
- ✅ RPC `rpc_add_balance` funcionando
- ✅ RPC `rpc_get_or_create_lote` funcionando
- ✅ RPC `rpc_get_active_lotes` funcionando

### 5. **Endpoints Críticos**
- ✅ `POST /api/payments/pix/criar`
- ✅ `POST /api/payments/webhook`
- ✅ `POST /api/games/fila/entrar`
- ✅ `POST /api/games/chutar`
- ✅ `GET /api/admin/lotes`
- ✅ `GET /api/admin/recompensas`

### 6. **App Preparado**
- ✅ Telas implementadas
- ✅ Componentes implementados
- ✅ Serviços de API configurados
- ✅ Funcionalidades: entrar na fila, realizar chute, receber animação, processar resultado, mostrar saldo

---

## 📊 INTERPRETAÇÃO DOS RESULTADOS

### Status: ✅ PASS
Todos os checks passaram. Sistema pronto para testes reais!

### Status: ⚠️ WARN
Alguns itens têm avisos, mas não são críticos. Pode prosseguir com cautela.

### Status: ❌ FAIL
Itens críticos falharam. Corrija antes de testar.

---

## 🔧 CORREÇÕES COMUNS

### **App React Native não configurado**

```bash
# Instalar dependências
cd goldeouro-mobile
npm install

# Verificar Expo
npx expo --version

# Iniciar app
npx expo start
```

### **Backend não acessível**

1. Verificar se o backend está online:
   ```bash
   curl https://goldeouro-backend-v2.fly.dev/health
   ```

2. Verificar variáveis de ambiente:
   - `BACKEND_URL` deve apontar para produção
   - `SUPABASE_URL_PROD` e `SUPABASE_SERVICE_ROLE_KEY_PROD` configurados

### **RPCs não encontradas**

Aplicar migrations V19 no Supabase:

```bash
# Verificar migrations aplicadas
node automation/full_audit_v19.js --env=PROD

# Aplicar migrations se necessário
# (Seguir instruções em docs/GUIA-PRODUCAO-V19.md)
```

### **Endpoints retornando 404**

Verificar se as rotas estão registradas no `server-fly.js` ou nos arquivos de rotas.

---

## 📁 ONDE ENCONTRAR OS RELATÓRIOS

Após executar a validação, os relatórios são salvos em:

- **JSON:** `logs/v19/validacao/validacao_completa_{timestamp}.json`
- **Markdown:** `logs/v19/validacao/validacao_completa_{timestamp}.md`
- **Logs:** `logs/v19/validacao/validacao_{data}.log`

---

## 🎯 PRÓXIMOS PASSOS APÓS VALIDAÇÃO

### Se tudo passou ✅:

1. **Iniciar app em desenvolvimento:**
   ```bash
   cd goldeouro-mobile
   npx expo start
   ```

2. **Escolher dispositivo:**
   - **Expo Go:** Escanear QR code com Expo Go instalado
   - **Emulador:** Pressionar `a` (Android) ou `i` (iOS)
   - **Web:** Pressionar `w`

3. **Testar fluxo completo:**
   - Login/Registro
   - Criar pagamento PIX
   - Entrar na fila
   - Realizar chute
   - Verificar saldo atualizado

### Se algo falhou ❌:

1. Revisar relatório Markdown gerado
2. Corrigir itens que falharam
3. Re-executar validação
4. Repetir até tudo passar

---

## 🆘 SUPORTE

Se encontrar problemas:

1. Verificar logs em `logs/v19/validacao/`
2. Revisar documentação em `automation/README.md`
3. Verificar status do backend: `https://goldeouro-backend-v2.fly.dev/health`
4. Verificar Supabase Dashboard para erros de RPC

---

**Última atualização:** 2025-01-12  
**Versão:** V19

