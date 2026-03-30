# BLOCO H.1 — Plano de QA operacional e leitura inicial

**Data:** 2026-03-27  
**Modo:** auditoria read-only do estado atual do código e documentação H; **sem** alterações de repositório nesta entrega.  
**Base:** `goldeouro-player/src/utils/analytics.js`, `BLOCO-H-CIRURGIA-01.md`, `BLOCO-H-VALIDACAO-01.md`.

---

## 1. Objetivo

Definir um **plano operacional mínimo** para:

- confirmar que o **beacon** envia dados quando a URL está configurada;
- validar **recebimento** no destino (ou substituto de teste);
- orientar a **primeira leitura** dos eventos (sem plataforma de analytics pesada);
- fixar um **smoke test** reproduzível para a V1.

Não é objetivo expandir eventos, refatorar o cliente ou integrar ferramentas de terceiros obrigatórias.

---

## 2. Estado atual da instrumentação

| Aspeto | Situação verificável |
|--------|----------------------|
| **Cliente** | `track()` em `goldeouro-player/src/utils/analytics.js`: monta JSON `{ event, ...payload, ts, sessionId }` e envia via `navigator.sendBeacon(url, Blob)` se `VITE_ANALYTICS_BEACON_URL` for **string não vazia** e `sendBeacon` existir. |
| **Variável de ambiente** | `VITE_ANALYTICS_BEACON_URL` — **não** há valor default no código; **não** foi encontrada referência obrigatória em `.env` do player no repositório (configuração fica a cargo do deploy). |
| **Sem URL** | **Produção:** `track()` não envia rede; não falha. **Desenvolvimento:** `console.debug('[analytics]', eventName, data)`. |
| **Endpoint receptor dedicado ao beacon** | **Não** faz parte do BLOCO H no frontend: o repositório backend tem rotas de analytics **admin/legado** (ex.: `routes/analyticsRoutes.js`) com outro propósito — **não** estão ligadas automaticamente ao `sendBeacon` do player. Quem opera precisa de um **endpoint HTTP** que aceite o corpo enviado pelo beacon ou um **proxy** (ver secção 3). |
| **Eventos instrumentados** | `game_ready`, `game_play_click`, `shot_committed`, `shot_outcome`, `golden_cycle_reset`, `game_leave`, `game_error` (ver relatório H cirurgia/validação). |

---

## 3. Forma de validação do beacon

### 3.1 Formato do payload

- **Método:** `POST` implícito do `sendBeacon`.
- **Corpo:** `Blob` com `type: application/json`, conteúdo = **uma linha JSON** por evento.
- **Campos base:** `event` (nome do evento), `ts` (epoch ms), `sessionId` (string), mais campos específicos do evento (ex.: `direction`, `outcome`).

### 3.2 Como confirmar envio (sem backend próprio)

1. **DevTools → Network:** filtrar por “beacon” ou pelo domínio da URL configurada; ao disparar eventos no `/game`, deve aparecer pedido **pending/completed** (alguns browsers agrupam como “ping”).
2. **Servidor de eco de teste:** temporariamente apontar `VITE_ANALYTICS_BEACON_URL` para um serviço que registe corpo bruto (ex.: webhook de inspeção, servidor local com log de `req.body`) — **apenas** em ambiente de teste.
3. **Produção:** o endpoint deve:
   - aceitar **POST** com `Content-Type: application/json` (ou tratar `Blob` como stream JSON);
   - responder **2xx** rapidamente;
   - tratar **CORS** se o front e a API estiverem em origens diferentes (beacon tem regras específicas; em caso de falha, testar mesmo origem ou proxy no mesmo host).

### 3.3 Limitações conhecidas

- `sendBeacon` **não** expõe erro ao JavaScript; falhas são **silenciosas** — validação depende de **lado servidor** ou de Network tab.
- Tamanho do payload é limitado (ordem de dezenas de KB; eventos atuais são pequenos).

---

## 4. Smoke test operacional (V1 mínimo)

**Pré-requisito:** build com `VITE_ANALYTICS_BEACON_URL` apontando para um receptor de teste **ou** execução em `DEV` com consola aberta.

| Passo | Ação | Evidência esperada |
|-------|------|-------------------|
| 1 | Login; abrir página com `InternalPageLayout`; clicar **JOGAR AGORA** | Evento `game_play_click` (rede ou consola). |
| 2 | Entrar em `/game`; aguardar fim do loading | `game_ready`. |
| 3 | Realizar **um** chute válido | `shot_committed` → após resposta `shot_outcome` (e `golden_cycle_reset` só se gol de ouro). |
| 4 | Voltar ao dashboard (MENU PRINCIPAL) ou sair da rota | `game_leave` (uma vez por saída). |
| 5 | (Opcional) Forçar saldo insuficiente ou erro de rede no chute | `game_error` com `phase`/`code` coerentes. |

**Checklist rápido QA**

- [ ] Em DEV, consola mostra `[analytics]` para cada passo relevante.  
- [ ] Com URL, servidor/registo recebe JSON parseável por evento.  
- [ ] `sessionId` repetido na mesma aba entre eventos da mesma sessão.  
- [ ] Nenhum erro visível ao utilizador; jogo joga igual.  

---

## 5. Eventos prioritários para leitura inicial

Ordem sugerida para **primeira análise** (máximo sinal com mínimo ruído):

1. **`game_ready`** — confirma que a sessão de jogo carregou no cliente (volume ~1 por entrada bem-sucedida na rota).  
2. **`shot_committed` + `shot_outcome`** — funil “intenção → resultado”; comparar contagens (committed vs outcome) para detetar falhas de API.  
3. **`game_error`** — taxa e `code` (`insufficient_balance`, mensagens de rede, `init`).  
4. **`game_play_click` vs `game_ready`** — lembrar: `game_play_click` só no botão do shell; entradas alternativas em `/game` não geram o primeiro.  
5. **`game_leave`** — duração de sessão aproximada (pares com `game_ready` por `sessionId`).  
6. **`golden_cycle_reset`** — volume baixo (só em gol de ouro); útil para calibrar expectativa de negócio.

---

## 6. Sinais saudáveis vs sinais de alerta

| Sinal | Saudável (indicativo) | Alerta (investigar) |
|-------|------------------------|---------------------|
| **Rácio outcome/committed** | Próximo de 100% quando rede estável | Muito `committed` sem `outcome` — falhas de API ou timeouts |
| **`game_error` (shot)** | Esporádico, códigos esperados | Pico após deploy ou mudança de API |
| **`game_error` (init)** | Raro | Frequente — bloqueio de carregamento / perfil |
| **`game_ready` sem `game_play_click` antes** | Normal se o utilizador entra em `/game` por link direto | N/A — interpretar com contexto |
| **Volume** | Correlaciona com tráfego real | Zero eventos com URL configurada — beacon falhando ou URL errada |
| **`sessionId`** | Estável na mesma aba | — |

---

## 7. Riscos a evitar

- **Assumir** que backend já existente (`/api/analytics/*` legado) **ingere** o beacon sem **teste de contrato** — não está ligado ao cliente H por padrão.  
- **Produção sem URL:** nenhum evento em rede — “observabilidade zero” sem culpa do código.  
- **CORS / HTTPS:** mistura `http`/`https` ou origem errada pode anular o beacon sem erro visível.  
- **Strict Mode (dev):** possível duplicação de `game_ready` / `game_leave` — não confundir com bug de produção.  
- **Interpretação de `game_ready`:** validação H assinalou ressalva se `initialize()` falhar sem `throw` — tratar métrica com cuidado até eventual endurecimento futuro.

---

## 8. Próximos passos

1. **Operação:** definir URL final do receptor (novo endpoint mínimo ou serviço gerido) e documentar no `.env` / painel de deploy do **player**.  
2. **Uma** validação manual com Network + (opcional) log servidor — marcar data e resultado em relatório curto.  
3. **Leitura inicial:** exportar ou contar eventos por `event` e por dia; acompanhar `game_error` na primeira semana pós-ativar URL.  
4. **Backlog opcional (fora deste plano):** alinhar critério `game_ready` com `initialize().success`; cobrir outras entradas em `/game` se o produto precisar de métrica de funil completa.

---

**Conclusão:** o cliente está **pronto** para observabilidade assim que existir **URL + receptor compatível**; até lá, a validação em QA deve continuar a usar **DEV + consola** ou **endpoint de teste**. Nenhuma alteração de código é exigida por este plano.
