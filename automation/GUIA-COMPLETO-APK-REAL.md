# 🚀 GUIA COMPLETO - GERAÇÃO DE APK + TESTE REAL

**Data:** 2025-12-13  
**Status:** ✅ BACKUPS CONCLUÍDOS | ⏳ AGUARDANDO AÇÕES MANUAIS

---

## ✅ ETAPA 0 - BACKUPS (CONCLUÍDO)

### ✅ Backup Git
- **Commit:** `84820dc`
- **Tag:** `pre_apk_real_test`
- **Status:** ✅ Criado com sucesso

### ✅ Backup Supabase
- **Schema:** `backup/schema/PROD/schema_PROD_2025-12-13T01-04-08-342Z.sql`
- **Dados:** `backup/data/PROD/data_PROD_2025-12-13T01-04-09-748Z.sql`
- **Status:** ✅ Backup completo realizado

### ✅ Variáveis de Ambiente
- **Status:** ✅ Verificadas e funcionais

---

## ✅ ETAPA 1 - VERIFICAÇÃO DO APP (CONCLUÍDO)

### ✅ Configuração app.json
- **Package:** `com.goldeouro.app` ✅
- **Version Code:** 2 ✅
- **API URL:** `https://goldeouro-backend-v2.fly.dev` ✅ (PRODUÇÃO)

### ⚠️ Expo Doctor
- **Status:** 12/16 checks passed
- **Problemas:** Assets faltando (não crítico para build)
- **Decisão:** Prosseguir com build

---

## ⏳ ETAPA 2 - GERAÇÃO DO APK (AÇÃO NECESSÁRIA)

### 🔐 PASSO 1: Login no Expo

```bash
cd goldeouro-mobile
eas login
```

**Nota:** Você precisará fazer login com sua conta Expo.

---

### 📦 PASSO 2: Gerar APK

```bash
# Gerar APK em modo produção
eas build --platform android --profile production
```

**Opções importantes:**
- `--platform android` - Apenas Android
- `--profile production` - Perfil de produção
- `--local` - (Opcional) Build local se tiver ambiente configurado

**Tempo estimado:** 15-30 minutos

---

### 💾 PASSO 3: Baixar e Salvar APK

Após o build completar:

1. O EAS fornecerá um link para download
2. Baixe o APK
3. Salve em local seguro
4. Registre informações no arquivo `automation/APK-GERADO.md`:
   - Nome do arquivo
   - Hash SHA-256
   - Tamanho
   - Data de geração

---

## ⏳ ETAPA 3 - INSTALAÇÃO E TESTE REAL (AÇÃO NECESSÁRIA)

### 📱 PASSO 1: Instalar APK

1. Transferir APK para dispositivo Android
2. Habilitar "Fontes desconhecidas" nas configurações
3. Instalar APK
4. Abrir aplicativo

---

### 🧪 PASSO 2: Teste PIX REAL

**Usuário de teste:** `free10signer@gmail.com`

**Fluxo de teste:**

1. **Login:**
   - Abrir app
   - Fazer login com `free10signer@gmail.com`
   - Validar que login funciona

2. **Criar Depósito PIX:**
   - Navegar para tela de depósito
   - Criar depósito de R$ 1,00
   - Gerar QR Code PIX
   - Validar que QR Code é gerado corretamente

3. **Efetuar Pagamento REAL:**
   - Usar app do banco para pagar PIX
   - Efetuar pagamento de R$ 1,00 REAL
   - Aguardar confirmação

4. **Validar Webhook:**
   - Aguardar até 2 minutos
   - Verificar se webhook foi recebido
   - Validar no backend:
     - Saldo atualizado
     - Transaction registrada
     - Webhook_events salvo
     - Nenhum erro silencioso

---

### 🎮 PASSO 3: Teste do Jogo (LOTE)

**Fluxo de teste:**

1. **Acessar Jogo:**
   - Navegar para tela do jogo
   - Validar que tela carrega

2. **Entrar em LOTE:**
   - Entrar em um lote existente OU
   - Criar automaticamente via RPC (se necessário)

3. **Executar Chute:**
   - Fazer um chute
   - Validar:
     - Registro do chute salvo
     - Associação ao lote correto
     - Resultado calculado (ganhou ou não)

4. **Validar Premiação (se ganhou):**
   - Reward criada
   - Saldo atualizado corretamente
   - Histórico do jogador atualizado

---

## ⏳ ETAPA 4 - CHECKLIST DE APROVAÇÃO (AÇÃO NECESSÁRIA)

Após completar os testes, preencher `automation/CHECKLIST-FINAL.md`:

- [ ] APK abre corretamente
- [ ] Login funciona
- [ ] PIX REAL funciona
- [ ] Webhook PIX funciona
- [ ] Saldo atualiza
- [ ] Sistema de LOTES funciona
- [ ] Chute funciona
- [ ] Premiação funciona
- [ ] App estável (sem crash)
- [ ] Performance aceitável

---

## ⏳ ETAPA 5 - VEREDITO FINAL (AÇÃO NECESSÁRIA)

Gerar relatório executivo em `automation/RELATORIO-FINAL-APK.md`:

- Status final: PRONTO ou NÃO PRONTO
- Lista objetiva do que falta (se houver)
- Se PRONTO: Declarar explicitamente aprovação para Play Store

---

## 📋 CHECKLIST RÁPIDO

### Antes de Gerar APK:
- [x] Backups criados
- [x] app.json corrigido
- [x] App aponta para produção
- [ ] Login no EAS realizado
- [ ] Build APK executado

### Antes de Testar:
- [ ] APK baixado e salvo
- [ ] Dispositivo Android preparado
- [ ] Usuário de teste confirmado (`free10signer@gmail.com`)
- [ ] Acesso ao backend para validar webhooks

### Durante Testes:
- [ ] Teste PIX REAL executado
- [ ] Teste de LOTE executado
- [ ] Todos os resultados documentados

### Após Testes:
- [ ] Checklist preenchido
- [ ] Relatório final gerado
- [ ] Decisão tomada (PRONTO/NÃO PRONTO)

---

## ⚠️ IMPORTANTE

- **NÃO publicar ainda** - Apenas testes
- **NÃO alterar regras de negócio**
- **NÃO remover logs**
- **Tudo deve ser auditável**
- **Tudo deve ser documentado**

---

**Última atualização:** 2025-12-13

