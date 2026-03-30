# LEIA ANTES DE CONTINUAR O PROJETO

**Objetivo:** retomada rápida com contexto preservado.  
**Data:** 2026-03-29  

---

## 1. Qual é o estado atual do Gol de Ouro

**V1** com núcleo técnico **documentado e auditado em modo READ-ONLY**: monólito Express **`server-fly.js`**, Supabase, Mercado Pago (PIX + webhook + reconcile), motor de jogo por **lotes em memória** e **contador global**, saques, API admin em **`/api/admin/*`**, player e admin em subpastas. A classificação consolidada é **PRONTO COM RESSALVAS** — ou seja, pronto para **go-live** quando infraestrutura, secrets e testes reais forem aplicados conforme checklists.

---

## 2. Quais documentos devem ser lidos primeiro

| Ordem | Documento |
|-------|-----------|
| 1 | `docs/CONTEXTO-CRITICO-NAO-PERDER.md` |
| 2 | `docs/PROJETO-GOLDEOURO-V1-OFICIAL.md` |
| 3 | `docs/relatorios/RELATORIO-MESTRE-V1-GOLDEOURO.md` |
| 4 | `docs/MAPA-OFICIAL-VS-LEGADO-GOLDEOURO.md` |
| 5 | `docs/relatorios/CHECKLIST-GO-NO-GO-V1.md` |

Para deploy imediato, acrescentar: `CHECKLIST-DEPLOY-FLY-MP-V1.md`, `SMOKE-TEST-PRODUCAO-V1.md`, `RUNBOOK-OPERACIONAL-V1.md`.

---

## 3. Quais riscos já foram mapeados

Ver **`docs/relatorios/MATRIZ-RISCOS-V1.md`** (R1–R18): PIX órfão, multi-instância, webhook sem secret, `BACKEND_URL`, estado em memória do engine, superfície pública, admin token, bootstrap, legado admin, entrypoints duplicados, analytics aberto, debug token, UNIQUE `payment_id`, sessão player, saque/RPC.

---

## 4. O que está pronto

- Desenho e fluxos **descritos** no relatório mestre.  
- **Mapa de endpoints** e **inventário de env**.  
- **Runbook** e **matriz de riscos**.  
- **Pacote documental** em `docs/` (oficial, memória, dossiê, mapa legado, este ficheiro).  
- **Índice mestre** em `docs/relatorios/INDICE-MESTRE-GOLDEOURO-V1.md`.

---

## 5. O que depende só de deploy

- Conta e **máquina** (ex.: Fly) com `Dockerfile` atual.  
- **Secrets** no painel do host e variáveis listadas no inventário.  
- **Supabase** com schema/RPC/constraints alinhados ao repo.  
- **Mercado Pago** com URL pública correta e webhook.  
- **Build** do player e admin com URLs e tokens corretos.

---

## 6. Como retomar o projeto sem perder contexto

1. Ler os cinco documentos da secção 2.  
2. Abrir **`server-fly.js`** apenas para **confirmar** montagem de rotas (não “adivinhar” por `routes/` soltos).  
3. Comparar ambiente real com **`INVENTARIO-ENV-V1.md`**.  
4. Executar **`CHECKLIST-GO-NO-GO-V1.md`** e assinar itens.  
5. Usar **`INDICE-MESTRE`** para mergulhar em auditorias antigas só se precisar de detalhe forense.

---

## 7. Próximo passo natural quando houver orçamento

1. Provisionar infraestrutura e Supabase de produção.  
2. Aplicar SQL necessário (RPC, UNIQUE, migrações referidas na documentação).  
3. Configurar secrets e fazer deploy com **`CHECKLIST-DEPLOY-FLY-MP-V1.md`**.  
4. Correr **`SMOKE-TEST-PRODUCAO-V1.md`**.  
5. Monitorizar com base no **runbook** e na matriz de riscos; só então tráfego real.

---

*Fim — boa retomada.*
