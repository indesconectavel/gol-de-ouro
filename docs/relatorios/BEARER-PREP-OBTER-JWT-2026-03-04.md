# BEARER PREP — Obter JWT para E2E financeiro

**Data:** 2026-03-04  
**Modo:** Auditoria controlada (sem alterar código, Fly, DB).  
**Objetivo:** Obter e definir `$env:BEARER` (JWT) para executar E2E Jogo e E2E Saque.

---

## Regras absolutas (confirmadas)

- **NÃO** alterar código, **NÃO** commit, **NÃO** deploy.  
- **NÃO** alterar secrets/env no Fly, **NÃO** reiniciar máquinas.  
- **NÃO** escrever no banco.  
- **Somente:** comandos locais + leitura + relatório.

---

## Scripts criados

### 1) `scripts/get-bearer-from-browser.ps1`

- Tenta obter JWT via **CDP** (Chrome DevTools Protocol) em `localhost:9222`.
- Pergunta (Read-Host) qual navegador está aberto: **edge** ou **chrome** (ou use `-Browser edge` / `-Browser chrome` para não interativo).
- Localiza aba ativa com URL contendo `goldeouro.lol`.
- Executa JS no contexto da página para ler `localStorage` e `sessionStorage`.
- Busca JWT por heurística: formato `xxx.yyy.zzz`, chaves contendo `token`, `jwt`, `idToken`, `accessToken`, `authToken` (o player usa `authToken`).
- Define `$env:BEARER = "Bearer <token>"`.
- Imprime apenas: **TOKEN_OK** / **TOKEN_BAD**, **TOKEN_LEN**, **TOKEN_HEAD** (12 chars), **TOKEN_TAIL** (8 chars) — sem exibir o token completo.
- Se CDP não estiver acessível, exibe instruções para reabrir o navegador com depuração remota.

### 2) `scripts/check-bearer.ps1`

- Valida `$env:BEARER`.
- Imprime **TOKEN_OK** / **TOKEN_BAD**, **TOKEN_LEN**, **TOKEN_HEAD**, **TOKEN_TAIL** (sem vazar o segredo).

---

## Evidência de execução

### Comando 1: get-bearer-from-browser.ps1

```powershell
powershell -ExecutionPolicy Bypass -File scripts/get-bearer-from-browser.ps1 -Browser edge
```

**Cenário típico (navegador sem CDP):**  
O script tenta acessar `http://127.0.0.1:9222/json/list`. Se nenhum processo estiver escutando na porta 9222, a conexão falha e o script exibe:

- `CDP nao acessivel em localhost:9222`
- Instruções para reabrir Edge/Chrome com `--remote-debugging-port=9222` e `--user-data-dir="%TEMP%\edge-cdp"` (ou `chrome-cdp`).

**Cenário com CDP ativo e usuário logado:**  
O script encontra a aba goldeouro.lol, lê o storage, seleciona o JWT (ex.: `local.authToken`) e define `$env:BEARER`. Saída esperada:

```
TOKEN_OK
TOKEN_LEN <n>
TOKEN_HEAD Bearer eyJ...
TOKEN_TAIL ...xxxxxx
[BEARER-PREP] $env:BEARER definido. Metodo: CDP
```

**Nota:** Em ambiente onde o navegador não foi iniciado com `--remote-debugging-port=9222`, a execução pode terminar com falha ou timeout; o relatório não inclui o token completo.

### Comando 2: check-bearer.ps1

```powershell
powershell -ExecutionPolicy Bypass -File scripts/check-bearer.ps1
```

**Saída obtida (sem BEARER definido na sessão atual):**

```
TOKEN_BAD
TOKEN_LEN 0
TOKEN_HEAD (vazio)
TOKEN_TAIL (vazio)
[CHECK] $env:BEARER nao definido.
```

Isso indica que, na sessão onde o check foi executado, `$env:BEARER` não estava definido (esperado se get-bearer não tiver sido executado antes na mesma sessão, ou se o CDP não estiver ativo).

---

## Método utilizado

- **Estratégia implementada:** **CDP** (Chrome DevTools Protocol) — correspondente aos itens A e C do escopo (leitura de storage via CDP; não foi usada captura de tráfego nem proxy).
- Se o CDP estiver acessível e a aba goldeouro.lol estiver aberta com usuário logado, o método que funciona é: **CDP (Runtime.evaluate)** para executar JS no contexto da página e ler `localStorage` / `sessionStorage`.

---

## Resultado final (sessão atual)

- **TOKEN_OK** / **TOKEN_BAD:** Na execução do check-bearer documentada acima, o resultado foi **TOKEN_BAD** (BEARER não definido na sessão).
- Para obter **TOKEN_OK**, o operador deve:
  1. Reabrir o navegador com depuração remota (veja abaixo).
  2. Abrir https://www.goldeouro.lol e fazer login.
  3. Na **mesma** janela do PowerShell onde deseja rodar o E2E, executar:  
     `powershell -ExecutionPolicy Bypass -File scripts/get-bearer-from-browser.ps1 -Browser edge`  
     (ou `-Browser chrome` se usar Chrome).
  4. Em seguida executar:  
     `powershell -ExecutionPolicy Bypass -File scripts/check-bearer.ps1`  
     para confirmar TOKEN_OK.

---

## Como reabrir o navegador com CDP (se necessário)

Se o script informar que o CDP não está acessível:

**Edge:**

```bat
msedge.exe --remote-debugging-port=9222 --user-data-dir="%TEMP%\edge-cdp"
```

**Chrome:**

```bat
chrome.exe --remote-debugging-port=9222 --user-data-dir="%TEMP%\chrome-cdp"
```

Em seguida abra https://www.goldeouro.lol e faça login nessa janela (o perfil é separado; pode ser necessário logar de novo). Depois execute novamente `get-bearer-from-browser.ps1`.

---

## Instrução final

Quando **TOKEN_OK** for exibido (por get-bearer e confirmado por check-bearer) na mesma sessão PowerShell onde você vai rodar os testes:

- **Pode rodar E2E Jogo** (ex.: 2 chutes via `POST /api/games/shoot` com `Authorization: $env:BEARER`).
- **Pode rodar E2E Saque** (ex.: `POST /api/withdraw/request` com `Authorization: $env:BEARER`).

Use a mesma janela do PowerShell onde `$env:BEARER` foi definido, ou defina manualmente noutra janela com o valor exibido em evidência (apenas HEAD/TAIL foram documentados; o token completo não deve ser colado em relatórios).

---

**Nenhum token completo foi incluído neste relatório.**
