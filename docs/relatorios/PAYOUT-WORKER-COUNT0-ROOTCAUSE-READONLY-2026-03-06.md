# Root cause: [PAYOUT][QUERY] count=0 — Auditoria READ-ONLY

**Data:** 2026-03-06  
**Objetivo:** Confirmar a causa exata de `query_retorna_0_em_producao` quando o payout_worker retorna `count=0` para statuses=pendente,pending,processando.

---

## 1) Resumo executivo

**Causa confirmada:** No banco **não existem linhas** com `status` em (`pendente`, `pending`, `processando`) no momento da query. Os valores distintos em `saques.status` são apenas **rejeitado** (7) e **cancelado** (2). Os 5 saques que constavam como **processando** no snapshot lógico anterior (pré-deploy) **aparecem agora como rejeitado** nos últimos registros. Portanto a query está correta; o estado dos dados mudou (os 5 foram rejeitados após o snapshot ou em outro processo).

- **RLS:** Não verificado via API (Supabase não expõe `pg_policies`). Com **service_role**, o Supabase ignora RLS por padrão; com o mesmo cliente local obtém-se count=0, então a causa não é RLS e sim o conteúdo da tabela.
- **Role/contexto:** Worker e script local usam `SUPABASE_SERVICE_ROLE_KEY` e mesmo `SUPABASE_URL`; config alinhada.
- **Visibilidade:** Query exata do worker executada localmente: **count=0**; filtros só `processando` ou só `pendente`: **0**. Últimos 20 saques retornam 9 linhas, todas com status **rejeitado** ou **cancelado**.

---

## 2) Causa confirmada ou mais provável

**Causa confirmada:** **Estado dos dados.**

- Na tabela `saques` **não há** nenhuma linha com `status` em `pendente`, `pending` ou `processando`.
- Os 5 saques que no snapshot lógico (pré-deploy) estavam em `processando` hoje aparecem como **rejeitado** (mesmos IDs nos últimos 20: 8d11c1a2, ed46001f, da70665c, ecd0045f, ea3e4dec, etc.).
- Conclusão: a query do worker está correta; **count=0** reflete o estado atual do banco (zero elegíveis). Os “5 saques presos” foram atualizados para **rejeitado** em algum momento (reconciler, worker em ciclo anterior, ou intervenção manual).

---

## 3) Evidência por JSON

| Arquivo | Conteúdo relevante |
|---------|---------------------|
| **payout-count0-status-values.json** | `distinct_status`: ["rejeitado", "cancelado"]; `contagem_por_status`: rejeitado 7, cancelado 2; conclusão: "Valor processando NAO encontrado". |
| **payout-count0-saques-visible.json** | `query_exata_worker.count`: 0; `filtro_somente_processando.count`: 0; `filtro_somente_pendente.count`: 0; `ultimos_20_saques`: 9 linhas, todas rejeitado ou cancelado. |
| **payout-count0-role-check.json** | Worker usa SERVICE_ROLE; local tem mesma config; mesmo projeto esperado: true. |
| **payout-count0-rls-check.json** | RLS não auditado via API; service_role bypassa RLS; se count=0 com service_role, causa provável não é RLS. |
| **payout-count0-worker-vs-app.json** | Com service_role localmente, count=0; conclusão: "dados ou filtro explicam count=0". |

---

## 4) O que está OK

- Worker e app usam **SUPABASE_URL** e **SUPABASE_SERVICE_ROLE_KEY**; configuração consistente.
- Schema **public** explícito no worker.
- Query do worker (statusList = pendente, pending, processando) está **correta** e reproduzível.
- Com o **mesmo cliente** (service_role) localmente obtém-se **count=0**, coerente com produção.
- Não há indício de vazamento de segredos nos artefatos.

---

## 5) O que está errado / observações

- **Nada “errado” na lógica da query:** count=0 é a resposta correta para o estado atual da base.
- **Inconsistência temporal:** No snapshot lógico pré-deploy (11:55) havia 5 saques em `processando`; nos logs do worker (12:03+) e no script de root cause (12:18) já não há nenhum em `processando` (os mesmos IDs aparecem como **rejeitado**). Ou seja, os 5 foram atualizados para **rejeitado** após o snapshot.
- **RLS:** Não foi possível verificar políticas via API; auditoria manual no Dashboard ou via SQL continua recomendada se no futuro houver dúvida sobre outro ambiente/role.

---

## 6) Patch mínimo V1.2 recomendado (sem implementar)

- **Opção A — Nenhuma alteração obrigatória:** O comportamento atual (count=0 quando não há elegíveis) está correto. Os 5 saques já foram rejeitados.
- **Opção B — Melhorias opcionais:**
  - Logar transições de status (ex.: processando → rejeitado) para auditoria.
  - Manter snapshot lógico antes/depois de deploy para comparar estados.
  - Documentar no runbook: “count=0 com payouts_falha: 5” pode indicar que os itens foram rejeitados em ciclos anteriores.

Nenhuma alteração na query ou em RLS é necessária para corrigir count=0; a causa foi o estado dos dados, não bug de código.

---

## 7) GO / NO-GO para patch V1.2

**GO** para encerrar o incidente de “count=0”: causa identificada (estado dos dados; nenhum bug na query).

**NO-GO** para um “patch V1.2” que mude a query ou RLS para “forçar” aparecimento dos 5 saques: eles já não estão mais em `processando`; não há correção a fazer na query.

---

## Artefatos e scripts

| Artefato | Caminho |
|----------|---------|
| Relatório | docs/relatorios/PAYOUT-WORKER-COUNT0-ROOTCAUSE-READONLY-2026-03-06.md |
| RLS check | docs/relatorios/payout-count0-rls-check.json |
| Role check | docs/relatorios/payout-count0-role-check.json |
| Saques visíveis | docs/relatorios/payout-count0-saques-visible.json |
| Worker vs app | docs/relatorios/payout-count0-worker-vs-app.json |
| Status values | docs/relatorios/payout-count0-status-values.json |
| Script root cause | scripts/payout-count0-rootcause-readonly.js |
| Script RLS (doc) | scripts/payout-count0-rls-readonly.js |
