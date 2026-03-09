# GO/NO-GO — Ambiente real Fly (envalid / config/env) — READ-ONLY

**Data:** 2026-03-02  
**Escopo:** Auditoria read-only do ambiente Fly para verificar presença do pacote `envalid` em runtime, boot via `config/env.js` e natureza da falha (MODULE_NOT_FOUND vs Missing env).  
**Regras:** Nenhum deploy, rebuild, alteração de env ou reinício; apenas diagnóstico e leitura de logs/config.

---

## 1. Identificação do app e release

### 1.1 fly.toml

- **App:** `goldeouro-backend-v2`
- **primary_region:** `gru`
- **Processos:** `app` = `npm start`, `payout_worker` = `node src/workers/payout-worker.js`
- **Imagem:** construída via Dockerfile na raiz.

### 1.2 Comandos executados — status, releases, machines

```bash
flyctl status -a goldeouro-backend-v2
```

**Resultado:** App rodando. Hostname: `goldeouro-backend-v2.fly.dev`. Image: `goldeouro-backend-v2:deployment-01KJB5K9MPDYQ49P82YF2P3J3D`. 2 máquinas **app** (started, 1/1 checks passing) e 1 **payout_worker** (started).

```bash
flyctl releases -a goldeouro-backend-v2 -n 5
```

**Resultado:** Release atual **v305** (complete, Feb 25 2026). v304/v303 em estado failed (Feb 6).

```bash
flyctl machines list -a goldeouro-backend-v2
```

**Resultado:** 3 máquinas, todas com a mesma **IMAGE** `goldeouro-backend-v2:deployment-01KJB5K9MPDYQ49P82YF2P3J3D`, STATE = started.

---

## 2. Prova via logs (sem entrar na máquina)

### 2.1 Comando

```bash
flyctl logs -a goldeouro-backend-v2 --no-tail
```

(Nota: esta versão do flyctl não suporta `--since`; foram usados os logs mais recentes disponíveis.)

### 2.2 Padrões buscados nos logs

- "Cannot find module 'envalid'"
- "Missing environment variables"
- "envalid" (stack trace em config/env.js)
- "server-fly.js" boot
- "Error:" / "Cannot find"

**Resultado da busca:** Nenhuma linha encontrada com esses padrões. Logs exibidos contêm apenas saída do **payout_worker** (Início/Fim do ciclo, Nenhum saque pendente, Resumo). Nenhum erro de módulo ou variáveis de ambiente.

### 2.3 Conclusão pelos logs

- O processo **app** está em estado **started** com health check passing (não em crash-loop).
- Não há evidência nos logs de **MODULE_NOT_FOUND envalid** nem de **Missing environment variables**.

---

## 3. Prova via SSH (read-only)

### 3.1 Tentativas realizadas

- `flyctl ssh console -a goldeouro-backend-v2 -C "node -p \"process.version\""`  
  **Resultado:** `Error: can't establish agent: agent: failed to start` (falha do agente Fly no ambiente do auditor).
- Tentativa adicional especificando máquina app (`--machine 2874551a105768`) com comando `node -p "require.resolve('envalid')"`: falha por quoting no PowerShell e erro do shell SSH (`ssh: command node -p " require.resolve envalid \ --machine ... failed`).

### 3.2 Comandos planejados mas não executados no container

Por causa da indisponibilidade do SSH (agente não inicia / quoting no cliente Windows), os seguintes comandos **não** foram executados dentro do container:

- `node -p "require.resolve('envalid')"`
- `node -e "require('envalid'); console.log('envalid OK')"`
- `node -e "require('./config/env'); console.log('env OK')"`
- `ls -la node_modules/envalid`
- `cat node_modules/envalid/package.json | head -n 30`

**Conclusão:** Não há prova direta, via SSH, da presença de `node_modules/envalid` ou do sucesso de `require('envalid')` / `require('./config/env')` no ambiente real.

---

## 4. Cadeia de boot no código (referência)

- **server-fly.js** (linha 27): `const { authAdminToken } = require('./middlewares/authMiddleware');`
- **middlewares/authMiddleware.js** (linha 2): `const env = require('../config/env');`
- **config/env.js** (linha 1): `const { cleanEnv, str, num, url } = require('envalid');`

Se `envalid` estivesse ausente na imagem, o processo cairia no boot com **MODULE_NOT_FOUND** ao carregar `server-fly.js` → authMiddleware → config/env → envalid, e o health check do serviço **app** não passaria. No repositório, `envalid` está em **package.json** (e package-lock.json) como dependência (^8.1.1).

---

## 5. Veredito GO/NO-GO (ambiente real Fly)

### 5.1 Conclusão final: **GO**

**Motivo:**

1. **Status e health:** As 2 máquinas do processo **app** estão **started** com **1/1 checks passing**. O HTTP check em `/health` está passando, o que implica que o processo que escuta na porta 8080 subiu e responde.
2. **Boot e envalid:** O servidor (via `npm start` → `server-fly.js`) carrega `authMiddleware` no require inicial, que por sua vez carrega `config/env.js`, que faz `require('envalid')`. Se `envalid` não estivesse na imagem, o processo falharia antes de abrir a porta e o health check falharia. Portanto, na prática, o runtime atual está sustentado por uma imagem em que o boot passou por `config/env.js` e, logo, em que `envalid` esteve disponível no momento do boot.
3. **Logs:** Não há nenhuma ocorrência nos logs recentes de "Cannot find module 'envalid'", "Missing environment variables" ou stack trace em config/env.js. Não há indício de crash-loop do app.
4. **Release e imagem:** O release em uso é **v305** (Feb 25 2026), com imagem `goldeouro-backend-v2:deployment-01KJB5K9MPDYQ49P82YF2P3J3D`. Não há evidência nos dados coletados de que o runtime esteja usando imagem antiga/cache que não contenha envalid; pelo contrário, o estado atual é consistente com uma imagem onde o app sobe corretamente.

**Reserva:** A prova definitiva dentro do container (SSH + `require('envalid')` / `require('./config/env')`) não foi possível devido à falha do agente SSH no ambiente do auditor e a problemas de quoting no cliente. O GO é inferido com base em status, health checks e análise do código e dos logs.

### 5.2 Se a falha for “Missing environment variables”

- Se em outro contexto (ex.: novo deploy ou outra região) aparecer **Missing environment variables** vinda de `config/env.js` (envalid), isso seria **NO-GO operacional** até a correção das variáveis no Fly (secrets/env). Não foi observado esse cenário nos logs desta auditoria.

### 5.3 Resumo

| Critério                         | Resultado |
|----------------------------------|-----------|
| MODULE_NOT_FOUND envalid nos logs| Não       |
| Missing env nos logs             | Não       |
| App em crash-loop                 | Não       |
| Health checks passing            | Sim       |
| Prova SSH no container           | Indisponível (agente/quoting) |
| **Veredito**                     | **GO**    |

---

## 6. Comandos executados (resumo)

| # | Comando | Objetivo |
|---|--------|----------|
| 1 | `flyctl status -a goldeouro-backend-v2` | Status do app e imagem |
| 2 | `flyctl releases -a goldeouro-backend-v2 -n 5` | Release atual (v305) |
| 3 | `flyctl machines list -a goldeouro-backend-v2` | Máquinas e imagem |
| 4 | `flyctl logs -a goldeouro-backend-v2 --no-tail` | Logs recentes |
| 5 | Filtro (Select-String) nos logs por envalid/Missing/env/Error | Busca por falhas |
| 6 | `flyctl ssh console -a goldeouro-backend-v2 -C "node -p ..."` | SSH (falhou: agent) |
| 7 | `flyctl ssh console ... --machine 2874551a105768 -C "node ..."` | SSH em máquina app (falhou: quoting/shell) |

---

*Relatório gerado em modo read-only. Nenhum deploy, rebuild, alteração de env ou reinício foi realizado.*
