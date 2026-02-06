# CHANGE #2 — Precheck saldo para jogar (mensagem/alerta)

**Data da auditoria:** 2026-02-05  
**Modo:** READ-ONLY (nenhuma escrita em banco, sem PIX, sem aposta)  
**Escopo:** Verificar se a correção “Para chutar é necessário ter saldo” / “Adicione saldo à sua conta para jogar!” está implementada e funcionando (frontend + backend).

---

## 1. Sumário executivo

| Status | Descrição |
|--------|-----------|
| **PARCIAL** | Backend bloqueia sem saldo e retorna mensagem; frontend bloqueia por UI (botões desabilitados) e mostra toast em erro, mas **não** exibe as frases solicitadas e o toast pode mostrar mensagem genérica em caso de 400. |

- **Backend:** Bloqueio implementado: quando `user.saldo < amount` retorna **400** com `message: 'Saldo insuficiente'`. Não utiliza as frases “Para chutar é necessário ter saldo” nem “Adicione saldo à sua conta para jogar!”.
- **Frontend:**  
  - Bloqueia tentativa de chute quando `balance < currentBet` (botões desabilitados e early return).  
  - Não exibe em lugar nenhum as frases “Para chutar é necessário ter saldo” ou “Adicione saldo à sua conta para jogar!”.  
  - Em erro da API, o toast usa `error.message`; se o cliente não extrair `error.response.data.message`, o usuário pode ver “Request failed with status code 400” em vez de “Saldo insuficiente”.

---

## 2. Evidências do frontend

### 2.1 Onde fica “chutar/jogar”

- **Página do jogo (chute ao gol):** `goldeouro-player/src/pages/GameShoot.jsx`
- **Rota:** `/gameshoot` (definida em `App.jsx`, linha ~54)
- **Chamada ao backend:** feita via `gameService.processShot(direction, amount)` (GameShoot.jsx, linha ~164), que usa `apiClient.post('/api/games/shoot', { direction, amount })` (gameService.js, linha ~88)

### 2.2 Condição que bloqueia (saldo insuficiente)

- **Arquivo:** `goldeouro-player/src/pages/GameShoot.jsx`
- **Condição:** `balance < currentBet` (saldo menor que valor da aposta atual).

Trechos:

```148:149:goldeouro-player/src/pages/GameShoot.jsx
  const handleShoot = async (dir) => {
    if (shooting || balance < currentBet) return;
```

```367:372:goldeouro-player/src/pages/GameShoot.jsx
                    disabled={shooting || balance < currentBet}
                    className={`... ${
                      shooting || balance < currentBet
                        ? 'bg-gray-500 border-gray-400 cursor-not-allowed'
                        : 'bg-yellow-400 ...'
```

- Botões de valor de aposta (R$ 1, 2, 5, 10) também ficam desabilitados quando `balance < value` (linhas 332, 336).

### 2.3 Mensagem exibida ao usuário

- **Nenhum** texto fixo “Para chutar é necessário ter saldo” ou “Adicione saldo à sua conta para jogar!” foi encontrado em `goldeouro-player/src`.
- Quando `balance < currentBet`, o usuário só vê:
  - Botões de zona e de aposta desabilitados (visual cinza, `cursor-not-allowed`).
  - Nenhum toast nem banner explicando falta de saldo nesse momento.
- Quando a **API** retorna erro (ex.: 400 Saldo insuficiente), o fluxo é:
  - `GameShoot.jsx` linhas 240–242: `setError(error.message); toast.error(error.message);`
  - A mensagem vem de `gameService.processShot` → `return { success: false, error: error.message }` (gameService.js, linhas 133–135).
  - Em `gameService.js`, no `catch`, usa-se apenas `error.message` (linha 135). Em respostas 4xx do axios, `error.message` costuma ser “Request failed with status code 400”; a mensagem do backend (`error.response.data.message` = “Saldo insuficiente”) **não** é usada no retorno. Logo, o toast pode mostrar a mensagem genérica em vez de “Saldo insuficiente”.

### 2.4 gameService — checagem local e chamada à API

- **Arquivo:** `goldeouro-player/src/services/gameService.js`
- Checagem local antes de chamar a API (linhas 83–85):

```83:85:goldeouro-player/src/services/gameService.js
      if (this.userBalance < amount) {
        throw new Error('Saldo insuficiente');
      }
```

- Em caso de `response.data.success === false`, usa `response.data.message` (linha 129). Em caso de exceção (ex.: 400), o `catch` retorna só `error.message` (linhas 131–135), sem `error.response?.data?.message`.

---

## 3. Evidências do backend

### 3.1 Endpoint do chute

- **Rota:** `POST /api/games/shoot`
- **Arquivo:** `server-fly.js`
- **Trecho:** linhas 1143–1189 (autenticação + validação de entrada + validação de valor de aposta + verificação de saldo).

### 3.2 Verificação de saldo e resposta de erro

- **Arquivo:** `server-fly.js`
- **Linhas 1171–1189:**

```1171:1189:server-fly.js
    // Verificar saldo do usuário
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('saldo')
      .eq('id', req.user.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    if (user.saldo < amount) {
      return res.status(400).json({
      success: false,
        message: 'Saldo insuficiente'
      });
    }
```

- **Condição:** `user.saldo < amount` (saldo estrito menor que valor da aposta).
- **Status HTTP:** 400.
- **Body esperado:** `{ success: false, message: 'Saldo insuficiente' }`.
- Não há uso de “Para chutar é necessário ter saldo” nem “Adicione saldo à sua conta para jogar!” no backend.

---

## 4. Evidência em produção (request/response)

### 4.1 Limitações desta auditoria

- Não foi criado usuário, PIX nem aposta.
- Não há credencial de teste “saldo 0” fornecida neste ambiente; portanto **não foi feita** uma chamada real a `POST /api/games/shoot` em produção com conta sem saldo.
- Abaixo descreve-se o procedimento e o resultado esperado para quando o humano tiver uma conta com saldo zero.

### 4.2 Procedimento recomendado (para o humano)

1. Obter uma credencial de usuário com **saldo 0** (ou &lt; valor mínimo de aposta, ex.: 1).
2. Fazer login:
   - `POST https://www.goldeouro.lol/api/auth/login` (ou a URL de API em uso).
   - Body: `{ "email": "<mascarado>", "password": "<mascarado>" }`.
   - Guardar o token JWT (não registrar em log).
3. Tentar um chute:
   - `POST <API_BASE>/api/games/shoot`
   - Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
   - Body: `{ "direction": "C", "amount": 1 }`
4. Resposta esperada do backend:
   - **Status:** 400  
   - **Body:** `{ "success": false, "message": "Saldo insuficiente" }`

### 4.3 Exemplo de evidência (formato esperado, dados mascarados)

| Campo        | Valor |
|-------------|--------|
| Request     | `POST /api/games/shoot` |
| Auth        | Bearer &lt;PRESENTE&gt; |
| Body        | `{ "direction": "C", "amount": 1 }` |
| Status      | 400 |
| Response    | `{ "success": false, "message": "Saldo insuficiente" }` |

Se o humano executar esse teste, pode colar status + body (sem token/senha) nesta seção como evidência de produção.

---

## 5. Riscos e próximos passos (somente leitura)

- **Risco 1:** Usuário com saldo zero vê apenas botões desabilitados, sem explicação clara (“Para chutar é necessário ter saldo” / “Adicione saldo à sua conta para jogar!”), o que pode gerar dúvida ou suporte.
- **Risco 2:** Se por race condition ou outro cliente a requisição de chute for enviada com saldo insuficiente e o backend retornar 400, o toast pode exibir “Request failed with status code 400” em vez de “Saldo insuficiente”, pois o frontend não usa `error.response?.data?.message` no `catch` do `processShot`.
- **Próximos passos sugeridos (apenas listagem, sem patch):**
  - Incluir no frontend (ex.: GameShoot.jsx) um banner ou mensagem fixa quando `balance <= 0` ou `balance < currentBet`, com texto alinhado ao CHANGE #2 (“Para chutar é necessário ter saldo” / “Adicione saldo à sua conta para jogar!”).
  - No `gameService.processShot`, em caso de erro de resposta HTTP, retornar `error.response?.data?.message || error.message` para que o toast mostre a mensagem do backend.
  - (Opcional) Padronizar no backend a mensagem para uma das frases do CHANGE #2, mantendo o status 400.

---

## 6. Checklist final

| Item | Status | Onde |
|------|--------|------|
| Backend bloqueia chute quando saldo &lt; valor da aposta | **IMPLEMENTADO** | server-fly.js, linhas 1185–1189 |
| Backend retorna status 400 nesse caso | **IMPLEMENTADO** | server-fly.js, linha 1186 |
| Backend retorna mensagem de erro (“Saldo insuficiente”) | **IMPLEMENTADO** | server-fly.js, linha 1188 |
| Backend usa a frase “Para chutar é necessário ter saldo” ou “Adicione saldo…” | **AUSENTE** | — |
| Frontend impede clique quando saldo &lt; aposta | **IMPLEMENTADO** | GameShoot.jsx, linhas 148, 367, 332 |
| Frontend exibe mensagem “Para chutar é necessário ter saldo” ou “Adicione saldo…” | **AUSENTE** | Nenhum arquivo em goldeouro-player/src |
| Frontend mostra toast com mensagem do backend em erro 400 | **PARCIAL** | Só se extrair `error.response.data.message` no gameService; atualmente usa `error.message` |
| Evidência em produção (request/response com conta saldo 0) | **Pendente** | Requer credencial “saldo 0” fornecida pelo humano; procedimento descrito na seção 4 |

**Classificação final:** **PARCIAL** — bloqueio e mensagem de erro existem no backend; frontend bloqueia por UI mas não exibe as frases solicitadas e pode não mostrar “Saldo insuficiente” no toast em caso de 400.
