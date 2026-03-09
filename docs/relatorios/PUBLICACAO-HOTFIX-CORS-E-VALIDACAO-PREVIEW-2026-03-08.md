# Publicação Hotfix CORS e Validação Preview — 2026-03-08

**Data:** 2026-03-08  
**Objetivo:** Aplicar definitivamente a correção de CORS no backend, publicar com segurança e validar login + gameplay no preview da Vercel.

---

## 1. Objetivo

- Publicar o hotfix de CORS que permite previews `*.vercel.app` sem abrir produção.
- Validar login e `/game` no preview da Vercel após deploy no Fly.

---

## 2. Branch usada

- **Branch:** `feature/bloco-e-gameplay-certified`
- **Commit:** `a59a9df` — `fix(cors): permite previews vercel sem abrir producao`

---

## 3. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `server-fly.js` | CORS: allowlist + callback para `.vercel.app` |
| `server-fly-deploy.js` | CORS alinhado à mesma política |
| `docs/relatorios/CORRECAO-DEFINITIVA-CORS-PREVIEW-VERCEL-2026-03-08.md` | Documentação do hotfix |

Nenhum outro arquivo foi modificado. Escopo restrito a CORS e documentação.

---

## 4. Regra antiga de CORS

- **origin:** `parseCorsOrigins()` — array fixo ou lido de `CORS_ORIGIN`.
- Fallback: `https://goldeouro.lol`, `https://www.goldeouro.lol`, `https://admin.goldeouro.lol`.
- Nenhuma regra para `*.vercel.app` → previews bloqueados → **Network Error** no login.

---

## 5. Regra nova de CORS

- **origin:** função `(origin, callback)` que:
  1. Aceita requests sem header `Origin` (same-origin, CLI, health).
  2. Aceita se a origem estiver na **allowlist** (domínios oficiais + `CORS_ORIGIN` quando definido).
  3. Aceita se a origem for **HTTPS** e o hostname **terminar em `.vercel.app`** (previews Vercel).
  4. Rejeita qualquer outra origem (`callback(null, false)`).
- **credentials:** `true` (mantido).
- **methods / allowedHeaders:** inalterados.
- Allowlist explícita: `https://goldeouro.lol`, `https://www.goldeouro.lol`, `https://admin.goldeouro.lol`, `https://app.goldeouro.lol`.

---

## 6. Commit criado

- **Hash:** `a59a9dff9d15f9d6722cf7568298959351aff658`
- **Mensagem:** `fix(cors): permite previews vercel sem abrir producao`

---

## 7. Push realizado

- **Sim.** Branch `feature/bloco-e-gameplay-certified` enviada para `origin`.
- **Remote:** `https://github.com/indesconectavel/gol-de-ouro.git`
- **Ref:** `cdf2938..a59a9df  feature/bloco-e-gameplay-certified -> feature/bloco-e-gameplay-certified`

---

## 8. Status da publicação Fly

- **Ação:** Comando preparado para o operador; não executado automaticamente (requer auth e confirmação).
- **Comando exato para publicar no Fly:**
  ```powershell
  cd "e:\Chute de Ouro\goldeouro-backend"
  flyctl deploy --app goldeouro-backend-v2
  ```
- Após o deploy, o backend Fly passará a aceitar origens `*.vercel.app` e o preview poderá ser validado.

---

## 9. Checklist de validação do preview

Após o deploy no Fly, validar no preview da Vercel:

1. [ ] Abrir preview da branch `feature/bloco-e-gameplay-certified` (ou `feature/bloco-c-auth-certified`).
2. [ ] Tentar **login válido** — deve retornar token e dados do usuário; **sem** "API Error: Network Error".
3. [ ] Tentar **login inválido** — deve retornar mensagem de credenciais inválidas; **sem** Network Error.
4. [ ] Confirmar **ausência de Network Error** no console/Network do navegador.
5. [ ] Abrir rota **/game**.
6. [ ] Confirmar que o **GameFinal** restaurado aparece.
7. [ ] Confirmar que o **banner** continua oculto conforme esperado.

---

## 10. Resultado final

- **Código:** Hotfix CORS commitado e enviado para o GitHub.
- **Publicação Fly:** Pendente de execução manual do comando acima.
- **Validação preview:** A ser feita após o deploy no Fly.

**Status:** HOTFIX CORS PREPARADO E ENVIADO; PUBLICAÇÃO FLY PENDENTE DE EXECUÇÃO PELO OPERADOR.
