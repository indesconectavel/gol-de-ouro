# PRÉ-OPERAÇÃO V1 — Documentação consolidada e checklist

**Data:** 2026-03-27  
**Tipo:** consolidação executiva (auditorias por bloco, cirurgias A2/A3, auditoria suprema, validações).  
**Código:** não alterado neste documento.

---

## 1. Resumo executivo

O **Gol de Ouro** encontra-se em estado **PRONTO COM RESSALVAS** para **V1 em piloto controlado**: fluxo jogador (login → jogo → saldo), **PIX** com helper idempotente + claim + lock otimista, **saque** com débito + lock otimista + rollback se falhar insert, **shoot** com lock otimista. **Não** está pronto para **produção aberta irrestrita** sem mitigar riscos de **segurança** (`/api/debug/token`), **escala** (estado em memória em lote/idempotência), **ledger** e **painel admin** integrado.

**Operação recomendada agora:** **piloto fechado** — uma instância backend, testes financeiros de **baixo valor**, evidências em log/Supabase, **ação manual** no payout de saque se o processo automático não estiver validado ponta a ponta.

---

## 2. Estado atual do projeto

| Dimensão | Situação |
|----------|----------|
| **Prontidão** | **Piloto controlado** — não “go global” sem checklist. |
| **Financeiro (código)** | **Endurecido** em saque, PIX (webhook + reconcile) e shoot vs. baseline pré-cirurgia. |
| **Validação formal** | Relatórios READ-ONLY, cirurgias e validações pontuais (A2, A3); **sem** bateria E2E automatizada citada como gate único. |
| **Produto** | Player React com `/game` (`GameFinal`); backend `server-fly.js` como entrypoint principal referenciado nas auditorias. |

---

## 3. Status por blocos

| Bloco | Tema | Status atual | Validado (doc) | Bloqueia V1 piloto? | V2 |
|-------|------|--------------|----------------|----------------------|-----|
| **A** | Financeiro | PIX + saque + shoot com locks/claim onde cirurgiado; sem ledger | Sim (A1, A3, A2, suprema) | **Não** se piloto com valor baixo | Ledger, ACID amplo |
| **B** | Apostas / lotes | Lotes em RAM; V1 só R$1; gol determinístico por posição no lote | Sim (auditoria completa) | **Não** com 1 instância + narrativa honesta | Multinstância, fila real |
| **C** | Autenticação | JWT, bcrypt, rate limit auth | Sim | **Não** | Hardening email, etc. |
| **D** | Saldo | Fonte `usuarios.saldo`; possíveis deltas HUD/agregados | Parcial | **Não** crítico para piloto financeiro | Totais sempre coerentes |
| **E** | Gameplay | Shoot integrado; idempotência em RAM por processo | Sim | **Não** com 1 instância | Idempotência distribuída |
| **F** | Interface | GameFinal / HUD validados em relatórios F | Sim | **Não** | — |
| **G** | Fluxo jogador | Entrada → jogo → saída coberta por rotas | Sim | **Não** | — |
| **H** | Economia / analytics | Beacon opcional; ingest mínima | Parcial | **Não** bloqueia piloto | Retenção avançada |
| **I** | Escalabilidade | **Risco** com N instâncias | Sim (auditorias) | **Importante** se Fly scale >1 | Redis, estado externo |
| **J** | Admin | Rotas não montadas em `server-fly.js`; UI admin incompleta no repo | Sim (BLOCO J) | **Não** se operação via Supabase/manual | Painel integrado |

**Legenda “bloqueia”:** significa bloqueio para **iniciar testes financeiros de hoje** com escopo mínimo — **nenhum** bloco acima impede o piloto **se** as condições da secção 6 e o checklist secção 7 forem cumpridas.

---

## 4. Estado financeiro atual

| Eixo | Comportamento atual (código consolidado) | Idempotência / lock | Risco residual |
|------|--------------------------------------------|---------------------|----------------|
| **PIX — criação** | `POST /api/payments/pix/criar`; insere `pagamentos_pix` `pending`; **não** credita saldo | Idempotency key no MP na criação | CPF fallback se ainda usado |
| **PIX — crédito** | Função **`creditarPixAprovadoUnicoMpPaymentId`**: claim `pending→approved`, crédito com **`.eq('saldo', saldoAnt)`**; revert `pending` se falhar | Forte ao nível app; não transação SQL única 2 tabelas | Edge legacy `approved` sem crédito; zero credit |
| **PIX — webhook** | Confirma `approved` no MP; chama helper | Duplicata mitigada pelo claim | Assinatura ignorada fora prod se secret |
| **PIX — reconciliação** | Mesmo helper | Alinhado ao webhook | Job só serializa reconciliação, não webhook paralelo |
| **Saque** | Débito **antes** de `insert` em `saques`; **`.eq('saldo', usuario.saldo)`**; rollback se insert falhar | Concorrência no saldo mitigada | Idempotência de “mesmo pedido” não implementada; payout real fora do escopo garantido aqui |
| **Shoot** | Débito/prêmio com lock; rollback em falha insert `chutes` | Sim | Contador global pode adiantar vs saldo em falha 409 |

**Resposta direta:** o **dinheiro no aplicativo** está **materialmente mais seguro** após as cirurgias; a **segurança operacional total** (payout, auditoria contábil, escala) **ainda** depende de processo e infra.

---

## 5. Riscos residuais

| Risco | Impacto |
|-------|---------|
| **`GET /api/debug/token`** exposto | Vazamento de claims JWT; **deve** ser bloqueado antes de testes em ambiente acessível. |
| **Multinstância** (Fly scale >1) | Lotes/idempotência shoot incoerentes entre processos. |
| **Sem ledger** | Disputas e auditoria fina exigem processo/exports. |
| **Painel admin** não integrado | Operação depende de Supabase/manual. |
| **Payout de saque** | Backend debita conta; **transferência PIX ao usuário** pode depender de worker/processo externo — **confirmar** antes de prometer ao usuário. |
| **`/api/metrics`** | Pode zerar contadores na resposta vs realidade do shoot — confiança na HUD. |

---

## 6. Condições mínimas para V1 controlada

1. **Uma instância** do serviço de API que executa `server-fly.js` (sem autoscale para 2+ máquinas até evolução de estado).  
2. **Deploy** em ambiente **nomeado** (qual Fly app, qual URL, qual branch/commit).  
3. **Secrets** válidos: JWT, Supabase, Mercado Pago, `BACKEND_URL` / webhook, idealmente `MERCADOPAGO_WEBHOOK_SECRET`.  
4. **Teste financeiro** com **valor baixo** e **usuário de teste** dedicado.  
5. **Supervisão**: alguém capaz de ler logs e Supabase em tempo real durante o teste.  
6. **NO-GO** se debug público e multinstância não estiverem endereçados conforme checklist abaixo.

---

## 7. Checklist do que deve ser feito ANTES das ações de hoje

*Executar na ordem mental: segurança → deploy → financeiro → operação.*

### Segurança

- [ ] **Confirmar** onde `/api/debug/token` está acessível (URL pública do backend, staging vs prod).  
- [ ] **Confirmar** qual **ambiente** será alterado (só prod, só staging, ambos).  
- [ ] **Definir** mitigação: **bloqueio na borda** (WAF/reverse proxy), **remoção de rota**, ou **network policy** — e quem aplica.  
- [ ] **Garantir rollback simples:** anotar commit/deploy atual antes de mudar; ter como reverter em um passo se algo quebrar.  
- [ ] Revalidar que **não** há outro endpoint de debug equivalente exposto sem necessidade.

### Deploy

- [ ] **Confirmar** projeto/serviço correto (ex.: app Fly nome exato).  
- [ ] **Confirmar** número **atual** de instâncias (`fly scale show` ou painel).  
- [ ] **Confirmar** que **não** haverá autoscale para >1 máquina **durante** os testes (ou aceitar risco documentado).  
- [ ] **Confirmar** variáveis críticas no runtime: `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MERCADOPAGO_ACCESS_TOKEN`, `BACKEND_URL`, `NODE_ENV`, `MERCADOPAGO_WEBHOOK_SECRET` (recomendado).  
- [ ] **Health:** `/health` e `/ready` respondendo após deploy.

### Financeiro

- [ ] **Mercado Pago:** credenciais de **produção** ou **sandbox** conforme decisão do teste; saber qual.  
- [ ] **Webhook:** URL registrada no MP aponta para `{BACKEND_URL}/api/payments/webhook`; teste de recebimento ou log conhecido.  
- [ ] **Usuário de teste:** conta dedicada; saldo inicial conhecido no Supabase.  
- [ ] **Valor baixo:** teto acordado (ex.: R$ 1–5) para PIX e para saque de teste.  
- [ ] **Validação de saldo:** query ou tela antes/depois em `usuarios.saldo` e, se útil, linhas em `pagamentos_pix` / `saques`.  
- [ ] **Logs:** saber onde ler (Fly logs, `server-fly` console, filtros `[PIX-CREDIT]`, `[SAQUE]`, `[WEBHOOK]`).

### Operação

- [ ] **Responsável** pelo teste (nome).  
- [ ] **Sequência** acordada (ex.: 1º PIX baixo → conferir saldo → 1º saque pequeno → conferir débito e registro → etc.).  
- [ ] **Evidências:** prints ou exports (IDs MP, IDs `pagamentos_pix`, `saques`, timestamps).  
- [ ] **Sucesso:** saldo sobe uma vez no PIX; desce no saque; sem duplicata óbvia.  
- [ ] **Falha:** critério de parada (ex.: saldo errado, erro 500 em helper, webhook sem efeito após X min).

---

## 8. Ações de hoje (somente listar)

1. **Bloquear** `/api/debug/token` (ou equivalente acordado na secção 7).  
2. **Garantir 1 instância** no deploy alvo.  
3. **Testar PIX real** com valor baixo (fluxo completo até crédito de saldo).  
4. **Testar saque** conforme processo manual/assistido acordado (incluindo verificação de débito e registro).

*Não executar na ordem acima sem completar o checklist da secção 7.*

---

## 9. Critério de GO / NO-GO para iniciar os testes financeiros

**GO** quando **todos** forem verdadeiros:

- Checklist secção **7** concluído (itens críticos de segurança e deploy não podem ficar em aberto sem decisão explícita).  
- Valor e usuário de teste **definidos**.  
- Responsável presente para **parar** o teste se algo sair do esperado.

**NO-GO** se:

- `/api/debug/token` continuar **publicamente acessível** no mesmo host dos testes **e** não houver aceite de risco por escrito.  
- **Mais de uma instância** ativa sem aceite de risco de lote.  
- **MP/Supabase** não validados ou webhook claramente não chegando.

---

## 10. Conclusão objetiva

| Pergunta | Resposta |
|----------|----------|
| O que já está pronto? | Fluxo produto e **caminhos financeiros principais** endurecidos no backend; UI jogo validada em documentos de bloco. |
| O que ainda exige cuidado? | Debug endpoint, escala, ledger, admin, payout, métricas. |
| O que preparar antes de agir hoje? | **Secção 7** na íntegra. |
| Segurança mínima para começar testes operacionais? | **Sim**, **desde que** o checklist pré-operação seja cumprido e o escopo seja **piloto**, não produção aberta. |

---

*Fim do documento.*
