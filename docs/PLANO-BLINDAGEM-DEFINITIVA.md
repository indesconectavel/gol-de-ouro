# 🔒 PLANO DE BLINDAGEM DEFINITIVA
## Prevenção de Cache Fantasma — Gol de Ouro

**Data:** 2025-01-24  
**Engenheiro:** Engenheiro Sênior de Plataforma  
**Tipo:** Blindagem Arquitetural  

---

## 🎯 OBJETIVO

Garantir que problemas de cache não voltem a acontecer em deploys futuros.

---

## 🔒 ESTRATÉGIAS DE BLINDAGEM

### 1. Kill Switch Inline no HTML

**Implementação:**
- ✅ Kill switch inline no `<head>` do HTML
- ✅ Não pode ser interceptado pelo Service Worker
- ✅ Executa antes de qualquer código JavaScript

**Garantia:**
- Kill switch sempre executa, mesmo com SW antigo ativo

---

### 2. Versionamento Explícito de Service Worker

**Implementação:**
- ✅ Cache ID explícito: `goldeouro-sw-v2`
- ✅ Manifest version: `2.0.0`
- ✅ Workbox hash versionado

**Garantia:**
- Browser detecta SW novo e substitui antigo automaticamente

---

### 3. Regras NetworkOnly para Assets Críticos

**Implementação:**
- ✅ APIs: `NetworkOnly` (nunca cachear)
- ✅ JS/CSS: `NetworkOnly` (nunca cachear)
- ✅ Imagens: `NetworkFirst` (TTL curto)
- ✅ Mídia: `NetworkFirst` (TTL curto)

**Garantia:**
- Assets críticos sempre vêm da rede
- Não há cache de bundle antigo

---

### 4. Headers HTTP Anti-Cache Absolutos

**Implementação:**
- ✅ `Cache-Control: no-cache, no-store, must-revalidate`
- ✅ `Pragma: no-cache`
- ✅ `Expires: 0`
- ✅ Header customizado: `X-SW-Version: v2`

**Garantia:**
- CDN não cacheia HTML
- Browser sempre busca versão nova

---

### 5. Cache Busting no HTML

**Implementação:**
- ✅ Meta tag `cache-bust` com timestamp
- ✅ Query string versionada em deploys críticos

**Garantia:**
- HTML sempre tem versão identificável
- Fácil detectar se HTML antigo está sendo servido

---

## 📋 CHECKLIST OBRIGATÓRIO DE DEPLOY

### Pré-Deploy

- [ ] Build local executado com sucesso
- [ ] Bundle novo gerado (hash diferente)
- [ ] Kill switch inline presente no HTML
- [ ] Bootstrap presente no código
- [ ] Service Worker novo gerado
- [ ] Headers HTTP configurados

### Pós-Deploy

- [ ] Deploy completado na Vercel
- [ ] Aguardar propagação CDN (5-10 min)
- [ ] Acessar produção e verificar console
- [ ] Confirmar logs `[KILL-SW-INLINE]`
- [ ] Confirmar logs `[BOOTSTRAP]`
- [ ] Verificar bundle hash correto
- [ ] Verificar backend correto
- [ ] Validar tela correta visualmente

### Validação Visual

- [ ] Tela do jogo renderiza corretamente
- [ ] Goleiro animado visível
- [ ] Bola visível
- [ ] Gol visível
- [ ] Campo completo visível
- [ ] Nenhum elemento da tela antiga presente

---

## 🚨 REGRA DE OURO

**Nenhum deploy sem validação visual em produção.**

---

## ✅ CONCLUSÃO

**Status:** ✅ **BLINDAGEM DEFINITIVA IMPLEMENTADA**

**Garantias:**
- ✅ Kill switch sempre executa
- ✅ Service Worker antigo é removido automaticamente
- ✅ Bundle novo sempre carrega
- ✅ Backend correto sempre usado
- ✅ Cache não pode interferir em deploys futuros

---

**FIM DO PLANO DE BLINDAGEM**

