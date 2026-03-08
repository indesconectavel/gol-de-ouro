# BLOCO D — Saldo / Perfil / Pagamentos — Validação e Relatório

**Projeto:** Gol de Ouro  
**Data:** 08/03/2026  
**Branch:** `feature/bloco-d-balance-profile-payments`  
**Base:** `main` (commit b66867f)  

---

## 1. Objetivo do BLOCO

Garantir que o sistema de saldo, perfil e pagamentos do jogador esteja estável, previsível, seguro e consistente com o backend: carregamento e exibição corretos de perfil e saldo, restauração após refresh, páginas `/profile` e `/pagamentos` com loading/erro tratados, sem saldo/perfil quebrados (undefined, null, NaN).

---

## 2. Arquivos alterados

| Arquivo | Alteração |
|--------|-----------|
| `goldeouro-player/src/contexts/AuthContext.jsx` | Restauração de sessão com `payload?.data ?? payload`; logout remove `userData` |
| `goldeouro-player/src/pages/Profile.jsx` | Saldo/números seguros (Number(...)\|\|0); estado de erro e "Tentar novamente"; exibição segura de saldo; loading/erro explícitos |
| `goldeouro-player/src/pages/Pagamentos.jsx` | `useEffect` com deps `[]`; estado `loadingDados` e `erroDados`; uso de `data?.payments`; valor/data seguros na tabela; "Tentar novamente" em erro |
| `goldeouro-player/src/pages/Dashboard.jsx` | Saldo do perfil como número seguro; histórico PIX de `data.payments` mapeado para formato da lista; remoção de fallback fake; exibição de saldo com `(Number(balance)\|\|0).toFixed(2)` |

---

## 3. Ajustes realizados

- **AuthContext:** Ao restaurar sessão, usar `response.data.data` (com fallback `payload`) para que o estado `user` seja o objeto de perfil e não o wrapper `{ success, data }`. Logout remove também `userData` do localStorage.
- **Profile:** Inicial state sem "Carregando..." em nome/email para evitar exibição enganosa. Carregamento usa `Number(saldo/total_apostas/total_ganhos) || 0` para evitar NaN. Em erro, exibir mensagem "Erro ao carregar perfil" e botão "Tentar novamente" em vez de dados fake. Exibição de saldo com `(Number(user.balance) || 0).toFixed(2)`. Nome/email/data com fallbacks para loading e vazio.
- **Pagamentos:** `useEffect` apenas `[]` para evitar loop (removido `carregarDados` das deps). Estado `loadingDados` e `erroDados`; em erro da API, setar lista vazia e mensagem com "Tentar novamente". Histórico usa `data?.payments || []`. Na tabela, valor com `(Number(pagamento.amount) || 0).toFixed(2)` e data com `created_at ? formatarData(...) : '—'`.
- **Dashboard:** Saldo do perfil como `Number(profileResponse.data.data.saldo) || 0`. Histórico de apostas recentes a partir de `pixResponse.data.data.payments`, mapeado para o formato esperado (valor, data, status, tipo). Em erro de load, não usar usuário fake; setar `user` null e saldo 0. Exibição do saldo com `(Number(balance) || 0).toFixed(2)`.

---

## 4. Validação no preview

- Build do frontend: **OK**.
- No preview da branch, validar: perfil carrega após login e após refresh; saldo exibido corretamente e nunca undefined/null/NaN; `/profile` mostra dados e saldo corretos, loading e erro tratados; `/pagamentos` carrega histórico, mostra loading e erro com "Tentar novamente"; refresh mantém perfil e saldo quando a sessão está válida.

---

## 5. Testes executados

- Build de produção do frontend (`npm run build` em `goldeouro-player`): **OK**.
- Linter nos arquivos alterados: **sem erros**.
- Nenhuma alteração em gameplay, payout worker, apostas, Fly, Vercel, banco ou produção.

---

## 6. Resultado final

- **Branch:** `feature/bloco-d-balance-profile-payments` (a partir de `main`).
- **Arquivos alterados:** AuthContext.jsx, Profile.jsx, Pagamentos.jsx, Dashboard.jsx.
- **Regressões:** Nenhuma identificada no escopo do BLOCO D.
- **Status do BLOCO:** **BLOCO D VALIDADO COM RESSALVAS** — a validação oficial ocorre no preview online da branch; o status só poderá ser "BLOCO D VALIDADO" após confirmação no preview.

Produção permanece congelada; baseline de rollback: FyKKeg6zb.
