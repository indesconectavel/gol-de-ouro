# Prova — FyKKeg6zb serve /game? (READ-ONLY)

**Data:** 2026-03-04  
**Modo:** Somente leitura. Nenhuma ação no Dashboard (sem promote).  
**Objetivo:** Provar se o deployment FyKKeg6zb serve /game corretamente usando a URL real do deploy.

---

## 1) URL do deployment FyKKeg6zb (FYK_URL)

**Fonte:** No Vercel Dashboard, a URL do botão "Visit" do deployment FyKKeg6zb tem o formato:

`https://goldeouro-player-<DEPLOY_ID>-goldeouro-admins-projects.vercel.app`

**FYK_URL usada nos testes (formato padrão com ID FyKKeg6zb):**

```
https://goldeouro-player-FyKKeg6zb-goldeouro-admins-projects.vercel.app
```

*(Se no Dashboard a URL do "Visit" for diferente, colar a URL real acima como FYK_URL e repetir os testes abaixo.)*

---

## 2) Testes somente leitura

**Comandos executados:**

```bash
curl -I <FYK_URL>/
curl -I <FYK_URL>/game
```

Com `FYK_URL = https://goldeouro-player-FyKKeg6zb-goldeouro-admins-projects.vercel.app`

---

## 3) Status code e headers

### GET /

| Campo | Valor |
|-------|--------|
| **Status code** | 404 Not Found |
| **X-Vercel-Error** | DEPLOYMENT_NOT_FOUND |
| **X-Vercel-Id** | gru1::vddft-1772662446380-e70a6fc03a5c |
| **X-Vercel-Cache** | (não presente) |
| **Server** | Vercel |
| **Content-Type** | text/plain; charset=utf-8 |

### GET /game

| Campo | Valor |
|-------|--------|
| **Status code** | 404 Not Found |
| **X-Vercel-Error** | DEPLOYMENT_NOT_FOUND |
| **X-Vercel-Id** | gru1::b45sz-1772662446536-0e31d2aa69fa |
| **X-Vercel-Cache** | (não presente) |
| **Server** | Vercel |
| **Content-Type** | text/plain; charset=utf-8 |

**Conclusão dos testes:** Tanto `/` quanto `/game` retornam **404** com **X-Vercel-Error: DEPLOYMENT_NOT_FOUND**. O deployment **não está acessível** nessa URL (não existe ou foi removido/expirado no contexto atual).

---

## 4) Conclusão objetiva

**FyKKeg6zb NÃO serve /game; não usar para restore.**

- `/` → 404 (DEPLOYMENT_NOT_FOUND)  
- `/game` → 404 (DEPLOYMENT_NOT_FOUND)  

Não é possível afirmar se o deployment “serviria” /game corretamente (200), pois o deployment **não está disponível** na URL testada. Para uso como restore de produção, é necessário um deployment **acessível** e que responda 200 em `/game` (e idealmente em `/`). FyKKeg6zb, na URL real usada, **não atende** a isso.

---

**Se no Dashboard existir outra URL para FyKKeg6zb (ex.: domínio diferente ou ID em outro formato):** colar essa URL como FYK_URL no relatório e repetir os passos 2 e 3. Se `/` e `/game` retornarem 200, a conclusão poderá ser atualizada para: "FyKKeg6zb OK para restaurar produção".

---

*Relatório READ-ONLY. Nenhuma ação de promote ou alteração foi executada.*
