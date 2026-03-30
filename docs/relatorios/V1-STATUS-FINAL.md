# V1 — Status final (auditoria para sócios e operação)

**Data:** 2026-03-27  
**Escopo:** síntese das auditorias e cirurgias documentadas no repositório (financeiro, PIX, saque, gameplay, auth, UI, admin, estabilidade).  
**Método:** consolidação documental; **sem nova execução de testes automatizados neste arquivo.**

---

## 1. Visão geral do sistema

O **Gol de Ouro** é um jogo web com **app shell** (`goldeouro-player`, React), rota **`/game`** com `GameFinal.jsx`, backend **Node** em **`server-fly.js`** com **Supabase**, **Mercado Pago (PIX)** e fluxos de **autenticação JWT**, **chute** (`POST /api/games/shoot`), **depósito PIX** e **saque** (`POST /api/withdraw/request`).

**Evolução relevante para esta decisão:** após as auditorias iniciais, foram aplicadas **cirurgias controladas** em **`server-fly.js`** para (1) **saque com débito imediato e lock otimista** no saldo e (2) **crédito PIX** via helper único com **claim atômico** `pending → approved` e **lock otimista** no saldo, compartilhado entre **webhook** e **reconciliação**. Isso reduz materialmente os riscos financeiros que a auditoria forense original apontava para saque e PIX.

---

## 2. Status por bloco (A → I)

| Bloco | Tema | Status para V1 (apresentação / operação controlada) |
|-------|------|-----------------------------------------------------|
| **A** | Financeiro (PIX, saque, integridade) | **Sólido no núcleo** após cirurgias: saque debita com lock; PIX credita por helper idempotente + lock. **Pendências:** sem ledger único; CPF fallback em PIX se ainda existir; transação ACID única não cobre `pagamentos_pix` + `usuarios` em um único BEGIN/COMMIT. |
| **B** | Apostas / lotes | **Funcional** em instância única. Lotes em **memória** (`Map`); multinstância Fly sem sticky state **não** é segura para continuidade de lote; narrativa de “probabilidade” vs determinismo do 10º chute deve estar **alinhada à comunicação**. |
| **C** | Autenticação | **Funcional** (login/registro/JWT, rate limit em auth). **Risco:** `GET /api/debug/token` expõe claims JWT se público — mitigar em gateway ou remover em produção. |
| **D** | Saldo | **Melhorado:** shoot, saque e PIX seguem padrão de **lock otimista** onde cirurgiado. HUD/perfil pode divergir de agregados se `total_apostas` / métricas não forem atualizados em todo evento (questão já levantada em auditorias de UI). |
| **E** | Gameplay | **Ponta a ponta** com backend real: chute, resultado, persistência em `chutes`. Idempotência de chute em **Map por processo** (TTL). |
| **F** | UI/UX | **Validado** em relatórios de bloco F; `/game` + `GameFinal` como canônico. |
| **G** | Fluxo do jogador | **Completo** para demo: login → dashboard/jogo → depósito/saque/perfil conforme rotas expostas. |
| **H** | Economia / retenção | **Mínimo** (analytics beacon opcional); sem gamificação pesada. |
| **I** | Escalabilidade / ops | Rate limits e health presentes; **painel admin** não integrado ao `server-fly.js`; monitoramento avançado comentado em trechos legados. **Multinstância** exige cuidado (lotes + idempotência de chute). |

---

## 3. Riscos críticos

1. **`GET /api/debug/token` em produção** — exposição de informação de token; tratar como **bloqueio de segurança** se a URL estiver acessível publicamente.  
2. **Múltiplas máquinas** no mesmo serviço **sem** estado de lote compartilhado — risco de **comportamento de jogo inconsistente** (não necessariamente “roubo” de saldo se o shoot continuar no mesmo DB, mas **lotes** e **idempotência em RAM** quebram).  
3. **Operação financeira “banco completo”** — sem **ledger** imutável; auditoria fina continua dependente de **Supabase** e exportações manuais.  
4. **Painel administrativo** — **não** há operação unificada via `server-fly.js` + UI admin completa no repo; **backoffice** real pode depender de **Supabase Dashboard** ou processos externos.

*Nota:* os riscos “saque sem débito” e “PIX sem claim/lock” foram **endereçados no código** conforme relatórios **BLOCO-A2** e **BLOCO-A3** (cirurgias e validações); não devem ser listados como falhas atuais do mesmo modo que na auditoria forense **anterior** às cirurgias.

---

## 4. Riscos não críticos

- **`GET /api/metrics`** pode não refletir contadores globais exatos na UI (comportamento já documentado).  
- **Fila** `/api/fila/entrar` simulada — não bloqueia demo.  
- **Email verificado** pode não ser enforcement rígido no login (depende do trecho de auth).  
- **CPF** em criação de PIX: revisar uso de fallback em produção real.

---

## 5. O que pode quebrar em produção

- **Pico de carga** com várias instâncias **sem** desenho de sessão sticky ou estado de jogo externo.  
- **Webhooks MP** em volume extremo — mitigado pelo helper atual, mas **rede/DB** podem falhar; reconciliação cobre pendentes antigos.  
- **Cliente mobile antigo** ou cache de frontend apontando para API antiga — risco operacional de deploy, não lógica interna auditada aqui.

---

## 6. O que está sólido

- **Fluxo jogador:** login → jogo com **saldo real** no shoot (lock otimista).  
- **Depósito PIX:** criação + confirmação com **claim + crédito com lock** (pós–cirurgia A3).  
- **Saque:** pedido com **débito + lock** (pós–cirurgia A2).  
- **Segurança básica:** Helmet, CORS, rate limits, JWT em rotas sensíveis.  
- **UI do jogo:** rota `/game` e `GameFinal` alinhados ao backend em valor R$ 1.

---

## 7. Recomendação final

### Respostas diretas à missão

| Pergunta | Resposta |
|----------|----------|
| 1. Sistema funcional ponta a ponta? | **Sim**, para o escopo **login → jogo → saldo → PIX → saque** no desenho atual do backend principal, **com** as cirurgias financeiras aplicadas. |
| 2. Bloqueios críticos para uso real? | **Segurança/ops:** proteger ou remover **debug token**; **escala:** definir **uma instância** ou evoluir estado de lote; **admin:** não contar com painel integrado ao repo sem trabalho extra. |
| 3. Risco financeiro aberto? | **Reduzido** em relação ao baseline (saque/PIX endurecidos); **residual:** ausência de ledger, ACID único no PIX, operações manuais fora do app. |
| 4. Jogo demonstrável sem falhas? | **Demonstrável** com narrativa correta (lote/determinismo) e ambiente estável; **não** é garantia formal sem testes E2E neste documento. |
| 5. Fluxo do usuário completo? | **Sim** para jornada principal; **backoffice** não é produto completo no sentido de painel admin no servidor atual. |

### Classificação final

**PRONTO COM RESSALVAS** para **apresentação a sócios** e **operação V1 controlada** (demo, piloto fechado, uma instância, dinheiro real com checklist operacional).

**Não** classificado como “pronto” irrestrito para **escala horizontal + tráfego financeiro massivo + compliance completo** sem as mitigações da seção 3 e sem testes de carga/regressão.

---

*Fim do relatório V1-STATUS-FINAL.*
