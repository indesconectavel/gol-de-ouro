# Smoke test de produção — V1 Gol de Ouro

**Objetivo:** validar o caminho feliz **ponta a ponta** no ambiente público real (Fly + Supabase + Mercado Pago), após o deploy.  
**Base:** `RELATORIO-MESTRE-V1-GOLDEOURO.md`, `MAPA-ENDPOINTS-V1.md`, `RUNBOOK-OPERACIONAL-V1.md`, `CHECKLIST-GO-NO-GO-V1.md`.  
**Data:** 2026-03-29  

**Pré-condições:** `CHECKLIST-DEPLOY-FLY-MP-V1.md` concluído (secrets, scale=1, webhook MP, RPC se aplicável).  
**Registo:** anotar hora (UTC-3 ou UTC), URL base, utilizador de teste, ID MP do PIX, resultados **OK/FALHA**.

---

## Legenda

- **API** = `{BACKEND_URL}` sem barra final (ex.: `https://goldeouro-backend-v2.fly.dev`).  
- **JWT** = token devolvido no login, header `Authorization: Bearer <token>`.  
- **Admin** = header `x-admin-token: <ADMIN_TOKEN>` (igual ao configurado no servidor e no build do admin).

---

## 1. Login

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 1.1 | `POST {API}/api/auth/login` — corpo: credenciais de utilizador de teste | `200`; corpo com token JWT utilizável nas rotas protegidas. |
| 1.2 | (Opcional) `POST {API}/api/auth/register` se não existir utilizador | `201` ou `200` conforme política; depois login. |

**FALHA comum:** CORS se o teste for a partir de um origin não permitido; nesse caso repetir com `curl`/Postman ou a partir do domínio do player em produção.

---

## 2. Gerar PIX

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 2.1 | `POST {API}/api/payments/pix/criar` — header JWT; corpo `{ "amount": 1 }` (V1: valor mínimo 1; máximo 1000 no código) | `200`; `data` com `qr_code` / identificadores de pagamento MP. |
| 2.2 | Resposta **503** «pagamento indisponível» | Indica `mercadoPagoConnected` falso ou MP indisponível — **parar** e corrigir token/env antes de continuar. |
| 2.3 | Resposta **500** com `mercado_pago_payment_id` | Possível **órfão MP** — seguir `RUNBOOK-OPERACIONAL-V1` secção 1; não repetir pagamento à cegas. |

---

## 3. Pagar PIX

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 3.1 | Concluir pagamento no fluxo **Mercado Pago** (app instituição / sandbox, conforme token usado) | No painel MP, pagamento com estado **aprovado** (`approved`). |

Este passo é **externo** à API; sem pagamento aprovado, os passos 4–5 não fecham.

---

## 4. Validar crédito

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 4.1 | Supabase: tabela `pagamentos_pix` para o `payment_id` do passo 2 | `status` passa a **`approved`** após webhook/reconcile. |
| 4.2 | Logs da app | `💰 [PIX-CREDIT] RPC crédito OK` **ou** log de crédito em fallback JS; **sem** `❌ [WEBHOOK] creditar PIX: pix_not_found` para este ID (salvo órfão). |
| 4.3 | `GET {API}/api/payments/pix/usuario` com JWT | Lista contém o pagamento com estado coerente (normalização `amount`/`valor` no cliente). |

---

## 5. Validar saldo

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 5.1 | `GET {API}/api/user/profile` com JWT | Campo de saldo (`saldo` ou estrutura exposta pelo profile) reflete o crédito do PIX (ex.: +1 BRL). |

Se o saldo não bater: cruzar com `pagamentos_pix` e `RUNBOOK` secção 3 (saldo incorreto).

---

## 6. Executar chute

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 6.1 | `POST {API}/api/games/shoot` com JWT — corpo conforme contrato do player (V1: aposta fixa **1** real no endpoint atual) | `200` em caminho feliz; saldo debitado e eventual prémio aplicados no mesmo fluxo documentado na auditoria de saldo. |
| 6.2 | Saldo insuficiente | `4xx` coerente (não prosseguir sem novo depósito). |

---

## 7. Validar resultado do chute

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 7.1 | Corpo da resposta do shoot | Direção, resultado (gol / defesa / etc.) e valores alinhados ao que o player mostra. |
| 7.2 | Supabase: tabela `chutes` | Nova linha para o utilizador com `valor_aposta` / prémios coerentes. |
| 7.3 | `GET {API}/api/user/profile` | Saldo após chute consistente com débito/prémio. |

---

## 8. Abrir admin

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 8.1 | A partir do **goldeouro-admin** em produção (build com `VITE_API_URL` / token corretos) | UI carrega sem erro de rede para `{API}/api/admin/...`. |
| 8.2 | `GET {API}/api/admin/stats` com `x-admin-token` | `200`; dados agregados. |
| 8.3 | **401** sem token ou token errado | Confirma proteção do router admin. |

**Nota (auditoria J):** se o SPA admin usar cliente legado ou URL errada, o smoke falha na UI mesmo com API saudável — nesse caso validar primeiro com `curl` (8.2) e alinhar build do admin.

---

## 9. Logs críticos (conferência)

Após o teste, rever logs do Fly (ou agregador) pelos prefixos do `RUNBOOK-OPERACIONAL-V1.md`:

| Prefixo / padrão | Significado |
|------------------|-------------|
| `❌ [PIX-ORFAO-MP]` | Incidência grave no fluxo de criação — requer playbook. |
| `❌ [WEBHOOK] Signature inválida` | Com secret: investigar assinatura; em prod deve correlacionar com **401**. |
| `❌ [WEBHOOK] creditar PIX:` | Ver motivo (`pix_not_found`, `rpc_error`, …). |
| `⚠️ [PIX-CREDIT] RPC … indisponível` | RPC não aplicada ou erro PostgREST — crédito pode ter ido por fallback JS. |
| `⚽ [SHOOT]` / `❌ [SHOOT]` | Sucesso ou falha de persistência do chute. |
| `✅ [RECON]` | Crédito tardio via reconcile (se aplicável). |

---

## 10. Reenviar webhook e confirmar idempotência

| # | Ação | Resultado esperado |
|---|------|-------------------|
| 10.1 | No painel Mercado Pago, **reenviar notificação** para o **mesmo** pagamento já creditado | Novo `POST` em `/api/payments/webhook`; servidor responde **200** cedo como de costume. |
| 10.2 | Logs | `📨 [WEBHOOK] Pagamento já processado` ou mensagem equivalente de idempotência; **sem** segundo incremento indevido de saldo. |
| 10.3 | Supabase | Uma linha `approved` por `payment_id`; saldo final igual ao esperado após um único crédito do valor do PIX. |

Referência: `RUNBOOK-OPERACIONAL-V1.md` secções 2.2 e 2.3.

---

## Encerramento

| Critério | OK? |
|----------|-----|
| Todos os passos 1–8 sem FALHA bloqueante | ☐ |
| Passo 10 idempotência confirmado | ☐ |
| Nenhum item **Bloqueia = SIM** pendente no `CHECKLIST-GO-NO-GO-V1.md` | ☐ |

Se OK: registar **SMOKE TEST PRODUÇÃO V1 PASS** com data e responsável.  
Se FALHA: abrir ticket com endpoint, status HTTP, trecho de log e `payment_id` MP (se aplicável).

---

*Fim do smoke test.*
