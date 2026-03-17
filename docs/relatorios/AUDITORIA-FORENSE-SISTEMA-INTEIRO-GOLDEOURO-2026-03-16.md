# AUDITORIA FORENSE DO SISTEMA INTEIRO — GOL DE OURO

**Projeto:** Gol de Ouro  
**Documento:** Radiografia final consolidada pós-auditorias  
**Data:** 2026-03-16  
**Modo:** READ-ONLY ABSOLUTO — investigação, cruzamento de evidências, validação de coerência e documentação. Nenhuma alteração de código, patch, refatoração, commit, merge, deploy ou banco.

---

## 1. Resumo executivo

O **Gol de Ouro** hoje é um sistema **operável em ambiente controlado (instância única)** com **arquitetura real clara** e **decisões oficiais da V1 refletidas no código**: rota `/game` → GameFinal, economia R$ 1 / lote 10 / 10º = goal / prêmio R$ 5 / Gol de Ouro R$ 100 a cada 1000 chutes, backend em `server-fly.js` (entrypoint `npm start` → `node server-fly.js`), player em `goldeouro-player/` (Vercel). A **documentação anterior está coerente com o código** nas regras de negócio, no fluxo do chute e na lista de rotas; as **inconsistências** são pontuais: (1) App.jsx importa **Game**, **GameShootFallback**, **GameShootTest**, **GameShootSimple** sem vinculá-los a nenhuma rota — dívida de confusão e possível manutenção errada. (2) **GET /health** e **GET /api/debug/token** continuam expostos conforme relatado; (3) **gameService** não envia X-Idempotency-Key, como já documentado. O que **está realmente ativo** é o fluxo Login → Dashboard → `/game` (GameFinal) → shoot via `gameService.processShot` → POST /api/games/shoot; depósito, saque e perfil seguem as rotas oficiais. O que é **legado ou sobra**: rota `/gameshoot` (GameShoot), componente Game, GameShootFallback, GameShootTest, GameShootSimple (imports sem rota), e qualquer uso de `batchConfigs` para valor diferente de 1 no backend (só valor 1 é aceito na API). **Pontos estruturalmente sólidos**: engine de lotes e economia matemática implementadas conforme Bloco E; optimistic locking de saldo; ordem UPDATE→INSERT e reversão em falha explícita; contador global carregado no startup. **Pontos estruturalmente frágeis**: ausência de transação atômica saldo+chutes; lotes não restaurados após restart; cliente sem idempotency; exposição de contador e debug/token; escala horizontal não suportada; observabilidade limitada. **Diagnóstico consolidado:** **V1 OPERÁVEL COM RESSALVAS ESTRUTURAIS** — o sistema pode operar hoje dentro dos limites documentados, com consciência total dos riscos e sem fingir que está pronto para crescimento ou operação sem controle.

---

## 2. Escopo forense analisado

| Categoria | Itens |
|-----------|--------|
| **Backend** | `server-fly.js` (entrypoint: package.json `"main": "server-fly.js"`, `"start": "node server-fly.js"`); rotas POST /api/games/shoot, GET /health, GET /api/debug/token, auth, user, payments, withdraw; lotesAtivos, contadorChutesGlobal, idempotencyProcessed, getOrCreateLoteByValue, saveGlobalCounter, startup (load metricas_globais); batchConfigs (1: size 10, winnerIndex 9). |
| **Frontend** | `goldeouro-player/src/App.jsx` (rotas e imports); `GameFinal.jsx`, `GameShoot.jsx`, `Dashboard.jsx`, `Pagamentos.jsx`, `Withdraw.jsx`, `Profile.jsx`, `Login.jsx`, `Register.jsx`; `gameService.js`, `apiClient.js`; `InternalPageLayout.jsx`, `ProtectedRoute.jsx`. |
| **Documentos** | `docs/ARQUITETURA-BLOCOS-GOLDEOURO.md`, `docs/ROADMAP-V1-GOLDEOURO.md`, `docs/RELATORIO-MESTRE-HANDOFF-GOLDEOURO-V1.md`, `docs/relatorios/ENCERRAMENTO-PREMIUM-BLOCO-E-GAMEPLAY-V1.md`, `docs/relatorios/AUDITORIA-COMPLETA-BLOCO-F-INTERFACE-2026-03-16.md`, `docs/relatorios/VALIDACAO-FINAL-PREVIEW-BLOCO-F-VERCEL-2026-03-16.md`, `docs/relatorios/AUDITORIA-ROTAS-PLAYER-GOLDEOURO-2026-03-16.md`, `docs/relatorios/AUDITORIA-ANTIFRAUDE-BLOCO-G-READONLY-2026-03-09.md`, `docs/relatorios/MAPA-COMPLETO-DE-RISCO-OPERACIONAL-GOLDEOURO-2026-03-16.md`, `docs/relatorios/AUDITORIA-BLOCO-H-ECONOMIA-E-RETENCAO-GOLDEOURO-2026-03-16.md`. |
| **Evidências cruzadas** | Comparação entre declarações dos relatórios (rotas oficiais, legado, economia, riscos) e implementação atual (App.jsx, server-fly.js, gameService.js); verificação de amount === 1, premio 5, premioGolDeOuro 100, winnerIndex = config.size - 1; presença/ausência de X-Idempotency-Key no cliente; conteúdo de GET /health e GET /api/debug/token. |

---

## 3. Premissas oficiais da V1

| Premissa | Definição |
|----------|-----------|
| Rota oficial do jogo | `/game` |
| Componente oficial do jogo | `GameFinal` |
| Legado | `/gameshoot` e componente `GameShoot` |
| Valor do chute | R$ 1 |
| Lote | 10 chutes |
| Posição do goal | 10º chute |
| Prêmio base | R$ 5 |
| Gol de Ouro | Ativo; R$ 100 quando o goal coincide com contador global múltiplo de 1000 |
| Mesma pessoa pode repetir no lote | Sim |
| Operação atual | Instância única |

---

## 4. O que está realmente ativo no sistema

| Área | O que está ativo | Evidência |
|------|-------------------|-----------|
| **Entrypoint backend** | `server-fly.js` | package.json `"main": "server-fly.js"`, `"start": "node server-fly.js"`; server.listen no final do arquivo. |
| **Fluxo do jogador** | Login (/) → Dashboard (/dashboard) → Jogar → /game (GameFinal) → chute → POST /api/games/shoot; Depositar → /pagamentos; Sacar → /withdraw; Perfil → /profile | Dashboard navega para /game; InternalPageLayout footer "JOGAR AGORA" navega para /game; nenhum link para /gameshoot. |
| **Tela do jogo** | GameFinal em /game | App.jsx Route path="/game" element={<ProtectedRoute><GameFinal /></ProtectedRoute>}. |
| **Chute** | gameService.processShot(direction, 1) → apiClient.post('/api/games/shoot', { direction, amount: 1 }) | gameService.js: betValue = 1; body direction e amount; sem header X-Idempotency-Key. |
| **Engine no backend** | Validação amount === 1; getOrCreateLoteByValue(1); shotIndex === lote.winnerIndex; premio 5; premioGolDeOuro 100; UPDATE saldo (optimistic lock) → push lote → INSERT chutes | server-fly.js: amountNum !== 1 → 400; winnerIndex = config.size - 1; premio = 5.00; premioGolDeOuro = 100.00; ordem e reversão conforme Bloco E. |
| **Persistência** | usuarios (saldo), chutes (registro), metricas_globais (contador, ultimo_gol_de_ouro) | Inserts/updates em server-fly.js; startup carrega metricas_globais. |
| **Rotas protegidas** | /dashboard, /game, /gameshoot, /profile, /withdraw, /pagamentos | Todas com <ProtectedRoute>. |
| **Rotas públicas** | /, /register, /forgot-password, /reset-password, /terms, /privacy, /download | App.jsx. |
| **Auth** | JWT; authenticateToken no shoot e em rotas de perfil/pagamentos/saque | server-fly.js. |

---

## 5. O que é legado, sobra ou dívida de confusão

| Item | Tipo | Evidência |
|------|------|------------|
| **Rota /gameshoot** | Legado | Declarada no App.jsx; nenhum navigate/link no projeto aponta para ela; apenas URL manual. |
| **Componente GameShoot** | Legado | Usado apenas pela rota /gameshoot; mesma API de shoot; layout diferente (InternalPageLayout, %). |
| **Componente Game** | Sobra / import morto | Importado em App.jsx; **não** usado em nenhuma <Route>; página com GameField, BettingControls, etc. |
| **GameShootFallback** | Import morto | Importado em App.jsx; não usado em nenhuma Route. |
| **GameShootTest** | Import morto | Importado em App.jsx; não usado em nenhuma Route. |
| **GameShootSimple** | Import morto | Importado em App.jsx; não usado em nenhuma Route. |
| **batchConfigs (valor 2, 5, 10)** | Código morto na prática | Backend aceita apenas amount === 1; configs para 2, 5, 10 existem mas API rejeita. |
| **TopBar.jsx** | Componente não usado no fluxo oficial | Auditoria Bloco F: não importada por nenhuma página do BLOCO F. |
| **Navigation.jsx** | Possível uso em outro fluxo | Usa /game no menu; se não for usado em nenhuma tela atual, pode ser sobra. |
| **Contador em GET /health** | Dívida de risco | Exposto sem auth; documentado como risco; ainda ativo no código. |
| **GET /api/debug/token** | Dívida de risco | Ativo; documentado como “deve ser desativado em produção”. |

---

## 6. Coerência entre documentação e código

| Afirmação / Documento | Código / Realidade | Coerência |
|------------------------|---------------------|-----------|
| Rota oficial do jogo é /game e componente é GameFinal | App.jsx: /game → GameFinal | Coerente |
| /gameshoot e GameShoot são legado | App.jsx declara rota; nenhum link; GameShoot usa mesma API | Coerente |
| Valor do chute R$ 1, lote 10, 10º = goal, prêmio R$ 5, Gol de Ouro R$ 100 | server-fly.js: amountNum !== 1 → 400; batchConfigs[1].size 10; winnerIndex = config.size - 1; premio 5; premioGolDeOuro 100 | Coerente |
| Cliente não envia X-Idempotency-Key | gameService.processShot → apiClient.post com body { direction, amount }; sem headers idempotency | Coerente |
| GET /health expõe contador e ultimoGolDeOuro | server-fly.js res.json contadorChutes, ultimoGolDeOuro | Coerente |
| GET /api/debug/token expõe JWT | Endpoint presente em server-fly.js | Coerente |
| Lotes em memória; não restaurados no startup | lotesAtivos = new Map(); startup carrega só metricas_globais | Coerente |
| Ordem UPDATE saldo → push lote → INSERT chutes; reversão em falha | server-fly.js: ordem e blocos de reversão em validateAfterShot inválido e chuteError | Coerente |
| Handoff: “Player consome API via apiClient; gameplay via gameService” | GameFinal usa gameService.processShot; apiClient usado por gameService e profile | Coerente |
| Bloco H: “chutes até próximo Gol de Ouro não exibido no HUD do GameFinal” | GameFinal tem estado shotsUntilGoldenGoal e atualiza da API; não há elemento JSX no HUD exibindo esse valor | Coerente |
| App.jsx: “lista de rotas” nos relatórios | 13 rotas; Game, GameShootFallback, GameShootTest, GameShootSimple não têm Route | Coerente com ressalva: documentação de rotas não lista “imports sem rota” como dívida explícita em todos os relatórios; auditoria de rotas sim. |

**Resumo:** Não foi encontrada **contradição** entre documentação e implementação nas regras de negócio, fluxo principal e riscos já relatados. As **ressalvas** são: (1) existência de quatro imports de páginas sem rota, que aumentam risco de confusão em manutenção; (2) endpoints de risco (/health com contador, /api/debug/token) continuam ativos como documentado — nenhum relatório afirmou que foram corrigidos.

---

## 7. Diagnóstico forense por área

### 7.1 Arquitetura

| Aspecto | Estado atual | Pontos fortes | Fragilidades | Riscos | Evidência |
|---------|--------------|---------------|--------------|--------|-----------|
| Entrypoint real | Sólido | Um único servidor principal (server-fly.js); package.json explícito | Outros arquivos (proxy-cors, server-fly-deploy, etc.) podem gerar dúvida sobre qual sobe em produção | Baixo | package.json main e start; fly.toml (se usado) deve apontar para o mesmo |
| Fluxo principal | Adequado para V1 | Login → Dashboard → /game → shoot; depósito/saque/perfil claros | Duas telas de jogo (/game e /gameshoot) com comportamentos ligeiramente diferentes | Moderado (confusão) | App.jsx e auditoria de rotas |
| Separação player/backend | Adequado para V1 | Player (Vercel) e Backend (Fly.io) separados; API REST | Dependência total do backend para jogo; sem fallback | Aceito na V1 | Handoff e docs |

### 7.2 Rotas / Frontend

| Aspecto | Estado atual | Pontos fortes | Fragilidades | Riscos | Evidência |
|---------|--------------|---------------|--------------|--------|-----------|
| Rotas oficiais | Adequado para V1 | Todas as rotas de uso real declaradas e protegidas onde deve | Rota /gameshoot ainda declarada e acessível por URL | Baixo | App.jsx |
| Imports sem rota | Frágil | Nenhum impacto no fluxo atual | Game, GameShootFallback, GameShootTest, GameShootSimple importados e não usados em Route; aumento de bundle e risco de alguém usar “errado” | Moderado (manutenção) | App.jsx linhas 15–20 |
| Fluxo do usuário | Sólido | Dashboard → Jogar → /game; InternalPageLayout → JOGAR AGORA → /game | — | Baixo | Dashboard, InternalPageLayout |

### 7.3 Gameplay / Engine

| Aspecto | Estado atual | Pontos fortes | Fragilidades | Riscos | Evidência |
|---------|--------------|---------------|--------------|--------|-----------|
| Regra 10º = goal | Sólido | winnerIndex = config.size - 1; shotIndex === lote.winnerIndex; isGoal; premio 5, premioGolDeOuro 100 | — | Baixo | server-fly.js |
| Validação amount === 1 | Sólido | amountNum !== 1 → 400 com mensagem V1 | — | Baixo | server-fly.js 1149–1156 |
| Lotes em memória | Adequado para V1 | getOrCreateLoteByValue; lote ativo reutilizado até cheio | Lotes não restaurados no restart; contador sim | Moderado (restart) | Bloco E e server-fly.js startup |
| Idempotência | Parcialmente mitigado | Backend aceita X-Idempotency-Key e rejeita duplicata | Cliente não envia; retry pode duplicar chute | Alto (retry) | gameService.js; Bloco G |

### 7.4 Economia

| Aspecto | Estado atual | Pontos fortes | Fragilidades | Riscos | Evidência |
|---------|--------------|---------------|--------------|--------|-----------|
| Números no código | Sólido | premio = 5.00; premioGolDeOuro = 100.00; betAmount = 1; size 10 | batchConfigs com 2, 5, 10 não usados na API (só 1 aceito) | Baixo (código morto) | server-fly.js |
| Consistência com documentação | Sólido | Bloco E e handoff batem com implementação | — | Baixo | Cruzamento docs × código |

### 7.5 Saldo

| Aspecto | Estado atual | Pontos fortes | Fragilidades | Riscos | Evidência |
|---------|--------------|---------------|--------------|--------|-----------|
| Fluxo débito/crédito | Adequado para V1 | Optimistic lock; UPDATE antes de INSERT; reversão em falha explícita | Sem transação atômica; crash entre UPDATE e INSERT deixa saldo debitado sem chute | Alto (falha intermediária) | server-fly.js; mapa de risco |
| Reversão | Parcialmente mitigado | Em validateAfterShot inválido e em chuteError há reversão e pop no lote | Se processo morrer entre UPDATE e INSERT, não há rollback | Alto | Bloco E |

### 7.6 Antifraude

| Aspecto | Estado atual | Pontos fortes | Fragilidades | Riscos | Evidência |
|---------|--------------|---------------|--------------|--------|-----------|
| GET /health | Frágil | Útil para monitoramento | Expõe contadorChutes e ultimoGolDeOuro sem auth | Alto (farming Gol de Ouro) | server-fly.js; Bloco G |
| GET /api/debug/token | Frágil | — | Expõe JWT decodificado sem auth | Alto (produção) | server-fly.js; Bloco G |
| Rate limit | Parcialmente mitigado | 100/15 min por IP; auth 5 falhas/15 min por IP | Sem limite por userId; sem CAPTCHA | Moderado | Bloco G |
| Validação de entrada | Sólido | direction whitelist; amount === 1; userId do JWT | — | Baixo | server-fly.js |

### 7.7 Produto / Retenção

| Aspecto | Estado atual | Pontos fortes | Fragilidades | Riscos | Evidência |
|---------|--------------|---------------|--------------|--------|-----------|
| Experiência oficial (GameFinal) | Adequado para V1 | HUD saldo, chutes, ganhos, gols de ouro; overlays e toasts; R$ 1 fixo | “Chutes até próximo Gol de Ouro” não exibido no HUD (estado existe) | Moderado (produto) | Bloco H; GameFinal.jsx |
| Loop | Adequado para V1 | Curto; feedback imediato; custo baixo | Previsibilidade total; pouca variação emocional | Documentado no Bloco H | Bloco H |

### 7.8 Infraestrutura

| Aspecto | Estado atual | Pontos fortes | Fragilidades | Riscos | Evidência |
|---------|--------------|---------------|--------------|--------|-----------|
| Instância única | Aceito na V1 | Premissa clara; adequado ao desenho atual | Ponto único de falha; escala horizontal não suportada | Crítico se escalar | Handoff; mapa de risco |
| Restart | Parcialmente mitigado | Contador carregado de metricas_globais | Lotes perdidos; lotes “em andamento” órfãos | Moderado | server-fly.js startup |

### 7.9 Observabilidade

| Aspecto | Estado atual | Pontos fortes | Fragilidades | Riscos | Evidência |
|---------|--------------|---------------|--------------|--------|-----------|
| Logs | Provisório | console.log em shoot, Gol de Ouro, lote completo, erros | Sem requestId/correlationId; sem trilha de auditoria de saldo; logs voláteis | Alto (investigação) | server-fly.js; mapa de risco |
| Alertas | Não mitigado | — | Nenhum alerta configurado | Moderado | Bloco J não auditado |

### 7.10 Legado / Manutenção

| Aspecto | Estado atual | Pontos fortes | Fragilidades | Riscos | Evidência |
|---------|--------------|---------------|--------------|--------|-----------|
| Rotas legado | Aceito na V1 | /gameshoot não linked; fluxo oficial único | Rota ainda acessível; dois componentes de jogo (GameFinal e GameShoot) | Moderado (confusão) | App.jsx; auditoria rotas |
| Imports mortos | Frágil | Nenhum efeito no runtime | Quatro páginas importadas sem rota; possível uso incorreto no futuro | Moderado | App.jsx |

---

## 8. Top 15 achados forenses mais importantes

| # | Achado | Área | Severidade | Evidência |
|---|--------|------|------------|-----------|
| 1 | Cliente oficial não envia X-Idempotency-Key no shoot; retry pode duplicar chute e débito | Engine / Saldo | Alto | gameService.js: body só direction e amount |
| 2 | GET /health expõe contadorChutes e ultimoGolDeOuro sem autenticação; permite farming do Gol de Ouro | Antifraude | Alto | server-fly.js res.json em /health |
| 3 | GET /api/debug/token ativo e expõe JWT decodificado | Antifraude | Alto | server-fly.js endpoint |
| 4 | Não há transação atômica entre UPDATE de saldo e INSERT em chutes; crash entre os dois gera inconsistência | Saldo | Alto | server-fly.js: duas operações separadas; mapa de risco |
| 5 | Lotes não são restaurados no startup; apenas contador é carregado; restart perde lotes ativos | Infraestrutura | Moderado | server-fly.js: lotesAtivos = new Map(); startup só metricas_globais |
| 6 | App.jsx importa Game, GameShootFallback, GameShootTest, GameShootSimple sem nenhuma Route; dívida de confusão | Frontend / Legado | Moderado | App.jsx linhas 15–20; nenhum path aponta para esses componentes |
| 7 | Duas telas de jogo: /game (GameFinal) e /gameshoot (GameShoot); apenas /game no fluxo; /gameshoot acessível por URL | Rotas | Moderado | App.jsx; auditoria de rotas |
| 8 | Escala horizontal não suportada; lotes e contador em memória por processo | Infraestrutura | Crítico (se escalar) | Bloco E; handoff |
| 9 | saveGlobalCounter não retry em falha; contador em memória pode divergir do banco | Engine | Moderado | server-fly.js saveGlobalCounter só loga erro |
| 10 | “Chutes até próximo Gol de Ouro” existem no estado do GameFinal mas não são exibidos no HUD | Produto | Moderado | GameFinal.jsx: shotsUntilGoldenGoal atualizado; HUD sem esse campo |
| 11 | Observabilidade limitada: sem requestId, sem trilha de auditoria de saldo | Observabilidade | Alto | server-fly.js logs; mapa de risco |
| 12 | batchConfigs com valores 2, 5, 10 no backend; API aceita apenas 1; código morto para V1 | Engine | Baixo | server-fly.js batchConfigs; amountNum !== 1 |
| 13 | Optimistic locking de saldo implementado; reversão em falha de validação e de INSERT | Saldo | Favorável | server-fly.js .eq('saldo', user.saldo); blocos de reversão |
| 14 | Economia (1, 10, 10º, 5, 100) implementada de forma coerente com a documentação | Economia | Favorável | server-fly.js premio, premioGolDeOuro, winnerIndex |
| 15 | Fluxo real do jogador (login → dashboard → /game → shoot) único e consistente com documentação | Arquitetura | Favorável | App.jsx; Dashboard; GameFinal; gameService |

---

## 9. O que já pode ser considerado sólido

- **Regra do jogo no backend:** amount === 1, lote 10, winnerIndex = 9, premio 5, premioGolDeOuro 100; validação de direction; resultado por shotIndex === winnerIndex.
- **Economia matemática:** Coerente com Bloco E e handoff; sustentável no formato atual.
- **Rota oficial e componente oficial:** /game → GameFinal; decisão refletida no código.
- **Fluxo do jogador:** Login → Dashboard → Jogar → /game; Depositar, Sacar, Perfil com rotas e proteção corretas.
- **Optimistic locking de saldo:** UPDATE com .eq('saldo', user.saldo); 409 em conflito.
- **Ordem de operações e reversão:** UPDATE saldo → push lote → validação pós → INSERT chutes; reversão em falha de validação ou de INSERT.
- **Contador global:** Carregado de metricas_globais no startup; persistido a cada chute.
- **Entrypoint backend:** server-fly.js como main e start; sem ambiguidade.
- **Documentação vs código:** Regras de negócio e riscos documentados batem com o que está implementado.

---

## 10. O que ainda está frágil ou provisório

- **Idempotência no cliente:** Não envia X-Idempotency-Key; retry duplica chute/débito.
- **Transação saldo + chutes:** Inexistente; falha intermediária gera inconsistência.
- **GET /health:** Expõe contador e ultimoGolDeOuro; risco de fraude.
- **GET /api/debug/token:** Ativo; deve ser desativado ou protegido em produção.
- **Lotes no restart:** Não restaurados; apenas contador; lotes ativos perdidos.
- **Observabilidade:** Logs em console; sem requestId; sem trilha de auditoria de saldo; sem alertas.
- **Imports sem rota no App:** Game, GameShootFallback, GameShootTest, GameShootSimple; risco de confusão e manutenção errada.
- **Duas telas de jogo:** /game e /gameshoot; legado ainda acessível e com comportamento ligeiramente diferente.
- **Escala:** Múltiplas instâncias não suportadas; lotes e contador em memória por processo.

---

## 11. O que pode operar hoje sem enganar a equipe

O sistema **pode operar hoje** desde que a equipe aceite explicitamente:

- **Uma única instância** do backend; sem escalar horizontalmente com o código atual.
- **Retry do cliente** pode gerar chute duplicado e débito duplicado; não há idempotency key no app oficial.
- **GET /health** expõe o contador global; possibilidade de farming do Gol de Ouro por quem usar essa informação.
- **GET /api/debug/token** não deve ser usado em produção; se estiver acessível, é risco de vazamento.
- **Restart** do backend: contador é restaurado; lotes ativos são perdidos; não há “restauração” de lotes a partir do banco.
- **Falha entre UPDATE de saldo e INSERT em chutes** (crash/OOM): saldo pode ficar debitado sem registro de chute; reconciliação manual.
- **Observabilidade limitada:** investigação de incidentes e auditoria de saldo dependem de análise manual (chutes vs saldo) e logs atuais.
- **Legado:** /gameshoot e componentes Game, GameShootFallback, GameShootTest, GameShootSimple existem; apenas /game é o fluxo oficial.

Operar “sem enganar” significa **não afirmar** que o sistema está pronto para escala, que retry é seguro, que há transação atômica, que /health e /api/debug/token estão blindados, ou que lotes sobrevivem a restart. Tudo isso está documentado nos relatórios e confirmado no código.

---

## 12. O que bloquearia crescimento ou escala

- **Lotes apenas em memória:** Sem store compartilhado (Redis/banco), múltiplas instâncias teriam lotes duplicados e inconsistentes.
- **Contador global em memória:** Cada processo teria seu próprio contador; Gol de Ouro incorreto ou múltiplo.
- **Idempotência em memória:** idempotencyProcessed por processo; mesma chave em outra instância poderia ser processada de novo.
- **Ausência de transação atômica:** Em escala, falhas e concorrência amplificariam inconsistência saldo vs chutes.
- **Ausência de fila ou worker:** Não há serialização global de chutes por lote; race entre instâncias.
- **GET /health e /api/debug/token:** Mesmo em uma instância já são riscos; em várias instâncias não resolvem e ainda expõem dados.
- **Observabilidade:** Sem requestId e trilha de auditoria, operar várias instâncias tornaria diagnóstico muito difícil.

**Conclusão:** Crescimento **horizontal** (mais instâncias) está **bloqueado** até store compartilhado para lotes e contador, idempotência compartilhada e transação ou worker serializado. Crescimento **vertical** (mais carga em uma instância) é limitado pela capacidade do processo e do banco, e pelos riscos já conhecidos (retry, falha intermediária).

---

## 13. Diagnóstico consolidado da V1

**V1 OPERÁVEL COM RESSALVAS ESTRUTURAIS**

Justificativa:

- **Operável:** Fluxo real está implementado e coerente com a documentação; economia sustentável; blindagens de saldo e de lote existentes; contador restaurado no startup; regras da V1 refletidas no código.
- **Ressalvas estruturais:** (1) Cliente não envia idempotency key. (2) Não há transação atômica entre saldo e chutes. (3) GET /health e GET /api/debug/token expostos. (4) Lotes não restaurados no restart. (5) Observabilidade limitada. (6) Escala horizontal não suportada. (7) Imports e rotas legado que podem gerar confusão.

Não se classifica como **V1 ESTRUTURALMENTE SÓLIDA** porque as ressalvas acima são reais e não mitigadas. Não se classifica como **V1 AINDA NÃO CONSOLIDADA** porque o núcleo (engine, economia, fluxo, auth, pagamentos) está implementado e documentado; a operação é possível dentro dos limites aceitos. A classificação **V1 FUNCIONAL MAS AINDA FRÁGIL** seria também defensável; **OPERÁVEL COM RESSALVAS ESTRUTURAIS** deixa explícito que pode operar, mas com consciência dos limites e sem fingir que está pronto para crescimento ou operação sem controle.

---

## 14. Conclusão objetiva

- **Qual é o estado real do Gol de Ouro hoje?**  
  Sistema **operável em ambiente controlado (instância única)** com **arquitetura real clara**: backend em server-fly.js, player em goldeouro-player com rota oficial /game (GameFinal), economia e engine implementadas conforme documentação, e riscos conhecidos (retry sem idempotency, /health, /api/debug/token, ausência de transação atômica, lotes no restart, observabilidade, legado). Nada que foi relatado nas auditorias anteriores foi desmentido pelo código; há coerência entre documentação e implementação, com a dívida explícita de imports sem rota e de endpoints de risco ainda ativos.

- **Qual é a maior força do projeto?**  
  **Clareza do núcleo:** regras da V1 (valor, lote, goal, prêmio, Gol de Ouro) estão implementadas de forma consistente e documentadas; fluxo do jogador é único (login → dashboard → /game); economia é sustentável e auditável; blindagens de concorrência de saldo e de ordem de operações existem.

- **Qual é a maior fragilidade estrutural?**  
  **Ausência de transação atômica entre débito de saldo e persistência do chute**, somada ao **cliente não enviar X-Idempotency-Key**: em conjunto, permitem tanto inconsistência em falha intermediária (crash entre UPDATE e INSERT) quanto duplicidade em retry. É a fragilidade que mais impacta consistência financeira e confiança operacional.

- **O que está pronto de verdade?**  
  **Pronto de verdade:** regra do jogo (10º = goal, R$ 5, Gol de Ouro R$ 100), validação de entrada (amount 1, direction), fluxo oficial (/game, GameFinal), optimistic locking de saldo, reversão em falha explícita, carregamento do contador no startup, coerência entre documentação e código nas regras de negócio. **Não está pronto:** idempotência no cliente, transação atômica, blindagem de /health e /api/debug/token, restauração de lotes, observabilidade estruturada, escala horizontal, limpeza de imports e rotas legado.

- **Qual deve ser o próximo passo depois desta auditoria forense?**  
  (1) **Decisão explícita:** operar a V1 com consciência total dos limites (documento único de “o que a equipe aceita”) ou consolidar limpeza e blindagem antes de crescer. (2) **Se operar:** manter instância única; comunicar regras e riscos; não escalar horizontalmente até nova arquitetura. (3) **Se consolidar:** implementar idempotency no cliente; restringir ou remover contador em /health e desativar/proteger /api/debug/token; considerar transação ou procedimento atômico saldo+chutes; limpar imports mortos e opcionalmente remover ou redirecionar /gameshoot; evoluir observabilidade (requestId, trilha de auditoria). (4) **Para escala futura:** auditoria e desenho do BLOCO I (Escalabilidade) com store compartilhado, fila e idempotência compartilhada.

---

*Documento gerado em modo READ-ONLY. Nenhum código, banco, patch, commit, merge ou deploy foi alterado ou sugerido como já aplicado.*

**Arquivo:** `docs/relatorios/AUDITORIA-FORENSE-SISTEMA-INTEIRO-GOLDEOURO-2026-03-16.md`
