# Reativação MCP — Instruções cirúrgicas (sem risco)

**Data:** 05/02/2026  
**Modo:** Registro mínimo. Nenhuma config apagada, nenhum token gerado, código do jogo não alterado.

---

## ETAPA 1 — CONFIRMAÇÃO (já feita)

- `list_mcp_resources` → **vazio** (MCPs não registrados no protocolo).
- `cursor.json` **não foi alterado**.
- `.env` **não foi lido nem modificado**.
- Nenhuma ação destrutiva foi executada.

---

## ETAPA 2 — REGISTRO MÍNIMO (você faz 2 passos)

### 2.1 Criar/atualizar o arquivo MCP do Cursor

1. Abra o arquivo que foi gerado neste repositório:  
   **`docs/relatorios/MCP-REGISTRO-CURSOR-mcp.json`**

2. Copie **todo** o conteúdo desse arquivo.

3. Crie ou edite o arquivo de configuração MCP do Cursor:
   - **No projeto:** `.cursor/mcp.json` (pasta `.cursor` na raiz do `goldeouro-backend`).
   - **Global (alternativa):** `~/.cursor/mcp.json` (Windows: `C:\Users\<seu_usuario>\.cursor\mcp.json`).

4. Cole o conteúdo copiado em `.cursor/mcp.json` (ou no global).

5. **Substitua apenas os placeholders** pelas suas credenciais **já existentes** (não crie tokens novos):
   - **Supabase:** troque `SEU_SUPABASE_PAT_OU_VAR_SUPABASE_ACCESS_TOKEN` pelo seu **Personal Access Token** do Supabase (Dashboard → Account → Access Tokens). Se você já usa variável `SUPABASE_ACCESS_TOKEN` no sistema, pode deixar no JSON como `${SUPABASE_ACCESS_TOKEN}` se o Cursor expandir; senão, cole o PAT diretamente.
   - **Mercado Pago:** troque `SEU_MERCADOPAGO_ACCESS_TOKEN` pelo **Access Token** que você já usa (ex.: o mesmo de `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` ou da aplicação em produção). Não crie preferência; o MCP é só para consulta.

6. **Vercel:** não precisa trocar nada no JSON. Na primeira vez que o Cursor usar o MCP Vercel, abrirá OAuth no navegador (use a conta que já usa no projeto).

7. Salve o arquivo.

**Se já existir `.cursor/mcp.json`:** abra o arquivo, **adicione** apenas os blocos que estiverem faltando (supabase, vercel, mercadopago). Não apague nada que já estiver lá.

---

### 2.2 Fly.io — um comando no terminal

No terminal (com **flyctl** instalado e já autenticado), execute **uma única vez**:

```bash
fly mcp server --cursor
```

Isso registra o MCP do Fly no Cursor (ele pode atualizar seu `mcp.json` automaticamente). Não é necessário colar credenciais; a sessão atual do flyctl é usada.

---

## ETAPA 3 — TESTE FINAL (read-only, após MCPs aparecerem)

Quando os MCPs voltarem a aparecer no Cursor (Settings → Features → MCP):

| MCP           | Teste permitido (somente leitura) |
|---------------|------------------------------------|
| **Supabase**  | SELECT simples ou listar tabelas   |
| **Fly.io**    | Status / listar machines           |
| **Mercado Pago** | GET informativo (ex.: métodos de pagamento) |
| **Vercel**    | Listar projetos / últimos deploys  |

- Nenhum deploy.  
- Nenhuma escrita.  
- Nenhuma alteração de variável.

---

## Regra absoluta

Se qualquer MCP:
- falhar no registro,
- pedir **novo** token,
- pedir permissão excessiva,

**PARE** e gere um relatório. Não “conserte” recriando tudo.

---

## Resultado esperado

- MCPs reaparecem no Cursor.
- Credenciais antigas preservadas.
- Zero impacto no jogo.
- Ambiente pronto para auditoria final (auth/JWT, PIX depósito/saque, checklist GO LIVE).

---

**Arquivo de config para copiar:** `docs/relatorios/MCP-REGISTRO-CURSOR-mcp.json`  
**Destino:** `.cursor/mcp.json` (ou ~/.cursor/mcp.json).
