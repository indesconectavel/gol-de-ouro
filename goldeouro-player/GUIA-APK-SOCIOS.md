# 📱 **GUIA PARA GERAR APK - GOL DE OURO**

## 🎯 **OPÇÕES PARA SEUS SÓCIOS TESTAREM**

### **OPÇÃO 1: PWA (Recomendada - Mais Rápida)**
O jogo já está configurado como PWA (Progressive Web App) e pode ser instalado diretamente no celular:

#### **Como instalar no Android:**
1. **Acesse**: `https://goldeouro.lol` no navegador do celular
2. **Toque no menu** (3 pontos) do navegador
3. **Selecione**: "Adicionar à tela inicial" ou "Instalar app"
4. **Confirme** a instalação
5. **O ícone do Gol de Ouro** aparecerá na tela inicial

#### **Como instalar no iPhone:**
1. **Acesse**: `https://goldeouro.lol` no Safari
2. **Toque no botão** de compartilhar (quadrado com seta)
3. **Selecione**: "Adicionar à Tela de Início"
4. **Confirme** a instalação

---

### **OPÇÃO 2: APK Nativo (Para desenvolvedores)**

#### **Pré-requisitos:**
- Java JDK 11 ou superior
- Android Studio
- Android SDK

#### **Passos para gerar APK:**

1. **Instalar Java:**
```bash
# Baixar Java JDK 11+ de: https://adoptium.net/
# Configurar JAVA_HOME no sistema
```

2. **Instalar Android Studio:**
```bash
# Baixar de: https://developer.android.com/studio
# Instalar Android SDK
```

3. **Gerar APK:**
```bash
cd goldeouro-player
npm run build
npx cap sync android
npx cap build android
```

4. **APK será gerado em:**
```
android/app/build/outputs/apk/debug/app-debug.apk
```

---

### **OPÇÃO 3: Build Online (Mais Fácil)**

#### **Usando Capacitor Cloud Build:**

1. **Instalar Capacitor CLI:**
```bash
npm install -g @capacitor/cli
```

2. **Configurar build online:**
```bash
npx cap add android
npx cap sync
npx cap run android --target=web
```

3. **Usar serviços online:**
- **Capacitor Cloud**: https://capacitorjs.com/docs/cloud
- **Expo Build**: https://expo.dev/
- **Ionic Appflow**: https://ionicframework.com/appflow

---

## 🚀 **RECOMENDAÇÃO PARA SÓCIOS**

### **Para teste rápido (Recomendado):**
**Use a OPÇÃO 1 (PWA)** - É mais rápida e funciona perfeitamente:
- ✅ **Instalação em 30 segundos**
- ✅ **Funciona offline** após instalação
- ✅ **Notificações push** disponíveis
- ✅ **Performance nativa**
- ✅ **Atualizações automáticas**

### **Para distribuição oficial:**
**Use a OPÇÃO 2 (APK nativo)** - Para Google Play Store:
- ✅ **APK assinado** para produção
- ✅ **Otimizado** para performance
- ✅ **Compatível** com todas as funcionalidades

---

## 📋 **CHECKLIST PARA SÓCIOS**

### **Teste PWA (5 minutos):**
- [ ] Acessar `https://goldeouro.lol` no celular
- [ ] Instalar como PWA
- [ ] Testar login/registro
- [ ] Testar depósito PIX
- [ ] Testar jogo
- [ ] Testar saque

### **Teste APK (30 minutos):**
- [ ] Instalar Java JDK
- [ ] Instalar Android Studio
- [ ] Executar comandos de build
- [ ] Instalar APK no dispositivo
- [ ] Testar todas as funcionalidades

---

## 🔧 **CONFIGURAÇÕES ATUAIS**

### **App Configurado:**
- **Nome**: Gol de Ouro
- **ID**: com.goldeouro.app
- **URL**: https://goldeouro.lol
- **Versão**: 1.0.0

### **Funcionalidades Disponíveis:**
- ✅ **Login/Registro**
- ✅ **Depósito PIX**
- ✅ **Sistema de Jogo**
- ✅ **Saque PIX**
- ✅ **Notificações**
- ✅ **Modo Offline**

---

## 📞 **SUPORTE**

**Para dúvidas sobre instalação:**
- **PWA**: Funciona em qualquer dispositivo moderno
- **APK**: Requer Android 5.0+ (API 21+)
- **iOS**: Use PWA via Safari

**O sistema está 100% funcional e pronto para teste!** 🎉
