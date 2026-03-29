# AUDITORIA READ-ONLY — BLOCO G — ANTIFRAUDE

**Caminho deste ficheiro:** `docs/relatorios/AUDITORIA-READONLY-BLOCO-G-ANTIFRAUDE-2026-03-29.md`  
**Espelho (mesmo conteúdo, mais fácil de abrir):** `docs/AUDITORIA-BLOCO-G-ANTIFRAUDE-2026-03-29.md`

**Projeto:** Gol de Ouro (backend principal: `server-fly.js`)  
**Data:** 2026-03-29  
**Modo:** READ-ONLY — nenhuma alteração de código; leitura estática do repositório.  
**Nota de escopo:** Existe documentação de “BLOCO G” focada em UX (`docs/relatorios/BLOCO-G-PLANO-INICIAL.md`). **Esta auditoria segue o enunciado operacional:** antifraude, robustez, superfícies de API e consistência — sem revisão de player/admin além do estritamente necessário para contratos (ex.: header de idempotência no cliente).

---

## 1. Resumo executivo

O backend possui **controles reais** em pontos sensíveis: JWT no chute e rotas de usuário/financeiro, **lock otimista de saldo** no `POST /api/games/shoot`, validação de direção/valor (V1 fixo em R$ 1), **idempotência opcional por header** no chute, e **crédito PIX** com caminho preferencial por RPC e fallback com *claim* `pending → approved` e *lock* de saldo. Em contrapartida, permanecem **superfícies públicas amplas** (`/health`, `/api/monitoring/*`, `/api/production-status`) que expõem estado operacional ou métricas de processo **sem autenticação**, o que facilita **planejamento de abuso** (em especial contador global / Gol de Ouro) e **reconhecimento de infraestrutura**. A idempotência do chute é **em memória**, com TTL fixo, e a chave só é registrada **após** o fluxo bem-sucedido — o que deixa **janela teórica** de duplicidade em falha tardia do processo. Lotes ativos e progressão de lote são **por processo** (`Map` em memória), com implicações diretas em **multi-instância** ou **restart**.

**Síntese:** o núcleo financeiro do chute e do PIX está **parcialmente blindado** contra condições de corrida óbvias; o conjunto **antifraude + robustez operacional** ainda apresenta **riscos moderados a altos** concentrados em **observabilidade exposta**, **estado global em RAM** e **contrato de idempotência** (cliente gera chave nova a cada chamada explícita a `processShot`, o que não protege duplo disparo).

---

## 2. Escopo auditado

| Incluído | Evidência principal |
|----------|---------------------|
| `server-fly.js` | Rotas, rate limit, CORS, jogo, PIX, webhook, health/monitoring, debug condicional, admin mount |
| `routes/adminApiFly.js` | `x-admin-token`, rotas administrativas |
| `routes/analyticsIngest.js` | Ingestão pública de eventos |
| `middlewares/authMiddleware.js` | Padrão JWT / admin (referência; o servidor usa `authenticateToken` local em vários pontos) |
| `goldeouro-player/src/services/gameService.js` | Apenas contrato `X-Idempotency-Key` do chute (sem alteração) |

| Fora do escopo solicitado | Motivo |
|---------------------------|--------|
| Alterações em código | Instrução explícita do solicitante |
| Admin React / Player UI | Instrução explícita (exceto linha de evidência acima) |

---

## 3. Superfícies expostas

### 3.1 Públicas (sem JWT)

| Rota | Função observada | Risco antifraude / operacional |
|------|------------------|--------------------------------|
| `GET /` | Metadados do serviço e ponteiros para `/health`, `/api` | Baixo (descoberta) |
| `GET /health` | Status + `database` / `mercadoPago` + **`contadorChutes`**, **`ultimoGolDeOuro`** | **Alto** — contador global acessível sem credencial |
| `GET /ready` | `ready` / `not ready` | Baixo |
| `GET /api/metrics` | Agregações; `totalChutes` / `ultimoGolDeOuro` mantidos **zerados** no payload montado (dados “reais” do contador **não** vêm aqui na lógica atual) | Baixo para contador; médio para `totalUsuarios` (contagem) |
| `GET /api/monitoring/metrics` | Memória, CPU, uptime, PID, contadores de requests do processo | **Alto** — superfície de reconhecimento e carga |
| `GET /api/monitoring/health` | Uptime, memória, flags DB/MP, contadores de request | **Alto** (similar) |
| `GET /meta` | Versão, features | Baixo |
| `POST /api/analytics` | Aceita corpo JSON, loga evento | **Médio** — sem auth; excluído do rate limit global |
| `POST /api/payments/webhook` | Webhook MP; assinatura condicional a `MERCADOPAGO_WEBHOOK_SECRET` | **Crítico** se secret ausente em produção (caminho legível no código) |
| `GET /api/production-status` | `isProductionMode`, flags de mock/real | **Médio** — revela postura de ambiente |
| `GET /api/debug/token` | Em `NODE_ENV === 'production'` → **404** sem corpo | Baixo em produção; **Alto** se `NODE_ENV` não for `production` |
| `GET /robots.txt` | Robots | Baixo |
| `POST /api/auth/register`, `POST /api/auth/login`, rotas de recuperação de senha, `POST /auth/login` | Autenticação / cadastro | Médio (abuso de cadastro, força bruta parcialmente limitada) |

### 3.2 Protegidas por JWT (`authenticateToken` em `server-fly.js`)

Incluem, entre outras: `GET/PUT /api/user/profile`, `POST /api/games/shoot`, `POST /api/withdraw/request`, `GET /api/withdraw/history`, `POST /api/payments/pix/criar`, `GET /api/payments/pix/usuario`, `PUT /api/auth/change-password`, `POST /api/admin/bootstrap`, `GET /api/fila/entrar`, `GET /usuario/perfil`.

### 3.3 Administrativas (`/api/admin/*`)

Todas as rotas do router em `routes/adminApiFly.js` passam por `router.use(authAdminToken)` — header **`x-admin-token`** igual a `ADMIN_TOKEN` (mín. 16 caracteres no servidor).

### 3.4 Healthchecks (operador / Fly)

- **`/health`**: além de “ok”, executa ping leve ao Supabase quando possível; **não** é mínimo do ponto de vista de vazamento de negócio.  
- **`/ready`**: apenas flag de bootstrap (`isAppReady`) — mais adequado como sinal barato de prontidão.

---

## 4. Auth e autorização

- **Player:** `authenticateToken` usa `jwt.verify` com `process.env.JWT_SECRET`; `userId` no token é a fonte de verdade para chute e perfil — **não** há `userId` confiável vindo do body no shoot.  
- **Admin API:** segregação por **segredo compartilhado** (`x-admin-token`), não por JWT de admin — correto para painel separado, com risco clássico de **vazamento do token** (fora do escopo de mitigação aqui).  
- **`/api/admin/bootstrap`:** JWT de **qualquer** usuário + condição “zero admins” — janela única de elevação; após existir admin, retorna 403. Risco residual: **token válido capturado no instante zero** do deploy (operacional).  
- **Webhook:** se `MERCADOPAGO_WEBHOOK_SECRET` **não** estiver definido, o código segue fluxo **permissivo** (validação não bloqueante conforme ramo) — em **produção com secret configurado**, assinatura inválida é rejeitada (evidência no handler).  
- **Bypass:** não foi identificado atalho no código que desligue `authenticateToken` no shoot; rotas públicas são **intencionalmente** abertas — o risco é **excesso de dados** nelas, não ausência de middleware no chute.

---

## 5. Idempotência e replay

### 5.1 `POST /api/games/shoot`

- Header **`x-idempotency-key`**: se presente e já registrada com TTL **120 s** (`IDEMPOTENCY_TTL_MS`), retorna **409** antes de alterar saldo.  
- Armazenamento: **`Map` em memória** por processo; limpeza periódica.  
- Registro da chave: **somente após** sucesso completo (após insert em `chutes` bem-sucedido). **Janela:** falha do processo **após** persistência e **antes** de `idempotencyProcessed.set` permite novo POST com a **mesma** chave ser tratado como novo (duplicidade teórica).  
- **Multi-instância:** mapas não são compartilhados — mesma chave pode ser aceita em outra máquina.

### 5.2 Cliente oficial (`gameService.js`)

- Gera `idempotencyKey` **no início** de cada `processShot` com `Date.now()` e `Math.random()`. **Duas chamadas** à função (duplo clique, dois gestos) ⇒ **duas chaves** ⇒ **dois chutes** — comportamento esperado do contrato atual; **não** equivale a idempotência de “mesmo gesto” no sentido estrito.  
- **Retry com mesma config Axios** (ex.: fallback CORS copiando `error.config`) **preserva** a chave — nesse caminho a proteção do backend aplica.

### 5.3 PIX

- Criação MP: `X-Idempotency-Key` gerada no servidor por requisição autenticada — mitiga duplicidade de cobrança no MP para **replays da mesma intenção** no provedor.  
- Crédito: `creditarPixAprovadoUnicoMpPaymentId` + RPC / fallback com transição `pending` e *optimistic lock* de saldo — **`already_processed`** quando já `approved`.

### 5.4 Admin

- Operações mutantes (`POST` reativar usuário, `POST configuracoes`, `POST backup`, etc.) **não** possuem idempotency key visível no router — replays administrativos dependem de efeitos idempotentes naturais (ex.: upsert) ou aceitam duplicação lógica conforme implementação de cada handler (análise fina handler-a-handler ficaria fora do teto deste relatório; risco genérico: **médio** para “clique duplo” em ações POST).

---

## 6. Concorrência e memória

| Elemento | Onde | Risco |
|----------|------|-------|
| `lotesAtivos` | `Map` global em `server-fly.js` | **Alto** em multi-instância ou restart — lote “ativo” não é fonte única global; jogadores em instâncias diferentes não compartilham o mesmo lote em RAM |
| `contadorChutesGlobal`, `ultimoGolDeOuro` | Memória + persistência via `metricas_globais` | **Médio** — `saveGlobalCounter()` em falha só loga erro; memória pode **adiantar** relação ao disco até próximo save ou restart |
| `idempotencyProcessed` | `Map` + TTL | **Médio** — perdido no restart; não coordena entre réplicas |
| `reconciling` | flag para reconcile PIX | **Baixo** — evita overlap de job no mesmo processo |
| Lock otimista `usuarios.saldo` | `eq('saldo', user.saldo)` no shoot | **Positivo** — reduz *lost update* entre requests concorrentes do mesmo usuário |

---

## 7. Logs e observabilidade

- **Middleware de monitoramento** (dentro de `startServer`): intercepta `res.send` e faz `console.log` com **método, URL, status, tempo** para **todas** as respostas — volume e sensibilidade operacional (**médio**); útil para auditoria, custoso em tráfego alto.  
- **Login:** logs com email em falhas (`/auth/login` e `/api/auth/login`) — **médio** (PII em log; enumeração mitigada na resposta JSON genérica “Credenciais inválidas” nos trechos lidos).  
- **PIX / webhook:** logs com IDs e valores — necessários para suporte; risco de **vazamento por acesso a logs** (operacional).  
- **`/api/analytics`:** `logger.info('[client_analytics_event]', JSON.stringify(body))` — qualquer campo enviado pelo cliente pode entrar em log (**médio/alto** se o player enviar PII).  
- **Debug PIX:** com `?debug=1` ou `body.debug === true` em erro MP, resposta 500 pode incluir **`detalhe: mpDetail`** — **alto** se usável por token JWT roubado (endpoint autenticado, mas vazamento de detalhe do provedor).

---

## 8. Rotas de diagnóstico e debug

- **`/health`:** expõe **contador global** e **último Gol de Ouro** — diagnóstico **além** do necessário para load balancer.  
- **`/ready`:** mínimo — adequado.  
- **`/api/monitoring/*`:** diagnóstico **rico** (memória, PID, contadores) **público**.  
- **`/api/production-status`:** informação de modo de produção.  
- **`/api/debug/token`:** desligado em `production`; em outros ambientes retorna payload de debug **incluindo trecho de token e headers** — risco **alto** fora de produção.  
- **`GET /api/fila/entrar`:** resposta com posição/tempo **aleatórios** (`crypto.randomInt`) — não reflete fila real; pode **confundir** monitoramento ou integrações legadas (**baixo** antifraude, **médio** consistência semântica).

---

## 9. Riscos de abuso

- **Enumeração de contas:** respostas de login lidas são genéricas; logs ainda distinguem “usuário não encontrado” vs “senha inválida” — risco em **superfície de logs**, não na API HTTP.  
- **Flood:** rate limit global **100 / 15 min / IP** com exclusões para `/health`, `/meta`, `/auth/*`, `/api/auth/*`, **`/api/analytics`**. **Analytics e health** podem ser bombardeados sem contar o limiter principal — **médio** (DoS leve / custo de log).  
- **Scraping de contador:** `GET /health` permite sincronizar tentativas com **Gol de Ouro** (regra `contadorChutesGlobal % 1000 === 0` no shoot) — **alto** para integridade de “surpresa” do prêmio global.  
- **Automação de chute:** API REST stateless; sem CAPTCHA no chute; limite por IP (não por usuário) — **médio/alto** dependendo de modelo de negócio.  
- **Respostas detalhadas:** erro PIX com `debug` — vetor de vazamento de resposta MP.  
- **CORS:** origens sem `Origin` aceitas (`callback(null, true)`), o que **não** elimina uso direto via curl/token — esperado para APIs, mas relevante para modelo de ameaça “browser vs script”.

---

## 10. Classificação de criticidade

*(Itens com evidência no código; “crítico” reservado a impacto direto em dinheiro ou confiança sistêmica imediata.)*

| ID | Tema | Criticidade |
|----|------|-------------|
| G-01 | `GET /health` expõe `contadorChutes` e `ultimoGolDeOuro` sem auth | **Crítico** (antifraude / jogo justo percebido) |
| G-02 | `GET /api/monitoring/metrics` e `/api/monitoring/health` públicos com dados de processo | **Alto** |
| G-03 | Webhook MP sem secret configurado = caminho permissivo (configuração) | **Crítico** se ocorrer em prod |
| G-04 | Lotes e idempotência só em RAM; multi-instância / restart | **Alto** |
| G-05 | Idempotência do shoot registrada só no final; Map não compartilhado | **Médio** |
| G-06 | `gameService` gera chave nova por chamada — duplo disparo não deduplica | **Médio** |
| G-07 | `saveGlobalCounter` falha silenciosamente (só log) | **Médio** |
| G-08 | `POST /api/analytics` sem rate limit global + log de corpo arbitrário | **Médio** |
| G-09 | PIX `debug` vaza `mpDetail` ao cliente autenticado | **Alto** |
| G-10 | `GET /api/production-status` público | **Médio** |
| G-11 | Lock otimista de saldo no shoot + validação V1 de amount/direction | **Baixo** (mitigação presente) |
| G-12 | Crédito PIX único por `payment_id` / RPC | **Baixo** (mitigação presente, depende de RPC/deploy) |
| G-13 | `/api/debug/token` em ambiente não-production | **Alto** |

---

## 11. Diagnóstico final

O backend **não está “desprotegido”** no núcleo do chute em termos de **autenticação JWT** e **concorrência de saldo**, e o fluxo PIX possui **trilha explícita de idempotência** no provedor e **unicidade de crédito** no banco quando o RPC/claim funciona. Os maiores gaps do **BLOCO G** observáveis **sem runtime** são **exposição pública de estado de jogo e de monitoramento**, **estado de lote/contador dependente de processo único**, e **contratos de idempotência** que **não cobrem** todos os cenários de duplo envio ou de **réplicas múltiplas**. A documentação interna mais antiga que afirmava que o cliente **não** enviava `X-Idempotency-Key` está **desatualizada** em relação ao `gameService.js` atual — permanece válida a ressalva de **chave nova por chamada** e de **Map em memória**.

---

## 12. Próxima etapa recomendada

1. **Validação em runtime** (staging): shoot concorrente, restart durante lote, webhook com assinatura inválida/válida, dois processos ou simulação de multi-instância se aplicável ao deploy.  
2. **Revisão de produto/ops** sobre o que cada endpoint público **precisa** retornar (especialmente **`/health`** vs **`/ready`** e **`/api/monitoring/*`**).  
3. **Trilha de auditoria**: correlacionar `userId`, `lote_id`, `contador_global` e id de pagamento em logs estruturados **sem** PII desnecessária em `analytics`.  
4. **Política explícita** para `NODE_ENV`, `MERCADOPAGO_WEBHOOK_SECRET` e uso do flag `debug` em PIX em ambientes expostos.

---

## CLASSIFICAÇÃO FINAL OBRIGATÓRIA

**BLOCO G COM RISCOS MODERADOS**

*Justificativa (uma linha):* mitigações relevantes existem no chute e no PIX, mas **superfícies públicas** (`/health`, monitoring) e **estado em memória** mantêm risco operacional e antifraude **material**, sem caracterizar colapso total dos controles nem estado “fechado” apenas com hardening documental.

---

## Referências de código (arquivo:linhas aproximadas)

- Rate limit e exclusões: `server-fly.js` ~257–308  
- CORS e `X-Idempotency-Key`: `server-fly.js` ~234–252  
- `lotesAtivos`, contador, idempotência shoot: `server-fly.js` ~376–389, 1138–1385  
- `saveGlobalCounter`: `server-fly.js` ~2105–2124  
- `GET /health`, `/ready`, `/api/metrics`: `server-fly.js` ~2273–2362  
- Monitoring público: `server-fly.js` ~2445–2505  
- Webhook + crédito PIX: `server-fly.js` ~1911–2030, 2037–2098  
- Debug PIX: `server-fly.js` ~1789–1796  
- `/api/debug/token`: `server-fly.js` ~2794–2843  
- Admin `authAdminToken` em todas as rotas: `routes/adminApiFly.js` ~31–47, 139–142  
- Analytics: `routes/analyticsIngest.js` ~19–35  
- Chave idempotência no cliente: `goldeouro-player/src/services/gameService.js` ~89–105  

---

*Fim do relatório.*
