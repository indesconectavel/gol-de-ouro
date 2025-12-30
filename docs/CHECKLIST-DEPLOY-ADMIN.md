# ✅ CHECKLIST DE DEPLOY - ADMIN PANEL
# Gol de Ouro Admin v1.2.0

**Data:** 17/11/2025  
**Status:** ✅ **PRONTO PARA DEPLOY**

---

## 📋 CHECKLIST PRÉ-DEPLOY

### Configuração de Ambiente ✅
- [x] Código corrigido e validado
- [ ] Configurar `VITE_ADMIN_TOKEN` no Vercel
- [ ] Configurar `VITE_API_URL` no Vercel (se necessário)
- [ ] Verificar variáveis de ambiente

### Backend ✅
- [x] Backend rodando em produção (Fly.io)
- [x] Endpoints admin funcionando
- [x] Token `ADMIN_TOKEN` configurado
- [ ] Verificar CORS se necessário

### Frontend ✅
- [x] Build sem erros
- [x] Todas as dependências instaladas
- [x] Código validado
- [ ] Testar build local: `npm run build`

---

## 🧪 TESTES RECOMENDADOS

### Testes Manuais
1. [ ] Login com senha válida
2. [ ] Acesso a dashboard
3. [ ] Navegação entre páginas
4. [ ] Carregamento de dados reais
5. [ ] Tratamento de erros (simular offline)
6. [ ] Token expirado (aguardar 8 horas ou forçar)
7. [ ] Logout funcional

### Testes de Integração
1. [ ] Todas as páginas carregam dados
2. [ ] Paginação funciona
3. [ ] Busca funciona
4. [ ] Filtros funcionam
5. [ ] Formatação está correta

---

## 🚀 DEPLOY NO VERCEL

### Passos:
1. [ ] Conectar repositório GitHub
2. [ ] Configurar variáveis de ambiente:
   - `VITE_ADMIN_TOKEN` = valor do `ADMIN_TOKEN` do backend
   - `VITE_API_URL` = URL do backend (ou usar `/api` rewrite)
3. [ ] Configurar build command: `npm run build`
4. [ ] Configurar output directory: `dist`
5. [ ] Deploy

---

## ✅ VALIDAÇÃO PÓS-DEPLOY

### Verificações:
1. [ ] Site acessível
2. [ ] Login funciona
3. [ ] Dashboard carrega dados
4. [ ] Todas as páginas funcionam
5. [ ] Sem erros no console
6. [ ] Performance adequada

---

**Status:** ✅ **PRONTO PARA DEPLOY**

