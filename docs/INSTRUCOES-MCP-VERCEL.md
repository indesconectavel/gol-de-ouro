# 🔧 INSTRUÇÕES - USO DO MCP VERCEL
# Gol de Ouro - Correções Vercel

**Data:** 17/11/2025  
**Status:** ✅ **INSTRUÇÕES CRIADAS**

---

## 📋 CORREÇÕES APLICADAS LOCALMENTE

### ✅ Correções Realizadas:

1. ✅ **Versão atualizada:** `package.json` → v1.2.0
2. ✅ **URL do backend padronizada:**
   - `vercel.json` → `goldeouro-backend-v2.fly.dev`
   - `vite.config.js` → `goldeouro-backend-v2.fly.dev`
   - `src/config/env.js` → `goldeouro-backend-v2.fly.dev`

---

## 🔧 AÇÕES NECESSÁRIAS NO VERCEL

### Opção 1: Via Vercel Dashboard (Recomendado)

#### 1. Atualizar Branch de Produção

1. **Acessar:** `https://vercel.com/goldeouro-admins-projects/goldeouro-admin`
2. **Ir em:** Settings → Git
3. **Production Branch:** Selecionar `main`
4. **Salvar**

#### 2. Verificar Variáveis de Ambiente

1. **Ir em:** Settings → Environment Variables
2. **Verificar/Criar:**

**`VITE_ADMIN_TOKEN`**
- Key: `VITE_ADMIN_TOKEN`
- Value: Valor do `ADMIN_TOKEN` do backend
- Environments: Production, Preview, Development

**`VITE_API_URL`**
- Key: `VITE_API_URL`
- Value: `/api`
- Environments: Production, Preview, Development

#### 3. Fazer Deploy

**Opção A: Deploy Automático**
- Fazer push para branch `main`
- Vercel faz deploy automático

**Opção B: Deploy Manual**
- Clicar em "Deploy" no dashboard
- Ou usar CLI: `npx vercel --prod`

---

### Opção 2: Via Vercel CLI

#### 1. Instalar Vercel CLI (se necessário)
```bash
npm install -g vercel
```

#### 2. Fazer Login
```bash
vercel login
```

#### 3. Verificar Projetos
```bash
vercel projects list
```

#### 4. Verificar Variáveis de Ambiente
```bash
cd goldeouro-admin
vercel env ls
```

#### 5. Adicionar Variáveis (se necessário)
```bash
# Adicionar VITE_ADMIN_TOKEN
vercel env add VITE_ADMIN_TOKEN production
# Digitar o valor quando solicitado

# Adicionar VITE_API_URL
vercel env add VITE_API_URL production
# Valor: /api
```

#### 6. Fazer Deploy
```bash
cd goldeouro-admin
npm run build
vercel --prod
```

---

## 📝 COMANDOS ÚTEIS VERCEL CLI

### Listar Projetos
```bash
vercel projects list
```

### Ver Detalhes do Projeto
```bash
vercel inspect goldeouro-admin
```

### Listar Deployments
```bash
vercel ls goldeouro-admin
```

### Ver Variáveis de Ambiente
```bash
vercel env ls goldeouro-admin
```

### Adicionar Variável
```bash
vercel env add NOME_VARIAVEL production
```

### Remover Variável
```bash
vercel env rm NOME_VARIAVEL production
```

### Fazer Deploy
```bash
vercel --prod
```

### Ver Logs
```bash
vercel logs goldeouro-admin
```

---

## ✅ VALIDAÇÃO PÓS-DEPLOY

### 1. Verificar Deploy
- Acessar: `https://admin.goldeouro.lol`
- Verificar se carrega corretamente

### 2. Testar Login
- Tentar fazer login
- Verificar se funciona

### 3. Testar Dashboard
- Verificar se dados carregam
- Verificar se não há erros no console

### 4. Verificar Requisições
- Abrir DevTools → Network
- Verificar se requisições ao backend funcionam
- Verificar se URL está correta (`/api` → rewrite)

---

## 🎯 RESUMO DAS CORREÇÕES

### Correções Locais Aplicadas:
- ✅ Versão: 1.1.0 → 1.2.0
- ✅ URL Backend: `goldeouro-backend.fly.dev` → `goldeouro-backend-v2.fly.dev`
- ✅ Arquivos atualizados: `vercel.json`, `vite.config.js`, `env.js`

### Ações Necessárias no Vercel:
- ⏭️ Atualizar branch de produção para `main`
- ⏭️ Verificar/configurar variáveis de ambiente
- ⏭️ Fazer deploy da versão atualizada

---

**Status:** ✅ **CORREÇÕES APLICADAS LOCALMENTE**

**Próxima Ação:** Aplicar correções no Vercel (Dashboard ou CLI)

