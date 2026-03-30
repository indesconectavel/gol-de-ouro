# Limpeza controlada de legado — “Fila” vs Lotes (BLOCO J)

**Data:** 2026-03-29  
**Âmbito:** painel admin (`goldeouro-backend/goldeouro-admin`), documentação associada, comentários semânticos em `routes/adminApiFly.js`.  
**Fora de âmbito:** player, engine, contratos quebrados, remoção de `GET /api/admin/fila`.

---

## 1. Objetivo

Reduzir confusão com o conceito antigo de **“fila de jogadores”**, alinhando linguagem e ficheiros ao modelo real (**lotes em memória** + contador global), **sem** alterar comportamento da API nem quebrar integrações existentes.

---

## 2. Código admin — o que foi feito

| Ação | Detalhe |
|------|---------|
| **Mover para `src/legacy/`** | `FilaResponsive.jsx`, `ControleFila.jsx`, `GameResponsive.jsx`, `Navigation.jsx` |
| **Stub** | `src/legacy/pages/Game.jsx` reexporta `pages/Games.jsx` para resolver import quebrado do legado |
| **Imports** | Caminhos relativos atualizados (`../../...`); `FilaResponsive` (desktop) importa `../../pages/Lotes` |
| **Navigation legado** | Item “Fila de Chute” → **“Lotes (snapshot)”**, path **`/lotes`** (em vez de `/metricas/fila`) |
| **README** | `goldeouro-admin/src/legacy/README.md` descreve o que é oficial vs arquivo |
| **AppRoutes** | Comentário junto ao redirect `/fila` → `/lotes` |

**Malha oficial inalterada:** `AppRoutes.jsx` continua a usar `Lotes` em `/lotes`; redirect `/fila` mantido.

**Pastas `BACKUP-*` dentro do admin:** não foram tocadas (cópias históricas).

---

## 3. Backend — apenas semântica (comentários)

Ficheiro: `routes/adminApiFly.js`

- **`buildAdminLotesSnapshotPayload`:** documenta que **`totalNaFila` = `lotesAtivosCount`** e que `/fila` e `/lotes` são o mesmo payload.
- **`GET /api/admin/fila`:** comentário de alias histórico (“fila” = contagem de lotes ativos).
- **`GET /api/admin/stats`:** comentário junto a **`queueLength`** — **queueLength = lotesAtivosCount** (compat. JSON; mesmo significado que `totalNaFila` no snapshot).

**Nenhuma alteração** à lógica de resposta, status codes ou shape JSON.

---

## 4. Documentação atualizada

| Documento | Alteração |
|-----------|-----------|
| `docs/relatorios/SMOKE-TEST-BLOCO-J-PAINEL-DE-CONTROLE-2026-03-28.md` | Tabela: rota oficial `/lotes`; `/fila` como redirect |
| `docs/BLOCO-J-VALIDACAO-FINAL.md` | Linha da tabela: Lotes + alias API |
| `docs/relatorios/VALIDACAO-FINAL-BLOCO-J-PAINEL-DE-CONTROLE-2026-03-28.md` | Idem |
| `docs/relatorios/MIGRACAO-FILA-PARA-LOTES.md` | Secção legado + classificação atualizada |
| `docs/relatorios/VARREDURA-FINAL-LEGADO-FILA-BLOCO-J-2026-03-28.md` | Nota no topo apontando para este relatório |
| `docs/relatorios/AUDITORIA-FILA-VS-LOTES.md` | Secções 2–5 alinhadas ao estado atual (Lotes, legacy, alias HTTP) |
| `goldeouro-admin/src/pages/Lotes.jsx` | JSDoc: `totalNaFila` e `queueLength` em `/stats` |

---

## 5. Scripts PowerShell (`goldeouro-admin/scripts`)

| Script | Alteração |
|--------|-----------|
| `padronizar-paginas.ps1` | Entrada `FilaResponsive` comentada (legado fora de `src/pages`) |
| `padronizar-todas-paginas.ps1` / `padronizar-paginas-simples.ps1` | Removido `FilaResponsive` da lista (comentário de contexto) |
| `test-correcoes-completas-final.ps1` | Paths `legacy`; rota esperada `Lotes`; texto `/lotes` em vez de `/fila` |
| `test-correcoes-completas-final-v3.ps1` | Idem + array de rotas sem `FilaResponsive`/`GameResponsive`; inclui `Lotes` |

---

## 6. Verificações executadas

- `npm run build` em `goldeouro-admin` — **OK**
- `node --check routes/adminApiFly.js` — **OK** (recomendado após pull)

---

## 7. O que permanece com nome “fila” / “queue” (propositado)

- **`GET /api/admin/fila`** — alias mantido.
- **Campos JSON:** `totalNaFila`, `queueLength`, `dashboardCards.queue` — nomes legados; semântica documentada no código.
- **`getQueueSnapshot`** — nome de função injetada pelo servidor; não renomeada (evita refactor largo).
- **Backups e assets pré-compilados** antigos no repositório admin — não limpos nesta tarefa.

---

## CLASSIFICAÇÃO FINAL

### **LEGADO CONTROLADO**

**Justificativa:** o painel oficial e a documentação principal falam em **lotes**; artefactos confusos foram **isolados** em `src/legacy/` com README; scripts deixam de apontar para `src/pages/FilaResponsive.jsx` como página “oficial”; o backend ganhou **comentários explícitos** sobre `fila`/`queueLength`/`totalNaFila` **sem** mudar contratos.

**Não é “LEGADO LIMPO”** porque: (1) pastas `BACKUP-*` e bundles em `assets/` ainda contêm referências antigas; (2) o JSON público ainda usa chaves históricas; (3) ficheiros legados existem (apenas arquivados).

**Não é “LIMPEZA PARCIAL”** porque: a malha oficial, redirect, alias HTTP e build foram validados; a separação física em `/legacy` cumpre o objetivo de “limpeza controlada” sem apagar histórico útil.

---

## Referências rápidas

- Painel oficial: `goldeouro-admin/src/pages/Lotes.jsx`, rota `/lotes`
- Legado: `goldeouro-admin/src/legacy/`
- API snapshot: `GET /api/admin/lotes` ≡ `GET /api/admin/fila`
- Stats: `queueLength` = `lotesAtivosCount` (ver `adminApiFly.js`)
