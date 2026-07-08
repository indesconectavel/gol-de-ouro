# V1.FINAL — Live Demonstration Plan

**Objetivo:** roteiro operacional real para reunião com sócios/investidores  
**Duração total:** ~25–35 minutos (demo core ~15 min)  
**Modo:** somente leitura em produção — **sem alterar dados financeiros sem consentimento**

---

## Pré-requisitos

| Item | Verificação |
|------|-------------|
| Conta demo com saldo baixo | Criada previamente |
| Credenciais admin | Testadas |
| Terminal com `curl` ou script | Opcional |
| Navegador limpo / aba anônima | Recomendado |
| Plano B documentado abaixo | Lido |

---

## Sequência ideal

| # | Bloco | Tempo | O que mostrar |
|---|-------|------:|---------------|
| 1 | Abertura técnica | 2 min | `/meta` + `/health` |
| 2 | Segurança webhook | 3 min | POST sem HMAC → 401 |
| 3 | Login jogador | 2 min | Auth + dashboard |
| 4 | Gameplay | 5 min | Fila + 2–3 chutes |
| 5 | PIX (opcional) | 5 min | Criar cobrança OU mostrar histórico |
| 6 | Ledger / integridade | 3 min | Admin ou relatório V1.2A |
| 7 | Admin operacional | 3 min | Usuários / saques (read-only se possível) |
| 8 | Observabilidade | 2 min | Script continuous-verification (terminal) |
| 9 | Gates & runbooks | 2 min | pre-deploy-gate output + índice runbooks |
| 10 | Fechamento | 2 min | Certificação 88/100 |

---

## 1. Runtime validation

### `/meta`

```bash
curl -s https://goldeouro-backend-v2.fly.dev/meta | jq .
```

**Esperado:** `gitCommit` = `a83c3cffcc998ed3d1bd8d2e88619a9b03afb634`

### `/health`

```bash
curl -s https://goldeouro-backend-v2.fly.dev/health | jq .
```

**Esperado:** `status: ok`, `database: connected`, `mercadoPago: connected`

### `/health/workers`

```bash
curl -s https://goldeouro-backend-v2.fly.dev/health/workers | jq .
```

**Esperado:** HTTP 200, `payoutPixProcessingEnabled: true`

**Narrativa:** “Cada deploy é rastreável por SHA; health confirma dependências críticas.”

---

## 2. Webhook protection (read-only)

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST \
  https://goldeouro-backend-v2.fly.dev/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d '{"action":"payment.updated","data":{"id":"000000000000000"}}'
```

**Esperado:** `401`

Repetir para payout:

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST \
  https://goldeouro-backend-v2.fly.dev/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d '{"type":"payment","data":{"id":"000000000000000"}}'
```

**Narrativa:** “Atacante sem chave HMAC não credita um centavo.”

---

## 3. Login jogador

| Passo | Ação |
|-------|------|
| 1 | Abrir `https://www.goldeouro.lol` |
| 2 | Login conta demo |
| 3 | Confirmar saldo visível |

**Fallback:** usar `app.goldeouro.lol` se DNS principal falhar.

**Ponto crítico:** sessão expirada — ter senha backup.

---

## 4. Gameplay

| Passo | Ação |
|-------|------|
| 1 | Entrar na fila |
| 2 | Executar 2–3 chutes |
| 3 | Mostrar feedback visual / áudio |

**Tempo máximo:** 5 min — não competir partida completa.

**Fallback:** vídeo gravado curto (30s) se WebSocket instável.

---

## 5. PIX

### Opção A — Somente histórico (mais seguro)

Mostrar no admin ou Supabase read-only: pagamentos `approved` / `pending`.

### Opção B — Depósito real mínimo

| Passo | Ação |
|-------|------|
| 1 | Valor mínimo (ex. R$ 1) |
| 2 | QR PIX |
| 3 | Aguardar webhook (até 2 min) |

**Ponto crítico:** MP lento → cortar e usar Opção A.

**Narrativa:** “Crédito passa por RPC idempotente, não por update manual.”

---

## 6. Ledger

**Mostrar (admin ou slide preparado):**

- Tabela `ledger_financeiro`
- Unicidade correlation_id + tipo
- Métricas: 0 duplicata, 0 saldo negativo

**Script opcional (terminal):**

```bash
node scripts/v1-2a-runtime-financial-health.js
```

(apenas se pré-testado — pode demorar)

---

## 7. Admin

| Tela | Objetivo |
|------|----------|
| Dashboard | Visão operacional |
| Saques | Fluxo outbound documentado |
| Usuários | Suporte |

**Modo preferido:** read-only — não aprovar saque real na demo.

---

## 8. Observabilidade

```bash
node scripts/operational/continuous-verification.js
```

**Mostrar:** score, issues P0/P1, PASS COM RESSALVAS.

**Fallback:** abrir `V1-2E-CONTINUOUS-VERIFICATION-DATA-2026-05-19.json` pré-gerado.

---

## 9. Gates & runbooks

```bash
node scripts/activation/pre-deploy-gate.js
```

**Esperado:** decisão REVIEW ou PASS COM RESSALVAS.

Abrir `docs/runbooks/README.md` — mostrar estrutura.

---

## 10. Certificação (fechamento)

Exibir `docs/certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md`:

- Score **88**
- CERTIFIED WITH RESSALVAS
- Baseline congelada

---

## Plano B (falhas comuns)

| Falha | Plano B |
|-------|---------|
| Site player fora | `app.goldeouro.lol` + bundle check |
| `/health` down | Mostrar último relatório V1.6 + status Fly |
| Webhook não 401 | **Não continuar demo** — escalar P0 |
| PIX não confirma | Histórico + diagrama RPC |
| Gameplay trava | Vídeo backup + logs |
| Script timeout | JSON de relatório pré-gerado |

---

## Pontos críticos (não improvisar)

1. **Nunca** afirmar “zero risco” — citar 34 approved/ledger  
2. **Nunca** ativar alertas reais na demo  
3. **Nunca** aplicar SQL em produção na frente do investidor  
4. **Sempre** distinguir certificado vs scale-tested  
5. **Não** fazer saque real sem necessidade  

---

## Checklist pós-demo

- [ ] Q&A com [Operational Verdict](V1-FINAL-OPERATIONAL-VERDICT.md)
- [ ] Enviar pacote executive por email
- [ ] Registrar perguntas para backlog V2

---

_Plano de demo V1.FINAL — 2026-05-19._
