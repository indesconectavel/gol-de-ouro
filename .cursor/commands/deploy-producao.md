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
- [ ] Na raiz do backend, deploy **com rastreabilidade** (`GIT_COMMIT` na imagem → `/meta`):
  - **Bash / Git Bash:** `fly deploy --remote-only --app goldeouro-backend-v2 --build-arg GIT_COMMIT="$(git rev-parse HEAD)"`
  - **PowerShell:** `$sha = git rev-parse HEAD; fly deploy --remote-only --app goldeouro-backend-v2 --build-arg GIT_COMMIT=$sha`
- [ ] Verificar health check: `https://goldeouro-backend-v2.fly.dev/health`
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
# Backend (obrigatório --build-arg para /meta.gitCommit — H2)
fly deploy --remote-only --app goldeouro-backend-v2 --build-arg GIT_COMMIT="$(git rev-parse HEAD)"
fly logs -a goldeouro-backend-v2

# Frontend
vercel --prod
vercel logs

# Verificação
curl -sS "https://goldeouro-backend-v2.fly.dev/health"
curl -sS "https://goldeouro-backend-v2.fly.dev/meta"
```

## Rollback (se necessário)
```bash
# Backend
fly releases
fly rollback [version]

# Frontend
vercel rollback [deployment-url]
```
