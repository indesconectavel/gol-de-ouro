# GUIA RÁPIDO — GO / NO-GO

**Contexto:** promoção do `goldeouro-player` na Vercel antes de teste **PIX real**.  
**Detalhe:** `docs/relatorios/DECISAO-OPERACIONAL-PROMOCAO-DEPLOY-CORRETO-PLAYER-2026-03-28.md`  
**Checklist:** `docs/operacional/CHECKLIST-PROMOCAO-DEPLOY-PLAYER-ANTES-DO-PIX-2026-03-28.md`

---

## GO

O teste **PIX real** só pode começar quando **todos** os pontos abaixo forem verdadeiros:

1. No painel Vercel, o deployment a promover foi confirmado como **`dpl_5nY2hnkbnCbbCtS9zVyPv3cyv8q5`** (id exacto).
2. A **branch** de origem desse deployment é **`feature/bloco-e-gameplay-certified`** (ou nome Git exacto equivalente mostrado pelo Vercel, sem dúvida).
3. O **commit SHA** desse deployment é **`4ff3d4804a7506c1a11f08f9bdfa0104d7ea4f97`** **ou** outro commit **registado e aprovado por escrito** para esta promoção.
4. O deployment está **Ready**.
5. A **promoção a Production** foi executada e os **aliases** de produção servem esse deployment.
6. O **smoke pós-promoção** (login, dashboard, `/game`, HUD, layout) foi executado em produção e **aprovado** sem falhas bloqueantes.
7. O **backend** usado no teste está acordado, acessível e com política CORS compatível com o domínio do player em produção.

---

## NO-GO

O teste **PIX real** está **bloqueado** se **qualquer** condição abaixo ocorrer:

- O **deployment id** no painel **não** for `dpl_5nY2hnkbnCbbCtS9zVyPv3cyv8q5` e ainda assim se pretenda usar esse fluxo sem nova decisão documentada.
- A **branch** ou o **SHA** no painel **divergirem** do esperado (`feature/bloco-e-gameplay-certified` / `4ff3d48…`) **sem** aprovação escrita explícita de substituição.
- Existir **dúvida** (“parece certo”, “deve ser o último”) **sem** confirmação copiada do painel.
- A promoção **não** foi concluída ou não se sabe qual deployment está em **Current**.
- O **smoke pós-promoção** **não** foi feito ou **falhou**.
- Há **divergência** entre o que o domínio público serve e o deployment que o painel indica como Production.

Em qualquer NO-GO: **não** executar PIX real; concluir primeiro o checklist ou escalar reconciliação.

---

## Ação imediata se houver dúvida

1. **Parar.** Não promover “à tentativa”; não testar PIX para “ver se passa”.
2. **Reabrir** apenas a **Etapa 1** do checklist: copiar do painel **id**, **branch**, **SHA**, **status**, **data**.
3. Se **qualquer** valor divergir do esperado ou estiver ilegível: tratar como **NO-GO** até haver **confirmação explícita** (painel + nota escrita da equipa).
4. Só voltar a considerar **GO** quando não restar ambiguidade sobre **qual** frontend está em produção e **qual** commit o representa.

---

*Fim do guia.*
