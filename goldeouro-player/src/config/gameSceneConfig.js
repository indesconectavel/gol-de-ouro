/**
 * Configurações específicas para cada resolução do jogo
 * Permite controle individual de elementos visuais
 */

export const gameSceneConfig = {
  mobile: {
    name: 'Mobile',
    maxWidth: 767,
    goalie: {
      scale: 1.2,
      yOffset: 30,
      baseScale: 1.0
    },
    ball: {
      scale: 0.8, // 20% menor no mobile
      yOffset: 0
    },
    buttons: {
      bottomOffset: 100,
      separation: 70
    },
    chat: {
      width: 300,
      height: 200,
      bottom: 20,
      right: 20
    }
  },
  
  tablet: {
    name: 'Tablet',
    minWidth: 768,
    maxWidth: 1023,
    goalie: {
      scale: 1.8, // 50% maior
      yOffset: 60, // 30px original + 30px adicional
      baseScale: 1.5
    },
    ball: {
      scale: 1.0, // Tamanho normal
      yOffset: 0
    },
    buttons: {
      bottomOffset: 100,
      separation: 70
    },
    chat: {
      width: 350,
      height: 250,
      bottom: 20,
      right: 20
    }
  },
  
  desktop: {
    name: 'Desktop',
    minWidth: 1024,
    goalie: {
      scale: 1.8, // 50% maior
      yOffset: 60, // 30px original + 30px adicional
      baseScale: 1.5
    },
    ball: {
      scale: 1.0, // Tamanho normal
      yOffset: 0
    },
    buttons: {
      bottomOffset: 100,
      separation: 70
    },
    chat: {
      width: 400,
      height: 300,
      bottom: 20,
      right: 20
    }
  }
};

/**
 * Função para obter configuração baseada na largura da tela
 */
export const getConfigForWidth = (width) => {
  if (width >= gameSceneConfig.desktop.minWidth) {
    return gameSceneConfig.desktop;
  } else if (width >= gameSceneConfig.tablet.minWidth) {
    return gameSceneConfig.tablet;
  } else {
    return gameSceneConfig.mobile;
  }
};

/**
 * Função para gerar CSS dinâmico baseado na configuração
 */
export const generateDynamicCSS = (config) => {
  return `
    .gs-goalie {
      transform: translate(-50%, 0) translateY(${config.goalie.yOffset}px) scale(${config.goalie.scale});
    }
    
    .gs-ball {
      transform: translate(-50%, -50%) scale(${config.ball.scale});
    }
    
    .hud-actions {
      bottom: ${config.buttons.bottomOffset}px;
    }
    
    .chat-panel {
      width: ${config.chat.width}px;
      height: ${config.chat.height}px;
      bottom: ${config.chat.bottom}px;
      right: ${config.chat.right}px;
    }
  `;
};
