# Prova no container — envalid e código (reconciler / patch V1) — READ-ONLY

**Data:** 2026-03-02  
**Objetivo:** Diagnosticar por que `fly ssh` falhava no Windows; executar comandos no container para provar envalid/config/env e presença do código reconcileProcessingWithdrawals e patch V1 na imagem v305.  
**Regras:** Nenhum deploy, rebuild, alteração de secrets/env ou reinício.

---

## PASSO 0 — Contexto

### 0.1 flyctl version

```
flyctl.exe v0.4.3 windows/amd64 Commit: f58ce93c269bf5211a4dba0454631d94e5123dfc BuildDate: 2026-01-12T23:32:09Z
```

### 0.2 flyctl status -a goldeouro-backend-v2

```
App       = goldeouro-backend-v2
Hostname  = goldeouro-backend-v2.fly.dev
Image     = goldeouro-backend-v2:deployment-01KJB5K9MPDYQ49P82YF2P3J3D

PROCESS       ID             VERSION  REGION  STATE   CHECKS
app           2874551a105768 305      gru     started 1 total, 1 passing
app           e82d445ae76178 305      gru     started 1 total, 1 passing
payout_worker e82794da791108 305      gru     started
```

### 0.3 flyctl machines list -a goldeouro-backend-v2

- **2874551a105768** (withered-cherry-5478) — app, gru, started, 1/1 checks, imagem `goldeouro-backend-v2:deployment-01KJB5K9MPDYQ49P82YF2P3J3D`
- **e82d445ae76178** (dry-sea-3466) — app, gru, started, 1/1 checks, mesma imagem
- **e82794da791108** (weathered-dream-1146) — payout_worker, gru, started, mesma imagem

Máquina usada nos testes SSH: **2874551a105768**.

---

## PASSO 1 — SSH agent no Windows (PowerShell)

### 1.1 Estado inicial

```powershell
Get-Service ssh-agent
```

**Saída:** `Status: Stopped`, Name: `ssh-agent`, DisplayName: OpenSSH Authentication Agent

### 1.2 Ajustes

```powershell
Set-Service -Name ssh-agent -StartupType Automatic
Start-Service ssh-agent
Get-Service ssh-agent
```

**Saída:** `Status: Running`. SSH agent habilitado e em execução.

**Conclusão:** O ssh-agent estava parado; após configurar StartupType Automatic e Start-Service, ficou Running. Isso pode ser necessário para o flyctl usar o agente local em fluxos SSH no Windows.

---

## PASSO 2 — Teste SSH simples

### Comando

```powershell
flyctl ssh console -a goldeouro-backend-v2 --machine 2874551a105768 -C 'uname -a'
```

### Saída (resumida)

```
Connecting to fdaa:2b:dbd4:a7b:103:e821:64a6:2...
Linux 2874551a105768 6.12.47-fly #1 SMP PREEMPT_DYNAMIC Fri Feb 13 00:38:38 UTC 2026 x86_64 Linux
Error: Identificador inválido.
```

**Conclusão:** **SSH funcionou.** O comando foi executado dentro do container (Linux 6.12.47-fly, x86_64). A mensagem "Error: Identificador inválido." aparece após a saída do comando e provavelmente está ligada ao fechamento da sessão ou ao parsing no cliente (flyctl/Windows); não indica falha do `uname -a`.

---

## PASSO 3 — Prova envalid e config/env no container

### 3.1 Comandos que rodaram com sucesso

| Comando | Saída relevante |
|--------|------------------|
| `flyctl ssh ... -C 'pwd'` | `/app` |
| `flyctl ssh ... -C 'node -p "process.version"'` | `v20.20.0` |
| `flyctl ssh ... -C 'ls node_modules'` | Lista de pacotes (veja abaixo) |

### 3.2 node_modules/envalid

```powershell
flyctl ssh console -a goldeouro-backend-v2 --machine 2874551a105768 -C 'ls -la node_modules/envalid || true'
```

**Saída (container):**

```
ls: node_modules/envalid: No such file or directory
ls: ||: No such file or directory
ls: true: No such file or directory
Error: ssh shell: Process exited with status 1
```

(O ambiente usa BusyBox; `|| true` foi interpretado como argumentos do `ls`.)

**Conclusão:** **Não existe `node_modules/envalid`** no filesystem do container em `/app`. A listagem de `ls node_modules` também **não contém** o diretório `envalid` (lista inclui dotenv, express, etc., sem envalid).

### 3.3 require('envalid') e require('./config/env')

Comandos com `-C 'node -e "require(\"envalid\"); ..."'` e variantes (aspas duplas no PowerShell, aspas simples) resultaram em:

- **flyctl:** `Error: accepts at most 1 arg(s), received 2` (PowerShell quebra o argumento `-C` em dois por causa das aspas).
- Ou comando enviado ao remoto de forma incorreta: `ssh: command node -e " require envalid failed` e parte do restante interpretada no **Windows** (ex.: `console.log` como cmdlet).

**Conclusão:** **Não foi possível executar** `require('envalid')` nem `require('./config/env')` dentro do container por limitação de quoting entre PowerShell e flyctl (um único argumento para `-C` com aspas aninhadas não foi passado corretamente). A prova direta de “envalid OK” / “env OK” via esses comandos **não foi obtida**.

### 3.4 Resumo envalid

| Prova | Resultado |
|-------|-----------|
| Presença de `node_modules/envalid` | **NÃO** — diretório inexistente; `envalid` não aparece em `ls node_modules` |
| `require('envalid')` no container | **Não executado** (problema de quoting PowerShell/flyctl) |
| `require('./config/env')` no container | **Não executado** (mesmo motivo) |

**Nota:** No repositório, `package.json` declara `"envalid": "^8.1.1"` e o Dockerfile faz `npm install --only=production`. A imagem atual (v305) em runtime **não** contém o pacote envalid em `/app/node_modules`, indicando que a imagem foi construída a partir de um estado em que envalid não estava instalado (ex.: lockfile/package.json diferente no build) ou que há camadas em cache antigas. O app está com health check passing; se o boot carregasse `config/env.js` (que faz `require('envalid')`), o processo falharia por MODULE_NOT_FOUND. Isso sugere que no código/entrypoint efetivamente em uso na imagem o carregamento de `config/env` pode não ocorrer no startup, ou que há outra explicação (ex.: build em outro contexto).

---

## PASSO 4 — Código reconciler e patch V1 na imagem v305

### 4.1 Conteúdo de src/domain/payout

```powershell
flyctl ssh console -a goldeouro-backend-v2 --machine 2874551a105768 -C 'ls -la src/domain/payout'
```

**Saída (container):**

```
total 20
drwxr-xr-x    2 root     root          4096 Feb  6 06:39 .
drwxr-xr-x    3 root     root          4096 Feb  6 06:39 ..
-rwxr-xr-x    1 root     root          9300 Feb  6 06:39 processPendingWithdrawals.js
```

**Conclusão:** Na imagem há **apenas** `processPendingWithdrawals.js`. **Não existe** `reconcileProcessingWithdrawals.js` no container. Datas dos arquivos: **Feb 6 06:39**.

### 4.2 Grep reconcileProcessingWithdrawals

```powershell
flyctl ssh console -a goldeouro-backend-v2 --machine 2874551a105768 -C "grep -R reconcileProcessingWithdrawals src/domain/payout"
```

**Saída:** `Process exited with status 1` (grep não encontrou nenhuma ocorrência).

**Conclusão:** A string **reconcileProcessingWithdrawals** **não existe** em `src/domain/payout` na imagem.

### 4.3 Grep updateSaqueStatus em processPendingWithdrawals.js

```powershell
flyctl ssh console -a goldeouro-backend-v2 --machine 2874551a105768 -C "grep -n updateSaqueStatus src/domain/payout/processPendingWithdrawals.js"
```

**Saída:** `Process exited with status 1` (nenhuma linha encontrada).

**Conclusão:** O arquivo **processPendingWithdrawals.js** na imagem **não contém** a string `updateSaqueStatus`. No repositório local, `updateSaqueStatus` existe (função e export). Portanto a versão implantada é **anterior** ao patch que introduz `updateSaqueStatus` e o fluxo de reconciliação.

### 4.4 Resumo código na imagem v305

| Item | No repositório (local) | Na imagem v305 (container) |
|------|------------------------|----------------------------|
| `reconcileProcessingWithdrawals.js` | Existe | **Não existe** |
| `processPendingWithdrawals.js` contém `updateSaqueStatus` | Sim | **Não** (grep exit 1) |
| `processPendingWithdrawals.js` contém `reconcileProcessingWithdrawals` | Referenciado em reconciler | **Não** (grep exit 1) |

**Conclusão:** O código novo de **reconcileProcessingWithdrawals** e o **patch V1** (com `updateSaqueStatus` em processPendingWithdrawals.js) **não estão** na imagem atual (v305). A imagem reflete código de **Feb 6** (datas dos arquivos em `src/domain/payout`) e não inclui o reconciler nem as alterações do patch V1.

---

## ENTREGA — Conclusões

### SSH (GO/NO-GO)

- **GO para conectividade:** Após colocar o ssh-agent em **Running**, o comando `flyctl ssh console -a goldeouro-backend-v2 --machine 2874551a105768 -C 'uname -a'` executou com sucesso dentro do container. O SSH está utilizável para comandos simples com um único argumento `-C` e aspas simples no PowerShell.
- **Limitação:** Comandos com aspas aninhadas (ex.: `node -e "require('envalid'); ..."`) fazem o PowerShell/flyctl interpretar como múltiplos argumentos ou enviam o comando de forma incorreta ao remoto. Para provas que exijam strings complexas no `-C`, seria necessário outro método (script no container, uso de cmd em um único argumento escapado, ou execução em ambiente Linux/WSL).

### envalid no container

- **Presença de `node_modules/envalid`:** **NO-GO** — o pacote **não está** presente no container (diretório inexistente; não listado em `ls node_modules`).
- **Prova de `require('envalid')` / `require('./config/env')`:** **Não obtida** — os comandos não puderam ser executados no container devido ao quoting no Windows.

### Código reconciler e patch V1 na imagem v305

- **reconcileProcessingWithdrawals:** **NÃO** está na imagem — o arquivo `reconcileProcessingWithdrawals.js` não existe em `src/domain/payout`; grep por `reconcileProcessingWithdrawals` não encontra nada.
- **Patch V1 (updateSaqueStatus em processPendingWithdrawals.js):** **NÃO** está na imagem — grep por `updateSaqueStatus` em `processPendingWithdrawals.js` no container retorna exit 1. A imagem v305 contém uma versão **anterior** do domínio payout (datada Feb 6), sem o reconciler e sem as alterações do patch V1.

---

*Relatório gerado em modo read-only. Nenhum deploy, rebuild, alteração de env/secrets ou reinício foi realizado.*
