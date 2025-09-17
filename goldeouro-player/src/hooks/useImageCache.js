// Hook para Cache de Imagens - Gol de Ouro Player
import { useState, useEffect, useCallback } from 'react';

class ImageCache {
  constructor(maxSize = 50) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.accessOrder = [];
  }

  set(key, value) {
    // Se o cache está cheio, remove o item mais antigo
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.accessOrder.shift();
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, value);
    this.updateAccessOrder(key);
  }

  get(key) {
    const value = this.cache.get(key);
    if (value) {
      this.updateAccessOrder(key);
    }
    return value;
  }

  has(key) {
    return this.cache.has(key);
  }

  updateAccessOrder(key) {
    // Remove a chave da posição atual
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    // Adiciona no final (mais recente)
    this.accessOrder.push(key);
  }

  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  size() {
    return this.cache.size;
  }
}

// Instância global do cache
const imageCache = new ImageCache();

const useImageCache = () => {
  const [loadingImages, setLoadingImages] = useState(new Set());
  const [errorImages, setErrorImages] = useState(new Set());

  // Pré-carregar imagem
  const preloadImage = useCallback((src) => {
    return new Promise((resolve, reject) => {
      // Verificar se já está no cache
      if (imageCache.has(src)) {
        resolve(imageCache.get(src));
        return;
      }

      // Verificar se já está carregando
      if (loadingImages.has(src)) {
        // Aguardar o carregamento atual
        const checkLoading = () => {
          if (!loadingImages.has(src)) {
            if (imageCache.has(src)) {
              resolve(imageCache.get(src));
            } else {
              reject(new Error('Failed to load image'));
            }
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
        return;
      }

      // Verificar se já falhou
      if (errorImages.has(src)) {
        reject(new Error('Image previously failed to load'));
        return;
      }

      // Marcar como carregando
      setLoadingImages(prev => new Set(prev).add(src));

      const img = new Image();
      
      img.onload = () => {
        // Adicionar ao cache
        imageCache.set(src, {
          src,
          width: img.naturalWidth,
          height: img.naturalHeight,
          loaded: true,
          timestamp: Date.now()
        });

        // Remover da lista de carregamento
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });

        resolve(imageCache.get(src));
      };

      img.onerror = () => {
        // Marcar como erro
        setErrorImages(prev => new Set(prev).add(src));

        // Remover da lista de carregamento
        setLoadingImages(prev => {
          const newSet = new Set(prev);
          newSet.delete(src);
          return newSet;
        });

        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });
  }, [loadingImages]);

  // Carregar múltiplas imagens
  const preloadImages = useCallback(async (srcs) => {
    const promises = srcs.map(src => preloadImage(src).catch(error => ({ error, src })));
    const results = await Promise.all(promises);
    
    return results.map((result, index) => ({
      src: srcs[index],
      success: !result.error,
      error: result.error,
      data: result.error ? null : result
    }));
  }, [preloadImage]);

  // Verificar se imagem está no cache
  const isCached = useCallback((src) => {
    return imageCache.has(src);
  }, []);

  // Obter dados da imagem do cache
  const getCachedImage = useCallback((src) => {
    return imageCache.get(src);
  }, []);

  // Limpar cache
  const clearCache = useCallback(() => {
    imageCache.clear();
    setLoadingImages(new Set());
    setErrorImages(new Set());
  }, []);

  // Obter estatísticas do cache
  const getCacheStats = useCallback(() => {
    return {
      size: imageCache.size(),
      maxSize: imageCache.maxSize,
      loading: loadingImages.size,
      errors: errorImages.size
    };
  }, [loadingImages, errorImages]);

  // Pré-carregar imagens críticas
  const preloadCriticalImages = useCallback(async () => {
    const criticalImages = [
      '/images/Gol_de_Ouro_Bg01.jpg',
      '/images/logo.png',
      '/images/goalkeeper.png',
      '/images/ball.png'
    ];

    try {
      const results = await preloadImages(criticalImages);
      console.log('Imagens críticas carregadas:', results);
      return results;
    } catch (error) {
      console.error('Erro ao carregar imagens críticas:', error);
      return [];
    }
  }, [preloadImages]);

  // Hook para carregar imagem com estado
  const useImage = (src) => {
    const [imageData, setImageData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
      if (!src) return;

      // Verificar se já está no cache
      if (imageCache.has(src)) {
        setImageData(imageCache.get(src));
        return;
      }

      // Carregar imagem
      setIsLoading(true);
      setError(null);

      preloadImage(src)
        .then(data => {
          setImageData(data);
          setIsLoading(false);
        })
        .catch(err => {
          setError(err);
          setIsLoading(false);
        });
    }, [src, preloadImage]);

    return { imageData, isLoading, error };
  };

  return {
    preloadImage,
    preloadImages,
    preloadCriticalImages,
    isCached,
    getCachedImage,
    clearCache,
    getCacheStats,
    useImage,
    loadingImages: Array.from(loadingImages),
    errorImages: Array.from(errorImages)
  };
};

export default useImageCache;
