# AUDITORIA PÓS-PROMOÇÃO — VALIDAÇÃO FINAL PARA PIX

**Data / hora da recolha de evidências:** 2026-03-28 (pedidos HTTP e `vercel inspect` executados no mesmo dia, ~UTC conforme cabeçalhos `Date` das respostas).  
**Modo:** READ-ONLY — sem alteração de código, deploy ou configuração.  
**Referência documental anterior:** `docs/relatorios/AUDITORIA-FORENSE-DEPLOY-CORRETO-CURRENT-PLAYER-2026-03-27.md` (estado *antes* desta verificação: Production em `dpl_FyKK…`, candidato `dpl_5nY2…` com artefactos `index-BkwLfIcL.js` / `index-yFQt_YUB.css`).

---

## 1. Resumo executivo

| Pergunta | Resposta |
|----------|----------|
| **O domínio principal está a servir o deploy / build correcto (artefactos certificados)?** | **Sim**, no que respeita a **conteúdo público verificável:** `www` e `app` servem o mesmo `index.html` (mesmo `ETag`, mesmo `Content-Length`) e os mesmos ficheiros **`/assets/index-BkwLfIcL.js`** e **`/assets/index-yFQt_YUB.css`** — os mesmos **hashes de ficheiro** que o relatório forense associou ao candidato correcto (`dpl_5nY2…`). |
| **O “deploy promovido” é exactamente o id `dpl_5nY2…`?** | **Não.** O `vercel inspect https://app.goldeouro.lol` nesta sessão resolve **Production** para **`dpl_9VbFmLgX8UMpUfefsp5qHRb5GqiU`**, criado **2026-03-28 01:43:16 -03**. Os **artefactos** coincidem com o pacote certificado anterior; o **id de deployment** mudou (nova promoção / novo deployment). |
| **O frontend reflectido nos artefactos públicos é o estado actual (HUD /game, CSP)?** | **Sim**, por evidência estática: CSP com Posthog + GTM (alinhado ao `vercel.json` actual); CSS contém **`body[data-page=game] .hud-header .brand-small .brand-logo-small` com `200px`** — não a assinatura antiga **150px**-only do Production defasado. |
| **Sistema seguro para iniciar teste PIX real?** | **NO-GO nesta auditoria para “PIX real”** — ver secção 9. Motivo: embora **artefactos e domínios** estejam alinhados, **não foi feita** aqui a verificação **autenticada** (login, `/dashboard`, `/game` em runtime) exigida pelos documentos operacionais; sem esse registo, aplica-se a regra **incerteza residual → bloqueio financeiro**. |

---

## 2. Domínios analisados

### `https://goldeouro.lol`

| Verificação | Resultado |
|-------------|-----------|
| **HTTP** | **307** `Temporary Redirect` → `Location: https://www.goldeouro.lol/` |
| **HTML com assets** | O **apex** não devolve a SPA directamente; o cliente deve seguir o redirect. Com `curl -L` (seguir redirect), a resposta final é a mesma que `www` (abaixo). |
| **Observações** | Comportamento normal; **não** há divergência de build entre apex e `www` após seguir o redirect. |

### `https://www.goldeouro.lol`

| Verificação | Resultado |
|-------------|-----------|
| **HTTP** | **200 OK** |
| **Headers relevantes** | `Content-Length: 1299`; `Last-Modified: Sat, 28 Mar 2026 04:45:50 GMT`; `ETag: "282a8378ce167f3754436db0e5913989"`; `Cache-Control: no-cache, no-store, must-revalidate`; `X-Vercel-Cache: HIT`; `Age` ~86–128 s (amostra na sessão); CSP inclui `posthog` e `googletagmanager`. |
| **Assets no HTML** | `src="/assets/index-BkwLfIcL.js"`; `href="/assets/index-yFQt_YUB.css"` |
| **Observações** | Conteúdo alinhado ao build certificado (mesmos nomes de artefactos que o relatório forense para o candidato `dpl_5nY2…`). |

### `https://app.goldeouro.lol`

| Verificação | Resultado |
|-------------|-----------|
| **HTTP** | **200 OK** |
| **Headers relevantes** | **Idênticos** a `www` na amostra: mesmo `Content-Length`, `ETag`, `Last-Modified`, mesma CSP. |
| **Assets no HTML** | **Idênticos** a `www`: `index-BkwLfIcL.js`, `index-yFQt_YUB.css` |
| **Observações** | **Sem divergência** entre `app` e `www` nos dados recolhidos. |

---

## 3. Artefactos identificados

| Tipo | Nome (hash de conteúdo Vite no nome do ficheiro) |
|------|---------------------------------------------------|
| **JS principal** | `index-BkwLfIcL.js` |
| **CSS principal** | `index-yFQt_YUB.css` |

*(Os “hashes” são os sufixos no nome do ficheiro gerado pelo build, não SHA-256 calculado localmente nesta auditoria.)*

---

## 4. Comparação com deploy promovido (referência `dpl_5nY2…`)

| Critério | Resultado |
|----------|-----------|
| **Deployment id Vercel** | **Não bate** literalmente: Production actual = **`dpl_9VbFmLgX8UMpUfefsp5qHRb5GqiU`**; documentação anterior citava **`dpl_5nY2hnkbnCbbCtS9zVyPv3cyv8q5`**. |
| **Nomes dos artefactos JS/CSS** | **Batem 100%** com o candidato certificado na auditoria forense (`BkwLfIcL` / `yFQt_YUB`). |
| **Interpretação** | **Parcial no id**, **total nos fingerprints de artefactos públicos.** Indica **nova** atribuição de Production a um deployment **distinto** mas com o **mesmo output** de build (ou rebuild equivalente). **Não** há evidência de servir o pacote antigo (`qIGutT6K` / `lDOJDUAS`). |

---

## 5. Evidências de consistência (frontend actualizado)

1. **Três hostnames** (`goldeouro.lol` após redirect, `www`, `app`) convergem para o **mesmo** par de artefactos `BkwLfIcL` / `yFQt_YUB`.
2. **`ETag` e `Last-Modified`** iguais entre `www` e `app` — sem indício de **mistura** de versões entre esses hosts.
3. **CSP** inclui `https://us-assets.i.posthog.com` e `https://www.googletagmanager.com` — alinhado ao estado “novo” descrito na auditoria forense e **distinto** do HTML antigo de Production (`dpl_FyKK…`).
4. **CSS** descarregado de `https://app.goldeouro.lol/assets/index-yFQt_YUB.css` contém texto verificável:  
   `body[data-page=game] .hud-header .brand-small .brand-logo-small{width:200px!important;...}` — evidência de **HUD /game** na linha certificada, **não** só logo 150px global como no build defasado.
5. **`vercel inspect https://app.goldeouro.lol`:** `target production`, `status Ready`; aliases de produção listados incluem os domínios `goldeouro.lol` / `www` / `app`.

---

## 6. Evidências de inconsistência

| Item | Gravidade | Nota |
|------|-----------|------|
| **Id de deployment ≠ `dpl_5nY2…`** | Baixa para artefactos, média para **rastreio documental** | Quem valida apenas o id antigo no papel pode achar inconsistência; a **verdade operacional** do browser é o par **JS/CSS** + **inspect** actual. **Actualizar** runbooks com **`dpl_9VbFm…`** após esta promoção. |
| **Cache CDN** | Monitorização | `X-Vercel-Cache: HIT` com `Age` baixo (minutos) e `Last-Modified` **do próprio dia** — **não** indica cache **antigo** de Março anterior; continua a recomendação de hard refresh em QA humano. |
| **Fluxo autenticado não testado nesta auditoria** | Alta para **GO PIX** | Não verificado: login, `/game` interactivo, PIX UI — ver secção 9. |

Não foi detectada divergência de artefactos entre `www` e `app`.

---

## 7. Verificação de backend (bundle)

- No ficheiro `index-BkwLfIcL.js` servido em `app.goldeouro.lol`, verificou-se presença de **`https://goldeouro-backend-v2.fly.dev`** (incl. em `production.API_BASE_URL` e fallback em interceptor).
- Endpoints relativos observáveis no mesmo extracto incluem rotas **`/api/payments/pix/...`**, **`/api/auth/...`**, coerentes com o cliente actual — **sem** evidência nesta amostra de base “onrender” antiga como default de produção para o hostname `goldeouro.lol`.

---

## 8. Riscos detectados

| Risco | Estado |
|-------|--------|
| **CDN a servir build antigo** | **Não sustentado** pelas evidências: artefactos e `Last-Modified` recentes. |
| **Alias não propagado** | **Não evidenciado:** `inspect` mostra os três domínios no mesmo deployment Production. |
| **Múltiplos builds entre domínios** | **Não evidenciado** entre `www` e `app`. |
| **Documentação desactualizada (id `dpl_5nY2…`)** | **Sim** — risco de **erro humano** em checklists que ainda exijam esse id; **corrigir** para `dpl_9VbFm…` ou para critério “**artefactos BkwLfIcL + yFQt_YUB** + branch/SHA no painel”. |
| **PIX sem smoke autenticado** | **Risco residual** se se avançar para dinheiro real só com esta auditoria estática. |

---

## 9. Veredito GO / NO-GO

### NO-GO — PIX BLOQUEADO

*(Escolha única, conforme solicitado.)*

---

## 10. Justificativa do veredito

- **GO técnico (artefactos + domínio + backend no bundle):** cumprido. Os domínios públicos servem o par **`index-BkwLfIcL.js` / `index-yFQt_YUB.css`**, coerente com o estado certificado na auditoria forense; o CSS contém regras **`/game`** com logo **200px**; o bundle referencia **`goldeouro-backend-v2.fly.dev`**; `www` e `app` estão alinhados.
- **Bloqueio para PIX real:** esta auditoria **não executou** o smoke **autenticado** obrigatório (`docs/operacional/CHECKLIST-PROMOCAO-DEPLOY-PLAYER-ANTES-DO-PIX-2026-03-28.md`, Etapa 3). Pela regra **“qualquer incerteza → NO-GO”** para operações financeiras, e porque o comportamento **runtime** (sessão, `/game`, fluxo de pagamento) não foi observado aqui, o **teste PIX real** permanece **bloqueado** até esse checklist estar **concluído e registado**.
- O **deployment id** actual (**`dpl_9VbFm…`**) difere do exemplo **`dpl_5nY2…`**; isso **não** invalida os artefactos, mas exige **reconciliação documental** para evitar falsos NO-GO por id desactualizado em papel.

---

## 11. Próxima acção obrigatória

| Veredito | Acção |
|----------|--------|
| **NO-GO (actual)** | Executar **na íntegra** a **Etapa 3** (e, se aplicável, **Etapa 4**) do checklist operacional — login, dashboard, `/game`, HUD, layout — em **`https://app.goldeouro.lol`** (ou domínio oficial), **registar** executor/data. **Actualizar** referências internas ao deployment id para **`dpl_9VbFmLgX8UMpUfefsp5qHRb5GqiU`** se o painel confirmar. |
| **Transição para GO PIX** | Somente após smoke **aprovado** e, se a política interna exigir, confirmação no painel Vercel de **branch + commit SHA** desse deployment. |

---

## Anexo — Comandos úteis (reproducibilidade)

```text
curl -sI https://goldeouro.lol/
curl -sI https://www.goldeouro.lol/
curl -sI https://app.goldeouro.lol/
curl -sL https://goldeouro.lol/ | findstr assets/index
curl -s https://www.goldeouro.lol/ | findstr assets/index
vercel inspect https://app.goldeouro.lol
```

---

*Fim do relatório.*
