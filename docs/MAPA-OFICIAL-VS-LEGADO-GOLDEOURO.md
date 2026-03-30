# MAPA OFICIAL VS LEGADO

**Objetivo:** reduzir regressão, confusão de entrypoint e uso de contratos errados.  
**Data:** 2026-03-29  
**Fonte:** auditorias consolidadas e `server-fly.js` / `Dockerfile`.

---

## 1. Arquivos oficiais do backend

| Categoria | Ficheiros / pastas (oficiais para o desenho V1 Fly) |
|-----------|-----------------------------------------------------|
| **Arranque** | `server-fly.js`, `Dockerfile` (`CMD`), `package.json` (`main`, `start`) |
| **Admin API** | `routes/adminApiFly.js` |
| **Analytics** | `routes/analyticsIngest.js` |
| **Supabase** | `database/supabase-unified-config.js` (e SQL aplicável em `database/`) |
| **PIX / webhook** | Lógica montada **em** `server-fly.js` + `utils/webhook-signature-validator.js` + utilitários referenciados pelo fluxo Fly |
| **Financeiro** | `utils/financialNormalization.js` (dual-write/normalização conforme código atual) |
| **Jogo** | Funções e estado em `server-fly.js`; validadores como `utils/lote-integrity-validator.js` quando usados pelo entrypoint |

---

## 2. Arquivos oficiais do player

| Categoria | Notas |
|-----------|--------|
| **App principal** | `goldeouro-player/` — SPA Vite; páginas e componentes sob `src/` |
| **Jogo / HUD** | Ficheiros referidos nas auditorias F (ex.: `GameFinal.jsx`, layouts, CSS de jogo) |
| **Build** | Variáveis `VITE_*` alinhadas a `INVENTARIO-ENV-V1.md` |

O “oficial” aqui é **o que está em uso no fluxo de build atual** do player, não cópias antigas fora da pasta.

---

## 3. Arquivos oficiais do admin

| Categoria | Notas |
|-----------|--------|
| **SPA** | `goldeouro-admin/` |
| **Contrato com backend** | Chamadas a **`/api/admin/*`** com **`x-admin-token`**; base URL via env de build documentada |
| **Código alinhado** | Preferir caminhos e clientes HTTP **uniformes** (meta declarada nas auditorias J; estado legado ainda descrito nos relatórios) |

---

## 4. Arquivos/documentos legados

| Tipo | Exemplos / descrição |
|------|----------------------|
| **Routers não montados no Fly** | `routes/paymentRoutes.js`, `routes/gameRoutes.js`, etc., se **não** estiverem ligados em `server-fly.js` |
| **Outros servidores** | `server-fly-deploy.js`, `server.js` ou variantes — legado ou alternativas **não** usadas pelo `Dockerfile` atual |
| **Controllers paralelos** | `paymentController.js` e similares quando o fluxo Fly **não** os importa para o mesmo caminho |
| **Documentação** | Dezenas/centenas de `.md` com prefixos `BLOCO-*`, `CIRURGIA-*`, `EXEC-HOJE-*` — **histórico**; síntese em `RELATORIO-MESTRE-V1-GOLDEOURO.md` |

---

## 5. Arquivos perigosos de confusão

- **Alterar `Dockerfile` `CMD`** para outro ficheiro sem atualizar toda a documentação.  
- **Assumir** que exemplos em `routes/*.js` refletem produção sem abrir `server-fly.js`.  
- **Múltiplas versões** de checklist (`CHECKLIST-FINAL-*` vs `CHECKLIST-GO-NO-GO-V1.md`) — **cruzar** ambos no dia do go-live.  
- **`goldeouro-admin`:** ficheiros que ainda apontam para **`/admin/*`** ou login local se a API real for só **`/api/admin`** com token.

---

## 6. O que pode ser ignorado

- Relatórios **puramente históricos** de um dia de sprint sem impacto no estado atual do código **se** o relatório mestre e o mapa de endpoints já cobrem o tema.  
- Duplicados de “relatório executivo completo” **quando** a versão V1 datada 2026-03-29 for a referência.  
- Pastas de **rascunho** ou JSON de resultado de saneamento **apenas** como evidência de operação pontual (não como spec).

---

## 7. O que nunca deve ser usado por engano

- **Qualquer entrypoint** que não seja `server-fly.js` **em produção Fly** sem decisão documentada.  
- **Webhooks ou URLs** apontando para ambiente errado por **`BACKEND_URL`** omitida (fallback fixo no código pode não ser o teu deploy).  
- **Escala > 1** do processo de jogo **sem** novo desenho — quebra coerência de lotes e contador.  
- **Bootstrap admin** (`/api/admin/bootstrap`) em produção aberta sem controlo — risco documentado na matriz (R10).

---

*Fim do mapa oficial vs legado.*
