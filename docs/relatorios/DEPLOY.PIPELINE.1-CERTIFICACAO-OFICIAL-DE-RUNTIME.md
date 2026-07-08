# DEPLOY.PIPELINE.1 — Certificação Oficial de Runtime

**Projeto:** Gol de Ouro™ V1  
**Engine:** Indesconectável Payment Engine™  
**Versão:** DEPLOY.PIPELINE.1  
**Data:** 02/07/2026  
**Modo:** AUDITORIA READ-ONLY DE RUNTIME  
**Auditor:** Agente automatizado (somente leitura — nenhum deploy, secret ou código alterado)

---

## Resumo Executivo

Auditoria read-only executada em **02/07/2026 ~17:15 UTC** cobrindo GitHub, Fly.io, Vercel (Player/Admin), bundles publicados, cache/PWA e consistência funcional.

### Conclusão

| Camada | Sincronizada? |
|--------|:-------------:|
| Backend Fly (Payment Engine / PIX OUT) | ✅ Sim |
| GitHub HEAD vs Fly base | ✅ Sim (`f21f310` / `f21f310-p5pixout`) |
| UX homologada 5A/5B no Git | ❌ Não (alterações locais não commitadas) |
| Player Vercel vs código homologado | ❌ Não |
| Admin Vercel vs código homologado | ❌ Não |
| Runtime financeiro vs runtime visual | ❌ Não |

### Veredito Final

# FAIL — DIVERGÊNCIA DE RUNTIME DETECTADA

O backend financeiro está atualizado e operando Asaas PIX IN/OUT em produção, porém **os frontends publicados na Vercel executam bundles antigos** que não refletem as melhorias homologadas em ASAAS.PIPELINE.5A e ASAAS.PIPELINE.5B. A homologação final do PIX OUT **não deve prosseguir** até sincronização completa.

---

## 1. Inventário GitHub

| Item | Valor |
|------|--------|
| **Branch** | `chore/f2-4e-2-mp-log` |
| **HEAD** | `f21f310eb162bf5bb8c0dc08f34f66f48bfaa328` |
| **Commit (short)** | `f21f310` |
| **Autor** | Fred S. Silva \<indesconectavel@gmail.com\> |
| **Data** | 2026-07-01 13:39:29 -0300 |
| **Mensagem** | `docs(brand): PE.BRAND.1-3 IP formalization and INPI trademark plan` |
| **Tag recente** | `payment-engine-v1-certified` (entre outras) |
| **Status** | **Centenas de arquivos modificados/não rastreados** |

### Alterações UX pendentes de commit (amostra crítica)

| Arquivo | Estado |
|---------|--------|
| `goldeouro-player/src/pages/Pagamentos.jsx` | `M` (+181/-172 linhas vs HEAD) |
| `goldeouro-player/src/pages/Withdraw.jsx` | `M` |
| `goldeouro-player/src/pages/Privacy.jsx` | `M` |
| `goldeouro-admin/src/pages/SaqueUsuarios.jsx` | `M` (submodule admin: `4eda315`) |

### Respostas Fase 1

| Pergunta | Resposta |
|----------|----------|
| Qual commit deve estar em produção? | Backend: `f21f310-p5pixout` (Fly v541). Frontends: **ainda não existe commit publicado** com UX 5A/5B. |
| Existem alterações não publicadas? | **Sim** — UX financeira 5A/5B apenas local; não commitada nem deployada. |
| Existe código pendente? | **Sim** — working tree sujo + builds locais não publicados. |

---

## 2. Inventário Fly

### Releases recentes

| VERSION | STATUS | DATA (relativa à auditoria) |
|---------|--------|----------------------------|
| **v541** | complete | ~1h21m |
| v540 | complete | ~1h23m |
| v539 | complete | ~1h50m |
| v538 | complete | ~1h54m |
| v537 | complete | ~2h20m |

### Status operacional

| Item | Valor |
|------|--------|
| **App** | `goldeouro-backend-v2` |
| **Release ativa** | **v541** |
| **Image** | `goldeouro-backend-v2:deployment-01KWHRFQXYSYMTKW0H6NNY16B2` |
| **Machine app** | `080e207b071048` — started, checks passing |
| **Machine payout_worker** | `d894655b5114e8` — stopped |
| **Hostname** | `goldeouro-backend-v2.fly.dev` |

### `/health` (2026-07-02T17:15:07Z)

```json
{
  "status": "ok",
  "version": "1.2.1",
  "database": "connected",
  "paymentEngine": {
    "paymentProvider": "asaas",
    "payoutProvider": "asaas",
    "asaasEnv": "production",
    "asaasProductionEnabled": true,
    "pixOut": {
      "productionHttpEnabled": true,
      "productionBlockReason": null
    }
  }
}
```

### `/meta`

```json
{
  "gitCommit": "f21f310-p5pixout",
  "environment": "production",
  "paymentEngine": { "... asaas production, pixOut enabled ..." }
}
```

### Matriz Fly

| Item | Esperado | Runtime | Status |
|------|----------|---------|--------|
| Release | v541 (PIX OUT wave) | v541 | ✅ |
| GIT_COMMIT | `f21f310-p5pixout` | `f21f310-p5pixout` | ✅ |
| paymentProvider | asaas | asaas | ✅ |
| payoutProvider | asaas | asaas | ✅ |
| asaasEnv | production | production | ✅ |
| pixOut.productionHttpEnabled | true | true | ✅ |
| Base commit | f21f310 | f21f310 (+ tag deploy) | ✅ |

---

## 3. Inventário Vercel

### Player — `https://www.goldeouro.lol`

| Item | Valor |
|------|--------|
| HTTP | 200 |
| Bundle JS publicado | `/assets/index-B6M2smS9.js` |
| Bundle CSS publicado | `/assets/index-D7hr6dPE.css` |
| `x-vercel-cache` | HIT |
| `Cache-Control` (HTML) | `public, max-age=0, must-revalidate` |
| Service Worker | `sw.js` — 3.782 bytes |
| PWA | `registerSW.js` presente |

### Admin — `https://admin.goldeouro.lol`

| Item | Valor |
|------|--------|
| HTTP | 200 |
| Bundle JS publicado | `/assets/index-490acf3c.js` |
| Bundle CSS publicado | `/assets/index-c780957b.css` |
| `x-vercel-cache` | HIT |
| `Cache-Control` (HTML) | `no-cache, no-store, must-revalidate` |
| Service Worker | `sw.js` — 2.921 bytes |

### Build local (não publicado — ASAAS.PIPELINE.5B)

| Projeto | Bundle JS local | Bundle CSS local |
|---------|-----------------|------------------|
| Player | `index-9r2ds_AP.js` | `index-DllCypXI.css` |
| Admin | `index-488e6752.js` | `index-27e8d665.css` |

**Hashes divergentes** em ambos os frontends → deploy local **não** corresponde ao publicado.

### GitHub Actions — último deploy frontend

| Workflow | Último run bem-sucedido | Data |
|----------|-------------------------|------|
| `frontend-deploy.yml` | PR #94 merge `main` | **2026-05-17** |

**Existe deploy pendente?** **Sim** — nenhum deploy Vercel via CI desde 17/05/2026; UX 5A/5B nunca foi publicada.

---

## 4. Inventário Runtime

### Evidências por string no bundle JS (produção vs local 5B)

#### Player

| Marcador UX | Produção (`B6M2smS9`) | Local 5B (`9r2ds_AP`) |
|-------------|:---------------------:|:---------------------:|
| `15e3` (polling 15s) | ❌ | ✅ |
| `complete seus dados cadastrais` | ❌ | ✅ |
| `CPF ou CNPJ` (campo saque) | ✅ | ❌ |
| `qr_code_base64` | ✅ | ✅ |
| `scrollIntoView` | ❌ | ✅ |
| `Recarregar Saldo` | ✅ | ❌ |
| `Mercado Pago` | ✅ | ❌ |
| `Garantir` (texto) | ✅* | ✅ |

\*`Garantir` presente em produção provavelmente no contexto do jogo, não no botão de pagamento homologado.

#### Admin

| Marcador UX | Produção (`490acf3c`) | Local 5B (`488e6752`) |
|-------------|:---------------------:|:---------------------:|
| `Aprovar e Enviar PIX` | ✅ | ✅ |
| `Marcar como Pago Manualmente` | ❌ | ✅ |
| `Pago Manualmente` (badge) | ❌ | ✅ |
| `Envio automático de saque` (banner) | ❌ | ✅ |
| `via Asaas` / `Legado` | ❌ | ❌ (local correto) |

### A nova UX está publicada?

**Não.** Produção executa versão anterior à homologação 5A/5B.

---

## 5. Matriz de Runtime

| Camada | Commit Esperado | Commit Runtime | Release | Status |
|--------|-----------------|----------------|---------|--------|
| **GitHub (HEAD)** | `f21f310` | `f21f310` | — | ✅ |
| **GitHub (UX 5B)** | *não commitado* | — | — | ❌ |
| **Backend Fly** | `f21f310-p5pixout` | `f21f310-p5pixout` | v541 | ✅ |
| **Player Vercel** | build 5B (`9r2ds_AP`) | `B6M2smS9` (antigo) | desconhecido | ❌ |
| **Admin Vercel** | build 5B (`488e6752`) | `490acf3c` (antigo) | desconhecido | ❌ |

---

## 6. Matriz de Build

| Projeto | Build Local (auditoria) | Build Publicado | Status |
|---------|-------------------------|-----------------|--------|
| **Backend** | N/A (Fly image v541) | `f21f310-p5pixout` @ v541 | ✅ |
| **Player** | `index-9r2ds_AP.js` (02/07/2026) | `index-B6M2smS9.js` | ❌ |
| **Admin** | `index-488e6752.js` (02/07/2026) | `index-490acf3c.js` | ❌ |

---

## 7. Matriz de Funcionalidades

| Funcionalidade | Código (local) | Runtime Backend | Produção (UI) |
|----------------|:--------------:|:---------------:|:-------------:|
| PIX IN Asaas | ✅ | ✅ | ⚠️ parcial |
| PIX OUT Asaas | ✅ | ✅ | N/A (admin UI antiga) |
| QR no topo | ✅ | N/A | ⚠️ parcial (`qr_code_base64` sim; ordem/scroll não confirmados) |
| Polling 15s | ✅ | N/A | ❌ |
| Botão "Garantir X chutes" | ✅ | N/A | ❌ (`Recarregar Saldo` em produção) |
| Saque simplificado (sem CPF redundante) | ✅ | ✅ (valida perfil) | ❌ (campo CPF/CNPJ no bundle) |
| Interface provider-agnostic | ✅ | ✅ | ❌ (`Mercado Pago` no bundle player) |
| UX Admin (badges/botões/banner) | ✅ | N/A | ❌ |
| Payment Engine | ✅ | ✅ | ✅ |

---

## 8. Auditoria de Cache

| Item | Player | Admin | Risco |
|------|--------|-------|-------|
| Service Worker (PWA) | Ativo (`sw.js`) | Ativo (`sw.js`) | **Médio** — pode servir assets antigos após deploy |
| Cache-Control HTML | `max-age=0, must-revalidate` | `no-cache, no-store` | Baixo |
| Cache-Control JS (vercel.json) | `max-age=0, must-revalidate` | — | Baixo |
| CDN Vercel | `x-vercel-cache: HIT` | `HIT` | Baixo para HTML |
| Bundle hash | Antigo (`B6M2smS9`) | Antigo (`490acf3c`) | **Alto** — confirma versão desatualizada |

### Resposta

Existe possibilidade do navegador utilizar arquivos antigos? **Sim**, especialmente via **Service Worker PWA** após um eventual deploy — recomenda-se hard refresh / limpar SW na validação pós-deploy.

---

## 9. Divergências

### D1 — Player Vercel desatualizado (CRÍTICA)

| Onde | Player produção vs código homologado 5B |
|------|----------------------------------------|
| **Por quê** | Último CI deploy em 17/05/2026; 5A/5B nunca commitado nem publicado |
| **Impacto** | Jogador vê UX antiga: CPF no saque, referências MP, sem polling 15s, sem scroll QR |
| **Correção** | Commit → build → `vercel --prod` ou CI `frontend-deploy.yml` |

### D2 — Admin Vercel desatualizado (CRÍTICA)

| Onde | Admin produção vs código homologado 5B |
|------|----------------------------------------|
| **Por quê** | Mesmo gap de deploy; submodule admin com `SaqueUsuarios.jsx` modificado localmente |
| **Impacto** | Operador sem badges/botões/banner homologados; risco operacional no PIX OUT |
| **Correção** | Commit admin → build → deploy Vercel admin |

### D3 — Código UX não commitado no GitHub (ALTA)

| Onde | Working tree local |
|------|-------------------|
| **Por quê** | Alterações 5A/5B aplicadas apenas na máquina de desenvolvimento |
| **Impacto** | Sem trilha Git auditável; impossível reproduzir deploy idêntico |
| **Correção** | Commit dedicado `feat(ux): ASAAS.PIPELINE.5B financial UX final` |

### D4 — Runtime financeiro ≠ Runtime visual (ALTA)

| Onde | Fly (asaas PIX OUT ativo) vs Vercel (UI antiga) |
|------|--------------------------------------------------|
| **Impacto** | Backend pronto para PIX OUT; operador/jogador em interface não alinhada |
| **Correção** | Sincronizar frontends antes de homologação humana PIX OUT |

### D5 — payout_worker stopped (MÉDIA)

| Onde | Fly machine `payout_worker` |
|------|----------------------------|
| **Impacto** | Saques automáticos podem depender de trigger manual/cron |
| **Correção** | Verificar `ENABLE_PIX_PAYOUT_WORKER` e estado da machine (fora do escopo desta auditoria read-only) |

---

## 10. Recomendações

### Bloqueantes (antes de homologar PIX OUT)

1. **Commitar** alterações UX 5A/5B (player + admin) em branch dedicada.
2. **Deploy Vercel** player e admin com bundles verificados (`9r2ds_AP` / `488e6752` ou novos hashes pós-commit).
3. **Re-executar DEPLOY.PIPELINE.1** após deploy para emitir PASS.
4. **Smoke test** autenticado em `/pagamentos` e `/saque-usuarios`.

### Operacionais

5. Estabelecer gate: nenhuma homologação sem matriz de runtime 100% verde.
6. Incluir hash do bundle JS no relatório de certificação (padrão Indesconectável™).
7. Após deploy, instruir testadores a limpar Service Worker ou usar aba anônima.
8. Reativar/validar `payout_worker` antes do teste real PIX OUT.

### CI/CD

9. Disparar `frontend-deploy.yml` em push para paths `goldeouro-player/**` e `goldeouro-admin/**`.
10. Registrar `gitCommit` do frontend no `/meta` ou banner de versão (melhoria futura).

---

## Evidências Coletadas

| Evidência | Fonte | Timestamp |
|-----------|-------|-----------|
| `git log -1`, `git status` | repositório local | 2026-07-02 ~17:16 UTC |
| `fly releases`, `fly status` | Fly CLI | 2026-07-02 ~17:16 UTC |
| `/health`, `/meta` JSON | `goldeouro-backend-v2.fly.dev` | 2026-07-02T17:15:07Z |
| HTML + headers Player/Admin | HTTP GET produção | 2026-07-02 ~17:18 UTC |
| Análise strings bundle JS | prod vs `dist/` local | 2026-07-02 ~17:28 UTC |
| `sw.js` tamanhos | produção | player 3782B, admin 2921B |
| `gh run list frontend-deploy.yml` | GitHub CLI | último: 2026-05-17 |

---

## Critério de Encerramento

| Critério | Atendido? |
|----------|:---------:|
| GitHub corresponde ao commit homologado | ⚠️ HEAD sim; UX 5B não |
| Backend Fly executa esse commit | ✅ |
| Runtime financeiro atualizado | ✅ |
| Player Vercel executa versão homologada | ❌ |
| Admin Vercel executa versão homologada | ❌ |
| Sem bundles/cache comprometendo validação | ❌ (bundles antigos + PWA) |
| Funcionalidades homologadas publicadas | ❌ |
| Matriz de Runtime sincronizada | ❌ |
| Relatório oficial emitido | ✅ |

---

## Veredito Final

# FAIL — DIVERGÊNCIA DE RUNTIME DETECTADA

**Fundamentação:** O backend Fly (v541, `f21f310-p5pixout`) está certificado e operando Asaas PIX IN/OUT em produção. Porém, os frontends Vercel publicam bundles **diferentes e anteriores** ao código homologado localmente (ASAAS.PIPELINE.5A/5B), com evidência objetiva de hash divergente e ausência de marcadores UX no JavaScript de produção. O último deploy automatizado do player data de **maio/2026**. A cadeia GitHub → Fly → Player → Admin **não está sincronizada**.

A homologação final do PIX OUT deve permanecer **bloqueada** até nova certificação com veredito PASS.

---

*Relatório emitido em 02/07/2026 — DEPLOY.PIPELINE.1 — Gol de Ouro™ V1 — Modo READ-ONLY*
