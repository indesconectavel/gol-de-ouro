# H3.0B — VALIDAÇÃO LOCAL /GAME MOBILE — V1

**Data:** 2026-05-15  
**Commit validado:** `dac9f8b` — `fix: polir game mobile H3.0B`  
**Tag rollback:** `pre-h3-0b-game-mobile-2026-05-12` → `3e8e7d9`  
**Modo:** validação local — sem deploy, sem alteração de código, sem commit  
**Escopo:** `goldeouro-player` — rota `/game` (`GameFinal.jsx`)

---

## 1. Resumo executivo

A validação local confirmou que o **build de produção do player compila com sucesso** no commit H3.0B e que os artefatos gerados **incluem** overlay portrait, regras CSS H3.0B e `viewport-fit=cover`.

A **validação visual completa da rota `/game`** (desktop, portrait, landscape, chute, alinhamento bola/zonas) **não foi concluída** nesta sessão por dois bloqueios operacionais **anteriores à cirurgia H3.0B**:

1. **`vite preview` em `127.0.0.1`:** a app aborta com `Uncaught Error: USE_MOCKS=true em ambiente de produção` (`environments.js` trata localhost como `development.USE_MOCKS=true` enquanto `import.meta.env.PROD` é verdadeiro no preview).
2. **`ProtectedRoute`:** `/game` exige sessão válida; credenciais de teste Cypress (`test@example.com`) retornam **401** no backend Fly de produção; sem token válido o fluxo redireciona para login.

**Servidor dev (`npm run dev` / porta 5173):** app carrega, login renderiza, `/game` redireciona para `/` sem autenticação — comportamento esperado.

**Classificação final:** **PRONTO COM RESSALVAS** — build e bundle OK; falta smoke visual autenticado em `/game` (recomendado no dispositivo real ou preview Vercel com hostname ≠ localhost, após deploy controlado de preview).

---

## 2. Estado Git

| Item | Valor |
|------|--------|
| **HEAD** | `dac9f8ba012c13607116af7bf15d58a95d242c35` (`dac9f8b`) |
| **Mensagem** | `fix: polir game mobile H3.0B` |
| **Tag rollback** | `pre-h3-0b-game-mobile-2026-05-12` → `3e8e7d974380d7a88e472bd163301ccce7800eac` |
| **Working tree** | ` M goldeouro-player/vercel.json` + ~24 ficheiros `??` (docs/scripts/SQL — fora do escopo H3.0B) |
| **Deploy** | Nenhum executado nesta validação |
| **Alterações durante validação** | Nenhuma (read-only) |

---

## 3. Build

**Comando:** `cd goldeouro-player && npm run build`  
**Resultado:** **SUCESSO** (2026-05-15, ~16–35s)

| Artefato | Hash / tamanho |
|----------|----------------|
| `dist/assets/index-CJR0UUol.js` | 398.60 kB (gzip 117.27 kB) |
| `dist/assets/index-DMJTzLg7.css` | 110.99 kB (gzip 18.62 kB) |
| PWA | `sw.js` + precache 44 entradas |

**Verificação estática do bundle:**

- JS minificado contém string **"Gire"** (overlay H3.0B) — `findstr` em `index-CJR0UUol.js`.
- CSS minificado contém regras **`.game-rotate`** e `orientation: portrait` — `index-DMJTzLg7.css`.
- `index.html` em `dist/` herda `viewport-fit=cover` da fonte.

**Avisos não bloqueantes:** `baseline-browser-mapping` desatualizado; `caniuse-lite` 7 meses.

**Preview local (`npx vite preview --host 127.0.0.1`):**

- Portas 4173/4174 ocupadas; servidor subiu em **4175**.
- **Falha de runtime:** ecrã preto; console: `🚨 CRÍTICO: USE_MOCKS=true em ambiente de produção!`
- **Causa:** `goldeouro-player/src/config/environments.js` — hostname `127.0.0.1` → `USE_MOCKS: true` + `validateEnvironment()` com `!import.meta.env.DEV`.
- **Nota:** em hostname de produção (`*.goldeouro.lol`, `*.vercel.app`) o mesmo build **não** dispara este guard. Limitação do preview **localhost**, não regressão específica H3.0B.

**Alternativa usada para UI:** `npx vite --host 127.0.0.1 --port 5173` (modo dev).

---

## 4. Desktop

| Critério | Resultado |
|----------|-----------|
| Acesso `/game` sem auth | Redireciona para `/` (login) — `ProtectedRoute` |
| Acesso `/game` com build preview 4175 | App não monta (erro USE_MOCKS) |
| Acesso via dev 5173 | Login OK; `/game` → redirect |
| Layout jogo 1920×1080 | **Não verificado visualmente** nesta sessão |

**Evidência dev:** página de login em `http://127.0.0.1:5173/` renderiza corretamente (formulário, logo, fundo estádio).

---

## 5. Mobile portrait

| Critério | Resultado |
|----------|-----------|
| Overlay “Gire o celular” | **Não verificado** em browser (sem sessão em `/game`) |
| Palco `.game-scale` oculto | Confirmado em **código/CSS** (`game-scene.css` L94–112) |
| Textos JSX | Confirmado em `GameFinal.jsx` L632–633 |

**Implementação esperada (Opção A H3.0A/B):**

```css
@media (orientation: portrait) {
  .game-rotate { display: grid; /* overlay full-screen */ }
  body[data-page="game"] .game-viewport > .game-scale { display: none !important; }
}
```

**Teste manual pendente:** viewport portrait autenticado em `/game`.

---

## 6. Mobile landscape

| Critério | Resultado |
|----------|-----------|
| Jogo visível em landscape | **Não verificado** visualmente |
| HUD compacto ≤767px | Confirmado em **código** (`game-scene.css` media landscape mobile) |
| Safe-area botões inferiores | Confirmado em **código** (`bottom: calc(20px + env(safe-area-inset-bottom))`) |

**Teste manual pendente:** dispositivo ou DevTools com sessão válida em landscape.

---

## 7. Alinhamento bola/zonas

| Critério | Resultado |
|----------|-----------|
| P1 — `transform: none` em bola/zonas | Presente em `game-shoot.css` L627–677 e no bundle CSS |
| Hover zonas com `scale()` apenas | Presente em código |
| `layoutConfig.js` / inline `GameFinal` | **Não alterado** no H3.0B (conforme cirurgia) |

**Verificação visual** (bola centrada nas zonas, sem duplo translate): **pendente** — requer `/game` autenticado.

---

## 8. HUD e safe-area

| Critério | Resultado |
|----------|-----------|
| `viewport-fit=cover` | Confirmado em `goldeouro-player/index.html` L6 |
| Padding safe-area em `.game-viewport` | Confirmado em `game-scene.css` L42–45 |
| Botões inferiores com inset bottom | Confirmado em `game-scene.css` (~L933–936) |
| HUD não cobre áreas críticas | **Não verificado** em runtime |

---

## 9. Refresh e console

### 9.1 `vite preview` (127.0.0.1:4175) — build produção local

| Tipo | Mensagem |
|------|----------|
| **CRÍTICO** | `Uncaught Error: 🚨 CRÍTICO: USE_MOCKS=true em ambiente de produção!` |
| Warning | Logs de detecção de ambiente (`environments.js`) |

**Refresh:** irrelevante — app não chega a montar rotas.

### 9.2 `vite dev` (127.0.0.1:5173)

| Tipo | Mensagem |
|------|----------|
| Error (não bloqueante) | React Router future flags v7 |
| Warning | MusicManager, logs de ambiente DEV |
| **CRÍTICO H3.0B** | Nenhum |

**Refresh em `/`:** não testado formalmente; login estável após carga.

---

## 10. Chute visual

| Item | Resultado |
|------|-----------|
| 1 chute visual em `/game` | **Não executado** — rota inacessível sem login |
| API login teste | `POST https://goldeouro-backend-v2.fly.dev/api/auth/login` com `test@example.com` → **401** |
| Financeiro | Não avaliado (fora de escopo) |

---

## 11. Problemas encontrados

| ID | Severidade | Descrição | Relação H3.0B |
|----|------------|-----------|-------------|
| **V1** | Alta (validação) | `vite preview` em localhost não monta a app (USE_MOCKS guard) | Pré-existente (`environments.js`) |
| **V2** | Alta (validação) | `/game` exige auth; sem credenciais válidas não há smoke visual | Pré-existente (`ProtectedRoute`) |
| **V3** | Baixa | Portas 4173–4174 ocupadas no ambiente local | Ambiente |
| **V4** | Info | Tag rollback aponta `3e8e7d9`, não `b475647` citado em docs anteriores | Documentação / histórico Git |
| **V5** | Info | `goldeouro-player/vercel.json` modificado fora do commit H3.0B | Governança (não incluir em deploy) |

**Não encontrado:** regressão de build, ausência de overlay/CSS H3.0B no bundle, erro novo introduzido pelo diff H3.0B no modo dev.

---

## 12. Classificação final

## **PRONTO COM RESSALVAS**

### Justificativa

| Gate | Status |
|------|--------|
| HEAD = `dac9f8b` | OK |
| `npm run build` | OK |
| Artefatos H3.0B no `dist/` | OK (estático) |
| Smoke visual `/game` desktop/mobile | **Pendente** (auth + preview localhost) |
| Console sem erro crítico em dev | OK |
| Console em `vite preview` localhost | **Falha** (pré-existente) |
| Chute visual | **Pendente** |

### Próximos passos recomendados (sem deploy produção)

1. Smoke autenticado em **`npm run dev`** com conta real de staging/produção **ou** preview Vercel (hostname ≠ `127.0.0.1`) após deploy controlado **apenas do player**.
2. Checklist manual: portrait → overlay “Gire o celular”; landscape → palco + HUD + botões; 1 chute; refresh; console limpo.
3. Opcional (backlog, fora H3.0B): ajustar `environments.js` para `vite preview` em localhost não usar `USE_MOCKS: true` com `PROD=true`.

### Não classificado como BLOQUEADO porque

- O build de produção compila e empacota as alterações H3.0B.
- O bloqueio do preview local é comportamento conhecido do detector de ambiente, não do diff mobile.
- Em deploy real (`goldeouro.lol` / Vercel), o guard USE_MOCKS **não** se aplica da mesma forma.

### Não classificado como PRONTO PARA DEPLOY CONTROLADO sem ressalvas porque

- Nenhum testador validou visualmente `/game` em portrait/landscape com sessão ativa nesta execução.

---

**Executado por:** validação automatizada local (Git + build + bundle + browser parcial)  
**Deploy:** nenhum  
**Commits:** nenhum
