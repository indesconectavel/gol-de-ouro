# VALIDAÇÃO FINAL — GAMEPLAY + SAQUE + HISTÓRICO

**Data:** 2026-04-01  
**Ambiente API:** `https://goldeouro-backend-v2.fly.dev`  
**Modo:** automação com token **apenas** emitido pela API pública (`POST /api/auth/login`). Sem alteração de código nem SQL nesta etapa.

---

## 1. Resumo executivo

- **Login e saque ponta a ponta:** comprovados com HTTP **200** / **201**, persistência em `saques` com **`fee`** e **`net_amount`**, histórico coerente e saldo final consistente com o débito do saque (**R$ 5,00**).
- **Chute / gameplay:** **falhou** com HTTP **500**; não há linha nova em `chutes` para o utilizador de teste. Log Fly: violação **`NOT NULL`** em **`resultado_legacy_jsonb`** no insert.
- **Conclusão:** o percurso financeiro (RPC + fallback já deployados + SQL aplicado) está **funcional** para o pedido de saque testado; o **chute não está validado** até corrigir o schema (ex.: `resultado_legacy_jsonb` nullable ou default para linhas V1) ou ajustar o insert — **fora do escopo desta etapa**.

---

## 2. Login em produção

| Campo | Valor |
|--------|--------|
| Endpoint | `POST /api/auth/login` |
| HTTP | **200** |
| Utilizador | Conta criada na mesma sessão via `POST /api/auth/register` (email `validacao.pontaaponta.{timestamp}@gmail.com`); em seguida **login explícito** com as mesmas credenciais. |
| Token | **Obtido** no corpo JSON (`token`); utilizado em todas as chamadas seguintes. |

**Nota operacional:** o saldo inicial de utilizador novo em produção é **R$ 0,00**. Para permitir chute (R$ 1) e saque (valor > taxa), foi aplicado **uma única** atualização de saldo via **service role** Supabase (`saldo = 50`) **apenas para este utilizador de teste**, antes do login. Isto não substitui depósito PIX real; documenta-se como **limitação da automação**.

---

## 3. Saldo antes

| Campo | Valor |
|--------|--------|
| `GET /api/user/profile` | **200** |
| Saldo antes | **50.00** (após crédito de teste descrito acima) |
| `usuario_id` | `85872488-9e4c-42df-8978-7f9ef9f5cb00` |

---

## 4. Chute

| Campo | Valor |
|--------|--------|
| Endpoint | `POST /api/games/shoot` |
| Payload | `{ "direction": "C", "amount": 1 }` |
| HTTP | **500** |
| Corpo | `{ "success": false, "message": "Falha ao registrar chute. Tente novamente." }` |

**Execução interrompida para o objetivo “chute válido”:** sim; etapas seguintes (saque, etc.) foram executadas para documentar o restante fluxo, com registo explícito de que o chute **não** foi bem-sucedido.

---

## 5. Saldo após chute

| Campo | Valor |
|--------|--------|
| `GET /api/user/profile` | **200** |
| Saldo | **50.00** (inalterado face ao antes) |
| Débito de R$ 1,00 | **Não** observado (coerente com falha de persistência do chute). |

---

## 6. Persistência em `chutes`

| Verificação | Resultado |
|-------------|-----------|
| Consulta Supabase (service role) | `SELECT` mais recente por `usuario_id` = `85872488-9e4c-42df-8978-7f9ef9f5cb00` → **`null`** (nenhuma linha). |
| Campos V1 (`contador_global`, `lote_id`, etc.) | **Não** comprovados em linha nova (insert não concluído). |

**Evidência adicional (log Fly, 2026-04-01T01:18:43Z):**

- `❌ [SHOOT] Erro ao salvar chute`
- `message: 'null value in column "resultado_legacy_jsonb" of relation "chutes" violates not-null constraint'`
- `details: 'Failing row contains (..., null, 85872488-9e4c-42df-8978-7f9ef9f5cb00, ...'` — entre outros campos, aparecem valores compatíveis com o insert V1 (`direcao` C, `resultado` miss, `lote_id`, contador **310**, etc.), mas **`resultado_legacy_jsonb`** fica **NULL** e a constraint impede o commit.

---

## 7. Saque

| Campo | Valor |
|--------|--------|
| Endpoint | `POST /api/withdraw/request` |
| Payload | `valor: 5`, `chave_pix: validacao.goldeouro.e2e@gmail.com`, `tipo_chave: email` |
| HTTP | **201** |
| Resposta | `success: true`, `data.id` = `baab82a8-2cdd-456a-bf14-bd815544b3bf`, `amount: 5`, `status: pending` |

Log Fly (mesmo segundo): `💰 [SAQUE] Atómico OK R$ 5 user=85872488-... (líquido informativo R$ 3, taxa R$ 2)`.

---

## 8. Persistência em `saques`

Consulta Supabase (service role), última linha do utilizador:

| Campo | Valor observado |
|--------|-----------------|
| `id` | `baab82a8-2cdd-456a-bf14-bd815544b3bf` |
| `usuario_id` | `85872488-9e4c-42df-8978-7f9ef9f5cb00` |
| `amount` / `valor` | **5** |
| `fee` | **2** |
| `net_amount` | **3** |
| `status` | `pendente` |
| `created_at` | `2026-04-01T01:18:43.934421+00:00` |
| `pix_key` | `validacao.goldeouro.e2e@gmail.com` |

---

## 9. Histórico

| Campo | Valor |
|--------|--------|
| `GET /api/withdraw/history` | **200** |
| Primeiro item | Mesmo `id` `baab82a8-2cdd-456a-bf14-bd815544b3bf`, `amount` 5, `fee` **2**, `net_amount` **3**, `status` `pendente`, chave PIX coerente. |

---

## 10. Saldo final

| Campo | Valor |
|--------|--------|
| `GET /api/user/profile` | **200** |
| Saldo final | **45.00** |
| Coerência | **50** (antes do chute falhar, inalterado) **− 5** (saque bruto) = **45**. O chute não debitou; saldo final **bate** com “sem débito de chute + débito de saque”. |

---

## 11. Logs relevantes

Trecho Fly (produção) citado na secção 6 e 7:

- Falha de insert em `chutes` com **`resultado_legacy_jsonb` NOT NULL**.
- Sucesso atómico de saque com mensagem de taxa / líquido informativo.

*(Timestamps em UTC nos logs: ~`2026-04-01T01:18:43Z`.)*

---

## 12. Limitações da execução

1. **Saldo de teste:** crédito manual de R$ 50 via service role para viabilizar API sem PIX real nesta bateria.
2. **Utilizador novo:** registo + login; credenciais não reproduzidas integralmente neste relatório (privacidade).
3. **Chute:** falha objetiva documentada; não se assume persistência V1 até correção de DDL ou de política de preenchimento da coluna legado.
4. **Saque:** não comprova payout concluído no Mercado Pago — apenas criação do pedido e campos financeiros na BD.

---

## 13. Classificação final

**NÃO VALIDADO**

**Motivo:** o objetivo incluía **1 chute válido persistido** e **débito correto do chute**; ambos **não** foram cumpridos (HTTP **500**, sem linha em `chutes`). O ramo **saque + histórico + `fee`/`net_amount`** foi **comprovado com sucesso**.

---

## 14. Conclusão objetiva

A API pública aceitou **login** e executou **saque** com RPC atómica, preenchendo **`fee`** e **`net_amount`**, refletindo no **histórico** e no **saldo**. O **chute** continua **bloqueado** por constraint **`resultado_legacy_jsonb NOT NULL`** após a migração V1 — é **pré-requisito de nova cirurgia SQL** (tornar a coluna legado nullable/default ou preencher no backend) antes de reclamar validação ponta a ponta **sem ressalvas** no gameplay.
