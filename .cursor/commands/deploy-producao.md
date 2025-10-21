# 🚀 Deploy para Produção - Gol de Ouro

## Objetivo
Realizar deploy completo e seguro do projeto Gol de Ouro para produção.

## Checklist de Deploy

### 1. Pré-Deploy
- [ ] Verificar se todos os testes passam
- [ ] Fazer backup completo do sistema
- [ ] Verificar variáveis de ambiente
- [ ] Validar configurações de segurança

### 2. Deploy Backend (Fly.io)
- [ ] Executar `fly deploy` no backend
- [ ] Verificar health check: `https://goldeouro-backend.fly.dev/health`
- [ ] Testar endpoints críticos
- [ ] Verificar logs de deploy

### 3. Deploy Frontend (Vercel)
- [ ] Executar `vercel --prod` no frontend
- [ ] Verificar build sem erros
- [ ] Testar responsividade
- [ ] Validar PWA

### 4. Verificações Pós-Deploy
- [ ] Testar cadastro de usuário
- [ ] Testar login/logout
- [ ] Testar PIX (depósito/saque)
- [ ] Testar jogo completo
- [ ] Verificar logs de erro

### 5. Monitoramento
- [ ] Ativar keep-alive scripts
- [ ] Verificar métricas de performance
- [ ] Configurar alertas
- [ ] Documentar mudanças

## Comandos Úteis
```bash
# Backend
fly deploy
fly logs

# Frontend
vercel --prod
vercel logs

# Verificação
curl https://goldeouro-backend.fly.dev/health
```

## Rollback (se necessário)
```bash
# Backend
fly releases
fly rollback [version]

# Frontend
vercel rollback [deployment-url]
```
