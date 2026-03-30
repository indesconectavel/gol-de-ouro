# Preparo do painel admin — ambiente local

Objetivo: subir backend + admin e validar login sem depender do Fly.

## 1. Variáveis — backend (raiz do repo, `.env`)

| Variável | Notas |
|----------|--------|
| `PORT` | Opcional; `server-fly.js` usa **8080** se omitido. |
| `ADMIN_TOKEN` | Mínimo 16 caracteres; **mesmo valor** que você cola no login do admin. |
| `DATABASE_URL`, `JWT_SECRET` | Obrigatórios para o servidor subir com Supabase/JWT. |
| `CORS_ORIGINS` | Deve incluir a origem do Vite (ex.: `http://localhost:5173`). Ver `.env.example`. |

## 2. Variáveis — admin (`goldeouro-admin/.env` ou `.env.local`)

| Variável | Notas |
|----------|--------|
| `VITE_API_URL` | **Sem barra final.** Ex.: `http://localhost:8080` ou `http://127.0.0.1:8080`. Deve bater com `PORT` do backend. |
| `VITE_ADMIN_TOKEN` | Opcional; só dev; **não commite**. |

## 3. Subir o backend

Na raiz do repositório:

```bash
npm start
```

(ou `node server-fly.js`). Confirme no log a porta (ex.: 8080).

## 4. Subir o admin

```bash
cd goldeouro-admin
npm install
npm run dev
```

Abra o URL que o Vite indicar (geralmente `http://localhost:5173`).

## 5. Testar login

1. Aceda a `/login`.
2. Cole o valor exato de `ADMIN_TOKEN` do `.env` do backend (≥ 16 caracteres).
3. Deve redirecionar para `/painel` e as chamadas devem ir para `GET {VITE_API_URL}/api/admin/stats` com header `x-admin-token`.

## 6. Se o browser bloquear fetch (CSP)

O `index.html` do admin permite `connect-src` para `localhost:8080` e `127.0.0.1:8080`. Se usar **outra porta** ou **HTTPS local**, acrescente essa origem em `goldeouro-admin/index.html` (meta CSP) e, se aplicável, em `goldeouro-admin/vercel.json`.

## 7. Deploy Vercel do admin

O `vercel.json` define CSP própria; já inclui a API em `https://goldeouro-backend.fly.dev` e origens locais 8080 para testes cruzados. Para uma API noutro domínio, atualize `connect-src` nesse ficheiro.
