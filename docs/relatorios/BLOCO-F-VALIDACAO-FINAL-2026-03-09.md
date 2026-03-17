# BLOCO F — VALIDAÇÃO FINAL DA INTERFACE

**Projeto:** Gol de Ouro  
**Modo:** READ-ONLY (nenhum código ou arquivo alterado)  
**Data:** 2026-03-09  

---

## Objetivo

Validar se a cirurgia final do BLOCO F foi aplicada corretamente e se a interface está pronta para a V1, considerando estrutura, navegação, UX e consistência visual.

---

## 1. Validação página por página

### 1.1 Remoção da TopBar

| Página       | Rota         | TopBar presente? | Resultado |
|-------------|--------------|------------------|-----------|
| Dashboard   | /dashboard   | Não              | ✅ OK     |
| Profile     | /profile     | Não              | ✅ OK     |
| Pagamentos  | /pagamentos  | Não              | ✅ OK     |
| Withdraw    | /withdraw    | Não              | ✅ OK     |
| GameShoot   | /gameshoot   | Não              | ✅ OK     |

- **Dashboard:** importa apenas `InternalPageLayout`; não importa `TopBar`. Conteúdo envolvido em `<InternalPageLayout title="Início">`.
- **Profile:** importa apenas `InternalPageLayout`; não importa `TopBar`. Uso de `<InternalPageLayout title="Perfil" showLogout>`.
- **Pagamentos:** importa apenas `InternalPageLayout`; não importa `TopBar`. Uso de `<InternalPageLayout title="Pagamentos">`.
- **Withdraw:** importa apenas `InternalPageLayout`; não importa `TopBar`. Uso de `InternalPageLayout` nos três retornos (loading, error, main) com título "Saque".
- **GameShoot:** importa apenas `InternalPageLayout`; não importa `TopBar`. Uso de `<InternalPageLayout title="Gol de Ouro">`.

**Página /game:** A rota `/game` renderiza o componente `GameFinal` (App.jsx). Em `GameFinal.jsx` não há importação nem uso de `TopBar` ou `InternalPageLayout`. A interface do jogo permanece em tela cheia, sem TopBar externa. ✅ **Confirmado.**

---

### 1.2 Padrão de navegação (InternalPageLayout)

O componente `InternalPageLayout.jsx` existe e exporta o layout com:

- **← MENU PRINCIPAL** — botão à esquerda, `onClick` para `navigate('/dashboard')`. ✅
- **Logo centralizada + título** — bloco central com `<Logo size="small" className="w-8 h-8" />` e `<h1>{title}</h1>`. ✅
- **⚽ JOGAR AGORA** — botão no footer, `onClick` para `navigate('/game')`. ✅

Todas as páginas listadas no item 1.1 utilizam `InternalPageLayout` com o título adequado (Início, Perfil, Pagamentos, Saque, Gol de Ouro). ✅ **Confirmado.**

---

### 1.3 Centralização real do header

**Estrutura do header (InternalPageLayout):**

- `header` com `flex items-center justify-between`.
- Esquerda: botão "← MENU PRINCIPAL" (largura definida pelo texto).
- Centro: `div` com `flex items-center gap-2` contendo Logo e título.
- Direita: quando `showLogout` é false, um espaçador `<div className="w-24 md:w-28" aria-hidden />`; quando true, botão "SAIR DA CONTA".

**Análise:**

- O bloco Logo + título **não** está centralizado geometricamente na viewport; está no “meio” do espaço entre o primeiro e o último item do `justify-between`. Como o texto "← MENU PRINCIPAL" tende a ser mais largo que `w-24`/`w-28`, o centro visual pode ficar ligeiramente deslocado para a **esquerda**.
- O espaçador à direita (`w-24` / `w-28`) tenta equilibrar a largura à esquerda; em telas pequenas ou com fontes maiores, o equilíbrio pode não ser perfeito.

**Conclusão:** Centralização aproximada, com risco de desalinhamento visual em alguns viewports. Recomendação: considerar layout com grid de 3 colunas iguais ou `flex-1` nos lados para centralização geométrica real (apenas documentada; sem alteração de código nesta validação).

---

### 1.4 Padronização dos botões do layout

| Botão             | Fonte      | Peso   | Tamanho | Cor / estilo                    | Border radius |
|------------------|------------|--------|---------|----------------------------------|---------------|
| ← MENU PRINCIPAL | (herdado)  | medium | text-sm | text-white/90 hover:text-white  | (nenhum)      |
| ⚽ JOGAR AGORA   | (herdado)  | bold   | (base)  | bg-yellow-500, text-black       | rounded-xl    |
| SAIR DA CONTA    | (herdado)  | medium | text-sm | text-red-400 hover:text-red-300 | (nenhum)      |

**Inconsistências identificadas:**

- **Tamanho:** "← MENU PRINCIPAL" e "SAIR DA CONTA" usam `text-sm`; "⚽ JOGAR AGORA" usa tamanho base (maior).
- **Peso:** "JOGAR AGORA" é `font-bold`; os outros são `font-medium`.
- **Border radius:** Apenas "⚽ JOGAR AGORA" tem `rounded-xl`; os outros não têm classe de borda explícita (aparência reta ou padrão do navegador).
- **Estilo:** Dois botões são texto plano; um é botão preenchido (amarelo). Consistência aceitável para hierarquia (CTA principal no rodapé), mas há diferença de padrão entre header e footer.

Nenhuma inconsistência crítica; adequado para V1 com ressalva de evolução futura (design system).

---

### 1.5 Profile — botão SAIR DA CONTA

- **Uso de showLogout:** Em `Profile.jsx` linha 154: `<InternalPageLayout title="Perfil" showLogout>`. ✅
- **Exclusividade:** `Dashboard`, `Withdraw`, `Pagamentos` e `GameShoot` usam `InternalPageLayout` **sem** a prop `showLogout` (valor default `false`). Apenas Profile passa `showLogout`. ✅
- **Comportamento:** No layout, quando `showLogout` é true, é renderizado o botão "SAIR DA CONTA" que chama `handleLogout` → `logout()` do `useAuth()` e `navigate('/')`. ✅ **Confirmado.**

---

### 1.6 Página /pagamentos — checklist

**Arquivo:** `src/pages/Pagamentos.jsx`

| Item                    | Esperado                         | Encontrado |
|-------------------------|----------------------------------|------------|
| TopBar                  | Removida                         | ✅ Não importada; usa InternalPageLayout |
| Saldo atual             | Removido                         | ✅ Nenhum bloco "Saldo atual"; não há chamada à API de profile para exibir saldo nesta tela |
| Valores de recarga      | 5, 10, 20, 50, 100, 200          | ✅ `valoresRecarga = [5, 10, 20, 50, 100, 200]` (linha 17) |
| Card R$ 20 recomendado  | Badge RECOMENDADO, borda dourada, glow | ✅ Badge "Recomendado", borda amber, `shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/50` quando selecionado |
| CTA principal          | "Garantir X chutes"              | ✅ `Garantir ${valorRecarga} chutes` (linha 193) |

---

### 1.7 Bloco PIX

| Item                         | Esperado                                      | Encontrado |
|-----------------------------|-----------------------------------------------|------------|
| PIX copia e cola primeiro   | Código copia e cola exibido quando disponível | ✅ Bloco condicionado a `pix_code || qr_code || pix_copy_paste` (linha 243) |
| Botão antes do clique       | "📋 Copiar código PIX"                        | ✅ Texto exato (linha 269) |
| Botão após clique           | "✅ Código copiado!"                           | ✅ Texto exato (linha 269) |
| Instrução visível           | "Abra o app do seu banco e cole o código PIX." | ✅ Parágrafo com esse texto (linhas 272-274) |
| QR Code                     | Inalterado                                    | ✅ Nenhuma alteração no fluxo de exibição do QR Code (não removido nem alterado no trecho validado) |

---

### 1.8 Histórico de pagamentos

- **Colunas da tabela:** Data, Valor, Status (linhas 318-322). ✅
- **Coluna Ações:** Não presente no `<thead>` nem no `<tbody>`. ✅
- **Botão Verificar:** Não há botão "Verificar" por linha nem no bloco do pagamento PIX atual. ✅ **Confirmado.**

---

### 1.9 Badges de status

- **approved:** `getStatusText` retorna `'✓ Aprovado'`; `getStatusColor` retorna classes emerald (text-emerald-400, bg-emerald-500/20, border). ✅
- **pending:** `getStatusText` retorna `'⏳ Pendente'`; `getStatusColor` retorna classes amber. ✅
- Estilo fintech: bordas e fundos semitransparentes, ícones no texto. ✅ **Consistência visual confirmada.**

---

### 1.10 Tema Pagamentos

- **Tema escuro:** Container principal `bg-slate-900/95`; textos em branco e opacidades (text-white, text-white/70, etc.). ✅
- **Glassmorphism:** Cards e blocos com `bg-white/5`, `backdrop-blur-xl`, `border border-white/10`, `rounded-2xl`. ✅
- Header da página, cards de recarga, instruções PIX, bloco do pagamento atual e histórico seguem o mesmo padrão. ✅ **Consistente.**

---

### 1.11 Página /game (GameFinal)

- **Componente:** Rota `/game` → `GameFinal` (App.jsx). Nenhum import de TopBar ou InternalPageLayout em `GameFinal.jsx`. ✅
- **layoutConfig:** Uso de `STAGE`, `BALL`, `GOALKEEPER`, `TARGETS`, `OVERLAYS`, `HUD`, etc. de `../game/layoutConfig`. Nenhuma alteração exigida nesta validação. ✅
- **Stage, HUD, animações, sons, gameplay:** Nenhuma verificação de alteração feita na cirurgia do BLOCO F; a cirurgia foi restrita à interface das páginas internas (Dashboard, Profile, Pagamentos, Withdraw, GameShoot) e não ao GameFinal. ✅ **Interface do jogo permanece idêntica em relação às mudanças do BLOCO F.**

---

## 2. Inconsistências encontradas

1. **Centralização do header:** Logo + título não estão no centro geométrico da tela; dependem do equilíbrio entre largura do botão esquerdo e do espaçador direito. Pode haver desvio visual em alguns viewports.
2. **Botões do InternalPageLayout:** Diferença de tamanho (text-sm vs base), peso (medium vs bold) e uso de borda (rounded-xl só no JOGAR AGORA). Aceitável para V1, mas registrado para evolução de design system.

Nenhuma inconsistência que impeça o uso em produção para V1.

---

## 3. Problemas visuais

- **Possível desalinhamento do centro do header** em telas médias ou quando "SAIR DA CONTA" está visível (Profile), pois o lado direito deixa de ser um espaçador fixo e passa a ser um botão de largura variável. Pode ser sentido como leve desbalanceamento.
- Demais aspectos (tema escuro, glassmorphism em Pagamentos, badges, tabela) estão coerentes e sem problemas visuais críticos identificados no código.

---

## 4. Recomendações finais

1. **Opcional (pós-V1):** Ajustar o header do `InternalPageLayout` para centralização geométrica real (ex.: grid de 3 colunas com `flex-1` nas laterais e conteúdo central fixo).
2. **Opcional:** Unificar tamanho/peso dos botões do layout (ex.: todos `text-sm` ou todos com mesmo border-radius) em uma próxima etapa de design system.
3. Manter a página `/game` (GameFinal) fora de qualquer layout com TopBar/InternalPageLayout, como está hoje.

---

## 5. Resumo da validação

| Critério                         | Status |
|----------------------------------|--------|
| TopBar removida nas 5 páginas    | ✅     |
| /game sem TopBar externa         | ✅     |
| InternalPageLayout em todas     | ✅     |
| ← MENU PRINCIPAL, Logo, título   | ✅     |
| ⚽ JOGAR AGORA no rodapé         | ✅     |
| SAIR DA CONTA apenas em /profile | ✅     |
| Pagamentos: valores 5..200       | ✅     |
| Card R$ 20 recomendado           | ✅     |
| CTA "Garantir X chutes"          | ✅     |
| PIX copia e cola + texto botão  | ✅     |
| Instrução "Abra o app..."        | ✅     |
| Histórico: Data, Valor, Status   | ✅     |
| Sem coluna Ações / Verificar     | ✅     |
| Badges ✓ Aprovado, ⏳ Pendente   | ✅     |
| Tema escuro + glassmorphism      | ✅     |
| /game inalterada (layout/jogo)   | ✅     |

---

## CLASSIFICAÇÃO FINAL

**INTERFACE VALIDADA COM RESSALVAS**

A cirurgia do BLOCO F foi aplicada corretamente: TopBar removida, InternalPageLayout adotado, Pagamentos com valores, card recomendado, CTA, PIX, histórico, badges e tema conforme especificação. A página `/game` permanece sem alterações de interface. As ressalvas são apenas de refinamento (centralização geométrica do header e padronização futura dos botões do layout) e não impedem o uso da interface para a V1.
