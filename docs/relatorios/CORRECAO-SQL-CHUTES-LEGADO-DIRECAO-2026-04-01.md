# CORREÇÃO SQL — CHUTES LEGADO — DIRECAO

**Data:** 2026-04-01  
**Coluna:** `public.chutes.direcao_legacy_int`  
**Problema:** insert V1 não envia esta coluna; **NOT NULL** provocava **23502** em produção.

---

## 1. Resumo executivo

Foi versionado o SQL mínimo para **`DROP NOT NULL`** e **`SET DEFAULT 0`** em `direcao_legacy_int`, alinhado às regras (sem remover coluna, sem apagar dados, sem outras tabelas). **Nesta sessão de desenvolvimento não existiu ligação direta ao Postgres** (ausência de `DATABASE_URL` no ambiente do agente); por isso **não** foram executados aqui o `SELECT` de verificação nem os `ALTER` contra a base real.

**Ficheiro SQL:** `database/migration-2026-04-01-chutes-direcao-legacy-int-nullable.sql`

---

## 2. Estado antes

**Automático:** não disponível (sem query executada nesta sessão).

**Inferido por evidência de runtime (log Fly, produção):** a coluna comportava-se como **NOT NULL** sem valor no insert V1 → `null value in column "direcao_legacy_int" violates not-null constraint`.

**Recomendação:** antes de aplicar o DDL, correr no SQL Editor o `SELECT` da ETAPA 1 do ficheiro SQL e guardar o resultado como evidência “antes”.

---

## 3. SQL executado

*(A aplicar manualmente no Supabase, na ordem abaixo.)*

```sql
ALTER TABLE public.chutes
  ALTER COLUMN direcao_legacy_int DROP NOT NULL;

ALTER TABLE public.chutes
  ALTER COLUMN direcao_legacy_int SET DEFAULT 0;
```

---

## 4. Estado depois

**Automático:** não disponível até executar o `SELECT` pós-migração no projeto.

**Esperado após DDL:**

| Campo | Valor esperado |
|--------|----------------|
| `is_nullable` | **YES** |
| `column_default` | **0** (ou representação equivalente no catálogo, ex. `0` / `0::integer`) |

---

## 5. Classificação

**NÃO APLICADA** *(pelo agente nesta sessão; DDL pronto para aplicação manual no Supabase.)*

Após colar e executar o SQL no SQL Editor com sucesso, a classificação passa a **CORREÇÃO APLICADA** no ambiente alvo.

---

## 6. Próxima ação recomendada

1. Aplicar o ficheiro `database/migration-2026-04-01-chutes-direcao-legacy-int-nullable.sql` no Supabase (produção/staging conforme processo interno).
2. Confirmar com o `SELECT` pós-migração (`is_nullable`, `column_default`).
3. Repetir a **validação do gameplay** (`POST /api/games/shoot` com token da API pública). Se surgir novo **23502** noutra coluna `*_legacy*`, repetir análise sistemática do DDL de `chutes` ou documentar lista de colunas legado a tornar nullable/default.
