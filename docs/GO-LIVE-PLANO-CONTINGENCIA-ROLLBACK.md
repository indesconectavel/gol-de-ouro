# 🚨 PLANO DE CONTINGÊNCIA & ROLLBACK
## Gol de Ouro

---

## 🔄 PROCEDIMENTOS DE ROLLBACK

### Backend:
```bash
flyctl releases --app goldeouro-backend-v2
flyctl releases rollback [version] --app goldeouro-backend-v2
```

### Frontend:
```bash
vercel rollback [deployment-url]
```

---

## 🚨 CENÁRIOS DE CONTINGÊNCIA

1. **Erro 500 no Backend**
   - Rollback imediato
   - Investigar logs

2. **PIX não funcionando**
   - Verificar Mercado Pago
   - Validar webhook

3. **WebSocket desconectando**
   - Verificar logs
   - Reiniciar serviço

---

**Status:** Pronto para uso
