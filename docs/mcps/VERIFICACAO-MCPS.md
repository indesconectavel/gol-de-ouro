# 🔍 VERIFICAÇÃO DE MCPs - GOL DE OURO

**Data:** 13/11/2025, 15:49:18  
**Versão:** 1.2.0  
**Status:** ✅ **VERIFICAÇÃO COMPLETA REALIZADA**

---

## 📊 RESUMO EXECUTIVO

- **Total de MCPs:** 10
- **✅ Funcionando:** 0
- **⚠️ Faltando Variáveis:** 6
- **❌ Com Erros:** 4

---

## 🔍 DETALHES POR MCP


### vercel

- **Status:** ⚠️ Faltando Variáveis
- **Comando:** `npx vercel --version`
- **Comando Funcionando:** ❌ Não
- **Erro:** Variáveis de ambiente faltando: VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID

**Variáveis de Ambiente:**
- VERCEL_TOKEN: ❌ Não definida
- VERCEL_ORG_ID: ❌ Não definida
- VERCEL_PROJECT_ID: ❌ Não definida



### flyio

- **Status:** ⚠️ Faltando Variáveis
- **Comando:** `flyctl version`
- **Comando Funcionando:** ❌ Não
- **Erro:** Variáveis de ambiente faltando: FLY_API_TOKEN

**Variáveis de Ambiente:**
- FLY_API_TOKEN: ❌ Não definida



### supabase

- **Status:** ⚠️ Faltando Variáveis
- **Comando:** `node test-supabase.js`
- **Comando Funcionando:** ❌ Não
- **Erro:** Variáveis de ambiente faltando: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

**Variáveis de Ambiente:**
- SUPABASE_URL: ❌ Não definida
- SUPABASE_SERVICE_ROLE_KEY: ❌ Não definida



### github-actions

- **Status:** ⚠️ Faltando Variáveis
- **Comando:** `gh --version`
- **Comando Funcionando:** ❌ Não
- **Erro:** Variáveis de ambiente faltando: GITHUB_TOKEN

**Variáveis de Ambiente:**
- GITHUB_TOKEN: ❌ Não definida



### lighthouse

- **Status:** ❌ Erro
- **Comando:** `npx lighthouse --version`
- **Comando Funcionando:** ❌ Não
- **Erro:** spawnSync C:\WINDOWS\system32\cmd.exe ETIMEDOUT



### docker

- **Status:** ❌ Erro
- **Comando:** `docker --version`
- **Comando Funcionando:** ❌ Não
- **Erro:** Command failed: docker --version
'docker' n�o � reconhecido como um comando interno
ou externo, um programa oper�vel ou um arquivo em lotes.




### sentry

- **Status:** ⚠️ Faltando Variáveis
- **Comando:** `npx @sentry/cli --version`
- **Comando Funcionando:** ❌ Não
- **Erro:** Variáveis de ambiente faltando: SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT

**Variáveis de Ambiente:**
- SENTRY_AUTH_TOKEN: ❌ Não definida
- SENTRY_ORG: ❌ Não definida
- SENTRY_PROJECT: ❌ Não definida



### postgres

- **Status:** ⚠️ Faltando Variáveis
- **Comando:** `psql --version`
- **Comando Funcionando:** ❌ Não
- **Erro:** Variáveis de ambiente faltando: DATABASE_URL

**Variáveis de Ambiente:**
- DATABASE_URL: ❌ Não definida



### jest

- **Status:** ❌ Erro
- **Comando:** `npx jest --version`
- **Comando Funcionando:** ❌ Não
- **Erro:** spawnSync C:\WINDOWS\system32\cmd.exe ETIMEDOUT



### eslint

- **Status:** ❌ Erro
- **Comando:** `npx eslint --version`
- **Comando Funcionando:** ❌ Não
- **Erro:** spawnSync C:\WINDOWS\system32\cmd.exe ETIMEDOUT



---

## 📋 VARIÁVEIS DE AMBIENTE


### VERCEL_TOKEN
- **Status:** ❌ Não definida
- **Tamanho:** 0 caracteres
- **Preview:** não definida


### VERCEL_ORG_ID
- **Status:** ❌ Não definida
- **Tamanho:** 0 caracteres
- **Preview:** não definida


### VERCEL_PROJECT_ID
- **Status:** ❌ Não definida
- **Tamanho:** 0 caracteres
- **Preview:** não definida


### FLY_API_TOKEN
- **Status:** ❌ Não definida
- **Tamanho:** 0 caracteres
- **Preview:** não definida


### SUPABASE_URL
- **Status:** ❌ Não definida
- **Tamanho:** 0 caracteres
- **Preview:** não definida


### SUPABASE_SERVICE_ROLE_KEY
- **Status:** ❌ Não definida
- **Tamanho:** 0 caracteres
- **Preview:** não definida


### GITHUB_TOKEN
- **Status:** ❌ Não definida
- **Tamanho:** 0 caracteres
- **Preview:** não definida


### SENTRY_AUTH_TOKEN
- **Status:** ❌ Não definida
- **Tamanho:** 0 caracteres
- **Preview:** não definida


### SENTRY_ORG
- **Status:** ❌ Não definida
- **Tamanho:** 0 caracteres
- **Preview:** não definida


### SENTRY_PROJECT
- **Status:** ❌ Não definida
- **Tamanho:** 0 caracteres
- **Preview:** não definida


### DATABASE_URL
- **Status:** ❌ Não definida
- **Tamanho:** 0 caracteres
- **Preview:** não definida


---

## ✅ PRÓXIMOS PASSOS


### 1. Configurar Variáveis de Ambiente Faltando

As seguintes variáveis precisam ser configuradas:
- **vercel:** VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID
- **flyio:** FLY_API_TOKEN
- **supabase:** SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- **github-actions:** GITHUB_TOKEN
- **sentry:** SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT
- **postgres:** DATABASE_URL



### 2. Corrigir MCPs com Erros

Os seguintes MCPs precisam de correção:
- **lighthouse:** spawnSync C:\WINDOWS\system32\cmd.exe ETIMEDOUT
- **docker:** Command failed: docker --version
'docker' n�o � reconhecido como um comando interno
ou externo, um programa oper�vel ou um arquivo em lotes.

- **jest:** spawnSync C:\WINDOWS\system32\cmd.exe ETIMEDOUT
- **eslint:** spawnSync C:\WINDOWS\system32\cmd.exe ETIMEDOUT


### 3. Testar MCPs Individualmente

Teste cada MCP individualmente para garantir funcionamento completo.

---

**Relatório gerado automaticamente pelo Sistema MCP Gol de Ouro** 🚀
