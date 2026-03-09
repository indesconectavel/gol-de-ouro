# Confirmação: trigger/função na tabela chutes (débito perdedor / crédito vencedor) — READ-ONLY

**Data:** 2026-03-07  
**Modo:** Somente leitura — inspeção no repositório.  
**Objetivo:** Confirmar se a tabela `chutes` em produção possui trigger/função responsável pelo débito do perdedor e crédito do vencedor na engine de LOTES do Gol de Ouro.

---

## 1. Schema real utilizado pelo projeto (tabela chutes)

O schema de referência para produção é o **schema-supabase-final.sql** (cabeçalho: "SCHEMA DEFINITIVO PARA PRODUÇÃO REAL 100%", versão v1.2.0-final-production). O README e documentação indicam aplicação desse arquivo no Supabase.

**Estrutura da tabela `chutes` no schema** (schema-supabase-final.sql, linhas 41–55):

| Coluna            | Tipo        | Uso na engine / trigger      |
|-------------------|------------|------------------------------|
| id                | UUID       | PK                           |
| usuario_id        | UUID       | FK usuarios; usado na trigger |
| lote_id           | VARCHAR(100) | Referência ao lote (em memória no server-fly) |
| direcao           | VARCHAR(10)  | TL, TR, C, BL, BR            |
| **valor_aposta**  | DECIMAL(10,2) | Débito do perdedor (trigger) |
| **resultado**     | VARCHAR(20)  | 'goal' ou 'miss' (CHECK)     |
| **premio**        | DECIMAL(10,2) | Crédito vencedor (trigger)   |
| **premio_gol_de_ouro** | DECIMAL(10,2) | Crédito vencedor (trigger) |
| is_gol_de_ouro    | BOOLEAN    | —                            |
| contador_global   | INTEGER    | —                            |
| shot_index        | INTEGER    | —                            |
| created_at        | TIMESTAMPTZ | —                            |

O **server-fly.js** insere em `chutes` usando exatamente esses nomes: `usuario_id`, `valor_aposta`, `resultado`, `premio`, `premio_gol_de_ouro` (linhas 1298–1315). Há compatibilidade entre código e schema de referência.

---

## 2. Triggers ativas na tabela chutes (no schema do repositório)

No **schema-supabase-final.sql** existem **duas** triggers na tabela `public.chutes`:

| Trigger                   | Momento     | Função associada         | Finalidade |
|---------------------------|------------|---------------------------|------------|
| **trigger_update_metrics**     | AFTER INSERT | `update_global_metrics()` | Atualizar `metricas_globais` (contador_chutes_global, ultimo_gol_de_ouro) |
| **trigger_update_user_stats**  | AFTER INSERT | `update_user_stats()`     | Atualizar saldo e estatísticas do usuário (débito/crédito financeiro) |

Ambas são **AFTER INSERT** e **FOR EACH ROW**, executadas na ordem em que aparecem no script (primeiro métricas, depois user_stats).

---

## 3. Função associada à trigger financeira

**Nome:** `update_user_stats()`  
**Arquivo:** schema-supabase-final.sql, linhas 299–325.  
**Linguagem:** plpgsql.

**Definição (trecho relevante):**

```sql
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar total de apostas
    UPDATE public.usuarios 
    SET total_apostas = total_apostas + 1,
        updated_at = NOW()
    WHERE id = NEW.usuario_id;
    
    -- Se ganhou, atualizar total de ganhos
    IF NEW.resultado = 'goal' THEN
        UPDATE public.usuarios 
        SET total_ganhos = total_ganhos + NEW.premio + NEW.premio_gol_de_ouro,
            saldo = saldo + NEW.premio + NEW.premio_gol_de_ouro,
            updated_at = NOW()
        WHERE id = NEW.usuario_id;
    ELSE
        -- Se perdeu, descontar aposta do saldo
        UPDATE public.usuarios 
        SET saldo = saldo - NEW.valor_aposta,
            updated_at = NOW()
        WHERE id = NEW.usuario_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger que a chama** (linhas 328–332):

```sql
DROP TRIGGER IF EXISTS trigger_update_user_stats ON public.chutes;
CREATE TRIGGER trigger_update_user_stats
    AFTER INSERT ON public.chutes
    FOR EACH ROW
    EXECUTE FUNCTION update_user_stats();
```

---

## 4. Comportamento financeiro da trigger

| Condição                | Ação na tabela `usuarios` |
|-------------------------|---------------------------|
| **Sempre**              | `total_apostas = total_apostas + 1` |
| **NEW.resultado = 'goal'** | `total_ganhos += NEW.premio + NEW.premio_gol_de_ouro`; `saldo += NEW.premio + NEW.premio_gol_de_ouro` |
| **NEW.resultado ≠ 'goal'** (miss) | `saldo = saldo - NEW.valor_aposta` |

Confirmação direta:

- **Débito do perdedor:** Sim. Quando `resultado != 'goal'`, a função debita `valor_aposta` do saldo do usuário.
- **Crédito do vencedor:** Sim. Quando `resultado = 'goal'`, a função credita `premio + premio_gol_de_ouro` no saldo (e em `total_ganhos`).

A trigger não desconta a aposta do vencedor; isso é tratado no backend (ver seção 6).

---

## 5. Confirmação de que a trigger está aplicada no ambiente real de produção

**Limitação (modo READ-ONLY):** Não foi executada nenhuma consulta no banco de produção (Supabase). A confirmação abaixo é **somente com base no repositório**.

- **No repositório:** A única definição da trigger e da função `update_user_stats` para a tabela `chutes` está em **schema-supabase-final.sql**, indicado como schema definitivo para produção.
- **Documentação:** Vários relatórios (ex.: RELATORIO-FECHAMENTO-CONTABIL-MINIMO-PROD-2026-02-05, RELATORIO-AUDITORIA-FINANCEIRA-TOTAL-PROD-2026-02-05) assumem que o schema em produção está alinhado ao schema-supabase-final.sql e que a trigger de chutes está aplicada. Não há no repo evidência de que essa trigger tenha sido removida ou substituída em produção.
- **Outras tabelas:** Relatórios de auditoria (ex.: AUDITORIA-USUARIO_ID-VS-USER_ID-2026-03-04) indicam que, em produção, as tabelas do domínio (incluindo `chutes`) usam a coluna `usuario_id`, consistente com o schema-supabase-final.sql. Isso sugere que o mesmo schema (e portanto as triggers) foi aplicado, mas não prova a existência atual da trigger.

**Para confirmar no ambiente real**, é necessário executar no Supabase (SQL Editor ou conexão postgres) uma consulta somente leitura, por exemplo:

```sql
-- Triggers na tabela chutes
SELECT tgname AS trigger_name, proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.chutes'::regclass AND NOT tgisinternal;
```

Se `trigger_update_user_stats` e a função `update_user_stats` aparecerem, a trigger está aplicada em produção. Sem essa verificação, a conclusão permanece **com base no schema do repositório e na documentação**.

---

## 6. Dependência da engine em relação a esse mecanismo

A engine de lotes em **server-fly.js** depende da trigger para manter o saldo consistente da seguinte forma:

| Caso      | Quem altera o saldo | Papel da trigger |
|-----------|----------------------|------------------|
| **Perdedor (miss)** | Apenas a trigger | O código **não** debita. O comentário no server-fly (linha ~1347) diz: "Perdas: gatilho do banco subtrai 'valor_aposta' automaticamente". Sem a trigger, o perdedor não perde o valor da aposta — **falha crítica**. |
| **Vencedor (goal)** | Trigger + API | A trigger credita `premio + premio_gol_de_ouro`. Em seguida, a API faz um **UPDATE explícito** com `novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro` (usando o saldo lido **antes** do INSERT). Esse UPDATE sobrescreve o saldo, resultando no valor correto (saldo anterior − aposta + prêmios). Assim, o vencedor fica correto mesmo que a trigger não existisse; a trigger evita que o saldo fique temporariamente errado e mantém `total_ganhos` e `total_apostas` corretos. |

Resumo:

- **Perdedor:** a engine **depende obrigatoriamente** da trigger para debitar `valor_aposta`. Sem ela, o saldo do perdedor não é reduzido.
- **Vencedor:** a engine garante o saldo final correto via UPDATE explícito; a trigger é importante para crédito imediato e para `total_ganhos`/`total_apostas`, mas o saldo final do vencedor seria matematicamente correto mesmo sem a trigger (apenas com o UPDATE da API).

---

## 7. Compatibilidade com a engine por lotes

- A trigger usa **apenas** as colunas que a engine preenche no INSERT: `usuario_id`, `resultado`, `valor_aposta`, `premio`, `premio_gol_de_ouro`.
- Os valores possíveis de `resultado` no schema são `'goal'` e `'miss'`, iguais aos enviados pelo server-fly (`result` no código = `'goal'` ou `'miss'`).
- O fluxo por lote (um chute por vez, INSERT por chute, um vencedor por lote) não altera o comportamento da trigger: ela é **FOR EACH ROW** e trata cada INSERT de forma independente.

Conclusão: a trigger é **compatível** com a engine por lotes tal como implementada no server-fly.js.

---

## 8. Conclusão final

| Item | Resultado |
|------|-----------|
| **Triggers existentes na tabela chutes (no schema do repo)** | `trigger_update_metrics` (métricas globais) e `trigger_update_user_stats` (saldo e estatísticas do usuário). |
| **Função associada à trigger financeira** | `update_user_stats()` (schema-supabase-final.sql, linhas 299–325). |
| **Comportamento financeiro** | Débito de `valor_aposta` quando `resultado != 'goal'`; crédito de `premio + premio_gol_de_ouro` quando `resultado = 'goal'`; sempre incrementa `total_apostas`. |
| **Compatibilidade com a engine por lotes** | Total: colunas e valores usados no INSERT pelo server-fly coincidem com os usados na trigger. |
| **Engine depende desse mecanismo?** | **Sim para o perdedor** (débito só pela trigger). Para o vencedor, o saldo final é garantido pelo UPDATE explícito na API; a trigger complementa o crédito e as estatísticas. |
| **Trigger aplicada em produção?** | Não verificado ao vivo. No repositório, o schema de referência é o schema-supabase-final.sql; a confirmação em produção requer a execução da query em `pg_trigger`/`pg_proc` no banco real (ex.: query da seção 5). |

**Recomendação:** Executar no Supabase de produção a consulta de listagem de triggers na tabela `chutes` (seção 5) para confirmar a presença de `trigger_update_user_stats` e da função `update_user_stats`. Enquanto isso não for feito, considerar como risco residual a possibilidade de a trigger não estar aplicada e, portanto, o saldo dos perdedores não ser debitado.

---

*Relatório gerado em modo READ-ONLY. Nenhuma alteração foi feita em código ou banco.*
