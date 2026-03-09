# Auditoria read-only — Commit exato da imagem em produção (Fly v311)

**Data:** 2026-03-04  
**Objetivo:** Identificar qual commit do repositório gerou a imagem da release v311.  
**Regras:** Zero alterações (código, banco, deploy). Apenas leitura (git, flyctl, grep, cat).

---

## 1) Metadados da release v311 (Fly)

**Comando:** `flyctl releases -a goldeouro-backend-v2 --json`

**Extraído para a release v311:**

| Campo        | Valor |
|-------------|--------|
| **Version** | 311 |
| **Status**  | failed |
| **Description** | Release |
| **CreatedAt** | 2026-03-03T23:54:16Z |
| **ImageRef** | registry.fly.io/goldeouro-backend-v2:deployment-01KJV1YH1Y3CATDV6VQA5Z3K3J |
| **User.Email** | indesconectavel@gmail.com |
| **Metadata** | null |
| **Stable** | false |
| **InProgress** | false |

**Referência a commit SHA:** Nenhuma. O objeto da release não traz `Metadata`, `Description` customizada nem campo com SHA do Git. A API do Fly (releases --json) **não expõe o commit** usado no build.

---

## 2) Labels da imagem (tentativa)

**Comando:**  
`flyctl image show goldeouro-backend-v2:deployment-01KJV1YH1Y3CATDV6VQA5Z3K3J -a goldeouro-backend-v2 --json`

**Resultado:**  
`Error: failed to get machine: failed to get VM goldeouro-backend-v2:deployment-01KJV1YH1Y3CATDV6VQA5Z3K3J: machine not found`

Não foi possível obter labels da imagem (ex.: `org.opencontainers.image.revision`) nesta sessão. O **Dockerfile** do projeto não define LABELs com git SHA; o build padrão (`COPY . .`) não injeta commit na imagem.

---

## 3) Histórico Git e patch do ledger

### 3.1) Últimos commits (main e contexto)

**Comando:** `git log main --oneline --format="%h %ad %s" --date=iso -n 20`

```
97e67b2 2026-02-28 17:23:25 -0300 Merge branch 'hotfix/withdraw-real-endpoints' into main - withdraw real endpoints
8f4dec1 2026-02-28 16:52:31 -0300 fix(withdraw): use real withdraw endpoints and reload profile
7afa349 2026-02-25 15:56:39 -0300 fix(cors): allow goldeouro-player vercel previews
3ae3786 2026-02-06 03:39:39 -0300 Merge pull request #29 ...
...
3624a19 2026-02-02 14:02:36 -0300 release: payout worker + correção supabase ping (1.2.1)
```

### 3.2) Commits que tocam em `processPendingWithdrawals.js`

**Comando:**  
`git log --all --oneline --format="%h %ad %s" --date=iso -- "**/processPendingWithdrawals.js"`

**Resultado:** Apenas **um** commit altera esse arquivo em todo o histórico (todas as refs):

| SHA      | Data (iso)            | Assunto |
|----------|------------------------|---------|
| **3624a19** | 2026-02-02 14:02:36 -0300 | release: payout worker + correção supabase ping (1.2.1) |

### 3.3) Conteúdo do arquivo no commit 3624a19 e no main (97e67b2)

No commit **3624a19** e no **main (97e67b2)** o arquivo `src/domain/payout/processPendingWithdrawals.js`:

- **Não contém** `ledgerUserIdColumn`
- **Não contém** a função `insertLedgerRow`
- Contém apenas `createLedgerEntry` com insert **direto** em `ledger_financeiro` usando **apenas** `usuario_id` (sem fallback para `user_id`).

Trecho típico nesses commits:

```js
const { data, error } = await supabase
  .from('ledger_financeiro')
  .insert({
    tipo,
    usuario_id: usuarioId,
    valor: parseFloat(valor),
    ...
  })
```

### 3.4) Onde está o patch (ledgerUserIdColumn + insertLedgerRow)

**Comandos:**  
`git log -S "ledgerUserIdColumn" --oneline` e `git log -S "insertLedgerRow" --oneline`  
**Resultado:** Nenhum commit listado em nenhuma ref.

Conclusão: o patch (cache `ledgerUserIdColumn`, função `insertLedgerRow` com tentativa `user_id` e fallback `usuario_id`) **existe apenas no working tree** (arquivo modificado, não commitado). Não há commit no repositório que inclua esse patch.

---

## 4) Comparação temporal e hipótese

| Evento | Data / Observação |
|--------|--------------------|
| **Release v311** | 2026-03-03T23:54:16Z |
| **Único commit que altera processPendingWithdrawals.js** | 3624a19 — 2026-02-02 (sem patch) |
| **Merge atual em main** | 97e67b2 — 2026-02-28 |
| **Patch (ledgerUserIdColumn / insertLedgerRow)** | Não commitado; apenas em working tree |

- A imagem v311 foi criada **depois** do último merge em main (97e67b2). O deploy via CI (push em `main`) usaria o commit no **HEAD de main** no momento do build (possivelmente 97e67b2 ou outro posterior que não altere esse arquivo).
- Em **qualquer** commit conhecido do repositório (incluindo 97e67b2 e 3624a19), o arquivo **não** contém o patch.
- Portanto: se a imagem v311 foi construída a partir do repositório (ex.: GitHub Actions a partir de `main`), ela **não** inclui o patch do ledger.

---

## 5) Conclusão

### SHA do commit da imagem v311

- **Não identificado.** A API do Fly (releases --json) não fornece SHA; a tentativa de inspecionar a imagem com `flyctl image show` falhou; o Dockerfile não grava SHA em LABEL.

### Commit do patch do ledger

- **Não existe.** O patch (ledgerUserIdColumn + insertLedgerRow com user_id/usuario_id) **nunca foi commitado**; existe apenas como alteração local no arquivo `src/domain/payout/processPendingWithdrawals.js`.

### Comparação temporal (objetiva)

- Release v311: 2026-03-03 23:54 UTC.  
- Único commit que toca no arquivo: 3624a19 (2026-02-02), **sem** patch.  
- Patch: só no working tree, sem data de commit.

---

## PATCH INCLUÍDO NA IMAGEM v311: **NÃO**

**Motivo:** O patch do ledger (user_id ↔ usuario_id) não está em nenhum commit do repositório. A imagem v311 foi construída a partir de um commit (não identificável pelo Fly nesta auditoria) que, no estado atual do histórico Git, contém a versão **sem** patch (apenas `usuario_id` no insert do ledger). Para que o patch esteja em produção, é necessário commitá-lo, fazer merge em `main` e realizar um novo deploy.

---

*Auditoria realizada em modo estritamente read-only. Nenhum arquivo alterado (exceto criação deste .md), nenhum deploy, nenhuma escrita em banco.*
