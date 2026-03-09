# BLOCO F — INTERFACE

**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO  
**Referências:** Baseline FyKKeg6zb | Produção atual ez1oc96t1 | Código local

---

## 1. Escopo auditado

| Tipo | Itens |
|------|--------|
| **Frontend** | App.jsx (VersionWarning, PwaSwUpdater, layout), Navigation.jsx (sidebar, saldo fixo), componentes de layout, index.css (paleta, utilitários), páginas Login, Register, Dashboard, GameShoot, Profile, Withdraw, Pagamentos |
| **Componentes globais** | VersionWarning.jsx, PwaSwUpdater.jsx, ErrorBoundary, ProtectedRoute |
| **Documentação** | AUDITORIA-BLOCO-F-INTERFACE-2026-03-08.md |

---

## 2. Fonte de verdade do bloco

- **Layout e experiência visual:** Código local (goldeouro-player/src). Produção atual (ez1oc96t1) serve o build desse código. Baseline (FyKKeg6zb) tem fingerprint e bundles registrados (index-qIGutT6K.js, index-lDOJDUAS.css); não há descrição linha a linha de VersionWarning/PwaSwUpdater no bundle da baseline.
- **Referência “oficial” hoje:** compare-preview-vs-baseline-risk.json indica que o preview (ez1oc96t1) tem VersionWarning ativo e bundle diferente da baseline; a “interface oficial validada” seria a do FyKKeg6zb (sem barra de versão documentada como problema).

---

## 3. Evidências concretas

| Evidência | Local |
|-----------|--------|
| VersionWarning / PwaSwUpdater | App.jsx 30–31: <VersionWarning />, <PwaSwUpdater /> |
| Consistência visual | AUDITORIA-BLOCO-F-INTERFACE-2026-03-08: paleta, glassmorphism, tema escuro; Pagamentos tema claro |
| Saldo sidebar | Navigation: valor fixo "R$ 150,00" |
| ToastContainer | Ausente em App.jsx e main.jsx; toasts (GameShoot, Pagamentos) não exibidos |
| Margens | ml-64 (GameShoot, Pagamentos) vs ml-72 (Dashboard, Profile, Withdraw); sidebar w-72 |
| compare-preview-vs-baseline-risk | VersionWarning ativo no preview; regressão barra de versão/layout |

---

## 4. Alinhamento com baseline validada

**Resposta:** **parcial**

- Baseline FyKKeg6zb tem fingerprint (SHA256 HTML, bundles) e elementos esperados em /game (saldo, apostas, campo, goleiro, zonas). Não está documentado se VersionWarning/PwaSwUpdater existiam no bundle da baseline. compare-preview-vs-baseline-risk indica que o **preview (ez1oc96t1)** tem “VersionWarning ativo” e “baseline validada sem esse comportamento” — logo há divergência entre **produção atual** e **baseline** em termos de barra/banner. A **interface** da baseline (cores, rotas, estrutura) pode ser similar; detalhes de banner e toasts não confirmados.

---

## 5. Alinhamento com produção atual

**Resposta:** **sim**

- Produção atual é o build do código local. Interface (layout, navegação, componentes globais, telas) é a mesma. Divergências são as mesmas do local (ToastContainer ausente, saldo fixo na sidebar, tema claro em Pagamentos, ml-64 vs ml-72).

---

## 6. Diferenças encontradas

| Tipo | Descrição |
|------|------------|
| **Visual** | Pagamentos: tema claro (bg-gray-50); demais telas tema escuro. ml-64 vs ml-72. Placeholder (placeholder-white vs placeholder-white/50). |
| **Funcional** | ToastContainer ausente: toasts não aparecem (GameShoot, Pagamentos). Saldo fixo na sidebar: valor "R$ 150,00" não reflete saldo real. |
| **Ambiente / dev** | VersionWarning e PwaSwUpdater são “camada extra” em relação ao que a baseline validada tinha (documentado como regressão no preview). Podem ser tratados como dev/banner. |
| **Perigoso para validação** | Saldo fixo na sidebar pode induzir a concluir que “saldo está errado” ou “dados inconsistentes”. Toasts ausentes podem fazer achar que feedback de sucesso/erro “não funciona”. |

---

## 7. Risco operacional

**Classificação:** **médio**

- **Baixo** para navegação e estrutura geral. **Médio** para confiança na validação: saldo fixo e toasts ausentes podem levar a falsos negativos ou confusão. **Alto** apenas se a equipe tratar a interface da produção atual como idêntica à baseline sem registrar banner/VersionWarning.

---

## 8. Pode usar o local como referência para este bloco?

**Resposta:** **sim, com ressalvas**

- Para **layout, rotas, cores, navegação:** sim — local = produção atual. Para **feedback de mensagens (toast):** não — toasts não aparecem; não usar como referência de “mensagens ao usuário” sem corrigir ToastContainer. Para **saldo na sidebar:** não usar como referência — valor fixo. Para **comparação com baseline:** registrar que produção atual (e local) podem ter VersionWarning/banner que a baseline não tinha; qual interface tratar como “referência real” depende de decisão (baseline = FyKKeg6zb vs produção atual = ez1oc96t1).

---

## 9. Exceções que precisam ser registradas

1. **ToastContainer:** Ausente; toasts em GameShoot e Pagamentos não são exibidos. Corrigir antes de homologar feedback de sucesso/erro.
2. **Saldo na Navigation:** Valor fixo "R$ 150,00"; não reflete saldo real; pode induzir validação errada.
3. **VersionWarning / PwaSwUpdater:** Documentar como diferença em relação à baseline (barra/banner); decidir se são “oficiais” ou “camada dev”.
4. **Tema Pagamentos:** Única tela em tema claro; registrar como inconsistência visual.
5. **Margem ml-64 vs ml-72:** Registrar para alinhamento futuro.

---

## 10. Classificação final do bloco

**BLOCO ALINHADO COM RESSALVAS**

- Alinhado com **produção atual** (sim). Alinhado com **baseline** (parcial — estrutura sim; banner/toasts não confirmados; risco de regressão documentado). Divergências visuais: tema Pagamentos, margens, saldo sidebar. Divergências funcionais: toasts não exibidos. Qual interface tratar como referência real deve ser formalizado (baseline vs produção atual).

---

*Auditoria READ-ONLY. Nenhum arquivo ou deploy foi alterado.*
