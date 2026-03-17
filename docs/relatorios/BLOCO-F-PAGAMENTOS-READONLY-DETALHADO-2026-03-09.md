# BLOCO F — PÁGINA /pagamentos — AUDITORIA READ-ONLY DETALHADA

**Projeto:** Gol de Ouro  
**Documento:** Auditoria read-only específica da página /pagamentos  
**Data:** 2026-03-09  
**Modo:** READ-ONLY (nenhuma alteração de código ou arquivos)

---

## 1. Resumo executivo

A página **/pagamentos** está implementada com **TopBar**, seleção de valor (pré-definidos + personalizado), criação de PIX via API, exibição condicional do bloco “Pagamento PIX Criado” (código copia e cola e/ou fallbacks) e histórico. **Não** há bloco “Saldo atual” removido — ele ainda existe no header. Não há logo centralizada no topo, nem botão “← MENU PRINCIPAL” (há “← Voltar”), nem “⚽ JOGAR AGORA” no rodapé. Os **valores rápidos** no código são **R$ 10, 25, 50, 100, 200, 500**; **não** há R$ 20, equivalência em chutes nem card “RECOMENDADO”. O campo **valor personalizado** está alinhado à decisão (label “Valor personalizado”, placeholder “Digite o valor”). O bloco PIX **não** exibe QR Code como imagem (apenas string em `<code>` quando existe `pix_code`/`qr_code`/`pix_copy_paste`); **não** há scroll automático ao gerar o PIX; **não** há contador/tempo restante de expiração na UI. A explicação “Como funciona o PIX” está ao **lado** da recarga (grid 2 colunas), não no fim da página. O padrão visual é **claro** (bg-gray-50, cards brancos), distinto do restante do app (escuro/glassmorphism).

**Conclusão:** Várias decisões já definidas para /pagamentos **ainda não estão implementadas**. A cirurgia visual e estrutural deve remover o bloco “Saldo atual”, inserir logo e botões decididos, reordenar blocos (PIX principal → histórico → explicação no fim), adicionar valores/chutes/recomendado se aprovado, exibir QR Code como imagem quando houver `qr_code_base64`, scroll ao gerar PIX e contador de expiração quando o backend fornecer `expires_at`.

---

## 2. Estrutura atual da página /pagamentos

### 2.1 Ordem dos blocos no DOM (Pagamentos.jsx, linhas 118–378)

| Ordem | Bloco | Condição | Onde (linhas aprox.) |
|-------|--------|----------|------------------------|
| 1 | VersionBanner | sempre | 121 |
| 2 | TopBar | sempre | 122 |
| 3 | Header (título + **Saldo atual** + botão Voltar) | sempre | 124–144 |
| 4 | Grid 2 colunas | sempre | 146–219 |
| 4a | Coluna 1: “Recarregar Saldo” (valores pré-definidos, valor personalizado, botão Recarregar) | sempre | 148–193 |
| 4b | Coluna 2: “Como funciona o PIX” (instruções 1–4) | sempre | 195–218 |
| 5 | “Pagamento PIX Criado” (valor, ID, código/QR/fallbacks, Verificar Status) | só se `pagamentoAtual` | 222–331 |
| 6 | “Histórico de Pagamentos” (tabela ou vazio) | sempre | 334–377 |

### 2.2 Respostas diretas (escopo obrigatório A)

- **Blocos antes da geração do PIX:** Header (com “Saldo atual”), grid com “Recarregar Saldo” + “Como funciona o PIX”.
- **Blocos depois da geração do PIX:** “Pagamento PIX Criado” (condicional), “Histórico de Pagamentos”.
- **Onde está o histórico:** Abaixo do bloco “Pagamento PIX Criado” (e abaixo do grid); sempre visível.
- **Onde está a explicação do PIX:** No grid, ao lado de “Recarregar Saldo” (coluna direita); **não** no fim da página.
- **Saldo atual visível:** **SIM.** Header: “Saldo atual” + “R$ {saldo.toFixed(2)}” (linhas 132–134).
- **Sidebar:** **NÃO.** Não há uso de `Navigation`; apenas TopBar.
- **TopBar:** **SIM.** Renderizada no topo (linha 122).

---

## 3. Valores pré-estabelecidos encontrados no código

### 3.1 Constante e uso

- **Onde está:** `Pagamentos.jsx`, linha 20.  
- **Código:** `const valoresRecarga = [10, 25, 50, 100, 200, 500];`  
- **Uso:** Linhas 153–166: `valoresRecarga.map((valor) => (...))` renderiza um botão por valor; texto do botão: `R$ {valor}` (apenas número, sem “chutes” nem “RECOMENDADO”).

### 3.2 Lista exata no código

| Valor no código | Texto de apoio no card | Equivalência em chutes | Card recomendado | Destaque visual |
|-----------------|------------------------|------------------------|------------------|-----------------|
| R$ 10 | Nenhum (só “R$ 10”) | Não | Não | Não (apenas borda azul quando selecionado) |
| R$ 25 | Nenhum | Não | Não | Não |
| R$ 50 | Nenhum | Não | Não | Não |
| R$ 100 | Nenhum | Não | Não | Não |
| R$ 200 | Nenhum | Não | Não | Não |
| R$ 500 | Nenhum | Não | Não | Não |

- **Implementado?** SIM (valores e botões).  
- **Documentado no código?** Parcialmente (comentário “Valores pré-definidos para recarga”).  
- **Risco de alteração:** BAIXO (uma constante + map).

---

## 4. Valores/documentações encontrados no projeto

### 4.1 Busca em repositório

- **Termos:** `R$20`, `20 chutes`, `RECOMENDADO`, `recomendado`, `valoresRecarga`, valores de recarga em docs.  
- **Resultado:** Nenhum arquivo no projeto (código ou docs) define ou descreve o card **“R$20 ⭐ / 20 chutes / RECOMENDADO”** nem lista R$ 20 como valor rápido de recarga. A constante `valoresRecarga` em Pagamentos.jsx é a única definição explícita de valores rápidos e não inclui 20.

### 4.2 Documentos do BLOCO F que citam /pagamentos

- **AUDITORIA-BLOCO-F-INTERFACE:** Saldo em Pagamentos (`response.data.balance` vs `data.saldo`), loop em useEffect, consistência visual (Pagamentos em tema claro).  
- **BLOCO-F-CIRURGIA-EXECUTADA:** Saldo via `response.data.data.saldo`, useCallback, TopBar, histórico `historico_pagamentos` ou `payments`.  
- **BLOCO-F-CONSOLIDACAO-FINAL:** “Saldo atual” mantido (valor dinâmico); decisão de tema Pagamentos (claro vs escuro) em aberto; recomendações de padronização.  

Nenhum desses documentos especifica valores rápidos (R$ 20, 20 chutes, RECOMENDADO).

---

## 5. Confirmação sobre o card “R$20 ⭐ / 20 chutes / RECOMENDADO”

| Pergunta | Resposta |
|----------|----------|
| Existe no código? | **NÃO.** Valores são [10, 25, 50, 100, 200, 500]; nenhum card com “chutes” ou “RECOMENDADO”. |
| Existe em documentação do projeto? | **NÃO.** Busca por R$20, 20 chutes, RECOMENDADO não encontrou definição. |
| Estrutura “R$20 ⭐ / 20 chutes / RECOMENDADO” implementada? | **NÃO.** |
| Parcialmente implementada? | **NÃO.** (R$ 20 não está na lista; não há segunda linha nem destaque.) |
| Apenas decidida conceitualmente? | **SIM** (com base no briefing do usuário). Decisão não está registrada em código nem em docs do repositório. |

- **Item:** Card “R$20 ⭐ / 20 chutes / RECOMENDADO”.  
- **Onde está:** Não está.  
- **Estado atual:** Não implementado.  
- **Já implementado?** NÃO.  
- **Já documentado?** NÃO.  
- **Já decidido oficialmente?** SIM (pelo briefing desta auditoria).  
- **Risco de alteração:** BAIXO (adicionar valor 20, texto e destaque).  
- **Recomendação:** Incluir na cirurgia: adicionar R$ 20 a `valoresRecarga` (ou estrutura equivalente), exibir “20 chutes” e “RECOMENDADO” e aplicar destaque visual (ex.: borda/estrela) no card recomendado.

---

## 6. Estado atual do campo de valor personalizado

- **Existe?** SIM (linhas 171–184).  
- **Label:** “Valor personalizado” (linha 173).  
- **Placeholder:** “Digite o valor” (linha 183).  
- **Input:** `type="number"`, `min="1"`, `step="0.01"`, `value={valorRecarga}`, `onChange` atualiza `valorRecarga`.  
- **Alinhado à decisão (“Valor personalizado” / “Digite um valor”)?** SIM.  

- **Item:** Campo valor personalizado.  
- **Onde está:** Pagamentos.jsx, bloco “Recarregar Saldo”.  
- **Estado atual:** Label “Valor personalizado”, placeholder “Digite o valor”.  
- **Já implementado?** SIM.  
- **Já documentado?** NÃO (apenas no código).  
- **Já decidido oficialmente?** SIM.  
- **Risco de alteração:** BAIXO.  
- **Recomendação:** Manter; não alterar na cirurgia além de eventual ajuste de estilo.

---

## 7. Estado atual do bloco PIX

### 7.1 Exibição do bloco

- **Condição:** `pagamentoAtual && (...)` (linha 221). O bloco “Pagamento PIX Criado” só aparece **após** o usuário escolher valor e clicar em “Recarregar R$ X” e a API retornar sucesso (`setPagamentoAtual(response.data.data)`). Alinhado à decisão “bloco principal do PIX somente após escolher valor e gerar”.

### 7.2 QR Code

- **Código:** O front usa `pagamentoAtual.pix_code || pagamentoAtual.qr_code || pagamentoAtual.pix_copy_paste` em um único `<code>` (linhas 249–261). Exibe **texto** (copia e cola). **Não** há `<img>` para `qr_code_base64`. A variável `qr_code_base64` só aparece na condição do fallback “Link Mercado Pago” (linha 297: `!pagamentoAtual.qr_code_base64`).  
- **Backend:** `services/pix-mercado-pago.js` retorna `qr_code` e `qr_code_base64` (linhas 79–80).  
- **Conclusão:** QR Code como **imagem** (base64) **não** é exibido; apenas string em bloco de código quando o backend envia `pix_code`/`qr_code`/`pix_copy_paste`.

### 7.3 PIX copia e cola

- **Existe?** SIM. O mesmo bloco que pode mostrar “código” exibe `pix_code || qr_code || pix_copy_paste` em `<code>` e botão “📋 Copiar Código PIX” (linhas 263–271).  
- **No mesmo fluxo principal?** SIM. Um único bloco condicional mostra valor, ID, código (ou fallback email/init_point) e “Verificar Status”.

### 7.4 Scroll automático

- **Existe?** NÃO. Não há `scrollIntoView`, `ref` no bloco PIX nem `useEffect` ao setar `pagamentoAtual`. A página não rola automaticamente até o bloco PIX ao gerar o pagamento.

- **Item:** Scroll automático até bloco PIX ao gerar.  
- **Onde está:** Não implementado.  
- **Estado atual:** Ausente.  
- **Já implementado?** NÃO.  
- **Já documentado?** NÃO.  
- **Já decidido oficialmente?** SIM.  
- **Risco de alteração:** BAIXO.  
- **Recomendação:** Adicionar ref no container do “Pagamento PIX Criado” e, após `setPagamentoAtual`, chamar `element.ref.current?.scrollIntoView({ behavior: 'smooth' })`.

---

## 8. Estado atual do botão copiar PIX

- **Existe?** SIM (linhas 263–272).  
- **Texto:** “📋 Copiar Código PIX”; após clicar: “✅ Código Copiado!” por 3 segundos (`setTimeout(..., 3000)`).  
- **Ação:** `navigator.clipboard.writeText(pixCode)`.  
- **Estilo:** `px-6 py-3 rounded-lg`, verde (`bg-green-600`/`bg-green-700`), `font-semibold shadow-sm`.  
- **Item:** Botão copiar PIX.  
- **Onde está:** Dentro do bloco “Pagamento PIX Criado”, quando há pix_code/qr_code/pix_copy_paste.  
- **Estado atual:** Funcional; copy e feedback visual.  
- **Já implementado?** SIM.  
- **Já documentado?** NÃO.  
- **Já decidido oficialmente?** Não explicitamente.  
- **Risco de alteração:** BAIXO.  
- **Recomendação:** Manter; na cirurgia apenas se padronizar com o restante dos botões (primário verde).

---

## 9. Estado atual do contador/tempo de expiração

- **Existe na UI?** NÃO. Não há contador, “tempo restante”, nem exibição de `expires_at` em Pagamentos.jsx.  
- **Backend:** `pix-mercado-pago.js` não retorna `expires_at` no objeto `data` devolvido ao front (apenas `id`, `status`, `qr_code`, `qr_code_base64`, `external_reference`, `amount`, `created_at`). Em outros arquivos do projeto (ex.: `backup-pre-limpeza-.../scripts/update-pix-tables.js`) existe `expires_at` em contexto de banco/scripts, não na resposta da API de criação usada pela página.  
- **Conclusão:** Contador/tempo restante **não** está implementado no front; o contrato atual da API de criação PIX não expõe expiração para o cliente.

- **Item:** Contador/tempo restante do PIX.  
- **Onde está:** Não implementado.  
- **Estado atual:** Ausente.  
- **Já implementado?** NÃO.  
- **Já documentado?** NÃO.  
- **Já decidido oficialmente?** SIM.  
- **Risco de alteração:** MÉDIO (depende de backend expor `expires_at` e front exibir e atualizar a cada segundo).  
- **Recomendação:** Na cirurgia: (1) definir se o backend passa a retornar `expires_at` na resposta de criação/status; (2) se sim, exibir “Expira em: HH:MM” e, opcionalmente, countdown; (3) se não, deixar para fase posterior.

---

## 10. Conflitos com as decisões já definidas

| # | Decisão | Estado atual | Conflito? |
|---|---------|--------------|-----------|
| 1 | Remover completamente o bloco “Saldo atual R$ 0,00” | Header exibe “Saldo atual” + R$ {saldo.toFixed(2)} | **SIM** — bloco ainda existe (valor agora dinâmico, mas bloco não removido). |
| 2 | Página deve ter logo centralizada no topo | Logo importada mas **não** renderizada no JSX | **SIM** — sem logo no topo. |
| 3 | Navegação por botões internos | TopBar + “← Voltar” no header | Parcial — há TopBar; “Voltar” existe, mas não “MENU PRINCIPAL”. |
| 4 | Botão “← MENU PRINCIPAL” | Existe “← Voltar” (navigate('/dashboard')) | **SIM** — texto diferente do decidido. |
| 5 | Botão “⚽ JOGAR AGORA” na parte inferior | Não existe | **SIM** — ausente. |
| 6 | Bloco PIX somente após escolher valor e gerar | Bloco condicional a `pagamentoAtual` | **NÃO** — alinhado. |
| 7 | Ao gerar PIX, rolar até o bloco principal do PIX | Não há scroll | **SIM** — não implementado. |
| 8 | Bloco principal com QR Code e PIX copia e cola no mesmo fluxo | Copia e cola sim; QR como imagem não | Parcial — copia e cola no fluxo; QR só como texto, não imagem. |
| 9 | Campo valor personalizado: “Valor personalizado” / “Digite um valor” | Implementado assim | **NÃO** — alinhado. |
| 10 | Explicação do PIX no fim da página | Explicação no grid, ao lado da recarga | **SIM** — não no fim. |
| 11 | Histórico abaixo do fluxo principal | Histórico após bloco PIX | **NÃO** — ordem ok; decisão diz “pode ficar abaixo”. |
| 12 | Contador/tempo restante do PIX | Não existe | **SIM** — ausente. |
| 13 | Mesmo padrão visual das demais páginas | bg-gray-50, cards brancos; resto do app escuro/glassmorphism | **SIM** — padrão diferente. |

---

## 11. Lista final

### 11.1 Já implementado

- TopBar no topo.  
- Valores rápidos [10, 25, 50, 100, 200, 500] com botões “R$ X”.  
- Campo “Valor personalizado” com placeholder “Digite o valor”.  
- Botão “Recarregar R$ X” que chama API de criação PIX.  
- Bloco “Pagamento PIX Criado” só após gerar pagamento (condicional a `pagamentoAtual`).  
- Exibição de código PIX (pix_code/qr_code/pix_copy_paste) em `<code>` e botão “Copiar Código PIX” com feedback.  
- Fallbacks (email, init_point Mercado Pago) quando não há código.  
- Botão “Verificar Status”.  
- Histórico de pagamentos (tabela ou vazio).  
- Saldo vindo de `response.data.data.saldo`; `carregarDados` com useCallback; sem loop.  
- Sem sidebar; navegação por TopBar + “← Voltar”.

### 11.2 Decidido mas não implementado

- Remover completamente o bloco “Saldo atual”.  
- Logo centralizada no topo.  
- Botão “← MENU PRINCIPAL” (hoje “← Voltar”).  
- Botão “⚽ JOGAR AGORA” na parte inferior.  
- Scroll automático até o bloco PIX ao gerar.  
- QR Code como imagem (usar `qr_code_base64` em `<img>` quando existir).  
- Contador/tempo restante do PIX (depende de backend).  
- Explicação “Como funciona o PIX” no fim da página.  
- Card “R$20 ⭐ / 20 chutes / RECOMENDADO” (ou equivalente).  
- Página no mesmo padrão visual das demais (escuro/glassmorphism), se for a decisão final.

### 11.3 Não encontrado / precisa decisão

- Valores rápidos diferentes (ex.: incluir R$ 20, remover algum atual) — decisão de produto.  
- Equivalência “X chutes” em todos os valores ou só no recomendado — decisão de produto.  
- Backend retornar `expires_at` (ou similar) para o contador — decisão técnica/backend.  
- Onde exatamente posicionar “JOGAR AGORA” (acima do histórico, após histórico, sticky, etc.) — decisão de layout.

---

## 12. Recomendação segura para cirurgia da página /pagamentos

### 12.1 Ordem sugerida de alterações (sem quebrar fluxo)

1. **Estrutura e decisões já fechadas (baixo risco)**  
   - Remover o bloco “Saldo atual” do header (linhas 130–134).  
   - Inserir logo centralizada no topo (usar `<Logo />` já importado, acima ou integrado ao primeiro bloco).  
   - Trocar “← Voltar” por “← MENU PRINCIPAL” e manter `navigate('/dashboard')`.  
   - Adicionar botão “⚽ JOGAR AGORA” na parte inferior (ex.: após histórico ou antes), com `navigate('/game')`.

2. **Ordem dos blocos**  
   - Manter: TopBar → (logo) → Área de escolha de valor + botão Recarregar.  
   - Em seguida: Bloco “Pagamento PIX Criado” (quando existir).  
   - Depois: Histórico de Pagamentos.  
   - Por último: Bloco “Como funciona o PIX” (mover do grid para o fim da página).

3. **Valores e card recomendado**  
   - Se a decisão for manter “R$20 ⭐ / 20 chutes / RECOMENDADO”: adicionar 20 a `valoresRecarga` (ou estrutura de objetos com label/chutes/recomendado), renderizar “20 chutes” e “RECOMENDADO” no card de R$ 20 e aplicar destaque visual (borda/estrela).  
   - Não remover os demais valores sem decisão explícita.

4. **Bloco PIX**  
   - Após `setPagamentoAtual`, usar ref + `scrollIntoView({ behavior: 'smooth' })` no container do “Pagamento PIX Criado”.  
   - Se o backend enviar `qr_code_base64`, exibir `<img src={`data:image/png;base64,${pagamentoAtual.qr_code_base64}`} alt="QR Code PIX" />` no mesmo fluxo do copia e cola (acima ou ao lado do código).  
   - Manter copia e cola e botão copiar como estão.

5. **Contador de expiração**  
   - Só implementar se o backend passar a retornar `expires_at` (ou campo equivalente) na resposta de criação ou de status. Exibir “Expira em: HH:MM” e, opcionalmente, countdown; caso contrário, deixar para depois.

6. **Padrão visual**  
   - Se a decisão for alinhar ao restante do app: trocar `bg-gray-50` e cards brancos por fundo escuro e glassmorphism (ex.: `bg-slate-900`, `bg-white/10`, `backdrop-blur`, `border-white/20`), sem alterar lógica nem fluxo.

### 12.2 O que não alterar (evitar regressão)

- Chamadas à API (PROFILE, PIX_USER, POST criar, PIX_STATUS).  
- useCallback de `carregarDados` e useEffect com `[carregarDados]`.  
- Lógica de `pagamentoAtual`, `copiado`, `loading`, `valorRecarga`, `pagamentos`.  
- Estrutura de fallbacks (email, init_point) quando não há código.  
- Histórico (tabela e campos usados: `created_at`, `amount`, `status`, `id`), salvo ajuste de estilo.

### 12.3 Riscos

- **Remover “Saldo atual”:** BAIXO — apenas remove trecho do header; saldo já pode ser visto em outras telas.  
- **Reordenar blocos / mover explicação:** BAIXO — movimentação de JSX e estilos.  
- **Adicionar R$ 20 e recomendado:** BAIXO — nova entrada no array e condição de destaque.  
- **Scroll e ref:** BAIXO.  
- **QR Code como imagem:** BAIXO se o backend já envia base64; verificar contrato da API antes.  
- **Contador:** MÉDIO se depender de mudança no backend e de timer no front.  
- **Mudança de tema (escuro/glassmorphism):** MÉDIO — afeta todas as classes da página; testar contraste e acessibilidade.

---

## Referências

- `goldeouro-player/src/pages/Pagamentos.jsx` (código completo).  
- `goldeouro-player/src/config/api.js` (API_ENDPOINTS.PROFILE, PIX_CREATE, PIX_STATUS, PIX_USER).  
- `goldeouro-player/src/components/TopBar.jsx`, `Logo.jsx`, `VersionBanner`.  
- `services/pix-mercado-pago.js` (retorno qr_code, qr_code_base64).  
- `docs/relatorios/BLOCO-F-CIRURGIA-EXECUTADA-2026-03-09.md`, `BLOCO-F-CONSOLIDACAO-FINAL-READONLY-2026-03-09.md`, `AUDITORIA-BLOCO-F-INTERFACE-2026-03-09.md`.

---

*Auditoria read-only. Nenhum arquivo ou código foi alterado.*
