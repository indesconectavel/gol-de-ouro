# PRÉ-EXECUÇÃO CIRÚRGICA — GAMEPLAY + SAQUE + AUTH

**Modo:** planeamento fechado (sem implementação, sem migration aplicada, sem deploy).  
**Data:** 2026-03-31  
**Base:** `docs/relatorios/DIAGNOSTICO-CIRURGICO-GAMEPLAY-SAQUE-AUTH-2026-03-31.md` e tag `pre-cirurgia-gameplay-saque-auth-2026-03-31`.

---

## 1. Objetivo cirúrgico

Restaurar o encadeamento **autenticado → chute persistido → saque criado sem violação de constraints**, eliminando o drift entre **insert/RPC** e **DDL real** do Supabase, e fixar o **procedimento de testes** em produção para não confundir segredos locais com os da Fly.

---

## 2. Escopo exato da correção

| # | Alvo | Resultado esperado |
|---|------|-------------------|
| A | Tabela `public.chutes` (produção) | Colunas e tipos alinhados ao insert de `server-fly.js` (no mínimo `contador_global`; demais colunas confirmadas por introspection). |
| B | Função `public.solicitar_saque_pix_atomico` | `INSERT` em `saques` preenche `fee` e `net_amount` de forma consistente com a regra de taxa já usada no HTTP (`PAGAMENTO_TAXA_SAQUE`). |
| C | Fallback JS de saque em `server-fly.js` | Quando a RPC não for usada ou falhar de forma esperada, o `dualWriteSaqueRow` recebe `fee` e `net_amount` explícitos (mesma regra de taxa). |
| D | Auth / ambiente | Procedimento operacional: testes E2E na API pública com token de `POST /api/auth/login`; opcionalmente alinhar `JWT_SECRET` na Fly ao valor canónico (fora do código). |

---

## 3. Itens fora de escopo

- Alteração do modelo de **lotes em memória** ou da lógica de **Gol de Ouro** (exceto persistência compatível com BD).
- **Deploy Fly** nesta fase de pré-execução (apenas planeado para fase posterior).
- Refactor de **frontends** (`goldeouro-player`, `goldeouro-admin`), salvo contrato HTTP já existente.
- Rotação massiva de **MERCADOPAGO_*** ou redesign do **webhook**.
- Correção de **entrypoints legados** não usados em produção (`server-fly-deploy.js`, `router.js`, etc.) — apenas mencionar verificação se algum deploy ainda os referencia.
- Mudança de **NOT NULL** em `net_amount` para “facilitar” sem preencher valores (rejeitado: pior rastreabilidade).

---

## 4. Arquivos que serão alterados

| Ficheiro | Alteração prevista |
|----------|-------------------|
| **`server-fly.js`** | Ramo fallback de `POST /api/withdraw/request`: passar `fee` e `net_amount` para `dualWriteSaqueRow`, usando a mesma taxa já calculada (`PAGAMENTO_TAXA_SAQUE` / `valorLiquido`). Opcional: comentário de referência cruzada com a RPC. |
| **`database/rpc-financeiro-atomico-2026-03-28.sql`** | Nova revisão da função `solicitar_saque_pix_atomico`: incluir no `INSERT` colunas `fee` e `net_amount` (e `valor`/`amount` já existentes), com fórmula documentada alinhada ao Node. |
| **Novo ficheiro SQL de migração (recomendado)** | Ex.: `database/migration-2026-03-31-chutes-align-v1.sql` (nome final a escolher na preparação): `ALTER TABLE ... ADD COLUMN` / `NOT NULL` com estratégia de default ou backfill **apenas** após confirmar colunas existentes. |
| **`docs/relatorios/`** (opcional, pós-cirurgia) | Relatório de execução/validação — não bloqueia preparação automática. |

**Não alterar** na microcirurgia principal (salvo decisão explícita posterior):

- `utils/pix-validator.js`, fluxo de login JWT (payload já correto).
- `utils/financialNormalization.js` — já suporta `fee`/`net_amount` quando passados; a lacuna está no **chamador** e na **RPC**.

---

## 5. SQL/migrations necessárias

### 5.1 Pré-requisito: introspection read-only (SQL manual ou script)

Executar no projeto Supabase **antes** de escrever o `ALTER` final:

- `information_schema.columns` para `public.chutes` (lista completa, nullability, tipos).
- Constraints e FKs em `chutes` (`pg_constraint` / `\d+ chutes` equivalente), em especial **`lote_id`** → `lotes` ou outro.
- Mesmo para `public.saques` (confirmar `net_amount`, `fee`, defaults).

### 5.2 Migration `chutes` (conteúdo orientador — a fechar após introspection)

- Se `contador_global` **ausente**: `ADD COLUMN contador_global INTEGER NOT NULL DEFAULT 0` **ou** backfill a partir de `metricas_globais` / ordem temporal — a decisão exata depende de haver linhas existentes e de política de negócio (default `0` só é seguro se não houver chutes anteriores ou se aceitar valor sintético).
- Confirmar presença de: `shot_index`, `direcao`, `valor_aposta`, `resultado`, `premio`, `premio_gol_de_ouro`, `is_gol_de_ouro`, `lote_id` (tipo `text`/`varchar` vs `uuid`).
- **Se existir FK** `chutes.lote_id` → `lotes.id` e os IDs em memória **não** existirem em `lotes`: planear **subcirurgia** (persistir lotes, ou remover FK, ou alterar geração de ID) — não avançar o `ADD COLUMN` sem plano para este ponto.

### 5.3 Migration / replace função `solicitar_saque_pix_atomico`

- `CREATE OR REPLACE FUNCTION ...` com `INSERT` incluindo `fee` e `net_amount`.
- Fórmula mínima alinhada ao backend: `fee := taxa_fixa` (igual a `parseFloat(process.env.PAGAMENTO_TAXA_SAQUE || '2.00')` no Node) e `net_amount := p_amount - fee`, com salvaguarda `GREATEST(net_amount, 0)` ou rejeição se `p_amount <= fee` (decisão de produto — documentar na SQL).
- Manter `GRANT` / `SECURITY DEFINER` / `search_path` como na versão atual do ficheiro.

### 5.4 Aplicar em produção

- Ordem: **migration DDL `chutes`** → **REPLACE RPC** → **deploy imagem Node** com fallback (ou RPC primeiro se DDL de `saques` já satisfeita — ver secção 6).

---

## 6. Ordem segura da cirurgia

1. **Snapshot / backup** lógico ou ponto de restauro Supabase (política da equipa).
2. **Introspection read-only** (`chutes`, `saques`, RPC existente).
3. **Migration `chutes`** (colunas em falta + FK `lote_id` resolvida ou planeado).
4. **Recarregar schema cache PostgREST** (em Supabase costuma atualizar após DDL; validar com um insert de teste em ambiente de staging se existir).
5. **`CREATE OR REPLACE` da RPC** de saque com `fee`/`net_amount`.
6. **Commit + deploy** do `server-fly.js` (fallback) na Fly **após** RPC aplicada (assim ambos os caminhos ficam coerentes).
7. **Auth:** validar E2E com login na URL pública; se necessário, **uma única** operação de `fly secrets set JWT_SECRET=...` alinhada ao `.env` canónico (janela de invalidação de tokens).
8. **Validação pós-cirurgia** (checklist secção 12).

---

## 7. Estratégia para corrigir o chute

1. **Decisão:** correção **primária no banco** (`ADD COLUMN` / alinhamento de schema), **não** remover `contador_global` do insert — preserva semântica de **Gol de Ouro** e auditoria já documentada.
2. **Colunas a confirmar** na mesma janela: todas as do insert em `server-fly.js` (ver diagnóstico).
3. **FK `lote_id`:** tratar como **risco bloqueante** até introspection; se FK existir com IDs só em memória, **ajustar DDL ou persistência de lotes** antes de declarar o chute “fechado”.
4. **SQL existente no repo:** usar `schema-supabase-final.sql` / `SCHEMA-CORRECAO-COMPLETA-FINAL.sql` como **referência**, mas a migration final deve ser **incremental** e baseada no catálogo real (não aplicar ficheiros monolíticos cegamente).
5. **Segurança semântica:** após migração, validar que novos chutes gravam `contador_global` coerente com `metricas_globais` (teste funcional); não exigir reescrita histórica sem decisão explícita.

---

## 8. Estratégia para corrigir o saque

1. **`net_amount`:** calculado **na RPC** (fonte de verdade atómica) e **replicado no fallback JS** com a mesma fórmula — **ambos**, para integridade quando `FINANCE_ATOMIC_RPC=false` ou RPC indisponível.
2. **`fee`:** **sim**, persistir na RPC (e no fallback) com o mesmo valor usado para `net_amount`, para relatórios e workers futuros.
3. **DDL:** **não** relaxar `NOT NULL` em `net_amount`; **corrigir escritores** (RPC + fallback).
4. **Integridade:** manter ordem transacional da RPC atual (insert + update saldo + rollback delete em corrida); apenas enriquecer o `INSERT`.
5. **Campos obrigatórios nos dois caminhos:** `amount`, `valor`, `pix_key`, `chave_pix`, `pix_type`, `tipo_chave`, `status`, `created_at`, **`fee`**, **`net_amount`** (mais `correlation_id` apenas se o worker exigir — fora do erro 23502 atual).

---

## 9. Estratégia para auth/ambiente

1. **Código:** **não** é obrigatório alterar `authenticateToken` ou o formato do JWT para esta cirurgia.
2. **`JWT_SECRET` na Fly:** alterar **só se** a política for “um segredo canónico” partilhado com CI/staging; caso contrário, **não** é cirurgia de código — é **operação de secrets** com janela de re-login.
3. **Testes em produção:** **padronizar obrigatoriamente** token obtido via `POST /api/auth/login` no host público — elimina falso negativo por assinatura local.
4. **Política futura:** documentar no runbook: “nunca validar JWT gerado offline salvo secret comprovadamente igual ao Fly”; preferir script de E2E que faça login.

---

## 10. Estratégia para eliminar drift

| Artefacto | Estado alvo pós-cirurgia |
|-----------|-------------------------|
| **Código** (`server-fly.js`) | Insert `chutes` compatível com DDL; fallback `saques` com `fee`/`net_amount`. |
| **RPC** | `solicitar_saque_pix_atomico` alinhada a `saques` NOT NULL. |
| **Schema real** | `chutes` com colunas esperadas pelo motor V1. |
| **Migrations repo** | Novo ficheiro incremental versionado + histórico claro. |
| **Secrets Fly** | Documentados / alinhados à política de testes (sem drift “mental” local vs produção). |

**Introspection adicional:** **obrigatória** antes do primeiro `ALTER` em `chutes` (incerteza em `lote_id`).

**Uma vs várias cirurgias:** **duas microcirurgias lógicas** — (M1) DDL `chutes` + validação de chute; (M2) RPC + fallback `saques` + deploy Node. Podem ser no mesmo PR com commits ordenados, mas **validação intermédia** após M1 se o FK `lote_id` for sensível.

---

## 11. Estratégia de rollback

| Camada | Ação |
|--------|------|
| **Git** | Tag `pre-cirurgia-gameplay-saque-auth-2026-03-31` + branch; revert commit ou reset controlado. |
| **RPC** | Guardar definição anterior da função (copy do `CREATE` antes do replace) para `CREATE OR REPLACE` de volta. |
| **DDL `chutes`** | Rollback de `ADD COLUMN` só se não houver dependências; em produção preferir **forward fix**; backup antes. |
| **Fly** | Imagem anterior (`fly releases` / rollback de deploy); secrets JWT só reverter se alterados e documentado valor anterior. |

---

## 12. Estratégia de validação

1. **Chute:** `POST /api/games/shoot` com token de login **produção** → HTTP **200**; linha nova em `chutes` com `contador_global` preenchido; `usuarios.saldo` coerente com resultado (débito R$ 1,00 ± prémio).
2. **Saque:** `POST /api/withdraw/request` → HTTP **201**; linha em `saques` com `net_amount` e `fee` não nulos; saldo debitado pelo valor **bruto** solicitado (igual ao contrato actual de `valorSaque`).
3. **Histórico:** `GET /api/withdraw/history` inclui o saque criado com valores normalizados.
4. **Regressão PIX:** smoke de `POST /api/payments/pix/criar` + webhook/reconcile **não** coberto por esta cirurgia mas recomendado no mesmo release se possível.
5. **Critério sem ambiguidade:** nenhum **PGRST204** em `chutes`; nenhum **23502** em `saques` no fluxo de saque padrão.

---

## 13. Risco principal de regressão

**FK ou tipo de `lote_id` incompatível com IDs gerados em memória** após corrigir `contador_global` — pode fazer o insert falhar com erro PostgreSQL diferente (FK violation ou tipo), bloqueando o chute aparentemente “corrigido” só na coluna do contador.

---

## 14. Classificação final

**PRONTO PARA PREPARAÇÃO AUTOMÁTICA** — com **pré-condição obrigatória**: executar introspection read-only de `chutes` (e FK `lote_id`) antes de gerar o SQL final de migração.

*(Não aplicável: AINDA NÃO PRONTO. Ressalva absorvida na pré-condição acima, não na classificação.)*

---

## 15. Conclusão objetiva

A cirurgia fecha em **DDL para `chutes`**, **evolução da RPC de saque** e **enriquecimento do fallback em `server-fly.js`**, mais **disciplina operacional de JWT** na Fly. A ordem é **backup → introspection → migração chutes → RPC → deploy Node → validação E2E autenticada**. O maior risco residual é **`lote_id` vs modelo em memória**, a esclarecer antes de aplicar migrações.
