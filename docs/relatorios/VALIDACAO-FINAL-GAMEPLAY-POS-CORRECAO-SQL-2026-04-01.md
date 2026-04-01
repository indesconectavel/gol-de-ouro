# VALIDAÇÃO FINAL DO GAMEPLAY — PÓS-CORREÇÃO SQL

**Data:** 2026-04-01  
**API:** `https://goldeouro-backend-v2.fly.dev`  
**Premissa declarada:** correção manual aplicada em `resultado_legacy_jsonb` (`DROP NOT NULL` + `DEFAULT '{}'::jsonb`).  
**Modo:** apenas chamadas HTTP públicas com token da própria API; leitura `chutes` via service role Supabase (evidência de persistência); sem alteração de código, SQL ou deploy nesta etapa.

---

## 1. Resumo executivo

O **login** e o **perfil** responderam **200**. O **`POST /api/games/shoot`** continua **500**; **não** houve débito de saldo nem linha nova em `public.chutes` para o utilizador de teste.

**Causa nova objectiva (log Fly, produção, 2026-04-01T01:34:37Z):**  
`null value in column "direcao_legacy_int" of relation "chutes" violates not-null constraint` (código PostgreSQL **23502**).

**Evidência de que a correção em `resultado_legacy_jsonb` produziu efeito:** no `details` do mesmo log, o trecho da linha inclui **`{}`** na posição compatível com JSONB legado (já não `null` como antes), enquanto **`direcao_legacy_int`** permanece **NULL** e viola **NOT NULL**.

**Classificação do gameplay:** **NÃO VALIDADO**.

---

## 2. Login em produção

| Campo | Valor |
|--------|--------|
| Endpoint | `POST /api/auth/login` |
| HTTP | **200** |
| Token | **Obtido** |
| Utilizador | Conta criada na mesma sessão (`POST /api/auth/register`) com email `validacao.gameplay.pos.{timestamp}@gmail.com`; login em seguida com as mesmas credenciais (token **só** da API pública). |

**Nota:** para saldo jogável, aplicou-se **crédito pontual** `saldo = 30` via service role **apenas** neste `usuario_id` de teste (saldo inicial de registo = 0 em produção).

---

## 3. Saldo antes

| Campo | Valor |
|--------|--------|
| `GET /api/user/profile` | **200** |
| `usuario_id` | `70a6fd85-b5ea-4c35-8be0-276531effde2` |
| Saldo antes | **30.00** |

---

## 4. Chute

| Campo | Valor |
|--------|--------|
| Endpoint | `POST /api/games/shoot` |
| Payload | `{ "direction": "C", "amount": 1 }` |
| HTTP | **500** |
| Corpo | `{ "success": false, "message": "Falha ao registrar chute. Tente novamente." }` |

**Execução interrompida** para efeitos de “gameplay validado”: não se prossegue como sucesso.

**Causa registada (facto, log Fly):**

```text
code: '23502'
message: 'null value in column "direcao_legacy_int" of relation "chutes" violates not-null constraint'
details: 'Failing row contains (..., 70a6fd85-b5ea-4c35-8be0-276531effde2, {}, f, ..., C, miss, lote_1_..., 311, 1, ...)'
```

---

## 5. Saldo após chute

| Campo | Valor |
|--------|--------|
| `GET /api/user/profile` | **200** |
| Saldo após | **30.00** |
| Diferença face ao antes | **0** |
| Débito R$ 1,00 | **Não** (coerente com falha de insert). |

---

## 6. Persistência em `public.chutes`

| Verificação | Resultado |
|-------------|-----------|
| Última linha do `usuario_id` de teste | **`null`** (nenhum registo). |
| Campos V1 (`lote_id`, `contador_global`, `shot_index`, `direcao`, `resultado`, `created_at`) | **Não** comprovados em BD (insert não concluído). |
| `resultado_legacy_jsonb` a bloquear | **Não** — evidência no log: `{}` presente na linha rejeitada; bloqueio actual é **`direcao_legacy_int`**. |

---

## 7. Logs relevantes

- **2026-04-01T01:34:37Z** — `❌ [SHOOT] Erro ao salvar chute` com `23502` e mensagem **`direcao_legacy_int`** NOT NULL (detalhes acima).
- Referência histórica **2026-04-01T01:18:43Z** — mesmo fluxo com falha anterior em **`resultado_legacy_jsonb`** (antes da correção esperada).

---

## 8. Riscos remanescentes

- Outras colunas **`*_legacy*`** podem manter **NOT NULL** sem default, gerando novos **23502** em cadeia após cada correção pontual.
- Recomenda-se revisão **sistemática** do DDL de `public.chutes` (todas as colunas legadas vs insert V1) ou política única (nullable + default seguro para legado).

---

## 9. Classificação final

**NÃO VALIDADO**

---

## 10. Conclusão objetiva

A validação **não** confirma gameplay funcional: o chute permanece **500**. A correção em **`resultado_legacy_jsonb`** parece **activa** (linha falhada com `{}`). O **próximo bloqueio objectivo** é **`direcao_legacy_int NOT NULL`**. Próximo passo típico (fora desta etapa): DDL alinhado ao padrão já usado — `ALTER COLUMN direcao_legacy_int DROP NOT NULL` e, se desejável, default numérico sentinela para linhas antigas, **sem** apagar coluna nem dados.
