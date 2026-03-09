# TRIGGER CHUTES PRODUÇÃO

**Data:** 2026-03-07  
**Modo:** READ-ONLY (apenas consultas SELECT; nenhuma alteração no banco).

---

## Resultado da tentativa automática

Foi executado o script `scripts/confirmacao-trigger-producao-readonly.js`, que tenta consultar `pg_trigger` e `pg_proc` via RPC do Supabase. O banco de produção **não expõe a função `public.exec_sql`** (ou ela não está no schema cache), portanto as consultas não puderam ser executadas por via automática.

| Item | Valor |
|------|--------|
| **Trigger encontrado** | **Não verificado** (consultas não executadas) |
| **Nome** | — |
| **Função associada** | — |
| **Evento** | AFTER INSERT ON chutes (esperado) |
| **Status** | — |
| **SQL da função** | — |
| **Conclusão** | **Confirmação automática não foi possível.** É necessário executar as queries abaixo manualmente no **SQL Editor** do Supabase (Dashboard do projeto → SQL Editor). |

---

## Queries para execução manual (SQL Editor Supabase)

Execute no Supabase → SQL Editor, uma de cada vez:

**PASSO 1 – Triggers da tabela `chutes`:**

```sql
SELECT
  tgname AS trigger_name,
  tgenabled AS enabled,
  tgtype AS trigger_type
FROM pg_trigger
WHERE tgrelid = 'public.chutes'::regclass
  AND NOT tgisinternal;
```

**PASSO 2 – Função `update_user_stats`:**

```sql
SELECT
  proname AS function_name,
  prosrc AS function_body
FROM pg_proc
WHERE proname = 'update_user_stats';
```

**Interpretação de `tgenabled`:**  
`O` = origin (ENABLED), `D` = DISABLED, `R` = REPLICA, `A` = ALWAYS.

---

## Formato da conclusão (após rodar as queries manualmente)

Preencha com o resultado real:

| Campo | Preencher |
|-------|-----------|
| **Trigger encontrado** | SIM se existir linha com `tgname = 'trigger_update_user_stats'`; caso contrário NÃO. |
| **Nome** | trigger_update_user_stats |
| **Função associada** | update_user_stats |
| **Evento** | AFTER INSERT ON chutes |
| **Status** | ENABLED se `tgenabled = 'O'`; caso contrário DISABLED ou o valor retornado. |
| **SQL da função** | Copiar o valor de `prosrc` retornado na segunda query. |
| **Conclusão** | **saldo debitado corretamente** se o trigger existir e estiver ENABLED; **saldo NÃO debitado corretamente** se o trigger não existir ou estiver DISABLED. |

---

---

## Resultado das queries do Supabase (colar aqui)

Quando você executar as duas queries no SQL Editor e tiver o resultado, cole abaixo (ou envie em nova mensagem) para fechar a conclusão e a classificação do Bloco D.

**Query 1 – Triggers (`pg_trigger`):**
```
[COLAR AQUI O RESULTADO DA QUERY 1]
```

**Query 2 – Função (`pg_proc`, update_user_stats):**
```
[COLAR AQUI O RESULTADO DA QUERY 2]
```

---

## Interpretação e conclusão (preenchido após colagem)

**Critério:**
- Se existir `trigger_update_user_stats` com `tgenabled = 'O'` e a função `update_user_stats` contiver o débito em MISS (`saldo = saldo - NEW.valor_aposta` ou equivalente) → **saldo debitado corretamente**.
- Se não existir o trigger ou estiver desativado (`tgenabled = 'D'`) → **saldo NÃO debitado corretamente**.

| Item | Valor |
|------|--------|
| Trigger encontrado | *(preencher: SIM/NÃO)* |
| Nome | trigger_update_user_stats |
| Função associada | update_user_stats |
| Evento | AFTER INSERT ON chutes |
| Status (tgenabled) | *(preencher: O=ENABLED, D=DISABLED)* |
| **Conclusão saldo** | *(preencher: saldo debitado corretamente / saldo NÃO debitado corretamente)* |
| **Classificação Bloco D** | *(preencher: VALIDADO COM RESSALVAS / EM AJUSTE TÉCNICO / RISCO CRÍTICO)* |

**Classificação do Bloco D:**
- **VALIDADO COM RESSALVAS** — trigger ativo e função com débito em MISS; demais ressalvas da auditoria Bloco D permanecem documentadas.
- **EM AJUSTE TÉCNICO** — trigger ausente ou desativado; ajuste necessário (aplicar schema com trigger ou ativar trigger) antes de validar.
- **RISCO CRÍTICO** — trigger ausente/desativado e já há indício de saldo incorreto em produção.

---

## Resumo

- **Automático:** Não foi possível confirmar (RPC `exec_sql` não disponível no projeto Supabase consultado).
- **Status atual:** Aguardando colagem dos resultados das duas queries (acima ou em nova mensagem) para fechar conclusão e classificação do Bloco D.
- **Após colar os resultados:** Interpretar conforme critério acima e atualizar este relatório e `docs/V1-VALIDATION.md` com a conclusão definitiva.
