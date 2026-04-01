# ESTADO ATUAL DO SISTEMA — AUDITORIA GLOBAL + HANDOFF

**Data do documento:** 2026-04-01  
**Escopo:** consolidar factos rastreáveis a partir de `docs/relatorios`, SQL versionado no repositório e validações descritas nos relatórios (incl. produção Fly + Supabase onde indicado).  
**Regra:** não se afirma funcionamento sem evidência nos documentos citados; inferências e riscos estão explicitamente marcados.

---

## 1. Resumo executivo (alto nível)

O backend **Gol de Ouro** (`server-fly.js`, deploy **Fly** `goldeouro-backend-v2.fly.dev`, base **Supabase/Postgres**) atravessou uma **cirurgia documentada** (Março–Abril 2026) para alinhar **`public.chutes`** ao contrato V1, corrigir **RPC/fallback de saque** (`fee`, `net_amount`) e tratar **colunas legado** que causavam **23502** em inserts. Em **produção**, há evidência documental de:

- **`POST /api/games/shoot`** com **HTTP 200**, débito coerente e linha em **`chutes`** após DDL manual em **`resultado_legacy_jsonb`** e **`direcao_legacy_int`** (`REVALIDACAO-FINAL-GAMEPLAY-POS-DIRECAO-LEGACY-2026-04-01.md`).
- **`POST /api/withdraw/request`** com **201**, `fee`/`net_amount` e histórico coerente na mesma jornada de validação ponta a ponta anterior ao fix final do shoot (`VALIDACAO-FINAL-PONTA-A-PONTA-GAMEPLAY-SAQUE-HISTORICO-2026-04-01.md`).
- **PIX real:** webhook + crédito RPC comprovados com ressalvas de cobertura de log (`VALIDACAO-FINAL-FINANCEIRO-REAL-PRODUCAO-2026-03-31.md`).

O estado global é **operacional com ressalvas**: testes de gameplay frequentemente usam **crédito de saldo via service role** (não substituem depósito PIX no mesmo fluxo); **BLOCO S** (distribuição/B2B) permanece **parcialmente preparado** (`BLOCO-S-FECHAMENTO-ETAPA-2026-03-31.md`).

---

## Anexo A — Inventário de relatórios (`docs/relatorios/`)

| Métrica | Valor (PowerShell, 2026-04-01) |
|--------|--------------------------------|
| Ficheiros na raiz de `docs/relatorios` | **807** |
| Ficheiros recursivos (incl. subpastas) | **827** |

**Nota:** listar nominalmente todos os ficheiros seria inviável neste handoff; existe índice curado V1 em [`INDICE-RELATORIOS-V1.md`](./INDICE-RELATORIOS-V1.md) e relatório mestre de blocos em [`RELATORIO-MESTRE-STATUS-BLOCOS-2026-03-31.md`](./RELATORIO-MESTRE-STATUS-BLOCOS-2026-03-31.md).

### Classificação por tipo (exemplos representativos da janela crítica 2026-03-31 — 2026-04-01)

| Tipo | Exemplos de ficheiros |
|------|------------------------|
| **Gameplay** | `REVALIDACAO-FINAL-GAMEPLAY-POS-DIRECAO-LEGACY-2026-04-01.md`, `VALIDACAO-FINAL-GAMEPLAY-POS-CORRECAO-SQL-2026-04-01.md`, `VALIDACAO-FINAL-PONTA-A-PONTA-GAMEPLAY-SAQUE-HISTORICO-2026-04-01.md`, `DIAGNOSTICO-CIRURGICO-GAMEPLAY-SAQUE-AUTH-2026-03-31.md` |
| **Saque** | `CIRURGIA-FINAL-GAMEPLAY-SAQUE-AUTH-2026-03-31.md` (secção saque), `VALIDACAO-FINAL-PONTA-A-PONTA-...` (saque 201) |
| **Auth** | `EXECUCAO-CONTROLADA-FINAL-GAMEPLAY-SAQUE-AUTH-2026-03-31.md`, `CIRURGIA-FINAL-...` (login Bearer) |
| **Banco / SQL** | `database/migration-2026-03-31-chutes-v1-align.sql` (referenciado nos relatórios), `CORRECAO-SQL-CHUTES-LEGADO-DIRECAO-2026-04-01.md`, `migration-2026-04-01-chutes-resultado-legacy-jsonb-nullable.sql`, `migration-2026-04-01-chutes-direcao-legacy-int-nullable.sql` |
| **Execução / validação** | `EXECUCAO-CONTROLADA-FINAL-GAMEPLAY-SAQUE-AUTH-2026-03-31.md`, `VALIDACAO-FINAL-FINANCEIRO-REAL-PRODUCAO-2026-03-31.md`, `VERIFICACAO-CORRECOES-PRODUCAO-2026-03-31-1208.md` |
| **Cirurgia / migração** | `CIRURGIA-FINAL-GAMEPLAY-SAQUE-AUTH-2026-03-31.md`, `BASELINE-PRE-CIRURGIA-2026-03-31.md`, `PRE-EXECUCAO-CIRURGICA-GAMEPLAY-SAQUE-AUTH-2026-03-31.md` |
| **BLOCO S / estratégia** | `BLOCO-S-FECHAMENTO-ETAPA-2026-03-31.md`, `RELATORIO-MESTRE-STATUS-BLOCOS-2026-03-31.md` |

O diretório contém ainda centenas de auditorias históricas (prefixos `AUDITORIA-*`, `BLOCO-*`, `VALIDACAO-*`, etc.) fora desta janela.

---

## Anexo B — Linha do tempo objetiva (factos documentados)

| Ordem | Evento | Fonte |
|-------|--------|--------|
| 1 | Estado com falhas: **500** em shoot por constraints legado / schema; **23502** `net_amount` no saque; alinhamento V1 `chutes` necessário | `DIAGNOSTICO-CIRURGICO-...`, `CIRURGIA-FINAL-...`, validações |
| 2 | Modelo **legado vs V1** mapeado: renomear colunas antigas para `*_legacy*`, novas colunas V1 (`direcao` texto, `resultado` goal/miss, `lote_id`, `contador_global`, …) | `CIRURGIA-FINAL-GAMEPLAY-SAQUE-AUTH-2026-03-31.md` |
| 3 | Decisões: migrar **schema** ao contrato V1 (não adaptar motor ao legado); RPC saque com **`fee`/`net_amount`**; não relaxar `NOT NULL` em `net_amount` no desenho alvo | Idem |
| 4 | **SQL** (ordem lógica nos relatórios): `migration-2026-03-31-chutes-v1-align.sql` → replace RPC em `rpc-financeiro-atomico-2026-03-28.sql` → correções legado **`resultado_legacy_jsonb`** → **`direcao_legacy_int`** | `CIRURGIA-FINAL-...`, `CORRECAO-SQL-CHUTES-LEGADO-DIRECAO-2026-04-01.md`, `REVALIDACAO-FINAL-...` |
| 5 | **Deploy Fly:** relatório cita **v344** pós-commit `c25dd82` (`fix(finance): align chutes v1 schema...`) | `EXECUCAO-CONTROLADA-FINAL-GAMEPLAY-SAQUE-AUTH-2026-03-31.md` |
| 6 | **Validações:** ponta a ponta com shoot **500** (primeiro bloqueio legado) e saque **201** OK; depois shoot ainda **500** por `direcao_legacy_int`; por fim shoot **200** após segunda DDL legado | `VALIDACAO-FINAL-PONTA-A-PONTA-...`, `VALIDACAO-FINAL-GAMEPLAY-POS-CORRECAO-SQL-2026-04-01.md`, `REVALIDACAO-FINAL-GAMEPLAY-POS-DIRECAO-LEGACY-2026-04-01.md` |
| 7 | **Estado atual:** gameplay shoot **validado com ressalvas** (teste com crédito manual); financeiro real PIX **validado com ressalvas**; BLOCO S **parcialmente preparado** | Relatórios citados, `RELATORIO-MESTRE-STATUS-BLOCOS-2026-03-31.md` |

---

## 2. Status por bloco

### BLOCO G — Gameplay

| Pergunta | Resposta baseada em evidência |
|----------|-------------------------------|
| `/api/games/shoot` funciona? | **Sim em produção** no teste pós-correção `direcao_legacy_int` — HTTP **200** (`REVALIDACAO-FINAL-...`). |
| Retorna 200? | **Sim** nesse teste. |
| Erro 500? | **Ocorreu antes** das DDL legado (`resultado_legacy_jsonb`, depois `direcao_legacy_int`) — documentado. **No teste final documentado, não.** |
| Saldo debitado? | **Sim** (ex.: 30 → 29, R$ 1) no relatório de revalidação. |
| Persistência em `public.chutes`? | **Sim** — linha com `usuario_id`, `lote_id`, `contador_global`, `shot_index`, `direcao`, `resultado`, `created_at`. |
| Lotes / contador? | Evidência de `loteId` na resposta e `contador_global` / `lote_id` na linha — `REVALIDACAO-FINAL-...`. |

**Classificação:** **FUNCIONAL EM PRODUÇÃO** (com ressalva: amostra limitada e saldo de teste injetado).

---

### BLOCO F — Financeiro (saque / saldo)

| Pergunta | Evidência |
|----------|-----------|
| `POST /api/withdraw/request` | **201** na validação ponta a ponta (`VALIDACAO-FINAL-PONTA-A-PONTA-...`). |
| `fee` / `net_amount` | Log e persistência descritos com taxa e líquido informativo (ex. R$ 5 saque, taxa R$ 2). |
| Saldo debitado | Coerente com débito do saque no mesmo relatório. |
| Histórico | Mencionado como coerente na mesma validação. |
| PIX real | Webhook + crédito **comprovados** com ressalvas de cobertura (`VALIDACAO-FINAL-FINANCEIRO-REAL-PRODUCAO-2026-03-31.md`). |

**Classificação:** **FUNCIONAL EM PRODUÇÃO** com **VALIDADO COM RESSALVAS** no relatório financeiro real (nem todos os subfluxos têm linha de log explícita na mesma coleta).

---

### BLOCO A — Auth

| Pergunta | Evidência |
|----------|-----------|
| Login | **200** nas validações recentes (`POST /api/auth/login`). |
| Registro | Utilizado nas sessões de teste (`POST /api/auth/register`) antes do login. |
| Token | Emitido pela API pública e usado como Bearer nos testes documentados. |
| Integração | Testes documentados encadeiam login → profile → shoot / withdraw com o mesmo token. |

**Classificação:** **FUNCIONAL** no âmbito dos testes descritos.

---

### BLOCO DB — Banco de dados

| Pergunta | Resposta |
|----------|----------|
| Schema alinhado ao backend? | **Objetivo** da migração V1 + RPC — aplicado em produção conforme relatórios de validação **posteriores** ao deploy inicial que ainda via schema desalinhado (`EXECUCAO-CONTROLADA-...` nota migração não aplicada na sessão automatizada inicial; relatórios posteriores assumem SQL aplicado). |
| Migrations aplicadas vs pendentes | O repositório contém os scripts; **estado exato da instância** só é comprovado pelas validações que observam colunas/constraints (ex.: OpenAPI / inserts). |
| OpenAPI | `EXECUCAO-CONTROLADA-...` cita introspecção **sem** `contador_global` **antes** da migração — estado histórico; pós-migração deve ser revalidado se necessário. |
| NOT NULL perigosos | **Facto:** `resultado_legacy_jsonb` e `direcao_legacy_int` causaram **23502** até DDL manual. **Risco:** outras colunas `NOT NULL` sem default podem repetir o padrão — *inferência cautelosa*, não lista completa comprovada neste documento. |

---

### BLOCO L — Legado

| Item | Estado documentado |
|------|-------------------|
| Colunas que causaram erro | `resultado_legacy_jsonb` (NOT NULL), `direcao_legacy_int` (NOT NULL) |
| Correções | Nullable/default conforme relatórios `CORRECAO-SQL-CHUTES-LEGADO-DIRECAO-2026-04-01.md` e migrações `migration-2026-04-01-*` |
| Risco sistémico | Pontualmente mitigado para as duas colunas comprovadas; **não** há prova documental de varredura exaustiva de todas as colunas legado |

**Classificação:** **CONTROLADO** (não **RESOLVIDO** de forma sistémica com evidência total).

---

### BLOCO S — Distribuição, plataformas, expansão

| Pergunta | Resposta (fonte: `BLOCO-S-FECHAMENTO-ETAPA-2026-03-31.md`) |
|----------|---------------------------------------------------------------|
| Objetivo original | Expansão comercial, parcerias, plataformas, governança |
| Ativação própria | Web/PWA operacional em continuidade controlada |
| Operação real | Backend núcleo em produção; **stores/bets B2B** exigem compliance, `partner_id`, atribuição auditável — **não** concluídos |
| Readiness escala | **Parcialmente preparado**; próxima etapa recomendada: prontidão B2B/compliance |

**Classificação:** **PARCIALMENTE PREPARADO** / **PRONTO PARA PRÓXIMA ETAPA** (não “pronto para expansão” plena).

---

## 3. Decisões arquiteturais tomadas

1. **Chutes:** evoluir o **schema Postgres** para o contrato **V1** usado pelo Node; preservar legado em `*_legacy*` (`CIRURGIA-FINAL-...`).
2. **Saque:** completar **RPC** e **fallback** com `fee`, `net_amount`, `p_fee`; validar `valor > taxa` antes de debitar.
3. **Legado:** após renomeações, **NOT NULL** em colunas legado sem preenchimento pelo insert V1 exigiu **DDL adicional** (documentado nas validações de Abril).

---

## 4. O que NÃO deve ser refeito

- **Não** reverter o desenho “schema V1 + colunas legado” sem plano de migração de dados — risco de regressão PGRST/insert.
- **Não** omitir `fee`/`net_amount` nos escritores de saque alinhados à RPC atual.
- **Não** assumir produção alinhada ao repo **sem** checklist SQL + smoke (`CIRURGIA-FINAL-...` checklist §11).

---

## 5. Problemas já resolvidos (factos)

| Problema | Causa raiz (documentada) | Solução aplicada | Status |
|----------|-------------------------|------------------|--------|
| PGRST204 / colunas V1 ausentes | Schema antigo | Migração `chutes` V1 | Resolvido no caminho validado pós-aplicação |
| 23502 `net_amount` (saque) | Insert incompleto | RPC + fallback com `fee`/`net_amount` | Resolvido na validação 201 |
| 500 shoot `resultado_legacy_jsonb` | NOT NULL sem valor no insert V1 | DDL nullable + default JSONB | Resolvido antes do teste `direcao_legacy_int` |
| 500 shoot `direcao_legacy_int` | NOT NULL sem valor | DDL nullable + default | Resolvido — `REVALIDACAO-FINAL-...` 200 |
| Deploy sem SQL (sessão inicial) | Ordem operacional / manual Supabase | Aplicação manual posterior | Superado pelos relatórios de validação seguintes |

---

## 6. Pendências atuais

1. **Prova documental** de jornada completa **só com PIX real** (sem crédito service role) para chute + saque, se for requisito de compliance interno.
2. **Varredura** de outras colunas `NOT NULL` em `chutes`/`saques` (catálogo) — não substituída por esta auditoria.
3. **BLOCO S:** governança B2B, `partner_id`, compliance — em aberto (`BLOCO-S-FECHAMENTO-...`).
4. **Ruído de webhook** inválido — mencionado como risco remanescente no relatório financeiro real.
5. **Escala multi-instância** / estado em memória da engine — risco transversal no relatório mestre de blocos.

---

## 7. Próximos passos recomendados

1. Manter **smoke** periódico: login → profile → shoot (valor mínimo) → verificação de linha em `chutes`.
2. Opcional: **matriz** de direções e resultados (goal/miss) com saldo real via PIX.
3. **Monitorizar logs** `[SHOOT]` e erros **23502** em novas colunas.
4. **BLOCO S:** iniciar etapa dedicada de prontidão B2B apenas quando houver mandato jurídico/operacional.

---

## 8. Estado real de produção (snapshot objetivo)

| Domínio | Estado (segundo documentação citada) |
|---------|--------------------------------------|
| Backend Fly | **Em serviço**; release **v344** referida na execução controlada |
| Banco | **Alinhado** ao desenho V1 + legado **após** migrações manuais descritas |
| Gameplay shoot | **Validado** com ressalvas (`REVALIDACAO-FINAL-...`) |
| Financeiro | **Validado com ressalvas** (PIX + saque em relatórios distintos) |
| Auth | **Validado** nos fluxos de teste |
| Distribuição (S) | **Não** “pronta para expansão” plena |

**Prontidão global:** **OPERÁVEL COM RISCO** / **OPERÁVEL** (equivalente a “estável com ressalvas controladas” em `RELATORIO-MESTRE-STATUS-BLOCOS-2026-03-31.md`). Não **PRONTO PARA ESCALA** no sentido de BLOCO S + multi-instância sem plano.

---

## Anexo C — Problemas críticos (lista consolidada)

| ID técnico / sintoma | Causa raiz | Solução | Status atual |
|---------------------|------------|---------|--------------|
| HTTP 500 shoot | 23502 `resultado_legacy_jsonb` | DDL + default | Corrigido (evidência revalidação) |
| HTTP 500 shoot | 23502 `direcao_legacy_int` | DDL + default | Corrigido (evidência revalidação) |
| Saque / RPC | 23502 `net_amount` | RPC + fallback | Corrigido (evidência 201) |
| Deploy antes do SQL | Ordem operacional | Checklist SQL primeiro | Documentado em `EXECUCAO-CONTROLADA-...` |

---

## Anexo D — Riscos ativos

### Técnicos
- Novas constraints **NOT NULL** sem default em tabelas híbridas legado/V1.
- Divergência **taxa** Node vs default SQL em RPC se `PAGAMENTO_TAXA_SAQUE` mudar sem alinhamento (`CIRURGIA-FINAL-...` §10).

### Dados / consistência
- Testes com **crédito manual** não provam o mesmo caminho que depósito PIX exclusivo.

### Escala / concorrência
- Estado de **engine/lotes** em memória por instância — risco ao escalar Fly (`RELATORIO-MESTRE-STATUS-BLOCOS-2026-03-31.md`).

### Produto / operação
- **BLOCO S:** regulamentação e políticas de lojas para apostas com dinheiro real.
- Webhook: **assinaturas inválidas** recorrentes no ruído de logs.

---

## Anexo E — Prompt sugerido para novo chat (continuidade sem contexto)

```markdown
# Contexto — Gol de Ouro Backend (goldeouro-backend)

## Sistema
- API Node (`server-fly.js`), deploy **Fly** `goldeouro-backend-v2`, Postgres **Supabase**.
- Blocos funcionais: **G** gameplay (`POST /api/games/shoot`), **F** financeiro (PIX, saque, saldo), **A** auth (JWT via `/api/auth/login`), **DB** migrações em `database/`, **L** colunas `*_legacy*` em `public.chutes`, **S** distribuição/B2B (estratégia, não núcleo técnico fechado).

## Estado atual (2026-04-01, factos em docs)
- Cirurgia V1 `chutes` + RPC saque `fee`/`net_amount` + ajustes `server-fly.js` (commit/tag documentados em `CIRURGIA-FINAL-GAMEPLAY-SAQUE-AUTH-2026-03-31.md` e `EXECUCAO-CONTROLADA-FINAL-...`).
- DDL manual em produção: `resultado_legacy_jsonb` e `direcao_legacy_int` (nullable/defaults) para eliminar **23502** nos inserts V1.
- Evidência: **`POST /api/games/shoot` 200** + persistência `chutes` + débito saldo — `docs/relatorios/REVALIDACAO-FINAL-GAMEPLAY-POS-DIRECAO-LEGACY-2026-04-01.md`.
- Saque **201** com fee/net em `VALIDACAO-FINAL-PONTA-A-PONTA-GAMEPLAY-SAQUE-HISTORICO-2026-04-01.md`.
- PIX real crédito com ressalvas: `VALIDACAO-FINAL-FINANCEIRO-REAL-PRODUCAO-2026-03-31.md`.
- BLOCO S: `docs/relatorios/BLOCO-S-FECHAMENTO-ETAPA-2026-03-31.md` — parcialmente preparado.

## Já resolvido (alto nível)
- Alinhamento schema V1 `chutes`; RPC/fallback saque; bloqueios legado `resultado_legacy_jsonb` e `direcao_legacy_int` nos testes documentados.

## Ainda falta / ressalvas
- Prova ponta a ponta **só com saldo originado de PIX** (sem crédito service role) se for obrigatório.
- Varredura de outras colunas NOT NULL; plano de escala engine; B2B/compliance BLOCO S.

## Próximo bloco lógico a executar
1. **Operação contínua:** smoke shoot + monitorização **23502** / logs `[SHOOT]`.
2. **Opcional produto:** matriz de testes gameplay; endurecer observabilidade webhook.
3. **Estratégia:** etapa BLOCO S (partner_id, compliance) apenas com mandato negócio/jurídico.

## Ficheiro mestre de handoff
- `docs/relatorios/ESTADO-ATUAL-SISTEMA-HANDOFF-2026-04-01.md`
```

---

## Referências cruzadas principais

| Documento | Uso |
|-----------|-----|
| `RELATORIO-MESTRE-STATUS-BLOCOS-2026-03-31.md` | Visão por blocos A–S |
| `CIRURGIA-FINAL-GAMEPLAY-SAQUE-AUTH-2026-03-31.md` | Decisões + ficheiros + riscos |
| `EXECUCAO-CONTROLADA-FINAL-GAMEPLAY-SAQUE-AUTH-2026-03-31.md` | Commit, tag, Fly v344, ordem SQL |
| `REVALIDACAO-FINAL-GAMEPLAY-POS-DIRECAO-LEGACY-2026-04-01.md` | Prova shoot 200 pós-DDL |
| `VALIDACAO-FINAL-PONTA-A-PONTA-GAMEPLAY-SAQUE-HISTORICO-2026-04-01.md` | shoot falhou depois saque OK (histórico de falhas) |
| `BLOCO-S-FECHAMENTO-ETAPA-2026-03-31.md` | Distribuição / B2B |

---

*Fim do handoff. Alterações futuras devem referenciar novo relatório datado e, quando aplicável, commits/tags.*
