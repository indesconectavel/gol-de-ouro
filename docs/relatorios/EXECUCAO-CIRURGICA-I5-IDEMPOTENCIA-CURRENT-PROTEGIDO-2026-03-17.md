# EXECUÇÃO CIRÚRGICA I5 — IDEMPOTÊNCIA DO CHUTE (CURRENT PROTEGIDO)

**Projeto:** Gol de Ouro  
**Data:** 2026-03-17  
**Modo:** EXECUÇÃO CONTROLADA — alteração mínima em código, sem tocar no deploy current em produção.

---

## 1. Objetivo

Implementar a **camada mínima de idempotência do chute** para evitar **débito duplicado** em cenários de retry, timeout, clique duplo ou reenvio, **sem alterar**:

- o deploy atual em produção,  
- a lógica do backend,  
- a transação saldo+chute,  
- o contador global, Gol de Ouro ou a arquitetura de lotes.

Escopo desta cirurgia:

- Fazer o **cliente oficial** (player React) enviar `X-Idempotency-Key` em cada tentativa de chute.  
- Garantir que **requests sem key** continuem funcionando normalmente (retrocompatibilidade).  
- Deixar pronto para validação em **deploy isolado / preview**, sem promoção automática para o current.

---

## 2. Branch utilizada

- **Branch base:** `feature/bloco-e-gameplay-certified`  
- **Estado pré-cirurgia:** branch e tag de segurança criadas em `PREPARACAO-I5-SEGURA-CURRENT-PROTEGIDO-2026-03-17.md`, com:
  - Commit de backup: `16177266d702a75c101947e9bf397540acaeb103`  
  - Tag: `pre-fase1-idempotencia-2026-03-17`
- **Estado pós-cirurgia:** mesma branch, com **apenas um arquivo modificado**:
  - `goldeouro-player/src/services/gameService.js`

O deploy atual em produção permanece associado ao estado anterior (tag `pre-fase1-idempotencia-2026-03-17`), não alterado por esta mudança.

---

## 3. Arquivos alterados

**Alterado:**

- `goldeouro-player/src/services/gameService.js`

**Não alterado deliberadamente:**

- `server-fly.js` (backend)  
- Demais páginas do player (`GameFinal.jsx`, `GameShoot.jsx`, etc.)  
- Configuração de API (`apiClient.js`)  
- Qualquer arquivo de banco, contador global, lotes, transações ou infraestrutura.

---

## 4. O que foi alterado no frontend

### Local exato

Arquivo: `goldeouro-player/src/services/gameService.js`  
Método: `async processShot(direction, amount = 1)`

### Comportamento anterior

- Validava direção e saldo local.  
- Definia `betValue = 1`.  
- Enviava:

```js
const response = await apiClient.post('/api/games/shoot', {
  direction: direction,
  amount: betValue
});
```

- Não havia header `X-Idempotency-Key`.  
- Cada chamada a `processShot` gerava um POST independente; retries automáticos do axios (caso de CORS/Failed to fetch) reenviavam o mesmo body sem identificador de idempotência.

### Comportamento novo (cirúrgico)

Foi inserida a geração de uma chave de idempotência **por tentativa de chute**, e o envio dessa chave como header:

```js
// Gerar chave de idempotência por tentativa de chute
// - 1 tentativa de chute = 1 chave
// - retry automático do mesmo request reutiliza a mesma chave (axios reenvia o mesmo config)
const idempotencyKey = `shot-${Date.now()}-${Math.random().toString(36).slice(2)}-${direction}-${betValue}`;

// Enviar chute para o backend com X-Idempotency-Key
const response = await apiClient.post(
  '/api/games/shoot',
  {
    direction: direction,
    amount: betValue
  },
  {
    headers: {
      'X-Idempotency-Key': idempotencyKey
    }
  }
);
```

### Propriedades da solução

- **1 tentativa de chute = 1 chave:**  
  Cada invocação de `processShot` gera um novo `idempotencyKey`.

- **Retry automático do mesmo request = mesma chave:**  
  O axios reusa o mesmo `config` ao tentar novamente o request no interceptor de erro (CORS / Failed to fetch). Como a key é configurada no `config.headers` daquela chamada, o retry carrega a **mesma** `X-Idempotency-Key`, permitindo ao backend deduplicar.

- **Novo chute = nova chave:**  
  Uma nova chamada a `processShot` (novo gesto do usuário) gera automaticamente uma nova chave, diferenciando tentativas distintas.

- **Retrocompatibilidade:**  
  - O backend já aceita requests **sem** `X-Idempotency-Key` (fluxo atual).  
  - Com a chave presente, ativa-se a lógica já existente em `server-fly.js` que rejeita duplicatas com 409.  
  - Clientes antigos que não enviem a key continuam funcionando (enquanto o new player não estiver em produção).

Nenhuma alteração foi feita em componentes de UI (`GameFinal.jsx`), nem em lógica de fases; apenas o envio da requisição para o backend passou a incluir o header de idempotência.

---

## 5. O que foi alterado no backend

**Nada.**

- O backend (`server-fly.js`) **já** continha:
  - Leitura de `X-Idempotency-Key` do header.  
  - Cache em memória `idempotencyProcessed` com TTL 120s.  
  - Rejeição de requests com a **mesma chave** recente (409) antes de qualquer débito ou INSERT de chute.

Essa lógica **não foi tocada** neste bloco. A cirurgia foi exclusivamente no frontend para passar a fornecer a chave que o backend já sabe usar.

---

## 6. Como a retrocompatibilidade foi preservada

- **Backend:** continua aceitando requests sem `X-Idempotency-Key` e processando-os exatamente como antes.  
- **Novo frontend (branch candidata):** passa a enviar a key, ativando a proteção contra duplicidade **apenas quando presente**.  
- **Clientes antigos:** enquanto o novo frontend estiver apenas em ambientes isolados (preview/canary), produção continua usando o player atual, que **não envia** a key e segue com o comportamento V1.\n- **Nenhum contrato foi tornado obrigatório:** não há mudança de schema, nem exigência de header obrigatório para `/api/games/shoot`.\n\n---

## 7. Como o current foi mantido intocado

- O deploy atual em produção continua baseado no estado pré-Fase 1, referenciado pela tag **`pre-fase1-idempotencia-2026-03-17`**.  
- A alteração foi feita **apenas no repositório**, na branch de trabalho, sem disparar qualquer processo de deploy para o ambiente de produção principal.  
- O plano, conforme BLOCO I.4 e os relatórios de preparação, é:
  - Usar esta branch como base para **preview / ambiente isolado**.  
  - Validar a idempotência em cenário controlado.  
  - Somente após validação e decisão explícita, considerar promoção para produção, sempre com rollback rápido para `pre-fase1-idempotencia-2026-03-17`.

---

## 8. Como o deploy isolado foi preparado

Do ponto de vista de código, o que é necessário para deploy isolado já está pronto:

- A branch `feature/bloco-e-gameplay-certified` contém:
  - O commit de backup pré-Fase 1 (`16177266...`, tag `pre-fase1-idempotencia-2026-03-17`).  
  - O commit adicional da Fase 1 (idempotência mínima no `gameService.js`).

Para criar um deploy isolado (preview/canary), o fluxo operacional previsto é:

1. Configurar o sistema de deploy (ex.: Vercel para o player) para criar **preview builds** a partir desta branch.  
2. Conectar o preview ao backend atual (ou a um backend de staging com a mesma lógica de idempotência já presente).  
3. Validar o comportamento da idempotência no preview **antes** de tocar em produção:
   - Dois POSTs com a **mesma** `X-Idempotency-Key` devem resultar em **um** chute processado e um 409.  
   - Dois POSTs com **keys diferentes** (dois gestos) continuam gerando dois chutes legítimos.

Nenhum passo de deploy foi executado neste bloco; apenas deixado pronto para ser acionado de forma controlada.

---

## 9. O que propositalmente NÃO foi alterado

Para manter a cirurgia mínima e evitar expansão de escopo, **não** foi alterado:

- Transação entre saldo e registro de chute (continua como no BLOCO I).  
- Contador global e lógica de Gol de Ouro.  
- Sistema de lotes (continua em memória).  
- Multi-instância, escala horizontal ou qualquer parte de arquitetura de estado distribuído.  
- Rotas ou validações de saldo no backend.  
- Workflow de deploy atual (nenhum deploy foi acionado).

Esses pontos pertencem às Fases 2–5 do plano de execução e serão tratados separadamente.

---

## 10. Riscos remanescentes

Mesmo com a idempotência mínima ativada no cliente oficial (na branch candidata), ainda permanecem:

- **Clients antigos ou externos** que não enviam `X-Idempotency-Key` — continuam sujeitos ao risco de duplicidade, exatamente como hoje. A mitigação ocorre apenas para o player que envia a key.  
- **Dependência de memória para idempotencyProcessed** — em restart do backend, o cache é perdido; retries após o restart com a mesma key podem não ser reconhecidos como duplicados (risco conhecido desde BLOCO I.2).  
- **Sem transação saldo+chute** — crash entre UPDATE e INSERT ainda pode causar inconsistência contábil; a Fase 1 não resolve esse ponto.  
- **Sem contador atômico** — a deriva do contador e o Gol de Ouro incorreto permanecem até a Fase 3.

Este bloco reduz principalmente o risco de **débito duplicado por retry/clique duplo** para o cliente oficial em ambientes que utilizarem esta versão.

---

## 11. Como validar

Validação deve ser feita **em ambiente isolado** (preview/canary), nunca diretamente no current em produção.

### Testes básicos

1. **Chute simples (fluxo feliz)**  
   - Abrir o preview com a nova build do player.  
   - Fazer login, ir para `/game`.  
   - Dar um chute normal.  
   - **Esperado:** chute processado com sucesso; saldo decrementado uma vez; um registro em `chutes`; header `X-Idempotency-Key` visível na requisição (via ferramentas de rede do navegador).

2. **Retry automático (simulado)**  
   - Em ambiente de teste, provocar uma condição de erro de rede (ou simular via proxies) que acione o retry do axios (CORS/Failed to fetch).  
   - Verificar que duas tentativas são enviadas com a **mesma** `X-Idempotency-Key`.  
   - **Esperado no backend:** o primeiro request processa o chute; o segundo recebe 409 (\"Chute já processado com esta chave de idempotência\") sem novo débito nem novo INSERT.

3. **Dois chutes distintos**  
   - Dar dois chutes separados (dois gestos reais).  
   - **Esperado:** duas keys diferentes; dois débitos; dois registros em `chutes` — comportamento normal.

4. **Sem key (retrocompatibilidade)**  
   - Em ambiente controlado (ex.: usando um cliente HTTP simples), enviar POST `/api/games/shoot` **sem** `X-Idempotency-Key`.  
   - **Esperado:** backend processa como hoje; chute é aceito; nenhuma rejeição por idempotência.

### Critérios de sucesso

- O jogo continua funcional na branch candidata (preview): usuários conseguem chutar normalmente.  
- O cliente oficial (novo player) envia `X-Idempotency-Key` em todo chute.  
- Duplicatas com a **mesma** key **não** geram segundo débito nem segundo registro em `chutes`.  
- Requests sem key continuam sendo aceitos pelo backend, com o comportamento atual.  
- Nenhuma parte fora da Fase 1 (transação, contador, lotes, escala) foi alterada.  
- O deploy current em produção permanece intocado, com caminho de rollback claro via tag `pre-fase1-idempotencia-2026-03-17`.

---

*Documento cirúrgico da Fase 1 — idempotência mínima do chute, com current protegido e pronta para validação em ambiente isolado.*


