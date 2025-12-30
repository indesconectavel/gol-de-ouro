# 🔍 AUDITORIA PROFUNDA DE DOMÍNIO E VERCEL
## Infraestrutura — Gol de Ouro

**Data:** 2025-01-24  
**Engenheiro:** Engenheiro Sênior de Plataforma  
**Tipo:** Auditoria de Infraestrutura  

---

## 📋 PROJETO VERCEL IDENTIFICADO

### Configuração do Projeto

**Nome:** `goldeouro-player`  
**Project ID:** `prj_lNa2Uj0jf4anaKpO4IXVWkKumn8v`  
**Team ID:** `team_7BSTR9XAt3OFEIUUMqSpIbdw`  
**Criado em:** 2025-01-24 (timestamp: 1756855749554)  

**Configurações:**
- Framework: null (detectado como Vite via código)
- Node Version: `22.x`
- Build Command: null (padrão Vite)
- Output Directory: null (padrão `dist`)
- Root Directory: null (raiz do projeto)

---

## 🌐 DOMÍNIO VINCULADO

### Configuração de Domínio

**Domínio Principal:** `www.goldeouro.lol`  
**Projeto Vinculado:** `goldeouro-player` (ID: `prj_lNa2Uj0jf4anaKpO4IXVWkKumn8v`)  

**Status:**
- ✅ Domínio está vinculado ao projeto correto
- ✅ Configuração DNS parece correta
- ⚠️ Não foi possível verificar `goldeouro.lol` (sem www) separadamente

---

## 📦 DEPLOYS E BUNDLES

### Bundle Local (Último Build)

**Hash:** `index-B74THvjy.js`  
**Data:** 2025-01-24 08:32:31  
**Localização:** `dist/assets/index-B74THvjy.js`  

**Conteúdo:**
- ✅ Contém `kill-old-sw.js` (referenciado em `index.html`)
- ✅ Contém `bootstrap.ts` (importado em `main.jsx`)
- ✅ Contém logs `[BOOTSTRAP]` e `[KILL-SW]`
- ✅ Usa `Game.jsx` (tela correta)
- ✅ Backend: `goldeouro-backend-v2.fly.dev`

### Bundle em Produção

**Hash:** `index-DOXRH9LH.js`  
**Status:** ❌ ANTIGO  

**Conteúdo:**
- ❌ Não contém `kill-old-sw.js`
- ❌ Não contém `bootstrap.ts`
- ❌ Não contém logs `[BOOTSTRAP]` ou `[KILL-SW]`
- ❌ Usa `GameShoot.jsx` (tela antiga)
- ❌ Backend: `goldeouro-backend.fly.dev` (antigo)

---

## 🔍 ANÁLISE DE CAUSA RAIZ

### Problema Identificado

**Ciclo Vicioso:**
1. Service Worker antigo está ativo
2. Service Worker antigo serve bundle antigo do precache
3. Bundle antigo não contém kill switch nem bootstrap
4. Kill switch nunca executa porque não está no bundle antigo
5. Bundle novo nunca carrega porque SW antigo intercepta

**Evidências:**
- Console mostra: `index-DOXRH9LH.js:72` (bundle antigo)
- Network mostra: `workbox-6e5f094d.js` (SW antigo)
- Não há logs de `[KILL-SW]` ou `[BOOTSTRAP]`
- Requisições vão para backend antigo

---

## ✅ CONCLUSÃO

**Status:** ✅ **DOMÍNIO APONTA PARA PROJETO CORRETO**

**Problema:** ❌ **BUNDLE ANTIGO EM CACHE DO SERVICE WORKER**

**Causa Raiz:** Service Worker antigo criou ciclo vicioso impedindo bundle novo de carregar.

---

**FIM DA AUDITORIA DE INFRAESTRUTURA**

