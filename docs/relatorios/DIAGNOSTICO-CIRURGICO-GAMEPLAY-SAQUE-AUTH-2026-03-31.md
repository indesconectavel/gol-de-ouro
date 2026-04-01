# DIAGNÓSTICO CIRÚRGICO — GAMEPLAY + SAQUE + AUTH

**Modo:** READ-ONLY (código, SQL de referência, documentação interna; sem alterações aplicadas).  
**Data:** 2026-03-31  
**Baseline de referência:** tag `pre-cirurgia-gameplay-saque-auth-2026-03-31` / commit `8976d703d5f8b0e314ebad8cd9fb7724c6f876de`.

---

## 1. Resumo executivo

Três falhas independentes na **camada de integração** entre aplicação e base de dados (e, no caso da auth, entre **segredos de ambiente**), todas coerentes com **drift**: o código e/ou as RPCs assumem colunas ou invariantes que o **Postgres/PostgREST em produção** expõe de forma diferente (coluna ausente, `INSERT` incompleto, `JWT_SECRET` distinto).

---

## 2. Escopo auditado

| Artefacto | Finalidade |
|-----------|------------|
| `server-fly.js` | `POST /api/games/shoot` (insert `chutes`), `POST /api/withdraw/request` (RPC + fallback), `authenticateToken`, emissão JWT em login/registo |
| `database/rpc-financeiro-atomico-2026-03-28.sql` | `solicitar_saque_pix_atomico` |
| `utils/financialNormalization.js` | `dualWriteSaqueRow` (fallback de saque) |
| `database/supabase-unified-config.js` | Cliente service role (mesmo padrão usado no runtime) |
| `schema-supabase-final.sql`, `SCHEMA-CORRECAO-COMPLETA-FINAL.sql`, `schema-supabase.sql` (legado) | Contrato documentado vs legado para `chutes` e evolução de colunas |
| `docs/relatorios/INVENTARIO-ENV-V1.md` | Comportamento esperado de `JWT_SECRET` e Fly |
| Evidência de runtime já registada | `FECHAMENTO-FINANCEIRO-REAL-SEM-RESSALVAS-2026-03-31.md`, `BASELINE-PRE-CIRURGIA-2026-03-31.md` |

**Limite:** não foi executada nova introspection SQL em produção nesta auditoria; a conclusão sobre colunas usa **erro PGRST204** (schema cache PostgREST) e o **23502** já observado, cruzados com o código-fonte.

---

## 3. Diagnóstico do chute

### Onde o código usa `contador_global`

Único insert persistido do chute em `server-fly.js` inclui explicitamente `contador_global: contadorChutesGlobal` junto com `usuario_id`, `lote_id`, `direcao`, `valor_aposta`, `resultado`, `premio`, `premio_gol_de_ouro`, `is_gol_de_ouro`, `shot_index`.

### Esse campo deveria existir?

**Sim**, no desenho alinhado ao motor V1 documentado no repositório: vários artefactos SQL de referência definem `chutes.contador_global` como `INTEGER NOT NULL` (ex.: `schema-supabase-final.sql`). A documentação interna descreve o insert com essa coluna.

### O schema “atual” em produção (vista PostgREST) possui o campo?

**Evidência objetiva:** resposta **PGRST204** — *Could not find the 'contador_global' column of 'chutes' in the schema cache*.  
Interpretação técnica: para o PostgREST ligado ao projeto Supabase em uso, a coleção `chutes` **não expõe** a coluna `contador_global` (tipicamente porque a coluna **não existe** na tabela física ou não está no schema exposto; o efeito prático é o mesmo: o insert da aplicação é rejeitado antes de chegar a um insert PostgreSQL bem-formado com esses campos).

### Migration faltando?

**Hipótese principal:** migração ou script corretivo que adiciona `contador_global `(e possivelmente outras colunas do modelo V1) **não foi aplicado** ao projeto Supabase que serve produção, **ou** a base foi criada a partir de um SQL mais antigo (ex.: `schema-supabase.sql` com modelo `partida_id` / `zona`, sem `contador_global`).

### Erro no código, no banco ou no “cache”?

- **Código:** coerente com o modelo V1 documentado no repo.  
- **Banco / vista API:** incoerente com o que o código envia → falha **PGRST204**.  
- **“Cache”:** o schema cache do PostgREST reflete o catálogo PostgreSQL; não é um bug isolado de “cache stale” sem causa em schema.

### Correção mais provável (sem implementar)

1. **Alinhar BD:** adicionar coluna(ns) em `chutes` conforme contrato V1 (`contador_global`, e validar também `shot_index`, `direcao`, `resultado`, `premio*`, `is_gol_de_ouro` face ao legado).  
2. **Ou** (menos desejável): remover/renomear campos no insert do backend para bater com um schema legado — implica perder semântica de Gol de Ouro / auditoria.  
3. **Risco adicional** (não foi o erro reportado, mas existe no SQL de referência): `schema-supabase-final.sql` define `lote_id` com `REFERENCES public.lotes(id)` enquanto o runtime usa `lote_id` **string** gerada em memória (`lote_${amount}_...`). Se produção tiver FK para `lotes`, após corrigir `contador_global` pode surgir falha de FK — a validar no pré-execução contra o catálogo real.

---

## 4. Diagnóstico do saque

### Onde `net_amount` deveria ser calculado

No domínio financeiro do projeto, `net_amount` é o valor líquido após taxa (`PAGAMENTO_TAXA_SAQUE` em `server-fly.js`, ex. R$ 2,00) — valor solicitado **bruto** debitado do saldo vs. líquido informativo para payout/relatórios. Documentação em `NORMALIZACAO-CIRURGICA-NOMENCLATURA-FINANCEIRA-2026-03-28.md` e `VALIDACAO-SCHEMA-FINANCEIRO-SUPABASE-READONLY-2026-03-07.md` trata `fee` e `net_amount` como colunas esperadas no fluxo completo.

### Quem deveria preencher `net_amount`

- **RPC `solicitar_saque_pix_atomico`:** o `INSERT` na função inclui apenas `usuario_id, amount, valor, pix_key, chave_pix, pix_type, tipo_chave, status, created_at` — **não** define `fee` nem `net_amount`.  
- **Fallback JS:** `dualWriteSaqueRow` só inclui `fee` / `net_amount` se forem passados; o chamador em `server-fly.js` **não** passa esses campos no objeto para `dualWriteSaqueRow`.

### A tabela exige `NOT NULL` corretamente?

Do ponto de vista do **produto**, pode ser desejável. Do ponto de vista da **implementação atual**, a restrição **NOT NULL** em `net_amount` sem `DEFAULT` é **incompatível** com os dois caminhos de escrita (RPC e fallback), que omitem o campo — daí o **23502** observado.

### A RPC está incompleta?

**Sim**, relativamente ao schema que exige `net_amount` NOT NULL: falta calcular e inserir `fee` e `net_amount` (e eventualmente `correlation_id`, conforme workers/relatórios).

### O backend deixa de enviar parâmetro?

A RPC só recebe `p_usuario_id`, `p_amount`, `p_pix_key`, `p_pix_type`. Não há parâmetro de taxa; a taxa poderia ser lida de configuração dentro da função (ou parametrizada). O problema não é “falta de parâmetro HTTP” e sim **linha SQL incompleta** face ao DDL.

### Drift schema vs lógica

**Sim:** DDL (NOT NULL em `net_amount`) à frente ou desalinhado da RPC `solicitar_saque_pix_atomico` e do fallback JS.

---

## 5. Diagnóstico da autenticação / ambiente

### Uso de `JWT_SECRET`

- Emissão: `jwt.sign({ userId, email, username }, process.env.JWT_SECRET, { expiresIn: '24h' })` em login/registo (`server-fly.js`).  
- Validação: `jwt.verify(token, process.env.JWT_SECRET)` em `authenticateToken`.

### Token gerado “localmente” para testar Fly

Foi gerado JWT com o `JWT_SECRET` do **`.env` local** e enviado ao host **público** `goldeouro-backend-v2.fly.dev`. Resposta: **403** / token inválido.

### O `JWT_SECRET` local é o mesmo da produção?

**Não há como garantir igualdade** só a partir do repo: o Fly injeta secrets no runtime; o `.env` local não é fonte de verdade do deploy. **Assinatura inválida** é exatamente o sintoma de **segredo diferente** (ou token corrupto/truncado — menos provável se o mesmo código gerou o token).

### Fluxo incorreto?

Para **testes oficiais em produção**, o fluxo esperado é obter o token **do próprio servidor de produção** após `POST /api/auth/login` (ou registo) — não reutilizar um segredo local para “forjar” token. Forjar com secret local só é válido se o secret for **bit a bit** o mesmo do ambiente Fly.

### Drift local vs Fly

**Sim:** risco estrutural documentado em `INVENTARIO-ENV-V1.md`: `JWT_SECRET` deve ser consistente entre o processo que assina e o que verifica; ambientes diferentes sem sincronização explícita produzem exatamente o comportamento observado.

### Forma correta para próximos testes em produção

1. `POST https://goldeouro-backend-v2.fly.dev/api/auth/login` com credenciais válidas.  
2. Usar o `token` devolvido no header `Authorization: Bearer ...`.  
3. Opcional de diagnóstico: comparar `JWT_SECRET` no Fly (`fly secrets list` / painel) com o usado em qualquer geração manual de JWT — **sem** commitar valores.

---

## 6. Drift identificado

| Tipo | Manifestação |
|------|----------------|
| Código ↔ PostgreSQL (`chutes`) | Insert referencia `contador_global`; PostgREST não conhece a coluna. |
| RPC ↔ PostgreSQL (`saques`) | `solicitar_saque_pix_atomico` não preenche `net_amount`; coluna NOT NULL. |
| Fallback JS ↔ PostgreSQL (`saques`) | `dualWriteSaqueRow` sem `fee`/`net_amount` no chamador; mesma vulnerabilidade se RPC desligada. |
| `.env` local ↔ Fly secrets | JWT assinado localmente rejeitado na API pública → segredo ou ambiente não alinhados. |

---

## 7. Causa raiz principal por área

| Área | Causa raiz |
|------|------------|
| **Chute** | Tabela `chutes` (ou vista API) em produção **sem** coluna `contador_global` que o `server-fly.js` envia — drift de migração / schema. |
| **Saque** | `INSERT` da RPC (e o fallback) **omit** `net_amount` (e `fee`) enquanto o DDL exige `net_amount` NOT NULL — drift entre RPC/JS e constraints da tabela. |
| **Auth / ambiente** | Validação JWT na Fly com **segredo distinto** do usado na geração local do token de teste; fluxo de teste não passou pelo login na origem correta. |

---

## 8. Causa raiz consolidada

Não há um **bug algorítmico único** nos três blocos; há um **padrão de desalinhamento** entre **artefactos versionados** (Node + SQL de RPC) e o **estado efetivo** do ambiente alvo (colunas e constraints no Supabase + secrets no Fly). O runtime aplica o código atual; a base e os secrets não garantem o mesmo contrato.

---

## 9. Correções mínimas necessárias (sem implementar)

1. **Chutes:** migrar produção para incluir colunas do modelo V1 usado pelo insert (no mínimo `contador_global`; validar demais colunas e FK `lote_id` vs `lotes`).  
2. **Saque:** estender `solicitar_saque_pix_atomico` (e/ou DDL) para definir `fee` e `net_amount` de forma consistente com `PAGAMENTO_TAXA_SAQUE`, **ou** relaxar NOT NULL com default documentado (decisão de produto). Alinhar `dualWriteSaqueRow` no fallback aos mesmos valores.  
3. **Auth / testes:** para E2E em Fly, usar token de `login` em produção; alinhar `JWT_SECRET` Fly com política de rotação documentada.

---

## 10. Risco de regressão

- Alterar apenas o código para **remover** `contador_global` do insert **sem** migração pode “destravar” o insert mas **perde** rastreio global e pode quebrar relatórios/triggers que esperam a coluna.  
- Preencher `net_amount` na RPC com fórmula errata pode desviar relatórios ou worker de payout.  
- Mudar `JWT_SECRET` em Fly **invalida** todos os tokens em circulação — planejar janela e re-login.

---

## 11. Classificação final

- **PRONTO PARA PRÉ-EXECUÇÃO** — causas raiz são identificáveis com precisão a partir do código, da RPC versionada e dos erros observados; próximo passo é confirmar catálogo real em SQL read-only (opcional) e planear migração/RPC sob o pipeline já definido.

- ~~AINDA INCONCLUSIVO~~ — **não aplicável** para os três focos acima.

---

## 12. Conclusão objetiva

O **500** no chute vem de **schema drift** (`contador_global` ausente na API/BD). O **500** no saque vem de **RPC/insert incompleto** face a **`saques.net_amount` NOT NULL**. O **403** na Fly com JWT “caseiro” vem de **ambiente/segredo** não alinhado ao deploy ou de **fluxo de teste** que não usou login na API pública. A cirurgia pode prosseguir para pré-execução com plano de migração + ajuste de RPC/fallback + política de secrets e testes autenticados em produção.
