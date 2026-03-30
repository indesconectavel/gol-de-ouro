# CONTEXTO CRÍTICO — NÃO PERDER

**Objetivo:** continuidade do projeto sem regressão nem confusão de entrypoints.  
**Data:** 2026-03-29  

---

## 1. Como o sistema realmente funciona

Um **único processo Node** (`server-fly.js`) expõe a API: autenticação JWT, perfil, criação de PIX e webhook, reconcile, chute com **lotes e contador em memória**, saque, health/monitoring, **`/api/admin/*`** (router dedicado) e **`/api/analytics`**. O **Supabase** guarda utilizadores, chutes, pagamentos PIX, saques e métricas. O **Mercado Pago** confirma pagamentos; o servidor só credita quando a linha existe em `pagamentos_pix` e o estado no MP é aprovado, com caminho idempotente documentado nas auditorias financeiras.

---

## 2. Qual arquivo é a fonte real de produção

| Artefacto | Papel |
|-----------|--------|
| **`server-fly.js`** | API real montada no deploy Fly documentado. |
| **`Dockerfile`** | `CMD ["node", "server-fly.js"]` — confirma o binário. |
| **`package.json`** | `"main"` e `"start"` → `server-fly.js`. |

Qualquer outro ficheiro `server-*.js` ou script de arranque **não** substitui estes três sem **decisão explícita** e atualização de documentação.

---

## 3. Quais arquivos são legado

- **Routers** em `routes/` que **não** são `require`/`use` em `server-fly.js` na configuração auditada (ex.: `paymentRoutes`, `gameRoutes` como conjunto alternativo ao monólito).  
- **Controllers** duplicados ou paralelos (ex.: fluxos de pagamento fora do caminho Fly) — úteis só como histórico se não montados.  
- **Outros entrypoints** (`server-fly-deploy.js`, etc.) — risco R13 na matriz de riscos.  
- **Documentos** antigos em `docs/relatorios/` com prefixos `BLOCO-*`, `CIRURGIA-*`, `EXEC-HOJE-*` — **contexto histórico**; a síntese viva está no **relatório mestre** e nos documentos V1 datados 2026-03-29.

---

## 4. Quais contratos são oficiais

- **Jogador:** JWT em rotas protegidas; endpoints descritos em `MAPA-ENDPOINTS-V1.md` (alinhados ao `server-fly.js`).  
- **Admin:** **`/api/admin/*`** + header **`x-admin-token`**; implementação em `routes/adminApiFly.js`.  
- **Webhook Mercado Pago:** `POST` no path documentado no mapa de endpoints; validação HMAC quando `MERCADOPAGO_WEBHOOK_SECRET` + `NODE_ENV=production`.  
- **Analytics:** ingestão mínima em `routes/analyticsIngest.js` sob `/api/analytics`.  

---

## 5. Quais decisões são estruturais

- **Saldo único** em `usuarios.saldo` para jogo e financeiro.  
- **PIX** sem crédito automático sem linha local (órfão = operação manual).  
- **Uma instância** para coerência de lotes/contador (V1).  
- **Webhook responde cedo** — reconciliar e monitorizar.  
- **RPC financeira** preferida quando disponível no Supabase.

---

## 6. Quais pontos seriam perigosos mexer sem auditoria

- **`server-fly.js`** — qualquer alteração em webhook, crédito PIX, chute, contador ou ordem de middleware.  
- **`utils/webhook-signature-validator.js`** e fluxo de crédito PIX.  
- **`database/`** — constraints UNIQUE, RPCs, migrações.  
- **`Dockerfile` / `fly.toml` / `CMD`** — trocar o processo arranque.  
- **Escala** da app Fly para >1 máquina **sem** novo desenho.  
- **Contratos** de resposta JSON usados pelo player sem coordenação front/back.

---

## 7. O que sempre deve ser lido antes de continuar o projeto

1. **`docs/LEIA-ANTES-DE-CONTINUAR-O-PROJETO.md`**  
2. **`docs/PROJETO-GOLDEOURO-V1-OFICIAL.md`**  
3. **`docs/relatorios/RELATORIO-MESTRE-V1-GOLDEOURO.md`**  
4. **`docs/MAPA-OFICIAL-VS-LEGADO-GOLDEOURO.md`**  
5. **`docs/relatorios/CHECKLIST-GO-NO-GO-V1.md`** e **`MATRIZ-RISCOS-V1.md`**  

---

*Fim do contexto crítico.*
