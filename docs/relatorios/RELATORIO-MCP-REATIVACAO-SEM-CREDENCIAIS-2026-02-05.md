# Relatório: Reativação MCPs sem criar/solicitar credenciais

**Data:** 05/02/2026  
**Modo:** READ-ONLY. Nenhum token criado. Nenhum .env lido ou alterado. Nenhum código de produção alterado.

---

## Regras aplicadas

- NÃO criar tokens.
- NÃO iniciar OAuth.
- NÃO modificar código de produção.
- NÃO alterar arquivos .env.
- NÃO solicitar ação humana.
- Operar em modo READ-ONLY.
- Tudo auditável e reversível.
- Se credencial não encontrada → abortar silenciosamente esse MCP (sem erro).

---

## Detecção — Tokens Mercado Pago no projeto

**Fonte:** Grep no código (sem leitura de .env).

| Uso no código | Variável de ambiente |
|---------------|----------------------|
| Depósitos PIX (server-fly.js, required-env.js) | `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN` |
| Saques PIX (pix-mercado-pago.js, payout-worker.js) | `MERCADOPAGO_PAYOUT_ACCESS_TOKEN` |
| Serviços alternativos (pix-service-real.js, pix-service.js, paymentController, production.js) | `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADOPAGO_ACCESS_TOKEN` |

Duas aplicações MP detectadas: uma para depósitos, uma para saques. Tokens já existem no projeto (referenciados no código); valores não foram lidos.

---

## Ações realizadas

| MCP | Ação | Resultado |
|-----|------|-----------|
| **Fly.io** | Executado `fly mcp server --cursor` (integração CLI existente). | Exit code 0. Registro enviado ao Cursor. |
| **Mercado Pago** | Não alterado. `.cursor/mcp.json` existe e está protegido (não escrita). Config que usa env var existente exigiria edição em `.cursor/mcp.json`; nenhuma edição foi feita. | MCP Mercado Pago não registrado nesta execução (abort silencioso). |
| **Supabase** | Ignorado. Ausência de `SUPABASE_ACCESS_TOKEN` no código (apenas SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY). | Supabase MCP não registrado. |
| **Vercel** | Ignorado. Credenciais válidas não verificadas (sem leitura de .env); evitar OAuth. | Vercel MCP não registrado. |

Nenhum .env alterado. Nenhum código alterado. Nenhum deploy. Nenhuma chamada que crie recursos externos.

---

## Validação — MCPs ativos

| Verificação | Resultado |
|-------------|-----------|
| `list_mcp_resources` (após registro Fly) | **Nenhum recurso retornado.** |
| Observação | Recursos MCP podem passar a aparecer após reinício do Cursor ou após o Fly ter atualizado config global (`~/.cursor/mcp.json`). |

Nenhum teste executado. Nenhum deploy. Nenhuma alteração de estado externo.

---

## Estado do arquivo de config MCP

- **`.cursor/mcp.json`:** Existe (referenciado no grep). **Não foi lido nem alterado** (arquivo sob proteção do ambiente).
- Nenhum arquivo em `docs/relatorios/` foi usado para sobrescrever ou substituir config existente; apenas este relatório foi gerado.

---

## Critério de sucesso (auditável)

- [x] Nenhum token criado.
- [x] Nenhum .env alterado.
- [x] Nenhum código de produção alterado.
- [x] Fly.io: comando único executado (CLI); exit 0.
- [x] Mercado Pago / Supabase / Vercel: ignorados conforme regras (sem erro).
- [x] Apenas listagem de MCPs ativos (list_mcp_resources); sem testes adicionais.

---

**Relatório gerado em:** 05/02/2026  
**Projeto:** Gol de Ouro — reativação MCPs sem criar/solicitar credenciais.
