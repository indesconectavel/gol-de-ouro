// Hook para Otimização de Performance - Gol de Ouro Player
import { useState, useEffect, useCallback, useRef } from 'react';

const usePerformance = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    fps: 0,
    isSlowConnection: false,
    isLowEndDevice: false
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const animationId = useRef(null);

  // Detectar conexão lenta
  const detectSlowConnection = useCallback(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      const slowConnections = ['slow-2g', '2g', '3g'];
      return slowConnections.includes(connection.effectiveType);
    }
    return false;
  }, []);

  // Detectar dispositivo de baixo desempenho
  const detectLowEndDevice = useCallback(() => {
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const memory = navigator.deviceMemory || 4;
    const cores = hardwareConcurrency <= 2;
    const lowMemory = memory <= 2;
    
    return cores || lowMemory;
  }, []);

  // Medir FPS
  const measureFPS = useCallback(() => {
    const now = performance.now();
    frameCount.current++;

    if (now - lastTime.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
      
      setMetrics(prev => ({
        ...prev,
        fps
      }));

      frameCount.current = 0;
      lastTime.current = now;
    }

    animationId.current = requestAnimationFrame(measureFPS);
  }, []);

  // Medir uso de memória
  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = performance.memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
      
      setMetrics(prev => ({
        ...prev,
        memoryUsage: usedMB
      }));
    }
  }, []);

  // Debounce para otimizar re-renders
  const useDebounce = useCallback((value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  }, []);

  // Throttle para otimizar eventos
  const useThrottle = useCallback((callback, delay) => {
    const lastRun = useRef(Date.now());

    return useCallback((...args) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args);
        lastRun.current = Date.now();
      }
    }, [callback, delay]);
  }, []);

  // Lazy loading de componentes
  const useLazyComponent = useCallback((importFunc, deps = []) => {
    const [Component, setComponent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
      let isMounted = true;

      const loadComponent = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          const module = await importFunc();
          
          if (isMounted) {
            setComponent(() => module.default);
            setIsLoading(false);
          }
        } catch (err) {
          if (isMounted) {
            setError(err);
            setIsLoading(false);
          }
        }
      };

      loadComponent();

      return () => {
        isMounted = false;
      };
    }, deps);

    return { Component, isLoading, error };
  }, []);

  // Memoização de cálculos pesados
  const useMemoizedCallback = useCallback((callback, deps) => {
    const memoizedCallback = useRef();
    const depsRef = useRef(deps);

    if (!memoizedCallback.current || 
        depsRef.current.length !== deps.length ||
        depsRef.current.some((dep, index) => dep !== deps[index])) {
      memoizedCallback.current = callback;
      depsRef.current = deps;
    }

    return memoizedCallback.current;
  }, []);

  // Otimização de scroll
  const useOptimizedScroll = useCallback((callback, delay = 16) => {
    const ticking = useRef(false);

    const optimizedCallback = useCallback((event) => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          callback(event);
          ticking.current = false;
        });
        ticking.current = true;
      }
    }, [callback]);

    return optimizedCallback;
  }, []);

  // Preload de recursos críticos
  const preloadCriticalResources = useCallback(async () => {
    const criticalResources = [
      '/images/Gol_de_Ouro_Bg01.jpg',
      '/images/logo.png',
      '/images/goalkeeper.png',
      '/images/ball.png'
    ];

    const preloadPromises = criticalResources.map(src => {
      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        link.onload = () => resolve(src);
        link.onerror = () => reject(new Error(`Failed to preload ${src}`));
        document.head.appendChild(link);
      });
    });

    try {
      await Promise.all(preloadPromises);
      console.log('Recursos críticos pré-carregados');
    } catch (error) {
      console.warn('Erro ao pré-carregar recursos:', error);
    }
  }, []);

  // Inicializar métricas
  useEffect(() => {
    setMetrics(prev => ({
      ...prev,
      isSlowConnection: detectSlowConnection(),
      isLowEndDevice: detectLowEndDevice()
    }));

    // Iniciar medição de FPS
    measureFPS();

    // Medir memória a cada 5 segundos
    const memoryInterval = setInterval(measureMemory, 5000);

    // Pré-carregar recursos críticos
    preloadCriticalResources();

    return () => {
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
      clearInterval(memoryInterval);
    };
  }, [detectSlowConnection, detectLowEndDevice, measureFPS, measureMemory, preloadCriticalResources]);

  // Otimizações baseadas no dispositivo
  const getOptimizations = useCallback(() => {
    const { isSlowConnection, isLowEndDevice, fps, memoryUsage } = metrics;

    return {
      // Reduzir qualidade de imagens em conexões lentas
      imageQuality: isSlowConnection ? 'low' : 'high',
      
      // Reduzir animações em dispositivos de baixo desempenho
      animations: isLowEndDevice ? 'reduced' : 'full',
      
      // Ajustar frequência de atualizações
      updateFrequency: fps < 30 ? 'low' : 'high',
      
      // Gerenciar cache baseado na memória
      cacheSize: memoryUsage > 100 ? 'small' : 'large',
      
      // Lazy loading mais agressivo
      lazyLoading: isSlowConnection || isLowEndDevice ? 'aggressive' : 'normal'
    };
  }, [metrics]);

  // Limpar recursos não utilizados
  const cleanup = useCallback(() => {
    // Limpar event listeners
    window.removeEventListener('scroll', () => {});
    window.removeEventListener('resize', () => {});
    
    // Limpar timeouts
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }
    
    // Limpar intervals
    const highestIntervalId = setInterval(() => {}, 0);
    for (let i = 0; i < highestIntervalId; i++) {
      clearInterval(i);
    }
    
    // Forçar garbage collection se disponível
    if (window.gc) {
      window.gc();
    }
  }, []);

  return {
    metrics,
    useDebounce,
    useThrottle,
    useLazyComponent,
    useMemoizedCallback,
    useOptimizedScroll,
    preloadCriticalResources,
    getOptimizations,
    cleanup
  };
};

export default usePerformance;
