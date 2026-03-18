# ENCERRAMENTO DO CICLO — I.5 (IDEMPOTÊNCIA) E TRANSIÇÃO BLOCO F

**Projeto:** Gol de Ouro  
**Data:** 2026-03-17  
**Modo:** READ-ONLY — nenhuma alteração em código, banco ou deploy. Documento de encerramento e governança.

---

## 1. Resumo executivo

Este ciclo abordou a **Fase I.5 (idempotência do chute)** e a **validação da interface da página /game (BLOCO F)**. A **produção permanece estável** e protegida por tag de rollback; o **preview** da branch de trabalho apresentou **regressões estruturais** na tela `/game` (stage, escala, overlays), tornando-o inadequado para validação funcional da I.5 e para promoção. O veredito do ciclo é **BLOQUEADO**: a validação da idempotência fica suspensa até a correção do BLOCO F e a próxima etapa oficial é um novo ciclo focado exclusivamente no BLOCO F.

---

## 2. Objetivo do ciclo

- **Implementar a idempotência do chute (I.5):** garantir que retries e cliques duplos não gerem débito duplicado, via header `X-Idempotency-Key` e rejeição 409 no backend.
- **Validar a interface da página /game (BLOCO F):** assegurar paridade visual e funcional da tela de jogo entre preview e produção (stage, overlays, assets).

---

## 3. O que foi feito

- **Implementação da I.5 no frontend:** geração e envio de `X-Idempotency-Key` em todo POST para `/api/games/shoot` no `gameService.js` (player), com keys distintas por chute e mesma key em retries (config do axios preservado).
- **Uso do backend já preparado:** o endpoint `/api/games/shoot` já possuía leitura da key, cache em memória (TTL 120s) e resposta 409 para key duplicada; nenhuma alteração de backend foi necessária neste ciclo.
- **Criação de branch dedicada:** trabalho concentrado em `feature/bloco-e-gameplay-certified`.
- **Criação de tag de rollback:** tag `pre-fase1-idempotencia-2026-03-17` apontando para o commit `16177266d702a75c101947e9bf397540acaeb103`, permitindo rollback seguro de backend e frontend.
- **Criação de múltiplos relatórios técnicos:** preparação I.5, validação I.5 (análise estática), validação prática (template), veredito final I.5, comparação forense produção vs preview, auditoria de assets da /game, status geral do projeto.

---

## 4. O que foi validado

- **I.5 validada em código (análise estática):** relatório `VALIDACAO-I5-IDEMPOTENCIA-2026-03-17.md` confirma header em toda chamada, keys distintas por chute, mesma key em retries, backend rejeitando duplicata com 409 e aceitando request sem key; fluxo de chute preservado e sem alteração em `GameFinal.jsx` (fases, guardas, UI).
- **Fluxo de chute preservado:** lógica de saldo, lote, contador e INSERT em `chutes` permanece inalterada; a idempotência atua apenas na deduplicação antes do processamento.
- **Produção protegida:** deploy atual não foi alterado; referência de rollback (`pre-fase1-idempotencia-2026-03-17`) está no remoto e produção permanece ancorada nesse estado.

---

## 5. Problemas encontrados

- **Preview com regressão estrutural no palco (/game):** a tela de jogo no preview da branch `feature/bloco-e-gameplay-certified` não replica o layout aprovado em produção.
- **Quebra de escala/layout:** stage não centralizado ou com proporção/escala incorreta em relação ao referencial de produção (base 1920x1080 e `layoutConfig.js`).
- **Overlays fora de posição:** overlays de resultado (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) reportados no **canto inferior esquerdo** em vez do centro (`top: 50%`, `left: 50%`, `transform: translate(-50%, -50%)`), caracterizando regressão crítica de fidelidade visual.
- **Possível divergência de assets:** overlay GOOOL com imagem diferente da aprovada; existência de assets extras no preview (`gol_normal.png`, `gol_de_ouro.png`, `ganhou_100.png`, `ganhou_5.png`) não referenciados pelo `GameFinal.jsx`, com risco de uso indevido ou confusão com `goool.png`.
- **Ambiente não confiável para validação funcional:** enquanto a interface da `/game` estiver regredida, qualquer teste de I.5 em preview (200/409, saldo, contagem em `chutes`) não pode ser considerado representativo da experiência de produção nem garantir ausência de regressão de UX.

---

## 6. Descoberta crítica

A **validação funcional da I.5 não pode ser concluída** enquanto o BLOCO F (interface da página /game) estiver inconsistente. O problema é **estrutural**, não pontual: não se trata apenas de um overlay desalinhado, e sim de um estado do preview onde stage, escala e overlays não estão em paridade com produção, invalidando o uso do preview como ambiente de validação para o fluxo de chute e para decisões de promoção.

---

## 7. Decisão tomada

- **Pausar a validação da I.5** em ambiente até que o BLOCO F seja corrigido e revalidado.
- **Priorizar o BLOCO F** no próximo ciclo: correção de stage (escala/layout), overlays e auditoria de assets.
- **Não promover o preview para produção:** o build atual do preview permanece bloqueado para go-live.
- **Manter produção ancorada na tag de rollback:** referência oficial `pre-fase1-idempotencia-2026-03-17`; nenhum deploy para produção a partir do preview até conclusão do BLOCO F e, em seguida, validação prática da I.5.

---

## 8. Estado final do sistema

| Eixo        | Status       |
|------------|---------------|
| I.5        | BLOQUEADO     |
| BLOCO F    | CRÍTICO       |
| Produção   | ESTÁVEL       |

- **I.5:** implementada em código; validação prática em ambiente suspensa por dependência do BLOCO F.
- **BLOCO F:** regressões visuais e possíveis divergências de assets; bloqueador para validação da I.5 e para promoção.
- **Produção:** estável, sem alterações de deploy neste ciclo; rollback disponível.

---

## 9. Próxima etapa oficial

- **Iniciar novo ciclo focado exclusivamente no BLOCO F.**
- Corrigir o **stage** (escala/layout) para paridade com produção (1920x1080, centralização).
- Validar e corrigir **overlays** (GOOOL, GANHOU, DEFENDEU, GOLDEN GOAL) em posição central.
- **Auditar assets** da `/game`: confirmar que `goool.png` e demais overlays são idênticos aos aprovados; eliminar ou documentar uso de assets extras (`gol_normal.png`, etc.) para evitar confusão.
- **Garantir paridade total com produção** na tela `/game` antes de retomar a validação funcional da I.5 em preview.

---

## 10. Regra de governança

**Nenhuma validação funcional (incluindo I.5) deve ocorrer enquanto houver regressão visual no BLOCO F.** O preview só poderá ser usado como ambiente de validação para idempotência e para decisões de promoção após confirmação, com evidência (prints/vídeo e relatório), de que stage, overlays e assets da `/game` estão em paridade com produção.

---

## 11. Veredito final

**BLOQUEADO**

O ciclo encerra com I.5 implementada em código e produção estável, porém com validação prática da I.5 suspensa e BLOCO F em estado crítico no preview. Não há aprovação para promoção do preview à produção nem para considerar a I.5 validada em ambiente até conclusão do próximo ciclo (BLOCO F).

---

*Documento gerado em modo READ-ONLY. Nenhuma alteração foi feita em código, banco ou deploy.*
