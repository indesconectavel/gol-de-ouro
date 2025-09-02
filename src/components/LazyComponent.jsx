import React, { Suspense, lazy } from 'react';
import { LoadingComplete } from './LoadingAnimations';
import { useLazyLoad } from '../hooks/useLazyLoad';

// Componente para lazy loading com suspense
export const LazyComponent = ({ 
  component: Component, 
  fallback = null,
  loadingText = "Carregando...",
  ...props 
}) => {
  return (
    <Suspense fallback={fallback || <LoadingComplete text={loadingText} />}>
      <Component {...props} />
    </Suspense>
  );
};

// Componente para lazy loading de imagens
export const LazyImage = ({ 
  src, 
  alt, 
  placeholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PC9zdmc+",
  className = "",
  ...props 
}) => {
  const [imageSrc, setImageSrc] = React.useState(placeholder);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!src) return;

    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    img.src = src;
  }, [src]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={`${className} ${!isLoaded ? 'animate-pulse' : ''}`}
      {...props}
    />
  );
};

// Componente para lazy loading de seções
export const LazySection = ({ 
  children, 
  threshold = 0.1,
  fallback = null,
  className = ""
}) => {
  const [ref, isVisible] = useLazyLoad(threshold);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (fallback || <LoadingComplete text="Carregando seção..." />)}
    </div>
  );
};

// Função para criar componentes lazy
export const createLazyComponent = (importFunc, fallback = null) => {
  const LazyComponent = lazy(importFunc);
  
  return (props) => (
    <Suspense fallback={fallback || <LoadingComplete text="Carregando componente..." />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};
