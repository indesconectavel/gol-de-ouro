# AUDITORIA LOCAL — PENDÊNCIAS CRÍTICAS

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO (nenhuma alteração realizada)  
**Escopo:** Ambiente local — goldeouro-player (frontend) + goldeouro-backend (server-fly.js)

---

## 1. Frontend — erro de compilação

### 1.1 Arquivo analisado

- **Caminho:** `goldeouro-backend/goldeouro-player/src/pages/GameShoot.jsx`
- **Versão no repositório:** 382 linhas (v1.2.0-final-production)

### 1.2 Região próxima à linha 510 e à zona de "Campo de Futebol"

O erro relatado ("Adjacent JSX elements must be wrapped") costuma ocorrer quando há dois ou mais elementos JSX irmãos sem um único elemento pai (ou Fragment) no mesmo `return`.

Na versão atual do arquivo **não há 510 linhas**; a análise foi feita na estrutura completa, com foco na zona de "Campo de Futebol" e no bloco "Tente novamente" (linhas 365–340), que é a região mais sensível a esse tipo de erro.

**Estrutura verificada (linhas 329–342):**

- **329–331:** `return` com um único elemento raiz: `<div className="min-h-screen ...">` → OK.
- **332:** `<div className="p-6">` — container principal do conteúdo.
- **334–354:** bloco Header (abertura/fechamento consistentes).
- **356–363:** bloco "Valor do Chute" (abertura/fechamento consistentes).
- **365–335:** bloco "Campo de Futebol":
  - **365:** abre `<div>` do Campo.
  - **366–319:** div "relative mx-auto" e div "absolute inset-0" fechadas em 318–319.
  - **321–334:** condicionais de animação (showGoool, showDefendeu, showGoldenGoal) dentro do mesmo bloco do Campo.
  - **335:** `</div>` — fecha o div do "Campo de Futebol" (linha 365).
- **336–339:** bloco "Tente novamente" (`showTryAgain && ...`) — irmão do bloco Campo, ainda dentro de `<div className="p-6">`.
- **340:** `</div>` — na árvore lógica fecha o `<div className="p-6">` (linha 332).

### 1.3 Causa exata do erro (inferida)

- **Não foi reproduzido** um "Adjacent JSX elements" na cópia atual (382 linhas). É possível que:
  1. O ambiente local tenha uma versão diferente (por exemplo, com mais linhas, perto de 510), ou  
  2. O erro esteja em **outro arquivo** que importa/usa GameShoot, ou  
  3. O problema seja de **indentação/nesting** que em outro contexto (ex.: build diferente, outra linha) o compilador interprete como irmãos sem wrapper.

**Risco estrutural identificado:** entre as linhas **335 e 340** há dois `</div>` seguidos do bloco condicional "Tente novamente". Dependendo do linter/compilador e da indentação, isso pode ser interpretado como fechamento incorreto ou elementos adjacentes mal aninhados. A zona **335–342** é a mais provável para esse tipo de falha se o erro reaparecer.

### 1.4 Conclusão — GameShoot.jsx

| Pergunta | Resposta |
|----------|----------|
| Causa exata do erro? | Na versão analisada não há "Adjacent JSX" explícito; a causa mais provável é **nesting/indentação** na região **335–340** (fechamento do "Campo de Futebol" + bloco "Tente novamente" + `</div>` do `p-6`). |
| Erro localizado ou estrutural? | **Localizado** naquele bloco; não indica, na cópia atual, problema amplo de arquitetura do arquivo. |
| Mais de um erro JSX no projeto? | Não foi encontrado outro arquivo com o mesmo padrão de erro nesta auditoria; relatórios antigos citam correção semelhante em **Dashboard.jsx** (divs não fechadas / indentação). |

---

## 2. Frontend — estado geral do projeto

### 2.1 Arquivos verificados

- **App.jsx:** Rotas e providers consistentes; import de GameShoot e demais páginas correto.
- **GameShoot.jsx:** Conteúdo e imports (gameService, apiClient, API_ENDPOINTS, Logo) existentes e coerentes.
- **package.json (player):** React 18, Vite 5, react-router-dom, react-toastify; scripts `dev` e `build` configurados.
- **Rotas protegidas:** Dashboard, GameShoot, Profile, Withdraw, Pagamentos usam `ProtectedRoute`; sem referência a sidebar removida no App principal.

### 2.2 Imports e dependências

- Não foram encontrados imports quebrados nos arquivos lidos.
- Não há evidência de componente "órfão" crítico nas páginas principais.
- **Observação:** `middlewares/authMiddleware.js` do backend usa `require('./config/env')`; do diretório `middlewares/` isso resolve para `middlewares/config/env.js`, que **não existe**. O **server-fly.js** não usa esse middleware (possui `authenticateToken` próprio), portanto o boot do backend não é afetado por esse require.

### 2.3 Resposta — estado geral

| Pergunta | Resposta |
|----------|----------|
| Além do erro em GameShoot.jsx, há outras pendências críticas no frontend? | Não foram identificadas outras **pendências críticas** nos arquivos analisados (App, GameShoot, package.json). |
| O restante das páginas parece estável? | Sim; estrutura de rotas e componentes está coerente. Qualquer outro erro de compilação deve ser confirmado com o build local (`npm run build`) e com a versão exata do GameShoot (e eventualmente Dashboard) no ambiente onde falha. |

---

## 3. Backend — erro de inicialização

### 3.1 Onde MERCADOPAGO_DEPOSIT_ACCESS_TOKEN é exigido

- **Arquivo:** `config/required-env.js`
- **Uso no boot:** `server-fly.js` (linhas 52–55):

```js
const { assertRequiredEnv, isProduction } = require('./config/required-env');
assertRequiredEnv(
  ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
  { onlyInProduction: ['MERCADOPAGO_DEPOSIT_ACCESS_TOKEN'] }
);
```

- **Lógica em `required-env.js`:**
  - Variáveis em `requiredKeys` são sempre validadas.
  - Variáveis em `onlyInProduction` são validadas **apenas** quando `NODE_ENV === 'production'`.

### 3.2 Conclusão sobre MERCADOPAGO_DEPOSIT_ACCESS_TOKEN

- **Ambiente local com NODE_ENV ≠ production (ou não definido):** o backend **não** exige `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` no startup; o servidor pode subir só com as três variáveis obrigatórias.
- **Ambiente local com NODE_ENV=production:** o backend **exige** `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN`; se estiver ausente, o processo lança e não sobe.

### 3.3 Arquivo que bloqueia o start por env

- **Bloqueio por env:** `config/required-env.js` (chamado por `server-fly.js` nas linhas 53–55).
- **Mensagem de erro:** `Variáveis de ambiente ausentes: <lista>` (ex.: `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` se em produção).

### 3.4 Variáveis obrigatórias para o backend local subir

| Contexto | Obrigatórias |
|----------|-------------------------------|
| **Sempre (desenvolvimento e produção)** | `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Somente se NODE_ENV=production** | `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` |

O **server-fly.js** **não** carrega `config/env.js` (envalid) no boot; apenas `required-env.js`. Portanto, para o processo subir em local, **não** são exigidos no startup: `ADMIN_TOKEN`, `DATABASE_URL`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET` (esses entram apenas se algum código carregar `config/env.js`).

Após o boot, a conexão Supabase é validada por `database/supabase-unified-config.js` (`validateSupabaseCredentials`), que também usa `SUPABASE_ANON_KEY`; se essa validação falhar na subida, a aplicação pode não ficar utilizável, mas o **assert** que impede o start é só o de `required-env.js`.

### 3.5 Backend parcial

- **Não.** A validação é **rígida**: se alguma variável obrigatória (ou `onlyInProduction` em produção) faltar, o Node lança antes de abrir a porta; não há "modo parcial" de inicialização.

---

## 4. Impacto por bloco

| Bloco | Descrição | Impacto do frontend não compilar | Impacto da falta de env no backend |
|-------|-----------|-----------------------------------|-------------------------------------|
| **A — Financeiro** | Depósito/saque PIX, saldo, reconciliação | Bloqueado (sem app não há fluxo de depósito/saque no player). | Em **produção**: depósito PIX bloqueado sem `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN`. Em **local** (NODE_ENV≠production): backend sobe; depósito pode falhar em runtime se o token não estiver definido. |
| **B — Sistema de apostas** | Chutes, lotes, engine | Bloqueado (GameShoot é a tela principal de jogo). | Não bloqueado no startup; fluxo de chutes depende de backend já de pé. |
| **C — Conta do usuário** | Login, perfil, registro | Bloqueado (sem build não há tela de login/perfil). | Não bloqueado no startup. |
| **D — Sistema de saldo** | Saldo, ledger, triggers | Bloqueado (sem frontend não há uso do saldo na UI). | Não bloqueado no startup; depende de Supabase (e, em prod, de env de depósito se for creditar). |
| **E — Gameplay** | GameShoot, animações, gol de ouro | **Totalmente bloqueado** pelo erro de compilação em GameShoot (ou região equivalente). | Não bloqueado no startup. |
| **F — Interface** | Navegação, páginas, layout | Bloqueado (build quebra antes de servir a interface). | Não bloqueado no startup. |
| **G — Fluxo do jogador** | Navegação completa: login → dashboard → jogo → pagamentos/saque | Bloqueado (sem frontend compilado não há fluxo). | Em local sem NODE_ENV=production: não bloqueado no startup; em produção sem token de depósito: fluxo de depósito bloqueado. |

### Resumo

- **Bloqueados diretamente pelo erro local do frontend:** B, C, D, E, F, G (e indiretamente A, pois não há UI de depósito/saque).
- **Bloqueados diretamente pela falta de env no backend:** em **local** com NODE_ENV=production, falta de `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` bloqueia o **start** do backend (e assim todos os blocos que dependem da API). Em local com NODE_ENV≠production, o backend sobe; o fluxo de **depósito PIX (Bloco A)** pode falhar em runtime se o token não estiver definido.
- **Validados independentemente do problema local:** Nenhum bloco fica totalmente validado no ambiente local enquanto o frontend não compilar e, se aplicável, o backend não subir (por env em produção).

---

## 5. Ordem segura de correção

1. **Backend (env) — primeiro, se o backend não sobe**
   - Se o ambiente local estiver com **NODE_ENV=production** e o backend não iniciar por falta de `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN`:
     - Definir a variável no `.env` local (valor de teste ou real), **ou**
     - Garantir **NODE_ENV=development** (ou não definir NODE_ENV) para desenvolvimento local, para que o token não seja obrigatório no boot.
   - Garantir sempre: `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (e, se usar `supabase-unified-config`, `SUPABASE_ANON_KEY` para evitar falhas na validação de credenciais).

2. **Frontend (GameShoot.jsx) — em seguida**
   - Corrigir a região **335–340** em `GameShoot.jsx`:
     - Garantir um **único elemento raiz** no `return` e que o bloco "Tente novamente" (336–339) esteja claramente dentro do mesmo pai que o "Campo de Futebol", sem `</div>` sobrando ou mal alinhados.
     - Se o erro no ambiente for em outra linha (ex.: ~510), aplicar a mesma regra: um único pai (ou Fragment) para todos os irmãos e fechamento correto de todas as tags.
   - Rodar `npm run build` no goldeouro-player para confirmar que não há outros erros JSX.

3. **Ordem recomendada**
   - **Se o backend não sobe:** primeiro ajustar env (ou NODE_ENV); depois corrigir GameShoot.jsx e validar o build.
   - **Se o backend já sobe:** corrigir primeiro GameShoot.jsx (e qualquer outro erro de build) e depois validar o fluxo completo.
   - Evitar alterar várias páginas ou a estrutura de rotas ao mesmo tempo; manter a correção focada em GameShoot (e env, se necessário) reduz o risco de regressão no que já foi validado.

---

## 6. Decisão final

- **O sistema local está bloqueado por problemas simples e localizados?**  
  **Sim.** Na análise feita:
  - Backend: bloqueio por **uma regra de env** (obrigatório apenas em produção) ou por uso de **NODE_ENV=production** em local.
  - Frontend: bloqueio por **um problema de estrutura JSX** na região do "Campo de Futebol" / "Tente novamente" em GameShoot.jsx (e possivelmente em outra linha se a versão local tiver ~510 linhas).

- **Há sinais de problemas maiores?**  
  **Não.** Não foram encontrados múltiplos erros JSX em outros arquivos, nem falhas de arquitetura no backend além da validação de env já documentada. O middleware `authMiddleware.js` que usa `./config/env` está incorreto de path, mas não é carregado pelo server-fly.js.

- **Próximo passo recomendado:**
  - **A) GameShoot.jsx** — se o **frontend não compila** e o backend já sobe: atacar primeiro a região 335–340 (e, se existir, a zona próxima à linha 510) em GameShoot.jsx, garantindo um único pai e fechamentos corretos.
  - **B) .env/backend** — se o **backend não sobe** (erro de variáveis ausentes): ajustar primeiro .env (ou NODE_ENV) para que `assertRequiredEnv` passe; em seguida corrigir GameShoot.jsx.
  - **C) Ambos em sequência** — se **os dois** falham: primeiro backend (env / NODE_ENV), depois frontend (GameShoot.jsx), conforme a ordem acima.

**Justificativa técnica:** O bloqueio do backend é determinístico (assert no carregamento de `required-env.js`). O bloqueio do frontend é sintático/estrutural em um único arquivo (GameShoot.jsx), na zona de fechamento de divs e bloco condicional. Resolver nessa ordem evita alterações desnecessárias e reduz risco de regressão.

---

## Classificação final

**PROBLEMAS LOCALIZADOS E CORRIGÍVEIS**

- Backend: validação de env em um único ponto (`required-env.js`); comportamento em produção vs desenvolvimento claro.
- Frontend: erro de compilação restrito a uma região de GameShoot.jsx (e possivelmente a uma linha ~510 em outra versão do mesmo arquivo), sem indícios de quebra generalizada de JSX no projeto.

---

*Auditoria realizada em modo read-only; nenhum arquivo foi alterado.*
