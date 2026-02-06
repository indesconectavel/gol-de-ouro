# Instruções MCP — Determinísticas (reativação cirúrgica)

**Data:** 05/02/2026  
**Modo:** Read-only até execução humana. Nenhuma alteração em .env, código ou produção.

---

## Onde colar o arquivo

1. Abra o arquivo: **`docs/relatorios/MCP-REGISTRO-CURSOR-GERADO.json`**
2. Copie **todo** o conteúdo (Ctrl+A, Ctrl+C).
3. Crie o arquivo **`.cursor/mcp.json`** na raiz do projeto (pasta **`goldeouro-backend`** → dentro da pasta **`.cursor`**).
   - Caminho completo: **`goldeouro-backend/.cursor/mcp.json`**
   - Se a pasta `.cursor` não existir, crie-a primeiro.
4. Cole o conteúdo copiado em `.cursor/mcp.json`.
5. Salve o arquivo.

**Alternativa (config global):** Se preferir config global, use o arquivo **`~/.cursor/mcp.json`** (Windows: **`C:\Users\<SEU_USUARIO>\.cursor\mcp.json`**) e cole o mesmo conteúdo lá.

---

## O que substituir (placeholders)

No arquivo **`.cursor/mcp.json`** (após colar), faça **apenas** estas duas substituições de texto:

| Buscar (exatamente) | Substituir por |
|---------------------|----------------|
| `SUPABASE_ACCESS_TOKEN_PLACEHOLDER` | Seu Personal Access Token do Supabase (Dashboard → Account → Access Tokens). Credencial existente. |
| `MERCADOPAGO_ACCESS_TOKEN_PLACEHOLDER` | Seu Access Token do Mercado Pago (aplicação em uso). Credencial existente. |

- Não altere mais nenhum texto no JSON.
- Não crie tokens novos; use apenas os que você já possui.
- Salve o arquivo após as substituições.

**Vercel:** Nenhuma substituição. Na primeira vez que o Cursor usar o MCP Vercel, pode abrir o navegador para **OAuth**. Se isso ocorrer, autorize com a conta Vercel que você já usa no projeto. Nenhuma nova credencial precisa ser criada.

---

## Comando único necessário (Fly.io)

No terminal (com **flyctl** instalado e já autenticado), execute **uma única vez**:

```bash
fly mcp server --cursor
```

Isso registra o MCP do Fly.io no Cursor. Não é necessário colar nenhum token no arquivo para o Fly.

---

## Aviso — OAuth Vercel

Se, ao usar o MCP Vercel pela primeira vez, o Cursor abrir uma página no navegador pedindo login na Vercel:

- Trata-se de **OAuth** (autorização do app com sua conta).
- Use a **mesma conta Vercel** que já usa no projeto (goldeouro-player / goldeouro.lol).
- Nenhum token novo deve ser gerado por você; a Vercel gerencia a sessão após o OAuth.

---

## Validação pós-registro (read-only)

Após os MCPs aparecerem no Cursor (Settings → Features → MCP):

| MCP | Ação permitida (somente leitura) |
|-----|-----------------------------------|
| Supabase | Listar tabelas |
| Fly.io | Status do app (ex.: `flyctl status --app goldeouro-backend-v2`) |
| Mercado Pago | GET informativo (ex.: métodos de pagamento) |
| Vercel | Listar projetos |

- Nenhuma escrita. Nenhum deploy. Nenhuma alteração de token. Código intacto.

---

**Arquivo gerado:** `docs/relatorios/MCP-REGISTRO-CURSOR-GERADO.json`  
**Destino:** `.cursor/mcp.json` (ou `~/.cursor/mcp.json`).
