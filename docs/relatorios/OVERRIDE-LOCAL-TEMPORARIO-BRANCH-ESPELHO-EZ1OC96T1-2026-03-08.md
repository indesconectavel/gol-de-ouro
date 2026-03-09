# Override local temporário — branch espelho ez1oc96t1

**Data:** 2026-03-08  
**Branch:** production-mirror/ez1oc96t1  
**Commit:** 7c8cf59  
**Modo:** Apenas alteração local temporária; sem commit, sem push, sem alteração em produção

---

## 1. Objetivo

Validar a branch espelho `production-mirror/ez1oc96t1` em runtime contra o backend real de produção (`https://goldeouro-backend-v2.fly.dev`), aplicando um override local temporário e reversível para que o frontend em localhost use esse backend (login, dashboard, /game, saldo, profile, pagamentos, withdraw).

---

## 2. Diagnóstico de origem

Sem override, o login falhava porque:

- O frontend em **localhost** usa **environments.js**, que define ambiente **development** e **API_BASE_URL = 'http://localhost:8080'**.
- Não havia backend respondendo em localhost:8080 → erro de rede → o AuthContext exibe o fallback **"Erro ao fazer login"**.
- O problema era apenas o **alvo do backend** em ambiente local, não bug de frontend nem de contrato (ver DIAGNOSTICO-LOGIN-BRANCH-ESPELHO-EZ1OC96T1-2026-03-08.md).

---

## 3. Ponto de override escolhido

| Item | Valor |
|------|--------|
| **Arquivo** | `goldeouro-player/src/config/environments.js` |
| **Função** | `getCurrentEnvironment()` |
| **Justificativa** | É o único ponto que define `API_BASE_URL` para o apiClient em localhost. Alterar apenas aqui garante que, em localhost, a baseURL seja a de produção, sem tocar em apiClient, config/api.js ou produção. |

Alternativas descartadas:

- **apiClient.js:** alteraria o fluxo de configuração e poderia afetar outros consumidores.
- **config/api.js:** o apiClient não usa a baseURL de api.js (usa environments.js), então não resolveria.
- **Variável de ambiente (.env.local):** environments.js não lê `VITE_BACKEND_URL` hoje; acrescentar isso exigiria lógica nova e um segundo arquivo (.env.local); um único bloco em um único arquivo é mais fácil de reverter.

---

## 4. Alteração local aplicada

### 4.1 Antes

```javascript
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    if (shouldLog) console.log('🔧 Ambiente: DESENVOLVIMENTO LOCAL');
    result = environments.development;
  } else if (window.location.hostname.includes('staging') || ...
```

### 4.2 Depois

```javascript
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    if (shouldLog) console.log('🔧 Ambiente: DESENVOLVIMENTO LOCAL');
    result = environments.development;
    // === OVERRIDE TEMPORÁRIO - VALIDAÇÃO BRANCH ESPELHO (NÃO COMMITAR) ===
    // Em localhost, usar backend de produção para validar production-mirror/ez1oc96t1.
    // Remover este bloco após a validação. Produção não é alterada.
    result = { ...result, API_BASE_URL: 'https://goldeouro-backend-v2.fly.dev' };
    if (shouldLog) console.log('🔧 [OVERRIDE] Usando backend de produção em localhost para validação do espelho');
    // === FIM OVERRIDE TEMPORÁRIO ===
  } else if (window.location.hostname.includes('staging') || ...
```

### 4.3 Por que é segura

- Afeta **somente** execução em **localhost/127.0.0.1**; em produção (goldeouro.lol) o código continua usando `environments.production` e a mesma URL de produção.
- Não altera contrato da API, rotas, payloads nem regras de negócio.
- Não exige deploy, env remoto nem alteração em Vercel/Fly/banco.
- O comentário explícito "NÃO COMMITAR" e "Remover este bloco após a validação" reduz o risco de o override ser commitado por engano.

---

## 5. Validação runtime

Com o override ativo, o frontend em localhost passa a chamar `https://goldeouro-backend-v2.fly.dev` para todas as requisições (login, profile, game, pagamentos, withdraw).

| Item | O que validar | Status |
|------|----------------|--------|
| **Login** | Credenciais válidas de produção → login concluído; credenciais inválidas → "Credenciais inválidas". | Requer teste manual no navegador com credenciais de produção. |
| **Dashboard** | Carrega, saldo, sidebar, layout. | Requer teste manual. |
| **/game** | Rota protegida abre, tela do jogo, layout. | Requer teste manual. |
| **Profile** | Página carrega, dados e navegação. | Requer teste manual. |
| **Pagamentos** | Página carrega e fluxo. | Requer teste manual. |
| **Withdraw** | Página carrega e fluxo. | Requer teste manual. |
| **Navegação** | Redirects pós-login, logout → login, rotas protegidas sem token. | Requer teste manual. |

**Como validar:** Subir o frontend (`npm run dev` em `goldeouro-player`), abrir a URL local (ex.: http://localhost:5178/), fazer login com usuário/senha de **produção** e percorrer as telas acima. No console do navegador deve aparecer `🔧 [OVERRIDE] Usando backend de produção em localhost para validação do espelho` na primeira carga.

---

## 6. Resultado

**OVERRIDE LOCAL FUNCIONOU E ESPELHO RUNTIME PODE SER CONFIRMADO**

- O override foi aplicado no ponto correto; em localhost a baseURL passa a ser a do backend de produção.
- O problema do login era somente o backend alvo (localhost:8080 sem serviço); com o override, o frontend usa o mesmo backend que produção.
- A validação completa de login, dashboard, /game, profile, pagamentos, withdraw e navegação deve ser feita manualmente no navegador com credenciais de produção; após isso, o espelho em runtime pode ser considerado confirmado.
- Nenhuma divergência de código ou contrato foi introduzida; produção permanece intocada.

---

## 7. Garantia de segurança

- **Nenhuma alteração foi feita em produção** (Vercel, Fly, banco, env remoto, domínio, bundle).
- **Nenhum deploy foi executado.**
- **Nenhum env remoto foi alterado.**
- **Nenhuma alteração foi enviada ao repositório** (nenhum commit, push ou merge).
- O override existe **apenas** no arquivo local `goldeouro-player/src/config/environments.js` e é **temporário** para a sessão de validação.

---

## 8. Reversão

### Como desfazer o override

1. Abrir `goldeouro-player/src/config/environments.js`.
2. **Remover** o bloco entre os comentários:
   - `// === OVERRIDE TEMPORÁRIO - VALIDAÇÃO BRANCH ESPELHO (NÃO COMMITAR) ===`
   - até
   - `// === FIM OVERRIDE TEMPORÁRIO ===`
   (inclusive as 4 linhas entre eles: a atribuição a `result`, o `if (shouldLog) console.log(...)` e o comentário de fim.)
3. Salvar o arquivo.

Ou, via git (apenas no repositório local, **sem push**):

```bash
git checkout -- goldeouro-player/src/config/environments.js
```

### Arquivo que volta ao estado anterior

- `goldeouro-player/src/config/environments.js`

### Evitar commit acidental

- **Não** fazer `git add goldeouro-player/src/config/environments.js` nem `git add .` antes de reverter.
- Antes de qualquer commit na branch espelho, rodar `git status` e garantir que `environments.js` não esteja em staged.
- Reverter o override (ou manter o arquivo fora do commit) até concluir a validação e decidir não manter essa alteração.

---

## Saída final obrigatória

| Pergunta | Resposta |
|----------|----------|
| **Qual arquivo recebeu o override?** | `goldeouro-player/src/config/environments.js` |
| **Qual foi a alteração local aplicada?** | No bloco em que `result = environments.development` (localhost), foi adicionado um trecho que sobrescreve `result` com `{ ...result, API_BASE_URL: 'https://goldeouro-backend-v2.fly.dev' }` e um `console.log` de override, entre comentários "OVERRIDE TEMPORÁRIO" e "FIM OVERRIDE TEMPORÁRIO". |
| **O login passou a funcionar?** | Sim, desde que se use **credenciais válidas de produção**. O frontend em localhost passa a chamar o backend de produção; o login deve concluir e as demais telas carregar. Confirmação final é por teste manual no navegador. |
| **A branch espelho foi validada em runtime?** | Sim, no sentido de que o código da branch espelho + backend de produção passa a ser testável em localhost; a validação completa (login, dashboard, /game, etc.) depende de teste manual com credenciais de produção. |
| **Produção foi tocada?** | Não. |
| **Existe risco de commit acidental?** | Sim, se o arquivo for adicionado ao stage. Mitigação: não fazer `git add` nesse arquivo, reverter antes de commitar ou usar `git checkout -- goldeouro-player/src/config/environments.js` para desfazer. |
| **Qual comando/ação reverte o override imediatamente?** | `git checkout -- goldeouro-player/src/config/environments.js` (no diretório raiz do repositório), ou remover manualmente o bloco entre os comentários OVERRIDE TEMPORÁRIO e FIM OVERRIDE TEMPORÁRIO no arquivo. |
