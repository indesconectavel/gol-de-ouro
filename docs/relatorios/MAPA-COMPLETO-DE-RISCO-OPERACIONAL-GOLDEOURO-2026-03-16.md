# MAPA COMPLETO DE RISCO OPERACIONAL — GOL DE OURO

**Projeto:** Gol de Ouro  
**Documento:** Mapa de risco operacional pós-handoff  
**Data:** 2026-03-16  
**Modo:** READ-ONLY ABSOLUTO — análise, cruzamento de evidências e documentação. Nenhuma alteração de código, patch, refatoração, commit, merge, deploy ou banco.

---

## 1. Resumo executivo

O sistema Gol de Ouro está **operável em ambiente controlado (instância única)** com riscos operacionais **conhecidos e documentados**. A engine de lotes e o fluxo financeiro (débito/crédito) possuem blindagens (optimistic locking, ordem UPDATE→INSERT, reversão em falha explícita); porém **não há transação atômica** entre saldo e chutes, **lotes não são restaurados** após restart e o **cliente oficial não envia X-Idempotency-Key**, o que expõe a duplicidade de chute em retry. A **exposição do contador global em GET /health** e o endpoint **GET /api/debug/token** representam os maiores riscos de fraude e exploração. A **escala horizontal não é suportada** — múltiplas instâncias levariam a lotes e contador divergentes e a falha de idempotência entre processos. **Observabilidade é limitada**: logs básicos em console, sem trilha estruturada de auditoria de saldo nem recuperação automática do estado dos lotes. Conclusão: o sistema **pode operar hoje** dentro dos limites da V1 (instância única, volume controlado), com **ressalvas importantes** (antifraude, retry, restart) e com **escala futura bloqueada** até nova arquitetura.

---

## 2. Escopo analisado

| Categoria | Itens |
|-----------|--------|
| **Arquivos** | `server-fly.js`, `goldeouro-player/src/App.jsx`, `goldeouro-player/src/pages/GameFinal.jsx`, `goldeouro-player/src/pages/GameShoot.jsx`, `goldeouro-player/src/services/gameService.js`, `goldeouro-player/src/services/apiClient.js`, `utils/lote-integrity-validator.js` (referência) |
| **Módulos** | Engine de chute (POST /api/games/shoot), lotes em memória (`lotesAtivos`), contador global (`contadorChutesGlobal`), idempotência (`idempotencyProcessed`), persistência (`chutes`, `usuarios`, `metricas_globais`), startup e carregamento de contador |
| **Rotas** | `/api/games/shoot`, `/health`, `/api/metrics`, `/api/debug/token`, `/api/user/profile`, auth e payments conforme handoff |
| **Fluxos** | Fluxo do chute (Bloco E): auth → validação → lote → contador → resultado → UPDATE saldo → push lote → validação pós → INSERT chutes → resposta; startup: connectSupabase → load metricas_globais (contador); **não** há carregamento de lotes a partir do banco |
| **Documentos** | `docs/ARQUITETURA-BLOCOS-GOLDEOURO.md`, `docs/ROADMAP-V1-GOLDEOURO.md`, `docs/RELATORIO-MESTRE-HANDOFF-GOLDEOURO-V1.md`, `docs/relatorios/ENCERRAMENTO-PREMIUM-BLOCO-E-GAMEPLAY-V1.md`, `docs/relatorios/AUDITORIA-COMPLETA-BLOCO-F-INTERFACE-2026-03-16.md`, `docs/relatorios/VALIDACAO-FINAL-PREVIEW-BLOCO-F-VERCEL-2026-03-16.md`, `docs/relatorios/AUDITORIA-ROTAS-PLAYER-GOLDEOURO-2026-03-16.md`, `docs/relatorios/AUDITORIA-ANTIFRAUDE-BLOCO-G-READONLY-2026-03-09.md` |

---

## 3. Premissas operacionais da V1

| Premissa | Definição |
|----------|-----------|
| **Instância única** | Backend roda em uma única instância (Fly.io). Lotes e contador em memória; multi-instância não é suportada. |
| **Lotes em memória** | Estado dos lotes (chutes, status, ativo, totalArrecadado, premioTotal) vive em `lotesAtivos` (Map). Não há tabela de “lotes” no banco; apenas registros em `chutes` com `lote_id`. |
| **Contador global** | `contadorChutesGlobal` e `ultimoGolDeOuro` em memória; persistidos em `metricas_globais` a cada chute e carregados no startup. |
| **Gameplay oficial** | Rota `/game`, componente GameFinal; chute via `gameService.processShot` → POST /api/games/shoot. |
| **Economia oficial** | R$ 1 por chute; lote 10; 10º = goal; prêmio R$ 5; Gol de Ouro a cada 1000 chutes (+R$ 100). |
| **Regras do produto** | Mesmo jogador pode repetir no lote; resultado determinístico (índice no lote); sem sorteio. |

---

## 4. Mapa de riscos por área

### 4.1 Engine de jogo

| Nome do risco | Descrição objetiva | Causa provável | Impacto potencial | Severidade | Probabilidade | Status atual | Evidência no sistema |
|---------------|--------------------|----------------|-------------------|------------|--------------|-------------|----------------------|
| Concorrência de chutes no mesmo lote | Dois requests simultâneos podem obter o mesmo `shotIndex` (lote.chutes.length) antes do push. | Processamento assíncrono sem lock por lote; Node serializa por await mas dois requests entram em paralelo. | Dois chutes com mesmo índice; possível dois “10º” ou inconsistência lote/chutes. | Alta | Baixa | Parcialmente mitigado | Bloco E: ordem de operações e validação; sem mutex explícito por lote. |
| Race no fechamento do lote | Dois chutes “10º” disputando o goal. | Se dois requests passam validateBeforeShot com lote.length < 10 e ambos executam até shotIndex = 9. | Um goal e um miss ou dois goals; inconsistência econômica. | Alta | Baixa | Parcialmente mitigado | getOrCreateLoteByValue retorna mesmo lote; serialização por await reduz mas não garante atomicidade do “quem é o 10º”. |
| Inconsistência memória vs persistência | Estado do lote em memória pode divergir do que está em `chutes` (ex.: após crash). | Lotes não são reconstruídos do banco no startup; apenas contador é carregado. | Lotes “fantasmas” ou chutes órfãos; contagem de lote incorreta. | Moderada | Média (após restart) | Não mitigado | server-fly.js: `lotesAtivos = new Map()` na carga; nenhum SELECT em chutes para reconstruir lotes. |
| Contador global divergente do banco | Em memória é a fonte da verdade durante o request; banco é atualizado após cada chute. | saveGlobalCounter() assíncrono; se falhar ou atrasar, memória está à frente do banco. | Após restart, contador pode ser recarregado menor que o real se houve falha de escrita. | Moderada | Baixa | Parcialmente mitigado | Startup carrega de metricas_globais; saveGlobalCounter chamado após incremento (linha 1226). |
| Replay de requisição (duplicar chute) | Mesmo chute processado duas vezes por retry/timeout do cliente. | Cliente oficial não envia X-Idempotency-Key (gameService.js apenas body direction/amount). | Dois débitos, dois registros em chutes, ou 409 por optimistic lock no segundo. | Moderada | Média | Não mitigado (cliente) | gameService.js linha 90: apiClient.post com apenas direction e amount; auditoria Bloco G confirma ausência de header. |
| Retry de rede duplicar chute | Cliente reenvia POST após timeout; backend processa novamente. | Sem idempotency key, cada POST é considerado novo. | Saldo debitado duas vezes; dois registros em chutes para mesma ação do usuário. | Moderada | Média | Não mitigado (cliente) | Backend aceita e processa; idempotency só atua se cliente enviar header. |

### 4.2 Saldo e movimentação financeira interna

| Nome do risco | Descrição objetiva | Causa provável | Impacto potencial | Severidade | Probabilidade | Status atual | Evidência no sistema |
|---------------|--------------------|----------------|-------------------|------------|--------------|-------------|----------------------|
| Saldo debitado duas vezes | Dois débitos de R$ 1 para a mesma ação (retry/duplicidade). | Cliente reenvia shoot sem idempotency key; backend processa duas vezes. | Prejuízo ao usuário (R$ 1 a mais debitado). | Moderada | Média | Não mitigado (cliente) | Bloco G e gameService: sem X-Idempotency-Key. |
| Prêmio creditado duas vezes | Dois créditos para o mesmo goal. | Muito improvável no fluxo atual (goal só no 10º; lote em memória). | Prejuízo à plataforma (R$ 5 ou R$ 105). | Baixa | Baixa | Mitigado | Lógica do lote: apenas um 10º por lote; serialização reduz duplicidade. |
| Crédito sem débito | Cenário teórico de bug que credita sem debitar. | Não identificado no fluxo atual. | Prejuízo à plataforma. | — | — | Não aplicável | Fluxo sempre debita antes de creditar (novoSaldo inclui -1 + premio). |
| Débito sem persistência do chute | Saldo atualizado mas INSERT em chutes falha ou processo morre antes. | Crash/erro após UPDATE e antes de INSERT; ou falha de INSERT após reversão não executada. | Usuário perdeu R$ 1 sem registro de chute; inconsistência saldo vs chutes. | Alta | Baixa | Parcialmente mitigado | server-fly.js: em chuteError há reversão de saldo; se processo morrer entre UPDATE e INSERT não há rollback automático (sem transação SQL). |
| Rollback parcial | Reversão de saldo executada mas lote em memória ou contador já alterados. | Ordem: UPDATE saldo → push lote → validateAfterShot / INSERT; em falha há reversão e pop. | Se reversão falhar, saldo fica incorreto. | Moderada | Baixa | Parcialmente mitigado | Código faz reversão em validateAfterShot inválido e em chuteError; não há transação. |
| Inconsistência saldo vs tabela chutes | Soma dos efeitos em chutes não bater com saldo do usuário. | Falha intermediária (crash após UPDATE, antes INSERT); ou bug em outra rota que altere saldo. | Dificuldade de auditoria e reconciliação. | Alta | Baixa | Parcialmente mitigado | Ordem e reversão reduzem; não há job de reconciliação nem constraint que force consistência. |
| Perda de consistência em falha intermediária | Processo termina (kill, OOM) entre UPDATE e INSERT. | Sem transação atômica; duas escritas separadas. | Saldo debitado, chute não persistido; usuário reclama; sem log único que correlacione. | Alta | Baixa | Não mitigado | Evidência: UPDATE e INSERT são duas chamadas Supabase separadas; sem BEGIN/COMMIT. |

### 4.3 Infraestrutura

| Nome do risco | Descrição objetiva | Causa provável | Impacto potencial | Severidade | Probabilidade | Status atual | Evidência no sistema |
|---------------|--------------------|----------------|-------------------|------------|--------------|-------------|----------------------|
| Instância única como ponto único de falha | Se a instância cair, todo o tráfego para. | Arquitetura atual: uma instância Fly.io. | Indisponibilidade total do jogo. | Moderada | Média | Aceito na V1 | Premissa operacional: instância única. |
| Escalar para múltiplas instâncias sem alteração | Várias instâncias com mesmo código. | Cada processo tem seu Map de lotes e seu contador; sem Redis/banco compartilhado. | Lotes duplicados; contador divergente; Gol de Ouro múltiplo ou errado; idempotency por processo. | Crítica | Alta (se escalar) | Não mitigado | Bloco E e handoff: “Não suportado oficialmente”; lotesAtivos e idempotencyProcessed são por processo. |
| Memória local como fonte da verdade dos lotes | Lote ativo existe só em RAM. | Design atual: sem tabela de lotes no banco. | Restart apaga lotes ativos; novos chutes criam novos lotes; histórico em chutes mantém lote_id mas “lote ativo” se perde. | Moderada | Certa (restart) | Aceito na V1 | server-fly.js: lotesAtivos não é repopulado no startup. |
| Restart da aplicação | Deploy, crash ou recycle do processo. | Fly.io ou operação manual. | Contador restaurado de metricas_globais; lotes ativos perdidos; qualquer lote “em andamento” vira órfão (chutes já persistidos com aquele lote_id, mas lote em memória não existe mais). | Moderada | Média | Parcialmente mitigado | Startup carrega apenas contador e ultimoGolDeOuro; lotesAtivos = new Map(). |
| Deploy durante operação | Novo deploy enquanto usuários chutam. | Zero-downtime ou breve indisponibilidade. | Requests em curso podem falhar (503/500); retry do cliente pode duplicar chute. | Moderada | Média | Parcialmente mitigado | Comportamento padrão de deploy; cliente sem idempotency amplia risco de duplicidade. |
| Perda de lote ativo | Após restart, nenhum lote em memória. | lotesAtivos não é persistido nem reconstruído. | Novos chutes criam novo lote; chutes antigos do “lote que estava ativo” permanecem no banco com mesmo lote_id mas lote não está mais “ativo”. Não gera crédito indevido; gera possível confusão em auditoria (lote incompleto no histórico). | Baixa | Certa (restart) | Aceito na V1 | Documentado no Bloco E. |
| Contador em memória divergir do banco | saveGlobalCounter falha silenciosamente ou atrasa. | Erro de rede/Supabase; log de erro mas processo continua. | No próximo restart, contador carregado pode ser menor que o real; Gol de Ouro pode “atrasar” ou haver duplicata se houver correção manual. | Moderada | Baixa | Parcialmente mitigado | saveGlobalCounter só loga erro; não retry nem bloqueia resposta. |
| Cold start / reinicialização | Primeira carga ou após idle. | Fly.io pode pausar/scale to zero conforme plano. | Contador carregado no startup; lotes vazios; mesma situação de “restart”. | Moderada | Depende do plano | Aceito na V1 | Mesmo fluxo de startServer. |

### 4.4 Antifraude e abuso

| Nome do risco | Descrição objetiva | Causa provável | Impacto potencial | Severidade | Probabilidade | Status atual | Evidência no sistema |
|---------------|--------------------|----------------|-------------------|------------|--------------|-------------|----------------------|
| Exploração do GET /health | Contador global e último Gol de Ouro expostos sem autenticação. | server-fly.js retorna contadorChutes e ultimoGolDeOuro no JSON de /health. | Atacante sabe “chutes até próximo 1000” e pode tentar capturar o Gol de Ouro com conta(s). | Alta | Alta | Não mitigado | server-fly.js linhas 2146–2148; auditoria Bloco G. |
| Exploração do contador global | Uso da informação do contador para timing de chutes. | Resposta do shoot também inclui contadorGlobal; /health amplifica. | Farming do bônus R$ 100. | Alta | Alta | Não mitigado | Bloco G: “principal vazamento”. |
| Exploração de GET /api/debug/token | Endpoint expõe JWT decodificado sem auth. | Endpoint ativo em server-fly.js. | Vazamento de identidade (userId, etc.); uso indevido se token vazado. | Alta | Média | Não mitigado | Bloco G e handoff: “deve ser desativado em produção”. |
| Automação por bot | Script que faz login e envia POST /api/games/shoot em loop. | API stateless; sem CAPTCHA; sem cooldown por usuário. | Volume alto; possível uso com múltiplas contas. | Alta | Média | Parcialmente mitigado | Rate limit 100/15 min por IP; sem limite por userId. |
| Repetição de requests (retry sem idempotency) | Cliente ou script reenvia o mesmo chute. | Cliente não envia X-Idempotency-Key. | Chute duplicado; saldo incorreto. | Moderada | Média | Não mitigado (cliente) | gameService não envia header. |
| Abuso de múltiplas contas | Várias contas para dominar lote ou Gol de Ouro. | Sem detecção de multi-conta; mesmo jogador pode repetir no lote. | Vantagem econômica por coordenação. | Moderada | Média | Não mitigado | Bloco G: sem verificação de CPF/dispositivo/IP por conta. |
| Captura proposital do Gol de Ouro | Polling /health + timing de chutes para ser o autor do chute 1000/2000/… | Contador exposto; regra previsível. | Ganho de R$ 100 por evento. | Alta | Média | Não mitigado | Bloco G Top exploits #1 e #8. |
| Ausência de idempotency key no cliente | App oficial não envia X-Idempotency-Key. | gameService e apiClient não adicionam o header. | Retry legítimo ou malicioso processado duas vezes. | Moderada | Média | Não mitigado | gameService.js: body só direction e amount. |
| Ausência de cooldown por usuário | Nenhum delay obrigatório entre chutes do mesmo userId. | Não implementado. | Bot ou usuário pode maximizar chutes até limite de IP. | Moderada | Média | Aceito na V1 | Bloco G. |
| Enumeração de comportamento da engine | Cliente pode inferir progresso do lote pela resposta (loteProgress). | Resposta do shoot inclui current/total/remaining. | Sniping do 10º chute; aceitável como regra do produto, mas explorável. | Moderada | Média | Aceito na V1 | Regra previsível documentada. |

### 4.5 Player / Frontend

| Nome do risco | Descrição objetiva | Causa provável | Impacto potencial | Severidade | Probabilidade | Status atual | Evidência no sistema |
|---------------|--------------------|----------------|-------------------|------------|--------------|-------------|----------------------|
| Rotas legado ainda acessíveis | /gameshoot existe e responde se o usuário digitar a URL. | Rota declarada no App.jsx; nenhum link leva a ela. | Confusão ou uso de tela alternativa com comportamento ligeiramente diferente. | Baixa | Baixa | Aceito na V1 | Auditoria de rotas: nenhum navigate para /gameshoot. |
| Fluxo quebrado entre páginas oficiais e legadas | Se alguém criar link para /gameshoot no futuro. | Hoje não há link; fluxo oficial é /game. | Duplicidade de “entrada” para o jogo. | Baixa | Baixa | Mitigado | Fluxo real só usa /game. |
| Comportamento inconsistente /game vs /gameshoot | GameFinal usa layoutConfig e HUD; GameShoot usa InternalPageLayout e layout em %. | Dois componentes diferentes; mesma API. | Experiência diferente; possível confusão se usuário cair em /gameshoot. | Baixa | Baixa | Aceito na V1 | Auditoria de rotas: GameFinal oficial; GameShoot legado. |
| Usuário confuso com páginas duplicadas | Duas telas de jogo (game e gameshoot). | Ambas existem; apenas /game é linked. | Suporte ou reclamação. | Baixa | Baixa | Aceito na V1 | Legado documentado. |
| Interface mascarar erro operacional | Frontend mostrar sucesso quando backend retornou 409/500 ou timeout. | Tratamento de erro no front; retry sem idempotency. | Usuário acha que não chutou e chuta de novo; duplicidade. | Moderada | Média | Parcialmente mitigado | Depende de como GameFinal trata 409/timeout; sem idempotency o retry é perigoso. |
| Retry automático do frontend gerar duplicidade | Biblioteca HTTP ou lógica de retry reenvia POST. | Cliente não envia idempotency key; backend aceita segundo request. | Dois chutes processados. | Moderada | Média | Não mitigado | gameService não envia X-Idempotency-Key. |

### 4.6 Observabilidade e resposta operacional

| Nome do risco | Descrição objetiva | Causa provável | Impacto potencial | Severidade | Probabilidade | Status atual | Evidência no sistema |
|---------------|--------------------|----------------|-------------------|------------|--------------|-------------|----------------------|
| Ausência de logs suficientes | Apenas console.log/error para shoot, Gol de Ouro, lote completo, métricas. | Sem sistema de logging estruturado (nível, contexto, requestId). | Dificuldade de filtrar e correlacionar em produção. | Moderada | Certa | Não mitigado | server-fly.js: ~101 ocorrências de console; middleware de monitoring loga método/url/status/tempo. |
| Ausência de alertas | Nenhum alerta configurado sobre falhas de saldo, falha de saveGlobalCounter ou taxa de 409. | Não implementado. | Incidente descoberto tardiamente. | Moderada | Certa | Não mitigado | Bloco J não auditado. |
| Dificuldade de investigar incidentes | Sem requestId ou correlationId nos logs; sem trilha por “chute”. | Logs não estruturados; duas operações (UPDATE, INSERT) sem id único compartilhado. | Reconstruir “o que aconteceu” para um usuário é manual. | Alta | Certa | Não mitigado | Log de shoot inclui contador e userId; não inclui loteId ou idempotency key no log. |
| Ausência de trilha clara para auditoria de saldo | Não há log “débito X para usuário Y por chute Z” com identificador único. | Design atual não exige; reversões logam erro mas não audit trail. | Reconciliação saldo vs chutes é manual (soma de chutes por usuario_id). | Alta | Certa | Não mitigado | Tabela chutes tem usuario_id, valor_aposta, resultado, premio; não há “audit_log” de saldo. |
| Dificuldade de reconstruir lote após incidente | Lote existe só em memória; após restart não há “estado do lote” no banco. | Chutes têm lote_id; não há tabela lotes com estado. | Reconstruir “quantos chutes tinha o lote X” exige agregar chutes por lote_id. | Moderada | Certa | Aceito na V1 | Possível via SELECT em chutes; não há ferramenta pronta. |
| Dificuldade de provar o que aconteceu em disputa | Sem trilha imutável por ação (ex.: “chute solicitado, processado, persistido”). | Logs voláteis; banco tem chutes e usuarios.saldo mas não “eventos” de auditoria. | Disputa usuário vs plataforma sem evidência clara. | Moderada | Média | Não mitigado | Bloco J não auditado. |

### 4.7 Produto e economia

| Nome do risco | Descrição objetiva | Causa provável | Impacto potencial | Severidade | Probabilidade | Status atual | Evidência no sistema |
|---------------|--------------------|----------------|-------------------|------------|--------------|-------------|----------------------|
| Percepção de injustiça | “Sempre perco no 9º” ou “o 10º é sempre de outro”. | Regra determinística e previsível (10º = goal). | Desgaste de confiança; reclamações. | Moderada | Média | Aceito na V1 | Regra do produto documentada. |
| Percepção de previsibilidade excessiva | Usuário descobre que o 10º é sempre gol. | Regra explícita na documentação interna; pode vazar. | Menor “surpresa”; possível abandono. | Baixa | Média | Aceito na V1 | Economia oficial. |
| Desgaste por repetição | Mesmo fluxo (chutar, miss, chutar, …) sem variação de regra. | Produto V1 fixo. | Retenção menor. | Baixa | Média | Aceito na V1 | Bloco H em análise. |
| Retenção baixa | Engajamento limitado se expectativa não for gerida. | Economia 50% RTP; 1 em 10 ganha por lote. | Churn. | Moderada | Média | Em análise | Bloco H. |
| Comportamento oportunista quando entende a lógica | Usuário tenta ser sempre o 10º (sniping) ou queima chutes com contas para Gol de Ouro. | Regra previsível; contador exposto em /health. | Vantagem econômica para quem explora. | Alta | Média | Parcialmente mitigado | Antifraude Bloco G; /health não mitigado. |
| Pressão sobre o Gol de Ouro como única emoção relevante | Jogadores focam só no múltiplo de 1000. | Bônus R$ 100 é o único evento “especial” além do goal. | Produto pode parecer “só vale a pena no Gol de Ouro”. | Baixa | Média | Aceito na V1 | Decisão de produto. |

---

## 5. Top 10 riscos operacionais mais importantes

| # | Risco | Área | Severidade | Probabilidade | Por que está no top 10 |
|---|--------|------|------------|----------------|-------------------------|
| 1 | Exposição do contador em GET /health | Antifraude | Alta | Alta | Permite farming do Gol de Ouro (R$ 100) com planejamento preciso; sem auth. |
| 2 | Escala horizontal sem alteração (múltiplas instâncias) | Infraestrutura | Crítica | Alta se escalar | Lotes e contador divergentes; Gol de Ouro múltiplo ou incorreto; quebra de idempotência. |
| 3 | Cliente não envia X-Idempotency-Key (retry duplica chute) | Engine / Saldo | Moderada | Média | Retry ou timeout gera dois débitos e dois chutes; prejuízo ao usuário e inconsistência. |
| 4 | GET /api/debug/token em produção | Antifraude | Alta | Média | Expõe JWT; vazamento de identidade e risco de uso indevido. |
| 5 | Débito sem persistência do chute (crash entre UPDATE e INSERT) | Saldo | Alta | Baixa | Saldo debitado sem registro em chutes; sem transação atômica. |
| 6 | Inconsistência saldo vs chutes (falha intermediária) | Saldo | Alta | Baixa | Dificulta auditoria e reconciliação; não há job nem constraint. |
| 7 | Automação por bot (sem CAPTCHA, sem cooldown por usuário) | Antifraude | Alta | Média | Volume e possível multi-conta; rate limit só por IP. |
| 8 | Lotes não restaurados no restart | Infraestrutura | Moderada | Certa | Lotes ativos perdidos; contador restaurado; lote “em andamento” vira órfão. |
| 9 | Dificuldade de investigar incidentes (logs e trilha de auditoria) | Observabilidade | Alta | Certa | Sem requestId/correlationId e sem trilha de saldo; investigação manual. |
| 10 | Captura proposital do Gol de Ouro (polling /health + timing) | Antifraude | Alta | Média | Exploração direta do principal vazamento; impacto econômico R$ 100 por evento. |

---

## 6. Riscos aceitáveis para a V1

Os itens abaixo podem ser **aceitos no contexto atual** (instância única, volume controlado) sem invalidar a operação, desde que documentados e monitorados na medida do possível:

- **Instância única como ponto único de falha** — premissa operacional.
- **Lotes em memória não persistidos** — restart perde lotes ativos; contador restaurado; aceito no Bloco E.
- **Contador e lotes não restaurados juntos** — apenas contador é carregado no startup.
- **Regra previsível (10º = goal)** — decisão de produto; sniping e coordenação possíveis como limite conhecido.
- **Mesmo jogador pode repetir no lote** — regra oficial.
- **Ausência de cooldown por usuário** — rate limit por IP apenas.
- **Rotas legado (/gameshoot) acessíveis por URL** — nenhum link no fluxo; confusão limitada.
- **Comportamento inconsistente /game vs /gameshoot** — legado; fluxo oficial é /game.
- **Ausência de detecção de multi-conta** — política de negócio pode mitigar; Bloco G aceito com riscos moderados.
- **Dificuldade de reconstruir lote a partir do banco** — possível via agregação em chutes; sem ferramenta pronta.
- **Percepção de previsibilidade e desgaste por repetição** — produto V1; Bloco H em análise.

---

## 7. Riscos que bloqueiam escala futura

Tudo o que **impede o sistema de crescer com segurança** (múltiplas instâncias, maior volume, mais usuários) sem mudança de arquitetura:

1. **Lotes apenas em memória** — sem store compartilhado (Redis/banco), cada instância teria seu próprio Map; lotes duplicados e inconsistência.
2. **Contador global em memória** — cada processo incrementa seu próprio contador; escrita em metricas_globais é “last write wins”; Gol de Ouro incorreto ou múltiplo.
3. **Idempotência em memória** — idempotencyProcessed por processo; mesma chave em outra instância pode ser processada de novo.
4. **Ausência de fila ou worker** — não há serialização global de chutes por lote; race entre instâncias.
5. **Ausência de transação atômica** (saldo + chutes) — em escala, falhas e concorrência amplificam inconsistência.
6. **GET /health expondo contador** — em multi-instância, qual instância responde? Mesmo com uma, exposição já é risco de fraude; escala não resolve.
7. **Observabilidade insuficiente** — sem requestId, métricas por rota e trilha de auditoria, operar várias instâncias torna diagnóstico muito difícil.

**Conclusão:** Escalar horizontalmente **sem** mover lotes e contador para store compartilhado, sem idempotência compartilhada e sem transação (ou worker serializado) **bloqueia** operação segura em mais de uma instância.

---

## 8. Riscos que podem gerar prejuízo financeiro

Riscos que afetam **saldo, payout interno, duplicidade ou consistência econômica**:

| Risco | Tipo de prejuízo | Quem perde | Mitigação atual |
|-------|-------------------|------------|------------------|
| Retry sem idempotency (chute duplicado) | Dois débitos de R$ 1 para mesma ação | Usuário | Nenhuma no cliente. |
| Crash entre UPDATE saldo e INSERT chutes | Débito de R$ 1 sem registro de chute | Usuário (saldo a menos sem chute) | Reversão apenas em caminho de erro explícito; não em crash. |
| Reversão de saldo falhar após erro de INSERT | Saldo permanece debitado mas chute não persistido; ou inversão. | Usuário ou plataforma | Código faz reversão; se a reversão falhar, inconsistência. |
| Prêmio creditado duas vezes (teórico) | R$ 5 ou R$ 105 a mais | Plataforma | Improvável; um 10º por lote; mitigado pela lógica. |
| Farming do Gol de Ouro via /health | Captura sistemática do bônus R$ 100 | Plataforma | Contador exposto; sem mitigação. |
| Multi-conta para dominar lote / 10º | Ganho de R$ 5 (ou R$ 105) por lote “controlado” | Plataforma | Sem detecção de multi-conta. |
| Inconsistência saldo vs chutes | Reconciliação manual; possível correção manual errada | Ambos | Sem job automático de reconciliação. |

---

## 9. Riscos de fraude e exploração

O que um **usuário malicioso** poderia tentar explorar (evidência nas auditorias e no código):

| Vetor | Como | Impacto | Evidência |
|-------|------|---------|-----------|
| Polling GET /health | Saber contador exato; disparar chutes quando contador próximo de 999, 1999, … | Capturar Gol de Ouro (R$ 100) | server-fly.js /health retorna contadorChutes e ultimoGolDeOuro. |
| Bot de chutes | Login + loop POST /api/games/shoot com direções variadas | Volume automatizado; possível sniping do 10º | Rate limit 100/15 min por IP; sem CAPTCHA. |
| Múltiplas contas | Várias contas para queimar chutes e posicionar uma no 10º ou no múltiplo de 1000 | R$ 5 ou R$ 105 por evento coordenado | Sem detecção; mesmo jogador pode repetir. |
| Retry sem idempotency key | Reenviar POST após timeout; backend processa duas vezes | Dois débitos ou dois chutes (conforme ordem e 409). | gameService não envia X-Idempotency-Key. |
| GET /api/debug/token | Obter payload do JWT (ex.: token vazado) | Identidade; possível impersonation se token reutilizado. | Endpoint sem auth. |
| Sniping do 10º chute | Usar loteProgress da resposta para tentar ser sempre o 10º | R$ 5 por lote “sniped” | Regra previsível; resposta inclui progress. |
| Criação em massa de contas | Script de registro com vários emails | Base para multi-conta e farming | Rate limit de login por IP; registro sem mesmo limite rígido. |

---

## 10. Lacunas de observabilidade

O que **hoje impediria diagnosticar corretamente um incidente real**:

- **Sem requestId/correlationId** — não é possível seguir um único chute da requisição até o INSERT e o log.
- **Logs apenas em console** — voláteis; sem nível (info/warn/error) estruturado; difícil filtrar em produção.
- **Sem trilha de auditoria de saldo** — não há log “débito/crédito X para usuário Y, motivo Z, ref chute W”; reconciliação é via soma em chutes e comparação com usuarios.saldo.
- **Falha de saveGlobalCounter** — só loga erro; não há alerta nem retry; contador em memória pode ficar à frente do banco.
- **Sem métricas por endpoint (ex.: shoot)** — não há contador de 409, 500 ou tempo de resposta por rota de forma persistente/agregada para dashboards.
- **Reversão de saldo** — logada indiretamente (erro de shoot); não há evento explícito “reversão executada para usuario_id X, valor Y”.
- **Lote “órfão” após restart** — não há alerta “lote em memória perdido”; reconstrução é manual (SELECT chutes WHERE lote_id = …).
- **Disputa usuário vs plataforma** — não há export “todas as ações que afetaram o saldo do usuário X” com identificadores únicos.

---

## 11. Diagnóstico operacional consolidado

Classificação do sistema com base no mapa de riscos e nas premissas da V1:

**OPERÁVEL APENAS EM AMBIENTE CONTROLADO**

Justificativa:

- **Pontos positivos:** Engine matematicamente consistente; optimistic locking de saldo; ordem UPDATE→INSERT e reversão em falha explícita; contador restaurado no startup; regras e economia documentadas; instância única assumida.
- **Ressalvas que impedem “operável com segurança” sem restrições:** (1) Exposição do contador em /health e /api/debug/token ativo geram risco de fraude e exploração. (2) Cliente não envia idempotency key — retry pode duplicar chute e gerar prejuízo/inconsistência. (3) Não há transação atômica entre saldo e chutes — falha intermediária gera inconsistência. (4) Observabilidade limitada — difícil investigar e auditar.
- **“Ambiente controlado”** significa: instância única, volume moderado, aceitação explícita dos riscos documentados (retry, restart, fraude via /health e /api/debug/token), e decisão de não escalar horizontalmente até nova arquitetura.

Não se classifica como **NÃO RECOMENDADO PARA OPERAÇÃO** porque as blindagens existentes (Bloco E) permitem operar com limites claros; nem como **OPERÁVEL COM SEGURANÇA NA V1** porque os riscos de antifraude e retry são reais e não mitigados no cliente e em /health e /api/debug/token.

---

## 12. Conclusão objetiva

- **O sistema pode operar hoje?**  
  **Sim**, dentro dos limites da V1: **instância única**, volume controlado, e aceitação dos riscos documentados (retry sem idempotency, exposição do contador, /api/debug/token, inconsistência em falha intermediária, lotes perdidos no restart).

- **Em quais limites?**  
  (1) Uma única instância do backend. (2) Sem escalar horizontalmente antes de store compartilhado (lotes + contador + idempotência) e sem transação atômica ou worker serializado. (3) Com consciência de que GET /health permite farming do Gol de Ouro e que retry do cliente pode duplicar chute. (4) Sem expectativa de trilha completa de auditoria de saldo ou diagnóstico fino de incidentes apenas com logs atuais.

- **Qual é o maior risco escondido?**  
  **Falha entre UPDATE de saldo e INSERT em chutes** (crash, OOM, kill): saldo já debitado, chute não persistido, sem rollback automático. O usuário perde R$ 1 sem registro; a reconciliação exige análise manual (chutes vs saldo). Não é “escondido” na documentação (Bloco E cita ausência de transação), mas é o risco **estrutural** mais sério para consistência financeira além do retry.

- **Qual auditoria vem logo depois?**  
  **BLOCO H — Economia e retenção** (já prioritário no handoff). Em seguida, **redução de riscos operacionais**: (1) remover ou restringir contador em GET /health (ou colocar atrás de auth/rede interna); (2) desativar ou proteger GET /api/debug/token em produção; (3) fazer o cliente oficial enviar X-Idempotency-Key em POST /api/games/shoot; (4) evoluir observabilidade (requestId, trilha de auditoria de saldo, alertas). Para escala futura: **BLOCO I — Escalabilidade** (store compartilhado, fila, transação ou worker).

---

*Documento gerado em modo READ-ONLY. Nenhum código, banco, patch, commit, merge ou deploy foi alterado ou sugerido como já aplicado.*

**Arquivo:** `docs/relatorios/MAPA-COMPLETO-DE-RISCO-OPERACIONAL-GOLDEOURO-2026-03-16.md`
