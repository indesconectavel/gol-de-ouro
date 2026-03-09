# Publicação correção login 500 — 2026-03-09

**Objetivo:** Publicar a correção do erro 500 no login (ReferenceError: sanitizedEmailLogin is not defined) e validar no preview.

---

## 1. Branch usada

- **Branch:** `feature/bloco-e-gameplay-certified`
- **Commit da correção:** `95bbfd0` — fix(auth): define sanitizedEmailLogin no escopo do handler de login

---

## 2. Arquivos alterados (no commit do fix)

- **server-fly.js** — Declaração de `sanitizedEmailLogin` no início do handler `POST /api/auth/login`; remoção da declaração duplicada no bloco "usuário não encontrado".

Nenhuma alteração em banco, regras de negócio, financeiro, gameplay ou main.

---

## 3. Commit criado

- **Hash:** 95bbfd0  
- **Mensagem:** `fix(auth): define sanitizedEmailLogin no escopo do handler de login`  
- O commit já existia localmente e na origin antes desta publicação.

---

## 4. Push realizado

- **Sim.** A branch `feature/bloco-e-gameplay-certified` já estava atualizada com a origin (commit 95bbfd0 já no remoto).

---

## 5. Deploy Fly realizado

- **Comando:** `flyctl deploy --app goldeouro-backend-v2`
- **Resultado:** Build e push da imagem concluídos; estratégia rolling; máquinas atualizadas (versão 320/321).
- **Imagem:** `goldeouro-backend-v2:deployment-01KK87DJ4YHRM92MXTG550E8FQ`

---

## 6. Status do /health

- **GET https://goldeouro-backend-v2.fly.dev/health** → **200**
- Body: `{"status":"ok","version":"1.2.0","database":"connected","mercadoPago":"connected",...}`

---

## 7. Status do login no preview

- **Backend:** Login inválido retorna **401** com `{"success":false,"message":"Credenciais inválidas"}` (sem 500).
- **Preview Vercel:** Validar manualmente no preview da branch `feature/bloco-e-gameplay-certified`: login válido deve retornar 200 com token e dados do usuário; login inválido 401; ausência de "Erro interno do servidor" / 500.

---

## 8. Status da /game no preview

- A validar manualmente após login no preview: abrir `/game` e confirmar que o GameFinal restaurado aparece e que o banner permanece oculto.

---

## 9. Confirmação de que produção não sofreu regressão

- Apenas o handler de login em `server-fly.js` foi alterado (escopo da variável `sanitizedEmailLogin`).
- Nenhuma alteração em rotas financeiras, saques, depósitos, gameplay ou domínios oficiais.
- /health segue 200; login inválido responde 401 em vez de 500.

---

## 10. Status final

**LOGIN 500 CORRIGIDO E PUBLICADO**

- Correção no repositório (commit 95bbfd0) e deploy no Fly realizados.
- Backend respondendo /health 200 e login (inválido) 401 sem 500.
- Validação final de login válido e /game no preview da Vercel fica a cargo do operador.
