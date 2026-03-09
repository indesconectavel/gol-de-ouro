# FIX — SMTP CRASH LOOP NO BOOT (FLY.IO)

**Data:** 2026-03-09  
**Arquivo alterado:** `services/emailService.js`  
**Referência:** INCIDENTE-FLY-STARTUP-BACKEND-READONLY-2026-03-09.md

---

## Problema

O backend no Fly.io entrava em **crash loop**: a máquina subia, o processo Node iniciava e, pouco depois, encerrava. O health check falhava (conexão recusada/timeout) e o Fly reiniciava o container, repetindo o ciclo.

Logs indicavam erro SMTP/Gmail:

- `535-5.7.8 Username and Password not accepted`
- `code: EAUTH`, `responseCode: 535`

Isso ocorria após troca de credenciais (ex.: de `indesconectavel@gmail.com` para `chutedeouro.com@gmail.com`) com senha incorreta ou indisponível.

---

## Causa raiz

No `emailService.js`, o constructor chama `initializeTransporter()`, que cria uma Promise (`_verifyPromise`) com `transporter.verify(callback)`. Em caso de falha (credenciais inválidas ou Gmail indisponível), o callback chama `reject(err)`.

**Nenhum código tratava essa rejeição.** A Promise ficava com “unhandled rejection”. Em Node.js, isso pode encerrar o processo. Como o `verify()` roda de forma assíncrona (após o servidor já ter feito `listen`), o processo caía alguns segundos depois do boot, gerando o crash loop.

---

## Código modificado

**Arquivo:** `services/emailService.js`  
**Trecho:** criação de `_verifyPromise` em `initializeTransporter()`.

**Antes:** a Promise era criada e podia rejeitar sem tratamento:

```javascript
this._verifyPromise = new Promise((resolve, reject) => {
  this.transporter.verify((err) => {
    if (err) {
      console.error('❌ [EMAIL] Erro na configuração do email:', err.message);
      this.isConfigured = false;
      reject(err);
    } else {
      console.log('✅ [EMAIL] Servidor de email configurado com sucesso');
      this.isConfigured = true;
      resolve();
    }
  });
});
```

**Depois:** a mesma Promise é encadeada com `.catch()` para tratar qualquer falha e evitar unhandled rejection:

```javascript
// .catch() obrigatório: evita unhandled rejection quando SMTP está inválido (ex.: 535) e crash no Fly.io
this._verifyPromise = new Promise((resolve, reject) => {
  this.transporter.verify((err) => {
    if (err) {
      console.error('❌ [EMAIL] Erro na configuração do email:', err.message);
      this.isConfigured = false;
      reject(err);
    } else {
      console.log('✅ [EMAIL] Servidor de email configurado com sucesso');
      this.isConfigured = true;
      resolve();
    }
  });
}).catch((err) => {
  console.error('❌ [EMAIL] Verificação SMTP falhou (servidor continuará rodando):', err.message);
  this.isConfigured = false;
  return undefined;
});
```

Com isso:

- A falha de SMTP é logada.
- `isConfigured` é mantido `false`.
- A Promise deixa de rejeitar (o `.catch()` resolve com `undefined`), então não há unhandled rejection e o processo não cai por causa do verify.

O método `sendPasswordResetEmail` já aguarda `_verifyPromise` e, quando `isConfigured` é `false`, retorna `{ success: false, error: '...' }`; o handler de forgot-password em `server-fly.js` já responde 503 nesse caso. Nenhuma alteração foi feita em rotas, controllers ou `server-fly.js`.

---

## Impacto da correção

| Aspecto | Impacto |
|--------|---------|
| **Boot no Fly.io** | O backend sobe e permanece de pé mesmo com SMTP_USER ou GMAIL_APP_PASSWORD inválidos ou com Gmail fora do ar. |
| **Health check** | `/health` continua retornando 200 (não depende de e-mail). |
| **Forgot password** | Com SMTP indisponível ou inválido, `sendPasswordResetEmail` retorna `success: false`; o backend continua respondendo 503 com mensagem controlada. Comportamento de sucesso de envio inalterado quando SMTP está ok. |
| **Verificação SMTP** | A verificação via `transporter.verify()` foi mantida; apenas a rejeição passou a ser tratada, sem derrubar o processo. |
| **Escopo** | Apenas `services/emailService.js` foi alterado; sem mudanças em autenticação, rotas, controllers, banco, `server-fly.js` ou `fly.toml`. |

---

*Correção aplicada em 2026-03-09. Validação recomendada: deploy no Fly.io com SMTP inválido e confirmação de que o app sobe, `/health` retorna 200 e forgot-password retorna 503 quando o envio não for possível.*
