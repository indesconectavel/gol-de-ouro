# 🧪 Testes Automatizados - FASE 2.5
## Gol de Ouro - Validação Automatizada em Staging

**Versão:** 1.0.0  
**Data:** 18/12/2025  
**Status:** ✅ Pronto para Execução

---

## 🎯 OBJETIVO

Automatizar a maior parte possível da FASE 2.5 — Testes Funcionais em Staging, validando:
- APIs da Engine V19
- Integração com adaptadores
- Cenários de stress
- Comportamento em tempo real

**SEM alterar UI e SEM alterar Engine.**

---

## 📋 PRÉ-REQUISITOS

### **Ambiente**
- Node.js >= 18.0.0
- NPM ou Yarn
- Acesso ao ambiente de staging

### **Credenciais**
Configurar variáveis de ambiente (opcional, valores padrão disponíveis):

```bash
export STAGING_BASE_URL="https://goldeouro-backend-v2.fly.dev"
export TEST_PLAYER_EMAIL="teste.player@example.com"
export TEST_PLAYER_PASSWORD="senha123"
export TEST_ADMIN_EMAIL="admin@example.com"
export TEST_ADMIN_PASSWORD="admin123"
export TEST_ADMIN_TOKEN="goldeouro123"
export VERBOSE="true"
```

---

## 🚀 INSTALAÇÃO

```bash
cd tests
npm install
```

---

## 🧪 EXECUTAR TESTES

### **Executar Todos os Testes**

```bash
npm test
```

ou

```bash
node runner.js
```

### **Executar Testes Específicos**

```bash
# Testes de Autenticação
npm run test:auth

# Testes de Jogo
npm run test:game

# Testes de Pagamentos
npm run test:payment

# Testes de Saques
npm run test:withdraw

# Testes de Admin
npm run test:admin

# Testes de Integração
npm run test:integration

# Testes de Stress
npm run test:stress
```

---

## 📊 ESTRUTURA DE TESTES

```
tests/
├── config/
│   └── testConfig.js          # Configuração centralizada
├── utils/
│   ├── authHelper.js          # Helper de autenticação
│   ├── apiClient.js           # Cliente API para testes
│   ├── testHelpers.js         # Helpers gerais
│   └── reportGenerator.js     # Gerador de relatórios
├── api/
│   ├── auth.test.js           # Testes de autenticação
│   ├── game.test.js           # Testes de jogo
│   ├── payment.test.js        # Testes de pagamentos
│   ├── withdraw.test.js       # Testes de saques
│   └── admin.test.js          # Testes de admin
├── integration/
│   └── adapters.test.js       # Testes de integração de adaptadores
├── stress/
│   └── stress.test.js         # Testes de stress
├── reports/
│   └── latest-report.md       # Relatório mais recente
├── runner.js                  # Runner principal
├── package.json               # Dependências
└── README.md                  # Este arquivo
```

---

## 📋 TESTES IMPLEMENTADOS

### **FASE B: Testes de API**

#### **Autenticação (5 testes)**
- ✅ API-AUTH-001: Login válido
- ✅ API-AUTH-002: Login inválido
- ✅ API-AUTH-003: Refresh token válido
- ✅ API-AUTH-004: Refresh token inválido
- ✅ API-AUTH-005: Token expirado (simulado)

#### **Jogo (5 testes)**
- ✅ API-GAME-001: Obter saldo atual
- ✅ API-GAME-002: Chute com saldo suficiente
- ✅ API-GAME-003: Chute sem saldo suficiente
- ✅ API-GAME-004: Obter métricas globais
- ✅ API-GAME-005: Contador global sempre do backend

#### **Pagamentos (3 testes)**
- ✅ API-PAYMENT-001: Criar pagamento PIX
- ✅ API-PAYMENT-002: Verificar status de pagamento
- ✅ API-PAYMENT-003: Obter dados PIX do usuário

#### **Saques (3 testes)**
- ✅ API-WITHDRAW-001: Validar saldo antes de saque
- ✅ API-WITHDRAW-002: Saque com saldo suficiente
- ✅ API-WITHDRAW-003: Saque sem saldo suficiente

#### **Admin (3 testes)**
- ✅ API-ADMIN-001: Obter estatísticas gerais
- ✅ API-ADMIN-002: Obter estatísticas de jogo
- ✅ API-ADMIN-003: Endpoint protegido sem token

**Total FASE B:** 19 testes

---

### **FASE C: Testes de Integração**

#### **Adaptadores (4 testes)**
- ✅ INT-ADAPTER-001: Adaptador lida com 401 (refresh automático)
- ✅ INT-ADAPTER-002: Adaptador normaliza dados nulos
- ✅ INT-ADAPTER-003: Adaptador lida com timeout
- ✅ INT-ADAPTER-004: Não há fallbacks hardcoded ativos

**Total FASE C:** 4 testes

---

### **FASE D: Testes de Stress**

#### **Stress (3 testes)**
- ✅ STRESS-001: Simular latência alta
- ✅ STRESS-002: Simular payload inesperado
- ✅ STRESS-003: Simular indisponibilidade do backend

**Total FASE D:** 3 testes

---

## 📊 RELATÓRIOS

Os relatórios são gerados automaticamente em `tests/reports/`:

- `latest-report.md` - Relatório mais recente
- `test-report-[timestamp].md` - Relatórios históricos

### **Formato do Relatório**

- Resumo executivo
- Estatísticas de testes
- Falhas classificadas por severidade
- Detalhamento de cada teste
- Análise de riscos
- Validações realizadas
- Recomendações
- Decisão GO/NO-GO

---

## ✅ CRITÉRIOS DE APROVAÇÃO

### **GO para FASE 3 se:**
- ✅ Taxa de sucesso ≥ 80%
- ✅ Nenhuma falha crítica
- ✅ Adaptadores funcionam corretamente
- ✅ Cenários de stress tratados adequadamente

### **NO-GO para FASE 3 se:**
- ❌ Qualquer falha crítica
- ❌ Taxa de sucesso < 80%
- ❌ Adaptadores não funcionam
- ❌ Erros não tratados adequadamente

---

## ⚠️ LIMITAÇÕES

### **O que NÃO é testado automaticamente:**

1. **UI Visual** - Requer testes manuais
2. **Fluxos End-to-End Completos** - Requer testes manuais
3. **Polling Automático de PIX** - Requer validação manual (teste cria pagamento, mas não valida polling em tempo real)
4. **APK Mobile** - Requer testes manuais
5. **Renovação Automática de Token** - Validado indiretamente (teste valida refresh token, mas não valida renovação automática em tempo real)

### **Validações Manuais Necessárias:**

Consulte `FASE-2.5-PLANO-TESTES-FUNCIONAIS.md` para lista completa de testes manuais necessários.

---

## 🔧 CONFIGURAÇÃO

### **Variáveis de Ambiente**

Criar arquivo `.env` em `tests/` (opcional):

```env
STAGING_BASE_URL=https://goldeouro-backend-v2.fly.dev
TEST_PLAYER_EMAIL=teste.player@example.com
TEST_PLAYER_PASSWORD=senha123
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=admin123
TEST_ADMIN_TOKEN=goldeouro123
VERBOSE=true
SAVE_EVIDENCE=true
```

---

## 📝 NOTAS IMPORTANTES

1. **Testes são Idempotentes** - Podem ser executados múltiplas vezes
2. **Testes são Não Destrutivos** - Não alteram dados de produção
3. **Usa Apenas Dados de Staging** - Nunca acessa produção
4. **Falhas são Classificadas** - Crítica, Alta, Média, Baixa
5. **Relatórios Automáticos** - Gerados após cada execução

---

## 🚀 PRÓXIMOS PASSOS

Após executar testes automatizados:

1. Revisar relatório em `tests/reports/latest-report.md`
2. Executar testes manuais complementares (se necessário)
3. Corrigir falhas críticas identificadas
4. Re-executar testes após correções
5. Avançar para FASE 3 quando aprovado

---

**Testes Automatizados Prontos** ✅  
**Pronto para Execução** ✅

