# 🎯 PRÓXIMOS PASSOS - ENGINE V19
## Guia Prático para Finalização Completa
## Data: 2025-12-09

---

## 📋 RESUMO DAS PENDÊNCIAS

### ✅ **COMPLETO:**
- ✅ Estrutura modular (100%)
- ✅ Código organizado (100%)
- ✅ Configuração V19 (88%)
- ✅ Limpeza e refactor (100%)
- ✅ Documentação (100%)

### ⚠️ **PENDENTE:**
- ⚠️ Validação Migration V19 no Supabase (0%)
- ⚠️ Execução de testes automatizados (0%)
- ⚠️ Validação de API key Supabase

---

## 🔴 PRIORIDADE CRÍTICA - VALIDAÇÃO MIGRATION V19

### Passo 1: Configurar API Key Supabase Correta

**1.1. Obter API Key:**
- Acessar [Supabase Dashboard](https://app.supabase.com)
- Selecionar o projeto "Gol de Ouro"
- Ir em **Settings** → **API**
- Copiar **Service Role Key** (não a Anon Key!)

**1.2. Atualizar .env:**
```bash
# Abrir arquivo .env
# Localizar linha:
SUPABASE_SERVICE_ROLE_KEY=

# Substituir por:
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

**1.3. Validar Configuração:**
```bash
node src/scripts/validar_migration_v19_final.js
```

**Resultado Esperado:**
- ✅ Conexão estabelecida
- ✅ Tabelas validadas
- ✅ RPCs validadas

---

### Passo 2: Verificar Migration V19 no Supabase

**2.1. Acessar Supabase Dashboard:**
- Ir em **SQL Editor**
- Verificar se Migration V19 foi aplicada

**2.2. Verificar Tabelas Obrigatórias:**
```sql
-- Verificar tabela system_heartbeat
SELECT * FROM system_heartbeat LIMIT 1;

-- Verificar colunas V19 em lotes
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'lotes' 
AND column_name IN ('persisted_global_counter', 'synced_at', 'posicao_atual');

-- Verificar RPCs
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN (
  'rpc_get_or_create_lote',
  'rpc_update_lote_after_shot',
  'rpc_add_balance',
  'rpc_deduct_balance'
);
```

**2.3. Se Migration Não Foi Aplicada:**

Criar Migration V19 no Supabase SQL Editor:

```sql
-- Migration V19 - Gol de Ouro Backend
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela system_heartbeat (se não existe)
CREATE TABLE IF NOT EXISTS system_heartbeat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id TEXT NOT NULL,
  system_name TEXT NOT NULL DEFAULT 'gol-de-ouro-backend',
  status TEXT NOT NULL DEFAULT 'active',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Adicionar colunas V19 em lotes (se não existem)
ALTER TABLE lotes 
ADD COLUMN IF NOT EXISTS persisted_global_counter INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS posicao_atual INTEGER DEFAULT 0;

-- 3. Criar índices V19
CREATE INDEX IF NOT EXISTS idx_system_heartbeat_instance_id 
ON system_heartbeat(instance_id);

CREATE INDEX IF NOT EXISTS idx_system_heartbeat_last_seen 
ON system_heartbeat(last_seen);

CREATE INDEX IF NOT EXISTS idx_lotes_synced_at 
ON lotes(synced_at);

-- 4. Criar RPCs V19 (se não existem)
-- RPC: rpc_get_or_create_lote
CREATE OR REPLACE FUNCTION rpc_get_or_create_lote(
  p_lote_id TEXT,
  p_valor_aposta DECIMAL,
  p_tamanho INTEGER,
  p_indice_vencedor INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lote JSONB;
BEGIN
  -- Verificar se lote existe
  SELECT row_to_json(l.*)::JSONB INTO v_lote
  FROM lotes l
  WHERE l.id = p_lote_id;
  
  -- Se não existe, criar
  IF v_lote IS NULL THEN
    INSERT INTO lotes (id, valor_aposta, tamanho, indice_vencedor, status, created_at)
    VALUES (p_lote_id, p_valor_aposta, p_tamanho, p_indice_vencedor, 'ativo', NOW())
    RETURNING row_to_json(lotes.*)::JSONB INTO v_lote;
  END IF;
  
  RETURN v_lote;
END;
$$;

-- RPC: rpc_update_lote_after_shot
CREATE OR REPLACE FUNCTION rpc_update_lote_after_shot(
  p_lote_id TEXT,
  p_valor_aposta DECIMAL,
  p_premio DECIMAL,
  p_premio_gol_de_ouro DECIMAL,
  p_is_goal BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lote JSONB;
BEGIN
  UPDATE lotes
  SET 
    valor_aposta = valor_aposta + p_valor_aposta,
    premio_total = premio_total + p_premio,
    premio_gol_de_ouro = premio_gol_de_ouro + p_premio_gol_de_ouro,
    updated_at = NOW()
  WHERE id = p_lote_id
  RETURNING row_to_json(lotes.*)::JSONB INTO v_lote;
  
  RETURN v_lote;
END;
$$;

-- RPC: rpc_add_balance
CREATE OR REPLACE FUNCTION rpc_add_balance(
  p_usuario_id UUID,
  p_valor DECIMAL,
  p_tipo TEXT DEFAULT 'deposito'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_saldo DECIMAL;
BEGIN
  UPDATE usuarios
  SET saldo = saldo + p_valor,
      updated_at = NOW()
  WHERE id = p_usuario_id
  RETURNING saldo INTO v_saldo;
  
  -- Registrar transação
  INSERT INTO transacoes (usuario_id, valor, tipo, descricao, created_at)
  VALUES (p_usuario_id, p_valor, p_tipo, 'Adição de saldo via RPC', NOW());
  
  RETURN jsonb_build_object('saldo', v_saldo, 'sucesso', true);
END;
$$;

-- RPC: rpc_deduct_balance
CREATE OR REPLACE FUNCTION rpc_deduct_balance(
  p_usuario_id UUID,
  p_valor DECIMAL,
  p_tipo TEXT DEFAULT 'saque'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_saldo DECIMAL;
BEGIN
  -- Verificar saldo suficiente
  SELECT saldo INTO v_saldo
  FROM usuarios
  WHERE id = p_usuario_id;
  
  IF v_saldo < p_valor THEN
    RETURN jsonb_build_object('erro', 'Saldo insuficiente', 'sucesso', false);
  END IF;
  
  -- Deduzir saldo
  UPDATE usuarios
  SET saldo = saldo - p_valor,
      updated_at = NOW()
  WHERE id = p_usuario_id
  RETURNING saldo INTO v_saldo;
  
  -- Registrar transação
  INSERT INTO transacoes (usuario_id, valor, tipo, descricao, created_at)
  VALUES (p_usuario_id, -p_valor, p_tipo, 'Dedução de saldo via RPC', NOW());
  
  RETURN jsonb_build_object('saldo', v_saldo, 'sucesso', true);
END;
$$;

-- 5. Configurar RLS (Row Level Security)
ALTER TABLE system_heartbeat ENABLE ROW LEVEL SECURITY;

-- Policies para system_heartbeat
CREATE POLICY "Allow service role full access"
ON system_heartbeat
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 6. Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_heartbeat_updated_at
BEFORE UPDATE ON system_heartbeat
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

**2.4. Validar Após Migration:**
```bash
node src/scripts/validar_migration_v19_final.js
```

---

## 🟡 PRIORIDADE ALTA - TESTES AUTOMATIZADOS

### Passo 3: Configurar e Executar Testes

**3.1. Verificar Configuração do Vitest:**

Verificar se `package.json` tem configuração do Vitest:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "vitest": "^1.6.1",
    "@jest/globals": "^29.0.0"
  }
}
```

**3.2. Instalar Dependências (se necessário):**
```bash
npm install --save-dev vitest @jest/globals
```

**3.3. Executar Testes:**
```bash
# Executar todos os testes V19
npm test -- src/tests/v19/

# Executar teste específico
npm test -- src/tests/v19/test_engine_v19.spec.js
```

**3.4. Verificar Resultados:**
- ✅ Todos os testes devem passar
- ⚠️ Se algum falhar, verificar imports e dependências

---

## 🟢 PRIORIDADE MÉDIA - VALIDAÇÃO COMPLETA

### Passo 4: Testar Servidor em Modo Desenvolvimento

**4.1. Iniciar Servidor:**
```bash
npm run dev
```

**4.2. Validar Endpoints:**

Testar endpoints principais:

```bash
# Healthcheck
curl http://localhost:8080/health

# Monitor
curl http://localhost:8080/monitor

# Metrics
curl http://localhost:8080/metrics

# Ping
curl http://localhost:8080/ping
```

**4.3. Verificar Logs:**
- ✅ Servidor deve iniciar sem erros
- ✅ Heartbeat deve estar ativo (se configurado)
- ✅ Monitor deve estar funcionando

---

### Passo 5: Validar Fluxo Completo de Partida

**5.1. Criar Script de Simulação:**

Criar `src/scripts/simular_partida_v19.js`:

```javascript
// Simulação completa de partida V19
const { supabaseAdmin } = require('../../database/supabase-unified-config');
const LoteService = require('../modules/lotes/services/lote.service');
const FinancialService = require('../modules/financial/services/financial.service');

async function simularPartida() {
  console.log('🎮 Simulando partida V19...\n');
  
  // 1. Criar lote
  const loteId = `test_${Date.now()}`;
  const lote = await LoteService.getOrCreateLote(loteId, 10, 100, 0);
  console.log('✅ Lote criado:', lote.id);
  
  // 2. Criar jogadores fake
  const jogadores = [];
  for (let i = 0; i < 10; i++) {
    const usuario = await supabaseAdmin.auth.admin.createUser({
      email: `test${i}@example.com`,
      password: 'test123456'
    });
    jogadores.push(usuario.data.user);
  }
  console.log(`✅ ${jogadores.length} jogadores criados`);
  
  // 3. Cada jogador faz um chute
  for (const jogador of jogadores) {
    const chute = await supabaseAdmin
      .from('chutes')
      .insert({
        usuario_id: jogador.id,
        lote_id: loteId,
        valor_aposta: 10,
        posicao: Math.floor(Math.random() * 100)
      })
      .select()
      .single();
    
    console.log(`✅ Chute registrado para ${jogador.email}`);
  }
  
  // 4. Validar lote atualizado
  const loteAtualizado = await supabaseAdmin
    .from('lotes')
    .select('*')
    .eq('id', loteId)
    .single();
  
  console.log('✅ Lote atualizado:', loteAtualizado.data);
  
  console.log('\n✅ Simulação concluída!');
}

simularPartida().catch(console.error);
```

**5.2. Executar Simulação:**
```bash
node src/scripts/simular_partida_v19.js
```

---

## 📊 CHECKLIST FINAL

### Antes de Produção:

- [ ] **Migration V19 aplicada no Supabase**
- [ ] **API Key Supabase configurada corretamente**
- [ ] **Validação Migration executada com sucesso**
- [ ] **Testes automatizados executados**
- [ ] **Servidor testado em desenvolvimento**
- [ ] **Endpoints validados**
- [ ] **Heartbeat funcionando**
- [ ] **Monitor funcionando**
- [ ] **Healthcheck funcionando**
- [ ] **Simulação de partida executada**

---

## 🚀 COMANDOS RÁPIDOS

```bash
# 1. Validar Migration
node src/scripts/validar_migration_v19_final.js

# 2. Validar Engine
node src/scripts/validar_engine_v19_final_completo.js

# 3. Executar Testes
npm test -- src/tests/v19/

# 4. Rodar Tudo
node src/scripts/etapa7_rodar_tudo.js

# 5. Iniciar Servidor
npm run dev

# 6. Verificar Healthcheck
curl http://localhost:8080/health
```

---

## 📁 ARQUIVOS IMPORTANTES

### Relatórios:
- `RELATORIO-OFICIAL-ENTREGA-FINAL-V19.md` - Relatório completo
- `logs/v19/RELATORIO-MIGRATION-V19.md` - Status Migration
- `logs/v19/RELATORIO-ENGINE-V19.md` - Status Engine

### Scripts:
- `src/scripts/validar_migration_v19_final.js` - Validar Migration
- `src/scripts/validar_engine_v19_final_completo.js` - Validar Engine
- `src/scripts/etapa7_rodar_tudo.js` - Rodar todas validações

### Configuração:
- `.env` - Variáveis de ambiente
- `.env.example` - Template de variáveis

---

## ⚠️ PROBLEMAS COMUNS E SOLUÇÕES

### Problema 1: "Invalid API key"
**Solução:** Verificar se está usando Service Role Key (não Anon Key)

### Problema 2: "Tabela não existe"
**Solução:** Executar Migration V19 no Supabase SQL Editor

### Problema 3: "RPC não encontrada"
**Solução:** Criar RPCs manualmente no Supabase (ver Passo 2.3)

### Problema 4: "Testes não encontrados"
**Solução:** Verificar se arquivos estão em `src/tests/v19/` com extensão `.spec.js`

---

## 🎯 OBJETIVO FINAL

**Status Alvo:** ✅ **100% VALIDADO E PRONTO PARA PRODUÇÃO**

Após completar todos os passos acima:
- ✅ Migration V19 validada
- ✅ Testes executados
- ✅ Servidor testado
- ✅ Sistema 100% funcional

---

**Última atualização:** 2025-12-09  
**Versão:** V19.0.0

