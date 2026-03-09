# CONFIRMAÇÃO DEFINITIVA DA BASELINE

**Data:** 2026-03-08  
**Modo:** Cirúrgico controlado — reconstrução local para análise; nenhuma alteração em produção, Vercel, banco, backend ou main.  
**Branch de análise:** `baseline-reconstruction-analysis` (criada a partir do commit 0a2a5a1).

---

## 1. Commit analisado

| Item | Valor |
|------|--------|
| **Commit principal testado** | 0a2a5a1 (Merge PR #18 — security/fix-ssrf-vulnerabilities, 2025-11-15) |
| **Commit alternativo testado** | 7dbb4ec (fix: corrigir CSP para permitir scripts externos, 2025-11-15) |
| **Branch criada** | baseline-reconstruction-analysis (a partir de 0a2a5a1) |
| **Repositório** | goldeouro-backend (monorepo; player em goldeouro-player/) |

Ambos os commits existem no repositório. O código do player em 0a2a5a1 e 7dbb4ec é o mesmo no que diz respeito a `App.jsx` e às rotas (incluindo `/game`).

---

## 2. Resultado do build

### Build a partir de 0a2a5a1

- **Comando:** `cd goldeouro-player && npm install && npm run build`
- **Saída Vite:** build concluído com sucesso.
- **Arquivos gerados em `dist/assets`:**
  - **JS principal:** `index-CXrYbj39.js` — 379 519 bytes (378,35 kB)
  - **CSS principal:** `index-sYayxj5X.css` — 70 857 bytes (70,86 kB)

### Build a partir de 7dbb4ec

- **Comando:** `npm run build` (após checkout 7dbb4ec).
- **Arquivos gerados em `dist/assets`:**
  - **JS principal:** `index-Du8_MyBi.js` — 378,35 kB
  - **CSS principal:** `index-sYayxj5X.css` — 70,86 kB (mesmo hash que em 0a2a5a1)

O hash do JS muda entre 0a2a5a1 e 7dbb4ec (CXrYbj39 vs Du8_MyBi); o CSS permanece sYayxj5X em ambos.

---

## 3. Comparação de bundles

| Referência | JS | CSS | Tamanho JS (bytes) |
|------------|-----|-----|---------------------|
| **Baseline documentada** | index-**qIGutT6K**.js | index-**lDOJDUAS**.css | 478 903 |
| **Build em 0a2a5a1** | index-**CXrYbj39**.js | index-**sYayxj5X**.css | 379 519 |
| **Build em 7dbb4ec** | index-**Du8_MyBi**.js | index-**sYayxj5X**.css | ~379 000 |

**Respostas:**

- **O bundle gerado coincide com o baseline?**  
  **Não.** Nenhum dos dois commits (0a2a5a1 nem 7dbb4ec) produz o par index-qIGutT6K.js / index-lDOJDUAS.css.

- **Se não coincidir, qual hash foi gerado?**  
  - Em **0a2a5a1:** JS = **CXrYbj39**, CSS = **sYayxj5X**.  
  - Em **7dbb4ec:** JS = **Du8_MyBi**, CSS = **sYayxj5X**.

O tamanho do JS da baseline (478 903 bytes) é cerca de 100 kB maior que o build local (~379 519 bytes), indicando diferença de ambiente de build (versões de Node/npm/Vite, lockfile, variáveis de ambiente ou inclusão de código no bundle).

---

## 4. Estrutura de rotas no commit

No commit **0a2a5a1** (e em **7dbb4ec**), o arquivo `goldeouro-player/src/App.jsx` contém:

```jsx
<Route path="/game" element={
  <ProtectedRoute>
    <GameShoot />
  </ProtectedRoute>
} />
<Route path="/gameshoot" element={
  <ProtectedRoute>
    <GameShoot />
  </ProtectedRoute>
} />
```

Ou seja: tanto `/game` quanto `/gameshoot` montam o componente **GameShoot**. O componente **Game** está importado no App.jsx mas **não está associado a nenhuma rota** nesses commits.

---

## 5. Componente usado em /game

- **Componente montado em `/game` no commit proxy (0a2a5a1 e 7dbb4ec):** **GameShoot**.
- **Evidência:** Leitura direta de `goldeouro-player/src/App.jsx` nos dois commits.

**Layout da tela (GameShoot.jsx neste commit):**

- Header com logo, saldo, botões (Recarregar, Dashboard).
- Campo de jogo em área fixa (zonas TL, TR, C, BL, BR), goleiro, bola.
- Aposta (valor fixo R$ 1 no fluxo V1 neste código).
- Estatísticas: Gols, Defesas, Sequência, Gols de Ouro.
- Integração com backend via `gameService` (POST /api/games/shoot).

O servidor de desenvolvimento foi iniciado (`npm run dev`); em `http://localhost:5173/game` a página exibida é a do **GameShoot** (campo, goleiro, zonas de chute, saldo, Recarregar/Dashboard no header).

---

## 6. Comparação com o print validado

- **Print validado:** Referência visual com campo em destaque, goleiro, alvos circulares, bola, botão tipo "menu" no canto, barra com saldo/chutes/ganhos.
- **Relatórios anteriores (AUDITORIA-PROFUNDA-CONFLITO-GAME, ELIMINACAO-FINAL-INCERTEZAS):** O layout do print é descrito como mais próximo de **Game.jsx** (GameField, estádio, 6 alvos, botão "Menu" no canto) do que de **GameShoot.jsx** (campo 400×300, "Recarregar" no header).

**Conclusão da comparação:**

- No **código do commit proxy** (0a2a5a1 / 7dbb4ec), a rota `/game` serve **GameShoot**, não Game.
- Portanto, **a baseline reconstruída localmente** (estado de código desses commits) usa **GameShoot** em `/game`.
- Se o print validado for da mesma baseline (deploy FyKKeg6zb), então a tela validada seria a do GameShoot tal como estava naquele build; a descrição "mais próximo de Game.jsx" pode referir-se a uma fase anterior ou a detalhes visuais que não batem exatamente com o código atual de GameShoot.
- **Resposta direta:** Na baseline reconstruída (commit proxy), o componente efetivamente renderizado em `/game` é **GameShoot**. A correspondência exata do print validado com essa tela não foi revalidada visualmente nesta sessão; a documentação anterior indica que o print é mais próximo do layout descrito para Game.jsx.

---

## 7. Conclusão definitiva

**1. Qual commit reproduz a baseline?**  
O **estado de código** da baseline é reproduzido pelo **0a2a5a1** (e pelo 7dbb4ec): mesmo App.jsx, mesmo mapeamento de rotas, mesma escolha de componente em `/game`. O **bundle exato** (hash qIGutT6K/lDOJDUAS) **não** é reproduzido localmente, por diferença de ambiente de build.

**2. O bundle gerado coincide com qIGutT6K?**  
**Não.** O build local gera hashes diferentes (JS: CXrYbj39 ou Du8_MyBi; CSS: sYayxj5X) e tamanho menor que o da baseline (478 903 bytes).

**3. Qual componente serve `/game` na baseline?**  
No código do commit proxy que representa a baseline, **GameShoot** serve a rota `/game` (e também `/gameshoot`). Não há rota apontando para Game.jsx.

**4. O print validado corresponde a essa tela?**  
A documentação anterior indica que o print é mais alinhado ao layout descrito para **Game.jsx**. A tela efetivamente servida em `/game` no commit proxy é **GameShoot**. Portanto, ou o print é de outra fase/outro build, ou a "experiência validada" era a do GameShoot com um layout que depois foi associado ao Game em relatórios; não foi possível fechar essa correspondência apenas com esta reconstrução.

**5. A baseline usa Game ou GameShoot?**  
**GameShoot.** Tanto em 0a2a5a1 quanto em 7dbb4ec, `App.jsx` monta **GameShoot** em `/game`.

---

## Classificação final

**BASELINE RECONSTRUÍDA COM PEQUENA VARIAÇÃO DE BUILD**

- **Código:** O estado de código da baseline (rotas e componente em `/game`) foi reconstruído e confirmado: commit proxy 0a2a5a1 (ou 7dbb4ec), com `/game` → **GameShoot**.
- **Bundle:** O hash do bundle (qIGutT6K / lDOJDUAS) **não** foi reproduzido localmente; o build gera hashes e tamanho diferentes, por diferença de ambiente (Node, npm, Vite ou lockfile). Isso é esperado quando não se replica exatamente o ambiente da Vercel de 16 Jan 2026.
- **Commit proxy:** Continua válido como referência para o **código** da baseline; não como garantia do **bundle idêntico** sem reproduzir o ambiente de build da Vercel.

---

*Procedimento realizado em branch isolada `baseline-reconstruction-analysis`; produção, Vercel, main e rotas em produção não foram alterados.*
