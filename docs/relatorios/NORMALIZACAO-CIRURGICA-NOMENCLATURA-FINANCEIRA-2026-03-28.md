# NORMALIZAÇÃO CIRÚRGICA — NOMENCLATURA FINANCEIRA

**Modo:** read-only (estratégia apenas; sem alterações de código ou DDL).  
**Fonte da verdade do schema real:** snapshot de produção em `docs/relatorios/auditoria-schema-prod-2026-03-05.json` (colunas inferidas por `select('*').limit(1)` com credenciais reais em 2026-03-05). **Recomendação operacional:** repetir `scripts/prova-schema-prod-readonly.js` antes de qualquer deploy de normalização para confirmar que nada mudou no catálogo.

---

## 1. Resumo executivo

Em produção, **`pagamentos_pix`** e **`saques`** já expõem **pares de colunas** com o mesmo significado (PT vs EN): `valor` / `amount`; `chave_pix` / `pix_key`; `tipo_chave` / `pix_type`. A FK do utilizador permanece como **`usuario_id`** (não existe `user_id` nestas tabelas no snapshot). Há ainda colunas **só em inglês** usadas pelo ecossistema de payout/auditoria: **`correlation_id`**, **`fee`**, **`net_amount`**, além de **`payment_id`** e **`external_id`** em depósitos.

A estratégia **mínima e segura** é: **definir um conjunto canónico em inglês para significado de negócio**, manter **escrita duplicada (dual write)** nas colunas PT enquanto consumidores existirem, **leitura preferente em inglês com *fallback* PT**, **sem renomear colunas** até inventário de consistência e revalidação. O trigger documentado `saques_sync_valor_amount` (ficheiro `database/corrigir-supabase-security-warnings.sql`) **só copia `valor` → `amount`** em `INSERT`/`UPDATE`; **não** cobre `pix_key`/`chave_pix` nem `pagamentos_pix`.

---

## 2. Colunas canónicas definitivas — pagamentos_pix

Definição **definitiva (alvo semântico em inglês)** — nomes físicos **atuais** em produção entre parênteses quando ainda não forem renomeados:

| Conceito canónico | Coluna física (produção 2026-03-05) | Notas |
|-------------------|--------------------------------------|--------|
| Identificador interno | `id` | UUID no snapshot. |
| Utilizador (FK) | `usuario_id` | **Alvo inglês futuro:** `user_id` *apenas* após migração DDL + RLS; até lá, **canónico de facto = `usuario_id`**. |
| ID do pagamento Mercado Pago | `payment_id` | Usado pelo webhook/reconcile (`creditarPixAprovadoUnicoMpPaymentId` também consulta `external_id`). |
| ID externo / correlação armazenada | `external_id` | No código atual coincide com o ID MP; manter **coerente** com `payment_id`. |
| Valor monetário (depósito) | **`amount`** | Canónico para leitura/cálculo na app; tipo decimal. |
| Estado do fluxo | `status` | Valores **em inglês** no fluxo validado de PIX: `pending`, `approved`, etc. (`server-fly.js`). |
| Metadados de apresentação | `qr_code`, `qr_code_base64`, `pix_copy_paste` | Já em inglês / neutros. |
| Auditoria temporal | `created_at`, `updated_at`, `expires_at`, `approved_at` | `approved_at` presente no snapshot; uso opcional face a `status`. |
| Opcional integração | `transacao_id` | Presente no snapshot; alinhar uso com reconciliações, se aplicável. |

**`valor` (PT):** existe em paralelo a `amount` no snapshot — tratar como **legado espelhado** até remoção; não escolher como canónico definitivo.

---

## 3. Colunas canónicas definitivas — saques

| Conceito canónico | Coluna física (produção 2026-03-05) | Notas |
|-------------------|--------------------------------------|--------|
| Identificador interno | `id` | |
| Utilizador (FK) | `usuario_id` | Mesma regra que em PIX: canónico de facto PT até migração para `user_id`. |
| Valor bruto solicitado (débito) | **`amount`** | Alinhado ao worker/scripts que selecionam `amount` e `valor`. |
| Chave PIX | **`pix_key`** | |
| Tipo de chave | **`pix_type`** | Valores devem seguir o contrato do validador (ex.: `cpf`, `email`, …). |
| Taxa | **`fee`** | Preencher quando a política de taxa for aplicada de forma persistente; hoje o POST em `server-fly.js` calcula taxa só de forma informativa. |
| Valor líquido | **`net_amount`** | `amount - fee` (ou regra de negócio explícita); evitar NULL sem regra em relatórios. |
| Idempotência / rastreio worker | **`correlation_id`** | Não duplicar semântica de `transacao_id`: `correlation_id` = id interno do fluxo ledger/worker; `transacao_id` = id do provedor quando existir. |
| Estado operacional | `status` | No snapshot é string livre; **fluxo validado** usa **`pendente`** / transições worker (documentação histórica). **Alvo inglês** (`pending`, `processing`, …) só com migração de dados + CHECK. |
| Integração MP / tempo | `transacao_id`, `processed_at` | Canónicos para operação e auditoria de payout. |
| Rejeição | `motivo_rejeicao` | PT no nome; aceitável como coluna estável; renomear é baixa prioridade. |

**`valor`, `chave_pix`, `tipo_chave`:** legado; manter em **dual write** durante a transição.

---

## 4. Colunas legadas temporárias

**pagamentos_pix**

- **`valor`** — espelho de `amount`; último a remover depois de garantir que nenhum relatório/RLS/cliente antigo lê só `valor`.
- **`usuario_id`** — “legado” **só** no sentido de nomenclatura PT; na prática é a **FK estável** até existir `user_id` migrado.

**saques**

- **`valor`** — espelho de `amount`.
- **`chave_pix`**, **`tipo_chave`** — espelhos de `pix_key`, `pix_type`.
- **`usuario_id`** — idem PIX.

**Remoção em último lugar (após revalidação):** colunas PT duplicadas (`valor`, `chave_pix`, `tipo_chave`). **Nunca** remover antes de: (1) dual read na app apontar só para EN; (2) scripts SQL/dashboards atualizados; (3) uma janela sem erros de consistência.

---

## 5. Estratégia de transição sem quebra

1. **Dual write (recomendado, já alinhado ao POST saque em `server-fly.js`):** em cada `INSERT`/`UPDATE` relevante, preencher **sempre** o par **EN + PT** com o **mesmo valor** (`amount` = `valor`, `pix_key` = `chave_pix`, `pix_type` = `tipo_chave`). Em **pagamentos_pix**, o código já grava `amount` e `valor` na criação; manter essa regra em todos os caminhos.

2. **Dual read (leitura):** ao interpretar registos antigos ou ferramentas externas, usar **`amount ?? valor`**, **`pix_key ?? chave_pix`**, **`pix_type ?? tipo_chave`**. Para resolução de pagamento MP: **`payment_id` primeiro, `external_id` como fallback** (como em `creditarPixAprovadoUnicoMpPaymentId`).

3. **Write-only canónico sem remover PT:** **não** como primeira fase — reduz risco de quebrar políticas RLS, views ou jobs que ainda referenciem colunas PT. A ordem segura é **dual write + dual read**, depois desativar leituras PT na app, só então DDL de drop/rename.

4. **Triggers:** existe **`saques_sync_valor_amount`** (copia `valor` → `amount`). **Não assumir** que cobre todos os caminhos: reforçar **na aplicação** o espelhamento bidirecional ou estender trigger de forma controlada (teste em staging). **pagamentos_pix** não tem trigger equivalente no mesmo ficheiro — consistência **amount/valor** depende do código.

5. **Views:** opcional; útil para relatórios (`v_saques_canonical`, `v_pagamentos_pix_canonical`) expondo colunas EN + uma coluna `legacy_ok`. **Não obrigatório** para o patch mínimo.

6. **`correlation_id`, `fee`, `net_amount`:**  
   - **`correlation_id`:** gerar no **primeiro** evento que abre o ciclo de payout (worker), formato estável (ex. UUID); **nunca** reutilizar como `transacao_id`.  
   - **`fee` / `net_amount`:** persistir quando a taxa for oficial; até lá, permitir NULL mas **documentar** que relatórios devem usar `amount` e taxa de env se NULL.

7. **Status PT vs EN:** **não normalizar valores de `status` em saques** por rename rápido: o CHECK em alguns schemas SQL (`pendente`, `processando`, …) diverge de respostas API em inglês (`pending` no JSON de sucesso do withdraw). Manter **mapeamento explícito** na camada API até migração de dados.

---

## 6. Estratégia de backfill / saneamento

1. **Inventário:** queries que comparem `amount` vs `valor` e `pix_key` vs `chave_pix` em `saques`; `amount` vs `valor` em `pagamentos_pix`; contar NULLs em `fee`, `net_amount`, `correlation_id` onde o worker espera preenchido.

2. **Backfill seguro:**  
   - Onde `amount IS NULL` e `valor` preenchido → `amount = valor`.  
   - Onde `valor IS NULL` e `amount` preenchido → `valor = amount`.  
   - Idem para chaves PIX PT/EN.  
   Executar em **batch** com `WHERE` para linhas afetadas apenas.

3. **`payment_id` vs `external_id` em pagamentos_pix:** onde divergirem, alinhar à **fonte Mercado Pago** (`payment.id` como string) antes de endurecer UNIQUE.

4. **Revalidação:** após backfill, repetir snapshot (`auditoria-schema-prod-*.json`) e um relatório de consistência (zero linhas com divergência PT/EN nos pares definidos).

---

## 7. Ordem segura de implementação

1. Refrescar snapshot de schema em produção (script existente).  
2. Implementar **helpers** de leitura/escrita canónica (dual read / dual write) **só na camada de acesso a dados** (sem renomear tabelas).  
3. Backfill de NULLs e divergências PT/EN.  
4. Atualizar **scripts de auditoria** (`scripts/financeiro-v1-final-validacao-readonly.js`, `payout-rejeitados-rootcause-readonly.js`, etc.) para usar prioridade EN com fallback PT.  
5. Monitorizar uma versão; **só então** planejar DDL (drop colunas PT ou rename `usuario_id` → `user_id` com políticas RLS).  
6. **Último passo:** remoção de colunas legadas PT duplicadas.

---

## 8. Arquivos que precisarão mudar

| Área | Ficheiros (previstos) |
|------|-------------------------|
| API principal | `server-fly.js` (INSERT/SELECT PIX e saque; respostas API — mapeamento de `status`). |
| Serviços PIX legados (se ainda usados nalgum processo) | `services/pix-service-real.js`, `services/pix-mercado-pago.js`, `controllers/paymentController.js` (se existir insert alternativo em `saques`). |
| Scripts read-only / auditoria | `scripts/financeiro-v1-final-validacao-readonly.js`, `scripts/payout-rejeitados-rootcause-readonly.js`, `scripts/payout-v1_1-financial-snapshot-readonly.js`, `scripts/prova-schema-prod-readonly.js` (documentação do relatório). |
| DDL opcional / triggers | `database/corrigir-supabase-security-warnings.sql` (extensão de triggers de sync), novas migrações Supabase **após** acordo sobre drop. |
| RLS | `VALIDACAO-RLS-SUPABASE-FINAL-v1.2.0.sql` / políticas que referenciem nomes de colunas, **se** houver rename. |
| Frontend | Onde exibir status ou campos crus da API — alinhar labels sem depender de nomes de colunas SQL. |

---

## 9. Veredito final

**EXIGE SANEAMENTO PRÉVIO**

**Motivo:** o snapshot real prova **duplicidade de colunas** sem invariante automática completa (trigger só `valor`→`amount` em `saques`; **nada** equivalente garantido em `pagamentos_pix` para `amount`/`valor` nem para chaves PIX). **`fee`**, **`net_amount`** e **`correlation_id`** existem na tabela mas **não** são garantidos pelo fluxo mínimo de `server-fly.js` no insert atual — normalizar “só no código” sem backfill e queries de divergência **arrisca** relatórios e workers a lerem NULL ou valores PT desatualizados. Depois do saneamento (inventário + backfill + re-snapshot), o passo seguinte é **PRONTO PARA PATCH DE NORMALIZAÇÃO** na camada de aplicação (dual read/write centralizado).

---

*Fim do relatório.*
