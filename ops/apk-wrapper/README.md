# 📱 APK WRAPPER - GOL DE OURO

**Data:** 2025-10-01  
**Versão:** v1.0.0  
**Tipo:** WebView Wrapper

---

## 🎯 **DESCRIÇÃO**

APK wrapper simples que carrega o Gol de Ouro PWA em um WebView nativo do Android.

---

## 🔧 **ARQUIVOS INCLUÍDOS**

- `AndroidManifest.xml` - Configuração do app
- `MainActivity.java` - Activity principal
- `activity_main.xml` - Layout da tela
- `strings.xml` - Strings do app
- `styles.xml` - Temas e cores
- `build.gradle` - Configuração de build

---

## 🚀 **COMO GERAR APK**

### **Pré-requisitos**
- Android Studio instalado
- Android SDK configurado
- Java 8+

### **Passo a Passo**
1. **Abrir Android Studio**
2. **Importar projeto** (pasta apk-wrapper)
3. **Sync Gradle** (Sync Now)
4. **Build** → "Build Bundle(s) / APK(s)" → "Build APK(s)"
5. **Aguardar** compilação
6. **APK gerado** em `app/build/outputs/apk/`

---

## 📱 **FUNCIONALIDADES**

### **WebView Configurado**
- ✅ JavaScript habilitado
- ✅ DOM Storage habilitado
- ✅ Zoom desabilitado
- ✅ Viewport otimizado
- ✅ Encoding UTF-8

### **Navegação**
- ✅ Botão voltar funciona
- ✅ URLs externas abrem no app
- ✅ Carregamento otimizado

### **Design**
- ✅ Tela cheia (sem ActionBar)
- ✅ Cores do Gol de Ouro
- ✅ Fundo escuro

---

## 🔗 **URL CONFIGURADA**

```
https://www.goldeouro.lol
```

**Para alterar:** Editar `MainActivity.java` linha:
```java
webView.loadUrl("https://www.goldeouro.lol");
```

---

## 📊 **ESPECIFICAÇÕES**

- **Package:** com.goldeouro.app
- **Min SDK:** 21 (Android 5.0)
- **Target SDK:** 34 (Android 14)
- **Tamanho:** ~5-10MB
- **Permissões:** Internet, Network State, Wake Lock

---

## ⚠️ **LIMITAÇÕES**

1. **Depende da internet** - Sem cache offline
2. **Performance** - Menor que PWA nativo
3. **Atualizações** - Requer nova versão APK
4. **Funcionalidades** - Limitadas ao WebView

---

## 🆚 **COMPARAÇÃO**

| Aspecto | APK Wrapper | PWA |
|---------|-------------|-----|
| **Instalação** | ✅ APK | ✅ Navegador |
| **Performance** | ⚠️ Média | ✅ Boa |
| **Atualizações** | ❌ Manual | ✅ Automática |
| **Tamanho** | ⚠️ 5-10MB | ✅ 0MB |
| **Offline** | ❌ Não | ✅ Sim |
| **Notificações** | ❌ Não | ✅ Sim |

---

## 🎯 **RECOMENDAÇÃO**

### **Para MVP:**
- ✅ **Usar PWA** - Melhor solução
- ✅ **Instalar via navegador** - Mais simples
- ✅ **Funcionalidades completas** - Todas disponíveis

### **Para APK:**
- ⚠️ **Só se necessário** - Para distribuição
- ⚠️ **Wrapper simples** - Funcionalidade básica
- ⚠️ **Manutenção manual** - Atualizações manuais

---

**Status:** ✅ **APK WRAPPER CRIADO**  
**Recomendação:** Usar PWA para melhor experiência
