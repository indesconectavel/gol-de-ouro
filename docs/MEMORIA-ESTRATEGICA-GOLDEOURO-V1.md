# MEMÓRIA ESTRATÉGICA — GOL DE OURO V1

**Objetivo:** preservar decisões e posturas já fixadas nas auditorias e relatórios mestres, **sem reabrir** discussões encerradas.  
**Data:** 2026-03-29  
**Fonte de verdade complementar:** `docs/relatorios/RELATORIO-MESTRE-V1-GOLDEOURO.md`, `MATRIZ-RISCOS-V1.md`, `CHECKLIST-GO-NO-GO-V1.md`.

---

## 1. Decisões técnicas mais importantes

- **Entrada de produção única (Fly):** `server-fly.js` — rotas críticas **inline**; não assumir que `routes/paymentRoutes.js`, `routes/gameRoutes.js` ou outros routers legados estão montados no mesmo processo.  
- **Dados:** Supabase como backend de dados; **fonte de verdade de saldo** em `usuarios.saldo`.  
- **PIX:** Mercado Pago REST; persistência em `pagamentos_pix`; **webhook** com resposta antecipada **200** e crédito após **GET** ao MP; **reconcile** periódico para pendentes.  
- **Idempotência e atomicidade financeira:** função central de crédito; **RPC** `creditar_pix_aprovado_mp` (e saque atómico) quando aplicadas no Supabase — preferidas ao fallback JS fragmentado.  
- **Motor de jogo V1:** **lotes em memória**, **contador global**, aposta fixa **R$ 1**, Gol de Ouro alinhado ao contador (múltiplos de 1000 no desenho documentado).  
- **Admin:** API oficial sob **`/api/admin/*`** com header **`x-admin-token`** (`ADMIN_TOKEN`, mínimo 16 caracteres).  
- **Topologia:** **uma instância** Node para coerência de lotes/contador/idempotência em memória, salvo decisão explícita documentada de aceitar risco de escala horizontal.

---

## 2. Decisões de produto

- **V1** focada em **fluxo completo** jogador: registo/login, saldo, PIX, chute, prémios no desenho atual, saque.  
- **Sem** motor económico server-side paralelo ao núcleo (retenção/gamificação avançada) como pilar da V1 nas auditorias consolidadas.  
- **Classificação executiva fixada:** **PRONTO COM RESSALVAS** (operacional e configuração), desde que premissas de topologia e secrets sejam cumpridas.

---

## 3. Decisões operacionais

- **Deploy:** seguir `CHECKLIST-DEPLOY-FLY-MP-V1.md` e `STATUS-PRONTIDAO-DEPLOY-V1.md`; validar com `SMOKE-TEST-PRODUCAO-V1.md`.  
- **Secrets:** `MERCADOPAGO_WEBHOOK_SECRET` obrigatório em ambiente **público** para GO final; `BACKEND_URL` explícita por ambiente; `JWT_SECRET`, Supabase, `ADMIN_TOKEN` fortes.  
- **Incidentes:** runbook para **PIX órfão**, falhas de webhook, saldo e quedas — ver `RUNBOOK-OPERACIONAL-V1.md`.  
- **Schema:** verificar **UNIQUE** em `payment_id` e aplicação de RPCs/migrações em produção antes de tráfego real.

---

## 4. O que foi propositalmente aceito como limitação da V1

- Estado de **lotes e mapas de idempotência só em RAM** (perda em restart).  
- **Contador global** com risco documentado de desvio face à persistência em falhas específicas.  
- **Webhook 200** antes do crédito — recuperação via MP + reconcile.  
- **Sem** recuperação automática no código para **órfão MP** (playbook manual).  
- **Superfícies públicas** amplas (health, monitoring, métricas) — mitigação por infra/decisão futura.  
- **Painel admin React:** legado e fragmentação histórica de clientes HTTP — API backend considerada alinhada.

---

## 5. O que NÃO deve ser reaberto sem necessidade real

- Troca do **entrypoint** de produção sem auditoria (`Dockerfile` / `start`).  
- **Escala horizontal** do processo de jogo sem novo desenho de estado partilhado.  
- Remoção de **HMAC** do webhook em produção pública.  
- Crédito PIX **sem** linha em `pagamentos_pix` (comportamento intencional: não creditar órfão automático).  
- Reintrodução de **fila** como motor principal se a V1 consolidada é **lotes** (histórico documentado em relatórios fila vs lotes).

---

## 6. O que já foi resolvido e não deve gerar retrabalho

- **Mapa de endpoints** reais em `server-fly.js` documentado (`MAPA-ENDPOINTS-V1.md`).  
- **Inventário de variáveis** (`INVENTARIO-ENV-V1.md`).  
- **Auditorias READ-ONLY** por blocos A, B, D, G, I, J e síntese no relatório mestre.  
- **Normalização financeira** e caminhos de webhook/reconcile descritos nas auditorias de março 2026.  
- **Contrato admin** oficial em `adminApiFly` vs rotas `/admin/*` não usadas pelo Fly.

---

## 7. Próximas evoluções naturais pós-lançamento

- Endurecimento de **observabilidade** e alertas sobre pendentes PIX, divergência contador/chutes e taxas de erro de webhook.  
- **Uniformização** do cliente admin (uma base URL, um padrão de `x-admin-token`, build `VITE_*` alinhado).  
- Revisão de **exposição** de health/monitoring por rede ou auth mínima.  
- Se a escala exigir: **estado de jogo partilhado** ou sticky sessions com modelo explícito — fora do desenho V1 atual.  
- Melhorias de **UX/sessão** no player (logout, formato de `user`) sem mudar contratos sem versão.

---

*Fim da memória estratégica V1.*
