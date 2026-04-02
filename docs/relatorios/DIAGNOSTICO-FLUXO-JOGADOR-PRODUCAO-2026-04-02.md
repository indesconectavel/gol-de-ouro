# DIAGNÓSTICO COMPLETO — FLUXO DO JOGADOR EM PRODUÇÃO

**Projeto:** Gol de Ouro  
**Modo:** leitura de código, documentação e evidências públicas de runtime (sem alteração de aplicação).  
**Data do relatório:** 2026-04-02  
**Ambiente operacional citado pelo time:** `https://app.goldeouro.lol/dashboard`

---

## 1. Resumo executivo

O fluxo **depósito PIX → saldo → chute** foi validado manualmente em produção. As duas pendências relatadas (**aviso de saldo insuficiente após esgotar o saldo** e **bloco “Apostas Recentes” no dashboard**) são **explicáveis por inconsistências de contrato e de atualização de estado no código atual do repositório**, não apenas por “falta de deploy”.

**Achado crítico A (saldo / UX pós-chute):** no backend (`server-fly.js`), o campo `novoSaldo` só é anexado à resposta de `POST /api/games/shoot` quando o resultado é **gol** (`isGoal`). Em **defesa (miss)** o saldo é alterado no banco (comentários indicam gatilho/subtração), mas a resposta **não devolve o saldo atualizado**. O `gameService.js` propaga `result.novoSaldo` para `newBalance`; em `GameFinal.jsx`, `newBalance` cai no fallback `?? balance`, **mantendo o saldo antigo na UI**. Com isso, `balance < betAmount` nunca se torna verdadeiro após um chute “perdido” que zera o saldo — logo o banner “Você precisa adicionar créditos para jogar.” **não aparece**, e o jogador pode parecer ainda apto a chutar do ponto de vista do estado React.

**Achado crítico B (Apostas Recentes):** o `Dashboard.jsx` preenche a lista com `pixResponse.data.data.historico_pagamentos`. O endpoint `GET /api/payments/pix/usuario` em `server-fly.js` retorna `data: { payments, total }` — **não existe a chave `historico_pagamentos`**. O frontend passa a usar `[]`, exibindo “Nenhuma transação encontrada” ou lista vazia mesmo havendo depósitos na tabela. Além disso, semanticamente o bloco mistura **depósitos PIX** com o rótulo **“Apostas Recentes”**; chutes gravados em `chutes` não são consumidos por essa tela.

**Produção vs repositório:** o commit exato do bundle em produção **não foi obtido** (exige painel Vercel ou metadado de build). Há evidência de runtime: o HTML de `https://app.goldeouro.lol/` referencia o bundle `assets/index-brxfDf0E.js` (idêntico em `https://www.goldeouro.lol/` na verificação desta data). O HEAD local do repositório no momento da análise foi `b66867f` (merge PR #31); **não há prova automática de que produção = esse commit**.

**Base de jogadores (contagem / integridade relacional):** **não auditável neste relatório** sem acesso read-only ao Supabase (SQL ou API com credenciais). Qualquer número de usuários seria hipótese.

---

## 2. Verdade atual da produção

| Evidência | O que comprova |
|-----------|----------------|
| GET ao HTML de `https://app.goldeouro.lol/` (2026-04-02) | Script principal: `src="/assets/index-brxfDf0E.js"` |
| GET ao HTML de `https://www.goldeouro.lol/` (mesma data) | Mesmo hash de bundle (`index-brxfDf0E.js`) |
| Documentação interna (`docs/relatorios/`, workflows) | Player em Vercel (`goldeouro-player`), deploy típico via `main` + `vercel --prod`; backend em Fly (`goldeouro-backend-v2.fly.dev` em `api.js`) |

**O que não foi comprovado:** commit Git, branch ou deployment ID do Vercel ligados a `index-brxfDf0E.js`. Para isso: Vercel → Deployments → Production → “Source” / commit.

**Alinhamento local vs produção:** o repositório local analisado contém a lógica acima (ausência de `novoSaldo` em miss; `historico_pagamentos` no dashboard). Se o bundle em produção for gerado a partir deste estado de código, o comportamento relatado **é esperado**. Se produção estiver defasada, a divergência só pode ser fechada comparando commit do deploy com o HEAD local.

---

## 3. Fluxos auditados

Auditoria baseada em **código-fonte** (`goldeouro-player`, `server-fly.js`) e **documentação** do repositório. Comportamento em produção só onde houve evidência (HTML/bundle).

| Fluxo | O que foi verificado |
|-------|----------------------|
| Cadastro | `Register` + `POST /api/auth/register` (AuthContext) |
| Login | `Login` + `POST /api/auth/login`; token em `localStorage` |
| Sessão | `AuthContext` carrega `GET /api/user/profile` com token; `ProtectedRoute` depende de `user` |
| Dashboard | `Dashboard.jsx`: profile + PIX user |
| Depósito PIX | Rotas em `server-fly.js` (`/api/payments/pix/criar`, webhook) — revisão de estrutura |
| Saldo | Perfil; resposta do shoot; comentários de gatilho no backend |
| Chute | `GameFinal` + `gameService.processShot` + `POST /api/games/shoot` |
| Apostas recentes | Nome da UI vs fonte de dados (PIX `payments`) |
| Saque PIX | `POST /api/withdraw/request`, `GET /api/withdraw/history` (trechos relevantes) |
| Logout | `Dashboard` chama `POST /auth/logout` com body `{ token }` — **rota pode não coincidir** com `api.js` (`/api/auth/logout`) |
| Integridade usuários (BD) | **Não executado** (sem acesso ao banco) |

---

## 4. Achados por bloco

### 4.1 Saldo insuficiente pós-chute

- **FATO:** `GameFinal.jsx` exibe o banner somente se `gamePhase === IDLE && balance < betAmount` (aposta fixa R$ 1).
- **FATO:** Após chute bem-sucedido na API, `setBalance` usa `result.user?.newBalance ?? balance` (`GameFinal.jsx`).
- **FATO:** `gameService.processShot` define `user.newBalance` a partir de `result.novoSaldo` (`gameService.js`).
- **FATO:** Em `server-fly.js`, `shootResult.novoSaldo` só é atribuído dentro de `if (isGoal) { ... }`. Em resultado **miss**, a resposta JSON não inclui `novoSaldo`.
- **HIPÓTESE operacional:** Se o último chute que zerou o saldo foi **defesa**, a UI pode manter `balance === 1` (ou valor anterior), não mostrando o banner nem bloqueando visualmente de forma coerente com o saldo real no banco.
- **RISCO:** `gameService` faz `this.userBalance = result.novoSaldo` sem fallback; em miss pode ficar `undefined`, degradando lógica que depende do singleton.

### 4.2 Apostas recentes (dashboard)

- **FATO:** `Dashboard.jsx` usa `pixResponse.data.data.historico_pagamentos || []`.
- **FATO:** `GET /api/payments/pix/usuario` retorna `data.payments` e `data.total`, não `historico_pagamentos`.
- **FATO:** A UI rotula “Apostas Recentes”, mas a fonte implementada é histórico de **pagamentos PIX**, não a tabela `chutes`.
- **RISCO:** Mesmo corrigindo a chave, o rótulo continua semanticamente enganoso se a expectativa do usuário for “últimas jogadas”.

### 4.3 Autenticação / sessão

- **FATO:** `AuthContext` faz `setUser(response.data)` após profile (`apiClient.get(API_ENDPOINTS.PROFILE)`). A API retorna `{ success, data: { ... campos do usuário } }`. O estado `user` pode ficar como **objeto envelope** `{ success, data }`, não o usuário “flat”.
- **FATO:** `ProtectedRoute` só testa `if (!user)` — qualquer objeto truthy passa.
- **RISCO:** Telas que esperam `user.email` no contexto podem falhar silenciosamente; o dashboard carrega perfil de novo via API, então pode “funcionar” por duplicidade de fonte.

### 4.4 Depósitos PIX

- **FATO:** Endpoint de listagem retorna `payments` (array de linhas `pagamentos_pix`).
- **FATO:** Há tratamento de erro que devolve lista vazia com `success: true` em alguns caminhos — pode mascarar falhas.

### 4.5 Saques PIX

- **FATO:** Existem rotas dedicadas (`/api/withdraw/request`, histórico mapeado em trechos do `server-fly.js`). Documentação antiga (`CHECKLIST-GO-LIVE`) já apontou confusão entre histórico de saque e lista PIX em outras telas — não revalidado em runtime aqui.

### 4.6 Integridade dos usuários (banco)

- **Lacuna:** Sem query ao Supabase, não há contagem, duplicatas, e-mails inválidos ou órfãos.

### 4.7 Inconsistências backend / frontend / local vs produção

- **FATO:** Contrato PIX usuario: `payments` (backend) vs `historico_pagamentos` (frontend).
- **FATO:** Shoot: `novoSaldo` ausente em miss (backend) vs consumo obrigatório no frontend para atualizar saldo.
- **FATO:** Bundle atual em produção identificado por nome de arquivo `index-brxfDf0E.js`; commit Git não amarrado.

---

## 5. FATO vs RISCO vs HIPÓTESE

| Item | Classificação | Detalhe |
|------|---------------|---------|
| Resposta do shoot sem `novoSaldo` em `miss` | **FATO** (código `server-fly.js`) | Linhas do bloco `if (isGoal)` para `novoSaldo`; resposta 200 logo após. |
| Dashboard lê `historico_pagamentos` | **FATO** | `Dashboard.jsx` |
| API PIX usuario retorna `payments` | **FATO** | `server-fly.js` |
| Banner de saldo depende de `balance < 1` em IDLE | **FATO** | `GameFinal.jsx` |
| Produção usa bundle `index-brxfDf0E.js` | **FATO** | Fetch HTML 2026-04-02 |
| Produção está no commit `b66867f` | **HIPÓTESE** | Não verificado no Vercel |
| Saldo na UI fica 1 após miss com saldo 0 no BD | **HIPÓTESE forte** | Segue diretamente dos fatos de contrato |
| AuthContext guarda formato errado de usuário | **RISCO** | `setUser(response.data)` vs formato da API |
| Logout com URL `/auth/logout` vs `/api/auth/logout` | **RISCO** | `Dashboard.jsx` vs `api.js` |

---

## 6. Tabelas, endpoints, arquivos e componentes impactados

### Backend (Fly / `server-fly.js`)

- `POST /api/games/shoot` — lógica de lote, insert em `chutes`, `novoSaldo` só em gol.
- `GET /api/user/profile` — perfil e saldo.
- `GET /api/payments/pix/usuario` — retorno `{ data: { payments, total } }`.
- `POST /api/payments/pix/criar`, `POST /api/payments/webhook` — fluxo de crédito (revisão parcial).
- `POST /api/withdraw/request` — saques.

### Tabelas Supabase citadas no código

- `usuarios` — saldo, totais.
- `chutes` — registro de jogadas.
- `pagamentos_pix` — depósitos.
- `saques` — saques.
- Métricas globais (contador) — leitura/gravação em trechos de métricas.

### Frontend

- `goldeouro-player/src/pages/GameFinal.jsx` — HUD, banner insuficiência, `handleShoot`, `setBalance`.
- `goldeouro-player/src/services/gameService.js` — `processShot`, mapeamento `novoSaldo`.
- `goldeouro-player/src/pages/Dashboard.jsx` — `historico_pagamentos`, bloco Apostas Recentes.
- `goldeouro-player/src/pages/Profile.jsx` — `bettingHistory = []` (placeholder).
- `goldeouro-player/src/contexts/AuthContext.jsx` — sessão inicial.
- `goldeouro-player/src/components/ProtectedRoute.jsx`.
- `goldeouro-player/src/config/api.js` — URLs base e endpoints.
- `goldeouro-player/src/pages/game-scene.css` — estilos do banner (depende de `body[data-page="game"]`, setado em `GameFinal`).

---

## 7. Auditoria da base de jogadores

| Pergunta | Resposta neste relatório |
|----------|---------------------------|
| Quantos jogadores existem? | **Não determinado.** Requer SQL no Supabase ou ferramenta com credencial read-only. |
| Estado geral dos cadastros? | **Não verificado.** |
| Duplicatas, e-mail inválido, saldo inconsistente, órfãos? | **Não verificado.** |
| Riscos operacionais? | **Indeterminado** sem dados; o código mostra pontos de fragilidade de contrato (PIX/shoot) que podem afetar **qualquer** usuário, independentemente da contagem. |

---

## 8. Causa provável das pendências atuais

### Por que o aviso de saldo insuficiente não apareceu (cenário “último chute zerou o saldo” em defesa)?

**Causa provável principal:** ausência de `novoSaldo` na resposta do backend para `result === 'miss'`, combinada com o fallback `?? balance` no frontend, **preservando saldo obsoleto**. O banner e o bloqueio lógico (`balance < betAmount`) não disparam se a UI ainda mostra R$ 1,00.

**Causa secundária possível:** deploy antigo sem `GameFinal` / banner — **não comprovado**; o bundle atual em `app` foi identificado, mas não foi inspecionado o conteúdo minificado para strings.

### Por que “Apostas Recentes” não exibiu corretamente?

**Causa provável principal:** desalinhamento de contrato — frontend lê `historico_pagamentos`, backend envia `payments` → array efetivo vazio na UI.

**Causa conceitual:** a seção não consulta `chutes`; mesmo com PIX corrigido, “apostas” no sentido de jogadas exigiria outro endpoint ou mapeamento.

---

## 9. Evidência suficiente para agir?

**SIM**, para uma **pré-execução / cirurgia focada** nos dois eixos:

1. **Contrato do shoot:** retornar saldo atualizado em **todos** os resultados de chute **ou** o frontend deve buscar `GET /api/user/profile` após cada jogada (preferência de produto: um único contrato estável).
2. **Contrato do dashboard:** alinhar `Dashboard.jsx` ao payload real (`payments`) e definir se a lista deve ser PIX, chutes ou ambos (produto).

**NÃO** para afirmar contagens ou integridade da base sem acesso ao banco.

---

## 10. Escopo recomendado da próxima cirurgia (sem implementação aqui)

1. Backend `POST /api/games/shoot`: incluir `novoSaldo` (ou saldo final explícito) para **miss** e **goal**, sempre consistente com `usuarios.saldo` após a jogada.
2. Frontend `gameService` / `GameFinal`: após shoot, se saldo não vier na resposta, **refetch do profile** ou rejeitar resposta incompleta.
3. `Dashboard.jsx`: ler `data.payments` (ou renomear no backend para compatibilidade) e mapear campos (`valor`/`amount`, `status`, datas) para a UI.
4. Renomear ou duplicar seção: “Apostas Recentes” vs “Pagamentos recentes” / adicionar lista de chutes se produto exigir.
5. `AuthContext`: armazenar `response.data.data` como usuário ou normalizar formato.
6. Revisar `Dashboard` logout URL vs `API_ENDPOINTS`.
7. Opcional: validar no Vercel que o deployment de produção corresponde ao commit esperado após correções.

---

## 11. Classificação final

**PRODUÇÃO FUNCIONAL COM RESSALVAS** — fluxo financeiro básico e chute podem operar, porém há **inconsistências de contrato** (saldo pós-miss e lista do dashboard) que explicam falhas de UX e de dados exibidos, com risco de decisões do jogador baseadas em **saldo desatualizado na tela**.

---

## 12. Conclusão objetiva

| Pergunta | Resposta |
|----------|----------|
| O que já funciona? | Depósito com crédito, chute com API real, rota `/game` com `GameFinal`, HTML de produção servindo bundle consistente entre `app` e `www`. |
| O que não funciona bem? | Atualização de saldo na UI após defesa sem `novoSaldo`; lista “Apostas Recentes” por chave errada; rótulo vs significado dos dados. |
| O que corrigir primeiro? | Contrato `novoSaldo` / refresh de saldo + alinhamento `payments` ↔ dashboard. |
| Avançar para Pré-execução? | **Sim**, para os itens de escopo acima; **não** para auditoria de BD sem ferramentas. |

---

### Referências de arquivo (trechos analisados)

- `goldeouro-player/src/pages/GameFinal.jsx` — `handleShoot`, `setBalance`, banner `hud-insufficient-balance-banner`.
- `goldeouro-player/src/services/gameService.js` — `processShot` / `result.novoSaldo`.
- `server-fly.js` — `POST /api/games/shoot` (montagem de `shootResult` e `novoSaldo` apenas em gol); `GET /api/payments/pix/usuario`.
- `goldeouro-player/src/pages/Dashboard.jsx` — `historico_pagamentos`.

---

*Relatório gerado em modo somente leitura sobre o repositório, com uma verificação pontual de HTML em produção (nome do bundle JS).*
