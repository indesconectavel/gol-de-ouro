# DIAGNÓSTICO — BLOCO M — SEGURANÇA

**Modo:** leitura do repositório (sem execução contra produção).  
**Data de referência:** 2026-03-30.

---

## 1. Resumo executivo

O backend principal (`server-fly.js`) combina **boas práticas pontuais** (Helmet, CORS com allowlist, rate limit global e específico para auth, JWT em rotas sensíveis, crédito PIX com **claim** em `pagamentos_pix` + confirmação via **API Mercado Pago** antes de creditar, lock otimista de saldo no chute) com **riscos concretos**: **bootstrap de admin** em ambiente sem administrador pré-existente, **webhook PIX** aceite sem validação de assinatura quando `MERCADOPAGO_WEBHOOK_SECRET` está ausente, **WebSocket** com conexão aberta e rotas `join_room` / `join_queue` **sem** exigir autenticação prévia, e **bug provável** JWT (`userId` no token vs `decoded.id` no handler de auth WS). No frontend, **segredos Mercado Pago** podem ser expostos no bundle se `VITE_PIX_*` forem preenchidos (padrão Vite).

**Veredito geral de segurança:** **SEGURO COM RESSALVAS** — operação real exige **configuração** (secret webhook, `ADMIN_TOKEN`, política para bootstrap) e **clareza** sobre WS e métricas públicas.

---

## 2. Vulnerabilidades críticas (🔴)

| ID | Descrição | Evidência | Exploração / impacto |
|----|-------------|-----------|----------------------|
| **M-CRIT-1** | **Elevação para admin no primeiro utilizador autenticado** quando não existe nenhum `tipo = 'admin'` | `POST /api/admin/bootstrap` com `authenticateToken` apenas; promove `req.user.userId` se contagem de admins = 0 | Em **base nova** (ou após reset), o **primeiro registo/login** que chamar este endpoint torna-se **admin**. Atacante pode antecipar o operador legítimo. |
| **M-CRIT-2** | (Reservado — não classificado como crítico financeiro direto nesta análise) | Crédito PIX exige linha em `pagamentos_pix` + status `approved` na API MP | Fraude de saldo **não** é trivial só com POST falso no webhook; depende de pagamento MP válido associado ao utilizador. |

*Nota:* apenas **M-CRIT-1** cumpre o critério “comprometimento do sistema” de forma direta. Risco financeiro imediato via webhook isolado é **mitigado** pela consulta à API MP e pelo claim atómico na linha PIX (ver secção 7).

---

## 3. Vulnerabilidades altas (🟠)

| ID | Descrição | Evidência | Impacto |
|----|-------------|-----------|---------|
| **M-ALT-1** | **Webhook sem assinatura** se `MERCADOPAGO_WEBHOOK_SECRET` não estiver definido | `server-fly.js`: bloco de validação só corre `if (process.env.MERCADOPAGO_WEBHOOK_SECRET)` | **Fail-open:** qualquer cliente pode POSTar no URL do webhook; o processamento ainda consulta MP e credita só com pagamento aprovado e linha correta, mas há **abuso** (carga, custos API, ruído) e superfície maior. |
| **M-ALT-2** | **Modo não produção** ignora assinatura inválida | Comentário e ramo `NODE_ENV !== 'production'` que segue após log | Em **staging** mal configurado, webhooks falsos podem ser aceitos no fluxo (ainda sujeitos à verificação MP no handler). |
| **M-ALT-3** | **WebSocket: auth quebrada + superfície sem auth** | `src/websocket.js`: `jwt.sign` em `server-fly` usa `userId`, mas `authenticateClient` usa `decoded.id` e `select('... nome ...')` (coluna pode não existir); `join_room` / `join_queue` **não** verificam `authenticated` | Conexões anónimas podem entrar em salas/filas; `game_action` e `chat` exigem `authenticated` — auth por WS provavelmente **nunca associa** utilizador corretamente. Risco de **abuso de canal** / confusão de identidade se o jogo em WS for usado em produção. |
| **M-ALT-4** | **Segredos no cliente (Vite)** | `goldeouro-player/.../paymentService.js`: `VITE_PIX_LIVE_SECRET`, `VITE_PIX_SANDBOX_*` em `import.meta.env` | Qualquer variável `VITE_*` vai para o **bundle público** se definida. Hoje o `createPix` **não** envia `pixSecret` no JSON para o backend (payload só amount, pixKey, etc.) — risco é **exposição de credencial** se alguém preencher essas env em build de produção. |

---

## 4. Vulnerabilidades médias (🟡)

| ID | Descrição | Evidência | Impacto |
|----|-------------|-----------|---------|
| **M-MED-1** | **CORS sem `Origin`** permitido | `origin` vazio → `callback(null, true)` | Ferramentas sem Origin (curl, apps nativos) chamam API; não contorna JWT sozinho, mas aumenta superfície de automação. |
| **M-MED-2** | **Rate limit global** não aplica a `/api/auth/*` (substituído por `authLimiter` 5/15min) e **pula** `/api/analytics` | `skip` em `server-fly.js` | Possível **abuso** de beacon analytics se o endpoint for pesado; auth ainda limitado pelo segundo middleware. |
| **M-MED-3** | **Idempotência do chute** em memória (`idempotencyProcessed`) | Map em processo; TTL; não partilhado entre instâncias | Em **múltiplas máquinas Fly**, duplicar chute com mesma chave pode **não** ser detectado; reinício limpa estado. |
| **M-MED-4** | **Endpoints públicos** com informação operacional | `GET /api/metrics`, `GET /api/monitoring/metrics`, `GET /api/production-status` sem autenticação | **Divulgação** de contagens, memória, uptime — útil para reconhecimento e monitorização não autorizada. |
| **M-MED-5** | **JWT sem refresh** | `expiresIn: '24h'` | Sessão longa; revogação depende de rotação de segredo ou espera de expiração. |
| **M-MED-6** | **Token em `localStorage`** | `AuthContext` / fluxo típico | Risco clássico **XSS** → roubo de token; depende da higiene do frontend. |

---

## 5. Vulnerabilidades baixas (🟢)

| ID | Descrição | Nota |
|----|-------------|------|
| **M-BAIXO-1** | `GET /api/debug/token` devolve detalhes em não produção | Em `NODE_ENV === 'production'` retorna **404** — aceitável. |
| **M-BAIXO-2** | Logs de monitorização por requisição | Possível vazamento de paths em logs; volume. |
| **M-BAIXO-3** | Componentes player com WebSocket para `onrender.com` / analytics | Podem ser legados ou desativados — verificar uso real; risco principal é **terceiro** ou confusão de ambiente. |

---

## 6. Superfícies de ataque identificadas

1. **HTTP API pública:** registo, login, webhook PIX, health, métricas, rotas legadas `/auth/login`.
2. **HTTP API autenticada (Bearer):** perfil, chute, PIX criar/listar, saques, fila, alteração de password.
3. **Painel admin:** `/api/admin/*` com header **`x-admin-token`** = `ADMIN_TOKEN` (mín. 16 caracteres).
4. **WebSocket** (mesmo processo HTTP): conexão imediata; mensagens `auth`, salas, filas, jogo, chat.
5. **Frontend estático:** bundle com `VITE_*`; `localStorage` com JWT.
6. **Infra:** Fly proxy (`trust proxy: 1`); variáveis sensíveis só no servidor exceto se mal configuradas no build do player.

---

## 7. Fluxos sensíveis mapeados

### Autenticação
- JWT HS256 com `JWT_SECRET`; payload inclui `userId`, `email`, `username`; expiração 24h.
- Rotas críticas usam `authenticateToken` em `server-fly.js`.
- **Gap:** módulo `src/websocket.js` parece usar **`decoded.id`** em vez de **`decoded.userId`** — inconsistente com o emitido pelo login.

### Saldo
- **Chute:** `POST /api/games/shoot` exige token; valor fixo R$ 1,00 no servidor; update com `.eq('saldo', user.saldo)` (lock otimista); idempotência opcional por header.
- **Crédito PIX:** fluxo principal via RPC ou JS legacy com **claim** `pending` → `approved` antes de somar saldo.

### Pagamento
- Criação de cobrança autenticada; webhook **público**; validação HMAC Mercado Pago quando secret configurado; confirmação de estado via API MP com `MERCADOPAGO_ACCESS_TOKEN`.
- **Idempotência de crédito:** centrada no estado da linha `pagamentos_pix` + reconciliação periódica.

### Gameplay
- Lógica principal em HTTP; lote em **memória** — escalabilidade horizontal com várias instâncias é um tópico **arquitetural** (fora BLOCO M detalhado aqui).

---

## 8. Pontos de exposição no frontend

- **URL da API** e flags de ambiente visíveis no cliente (`VITE_BACKEND_URL`, etc.) — esperado.
- **`VITE_PIX_*`:** não devem conter segredos reais; se o produto usar apenas backend para MP, remover do player ou usar **somente** variáveis públicas (se existirem) documentadas pelo MP.
- **Sem evidência** nesta leitura de `JWT_SECRET` ou `SUPABASE_SERVICE_ROLE_KEY` no código do player (bom).

---

## 9. Pontos de exposição no backend

- **Webhook** e **CORS** conforme acima.
- **SQL injection:** uso de Supabase client com objetos (não concatenação de SQL manual nos trechos lidos) — risco **baixo** no estilo PostgREST.
- **IDOR:** perfil e chute usam `req.user.userId` — adequado se o middleware for universal nessas rotas.
- **Erros:** mensagens genéricas na maioria; `/api/debug/token` condicionado ao ambiente.

---

## 10. Veredito geral de segurança

**SEGURO COM RESSALVAS**

**Justificativa:** Não foi identificado, nesta análise estática, um caminho **direto e trivial** para **inventar saldo** só manipulando o body no cliente ou um webhook isolado sem correspondência no Mercado Pago e na tabela `pagamentos_pix`. Em contrapartida, **bootstrap de admin**, **webhook sem secret**, **WS** e **secrets `VITE_*`** são **ressalvas sérias** antes de escalar tráfego ou confiar no painel administrativo.

---

## Prioridade sugerida de endurecimento (sem implementar aqui)

1. **Imediato:** Garantir `MERCADOPAGO_WEBHOOK_SECRET` em produção; revisar **bootstrap admin** (desativar após primeiro admin, secret separado, ou provisionamento só por infra).
2. **Curto prazo:** Corrigir **JWT no WebSocket** (`userId` vs `id`); exigir auth antes de `join_room` / `join_queue` ou isolar WS.
3. **Curto prazo:** Remover ou nunca definir `VITE_PIX_*_SECRET` no build do player; auditar bundle.
4. **Médio prazo:** Proteger ou restringir `/api/metrics` e `/api/monitoring/metrics`; idempotência distribuída para chutes se houver >1 instância.

---

## Respostas aos objetivos do pedido

| Pergunta | Resposta |
|----------|----------|
| Sistema explorado financeiramente com facilidade? | **Não trivial** no fluxo PIX analisado (dependência MP + linha local). |
| Fraude de saldo por cliente? | **Chute e PIX** têm validações servidor; risco maior é **operação** (bootstrap admin, WS, config). |
| Acesso indevido? | **Admin bootstrap** e **ADMIN_TOKEN** fraco/vazado são os vetores mais claros. |
| Falhas críticas antes de escalar? | **Bootstrap admin** e configuração de **webhook** são as mais urgentes. |
| Prioridade de correção | Ver lista acima. |
