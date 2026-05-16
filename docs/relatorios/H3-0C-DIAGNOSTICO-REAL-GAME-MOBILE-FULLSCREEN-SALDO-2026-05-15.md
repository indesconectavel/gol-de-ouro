# H3.0C — DIAGNÓSTICO REAL /GAME MOBILE + FULLSCREEN + SALDO

**Data:** 2026-05-15  
**Modo:** read-only — sem alterações de código, deploy, backend, financeiro, banco ou admin  
**Commit referência H3.0B (repo):** `dac9f8b` — `fix: polir game mobile H3.0B`  
**Domínio analisado (prod atual):** `https://www.goldeouro.lol`

---

## 1. Resumo executivo

A evidência direta sobre **`www.goldeouro.lol`** indica que **o frontend público não está a servir o bundle HTML/JS da cirurgia H3.0B**:

| Artefacto | Produção ao vivo | H3.0B em `dac9f8b` (fonte) |
|-----------|-------------------|---------------------------|
| **`<meta name="viewport">`** | `width=device-width, initial-scale=1.0` **sem** `viewport-fit=cover` | Inclui `viewport-fit=cover` (`goldeouro-player/index.html`) |
| **Bundle JS — texto overlay** | **Ausência** de `"Gire"`, `"celular"`, `"paisagem"` e `"game-rotate"` no `index-CoJBA5Cq.js` | JSX explícito com **«Gire o celular»** e classe **`game-rotate`** (`GameFinal.jsx`) |
| **CSS agregado** | Presença de **`game-rotate`**, **`orientation: portrait`**, **`safe-area-inset`** no CSS servido | Regras alinhadas com `game-scene.css` (CSS pode coexistir sem JSX novo em builds mistos ou merges antigos) |

**Conclusão principal:** os sintomas observados no telemóvel (**overlay não aparece**, **`viewport-fit` ausente**, **expectativa de “fullscreen browser”**) são **compatíveis primeiro com falta de deploy do pacote que inclui H3.0B**, não com falha intrínseca da patch já mergeada no Git — porque **o servidor público não contém as strings/DOM-changes próprias da H3.0B no JS**.

Em paralelo, **`fullscreen tipo cinema`** dentro do Safari/Chrome **móvel em modo tab** é **limitado pela própria plataforma**; **`display: standalone`** na manifest só vale quando o utilizador **abre como PWA** (“Adicionar ao ecrã inicial”). Isso explica parte das queixas **mesmo após** um bom deploy.

Para saldo: não existe copiar-pegar literal **«Você precisa de saldo para chutar»** no fluxo atual de **`GameFinal`**; o produtor esperado é **`toast.error`** com **«Saldo insuficiente…»**, zonas **disabled**, e o backend devolvendo **`Saldo insuficiente`** em `POST /api/games/shoot`.

### Classificação executiva (pedido)

| Etiqueta | Aplicação |
|----------|-----------|
| **DEPLOY NECESSÁRIO** | **Sim** — publicar build gerado a partir de **`dac9f8b`** (ou posterior equivalente) em **`www.goldeouro.lol`**. |
| **CORREÇÃO NECESSÁRIA** | **Não como causa primeira** da divergência observada entre prod e repo para overlay/`viewport-fit`; após deploy, revalidar; só então falar em bugs residuais. |
| **LIMITAÇÃO DE BROWSER/PWA** | **Sim** — barra de URL **não é eliminável por CSS** em navegação normal; PWA **standalone** reduz chrome do sistema. |
| **BLOQUEADO** | **Não** no sentido técnico “patch impossível”; **bloqueio operacional** = gate de **deploy** + **expectativa de UX** realista para browser vs PWA. |

---

## 2. Estado Git (workspace local)

| Item | Valor |
|------|--------|
| **HEAD inspecionado** | `dac9f8ba012c13607116af7bf15d58a95d242c35` |
| **Último commit** | `dac9f8b fix: polir game mobile H3.0B` |

*Nota:* Isto confirma apenas que **no repositório** a H3.0B existe; **não** implica que Fly/Vercel CDN já a sirva em produção.

---

## 3. Bundle atual em produção

### 3.1 HTML (`GET https://www.goldeouro.lol/`)

**Viewport servido (extracto real):**

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

**Observações:**

- **Sem** `viewport-fit=cover` — diverge do `index.html` em **`dac9f8b`**.
- Existe **`link rel="manifest"`** para **`/manifest.webmanifest`** e script **`registerSW.js`** (PWA registada).

### 3.2 JavaScript principal

| Campo | Valor |
|-------|--------|
| **Ficheiro** | `/assets/index-CoJBA5Cq.js` |
| **Tamanho observado** | ~401 KiB |

**Procura textual (substring):**

| String | Presente? |
|--------|-----------|
| `Gire` | **Não** |
| `game-rotate` | **Não** |
| `orientation:portrait` | **Não** |
| `celular` | **Não** |
| `paisagem` | **Não** |
| `Saldo insuficiente` | **Sim** |
| `game-viewport` | **Sim** |
| `game-scale` | **Sim** |

Interpretação: o bundle JS público **corresponde a uma versão anterior à inclusão do bloco JSX `.game-rotate` / textos em PT da H3.0B**, ou a uma linha de build que tree-shook/mangling diferente — mas **a ausência conjunta de “Gire”, “celular” e “paisagem”** é forte indicador de **overlay H3.0B não embutido**.

### 3.3 CSS principal

| Campo | Valor |
|-------|--------|
| **Ficheiro** | `/assets/index-B3MUvJMy.css` |

**Substrings:**

| Padrão | Presente? |
|--------|-----------|
| `game-rotate` | **Sim** |
| `orientation: portrait` | **Sim** |
| `safe-area-inset` | **Sim** |

Interpretação: folhas agregadas já **carregam regras relacionadas com retrato/safe-area**, mas **sem o markup React correspondente no JS atual**, o utilizador **não vê** o cartão **«Gire o celular»** nem o comportamento completo da Opção A da H3.0B.

### 3.4 Manifest PWA (produção)

**Conteúdo coerente com `vite.config.ts`:** `display: "standalone"` (via manifest gerado). Isso **não força** modo standalone quando o utilizador abre um URL normal num browser tab — só quando instala/abre como app.

---

## 4. H3.0B está ou não em produção

| Critério H3.0B | Em `dac9f8b` (repo) | Em `www.goldeouro.lol` (medido 2026-05-15) |
|----------------|---------------------|-------------------------------------------|
| **`viewport-fit=cover`** no HTML | Sim (`index.html`) | **Não** |
| **Overlay JSX «Gire o celular»** | Sim (`GameFinal.jsx`) | **Não evidenciado no JS servido** |
| **CSS portrait / safe-area** | Sim (`game-scene.css`) | **Sim** (CSS servido) |

**Veredito:** **H3.0B não está deployed de forma consistente no domínio público analisado** — pelo menos o pacote **HTML + JS** não reflete o conjunto H3.0B descrito no commit **`dac9f8b`**.

---

## 5. Diagnóstico do overlay portrait

### 5.1 No código H3.0B

Bloco presente em `GameFinal.jsx` (trecho ilustrativo):

```624:635:goldeouro-player/src/pages/GameFinal.jsx
      {/* H3.0B — portrait: overlay orientação (CSS em game-scene.css) */}
      <div
        className="game-rotate"
        role="dialog"
        aria-live="polite"
        aria-label="Orientação do dispositivo"
      >
        <div className="rotate-card">
          <p className="rotate-title">Gire o celular</p>
          <p className="rotate-sub">Use o modo horizontal (paisagem) para jogar.</p>
        </div>
      </div>
```

### 5.2 Na produção medida

- JS **`index-CoJBA5Cq.js`** **não contém** os literais esperados (**«Gire»**, **«celular»**, **«paisagem»**).
- Logo, **a causa mais provável da não-aparição do overlay no telemóvel em produção é ausência desse código no bundle deployed**, não falha isolada da `@media (orientation: portrait)` em CSS.

### 5.3 Por que `orientation: portrait` “devia” funcionar no telemóvel real

Quando o bundle correto estiver em produção:

- Em **retrato físico**, `orientation: portrait` deve aplicar-se normalmente em Safari iOS e Chrome Android.
- **Exceções raras:** alguns modos “desktop site”, dobras, ou browsers que reportam dimensões estranhas — marginal face à evidência **de bundle antigo**.

---

## 6. Diagnóstico do fullscreen mobile

### 6.1 Browser normal (tab Safari / Chrome)

- **Não existe API web standard** que force **ocultação permanente da barra de URL** só com CSS/HTML num site normal.
- Comportamentos típicos:
  - **Scroll** ou gestos podem **minimizar temporariamente** a UI do browser.
  - **`fullscreen` API** tem **suporte limitado** em iOS para páginas web genéricas e não substitui um shell sem chrome de sistema.

### 6.2 `viewport-fit=cover` + `env(safe-area-inset-*)`

- **`viewport-fit=cover`** deve estar na **meta viewport** para o motor aplicar **safe area** em entalhes (Dynamic Island, notch).
- **Produção atual sem `viewport-fit=cover`** → experiência em hardware com notch **pior** e áreas úteis **menos previsíveis** — alinhado com queixas de “não fullscreen” / margens estranhas.

### 6.3 PWA `standalone`

- **`manifest.webmanifest`** em produção inclui **`display: standalone`** (coerente com `vite.config.ts`).
- **Efeito:** ao abrir o site **instalado como app** (atalho no ecrã), o sistema **reduz** barras do browser.
- **Limitação:** **não altera** o comportamento quando o utilizador continua em **Chrome/Safari normais**.

---

## 7. Diagnóstico PWA / barra do navegador

| Modo | Barra de URL / chrome do browser |
|------|-------------------------------------|
| **Navegador normal** | Continua existindo; só pode **encolher/ocultar temporariamente** conforme gestos/scroll do OS |
| **PWA standalone** (instalado) | **Sim**, UX mais “app-like”; depende do utilizador **instalar** |
| **CSS sozinho** | **Impossível** garantir 100% ausência de chrome do browser |

**Separador pedido:**

- **Possível em navegador normal:** minimização temporária, não “fullscreen verdadeiro”.
- **Possível como PWA:** **melhor aproximação** com **`display: standalone`** + ícones corretos + utilizador a instalar.
- **Impossível controlar 100% via CSS:** barra de URL do browser **fora do controlo total do site**.

---

## 8. Diagnóstico “Você precisa de saldo para chutar”

### 8.1 Frase literal

**Não encontrada** na rota **`GameFinal.jsx`** atual como cópia fixa “Você precisa de saldo para chutar”.  
O comportamento implementado usa **outra redação**.

### 8.2 Frontend (`GameFinal.jsx`)

- **`canShoot`** exige `balance >= betAmount` e `gamePhase === IDLE`.
- Zonas **`disabled={!canShoot}`** com classe **`disabled`** quando sem saldo.
- Ao tentar fluxo com saldo baixo no handler:

```369:374:goldeouro-player/src/pages/GameFinal.jsx
    if (balance < betAmount) {
      console.log('⚠️ [GAMEFINAL] Saldo insuficiente:', balance, '<', betAmount);
      track('game_error', { phase: 'shot', code: 'insufficient_balance' });
      toast.error(`Saldo insuficiente. Seu saldo: R$ ${balance.toFixed(2)}. Aposta: R$ ${betAmount}`);
      return;
    }
```

**Bundle produção** contém **`Saldo insuficiente`** — coerente.

### 8.3 Backend (`server-fly.js`)

Validação de saldo antes do processamento do chute (extracto):

```1284:1303:e:\Chute de Ouro\goldeouro-backend\server-fly.js
    // Verificar saldo do usuário
    const { data: user, error: userError } = await supabase
      .from('usuarios')
      .select('saldo')
      .eq('id', userId)
      .single();
    // ...
    if (Number(user.saldo) < parsedAmount) {
      return res.status(400).json({
      success: false,
        message: 'Saldo insuficiente'
      });
    }
```

### 8.4 Nota de UX (histórico documental)

Em `docs/relatorios/DIAGNOSTICO-FLUXO-JOGADOR-PRODUCAO-2026-04-02.md` há achado sobre **atualização de saldo na UI após miss** — risco de **estado React desalinhado** com saldo real no edge case descrito. **Não revalidado aqui em runtime** (read-only); convém **testar manualmente** saldo → zero após sequência de chutes.

---

## 9. Causa provável

| # | Causa | Evidência |
|---|--------|-----------|
| **C1 (dominante)** | **Deploy de produção desatualizado em relação a `dac9f8b`** | HTML sem `viewport-fit=cover`; JS sem literais do overlay H3.0B |
| **C2** | **Expectativa de fullscreen num browser tab** | Limitação **OS/browser**; só **PWA standalone** aproxima |
| **C3 (secundário)** | **Mensagem esperada diferente da implementada** | Utilizador espera frase X; app usa **toast “Saldo insuficiente…”** + zonas disabled |

---

## 10. Riscos

| Risco | Impacto |
|-------|---------|
| **Continuar a testar prod pensando validar H3.0B** | Falso negativo — overlay/mobile fixes **não estão no ar** |
| **Confiar só em CSS sem JSX novo** | Regras `.game-rotate` podem existir sem DOM → UX inconsistente |
| **Fullscreen como critério hard em Safari tab** | Insatisfação persistente mesmo com patch correta |
| **Saldo/UI dessincronizado em edge cases** | UX confusa; backend ainda bloqueia — documentação histórica aponta casos |

---

## 11. Próxima etapa recomendada

1. **Deploy controlado** do **player** para **`www.goldeouro.lol`** a partir de **`dac9f8b`** (ou release tag equivalente), com **invalidação de CDN/cache** se aplicável.
2. **Repetir smoke mobile real:** retrato → overlay; paisagem → jogo; safe-area em notch; refresh.
3. **Alinhar copy UX:** se o produto exige literalmente **«Você precisa de saldo para chutar»**, definir **nova string** (fora do âmbito deste diagnóstico read-only).
4. **Documentar para utilizadores:** para experiência “sem barra”, recomendar **instalação PWA** (“Adicionar ao ecrã inicial”).
5. **Vercel / pipeline:** correlacionar **último deployment** ao **commit SHA** no dashboard (ação manual — não automatizada neste relatório read-only).

---

**Metodologia:** `Invoke-WebRequest` sobre `www.goldeouro.lol` + inspeção estática de strings em `/assets/*.js` e `/assets/*.css`; leitura de ficheiros em `dac9f8b`; sem alterações a sistemas externos.
