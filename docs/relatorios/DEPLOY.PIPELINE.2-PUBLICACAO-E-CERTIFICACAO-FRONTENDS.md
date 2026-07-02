# DEPLOY.PIPELINE.2 — Publicação e Certificação dos Frontends

**Projeto:** Gol de Ouro™ V1  
**Engine:** Indesconectável Payment Engine™  
**Versão:** DEPLOY.PIPELINE.2  
**Data:** 02/07/2026  
**Modo:** PUBLICAÇÃO CONTROLADA + CERTIFICAÇÃO DE RUNTIME FRONTEND  
**Escopo:** `goldeouro-player` e `goldeouro-admin` (somente frontend)

---

## Resumo Executivo

Após o `DEPLOY.PIPELINE.1` ter emitido **FAIL** por frontends desatualizados, esta etapa publicou os dois frontends na Vercel e certificou que a UX homologada em `ASAAS.PIPELINE.5B` está **efetivamente online** em produção.

| Item | Antes (PIPELINE.1) | Depois (PIPELINE.2) |
|------|--------------------|---------------------|
| Player bundle prod | `index-B6M2smS9.js` (antigo) | **`index-CF4fHVAl.js`** (novo) |
| Admin bundle prod | `index-490acf3c.js` (antigo) | **`index-e0382074.js`** (novo) |
| Polling 15s | ❌ | ✅ (`15e3`) |
| Saque sem CPF redundante | ❌ | ✅ |
| Provider-agnostic (player) | ❌ (`Mercado Pago`) | ✅ (removido) |
| UX Admin 5B | ❌ | ✅ |

### Veredito Final

# PASS COM RESSALVAS

Ambos os frontends estão publicados e os bundles em produção contêm a UX 5B. Ressalvas: (1) validação visual feita por auditoria de bundle + HTTP (não houve smoke test visual autenticado com screenshot); (2) Service Worker/PWA pode servir assets em cache para usuários recorrentes até atualizar.

---

## Fase 0 — Checkpoint Local

| Item | Player | Admin |
|------|--------|-------|
| Branch (repo) | `chore/f2-4e-2-mp-log` | submódulo `goldeouro-admin` |
| Repo | monorepo `goldeouro-backend` | `github.com/indesconectavel/goldeouro-admin.git` |
| Commit base | `f21f310` | `4eda315` |
| Build local | ✅ | ✅ |
| Bundle local | `index-DdA61FO-.js` | `index-488e6752.js` |
| Status | alterações UX locais (não commitadas) | `SaqueUsuarios.jsx` modificado local |

---

## Fase 1 — Build Final

| Projeto | Comando | Exit | Bundle local | Tamanho | Warnings |
|---------|---------|:----:|--------------|---------|----------|
| Player | `npm run build` | 0 | `index-DdA61FO-.js` | 398.68 kB (gzip 117.43) | nenhum bloqueante |
| Admin | `npm run build` | 0 | `index-488e6752.js` | 251.34 kB (gzip 73.40) | nenhum bloqueante |

PWA gerado em ambos (`sw.js`, `workbox-*.js`). Player: precache 50 entries; Admin: 25 entries.

> Observação: a Vercel executa **build remoto próprio** (Node 22.x), gerando hashes finais diferentes do build local — o que importa é a presença dos marcadores de UX no bundle publicado (Fase 6).

---

## Fase 2 — Publicação Vercel

**Opção escolhida:** A (CLI) via `vercel login` (device flow) autenticado pelo operador.

| Passo | Resultado |
|-------|-----------|
| `vercel login` | ✅ Device code `HWBL-QPTL` autorizado — conta `indesconectavel` |
| `vercel whoami` | `indesconectavel` |
| Player link | `prj_lNa2Uj0jf4anaKpO4IXVWkKumn8v` (org `team_7BSTR9XAt3OFEIUUMqSpIbdw`), `rootDirectory=goldeouro-player` |
| Admin link | `prj_SLLtt8Kv6D6pMQiY4ky5KoxNUuAk` |

**Correção de caminho:** o projeto player tem `rootDirectory=goldeouro-player`; deploy a partir de dentro da pasta falhou (`goldeouro-player/goldeouro-player` inexistente). Deploy refeito **a partir da raiz do monorepo** (link `.vercel` na raiz + `.vercelignore` limitando payload).

| Projeto | Comando | CWD | Exit |
|---------|---------|-----|:----:|
| Player | `npx vercel --prod` | raiz `goldeouro-backend` | 0 |
| Admin | `npx vercel --prod` | `goldeouro-admin` | 0 |

---

## Fase 3 — Certificação Vercel

| Item | Player | Admin |
|------|--------|-------|
| Deployment (URL) | `goldeouro-player-bhkl0c87r-…vercel.app` | `goldeouro-admin-nresgtab5-…vercel.app` |
| Inspect ID | `AX4b42FupaPPA6FS9iqRVMrfiyMf` | `2Zvic4EBe4LEjkJKpq2QGZ5krc8g` |
| Status | ● Ready | ● Ready |
| Alias produção | `www.goldeouro.lol` | `admin.goldeouro.lol` |
| Upload | 18.9 MB (monorepo filtrado) | 321.4 KB |
| Bundle JS publicado | `index-CF4fHVAl.js` | `index-e0382074.js` |
| Cache | novo hash (invalidação por hash) | novo hash |

---

## Fase 4 — Validação Player

`https://www.goldeouro.lol/pagamentos` — HTTP 200.

Marcadores confirmados no bundle publicado (`index-CF4fHVAl.js`):

| Requisito | Marcador | Resultado |
|-----------|----------|:---------:|
| Botão "Garantir X chutes" | `Garantir `, `chute` | ✅ FOUND |
| Polling 15s | `15e3` (15000ms minificado) | ✅ FOUND |
| QR + scroll | `qr_code_base64`, `scrollIntoView` | ✅ FOUND |
| Saque simplificado | `CPF ou CNPJ` | ✅ AUSENTE (removido) |
| Perfil incompleto | `complete seus dados cadastrais`, `Ir para Meu Perfil` | ✅ FOUND |
| Provider-agnostic | `Mercado Pago` | ✅ AUSENTE (removido) |

---

## Fase 5 — Validação Admin

`https://admin.goldeouro.lol/saque-usuarios` — HTTP 200.

Marcadores confirmados no bundle publicado (`index-e0382074.js`):

| Requisito | Marcador | Resultado |
|-----------|----------|:---------:|
| Botão principal | `Aprovar e Enviar PIX` | ✅ FOUND |
| Baixa manual | `Marcar como Pago Manualmente` | ✅ FOUND |
| Badge Autorizado | `Autorizado` | ✅ FOUND |
| Badge Pago Manualmente | `Pago Manualmente` | ✅ FOUND |
| Provider-agnostic | `via Asaas`, `Legado` | ✅ AUSENTE (removidos) |

---

## Fase 6 — Auditoria de Bundle

| Camada | Bundle antigo (PIPELINE.1) | Bundle novo (produção) | Sincronizado? |
|--------|----------------------------|------------------------|:-------------:|
| Player | `index-B6M2smS9.js` | `index-CF4fHVAl.js` | ✅ |
| Admin | `index-490acf3c.js` | `index-e0382074.js` | ✅ |

Os bundles publicados contêm todos os marcadores de UX 5B esperados e não contêm strings de PSP na interface pública. **Deploy refletido.**

---

## Fase 7 — Auditoria de Cache

| Recurso | Cache-Control | x-vercel-cache |
|---------|---------------|----------------|
| Player HTML `/` | `public, max-age=0, must-revalidate` | MISS |
| Player asset JS | `public, max-age=0, must-revalidate` | HIT |
| Admin HTML `/` | `no-cache, no-store, must-revalidate` | MISS |
| Player `sw.js` | `public, max-age=0, must-revalidate` | MISS |
| Admin `sw.js` | `no-cache, no-store, must-revalidate` | MISS |

### Existe risco de o usuário ver UX antiga?

- **Novos visitantes / anônimo / hard refresh:** ❌ sem risco — HTML revalida e referencia os novos hashes (`CF4fHVAl` / `e0382074`).
- **Usuários recorrentes com PWA instalado:** ⚠️ risco baixo/médio — o Service Worker pode servir o precache anterior até ativar a nova versão. Recomenda-se um reload adicional / limpar SW na primeira visita pós-deploy.

---

## Fase 8 — Smoke Test Financeiro (sem movimentar dinheiro)

| Verificação | Resultado |
|-------------|-----------|
| Player acessa `/pagamentos` | ✅ HTTP 200 |
| Admin acessa `/saque-usuarios` | ✅ HTTP 200 |
| Backend `/health` | ✅ `status=ok` |
| Provider efetivo | ✅ `paymentProvider=asaas`, `payoutProvider=asaas` |
| PIX OUT runtime | ✅ `pixOut.productionHttpEnabled=true` |
| Frontend → backend correto | ✅ CSP/conn aponta `goldeouro-backend-v2.fly.dev` |

Nenhum saque real criado (conforme escopo).

---

## Deployment IDs (resumo)

| Projeto | Deployment URL | Inspect ID |
|---------|----------------|------------|
| Player | `goldeouro-player-bhkl0c87r-goldeouro-admins-projects.vercel.app` | `AX4b42FupaPPA6FS9iqRVMrfiyMf` |
| Admin | `goldeouro-admin-nresgtab5-goldeouro-admins-projects.vercel.app` | `2Zvic4EBe4LEjkJKpq2QGZ5krc8g` |

---

## Divergências

| # | Divergência | Impacto | Status |
|---|-------------|---------|--------|
| D1 (PIPELINE.1) | Player Vercel desatualizado | Alto | ✅ Resolvida |
| D2 (PIPELINE.1) | Admin Vercel desatualizado | Alto | ✅ Resolvida |
| D3 | Código UX 5B não commitado no Git | Médio | ⚠️ Pendente (deploy feito de working tree local) |

---

## Riscos Residuais

| Risco | Severidade | Mitigação |
|-------|------------|-----------|
| PWA/Service Worker servindo cache antigo a usuários recorrentes | Baixa/Média | Reload extra / limpar SW; hashes novos forçam atualização de assets |
| UX 5B publicada de working tree não commitado | Média | Commitar/pushar 5B (player + submódulo admin) para trilha auditável |
| Validação visual não autenticada (apenas bundle + HTTP) | Baixa | Smoke test visual logado por operador em `/pagamentos` e `/saque-usuarios` |
| Teste real PIX OUT ainda pendente | Alta | Executar após esta certificação (próxima etapa) |

---

## Critério de Encerramento

| Critério | Status |
|----------|:------:|
| Player publicado em produção | ✅ |
| Admin publicado em produção | ✅ |
| Bundle publicado corresponde ao build homologado | ✅ |
| UX ASAAS.PIPELINE.5B aparece em produção | ✅ |
| Cache não serve versão antiga | ✅ (ressalva PWA) |
| `/pagamentos` validado | ✅ |
| `/saque-usuarios` validado | ✅ |
| Relatório oficial emitido | ✅ |

---

## Veredito Final

# PASS COM RESSALVAS

Os frontends `goldeouro-player` e `goldeouro-admin` foram publicados na Vercel e os bundles em produção (`index-CF4fHVAl.js` / `index-e0382074.js`) contêm integralmente a UX homologada em `ASAAS.PIPELINE.5B`. O backend permanece íntegro (`asaas` PIX IN/OUT, `pixOut.productionHttpEnabled=true`).

**Ressalvas:** cache PWA para usuários recorrentes e ausência de commit da UX 5B no Git. Recomenda-se um smoke test visual autenticado e o commit/push das alterações antes de retomar o **teste real de PIX OUT via Asaas**.

---

## Próximos Passos

1. Commit + push da UX 5B (player + submódulo admin) para trilha Git.
2. Smoke test visual autenticado em `/pagamentos` e `/saque-usuarios`.
3. Re-certificação rápida (`DEPLOY.PIPELINE.1`) → esperado PASS.
4. Retomar o teste real de PIX OUT via Asaas (operador humano).

---

*Relatório emitido em 02/07/2026 — DEPLOY.PIPELINE.2 — Gol de Ouro™ V1*
