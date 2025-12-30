# 📄 CONTRATO OFICIAL UI ↔ ENGINE V19
## Gol de Ouro - Especificação Técnica Completa

**Data:** 18/12/2025  
**Versão:** 1.0  
**Status:** ✅ **OFICIAL**

---

## 🎯 OBJETIVO

Este documento define o contrato oficial entre a UI Web (Player e Admin) e a Engine V19, garantindo compatibilidade total e integração segura.

---

## 🔌 ENDPOINTS OFICIAIS ENGINE V19

### **Base URL**
```
Produção: https://goldeouro-backend-v2.fly.dev
```

### **Autenticação**

#### **POST /api/auth/login**
**Descrição:** Autenticar usuário

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "data": {
    "token": "string (JWT)",
    "user": {
      "id": "number",
      "email": "string",
      "nome": "string",
      "saldo": "number",
      "tipo": "string"
    }
  }
}
```

**Response (Erro):**
```json
{
  "success": false,
  "message": "string"
}
```

---

#### **POST /api/auth/register**
**Descrição:** Registrar novo usuário

**Request:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "data": {
    "token": "string (JWT)",
    "user": {
      "id": "number",
      "email": "string",
      "nome": "string",
      "saldo": "number",
      "tipo": "string"
    }
  }
}
```

**Response (Erro):**
```json
{
  "success": false,
  "message": "string"
}
```

---

#### **POST /api/auth/refresh**
**Descrição:** Renovar token de acesso

**Request Headers:**
```
Authorization: Bearer {refresh_token}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "data": {
    "token": "string (JWT)",
    "refreshToken": "string"
  }
}
```

**Response (Erro):**
```json
{
  "success": false,
  "message": "string"
}
```

**Status:** ⚠️ **NÃO IMPLEMENTADO NA UI**

---

#### **GET /api/user/profile**
**Descrição:** Obter perfil do usuário autenticado

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "data": {
    "id": "number",
    "email": "string",
    "nome": "string",
    "saldo": "number",
    "tipo": "string",
    "total_apostas": "number",
    "total_ganhos": "number",
    "created_at": "string (ISO 8601)"
  }
}
```

**Response (Erro):**
```json
{
  "success": false,
  "message": "string"
}
```

---

### **Jogo (CRÍTICO - Engine V19)**

#### **POST /api/games/shoot**
**Descrição:** Registrar chute no jogo (Engine V19)

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "direction": "string (TL|TR|C|BL|BR)",
  "amount": "number (1|2|5|10)"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "data": {
    "result": "goal" | "miss",
    "premio": "number",
    "premioGolDeOuro": "number",
    "loteProgress": {
      "current": "number",
      "total": "number"
    },
    "isLoteComplete": "boolean",
    "novoSaldo": "number",
    "contadorGlobal": "number",
    "isGolDeOuro": "boolean",
    "loteId": "string",
    "timestamp": "string (ISO 8601)"
  }
}
```

**Response (Erro - Saldo Insuficiente):**
```json
{
  "success": false,
  "message": "Saldo insuficiente"
}
```

**Response (Erro - Lote Encerrado):**
```json
{
  "success": false,
  "message": "Lote encerrado"
}
```

**Validações Obrigatórias:**
- `direction` deve ser uma das zonas válidas: TL, TR, C, BL, BR
- `amount` deve ser um dos valores válidos: 1, 2, 5, 10
- Usuário deve ter saldo suficiente
- Token deve ser válido

---

#### **GET /api/games/status**
**Descrição:** Obter status do jogo

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "data": {
    "status": "active" | "inactive",
    "lotes": [
      {
        "id": "string",
        "valor": "number",
        "progresso": {
          "current": "number",
          "total": "number"
        },
        "status": "active" | "complete" | "closed"
      }
    ]
  }
}
```

---

#### **GET /api/metrics**
**Descrição:** Obter métricas globais do jogo

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "data": {
    "contador_chutes_global": "number",
    "ultimo_gol_de_ouro": "number",
    "total_jogos": "number",
    "total_jogadores": "number"
  }
}
```

---

### **Pagamentos**

#### **POST /api/payments/pix/criar**
**Descrição:** Criar pagamento PIX

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "amount": "number (min: 1)",
  "description": "string"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "data": {
    "paymentId": "string",
    "qrCode": "string (base64)",
    "pixKey": "string",
    "amount": "number",
    "status": "pending",
    "expiresAt": "string (ISO 8601)"
  }
}
```

**Response (Erro):**
```json
{
  "success": false,
  "message": "string"
}
```

---

#### **GET /api/payments/pix/status**
**Descrição:** Consultar status do pagamento PIX

**Request Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
```
paymentId: string
```

**Response (Sucesso):**
```json
{
  "success": true,
  "data": {
    "paymentId": "string",
    "status": "pending" | "approved" | "rejected" | "expired",
    "amount": "number",
    "approvedAt": "string (ISO 8601) | null"
  }
}
```

---

#### **GET /api/payments/pix/usuario**
**Descrição:** Obter dados PIX do usuário (inclui histórico)

**Request Headers:**
```
Authorization: Bearer {token}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "data": {
    "historico_pagamentos": [
      {
        "id": "string",
        "amount": "number",
        "status": "string",
        "createdAt": "string (ISO 8601)"
      }
    ]
  }
}
```

---

### **Saques**

#### **POST /api/withdraw**
**Descrição:** Solicitar saque PIX

**Request Headers:**
```
Authorization: Bearer {token}
```

**Request:**
```json
{
  "amount": "number",
  "pixKey": "string",
  "pixType": "cpf" | "email" | "phone" | "random"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "data": {
    "withdrawalId": "string",
    "amount": "number",
    "status": "pending",
    "createdAt": "string (ISO 8601)"
  }
}
```

**Response (Erro - Saldo Insuficiente):**
```json
{
  "success": false,
  "message": "Saldo insuficiente"
}
```

---

## 🔒 AUTENTICAÇÃO

### **Formato do Token**

**Tipo:** JWT (JSON Web Token)

**Armazenamento:**
- ⚠️ **ATUAL:** `localStorage.getItem('authToken')` (Player)
- ⚠️ **ATUAL:** `localStorage.getItem('admin-token')` (Admin)
- ✅ **RECOMENDADO:** SecureStore (via adaptador)

### **Renovação Automática**

**Status:** ❌ **NÃO IMPLEMENTADO**

**Recomendação:**
- Implementar renovação automática em background
- Usar refresh token quando disponível
- Renovar antes da expiração (ex: 5 minutos antes)

### **Tratamento de Erros**

**401 Unauthorized:**
- Token inválido ou expirado
- Remover token do storage
- Redirecionar para login

**403 Forbidden:**
- Token válido mas sem permissão
- Remover token do storage
- Redirecionar para login

---

## 📊 FORMATO DE RESPOSTA PADRÃO

### **Sucesso**
```json
{
  "success": true,
  "data": { ... },
  "message": "string opcional"
}
```

### **Erro**
```json
{
  "success": false,
  "message": "string",
  "error": "string opcional"
}
```

---

## ⚠️ VALIDAÇÕES OBRIGATÓRIAS

### **Antes de Enviar Request**

1. ✅ Token válido presente
2. ✅ Payload válido (schema)
3. ✅ Saldo suficiente (quando aplicável)
4. ✅ Valores dentro dos limites permitidos

### **Após Receber Response**

1. ✅ Validar estrutura de resposta
2. ✅ Validar campos obrigatórios
3. ✅ Tratar dados nulos/incompletos
4. ✅ Atualizar estado local

---

## 🔄 FLUXOS CRÍTICOS

### **Fluxo de Chute**

1. Validar saldo suficiente
2. Validar token válido
3. Enviar `POST /api/games/shoot`
4. Processar resposta
5. Atualizar saldo local
6. Atualizar contador global
7. Exibir resultado

### **Fluxo de Pagamento PIX**

1. Validar valor mínimo
2. Enviar `POST /api/payments/pix/criar`
3. Exibir QR Code
4. Iniciar polling de status
5. Atualizar saldo quando aprovado

### **Fluxo de Saque**

1. Validar saldo suficiente
2. Validar chave PIX
3. Enviar `POST /api/withdraw`
4. Atualizar saldo local
5. Exibir confirmação

---

## 📝 NOTAS IMPORTANTES

1. **Engine V19 é a única fonte da verdade** - Todos os dados devem vir do backend
2. **Não calcular valores localmente** - Usar sempre valores do backend
3. **Tratar erros graciosamente** - Não usar fallbacks hardcoded
4. **Validar sempre** - Validar payloads e respostas
5. **Manter estado sincronizado** - Atualizar estado local após cada operação

---

**CONTRATO OFICIAL** ✅  
**VERSÃO:** 1.0  
**DATA:** 18/12/2025

