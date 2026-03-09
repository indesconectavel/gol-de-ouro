# CHANGE #5 — CSP Report-Only no Helmet (backend)

**Data:** 2026-02-06  
**Objetivo:** Destravar CodeQL sem risco de quebrar login/jogo, substituindo `contentSecurityPolicy: false` por CSP em modo Report-Only no Helmet (apenas backend).

---

## Por que o CSP estava desativado

- **Contexto informado pelo time:** O CSP foi desativado no passado por pragmatismo V1: evitar que o header CSP (enforce) do backend interferisse em erros no frontend (player no Vercel) ou em fluxos de login/jogo durante a estabilização.
- **Evidência no código:** Em `server-fly.js` (linhas 208–215, antes do patch) o Helmet estava configurado com `contentSecurityPolicy: false`, o que desliga completamente o envio do header e é sinalizado pelo CodeQL como configuração insegura.

---

## Evidência do CodeQL

- **Arquivo:** `server-fly.js`  
- **Trecho:** linhas **208–215** (configuração do Helmet).  
- **Alerta:** "Insecure configuration of Helmet security middleware — security setting contentSecurityPolicy set to 'false'".

---

## Antes / Depois do patch

**Antes:**

```javascript
app.use(helmet({
  contentSecurityPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

**Depois:**

```javascript
app.use(helmet({
  contentSecurityPolicy: {
    reportOnly: true,
    useDefaults: true,
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
      connectSrc: ["'self'", "https:", "wss:"],
      fontSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

- Nenhuma outra parte do Helmet (HSTS, etc.) ou do servidor (rotas, CORS, PIX, auth, login, worker, banco) foi alterada.

---

## Por que Report-Only não quebra login/jogo

- **Report-Only** envia o header `Content-Security-Policy-Report-Only`. O navegador **não bloqueia** nenhuma requisição ou script por causa dele; apenas reporta violações (se houver endpoint de report configurado). Não há enforcement.
- O backend serve **API (JSON)**; o player é servido pelo **Vercel**. O CSP do backend aplica-se às respostas da API. Como não há bloqueio em report-only, login, jogo e qualquer chamada ao backend continuam funcionando como antes.
- Assim, destravamos o CodeQL (não há mais `contentSecurityPolicy: false`) sem risco de regressão em login ou jogo.

---

## Validação local

- **Dependências:** `npm install` executado com sucesso.
- **Servidor:** Backend subiu em modo development (porta 9080) com variáveis mínimas; sem crash.
- **GET /health:**
  - Status: **200**
  - **Content-Security-Policy-Report-Only:** presente (diretivas default-src, base-uri, object-src, frame-ancestors, img-src, style-src, script-src, connect-src, font-src, etc.).
  - **Content-Security-Policy** (enforce): **não** aparece na resposta — conforme esperado.
- **POST /api/auth/login:** Endpoint responde (400 com body inválido); rota de login disponível. Teste completo de login (credenciais reais + token) requer ambiente com Supabase e frontend; o backend não bloqueia nenhum recurso por ser report-only.

**Limitação registrada:** O teste de login completo (fluxo até token e sessão) depende de ambiente com player e credenciais reais; a validação local limitou-se a confirmar que o servidor sobe, que o header Report-Only está presente, que o header enforce não está presente e que a rota de login responde.

---

## Rollback

### Opção A — Revert do commit (recomendado em branch compartilhado)

```powershell
git revert d67f6b55c9404ff9dc2c577480487214e6464572 --no-edit
git push
```

Isso cria um novo commit que desfaz apenas a alteração do CSP, voltando a `contentSecurityPolicy: false`.

### Opção B — Reset local para tag PRE (evitar force push em branch compartilhado)

```powershell
git checkout feat/payments-ui-pix-presets-top-copy
git reset --hard PRE_CHANGE5_CSP_REPORTONLY_2026-02-06_0305
# Cuidado: git push --force só se for aceitável para o repositório/branch
```

---

## Tags e commit

| Item | Valor |
|------|--------|
| **Tag PRE** | `PRE_CHANGE5_CSP_REPORTONLY_2026-02-06_0305` |
| **Tag DONE** | `CHANGE5_CSP_REPORTONLY_DONE_2026-02-06_0305` |
| **Commit (CHANGE #5)** | `d67f6b55c9404ff9dc2c577480487214e6464572` |
| **Mensagem** | `fix(security): CSP report-only no helmet (destravar CodeQL sem regressão)` |

---

## Confirmações

- Uma única mudança (bloco Helmet em `server-fly.js`).
- Frontend não foi alterado.
- Deploy não foi executado.
- Commit isolado, tags PRE e DONE criadas e enviadas ao origin.
