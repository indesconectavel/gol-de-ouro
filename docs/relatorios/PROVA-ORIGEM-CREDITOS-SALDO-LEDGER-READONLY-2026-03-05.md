# Prova definitiva — Origem dos créditos de saldo (ledger, sem JWT) — READ-ONLY

**Data:** 2026-03-05  
**Modo:** READ-ONLY absoluto (sem alterar código, env, deploy, banco ou chamadas com efeito).  
**Objetivo:** Provar com dados do banco (ledger e tabelas relacionadas) se existe “saldo aumentando sozinho” e qual é a origem (tipo de lançamento) que causa isso.

---

## PASSO A — Script de auditoria de drift por usuário

**Arquivo criado:** `scripts/prova-origem-creditos-ledger-readonly.js`

### Requisitos atendidos

1. **Secrets:** Não imprime `SUPABASE_URL` nem `SERVICE_ROLE_KEY`.
2. **Janela:** Consulta os últimos X horas em `ledger_financeiro` (padrão 6 h, configurável via `PROVA_LEDGER_JANELA_HORAS`).
3. **Agregação por usuário:**
   - `total_creditos` (somatório de valores positivos)
   - `total_debitos` (somatório de valores negativos)
   - `top_tipos_credito` (ex.: deposito_pix, premio_gol, bonus, ajuste)
   - `top_referencias` (saqueId, paymentId, etc.)
4. **Saldo atual:** Lê `usuarios` (id, saldo) e compara com o delta do ledger na janela (`saldo_vs_ledger`).
5. **Eventos suspeitos:**
   - Muitos créditos pequenos em sequência (valor &lt; 50, intervalo &lt; 2 min)
   - Créditos repetidos com mesma referencia / mesmo correlation_id
   - Créditos sem referencia
6. **Saída:** JSON completo + uso do resultado neste relatório (resumo humano abaixo).
7. **Coluna de usuário no ledger:** Detecção automática: tenta `user_id` primeiro, fallback `usuario_id`; usa a que existir para não falhar entre ambientes (produção com `user_id`, local com `usuario_id`).

### Consultas utilizadas

- **ledger_financeiro:** `created_at`, coluna de usuário detectada (`user_id` ou `usuario_id`), `tipo`, `valor`, `referencia`, `correlation_id`.
- **usuarios:** `id`, `saldo`.

---

## PASSO B — Execução do script (read-only)

**Comando:** `node scripts/prova-origem-creditos-ledger-readonly.js`

**Saída capturada:** `docs/relatorios/prova-origem-creditos-ledger-output-2026-03-05.json`

**Resumo da execução (2026-03-05 ~20:13 UTC):**

| Campo | Valor |
|-------|--------|
| Janela | 6 h |
| Since | 2026-03-05T14:13:38Z |
| Coluna UID no ledger | `user_id` |
| por_usuario | [] (vazio) |
| top_tipos_credito_global | [] |
| top_referencias_global | [] |
| creditos_repetidos_mesma_referencia | [] |
| creditos_repetidos_mesmo_correlation_id | [] |
| creditos_sem_referencia | total: 0 |
| muitos_creditos_pequenos_sequencia | [] |
| saldo_vs_ledger | [] |
| erros | [] |

**Interpretação:** Na janela de **6 horas** não houve **nenhum** registro em `ledger_financeiro`. O ambiente conectado (Supabase via `.env`) possui a coluna `user_id` no ledger; a lista de lançamentos na janela está vazia.

---

## PASSO C — Conclusões

### 1) Há créditos recentes no ledger quando o usuário “apenas abre dashboard”?

**Resposta:** **Inconclusivo nesta execução.**

- Na janela de 6 h analisada **não há nenhum** lançamento no ledger; portanto não foi possível atribuir créditos ao ato de “apenas abrir dashboard”.
- Para provar ou refutar seria necessário:
  - **Opção A:** Aumentar a janela (ex.: 24 h ou 7 dias) com `PROVA_LEDGER_JANELA_HORAS=24` (ou 168) e rodar de novo; ou
  - **Opção B:** Reproduzir o cenário (usuário abre dashboard, aguardar alguns minutos) e rodar o script em seguida para ver se aparecem lançamentos novos nessa janela.

### 2) Qual o tipo responsável pela maior parte do aumento?

**Resposta:** **N/A** — Não houve créditos na janela analisada; não há tipo para ranquear.

### 3) Existe padrão de duplicidade (mesmo correlation_id / mesma referencia)?

**Resposta:** **Não na janela analisada.** As listas de eventos suspeitos (referencia repetida, correlation_id repetido, créditos sem referencia, sequências de créditos pequenos) estão vazias porque não há linhas no ledger na janela de 6 h.

### 4) Próximo passo recomendado

- **Correção cirúrgica:** Depende da **causa real** encontrada em uma execução com **dados presentes** no ledger.
- **Ações sugeridas agora:**
  1. Rodar o mesmo script com janela maior (ex. 24 h ou 7 dias) no ambiente onde o “saldo aumentando” foi observado (confirmar que `.env` aponta para esse Supabase).
  2. Se ainda assim o ledger estiver vazio, confirmar se nesse ambiente os créditos de saldo são escritos no ledger ou apenas em outra tabela (ex. `usuarios.saldo` ou transacoes).
  3. Quando houver lançamentos na janela, usar o JSON do script para:
     - identificar o **tipo** que mais contribui para créditos (`top_tipos_credito_global` e `por_usuario[].top_tipos_credito`);
     - checar duplicidade (`creditos_repetidos_mesma_referencia`, `creditos_repetidos_mesmo_correlation_id`);
     - checar créditos sem referencia e sequências de créditos pequenos.
  4. Com a causa identificada (ex.: tipo X sendo lançado em duplicidade, ou tipo Y disparado ao abrir dashboard), aplicar correção mínima no código que gera esse tipo de lançamento (idempotência, desligar crédito em determinado endpoint, etc.).

---

## Anexo — Script e saída

- **Script:** `scripts/prova-origem-creditos-ledger-readonly.js`
- **Saída JSON desta execução:** `docs/relatorios/prova-origem-creditos-ledger-output-2026-03-05.json`

**Reprodução com janela de 24 h:**

```bash
PROVA_LEDGER_JANELA_HORAS=24 node scripts/prova-origem-creditos-ledger-readonly.js
```
