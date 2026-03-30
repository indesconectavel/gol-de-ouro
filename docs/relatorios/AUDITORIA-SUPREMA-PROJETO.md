# Auditoria suprema do projeto Gol de Ouro

**Data:** 2026-03-27  
**Propósito:** avaliação de prontidão para **produção com dinheiro real**, no nível de análise para **investidores/sócios** e **CTO**.  
**Método:** leitura direta do código em `server-fly.js`, `config/required-env.js`, `goldeouro-player/src/App.jsx` e consolidação com relatórios e cirurgias já documentados no repositório. **Nenhum teste automatizado foi executado nesta sessão.**

---

## 1. Resumo executivo (direto e sem suavizar)

O sistema **implementa** um fluxo completo de produto de apostas com dinheiro: **registro/login**, **depósito PIX (Mercado Pago)**, **jogo com débito de saldo por chute**, **saque com débito de saldo no pedido**, **webhook** e **reconciliação** de PIX. As **cirurgias recentes** em `server-fly.js` endereçam os dois maiores buracos que uma auditoria forense ingênua apontaria: **crédito PIX duplicado** (agora há **claim atômico** `pending → approved` + **lock otimista** no saldo num helper único) e **saque sem débito** (agora há **débito com lock otimista** antes do `insert` em `saques`, com **rollback** se o insert falhar).

**Isso não transforma o produto em um “banco” auditável:** não há **ledger** imutável de movimentações; **não há transação SQL única** envolvendo `pagamentos_pix` e `usuarios` no PIX; **há estado de jogo em memória** (`lotesAtivos`, `idempotencyProcessed`) que **não** sobrevive a múltiplas instâncias nem a restarts sem impacto; **há um endpoint de debug** que devolve **payload JWT decodificado**; **`GET /api/metrics`** **zera** contadores de chutes mesmo quando existem linhas em `metricas_globais` no trecho lido (~2190–2193).

**Veredito único:** o sistema **não** está no estado “pode ligar em produção aberta com dinheiro ilimitado e dormir tranquilo”. Está no estado **“pode operar com dinheiro real sob condições explícitas de escopo, escala e hardening operacional”** — na classificação pedida na Etapa 8: **PRONTO COM RESSALVAS** (próximo de **PRONTO COM ALTO RISCO** se alguém ignorar as ressalvas de escala e segurança).

---

## 2. Funcionamento geral

### Etapa 1 — Funcionamento real

**1. O sistema funciona de ponta a ponta?**  
**Sim, no desenho implementado:** o backend expõe autenticação JWT, perfil, criação de PIX, webhook, reconciliação, shoot, saque e histórico; o player React tem rotas para login, registro, dashboard, `/game` (`GameFinal`), perfil, saque e pagamentos, com `ProtectedRoute` exigindo token.

**2. O usuário consegue registrar, logar, jogar, depositar, sacar?**  
**Sim**, assumindo **Supabase**, **Mercado Pago** e **variáveis de ambiente** corretas (`assertRequiredEnv` exige `JWT_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`; em produção também `MERCADOPAGO_ACCESS_TOKEN` — `config/required-env.js` + chamada em `server-fly.js` ~44–47).

**3. Fluxos quebrados conhecidos no código?**  
- **Painel admin** “completo” **não** está integrado ao `server-fly.js` como produto único (há artefatos em `routes/adminRoutes.js` não montados; UI em `src/App.jsx` do pacote raiz com componentes ausentes — ver relatório BLOCO J). **Não** invalida o fluxo do jogador.  
- **Métricas na API** podem **não** refletir o contador real usado no shoot (`/api/metrics` força zeros em parte do fluxo — ~2190–2193). **Impacto:** UX/HUD, não necessariamente o saldo em si.

---

## 3. Análise financeira

### PIX

| Pergunta | Resposta fundamentada |
|----------|------------------------|
| Pode duplicar crédito? | **Muito mais difícil que antes:** existe **`creditarPixAprovadoUnicoMpPaymentId`**: claim **`UPDATE … WHERE id AND status = 'pending'`**, depois crédito com **`.eq('saldo', saldoAnt)`**; se falha, volta **`pending`**. Duplicata exige condições anómalas (ex.: linha `approved` sem crédito legado) ou falhas de revert não cobertas por teste. |
| Webhook é seguro? | **Parcialmente:** assinatura MP **obrigatória em produção** se `MERCADOPAGO_WEBHOOK_SECRET` (~1847–1857); fora de produção assinatura inválida pode ser ignorada (~1858–1859). Resposta **200** antes do processamento assíncrono — padrão MP, com reconciliação como rede de segurança. |
| Reconciliação é segura? | **Usa o mesmo helper** que o webhook — **não** há mais dois blocos independentes de “update approved + credit” sem claim. |
| Idempotência real? | **Forte ao nível de aplicação** (claim + `approved` curto-circuito), **não** é **SERIALIZABLE** em uma única transação SQL englobando duas tabelas. |

### Saque

| Pergunta | Resposta |
|----------|----------|
| Saldo debitado? | **Sim** — `update` com **`.eq('saldo', usuario.saldo)`** antes de `insert` em `saques` (~1459–1473). |
| Múltiplos saques no mesmo saldo? | **Não** na mesma corrida vencedora: segundo pedido falha no lock ou no saldo. **Idempotência de pedido** (mesmo POST repetido) **não** está implementada — dois pedidos **distintos** sequenciais são válidos se o saldo permitir. |
| Race no saque? | **Mitigada** pelo lock otimista; residual: falha entre débito e insert trata rollback documentado na cirurgia A2. |

### Shoot

| Pergunta | Resposta |
|----------|----------|
| Débito consistente? | **Sim** — lock otimista em `usuarios.saldo`; rollback em falha de validação pós-chute ou insert em `chutes`. |
| Jogar sem saldo? | **Não** no caminho feliz: checagem `user.saldo < betAmount` e update condicional. |
| Contador global vs saldo | **Inconsistência possível:** `contadorChutesGlobal++` e `saveGlobalCounter()` ocorrem **antes** do update de saldo no shoot — se o update falhar com 409, o contador global pode **adiantar** em relação ao saldo (comportamento já identificado em auditorias anteriores). |

### Saldo global

| Pergunta | Resposta |
|----------|----------|
| Pode ficar inconsistente? | **Entre tabelas agregadas e realidade:** sim, se `total_apostas` / totais não forem atualizados em todo evento (não revalidado linha a linha nesta sessão). **Entre `usuarios.saldo` e soma de movimentos:** sem ledger, reconciliação contábil **exige** processo externo ou consultas ad hoc. |
| Sobrescrito por corrida? | **PIX e saque e shoot** usam padrões de lock onde cirurgiado; **não** há prova de “zero race” em sentido formal de isolamento de banco em **toda** operação cruzada. |

**👉 O dinheiro está seguro?**  
**Relativamente seguro para um MVP financeiro bem operado:** os **três eixos** (entrada PIX, saída saque, aposta) passam por **atualização de saldo com versão implícita** (lock otimista) ou **claim** no PIX. **Não** está no patamar de **instituição de pagamentos** com auditoria contábil completa e **sem** risco residual de edge cases, multinstância e observabilidade.

---

## 4. Riscos críticos

| Risco | Classificação | Nota |
|-------|----------------|------|
| **`GET /api/debug/token` público** | **CRÍTICO** (segurança) | Expõe **claims JWT** no JSON (~2650–2657). Em host público sem WAF/rota bloqueada = **vazamento de informação** e facilitação de ataques. |
| **Múltiplas instâncias Fly** com **lotes e idempotência em RAM** | **CRÍTICO** (integridade de jogo / possível inconsistência) | `lotesAtivos` Map (~370+), `idempotencyProcessed` (~377+) **não** são compartilhados entre processos. |
| **Ausência de ledger** | **CRÍTICO** (compliance / recuperação) | Disputas e auditoria financeira **dependem** de Supabase e boa governança; **não** é bug de código isolado, é **lacuna de produto**. |
| **Operação de saque líquido no mundo real** | **CRÍTICO** (negócio) | O backend **debita** na conta; **liquidação PIX** para o usuário **final** depende de **processo/worker** fora do escopo desta leitura — se inexistente, **dinheiro retido** sem payout. |

---

## 5. Riscos médios

| Risco | Classificação |
|-------|----------------|
| **`GET /api/metrics` / HUD** inconsistente com contador real | **MÉDIO** (produto/confiança) |
| **Webhook MP** responde 200 antes de terminar processamento | **MÉDIO** (operacional; mitigado por reconcile) |
| **CPF fallback** em `pix/criar` se ainda presente | **MÉDIO** (MP pode rejeitar ou gerar ruído) |
| **Painel admin** não montado | **MÉDIO** (operação; não bloqueia jogador) |
| **Email verificado** não enforcement rígido (se não houver no login) | **MÉDIO** (abuso de contas — não revalidado aqui) |

---

## 6. Segurança

**Endpoints perigosos:**  
- **`/api/debug/token`** — **sem autenticação**; retorna **decoded** JWT (~2626–2670). **Alto risco** se exposto.  
- **`GET /api/monitoring/metrics`** e **`/api/monitoring/health`** (~leitura anterior) — **informação operacional** sem auth; risco de **reconhecimento**, não necessariamente movimento de saldo.

**Autenticação:** JWT em rotas sensíveis; `bcrypt` em login/registro; rate limit em auth (trechos já analisados em auditorias anteriores).

**Exploits:** saque/PIX/shoot **endurecidos**; exploração **clássica** de double-spend no mesmo snapshot **reduzida**; **não** há prova de “zero exploit” sem teste de penetração e carga.

**Vazamento:** token em **localStorage** no player (padrão SPA) — risco **XSS** depende do front; não auditado em profundidade aqui.

---

## 7. Deploy e produção

**1. Pode deployar hoje com segurança?**  
**Sim, com condições:** secrets corretos, **HTTPS**, **bloqueio ou remoção** de `/api/debug/token` em produção, **uma instância** ou aceitação explícita dos riscos de **estado em memória**, **MP** e **Supabase** configurados.

**2. Condições:**  
- `JWT_SECRET`, Supabase, `MERCADOPAGO_ACCESS_TOKEN` (prod), `BACKEND_URL`/webhook MP, `MERCADOPAGO_WEBHOOK_SECRET` recomendado.  
- CORS allowlist já existe para domínios oficiais + previews Vercel.

**3. Risco imediato ao publicar?**  
**Se** `debug` e **multinstância** forem ignorados — **sim**.  
**Se** piloto fechado, uma máquina, monitoramento **—** risco **controlável**.

**4. Múltiplos usuários / carga:**  
**Muitos usuários** simultâneos no **mesmo processo** — **suportado** em princípio pelo modelo; **carga alta** + **várias VMs** — **estado de lote** quebra.

---

## 8. Escalabilidade

- **Sim**, o sistema **quebra conceitualmente** com **múltiplas instâncias** para **lógica de lote** e **idempotência de chute** em **Map** local.  
- **Estado em memória crítico:** `lotesAtivos`, `idempotencyProcessed`, `contadorChutesGlobal` (este último também persistido em `metricas_globais` com nuances).  
- **Dependência de processo único** para **comportamento determinístico do lote** como está hoje — **sim**.

---

## 9. UX / Produto

- **Fluxo:** login → rotas protegidas → jogo `/game` — **claro** no `App.jsx`.  
- **Inconsistências:** métricas globais na API vs shoot; possíveis totais de perfil vs `chutes` (já relatado).  
- **Fila** `/api/fila/entrar` **simulada** — pode confundir se a UI prometer fila real.

---

## 10. Veredito final

**NÃO PRONTO PARA PRODUÇÃO** no sentido de **“abrir ao público geral, multi-instância, sem checklist de segurança e sem operação financeira externa”**.

**PRONTO COM ALTO RISCO** seria injusto **depois** das cirurgias financeiras — o núcleo **não** está “solto” como na auditoria forense **anterior** ao saque/PIX.

**Classificação escolhida:** **PRONTO COM RESSALVAS** para **produção com dinheiro real em escopo limitado** (piloto, uma instância, hardening de rotas, operação consciente).

**Não** **PRONTO PARA PRODUÇÃO** irrestrita como produto financeiro maduro.

---

## 11. Recomendação executiva (CTO)

| Pergunta | Resposta |
|----------|----------|
| **Colocaria dinheiro real nisso?** | **Sim** apenas como **capital de teste limitado** e com **checklist** (bloquear debug, definir escala, observabilidade, processo de payout). **Não** como carteira inteira sem governança. |
| **Apresentaria para investidores?** | **Sim**, com **transparência** sobre limites de escala, ausência de ledger, dependência de MP/Supabase e roadmap de hardening. |
| **Liberaria para usuários?** | **Sim** em **beta fechado / lista permitida**; **não** em **aberto massivo** sem mitigar **debug**, **multinstância** e **operação de saque**.

---

### Síntese das perguntas da missão principal

| Pergunta | Resposta |
|----------|----------|
| Pronto para produção com dinheiro real? | **Com ressalvas fortes** — não “sim” categórico. |
| Riscos reais? | Debug, escala horizontal, ledger, payout operacional, métricas. |
| O que pode quebrar? | Lotes entre instâncias; métricas; edge de rollback; dependência de MP. |
| Dinheiro realmente seguro? | **Mais seguro** nos **pontos cirurgiados**; **não** “à prova de banco central”. |

---

*Fim da auditoria suprema.*
