import { useState, useEffect, useRef, useCallback } from 'react';

// Hook para monitorar performance
export const usePerformance = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    fps: 0
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    const measurePerformance = () => {
      const now = performance.now();
      frameCount.current++;

      if (now - lastTime.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
        
        setMetrics(prev => ({
          ...prev,
          fps,
          memoryUsage: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0
        }));

        frameCount.current = 0;
        lastTime.current = now;
      }

      requestAnimationFrame(measurePerformance);
    };

    const rafId = requestAnimationFrame(measurePerformance);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return metrics;
};

// Hook para otimizar re-renders
export const useOptimizedCallback = (callback, deps) => {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  });

  return useCallback((...args) => {
    return callbackRef.current(...args);
  }, deps);
};

// Hook para virtualização de listas
export const useVirtualization = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll
  };
};

// Hook para cache de dados
export const useCache = (key, fetcher, ttl = 5 * 60 * 1000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheRef = useRef(new Map());

  const getCachedData = useCallback((cacheKey) => {
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    return null;
  }, [ttl]);

  const setCachedData = useCallback((cacheKey, data) => {
    cacheRef.current.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }, []);

  const fetchData = useCallback(async () => {
    const cached = getCachedData(key);
    if (cached) {
      setData(cached);
      return cached;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      setData(result);
      setCachedData(key, result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, getCachedData, setCachedData]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    data,
    loading,
    error,
    fetchData,
    clearCache
  };
};

// Hook para debounce de API calls
export const useDebouncedAPI = (apiCall, delay = 500) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timeoutRef = useRef();

  const debouncedCall = useCallback(async (...args) => {
    clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await apiCall(...args);
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }, delay);
  }, [apiCall, delay]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return {
    data,
    loading,
    error,
    debouncedCall
  };
};

// Hook para otimizar animações
export const useOptimizedAnimation = (isActive, duration = 300) => {
  const [shouldRender, setShouldRender] = useState(isActive);
  const timeoutRef = useRef();

  useEffect(() => {
    if (isActive) {
      setShouldRender(true);
    } else {
      timeoutRef.current = setTimeout(() => {
        setShouldRender(false);
      }, duration);
    }

    return () => clearTimeout(timeoutRef.current);
  }, [isActive, duration]);

  return shouldRender;
};
