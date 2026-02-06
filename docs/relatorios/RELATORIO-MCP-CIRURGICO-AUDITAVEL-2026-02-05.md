# Relatório MCP — Reativação cirúrgica (auditável, sem risco)

**Data:** 05/02/2026  
**Modo:** Read-only. Nenhuma escrita em .env, código ou produção. Nenhum token gerado ou rotacionado.

---

## Regras aplicadas

- Modo READ-ONLY até instrução explícita do usuário.
- `.env` não foi lido, criado nem alterado.
- Nenhum token gerado, rotacionado ou sugerido (apenas placeholders).
- Código do projeto não alterado.
- Nenhum deploy executado.
- Nenhuma chamada que crie recursos externos.
- Ações logáveis e reversíveis (arquivos em `docs/relatorios/`).

---

## ETAPA 1 — AUDITORIA (READ-ONLY)

| Ação | Resultado |
|------|-----------|
| `list_mcp_resources` | Executado. Retorno: **No MCP resources found.** |
| Confirmação de ausência de MCPs | **Confirmado.** Nenhum recurso MCP exposto. |
| Existência de `cursor.json` | **Confirmado.** Arquivo existe (conteúdo não alterado). |
| Existência de `.cursor/mcp.json` | **Verificado.** Arquivo **não existe** no projeto. Pasta `.cursor/` contém apenas `commands/`. |

**Conclusão Etapa 1:** Estado compatível com reativação; nenhuma config existente foi apagada ou alterada.

---

## ETAPA 2 — GERAÇÃO CONTROLADA

| Ação | Resultado |
|------|-----------|
| Arquivo `mcp.json` completo gerado | **Sim.** |
| Supabase | Modo **read-only** (`--read-only`). Token: placeholder `SUPABASE_ACCESS_TOKEN_PLACEHOLDER`. |
| Fly.io | Não incluído no JSON; registro via comando único `fly mcp server --cursor` (MCP oficial Fly). |
| Mercado Pago | URL oficial; header Authorization com placeholder `MERCADOPAGO_ACCESS_TOKEN_PLACEHOLDER`. Uso somente GETs (sem criação de recursos). |
| Vercel | MCP oficial: `"url": "https://mcp.vercel.com"`. Sem token no arquivo (OAuth). |
| Tokens | **Apenas placeholders.** Nenhum valor real escrito. |
| Destino do arquivo gerado | **`docs/relatorios/MCP-REGISTRO-CURSOR-GERADO.json`** |

**Conclusão Etapa 2:** Arquivo gerado em local auditável; intervenção humana restrita a substituir placeholders por credenciais existentes.

---

## ETAPA 3 — INSTRUÇÕES HUMANAS MINIMIZADAS

| Conteúdo | Onde |
|----------|------|
| Onde colar o arquivo | `.cursor/mcp.json` (caminho exato indicado) ou `~/.cursor/mcp.json`. |
| O que substituir | Dois placeholders: `SUPABASE_ACCESS_TOKEN_PLACEHOLDER` e `MERCADOPAGO_ACCESS_TOKEN_PLACEHOLDER` (por credenciais existentes). |
| Comando único | `fly mcp server --cursor` (uma vez, no terminal). |
| Aviso OAuth Vercel | Incluído: se o navegador abrir, autorizar com conta existente; nenhum token novo. |

**Arquivo de instruções:** **`docs/relatorios/INSTRUCOES-MCP-DETERMINISTICAS-2026-02-05.md`**

**Conclusão Etapa 3:** Instruções determinísticas, sem decisões técnicas adicionais.

---

## ETAPA 4 — VALIDAÇÃO PÓS-REGISTRO (READ-ONLY)

A executar **após** os MCPs aparecerem no Cursor:

| MCP | Teste permitido |
|-----|-----------------|
| Supabase | Listar tabelas |
| Fly.io | Status do app |
| Mercado Pago | GET informativo |
| Vercel | Listar projetos |

Nenhuma escrita. Nenhum deploy. Nenhuma alteração de token.

---

## Critério de sucesso (a verificar pelo usuário)

- [ ] MCPs visíveis no Cursor (Settings → Features → MCP).
- [ ] Nenhuma escrita em produção.
- [ ] Nenhuma alteração de token (apenas reutilização de existentes).
- [ ] Código intacto.

---

## Arquivos criados (reversíveis)

| Arquivo | Ação reversível |
|---------|------------------|
| `docs/relatorios/MCP-REGISTRO-CURSOR-GERADO.json` | Remoção ou edição não afeta runtime. |
| `docs/relatorios/INSTRUCOES-MCP-DETERMINISTICAS-2026-02-05.md` | Documentação; remoção não afeta runtime. |
| `docs/relatorios/RELATORIO-MCP-CIRURGICO-AUDITAVEL-2026-02-05.md` | Este relatório; apenas registro. |

Nenhum arquivo em `.env`, `.cursor/` (protegido) ou código-fonte foi criado ou alterado por esta execução.

---

## Violação de regras

Nenhuma. Nenhum passo executado leu ou alterou `.env`, gerou tokens, alterou código ou executou deploy. Em caso de dúvida em passo futuro: parar, gerar relatório, não “consertar” automaticamente.

---

**Relatório gerado em:** 05/02/2026  
**Projeto:** Gol de Ouro — reativação MCPs modo cirúrgico.
