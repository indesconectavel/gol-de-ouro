# Auditoria: require de env no middleware admin – 2026-03-02

## 1) Arquivo e uso de env

**Arquivo:** `middlewares/authMiddleware.js`

| Item | Evidência |
|------|-----------|
| **a) Export de authAdminToken** | Linha 74: `module.exports = { authAdminToken, verifyJWT, verifyToken, verifyAdminToken };` |
| **b) require de env** | Linha 2: `const env = require('./config/env');` (antes do patch) |
| **c) Variáveis lidas** | `env.ADMIN_TOKEN` (linha 16), `env.NODE_ENV` (linha 23), `env.JWT_SECRET` (linha 45) |

Nenhuma outra variável de `env` é usada neste arquivo.

---

## 2) Candidatos a módulo env

Busca por `**/config/env*.js` e inspeção de referências:

| Caminho completo | Existe? | Observação |
|------------------|--------|------------|
| `e:\Chute de Ouro\goldeouro-backend\config\env.js` | **Sim** | Env da raiz; usa `envalid`; exporta `ADMIN_TOKEN`, `JWT_SECRET`, `NODE_ENV`, etc. |
| `e:\Chute de Ouro\goldeouro-backend\middlewares\config\env.js` | **Não** | Diretório `middlewares/config/` não existe (0 arquivos). |
| `goldeouro-admin\src\config\env.js` | Sim | Outro projeto (front admin). |
| `src\config\environments.js` | Sim | Nome diferente (`environments`), não `env`. |

**Conclusão:** O único `config/env.js` do backend é o da **raiz do repositório**. O middleware estava referenciando `./config/env`, que no contexto de `middlewares/authMiddleware.js` não aponta para a raiz.

---

## 3) Comportamento do Node

- **Arquivo que faz o require:** `middlewares/authMiddleware.js`  
- **Require original:** `require('./config/env')`  
- **Resolução no Node:** caminhos relativos são resolvidos em relação ao **diretório do arquivo que chama**. Logo, a partir de `middlewares/authMiddleware.js`, `./config/env` é resolvido para:
  ```
  middlewares/config/env.js
  ```
  (ou `middlewares/config/env` sem extensão).

- **Arquivo alvo existe?** Não. Não há `middlewares/config/` no projeto.

- **Erro que o Node geraria** se o require fosse executado (e o arquivo não existisse):
  ```
  Error: Cannot find module './config/env'
  Require stack:
  - E:\...\goldeouro-backend\middlewares\authMiddleware.js
  - ...
  code: 'MODULE_NOT_FOUND'
  ```

Na prática, sempre que `server-fly.js` (ou outro entrypoint) faz `require('./middlewares/authMiddleware')`, o Node tenta carregar `middlewares/config/env.js`. Como esse arquivo não existe, o boot falharia com `MODULE_NOT_FOUND` para `./config/env` **a menos que** o middleware não seja carregado (ex.: rota admin não registrada). Com o endpoint `GET /api/admin/saques-presos` e o `require` de `authAdminToken` no `server-fly.js`, o middleware passa a ser carregado no boot e o bug se manifesta.

---

## 4) Decisão do patch (estabilidade)

| Opção | Descrição | Risco / Justificativa |
|-------|-----------|------------------------|
| **A** | Criar `middlewares/config/env.js` shim reexportando o env da raiz | Novo arquivo; possível divergência futura (dois pontos de configuração); mais um lugar a manter. |
| **B** | Ajustar no middleware para `require('../config/env')` | Um único ponto de verdade (`config/env.js` na raiz); mesmo arquivo já usado por `routes/*` com `require('../config/env')`; alteração mínima (uma linha). |

**Escolha: Opção B**

- **Evidência:** Vários arquivos em `routes/` já usam `require('../config/env')` (ex.: `routes/analyticsRoutes.js`, `routes/analyticsRoutes_v1.js`). O backend já trata `config/env.js` na raiz como fonte única de env.
- **Menor risco:** Não introduz novo arquivo nem nova convenção; apenas corrige o caminho no middleware para o mesmo módulo que o resto do app usa.

---

## 5) Patch aplicado

### Diff unificado

```diff
--- a/middlewares/authMiddleware.js
+++ b/middlewares/authMiddleware.js
@@ -1,5 +1,5 @@
 // src/middlewares/authMiddleware.js
-const env = require('./config/env');
+const env = require('../config/env');
 const jwt = require('jsonwebtoken');
 
 // Middleware de autenticação para rotas administrativas
```

### Arquivo completo alterado: `middlewares/authMiddleware.js`

```javascript
// src/middlewares/authMiddleware.js
const env = require('../config/env');
const jwt = require('jsonwebtoken');

// Middleware de autenticação para rotas administrativas
const authAdminToken = (req, res, next) => {
  const token = req.headers['x-admin-token'];

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de autenticação não fornecido',
      message: 'Header x-admin-token é obrigatório'
    });
  }

  if (token !== env.ADMIN_TOKEN) {
    return res.status(403).json({ 
      error: 'Acesso negado',
      message: 'Token inválido'
    });
  }

  // Log apenas em desenvolvimento
  if (env.NODE_ENV === 'development') {
    console.log('🔐 Autenticação admin bem-sucedida');
  }

  next();
};

// Middleware de verificação JWT
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Token JWT não fornecido',
      message: 'Header Authorization com Bearer token é obrigatório'
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer '

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        message: 'Faça login novamente'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Token inválido',
        message: 'Token malformado'
      });
    } else {
      return res.status(500).json({
        error: 'Erro na verificação do token',
        message: 'Erro interno do servidor'
      });
    }
  }
};

// Middleware de verificação de token (para compatibilidade)
const verifyToken = verifyJWT;

// Middleware de verificação de token admin
const verifyAdminToken = authAdminToken;

module.exports = {
  authAdminToken,
  verifyJWT,
  verifyToken,
  verifyAdminToken
};
```

---

## 6) Testes rápidos

### 6.1) Outros `require('./config/env')` quebrados

- **Comando (conceitual):** busca por `require('./config/env')` no repositório.
- **Resultado:**  
  - **middlewares:** apenas `middlewares/authMiddleware.js` (corrigido para `../config/env`).  
  - **Outros:** `scripts/add-test-balance.js`, `scripts/...`, `db-ultra-optimized.js` usam `./config/env` a partir do **próprio diretório** (ex.: a partir de `scripts/`, `./config/env` → `scripts/config/env.js`). São contextos diferentes do middleware; não foram alterados nesta auditoria.

Nenhum outro middleware usa `require('./config/env')` que aponte para um arquivo inexistente no mesmo padrão de `middlewares/authMiddleware.js`.

### 6.2) Verificação de import do middleware

- **Comando:** `node -e "require('./middlewares/authMiddleware')"` (na raiz do backend).
- **Resultado:**  
  - **Antes do patch:** o Node tentaria carregar `middlewares/config/env.js` e geraria `MODULE_NOT_FOUND` para `./config/env`.  
  - **Depois do patch:** o require do middleware passa a carregar `config/env.js` (raiz). O stack de erro passa a ser:
    ```
    Require stack:
    - E:\...\goldeouro-backend\config\env.js
    - E:\...\goldeouro-backend\middlewares\authMiddleware.js
    ```
  - O erro atual é `Cannot find module 'envalid'` (dependência usada em `config/env.js`), não mais “Cannot find module './config/env'”.

**Conclusão:** O caminho do require está correto; o módulo encontrado é o `config/env.js` da raiz. A falha em ambiente “nu” (`node -e` sem `node_modules` instalado) é de dependência do projeto (`envalid`), não do path do middleware.

### 6.3) Boot do servidor

- **Comando:** `npm start` (equivale a `node server-fly.js`); captura dos primeiros logs.
- **Resultado:** Os primeiros linhas de saída não mostram erro de require do middleware (nenhum `MODULE_NOT_FOUND` para `./config/env` ou para `authMiddleware`). O processo inicia e executa `node server-fly.js` sem falha imediata de carregamento do authMiddleware.

**Nota:** Em ambiente sem `envalid` instalado (ou sem `.env`/variáveis exigidas por `config/env.js`), o boot pode falhar dentro de `config/env.js` (envalid ou validações). Isso é independente do patch do path no middleware; o patch apenas garante que o middleware use o mesmo `config/env.js` da raiz que o resto do app.

---

## Resumo

- **Problema:** `middlewares/authMiddleware.js` usava `require('./config/env')`, que em Node resolve para `middlewares/config/env.js`, arquivo inexistente.
- **Solução:** Alterado para `require('../config/env')`, passando a usar o `config/env.js` da raiz, alinhado às rotas e menor risco de regressão.
- **Patch:** Uma linha alterada em `middlewares/authMiddleware.js`.
- **Testes:** Nenhum outro middleware com o mesmo padrão quebrado; import do middleware passa a resolver o env da raiz; boot do servidor sem erro de módulo do middleware nos primeiros logs.
