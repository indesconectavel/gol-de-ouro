# Sistema Responsivo de Cena do Jogo

## Visão Geral

Este sistema permite controle individual e independente dos elementos visuais do jogo (goleiro, bola, botões, chat) para cada resolução (Mobile, Tablet, Desktop) sem quebrar a funcionalidade do jogo.

## Estrutura de Arquivos

```
src/pages/
├── game-scene.css              # CSS base comum
├── game-scene-mobile.css      # CSS específico para mobile (≤767px)
├── game-scene-tablet.css      # CSS específico para tablet (768px-1023px)
├── game-scene-desktop.css     # CSS específico para desktop (≥1024px)
└── GameShoot.jsx              # Componente principal

src/hooks/
└── useResponsiveGameScene.js  # Hook para gerenciar CSS responsivo

src/config/
└── gameSceneConfig.js         # Configurações centralizadas
```

## Como Funciona

### 1. Detecção Automática de Resolução
- O hook `useResponsiveGameScene` detecta automaticamente a largura da tela
- Carrega dinamicamente o arquivo CSS apropriado
- Atualiza automaticamente quando a tela é redimensionada

### 2. Arquivos CSS Separados
Cada resolução tem seu próprio arquivo CSS com configurações específicas:

- **Mobile**: Goleiro menor, bola 20% menor, chat compacto
- **Tablet**: Goleiro 50% maior, bola normal, chat médio
- **Desktop**: Goleiro 50% maior, bola normal, chat grande

### 3. Configurações Centralizadas
O arquivo `gameSceneConfig.js` centraliza todas as configurações:

```javascript
export const gameSceneConfig = {
  mobile: {
    goalie: { scale: 1.2, yOffset: 30 },
    ball: { scale: 0.8 },
    chat: { width: 300, height: 200 }
  },
  tablet: {
    goalie: { scale: 1.8, yOffset: 60 },
    ball: { scale: 1.0 },
    chat: { width: 350, height: 250 }
  },
  desktop: {
    goalie: { scale: 1.8, yOffset: 60 },
    ball: { scale: 1.0 },
    chat: { width: 400, height: 300 }
  }
};
```

## Vantagens

### ✅ Controle Individual
- Cada resolução tem configurações independentes
- Modificações em uma resolução não afetam as outras
- Fácil manutenção e ajustes

### ✅ Performance
- CSS carregado apenas quando necessário
- Mudança de resolução carrega novo CSS automaticamente
- Sem conflitos entre resoluções

### ✅ Flexibilidade
- Configurações centralizadas e fáceis de modificar
- Sistema extensível para novas resoluções
- Debug integrado para desenvolvimento

### ✅ Não Quebra o Jogo
- Funcionalidade do jogo permanece intacta
- Apenas aspectos visuais são alterados
- Fallback para configurações padrão

## Como Usar

### 1. Modificar Configurações
Edite o arquivo `src/config/gameSceneConfig.js`:

```javascript
// Exemplo: Aumentar goleiro no mobile
mobile: {
  goalie: { scale: 1.5, yOffset: 40 }, // Era 1.2, 30
  // ... outras configurações
}
```

### 2. Adicionar Nova Resolução
1. Crie novo arquivo CSS: `game-scene-4k.css`
2. Adicione configuração em `gameSceneConfig.js`
3. Atualize lógica de detecção no hook

### 3. Debug
Ative o modo debug no componente para ver:
- Resolução atual
- Status do CSS
- Configurações aplicadas

## Breakpoints

- **Mobile**: `max-width: 767px`
- **Tablet**: `min-width: 768px` e `max-width: 1023px`
- **Desktop**: `min-width: 1024px`

## Elementos Controlados

- **Goleiro**: Tamanho, posição vertical
- **Bola**: Tamanho, posição
- **Botões**: Posicionamento, espaçamento
- **Chat**: Dimensões, posição

## Manutenção

### Para Ajustar Goleiro
1. Edite `gameSceneConfig.js`
2. Modifique `scale` e `yOffset` para a resolução desejada
3. O CSS será regenerado automaticamente

### Para Ajustar Bola
1. Edite `gameSceneConfig.js`
2. Modifique `scale` para a resolução desejada

### Para Ajustar Botões
1. Edite `gameSceneConfig.js`
2. Modifique `bottomOffset` e `separation`

## Troubleshooting

### CSS Não Carrega
- Verifique se os arquivos CSS existem
- Confirme se os caminhos estão corretos
- Verifique console para erros

### Configurações Não Aplicam
- Confirme se o hook está sendo usado
- Verifique se `currentConfig` está sendo atualizado
- Ative debug para verificar valores

### Performance
- CSS é carregado apenas uma vez por resolução
- Mudanças de resolução são otimizadas
- Sistema é leve e eficiente
