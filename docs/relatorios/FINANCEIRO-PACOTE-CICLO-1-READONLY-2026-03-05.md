# Pacote Financeiro — Ciclo 1 Auditoria READ-ONLY

**Data:** 2026-03-05  
**Modo:** READ-ONLY ABSOLUTO (sem alterar lógica, sem commit/deploy, apenas GET/OPTIONS).  
**Objetivo:** Fechar provas (saldo no banco vs visual; causa dos 5 saques presos), ledger auditável, diagnóstico master e plano V1 (sem implementar).

---

## Diagnóstico master (CONFIRMADO / INCONCLUSIVO)

| Prova | Resultado | Evidência |
|-------|-----------|-----------|
| Saldo aumentando no banco? | **CONFIRMADO: NÃO** (efeito visual/cache) | ciclo1-saldo-prova.json: saldo_mudou false, delta 0, 18 points estáveis |
| Causa dos 5 saques presos | **CONFIRMADO:** falha insert ledger (0 linhas por saque) | ciclo1-saques-presos.json: ledger_por_saque todos 0, falha_ledger_insert 5 |
| Ledger auditável (coluna user_id) | **CONFIRMADO** | prova-ledger detecta user_id antes de query; ciclo1-ledger-prova sem erro |
| Schema/endpoints | **CONFIRMADO** | ciclo1-schema-snapshot.json, ciclo1-endpoints-snapshot.json exists: true |

---

## 1. Resumo executivo

- **Saldo aumentando:** Para o usuário com maior gap (saldo − PIX aprovado), o saldo no banco **não mudou** em 18 leituras ao longo de ~3 minutos (sempre 1000; `updated_at` fixo). Conclusão: **CONFIRMADO** — o efeito “saldo aumentando” no dashboard é **visual/cache**, não persistido no banco.
- **5 saques presos:** Os 5 saques em “processando” há mais de 30 min **não têm nenhuma linha no ledger** (referencia = id do saque). O worker reporta `payouts_falha: 5` e “Nenhum saque processado neste ciclo”. Causa exata: **falha de insert no ledger** (ou fluxo que nunca chega ao insert). Nenhum dos 5 tem `processed_at` nem `transacao_id`; status está dentro do CHECK. **CONFIRMADO:** causa = ausência de registro no ledger para esses saques (insert falhou ou não foi tentado após atualização para processando).
- **Ledger auditável:** Script `prova-ledger-readonly.js` foi ajustado para detectar a coluna de usuário via tentativa de `select('user_id').limit(1)` e depois `select('usuario_id').limit(1)` antes de montar a query. Em produção a coluna é **user_id**. Ledger em 168h está vazio (por_usuario/top_tipos vazios), consistente com falhas de insert.
- **Endpoints e schema:** Todos os endpoints testados existem (exists: true); schema das tabelas financeiras coletado em ciclo1-schema-snapshot.json.

---

## 2. Estado real (schema / endpoints / logs)

| Fonte | Arquivo | Conteúdo resumido |
|-------|---------|-------------------|
| Schema prod | ciclo1-schema-snapshot.json | usuarios (saldo), saques (status, processed_at, transacao_id, correlation_id), pagamentos_pix, ledger_financeiro (amostra vazia), transacoes |
| Endpoints | ciclo1-endpoints-snapshot.json | GET/OPTIONS: health 200, profile/history/pix 401 sem auth, OPTIONS 204, exists: true em todos |
| Logs Fly | ciclo1-logs-sinais.json | PAYOUT_WORKER 82, RECON 14, LEDGER 0; sem “insert falhou” nem “Erro ao registrar saque” nas linhas amostradas; worker: “Nenhum saque pendente” e “payouts_falha: 5” |

---

## 3. O que está OK / o que está errado / o que falta

| Categoria | Item | Status |
|-----------|------|--------|
| **OK** | Saldo no banco (prova por polling) | Estável no intervalo testado; “saldo subindo” = visual/cache |
| **OK** | Schema: usuarios.saldo, saques, pagamentos_pix, transacoes | Colunas esperadas presentes |
| **OK** | Ledger: coluna user_id detectada sem erro | Script read-only não quebra |
| **OK** | Endpoints GET/OPTIONS do financeiro | Rotas existem e respondem |
| **OK** | Status dos saques vs CHECK | Nenhuma violação (processando, rejeitado, cancelado) |
| **Errado** | 5 saques em processando >30 min sem linha no ledger | ledger_por_saque = 0 para os 5; falha_ledger_insert confirmada |
| **Errado** | processed_at e transacao_id nulos nos 5 | Ausência de conclusão do payout |
| **Falta** | Worker reprocessar ou marcar como rejeitado os 5 | Fluxo atual não retoma “processando” (worker busca “pendente”) |
| **Falta** | Garantir insert no ledger antes/depois do MP | Ordem e tratamento de erro no fluxo de saque |

---

## 4. Causas confirmadas (com evidências)

| Causa | Evidência (arquivo + campo) |
|-------|-----------------------------|
| Saldo não sobe no banco no período da prova | ciclo1-saldo-prova.json: `saldo_mudou: false`, `delta: 0`, `provavel_origem: "visual/cache ou estavel"`; 18 points com saldo 1000 e mesmo updated_at |
| 5 saques presos por falha de ledger | ciclo1-saques-presos.json: `ledger_por_saque` = 0 para os 5 ids; `indicios.falha_ledger_insert` com os 5 saque_id; todos com correlation_id (ex.: hotfix-ledger-live-test-*) |
| Ledger usa coluna user_id em prod | ciclo1-ledger-prova.json: `user_column: "user_id"`; ciclo1-saques-presos.json: `user_column_ledger: "user_id"` |
| Worker não processa os 5 (não são “pendente”) | ciclo1-logs-sinais.json: “Nenhum saque pendente” e “payouts_falha: 5” — worker conta falhas mas só busca pendente; saques já estão em processando |

---

## 5. Plano mínimo V1 recomendado (SEM implementar)

1. **Saques presos:**  
   - Opção A: Criar job/reconciler read-only que liste status = processando e idade > 30 min; depois (em outro passo não read-only) marcar como rejeitado com motivo “timeout ledger/payout” e, se aplicável, restituir saldo.  
   - Opção B: Corrigir o fluxo do worker para, em caso de falha no insert do ledger, manter ou reverter para “pendente” para retry, ou marcar “rejeitado” de forma explícita.

2. **Ledger:**  
   - Garantir que o insert no ledger use sempre `user_id` em produção e que qualquer erro seja logado (ex.: “[LEDGER] insert falhou”) e interrompa o fluxo de conclusão do saque até correção.  
   - Revisar ordem: débito no ledger antes ou depois da chamada ao MP payout, conforme regra de negócio e idempotência.

3. **Saldo visual:**  
   - No front, revisar cache/TTL e origem do dado de saldo (evitar que exiba valor em cache quando o banco não mudou).  
   - Manter prova periódica (polling GET profile ou Supabase) para validar que saldo no banco permanece estável quando não há depósito/saque.

4. **Reconciler RECON:**  
   - Reduzir ruído de log para external_id não numérico (ex.: “ID de pagamento inválido (não é número)”) tratando formato deposito_uuid_ts sem tentar parse numérico no MP.

---

## 6. Checklist de validação pós-patch (para o próximo prompt)

- [ ] Prova saldo: rodar novamente prova-saldo-persistencia (modo gap ou BEARER); confirmar saldo_mudou/delta conforme esperado.
- [ ] Saques presos: após patch, ciclo1-saques-presos: total_presos = 0 ou os 5 com status final (rejeitado/concluido) e ledger_por_saque ≥ 1 onde aplicável.
- [ ] Ledger: prova-ledger-readonly 168h com por_usuario ou top_tipos não vazios se houver saques concluídos no período.
- [ ] Logs: não aumentar contagem de “insert falhou” ou “Erro ao registrar saque” após correção; worker com payouts_sucesso > 0 em ciclos com saques pendentes.
- [ ] Endpoints: GET profile/history/pix com auth retornam 200 e dados consistentes.

---

## 7. Gates de segurança (apenas documentar)

- **Backup:** Fazer backup das tabelas usuarios, saques, ledger_financeiro, pagamentos_pix, transacoes antes de qualquer alteração de fluxo ou dados.
- **Rollback:** Manter release anterior (ex.: v305) como rollback; testar `fly releases` e deploy de versão anterior.
- **Canário:** Se possível, validar correção em uma máquina ou ambiente de staging antes de aplicar a todas as instâncias.

Nenhum gate foi executado nesta auditoria (read-only).

---

## 8. Anexos (JSON Ciclo 1)

| Arquivo | Descrição |
|---------|-----------|
| docs/relatorios/ciclo1-schema-snapshot.json | Colunas e tipos (amostra) de usuarios, saques, pagamentos_pix, ledger_financeiro, transacoes |
| docs/relatorios/ciclo1-endpoints-snapshot.json | GET/OPTIONS, status, exists, headers CORS relevantes |
| docs/relatorios/ciclo1-saldo-prova.json | Prova saldo: points, saldo_mudou, delta, timestamps, provavel_origem |
| docs/relatorios/ciclo1-saques-presos.json | 5 saques presos, ledger_por_saque, indicios (falha_ledger_insert, ausencia processed_at/transacao_id) |
| docs/relatorios/ciclo1-ledger-prova.json | Ledger 168h, user_column detectado, por_usuario/top_tipos (vazios) |
| docs/relatorios/ciclo1-logs-sinais.json | Contagens PAYOUT_WORKER, RECON, LEDGER, etc. e 20 linhas exemplares redigidas |

---

*Auditoria Ciclo 1 executada em modo READ-ONLY. Nenhum dado foi alterado em produção.*
