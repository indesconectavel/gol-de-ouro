# CHANGE #1 — Pagamentos UI PIX (Presets, Topo Copia e Cola, Default 200)

**Data:** 2026-02-05  
**Branch:** `feat/payments-ui-pix-presets-top-copy`  
**Modo:** SAFE CHANGE (apenas frontend goldeouro-player)

---

## Objetivo do change

Ajustes de UI/UX na página de Pagamentos PIX, sem alterar backend, endpoints ou fluxo de criação do PIX:

- **A)** Presets de recarga rápida: R$ 1, R$ 5, R$ 10, R$ 25, R$ 50, R$ 100  
- **B)** Valor personalizado com default **R$ 200** (definitivo)  
- **C)** Bloco "PIX Copia e Cola" no topo da tela (acima dos demais) + auto-scroll suave após gerar PIX  
- **D)** Remoção da seção "Saldo atual R$ 0,00" apenas na página Pagamentos (saldo global do app mantido)

---

## Arquivos alterados

| Arquivo | Alterações |
|---------|------------|
| `goldeouro-player/src/pages/Pagamentos.jsx` | Presets, default 200, ref scroll, bloco PIX no topo, remoção do saldo no header |

Nenhum arquivo de backend, banco, Supabase ou webhooks foi alterado.

---

## Evidência dos presets novos

- **Antes:** `valoresRecarga = [10, 25, 50, 100, 200, 500]`  
- **Depois:** `valoresRecarga = [1, 5, 10, 25, 50, 100]`

Trecho no código (linha ~22):

```javascript
const valoresRecarga = [1, 5, 10, 25, 50, 100];
```

Os botões de recarga rápida exibem: **R$ 1**, **R$ 5**, **R$ 10**, **R$ 25**, **R$ 50**, **R$ 100**.

---

## Evidência do default 200

- **Antes:** `useState(10)` para `valorRecarga`  
- **Depois:** `useState(200)` para `valorRecarga`

Trecho no código (linha ~16):

```javascript
const [valorRecarga, setValorRecarga] = useState(200);
```

O campo "Valor personalizado" inicia em **R$ 200,00**.

---

## Evidência do bloco PIX Copia e Cola no topo + scroll

- O bloco "Pagamento PIX Criado" (código PIX / Copia e Cola) foi **movido** para logo após o header da página, **acima** do grid (Recarga PIX + Como funciona o PIX).  
- Quando existe `pagamentoAtual`, esse bloco é renderizado no topo (comentário no código: `{/* PIX Copia e Cola - no topo quando existir pagamento ativo */}`).  
- Foi adicionado `useRef` (`pixCopiaColaRef`) no container desse bloco.  
- Após criação bem-sucedida do PIX, é chamado:

  `pixCopiaColaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });`

  com `setTimeout(..., 150)` para garantir o paint antes do scroll.

Trechos no código:

- Ref: `const pixCopiaColaRef = useRef(null);`
- Container no topo: `<div ref={pixCopiaColaRef} className="...">` no bloco condicional `{pagamentoAtual && (...)}`  
- Scroll após sucesso (dentro de `criarPagamentoPix`):  
  `setTimeout(() => { pixCopiaColaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 150);`

---

## Evidência da remoção do "Saldo atual R$ 0,00"

- Foi removido o bloco do header que exibia "Saldo atual" e "R$ {saldo.toFixed(2)}" na página de Pagamentos.  
- O botão "← Voltar" e o título/subtítulo da página foram mantidos.  
- O estado `saldo` e a chamada a `setSaldo` em `carregarDados` foram **mantidos** (não quebra renderização e não altera saldo global do app).

Trecho removido (antes existia entre o título e o botão Voltar):

```jsx
<div className="text-right">
  <p className="text-sm text-gray-500">Saldo atual</p>
  <p className="text-2xl font-bold text-green-600">R$ {saldo.toFixed(2)}</p>
</div>
```

---

## Resultado do build

**Comando:**  
`cd goldeouro-player ; npx vite build`

**Status:** **Sucesso** (exit code 0)

**Saída resumida:**

- `vite v5.4.20 building for production...`
- `✓ 1789 modules transformed.`
- `✓ built in 8.34s`
- Arquivos gerados em `dist/` (index.html, assets CSS/JS, PWA).

Nenhum erro de lint ou build reportado para `Pagamentos.jsx`.

---

## Commit

- **Mensagem:** `feat: payments UI pix presets + copy-top + default 200 (v1 safe)`
- **Branch:** `feat/payments-ui-pix-presets-top-copy`

---

## Checklist de regras (V1 Safe)

- [x] Alterar apenas frontend (goldeouro-player)  
- [x] Não mexer em backend, banco, Supabase, webhooks  
- [x] Não mudar endpoints nem autenticação  
- [x] Não alterar fluxo de criação do PIX, só UI/UX  
- [x] Build frontend OK  
- [x] Relatório e evidências documentados
