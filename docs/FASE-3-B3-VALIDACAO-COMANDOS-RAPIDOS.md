# ⚡ FASE 3 — BLOCO B3: COMANDOS RÁPIDOS PARA VALIDAÇÃO
## Comandos PowerShell para Validação Rápida

**Data:** 19/12/2025  
**Hora:** 18:20:00  

---

## 🔍 VALIDAÇÃO DE LOGS DO BACKEND

### **Ver Últimos 50 Logs:**

```powershell
fly logs --app goldeouro-backend-v2 --no-tail | Select-Object -First 50
```

### **Ver Logs em Tempo Real:**

```powershell
fly logs --app goldeouro-backend-v2
```

### **Buscar Erros Específicos:**

```powershell
fly logs --app goldeouro-backend-v2 --no-tail | Select-String "error|ERROR|Error" | Select-Object -First 20
```

### **Buscar Logs de PIX:**

```powershell
fly logs --app goldeouro-backend-v2 --no-tail | Select-String "PIX|pix|payment|pagamento" | Select-Object -First 20
```

---

## 🌐 VALIDAÇÃO DE ENDPOINTS

### **Healthcheck:**

```powershell
Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -Method GET -UseBasicParsing | Select-Object StatusCode, Content
```

### **Métricas Globais:**

```powershell
Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/api/metrics" -Method GET -UseBasicParsing | Select-Object StatusCode, Content
```

---

## 📊 VALIDAÇÃO DE STATUS DO FLY.IO

### **Status da Aplicação:**

```powershell
fly status --app goldeouro-backend-v2
```

### **Listar Releases:**

```powershell
fly releases --app goldeouro-backend-v2
```

---

## 🔐 VALIDAÇÃO DE AUTENTICAÇÃO (TESTE RÁPIDO)

### **Teste de Login (Substituir EMAIL e SENHA):**

```powershell
$body = @{
    email = "SEU_EMAIL@exemplo.com"
    password = "SUA_SENHA"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/api/auth/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing | Select-Object StatusCode, Content
```

---

## 💳 VALIDAÇÃO DE PIX (TESTE RÁPIDO)

### **Criar PIX de Teste (Substituir TOKEN e VALOR):**

```powershell
$headers = @{
    "Authorization" = "Bearer SEU_TOKEN_AQUI"
    "Content-Type" = "application/json"
}

$body = @{
    amount = 1.00
    description = "Teste de validação"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/api/payments/pix/criar" -Method POST -Headers $headers -Body $body -UseBasicParsing | Select-Object StatusCode, Content
```

---

## 📋 CHECKLIST RÁPIDO

### **1. Backend está funcionando?**

```powershell
Invoke-WebRequest -Uri "https://goldeouro-backend-v2.fly.dev/health" -Method GET -UseBasicParsing
```

**Esperado:** StatusCode 200, Content com `"status":"ok"`

---

### **2. Logs sem erros críticos?**

```powershell
fly logs --app goldeouro-backend-v2 --no-tail | Select-String "500|502|503|CRITICAL|FATAL" | Select-Object -First 10
```

**Esperado:** Nenhum resultado (ou apenas avisos não críticos)

---

### **3. Player está acessível?**

**Abrir no navegador:** `https://[URL-DO-PLAYER].vercel.app`

**Verificar:**
- Página carrega
- Console sem erros (F12 → Console)
- Login funciona

---

### **4. Admin está acessível?**

**Abrir no navegador:** `https://[URL-DO-ADMIN].vercel.app`

**Verificar:**
- Página carrega
- Console sem erros (F12 → Console)
- Login administrativo funciona

---

## 🚨 EM CASO DE ERRO

### **Ver Logs Detalhados:**

```powershell
fly logs --app goldeouro-backend-v2 --no-tail | Select-Object -Last 100
```

### **Verificar Status da Aplicação:**

```powershell
fly status --app goldeouro-backend-v2
```

### **Verificar Máquinas:**

```powershell
fly machines list --app goldeouro-backend-v2
```

---

**Documento criado em:** 2025-12-19T18:20:00.000Z

