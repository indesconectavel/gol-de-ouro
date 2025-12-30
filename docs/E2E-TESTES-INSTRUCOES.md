# 🧪 INSTRUÇÕES - TESTES E2E FRONTEND (BROWSER AGENT)

## ✅ Script Criado

O script `scripts/e2e-frontend-browser-agent.js` foi criado e está pronto para execução.

---

## 🚀 Como Executar

### Opção 1: Execução Direta
```bash
node scripts/e2e-frontend-browser-agent.js
```

### Opção 2: Com NPM Script (recomendado)
Adicione ao `package.json`:
```json
{
  "scripts": {
    "test:e2e": "node scripts/e2e-frontend-browser-agent.js"
  }
}
```

Depois execute:
```bash
npm run test:e2e
```

---

## 📋 Cenários Testados

1. **Health-check visual**
   - Acessa `https://www.goldeouro.lol`
   - Captura screenshots (desktop e mobile)
   - Verifica erros no console (ERR_NAME_NOT_RESOLVED, CSP, Network Error)

2. **Registro (novo usuário)**
   - Preenche formulário de registro
   - Valida token salvo no localStorage
   - Valida redirecionamento para /home ou /dashboard

3. **Login (usuário existente)**
   - Usa credenciais do registro anterior
   - Valida token e redirecionamento

4. **WebSocket realtime**
   - Conecta ao WebSocket
   - Envia evento 'auth' com token
   - Valida recebimento de 'auth_success' e heartbeat

5. **Criar PIX (fluxo PIX V6)**
   - Acessa tela de depósito
   - Cria PIX com valor mínimo
   - Valida retorno de QR Code EMV

6. **Jogo (chute)**
   - Navega para tela de jogo
   - Executa 1 chute completo
   - Valida resposta do backend

7. **Logout & Persistence**
   - Faz logout
   - Recarrega página
   - Valida que usuário está desconectado

8. **Resiliência PIX (8x sequencial)**
   - Cria 8 PIX em sequência
   - Mede taxa de sucesso, latência média e P95

---

## 📊 Relatórios Gerados

Após a execução, os seguintes arquivos serão gerados em `docs/e2e-reports/`:

1. **E2E-REPORT.json** - Relatório completo em JSON com todos os detalhes
2. **E2E-REPORT.md** - Relatório executivo em Markdown
3. **screenshots/** - Pasta com todas as screenshots capturadas

---

## ⚙️ Configurações

O script usa as seguintes URLs (configuráveis no início do arquivo):

- **Frontend:** `https://www.goldeouro.lol`
- **Backend:** `https://goldeouro-backend-v2.fly.dev`
- **WebSocket:** `wss://goldeouro-backend-v2.fly.dev`

---

## 🎯 Critérios de Aprovação

- **Score mínimo:** 90/100
- **Registro e Login:** 100% (sem erro 4xx/5xx)
- **WebSocket:** Conecta e autentica <2s
- **PIX:** Retorna EMV (000201...) e imagem renderizável

---

## 🔧 Troubleshooting

### Erro: "Puppeteer não encontrado"
```bash
npm install puppeteer --save-dev
```

### Erro: "Browser não inicia"
- Verifique se o Chrome/Chromium está instalado
- Puppeteer baixa automaticamente o Chromium na primeira execução

### Timeout em cenários
- Aumente o timeout nos métodos `waitForNavigation` e `waitForTimeout`
- Verifique se o frontend está acessível em produção

---

## 📝 Notas Importantes

1. **Headless Mode:** O script roda com `headless: false` para visualização (pode ser alterado)
2. **Screenshots:** São capturados em cada passo importante
3. **Network Logs:** Todas as requisições são capturadas
4. **Console Logs:** Todos os logs do console são coletados
5. **Storage:** localStorage e sessionStorage são dumpados

---

**Data:** 2025-12-01  
**Versão:** E2E-FRONTEND-BROWSER-AGENT v1.0

