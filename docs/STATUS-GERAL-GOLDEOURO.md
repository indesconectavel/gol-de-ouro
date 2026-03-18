# 📊 STATUS GERAL — PROJETO GOL DE OURO

**Última atualização:** 2026-03-17  
**Fonte:** Consolidação dos relatórios em `docs/relatorios/` e `docs/ARQUITETURA-BLOCOS-GOLDEOURO.md`

---

## 1. Visão geral do sistema

O **Gol de Ouro** é um jogo de apostas (chute ao gol) organizado em **blocos auditáveis**. O sistema está **em produção** e funcional: usuários depositam (PIX), apostam em chutes, recebem prêmios e podem sacar. O fluxo principal (autenticação, saldo, gameplay, feedback visual) está operando.

Neste momento há **dois eixos em evolução**: (1) **BLOCO F — Interface** — validação visual da tela `/game`, com regressões identificadas no preview; (2) **Fase I.5 — Idempotência do chute** — implementada em código na branch de trabalho, aguardando validação final em ambiente de preview. A **produção permanece protegida** (referência de rollback: tag `pre-fase1-idempotencia-2026-03-17`). O veredito geral do ciclo atual é **BLOQUEADO** para promoção do preview à produção até correção das regressões visuais e conclusão da validação da idempotência.

---

## 2. Status por BLOCO

### 📦 BLOCO A — Financeiro

- **Status:** 🟢 **VALIDADO**
- **Escopo:** depósitos PIX, saques PIX, webhooks, worker de payout, ledger financeiro.
- **Observações:** Aprovado tecnicamente; fluxo financeiro E2E e conciliação já auditados em relatórios anteriores.

---

### 📦 BLOCO B — Sistema de Apostas

- **Status:** 🟢 **VALIDADO**
- **Escopo:** modelo matemático, valor da aposta, estrutura de lote, premiação.
- **Observações:** Estrutura de lotes e premiação alinhadas ao desenho da V1.

---

### 📦 BLOCO D — Sistema de Saldo

- **Status:** 🟡 **VALIDADO COM RESSALVAS**
- **Escopo:** controle de saldo, débito no chute, crédito no prêmio, concorrência de saldo.
- **Observações:** Funciona dentro do esperado para V1; riscos de concorrência e ausência de transação atômica saldo+chute documentados; patch de rollback já utilizado em episódios anteriores.

---

### 📦 BLOCO E — Gameplay

- **Status:** 🟣 **ENCERRADO PREMIUM**
- **Escopo:** engine do jogo, contador de chutes, lógica de gol, registro de chutes, premiação.
- **Observações:** Totalmente auditado e congelado; referência oficial para o núcleo do jogo. A Fase I.5 (idempotência) atua sobre o *fluxo* de chute sem alterar a lógica de gameplay.

---

### 📦 BLOCO F — Interface

- **Status:** 🔵 **EM VALIDAÇÃO (com regressões)**
- **Escopo:** telas do jogo, fluxo de navegação, UX do chute, feedback visual.
- **Observações:** Em produção, a tela `/game` está conforme o layout aprovado (overlays centralizados, assets corretos). No **preview** da branch `feature/bloco-e-gameplay-certified` foram reportadas: overlays de resultado (ex.: GOOOL) no **canto inferior esquerdo** em vez do centro; possível divergência de asset no GOOOL. Essas regressões bloqueiam a promoção do preview para produção até correção e nova validação.

---

## 3. Status técnico do backend

- **Estabilidade:** O backend em produção está estável; endpoints de autenticação, saldo, chute, depósito e saque operam conforme o esperado. Incidentes pontuais (ex.: máquinas Fly, SMTP) foram tratados em ciclos anteriores e documentados.
- **Riscos conhecidos:** (1) Idempotência do chute em memória — cache perdido em restart; não compartilhado entre instâncias. (2) Ausência de transação atômica entre UPDATE de saldo e INSERT em `chutes`. (3) Contador global e Gol de Ouro sujeitos a deriva em cenários de escala/concorrência — escopo de fases futuras. (4) Em produção atual, o cliente **não** envia `X-Idempotency-Key`, portanto o risco de débito duplicado por retry/clique duplo permanece até a adoção do player com I.5 em produção.
- **Pontos já auditados:** Fluxo de chute (diagnóstico I.5), suporte a idempotência no endpoint `/api/games/shoot`, financeiro E2E, conciliação, ledger e workers de saque — documentados em `docs/relatorios/`.

---

## 4. Status do frontend (/game)

- **Estado atual (produção):** A página `/game` usa `GameFinal.jsx` e `layoutConfig.js` (base 1920x1080). Stage, HUD, zonas clicáveis, goleiro, bola e overlays (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) estão configurados; overlays são renderizados via `createPortal` no `document.body` com posicionamento central (`top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`). Assets: `goool.png`, `ganhou.png`, `defendeu.png`, `golden-goal.png`.
- **Problemas identificados (preview):** Overlays deslocados para o canto inferior esquerdo; possível asset diferente para GOOOL. Estrutura geral (stage, HUD, targets) permanece igual à produção; a discrepância é na camada visual dos overlays.
- **Nível de prontidão:** **Produção** — pronto e em uso. **Preview** — não pronto para promoção; requer correção de posicionamento e auditoria de assets antes de considerar merge/deploy para produção.

---

## 5. Status da idempotência (I.5)

- **Implementado?** **Sim.** O cliente oficial (player) na branch `feature/bloco-e-gameplay-certified` gera e envia `X-Idempotency-Key` em todo POST para `/api/games/shoot` (`gameService.js`). O backend já possuía a lógica (leitura da key, cache em memória com TTL 120s, 409 para mesma key); nenhuma alteração foi feita no backend nesta fase.
- **Validado?** **Em código, sim.** A análise estática (relatório VALIDACAO-I5-IDEMPOTENCIA-2026-03-17) confirma header em toda chamada, keys distintas por chute, mesma key em retries, rejeição de duplicata e retrocompatibilidade. **Em ambiente (preview), não.** A checklist de testes manuais (DevTools, 200/409, contagem em `chutes`) ainda não foi executada e registrada com evidências.
- **Riscos:** Colisão de key muito baixa; perda de key em retry não ocorre (axios reutiliza o mesmo config). Idempotência só em memória e não compartilhada entre instâncias; clientes que não enviam a key continuam sem proteção contra duplicidade.

---

## 6. Status de deploy

- **Produção (current):** Alinhada ao estado de rollback **tag `pre-fase1-idempotencia-2026-03-17`** (commit `16177266d702a75c101947e9bf397540acaeb103`). Nenhuma alteração de deploy foi feita sobre produção neste ciclo; o player em produção **não** envia `X-Idempotency-Key`.
- **Preview:** Baseada na branch `feature/bloco-e-gameplay-certified`, que contém o commit de backup pré-I.5 e o commit da idempotência no `gameService.js`. Usada para validar I.5 e interface; atualmente com regressões visuais nos overlays da `/game`.
- **Rollback disponível?** **Sim.** Tag `pre-fase1-idempotencia-2026-03-17` no remoto; permite re-deploy de backend e frontend para o estado anterior à Fase I.5. Rollback de banco não é parte dessa tag (nenhuma migração de banco foi feita neste bloco).

---

## 7. Riscos ativos

1. **Regressões visuais no preview** — Overlays fora do centro e possível asset divergente (GOOOL); bloqueiam promoção do preview para produção.
2. **Idempotência I.5 não validada em ambiente** — Risco de comportamento inesperado (ex.: 409 em cenários não previstos) até conclusão dos testes em preview.
3. **Produção sem idempotência no cliente** — Débito duplicado possível em retry, clique duplo ou timeout+reenvio até que o player com I.5 seja validado e promovido.
4. **Idempotência em memória** — Restart do backend invalida o cache; retries após restart com a mesma key podem ser processados como novo chute.
5. **Sem transação saldo+chute** — Crash entre UPDATE de saldo e INSERT em `chutes` pode gerar inconsistência contábil (escopo de fases futuras).
6. **Inconsistência preview vs produção** — Necessidade de auditoria completa de assets e CSS para garantir paridade antes de qualquer promoção.

---

## 8. Próximos passos

1. **I.5 — Idempotência:** Executar em **preview** a checklist completa (envio de header, 200 no primeiro request, 409 no retry com mesma key, dois chutes distintos, request sem key); registrar evidências e atualizar o relatório de validação com veredito (APROVADO/BLOQUEADO).
2. **BLOCO F — Interface:** Corrigir no preview o posicionamento dos overlays (centralização) e auditar assets (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) em relação à produção; documentar em relatório de auditoria do BLOCO F.
3. **Governança de deploy:** Manter produção na tag `pre-fase1-idempotencia-2026-03-17` até I.5 validado em preview e BLOCO F sem regressões; só então avaliar merge e deploy para produção, com rollback mantido.
4. **Fases futuras:** Avançar plano de transação saldo+chute, contador atômico e multi-instância conforme roadmap já documentado.

---

## 9. Veredito geral do projeto

- [ ] PRONTO PARA PRODUÇÃO  
- [ ] PRONTO COM RESSALVAS  
- [x] **BLOQUEADO**

O sistema em **produção** está estável e utilizável. O ciclo atual (BLOCO F + I.5) está **bloqueado** para promoção do preview à produção devido às regressões visuais na `/game` e à validação da idempotência ainda pendente em ambiente. Nenhuma alteração no sistema é recomendada até conclusão dos próximos passos acima.

---

*Documento gerado em modo READ-ONLY com base nos relatórios existentes. Nenhuma alteração de código ou deploy foi realizada.*
