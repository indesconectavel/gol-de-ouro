# 🗺️ MAPEAMENTO COMPLETO - ELEMENTOS DA PÁGINA /JOGO

## 📐 ANÁLISE BASEADA NA IMAGEM VALIDADA

### **Resolução de Referência:** 1920x1080 (16:9)

---

## 1. HEADER (Barra Superior - HUD)

### 1.1. Posicionamento
- **Posição:** `position: absolute`
- **Top:** `10px` (10px da borda superior)
- **Left:** `10px`
- **Right:** `10px`
- **Height:** `~80px` (estimado da imagem)
- **Z-index:** `4`

### 1.2. Logo (Lado Esquerdo)
- **Posição:** Esquerda do header
- **Largura:** `~120px`
- **Altura:** `~60px`
- **Conteúdo:**
  - Escudo dourado com bola e 5 estrelas
  - Texto "GOL DE OURO" abaixo
- **Espaçamento:** `16px` de margem direita

### 1.3. Estatísticas (Centro)
- **Layout:** Flexbox horizontal
- **Gap entre itens:** `20px`
- **Cada item de estatística:**
  - **Largura:** `~140px`
  - **Altura:** `~60px`
  - **Estrutura:**
    - Ícone (💰, ⚽, 🏆): `24px × 24px`
    - Label (SALDO, CHUTES, VITÓRIAS): `11px` (font-size)
    - Valor: `18px` (font-size), cor `#fbbf24` (amarelo)

**Estatísticas visíveis:**
1. **SALDO:** R$ 150,00
2. **CHUTES:** 1/10
3. **VITÓRIAS:** 0

### 1.4. Apostas e Dashboard (Lado Direito)
- **Layout:** Flexbox horizontal
- **Gap:** `12px`
- **Botões de aposta:**
  - **Largura:** `~50px`
  - **Altura:** `~36px`
  - **Padding:** `6px 12px`
  - **Font-size:** `12px`
  - **Ativo:** Fundo `#fbbf24` (amarelo), texto preto
  - **Inativo:** Fundo `rgba(255, 255, 255, 0.1)`, texto branco
- **Botão Dashboard:**
  - **Largura:** `~120px`
  - **Altura:** `~36px`
  - **Fundo:** `#1e3a8a` (azul escuro)
  - **Texto:** Branco, `14px`, `font-weight: 700`

---

## 2. CAMPO DE JOGO

### 2.1. Fundo (Stadium Background)
- **Imagem:** `bg_goal.jpg`
- **Posição:** `position: absolute`, `inset: 0`
- **Object-fit:** `cover`
- **Z-index:** `1`
- **Características:**
  - Estádio com holofotes
  - Iluminação noturna
  - Efeito de profundidade

### 2.2. Gol (Goal Structure)
- **Posição:** Direita da tela
- **Largura:** `~15%` da largura da tela
- **Altura:** `~40%` da altura da tela
- **Estrutura:**
  - Traves brancas: `4px` de espessura
  - Rede: padrão de malha
  - Posição vertical: centro da tela

### 2.3. Goleiro (Goalkeeper)
- **Posição Base:**
  - **X:** `50%` (centro horizontal)
  - **Y:** `~62%` (62% da altura, ajustado para baixo)
- **Tamanho (Desktop 1920x1080):**
  - **Largura:** `~200px`
  - **Altura:** `~300px`
- **Uniforme:**
  - Camisa vermelha de manga longa
  - Shorts pretos
  - Luvas brancas
- **Pose:** Agachado, braços abertos, posição de defesa
- **Z-index:** `3`
- **Transform-origin:** `50% 100%` (base do goleiro)

### 2.4. Bola (Ball)
- **Posição Base:**
  - **X:** `50%` (centro horizontal)
  - **Y:** `~87.5%` (87.5% da altura - no círculo central do campo)
- **Tamanho (Desktop 1920x1080):**
  - **Largura:** `~80px`
  - **Altura:** `~80px`
- **Características:**
  - Bola de futebol clássica (preto e branco)
  - Padrão hexagonal
  - Sombra: `drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6))`
- **Círculo Branco (Spot):**
  - **Diâmetro:** `~100px`
  - **Posição:** Centro do campo, onde a bola está
- **Z-index:** `4`

### 2.5. Zonas Clicáveis (Target Zones)
- **Quantidade:** 6 zonas
- **Formato:** Círculos transparentes
- **Tamanho:** `~60px` de diâmetro
- **Borda:** `2px solid rgba(255, 255, 255, 0.4)`
- **Posições (percentuais do gol):**

**Zona 1 - Top Left (TL):**
- X: `20%` (20% da largura do gol, da esquerda)
- Y: `20%` (20% da altura do gol, do topo)

**Zona 2 - Top Right (TR):**
- X: `80%` (80% da largura do gol, da esquerda)
- Y: `20%` (20% da altura do gol, do topo)

**Zona 3 - Center Top (C):**
- X: `50%` (centro horizontal do gol)
- Y: `15%` (15% da altura do gol, do topo)

**Zona 4 - Bottom Left (BL):**
- X: `20%` (20% da largura do gol, da esquerda)
- Y: `40%` (40% da altura do gol, do topo)

**Zona 5 - Bottom Right (BR):**
- X: `80%` (80% da largura do gol, da esquerda)
- Y: `40%` (40% da altura do gol, do topo)

**Zona 6 - Center Bottom (C):**
- X: `50%` (centro horizontal do gol)
- Y: `~80%` (não visível na imagem, mas deve existir)

### 2.6. Campo (Field)
- **Cor:** Verde gramado (`#008000` a `#00a000`)
- **Linhas Brancas:**
  - Linha de fundo: `2px` de espessura
  - Área de pênalti: retângulo com bordas brancas
  - Círculo central: `~200px` de diâmetro
  - Ponto central: `~20px` de diâmetro

---

## 3. OVERLAY INFERIOR DIREITO

### 3.1. Container
- **Posição:** `position: absolute`
- **Bottom:** `30px`
- **Right:** `30px`
- **Z-index:** `16`
- **Background:** `rgba(0, 0, 0, 0.3)` com `backdrop-filter: blur(8px)`
- **Padding:** `12px`
- **Border-radius:** `12px`

### 3.2. Botões de Controle
- **Layout:** Flexbox horizontal
- **Gap:** `12px`
- **Cada botão:**
  - **Largura:** `~48px`
  - **Altura:** `~48px`
  - **Border-radius:** `50%` (círculo)
  - **Background:** `rgba(255, 255, 255, 0.1)`
  - **Border:** `1px solid rgba(255, 255, 255, 0.2)`

**Botões:**
1. **Áudio:** Ícone 🔊/🔇
2. **Chat:** Ícone 💬
3. **Novato:** Logo "Y" + texto "NOVATO"

---

## 4. PROPORÇÕES RESPONSIVAS

### 4.1. Mobile (< 768px)
- **Goleiro:**
  - Largura: `120px`
  - Altura: `180px`
- **Bola:**
  - Largura: `50px`
  - Altura: `50px`
- **Header:**
  - Altura: `~70px`
  - Padding: `10px 12px`
- **Zonas:**
  - Diâmetro: `~50px`

### 4.2. Tablet (768px - 1024px)
- **Goleiro:**
  - Largura: `180px`
  - Altura: `270px`
- **Bola:**
  - Largura: `65px`
  - Altura: `65px`
- **Header:**
  - Altura: `~75px`
  - Padding: `12px 16px`
- **Zonas:**
  - Diâmetro: `~55px`

### 4.3. Desktop (>= 1024px)
- **Goleiro:**
  - Largura: `240px`
  - Altura: `360px`
- **Bola:**
  - Largura: `80px`
  - Altura: `80px`
- **Header:**
  - Altura: `~80px`
  - Padding: `16px 20px`
- **Zonas:**
  - Diâmetro: `~60px`

---

## 5. CORES E ESTILOS

### 5.1. Header
- **Background:** `rgba(0, 0, 0, 0.3)`
- **Backdrop-filter:** `blur(8px)`
- **Border:** `1px solid rgba(255, 255, 255, 0.1)`
- **Border-radius:** `12px`

### 5.2. Estatísticas
- **Label:** `rgba(255, 255, 255, 0.7)`, `11px`, `font-weight: 500`
- **Valor:** `#fbbf24` (amarelo), `18px`, `font-weight: 700`

### 5.3. Botões de Aposta
- **Ativo:** `#fbbf24` (amarelo), texto `#1e3a8a` (azul escuro)
- **Inativo:** `rgba(255, 255, 255, 0.1)`, texto branco
- **Hover:** `rgba(255, 255, 255, 0.2)`

### 5.4. Campo
- **Grama:** Gradiente de `#008000` a `#00a000`
- **Linhas:** Branco (`#ffffff`), `2px` de espessura

---

## 6. ANIMAÇÕES E TRANSIÇÕES

### 6.1. Goleiro
- **Transição de posição:** `0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- **Transição de rotação:** `0.5s ease`

### 6.2. Bola
- **Transição de posição:** `0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)`

### 6.3. Overlays (Gol/Defesa)
- **Animação de entrada:** `gooolPop` (1.2s) ou `pop` (0.6s)
- **Z-index: `9999` (fixed)

---

## 7. ESTRUTURA HTML/CSS

### 7.1. Container Principal
```html
<div className="game-page">
  <div className="game-stage-wrap">
    <div id="stage-root">
      <!-- Fundo -->
      <img className="scene-bg" src={bgGoalImg} />
      
      <!-- Header -->
      <div className="hud-header">
        <div className="hud-content">
          <!-- Logo, Stats, Betting -->
        </div>
      </div>
      
      <!-- Campo -->
      <div className="game-field">
        <!-- Zonas, Goleiro, Bola -->
      </div>
      
      <!-- Overlays -->
      <div className="hud-bottom-right">
        <!-- Controles -->
      </div>
    </div>
  </div>
</div>
```

---

## 8. AJUSTES NECESSÁRIOS

### 8.1. Proporções do Goleiro
- **Atual:** 140px-200px (muito pequeno)
- **Correto (Desktop):** 240px × 360px
- **Correto (Tablet):** 180px × 270px
- **Correto (Mobile):** 120px × 180px

### 8.2. Proporções da Bola
- **Atual:** 70px (muito pequeno)
- **Correto (Desktop):** 80px × 80px
- **Correto (Tablet):** 65px × 65px
- **Correto (Mobile):** 50px × 50px

### 8.3. Posicionamento do Goleiro
- **Y atual:** 62%
- **Y correto:** 62% (mantém, mas ajustar escala)

### 8.4. Posicionamento da Bola
- **Y atual:** 90%
- **Y correto:** 87.5% (no círculo central)

### 8.5. Zonas do Gol
- **Tamanho atual:** 40px
- **Tamanho correto:** 60px (desktop), 55px (tablet), 50px (mobile)

---

## 9. MAPEAMENTO DE POSIÇÕES EXATAS

### 9.1. Coordenadas das Zonas (Baseadas na Imagem)

**Sistema de Coordenadas:**
- **X:** 0% (esquerda) a 100% (direita)
- **Y:** 0% (topo) a 100% (fundo)
- **Origem do Gol:** Direita da tela, centro vertical

**Zona TL (Top Left):**
- X: `85%` (85% da largura da tela, da esquerda)
- Y: `25%` (25% da altura da tela, do topo)

**Zona TR (Top Right):**
- X: `95%` (95% da largura da tela, da esquerda)
- Y: `25%` (25% da altura da tela, do topo)

**Zona C (Center Top):**
- X: `90%` (90% da largura da tela, da esquerda)
- Y: `20%` (20% da altura da tela, do topo)

**Zona BL (Bottom Left):**
- X: `85%` (85% da largura da tela, da esquerda)
- Y: `45%` (45% da altura da tela, do topo)

**Zona BR (Bottom Right):**
- X: `95%` (95% da largura da tela, da esquerda)
- Y: `45%` (45% da altura da tela, do topo)

---

## 10. ESPAÇAMENTOS E MARGENS

### 10.1. Header
- **Margin-top:** `10px`
- **Margin-left:** `10px`
- **Margin-right:** `10px`
- **Padding:** `10px 16px` (mobile), `12px 20px` (tablet), `16px 24px` (desktop)

### 10.2. Estatísticas
- **Gap entre itens:** `20px`
- **Gap interno (ícone-texto):** `8px` (mobile), `10px` (tablet), `12px` (desktop)

### 10.3. Botões de Aposta
- **Gap:** `6px`
- **Padding:** `6px 12px` (mobile), `8px 16px` (tablet), `10px 20px` (desktop)

---

## 11. TIPOGRAFIA

### 11.1. Labels
- **Font-size:** `11px` (mobile), `12px` (tablet), `14px` (desktop)
- **Font-weight:** `500`
- **Color:** `rgba(255, 255, 255, 0.7)`

### 11.2. Valores
- **Font-size:** `14px` (mobile), `16px` (tablet), `18px` (desktop)
- **Font-weight:** `700`
- **Color:** `#fbbf24` (amarelo)

### 11.3. Botões
- **Font-size:** `12px` (mobile), `14px` (tablet), `16px` (desktop)
- **Font-weight:** `600-700`

---

## 12. SOMBRAS E EFEITOS

### 12.1. Header
- **Box-shadow:** `0 2px 8px rgba(0, 0, 0, 0.3)`

### 12.2. Bola
- **Filter:** `drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6))`

### 12.3. Botões
- **Box-shadow:** `0 2px 4px rgba(0, 0, 0, 0.2)`
- **Hover:** `0 4px 8px rgba(0, 0, 0, 0.3)`

---

## 📊 RESUMO DAS PROPORÇÕES

### Desktop (1920x1080)
- Goleiro: `240px × 360px` (12.5% × 33.3% da altura)
- Bola: `80px × 80px` (4.2% × 7.4% da altura)
- Header: `~80px` de altura (7.4% da altura)
- Zonas: `60px` de diâmetro

### Tablet (768px - 1024px)
- Goleiro: `180px × 270px`
- Bola: `65px × 65px`
- Header: `~75px` de altura
- Zonas: `55px` de diâmetro

### Mobile (< 768px)
- Goleiro: `120px × 180px`
- Bola: `50px × 50px`
- Header: `~70px` de altura
- Zonas: `50px` de diâmetro

---

## ✅ PRÓXIMOS PASSOS

1. Ajustar proporções do goleiro conforme mapeamento
2. Ajustar proporções da bola conforme mapeamento
3. Ajustar posições das zonas conforme coordenadas
4. Ajustar tamanhos do header conforme breakpoints
5. Testar em diferentes resoluções

