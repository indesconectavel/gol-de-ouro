# PRÉ-EXECUÇÃO — BLOCO M — SEGURANÇA CRÍTICA

**Modo:** somente leitura do repositório e documentação interna (sem alteração de código).  
**Data:** 2026-03-30.  
**Base:** `docs/relatorios/DIAGNOSTICO-BLOCO-M-SEGURANCA-2026-03-30.md`.

---

## 1. Impacto das correções (por vulnerabilidade)

### 1.1 ADMIN BOOTSTRAP (`POST /api/admin/bootstrap`)

| Questão | Resposta (evidência / hipótese) |
|---------|----------------------------------|
| O endpoint é usado em produção? | **Provável** no **primeiro** arranque ou quando ainda não existe `tipo = 'admin'` — é o fluxo documentado para criar o primeiro administrador (`MAPA-ENDPOINTS-V1.md`, `CHECKLIST-FINAL-PRE-FLY-BLOCO-J`, matriz R10). |
| Existe admin já criado? | **Não verificável** neste modo (requer consulta ao Postgres). Com **≥1 admin**, o código devolve **403** (“Já existe um administrador configurado”) — o endpoint permanece **inofensivo** nesse estado. |
| Bloquear/remover impacta algo? | **Sim, se** ainda não houver admin e for a **única** forma prevista de promoção: operação teria de usar **outro** mecanismo (SQL manual, seed, novo fluxo). **Não** impacta login de jogadores nem PIX por si só. |
| Risco de execução | Alterar comportamento **antes** de existir admin operacional pode **impedir** a subida do painel; alterar **depois** de já existir admin tem impacto **baixo** no dia a dia (endpoint já retorna 403). |

---

### 1.2 WebSocket (`src/websocket.js` + servidor em `server-fly.js`)

| Questão | Resposta (evidência / hipótese) |
|---------|----------------------------------|
| Quais fluxos dependem do WS? | **Gameplay principal** usa **`POST /api/games/shoot`** (HTTP + JWT) — não depende do WebSocket. No **player**, componentes `Chat.jsx` e `AnalyticsDashboard.jsx` abrem WebSocket para hosts **default** `goldeouro-backend.onrender.com`; **não foi encontrada importação** desses componentes noutras páginas no `goldeouro-player/src` (possível **código morto** ou uso indireto não detetado nesta varredura). |
| Exigir auth quebra algo? | Corrigir **`decoded.id` → `decoded.userId`** (alinhamento ao JWT) **restaura** auth no WS — não deve quebrar HTTP. Exigir auth **antes** de `join_room` / `join_queue` pode quebrar **apenas** clientes que hoje confiam em conexão anónima (se existirem). |
| Utilizadores anónimos usam WS? | O servidor **aceita** conexão sem mensagem `auth` prévia; salas/filas podem ser usadas **sem** `authenticated` até certas ações. **Hipótese:** pouco uso em produção real se o produto não montar Chat/Analytics nas rotas. |

---

### 1.3 Webhook Mercado Pago (`POST /api/payments/webhook`)

| Questão | Resposta (evidência / hipótese) |
|---------|----------------------------------|
| Validação de assinatura impacta processamento atual? | Com **`MERCADOPAGO_WEBHOOK_SECRET`** definido, o validador exige **HMP** (headers/query/body) coerentes com MP; **rejeição 401** em produção se assinatura inválida. |
| Pode bloquear pagamentos válidos? | **Sim, se** secret no servidor ≠ secret configurado no painel MP, **ou** `x-signature` / `data.id` / `x-request-id` não baterem com o que o MP envia (relógio, proxy a strippar headers). O handler **ainda** consulta a API MP após aceitar o POST — bloqueio na **porta** impede até essa consulta. |
| Fail-open? | **Se o secret não estiver definido**, a validação **não é aplicada**; ativar secret em produção é um **passo de configuração**, não só de código. |

---

### 1.4 Frontend — “secrets” `VITE_PIX_*` (`paymentService.js`)

| Questão | Resposta (evidência / hipótese) |
|---------|----------------------------------|
| Remover variáveis afeta criação de PIX? | O método **`createPix`** envia ao backend apenas `amount`, `pixKey`, `description`, `environment`, `currency`, `timeout` — **não** inclui `pixSecret` no JSON. Os campos `pixKey`/`pixSecret`/`pixWebhookUrl` em `getPaymentConfig()` servem sobretudo para **metadados local** / futuro; **não** há evidência de que o backend exija estes valores no body do player. |
| Dependência real? | **Baixa** para o fluxo atual de **depósito** via backend; risco principal é **exposição** se alguém preencher `VITE_PIX_*_SECRET` no build. Remover **uso** ou **documentar “não usar”** tem regressão **baixa** se nada ler esses valores no runtime crítico. |
| Onde é usado? | `Withdraw.jsx` chama `paymentService.createPix` / `getUserPix` — continua a depender só do **endpoint** autenticado e do payload acima. |

---

## 2. Dependências críticas

| Área | Ficheiros / rotas prováveis |
|------|------------------------------|
| **Bootstrap admin** | `server-fly.js` (`POST /api/admin/bootstrap`), ordem vs `app.use('/api/admin', …)` |
| **WebSocket** | `server-fly.js` (instanciação `WebSocketManager`), `src/websocket.js`, `database/supabase-config.js` (import em WS) |
| **Webhook** | `server-fly.js`, `utils/webhook-signature-validator.js`, variáveis `MERCADOPAGO_*` |
| **Player** | `goldeouro-player/src/services/paymentService.js`, `goldeouro-player/src/pages/Withdraw.jsx`, `env.example` / `.env` |
| **Integrações** | Mercado Pago (API + webhook), Supabase (PostgREST), Fly (proxy) |
| **Fluxos sensíveis** | Login/registo, shoot, PIX criar/webhook, saques, admin `x-admin-token` |

---

## 3. Estratégia de rollback

| Cenário | Abordagem |
|---------|-----------|
| **Reverter commit** | Adequado para alterações **puramente de código** (WS, bootstrap, remoção de env no frontend). **Tag/commit** antes da cirurgia (ex.: checkpoint já existente no projeto ou novo `chore: pre-bloco-m-security`). |
| **Flag de ambiente** | Útil para: exigir `MERCADOPAGO_WEBHOOK_SECRET` com `WEBHOOK_STRICT=true`, desativar bootstrap com `ENABLE_ADMIN_BOOTSTRAP=false` — **rollback** = desligar flag sem redeploy completo (depende de implementação futura). |
| **Só configuração** | Configurar secret MP e alinhar painel MP — rollback = reverter secret no Fly e no MP (risco de **downtime** de webhook **curto**). |
| **Downtime** | Mudança de validação webhook pode causar **rejeição** de notificações até MP e backend estarem alinhados — planear janela ou teste em sandbox. |

---

## 4. Risco de regressão (por item)

| Item | Regressão |
|------|-----------|
| **End sh/bootstrap ou proteger com secret** | **Médio** se ainda não existir admin (precisa alternativa operacional). **Baixo** se já existir admin. |
| **Corrigir JWT WS (`userId`) + exigir auth em salas/filas** | **Baixo** a **médio** — HTTP inalterado; possível quebra só de clientes WS legados. |
| **Webhook: obrigar secret em produção** | **Alto** se secret/errata MP → **PIX não creditam** até corrigir. |
| **Frontend: remover `VITE_PIX_*_SECRET` / não usar** | **Baixo** — payload atual não depende deles. |

---

## 5. Ordem de execução segura (sugerida)

1. **Checkpoint Git** (tag + commit) antes de qualquer alteração.  
2. **Configuração** (sem código): garantir `MERCADOPAGO_WEBHOOK_SECRET` e paridade com MP **em staging**; validar webhook de teste **antes** de produção.  
3. **Bootstrap admin** (código ou flag): **depois** de confirmar que existem **processos** para criar admin sem endpoint aberto, ou **depois** de já existir admin em produção (impacto menor).  
4. **WebSocket**: corrigir **claims JWT** primeiro; depois **exigir auth** em ações sensíveis — testar isoladamente (pode ser PR separado).  
5. **Frontend** (`paymentService`): limpeza de variáveis sensíveis / documentação — **pode** ir junto com PR pequeno, **baixo** acoplamento ao PIX real.  

**Podem ser feitas juntas (mesmo PR):** correção JWT + supabase `select` no WS (sem `nome` se coluna inexistente), desde que testados.  
**Isolar:** mudança **estrita** de política webhook (401) — melhor com **teste de carga** em webhook e runbook.

---

## 6. Conclusão da pré-execução

- As correções são **compatíveis** com login, gameplay HTTP e PIX **desde** que o webhook e o **secret** MP sejam validados **antes** de endurecer em produção.  
- O maior **risco operacional** de regressão é **webhook** mal configurado; o maior **risco de produto** de bootstrap é **remover** sem plano alternativo para o primeiro admin.  
- **WebSocket** no player parece **marginal** à experiência principal; ainda assim correções no servidor devem ser testadas com **cliente WS** real se o WS for mantido.

**Próximo passo:** autorizar implementação por item, com testes e (recomendado) **tag de rollback** dedicada ao BLOCO M.
