# PREPARAÇÃO — VALIDAÇÃO PRÁTICA I.5 (IDEMPOTÊNCIA) EM PREVIEW

**Projeto:** Gol de Ouro  
**Data:** 2026-03-17  
**Modo:** READ-ONLY ABSOLUTO — nenhuma alteração em código, branch, deploy, banco, headers ou configuração. Apenas verificação e documentação para teste.

**Objetivo:** Documentar se o ambiente de preview está pronto para a validação prática da Fase I.5 (idempotência do chute) e definir a sequência exata dos testes.

---

## 1. Preview identificado

O preview a ser usado na validação é o **deploy do Vercel** associado à branch que contém o commit da Fase I.5. A produção current permanece intocada e protegida.

| Campo | Valor / Instrução |
|-------|-------------------|
| **Branch** | `feature/bloco-e-gameplay-certified` |
| **Commit associado** | `b11e96de44bba18ae8a69c268209cbc2f2a6286a` — *feat: fase 1 (idempotência do chute) + pronto para preview* |
| **Deploy ID (Vercel)** | *A preencher no momento da validação:* obter no [Vercel Dashboard](https://vercel.com) → projeto do player → Deployments ou PR da branch → ID do deployment. |
| **URL do preview** | *A preencher no momento da validação:* URL do preview (ex.: `…-git-feature-bloco-e-gameplay-certified-….vercel.app` ou link do comentário do bot no PR). |

**Confirmação:** O commit existe no repositório e está na branch `feature/bloco-e-gameplay-certified` (local e `origin`). O preview correto é aquele cujo build foi gerado a partir **desse** commit (ou do HEAD atual dessa branch, se for o mesmo). Antes de iniciar os testes, confirmar no Vercel que o deploy escolhido corresponde a esse commit.

---

## 2. Commit validado

| Item | Valor |
|------|--------|
| **Hash (curto)** | `b11e96d` |
| **Hash (completo)** | `b11e96de44bba18ae8a69c268209cbc2f2a6286a` |
| **Mensagem** | `feat: fase 1 (idempotência do chute) + pronto para preview` |

Esse commit contém a alteração em `goldeouro-player/src/services/gameService.js` que passa a enviar o header `X-Idempotency-Key` em todo POST para `/api/games/shoot`. O backend já possuía a lógica de idempotência; nenhuma alteração de backend foi feita neste commit.

---

## 3. Escopo da validação

Será validado **apenas** o comportamento da Fase I.5 em ambiente de preview:

| # | O que será validado | Critério de sucesso |
|---|---------------------|----------------------|
| 1 | **Envio de X-Idempotency-Key** | Todo POST `/api/games/shoot` enviado pela tela `/game` inclui o header `X-Idempotency-Key` com valor não vazio. |
| 2 | **Retry com mesma key** | Se o mesmo request (mesma key) for reenviado (retry manual ou automático), o backend responde **409** e **não** realiza segundo débito nem segundo INSERT em `chutes`. |
| 3 | **Comportamento 200 / 409** | Primeiro request com key K → **200** e chute processado. Segundo request com a mesma key K (dentro do TTL) → **409** com mensagem de chute já processado. |
| 4 | **Ausência de segundo débito** | Em cenário de duplicata (mesma key): saldo debitado **uma vez**; tabela `chutes` com **um** registro para esse gesto. |
| 5 | **Retrocompatibilidade sem key** | Request POST `/api/games/shoot` **sem** header `X-Idempotency-Key` (ex.: curl/Postman) é aceito com **200** e chute registrado normalmente. |

Não faz parte deste escopo: alterar código, banco, deploy, configuração ou produção; validar overlays/interface (BLOCO F); validar transação saldo+chute ou contador global.

---

## 4. Pré-condições do teste

Antes de executar a sequência de testes, garantir:

| # | Pré-condição | Como verificar |
|---|--------------|----------------|
| 1 | **Página /game acessível no preview** | Abrir a URL do preview, fazer login (se necessário) e navegar até `/game`. A tela do jogo carrega e exibe campo, goleiro, zonas clicáveis e saldo. |
| 2 | **DevTools / Network disponíveis** | Abrir DevTools (F12 ou botão direito → Inspecionar), aba **Network**. Filtrar por "shoot" ou por URL que contenha `/api/games/shoot`. Manter aba aberta durante os testes. |
| 3 | **Conta de teste com saldo** | Usar uma conta com saldo ≥ 1 (valor da aposta) para permitir vários chutes. Anotar saldo inicial se for validar débito único no teste de duplicidade. |
| 4 | **Ambiente de preview isolado** | O preview aponta para o backend em uso (produção ou staging); não alterar variáveis de ambiente nem deploy. Confirmar que o backend é o esperado (mesmo que já suporte idempotência). |
| 5 | **Produção protegida** | Nenhum teste deve ser feito diretamente na URL de produção. Todos os testes ocorrem na **URL do preview** identificada na seção 1. |

Se alguma pré-condição falhar, **não** iniciar a sequência de testes; documentar o bloqueio e corrigir ambiente/acesso antes de nova tentativa.

---

## 5. Sequência exata dos testes

Executar **nesta ordem**, registrando resultado (passou / falhou) e evidência (print, status HTTP, contagem em banco quando aplicável).

### Teste 1 — Chute normal (fluxo feliz)

1. No preview, ir para `/game`.
2. Abrir DevTools → Network; filtrar por `shoot`.
3. Dar **um** chute (clicar em uma zona).
4. **Verificar:**  
   - Um POST para `/api/games/shoot` com status **200**.  
   - No request, header **`X-Idempotency-Key`** presente e com valor no formato tipo `shot-<timestamp>-<random>-<direction>-<value>`.  
   - Saldo atualizado (débito de 1); overlay de resultado exibido conforme esperado.
5. **Registrar:** passou ( ) / falhou ( ). Evidência: _______________

---

### Teste 2 — Duplicidade com mesma key (409)

1. **Opção A (recomendada):** No DevTools, após um chute com 200, clicar com botão direito no request POST `shoot` → **Replay** (ou "Reenviar"). Não alterar headers.  
   **Opção B:** Simular retry (ex.: throttling/offline no primeiro request) para que o axios reenvie o mesmo request.
2. **Verificar:**  
   - O segundo request envia a **mesma** `X-Idempotency-Key` do primeiro.  
   - Resposta do segundo request: **409** (e corpo com mensagem de chute já processado com essa chave).  
   - Saldo debitado **apenas uma vez** (não houve segundo débito).  
   - (Opcional) Consultar banco: um único registro em `chutes` para esse usuário/horário correspondente ao gesto.
3. **Registrar:** passou ( ) / falhou ( ). Evidência: _______________

---

### Teste 3 — Dois chutes distintos

1. Dar **dois** chutes separados (duas zonas ou duas jogadas em sequência).
2. **Verificar:**  
   - Dois POSTs para `/api/games/shoot`, cada um com **`X-Idempotency-Key` diferente**.  
   - Ambos com status **200**.  
   - Saldo debitado duas vezes (total 2); dois registros em `chutes` (se for viável conferir).
3. **Registrar:** passou ( ) / falhou ( ). Evidência: _______________

---

### Teste 4 — Request sem key (retrocompatibilidade)

1. Fora do navegador (curl, Postman ou similar), enviar um POST para o **mesmo** backend usado pelo preview:  
   `POST <base-url-backend>/api/games/shoot`  
   Headers: `Authorization: Bearer <token-válido>`, `Content-Type: application/json`.  
   **Não** incluir `X-Idempotency-Key`.  
   Body: `{ "direction": "C", "amount": 1 }`.
2. **Verificar:**  
   - Resposta **200**; chute processado; saldo debitado; um novo registro em `chutes`.
3. **Registrar:** passou ( ) / falhou ( ). Evidência: _______________

---

## 6. Critério de aprovação

A Fase I.5 é considerada **aprovada para deploy em produção** (com rollback disponível para `pre-fase1-idempotencia-2026-03-17`) quando:

- Todos os **quatro** testes acima forem executados e **passarem**.
- Houver evidência registrada (prints da Network, status 200/409, e opcionalmente contagem em banco) para cada teste.
- O preview utilizado for confirmado como o deploy do commit `b11e96de44bba18ae8a69c268209cbc2f2a6286a` (ou HEAD da branch `feature/bloco-e-gameplay-certified` com esse commit).
- Nenhuma regressão crítica for observada (jogo fluido, fases IDLE → SHOOTING → RESULT corretas, sem travas).

Após aprovação, atualizar o relatório `VALIDACAO-I5-IDEMPOTENCIA-2026-03-17.md` (ou documento de handoff) assinalando **APROVADO PARA DEPLOY** e documentar o deploy ID e a URL do preview utilizados.

---

## 7. Critério de bloqueio

A validação fica **BLOQUEADA** e a Fase I.5 **não** deve ser promovida para produção se:

- **Preview indisponível ou incorreto:** URL do preview não abre, ou o deploy não corresponde ao commit da Fase I.5 (ex.: build sem o header `X-Idempotency-Key`).
- **Teste 1 falha:** Header `X-Idempotency-Key` ausente ou POST sem 200 em chute normal.
- **Teste 2 falha:** Segundo request com mesma key não retorna 409, ou há segundo débito / segundo registro em `chutes`.
- **Teste 3 falha:** Dois chutes distintos não geram duas keys diferentes ou não retornam ambos 200 com dois débitos.
- **Teste 4 falha:** Request sem key não é aceito (ex.: 400/401/500 indevido) ou chute não registrado.
- **Regressão:** Tela `/game` trava, fases quebradas ou erro sistemático que impeça jogar.

Em caso de bloqueio, documentar qual teste falhou, a evidência e o motivo. Não alterar código, deploy ou banco; apenas registrar e comunicar para decisão de correção em ciclo posterior.

---

*Documento gerado em modo READ-ONLY. Nenhuma alteração foi feita em código, branch, deploy, banco, headers ou configuração. Objetivo: preparar e documentar a validação prática da Fase I.5 em preview.*
