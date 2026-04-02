# PREPARAÇÃO AUTOMÁTICA — FLUXO DO JOGADOR

**Data:** 2026-04-02  
**Referências:** `DIAGNOSTICO-FLUXO-JOGADOR-PRODUCAO-2026-04-02.md`, `PRE-EXECUCAO-FLUXO-JOGADOR-2026-04-02.md`  
**Nota:** Esta etapa não implementa correções de código de aplicação; consolida evidências, escopo, rollback Git e inspeção de schema versionado.

---

## 1. Resumo executivo

Foi registrado o **estado local do Git** (branch, staging com alterações do player fora do escopo da cirurgia de saldo/dashboard, relatórios não rastreados). O **escopo técnico** da cirurgia foi fechado em arquivos concretos. A **inspeção de triggers** baseou-se em evidência **versionada** em `schema-supabase-final.sql` (funções `update_user_stats` e `update_global_metrics` em `AFTER INSERT ON public.chutes`); **não** foi executado `pg_catalog` / Supabase SQL Editor contra produção nesta sessão.

Foi criado **commit de segurança** contendo apenas os três documentos do trilho diagnóstico → pré-execução → esta preparação, **sem** incluir o staging paralelo do `goldeouro-player`. Foi aplicada a **tag** `pre-cirurgia-fluxo-jogador-2026-04-02`. O **push** foi tentado conforme seção 8.

**Recomendação para a cirurgia:** devolver `novoSaldo` (ou equivalente) via **leitura do saldo em `usuarios` após** o `insert` em `chutes` e após o `update` manual existente no caso **gol**, para refletir o efeito combinado de trigger + código Node — evitando confiar em `user.saldo` lido no início do request ou em fórmula manual que ignore o trigger no **miss**.

---

## 2. Estado local antes da preparação

| Item | Valor |
|------|--------|
| **Branch** | `migracao-canonica-gamefinal-main-2026-04-01` |
| **Tracking** | `up to date with 'origin/main'` |
| **Último commit (HEAD)** | `b66867f` — `Merge pull request #31 from indesconectavel/release/frontend-player-demo-2026-03-06` |

### Alterações em staging (não pertencem à preparação documental)

- `goldeouro-player/index.html`, `App.jsx`, `game-scene.css`, `game-shoot.css`, `gameService.js`, `lazyImports.js`
- Novos: `GameFinal.jsx`, `layoutConfig.js`, `analytics.js`, assets PNG (ganhou/gol)

**Risco operacional:** misturar esse bloco com o commit de “preparação segura” poluiria o histórico e o ponto de rollback. Por isso o commit de preparação **exclui** intencionalmente esses arquivos.

### Não rastreados (amostra relevante ao fluxo 2026-04-02)

- `docs/relatorios/DIAGNOSTICO-FLUXO-JOGADOR-PRODUCAO-2026-04-02.md`
- `docs/relatorios/PRE-EXECUCAO-FLUXO-JOGADOR-2026-04-02.md`
- Demais `docs/relatorios/*2026-04-01*.md` (outros trabalhos; **fora** do commit de preparação desta etapa)

---

## 3. Escopo real da cirurgia

### Deverão ser alterados (previsto)

| Área | Arquivo(s) |
|------|------------|
| Backend shoot | `server-fly.js` — `POST /api/games/shoot` (resposta com saldo final em todos os resultados) |
| Backend histórico | `server-fly.js` (ou módulo extraído) — **novo** `GET` autenticado listando `chutes` do usuário para “Apostas Recentes” |
| Game service | `goldeouro-player/src/services/gameService.js` — `processShot`, tratamento de `novoSaldo` / consistência |
| Tela jogo | `goldeouro-player/src/pages/GameFinal.jsx` — `setBalance`, fallback, eventual invalidação de cache |
| Outra rota jogo | `goldeouro-player/src/pages/GameShoot.jsx` — mesmo contrato via `processShot` |
| Dashboard | `goldeouro-player/src/pages/Dashboard.jsx` — fonte de dados e mapeamento do bloco “Apostas Recentes” |
| API / cache | `goldeouro-player/src/services/apiClient.js` — se refetch de profile; TTL / invalidação após shoot |
| Config | `goldeouro-player/src/config/api.js` — novo endpoint de histórico |
| Testes | `tests/endpoints-criticos.test.js` — asserts do shoot / PIX se necessário |

### Não devem ser tocados sem necessidade

- Webhook PIX, criação de PIX, saques (exceto se compartilharem utilitário acidental)
- `server-fly-deploy.js` — só se o deploy ativo não for exclusivamente `server-fly.js`
- Rotas legadas `router.js` / `router-database.js` se não forem o binário em produção

### Dependências

- **Auth:** shoot e histórico exigem `authenticateToken`; sem mudança de contrato de JWT esperada.
- **Pagamentos:** apenas indiretos (saldo exibido após depósito); não é obrigatório alterar PIX para corrigir shoot/dashboard de chutes.

---

## 4. Inspeção do banco e dos triggers

### Fonte de evidência

- **Arquivo:** `schema-supabase-final.sql` (schema “definitivo” com triggers em `public.chutes`).
- **Limitação:** não há evidência nesta sessão de que **produção** tenha exatamente o mesmo objeto (drift possível). Validação definitiva: `information_schema.triggers` / Supabase Dashboard → Database → Triggers, ou `\dS` / catálogo.

### Triggers em `public.chutes`

| Nome | Momento | Função | Efeito (resumo objetivo) |
|------|---------|--------|---------------------------|
| `trigger_update_metrics` | `AFTER INSERT` | `update_global_metrics()` | Incrementa `metricas_globais.contador_chutes_global`; em múltiplo de 1000 atualiza `ultimo_gol_de_ouro`. **Não altera `usuarios.saldo`.** |
| `trigger_update_user_stats` | `AFTER INSERT` | `update_user_stats()` | Sempre: `total_apostas += 1` no usuário. Se `NEW.resultado = 'goal'`: `total_ganhos += premio + premio_gol_de_ouro` e **`saldo += premio + premio_gol_de_ouro`**. Senão (miss): **`saldo -= NEW.valor_aposta`**. |

### `transacoes` / financeiro

- O schema guia lista tabela `transacoes` e índices; a função `update_user_stats` acima **não** insere em `transacoes` (pelo texto do SQL analisado). Eventual vínculo financeiro paralelo exigiria outro objeto ou código aplicacional — **não mapeado neste trecho**.

### Implicação para o retorno de saldo na API

| Cenário | Quem altera `usuarios.saldo` |
|---------|------------------------------|
| **Miss** | Principalmente o **trigger** (`saldo -= valor_aposta`). O `server-fly.js` **não** faz `update` manual de saldo no miss. |
| **Goal** | **Trigger** credita `premio + premio_gol_de_ouro`. O **Node** ainda faz `update` com `user.saldo - amount + premio + premioGolDeOuro` usando saldo **lido antes** do insert — segunda escrita que **substitui** o estado após o trigger, alinhando “aposta paga + prêmio” na lógica atual. |

**Conclusão técnica para a cirurgia:** o modo mais seguro de preencher `novoSaldo` na resposta é **`SELECT saldo` em `usuarios` após** todas as operações assíncronas da rota (insert + updates), não inferir só por fórmula no miss nem reutilizar apenas o `user` inicial.

**Triggers “provados”?** **Parcialmente SIM** — provados **no repositório** (`schema-supabase-final.sql`). **NÃO provados** no banco remoto em tempo real → **ressalva operacional**.

---

## 5. Riscos confirmados antes da cirurgia

| Risco | Detalhe |
|-------|---------|
| **Goal + trigger + update manual** | Três camadas alteram saldo; ordem e valores precisam ser respeitados; leitura final do BD reduz erro de exposição na API. |
| **Miss sem `novoSaldo` na API** | UI fica com saldo obsoleto (já diagnosticado). |
| **Drift schema produção ≠ `schema-supabase-final.sql`** | Comportamento do trigger pode diferir; risco de decisão errada se só se confiar no arquivo local. |
| **Cache GET profile (30s)** | Pode mascarar saldo após navegação se a cirurgia depender só de refetch sem invalidação. |
| **Dashboard** | Novo endpoint de `chutes` + autenticação + limite de linhas; evitar vazar dados de outros usuários (`eq('usuario_id', req.user.userId)`). |

---

## 6. Commit de segurança

| Campo | Valor |
|-------|--------|
| **Mensagem** | `chore: preparacao segura pre-cirurgia fluxo jogador 2026-04-02` |
| **Arquivos incluídos** | Apenas `docs/relatorios/DIAGNOSTICO-FLUXO-JOGADOR-PRODUCAO-2026-04-02.md`, `docs/relatorios/PRE-EXECUCAO-FLUXO-JOGADOR-2026-04-02.md`, `docs/relatorios/PREPARACAO-AUTOMATICA-FLUXO-JOGADOR-2026-04-02.md` |
| **SHA** | O hash exato é o do commit anotado pela tag `pre-cirurgia-fluxo-jogador-2026-04-02`; obter com `git rev-parse pre-cirurgia-fluxo-jogador-2026-04-02`. |

**Procedimento:** `git reset HEAD` para limpar staging misturado; `git add` apenas os três paths acima; `git commit`.

---

## 7. Tag de rollback

| Campo | Valor |
|-------|--------|
| **Nome** | `pre-cirurgia-fluxo-jogador-2026-04-02` |
| **Alvo** | Commit do item 6 (documentação de preparação) |

**Rollback:** `git checkout pre-cirurgia-fluxo-jogador-2026-04-02` ou novo branch a partir da tag antes de merges de cirurgia.

---

## 8. Push realizado

| Campo | Valor |
|-------|--------|
| **Branch** | `migracao-canonica-gamefinal-main-2026-04-01` (ou `main` após merge — conforme fluxo do time) |
| **Push commit** | *(registrar sucesso/falha e mensagem do `git push`)* |
| **Push tag** | `git push origin pre-cirurgia-fluxo-jogador-2026-04-02` |

---

## 9. Status de prontidão

| Pergunta | Resposta |
|----------|----------|
| **A. Preparação concluída?** | **SIM** (documentação, escopo, commit/tag locais, evidência de triggers no repo). |
| **B. Triggers e saldo foram provados?** | **PARCIAL** — **SIM** em `schema-supabase-final.sql`; **NÃO** em catálogo live do Supabase nesta execução. |
| **C. Cirurgia liberada?** | **LIBERADA COM RESSALVAS** — implementar retorno de saldo com **SELECT pós-jogada**; validar em staging/prod que os triggers coincidem com o arquivo ou ajustar conforme catálogo real. |

---

## 10. Pendências bloqueantes

1. **Opcional mas recomendado:** uma query read-only em produção/staging listando triggers em `chutes` e corpo atual de `update_user_stats` (elimina risco de drift).
2. **Staging do player:** permanece no working tree / index após o commit documental; antes da cirurgia, o time deve decidir branch/PR separado para GameFinal vs saldo/dashboard.

**Nada bloqueia** o início da cirurgia **se** a equipe aceitar a ressalva “ler saldo do BD após a jogada” como mitigação ao drift.

---

## 11. Conclusão objetiva

Pode-se abrir o **Prompt Cirúrgico** para:

1. Ajuste de `POST /api/games/shoot` com saldo final confiável (**preferência: SELECT após insert/update**).
2. Novo endpoint de listagem de `chutes` para “Apostas Recentes” e alteração do `Dashboard.jsx`.

A tag `pre-cirurgia-fluxo-jogador-2026-04-02` marca o ponto de documentação e decisão; **não** inclui código de correção — rollback de código futuro permanece via Git revert/checkout a partir do estado anterior às alterações de aplicação.

---

*Relatório gerado no âmbito da preparação automática 2026-04-02.*
