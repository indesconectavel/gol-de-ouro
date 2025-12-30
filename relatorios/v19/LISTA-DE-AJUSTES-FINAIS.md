# 🔧 LISTA DE AJUSTES FINAIS V19
## Gol de Ouro Backend - Ações Necessárias para Produção

**Data:** 2025-12-10  
**Versão:** V19.0.0  
**Status:** ⚠️ **AJUSTES PENDENTES**

---

## 🔴 PRIORIDADE CRÍTICA (Bloqueia Produção)

### AJUSTE 1: Adicionar Variáveis V19 ao env.example

**Arquivo:** `env.example`  
**Prioridade:** 🔴 **CRÍTICA**  
**Tempo Estimado:** 5 minutos  
**Status:** ⚠️ **PENDENTE**

**Ação:**
Adicionar as seguintes variáveis ao arquivo `env.example`:

```bash
# ENGINE V19
USE_ENGINE_V19=true
ENGINE_HEARTBEAT_ENABLED=true
ENGINE_MONITOR_ENABLED=true
USE_DB_QUEUE=false

# Heartbeat (opcional)
HEARTBEAT_INTERVAL_MS=5000
INSTANCE_ID=auto
```

**Validação:**
- [ ] Variáveis adicionadas ao `env.example`
- [ ] Variáveis documentadas
- [ ] Valores padrão definidos

---

### AJUSTE 2: Implementar Validação V19

**Arquivo:** `config/required-env.js`  
**Prioridade:** 🔴 **CRÍTICA**  
**Tempo Estimado:** 15 minutos  
**Status:** ⚠️ **PENDENTE**

**Ação:**
Adicionar função `assertV19Env()` ao arquivo:

```javascript
function assertV19Env() {
  if (process.env.USE_ENGINE_V19 === 'true') {
    const required = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'ENGINE_HEARTBEAT_ENABLED',
      'ENGINE_MONITOR_ENABLED'
    ];
    
    required.forEach(varName => {
      if (!process.env[varName]) {
        throw new Error(`Variável obrigatória V19 não encontrada: ${varName}`);
      }
    });
  }
}

module.exports = { assertRequiredEnv, isProduction, assertV19Env };
```

E chamar no `server-fly.js`:

```javascript
const { assertRequiredEnv, assertV19Env } = require('./config/required-env');
assertRequiredEnv([...]);
assertV19Env(); // Adicionar esta linha
```

**Validação:**
- [ ] Função `assertV19Env()` implementada
- [ ] Função exportada corretamente
- [ ] Função chamada no `server-fly.js`
- [ ] Teste com variáveis faltando funciona

---

### AJUSTE 3: Verificar Banco Supabase em Uso

**Arquivo:** `.env` (produção)  
**Prioridade:** 🔴 **CRÍTICA**  
**Tempo Estimado:** 10 minutos  
**Status:** ⚠️ **PENDENTE**

**Ação:**
1. Verificar qual banco está configurado no `.env` de produção
2. Validar que é o banco correto (produção ou goldeouro-db)
3. Documentar qual banco está em uso
4. Testar conexão com o banco

**Validação:**
- [ ] Banco identificado
- [ ] Banco documentado
- [ ] Conexão testada
- [ ] Credenciais validadas

---

### AJUSTE 4: Validar Migration V19 no Banco

**Arquivo:** Banco de Produção  
**Prioridade:** 🔴 **CRÍTICA**  
**Tempo Estimado:** 30 minutos  
**Status:** ⚠️ **PENDENTE**

**Ação:**
1. Conectar ao banco de produção
2. Verificar se migration V19 foi aplicada
3. Verificar existência de todas as tabelas essenciais
4. Verificar existência de todas as colunas essenciais
5. Verificar existência de todos os índices
6. Verificar constraints

**Validação:**
- [ ] Migration aplicada
- [ ] Todas as tabelas existem
- [ ] Todas as colunas existem
- [ ] Todos os índices existem
- [ ] Constraints corretos

---

### AJUSTE 5: Validar RPCs no Banco

**Arquivo:** Banco de Produção  
**Prioridade:** 🔴 **CRÍTICA**  
**Tempo Estimado:** 30 minutos  
**Status:** ⚠️ **PENDENTE**

**Ação:**
1. Verificar existência de todas as RPCs financeiras
2. Verificar existência de todas as RPCs de lotes
3. Verificar existência de todas as RPCs de recompensas
4. Verificar existência de todas as RPCs de webhook
5. Testar cada RPC com dados de teste

**Validação:**
- [ ] Todas as RPCs financeiras existem
- [ ] Todas as RPCs de lotes existem
- [ ] Todas as RPCs de recompensas existem
- [ ] Todas as RPCs de webhook existem
- [ ] Todas as RPCs testadas

---

## 🟡 PRIORIDADE ALTA (Recomendado antes de Produção)

### AJUSTE 6: Consolidar RPCs na Migration

**Arquivo:** `MIGRATION-V19-PARA-SUPABASE.sql`  
**Prioridade:** 🟡 **ALTA**  
**Tempo Estimado:** 20 minutos  
**Status:** ⚠️ **PENDENTE**

**Ação:**
1. Incluir conteúdo de `database/rpc-financial-acid.sql` na migration principal
2. Incluir conteúdo de `database/schema-rewards.sql` na migration principal (se existir)
3. Incluir conteúdo de `database/schema-webhook-events.sql` na migration principal (se existir)
4. Garantir que migration é idempotente

**Validação:**
- [ ] RPCs financeiras na migration
- [ ] RPCs de recompensas na migration
- [ ] RPCs de webhook na migration
- [ ] Migration é idempotente

---

### AJUSTE 7: Remover Código Legacy

**Arquivo:** `controllers/`, `services/`  
**Prioridade:** 🟡 **ALTA**  
**Tempo Estimado:** 15 minutos  
**Status:** ⚠️ **PENDENTE**

**Ação:**
1. Mover controllers legacy para `legacy/v19_removed/controllers/`
2. Mover services legacy para `legacy/v19_removed/services/`
3. Verificar que nenhum código está importando arquivos legacy
4. Remover imports de código legacy

**Validação:**
- [ ] Controllers legacy movidos
- [ ] Services legacy movidos
- [ ] Nenhum import de código legacy
- [ ] Código V19 sendo usado

---

### AJUSTE 8: Executar Testes Completos

**Arquivo:** Testes  
**Prioridade:** 🟡 **ALTA**  
**Tempo Estimado:** 60 minutos  
**Status:** ⚠️ **PENDENTE**

**Ação:**
1. Executar testes de fluxo PIX completo
2. Executar testes de fluxo de chutes completo
3. Executar testes de fluxo de premiações completo
4. Executar testes de integridade financeira
5. Executar testes de idempotência

**Validação:**
- [ ] Testes de PIX passando
- [ ] Testes de chutes passando
- [ ] Testes de premiações passando
- [ ] Testes de integridade passando
- [ ] Testes de idempotência passando

---

## 🟢 PRIORIDADE MÉDIA (Melhorias)

### AJUSTE 9: Documentar RPCs

**Arquivo:** Documentação  
**Prioridade:** 🟢 **MÉDIA**  
**Tempo Estimado:** 30 minutos  
**Status:** ⚠️ **PENDENTE**

**Ação:**
1. Documentar todas as RPCs financeiras
2. Documentar todas as RPCs de lotes
3. Documentar todas as RPCs de recompensas
4. Documentar todas as RPCs de webhook
5. Criar guia de uso das RPCs

**Validação:**
- [ ] RPCs financeiras documentadas
- [ ] RPCs de lotes documentadas
- [ ] RPCs de recompensas documentadas
- [ ] RPCs de webhook documentadas
- [ ] Guia de uso criado

---

### AJUSTE 10: Criar Testes Automatizados

**Arquivo:** `src/tests/`  
**Prioridade:** 🟢 **MÉDIA**  
**Tempo Estimado:** 120 minutos  
**Status:** ⚠️ **PENDENTE**

**Ação:**
1. Criar testes para RPCs financeiras
2. Criar testes para RPCs de lotes
3. Criar testes para RPCs de recompensas
4. Criar testes para RPCs de webhook
5. Criar testes de integração

**Validação:**
- [ ] Testes para RPCs financeiras criados
- [ ] Testes para RPCs de lotes criados
- [ ] Testes para RPCs de recompensas criados
- [ ] Testes para RPCs de webhook criados
- [ ] Testes de integração criados

---

### AJUSTE 11: Criar Monitoramento de RPCs

**Arquivo:** Monitoramento  
**Prioridade:** 🟢 **MÉDIA**  
**Tempo Estimado:** 60 minutos  
**Status:** ⚠️ **PENDENTE**

**Ação:**
1. Criar endpoint para verificar saúde das RPCs
2. Criar alertas para falhas de RPCs
3. Criar métricas de uso das RPCs
4. Criar dashboard de monitoramento

**Validação:**
- [ ] Endpoint de saúde criado
- [ ] Alertas configurados
- [ ] Métricas coletadas
- [ ] Dashboard criado

---

## 📊 RESUMO DE AJUSTES

### Por Prioridade

| Prioridade | Quantidade | Tempo Total Estimado |
|------------|------------|---------------------|
| 🔴 Crítica | 5 | ~90 minutos |
| 🟡 Alta | 3 | ~95 minutos |
| 🟢 Média | 3 | ~210 minutos |
| **TOTAL** | **11** | **~395 minutos (~6.5 horas)** |

### Por Status

| Status | Quantidade |
|--------|------------|
| ⚠️ Pendente | 11 |
| ✅ Concluído | 0 |

---

## 🎯 ORDEM DE EXECUÇÃO RECOMENDADA

1. ✅ **AJUSTE 1:** Adicionar Variáveis V19 ao env.example (5 min)
2. ✅ **AJUSTE 2:** Implementar Validação V19 (15 min)
3. ✅ **AJUSTE 3:** Verificar Banco Supabase em Uso (10 min)
4. ✅ **AJUSTE 4:** Validar Migration V19 no Banco (30 min)
5. ✅ **AJUSTE 5:** Validar RPCs no Banco (30 min)
6. ✅ **AJUSTE 6:** Consolidar RPCs na Migration (20 min)
7. ✅ **AJUSTE 7:** Remover Código Legacy (15 min)
8. ✅ **AJUSTE 8:** Executar Testes Completos (60 min)
9. ✅ **AJUSTE 9:** Documentar RPCs (30 min)
10. ✅ **AJUSTE 10:** Criar Testes Automatizados (120 min)
11. ✅ **AJUSTE 11:** Criar Monitoramento de RPCs (60 min)

---

**Última Atualização:** 2025-12-10T20:00:00Z

