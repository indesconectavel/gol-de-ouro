# Deploy seguro PAYOUT V1.1 (sem pg_dump) — Relatório

**Data:** 2026-03-06  
**Objetivo:** Colocar em produção o commit `0f09038` (patch V1.1) somente no backend Fly, sem DATABASE_URL/pg_dump, usando snapshot lógico read-only das tabelas financeiras + rollback de release se necessário.

---

## Resultado: **PASS**

O deploy foi executado. Release **v313** está no ar. Smoke test passou; rollback **não** foi acionado.

---

## Justificativa: snapshot lógico em vez de pg_dump

- **Restrição:** DATABASE_URL não disponível no ambiente local; pg_dump não utilizado.
- **Substituto:** Snapshot lógico read-only via Supabase (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY): leitura das tabelas críticas (saques, pagamentos_pix, ledger_financeiro, transacoes, usuarios) com campos redigidos, totais e IDs críticos.
- **Artefato:** `docs/relatorios/payout-v1_1-financial-snapshot-before.json` — permite comparar estado antes/depois e reverter dados se necessário via scripts de correção, sem backup SQL completo.

---

## Gates executados

| Passo | Descrição | Resultado |
|-------|-----------|-----------|
| 0 | Gate frontend: /game e /dashboard 200, server Vercel | **PASS** |
| 1 | Gate Git: branch, HEAD = 0f09038, sem código modificado | **PASS** |
| 2 | Snapshot Fly antes (releases, machines) | **OK** (payout-v1_1-fly-before.json) |
| 3 | Snapshot lógico financeiro (read-only) | **OK** (payout-v1_1-financial-snapshot-before.json) |
| 4 | Deploy Fly | **OK** (release v313) |
| 5 | Smoke test /health, /game, /dashboard | **PASS** (todos 200; hash /game preservado) |
| 6 | Revalidação worker (logs) | **OK** (payout-v1_1-worker-signals.json) |
| 7 | Scripts readonly + postdeploy status | **OK** (payout-v1_1-postdeploy-status.json) |

---

## Snapshot lógico salvo

- **Arquivo:** `docs/relatorios/payout-v1_1-financial-snapshot-before.json`
- **Conteúdo:** Saques (últimos 100 + processando), pagamentos_pix (últimos 100), ledger_financeiro (últimos 100), transacoes (últimos 100), usuarios afetados, metadata e IDs críticos (redigidos).

---

## Release Fly antes/depois

- **Antes:** v312  
- **Depois:** v313  
- **Última estável (rollback planejado):** v305  
- **Rollback acionado:** Não  

---

## Smoke /health, /game, /dashboard

- **/health:** 200  
- **/game:** 200, server Vercel, html_sha256 = bebe03d33ac9bbf67be1ac78fdd1bca0dc9eca615eaf5df9024a80710f346ee0  
- **/dashboard:** 200, server Vercel  

Fingerprint do /game mantido; frontend preservado.

---

## Artefatos

| Arquivo | Caminho |
|---------|---------|
| Freeze check | docs/relatorios/payout-v1_1-freeze-check.json |
| Git gate | docs/relatorios/payout-v1_1-git-gate.json |
| Fly antes | docs/relatorios/payout-v1_1-fly-before.json |
| Snapshot financeiro | docs/relatorios/payout-v1_1-financial-snapshot-before.json |
| Deploy result | docs/relatorios/payout-v1_1-deploy-result.json |
| Smoke | docs/relatorios/payout-v1_1-smoke.json |
| Worker signals | docs/relatorios/payout-v1_1-worker-signals.json |
| Postdeploy status | docs/relatorios/payout-v1_1-postdeploy-status.json |

---

## PASS/FAIL

**PASS**

---

## Houve rollback?

**Não.**

---

## Script criado

- `scripts/payout-v1_1-financial-snapshot-readonly.js` — snapshot lógico read-only (Supabase); não usa DATABASE_URL nem pg_dump.
