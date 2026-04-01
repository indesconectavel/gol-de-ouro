# BLOCO S — DISTRIBUIÇÃO, ESCALA E MONETIZAÇÃO

**Versão:** oficial (substitui tentativas anteriores de expansão não estruturadas no âmbito documental do projeto)  
**Data:** 2026-04-01  
**Modo:** READ-ONLY — análise e documentação estratégica; sem execução de comandos nem alteração de código neste artefacto.  
**Base de factos:** `server-fly.js`, `docs/relatorios` (incl. `BLOCO-S-FECHAMENTO-ETAPA-2026-03-31.md`, `RELATORIO-EXECUTIVO-COMPLETO.md`, `INVENTARIO-ENV-V1.md`, `MAPA-ENDPOINTS-V1.md`, `AUDITORIA-POS-PROMOCAO-PLAYER-PIX-READY-2026-03-28.md`, `ESTADO-ATUAL-SISTEMA-HANDOFF-2026-04-01.md`).

---

## Resumo executivo

O ecossistema **Gol de Ouro** em produção combina **API Node** na **Fly.io** (`goldeouro-backend-v2.fly.dev`), **Player** na **Vercel** (domínios `goldeouro.lol` / `www` / `app`), **Supabase** (Postgres + auth de apoio no backend), **Mercado Pago** (PIX, webhook, reconcile). O fluxo **cadastro → depósito PIX → jogo (JWT) → saque** está descrito nos mapas de rotas e validações documentais; o **BLOCO S** anterior concluiu que a **ativação própria Web/PWA** é viável, enquanto **lojas de aplicações** e **B2B/bets em escala** exigem **compliance, governança e modelo de parceiro** ainda não implementados.

**Veredito de prontidão para escala agressiva:** **NÃO** no sentido de tráfego pago massivo + lojas + parcerias B2B sem fechar jurídico e produto; **PARCIAL** para **crescimento controlado** na Web/PWA com monitorização operacional.

**Próxima ação recomendada:** consolidar operação própria (observabilidade, SMOKES, prova PIX→jogo→saque com utilizador real) e, em paralelo, mandato jurídico para decidir **App Store / afiliados / white-label**.

---

## 1. Mapeamento atual do sistema

### 1.1 URLs de produção (evidência documental)

| Camada | URL / host | Fonte |
|--------|------------|--------|
| **Backend API** | `https://goldeouro-backend-v2.fly.dev` | Relatórios de validação, `INVENTARIO-ENV-V1.md` (fallback player) |
| **Player (produção)** | `https://app.goldeouro.lol`, `https://www.goldeouro.lol`, apex `goldeouro.lol` (redirect) | `RELATORIO-EXECUTIVO-COMPLETO.md`, `AUDITORIA-POS-PROMOCAO-PLAYER-PIX-READY-2026-03-28.md` |
| **Player (alternativa Vercel)** | Referências a `goldeouro-player.vercel.app` e projecto Vercel em auditorias | Mesmas auditorias; **ids de deployment mudam** entre promoções |
| **Admin (referência env)** | `https://admin.goldeouro.vercel.app` como exemplo em config | `AUDITORIA-MERCADOPAGO-REAL-V1.md` (defaults de código legado; validar env real) |

**Inferência:** o domínio canónico de jogador para comunicação externa deve ser alinhado com a equipa (**`app.goldeouro.lol`** na documentação recente).

### 1.2 Estrutura de deploy

| Peça | Plataforma | Evidência |
|------|------------|-----------|
| **Backend** | **Fly.io** — `Dockerfile` → `node server-fly.js`; `fly.toml` app `goldeouro-backend-v2` | `RELATORIO-EXECUTIVO-COMPLETO.md`, relatórios de deploy |
| **Player** | **Vercel** — projeto `goldeouro-admins-projects/goldeouro-player` | `RELATORIO-EXECUTIVO-COMPLETO.md` |
| **Admin** | **Vercel** (repositório/projeto separado referido na documentação) | `PREPARACAO-AUTOMATICA-...`, `INVENTARIO-ENV-V1.md` |

### 1.3 Integrações ativas (backend)

| Integração | Papel | Evidência |
|------------|-------|-----------|
| **Supabase** | Postgres, service role no servidor, operações de saldo/chutes/saques | `MAPA-ENDPOINTS-V1.md`, `assertRequiredEnv` |
| **Mercado Pago** | Criar PIX, webhook, consulta de pagamento, reconcile | `INVENTARIO-ENV-V1.md` |
| **JWT** | Sessão de jogador após login/registo | `MAPA-ENDPOINTS-V1.md` |

### 1.4 Fluxo do utilizador (ponta a ponta lógica)

1. **Cadastro / login:** `POST /api/auth/register`, `POST /api/auth/login` → token JWT.  
2. **Depósito:** `POST /api/payments/pix/criar` (JWT) → fluxo MP → `POST /api/payments/webhook` → crédito de saldo (RPC/fallback documentado).  
3. **Jogo:** `POST /api/games/shoot` (JWT) — débito/aposta e resultado conforme motor de lotes em `server-fly.js`.  
4. **Saque:** `POST /api/withdraw/request` (JWT); histórico `GET /api/withdraw/history`.  

**Dependência:** todas as rotas sensíveis (exceto webhook com regras próprias) exigem **Bearer** válido emitido pelo backend de produção (`DIAGNOSTICO-CIRURGICO-...` alerta para não misturar `JWT_SECRET` local com produção).

---

## 2. Análise de distribuição atual

### 2.1 PWA e mobile

| Questão | Facto / inferência | Classificação |
|---------|-------------------|---------------|
| **Funciona como PWA?** | Documentação estratégica anterior afirma **base PWA favorável** e canal Web próprio (`BLOCO-S-FECHAMENTO-ETAPA-2026-03-31.md`). **Não** há neste repositório `manifest.json` do player — confirmação técnica exige repositório **goldeouro-player**. | **PARCIAL** (estratégia sim; evidência de build aqui: não) |
| **Suporte mobile real** | Player é **SPA web** na Vercel; experiência mobile = **browser** (responsivo). **Não** há app nativo no backend. | **PARCIAL** |
| **Performance móvel** | Não medida neste documento; auditorias citam assets e CSP (GTM, Posthog). | **Não classificável** sem Lighthouse/Web Vitals dedicados |
| **Dependência login/token** | **Alta** — `shoot`, PIX autenticado, saque: **JWT** obrigatório (`MAPA-ENDPOINTS-V1.md`). | **Facto** |

### 2.2 Classificação geral distribuição atual

**PARCIAL** — Web produção alinhada ao backend documentado; **PWA/app stores** não fechados neste repositório.

---

## 3. Viabilidade App Store / Google Play

### 3.1 Expo / EAS

- O repositório **goldeouro-backend** **não** contém projeto **Expo**.  
- **Inferência:** empacotar com **Expo/EAS** seria **novo projeto** (WebView ou wrapper) ou migração do player — **fora do âmbito factual deste repo**.

### 3.2 WebView

- O produto actual é **aplicação web** servida pela Vercel; um wrapper **WebView** para lojas é **tecnicamente possível** mas **não** melhora por si só a conformidade com políticas de apostas.

### 3.3 Políticas (gambling / dinheiro real)

| Loja | Risco | Facto documental |
|------|-------|------------------|
| **Apple / Google** | **ALTO** para apps com **apostas com dinheiro real** sem licenciamento e sem categoria aprovada | `BLOCO-S-FECHAMENTO-ETAPA-2026-03-31.md` — **não recomendado** no estágio actual por risco regulatório e de política |

### 3.4 Checklist de publicação (alto nível)

1. Parecer **jurídico** sobre jogo com dinheiro real no território alvo.  
2. Licenças / registos exigidos pela **Apple** e **Google** para **real-money gaming** (varia por jurisdição).  
3. Políticas de **KYC/AML** se exigidas.  
4. Separar **build de loja** (bundle id, privacy policy URL, classificação etária).  
5. **Não** depender de segredos MP no cliente (`DIAGNOSTICO-BLOCO-M-SEGURANCA-2026-03-30.md` — `VITE_*`).

### 3.5 Riscos de reprovação

- **Alto:** real money + skill/gambling sem enquadramento legal claro.  
- **Médio:** WebView mínima — rejeição por “thin app”.  
- **Médio:** incoerência de URLs de webhook/backend entre ambientes.

### 3.6 Ajustes necessários (estratégicos)

- Decisão **go/no-go** jurídica **antes** de investir em EAS.  
- Se **não** houver licença: manter **distribuição Web** (PWA) como canal principal (`BLOCO-S-FECHAMENTO-ETAPA-2026-03-31.md`).

---

## 4. Integração com bets (nível avançado)

### 4.1 O backend permite integração via API?

**Sim, em princípio:** superfície **HTTP + JSON**, rotas documentadas em `MAPA-ENDPOINTS-V1.md`. **Não** há documentação OpenAPI oficial anexada como contrato de parceiro neste ficheiro.

### 4.2 Controlo de saldo externo?

**Não documentado** como feature de “wallet externa”: o saldo é **canónico** em `usuarios` no Supabase, operado pelo backend. Integrador externo precisaria de **API keys**, **idempotência** e modelo legal — **inexistente** nos relatórios como produto fechado.

### 4.3 White-label?

**Não implementado.** O fechamento anterior do BLOCO S lista lacunas: `partner_id`, atribuição auditável, contrato B2B (`BLOCO-S-FECHAMENTO-ETAPA-2026-03-31.md`).

### 4.4 Sugestões (estratégia, não especificação de código)

| Tema | Direção |
|------|---------|
| **Modelo de integração** | API com **tenant** (`partner_id`), quotas, webhooks de conversão, ambiente sandbox |
| **Revenue share** | Percentagem sobre **GGR** ou **taxa fixa por depósito** — exige **ledger** por parceiro (hoje **não** evidenciado) |
| **Adaptação** | Isolar branding por domínio + chaves MP por parceiro ou subconta MP — **projeto à parte** |

---

## 5. Plano de escala (90 dias)

*Orientação estratégica; não substitui roadmap de produto aprovado pela equipa.*

### Fase 1 — Ativação (0–30 dias)

- Primeiros utilizadores: **canal Web** (`app.goldeouro.lol`) com SMOKES documentados (login, PIX, shoot, saque).  
- Testes de conversão: funis mínimos (registo → depósito → primeira jogada) com **métricas** (taxa de drop por passo — implementação em produto/analytics fora do scope deste repo).  
- Endurecer **observabilidade** (logs `[SHOOT]`, webhook, erros 23502).

### Fase 2 — Otimização (30–60 dias)

- Retenção: comunicação, limites responsáveis, melhoria de UX (frontend).  
- Refinar funil com base em dados reais; **não** escalar tráfego pago sem baseline de **CAC** e **LTV** estimados.

### Fase 3 — Escala (60–90 dias)

- Tráfego pago: **apenas** com critérios de **payback** e capital de risco definidos.  
- Parcerias / afiliados: **só** com contrato e, se aplicável, **modelo de atribuição** + eventual `partner_id` em roadmap técnico.

---

## 6. Modelo de monetização (projeção ilustrativa)

### 6.1 Parâmetros tirados do código (`server-fly.js`)

- **Aposta R$ 1,00:** configuração de lote `size: 10` — cada lote completo arrecada **10 × R$1 = R$10**.  
- **Gol normal:** prémio fixo **R$ 5,00** ao vencedor do lote (`premio = 5.00`).  
- **Gol de Ouro:** **+R$ 100,00** extra quando o contador global é múltiplo de **1000** (evento raro — ignorado na primeira aproximação ou tratado como ajuste fino).  
- **Taxa de saque (referência):** default **R$ 2,00** (`PAGAMENTO_TAXA_SAQUE || '2.00'`) — incide sobre **saque**, não sobre cada jogada.

### 6.2 Retenção bruta da plataforma por jogadas completas (lotes R$1)

Por cada **10 jogadas** (um lote cheio): entrada **R$ 10**, saída em prémio **R$ 5** → **margem bruta de caixa do jogo ≈ R$ 5 por 10 jogadas**, ou **~R$ 0,50 por jogada** neste modo, **antes** de custos MP, infra, impostos, marketing.

**Cenário proporcional (ilustrativo):**

| Utilizadores (1 jogada cada, todas em lotes de R$1 completos) | Arrecadação total | Prémios (aprox.) | Margem bruta jogo (aprox.) |
|-----------------------------------------------------------------|-------------------|------------------|----------------------------|
| **100** | R$ 100 | R$ 50 | **R$ 50** |
| **1.000** | R$ 1.000 | R$ 500 | **R$ 500** |
| **10.000** | R$ 10.000 | R$ 5.000 | **R$ 5.000** |

**Ressalvas obrigatórias:**

1. **Inferência:** assume lotes sempre completos de 10 em R$1 e ignora **Gol de Ouro** (+R$100 ocasional).  
2. **Não** inclui: taxas Mercado Pago, impostos, chargebacks, custo de servidor, suporte, marketing.  
3. Outros valores de aposta (R$2, R$5, R$10) têm **outros** `size` e probabilidades (`batchConfigs`) — margem por jogada **não** é linear sem simular mix.  
4. Saque: utilizador retira saldo; a **taxa R$2** por operação de saque é **receita adicional** da operação, não incluída na tabela acima.

---

## 7. Riscos estratégicos

| Categoria | Risco | Grau |
|-----------|-------|------|
| **Técnico** | Estado de lotes/contador em **memória** por instância Fly — comportamento multi-máquina | **ALTO** (escala horizontal) |
| **Técnico** | Constraints DB legado/V1 — regressão **23502** se schema divergir | **MÉDIO** |
| **Legal** | Oferta de jogo com dinheiro real sem enquadramento explícito no documento | **ALTO** |
| **Financeiro** | Dependência **Mercado Pago**; spreads e contestações | **MÉDIO** |
| **Operacional** | Webhook inválido / ruído; necessidade de monitorização contínua | **MÉDIO** |
| **Produto** | Expectativa de **lojas** sem compliance | **ALTO** |

---

## 8. Conclusão executiva

| Pergunta | Resposta |
|----------|----------|
| **O sistema está pronto para escalar** (tráfego massivo + lojas + B2B)? | **Não** com as salvaguardas actuais documentadas. |
| **O que falta obrigatoriamente?** | Base jurídica para real-money; governança B2B; eventual endurecimento multi-instância da engine; provas operacionais contínuas (PIX→jogo→saque real). |
| **Próxima ação recomendada** | **Operação própria Web** + métricas de funil; **paralelo:** parecer jurídico e decisão sobre **PWA vs loja** vs **parcerias**. |

---

## 9. Diagnóstico completo (síntese)

| Dimensão | Estado |
|----------|--------|
| **Infra produção** | Backend Fly + Player Vercel + domínios `.lol` documentados |
| **API-first** | Sim — adequado a integrações futuras **se** produto/legal permitirem |
| **Distribuição** | Web forte; **lojas** não recomendadas sem compliance (`BLOCO-S-FECHAMENTO-ETAPA-2026-03-31.md`) |
| **Monetização mecânica** | Lotes com margem bruta positiva no modo R$1 modelado; **lucro líquido** exige modelo de custos fora do âmbito deste doc |
| **Escala** | **Gargalo** técnico potencial: estado em memória; **gargalo** estratégico: legal + parceiros |

---

## 10. Recomendação final

1. Adoptar este documento como **referência oficial do BLOCO S** até nova revisão datada.  
2. Priorizar **crescimento orgânico/controlado na Web** e **prova documental** de jornadas reais.  
3. Não iniciar **EAS/App Store** nem **white-label B2B** sem **mandato jurídico** e **roadmap técnico** (`partner_id`, ledger por parceiro).

---

## Referências internas

- `BLOCO-S-FECHAMENTO-ETAPA-2026-03-31.md`  
- `ESTADO-ATUAL-SISTEMA-HANDOFF-2026-04-01.md`  
- `RELATORIO-EXECUTIVO-COMPLETO.md`  
- `MAPA-ENDPOINTS-V1.md`  
- `INVENTARIO-ENV-V1.md`  
- `server-fly.js` (`batchConfigs`, prémios, `PAGAMENTO_TAXA_SAQUE`)

---

*Fim do BLOCO S — Distribuição e escala (análise 2026-04-01).*
