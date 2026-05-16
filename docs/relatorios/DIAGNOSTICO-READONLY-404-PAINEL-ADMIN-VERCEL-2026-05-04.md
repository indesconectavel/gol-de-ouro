# Diagnóstico READ-ONLY — 404 no painel admin (Vercel)

**Data:** 2026-05-04  
**URL alvo:** `https://admin.goldeouro.lol/saque-usuarios`  
**Sintoma:** resposta **404 NOT_FOUND** (comportamento observado em requisição HTTP).  

**Regras desta fase:** sem alteração de código, sem deploy, sem correção de rotas — apenas diagnóstico.

---

## 1. Verificação HTTP (runtime público)

Execução **HEAD** (sessão local):

| URL | Status HTTP |
|-----|----------------|
| `https://admin.goldeouro.lol/` | **200** |
| `https://admin.goldeouro.lol/painel` | **404** |
| `https://admin.goldeouro.lol/saque-usuarios` | **404** |

**Interpretação:** o servidor que atende `admin.goldeouro.lol` **devolve HTML da SPA na raiz**, mas **não** devolve o mesmo `index.html` para caminhos profundos (`/painel`, `/saque-usuarios`). Esse padrão é típico de **deploy estático em Vercel sem rewrite SPA** (ou rewrite incompleto): o cliente pede um path que **não existe como ficheiro** em `dist/` e **não é coberto** por regra `/* → /index.html`.

---

## 2. Projeto “goldeouro-admin” no monorepo local analisado

O código frontend mais próximo do nome **`goldeouro-admin`** encontrado sob `e:\Chute de Ouro\` está na pasta **`goldeouro-admin-novo`** (alinhado com `"name": "goldeouro-admin"` em `package.json`).

### 2.1 `package.json` (`goldeouro-admin-novo/package.json`)

- **Framework:** Vite + React.
- **Scripts:** `build` → `vite build` (output por defeito `dist/`).

### 2.2 `vite.config.js`

Configuração **mínima** (plugins React apenas); **sem** `base` especial nem preview relevante ao 404 de produção.

### 2.3 `vercel.json`

**Não existe** na raiz de `goldeouro-admin-novo` (pesquisa por ficheiro — zero resultados).

Sem `vercel.json` com `rewrites`, o comportamento previsível na Vercel para uma SPA é: **só `/` e assets estáticos** resolvem; rotas “virtuais” do React Router devolvem **404** no primeiro pedido HTTP.

### 2.4 Rotas React (`src/App.jsx`)

```jsx
<Routes>
  <Route path="/" element={<Dashboard />} />
</Routes>
```

- **`BrowserRouter`** (nomeado como `Router`).
- **Única rota declarada:** **`/`**.
- **Não existe** `<Route path="/saque-usuarios" …>` nem `/painel`.

**Componente lateral:** `Sidebar.jsx` só tem link para **`/`** (`Dashboard`).

### 2.5 Conclusão quanto ao **build local analisado**

Mesmo que existisse **fallback SPA** na Vercel, o router atual **não define** `/saque-usuarios` nem `/painel`; seria necessário **componente/página + `<Route>`** (ou rotas aninhadas noutro ficheiro não presente neste snapshot minimalista).

**Nota:** o projeto deployado em produção pode ser **outro repositório/pasta** (ex.: `goldeouro-admin-acelerado`) ou branch diferente; este relatório documenta o **`goldeouro-admin-novo`** como evidência de código existente no disco.

---

## 3. Fallback SPA (Vercel)

| Verificação | Situação |
|-------------|----------|
| Rewrite global `/* → /index.html` (ou equivalente `handle` em `vercel.json`) | **Indício forte de ausência** no projeto analisado (**sem `vercel.json`** na raiz do admin-novo). |
| HTTP `/` = 200 com HTML típico Vite | **Sim** — SPA construída e servida na raiz. |
| HTTP paths client-side sem ficheiro físico | **404** — compatível com **falta de rewrite**. |

---

## 4. Deploy Vercel (projeto, branch, output, domínio)

**Não verificado automaticamente** nesta sessão (sem acesso à CLI `vercel`/dashboard nem token). Para auditoria operacional, confirmar manualmente:

1. **Projeto Vercel** ligado ao repositório correto do admin.
2. **Branch** de produção (geralmente `main`).
3. **Output:** pasta **`dist`** após `vite build` (Framework Preset Vite na Vercel).
4. **Domínio** `admin.goldeouro.lol` → mesmo projeto onde foi feito o último deploy bem-sucedido.

Referência histórica no monorepo (`goldeouro-player/AUDITORIA-DOMINIOS-STATUS.json`): menção a **`vercel.json` com rewrites não aplicado`** para domínios incluindo admin — reforça hipótese de **misconfiguration / ficheiro ausente no deploy**.

---

## 5. Causa provável (resumo)

| Camada | Causa provável |
|--------|----------------|
| **HTTP 404 em URLs profundas** | **Falta de rewrite SPA no deploy Vercel** (`vercel.json` ou configuração equivalente no dashboard). |
| **Funcionalidade `/saque-usuarios` no app** | No código **goldeouro-admin-novo** analisado, a **rota não existe** no `react-router-dom` — mesmo com rewrite, seria preciso **adicionar rota + página** (ou o build de produção vem de outro ramo com essa rota). |

**Ficheiro(s) “responsáveis” (no snapshot local):**

- Comportamento de **rotas React:** `goldeouro-admin-novo/src/App.jsx` (e eventualmente módulo de rotas inexistente nesta árvore).
- Comportamento de **404 no host:** **ausência** de `vercel.json` (ou rewrites no painel) no projeto que alimenta o deploy.

---

## 6. Checklist técnico

| Pergunta | Resposta (com base no estudo) |
|----------|--------------------------------|
| Falta `vercel.json` com rewrites? | **Sim (no `goldeouro-admin-novo` inspecionado).** |
| A rota `/saque-usuarios` existe no build analisado? | **Não** (só `/` em `App.jsx`). |
| `/` carrega? | **Sim (200).** |
| `/painel` e `/saque-usuarios` a nível HTTP? | **404** (teste direto). |

---

## 7. GO / NO-GO para **correção cirúrgica** (fase seguinte)

| Parecer | Justificativa |
|---------|----------------|
| **GO** (há o quê corrigir de forma delimitada) | Há **duas frentes** claras: (1) **rewrites Vercel** para SPA; (2) **rotas React** alinhadas às URLs do painel, incl. `/saque-usuarios` se o produto exige essa página. |
| **NO-GO** a “só corrigir React” | Só ajustar rotas **não** elimina o **404 HTTP** se o **rewrite** continuar em falta. |
| **NO-GO** a “só adicionar vercel.json” | Se o build deployado **não** tiver a rota/página, o utilizador pode deixar de ter 404 do servidor mas ver **página em branco / 404 in-app** até existir componente e `<Route>`. |

---

## Referências internas (opcional)

- `goldeouro-player/AUDITORIA-DOMINIOS-STATUS.json` — histórico sobre rewrites admin.
