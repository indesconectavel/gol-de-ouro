# CIRURGIA FINAL — GAMEPLAY + SAQUE + AUTH

**Data:** 2026-03-31  
**Escopo:** alinhar `public.chutes` ao contrato V1 do `server-fly.js`; corrigir RPC e fallback de saque para `fee` / `net_amount`; documentar auth em produção. Sem alteração a frontend, webhook ou reconcile.

---

## 1. Resumo executivo

Foram entregues no repositório: (1) migração SQL incremental para evoluir `chutes` do modelo legado para o V1 **sem apagar dados**; (2) revisão da RPC `solicitar_saque_pix_atomico` com `fee`, `net_amount`, `updated_at` e parâmetro `p_fee` alinhado a `PAGAMENTO_TAXA_SAQUE`; (3) ajustes no `server-fly.js` (validação `valor > taxa`, chamada RPC com `p_fee`, fallback com `fee`/`net_amount`). A aplicação dos scripts SQL no Supabase e o deploy do backend são **execução controlada** fora deste commit.

---

## 2. Decisão de desenho adotada

- **Chutes:** migrar o **schema real** para o contrato V1 usado pelo backend atual; **não** adaptar o motor ao legado.
- **Legado:** colunas antigas renomeadas para `*_legacy*` onde incompatíveis (`direcao` inteiro → `direcao_legacy_int`, `resultado` jsonb → `resultado_legacy_jsonb`, `gol_marcado` → `gol_marcado_legacy`); `partida_id` passa a **opcional** (NULL nos chutes V1).
- **Saque:** corrigir **escritores** (RPC + fallback); **não** relaxar `NOT NULL` em `net_amount`.
- **Auth:** sem mudança de código; testes em produção via `POST /api/auth/login` na API pública e Bearer do token devolvido. Rotação de `JWT_SECRET` na Fly permanece operação separada.

---

## 3. Arquivos alterados

| Ficheiro | Alteração |
|----------|-----------|
| `database/migration-2026-03-31-chutes-v1-align.sql` | **Novo** — migração incremental `chutes` (V1 + preservação legado). |
| `database/rpc-financeiro-atomico-2026-03-28.sql` | RPC de saque: `DROP` assinatura 4-arg, `CREATE` 5-arg (`p_fee`), insert com `fee`, `net_amount`, `updated_at`. |
| `server-fly.js` | Rejeição se `valorSaque <= taxa`; RPC com `p_fee: taxa`; `dualWriteSaqueRow` com `fee` e `net_amount`. |
| `docs/relatorios/CIRURGIA-FINAL-GAMEPLAY-SAQUE-AUTH-2026-03-31.md` | **Novo** — este relatório. |

---

## 4. SQL/migração aplicada para `chutes`

Ficheiro: `database/migration-2026-03-31-chutes-v1-align.sql`.

Resumo:

- `partida_id` → `DROP NOT NULL` (quando a coluna existe).
- Renomeações de preservação: `direcao` (integer) → `direcao_legacy_int`; `resultado` (jsonb) → `resultado_legacy_jsonb`; `gol_marcado` → `gol_marcado_legacy`.
- Novas colunas V1: `direcao` VARCHAR(10), `resultado` VARCHAR(20), `lote_id`, `contador_global`, `shot_index`, `premio`, `premio_gol_de_ouro`, `is_gol_de_ouro` (com defaults seguros para linhas antigas).
- Backfill de `resultado` a partir de `gol_marcado_legacy` quando existir.
- `CHECK` em `resultado` ∈ (`goal`,`miss`) e `direcao` ∈ (`TL`,`TR`,`C`,`BL`,`BR`) (idempotente).
- Índices: `contador_global`, `lote_id`, `(usuario_id, created_at DESC)`.

**Aplicação:** executar o ficheiro completo no **SQL Editor** do Supabase (recomendado: backup prévio; validar em staging se existir).

---

## 5. Ajuste da RPC de saque

- `DROP FUNCTION IF EXISTS public.solicitar_saque_pix_atomico(uuid, numeric, text, text);`
- Nova assinatura: `(p_usuario_id, p_amount, p_pix_key, p_pix_type, p_fee numeric DEFAULT NULL)`.
- `v_taxa := COALESCE(p_fee, 2.00::numeric)` — espelha o default de `PAGAMENTO_TAXA_SAQUE` no Node quando `p_fee` é omitido.
- Rejeição se `p_amount <= v_taxa` (alinha à validação HTTP).
- `INSERT` em `saques` inclui `fee`, `net_amount`, `updated_at` (e demais colunas já usadas).
- `REVOKE`/`GRANT` atualizados para a assinatura de 5 argumentos.

---

## 6. Ajuste do fallback em `server-fly.js`

- Antes da RPC: `400` se `valorSaque <= taxa`.
- Chamada `supabase.rpc(..., { ..., p_fee: taxa })`.
- `dualWriteSaqueRow({ ..., fee: taxa, net_amount: valorLiquido })` com `valorLiquido = valorSaque - taxa`.

---

## 7. Contrato final de `chutes` (alvo pós-migração)

**V1 (usado pelo insert do backend):** `usuario_id`, `lote_id` (string), `direcao` (texto TL/TR/C/BL/BR), `valor_aposta`, `resultado` (`goal`|`miss`), `premio`, `premio_gol_de_ouro`, `is_gol_de_ouro`, `contador_global`, `shot_index`, `created_at`, `id`; **`partida_id` opcional (NULL).**

**Legado preservado (auditoria):** `partida_id`, `direcao_legacy_int`, `resultado_legacy_jsonb`, `gol_marcado_legacy` (quando existiram na origem).

---

## 8. Contrato final de `saques` (escrita)

A RPC e o fallback passam a preencher explicitamente:

- `fee` = taxa (`PAGAMENTO_TAXA_SAQUE` / `p_fee`).
- `net_amount` = valor solicitado − taxa (líquido informativo).
- RPC também define `updated_at` no insert.

O débito em `usuarios.saldo` mantém-se pelo **valor bruto** `p_amount` / `valorSaque`, como antes.

---

## 9. Riscos eliminados

- **PGRST204** por coluna `contador_global` (e demais campos V1) ausentes — após migração aplicada.
- **23502** em `net_amount` no caminho RPC — após replace da função e insert completo.
- **23502** no fallback JS — após `dualWriteSaqueRow` com `fee` / `net_amount`.
- Saque com valor ≤ taxa — rejeitado de forma explícita (400 / `invalid_amount` na RPC).

---

## 10. Riscos remanescentes

- **Ordem operacional:** se o **deploy Node** atualizar antes da **migração `chutes`** ou do **replace da RPC**, podem persistir erros até alinhar a base.
- **`p_fee` vs env:** a taxa deve ser a mesma no Node e na RPC; alterar só `PAGAMENTO_TAXA_SAQUE` sem republicar a RPC mantém coerência no cliente, mas o default SQL (2.00) em chamadas sem `p_fee` deve ser revisto se o default do env mudar.
- **`updated_at` no fallback:** o insert via PostgREST no fallback **não** envia `updated_at`; se a tabela exigir `NOT NULL` sem default nessa coluna, pode falhar — validar no catálogo; em muitos projetos há default ou trigger.
- **Triggers/views** desconhecidos no Supabase que referenciem nomes antigos de colunas de `chutes` — improvável após renomeação, mas validar em staging.
- **JWT / Fly:** inalterado; testes manuais exigem login na API pública.

---

## 11. Checklist de validação pós-cirurgia

1. Executar `migration-2026-03-31-chutes-v1-align.sql` e o bloco atualizado de `solicitar_saque_pix_atomico` no Supabase (sem erros).
2. Recarregar/refrescar schema PostgREST (normalmente automático).
3. Deploy `server-fly.js` na Fly (ou ambiente alvo).
4. `POST /api/auth/login` na URL pública → obter `token`.
5. `GET /api/user/profile` com Bearer → 200.
6. `POST /api/games/shoot` (direção válida, `amount: 1`) → 200; verificar linha em `chutes` com `contador_global`, `lote_id`, `resultado`, `direcao` V1.
7. `POST /api/withdraw/request` com valor > taxa → 201; linha em `saques` com `fee` e `net_amount` preenchidos.
8. `GET /api/withdraw/history` → inclui o saque recente.
9. Smoke: criação PIX / webhook **não** coberto por esta cirurgia — opcional no mesmo release.

---

## 12. Classificação final

**PRONTO PARA EXECUÇÃO CONTROLADA**

*(Código e SQL versionados no repo; aplicação no Supabase + deploy são os passos seguintes explícitos.)*

---

## 13. Conclusão objetiva

A cirurgia no repositório **fecha** o desenho V1 para `chutes`, alinha a RPC e o fallback de saque às constraints de `fee`/`net_amount`, e documenta auth por login na API pública. A **execução controlada** consiste em aplicar a migração e o `CREATE OR REPLACE` no Supabase, depois publicar o backend; até lá, o ambiente de produção não reflete sozinho estas alterações.
