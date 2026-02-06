# Relatório de verificação MCP — Modo read-only

**Data:** 05/02/2026  
**Modo:** ESTRITAMENTE read-only. Nenhuma configuração, criação de tokens ou alteração de arquivos.

---

## Objetivo

Verificar se os MCPs (Model Context Protocol) estão ativos no ambiente do Cursor e produzir relatório auditável.

---

## Método de inspeção

| Ação | Ferramenta / método |
|------|----------------------|
| Listagem de MCPs reconhecidos | `list_mcp_resources` (única API de inspeção MCP utilizada nesta sessão) |

Nenhum arquivo foi lido (incluindo `.env` e `.cursor/mcp.json`). Nenhum comando de escrita ou registro foi executado.

---

## Resultado da inspeção

| Verificação | Resultado |
|-------------|-----------|
| Chamada a `list_mcp_resources` | Executada. |
| Retorno | **No MCP resources found.** |

Interpretação: nenhum recurso MCP está exposto nesta sessão do Cursor. Ou seja, nenhum servidor MCP está atualmente forneciendo recursos (ferramentas/recursos) ao agente.

---

## MCPs detectados — status por evidência

| MCP | Status | Evidência |
|-----|--------|-----------|
| **Fly.io** | **Ausente (sem recursos)** | `list_mcp_resources` não retornou recursos. Não há como distinguir por nome na API usada; o conjunto total de recursos está vazio. Registro prévio via `fly mcp server --cursor` (exit 0) não se reflete em recursos expostos nesta sessão. |
| **Supabase** | **Ausente (sem recursos)** | Mesmo conjunto vazio. Supabase não foi registrado anteriormente (falta de token); coerente com ausência de recursos. |
| **Vercel** | **Ausente (sem recursos)** | Mesmo conjunto vazio. Vercel não foi registrado anteriormente (OAuth); coerente com ausência de recursos. |
| **Mercado Pago** | **Não inspecionado** | Por instrução: dois apps (depósito/saque), não devem ser alterados. Nenhuma verificação adicional realizada. |

Não foi possível listar “servidores MCP por nome” (Fly, Supabase, Vercel); apenas a listagem global de recursos MCP, que está vazia.

---

## Confirmação explícita — Fly.io MCP

- **Registro:** Há registro prévio via CLI (`fly mcp server --cursor`, exit 0).
- **Funcionalidade nesta sessão:** **Sem evidência de que esteja funcional.** Nenhum recurso MCP (incluindo Fly) foi retornado por `list_mcp_resources`.
- **Conclusão:** Fly.io MCP está **no máximo registrado** (config); **não há evidência de que esteja ativo ou funcional** na sessão atual, pois não expõe recursos.

---

## Status final

| Categoria | Resultado |
|-----------|-----------|
| **MCPs ATIVOS** | **Nenhum.** Zero recursos MCP disponíveis. |
| **MCPs INATIVOS / AUSENTES** | Todos os MCPs considerados (Fly.io, Supabase, Vercel) estão **ausentes** do ponto de vista de recursos expostos. |
| **Evidência** | Única fonte usada: `list_mcp_resources` → retorno vazio. |

---

## Resumo técnico

- **Fonte de verdade:** `list_mcp_resources`.
- **Retorno:** vazio.
- **Status final:** **MCPs NÃO ATIVOS** (nenhum recurso MCP detectado).
- Nenhuma alteração de configuração, arquivos ou credenciais foi realizada. Relatório apenas diagnóstico.

---

**Relatório gerado em:** 05/02/2026  
**Projeto:** Gol de Ouro — verificação MCP read-only.
