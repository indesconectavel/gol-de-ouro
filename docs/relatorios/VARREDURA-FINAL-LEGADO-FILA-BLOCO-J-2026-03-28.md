# VARREDURA FINAL — LEGADO “FILA” — BLOCO J

**Data:** 2026-03-28  
**Modo:** read-only (nenhuma alteração ao repositório nesta tarefa).  
**Âmbito:** painel admin (`goldeouro-admin/`) + router admin (`routes/adminApiFly.js`) + injeção `getQueueSnapshot` em `server-fly.js` (apenas leitura para contexto).

---

## 1. Resumo executivo

> **Atualização 2026-03-29:** limpeza controlada documentada em **`docs/relatorios/LIMPEZA-LEGADO-FILA-BLOCO-J.md`** (ficheiros legados movidos para `goldeouro-admin/src/legacy/`). O texto abaixo descreve o estado **antes** dessa passagem, útil como inventário.

A **malha oficial** (`main.jsx` → `AppRoutes.jsx` → `Sidebar.jsx`) está **alinhada a Lotes** (`/lotes`, `Lotes.jsx`). Restam referências a **“Fila”** e **“fila”** sob três categorias: (a) **compatibilidade intencional** (`/fila` → redirect); (b) **contrato JSON / nomes de campo** (`totalNaFila`, `queue`, `queueLength`) que ainda carregam semântica antiga **sem mudar o significado real** (lotes em memória); (c) **legado fora da malha** (`FilaResponsive.jsx`, `ControleFila.jsx`, `App.jsx`, `GameResponsive.jsx`, docs e scripts) que **continua a descrever fila de jogadores** ou **chama paths incorretos** — risco de **confusão futura** para quem editar ou reativar esses ficheiros.

---

## 2. Referências a “Fila” ainda na malha oficial

| Evidência | Ficheiro / local | Natureza |
|-----------|------------------|----------|
| Redirect **`/fila` → `/lotes`** | `goldeouro-admin/src/AppRoutes.jsx` (~147) | **Compatibilidade**; não é label “Fila” na UI; mantém bookmarks antigos. |
| Comentário JSDoc citando **`/api/admin/fila`** e campo **`totalNaFila`** | `goldeouro-admin/src/pages/Lotes.jsx` (linhas ~8–9, ~52) | **Documentação + consumo do payload**; `totalNaFila` é o **nome do campo** devolvido pelo backend (quantidade de lotes ativos). |
| **`Sidebar.jsx`** | Grep em `Sidebar.jsx`: **0** ocorrências de `fila` / `Fila` | **Nenhum** resíduo textual “Fila” na sidebar oficial (confirmado por grep). |
| **`navigation.js` `validRoutes`** | Grep: **0** `fila` | Lista usa **`/lotes`** (sem `/fila` como rota “válida” para navegação auxiliar). |
| **`pageTests.js`** | Grep: **0** `fila` / `Fila` | Label de teste alinhado a **“Lotes”** (grep sem match para Fila). |
| **`Dashboard.jsx`** | Grep: **0** `fila` / `Fila` / `queue` | Sem referência direta. |

**Conclusão malha oficial (UI de rota):** exceto o **redirect** `/fila` e **comentários/campo API** em `Lotes.jsx`, não há “Fila de Chute” na árvore de rotas/sidebar atuais.

---

## 3. Referências a “Fila” fora da malha oficial

### Código React / JSX (não importado por `AppRoutes.jsx` oficial)

| Ficheiro | Evidência (grep) | Nota |
|----------|------------------|------|
| **`FilaResponsive.jsx`** | Nome do ficheiro, `FilaResponsive`, `FilaMobileTablet`, `dadosFila`, títulos **“Fila de Chute”**, `getData('/fila')` (**path errado** vs `/api/admin/...`), fallback **dados fictícios**, textos “fila de jogadores”, “Total na Fila” | **Legado confuso**; não está na malha oficial mas **induz modelo antigo**. |
| **`ControleFila.jsx`** | `ControleFila`, `filaInfo`, `fetchFila`, `postData('/admin/controle-fila', {})`, “Controle Geral da Fila”, `totalNaFila`, `statusFila` | **Legado**; rota **não** consta do `AppRoutes.jsx` oficial analisado. |
| **`App.jsx`** | `<h3>Na Fila</h3>` (~95) | Entry **legado** (não é `main.jsx`). |
| **`App-simple.jsx`**, **`App-no-tailwind.jsx`** | “Na Fila” | Idem. |
| **`GameResponsive.jsx`** | Logs/comentários “fila”, UI “Entrar/Sair na Fila”, “Na Fila”, `queuePosition`, `queue-status`, evento `queue-updated` | **Admin legado** orientado a **fila de jogo** (conceito diferente de **lotes** do engine atual no painel de snapshot). |
| **`TestePadronizacao.jsx`** | Card **‘Na Fila’** | Mock / demo. |
| **`Navigation.jsx`** | `{ label: 'Fila de Chute', path: '/metricas/fila' }` (~93) | **Legado**; path **não** é a malha `AppRoutes` principal. |

### Outros

| Ficheiro | Evidência |
|----------|-----------|
| **`authService.js`** | Comentário **“Processar fila de requisições”** (~136) | **Fila = fila de requests** (padrão CS); **não** é “fila de chute” do produto. |
| **`AppRoutes-simple.jsx`** | Grep `fila` / `Fila` / `queue`: **0** matches | Sem resíduo “Fila” nesta variante de rotas. |
| **`AppRoutes-working.jsx`** | **Sem** ocorrências `fila`/`Fila`/`queue` | Só `Login` + `Dashboard` + redirects. |
| **`src/routes/index.jsx`** | **Sem** match grep `fila`/`Fila`/`queue` | — |
| **Backups / histórico** | Vários `BACKUP-*/**` com `Fila.jsx`, `FilaResponsive`, etc. | **Inofensivo** para build se não importados. |
| **Docs `.md` em `goldeouro-admin/`** | Múltiplos relatórios citam **`/fila`**, “Fila de Chute”, `Fila.jsx` | **Documentalmente desatualizado** face à migração. |
| **Scripts `.ps1`** | `padronizar-paginas.ps1`, `test-correcoes*.ps1`, etc.: `FilaResponsive`, `/fila` | **Manutenção futura** pode apontar para artefactos antigos. |

---

## 4. Referências backend/admin ainda existentes

| Evidência | Local | Natureza |
|-----------|--------|----------|
| **`GET /api/admin/fila`** | `routes/adminApiFly.js` | **Mantido**; mesmo payload que `/lotes` (evidência: comentário ~119 e handlers ~787+). |
| **`GET /api/admin/lotes`** | `routes/adminApiFly.js` (~796+) | **Alias** coerente. |
| **`buildAdminLotesSnapshotPayload`** | `adminApiFly.js` | Campo JSON **`totalNaFila`** (nome legado; valor = `lotesAtivosCount`). |
| **`observacao`** | string em `buildAdminLotesSnapshotPayload` | Menciona explicitamente que **não há fila por jogador** — semântica **corretiva**. |
| **`GET /api/admin/stats`** | `queueLength`, `dashboardCards.queue`, `dashboardCards.games.active` derivados de `q.lotesAtivosCount` | Nomes **`queue*`** no JSON; significado = **lotes ativos**. |
| **`getQueueSnapshot`** | `server-fly.js` (~2760–2763) | Nome da função injetada contém **“Queue”**; corpo devolve **`lotesAtivosCount`** e **`contadorChutesGlobal`**. |

**Conclusão:** backend **não** reintroduz fila de jogadores; mantém **nomes históricos** (`fila`, `totalNaFila`, `queue`) por **compatibilidade**.

---

## 5. Resíduos semânticos (`queue`, `queueLength`, labels, textos)

| Onde | O quê |
|------|--------|
| **`DashboardCards.jsx` / `DashboardCardsResponsive.jsx`** | Propriedade **`queue`** no objeto vindo de `/api/admin/stats` (ou fallback); título de cartão já **“Lotes ativos (memória)”** no ficheiro principal — o **nome da chave** continua `queue`. |
| **`mockData.js`** | Chave **`queue: 0`** | Mock legado. |
| **Payload admin snapshot** | **`totalNaFila`** | Semântica visual = lotes; nome = legado. |
| **`stats` JSON** | **`queueLength`**, **`dashboardCards.queue`** | Legado semântico na API admin. |

---

## 6. Classificação de criticidade

| Item | Classificação |
|------|----------------|
| Redirect `/fila` em `AppRoutes.jsx` | **Oficial, não crítico** — compatibilidade. |
| `Lotes.jsx` comentários + `totalNaFila` | **Oficial, baixo risco** — documentado; depende do contrato API. |
| `DashboardCards*` usando chave `queue` | **Oficial, confusão residual leve** (nome vs significado). |
| `GET /api/admin/fila` + campos `queue*` / `totalNaFila` | **Backend compatível, confusão residual** em integrações/leituras de JSON. |
| `getQueueSnapshot` (nome) | **Backend, nomenclatura antiga**; comportamento = lotes. |
| `FilaResponsive.jsx` | **Legado confuso** (path errado, mock, copy “fila de jogadores”). |
| `ControleFila.jsx` | **Legado confuso** (endpoint legado `/admin/controle-fila`). |
| `App.jsx` / `App-simple` / `App-no-tailwind` — “Na Fila” | **Legado inofensivo** se entrypoints não usados. |
| `GameResponsive.jsx` | **Legado confuso** no repositório admin (mistura fila de jogo vs snapshot de lotes). |
| `Navigation.jsx` “Fila de Chute” / `/metricas/fila` | **Legado confuso**. |
| Docs + scripts + backups | **Inofensivo ao runtime**; **confuso para humanos** que leem docs antigos. |
| `authService.js` “fila de requisições” | **Inofensivo** (outro significado de “fila”). |

---

## 7. O que está seguro manter

- **Redirect `/fila` → `/lotes`** enquanto existirem links externos ou bookmarks.
- **`GET /api/admin/fila`** como alias de compatibilidade para clientes antigos.
- **`GET /api/admin/lotes`** como caminho preferencial documentado.
- **`Lotes.jsx`** e **Sidebar** sem label “Fila” (estado atual).
- Comentários em **`Lotes.jsx`** que explicam o **mapeamento** `totalNaFila` → lotes ativos.

---

## 8. O que deve ser removido ou renomeado depois

*(Apenas recomendação futura; **nenhuma alteração** nesta tarefa.)*

1. **`FilaResponsive.jsx`:** renomear para fluxo `Lotes` ou remover se não houver uso; corrigir path da API e remover mock se for mantido.
2. **`ControleFila.jsx`:** remover ou alinhar a um endpoint admin real documentado.
3. **`GameResponsive.jsx` / `Navigation.jsx` / `App*.jsx` legados:** alinhar textos e rotas ou isolar em pasta `legacy/` com README.
4. **Contrato JSON (fase 2):** renomear gradualmente `totalNaFila` → `lotesAtivosCount`, `queue` → `lotesAtivos` (exige coordenação frontend + consumidores).
5. **`getQueueSnapshot` → `getLotesSnapshot`** (só nomenclatura, mesmo corpo).
6. **Documentação e scripts** em `goldeouro-admin/*.md` e `scripts/*.ps1` que ainda citam `/fila` e `Fila.jsx`.

---

## 9. Diagnóstico final

A **malha oficial do BLOCO J** ficou **semanticamente correta** na navegação principal (**Lotes**, `/lotes`). O legado **“Fila”** concentra-se em **ficheiros não roteados oficialmente**, **nomes de campos JSON** (`queue`, `totalNaFila`), **função `getQueueSnapshot`**, e **documentação/scripts** antigos — não invalida o snapshot de lotes, mas **mantém portas abertas para interpretação errada** (“fila de jogadores”) se alguém reutilizar `FilaResponsive`/`ControleFila` ou ler só o nome das chaves API.

---

## CLASSIFICAÇÃO FINAL OBRIGATÓRIA

**LEGADO RESIDUAL AINDA CONFUSO**

**Motivo:** a operação oficial está **controlada**, mas persistem **artefatos com copy e paths errados** (`FilaResponsive`, `ControleFila`, `Navigation.jsx`, `GameResponsive`) e **nomenclatura `queue` / `totalNaFila` / `getQueueSnapshot`** que continuam a evocar “fila” em sentido antigo ou genérico.
