# BUG: Saldo aumentando ao abrir /dashboard — Auditoria READ-ONLY

**Data:** 2026-03-05  
**Modo:** READ-ONLY ABSOLUTO (nenhum código alterado).  
**Objetivo:** Identificar com evidência exata por que o saldo aumenta automaticamente quando o usuário abre https://www.goldeouro.lol/dashboard.

---

## 1. Resumo executivo (não técnico)

O dashboard do jogador **não chama nenhuma rota que credite saldo** ao carregar. Ele apenas busca perfil e histórico PIX (somente leitura). Portanto, **o aumento de saldo ao “abrir o dashboard” não é causado diretamente pelo clique na página**.

As causas mais plausíveis são: **(1)** o **reconciler de PIX** (que roda em background a cada 30–60 s) estar creditando o mesmo depósito mais de uma vez se existir **duplicidade** na tabela de pagamentos; **(2)** o usuário interpretar como “aumento” a **atualização do valor na tela** (cache de 30 s no front) quando o saldo já foi creditado antes pelo webhook/reconciler; **(3)** em cenários específicos, a lógica de **“saldo inicial” no login** (quando saldo é 0 ou null), que hoje está configurada para R$ 0,00 — só geraria aumento real se houver override por variável de ambiente.

**Conclusão em uma frase:** O dashboard em si não credita saldo; o aumento persistido é mais provável de vir de **reconciliação de PIX creditando mais de uma vez** (por duplicidade em `pagamentos_pix`) ou de **timing** (reconciler rodando e usuário vendo o valor atualizado ao abrir/recarregar o dashboard). Sem acesso a dados de produção (logs, duplicidade em `pagamentos_pix`), a causa raiz fica **INCONCLUSIVA**; o relatório aponta as travas e o plano cirúrgico para eliminar crédito duplicado e deixar o fluxo auditável.

---

## 2. Repro (passos)

1. Usuário faz login em https://www.goldeouro.lol  
2. Navega para https://www.goldeouro.lol/dashboard (ou já é redirecionado para /dashboard após login)  
3. Observa o saldo exibido (ex.: R$ 0,00)  
4. Após alguns segundos ou ao recarregar/voltar ao dashboard, o saldo aparece maior (ex.: R$ 50,00) **sem** novo depósito PIX pelo usuário  

**Para delimitar se é saldo real ou só visual:**  
- Consultar no backend (por exemplo `GET /api/user/profile` com o mesmo token) antes e depois de “abrir o dashboard” e comparar o campo `saldo` na resposta.  
- Se o valor aumentar entre duas chamadas consecutivas **sem** depósito no intervalo → saldo **persistido** está aumentando (bug no backend/reconcile).  
- Se o valor for o mesmo nas duas chamadas e só a tela mostrar aumento (ex.: por cache ou re-render) → problema **visual** (front/cache).

---

## 3. Hipóteses ranqueadas

| # | Hipótese | Persistido / Visual | Evidência (arquivo:linha) |
|---|----------|---------------------|----------------------------|
| 1 | **Reconciler de PIX credita o mesmo pagamento mais de uma vez** (duplicidade em `pagamentos_pix` ou processamento por id de registro sem garantir unicidade por payment_id/external_id) | Persistido | server-fly.js 2333–2422 (reconcile); 2346–2351 select por `status = 'pending'`; 2384–2410 update por `p.id` e crédito por registro; schemas sem UNIQUE em external_id permitem duplicidade |
| 2 | **Usuário vê “aumento” por timing:** reconcile ou webhook credita em background; ao abrir/recarregar dashboard o front exibe o valor já creditado (cache 30 s pode ter mostrado valor antigo antes) | Visual (persistido já correto) | goldeouro-player/src/pages/Dashboard.jsx 40–41 (GET PROFILE); apiClient cache TTL 30s (requestCache.js); reconcile setInterval 30–60s (server-fly.js 2434) |
| 3 | **Login “saldo inicial”** aplicado em toda sessão (ex.: refresh de token que reexecuta login) e valor > 0 por ENV | Persistido (improvável com config atual) | server-fly.js 948–957 (se saldo 0 ou null → update com calculateInitialBalance('regular')); config/system-config.js 4–8 (initialBalance.regular = 0) — sem override por ENV no código |
| 4 | **Webhook de depósito** processa o mesmo payment_id mais de uma vez (ex.: dois registros em pagamentos_pix para o mesmo id do MP) | Persistido | server-fly.js 2062–2109 (claim por payment_id ou external_id com “exatamente 1 linha”); se houver 2 linhas com mesmo payment_id, update afetaria 2 e claimed ficaria null — webhook não credita nesse caso; mas criação duplicada de registros em outro fluxo poderia deixar 1 linha por vez sendo claimada |
| 5 | **Cache do front** retorna resposta antiga e depois resposta nova; usuário interpreta como “saldo subiu ao abrir dashboard” | Visual | goldeouro-player/src/utils/requestCache.js TTL 30s; Dashboard loadUserData chama PROFILE (apiClient.get), que pode vir do cache |

---

## 4. Evidências (arquivo:linha)

### 4.1 Endpoints usados pelo dashboard (frontend)

| Onde | Arquivo | Linhas | O que faz |
|------|---------|--------|-----------|
| Rota /dashboard | goldeouro-player/src/App.jsx | 44–46 | Renderiza `<Dashboard />` |
| Carregamento inicial | goldeouro-player/src/pages/Dashboard.jsx | 19–33 | useEffect chama `loadUserData()` |
| Busca perfil (saldo) | goldeouro-player/src/pages/Dashboard.jsx | 40–45 | `apiClient.get(API_ENDPOINTS.PROFILE)` → setBalance(data.saldo) |
| Busca PIX | goldeouro-player/src/pages/Dashboard.jsx | 49–54 | `apiClient.get(API_ENDPOINTS.PIX_USER)` (histórico) |
| URL do perfil | goldeouro-player/src/config/api.js | 18 | `PROFILE: '/api/user/profile'` |

**Conclusão:** O dashboard **só** chama GET `/api/user/profile` e GET (PIX_USER). Nenhuma dessas rotas altera saldo no backend.

### 4.2 Backend: rotas de perfil (somente leitura)

| Endpoint | Arquivo | Linhas | Alteração de saldo? |
|----------|---------|--------|----------------------|
| GET /api/user/profile | server-fly.js | 1013–1059 | Não. Apenas SELECT e res.json com user.saldo |
| GET /usuario/perfil | server-fly.js | 3006–3062 | Não. Apenas SELECT e res.json com user.saldo |

**Conclusão:** Nenhum endpoint de perfil credita ou altera saldo.

### 4.3 Backend: onde o saldo é creditado (UPDATE usuarios SET saldo = ...)

| Local | Arquivo | Linhas | Gatilho |
|-------|---------|--------|---------|
| Login “saldo inicial” | server-fly.js | 948–957 | POST /api/auth/login quando user.saldo === 0 \|\| null |
| Webhook depósito (claim) | server-fly.js | 2062–2109 | POST /api/payments/webhook (payment approved) |
| Reconciler PIX | server-fly.js | 2333–2422 (em particular 2383–2416) | setInterval(reconcilePendingPayments, 30–60s) |
| Jogo (prêmio) | server-fly.js | 1352–1355 | Após chute (não é disparado pelo dashboard) |
| Saque (débito) | server-fly.js | 1519–1524 | POST /api/withdraw/request (não é crédito) |

**Por que o reconciler pode aumentar o saldo “sozinho”:**  
- server-fly.js 2346–2351: seleciona registros em `pagamentos_pix` com `status = 'pending'`.  
- 2359–2396: para cada registro, consulta o MP; se status === 'approved', faz update **por `p.id`** (id do registro) com `.neq('status','approved')` e credita o usuário **quando exatamente 1 linha é afetada**.  
- Se existirem **dois ou mais registros** em `pagamentos_pix` para o **mesmo pagamento do Mercado Pago** (mesmo external_id/payment_id), cada um tem `id` diferente. O reconcile processa **cada linha** pendente; na primeira execução credita para o registro 1; na próxima execução o registro 2 continua `pending` e será creditado de novo. **Resultado: mesmo depósito credita duas (ou mais) vezes.**  
- Vários schemas **não** definem UNIQUE em `external_id` ou `payment_id` (ex.: SCHEMA-COMPLETO-FINAL.sql, APLICAR-SCHEMA-SUPABASE-FINAL.sql). O SCHEMA-SUPABASE-CONSOLIDADO-FINAL-v1.2.0.sql tem `external_id VARCHAR(255) UNIQUE NOT NULL` (linha 80). Se em produção a tabela **não** tiver essa constraint, duplicidade é possível.

### 4.4 Login “saldo inicial”

| Arquivo | Linhas | Comportamento |
|---------|--------|----------------|
| server-fly.js | 947–964 | Se `user.saldo === 0 || user.saldo === null`, atualiza `usuarios` com `saldo: calculateInitialBalance('regular')` e loga "Saldo inicial ... adicionado" |
| config/system-config.js | 4–8, 37–38 | `initialBalance.regular = 0`; `calculateInitialBalance('regular')` retorna 0 |

**Impacto:** Em config atual, “saldo inicial” é 0; não aumenta saldo. Só aumentaria se houver override (ex.: ENV) alterando o valor. Não há no código leitura de ENV para initialBalance.

### 4.5 Cache no frontend (possível efeito “visual”)

| Arquivo | Linhas | Comportamento |
|---------|--------|----------------|
| goldeouro-player/src/services/apiClient.js | 44–54, 101–109 | GET usa requestCache; cache hit retorna dados em cache sem nova requisição |
| goldeouro-player/src/utils/requestCache.js | 7, 22–26, 38–48 | defaultTTL 30000 ms; GET /api/user/profile pode ser cacheado 30 s |

**Impacto:** Primeira abertura do dashboard pode mostrar saldo em cache (ex.: 0). Após 30 s, nova chamada busca perfil atual (já creditado pelo reconcile). Usuário vê “aumento” ao recarregar ou navegar — pode ser **só visual** (valor já estava certo no backend).

---

## 5. Diagrama simples do fluxo do saldo

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                   FONTES DE CRÉDITO                       │
                    └─────────────────────────────────────────────────────────┘
                      │                    │                      │
                      ▼                    ▼                      ▼
            POST /api/auth/login   POST /api/payments/webhook   setInterval RECON
            (saldo 0 → 0)          (payment approved)           (reconcilePendingPayments)
                      │                    │                      │
                      │                    │                      │
                      └───────────────────┼──────────────────────┘
                                          │
                                          ▼
                              UPDATE usuarios.saldo
                                          │
                                          ▼
                    ┌─────────────────────────────────────────────────────────┐
                    │  GET /api/user/profile  (dashboard chama ao carregar)    │
                    │  SELECT usuarios → retorna saldo (NUNCA altera saldo)    │
                    └─────────────────────────────────────────────────────────┘
                                          │
                                          ▼
                              Frontend: setBalance(data.saldo)
                              Exibição: R$ {balance.toFixed(2)}
```

**Resumo:** O dashboard **só lê** o saldo via GET /api/user/profile. Todo aumento **persistido** vem de login (hoje 0), webhook ou reconcile. O que o usuário percebe “ao abrir o dashboard” pode ser (a) reconcile tendo creditado logo antes, ou (b) cache mostrando antes 0 e depois o valor já creditado.

---

## 6. Conclusão: causa raiz confirmada

**Causa raiz confirmada:** **INCONCLUSIVO** com base apenas em código e schemas.

- **Confirmado:** O dashboard **não** dispara nenhuma rota que altere saldo; apenas GET profile e GET PIX.  
- **Confirmado:** Os únicos pontos que creditam saldo são login (0), webhook e reconcile.  
- **Provável mas não provado em produção:** Reconciler pode creditar mais de uma vez o mesmo pagamento se houver **mais de um registro** em `pagamentos_pix` para o mesmo payment (falta de UNIQUE ou inserções duplicadas).  
- **Não verificado nesta auditoria:** Logs em produção, contagem de registros duplicados em `pagamentos_pix` por external_id/payment_id, e confirmação se o aumento é persistido (comparando GET profile antes/depois) ou só visual (cache).

---

## 7. Plano cirúrgico mínimo (sem implementar) + checklist pós-fix + rollback

### 7.1 Plano cirúrgico mínimo

- **Não tocar em:** /game, UI do jogo, barra/versão, rotas de chute ou partida.  
- **Alvo:** Evitar crédito duplicado e deixar fluxo de saldo previsível e auditável.

1. **Garantir idempotência de depósito (reconcile + webhook)**  
   - Garantir em produção **UNIQUE** em `pagamentos_pix` por identificador do pagamento (ex.: `external_id` ou `(external_id, usuario_id)`), para impedir dois registros para o mesmo pagamento.  
   - No reconcile (server-fly.js ~2333–2422): antes de creditar, garantir que **no máximo um** registro por payment_id/external_id do MP seja considerado (ex.: agrupar por external_id e processar só um por pagamento, ou usar SELECT/UPDATE que considere unicidade).  
   - Revisar webhook (2062–2109): já exige “exatamente 1 linha” para creditar; manter e garantir que criação de registros em pagamentos_pix não insira duplicatas (ex.: INSERT com ON CONFLICT ou checagem por external_id).

2. **Saldo inicial no login (opcional)**  
   - Manter `calculateInitialBalance('regular')` em 0 (config atual).  
   - Se a regra de negócio for “nunca alterar saldo no login”, remover o bloco server-fly.js 948–957 (update de saldo no login) ou condicionar a um flag (ex.: apenas na primeira ativação da conta).

3. **Dashboard**  
   - Nenhuma alteração obrigatória no dashboard para “não creditar”; ele já só lê.  
   - Opcional: não cachear GET /api/user/profile (ou TTL menor) para evitar impressão de “saldo que sobe ao recarregar” quando na verdade é cache expirando.

### 7.2 Checklist pós-fix

- [ ] Em produção: constraint UNIQUE em `pagamentos_pix` (external_id ou equivalente) aplicada e sem duplicatas existentes (migrar/limpar duplicatas antes se necessário).  
- [ ] Reconcile: ao processar pendentes, não creditar duas vezes o mesmo pagamento (ex.: um único “claim” por external_id/payment_id do MP).  
- [ ] Teste: criar um pagamento PIX aprovado, garantir um único registro em `pagamentos_pix`, rodar reconcile e webhook; conferir que `usuarios.saldo` aumenta **uma vez** só.  
- [ ] Abrir /dashboard várias vezes (e após 30 s para cache): saldo exibido não deve subir sem novo depósito.  
- [ ] /game e barra/versão permanecem intactos.

### 7.3 Rollback plan

- **Schema:** Se for aplicada UNIQUE em `pagamentos_pix`, ter script de rollback que remove a constraint (e, se necessário, trata duplicatas antes de recolocar).  
- **Código reconcile:** Manter versão anterior do trecho de reconcile (backup) para reverter se o novo critério de “um crédito por pagamento” quebrar fluxos legítimos.  
- **Login:** Se for removido o bloco de “saldo inicial”, reverter o commit que o remove; não exige migração.

---

*Auditoria READ-ONLY. Nenhum código, env, migração ou chamada que crie crédito foi alterada ou executada.*
