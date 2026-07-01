# F3.1A — Auditoria read-only Efí Bank (PIX OUT / Cash-Out)

**Data:** 2026-06-02  
**Modo:** READ-ONLY ABSOLUTO  
**Escopo:** Documentação oficial e comunidade Efí sobre **PIX OUT** (envio de Pix / Cash-Out) como alternativa ou complemento ao fluxo Mercado Pago Payouts.  
**Proibido:** abrir conta, criar apps, executar Pix, alterar código/credenciais/deploy.

**Fontes primárias (fetch 2026-06-02):**

- [API Pix — Credenciais](https://dev.efipay.com.br/docs/api-pix/credenciais)
- [Envio e Pagamento Pix](https://dev.efipay.com.br/docs/api-pix/envio-pagamento-pix)
- [Webhooks](https://dev.efipay.com.br/docs/api-pix/webhooks)
- [Endpoints exclusivos Efí](https://dev.efipay.com.br/docs/api-pix/endpoints-exclusivos-efi)
- [Tarifas Efí](https://sejaefi.com.br/tarifas)
- Comunidade Efí (trechos citados onde a doc técnica não fecha SLA/tarifa de envio)

**Contexto Gol de Ouro:** backend hoje integra **Mercado Pago** (`pix-mercado-pago.js`); **não há** integração Efí no repositório auditado.

---

## Resumo executivo

| Tema | Achado documental |
|------|-------------------|
| **PIX OUT existe?** | **SIM** — “Envie Pix diretamente da API (Cash-Out)” |
| **Endpoint principal** | `PUT /v3/gn/pix/:idEnvio` (v2 legado ainda válido) |
| **Conta** | Conta Digital **Efí Pro** (PF) ou **Efí Empresas** (PJ) |
| **Sandbox** | Homologação com regras por **faixa de valor** + chave fixa `[email protected]` |
| **Homologação produção (envio)** | Escopo `pix.send` + **formulário** (comunidade oficial) + contato comercial; **sem SLA fixo** na doc técnica |
| **Webhooks** | **Obrigatório** na chave do **pagador** para envio; mTLS + sufixo `/pix` |
| **Custo envio** | Comunidade/oficial parcial: **1,19% ou mín. R$ 0,50** por envio (negociável com comercial) |
| **vs MP Payouts** | Efí: certificado mTLS em **toda** API Pix + webhook; MP: Ed25519 + Integrations team em produção |

| Veredito | **GO CONDICIONAL** (viável documentalmente; depende de conta Efí, liberação comercial de `pix.send` e infra mTLS) |
| Confiança | **80%** (lacunas de SLA e tarifa exata de envio só no comercial) |

---

## 1. Como funciona o PIX OUT (Cash-Out)

### 1.1 Modelo

| Item | Detalhe |
|------|---------|
| Produto | **API Pix** — Cash-Out |
| Fluxo | Débito da **Conta Digital Efí** do integrador → crédito na chave Pix do favorecido (qualquer PSP no DICT) |
| Autenticação | OAuth2 `POST /oauth/token` + **certificado P12/PEM em todas as requisições** |
| Idempotência | `idEnvio` no path — reenvio com **mesmo** id não debita duas vezes |
| Status inicial | `EM_PROCESSAMENTO` (HTTP 201) |
| Confirmação final | **Webhook** (recomendado) ou `GET /v2/gn/pix/enviados/id-envio/:idEnvio` |

### 1.2 Endpoints relevantes

| Operação | Método / rota | Escopo |
|----------|---------------|--------|
| **Enviar Pix (chave)** | `PUT /v3/gn/pix/:idEnvio` | `pix.send` |
| Enviar Pix (legado) | `PUT /v2/gn/pix/:idEnvio` | `pix.send` |
| Mesma titularidade | `PUT /v2/gn/pix/:idEnvio/mesma-titularidade` | `gn.pix.sameownership.send` — **somente produção** |
| Pagar QR Code | `PUT /v2/gn/pix/:idEnvio/qrcode` | `gn.qrcodes.pay` |
| Consultar envio | `GET /v2/gn/pix/enviados/id-envio/:idEnvio` | `gn.pix.send.read` |
| Saldo | `GET /v2/gn/saldo/` (comunidade) | `gn.balance.read` |

**Payload típico (envio por chave):**

```json
{
  "valor": "12.34",
  "pagador": { "chave": "<chave-pagador-efi>", "infoPagador": "..." },
  "favorecido": { "chave": "<chave-destino>" }
}
```

Chaves suportadas (comunidade + doc): CPF, CNPJ, e-mail, telefone (+55…), aleatória, e pagamento via copia-e-cola (endpoint QR separado).

### 1.3 Requisitos técnicos obrigatórios (envio)

1. Escopo **`pix.send`** habilitado na aplicação (Produção e/ou Homologação).
2. **Webhook** cadastrado na **chave Pix do pagador** (`PUT /v2/webhook/:chave`).
3. Certificado **.p12/.pem** do ambiente correto em **todas** as chamadas.
4. **`idEnvio`** único por nova transação.
5. Recomendação doc: **serializar** envios — aguardar webhook da transação anterior antes do próximo (evita conflito de saldo / “balde de fichas”).

### 1.4 Rate limit / “balde de fichas”

Resposta pode incluir headers:

- `Bucket-Size` — fichas disponíveis (0 = esgotado)
- `Retry-After` — segundos para nova tentativa

HTTP **429** possível em alta volumetria.

### 1.5 Erros 5XX

Doc alerta: em **5XX**, a transação **pode** ter sido processada — **não** reenviar imediatamente com novo `idEnvio`; consultar status ou reenviar com **mesmo** `idEnvio`.

---

## 2. Requisitos da conta

| Requisito | Obrigatório? | Fonte |
|-----------|:------------:|-------|
| Conta Digital Efí (**Pro** ou **Empresas**) | **SIM** | Credenciais |
| CNPJ | **NÃO** obrigatório | FAQ portal — Efí Pro para PF |
| Aplicação API Pix criada no painel | **SIM** | Credenciais |
| Escopos `pix.send`, `gn.pix.send.read`, `webhook.write` | **SIM** (envio + consulta + cadastro webhook) | Credenciais / envio-pagamento-pix |
| Certificado por ambiente (até 5 por ambiente) | **SIM** | Credenciais |
| Chave Pix do pagador na conta Efí | **SIM** (implícito no payload `pagador.chave`) | Envio |
| Saldo na conta origem | **SIM** (operação real) | Lógica + comunidade |
| Apps criadas **antes de 29/07/2024** | Reativar escopo `pix.send` (desligar/ligar) | envio-pagamento-pix |

### Limites diários pré-aprovados (produção — envio)

| Tipo de conta | Limite inicial (doc) |
|---------------|----------------------|
| Efí Pro | **R$ 0,30**/dia — “para você mesmo ou contatos seguros” |
| Efí Empresas | **R$ 1,00**/dia — idem |

Alteração de limites: **somente conta Efí Empresas** (requisito explícito da doc).

---

## 3. Sandbox / homologação

### 3.1 Ambientes

| Ambiente | Rota base |
|----------|-----------|
| **Produção** | `https://pix.api.efipay.com.br` |
| **Homologação** | `https://pix-h.api.efipay.com.br` |

- Credenciais e certificado **separados** por ambiente (painel API).
- SDKs usam flag `sandbox: true/false` — **não** existe parâmetro `sandbox` na URL da API (comunidade).

### 3.2 Simulação de envio (homologação)

| Valor do Pix | Comportamento |
|--------------|---------------|
| R$ 0,01 – R$ 10,00 | **Confirmado** (status via webhook) |
| R$ 10,01 – R$ 20,00 | **Rejeitado** (via webhook) |
| **> R$ 20,00** | Rejeitado **na requisição** (sem webhook) |
| R$ 4,00 | Duas devoluções de R$ 2,00 |
| R$ 5,00 | Uma devolução de R$ 5,00 |

**Chave em homologação (envio por chave):** só **`[email protected]`** — outras chaves → erro de chave inválida (doc).  
**Dados bancários** em homologação: sem alteração documentada.

### 3.3 Homologação vs produção (envio)

| Item | Homologação | Produção |
|------|-------------|----------|
| Testar endpoint com escopo | **SIM** (regras acima) | Exige **liberação** adicional (ver §4) |
| Validar chave real DICT | **NÃO** (chave fake) | **SIM** |
| Mesma titularidade | Endpoint **indisponível** | Disponível |

---

## 4. Webhooks

### 4.1 Cadastro

| Item | Valor |
|------|-------|
| Endpoint | `PUT /v2/webhook/:chave` |
| Escopo | `webhook.write` |
| Associação | **Uma URL por chave Pix**; uma chave → uma URL |
| URL | Efí acrescenta **`/pix`** ao callback — usar `?ignorar=` ou `?hmac=...&ignorar=` na URL cadastrada |

### 4.2 Segurança

| Camada | Detalhe |
|--------|---------|
| **mTLS** | Obrigatório (TLS ≥ 1.2); cadeia pública Efí: [prod](https://certificados.efipay.com.br/webhooks/certificate-chain-prod.crt) / [homolog](https://certificados.efipay.com.br/webhooks/certificate-chain-homolog.crt) |
| IP allowlist | Sugerido **34.193.116.226** |
| HMAC na URL | Recomendado em conjunto com mTLS |

### 4.3 Callback de **envio**

- Tipo de payload documentado em “Recebendo Callbacks” — exemplos incluem bloco **Envio**.
- Timeout do servidor do integrador: **60 s**.
- Retentativas: até **9** (escala 5–160 min) se resposta ≠ 2xx.
- Reenvio manual: `POST /v2/gn/webhook/reenviar` (até **30 dias**; não aplica Pix Automático).

### 4.4 Obrigatoriedade para PIX OUT

**SIM** — doc envio-pagamento-pix: sem webhook na chave do pagador, o integrador **não** recebe confirmação de sucesso/falha do envio (consulta GET permanece como fallback).

---

## 5. Homologação e ativação em produção

### 5.1 O que a doc técnica define

| Etapa | Descrição |
|-------|-----------|
| 1 | Conta Efí + app API Pix + certificado homologação |
| 2 | Habilitar escopos em **Homologação** (`pix.send`, webhooks, leitura) |
| 3 | Cadastrar webhook (mTLS) na chave pagador |
| 4 | Testar `PUT /v3/gn/pix/:idEnvio` com regras de valor + chave homolog |
| 5 | Repetir em **Produção** com credenciais/certificado de produção |

**Não há** na doc técnica:

- Tabela `external_reference` estilo Mercado Pago Payouts `integration-test`
- Homologator de produto no painel (tipo Checkout MP)
- Ed25519 / Integrations team

### 5.2 Liberação do envio em **produção**

| Fonte | Requisito |
|-------|-----------|
| Doc técnica | Escopo **`pix.send`** na aplicação (produção) |
| [Comunidade — Implementação Transferências PIX](https://comunidade.sejaefi.com.br/discussao/implementacao-transferencias-pix) | **Formulário** na página de gestão/envio Pix (link na doc *Gestão de Pix* / envio) → “entraremos em contato” |
| Comunidade — Taxas Cash in/out | Tarifa de **envio** informada no momento da **liberação comercial** do endpoint |

**Conclusão:** homologação técnica (API) ≠ liberação comercial do **Cash-Out em produção**. Dois gates.

### 5.3 Tempo médio de ativação

| Afirmação | Evidência | Confiabilidade |
|-----------|-----------|----------------|
| “Integração rápida em **até 3 dias**” (suporte consultoria para **conectar APIs**) | [Portal dev.efipay.com.br](https://dev.efipay.com.br/) | Marketing — **não** específico para `pix.send` |
| “**Até 2 dias úteis**” para produção | Aparece em sínteses web; **não** localizado no fetch da doc webhooks/credenciais | **Não confirmado** na doc técnica lida |
| Pós-formulário envio Pix | “Aguardar contato” (comunidade) | **Sem prazo** |

**Resposta auditável:** **INDETERMINADO** para SLA de liberação de **PIX OUT produção**; usar **3 dias úteis** apenas como referência de onboarding API geral, não como compromisso documentado de Cash-Out.

---

## 6. Restrições

| Restrição | Detalhe |
|-----------|---------|
| Limites diários baixos iniciais | R$ 0,30 (Pro) / R$ 1,00 (Empresas) até revisão |
| Alterar limites | Conta **Empresas** |
| Envios paralelos | Desencorajado — aguardar webhook |
| Balde de fichas / 429 | Controle de throughput |
| Homologação | Chave destino fixa; não valida DICT real |
| Validação favorecido | Sem endpoint de “pré-consulta” de chave (comunidade — BC) |
| Restrição CPF/CNPJ no envio | Comunidade recomenda controles no payload; configs em [endpoints exclusivos](https://dev.efipay.com.br/docs/api-pix/endpoints-exclusivos-efi) focam **recebimento** |
| Mesma titularidade | Só produção |
| Padronização BACEN | Endpoints podem mudar — aviso prévio na doc |
| Certificado | Download único — perda exige novo certificado |

---

## 7. Custos

### 7.1 Site tarifas (recebimento — referência)

| Produto | Tarifa publicada |
|---------|------------------|
| Pix recebido (app/API chave cadastrada) | **1,19%** |
| Pix Cob / CobV API | **1,19%** |
| 30 Pix/mês pelo app | Grátis* (*não vale chave cadastrada na API/webhook) |

### 7.2 Envio (Cash-Out) — **não** detalhado na página tarifas principal

| Fonte | Valor citado |
|-------|--------------|
| Comunidade (staff Efí) | **1,19% do valor ou R$ 0,50, o que for maior** por envio aprovado |
| Comunidade | Tarifa de envio definida na **liberação comercial**; alto volume → negociar |
| Exemplo staff | Pix R$ 0,37 → destinatário recebe R$ 0,37; debita R$ 0,87 (0,37 + 0,50 mínimo) |

**TED** no site (R$ 5,00 etc.) **≠** tarifa de envio Pix API (comunidade distingue).

### 7.3 Estorno de tarifa

Devolução Pix de cobrança recebida: tarifa do recebimento **não** é estornada (comunidade).

---

## 8. Comparativo rápido: Efí vs Mercado Pago Payouts (Gol de Ouro)

| Dimensão | Efí PIX OUT | MP Payouts (estado F2.5) |
|----------|-------------|---------------------------|
| Endpoint | `PUT /v3/gn/pix/:idEnvio` | `POST /v1/transaction-intents/process` |
| Conta | Conta Digital Efí | Conta seller MP |
| Sandbox | Homologação + faixas de valor | `X-Test-Token` + integration-test |
| Gate produção | Formulário + comercial + `pix.send` | Ed25519 + Integrations team |
| Segurança API | Certificado mTLS todas requisições | Bearer + Ed25519 produção |
| Webhook envio | **Obrigatório** (chave pagador) | `notification_url` opcional no body |
| Código no repo | **Ausente** | Implementado (`pix-mercado-pago.js`) |
| Bloqueio atual GO | N/A (não iniciado) | `Invalid signature` (Ed25519) |

---

## 9. Lacunas documentais (auditoria)

| Lacuna | Impacto |
|--------|---------|
| SLA formal liberação `pix.send` produção | Planejamento |
| Tarifa envio na página tarifas (só comercial/comunidade) | Orçamento |
| URL estável do formulário de liberação (só referência comunidade → Gestão de Pix) | Operação |
| Restrições de envio por documento (endpoint dedicado) | Compliance saque para terceiros |

---

## 10. Veredito e próximos passos (somente leitura)

| Veredito | **GO CONDICIONAL** |
|----------|-------------------|
| Condições | Abrir/usar conta Efí; homologar com certificado + webhook mTLS; solicitar liberação comercial envio; implementar novo adaptador no backend |
| Confiança | **80%** |

**Se F3.1A for decisão de produto:** comparar custo (1,19%/R$0,50 mín.), limite inicial (R$ 1/dia Empresas), tempo de liberação comercial e esforço mTLS/webhook vs. conclusão do gate Ed25519 no MP.

---

## Referências

| Tópico | URL |
|--------|-----|
| Credenciais / escopos / rotas base | https://dev.efipay.com.br/docs/api-pix/credenciais |
| Envio Pix (Cash-Out) | https://dev.efipay.com.br/docs/api-pix/envio-pagamento-pix |
| Webhooks / mTLS | https://dev.efipay.com.br/docs/api-pix/webhooks |
| Configurações conta/chave | https://dev.efipay.com.br/docs/api-pix/endpoints-exclusivos-efi |
| SDK Node | https://github.com/efipay/sdk-node-apis-efi |
| Tarifas | https://sejaefi.com.br/tarifas |
| Formulário envio (comunidade) | https://comunidade.sejaefi.com.br/discussao/implementacao-transferencias-pix |

---

**Auditoria:** READ-ONLY — nenhum sistema alterado.
