import { lazy } from 'react'

// Lazy imports para componentes grandes
export const LazyGameField = lazy(() => import('../components/GameField'))
export const LazyGameShoot = lazy(() => import('../pages/GameShoot'))
export const LazyDashboard = lazy(() => import('../pages/Dashboard'))
export const LazyProfile = lazy(() => import('../pages/Profile'))
export const LazyWithdraw = lazy(() => import('../pages/Withdraw'))
export const LazyAdmin = lazy(() => import('../pages/Admin'))

// Lazy imports para bibliotecas pesadas
export const LazyChart = lazy(() => import('react-chartjs-2'))
export const LazyDatePicker = lazy(() => import('react-datepicker'))
export const LazyModal = lazy(() => import('react-modal'))

// Função para carregar módulos sob demanda
export const loadModule = (moduleName) => {
  return import(`../modules/${moduleName}`)
}

// Função para pré-carregar módulos críticos
export const preloadCriticalModules = () => {
  const criticalModules = [
    '../components/GameField',
    '../pages/Game',
    '../hooks/useSimpleSound'
  ]

  criticalModules.forEach(module => {
    import(/* webpackChunkName: "critical" */ module)
  })
}

// Função para carregar módulos baseado em rota
export const loadRouteModule = (route) => {
  const routeModules = {
    '/game': () => import('../pages/Jogo'),
    '/dashboard': () => import('../pages/Dashboard'),
    '/profile': () => import('../pages/Profile'),
    '/withdraw': () => import('../pages/Withdraw'),
    '/admin': () => import('../pages/Admin')
  }

  return routeModules[route]?.() || Promise.resolve(null)
}

// Função para otimizar imports condicionais
export const conditionalImport = (condition, importFn) => {
  if (condition) {
    return importFn()
  }
  return Promise.resolve(null)
}

// Função para carregar assets baseado no viewport
export const loadViewportAssets = () => {
  const isMobile = window.innerWidth < 768
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024
  const isDesktop = window.innerWidth >= 1024

  if (isMobile) {
    import('../assets/mobile-optimized')
  } else if (isTablet) {
    import('../assets/tablet-optimized')
  } else {
    import('../assets/desktop-optimized')
  }
}

export default {
  LazyGameField,
  LazyGameShoot,
  LazyDashboard,
  LazyProfile,
  LazyWithdraw,
  LazyAdmin,
  LazyChart,
  LazyDatePicker,
  LazyModal,
  loadModule,
  preloadCriticalModules,
  loadRouteModule,
  conditionalImport,
  loadViewportAssets
}
