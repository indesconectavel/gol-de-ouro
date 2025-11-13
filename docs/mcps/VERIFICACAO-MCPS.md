# 🔍 VERIFICAÇÃO DE MCPs - GOL DE OURO

**Data:** 13/11/2025, 17:13:00  
**Versão:** 1.2.0  
**Status:** ✅ **VERIFICAÇÃO COMPLETA REALIZADA**

---

## 📊 RESUMO EXECUTIVO

- **Total de MCPs:** 10
- **✅ Funcionando:** 4
- **⚠️ Faltando Variáveis:** 2
- **❌ Com Erros:** 4

---

## 🔍 DETALHES POR MCP


### vercel

- **Status:** ✅ Funcionando
- **Comando:** `npx vercel --version`
- **Comando Funcionando:** ✅ Sim


**Variáveis de Ambiente:**
- VERCEL_TOKEN: ✅ Definida
- VERCEL_ORG_ID: ✅ Definida
- VERCEL_PROJECT_ID: ✅ Definida



### flyio

- **Status:** ✅ Funcionando
- **Comando:** `flyctl version`
- **Comando Funcionando:** ✅ Sim


**Variáveis de Ambiente:**
- FLY_API_TOKEN: ✅ Definida



### supabase

- **Status:** ✅ Funcionando
- **Comando:** `node test-supabase.js`
- **Comando Funcionando:** ✅ Sim


**Variáveis de Ambiente:**
- SUPABASE_URL: ✅ Definida
- SUPABASE_SERVICE_ROLE_KEY: ✅ Definida



### github-actions

- **Status:** ❌ Erro
- **Comando:** `gh --version`
- **Comando Funcionando:** ❌ Não
- **Erro:** Command failed: gh --version
'gh' não é reconhecido como um comando interno
ou externo, um programa operável ou um arquivo em lotes.


**Variáveis de Ambiente:**
- GITHUB_TOKEN: ✅ Definida



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
'docker' não é reconhecido como um comando interno
ou externo, um programa operável ou um arquivo em lotes.




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

- **Status:** ✅ Funcionando
- **Comando:** `npx eslint --version`
- **Comando Funcionando:** ✅ Sim




---

## 📋 VARIÁVEIS DE AMBIENTE


### VERCEL_TOKEN
- **Status:** ✅ Definida
- **Tamanho:** 24 caracteres
- **Preview:** QY1Vu9z3Ky...


### VERCEL_ORG_ID
- **Status:** ✅ Definida
- **Tamanho:** 25 caracteres
- **Preview:** goldeouro-...


### VERCEL_PROJECT_ID
- **Status:** ✅ Definida
- **Tamanho:** 16 caracteres
- **Preview:** goldeouro-...


### FLY_API_TOKEN
- **Status:** ✅ Definida
- **Tamanho:** 691 caracteres
- **Preview:** FlyV1 fm2_...


### SUPABASE_URL
- **Status:** ✅ Definida
- **Tamanho:** 40 caracteres
- **Preview:** https://ga...


### SUPABASE_SERVICE_ROLE_KEY
- **Status:** ✅ Definida
- **Tamanho:** 219 caracteres
- **Preview:** eyJhbGciOi...


### GITHUB_TOKEN
- **Status:** ✅ Definida
- **Tamanho:** 93 caracteres
- **Preview:** github_pat...


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
- **sentry:** SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT
- **postgres:** DATABASE_URL



### 2. Corrigir MCPs com Erros

Os seguintes MCPs precisam de correção:
- **github-actions:** Command failed: gh --version
'gh' não é reconhecido como um comando interno
ou externo, um programa operável ou um arquivo em lotes.

- **lighthouse:** spawnSync C:\WINDOWS\system32\cmd.exe ETIMEDOUT
- **docker:** Command failed: docker --version
'docker' não é reconhecido como um comando interno
ou externo, um programa operável ou um arquivo em lotes.

- **jest:** spawnSync C:\WINDOWS\system32\cmd.exe ETIMEDOUT


### 3. Testar MCPs Individualmente

Teste cada MCP individualmente para garantir funcionamento completo.

---

**Relatório gerado automaticamente pelo Sistema MCP Gol de Ouro** 🚀
