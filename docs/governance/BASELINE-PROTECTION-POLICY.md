# Política de Proteção da Baseline — Payment Engine™ V1

**Produto:** Indesconectável Payment Engine™  
**Versão:** V1 CERTIFICADA  
**Data:** 2026-07-01  
**Fase:** PE.PATRIMÔNIO.3

---

## 1. Objetivo

Garantir que a linha-base certificada da Payment Engine™ permaneça **imutável, rastreável e reproduzível**, separando patrimônio congelado de evolução futura.

---

## 2. Referências oficiais (imutáveis)

| Marco | Tag Git | Commit | Escopo |
|-------|---------|--------|--------|
| **V1 Certificada (documental)** | `payment-engine-v1-certified` | `eab1d74` | Docs 01–10, CHANGELOG, P2.0B |
| **Alias institucional** | `ipe-v1-certified` | `eab1d74` | Mesmo commit |
| **P2.2 Desacoplamento** | `payment-engine-p2.2` | `d188ca6` | `src/payment-engine/**`, delegação `server-fly.js` |
| **Snapshot pré-publicação** | `pe-patrimonio2a-pre-publish-20260701` | `d188ca6` | Rollback local de referência |

### Regra de ouro

Commits `eab1d74` e `d188ca6` **não devem ser alterados** (sem rebase, amend ou force push). Correções documentais posteriores ocorrem em commits **descendentes**, nunca reescrevendo histórico.

---

## 3. Core certificado em produção

| Camada | Path | Congelamento |
|--------|------|--------------|
| Core financeiro | `src/finance/**` | Certificado P1.9 — imutável sem gate PE.V1.x |
| Namespace PE | `src/payment-engine/**` | Introduzido em P2.2 (`d188ca6`) |
| Entry point | `server-fly.js` | Delegação P2.2; core preservado |

**Produção Fly:** `goldeouro-backend-v2` · release **v536+** (P1.8/P1.9).

---

## 4. Branch de patrimônio

| Campo | Valor |
|-------|-------|
| Branch | `chore/f2-4e-2-mp-log` |
| HEAD documental | Avança com commits `docs/**` e `chore(repo)` |
| Merge para `main` | Requer gate explícito PE — fora do escopo patrimonial automático |

### Recomendações de proteção GitHub

1. **Tags `payment-engine-*` e `ipe-v1-*`:** somente maintainers; proibir force-push em tags publicadas.
2. **Branch `chore/f2-4e-2-mp-log`:** exigir PR para alterações em `src/finance/**` e `src/payment-engine/**`.
3. **Commits documentais:** permitidos diretamente na branch de patrimônio após revisão de ausência de secrets.
4. **Force push:** **proibido** em branch e tags PE.

---

## 5. Separação patrimônio × evolução

| Tipo de alteração | Onde | Gate |
|-------------------|------|------|
| Documentação, relatórios, data room | `docs/**` | PE.PATRIMÔNIO.x |
| `.gitignore` protetivo | raiz | PE.PATRIMÔNIO.x |
| Scripts read-only / certificação | `scripts/p19*`, `scripts/verify-*` | Revisão secrets |
| Código Engine / Core | `src/finance/**`, `src/payment-engine/**` | **PE.V1.2+** — gate separado |
| WIP local | working tree | **Nunca** misturar com patrimônio |

---

## 6. Verificação de integridade

```bash
# Tags apontam para commits corretos
git rev-list -n 1 payment-engine-v1-certified   # → eab1d74
git rev-list -n 1 payment-engine-p2.2            # → d188ca6

# Core não alterado desde baseline P2.2
git diff d188ca6 -- src/finance/

# Clone reproduz patrimônio
git clone <repo> && git checkout payment-engine-v1-certified
```

---

## 7. Rollback

| Cenário | Ação |
|---------|------|
| Documentação incorreta | Novo commit `docs:` corretivo — sem amend em tags |
| Contaminação acidental de código | `git revert` do commit — preservar histórico |
| Perda local | `git fetch` + checkout tag oficial |

---

## 8. Responsabilidade institucional

A baseline V1 é patrimônio da **Indesconectável™**. Qualquer evolução funcional (PE.V1.2+) deve partir de tag oficial, nunca de working tree com WIP não certificado.

---

*Política estabelecida em PE.PATRIMÔNIO.3 — 2026-07-01*
