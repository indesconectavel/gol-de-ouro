# CORRECAO 2 V1 — DASHBOARD SEMÂNTICO / DEPÓSITOS RECENTES

Data: 2026-04-28  
Modo: Execução controlada  
Escopo: `goldeouro-player/src/pages/Dashboard.jsx` (sem alteração de backend nem rotas financeiras)

## 1. Investigacao

### 1.1 Onde o Dashboard renderizava “Apostas Recentes”

- Arquivo: `goldeouro-player/src/pages/Dashboard.jsx`
- Titulo da secao: **Apostas Recentes**

### 1.2 Endpoint que alimentava a secao

- Constante: `API_ENDPOINTS.PIX_USER`
- Caminho efetivo: **`GET /api/payments/pix/usuario`** (via `apiClient`; `api.js` define `PIX_USER: '/api/payments/pix/usuario'`)

### 1.3 Dados utilizados

- Resposta esperada: `data.historico_pagamentos`
- Cada linha exibia `valor`, `data`, `status`, `tipo` — formato de **historico PIX / deposito**, nao de chute/aposta de jogo

### 1.4 Endpoint de chutes recentes

- No backend existe **`GET /api/games/chutes/recentes`** (autenticado), retornando `{ success, data: { items: [...] } }` com campos de `chutes` (`valor_aposta`, `resultado`, etc.)
- Nao foi integrado nesta correção para manter **menor risco** e escopo apenas no front conforme prompt

## 2. Decisão (V1 controlada)

**Opcao A — Renomear a secao para refletir a fonte real (historico PIX)**

- **Motivo:** A secao ja usava dados reais corretos (PIX); o problema era **rotulo semantico** (“apostas” vs depositos)
- **Nao:** troca para chutes nesta entrega (evita novo layout/contrato de lista e possiveis regressoes antes de liberacao controlada)
- **Nao:** duas secoes (exigiria segunda chamada e definicao de UX; fora do minimo para V1)

## 3. Alteracoes aplicadas

- Estado `recentBets` renomeado para `recentPixDeposits` (intenção explicita no codigo)
- Titulo **Apostas Recentes** → **Depósitos Recentes**
- Lista vazia: mensagem alinhada a depósitos PIX
- Rodape da caixa: texto que separa **depósitos PIX** de **partidas/jogo** (sem simular dados de chutes)
- **Ver todas →** passa a navegar para **`/pagamentos`** (historico real), em vez de `alert` placeholder
- Comentarios no JSX/documentacao local indicando fonte (`GET .../usuario` → `historico_pagamentos`)

## 4. O que nao foi alterado

- Endpoints de pagamento, saque, ledger, gameplay
- `server-fly.js`, `api.js`, servicos de pagamento
- Comportamento da API PIX (mesma requisicao, mesmos dados)

## 5. Validacao

- Diff restrito a `Dashboard.jsx` + este relatorio
- Sem commit
- Sem deploy

## 6. Risco final

**Baixo.** Mudanca de copia e nomenclatura de estado; mesma chamada autenticada a `/api/payments/pix/usuario`; sem impacto em saldo ou regras financeiras.
