# Relatório — Validação MCP pré-restart (read-only)

**Data:** 05/02/2026  
**Modo:** ESTRITAMENTE read-only. Nenhuma modificação realizada.

---

## 1. Análise do arquivo `.cursor/mcp.json`

| Verificação | Resultado |
|-------------|-----------|
| **Acesso ao arquivo** | **Não possível.** O caminho `.cursor/mcp.json` existe mas está filtrado por globalignore; conteúdo **não foi lido**. |
| **Declaração dos 4 MCPs** | **Não verificável** no repositório. A única configuração MCP acessível é o **template** em `docs/relatorios/MCP-REGISTRO-CURSOR-GERADO.json`. |
| **Placeholders no template** | No template: `SUPABASE_ACCESS_TOKEN_PLACEHOLDER`, `MERCADOPAGO_ACCESS_TOKEN_PLACEHOLDER`. |
| **Autenticação obrigatória** | No template: Supabase via `--access-token`; Mercado Pago via header `Authorization: Bearer ...`; Vercel apenas URL (OAuth); Fly.io **não está** no template (registro via CLI). |

**Conclusão:** Não foi possível analisar o arquivo real `.cursor/mcp.json`. As conclusões abaixo referem-se ao template versionado e ao estado atual dos MCPs (`list_mcp_resources` → vazio).

---

## 2. Validação Supabase MCP

| Item | Status |
|------|--------|
| Access token não é placeholder | **Não verificado** (arquivo real não lido). No template, é placeholder. |
| Modo read-only ativo | No template: `--read-only` presente em `args`. |
| Pronto para sobreviver ao restart | **Não confirmado.** Depende de `.cursor/mcp.json` ter token real; não foi possível validar. |

---

## 3. Validação Mercado Pago MCP

| Item | Status |
|------|--------|
| Header Authorization com token real | **Não verificado** (arquivo real não lido). No template, é placeholder. |
| Depende de ação manual | **Sim**, se o placeholder não foi substituído no `.cursor/mcp.json`. |

---

## 4. Validação Vercel MCP

| Item | Status |
|------|--------|
| Autenticação explícita (PAT / Authorization) | No template: **não há**; apenas `"url": "https://mcp.vercel.com"`. Autenticação por OAuth na primeira utilização. |
| Apenas declarado ou realmente pronto | **Não verificado.** Se OAuth ainda não foi concluído, o MCP pode não estar funcional até a primeira autorização no navegador. |

---

## 5. Validação Fly.io MCP

| Item | Status |
|------|--------|
| Declaração MCP no repositório | **Não.** O template `MCP-REGISTRO-CURSOR-GERADO.json` **não contém** bloco para Fly.io. |
| Documentação de binding local | **Sim.** Relatórios e instruções indicam registro via comando `fly mcp server --cursor` (configuração injetada pelo CLI, possivelmente em `~/.cursor/mcp.json` ou equivalente). |
| Depende de comando externo já executado | **Sim.** O MCP Fly.io depende de ter sido executado `fly mcp server --cursor`; não há declaração estática no template versionado. |

---

## 6. Riscos de reinicialização

| Risco | Avaliação |
|-------|-----------|
| MCP depende de contexto fora do repositório | **Sim.** Tokens (Supabase PAT, Mercado Pago) e possivelmente Fly config estão em `.cursor/mcp.json` ou config global, não versionados. Vercel depende de OAuth (conta). |
| Informação crítica não versionada/não configurada | **Possível.** Valores reais de `SUPABASE_ACCESS_TOKEN` e do token Mercado Pago não estão no repo; estado real de `.cursor/mcp.json` não foi verificável. |

---

## 7. Resumo — prontos / parciais / bloqueantes / pendências

### ✔️ MCPs prontos para restart

**Nenhum confirmado.** Não foi possível inspecionar `.cursor/mcp.json`; não há evidência de que todos os 4 MCPs estejam configurados com credenciais reais e ativos.

### ⚠️ MCPs parcialmente prontos

- **Vercel:** Declaração apenas com URL; pode funcionar após OAuth na primeira utilização.
- **Fly.io:** Pode estar pronto se `fly mcp server --cursor` já foi executado (config em outro arquivo); não há declaração no template do repo.

### ❌ MCPs que BLOQUEIAM o restart único (se ainda não corrigidos)

- **Supabase:** Se em `.cursor/mcp.json` o token ainda for `SUPABASE_ACCESS_TOKEN_PLACEHOLDER`, o MCP **não** funcionará após o restart.
- **Mercado Pago:** Se o header Authorization ainda usar `MERCADOPAGO_ACCESS_TOKEN_PLACEHOLDER`, o MCP **não** funcionará após o restart.
- **Fly.io:** Se `fly mcp server --cursor` **não** foi executado, o MCP Fly não estará registrado e **não** aparecerá após o restart.

### 📌 O que ainda precisa ser feito (lista objetiva)

1. Substituir em `.cursor/mcp.json` o valor `SUPABASE_ACCESS_TOKEN_PLACEHOLDER` pelo Personal Access Token real do Supabase (se ainda for placeholder).
2. Substituir em `.cursor/mcp.json` o valor `MERCADOPAGO_ACCESS_TOKEN_PLACEHOLDER` pelo Access Token real do Mercado Pago (se ainda for placeholder).
3. Executar uma vez no terminal, com flyctl autenticado: `fly mcp server --cursor` (se ainda não foi executado).
4. Na primeira utilização do MCP Vercel após o restart, concluir o OAuth no navegador se solicitado (se ainda não foi feito).

---

## Confirmação final obrigatória

**Pergunta:** POSSO REINICIAR O CURSOR AGORA SEM PERDER TEMPO OU PRECISAR REINICIAR NOVAMENTE?

**Resposta:** **NÃO**

**Motivo:** O arquivo `.cursor/mcp.json` não pôde ser lido (protegido). Não há como confirmar se os placeholders foram substituídos por tokens reais. O template versionado ainda contém placeholders e `list_mcp_resources` retorna vazio (nenhum MCP expondo recursos na sessão atual). Reiniciar agora, sem garantir que (1) Supabase e Mercado Pago tenham tokens reais em `.cursor/mcp.json` e (2) `fly mcp server --cursor` já foi executado, implica risco de os MCPs continuarem inativos e ser necessário novo ciclo (configurar e possivelmente reiniciar de novo).

**Lista objetiva do que falta (caso ainda não esteja feito):**

1. Em `.cursor/mcp.json`: trocar `SUPABASE_ACCESS_TOKEN_PLACEHOLDER` pelo PAT real do Supabase.
2. Em `.cursor/mcp.json`: trocar `MERCADOPAGO_ACCESS_TOKEN_PLACEHOLDER` pelo token real do Mercado Pago.
3. Executar no terminal: `fly mcp server --cursor` (uma vez, com flyctl autenticado).
4. Concluir OAuth do Vercel na primeira vez que o Cursor usar o MCP Vercel (se ainda não feito).

---

**Relatório gerado em:** 05/02/2026  
**Base:** Template versionado, list_mcp_resources, documentação. Arquivo `.cursor/mcp.json` não acessível.
