# PREPARAÇÃO I5 — SEGURA, CURRENT PROTEGIDO (READ-ONLY DE EXECUÇÃO)

**Projeto:** Gol de Ouro  
**Data:** 2026-03-17  
**Modo:** EXECUÇÃO CONTROLADA — operações de git apenas (commit, tag, push). Nenhuma alteração em deploy, banco ou lógica de jogo.

**Objetivo:** Congelar o estado atual do repositório antes da Fase 1 (idempotência do chute), criando um ponto de rollback confiável, sem tocar no deploy atual em produção.

---

## 1. Branch utilizada

- **Branch atual:** `feature/bloco-e-gameplay-certified`  
- **Situação em relação ao remoto:** após a preparação, a branch está sincronizada com `origin/feature/bloco-e-gameplay-certified` (sem commits locais pendentes).

---

## 2. Commit criado

Foi criado um **commit de segurança** contendo o estado atual de trabalho (backend, player e relatórios de auditoria da Fase I):

- **Hash:** `16177266d702a75c101947e9bf397540acaeb103`  
- **Mensagem:**  
  `backup: estado antes da fase 1 (idempotência do chute)`  
- **Conteúdo incluído (alto nível):**
  - Atualizações em `README.md`.  
  - Atualizações em `server-fly.js` e em arquivos do player (`App.jsx`, `Dashboard.jsx`, `GameFinal.jsx`, `GameShoot.jsx`, `Pagamentos.jsx`, `Profile.jsx`, `Withdraw.jsx`, `gameService.js`).  
  - Inclusão dos relatórios técnicos em `docs/relatorios/*.md` (auditorias, planos, mapas de risco, matriz de prioridade, plano de execução, diagnóstico I5, pré-execução, etc.).  
  - Inclusão de componentes e backups visuais do player (`InternalPageLayout.jsx`, `TopBar.jsx`, arquivos de layout/scene backup).

**Estado pós-commit:** `git status -sb` mostra apenas três arquivos não rastreados em `docs/` (documentos de arquitetura/roadmap mais gerais), ou seja, o fluxo de jogo e relatórios de auditoria I estão totalmente versionados.

---

## 3. Tag criada

Foi criada uma **tag oficial de rollback** apontando para o commit acima:

- **Tag:** `pre-fase1-idempotencia-2026-03-17`  
- **Aponta para:** commit `16177266d702a75c101947e9bf397540acaeb103` na branch `feature/bloco-e-gameplay-certified`.

Essa tag é o ponto de restauração formal \"antes da Fase 1 (idempotência do chute)\".

---

## 4. Status do push

Foram feitos os seguintes pushes para o remoto (`origin`):

- **Push da branch:**
  - Comando: `git push origin feature/bloco-e-gameplay-certified`  
  - Resultado:  
    `95bbfd0..1617726  feature/bloco-e-gameplay-certified -> feature/bloco-e-gameplay-certified`

- **Push da tag:**
  - Comando: `git push origin pre-fase1-idempotencia-2026-03-17`  
  - Resultado:  
    `* [new tag]         pre-fase1-idempotencia-2026-03-17 -> pre-fase1-idempotencia-2026-03-17`

**Conclusão:**  
tanto a **branch** quanto a **tag** que representam o estado atual de trabalho antes da Fase 1 estão salvas no remoto.

---

## 5. Estado de rollback

Com os passos acima, o rollback para o estado atual fica claramente definido:

- Para voltar ao estado antes da Fase 1 (idempotência do chute), basta:
  - Fazer checkout do commit/tag: `git checkout pre-fase1-idempotencia-2026-03-17` **ou**  
  - Configurar o pipeline/deploy (backend/frontend) para usar essa tag/commit como fonte.

Isso vale tanto para:

- **Backend:** re-deploy a partir da tag.  
- **Frontend (player):** re-deploy a partir da mesma tag (ou do mesmo commit na branch).

Nenhuma alteração de banco foi feita; portanto, rollback de banco **não** faz parte desta preparação.

---

## 6. Confirmação de que o current permanecerá intocado

Com este preparo:

- O **deploy atual em produção** (backend + player) **permanece intocado**.  
- O commit e a tag criados são apenas referências de código no repositório; **nenhum build ou deploy foi promovido** para produção principal neste bloco.  
- Qualquer trabalho da Fase 1 (implementação de idempotência do chute) deve ocorrer **em cima da branch/tag atual**, mas:
  - Pode (e deve) ser testado em **ambiente isolado** (preview, canary, staging) **antes** de tocar no deploy atual.  
  - Só após validação e aprovação é que um novo deploy para produção poderá ser considerado, sempre com a garantia de rollback rápido para `pre-fase1-idempotencia-2026-03-17`.

**Regra explícita:**  
A preparação aqui **não altera** o current em produção; apenas cria um \"ponto de retorno\" sólido para qualquer futura alteração.

---

## 7. Próximo passo seguro

Com o estado atual congelado e protegido, o próximo passo seguro é:

1. **Implementar a Fase 1 (idempotência do chute)** em cima da branch `feature/bloco-e-gameplay-certified` (ou em uma nova branch derivada dela), usando a tag `pre-fase1-idempotencia-2026-03-17` como referência de base estável.  
2. **Deploy apenas em ambiente isolado** (preview/canary), conectado a uma base de testes ou a um subconjunto controlado de usuários, para validar:  
   - Envios de `X-Idempotency-Key` pelo frontend.  
   - Rejeição de duplicatas (409) no backend.  
   - Ausência de regressões em saldo e registros de chutes.  
3. **Somente após validação** considerar merge/deploy para produção, sempre com a possibilidade de rollback imediato para `pre-fase1-idempotencia-2026-03-17`.

---

## 8. Observações

- Este bloco **não mexe** em:
  - Deploy atual (backend ou frontend).  
  - Banco de dados (Supabase/PostgreSQL).  
  - Regras de jogo ou lógica de saldo.  
- O commit e a tag criados **preservam** o estado atual do repositório para futura referência, auditoria e rollback.  
- A presença de outras tags (v1.2.0, v1.2.1, v3.0.0-golden-goal, etc.) continua válida, mas `pre-fase1-idempotencia-2026-03-17` passa a ser a referência oficial de \"antes da Fase 1\".\n+
---

*Documento gerado após execução controlada de git (commit/tag/push). Nenhuma alteração foi feita em deploy ou banco de dados. O current em produção permanece exatamente como estava antes deste bloco.*

