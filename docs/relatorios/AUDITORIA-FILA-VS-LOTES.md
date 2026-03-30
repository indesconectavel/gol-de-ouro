# Auditoria — FILA vs LOTES (painel admin / BLOCO J)

**Data:** 2026-03-28  
**Âmbito:** relação entre `Fila.jsx`, `GET /api/admin/fila`, e o sistema de **lotes** em `server-fly.js` (`lotesAtivos`).

---

## 1. Backend

### Existe lógica real de “fila” (fila de jogadores)?

**Não**, no sentido de **fila ordenada de utilizadores à espera de jogar** exposta ao admin.

O fluxo de jogo em `server-fly.js` baseia-se em **`lotesAtivos`** (`Map` em memória), **`getOrCreateLoteByValue`**, e no processamento de `POST /api/games/shoot`. Não há, no trecho analisado, uma estrutura separada chamada “fila” alimentada para o painel com posição por utilizador.

### O que é `getQueueSnapshot`?

Em `server-fly.js` (montagem do router admin), é injetada a função:

```javascript
getQueueSnapshot: () => ({
  lotesAtivosCount: lotesAtivos.size,
  contadorChutesGlobal
})
```

Ou seja: **apenas** o **número de lotes ativos** no `Map` e o **contador global de chutes**. Não há lista de jogadores, posições, nem estado “aguardando/jogando” por utilizador neste snapshot.

### `GET /api/admin/fila` retorna dados reais?

**Sim**, no sentido de que **não são valores inventados pelo servidor**: vêm de `lotesAtivos.size` e `contadorChutesGlobal` em memória.

**Mas** o **shape JSON** inclui campos **sempre nulos** no handler atual (`routes/adminApiFly.js`):

- `posicao`, `jaChutou`, `marcouGol`, `tempoEstimado` → **`null`**
- `status` → fixo `'snapshot'`
- `totalNaFila` → **`lotesAtivosCount`** (quantidade de **lotes**, não de pessoas na fila)

A própria API documenta na resposta:

> *«Visão agregada dos lotes em memória no servidor (não fila por utilizador).»*

### Esses dados são usados em lógica ativa?

- **Engine de jogo:** não depende de `GET /api/admin/fila`. Depende de `lotesAtivos` durante o shoot.
- **Dashboard admin (`GET /api/admin/stats`):** **sim**, indiretamente — usa o **mesmo** `getQueueSnapshot` para `queueLength`, `dashboardCards.games.active`, `dashboardCards.queue`, etc. (tudo derivado de **`lotesAtivosCount`** e `contadorChutesGlobal`).

### O sistema atual usa apenas LOTES?

Para a **mecânica de chute e estado vivo do jogo**, **sim — lotes em memória** (`lotesAtivos`) são o conceito operacional. O termo **“fila”** no admin é **abstração / nome antigo** para um **resumo de lotes + contador**, não um subsistema distinto de “fila”.

---

## 2. Frontend

### Página oficial (`Lotes.jsx`) usa dados reais ou mock?

**Dados reais** via `getData('/api/admin/lotes')` e `pickData` — alinhado com o BLOCO J (`src/js/api.js`). **Sem mock**.

**Nota:** `src/legacy/pages/FilaResponsive.jsx` (**fora** de `AppRoutes.jsx`) mantém ramo mobile com fallback fictício e path incorreto — apenas arquivo histórico.

### Dependência real desta tela?

- **Malha oficial:** consome **`GET /api/admin/lotes`**; **`GET /api/admin/fila`** permanece como **alias** do mesmo payload (compatibilidade).
- **Dashboard** expõe contagem equivalente (**`queueLength` = `lotesAtivosCount`**) via **`/api/admin/stats`**.

### Sidebar aponta para `/fila`?

**Não como destino final.** `Sidebar.jsx` aponta para **`/lotes`** (“Lotes ativos”). **`/fila`** no router apenas **redireciona** para `/lotes`.

---

## 3. Comparação com LOTES

| Questão | Conclusão |
|---------|-----------|
| LOTES substituem FILA completamente? | **Conceitualmente sim** para o estado de jogo: o que importa é `lotesAtivos`. Não há “fila” paralela com semântica própria no backend admin. |
| FILA é subconjunto de LOTES? | **O endpoint `/fila` é um subconjunto informativo** do estado de lotes (contagem) + contador global, mais campos **placeholder** nulos. |
| FILA é apenas nome antigo? | **Sim.** O rótulo “fila” **não corresponde** a uma fila de jogadores; corresponde a **snapshot de lotes em RAM** (e contador). |

---

## 4. Compatibilidade (estado atual)

- **`GET /api/admin/fila`:** mantido como alias de **`GET /api/admin/lotes`** (mesmo JSON); integrações antigas continuam válidas.
- **Rota browser `/fila`:** `Navigate` → **`/lotes`**.
- **Remover o alias `/fila` (HTTP ou SPA)** só deve ser feito com **janela de compatibilidade** explícita para clientes que ainda o chamem.

---

## 5. Síntese executiva

- **Não existe** uma “fila de jogadores” real alimentada para o admin; existe **contagem de lotes ativos** e **contador global**.
- **`/api/admin/fila`** devolve dados **reais** mas **mal nomeados** e com **campos nulos** que sugerem modelo antigo (posição, já chutou, etc.).
- **Lotes** são o **modelo atual** de estado em memória para o gameplay; o painel **“Fila”** é, na prática, um **painel de snapshot de lotes + contador**.

---

## CLASSIFICAÇÃO FINAL

### **FILA DEVE SER RENOMEADA PARA LOTES**

**Justificativa:** o conteúdo operacional da rota e da página é **snapshot de lotes em memória** (e métrica global), não uma fila de utilizadores. As alternativas “FILA É NECESSÁRIA” ou “FILA É LEGADO (REMOVER)” são secundárias:

- **Não é estritamente necessária** como página à parte, porque o **dashboard** já agrega `lotesAtivosCount` via `/stats`.
- **Não é legado inútil** no sentido de dados falsos — os números são **reais**, só o **nome e parte da UI** é que herdam semântica antiga.

**Estado pós-migração (2026-03):** rota/label oficiais em **Lotes**; legado isolado em **`src/legacy/`**; comentários no backend documentam **`totalNaFila` / `queueLength` = `lotesAtivosCount`**.
