# GOL DE OURO V1 — Demo Environment Checklist

**Documento:** checklist operacional pré-reunião executiva  
**Público:** apresentador principal, co-apresentador técnico, operação  
**Data de referência:** 2026-05-19  
**Modo:** somente documentação — **produção, banco, deploy e código funcional não são alterados por este artefato**

**Companheiros:** [V1-PRESENTATION-REHEARSAL-FLOW.md](V1-PRESENTATION-REHEARSAL-FLOW.md) · [V1-DEMO-CONTINGENCY-PLAN.md](V1-DEMO-CONTINGENCY-PLAN.md) · [V1-DEMO-RUNTIME-VALIDATION.md](V1-DEMO-RUNTIME-VALIDATION.md) · [../05-OPERATIONS/V1-ACCESS-OPERATIONS.md](../05-OPERATIONS/V1-ACCESS-OPERATIONS.md)

---

## Como usar

Marque cada item antes da reunião. Em caso de falha em T-2h ou T-30min, consulte o plano de contingência — **não improvise correções em produção** na frente da sala.

**Baseline de validação:** SHA `a83c3cf` · Fly v461 · bundle `index-B6M2smS9.js` · score **88/100**

---

## T-24h (véspera ou dia anterior)

Verificar **todos** os itens abaixo. Registrar evidência (screenshot ou nota com horário).

| # | Item | O que verificar | OK |
|---|------|-----------------|----|
| 1 | **Player** | `https://www.goldeouro.lol` ou `https://app.goldeouro.lol` carrega; login demo funciona | ☐ |
| 2 | **Admin** | `https://admin.goldeouro.lol` — login operacional; dashboard sem erro 5xx | ☐ |
| 3 | **`/health`** | `GET https://goldeouro-backend-v2.fly.dev/health` → `status: ok`, DB e MP conectados | ☐ |
| 4 | **`/meta`** | `gitCommit` = `a83c3cffcc998ed3d1bd8d2e88619a9b03afb634` | ☐ |
| 5 | **Internet** | Link principal estável; velocidade adequada para compartilhamento de tela | ☐ |
| 6 | **Contas demo** | Credenciais testadas; saldo conhecido; conta **reserva** preparada | ☐ |
| 7 | **PDFs** | Certificação V1, dossiê executivo e heatmap financeiro salvos **offline** (Downloads) | ☐ |
| 8 | **Hotspot** | Celular com dados ativos; hotspot testado com laptop de backup | ☐ |
| 9 | **Celular** | Bateria ≥ 80%; Mercado Pago instalado **somente se** PIX live estiver no roteiro | ☐ |
| 10 | **PWA** | Ícone/abertura PWA no celular (se demo mobile prevista) | ☐ |
| 11 | **Vídeo backup** | Gravação 30–60s de gol + dashboard (build certificada) em pasta local | ☐ |
| 12 | **Bateria** | Laptop ≥ 90% ou carregador conectado durante toda a reunião | ☐ |
| 13 | **Navegador limpo** | Perfil dedicado ou aba anônima; extensões desativadas; cache não corrompido | ☐ |

**Critério de go/no-go T-24h:** se `/meta` SHA divergir ou `/health` não estiver ok, **escalar para operação** antes de confirmar a reunião — não “resolver na hora H”.

---

## T-2h (duas horas antes)

| # | Item | Ação | OK |
|---|------|------|----|
| 1 | **Login player** | Entrar na conta demo principal; confirmar saldo e rota `/game` | ☐ |
| 2 | **Login admin** | Entrar no painel; abrir dashboard e relatório financeiro (read-only) | ☐ |
| 3 | **Abas necessárias** | Player, admin, `/health`, `/meta`, PDF certificação, runbook emergência | ☐ |
| 4 | **Testar gameplay** | 1 gol + 1 chute; sem travamento; som/overlay ok | ☐ |
| 5 | **Testar dashboard** | Saldo, histórico PIX (pelo menos 1 `approved` visível) | ☐ |
| 6 | **Preparar PDFs** | Abrir em visualizador local (não depender só de link cloud) | ☐ |

**Opcional técnico:** executar curl 401 webhook (ver [V1-DEMO-RUNTIME-VALIDATION.md](V1-DEMO-RUNTIME-VALIDATION.md)) e anotar código HTTP.

---

## T-30min (trinta minutos antes)

| # | Item | Ação | OK |
|---|------|------|----|
| 1 | **Reiniciar navegador** | Fechar todas as abas; reabrir apenas as da demo | ☐ |
| 2 | **Ativar não perturbe** | Celular e desktop; notificações silenciadas | ☐ |
| 3 | **Testar áudio** | Microfone e saída; volume moderado para sala | ☐ |
| 4 | **Testar compartilhamento de tela** | Meet/Zoom/Teams — resolução legível para texto e jogo | ☐ |
| 5 | **Abrir PDFs principais** | Certificação 88/100; sumário executivo; opcional heatmap financeiro | ☐ |
| 6 | **Abrir runbook emergência** | [V1-DEMO-CONTINGENCY-PLAN.md](V1-DEMO-CONTINGENCY-PLAN.md) em aba dedicada | ☐ |

**Segunda sessão de navegador (recomendado):** aba anônima pré-logada como conta reserva — ativar somente se a principal falhar.

---

## DURANTE a reunião

| Regra | Detalhe |
|-------|---------|
| **Seguir roteiro** | Usar [V1-PRESENTATION-REHEARSAL-FLOW.md](V1-PRESENTATION-REHEARSAL-FLOW.md); respeitar tempos por bloco |
| **Não improvisar** | Sem features não ensaiadas; sem “vou mostrar rapidinho” fora do script |
| **Não abrir secrets** | Sem `.env`, Supabase, tokens MP, logs com PII |
| **Não executar saque real** | Formulário de saque pode ser mostrado; **não submeter** |
| **Não fazer stress test** | Sem carga artificial, flood de webhook ou múltiplos PIX simultâneos |

**Papel do co-apresentador:** monitorar chat, cronômetro e plano B; assumir compartilhamento se rede cair.

---

## PÓS-REUNIÃO (até 24h)

Registrar em documento interno (ata ou template de feedback):

| # | Registro | Responsável | Prazo |
|---|----------|-------------|-------|
| 1 | **Feedback** | Reações da sala (produto, confiança, clareza) | 24h |
| 2 | **Dúvidas** | Perguntas sem resposta satisfatória | 24h |
| 3 | **Riscos** | Objeções repetidas (legal, financeiro, escala) | 24h |
| 4 | **Oportunidades** | Interesse em captação, parceria, piloto | 24h |
| 5 | **Próximos passos** | Envio de pacote due diligence, segunda call, abertura controlada | 48h |

**Envio recomendado pós-call:** pacote `08-QA` + certificação oficial + relatórios financeiros referenciados na reunião.

---

## Referência rápida de URLs

| Ambiente | URL |
|----------|-----|
| Player | https://www.goldeouro.lol |
| Admin | https://admin.goldeouro.lol |
| Health | https://goldeouro-backend-v2.fly.dev/health |
| Meta | https://goldeouro-backend-v2.fly.dev/meta |

---

## Confirmação de escopo

Este checklist **não** altera produção, banco de dados, deploy nem código funcional. É artefato operacional exclusivo para preparação da reunião executiva V1.
