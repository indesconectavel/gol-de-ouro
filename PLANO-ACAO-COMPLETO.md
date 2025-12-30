# 🚀 Plano de Ação Completo - Resolver Todos os Problemas

## 📊 Status Atual

### ✅ Correções Aplicadas (Aguardando Deploy):
1. ✅ **prom-client** - Movido para dependencies
2. ✅ **Tabela transacoes** - Todas as colunas adicionadas
3. ✅ **Heartbeat API Key** - Corrigido para usar supabase-unified-config
4. ✅ **Débito de saldo no jogo** - Código adicionado ao GameController

### ⚠️ Problemas Identificados:
1. ⚠️ **RPC rpc_deduct_balance** - Retorna "Usuário não encontrado"
2. ⚠️ **Endpoint /api/games/shoot** - Falhando (dependente da RPC)

## 🎯 Plano de Ação (Ordem de Execução)

### FASE 1: Verificação e Diagnóstico ✅ EM ANDAMENTO

#### 1.1 Verificar Usuário de Teste
**Ação:** Executar script:
```bash
node src/scripts/verificar_usuario_e_testar_rpc.js
```

**Verificar:**
- ✅ Usuário existe no banco
- ✅ UUID correto
- ✅ Saldo atual

#### 1.2 Testar RPC Diretamente
**Ação:** O script acima já testa a RPC

**Verificar:**
- ✅ RPC executa sem erros
- ✅ Saldo é debitado corretamente
- ✅ Transação é criada

---

### FASE 2: Correções e Deploy 🔴 PRÓXIMA

#### 2.1 Deploy das Correções
**Ação:**
```bash
fly deploy --app goldeouro-backend-v2 --remote-only
```

**O que será deployado:**
- ✅ Correção do Heartbeat (supabase-unified-config)
- ✅ Código de débito de saldo no GameController
- ✅ Todas as correções anteriores

#### 2.2 Verificar Logs Após Deploy
**Ação:** Verificar logs no Fly.io Dashboard

**Verificar:**
- ✅ Ausência de erros de Heartbeat
- ✅ Servidor iniciando corretamente
- ✅ Máquinas estáveis

---

### FASE 3: Validação Final 🟡 APÓS DEPLOY

#### 3.1 Retestar Funcionalidades Principais
**Ação:**
```bash
node src/scripts/testar_funcionalidades_principais.js
```

**Verificar:**
- ✅ Login funcionando
- ✅ PIX criando
- ✅ **Jogo debitando saldo** ⭐
- ✅ Prêmios sendo creditados

#### 3.2 Teste End-to-End Completo
**Ação:** Teste manual completo

**Fluxo:**
1. Login → Obter token
2. Verificar saldo inicial
3. Criar PIX → Gerar QR Code
4. Fazer múltiplos chutes
5. Verificar débitos corretos
6. Verificar prêmios quando há gol

---

## 🔍 Diagnóstico Detalhado

### Problema: RPC "Usuário não encontrado"

**Possíveis Causas:**
1. UUID usado no teste não existe no banco
2. RPC está procurando em lugar errado
3. Problema de tipos de dados (UUID vs VARCHAR)

**Solução:**
- Verificar se usuário existe
- Usar UUID real do usuário
- Verificar código da RPC

### Problema: Endpoint /api/games/shoot falhando

**Causa Raiz:**
- Dependente da RPC `rpc_deduct_balance`
- Se RPC falhar, endpoint retorna erro 500

**Solução:**
- Resolver problema da RPC primeiro
- Depois retestar endpoint

---

## 📋 Checklist de Validação

### Antes do Deploy:
- [x] Correção do Heartbeat aplicada
- [x] Código de débito de saldo adicionado
- [x] Tabela transacoes corrigida
- [ ] Usuário de teste verificado
- [ ] RPC testada diretamente

### Após Deploy:
- [ ] Servidor iniciou sem erros
- [ ] Heartbeat funcionando (sem erros nos logs)
- [ ] Endpoint /api/games/shoot funcionando
- [ ] Saldo sendo debitado corretamente
- [ ] Transações sendo registradas

### Validação Final:
- [ ] Login funcionando
- [ ] PIX funcionando
- [ ] Jogo funcionando completamente
- [ ] Prêmios sendo creditados
- [ ] Sistema financeiro ACID garantido

---

## 🚀 Comandos Rápidos

### Verificar Usuário e Testar RPC:
```bash
node src/scripts/verificar_usuario_e_testar_rpc.js
```

### Deploy:
```bash
fly deploy --app goldeouro-backend-v2 --remote-only
```

### Testar Funcionalidades:
```bash
node src/scripts/testar_funcionalidades_principais.js
```

### Verificar Logs:
```bash
fly logs --app goldeouro-backend-v2
```

---

## 📝 Arquivos de Referência

- `PROXIMOS-PASSOS-RESOLVER-JOGO.md` - Guia detalhado
- `CORRECAO-HEARTBEAT-API-KEY.md` - Correção do Heartbeat
- `RESUMO-CORRECOES-APLICADAS.md` - Resumo das correções
- `src/scripts/verificar_usuario_e_testar_rpc.js` - Script de verificação

---

**Data:** 2025-12-10 11:50 UTC  
**Status:** 🔄 EM ANDAMENTO - VERIFICANDO USUÁRIO E RPC  
**Próximo passo:** Executar verificação e depois deploy

