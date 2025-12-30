# ✅ CHECKLIST DE DEPLOY SEGURO — GOL DE OURO
## Sistema Gol de Ouro — Validação de Deploy em Produção

**Data:** 2025-01-24  
**Engenheiro:** Engenheiro Sênior Fullstack  
**Tipo:** Checklist Prático de Deploy  
**Objetivo:** Garantir deploy correto e validação em produção

---

## 📋 ANTES DO DEPLOY

### Verificações de Código

- [ ] **Build local executado sem erros**
  ```bash
  npm run build
  ```
  - Verificar: `dist/index.html` existe
  - Verificar: `dist/assets/index-*.js` existe
  - Verificar: `dist/sw.js` existe

- [ ] **Hash do arquivo JS mudou**
  - Comparar hash anterior vs novo
  - Exemplo: `index-DOXRH9LH.js` → `index-7gsw8ZC0.js`

- [ ] **Service Worker não cacheia APIs**
  - Verificar `dist/sw.js` contém `NetworkOnly` para APIs
  - Verificar `dist/sw.js` contém `NetworkOnly` para JS/CSS

- [ ] **Backend correto configurado**
  - Verificar `src/config/environments.js` → produção usa `goldeouro-backend-v2.fly.dev`
  - Verificar `src/services/apiClient.js` → força backend correto

- [ ] **Headers de cache configurados**
  - Verificar `vercel.json` → JS/CSS têm `no-cache`
  - Verificar `vercel.json` → SW tem `no-cache`

---

## 🚀 DURANTE O DEPLOY

### Comandos de Deploy

```bash
# 1. Build local (já feito)
npm run build

# 2. Deploy forçado na Vercel
npx vercel --prod --force

# 3. Aguardar conclusão
# Aguardar mensagem: "Completing" ou "Ready"
```

### Verificações Durante Deploy

- [ ] **Upload concluído**
  - Verificar: `Uploading [====================] (100%)`

- [ ] **Build na Vercel concluído**
  - Verificar: `Building` → `Completing` → `Ready`

- [ ] **URLs de deploy geradas**
  - Anotar: URL de preview
  - Anotar: URL de produção

---

## ✅ APÓS O DEPLOY

### Validação Imediata (0-5 minutos)

- [ ] **Aguardar propagação CDN**
  - Tempo: 5-10 minutos
  - CDN pode levar alguns minutos para atualizar

- [ ] **Limpar cache do navegador**
  - Chrome/Edge: Ctrl+Shift+Delete → Limpar dados de navegação
  - Ou: Modo anônimo/privado

- [ ] **Desregistrar Service Workers antigos**
  - DevTools → Application → Service Workers → Unregister
  - Ou executar no console:
    ```javascript
    navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
    ```

---

## 🔍 VALIDAÇÃO EM PRODUÇÃO

### 1. Verificar Arquivo JS Carregado

**Ação:** Abrir DevTools → Network → Recarregar página

**Verificar:**
- [ ] Arquivo JS tem hash novo (ex: `index-7gsw8ZC0.js`)
- [ ] NÃO é hash antigo (ex: `index-DOXRH9LH.js`)
- [ ] Arquivo JS carrega com status 200
- [ ] Não há erro 404 ou cache

**Como Verificar:**
```javascript
// No console do navegador
document.querySelectorAll('script[src*="index-"]').forEach(s => console.log(s.src));
```

**Esperado:**
```
https://www.goldeouro.lol/assets/index-7gsw8ZC0.js ✅
```

**❌ Se aparecer hash antigo:**
- Service Worker ainda está cacheando
- Executar desregistro de SW novamente
- Limpar cache completo

---

### 2. Verificar Backend Usado

**Ação:** Abrir DevTools → Console → Verificar logs de requisições

**Verificar:**
- [ ] `baseURL: "https://goldeouro-backend-v2.fly.dev"` ✅
- [ ] NÃO aparece `baseURL: "https://goldeouro-backend.fly.dev"` ❌
- [ ] Requisições API funcionam sem erro de CORS
- [ ] Login funciona corretamente

**Como Verificar:**
```javascript
// No console do navegador
// Verificar logs de API Request
// Deve mostrar: baseURL: "https://goldeouro-backend-v2.fly.dev"
```

**Esperado:**
```
🔍 API Request: {
  baseURL: "https://goldeouro-backend-v2.fly.dev", ✅
  url: "/api/auth/login",
  ...
}
```

**❌ Se aparecer backend antigo:**
- Cache de ambiente ainda ativo
- Limpar sessionStorage: `sessionStorage.clear()`
- Recarregar página

---

### 3. Verificar Service Worker

**Ação:** DevTools → Application → Service Workers

**Verificar:**
- [ ] Service Worker ativo tem scope `/`
- [ ] Service Worker não está em estado "redundant"
- [ ] Não há múltiplos Service Workers registrados
- [ ] Última atualização é recente (hoje)

**Como Verificar:**
```javascript
// No console do navegador
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => {
    console.log('SW:', reg.scope, 'State:', reg.active?.state);
  });
});
```

**Esperado:**
```
SW: https://www.goldeouro.lol/ State: activated ✅
```

**❌ Se aparecer múltiplos ou antigos:**
- Desregistrar todos manualmente
- Limpar caches
- Recarregar página

---

### 4. Verificar Cache de Arquivos

**Ação:** DevTools → Application → Cache Storage

**Verificar:**
- [ ] Não há caches com nomes antigos
- [ ] Caches existentes são do precache atual
- [ ] Não há cache de API (`api-cache` não deve existir ou estar vazio)

**Como Verificar:**
```javascript
// No console do navegador
caches.keys().then(names => {
  names.forEach(name => console.log('Cache:', name));
});
```

**Esperado:**
```
Cache: workbox-precache-v2-... ✅
Cache: images-cache ✅
```

**❌ Se aparecer caches antigos:**
- Limpar manualmente: `caches.delete('nome-do-cache')`
- Ou limpar todos: `caches.keys().then(names => names.forEach(n => caches.delete(n)))`

---

### 5. Verificar Funcionalidade Completa

**Ações Manuais:**

- [ ] **Login funciona**
  - Acessar `/login`
  - Fazer login com credenciais válidas
  - Verificar redirecionamento para `/dashboard`

- [ ] **Jogo funciona**
  - Acessar `/game`
  - Verificar tela original aparece (goleiro, bola, gol)
  - Verificar saldo real carrega
  - Testar chute e verificar resultado

- [ ] **Backend responde**
  - Verificar requisições no Network tab
  - Confirmar status 200 para APIs
  - Confirmar não há erros de CORS

---

## 🚨 IDENTIFICAÇÃO RÁPIDA DE PROBLEMAS

### Problema: Hash JS Antigo

**Sintoma:** Console mostra `index-DOXRH9LH.js` (ou outro hash antigo)

**Solução:**
1. Desregistrar Service Worker
2. Limpar todos os caches
3. Limpar sessionStorage: `sessionStorage.clear()`
4. Recarregar página em modo anônimo

---

### Problema: Backend Antigo

**Sintoma:** Console mostra `baseURL: "https://goldeouro-backend.fly.dev"`

**Solução:**
1. Limpar sessionStorage: `sessionStorage.clear()`
2. Limpar localStorage: `localStorage.clear()`
3. Recarregar página
4. Verificar `environments.js` está correto

---

### Problema: Service Worker Não Atualiza

**Sintoma:** Service Worker continua antigo mesmo após deploy

**Solução:**
1. Desregistrar manualmente via DevTools
2. Limpar todos os caches
3. Fechar todas as abas do site
4. Reabrir em modo anônimo
5. Verificar se novo SW registra

---

### Problema: Arquivo de Mídia Retorna HTML

**Sintoma:** Erro "Content-Type text/html não suportado" para arquivos de áudio

**Solução:**
1. Verificar Service Worker não está interceptando incorretamente
2. Verificar `vercel.json` tem headers corretos para `/sounds/`
3. Verificar arquivo existe em `dist/sounds/`

---

## 📊 CHECKLIST RESUMIDO

### Pré-Deploy
- [ ] Build local sem erros
- [ ] Hash JS mudou
- [ ] SW não cacheia APIs
- [ ] Backend correto configurado

### Deploy
- [ ] Upload concluído
- [ ] Build Vercel concluído
- [ ] URLs geradas

### Pós-Deploy (5-10 min)
- [ ] Aguardar propagação CDN
- [ ] Limpar cache navegador
- [ ] Desregistrar SW antigos

### Validação
- [ ] Hash JS novo carregado
- [ ] Backend correto usado
- [ ] SW atualizado
- [ ] Caches limpos
- [ ] Funcionalidade completa

---

## 🎯 VALIDAÇÃO FINAL

### Comandos Rápidos no Console

```javascript
// 1. Verificar hash do JS carregado
document.querySelectorAll('script[src*="index-"]').forEach(s => console.log('JS:', s.src));

// 2. Verificar Service Workers
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => console.log('SW:', reg.scope, reg.active?.state)));

// 3. Verificar caches
caches.keys().then(names => names.forEach(n => console.log('Cache:', n)));

// 4. Limpar tudo (se necessário)
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
caches.keys().then(names => names.forEach(n => caches.delete(n)));
sessionStorage.clear();
localStorage.clear();
location.reload(true);
```

---

## ✅ CRITÉRIO DE SUCESSO

**Deploy considerado bem-sucedido quando:**

1. ✅ Hash JS novo carregado (`index-7gsw8ZC0.js` ou similar)
2. ✅ Backend correto usado (`goldeouro-backend-v2.fly.dev`)
3. ✅ Service Worker atualizado
4. ✅ Nenhum cache antigo interferindo
5. ✅ Funcionalidade completa testada
6. ✅ Nenhum erro no console

---

**FIM DO CHECKLIST**

