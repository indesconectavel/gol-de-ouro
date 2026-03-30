# Auditoria forense — Engine operacional (produção)

**Projeto:** Gol de Ouro — backend (`server-fly.js` + `routes/analyticsIngest.js`)  
**Data:** 2026-03-28  
**Modo:** **READ-ONLY** — análise de código e comportamento documentado; nenhuma alteração de código nesta entrega.  
**Premissa operacional:** instância **única** ativa no Fly.io (conforme contexto fornecido).

---

## 1. Alinhamento de escopo (nomes de rotas)

| Item solicitado | Implementação real no código |
|-----------------|------------------------------|
| `/api/pix/webhook` | **`POST /api/payments/webhook`** — webhook Mercado Pago (PIX). |
| `/api/pix/reconcile` | **Não existe rota HTTP.** A reconciliação é a função interna `reconcilePendingPayments()` agendada com `setInterval` (variável `MP_RECONCILE_*`). |
| `/api/game/shoot` | **`POST /api/games/shoot`** — gameplay com JWT. |

A análise abaixo refere-se aos caminhos **efetivos** do servidor em produção.

---

## 2. Mapa de execução da engine

Visão simplificada dos fluxos que compõem a “engine” operacional (jogo + saldo + PIX + saúde).

```mermaid
flowchart TB
  subgraph entrada[Entrada HTTP]
    WH[POST /api/payments/webhook]
    REC[Timer reconcilePendingPayments]
    WD[POST /api/withdraw/request]
    SH[POST /api/games/shoot]
  end

  subgraph memoria[Estado em memória - processo]
    MAP[lotesAtivos Map]
    CTR[contadorChutesGlobal]
    IDM[idempotencyProcessed Map]
    RECF[flag reconciling]
  end

  subgraph db[(Supabase)]
    U[usuarios.saldo]
    C[chutes]
    P[pagamentos_pix]
    S[saques]
    M[metricas_globais]
  end

  SH --> MAP
  SH --> CTR
  SH -->|optimistic lock saldo| U
  SH --> C
  SH --> M

  WD -->|optimistic lock saldo| U
  WD --> S

  WH -->|creditarPixAprovadoUnicoMpPaymentId| P
  WH -->|claim pending→approved| P
  WH -->|optimistic lock saldo| U
  REC -->|mesma função de crédito| P
  REC --> U
```

**Ordem lógica do chute (`POST /api/games/shoot`):** validação → (opcional) idempotência em memória → leitura de saldo → lote em memória → incremento do contador global e persistência em `metricas_globais` → cálculo de resultado/prêmio → **UPDATE `usuarios` com `eq('saldo', user.saldo)`** → mutação do lote em memória → validação pós-chute → **INSERT `chutes`** → resposta. Em falhas após o UPDATE de saldo, há caminhos de **compensação** (UPDATE de volta para `user.saldo` + desfazer lote).

**Ordem lógica do saque (`POST /api/withdraw/request`):** validação → leitura de saldo → **UPDATE débito com lock otimista** → **INSERT `saques`** → em falha no insert, **rollback** do saldo com condição `eq('saldo', usuarioDebitado.saldo)`.

**Crédito PIX (`creditarPixAprovadoUnicoMpPaymentId`):** localizar linha em `pagamentos_pix` → **UPDATE claim** `status = approved` somente se ainda `pending` → leitura de saldo → **UPDATE saldo** com `eq('saldo', saldoAnt)` → em falha de usuário ou corrida de saldo, **reverte** o pagamento para `pending` quando aplicável.

---

## 3. Concorrência

### 3.1 Lock otimista (saldo)

| Fluxo | Uso de lock otimista | Observação |
|-------|----------------------|------------|
| Chute | Sim — `update(...).eq('id', ...).eq('saldo', user.saldo)` | Reduz *lost update* entre dois chutes ou entre chute e outra operação que também use o mesmo padrão. |
| Saque | Sim — mesmo padrão antes do insert em `saques` | Dois saques paralelos: um vence o UPDATE, o outro tende a **409**. |
| Crédito PIX | Sim — após *claim* na linha `pagamentos_pix` | Crédito duplicado pelo mesmo pagamento é barrado pelo *claim* atômico `pending` → `approved`. |

### 3.2 Condições de corrida remanescentes

1. **UPDATE saldo e INSERT `chutes` não estão na mesma transação SQL.** Entre os dois há trabalho síncrono em memória (lote). Falhas exóticas após o UPDATE e fora dos `if` de rollback podem, em teoria, deixar estado inconsistente (ver secção 8).
2. **Reversão de saldo no chute** usa `update({ saldo: user.saldo })` **sem** segunda condição no saldo atual. Se outra operação alterou o saldo entre tempo, a compensação pode **sobrescrever** um saldo mais novo (raro, mas classe clássica de compensação frágil).
3. **`contadorChutesGlobal++` + `saveGlobalCounter()`** não são atômicos em relação a outro processo; com **uma instância**, a corrida é entre requisições concurrent na mesma VM — o incremento em JS é por event loop, mas duas requisições async podem intercalar awaits e gerar sequências de persistência não triviais; com **várias instâncias**, o contador e `metricas_globais` ficam sujeitos a *last write wins*.
4. **`idempotencyProcessed`** é por processo e com TTL; **não** cobre múltiplas máquinas nem sobrevive a restart.

### 3.3 Múltiplas requisições simultâneas (mesmo usuário)

- **Dois chutes:** o segundo UPDATE com saldo esperado falha → **409** “Saldo insuficiente ou alterado”.
- **Chute + saque:** competem pelo mesmo lock otimista — um falha com **409**.
- **Webhook + reconciliação** no mesmo `payment_id`: a função de crédito é idempotente via *claim*; perdedor recebe `claim_lost` / já processado.

**Conclusão (concorrência):** para **uma instância**, o núcleo financeiro do PIX e o débito de saque/chute estão **razoavelmente alinhados** com lock otimista e *claim* em `pagamentos_pix`. A engine de **lote/gol** continua acoplada à **memória do processo**, o que é coerente só enquanto houver **uma** instância de aplicação.

---

## 4. Rotas críticas — atomicidade, consistência, duplicação

### 4.1 `POST /api/payments/webhook` (PIX)

- **Autenticação:** intencionalmente **pública** (Mercado Pago); quando `MERCADOPAGO_WEBHOOK_SECRET` está definido e `NODE_ENV === 'production'`, assinatura inválida → **401**.
- **Resposta:** **200 `{ received: true }` imediatamente**, processamento assíncrono depois. Isso é adequado para o parceiro, mas implica que falhas posteriores **não** alteram a resposta HTTP.
- **Duplicação de efeito financeiro:** mitigada por `creditarPixAprovadoUnicoMpPaymentId` (*claim* + idempotência em `approved`).
- **Risco:** se `MERCADOPAGO_WEBHOOK_SECRET` **não** estiver configurado em produção, **não** há validação de assinatura no primeiro middleware (comportamento documentado no próprio código).

### 4.2 Reconciliação (não é `/api/pix/reconcile`)

- Roda em **timer**; flag `reconciling` evita reentrância **no mesmo processo**.
- Consulta MP com IDs validados (mitigação SSRF por formato numérico).
- Usa a **mesma** função de crédito do webhook → boa **consistência lógica** entre canais.

### 4.3 `POST /api/withdraw/request`

- **Atomicidade de negócio:** débito antes do registro; rollback do saldo se o insert falhar — **bom** para evitar “saque sem débito”.
- **Idempotência explícita:** **não** há chave de idempotência HTTP no trecho analisado; repetição controlada pelo cliente pode gerar **vários saques** se cada uma passar no lock (comportamento esperado para requisições legítimas distintas).
- **Duplicação indevida por retry:** dois POSTs paralelos com o mesmo valor: um 409 no segundo débito, desde que ambos partam do mesmo saldo lido — **aceitável**.

### 4.4 `POST /api/games/shoot`

- **Duplicação de chute (retry):** mitigada **opcionalmente** por `X-Idempotency-Key` (Map em memória, TTL 120s).
- **Consistência lote ↔ banco:** o “lote ativo” e o índice do gol são **memória**; o histórico persistido está em `chutes`. Com uma instância, isso é o desenho atual da engine.

---

## 5. Autenticação (JWT)

### 5.1 Mecanismo

- Middleware `authenticateToken`: header `Authorization` Bearer, `jwt.verify` com `JWT_SECRET`, payload com **`userId`** (uso consistente em handlers).

### 5.2 Rotas protegidas (amostra verificada no arquivo)

Protegidas com `authenticateToken`: perfil, chute, saque, PIX criar/listar, alteração de senha, bootstrap admin, fila legada, etc.

### 5.3 Endpoints públicos relevantes para superfície de ataque

| Rota | Autenticação | Risco operacional |
|------|--------------|-------------------|
| `POST /api/payments/webhook` | Não (esperado) | Depende de secret MP + idempotência interna. |
| `POST /api/auth/*` (login, registro, etc.) | Não | Limitadas por `authLimiter` onde aplicável. |
| `GET /health`, `/ready`, `/`, `/robots.txt`, `/meta` | Não | Esperado para probes e metadados. |
| `GET /api/metrics` | **Não** | Pode expor contagem de usuários (consulta ao banco) e flags de sistema. |
| `GET /api/monitoring/metrics`, `GET /api/monitoring/health` | **Não** | Expõe contadores de requisições, memória, flags `dbConnected` / Mercado Pago. |
| `GET /api/production-status` | **Não** | Informação de configuração de “modo produção”. |
| `POST /api/analytics` | **Não** | Aceita corpo JSON; apenas loga evento; vetor de **volume/spam** (rate limit global pulado para esse path). |
| `GET /api/debug/token` | **Não** | Em `NODE_ENV === 'production'` retorna **404** sem corpo sensível — mitigação presente. |
| `POST /auth/login` (legado) | Não | Duplicata de login; também sob `authLimiter`. |

**Bypass de JWT nas rotas financeiras críticas do jogador:** não identificado para chute/saque/PIX autenticados; o webhook permanece público por definição.

---

## 6. Estado global, caches e restart

| Estado | Onde | Impacto de restart da instância |
|--------|------|----------------------------------|
| `lotesAtivos` | `Map` em memória | Lotes ativos **perdidos**; novos lotes nascem vazios; jogadores em meio a lote podem ver progressão “reiniciada” no servidor. |
| `contadorChutesGlobal`, `ultimoGolDeOuro` | memória + hidratação de `metricas_globais` no boot | Após restart, **releitura do banco** no `startServer` — tende a **recuperar** contador persistido; janela entre último chute e crash pode exigitar reconciliação manual de métricas em cenários extremos. |
| `idempotencyProcessed` | `Map` + TTL | Zerado no restart — retries podem duplicar efeito **se** o primeiro chute já persistiu no banco (cliente deve tratar 409/erros). |
| `reconciling` | boolean | Irrelevante após restart. |
| `monitoringMetrics` | objeto em memória | Zerado; apenas telemetria. |

---

## 7. Infraestrutura — instância única e escala futura

- **`fly.toml` atual** não fixa explicitamente “uma máquina” no trecho analisado; a premissa de instância única é **operacional**, não necessariamente imposta pelo arquivo.
- **Com uma instância:** o modelo atual (lote + contador + idempotência em memória) é **internamente coerente** para a regra de negócio “10 chutes / gol no 10º” **desde que** todo o tráfego de jogo chegue à mesma máquina.
- **Com scale horizontal (2+ máquinas):** **risco alto** — lotes duplicados, contadores divergentes, idempotência quebrada entre processos, `metricas_globais` sujeita a corridas de escrita. **A engine atual não é segura para multi-instância sem redesenho** (estado de lote e contador centralizados, filas, ou transações mais fortes).

---

## 8. Falhas, rollback e retries

| Cenário | Comportamento observado no código |
|---------|-----------------------------------|
| Falha `validateAfterShot` ou INSERT `chutes` após débito | Tentativa de **reverter** saldo para `user.saldo` e desfazer mutações no lote em memória. |
| Falha INSERT `saques` após débito | **Rollback** condicional do saldo. |
| Falha após crédito PIX (*claim* `approved`) mas saldo não atualiza | **Reversão** de `pagamentos_pix` para `pending` quando detectado usuário inexistente ou falha de lock de saldo. |
| Erro genérico no `catch` externo do handler de chute | Resposta **500**; **não** há rollback explícito nesse ramo — risco residual se exceção ocorrer após UPDATE de saldo e fora dos blocos que já compensam. |
| Webhook: erro após 200 | Mercado Pago já recebeu OK; depende de **retries do MP** + idempotência no crédito. |
| Reconciliação | Sem retry exponencial sofisticado; erros de rede MP são logados e o próximo ciclo tenta de novo. |

---

## 9. Pontos frágeis (síntese)

1. **Dependência forte de instância única** para a engine de lote e contador global.  
2. **Endpoints de métricas/monitoramento sem JWT** — vazamento operacional e facilitação de reconhecimento de ambiente.  
3. **`POST /api/analytics` sem autenticação** e **fora** do rate limit global (skip explícito) — risco de abuso de volume / logs.  
4. **Webhook sem secret configurado** — superfície de spoofing em produção.  
5. **Compensação de saldo no chute** sem verificação do saldo atual na reversão.  
6. **Ausência de transação única** banco-level entre movimentação de saldo e insert de `chutes` / estados de pagamento.  
7. Nomenclatura real dos paths (`/api/games/shoot`, `/api/payments/webhook`) — integrações externas devem apontar para os paths corretos (não há `/api/game/shoot` nem `/api/pix/webhook` neste servidor).

---

## 10. Cenários de falha (para teste mental / QA)

1. **Duas máquinas Fly** roteadas pelo balanceador: dois “décimos chutes” possíveis em lotes diferentes; economia do jogo **quebra**.  
2. **Restart** no meio de um lote ativo: jogador vê novo lote no servidor; suporte pode receber tickets de “progresso estranho”.  
3. **Retry de cliente** sem `X-Idempotency-Key` após timeout com INSERT já concluído: possível **duplicidade de chute** no banco se o servidor tinha concluído após o cliente desistir (classe clássica HTTP).  
4. **Secret de webhook ausente**: POST forjado pode disparar consultas à API MP (token server-side) e lógica de crédito — impacto limitado pela idempotência de pagamento, mas ainda é **ruído/carga** e possível vetor de enumeração se combinado com outros bugs.  
5. **Saldo revertido após falha de insert** com concorrência de depósito: teoricamente pode **apagar** um crédito concurrente se a reversão usar valor stale (baixa probabilidade, alto impacto se ocorrer).

---

## 11. Classificação de risco

| ID | Área | Severidade | Notas |
|----|------|------------|-------|
| R1 | Multi-instância / scale horizontal | **Crítica** | Engine de jogo e contador não são distribuídos. |
| R2 | Webhook sem `MERCADOPAGO_WEBHOOK_SECRET` em prod | **Alta** | Validação de origem fraca. |
| R3 | Métricas / monitoring públicos | **Média** | Informação e superfície de observação. |
| R4 | Analytics público + skip de rate limit | **Média** | Abuso de volume e disco/logs. |
| R5 | Compensação de saldo no chute (revert sem lock) | **Média** (probabilidade baixa) | Corrida exótica com outra operação no saldo. |
| R6 | `catch` genérico no shoot | **Média** (probabilidade baixa) | Possível inconsistência saldo/chute em exceção rara. |
| R7 | Transação não única saldo + chute | **Média** | Aceito no desenho atual; mitigado por ordem e compensação. |

---

## 12. Veredito

**ENGINE ESTÁVEL PARA PRODUÇÃO REAL: SIM** — **com condições explícitas:**

- Manter **uma instância** de aplicação para o tráfego de **gameplay** (ou arquitetura equivalente com sticky session e mesmo processo — o que na prática confirma instância única para a engine atual).
- Configurar **`MERCADOPAGO_WEBHOOK_SECRET`** e `NODE_ENV=production` conforme já previsto no código.
- Conscientizar que **escalar para N>1** sem refatoração altera a economia do jogo e a consistência do contador — nesse caso o veredito passa a **NÃO** até haver estado de lote/contador compartilhado ou transacional.

Se a pergunta for interpretada como “posso subir 3 máquinas amanhã sem mudar código?”, a resposta é **NÃO**. No cenário que você descreveu (Fly, **instância única**, secrets corretos), a engine é **utilizável em produção real** com os riscos residuais documentados acima (superfície pública de métricas/monitoring/analytics e limites de compensação sem transação única).

---

*Documento gerado por auditoria forense read-only do repositório na data indicada.*
