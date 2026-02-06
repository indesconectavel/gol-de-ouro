# Relatório final — Completude para ativação MCP (read-only)

**Data:** 05/02/2026  
**Modo:** Estritamente read-only. Nenhuma modificação de código, configuração ou infraestrutura.

---

## 1. Estado geral do repositório

### 1.1 Estrutura de pastas (principais)

| Caminho | Conteúdo |
|--------|----------|
| Raiz | `server-fly.js`, `cursor.json`, `fly.toml`, `router.js`, scripts e docs de auditoria |
| `.cursor/` | `commands/` (5 .md), `mcp.json` (existente; não lido) |
| `config/` | `required-env.js`, `production.js`, `env.js`, `system-config.js` |
| `database/` | Schemas SQL, `supabase-config.js`, `supabase-unified-config.js` |
| `src/workers/` | `payout-worker.js` (único worker listado) |
| `services/` | PIX, email, cache, etc. |
| `goldeouro-player/` | Frontend (Vite/React) |
| `goldeouro-admin/` | Painel admin |
| `docs/mcps/` | 19 arquivos (configuração MCP, tokens, guias) |
| `docs/relatorios/` | Relatórios de MCP, fluxos PIX, checklist GO LIVE, instruções determinísticas |

### 1.2 Principais serviços

- **Backend:** `server-fly.js` (Express), porta 8080.
- **Workers:** `payout_worker` definido em `fly.toml` como `node src/workers/payout-worker.js`; referenciado no código.
- **Frontend:** `goldeouro-player` (deploy Vercel).
- **Admin:** `goldeouro-admin`.

### 1.3 Arquivos de configuração

- **Existentes:** `config/required-env.js`, `config/production.js`, `config/env.js`, `config/system-config.js`.
- **`.env.example`:** Presente na raiz, em `goldeouro-admin`, `goldeouro-player` e `ops/snapshots`; conteúdo não lido (regra read-only).
- **Variáveis obrigatórias no código:** Em `server-fly.js` + `required-env.js`: `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`; em produção: `MERCADOPAGO_DEPOSIT_ACCESS_TOKEN`.

---

## 2. Sinais explícitos ou implícitos de MCPs

### 2.1 Documentação

- **docs/mcps/:** CONFIGURACAO-MCPS-INSTALADOS.md, MCPS-INSTALADOS-E-RECOMENDADOS.md, GUIA-CONFIGURAR-VARIAVEIS-AMBIENTE.md, VERIFICACAO-MCPS.json, entre outros — citam MCPs (Vercel, Fly.io, Supabase, GitHub, Mercado Pago, etc.) e variáveis de ambiente.
- **docs/relatorios/ (2026-02-05):** PASSO-A-PASSO-ATIVAR-MCPS-CURSOR, INSTRUCOES-MCP-DETERMINISTICAS, MCP-REGISTRO-CURSOR-GERADO.json, RELATORIO-REATIVACAO-MCPS-AUDITORIA, RELATORIO-VERIFICACAO-MCP-READ-ONLY, RELATORIO-MCP-REATIVACAO-SEM-CREDENCIAIS — descrevem ativação, placeholders e estado dos MCPs.
- **ANALISE-COMPLETA-IA-MCPs-*.md** (raiz e docs): análises históricas que mencionam MCPs.

### 2.2 Código e configuração

- **cursor.json:** Seção `mcp` com wrappers (comandos CLI) para: goldeouro (auditoria), vercel, flyio, supabase, github-actions, lighthouse, docker, sentry, postgres, mercado-pago, jest, eslint. Não são servidores de protocolo MCP; são definições de comandos.
- **.cursor/mcp.json:** Existe; não foi lido (protegido). Relatórios indicam que é o arquivo de configuração dos servidores MCP do Cursor (Supabase, Vercel, Mercado Pago, etc.).
- **mcp-system/audit-simple.js:** Script de auditoria referenciado por `cursor.json`.
- **Workers:** `fly.toml` declara processo `payout_worker`; `src/workers/payout-worker.js` existe e é referenciado no servidor.

### 2.3 Dependências (referências no código)

- Backend usa Supabase (`@supabase/supabase-js`), Mercado Pago (API REST/axios), JWT, bcrypt. Nenhuma dependência de “agente” ou “orquestração” genérica foi listada; workers são processo Node explícito no Fly.

---

## 3. Completude para ativação MCP

### 3.1 O que está documentado e coerente

- **Variáveis de ambiente do runtime:** Exigidas em `required-env.js` e usadas em `server-fly.js` e `production.js`: JWT, Supabase (URL, SERVICE_ROLE_KEY), Mercado Pago (DEPOSIT em produção). Listagem também em docs/mcps (VERCEL_*, FLY_API_TOKEN, SUPABASE_*, GITHUB_TOKEN, etc.).
- **Template de registro MCP:** `docs/relatorios/MCP-REGISTRO-CURSOR-GERADO.json` com Supabase (read-only), Vercel (URL), Mercado Pago (header); placeholders explícitos, sem valores reais.
- **Instruções determinísticas:** `INSTRUCOES-MCP-DETERMINISTICAS-2026-02-05.md` indica onde colar o JSON (`.cursor/mcp.json`), o que substituir (dois placeholders) e o comando único Fly (`fly mcp server --cursor`).
- **Worker:** `payout_worker` declarado em `fly.toml` e implementado em `src/workers/payout-worker.js`; referência clara.

### 3.2 Lacunas identificadas

- **SUPABASE_ACCESS_TOKEN (PAT):** O MCP oficial do Supabase usa Personal Access Token (dashboard), não `SUPABASE_URL` nem `SUPABASE_SERVICE_ROLE_KEY`. O projeto não usa PAT no runtime; está documentado em PASSO-A-PASSO e INSTRUCOES que o usuário deve obter/colar o PAT. Ou seja: variável necessária para o MCP Supabase não é a mesma do app; está documentada, mas não “definida” no código.
- **Variáveis apenas citadas:** Vercel (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID), Fly (FLY_API_TOKEN), GitHub (GITHUB_TOKEN), Mercado Pago (MERCADOPAGO_DEPOSIT_ACCESS_TOKEN, MERCADOPAGO_PAYOUT_ACCESS_TOKEN) aparecem em docs e código; não há arquivo versionado com valores (esperado por segurança).
- **Script de inicialização MCP:** Não existe script único no repositório que “inicialize todos os MCPs” no restart do Cursor; ativação depende de `.cursor/mcp.json` + (para Fly) comando `fly mcp server --cursor` já executado, conforme instruções.
- **Estado real de `.cursor/mcp.json`:** Não foi lido; ignora-se se os placeholders já foram substituídos ou se o arquivo está em outro estado.

### 3.3 O que pode bloquear a ativação

- **Placeholders não substituídos:** Se em `.cursor/mcp.json` ainda estiverem `SUPABASE_ACCESS_TOKEN_PLACEHOLDER` e `MERCADOPAGO_ACCESS_TOKEN_PLACEHOLDER`, os MCPs Supabase e Mercado Pago não funcionarão até a substituição por credenciais reais.
- **Supabase MCP sem PAT:** Sem `SUPABASE_ACCESS_TOKEN` (PAT do dashboard), o MCP Supabase não ativa; o app usa apenas SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.
- **Vercel MCP:** Depende de OAuth na primeira utilização; não há token versionado (correto). Sem conclusão do OAuth, o MCP Vercel pode permanecer inativo.
- **Fly.io MCP:** Depende de ter sido executado `fly mcp server --cursor` (documentado); relatórios indicam que foi executado (exit 0), mas `list_mcp_resources` segue retornando vazio na sessão verificada — possível necessidade de reinício do Cursor ou de config global.

---

## 4. Riscos de reinicialização do Cursor

- **Contexto externo não versionado:** Valores de tokens e secrets estão em `.env` ou em variáveis de ambiente do sistema (e possivelmente em `.cursor/mcp.json`). Não estão no repositório. Isso é esperado; o que está versionado é a lista de nomes de variáveis e as instruções para preenchimento.
- **Decisões críticas só em chat:** As decisões de reativação MCP (não criar tokens, usar placeholders, Fly via CLI, ignorar Supabase/Vercel sem credenciais) estão registradas em `docs/relatorios/` (relatórios e instruções de 05/02/2026). Não foi identificada decisão crítica relevante para MCP que exista apenas em histórico de chat e não em documento no repo.
- **Conhecimento fora do repositório:** Para ativação completa, é necessário (1) PAT do Supabase (criado no dashboard), (2) Access Token(s) Mercado Pago (já usados no projeto), (3) OAuth Vercel (conta existente), (4) ter rodado `fly mcp server --cursor`. Tudo isso está referenciado ou explicado em docs/relatorios e docs/mcps; não há “segredo” técnico que exista apenas fora do repo.

---

## 5. Resumo: pronto / incompleto / ausente / manual

### ✔️ O que está pronto para MCP

- Estrutura do projeto e referências a backend, frontend, worker e config documentadas.
- `cursor.json` com comandos/wrappers MCP (auditoria, vercel, flyio, supabase, mercado-pago, etc.).
- `.cursor/mcp.json` existente (conteúdo não lido).
- Template de registro em `docs/relatorios/MCP-REGISTRO-CURSOR-GERADO.json` (Supabase read-only, Vercel, Mercado Pago) com placeholders.
- Instruções determinísticas em `INSTRUCOES-MCP-DETERMINISTICAS-2026-02-05.md` (onde colar, o que substituir, comando Fly).
- Documentação em `docs/mcps/` (variáveis, ferramentas, configuração).
- Variáveis obrigatórias do app documentadas em código (`required-env.js`, `server-fly.js`).
- Worker `payout_worker` declarado em `fly.toml` e implementado em `src/workers/payout-worker.js`.

### ⚠️ O que está incompleto ou ambíguo

- **Supabase MCP:** Exige PAT (`SUPABASE_ACCESS_TOKEN`); no código do app só existem SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY. A diferença está documentada, mas a credencial do MCP é distinta da do runtime.
- **Estado de `.cursor/mcp.json`:** Não verificado; não se sabe se placeholders foram substituídos.
- **Eficácia do registro Fly:** `fly mcp server --cursor` foi executado com sucesso (relatórios); `list_mcp_resources` continua vazio — pode depender de reinício do Cursor ou de config global.

### ❌ O que está ausente e pode bloquear

- Nenhum arquivo versionado com valores de tokens (correto).
- Script único de “inicialização MCP” no restart (ativação é manual conforme instruções).
- Evidência no repositório de que os MCPs estão ativos (apenas relatórios que indicam “nenhum recurso” na última verificação).

### 📌 O que deve ser fornecido manualmente antes do restart (se ainda não foi)

1. **Para Supabase MCP:** Personal Access Token (PAT) do Supabase (Dashboard → Account → Access Tokens), colocado em `.cursor/mcp.json` no lugar de `SUPABASE_ACCESS_TOKEN_PLACEHOLDER` (ou em variável de ambiente que o Cursor use).
2. **Para Mercado Pago MCP:** Access Token da aplicação (ex.: o mesmo usado como MERCADOPAGO_DEPOSIT_ACCESS_TOKEN ou o da app de saque), no lugar de `MERCADOPAGO_ACCESS_TOKEN_PLACEHOLDER` em `.cursor/mcp.json`.
3. **Para Fly.io MCP:** Executar uma vez no terminal (com flyctl autenticado): `fly mcp server --cursor`. Não é necessário colar token no repo.
4. **Para Vercel MCP:** Nenhum token no arquivo; na primeira vez que o Cursor usar o MCP, concluir OAuth no navegador com a conta Vercel do projeto.

---

## 6. Confirmação final obrigatória

**Pergunta:** É seguro reiniciar o Cursor agora sem perda de contexto crítico para ativação dos MCPs?

**Resposta:** **Sim, com ressalva.**

- **Seguro no sentido de “não perder contexto crítico”:** Toda a informação necessária para ativar os MCPs está no repositório: template de `mcp.json`, instruções determinísticas, documentação de variáveis em `docs/mcps` e em `config/required-env.js`, referência ao worker em `fly.toml` e em `src/workers/`, e relatórios que descrevem o estado atual (MCPs sem recursos expostos, Fly registrado via CLI). Nenhuma decisão crítica para MCP identificada apenas em chat; o que importa está em documentos versionados.
- **Ressalva:** Reiniciar o Cursor **não ativa sozinho** os MCPs. A ativação depende de (1) `.cursor/mcp.json` com credenciais reais no lugar dos placeholders (Supabase PAT e Mercado Pago token) e, para Fly, de (2) ter executado `fly mcp server --cursor`. Se isso já foi feito, o restart pode fazer os MCPs passarem a aparecer (recursos); se não foi feito, após o restart os MCPs continuarão inativos até que esses passos manuais sejam realizados, usando exatamente as instruções já presentes no repositório.

**Justificativa resumida:** O repositório está completo e coerente para reativação MCP de forma auditável; não há dependência de contexto que exista apenas fora do repo. A “segurança” do restart é a de não perder informação; a ativação efetiva continua dependendo dos passos manuais documentados.

---

**Relatório gerado em:** 05/02/2026  
**Base:** Apenas conteúdo encontrado no repositório. Sem suposições não verificáveis. Sem sugestões de implementação.
