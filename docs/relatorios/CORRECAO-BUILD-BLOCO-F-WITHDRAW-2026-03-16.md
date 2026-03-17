# CORREÇÃO DE BUILD — BLOCO F — WITHDRAW

**Projeto:** Gol de Ouro  
**Bloco:** F — Interface do jogo  
**Data:** 2026-03-16  
**Objetivo:** Liberar build para preview deploy no Vercel (produção não alterada)

---

## 1. Problema identificado

A auditoria read-only (AUDITORIA-COMPLETA-BLOCO-F-INTERFACE-2026-03-16.md) apontou erro de JSX em **Withdraw.jsx**: no retorno principal do componente havia **uma tag `</div>` a mais** antes de `</InternalPageLayout>`, quebrando a árvore de fechamento e gerando:

- *"Unexpected closing «div» tag does not match opening «InternalPageLayout» tag"*
- *"Unterminated regular expression"* (efeito colateral no parser)

Ao executar o build após corrigir Withdraw.jsx, o mesmo tipo de erro foi detectado em **GameShoot.jsx** (linhas 446–449): tag `</div>` extra antes de `</InternalPageLayout>`. A correção em Withdraw sozinha não era suficiente para o build passar; foi aplicada a mesma correção estrutural em GameShoot apenas para desbloquear o build.

---

## 2. Correção aplicada

**Withdraw.jsx:** Removida a tag `</div>` extra que ficava imediatamente antes de `</InternalPageLayout>` no retorno principal (estado “main”). A estrutura passou a ser: `InternalPageLayout` → um `div` (flex-1) → div de background → overlay + div de conteúdo; fechamento com três `</div>` e em seguida `</InternalPageLayout>`.

**GameShoot.jsx:** Removida a tag `</div>` extra que ficava imediatamente antes de `</InternalPageLayout>`. Estrutura: `InternalPageLayout` → um `div` (flex-1) → div (p-6) com o conteúdo; fechamento com dois `</div>` e em seguida `</InternalPageLayout>`.

Nenhuma alteração de layout visual, estados (loading, error, main), props ou lógica; apenas a estrutura JSX foi ajustada para ficar válida.

---

## 3. Arquivo(s) alterado(s)

| Arquivo | Alteração |
|---------|------------|
| `goldeouro-player/src/pages/Withdraw.jsx` | Remoção de uma tag `</div>` antes de `</InternalPageLayout>` no retorno principal. |
| `goldeouro-player/src/pages/GameShoot.jsx` | Remoção de uma tag `</div>` antes de `</InternalPageLayout>` (mesmo padrão, identificado ao rodar o build). |

Nenhum outro arquivo foi modificado (rotas, GameFinal, Pagamentos, backend ou produção).

---

## 4. Validação do build

Comando executado na pasta do frontend:

```bash
npm run build
```

**Resultado:** **Sucesso** (exit code 0).

- Build Vite concluído em ~17s.
- Saída em `dist/` gerada (index.html, assets JS/CSS, PWA, imagens).
- Nenhum erro de transformação ou renderização.

---

## 5. Impacto esperado

- A correção **não altera produção**: nenhum deploy em produção foi feito; nenhum merge para branch de produção.
- Objetivo único: permitir que o **preview deploy no Vercel** seja gerado a partir da branch atual (build passa e o artefato `dist/` pode ser implantado em ambiente de preview).
- Comportamento das telas Withdraw e GameShoot permanece o mesmo; apenas a árvore JSX foi corrigida.

---

## 6. Conclusão objetiva

**O BLOCO F está apto para novo preview deploy no Vercel.**

O build do frontend conclui com sucesso; o erro de JSX que bloqueava o build foi corrigido em Withdraw.jsx e, para desbloquear o build, também em GameShoot.jsx. A produção permanece intacta. A cirurgia cumpriu o objetivo de liberar apenas a validação visual em preview.

---

**Documento gerado em:** 2026-03-16  
**Arquivo:** `docs/relatorios/CORRECAO-BUILD-BLOCO-F-WITHDRAW-2026-03-16.md`
