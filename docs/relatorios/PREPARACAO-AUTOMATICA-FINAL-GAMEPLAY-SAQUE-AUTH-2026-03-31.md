# PREPARAÇÃO AUTOMÁTICA FINAL — GAMEPLAY + SAQUE + AUTH

**Data:** 2026-03-31  
**Modo:** preparação operacional (sem alteração de código, SQL aplicado, secrets ou deploy).  
**Método de introspection:** leitura **read-only** do schema exposto pelo PostgREST (`GET /rest/v1/` com `Accept: application/openapi+json`), alinhado ao catálogo PostgreSQL por trás da API Supabase do projeto configurado no `.env` (`gayopagjdrkcmkirmfvy.supabase.co`).  
**Referências de planeamento:** `PRE-EXECUCAO-CIRURGICA-GAMEPLAY-SAQUE-AUTH-2026-03-31.md`, `DIAGNOSTICO-CIRURGICO-GAMEPLAY-SAQUE-AUTH-2026-03-31.md`.

---

## 1. Escopo confirmado

| Área | Escopo mantido |
|------|----------------|
| **Chute** | Alinhar persistência do motor V1 (`server-fly.js`) ao schema real de `public.chutes`. |
| **Saque** | Completar `fee` / `net_amount` na RPC e no fallback; manter `net_amount NOT NULL`. |
| **Auth** | Sem mudança de código; testes com login na API pública; secrets Fly só como operação separada. |

---

## 2. Introspection realizada

- **Sim**, concluída em **2026-03-31** via OpenAPI do PostgREST (service role, read-only).  
- **Limite:** não foi usada sessão `psql` nem `information_schema` directo; constraints `CHECK` puras podem não aparecer no OpenAPI, mas **FKs** aparecem nas descrições das propriedades.  
- **Evidência prévia cruzada:** erro **PGRST204** em `contador_global` e **23502** em `net_amount` são coerentes com o OpenAPI obtido.

---

## 3. Resultado da introspection

### 3.1 Tabela `public.chutes` (via OpenAPI)

**Colunas expostas e tipos:**

| Coluna | Tipo (OpenAPI) | Notas |
|--------|----------------|--------|
| `id` | uuid (PK, default `uuid_generate_v4()`) | Listada em `required` do schema (insert pode omitir se default aplicável no PostgREST). |
| `partida_id` | uuid | **FK → `partidas.id`** (indicado na descrição OpenAPI). |
| `usuario_id` | uuid | **FK → `usuarios.id`**. |
| `resultado` | **jsonb** | Não é `varchar` (`goal`/`miss`) como no insert V1 do Node. |
| `gol_marcado` | boolean, default `false` | Modelo legado. |
| `created_at` | timestamptz, default `now()` | |
| `valor_aposta` | numeric | |
| `direcao` | **integer** | O motor V1 envia **string** (`TL`, `TR`, `C`, `BL`, `BR`). |

**Colunas que o `server-fly.js` insert usa e que **não** aparecem no OpenAPI (logo: **ausentes** do schema exposto / tabela actual):**

- `lote_id`
- `contador_global`
- `shot_index`
- `premio`
- `premio_gol_de_ouro`
- `is_gol_de_ouro`

**`contador_global`:** **ausente** (confirma diagnóstico **PGRST204**).

### 3.2 Constraints e FKs em `public.chutes`

| Item | Evidência |
|------|-----------|
| **FK `partida_id` → `partidas.id`** | Presente na descrição OpenAPI de `partida_id`. |
| **FK `usuario_id` → `usuarios.id`** | Presente na descrição OpenAPI de `usuario_id`. |
| **`lote_id`** | **Não existe** na definição exposta; o risco original “FK `lote_id` → `lotes`” **não aplica** a este schema — em vez disso, o **gate crítico** é **`partida_id` obrigatório** e modelo **legado vs V1**. |

### 3.3 Tabela `public.saques` (via OpenAPI)

**Propriedades relevantes:**

- `fee` — numeric, **default `0`** no OpenAPI.
- `net_amount` — numeric, **sem default** na descrição da propriedade.
- `amount`, `valor`, `chave_pix`, `tipo_chave`, `pix_key`, `pix_type`, `status`, `created_at`, `updated_at`, `processed_at`, `transacao_id`, `motivo_rejeicao`, `correlation_id`, `id`, `usuario_id`.

**Campos em `required` (lista OpenAPI — insert via API):** inclui **`fee`** e **`net_amount`** juntamente com `usuario_id`, `chave_pix`, `tipo_chave`, `amount`, `pix_key`, `pix_type`, entre outros.

**Conclusão:** `net_amount` (e `fee` na lista `required`) exigem valor no insert coerente com o erro **23502** observado quando a RPC omite `net_amount`.

### 3.4 RPC `solicitar_saque_pix_atomico`

- **Assinatura no repositório** (`database/rpc-financeiro-atomico-2026-03-28.sql`):  
  `solicitar_saque_pix_atomico(p_usuario_id uuid, p_amount numeric, p_pix_key text, p_pix_type text) RETURNS jsonb`  
  `SECURITY DEFINER`, `search_path = public`, `GRANT EXECUTE` a `service_role`.

- **Presença em produção:** evidência anterior de execução da RPC com falha **23502** no `INSERT` interno (função existe e corre até ao insert incompleto).

- **Corpo relevante:** `INSERT INTO public.saques (usuario_id, amount, valor, pix_key, chave_pix, pix_type, tipo_chave, status, created_at)` — **sem** `fee` / `net_amount`, incompatível com o `required` OpenAPI actual.

---

## 4. Arquivos-alvo (cirurgia futura)

| Tipo | Ficheiro |
|------|----------|
| Código | `server-fly.js` (fallback saque: `dualWriteSaqueRow` com `fee` / `net_amount`). |
| SQL | `database/rpc-financeiro-atomico-2026-03-28.sql` (nova revisão da função). |
| SQL novo | Ficheiro incremental de migração para `chutes` **e/ou** adaptação documentada do insert — **dependente da decisão V1 vs legado** (ver secção 11). |

---

## 5. Arquivos que não devem ser tocados

- `utils/financialNormalization.js` (já suporta `fee` / `net_amount` quando fornecidos).
- Frontends `goldeouro-player`, `goldeouro-admin` (fora do escopo desta cirurgia).
- Fluxo de webhook Mercado Pago, reconcile, crédito PIX (salvo regressão detectada em validação global).
- Entrypoints não usados pelo Dockerfile/Fly actual (`server-fly-deploy.js`, `router.js`, …) salvo auditoria de deploy paralelo.
- **Secrets e `.env`** no repositório (nunca commitar valores reais).

---

## 6. Estratégia de rollback

| Camada | Acção |
|--------|--------|
| **Git** | Manter tag `pre-cirurgia-gameplay-saque-auth-2026-03-31`; após preparação opcionalmente criar tag adicional (secção 8). `git revert` ou reset controlado sobre commits da cirurgia. |
| **RPC** | Antes do `CREATE OR REPLACE`, guardar cópia da definição actual (`pg_get_functiondef` no SQL Editor ou export do painel) para reaplicar em rollback. |
| **DDL `chutes`** | Preferir **forward-fix** se já houver dados em produção; `DROP COLUMN` / rollback agressivo só com backup e janela acordada. |
| **Fly** | Após fase de execução: rollback para release anterior (`fly releases` / procedimento interno); imagem anterior + RPC/DDL revertidos coordenadamente. |

---

## 7. Commit sugerido

```
docs(relatorio): preparacao automatica final gameplay/saque/auth 2026-03-31
```

(Inclui apenas a entrega deste relatório; commits de código/SQL ficam para a fase “Cirurgia”.)

---

## 8. Tag sugerida

```
preparacao-automatica-gameplay-saque-auth-2026-03-31
```

**Propósito:** marcar o repositório no estado “plano fechado + introspection documentada”, imediatamente antes de qualquer alteração de código/SQL de cirurgia.

---

## 9. Checklist pré-cirurgia

- [x] Introspection concluída (OpenAPI PostgREST).
- [x] `contador_global` confirmado **ausente** do schema exposto de `chutes`.
- [x] `lote_id` / FK: **não há `lote_id`** no schema actual; existe **`partida_id` → `partidas`** — gate actualizado (secção 11).
- [x] `fee` e `net_amount` presentes em `saques`; **`required`** inclui ambos na API.
- [x] Definição da RPC no repo documentada; cópia da função **em produção** a arquivar antes do replace (passo operacional humano).
- [x] Arquivos-alvo confirmados (secção 4).
- [x] Rollback definido (secção 6).
- [x] Escopo mantém-se fechado; não misturar refactors externos.
- [ ] **Decisão de desenho fechada** para `chutes`: migração para colunas V1 **ou** mapeamento legado (`partida_id`, `direcao` int, `resultado` jsonb) — **gate obrigatório** antes do primeiro `ALTER`/`INSERT` corrigido.

---

## 10. Ordem segura da cirurgia (futura)

1. **Gate de desenho `chutes`** (secção 11): fechar estratégia; só então escrever migration/alterações de insert.
2. **Migration / DDL `chutes`** (conforme desenho).
3. **Validação read-only** (OpenAPI ou insert de teste em staging): colunas e tipos alinhados ao Node.
4. **`CREATE OR REPLACE` da RPC** `solicitar_saque_pix_atomico` com `fee` e `net_amount`.
5. **Patch `server-fly.js`** (fallback).
6. **Deploy** (fase “Execução controlada”).
7. **Validação** E2E: login na API pública → chute → saque → histórico.

---

## 11. Riscos antes de mexer

1. **Crítico — `chutes` legado vs V1:** O problema **não** se limita a acrescentar `contador_global`. O backend envia `lote_id` (string), `direcao` textual, `resultado` como resultado de jogo V1, e colunas de prémio; o schema exposto exige **`partida_id`**, `direcao` **integer**, `resultado` **jsonb**. **Só adicionar `contador_global` não desbloqueia o chute** sem uma das seguintes: (a) migração alargada para modelo V1 + eventual tratamento de `partidas`/`lotes`, ou (b) camada de adaptação no backend para o legado (valores sintéticos de `partida_id`, mapeamento de direcção, etc.) — com impacto de produto e auditoria a decidir explicitamente.

2. **RPC vs OpenAPI `required`:** Após corrigir `net_amount`/`fee`, validar se outros campos `required` pelo PostgREST continuam satisfeitos em todos os inserts (RPC + fallback).

3. **JWT / Fly:** Permanece fora desta preparação; testes devem usar token da própria API pública.

---

## 12. Sinal verde final

**LIBERADA COM CONDIÇÕES**

**Condições antes da primeira linha de cirurgia em `chutes`:**

1. Documento ou ADR fechando **estratégia legado vs V1** (não apenas “ADD COLUMN”).
2. Cópia de segurança da definição **actual** da RPC em produção arquivada.
3. Backup / snapshot Supabase conforme política da equipa.

**Não classificado como BLOQUEADA** porque saque + fallback têm caminho técnico fechado; **gate** está concentrado no desenho de `chutes`.

---

## 13. Conclusão objetiva

A introspection read-only **confirmou** `contador_global` **ausente** e revelou que **`chutes` em produção é o modelo legado** (`partida_id`, `direcao` inteiro, `resultado` jsonb), **incompatível** com o insert actual do `server-fly.js`. Em `saques`, **`fee` e `net_amount` são obrigatórios** na API e a RPC actual **não os preenche**. A preparação automática está **documentalmente completa**; a cirurgia só deve avançar após **decisão explícita** no eixo `chutes`, mantendo rollback e ordem definidos acima.
