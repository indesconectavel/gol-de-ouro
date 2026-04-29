# CORRECAO 3 V1 — CACHE E PERCEPCAO DE SALDO

Data: 2026-04-28  
Modo: Execucao controlada  
Alteracoes apenas no frontend (cliente Axios + invalidacao opcional): **sem mudanca de backend nem regra financeira no servidor.**

## 1. Problema

O `apiClient` aplica cache de 30s (GET nao marcado como `skipCache`) via `utils/requestCache.js`. Perfis PIX e dados de conta podiam parecer **atrasados** em relacao ao servidor apos depósito, chute (fluxos que já invalidam ou refrescam parcialmente) ou saque, gerando **percepção ruim de saldo/extrato**.

## 2. Investigacao — onde o front le saldo/perfil/historico relevante

| Area | Fonte | Observação |
|------|-------|------------|
| Dashboard | `GET API_ENDPOINTS.PROFILE`, `GET PIX_USER` | Saldo da conta + lista PIX historica |
| Perfil (`Profile.jsx`) | `GET .../profile` | Saldo/totais para exibição |
| Saque (`Withdraw.jsx`) | `GET .../profile`, `GET .../withdraw/history` | Saldo antes de sacar + lista |
| Depositos (`Pagamentos.jsx`) | `GET PIX_USER`, polling `GET PIX_STATUS` | Lista e estado do pagamento |
| Auth inicial | `GET .../profile` | Hidratar usuario após token existente |
| Jogo (`GameFinal.jsx`) | Já utilizava `skipCache` + `invalidateCache` após chute | Sem alteração nesta rodada |
| `gameService.loadUserData` | `GET /api/user/profile` | Alimenta `GameShoot`/inicialização via serviço |

## 3. Decisão (menor correção segura)

- **`skipCache: true`** em GETs onde o estado exibido precisa espelhar servidor com prioridade (**perfil, PIX usuario, status PIX**, **historico de saques** onde aplicável).
- **`apiClient.invalidateCache(API_ENDPOINTS.PROFILE)`** e invalidação do mesmo path GET de histórico de saque **após** operações bem-sucedidas que já faziam navegação/refresh (**saque**, **deposito** aprovado, **salvar perfil**) para garantir próximos leitores do cache legado compatíveis.
- **Sem** novo endpoint e **sem** alteração de payloads no backend.

## 4. Arquivos tocados

- `goldeouro-player/src/pages/Dashboard.jsx` — `PROFILE`, `PIX_USER` com `skipCache`.
- `goldeouro-player/src/pages/Profile.jsx` — `PROFILE` com `skipCache`; após PUT de perfil, `invalidateCache(PROFILE)`.
- `goldeouro-player/src/pages/Withdraw.jsx` — `PROFILE`, `WITHDRAW/history` com `skipCache`; após saque ok, invalida PROFILE + historia e **refetch** (`loadUserData` + `loadWithdrawalHistory`) em vez de depender apenas de atualização otimista.
- `goldeouro-player/src/pages/Pagamentos.jsx` — `PIX_USER` e poll `PIX_STATUS` com `skipCache`; em aprovação, invalida PROFILE + `carregarDados()` (lista PIX fresh).
- `goldeouro-player/src/contexts/AuthContext.jsx` — bootstrap com token: `PROFILE` com `skipCache`.
- `goldeouro-player/src/services/gameService.js` — **somente** `loadUserData()`: `GET /api/user/profile` com `skipCache` (lógica de `processShot`/chute **inalterada** em relação ao commit base).
- `goldeouro-player/src/utils/dashboardTest.js` — testes de dev alinhados a leituras fresh (profile/PIX).

## 5. O que não foi alterado

- Backend, rotas REST, Ledger, criacao PIX, webhook, shoot apply.
- Cálculos de valor de saque/fees no servidor.
- `GameFinal.jsx` (já tratado antes).

## 6. Validacao

- Diff restrito a arquivos listados + este relatorio (quando incluido ao commit posterior).
- Sem commit / sem deploy no escopo da tarefa de implementacao inicial.

## 7. Risco final por area

| Area | Risco | Justificativa |
|------|--------|----------------|
| Frontend | Baixo | Comportamento de rede explícito; mais requests quando usuario abre telas críticas. |
| UX | Baixo-benefício | Dados monetários menos “fantasma”. |
| Financeiro | Muito baixo | Nenhuma regra de servidor alterada; só evita ler resposta GET em cache. |
| Backend | Nulo | Nenhum arquivo servidor modificado |
