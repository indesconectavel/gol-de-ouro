# CONFIRMAÇÃO TRIGGER SALDO CHUTES — READ-ONLY

**Data:** 2026-03-07  
**Modo:** Inspeção exclusiva no repositório (sem acesso ao banco Supabase de produção).  
**Objetivo:** Confirmar com evidência real se o sistema de saldo possui o trigger responsável pelo débito de chute perdido.

---

## Resumo obrigatório

### Trigger existe?

**NO REPOSITÓRIO: SIM** — definido em `schema-supabase-final.sql`.  
**EM PRODUÇÃO: NÃO CONFIRMADO** — a auditoria não executa queries no banco; a confirmação em produção exige consulta a `pg_trigger` / `pg_proc` no Supabase real.

### Nome do trigger

- **trigger_update_user_stats** (atualiza saldo e estatísticas do usuário)
- **trigger_update_metrics** (apenas metricas_globais; não altera saldo)

### Função associada (à que debita/credita saldo)

**update_user_stats()**

### SQL da função

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

**Fonte:** `schema-supabase-final.sql`, linhas 299–325.

### O que acontece em MISS

- A função executa o ramo `ELSE`.
- **UPDATE public.usuarios** com:
  - `saldo = saldo - NEW.valor_aposta`
  - `updated_at = NOW()`
- **total_apostas** já foi incrementado em +1 no primeiro UPDATE do mesmo trigger.
- Ou seja: em chute perdido o saldo **é debitado** (R$ 1,00) e total_apostas sobe em 1.

### O que acontece em GOAL

- A função executa o ramo `IF NEW.resultado = 'goal'`.
- **UPDATE public.usuarios** com:
  - `total_ganhos = total_ganhos + NEW.premio + NEW.premio_gol_de_ouro`
  - `saldo = saldo + NEW.premio + NEW.premio_gol_de_ouro`
  - `updated_at = NOW()`
- **total_apostas** já foi incrementado em +1 no primeiro UPDATE.
- Ou seja: em chute vencedor o saldo **é creditado** com prêmio + prêmio gol de ouro, e total_ganhos é atualizado.

### Impacto no saldo

| Evento   | Ação no saldo (pela função) | total_apostas | total_ganhos |
|----------|-----------------------------|---------------|--------------|
| INSERT chute **miss** | `saldo = saldo - valor_aposta` (-R$ 1,00) | +1 | — |
| INSERT chute **goal** | `saldo = saldo + premio + premio_gol_de_ouro` | +1 | + premio + premio_gol_de_ouro |

O **server-fly.js** ainda faz, somente em caso de **goal**, um UPDATE explícito em `usuarios.saldo` com `novoSaldoVencedor = user.saldo - amount + premio + premioGolDeOuro` (linhas 1346–1358), sobrescrevendo o saldo para o valor correto (aposta descontada + prêmios). Para **miss** não há update de saldo no Node; o débito depende **apenas** do trigger.

### Conclusão

- **Se o trigger `trigger_update_user_stats` existir e estiver ativo na tabela `chutes` em produção:**  
  **O saldo é debitado corretamente** em chute perdido (e creditado pelo trigger em goal; o Node ajusta o valor final do vencedor).

- **Se o trigger NÃO existir em produção (ex.: schema aplicado foi o consolidado sem essa trigger):**  
  **O saldo NÃO é debitado** em chute perdido; apenas o INSERT em `chutes` ocorre, e o usuário mantém o saldo anterior — risco crítico para o Bloco D.

---

## 1. Triggers ligados à tabela `chutes` (repositório)

Inspeção em todos os arquivos `.sql` do repositório:

| Arquivo | Nome do trigger | Função | Evento | Altera usuarios.saldo? |
|---------|-----------------|--------|--------|------------------------|
| **schema-supabase-final.sql** | trigger_update_metrics | update_global_metrics() | AFTER INSERT | Não |
| **schema-supabase-final.sql** | trigger_update_user_stats | update_user_stats() | AFTER INSERT | Sim (miss: −valor_aposta; goal: +premio+premio_gol_de_ouro) |
| SCHEMA-SUPABASE-REAL-FINAL.sql | update_chutes_updated_at | update_updated_at_column() | BEFORE UPDATE | Não |
| SCHEMA-SUPABASE-100-REAL-FIXED.sql | update_chutes_updated_at | update_updated_at_column() | BEFORE UPDATE | Não |
| SCHEMA-SUPABASE-SEGURO-SEM-DROP.sql | update_chutes_updated_at | update_updated_at_column() | BEFORE UPDATE | Não |

**SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql:** não define **nenhum** trigger na tabela `chutes` (apenas triggers de `update_updated_at_column()` em outras tabelas: usuarios, metricas_globais, lotes, pagamentos_pix, saques, configuracoes_sistema).

---

## 2. Comandos SQL que alteram `usuarios.saldo`

Busca por padrões que alteram `usuarios.saldo` em arquivos SQL:

| Arquivo | Trecho | Operação |
|---------|--------|----------|
| schema-supabase-final.sql | `saldo = saldo + NEW.premio + NEW.premio_gol_de_ouro` | Crédito (goal) |
| schema-supabase-final.sql | `saldo = saldo - NEW.valor_aposta` | Débito (miss) |

Nenhum outro arquivo `.sql` do repositório contém trigger/função que atualize `usuarios.saldo` em resposta a INSERT em `chutes`. A única definição que debita saldo em chute perdido está na função **update_user_stats()** em **schema-supabase-final.sql**.

---

## 3. Trigger ativo na tabela `chutes` em produção

**Não foi possível confirmar.** Esta auditoria é somente leitura e não executa queries no banco Supabase. Para confirmar em produção:

- Listar triggers da tabela `chutes`, por exemplo:
  - `SELECT tgname, tgtype, tgenabled FROM pg_trigger WHERE tgrelid = 'public.chutes'::regclass;`
- Verificar se a função existe:
  - `SELECT prosrc FROM pg_proc WHERE proname = 'update_user_stats';`

O script **aplicar-schema-deploy.js** lê e aplica **schema-supabase-final.sql** (linha 25: `fs.readFileSync('schema-supabase-final.sql', 'utf8')`). Se a produção tiver sido aplicada com esse script (ou com o conteúdo desse arquivo), a trigger e a função estariam presentes, a menos que tenham sido removidas ou alteradas depois.

Se a produção tiver sido aplicada com **SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql**, a trigger **não** existe (esse schema não define trigger em `chutes` que altere saldo).

---

## 4. Se não existir trigger

Se em produção **não** existir o trigger `trigger_update_user_stats` (ou a função `update_user_stats`) na tabela `chutes`:

- **Chute perdido não debita saldo.** O server-fly.js não faz UPDATE em `usuarios.saldo` para resultado `miss`; apenas insere na tabela `chutes`. O usuário permanece com o mesmo saldo após o chute perdido.
- Consequência: saldo inflado, prejuízo para o jogo e Bloco D não validado.

---

## 5. Trigger alternativo que atualize saldo

Nenhum outro trigger no repositório (em nenhuma tabela) altera `usuarios.saldo` com base em INSERT/UPDATE em `chutes`. A única lógica de débito/crédito de saldo por chute está em **update_user_stats()** em **schema-supabase-final.sql**.

---

## 6. Atualização de `total_apostas` e `total_ganhos`

Sim. A mesma função **update_user_stats()** (schema-supabase-final.sql, linhas 299–325):

- **total_apostas:** sempre incrementado em +1 no primeiro UPDATE (para qualquer resultado).
- **total_ganhos:** incrementado apenas quando `NEW.resultado = 'goal'`, com `total_ganhos + NEW.premio + NEW.premio_gol_de_ouro`.

Não há no repositório outra função/trigger que atualize total_apostas ou total_ganhos a partir de `chutes`.

---

## 7. Função `update_user_stats` ativa ou apenas em schema antigo?

- **No repositório:** a função e a trigger estão definidas apenas em **schema-supabase-final.sql**, que o projeto trata como schema definitivo para produção (README, aplicar-schema-deploy.js, documentação de auditoria).
- **Schema “antigo” vs “consolidado”:** o **SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql** (v1.2.0) **não** contém a função `update_user_stats` nem a trigger `trigger_update_user_stats` em `chutes`. Ou seja, a lógica de débito/crédito de saldo por chute **não** está no schema consolidado; está apenas no **schema-supabase-final.sql**.
- **Conclusão:** `update_user_stats` está presente e é a única definição no repo que debita/credita saldo e atualiza total_apostas/total_ganhos em INSERT em `chutes`. Se em produção tiver sido aplicado o consolidado (e não o schema-supabase-final.sql), a função/trigger **não** estarão ativas.

---

## Confirmação final (bloqueador Bloco D)

| Pergunta | Resposta |
|----------|----------|
| Trigger de débito de chute perdido existe no **repositório**? | **Sim** — em schema-supabase-final.sql (trigger_update_user_stats → update_user_stats). |
| Trigger ativo em **produção**? | **Não confirmado** — exige consulta ao banco (pg_trigger/pg_proc). |
| Saldo é debitado corretamente em miss **se** o trigger existir? | **Sim** — a função faz `saldo = saldo - NEW.valor_aposta` no ELSE. |
| Saldo é debitado corretamente em miss **se** o trigger não existir? | **Não** — o Node não debita em miss; chute perdido não alteraria saldo. |

**Recomendação:** Executar no Supabase de produção as queries de listagem de triggers e da função (seção 3) para fechar a confirmação e liberar a validação do Bloco D.
