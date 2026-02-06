# CHANGE #4 — Robustez do gatilho (código semântico, sem string)

**Data:** 2026-02-06  
**Escopo:** Apenas frontend (goldeouro-player). Sem alteração de backend, endpoints, PIX ou fluxo financeiro.

---

## 1. Objetivo

- Remover a dependência de string no gatilho do highlight do CHANGE #3.
- Introduzir um código semântico de erro para saldo insuficiente: **INSUFFICIENT_BALANCE**.
- Manter a mensagem exibida ao usuário igual: "Você está sem saldo. Adicione saldo para jogar."
- Mudança mínima e compatível.

---

## 2. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `goldeouro-player/src/services/gameService.js` | No `catch` de `processShot`, retorno de erro passa a ser objeto `{ code, message }`: `INSUFFICIENT_BALANCE` para saldo insuficiente, `GENERIC_ERROR` para demais erros. |
| `goldeouro-player/src/pages/GameShoot.jsx` | Tratamento do `result` quando `success === false`: extrai mensagem de `error.message` se for objeto; aciona highlight quando `error.code === 'INSUFFICIENT_BALANCE'`; removida a comparação por texto exato; erro tratado no `else` (sem throw), e o `catch` continua tratando apenas exceções reais. |

---

## 3. Antes / Depois do formato do erro

### Antes (CHANGE #2/#3)

- **gameService.processShot** em caso de erro retornava:
  - `{ success: false, error: string }` (ex.: `"Você está sem saldo. Adicione saldo para jogar."`).
- **GameShoot.jsx**:
  - Fazia `throw new Error(result.error)` e no `catch` usava `error.message` e `if (error.message === 'Você está sem saldo. Adicione saldo para jogar.')` para acionar o highlight.

### Depois (CHANGE #4)

- **gameService.processShot** em caso de erro retorna:
  - Saldo insuficiente: `{ success: false, error: { code: 'INSUFFICIENT_BALANCE', message: 'Você está sem saldo. Adicione saldo para jogar.' } }`.
  - Outros erros: `{ success: false, error: { code: 'GENERIC_ERROR', message: <mensagem atual> } }`.
- **GameShoot.jsx**:
  - Quando `!result.success`, não faz throw; trata no `else`:
    - Mensagem: `(typeof err === 'object' && err && err.message) ? err.message : (err || 'Erro ao processar chute')` (compatível com legado string).
    - Highlight: `if (typeof err === 'object' && err && err.code === 'INSUFFICIENT_BALANCE') { ... }`.
  - Removida a comparação por texto exato; o `catch` só trata exceções (ex.: falha de rede) e exibe `error.message`, sem highlight.

---

## 4. Compatibilidade

- **Consumidor único de `processShot`:** GameShoot.jsx (confirmado por grep). Nenhum outro arquivo chama `processShot`.
- **Ajuste no GameShoot:** Aceita tanto `result.error` como **objeto** `{ code, message }` quanto como **string** (legado): a mensagem é obtida com `err.message` ou `err`; o highlight só é ligado quando `err.code === 'INSUFFICIENT_BALANCE'`.
- **Mensagem ao usuário:** Inalterada (toast e `setError` continuam com o mesmo texto).
- Outros métodos do gameService (ex.: `initialize`) não foram alterados e continuam retornando `error: error.message` onde aplicável.

---

## 5. Risco residual

- **Avaliação:** Baixo.
- **Motivos:** Alteração restrita ao formato de retorno de erro de `processShot` e ao tratamento em GameShoot; mensagem de UI inalterada; backend e fluxo financeiro intocados.
- **Edge case:** Se no futuro outro consumidor chamar `processShot` e esperar sempre `result.error` como string, precisará ser ajustado para aceitar `typeof result.error === 'object' ? result.error.message : result.error`. Atualmente não há outro consumidor.

---

## 6. Checklist de testes manuais

- [ ] **Saldo insuficiente (local ou backend):** Tentar chutar sem saldo. Esperado: toast "Você está sem saldo. Adicione saldo para jogar." e botão Recarregar com destaque temporário.
- [ ] **Outro erro (ex.: valor inválido):** Provocar erro que não seja saldo. Esperado: toast com a mensagem correspondente; botão Recarregar **não** destaca.
- [ ] **Usuário com saldo:** Jogar normalmente. Esperado: nenhuma mudança de comportamento.

---

## 7. Confirmação

- **Backend:** Nenhuma alteração.
- **Endpoints / PIX / financeiro / valores / rotas:** Nenhuma alteração.

---

## 8. Rollback

- **Tag pré-change:** `PRE_CHANGE4_2026-02-06_0050`
- **Tag pós-change:** `CHANGE4_DONE_2026-02-06_0050`
- **Hash do commit CHANGE #4:** `0a49bf3` (completo: `0a49bf316de357755775e4b98356c5d459f12e5c`)

### Revert seguro (recomendado se já tiver push)

```powershell
git revert 0a49bf3
git push
```

### Voltar para tag PRE (somente local; evitar force push)

```powershell
git fetch --all --tags
git reset --hard PRE_CHANGE4_2026-02-06_0050
```
