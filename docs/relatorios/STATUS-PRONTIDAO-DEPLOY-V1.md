# Status de prontidão para deploy — V1 Gol de Ouro

**Documento:** consolidação executiva para o dia em que existir orçamento Fly.io e ambiente real.  
**Base:** `RELATORIO-MESTRE-V1-GOLDEOURO.md`, `CHECKLIST-GO-NO-GO-V1.md`, `MATRIZ-RISCOS-V1.md`, `INVENTARIO-ENV-V1.md`, `AUDITORIA-MERCADOPAGO-REAL-V1.md`.  
**Data:** 2026-03-29  

Este ficheiro **não** substitui a matriz GO/NO-GO; fixa o **estado do repositório e da documentação** face ao lançamento.

---

## 1. O que já está validado (âmbito código + auditorias)

- **Entrypoint de produção** definido: `Dockerfile` → `node server-fly.js` (não depender de `server-fly-deploy.js` ou routers legados não montados).  
- **Fluxos principais** implementados no monólito: auth JWT, perfil, `POST /api/games/shoot` (V1 com aposta 1), PIX criar/listar, webhook + reconcile, crédito idempotente (RPC preferida ou fallback JS), saque, rotas `/api/admin/*` com `x-admin-token`, ingestão `POST /api/analytics`.  
- **Integração Mercado Pago** no código: criação `POST /v1/payments`, `notification_url`, `GET /v1/payments/{id}` no webhook e reconcile; comportamento com/sem `MERCADOPAGO_WEBHOOK_SECRET` e `BACKEND_URL` documentado em `AUDITORIA-MERCADOPAGO-REAL-V1.md`.  
- **Documentação operacional:** runbook (órfão, webhook, saldo, queda, admin, logs), mapa de endpoints, inventário de env, matriz de riscos, checklist GO/NO-GO.  
- **Pacote do dia do deploy:** `CHECKLIST-DEPLOY-FLY-MP-V1.md` + `SMOKE-TEST-PRODUCAO-V1.md`.

---

## 2. O que depende apenas do Fly.io (e plataformas externas)

- **Subscrição / billing Fly** e disponibilidade da app `goldeouro-backend-v2` (ou nome final escolhido, desde que `fly.toml` e secrets estejam alinhados).  
- **`fly secrets set`** com todos os valores sensíveis (lista no checklist de deploy).  
- **Escala:** **1 instância** para o processo Node do jogo, salvo decisão explícita documentada (risco R2).  
- **Certificado / HTTPS** na borda Fly (configuração padrão de serviço).  
- **Build e deploy** dos frontends (player/admin) com `VITE_BACKEND_URL` / `VITE_API_URL` e token admin corretos.  
- **Mercado Pago:** token de produção ou sandbox, URL de webhook e segredo iguais ao Fly.  
- **Supabase:** projeto ativo, SQL RPC e constraints conforme checklist GO/NO-GO.

Nada disto pode ser “comprovado” só pelo Git; exige execução no dia.

---

## 3. O que permanece como risco aceite (sem alteração de código nesta fase)

Síntese alinhada à `MATRIZ-RISCOS-V1.md` e ao relatório mestre:

| Tema | Postura V1 documentada |
|------|-------------------------|
| Estado em **memória** (lotes, contador, idempotência de chute) | Aceite com **uma instância**; restart altera comportamento até novo tráfego. |
| **Webhook** responde 200 antes do crédito | Dependência de retentativas MP + reconcile. |
| **PIX órfão** (MP OK, insert local falhou) | Playbook manual no runbook. |
| **Superfícies públicas** (`/health`, `/api/monitoring/*`, etc.) | Exposição operacional assumida nas auditorias; mitigação por infra/decisão futura. |
| **Painel admin React** | API backend alinhada; SPA com histórico de fragmentação — smoke test cobre API; UI depende de build/cliente correto. |
| **Fallback JS** se RPC não aplicada | Funcional com janela teórica diferente da RPC; política de produto pode exigir RPC aplicada. |

Estes pontos **não** bloqueiam automaticamente o “primeiro deploy” se forem aceites por escrito pela equipa; alguns **bloqueiam GO estrito** se a matriz GO/NO-GO não estiver toda OK (ex.: secret webhook ausente em público).

---

## 4. O que bloqueia o lançamento se estiver errado

Correspondência direta com itens **Bloqueia = SIM** no `CHECKLIST-GO-NO-GO-V1.md`:

- `MERCADOPAGO_WEBHOOK_SECRET` ausente em ambiente **exposto** (webhook sem HMAC).  
- `BACKEND_URL` **incorreta** para o host que o MP deve chamar (ou dependência cega do fallback fixo no código noutro deploy).  
- **RPC financeira** não aplicada quando a política exige crédito atómico em SQL.  
- **UNIQUE** em `pagamentos_pix.payment_id` ausente em produção.  
- **`ADMIN_TOKEN`** fraco, vazado ou não alinhado ao cliente admin.  
- **Mais de uma instância** Node do jogo sem modelo novo.  
- **Rotas admin** inacessíveis ou token inválido no smoke test.  
- **Fluxo PIX real** não validado (pending → approved → saldo).

Qualquer falha verificada nestes eixos implica **NO-GO** até correção operacional (secrets, SQL, escala, URL MP).

---

## 5. Decisão final (estado do projeto hoje)

### **PRONTO PARA DEPLOY QUANDO HOUVER ORÇAMENTO**

**Significado:** não existe, nas auditorias consolidadas, **fila obrigatória de alterações de código** antes do primeiro lançamento no Fly. O trabalho restante é **operacional**: pagar/ativar Fly, configurar secrets, Supabase (RPC/constraints), Mercado Pago, scale=1, executar `CHECKLIST-DEPLOY-FLY-MP-V1.md` e `SMOKE-TEST-PRODUCAO-V1.md`, e fechar a matriz `CHECKLIST-GO-NO-GO-V1.md` com **OK** nos itens bloqueadores.

### **Não se aplica: «AINDA EXIGE AJUSTES» (código)**

No sentido estrito de **patch no repositório**, a classificação consolidada no relatório mestre é **PRONTO COM RESSALVAS** (operacionais e de topologia), não “código incompleto para PIX/webhook/engine”.  

Se no futuro a equipa exigir **GO sem ressalvas**, isso passa por **fechar** riscos aceites (ex.: instância única garantida, secret webhook, RPC aplicada) via **processo e infra**, não por nova auditoria de código neste documento.

---

## 6. Mapa rápido de documentos

| Documento | Função |
|-----------|--------|
| `CHECKLIST-DEPLOY-FLY-MP-V1.md` | Dia do deploy Fly + MP |
| `SMOKE-TEST-PRODUCAO-V1.md` | Validação pós-deploy |
| `CHECKLIST-GO-NO-GO-V1.md` | Matriz decisória GO / NO-GO |
| `RUNBOOK-OPERACIONAL-V1.md` | Incidentes e recuperação |
| `RELATORIO-MESTRE-V1-GOLDEOURO.md` | Visão consolidada do sistema |

---

*Fim do status de prontidão.*
