# Migração semântica — Fila → Lotes (BLOCO J)

**Data:** 2026-03-28  
**Modo:** refatoração semântica controlada (admin apenas; sem alteração ao player, engine ou `/api/games/*`).

---

## 1. Objetivo

Alinhar o painel com o modelo real (**lotes em memória** + contador global), eliminando o rótulo enganoso **“Fila de Chute”** e campos de UI que não correspondem a dados reais.

---

## 2. Alterações no frontend

| Item | Antes | Depois |
|------|--------|--------|
| Página | `src/pages/Fila.jsx` | **`src/pages/Lotes.jsx`** (novo; `Fila.jsx` removido) |
| Rota oficial | `/fila` | **`/lotes`** |
| Redirecionamento | — | **`/fila` → `/lotes`** (`Navigate replace`) |
| API consumida | `/api/admin/fila` | **`/api/admin/lotes`** (alias com mesmo payload) |
| Sidebar (oficial) | “Fila de Chute” | **“Lotes ativos”** → `/lotes` |
| `navigation.js` `validRoutes` | `/fila` | `/lotes` |
| Dashboard cards | “Na Fila” (responsive) / texto resumo | **“Lotes ativos (memória)”** e texto ajustado em `DashboardCards.jsx` |
| Sidebars paralelos | `SidebarFixed.jsx`, `SidebarResponsive.jsx` | Atualizados para coerência |
| `AppRoutes-simple.jsx` | rota `fila` | rota **`lotes`** |
| `pageTests.js` | label `Fila` | `Lotes` |

### UI da página `Lotes.jsx`

- Mostra apenas **lotes ativos** (`totalNaFila` = `lotesAtivos.size`) e **contador global de chutes**.
- Removidos da UI: posição, tempo estimado, “já chutou”, “marcou gol”, badges de estado por jogador, secção “informações detalhadas” irrelevantes.
- Texto explicativo: snapshot do **processo** atual; restart / multi-instância mencionados.

### Legado (pós-limpeza 2026-03-29)

- **`FilaResponsive.jsx`**, **`ControleFila.jsx`**, **`GameResponsive.jsx`**, stub **`Game.jsx`** e **`Navigation.jsx`** foram movidos para **`goldeouro-admin/src/legacy/`** (ver `legacy/README.md` e `docs/relatorios/LIMPEZA-LEGADO-FILA-BLOCO-J.md`).
- Imports relativos foram corrigidos para a nova localização; **não** entram na malha oficial (`AppRoutes.jsx`).

---

## 3. Alterações no backend (`routes/adminApiFly.js`)

- Função **`buildAdminLotesSnapshotPayload(getQueueSnapshot)`** centraliza o objeto `data` (mesmos campos e mesma lógica numérica que antes).
- **`GET /api/admin/fila`**: mantido; responde com o **mesmo shape** (compatibilidade).
- **`GET /api/admin/lotes`**: **novo alias**; resposta **idêntica** à de `/fila`.
- Campo **`observacao`**: texto atualizado para refletir **lotes / snapshot do processo** (sem mudar `totalNaFila` nem `contadorChutesGlobal`).

**Não alterado:** `server-fly.js`, `lotesAtivos`, `getQueueSnapshot`, `POST /api/games/*`, ou qualquer engine.

---

## 4. Verificações

| Verificação | Resultado |
|-------------|-----------|
| `node --check server-fly.js` | OK (execução nesta sessão) |
| `npm run build` (`goldeouro-admin`) | OK |

---

## 5. Impacto

- Integrações que chamavam só **`GET /api/admin/fila`** continuam válidas.
- Clientes que usavam **`/fila`** no browser passam a ser redirecionados para **`/lotes`**.
- Nenhuma dependência do player foi tocada.

---

## CLASSIFICAÇÃO FINAL

**MIGRAÇÃO CONCLUÍDA** (painel oficial em **Lotes**; legado isolado em **`src/legacy/`**)

**Ressalvas residuais:**

1. Pastas **`BACKUP-*`** no admin ainda contêm cópias antigas com nomes “Fila” — histórico, fora do build.
2. Campos JSON legados (`totalNaFila`, `queueLength`, `dashboardCards.queue`) mantêm nomes por compatibilidade; semântica = **lotes ativos** (ver comentários em `routes/adminApiFly.js`).
