# AUDITORIA COMPLETA — SIDEBAR

**Projeto:** Gol de Ouro — Web Player  
**Escopo:** Sidebar / navegação lateral — análise técnica e estratégica  
**Data:** 2026-03-08  
**Modo:** READ-ONLY ABSOLUTO (nenhuma alteração de código)

**Stack considerada:** React, Tailwind CSS, Axios, Supabase Auth, Node backend.  
**Frontend analisado:** `goldeouro-player/src`

---

## 1. Mapa técnico da sidebar

### Onde Navigation.jsx é importado

| Arquivo | Import |
|---------|--------|
| Dashboard.jsx | `import Navigation from '../components/Navigation'` |
| GameShoot.jsx | `import Navigation from '../components/Navigation'` |
| Pagamentos.jsx | `import Navigation from '../components/Navigation'` |
| Withdraw.jsx | `import Navigation from '../components/Navigation'` |
| Profile.jsx | `import Navigation from '../components/Navigation'` |
| Game.jsx | `import Navigation from '../components/Navigation'` |

**Observação:** Não existe pasta `src/navigation/`. O componente está em `src/components/Navigation.jsx`.

### Onde SidebarContext é usado

| Arquivo | Uso |
|---------|-----|
| App.jsx | Importa `SidebarProvider`; envolve todas as rotas com `<SidebarProvider>`. |
| SidebarContext.jsx | Define `SidebarContext`, `useSidebar()`, `SidebarProvider`; estado `isCollapsed` (useState(true)) e `toggleSidebar`. |
| Navigation.jsx | `useSidebar()` para `isCollapsed` e `toggleSidebar`; aplica classes `w-16` / `w-72` no `<aside>`. |
| Dashboard.jsx | `useSidebar()` para `isCollapsed`. |
| GameShoot.jsx | `useSidebar()` para `isCollapsed`. |
| Pagamentos.jsx | `useSidebar()` para `isCollapsed`. |
| Withdraw.jsx | `useSidebar()` para `isCollapsed` (em 3 ramos de render). |
| Profile.jsx | `useSidebar()` para `isCollapsed`. |
| Game.jsx | `useSidebar()` para `isCollapsed`. |

### Onde useSidebar() aparece

Em todos os arquivos da tabela acima: Navigation.jsx (isCollapsed + toggleSidebar) e nas seis páginas protegidas (apenas isCollapsed para aplicar margem ao conteúdo).

### Classes dependentes da sidebar

| Arquivo | Classe aplicada ao conteúdo principal |
|---------|----------------------------------------|
| Dashboard.jsx | `isCollapsed ? 'ml-16' : 'ml-72'` |
| GameShoot.jsx | `isCollapsed ? 'ml-16' : 'ml-64'` |
| Pagamentos.jsx | `isCollapsed ? 'ml-16' : 'ml-64'` |
| Withdraw.jsx | `isCollapsed ? 'ml-16' : 'ml-72'` (3 ocorrências) |
| Profile.jsx | `isCollapsed ? 'ml-16' : 'ml-72'` |
| Game.jsx | `isCollapsed ? 'ml-16' : 'ml-72'` |

A sidebar usa `w-16` (recolhida) ou `w-72` (expandida). Em GameShoot e Pagamentos a margem expandida é `ml-64`, gerando pequeno desalinhamento com a largura real da barra (w-72).

### Telas que quebrariam se a sidebar fosse removida hoje

Todas as seis telas protegidas que renderizam `<Navigation />` e aplicam `ml-*` dependem estruturalmente da sidebar. Sem ajuste de layout:

- O conteúdo continuaria com margem lateral (vão à esquerda ou espaço morto).
- Qualquer componente que chamasse `useSidebar()` sem Provider (ou com Provider removido) lançaria erro em tempo de execução.
- O único ponto de logout na maioria das telas é o botão "Sair" na sidebar (o Dashboard tem também o ícone 👤 no header).

### Tabela consolidada

| Arquivo | Usa Navigation | Usa useSidebar | Depende de margem lateral | Observação |
|---------|----------------|----------------|---------------------------|------------|
| App.jsx | Não | Não (fornece SidebarProvider) | Não | Provider obrigatório para todas as rotas protegidas. |
| Navigation.jsx | — | Sim (isCollapsed, toggleSidebar) | — | Renderiza sidebar e botão hambúrguer. |
| SidebarContext.jsx | Não | — | Não | Define contexto e provider. |
| Dashboard.jsx | Sim | Sim (isCollapsed) | Sim (ml-16/ml-72) | Quebra se remover sem novo layout. |
| GameShoot.jsx | Sim | Sim (isCollapsed) | Sim (ml-16/ml-64) | Idem. |
| Pagamentos.jsx | Sim | Sim (isCollapsed) | Sim (ml-16/ml-64) | Idem. |
| Withdraw.jsx | Sim | Sim (isCollapsed) | Sim (ml-16/ml-72) | Idem (3 ramos). |
| Profile.jsx | Sim | Sim (isCollapsed) | Sim (ml-16/ml-72) | Idem. |
| Game.jsx | Sim | Sim (isCollapsed) | Sim (ml-16/ml-72) | Idem. |

**Pastas verificadas:** Não existem `src/navigation/` nem `src/layouts/`. Navegação está em `src/components/Navigation.jsx` e contexto em `src/contexts/SidebarContext.jsx`.

---

## 2. Função real da sidebar

### Botões e rotas da sidebar

| Item | Rota | Label |
|------|------|--------|
| 1 | /dashboard | Dashboard |
| 2 | /game | Jogar |
| 3 | /profile | Perfil |
| 4 | /withdraw | Saque |
| Rodapé | — | Jogador, R$ 150,00 (fixo), Sair |

Não há link para "Depositar" ou "/pagamentos" na sidebar.

### Onde essas rotas já estão acessíveis sem a sidebar

| Rota | Acesso alternativo |
|------|---------------------|
| /dashboard | Dashboard é a primeira tela após login; em Pagamentos botão "← Voltar"; em GameShoot botão "📊 Dashboard"; em Withdraw e Profile botão "←" (voltar). |
| /game | No Dashboard: botão "Jogar" (Penalty Shootout). Em Pagamentos: CTA "⚽ Jogar agora" no card do PIX criado. |
| /profile | No Dashboard: botão "Perfil" (Estatísticas). |
| /withdraw | No Dashboard: botão "Sacar" (PIX 24h). |
| /pagamentos | Apenas no Dashboard: botão "Depositar" (PIX Instantâneo). Não está na sidebar. |

### Redundância

- **Dashboard:** Jogar, Depositar, Sacar, Perfil e logout (👤) — cobre todas as ações principais.
- **Sidebar:** Repete Dashboard, Jogar, Perfil e Saque; não oferece Depositar; oferece Sair (logout).
- **Páginas internas:** Pagamentos, GameShoot, Withdraw e Profile têm botão "Voltar" ou "Dashboard" para retorno ao hub.

Conclusão: a sidebar **não adiciona navegação que não exista no Dashboard**. Ela **replica** os mesmos destinos (exceto Depositar, que só está no Dashboard). O valor adicional é: (1) acesso rápido a essas rotas de qualquer tela sem voltar ao Dashboard, e (2) um único ponto de logout visível em todas as telas (no Dashboard há também o ícone 👤). Ou seja: **redundante em termos de destinos**; útil apenas como atalho persistente e logout global.

### Resposta direta

- **A sidebar adiciona navegação útil ou apenas repete?** Principalmente repete. O Dashboard já é um hub completo (Jogar, Depositar, Sacar, Perfil); a sidebar repete Jogar, Perfil e Saque e não oferece Depositar.
- **Ela resolve um problema real ou só ocupa espaço?** Resolve de forma limitada: atalho lateral e logout sempre visível. Ocupa largura fixa (72 ou 16) e em mobile vira overlay que compete com o conteúdo.

---

## 3. UX desktop

### Comportamento atual

- **Desktop (md e acima):** Sidebar fixa à esquerda; botão hambúrguer (top-4 left-4) alterna entre recolhida (w-16) e expandida (w-72). Estado inicial é **recolhida** (isCollapsed: true). Conteúdo principal tem transição suave de margem (ml-16 ou ml-72/ml-64).
- **Estética:** Barra escura (bg-[#111827]), texto amarelo/branco, ícones SVG, rodapé com avatar "J", "Jogador", "R$ 150,00" e botão Sair. Visual de painel administrativo / dashboard genérico.

### Avaliação

- **Melhora a navegação em desktop?** Em parte: oferece atalhos sem voltar ao Dashboard, mas os mesmos atalhos já estão no hub principal.
- **Experiência moderna ou pesada?** Layout lateral recolhível é comum em painéis; para um **jogo** de ação rápida (chute ao gol, depositar, jogar), uma barra lateral fixa tende a parecer mais "sistema" do que "jogo".
- **Largura proporcional ao valor?** 72 (288px) expandida é bastante espaço para quatro links e um logout; recolhida (64px) ainda ocupa faixa lateral. O valor entregue (redundante com o Dashboard) não justifica bem esse espaço.
- **Combina com o tipo de jogo?** Não totalmente. Gol de Ouro é focado em ação, saldo e chute; a sidebar lembra mais um painel de gestão do que a interface de um jogo casual.

### Resposta

- **No desktop, a sidebar ajuda ou distrai?** **Neutra a distraidora.** Ajuda como atalho e logout sempre à mão, mas ocupa espaço e reforça sensação de "painel" em vez de "jogo", e o saldo fixo "R$ 150,00" no rodapé gera inconsistência com o saldo real exibido no Dashboard e no jogo.

---

## 4. UX mobile

### Comportamento atual

- **Mobile (< md):** Botão hambúrguer fixo (top-4 left-4, z-50); sidebar fora da tela por padrão (`-translate-x-full`) e entra com `translate-x-0` quando `isMenuOpen` é true. Overlay não está implementado: não há fundo escuro que feche o menu ao tocar fora, então o usuário precisa abrir/fechar pelo próprio botão ou ao clicar em um item (que chama `setIsMenuOpen(false)`).
- **Largura em mobile:** Quando aberta, a sidebar usa a mesma largura expandida (w-72), ocupando boa parte da tela pequena.
- **Conteúdo:** Todas as páginas aplicam `ml-16` ou `ml-64`/`ml-72` também em mobile; quando a sidebar está fechada, o conteúdo já fica com margem esquerda (ml-16) por causa do estado global `isCollapsed` (compartilhado com desktop). Em mobile a barra está escondida por translate, mas a margem continua, deixando faixa útil menor.

### Avaliação

- **Espaço:** A barra não ocupa espaço visual quando fechada (está traduzida para fora), mas a margem ml-16 no conteúdo ocupa 64px à esquerda em todas as telas, reduzindo a área útil.
- **Leitura do conteúdo:** Em telas pequenas, cada pixel conta; ml-16 fixo + possível botão hambúrguer no canto pode atrapalhar leitura e toques, principalmente no jogo (campo, zonas, saldo).
- **Menu mobile:** Abrir/fechar pelo hambúrguer e pelo clique no item funciona; não há overlay para fechar ao tocar fora, o que é uma falha de UX comum em drawers.
- **Faz sentido lateral em mobile?** Drawer lateral é um padrão aceitável, mas para um jogo com uma única ação principal (chutar) e fluxo linear (depositar → jogar → resultado → tentar de novo), um header com "Voltar" e poucos links pode ser mais claro e liberar mais área para o jogo.

### Resposta

- **No mobile, a sidebar é vantajosa ou atrapalha?** **Mais atrapalha.** A margem ml-16 consome largura; o menu lateral compete com o conteúdo; não há overlay; e o fluxo do jogo ganharia mais com foco total na tela e navegação mínima (ex.: header com voltar + saldo).
- **Ela piora a experiência do jogador?** Sim, ao reduzir área útil e reforçar um modelo de "app administrativo" em vez de "tela de jogo".

---

## 5. Coerência com o jogo

### Estética do Gol de Ouro

- Dashboard e GameShoot: fundo de imagem (campo/jogo), glassmorphism (bg-white/10, backdrop-blur), amarelo/dourado (CTA, saldo), foco em saldo, chute e resultado.
- Pagamentos: ainda tema claro (fora do padrão); Withdraw e Profile: glassmorphism e tema escuro alinhados ao resto.

### Sidebar

- Cor sólida escura (bg-[#111827]), ícones e labels, rodapé com "Jogador" e "R$ 150,00" fixo. Parece elemento de **painel de controle / dashboard genérico**, não parte da narrativa visual do jogo (campo, gol, apostas).

### Avaliação

- **Combina com estética do jogo?** Parcialmente: amarelo nos itens ativos ajuda, mas o bloco como um todo é mais "admin" do que "jogo".
- **Combina com foco em ação rápida?** Não. Ação rápida sugere menos chrome, mais área de jogo e CTAs diretos (como no Dashboard).
- **Combina com fluxo monetizado?** O fluxo (depositar → jogar) está no Dashboard e em Pagamentos/GameShoot; a sidebar não destaca Depositar e exibe saldo fixo incorreto, o que não ajuda o fluxo monetizado.
- **Parece parte natural do jogo?** Não. Parece **elemento de painel administrativo/dashboard genérico** colado ao player.

### Resposta

- **A sidebar parece parte natural do jogo?** Não.  
- **Ou parece elemento de painel administrativo / dashboard genérico?** Sim. Para uma demo profissional de jogo, um header simples ou o próprio Dashboard como hub transmite melhor a ideia de "jogo" do que uma barra lateral de gestão.

---

## 6. Redundância de navegação

### Navegação por origem

| Origem | Dashboard | Jogar (/game) | Depositar (/pagamentos) | Sacar (/withdraw) | Perfil (/profile) | Logout |
|--------|-----------|----------------|--------------------------|-------------------|-------------------|--------|
| Sidebar | Sim | Sim | Não | Sim | Sim | Sim |
| Dashboard (botões) | — | Sim | Sim | Sim | Sim | Sim (👤) |
| Pagamentos | Voltar → dashboard | Jogar agora (no card PIX) | — | — | — | Só via sidebar |
| GameShoot | Botão "Dashboard" | — | Recarregar → pagamentos | — | — | Só via sidebar |
| Withdraw | Voltar (←) | — | — | — | — | Só via sidebar |
| Profile | Voltar (←) | — | — | — | — | Só via sidebar |

### Análise

- **Redundantes com o Dashboard:** Todos os itens da sidebar exceto logout: Dashboard, Jogar, Perfil e Saque já são botões principais no Dashboard.
- **Telas com navegação suficiente sem sidebar:**  
  - **Dashboard:** Tem todos os CTAs e logout; não precisa da sidebar para função.  
  - **Pagamentos:** Tem "Voltar" e "Jogar agora"; só falta logout (poderia ir para header).  
  - **GameShoot:** Tem "Recarregar" e "Dashboard"; só falta logout.  
  - **Withdraw e Profile:** Têm "Voltar"; só falta logout.  
- **Único papel não redundante da sidebar:** Logout sempre visível em todas as telas (no Dashboard o logout também existe no header).

### Resposta

- **Quais botões da sidebar são redundantes?** Dashboard, Jogar, Perfil e Saque — todos já acessíveis pelo Dashboard.  
- **Quais telas já têm navegação suficiente sem ela?** Todas. Cada tela tem "Voltar" ou "Dashboard" e acesso ao fluxo principal; apenas o logout deixaria de estar garantido em todas as páginas se a sidebar sumir, o que se resolve com um header com "Sair" ou ícone de conta.

---

## 7. Alternativas à sidebar

### Alternativa A — Remover a sidebar e usar o Dashboard como hub principal

- **Descrição:** Sem barra lateral; usuário entra no Dashboard após login; de lá vai a Jogar, Depositar, Sacar, Perfil; nas outras telas só botão Voltar/Dashboard e, no header, logout.
- **Vantagem:** Interface mais limpa, foco no jogo e no hub; elimina redundância e saldo fixo incorreto; mais área útil, sobretudo em mobile.
- **Desvantagem:** De qualquer tela interna é preciso um passo (Voltar ou Dashboard) para trocar de seção; hoje a sidebar permite troca direta.
- **Risco técnico:** Médio — remover Navigation e useSidebar de 6 telas; ajustar margens; garantir header com logout em todas ou em layout único.
- **Impacto visual:** Positivo — layout mais "jogo" e menos "painel".
- **Impacto na demo:** Positivo — demo mais clara e profissional.

---

### Alternativa B — Remover a sidebar e usar apenas header simples nas páginas internas

- **Descrição:** Cada página (ou um layout comum) tem header com logo/título, saldo (opcional), "Voltar" e "Sair". Sem menu lateral.
- **Vantagem:** Consistência, mais espaço, navegação previsível (voltar + sair).
- **Desvantagem:** Sem atalho direto entre seções (sempre via Voltar → Dashboard); pode aumentar cliques para quem alterna muito entre Jogar/Perfil/Saque.
- **Risco técnico:** Médio — criar layout com header (ou componente de header) e migrar telas; remover sidebar e margens ml-*.
- **Impacto visual:** Positivo — visual de app/jogo, não de painel.
- **Impacto na demo:** Positivo — transmite profissionalismo e clareza.

---

### Alternativa C — Manter sidebar apenas em desktop e remover em mobile

- **Descrição:** Em viewport &lt; md, não renderizar sidebar; usar apenas header com menu hambúrguer que abra um drawer ou dropdown (links + logout). Em desktop, manter barra lateral como hoje.
- **Vantagem:** Em mobile ganha-se área e foco; em desktop mantém-se atalhos para quem gosta da barra.
- **Desvantagem:** Duas experiências diferentes; duplicação de lógica (sidebar vs menu mobile); mantém problemas de redundância e saldo fixo em desktop.
- **Risco técnico:** Alto — condicionais por breakpoint, dois padrões de navegação, testes em ambos.
- **Impacto visual:** Melhora em mobile; desktop continua com cara de painel.
- **Impacto na demo:** Neutro — complexidade maior sem resolver a questão estratégica (redundância e coerência com o jogo).

---

### Alternativa D — Manter sidebar colapsada/minimalista

- **Descrição:** Sidebar sempre recolhida (só ícones, w-16) ou quase sempre; expandir só ao hover ou clique.
- **Vantagem:** Ocupa menos espaço (64px); mantém atalhos e logout sem mudar muito o código.
- **Desvantagem:** Continua redundante com o Dashboard; saldo fixo "R$ 150,00" continua incorreto; não resolve a sensação de "painel" nem o problema em mobile (margem e drawer).
- **Risco técnico:** Baixo — estado default já é recolhido; eventualmente esconder rodapé quando recolhida.
- **Impacto visual:** Um pouco melhor (menos largura), mas ainda barra lateral de gestão.
- **Impacto na demo:** Pequeno — melhora marginal, não alinhada à decisão de produto (Dashboard como hub, sem sidebar) da especificação V2.

---

## 8. Decisão estratégica

### Deve ser mantida?

**Não.** Ela é redundante com o Dashboard, ocupa espaço desproporcional ao valor, em mobile atrapalha mais do que ajuda, não combina com a identidade de jogo e exibe informação incorreta (saldo fixo). Manter só se houver decisão explícita de manter um "painel de controle" em vez de experiência focada no jogo.

### Deve ser simplificada?

**Não como solução principal.** Simplificar (ex.: sempre recolhida) reduz um pouco o impacto visual e de espaço, mas não elimina redundância, nem o saldo falso, nem a incoerência com o jogo. Pode ser um paliativo se a remoção for adiada.

### Deve ser removida?

**Sim.** Alinha com a especificação V2 (Dashboard como hub, navegação sem sidebar), libera espaço, melhora mobile, elimina redundância e saldo fixo, e deixa a demo mais profissional e coerente com um jogo como o Gol de Ouro.

### Qual solução deixa a demo mais profissional?

**Remoção da sidebar** com Dashboard como hub e header simples (ou layout único com Voltar + Sair). Interface mais limpa e orientada ao jogo.

### Qual solução deixa a navegação mais intuitiva?

**Remoção + hub no Dashboard.** Um único lugar (Dashboard) com todas as ações principais e, nas outras telas, apenas "Voltar" e "Sair" é mais fácil de entender do que dois sistemas (Dashboard + sidebar) com os mesmos destinos.

### Qual solução combina melhor com um jogo como o Gol de Ouro?

**Remoção da sidebar.** Jogo de ação rápida e monetização (depositar → chutar) combina melhor com foco na tela de jogo e em um hub claro do que com barra lateral de painel administrativo.

---

## 9. Risco técnico da remoção

### Arquivos a alterar

| Arquivo | Alteração |
|---------|-----------|
| App.jsx | Manter ou remover SidebarProvider. Se remover, garantir que nenhum componente chame useSidebar(); ou manter provider com valor default (ex.: isCollapsed: true) até migração completa. |
| Navigation.jsx | Deixar de ser usado nas páginas; pode ser substituído por um Header simples (links, logout) ou removido após criar novo componente. |
| Dashboard.jsx | Remover import e uso de Navigation e useSidebar; remover margem ml-16/ml-72; layout full-width ou com padding; manter logout no header. |
| GameShoot.jsx | Idem: sem Navigation, sem useSidebar, sem ml-16/ml-64. |
| Pagamentos.jsx | Idem: sem Navigation, sem useSidebar, sem ml-16/ml-64. |
| Withdraw.jsx | Idem nos 3 ramos (loading, error, conteúdo). |
| Profile.jsx | Idem. |
| Game.jsx | Idem (se a rota /game antiga continuar em uso). |
| SidebarContext.jsx | Remover ou manter com valor default para evitar quebra em imports residuais. |

### Remoção de uma vez ou por etapas

**Recomendação: por etapas.**

1. **Fase 1:** Criar layout base (ex.: MainLayout) com header (logo, saldo opcional, Voltar quando aplicável, Sair) **sem** sidebar.
2. **Fase 2:** Migrar uma tela por vez (ex.: Dashboard primeiro) para esse layout: remover `<Navigation />` e uso de useSidebar, trocar margem por flex-1/padding, testar.
3. **Fase 3:** Repetir para GameShoot, Pagamentos, Withdraw, Profile (e Game se necessário).
4. **Fase 4:** Deixar de renderizar Navigation em qualquer rota; remover ou esvaziar SidebarProvider/useSidebar; remover SidebarContext ou mantê-lo com valor default até não haver mais consumidores.

Remover tudo de uma vez tem **risco alto** (quebra em todas as telas e possível erro de useSidebar fora do Provider).

### Ordem segura

1. Criar componente de header (ou layout) com links mínimos e logout.  
2. Migrar Dashboard para o novo layout; testar.  
3. Migrar GameShoot; testar fluxo depositar → jogar.  
4. Migrar Pagamentos, Withdraw, Profile (e Game).  
5. Remover Navigation das rotas e ajustar/remover SidebarProvider e uso de useSidebar.  
6. Limpar SidebarContext e referências órfãs.

### Classificação de risco

| Item | Classificação |
|------|----------------|
| Remover sidebar sem novo layout | **Risco alto** — margens e possível erro de contexto. |
| Migrar uma tela por vez para layout com header | **Risco médio** — exige disciplina e testes por tela. |
| Manter SidebarProvider com valor default durante migração | **Risco baixo** — evita quebra de useSidebar. |
| Remover apenas o rodapé da sidebar (saldo fixo) mantendo a barra | **Risco baixo** — melhora informação sem mudar estrutura. |

---

## 10. Conclusão final

### A sidebar hoje é: **problemática**

- **UX:** Redundante com o Dashboard; em mobile consome margem e compete com o conteúdo; não há overlay no drawer.  
- **Mobile:** Prejudica área útil e clareza; experiência pior que com header simples.  
- **Redundância:** Quatro dos cinco itens (Dashboard, Jogar, Perfil, Saque) já estão no Dashboard; único valor extra é logout global.  
- **Estética:** Parece painel administrativo, não parte do jogo; saldo fixo "R$ 150,00" é incorreto e gera desconfiança.  
- **Risco técnico:** Remoção é viável por etapas (risco médio); remoção em bloco único é arriscada (alto).

### Decisão: **excluir**

- **Manter:** Não recomendado; mantém redundância, informação errada e incoerência com o jogo.  
- **Melhorar:** Só como paliativo (ex.: esconder saldo, sempre recolhida); não resolve o problema estratégico.  
- **Excluir:** Recomendado; alinha com especificação V2, melhora UX e mobile, elimina redundância e incoerência visual; risco técnico controlável com migração por etapas.

### Justificativa resumida

A sidebar não entrega navegação que o Dashboard já não entregue; em mobile atrapalha; visualmente não combina com um jogo de ação; e exibe saldo fixo incorreto. Removê-la e adotar o Dashboard como hub, com header simples (Voltar + Sair) nas demais telas, deixa a demo mais profissional, a navegação mais intuitiva e a experiência mais alinhada ao Gol de Ouro. O risco técnico da remoção é médio e gerenciável com layout alternativo e migração tela a tela.

---

## CLASSIFICAÇÃO FINAL

**SIDEBAR DEVE SER REMOVIDA**

---

*Auditoria realizada em modo read-only. Nenhum código, configuração ou dependência foi alterado.*
