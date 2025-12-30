import { useState, useEffect } from 'react';

/**
 * Hook para gerenciar responsividade do jogo
 * Retorna dimensões e funções para calcular tamanhos baseados na proporção 16:9
 * Agora calcula baseado no tamanho do stage-root (16:9) ao invés da viewport completa
 */
export const useGameResponsive = () => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    stageWidth: 0, // Largura do stage-root (16:9)
    stageHeight: 0, // Altura do stage-root (16:9)
    isMobile: typeof window !== 'undefined' ? window.innerWidth < 768 : false,
    isTablet: typeof window !== 'undefined' ? window.innerWidth >= 768 && window.innerWidth < 1024 : false,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const calculateStageSize = () => {
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calcular tamanho do stage-root mantendo proporção 16:9
      // Stage sempre mantém 16:9, então calculamos qual dimensão é limitante
      const stageWidth = Math.min(viewportWidth, viewportHeight * 16 / 9);
      const stageHeight = Math.min(viewportHeight, viewportWidth * 9 / 16);
      
      setDimensions({
        width: viewportWidth,
        height: viewportHeight,
        stageWidth,
        stageHeight,
        isMobile: viewportWidth < 768,
        isTablet: viewportWidth >= 768 && viewportWidth < 1024,
        isDesktop: viewportWidth >= 1024
      });
    };

    const handleResize = () => {
      calculateStageSize();
    };

    window.addEventListener('resize', handleResize);
    calculateStageSize(); // Chamar uma vez para inicializar

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Calcular tamanhos do goleiro baseados no tamanho do stage (16:9)
  const getGoalieSize = () => {
    // Usar stageHeight como referência para manter proporções consistentes
    const baseSize = dimensions.stageHeight || 600; // Fallback para 600px
    
    // Tamanhos proporcionais ao stage (16:9)
    // Goleiro ocupa 64.8% da altura do stage (DIMINUÍDO de 72% para 64.8% - -10%)
    const goalieHeight = baseSize * 0.648; // 64.8% da altura do stage (72% * 0.9 = 64.8%)
    const goalieWidth = goalieHeight * 0.67; // Proporção do goleiro (2:3)
    
    // Exemplo: se stage tem 600px de altura:
    // - Agora: 600 * 0.648 = 388.8px de altura (reduzido de 432px)
    
    return { 
      width: `${goalieWidth}px`, 
      height: `${goalieHeight}px`,
      maxWidth: `${goalieWidth}px`,
      maxHeight: `${goalieHeight}px`
    };
  };

  // Calcular tamanhos da bola baseados no tamanho do stage (16:9)
  const getBallSize = () => {
    // Usar stageHeight como referência
    const baseSize = dimensions.stageHeight || 600; // Fallback para 600px
    
    // Bola ocupa aproximadamente 6-8% da altura do stage
    const ballSize = baseSize * 0.07; // 7% da altura do stage
    
    return { 
      width: `${ballSize}px`, 
      height: `${ballSize}px`,
      maxWidth: `${ballSize}px`,
      maxHeight: `${ballSize}px`
    };
  };

  return {
    dimensions,
    getGoalieSize,
    getBallSize,
    isMobile: dimensions.isMobile,
    isTablet: dimensions.isTablet,
    isDesktop: dimensions.isDesktop
  };
};

export default useGameResponsive;

