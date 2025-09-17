// Componente de Lazy Loading - Gol de Ouro Player
import React, { Suspense, lazy, useState, useEffect } from 'react';

// Componente de Loading personalizado
const LoadingSpinner = ({ message = 'Carregando...' }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
    <div className="relative">
      {/* Spinner animado */}
      <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
      
      {/* Bola de futebol no centro */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl animate-bounce">⚽</span>
      </div>
    </div>
    
    <p className="mt-4 text-white text-lg font-medium">{message}</p>
    
    {/* Barra de progresso */}
    <div className="w-64 h-1 bg-gray-700 rounded-full mt-4 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full animate-pulse"></div>
    </div>
  </div>
);

// Componente de erro
const ErrorFallback = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
    <div className="text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h2 className="text-2xl font-bold mb-2">Ops! Algo deu errado</h2>
      <p className="text-gray-400 mb-6">Não foi possível carregar esta página</p>
      
      <button
        onClick={retry}
        className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors"
      >
        Tentar Novamente
      </button>
    </div>
  </div>
);

// Hook para lazy loading com retry
const useLazyComponent = (importFunc, fallback = null) => {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
  }, [importFunc]);

  const retry = () => {
    setError(null);
    setIsLoading(true);
    setComponent(null);
  };

  return { Component, error, isLoading, retry };
};

// Wrapper principal para lazy loading
const LazyWrapper = ({ 
  children, 
  fallback = null, 
  errorFallback = null,
  loadingMessage = 'Carregando...',
  delay = 0 
}) => {
  const [showContent, setShowContent] = useState(delay === 0);

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setShowContent(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [delay]);

  if (!showContent) {
    return fallback || <LoadingSpinner message={loadingMessage} />;
  }

  return (
    <Suspense fallback={fallback || <LoadingSpinner message={loadingMessage} />}>
      {children}
    </Suspense>
  );
};

// Hook para lazy loading de páginas
export const useLazyPage = (importFunc, options = {}) => {
  const {
    fallback = null,
    errorFallback = null,
    loadingMessage = 'Carregando página...',
    delay = 0
  } = options;

  const { Component, error, isLoading, retry } = useLazyComponent(importFunc, fallback);

  if (error) {
    return {
      Component: () => errorFallback || <ErrorFallback error={error} retry={retry} />,
      isLoading: false,
      error,
      retry
    };
  }

  if (isLoading) {
    return {
      Component: () => fallback || <LoadingSpinner message={loadingMessage} />,
      isLoading: true,
      error: null,
      retry
    };
  }

  return {
    Component: Component || (() => fallback || <LoadingSpinner message={loadingMessage} />),
    isLoading: false,
    error: null,
    retry
  };
};

// Componente de lazy loading para imagens
export const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  onLoad = null,
  onError = null,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      onLoad && onLoad();
    };
    
    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      onError && onError();
    };
    
    img.src = src;
  }, [src, onLoad, onError]);

  if (hasError) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-700 text-gray-400`}>
        <span className="text-2xl">🖼️</span>
      </div>
    );
  }

  return (
    <div className={`${className} relative overflow-hidden`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
          <div className="w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      <img
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        {...props}
      />
    </div>
  );
};

// Componente de lazy loading para componentes
export const LazyComponent = ({ 
  importFunc, 
  fallback = null,
  errorFallback = null,
  loadingMessage = 'Carregando componente...',
  ...props 
}) => {
  const { Component, error, isLoading, retry } = useLazyComponent(importFunc, fallback);

  if (error) {
    return errorFallback || <ErrorFallback error={error} retry={retry} />;
  }

  if (isLoading) {
    return fallback || <LoadingSpinner message={loadingMessage} />;
  }

  return Component ? <Component {...props} /> : null;
};

export default LazyWrapper;
