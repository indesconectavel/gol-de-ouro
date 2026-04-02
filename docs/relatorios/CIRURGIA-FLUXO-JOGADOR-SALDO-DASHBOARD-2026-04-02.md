# CIRURGIA — FLUXO DO JOGADOR

**Data:** 2026-04-02  
**Escopo:** saldo pós-chute (`novoSaldo`), UX de saldo insuficiente, “Apostas Recentes” = chutes.

---

## 1. Resumo executivo

- **`POST /api/games/shoot`:** passa a **falhar com 500** se o insert em `chutes` falhar; em sucesso, **`novoSaldo` é sempre preenchido com `SELECT` em `usuarios.saldo` após** o insert (gatilhos) e o **update manual no caso de gol**. Erro ao ler saldo final também retorna **500**.
- **Player:** `gameService` e `GameFinal` **não** mantêm mais saldo antigo quando `novoSaldo` falta; cache de GET de **`/api/user/profile`** é invalidado após chute bem-sucedido.
- **Dashboard:** “Apostas Recentes” consome **`GET /api/games/chutes/recentes`** e exibe jogadas reais (mapeamento para UI), **sem** `historico_pagamentos` / PIX.

---

## 2. Arquivos alterados

| Arquivo |
|---------|
| `server-fly.js` |
| `goldeouro-player/src/config/api.js` |
| `goldeouro-player/src/services/gameService.js` |
| `goldeouro-player/src/pages/GameFinal.jsx` |
| `goldeouro-player/src/pages/Dashboard.jsx` |
| `goldeouro-player/src/services/apiClient.js` |
| `goldeouro-player/src/utils/requestCache.js` |
| `docs/relatorios/CIRURGIA-FLUXO-JOGADOR-SALDO-DASHBOARD-2026-04-02.md` |

---

## 3. Correções aplicadas no shoot

| Aspecto | Antes | Depois |
|---------|--------|--------|
| **Miss** | `novoSaldo` ausente na resposta | `novoSaldo` = saldo lido do BD após insert + trigger |
| **Goal** | `novoSaldo` = cálculo em memória no branch de gol | Mantido update manual; **`novoSaldo` final** = `SELECT` após update (autoridade do persistido) |
| **Insert `chutes` com erro** | Log + resposta 200 possível | **500** com mensagem clara |
| **Leitura saldo** | N/A em miss | **500** se `SELECT saldo` falhar |

Contrato JSON de sucesso inalterado na forma: `{ success: true, data: { ...campos existentes..., novoSaldo: number } }`.

---

## 4. Correções aplicadas no frontend do jogo

- **`gameService.processShot`:** valida `novoSaldo`; se inválido, retorna `success: false` com mensagem explícita; `this.userBalance` atualizado só com número válido.
- **`GameFinal`:** `setBalance` usa apenas `result.user.newBalance` numérico válido; **sem** `?? balance`.
- **`apiClient`:** resposta **POST** 200 em `/api/games/shoot` com `success` chama `requestCache.invalidatePath('/api/user/profile')`.
- **`requestCache`:** novo método `invalidatePath(fragment)`.

Com isso, após **miss** com saldo 0, a UI recebe **0**, `canShoot` fica falso e o banner de créditos (já existente em `GameFinal`) pode aparecer em fase `IDLE`.

---

## 5. Correções aplicadas no dashboard

- Novo endpoint no backend: **`GET /api/games/chutes/recentes`** (`authenticateToken`, `limit` ≤ 50, ordenação `created_at` desc).
- **`api.js`:** `GAMES_CHUTES_RECENTES: '/api/games/chutes/recentes'`.
- **`Dashboard.jsx`:** removido carregamento de “Apostas Recentes” via PIX; `loadUserData` chama o endpoint de chutes; função `mapChuteToRecentBet` normaliza `id`, data, resultado, valor, prêmio; lista vazia com texto **“Nenhuma jogada ainda”**.

---

## 6. Decisões técnicas adotadas

1. **Saldo canônico:** sempre **`usuarios.saldo` após a jogada**, via **Supabase `.select('saldo').single()`**, alinhado a triggers documentados em `schema-supabase-final.sql` (`update_user_stats` em `AFTER INSERT ON chutes`).
2. **Falhas duras (500)** em persistência/leitura de saldo: preferível a devolver sucesso com contrato incompleto.
3. **Invalidação de cache** só no path do perfil, sem `clear()` global.

---

## 7. Riscos mitigados

- Saldo **obsoleto** na tela após **miss**.
- Banner / bloqueio de chute **incorretos** por `balance` antigo.
- Lista vazia enganosa por chave **`historico_pagamentos`** inexistente no PIX.
- **Profile em cache** após chute sem refletir saldo ao voltar ao dashboard (mitigação por invalidação no shoot).

---

## 8. Riscos remanescentes

- **Drift** entre schema real no Supabase e `schema-supabase-final.sql` (triggers diferentes ou ausentes) pode alterar saldo ou falhar o `SELECT`.
- **RLS** em `chutes`: o cliente do servidor deve usar chave com permissão de leitura/escrita (service role); se a produção usar política restritiva sem bypass, o novo **GET** ou o **insert** podem falhar — exige verificação no ambiente.
- **Dupla lógica gol** (trigger + update Node) permanece; a leitura final do BD **absorve** o estado efetivo, mas anomalias de trigger exigem monitoramento.

---

## 9. Testes mínimos executados

| Teste | Como | Resultado |
|-------|------|-------------|
| **1** Saldo 1 + miss → 0 | Revisão de fluxo código: insert → trigger debita → SELECT | **Lógica OK** (não executado E2E contra Supabase nesta sessão) |
| **2** Saldo 1 + goal → saldo real | insert → trigger credita → update manual → SELECT | **Lógica OK** |
| **3** Dashboard chutes | Endpoint + mapeamento no `Dashboard.jsx` | **Código OK** |
| **4** Escopo | Diff limitado aos arquivos listados | **OK** |
| **Sintaxe** | `node --check server-fly.js` | **PASS** |

---

## 10. Diagnóstico final da cirurgia

**APROVADA COM RESSALVAS** — implementação coerente com a preparação documental; falta **validação em ambiente real** (staging/produção) com usuário de teste e inspeção de triggers live.

---

## 11. Conclusão objetiva

Pode-se seguir para **execução controlada**: commit na branch de trabalho, deploy backend (Fly) e frontend (Vercel), depois verificação manual:

1. Chute com **miss** esgotando saldo → HUD **R$ 0,00** e aviso de créditos.
2. Chute com **gol** → saldo coerente com prêmio.
3. Dashboard → “Apostas Recentes” lista **chutes** após jogar.

**Não** foram alterados PIX, webhook, saque, auth (exceto uso existente do token), admin ou layout amplo fora do necessário.
