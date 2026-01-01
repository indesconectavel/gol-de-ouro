# 🎯 INSTRUÇÕES: APLICAR SQL MISSÃO C NO SUPABASE

## 📍 QUAL PROJETO USAR?

Com base na análise do código, você tem **2 projetos Supabase**:

### ✅ **PROJETO DE PRODUÇÃO** (RECOMENDADO)
- **Nome:** `goldeouro-production`
- **ID:** `gayopagjdrkcmkirmfvy`
- **URL:** `https://gayopagjdrkcmkirmfvy.supabase.co`
- **Tipo:** Produção do jogo
- **Status:** ⭐ **USE ESTE PARA MISSÃO C** (correção em produção)

### ⚠️ Projeto de Desenvolvimento
- **Nome:** `goldeouro-db`
- **ID:** `uatszaqzdqcwnfbipoxg`
- **URL:** `https://uatszaqzdqcwnfbipoxg.supabase.co`
- **Tipo:** Desenvolvimento/Testes

---

## 🚀 PASSO A PASSO - APLICAR SQL

### 1️⃣ Acessar o Projeto Correto

1. **Acesse:** https://supabase.com/dashboard
2. **Faça login** com sua conta
3. **Selecione o projeto:** `goldeouro-production` (ou `gayopagjdrkcmkirmfvy`)

### 2️⃣ Abrir SQL Editor

1. No menu lateral esquerdo, clique em **"SQL Editor"**
2. Clique no botão **"New query"** (ou pressione `Ctrl+N` / `Cmd+N`)

### 3️⃣ Copiar e Colar o SQL

**Copie TODO o código abaixo e cole no SQL Editor:**

```sql
-- =====================================================
-- CORREÇÃO CIRÚRGICA MISSÃO C - SISTEMA DE LOTES
-- =====================================================
-- Data: 2025-01-12
-- Status: CORREÇÃO ECONÔMICA DO SISTEMA DE LOTES
-- =====================================================

-- =====================================================
-- PARTE 1: ADICIONAR COLUNA PARA ARRECADAÇÃO GLOBAL GOL DE OURO
-- =====================================================

-- Adicionar coluna para rastrear última arrecadação do Gol de Ouro
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'metricas_globais' 
        AND column_name = 'ultimo_gol_de_ouro_arrecadacao'
    ) THEN
        ALTER TABLE public.metricas_globais 
        ADD COLUMN ultimo_gol_de_ouro_arrecadacao DECIMAL(10,2) DEFAULT 0.00;
        
        -- Inicializar com 0 se não existir
        UPDATE public.metricas_globais 
        SET ultimo_gol_de_ouro_arrecadacao = 0.00 
        WHERE ultimo_gol_de_ouro_arrecadacao IS NULL;
    END IF;
END $$;

-- =====================================================
-- PARTE 2: ATUALIZAR FUNÇÃO RPC PARA VALIDAR R$10
-- =====================================================

-- Remover função antiga
DROP FUNCTION IF EXISTS public.rpc_update_lote_after_shot(VARCHAR, DECIMAL, DECIMAL, DECIMAL, BOOLEAN);

-- Criar função atualizada com validação de R$10
CREATE OR REPLACE FUNCTION public.rpc_update_lote_after_shot(
    p_lote_id VARCHAR(100),
    p_valor_aposta DECIMAL(10,2),
    p_premio DECIMAL(10,2) DEFAULT 0.00,
    p_premio_gol_de_ouro DECIMAL(10,2) DEFAULT 0.00,
    p_is_goal BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_lote RECORD;
    v_nova_posicao INTEGER;
    v_novo_status VARCHAR(20);
    v_total_arrecadado DECIMAL(10,2);
    v_result JSON;
BEGIN
    -- Buscar lote
    SELECT * INTO v_lote
    FROM public.lotes
    WHERE id = p_lote_id
    FOR UPDATE;

    IF v_lote IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Lote não encontrado'
        );
    END IF;

    -- ✅ CORREÇÃO CIRÚRGICA: Calcular nova arrecadação
    v_total_arrecadado := v_lote.total_arrecadado + p_valor_aposta;
    
    -- ✅ CORREÇÃO CIRÚRGICA: Validar se atingiu R$10 antes de permitir gol
    IF p_is_goal AND v_total_arrecadado < 10.00 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Lote precisa arrecadar R$10 antes de conceder prêmio'
        );
    END IF;

    -- Atualizar posição e valores
    v_nova_posicao := v_lote.posicao_atual + 1;
    v_novo_status := v_lote.status;

    -- ✅ CORREÇÃO CIRÚRGICA: Fechar lote apenas se atingiu R$10 (não por gol aleatório)
    IF v_total_arrecadado >= 10.00 THEN
        v_novo_status := 'completed';
        -- ✅ CORREÇÃO CIRÚRGICA: Atualizar winnerIndex para o índice do chute que fechou
        -- O índice será o número de chutes (posicao_atual + 1)
        UPDATE public.lotes
        SET indice_vencedor = v_nova_posicao - 1
        WHERE id = p_lote_id;
    END IF;

    -- Atualizar lote
    UPDATE public.lotes
    SET 
        posicao_atual = v_nova_posicao,
        status = v_novo_status,
        total_arrecadado = v_total_arrecadado,
        premio_total = premio_total + p_premio + p_premio_gol_de_ouro,
        updated_at = NOW(),
        completed_at = CASE WHEN v_novo_status = 'completed' THEN NOW() ELSE completed_at END
    WHERE id = p_lote_id
    RETURNING * INTO v_lote;

    -- Retornar resultado
    v_result := json_build_object(
        'success', true,
        'lote', json_build_object(
            'id', v_lote.id,
            'posicao_atual', v_lote.posicao_atual,
            'status', v_lote.status,
            'total_arrecadado', v_lote.total_arrecadado,
            'premio_total', v_lote.premio_total,
            'is_complete', v_lote.status = 'completed',
            'indice_vencedor', v_lote.indice_vencedor
        )
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- =====================================================
-- PARTE 3: ATUALIZAR FUNÇÃO DE CRIAÇÃO DE LOTE
-- =====================================================

-- Remover função antiga
DROP FUNCTION IF EXISTS public.rpc_get_or_create_lote(VARCHAR, DECIMAL, INTEGER, INTEGER);

-- Criar função atualizada (winnerIndex será -1 inicialmente)
CREATE OR REPLACE FUNCTION public.rpc_get_or_create_lote(
    p_lote_id VARCHAR(100),
    p_valor_aposta DECIMAL(10,2),
    p_tamanho INTEGER,
    p_indice_vencedor INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
    v_lote RECORD;
    v_result JSON;
BEGIN
    -- ✅ CORREÇÃO CIRÚRGICA: Buscar lote ativo que ainda não atingiu R$10
    SELECT * INTO v_lote
    FROM public.lotes
    WHERE valor_aposta = p_valor_aposta
    AND status = 'ativo'
    AND total_arrecadado < 10.00
    LIMIT 1;

    -- Se não existe, criar novo
    IF v_lote IS NULL THEN
        INSERT INTO public.lotes (
            id,
            valor_aposta,
            tamanho,
            posicao_atual,
            indice_vencedor,
            status,
            total_arrecadado,
            premio_total
        ) VALUES (
            p_lote_id,
            p_valor_aposta,
            p_tamanho,
            0,
            -1, -- ✅ CORREÇÃO CIRÚRGICA: -1 até fechar economicamente
            'ativo',
            0.00,
            0.00
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING * INTO v_lote;

        -- Se ainda não existe (conflito), buscar novamente
        IF v_lote IS NULL THEN
            SELECT * INTO v_lote
            FROM public.lotes
            WHERE id = p_lote_id;
        END IF;
    END IF;

    -- Retornar lote
    v_result := json_build_object(
        'success', true,
        'lote', json_build_object(
            'id', v_lote.id,
            'valor_aposta', v_lote.valor_aposta,
            'tamanho', v_lote.tamanho,
            'posicao_atual', v_lote.posicao_atual,
            'indice_vencedor', v_lote.indice_vencedor,
            'status', v_lote.status,
            'total_arrecadado', v_lote.total_arrecadado,
            'premio_total', v_lote.premio_total
        )
    );

    RETURN v_result;

EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- =====================================================
-- PARTE 4: COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION public.rpc_update_lote_after_shot IS 'Atualiza lote após chute - CORRIGIDO: Valida R$10 antes de fechar';
COMMENT ON FUNCTION public.rpc_get_or_create_lote IS 'Cria ou obtém lote ativo - CORRIGIDO: Busca lotes com arrecadação < R$10';

-- =====================================================
-- FIM DA CORREÇÃO CIRÚRGICA MISSÃO C
-- =====================================================

SELECT '✅ Correção cirúrgica Missão C aplicada com sucesso!' AS resultado;
```

### 4️⃣ Executar o SQL

1. **Clique no botão "Run"** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)
2. **Aguarde a execução** (pode levar alguns segundos)
3. **Verifique o resultado:**
   - ✅ Deve aparecer: `✅ Correção cirúrgica Missão C aplicada com sucesso!`
   - ❌ Se houver erros, leia a mensagem e reporte

---

## ✅ VALIDAÇÃO PÓS-APLICAÇÃO

Após executar, rode estas queries para confirmar que funcionou:

### 1. Verificar Coluna Criada

```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'metricas_globais' 
AND column_name = 'ultimo_gol_de_ouro_arrecadacao';
```

**Resultado esperado:** 1 linha com `ultimo_gol_de_ouro_arrecadacao` do tipo `numeric`

### 2. Verificar Funções Atualizadas

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('rpc_update_lote_after_shot', 'rpc_get_or_create_lote');
```

**Resultado esperado:** 2 linhas (uma para cada função)

### 3. Verificar Validação de R$10

```sql
SELECT routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'rpc_update_lote_after_shot'
AND routine_definition LIKE '%10.00%';
```

**Resultado esperado:** 1 linha (função contém validação de R$10)

---

## ⚠️ IMPORTANTE

- ✅ **Projeto correto:** `goldeouro-production` (ID: `gayopagjdrkcmkirmfvy`)
- ✅ **SQL é idempotente:** Pode ser executado múltiplas vezes sem problemas
- ✅ **Não altera dados:** Apenas adiciona estruturas e validações
- ✅ **Seguro:** Usa `IF NOT EXISTS` para evitar erros

---

## 📝 RESUMO

1. **Acesse:** https://supabase.com/dashboard
2. **Selecione:** `goldeouro-production`
3. **Abra:** SQL Editor → New query
4. **Cole:** Todo o código SQL acima
5. **Execute:** Clique em "Run"
6. **Valide:** Execute as queries de validação

**Pronto!** A migração da MISSÃO C estará aplicada. 🎉

