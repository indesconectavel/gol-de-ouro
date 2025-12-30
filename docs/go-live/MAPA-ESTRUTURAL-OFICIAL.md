# 🗺️ MAPA ESTRUTURAL OFICIAL - GOL DE OURO
## Data: 2025-01-27
## Versão: 1.0

---

## 📁 ESTRUTURA DO PROJETO

### **Raiz do Projeto**
```
goldeouro-backend/
├── server-fly.js                    # ✅ Servidor principal (v1.2.0)
├── package.json                      # ✅ Configuração backend
├── scripts/                          # ✅ Scripts de automação
│   ├── e2e/
│   │   ├── auditoria-e2e-producao.js # ✅ Script E2E principal
│   │   └── validate-data-testid.js   # ✅ Validação data-testid
│   └── [outros scripts...]
├── goldeouro-player/                 # ✅ Frontend Jogador
│   ├── package.json                  # ✅ Configuração player
│   ├── src/
│   │   ├── config/
│   │   │   └── api.js                # ✅ Configuração API
│   │   └── [componentes...]
│   └── [arquivos...]
├── goldeouro-admin/                  # ✅ Frontend Admin
│   ├── package.json                  # ✅ Configuração admin
│   └── [arquivos...]
├── goldeouro-mobile/                 # ✅ App Mobile
│   ├── package.json                  # ✅ Configuração mobile
│   └── [arquivos...]
├── mcp-system/                       # ✅ Sistema MCP
│   └── audit-simple.js               # ✅ Auditoria MCP
└── docs/                             # ✅ Documentação
    └── GO-LIVE/                      # ✅ Relatórios GO-LIVE
```

---

## 🔗 ENDPOINTS PRINCIPAIS

### **Backend (Produção)**
- **URL Base:** `https://goldeouro-backend-v2.fly.dev`
- **WebSocket:** `wss://goldeouro-backend-v2.fly.dev`

### **Frontend (Produção)**
- **Player:** `https://www.goldeouro.lol`
- **Admin:** `https://goldeouro-admin.vercel.app`

### **Endpoints API**
- `GET /health` - Health check
- `GET /meta` - Metadados do sistema
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/login` - Login
- `POST /api/payments/pix/criar` - Criar PIX V6
- `GET /api/payments/pix/usuario` - Listar PIX do usuário
- `POST /api/games/shoot` - Executar chute
- `GET /api/user/profile` - Perfil do usuário

---

## 📦 SCRIPTS PRINCIPAIS

### **Backend (`package.json`)**
```json
{
  "test:e2e:prod": "node scripts/e2e/auditoria-e2e-producao.js",
  "test:data-testid": "node scripts/e2e/validate-data-testid.js"
}
```

### **Player (`goldeouro-player/package.json`)**
```json
{
  "test:e2e:prod": "cd .. && node scripts/e2e/auditoria-e2e-producao.js",
  "test:data-testid": "cd .. && node scripts/e2e/validate-data-testid.js"
}
```

---

## ✅ VALIDAÇÕES REALIZADAS

### **Caminhos**
- ✅ `scripts/e2e/auditoria-e2e-producao.js` existe
- ✅ `server-fly.js` existe na raiz
- ✅ Scripts do `package.json` apontam corretamente

### **Estrutura**
- ✅ Todas as pastas principais identificadas
- ✅ Arquivos críticos localizados
- ✅ Configurações validadas

---

## 🔍 PRÓXIMOS PASSOS

1. ✅ Mapa estrutural criado
2. ⏳ Diagnóstico e correção automática
3. ⏳ Auditoria FULL Backend
4. ⏳ Auditoria FULL Frontend
5. ⏳ Auditoria MCP
6. ⏳ Auditoria PRODUÇÃO
7. ⏳ Teste E2E Completo
8. ⏳ Consolidação Final
9. ⏳ Preparação para Deploy

---

**Status:** ✅ MAPA ESTRUTURAL CRIADO COM SUCESSO

