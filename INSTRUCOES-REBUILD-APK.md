# 🚀 INSTRUÇÕES PARA REBUILD APK
## Gol de Ouro Mobile - Após Correção do Bootstrap

**Data:** 2025-01-24  
**Status:** ✅ CORREÇÕES APLICADAS | ⏳ AGUARDANDO REBUILD

---

## ✅ VALIDAÇÕES CONCLUÍDAS

- [x] `index.js` criado e correto
- [x] `package.json` → `"main": "index.js"`
- [x] Plugin `expo-router` removido do `app.json`
- [x] Dependências reinstaladas
- [x] Cache limpo

---

## 🔨 REBUILD APK

### Opção 1: Build de Produção (Recomendado)

```bash
cd goldeouro-mobile
eas build --platform android --profile production
```

**Duração:** ~15-30 minutos  
**Resultado:** APK de produção pronto para distribuição

### Opção 2: Build Preview (Teste Rápido)

```bash
cd goldeouro-mobile
eas build --platform android --profile preview
```

**Duração:** ~10-20 minutos  
**Resultado:** APK de preview para testes rápidos

---

## 📱 INSTALAÇÃO E TESTE

### 1. Baixar APK

Após o build concluir, você receberá um link para download do APK:
- Link direto no terminal
- Ou acesse: https://expo.dev/accounts/indesconectavel/projects/gol-de-ouro-mobile/builds

### 2. Instalar no Dispositivo

1. Transferir APK para o dispositivo Android
2. Ativar "Fontes desconhecidas" nas configurações de segurança
3. Abrir o arquivo APK e instalar

### 3. Testar

1. Abrir o app
2. **Verificar:** Não deve mais aparecer erro "main has not been registered"
3. App deve abrir normalmente
4. Fazer login e testar funcionalidades básicas

---

## ✅ CHECKLIST PÓS-INSTALAÇÃO

- [ ] App abre sem erros
- [ ] Tela inicial carrega corretamente
- [ ] Login funciona
- [ ] Navegação entre telas funciona
- [ ] Nenhum erro de "main has not been registered"

---

## 🐛 SE AINDA HOUVER PROBLEMAS

### Erro Persiste

Se o erro "main has not been registered" ainda aparecer:

1. **Verificar que index.js foi incluído no build:**
   ```bash
   # Verificar logs do build
   eas build:list --platform android --limit 1
   ```

2. **Verificar conteúdo do index.js no build:**
   - O arquivo deve estar na raiz do projeto
   - Deve conter `registerRootComponent(App)`

3. **Limpar cache do EAS:**
   ```bash
   eas build --platform android --profile production --clear-cache
   ```

### Outros Erros

Se aparecerem outros erros:
- Documentar erro exato
- Verificar logs do build
- Verificar logs do dispositivo (via `adb logcat`)

---

## 📊 RESULTADO ESPERADO

Após rebuild e instalação:

✅ App abre corretamente  
✅ Componente registrado corretamente  
✅ Nenhum erro de bootstrap  
✅ Pronto para continuar Fase 4 - Validação Técnica

---

**Próximo passo:** Executar `eas build --platform android --profile production`

