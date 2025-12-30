# 📋 INSTRUÇÕES PARA APLICAR MIGRATION V19
## Passo a Passo Completo e Detalhado

---

## ⚠️ IMPORTANTE

Esta migration **DEVE** ser aplicada manualmente via Supabase Dashboard antes de continuar com as validações da ENGINE V19.

**NÃO** execute esta migration em produção sem backup completo.

---

## 🎯 OBJETIVO

Aplicar a migration V19 que criará:
- Tabela `system_heartbeat`
- Coluna `persisted_global_counter` em `lotes`
- Policies de RLS
- RPC Functions
- Índices de performance

---

## 📋 PASSO A PASSO

### PASSO 1: Acessar Supabase Dashboard

1. Abra seu navegador
2. Acesse: https://supabase.com/dashboard
3. Faça login se necessário
4. Selecione o projeto: **uatszaqzdqcwnfbipoxg** (STAGING)

**URL direta:**
```
https://supabase.com/dashboard/project/uatszaqzdqcwnfbipoxg/sql/new
```

---

### PASSO 2: Abrir SQL Editor

1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique no botão **"New query"** (ou use o atalho `Ctrl+N`)

**Você verá:**
- Um editor SQL em branco
- Botões: "Run", "Format", "Save", etc.

---

### PASSO 3: Abrir Arquivo de Migration

1. No seu computador, navegue até:
   ```
   E:\Chute de Ouro\goldeouro-backend\prisma\migrations\20251205_v19_rls_indexes_migration.sql
   ```

2. Abra o arquivo com um editor de texto (VS Code, Notepad++, etc.)

3. **Selecione TODO o conteúdo** do arquivo:
   - Pressione `Ctrl+A` para selecionar tudo
   - O arquivo tem aproximadamente **587 linhas**

---

### PASSO 4: Copiar Conteúdo

1. Com todo o conteúdo selecionado, pressione `Ctrl+C` para copiar
2. **Verifique** que o conteúdo copiado:
   - Começa com `BEGIN;`
   - Termina com `COMMIT;`
   - Contém aproximadamente 587 linhas

---

### PASSO 5: Colar no SQL Editor do Supabase

1. Volte para o Supabase Dashboard (SQL Editor)
2. Clique dentro do editor SQL
3. Pressione `Ctrl+V` para colar o conteúdo
4. **Aguarde** alguns segundos para o editor processar

**Você deve ver:**
- O SQL completo no editor
- Syntax highlighting ativo
- Nenhum erro de sintaxe visível (se houver, verifique se copiou tudo)

---

### PASSO 6: Executar Migration

1. **Revise** rapidamente o conteúdo (opcional, mas recomendado)
2. Clique no botão **"Run"** (ou pressione `Ctrl+Enter`)
3. **Aguarde** a execução completar

**Tempo estimado:** 10-30 segundos (dependendo do tamanho do banco)

---

### PASSO 7: Validar Execução Bem-Sucedida

Após executar, você verá uma das seguintes situações:

#### ✅ SUCESSO

**Mensagem esperada:**
```
Success. No rows returned
```

**OU:**
```
Success. X rows affected
```

**Indicadores de sucesso:**
- ✅ Nenhum erro vermelho na saída
- ✅ Mensagem "Success" visível
- ✅ Tempo de execução registrado

#### ❌ ERRO

**Se houver erro, você verá:**
```
ERROR: [mensagem de erro]
```

**Erros comuns e soluções:**

1. **"relation already exists"**
   - ✅ **Normal:** Algumas estruturas já existem
   - ✅ **Ação:** Continue, a migration é idempotente

2. **"permission denied"**
   - ❌ **Problema:** Permissões insuficientes
   - ✅ **Ação:** Verifique se está usando SERVICE_ROLE_KEY ou conta admin

3. **"syntax error"**
   - ❌ **Problema:** SQL malformado
   - ✅ **Ação:** Verifique se copiou todo o conteúdo corretamente

---

### PASSO 8: Validar Estruturas Criadas

Execute as seguintes queries no SQL Editor para validar:

#### 8.1 Verificar Tabela system_heartbeat

```sql
SELECT * FROM public.system_heartbeat LIMIT 1;
```

**Resultado esperado:**
- ✅ Query executa sem erro
- ✅ Retorna 0 ou mais linhas (tabela existe)

#### 8.2 Verificar Coluna persisted_global_counter

```sql
SELECT persisted_global_counter FROM public.lotes LIMIT 1;
```

**Resultado esperado:**
- ✅ Query executa sem erro
- ✅ Retorna valores (coluna existe)

#### 8.3 Verificar RLS Habilitado

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('usuarios', 'chutes', 'lotes', 'transacoes');
```

**Resultado esperado:**
- ✅ Todas as tabelas com `rowsecurity = true`

---

### PASSO 9: Reiniciar Servidor (Opcional mas Recomendado)

Após aplicar a migration:

1. **Pare o servidor** se estiver rodando:
   ```bash
   # No terminal onde o servidor está rodando, pressione Ctrl+C
   ```

2. **Inicie o servidor novamente:**
   ```bash
   node server-fly.js
   ```

3. **Aguarde** mensagens de inicialização:
   - ✅ "ENGINE V19 ATIVA"
   - ✅ "HEARTBEAT iniciado"
   - ✅ "Conectado ao Supabase"

---

### PASSO 10: Revalidar Sistema

Após aplicar a migration e reiniciar o servidor, execute:

```bash
node src/scripts/validate_heartbeat_v19.js
node src/scripts/validate_monitor_endpoint.js
node src/scripts/validate_metrics_endpoint.js
node src/scripts/validate_engine_v19_final.js
```

**Resultado esperado:**
- ✅ Todos os scripts executam sem erro
- ✅ Heartbeat validado
- ✅ Endpoints funcionando
- ✅ ENGINE V19 100% ativa

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após aplicar a migration, verifique:

- [ ] Migration executada sem erros críticos
- [ ] Tabela `system_heartbeat` existe
- [ ] Coluna `persisted_global_counter` existe em `lotes`
- [ ] RLS habilitado nas tabelas principais
- [ ] Servidor reiniciado (opcional)
- [ ] Validações reexecutadas

---

## 🚨 TROUBLESHOOTING

### Problema: Migration falha com "relation already exists"

**Solução:**
- ✅ **Normal:** A migration é idempotente
- ✅ Algumas estruturas podem já existir
- ✅ Continue a execução, ignore avisos de "already exists"

---

### Problema: Erro de permissão

**Solução:**
- Verifique se está usando SERVICE_ROLE_KEY
- Verifique se tem permissões de admin no projeto
- Tente executar em blocos menores se necessário

---

### Problema: Timeout na execução

**Solução:**
- A migration pode ser grande
- Aguarde alguns minutos
- Se persistir, execute em blocos menores

---

## 📄 ARQUIVOS RELACIONADOS

- `prisma/migrations/20251205_v19_rls_indexes_migration.sql` (arquivo da migration)
- `INSTRUCOES-PARA-APLICAR-MIGRATION-V19.md` (este arquivo)
- `CHECKLIST-POS-MIGRATION-V19.md` (comandos pós-migration)
- `RELATORIO-VALIDACAO-V19-FINAL.md` (relatório técnico)

---

## 🎯 CONCLUSÃO

Após seguir todos os passos acima:

1. ✅ Migration V19 aplicada
2. ✅ Estruturas criadas
3. ✅ Sistema validado
4. ✅ ENGINE V19 100% ativa

**Próximo passo:** Executar validações finais (ver `CHECKLIST-POS-MIGRATION-V19.md`)

---

**Gerado em:** 2025-12-05T22:00:00Z  
**Versão:** V19.0.0

