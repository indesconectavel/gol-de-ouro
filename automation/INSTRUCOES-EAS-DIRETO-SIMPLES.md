# 🚀 INSTRUÇÕES SIMPLES - BUILD DIRETO VIA EAS

**Data:** 2025-12-14  
**Objetivo:** Gerar APK sem GitHub Actions

---

## ✅ SOLUÇÃO MAIS SIMPLES

**Sim, podemos fazer sem GitHub!** Vamos usar o EAS Build diretamente.

---

## 🎯 O QUE VOCÊ PRECISA FAZER (2 PASSOS)

### PASSO 1: Inicializar Projeto EAS (1 vez só)

**Execute este comando no terminal:**

```powershell
cd goldeouro-mobile
npx eas init
```

**Quando perguntar:**
- **"Would you like to create a new project?"** → Digite `y` e pressione Enter
- **Ou se já existir:** Deixe criar um novo

**Isso vai criar o projeto EAS automaticamente.**

---

### PASSO 2: Executar Build

**Depois de inicializar, execute:**

```powershell
npx eas build --platform android --profile production
```

**Isso vai:**
1. Submeter o build para servidores na nuvem
2. Compilar o APK automaticamente
3. Gerar um link para download

---

## ⏱️ TEMPO TOTAL

- **Inicialização:** 1 minuto (só primeira vez)
- **Build:** 15-30 minutos
- **Total:** ~20-35 minutos

---

## ✅ APÓS BUILD COMPLETAR

### Opção 1: Link no Terminal

O terminal mostrará um link quando completar.

### Opção 2: Dashboard Expo

1. **Acesse:** https://expo.dev/accounts/indesconectavel/projects/gol-de-ouro-mobile/builds
2. **Procure pelo build mais recente**
3. **Baixe o APK**

---

## 📋 RESUMO ULTRA SIMPLES

1. **Execute:** `cd goldeouro-mobile`
2. **Execute:** `npx eas init` (só primeira vez)
3. **Execute:** `npx eas build --platform android --profile production`
4. **Aguarde:** 15-30 minutos
5. **Baixe:** APK do link ou dashboard

---

## ✅ VANTAGENS

- ✅ **Muito mais simples** que GitHub Actions
- ✅ **Não precisa fazer merge**
- ✅ **Não precisa aprovar PR**
- ✅ **Funciona direto do terminal**
- ✅ **Mais rápido**

---

**Status:** ✅ Solução mais simples disponível

**Ação:** Executar `npx eas init` primeiro

---

**Última atualização:** 2025-12-14

