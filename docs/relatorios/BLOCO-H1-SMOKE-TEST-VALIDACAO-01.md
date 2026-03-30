# BLOCO H.1 — Validação do smoke test operacional

**Data:** 2026-03-27  
**Modo:** validação baseada em **evidência** — **nenhuma** alteração de código.

---

## 1. Resumo executivo

Foi pedida a validação do smoke test **ponta a ponta** (navegador + backend) após execução manual. **No repositório e na entrada desta tarefa não constam artefactos empíricos** (export do Network, capturas de ecrã, excertos de logs do servidor com `[client_analytics_event]`, contagens de pedidos, timestamps).

Por isso **não é possível afirmar com rigor** que os eventos chegaram ao backend, nem quantificar chamadas, nem confirmar ordem observada em ambiente real. A implementação (frontend `track()`, `POST /api/analytics`, logging) já foi validada **estaticamente** noutros relatórios; **esta** validação operacional fica **inconclusiva quanto à execução real** até serem juntadas evidências reprodutíveis.

---

## 2. Eventos observados

| Pergunta | Estado |
|----------|--------|
| Quais eventos foram disparados no teste? | **Não documentado** neste repositório. |
| Contagem por tipo (`game_play_click`, `game_ready`, etc.)? | **Não disponível**. |

**Referência de código (o que *deveria* ocorrer no fluxo descrito):** `game_play_click` (shell), `game_ready` (init OK em `GameFinal`), `shot_committed` / `shot_outcome` (chute válido), `game_leave` (saída de `/game`), `golden_cycle_reset` só se houver gol de ouro — conforme `InternalPageLayout.jsx` e `GameFinal.jsx`.

---

## 3. Validação no navegador

| Verificação | Evidência nesta validação |
|-------------|---------------------------|
| Chamadas `POST` para `…/api/analytics` | **Não verificável** — sem export Network. |
| Status HTTP (esperado: 200) | **Não verificável**. |
| Payload com `event`, `ts`, `sessionId`, campos específicos | **Não verificável**. |
| Erros CORS na consola | **Não verificável**. |

---

## 4. Validação no backend

| Verificação | Evidência nesta validação |
|-------------|---------------------------|
| Linhas `[client_analytics_event]` | **Não verificável** — sem excertos de log. |
| Formato JSON recebido | **Não verificável**. |
| Frequência / número de linhas | **Não verificável**. |

---

## 5. Coerência ponta a ponta (Frontend → Network → Backend)

| Pergunta | Estado |
|----------|--------|
| Cada evento do Network apareceu no log do backend? | **Não determinável** sem dados pareados. |
| Formato consistente entre cliente e servidor? | **Presumível** pelo contrato já validado em código; **não demonstrado** por execução. |

---

## 6. Integridade do gameplay

| Verificação | Estado |
|-------------|--------|
| Gameplay afetado? | **Não observável** aqui — sem relatório de sessão ou gravação. |
| Travamentos / delays atribuíveis ao analytics? | **Não verificável** — `track()` permanece síncrono sem `await` no caminho quente (código); comportamento em tempo real **não** foi testado nesta documentação. |

---

## 7. Problemas encontrados

**Nenhum problema operacional pode ser listado com precisão** — não há evidência de falha (CORS, 4xx/5xx, ausência de eventos) nem de sucesso.

---

## 8. Limitações observadas

**Nada foi observado na execução** (ausência de evidência). As limitações **esperadas** (sem preencher como “observado”) são as já documentadas em `BLOCO-H1-SMOKE-TEST-READONLY.md`:

- `sendBeacon` não expõe erro de forma amigável ao JavaScript.
- `game_ready` depende de init bem-sucedido.
- `game_leave` pode variar em dev (Strict Mode).
- `golden_cycle_reset` é opcional.
- `game_play_click` só no botão atual do shell.

---

## 9. Classificação

**GO COM RESSALVAS** (no sentido estrito abaixo):

| Critério | Leitura |
|----------|---------|
| **GO** pleno (smoke test operacional comprovado) | **Não emitido** — falta evidência. |
| **Ressalva** | Implementação alinhada ao plano; **execução ponta a ponta não está comprovada** por artefactos neste relatório. |

Se for obrigatório encaixar apenas em **GO** / **NO-GO** binário: tratar como **NO-GO para “lançamento validado por smoke test documentado”** até existir evidência anexa.

---

## 10. Conclusão objetiva

| Pergunta | Resposta com base no **que foi possível verificar** |
|----------|------------------------------------------------------|
| Os eventos estão a chegar? | **Indeterminado** sem Network + logs. |
| O backend está a receber? | **Indeterminado** sem logs. |
| O fluxo é coerente? | **Só** por código; **não** por execução registada. |
| O jogo continua intacto? | **Não** avaliado nesta validação. |
| Podemos lançar? | **Decisão de produto não** pode basear-se apenas neste documento; recomenda-se **repetir o smoke test**, exportar **HAR** ou lista de pedidos `POST` para `/api/analytics`, e colar **excertos de log** com `[client_analytics_event]`, depois **atualizar** este relatório ou criar **versão 02** com evidência. |

**Pode lançar a V1 só com base neste ficheiro?** **Não** — falta **prova operacional** anexa. Pode lançar **do ponto de vista de código** conforme relatórios técnicos anteriores; a **confirmação do smoke test real** continua **pendente**.

---

## Anexo — o que anexar para uma validação 02 conclusiva

1. Lista ou export (Network) com **URL**, **método**, **status**, **corpo** (ou resumo) por pedido.  
2. Excerto de **logs do backend** com `[client_analytics_event]` no mesmo intervalo temporal.  
3. **Origem** do browser (URL do player) e **URL** do API usada em `VITE_ANALYTICS_BEACON_URL` (sem segredos).  
4. Nota breve sobre **Strict Mode** / ambiente (dev vs produção) se relevante para `game_leave`.
