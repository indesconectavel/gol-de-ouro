# CHANGE #2 — Implementação frontend (mensagem saldo para jogar)

**Data:** 2026-02-05  
**Escopo:** Apenas frontend (goldeouro-player). Sem alteração de backend, regras de bloqueio ou fluxo financeiro.

---

## 1. Objetivo

Exibir mensagem clara e amigável quando o usuário tentar jogar sem saldo:

- **Mensagem alvo:** "Você está sem saldo. Adicione saldo para jogar."
- Sem impacto financeiro, sem alterar regras de bloqueio, sem alterar backend nem fluxo de apostas.
- Mudança mínima e localizada.

---

## 2. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `goldeouro-player/src/services/gameService.js` | Tratamento de erro no `catch` de `processShot`: priorizar `error.response?.data?.message`, e substituir exatamente "Saldo insuficiente" pela mensagem amigável. |

**Nenhum outro arquivo foi alterado.** GameShoot.jsx continua usando `toast.error(error.message)` com o `error` retornado pelo `gameService`, que agora já vem com a mensagem amigável quando for caso de saldo insuficiente.

---

## 3. Diferença funcional antes/depois

### Antes

- No `catch` de `processShot` era retornado sempre `error.message`.
- Em resposta 400 do backend com `message: "Saldo insuficiente"`, o axios rejeita e `error.message` é genérico (ex.: "Request failed with status code 400"); a mensagem do backend não era usada.
- Quando o próprio gameService lançava `throw new Error('Saldo insuficiente')` (checagem local), o toast mostrava "Saldo insuficiente".

### Depois

- No `catch`:
  - Usa-se `error.response?.data?.message || error.message` para definir a mensagem.
  - Se a mensagem for exatamente `"Saldo insuficiente"` (vinda do backend ou do `throw` local), ela é substituída por `"Você está sem saldo. Adicione saldo para jogar."`.
  - Qualquer outro erro mantém o comportamento anterior (mensagem do backend quando existir, senão `error.message`).
- O usuário passa a ver "Você está sem saldo. Adicione saldo para jogar." tanto quando:
  - o backend retorna 400 com `message: "Saldo insuficiente"`, quanto
  - quando a checagem local `this.userBalance < amount` dispara `throw new Error('Saldo insuficiente')`.

---

## 4. Trecho de código alterado

**Arquivo:** `goldeouro-player/src/services/gameService.js`  
**Método:** `processShot` — bloco `catch` (linhas ~132–143).

```javascript
    } catch (error) {
      console.error('❌ [GAME] Erro ao processar chute:', error);
      // Priorizar mensagem do backend quando existir (ex.: 400 Saldo insuficiente)
      let message = error.response?.data?.message || error.message;
      if (message === 'Saldo insuficiente') {
        message = 'Você está sem saldo. Adicione saldo para jogar.';
      }
      return {
        success: false,
        error: message
      };
    }
```

---

## 5. Risco residual

- **Avaliação:** Baixo.
- **Motivos:**
  - Alteração restrita ao tratamento de erro no `catch`; lógica de bloqueio (`balance < currentBet`, `this.userBalance < amount`) e de sucesso não foram alteradas.
  - Substituição apenas quando a string é exatamente `"Saldo insuficiente"`; demais erros continuam com o comportamento atual.
  - Nenhuma mudança em backend, rotas, navegação ou UI de pagamento.
- **Possível edge case:** Se o backend passar a enviar uma mensagem muito parecida (ex.: com espaço ou acento diferente), a substituição não ocorrerá; o usuário continuará vendo a mensagem original do backend.

---

## 6. Checklist de testes manuais recomendados

- [ ] **Usuário sem saldo (bloqueio local):** Com saldo menor que a aposta mínima, tentar chutar (se a UI permitir alguma ação que dispare o fluxo). Esperado: toast com "Você está sem saldo. Adicione saldo para jogar."
- [ ] **Usuário sem saldo (resposta do backend):** Com conta com saldo zero (ou menor que a aposta), forçar chamada ao endpoint de chute (ex.: dev tools ou cenário onde a checagem local não impeça). Esperado: resposta 400 com `message: "Saldo insuficiente"` e no frontend toast "Você está sem saldo. Adicione saldo para jogar."
- [ ] **Usuário com saldo:** Jogar normalmente. Esperado: nenhuma mudança de comportamento; erros não relacionados a saldo continuam exibindo a mensagem original (do backend ou genérica).
- [ ] **Outro erro da API (ex.: 400 por direção inválida):** Esperado: toast com a mensagem retornada pelo backend (ex.: "Direção e valor são obrigatórios" ou equivalente), sem substituição pela mensagem de saldo.

---

## 7. Endpoint utilizado

O frontend chama **`POST /api/games/shoot`** (não `/fila/chutar`). A implementação foi feita no serviço que utiliza esse endpoint (`gameService.processShot`). O comportamento descrito aplica-se a qualquer resposta de erro cuja mensagem seja exatamente "Saldo insuficiente" (backend ou lançamento local).

---

*Implementação concluída. Nenhum deploy nem commit foi realizado automaticamente. CHANGE #2 passa de PARCIAL para CONCLUÍDO no frontend (mensagem amigável exibida).*
