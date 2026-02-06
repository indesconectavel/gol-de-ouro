# Relatório: Reativação de MCPs — Auditoria read-only

**Data:** 05/02/2026  
**Modo:** Somente leitura. Nenhuma config apagada, nenhum token gerado ou rotacionado.

---

## ETAPA 1 — AUDITORIA READ-ONLY

### 1.1 Estado atual dos MCPs no Cursor

| Verificação | Resultado |
|-------------|-----------|
| **Recursos MCP expostos** | `list_mcp_resources` → **Nenhum recurso encontrado** |
| **Interpretação** | Nenhum servidor MCP (Supabase, Fly.io, Mercado Pago, Vercel) está atualmente **conectado ao protocolo MCP do Cursor**. Todos aparecem como **desconectados / sem handshake** do ponto de vista da IA. |

**Conclusão 1.1:** O problema é de **registro/binding** dos servidores MCP no Cursor (pós-atualização), não necessariamente de credenciais inválidas.

---

### 1.2 Configurações existentes (somente leitura)

| Item | Encontrado | Observação |
|------|------------|------------|
| **`.cursor/`** | Sim | Contém apenas `commands/` (auditoria, deploy, etc.). **Não foi listado `mcp.json`** na pasta do projeto (pode estar em global `~/.cursor/mcp.json` ou ainda não existir). |
| **`cursor.json`** | Sim | Define **wrappers** (comandos) para: vercel, flyio, supabase, mercado-pago, github-actions, lighthouse, docker, sentry, postgres, jest, eslint. São **comandos CLI/scripts**, não servidores MCP nativos do Cursor. Todos com `"enabled": true`. |
| **Arquivos `.env`** | Sim | Existem `.env`, `.env.local`, `.env.example`, `.env.production` na raiz e em subpastas (goldeouro-player, goldeouro-admin, etc.). **Conteúdo não lido** (segurança). |
| **Keychain / Credential Store** | — | Não acessível por ferramentas do projeto; não verificado. |

**Conclusão 1.2:** As **credenciais** podem ainda existir em `.env` ou em variáveis de ambiente do sistema. O que falta é o **arquivo de configuração MCP do Cursor** (`.cursor/mcp.json` ou global) com os servidores nativos (Supabase, Fly, Mercado Pago, Vercel).

---

### 1.3 Última verificação conhecida (referência)

Arquivo **`docs/mcps/VERIFICACAO-MCPS.json`** (13/11/2025):

| MCP | Status na época | Variáveis |
|-----|------------------|-----------|
| Vercel | working | VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID ✅ |
| Fly.io | working | FLY_API_TOKEN ✅ |
| Supabase | working | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY ✅ |
| Mercado Pago | — | Não incluído naquele teste (apenas 10 itens) |
| GitHub (gh) | failed | GITHUB_TOKEN set; **gh** não reconhecido como comando |

Nenhuma dessas configs foi apagada ou alterada nesta auditoria.

---

## ETAPA 2 — TENTATIVA DE RECONEXÃO (SEM ALTERAR CONFIGS)

### Testes read-only executados

| MCP | Teste | Resultado |
|-----|--------|-----------|
| **Fly.io** | `flyctl status --app goldeouro-backend-v2` | **OK** — App e máquinas listados; `app` e `payout_worker` em **started**; região **gru**. Credencial Fly (sessão flyctl) válida. |
| **Supabase** | `node test-supabase.js` | **Falha neste ambiente** — Erro: `supabaseUrl is required`. Variáveis de ambiente **não estavam carregadas** no shell onde o comando foi executado (ex.: `.env` não carregado). **Não indica que as credenciais estejam inválidas** no seu ambiente normal. |
| **Mercado Pago** | Teste não executado | O script `scripts/test-mercadopago-connection.js` **cria preferência** (operação de escrita). Por regra read-only, **não foi executado**. Para validar token sem escrever: usar apenas chamada de **consulta** (ex.: listar payment methods ou GET em endpoint read-only) em script separado. |
| **Vercel** | Não executado | `npx vercel ls` exigiria auth na sessão; não foi executado para evitar interação. Credenciais Vercel estavam setadas na verificação de Nov/2025. |

**Conclusão 2:**  
- **Fly.io:** credenciais/sessão válidas; reconexão do MCP no Cursor é apenas re-registro (ex.: `fly mcp server --cursor`).  
- **Supabase / Mercado Pago / Vercel:** credenciais **não foram invalidadas** por esta auditoria; a falha atual é **ausência de servidores MCP registrados** no Cursor.

---

## ETAPA 3 — RECONFIGURAÇÃO (APENAS SE NECESSÁRIO)

**Situação atual:**

- **Token inexistente:** Não detectado (não lemos valores de .env).
- **Credencial inválida:** Não detectado. Fly.io válido; Supabase/MP/Vercel não testados até o fim por limitação de ambiente ou regra read-only.
- **Provider removido do Cursor:** **Sim.** Nenhum recurso MCP disponível → os **servidores MCP** (Supabase, Fly, Mercado Pago, Vercel) precisam ser **registrados de novo** no Cursor (arquivo `mcp.json` ou comando `fly mcp server --cursor`).

**Recomendação (sem apagar configs existentes):**

1. **Não apagar** nada em `cursor.json` nem em `.env`.
2. **Adicionar / atualizar** apenas o arquivo de configuração dos **servidores MCP do Cursor**:
   - Se existir **`.cursor/mcp.json`** (ou `~/.cursor/mcp.json`): **incluir** os blocos dos 4 MCPs (Supabase, Fly.io, Mercado Pago, Vercel) usando as **credenciais já existentes** (variáveis de ambiente ou tokens já usados).
   - Se não existir: **criar** `.cursor/mcp.json` (ou o global) com os 4 servidores, reutilizando as mesmas credenciais.
3. **Fly.io:** executar uma vez no terminal:  
   `fly mcp server --cursor`  
   para o Fly registrar o MCP no Cursor.
4. **Rotação de tokens:** não fazer sem confirmação técnica; usar os tokens atuais para reativar.

Assim, **reconfiguração mínima**: apenas (re)registro dos MCPs no Cursor, sem recriar credenciais.

---

## ETAPA 4 — TESTE FINAL (READ-ONLY) — A FAZER APÓS RE-REGISTRO

Quando os MCPs estiverem de novo conectados no Cursor, validar:

| MCP | Teste mínimo (read-only) |
|-----|---------------------------|
| Supabase | Consulta simples (ex.: listar tabelas ou `select count` em uma tabela). |
| Fly.io | Listar apps/machines ou `flyctl status --app goldeouro-backend-v2`. |
| Mercado Pago | Ping/consulta à API (ex.: GET payment methods ou similar, sem criar pagamento). |
| Vercel | Listar projetos ou últimos deploys; variáveis apenas leitura. |

Nenhuma escrita, nenhum deploy.

---

## RESUMO

| Item | Status |
|------|--------|
| MCPs no Cursor (protocolo) | Todos desconectados (0 recursos). |
| Configs existentes | Preservadas; `cursor.json` e .env não alterados. |
| Fly.io credencial | Válida (flyctl status OK). |
| Supabase / MP / Vercel credenciais | Não invalidadas; Supabase falhou só por env não carregado no shell. |
| Ação recomendada | Re-registrar os 4 MCPs no Cursor (mcp.json + `fly mcp server --cursor`) **sem apagar** configs e **sem** gerar novos tokens. |
| Código do jogo | Zero impacto. |

**Regra de ouro respeitada:** Nada foi apagado nem recriado do zero; apenas leitura e testes read-only. Em caso de dúvida, parar e reportar.

---

**Documento gerado em:** 05/02/2026  
**Projeto:** Gol de Ouro — reativação MCPs com segurança.
