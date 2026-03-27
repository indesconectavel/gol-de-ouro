# BLOCO F — Validação final dos botões (app shell, pós-cirurgia)

**Data:** 2026-03-26  
**Modo:** Validação estática + verificação por `git` — **sem** novas implementações  
**Base:** `docs/relatorios/BLOCO-F-CIRURGIA-BOTOES-2026-03-26.md` e código atual em `goldeouro-player/src/`

---

## Resumo executivo

A cirurgia documentada está **refletida no código** nos ficheiros esperados. Os botões **PRIMARY** partilham o **mesmo gradiente verde** (`from-green-500` → `to-green-600`, hover para tons mais escuros, texto branco) em Login, Register (estado normal), ForgotPassword, ResetPassword, Pagamentos (CTA + copiar + link MP), Withdraw (submit + modal) e Profile (Salvar). O **SUPER PRIMARY** do footer está implementado com gradiente âmbar/amarelo, anel e sombras; o footer tem `overflow-visible`.

Esta validação é **estática** (leitura de classes e `git diff`). **Não** foi executado browser real: clipping de glow, safe-area iOS e quebras de layout em viewports reais ficam como **pontos a confirmar em QA**.

**Classificação final:** **2. APROVADO COM AJUSTES FINOS** — ver secção “Problemas e divergências” (nenhum bloqueador crítico identificado no código; há divergências menores de consistência e gaps só verificáveis em runtime).

---

## 1. SUPER PRIMARY (“⚽ JOGAR AGORA”) — crítico

**Ficheiro:** `components/InternalPageLayout.jsx`

| Critério | Avaliação estática |
|----------|---------------------|
| Glow / clipping | Footer e wrapper com `overflow-visible`; sombra usa valores explícitos. **Risco residual:** ancestral com `overflow-hidden` fora deste ficheiro (ex.: `#root`) só visível em runtime. |
| Overflow visual estranho | Nada no JSX do footer sugere `overflow: hidden` local. |
| Invasão de outros elementos | Botão isolado em `flex justify-center`; sem `fixed` sobreposto ao conteúdo. |
| Legibilidade | `text-slate-900` sobre gradiente claro — contraste esperado bom. |
| Footer em mobile | Mesma estrutura `py-4 px-4`; **não** há `pb-safe` / `env(safe-area-inset-bottom)` — ver abaixo. |
| Safe-area (iOS) | **Não implementado** no footer. Em dispositivos com home indicator, o botão pode ficar visualmente “colado” à borda inferior até haver padding seguro global ou no layout. |

**Classificação deste bloco:** **OK com ajuste fino** — código coerente com a intenção anti-clipping; **safe-area** e **prova visual de glow** pendentes de teste em dispositivo real.

---

## 2. PRIMARY — consistência global

Todos os alvos listados usam o **mesmo núcleo** de gradiente verde e hover alinhado.

### Divergências reais (não bloqueiam funcionalidade)

| Tema | Detalhe |
|------|---------|
| **Border-radius** | Maioria: `rounded-lg`. **Pagamentos:** CTA principal, botão copiar e link MP usam `rounded-xl`. |
| **Padding horizontal** | Maioria: `py-3 px-6`. **Pagamentos CTA:** `py-3 px-4`. |
| **Hover extra** | **Login** e **Register** (estado não-loading): `hover:scale-105` + sombra verde. **Outros PRIMARY** não têm scale — diferença de micro-interação, não de cor. |
| **Disabled** | **Login**, Reset (submit), Pagamentos: `disabled:opacity-50`. **Withdraw** submit: `disabled:opacity-90` + gradiente cinza quando disabled — **diferente** dos demais. |
| **Estado loading Register** | Fundo `bg-gray-500` quando `isSubmitting` — esperado; não é gradiente. |
| **Copiar PIX (copiado)** | Estado `copiado`: `bg-green-600/90` (sólido), não gradiente — **adequado** para feedback de estado. |

**Conclusão PRIMARY:** padrão de cor/hover **unificado**; restam **inconsistências leves** de raio, padding horizontal, scale e opacidade em disabled (Withdraw).

---

## 3. SECONDARY e TERTIARY

| Aspeto | Avaliação |
|--------|-----------|
| SECONDARY vs PRIMARY | Glass em tiles (Dashboard), voltar em Pagamentos, círculos de voltar, Editar/Cancelar no Perfil — **não** usam o gradiente verde de PRIMARY. |
| Glass | `backdrop-blur`, bordas suaves — coerente com o relatório de cirurgia. |
| TERTIARY | Links amarelos (`text-yellow-400` / `hover:text-yellow-300`) em Login, Register, links Forgot/Reset — **consistente** onde aplicável. |
| Competição com SUPER PRIMARY | Abas do Perfil em **sky** — distintas do dourado do footer. |

**Problema crítico:** nenhum identificado nesta camada.

---

## 4. Profile (área sensível)

| Aspeto | Avaliação |
|--------|-----------|
| Abas ativas | `bg-sky-600/35`, `border-sky-400/60`, `text-white`, `shadow-md` — contraste razoável em fundo escuro (validação visual recomendada). |
| Ativo vs inativo | Inativo: `bg-white/10` + borda clara — **distinção clara** no código. |
| vs SUPER PRIMARY | Sem gradiente âmbar/dourado nas abas — **não compete** com o CTA do footer. |
| Editar / Cancelar / Salvar | Editar e Cancelar em glass; Salvar em PRIMARY verde — **hierarquia** coerente. |

**Risco residual:** sete abas em `flex` numa linha — em viewports estreitas pode haver **scroll horizontal** ou compressão de texto (comportamento **pré-existente** à cirurgia; não invalida a validação dos estilos aplicados).

---

## 5. Pagamentos (alta importância)

| Aspeto | Avaliação |
|--------|-----------|
| CTA “Garantir … chutes” | `w-full`, gradiente verde, `font-bold`, `shadow-lg` — **destaque** adequado em código. |
| Contraste | Texto **branco** sobre gradiente verde — padrão alinhado ao resto do PRIMARY. |
| Copiar / não copiado | Dois estados distintos (gradiente vs `bg-green-600/90`) — **claros**. |
| Texto “Código PIX Gerado com Sucesso!” | Ainda `text-emerald-400` — **não é botão**; pequena **inconsistência de cor** com o verde do botão, cosmética. |

---

## 6. Responsividade

**Validação estática:** não há alteração estrutural (grids, `flex`) introduzida pela cirurgia nos ficheiros alterados, exceto ajuste de largura do spacer em Terms/Privacy (`w-10`).

**O que só o runtime confirma:**

- Glow do SUPER PRIMARY a não “empurrar” layout ou ser cortado por viewport.
- Abas do Perfil em `< 400px` largura.
- Nenhum botão com `w-full` cortado em modais existentes.

---

## 7. Isolamento do game

**Verificação `git diff --name-only HEAD` (repositório local):**

Ficheiros alterados na working tree incluem apenas componentes/páginas do app shell, **não** incluem:

- `goldeouro-player/src/pages/GameFinal.jsx`
- `goldeouro-player/src/pages/game-scene.css`
- `goldeouro-player/src/pages/game-shoot.css`

**Conclusão:** com base na árvore de alterações atual, **nenhum** ficheiro de jogo listado no escopo bloqueado foi modificado. HUD, overlays e `layoutConfig`/`gameService` **não** fazem parte deste diff.

---

## 8. Problemas encontrados (lista objetiva)

1. **PRIMARY:** mistura `rounded-lg` vs `rounded-xl` e `px-6` vs `px-4` (Pagamentos).  
2. **PRIMARY:** `disabled:opacity-90` apenas em Withdraw vs `disabled:opacity-50` noutros.  
3. **SUPER PRIMARY:** ausência de **safe-area** explícita no footer (iOS).  
4. **Pagamentos:** título de sucesso ainda com `text-emerald-400` (não é botão).  
5. **Validação visual:** glow, mobile e iOS **não** verificados neste documento (limitação de método).

**Problema crítico:** **nenhum** identificado só pelo código e pelo diff.

---

## 9. Classificação final

### Opções

1. APROVADO  
2. **APROVADO COM AJUSTES FINOS** ← **aplicável**  
3. REPROVADO  

### Justificativa

- A cirurgia está **aplicada** e **alinhada** ao relatório; o jogo permanece **fora do diff**.  
- Há **divergências menores** de consistência PRIMARY e **gaps** só de runtime (glow, safe-area, abas estreitas).  
- Não há evidência de quebra lógica ou alteração de fluxo.

---

## 10. Checklist recomendado (QA manual / preview)

- [ ] Footer: glow completo visível; sem corte em iPhone/Android.  
- [ ] iOS: safe-area inferior — aceitar ou adicionar padding em iteração futura.  
- [ ] Pagamentos: CTA + copiar em fluxo real PIX.  
- [ ] Withdraw: estados disabled com opacidade aceitável.  
- [ ] Perfil: abas e edição em largura ~320px.  
- [ ] `/game`: smoke test — HUD inalterado.

---

**Status documental (2026-03-26):** classificação **APROVADO COM AJUSTES FINOS**; ajustes finais (safe-area + disabled) aplicados e **encerramento oficial** — `BLOCO-F-ENCERRAMENTO-OFICIAL-2026-03-26.md`.

*Documento de validação em modo READ-ONLY; nenhuma alteração de código foi efetuada.*
