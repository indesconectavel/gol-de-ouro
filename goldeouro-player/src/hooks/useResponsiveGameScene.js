import { useEffect, useState } from 'react';
import { getConfigForWidth, gameSceneConfig } from '../config/gameSceneConfig';

/**
 * Hook para gerenciar o carregamento dinâmico de arquivos CSS
 * baseado na resolução da tela
 */
export const useResponsiveGameScene = () => {
  const [currentResolution, setCurrentResolution] = useState('mobile');
  const [isLoading, setIsLoading] = useState(true);
  const [currentConfig, setCurrentConfig] = useState(gameSceneConfig.mobile);

  useEffect(() => {
    const loadResponsiveCSS = () => {
      // Remove CSS anterior se existir
      const existingLink = document.getElementById('responsive-game-scene-css');
      if (existingLink) {
        existingLink.remove();
      }

      // Determina a resolução atual
      const width = window.innerWidth;
      let resolution = 'mobile';
      
      if (width >= 1024) {
        resolution = 'desktop';
      } else if (width >= 768) {
        resolution = 'tablet';
      }

      setCurrentResolution(resolution);
      setCurrentConfig(gameSceneConfig[resolution]);

      // Carrega o CSS apropriado
      const link = document.createElement('link');
      link.id = 'responsive-game-scene-css';
      link.rel = 'stylesheet';
      link.type = 'text/css';
      link.href = `/src/pages/game-scene-${resolution}.css`;
      
      link.onload = () => {
        setIsLoading(false);
        console.log(`✅ CSS ${resolution} carregado com sucesso`);
        console.log(`📊 Configuração:`, gameSceneConfig[resolution]);
      };
      
      link.onerror = () => {
        console.error(`❌ Erro ao carregar CSS ${resolution}`);
        setIsLoading(false);
      };

      document.head.appendChild(link);
    };

    // Carrega CSS inicial
    loadResponsiveCSS();

    // Listener para mudanças de resolução
    const handleResize = () => {
      loadResponsiveCSS();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      const existingLink = document.getElementById('responsive-game-scene-css');
      if (existingLink) {
        existingLink.remove();
      }
    };
  }, []);

  return {
    currentResolution,
    isLoading,
    currentConfig,
    isMobile: currentResolution === 'mobile',
    isTablet: currentResolution === 'tablet',
    isDesktop: currentResolution === 'desktop'
  };
};
