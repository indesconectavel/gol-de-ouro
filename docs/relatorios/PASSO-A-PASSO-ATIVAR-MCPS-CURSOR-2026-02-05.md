# Passo a passo: ativar MCPs no Cursor (Gol de Ouro)

**Data:** 05/02/2026  
**Objetivo:** Ativar os MCPs Supabase, Fly.io, Mercado Pago, Vercel e GitHub no Cursor para auditoria e uso no projeto.

---

## Onde o Cursor procura a configuração MCP

- **Por projeto:** `.cursor/mcp.json` na raiz do repositório (recomendado para time e para não expor tokens no global).
- **Global (todas as pastas):** `~/.cursor/mcp.json` (Windows: `C:\Users\<SEU_USUARIO>\.cursor\mcp.json`).

Use **um** dos dois. Para o Gol de Ouro, o ideal é **por projeto**, com variáveis de ambiente para tokens (veja seção 6).

---

## 1. Supabase

### O que você precisa

- Node.js ≥ 16.
- **Personal Access Token (PAT)** do Supabase: [Supabase Dashboard](https://supabase.com/dashboard) → Account → **Access Tokens** → Create token (ex.: "MCP Cursor").

### Ativar no Cursor

**Opção A – Arquivo de configuração (recomendado com env var):**

1. Crie ou edite `.cursor/mcp.json` na raiz do projeto.
2. Inclua o bloco do Supabase (use env var para o token):

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "${SUPABASE_ACCESS_TOKEN}"
      ]
    }
  }
}
```

3. Defina a variável de ambiente `SUPABASE_ACCESS_TOKEN` com o PAT (no sistema ou no `.env` que o Cursor carrega, se suportado).
4. Se preferir token fixo (menos seguro): troque `"${SUPABASE_ACCESS_TOKEN}"` pelo token entre aspas.

**Opção B – Somente leitura (auditoria):** adicione `"--read-only"` em `args`:

```json
"args": [
  "-y",
  "@supabase/mcp-server-supabase@latest",
  "--access-token",
  "${SUPABASE_ACCESS_TOKEN}",
  "--read-only"
]
```

**O que o MCP permite:** listar projetos, rodar SQL, migrações, branches, logs, gerar tipos TypeScript, Edge Functions.

---

## 2. Fly.io

### O que você precisa

- **flyctl** instalado e logado (`fly auth login`).
- Para o Cursor usar o MCP do Fly, o próprio Fly configura o Cursor.

### Ativar no Cursor

1. Abra um terminal na raiz do projeto.
2. Execute:

```bash
fly mcp server --cursor
```

Isso grava a configuração do MCP do Fly no Cursor (global ou no projeto, conforme o flyctl).

**Se pedir caminho do config:**

```bash
fly mcp server --cursor --config "E:\Chute de Ouro\goldeouro-backend\.cursor\mcp.json"
```

**Testar o servidor MCP (opcional):**

```bash
fly mcp server -i
```

Abre o inspector em `http://127.0.0.1:6274`.

**O que o MCP permite:** apps, certs, logs, machines, orgs, platform, secrets, status, volumes (status e logs do backend e do payout_worker).

---

## 3. Mercado Pago

### O que você precisa

- **Access Token** da aplicação Mercado Pago (produção ou sandbox), do [Dashboard de Desenvolvedores](https://www.mercadopago.com.br/developers).

### Ativar no Cursor

1. Edite `.cursor/mcp.json` e adicione o servidor (a URL oficial pode ser `https://mcp.mercadopago.com/mcp` ou `https://mcp.mercadolibre.com/mcp` – confira na documentação atual do Mercado Pago).
2. Exemplo com token em header:

```json
{
  "mcpServers": {
    "mercadopago": {
      "url": "https://mcp.mercadopago.com/mcp",
      "headers": {
        "Authorization": "Bearer SEU_ACCESS_TOKEN"
      }
    }
  }
}
```

3. Substitua `SEU_ACCESS_TOKEN` pelo token real. Para não colocar no JSON, use o token que já está em `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` (ou o que o projeto usar) e documente no time que esse é o valor a colocar em `Authorization`.
4. Se a documentação do Mercado Pago indicar outra URL (ex.: `mcp.mercadolibre.com`), use a URL oficial atual.

**O que o MCP oferece:** acesso à documentação, sugestões de código e avaliação de integração (conforme documentação Mercado Pago).

---

## 4. Vercel

### O que você precisa

- Conta Vercel com o projeto (ex.: `goldeouro-player`) e domínio (ex.: goldeouro.lol).

### Ativar no Cursor

1. Edite `.cursor/mcp.json` e adicione:

```json
{
  "mcpServers": {
    "vercel": {
      "url": "https://mcp.vercel.com"
    }
  }
}
```

2. Salve e recarregue os MCPs no Cursor (ou reinicie o Cursor).
3. Na primeira vez que o Cursor usar o MCP Vercel, deve abrir **OAuth** no navegador para você autorizar a conta Vercel.

**O que o MCP permite:** projetos, deploys, logs de deploy, variáveis de ambiente, times (somente leitura conforme uso).

---

## 5. GitHub

### O que você precisa

- **GitHub Personal Access Token (PAT)** com escopo `repo` (e outros que você precisar para issues/PRs).
- Node.js ≥ 16.

### Ativar no Cursor

1. Edite `.cursor/mcp.json` e adicione:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "SEU_PAT_AQUI"
      }
    }
  }
}
```

2. Substitua `SEU_PAT_AQUI` pelo PAT. Melhor não commitar o token: use variável de ambiente no sistema e, se o Cursor suportar, algo como `"GITHUB_TOKEN": "${GITHUB_TOKEN}"` (conforme documentação do Cursor para env em MCP).
3. Se já tiver `GITHUB_TOKEN` no ambiente, pode usar só:

```json
"env": {
  "GITHUB_TOKEN": "<valor ou referência ao env>"
}
```

**O que o MCP permite:** criar/editar/fechar issues, comentários, labels, buscar repositórios e informações de commits/PRs (conforme o servidor `server-github`).

---

## 6. Arquivo único `.cursor/mcp.json` (exemplo)

Exemplo juntando todos (tokens devem vir de variáveis de ambiente ou ser preenchidos com cuidado):

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--access-token",
        "${SUPABASE_ACCESS_TOKEN}",
        "--read-only"
      ]
    },
    "vercel": {
      "url": "https://mcp.vercel.com"
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "mercadopago": {
      "url": "https://mcp.mercadopago.com/mcp",
      "headers": {
        "Authorization": "Bearer ${MERCADOPAGO_ACCESS_TOKEN}"
      }
    }
  }
}
```

**Nota:** O Fly.io é adicionado separadamente com `fly mcp server --cursor`; o comando atualiza o `mcp.json` (ou o config global) e insere o servidor `fly` com o comando correto. Depois de rodar, abra o `mcp.json` e confira se o bloco `fly` apareceu.

---

## 7. Variáveis de ambiente (tokens)

Para não colocar tokens no repositório:

- **Windows (PowerShell – sessão atual):**  
  `$env:SUPABASE_ACCESS_TOKEN = "seu_token"`
- **Windows (permanente):** Configurações do sistema → Variáveis de ambiente → Novo (usuário ou sistema).
- **Arquivo local (não commitar):** `.env` na raiz; o Cursor em alguns setups carrega `.env` para o processo. Confira na documentação do Cursor se `mcp.json` usa variáveis desse `.env`.

Se o Cursor não expandir `${VAR}` no `mcp.json`, use o valor direto só na máquina local ou use o método recomendado na documentação atual do Cursor para env em MCP.

---

## 8. Conferir se os MCPs estão ativos

1. Abra **Cursor Settings** (Ctrl+,) → **Features** → **MCP** (ou **Cursor Settings** → **MCP**).
2. Verifique a lista de servidores; cada um deve aparecer com indicador verde quando estiver rodando.
3. Em um chat do Composer/Agent, peça por exemplo: “Listar tabelas do Supabase” ou “Status do app no Fly” para testar.

---

## 9. Resumo rápido

| MCP            | Como ativar                                                                 | Token / auth                    |
|----------------|-----------------------------------------------------------------------------|----------------------------------|
| **Supabase**   | Adicionar em `mcp.json` com `npx @supabase/mcp-server-supabase@latest`      | PAT → `SUPABASE_ACCESS_TOKEN`    |
| **Fly.io**     | Rodar no terminal: `fly mcp server --cursor`                               | flyctl já logado                 |
| **Mercado Pago** | Adicionar em `mcp.json` com `url` + header `Authorization: Bearer ...`  | Access Token da app MP           |
| **Vercel**     | Adicionar em `mcp.json` com `"url": "https://mcp.vercel.com"`              | OAuth na primeira uso            |
| **GitHub**     | Adicionar em `mcp.json` com `npx @modelcontextprotocol/server-github`      | PAT com escopo `repo` → `GITHUB_TOKEN` |

---

**Documento criado em:** 05/02/2026  
**Projeto:** Gol de Ouro – backend e auditoria.
