# VALIDAÇÃO PRÁTICA I.5 — IDEMPOTÊNCIA DO CHUTE (PREVIEW)

**Projeto:** Gol de Ouro  
**Data:** 2026-03-17  
**Modo:** READ-ONLY OPERACIONAL — permitido inspecionar preview, DevTools, disparar requests de teste e observar; proibido alterar código, banco, deploy ou promover para produção.

**Objetivo:** Executar a validação prática da Fase I.5 no deploy preview correspondente ao commit `b11e96de44bba18ae8a69c268209cbc2f2a6286a`, sem alterar produção.

---

## 1. Preview validado

| Campo | Valor |
|-------|--------|
| **Commit** | `b11e96de44bba18ae8a69c268209cbc2f2a6286a` — *feat: fase 1 (idempotência do chute) + pronto para preview* |
| **Branch** | `feature/bloco-e-gameplay-certified` |
| **Deploy ID (Vercel)** | *A preencher no momento da validação:* obter no Vercel Dashboard → Deployments ou PR da branch. |
| **URL do preview** | *A preencher no momento da validação:* URL do preview (ex.: `…-git-feature-bloco-e-gameplay-certified-….vercel.app`). |

**Confirmação:** O preview correto é o build do Vercel gerado a partir desse commit. Antes dos testes, confirmar no dashboard que o deploy utilizado corresponde a esse commit. Produção current permanece intocada.

---

## 2. Teste 1 — Chute normal

**Procedimento:** Abrir `/game` no preview → DevTools → Network (filtrar por `shoot`) → dar 1 chute normal.

**Verificações:**
- POST `/api/games/shoot` com status **200**
- Header **X-Idempotency-Key** presente no request
- Saldo reduzido uma vez
- Comportamento normal da UI (overlay, fases)

| Item | Esperado | Resultado | Evidência |
|------|----------|-----------|-----------|
| Status HTTP | 200 | *A preencher após execução* | |
| Header X-Idempotency-Key | Presente, valor não vazio | *A preencher após execução* | |
| Saldo | Reduzido 1 vez | *A preencher após execução* | |
| UI | Normal, sem travar | *A preencher após execução* | |

**Resultado do teste 1:** *A preencher — passou ( ) / falhou ( )*

---

## 3. Teste 2 — Duplicidade com mesma key (CRÍTICO)

**Procedimento:** Após um chute com 200, repetir o **mesmo** request com a **mesma** X-Idempotency-Key (Replay XHR no DevTools, ou Copy as fetch e reenviar sem alterar headers).

**Verificações:**
- Primeiro request = **200**
- Segundo request (mesma key) = **409**
- Não há segundo débito de saldo
- Não há segundo chute efetivo (um registro por gesto)

| Item | Esperado | Resultado | Evidência |
|------|----------|-----------|-----------|
| 1º request status | 200 | *A preencher após execução* | |
| 2º request status | 409 | *A preencher após execução* | |
| Mesma key nos dois requests | Sim | *A preencher após execução* | |
| Segundo débito | Não | *A preencher após execução* | |

**Resultado do teste 2:** *A preencher — passou ( ) / falhou ( )*

---

## 4. Teste 3 — Dois chutes distintos

**Procedimento:** Realizar dois chutes reais diferentes (duas zonas ou duas jogadas em sequência).

**Verificações:**
- Duas keys **diferentes** nos dois POSTs
- Dois responses **200**
- Dois chutes legítimos (dois débitos, dois registros)

| Item | Esperado | Resultado | Evidência |
|------|----------|-----------|-----------|
| 1º POST — key | Valor A | *A preencher após execução* | |
| 2º POST — key | Valor B ≠ A | *A preencher após execução* | |
| 1º status | 200 | *A preencher após execução* | |
| 2º status | 200 | *A preencher após execução* | |
| Saldo | Dois débitos | *A preencher após execução* | |

**Resultado do teste 3:** *A preencher — passou ( ) / falhou ( )*

---

## 5. Teste 4 — Retrocompatibilidade (request sem key)

**Procedimento:** Enviar um POST `/api/games/shoot` **sem** header `X-Idempotency-Key` (curl, Postman ou equivalente), com Authorization e body `{ "direction": "C", "amount": 1 }`. Usar o mesmo backend que o preview utiliza (ex.: `https://goldeouro-backend-v2.fly.dev`).

**Verificações:**
- Backend aceita o request
- Resposta **200**
- Chute registrado (fluxo antigo preservado)

| Item | Esperado | Resultado | Evidência |
|------|----------|-----------|-----------|
| Header X-Idempotency-Key | Ausente | *A preencher após execução* | |
| Status HTTP | 200 | *A preencher após execução* | |
| Chute registrado | Sim | *A preencher após execução* | |

**Resultado do teste 4:** *A preencher — passou ( ) / falhou ( )*

---

## 6. Teste 5 — Não regressão básica

**Procedimento:** Durante e após os testes acima, observar: `/game` continua funcional, gamePhase não trava, sem erro JS relevante no console, sem falha inesperada no Network.

| Item | Esperado | Resultado | Evidência |
|------|----------|-----------|-----------|
| /game funcional | Sim | *A preencher após execução* | |
| gamePhase não trava | Sim | *A preencher após execução* | |
| Console sem erro JS relevante | Sim | *A preencher após execução* | |
| Network sem falha inesperada | Sim | *A preencher após execução* | |

**Resultado do teste 5:** *A preencher — passou ( ) / falhou ( )*

---

## 7. Evidências coletadas

Registrar aqui, sempre que possível:

- Status HTTP de cada request relevante (200, 409)
- Presença/ausência do header X-Idempotency-Key
- Diferença entre keys em chutes distintos
- Comportamento do saldo (débito único no teste 2, dois débitos no teste 3)
- Comportamento do jogo (overlays, fases, fluidez)
- Prints ou descrição objetiva (ex.: “Replay XHR do primeiro shoot → 409; saldo inalterado após o segundo request”)

*Conteúdo a preencher após execução dos testes:*
```
(evidências: status, headers, saldo, prints ou descrição)
```

---

## 8. Falhas encontradas

Listar qualquer falha observada (teste que não passou, status inesperado, segundo débito indevido, UI travada, etc.). Se não houver falhas, registrar “Nenhuma”.

*A preencher após execução:*
```
(descrever falhas ou escrever "Nenhuma")
```

---

## 9. Veredito

Critério de aprovação: só aprovar se o header estiver presente, mesma key resultar em 409 no segundo request, não houver segundo débito, chutes legítimos diferentes continuarem funcionando, request sem key continuar aceito e o jogo permanecer funcional.

Assinalar **após** execução dos testes e registro das evidências:

- [ ] **APROVADO** — Todos os 5 testes passaram; evidências registradas; critérios de aprovação atendidos.
- [ ] **APROVADO COM RESSALVAS** — Testes passaram com limitações ou observações documentadas (detalhar na seção 8).
- [x] **BLOQUEADO** — Um ou mais testes falharam **ou** validação prática ainda não foi executada (relatório aguardando preenchimento).

*Enquanto os resultados dos testes 1–5 não forem preenchidos com evidência (status HTTP, headers, saldo, comportamento), o veredito permanece BLOQUEADO.*

---

**Nota sobre execução:** Os testes 1, 2, 3 e 5 requerem abertura do preview no navegador, uso do DevTools (Network, Replay XHR) e interação com a tela `/game`. O teste 4 pode ser feito via curl/Postman com token válido. Este relatório serve como template e registro oficial dos resultados; preencher cada seção após a execução manual da validação prática.

*Documento gerado em modo READ-ONLY OPERACIONAL. Nenhuma alteração foi feita em código, banco, deploy ou produção.*
