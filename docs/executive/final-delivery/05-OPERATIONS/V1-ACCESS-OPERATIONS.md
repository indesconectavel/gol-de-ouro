# GOL DE OURO V1 — ACCESS & OPERATIONS

**Documento:** acessos, ambientes, baseline e instruções operacionais  
**Público:** reunião executiva, abertura controlada, operação interna  
**Modo:** somente documentação — sem alteração de produção, código funcional, banco ou deploy  
**Data:** 2026-05-19

---

## 1. Objetivo do documento

Este documento centraliza **acessos**, **links**, **ambientes**, **baseline certificada** e **instruções operacionais** necessários para a reunião executiva e a abertura controlada da V1.

Ele serve como ponto único de referência para quem conduz a demo, valida infraestrutura antes da reunião e aplica governança sobre o que pode ou não ser mostrado ao vivo. Não substitui runbooks técnicos detalhados nem políticas de segurança — complementa-os com visão executiva e checklist prático.

---

## 2. Ambientes oficiais

### Player / MVP

| Campo | Valor |
|-------|-------|
| **URL principal** | https://www.goldeouro.lol |
| **URL alternativa** | https://app.goldeouro.lol |
| **Uso** | Acesso do jogador / MVP público |

### Painel Administrativo

| Campo | Valor |
|-------|-------|
| **URL** | https://admin.goldeouro.lol |
| **Uso** | Gestão, relatórios, auditoria, operação interna |

### Backend API

| Campo | Valor |
|-------|-------|
| **Base URL** | https://goldeouro-backend-v2.fly.dev |
| **Health** | https://goldeouro-backend-v2.fly.dev/health |
| **Meta** | https://goldeouro-backend-v2.fly.dev/meta |
| **Uso** | API principal do sistema |

---

## 3. Baseline certificada V1

| Item | Valor |
|------|-------|
| Runtime SHA | `a83c3cffcc998ed3d1bd8d2e88619a9b03afb634` |
| Fly Release | v461 |
| Player Bundle | `index-B6M2smS9.js` |
| Score V1.6 | 88/100 |
| Certificação | CERTIFIED WITH RESSALVAS |
| Maturidade | Semi-autonomous |
| Classificação operacional | GOVERNED |

**Validação rápida:** em `/meta`, confirmar que `gitCommit` corresponde ao SHA acima.

---

## 4. Infraestrutura

### Fly.io

- **App:** `goldeouro-backend-v2`
- **Função:** backend Node.js / API / runtime principal
- **Release certificada:** v461

### Vercel

- **Função:** hospedagem do player e painel/admin quando aplicável
- **Player bundle certificado:** `index-B6M2smS9.js`

### Supabase

- **Função:** banco PostgreSQL / persistência financeira / usuários / ledger / saques / PIX
- **Observação:** não expor credenciais em documentos executivos

### Mercado Pago

- **Função:** PIX, webhooks, payout/saques
- **Webhooks:** protegidos por HMAC
- **Observação:** não executar saque real durante a reunião

### GitHub

- **Função:** repositório oficial, histórico, PRs, auditorias e baseline
- **Branch principal:** `main`
- **Observação:** não executar deploy durante a reunião

---

## 5. Matriz de acesso operacional

| Ambiente | URL / Identificação | Finalidade | Criticidade | Pode mostrar na reunião? | Observação |
|----------|---------------------|------------|-------------|--------------------------|------------|
| Player | https://www.goldeouro.lol | MVP público, gameplay, depósito PIX (demo) | Alta | Sim | Preferir conta demo preparada |
| Admin | https://admin.goldeouro.lol | Gestão, relatórios, auditoria | Alta | Sim | Login com conta admin demo; evitar dados sensíveis de terceiros |
| Backend /health | https://goldeouro-backend-v2.fly.dev/health | Status runtime, DB, MP | Alta | Sim | Somente leitura; narrativa de dependências |
| Backend /meta | https://goldeouro-backend-v2.fly.dev/meta | SHA, versão, rastreabilidade | Alta | Sim | Confirmar SHA `a83c3cf…` |
| Fly.io | App `goldeouro-backend-v2` | Deploy backend, releases | Crítica | Parcial | Mostrar release v461 se necessário; não fazer deploy ao vivo |
| Vercel | Projetos player/admin | Frontends estáticos | Alta | Parcial | Mencionar bundle certificado; não expor tokens |
| Supabase | Projeto PostgreSQL (console) | Dados, ledger, usuários | Crítica | Não (credenciais) | Não abrir console com chaves na tela |
| Mercado Pago | Painel MP / webhooks | PIX, payout, reconciliação | Crítica | Parcial | Explicar HMAC; não mostrar chaves nem saque real |
| GitHub | Repositório `goldeouro-backend` | Código, PRs, auditorias | Média | Sim | Branch `main`, relatórios e certificação |

---

## 6. Contas para demonstração

> **Regra:** placeholders abaixo. Preencher antes da reunião em versão interna. Não inserir senhas reais em PDF externo.

### Usuário demo

| Campo | Valor |
|-------|-------|
| E-mail | `[PREENCHER ANTES DA REUNIÃO]` |
| Senha | `[NÃO INSERIR EM PDF FINAL OU INSERIR SOMENTE EM VERSÃO INTERNA]` |
| Observação | Usar conta previamente testada, com saldo/histórico preparado. Validar login, dashboard e gameplay na véspera. |

### Admin demo

| Campo | Valor |
|-------|-------|
| E-mail | `[PREENCHER ANTES DA REUNIÃO]` |
| Senha | `[NÃO INSERIR EM PDF FINAL OU INSERIR SOMENTE EM VERSÃO INTERNA]` |
| Observação | Testar login e páginas principais antes da reunião. Preferir visualização read-only quando possível. |

---

## 7. Links que devem estar abertos antes da reunião

Abrir em abas separadas (ou favoritos) **antes** do início:

1. https://www.goldeouro.lol — Player / MVP  
2. https://admin.goldeouro.lol — Painel administrativo  
3. https://goldeouro-backend-v2.fly.dev/health — Health check  
4. https://goldeouro-backend-v2.fly.dev/meta — Baseline SHA  
5. Documentos PDF principais (dossiê executivo, certificação V1)  
6. Runbook de emergência (`docs/audits/V1-X3-EMERGENCY-DEMO-RUNBOOK.md` ou cópia em PDF)  
7. Checklist da demo (`docs/audits/V1-X3-DEMO-CRITICAL-CHECKLIST.md` ou equivalente em `04-DEMO/`)

---

## 8. O que mostrar na reunião

| Área | Conteúdo sugerido |
|------|-------------------|
| Player | Login, dashboard, navegação MVP |
| Dashboard | Saldo, histórico, status da conta demo |
| Gameplay | Fila, chutes, experiência core |
| Gol | Momento de conversão / recompensa (conforme roteiro) |
| Admin | Usuários, relatórios, visão operacional (sem dados de terceiros) |
| Health | `status: ok`, dependências conectadas |
| Meta | SHA alinhado à baseline certificada |
| Webhooks 401 | POST sem HMAC → 401 (prova de hardening, read-only) |
| Certificação V1 | Score 88/100, CERTIFIED WITH RESSALVAS |
| Auditorias | Relatórios H3/V1.x, integridade financeira (PDF/slides) |
| Roadmap | Evolução pós-V1, itens residuais documentados |

---

## 9. O que NÃO mostrar ao vivo

- Saque real via Mercado Pago  
- Stress test ou carga artificial em produção  
- Debug verboso, logs com PII ou tokens  
- Banco de dados aberto com dados sensíveis de usuários reais  
- Secrets (`.env`, API keys, service role)  
- Painel Mercado Pago com credenciais/chaves visíveis  
- Supabase com credenciais/chaves visíveis  
- Testes improvisados de produção (deploy, patch SQL, alteração de saldo sem processo)

---

## 10. Checklist rápido antes da reunião

- [ ] Player abre (www ou app)  
- [ ] Admin abre  
- [ ] `/health` retorna OK  
- [ ] `/meta` mostra SHA `a83c3cf…` (commit completo na baseline)  
- [ ] Internet principal estável  
- [ ] 4G backup disponível (hotspot)  
- [ ] Conta demo testada (login + fluxo principal)  
- [ ] Admin demo testado (login + páginas principais)  
- [ ] PDF principal aberto (dossiê / certificação)  
- [ ] Runbook de emergência aberto  
- [ ] Celular com PWA instalado ou link pronto  
- [ ] Vídeo/prints backup preparados (Plano B)

---

## 11. Plano B operacional

| Cenário | Ação |
|---------|------|
| Player falhar | Usar vídeo gravado ou prints da jornada preparados |
| Admin falhar | Mostrar PDF/dossiê técnico-executivo com capturas de telas |
| Internet falhar | Alternar para 4G (hotspot); manter `/health` e `/meta` no celular se necessário |
| PIX não confirmar ao vivo | Mostrar histórico de depósito já aprovado na conta demo |
| Saque for perguntado | Explicar que **saque real não será executado ao vivo** por governança e risco operacional; apresentar documentação de payout/hardening (V1-1F, V1-1E) |

---

## 12. Veredito operacional

A **V1 está operacionalmente certificada**, com **baseline congelada** (`a83c3cf…`, Fly v461, bundle `index-B6M2smS9.js`) e **pronta para reunião executiva**, abertura controlada e expansão futura, **mantendo ressalvas documentadas** (score 88/100, CERTIFIED WITH RESSALVAS, maturidade semi-autonomous, classificação GOVERNED).

Este documento não autoriza alterações em produção durante a reunião. Qualquer mudança em runtime, banco ou integrações financeiras exige processo formal fora do escopo da demo executiva.

---

## Referências cruzadas (repositório)

| Tema | Caminho sugerido |
|------|------------------|
| Plano de demo ao vivo | `docs/executive/V1-FINAL-LIVE-DEMONSTRATION-PLAN.md` |
| Veredito operacional | `docs/executive/V1-FINAL-OPERATIONAL-VERDICT.md` |
| Certificação oficial | `docs/certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md` |
| Runbook emergência demo | `docs/audits/V1-X3-EMERGENCY-DEMO-RUNBOOK.md` |
| Pacote final-delivery | `docs/executive/final-delivery/README.md` |

---

*Documento gerado para o pacote `final-delivery/05-OPERATIONS`. Sem secrets, senhas ou credenciais reais.*
