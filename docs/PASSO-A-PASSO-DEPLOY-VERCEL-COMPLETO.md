# 🚀 PASSO A PASSO COMPLETO - DEPLOY NO VERCEL
# Gol de Ouro Admin v1.2.0

**Data:** 17/11/2025  
**Status:** ✅ **GUIA COMPLETO**

---

## 📋 PRÉ-REQUISITOS

### ✅ Concluído
- [x] Build testado localmente (`npm run build`)
- [x] Arquivo `vercel.json` criado e configurado
- [x] Código corrigido e compatível com backend
- [x] Repositório no GitHub atualizado

### ⏭️ Pendente
- [ ] Conta Vercel configurada
- [ ] Projeto conectado ao GitHub
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado

---

## 🔧 PASSO 1: ACESSAR VERCEL

1. **Acesse:** [vercel.com](https://vercel.com)
2. **Faça login** com sua conta GitHub
3. **Confirme** que você está na dashboard principal

---

## 🔧 PASSO 2: CRIAR NOVO PROJETO

1. **Clique em:** "Add New..." (botão no canto superior direito)
2. **Selecione:** "Project"
3. **Escolha o repositório:** `goldeouro-backend` (ou o nome do seu repositório)
4. **Clique em:** "Import"

---

## 🔧 PASSO 3: CONFIGURAR PROJETO

### 3.1 Configurações Básicas

**Root Directory:**
```
goldeouro-admin
```

**Framework Preset:**
```
Vite
```

**Build Command:**
```
npm run build
```
*(Já configurado no vercel.json)*

**Output Directory:**
```
dist
```
*(Já configurado no vercel.json)*

**Install Command:**
```
npm install
```

### 3.2 Configurações Avançadas (Opcional)

**Node.js Version:**
```
18.x ou 20.x
```

**Environment Variables:**
*(Será configurado no próximo passo)*

---

## 🔧 PASSO 4: CONFIGURAR VARIÁVEIS DE AMBIENTE

### 4.1 Acessar Configuração

1. **Antes de fazer deploy**, clique em **"Environment Variables"** ou
2. **Após criar o projeto**, vá em **Settings → Environment Variables**

### 4.2 Adicionar Variáveis

**Variável 1: `VITE_ADMIN_TOKEN`**
- **Key:** `VITE_ADMIN_TOKEN`
- **Value:** Mesmo valor de `ADMIN_TOKEN` do backend (ex: `goldeouro123`)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

**Variável 2: `VITE_API_URL`**
- **Key:** `VITE_API_URL`
- **Value:** `/api` (usa rewrite do vercel.json)
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

**Variável 3 (Opcional): `NODE_ENV`**
- **Key:** `NODE_ENV`
- **Value:** `production`
- **Environments:** ✅ Production

### 4.3 Salvar Variáveis

1. Clique em **"Add"** para cada variável
2. Confirme que todas foram adicionadas
3. Volte para a aba **"Deployments"**

---

## 🔧 PASSO 5: REALIZAR DEPLOY

### 5.1 Deploy Inicial

1. **Clique em:** "Deploy"
2. **Aguarde** o build completar (pode levar 1-3 minutos)
3. **Observe** os logs do build para verificar se há erros

### 5.2 Verificar Build

**Logs Esperados:**
```
✓ 2159 modules transformed.
dist/index.html                   0.80 kB │ gzip:   0.45 kB
dist/assets/index-dda00c1a.css   59.57 kB │ gzip:  11.04 kB
dist/assets/index-392bbfdc.js   450.32 kB │ gzip: 128.39 kB
✓ built in 38.02s
```

**Se houver erros:**
- Verifique os logs do build
- Confirme que as variáveis de ambiente estão configuradas
- Verifique se o `vercel.json` está correto

---

## 🔧 PASSO 6: CONFIGURAR DOMÍNIO (OPCIONAL)

### 6.1 Domínio Padrão

O Vercel fornece automaticamente um domínio:
```
goldeouro-admin-xxxxx.vercel.app
```

### 6.2 Domínio Customizado

1. **Vá em:** Settings → Domains
2. **Adicione:** Seu domínio customizado (ex: `admin.goldeouro.lol`)
3. **Configure DNS:** Siga as instruções do Vercel
4. **Aguarde:** Propagação DNS (pode levar até 24h)

---

## 🔧 PASSO 7: VALIDAR DEPLOY

### 7.1 Testes Básicos

1. **Acesse** a URL fornecida pelo Vercel
2. **Verifique** se a página carrega corretamente
3. **Teste** o login com senha válida
4. **Confirme** que o dashboard carrega dados reais

### 7.2 Testes de Funcionalidade

**Login:**
- [ ] Página de login carrega
- [ ] Login funciona com senha válida
- [ ] Redirecionamento para dashboard funciona

**Dashboard:**
- [ ] Dados reais carregam
- [ ] Cards exibem estatísticas
- [ ] Sem erros no console

**Navegação:**
- [ ] Todas as páginas funcionam
- [ ] Dados reais em todas as páginas
- [ ] Loading states funcionam
- [ ] Empty states funcionam

**API:**
- [ ] Requisições ao backend funcionam
- [ ] Autenticação funciona
- [ ] Erros são tratados corretamente

---

## 🔧 PASSO 8: CONFIGURAR DEPLOY AUTOMÁTICO (OPCIONAL)

### 8.1 Deploy Automático

O Vercel faz deploy automático quando:
- Push para branch `main` ou `master` → Deploy em produção
- Push para outras branches → Preview deployment

### 8.2 Configurar Branch de Produção

1. **Vá em:** Settings → Git
2. **Configure:** Production Branch (geralmente `main` ou `master`)
3. **Salve** as configurações

---

## 🔍 TROUBLESHOOTING

### Erro: "Build failed"

**Possíveis Causas:**
- Variáveis de ambiente não configuradas
- Erros de sintaxe no código
- Dependências faltando

**Solução:**
1. Verifique os logs do build
2. Teste build local: `npm run build`
3. Confirme variáveis de ambiente

---

### Erro: "Token inválido"

**Causa:** `VITE_ADMIN_TOKEN` não configurado ou incorreto

**Solução:**
1. Verifique se `VITE_ADMIN_TOKEN` está configurado
2. Confirme que o valor é o mesmo do backend
3. Faça novo deploy após corrigir

---

### Erro: "Failed to fetch"

**Causa:** `VITE_API_URL` não configurado ou rewrite não funcionando

**Solução:**
1. Verifique se `VITE_API_URL` está configurado como `/api`
2. Confirme que `vercel.json` tem rewrite configurado
3. Verifique se o backend está acessível

---

### Erro: "Module not found"

**Causa:** Dependências faltando

**Solução:**
1. Execute `npm install` localmente
2. Confirme que `package.json` está atualizado
3. Faça commit e push das mudanças

---

## ✅ CHECKLIST FINAL

### Antes do Deploy:
- [x] Build testado localmente
- [x] `vercel.json` criado
- [x] Código corrigido
- [ ] Variáveis de ambiente preparadas

### Durante o Deploy:
- [ ] Projeto criado no Vercel
- [ ] Root directory configurado (`goldeouro-admin`)
- [ ] Variáveis de ambiente adicionadas
- [ ] Deploy iniciado

### Após o Deploy:
- [ ] Build concluído sem erros
- [ ] Site acessível
- [ ] Login funciona
- [ ] Dashboard carrega dados
- [ ] Todas as páginas funcionam
- [ ] Sem erros no console

---

## 📝 RESUMO DAS CONFIGURAÇÕES

### Arquivo `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://goldeouro-backend.fly.dev/api/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### Variáveis de Ambiente:
- `VITE_ADMIN_TOKEN` = valor do `ADMIN_TOKEN` do backend
- `VITE_API_URL` = `/api`

---

## 🎯 CONCLUSÃO

Seguindo este guia passo a passo, você terá o painel administrativo deployado no Vercel e funcionando em produção.

**Status:** ✅ **GUIA COMPLETO**

**Próxima Ação:** Seguir os passos acima para realizar o deploy

