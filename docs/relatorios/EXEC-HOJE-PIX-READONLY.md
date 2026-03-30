# Execução de hoje — READ-ONLY: teste financeiro real de PIX (valor baixo)

**Data:** 2026-03-27  
**Modo:** documentação operacional — **sem** alteração de código, deploy ou execução de teste neste artefato.

**Contexto:** backend em **1 instância**, endpoint de debug de token **bloqueado em produção** (`NODE_ENV=production`), fluxo PIX endurecido (helper único `creditarPixAprovadoUnicoMpPaymentId`, webhook + reconcile).

---

## 1. Objetivo do teste

Demonstrar **ponta a ponta**, com **dinheiro real** (ou ambiente explicitamente escolhido), que:

1. A criação de PIX registra corretamente em `pagamentos_pix` **sem** creditar saldo antecipado.
2. Após o pagamento ser **aprovado** no Mercado Pago, o sistema credita o saldo **no máximo uma vez** (claim + lock).
3. O estado final no banco e o saldo do usuário ficam **coerentes** com o valor pago.

Este teste **não** substitui auditoria formal; valida **comportamento real** no ambiente já estabilizado.

---

## 2. Pré-condições

### 2.1 Usuário de teste

- Conta **dedicada** ao teste (não misturar com usuário de produção “real” se possível).
- **Anotar antes:** `usuarios.id`, e-mail/login, **saldo inicial** (`usuarios.saldo`).
- Ter sessão válida no app (JWT) para chamar `POST /api/payments/pix/criar`.

### 2.2 Valor recomendado (baixo)

- **Mínimo aceito pelo backend:** **R$ 1,00** (`amount >= 1` em `server-fly.js`).
- **Sugestão prática:** **R$ 1,00** ou **R$ 2,00** — minimiza perda em caso de falha operacional.
- **Teto de criação no backend:** R$ 1.000,00 (não necessário para este teste).

### 2.3 Ambiente: produção vs sandbox

| Opção | Quando usar | Observação |
|-------|-------------|------------|
| **Produção (MP + token de produção)** | Validar fluxo **real** no Fly com credenciais de produção | Dinheiro real; webhook deve apontar para `BACKEND_URL` correto (ex.: `https://goldeouro-backend-v2.fly.dev/api/payments/webhook`). |
| **Sandbox / credenciais de teste** | Evitar movimentação financeira real | Comportamento pode diferir em tempos e notificações; ainda valida integração, mas **não** é “dinheiro real”. |

**Decisão explícita:** o time deve **escolher uma** e documentar qual token MP (`MERCADOPAGO_ACCESS_TOKEN`) está ativo no app Fly — **produção** para teste com dinheiro real; **teste** apenas se o objetivo for outro.

### 2.4 Técnicas (já assumidas no contexto)

- **1 instância** `app` no Fly (cirurgia de escala).
- **Supabase** acessível para leitura das tabelas.
- **Mercado Pago** com meio de pagamento PIX habilitado para a conta vinculada ao token.

---

## 3. Sequência do teste

### 3.1 Baseline (antes de criar o PIX)

1. No Supabase (ou SQL): registrar **`usuarios.saldo`** do usuário de teste e **timestamp** (UTC).
2. Opcional: `SELECT` em `pagamentos_pix` filtrando `usuario_id` — anotar quantidade de linhas recentes (para não confundir com depósitos antigos).

### 3.2 Criação do PIX

1. No cliente autenticado: **`POST /api/payments/pix/criar`** com body JSON, ex.: `{ "amount": 1 }` (ou `2`).
2. Confirmar resposta de sucesso com dados do MP (QR/código) e que o backend **não** aumentou saldo ainda.
3. No banco: localizar nova linha em **`pagamentos_pix`** com `status = 'pending'`, anotar **`id` interno**, **`payment_id` / `external_id`** conforme colunas preenchidas, **`amount`/`valor`**, **`created_at`**.

### 3.3 Pagamento

1. Pagar o PIX pelo app do banco ou fluxo MP (mesmo valor exato).
2. Anotar **hora do pagamento** e, se disponível na UI do MP, o **ID do pagamento** (numérico).

### 3.4 Espera do webhook / reconcile

1. **Webhook:** o MP notifica `POST /api/payments/webhook`; o backend responde rápido e processa o crédito de forma assíncrona (comportamento já documentado em relatórios A3).
2. **Reconcile (fallback):** job periódico (padrão **~60 s** se `MP_RECONCILE_INTERVAL_MS` default; pendentes com idade **≥ 2 min** por padrão `MP_RECONCILE_MIN_AGE_MIN`) consulta MP e chama o **mesmo** helper se `approved`.

**Prática:** aguardar **até alguns minutos** se o saldo não subir na hora; verificar logs `[RECON]` antes de declarar falha.

### 3.5 Validação do saldo

1. Refazer leitura de **`usuarios.saldo`** para o mesmo usuário.
2. Delta esperado: **+valor do depósito** (ex.: +1,00), **uma única vez**.
3. Confirmar **`pagamentos_pix.status`** = **`approved`** para a linha do teste.

### 3.6 O que observar (checklist)

| Onde | O quê |
|------|--------|
| **`usuarios.saldo`** | Aumento único, igual ao valor pago (em escala monetária coerente com o tipo da coluna). |
| **`pagamentos_pix`** | Uma linha passa de `pending` → `approved`; sem segunda linha duplicada para o mesmo pagamento MP. |
| **Logs Fly** | `💰 [PIX-CREDIT]` em sucesso; `✅ [RECON]` se reconcile aplicou; erros `❌ [PIX-CREDIT]` / `❌ [RECON]` indicam investigação. |
| **Webhook** | Assinatura MP: em produção com `MERCADOPAGO_WEBHOOK_SECRET`, requisição inválida pode ser **401** — secrets devem estar alinhados. |

---

## 4. Evidências a coletar

Obrigatório para fechar o teste com rastreabilidade:

1. **ID do pagamento no Mercado Pago** (numérico, string normalizada no helper).
2. **Linha em `pagamentos_pix`:** `id`, `usuario_id`, `status` antes (pending) e depois (approved), `payment_id`/`external_id`, `amount`/`valor`, `created_at` / `updated_at` se existirem.
3. **`usuarios.saldo`:** valor **antes**, valor **depois**, e **delta** calculado.
4. **Timestamps:** hora da criação do PIX, hora do pagamento no banco, hora em que o saldo mudou (ou primeira linha de log `[PIX-CREDIT]` / `[RECON]`).
5. **Trecho de log** (Fly) com sucesso ou erro relevante (sem colar secrets).

---

## 5. Critério de sucesso

Considerar **SUCESSO** se **todas** forem verdadeiras:

- O saldo do usuário **aumenta exatamente uma vez** pelo valor do depósito (tolerância apenas de arredondamento/decimal se aplicável).
- O registro correspondente em **`pagamentos_pix`** fica **`approved`**.
- **Não** há segundo crédito para o **mesmo** `payment_id` MP (sem duplicata de saldo).
- **Nenhum** erro crítico no backend (`❌ [PIX-CREDIT]` com motivo inesperado, 500 em rotas relacionadas) atribuível ao fluxo deste pagamento.

---

## 6. Critério de falha

Considerar **FALHA** (parar e investigar) se ocorrer **qualquer** um:

- **Saldo não sobe** após pagamento aprovado no MP e tempo razoável + verificação de reconcile/logs.
- **Saldo sobe mais de uma vez** pelo mesmo pagamento (divergência dupla inaceitável).
- **Webhook** não processa **e** reconcile **não** corrige (ex.: linha presa em `pending` com MP já `approved`, sem explicação em logs).
- **Erro** explícito no backend no fluxo de crédito (ex.: falhas repetidas em `creditarPixAprovadoUnicoMpPaymentId` com motivo diferente de concorrência benigna).
- **Inconsistência** entre MP (`approved`) e banco (`pending` sem perspectiva de correção).

Em caso de falha: **não** repetir pagamentos às cegas; coletar IDs MP, linha `pagamentos_pix`, logs e saldo antes de novo teste.

---

*Documento READ-ONLY — execução do teste é responsabilidade da operação no ambiente real.*
