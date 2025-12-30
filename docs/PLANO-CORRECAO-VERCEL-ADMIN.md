# 🛠️ PLANO DE CORREÇÃO VERCEL - goldeouro-admin
# Data: 17/11/2025

**Status:** ⚠️ **AÇÃO NECESSÁRIA**

---

## 🎯 OBJETIVO

Atualizar o projeto `goldeouro-admin` no Vercel para usar a versão corrigida (v1.2.0) com todas as melhorias implementadas.

---

## ⚠️ PROBLEMA IDENTIFICADO

### Situação Atual:
- **Branch em Produção:** `painel-protegido-v1.1.0` (Nov 8, 2025)
- **Versão:** v1.1.0
- **Commit:** `f24cf69 CORRECOES CRITICAS: CSP, eval(), modulos, PWA`

### Situação Desejada:
- **Branch em Produção:** `main` (atualizado)
- **Versão:** v1.2.0
- **Commit:** Últimas correções (Nov 17, 2025)

### Impacto:
- 🔴 **CRÍTICO** - Painel admin não tem as correções recentes:
  - Interceptors axios não implementados
  - Endpoints podem estar incorretos
  - Autenticação pode estar desatualizada
  - Dados podem não estar sendo carregados corretamente

---

## 📋 PLANO DE AÇÃO

### PASSO 1: Verificar Estado do Repositório

```bash
cd goldeouro-admin
git status
git branch -a
git log --oneline -10
```

**Objetivo:** Confirmar que as correções estão no branch `main`

---

### PASSO 2: Fazer Merge das Correções (se necessário)

Se as correções estão em outro branch:

```bash
# Verificar branch atual
git checkout main

# Fazer merge do branch de correções
git merge painel-protegido-v1.1.0

# Ou criar novo branch a partir de main com correções
git checkout -b admin-v1.2.0
git merge <branch-com-correcoes>
```

**Objetivo:** Garantir que `main` tem todas as correções

---

### PASSO 3: Verificar Arquivos Críticos

Confirmar que os seguintes arquivos estão atualizados:

- ✅ `src/services/api.js` - Interceptors implementados
- ✅ `src/services/dataService.js` - Migrado para axios
- ✅ `src/config/env.js` - Token admin fixo
- ✅ `src/pages/Login.jsx` - Autenticação corrigida
- ✅ `src/components/MainLayout.jsx` - Auth unificado
- ✅ `vercel.json` - Configuração correta

---

### PASSO 4: Atualizar Branch de Produção no Vercel

1. **Acessar Vercel Dashboard:**
   - Ir para: `https://vercel.com/goldeouro-admins-projects/goldeouro-admin`
   - Clicar em **Settings**

2. **Configurar Branch de Produção:**
   - Ir em **Git**
   - **Production Branch:** Selecionar `main`
   - Salvar

**Objetivo:** Vercel vai fazer deploy automático do branch `main`

---

### PASSO 5: Verificar Variáveis de Ambiente

1. **Acessar:** Settings → Environment Variables

2. **Verificar/Criar:**
   - `VITE_ADMIN_TOKEN` = valor do `ADMIN_TOKEN` do backend
   - `VITE_API_URL` = `/api` (usa rewrite do vercel.json)

3. **Aplicar em:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development

**Objetivo:** Garantir que variáveis estão configuradas

---

### PASSO 6: Fazer Deploy Manual (Opcional)

Se o deploy automático não funcionar:

```bash
cd goldeouro-admin
npm run build
npx vercel --prod
```

**Objetivo:** Forçar deploy da versão atualizada

---

### PASSO 7: Validar Deploy

1. **Acessar:** `https://admin.goldeouro.lol`
2. **Testar Login:** Verificar se funciona
3. **Testar Dashboard:** Verificar se carrega dados reais
4. **Testar Navegação:** Verificar todas as páginas
5. **Verificar Console:** Sem erros

**Objetivo:** Confirmar que tudo funciona corretamente

---

## ✅ CHECKLIST DE VALIDAÇÃO

### Antes do Deploy:
- [ ] Correções estão no branch `main`
- [ ] Arquivos críticos atualizados
- [ ] `vercel.json` está correto
- [ ] Build local funciona (`npm run build`)

### Durante o Deploy:
- [ ] Branch de produção atualizado para `main`
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy iniciado

### Após o Deploy:
- [ ] Build concluído sem erros
- [ ] Site acessível
- [ ] Login funciona
- [ ] Dashboard carrega dados reais
- [ ] Todas as páginas funcionam
- [ ] Sem erros no console

---

## 🔍 VERIFICAÇÕES ADICIONAIS

### 1. Verificar Build Logs

No Vercel Dashboard → Deployments → Build Logs:
- ✅ Build deve completar sem erros
- ✅ Bundle deve ser gerado corretamente
- ✅ Assets devem ser copiados

### 2. Verificar Runtime Logs

No Vercel Dashboard → Deployments → Runtime Logs:
- ✅ Sem erros de runtime
- ✅ Requisições ao backend funcionam
- ✅ Autenticação funciona

### 3. Verificar Domínios

No Vercel Dashboard → Settings → Domains:
- ✅ `admin.goldeouro.lol` está configurado
- ✅ SSL está ativo
- ✅ Redirecionamentos funcionam

---

## 🎯 RESULTADO ESPERADO

Após seguir este plano:

- ✅ Deploy usando branch `main` atualizado
- ✅ Versão v1.2.0 em produção
- ✅ Todas as correções aplicadas
- ✅ Variáveis de ambiente configuradas
- ✅ Painel admin funcionando corretamente

---

## 📝 NOTAS IMPORTANTES

### Sobre o Branch `painel-protegido-v1.1.0`:
- Este branch foi criado em Nov 8 com correções críticas
- As correções da FASE 3 (Nov 17) não estão neste branch
- É necessário fazer merge ou atualizar para `main`

### Sobre Variáveis de Ambiente:
- `VITE_ADMIN_TOKEN` é obrigatório
- `VITE_API_URL` pode ser `/api` (usa rewrite) ou URL completa
- Sem essas variáveis, o admin não funcionará

### Sobre o Rewrite:
- O `vercel.json` já está configurado para fazer rewrite de `/api/*` para o backend
- Isso permite usar `/api` como base URL
- Backend real: `https://goldeouro-backend.fly.dev`

---

**Status:** ⚠️ **AÇÃO NECESSÁRIA**

**Próxima Ação:** Seguir os passos acima para atualizar o deploy

