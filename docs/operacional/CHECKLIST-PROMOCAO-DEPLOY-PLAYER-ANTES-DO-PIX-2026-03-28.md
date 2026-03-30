# CHECKLIST — PROMOÇÃO DO PLAYER ANTES DO PIX

**Objetivo:** zero ambiguidade antes de teste PIX real.  
**Referência:** `docs/relatorios/DECISAO-OPERACIONAL-PROMOCAO-DEPLOY-CORRETO-PLAYER-2026-03-28.md`  
**Candidato a promover:** `dpl_5nY2hnkbnCbbCtS9zVyPv3cyv8q5`  
**SHA esperado (confirmar no painel):** `4ff3d4804a7506c1a11f08f9bdfa0104d7ea4f97` ou outro **aprovado por escrito**  
**Branch esperada:** `feature/bloco-e-gameplay-certified`

**Instrução:** só marcar `[x]` com valores **copiados** do painel Vercel / evidência objectiva. Se qualquer item falhar, **parar** — PIX continua bloqueado.

---

## Etapa 1 — Confirmar o deployment no painel

- [ ] **Deployment id** no painel = `dpl_5nY2hnkbnCbbCtS9zVyPv3cyv8q5` (exacto)
- [ ] **Branch** de origem = `feature/bloco-e-gameplay-certified` (ou nome exacto Git sem equivalência duvidosa)
- [ ] **Commit SHA** = `4ff3d4804a7506c1a11f08f9bdfa0104d7ea4f97` **ou** outro SHA anotado e **aprovado por escrito** para esta promoção: `________________`
- [ ] **Status** = Ready (sem falha de build)
- [ ] **Data/hora do deploy** anotada do painel: `________________` (coerente com deploy pretendido)
- [ ] **Sem ambiguidade** entre este deployment e outro preview recente (verificado que não se está a usar URL de deployment diferente por engano)

**Executado por:** ________________ **Data:** ________________

---

## Etapa 2 — Promover para Current

- [ ] **Promoção** a Production executada no projecto `goldeouro-player` (acção UI Vercel concluída)
- [ ] **Aliases** de produção (`app.goldeouro.lol`, `www.goldeouro.lol`, `goldeouro.lol`, etc.) **revisados** no painel e apontando para o deployment promovido
- [ ] **Current** / Production no dashboard corresponde ao deployment **intencional** (id anotado após promoção): `________________`
- [ ] **Domínio principal** abre a aplicação sem erro 5xx; `index.html` referencia assets do deployment esperado (verificação opcional por DevTools / fonte da página)

**Executado por:** ________________ **Data:** ________________

---

## Etapa 3 — Smoke pós-promoção

*(Ambiente: produção, domínio principal; utilizador de teste acordado.)*

- [ ] **Login** OK
- [ ] **Dashboard** OK (`/dashboard`)
- [ ] **`/game`** OK (acesso autenticado, sem crash imediato)
- [ ] **HUD** correto (logo/stats/Recarregar conforme baseline da equipa)
- [ ] **Layout** correto (sem quebra crítica em viewport de teste)
- [ ] **Sem tela antiga** / interface legada evidente
- [ ] **Sem regressão visual crítica** (julgo humano explícito: sim/não: ______)

**Executado por:** ________________ **Data:** ________________

---

## Etapa 4 — Liberação para PIX

- [ ] **Frontend** em produção = build confirmado (Etapa 1–2) e smoke **aprovado** (Etapa 3)
- [ ] **Backend** acordado para o teste (ex.: Fly `goldeouro-backend-v2`) **operacional** — health verificado pela política interna
- [ ] **Smoke** aprovado (todas as caixas relevantes da Etapa 3)
- [ ] **Validação financeira (PIX real)** explicitamente **liberada** pelo responsável: ________________

**Só após todos os itens acima:** GO para iniciar teste PIX real.

---

*Fim do checklist.*
