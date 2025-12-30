# Informações sobre Elementos do Jogo

## Data: 2025-01-24

## 1. Tamanho do Goleiro

### Tamanho Atual (ANTES da correção)
- **Altura**: 22% da altura do stage (16:9)
- **Largura**: 67% da altura (proporção 2:3)
- **Exemplo**: Se stage tem 600px de altura → Goleiro: 132px altura × 88px largura

### Tamanho Novo (DEPOIS da correção)
- **Altura**: 32% da altura do stage (16:9) - **AUMENTADO em 45%**
- **Largura**: 67% da altura (proporção 2:3 mantida)
- **Exemplo**: Se stage tem 600px de altura → Goleiro: 192px altura × 128px largura

### Cálculo
```javascript
goalieHeight = stageHeight * 0.32  // 32% da altura do stage
goalieWidth = goalieHeight * 0.67  // Proporção 2:3
```

---

## 2. Os Cinco Círculos de Chute

### Nome Técnico
**`GOAL_ZONES`** (Zonas do Gol)

### Definição no Código
```javascript
const GOAL_ZONES = {
  "TL": { x: 20, y: 20 },  // Top Left (Canto Superior Esquerdo)
  "TR": { x: 80, y: 20 },  // Top Right (Canto Superior Direito)
  "C":  { x: 50, y: 15 },  // Center (Centro)
  "BL": { x: 20, y: 40 },  // Bottom Left (Canto Inferior Esquerdo)
  "BR": { x: 80, y: 40 }   // Bottom Right (Canto Inferior Direito)
};
```

### Características
- **Quantidade**: 5 círculos clicáveis
- **Posições**: Definidas em porcentagem (x, y) do campo
- **Tamanho**: 40px × 40px (fixo)
- **Estilo**: Círculos brancos semi-transparentes com borda
- **Função**: Cada círculo representa uma direção de chute no gol

### Renderização
- Renderizados como `<button>` elementos
- Classe CSS: `gs-zone`
- Posicionamento: `position: absolute` com coordenadas em porcentagem
- Tooltip: Mostra "Chutar para [TL/TR/C/BL/BR]" ao passar o mouse

---

## 3. Visualização da Tela

### Resposta
**Não, não consigo ver visualmente a tela do jogo em tempo real.**

Porém, posso:
- ✅ Analisar o código fonte completo
- ✅ Verificar estilos CSS e proporções
- ✅ Entender a estrutura e layout através do código
- ✅ Fazer ajustes baseados em descrições e feedback
- ✅ Calcular tamanhos e posições matematicamente

### Como Funciona
Analiso o código para entender:
- Estrutura HTML/JSX
- Estilos CSS aplicados
- Lógica de posicionamento
- Cálculos de responsividade
- Integração de componentes

---

## Arquivos Relevantes

1. **`goldeouro-player/src/pages/Jogo.jsx`**
   - Define `GOAL_ZONES`
   - Renderiza os círculos de chute
   - Controla tamanho do goleiro via `getGoalieSize()`

2. **`goldeouro-player/src/hooks/useGameResponsive.js`**
   - Calcula tamanhos proporcionais
   - Função `getGoalieSize()` - tamanho do goleiro
   - Função `getBallSize()` - tamanho da bola

3. **`goldeouro-player/src/pages/game-scene.css`**
   - Estilos dos elementos do jogo
   - Classes `.gs-goalie`, `.gs-ball`, `.gs-zone`


