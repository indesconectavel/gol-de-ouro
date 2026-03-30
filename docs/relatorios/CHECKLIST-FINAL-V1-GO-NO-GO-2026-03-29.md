# CHECKLIST FINAL — V1 GOL DE OURO

**Data:** 2026-03-29  
**Modo:** validação executiva read-only, fundamentada no código do repositório (`server-fly.js`, `routes/adminApiFly.js`, SQL em `database/`, auditorias BLOCO A/B/D/J).  
**Runtime alvo:** Node (`server-fly.js`), Supabase, Mercado Pago, frontends separados.

---

## 1. Resumo executivo

A V1 apresenta **caminho feliz coerente** para jogo (lotes em memória + chute com lock otimista em `usuarios.saldo`), **entrada de dinheiro** (PIX + webhook + reconcile + RPC opcional de crédito idempotente) e **painel admin** protegido por **`x-admin-token`** com validação de `ADMIN_TOKEN` (mín. 16 caracteres).

**Não foi identificado bloqueador de código** que, **com configuração e topologia adequadas**, implique **perda financeira inevitável** ou **crédito duplicado sistemático** — a lógica atual mitiga duplicidade de crédito e endurece rollbacks de saldo no chute.

Os principais **ressalvas de lançamento** são **operacionais e de configuração**: webhook **sem** `MERCADOPAGO_WEBHOOK_SECRET` aceita POST sem validação HMAC; **uma única instância** Node (ou consciência de que lotes/contador são por processo); **órfãos MP** sem linha em `pagamentos_pix` exigem playbook manual; endpoints **`/api/monitoring/*`** e **`/api/metrics`** são **públicos** e expõem métricas internas (não são débito direto, mas superfície informativa).

**Decisão consolidada (secção 10):** **PRONTO COM RESSALVAS**.

---

## 2. Avaliação por bloco

### BLOCO B — ENGINE

| Verificação | Conclusão |
|-------------|-----------|
| Lotes em memória (`lotesAtivos` Map), reuso por valor, fechamento coerente com `winnerIndex` fixo no último slot (V1 R$1) | **OK** no código de `server-fly.js` |
| Contador global `contadorChutesGlobal` incrementado antes do commit completo do chute | **Ressalva:** possível desvio contador ↔ linhas em `chutes` em falhas após incremento (auditoria B) |
| Single-instance | **Funciona** como desenhado: um processo = um conjunto de lotes e um contador |
| Multi-instance | **Risco de modelo de negócio** se se assumir pool global único sem partilha de estado |

**Classificação bloco:** **OK COM RESSALVAS** (contador + topologia).

---

### BLOCO D — SALDO

| Verificação | Conclusão |
|-------------|-----------|
| Débito/crédito no chute num único `UPDATE` com `.eq('saldo', user.saldo)` | **OK** |
| Rollback após falha pós-update | **Endurecido:** `revertShootSaldoOptimistic` só reverte se `saldo` ainda for o valor pós-chute (`updatedUser.saldo`) |
| PIX/saque (fora do detalhe deste checklist) | Alinhado a auditoria D — RPC quando ativa |

**Saldo incorreto no caminho feliz?** Improvável. **Perda financeira direta sistemática?** Não evidenciada no fluxo normal; edge cases extremos (corrida no rollback condicional do chute) exigem revisão manual.

**Classificação bloco:** **OK COM RESSALVAS**.

---

### BLOCO A — FINANCEIRO

| Verificação | Conclusão |
|-------------|-----------|
| Criação PIX + insert `pagamentos_pix` | **OK**; falha após MP OK → log `[PIX-ORFAO-MP]` + `mercado_pago_payment_id` na resposta |
| Webhook | Valida assinatura **só se** `MERCADOPAGO_WEBHOOK_SECRET` definido; **sem secret, sem validação** |
| Crédito | Idempotente via RPC (transação) ou JS com claim/compensação |
| Reconcile | Mesma função de crédito; só atua em `pending` existentes |

**Pagamento aprovado perdido?** Possível se **não existir** linha local (órfão) — **não** há crédito automático até intervenção. **Crédito duplicado?** **Baixo** com lógica atual. **Config crítica?** **Sim:** token MP, secret webhook, `BACKEND_URL`, RPCs.

**Classificação bloco:** **OK COM RESSALVAS**.

---

### BLOCO J — ADMIN

| Verificação | Conclusão |
|-------------|-----------|
| Rotas sob `/api/admin` | `createAdminApiRouter` com **`router.use(authAdminToken)`** antes das rotas (`adminApiFly.js`) |
| `ADMIN_TOKEN` | Obrigatório, comprimento ≥ 16; caso contrário **503** com mensagem explícita |
| Dados | Leituras/escritas via Supabase no router; settings em ficheiro local `data/admin-panel-settings.json` (não é mock de API) |
| Bootstrap | `POST /api/admin/bootstrap` usa **`authenticateToken`** (JWT jogador) para primeiro admin — fluxo conhecido, não é mock |

**Admin reflete backend real?** **Sim**, no desenho atual. **Inconsistência estrutural grave?** Não identificada no código montado em `server-fly.js`.

**Classificação bloco:** **OK** (com ressalva operacional: proteger `ADMIN_TOKEN` e ficheiro `data/`).

---

### BLOCO G — SEGURANÇA

| Verificação | Conclusão |
|-------------|-----------|
| Webhook | **Protegido por secret apenas se variável definida** — ausência = aceita qualquer POST (consulta MP a seguir, mas superfície aumentada) |
| Rotas financeiras/jogo | `shoot`, PIX criar/listar, withdraw: **`authenticateToken`** |
| Admin | **`x-admin-token`** |
| Expostos sem auth | `/`, `/health`, `/ready`, `/api/metrics`, **`/api/monitoring/metrics`**, **`/api/monitoring/health`**, `/meta`, `/api/production-status`, webhook |

**Exploração imediata óbvia?** Não há endpoint público que creditite saldo sem passar por MP + linha `pagamentos_pix` ou JWT. **Risco óbvio:** webhook sem secret; **vazamento operacional** via monitoring público.

**Classificação bloco:** **OK COM RESSALVAS**.

---

## 3. Configuração e ambiente

| Variável / item | Papel | Risco se ausente/errado |
|-----------------|--------|-------------------------|
| `JWT_SECRET` | Auth jogador | Servidor não sobe (validado no boot) |
| `MERCADOPAGO_ACCESS_TOKEN` | PIX / consultas MP | PIX indisponível |
| `MERCADOPAGO_WEBHOOK_SECRET` | HMAC webhook MP | **Validação desligada** |
| `BACKEND_URL` | `notification_url` | Webhooks podem falhar ou ir a URL errada |
| `FINANCE_ATOMIC_RPC` | `!== 'false'` → RPC financeiras | `false` → caminhos JS mais frágeis |
| `NODE_ENV` | Produção rejeita assinatura webhook inválida | Staging mais permissivo |
| `ADMIN_TOKEN` | Painel admin | Admin API em **503** se inválido/ausente |
| `VITE_API_URL` (player) | Base URL no build | **Não verificado neste repo backend** — requisito do frontend |

**Defaults perigosos:** `BACKEND_URL` cai em URL fixa de exemplo no código de PIX se env ausente; webhook sem secret não falha no arranque — **silenciosamente inseguro**.

---

## 4. Banco de dados

| Item | Evidência no repositório |
|------|---------------------------|
| `UNIQUE(payment_id)` em `pagamentos_pix` | `database/schema-completo.sql` declara `payment_id … UNIQUE` — **confirmar no Supabase real** |
| RPC `creditar_pix_aprovado_mp` | Definida em `database/rpc-financeiro-atomico-2026-03-28.sql` — **aplicação manual** no projeto |
| `usuarios.saldo` | Coluna usada em todo o fluxo de saldo |

**Risco estrutural:** schema real sem unicidade ou sem RPC → comportamento degrada para JS; não bloqueia arranque mas **aumenta** risco operacional.

---

## 5. Operação real

- **Logs:** tags úteis (`PIX-ORFAO-MP`, `SHOOT-ROLLBACK`, `SAQUE-ROLLBACK-CRITICO`, `[RECON]`, `[WEBHOOK]`).  
- **Órfão PIX:** resposta 500 com `mercado_pago_payment_id` + log JSON — **fallback manual** possível.  
- **Diagnóstico:** health/ready; erros Supabase nos logs; reconcile periódico.

**Operável em produção?** **Sim**, com runbook para órfãos e revisão de logs críticos.

---

## 6. Dependências externas

| Dependência | Comportamento |
|-------------|----------------|
| Mercado Pago | Indisponível → PIX criar/webhook consultas falham; reconcile adia |
| Supabase | Indisponível → 503 em rotas que dependem de BD; risco de órfão MP se MP respondeu antes |
| Node | Runtime padrão |

**Fallback:** reconcile para pendentes locais; **não** substitui BD ou MP de forma transparente.

---

## 7. Riscos identificados

### Críticos (bloqueadores *condicionais* — mitigáveis por config/topologia)

- **Nenhum inevitável no código** se: uma instância de jogo (ou aceitação explícita do modelo), `MERCADOPAGO_WEBHOOK_SECRET` definido, RPCs aplicadas, `ADMIN_TOKEN` forte.

### Altos

- Webhook **sem** secret configurado.  
- **Órfão MP** sem `pagamentos_pix` — sem crédito automático.  
- **Múltiplas réplicas** Node sem estado partilhado para lotes/contador.

### Médios

- Endpoints `/api/monitoring/*` públicos (informação de sistema).  
- `FINANCE_ATOMIC_RPC=false` ou RPC ausente.  
- Contador global vs chutes em falhas parciais (BLOCO B).

### Baixos

- `/api/metrics` com totais zerados no payload (confusão, não quebra fluxo).  
- `claim_lost` como ruído de corrida benigna.

---

## 8. O que NÃO impede o lançamento

- Ressalvas de **observabilidade** (métricas genéricas).  
- Necessidade de **playbook manual** para casos raros (órfão).  
- **Monitoring** público (mitigável com reverse proxy / firewall sem mudar código).  
- Documentação de **múltiplas instâncias** como decisão de arquitetura futura, se V1 for **single-instance** por desenho.

---

## 9. O que BLOQUEIA o lançamento (se houver)

Bloqueio **efetivo** típico **não está no repositório**, mas **sim na implantação**:

- Lançar **sem** `MERCADOPAGO_WEBHOOK_SECRET` em ambiente exposto.  
- Lançar **sem** RPCs financeiras **e** sem aceitar risco do fallback JS.  
- Lançar **várias VMs** do mesmo backend **assumindo** lote único global sem alterar modelo.  
- `ADMIN_TOKEN` fraco ou em repositório público.

Isto são **gates de deploy**, não bugs latentes que impeçam “merge”.

---

## 10. DECISÃO FINAL

**⚠️ PRONTO COM RESSALVAS**

Motivo: o código da V1 é **coerente e lançável** quando a **configuração**, o **schema** (unicidade + RPCs) e a **topologia** (idealmente **single-instance** para engine) estão corretos. Permanecem riscos **moderados** já catalogados (A/B/D), **sem** evidência de perda financeira direta **sistemática** no fluxo normal com boas práticas de env.

---

## 11. Condições obrigatórias antes de lançar

1. Definir **`MERCADOPAGO_WEBHOOK_SECRET`** e **`NODE_ENV=production`** no ambiente público.  
2. Confirmar **`BACKEND_URL`** = URL canónica que o MP pode atingir.  
3. Garantir **`ADMIN_TOKEN`** (≥ 16 caracteres) e rotação/guarda de segredo.  
4. Aplicar no Supabase: **RPC** `creditar_pix_aprovado_mp` (e saque atómico, alinhado BLOCO D) e manter **`FINANCE_ATOMIC_RPC`** conforme política.  
5. Confirmar **`UNIQUE(payment_id)`** (ou equivalente) em `pagamentos_pix`.  
6. **Uma instância** do processo de jogo **ou** documentar e aceitar que lotes/contador são por processo.  
7. Configurar **`VITE_API_URL`** (ou equivalente) no build do player para o backend correto.  
8. Runbook: **`PIX_ORFAO_MP`** / `mercado_pago_payment_id` + verificação no painel MP.

---

## 12. Próximos passos pós-lançamento

- Monitorizar logs **`[WEBHOOK] creditar PIX: pix_not_found`** e **`PIX-ORFAO-MP`**.  
- Rever necessidade de **restringir** `/api/monitoring/*` atrás de rede ou token.  
- Planejar evolução **multi-instância** (estado partilhado ou sticky sessions) se a escala exigir.  
- Reconciliação periódica manual de amostra (órfãos / pendentes antigos).

---

*Fim do checklist. Base: código em `server-fly.js`, `routes/adminApiFly.js`, `database/*.sql`, auditorias BLOCO A/B/D e contexto J consolidado.*
