# RELATÓRIO MISSÃO B2 — Verificação empírica em produção (READ-ONLY)

**Data:** 05/02/2026  
**Modo:** READ-ONLY — apenas SELECT; nenhum INSERT, UPDATE, DELETE, RPC, trigger ou side-effect.  
**Fonte dos dados:** Banco Supabase de produção (leitura via @supabase/supabase-js).  
**Script de execução:** `scripts/audit-b2-readonly.js` (somente leitura).

---

## 1. Resumo executivo

- As etapas 1 a 4 da Missão B2 foram executadas em produção com queries de leitura (lógica replicada via Supabase client; equivalente a SELECT).
- **Etapa 1 (duplicidade):** Retornou **1** caso — mesmo `external_id` com **2 registros** e **0 aprovados** (ambos `expired`). Não há evidência de double credit por esse caso.
- **Etapa 2 (base financeira):** PIX aprovados e totais por usuário obtidos; saques “confirmados” e prêmios em `transacoes` retornaram **0** linhas (em produção, saques existentes têm apenas status `cancelado`; não há registros com tipo `premio`/`ganho_jogo` em `transacoes` no corte verificado).
- **Etapa 3 (reconciliação):** Retornou **31** usuários com |saldo_atual − saldo_teórico| > 0,01. O saldo teórico foi calculado como PIX aprovados + prêmios (transacoes) − saques confirmados; prêmios e saques confirmados estão vazios, portanto a reconciliação está **incompleta** (falta histórico de jogo e saques processados). Parte das diferenças é explicável por saldo inicial e prêmios de jogo não registrados em `transacoes`.
- **Etapa 4 (impacto cruzado):** **0** saques confirmados sem lastro de PIX; **0** pares PIX aprovado + saque em janela de 5 segundos.
- **Conclusão empírica:** Não foi encontrada **evidência direta** de double credit (mesmo payment_id creditado duas vezes). Foi encontrada **duplicidade estrutural** (dois registros para o mesmo external_id, ambos não aprovados). Inconsistências de reconciliação (31 usuários com diferença) não podem ser atribuídas apenas a double credit, pois o modelo de saldo teórico está incompleto (sem prêmios em transacoes e sem saques processados na base consultada).

---

## 2. Queries que retornaram linhas

| Etapa | Query / lógica | Quantidade de registros | Magnitude / observação |
|-------|----------------|-------------------------|-------------------------|
| **1.1** | Duplicidade por external_id / payment_id | **1** grupo duplicado | 1 external_id com 2 linhas; **total_aprovados: 0** (ambos status `expired`). Dois `payment_id` distintos (135383019379 e 135998283966). |
| **2.1** | Total PIX aprovados por usuário | **8** usuários | Soma de valores aprovados por usuario_id; totais entre 1 e 69. |
| **3.1** | Reconciliação saldo real vs teórico | **31** usuários | Diferença ≠ 0 entre saldo_atual e (PIX + prêmios − saques). Prêmios e saques = 0 na base, então teórico = apenas PIX. Diferenças positivas (ex.: 50, 100) compatíveis com saldo inicial ou prêmios de jogo; uma diferença negativa relevante (usuário com pix 69 e saldo 29, diff −40). |
| **4.1** | Saques confirmados sem lastro de PIX | **0** | Nenhum saque em status considerado “confirmado” para usuário sem PIX aprovado. |
| **4.2** | PIX aprovado + saque em janela &lt; 5 s | **0** | Nenhum par (PIX aprovado, saque) no mesmo usuario_id com diferença temporal &lt; 5 s. |

---

## 3. Achados objetivos (sem dados sensíveis)

### 3.1 Etapa 1 — Duplicidade

- **external_id:** `deposito_3445582f-1eb6-4e4f-843d-b8f8905a71de_1764601609212`
  - **2 registros** em `pagamentos_pix`, mesmo external_id.
  - **payment_id** distintos: 135383019379 e 135998283966 (duas cobranças MP diferentes).
  - **status:** ambos `expired`; **nenhum** `approved`.
- **Padrão:** Duplicidade **estrutural** (mesmo external_reference usado em duas criações de pagamento). Não há crédito duplicado (0 aprovados).

### 3.2 Etapa 2 — Base financeira

- **PIX aprovados:** 8 usuários com pelo menos um PIX approved; totais e quantidades coerentes (ex.: 4 PIX aprovados somando 6 para um usuário — payment_ids distintos, valores 1+2+2+1).
- **Saques:** Em produção, os únicos saques presentes têm status `cancelado` (2 registros). Nenhum com status `confirmado`, `paid`, `success`, `processado` ou `concluido` no conjunto consultado. Por isso, “total saques confirmados” = 0 para todos.
- **Prêmios (transacoes):** Nenhum registro com `tipo IN ('premio','ganho_jogo')` retornado. Prêmios de jogo podem estar em outra tabela ou com outro tipo.

### 3.3 Etapa 3 — Reconciliação

- **31 usuários** com |saldo_atual − saldo_teórico| > 0,01.
- **Saldo teórico** usado: PIX aprovados + prêmios (transacoes) − saques confirmados; na prática, apenas PIX (prêmios e saques confirmados = 0).
- **Tipos de diferença:**
  - Saldo positivo com PIX = 0: compatível com **saldo inicial** (ex.: 50, 100) ou prêmios de jogo não em `transacoes`.
  - Saldo &gt; soma PIX (ex.: saldo 122, PIX 6, diff +116): pode ser prêmios de jogo ou saldo inicial; **não é possível** afirmar double credit só com esses dados.
  - Saldo &lt; soma PIX (ex.: saldo 29, PIX 69, diff −40): compatível com uso em jogos (débito já realizado).
- **Conclusão:** A reconciliação está **incompleta** (falta histórico de movimentação em transacoes e saques processados). As diferenças **não constituem**, por si só, prova de double credit.

### 3.4 Etapa 4 — Impacto cruzado

- **4.1:** Nenhum saque em status “confirmado” para usuário sem PIX aprovado.
- **4.2:** Nenhum par PIX aprovado + saque no mesmo usuário com diferença &lt; 5 s.

---

## 4. O que foi possível confirmar

- Existe **um** caso de **duplicidade estrutural** em `pagamentos_pix` (mesmo external_id, dois registros, dois payment_id). Nenhum deles está approved; **não há double credit** nesse caso.
- Para os PIX aprovados consultados, cada linha aprovada tem **payment_id** distinto; não foi observado mesmo payment_id com dois créditos no corte analisado.
- **Saques** em produção (no conjunto lido) têm apenas status `cancelado`; não há saques “confirmados”/“processados” na base, logo as verificações 2.2, 3.1 (saques) e 4.1 usam lista vazia.
- **Transacoes** não retornaram registros de tipo premio/ganho_jogo; o saldo teórico não inclui prêmios de jogo, por isso a reconciliação 3.1 é parcial.

---

## 5. O que NÃO foi possível confirmar

- Se em **todo** o histórico já houve algum payment_id creditado duas vezes (a verificação foi sobre o estado atual; não há tabela de “eventos processados” por payment_id para auditoria retroativa).
- Se os 31 usuários com “diferença” têm saldo explicado **somente** por PIX + prêmios + saques (falta histórico completo em transacoes e possivelmente outras fontes de saldo).
- Impacto cruzado depósito ↔ saque em cenários de **saques processados** (hoje não há saques processados no conjunto consultado).

---

## 6. Classificação final do risco (com base nos dados lidos)

- **🟢 Íntegro empiricamente:** Não aplicável — há duplicidade estrutural (1 caso) e 31 usuários com diferença na reconciliação incompleta.
- **🔴 Falha financeira confirmada:** Não aplicável — não foi encontrada evidência direta de mesmo payment_id creditado duas vezes nem de saque pago sem lastro.
- **🟡 Anomalias pontuais:** **Aplicável.**

**Classificação adotada:** **🟡 Anomalias pontuais.**

- **Double credit:** Sem evidência empírica de que **já ocorreu** em produção no estado verificado (único grupo duplicado tem 0 aprovados; PIX aprovados consultados têm payment_ids distintos). O risco de desenho (concorrência) permanece; a verificação não cobre todo o histórico nem eventos já descartados.
- **Inconsistência saldo vs histórico:** 31 usuários com diferença na fórmula PIX + prêmios − saques; modelo usado está incompleto (sem prêmios em transacoes e sem saques processados), portanto a diferença **não** é classificada como falha financeira confirmada.
- **Impacto cruzado:** Nenhum padrão suspeito nos critérios 4.1 e 4.2.

---

## 7. Regra final (conforme solicitado)

- **Se todas as queries críticas retornassem vazio:** Seria declarado que não há evidência empírica de double credit nem inconsistência financeira até o momento.
- **Situação real:** A etapa 1 retornou 1 caso (duplicidade estrutural, 0 aprovados); a etapa 3 retornou 31 linhas (diferença de reconciliação com modelo incompleto). Por isso **não** se declara “nenhuma evidência”; declara-se:
  - **Double credit:** Não há evidência empírica **direta** de que já ocorreu em produção (mesmo payment_id creditado duas vezes). Há **um** caso de duplicidade estrutural (mesmo external_id, dois registros) sem crédito duplicado.
  - **Inconsistência financeira:** Há 31 usuários com diferença entre saldo atual e saldo teórico (PIX + prêmios − saques); como prêmios e saques confirmados estão vazios na base consultada, a reconciliação é **incompleta** e as diferenças não são, por si só, prova de falha financeira.

Nenhuma ação corretiva foi proposta nesta missão. Nenhum comando que não seja de leitura foi executado.

---

*Relatório gerado a partir da execução de `scripts/audit-b2-readonly.js` em 05/02/2026. Dados lidos do ambiente Supabase configurado em .env (produção).*
