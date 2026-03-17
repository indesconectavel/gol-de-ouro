# AUDITORIA — BLOCO H — ECONOMIA E RETENÇÃO DO JOGO

**Projeto:** Gol de Ouro  
**Bloco:** H — Economia e retenção  
**Data:** 2026-03-16  
**Modo:** READ-ONLY ABSOLUTO — análise, cruzamento de evidências e documentação. Nenhuma alteração de código, patch, refatoração, commit, merge, deploy ou banco.

---

## 1. Resumo executivo

A **economia do jogo** é **matematicamente sustentável** no formato atual: margem de 50% por lote (R$ 10 arrecadados, R$ 5 de prêmio), RTP de 50%, e o Gol de Ouro (R$ 100 a cada 1000 chutes) impacta a margem média de forma limitada em volume normal. Do ponto de vista de **produto**, o modelo é **simples e transparente**, o que favorece entendimento e operação, mas gera **previsibilidade total** do resultado (10º chute = goal) e **pouca variação emocional** entre rodadas: o jogador perde R$ 1 em 9 de cada 10 chutes e ganha R$ 5 no décimo, com feedback claro (defesa / gol / Gol de Ouro). O **loop é curto e repetitivo** — apostar → chutar → resultado → nova tentativa — o que pode sustentar **sessões curtas e recorrência** (custo baixo por ação, recompensa clara quando vem), mas também **saturação e desgaste** se não houver progressão emocional ou variação. O **Gol de Ouro** funciona como **âncora de expectativa** (R$ 100 a cada 1000 chutes) e reforço emocional forte quando ocorre; porém, na tela oficial (GameFinal) o **contador “chutes até próximo Gol de Ouro” não é exibido no HUD**, o que reduz a antecipação explícita no fluxo principal. **Retenção para V1** é **possível** em ambiente de baixo volume e expectativas alinhadas (jogo de habilidade determinístico, 1 em 10 ganha por lote); a **longevidade** do produto depende de aceitar a previsibilidade como regra e de não depender apenas do Gol de Ouro como única emoção. **Diagnóstico consolidado:** **VALIDAS COM RESSALVAS IMPORTANTES** — economia sustentável e loop funcional, com ressalvas em previsibilidade, variação emocional e exposição do Gol de Ouro na interface oficial.

---

## 2. Escopo analisado

| Categoria | Itens |
|-----------|--------|
| **Documentos** | `docs/ARQUITETURA-BLOCOS-GOLDEOURO.md`, `docs/ROADMAP-V1-GOLDEOURO.md`, `docs/RELATORIO-MESTRE-HANDOFF-GOLDEOURO-V1.md`, `docs/relatorios/ENCERRAMENTO-PREMIUM-BLOCO-E-GAMEPLAY-V1.md`, `docs/relatorios/MAPA-COMPLETO-DE-RISCO-OPERACIONAL-GOLDEOURO-2026-03-16.md`, `docs/relatorios/AUDITORIA-ROTAS-PLAYER-GOLDEOURO-2026-03-16.md`, `docs/relatorios/AUDITORIA-ANTIFRAUDE-BLOCO-G-READONLY-2026-03-09.md` |
| **Frontend (experiência do jogador)** | `goldeouro-player/src/pages/GameFinal.jsx` (HUD: saldo, chutes, ganhos, gols de ouro; overlays: goool, defendeu, ganhou, Gol de Ouro; toasts; fluxo IDLE → SHOOTING → RESULT → IDLE), `goldeouro-player/src/pages/Dashboard.jsx` (saldo, botão Jogar, Depositar, Sacar, Perfil), `goldeouro-player/src/services/gameService.js` (processShot, getShotsUntilGoldenGoal, getGoldenGoalInfo, batchConfigs) |
| **Economia (regras e números)** | Bloco E: valor R$ 1, lote 10, 10º = goal, prêmio R$ 5, Gol de Ouro R$ 100 a cada 1000 chutes; RTP 50%, margem 50%; tabela por evento (miss -1, goal +4, goal+Gol de Ouro +104) |
| **Evidências de produto** | Mensagens ao jogador: "Saldo insuficiente", "GOL! Você ganhou R$ X", "GOL DE OURO! Você ganhou R$ X", "Defesa! Tente novamente."; HUD GameFinal: SALDO, CHUTES, GANHOS, GOLS DE OURO, "R$ 1,00 por chute"; ausência de exibição de "chutes até próximo Gol de Ouro" no HUD do GameFinal (estado existe, não é mostrado na tela oficial) |

---

## 3. Premissas oficiais da V1

| Premissa | Definição |
|----------|-----------|
| **Valor do chute** | R$ 1 (único valor aceito). |
| **Tamanho do lote** | 10 chutes. |
| **Posição do goal** | 10º chute (determinístico). |
| **Prêmio base** | R$ 5 por goal. |
| **Gol de Ouro** | Bônus R$ 100 quando o goal coincide com contador global múltiplo de 1000. |
| **Repetição de jogador** | Mesmo jogador pode chutar várias vezes no mesmo lote. |
| **Gameplay oficial** | Rota `/game`, componente GameFinal; chute via gameService → POST /api/games/shoot. |
| **Instância única** | Operação prevista para uma instância do backend. |

---

## 4. Diagnóstico da economia do jogo

| Dimensão | Análise | Impacto econômico | Status |
|----------|---------|-------------------|--------|
| **Sustentabilidade 10×1=10 / prêmio 5 / lucro 5** | Por lote: arrecadação R$ 10, saída R$ 5, margem R$ 5 (50%). Modelo fechado e previsível. | Favorável para a plataforma. | Favorável |
| **RTP efetivo** | RTP por lote = 50% (5/10 retorna como prêmio). Por chute: 9×(-1) + 1×(+4) = -5 para jogadores; margem 50%. | Consistente com modelo de “casa”. | Favorável |
| **Margem real da plataforma** | 50% da arrecadação por lote no caso médio (sem Gol de Ouro). | Alta para jogo monetizado. | Favorável |
| **Efeito do Gol de Ouro na margem média** | A cada 1000 chutes há 1 Gol de Ouro (R$ 100 extra). Por 1000 chutes: ~100 lotes, arrecadação R$ 1000, saída ~100×5 + 100 = R$ 600; margem ~R$ 400 (~40%). A margem média cai um pouco mas segue positiva. | Moderado; margem continua sustentável. | Favorável |
| **Impacto da repetição do mesmo jogador no lote** | Um jogador pode ocupar várias posições (1ª a 9ª ou a 10ª). Não altera a matemática do lote: 10 in, 5 out. Pode concentrar ganho ou perda em uma única conta. | Neutro na margem; relevante para percepção (um usuário pode “levar” vários misses e um goal). | Neutro |
| **Risco de percepção de “cassino travado” ou “vitória controlada”** | O resultado é 100% determinístico (índice no lote). Quem conhece a regra sabe que o 10º é sempre gol. Pode ser visto como “combinado” se a regra vazar. | Risco de percepção de injustiça ou manipulação se não for comunicado como regra de produto. | Desfavorável (percepção) |
| **Equilíbrio previsibilidade vs emoção** | Previsibilidade é total para quem entende o lote; emoção vem do “ser eu o 10º?”, do Gol de Ouro e do feedback visual/sonoro. Equilíbrio frágil: pouco surpresa, muita repetição. | Produto mais “ritual” do que “sorte”. | Neutro a desfavorável |
| **Robustez econômica para V1** | Matemática consistente; sem variáveis ocultas; margem clara. Adequado para operação controlada e volume moderado. | Sustentável no formato atual. | Favorável |

**Conclusão:** A economia é **sustentável e robusta** para V1. A **previsibilidade** é risco de **produto e percepção**, não de contabilidade.

---

## 5. Diagnóstico de retenção

| Dimensão | Análise | Impacto em retenção | Status |
|----------|---------|---------------------|--------|
| **Vontade de continuar jogando** | Feedback imediato (defesa / gol); custo baixo (R$ 1); “Tente novamente” após defesa. Loop simples pode incentivar “mais uma”. Depende de saldo e de tolerância à repetição. | Moderado: funciona para sessões curtas. | Aceitável na V1 |
| **Repetição do ciclo** | Ciclo apostar → chutar → resultado é rápido; sem barreiras (exceto saldo). Fácil repetir várias vezes seguidas. | Alto para quem está engajado. | Favorável |
| **Risco de abandono precoce** | Jogador que perde 5–9 seguidas sem ganhar pode abandonar por frustração ou por perceber que “só o 10º ganha”. Sem progressão visível (níveis, streaks, recompensas diárias) além de saldo e totais. | Moderado a alto para perfis sensíveis à frustração. | Desfavorável |
| **Potencial de recorrência** | Depósito PIX e “Recarregar” no jogo facilitam retorno. Dashboard com Jogar, Depositar, Sacar mantém fluxo claro. Nenhum gancho de médio prazo (eventos, metas, ranking) na experiência oficial. | Moderado: recorrência por hábito e saldo, não por progressão. | Aceitável na V1 |
| **Sessões curtas e repetidas** | R$ 1 por chute favorece muitas tentativas com pouco gasto; ideal para uso em sessões curtas e repetidas. | Alto. | Favorável |
| **Elementos para retenção de curto prazo** | Saldo visível, ganhos totais, gols de ouro no HUD; toasts de gol/defesa; botão Recarregar. Suficiente para “jogar mais um pouco”. | Moderado. | Aceitável na V1 |
| **Elementos para retenção de médio prazo** | Não há metas, streaks, níveis, ligas ou eventos na tela oficial. Apenas totais (chutes, ganhos, gols de ouro). | Baixo. | Desfavorável |
| **Risco de saturação por repetição** | Mesmo loop: escolher zona, chutar, ver resultado. Sem variação de regra nem de narrativa. Risco de “enjoar” após muitas sessões. | Moderado a alto em uso intenso. | Desfavorável |

**Conclusão:** Retenção **suficiente para V1** em contexto de **sessões curtas e custo baixo**, com **risco de abandono** por frustração ou saturação e **pouco suporte** a retenção de médio prazo.

---

## 6. Diagnóstico psicológico do loop

| Dimensão | Análise | Impacto em retenção | Status |
|----------|---------|---------------------|--------|
| **Efeito do “quase ganhar”** | Chutes 1–9 são “defesa”; o jogador “quase” acerta (escolheu a zona, mas o resultado é pelo índice, não pela zona na V1). Pode gerar sensação de “quase” se o usuário não souber que o resultado é por posição no lote. Quem entende a regra sabe que não “quase ganhou” — só não era o 10º. | Ambíguo: “quase” pode motivar ou frustrar conforme entendimento. | Neutro |
| **Efeito do 10º chute** | Quem faz o 10º chute ganha R$ 5 (ou R$ 105 se Gol de Ouro). Recompensa clara e celebrada (overlay, toast). Gera motivação para “ser o próximo 10º”. | Alto no momento da vitória. | Favorável |
| **Percepção de justiça** | Regra fixa (10º = goal) pode ser vista como justa (“todo mundo tem a mesma chance de ser o 10º”) ou como injusta (“só um ganha por lote”). Depende de comunicação e expectativa. | Pode ser favorável ou desfavorável conforme framing. | Neutro |
| **Percepção de chance real de vitória** | 1 em 10 por lote; em média 1 goal a cada 10 chutes. Chance “real” no sentido matemático; previsível para quem conhece o sistema. | Transparente; pode reduzir ilusão de controle. | Neutro |
| **Motivação para continuar** | “Tente novamente” após defesa; ganhos e gols de ouro no HUD; possibilidade de Gol de Ouro (R$ 100). Motivação baseada em recompensa imediata e em expectativa do bônus. | Moderada. | Aceitável na V1 |
| **Risco de perceber a lógica cedo e perder interesse** | Se o jogador descobre que o 10º é sempre gol e que não há “habilidade” no resultado, pode achar o jogo mecânico e perder interesse. | Alto para jogadores que buscam habilidade ou surpresa. | Desfavorável |
| **Papel do Gol de Ouro como reforço emocional** | Evento raro (1 em 1000 chutes) com recompensa alta (R$ 100). Forte reforço positivo quando ocorre; mantém expectativa de “pode ser na próxima”. | Alto no evento; mantém esperança entre eventos. | Favorável |
| **Risco do Gol de Ouro virar a única emoção relevante** | Se o prêmio de R$ 5 parecer pequeno, o jogador pode passar a jogar “só pelo Gol de Ouro”, tornando 999 de 1000 chutes emocionalmente neutros ou negativos. | Moderado a alto. | Desfavorável |

**Conclusão:** O loop gera **recompensa clara no goal** e **reforço forte no Gol de Ouro**, com **risco** de desengajamento por **previsibilidade** ou por **foco excessivo** no bônus.

---

## 7. Diagnóstico do Gol de Ouro

| Dimensão | Análise | Impacto | Status |
|----------|---------|---------|--------|
| **Valor psicológico** | Evento raro e de alto valor (R$ 100); gera pico de emoção e memória positiva. Mantém expectativa (“pode cair para mim”). | Alto. | Favorável |
| **Valor econômico** | R$ 100 a cada 1000 chutes; diluído na margem média (margem cai de 50% para ~40% considerando o bônus). Sustentável. | Moderado para plataforma. | Favorável |
| **Impacto em retenção** | Pode manter jogadores “mais um pouco” pela esperança do bônus. Se o contador “chutes até próximo” fosse visível na tela oficial, antecipação seria maior; em GameFinal esse número **não é exibido no HUD** (apenas em GameShoot, tela legado). | Moderado; poderia ser maior com countdown visível. | Neutro a favorável |
| **Risco de dependência do bônus** | Jogador pode desvalorizar o goal de R$ 5 e jogar só “pelo Gol de Ouro”, tornando a experiência entre os 1000 chutes mais fria. | Moderado. | Desfavorável |
| **Aumenta sensação de oportunidade?** | Sim: “a qualquer momento pode ser o múltiplo de 1000”. | Alto. | Favorável |
| **Enfraquece o valor do prêmio comum (R$ 5)?** | Possível: R$ 5 pode parecer pouco perto de R$ 100. Depende de comunicação e de perfil do jogador. | Moderado. | Desfavorável (risco) |
| **Jogo parece sem graça fora dos múltiplos de 1000?** | Risco real: se a única “grande emoção” for o Gol de Ouro, os chutes ordinários podem parecer rotineiros. | Moderado a alto. | Desfavorável (risco) |

**Conclusão:** O Gol de Ouro **fortalece retenção e emoção** quando ocorre e como expectativa, mas **pode desequilibrar** a percepção do prêmio base e **concentrar** a emoção em um evento raro.

---

## 8. Principais forças do modelo atual

- **Economia clara e sustentável:** Margem 50%, RTP 50%, números fechados por lote; fácil de operar e auditar.
- **Custo baixo por ação (R$ 1):** Facilita múltiplas tentativas e sessões curtas sem comprometer muito o bolso.
- **Feedback imediato:** Defesa / gol / Gol de Ouro com overlays e toasts; o jogador sabe na hora o resultado.
- **Loop simples:** Apostar → chutar → resultado → repetir; pouca fricção, fácil de entender.
- **Gol de Ouro como âncora emocional:** Evento raro de alto valor; gera pico de emoção e expectativa.
- **Transparência matemática:** Quem quiser pode entender a regra; reduz sensação de “truque”.
- **Totais visíveis no HUD:** Saldo, chutes, ganhos, gols de ouro dão sensação de progresso numérico.
- **Integração com depósito/saque:** Fluxo Jogar / Depositar / Sacar coerente; facilita recorrência por saldo.

---

## 9. Principais fragilidades do modelo atual

- **Previsibilidade total do resultado:** 10º chute = goal é regra fixa; quem descobre pode achar o jogo mecânico ou “combinado”.
- **Pouca variação emocional:** Mesmo loop; sem níveis, metas, eventos ou narrativa que variem a experiência.
- **Falta de progressão de médio prazo:** Nenhum objetivo além de “ganhar neste chute” ou “chegar no Gol de Ouro”; risco de saturação.
- **“Chutes até próximo Gol de Ouro” não exibido no GameFinal:** O estado existe e é atualizado, mas não aparece no HUD da tela oficial; perde-se reforço de antecipação.
- **Risco de o Gol de Ouro ofuscar o prêmio base:** R$ 5 pode parecer pouco; jogador pode jogar “só pelo bônus”.
- **Possível sensação de injustiça:** “Sempre perco nos primeiros 9” ou “o 10º sempre é de outro” se o framing não for claro.
- **Comportamento oportunista:** Regra previsível permite “sniping” do 10º ou coordenação (multi-conta); já mapeado no Bloco G e no mapa de risco.
- **Ritmo muito repetitivo:** Sem variação de dificuldade, narrativa ou recompensa intermediária; desgaste em uso intenso.

---

## 10. Top 10 riscos de economia e retenção

| # | Risco | Área | Impacto em retenção | Impacto econômico | Severidade |
|---|--------|------|---------------------|-------------------|------------|
| 1 | **Previsibilidade percebida (10º = goal)** | Produto | Alto: perda de interesse se jogador achar o jogo “combinado”. | Baixo. | Crítico (produto) |
| 2 | **Gol de Ouro como única emoção relevante** | Psicologia | Alto: 999 de 1000 chutes podem parecer rotineiros. | Baixo. | Alto |
| 3 | **Abandono precoce por sequência de defesas** | Retenção | Alto: 5–9 defesas seguidas sem progressão visível. | Baixo. | Alto |
| 4 | **Saturação por repetição do mesmo loop** | Ritmo | Alto: falta de variação pode cansar. | Baixo. | Alto |
| 5 | **Prêmio R$ 5 desvalorizado perante R$ 100** | Gol de Ouro | Moderado: foco só no bônus. | Baixo. | Moderado |
| 6 | **Falta de progressão de médio prazo** | Retenção | Alto: nada para “voltar amanhã” além de saldo. | Baixo. | Moderado |
| 7 | **Percepção de injustiça (“só o 10º ganha”)** | Psicologia | Moderado: reclamações ou desconfiança. | Baixo. | Moderado |
| 8 | **Comportamento oportunista (sniping / multi-conta)** | Produto / Antifraude | Moderado: desequilíbrio e possível sensação de “trapaça” por outros. | Moderado (fraude). | Moderado |
| 9 | **Countdown do Gol de Ouro não visível no GameFinal** | Produto | Moderado: menos antecipação na tela principal. | Baixo. | Moderado |
| 10 | **Economia “fria” (apenas números, pouca narrativa)** | Ritmo | Moderado: pouco vínculo emocional além de ganhar/perder. | Baixo. | Moderado |

---

## 11. O que é aceitável para a V1

- **Economia 10 in / 5 out / 5 margem:** Sustentável e transparente.
- **RTP 50% e margem 50%:** Consistente com o modelo; aceitável como decisão de produto.
- **Gol de Ouro R$ 100 a cada 1000 chutes:** Sustentável; margem média continua positiva.
- **Loop curto (apostar → chutar → resultado):** Adequado para sessões curtas e custo baixo.
- **Feedback imediato (defesa / gol / Gol de Ouro):** Suficiente para V1.
- **HUD com saldo, chutes, ganhos, gols de ouro:** Dados suficientes para o jogador se situar.
- **Regra determinística (10º = goal):** Aceitável como regra de produto, desde que comunicada.
- **Mesmo jogador pode repetir no lote:** Aceitável; já documentado.
- **Ausência de metas/streaks/eventos na tela oficial:** Aceitável para V1; melhoria de médio prazo.
- **Risco de saturação e de previsibilidade:** Aceitável como limite conhecido da V1, com monitoramento.

---

## 12. O que ameaça a longevidade do produto

- **Descoberta generalizada da regra do 10º:** Se a maioria dos jogadores passar a ver o jogo como “só o 10º ganha” e não como “habilidade/sorte”, a atratividade pode cair.
- **Saturação pelo mesmo loop:** Uso intenso e repetitivo sem nova camada (eventos, metas, variação) pode reduzir retorno e sessões.
- **Gol de Ouro como única razão para jogar:** Experiência entre os múltiplos de 1000 fica “fria”; dependência de um evento raro fragiliza o engajamento diário.
- **Abandono após sequências longas de defesa:** Jogadores que não ganham em muitas tentativas podem churn sem ver “progresso” ou “quase”.
- **Percepção de injustiça ou “cassino travado”:** Se a regra for mal comunicada ou mal interpretada, confiança e retenção caem.
- **Comportamento oportunista visível:** Se “snipers” ou multi-conta forem percebidos como vantagem injusta, jogadores casuais podem desistir.
- **Falta de ganchos de médio prazo:** Nenhum motivo claro para “voltar amanhã” além de saldo e esperança no Gol de Ouro; dificulta retenção em janelas de dias/semanas.

---

## 13. Diagnóstico consolidado do BLOCO H

**VALIDAS COM RESSALVAS IMPORTANTES**

Justificativa:

- **Economia:** Sustentável (margem 50%, RTP 50%, Gol de Ouro diluído); robusta para V1. **Favorável.**
- **Retenção:** Loop simples e de custo baixo favorece sessões curtas e repetidas; suficiente para V1 com expectativas alinhadas. **Aceitável**, com ressalva de abandono e saturação.
- **Psicologia do loop:** Recompensa clara no goal e reforço forte no Gol de Ouro; risco de previsibilidade e de desvalorização do prêmio base. **Aceitável na V1**, com ressalvas.
- **Gol de Ouro:** Fortalece emoção e expectativa; risco de virar a única emoção relevante. **Favorável com ressalva.**
- **Ressalvas importantes:** (1) Previsibilidade total do 10º chute pode reduzir atratividade se descoberta em massa. (2) Pouca variação emocional e progressão de médio prazo. (3) Countdown do Gol de Ouro não exibido no HUD do GameFinal. (4) Risco de saturação e de foco excessivo no bônus.

Não se classifica como **ECONOMIA E RETENÇÃO VALIDAS PARA V1** (sem ressalvas) porque os riscos de produto e percepção são reais. Não se classifica como **FUNCIONAIS MAS FRÁGEIS** nem **NÃO SUSTENTADAS** porque a economia é sólida e o loop é utilizável para V1 com limites aceitos.

---

## 14. Conclusão objetiva

- **O jogo tem retenção suficiente para a V1?**  
  **Sim**, em contexto de **sessões curtas**, **custo baixo por chute** e **expectativa alinhada** (jogo determinístico, 1 em 10 ganha por lote). Retenção é **moderada**: suficiente para operar e iterar, com **risco de abandono** por frustração ou saturação e **pouco suporte** a retenção de médio prazo.

- **A economia é boa para produto real?**  
  **Sim**, do ponto de vista **matemático e operacional**: sustentável, transparente, margem clara. Do ponto de vista **de produto**, é **boa para um V1 simples**, com **ressalvas** em previsibilidade e variação emocional.

- **Qual é a maior força do modelo?**  
  **Simplicidade e sustentabilidade**: economia fechada (10 in, 5 out, 5 margem), R$ 1 por ação, feedback imediato e Gol de Ouro como âncora de expectativa. Facilita operação e entendimento.

- **Qual é a maior fragilidade?**  
  **Previsibilidade total** (10º = goal) e **pouca variação emocional**: quem descobre a regra pode achar o jogo mecânico; o loop pode saturar sem progressão ou narrativa adicional.

- **Qual deve ser o próximo passo após o Bloco H?**  
  (1) **Operar a V1 com ressalvas de produto**: comunicar claramente a natureza do jogo (regra do lote, 1 em 10, Gol de Ouro) para alinhar expectativas. (2) **Considerar** exibir “chutes até próximo Gol de Ouro” no HUD do GameFinal (dado já disponível) para reforçar antecipação. (3) **Monitorar** retenção, taxa de abandono após sequências de defesa e percepção do prêmio R$ 5 vs R$ 100. (4) Para **longevidade**: evoluir com camadas de progressão (metas, eventos, streaks) ou variação de experiência em ciclo posterior, sem alterar a economia oficial sem decisão de produto.

---

*Documento gerado em modo READ-ONLY. Nenhum código, banco, patch, commit, merge ou deploy foi alterado ou sugerido como já aplicado.*

**Arquivo:** `docs/relatorios/AUDITORIA-BLOCO-H-ECONOMIA-E-RETENCAO-GOLDEOURO-2026-03-16.md`
