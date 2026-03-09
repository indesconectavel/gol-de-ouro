# Auditoria pós-rollback Vercel — Deploy FyKKeg6zb (validação read-only)

**Arquivo:** `POST-ROLLBACK-VERCEL-FyKKeg6zb-VALIDATION-2026-02-06_0431.md`  
**Data/hora:** 2026-02-06  
**Projeto:** gol-de-ouro | **Player (Vercel):** goldeouro-player  
**Deploy considerado válido em produção:** FyKKeg6zb (apenas confirmar por evidência; não alterar).  
**Regras:** Auditoria 100% read-only (sem edição de código, commit, push ou redeploy).

---

## 1. GitHub

### 1.1 SHA atual de origin/main e merge do PR #29

**Comandos executados:**
```powershell
git fetch origin main --prune
git rev-parse origin/main
git log origin/main -1 --oneline
```

**Resultado:**

| Item | Valor |
|------|--------|
| **SHA atual de origin/main** | `3ae3786e4cc1896461df4b25713adfa6d3c4ad4b` |
| **Mensagem do commit** | `3ae3786 Merge pull request #29 from indesconectavel/feat/payments-ui-pix-presets-top-copy` |

**Conclusão:** O branch `origin/main` está no merge do PR #29. **Confirmado.**

### 1.2 Workflows do SHA do merge (3ae3786)

**Comando:** `gh run list --branch main --limit 20` (filtrado por headSha = 3ae3786...)

**Runs do commit do merge:**

| workflowName | conclusion | status |
|--------------|------------|--------|
| CI | success | completed |
| 🧪 Testes Automatizados | success | completed |
| 🎨 Frontend Deploy (Vercel) | success | completed |
| 🔒 Segurança e Qualidade | success | completed |
| 🚀 Pipeline Principal - Gol de Ouro | success | completed |
| ⚠️ Rollback Automático – Gol de Ouro | skipped | completed |
| Dependabot Updates (vários) | success | completed |
| **🚀 Backend Deploy (Fly.io)** | **failure** | completed |
| **.github/workflows/configurar-seguranca.yml** | **failure** | completed |
| 🔍 Health Monitor – Gol de Ouro | success | completed |

**Failures destacados:**  
- **Backend Deploy (Fly.io)** — falha no deploy do backend no Fly para o commit do merge.  
- **configurar-seguranca.yml** — falha em workflow de configuração de segurança.

Nenhum desses workflows altera o deploy do **player** na Vercel; o **Frontend Deploy (Vercel)** está em **success**.

### 1.3 Commit/push posterior ao merge

**Comando:** `git log origin/main --oneline -15`

**Resultado:** O topo de `origin/main` é o próprio merge (3ae3786). Não há commit nem push posterior ao merge do PR #29.

**Conclusão:** Nenhum push novo em `main` que pudesse ter disparado um deploy diferente do player após o merge. O estado do repositório é estável.

---

## 2. Vercel (evidências via web/HTTP)

*Sem uso de API Vercel (sem token). Evidências obtidas apenas via respostas HTTP do domínio de produção.*

### 2.1 HTML de https://www.goldeouro.lol

**Comando:** `Invoke-WebRequest -Uri "https://www.goldeouro.lol" -UseBasicParsing`

#### Headers do HTML (raiz)

| Header | Valor |
|--------|--------|
| StatusCode | 200 |
| X-Vercel-Id | gru1::wvrgq-1770363131806-964695f20b7e |
| ETag | "66931a746a65ebfbf91afb98d2f12186" |
| Last-Modified | **Fri, 16 Jan 2026 05:25:55 GMT** |
| Cache-Control | no-cache, no-store, must-revalidate |
| Server | Vercel |

#### Primeiras 120 linhas do HTML (resumo)

O HTML retornado tem **181 linhas** (aprox.). As primeiras 120 linhas contêm:

- `<!doctype html>`, `<html lang="pt-BR">`, `<head>`
- Bloco **KILL SWITCH INLINE** (remoção de Service Workers antigos e detecção de bundle antigo)
- Lista de hashes considerados “antigos” no script: `index-DOXRH9LH.js`, `index-B74THvjy.js`, `index-BVaTwX4C.js`, `index-BK79O84G.js`, `index-Bvz1uanR.js`, `index-Duj1CNUZ.js`, `index-DtPXGL4e.js`, `index-sPoNFTTD.js`, `index-Hh8aXNzV.js`
- Início do desregistro de Service Workers e limpeza de caches

#### Trecho do HTML que contém os assets atuais (index-*.js e index-*.css)

Extraído do corpo da resposta (referências ao bundle principal):

| Tipo | URL |
|------|-----|
| JS principal | `/assets/index-qIGutT6K.js` |
| CSS principal | `/assets/index-lDOJDUAS.css` |

No HTML servido em produção aparecem as linhas (equivalentes a):

```html
<script type="module" crossorigin src="/assets/index-qIGutT6K.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-lDOJDUAS.css">
```

**Conclusão:** O build atualmente servido em produção usa o bundle **index-qIGutT6K.js** e o CSS **index-lDOJDUAS.css**, com **Last-Modified do HTML em 16 Jan 2026 05:25:55 GMT**.

### 2.2 HEAD do bundle JS principal (index-qIGutT6K.js)

**URL:** https://www.goldeouro.lol/assets/index-qIGutT6K.js  
**Método:** HEAD

| Campo | Valor |
|-------|--------|
| Status | 200 |
| ETag | "74957cc3df90f85de38e57bcc09afaf7" |
| Last-Modified | **Fri, 16 Jan 2026 05:25:34 GMT** |
| Cache-Control | no-cache, no-store, must-revalidate |
| X-Vercel-Id | gru1::5gldj-1770363173624-2131483cc756 |

### 2.3 Correspondência ao deploy FyKKeg6zb (evidência indireta)

- **Limitação:** Sem API Vercel ou acesso ao dashboard, não é possível associar de forma automática o **ID de deployment FyKKeg6zb** às respostas HTTP.
- **O que foi possível verificar:**
  - Produção está servindo um build com **data 16 Jan 2026** (Last-Modified do HTML e do JS).
  - **Hashes dos assets em produção:** JS `index-qIGutT6K.js`, CSS `index-lDOJDUAS.css`.
  - No repositório, o arquivo `prod-index.html` referencia os mesmos hashes (`index-qIGutT6K.js`, `index-lDOJDUAS.css`), o que é consistente com esse build.
- **Como confirmar que produção = FyKKeg6zb:**
  1. No **Vercel Dashboard** do projeto **goldeouro-player**, em **Deployments**, verificar se o deployment marcado como **Production** (ou “Production Current”) é **FyKKeg6zb**.
  2. Abrir o deployment FyKKeg6zb e checar se os artefatos/URLs de preview mostram os mesmos hashes (**qIGutT6K** / **lDOJDUAS**) e data compatível (16 Jan 2026). Se sim, a evidência HTTP atual é **consistente** com o deploy FyKKeg6zb.

Se o usuário puder colar um print do dashboard mostrando “Production Current = FyKKeg6zb”, isso deve ser anexado a este relatório como evidência de conclusão.

---

## 3. Produção (funcional) — rotas e /pagamentos

### 3.1 Status HTTP das rotas

**Comando:** GET para cada URL (sem seguir redirect de login; SPA devolve o mesmo shell).

| Rota | Status | Content-Length (HTML) |
|------|--------|------------------------|
| / | 200 | 8985 |
| /dashboard | 200 | 8985 |
| /game | 200 | 8985 |
| /pagamentos | 200 | 8985 |

Todas as rotas devolvem o **mesmo shell HTML** (8985 bytes), como esperado em SPA: o conteúdo visual (incluindo “Ops! Algo deu errado”) é renderizado no cliente pelo JS.

### 3.2 Mensagem “Ops! Algo deu errado” em /pagamentos

**Verificação no HTML estático:**

- `$html.Contains('Ops!')` → **False**
- `$html.Contains('Algo deu errado')` → **False**
- `$html.Contains('Something went wrong')` → **False**

**Conclusão:** A mensagem de erro **não** está no HTML estático; só pode aparecer após a execução do JS (React). Validação funcional de /pagamentos (com ou sem erro) **só é possível via browser** (com ou sem login), não por HTTP read-only.

### 3.3 Se /pagamentos estiver com “Ops! Algo deu errado” — hipóteses e o que coletar

**Hipóteses prováveis:**

| # | Hipótese | Onde verificar |
|---|----------|----------------|
| 1 | **Error boundary do React** (erro não tratado na árvore de /pagamentos) | Console: stack trace do erro; componente que quebrou. |
| 2 | **Variável de ambiente faltando** no build (ex.: `VITE_*` para API ou feature) | Build da Vercel (env vars do projeto); comparar com deployment que funcionava. |
| 3 | **Rota/feature flag** (backend ou frontend) desativando ou alterando /pagamentos | Resposta da API usada pela página (Network); config no backend. |
| 4 | **Incompatibilidade de API** (contrato quebrado, 4xx/5xx) | Aba Network: chamadas para backend (goldeouro-backend-v2.fly.dev ou outro); status e body. |
| 5 | **Mismatch de build** (cache/CDN servindo JS antigo em parte dos usuários) | Comparar hash do `<script src="/assets/index-*.js">` no DOM com o deployment esperado (FyKKeg6zb). |

**O que coletar no DevTools (quem testar no browser):**

1. **Console:** Todos os erros (vermelho) e avisos relevantes; stack traces.  
2. **Network:** Para a página /pagamentos, listar requisições com status 4xx/5xx; anotar URL, método, status e corpo da resposta (principalmente para o backend).  
3. **Application (ou Storage):** Se a app usar localStorage/sessionStorage para token ou config, verificar se as chaves esperadas existem após login.  
4. **DOM:** Verificar o valor de `document.querySelector('script[src*="index-"]')?.src` e confirmar se é `index-qIGutT6K.js` (ou o hash do deployment FyKKeg6zb).

---

## 4. VEREDITO

### 4.1 Production está ou não no estado validado (FyKKeg6zb)?

| Critério | Resultado |
|----------|-----------|
| **Evidência HTTP atual** | Produção serve build com **index-qIGutT6K.js** / **index-lDOJDUAS.css**, Last-Modified **16 Jan 2026**. Mesmos hashes que em `prod-index.html` no repo. |
| **Vínculo direto com FyKKeg6zb** | **Não verificável apenas por HTTP.** Sem API Vercel ou dashboard, não é possível afirmar que o deployment ID “FyKKeg6zb” é o que está servindo essas respostas. |

**Veredicto:**

- **Se no Vercel Dashboard** o deployment **Production (Current)** for **FyKKeg6zb** e os detalhes desse deployment mostrarem os hashes **qIGutT6K** / **lDOJDUAS** e data **16 Jan 2026**, então **sim**: produção está no estado validado (FyKKeg6zb).
- **Se** no dashboard o Production **não** for FyKKeg6zb, ou os hashes/data forem outros, então **não**: há divergência e o plano abaixo deve ser considerado.

### 4.2 Se houver divergência — plano de correção (apenas Vercel, sem mexer no Git)

- **Objetivo:** Fazer produção voltar a servir **exatamente** o deployment **FyKKeg6zb**, sem alterar código nem Git.
- **Ação:** No **Vercel Dashboard** → projeto **goldeouro-player** → **Deployments** → localizar o deployment **FyKKeg6zb** → **Promote to Production** (ou equivalente).
- **Não fazer:** Nenhum novo deploy, nenhum push/revert no repositório; nenhuma alteração em variáveis de ambiente além do estritamente necessário para o app já buildado em FyKKeg6zb.

---

## 5. PREVENÇÃO

### 5.1 Freeze / lock do deployment de produção

- **Se o Vercel oferecer:** Ativar **Production Protection** ou **Deployment Lock** para o projeto **goldeouro-player**, de forma que apenas deploys aprovados (ou com confirmação manual) sejam promovidos a Production.
- **Documentar:** Onde essa opção está no dashboard (ex.: Settings → Git ou Deployment Protection) e quem pode promover.

### 5.2 Checklist antes/depois do merge

**Antes do merge (main / release):**

- [ ] Frontend Deploy (Vercel) em **success** no commit que será mergeado.
- [ ] Anotar o **deployment ID** (ou URL de preview) do último deploy do branch que será mergeado.
- [ ] Se possível, anotar os **hashes dos assets** (index-*.js / index-*.css) do build que será promovido.

**Depois do merge / após Promote:**

- [ ] Confirmar no dashboard que **Production Current** é o deployment desejado (ex.: FyKKeg6zb).
- [ ] Conferir em produção (GET https://www.goldeouro.lol) os headers **Last-Modified** e o **src** do `<script type="module" src="/assets/index-*.js">` e comparar com os hashes esperados.
- [ ] Teste manual rápido em /, /dashboard, /game, /pagamentos (e outras rotas críticas).

### 5.3 Regra: nunca promover deployments antigos sem comparar hash dos assets

- **Regra:** Antes de dar **Promote to Production** a qualquer deployment (especialmente se for “rollback” ou deployment antigo), verificar:
  1. No deployment no Vercel: quais são os **hashes** dos arquivos em `/assets/` (ex.: index-XXXXXXXX.js, index-YYYYYYYY.css).
  2. Após o promote: fazer GET em https://www.goldeouro.lol e (se possível) HEAD em https://www.goldeouro.lol/assets/index-*.js e conferir que o **hash no DOM** e no **Last-Modified** batem com o deployment promovido.
- **Objetivo:** Evitar que produção fique com um build diferente do que se acredita (ex.: cache, deploy errado, rollback para build quebrado).

---

## 6. Apêndice — outputs brutos

### GitHub (origin/main e log)

```
git rev-parse origin/main
3ae3786e4cc1896461df4b25713adfa6d3c4ad4b

git log origin/main -1 --oneline
3ae3786 Merge pull request #29 from indesconectavel/feat/payments-ui-pix-presets-top-copy
```

### HTML — headers da raiz

```
StatusCode: 200
X-Vercel-Id: gru1::wvrgq-1770363131806-964695f20b7e
ETag: "66931a746a65ebfbf91afb98d2f12186"
Last-Modified: Fri, 16 Jan 2026 05:25:55 GMT
Cache-Control: no-cache, no-store, must-revalidate
Server: Vercel
```

### Assets extraídos do HTML

```
/assets/index-qIGutT6K.js
/assets/index-lDOJDUAS.css
```

### HEAD do bundle JS

```
Status: 200
ETag: "74957cc3df90f85de38e57bcc09afaf7"
Last-Modified: Fri, 16 Jan 2026 05:25:34 GMT
Cache-Control: no-cache, no-store, must-revalidate
X-Vercel-Id: gru1::5gldj-1770363173624-2131483cc756
```

### Rotas (status)

```
/ -> 200 (ContentLength: 8985)
/dashboard -> 200 (ContentLength: 8985)
/game -> 200 (ContentLength: 8985)
/pagamentos -> 200 (ContentLength: 8985)
```

---

*Fim do relatório. Nenhuma alteração de código, commit ou deploy foi realizada.*
