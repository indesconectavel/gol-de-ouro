# 🎯 V16 AUTH TEST
## Data: 2025-12-04

## Cadastro:
{
  "success": true,
  "data": {
    "success": true,
    "timestamp": "2025-12-04T16:17:57.092Z",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MzA0ZjJkMC0xMTk1LTQ0MTYtOWY4Zi1kNzQwMzgwMDYyZWUiLCJlbWFpbCI6InRlc3RfdjE2X2RpYWdfMTc2NDg2NTA3NzczNkBleGFtcGxlLmNvbSIsInJvbGUiOiJqb2dhZG9yIiwiaWF0IjoxNzY0ODY1MDc3LCJleHAiOjE3NjQ5NTE0Nzd9.voFBN39GbfRt_IYQwHL6RMRpPjY0kSMhHGgJNbDr1XE",
      "user": {
        "id": "8304f2d0-1195-4416-9f8f-d740380062ee",
        "email": "test_v16_diag_1764865077736@example.com",
        "username": "testuser_1764865077736",
        "saldo": 0,
        "tipo": "jogador"
      }
    },
    "message": "Usuário registrado com sucesso!"
  }
}

## Login:
{
  "success": true,
  "data": {
    "success": true,
    "timestamp": "2025-12-04T16:17:57.310Z",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4MzA0ZjJkMC0xMTk1LTQ0MTYtOWY4Zi1kNzQwMzgwMDYyZWUiLCJlbWFpbCI6InRlc3RfdjE2X2RpYWdfMTc2NDg2NTA3NzczNkBleGFtcGxlLmNvbSIsInJvbGUiOiJqb2dhZG9yIiwiaWF0IjoxNzY0ODY1MDc3LCJleHAiOjE3NjQ5NTE0Nzd9.voFBN39GbfRt_IYQwHL6RMRpPjY0kSMhHGgJNbDr1XE",
      "user": {
        "id": "8304f2d0-1195-4416-9f8f-d740380062ee",
        "email": "test_v16_diag_1764865077736@example.com",
        "username": "testuser_1764865077736",
        "saldo": 0,
        "tipo": "jogador"
      }
    },
    "message": "Login realizado com sucesso!"
  }
}

## Token:
✅ Gerado

## JWT:
{
  "hasThreeParts": true,
  "payload": {
    "userId": "8304f2d0-1195-4416-9f8f-d740380062ee",
    "email": "test_v16_diag_1764865077736@example.com",
    "role": "jogador",
    "iat": 1764865077,
    "exp": 1764951477
  },
  "hasExp": true,
  "hasUserId": true
}
