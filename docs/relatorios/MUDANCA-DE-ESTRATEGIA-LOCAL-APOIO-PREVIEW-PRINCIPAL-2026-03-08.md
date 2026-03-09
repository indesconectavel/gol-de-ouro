# Mudança de estratégia — Local como apoio, Preview como validação principal

**Data:** 2026-03-08  
**Projeto:** Gol de Ouro  
**Tipo:** Protocolo operacional oficial  
**Status:** Estratégia migrada com sucesso

---

## 1. Motivo da mudança

### Por que o localhost deixou de ser referência principal

Após auditoria forense do projeto, ficou claro que **insistir no localhost como espelho perfeito da produção** gera fricção desnecessária e risco de falsa equivalência, porque o runtime local depende de:

- **Backend alvo** — local (8080) vs produção (fly.dev), exigindo override ou backend local rodando  
- **Porta local** — Vite pode usar 5173, 5178, etc., sem equivalência com o ambiente online  
- **Env local** — `.env.local`, `VITE_*`, detecção por hostname (environments.js)  
- **Cache e build** — Vite, node_modules, cache do navegador divergem do build de preview/produção  
- **Comportamentos não equivalentes** — CORS, cookies, domínio, rede e CDN diferentes do ambiente real  

Por isso, **o localhost não pode ser tratado como verdade final de homologação**. A nova regra é: **desenvolver no local, validar em preview, proteger produção**.

---

## 2. As referências oficiais do projeto

| Referência | Identificador | Uso |
|------------|----------------|-----|
| **Produção atual** | Deploy **ez1oc96t1** (commit 7c8cf59) | Referência viva do sistema; comportamento real que o usuário vê hoje; não alterar até o encerramento dos BLOCOs. |
| **Baseline de segurança** | **FyKKeg6zb** | Rollback; referência histórica; comparação de segurança; preservar como opção de restauração. |
| **Espelho de código da produção** | Branch **production-mirror/ez1oc96t1** (7c8cf59) | Comparação de código; auditoria; diffs; referência exata do commit em produção; não usar para homologação de runtime. |
| **Ambiente local** | localhost (Vite, etc.) | Apoio técnico: edição, debug, testes pontuais; **não** usar como fonte final de homologação. |
| **Preview online** | Deploy de preview da branch (Vercel/plataforma do projeto) | **Validação principal** de cada BLOCO; checagem visual e funcional; ambiente de aprovação antes do deploy final. |

---

## 3. Nova regra operacional

- **Local = apoio**  
  Desenvolvimento, edição, depuração e testes rápidos. Não é ambiente de decisão final para homologação.

- **Preview = validação principal**  
  Cada BLOCO deve ser validado em **preview online controlado** (branch própria em preview). Aí se confere visual, funcional, fluxo, integração com backend e ausência de regressão.

- **Produção atual permanece congelada** como referência viva até que todos os BLOCOs estejam concluídos e validados e a equipe aprove o deploy final.

---

## 4. Novo fluxo de execução dos BLOCOs

Para **cada BLOCO**, o fluxo oficial é:

| Fase | Ação | Detalhe |
|------|------|--------|
| **FASE A** | Criar branch própria | Ex.: `feature/bloco-c-auth`, `feature/bloco-d-saldo`, `feature/bloco-a-financeiro`, `feature/bloco-e-gameplay`, `feature/bloco-b-apostas`, `feature/bloco-f-interface`, `feature/bloco-g-fluxo` |
| **FASE B** | Desenvolver localmente | Usar localhost apenas para editar, depurar, inspecionar e testar rapidamente. |
| **FASE C** | Subir preview | Gerar preview online da branch (ex.: Vercel Preview). |
| **FASE D** | Validar no preview | Homologar: visual, funcional, fluxo, regressão, integração com backend. |
| **FASE E** | Documentar | Gerar relatório do BLOCO (objetivo, arquivos alterados, checklist, resultado). |
| **FASE F** | Consolidar | Só após validação do preview; então merge ou preparação para o próximo bloco/deploy final conforme critério de prontidão. |

Resumo: **branch → local (apoio) → preview → validação → relatório → consolidação**.

---

## 5. Protocolo anti-regressão

- **Nenhuma alteração silenciosa fora do BLOCO**  
  Se surgir problema fora do escopo do bloco: registrar, não corrigir escondido, decidir em separado (novo bloco ou item explícito).

- **Toda branch de BLOCO deve ter:**  
  - arquivos alterados documentados  
  - objetivo claro  
  - impacto esperado  
  - risco avaliado  
  - checklist de validação  
  - relatório final  

- **Toda validação em preview deve conferir:**  
  - login e auth  
  - dashboard  
  - saldo  
  - /game  
  - sidebar/navegação  
  - rotas protegidas  
  - páginas impactadas pelo BLOCO  
  - ausência de regressão nas áreas críticas  

---

## 6. Ordem oficial dos BLOCOs

| # | BLOCO | Escopo |
|---|-------|--------|
| 1 | **C** | Autenticação / Acesso |
| 2 | **D** | Saldo / Perfil / Pagamentos |
| 3 | **A** | Financeiro |
| 4 | **E** | Gameplay |
| 5 | **B** | Sistema de Apostas |
| 6 | **F** | Interface |
| 7 | **G** | Fluxo do Jogador |

**Justificativa:** primeiro acesso e dados-base (C), depois saldo e financeiro (D, A), em seguida gameplay e apostas (E, B), por fim interface e jornada consolidada (F, G).

---

## 7. Critério de prontidão para deploy final

O **deploy final para produção** só pode ocorrer quando **todas** as condições abaixo forem atendidas:

- [ ] Todos os BLOCOs tiverem branch própria  
- [ ] Todos os BLOCOs tiverem relatório  
- [ ] Todos os BLOCOs tiverem validação em **preview online**  
- [ ] Não houver regressão aberta  
- [ ] Produção atual tiver sido comparada (referência viva preservada)  
- [ ] Baseline FyKKeg6zb continuar preservada como rollback  
- [ ] Equipe aprovar explicitamente o fechamento e o deploy final  

---

## 8. Frase oficial da equipe

A partir desta data, a equipe adota a seguinte frase operacional em chats e relatórios:

> **O localhost passa a ser ambiente de apoio técnico. A validação principal dos BLOCOs será feita em preview online controlado. Produção atual permanece congelada como referência viva, a branch mirror preserva o código exato em produção, e a baseline FyKKeg6zb permanece como referência de rollback e segurança.**

---

## 9. Classificação final

**ESTRATÉGIA MIGRADA COM SUCESSO**

A nova metodologia está formalizada: local como apoio, preview como validação principal, referências definidas, fluxo por BLOCO e critério de prontidão para deploy final documentados. Produção permanece intocada; nenhum deploy foi executado nesta etapa.

---

## Saída final obrigatória

| Pergunta | Resposta |
|----------|----------|
| **Qual passa a ser o papel do localhost?** | **Apoio técnico:** edição, debug, inspecionar, testar rapidamente. **Não** é fonte final de homologação. |
| **Qual passa a ser o papel do preview?** | **Validação principal:** ambiente onde cada BLOCO é homologado (visual, funcional, fluxo, regressão) antes de consolidação e deploy final. |
| **Qual é o novo fluxo oficial de execução?** | Para cada BLOCO: **criar branch própria → desenvolver no local (apoio) → subir preview → validar no preview → documentar (relatório) → consolidar**. Deploy final apenas quando todos os BLOCOs estiverem validados em preview e o critério de prontidão for atendido. |
| **Qual é a ordem oficial dos BLOCOs?** | **C → D → A → E → B → F → G** (Autenticação → Saldo/Perfil/Pagamentos → Financeiro → Gameplay → Apostas → Interface → Fluxo do Jogador). |
| **Qual frase operacional a equipe deve adotar daqui para frente?** | *O localhost passa a ser ambiente de apoio técnico. A validação principal dos BLOCOs será feita em preview online controlado. Produção atual permanece congelada como referência viva, a branch mirror preserva o código exato em produção, e a baseline FyKKeg6zb permanece como referência de rollback e segurança.* |

---

*Documento gerado em modo read-only. Nenhuma alteração foi feita em produção, Vercel, Fly ou recursos remotos.*
