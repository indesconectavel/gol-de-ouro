# AUDITORIA COMPLETA — GOL DE OURO (V1)

**Data do relatório:** 2026-03-27  
**Escopo:** código do repositório (principalmente `server-fly.js`, `goldeouro-player`, `routes/analyticsIngest.js`, `config/system-config.js`, serviços de jogo).  
**Método:** leitura estática; sem execução de testes automatizados nesta sessão.

---

## 1. Resumo executivo

- **Estado geral:** O produto tem um fluxo jogável ponta a ponta (login → `/game` → chute via `POST /api/games/shoot` → atualização de saldo no Supabase) e integração com Mercado Pago (criação de PIX + webhook + job de reconciliação). Há lacunas relevantes em **saque**, **estatísticas de perfil**, **endpoint de métricas** e **superfície de debug**, além de **estado de lotes apenas em memória** no processo Node.
- **Pronto para V1 (demonstração para sócios):** **PRONTO COM RESSALVAS** — o core do jogo e depósito PIX estão implementados; operações de saque e consistência contábil/estatística exigem decisão explícita antes de tráfego financeiro real amplo.
- **Principais riscos:** (1) saque não reserva/debita saldo no backend ao criar pedido; (2) webhook PIX responde `200` antes do processamento assíncrono e credita saldo sem trava otimista (janela para condições de corrida); (3) lotes em `Map` em memória — instâncias múltiplas ou restart alteram continuidade; (4) `GET /api/debug/token` expõe payload JWT decodificado; (5) `GET /api/metrics` zera contadores mesmo com dados em `metricas_globais`, quebrando coerência com o contador real usado no shoot.

---

## 2. Análise por bloco

### BLOCO A — FINANCEIRO

#### Estado atual
- Depósito PIX: `POST /api/payments/pix/criar` (Mercado Pago), persistência em `pagamentos_pix`, `GET /api/payments/pix/usuario`.
- Webhook: `POST /api/payments/webhook` com validação opcional de assinatura se `MERCADOPAGO_WEBHOOK_SECRET`; confirmação via API MP; crédito em `usuarios.saldo`.
- Reconciliação periódica: `reconcilePendingPayments` (variáveis `MP_RECONCILE_*`).
- Saque: `POST /api/withdraw/request` insere em `saques`; `GET /api/withdraw/history`.
- Comentário explícito no código do saque: transação contábil delegada a processador externo (sem implementação no trecho lido).

#### Funcionalidade
- Fluxo de entrada (PIX) e confirmação com atualização de saldo no webhook/reconciliação está presente no código.
- Criação de registro de saque com validação PIX (`PixValidator`).

#### Lacunas
- **Não há débito de saldo** no `POST /api/withdraw/request` após validar saldo — o pedido é criado sem movimentar `usuarios.saldo` no mesmo fluxo.
- Não há, no arquivo principal analisado, **ledger** explícito (tabela de movimentações imutáveis) além de registros em `pagamentos_pix` / `saques` e campo `saldo`.
- PIX: fallback de CPF `'52998224725'` quando o cliente não envia CPF (`server-fly.js`).

#### Riscos técnicos
- Saque sem reserva imediata permite **múltiplos pedidos** sobre o mesmo saldo até processamento manual/externo.
- Webhook: resposta imediata + crédito posterior; risco de **processamento duplicado** sob webhooks repetidos ou corridas, pois não há padrão de “claim” atômico visível no trecho de crédito.
- Crédito no webhook usa `user.saldo + credit` **sem** `.eq('saldo', user.saldo)` (diferente do shoot).

#### Riscos de produto
- Expectativa de “saque seguro” não condiz com o comportamento atual se o produto prometer bloqueio imediato de valor.
- Uso de CPF genérico pode gerar **rejeição ou inconsistência** no MP em produção.

#### Impacto na V1
- **CRÍTICO** (se saque estiver visível e operacional para usuários reais).

#### Recomendação
- **Ajustar antes da V1** se houver qualquer saque habilitado em produção com dinheiro real.
- **Mover para V2** apenas se a V1 for estritamente “depósito + jogo” com saque desligado na UI/negócio.

---

### BLOCO B — SISTEMA DE APOSTAS

#### Estado atual
- Lotes: `Map` global `lotesAtivos`, `batchConfigs` (1→10 chutes, etc.), `getOrCreateLoteByValue`.
- V1 no shoot: **apenas valor 1** (`amountNum !== 1` → 400).
- Resultado do gol: `winnerIndex = config.size - 1` (último chute do lote); ou seja, **determinístico por posição no lote**, não por sorteio por chute.
- `LoteIntegrityValidator` valida antes/depois do chute.
- `GET /api/fila/entrar`: resposta simulada (`crypto.randomInt` para posição e espera) — não integra fila real de lotes.

#### Funcionalidade
- Encadeamento de chutes em lote e validação de integridade local funcionam no modelo atual.
- Idempotência de chute: `X-Idempotency-Key` com cache em memória (`IDEMPOTENCY_TTL_MS`).

#### Lacunas
- “Probabilidade” descrita em `batchConfigs` não corresponde a sorteio independente por chute no V1 — o gol ocorre no **último** slot do lote para valor R$ 1.
- Fila distribuída / multinstância: **não há** persistência de lote entre processos.

#### Riscos técnicos
- **Reinício do processo** ou **várias máquinas** Fly: lotes e cache de idempotência ficam inconsistentes entre instâncias.
- Idempotência é **por processo** (Map em RAM).

#### Riscos de produto
- Comunicação de “chance X%” pode **não refletir** a experiência real (gol no 10º chute do lote de R$ 1).

#### Impacto na V1
- **IMPORTANTE** para escala e honestidade de comunicação; **NÃO BLOQUEIA** demo com instância única e narrativa alinhada ao código.

#### Recomendação
- **Manter** para demo técnica se expectativa estiver alinhada ao determinismo.
- **Ajustar antes da V1** comercial se marketing exigir sorteio i.i.d. ou fila global.
- **V2:** persistência de lotes, fila real, multinstância.

---

### BLOCO C — AUTENTICAÇÃO

#### Estado atual
- `POST /api/auth/register`, `POST /api/auth/login` (bcrypt + JWT `expiresIn: '24h'`), recuperação de senha, `authenticateToken` em rotas sensíveis.
- `express-rate-limit`: `authLimiter` em `/api/auth/` e `/auth/`; limite global com `skip` para `/api/auth/` no limiter global (o específico ainda se aplica).
- Compatibilidade: `POST /auth/login`, `GET /usuario/perfil`.

#### Funcionalidade
- Login/registro com Supabase; token JWT nas rotas protegidas analisadas.

#### Lacunas
- `config/system-config.js` define `requireEmailVerification: true`; o login **não bloqueia** por `email_verificado` (não verificado no fluxo de login lido).
- Endpoint **`GET /api/debug/token`** (sem `authenticateToken`): aceita Bearer, decodifica JWT e retorna **payload** em JSON — superfície de informação e depuração em ambiente exposto.

#### Riscos técnicos
- Exposição de `/api/debug/token` em produção: vazamento de claims (`userId`, `email`) e facilitação de engenharia.
- Token em `localStorage` (frontend) — risco padrão XSS (mitigação depende do front; não auditado em profundidade aqui).

#### Riscos de produto
- Contas sem e-mail verificado podem operar se o produto exigir verificação.

#### Impacto na V1
- **IMPORTANTE** (debug endpoint); **NÃO BLOQUEIA** demo fechada se URL não estiver pública ou estiver bloqueada por gateway (não evidenciado no código).

#### Recomendação
- **Ajustar antes da V1** pública: remover ou proteger `/api/debug/token`.
- **V2:** enforcement de e-mail verificado se for requisito legal/negócio.

---

### BLOCO D — SISTEMA DE SALDO

#### Estado atual
- Fonte da verdade: `usuarios.saldo` no Supabase.
- Shoot: atualização com **lock otimista** `.eq('saldo', user.saldo)`.
- PIX: crédito no webhook/reconciliação sem o mesmo padrão de lock.

#### Funcionalidade
- Leitura de saldo no perfil e após chute (`novoSaldo` na resposta); frontend `GameService` atualiza `userBalance` com o retorno do shoot.

#### Lacunas
- **Perfil** não inclui `total_gols_de_ouro` no JSON de `GET /api/user/profile`, enquanto `GameFinal.jsx` lê `d.total_gols_de_ouro` — tende a **0** sempre.
- **Shoot** não atualiza `total_apostas` / `total_ganhos` (e possivelmente gols) no mesmo handler — estatísticas da conta podem ficar **desatualizadas** em relação aos `chutes` gravados.
- Dois fluxos de crédito PIX (webhook vs reconcile) podem interagir com o mesmo pagamento — depende de idempotência de status em `pagamentos_pix`.

#### Riscos técnicos
- Divergência **saldo vs somatório de movimentos** sem ledger completo dificulta auditoria.
- Inconsistência **HUD / perfil** vs atividade real.

#### Riscos de produto
- Utilizador percebe números “errados” no painel.

#### Impacto na V1
- **IMPORTANTE** para confiança; **NÃO BLOQUEIA** gameplay se o saldo exibido pós-chute estiver correto.

#### Recomendação
- **Ajustar antes da V1** se a HUD prometer totais confiáveis.
- **V2:** ledger e reconciliação formal.

---

### BLOCO E — GAMEPLAY

#### Estado atual
- Backend: `POST /api/games/shoot` — validação de direção `VALID_DIRECTIONS`, aposta R$ 1, lote, prêmios fixos (gol: R$ 5; Gol de Ouro global: +R$ 100 quando `contadorChutesGlobal % 1000 === 0`), insert em `chutes`, `saveGlobalCounter` → `metricas_globais`.
- Frontend: `GameFinal.jsx` + `gameService.processShot` → `POST /api/games/shoot` com `X-Idempotency-Key`, `amount: 1`.

#### Funcionalidade
- Contrato alinhado (direção, valor 1, saldo, resultado). Animação e feedback são tratados no front (não revalidados por testes nesta auditoria).

#### Lacunas
- **Gol de Ouro:** condição global depende de `contadorChutesGlobal` no servidor; com **métricas/endpoint** inconsistentes (ver BLOCO I e D), o HUD inicial pode mostrar “chutes até Gol de Ouro” incorreto até haver sincronização (há edge case em `getShotsUntilGoldenGoal` quando contador é 0 — retorno 0 em certa condição).
- `GET /api/metrics` **força** `totalChutes` e `ultimoGolDeOuro` para **0** mesmo quando existem linhas em `metricas_globais` (`server-fly.js`).

#### Riscos técnicos
- Falha ao inserir `chutes` após débito de saldo: código tenta reverter saldo e estado do lote — risco de estado parcial sob falhas extremas.
- Contador global: consistência com múltiplas instâncias não garantida (memória + DB).

#### Riscos de produto
- Expectativa de “próximo Gol de Ouro” pode falhar se o jogador confiar apenas no número vindo de `/api/metrics`.

#### Impacto na V1
- **IMPORTANTE** para UX de métricas; **CRÍTICO** apenas se promessa comercial depender de contador global exato na UI.

#### Recomendação
- **Ajustar** endpoint `/api/metrics` ou HUD para uma única fonte de verdade (ex.: valores reais de `metricas_globais` sem zerar).
- **V2:** contador distribuído ou serviço dedicado.

---

### BLOCO F — INTERFACE

#### Estado atual
- `/game` usa `GameFinal.jsx`, `game-scene.css`, `game-shoot.css`; rotas protegidas em `App.jsx`; shell com `InternalPageLayout` (referenciado no projeto).
- Vários componentes alternativos de jogo (`GameShoot`, fallbacks, testes) coexistem; rota principal de produção aponta para `GameFinal`.

#### Funcionalidade
- Per relatórios internos já citados pelo time (BLOCO F validado), e estrutura de layout estável no código atual.

#### Lacunas
- Múltiplas páginas de jogo no repositório podem gerar confusão operacional se builds alternarem rotas.

#### Riscos técnicos
- Baixo para o caminho `/game` → `GameFinal` se o deploy for esse.

#### Riscos de produto
- Baixo se apenas uma rota for usada na V1.

#### Impacto na V1
- **NÃO BLOQUEIA** (assumindo `/game` + `GameFinal` como canônico).

#### Recomendação
- **Manter**; documentar internamente qual rota é oficial na V1.

---

### BLOCO G — FLUXO DO JOGADOR

#### Estado atual
- Fluxo: Login → rotas protegidas → Dashboard / Jogo / Perfil / Saque / Pagamentos (`App.jsx`).
- `ProtectedRoute` redireciona sem token para `/`.
- `GameFinal`: init com perfil + `gameService.initialize()`; toasts em erro de init.

#### Funcionalidade
- Jornada básica coberta pelo roteamento e auth.

#### Lacunas
- Saque sem débito (BLOCO A) quebra a **confiança** no fluxo “ganhei → saco” se o botão de saque estiver ativo.
- `total_gols_de_ouro` / totais no HUD podem não refletir backend (BLOCO D).

#### Riscos técnicos
- Dependência de `VITE_ANALYTICS_BEACON_URL` para beacon (opcional).

#### Riscos de produto
- Frustração se saldo de estatísticas divergir; fraude/percepção se saque parecer confirmado sem bloqueio de valor.

#### Impacto na V1
- **IMPORTANTE** onde o produto prometer saques ou estatísticas precisas.

#### Recomendação
- **Ajustar** fluxo de saque ou desabilitar na V1; alinhar cópia da HUD com dados reais.

---

### BLOCO H — ECONOMIA E RETENÇÃO

#### Estado atual
- Prêmios fixos no shoot (R$ 5 gol, bônus Gol de Ouro R$ 100).
- Login: se `saldo === 0 || null`, tentativa de setar `calculateInitialBalance('regular')` — em `system-config` o saldo inicial regular é **0** (não é “bônus” por código além de zerar inconsistências).
- Analytics: `goldeouro-player/src/utils/analytics.js` — `sendBeacon` opcional; `routes/analyticsIngest.js` — `POST` loga evento, sem auth.
- `POST /api/analytics` está no **skip** do rate limit global (`req.path === '/api/analytics'` — verificar path real: router montado em `/api/analytics`, POST `/` → path pode ser `/` relativo ao mount; o skip no código usa `req.path === '/api/analytics'` que pode **não** coincidir com `/api/analytics/` — risco de rate limit em beacon dependendo de como Express normaliza `req.path`).

#### Funcionalidade
- Instrumentação mínima e não bloqueante conforme comentários no front.

#### Lacunas
- Sem sistema de missões, níveis ou economia avançada no caminho principal analisado.
- Retenção depende do loop de jogo + saldo, não de features de progressão complexas.

#### Riscos técnicos
- Endpoint de ingestão pública: abuso de volume (spam de logs) se não houver limite dedicado (não analisado em profundidade).

#### Riscos de produto
- Baixa diferenciação de retenção além do core.

#### Impacto na V1
- **NÃO BLOQUEIA** se a V1 for MVP de jogo + pagamento.

#### Recomendação
- **Mover para V2** gamificação pesada; **manter** analytics mínimo.

---

### BLOCO I — ESCALABILIDADE

#### Estado atual
- **Rate limit:** global + `authLimiter`; Helmet, CORS allowlist + previews `.vercel.app`, compressão, `trust proxy` 1.
- **Lotes e idempotência** em memória no processo.
- **Webhook + reconciliação** para robustez de PIX.
- **Métricas:** `GET /api/metrics` com bug lógico (zera contadores); `metricas_globais` carregada no startup para `contadorChutesGlobal`.

#### Funcionalidade
- Um único processo com um único `Map` de lotes é coerente.

#### Lacunas
- Escalar horizontalmente **sem** shared state para lotes/idempotência **não é suportado** pelo desenho atual.
- Monitoramento avançado no arquivo está **comentado** (trecho `server-fly.js`).

#### Riscos técnicos
- Gargalo de DB e hot paths no shoot; sem evidência de fila externa ou sharding.
- `skip` de rate limit em `/api/auth/` pode precisar revisão se abuso de outros verbos em auth (não expandido aqui).

#### Riscos de produto
- Indisponibilidade ou comportamento estranho sob pico se a infra subir várias instâncias sem sticky sessions.

#### Impacto na V1
- **IMPORTANTE** se Fly ou outro ambiente usar **múltiplas máquinas** para o mesmo serviço.

#### Recomendação
- **V2:** estado de jogo externalizado (Redis/DB), idempotência distribuída, métricas corretas em `/api/metrics`.

---

## 3. Coerência entre blocos

| Eixo | Situação |
|------|----------|
| Frontend ↔ backend (shoot) | Alinhado: R$ 1, direções TL/TR/C/BL/BR, `GameFinal` + `gameService` + `POST /api/games/shoot`. |
| Saldo ↔ jogo | Débito/crédito no shoot com lock; crédito PIX sem lock; saque sem débito — **assimetria**. |
| Auth ↔ rotas | JWT nas rotas sensíveis; rota debug de token **fora** do padrão seguro. |
| Apostas ↔ resultado | Determinístico por posição no lote (V1 valor 1); não é “sorteio independente” por chute. |
| Perfil ↔ HUD | Possível divergência: totais não atualizados no shoot; `total_gols_de_ouro` não exposto no JSON de perfil; métricas globais na API zeradas artificialmente. |

---

## 4. Riscos globais

- **Financeiros:** saque sem reserva de saldo; possível duplicidade de crédito PIX sob corridas/webhooks repetidos; CPF fallback em PIX.
- **Técnicos:** estado de lote em memória; métricas públicas inconsistentes; endpoint de debug JWT; contador global vs múltiplas instâncias.
- **UX:** números de “Gol de Ouro” / totais na HUD podem enganar; narrativa de “chance” vs implementação determinística.
- **Exploração:** múltiplos saques sobre o mesmo saldo (até correção ou processo externo); abuso de analytics beacon se não limitado.

---

## 5. O que está pronto para V1

- Autenticação básica (registro/login/JWT) e rotas protegidas no app.
- Gameplay com backend real: chute, validação, persistência em `chutes`, atualização de saldo com lock otimista no shoot.
- Depósito PIX (Mercado Pago), webhook e reconciliação de pendentes.
- CORS, Helmet, rate limits (com ressalvas), health/ready.
- UI de jogo na rota `/game` com `GameFinal` e integração via `gameService`.
- Analytics mínimo (beacon opcional + ingestão log).

---

## 6. O que NÃO está pronto (mas não bloqueia)

- Gamificação e retenção avançadas (BLOCO H “completo”).
- Fila real de jogadores (`/api/fila/entrar` é compatibilidade simulada).
- Métricas/relatórios executivos completos (parte comentada em monitoramento).
- Alinhamento perfeito HUD/estatísticas com o banco.

---

## 7. O que NÃO pode ir para produção (sem mitigação)

- **Saque com dinheiro real** no modelo atual (sem reserva/debito alinhado ao pedido), **a menos que** processo operacional externo garanta controle e a UI deixe claro que é “solicitação”.
- **`GET /api/debug/token` exposto** publicamente em ambiente de produção.
- **Escalar para várias instâncias** sem mover estado de lote/idempotência para armazenamento compartilhado.

---

## 8. Classificação final

**PRONTO COM RESSALVAS**

Motivo: núcleo jogável e PIX estão implementados; riscos financeiros e de consistência (saque, métricas, estatísticas, debug, multinstância) impedem classificação “pronto” sem qualificação explícita para sócios e para tráfego real.

---

## 9. Plano de ação mínimo (antes de mostrar para sócios)

1. **Decidir escopo da V1:** saque **desligado** ou **ajustado** com reserva de saldo (ou processo operacional claro e aceito).
2. **Desativar ou restringir** `GET /api/debug/token` em qualquer host público.
3. **Corrigir ou documentar** `GET /api/metrics` (não zerar contadores reais) ou remover dependência do HUD até corrigir.
4. **Alinhar narrativa** (probabilidade vs último chute do lote) e **copiar** da HUD com o que o backend garante.
5. **Confirmar deploy single-instance** ou aceitar risco de lotes até evolução em V2.

---

## Respostas diretas (objetivo desta auditoria)

| Pergunta | Resposta |
|----------|----------|
| Podemos mostrar o produto para sócios? | **Sim**, como **demo** com ressalvas explícitas (saque, métricas, escala). |
| Existe risco financeiro? | **Sim:** principalmente **saque sem débito** e **crédito PIX** sem o mesmo rigor de concorrência do shoot. |
| Existe risco de quebra? | **Sim** sob **múltiplas instâncias** ou **picos** em endpoints não limitados como se espera; e inconsistência de dados na UI. |
| O jogo funciona de ponta a ponta? | **Sim** no caminho login → `/game` → chute → saldo atualizado, com base no código. |
| O que precisa ser feito antes da V1? | Itens da seção **9**; tratar saque e superfície de debug como prioritários se houver dinheiro real. |

---

*Fim do relatório.*
