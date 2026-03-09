# Diagnóstico Erro 500 no Login — 2026-03-09

**Objetivo:** Identificar por que o endpoint de login retornava HTTP 500 (Erro interno do servidor).

---

## 1. Endpoint de login usado

- **Principal:** `POST /api/auth/login` (frontend player/admin)
- **Compatibilidade:** `POST /auth/login` (mesmo comportamento)
- **Base URL produção:** `https://goldeouro-backend-v2.fly.dev`

---

## 2. Erro encontrado nos logs

```
❌ [LOGIN] Erro: ReferenceError: sanitizedEmailLogin is not defined
    at /app/server-fly.js:932:66
```

O erro ocorria quando o login era **bem-sucedido** (usuário existe e senha correta). Na linha do log de sucesso era usada a variável `sanitizedEmailLogin`, que só existia no escopo do bloco "usuário não encontrado".

---

## 3. Arquivo onde ocorreu

- **Arquivo:** `server-fly.js`
- **Rota:** `app.post('/api/auth/login', ...)` (a partir da linha ~858)
- **Linha do erro:** ~932 (uso de `sanitizedEmailLogin` no log de sucesso)

---

## 4. Causa real

- **Causa:** Variável `sanitizedEmailLogin` usada fora do escopo em que foi declarada.
- **Detalhe:** Ela era declarada apenas dentro do `if (userError || !user)` para o log "Usuário não encontrado". Nos fluxos de "senha inválida" e "login realizado com sucesso" a variável era usada (linhas ~893, ~912, ~931) mas não estava definida nesses caminhos → `ReferenceError` → `catch` devolvia 500.

---

## 5. Correção aplicada

- **Alteração:** Declarar `sanitizedEmailLogin` uma vez no início do handler, logo após obter `email` do `req.body`, para que exista em todos os caminhos (não encontrado, senha inválida, sucesso).
- **Código adicionado:**  
  `const sanitizedEmailLogin = typeof email === 'string' ? email.replace(/[<>\"'`\x00-\x1F\x7F-\x9F]/g, '') : String(email);`
- **Removido:** A declaração duplicada de `sanitizedEmailLogin` dentro do bloco `if (userError || !user)`.

---

## 6. Commit necessário

Sugestão de mensagem:

```
fix(auth): define sanitizedEmailLogin no escopo do handler de login

Evita ReferenceError no fluxo de login bem-sucedido que gerava HTTP 500.
```

---

## 7. Confirmação de que o login volta a funcionar

- **Local:** Sintaxe validada (`node -c server-fly.js`).
- **Produção:** Após fazer deploy da correção no Fly, o login deve responder 200 com token e dados do usuário em vez de 500. Validar com uma requisição POST para `/api/auth/login` (ou `/auth/login`) após o deploy.
