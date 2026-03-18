# Auditoria completa de assets da página /game — Produção vs Preview

**Data:** 2026-03-17  
**Modo:** READ-ONLY (nenhuma alteração de código ou arquivos)  
**Escopo:** Todos os assets visuais e de áudio usados na rota `/game` (GameFinal.jsx + layoutConfig.js + CSS relacionado).

---

## 1. Resumo executivo

A página `/game` é servida por **GameFinal.jsx**, que importa **12 assets de imagem** de `../assets/` e referencia **4 sons** em `/sounds/` e **1 logo** em `/images/`. O **layoutConfig.js** não referencia nenhum asset (apenas dimensões e coordenadas).

- **Produção (referência):** No branch `main`, o arquivo **GameFinal.jsx não existe**; a rota `/game` em main é servida por outro componente (Game.jsx ou similar). Os assets listados em `main` em `goldeouro-player/src/assets/` são **13 arquivos** (sem `ganhou_100.png`, `ganhou_5.png`, `gol_de_ouro.png`, `gol_normal.png`).
- **Preview (branch atual):** Branch **feature/bloco-e-gameplay-certified**. GameFinal.jsx existe e importa os mesmos 12 assets. Na pasta **src/assets** do preview existem **17 arquivos**: os 13 da main **mais** `ganhou_100.png`, `ganhou_5.png`, `gol_de_ouro.png`, `gol_normal.png` — estes **não são referenciados** por GameFinal.jsx e representam risco de troca indevida ou uso por outro código.
- **GOOOL divergente:** Foi reportado que o overlay de GOOOL no preview está diferente do aprovado. No código, o único asset usado para o overlay de gol é `goool.png` (import explícito). Possíveis causas: (1) **conteúdo do arquivo** `goool.png` diferente do aprovado (mesmo path); (2) uso indevido de outro asset (ex.: `gol_normal.png`) em algum build ou fallback não identificado nesta auditoria.

**Situação geral:** Há **risco crítico** por (i) existência de assets alternativos no preview (`gol_normal.png`, `gol_de_ouro.png`, etc.) que podem ser confundidos com os aprovados, e (ii) divergência reportada do GOOOL. Até confirmação de que todos os arquivos de overlay são idênticos aos aprovados e de que nenhum path/import está incorreto, o go-live permanece **BLOQUEADO**.

---

## 2. Lista completa de assets da /game

Origen: **GameFinal.jsx** (imports e uso), **Logo** (path público), sons (paths em código). **layoutConfig.js** não referencia assets.

| Asset | Caminho de import / uso | Uso na /game | Status |
|-------|-------------------------|--------------|--------|
| goalie_idle.png | `import … from '../assets/goalie_idle.png'` | Sprite goleiro parado | ✅ Referenciado |
| goalie_dive_tl.png | `import … from '../assets/goalie_dive_tl.png'` | Sprite goleiro pulo TL | ✅ Referenciado |
| goalie_dive_tr.png | `import … from '../assets/goalie_dive_tr.png'` | Sprite goleiro pulo TR | ✅ Referenciado |
| goalie_dive_bl.png | `import … from '../assets/goalie_dive_bl.png'` | Sprite goleiro pulo BL | ✅ Referenciado |
| goalie_dive_br.png | `import … from '../assets/goalie_dive_br.png'` | Sprite goleiro pulo BR | ✅ Referenciado |
| goalie_dive_mid.png | `import … from '../assets/goalie_dive_mid.png'` | Sprite goleiro pulo centro | ✅ Referenciado |
| ball.png | `import … from '../assets/ball.png'` | Bola em jogo | ✅ Referenciado |
| bg_goal.jpg | `import … from '../assets/bg_goal.jpg'` | Fundo do campo | ✅ Referenciado |
| goool.png | `import … from '../assets/goool.png'` | Overlay "GOOOL!" (gol) | 🔴 Divergência reportada |
| defendeu.png | `import … from '../assets/defendeu.png'` | Overlay defesa | ✅ Referenciado |
| ganhou.png | `import … from '../assets/ganhou.png'` | Overlay "Ganhou" (após goool) | ✅ Referenciado |
| golden-goal.png | `import … from '../assets/golden-goal.png'` | Overlay Gol de Ouro | ✅ Referenciado |
| Gol_de_Ouro_logo.png | `src="/images/Gol_de_Ouro_logo.png"` (componente Logo) | Logo no HUD da /game | ✅ Path público |
| kick.mp3 | `new Audio('/sounds/kick.mp3')` | Som do chute | ✅ Path público |
| gol.mp3 | `new Audio('/sounds/gol.mp3')` | Som de gol | ✅ Path público |
| defesa.mp3 | `new Audio('/sounds/defesa.mp3')` | Som de defesa | ✅ Path público |
| torcida.mp3 | `new Audio('/sounds/torcida.mp3')` | Torcida em loop | ✅ Path público |

**Arquivos em src/assets NÃO usados pelo GameFinal (existem no preview):**

| Asset | Caminho | Uso na /game | Status |
|-------|---------|--------------|--------|
| golden-victory.png | `goldeouro-player/src/assets/golden-victory.png` | Nenhum (classe .gs-golden-victory existe no CSS mas não é usada com este asset no GameFinal) | 🟡 Legado / não usado |
| ganhou_100.png | `goldeouro-player/src/assets/ganhou_100.png` | Nenhum | 🟠 Suspeito (duplicata/alternativa?) |
| ganhou_5.png | `goldeouro-player/src/assets/ganhou_5.png` | Nenhum | 🟠 Suspeito (duplicata/alternativa?) |
| gol_de_ouro.png | `goldeouro-player/src/assets/gol_de_ouro.png` | Nenhum | 🟠 Suspeito (nome próximo a golden-goal) |
| gol_normal.png | `goldeouro-player/src/assets/gol_normal.png` | Nenhum | 🔴 Risco: confusão com goool.png |

---

## 3. Comparação produção vs preview

- **Referência de “produção”:** branch `main`. Em `main`, **GameFinal.jsx não existe**; a árvore de `goldeouro-player/src/assets/` contém 13 arquivos (ball, bg_goal, defendeu, ganhou, goalie_dive_*, goalie_idle, golden-goal, golden-victory, goool).
- **Preview:** branch **feature/bloco-e-gameplay-certified** (branch atual). GameFinal.jsx existe e usa os 12 imports acima; em `src/assets/` há **17 arquivos** (os 13 da main + ganhou_100, ganhou_5, gol_de_ouro, gol_normal).

### Por asset (produção vs preview)

| Asset | Produção (main) | Preview (feature branch) | Diferença |
|-------|-----------------|---------------------------|-----------|
| goalie_idle.png | Presente | Presente | Nenhuma no path; conteúdo não comparado binariamente nesta auditoria. |
| goalie_dive_*.png | Presentes | Presentes | Idem. |
| ball.png | Presente | Presente | Idem. |
| bg_goal.jpg | Presente | Presente | Idem. |
| goool.png | Presente | Presente | **Divergência visual reportada** (imagem diferente). Path e import idênticos no código. |
| defendeu.png | Presente | Presente | Nenhuma no path. |
| ganhou.png | Presente | Presente | Nenhuma no path. |
| golden-goal.png | Presente | Presente | Nenhuma no path. |
| golden-victory.png | Presente | Presente | Não usado por GameFinal. |
| ganhou_100.png, ganhou_5.png, gol_de_ouro.png, gol_normal.png | **Ausentes em main** | **Presentes no preview** | Arquivos extras só no preview; não referenciados por GameFinal; risco de uso indevido ou troca. |

---

## 4. Assets divergentes (CRÍTICO)

1. **goool.png**  
   - **Divergência:** Relato de que o GOOOL exibido no preview está **diferente** do aprovado (e overlay no canto inferior esquerdo).  
   - **Evidência de código:** GameFinal.jsx usa apenas `import gooolImg from '../assets/goool.png'` e `src={gooolImg}`. Não há referência a `gol_normal.png` nem a outro path no código da /game.  
   - **Conclusão:** Ou (a) o **conteúdo** do arquivo `goool.png` no preview difere do aprovado, ou (b) há outro mecanismo (build, cache, CDN, ou outro componente em outro path) servindo imagem distinta. **Classificação: 🔴 Incorreto (regressão reportada).**

2. **ganhou_100.png, ganhou_5.png, gol_de_ouro.png, gol_normal.png**  
   - **Divergência:** Existem **apenas no preview**, não em main. Não são importados por GameFinal.jsx.  
   - **Risco:** Nomes sugerem variantes de overlays (ganhou, gol). Uso acidental (import errado, refactor futuro) ou build apontando para esses arquivos geraria **regressão visual**. **Classificação: 🟠 Suspeito (assets não aprovados / duplicatas potenciais).**

3. **golden-victory.png**  
   - Presente em main e preview. CSS tem `.gs-golden-victory`; GameFinal usa apenas `golden-goal.png` para overlay de Gol de Ouro. **Classificação: 🟡 Diferente mas aceitável (legado; não usado na /game).**

---

## 5. Possíveis causas das divergências

| Hipótese | Aplicação |
|----------|-----------|
| **Conteúdo do arquivo trocado** | O `goool.png` no preview pode ter sido substituído por outra arte (mesmo nome), gerando “GOOOL divergente”. |
| **Asset duplicado / antigo** | `gol_normal.png` e `goool.png` podem ser variantes; uso de `gol_normal` em algum lugar (ex.: build antigo, outro componente) explicaria overlay errado. |
| **Path incorreto** | Não encontrado no código atual: todos os overlays vêm de imports explícitos de `../assets/...`. |
| **Build/cache** | Bundle ou cache (Vite, CDN, deploy) servindo versão antiga ou asset incorreto. |
| **Troca manual indevida** | Substituição de `goool.png` por outro arquivo no repositório sem atualizar referências. |

Nenhuma alteração de código foi feita; as causas acima são hipóteses técnicas para investigação posterior.

---

## 6. Risco para produção

| Item | Impacto |
|------|---------|
| goool.png com conteúdo diferente do aprovado | **Crítico** — quebra fidelidade visual e UX da tela de gol. |
| Overlay no canto inferior esquerdo (já reportado) | **Crítico** — associado a posicionamento/CSS; pode coexistir com asset errado. |
| Presença de gol_normal.png, gol_de_ouro.png, ganhou_100.png, ganhou_5.png no preview | **Alto** — risco de uso indevido em deploy ou em futuras alterações. |
| Demais assets (goalie_*, ball, bg_goal, defendeu, ganhou, golden-goal) | **Médio** — paths corretos no código; risco restante é conteúdo binário diferente (não verificado aqui). |

---

## 7. Bloqueadores

Os seguintes itens **impedem o go-live** do preview para produção até serem resolvidos ou explicados:

1. **Divergência do overlay GOOOL** — Garantir que o arquivo `goool.png` no preview (e o que for servido em runtime) seja **exatamente** o asset aprovado em produção.  
2. **Posicionamento do overlay** — Garantir que overlays (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) apareçam centralizados, conforme layout aprovado.  
3. **Assets extras (gol_normal, gol_de_ouro, ganhou_100, ganhou_5)** — Decisão: remover do repositório do preview ou documentar como não usados e garantir que build/deploy não os utilizem na rota `/game`.

---

## 8. Veredito final

**BLOQUEADO**

- Os assets da /game no preview **não podem ser considerados exatamente iguais aos aprovados em produção** enquanto:  
  - a divergência do GOOOL não for corrigida ou explicada, e  
  - existirem assets não aprovados/duplicados (gol_normal, gol_de_ouro, ganhou_100, ganhou_5) no preview sem garantia de que não são usados.

Nenhuma alteração foi feita no código ou nos arquivos; esta auditoria é somente leitura e documentação.
