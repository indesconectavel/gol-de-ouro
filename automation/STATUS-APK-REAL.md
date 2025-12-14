# 📱 STATUS APK REAL - Gol de Ouro Mobile

**Data:** 2025-12-14  
**Objetivo:** Validação pós-build (quando APK for gerado)

---

## ⏳ AGUARDANDO APK

O APK ainda não foi gerado. Este documento será atualizado após:
1. Build via GitHub Actions ser executado
2. APK ser baixado
3. Testes serem realizados

---

## 📋 CHECKLIST DE VALIDAÇÃO (PÓS-BUILD)

### Instalação

- [ ] APK instala em dispositivo Android físico
- [ ] Permissões solicitadas corretamente
- [ ] App abre sem crashes

### Autenticação

- [ ] Login com `free10signer@gmail.com` funciona
- [ ] Senha `Free10signer` aceita
- [ ] Token JWT armazenado corretamente

### PIX Real

- [ ] Tela de criar PIX acessível
- [ ] Valor mínimo aceito (R$ 1,00)
- [ ] QR Code gerado corretamente
- [ ] Webhook recebido no backend
- [ ] Saldo creditado automaticamente
- [ ] Transação registrada no banco

### Jogo (LOTES)

- [ ] Lista de lotes disponíveis carrega
- [ ] Entrar em lote funciona
- [ ] Criar novo lote funciona
- [ ] Executar chute funciona
- [ ] Validação de chute funciona
- [ ] Premiação processada corretamente
- [ ] Saldo atualizado após premiação

### WebSocket

- [ ] Conexão WebSocket estabelecida
- [ ] Atualizações em tempo real funcionam
- [ ] Notificações recebidas

### Performance

- [ ] App responsivo
- [ ] Sem travamentos
- [ ] Navegação fluida

---

## ⚠️ OBSERVAÇÕES

- **NÃO publicar** em loja ainda
- Validar todos os fluxos antes
- Testar com valores reais pequenos (R$ 1,00)

---

**Status:** ⏳ Aguardando geração do APK

