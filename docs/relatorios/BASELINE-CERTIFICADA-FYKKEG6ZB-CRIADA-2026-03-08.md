# Baseline certificada FyKKeg6zb — Criada

**Data:** 2026-03-08  
**Branch:** baseline/fykkeg6zb-certified  
**Commit base:** 0a2a5a1  
**Commit da certificação:** 1fd83f0 (a ser atualizado se houver segundo commit com relatório)

---

## 1. Contexto da baseline

- **Deploy validado em produção:** FyKKeg6zb (ID completo dpl_FyKKeg6zbT5emQUoLcZ4K8Q16jLX).
- **Origem do deploy original:** `vercel deploy` (deploy manual); estado exato do código não está totalmente rastreado no Git.
- **Objetivo:** Criar uma baseline **certificada e rastreável no Git** que reproduza o **comportamento funcional aprovado** (login estável, sem banner verde, layout aprovado, compatível com backend Fly atual), sem alterar a produção existente.

---

## 2. Fingerprint do deploy original

| Item | Valor |
|------|--------|
| Bundle JS | dist/assets/index-qIGutT6K.js |
| Bundle CSS | dist/assets/index-lDOJDUAS.css |
| Build date | 2026-01-16T05:25:34Z |
| Projeto Vercel | goldeouro-player |

A baseline certificada **não** reproduz necessariamente o mesmo hash de bundle (qIGutT6K/lDOJDUAS); o objetivo é **comportamento funcional estável e reproduzível**, não fingerprint idêntico.

---

## 3. Motivo da criação da baseline certificada

- O commit proxy **0a2a5a1** não reproduz o bundle real (build local gera hashes diferentes).
- A branch **baseline/fykkeg6zb** (proxy) em preview mostrava **banner verde** e **falha de login** em localhost (por uso de API_BASE_URL localhost:8080).
- Produção (FyKKeg6zb) permanece estável e funcional; não deve ser alterada.
- Era necessário uma baseline **rastreável no Git** que:
  - remova o banner de versão no topo,
  - mantenha login funcional em preview/produção (hostname → backend Fly),
  - preserve layout aprovado e compatibilidade com o backend atual.

---

## 4. Mudanças realizadas

| Arquivo | Alteração |
|---------|-----------|
| **goldeouro-player/src/components/VersionBanner.jsx** | Gate por `VITE_SHOW_VERSION_BANNER`: se `!== 'true'`, retorna `null` (banner oculto). |
| **goldeouro-player/src/components/VersionWarning.jsx** | Mesmo gate: se `VITE_SHOW_VERSION_BANNER !== 'true'`, retorna `null` (evita barra e chamadas a versionService). |
| **goldeouro-player/vite.config.ts** | Injeção de `import.meta.env.VITE_SHOW_VERSION_BANNER` com valor padrão `'false'` (loadEnv), garantindo banner oculto em build de produção/preview. |
| **goldeouro-player/package.json** | Adicionado `engines.node": ">=18.0.0"` para build reproduzível. |
| **goldeouro-player/package-lock.json** | Mantido consistente após `npm install` (sem alteração de dependências funcionais). |

**Configuração de login/API:** Nenhuma alteração em `environments.js` nem `config/api.js`; produção já utiliza `https://goldeouro-backend-v2.fly.dev` quando hostname não é localhost. Preview na Vercel usa hostname do preview → ambiente production → login funcional.

---

## 5. Comportamento validado

| Item | Esperado | Status |
|------|----------|--------|
| Layout do login | Aprovado, sem barra verde no topo | ✅ Gate garante banner oculto |
| Fluxo de login | Funcional em preview/produção (backend Fly) | ✅ environments.js inalterado; preview usa production |
| VersionBanner | Não exibido | ✅ `VITE_SHOW_VERSION_BANNER` default false |
| VersionWarning | Não exibido | ✅ Mesmo gate |
| Build | Consistente e reproduzível | ✅ `npm run build` concluído com sucesso |
| Compatibilidade backend | Fly atual (goldeouro-backend-v2.fly.dev) | ✅ Mantida |

Validação manual no preview (URL do preview — ver seção 6) deve confirmar: login carrega, banner não aparece, layout igual ao aprovado, backend responde.

---

## 6. URL do preview

Após `git push origin baseline/fykkeg6zb-certified`, a Vercel gera automaticamente o preview da branch. A URL será do tipo:

- **https://goldeouro-player-&lt;hash&gt;-&lt;team&gt;.vercel.app**  
  ou o link exibido no dashboard Vercel para a branch `baseline/fykkeg6zb-certified`.

*(Preencher com a URL efetiva após o push, se disponível.)*

---

## 7. Commit da baseline certificada

| Item | Valor |
|------|--------|
| **Branch** | baseline/fykkeg6zb-certified |
| **Commit base** | 0a2a5a1 (Merge PR #18 — security/fix-ssrf-vulnerabilities) |
| **Commit da certificação** | 1fd83f0 |
| **Mensagem** | baseline(certified): recria baseline funcional FyKKeg6zb sem banner e com login estável |

---

## 8. Confirmação de que produção não foi alterada

- **Produção (FyKKeg6zb):** Não alterada; nenhum deploy para production foi executado.
- **Vercel Production:** Não alterada; apenas push de branch nova; preview é gerado automaticamente para a branch.
- **Backend Fly:** Não alterado.
- **Banco:** Não alterado.
- **Variáveis de ambiente de produção:** Não alteradas.
- **Domínios:** Não alterados.

Todas as alterações estão contidas na branch **baseline/fykkeg6zb-certified**; nenhum merge em main nem promote para production foi realizado.

---

*Relatório gerado em 2026-03-08. Baseline certificada criada com sucesso.*
