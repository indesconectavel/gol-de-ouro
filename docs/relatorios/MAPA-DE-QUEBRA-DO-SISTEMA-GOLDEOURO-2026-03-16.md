# MAPA DE QUEBRA DO SISTEMA GOL DE OURO (BLOCO I.2)

**Projeto:** Gol de Ouro  
**Data:** 2026-03-16  
**Modo:** READ-ONLY ABSOLUTO — auditoria forense. Nenhuma alteração em código ou infraestrutura.

**Contexto:** Continuação do BLOCO I (Escalabilidade) e BLOCO I.1 (Plano de Escalabilidade). Arquitetura classificada como **NÃO ESCALÁVEL NA FORMA ATUAL**. Este documento identifica **como o sistema pode quebrar na prática**, antes mesmo de escalar.

---

## 1. Resumo executivo

### O sistema quebra?

**Sim.** O sistema **pode quebrar** de várias formas: financeiramente (débito duplicado, saldo incorreto após crash), em consistência (contador que não bate com chutes, lotes órfãos), por concorrência (deriva do contador, Gol de Ouro no número errado), por retry (mesmo ato processado duas vezes), por infraestrutura (restart perde lotes, deploy no meio do fluxo) e por falhas invisíveis (contador persistido à frente do real, prêmio pago sem registro). Em **instância única e carga moderada**, o optimistic lock no saldo evita o pior (dois pagamentos para o mesmo 10º chute), mas **não** evita débito duplicado por retry, nem inconsistência saldo vs chutes em crash, nem deriva silenciosa do contador.

### Onde quebra primeiro?

O **primeiro problema real** que tende a aparecer em produção com dinheiro real é um destes três, por ordem de probabilidade:

1. **Débito duplicado por retry** — Usuário clica uma vez; request demora ou dá timeout; usuário clica de novo ou o cliente reenvia. Dois requests são processados; dois débitos de R$ 1 e dois registros em chutes. O cliente **não envia** X-Idempotency-Key; o backend não tem como saber que é a mesma ação. **Impacto:** usuário cobrado duas vezes por um chute; reclamação e possível chargeback/desconfiança.

2. **Deriva do contador (Gol de Ouro errado)** — Dois requests simultâneos leem o mesmo `contadorChutesGlobal` (ex.: 999); ambos incrementam; um passa no UPDATE de saldo e persiste chute, o outro recebe 409. O contador em memória pode ficar 1000 ou 1001; `saveGlobalCounter()` já pode ter sido chamado por ambos. Resultado: contador no banco à frente do número real de chutes, ou dois incrementos para um chute. O **Gol de Ouro** (a cada 1000) pode disparar no número errado ou “pular” um número. **Impacto:** prêmio de R$ 100 atribuído no chute errado, ou não atribuído quando deveria; injustiça e risco regulatório.

3. **Crash entre UPDATE de saldo e INSERT em chutes** — Servidor cai (ou deploy, ou OOM) depois do UPDATE em `usuarios` e antes do INSERT em `chutes`. Não há transação; reversão não roda. Usuário fica com saldo já debitado (ou creditado, se era gol) sem nenhum registro do chute. **Impacto:** inconsistência contábil; usuário pode reclamar “paguei e não apareceu” ou “ganhei e sumiu”; auditoria quebrada.

---

## 2. Primeira quebra provável

**Cenário:** Usuário joga em celular com conexão instável. Dá um chute; o POST demora. O usuário acha que não enviou e toca de novo. Ou o cliente (React) faz retry automático por timeout. Dois POSTs chegam ao backend.

**O que acontece:**  
- Nenhum dos dois envia `X-Idempotency-Key` (gameService.js envia só `direction` e `amount`).  
- O backend trata os dois como chutes distintos.  
- Ambos passam na validação de saldo e na validação do lote (podem cair no mesmo lote ou em posições diferentes).  
- Cada um executa UPDATE de saldo (débito de R$ 1) e INSERT em chutes.  
- Resultado: **dois débitos** e **dois registros** para **uma** ação do usuário.

**Por que acontece:** Não há idempotência no cliente; o backend só evita duplicata se o cliente enviar a mesma chave e ela ainda estiver no cache (120s), mas o cliente não envia chave.

**Impacto real:** Usuário perde R$ 1 indevidamente; reclamação; em volume, prejuízo e desconfiança na plataforma.

**Probabilidade:** Alta em rede instável ou em clientes com retry agressivo.  
**Severidade:** 🔴 **CRÍTICO** (prejuízo financeiro direto ao usuário e à operação).

---

## 3. Top 10 falhas críticas

| # | Falha | Tipo | Classificação | Resumo |
|---|------|------|----------------|--------|
| 1 | Débito duplicado por retry/clique duplo (cliente sem idempotency) | 💰 Financeira / 🔄 Retry | 🔴 CRÍTICO | Mesmo ato processado duas vezes; dois débitos. |
| 2 | Crash entre UPDATE saldo e INSERT chutes (sem transação) | 💰 Financeira / 🔌 Infra | 🔴 CRÍTICO | Saldo alterado sem registro; inconsistência permanente. |
| 3 | Deriva do contador → Gol de Ouro no número errado ou “pulado” | 🔁 Consistência / ⚔️ Concorrência | 🔴 CRÍTICO | Prêmio R$ 100 atribuído incorretamente ou não atribuído. |
| 4 | Reversão de saldo falha após erro no INSERT chutes | 💰 Financeira | 🔴 CRÍTICO | Saldo já alterado; reversão não aplicada; estado incorreto. |
| 5 | Restart do servidor → lotes ativos perdidos (lotes órfãos no banco) | 🔁 Consistência / 🔌 Infra | 🟠 ALTO | Histórico com lotes incompletos; confusão e auditoria difícil. |
| 6 | Idempotência em memória → após restart retries são aceitos de novo | 🔄 Retry | 🟠 ALTO | Retries após restart podem duplicar chutes. |
| 7 | saveGlobalCounter() falha → contador no banco atrás do real | 🔁 Consistência / 🧠 Invisível | 🟠 ALTO | Gol de Ouro desalinhado após próximo restart. |
| 8 | Dois requests “10º” no mesmo lote → um 409 (correto) mas contador já incrementado | ⚔️ Concorrência | 🟠 ALTO | Incremento sem chute persistido; deriva. |
| 9 | Deploy/restart no meio de um lote → usuário com 409 “Saldo alterado” sem ter feito outra ação | 🔌 Infra / ⚔️ UX | 🟡 MÉDIO | Experiência ruim; possível sensação de “trapaceiro”. |
| 10 | metricas_globais (uma linha) atualizada a cada chute → contenção e latência | 🔌 Infra | 🟡 MÉDIO | Sob carga, gargalo e mais timeouts → mais retries → mais risco de duplicação. |

---

## 4. Quebras financeiras

Cenários onde o sistema **paga mais do que deveria**, **perde dinheiro** ou **saldo fica incorreto**.

| Cenário | O que acontece | Por que acontece | Impacto | Prob. | Severidade |
|---------|----------------|------------------|---------|-------|------------|
| **Débito duplicado** (retry/clique duplo) | Usuário é debitado 2x por uma ação; dois registros em chutes. | Cliente não envia X-Idempotency-Key; backend não identifica duplicata. | Prejuízo ao usuário (R$ 1); reclamação; volume = prejuízo acumulado. | Alta | 🔴 CRÍTICO |
| **Crash após UPDATE, antes do INSERT** | Saldo já atualizado (débito ou crédito); processo morre; chute não é inserido. | Não há transação; não há rollback automático. | Saldo incorreto; usuário pode ter pago e “não ver” o chute ou ter recebido e não ter registro; auditoria quebrada. | Média (depende de estabilidade do servidor) | 🔴 CRÍTICO |
| **Reversão de saldo falha** (após chuteError ou validateAfterShot) | Código chama UPDATE para restaurar user.saldo; a chamada falha (rede, timeout). | Reversão não é retentada nem garantida; lote já sofreu pop(). | Saldo permanece errado; débito ou crédito “fantasma”. | Baixa (mas possível) | 🔴 CRÍTICO |
| **Dois créditos para o mesmo 10º chute** | N/A na arquitetura atual. | Optimistic lock (.eq('saldo', user.saldo)) impede; só um request passa. | — | — | 🟢 Mitigado |
| **Gol de Ouro pago no número errado** | Contador derivou; isGolDeOuro = true no chute 999 ou 1001 em vez de 1000. | contadorChutesGlobal++ não atômico; possível incremento sem chute persistido. | R$ 100 pago no momento errado; injustiça e risco regulatório. | Média sob concorrência | 🔴 CRÍTICO |

---

## 5. Quebras de consistência

Divergências entre **banco**, **memória** e **lógica**.

| Cenário | O que acontece | Por que acontece | Impacto | Prob. | Severidade |
|---------|----------------|------------------|--------|-------|------------|
| **Contador em memória ≠ contador no banco** | Após 409, um request incrementou e chamou saveGlobalCounter(); o chute não foi persistido. Contador no banco à frente do COUNT(chutes). | Incremento feito antes do UPDATE de saldo; quem perde o 409 já incrementou. | Gol de Ouro desalinhado; após restart, contador carregado errado. | Média | 🟠 ALTO |
| **Contador no banco atrás do real** | saveGlobalCounter() falha (erro de rede, Supabase indisponível); código só loga e segue. | Não há retry nem rollback do fluxo; contador já foi usado para isGolDeOuro. | Após restart, contador menor; próximo Gol de Ouro “atrasa”. | Baixa | 🟠 ALTO |
| **Lotes órfãos** (restart com lote em andamento) | Chutes já persistidos com lote_id X; processo reinicia; lotesAtivos vazio; lote X não existe mais. Novos chutes criam novos lotes. | Lotes só em memória; não há tabela de lotes nem recuperação no startup. | Histórico com lotes “incompletos” (ex.: 7 chutes); auditoria e relatórios confusos. | Certa em todo restart com tráfego | 🟠 ALTO |
| **Saldo vs SUM(chutes)** divergem | Crash após UPDATE; ou reversão falhou. | Falta de transação e de garantia de reversão. | Contabilidade quebrada; difícil reconciliação. | Média | 🔴 CRÍTICO |
| **Lote em memória com 10 chutes, banco com 9** | Crash após push e UPDATE, antes do INSERT. | Ordem: UPDATE saldo → push → INSERT; crash entre push e INSERT. | Lote em memória “completo”, mas último chute não está no banco; estado inconsistente até próximo restart (lote some). | Baixa | 🟠 ALTO |

---

## 6. Quebras de concorrência

Race conditions e disputas simultâneas.

| Cenário | O que acontece | Por que acontece | Impacto | Prob. | Severidade |
|---------|----------------|------------------|--------|-------|------------|
| **Dois requests leem lote.chutes.length = 9** | Ambos calculam isGoal = true; ambos tentam UPDATE saldo. Um passa, outro 409. Apenas um push e um INSERT. | Não há lock no lote; leitura não atômica. | Comportamento correto (um vencedor); o que perde recebe 409. | Alta sob carga | 🟢 Comportamento esperado |
| **Dois requests leem contadorChutesGlobal = 999** | Ambos incrementam (1000/1001 ou sobrescrita); um pode receber 409 depois. Contador já incrementado e possivelmente persistido. | contadorChutesGlobal++ não atômico; saveGlobalCounter() chamado antes do UPDATE de saldo. | Deriva do contador; Gol de Ouro no número errado. | Média | 🔴 CRÍTICO |
| **getOrCreateLoteByValue: dois requests criam “lote ativo”** | Dois requests podem obter o mesmo lote (iteração sem lock) ou, em teoria, condições de corrida na criação. | Sem mutex por valor ou por lote. | Disputa resolvida no UPDATE de saldo; mais 409. | Média | 🟡 MÉDIO (mais 409, não perda financeira direta) |
| **Múltiplas instâncias** (se ativadas por engano) | Cada instância com seus lotes e contador; metricas_globais em last write wins; vários “10º” e vários Gol de Ouro. | Estado por processo; nenhum store compartilhado. | Economia quebrada; múltiplos prêmios; prejuízo grave. | Se alguém escalar sem plano | 🔴 CRÍTICO |

---

## 7. Quebras por retry / duplicação

Mesmo request processado mais de uma vez; usuário cobrado duas vezes; sistema não detecta duplicidade.

| Cenário | O que acontece | Por que acontece | Impacto | Prob. | Severidade |
|---------|----------------|------------------|--------|-------|------------|
| **Cliente reenvia POST (timeout / duplo clique)** | Dois chutes processados; dois débitos; dois INSERTs. | gameService.js não envia X-Idempotency-Key; backend não tem chave para deduplicar. | Débito duplicado; reclamação. | Alta em rede ruim | 🔴 CRÍTICO |
| **Retry após restart** | Cliente reenvia com mesma intenção; idempotencyProcessed estava em memória e foi perdida. | Map zerado no startup; mesma chave (se fosse enviada) seria aceita de novo. | Duplicata possível mesmo com idempotency no cliente, se chave reutilizada após restart. | Média | 🟠 ALTO |
| **Duas abas / dois dispositivos** | Dois POSTs “simultâneos” para o mesmo usuário. | Não são “retry”, mas dois atos; ambos válidos. Sistema processa os dois. | Pode ser desejado (dois chutes reais) ou confusão do usuário; sem idempotency não há como distinguir “mesmo ato” de “dois atos”. | Média | 🟡 MÉDIO |

---

## 8. Quebras por infraestrutura

Restart do servidor, deploy no meio de um lote, falha de rede.

| Cenário | O que acontece | Por que acontece | Impacto | Prob. | Severidade |
|---------|----------------|------------------|--------|-------|------------|
| **Restart com lotes ativos** | lotesAtivos vazio; contador e ultimoGolDeOuro recarregados do banco (podem estar atrás). Chutes já no banco com lote_id de lotes que “não existem” mais. | Lotes não persistidos; startup só carrega metricas_globais. | Lotes órfãos; contador possivelmente atrás; Gol de Ouro desalinhado. | Toda vez que há restart com tráfego | 🟠 ALTO |
| **Deploy durante fluxo de chute** | Processo antigo morre (SIGTERM); request em andamento pode estar entre UPDATE e INSERT. | Graceful shutdown fecha conexões; request pode não completar. | Crash entre UPDATE e INSERT → saldo sem registro de chute. | Toda vez que deploy coincide com chute | 🟠 ALTO |
| **Falha de rede para Supabase** | saveGlobalCounter() ou UPDATE ou INSERT falha. | Sem retry robusto; em alguns caminhos há reversão, em outros não (ex.: saveGlobalCounter só loga). | Contador atrás; ou saldo alterado sem INSERT se falha após UPDATE. | Depende de SLA do Supabase | 🟠 ALTO |
| **OOM ou crash do processo** | Processo morto em ponto arbitrário. | Sem transação; estado parcial possível. | Qualquer janela entre UPDATE e INSERT vira inconsistência. | Baixa | 🔴 CRÍTICO quando ocorre |

---

## 9. Quebras invisíveis (as mais perigosas)

Falhas que **não geram erro** para o usuário nem sempre geram log óbvio, mas **geram prejuízo ou inconsistência silenciosa**.

| Cenário | O que acontece | Por que é invisível | Impacto real |
|---------|----------------|---------------------|--------------|
| **Contador persistido à frente do real** | Request A e B leem contador 999; ambos incrementam; A persiste 1000, B persiste 1001 (ou A sobrescreve). Um deles leva 409 e não insere chute. Banco pode ter 1000 ou 1001. Ninguém falha; usuário não vê erro. | Nenhum 500; o que “perde” recebe 409 (“Saldo alterado”), que pode ser interpretado como “concorrência normal”. | Próximo Gol de Ouro pode ser no 1999 ou 2001; ou “pular” um número. Prejuízo ou injustiça silenciosa. |
| **saveGlobalCounter() falha e ninguém percebe** | Erro só logado; fluxo continua; resposta 200. Contador no banco desatualizado. | Cliente recebe 200; operação “ok”; ninguém monitora falha de saveGlobalCounter. | Após restart, contador menor; Gol de Ouro atrasa; um jogador que deveria ganhar R$ 100 não ganha. |
| **Crash após UPDATE e antes do INSERT** | Usuário recebeu crédito (era gol) e processo morreu. No banco: saldo já creditado, chutes sem aquele registro. | Do ponto de vista do usuário pode parecer que “não caiu” o prêmio se a resposta não chegou; ou que “caiu” e sumiu. Depende do momento exato. | Auditoria: saldo total não bate com soma de chutes e prêmios. Difícil rastrear sem log forense. |
| **Lote “completo” em memória, último chute não no banco** | Crash após push, antes do INSERT. Lote em memória tem 10 chutes; no banco, 9. Após restart o lote some; ficam 9 linhas em chutes com aquele lote_id. | Nenhum erro retornado ao próximo request; o lote simplesmente não existe mais. | Histórico com lote incompleto; possível disputa se alguém alegar que foi o 10º (não há prova no banco). |
| **Reversão de saldo falha** | INSERT chutes deu erro; código chama UPDATE para restaurar saldo; essa chamada falha. Resposta 500 ao cliente. | Cliente vê “Falha ao registrar chute”; saldo já foi alterado. Operador pode achar que “só falhou” e usuário pode reclamar depois. | Saldo incorreto; difícil corrigir sem análise manual. |

---

## 10. Ranking final de risco

Lista ordenada do **mais perigoso** ao menos perigoso, considerando probabilidade e impacto.

| Posição | Falha | Classificação | Motivo |
|---------|-------|----------------|--------|
| 1 | Débito duplicado por retry (cliente sem idempotency) | 🔴 CRÍTICO | Alta probabilidade em produção; prejuízo direto ao usuário; fácil de disparar (rede instável, timeout). |
| 2 | Crash entre UPDATE saldo e INSERT chutes | 🔴 CRÍTICO | Sem transação; qualquer falha de processo/deploy pode causar; saldo incorreto permanente. |
| 3 | Deriva do contador → Gol de Ouro errado | 🔴 CRÍTICO | Concorrência real; prêmio R$ 100 no momento errado ou “pulado”; invisível até alguém reclamar ou auditar. |
| 4 | Reversão de saldo falha (após erro no INSERT) | 🔴 CRÍTICO | Saldo alterado sem correção; impacto financeiro e de confiança. |
| 5 | saveGlobalCounter() falha → contador atrás | 🟠 ALTO | Invisível; Gol de Ouro desalinhado após restart. |
| 6 | Restart → lotes órfãos e contador possivelmente atrás | 🟠 ALTO | Toda vez que há restart; consistência do histórico e do contador afetadas. |
| 7 | Idempotência perdida após restart | 🟠 ALTO | Retries após restart podem duplicar se cliente passar a usar chave reutilizada. |
| 8 | Deploy no meio do fluxo | 🟠 ALTO | Mesmo efeito que crash entre UPDATE e INSERT. |
| 9 | Dois “10º” no mesmo lote (um 409) + contador já incrementado | 🟠 ALTO | Contribui para deriva; não gera dois pagamentos, mas corrompe contador. |
| 10 | Contenção em metricas_globais e mais timeouts/retries | 🟡 MÉDIO | Aumenta probabilidade de retries e portanto de débito duplicado. |

---

## 11. Conclusão

### O sistema é seguro hoje?

**Com ressalvas.** Em **instância única** e **carga controlada**, o sistema evita o pior cenário (dois pagamentos para o mesmo 10º chute) graças ao optimistic lock no saldo. Porém **não** é seguro contra: (1) débito duplicado por retry/clique duplo, (2) inconsistência saldo vs chutes em crash ou falha de reversão, (3) deriva do contador e Gol de Ouro incorreto. Ou seja: **não é seguro o suficiente** para operar com dinheiro real sem aceitar esses riscos de forma explícita e monitorada.

### Pode operar com dinheiro real?

**Pode**, desde que: (a) a operação aceite os riscos documentados (retry, crash, contador); (b) haja monitoramento (logs de saveGlobalCounter, de reversão, de 409); (c) haja processo de reconciliação periódica (saldo vs chutes, contador vs COUNT(chutes)); (d) preferencialmente o cliente passe a enviar X-Idempotency-Key para reduzir débito duplicado. **Não** deve operar com múltiplas instâncias nem com carga alta sem as mudanças do plano de escalabilidade.

### Qual o maior risco escondido?

O **maior risco escondido** é a **combinação de falhas invisíveis**: contador derivado + saveGlobalCounter falhando ocasionalmente. O sistema continua respondendo 200; ninguém vê erro; mas o Gol de Ouro deixa de bater com o “1000º chute real” e pode ser pago no número errado ou não ser pago quando deveria. Isso gera **injustiça e risco regulatório** sem que a operação perceba até uma auditoria ou reclamação específica. O segundo maior risco escondido é **crash entre UPDATE e INSERT**: um único evento (restart, OOM, deploy) pode deixar saldo e histórico permanentemente inconsistentes, sem mensagem clara para o usuário ou para o suporte.

---

*Documento gerado em modo READ-ONLY. Nenhuma alteração foi feita em código, banco ou infraestrutura. Auditoria forense com base no código real (server-fly.js, gameService.js) e nos relatórios BLOCO I e BLOCO I.1.*
