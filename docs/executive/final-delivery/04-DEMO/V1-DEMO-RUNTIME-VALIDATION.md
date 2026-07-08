# GOL DE OURO V1 — Demo Runtime Validation

**Documento:** roteiro de validação **ao vivo** na reunião executiva  
**Modo:** somente leitura — **sem** alterar produção, banco, deploy ou código funcional  
**Duração sugerida deste bloco:** **8–12 minutos** (dentro do fluxo total de 45–55 min)

**Baseline esperada:** SHA `a83c3cffcc998ed3d1bd8d2e88619a9b03afb634` (`a83c3cf`) · Fly **v461** · bundle **`index-B6M2smS9.js`**

**Companheiros:** [V1-DEMO-ENVIRONMENT-CHECKLIST.md](V1-DEMO-ENVIRONMENT-CHECKLIST.md) · [V1-PRESENTATION-REHEARSAL-FLOW.md](V1-PRESENTATION-REHEARSAL-FLOW.md) · [V1-DEMO-CONTINGENCY-PLAN.md](V1-DEMO-CONTINGENCY-PLAN.md) · [../05-OPERATIONS/V1-ACCESS-OPERATIONS.md](../05-OPERATIONS/V1-ACCESS-OPERATIONS.md)

---

## Ordem recomendada na reunião

| # | Bloco | Tempo | Ferramenta |
|---|-------|------:|------------|
| 1 | `/health` | 2 min | Browser ou curl |
| 2 | `/meta` | 2 min | Browser ou curl |
| 3 | Webhooks (401) | 2 min | Terminal pré-configurado |
| 4 | Player (bundle) | 3 min | Navegador |
| 5 | Admin | 3 min | Navegador |
| 6 | Narrativa governança | 2 min | Fala + PDF |

---

## `/health`

### O que mostrar

**URL:** `https://goldeouro-backend-v2.fly.dev/health`

**Comando (opcional):**
```bash
curl -s https://goldeouro-backend-v2.fly.dev/health
```

### Campos a destacar na sala

| Campo | Mensagem executiva |
|-------|-------------------|
| `status` | Serviço **ok** — API viva |
| `database` / conectividade DB | Persistência financeira acessível |
| `mercadoPago` | Integração de pagamentos operacional |

**Opcional (se no roteiro):** `GET /health/workers` — confirmar processamento de payout habilitado (read-only).

### Narrativa (15s)

> “Antes de mostrar o jogo, confirmamos que a API em produção está saudável e conectada às dependências críticas.”

### Se falhar

Consultar [V1-DEMO-CONTINGENCY-PLAN.md](V1-DEMO-CONTINGENCY-PLAN.md) — cenário `/health` down. **Não** aplicar deploy na sala.

---

## `/meta`

### O que mostrar

**URL:** `https://goldeouro-backend-v2.fly.dev/meta`

**Comando (opcional):**
```bash
curl -s https://goldeouro-backend-v2.fly.dev/meta
```

### Mostrar explicitamente

| Campo | Valor esperado | Por quê |
|-------|----------------|---------|
| **SHA / `gitCommit`** | `a83c3cffcc998ed3d1bd8d2e88619a9b03afb634` | Prova de **código live** = baseline certificada |
| **Build / versão** | Alinhado ao release Fly **v461** | Rastreabilidade de deploy |
| **Runtime** | Node / ambiente conforme dossiê | Transparência técnica sem entrar em código-fonte |

### Narrativa (30s)

> “Cada release em produção é rastreável por commit. O SHA que vocês veem aqui é o mesmo da certificação V1.6 — não é ambiente de staging disfarçado.”

### Critério de parada

Se `gitCommit` **≠** `a83c3cf` → declarar desvio de baseline · seguir contingency P0 · **não** continuar narrativa “certificada neste SHA”.

---

## Webhooks

### O que mostrar

**Prova:** requisição **sem** assinatura HMAC válida → **HTTP 401** — corpo **não** processado.

**Depósito (exemplo):**
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST \
  https://goldeouro-backend-v2.fly.dev/api/payments/webhook \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"payment.updated\",\"data\":{\"id\":\"000000000000000\"}}"
```
**Esperado:** `401`

**Payout (exemplo):**
```bash
curl -s -o /dev/null -w "%{http_code}" -X POST \
  https://goldeouro-backend-v2.fly.dev/webhooks/mercadopago \
  -H "Content-Type: application/json" \
  -d "{\"action\":\"payment.updated\",\"data\":{\"id\":\"000000000000000\"}}"
```
**Esperado:** `401`

### Narrativa (20s)

> “Webhook sem assinatura do Mercado Pago recebe **401**. Um atacante não credita um centavo por HTTP público — o hardening V1.1F está no runtime que acabamos de validar pelo SHA.”

### O que NÃO fazer

- Enviar webhook **com** secret real na sala  
- Repetir flood de requisições (stress test)  
- Se retorno ≠ 401: **parar** bloco de segurança — ver contingency P0

---

## Player

### O que mostrar

| Evidência | Como |
|-----------|------|
| **Bundle certificado** | DevTools → Network → `index-B6M2smS9.js` (ou bundle indicado em `/meta` / certificação) |
| **Carregamento** | Login demo → dashboard → `/game` |
| **Produto real** | 1 gol obrigatório; saldo visível |

**URLs:** `https://www.goldeouro.lol` · alternativa `https://app.goldeouro.lol`

### Narrativa (20s)

> “O jogador consome a build que está na Vercel em produção — a mesma que passou pelo programa de certificação. O que vocês jogam é o que o usuário vê.”

### Plano B

Vídeo T-24h se canvas travar — ver contingency “Gameplay falha”.

---

## Admin

### O que mostrar

**URL:** `https://admin.goldeouro.lol`

| Tela | Mensagem para a sala |
|------|---------------------|
| **Dashboards** | Volume operacional; visão agregada |
| **Relatórios** | Tipos de movimento / ledger (read-only) |
| **Auditorias** | Rastreio de saques, PIX, estados — operação governada |

### Narrativa (20s)

> “O painel não é planilha paralela — reflete a mesma base que alimenta o player. Usamos para operação, auditoria e resposta a incidentes documentados.”

### Limites na demo

- **Não** aprovar saque manualmente  
- **Não** exportar CSV com PII sem necessidade  
- **Não** abrir drill de 34 linhas legado sem preparação

---

## Explicar: código live, baseline, runtime, governança

Use este bloco de **2 minutos** após as provas técnicas — linguagem executiva.

### “Código live”

> “O que roda em `goldeouro-backend-v2.fly.dev` é o commit publicado em `/meta`. Não é vídeo nem ambiente de laboratório.”

### Baseline congelada

> “A V1.6 **congelou** este SHA, release Fly v461 e bundle do player. Mudança em produção exige gate, rollback documentado e novo ciclo de certificação — não deploy silencioso.”

### Runtime verificável

> “Health, meta e teste 401 são verificações que qualquer due diligence pode repetir em cinco minutos, sem acesso ao nosso repositório interno.”

### Governança

> “Certificação **88/100 com ressalvas**, classificação **GOVERNED**, maturidade **semi-autonomous**: sabemos o que está bom, o que é legado estável e o que é roadmap V1.R/V2. Isso é maturidade, não marketing.”

---

## Checklist de validação ao vivo (marcar na reunião)

| # | Verificação | OK |
|---|-------------|----|
| 1 | `/health` → ok + dependências | ☐ |
| 2 | `/meta` → `gitCommit` = `a83c3cf` | ☐ |
| 3 | Webhook depósito sem HMAC → **401** | ☐ |
| 4 | Webhook payout sem HMAC → **401** | ☐ |
| 5 | Player carrega bundle certificado | ☐ |
| 6 | 1 gol executado com sucesso | ☐ |
| 7 | Admin dashboard aberto (read-only) | ☐ |
| 8 | Narrativa baseline + governança entregue | ☐ |

---

## Pré-validação (T-2h) — repetir antes da sala

Executar os mesmos passos em [V1-DEMO-ENVIRONMENT-CHECKLIST.md](V1-DEMO-ENVIRONMENT-CHECKLIST.md). Na reunião, preferir **repetição rápida** (30s em `/meta`) a descobrir divergência ao vivo.

---

## Referências cruzadas

| Tema | Documento |
|------|-----------|
| URLs e baseline | [../05-OPERATIONS/V1-ACCESS-OPERATIONS.md](../05-OPERATIONS/V1-ACCESS-OPERATIONS.md) |
| Roteiro completo 45–55 min | [V1-PRESENTATION-REHEARSAL-FLOW.md](V1-PRESENTATION-REHEARSAL-FLOW.md) |
| Falhas e perguntas | [V1-DEMO-CONTINGENCY-PLAN.md](V1-DEMO-CONTINGENCY-PLAN.md) |
| Q&A investidores | [../08-QA/V1-EXECUTIVE-QA.md](../08-QA/V1-EXECUTIVE-QA.md) |
| Certificação oficial | [../../../certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md](../../../certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md) |

---

## Confirmação de escopo

Este roteiro orienta **observação read-only** em produção durante a reunião. **Não altera** produção, banco de dados, deploy nem código funcional.
