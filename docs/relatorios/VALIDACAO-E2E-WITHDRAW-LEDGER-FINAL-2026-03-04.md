# Validação E2E — Withdraw/Ledger (relatório final)

**Data:** 2026-03-04  
**Objetivo:** Fechar a validação E2E do saque (withdraw) sem alterar player (/game), schema ou workflows. Nenhum JWT nem chave PIX completa em logs ou relatórios.

---

## FASE D — Instruções operacionais (sem colar segredos)

### 11) Obter JWT do backend

- No browser, acessar o app (ex.: www.goldeouro.lol), fazer login.
- Abrir **DevTools → Network**; disparar uma requisição autenticada (ex.: GET /api/user/profile).
- Na requisição, copiar o valor do header **Authorization** (ex.: `Bearer eyJ...`).
- **Não colar o token em nenhum arquivo nem relatório.**

No PowerShell:

```powershell
$env:BEARER="Bearer <COLE_O_TOKEN_AQUI>"
```

### 12) Definir PIX_KEY fora da blocklist

```powershell
$env:PIX_KEY="free10signer@gmail.com"
$env:PIX_KEY_TYPE="email"
$env:WITHDRAW_AMOUNT="10"
```

### 13) Rodar o teste

```powershell
node scripts/create-test-withdraw-live.js
```

Registrar no relatório: `success` (true/false), `statusCode`, `saqueId` (se houver), `message`. Não registrar o token nem a chave PIX completa.

### 14) Coletar logs após o request

```powershell
flyctl logs -a goldeouro-backend-v2 --no-tail
```

Procurar por:

- `❌ [SAQUE] Erro ao registrar ledger`
- `[LEDGER] insert falhou (airbag)`
- Em cada linha relevante: `code`, `message`, `details`, `hint` (já truncados/mascarados no código).

Registrar abaixo um trecho das linhas encontradas (sem dados sensíveis).

**Trecho dos logs (preencher após execução):**

```
(cola aqui apenas linhas com [SAQUE] ou [LEDGER], com code/message/details/hint mascarados)
```

### 15) Resultado final PASS/FAIL

| Critério | Resultado |
|----------|-----------|
| Script retornou success: true e saqueId preenchido? | [ ] SIM [ ] NÃO |
| Nos logs, apareceu "Erro ao registrar ledger" ou "insert falhou (airbag)"? | [ ] SIM [ ] NÃO |
| Worker processou sem erro de coluna (user_id/usuario_id)? | [ ] SIM [ ] NÃO [ ] N/A |
| Saque saiu de pendente ou evoluiu de status? | [ ] SIM [ ] NÃO [ ] N/A |

**Conclusão E2E:** [ ] **PASS** — Saque criado com sucesso e sem erro de ledger nos logs; ou [ ] **FAIL** — 500 ou erro de ledger/coluna registrado.

### 16) Limpar variáveis de ambiente

```powershell
Remove-Item Env:BEARER -ErrorAction SilentlyContinue
Remove-Item Env:PIX_KEY -ErrorAction SilentlyContinue
Remove-Item Env:PIX_KEY_TYPE -ErrorAction SilentlyContinue
Remove-Item Env:WITHDRAW_AMOUNT -ErrorAction SilentlyContinue
```

---

## Relatórios gerados nesta validação

| Documento | Conteúdo |
|-----------|----------|
| PROVA-DEPLOY-AIRBAG-LEDGER-2026-03-04.md | Prova READ-ONLY: código do airbag, SHA (a4b2e54), release Fly v312, conclusão de que o airbag está em produção. |
| OBSERVABILIDADE-LEDGER-AIRBAG-2026-03-04.md | Melhoria de log: inclusão de details/hint no airbag (truncados, sem dados sensíveis). |
| VALIDACAO-E2E-WITHDRAW-LEDGER-FINAL-2026-03-04.md | Este arquivo: instruções operacionais e checklist PASS/FAIL. |

Nenhuma alteração foi feita em /game, Vercel ou workflows. Alterações no backend: apenas a melhoria de observabilidade no log do airbag (1 commit recomendado).
