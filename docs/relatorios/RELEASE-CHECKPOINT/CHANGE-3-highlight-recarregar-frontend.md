# CHANGE #3 — Destaque temporário no botão Recarregar (frontend)

**Data:** 2026-02-05  
**Escopo:** Apenas frontend (goldeouro-player). Sem alteração de backend, regras de bloqueio, fluxo financeiro, rotas ou novos botões.

---

## 1. Objetivo

Quando o usuário tentar jogar sem saldo (mesmo caso do CHANGE #2), além do toast com a mensagem amigável:

- Aplicar um **destaque visual temporário** no botão "Recarregar" (pulse/glow) por alguns segundos.
- O destaque deve ser discreto, elegante e removido automaticamente.
- Guiar o usuário para o botão existente, sem criar novos botões nem alterar navegação.

---

## 2. Arquivos alterados

| Arquivo | Alteração |
|---------|-----------|
| `goldeouro-player/src/pages/GameShoot.jsx` | Estado `highlightRecharge`, ref para timer, detecção da mensagem do CHANGE #2 no `catch` de `handleShoot`, aplicação de classes de destaque no botão "Recarregar", cleanup do timer no desmontar. |

**Nenhum outro arquivo foi alterado.** Nenhum CSS externo nem biblioteca nova foi adicionada; as classes usadas são Tailwind já presentes no projeto.

---

## 3. Descrição do efeito aplicado

### Quando o destaque é ativado

- **Condição:** O erro exibido ao usuário é exatamente a mensagem do CHANGE #2: `"Você está sem saldo. Adicione saldo para jogar."`
- **Origem:** Tanto quando o backend retorna 400 com "Saldo insuficiente" (traduzido pelo gameService) quanto quando a checagem local no gameService dispara o mesmo texto.

### Efeito visual

- **Classes aplicadas quando `highlightRecharge === true`:**
  - `ring-2 ring-yellow-400` — anel amarelo ao redor do botão
  - `ring-offset-2 ring-offset-gray-900` — pequeno afastamento do anel em relação ao fundo
  - `shadow-lg shadow-yellow-400/50` — sombra amarelada (glow)
  - `animate-pulse` — animação de pulsação (opacidade) do Tailwind
- **Duração:** 3 segundos (3000 ms).
- **Remoção:** Após 3 segundos um `setTimeout` chama `setHighlightRecharge(false)`, removendo as classes. Se o componente for desmontado antes, um `useEffect` de cleanup limpa o timer para evitar atualização de estado em componente desmontado.

### Alvo do destaque

- Botão "💳 Recarregar" no header da página `/game` (e `/gameshoot`), que navega para `/pagamentos`.
- Foi adicionado `id="btn-recarregar"` para referência estável (testes ou futuras extensões).

---

## 4. Trechos de código alterado

### Estado e ref (após estados de áudio)

```javascript
  // Destaque temporário no botão Recarregar (CHANGE #3)
  const [highlightRecharge, setHighlightRecharge] = useState(false);
  const highlightTimerRef = useRef(null);
```

### Cleanup no desmontar

```javascript
  // CHANGE #3: limpar timer de highlight ao desmontar
  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = null;
      }
    };
  }, []);
```

### No catch de handleShoot (após toast.error)

```javascript
      // CHANGE #3: destaque temporário no botão Recarregar quando saldo insuficiente
      if (error.message === 'Você está sem saldo. Adicione saldo para jogar.') {
        setHighlightRecharge(true);
        if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = setTimeout(() => {
          setHighlightRecharge(false);
          highlightTimerRef.current = null;
        }, 3000);
      }
```

### Botão Recarregar

```jsx
                <button
                  id="btn-recarregar"
                  onClick={() => navigate('/pagamentos')}
                  className={`bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium ${highlightRecharge ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-900 shadow-lg shadow-yellow-400/50 animate-pulse' : ''}`}
                >
                  💳 Recarregar
                </button>
```

---

## 5. Risco residual

- **Avaliação:** Baixo.
- **Motivos:**
  - Alteração restrita ao componente GameShoot: um estado, um ref, um useEffect de cleanup e a condição no catch que depende da string exata do CHANGE #2.
  - Nenhuma mudança em backend, rotas, navegação, fluxo financeiro ou regras de bloqueio por saldo.
  - Nenhum novo botão; apenas destaque no botão "Recarregar" já existente.
  - Timer é limpo no desmontar, evitando memory leaks e setState após unmount.
- **Possível edge case:** Se a mensagem do CHANGE #2 for alterada no gameService, a condição `error.message === 'Você está sem saldo. Adicione saldo para jogar.'` deixará de ser verdade e o destaque não será ativado até o frontend ser ajustado para a nova string.

---

## 6. Checklist de testes manuais

- [ ] **Usuário sem saldo (tentativa de chute):** Com saldo menor que a aposta, provocar o fluxo de erro (toast do CHANGE #2). Esperado: toast "Você está sem saldo. Adicione saldo para jogar." e botão "Recarregar" com destaque (anel amarelo + sombra + pulse) por ~3 segundos, depois destaque some.
- [ ] **Usuário com saldo:** Jogar normalmente. Esperado: nenhum destaque no botão Recarregar.
- [ ] **Outro erro da API (ex.: direção inválida):** Provocar erro que não seja saldo insuficiente. Esperado: toast com a mensagem do erro; botão Recarregar **não** deve destacar.
- [ ] **Clique no Recarregar:** Com ou sem destaque, clicar no botão. Esperado: navegação para `/pagamentos` como antes; comportamento original preservado.
- [ ] **Sair da página durante o destaque:** Enquanto o botão está destacado, navegar para outra rota (ex.: sair de /game). Esperado: nenhum erro no console; timer limpo no unmount.

---

## 7. Confirmação explícita

- **Backend:** Nenhuma alteração.
- **Regras de bloqueio por saldo:** Não alteradas (continuam no gameService e na UI com `balance < currentBet`).
- **Fluxo financeiro / PIX / endpoints / valores:** Não alterados.
- **Novos botões:** Nenhum.
- **Rotas / navegação:** Inalteradas; o botão continua fazendo `navigate('/pagamentos')`.
- **Deploy / commit:** Não realizados automaticamente.

---

*CHANGE #3 implementado. Pronto para commit separado.*
