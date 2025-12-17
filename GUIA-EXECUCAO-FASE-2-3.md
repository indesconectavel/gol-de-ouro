# 🚀 GUIA DE EXECUÇÃO - FASE 2 e 3
## Deploy Backend e Build Mobile

**Data:** 2025-01-24  
**Status:** ✅ Migration SQL Executada  
**Próximo:** Deploy Backend → Build Mobile

---

## ✅ FASE 1 CONCLUÍDA

- ✅ Migration `refresh_token` executada no Supabase
- ✅ Colunas `refresh_token` e `last_login` criadas
- ✅ Índice `idx_usuarios_refresh_token` criado

---

## 🔧 FASE 2: DEPLOY BACKEND

### **2.1 Preparar Commit**

**Arquivos do Hardening para Commitar:**

```bash
# Arquivos principais do hardening
git add server-fly.js
git add src/websocket.js
git add services/loteService.js
git add database/migration-refresh-token.sql
git add database/schema-lotes-persistencia.sql

# Arquivos mobile do hardening
git add goldeouro-mobile/src/services/AuthService.js
git add goldeouro-mobile/src/services/GameService.js
git add goldeouro-mobile/src/screens/GameScreen.js

# Documentação
git add RELATORIO-CERTIFICACAO-TECNICA-HARDENING-FINAL.md
git add PROXIMOS-PASSOS-HARDENING-FINAL.md
git add INSTRUCOES-EXECUTAR-MIGRATION-SUPABASE.md
git add GUIA-EXECUCAO-FASE-2-3.md
```

**⚠️ IMPORTANTE:** Não commitar todos os arquivos não rastreados. Apenas os do hardening.

---

### **2.2 Fazer Commit**

```bash
git commit -m "feat: hardening final - persistência de lotes, refresh token, remoção WebSocket/fila

- Persistência de lotes no PostgreSQL via LoteService
- Refresh token implementado (access 1h, refresh 7d)
- WebSocket limpo (removido código de fila/partidas)
- Mobile adaptado para REST API exclusivamente
- SecureStore para tokens (substitui AsyncStorage)
- GameScreen reescrito para usar REST API
- Migration SQL para refresh_token aplicada"
```

---

### **2.3 Push para Repositório**

```bash
git push origin main
```

**⚠️ ATENÇÃO:** Se houver conflitos, resolva antes de fazer push.

---

### **2.4 Deploy no Fly.io**

```bash
flyctl deploy
```

**Durante o Deploy:**
- Aguarde a conclusão (pode levar 2-5 minutos)
- Monitore os logs em tempo real
- Verifique se não há erros

**Validação Pós-Deploy:**

```bash
# Verificar logs após deploy
flyctl logs

# Procurar por mensagens de sucesso:
# - "Servidor iniciado na porta"
# - "lotes ativos sincronizados"
# - "Conexão Supabase estabelecida"
```

---

### **2.5 Testar Endpoints**

**Teste 1: Health Check**
```bash
curl https://goldeouro-backend-v2.fly.dev/health
```

**Teste 2: Refresh Token Endpoint**
```bash
curl -X POST https://goldeouro-backend-v2.fly.dev/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Resultado Esperado:** `400 Bad Request` (token não fornecido) - isso confirma que o endpoint existe.

---

## 📱 FASE 3: BUILD MOBILE

### **3.1 Verificar Dependências**

```bash
cd goldeouro-mobile
npm list expo-secure-store
```

**✅ Confirmado:** `expo-secure-store` já está instalado (v13.0.2)

---

### **3.2 Verificar Configuração EAS**

```bash
# Verificar se EAS está configurado
eas build:configure
```

**Se pedir configuração:**
- Profile: `production`
- Platform: `android`
- Build type: `apk`

---

### **3.3 Build APK**

```bash
# Build de produção
eas build --platform android --profile production
```

**Durante o Build:**
- Aguarde a conclusão (30-60 minutos)
- Monitore o progresso no terminal
- Anote o Build ID quando concluir

**Após o Build:**
- Baixe o APK do EAS Dashboard
- Ou use o link fornecido no terminal

---

### **3.4 Instalar APK**

1. Transferir APK para dispositivo Android
2. Habilitar "Fontes desconhecidas" nas configurações
3. Instalar APK
4. Abrir app e verificar versão (deve ser 2.0.0)

---

## ✅ CHECKLIST DE VALIDAÇÃO

### **Backend:**
- [ ] Deploy concluído sem erros
- [ ] Logs mostram sincronização de lotes
- [ ] Endpoint `/api/auth/refresh` responde
- [ ] Health check retorna OK

### **Mobile:**
- [ ] Build concluído com sucesso
- [ ] APK gerado e baixado
- [ ] APK instalado no dispositivo
- [ ] App abre sem erros

---

## 🚨 TROUBLESHOOTING

### **Erro no Deploy:**

**Problema:** Erro de sintaxe no `server-fly.js`
**Solução:** Já corrigido (vírgula faltando no endpoint de fila)

**Problema:** Erro de conexão com Supabase
**Solução:** Verificar variáveis de ambiente no Fly.io:
```bash
flyctl secrets list
```

### **Erro no Build:**

**Problema:** `expo-secure-store` não encontrado
**Solução:** Já está instalado, mas se necessário:
```bash
cd goldeouro-mobile
npm install expo-secure-store
```

**Problema:** Erro de configuração EAS
**Solução:** Verificar `eas.json` e `app.json`

---

## 📋 PRÓXIMOS PASSOS

Após concluir Fase 2 e 3:

1. ✅ Prosseguir para **Fase 4: Validação Técnica**
2. ✅ Testar persistência de lotes (restart servidor)
3. ✅ Testar refresh token (renovação automática)
4. ✅ Testar REST API (chute via API)

---

*Guia gerado em: 2025-01-24*  
*Versão: 1.0*

