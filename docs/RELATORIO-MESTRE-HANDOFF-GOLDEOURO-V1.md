# RELATÓRIO-MESTRE DE HANDOFF — PROJETO GOL DE OURO

**Projeto:** Gol de Ouro  
**Documento:** Registro oficial do estado técnico pós-auditorias  
**Data:** 2026-03-16  
**Modo:** READ-ONLY ABSOLUTO — análise e documentação; nenhuma alteração de código, patch, refatoração, commit, merge ou deploy.

---

## 1. Visão geral do sistema

O **Gol de Ouro** é um jogo de apostas no formato penalty shootout: o jogador escolhe uma zona do gol (TL, TR, C, BL, BR), aposta R$ 1 por chute e o resultado é determinado por uma **engine de lotes** — a cada 10 chutes no mesmo lote, o 10º é sempre gol (prêmio R$ 5); a cada 1000 chutes globais há um bônus Gol de Ouro (R$ 100). A arquitetura é composta por:

- **Frontend (Player):** aplicação React (Vite) em `goldeouro-player/`, com rotas de login, dashboard, jogo (`/game` → GameFinal), depósito PIX, saque e perfil. Deploy na **Vercel**.
- **Backend:** API Node.js (Express) em `server-fly.js`, responsável por autenticação (JWT), perfil, chute (`POST /api/games/shoot`), PIX (criar/usuário), saque, webhook Mercado Pago e health. Deploy no **Fly.io**.
- **Engine de lotes:** lógica em memória no backend — lotes ativos por valor (V1 só valor 1), contador global de chutes, 10º chute = goal, Gol de Ouro a cada 1000. Persistência em **Supabase** (tabelas `usuarios`, `chutes`, `metricas_globais`).
- **Economia:** determinística — 10 apostas de R$ 1 = R$ 10 arrecadado; prêmio R$ 5 por lote; margem da plataforma R$ 5 por lote (50%). Gol de Ouro = +R$ 100 quando o goal coincide com múltiplo de 1000 no contador global.
- **Infraestrutura:** Player na Vercel (SPA, `dist/`); Backend na Fly.io (instância única); banco Supabase (PostgreSQL). Operação atual prevista para **instância única** do backend.

---

## 2. Arquitetura geral

| Camada | Tecnologia | Descrição |
|--------|------------|------------|
| **Player App** | React, Vite, React Router | SPA em `goldeouro-player/`. Login, registro, dashboard, `/game` (GameFinal), `/pagamentos`, `/withdraw`, `/profile`. Consome API do backend via `apiClient`; gameplay via `gameService` → `POST /api/games/shoot`. |
| **Backend** | Node.js, Express | `server-fly.js` — autenticação JWT, rotas `/api/auth/*`, `/api/user/*`, `/api/games/shoot`, `/api/payments/*`, `/api/withdraw/*`, `/health`, `/ready`, `/api/metrics`, webhook Mercado Pago. Lotes e contador global em memória. |
| **Banco de dados** | Supabase (PostgreSQL) | Tabelas: `usuarios` (saldo, perfil), `chutes` (registro de cada chute), `metricas_globais` (contador global, último Gol de Ouro). Conexão via cliente Supabase no backend. |
| **Deploy Player** | Vercel | Build: `npm run build`; output: `dist/`; framework: Vite. Rewrites para SPA (`/*` → `index.html`). Headers de segurança (CSP, X-Frame-Options, etc.). |
| **Deploy Backend** | Fly.io | App `server-fly.js`; configuração em `fly.toml`. Instância única; variáveis de ambiente (Supabase, JWT, Mercado Pago, etc.) via secrets do Fly. |

---

## 3. Engine de jogo

- **Lotes:** Em memória (`lotesAtivos`, Map). Para valor 1 (V1): lote de tamanho 10; `getOrCreateLoteByValue(1)` retorna lote ativo com vagas ou cria novo com `winnerIndex = 9` (10º chute = goal).
- **Chutes:** Cada `POST /api/games/shoot` com `direction` (TL, TR, C, BL, BR) e `amount: 1` debita R$ 1 do saldo, adiciona o chute ao lote, determina `result` (goal se `shotIndex === winnerIndex`, senão miss), credita prêmio em caso de goal e persiste em `chutes` e atualiza saldo.
- **Goal:** Posição fixa no lote — 10º chute = goal; prêmio base R$ 5; se o contador global for múltiplo de 1000 no mesmo chute, bônus Gol de Ouro R$ 100.
- **Economia determinística:** Sem sorteio; resultado do chute é apenas a posição no lote (1–9 miss, 10 goal). Contador global incrementado a cada chute aceito; persistido em `metricas_globais`. Mesmo jogador pode repetir no mesmo lote (regra oficial V1).

Referência técnica: `docs/relatorios/ENCERRAMENTO-PREMIUM-BLOCO-E-GAMEPLAY-V1.md`.

---

## 4. Economia do jogo

| Conceito | Valor |
|----------|--------|
| Valor do chute | R$ 1 (único valor aceito na V1) |
| Tamanho do lote | 10 chutes |
| Posição do gol | 10º chute |
| Prêmio base (goal) | R$ 5 |
| Bônus Gol de Ouro | R$ 100 (quando contador global é múltiplo de 1000 e o chute é goal) |

**Por lote (caso padrão, sem Gol de Ouro):**

- Arrecadação: 10 × R$ 1 = **R$ 10**
- Saída (prêmio): **R$ 5**
- **Lucro plataforma: R$ 5** (50% da arrecadação)

**Modelo econômico:** RTP (return to player) por lote = 50%; margem da plataforma 50%. Gol de Ouro ativo; mesma pessoa pode repetir no lote; operação atual prevista para instância única.

---

## 5. Rotas oficiais

### Rotas oficiais (Player — frontend)

| Rota | Uso |
|------|-----|
| `/` | Login |
| `/register` | Cadastro |
| `/forgot-password`, `/reset-password` | Recuperação/redefinição de senha |
| `/dashboard` | Hub pós-login (Jogar, Depositar, Sacar, Perfil) |
| **`/game`** | **Tela oficial do jogo (GameFinal)** |
| `/pagamentos` | Depósito PIX |
| `/withdraw` | Saque |
| `/profile` | Perfil |
| `/terms`, `/privacy`, `/download` | Legal e download |

### Rotas oficiais (Backend — API)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/api/auth/register` | Não | Registro |
| POST | `/api/auth/login` | Não | Login (JWT) |
| POST | `/api/auth/forgot-password` | Não | Esqueci senha |
| POST | `/api/auth/reset-password` | Não | Redefinir senha |
| GET | `/api/user/profile` | Sim | Perfil (saldo, dados) |
| PUT | `/api/user/profile` | Sim | Atualizar perfil |
| **POST** | **`/api/games/shoot`** | **Sim** | **Chute (direction, amount: 1)** |
| POST | `/api/payments/pix/criar` | Sim | Criar pagamento PIX |
| GET | `/api/payments/pix/usuario` | Sim | Pagamentos do usuário |
| POST | `/api/payments/webhook` | Não | Webhook Mercado Pago |
| POST | `/api/withdraw/request` | Sim | Solicitar saque |
| GET | `/api/withdraw/history` | Sim | Histórico de saques |
| GET | `/health` | Não | Status + DB + contador (exposto; risco documentado) |
| GET | `/ready` | Não | Readiness |

### Rotas legado (Player)

| Rota | Observação |
|------|------------|
| **`/gameshoot`** | Tela alternativa (GameShoot); nenhum botão/link/navigate aponta para ela. Acesso apenas por URL manual. Classificada como legado; pode ser removida ou redirecionada para `/game` no futuro. |

### Outros endpoints backend (suporte / risco)

- `GET /api/metrics` — métricas (dados zerados na configuração atual).
- `GET /api/monitoring/metrics`, `GET /api/monitoring/health` — monitoramento.
- `GET /api/debug/token` — expõe JWT decodificado; **deve ser desativado em produção** (auditoria Bloco G).
- `POST /api/admin/bootstrap` — primeiro admin (protegido).

---

## 6. Componentes oficiais do player

### Componentes ativos (fluxo real)

| Componente | Arquivo | Uso |
|------------|---------|-----|
| **GameFinal** | `goldeouro-player/src/pages/GameFinal.jsx` | Tela oficial do jogo na rota `/game`. Usa `layoutConfig`, `gameService`, HUD (saldo, chutes, ganhos, gols de ouro), zonas TL/TR/C/BL/BR, animações e overlays de resultado. Não usa InternalPageLayout nem TopBar. |
| Dashboard | `Dashboard.jsx` | Hub com botões Jogar (/game), Depositar, Sacar, Perfil. |
| InternalPageLayout | `InternalPageLayout.jsx` | Header (← MENU PRINCIPAL, Logo, título), footer (⚽ JOGAR AGORA → /game). Usado em Dashboard, Profile, Withdraw, Pagamentos, GameShoot. |
| Pagamentos | `Pagamentos.jsx` | Depósito PIX, valores [5,10,20,50,100,200], card R$ 20 recomendado, histórico. |
| Withdraw | `Withdraw.jsx` | Solicitação de saque PIX. |
| Profile | `Profile.jsx` | Perfil do jogador. |
| Login, Register, ForgotPassword, ResetPassword, Terms, Privacy, DownloadPage | Respectivos `.jsx` | Fluxos de auth e legal. |
| ProtectedRoute | `ProtectedRoute.jsx` | Redireciona para `/` se não autenticado. |

### Componentes legado

| Componente | Observação |
|------------|------------|
| **GameShoot** | Página em `/gameshoot`; usa gameService e InternalPageLayout; layout em % (GOAL_ZONES próprio). Não faz parte do fluxo de navegação; classificada como legado. |
| Game | `Game.jsx` | Importado no App mas **não** usado em nenhuma rota. |
| GameShootFallback, GameShootTest, GameShootSimple | Importados no App mas **não** usados em nenhuma rota. |

---

## 7. Estado atual dos blocos

| Bloco | Área | Status | Observações |
|-------|------|--------|-------------|
| A | Financeiro | VALIDADO | Depósitos PIX, saques, webhooks, worker de payout, ledger. |
| B | Sistema de apostas | VALIDADO | Modelo matemático, valor da aposta, lote, premiação. |
| C | Autenticação | VALIDADO | Login, registro, JWT, proteção de rotas, sessão. |
| D | Sistema de saldo | VALIDADO COM RESSALVAS | Concorrência com optimistic locking; ressalvas documentadas. |
| E | Gameplay | ENCERRADO PREMIUM | Engine documentada e blindada; instância única. |
| F | Interface | VALIDADO COM RESSALVAS | Build ok; correção Withdraw/GameShoot aplicada; validação visual no preview pendente de URL. |
| G | Antifraude | VALIDADO COM RISCOS MODERADOS | Exposição do contador em /health; /api/debug/token ativo; cliente não envia X-Idempotency-Key. |
| H | Economia e retenção | EM ANÁLISE | Engajamento, retenção, percepção de vitória. |
| I | Escalabilidade | NÃO AUDITADO | Multi-instância, contador global, filas. |
| J | Observabilidade | NÃO AUDITADO | Logs, métricas, alertas. |
| K | Painel administrativo | NÃO AUDITADO | Controle de usuários, relatórios, gestão. |

---

## 8. Riscos conhecidos

| Área | Risco | Severidade | Observação |
|------|--------|-----------|------------|
| **Saldo** | Concorrência entre chutes ou chute + outra operação | Moderada | Mitigado por optimistic locking (UPDATE com saldo lido); 409 em conflito. Ressalvas no Bloco D. |
| **Concorrência** | Lost update em multi-request simultâneo | Baixa a moderada | Idempotency opcional no backend; cliente oficial não envia X-Idempotency-Key; retry pode duplicar chute. |
| **Escala** | Múltiplas instâncias não suportadas | Alta se escalar | Lotes e contador em memória por processo; multi-instância implica lotes e contador divergentes. V1 operação instância única. |
| **Fraude** | Contador global exposto em GET /health | Moderada | Permite saber “chutes até próximo Gol de Ouro” e tentar capturar com conta(s). Auditoria Bloco G. |
| **Fraude** | Automação (bot) sem rate limit por usuário | Moderada | API stateless; sem CAPTCHA; rate limit por IP (100/15 min); sem cooldown entre chutes por usuário. |
| **Fraude** | /api/debug/token ativo | Alta em produção | Expõe JWT decodificado; deve ser desativado em produção. |
| **Infraestrutura** | Instância única | Aceito V1 | Fly.io uma instância; sem fila nem store compartilhado; adequado ao desenho atual. |

---

## 9. Próximas auditorias recomendadas

Prioridade sugerida:

1. **BLOCO H — Economia e retenção** — Validar engajamento, expectativa, retenção e percepção de vitória; necessário para critério “V1 validada”.
2. **BLOCO I — Escalabilidade** — Avaliar multi-instância, consistência do contador global e filas quando houver plano de escala.
3. **BLOCO J — Observabilidade** — Logs, métricas, monitoramento e alertas para operação em produção.
4. **BLOCO K — Painel administrativo** — Controle de usuários, relatórios e gestão operacional.

Refinar Bloco G (antifraude): reduzir exposição em /health, desativar /api/debug/token em produção, considerar idempotency no cliente.

---

## 10. Diagnóstico geral da V1

| Dimensão | Classificação | Comentário |
|----------|----------------|------------|
| **ARQUITETURA** | Sólida para instância única | Player (Vercel) + Backend (Fly.io) + Supabase; responsabilidades claras; lotes e contador em memória documentados. |
| **ECONOMIA** | Determinística e documentada | 10 in / 5 out / 5 margem; Gol de Ouro a cada 1000; regras oficiais no Encerramento Bloco E. |
| **ENGINE** | Encerrada premium | Regra do 10º chute, prêmio, Gol de Ouro, optimistic locking, reversão em falha; limites e riscos aceitos documentados. |
| **INTERFACE** | Validada com ressalvas | Rota oficial do jogo `/game` (GameFinal); BLOCO F com build ok e correções aplicadas; validação visual no preview pendente. |
| **SEGURANÇA** | Riscos moderados | JWT e rotas protegidas; antifraude com exposição do contador em /health e /api/debug/token; cliente sem idempotency key. |

---

## 11. Conclusão do handoff

- **Estado real do projeto:** O Gol de Ouro está em estado **pré-V1 validada**: blocos A, B, C validados; D com ressalvas; E encerrado premium; F validado com ressalvas (interface e build ok); G com riscos moderados; H em análise. Rotas oficiais do jogo e da API estão definidas; economia e engine documentadas. Produção atual permanece intacta após as auditorias (nenhuma alteração de código neste handoff).

- **Grau de maturidade:** Aproximadamente **88%** em relação aos critérios de V1 (ROADMAP). Para atingir “V1 validada” faltam: Bloco H validado; opcionalmente evoluir G (antifraude) e concluir validação visual do Bloco F no preview.

- **Próximo passo estratégico:** (1) Concluir auditoria do BLOCO H (Economia e retenção). (2) Corrigir riscos de antifraude (ex.: não expor contador em /health em produção, desativar /api/debug/token). (3) Realizar validação visual no preview do Vercel quando a URL estiver disponível. (4) Manter operação em instância única até decisão de escalar e auditoria do Bloco I.

---

*Documento gerado em modo READ-ONLY. Nenhum código, configuração ou deploy foi alterado. Referências: docs/ARQUITETURA-BLOCOS-GOLDEOURO.md, docs/ROADMAP-V1-GOLDEOURO.md, docs/relatorios/ENCERRAMENTO-PREMIUM-BLOCO-E-GAMEPLAY-V1.md, docs/relatorios/AUDITORIA-COMPLETA-BLOCO-F-INTERFACE-2026-03-16.md, docs/relatorios/VALIDACAO-FINAL-PREVIEW-BLOCO-F-VERCEL-2026-03-16.md, docs/relatorios/AUDITORIA-ROTAS-PLAYER-GOLDEOURO-2026-03-16.md, docs/relatorios/AUDITORIA-ANTIFRAUDE-BLOCO-G-READONLY-2026-03-09.md.*
