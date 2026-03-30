# MATRIZ DE RISCOS — V1 GOL DE OURO

**Modo:** READ-ONLY analítico (síntese de `server-fly.js`, `routes/adminApiFly.js`, auditorias A/B/D/G/I/J, checklists e runbook).  
**Data:** 2026-03-29  

**Legenda — impacto**

- **Alto:** perda financeira direta, fraude facilitada, dados sensíveis expostos, ou indisponibilidade grave do negócio.  
- **Médio:** prejuízo parcial, suporte operacional intenso, desalinhamento de estado recuperável com esforço.  
- **Baixo:** ruído, confusão de operadores, ou impacto limitado a cenários raros.

**Legenda — probabilidade**

- **Alta:** ocorre com configuração habitual ou tráfego normal se premissas não forem cumpridas.  
- **Média:** depende de incidente, escala ou erro de deploy.  
- **Baixa:** exige combinação de falhas, corrida extrema ou uso fora do desenho.

**Mitigação atual** = o que o código ou o processo **já** faz ou permite **hoje**.  
**Ação futura** = passo **fora do âmbito** deste documento (roadmap / operação); não implica alteração de código nesta entrega.

---

## Riscos obrigatórios (enunciado)

| # | Descrição | Impacto | Probabilidade | Mitigação atual | Ação futura |
|---|-----------|---------|---------------|-----------------|-------------|
| R1 | **PIX órfão:** cobrança criada no Mercado Pago sem linha em `pagamentos_pix` (falha de insert após MP OK, ou Supabase indisponível no momento). Webhook/reconcile não creditam (`pix_not_found`). | Alto | Média | Log estruturado `[PIX-ORFAO-MP]` com `mercado_pago_payment_id`, `usuario_id`, `amount_brl`; resposta 500 ao cliente com `mercado_pago_payment_id`; runbook descreve inserção manual + RPC/reconcile. | Manter playbook operacional; monitorizar logs e filas de suporte. |
| R2 | **Multi-instância:** vários processos Node com `lotesAtivos`, `contadorChutesGlobal` e `idempotencyProcessed` **independentes** — lotes e Gol de Ouro deixam de ser globais coerentes; mesma chave de idempotência pode ser aceite noutra máquina. | Alto | Alta (se scale > 1 sem modelo novo) | Nenhuma partilha de estado no código V1; documentação e checklists exigem **uma instância** para o jogo. | Manter scale=1 ou aceitar risco por escrito; qualquer horizontalização exigiria desenho novo (fora do escopo V1 aqui). |
| R3 | **Webhook sem `MERCADOPAGO_WEBHOOK_SECRET`:** validação HMAC não corre; POST aceite sem autenticação de origem (crédito ainda depende de GET MP + linha local). | Alto | Alta (se secret omitido em prod) | Se secret definido + `NODE_ENV=production`, assinatura inválida → 401. | Garantir secret em todos os ambientes públicos; monitorizar `401` e tentativas falhadas. |
| R4 | **`BACKEND_URL` incorreto ou ausente:** `notification_url` do PIX pode apontar para host errado (fallback fixo `goldeouro-backend-v2.fly.dev` no `server-fly.js`). | Alto | Média | Fallback evita string vazia mas pode ser **host errado** para outro deploy. | Definir `BACKEND_URL` explícita no env de cada ambiente; validar no painel MP após deploy. |
| R5 | **Estado em memória (engine):** lotes ativos, contador global, mapa de idempotência — perdidos ou inconsistentes após restart; contador pode adiantar-se a chutes não persistidos em falhas após `contadorChutesGlobal++`. | Alto / Médio | Média | Persistência de contador em `metricas_globais` no arranque e após chutes; lock otimista em `usuarios.saldo` reduz duplo pagamento no mesmo “slot”; validador de integridade do lote. | Monitorizar divergência contador ↔ `chutes`; plano de restart em janela de baixo tráfego. |
| R6 | **Endpoints públicos amplos:** `/health`, `/api/monitoring/*`, `/api/metrics`, `/api/production-status`, etc., expõem estado operacional, contagem de utilizadores, memória, PID, flags DB/MP. | Médio / Alto | Alta (são sempre acessíveis) | Rate limit global em `/api/`; separação conceitual `/ready` mais “leve” que `/health`. | Restringir por rede ou autenticação mínima em ambientes sensíveis (decisão de infra). |

---

## Riscos adicionais (mesmo formato)

| # | Descrição | Impacto | Probabilidade | Mitigação atual | Ação futura |
|---|-----------|---------|---------------|-----------------|-------------|
| R7 | **Crédito PIX sem RPC:** fallback JS em várias idas ao PostgREST; janela teórica menor que RPC única. | Médio | Média (se RPC não aplicada no Supabase) | `FINANCE_ATOMIC_RPC` preferido; logs de fallback; idempotência `pending`→`approved` e `already_processed`. | Aplicar RPC em produção e validar logs `PIX-CREDIT`. |
| R8 | **Webhook responde 200 antes do crédito:** falha após resposta depende de retentativas MP + reconcile. | Médio | Média | Reconcile periódico; mesma função de crédito que o webhook. | Monitorizar `[WEBHOOK] creditar PIX` e pendentes antigos. |
| R9 | **`ADMIN_TOKEN` fraco ou vazado:** acesso total a relatórios, export, backup, configurações em `/api/admin/*`. | Alto | Baixa / Média | Comprimento mínimo 16; comparação exata com header; 503 se não configurado. | Rotação de segredo; acesso admin só por rede confiável; auditar downloads. |
| R10 | **`/api/admin/bootstrap` com JWT:** elevação quando ainda não existe admin; janela em “zero admins”. | Alto | Baixa | Condição “zero admins” no código; após existir admin, 403. | Executar bootstrap em ambiente controlado; desabilitar ou proteger após go-live. |
| R11 | **Rollback de saldo no chute** (`revertShootSaldoOptimistic`): em teoria extremo, outra operação altera saldo entre update e revert — sobrescrita possível (auditoria D). | Médio | Baixa | Lock otimista no chute principal; revert condicionado ao saldo ainda ser o esperado (versão endurecida referida no checklist). | Rastrear incidentes; manter carga moderada. |
| R12 | **Painel admin React (`goldeouro-admin`):** legado, vários clientes HTTP, login local histórico vs `x-admin-token` — risco de apontar para API errada ou token errado. | Médio | Média | Backend oficial documentado (`adminApiFly` + `VITE_API_URL` / token). | Uniformizar cliente e variáveis de build; smoke tests documentados. |
| R13 | **Duplicação de entrypoints no repositório** (`server-fly-deploy.js`, `paymentController`, routers não montados): risco de deploy com binário errado. | Alto | Baixa | `Dockerfile` fixa `server-fly.js`. | Checklist de deploy; revisão de `CMD` / `start`. |
| R14 | **`POST /api/analytics` público:** injeção de volume / ruído em logs. | Baixo | Média | Validação mínima de corpo; log estruturado. | Rate limit dedicado ou WAF (infra). |
| R15 | **`GET /api/debug/token` fora de produção:** vazamento de dados de debug. | Alto | Baixa em prod | `NODE_ENV=production` → 404 sem corpo sensível. | Garantir `NODE_ENV` correto no runtime público. |
| R16 | **Constraint `UNIQUE(payment_id)` ausente no Supabase real:** duas linhas para o mesmo pagamento MP. | Alto | Baixa (se schema divergir do repo) | Código assume linha única; schema em `database/schema*.sql` documenta UNIQUE. | Verificar constraints em produção (inventário / SQL). |
| R17 | **Autenticação player (contexto / logout):** formatos de `user` após refresh e logout sem limpar contexto (auditoria C). | Médio | Média | Backend JWT consistente; rotas protegidas no servidor. | Testes manuais de sessão no player; alinhar front ao contrato do profile. |
| R18 | **Saque:** fallback JS se RPC ausente; rollback documentado; risco residual se rollback otimista falhar (auditoria D). | Alto | Baixa | RPC `solicitar_saque_pix_atomico` quando presente. | RPC aplicada; monitorizar `SAQUE` e rollbacks críticos nos logs. |

---

## Mapa rápido: risco × domínio

| Domínio | IDs principais |
|---------|----------------|
| Financeiro PIX / MP | R1, R3, R4, R7, R8, R16 |
| Engine / escala | R2, R5 |
| Superfície / segurança | R6, R9, R14, R15 |
| Admin / operação | R9, R10, R12, R13 |
| Saldo / transacional | R11, R18 |
| Frontend auth | R17 |

---

## Referências no repositório

- `docs/relatorios/AUDITORIA-READONLY-BLOCO-A-FINANCEIRO-V1-2026-03-29.md`  
- `docs/relatorios/AUDITORIA-READONLY-BLOCO-B-ENGINE-V1-2026-03-29.md`  
- `docs/relatorios/AUDITORIA-READONLY-BLOCO-D-SALDO-V1-2026-03-29.md`  
- `docs/relatorios/AUDITORIA-READONLY-BLOCO-G-ANTIFRAUDE-2026-03-29.md`  
- `docs/relatorios/AUDITORIA-READONLY-BLOCO-I-ESCALABILIDADE-2026-03-16.md`  
- `docs/relatorios/CHECKLIST-GO-NO-GO-V1.md`  
- `docs/relatorios/RUNBOOK-OPERACIONAL-V1.md`  
- `docs/relatorios/MAPA-ENDPOINTS-V1.md`

---

*Fim da matriz.*
