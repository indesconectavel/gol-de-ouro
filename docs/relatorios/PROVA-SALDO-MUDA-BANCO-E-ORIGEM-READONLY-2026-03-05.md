# Prova — Saldo muda no banco? + Origem (READ-ONLY)

**Data:** 2026-03-05  
**Modo:** READ-ONLY absoluto (sem alterar código, commit, deploy, env de produção, migrações, PIX/saques reais ou webhooks).  
**Objetivo:** (1) Provar se o saldo muda no banco (persistido) sem JWT; (2) Se mudar, apontar a origem mais provável por evidência em tabelas e logs.

---

## PASSO A — Script “monitor de saldo” (polling no banco)

**Arquivo:** `scripts/prova-monitor-saldo-usuarios-readonly.js`

- Usa Supabase com SERVICE_ROLE (não imprime URL/KEY).
- **USER_ID:** `PROVA_USER_ID` ou descobre automaticamente o usuário com maior |saldo_atual − soma_pix_approved| (top_diferencas).
- Monitora por **3 minutos:** coleta `saldo` e `updated_at` a cada **10 s** (18 amostras).
- Salva JSON em `docs/relatorios/prova-monitor-saldo-output-YYYY-MM-DD.json`.
- Define: `SALDO_MUDOU`, `delta_total`, `timestamps_mudanca`.

**Execução (2026-03-05):**

- Comando: `node scripts/prova-monitor-saldo-usuarios-readonly.js`
- Saída: `docs/relatorios/prova-monitor-saldo-output-2026-03-05.json`

**Resultado:**

| Campo | Valor |
|-------|--------|
| user_id | 78fc62e7-334e-453f-ae8a-66047d765aec |
| num_amostras | 18 |
| primeiro_saldo | 1000 |
| ultimo_saldo | 1000 |
| delta_total | 0 |
| **SALDO_MUDOU** | **false** |
| timestamps_mudanca | [] |
| updated_at (todas as amostras) | 2025-11-08T16:49:23.833118+00:00 (inalterado) |

**Conclusão passo A:** No período de 3 minutos o saldo **não** mudou no banco (18 leituras iguais; `updated_at` do usuário também inalterado).

---

## PASSO B — Script “composição do saldo” (auditoria por tabelas)

**Arquivo:** `scripts/prova-composicao-saldo-readonly.js`

- **USER_ID:** `PROVA_USER_ID` ou mesmo critério do monitor (maior diferença).
- **Janela:** 30 dias (configurável por `PROVA_JANELA_DIAS`).
- Componentes: depósitos aprovados (pagamentos_pix), saques (concluídos + pendentes), prêmios (chutes, transacoes, ledger), ajustes/outros no ledger.
- Saída: `docs/relatorios/prova-composicao-saldo-output-YYYY-MM-DD.json`.

**Execução (2026-03-05):**

- Saída: `docs/relatorios/prova-composicao-saldo-output-2026-03-05.json`

**Tabela saldo_atual vs soma_componentes (mesmo user_id do monitor):**

| Componente | Valor |
|------------|--------|
| depositos_aprovados | 0 |
| saques_concluidos | 0 |
| saques_pendentes | 0 |
| premios_jogo_chutes | 0 |
| premios_transacoes | 0 |
| premios_ledger | 0 |
| ajustes_ledger | 0 |
| outros_ledger | 0 |
| **soma_componentes** | **0** |
| **saldo_atual** | **1000** |
| **GAP** | **1000** |

**Hipóteses para GAP grande:** Saldo inicial ou créditos anteriores fora da janela de 30 dias; tabela/rota não auditada; ajustes manuais ou migrações; múltiplas fontes de verdade.

---

## PASSO C — Ledger (janelas 24 h e 7 dias)

Reexecução do script `prova-origem-creditos-ledger-readonly.js`:

- **24 h:** `PROVA_LEDGER_JANELA_HORAS=24` → saída em `docs/relatorios/prova-ledger-24h-2026-03-05.json`
- **168 h (7 dias):** `PROVA_LEDGER_JANELA_HORAS=168` → saída em `docs/relatorios/prova-ledger-168h-2026-03-05.json`

**Resultado (ambas as janelas):**

- `coluna_uid`: user_id (tabela existe).
- `por_usuario`: [] (vazio).
- `top_tipos_credito_global`, `top_referencias_global`, `eventos_suspeitos`: vazios.
- **Conclusão:** Nenhum registro em `ledger_financeiro` nas últimas 24 h nem nos últimos 7 dias no ambiente consultado.

---

## PASSO D — Logs Fly (read-only)

**Comando:** `flyctl logs -a goldeouro-backend-v2 --no-tail` (janela de ~60 min antes da execução).

**Padrões buscados e trechos relevantes:**

| Padrão | Encontrado? | Trecho |
|--------|-------------|--------|
| "Saldo inicial" | Não | — |
| reconcilePendingPayments / [RECON] | Sim | `❌ [RECON] ID de pagamento inválido (não é número): deposito_4ddf8330-ae94-4e92-a010-bdc7fa254ad5_1765383727057` (repetido a cada ~30 s) |
| GOL / premio / creditou / saldo | Não | — |
| update usuarios | Não | — |
| [PAYOUT][WORKER] | Sim | `🟦 [PAYOUT][WORKER] Início do ciclo`, `Nenhum saque pendente`, `Resumo { payouts_sucesso: 0, payouts_falha: 5 }`, `Fim do ciclo` |

**Interpretação:** O reconciler roda periodicamente mas **não** credita neste caso: rejeita o pagamento por “ID de pagamento inválido (não é número)” (external_id em formato string/UUID). Nenhum log de crédito de saldo, GOL ou “update usuarios” na amostra.

---

## PASSO E — Conclusões

### 1) O saldo muda no banco?

**NÃO** — Na execução desta prova, em 3 minutos de polling direto na tabela `usuarios` (18 amostras a cada 10 s), o saldo permaneceu **1000** e o campo `updated_at` do usuário **não** mudou. Não foi observada alteração persistida de saldo no banco no período.

*(Se em outro momento o usuário viu o saldo “subir sozinho”, pode ter sido: cache/estado no front; outro usuário/ambiente; ou mudança em janela de tempo não coberta por este monitor.)*

### 2) Quando muda, qual é a origem mais provável (por tabela/log)?

**N/A** — Como não foi observada mudança de saldo nesta sessão, não há evidência de “origem do aumento” nos dados coletados. Em geral, as origens possíveis são: **PIX (webhook/reconcile)**, **prêmio de jogo** (chutes/transacoes/ledger), **ajuste/admin**. Os logs mostram que o **reconcile não está creditando** para pelo menos um pagamento pendente (ID inválido).

### 3) O ledger está realmente sendo usado?

**Inesperado** — A tabela `ledger_financeiro` existe e tem a coluna `user_id`, mas nas janelas de **24 h** e **7 dias** não há **nenhum** registro. Isso indica uma de duas situações: (a) o ambiente Supabase usado pelos scripts não é o mesmo que o backend em produção usa ao escrever no ledger, ou (b) em produção o ledger ainda não está sendo escrito (ou está escrito em outra tabela/banco). Ou seja: **não é possível afirmar que o ledger está em uso ativo** com base apenas nestas consultas.

### 4) Próximo passo cirúrgico recomendado (sem implementar aqui)

1. **Confirmar ambiente:** Garantir que os scripts read-only (e o `.env` local) apontam para o **mesmo** Supabase que o backend em produção (goldeouro-backend-v2).
2. **Repetir o monitor** com o usuário que relatou “saldo aumentando” (definir `PROVA_USER_ID` e rodar o monitor em horário de uso); se o saldo mudar, inspecionar `timestamps_mudanca` e cruzar com logs no mesmo minuto.
3. **Ledger:** Se em produção o backend realmente escreve em `ledger_financeiro`, rodar o script de ledger em produção (com SERVICE_ROLE do prod) com janela de 7 dias; se continuar vazio, auditar no código onde são feitos os `insert` no ledger (webhook PIX, saque, fim de jogo) e se há erro silencioso ou outro destino.
4. **Reconciler:** Corrigir o tratamento do “ID de pagamento inválido” (ex.: aceitar external_id não numérico ou mapear para payment_id do MP) para que pagamentos pendentes válidos não fiquem sem crédito — sem alterar regra de negócio, apenas garantir que um approved no MP seja creditado uma única vez.
5. **Composição do saldo:** Se o GAP continuar alto para usuários com movimento, incluir na auditoria outras tabelas/rotas que atualizam `usuarios.saldo` (ex.: bônus, campanhas, ajustes manuais) e documentar no script de composição.

---

## Anexos — Arquivos gerados

| Arquivo | Descrição |
|---------|-----------|
| `scripts/prova-monitor-saldo-usuarios-readonly.js` | Monitor de saldo (3 min, 10 s) |
| `scripts/prova-composicao-saldo-readonly.js` | Composição por tabelas (30 dias) |
| `docs/relatorios/prova-monitor-saldo-output-2026-03-05.json` | Saída do monitor |
| `docs/relatorios/prova-composicao-saldo-output-2026-03-05.json` | Saída da composição |
| `docs/relatorios/prova-ledger-24h-2026-03-05.json` | Ledger 24 h |
| `docs/relatorios/prova-ledger-168h-2026-03-05.json` | Ledger 7 dias |

**Reprodução:**

```bash
# Monitor (3 min)
node scripts/prova-monitor-saldo-usuarios-readonly.js

# Composição (30 dias; opcional PROVA_USER_ID=uuid)
node scripts/prova-composicao-saldo-readonly.js

# Ledger 24 h / 7 dias
PROVA_LEDGER_JANELA_HORAS=24 node scripts/prova-origem-creditos-ledger-readonly.js
PROVA_LEDGER_JANELA_HORAS=168 node scripts/prova-origem-creditos-ledger-readonly.js
```
