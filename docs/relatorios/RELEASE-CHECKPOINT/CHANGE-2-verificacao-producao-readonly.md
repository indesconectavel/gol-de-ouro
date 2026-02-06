# CHANGE #2 — Verificação em produção (READ-ONLY)

**Data da auditoria:** 2026-02-05  
**Modo:** READ-ONLY ABSOLUTO (nenhuma escrita, nenhum POST em produção)  
**Objetivo:** Verificar se o CHANGE #2 (“Adicionar saldo para jogar” / mensagem clara quando saldo insuficiente para chutar) está implementado e funcionando em produção.

---

## 1. Resumo executivo e status

| Status | **PARCIAL** |
|--------|--------------|
| **Conclusão** | Backend bloqueia e retorna mensagem consistente; frontend bloqueia por UI e exibe “Saldo insuficiente” em cenários locais; **não** existe mensagem explícita “Adicione saldo à sua conta para jogar!” nem “Para chutar é necessário ter saldo” no código nem no build publicado. |

- **Critério 1 (mensagem amigável):** AUSENTE — As frases “Adicione saldo à sua conta para jogar!” e “Para chutar é necessário ter saldo” não aparecem no frontend nem no bundle de produção.
- **Critério 2 (bloqueio/desabilitar chute):** IMPLEMENTADO — Botão/ação de chutar desabilitados quando `balance < currentBet`; em erro da API o toast usa `error.message` (que pode ser “Saldo insuficiente” quando o serviço repassa).
- **Critério 3 (backend rejeita com 400 + message):** IMPLEMENTADO — Endpoint `/api/games/shoot` verifica saldo **antes** de qualquer insert e retorna HTTP 400 com `message: 'Saldo insuficiente'`.
- **Critério 4 (produção — string no build):** PARCIAL — A string “Saldo insuficiente” **existe** no bundle publicado; as strings “Adicione saldo” e “Para chutar” **não existem** no bundle.

---

## 2. Evidências do frontend (código no repositório)

### 2.1 Onde fica a tela do jogo (chute)

- **Página:** `goldeouro-player/src/pages/GameShoot.jsx`
- **Rota:** `/gameshoot` (definida em `App.jsx`)
- **Serviço:** `goldeouro-player/src/services/gameService.js` — `processShot(direction, amount)` chama `POST /api/games/shoot`

### 2.2 Bloqueio (saldo &lt; aposta)

- **Arquivo:** `goldeouro-player/src/pages/GameShoot.jsx`
- **Condição:** `balance < currentBet` (e, no serviço, `this.userBalance < amount`).

| Local | Linha | Trecho |
|-------|--------|--------|
| Early return no handleShoot | 148 | `if (shooting \|\| balance < currentBet) return;` |
| Desabilitar zonas do gol | 367, 369 | `disabled={shooting \|\| balance < currentBet}` e classe quando `balance < currentBet` |
| Desabilitar botões de valor de aposta | 332, 336 | `disabled={balance < value}` e estilo quando `balance < value` |

### 2.3 Mensagem exibida ao usuário

- **Mensagem CHANGE #2 (“Adicione saldo…” / “Para chutar…”):** Não encontrada em nenhum arquivo em `goldeouro-player/src`.
- **Outros textos:**
  - Botão “Recarregar” (ir para pagamentos): GameShoot.jsx ~315 (`navigate('/pagamentos')`).
  - Pagamentos.jsx 142: “Recarregue seu saldo para apostar no jogo” (página de pagamentos, não na tela de chute).
  - Game.jsx 350: “Adicione chutes para começar a jogar!” (refere-se a “chutes” como créditos de partida, não a saldo em R$).
- Quando a **API** retorna erro, o fluxo é:
  - `GameShoot.jsx` 240–242: `setError(error.message); toast.error(error.message);`
  - A mensagem vem de `gameService.processShot` → `return { success: false, error: error.message }` (gameService.js 133–135).
  - No `catch` do `processShot` usa-se apenas **`error.message`**; **não** há uso de `error.response?.data?.message`. Em respostas 4xx do axios, `error.message` costuma ser “Request failed with status code 400”; a mensagem do backend (“Saldo insuficiente”) só chega ao usuário quando o backend retorna 200 com `success: false` e `message` (linha 129 do gameService).

### 2.4 gameService — checagem local e erro

- **Arquivo:** `goldeouro-player/src/services/gameService.js`
- Checagem local antes do POST (linhas 83–85): `if (this.userBalance < amount) throw new Error('Saldo insuficiente');`
- Em sucesso da resposta: usa `response.data.message` (linha 129).
- Em exceção (ex.: 400): `catch` retorna `error: error.message` (linhas 132–136); **não** há `error.response?.data?.message`.

---

## 3. Evidências do backend (código no repositório)

### 3.1 Endpoint de chute

- **Rota:** `POST /api/games/shoot`
- **Arquivo:** `server-fly.js`
- **Linhas:** 1144 (definição do endpoint) e 1171–1189 (verificação de saldo).

### 3.2 Ordem das operações

- A verificação de saldo ocorre **antes** de qualquer insert:
  - Linhas 1171–1176: `select('saldo')` do usuário.
  - Linhas 1185–1189: se `user.saldo < amount`, retorna imediatamente com 400.
  - Insert em banco (tabela `chutes`) só ocorre a partir da linha 1285; portanto o bloqueio por saldo é anterior a qualquer escrita.

### 3.3 Resposta em caso de saldo insuficiente

- **Arquivo:** `server-fly.js`
- **Linhas 1185–1189:**

```text
if (user.saldo < amount) {
  return res.status(400).json({
    success: false,
    message: 'Saldo insuficiente'
  });
}
```

- **Status HTTP:** 400  
- **Payload:** `{ "success": false, "message": "Saldo insuficiente" }`  
- Não há middleware específico de padronização de erros para este endpoint; a resposta é enviada diretamente no handler.

---

## 4. Evidências de produção (GET nos assets)

### 4.1 Método

- **HTML:** `GET https://www.goldeouro.lol/` (salvo como `prod-index.html`).
- **Bundle JS principal:** `<script type="module" crossorigin src="/assets/index-qIGutT6K.js">` → URL absoluta: `https://www.goldeouro.lol/assets/index-qIGutT6K.js`.
- O conteúdo do bundle foi baixado e salvo localmente como `prod-assets-index.js`; as buscas abaixo referem-se a esse arquivo.

### 4.2 Busca textual no bundle publicado

| String buscada | Aparece no bundle? | Observação |
|----------------|--------------------|------------|
| **Adicione saldo** | Não | Frase do CHANGE #2 ausente no build. |
| **Para chutar** | Não | Frase do CHANGE #2 ausente no build. |
| **Saldo insuficiente** | Sim | Presente (origem: gameService e possivelmente Withdraw). |
| **Recarregar** | Sim | Label do botão para ir a pagamentos. |
| **Erro ao processar chute** | Sim | Mensagem genérica de erro no fluxo de chute. |

### 4.3 Trecho onde “Saldo insuficiente” aparece no bundle

- **Arquivo analisado:** conteúdo de `https://www.goldeouro.lol/assets/index-qIGutT6K.js` (salvo como `prod-assets-index.js`).
- **Trecho capturado (máx. ~25 palavras ao redor, sem segredos):**

```text
throw console.error("? [GAME] Saldo insuficiente:",this.userBalance,"<",r),new E
```

- Isso corresponde à checagem local no gameService (`this.userBalance < amount`) e ao `throw new Error('Saldo insuficiente')`; a string é exibida ao usuário quando o erro é mostrado via toast (quando o serviço retorna `error.message` nesse caso).

---

## 5. Conclusão por critério

| # | Critério CHANGE #2 | Status | Evidência |
|---|--------------------|--------|-----------|
| 1 | Mensagem explícita e amigável (“Adicione saldo…” / “Para chutar…”) visível ao usuário | **AUSENTE** | Nenhuma dessas frases no código-fonte nem no bundle de produção. |
| 2 | Botão/ação de chutar bloqueado quando saldo &lt; aposta ou quando API retorna erro de saldo | **IMPLEMENTADO** | `balance < currentBet` desabilita botões e early return; toast em erro usa `error.message` (inclui “Saldo insuficiente” quando repassado pelo serviço). |
| 3 | Backend rejeita com 400 (ou 403/422) e message consistente antes de registrar chute | **IMPLEMENTADO** | server-fly.js: checagem de saldo antes de qualquer insert; retorno 400 com `message: 'Saldo insuficiente'`. |
| 4 | Produção: mensagem do CHANGE #2 presente no build (busca textual no JS) | **PARCIAL** | “Saldo insuficiente” está no bundle; “Adicione saldo” e “Para chutar” não estão. |

---

## 6. Classificação final

**PARCIAL**

- Backend e bloqueio de UI estão alinhados com o esperado (bloqueio + 400 + “Saldo insuficiente”).
- A mensagem **amigável** do CHANGE #2 (“Adicione saldo à sua conta para jogar!” / “Para chutar é necessário ter saldo”) **não** foi implementada no frontend e **não** está presente no build de produção.
- No bundle de produção, a única string relacionada a saldo insuficiente para o jogo é “Saldo insuficiente” (usada no toast quando o erro é repassado pelo gameService).

---

## 7. Teste negativo opcional

- **RUN_OPTIONAL_NEGATIVE_TEST:** não utilizado (desativado por padrão).
- Nenhum POST em produção foi executado nesta auditoria.

---

*Relatório gerado em modo READ-ONLY. Nenhum código foi alterado; nenhum commit ou deploy foi realizado.*
