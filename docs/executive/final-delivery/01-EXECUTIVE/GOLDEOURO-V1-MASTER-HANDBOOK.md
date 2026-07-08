# GOL DE OURO V1

## Master Handbook Institucional

**Status:** Certified With Ressalvas  
**Score:** 88/100  
**Classificação:** GOVERNED  
**Maturidade:** Semi-autonomous  
**Baseline:** a83c3cf · Fly v461 · index-B6M2smS9.js  
**Data:** 19 de maio de 2026  

**Audiência:** Sócios, investidores qualificados e liderança executiva  
**Classificação de uso:** Institucional — não substitui assessoria jurídica, fiscal ou de investimento  
**Modo de emissão:** documentação consolidada · produção, banco, deploy e código funcional **não alterados**

---

# 1. Visão Executiva

O **Gol de Ouro** é uma plataforma de entretenimento digital com economia real: o usuário joga penáltis com saldo em reais, deposita via **PIX** (Mercado Pago), paga por chute e pode sacar quando elegível. O produto entrega como **PWA** (Progressive Web App), priorizando mobile e a conversão rápida entre depósito e gameplay.

A **V1** está em **produção real** — domínio `goldeouro.lol`, backend em Fly.io, frontend em Vercel e dados financeiros em Supabase PostgreSQL. O encerramento oficial da linha V1 ocorreu em **19/05/2026**, com certificação consolidada na missão **V1.6** e auditoria suprema **V1.FINAL**.

A V1 é uma **baseline operacional certificada**: commit, release Fly e bundle do player congelados como referência única para deploy, auditoria e herança da futura **Engine V2**. Qualquer alteração em produção que diverja dessa baseline exige novo ciclo formal de certificação.

A plataforma é **governada**, não apenas publicada: runbooks documentados, fluxo de incidentes (P0–P3), activation gates pré-deploy, verificação contínua read-only e trilha de auditorias reprodutível (V1.1 → V1.6). O veredito **CERTIFIED WITH RESSALVAS** (88/100) reflete maturidade honesta — indicadores críticos de segurança e integridade financeira validados, com ressalvas documentadas e sem promessas de escala enterprise já provada.

A V1 está **pronta para reunião com sócios e investidores**, **abertura controlada** de usuários e **expansão futura** sobre base técnica e operacional auditável — desde que riscos residuais sejam apresentados com transparência e o roadmap pós-certificação (V1.R, monitoramento externo, Engine V2) seja respeitado.

---

# 2. Produto

## Conceito

Jogo de penáltis com saldo real e liquidez PIX. Posicionamento: entretenimento casual de alta frequência, com retenção emocional pelo gameplay e ticket baixo por sessão. A V1 valida um título; a **Engine V2** evolui para plataforma multi-game.

## Jornada do usuário

Cadastro e autenticação → painel com saldo → depósito PIX → fila de penáltis → chutes pagos → histórico e saque quando elegível. A experiência é mobile-first (PWA), sem dependência de app store no MVP.

## Gameplay

O usuário escolhe a direção do chute e recebe resultado (gol, defesa, trave) com impacto no saldo conforme regras do backend. Fila em tempo real, feedback sensorial (áudio, animação) e evento especial **Gol de Ouro** como elemento central da marca. Adequado para demonstração institucional.

## PIX e saldo

Depósito: cobrança PIX → Mercado Pago → webhook → reconciliação → crédito atômico no ledger. Saque: trilha outbound com worker dedicado e taxa documentada. **Ressalva conhecida:** ausência de polling automático pós-pagamento — o usuário pode precisar aguardar ou atualizar manualmente (roadmap V1.R).

## Painel administrativo

Interface administrativa separada do player (Vercel), para operações, logs e suporte — sem exposição das funções críticas ao jogador final.

---

# 3. Arquitetura da Plataforma

A arquitetura adota **runtime como fonte da verdade**: a API expõe o commit em produção; scripts read-only cruzam SHA, release Fly e bundle do player em três camadas. Estado financeiro permanece no PostgreSQL; crédito PIX via RPC atômica; webhooks idempotentes e fail-closed.

| Camada | Tecnologia | Função |
|--------|------------|--------|
| Player PWA | React / Vite · Vercel | Gameplay, wallet e experiência do jogador (`goldeouro.lol`) |
| Admin | React / TypeScript · Vercel | Operações, logs e suporte |
| Backend Fly | Node.js / Express · Fly.io v461 | API REST, auth, PIX, webhooks, workers |
| Supabase | PostgreSQL + Auth + RLS | Estado persistente, identidade e ledger |
| Mercado Pago | PIX in/out | Pagamentos e notificações |
| GitHub | Repositório + Actions | Versionamento; gates e exemplos de CI |
| Vercel | CDN / deploy | Publicação do player e do admin |

**Validação rápida:** `GET https://goldeouro-backend-v2.fly.dev/meta` → campo `gitCommit` deve coincidir com `a83c3cf`.

---

# 4. Segurança Financeira

A integridade financeira da V1 assenta em ledger auditável, webhooks autenticados, RPC hardened para crédito PIX e trilhas de rollback documentadas. Indicadores P0 (saldo negativo, duplicatas críticas no ledger) estão **ausentes** em produção na certificação V1.6.

## Ledger

Tabela `ledger_financeiro` com unicidade por `(correlation_id, tipo)`. Tipos auditados incluem depósito, saque, taxa, falha de payout e rollback. O ledger é a **fonte contábil** das movimentações críticas.

## Webhooks HMAC

Rotas de depósito e payout exigem assinatura válida do Mercado Pago. Requisições sem assinatura retornam **HTTP 401** — corpo não processado (hardening V1.1F, verificado em produção). Elimina crédito ou saque forjado via HTTP público.

## RPC PIX hardened

Função `claim_and_credit_approved_pix_deposit` (patch M1, V1.1B): crédito atômico, idempotência e proteção contra double-credit. Self-heal documentado sem crédito indevido.

## Rollback e idempotência

Trilhas de `rollback` e `falha_payout` para reversões controladas. Webhooks e RPC projetados para reprocessamento seguro — duplicatas críticas **0** em produção (V1.6).

| Controle | Finalidade | Estado |
|----------|------------|--------|
| Ledger financeiro | Fonte contábil; unicidade por correlação | Ativo · P0 OK |
| Webhooks HMAC | Autenticar origem Mercado Pago | Hardened · 401 live |
| RPC PIX M1 | Crédito atômico e idempotente | Em produção |
| Rollback / falha_payout | Reversão controlada em saques | Documentado |
| Auth + RLS | Identidade e isolamento de dados | Ativo |

---

# 5. Governança Operacional

A V1 evoluiu de auditoria financeira e hardening (V1.1) para observabilidade (V1.2), governança autônoma (V1.3–V1.4), resiliência e ativação (V1.5) e certificação final de produção (V1.6). O resultado é operação **GOVERNED** com maturidade **semi-autônoma**: processos e scripts prontos; alertas externos e CI bloqueante ainda pendentes de ativação.

| Camada | Função | Estado |
|--------|--------|--------|
| Observabilidade | Scripts read-only, relatórios e snapshots de saúde | Ativo (evidência documental) |
| Runbooks | 17+ procedimentos (financeiro, runtime, segurança) | Documentados |
| Activation gates | Pré-deploy: runtime, financeiro, certificação | **REVIEW** — sign-off humano |
| Freeze | Baseline congelada; mudanças exigem gate | Política ativa |
| Certificação | V1.6 + documento oficial de certificação | 88/100 · com ressalvas |

**Observabilidade:** relatórios reprodutíveis em `docs/relatorios/` e snapshots operacionais — não substitui APM enterprise, mas garante trilha auditável.

**Alertas:** matriz P0–P3 definida; canais externos validados em **dry-run** — **não ativados** em produção.

**Runbooks críticos (exemplos):** approved sem ledger, duplicata ledger, falha HMAC, drift de runtime.

---

# 6. Auditorias e Certificações

Consolidação das missões que sustentam o veredito institucional. Detalhamento completo em `docs/relatorios/` e `docs/audits/`.

| Bloco | Escopo | Resultado |
|-------|--------|-----------|
| **V1.1 — Financeiro e hardening** | Ledger (1A), RPC PIX M1 (1B), pós-apply (1C), webhook/reconcile (1D), payout (1E), hardening HMAC (1F), certificação financeira (1G) | Integridade mapeada; RPC ativa; **401** live; PASS com ressalvas |
| **V1.2 — Observabilidade** | Health baseline (2A), alertas (2B), drift/deploy (2C), runbooks/incidentes (2D), verificação contínua (2E) | Runtime alinhado; 17+ runbooks; automação read-only |
| **V1.3–V1.5 — Governança e resiliência** | Governança autônoma (3), confiabilidade externa simulada (4), resilience engine, freeze, gates (5A), CI examples (5B), dry-run alertas (5C), plano monitoramento (5D) | GOVERNED; externos em plano, não live |
| **V1.6 — Certificação final** | Certificação operacional de produção + V1.FINAL | **CERTIFIED WITH RESSALVAS** · 88/100 |
| **V1.X — Produto, financeiro e demo** | Jornada e UX (X1), confiança financeira (X2), prontidão de apresentação (X3) | Gameplay forte; gaps PIX e demo documentados |

---

# 7. Estado Atual da V1

| Item | Estado |
|------|--------|
| Runtime | Certified |
| Financeiro | Hardened |
| Webhooks | Hardened |
| Governança | GOVERNED |
| Maturidade | Semi-autonomous |
| Produto | Pronto com ressalvas |
| Escala massiva | Ainda não validada |

A V1 está **oficialmente encerrada** como linha de produto baseline. Expansão e novos deploys exigem disciplina de gate e renovação de certificação quando aplicável.

---

# 8. Riscos Residuais

Declaração transparente — sem ocultação de dívida conhecida. Nenhum item abaixo constitui bloqueador P0 financeiro ou de segurança webhook, desde que permaneçam estáveis e monitorados conforme runbooks.

| Risco | Status | Tratamento |
|-------|--------|------------|
| 34 approved sem ledger | Backlog legado estável (U1–U4) | Runbook · não crescente em janela recente |
| payout_confirmado = 0 | Coerente com modelo de integração | Documentado · transparência ao investidor |
| Monitoramento externo dry-run | Canais não ativos em produção | Plano V1.5D · ativação pós-reunião |
| Stress test não executado | Escala massiva não provada | Roadmap V2 · crescimento controlado |
| UX PIX sem polling | Ansiedade pós-pagamento | V1.R planejado |
| Gate pré-deploy REVIEW | Sign-off humano obrigatório | Disciplina operacional formal |

---

# 9. Próximos Passos

## Antes da reunião

- Exportar pacote PDF conforme ordem oficial de entrega  
- Validar ambiente de demo e ensaio de apresentação  
- Confirmar backups e snapshots de baseline  
- Revisar Q&A executivo e narrativa de ressalvas  

## Após reunião

- **V1.R:** polling PIX, onboarding, confiança UX, FTU  
- Abertura controlada de usuários com gates e runbooks ativos  
- Métricas reais de cohort, retenção e conversão  
- Captação com transparência sobre score e riscos residuais  

## Futuro

- **Engine V2:** multi-game, módulos desacoplados, contract tests  
- Ativação de monitoramento externo e CI gate bloqueante  
- Stress test e capacity planning antes de escala agressiva  

---

# 10. Conclusão Institucional

A **V1 do Gol de Ouro** encerra-se como **baseline operacional certificada, hardened e governada** — apta para apresentação institucional, **abertura controlada** e servir de fundação à **Engine V2**.

O que a V1 comprovou: produto jogável em produção; integridade financeira nos indicadores P0; webhooks fail-closed; governança madura para time enxuto; rastreabilidade de runtime em três camadas.

O que a V1 não comprovou: escala enterprise; alertas externos em produção; eliminação total do backlog legado no ledger; maturidade comercial em massa.

Para stakeholders, **CERTIFIED WITH RESSALVAS** é classificação de **maturidade honesta** — superior a promessas irreais de “tudo verde” sem evidência. A V1 está pronta para reunião, demo e evolução disciplinada.

---

# Apêndice A — Baseline Técnica

| Parâmetro | Valor |
|-----------|-------|
| Commit runtime | `a83c3cffcc998ed3d1bd8d2e88619a9b03afb634` (`a83c3cf`) |
| Fly.io release | **v461** |
| Aplicação Fly | `goldeouro-backend-v2` |
| Bundle player (Vercel) | `index-B6M2smS9.js` |
| API produção | `https://goldeouro-backend-v2.fly.dev` |
| Domínio principal | `goldeouro.lol` |
| Score consolidado | **88 / 100** |
| Certificação | **CERTIFIED WITH RESSALVAS** · GOVERNED · Semi-autonomous |

Referência detalhada: `docs/certification/V1-BASELINE-CERTIFIED.md`

---

# Apêndice B — Documentos Relacionados

| Documento | Caminho |
|-----------|---------|
| Executive Summary | `docs/executive/final-delivery/01-EXECUTIVE/V1-EXECUTIVE-SUMMARY.md` |
| Executive QA | `docs/executive/final-delivery/08-QA/V1-EXECUTIVE-QA.md` |
| Access Operations | `docs/executive/final-delivery/05-OPERATIONS/V1-ACCESS-OPERATIONS.md` |
| Official Certification | `docs/certification/GOLDEOURO-V1-OFFICIAL-CERTIFICATION.md` |
| Demo Flow (ensaio de apresentação) | `docs/executive/final-delivery/04-DEMO/V1-PRESENTATION-REHEARSAL-FLOW.md` |

Índice completo de entrega: `docs/executive/final-delivery/01-EXECUTIVE/V1-OFFICIAL-DELIVERY-INDEX.md`

---

*Handbook V1 — emissão documental · 19/05/2026. Produção, banco, deploy e código funcional intactos.*
