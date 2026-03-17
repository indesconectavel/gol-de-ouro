# PLANO DE EXECUÇÃO DAS CORREÇÕES CRÍTICAS — GOL DE OURO (BLOCO I.4)

**Projeto:** Gol de Ouro  
**Data:** 2026-03-16  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração em código, banco ou arquitetura. Apenas estratégia de implementação.

**Contexto:** Este documento utiliza os resultados de:

- **BLOCO I** — diagnóstico de escalabilidade (funcional apenas em baixa escala)  
- **BLOCO I.1** — plano técnico ideal (o que mudar para escalar)  
- **BLOCO I.2** — mapa de quebra real (como o sistema quebra na prática)  
- **BLOCO I.3** — matriz de prioridade (o que corrigir primeiro)

Objetivo do BLOCO I.4: definir **como corrigir sem causar novos problemas** — roteiro seguro de execução em produção, ordem de implementação, redução de risco e validação por etapa.

---

## 1. Estratégia geral de execução

### Filosofia de rollout

- **Evolução, não revolução.** O sistema hoje processa chutes, paga prêmios e mantém saldo; o optimistic lock no saldo já evita dois pagamentos para o mesmo 10º chute. O plano não substitui esse fluxo de uma vez; adiciona camadas de proteção e depois consolida a lógica em etapas que podem ser validadas e revertidas com blast radius mínimo.
- **Cada mudança deve reduzir risco líquido.** Nenhuma fase deve introduzir mais superfície de falha do que remove. Exemplo: ativar idempotência no cliente sem alterar o contrato do backend (já suporta X-Idempotency-Key) reduz débito duplicado sem aumentar complexidade do servidor.
- **Produção continua rodando.** As correções devem ser implantáveis com o jogo em uso por usuários reais: deploy incremental, feature flags ou comportamentos retrocompatíveis quando fizer sentido, e validação contínua de saldo e de contagem de chutes.

### Abordagem incremental

- **Fase por fase**, com critério de “fase concluída” claro antes de avançar.
- **Sem big bang:** não reunir idempotência + transação + contador atômico + lotes persistidos em um único release. Cada bloco lógico é deployado e observado separadamente.
- **Compatibilidade retroativa:** enquanto o cliente não enviar idempotency key, o backend deve continuar aceitando requests sem key (comportamento atual). Quando o cliente passar a enviar, o backend já estará pronto. Da mesma forma, qualquer mudança de contrato (ex.: novo header obrigatório) deve ser introduzida de forma que versões antigas do app continuem funcionando até o cutoff definido pela operação.

### Nível de risco atual vs objetivo

- **Atual:** Débito duplicado por retry; saldo ≠ histórico em crash; contador derivando; falhas silenciosas em saveGlobalCounter e em reversão de saldo. Risco alto em rede instável ou sob concorrência; risco médio em deploy/restart.
- **Objetivo por fase:**  
  - Após Fase 1: risco de débito duplicado reduzido (idempotência em uso).  
  - Após Fase 2: risco de saldo sem registro (ou registro sem saldo) reduzido (atomicidade).  
  - Após Fase 3: risco de Gol de Ouro incorreto reduzido (contador confiável).  
  - Após Fase 4: falhas que hoje são silenciosas passam a ser detectáveis e tratáveis.  
  - Após Fase 5: sistema preparado para evolução futura (lotes/estado fora da memória), sem ainda escalar horizontalmente.

---

## 2. Fases de execução

### Fase 1 — Proteção imediata do usuário (idempotência, duplicidade)

**Objetivo:** Evitar que o mesmo ato do usuário (um chute) seja cobrado duas vezes por retry, timeout ou clique duplo.

**Escopo conceitual:**  
- Garantir que todo request de chute possa carregar uma chave de idempotência e que o backend a utilize para deduplicar.  
- Fazer o cliente oficial enviar essa chave em toda tentativa de chute (por exemplo, uma chave por “gesto” de chute, não reutilizada em retries da mesma tentativa).  
- Comportamento esperado: primeiro request com a chave processa; segundo request com a mesma chave (dentro do TTL) recebe 409 e não debita de novo.

**Não inclui nesta fase:** Persistir idempotência em banco/Redis (continua em memória); múltiplas instâncias. Foco é reduzir débito duplicado em instância única com cliente atualizado.

**Critério de conclusão:** Cliente em produção enviando idempotency key; backend rejeitando duplicatas com 409; monitoramento mostrando ausência de dois débitos para a mesma chave em janela de tempo curta.

---

### Fase 2 — Integridade contábil (transação lógica)

**Objetivo:** Eliminar a janela em que o saldo já foi alterado mas o chute ainda não foi persistido (ou o inverso), de modo que falha no meio do fluxo não deixe contabilidade inconsistente.

**Escopo conceitual:**  
- Tratar a operação “atualizar saldo + inserir chute” como uma unidade atômica: ou ambas as escritas são confirmadas, ou nenhuma (rollback em falha).  
- Isso pode ser feito via transação explícita no banco (BEGIN/COMMIT/ROLLBACK) envolvendo UPDATE em usuarios e INSERT em chutes, ou via procedimento armazenado que execute as duas operações e só faça COMMIT no fim.  
- Em caso de erro após UPDATE e antes do INSERT, a transação deve desfazer o UPDATE; não depender de reversão manual em código separado.

**Não inclui nesta fase:** Mudar a ordem interna do fluxo (ex.: contador atômico); persistir lotes. Foco é apenas fechar a janela saldo–chute.

**Critério de conclusão:** Nenhum evento observado em que saldo tenha sido alterado sem registro correspondente em chutes (ou vice-versa) após falha ou restart; testes de injeção de falha entre UPDATE e INSERT resultando em rollback e estado consistente.

---

### Fase 3 — Integridade do jogo (contador / Gol de Ouro)

**Objetivo:** Garantir que o contador global usado para “a cada 1000 chutes = Gol de Ouro” seja correto e único por chute efetivamente persistido, sem deriva por concorrência ou por incremento sem chute.

**Escopo conceitual:**  
- O número do chute (contador global) deve ser obtido de forma atômica em relação à persistência do chute: por exemplo, um único UPDATE no banco que incremente o contador e retorne o novo valor, usado tanto para decidir isGolDeOuro quanto para gravar em chutes e em metricas_globais.  
- Não incrementar contador em memória e depois persistir em separado; não chamar saveGlobalCounter() antes de saber se o chute será de fato persistido (após o “vencedor” do optimistic lock).  
- Integrar essa obtenção atômica do contador ao fluxo que já garante atomicidade saldo+chute (Fase 2), para que “contador + saldo + chute” formem uma unidade consistente.

**Não inclui nesta fase:** Múltiplas instâncias; persistência de lotes. Foco é contador confiável em instância única.

**Critério de conclusão:** Contador no banco sempre igual à quantidade de registros em chutes (ou a um valor derivado deterministicamente deles); Gol de Ouro disparando exatamente no 1000º, 2000º, etc.; ausência de “pulo” ou duplicação do número em cenários de concorrência simulados.

---

### Fase 4 — Robustez operacional (falhas silenciosas, reversões)

**Objetivo:** Nenhuma falha crítica (persistência de contador, reversão de saldo) permaneça apenas em log; toda falha deve ser observável e tratável, e reversões devem ter garantia de execução ou sinalização clara para correção manual.

**Escopo conceitual:**  
- saveGlobalCounter (ou equivalente): se a escrita do contador/métricas falhar, o sistema não deve seguir como se tivesse sucedido; deve retentar com política definida ou falhar o request (e não aplicar alteração de saldo sem contador consistente). Assim, não haverá “contador atrás” invisível.  
- Reversão de saldo: em qualquer caminho de erro em que o código tente restaurar o saldo (após falha no INSERT chutes ou na validação pós-chute), a reversão deve ser retentada até sucesso ou até um limite; se esgotar, gerar alerta operacional e registro auditável para correção manual. Nunca “silenciar” falha de reversão.  
- Métricas e alertas: contagem de falhas de persistência de contador e de reversão de saldo; alertas quando ultrapassarem limiar ou na primeira ocorrência em ambiente de produção.

**Não inclui nesta fase:** Redesenho do modelo de dados; escala horizontal. Foco é visibilidade e tratamento de falhas no fluxo atual.

**Critério de conclusão:** Zero falhas de saveGlobalCounter sem retry ou sem falha explícita do request; zero falhas de reversão de saldo sem alerta; dashboards ou logs operacionais permitindo verificar isso em tempo próximo ao real.

---

### Fase 5 — Preparação para escala (lotes, estado fora da memória)

**Objetivo:** Tirar do processo o estado crítico que hoje vive só em memória (lotes ativos, e opcionalmente idempotência), de forma que restart não perca lotes e que, no futuro, múltiplas instâncias possam compartilhar a mesma fonte da verdade.

**Escopo conceitual:**  
- Persistir lotes (tabela ou store compartilhado) com contador de chutes por lote atualizado de forma atômica; “próximo índice no lote” e “10º chute” definidos pelo banco/store, não por lote.chutes.length em memória.  
- Idempotência em store compartilhado (tabela ou Redis) para que retries após restart ou em outra instância continuem sendo deduplicados.  
- Contador global já confiável na Fase 3; nesta fase garantir que lotes e idempotência também o sejam para uso futuro com mais de uma instância.  
- Não obrigatório nesta fase: efetivamente rodar múltiplas instâncias; apenas deixar o sistema pronto para isso.

**Não inclui nesta fase:** Load balancer, múltiplas instâncias em produção, otimizações de throughput. Foco é eliminar dependência de memória para estado crítico.

**Critério de conclusão:** Após restart, não existir “lote órfão” (lotes em andamento restaurados ou claramente finalizados); idempotência sobreviver a restart; relatórios de auditoria batendo com lotes e chutes persistidos.

---

## 3. Ordem de deploy recomendada

**Sequência obrigatória:**

1. **Fase 1** (idempotência) primeiro. Não depende de transação nem de contador atômico; reduz risco de débito duplicado de imediato. Pode ser feita com backend já existente (suporte a X-Idempotency-Key) + atualização do cliente.
2. **Fase 2** (atomicidade saldo+chute) em seguida. Base para qualquer garantia forte de consistência; evita estados parciais em crash/deploy. Não fazer Fase 3 ou 5 antes de ter Fase 2 estável.
3. **Fase 3** (contador / Gol de Ouro) depois da Fase 2. O contador atômico deve ser integrado ao mesmo bloco transacional ou sequência que já garante saldo+chute, para não criar nova janela de inconsistência.
4. **Fase 4** (robustez operacional) pode ser iniciada em paralelo à Fase 3 (monitoramento e tratamento de saveGlobalCounter e reversão), mas os critérios de “reversão garantida ou alerta” dependem do fluxo estável das Fases 2 e 3. Recomendação: concluir Fase 3 e em seguida fechar Fase 4.
5. **Fase 5** (lotes e idempotência persistidos) por último. Depende de se ter uma fonte da verdade estável para contador e de preferência transação já em uso; evita refazer lotes em memória e depois migrar de novo.

**O que nunca deve ser feito antes:**

- **Contador atômico (Fase 3) antes de transação saldo+chute (Fase 2):** o contador seria persistido em um momento diferente do chute; continuaria a existir janela de falha e possível deriva.
- **Persistir lotes (Fase 5) antes de atomicidade (Fase 2) e contador confiável (Fase 3):** migraria estado frágil para o banco sem corrigir a fragilidade; rollback e consistência pós-falha continuariam difíceis.
- **Escalar horizontalmente (múltiplas instâncias) antes de Fase 5:** idempotência e lotes em memória por processo quebrariam a economia do jogo.
- **Deploy agressivo (muitas fases em um único release) sem validação entre fases:** impossibilita identificar a causa de regressão e aumenta blast radius.

---

## 4. Estratégia de validação por fase

### Fase 1 — Idempotência

- **Como saber que deu certo:** Em ambiente de teste (e depois em produção com amostra), enviar dois POSTs de chute com a mesma idempotency key em sequência; o segundo deve retornar 409 e não deve haver segundo débito nem segundo registro em chutes. Consultar banco: um único registro de chute e uma única alteração de saldo para aquela chave no período.
- **Sinais a observar:** Redução de reclamações de “cobraram duas vezes”; ausência de pares de chutes no mesmo segundo para o mesmo usuário com mesmo valor e mesma direção (heurística de duplicidade quando a chave não estiver em logs). Monitorar taxa de 409 por idempotency key (esperado: aumento de 409 quando cliente envia key duplicada).
- **Métricas importantes:** Número de requests com X-Idempotency-Key; número de 409 por “chave já processada”; comparação antes/depois de volume de débitos por usuário por sessão (não deve aumentar).

### Fase 2 — Atomicidade saldo+chute

- **Como saber que deu certo:** Testes de injeção de falha: simular falha (kill process, timeout) após UPDATE de saldo e antes do INSERT em chutes; após restart ou retry, saldo e tabela chutes devem estar consistentes (nenhum saldo alterado sem linha em chutes correspondente). Auditoria: SUM de débitos/créditos implícitos nos chutes deve bater com variação de saldos dos usuários no período.
- **Sinais a observar:** Zero incidentes de “saldo alterado mas chute não apareceu” ou “chute registrado mas saldo não mudou”. Logs de rollback em cenários de falha simulada.
- **Métricas importantes:** Contagem de transações de chute commitadas vs revertidas; alerta em qualquer rollback em produção; reconciliação periódica saldo vs chutes (script ou job).

### Fase 3 — Contador / Gol de Ouro

- **Como saber que deu certo:** Contador em metricas_globais (ou fonte única) igual à quantidade de chutes persistidos (ou a um valor derivado deterministicamente). Em carga concorrente simulada, nenhum “pulo” de número (ex.: 999 → 1001) e nenhum Gol de Ouro atribuído em posição diferente de múltiplo de 1000. Testes determinísticos: N chutes geram contador N e, quando N % 1000 == 0, exatamente um chute com is_gol_de_ouro.
- **Sinais a observar:** Gráfico ou relatório contador_global vs COUNT(chutes); devem manter-se alinhados. Gol de Ouro apenas em chutes cujo contador_global é múltiplo de 1000.
- **Métricas importantes:** Diferença entre contador e COUNT(chutes); número de Gols de Ouro por dia e posição (contador_global) em que ocorreram; alerta se diferença contador vs COUNT != 0.

### Fase 4 — Robustez operacional

- **Como saber que deu certo:** Nenhuma chamada de persistência de contador falhar sem retry ou sem falha explícita do request. Nenhuma reversão de saldo falhar sem alerta e sem registro para correção manual. Dashboards mostrando zero falhas silenciosas após o período de implantação.
- **Sinais a observar:** Alertas gerados em toda falha de saveGlobalCounter após retries; alertas em toda falha de reversão de saldo; redução de “mistérios” de saldo incorreto em suporte.
- **Métricas importantes:** Taxa de falha de persistência de contador; taxa de falha de reversão de saldo; tempo até primeiro alerta em ambiente de produção.

### Fase 5 — Lotes e estado fora da memória

- **Como saber que deu certo:** Após restart, listar lotes em andamento a partir do banco/store; comparar com chutes existentes por lote_id; nenhum lote “órfão” sem definição clara (completo ou cancelado). Idempotência consultada no store compartilhado; retry com mesma chave após restart ainda retorna 409.
- **Sinais a observar:** Histórico de lotes completo e auditável; relatórios por lote batendo com chutes; idempotência sobrevivendo a restart.
- **Métricas importantes:** Número de lotes ativos no store; consistência lote.chutes_count vs COUNT(chutes) por lote_id; uso do store de idempotência (leituras/escritas).

---

## 5. Riscos por fase

### Fase 1

- **Risco:** Cliente antigo (sem idempotency key) deixar de ser suportado. **Mitigação:** Backend continuar aceitando requests sem key; key opcional até cutoff definido; comunicar versão mínima do app quando key passar a ser obrigatória.
- **Risco:** Chave mal gerada no cliente (ex.: mesma chave para gestos diferentes) gerar 409 indevido. **Mitigação:** Política clara de geração de chave (por tentativa de chute, não por sessão); testes com diferentes gestos; monitorar 409 e feedback de usuários.

### Fase 2

- **Risco:** Transação longa ou lock excessivo aumentar latência e 409. **Mitigação:** Manter transação enxuta (apenas saldo + chute; contador na Fase 3); medir p95/p99 antes/depois; ter plano de rollback da transação se latência subir muito.
- **Risco:** Migração para transação introduzir bug e gerar duplo crédito ou duplo débito. **Mitigação:** Deploy em ambiente de staging com carga e falhas injetadas; feature flag ou rollout gradual; comparação de totais de saldo e chutes antes/depois em janela de teste.

### Fase 3

- **Risco:** Contador atômico mal integrado gerar “contador avança mas chute não” ou “chute sem contador”. **Mitigação:** Contador obtido dentro da mesma transação ou sequência que persiste o chute; testes de concorrência; reconciliação contador vs COUNT(chutes) em monitoramento.
- **Risco:** Comportamento de Gol de Ouro mudar (ex.: mudar de “1000º” para outro critério). **Mitigação:** Regra explícita e documentada; testes determinísticos; auditoria dos primeiros Gols de Ouro após deploy.

### Fase 4

- **Risco:** Retry agressivo em saveGlobalCounter ou reversão gerar carga extra ou deadlock. **Mitigação:** Limite de retries e backoff; tempo máximo de tentativa; alerta se ultrapassar; revisar timeouts de conexão com o banco.

### Fase 5

- **Risco:** Migração de lotes em memória para banco criar inconsistência temporária (dois mundos). **Mitigação:** Período em que apenas novas partidas usem lotes persistidos; ou janela de migração com leitura híbrida e escrita única no novo modelo; validação antes de desligar lotes em memória.
- **Risco:** Store de idempotência (ex.: Redis) indisponível travar o fluxo de chute. **Mitigação:** Política de fallback (negar chute com mensagem clara ou degradar para “sem idempotência” com alerta); health check do store; não depender de idempotência em memória como fallback silencioso em produção após Fase 5.

---

## 6. Plano de rollback conceitual

### Quando parar

- **Fase 1:** Se taxa de 409 subir de forma anormal e usuários legítimos forem bloqueados (ex.: chave gerada incorretamente); se houver evidência de que chutes válidos estão sendo rejeitados em massa.
- **Fase 2:** Se latência do endpoint de chute subir além do aceitável (ex.: p99 > 2x baseline); se reconciliação saldo vs chutes mostrar divergência nova após o deploy.
- **Fase 3:** Se contador e COUNT(chutes) divergirem; se Gol de Ouro aparecer em posição não múltipla de 1000 ou deixar de aparecer quando deveria.
- **Fase 4:** Se alertas de falha de persistência ou reversão indicarem regressão (ex.: falhas que não existiam antes); se carga no banco ou na aplicação subir de forma inesperada por retries.
- **Fase 5:** Se lotes persistidos ficarem inconsistentes com chutes; se idempotência em store falhar de forma que impeça chutes (e fallback não for aceitável).

### Quando voltar atrás

- Rollback de **código** para a versão anterior da fase em questão, mantendo compatibilidade com dados já escritos (ex.: se Fase 2 já escreveu em transação, a versão antiga pode não suportar ler apenas “último estado”; pode ser necessário rollback de dados apenas em cenário extremo, com plano de restauração de backup).
- Rollback de **cliente** (Fase 1): voltar a enviar versão que não envia idempotency key; backend continua aceitando. Sem rollback de dados.
- Rollback de **esquema ou store** (Fase 5): se lotes ou idempotência foram migrados para novo store, definir critério para “voltar a usar só memória” (geralmente só antes de tráfego alto no novo caminho); caso contrário, rollback pode ser apenas desativar escrita no novo store e manter leitura para auditoria.

### Evitar efeito cascata

- **Não** fazer rollback de Fase 2 (transação) sem considerar que Fase 3 pode depender dela; se Fase 3 já estiver em produção, rollback de Fase 2 pode exigir rollback de Fase 3 junto.
- **Não** desativar idempotência no backend (Fase 1) sem avisar; clientes novos podem depender de 409 para não reenviar.
- Manter **compatibilidade retroativa** entre fases: cada fase deve poder coexistir com a anterior (ex.: transação pode envolver apenas saldo+chute primeiro; contador atômico entra na mesma transação depois, sem quebrar quem já usa transação).

---

## 7. Estratégia de operação durante transição

### Sistema rodando enquanto corrige

- **Uma instância** até conclusão da Fase 5 e validação estável. Evitar escalar horizontalmente durante as correções.
- **Janelas de deploy** preferencialmente em horário de menor pico; evitar deploy de Fase 2 ou 3 em pico de Gol de Ouro (ex.: próximo a múltiplo de 1000 em contador global) para facilitar leitura de métricas.
- **Feature flags ou toggles** onde fizer sentido (ex.: “usar transação para chute” ligado após validação em staging) para desligar rapidamente sem novo deploy.

### Cuidado com usuários reais

- **Comunicação:** Se a chave de idempotência passar a ser obrigatória (Fase 1), avisar com antecedência e manter período de graça em que requests sem key ainda funcionem (com monitoramento de duplicidade).
- **Suporte:** Preparar resposta para “cobraram duas vezes” (antes da Fase 1) e “não consegui chutar” (possível 409 ou erro de rede); após Fase 1, explicar que retentar com o mesmo toque não deve cobrar de novo.
- **Saldo e extratos:** Ter como exportar ou consultar saldo e histórico de chutes por usuário para suporte e disputas; reconciliação saldo vs chutes (Fase 2 em diante) deve ser usada para corrigir casos pontuais quando necessário.

### Evitar inconsistências durante mudança

- **Não** alterar regra de negócio (valor do prêmio, posição do Gol de Ouro) no meio de uma fase; isso dificulta validação e rollback.
- **Não** fazer migração em massa de dados antigos (ex.: “recalcular todos os contadores”) sem backup e sem janela de manutenção; se necessário, fazer em etapa separada e com script testado em cópia do banco.
- **Congelar** mudanças concorrentes no mesmo fluxo (ex.: não lançar nova feature de bônus no chute no mesmo release da Fase 2 ou 3).

---

## 8. Dependências entre fases

| Fase | Depende de | Desbloqueia |
|------|------------|-------------|
| 1 — Idempotência | Nenhuma (backend já suporta key) | Redução imediata de débito duplicado; base para idempotência persistida na Fase 5 |
| 2 — Atomicidade saldo+chute | Nenhuma | Fase 3 (contador na mesma unidade de consistência); Fase 4 (reversão dentro da transação); Fase 5 (lotes/contador no banco) |
| 3 — Contador / Gol de Ouro | Fase 2 (transação ou sequência atômica) | Contador confiável para auditoria e para Fase 5 |
| 4 — Robustez operacional | Fluxo estável (Fase 2 e 3 concluídas) | Confiança operacional; detecção de regressão |
| 5 — Lotes / estado fora da memória | Fase 2 e 3 (fonte da verdade e transação) | Escala horizontal futura; fim de lotes órfãos |

**O que não pode ser invertido:**

- Fase 3 antes de Fase 2: contador atômico sem transação saldo+chute mantém janela de inconsistência.
- Fase 5 antes de Fase 2 e 3: persistir lotes e idempotência sem base transacional e sem contador confiável replica fragilidade para o banco.

---

## 9. Erros críticos a evitar

- **Implementar contador atômico (Fase 3) antes de resolver atomicidade saldo+chute (Fase 2).** O contador seria atualizado em um momento diferente do registro do chute; a deriva e a janela de falha continuariam possíveis.
- **Mexer em escala (múltiplas instâncias, mais réplicas do backend) antes de resolver atomicidade e contador.** Ampliaria débito duplicado, Gol de Ouro errado e inconsistência saldo vs chutes.
- **Deploy agressivo sem validação entre fases.** Fazer Fase 1+2+3 no mesmo release sem testes de cada uma dificulta diagnóstico e rollback; aumenta blast radius.
- **Tornar idempotency key obrigatória no backend antes do cliente estar em produção com key.** Usuários com app antigo seriam bloqueados (401/400) sem necessidade.
- **Persistir lotes (Fase 5) sem ter transação (Fase 2) e contador confiável (Fase 3).** Migrar estado em memória para banco sem corrigir a lógica que o atualiza pode consolidar inconsistências.
- **Ignorar falhas de saveGlobalCounter ou de reversão “por serem raras”.** Raras em ambiente controlado podem ficar frequentes sob carga ou falhas de rede; devem ser tratadas e monitoradas desde a Fase 4.
- **Assumir que “uma instância só” dispensa idempotência ou transação.** Débito duplicado e saldo incorreto já foram identificados em instância única (BLOCO I.2).

---

## 10. Conclusão estratégica

### Qual a sequência mais segura possível?

**Fase 1 → Fase 2 → Fase 3 → Fase 4 → Fase 5**, com validação explícita e critérios de “fase concluída” atendidos antes de avançar. Não pular fases; não reunir várias fases em um único big-bang deploy. Fase 4 pode ser parcialmente sobreposta à Fase 3 (monitoramento e alertas), mas o fechamento da robustez de reversão e de persistência de contador deve vir com o fluxo já estável (Fase 2 e 3).

### Como evitar incidentes?

- **Isolamento de risco:** cada deploy com uma mudança lógica principal; rollback possível por fase.  
- **Validação progressiva:** testes automatizados e manuais por fase; reconciliação saldo vs chutes e contador vs COUNT(chutes) em produção.  
- **Operação consciente:** janelas de deploy, feature flags, monitoramento e alertas; não desativar alertas de falha de reversão ou de persistência de contador.  
- **Não escalar antes de corrigir:** manter uma instância e carga controlada até Fase 5 estável.

### Como garantir confiança durante evolução?

- **Transparência:** documentar cada fase (o que mudou, como validar, como fazer rollback).  
- **Métricas e auditoria:** usar reconciliação e relatórios para provar que saldo, chutes e Gol de Ouro estão corretos após cada fase.  
- **Compatibilidade e comunicação:** clientes antigos continuam funcionando até cutoff definido; usuários e suporte informados quando o comportamento de retry e de 409 mudar (Fase 1).  
- **Segurança financeira primeiro:** qualquer dúvida entre “mais performance” e “mais consistência” — priorizar consistência; performance vem após as fases críticas.

---

*Documento gerado em modo READ-ONLY. Nenhuma alteração foi feita em código, banco, deploy ou arquitetura. Apenas estratégia de implementação com base nos blocos I, I.1, I.2 e I.3.*
