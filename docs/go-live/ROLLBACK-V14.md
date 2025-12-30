# 🔄 ROLLBACK V14

## Instruções de Rollback

### Backend (Fly.io):
```bash
flyctl releases --app goldeouro-backend-v2
flyctl releases rollback <version-id> --app goldeouro-backend-v2
```

### Frontend (Vercel):
```bash
vercel rollback <deployment-id>
```

### Banco de Dados:
- Restaurar backup mais recente
- Verificar integridade dos dados
