# VALIDAÇÃO — FASE 1 — JOGO + SALDO

**Data:** 2026-04-09  
**Modo:** validação read-only do estado do código após a cirurgia (sem deploy, sem refactor).

---

## 1. Resumo executivo

A Fase 1 **atende ao escopo aprovado** no ficheiro `server-fly.js`: a regra de saldo para MISS e GOAL está **explícita** no mesmo fluxo do `POST /api/games/shoot`, `data.novoSaldo` continua a ser atribuído em `shootResult`, e a narrativa incorreta sobre triggers de saldo em `chutes` foi **substituída** por comentários alinhados à produção. O `git diff` analisado **restringe-se** a esse handler; não há evidência de alteração a PIX, saque, `metricas_globais` ou lógica de lotes **fora** do que já existia no mesmo bloco.

**Classificação desta validação:** **APROVADA COM RESSALVAS** — ressalvas: (1) alterações ainda **não commitadas** no working tree no momento da validação; (2) algumas **mensagens de erro HTTP 500** do ramo de saldo passaram a texto mais genérico (“após chute” vs “após gol” / “confirmar saldo”), sem impacto no caminho **200** típico; (3) **testes E2E** com Supabase real não constam como executados nesta validação.

---

## 2. Escopo validado

| Critério | Evidência |
|----------|-----------|
| Apenas `server-fly.js` no código da cirurgia | `git diff --name-only` mostra **somente** `server-fly.js` alterado em relação a `HEAD`. |
| Mudança restrita ao fluxo `POST /api/games/shoot` | Os hunks do diff incidem apenas em linhas dentro desse handler (comentários antes do `insert` em `chutes` e bloco de ajuste de saldo até `shootResult.novoSaldo`). |
| Sem expansão de escopo (PIX, saque, worker, frontend, lotes) | Diff **não** toca noutras rotas nem em `saveGlobalCounter`; lógica de lote/contador global **permanece** como antes do trecho alterado. |
| Relatório em `docs/relatorios/` | Existe ficheiro `CIRURGIA-FASE1-JOGO-SALDO-2026-04-09.md` (não rastreado pelo Git no momento da validação). |
| Migração / novas tabelas | **Nenhuma** alteração de schema no diff. |

---

## 3. Regra confirmada

| Regra aprovada | Confirmação no código |
|----------------|------------------------|
| MISS: desconta `amount` | `creditoPremios = 0` quando `!isGoal` ⇒ `novoSaldoCalculado = saldoAtual - amount`. |
| GOAL: `saldo_atual - amount + premio + premioGolDeOuro` | `creditoPremios = premio + premioGolDeOuro` quando `isGoal` ⇒ mesma fórmula. |
| `novoSaldo` no response | `shootResult.novoSaldo = saldoFinal` após `UPDATE` bem-sucedido (`server-fly.js` ~1419). |
| Comentários sobre trigger de saldo em `chutes` | Texto atual indica ausência de trigger que altere saldo e ajuste explícito no backend (~1298–1299, ~1351–1354). |

---

## 4. Contrato confirmado

| Aspeto | Situação |
|--------|----------|
| Request | Sem alteração: continua a esperar `direction`, `amount` no corpo (validação existente). |
| Resposta de sucesso | `res.status(200).json({ success: true, data: shootResult })` mantido; `shootResult` inclui os mesmos campos de jogo **e** `novoSaldo`. |
| Status HTTP | Sucesso continua **200**; erros **400/404/500/503** conforme ramos já existentes. |
| Frontend | Não exige mudança de contrato no caminho feliz: o cliente continua a poder ler `data.novoSaldo`. |
| Ressalva | Mensagens literais de alguns **500** no fluxo de saldo podem diferir das anteriores (apenas texto de `message`). |

---

## 5. Regressão

| Área | Avaliação |
|------|-----------|
| Lotes (`lotesAtivos`, `getOrCreateLoteByValue`, validador) | **Sem alteração** no diff fora do bloco já existente antes do `insert`; não há evidência de regressão introduzida **por este diff**. |
| `metricas_globais` / `saveGlobalCounter` | **Fora** dos hunks alterados. |
| PIX / saque / reconciliação | **Fora** dos hunks alterados. |
| Fluxo do chute (lógica goal/miss, insert `chutes`) | Comportamento de jogo **preservado**; acrescenta-se apenas movimento explícito de saldo para MISS e GOAL e retry de concorrência. |

---

## 6. Ressalvas

1. **Working tree:** alterações em `server-fly.js` podem estar **por commitar**; o encerramento “oficial” em repositório exige commit/merge conforme processo da equipa.
2. **Concorrência:** melhoria objetiva — `UPDATE` condicional a `saldo` lido + até 4 tentativas — **reduz** corridas simples; **não** garante transação única `chutes` + `usuarios` nem consistência global entre múltiplos escritores.
3. **Testabilidade:** validação por **revisão estática e diff**; **não** há evidência neste documento de testes de integração ou carga executados contra API real.
4. **Mensagens de erro:** ligeira variação de strings em erros 500 do ramo de saldo (contrato de erro não era critério estrito da Fase 1).

---

## 7. Diagnóstico final

A Fase 1 estrutural **jogo + saldo** pode ser considerada **tecnicamente conforme** ao desenho aprovado no código analisado, com classificação **APROVADA COM RESSALVAS** quanto a commit, testes de ambiente real e mensagens de erro secundárias.

**Assinatura da validação:** baseada unicamente no estado do repositório e leitura de `server-fly.js` no momento da geração deste relatório.
