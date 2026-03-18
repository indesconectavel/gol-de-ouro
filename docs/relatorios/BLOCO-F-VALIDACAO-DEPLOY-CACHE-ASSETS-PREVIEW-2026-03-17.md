# BLOCO F — Validação de deploy + cache + assets do preview (/game)

**Data:** 2026-03-17  
**Modo:** READ-ONLY + ações operacionais seguras. Produção intocada.

---

## 1. Estado do repositório local — assets

**Pasta verificada:** `goldeouro-player/src/assets/`

**Arquivos presentes (listagem):**
- ball.png
- bg_goal.jpg
- defendeu.png
- ganhou.png
- ganhou_100.png
- ganhou_5.png
- goalie_dive_bl.png
- goalie_dive_br.png
- goalie_dive_mid.png
- goalie_dive_tl.png
- goalie_dive_tr.png
- goalie_idle.png
- gol_de_ouro.png
- gol_normal.png
- golden-goal.png
- golden-victory.png
- goool.png

**Requisitos certificados atendidos:**  
✅ goalie_idle.png  
✅ goalie_dive_tl.png, goalie_dive_tr.png, goalie_dive_bl.png, goalie_dive_br.png, goalie_dive_mid.png  
✅ ball.png  
✅ bg_goal.jpg  
✅ goool.png  
✅ defendeu.png  
✅ ganhou.png  
✅ golden-goal.png  

Todos os 12 assets certificados existem na pasta. Os arquivos ganhou_100, ganhou_5, gol_de_ouro, gol_normal não são usados pelo GameFinal.

---

## 2. Mudanças não commitadas

**Comando:** `git status`

**Resultado:** Existem arquivos **modificados sem commit**:

| Arquivo | Estado |
|---------|--------|
| `goldeouro-player/index.html` | modified (não commitado) |
| `goldeouro-player/src/pages/GameFinal.jsx` | modified (não commitado) |
| `goldeouro-player/src/pages/game-scene.css` | modified (não commitado) |

Esses três arquivos contêm:
- **index.html:** inclusão de `<div id="game-overlay-root">` (Correção 2 — containing block dos overlays).
- **GameFinal.jsx:** portal para `#game-overlay-root` (Correção 2) e estilos de centralização no viewport (Correção 1).
- **game-scene.css:** regra para `#game-overlay-root`.

Ou seja: as **Correções 1 e 2** (centralização do stage e overlays no centro) **não estão no último commit** e **não estão no remoto**. O preview da Vercel é gerado a partir do remoto; portanto o preview **não** inclui essas correções.

---

## 3. Último commit da branch

**Comando:** `git log -1 --format=fuller`

**Resultado:**
- **Hash:** b11e96de44bba18ae8a69c268209cbc2f2a6286a
- **Mensagem:** feat: fase 1 (idempotência do chute) + pronto para preview
- **Autor/Data:** Fred S. Silva, Tue Mar 17 14:45:54 2026 -0300

**Arquivos alterados nesse commit:**  
Apenas `docs/relatorios/*` (3 arquivos) e `goldeouro-player/src/services/gameService.js`.  
**Não** inclui: index.html, GameFinal.jsx, game-scene.css (Correções 1 e 2).  
**Não** inclui: restauração dos 11 assets (os assets já estavam rastreados em commits anteriores).

---

## 4. Sincronização com o remoto

**Resultado do `git status`:**  
`Your branch is up to date with 'origin/feature/bloco-e-gameplay-certified'.`

A branch local está **sincronizada** com o remoto no sentido de que não há commits locais à frente nem atrás. Porém, as **alterações em working directory** (index.html, GameFinal.jsx, game-scene.css) **nunca foram commitadas nem enviadas**. Ou seja:

- O **remoto** tem exatamente o commit **b11e96d**.
- O **preview da Vercel** é construído a partir desse commit.
- Esse commit **não** contém as Correções 1 e 2.

**Para enviar as correções ao preview:**  
É necessário fazer commit das alterações e push (o comando de push **não** foi executado automaticamente):

```bash
cd "e:\Chute de Ouro\goldeouro-backend"
git add goldeouro-player/index.html goldeouro-player/src/pages/GameFinal.jsx goldeouro-player/src/pages/game-scene.css
git commit -m "fix(game): Correção 1 e 2 - centralização do stage e overlay root para /game (preview)"
git push origin feature/bloco-e-gameplay-certified
```

---

## 5. Deploy no Vercel

- O deployment de preview da Vercel para a branch `feature/bloco-e-gameplay-certified` corresponde ao **último commit enviado ao remoto**, ou seja, **b11e96d**.
- Como as Correções 1 e 2 **não** estão nesse commit, o preview atual **não** reflete:
  - centralização do palco (viewport com flex + center);
  - overlays renderizados no container `#game-overlay-root`.

**Para que o preview use o build correto com as correções:**

1. Fazer **commit** das alterações (index.html, GameFinal.jsx, game-scene.css).
2. Fazer **push** para `origin/feature/bloco-e-gameplay-certified`.
3. A Vercel costuma disparar um **novo build** automaticamente a cada push na branch. Aguardar o build terminar.
4. Se quiser forçar um novo build sem novo commit: no dashboard da Vercel, abrir o projeto → Deployments → no deployment da branch em questão, usar **Redeploy** (sem cache, se possível).

---

## 6. Cache do navegador

Para reduzir chance de estar vendo um build antigo em cache:

1. **Aba anônima:** Abrir a URL do preview em uma janela anônima/privada (Ctrl+Shift+N no Chrome, Ctrl+Shift+P no Firefox).
2. **Hard reload:** Na página do preview, usar **Ctrl+Shift+R** (ou Cmd+Shift+R no Mac) para recarregar ignorando cache.
3. **Limpar cache (se necessário):** DevTools (F12) → Application (Chrome) / Storage (Firefox) → Clear site data, ou nas configurações do navegador limpar dados do site do preview.

Mesmo assim, se o deployment da Vercel ainda for o do commit b11e96d, o conteúdo servido será o **build antigo** (sem Correções 1 e 2). Cache só afeta se já existir um deployment novo e o navegador estiver servindo arquivos antigos.

---

## 7. Assets no build final

**Build executado localmente:** `npm run build` em `goldeouro-player/`.

**Assets gerados em `dist/assets/` (com hash):**
- goalie_idle-Cl2NEJLh.png
- goalie_dive_tl-ClJicsa9.png, goalie_dive_tr-C0JvU0tm.png, goalie_dive_bl-De4-Zpef.png, goalie_dive_br-2NhNnNCP.png, goalie_dive_mid-_DxTjU-l.png
- ball-Cuk5rf4g.png
- bg_goal-D-rPD2pt.jpg
- goool-CFZuq7e1.png
- defendeu-BDg11Idl.png
- ganhou-kJElw5zr.png

Conclusão: no **build local** (com o working tree atual, que inclui as correções), os assets certificados **estão** sendo incluídos e os paths finais são os esperados (Vite gera nomes com hash). Ou seja, **localmente** o bundle está correto. No **preview da Vercel**, o bundle é o do commit b11e96d (sem as alterações de index/GameFinal/game-scene), então os **assets** em si podem ser os mesmos (pois já estão no repositório), mas o **comportamento visual** (centralização e overlays) será o antigo.

---

## 8. Diagnóstico final

| Pergunta | Resposta |
|----------|----------|
| **1. Os assets estão realmente commitados?** | **Sim.** Os 12 assets certificados estão rastreados pelo git (`git ls-files goldeouro-player/src/assets/`). Eles já existem no histórico da branch (incluindo no commit b11e96d ou em commits anteriores). |
| **2. O commit está no remoto?** | O **último** commit (b11e96d) está no remoto. As **alterações** de Correção 1 e 2 (index.html, GameFinal.jsx, game-scene.css) **não** estão em nenhum commit; estão só no working directory. Portanto **não** estão no remoto. |
| **3. O Vercel gerou novo preview com esse commit?** | O preview atual é o do commit **b11e96d**. Não há commit mais recente no remoto com as correções; logo o Vercel **não** tem um build que inclua Correção 1 e 2. |
| **4. Existe chance de cache local?** | **Sim.** Sempre existe. Para descartar: usar aba anônima + hard reload (Ctrl+Shift+R). |
| **5. O preview aberto pode ser antigo?** | **Sim, e é esse o caso.** O preview é o build do commit b11e96d, que **não** contém as correções de centralização nem o overlay root. Por isso o preview “ainda parece antigo/incorreto”. |
| **6. Os assets corretos estão no build final?** | **No build local (com as correções), sim.** No build do **preview (Vercel)**, os assets certificados também estão no repositório e entram no build; o que está “errado” no preview é o **código** (falta das Correções 1 e 2), não a presença dos arquivos de imagem. |

---

## 9. Ação recomendada — sequência exata

Para garantir que o preview exibido seja o correto (código + assets restaurados + Correções 1 e 2):

1. **Commitar as alterações pendentes (Correção 1 e 2):**
   ```bash
   cd "e:\Chute de Ouro\goldeouro-backend"
   git add goldeouro-player/index.html goldeouro-player/src/pages/GameFinal.jsx goldeouro-player/src/pages/game-scene.css
   git commit -m "fix(game): Correção 1 e 2 - centralização do stage e overlay root para /game (preview)"
   ```

2. **Enviar para o remoto:**
   ```bash
   git push origin feature/bloco-e-gameplay-certified
   ```

3. **Aguardar o build na Vercel:**  
   Após o push, a Vercel normalmente inicia um novo deployment. No dashboard, conferir se o deployment da branch `feature/bloco-e-gameplay-certified` concluiu com sucesso.

4. **Abrir o preview sem cache:**  
   - Abrir a URL do **novo** deployment (a que acabou de ser gerada) em **aba anônima**.  
   - Ou abrir o link do preview da branch e fazer **Ctrl+Shift+R** (hard reload).

5. **Validar a /game no preview:**  
   - Fazer login, acessar `/game`.  
   - Verificar: palco centralizado; overlays (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) centralizados; mesmos assets e HUD que a referência de produção.

6. **(Opcional) Forçar novo build na Vercel sem novo commit:**  
   Se já tiver feito push e quiser refazer o build: Vercel → Projeto → Deployments → deployment da branch → **Redeploy** (recomendado “Redeploy without cache” se existir a opção).

---

**Resumo:** Os assets certificados estão no repositório e no build. O preview “antigo/incorreto” ocorre porque as **Correções 1 e 2** (viewport e overlay root) existem apenas localmente e **não** foram commitadas nem enviadas. O preview da Vercel usa o commit **b11e96d**, que não contém essas alterações. Commitar e dar push dos três arquivos (index.html, GameFinal.jsx, game-scene.css) e depois abrir o novo preview em aba anônima com hard reload garante que o preview exibido corresponda ao código mais recente com assets restaurados e correções aplicadas.

---

*Documento gerado em 2026-03-17. Nenhuma alteração foi feita em produção, backend ou banco.*
