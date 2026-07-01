# Escopo Proprietário — Indesconectável Payment Engine™

**Fase:** PE.BRAND.2  
**Licença:** `LICENSE-PAYMENT-ENGINE.md`  
**Data:** 2026-07-01

---

## Componentes cobertos pela licença proprietária

### Código certificado

| Path | Descrição |
|------|-----------|
| `src/finance/**` | Core financeiro certificado P1.9 |
| `src/payment-engine/**` | Fachada e adapters P2.2 |
| `src/workers/payout-worker.js` | Worker PIX OUT |
| `src/domain/payout/**` | Domínio saques |
| `server-fly.js` | Entry point (delegação PE — arquivo compartilhado; escopo PE = integração financeira documentada) |
| `routes/mpWebhook.js` | Webhook MP (quando usado pela Engine) |
| `routes/paymentRoutes.js` | Rotas pagamento PE |
| `database/patches/**` | Patches RPC/ledger certificados PE |

### Documentação canônica

| Path | Descrição |
|------|-----------|
| `docs/payment-engine/**` | Docs 01–12, posicionamento, manifestos |
| `CHANGELOG_PAYMENT_ENGINE.md` | Changelog do produto |
| `README-PAYMENT-ENGINE.md` | README institucional |

### Scripts certificados

| Path | Descrição |
|------|-----------|
| `scripts/p19-certification.cjs` | Runner P1.9 |
| `scripts/verify-*.mjs` | Verificação homologação PE |
| `scripts/certification/**` | Certificação operacional |
| `scripts/reliability/**` | Provas financeiras read-only |
| `scripts/operational/**` | Watchdogs PE (quando aplicável) |
| `scripts/governance/**` | Governança autônoma PE |
| `scripts/activation/**` | Activation gate |

### Patrimônio documental PE

| Path | Descrição |
|------|-----------|
| `docs/relatorios/PE-*` | Relatórios patrimoniais, valor, brand, backup, security |
| `docs/relatorios/P1.*`, `P2.*` | Homologação e productização |
| `docs/relatorios/F3-*`, `F4*` | Formação Engine |
| `docs/relatorios/GIT-AUDIT-PAYMENT-ENGINE*` | Auditoria timeline |
| `docs/data-room/DR-*` | Data room (pacote DD) |
| `docs/governance/BASELINE-PROTECTION-POLICY.md` | Política baseline |
| `docs/governance/COPYRIGHT-AND-LICENSE-POLICY.md` | Política dual-license |
| `docs/governance/DECLARACAO-CESAO-AUTORAL-INSTITUCIONAL.md` | Declaração autoral |
| `docs/governance/BRAND-AND-TRADEMARK-GUIDELINES.md` | Uso de marca |
| `docs/arquitetura/PAYMENT-ENGINE-V1.md` | ADR embutido |
| `docs/arquitetura/ADR-002-PRIMARY-PSP-ASAAS.md` | ADR PSP |
| `docs/certification/**` | Certificação V1 |

### Snapshots e backup patrimonial

| Path | Descrição |
|------|-----------|
| `docs/relatorios/snapshots/**` | Evidências curadas homologação |
| `backup/Indesconectavel-Payment-Engine-V1/**` | Backup PE.BACKUP.1 (local, gitignored) |

---

## Excluído do escopo proprietário PE (monorepo legado)

| Path | Nota |
|------|------|
| `goldeouro-player/**` | Frontend jogo |
| `goldeouro-admin/**` | Admin jogo |
| `database/shoot_apply*.sql` | Gameplay RPC |
| `controllers/**` (não financeiros) | Legado |
| Scripts com credenciais hardcoded | Excluídos de patrimônio |

---

## Referência cruzada

- Licença: `LICENSE-PAYMENT-ENGINE.md`
- Índice DD: `docs/data-room/INDICE-DUE-DILIGENCE.md`
- Backup: `docs/relatorios/PE-BACKUP-1-BACKUP-PATRIMONIAL.md`
