# 🚀 INSTRUÇÕES - BUILD APK VIA DASHBOARD EXPO

**Data:** 2025-12-14  
**Método:** Dashboard do Expo (mais confiável)

---

## 📋 PASSO A PASSO

### 1. Acessar Dashboard do Expo

1. Abra: https://expo.dev/accounts/indesconectavel/projects/gol-de-ouro-mobile/builds
2. Faça login se necessário (indesconectavel@gmail.com)

### 2. Criar Novo Build

1. Clique no botão **"Create a build"** ou **"New build"**
2. Selecione as opções:
   - **Platform:** Android
   - **Profile:** production
   - **Build type:** APK (não AAB)
3. Clique em **"Build"** ou **"Start build"**

### 3. Aguardar Build

- O build levará aproximadamente **15-30 minutos**
- Você pode acompanhar o progresso na página
- Será notificado quando concluir

### 4. Baixar APK

1. Quando o build completar, clique no build
2. Clique em **"Download"** para baixar o APK
3. Salve o APK em local seguro

### 5. Registrar Informações

Após baixar, registrar em `automation/APK-GERADO.md`:
- Build ID
- Link de download
- Hash SHA-256 (se disponível)
- Tamanho do arquivo
- Data/hora de geração

---

## ✅ CONFIGURAÇÃO VALIDADA

O projeto já está configurado corretamente:
- ✅ Package: `com.goldeouro.app`
- ✅ Version Code: `2`
- ✅ Version: `2.0.0`
- ✅ API URL: `https://goldeouro-backend-v2.fly.dev`
- ✅ Profile production configurado

---

## 🎯 VANTAGENS DO DASHBOARD

- ✅ Não depende de configuração local
- ✅ Mais confiável
- ✅ Interface visual
- ✅ Histórico de builds
- ✅ Notificações automáticas

---

## 📝 PRÓXIMOS PASSOS APÓS BUILD

1. Baixar APK
2. Instalar no dispositivo Android
3. Executar testes reais (ver `automation/RELATORIO-FINAL-APK-REAL.md`)
4. Preencher relatório final

---

**Última atualização:** 2025-12-14

