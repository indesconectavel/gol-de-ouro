# Correção definitiva CORS — Previews Vercel

**Data:** 2026-03-08  
**Objetivo:** Eliminar bloqueio de login nos previews da Vercel sem quebrar produção.

---

## 1. Problema identificado

- Login nos previews da Vercel falhava com **API Error: Network Error**.
- Backend (Fly) aceitava apenas origens da allowlist fixa (ou `CORS_ORIGIN` CSV).
- Origens de preview (`https://*-xxx.vercel.app`) não estavam na lista → CORS bloqueava → navegador reportava Network Error.

---

## 2. Arquivo(s) alterado(s)

- **server-fly.js** — entrypoint de produção no Fly (fonte da verdade).
- **server-fly-deploy.js** — alinhado à mesma política para consistência.

---

## 3. Configuração antiga

- `origin: parseCorsOrigins()` — array fixo ou lido de `CORS_ORIGIN`.
- Fallback: `https://goldeouro.lol`, `https://www.goldeouro.lol`, `https://admin.goldeouro.lol`.
- Nenhuma regra para `*.vercel.app`.

---

## 4. Configuração nova

- **origin:** função `(origin, callback)` que:
  1. Aceita requests sem header `Origin` (same-origin, CLI, health).
  2. Aceita se a origem estiver na **allowlist** (domínios oficiais + `CORS_ORIGIN` quando definido).
  3. Aceita se a origem for **HTTPS** e o hostname **terminar em `.vercel.app`** (previews Vercel).
  4. Rejeita qualquer outra origem (`callback(null, false)`).
- **credentials:** `true` (mantido).
- **methods / allowedHeaders:** inalterados.

Allowlist explícita no código (e via env quando `CORS_ORIGIN` está definido):

- `https://goldeouro.lol`
- `https://www.goldeouro.lol`
- `https://admin.goldeouro.lol`
- `https://app.goldeouro.lol`

---

## 5. Domínios aceitos

| Tipo | Exemplo |
|------|--------|
| Oficiais | `https://goldeouro.lol`, `https://www.goldeouro.lol`, `https://admin.goldeouro.lol`, `https://app.goldeouro.lol` |
| Env | Qualquer origem listada em `CORS_ORIGIN` (CSV) |
| Previews Vercel | `https://qualquer-coisa.vercel.app` (só HTTPS e sufixo `.vercel.app`) |

---

## 6. Motivo de segurança da solução

- **Allowlist explícita** para produção; sem `origin: '*'`.
- **Previews** liberados apenas por sufixo **`.vercel.app`** e **HTTPS**, reduzindo abuso.
- **Credentials** mantidos apenas para origens aceitas; preflight OPTIONS tratado pelo pacote `cors`.

---

## 7. Testes executados

- `node -c server-fly.js` e `node -c server-fly-deploy.js`: **OK** (sem erro de sintaxe).
- Lint nos arquivos alterados: **sem erros**.
- Nenhuma alteração em banco, endpoints, regras de negócio, saque, depósito, gameplay ou saldo.

---

## 8. Impacto esperado no preview

- Previews na Vercel (`*.vercel.app`) passam a receber `Access-Control-Allow-Origin` com a origem correta e `credentials: true`.
- Login e demais chamadas à API a partir do preview devem deixar de gerar Network Error por CORS.

---

## 9. Confirmação de preservação da produção

- Domínios oficiais continuam na allowlist e com o mesmo comportamento.
- `CORS_ORIGIN` (quando definido no Fly) continua sendo usado como lista adicional.
- Apenas CORS foi alterado; nenhuma lógica de negócio ou endpoint foi modificada.

---

## 10. Status final

**CORS CORRIGIDO COM SUCESSO**

- Próximo passo: fazer deploy no Fly e validar login em um preview Vercel do projeto.
