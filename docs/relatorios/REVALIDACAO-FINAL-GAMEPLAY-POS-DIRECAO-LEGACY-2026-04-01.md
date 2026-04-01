# REVALIDAÇÃO FINAL DO GAMEPLAY — PÓS-CORREÇÃO LEGADO

**Data:** 2026-04-01  
**API:** `https://goldeouro-backend-v2.fly.dev`  
**Premissa:** correções DDL aplicadas em produção para `resultado_legacy_jsonb` e `direcao_legacy_int` (nullable + defaults).  
**Modo:** token **apenas** da API pública; sem alteração de código, SQL ou deploy nesta etapa.

---

## 1. Resumo executivo

O fluxo **`POST /api/games/shoot`** foi **comprovado com sucesso** em produção: HTTP **200**, débito de **R$ 1,00** (saldo **30 → 29**), resposta com `result`, `contadorGlobal`, `novoSaldo` coerentes, e **linha persistida** em `public.chutes` com campos V1 e colunas legado preenchidas por default (`resultado_legacy_jsonb` = `{}`, `direcao_legacy_int` = **0**). Log Fly: `⚽ [SHOOT] Chute #312: miss por usuário ...` sem erro **500** neste pedido.

---

## 2. Login em produção

| Campo | Valor |
|--------|--------|
| `POST /api/auth/login` | **200** |
| Token | **Obtido** |
| Utilizador | Registo na mesma sessão (`POST /api/auth/register`) + login com email `revalidacao.gameplay.{timestamp}@gmail.com` / utilizador `rgame67264`. |

**Nota:** saldo inicial de registo = 0; para o teste foi definido **R$ 30** via service role **só** para o `usuario_id` de teste (procedimento já usado nas validações anteriores).

---

## 3. Saldo antes

| Campo | Valor |
|--------|--------|
| `GET /api/user/profile` | **200** |
| `usuario_id` | `9238076f-8ec0-448a-8bc3-ef835691e9a4` |
| Saldo antes | **30.00** |

---

## 4. Chute

| Campo | Valor |
|--------|--------|
| `POST /api/games/shoot` | **200** |
| Payload | `{ "direction": "C", "amount": 1 }` |
| Resposta | `success: true`; `result: "miss"`; `novoSaldo: 29`; `contadorGlobal: 312`; `loteId`: `lote_1_1775006323332_df2979bc554a`. |

**Erro 500:** **não** ocorreu neste pedido.

---

## 5. Saldo após chute

| Campo | Valor |
|--------|--------|
| `GET /api/user/profile` | **200** |
| Saldo após | **29.00** |
| Diferença | **−1.00** (coerente com aposta R$ 1,00 e `miss` sem prémio). |

---

## 6. Persistência em `public.chutes`

Última linha do utilizador de teste (consulta Supabase, service role):

| Campo | Valor observado |
|--------|-----------------|
| `id` | `1d50b0f6-4efc-4e76-9903-0ba18729f6cd` |
| `usuario_id` | `9238076f-8ec0-448a-8bc3-ef835691e9a4` |
| `lote_id` | `lote_1_1775006323332_df2979bc554a` |
| `contador_global` | **312** |
| `shot_index` | **1** |
| `direcao` | **C** |
| `resultado` | **miss** |
| `created_at` | `2026-04-01T01:47:48.50057+00:00` |
| `resultado_legacy_jsonb` | `{}` |
| `direcao_legacy_int` | **0** |
| `valor_aposta` | **1** |
| `premio` | **0** |

**Insert:** concluído; colunas legado **não** bloquearam (valores default / nullability conforme DDL aplicado).

---

## 7. Logs relevantes

```
2026-04-01T01:47:48Z ... ⚽ [SHOOT] Chute #312: miss por usuário 9238076f-8ec0-448a-8bc3-ef835691e9a4
```

*(Sem linha `❌ [SHOOT]` no mesmo instante.)*

---

## 8. Riscos remanescentes

- Outras colunas legado ou constraints podem ainda falhar em cenários não cobertos (ex.: outros valores de aposta se V1 permitir no futuro, ou condição de corrida de saldo).
- Esta bateria usou **um** chute `miss` com direção `C`; não substitui teste de matriz completa nem carga.
- Saldo de teste foi **injetado** por operação administrativa no Supabase, não por PIX real no mesmo fluxo.

---

## 9. Classificação final

**VALIDADO COM RESSALVAS**

**Motivo das ressalvas:** prova técnica com utilizador criado para o efeito e saldo ajustado manualmente; o comportamento do endpoint e da persistência **coincide** com o esperado para jogadores com saldo suficiente, mas a classificação “sem ressalvas” exigiria critérios de produto mais amplos (ex.: só com depósito real e amostragem maior).

---

## 10. Conclusão objetiva

Após as correções em **`resultado_legacy_jsonb`** e **`direcao_legacy_int`**, o **`POST /api/games/shoot`** em produção **funciona**: **200**, débito correcto, linha em **`chutes`** com campos V1 e legado compatíveis. Recomenda-se manter monitorização de logs para novos **23502** noutras colunas e, se desejado, repetir smoke com utilizador que tenha saldo apenas por **PIX** aprovado.
