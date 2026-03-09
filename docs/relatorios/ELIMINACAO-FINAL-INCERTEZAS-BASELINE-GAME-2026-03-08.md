# ELIMINAÇÃO FINAL DAS INCERTEZAS — BASELINE /game

**Data:** 2026-03-08  
**Modo:** READ-ONLY absoluto (nenhuma alteração de código, branch, deploy, Vercel ou produção).  
**Objetivo:** Eliminar as últimas incertezas sobre a baseline oficial FyKKeg6zb e a página `/game`, com o máximo de evidência possível, sem alterar nada.

---

## 1. Cadeia de prova da baseline

Reconstrução da cadeia mais forte possível a partir dos artefatos e relatórios analisados:

| Elo | Dado | Fonte | Sólido? |
|-----|------|--------|--------|
| Deployment | FyKKeg6zb (dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX) | baseline-frontend-fingerprint.json, BASELINE-FRONTEND-FYKKeg6zb-OFICIAL | **Sim** |
| Bundle JS | index-qIGutT6K.js | baseline-frontend-bundles.json, fingerprint, GET em produção na época | **Sim** |
| Bundle CSS | index-lDOJDUAS.css | idem | **Sim** |
| Build date | 2026-01-16T05:25:34Z | Last-Modified do asset em produção (POST-ROLLBACK-VERCEL-FyKKeg6zb), baseline-build-info.json | **Sim** |
| Commit inferido | 0a2a5a1 (ou 7dbb4ec) | baseline-commit-origin.json, BASELINE-FYKKeg6zb-COMMIT-ORIGEM, DIFF-PR29 | **Inferido** |
| Branch | main | documentação e inferência (deploy a partir de main) | **Inferido** |
| Estado funcional de `/game` | Qual componente (Game vs GameShoot) montado em `/game` | — | **Não documentado** |

**Onde a cadeia já é sólida:**  
Identidade do deployment (FyKKeg6zb), identidade dos bundles (qIGutT6K, lDOJDUAS), data do build (16 Jan 2026) e que produção atual ≠ baseline estão estabelecidos por documentação e, quando aplicável, por respostas HTTP/GET aos assets.

**Onde ela ainda é inferida:**  
O commit exato que o Vercel usou para o build não está gravado no repositório nem nos artefatos; a equivalência é inferida por “último commit no player antes do build” e por referências documentais (DIFF-PR29: 0a2a5a1 ou anterior). O estado das rotas no App.jsx da baseline (qual componente servia `/game`) não foi registrado em nenhum artefato.

**Elo que ainda falta:**  
(1) Commit SHA exato associado ao deployment FyKKeg6zb (apenas via API/dashboard Vercel).  
(2) Declaração explícita das rotas no build da baseline (App.jsx no commit da baseline ou inspeção do bundle para o mapeamento path → componente).

---

## 2. Commit proxy definitivo

**Evidência reavaliada:**

- **0a2a5a1** — Merge PR #18 (security/fix-ssrf), 2025-11-15; citado em DIFF-PR29 como possível commit em main na época do build; referência estável em baseline-commit-origin.json.
- **7dbb4ec** — Último commit que altera `goldeouro-player/` antes do intervalo sem commits (2025-11-15); fix CSP; também candidato ao mesmo build.
- **d8ceb3b** — Checkpoint “pre-v1 stable”, 2026-02-05; posterior ao build de 16 Jan; não é o commit do FyKKeg6zb, e sim referência documental estável.

**Respostas:**

- **Commit proxy mais forte hoje:** **0a2a5a1** (merge que consolida main na época; 7dbb4ec é ancestral imediato no player).
- **Concorrente real a 0a2a5a1?** **7dbb4ec** — mesmo período, mesmo path; o build de 16 Jan pode ter usado 0a2a5a1 ou um ancestral (ex.: 7dbb4ec). Não há evidência que distinga qual dos dois foi efetivamente usado.
- **Confiança:** Continua **MÉDIA**. Sobe para ALTA apenas com: SHA retornado pela Vercel para FyKKeg6zb, ou build local a partir de 0a2a5a1 (e/ou 7dbb4ec) que reproduza exatamente o hash qIGutT6K/lDOJDUAS.
- **O commit proxy é suficiente para agir?** **Sim.** É suficiente para: checkout do commit proxy, build local, comparação de fingerprint com a baseline; e, se necessário, inspeção do App.jsx nesse commit para ver qual componente está em `/game`. O proxy não confirma o SHA exato do Vercel, mas permite reproduzir um estado de código coerente com a baseline.

---

## 3. Engenharia reversa documental do bundle

**Disponibilidade do bundle:**  
Não há cópia local do arquivo `index-qIGutT6K.js` no workspace (busca por `index-qIGutT6K`, `backups/`, `prod-assets-index.js` não encontrou arquivos). O relatório BACKUP-GAME-FYKKeg6zb-2026-03-04 cita `backups/game-FyKKeg6zb-2026-03-04/` com hashes SHA256; esse caminho não existe no repositório atual. A análise baseia-se apenas em documentação e artefatos já existentes.

**Artefatos usados:**

- **baseline-frontend-game.json:**  
  - `has_game: true`, `has_games_shoot: true`  
  - `bundle_length_bytes: 478903`  
  - Elementos esperados: saldo, apostas, campo, goleiro, bola, botões/zonas de chute, menu principal.

- **RELEASE-CHECKPOINT / CHANGE-2 (verificacao-producao-readonly):**  
  Conteúdo do bundle em produção (index-qIGutT6K) foi baixado e analisado. Strings encontradas no bundle:
  - “Saldo insuficiente” — presente (gameService / fluxo de chute).
  - “Recarregar” — presente (label de botão).
  - “Erro ao processar chute” — presente.
  - Trecho minificado: `throw console.error("? [GAME] Saldo insuficiente:",this.userBalance,"<",r),new E` — consistente com gameService (checagem de saldo antes do chute).

**Respostas com base apenas em evidências locais/documentais:**

- **O bundle baseline contém sinais de Game?**  
  **Sim** — o indicador `has_game: true` no baseline-frontend-game.json indica presença de referências a “game” no bundle (não necessariamente o componente React “Game”, mas o bundle inclui código associado ao domínio “game”). O código atual tem Game.jsx; no build da baseline esse módulo pode estar incluído (tree-shaking dependendo das rotas).

- **O bundle baseline contém sinais de GameShoot?**  
  **Sim** — `has_games_shoot: true` e as strings “Saldo insuficiente”, “Recarregar”, “[GAME] Saldo insuficiente” e “Erro ao processar chute” são consistentes com o fluxo de GameShoot/gameService (chamada a API, bloqueio por saldo, botão Recarregar).

- **Strings/nomes/fingerprints que indiquem qual página do jogo estava ativa?**  
  **Não.** Nenhum artefato registra busca por padrões como `path="/game"`, `Route`, `GameShoot` ou `Game` no conteúdo do bundle. As strings encontradas mostram que o **fluxo de jogo com backend** (gameService) estava presente no bundle; não mostram qual componente estava montado para a rota `/game`.

- **Presença simultânea de has_game e has_games_shoot:**  
  Indica **coexistência no código** (ambos os módulos ou referências estão no bundle ou na árvore de módulos do build). **Não** indica qual deles o router usava para `/game`; isso dependeria da configuração de rotas no App no commit do build, que não está documentada no bundle nos artefatos disponíveis.

**Conclusão da seção:**  
O bundle baseline contém indícios funcionais de **Game** e de **GameShoot**/gameService. Não há evidência documentada que permita concluir, só pelo bundle, qual componente servia `/game` na baseline.

---

## 4. Correlação entre rota e componente na baseline

**Evidência direta:**  
Nenhuma. Nenhum documento nem artefato declara “na baseline, `/game` era servido por Game.jsx” ou “por GameShoot.jsx”. O baseline-frontend-game.json descreve elementos esperados e indicadores do bundle; não menciona o nome do componente nem o App.jsx do build.

**Inferências possíveis:**

- **A) `/game` usava GameShoot**  
  Argumento: documentação posterior (baseline-frontend-game.json, AUDITORIA-READONLY-VERSIONWARNING, etc.) trata o “/game atual” como a experiência validada, e no código atual (e no main que gerou produção atual) `/game` → GameShoot. O bundle baseline contém strings do gameService.  
  Fraqueza: “atual” pode referir-se ao estado pós-baseline; não há prova de que o App da baseline tinha a mesma configuração de rotas que o main atual.

- **B) `/game` usava Game**  
  Argumento: o print validado e a descrição dos “elementos esperados” (campo em destaque, goleiro, alvos, bola, “menu principal”) alinham-se mais com Game.jsx do que com GameShoot.jsx (campo 400×300, “Recarregar” no header).  
  Fraqueza: o print não está atestado como “exatamente o que estava na baseline”; pode ser referência visual ou de outra fase. A documentação não diz que a baseline montava Game em `/game`.

- **C) `/game` usava outro estado/componente**  
  Não há evidência de um terceiro componente servindo `/game`; os únicos candidatos documentados são Game e GameShoot.

**Conclusão:**  
Não existe evidência direta. A inferência mais forte **não pode ser escolhida com segurança** entre A e B apenas com os artefatos atuais: os indícios do bundle (gameService) favorecem levemente A; o alinhamento do print com Game favorece B. **Grau de confiança da inferência:** **BAIXO** — não é possível afirmar A, B ou C sem inspecionar o App.jsx no commit da baseline ou o mapeamento de rotas no bundle.

---

## 5. Comparação final com o print validado

**Referência:** Print validado pelo usuário como referência visual da tela do jogo (campo, goleiro, alvos, bola, elementos de saldo/apostas, botão tipo menu).

**Cruzamento com:**

- **Game.jsx:** Layout mais próximo: GameField com estádio, goleiro, 6 alvos circulares, bola, botão “Menu” no canto; saldo, chutes, ganhos na UI. Não implementa a barra exata do print (seletor R$1–R$10, “MENU PRINCIPAL”).
- **GameShoot.jsx:** Campo fixo 400×300, “Recarregar” no header, “Dashboard”; estatísticas (Gols, Defesas, Gols de Ouro). Mais distante da descrição “campo em destaque” e “menu principal” do print.
- **baseline-frontend-game.json:** Lista elementos esperados (saldo, apostas, campo, goleiro, bola, botões/zonas de chute, menu principal); não descreve qual componente os implementa.

**Respostas:**

- **O print validado é compatível com a descrição documental da baseline?**  
  **Sim.** Os elementos do print coincidem com a lista de “elementos centrais esperados” do baseline-frontend-game.json (saldo, apostas, campo, goleiro, bola, zonas de chute, menu principal).

- **O print validado parece mais alinhado com o visual de Game.jsx do que com o texto dos relatórios?**  
  **Sim.** Os relatórios (AUDITORIA-PROFUNDA-CONFLITO-GAME, VARREDURA-TOTAL) afirmam que Game.jsx é o que mais se aproxima do layout do print (campo em destaque, goleiro, alvos circulares, bola, botão Menu no canto). O texto dos relatórios descreve GameShoot como mais distante (400×300, Recarregar no header).

- **Isso sugere que:**  
  - **A)** O print é da baseline e a tela validada era do tipo “Game” (layout rico, menu no canto) — plausível, mas não provado.  
  - **B)** O print é de outra fase do projeto — possível.  
  - **C)** O print foi lembrado como referência visual, não como fonte exata da baseline — possível.  
  Com as evidências atuais não é possível distinguir A, B ou C; apenas que **visualmente** o print está mais próximo de Game.jsx do que de GameShoot.jsx.

---

## 6. Matriz de certeza

| # | Pergunta | Evidência direta | Evidência indireta | Grau de certeza |
|---|----------|------------------|--------------------|-----------------|
| 1 | FyKKeg6zb é a baseline oficial? | Documentação (BASELINE-FRONTEND-FYKKeg6zb-OFICIAL, baseline-frontend-*), fingerprint, rollback definido | Deploy designado como baseline em múltiplos relatórios e JSONs | **Alta** |
| 2 | qIGutT6K é o bundle baseline? | baseline-frontend-bundles.json, fingerprint (bundle_js_principal), GET em produção na época | Referência estável em todos os artefatos de baseline | **Alta** |
| 3 | 0a2a5a1 é o commit proxy mais forte? | baseline-commit-origin.json, BASELINE-FYKKeg6zb-COMMIT-ORIGEM, DIFF-PR29 | Último merge em main antes do build; sem commits no player entre 2025-11-15 e 2026-02-05 | **Média** |
| 4 | `/game` da baseline usava GameShoot? | Nenhuma | Bundle tem has_games_shoot e strings de gameService; docs tratam “/game atual” como GameShoot | **Baixa** |
| 5 | `/game` da baseline usava Game? | Nenhuma | Print e “elementos esperados” alinham-se mais com Game.jsx; has_game no bundle | **Baixa** |
| 6 | O print validado corresponde exatamente à baseline? | Nenhuma | Print compatível com elementos esperados da baseline; visualmente próximo de Game.jsx | **Baixa** |

---

## 7. Conclusão técnica definitiva

- **Melhor conclusão hoje sobre a página `/game` da baseline:**  
  **Indeterminada.** O bundle da baseline contém indícios de ambos Game e GameShoot (has_game, has_games_shoot e strings de gameService). Qual componente estava montado em `/game` no App do build **não é demonstrável** com os artefatos atuais; exige inspeção do App.jsx no commit da baseline ou do mapeamento de rotas no bundle.

- **Melhor conclusão hoje sobre o commit da baseline:**  
  O **commit proxy mais forte** é **0a2a5a1** (ou, no mesmo nível de plausibilidade, **7dbb4ec**). O commit exato usado pelo Vercel para FyKKeg6zb não está registrado no repositório; a equivalência é inferida e suficiente para ação (reprodução de build e validação por fingerprint).

- **Já existe informação suficiente para agir com segurança?**  
  **Sim**, para: (1) alinhar o local à baseline via commit proxy e validar por fingerprint; (2) definir critérios para futuros deploys e rollback; (3) comparar builds com qIGutT6K/lDOJDUAS.  
  **Não**, para: afirmar com segurança qual componente (Game ou GameShoot) servia `/game` na baseline — isso exige reconstruir o build ou acessar metadata do Vercel/inspecionar o bundle.

- **O que ainda permanece impossível de provar sem metadata Vercel ou reconstrução do build?**  
  (1) SHA exato do commit associado ao deployment FyKKeg6zb.  
  (2) Qual componente estava montado em `/game` no build da baseline (Game vs GameShoot).  
  (3) Confirmação de que um build local a partir de 0a2a5a1 (ou 7dbb4ec) gera exatamente os hashes qIGutT6K e lDOJDUAS (depende de dependências e ambiente idênticos).

---

## 8. Decisão operacional

**Opção recomendada:** **E) Combinação das anteriores**, com prioridade **A** e complemento **B**.

- **A) Alinhar o local ao commit proxy 0a2a5a1 e validar por fingerprint**  
  Justificativa: o proxy é o mais bem sustentado pelos artefatos; permite trazer o repositório local ao estado coerente com a baseline, buildar e comparar bundle/fingerprint com qIGutT6K/lDOJDUAS. Se os hashes coincidirem, confirma-se o elo commit → baseline; se não, ainda assim o App.jsx nesse commit pode ser inspecionado para ver qual componente está em `/game`.

- **B) Reconstruir localmente a baseline e então inspecionar `/game`**  
  Justificativa: é o único modo de eliminar a última dúvida (qual componente servia `/game`) sem acesso à API Vercel. Checkout 0a2a5a1 (ou 7dbb4ec), build, abrir /game no build gerado e registrar qual tela é renderizada (Game ou GameShoot).

- **C) Investigar o bundle qIGutT6K de forma mais profunda**  
  Requer obter uma cópia do bundle (ex.: novo download a partir de um deployment que ainda sirva esse asset, ou uso do backup citado em BACKUP-GAME se disponível noutro local). Útil para buscar padrões de rotas/componentes no JS minificado; não foi possível no escopo read-only atual por não haver cópia no workspace.

- **D) Acessar metadata Vercel**  
  Eliminaria a dúvida do commit exato e, se a Vercel expuser o código-fonte do deploy, também o App.jsx da baseline. Não foi feito por restrição read-only e por não alterar produção/ferramentas.

**Resposta direta:** O próximo passo cirúrgico correto é **A** (alinhar local ao 0a2a5a1 e validar por fingerprint), complementado por **B** (reconstruir e inspecionar `/game` nesse build) para fechar a questão do componente. **C** e **D** são opções adicionais se se quiser máxima certeza sem depender de reconstrução local ou se houver acesso à API Vercel.

---

## Classificação final

**INCERTEZAS REDUZIDAS AO MÍNIMO TÉCNICO POSSÍVEL**

- A identidade da baseline (FyKKeg6zb, bundle qIGutT6K/lDOJDUAS), o commit proxy (0a2a5a1 ou 7dbb4ec) e a divergência local/produção em relação à baseline estão estabelecidos com o máximo de evidência possível em modo read-only.
- A única incerteza substantiva restante — **qual componente servia `/game` na baseline** — não pode ser eliminada sem: (a) reconstruir o build a partir do commit proxy e inspecionar a rota, ou (b) inspecionar o bundle ou o App no commit, ou (c) acessar metadata do Vercel. Nenhuma dessas ações foi realizada nesta auditoria para manter o modo read-only absoluto.
- Portanto, as incertezas foram reduzidas ao mínimo técnico possível **sem** alterar código, branch, deploy ou produção e **sem** dispor de cópia do bundle ou da API Vercel.

---

*Auditoria realizada em modo read-only absoluto; nenhum código, rota, backend, deploy, produção ou Vercel foi alterado. Foco exclusivo nas lacunas restantes da baseline e da página `/game`.*
