# INCIDENTE FLY.IO — STARTUP BACKEND — READ-ONLY

**Projeto:** Gol de Ouro  
**App Fly.io:** goldeouro-backend-v2  
**Data:** 2026-03-09  
**Modo:** READ-ONLY (nenhuma alteração de código, env, deploy ou infraestrutura)  
**Objetivo:** Causa raiz de máquina parada, releases falhando e health check não passando.

---

## 1. Resumo executivo

A auditoria identificou que o **emailService** é carregado no boot via `require('./services/emailService')` e, ao ser carregado, cria uma Promise (`_verifyPromise`) que chama `transporter.verify()` de forma assíncrona. **Nenhum código aguarda ou trata essa Promise.** Quando as credenciais SMTP estão incorretas (ex.: erro 535 Username and Password not accepted), o callback de `verify()` chama `reject(err)`. Em Node.js (a partir do comportamento padrão de unhandled rejection), isso pode encerrar o processo. A causa raiz mais provável é: **rejeição não tratada da Promise de verificação SMTP** após o servidor já ter subido, levando a término do processo e, em seguida, a um crash loop no Fly.io. O servidor em si **não** depende de SMTP para subir (não há throw no require do emailService nem env obrigatória de SMTP no assertRequiredEnv); a falha ocorre **depois** do listen, quando a verificação assíncrona do Gmail retorna erro.

---

## 2. Arquivos auditados

| Arquivo | Conteúdo relevante |
|---------|--------------------|
| **server-fly.js** | Ponto de entrada; ordem de require; assertRequiredEnv; startServer(); registro de /health; listen em PORT; uso de emailService apenas em rota forgot-password. |
| **services/emailService.js** | Constructor chama initializeTransporter(); cria _verifyPromise com transporter.verify(callback); callback chama reject(err) em falha; nenhum await no boot. |
| **fly.toml** | app = goldeouro-backend-v2; internal_port = 8080; http_checks path = /health, grace_period = 40s. |
| **package.json** | main = server-fly.js; start = node server-fly.js. |
| **Dockerfile** (raiz do repo) | CMD ["node", "server-fly.js"]; ENV PORT=8080. |
| **config/required-env.js** | assertRequiredEnv(['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'], { onlyInProduction: ['MERCADOPAGO_ACCESS_TOKEN'] }); throw se faltar. |
| **database/supabase-unified-config.js** | createClient no load; usado por server-fly. |
| **database/supabase-config.js** | Requerido por src/websocket.js; createClient no load; não faz throw. |
| **src/websocket.js** | Requerido ao instanciar WebSocketManager(server); exige JWT_SECRET (throw se ausente); require('../database/supabase-config'). |

---

## 3. Cadeia real de startup do backend

1. **Processo principal:** `node server-fly.js` (Dockerfile CMD e package.json start).
2. **Ordem de execução (síncrona até startServer):**
   - `require('dotenv').config()`
   - `assertRequiredEnv(['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'], { onlyInProduction: ['MERCADOPAGO_ACCESS_TOKEN'] })` → **throw** se alguma faltar; **SMTP não é exigido**.
   - `const app = express();`; `const PORT = process.env.PORT || 8080;`
   - Instanciação de validadores (PixValidator, etc.).
   - `require('./database/supabase-unified-config')` → retorna supabaseAdmin, funções de conexão.
   - **`require('./services/emailService')`** → executa o módulo: `new EmailService()` roda no load. No constructor:
     - `initializeTransporter()` é chamada (try/catch; não faz throw).
     - Se há SMTP_PASS ou GMAIL_APP_PASSWORD, cria o transporter e **agenda** `transporter.verify(callback)`; a Promise `_verifyPromise` é criada e o callback roda **assincronamente**. No load, nada é await; portanto **nenhum throw no require**.
   - `require('./src/websocket')` → só ocorre quando `new WebSocketManager(server)` é chamado **dentro** de startServer(), não no top-level.
3. **startServer()** (async, chamada sem await na linha 2765):
   - Verifica JWT_SECRET; se ausente, `process.exit(1)`.
   - `await connectSupabase()` → não faz throw, apenas define dbConnected = true/false.
   - `await testMercadoPago()` → não faz throw.
   - Carrega métricas do Supabase (try/catch).
   - Registra middlewares e rotas (síncrono).
   - `const server = http.createServer(app);`
   - **`new WebSocketManager(server)`** → aqui é carregado `src/websocket.js`, que faz require de `database/supabase-config` e verifica JWT_SECRET (já validado).
   - `server.listen(PORT, '0.0.0.0', callback)` → processo fica vivo.
4. **Em momento posterior (assíncrono):** o callback de `transporter.verify()` no emailService pode rodar. Se as credenciais forem inválidas (ex.: 535), o callback chama `reject(err)`. Nenhum código faz `await _verifyPromise` ou `.catch()` nessa Promise; ela fica **unhandled**. Em Node.js, rejeições não tratadas podem encerrar o processo (comportamento padrão atual).

Conclusão da cadeia: o servidor **consegue** abrir a porta e atender requisições. A falha ocorre **depois**, quando a verificação SMTP assíncrona rejeita a Promise.

---

## 4. Como o health check funciona

- **fly.toml:** `[[services.http_checks]]` em `path = "/health"`, `method = "get"`, `interval = "30s"`, `timeout = "10s"`, `grace_period = "40s"`.
- **Porta:** `internal_port = 8080`; no código, `PORT = process.env.PORT || 8080` e `server.listen(PORT, '0.0.0.0')` → alinhado.
- **Rota /health (server-fly.js L2065):** GET `/health` é assíncrona; tenta reconectar ao Supabase se `!dbConnected`; faz um ping leve ao banco (`usuarios` count); responde **sempre 200** com JSON `{ status: 'ok', database: 'connected'|'disconnected', mercadoPago: '...', ... }`. Não depende de emailService nem de SMTP. Não faz throw que quebre a resposta.
- Se o **processo já tiver saído** por unhandled rejection (SMTP), a máquina não atende mais; o health check falha por conexão recusada/timeout, não por corpo da resposta.

---

## 5. Impacto do emailService no boot

- **Carregamento:** `emailService` é required na linha 72 de server-fly.js, ou seja, no **início** do módulo, antes de startServer().
- **No constructor do EmailService:**
  - `initializeTransporter()` é chamada dentro de try/catch; em falha, apenas `this.isConfigured = false` e log; **não há throw**.
  - Se existir SMTP_PASS ou GMAIL_APP_PASSWORD, é criado o transporter e a Promise `_verifyPromise`, cujo executor chama `this.transporter.verify(callback)`. O callback roda **assincronamente**; no load do módulo **nada aguarda** essa Promise.
- **Uso do emailService:** apenas na rota POST `/api/auth/forgot-password`, dentro do handler (após usuário existir e token salvo). Ou seja, **não é usado antes do listen**.
- **Quando o verify falha (ex.: 535):** o callback chama `reject(err)`. A `_verifyPromise` fica rejeitada e **nenhum .catch() ou await** a trata no processo. Em Node.js, isso gera **unhandledRejection**, que por padrão pode terminar o processo.
- **Conclusão:** O emailService **não** impede o listen (não há throw no require nem dependência síncrona de SMTP no boot). O problema é a **rejeição não tratada** da Promise de verificação, que ocorre **após** o servidor já estar no ar e pode derrubar o processo. Isso é compatível com “máquina sobe, passa um ou mais health checks, depois cai” e com crash loop ao trocar para credenciais SMTP inválidas.

---

## 6. Secrets/env obrigatórios vs opcionais

- **Obrigatórios para o boot (assertRequiredEnv):**  
  `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.  
  Em produção: também `MERCADOPAGO_ACCESS_TOKEN`.
- **Não exigidos para o boot:**  
  SMTP_USER, SMTP_PASS, GMAIL_APP_PASSWORD, FRONTEND_URL, FRONTEND_BASE_URL. Nenhum deles está em assertRequiredEnv.
- **Comportamento atual:** Se SMTP_PASS ou GMAIL_APP_PASSWORD **estiverem** definidos (mesmo incorretos), o emailService cria o transporter e chama `verify()`. A falha de verify gera a rejeição não tratada. Se **não** estiverem definidos, o emailService não cria transporter e não agenda verify; não há Promise rejeitada e o app não cai por SMTP.
- **Conclusão:** Para o runtime atual, SMTP **deveria** ser opcional para o app subir e permanecer de pé; porém, quando as variáveis estão presentes mas **inválidas**, o desenho atual (verify assíncrono sem tratamento da Promise) faz com que o processo possa ser terminado por unhandled rejection. Ou seja: o app “sobe mesmo sem SMTP” só quando SMTP não está configurado; com SMTP configurado e errado, o processo pode cair depois do startup.

---

## 7. Hipóteses investigadas

| Hipótese | Resultado |
|----------|-----------|
| 1) SMTP quebra o startup de forma síncrona | **Descartada.** O require do emailService não faz throw; o verify() é assíncrono e não é await no boot. |
| 2) emailService mal projetado para startup | **Parcialmente confirmada.** O serviço não derruba o startup de forma síncrona, mas cria uma Promise que rejeita em caso de credenciais inválidas e essa rejeição não é tratada em lugar nenhum, podendo encerrar o processo depois do listen. |
| 3) server-fly.js morre por dependência de e-mail | **Não** por dependência síncrona. **Sim** indiretamente: a Promise criada pelo emailService (carregado por server-fly) pode rejeitar e, não sendo tratada, derrubar o processo. |
| 4) Health check / porta errada | **Descartada.** Porta 8080 está alinhada (fly.toml internal_port, PORT no app, Dockerfile). /health retorna 200 e não depende de SMTP. A falha do health é consequência do processo ter morrido, não causa. |
| 5) Entrypoint / CMD / processo principal | **Descartada.** CMD é `node server-fly.js`; package.json main e start apontam para server-fly.js. Correto. |
| 6) Combinação env + código + release | **Confirmada.** Env com SMTP definido mas inválido (ex.: troca para chutedeouro.com@gmail.com com senha errada) + código que agenda verify() sem tratar a Promise = processo sobe e depois cai por unhandled rejection, gerando releases/máquina em falha. |

---

## 8. Causa raiz mais provável

**Rejeição não tratada da Promise de verificação SMTP (transporter.verify()) no emailService.**

Sequência provável:

1. No deploy, SMTP_USER e GMAIL_APP_PASSWORD (ou SMTP_PASS) estão definidos, mas as credenciais estão incorretas (ex.: 535 Username and Password not accepted).
2. Ao carregar o módulo, o emailService cria o transporter e agenda `transporter.verify(callback)`.
3. O servidor sobe normalmente (listen na porta 8080).
4. O health check pode passar durante o grace_period ou nas primeiras verificações.
5. Quando o callback de verify() é chamado com erro (535), o código chama `reject(err)` na _verifyPromise.
6. Nenhum código faz await ou .catch nessa Promise → unhandled rejection.
7. O processo Node encerra (comportamento típico para unhandled rejection).
8. O Fly.io detecta processo morto, tenta reiniciar; o mesmo ciclo se repete → crash loop, máquina aparece 0/1 ou stopped, releases falhando.

---

## 9. Evidências técnicas da causa raiz

- **services/emailService.js L43–55:** Criação de `_verifyPromise` com `this.transporter.verify((err) => { if (err) { ... reject(err); } ... })`. A rejeição ocorre quando o Gmail retorna erro (ex.: 535).
- **Ausência de tratamento:** Em todo o código auditado, não há `await emailService._verifyPromise`, nem `.catch()` nem listener de `unhandledRejection` para essa Promise. O emailService é usado apenas no handler de forgot-password, que chama `sendPasswordResetEmail` (que internamente pode await _verifyPromise na **primeira** chamada a send); mas se o verify já tiver rejeitado **antes** de qualquer requisição forgot, a rejeição já é unhandled.
- **server-fly.js L72:** `const emailService = require('./services/emailService');` — o módulo é carregado no boot; o constructor roda; verify() é agendado.
- **Log 535:** O contexto do incidente menciona logs com “535-5.7.8 Username and Password not accepted” e “code: EAUTH”, compatível com o callback de verify() recebendo erro e chamando reject(err).

---

## 10. O que precisa ser corrigido

Para eliminar a causa raiz sem alterar o modo READ-ONLY desta auditoria, as correções seriam (apenas descritas; não aplicadas):

1. **Tratar a Promise de verificação no emailService** de forma que uma falha de verify não resulte em unhandled rejection: por exemplo, fazer `.catch()` em `_verifyPromise` e apenas definir `isConfigured = false` e logar o erro, sem propagar a rejeição.
2. **Ou** não chamar `transporter.verify()` no boot quando o objetivo é “app sobe mesmo com SMTP inválido”; deixar a verificação apenas na primeira chamada a `sendPasswordResetEmail`, já tratada com try/catch no handler de forgot-password (que retorna 503).
3. **Opção operacional imediata:** Remover ou comentar temporariamente SMTP_PASS/GMAIL_APP_PASSWORD (e eventualmente SMTP_USER) nos secrets do app no Fly.io, para que o emailService não crie o transporter e não rode verify(); o app sobe e permanece de pé; forgot-password retornará 503 até SMTP ser corrigido e reconfigurado.

Nenhuma alteração foi aplicada nesta análise.

---

## 11. Grau de confiança do diagnóstico

- **Alta** para: (1) emailService é carregado no boot e agenda verify() sem tratamento da Promise; (2) falha de verify (ex.: 535) causa reject(); (3) não há tratamento dessa rejeição no código; (4) comportamento padrão do Node para unhandled rejection pode encerrar o processo; (5) porta, health e CMD estão corretos; (6) SMTP não é obrigatório no assertRequiredEnv.
- **Média** para: assumir que no Fly.io o Node está rodando com o comportamento padrão de unhandled rejection (não há evidência no repositório de NODE_OPTIONS ou listener que mude isso).
- **Conclusão:** Diagnóstico com **alta confiança** de que a causa raiz é a rejeição não tratada da verificação SMTP quando as credenciais estão definidas mas inválidas.

---

## 12. Conclusão objetiva

O backend **não** é derrubado por uma falha síncrona de SMTP no startup: não há throw no require do emailService e não há env de SMTP obrigatória para o boot. O servidor sobe e faz listen na porta 8080; o health check em /health não depende de e-mail e retornaria 200 se o processo estivesse vivo. A causa raiz mais provável é a **rejeição não tratada da Promise** criada em `emailService.js` para `transporter.verify()`: com SMTP_USER e GMAIL_APP_PASSWORD (ou SMTP_PASS) definidos mas **inválidos** (ex.: troca para chutedeouro.com@gmail.com com senha incorreta), o Gmail devolve 535, o callback chama `reject(err)` e, não havendo tratamento, o processo Node pode terminar, gerando crash loop, máquina 0/1 e releases falhando. O app **deveria** subir mesmo sem SMTP configurado; com SMTP configurado e inválido, o desenho atual **não** garante que o app permaneça de pé, devido à Promise de verify não tratada.

Nenhuma alteração foi realizada. Nenhum deploy foi executado. Esta análise foi conduzida em modo estritamente READ-ONLY.
