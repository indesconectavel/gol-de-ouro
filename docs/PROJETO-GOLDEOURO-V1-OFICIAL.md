# PROJETO OFICIAL — GOL DE OURO V1

**Documento:** registo oficial do produto, alinhado às auditorias consolidadas no repositório.  
**Data de referência:** 2026-03-29  
**Versão do pacote backend (`package.json`):** 1.2.0  

---

## 1. Apresentação do projeto

**Gol de Ouro** é uma aplicação de jogo com componente financeiro (depósito PIX via Mercado Pago, saldo em conta, chutes com aposta fixa na V1, saques). O repositório `goldeouro-backend` é um **monorepositório** que inclui o **backend Node/Express** (entrada de produção `server-fly.js`), integração **Supabase** (PostgreSQL), frontends **`goldeouro-player`** e **`goldeouro-admin`**, e uma **biblioteca extensa de relatórios** em `docs/` e `docs/relatorios/`.

---

## 2. Objetivo do sistema

- Permitir **registo, autenticação e perfil** de utilizadores.  
- Gestionar **saldo** como fonte de verdade em `usuarios.saldo`.  
- Permitir **depósitos PIX** (Mercado Pago) com registo em `pagamentos_pix`, confirmação por **webhook** e **reconcile** periódico.  
- Executar **gameplay** com motor de **lotes em memória** e **contador global**, com persistência de chutes e métricas no Supabase.  
- Suportar **saques** com caminho RPC opcional ou fallback JavaScript.  
- Expor **API administrativa** sob `/api/admin/*` protegida por `x-admin-token`.  

---

## 3. Visão geral da arquitetura

| Camada | Descrição |
|--------|-----------|
| **Cliente jogador** | SPA `goldeouro-player` — consome API pública/JWT do backend. |
| **Cliente admin** | SPA `goldeouro-admin` — consome `/api/admin/*` com token de admin. |
| **API** | Monólito Express em `server-fly.js` (rotas principais declaradas inline; não o conjunto de `routes/*.js` legado não montado). |
| **Dados** | Supabase: `usuarios`, `chutes`, `pagamentos_pix`, `saques`, `metricas_globais`, etc. |
| **Pagamentos** | REST Mercado Pago (`/v1/payments`, `/v1/payments/{id}`). |
| **Deploy referido** | `Dockerfile` → `node server-fly.js`; `fly.toml` com app `goldeouro-backend-v2`. |

---

## 4. Componentes principais

- **`server-fly.js`** — núcleo: auth, jogo, PIX, webhook, reconcile, withdraw, health/ready, montagem de `adminApiFly` e `analyticsIngest`.  
- **`routes/adminApiFly.js`** — contrato oficial das rotas administrativas.  
- **`database/supabase-unified-config.js`** — clientes Supabase e validação de credenciais no boot.  
- **`utils/webhook-signature-validator.js`** — validação HMAC Mercado Pago (quando `MERCADOPAGO_WEBHOOK_SECRET` está definido).  
- **`utils/financialNormalization.js`** — normalização/dual-write financeiro.  
- **SQL em `database/`** — schema e RPCs (ex.: `rpc-financeiro-atomico-2026-03-28.sql`).  
- **Frontends** — `goldeouro-player`, `goldeouro-admin` (build com variáveis `VITE_*` documentadas no inventário de env).  

---

## 5. Fluxo ponta a ponta

1. Registo ou login → JWT.  
2. Consulta de perfil / saldo.  
3. Criação de PIX → Mercado Pago → insert `pagamentos_pix` `pending`.  
4. Pagamento no MP → webhook `POST /api/payments/webhook` (200 imediato) → `GET` pagamento no MP → se `approved`, crédito idempotente.  
5. Reconcile opcional para pendentes antigos.  
6. Chute `POST /api/games/shoot` (V1: aposta 1 real conforme código atual).  
7. Saque via `POST /api/withdraw/request`.  
8. Operações admin via `/api/admin/*`.  

*(Detalhe: `RELATORIO-MESTRE-V1-GOLDEOURO.md`.)*

---

## 6. Resumo dos blocos A → J

| Bloco | Âmbito | Síntese consolidada nas auditorias |
|-------|--------|--------------------------------------|
| **A** | Financeiro entrada | PIX, webhook, reconcile, idempotência; órfão MP sem linha local sem crédito automático. |
| **B** | Engine | Lotes em RAM, contador global, V1 aposta 1; riscos de memória/restart/falhas parciais. |
| **C** | Autenticação | JWT backend coerente; ressalvas pontuais no player (sessão/UI). |
| **D** | Saldo | Lock otimista, rollbacks documentados; mesma coluna para jogo e financeiro. |
| **E** | Gameplay | Alinhado a B/D: direções, prémios, Gol de Ouro por múltiplo de 1000 no contador. |
| **F** | Frontend jogador | HUD, integração shoot; possíveis desvios de contrato com métricas. |
| **G** | Segurança / superfície | JWT, rate limit; endpoints públicos amplos (health, monitoring). |
| **H** | Economia gamificada | Sem motor económico server-side paralelo ao núcleo na V1. |
| **I** | Escalabilidade | **Uma instância** recomendada para coerência de lotes/contador. |
| **J** | Admin | API `adminApiFly` alinhada; SPA admin com histórico de legado descrito nas auditorias. |

---

## 7. Estado atual do projeto

- **Código:** fluxo V1 implementado no caminho `server-fly.js`; `package.json` declara `main` e `start` para `server-fly.js`.  
- **Documentação:** centenas de relatórios em `docs/relatorios/` + pacote de entrada em `docs/` (este ficheiro, memória estratégica, mapa oficial/legado, etc.).  
- **Produção:** depende de **ambiente pago** (Fly.io), secrets, Supabase configurado, Mercado Pago e builds dos frontends — ver `STATUS-PRONTIDAO-DEPLOY-V1.md`.  

---

## 8. O que já foi validado

- Leitura **READ-ONLY** do código e fluxos críticos (auditorias por bloco, relatório mestre, Mercado Pago real vs env).  
- Mapa de **endpoints** reais montados no Fly entrypoint.  
- **Inventário de variáveis** e comportamento do webhook/PIX/reconcile.  
- **Matriz de riscos** e runbook operacional (órfão, webhook, saldo, queda).  
- **Checklists** GO/NO-GO e deploy + smoke test de produção (documentos operacionais).  

*(Validação em ambiente pago real = matriz GO/NO-GO a marcar no dia do deploy.)*

---

## 9. O que depende apenas do ambiente real

- Secrets no **Fly** (`MERCADOPAGO_*`, `BACKEND_URL`, `ADMIN_TOKEN`, Supabase, `JWT_SECRET`, etc.).  
- **Escala 1** para o processo do jogo.  
- **SQL** no Supabase (RPC financeira, UNIQUE em `payment_id`, migrações opcionais).  
- **Webhook** e credenciais no painel **Mercado Pago**.  
- **URLs** públicas e builds **Vite** do player e admin.  

---

## 10. Limitações conhecidas da V1

- Estado de **lotes e idempotência de chute** só em memória por processo; restart perde lotes ativos.  
- **Contador global** pode desviar-se de chutes persistidos em falhas específicas (auditoria B).  
- Webhook **200** antes do crédito — falhas posteriores dependem de MP + reconcile.  
- **Órfão MP** sem recuperação automática no código.  
- **Routers legados** e outros entrypoints no repo podem confundir se alguém alterar o `Dockerfile` sem auditoria.  
- Exposição de **health / monitoring** sem autenticação.  

*(Lista alinhada ao relatório mestre.)*

---

## 11. Riscos aceites

Documentado como postura tolerável **com disciplina operacional**: webhook sem secret em ambiente exposto (não recomendado para GO final); multi-instância sem novo desenho; exposição de métricas; playbook manual para órfãos; fragmentação histórica do cliente admin até uniformização por build.  

*(Detalhe: `MATRIZ-RISCOS-V1.md`.)*

---

## 12. Condições obrigatórias para lançamento

Conforme **`CHECKLIST-GO-NO-GO-V1.md`** (itens que bloqueiam se não verificados no alvo):

- `MERCADOPAGO_WEBHOOK_SECRET` em ambiente público.  
- `BACKEND_URL` correta para o host que o MP contacta.  
- RPC financeira aplicada (se a política exige crédito atómico SQL).  
- UNIQUE em `pagamentos_pix.payment_id` em produção.  
- `ADMIN_TOKEN` forte e alinhado ao admin.  
- **Uma instância** (ou decisão explícita documentada).  
- Endpoints admin e **fluxo PIX real** validados.  

---

## 13. Situação atual de prontidão

**PRONTO PARA DEPLOY QUANDO HOUVER ORÇAMENTO** para Fly e serviços externos, **desde que** no dia se executem `CHECKLIST-DEPLOY-FLY-MP-V1.md`, `SMOKE-TEST-PRODUCAO-V1.md` e se feche a matriz GO/NO-GO com OK nos bloqueadores.  

Não há, nas auditorias consolidadas, **obrigatoriedade de novo patch de código** antes desse primeiro lançamento; o restante é **operação e configuração**.

---

## 14. Conclusão oficial

O **Gol de Ouro V1** está **arquiteturalmente e documentalmente fechado** para a fase de preparação para produção: o coração técnico é `server-fly.js`, o coração documental é o conjunto **RELATORIO-MESTRE + checklists + runbook + índice mestre + este documento**. A ativação comercial técnica resume-se a **infraestrutura paga, secrets corretos e testes no ambiente real**, sem reabrir o desenho base salvo decisão estratégica futura.

---

## Documentos de leitura obrigatória associados

| Documento | Função |
|-----------|--------|
| `docs/LEIA-ANTES-DE-CONTINUAR-O-PROJETO.md` | Retomada e ordem de leitura |
| `docs/relatorios/RELATORIO-MESTRE-V1-GOLDEOURO.md` | Síntese técnica completa |
| `docs/relatorios/INDICE-MESTRE-GOLDEOURO-V1.md` | Inventário da documentação |

---

*Fim do documento oficial do projeto.*
