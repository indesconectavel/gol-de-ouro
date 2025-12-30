# 🚀 FASE 3 — AUDITORIA FINANCEIRA: COMO EXECUTAR AS QUERIES
## Guia Passo a Passo Completo

**Data:** 19/12/2025  
**Hora:** 23:40:00  

---

## 🎯 OBJETIVO

Executar todas as queries de auditoria financeira no Supabase SQL Editor.

---

## 📋 PASSO A PASSO COMPLETO

### **PASSO 1: Acessar Supabase SQL Editor**

1. **Abrir navegador** (Chrome, Edge, Firefox, etc.)

2. **Acessar Supabase Dashboard:**
   - URL: `https://supabase.com/dashboard`
   - Fazer login se necessário

3. **Selecionar Projeto:**
   - Clicar no projeto: **`goldeouro-production`**
   - Verificar que está no ambiente: **`PRODUCTION`**

4. **Navegar para SQL Editor:**
   - No menu lateral esquerdo, clicar em **"SQL Editor"** (ícone de documento com "SQL")
   - Ou acessar diretamente: `https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/sql`

---

### **PASSO 2: Abrir Arquivo de Queries**

1. **Abrir arquivo local:**
   - No VS Code ou editor de texto, abrir:
   - `docs/FASE-3-AUDITORIA-FINANCEIRA-QUERIES.sql`

2. **Selecionar todo o conteúdo:**
   - Pressionar `Ctrl+A` (Windows) ou `Cmd+A` (Mac)
   - Ou selecionar manualmente todo o texto

3. **Copiar:**
   - Pressionar `Ctrl+C` (Windows) ou `Cmd+C` (Mac)

---

### **PASSO 3: Colar no Supabase SQL Editor**

1. **No Supabase SQL Editor:**
   - Clicar na área de edição de código (painel central)
   - Limpar qualquer conteúdo existente (se houver)

2. **Colar as queries:**
   - Pressionar `Ctrl+V` (Windows) ou `Cmd+V` (Mac)
   - Ou clicar com botão direito → "Colar"

3. **Verificar:**
   - Deve aparecer todo o código SQL com todas as queries
   - Verificar que há múltiplas queries separadas por `--`

---

### **PASSO 4: Executar as Queries**

#### **OPÇÃO A: Executar Todas de Uma Vez (Recomendado)**

1. **Verificar configurações:**
   - **Source:** Primary Database
   - **Role:** postgres
   - **Projeto:** goldeouro-production
   - **Ambiente:** PRODUCTION

2. **Executar:**
   - Pressionar `Ctrl+Enter` (Windows) ou `Cmd+Enter` (Mac)
   - OU clicar no botão **"Run"** (botão verde no canto inferior direito)
   - OU clicar em **"Run CTRL + Enter"**

3. **Aguardar execução:**
   - As queries serão executadas sequencialmente
   - Pode levar 10-30 segundos dependendo do volume de dados

4. **Ver resultados:**
   - Os resultados aparecerão na aba **"Results"** (aba inferior)
   - Cada query terá seu próprio conjunto de resultados
   - Navegar entre os resultados usando as setas ou tabs

---

#### **OPÇÃO B: Executar Queries Individualmente**

1. **Selecionar uma query específica:**
   - Encontrar a query desejada no código
   - Selecionar apenas essa query (do `-- QUERY X:` até o próximo `--`)

2. **Executar:**
   - Pressionar `Ctrl+Enter` ou clicar em "Run"
   - Ver resultado dessa query específica

3. **Repetir:**
   - Repetir para cada query que desejar executar

---

### **PASSO 5: Visualizar Resultados**

1. **Aba Results:**
   - Os resultados aparecem em formato de tabela
   - Cada coluna representa um campo retornado
   - Cada linha representa um registro

2. **Navegar entre queries:**
   - Se executou todas de uma vez, use as setas ou tabs para navegar
   - Cada query terá seu próprio conjunto de resultados

3. **Exportar resultados (opcional):**
   - Clicar na aba **"Export"**
   - Escolher formato: CSV, JSON, etc.
   - Baixar para análise posterior

---

## 🎯 EXECUÇÃO RÁPIDA (3 PASSOS)

### **Método Mais Rápido:**

1. **Copiar:** Abrir `docs/FASE-3-AUDITORIA-FINANCEIRA-QUERIES.sql` → `Ctrl+A` → `Ctrl+C`

2. **Colar:** No Supabase SQL Editor → `Ctrl+V`

3. **Executar:** `Ctrl+Enter` ou botão "Run"

**Pronto!** ✅

---

## ⚠️ IMPORTANTE

### **Antes de Executar:**

- ✅ Verificar que está no projeto correto: **`goldeouro-production`**
- ✅ Verificar que está no ambiente correto: **`PRODUCTION`**
- ✅ Todas as queries são **somente SELECT** (seguro, não modifica dados)

### **Durante Execução:**

- ⏸️ Aguardar execução completa
- ⏸️ Não fechar o navegador
- ⏸️ Não executar novamente enquanto está executando

### **Após Execução:**

- ✅ Revisar resultados
- ✅ Documentar problemas encontrados
- ✅ Salvar resultados importantes

---

## 🐛 SOLUÇÃO DE PROBLEMAS

### **Problema: "Query failed" ou Erro**

**Solução:**
1. Verificar se está no projeto correto
2. Verificar se a query está completa (não cortada)
3. Tentar executar query por query para identificar qual está com problema

### **Problema: "Timeout" ou Demora Muito**

**Solução:**
1. Aguardar mais tempo (queries complexas podem levar até 1 minuto)
2. Executar queries individualmente
3. Verificar volume de dados no banco

### **Problema: "Column does not exist"**

**Solução:**
1. Verificar se executou a QUERY 0 primeiro (verifica schema)
2. Verificar se está usando o schema correto
3. Consultar `docs/FASE-3-AUDITORIA-FINANCEIRA-VERIFICAR-SCHEMA.sql`

---

## 📊 O QUE ESPERAR

### **Após Executar:**

Você verá resultados de **15 queries** diferentes:

1. **QUERY 0:** Schema real (estrutura das tabelas)
2. **QUERY 1:** Saldos de usuários
3. **QUERY 2:** Consistência de transações
4. **QUERY 3:** Integridade de Pagamentos PIX
5. **QUERY 4:** Validação de Saques
6. **QUERY 5-7:** Registros órfãos
7. **QUERY 8-11:** Validação de valores e duplicações
8. **QUERY 12:** Resumo financeiro geral
9. **QUERY 13-15:** Validações adicionais

---

## ✅ CHECKLIST DE EXECUÇÃO

- [ ] Acessei Supabase Dashboard
- [ ] Selecionei projeto `goldeouro-production`
- [ ] Naveguei para SQL Editor
- [ ] Abri arquivo `FASE-3-AUDITORIA-FINANCEIRA-QUERIES.sql`
- [ ] Copiei todo o conteúdo (`Ctrl+A` → `Ctrl+C`)
- [ ] Colei no SQL Editor (`Ctrl+V`)
- [ ] Verifiquei configurações (Source, Role, Projeto)
- [ ] Executei queries (`Ctrl+Enter` ou botão "Run")
- [ ] Aguardei execução completa
- [ ] Visualizei resultados na aba "Results"

---

## 🎯 PRÓXIMO PASSO APÓS EXECUTAR

Após executar e ver os resultados:

1. ✅ Analisar QUERY 12 primeiro (visão geral)
2. ✅ Analisar queries críticas (QUERY 1-4)
3. ✅ Documentar problemas encontrados
4. ✅ Gerar relatório final

---

**Documento criado em:** 2025-12-19T23:40:00.000Z  
**Status:** ✅ **GUIA COMPLETO PRONTO**

