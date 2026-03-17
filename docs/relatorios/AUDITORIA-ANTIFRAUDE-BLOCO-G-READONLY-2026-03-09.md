# AUDITORIA ANTIFRAUDE — BLOCO G

**Projeto:** Gol de Ouro  
**Bloco:** G — Antifraude e Exploits do Jogo  
**Data:** 2026-03-09  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração de código, banco ou deploy.  
**Escopo:** Backend (server-fly.js), frontend (GameShoot.jsx, GameFinal.jsx, gameService.js), middlewares, relatórios do Bloco E e financeiros.

---

## 1. Resumo executivo

A auditoria antifraude do Gol de Ouro identificou **superfície de ataque clara**: a API de chute é simples de automatizar, o contador global do Gol de Ouro é exposto em **GET /health** sem autenticação, não há rate limit por usuário nem cooldown entre chutes, e o cliente oficial **não envia** X-Idempotency-Key no shoot (retry/replay parcialmente mitigado só se o cliente enviar a chave). A regra previsível (10º chute = gol) é característica do produto; o risco operacional está na **exploração do Gol de Ouro** (contador exposto + possível farming com múltiplas contas) e na **automação com bot** (API stateless, sem CAPTCHA, sem limitação por usuário).

**Diagnóstico:** **ANTIFRAUDE V1 COM RISCOS MODERADOS**. O maior risco imediato é **exposição do contador global em /health** permitindo a um atacante saber exatamente quando o próximo Gol de Ouro ocorrerá e tentar capturá-lo com uma ou várias contas. Em segundo plano: automação de chutes, retry sem idempotency no cliente, e multi-conta sem defesas no backend.

---

## 2. Superfície de ataque

### 2.1 Endpoints mapeados (server-fly.js)

| Método | Rota | Auth | Crítico para fraude? | Observação |
|--------|------|------|----------------------|------------|
| POST | /api/games/shoot | Sim | **Sim** | Único ponto que debita saldo e define resultado (goal/miss) e Gol de Ouro. |
| GET | /api/user/profile | Sim | Sim | Expõe saldo, total_apostas, total_ganhos. |
| GET | /api/metrics | Não | Sim | Código atual retorna totalChutes/ultimoGolDeOuro zerados; não expõe contador real. |
| **GET** | **/health** | **Não** | **Sim** | **Retorna contadorChutes e ultimoGolDeOuro reais.** Superfície principal para farming do Gol de Ouro. |
| POST | /api/auth/login | Não* | Sim | Rate limit 5/15min por IP; sem CAPTCHA. |
| POST | /api/auth/register | Não* | Sim | Permite criar contas; sem verificação forte. |
| POST | /api/withdraw/request | Sim | Sim | Saque PIX; validado por PixValidator. |
| GET | /api/withdraw/history | Sim | Sim | Histórico de saques. |
| POST | /api/payments/pix/criar | Sim | Sim | Cria PIX; idempotency no backend. |
| GET | /api/payments/pix/usuario | Sim | Sim | Lista pagamentos do usuário. |
| POST | /api/payments/webhook | Não | Sim | Chamado pelo Mercado Pago; validação de assinatura se MERCADOPAGO_WEBHOOK_SECRET. |
| GET | /api/monitoring/metrics | Não | Sim | Expõe métricas de processo (requests, memory, etc.). |
| GET | /api/monitoring/health | Não | Sim | Status e uptime. |
| GET | /api/debug/token | Não | **Sim** | **Expõe decoded JWT e trecho do token.** Deve ser desativado em produção. |
| POST | /api/admin/bootstrap | Sim | Sim | Primeiro admin; apenas se count admin = 0. |

\* Rate limit aplicado; /health, /meta, /auth/ são excluídos do rate limit global.

### 2.2 Endpoints mais abusáveis

1. **POST /api/games/shoot** — Toda a lógica de jogo e débito passa por aqui. Parâmetros aceitos: `direction` (TL, TR, C, BL, BR), `amount` (apenas 1 na V1). userId vem do JWT; não é enviado no body. **Manipuláveis pelo cliente:** direction, amount. **Validados no backend:** direction em whitelist, amount === 1.
2. **GET /health** — Sem autenticação. Resposta inclui `contadorChutes` e `ultimoGolDeOuro`. Permite inferir o contador global e portanto "chutes até o próximo Gol de Ouro" (1000 - contadorChutes % 1000).
3. **POST /api/auth/login** e **/api/auth/register** — Permitem obter tokens para múltiplas contas; rate limit por IP (5 tentativas de login / 15 min), não por email/usuário.

### 2.3 Resposta do shoot e exposição

A resposta 200 de **POST /api/games/shoot** inclui (entre outros): `contadorGlobal`, `loteProgress` (current, total, remaining), `result`, `premio`, `premioGolDeOuro`, `isGolDeOuro`, `novoSaldo`, `loteId`. Ou seja, após cada chute o jogador **já sabe** o contador global e quantos chutes faltam para o próximo múltiplo de 1000. Isso é usado pelo front para exibir "Chutes até próximo Gol de Ouro". Não é vazamento adicional em relação a /health; é consistente com a regra do produto, mas **reforça** que a informação necessária para tentar "capturar" o Gol de Ouro está disponível.

---

## 3. Manipulação de entradas

### 3.1 POST /api/games/shoot

- **direction:** Obrigatório; normalizado para string trim + uppercase; deve estar em `['TL', 'TR', 'C', 'BL', 'BR']`. Qualquer outro valor → 400 "Direção inválida".
- **amount:** Obrigatório; convertido com `Number(amount)`; **deve ser exatamente 1**. Qualquer outro valor → 400 com mensagem V1.
- **userId:** Não vem do body; vem de `req.user.userId` (JWT). O cliente **não pode** alterar o usuário do chute.
- **loteId / ids de lote:** Não aceitos no body; o lote é obtido ou criado por `getOrCreateLoteByValue(betAmount)` em memória. Não há parâmetro para escolher ou forçar um lote.
- **Saldo:** Lido no backend (SELECT saldo FROM usuarios WHERE id = userId). O cliente não envia saldo; não há como "injetar" saldo pelo body.

**Conclusão:** Não há caminho para o cliente alterar regra do jogo (10º = goal), valor do prêmio (R$ 5 / R$ 100), resultado (goal/miss) ou saldo. O resultado é determinado pelo índice do chute no lote (`shotIndex === lote.winnerIndex`) e pelo contador global (Gol de Ouro). **Tampering de amount/direction** é limitado: amount fixo em 1; direction só escolhe zona (não altera resultado na V1). **Risco de manipulação de entradas para fraude econômica: BAIXO.**

### 3.2 Outros endpoints

- **Saque:** PixValidator valida valor, chave PIX e tipo; saldo verificado no backend.
- **Depósito PIX:** Valor e dados do payer validados; idempotency no Mercado Pago.
- **Perfil:** Atualização de nome/email; sem campos que alterem saldo ou tipo de usuário de forma direta por manipulação de body.

---

## 4. Bots e automação

### 4.1 Controles existentes

- **Rate limit global:** 100 requests / 15 min **por IP** (express-rate-limit). Rotas excluídas: /health, /meta, /auth/, /api/auth/.
- **Rate limit de autenticação:** 5 tentativas / 15 min **por IP** para /api/auth/ e /auth/, apenas para tentativas **mal-sucedidas** (skipSuccessfulRequests: true).
- **Autenticação:** POST /api/games/shoot exige JWT (Bearer). Sem token → 401.

### 4.2 O que não existe

- **Rate limit por usuário:** Não há limite de requests por userId (ex.: máximo X chutes por minuto por conta). Um único usuário pode consumir até o limite de IP (100/15 min) em chutes.
- **Cooldown entre chutes:** Nenhum delay obrigatório entre dois POST /api/games/shoot do mesmo usuário.
- **CAPTCHA:** Nenhum em login, registro ou chute.
- **Detecção de comportamento robótico:** Nenhuma análise de padrão de requests (timing, User-Agent, etc.).

### 4.3 Facilidade de automação

- A API é **stateless** e **REST**: POST com body `{ "direction": "C", "amount": 1 }` e header `Authorization: Bearer <token>`. Fácil de reproduzir com curl, script (Node, Python, etc.) ou ferramentas de carga.
- O frontend (GameShoot.jsx) usa gameService.processShot(dir, betAmount); gameService chama apiClient.post('/api/games/shoot', { direction, amount: 1 }). Um bot pode replicar essa chamada sem passar pela UI.
- **Classificação:**  
  - **Bot simples (uma conta):** **Fácil** — obter token (login), loop de POST shoot com direções variadas. Limitado pelo rate limit por IP (100/15 min) e por saldo.  
  - **Bot com múltiplas contas:** **Fácil** — vários tokens, rotação de IP ou contas por IP; cada conta pode fazer até 100 requests/15 min por IP compartilhado.  
  - **Spam de requests:** Limitado por 100/15 min por IP; sem limite por usuário.  
  - **Automação do chute:** **Alto** — a API foi desenhada para ser chamada por cliente; não há barreira técnica adicional.

---

## 5. Retry, replay e idempotência

### 5.1 Mecanismo atual (server-fly.js)

- **Header opcional:** `X-Idempotency-Key`. Se presente e a chave já tiver sido processada nos últimos **120 segundos** (IDEMPOTENCY_TTL_MS), o backend retorna **409** e não processa o chute novamente.
- **Armazenamento:** Map em memória (`idempotencyProcessed`); limpeza a cada 60 s para chaves com mais de 120 s.
- **Gravação da chave:** Após sucesso (resposta 200), a chave é armazenada com timestamp.

### 5.2 Uso no cliente oficial

- **gameService.js** e **apiClient.js** **não enviam** X-Idempotency-Key nas chamadas a POST /api/games/shoot. A proteção existe no servidor mas **não é acionada** pelo app oficial.
- Consequência: em caso de timeout ou retry do cliente, o mesmo chute pode ser reenviado **sem** idempotency key e ser processado duas vezes (dois débitos, dois registros em chutes, ou lost update de saldo conforme concorrência). A proteção atual **depende do cliente ser honesto** (ou de um cliente custom que envie a chave).

### 5.3 Exploração por atacante

- **Múltiplas idempotency keys:** Um atacante pode enviar N requests "idênticos" (mesmo direction/amount) com N chaves diferentes; cada um é tratado como request distinto. A idempotência **só evita** reenvio do **mesmo** request (mesma chave). Não há limite por usuário além de saldo e rate limit por IP.
- **Replay em múltiplas instâncias:** O Map de idempotência é por processo. Com mais de uma instância, a mesma chave poderia ser usada em instâncias diferentes e processada mais de uma vez (risco futuro se houver escala horizontal).
- **Conclusão:** A proteção é **suficiente para V1** apenas quando o cliente envia X-Idempotency-Key. Hoje o cliente não envia; portanto **um atacante que não envie a chave** não "burlará" a idempotência — ele simplesmente não a usa. O risco é **retry legítimo ou malicioso sem chave** gerar chute duplicado e saldo incorreto (já coberto na auditoria de concorrência). **Risco: MODERADO** (proteção existe mas não é usada pelo cliente; replay com chaves distintas não é "burlar", é fazer vários chutes distintos).

---

## 6. Exploração do lote

### 6.1 Regra V1

- Lote de **10 chutes** para valor 1; **10º chute = goal** (winnerIndex = config.size - 1).
- **Mesmo jogador pode repetir** no mesmo lote (validado em LoteIntegrityValidator).
- Não há "sorteio" do gol; a posição do gol é fixa.

### 6.2 Vetores teóricos

- **Ocupar rapidamente vários chutes do mesmo lote:** Um jogador (ou bot) pode tentar enviar vários chutes em sequência para o mesmo lote. Em uma instância, a ordem é serializada nos awaits; ele pode ocupar várias posições (1ª a 9ª) e "deixar" a 10ª para outra conta ou para si. Isso é **regra do produto** (mesmo jogador pode repetir).
- **Capturar o 10º chute:** Quem enviar o 10º request para o lote ativo ganha o goal. Quem controla o timing (humano ou bot) pode tentar ser o 10º. **Previsibilidade** da regra facilita tentativa de "sniping".
- **Múltiplas contas para dominar um lote:** N contas podem coordenar (fora do sistema) para encher um lote e atribuir o 10º a uma conta escolhida. Não há defesa no backend contra coordenação.
- **Prever fechamento do lote:** O fechamento é quando `lote.chutes.length >= config.size`. Não há API que retorne "quantos chutes tem o lote atual"; o cliente só sabe pelo campo `loteProgress` na **resposta** do próprio chute. Quem fizer muitos chutes seguidamente pode inferir o progresso.

### 6.3 Avaliação

- O fato de o **10º chute ser sempre gol** é **regra do produto**, não falha. Cria **previsibilidade** que pode ser explorada estrategicamente (tentar ser o 10º, ou encher o lote com várias contas).
- **Aceitável como regra do produto:** Sim, desde que documentado. **Risco operacional:** Moderado — "sniping" do 10º ou domínio de lote por multi-conta são possíveis sem detecção no backend. Para V1, com volume controlado e instância única, pode ser aceito como limite conhecido.

---

## 7. Gol de Ouro

### 7.1 Lógica

- `contadorChutesGlobal` é incrementado a cada chute aceito.
- `isGolDeOuro = (contadorChutesGlobal % 1000 === 0)`.
- Quando é Gol de Ouro, o vencedor do goal recebe R$ 5 + R$ 100.

### 7.2 Exposição do contador

- **GET /health** (sem auth): retorna `contadorChutes: contadorChutesGlobal` e `ultimoGolDeOuro`. **Qualquer pessoa** pode chamar GET /health e saber o valor exato do contador.
- **Resposta de POST /api/games/shoot:** inclui `contadorGlobal`. Após cada chute o jogador sabe o contador atual e pode calcular "chutes até próximo Gol de Ouro" = 1000 - (contadorGlobal % 1000).

### 7.3 Riscos

- **Inferência do contador global:** Trivial via GET /health (polling).
- **Timing para capturar o múltiplo de 1000:** Um atacante pode: (1) pollar /health até ver contador próximo de 999 (ou 1999, etc.); (2) fazer login com uma ou várias contas; (3) disparar chutes até ser o autor do chute que faz contadorChutesGlobal % 1000 === 0. Se esse chute for goal (10º do lote), leva R$ 105.
- **Farm com múltiplas contas:** Várias contas podem ser usadas para "queimar" chutes até deixar o contador a 1 ou 2 do próximo 1000, e então uma conta escolhida tenta garantir o 10º chute do lote que cairá no múltiplo de 1000. Coordenação externa; o backend não detecta.
- **Vazamento de informação:** O contador em /health é o **principal vazamento** que permite esse tipo de exploração. Sem ele, o atacante só teria a informação após cada chute próprio (contadorGlobal na resposta).

**Conclusão:** **Risco de farming/captura do Gol de Ouro: ALTO** na presença de /health expondo o contador. A regra em si (a cada 1000 chutes) é legítima; o problema é a **exposição pública** do contador, que permite planejamento preciso de ataque.

---

## 8. Múltiplas contas e colusão

### 8.1 Defesas atuais

- **Nenhuma** verificação de múltiplas contas (mesmo CPF, mesmo dispositivo, mesmo IP em excesso).
- **Nenhuma** agregação de chaves PIX para detectar saques para a mesma chave a partir de várias contas.
- **Nenhum** limite de contas por IP ou por dispositivo no registro/login.
- Rate limit de login é **por IP** (5 tentativas falhas/15 min), não por conta.

### 8.2 Riscos

- **Multi-account:** Criar várias contas (emails diferentes), depositar ou usar saldo inicial (se houver), jogar em paralelo ou em sequência para dominar lotes ou tentar Gol de Ouro.
- **Colusão:** Várias contas "queimam" chutes para aproximar o contador de 1000; uma conta tenta ficar com o 10º chute do lote que cair no 1000.
- **Saque para mesma chave PIX:** Nada impede que várias contas sacem para a mesma chave PIX; é questão de política de negócio/regulamentação, não implementada no backend.
- **Padrão repetitivo:** Não há análise de padrão (ex.: mesmos horários, mesma sequência de direções) para flag de bot ou colusão.

**Conclusão:** O risco de múltiplas contas e colusão está **parcialmente no backend** (falta de limites e detecção) e **parcialmente no negócio** (políticas de KYC, uma chave PIX por pessoa, etc.). Para V1, não há defesa técnica específica; **risco: MODERADO** (depende de abuso real e de política de produto).

---

## 9. Exposição de dados

### 9.1 Dados sensíveis expostos

| Fonte | Dado | Quem acessa | Risco |
|-------|------|-------------|--------|
| GET /health | contadorChutes, ultimoGolDeOuro | Qualquer um (sem auth) | **ALTO** — permite planejar Gol de Ouro. |
| POST /api/games/shoot response | contadorGlobal, loteProgress, loteId, result, premio, premioGolDeOuro, isGolDeOuro, novoSaldo | Jogador autenticado | Moderado — necessário para UX; reforça conhecimento do contador. |
| GET /api/user/profile | saldo, total_apostas, total_ganhos | Jogador autenticado | Baixo. |
| GET /api/debug/token | decoded JWT, trecho do token | Qualquer um (sem auth) | **ALTO** — não deveria estar em produção. |
| GET /api/metrics | totalChutes, ultimoGolDeOuro (código atual retorna 0) | Qualquer um | Baixo no código atual (zerado). |
| GET /api/monitoring/* | Métricas de processo, saúde | Qualquer um | Moderado — informação de infra. |

### 9.2 Frontend

- GameShoot.jsx exibe "Chutes até próximo Gol de Ouro" (shotsUntilGoldenGoal) derivado de gameInfo.goldenGoal.shotsUntilNext, que vem de getShotsUntilGoldenGoal() no gameService (baseado em contadorGlobal da resposta do shoot e em loadGlobalMetrics via /api/metrics). Não expõe mais do que a API já fornece.
- GameFinal.jsx (versão com backend simulado) não usa a API real de shoot; não adiciona vetores adicionais na versão real integrada ao gameService.
- Mensagens de erro no backend são genéricas ("Saldo insuficiente", "Direção inválida", etc.); não há stack trace ou detalhes internos nas respostas JSON ao cliente.

### 9.3 Recomendações (documentais, sem alterar código)

- Remover ou restringir **contadorChutes** e **ultimoGolDeOuro** de GET /health em produção, ou colocar /health atrás de auth ou de rede interna.
- Desativar ou proteger **GET /api/debug/token** em produção.

---

## 10. Top exploits

| # | Nome | Como funcionaria | Impacto | Evidência técnica | Classificação | Risco |
|---|------|------------------|---------|-------------------|---------------|--------|
| 1 | **Farming do Gol de Ouro via /health** | Pollar GET /health (sem auth), quando contador estiver próximo de 999/1999/… fazer chutes com uma ou mais contas para ser o autor do chute 1000 e, se for o 10º do lote, ganhar R$ 105. | Econômico: captura indevida do bônus R$ 100. | server-fly.js: GET /health retorna contadorChutes e ultimoGolDeOuro. | **ALTO** | Atual |
| 2 | **Bot de chutes** | Script que obtém token (login), envia POST /api/games/shoot em loop com direções variadas. Sem CAPTCHA e sem cooldown por usuário. | Aumento de volume automatizado; possível uso com múltiplas contas. | Rate limit só por IP (100/15 min); nenhum limite por userId. | **ALTO** | Atual |
| 3 | **Multi-conta para dominar lote** | Várias contas fazem chutes no mesmo lote; uma conta é posicionada para ser a 10ª e ganhar R$ 5 (ou R$ 105 se coincidir com Gol de Ouro). | Vantagem econômica por coordenação. | Mesmo jogador pode repetir; sem detecção de multi-conta. | **MODERADO** | Atual |
| 4 | **Retry sem idempotency** | Cliente (ou script) reenvia o mesmo chute após timeout sem X-Idempotency-Key. Backend processa duas vezes. | Chute duplicado; saldo incorreto (lost update ou duplo débito). | gameService não envia X-Idempotency-Key; backend aceita e processa. | **MODERADO** | Atual |
| 5 | **Sniping do 10º chute** | Bot ou usuário rápido monitora respostas (loteProgress) e tenta ser sempre o 10º de um lote para garantir goal. | Ganho sistemático de R$ 5 por lote "sniped". | Regra previsível (10º = goal); sem randomização. | **MODERADO** | Atual |
| 6 | **Uso de /api/debug/token** | Chamar GET /api/debug/token com token de outrem (ex.: vazado) para obter payload decodificado (userId, email, etc.). | Vazamento de identidade e possível impersonation se o token for reutilizado. | server-fly.js: endpoint sem auth retorna decoded e trecho do token. | **ALTO** (se em produção) | Atual |
| 7 | **Criação em massa de contas** | Script de registro (POST /api/auth/register) com emails diversos. Rate limit só por IP (5 falhas de login/15 min); registro não tem o mesmo limite rígido. | Base para multi-conta e farming. | Register não tem limite de contas por IP. | **MODERADO** | Atual |
| 8 | **Polling /health para timing** | Ferramenta que só chama GET /health a cada segundo para saber o contador exato e disparar chutes no momento "certo". | Precisão máxima para captura do Gol de Ouro. | /health sem auth e sem rate limit (excluído do limiter). | **ALTO** | Atual |
| 9 | **Replay com idempotency keys distintas** | Enviar o mesmo "tipo" de chute (mesma direção, amount 1) várias vezes com X-Idempotency-Key diferente a cada request. Cada um é considerado novo. | Múltiplos chutes legítimos do ponto de vista do servidor; consumo de saldo e possível abuso de volume. | Backend não limita por usuário; idempotency evita só mesma chave. | **BAIXO a MODERADO** | Atual |
| 10 | **Escala horizontal sem store compartilhado** | Com múltiplas instâncias, idempotency em memória e contador/lotes em memória divergem. Replay da mesma chave em outra instância pode ser processado; contador e Gol de Ouro inconsistentes. | Duplicação de chutes, contador errado, múltiplos Gol de Ouro. | idempotencyProcessed e lotesAtivos são por processo. | **CRÍTICO** (se >1 instância) | Futuro |

---

## 11. Diagnóstico final

### 11.1 Classificação por categoria

| Categoria | Classificação | Justificativa |
|----------|----------------|---------------|
| Manipulação da API | **BAIXO** | amount/direction validados; userId e saldo do servidor; resultado não manipulável pelo cliente. |
| Bots/automação | **ALTO** | API fácil de automatizar; sem CAPTCHA; sem cooldown por usuário; rate limit só por IP. |
| Retry/replay | **MODERADO** | Idempotência existe mas cliente não envia chave; retry pode duplicar chute. |
| Exploração do lote | **MODERADO** | Regra previsível (10º = goal); possível sniping e multi-conta; aceitável como produto com limite conhecido. |
| Exploração do Gol de Ouro | **ALTO** | Contador exposto em GET /health; permite planejamento e farming. |
| Múltiplas contas | **MODERADO** | Sem detecção ou limite no backend; política de negócio pode mitigar. |
| Exposição de dados | **ALTO** | /health com contador; /api/debug/token com JWT. |
| Previsibilidade explorável | **MODERADO** | Previsibilidade é regra do produto; sniping e coordenação são possíveis. |

### 11.2 Classificação geral

**ANTIFRAUDE V1 COM RISCOS MODERADOS**

- **Aceitável para V1:** Validação de entradas, regra do lote e economia consistentes; optimistic locking de saldo; idempotency disponível no shoot (se o cliente usar).
- **Riscos que exigem blindagem futura:** Exposição do contador em /health; endpoint /api/debug/token em produção; ausência de rate limit por usuário e de cooldown entre chutes; ausência de detecção de multi-conta e de CAPTCHA em ações sensíveis.

---

## 12. Conclusão objetiva

- **Maior risco antifraude hoje:** **Exposição do contador global em GET /health** (sem autenticação), permitindo que um atacante saiba exatamente quando o próximo Gol de Ouro ocorrerá e tente capturá-lo com uma ou várias contas (farming do bônus de R$ 100).
- **Outros riscos relevantes:** (1) Automação de chutes (bot simples ou com múltiplas contas) sem CAPTCHA e sem limite por usuário; (2) GET /api/debug/token expondo JWT em produção; (3) retry sem idempotency no cliente oficial, com possível chute duplicado e saldo incorreto.
- **O que é aceitável na V1:** Regra previsível do lote (10º = goal); mesmo jogador pode repetir; economia e validação de entradas; operação em instância única com limites documentados.
- **O que exigirá blindagem futura:** Remover ou restringir contador em /health; desativar ou proteger /api/debug/token; considerar rate limit por usuário, cooldown entre chutes, CAPTCHA em login/registro ou chute; políticas e eventual detecção de multi-conta e mesma chave PIX.

**Caminho do relatório:** `docs/relatorios/AUDITORIA-ANTIFRAUDE-BLOCO-G-READONLY-2026-03-09.md`

---

*Auditoria conduzida em modo READ-ONLY. Nenhuma alteração de código, banco ou deploy foi realizada.*
