# BLOCO G — FLUXO DO JOGADOR

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO  
**Referências:** Baseline FyKKeg6zb | Produção atual ez1oc96t1 | Código local

---

## 1. Escopo auditado

| Tipo | Itens |
|------|--------|
| **Fluxo ponta a ponta** | Entrada no site → autenticar → dashboard → saldo → depositar/pagar → jogo → apostar → chutar → perfil/saque/pagamentos |
| **Rotas e sequência** | / → Login/Register → /dashboard → /game, /pagamentos, /withdraw, /profile; ProtectedRoute em todas as áreas autenticadas |
| **Documentação** | AUDITORIA-BLOCO-G-FLUXO-DO-JOGADOR-2026-03-08.md, AUDITORIA-SUPREMA-BLOCO-G-FLUXO-JOGADOR-2026-03-08.md |

---

## 2. Fonte de verdade do bloco

- **Sequência real de telas e rotas:** App.jsx (rotas) + fluxo documentado em AUDITORIA-SUPREMA-BLOCO-G (cadastro → login → perfil → depósito → jogo → chute → saque). Backend: server-fly.js (todas as rotas usadas no fluxo).
- **Produção atual:** Build do código local; fluxo igual. **Baseline:** Rotas /, /game, /dashboard validadas; fluxo completo (login → dashboard → jogo → pagamentos) não descrito passo a passo no fingerprint da baseline.

---

## 3. Evidências concretas

| Evidência | Local |
|-----------|--------|
| Mapa técnico PLAYER→API→BACKEND | AUDITORIA-SUPREMA-BLOCO-G-FLUXO-JOGADOR-2026-03-08, seção 1 |
| Cadastro, Login, Saldo, PIX, Chute, Saque | Consistência confirmada no relatório suprema (seções 2–9) |
| Pontos de bloqueio por auth | ProtectedRoute em /dashboard, /game, /profile, /withdraw, /pagamentos |
| Pontos de divergência visual | VersionWarning, saldo sidebar fixo, tema Pagamentos (BLOCO F) |
| Fluxo local vs produção | Local = build atual (ez1oc96t1); mesmo fluxo |
| Fluxo vs baseline | Baseline valida /, /game, /dashboard; não documenta ordem de uso (ex.: jogar antes de depositar) |

---

## 4. Alinhamento com baseline validada

**Resposta:** **parcial**

- Baseline valida que as rotas principais existem e respondem (/, /game, /dashboard). Não há documento que descreva o fluxo completo do jogador (primeira decisão, descoberta do depósito, retorno pós-PIX) na baseline. O **comportamento** (login → dashboard → jogo; depósito via Pagamentos; saque via Withdraw) é coerente com o que a baseline servia; não confirmado se era idêntico.

---

## 5. Alinhamento com produção atual

**Resposta:** **sim**

- Fluxo do jogador no local reflete a produção atual: mesmas rotas, mesma ordem de telas, mesmos pontos de bloqueio (auth, saldo no jogo). Sequência real (entrar → autenticar → dashboard → consultar saldo → depositar → jogo → apostar → chutar → perfil/saque) é a mesma.

---

## 6. Diferenças encontradas

| Tipo | Descrição |
|------|------------|
| **Só por banner/dev** | VersionWarning e PwaSwUpdater no local/produção atual podem não ter existido na baseline; impacto visual, não na sequência de fluxo. |
| **Por tela do jogo/blueprint** | Se a baseline tivesse /game → Game.jsx e hoje é GameShoot, haveria diferença de tela no mesmo passo “ir para o jogo”; não comprovado qual componente estava na baseline. |
| **Por UX** | AUDITORIA-BLOCO-G: primeira impressão não comunica “dinheiro real”/“R$ 1 por chute”; incentiva jogar antes de depositar; pós-PIX sem CTA “Voltar ao jogo”; saldo fixo na sidebar. Essas são características do fluxo atual (local e produção), não necessariamente da baseline. |
| **Baseline vs atual** | Produção atual (ez1oc96t1) não é a baseline (FyKKeg6zb); bundle diferente. O fluxo “lógico” (rotas e ações) pode ser o mesmo; a experiência visual (banner, toasts) diverge. |

---

## 7. Risco operacional

**Classificação:** **médio**

- Risco de **homologação:** se testes de fluxo forem feitos no local sem fixar “contra qual deployment estamos validando”, pode-se misturar “fluxo atual” com “fluxo baseline”. Risco de **conversão/UX:** pontos de abandono documentados (pós-login sem narrativa, descoberta tardia do depósito, pós-PIX sem retorno ao jogo, sidebar com saldo errado) afetam experiência real.

---

## 8. Pode usar o local como referência para este bloco?

**Resposta:** **sim, com ressalvas**

- Para **homologação do fluxo atual** (sequência de telas, rotas, auth, chamadas de API): sim — local pode ser usado para validar a jornada completa. Para **comparação com baseline:** fixar que “baseline = FyKKeg6zb” e que produção atual ≠ baseline; onde o fluxo diverge “só por banner/dev” (VersionWarning) deve ser registrado; onde diverge por tela do jogo (Game vs GameShoot) não está comprovado. Não usar local para afirmar “fluxo idêntico à baseline” sem evidência.

---

## 9. Exceções que precisam ser registradas

1. **Deployment de referência:** Definir se a validação do fluxo é contra FyKKeg6zb (baseline) ou ez1oc96t1 (produção atual). Fluxo local = ez1oc96t1.
2. **Pontos de abandono:** Registrar primeira impressão, descoberta do depósito no jogo, pós-PIX sem CTA de retorno, saldo sidebar (AUDITORIA-BLOCO-G-FLUXO-DO-JOGADOR-2026-03-08).
3. **Componente /game na baseline:** Não determinado; não afirmar que o “passo jogo” era visualmente idêntico à baseline.

---

## 10. Classificação final do bloco

**BLOCO ALINHADO COM RESSALVAS**

- Alinhado com **produção atual** (sim): fluxo ponta a ponta no local pode ser usado para homologar a jornada atual. Alinhado com **baseline** (parcial): rotas e existência do fluxo sim; detalhes de UX e componente /game não confirmados. Pode usar local como referência para o fluxo do jogador com ressalvas: fixar deployment de referência e registrar exceções (banner, toasts, saldo sidebar, CTA pós-PIX).

---

*Auditoria READ-ONLY. Nenhum arquivo ou deploy foi alterado.*
