# PRÉ-EXECUÇÃO — FLUXO DO JOGADOR

**Data:** 2026-04-02  
**Base:** `docs/relatorios/DIAGNOSTICO-FLUXO-JOGADOR-PRODUCAO-2026-04-02.md`  
**Modo:** preparação apenas (nenhuma alteração de código nesta etapa).

---

## 1. Escopo da cirurgia

| # | Item | Descrição |
|---|------|-----------|
| 1 | **Saldo após chute (miss)** | Garantir que o cliente receba o **saldo final coerente** após **todo** resultado de `POST /api/games/shoot` (incluindo `miss`), eliminando estado obsoleto na UI e falha do bloqueio / banner de créditos. |
| 2 | **Dashboard — lista vazia** | Corrigir o consumo do payload de `GET /api/payments/pix/usuario` (chave e mapeamento de campos) **e/ou** passar a alimentar o bloco conforme a **decisão de produto** (abaixo). |
| 3 | **Contrato explícito** | Documentar e implementar na mesma entrega o **formato estável** da resposta do shoot e da lista do dashboard, para evitar regressão. |

**Fora do escopo mínimo (evolução):** timeline unificada completa (PIX + chutes + saques) num único bloco — pode ser fase 2 se o esforço for maior que o sprint.

---

## 2. Arquivos impactados

### Backend (produção Fly — `server-fly.js`)

- **`app.post('/api/games/shoot', ...)`** (~linhas 1158–1378): única rota de shoot usada pelo player em produção conforme `api.js` → `goldeouro-backend-v2.fly.dev`.

### Backend (outros — não deploy principal se Fly usa só `server-fly.js`)

- `server-fly-deploy.js` — manter paridade se ainda for usado em algum pipeline.
- `router.js` / `router-database.js` — **não** são o servidor documentado para o player atual; alinhar apenas se o repositório os deploya.

### Frontend

- `goldeouro-player/src/services/gameService.js` — `processShot`, uso de `result.novoSaldo`.
- `goldeouro-player/src/pages/GameFinal.jsx` — `setBalance`, fallback `?? balance`, banner `balance < betAmount`.
- `goldeouro-player/src/pages/GameShoot.jsx` — também chama `gameService.processShot` (rota `/gameshoot`); deve se beneficiar do mesmo contrato.
- `goldeouro-player/src/pages/Dashboard.jsx` — `historico_pagamentos`, renderização (`valor`, `data`, `status`, `tipo`).
- `goldeouro-player/src/services/apiClient.js` — **risco de cache** em GET (30s) para `/api/user/profile`; pode exigir invalidação ou bypass após shoot se a estratégia for “refetch perfil”.

### Testes

- `tests/endpoints-criticos.test.js` — expectativas sobre `POST /api/games/shoot` e `GET /api/payments/pix/usuario` (ajustar se o contrato mudar).

---

## 3. Contratos atuais

### 3.1 `POST /api/games/shoot`

**Resposta de sucesso (hoje):** `200` com `{ success: true, data: shootResult }`.

**`shootResult` inclui:** `loteId`, `direction`, `amount`, `result`, `premio`, `premioGolDeOuro`, `isGolDeOuro`, `contadorGlobal`, `timestamp`, `playerId`, `loteProgress`, `isLoteComplete`, etc.

**`novoSaldo`:** definido **apenas** dentro de `if (isGoal) { ... }` após `update` manual em `usuarios` (`server-fly.js`). Em **`miss`**, não há `novoSaldo` na resposta; comentários no código indicam que o ajuste de saldo em derrota pode ocorrer via **lógica de banco (gatilho)** sobre `chutes` / `usuarios`.

**Consumidores conhecidos:** `gameService.processShot` no player (`GameFinal`, `GameShoot`). Não há outro app móvel no repositório consumindo essa rota; scripts de teste e auditoria são os demais consumidores.

### 3.2 `GET /api/payments/pix/usuario`

**Resposta:** `{ success: true, data: { payments: [...], total: n } }`.

**Frontend:** `Dashboard.jsx` usa `data.historico_pagamentos` — **chave inexistente** → lista efetiva vazia.

### 3.3 Registros PIX (`pagamentos_pix`)

Campos típicos (schema em `docs/configuracoes/GUIA-EXECUCAO-SCHEMA-SUPABASE.md` + inserts em `server-fly.js`): `valor`, `amount`, `status`, `created_at`, etc. A UI do dashboard espera `bet.valor`, `bet.data`, `bet.status`, `bet.tipo` — **não batem** com os nomes crus da linha (`created_at` vs `data`, `status` Mercado Pago vs `'processado'`).

---

## 4. Contratos propostos

### 4.1 Shoot — saldo sempre que `success: true`

**Proposta:** incluir **`novoSaldo`** (ou `saldo_atual`) em **toda** resposta `success: true` de `POST /api/games/shoot`, refletindo o saldo em `usuarios` **após** a jogada concluída (inserção em `chutes` e efeitos de gatilho/atualização).

**Implementação sugerida (para análise na cirurgia):** após processar o chute e possíveis gatilhos, executar **`SELECT saldo` (ou `.single()` em `usuarios`)** para o `req.user.userId` e atribuir ao objeto de resposta. Isso reduz divergência entre o que o servidor calculou em memória no início e o saldo real no banco após triggers.

**Compatibilidade:** adicionar campo **não remove** campos existentes — clientes antigos que ignoram `novoSaldo` continuam iguais; clientes novos passam a usar sempre o valor final.

### 4.2 PIX usuario — compatibilidade com o frontend

**Opção mínima (sem novo endpoint):**  
- Backend continua com `payments`, mas pode **adicionar** `historico_pagamentos` como alias para o mesmo array (deprecated) **ou** o frontend passa a usar `payments` apenas.

**Proposta recomendada:** frontend usa **`data.payments`**; opcionalmente o backend envia também `historico_pagamentos: payments` por uma versão para não quebrar nada externo.

### 4.3 Dashboard — mapeamento de linha PIX para a UI

Se a lista for PIX, mapear no front:  
`valor` ← `valor` ou `amount`;  
`data` ← `created_at` formatado;  
`status` ← normalizar para exibição (ex.: `approved`/`approved` vs label “processado”);  
`tipo` ← fixar `"PIX"` / `"Depósito"` ou campo do banco se existir.

---

## 5. Decisão de produto (dashboard)

### Opções

| Opção | Conteúdo do bloco principal de “atividade” no dashboard |
|-------|--------------------------------|
| **A** | Apenas depósitos PIX |
| **B** | Apenas chutes (jogadas) |
| **C** | Timeline completa (PIX + chutes + saques) |

### Decisão tomada (obrigatória): **B — Apenas chutes**

**Justificativa técnica e de produto:**

1. **Rótulo da UI:** o bloco chama-se **“Apostas Recentes”** — semanticamente corresponde a **jogadas/apostas** (`chutes`), não a recarga de saldo (PIX).
2. **Dados já persistidos:** o backend já insere em **`chutes`** em todo shoot (`server-fly.js`); a fonte de verdade para “últimas apostas” é essa tabela (ou uma view), não `pagamentos_pix`.
3. **Separação de responsabilidades:** depósitos e comprovantes PIX já têm fluxo em **`/pagamentos`** e endpoint dedicado; o dashboard deve mostrar **atividade de jogo**, não duplicar o extrato financeiro de entrada.
4. **Escopo da cirurgia:** evita confundir o usuário com “apostas” que na verdade são só PIX; alinha expectativa com o nome do bloco.

**Implicação:** a cirurgia deve incluir **novo endpoint** (ex.: `GET /api/games/history` ou `GET /api/user/chutes/recentes`) com autenticação, limite (ex.: 10–20), ordenação por data, **ou** estender um endpoint de perfil — a ser definido na implementação, mas **não** reutilizar só `PIX usuario` para esse título.

**Workaround temporário (se o prazo for curto):** renomear o bloco para **“Depósitos PIX recentes”**, usar `payments` + mapeamento — isso seria **Opção A** com rótulo honesto; não substitui a decisão **B** acima, apenas desbloqueia UX até o endpoint de chutes existir.

---

## 6. Riscos identificados

| Risco | Classificação | Notas |
|-------|----------------|-------|
| **Dupla contagem de saldo no gol** (update manual + gatilho) | **ALTO** | O código atual já faz `update` em `usuarios` para **gol**; ao ler saldo final com `SELECT`, deve-se garantir que não há **dupla aplicação** (já é área sensível). Qualquer mudança deve revisar o fluxo gol vs miss. |
| **Saldo inconsistente entre `user.saldo` inicial e pós-trigger** | **MÉDIO** | Usar `SELECT` pós-operação mitiga; confiar só no cálculo `user.saldo - amount` em miss pode divergir do trigger. |
| **Cache GET profile (30s)** após navegação | **MÉDIO** | `apiClient` cacheia GETs; refetch de perfil após shoot pode devolver **saldo antigo** se não invalidar cache ou usar `requestCache.clear()` / query param. |
| **gameService.userBalance = undefined** quando `novoSaldo` ausente | **MÉDIO** | Pode afetar lógica futura que leia o singleton; corrigir com fallback para número ou `SELECT` após resposta. |
| **Dashboard: mapear só `payments` sem renomear bloco** | **BAIXO** (UX) | Lista aparece, mas o título “Apostas” continua enganoso — decisão B exige endpoint de chutes ou renomear. |
| **Status PIX** (`pending` vs `approved` vs `processado`) | **BAIXO** | UI usa `processado`; API pode usar outro enum — cores/labels errados até normalizar. |
| **Testes automatizados** desatualizados | **BAIXO** | Ajustar asserts de JSON. |

---

## 7. Dependências críticas

### Banco de dados

- **`usuarios.saldo`:** campo de saldo atual (fonte de verdade para exibição).
- **`chutes`:** insert em todo shoot; possíveis **triggers** que alteram saldo em `miss` (conforme comentários em `server-fly.js` — validar no Supabase).
- **`transacoes`:** referenciada em schema; relação com PIX e fluxo financeiro — shoot pode não gravar linha em `transacoes` por jogada (verificar política atual).
- **`pagamentos_pix`:** apenas depósitos; não lista chutes.

### API

- **Idempotência:** shoot já usa header `X-Idempotency-Key` no cliente; não alterar semântica.
- **Autenticação:** `authenticateToken` em shoot e PIX usuario.

### Frontend

- **Estado local** em `GameFinal` (`balance`) vs **gameService.userBalance**.
- **Portal:** `game-overlay-root` em `index.html` — não impacta saldo; apenas anotação.

---

## 8. Plano de rollback

| Camada | Ação |
|--------|------|
| **Backend** | Reverter commit em `server-fly.js`; redeploy Fly (imagem anterior ou `fly releases`). |
| **Frontend** | Reverter commit em `goldeouro-player`; redeploy Vercel ou “Promote to Production” do deployment anterior. |
| **Banco** | **Nenhuma migração obrigatória** prevista para esta cirurgia se apenas respostas HTTP e leituras forem alteradas; **não** alterar triggers sem plano separado. |

**Rollback rápido:** manter deploy anterior no Vercel e no Fly; tempo de propagação típico de minutos.

---

## 9. Segurança para execução

**Seguro para implementar?** **SIM**, desde que:

1. O shoot inclua `novoSaldo` (ou saldo lido após commit) **sem** introduzir dupla cobrança no caso **gol** — **revisão obrigatória** do trecho que atualiza `usuarios` hoje.
2. O dashboard **B** só vá a produção com endpoint de listagem de **chutes** testado (ou workaround A com rótulo renomeado).
3. O cache de GET seja considerado se houver refetch de perfil.

---

## 10. Pendências bloqueantes

| Pendência | Bloqueia? |
|-----------|-----------|
| Confirmar no Supabase o **comportamento exato dos triggers** em `chutes` para `miss` e `goal` | **SIM** para definir se `novoSaldo` deve ser só `SELECT` ou também cálculo explícito em miss. |
| Definir **endpoint e formato** da lista de chutes recentes (paginação, campos) | **SIM** para a decisão de produto **B** sem “gambiarra”. |
| Nenhuma pendência para **correção mínima** do bug de chave `payments` + mapeamento — **não** satisfaz a decisão B sozinha. |

---

## 11. Recomendação final

- **Prosseguir com a cirurgia** em duas **sub-fases** é o mais seguro:
  - **Fase 1 (crítica):** corrigir **`novoSaldo` / saldo final em shoot** para todos os resultados + revisar risco de dupla contagem no gol; ajustar `gameService` + `GameFinal` (e invalidar cache de perfil se aplicável).
  - **Fase 2 (produto B):** novo **GET** de chutes recentes + `Dashboard` consumindo esse endpoint + título “Apostas Recentes” alinhado.
- **Alternativa de menor prazo:** Fase 1 + renomear bloco e usar `payments` mapeado (Opção A com rótulo correto) até **Fase 2** estar pronta.

---

## Anexos (referências rápidas)

- Rota shoot: `server-fly.js` ~1158–1378.  
- PIX usuario: `server-fly.js` ~1885–1976.  
- Diagnóstico: `docs/relatorios/DIAGNOSTICO-FLUXO-JOGADOR-PRODUCAO-2026-04-02.md`
