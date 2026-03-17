# BLOCO F — CIRURGIA FINAL DA INTERFACE

**Projeto:** Gol de Ouro  
**Modo:** SURGICAL MODE  
**Data:** 2026-03-09  

## Objetivo

Aplicar todas as mudanças aprovadas no BLOCO F **sem alterar gameplay ou backend**.

---

## 1 — REMOÇÃO DA TOPBAR

Removida a `TopBar` das páginas:

- `/dashboard` — `Dashboard.jsx`
- `/profile` — `Profile.jsx`
- `/pagamentos` — `Pagamentos.jsx`
- `/withdraw` — `Withdraw.jsx`
- `/gameshoot` — `GameShoot.jsx`

**Não alterado:** `/game` (página do jogo em tela cheia).

---

## 2 — NAVEGAÇÃO INTERNA

Criado o componente **`InternalPageLayout`** (`goldeouro-player/src/components/InternalPageLayout.jsx`) com o padrão:

**Topo:**
- ← **MENU PRINCIPAL** (volta para `/dashboard`)
- Logo centralizada + **título da página**
- Opcional: **SAIR DA CONTA** (quando `showLogout={true}`)

**Rodapé:**
- Botão centralizado **⚽ JOGAR AGORA** (navega para `/game`)

Todas as páginas listadas no item 1 passaram a usar este layout em substituição à TopBar.

---

## 3 — PROFILE — BOTÃO SAIR DA CONTA

- `Profile.jsx` utiliza `InternalPageLayout` com **`showLogout`**.
- O botão **SAIR DA CONTA** aparece no header do layout (canto direito) e chama `logout()` do `AuthContext` e redireciona para `/`.

---

## 4 — PAGAMENTOS — REMOÇÕES

No arquivo **`src/pages/Pagamentos.jsx`** foram removidos:

- Bloco **Saldo atual** (e a chamada à API de profile apenas para saldo na tela de pagamentos).
- **TopBar** (substituída pelo `InternalPageLayout`).
- Botão **Verificar** no bloco do pagamento PIX criado.
- Coluna **Ações** do histórico (e o botão "Verificar" por linha).

---

## 5 — VALORES DE RECARGA

O array de valores foi alterado de:

`[10, 25, 50, 100, 200, 500]`

para:

**5, 10, 20, 50, 100, 200**

---

## 6 — CARD RECOMENDADO (R$ 20)

Para o valor **20**:

- Badge **RECOMENDADO** no topo do card.
- Borda dourada (amber) e destaque quando selecionado.
- Glow leve (`shadow-amber-500/20`, `ring-amber-400/50`).

---

## 7 — CTA

Texto do botão principal de recarga alterado de:

- **"Recarregar R$ X"**

para:

- **"Garantir X chutes"** (X = valor selecionado).

---

## 8 — PIX — COPIA E COLA

- Código copia e cola mantido.
- Botão: **"📋 Copiar código PIX"** → após clicar: **"✅ Código copiado!"**
- Instrução exibida: **"Abra o app do seu banco e cole o código PIX."**
- QR Code permanece inalterado (quando existir na resposta).

---

## 9 — HISTÓRICO — COLUNAS

Colunas finais da tabela de histórico:

- **Data**
- **Valor**
- **Status**

Coluna **Ações** removida.

---

## 10 — STATUS — BADGES ESTILO FINTECH

Aplicados badges:

- **✓ Aprovado** — estilo emerald (verde).
- **⏳ Pendente** — estilo amber (âmbar).
- Rejeitado/outros mantidos com estilo consistente (vermelho/cinza).
- Uso de bordas e fundo semitransparente (tema escuro).

---

## 11 — TEMA PAGAMENTOS

- **Tema escuro:** fundo `bg-slate-900/95`, textos em branco/opacidade.
- **Glassmorphism:** cards com `bg-white/5`, `backdrop-blur-xl`, `border-white/10`.
- Inputs e botões ajustados para contraste no tema escuro.

---

## 12 — NÃO ALTERADO (CONFIRMAÇÃO)

- **layoutConfig** — não utilizado nesta cirurgia; não alterado.
- **stage**, **HUD**, **gameplay** — não alterados.
- **API endpoints** — nenhuma alteração.
- **processShot**, **initializeGame** — não alterados.
- Página **`/game`** — não alterada.

---

## Arquivos alterados

| Arquivo | Alteração |
|--------|-----------|
| `goldeouro-player/src/components/InternalPageLayout.jsx` | **Criado** — layout interno com header (MENU PRINCIPAL, Logo, título, SAIR) e footer (JOGAR AGORA). |
| `goldeouro-player/src/pages/Dashboard.jsx` | TopBar removida; conteúdo envolvido em `InternalPageLayout` (título "Início"). |
| `goldeouro-player/src/pages/Profile.jsx` | TopBar removida; `InternalPageLayout` com `showLogout`; botão SAIR DA CONTA no header. |
| `goldeouro-player/src/pages/Withdraw.jsx` | TopBar removida em todos os retornos (loading, error, main); `InternalPageLayout` (título "Saque"). |
| `goldeouro-player/src/pages/GameShoot.jsx` | TopBar removida; `InternalPageLayout` (título "Gol de Ouro"); fundo preservado no conteúdo. |
| `goldeouro-player/src/pages/Pagamentos.jsx` | TopBar, saldo, Verificar e coluna Ações removidos; valores [5,10,20,50,100,200]; card 20 RECOMENDADO; CTA "Garantir X chutes"; PIX copy/instrução; histórico Data/Valor/Status; badges ✓ Aprovado / ⏳ Pendente; tema escuro + glassmorphism. |

---

## Resumo

- **Interface:** cirurgia aplicada conforme especificação do BLOCO F.
- **Gameplay e backend:** sem alterações.
- **Relatório:** `docs/relatorios/BLOCO-F-CIRURGIA-2026-03-09.md`.
