# BLOCO F — AUDITORIA SUPREMA FINAL (READ-ONLY)

**Projeto:** Gol de Ouro  
**Data:** 2026-03-09  
**Modo:** READ-ONLY ABSOLUTO (nenhum arquivo alterado/criado/removido)

---

## 1. Estado atual de cada página

### 1.1 /game — GameFinal.jsx

| Item | Estado |
|------|--------|
| **Arquivo** | `goldeouro-player/src/pages/GameFinal.jsx` |
| **TopBar** | **Não** — não importa nem renderiza TopBar |
| **Sidebar / Navigation** | **Não** — não importa Navigation nem useSidebar |
| **Estrutura** | Container `.game-viewport` (100vw × 100dvh), `.game-scale`, `.game-stage` (1920×1080); HUD com SALDO, CHUTES, GANHOS, GOLS DE OURO; botões MENU PRINCIPAL e Recarregar |
| **Saldo no header** | Sim — dentro do HUD: "R$ {balance.toFixed(2)}" (não como "Saldo atual" separado) |
| **layoutConfig** | Importado e usado (STAGE, BALL, GOALKEEPER, TARGETS, OVERLAYS, HUD, getTargetPosition, etc.) |
| **Backend** | apiClient + gameService; perfil para init; processShot para chute |

**Conclusão:** /game está sem TopBar e sem sidebar; layout interno (stage, HUD, overlays) intacto.

---

### 1.2 /dashboard — Dashboard.jsx

| Item | Estado |
|------|--------|
| **Arquivo** | `goldeouro-player/src/pages/Dashboard.jsx` |
| **TopBar** | **Sim** — linha 88: `<TopBar />` |
| **Sidebar / Navigation** | **Não** |
| **Componentes no layout** | VersionBanner, TopBar, div com background image, overlay, header (Logo, título, botão logout), card "Saldo Disponível" (R$ {balance}), grid de botões (Jogar, Depositar, Sacar, Perfil), card "Apostas Recentes" |
| **Saldo visível** | Sim — no card "Saldo Disponível": "R$ {balance.toFixed(2)}" (não rotulado "Saldo atual") |

---

### 1.3 /profile — Profile.jsx

| Item | Estado |
|------|--------|
| **Arquivo** | `goldeouro-player/src/pages/Profile.jsx` |
| **TopBar** | **Sim** — linha 156: `<TopBar />` |
| **Sidebar / Navigation** | **Não** |
| **Componentes** | VersionBanner, TopBar, div com background, overlay, header (botão voltar, Logo, "Meu Perfil"), card do usuário (AvatarSystem, estatísticas), abas (Informações, Apostas, Saques, Conquistas, Estatísticas, Gamificação, Notificações) |
| **Saldo visível** | Sim — no card do usuário: "R$ {user.balance.toFixed(2)}" ("Saldo Atual") |

---

### 1.4 /pagamentos — Pagamentos.jsx

| Item | Estado |
|------|--------|
| **Arquivo** | `goldeouro-player/src/pages/Pagamentos.jsx` |
| **TopBar** | **Sim** — linha 122: `<TopBar />` |
| **Sidebar / Navigation** | **Não** |
| **Componentes** | VersionBanner, TopBar, header (título "Pagamentos PIX", **"Saldo atual" + R$ {saldo}**, botão "← Voltar"), grid (Recarregar Saldo + Como funciona o PIX), bloco condicional "Pagamento PIX Criado", card "Histórico de Pagamentos" |
| **Saldo no header** | **Sim** — texto "Saldo atual" + "R$ {saldo.toFixed(2)}" (linhas 132–135) |

---

### 1.5 /withdraw — Withdraw.jsx

| Item | Estado |
|------|--------|
| **Arquivo** | `goldeouro-player/src/pages/Withdraw.jsx` |
| **TopBar** | **Sim** — linhas 170, 184, 196: `<TopBar />` (loading, error e conteúdo principal) |
| **Sidebar / Navigation** | **Não** |
| **Componentes** | TopBar, header (voltar, Logo, "Solicitar Saque"), card "Saldo Disponível" (R$ {balance}), formulário de saque, histórico de saques |
| **Saldo visível** | Sim — "Saldo Disponível" com "R$ {balance.toFixed(2)}" (não "Saldo atual" no header) |

---

### 1.6 /gameshoot — GameShoot.jsx

| Item | Estado |
|------|--------|
| **Arquivo** | `goldeouro-player/src/pages/GameShoot.jsx` |
| **TopBar** | **Sim** — linha 279: `<TopBar />` |
| **Sidebar / Navigation** | **Não** |
| **Componentes** | TopBar, header (título, "Saldo" R$ {balance}, Recarregar), cards (valor da aposta, campo de jogo, estatísticas, Gol de Ouro), botões (Áudio, Dashboard) |
| **Saldo visível** | Sim — no header: "Saldo" + "R$ {balance.toFixed(2)}" |

---

## 2. Navegação atual encontrada

### 2.1 Onde existe TopBar

| Página | Rota | TopBar presente |
|--------|------|------------------|
| Dashboard | /dashboard | Sim |
| Profile | /profile | Sim |
| Pagamentos | /pagamentos | Sim |
| Withdraw | /withdraw | Sim |
| GameShoot | /gameshoot | Sim |
| **GameFinal** | **/game** | **Não** |

### 2.2 Onde existe Sidebar / Navigation

- **Nenhuma** das seis páginas analisadas (/game, /dashboard, /profile, /pagamentos, /withdraw, /gameshoot) usa o componente **Navigation** (sidebar).
- O arquivo `Game.jsx` importa Navigation e useSidebar, mas **Game.jsx não está em nenhuma rota** em App.jsx (apenas GameFinal e GameShoot estão nas rotas).

### 2.3 Confirmação

- **/game:** Mantém estrutura atual (sem TopBar, sem sidebar; apenas botões MENU PRINCIPAL e Recarregar). **Confirmado.**
- **Outras páginas:** O briefing indica que "deverão remover TopBar". **Estado atual:** todas têm TopBar. **Decisão:** remover TopBar dessas páginas na cirurgia (se a decisão final for essa).

---

## 3. Estrutura atual da página pagamentos

### 3.1 Arquivo

- `goldeouro-player/src/pages/Pagamentos.jsx`

### 3.2 Valores de recarga

- **Constante:** linha 20  
- **Código exato:** `const valoresRecarga = [10, 25, 50, 100, 200, 500];`  
- **Array encontrado:** `[10, 25, 50, 100, 200, 500]`  
- **Renderização:** Botões "R$ 10", "R$ 25", etc., em grid de 3 colunas; sem texto "chutes" nem "RECOMENDADO".

### 3.3 Exibição do QR Code

- **QR Code como imagem:** Não. Não há `<img>` nem uso de `qr_code_base64` para exibir imagem.
- **Código/copia e cola:** Quando existe `pagamentoAtual.pix_code || pagamentoAtual.qr_code || pagamentoAtual.pix_copy_paste`, o valor é exibido como **texto** dentro de `<code>` (uma única string).

### 3.4 Exibição do pix_copy_paste

- **Sim.** Incluído na condição e no conteúdo: `pagamentoAtual.pix_code || pagamentoAtual.qr_code || pagamentoAtual.pix_copy_paste` (linhas 245, 255, 259).

### 3.5 Botão copiar código

- **Sim.** Texto: "📋 Copiar Código PIX" / "✅ Código Copiado!" (estado `copiado` por 3 s).
- **Ação:** `navigator.clipboard.writeText(pixCode)`; `setCopiado(true)`; `setTimeout(() => setCopiado(false), 3000)`.

### 3.6 Contador de tempo

- **Não.** Não há timer, countdown, expiresAt nem expiração na UI.

### 3.7 Botão "Verificar"

- **Sim.** Aparece em **dois** lugares:
  1. **Bloco "Pagamento PIX Criado":** botão "🔄 Verificar Status" — `onClick={() => consultarStatusPagamento(pagamentoAtual.id)}` (linhas 316–322).
  2. **Tabela de histórico:** coluna "Ações" — botão "Verificar" por linha — `onClick={() => consultarStatusPagamento(pagamento.id)}` (linhas 367–371).

---

## 4. Header "Saldo atual"

| Página | Onde aparece | Texto / variável |
|--------|--------------|-------------------|
| **Pagamentos** | Header do card (linhas 132–135) | Label "Saldo atual" + "R$ {saldo.toFixed(2)}" |
| Dashboard | Card "Saldo Disponível" | "R$ {balance.toFixed(2)}" (não usa a expressão "Saldo atual") |
| Profile | Card do usuário | "R$ {user.balance.toFixed(2)}" ("Saldo Atual" no card) |
| Withdraw | Card "Saldo Disponível" | "R$ {balance.toFixed(2)}" |
| GameShoot | Header | "Saldo" + "R$ {balance.toFixed(2)}" |
| GameFinal | HUD | "R$ {balance.toFixed(2)}" (label "SALDO") |

**Única página com o rótulo exato "Saldo atual" no header:** **Pagamentos.**

---

## 5. Histórico de pagamentos (colunas)

- **Tabela:** linhas 341–377.
- **Colunas confirmadas:**

| Coluna | Cabeçalho | Conteúdo |
|--------|-----------|----------|
| Data | "Data" | `formatarData(pagamento.created_at)` |
| Valor | "Valor" | `R$ {parseFloat(pagamento.amount).toFixed(2)}` |
| Status | "Status" | Badge com `getStatusText(pagamento.status)` |
| Ações | "Ações" | Botão "Verificar" |

- **Coluna "Verificar":** Não existe como coluna separada; o botão "Verificar" está **dentro** da coluna **Ações**. **Confirmado:** coluna Ações presente e contém o botão Verificar.

---

## 6. Botões de navegação existentes

| Página | Botões encontrados |
|--------|---------------------|
| **TopBar (comum)** | Logo "Gol de Ouro" (→ /dashboard), Início (/dashboard), Jogar (/game), Depositar (/pagamentos), Sacar (/withdraw), Perfil (/profile), Sair (logout) |
| Dashboard | (Além da TopBar) botão logout no header; cards Jogar, Depositar, Sacar, Perfil |
| Pagamentos | "← Voltar" (→ /dashboard) |
| Withdraw | "←" (→ /dashboard) no header |
| Profile | "←" (→ /dashboard) no header |
| GameShoot | "📊 Dashboard", "Recarregar" (→ /pagamentos) |
| GameFinal | "MENU PRINCIPAL" (→ /dashboard), "Recarregar" (→ /pagamentos) |

**Resumo:** Voltar, Dashboard (via TopBar ou botão), Menu (GameFinal = "MENU PRINCIPAL"), Logout (TopBar "Sair"). Pagamentos tem apenas "← Voltar" além da TopBar.

---

## 7. Tema visual

| Página | Tema | Classes principais | Glassmorphism |
|--------|------|--------------------|----------------|
| Dashboard | Escuro | min-h-screen, bg (background image), overlay bg-black/60, bg-white/10, backdrop-blur, border-white/20, text-yellow-400 | Sim |
| Profile | Escuro | Idem (background image, bg-white/10, backdrop-blur, border-white/20) | Sim |
| Withdraw | Escuro | Idem | Sim |
| GameShoot | Escuro | bg-gradient-to-br from-gray-900 to-slate-900, bg-white/5, backdrop-blur, border-white/10 | Sim |
| GameFinal | Escuro (stage) | game-viewport, game-scale, game-stage; HUD com estilos do jogo | N/A (próprio layout do jogo) |
| **Pagamentos** | **Claro** | **min-h-screen bg-gray-50**, **bg-white** rounded-xl, **border-gray-200**, **text-gray-900**, **bg-blue-50**, **text-green-600** | **Não** |

**Conclusão:** Pagamentos é a única página com tema **claro** (gray-50, branco, azul claro). Demais páginas protegidas usam tema **escuro** e **glassmorphism** (bg-white/10, backdrop-blur, border-white/20).

---

## 8. Página /game — confirmações

### 8.1 Não existe

- **TopBar externa:** Confirmado — não importada nem renderizada.
- **Sidebar:** Confirmado — não existe.
- **Navigation externa:** Confirmado — não existe.

### 8.2 Permanecem intactos

- **layoutConfig:** Importado de `../game/layoutConfig`; usado STAGE, BALL, GOALKEEPER, TARGETS, OVERLAYS, HUD, DIRECTION_TO_GOALKEEPER_JUMP, getTargetPosition.
- **Stage:** Dimensões e estilo do stage (width/height do layoutConfig, background #0b3a1d).
- **HUD:** Posições e estrutura do HUD (hudHeader, hudBottomLeft, hudBottomRight; SALDO, CHUTES, GANHOS, GOLS DE OURO).
- **Overlays:** createPortal para goool, defendeu, ganhou, golden-goal; imagens e durações.
- **Posições do jogo:** Bola, goleiro e alvos baseados em layoutConfig e getTargetPosition.

---

## 9. Lista completa de diferenças (estado atual vs estado decidido)

Com base no briefing e em relatórios anteriores do BLOCO F:

| # | Item | Estado atual | Estado decidido |
|---|------|--------------|-----------------|
| 1 | TopBar nas páginas fora de /game | Presente em Dashboard, Profile, Pagamentos, Withdraw, GameShoot | Remover TopBar dessas páginas (conforme briefing) |
| 2 | Bloco "Saldo atual" em Pagamentos | Presente no header ("Saldo atual" + R$ {saldo}) | Remover completamente |
| 3 | Logo em Pagamentos | Logo importada mas não renderizada | Logo centralizada no topo |
| 4 | Botão "← MENU PRINCIPAL" em Pagamentos | "← Voltar" (→ /dashboard) | "← MENU PRINCIPAL" |
| 5 | Botão "⚽ JOGAR AGORA" em Pagamentos | Não existe | Deve existir na parte inferior |
| 6 | Valores de recarga em Pagamentos | [10, 25, 50, 100, 200, 500]; sem R$ 20 nem recomendado | Incluir R$ 20 e card "RECOMENDADO" (conforme decisões anteriores) |
| 7 | QR Code em Pagamentos | Apenas texto (código) no `<code>`; sem imagem base64 | Exibir QR Code como imagem quando houver qr_code_base64 |
| 8 | Scroll ao gerar PIX em Pagamentos | Não existe | Rolar automaticamente até o bloco PIX |
| 9 | Contador/tempo do PIX em Pagamentos | Não existe | Deve existir (depende de backend) |
| 10 | Explicação "Como funciona o PIX" | No grid ao lado da recarga | No fim da página |
| 11 | Botão "Verificar" em Pagamentos | Existe no bloco PIX e na coluna Ações do histórico | Decisão de remoção (conforme prompt cirúrgico) |
| 12 | Tema visual em Pagamentos | Claro (gray-50, branco) | Alinhar ao restante (escuro/glassmorphism) se decidido |

---

## 10. Lista exata de mudanças necessárias para a cirurgia

### 10.1 Navegação

- **Se a decisão for remover TopBar das outras páginas:** Em Dashboard, Profile, Pagamentos, Withdraw e GameShoot, remover import e uso de `<TopBar />` e substituir por navegação por botões internos (ex.: "← MENU PRINCIPAL", "⚽ JOGAR AGORA") conforme definido por página.
- **Manter /game** sem TopBar e sem sidebar (sem alterações de navegação na estrutura atual).

### 10.2 Página /pagamentos

1. Remover o bloco "Saldo atual" do header (linhas 131–135).
2. Inserir logo centralizada no topo (usar componente Logo já importado).
3. Trocar "← Voltar" por "← MENU PRINCIPAL" (manter navigate('/dashboard')).
4. Adicionar botão "⚽ JOGAR AGORA" na parte inferior (navigate('/game')).
5. Ajustar valores de recarga: incluir 20 e, se decidido, card com destaque "RECOMENDADO" e equivalência em chutes.
6. Reordenar blocos: após gerar PIX, bloco principal do PIX; depois histórico; por último "Como funciona o PIX".
7. Ao setar `pagamentoAtual`, adicionar scroll (ref + scrollIntoView) até o bloco do PIX.
8. Se o backend retornar `qr_code_base64`, exibir QR Code como `<img src={data:image/...}>` no bloco PIX.
9. Se decidido e backend expor expiração: exibir contador/tempo restante.
10. Se decidido: remover botão "Verificar Status" do bloco PIX e/ou "Verificar" da coluna Ações do histórico.
11. Se decidido: aplicar tema escuro e glassmorphism (bg-slate-900, bg-white/10, backdrop-blur, border-white/20).

### 10.3 Outras páginas (se remover TopBar)

- Em cada uma (Dashboard, Profile, Withdraw, GameShoot): garantir botões ou links para MENU PRINCIPAL, JOGAR, e demais destinos conforme UX definida, sem depender da TopBar.

### 10.4 O que não alterar

- **/game:** layoutConfig, stage 1920×1080, scale, posições, HUD layout, overlays, assets, lógica de handleShoot e integração com gameService/apiClient.
- **Pagamentos:** Chamadas à API (PROFILE, PIX_USER, POST criar, PIX_STATUS); assinatura e uso de `criarPagamentoPix` e `consultarStatusPagamento`; estrutura de `response.data.data` usada para `pagamentoAtual` e `pagamentos`; useCallback/useEffect de `carregarDados`.

---

## 11. Classificação final

**INTERFACE PRONTA PARA CIRURGIA**

**Justificativa:**

- O estado atual está **mapeado** e **estável**: rotas, componentes, TopBar/sidebar, valores de recarga, fluxo PIX, histórico, botões e tema estão documentados.
- A página **/game** está alinhada à decisão (sem TopBar, sem sidebar; layout interno preservado).
- As **diferenças** entre estado atual e estado decidido estão listadas de forma explícita (TopBar nas outras páginas, bloco Saldo atual em Pagamentos, logo, CTAs, valores, QR, scroll, contador, Verificar, tema).
- A **lista de mudanças** necessárias é cirúrgica e não exige refatoração ampla; as alterações podem ser feitas por página/componente sem quebrar o sistema de PIX nem a estrutura do jogo.

**Recomendação:** Executar a cirurgia em etapas: (1) Pagamentos (remover saldo, logo, CTAs, valores, ordem, scroll, QR se houver base64, remover Verificar se decidido); (2) remoção de TopBar e substituição por botões nas demais páginas, se essa for a decisão final; (3) tema e contador conforme decisão de produto e backend.

---

*Auditoria read-only. Nenhum arquivo foi alterado, criado ou removido.*
