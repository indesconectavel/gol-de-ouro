# DECISÃO OPERACIONAL — PROMOÇÃO DO DEPLOY CORRETO — GOLDEOURO PLAYER

**Documento:** decisão técnica e plano de promoção segura do frontend `goldeouro-player` na Vercel.  
**Data:** 2026-03-28  
**Base legal técnica:** `docs/relatorios/AUDITORIA-FORENSE-DEPLOY-CORRETO-CURRENT-PLAYER-2026-03-27.md` (auditoria READ-ONLY).  
**Âmbito:** apenas frontend player; sem alteração de código, backend, variáveis ou execução remota de promoção neste documento.

**Projeto Vercel:** `goldeouro-admins-projects` / `goldeouro-player`.

---

## 1. Resumo executivo

- **Qual deploy está hoje em Current / Production**  
  **`dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX`**, servido nos aliases de produção (`app.goldeouro.lol`, `www.goldeouro.lol`, `goldeouro.lol`, `goldeouro-player.vercel.app`, etc.), conforme `vercel inspect` documentado na auditoria forense.

- **Por que esse Current está incorreto para validação alinhada ao repositório**  
  Os artefactos servidos em Production **diferem objectivamente** do build associado ao alias de branch certificada: bundles distintos (`index-qIGutT6K.js` / `index-lDOJDUAS.css` vs `index-BkwLfIcL.js` / `index-yFQt_YUB.css`), HUD com logo **150px** em Production vs regra **`body[data-page=game]` com 200px** no candidato (alinhada a `game-scene.css` e trabalho BLOCO F), e CSP servida em Production **sem** o padrão Posthog/GTM presente no `vercel.json` actual e no preview candidato.

- **Qual deploy deve ser promovido**  
  **`dpl_5nY2hnkbnCbbCtS9zVyPv3cyv8q5`**  
  URL de deployment: `https://goldeouro-player-94gvkibr7-goldeouro-admins-projects.vercel.app`  
  Alias de branch (último estado dessa branch no momento da auditoria): `https://goldeouro-player-git-feature-b-e4eeb8-goldeouro-admins-projects.vercel.app` → resolve para o mesmo `dpl_5nY2…`.  
  **Referência Git esperada (a confirmar no painel):** commit **`4ff3d4804a7506c1a11f08f9bdfa0104d7ea4f97`** ou commit **posterior explícitamente aprovado** na mesma branch `feature/bloco-e-gameplay-certified`.

- **Risco de não corrigir antes do PIX real**  
  O utilizador em produção pode estar num **frontend diferente** do que a equipa validou no código e nos relatórios recentes — risco de **falsos positivos/negativos** em testes financeiros, decisões de auditoria **não reprodutíveis** face ao repositório, e exposição a bugs de UI/fluxo já corrigidos na branch certificada mas **ausentes** no Current.

---

## 2. Base de evidências

| Evidência | Valor / descrição (fonte: auditoria forense) |
|-----------|-----------------------------------------------|
| **Deployment id actual (Production)** | `dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX` |
| **Deployment id candidato** | `dpl_5nY2hnkbnCbbCtS9zVyPv3cyv8q5` |
| **Diferença de bundles (fingerprints)** | Production: `index-qIGutT6K.js`, `index-lDOJDUAS.css` — Candidato: `index-BkwLfIcL.js`, `index-yFQt_YUB.css` |
| **Diferença CSS / HUD** | Production: logo HUD **150px** no extracto analisado — Candidato: **`body[data-page=game] … 200px`** para logo |
| **Alinhamento com branch certificada** | Candidato ligado ao alias Vercel da branch `feature/bloco-e-gameplay-certified` (truncagem `feature-b-e4eeb8` na URL); criado **2026-03-27 14:31:24 -03**, alinhado no tempo com HEAD local auditado `4ff3d48…` |
| **Alinhamento com backend real** | Em ambos os bundles analisados na auditoria: referência a **`https://goldeouro-backend-v2.fly.dev`**, coerente com `goldeouro-player/src/config/api.js` e CORS do backend documentado |

**Limitação registada:** o CLI `vercel inspect` utilizado na auditoria **não** expôs commit SHA por deployment; a confirmação do SHA é **obrigatoriamente** no painel Vercel.

---

## 3. Decisão técnica formal

| Elemento | Decisão |
|----------|---------|
| **CURRENT actual (`dpl_FyKK…`)** | **Rejeitado** como base para **validação financeira real** e para “estado oficial” alinhado à branch certificada até nova decisão documentada após eventual novo deploy. |
| **Deploy candidato (`dpl_5nY2…`)** | **Aprovado condicionalmente** para promoção a Production **apenas após** cumprimento integral da secção 4 (confirmação no painel). |
| **Condição obrigatória** | No painel Vercel, verificar que o deployment **`dpl_5nY2hnkbnCbbCtS9zVyPv3cyv8q5`** corresponde à **branch** `feature/bloco-e-gameplay-certified` (ou nome exacto mostrado pelo Git integrado) e ao **commit SHA** esperado pela equipa (**mínimo:** `4ff3d4804a7506c1a11f08f9bdfa0104d7ea4f97`, salvo decisão escrita de aceitar outro commit posterior na mesma linha). |

Se o painel mostrar **outro** SHA, **outra** branch ou **outro** deployment id para o URL que se pretende promover: **não promover** até reconciliação — ver `docs/operacional/GUIA-RAPIDO-GO-NO-GO-PROMOCAO-PLAYER-2026-03-28.md`.

---

## 4. Critério de confirmação do deploy correto (painel Vercel)

Antes de qualquer clique de promoção, o operador deve **registar por escrito** (ticket, nota ou checklist) cada item abaixo como **confirmado** ou **divergente**:

1. **Deployment id** exibido na página do deployment = **`dpl_5nY2hnkbnCbbCtS9zVyPv3cyv8q5`** (caracter a caracter).
2. **Branch** de origem do Git = **`feature/bloco-e-gameplay-certified`** (ou equivalente exacto mostrado pelo Vercel, sem ambiguidade com `main` ou outra feature).
3. **Commit SHA** = **`4ff3d4804a7506c1a11f08f9bdfa0104d7ea4f97`** **ou** outro SHA **explicitamente aprovado** por escrito pela equipa para esta promoção (anotar qual).
4. **Data/hora do deploy** coerente com a janela esperada (auditoria: **2026-03-27 14:31:24 -03** para `created` do candidato; tolerância zero para “deploy antigo com id parecido”).
5. **Status** = **Ready** (sem erro de build).
6. **Compatibilidade com branch certificada:** confirmação de que **não** se está a promover um preview de outra branch (comparar com lista de deployments e com alias `…git-feature-b-e4eeb8…` apenas como pista — **a verdade é o painel + id**).

**Regra:** qualquer campo **divergente** ou **ilegível** → **parar** — classificar como NO-GO até esclarecimento (ver guia GO/NO-GO).

---

## 5. Procedimento seguro de promoção

Ordem fixa; não avançar passo sem concluir o anterior.

1. **Abrir** o projeto **`goldeouro-player`** no dashboard Vercel (equipa `goldeouro-admins-projects`).
2. **Localizar** o deployment **`dpl_5nY2hnkbnCbbCtS9zVyPv3cyv8q5`** (pesquisa por id ou pela URL `…94gvkibr7…`).
3. **Preencher** a secção 4 deste documento (ou checklist Etapa 1 em `docs/operacional/CHECKLIST-PROMOCAO-DEPLOY-PLAYER-ANTES-DO-PIX-2026-03-28.md`) com valores **copiados** do painel (não de memória).
4. **Comparar** os artefactos esperados **opcionalmente** com verificação HTTP leve pós-decisão: após promoção, o `index.html` em `https://app.goldeouro.lol` deve referenciar os mesmos ficheiros que o deployment promovido (ex.: `index-BkwLfIcL.js` / `index-yFQt_YUB.css` **só** se ainda forem os do candidato no momento da promoção — os hashes podem mudar em builds futuros; o critério forte é **id do deployment** promovido = `dpl_5nY2…` até novo build).
5. **Executar a acção de promoção a Production** conforme a UI Vercel do projecto (ex.: “Promote to Production” / atribuir a domínios de produção — usar a acção que o projecto já utiliza habitualmente; este documento não prescreve o rótulo exacto da UI).
6. **Aguardar** conclusão e propagação; **não** iniciar PIX durante a propagação.
7. **Verificar** que os **aliases** de produção listados na auditoria apontam para o deployment promovido (repetir `vercel inspect https://app.goldeouro.lol` ou equivalente no painel).
8. **Executar** o smoke test da secção 6 **antes** de qualquer teste PIX real.

---

## 6. Smoke test obrigatório pós-promoção

Executar em **produção** (`https://app.goldeouro.lol` ou domínio principal acordado), com browser limpo ou janela anónima preferencialmente, utilizador de teste acordado.

| # | Verificação | Critério de sucesso |
|---|-------------|---------------------|
| 1 | **Home** | `/` carrega; sem erro de consola bloqueante; página de login visível |
| 2 | **Login** | Autenticação completa com credenciais de teste; redireccionamento coerente |
| 3 | **Dashboard** | `/dashboard` acessível autenticado; sem página em branco |
| 4 | **`/game`** | Rota `/game` acessível autenticado; jogo carrega sem crash imediato |
| 5 | **HUD** | Logo e stats no header coerentes com baseline esperada (**200px** logo no contexto jogo, área de “Recarregar” utilizável — conforme critérios da equipa) |
| 6 | **Layout** | Palco centralizado, sem layout partido óbvio em viewport de referência (ex. desktop 1920×1080) |
| 7 | **Ausência de versão antiga** | Sem banner de versão indevido (baseline: `VITE_SHOW_VERSION_BANNER` falso por defeito no código; ausência de UI claramente legada) |
| 8 | **Regressão visual crítica** | Nada que impeça conclusão segura de “UI de produção alinhada ao esperado” (decisão humana explícita) |

**Falha em qualquer linha crítica (1–5):** **NO-GO** para PIX até correcção ou novo deploy.

---

## 7. Regra de liberação para o teste PIX real

### GO (teste PIX real permitido)

Simultaneamente verdadeiro:

- Confirmação no painel (secção 4) **cumprida** sem divergências.
- Promoção concluída; **Current** de produção = deployment **intencional** (id anotado após promoção).
- Smoke da secção 6 **aprovado** por quem executa o teste (assinatura/data no checklist operacional).
- Backend de produção acordado para o teste (**ex.:** `https://goldeouro-backend-v2.fly.dev`) está **operacional** (health acordado pela equipa) e **CORS** cobre o domínio do player em produção.

### NO-GO (teste PIX real proibido)

Qualquer uma:

- SHA, branch ou deployment id **não** confirmados ou **divergentes** do esperado.
- Promoção **não** concluída ou dúvida sobre qual deployment está nos aliases.
- Smoke **falhou** ou **não executado**.
- Dúvida residual sobre “qual UI o utilizador vê” vs “qual commit está em produção”.

---

## 8. Riscos evitados com a promoção correta

- Testar PIX contra **artefacto errado** (Current defasado).
- **Desalinhamento** entre repositório certificado e o que os utilizadores veem em `goldeouro.lol`.
- **Conclusões de auditoria** baseadas num build que **não** inclui correcções de HUD/`/game` já integradas na branch certificada.
- **Tempo perdido** a depurar problemas já corrigidos noutro build.
- **Responsabilização ambígua** (“funcionou no preview, falhou em produção”) por **dois** frontends diferentes sem awareness explícita.

---

## 9. Veredito final

**PROMOÇÃO RECOMENDADA**

**Justificativa objectiva:** a auditoria forense consolidou diferenças mensuráveis entre Production e o candidato `dpl_5nY2hnkbnCbbCtS9zVyPv3cyv8q5`; o candidato está alinhado ao alias da branch certificada e aos artefactos esperados para o estado recente do player. A promoção é **recomendada** como **direcção técnica correcta**.

**Corolário operacional:** até a **Etapa 1** do checklist (`docs/operacional/CHECKLIST-PROMOCAO-DEPLOY-PLAYER-ANTES-DO-PIX-2026-03-28.md`) estar **100%** concluída com confirmações positivas, o estado efectivo para PIX é **NO-GO** (ver guia rápido).

**Se o painel não confirmar** o id `dpl_5nY2…` com branch e SHA esperados: **PROMOÇÃO BLOQUEADA** para esse alvo — abrir incidente de reconciliação antes de promover qualquer outro deployment “por proximidade de data”.

---

## Referências cruzadas

- `docs/relatorios/AUDITORIA-FORENSE-DEPLOY-CORRETO-CURRENT-PLAYER-2026-03-27.md`
- `docs/operacional/CHECKLIST-PROMOCAO-DEPLOY-PLAYER-ANTES-DO-PIX-2026-03-28.md`
- `docs/operacional/GUIA-RAPIDO-GO-NO-GO-PROMOCAO-PLAYER-2026-03-28.md`

---

*Fim do documento de decisão operacional.*
