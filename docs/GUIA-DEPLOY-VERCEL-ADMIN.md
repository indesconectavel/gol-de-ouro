# 🚀 GUIA DE DEPLOY - ADMIN PANEL NO VERCEL
# Gol de Ouro Admin v1.2.0

**Data:** 17/11/2025  
**Status:** ✅ **PRONTO PARA DEPLOY**

---

## 📋 PRÉ-REQUISITOS

### ✅ Concluído
- [x] Build testado e validado (`npm run build`)
- [x] Código corrigido e compatível com backend
- [x] Arquivo `vercel.json` criado
- [x] Arquivo `.env.example` criado

### ⏭️ Pendente
- [ ] Conta Vercel configurada
- [ ] Repositório GitHub conectado
- [ ] Variáveis de ambiente configuradas

---

## 🔧 CONFIGURAÇÃO NO VERCEL

### Passo 1: Conectar Repositório

1. Acesse [vercel.com](https://vercel.com)
2. Faça login com GitHub
3. Clique em "Add New Project"
4. Selecione o repositório `goldeouro-backend`
5. Configure o projeto:
   - **Root Directory:** `goldeouro-admin`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

---

### Passo 2: Configurar Variáveis de Ambiente

No painel do Vercel, vá em **Settings → Environment Variables** e adicione:

#### Variáveis Obrigatórias:

**`VITE_ADMIN_TOKEN`**
- **Valor:** Mesmo valor de `ADMIN_TOKEN` do backend
- **Ambiente:** Production, Preview, Development
- **Exemplo:** `goldeouro123` (ou o valor real do backend)

**`VITE_API_URL`**
- **Valor:** `/api` (usa rewrite do Vercel)
- **Ambiente:** Production, Preview, Development
- **Nota:** O `vercel.json` já está configurado para fazer rewrite

---

### Passo 3: Configurar Build Settings

**Build Command:**
```bash
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```bash
npm install
```

**Framework Preset:**
```
Vite
```

---

### Passo 4: Deploy

1. Clique em **Deploy**
2. Aguarde o build completar
3. Verifique se não há erros
4. Acesse a URL gerada

---

## ✅ VALIDAÇÃO PÓS-DEPLOY

### Checklist de Validação:

1. [ ] Site acessível na URL do Vercel
2. [ ] Página de login carrega corretamente
3. [ ] Login funciona com senha válida
4. [ ] Dashboard carrega dados reais
5. [ ] Todas as páginas funcionam
6. [ ] Sem erros no console do navegador
7. [ ] Requisições ao backend funcionam
8. [ ] Performance adequada

---

## 🔍 TROUBLESHOOTING

### Erro: "Token inválido"
**Solução:** Verificar se `VITE_ADMIN_TOKEN` está configurado corretamente no Vercel

### Erro: "Failed to fetch"
**Solução:** Verificar se `VITE_API_URL` está configurado e se o rewrite está funcionando

### Erro: "Build failed"
**Solução:** Verificar logs do build no Vercel e corrigir erros

---

## 📝 CONFIGURAÇÃO DO REWRITE

O arquivo `vercel.json` já está configurado para fazer rewrite de `/api/*` para o backend:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://goldeouro-backend.fly.dev/api/$1"
    }
  ]
}
```

Isso permite que o frontend use `/api` como base URL e o Vercel redireciona para o backend real.

---

## 🎯 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

### Produção:
- `VITE_ADMIN_TOKEN` = valor do `ADMIN_TOKEN` do backend
- `VITE_API_URL` = `/api` (usa rewrite)

### Desenvolvimento (opcional):
- `VITE_ADMIN_TOKEN` = `goldeouro123` (dev)
- `VITE_API_URL` = `http://localhost:8080`

---

## ✅ STATUS

**Build:** ✅ **VALIDADO**  
**Configuração:** ✅ **PRONTA**  
**Deploy:** ⏭️ **AGUARDANDO CONFIGURAÇÃO NO VERCEL**

---

**Próxima Ação:** Configurar projeto no Vercel e realizar deploy

