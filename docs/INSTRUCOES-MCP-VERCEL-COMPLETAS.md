# 🔧 INSTRUÇÕES COMPLETAS - MCP VERCEL
# Gol de Ouro - Correções Vercel

**Data:** 17/11/2025  
**Status:** ✅ **INSTRUÇÕES CRIADAS**

---

## 📋 CORREÇÕES APLICADAS LOCALMENTE

### ✅ Arquivos Corrigidos:

1. ✅ **`goldeouro-admin/package.json`**
   - Versão: `1.1.0` → `1.2.0`

2. ✅ **`goldeouro-admin/vercel.json`**
   - URL Backend: `goldeouro-backend.fly.dev` → `goldeouro-backend-v2.fly.dev`

3. ✅ **`goldeouro-admin/vite.config.js`**
   - URL Backend: `goldeouro-backend.fly.dev` → `goldeouro-backend-v2.fly.dev`

4. ✅ **`goldeouro-admin/src/config/env.js`**
   - URL Backend: `goldeouro-backend.fly.dev` → `goldeouro-backend-v2.fly.dev`

---

## 🔧 USO DO MCP VERCEL

### Opção 1: Via Vercel Dashboard (Recomendado)

#### 1. Atualizar Branch de Produção

1. **Acessar:** `https://vercel.com/goldeouro-admins-projects/goldeouro-admin`
2. **Ir em:** Settings → Git
3. **Production Branch:** Selecionar `main`
4. **Salvar**

**Resultado:** Vercel vai fazer deploy automático do branch `main` atualizado

---

#### 2. Verificar/Configurar Variáveis de Ambiente

1. **Ir em:** Settings → Environment Variables
2. **Verificar/Criar:**

**`VITE_ADMIN_TOKEN`**
- Key: `VITE_ADMIN_TOKEN`
- Value: Valor do `ADMIN_TOKEN` do backend (ex: `goldeouro123`)
- Environments: ✅ Production, ✅ Preview, ✅ Development

**`VITE_API_URL`**
- Key: `VITE_API_URL`
- Value: `/api`
- Environments: ✅ Production, ✅ Preview, ✅ Development

---

#### 3. Fazer Deploy Manual (Se Necessário)

**Opção A: Deploy Automático**
- Fazer push para branch `main`
- Vercel faz deploy automático

**Opção B: Deploy Manual**
- Clicar em "Deploy" no dashboard
- Ou usar CLI: `npx vercel --prod`

---

### Opção 2: Via Vercel CLI

#### 1. Instalar Vercel CLI
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

## 📝 COMANDOS VERCEL CLI ÚTEIS

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

### Atualizar Configuração do Projeto
```bash
vercel project ls
vercel project inspect goldeouro-admin
```

---

## ✅ CHECKLIST DE AÇÕES

### Correções Locais:
- [x] Versão atualizada para 1.2.0
- [x] URL do backend padronizada em `vercel.json`
- [x] URL do backend padronizada em `vite.config.js`
- [x] URL do backend padronizada em `env.js`

### Ações no Vercel:
- [ ] Branch de produção atualizado para `main`
- [ ] Variáveis de ambiente verificadas/configuradas
- [ ] Deploy realizado (automático ou manual)
- [ ] Funcionamento validado

---

## 🎯 RESULTADO ESPERADO

Após aplicar todas as correções:

- ✅ Versão v1.2.0 em produção
- ✅ URL do backend padronizada (`goldeouro-backend-v2.fly.dev`)
- ✅ Variáveis de ambiente configuradas
- ✅ Deploy usando branch `main` atualizado
- ✅ Painel admin funcionando corretamente

---

**Status:** ✅ **CORREÇÕES APLICADAS LOCALMENTE**

**Próxima Ação:** Aplicar correções no Vercel (Dashboard ou CLI)

