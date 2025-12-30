# 🔍 V16 DETECÇÃO COMPLETA
## Data: 2025-12-04

## Health Check:
{
  "/health": {
    "status": 200,
    "ok": true,
    "data": {
      "success": true,
      "timestamp": "2025-12-04T20:45:07.497Z",
      "data": {
        "status": "ok",
        "timestamp": "2025-12-04T20:45:07.497Z",
        "version": "1.2.0",
        "database": "connected",
        "mercadoPago": "connected",
        "contadorChutes": 61,
        "ultimoGolDeOuro": 0
      },
      "message": "Sistema funcionando"
    }
  },
  "/": {
    "status": 200,
    "ok": true,
    "data": {
      "success": true,
      "timestamp": "2025-12-04T20:45:07.534Z",
      "data": {
        "status": "ok",
        "service": "Gol de Ouro Backend API",
        "version": "1.2.0",
        "endpoints": {
          "health": "/health",
          "api": "/api"
        }
      },
      "message": "API funcionando"
    }
  },
  "/api/status": {
    "status": 404,
    "ok": false,
    "error": "Request failed with status code 404"
  }
}

## Secrets:
- Total: 19
- Encontrados: 6
- Faltando: 0

## Supabase:
- Conectado: ✅
- Usuário encontrado: ❌

## Usuário:
null

## Erros:
Nenhum

## Warnings:
1. Erro ao buscar usuário: Request failed with status code 401
2. Erro ao testar chute: Cannot set properties of null (setting 'chuteTeste')
