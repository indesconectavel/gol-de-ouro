# F2.1 — Cirurgia financeira controlada (indicadores executivos)

**Data:** 2026-05-23 (implementação validada em 2026-05-25)  
**Veredito:** **PASS**

---

## 1. Escopo autorizado

Excluir contas técnicas E2E/homologação **somente** do indicador **Saldo Total** retornado por `GET /api/admin/dashboard/stats`.

**Proibido e não realizado:** alterar saldo, apagar usuários, PIX, ledger, saques, gameplay, banco de produção, regras financeiras, autenticação, APIs públicas, Engine ou frontend player.

---

## 2. Evidência de origem

Auditorias read-only concluídas:

| Relatório | Conclusão relevante |
|-----------|---------------------|
| H4.1A | Dashboard consome API real (`server-fly.js`) |
| H4.1B | Sem mocks; Volume Financeiro ≠ patrimônio |
| H4.1C | ~98,5% do saldo agregado em uma conta outlier |
| H4.1C.1 | Conta `85872488-9e4c-42df-8978-7f9ef9f5cb00` |
| H4.1C.2 | Padrão homologação (`validacao*`, `vale2e*`) |

Não existe coluna `is_test_user` / `is_internal` no schema `usuarios` em produção.

---

## 3. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `src/utils/technicalE2EAccount.js` | **Novo** — critério institucional de exclusão (read-only) |
| `server-fly.js` | Filtro em `saldo_total` no handler `/api/admin/dashboard/stats` |

---

## 4. Queries alteradas

Nenhuma query SQL no banco foi alterada.

**Antes:** `usuarios.select('saldo')` → `SUM(saldo)` de todas as linhas.

**Depois:** `usuarios.select('id, email, username, saldo')` → `SUM(saldo)` **excluindo** linhas onde `isTechnicalE2EAccount(row)` é verdadeiro.

Demais contagens do endpoint permanecem iguais:

- `total_users` — `COUNT(*)` em `usuarios` (sem filtro)
- `saques_pendentes` / `saques_total`
- `ledger_transacoes_total`
- `volume_financeiro_total`

---

## 5. Critério de exclusão

Função `isTechnicalE2EAccount` (`src/utils/technicalE2EAccount.js`):

1. **ID conhecido** (H4.1C.1): `85872488-9e4c-42df-8978-7f9ef9f5cb00`
2. **Email** (case-insensitive): contém `validacao` ou `e2e`
3. **Username** (case-insensitive): prefixo `vale2e`

Aplicado **apenas** na agregação `saldo_total` do dashboard admin.

---

## 6. Antes × depois (produção, leitura 2026-05-25)

| Métrica | Antes (bruto) | Depois (operacional) |
|---------|---------------|----------------------|
| **Saldo Total (dashboard)** | R$ 169.086,50 | R$ 2.482,50 |
| Usuários (`total_users`) | 467 | 467 |
| Contas classificadas técnicas | — | 21 (3 com saldo > 0) |

**Nota:** H4.1C estimava ~R$ 2.541 ao remover **apenas** o outlier principal (R$ 166.545). Com os três padrões institucionais, também saem contas de validação com saldo residual (R$ 30 + R$ 29), o que explica a diferença de ~R$ 59.

Contas técnicas com saldo > 0 identificadas:

| Email | Username | Saldo |
|-------|----------|-------|
| `validacao.pontaaponta.1775006321158@gmail.com` | `vale2e21159` | R$ 166.545,00 |
| `validacao.gameplay.pos.1775007275286@gmail.com` | `vgame75286` | R$ 30,00 |
| `revalidacao.gameplay.1775008067264@gmail.com` | `rgame67264` | R$ 29,00 |

---

## 7. Impacto operacional

- **Nenhum** na operação financeira, PIX, ledger, saques ou saldos persistidos.
- **Somente** a leitura executiva do card **Saldo Total** no painel administrativo.
- Listagens de usuários, auditorias e histórico **não** foram filtradas.

---

## 8. Validação

Script read-only (`.env` + Supabase service role):

```bash
node -e "const {isTechnicalE2EAccount}=require('./src/utils/technicalE2EAccount'); ..."
```

Resultado:

- `saldo_all`: 169086.5  
- `saldo_operacional`: 2482.5  
- `saldo_excluido`: 166604  
- `technical_count`: 21  
- `usuarios`: 467  

PIX, ledger e saques **não** são recalculados neste endpoint; permanecem inalterados por design.

---

## 9. Rollback

1. Remover `require('./src/utils/technicalE2EAccount')` de `server-fly.js`.
2. Restaurar `select('saldo')` e `reduce` sem filtro no handler `/api/admin/dashboard/stats`.
3. Opcional: apagar `src/utils/technicalE2EAccount.js`.
4. Redeploy do backend.

Sem migração de banco.

---

## 10. Veredito

**PASS** — Cirurgia mínima, reversível, alinhada às auditorias H4.1A–H4.1C.2. Corrige a leitura executiva do patrimônio agregado sem destruir evidências nem alterar dados financeiros da V1.
