# RELATÓRIO FINAL — RELEASE AUDIT PIX (READ-ONLY)

**Data:** 2026-02-05
**Sistema:** Gol de Ouro · Produção real
**Modo:** MAX SAFETY · READ-ONLY ABSOLUTO

---

## 1. Regras de segurança aplicadas

- **Proibido:** INSERT/UPDATE/DELETE/UPSERT/RPC, triggers, migrations, deploy, reenviar webhooks, criar PIX, solicitar saque, rodar worker, chamar rollback, chamar endpoints POST.
- **Permitido:** Leitura de arquivos, SELECT via Supabase, GET no Mercado Pago para consulta, geração de scripts e relatórios, backup local.
- **Segredos:** Tokens/URLs não impressos; variáveis logadas como PRESENTE/AUSENTE e valores mascarados.

---

## 2. Evidências empíricas (fontes)

- Depósitos: JSON gerado por `release-audit-pix-depositos-readonly.js`
- Saques: JSON gerado por `release-audit-pix-saques-readonly.js`

### 2.1 Depósitos PIX

| status | count |
|--------|-------|
| expired | 258 |
| pending | 34 |
| approved | 22 |

- payment_id duplicado em approved: 0
- external_id com >1 approved: 0
- Pendings total: 34 (0-1d: 2, 2-7d: 2, 8-30d: 21, 31+d: 9)
- Valores nulos: 0, <=0: 0, >10000: 0

### 2.2 Saques PIX

| status | count |
|--------|-------|
| cancelado | 2 |

- Saldos negativos: 0
- Lastro (saques_confirmados > pix_approved): 0 (OK)

---

## 3. Classificação por área

| Área | Classificação |
|------|----------------|
| Depósitos | 🟢 |
| Saques | 🟢 |
| Lastro | 🟢 |
| Pendings antigos | 🟡 |

---

## 4. Gates de lançamento

| Gate | Condição | Resultado |
|------|----------|----------|
| GATE 1 | payment_id duplicado em approved = 0 | ✅ 0 |
| GATE 2 | external_id com >1 approved = 0 | ✅ 0 |
| GATE 3 | usuarios.saldo < 0 = 0 | ✅ 0 |
| GATE 4 | saques_confirmados > pix_approved = 0 | ✅ 0 |
| GATE 5 | Valores inválidos (nulos/<=0) em dados = 0 | ✅ 0 |

---

## 5. Veredito final

**GO COM RESSALVAS**

- **GO:** Todos os gates passaram e classificações 🟢.
- **GO COM RESSALVAS:** Gates 1–4 passaram; pode haver 🟡 (pendings, qualidade) ou GATE 5 com valor inválido.
- **NO-GO:** Algum gate 1–4 falhou (duplicidade approved, saldo negativo, lastro).

Nenhuma correção sugerida; apenas fatos e veredito.

---

## 6. Backup do banco (FASE 5 — opcional)

Backup via pg_dump não foi executado nesta rodada (verificação de ferramenta/credencial não obrigatória). Caso DATABASE_URL ou POSTGRES_URL esteja configurado e pg_dump disponível no ambiente, pode ser executado manualmente com flags --no-owner --no-privileges para as tabelas: usuarios, pagamentos_pix, saques, ledger_financeiro, transacoes. Sem expor credenciais.
