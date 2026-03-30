# CHECKLIST FINAL DE LANÇAMENTO — V1 GOL DE OURO

**Modo:** READ-ONLY executivo (baseado no código e auditorias do repositório).  
**Data:** 2026-03-29  
**Uso:** marcar cada linha após verificação no **ambiente real** de lançamento (Fly/env, Supabase, MP).

**Legenda de status**

- **OK** — confirmado no ambiente alvo.  
- **PENDENTE** — ainda não verificado ou depende só de operação/deploy.

---

## Matriz obrigatória

| Item | Status (OK / PENDENTE) | Bloqueia lançamento? (SIM / NÃO) | Evidência no código | Condição para aprovação |
|------|------------------------|-----------------------------------|---------------------|-------------------------|
| **MERCADOPAGO_WEBHOOK_SECRET** | PENDENTE | **SIM** (ambiente exposto à internet) | `server-fly.js`: validação HMAC só corre se `process.env.MERCADOPAGO_WEBHOOK_SECRET` está definida; sem secret o bloco é ignorado. `utils/webhook-signature-validator.js` lê o mesmo env. **Não** há `assertRequiredEnv` para esta chave. | Variável definida no runtime de produção, igual ao segredo do painel Mercado Pago (webhooks). Teste: POST webhook sem assinatura válida → **401** em `NODE_ENV=production`. |
| **BACKEND_URL correto** | PENDENTE | **SIM** | `server-fly.js` (~1751): `notification_url` combina env `BACKEND_URL` com fallback literal para `goldeouro-backend-v2.fly.dev` se a env estiver vazia. | `BACKEND_URL` = URL canónica HTTPS do **mesmo** backend que o MP consegue atingir, terminando no path base (sem duplicar `/api/...` no env). Confirmar no painel MP / notificação de teste. |
| **RPC financeira aplicada** | PENDENTE | **SIM** (para crédito atómico pretendido na V1) | `server-fly.js`: `supabase.rpc('creditar_pix_aprovado_mp', …)` quando `FINANCE_ATOMIC_RPC !== 'false'`; se RPC ausente/erro PGRST, log de fallback JS (`⚠️ [PIX-CREDIT] RPC … indisponível`). SQL em `database/rpc-financeiro-atomico-2026-03-28.sql`. | Função `public.creditar_pix_aprovado_mp(text)` criada no Supabase; `GRANT EXECUTE` a `service_role` conforme script; smoke: crédito após PIX gera log `💰 [PIX-CREDIT] RPC crédito OK` ou resposta RPC `ok:true` sem fallback. |
| **UNIQUE em `payment_id` (`pagamentos_pix`)** | PENDENTE | **SIM** | `database/schema-completo.sql` e `database/schema.sql`: `payment_id … UNIQUE NOT NULL`. O runtime real do Supabase **pode** divergir do ficheiro do repo. | Consulta de catálogo ou migração aplicada: existe **unique constraint** (ou índice único) em `payment_id` em `pagamentos_pix` em **produção**. |
| **ADMIN_TOKEN forte** | PENDENTE | **SIM** | `routes/adminApiFly.js` (`authAdminToken`): sem `ADMIN_TOKEN` ou comprimento inferior a 16 caracteres → **503** com mensagem explícita; header `x-admin-token` deve coincidir. | Token gerado com entropia alta (não dicionário), mínimo 16 caracteres, guardado só em segredo de deploy; nunca commitado. Painel usa o mesmo valor via `VITE_ADMIN_TOKEN` / fluxo documentado em `goldeouro-admin/src/js/api.js`. |
| **Backend em 1 instância** | PENDENTE | **SIM** (para o modelo V1 atual) | `server-fly.js`: `lotesAtivos` (`Map`), `contadorChutesGlobal`, `idempotencyProcessed` — estado **por processo**; auditorias B/G/I. | Fly (ou outro orquestrador) com **scale = 1** para a app Node do jogo, **ou** decisão explícita documentada de aceitar fragmentação de lotes/contador. |
| **Endpoints admin funcionando** | PENDENTE | **SIM** | `server-fly.js`: `app.use('/api/admin', createAdminApiRouter({ … }))` após bootstrap; todas as rotas do router passam por `authAdminToken`. | Com `x-admin-token` válido: `GET /api/admin/stats` (ou outra rota de leitura) retorna **200** e payload coerente; **401/503** sem token ou com `ADMIN_TOKEN` inválido. Cliente oficial do painel alinhado a este contrato. |
| **Fluxo PIX completo validado** | PENDENTE | **SIM** | `POST /api/payments/pix/criar` → MP → insert `pagamentos_pix`; `POST /api/payments/webhook` → 200 cedo → GET MP → `creditarPixAprovadoUnicoMpPaymentId`; `reconcilePendingPayments` em intervalo. | Teste **real** (valor mínimo): linha `pending` → `approved`, saldo utilizador atualizado, logs sem `Signature inválida` (com secret), sem `[PIX-ORFAO-MP]`; opcional: verificar reconcile em linha pendente antiga. |

---

## Decisão final (preenchendo a matriz)

| Decisão | Quando usar |
|---------|-------------|
| **GO** | Todas as linhas obrigatórias estão **OK**; nenhum “Bloqueia = SIM” pendente. |
| **GO COM RESSALVAS** | Existe **PENDENTE** em item que **não** bloqueia (ex.: documentação interna aceita fallback JS temporário) **ou** risco operacional explícito aceite por escrito **ou** verificação parcial com plano datado para fechar gaps. |
| **NO-GO** | Qualquer item com **Bloqueia = SIM** permanece **PENDENTE** ou falhou na verificação; ou `BACKEND_URL`/secret/instance count incorretos para o ambiente público. |

### Estado deste documento (modelo não executado no seu ambiente)

👉 **DECISÃO FINAL (template):** **GO COM RESSALVAS** — até a equipa marcar a matriz acima com **OK** no ambiente real, o repositório sozinho não comprova secrets, URL, RPC no Supabase, constraint UNIQUE em produção, scale=1 nem teste PIX de ponta a ponta.

Quando todos os itens obrigatórios estiverem **OK** no alvo de lançamento, alterar a decisão registada para **GO**.

---

## Referências rápidas de ficheiros

| Tema | Ficheiro |
|------|----------|
| Webhook + PIX + reconcile | `server-fly.js` |
| Assinatura MP | `utils/webhook-signature-validator.js` |
| Admin API | `routes/adminApiFly.js` |
| RPC crédito PIX | `database/rpc-financeiro-atomico-2026-03-28.sql` |
| Schema `pagamentos_pix` | `database/schema-completo.sql`, `database/schema.sql` |

---

*Fim do checklist.*
