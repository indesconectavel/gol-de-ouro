# PATCH GO — envalid (2026-03-02)

## Resumo executivo

| Item | Resultado |
|------|-----------|
| **Objetivo** | Garantir que `config/env.js` e `middlewares/authMiddleware.js` carreguem sem erro de módulo faltando (Cannot find module 'envalid'). |
| **Patch aplicado** | `npm i envalid --save` — adição de `envalid` em `dependencies`. |
| **MODULE_NOT_FOUND envalid** | **Resolvido.** O require de `config/env` e de `authMiddleware` não falha mais por módulo ausente. |
| **GO/NO-GO local (só módulo)** | **GO.** O problema de dependência foi corrigido. |
| **Observação local (sem .env)** | Ao rodar `node -e "require('./config/env')"` ou `require('./middlewares/authMiddleware')` **sem** arquivo `.env` (ou sem as variáveis no ambiente), o envalid exige variáveis obrigatórias e o processo sai com código 1. Isso é **validação de config**, não falta de módulo. Em deploy com variáveis definidas (env ou .env), o boot segue normalmente. |

---

## 1) Estado atual confirmado (antes do patch)

### Trechos e caminhos

- **a) config/env.js linha 1 (require envalid)**  
  `e:\Chute de Ouro\goldeouro-backend\config\env.js` linha 1:
  ```js
  const { cleanEnv, str, num, url } = require('envalid');
  ```

- **b) middlewares/authMiddleware.js linhas 1–5 (require ../config/env)**  
  `e:\Chute de Ouro\goldeouro-backend\middlewares\authMiddleware.js`:
  ```js
  // src/middlewares/authMiddleware.js
  const env = require('../config/env');
  const jwt = require('jsonwebtoken');

  // Middleware de autenticação para rotas administrativas
  ```

- **c) server-fly.js — require do authMiddleware**  
  `e:\Chute de Ouro\goldeouro-backend\server-fly.js` linha 28:
  ```js
  const { authAdminToken } = require('./middlewares/authMiddleware');
  ```

### package.json antes do patch

- **envalid** não constava em `dependencies` nem em `devDependencies`.

### Comandos e outputs (antes do patch)

**Comando 1:** `node -e "require('./config/env'); console.log('env ok')"`  
**Saída:** Exit code 1. Erro: `Cannot find module 'envalid'`, Require stack: `config\env.js` → `[eval]`.

**Comando 2:** `node -e "require('./middlewares/authMiddleware'); console.log('middleware ok')"`  
**Saída:** Exit code 1. Mesmo erro: `Cannot find module 'envalid'`, Require stack: `config\env.js` → `middlewares\authMiddleware.js` → `[eval]`.

---

## 2) Patch aplicado (WRITE)

- **Comando:** `npm i envalid --save`
- **Resultado:** `added 1 package`; exit code 0.
- **Alterações:** `package.json` e `package-lock.json` atualizados; `envalid` em `dependencies`.

---

## 3) Prova pós-patch (GO para módulo)

Os mesmos comandos foram executados após o patch.

- **Require de envalid:** não gera mais `MODULE_NOT_FOUND`. O carregamento de `config/env.js` e de `middlewares/authMiddleware.js` passa a depender apenas da **validação de ambiente** do envalid.

**Comando 1:** `node -e "require('./config/env'); console.log('env ok')"`  
**Saída (sem .env):** Exit code 1. Envalid exibe “Missing environment variables” e sai com código 1. **Não** é erro de módulo.

**Comando 2:** `node -e "require('./middlewares/authMiddleware'); console.log('middleware ok')"`  
**Saída (sem .env):** Mesmo comportamento: envalid acusa variáveis ausentes e termina com código 1. **Não** é erro de módulo.

### Variáveis obrigatórias ausentes (quando não há .env)

Exigidas pelo `cleanEnv` em `config/env.js` (sem `default`), portanto obrigatórias para o módulo carregar sem erro de validação:

| Nome exato | Onde é exigida em config/env.js |
|------------|----------------------------------|
| ADMIN_TOKEN | Linha 23: `ADMIN_TOKEN: str({ ... })` (sem default) |
| DATABASE_URL | Linha 5: `DATABASE_URL: url({ ... })` (sem default) |
| JWT_SECRET | Linha 18: `JWT_SECRET: str({ ... })` (sem default) |
| MERCADOPAGO_ACCESS_TOKEN | Linha 36: `MERCADOPAGO_ACCESS_TOKEN: str({ ... })` (sem default) |
| MERCADOPAGO_WEBHOOK_SECRET | Linha 41: `MERCADOPAGO_WEBHOOK_SECRET: str({ ... })` (sem default) |

Validações adicionais após o cleanEnv (linhas 55–61):

- `JWT_SECRET.length >= 32`
- `ADMIN_TOKEN.length >= 16`

Em deploy, essas variáveis devem estar definidas (por exemplo em `.env` ou nas variáveis de ambiente do host/CI). Nenhum default foi adicionado no código; o patch limitou-se a instalar `envalid`.

---

## 4) Evidências finais

### git diff (trecho relevante)

**package.json:**

```diff
diff --git a/package.json b/package.json
@@ -18,6 +18,7 @@
     "cors": "^2.8.5",
     "dayjs": "^1.11.19",
     "dotenv": "^16.3.1",
+    "envalid": "^8.1.1",
     "express": "^4.18.2",
```

**package-lock.json:** atualizado (entrada `node_modules/envalid`, versão 8.1.1, dependência `tslib`, etc.).

### Trecho atual de dependencies (package.json)

```json
  "dependencies": {
    "@supabase/supabase-js": "^2.38.4",
    "axios": "^1.6.7",
    "bcryptjs": "^2.4.3",
    "chalk": "^5.6.2",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dayjs": "^1.11.19",
    "dotenv": "^16.3.1",
    "envalid": "^8.1.1",
    "express": "^4.18.2",
    ...
  },
```

### Outputs dos comandos node -e (pós-patch, sem .env)

**require('./config/env'):**

```
Missing environment variables:
  ADMIN_TOKEN: Token de autenticação para rotas administrativas (eg. "seu_token_admin_unico_aqui")
  DATABASE_URL: URL de conexão com PostgreSQL (Supabase) (eg. "postgresql://user:pass@host:port/db?sslmode=require")
  JWT_SECRET: Chave secreta para assinatura de JWT (mínimo 32 caracteres) (eg. "sua_chave_jwt_super_secreta_aqui_minimo_32_chars")
  MERCADOPAGO_ACCESS_TOKEN: Access Token do Mercado Pago (eg. "APP_USR-...")
  MERCADOPAGO_WEBHOOK_SECRET: Secret para validação de webhooks do Mercado Pago (eg. "seu_webhook_secret_aqui")
Exiting with error code 1
```

**require('./middlewares/authMiddleware'):** mesma mensagem (envalid é carregado via `config/env.js`).

### Checklist de variáveis obrigatórias (nomes exatos)

Para o `config/env.js` carregar sem erro de validação envalid (em ambiente sem defaults no código):

- [ ] **ADMIN_TOKEN** (str; depois: length ≥ 16)
- [ ] **DATABASE_URL** (url)
- [ ] **JWT_SECRET** (str; depois: length ≥ 32)
- [ ] **MERCADOPAGO_ACCESS_TOKEN** (str)
- [ ] **MERCADOPAGO_WEBHOOK_SECRET** (str)

Com default no código (não obrigatórias para envalid): PORT, CORS_ORIGINS, NODE_ENV.

---

## Conclusão

- **Problema de módulo:** `require('./config/env')` e `require('./middlewares/authMiddleware')` **não falham mais** por `MODULE_NOT_FOUND` (envalid).
- **Patch:** apenas `envalid` adicionado em `dependencies`; nenhuma alteração de lógica ou refatoração.
- **Deploy:** em ambiente com variáveis de ambiente (ou .env) configuradas conforme o checklist acima, o boot do backend deve ser **GO**. Falhas restantes em ambiente sem essas variáveis são apenas de **validação de env** pelo envalid, e devem ser resolvidas pela configuração do ambiente, não por novo patch de código.
