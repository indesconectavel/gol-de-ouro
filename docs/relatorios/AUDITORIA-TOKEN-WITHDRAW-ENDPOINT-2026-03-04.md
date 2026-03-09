# Qual token o endpoint de saque aceita?

**Data:** 2026-03-04  
**Objetivo:** Descobrir qual token o endpoint `/api/withdraw/request` aceita (e como `req.user` é populado).

---

## 1) Endpoint /withdraw

| Rota | Método | Middleware | Arquivo |
|------|--------|------------|---------|
| `/api/withdraw/request` | POST | **authenticateToken** | server-fly.js:1386 |
| `/api/withdraw/history` | GET | **authenticateToken** | server-fly.js:1659 |

Definição no código:

```javascript
// server-fly.js:1386
app.post('/api/withdraw/request', authenticateToken, async (req, res) => {
  // ...
  const userId = req.user.userId;  // linha 1389
  // ...
});
```

Ou seja: o handler usa **`req.user.userId`**; quem preenche `req.user` é o **authenticateToken**.

---

## 2) Middleware de autenticação usado no withdraw

O withdraw **não** usa `authMiddleware.js` (que exporta `authAdminToken` e `verifyJWT`).  
Usa o **authenticateToken** definido **dentro de server-fly.js** (linhas 340–364).

Trecho relevante:

```javascript
// server-fly.js:340-364
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];   // Bearer <token>

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token inválido' });
    }
    req.user = user;   // payload decodificado do JWT
    next();
  });
};
```

Resumo:
- Lê o token do header **Authorization** (formato **Bearer &lt;token&gt;**).
- Valida com **jwt.verify(token, process.env.JWT_SECRET)**.
- Em sucesso, faz **req.user = user** (o payload decodificado do JWT).

---

## 3) Como req.user é populado

- **req.user** = payload decodificado do JWT após **jwt.verify(token, process.env.JWT_SECRET)**.
- O handler de withdraw usa **req.user.userId** (server-fly.js:1389).

Portanto o JWT deve ter sido **assinado com o mesmo JWT_SECRET** e o payload deve conter pelo menos **userId** (e opcionalmente email, username, etc.).

---

## 4) Busca por Firebase / verifyIdToken / jwt.verify / requireAuth

| Termo | Onde aparece | Uso no withdraw? |
|-------|--------------|-------------------|
| **verifyIdToken** | Não encontrado no backend | Não |
| **firebase-admin** | Não encontrado no backend | Não |
| **jwt.verify** | server-fly.js:353 (authenticateToken), :2971 (rota debug); middlewares/authMiddleware.js:45 (verifyJWT); middlewares/auth.js:19; services/auth-service-unified.js:222; src/websocket.js:99 | No withdraw: só o **authenticateToken** em server-fly.js (jwt.verify com JWT_SECRET). |
| **authMiddleware** | middlewares/authMiddleware.js (authAdminToken, verifyJWT) | Rotas admin usam authAdminToken; **/withdraw usa authenticateToken** (definido em server-fly.js). |
| **requireAuth** | _archived_legacy_routes/backupRoutes.js | Não usado no server-fly nem no withdraw. |
| **verifyFirebaseToken** | Não encontrado | Não |

Conclusão: o endpoint de saque **não** usa Firebase nem verifyIdToken; usa apenas **jwt.verify** com **process.env.JWT_SECRET**.

---

## 5) Quem emite o JWT aceito pelo withdraw?

O backend emite JWT em:
- **POST /api/auth/login** (server-fly.js ~750, ~974): após validar email/senha no Supabase (usuarios), faz  
  `jwt.sign({ userId: user.id, email, username }, process.env.JWT_SECRET, { expiresIn: '24h' })`.
- **POST /api/auth/register** (server-fly.js ~825, ~974): após criar usuário ou login automático, mesmo payload e assinatura.

Ou seja: o token aceito pelo withdraw é o **JWT emitido pelo próprio backend** no login/registro (email + senha → Supabase → JWT com **userId**).

---

## 6) Resposta direta: qual token o endpoint de saque aceita?

- **Tipo:** JWT assinado com **process.env.JWT_SECRET** (backend).
- **Header:** `Authorization: Bearer <token>`.
- **Payload esperado:** pelo menos **userId** (UUID do usuário no Supabase). Na prática o login/register colocam também **email** e **username**.
- **Não aceita:** Firebase Id Token (getIdToken). Esse token é assinado pelas chaves do Firebase; **jwt.verify(..., JWT_SECRET)** falharia (token inválido).

Para o script de teste de saque (`create-test-withdraw-live.js`): é necessário usar um **Bearer** que seja exatamente esse JWT do backend (obtido via POST /api/auth/login com credenciais do app, ou por um fluxo que troque Firebase Id Token por esse JWT no backend, se existir). Se o player hoje envia apenas Firebase Id Token no Authorization, o backend responderá **403 Token inválido** no /api/withdraw/request.
