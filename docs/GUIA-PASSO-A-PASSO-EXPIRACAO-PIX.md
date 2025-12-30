# 📚 GUIA PASSO A PASSO: Sistema de Expiração de PIX

## 🎯 OBJETIVO

Configurar sistema automático para expirar pagamentos PIX que estão pendentes há mais de 24 horas.

---

## ✅ PASSO 1: Recriar Função RPC no Banco de Dados

### **O que vamos fazer:**
Criar uma função no banco de dados que marca pagamentos antigos como "expired".

### **Como fazer:**

1. **Abrir Supabase SQL Editor**
   - Acesse: https://supabase.com/dashboard
   - Clique em "SQL Editor" no menu lateral esquerdo

2. **Criar Nova Query**
   - Clique no botão "+" ou "New query" no topo
   - Ou use uma query existente

3. **Copiar o Script Completo**
   - Abra o arquivo: `database/rpc-expire-stale-pix-CORRIGIDO.sql`
   - Selecione TODO o conteúdo (CTRL+A)
   - Copie (CTRL+C)

4. **Colar no SQL Editor**
   - Cole o conteúdo no editor (CTRL+V)
   - Você deve ver algo assim:
   ```sql
   -- Configurar search_path para segurança
   SET search_path = public, pg_catalog;
   
   -- 1. Remover função existente (se existir)
   DROP FUNCTION IF EXISTS public.expire_stale_pix() CASCADE;
   
   -- 2. Criar função RPC para expirar pagamentos stale
   CREATE OR REPLACE FUNCTION public.expire_stale_pix()
   ...
   ```

5. **Executar o Script**
   - Clique no botão verde "Run" (ou pressione CTRL+Enter)
   - Aguarde alguns segundos

6. **Verificar Resultado**
   - Se der certo: Você verá uma mensagem de sucesso
   - Se der erro: Veja a mensagem de erro e me avise

7. **Testar a Função**
   - No mesmo SQL Editor, digite:
   ```sql
   SELECT * FROM expire_stale_pix();
   ```
   - Execute (Run ou CTRL+Enter)
   - Deve retornar algo como:
   ```json
   {
     "success": true,
     "expired_count": 0,
     "pending_before": 0,
     "timestamp": "2025-11-24T...",
     "message": "Expirou 0 pagamentos PIX stale"
   }
   ```

### ✅ **Checkpoint 1:**
- [ ] Script executado sem erros
- [ ] Função `expire_stale_pix()` testada e retornou JSON válido

---

## ✅ PASSO 2: Criar Edge Function no Supabase

### **O que vamos fazer:**
Criar uma função serverless que será executada automaticamente pelo cron job.

### **Como fazer:**

1. **Abrir Edge Functions**
   - No Supabase Dashboard, clique em "Edge Functions" no menu lateral
   - Ou acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/functions

2. **Criar Nova Function**
   - Clique no botão "Create a new function" ou "New function"
   - Você verá um editor com código de exemplo

3. **Limpar o Código de Exemplo**
   - Selecione TODO o código existente (CTRL+A)
   - Delete (Delete ou Backspace)

4. **Copiar o Código Correto**
   - Abra o arquivo: `supabase/functions/expire-stale-pix/index.ts`
   - Selecione TODO o conteúdo (CTRL+A)
   - Copie (CTRL+C)

5. **Colar no Editor**
   - Cole o código no editor do Supabase (CTRL+V)
   - Você deve ver código começando com:
   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
   import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
   ...
   ```

6. **Verificar o Nome da Function**
   - Na parte inferior da tela, há um campo "Function name"
   - Altere de "bright-function" para: `expire-stale-pix`
   - (sem espaços, com hífen)

7. **Deploy da Function**
   - Clique no botão verde "Deploy function"
   - Aguarde alguns segundos
   - Você verá uma mensagem de sucesso

8. **Testar a Function**
   - Após o deploy, você verá a função na lista
   - Clique na função `expire-stale-pix`
   - Clique em "Invoke function" ou "Test"
   - Verifique os logs e o resultado

### ✅ **Checkpoint 2:**
- [ ] Edge Function criada com nome `expire-stale-pix`
- [ ] Deploy executado com sucesso
- [ ] Function testada manualmente e funcionou

---

## ✅ PASSO 3: Configurar Scheduler (Cron Job)

### **O que vamos fazer:**
Configurar um cron job que executa a Edge Function a cada 5 minutos.

### **Como fazer:**

1. **Abrir Database → Scheduler**
   - No Supabase Dashboard, clique em "Database" no menu lateral
   - Depois clique em "Scheduler" (ou "Cron Jobs")
   - Ou acesse: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/database/scheduler

2. **Criar Novo Schedule**
   - Clique em "Create a new schedule" ou "New schedule"
   - Você verá um formulário

3. **Preencher o Formulário:**
   
   **Name:**
   - Digite: `expire-stale-pix`
   
   **Cron Expression:**
   - Digite: `*/5 * * * *`
   - Isso significa: "a cada 5 minutos"
   
   **Function:**
   - Selecione: `expire-stale-pix` (a função que criamos)
   
   **Verify JWT:**
   - Marque como: `false` (desmarcado)

4. **Salvar**
   - Clique em "Save" ou "Create schedule"
   - Aguarde confirmação

5. **Verificar**
   - Você verá o schedule na lista
   - Deve mostrar: `expire-stale-pix` com cron `*/5 * * * *`

### ✅ **Checkpoint 3:**
- [ ] Schedule criado com nome `expire-stale-pix`
- [ ] Cron configurado: `*/5 * * * *`
- [ ] Function selecionada: `expire-stale-pix`
- [ ] Verify JWT: `false`

---

## ✅ PASSO 4: Deploy do Backend

### **O que vamos fazer:**
Atualizar o backend para incluir validação no boot e endpoint admin.

### **Como fazer:**

1. **Abrir Terminal/PowerShell**
   - Abra o terminal na pasta do projeto
   - Certifique-se de estar na pasta: `E:\Chute de Ouro\goldeouro-backend`

2. **Verificar se está na pasta correta**
   ```bash
   pwd
   # Deve mostrar: E:\Chute de Ouro\goldeouro-backend
   ```

3. **Fazer Deploy**
   ```bash
   flyctl deploy -a goldeouro-backend-v2
   ```

4. **Aguardar Deploy**
   - O deploy pode levar alguns minutos
   - Você verá mensagens de progresso
   - Aguarde até ver "Deploy complete" ou similar

5. **Verificar Logs**
   ```bash
   flyctl logs -a goldeouro-backend-v2
   ```
   - Procure por: `✅ [BOOT] X pagamentos PIX stale foram marcados como expired`
   - Isso confirma que a validação no boot está funcionando

### ✅ **Checkpoint 4:**
- [ ] Deploy executado com sucesso
- [ ] Logs mostram validação no boot funcionando

---

## ✅ PASSO 5: Testar Endpoint Admin

### **O que vamos fazer:**
Testar o endpoint admin que permite expirar pagamentos manualmente.

### **Como fazer:**

1. **Abrir Terminal/PowerShell**
   - Ou use qualquer cliente HTTP (Postman, Insomnia, curl)

2. **Executar Comando**
   ```bash
   curl -X POST https://goldeouro-backend-v2.fly.dev/api/admin/fix-expired-pix -H "x-admin-token: goldeouro123" -H "Content-Type: application/json"
   ```

3. **Verificar Resposta**
   - Deve retornar JSON com `success: true`
   - Deve conter `expired_count` e `message`

### ✅ **Checkpoint 5:**
- [ ] Endpoint retorna 200 OK
- [ ] Resposta contém `expired_count`

---

## 🎯 RESUMO DOS PASSOS

1. ✅ **PASSO 1:** Executar script SQL no Supabase SQL Editor
2. ✅ **PASSO 2:** Criar Edge Function `expire-stale-pix` no Dashboard
3. ✅ **PASSO 3:** Configurar Scheduler com cron `*/5 * * * *`
4. ✅ **PASSO 4:** Deploy backend: `flyctl deploy -a goldeouro-backend-v2`
5. ✅ **PASSO 5:** Testar endpoint admin

---

## 🆘 TROUBLESHOOTING

### **Erro no PASSO 1:**
- **Erro:** `cannot change return type of existing function`
- **Solução:** Use o script `rpc-expire-stale-pix-CORRIGIDO.sql` que faz DROP primeiro

### **Erro no PASSO 2:**
- **Erro:** Function não aparece na lista
- **Solução:** Verifique se o nome está correto: `expire-stale-pix` (com hífen)

### **Erro no PASSO 3:**
- **Erro:** Scheduler não aparece
- **Solução:** Verifique se está em Database → Scheduler (não em Edge Functions)

### **Erro no PASSO 4:**
- **Erro:** Deploy falha
- **Solução:** Verifique se está na pasta correta e se tem acesso ao Fly.io

---

## 📞 PRECISA DE AJUDA?

Se encontrar algum erro, me envie:
1. A mensagem de erro completa
2. Em qual passo você estava
3. Um print da tela (se possível)

---

**Boa sorte! 🚀**

